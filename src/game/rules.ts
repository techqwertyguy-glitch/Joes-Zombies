/**
 * Core game rules, formulas, and deterministic mechanics
 * Decoupled from Three.js and React for ultra-fast unit testing.
 */

export interface WeaponStats {
  id: string;
  name: string;
  category: 'primary' | 'backup' | 'melee' | 'special' | 'sniper';
  damage: number;
  fireRate: number; // shots per second
  magSize: number;
  reloadTime: number; // seconds
  range: number;
  spread: number; // radians
  pellets: number; // pellets per shot (e.g. 6 for shotgun)
  isAutomatic: boolean;
  isExplosive?: boolean;
  explosionRadius?: number;
  cost: number;
  unlocked: boolean;
  level: number;
}

export interface EnemyTypeConfig {
  id: string;
  name: string;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  attackCooldown: number; // seconds
  scoreValue: number;
  coinValue: number;
  isRanged?: boolean;
  projectileSpeed?: number;
}

export const BASE_WEAPONS: Record<string, WeaponStats> = {
  combat_knife: {
    id: 'combat_knife',
    name: 'Pixel Combat Knife',
    category: 'melee',
    damage: 65,
    fireRate: 2.2,
    magSize: 1, // infinite
    reloadTime: 0,
    range: 3.2,
    spread: 0,
    pellets: 1,
    isAutomatic: false,
    cost: 0,
    unlocked: true,
    level: 1,
  },
  pixel_pistol: {
    id: 'pixel_pistol',
    name: 'Pixel Fast Pistol',
    category: 'backup',
    damage: 26,
    fireRate: 4.5,
    magSize: 12,
    reloadTime: 1.2,
    range: 45,
    spread: 0.02,
    pellets: 1,
    isAutomatic: false,
    cost: 0,
    unlocked: true,
    level: 1,
  },
  pixel_ak47: {
    id: 'pixel_ak47',
    name: 'Pixel Combat Rifle',
    category: 'primary',
    damage: 32,
    fireRate: 8.5,
    magSize: 30,
    reloadTime: 1.8,
    range: 55,
    spread: 0.04,
    pellets: 1,
    isAutomatic: true,
    cost: 150,
    unlocked: true,
    level: 1,
  },
  pixel_shotgun: {
    id: 'pixel_shotgun',
    name: 'Block Breaker Shotgun',
    category: 'primary',
    damage: 16, // per pellet
    fireRate: 1.4,
    magSize: 8,
    reloadTime: 2.2,
    range: 28,
    spread: 0.08,
    pellets: 6, // 16 * 6 = 96 max damage
    isAutomatic: false,
    cost: 300,
    unlocked: false,
    level: 1,
  },
  pixel_sniper: {
    id: 'pixel_sniper',
    name: 'Voxel Scout Sniper',
    category: 'sniper',
    damage: 95,
    fireRate: 1.1,
    magSize: 5,
    reloadTime: 2.5,
    range: 120,
    spread: 0.005,
    pellets: 1,
    isAutomatic: false,
    cost: 500,
    unlocked: false,
    level: 1,
  },
  rocket_jumper: {
    id: 'rocket_jumper',
    name: 'Rocket Jumper 3D',
    category: 'special',
    damage: 110,
    fireRate: 1.0,
    magSize: 4,
    reloadTime: 2.6,
    range: 80,
    spread: 0.01,
    pellets: 1,
    isAutomatic: false,
    isExplosive: true,
    explosionRadius: 5.5,
    cost: 750,
    unlocked: false,
    level: 1,
  },
  prototype_laser: {
    id: 'prototype_laser',
    name: 'Prototype Laser Cannon',
    category: 'special',
    damage: 140,
    fireRate: 1.5,
    magSize: 6,
    reloadTime: 2.4,
    range: 100,
    spread: 0.002,
    pellets: 1,
    isAutomatic: false,
    cost: 1000,
    unlocked: false,
    level: 1,
  },
};

export const ENEMY_CONFIGS: Record<string, EnemyTypeConfig> = {
  swarmer_zombie: {
    id: 'swarmer_zombie',
    name: 'Block Zombie',
    maxHp: 75,
    speed: 5.5,
    damage: 18,
    attackRange: 2.2,
    attackCooldown: 0.9,
    scoreValue: 100,
    coinValue: 15,
  },
  pixel_gunner: {
    id: 'pixel_gunner',
    name: 'Pixel Mercenary',
    maxHp: 90,
    speed: 4.2,
    damage: 12,
    attackRange: 16.0,
    attackCooldown: 1.4,
    scoreValue: 180,
    coinValue: 25,
    isRanged: true,
    projectileSpeed: 22.0,
  },
  heavy_golem: {
    id: 'heavy_golem',
    name: 'Iron Voxel Golem',
    maxHp: 320,
    speed: 3.2,
    damage: 35,
    attackRange: 3.0,
    attackCooldown: 1.8,
    scoreValue: 400,
    coinValue: 60,
  },
  aerial_drone: {
    id: 'aerial_drone',
    name: 'Cyber Drone',
    maxHp: 65,
    speed: 4.8,
    damage: 15,
    attackRange: 14.0,
    attackCooldown: 1.2,
    scoreValue: 220,
    coinValue: 30,
    isRanged: true,
    projectileSpeed: 18.0,
  },
};

