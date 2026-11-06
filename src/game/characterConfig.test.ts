import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CHARACTER,
  CHARACTER_PRESETS,
  validateCharacterConfig,
  exportCharacterToJSON,
  importCharacterFromJSON,
} from './characterConfig';

test('validateCharacterConfig falls back to defaults for invalid or missing parts', () => {
  const invalid = {
    headStyle: 'dragon_head_9000',
    skinColor: 'not-a-color',
  };
  const validated = validateCharacterConfig(invalid);
  assert.equal(validated.headStyle, DEFAULT_CHARACTER.headStyle);
  assert.equal(validated.skinColor, DEFAULT_CHARACTER.skinColor);
  assert.equal(validated.torsoStyle, DEFAULT_CHARACTER.torsoStyle);
});

test('validateCharacterConfig preserves valid custom styles and hex colors', () => {
  const custom = {
    headStyle: 'cyborg' as const,
    torsoStyle: 'cyber' as const,
    armsStyle: 'bionic' as const,
    legsStyle: 'cyber_boots' as const,
    accessory: 'sword' as const,
    skinColor: '#00ffcc',
    hairHelmetColor: '#112233',
    torsoPrimaryColor: '#445566',
    torsoSecondaryColor: '#778899',
    armsColor: '#aabbcc',
    glovesColor: '#ddeeff',
    legsColor: '#123456',
    bootsColor: '#654321',
    accentGlowColor: '#ff0077',
  };
  const validated = validateCharacterConfig(custom);
  assert.equal(validated.headStyle, 'cyborg');
  assert.equal(validated.accentGlowColor, '#ff0077');
  assert.equal(validated.skinColor, '#00ffcc');
});

test('exportCharacterToJSON and importCharacterFromJSON preserve character design accurately', () => {
  const paladin = CHARACTER_PRESETS.solar_paladin;
  const jsonStr = exportCharacterToJSON(paladin.name, paladin.config);

  const imported = importCharacterFromJSON(jsonStr);
  assert.ok(imported !== null);
  assert.equal(imported.name, 'Solar Paladin');
  assert.equal(imported.config.headStyle, 'knight');
  assert.equal(imported.config.torsoStyle, 'tunic');
  assert.equal(imported.config.legsStyle, 'sabatons');
});

test('importCharacterFromJSON returns null gracefully on corrupt JSON', () => {
  const corrupt = '{ this is broken json! ';
  const imported = importCharacterFromJSON(corrupt);
  assert.equal(imported, null);
});
