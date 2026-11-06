import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BASE_WEAPONS,
  ENEMY_CONFIGS,
  WeaponStats,
  calculatePlayerDamage,
  calculateEnemyDamage,
  calculateExplosionDamage,
  generateWaveConfig,
  isEntityOnJumpPad,
  canMeleeAttackTarget,
} from './rules';
import { soundEngine } from './audio';
import { buildWeaponViewModel, buildEnemyModel, buildJumpPad, buildPickupModel } from './voxelModels';
import { buildVoxelArena, ArenaData, CollisionBox } from './arenaMap';
import { VoxelParticlePool } from './particleSystem';
import { CharacterPartConfig, getActiveSkin } from './characterConfig';

export interface GameEngineState {
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  score: number;
  coins: number;
  wave: number;
  waveName: string;
  enemiesRemaining: number;
  totalWaveEnemies: number;
  currentWeaponId: string;
  weapons: Record<string, WeaponStats>;
  ammoInClip: number;
  reserveAmmo: number;
  isReloading: boolean;
  isScoped: boolean;
  isMuted: boolean;
  isPointerLocked: boolean;
  hitmarkerTime: number; // timestamp of last hit
  isCritHit: boolean;
  damageFlashTime: number; // timestamp of last player hurt
  damageAngle: number; // relative threat angle in degrees (-180 to 180) from screen forward
}

export type StateListener = (state: GameEngineState) => void;
export type GameOverListener = (won: boolean, stats: { score: number; wave: number; kills: number; coins: number }) => void;

interface ActiveEnemy {
  id: number;
  type: string;
  group: THREE.Group;
  head: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  torso: THREE.Mesh;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  attackTimer: number;
  telegraphTimer: number;
  walkCycle: number;
  isDying: boolean;
  deathTimer: number;
}

interface ActiveRocket {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface ActiveEnemyProjectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  damage: number;
  life: number;
  maxLife: number;
  type: 'bullet' | 'laser';
}

interface ActivePickup {
  mesh: THREE.Group;
  type: 'health' | 'armor' | 'ammo' | 'coin';
  x: number;
  y: number;
  z: number;
  respawnTimer: number;
}

export class VoxelGunEngine {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private arenaData!: ArenaData;
  private particlePool!: VoxelParticlePool;
  private isSoftwareGl: boolean = false;

  // Player state
  private playerPos = new THREE.Vector3(0, 1.8, 14); // open path facing North tower
  private playerVelocity = new THREE.Vector3();
  private playerYaw: number = 0;
  private playerPitch: number = 0;
  private isGrounded: boolean = true;
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private walkDistance: number = 0;
  private trauma: number = 0;
  private hitstopTimer: number = 0;
  private touchMoveVector = { x: 0, y: 0 };

  // Stats & Inventory
  private hp: number = 100;
  private maxHp: number = 100;
  private armor: number = 50;
  private maxArmor: number = 100;
  private score: number = 0;
  private coins: number = 100; // starter coins for armory!
  private kills: number = 0;
  private wave: number = 1;
  private waveName: string = 'WAVE 1';
  private enemiesRemaining: number = 0;
  private totalWaveEnemies: number = 0;
  private playerSkin: CharacterPartConfig = getActiveSkin();
  private weapons: Record<string, WeaponStats> = JSON.parse(JSON.stringify(BASE_WEAPONS));
  private currentWeaponId: string = 'pixel_ak47';
  private ammoInClip: Record<string, number> = {};
  private reserveAmmo: Record<string, number> = {};
  private shootCooldown: number = 0;
  private reloadTimer: number = 0;
  private isScoped: boolean = false;
  private hitmarkerTimer: number = 0;
  private isCritHit: boolean = false;
  private damageFlashTimer: number = 0;
  private lastDamageTimestamp: number = 0;

  // Viewmodel
  private weaponViewModelGroup = new THREE.Group();
  private currentViewModel: THREE.Group | null = null;
  private muzzleFlashLight!: THREE.PointLight;
  private recoilOffset = new THREE.Vector3();
  private recoilRot = new THREE.Vector3();

  // Entities
  private enemies: ActiveEnemy[] = [];
  private rockets: ActiveRocket[] = [];
  private enemyProjectiles: ActiveEnemyProjectile[] = [];
  private pickups: ActivePickup[] = [];
  private jumpPadMeshes: THREE.Group[] = [];
  private nextEnemyId = 1;
  private waveSpawnQueue: string[] = [];
  private waveSpawnInterval = 0;
  private lastDamageAngle = 0;

  // Collision & Line of Sight Caches
  private tempBox = new THREE.Box3();
  private tempRay = new THREE.Ray();
  private tempIntersect = new THREE.Vector3();

  // Inputs
  private keysHeld = new Set<string>();
  private isShootingHeld = false;
  private isPointerLocked = false;
  private running = false;
  private animationFrameId = 0;
  private lastTime = 0;

