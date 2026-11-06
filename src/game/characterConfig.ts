/**
 * Character customization schema, presets, and serialization logic.
 * Decoupled for unit testing.
 */

export interface CharacterPartConfig {
  headStyle: 'hero' | 'helmet' | 'cyborg' | 'zombie' | 'knight' | 'wizard';
  torsoStyle: 'vest' | 'cyber' | 'hoodie' | 'tunic' | 'harness';
  armsStyle: 'bionic' | 'gauntlets' | 'sleeved' | 'muscular';
  legsStyle: 'combat' | 'cyber_boots' | 'sabatons' | 'sneakers';
  accessory: 'none' | 'jetpack' | 'sword' | 'cape';

  // Colors
  skinColor: string;
  hairHelmetColor: string;
  torsoPrimaryColor: string;
  torsoSecondaryColor: string;
  armsColor: string;
  glovesColor: string;
  legsColor: string;
  bootsColor: string;
  accentGlowColor: string;
}

export interface SavedCharacterDesign {
  id: string;
  name: string;
  updatedAt: number;
  config: CharacterPartConfig;
}

export const DEFAULT_CHARACTER: CharacterPartConfig = {
  headStyle: 'hero',
  torsoStyle: 'vest',
  armsStyle: 'sleeved',
  legsStyle: 'combat',
  accessory: 'jetpack',

  skinColor: '#f5c6a5',
  hairHelmetColor: '#4a2e18',
  torsoPrimaryColor: '#1e3a8a', // navy
  torsoSecondaryColor: '#f59e0b', // amber
  armsColor: '#1e3a8a',
  glovesColor: '#1e293b',
  legsColor: '#334155',
  bootsColor: '#0f172a',
  accentGlowColor: '#06b6d4', // cyan glow
};

export const CHARACTER_PRESETS: Record<string, { name: string; config: CharacterPartConfig }> = {
  pixel_vanguard: {
    name: 'Pixel Vanguard',
    config: {
      headStyle: 'hero',
      torsoStyle: 'vest',
      armsStyle: 'sleeved',
      legsStyle: 'combat',
      accessory: 'jetpack',
      skinColor: '#f5c6a5',
      hairHelmetColor: '#3b2219',
      torsoPrimaryColor: '#2563eb',
      torsoSecondaryColor: '#fbbf24',
      armsColor: '#2563eb',
      glovesColor: '#1e293b',
      legsColor: '#1e293b',
      bootsColor: '#0f172a',
      accentGlowColor: '#38bdf8',
    },
  },
  cyber_phantom: {
    name: 'Cyber Phantom',
    config: {
      headStyle: 'cyborg',
      torsoStyle: 'cyber',
      armsStyle: 'bionic',
      legsStyle: 'cyber_boots',
      accessory: 'sword',
      skinColor: '#cbd5e1',
      hairHelmetColor: '#0f172a',
      torsoPrimaryColor: '#09090b',
      torsoSecondaryColor: '#ec4899',
      armsColor: '#18181b',
      glovesColor: '#ec4899',
      legsColor: '#18181b',
      bootsColor: '#09090b',
      accentGlowColor: '#06b6d4',
    },
  },
  toxic_zombie: {
    name: 'Toxic Zombie',
    config: {
      headStyle: 'zombie',
      torsoStyle: 'hoodie',
      armsStyle: 'muscular',
      legsStyle: 'combat',
      accessory: 'none',
      skinColor: '#4d7c38',
      hairHelmetColor: '#2d4a22',
      torsoPrimaryColor: '#3f3f46',
      torsoSecondaryColor: '#84cc16',
      armsColor: '#4d7c38',
      glovesColor: '#27272a',
      legsColor: '#27272a',
      bootsColor: '#18181b',
      accentGlowColor: '#a3e635',
    },
  },
  desert_mercenary: {
    name: 'Desert Mercenary',
    config: {
      headStyle: 'helmet',
      torsoStyle: 'vest',
      armsStyle: 'gauntlets',
      legsStyle: 'combat',
      accessory: 'jetpack',
      skinColor: '#e0a96d',
      hairHelmetColor: '#785938',
      torsoPrimaryColor: '#8f774e',
      torsoSecondaryColor: '#403522',
      armsColor: '#8f774e',
      glovesColor: '#262117',
      legsColor: '#5c4d32',
      bootsColor: '#262117',
      accentGlowColor: '#f59e0b',
    },
  },
  solar_paladin: {
    name: 'Solar Paladin',
    config: {
      headStyle: 'knight',
      torsoStyle: 'tunic',
      armsStyle: 'gauntlets',
      legsStyle: 'sabatons',
      accessory: 'cape',
      skinColor: '#f8fafc',
      hairHelmetColor: '#e2e8f0',
      torsoPrimaryColor: '#f8fafc',
      torsoSecondaryColor: '#eab308',
      armsColor: '#cbd5e1',
      glovesColor: '#eab308',
      legsColor: '#94a3b8',
      bootsColor: '#cbd5e1',
      accentGlowColor: '#facc15',
    },
  },
  arcane_wizard: {
    name: 'Arcane Wizard',
    config: {
      headStyle: 'wizard',
      torsoStyle: 'tunic',
      armsStyle: 'sleeved',
      legsStyle: 'sneakers',
      accessory: 'cape',
      skinColor: '#fed7aa',
      hairHelmetColor: '#7c3aed',
      torsoPrimaryColor: '#6d28d9',
      torsoSecondaryColor: '#f43f5e',
      armsColor: '#6d28d9',
      glovesColor: '#4c1d95',
      legsColor: '#4c1d95',
      bootsColor: '#2e1065',
      accentGlowColor: '#c084fc',
    },
  },
};

