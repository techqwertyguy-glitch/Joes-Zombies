import * as THREE from 'three';

/**
 * Procedural Pixel Art Canvas Textures for Voxel Gun 3D.
 * Creates authentic 16x16 / 32x32 pixel textures with crisp NearestFilter.
 */

function createPixelCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { canvas, ctx };
}

export function createGrassSideTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createPixelCanvas(16, 16);
  // Base dirt brown
  ctx.fillStyle = '#6b4626';
  ctx.fillRect(0, 0, 16, 16);

  // Dirt speckles
  const dirtPalette = ['#57371c', '#7c5330', '#4a2f17'];
  for (let y = 4; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (Math.random() > 0.65) {
        ctx.fillStyle = dirtPalette[Math.floor(Math.random() * dirtPalette.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // Top grass fringe with jagged pixel overhang
  ctx.fillStyle = '#4c8a2b';
  ctx.fillRect(0, 0, 16, 3);
  const overhangs = [1, 2, 0, 1, 3, 2, 1, 0, 2, 3, 1, 0, 2, 1, 3, 1];
  for (let x = 0; x < 16; x++) {
    const depth = overhangs[x];
    for (let d = 0; d < depth; d++) {
      ctx.fillStyle = d === depth - 1 ? '#3a6b20' : '#4c8a2b';
      ctx.fillRect(x, 3 + d, 1, 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGrassTopTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createPixelCanvas(16, 16);
  ctx.fillStyle = '#559c31';
  ctx.fillRect(0, 0, 16, 16);

  const grassTints = ['#4c8a2b', '#62b338', '#3e7522', '#6ecc3e'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if ((x + y * 3) % 4 === 0 || Math.random() > 0.7) {
        ctx.fillStyle = grassTints[Math.floor(Math.random() * grassTints.length)];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createStoneBrickTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createPixelCanvas(16, 16);
  ctx.fillStyle = '#6e747c';
  ctx.fillRect(0, 0, 16, 16);

  // Mortar lines
  ctx.fillStyle = '#44484f';
  ctx.fillRect(0, 7, 16, 1);
  ctx.fillRect(0, 15, 16, 1);
  ctx.fillRect(7, 0, 1, 7);
  ctx.fillRect(15, 8, 1, 7);

  // Stone pixel speckles
  const stoneTints = ['#828991', '#5c6168', '#787e87', '#50545a'];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (y !== 7 && y !== 15 && !(x === 7 && y < 7) && !(x === 15 && y >= 8)) {
        if (Math.random() > 0.6) {
          ctx.fillStyle = stoneTints[Math.floor(Math.random() * stoneTints.length)];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWoodCrateTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createPixelCanvas(16, 16);
  // Wooden plank background
  ctx.fillStyle = '#8b5a2b';
  ctx.fillRect(0, 0, 16, 16);

  // Inner planks
  for (let y = 2; y < 14; y += 4) {
    ctx.fillStyle = '#6d431c';
    ctx.fillRect(2, y, 12, 1);
  }

  // Cross brace
  ctx.fillStyle = '#a66e38';
  for (let i = 2; i < 14; i++) {
    ctx.fillRect(i, i, 1, 1);
    ctx.fillRect(15 - i, i, 1, 1);
  }

  // Metal border and corners
  ctx.fillStyle = '#4a4d52';
  ctx.strokeRect(0.5, 0.5, 15, 15);
  ctx.fillStyle = '#2c2e30';
  ctx.fillRect(0, 0, 3, 3);
  ctx.fillRect(13, 0, 3, 3);
  ctx.fillRect(0, 13, 3, 3);
  ctx.fillRect(13, 13, 3, 3);

  // Gold studs / rivets
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(1, 1, 1, 1);
  ctx.fillRect(14, 1, 1, 1);
  ctx.fillRect(1, 14, 1, 1);
  ctx.fillRect(14, 14, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createArenaFloorTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createPixelCanvas(16, 16);
  ctx.fillStyle = '#242830';
  ctx.fillRect(0, 0, 16, 16);

  // Checker tiles
  ctx.fillStyle = '#313642';
  ctx.fillRect(0, 0, 8, 8);
  ctx.fillRect(8, 8, 8, 8);

  // Accent neon pixel corners
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillRect(15, 0, 1, 1);
  ctx.fillRect(0, 15, 1, 1);
  ctx.fillRect(15, 15, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createJumpPadTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createPixelCanvas(16, 16);
  // Outer frame
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 16, 16);

  // Inner pad
  ctx.fillStyle = '#065f46';
  ctx.fillRect(2, 2, 12, 12);

  // Glowing launch chevron arrows
  ctx.fillStyle = '#34d399';
  // Chevron 1
  ctx.fillRect(7, 3, 2, 2);
  ctx.fillRect(5, 5, 2, 2);
  ctx.fillRect(9, 5, 2, 2);
  ctx.fillRect(3, 7, 2, 2);
  ctx.fillRect(11, 7, 2, 2);

  // Chevron 2
  ctx.fillStyle = '#10b981';
  ctx.fillRect(7, 8, 2, 2);
  ctx.fillRect(5, 10, 2, 2);
  ctx.fillRect(9, 10, 2, 2);
  ctx.fillRect(3, 12, 2, 2);
  ctx.fillRect(11, 12, 2, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createZombieFaceTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createPixelCanvas(16, 16);
  // Green rotting skin
  ctx.fillStyle = '#4d7c38';
  ctx.fillRect(0, 0, 16, 16);

  // Rot patches
  ctx.fillStyle = '#365825';
  ctx.fillRect(2, 2, 3, 3);
  ctx.fillRect(10, 11, 4, 3);
  ctx.fillRect(1, 9, 2, 2);

  // Bloodshot evil pixel eyes
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(3, 5, 3, 3);
  ctx.fillRect(10, 5, 3, 3);

  ctx.fillStyle = '#ef4444'; // Red pupil
  ctx.fillRect(4, 6, 2, 2);
  ctx.fillRect(10, 6, 2, 2);

  // Snarl mouth
  ctx.fillStyle = '#1a2414';
  ctx.fillRect(5, 11, 6, 2);
  ctx.fillStyle = '#f3f4f6'; // Exposed tooth
  ctx.fillRect(6, 11, 1, 1);
  ctx.fillRect(9, 12, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMercenaryFaceTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createPixelCanvas(16, 16);
  // Tactical camo helmet
  ctx.fillStyle = '#3f4f3e';
  ctx.fillRect(0, 0, 16, 6);
  ctx.fillStyle = '#2d3b2c';
  ctx.fillRect(3, 1, 4, 3);
  ctx.fillRect(10, 2, 3, 3);

  // Glowing amber visor
  ctx.fillStyle = '#d97706';
  ctx.fillRect(2, 6, 12, 3);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(4, 7, 8, 1);

  // Balaclava / face mask
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 9, 16, 7);
  ctx.fillStyle = '#374151';
  ctx.fillRect(6, 12, 4, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGolemTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createPixelCanvas(16, 16);
  ctx.fillStyle = '#27272a';
  ctx.fillRect(0, 0, 16, 16);

  // Magma cracks
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(3, 2, 2, 5);
  ctx.fillRect(5, 6, 6, 2);
  ctx.fillRect(11, 8, 2, 6);
  ctx.fillRect(2, 12, 5, 2);

  ctx.fillStyle = '#f97316';
  ctx.fillRect(4, 3, 1, 3);
  ctx.fillRect(6, 6, 4, 1);

  // Blazing core eyes
  ctx.fillStyle = '#fde047';
  ctx.fillRect(3, 4, 3, 2);
  ctx.fillRect(10, 4, 3, 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
