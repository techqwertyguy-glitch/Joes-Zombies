import * as THREE from 'three';
import { CharacterPartConfig } from './characterConfig';

const boxGeom = new THREE.BoxGeometry(1, 1, 1);

function makeVoxel(
  w: number,
  h: number,
  d: number,
  color: string | number,
  roughness: number = 0.6,
  metalness: number = 0.1,
  emissive?: string | number,
  emissiveIntensity: number = 0.5
): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    color: typeof color === 'string' ? new THREE.Color(color) : color,
    roughness,
    metalness,
    ...(emissive
      ? {
          emissive: typeof emissive === 'string' ? new THREE.Color(emissive) : emissive,
          emissiveIntensity,
        }
      : {}),
  });
  const mesh = new THREE.Mesh(boxGeom, mat);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export interface BuiltVoxelCharacter {
  group: THREE.Group;
  headGroup: THREE.Group;
  torsoGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  leftLegGroup: THREE.Group;
  rightLegGroup: THREE.Group;
  accessoryGroup: THREE.Group;
}

export function buildCustomVoxelCharacter(config: CharacterPartConfig): BuiltVoxelCharacter {
  const root = new THREE.Group();

  // Root groups for animation/articulation
  const headGroup = new THREE.Group();
  const torsoGroup = new THREE.Group();
  const leftArmGroup = new THREE.Group();
  const rightArmGroup = new THREE.Group();
  const leftLegGroup = new THREE.Group();
  const rightLegGroup = new THREE.Group();
  const accessoryGroup = new THREE.Group();

  root.add(torsoGroup);
  root.add(headGroup);
  root.add(leftArmGroup);
  root.add(rightArmGroup);
  root.add(leftLegGroup);
  root.add(rightLegGroup);
  root.add(accessoryGroup);

  // Positions
  torsoGroup.position.set(0, 1.25, 0);
  headGroup.position.set(0, 1.95, 0);
  leftArmGroup.position.set(-0.58, 1.6, 0);
  rightArmGroup.position.set(0.58, 1.6, 0);
  leftLegGroup.position.set(-0.22, 0.85, 0);
  rightLegGroup.position.set(0.22, 0.85, 0);
  accessoryGroup.position.set(0, 1.35, 0);

  // ==========================================
  // 1. HEAD STYLES
  // ==========================================
  const skin = config.skinColor;
  const hairHelm = config.hairHelmetColor;
  const glow = config.accentGlowColor;

  // Base head cube (anchored at center)
  const baseHead = makeVoxel(0.65, 0.65, 0.65, skin, 0.7, 0.05);
  headGroup.add(baseHead);

  if (config.headStyle === 'hero') {
    // Hair cap
    const hairTop = makeVoxel(0.68, 0.18, 0.68, hairHelm, 0.85);
    hairTop.position.set(0, 0.28, 0);
    const hairBack = makeVoxel(0.68, 0.45, 0.16, hairHelm, 0.85);
    hairBack.position.set(0, 0.1, 0.28);
    const hairBangs = makeVoxel(0.68, 0.14, 0.14, hairHelm, 0.85);
    hairBangs.position.set(0, 0.26, -0.28);
    headGroup.add(hairTop, hairBack, hairBangs);

    // Pixel Eyes
    const eyeWhiteL = makeVoxel(0.12, 0.1, 0.02, 0xffffff);
    eyeWhiteL.position.set(-0.16, 0.02, -0.33);
    const eyePupilL = makeVoxel(0.06, 0.1, 0.03, 0x1e293b);
    eyePupilL.position.set(-0.14, 0.02, -0.335);

    const eyeWhiteR = makeVoxel(0.12, 0.1, 0.02, 0xffffff);
    eyeWhiteR.position.set(0.16, 0.02, -0.33);
    const eyePupilR = makeVoxel(0.06, 0.1, 0.03, 0x1e293b);
    eyePupilR.position.set(0.14, 0.02, -0.335);

    // Mouth
    const mouth = makeVoxel(0.16, 0.04, 0.02, 0xa16207);
    mouth.position.set(0, -0.16, -0.33);

    headGroup.add(eyeWhiteL, eyePupilL, eyeWhiteR, eyePupilR, mouth);
  } else if (config.headStyle === 'helmet') {
    // Military tactical helmet
    const helmTop = makeVoxel(0.72, 0.24, 0.72, hairHelm, 0.5, 0.4);
    helmTop.position.set(0, 0.26, 0);
    const helmBack = makeVoxel(0.72, 0.48, 0.18, hairHelm, 0.5, 0.4);
    helmBack.position.set(0, 0.1, 0.28);
    // Tinted tactical visor
    const visor = makeVoxel(0.68, 0.18, 0.15, glow, 0.2, 0.6, glow, 0.6);
    visor.position.set(0, 0.04, -0.28);
    // Chin strap
    const chin = makeVoxel(0.68, 0.08, 0.06, hairHelm, 0.6);
    chin.position.set(0, -0.26, -0.28);
    headGroup.add(helmTop, helmBack, visor, chin);
  } else if (config.headStyle === 'cyborg') {
    // Cyber skull plating
    const skullPlate = makeVoxel(0.38, 0.68, 0.68, hairHelm, 0.3, 0.85);
    skullPlate.position.set(0.16, 0, 0);
    // Glowing neon cyber visor / optic scanner
    const opticBand = makeVoxel(0.7, 0.12, 0.2, glow, 0.1, 0.5, glow, 0.9);
    opticBand.position.set(0, 0.05, -0.26);
    // Audio cyber ear jack
    const earJack = makeVoxel(0.12, 0.22, 0.22, 0x0f172a, 0.3, 0.8);
    earJack.position.set(0.36, 0.02, 0);
    headGroup.add(skullPlate, opticBand, earJack);
  } else if (config.headStyle === 'zombie') {
    // Rotting hair tufts
    const tuft1 = makeVoxel(0.3, 0.2, 0.3, hairHelm);
    tuft1.position.set(-0.16, 0.32, -0.1);
    const tuft2 = makeVoxel(0.24, 0.16, 0.35, hairHelm);
    tuft2.position.set(0.18, 0.3, 0.1);
    // Evil red/yellow bloodshot eyes
    const eyeL = makeVoxel(0.14, 0.12, 0.03, 0xef4444, 0.4, 0.1, 0xdc2626, 0.5);
    eyeL.position.set(-0.16, 0.04, -0.33);
    const eyeR = makeVoxel(0.14, 0.12, 0.03, 0xfacc15, 0.4, 0.1, 0xeab308, 0.5);
    eyeR.position.set(0.16, 0.04, -0.33);
    // Exposed pixel tooth
    const mouth = makeVoxel(0.24, 0.08, 0.02, 0x1f2937);
    mouth.position.set(0, -0.16, -0.33);
    const tooth = makeVoxel(0.06, 0.06, 0.03, 0xf9fafb);
    tooth.position.set(0.06, -0.14, -0.335);
    headGroup.add(tuft1, tuft2, eyeL, eyeR, mouth, tooth);
  } else if (config.headStyle === 'knight') {
    // Plated iron helm
    const helm = makeVoxel(0.72, 0.72, 0.72, hairHelm, 0.35, 0.85);
    // Horizontal eye visor slit
    const slit = makeVoxel(0.55, 0.08, 0.04, 0x0f172a);
    slit.position.set(0, 0.04, -0.37);
    // Crest ridge
    const crest = makeVoxel(0.12, 0.22, 0.75, glow, 0.25, 0.9);
    crest.position.set(0, 0.42, 0);
    headGroup.add(helm, slit, crest);
  } else if (config.headStyle === 'wizard') {
    // Tall pointed wizard hat with wide brim
    const brim = makeVoxel(0.95, 0.08, 0.95, hairHelm, 0.8);
    brim.position.set(0, 0.34, 0);
    const hatBase = makeVoxel(0.6, 0.35, 0.6, hairHelm, 0.8);
    hatBase.position.set(0, 0.52, 0);
    const hatMid = makeVoxel(0.42, 0.35, 0.42, hairHelm, 0.8);
    hatMid.position.set(0, 0.82, -0.04);
    const hatTip = makeVoxel(0.22, 0.35, 0.22, hairHelm, 0.8);
    hatTip.position.set(0, 1.12, -0.1);
    // Hat ribbon band
    const ribbon = makeVoxel(0.64, 0.08, 0.64, glow, 0.4, 0.2, glow, 0.5);
    ribbon.position.set(0, 0.38, 0);
    // Flowing wizard beard
    const beard = makeVoxel(0.45, 0.45, 0.14, 0xe2e8f0, 0.8);
    beard.position.set(0, -0.28, -0.3);
    headGroup.add(brim, hatBase, hatMid, hatTip, ribbon, beard);
  }

  // ==========================================
  // 2. TORSO STYLES
  // ==========================================
  const torsoPri = config.torsoPrimaryColor;
  const torsoSec = config.torsoSecondaryColor;

  // Base torso block (0.8 wide, 0.9 high, 0.45 deep)
  const baseTorso = makeVoxel(0.8, 0.9, 0.45, torsoPri, 0.65);
  torsoGroup.add(baseTorso);

  if (config.torsoStyle === 'vest') {
    // Heavy tactical plate carrier
    const chestPlate = makeVoxel(0.74, 0.48, 0.12, torsoSec, 0.4, 0.5);
    chestPlate.position.set(0, 0.12, -0.22);
    // Ammo pouches
    const pouch1 = makeVoxel(0.18, 0.18, 0.1, 0x1e293b);
    pouch1.position.set(-0.24, -0.24, -0.23);
    const pouch2 = makeVoxel(0.18, 0.18, 0.1, 0x1e293b);
    pouch2.position.set(0, -0.24, -0.23);
    const pouch3 = makeVoxel(0.18, 0.18, 0.1, 0x1e293b);
    pouch3.position.set(0.24, -0.24, -0.23);
    // Shoulder straps
    const strapL = makeVoxel(0.16, 0.12, 0.46, torsoSec);
    strapL.position.set(-0.3, 0.42, 0);
    const strapR = makeVoxel(0.16, 0.12, 0.46, torsoSec);
    strapR.position.set(0.3, 0.42, 0);
    torsoGroup.add(chestPlate, pouch1, pouch2, pouch3, strapL, strapR);
  } else if (config.torsoStyle === 'cyber') {
    // Cyber armored chassis with glowing core
    const armorPlates = makeVoxel(0.76, 0.75, 0.12, torsoSec, 0.35, 0.85);
    armorPlates.position.set(0, 0.05, -0.22);
    // Central power arc reactor core
    const core = makeVoxel(0.24, 0.24, 0.14, glow, 0.1, 0.2, glow, 0.9);
    core.position.set(0, 0.12, -0.23);
    // Lateral power conduits
    const conduitL = makeVoxel(0.08, 0.35, 0.08, glow, 0.1, 0.2, glow, 0.6);
    conduitL.position.set(-0.28, 0.05, -0.22);
    const conduitR = makeVoxel(0.08, 0.35, 0.08, glow, 0.1, 0.2, glow, 0.6);
    conduitR.position.set(0.28, 0.05, -0.22);
    torsoGroup.add(armorPlates, core, conduitL, conduitR);
  } else if (config.torsoStyle === 'hoodie') {
    // Hoodie zipper line & folded hood
    const zipper = makeVoxel(0.06, 0.88, 0.04, torsoSec, 0.3, 0.7);
    zipper.position.set(0, 0, -0.23);
    const hoodBack = makeVoxel(0.65, 0.25, 0.16, torsoPri, 0.8);
    hoodBack.position.set(0, 0.38, 0.22);
    // Kangaroo pouch pocket
    const pouch = makeVoxel(0.6, 0.25, 0.06, torsoSec, 0.7);
    pouch.position.set(0, -0.25, -0.23);
    torsoGroup.add(zipper, hoodBack, pouch);
  } else if (config.torsoStyle === 'tunic') {
    // Flowing tunic with belt & gold buckle
    const belt = makeVoxel(0.82, 0.14, 0.47, 0x451a03);
    belt.position.set(0, -0.32, 0);
    const buckle = makeVoxel(0.18, 0.16, 0.5, torsoSec, 0.25, 0.9);
    buckle.position.set(0, -0.32, 0);
    // Heraldic diagonal sash
    const sash = makeVoxel(0.2, 0.88, 0.47, torsoSec);
    sash.position.set(0, 0, 0);
    sash.rotation.z = -0.35;
    torsoGroup.add(belt, buckle, sash);
  } else if (config.torsoStyle === 'harness') {
    // Dual bandolier harness with brass buckles
    const bando1 = makeVoxel(0.14, 0.88, 0.47, torsoSec, 0.8);
    bando1.rotation.z = 0.45;
    const bando2 = makeVoxel(0.14, 0.88, 0.47, torsoSec, 0.8);
    bando2.rotation.z = -0.45;
    torsoGroup.add(bando1, bando2);
  }

  // ==========================================
  // 3. ARMS STYLES
  // ==========================================
  const armsPri = config.armsColor;
  const gloves = config.glovesColor;

  const buildArm = (isLeft: boolean, targetGroup: THREE.Group) => {
    // Arm pivot is at shoulder top (y = 0 in group, arm extends down to -0.85)
    if (config.armsStyle === 'bionic') {
      // Chrome / bionic segments with glowing joint rings
      const bionicSleeve = makeVoxel(0.3, 0.4, 0.3, armsPri, 0.3, 0.85);
      bionicSleeve.position.set(0, -0.2, 0);
      const jointRing = makeVoxel(0.32, 0.08, 0.32, glow, 0.1, 0.2, glow, 0.8);
      jointRing.position.set(0, -0.42, 0);
      const bionicForearm = makeVoxel(0.28, 0.4, 0.28, gloves, 0.3, 0.9);
      bionicForearm.position.set(0, -0.65, 0);
      targetGroup.add(bionicSleeve, jointRing, bionicForearm);
    } else if (config.armsStyle === 'gauntlets') {
      // Armored gauntlets
      const sleeve = makeVoxel(0.3, 0.42, 0.3, armsPri);
      sleeve.position.set(0, -0.21, 0);
      const heavyGauntlet = makeVoxel(0.34, 0.45, 0.34, gloves, 0.35, 0.8);
      heavyGauntlet.position.set(0, -0.64, 0);
      // Knuckle guard
      const knuckle = makeVoxel(0.36, 0.1, 0.1, glow, 0.3, 0.7);
      knuckle.position.set(0, -0.75, -0.12);
      targetGroup.add(sleeve, heavyGauntlet, knuckle);
    } else if (config.armsStyle === 'muscular') {
      // Bare skin arm with sweatband
      const skinArm = makeVoxel(0.3, 0.55, 0.3, skin);
      skinArm.position.set(0, -0.27, 0);
      const sweatband = makeVoxel(0.33, 0.12, 0.33, armsPri);
      sweatband.position.set(0, -0.5, 0);
      const hand = makeVoxel(0.28, 0.28, 0.28, skin);
      hand.position.set(0, -0.72, 0);
      targetGroup.add(skinArm, sweatband, hand);
    } else {
      // Classic sleeved shirt & gloves
      const sleeve = makeVoxel(0.3, 0.52, 0.3, armsPri);
      sleeve.position.set(0, -0.26, 0);
      const glove = makeVoxel(0.31, 0.35, 0.31, gloves);
      glove.position.set(0, -0.68, 0);
      targetGroup.add(sleeve, glove);
    }
  };

  buildArm(true, leftArmGroup);
  buildArm(false, rightArmGroup);

  // ==========================================
  // 4. LEGS STYLES
  // ==========================================
  const legsPri = config.legsColor;
  const boots = config.bootsColor;

  const buildLeg = (isLeft: boolean, targetGroup: THREE.Group) => {
    // Leg pivot is at hip top (extends down to -0.85)
    if (config.legsStyle === 'cyber_boots') {
      const pants = makeVoxel(0.34, 0.45, 0.36, legsPri);
      pants.position.set(0, -0.22, 0);
      const cyberBoot = makeVoxel(0.36, 0.42, 0.38, boots, 0.3, 0.8);
      cyberBoot.position.set(0, -0.64, 0);
      // Glowing thruster heel
      const thruster = makeVoxel(0.18, 0.14, 0.14, glow, 0.1, 0.2, glow, 0.9);
      thruster.position.set(0, -0.65, 0.18);
      targetGroup.add(pants, cyberBoot, thruster);
    } else if (config.legsStyle === 'sabatons') {
      // Knight sabatons with knee cops
      const pants = makeVoxel(0.34, 0.4, 0.36, legsPri);
      pants.position.set(0, -0.2, 0);
      const kneeCop = makeVoxel(0.36, 0.16, 0.12, boots, 0.3, 0.85);
      kneeCop.position.set(0, -0.38, -0.16);
      const sabaton = makeVoxel(0.36, 0.45, 0.42, boots, 0.3, 0.85);
      sabaton.position.set(0, -0.64, -0.02);
      targetGroup.add(pants, kneeCop, sabaton);
    } else if (config.legsStyle === 'sneakers') {
      // Jeans + classic pixel sneakers
      const jeans = makeVoxel(0.34, 0.6, 0.36, legsPri);
      jeans.position.set(0, -0.3, 0);
      const sneakerBody = makeVoxel(0.36, 0.24, 0.42, boots);
      sneakerBody.position.set(0, -0.7, -0.02);
      const whiteSole = makeVoxel(0.37, 0.08, 0.44, 0xf9fafb);
      whiteSole.position.set(0, -0.82, -0.02);
      targetGroup.add(jeans, sneakerBody, whiteSole);
    } else {
      // Tactical combat boots with knee pad
      const pants = makeVoxel(0.34, 0.5, 0.36, legsPri);
      pants.position.set(0, -0.25, 0);
      const kneePad = makeVoxel(0.36, 0.16, 0.1, 0x0f172a);
      kneePad.position.set(0, -0.38, -0.16);
      const combatBoot = makeVoxel(0.36, 0.38, 0.42, boots, 0.7);
      combatBoot.position.set(0, -0.68, -0.02);
      targetGroup.add(pants, kneePad, combatBoot);
    }
  };

  buildLeg(true, leftLegGroup);
  buildLeg(false, rightLegGroup);

  // ==========================================
  // 5. ACCESSORIES
  // ==========================================
  if (config.accessory === 'jetpack') {
    // Dual cylinder voxel jetpack
    const mountPlate = makeVoxel(0.65, 0.6, 0.1, 0x1e293b);
    mountPlate.position.set(0, 0, 0.24);

    const thrusterL = makeVoxel(0.22, 0.65, 0.22, 0x334155, 0.4, 0.7);
    thrusterL.position.set(-0.2, 0, 0.35);
    const thrusterR = makeVoxel(0.22, 0.65, 0.22, 0x334155, 0.4, 0.7);
    thrusterR.position.set(0.2, 0, 0.35);

    // Glowing exhaust flames
    const flameL = makeVoxel(0.16, 0.2, 0.16, glow, 0.1, 0.2, glow, 0.9);
    flameL.position.set(-0.2, -0.4, 0.35);
    const flameR = makeVoxel(0.16, 0.2, 0.16, glow, 0.1, 0.2, glow, 0.9);
    flameR.position.set(0.2, -0.4, 0.35);

    accessoryGroup.add(mountPlate, thrusterL, thrusterR, flameL, flameR);
  } else if (config.accessory === 'sword') {
    // Diagonal sheathed katana / voxel blade on back
    const sheath = makeVoxel(0.1, 0.85, 0.1, 0x0f172a);
    sheath.position.set(0, 0.1, 0.26);
    sheath.rotation.z = 0.55;

    const guard = makeVoxel(0.2, 0.06, 0.18, 0xd97706);
    guard.position.set(-0.22, 0.48, 0.26);
    guard.rotation.z = 0.55;

    const handle = makeVoxel(0.08, 0.28, 0.08, glow);
    handle.position.set(-0.3, 0.62, 0.26);
    handle.rotation.z = 0.55;

    accessoryGroup.add(sheath, guard, handle);
  } else if (config.accessory === 'cape') {
    // Flowing royal/superhero cape
    const capeTop = makeVoxel(0.72, 0.1, 0.1, torsoSec);
    capeTop.position.set(0, 0.42, 0.24);

    const capeCloth = makeVoxel(0.75, 0.95, 0.06, torsoSec);
    capeCloth.position.set(0, -0.1, 0.26);
    capeCloth.rotation.x = 0.15; // angled back slightly

    accessoryGroup.add(capeTop, capeCloth);
  }

  return {
    group: root,
    headGroup,
    torsoGroup,
    leftArmGroup,
    rightArmGroup,
    leftLegGroup,
    rightLegGroup,
    accessoryGroup,
  };
}