const STORAGE_KEY = 'pixelgun3d_saved_characters_v1';
const ACTIVE_SKIN_KEY = 'pixelgun3d_active_skin_v1';

/**
 * Validate a character config object
 */
export function validateCharacterConfig(cfg: unknown): CharacterPartConfig {
  if (!cfg || typeof cfg !== 'object') {
    return { ...DEFAULT_CHARACTER };
  }
  const c = cfg as Partial<CharacterPartConfig>;

  return {
    headStyle: ['hero', 'helmet', 'cyborg', 'zombie', 'knight', 'wizard'].includes(c.headStyle as string)
      ? (c.headStyle as CharacterPartConfig['headStyle'])
      : DEFAULT_CHARACTER.headStyle,
    torsoStyle: ['vest', 'cyber', 'hoodie', 'tunic', 'harness'].includes(c.torsoStyle as string)
      ? (c.torsoStyle as CharacterPartConfig['torsoStyle'])
      : DEFAULT_CHARACTER.torsoStyle,
    armsStyle: ['bionic', 'gauntlets', 'sleeved', 'muscular'].includes(c.armsStyle as string)
      ? (c.armsStyle as CharacterPartConfig['armsStyle'])
      : DEFAULT_CHARACTER.armsStyle,
    legsStyle: ['combat', 'cyber_boots', 'sabatons', 'sneakers'].includes(c.legsStyle as string)
      ? (c.legsStyle as CharacterPartConfig['legsStyle'])
      : DEFAULT_CHARACTER.legsStyle,
    accessory: ['none', 'jetpack', 'sword', 'cape'].includes(c.accessory as string)
      ? (c.accessory as CharacterPartConfig['accessory'])
      : DEFAULT_CHARACTER.accessory,

    skinColor: typeof c.skinColor === 'string' && c.skinColor.startsWith('#') ? c.skinColor : DEFAULT_CHARACTER.skinColor,
    hairHelmetColor: typeof c.hairHelmetColor === 'string' && c.hairHelmetColor.startsWith('#') ? c.hairHelmetColor : DEFAULT_CHARACTER.hairHelmetColor,
    torsoPrimaryColor: typeof c.torsoPrimaryColor === 'string' && c.torsoPrimaryColor.startsWith('#') ? c.torsoPrimaryColor : DEFAULT_CHARACTER.torsoPrimaryColor,
    torsoSecondaryColor: typeof c.torsoSecondaryColor === 'string' && c.torsoSecondaryColor.startsWith('#') ? c.torsoSecondaryColor : DEFAULT_CHARACTER.torsoSecondaryColor,
    armsColor: typeof c.armsColor === 'string' && c.armsColor.startsWith('#') ? c.armsColor : DEFAULT_CHARACTER.armsColor,
    glovesColor: typeof c.glovesColor === 'string' && c.glovesColor.startsWith('#') ? c.glovesColor : DEFAULT_CHARACTER.glovesColor,
    legsColor: typeof c.legsColor === 'string' && c.legsColor.startsWith('#') ? c.legsColor : DEFAULT_CHARACTER.legsColor,
    bootsColor: typeof c.bootsColor === 'string' && c.bootsColor.startsWith('#') ? c.bootsColor : DEFAULT_CHARACTER.bootsColor,
    accentGlowColor: typeof c.accentGlowColor === 'string' && c.accentGlowColor.startsWith('#') ? c.accentGlowColor : DEFAULT_CHARACTER.accentGlowColor,
  };
}

/**
 * Storage helpers
 */
export function getSavedCharacters(): SavedCharacterDesign[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      id: String(item.id || Date.now()),
      name: String(item.name || 'Custom Hero'),
      updatedAt: Number(item.updatedAt || Date.now()),
      config: validateCharacterConfig(item.config),
    }));
  } catch {
    return [];
  }
}

export function saveCharacter(name: string, config: CharacterPartConfig, existingId?: string): SavedCharacterDesign {
  const current = getSavedCharacters();
  const id = existingId || `char_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const design: SavedCharacterDesign = {
    id,
    name: name.trim() || 'Custom Hero',
    updatedAt: Date.now(),
    config: validateCharacterConfig(config),
  };

  const existingIdx = current.findIndex((c) => c.id === id);
  if (existingIdx >= 0) {
    current[existingIdx] = design;
  } else {
    current.unshift(design);
  }

  // Limit to 12 saved designs
  const clamped = current.slice(0, 12);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
      localStorage.setItem(ACTIVE_SKIN_KEY, JSON.stringify(design.config));
    } catch {}
  }

  return design;
}

export function deleteSavedCharacter(id: string): SavedCharacterDesign[] {
  const current = getSavedCharacters().filter((c) => c.id !== id);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {}
  }
  return current;
}

export function getActiveSkin(): CharacterPartConfig {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_CHARACTER;
  try {
    const raw = localStorage.getItem(ACTIVE_SKIN_KEY);
    if (!raw) return DEFAULT_CHARACTER;
    return validateCharacterConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_CHARACTER;
  }
}

export function setActiveSkin(config: CharacterPartConfig) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(ACTIVE_SKIN_KEY, JSON.stringify(config));
    } catch {}
  }
}

/**
 * Export and Import JSON strings
 */
export function exportCharacterToJSON(name: string, config: CharacterPartConfig): string {
  return JSON.stringify({
    format: 'pixelgun3d_character',
    version: 1,
    name,
    config,
  }, null, 2);
}

export function importCharacterFromJSON(jsonString: string): { name: string; config: CharacterPartConfig } | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object' && parsed.config) {
      return {
        name: typeof parsed.name === 'string' ? parsed.name : 'Imported Hero',
        config: validateCharacterConfig(parsed.config),
      };
    }
  } catch {}
  return null;
}
