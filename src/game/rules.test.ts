import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePlayerDamage,
  calculateEnemyDamage,
  calculateExplosionDamage,
  calculateWeaponUpgrade,
  generateWaveConfig,
  isEntityOnJumpPad,
  canMeleeAttackTarget,
  calculateDirectionalDamageSplatter,
  BASE_WEAPONS,
} from './rules';

test('calculatePlayerDamage absorbs damage into armor before health', () => {
  const result = calculatePlayerDamage(100, 100, 50);
  // clampedDamage = 100
  // armorAbsorption = min(50, 65) = 50
  // remainingDamage = 100 - 50 = 50
  // finalArmor = 0, finalHp = 50
  assert.equal(result.finalArmor, 0);
  assert.equal(result.finalHp, 50);
  assert.equal(result.hpLost, 50);
  assert.equal(result.armorLost, 50);
});

test('calculatePlayerDamage when armor is 0 deals direct health loss', () => {
  const result = calculatePlayerDamage(35, 80, 0);
  assert.equal(result.finalArmor, 0);
  assert.equal(result.finalHp, 45);
  assert.equal(result.hpLost, 35);
});

test('calculateEnemyDamage applies headshot critical multiplier', () => {
  const bodyHit = calculateEnemyDamage(30, false, 1);
  assert.equal(bodyHit.damage, 30);
  assert.equal(bodyHit.isCrit, false);

  const headHit = calculateEnemyDamage(30, true, 1);
  assert.equal(headHit.damage, 60);
  assert.equal(headHit.isCrit, true);
});

test('calculateExplosionDamage scales by distance and pushes upward for rocket jumping', () => {
  const centerPos = { x: 0, y: 0, z: 0 };
  const playerPos = { x: 0, y: 0.5, z: 0 }; // player standing slightly above rocket impact

  const result = calculateExplosionDamage(centerPos, playerPos, 100, 5);
  assert.ok(result.damage > 70);
  assert.ok(result.impulse.y > 0, 'Rocket explosion must impart upward vertical velocity');

  // Out of range should deal 0 damage
  const farPos = { x: 10, y: 0, z: 0 };
  const farResult = calculateExplosionDamage(centerPos, farPos, 100, 5);
  assert.equal(farResult.damage, 0);
});

test('calculateWeaponUpgrade calculates higher level stats and cost', () => {
  const ak = BASE_WEAPONS.pixel_ak47;
  const upgrade = calculateWeaponUpgrade(ak);
  assert.equal(upgrade.nextLevel, 2);
  assert.ok(upgrade.upgradeCost > 100);
  assert.ok(upgrade.newDamage > ak.damage);
  assert.ok(upgrade.newMagSize >= ak.magSize);
});

test('generateWaveConfig generates increasing enemy counts and diverse archetypes', () => {
  const wave1 = generateWaveConfig(1);
  const wave5 = generateWaveConfig(5);

  assert.ok(wave5.totalEnemies > wave1.totalEnemies);
  assert.ok(wave5.types.some(t => t.type === 'heavy_golem'));
  assert.ok(wave5.waveName.includes('BOSS'));
});

test('isEntityOnJumpPad accurately detects bounding box intersection', () => {
  const pad = { x: 10, y: 1, z: 10 };
  assert.equal(isEntityOnJumpPad({ x: 10, y: 1.2, z: 10 }, pad), true);
  assert.equal(isEntityOnJumpPad({ x: 15, y: 1.2, z: 10 }, pad), false);
  assert.equal(isEntityOnJumpPad({ x: 10, y: 5.0, z: 10 }, pad), false);
});

test('canMeleeAttackTarget requires horizontal AND vertical proximity (no hitting players in air)', () => {
  const zombieOnFloor = { x: 5, y: 0, z: 5 };
  const playerOnFloor = { x: 5.8, y: 1.8, z: 5.5 }; // eye height 1.8 => torso y 0.9 => dy 0.9
  assert.equal(canMeleeAttackTarget(zombieOnFloor, playerOnFloor), true);

  // Player jumping or on diving board 5m up in the air
  const playerInAir = { x: 5.2, y: 6.8, z: 5.2 };
  assert.equal(canMeleeAttackTarget(zombieOnFloor, playerInAir), false, 'Zombie on floor must not hit airborne player');

  // Player too far horizontally
  const playerFar = { x: 12, y: 1.8, z: 5 };
  assert.equal(canMeleeAttackTarget(zombieOnFloor, playerFar), false);
});

test('calculateDirectionalDamageSplatter maps angles to correct screen edges', () => {
  // Front hit (0 deg) -> top edge
  const front = calculateDirectionalDamageSplatter(0, 0, 750);
  assert.equal(front.focalX, 50);
  assert.equal(front.focalY, 6);
  assert.ok(front.topIntensity > 0.9);
  assert.equal(front.bottomIntensity, 0);

  // Right hit (90 deg) -> right edge
  const right = calculateDirectionalDamageSplatter(90, 0, 750);
  assert.equal(front.rightIntensity, 0);
  assert.equal(right.focalX, 94);
  assert.equal(right.focalY, 50);
  assert.ok(right.rightIntensity > 0.9);
  assert.equal(right.leftIntensity, 0);

  // Left hit (-90 deg) -> left edge
  const left = calculateDirectionalDamageSplatter(-90, 0, 750);
  assert.equal(left.focalX, 6);
  assert.equal(left.focalY, 50);
  assert.ok(left.leftIntensity > 0.9);

  // Behind hit (180 deg) -> bottom edge
  const behind = calculateDirectionalDamageSplatter(180, 0, 750);
  assert.equal(behind.focalX, 50);
  assert.equal(behind.focalY, 94);
  assert.ok(behind.bottomIntensity > 0.9);

  // Decay after durationMs
  const faded = calculateDirectionalDamageSplatter(0, 750, 750);
  assert.equal(faded.intensity, 0);
});
