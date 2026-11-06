import * as THREE from 'three';
import {
  createZombieFaceTexture,
  createMercenaryFaceTexture,
  createGolemTexture,
  createJumpPadTexture,
} from './voxelTextures';

/**
 * Procedural Composite 3-12 Part Voxel Models (THREE.Group)
 * Built with authentic Pixel Gun 3D aesthetics and grounded pivots.
 */

// Shared reusable materials & geometries
const boxGeom = new THREE.BoxGeometry(1, 1, 1);

function createBlock(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  pos: [number, number, number] = [0, 0, 0],
  rot: [number, number, number] = [0, 0, 0]
): THREE.Mesh {
  const mesh = new THREE.Mesh(boxGeom, mat);
  mesh.scale.set(w, h, d);
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ==========================================
// FIRST PERSON WEAPON VIEWMODELS
// ==========================================

export function buildWeaponViewModel(
  weaponId: string,
  customSleeveColor?: string,
  customGloveColor?: string
): THREE.Group {
  const group = new THREE.Group();

  const sleeveMat = new THREE.MeshStandardMaterial({
    color: customSleeveColor ? new THREE.Color(customSleeveColor) : 0x1e3a8a,
    roughness: 0.7,
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: customGloveColor ? new THREE.Color(customGloveColor) : 0x1e293b,
    roughness: 0.6,
  });

  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.35, metalness: 0.7 });
  const lightSteel = new THREE.MeshStandardMaterial({ color: 0x4a525d, roughness: 0.3, metalness: 0.8 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.75, metalness: 0.05 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25, metalness: 0.9 });
  const neonCyan = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });

  switch (weaponId) {
    case 'combat_knife': {
      // 1. Handle
      group.add(createBlock(0.06, 0.25, 0.08, woodMat, [0, -0.1, 0]));
      // 2. Pommel
      group.add(createBlock(0.08, 0.05, 0.1, goldMat, [0, -0.24, 0]));
      // 3. Guard
      group.add(createBlock(0.16, 0.04, 0.1, darkSteel, [0, 0.04, 0]));
      // 4. Blade
      group.add(createBlock(0.04, 0.45, 0.12, lightSteel, [0, 0.28, 0.02]));
      // 5. Blade bevel edge
      group.add(createBlock(0.02, 0.42, 0.04, goldMat, [0, 0.28, 0.08]));
      group.rotation.set(-0.4, 0.2, -0.3);
      group.position.set(0.28, -0.28, -0.45);
      break;
    }

    case 'pixel_pistol': {
      // 1. Grip
      group.add(createBlock(0.07, 0.24, 0.11, darkSteel, [0, -0.14, 0.04], [0.2, 0, 0]));
      // 2. Slide
      group.add(createBlock(0.08, 0.12, 0.42, lightSteel, [0, 0.02, -0.06]));
      // 3. Barrel & muzzle
      group.add(createBlock(0.06, 0.06, 0.1, darkSteel, [0, 0.02, -0.3]));
      // 4. Trigger guard
      group.add(createBlock(0.04, 0.08, 0.12, darkSteel, [0, -0.08, -0.08]));
      // 5. Front sight
      group.add(createBlock(0.02, 0.04, 0.04, goldMat, [0, 0.1, -0.24]));
      // 6. Rear sight
      group.add(createBlock(0.06, 0.03, 0.04, goldMat, [0, 0.1, 0.1]));
      group.position.set(0.25, -0.25, -0.5);
      break;
    }

    case 'pixel_ak47': {
      // 1. Receiver
      group.add(createBlock(0.09, 0.14, 0.55, darkSteel, [0, 0, 0]));
      // 2. Banana magazine (curved voxel blocks)
      group.add(createBlock(0.07, 0.26, 0.14, redMat, [0, -0.18, -0.05], [0.35, 0, 0]));
      // 3. Wooden stock
      group.add(createBlock(0.08, 0.18, 0.45, woodMat, [0, -0.04, 0.46], [-0.1, 0, 0]));
      // 4. Wooden front handguard
      group.add(createBlock(0.085, 0.11, 0.3, woodMat, [0, 0.01, -0.38]));
      // 5. Long barrel
      group.add(createBlock(0.05, 0.05, 0.4, lightSteel, [0, 0.04, -0.65]));
      // 6. Gas tube
      group.add(createBlock(0.04, 0.04, 0.35, darkSteel, [0, 0.09, -0.5]));
      // 7. Pistol grip
      group.add(createBlock(0.07, 0.22, 0.1, woodMat, [0, -0.16, 0.16], [0.3, 0, 0]));
      // 8. Front sight & muzzle brake
      group.add(createBlock(0.03, 0.08, 0.06, goldMat, [0, 0.09, -0.8]));
      group.position.set(0.26, -0.22, -0.55);
      break;
    }

    case 'pixel_shotgun': {
      // 1. Twin heavy barrels
      group.add(createBlock(0.12, 0.07, 0.65, lightSteel, [0, 0.05, -0.3]));
      // 2. Chunky pump grip
      group.add(createBlock(0.13, 0.1, 0.28, darkSteel, [0, -0.04, -0.25]));
      // 3. Receiver
      group.add(createBlock(0.11, 0.16, 0.35, darkSteel, [0, 0.02, 0.1]));
      // 4. Wooden stock
      group.add(createBlock(0.09, 0.18, 0.42, woodMat, [0, -0.06, 0.45]));
      // 5. Grip
      group.add(createBlock(0.08, 0.2, 0.12, woodMat, [0, -0.15, 0.2], [0.25, 0, 0]));
      group.position.set(0.25, -0.22, -0.5);
      break;
    }

    case 'pixel_sniper': {
      // 1. Slender precision body
      group.add(createBlock(0.08, 0.12, 0.65, darkSteel, [0, 0, 0]));
      // 2. Extra long barrel
      group.add(createBlock(0.04, 0.04, 0.85, lightSteel, [0, 0.04, -0.7]));
      // 3. High-tech cylindrical scope
      group.add(createBlock(0.09, 0.09, 0.4, darkSteel, [0, 0.14, -0.05]));
      // Scope mounts
      group.add(createBlock(0.04, 0.06, 0.05, lightSteel, [0, 0.08, 0.08]));
      group.add(createBlock(0.04, 0.06, 0.05, lightSteel, [0, 0.08, -0.18]));
      // Scope lenses
      group.add(createBlock(0.07, 0.07, 0.02, neonCyan, [0, 0.14, -0.26]));
      // 4. Ergonomic skeleton stock
      group.add(createBlock(0.07, 0.16, 0.45, darkSteel, [0, -0.05, 0.5]));
      // 5. Folded bipod
      group.add(createBlock(0.04, 0.14, 0.04, lightSteel, [-0.06, -0.06, -0.55], [0, 0, 0.3]));
      group.add(createBlock(0.04, 0.14, 0.04, lightSteel, [0.06, -0.06, -0.55], [0, 0, -0.3]));
      group.position.set(0.25, -0.2, -0.55);
      break;
    }

    case 'rocket_jumper': {
      // 1. Heavy bazooka main tube
      group.add(createBlock(0.22, 0.22, 0.95, darkSteel, [0, 0.08, -0.1]));
      // 2. Rear exhaust bell cone
      group.add(createBlock(0.28, 0.28, 0.18, redMat, [0, 0.08, 0.44]));
      // 3. Front muzzle reinforcement
      group.add(createBlock(0.26, 0.26, 0.12, goldMat, [0, 0.08, -0.62]));
      // 4. Exposed loaded rocket warhead inside tube!
      group.add(createBlock(0.16, 0.16, 0.2, redMat, [0, 0.08, -0.6]));
      group.add(createBlock(0.12, 0.12, 0.15, goldMat, [0, 0.08, -0.72]));
      // 5. Dual handles
      group.add(createBlock(0.06, 0.25, 0.08, darkSteel, [0, -0.15, 0.05]));
      group.add(createBlock(0.06, 0.22, 0.08, darkSteel, [0, -0.14, -0.25]));
      // 6. Targeting sight
      group.add(createBlock(0.06, 0.12, 0.14, neonCyan, [-0.15, 0.2, -0.2]));
      group.position.set(0.28, -0.18, -0.55);
      break;
    }

    case 'prototype_laser': {
      // 1. Futuristic body
      group.add(createBlock(0.12, 0.16, 0.65, darkSteel, [0, 0, 0]));
      // 2. Glowing energy core cell
      group.add(createBlock(0.14, 0.12, 0.3, neonCyan, [0, 0.04, 0.02]));
      // 3. Magnetic accelerator rails
      group.add(createBlock(0.04, 0.04, 0.6, lightSteel, [-0.08, 0.08, -0.45]));
      group.add(createBlock(0.04, 0.04, 0.6, lightSteel, [0.08, 0.08, -0.45]));
      group.add(createBlock(0.04, 0.04, 0.6, lightSteel, [-0.08, -0.08, -0.45]));
      group.add(createBlock(0.04, 0.04, 0.6, lightSteel, [0.08, -0.08, -0.45]));
      // 4. Focusing prism emitter
      group.add(createBlock(0.1, 0.1, 0.1, neonCyan, [0, 0, -0.75]));
      // 5. Tech stock & battery
      group.add(createBlock(0.1, 0.18, 0.35, lightSteel, [0, -0.06, 0.42]));
      group.position.set(0.26, -0.2, -0.52);
      break;
    }
  }

  // Custom voxel player hand and forearm holding the weapon
  const playerHand = createBlock(0.1, 0.11, 0.14, gloveMat, [0.01, -0.15, 0.1]);
  const playerForearm = createBlock(0.12, 0.13, 0.32, sleeveMat, [0.03, -0.25, 0.3], [-0.25, 0, 0]);
  group.add(playerHand);
  group.add(playerForearm);

  return group;
}

