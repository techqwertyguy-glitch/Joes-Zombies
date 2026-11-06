import * as THREE from 'three';
import {
  createStoneBrickTexture,
  createWoodCrateTexture,
  createArenaFloorTexture,
  createGrassSideTexture,
  createGrassTopTexture,
} from './voxelTextures';

export interface CollisionBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
}

export interface JumpPadConfig {
  x: number;
  y: number;
  z: number;
  power: number;
}

export interface ArenaData {
  group: THREE.Group;
  collisionBoxes: CollisionBox[];
  jumpPads: JumpPadConfig[];
  spawnPoints: THREE.Vector3[];
  pickupSpawns: Array<{ x: number; y: number; z: number; type: 'health' | 'armor' | 'ammo' | 'coin' }>;
}

const boxGeom = new THREE.BoxGeometry(1, 1, 1);

function addVoxelBlock(
  group: THREE.Group,
  boxes: CollisionBox[],
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  collidable: boolean = true
): THREE.Mesh {
  const mesh = new THREE.Mesh(boxGeom, mat);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y + h / 2, z); // bottom-center pivot!
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  if (collidable) {
    boxes.push({
      min: new THREE.Vector3(x - w / 2, y, z - d / 2),
      max: new THREE.Vector3(x + w / 2, y + h, z + d / 2),
    });
  }

  return mesh;
}

function buildVoxelPineTree(group: THREE.Group, x: number, z: number, boxes: CollisionBox[]) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.85 });
  const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.8 });
  const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x3e7a35, roughness: 0.8 });

  // Trunk
  addVoxelBlock(group, boxes, 1.0, 3.5, 1.0, x, 0, z, trunkMat, true);

  // 3-tier foliage blocks
  addVoxelBlock(group, boxes, 4.2, 1.6, 4.2, x, 2.8, z, foliageMat1, false);
  addVoxelBlock(group, boxes, 3.2, 1.6, 3.2, x, 4.2, z, foliageMat2, false);
  addVoxelBlock(group, boxes, 2.0, 1.6, 2.0, x, 5.6, z, foliageMat1, false);
  addVoxelBlock(group, boxes, 1.0, 1.2, 1.0, x, 7.0, z, foliageMat2, false);
}