  // Listeners
  private stateListener: StateListener | null = null;
  private gameOverListener: GameOverListener | null = null;
  private stateDirty = true;
  private lastStateSyncTime = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initAmmo();
    this.initThree();
    this.initArena();
    this.initWeaponViewModel();
    this.initPickups();
    this.initJumpPads();
    this.setupEventListeners();
  }

  private initAmmo() {
    for (const [id, w] of Object.entries(this.weapons)) {
      this.ammoInClip[id] = w.magSize;
      this.reserveAmmo[id] = w.magSize * 4;
    }
  }

  private initThree() {
    // 1. Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    this.container.appendChild(this.renderer.domElement);

    // 3. Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a2130);
    this.scene.fog = new THREE.FogExp2(0x1a2130, 0.014);

    // 4. Camera (strict YXZ FPS Euler order: yaw around Y, pitch around X, zero tilt roll)
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.05, 300);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.copy(this.playerPos);
    this.scene.add(this.camera);

    // 5. Studio Environment Map (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Lighting (Warm Key + Cool Fill)
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(30, 45, 20);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    const d = 36;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 5;
    keyLight.shadow.camera.far = 100;
    this.scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x374151, 1.2);
    this.scene.add(hemiLight);

    // Muzzle flash point light attached to camera
    this.muzzleFlashLight = new THREE.PointLight(0xffd166, 0, 10);
    this.muzzleFlashLight.position.set(0.3, -0.1, -0.9);
    this.camera.add(this.muzzleFlashLight);

    // Pooled particle system
    this.particlePool = new VoxelParticlePool(this.scene);
  }

  private initArena() {
    this.arenaData = buildVoxelArena();
    this.scene.add(this.arenaData.group);
  }

  private initWeaponViewModel() {
    this.camera.add(this.weaponViewModelGroup);
    this.switchWeapon(this.currentWeaponId);
  }

  private initPickups() {
    for (const s of this.arenaData.pickupSpawns) {
      const mesh = buildPickupModel(s.type);
      mesh.position.set(s.x, s.y, s.z);
      this.scene.add(mesh);
      this.pickups.push({
        mesh,
        type: s.type,
        x: s.x,
        y: s.y,
        z: s.z,
        respawnTimer: 0,
      });
    }
  }

  private initJumpPads() {
    for (const pad of this.arenaData.jumpPads) {
      const mesh = buildJumpPad();
      mesh.position.set(pad.x, pad.y, pad.z);
      this.scene.add(mesh);
      this.jumpPadMeshes.push(mesh);
    }
  }

  public setCallbacks(stateCb: StateListener, gameOverCb: GameOverListener) {
    this.stateListener = stateCb;
    this.gameOverListener = gameOverCb;
  }

  public start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.startWave(this.wave);

    const tick = (now: number) => {
      if (!this.running) return;
      const rawDt = (now - this.lastTime) / 1000;
      this.lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.render();

      if (this.isSoftwareGl) {
        this.afterDraw(() => {
          this.animationFrameId = requestAnimationFrame(tick);
        });
      } else {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        setTimeout(cb, 40);
      }
    };
    setTimeout(poll, 5);
  }

  public stop() {
    this.running = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  // ==========================================
  // INPUT HANDLING
  // ==========================================

  private setupEventListeners() {
    const canvas = this.renderer.domElement;
    let isMouseDown = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Pointer Lock click on canvas
    const requestLock = () => {
      if (!this.isPointerLocked) {
        try {
          canvas.requestPointerLock?.();
        } catch {
          // Some sandboxed iframes disallow pointer lock; drag-to-aim handles this gracefully
        }
      }
    };

    canvas.addEventListener('click', requestLock);

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
      this.stateDirty = true;
    });

    // Mouse movement (supports both pointer lock AND seamless drag-to-aim fallback)
    window.addEventListener('mousemove', (e) => {
      const sensitivity = this.isScoped ? 0.0012 : 0.0024;
      if (this.isPointerLocked) {
        this.playerYaw -= e.movementX * sensitivity;
        this.playerPitch -= e.movementY * sensitivity;
      } else if (isMouseDown) {
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        this.playerYaw -= dx * sensitivity;
        this.playerPitch -= dy * sensitivity;
      }
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      // Clamp pitch to avoid gimbal flip (-85° to +85°)
      this.playerPitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.playerPitch));
    });

    // Keys
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      this.keysHeld.add(key);

      // Weapon slots 1 - 7
      if (key === '1') this.switchWeapon('combat_knife');
      if (key === '2') this.switchWeapon('pixel_pistol');
      if (key === '3') this.switchWeapon('pixel_ak47');
      if (key === '4') this.switchWeapon('pixel_shotgun');
      if (key === '5') this.switchWeapon('pixel_sniper');
      if (key === '6') this.switchWeapon('rocket_jumper');
      if (key === '7') this.switchWeapon('prototype_laser');

      if (key === ' ' || key === 'space') {
        this.jumpBufferTimer = 0.12; // jump buffering
      }

      if (key === 'r') {
        this.reload();
      }

      if (key === 'm') {
        soundEngine.toggleMute();
        this.stateDirty = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keysHeld.delete(key);
    });

    // Mouse buttons
    window.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      if (!this.isPointerLocked && (e.target === canvas || (e.target as HTMLElement)?.tagName === 'CANVAS')) {
        requestLock();
      }

      if (e.button === 0) {
        this.isShootingHeld = true;
        this.tryShoot();
      } else if (e.button === 2) {
        // Toggle scope
        e.preventDefault();
        this.toggleScope();
      }
    });

    window.addEventListener('mouseup', (e) => {
      isMouseDown = false;
      if (e.button === 0) {
        this.isShootingHeld = false;
      }
    });

    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Clear held keys and drag state on blur
    window.addEventListener('blur', () => {
      isMouseDown = false;
      this.keysHeld.clear();
      this.isShootingHeld = false;
    });

    // Resize
    window.addEventListener('resize', () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  // ==========================================
  // WEAPON MANAGEMENT
  // ==========================================

  public switchWeapon(id: string) {
    if (!this.weapons[id] || !this.weapons[id].unlocked) return;
    this.currentWeaponId = id;
    this.isScoped = false;
    this.camera.fov = 75;
    this.camera.updateProjectionMatrix();
    this.weaponViewModelGroup.visible = true;

    if (this.currentViewModel) {
      this.weaponViewModelGroup.remove(this.currentViewModel);
    }
    this.currentViewModel = buildWeaponViewModel(
      id,
      this.playerSkin.armsColor,
      this.playerSkin.glovesColor
    );
    this.weaponViewModelGroup.add(this.currentViewModel);
    this.stateDirty = true;
  }

  public setPlayerSkin(skin: CharacterPartConfig) {
    this.playerSkin = skin;
    this.switchWeapon(this.currentWeaponId);
  }

  public toggleScope() {
    const weapon = this.weapons[this.currentWeaponId];
    if (weapon.category !== 'sniper') return;
    this.isScoped = !this.isScoped;
    this.camera.fov = this.isScoped ? 32 : 75;
    this.camera.updateProjectionMatrix();
    this.weaponViewModelGroup.visible = !this.isScoped;
    this.stateDirty = true;
  }

  public reload() {
    const weapon = this.weapons[this.currentWeaponId];
    if (weapon.category === 'melee' || this.reloadTimer > 0) return;
    const clip = this.ammoInClip[this.currentWeaponId] || 0;
    const reserve = this.reserveAmmo[this.currentWeaponId] || 0;
    if (clip >= weapon.magSize || reserve <= 0) return;

    this.reloadTimer = weapon.reloadTime;
    soundEngine.playReload();
    this.stateDirty = true;
  }

  // ==========================================
  // MOBILE TOUCH CONTROLS
  // ==========================================

  public setTouchMove(x: number, y: number) {
    this.touchMoveVector.x = Math.max(-1, Math.min(1, x));
    this.touchMoveVector.y = Math.max(-1, Math.min(1, y));
  }

  public setTouchLookDelta(deltaYaw: number, deltaPitch: number) {
    this.playerYaw += deltaYaw;
    this.playerPitch += deltaPitch;
    this.playerPitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.playerPitch));
  }

  public setShooting(shooting: boolean) {
    this.isShootingHeld = shooting;
    if (shooting) {
      this.tryShoot();
    }
  }

  public triggerJump() {
    this.jumpBufferTimer = 0.12;
  }

  public tryShoot() {
    if (this.shootCooldown > 0 || this.reloadTimer > 0) return;

    const weapon = this.weapons[this.currentWeaponId];
    const isMelee = weapon.category === 'melee';

    if (!isMelee) {
      const clip = this.ammoInClip[this.currentWeaponId] || 0;
      if (clip <= 0) {
        soundEngine.playEmptyClip();
        this.reload();
        return;
      }
      this.ammoInClip[this.currentWeaponId]--;
    }

    this.shootCooldown = 1 / weapon.fireRate;
    soundEngine.playShoot(weapon.id);

    // Muzzle flash & recoil
    this.muzzleFlashLight.intensity = 3.5;
    this.recoilOffset.z = 0.12;
    this.recoilRot.x = 0.08;

    if (weapon.isExplosive) {
      this.fireRocket();
    } else {
      this.fireHitscan(weapon);
    }

    this.stateDirty = true;
  }

  private fireHitscan(weapon: WeaponStats) {
    const pellets = weapon.pellets || 1;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);

    for (let p = 0; p < pellets; p++) {
      const spreadDir = forward.clone();
      if (weapon.spread > 0) {
        spreadDir.x += (Math.random() - 0.5) * weapon.spread * 2;
        spreadDir.y += (Math.random() - 0.5) * weapon.spread * 2;
        spreadDir.z += (Math.random() - 0.5) * weapon.spread * 2;
        spreadDir.normalize();
      }

      // Raycast against enemies
      const ray = new THREE.Ray(this.camera.position, spreadDir);
      let closestDist = weapon.range;
      let hitEnemy: ActiveEnemy | null = null;
      let isHeadshot = false;

      for (const enemy of this.enemies) {
        if (enemy.isDying) continue;
        const ePos = enemy.group.position;
        // Bounding sphere check
        const sphere = new THREE.Sphere(new THREE.Vector3(ePos.x, ePos.y + 1.2, ePos.z), 1.2);
        const intersect = ray.intersectSphere(sphere, new THREE.Vector3());
        if (intersect) {
          const d = this.camera.position.distanceTo(intersect);
          if (d < closestDist) {
            closestDist = d;
            hitEnemy = enemy;
            // Check if hit point was near head height
            isHeadshot = intersect.y >= ePos.y + 1.55;
          }
        }
      }

      if (hitEnemy) {
        const { damage, isCrit } = calculateEnemyDamage(weapon.damage, isHeadshot, weapon.level);
        this.damageEnemy(hitEnemy, damage, isCrit, spreadDir);

        // Voxel block debris particles at impact
        const hitPoint = this.camera.position.clone().addScaledVector(spreadDir, closestDist);
        const bloodColor = hitEnemy.type === 'swarmer_zombie' ? 0x4d7c38 : hitEnemy.type === 'heavy_golem' ? 0xea580c : 0xef4444;
        this.particlePool.emitBurst(hitPoint.x, hitPoint.y, hitPoint.z, 8, bloodColor, 1.2);
      } else {
        // Wall spark
        const hitPoint = this.camera.position.clone().addScaledVector(spreadDir, Math.min(closestDist, 40));
        this.particlePool.emitBurst(hitPoint.x, hitPoint.y, hitPoint.z, 4, 0xfacc15, 0.8, 0.14);
      }
    }
  }

  private fireRocket() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    // Build physical voxel rocket mesh
    const rocketMesh = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.8 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.6), bodyMat);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.2), tipMat);
    t.position.z = -0.35;
    rocketMesh.add(b);
    rocketMesh.add(t);

    const spawnPos = this.camera.position.clone().addScaledVector(dir, 0.8);
    rocketMesh.position.copy(spawnPos);
    rocketMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
    this.scene.add(rocketMesh);

    const rocketSpd = 32;
    this.rockets.push({
      mesh: rocketMesh,
      velocity: dir.clone().multiplyScalar(rocketSpd),
      life: 0,
      maxLife: 4.0,
    });
  }

  private explodeRocket(pos: THREE.Vector3) {
    soundEngine.playExplosion();
    this.trauma = Math.min(1.0, this.trauma + 0.6); // decaying camera shake

    // Fiery voxel particles
    this.particlePool.emitBurst(pos.x, pos.y, pos.z, 28, 0xf97316, 2.0, 0.35);
    this.particlePool.emitBurst(pos.x, pos.y, pos.z, 14, 0xfacc15, 1.6, 0.25);

    const radius = 6.0;
    const maxDamage = 130;

    // Check damage to enemies
    for (const enemy of this.enemies) {
      if (enemy.isDying) continue;
      const { damage, impulse } = calculateExplosionDamage(pos, enemy.group.position, maxDamage, radius);
      if (damage > 0) {
        this.damageEnemy(enemy, damage, false, new THREE.Vector3(impulse.x, impulse.y, impulse.z).normalize());
      }
    }

    // Rocket jumping for player!
    const { damage: playerSelfDamage, impulse: playerImpulse } = calculateExplosionDamage(pos, this.playerPos, 50, radius);
    if (playerImpulse.y > 0) {
      // Self damage is mitigated for fun rocket jumping!
      this.takePlayerDamage(Math.round(playerSelfDamage * 0.25));
      this.playerVelocity.x += playerImpulse.x * 1.3;
      this.playerVelocity.y = Math.max(this.playerVelocity.y, playerImpulse.y * 1.5 + 4.0); // launch skyward!
      this.playerVelocity.z += playerImpulse.z * 1.3;
      this.isGrounded = false;
      soundEngine.playRocketJump();
    }
  }

  private damageEnemy(enemy: ActiveEnemy, amount: number, isCrit: boolean, knockbackDir?: THREE.Vector3) {
    enemy.hp -= amount;
    this.hitmarkerTimer = 0.15;
    this.isCritHit = isCrit;
    soundEngine.playHitmarker(isCrit);

    if (knockbackDir) {
      enemy.group.position.addScaledVector(knockbackDir, 0.4);
    }

    // Emissive hit flash
    enemy.torso.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xffffff);
        (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
      }
    });
    setTimeout(() => {
      if (enemy.torso) {
        enemy.torso.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            (child.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x000000);
            (child.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
          }
        });
      }
    }, 60);

    if (enemy.hp <= 0 && !enemy.isDying) {
      this.killEnemy(enemy);
    }

    this.stateDirty = true;
  }

  private killEnemy(enemy: ActiveEnemy) {
    enemy.isDying = true;
    enemy.deathTimer = 0.35;
    this.kills++;
    const cfg = ENEMY_CONFIGS[enemy.type] || ENEMY_CONFIGS.swarmer_zombie;
    this.score += cfg.scoreValue;
    this.coins += cfg.coinValue;

    // Simulation hitstop (freeze physics for 0.05s on heavy kill)
    this.hitstopTimer = 0.05;

    // Topple rotation
    enemy.group.rotation.x = -Math.PI / 2.2;
    enemy.group.position.y = 0.3;

    // Voxel cube chunk burst
    this.particlePool.emitBurst(
      enemy.group.position.x,
      enemy.group.position.y + 0.8,
      enemy.group.position.z,
      18,
      0x22c55e,
      1.5,
      0.28
    );

    this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);
    if (this.enemiesRemaining <= 0 && this.waveSpawnQueue.length === 0) {
      this.onWaveCleared();
    }
    this.stateDirty = true;
  }

  private takePlayerDamage(amount: number, sourcePos?: THREE.Vector3) {
    if (this.hp <= 0) return;
    const { finalHp, finalArmor } = calculatePlayerDamage(amount, this.hp, this.armor);
    this.hp = finalHp;
    this.armor = finalArmor;
    this.lastDamageTimestamp = performance.now();
    this.damageFlashTimer = 0.55;
    this.trauma = Math.min(1.0, this.trauma + 0.35);
    soundEngine.playPlayerHurt();

    // Directional damage threat calculation relative to camera yaw
    if (sourcePos) {
      const dx = sourcePos.x - this.playerPos.x;
      const dz = sourcePos.z - this.playerPos.z;
      if (dx * dx + dz * dz > 0.04) {
        const fwdX = -Math.sin(this.playerYaw);
        const fwdZ = -Math.cos(this.playerYaw);
        const rightX = Math.cos(this.playerYaw);
        const rightZ = -Math.sin(this.playerYaw);

        const dotFwd = fwdX * dx + fwdZ * dz;
        const dotRight = rightX * dx + rightZ * dz;
        this.lastDamageAngle = (Math.atan2(dotRight, dotFwd) * 180) / Math.PI;
      }
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.onPlayerDefeat();
    }
    this.stateDirty = true;
  }

  private onPlayerDefeat() {
    soundEngine.playGameOver();
    if (this.gameOverListener) {
      this.gameOverListener(false, {
        score: this.score,
        wave: this.wave,
        kills: this.kills,
        coins: this.coins,
      });
    }
  }

  private onWaveCleared() {
    soundEngine.playVictory();
    this.score += 500 * this.wave;
    this.coins += 100 * this.wave;

    setTimeout(() => {
      if (this.hp > 0 && this.running) {
        this.wave++;
        this.startWave(this.wave);
      }
    }, 2500);
  }

  public startWave(waveNum: number) {
    this.wave = waveNum;
    const cfg = generateWaveConfig(waveNum);
    this.waveName = cfg.waveName;
    this.totalWaveEnemies = cfg.totalEnemies;
    this.enemiesRemaining = cfg.totalEnemies;

    this.waveSpawnQueue = [];
    for (const item of cfg.types) {
      for (let i = 0; i < item.count; i++) {
        this.waveSpawnQueue.push(item.type);
      }
    }
    // Shuffle
    this.waveSpawnQueue.sort(() => Math.random() - 0.5);
    this.waveSpawnInterval = 0.2;
    this.stateDirty = true;
  }

  private spawnNextEnemy() {
    if (this.waveSpawnQueue.length === 0) return;
    const type = this.waveSpawnQueue.pop()!;

    // Select a spawn point not right on top of the player
    const validPts = this.arenaData.spawnPoints.filter(
      (pt) => pt.distanceTo(this.playerPos) >= 7.0
    );
    const pool = validPts.length > 0 ? validPts : this.arenaData.spawnPoints;
    const spawnPt = pool[Math.floor(Math.random() * pool.length)];

    const model = buildEnemyModel(type);
    model.group.position.copy(spawnPt);
    this.scene.add(model.group);

    const cfg = ENEMY_CONFIGS[type] || ENEMY_CONFIGS.swarmer_zombie;
    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      ...model,
      hp: cfg.maxHp,
      maxHp: cfg.maxHp,
      speed: cfg.speed,
      damage: cfg.damage,
      attackCooldown: cfg.attackCooldown,
      attackTimer: -0.7, // Grace period upon spawning before initial attack
      telegraphTimer: 0,
      walkCycle: Math.random() * 10,
      isDying: false,
      deathTimer: 0,
    });
  }

  // ==========================================
  // SIMULATION UPDATE LOOP
  // ==========================================

  private update(dt: number) {
    // 1. Hitstop check (physics freeze on impact)
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      // Particles and camera shake still tick!
      this.particlePool.update(dt);
      this.updateCamera(dt);
      return;
    }

    // 2. Cooldowns & timers
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.hitmarkerTimer > 0) this.hitmarkerTimer -= dt;
    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt;
    if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;

    if (this.muzzleFlashLight.intensity > 0) {
      this.muzzleFlashLight.intensity = Math.max(0, this.muzzleFlashLight.intensity - dt * 25);
    }

    // Weapon reload
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.reloadTimer = 0;
        const weapon = this.weapons[this.currentWeaponId];
        const needed = weapon.magSize - (this.ammoInClip[this.currentWeaponId] || 0);
        const available = this.reserveAmmo[this.currentWeaponId] || 0;
        const toLoad = Math.min(needed, available);
        this.ammoInClip[this.currentWeaponId] = (this.ammoInClip[this.currentWeaponId] || 0) + toLoad;
        this.reserveAmmo[this.currentWeaponId] = available - toLoad;
        this.stateDirty = true;
      }
    }

    // Automatic weapon continuous firing
    const currentWep = this.weapons[this.currentWeaponId];
    if (this.isShootingHeld && currentWep.isAutomatic && this.shootCooldown <= 0) {
      this.tryShoot();
    }

    // 3. Player Movement & Physics
    this.updatePlayerMovement(dt);

    // 4. Update Entities (Enemies, Rockets, Pickups)
    this.updateEnemies(dt);
    this.updateEnemyProjectiles(dt);
    this.updateRockets(dt);
    this.updatePickups(dt);
    this.checkJumpPads();

    // 5. Particles & Camera
    this.particlePool.update(dt);
    this.updateCamera(dt);

    // 6. Wave Spawner
    if (this.waveSpawnQueue.length > 0) {
      this.waveSpawnInterval -= dt;
      if (this.waveSpawnInterval <= 0) {
        this.spawnNextEnemy();
        this.waveSpawnInterval = 1.0 + Math.random() * 0.8;
      }
    }

    // 7. Sync state to UI (throttled to <= 10Hz or on discrete events)
    const now = performance.now();
    if (this.stateDirty || now - this.lastStateSyncTime > 100) {
      this.syncState();
      this.lastStateSyncTime = now;
      this.stateDirty = false;
    }
  }

  private updatePlayerMovement(dt: number) {
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(-Math.sin(this.playerYaw), 0, -Math.cos(this.playerYaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.playerYaw), 0, -Math.sin(this.playerYaw)).normalize();

    if (this.keysHeld.has('w')) moveDir.add(forward);
    if (this.keysHeld.has('s')) moveDir.sub(forward);
    if (this.keysHeld.has('d')) moveDir.add(right);
    if (this.keysHeld.has('a')) moveDir.sub(right);

    // Virtual Touch Joystick input
    if (Math.abs(this.touchMoveVector.y) > 0.05) {
      moveDir.addScaledVector(forward, -this.touchMoveVector.y);
    }
    if (Math.abs(this.touchMoveVector.x) > 0.05) {
      moveDir.addScaledVector(right, this.touchMoveVector.x);
    }

    const isMoving = moveDir.lengthSq() > 0.001;
    if (isMoving) moveDir.normalize();

    const isSprinting = this.keysHeld.has('shift');
    const baseSpeed = isSprinting ? 9.5 : 7.0;
    const targetSpeed = this.isScoped ? 3.5 : baseSpeed;

    // Ground acceleration / air friction
    const accel = this.isGrounded ? 18.0 : 4.5;
    const damping = this.isGrounded ? 10.0 : 1.5;

    if (isMoving) {
      this.playerVelocity.x += moveDir.x * targetSpeed * accel * dt;
      this.playerVelocity.z += moveDir.z * targetSpeed * accel * dt;
      this.walkDistance += targetSpeed * dt;
    }

    // Apply horizontal drag
    this.playerVelocity.x -= this.playerVelocity.x * damping * dt;
    this.playerVelocity.z -= this.playerVelocity.z * damping * dt;

    // Gravity
    this.playerVelocity.y -= 26.0 * dt;

    // Jump handling with coyote time + buffer
    if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
      this.playerVelocity.y = 10.5; // Jump impulse
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      soundEngine.playJump();
    }

    // Proposed new position
    const newX = this.playerPos.x + this.playerVelocity.x * dt;
    const newY = this.playerPos.y + this.playerVelocity.y * dt;
    const newZ = this.playerPos.z + this.playerVelocity.z * dt;

    // AABB collisions against level geometry
    const playerRadius = 0.45;
    const playerHeight = 1.8;

    // Check X
    let canMoveX = true;
    for (const box of this.arenaData.collisionBoxes) {
      if (this.checkCollision(newX, this.playerPos.y, this.playerPos.z, playerRadius, playerHeight, box)) {
        canMoveX = false;
        this.playerVelocity.x = 0;
        break;
      }
    }
    if (canMoveX) this.playerPos.x = newX;

    // Check Z
    let canMoveZ = true;
    for (const box of this.arenaData.collisionBoxes) {
      if (this.checkCollision(this.playerPos.x, this.playerPos.y, newZ, playerRadius, playerHeight, box)) {
        canMoveZ = false;
        this.playerVelocity.z = 0;
        break;
      }
    }
    if (canMoveZ) this.playerPos.z = newZ;

    // Check Y (Floor / Platforms)
    let groundY = 0;
    for (const box of this.arenaData.collisionBoxes) {
      const inX = this.playerPos.x + playerRadius > box.min.x && this.playerPos.x - playerRadius < box.max.x;
      const inZ = this.playerPos.z + playerRadius > box.min.z && this.playerPos.z - playerRadius < box.max.z;
      if (inX && inZ && box.max.y <= this.playerPos.y + 0.3) {
        if (box.max.y > groundY) {
          groundY = box.max.y;
        }
      }
    }

    if (newY <= groundY + playerHeight) {
      this.playerPos.y = groundY + playerHeight;
      this.playerVelocity.y = 0;
      if (!this.isGrounded) {
        this.isGrounded = true;
      }
    } else {
      if (this.isGrounded) {
        this.isGrounded = false;
        this.coyoteTimer = 0.1; // Coyote time grace period
      }
      this.playerPos.y = newY;
    }
  }

  private checkCollision(x: number, y: number, z: number, r: number, h: number, box: CollisionBox): boolean {
    const minX = x - r;
    const maxX = x + r;
    const minY = y - h;
    const maxY = y;
    const minZ = z - r;
    const maxZ = z + r;
    return (
      minX < box.max.x &&
      maxX > box.min.x &&
      minY < box.max.y &&
      maxY > box.min.y &&
      minZ < box.max.z &&
      maxZ > box.min.z
    );
  }

  private checkJumpPads() {
    for (const pad of this.arenaData.jumpPads) {
      if (isEntityOnJumpPad(this.playerPos, pad, 2.6)) {
        this.playerVelocity.y = pad.power; // e.g. 17.5 m/s upward boost!
        this.isGrounded = false;
        soundEngine.playJumpPad();
        this.particlePool.emitBurst(pad.x, pad.y + 0.4, pad.z, 16, 0x34d399, 1.4, 0.25);
        break;
      }
    }
  }

  private hasLineOfSight(from: THREE.Vector3, to: THREE.Vector3): boolean {
    const dir = to.clone().sub(from);
    const totalDist = dir.length();
    if (totalDist < 0.2) return true;
    dir.normalize();
    this.tempRay.origin.copy(from);
    this.tempRay.direction.copy(dir);

    for (const box of this.arenaData.collisionBoxes) {
      this.tempBox.min.copy(box.min);
      this.tempBox.max.copy(box.max);
      const hit = this.tempRay.intersectBox(this.tempBox, this.tempIntersect);
      if (hit) {
        const hitDist = hit.distanceTo(from);
        // If an obstacle sits between attacker and target
        if (hitDist > 0.3 && hitDist < totalDist - 0.5) {
          return false;
        }
      }
    }
    return true;
  }

  private moveEnemyWithCollision(
    e: ActiveEnemy,
    dir: THREE.Vector3,
    speed: number,
    dt: number
  ) {
    if (dir.lengthSq() < 0.001) return;
    const moveStep = dir.clone().normalize().multiplyScalar(speed * dt);
    const nextX = e.group.position.x + moveStep.x;
    const nextZ = e.group.position.z + moveStep.z;
    const enemyRadius = 0.45;

    let canMoveX = true;
    let canMoveZ = true;

    for (const box of this.arenaData.collisionBoxes) {
      if (
        e.group.position.y >= box.min.y - 0.5 &&
        e.group.position.y <= box.max.y + 0.5
      ) {
        if (
          nextX + enemyRadius > box.min.x &&
          nextX - enemyRadius < box.max.x &&
          e.group.position.z + enemyRadius > box.min.z &&
          e.group.position.z - enemyRadius < box.max.z
        ) {
          canMoveX = false;
        }
        if (
          e.group.position.x + enemyRadius > box.min.x &&
          e.group.position.x - enemyRadius < box.max.x &&
          nextZ + enemyRadius > box.min.z &&
          nextZ - enemyRadius < box.max.z
        ) {
          canMoveZ = false;
        }
      }
    }

    if (canMoveX) e.group.position.x = nextX;
    if (canMoveZ) e.group.position.z = nextZ;
  }

  private spawnEnemyProjectile(
    origin: THREE.Vector3,
    target: THREE.Vector3,
    type: 'bullet' | 'laser',
    damage: number
  ) {
    const dir = target.clone().sub(origin);
    dir.normalize();

    // Natural aim spread (allows dodging by strafing!)
    dir.x += (Math.random() - 0.5) * 0.08;
    dir.y += (Math.random() - 0.5) * 0.05;
    dir.z += (Math.random() - 0.5) * 0.08;
    dir.normalize();

    const speed = type === 'laser' ? 18.0 : 22.0;
    const velocity = dir.multiplyScalar(speed);

    const geom =
      type === 'laser'
        ? new THREE.BoxGeometry(0.18, 0.18, 0.6)
        : new THREE.BoxGeometry(0.24, 0.24, 0.32);
    const mat = new THREE.MeshBasicMaterial({
      color: type === 'laser' ? 0x00f0ff : 0xff5500,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(origin);
    mesh.lookAt(origin.clone().add(velocity));
    this.scene.add(mesh);

    this.enemyProjectiles.push({
      mesh,
      velocity,
      damage,
      life: 0,
      maxLife: 2.5,
      type,
    });

    this.particlePool.emitBurst(
      origin.x,
      origin.y,
      origin.z,
      4,
      type === 'laser' ? 0x00f0ff : 0xff5500,
      0.35,
      0.15
    );
  }

  private updateEnemyProjectiles(dt: number) {
    const toRemove: number[] = [];

    for (let i = 0; i < this.enemyProjectiles.length; i++) {
      const p = this.enemyProjectiles[i];
      p.life += dt;

      if (Math.random() > 0.4) {
        this.particlePool.emitBurst(
          p.mesh.position.x,
          p.mesh.position.y,
          p.mesh.position.z,
          1,
          p.type === 'laser' ? 0x38bdf8 : 0xf97316,
          0.15,
          0.1
        );
      }

      p.mesh.position.addScaledVector(p.velocity, dt);

      // Floor collision
      if (p.mesh.position.y <= 0.1) {
        this.particlePool.emitBurst(p.mesh.position.x, 0.1, p.mesh.position.z, 6, 0xf59e0b, 0.5, 0.2);
        this.scene.remove(p.mesh);
        toRemove.push(i);
        continue;
      }

      // Obstacle collision against level geometry
      let hitObstacle = false;
      const pos = p.mesh.position;
      for (const box of this.arenaData.collisionBoxes) {
        if (
          pos.x >= box.min.x &&
          pos.x <= box.max.x &&
          pos.y >= box.min.y &&
          pos.y <= box.max.y &&
          pos.z >= box.min.z &&
          pos.z <= box.max.z
        ) {
          hitObstacle = true;
          break;
        }
      }

      if (hitObstacle) {
        this.particlePool.emitBurst(pos.x, pos.y, pos.z, 6, 0xf59e0b, 0.6, 0.2);
        this.scene.remove(p.mesh);
        toRemove.push(i);
        continue;
      }

      // Check collision with Player (capsule hitbox)
      const dx = pos.x - this.playerPos.x;
      const dz = pos.z - this.playerPos.z;
      const flatDist = Math.sqrt(dx * dx + dz * dz);
      const playerY = this.playerPos.y;
      const inHeight = pos.y >= playerY - 1.8 && pos.y <= playerY + 0.3;

      if (flatDist <= 0.65 && inHeight) {
        this.takePlayerDamage(p.damage, pos);
        this.particlePool.emitBurst(pos.x, pos.y, pos.z, 10, 0xef4444, 0.8, 0.25);
        this.scene.remove(p.mesh);
        toRemove.push(i);
        continue;
      }

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        toRemove.push(i);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.enemyProjectiles.splice(toRemove[i], 1);
    }
  }

  private updateEnemies(dt: number) {
    const toRemove: number[] = [];

    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];

      // Handle defeat dissolution
      if (e.isDying) {
        e.deathTimer -= dt;
        e.group.scale.multiplyScalar(0.92);
        if (e.deathTimer <= 0) {
          this.scene.remove(e.group);
          toRemove.push(i);
        }
        continue;
      }

      // Enemy AI decision & pathing
      const dist = e.group.position.distanceTo(this.playerPos);
      const toPlayer = this.playerPos.clone().sub(e.group.position);
      toPlayer.y = 0;
      const flatDist = toPlayer.length();

      if (flatDist > 0.1) {
        toPlayer.normalize();
        e.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
      }

      // Archetype specific movement & attacks
      if (e.type === 'swarmer_zombie') {
        // Melee reach check requiring both horizontal proximity and vertical alignment
        const canReach = canMeleeAttackTarget(e.group.position, this.playerPos, 2.2, 1.6);
        if (!canReach) {
          if (flatDist > 0.8) {
            this.moveEnemyWithCollision(e, toPlayer, e.speed, dt);
          }
          e.walkCycle += dt * 9;
        } else {
          // Melee attack
          e.attackTimer += dt;
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            this.takePlayerDamage(e.damage, e.group.position);
            e.leftArm.rotation.x = -0.5;
            e.rightArm.rotation.x = -0.5;
            setTimeout(() => {
              if (!e.isDying) {
                e.leftArm.rotation.x = -1.35;
                e.rightArm.rotation.x = -1.35;
              }
            }, 120);
          }
        }
      } else if (e.type === 'pixel_gunner') {
        // Tactical kiter: maintains 10-16m distance
        if (flatDist > 16) {
          this.moveEnemyWithCollision(e, toPlayer, e.speed, dt);
        } else if (flatDist < 8) {
          const away = toPlayer.clone().negate();
          this.moveEnemyWithCollision(e, away, e.speed, dt);
        }
        e.walkCycle += dt * 6;

        // Attack telegraph + shot with visible projectile & LOS check
        const gunOrigin = new THREE.Vector3(e.group.position.x, e.group.position.y + 1.2, e.group.position.z);
        const playerChest = new THREE.Vector3(this.playerPos.x, this.playerPos.y - 0.5, this.playerPos.z);
        const hasLOS = flatDist <= 28 && this.hasLineOfSight(gunOrigin, playerChest);

        if (hasLOS) {
          e.attackTimer += dt;
          if (e.attackTimer >= e.attackCooldown - 0.4 && e.telegraphTimer <= 0) {
            e.telegraphTimer = 0.4;
            soundEngine.playTelegraph();
            this.particlePool.emitBurst(gunOrigin.x, gunOrigin.y, gunOrigin.z, 3, 0xef4444, 0.4, 0.12);
          }
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            e.telegraphTimer = 0;
            soundEngine.playShoot('pixel_pistol');
            this.spawnEnemyProjectile(gunOrigin, playerChest, 'bullet', e.damage);
          }
        } else {
          e.telegraphTimer = 0;
        }
      } else if (e.type === 'heavy_golem') {
        // Ground pound reach check requiring both horizontal and vertical proximity
        const canReach = canMeleeAttackTarget(e.group.position, this.playerPos, 3.2, 2.0);
        if (!canReach) {
          if (flatDist > 1.2) {
            this.moveEnemyWithCollision(e, toPlayer, e.speed, dt);
          }
          e.walkCycle += dt * 4;
        } else {
          e.attackTimer += dt;
          if (e.attackTimer >= e.attackCooldown - 0.5 && e.telegraphTimer <= 0) {
            e.telegraphTimer = 0.5;
            soundEngine.playTelegraph();
            e.leftArm.rotation.x = -2.2;
            e.rightArm.rotation.x = -2.2;
          }
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            e.telegraphTimer = 0;
            e.leftArm.rotation.x = 0;
            e.rightArm.rotation.x = 0;
            this.takePlayerDamage(e.damage, e.group.position);
            soundEngine.playExplosion();
            this.trauma = Math.min(1.0, this.trauma + 0.4);
            this.particlePool.emitBurst(e.group.position.x, 0.2, e.group.position.z, 20, 0xea580c, 1.8, 0.3);
          }
        }
      } else if (e.type === 'aerial_drone') {
        // Hovering cyber drone
        e.group.position.y = 3.6 + Math.sin(e.walkCycle) * 0.4;
        e.walkCycle += dt * 4;
        if (flatDist > 10) {
          this.moveEnemyWithCollision(e, toPlayer, e.speed, dt);
        }

        // Spin drone blades
        e.group.traverse((c) => {
          if (c.name === 'droneBlade') {
            c.rotation.y += dt * 25;
          }
        });

        const droneOrigin = new THREE.Vector3(e.group.position.x, e.group.position.y, e.group.position.z);
        const playerChest = new THREE.Vector3(this.playerPos.x, this.playerPos.y - 0.5, this.playerPos.z);
        const hasLOS = dist <= 25 && this.hasLineOfSight(droneOrigin, playerChest);

        if (hasLOS) {
          e.attackTimer += dt;
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            soundEngine.playShoot('prototype_laser');
            this.spawnEnemyProjectile(droneOrigin, playerChest, 'laser', e.damage);
          }
        }
      }

      // Procedural limb walk animation
      if (e.type !== 'aerial_drone') {
        const swing = Math.sin(e.walkCycle) * 0.6;
        e.leftLeg.rotation.x = swing;
        e.rightLeg.rotation.x = -swing;
        if (e.type !== 'swarmer_zombie' && e.type !== 'heavy_golem') {
          e.leftArm.rotation.x = -swing;
        }
      }
    }

    // Clean up dead
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.enemies.splice(toRemove[i], 1);
    }
  }

  private updateRockets(dt: number) {
    const toRemove: number[] = [];

    for (let i = 0; i < this.rockets.length; i++) {
      const r = this.rockets[i];
      r.life += dt;

      // Rocket smoke trail
      if (Math.random() > 0.3) {
        this.particlePool.emitBurst(r.mesh.position.x, r.mesh.position.y, r.mesh.position.z, 2, 0x9ca3af, 0.2, 0.16);
      }

      r.mesh.position.addScaledVector(r.velocity, dt);

      // Check collision with floor
      if (r.mesh.position.y <= 0.2) {
        this.explodeRocket(r.mesh.position);
        this.scene.remove(r.mesh);
        toRemove.push(i);
        continue;
      }

      // Check collision with level boxes
      let hitBox = false;
      for (const box of this.arenaData.collisionBoxes) {
        const pos = r.mesh.position;
        if (
          pos.x >= box.min.x &&
          pos.x <= box.max.x &&
          pos.y >= box.min.y &&
          pos.y <= box.max.y &&
          pos.z >= box.min.z &&
          pos.z <= box.max.z
        ) {
          hitBox = true;
          break;
        }
      }

      if (hitBox || r.life >= r.maxLife) {
        this.explodeRocket(r.mesh.position);
        this.scene.remove(r.mesh);
        toRemove.push(i);
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.rockets.splice(toRemove[i], 1);
    }
  }

  private updatePickups(dt: number) {
    for (const p of this.pickups) {
      if (p.respawnTimer > 0) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.mesh.visible = true;
        }
        continue;
      }

      // Spin & bob
      p.mesh.rotation.y += dt * 2.5;
      p.mesh.position.y = p.y + Math.sin(performance.now() * 0.003) * 0.15;

      // Check player collection
      const dist = this.playerPos.distanceTo(p.mesh.position);
      if (dist < 1.6) {
        p.mesh.visible = false;
        p.respawnTimer = 15.0; // 15s respawn timer

        if (p.type === 'health') {
          this.hp = Math.min(this.maxHp, this.hp + 40);
          soundEngine.playPowerup();
        } else if (p.type === 'armor') {
          this.armor = Math.min(this.maxArmor, this.armor + 50);
          soundEngine.playPowerup();
        } else if (p.type === 'ammo') {
          for (const wid of Object.keys(this.reserveAmmo)) {
            const wep = this.weapons[wid];
            this.reserveAmmo[wid] += wep.magSize * 2;
          }
          soundEngine.playPowerup();
        } else if (p.type === 'coin') {
          this.coins += 25;
          this.score += 150;
          soundEngine.playCoin();
        }
        this.stateDirty = true;
      }
    }
  }

  private updateCamera(dt: number) {
    // 1. Camera orientation from mouse yaw/pitch
    this.camera.position.copy(this.playerPos);

    // Apply decaying camera shake
    if (this.trauma > 0) {
      const shakeAmt = this.trauma * this.trauma * 0.08;
      this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.y += (Math.random() - 0.5) * shakeAmt;
      this.camera.position.z += (Math.random() - 0.5) * shakeAmt;
      this.trauma = Math.max(0, this.trauma - dt * 2.0);
    }

    // Set camera Euler rotation strictly with FPS order 'YXZ' (Yaw around world Y first, Pitch around local X; zero Roll)
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(this.playerPitch, this.playerYaw, 0, 'YXZ');

    // 2. Weapon viewmodel recoil damping & walk bobbing
    this.recoilOffset.x = THREE.MathUtils.damp(this.recoilOffset.x, 0, 14, dt);
    this.recoilOffset.y = THREE.MathUtils.damp(this.recoilOffset.y, 0, 14, dt);
    this.recoilOffset.z = THREE.MathUtils.damp(this.recoilOffset.z, 0, 14, dt);
    this.recoilRot.x = THREE.MathUtils.damp(this.recoilRot.x, 0, 14, dt);

    if (this.currentViewModel) {
      const bobX = Math.cos(this.walkDistance * 1.4) * 0.02;
      const bobY = Math.abs(Math.sin(this.walkDistance * 1.4)) * -0.025;

      this.currentViewModel.position.set(
        0.26 + bobX + this.recoilOffset.x,
        -0.22 + bobY + this.recoilOffset.y,
        -0.52 + this.recoilOffset.z
      );
      this.currentViewModel.rotation.set(this.recoilRot.x, 0, 0);
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  // ==========================================
  // EXTERNAL ACTIONS & SHOP
  // ==========================================

  public upgradeWeapon(id: string): boolean {
    const w = this.weapons[id];
    if (!w) return false;
    const upgradeCost = Math.round((w.cost || 100) * 0.5 * (w.level + 1) + 50);
    if (this.coins < upgradeCost) return false;

    this.coins -= upgradeCost;
    w.level += 1;
    w.damage = Math.round(w.damage * 1.15);
    if (w.magSize > 1) {
      w.magSize = Math.round(w.magSize * 1.2);
    }
    soundEngine.playPowerup();
    this.stateDirty = true;
    return true;
  }

  public unlockWeapon(id: string): boolean {
    const w = this.weapons[id];
    if (!w || w.unlocked) return false;
    if (this.coins < w.cost) return false;

    this.coins -= w.cost;
    w.unlocked = true;
    this.ammoInClip[id] = w.magSize;
    this.reserveAmmo[id] = w.magSize * 3;
    soundEngine.playVictory();
    this.stateDirty = true;
    return true;
  }

  public restartGame() {
    this.hp = 100;
    this.armor = 50;
    this.score = 0;
    this.kills = 0;
    this.wave = 1;
    this.playerPos.set(0, 1.8, 14);
    this.playerVelocity.set(0, 0, 0);

    // Remove remaining enemies, rockets, and enemy projectiles
    for (const e of this.enemies) {
      this.scene.remove(e.group);
    }
    this.enemies = [];
    for (const r of this.rockets) {
      this.scene.remove(r.mesh);
    }
    this.rockets = [];
    for (const ep of this.enemyProjectiles) {
      this.scene.remove(ep.mesh);
    }
    this.enemyProjectiles = [];

    this.initAmmo();
    this.lastDamageTimestamp = 0;
    this.startWave(1);
    this.stateDirty = true;
  }

  private syncState() {
    if (!this.stateListener) return;
    this.stateListener({
      hp: this.hp,
      maxHp: this.maxHp,
      armor: this.armor,
      maxArmor: this.maxArmor,
      score: this.score,
      coins: this.coins,
      wave: this.wave,
      waveName: this.waveName,
      enemiesRemaining: this.enemiesRemaining,
      totalWaveEnemies: this.totalWaveEnemies,
      currentWeaponId: this.currentWeaponId,
      weapons: this.weapons,
      ammoInClip: this.ammoInClip[this.currentWeaponId] || 0,
      reserveAmmo: this.reserveAmmo[this.currentWeaponId] || 0,
      isReloading: this.reloadTimer > 0,
      isScoped: this.isScoped,
      isMuted: soundEngine.getMuted(),
      isPointerLocked: this.isPointerLocked,
      hitmarkerTime: this.hitmarkerTimer > 0 ? performance.now() : 0,
      isCritHit: this.isCritHit,
      damageFlashTime: this.lastDamageTimestamp,
      damageAngle: this.lastDamageAngle,
    });
  }

  public dispose() {
    this.stop();
    for (const ep of this.enemyProjectiles) {
      this.scene.remove(ep.mesh);
    }
    this.enemyProjectiles = [];
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
    window.removeEventListener('mousemove', () => {});
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.particlePool.dispose();
  }
}