// ==========================================
// 3D ENEMY MODELS (Composite 3-12 Part Groups)
// ==========================================

export function buildEnemyModel(enemyType: string): {
  group: THREE.Group;
  head: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  torso: THREE.Mesh;
} {
  const group = new THREE.Group();

  let headMat: THREE.Material;
  let bodyMat: THREE.Material;
  let armMat: THREE.Material;
  let legMat: THREE.Material;

  if (enemyType === 'swarmer_zombie') {
    headMat = new THREE.MeshStandardMaterial({
      map: createZombieFaceTexture(),
      roughness: 0.8,
    });
    bodyMat = new THREE.MeshStandardMaterial({ color: 0x3b6685, roughness: 0.8 }); // torn blue shirt
    armMat = new THREE.MeshStandardMaterial({ color: 0x4d7c38, roughness: 0.85 }); // green zombie flesh
    legMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
  } else if (enemyType === 'pixel_gunner') {
    headMat = new THREE.MeshStandardMaterial({
      map: createMercenaryFaceTexture(),
      roughness: 0.6,
    });
    bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d3b2c, roughness: 0.7 }); // camo vest
    armMat = new THREE.MeshStandardMaterial({ color: 0x3f4f3e, roughness: 0.7 });
    legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
  } else if (enemyType === 'heavy_golem') {
    headMat = new THREE.MeshStandardMaterial({
      map: createGolemTexture(),
      roughness: 0.9,
    });
    bodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, metalness: 0.2 });
    armMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 });
    legMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  } else {
    // Aerial drone
    headMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3, emissive: 0x0284c7, emissiveIntensity: 0.5 });
    bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });
    armMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.6 });
    legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
  }

  const scale = enemyType === 'heavy_golem' ? 1.7 : enemyType === 'aerial_drone' ? 0.85 : 1.0;

  // 1. Torso
  const torsoW = 0.8 * scale;
  const torsoH = 0.9 * scale;
  const torsoD = 0.45 * scale;
  const torso = createBlock(torsoW, torsoH, torsoD, bodyMat, [0, 1.25 * scale, 0]);
  group.add(torso);

  // 2. Head (anchored at neck)
  const headSize = 0.65 * scale;
  const head = createBlock(headSize, headSize, headSize, headMat, [0, 1.95 * scale, 0]);
  group.add(head);

  // 3. Left Arm
  const armW = 0.3 * scale;
  const armH = 0.85 * scale;
  const armD = 0.3 * scale;
  const leftArm = createBlock(armW, armH, armD, armMat, [-0.58 * scale, 1.2 * scale, 0]);
  group.add(leftArm);

  // 4. Right Arm
  const rightArm = createBlock(armW, armH, armD, armMat, [0.58 * scale, 1.2 * scale, 0]);
  group.add(rightArm);

  // 5. Left Leg (pivot at hip)
  const legW = 0.34 * scale;
  const legH = 0.85 * scale;
  const legD = 0.36 * scale;
  const leftLeg = createBlock(legW, legH, legD, legMat, [-0.22 * scale, 0.42 * scale, 0]);
  group.add(leftLeg);

  // 6. Right Leg
  const rightLeg = createBlock(legW, legH, legD, legMat, [0.22 * scale, 0.42 * scale, 0]);
  group.add(rightLeg);

  if (enemyType === 'swarmer_zombie') {
    // Raise zombie arms forward in classic shambler pose
    leftArm.rotation.x = -1.35;
    rightArm.rotation.x = -1.35;
  } else if (enemyType === 'pixel_gunner') {
    // Hold small voxel SMG in right hand
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.8 });
    const smg = createBlock(0.12, 0.16, 0.5, gunMat, [0, -0.3 * scale, -0.25 * scale]);
    rightArm.add(smg);
    rightArm.rotation.x = -0.7;
    leftArm.rotation.x = -0.4;
    leftArm.rotation.y = 0.3;
  } else if (enemyType === 'heavy_golem') {
    // Huge hammer fists
    const fistMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6, emissive: 0x9a3412, emissiveIntensity: 0.6 });
    const leftFist = createBlock(0.55, 0.55, 0.55, fistMat, [0, -0.45 * scale, 0]);
    const rightFist = createBlock(0.55, 0.55, 0.55, fistMat, [0, -0.45 * scale, 0]);
    leftArm.add(leftFist);
    rightArm.add(rightFist);
  } else if (enemyType === 'aerial_drone') {
    // 4 rotor struts with spinning blades
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2 });
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const offsets: [number, number][] = [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]];
    offsets.forEach(([ox, oz]) => {
      const strut = createBlock(0.08, 0.08, 0.45, strutMat, [ox * 0.5, 0.1, oz * 0.5], [0, Math.atan2(oz, ox), 0]);
      const blade = createBlock(0.5, 0.02, 0.08, rotorMat, [ox, 0.2, oz]);
      blade.name = 'droneBlade';
      group.add(strut);
      group.add(blade);
    });
  }

  // Tag head for headshot detection
  head.userData = { isHead: true };
  group.userData = { enemyType };

  return { group, head, leftArm, rightArm, leftLeg, rightLeg, torso };
}