/**
 * Calculate damage applied to player with armor absorption.
 * Armor absorbs 65% of damage until depleted.
 */
export function calculatePlayerDamage(
  incomingDamage: number,
  currentHp: number,
  currentArmor: number
): { finalHp: number; finalArmor: number; hpLost: number; armorLost: number } {
  const clampedDamage = Math.max(0, incomingDamage);
  if (currentArmor <= 0) {
    const finalHp = Math.max(0, currentHp - clampedDamage);
    return {
      finalHp,
      finalArmor: 0,
      hpLost: currentHp - finalHp,
      armorLost: 0,
    };
  }

  const armorAbsorption = Math.min(currentArmor, clampedDamage * 0.65);
  const remainingDamage = clampedDamage - armorAbsorption;

  const finalArmor = Math.max(0, currentArmor - armorAbsorption);
  const finalHp = Math.max(0, currentHp - remainingDamage);

  return {
    finalHp,
    finalArmor,
    hpLost: currentHp - finalHp,
    armorLost: currentArmor - finalArmor,
  };
}

/**
 * Calculate enemy damage with headshot multiplier.
 */
export function calculateEnemyDamage(
  baseDamage: number,
  isHeadshot: boolean,
  weaponLevel: number = 1
): { damage: number; isCrit: boolean } {
  const levelMultiplier = 1 + (weaponLevel - 1) * 0.15;
  const rawDamage = baseDamage * levelMultiplier;
  if (isHeadshot) {
    return {
      damage: Math.round(rawDamage * 2.0),
      isCrit: true,
    };
  }
  return {
    damage: Math.round(rawDamage),
    isCrit: false,
  };
}

/**
 * Calculate rocket blast radius damage and knockback impulse.
 */
export function calculateExplosionDamage(
  explosionPos: { x: number; y: number; z: number },
  targetPos: { x: number; y: number; z: number },
  maxDamage: number,
  radius: number
): { damage: number; impulse: { x: number; y: number; z: number } } {
  const dx = targetPos.x - explosionPos.x;
  const dy = targetPos.y - explosionPos.y;
  const dz = targetPos.z - explosionPos.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (dist >= radius) {
    return { damage: 0, impulse: { x: 0, y: 0, z: 0 } };
  }

  const falloff = 1 - dist / radius; // 1 at center, 0 at edge
  const damage = Math.round(maxDamage * Math.pow(falloff, 1.2));

  // Safe normalize
  const safeDist = Math.max(dist, 0.2);
  const force = 14 * falloff;
  const impulse = {
    x: (dx / safeDist) * force,
    y: Math.max((dy / safeDist) * force, force * 0.8), // give upward pop for rocket jumping!
    z: (dz / safeDist) * force,
  };

  return { damage, impulse };
}

/**
 * Calculate weapon upgrade cost and new stats.
 */
export function calculateWeaponUpgrade(
  weapon: WeaponStats
): { nextLevel: number; upgradeCost: number; newDamage: number; newMagSize: number } {
  const nextLevel = weapon.level + 1;
  const upgradeCost = Math.round((weapon.cost || 100) * 0.5 * nextLevel + 50);
  const newDamage = Math.round(weapon.damage * 1.15);
  const newMagSize = weapon.magSize > 1 ? Math.round(weapon.magSize * 1.2) : 1;
  return { nextLevel, upgradeCost, newDamage, newMagSize };
}

/**
 * Determine wave configuration (number of enemies and archetype blend).
 */
export function generateWaveConfig(wave: number): {
  totalEnemies: number;
  types: Array<{ type: string; count: number }>;
  waveName: string;
} {
  const totalEnemies = Math.min(8 + wave * 4, 45);

  let swarmerRatio = 0.6;
  let gunnerRatio = 0.3;
  let golemCount = 0;
  let droneCount = 0;

  if (wave >= 2) {
    droneCount = Math.floor(wave * 1.2);
  }
  if (wave >= 3) {
    golemCount = Math.floor(wave * 0.6);
  }

  const specialCount = droneCount + golemCount;
  const remaining = Math.max(4, totalEnemies - specialCount);

  if (wave >= 4) {
    swarmerRatio = 0.45;
    gunnerRatio = 0.55;
  }

  const swarmers = Math.round(remaining * swarmerRatio);
  const gunners = Math.max(1, remaining - swarmers);

  const types: Array<{ type: string; count: number }> = [
    { type: 'swarmer_zombie', count: swarmers },
    { type: 'pixel_gunner', count: gunners },
  ];

  if (droneCount > 0) {
    types.push({ type: 'aerial_drone', count: droneCount });
  }
  if (golemCount > 0) {
    types.push({ type: 'heavy_golem', count: golemCount });
  }

  const isBossWave = wave % 5 === 0;
  const waveName = isBossWave ? `WAVE ${wave} - BOSS INVASION` : `WAVE ${wave}`;

  return {
    totalEnemies: types.reduce((acc, t) => acc + t.count, 0),
    types,
    waveName,
  };
}