export function buildVoxelArena(): ArenaData {
  const group = new THREE.Group();
  const collisionBoxes: CollisionBox[] = [];
  const jumpPads: JumpPadConfig[] = [];
  const spawnPoints: THREE.Vector3[] = [];
  const pickupSpawns: Array<{ x: number; y: number; z: number; type: 'health' | 'armor' | 'ammo' | 'coin' }> = [];

  // Reusable procedural materials
  const stoneMat = new THREE.MeshStandardMaterial({
    map: createStoneBrickTexture(),
    roughness: 0.7,
    metalness: 0.1,
  });

  const floorMat = new THREE.MeshStandardMaterial({
    map: createArenaFloorTexture(),
    roughness: 0.5,
    metalness: 0.2,
  });
  if (floorMat.map) {
    floorMat.map.repeat.set(16, 16);
  }

  const grassSideMat = new THREE.MeshStandardMaterial({
    map: createGrassSideTexture(),
    roughness: 0.8,
  });
  const grassTopMat = new THREE.MeshStandardMaterial({
    map: createGrassTopTexture(),
    roughness: 0.8,
  });
  const grassCubeMaterials = [
    grassSideMat, // right
    grassSideMat, // left
    grassTopMat,  // top
    grassSideMat, // bottom
    grassSideMat, // front
    grassSideMat, // back
  ];

  const crateMat = new THREE.MeshStandardMaterial({
    map: createWoodCrateTexture(),
    roughness: 0.65,
    metalness: 0.1,
  });

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.65,
    roughness: 0.1,
    metalness: 0.1,
  });

  const towerWoodMat = new THREE.MeshStandardMaterial({ color: 0x694628, roughness: 0.8 });
  const platformMat = new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 0.75 });

  // 1. MAIN ARENA FLOOR (64 x 64 meters)
  const mainFloor = new THREE.Mesh(new THREE.BoxGeometry(64, 1.0, 64), floorMat);
  mainFloor.position.set(0, -0.5, 0);
  mainFloor.receiveShadow = true;
  group.add(mainFloor);

  // Outer Terrain Extension (120 x 120 meters) so world never cuts off abruptly
  const outerTerrain = new THREE.Mesh(new THREE.BoxGeometry(140, 1.0, 140), grassCubeMaterials);
  outerTerrain.position.set(0, -0.52, 0);
  outerTerrain.receiveShadow = true;
  group.add(outerTerrain);

  // 2. CENTRAL POOL (Homage to Pixel Gun 3D Pool Party!)
  // Sunken water pool
  const poolWater = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 14), waterMat);
  poolWater.position.set(0, 0.15, 0);
  group.add(poolWater);

  // Pool border stones
  addVoxelBlock(group, collisionBoxes, 16, 0.5, 1.0, 0, 0, -7.5, stoneMat);
  addVoxelBlock(group, collisionBoxes, 16, 0.5, 1.0, 0, 0, 7.5, stoneMat);
  addVoxelBlock(group, collisionBoxes, 1.0, 0.5, 14, -7.5, 0, 0, stoneMat);
  addVoxelBlock(group, collisionBoxes, 1.0, 0.5, 14, 7.5, 0, 0, stoneMat);

  // High Diving Board Tower (Iconic landmark vista!)
  addVoxelBlock(group, collisionBoxes, 1.5, 8.0, 1.5, -9.0, 0, 0, stoneMat);
  // Diving board plank
  addVoxelBlock(group, collisionBoxes, 5.0, 0.35, 1.6, -6.5, 8.0, 0, platformMat);

  // 3. NORTH SNIPER TOWER (Two-Story elevated fort)
  const northZ = -22;
  // 4 corner pillar posts
  addVoxelBlock(group, collisionBoxes, 1.2, 9.0, 1.2, -5.5, 0, northZ - 5.5, towerWoodMat);
  addVoxelBlock(group, collisionBoxes, 1.2, 9.0, 1.2, 5.5, 0, northZ - 5.5, towerWoodMat);
  addVoxelBlock(group, collisionBoxes, 1.2, 9.0, 1.2, -5.5, 0, northZ + 5.5, towerWoodMat);
  addVoxelBlock(group, collisionBoxes, 1.2, 9.0, 1.2, 5.5, 0, northZ + 5.5, towerWoodMat);
  // Floor 1 deck (at y = 4.5)
  addVoxelBlock(group, collisionBoxes, 12, 0.4, 12, 0, 4.5, northZ, platformMat);
  // Balcony railings
  addVoxelBlock(group, collisionBoxes, 12, 1.1, 0.4, 0, 4.9, northZ - 5.8, platformMat);
  addVoxelBlock(group, collisionBoxes, 12, 1.1, 0.4, 0, 4.9, northZ + 5.8, platformMat);
  addVoxelBlock(group, collisionBoxes, 0.4, 1.1, 12, -5.8, 4.9, northZ, platformMat);
  addVoxelBlock(group, collisionBoxes, 0.4, 1.1, 12, 5.8, 4.9, northZ, platformMat);
  // Roof canopy
  addVoxelBlock(group, collisionBoxes, 13, 0.5, 13, 0, 8.8, northZ, stoneMat, false);

  // 4. SOUTH SNIPER TOWER (Opposing base)
  const southZ = 22;
  addVoxelBlock(group, collisionBoxes, 1.2, 9.0, 1.2, -5.5, 0, southZ - 5.5, towerWoodMat);
  addVoxelBlock(group, collisionBoxes, 1.2, 9.0, 1.2, 5.5, 0, southZ - 5.5, towerWoodMat);
  addVoxelBlock(group, collisionBoxes, 1.2, 9.0, 1.2, -5.5, 0, southZ + 5.5, towerWoodMat);
  addVoxelBlock(group, collisionBoxes, 1.2, 9.0, 1.2, 5.5, 0, southZ + 5.5, towerWoodMat);
  // Floor deck
  addVoxelBlock(group, collisionBoxes, 12, 0.4, 12, 0, 4.5, southZ, platformMat);
  // Railings
  addVoxelBlock(group, collisionBoxes, 12, 1.1, 0.4, 0, 4.9, southZ - 5.8, platformMat);
  addVoxelBlock(group, collisionBoxes, 12, 1.1, 0.4, 0, 4.9, southZ + 5.8, platformMat);
  addVoxelBlock(group, collisionBoxes, 0.4, 1.1, 12, -5.8, 4.9, southZ, platformMat);
  addVoxelBlock(group, collisionBoxes, 0.4, 1.1, 12, 5.8, 4.9, southZ, platformMat);
  // Roof
  addVoxelBlock(group, collisionBoxes, 13, 0.5, 13, 0, 8.8, southZ, stoneMat, false);

  // 5. SKYWALK BRIDGES (Connecting East and West sniper perches)
  // East Fort
  addVoxelBlock(group, collisionBoxes, 8, 4.0, 8, 22, 0, 0, stoneMat);
  addVoxelBlock(group, collisionBoxes, 8.4, 1.1, 0.4, 22, 4.0, -4.0, stoneMat);
  addVoxelBlock(group, collisionBoxes, 8.4, 1.1, 0.4, 22, 4.0, 4.0, stoneMat);
  // West Fort
  addVoxelBlock(group, collisionBoxes, 8, 4.0, 8, -22, 0, 0, stoneMat);
  addVoxelBlock(group, collisionBoxes, 8.4, 1.1, 0.4, -22, 4.0, -4.0, stoneMat);
  addVoxelBlock(group, collisionBoxes, 8.4, 1.1, 0.4, -22, 4.0, 4.0, stoneMat);

  // 6. STRATEGIC JUMP PADS (Launch player onto towers & across the map!)
  jumpPads.push(
    { x: -9.0, y: 0, z: -10.0, power: 17.5 }, // launches to Diving board & North Tower
    { x: 9.0, y: 0, z: 10.0, power: 17.5 },  // launches to South Tower
    { x: 18.0, y: 0, z: -16.0, power: 16.0 }, // launches to East Fort
    { x: -18.0, y: 0, z: 16.0, power: 16.0 }  // launches to West Fort
  );

  // 7. VOXEL CRATE STACKS & BARRICADES (Tactical cover)
  const cratePositions: Array<[number, number, number, number]> = [
    // [x, z, countY, orientation]
    [-14, -6, 2, 0],
    [-14, -8, 1, 0],
    [14, 6, 2, 0],
    [14, 8, 1, 0],
    [-6, 14, 2, 0],
    [6, -14, 2, 0],
    [12, -18, 1, 0],
    [-12, 18, 1, 0],
    [-18, -12, 2, 0],
    [18, 12, 2, 0],
    [0, 14, 1, 0],
    [0, -14, 1, 0],
  ];

  cratePositions.forEach(([cx, cz, countY]) => {
    for (let cy = 0; cy < countY; cy++) {
      addVoxelBlock(group, collisionBoxes, 1.8, 1.8, 1.8, cx, cy * 1.8, cz, crateMat);
    }
  });

  // Stone tactical barricades
  addVoxelBlock(group, collisionBoxes, 6, 1.4, 0.8, -12, 0, 10, stoneMat);
  addVoxelBlock(group, collisionBoxes, 6, 1.4, 0.8, 12, 0, -10, stoneMat);
  addVoxelBlock(group, collisionBoxes, 0.8, 1.4, 6, -10, 0, -12, stoneMat);
  addVoxelBlock(group, collisionBoxes, 0.8, 1.4, 6, 10, 0, 12, stoneMat);

  // 8. ARENA PERIMETER BOUNDARY WALLS & CLIFFS
  // 4 Main perimeter stone walls with battlement crenellations
  const halfSize = 31;
  const wallH = 4.5;
  // North
  addVoxelBlock(group, collisionBoxes, 62, wallH, 1.5, 0, 0, -halfSize, stoneMat);
  // South
  addVoxelBlock(group, collisionBoxes, 62, wallH, 1.5, 0, 0, halfSize, stoneMat);
  // West
  addVoxelBlock(group, collisionBoxes, 1.5, wallH, 62, -halfSize, 0, 0, stoneMat);
  // East
  addVoxelBlock(group, collisionBoxes, 1.5, wallH, 62, halfSize, 0, 0, stoneMat);

  // 9. SURROUNDING PINE FOREST & NATURAL VOXEL CLIFFS (Outdoor horizon)
  const treeCoords = [
    [-38, -38], [-34, -45], [-44, -34], [38, -38], [45, -34], [34, -45],
    [-38, 38], [-34, 45], [-44, 34], [38, 38], [45, 34], [34, 45],
    [-46, 0], [-52, 10], [-50, -12], [46, 0], [52, -10], [50, 12],
    [0, -48], [12, -52], [-14, -50], [0, 48], [-12, 52], [14, 50],
  ];
  treeCoords.forEach(([tx, tz]) => {
    buildVoxelPineTree(group, tx, tz, collisionBoxes);
  });

  // 10. SPAWN POINTS FOR ENEMIES
  spawnPoints.push(
    new THREE.Vector3(-24, 0.5, -24),
    new THREE.Vector3(24, 0.5, -24),
    new THREE.Vector3(-24, 0.5, 24),
    new THREE.Vector3(24, 0.5, 24),
    new THREE.Vector3(0, 0.5, -26),
    new THREE.Vector3(0, 0.5, 26),
    new THREE.Vector3(-26, 0.5, 0),
    new THREE.Vector3(26, 0.5, 0),
    new THREE.Vector3(0, 5.0, -22), // top of North tower
    new THREE.Vector3(0, 5.0, 22)   // top of South tower
  );

  // 11. ITEM PICKUP SPAWN LOCATIONS
  pickupSpawns.push(
    { x: -9, y: 8.6, z: 0, type: 'coin' }, // On diving board!
    { x: 0, y: 5.2, z: -22, type: 'ammo' }, // North tower
    { x: 0, y: 5.2, z: 22, type: 'ammo' },  // South tower
    { x: 22, y: 4.6, z: 0, type: 'armor' }, // East Fort
    { x: -22, y: 4.6, z: 0, type: 'health' }, // West Fort
    { x: -14, y: 0.5, z: 0, type: 'coin' },
    { x: 14, y: 0.5, z: 0, type: 'coin' },
    { x: 0, y: 0.5, z: 12, type: 'health' },
    { x: 0, y: 0.5, z: -12, type: 'armor' }
  );

  return {
    group,
    collisionBoxes,
    jumpPads,
    spawnPoints,
    pickupSpawns,
  };
}