// ==========================================
// ARENA JUMP PAD
// ==========================================

export function buildJumpPad(): THREE.Group {
  const pad = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
  const surfaceMat = new THREE.MeshStandardMaterial({
    map: createJumpPadTexture(),
    emissive: 0x059669,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });

  // Base platform
  const base = createBlock(2.6, 0.3, 2.6, baseMat, [0, 0.15, 0]);
  pad.add(base);

  // Glowing spring pad
  const surface = createBlock(2.2, 0.12, 2.2, surfaceMat, [0, 0.32, 0]);
  pad.add(surface);

  return pad;
}

// ==========================================
// PICKUP 3D MODELS
// ==========================================

export function buildPickupModel(type: 'health' | 'armor' | 'ammo' | 'coin'): THREE.Group {
  const group = new THREE.Group();

  if (type === 'health') {
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf9fafb, roughness: 0.5 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, emissive: 0xb91c1c, emissiveIntensity: 0.4 });
    group.add(createBlock(0.65, 0.65, 0.65, whiteMat, [0, 0, 0]));
    // Red cross on 4 sides
    group.add(createBlock(0.67, 0.45, 0.16, redMat, [0, 0, 0]));
    group.add(createBlock(0.67, 0.16, 0.45, redMat, [0, 0, 0]));
  } else if (type === 'armor') {
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.6, emissive: 0x1d4ed8, emissiveIntensity: 0.4 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.8 });
    group.add(createBlock(0.6, 0.75, 0.15, blueMat, [0, 0, 0]));
    group.add(createBlock(0.25, 0.25, 0.2, goldMat, [0, 0.08, 0]));
  } else if (type === 'ammo') {
    const oliveMat = new THREE.MeshStandardMaterial({ color: 0x4d5b3d, roughness: 0.7 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.7 });
    group.add(createBlock(0.7, 0.45, 0.45, oliveMat, [0, 0, 0]));
    group.add(createBlock(0.72, 0.15, 0.15, yellowMat, [0, 0, 0]));
  } else {
    // Spinning gold coin
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.95, emissive: 0xca8a04, emissiveIntensity: 0.4 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.9 });
    group.add(createBlock(0.55, 0.55, 0.12, goldMat, [0, 0, 0]));
    group.add(createBlock(0.6, 0.6, 0.08, rimMat, [0, 0, 0]));
  }

  return group;
}