/**
 * Checks jump pad bounding collision.
 */
export function isEntityOnJumpPad(
  entityPos: { x: number; y: number; z: number },
  padPos: { x: number; y: number; z: number },
  padSize: number = 2.4
): boolean {
  const halfSize = padSize / 2;
  const inX = Math.abs(entityPos.x - padPos.x) <= halfSize;
  const inZ = Math.abs(entityPos.z - padPos.z) <= halfSize;
  const inY = entityPos.y >= padPos.y - 0.2 && entityPos.y <= padPos.y + 0.8;
  return inX && inZ && inY;
}

/**
 * Checks whether an enemy melee attack can reach the target.
 * Requires both horizontal proximity and vertical reach (prevents hitting players high in the air).
 */
export function canMeleeAttackTarget(
  enemyPos: { x: number; y: number; z: number },
  targetPos: { x: number; y: number; z: number },
  maxFlatDist: number = 2.2,
  maxVerticalDist: number = 1.6
): boolean {
  const dx = targetPos.x - enemyPos.x;
  const dz = targetPos.z - enemyPos.z;
  const flatDist = Math.sqrt(dx * dx + dz * dz);
  // Target position is eye height (player height ~1.8), target base is y - 0.9 (torso)
  const dy = Math.abs(enemyPos.y - (targetPos.y - 0.9));
  return flatDist <= maxFlatDist && dy <= maxVerticalDist;
}

export interface DirectionalSplatterData {
  focalX: number; // percentage 0-100 across screen width
  focalY: number; // percentage 0-100 across screen height
  dirX: number; // -1 (left) to 1 (right)
  dirY: number; // -1 (top) to 1 (bottom)
  intensity: number; // 0 to 1 decay
  topIntensity: number; // 0 to 1
  rightIntensity: number; // 0 to 1
  bottomIntensity: number; // 0 to 1
  leftIntensity: number; // 0 to 1
  gradientCss: string;
}

/**
 * Calculates screen-edge focal coordinates and directional bleeding weights
 * based on the incoming damage bearing angle (-180 to 180 degrees from forward view).
 */
export function calculateDirectionalDamageSplatter(
  damageAngleDeg: number,
  elapsedMs: number,
  durationMs: number = 750
): DirectionalSplatterData {
  const progress = Math.min(1, Math.max(0, elapsedMs / durationMs));
  // Fast flash with smooth non-linear decay
  const intensity = Math.pow(1 - progress, 1.4);

  // Convert angle (0 = front/top, 90 = right, -90 = left, 180 = behind/bottom) to radians
  const rad = (damageAngleDeg * Math.PI) / 180;
  const dirX = Math.sin(rad); // -1 (left) to +1 (right)
  const dirY = -Math.cos(rad); // -1 (top) to +1 (bottom)

  // Edge focal coordinates (mapped to ~6% to 94% on screen edges)
  const focalX = Math.round(50 + dirX * 44);
  const focalY = Math.round(50 + dirY * 44);

  // Directional edge intensities
  const topIntensity = Math.max(0, -dirY) * intensity;
  const bottomIntensity = Math.max(0, dirY) * intensity;
  const leftIntensity = Math.max(0, -dirX) * intensity;
  const rightIntensity = Math.max(0, dirX) * intensity;

  // Primary directional radial gradient centered at the impact edge
  const alpha1 = (0.85 * intensity).toFixed(2);
  const alpha2 = (0.55 * intensity).toFixed(2);
  const alpha3 = (0.22 * intensity).toFixed(2);
  const gradientCss = `radial-gradient(circle at ${focalX}% ${focalY}%, rgba(220, 38, 38, ${alpha1}) 0%, rgba(153, 27, 27, ${alpha2}) 30%, rgba(69, 10, 10, ${alpha3}) 60%, transparent 85%)`;

  return {
    focalX,
    focalY,
    dirX,
    dirY,
    intensity,
    topIntensity,
    rightIntensity,
    bottomIntensity,
    leftIntensity,
    gradientCss,
  };
}

