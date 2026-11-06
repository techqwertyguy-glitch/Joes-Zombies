import * as THREE from 'three';

/**
 * High-performance Zero-GC Pooled Particle System
 * Uses THREE.InstancedMesh for rendering 300+ chunky voxel cubes
 */

const MAX_PARTICLES = 400;

interface ParticleData {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  vrx: number;
  vry: number;
  vrz: number;
  scale: number;
  initialScale: number;
  life: number;
  maxLife: number;
  gravity: number;
  bounce: number;
}

export class VoxelParticlePool {
  private mesh: THREE.InstancedMesh;
  private particles: ParticleData[] = [];
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();
  private nextIndex = 0;

  constructor(scene: THREE.Scene) {
    const geom = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.6,
      metalness: 0.1,
    });

    this.mesh = new THREE.InstancedMesh(geom, mat, MAX_PARTICLES);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;

    // Initialize all instances off-screen
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        vrx: 0,
        vry: 0,
        vrz: 0,
        scale: 0,
        initialScale: 0.2,
        life: 0,
        maxLife: 1,
        gravity: -18,
        bounce: 0.4,
      });

      this.dummy.position.set(0, -100, 0);
      this.dummy.scale.set(0, 0, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      this.mesh.setColorAt(i, this.color.setHex(0xffffff));
    }

    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    scene.add(this.mesh);
  }

  public emitBurst(
    x: number,
    y: number,
    z: number,
    count: number,
    hexColor: number,
    speedMultiplier: number = 1.0,
    size: number = 0.22
  ) {
    for (let i = 0; i < count; i++) {
      const p = this.particles[this.nextIndex];
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 0.2;
      p.y = y + (Math.random() - 0.5) * 0.2;
      p.z = z + (Math.random() - 0.5) * 0.2;

      // Spherical random velocity with upward bias
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const spd = (3.5 + Math.random() * 5.5) * speedMultiplier;

      p.vx = Math.sin(phi) * Math.cos(theta) * spd;
      p.vy = Math.abs(Math.cos(phi)) * spd * 1.2 + 2.0; // upward pop
      p.vz = Math.sin(phi) * Math.sin(theta) * spd;

      p.rx = Math.random() * Math.PI * 2;
      p.ry = Math.random() * Math.PI * 2;
      p.rz = Math.random() * Math.PI * 2;
      p.vrx = (Math.random() - 0.5) * 12;
      p.vry = (Math.random() - 0.5) * 12;
      p.vrz = (Math.random() - 0.5) * 12;

      p.initialScale = size * (0.7 + Math.random() * 0.6);
      p.scale = p.initialScale;
      p.life = 0;
      p.maxLife = 0.6 + Math.random() * 0.6;
      p.gravity = -20;
      p.bounce = 0.35;

      // Slight color jitter for pixel art depth
      this.color.setHex(hexColor);
      this.color.r = Math.min(1, Math.max(0, this.color.r + (Math.random() - 0.5) * 0.15));
      this.color.g = Math.min(1, Math.max(0, this.color.g + (Math.random() - 0.5) * 0.15));
      this.color.b = Math.min(1, Math.max(0, this.color.b + (Math.random() - 0.5) * 0.15));
      this.mesh.setColorAt(this.nextIndex, this.color);

      this.nextIndex = (this.nextIndex + 1) % MAX_PARTICLES;
    }

    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  public update(dt: number) {
    let hasActive = false;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.y = -100;
        this.dummy.position.set(0, -100, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      hasActive = true;

      // Physics
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      // Floor bounce (ground height ~ 0)
      if (p.y <= 0.1) {
        p.y = 0.1;
        p.vy = -p.vy * p.bounce;
        p.vx *= 0.7;
        p.vz *= 0.7;
      }

      p.rx += p.vrx * dt;
      p.ry += p.vry * dt;
      p.rz += p.vrz * dt;

      // Shrink over life
      const lifeRatio = 1 - p.life / p.maxLife;
      p.scale = p.initialScale * Math.max(0, lifeRatio);

      this.dummy.position.set(p.x, p.y, p.z);
      this.dummy.rotation.set(p.rx, p.ry, p.rz);
      this.dummy.scale.set(p.scale, p.scale, p.scale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }

    if (hasActive) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose() {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
