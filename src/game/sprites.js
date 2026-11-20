import * as THREE from 'three';

function loadPixelStrip(url, frames = 1) {
  const loader = new THREE.TextureLoader();
  const tex = loader.load(url);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  if (frames > 1) {
    tex.repeat.set(1 / frames, 1);
  }
  return tex;
}

function makeIconTex(color, letter) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1e222a';
  ctx.fillRect(2, 2, 28, 28);
  ctx.fillStyle = color;
  ctx.fillRect(4, 4, 24, 24);
  ctx.fillStyle = '#fff8e7';
  ctx.fillRect(6, 6, 20, 20);
  ctx.fillStyle = '#1e222a';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, 16, 17);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRoadTex() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#c8b68c';
  ctx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#b6a377' : '#d8c8a2';
    ctx.fillRect((i * 13) % 64, (i * 29) % 64, 3, 2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(40, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Small pixel-art canvases drawn in code, so props match the pixel sprites instead of flat-shaded boxes.
function pixelCanvas(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCrateTex() {
  return pixelCanvas(32, 32, (ctx) => {
    ctx.fillStyle = '#3b2412';
    ctx.fillRect(0, 0, 32, 32);
    const planks = ['#a8723d', '#b98146', '#9c6834', '#b07a40'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = planks[i];
      ctx.fillRect(2, 2 + i * 7, 28, 6);
      ctx.fillStyle = '#d29a5a';
      ctx.fillRect(2, 2 + i * 7, 28, 1);
      ctx.fillStyle = '#6e4420';
      ctx.fillRect(2 + ((i * 9) % 20), 4 + i * 7, 5, 1);
    }
    // frame and diagonal brace
    ctx.fillStyle = '#5a3417';
    ctx.fillRect(0, 0, 32, 3);
    ctx.fillRect(0, 29, 32, 3);
    ctx.fillRect(0, 0, 3, 32);
    ctx.fillRect(29, 0, 3, 32);
    for (let i = 0; i < 26; i++) ctx.fillRect(3 + i, 28 - i, 3, 2);
    ctx.fillStyle = '#c9c2b2';
    for (const [x, y] of [[1, 1], [29, 1], [1, 29], [29, 29]]) ctx.fillRect(x, y, 2, 2);
  });
}

function makeSandbagTex() {
  return pixelCanvas(48, 24, (ctx) => {
    const bag = (x, y, w, h) => {
      ctx.fillStyle = '#4a3f2c';
      ctx.fillRect(x, y + 1, w, h - 1);
      ctx.fillRect(x + 1, y, w - 2, h);
      ctx.fillStyle = '#b8a37c';
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = '#d6c49b';
      ctx.fillRect(x + 2, y + 1, w - 5, 2);
      ctx.fillStyle = '#8f7b57';
      ctx.fillRect(x + 1, y + h - 3, w - 2, 2);
      ctx.fillRect(x + (w >> 1), y + 2, 1, h - 4);
    };
    for (let i = 0; i < 4; i++) bag(i * 12, 12, 12, 12);
    for (let i = 0; i < 3; i++) bag(6 + i * 12, 3, 12, 10);
  });
}

function makeGroundTex() {
  // darker wet sand in front of the road, so the lower screen is never empty
  const tex = pixelCanvas(64, 64, (ctx) => {
    ctx.fillStyle = '#a8946a';
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 140; i++) {
      ctx.fillStyle = ['#9a865d', '#b6a27a', '#8e7b54'][i % 3];
      ctx.fillRect((i * 17) % 64, (i * 31) % 64, 2 + (i % 3), 1 + (i % 2));
    }
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = '#7c6a46';
      ctx.fillRect((i * 23) % 60, (i * 41) % 60, 4, 2);
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Bullet glow: hot white core, coloured shell, soft fringe (drawn with additive blending).
function makeBulletTex(color) {
  const c = new THREE.Color(color);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  return pixelCanvas(16, 8, (ctx) => {
    ctx.fillStyle = `rgba(${rgb},0.35)`;
    ctx.fillRect(0, 1, 16, 6);
    ctx.fillStyle = `rgba(${rgb},1)`;
    ctx.fillRect(3, 2, 12, 4);
    ctx.fillStyle = '#fffbe8';
    ctx.fillRect(9, 3, 6, 2);
  });
}

function makeGrenadeTex() {
  return pixelCanvas(12, 14, (ctx) => {
    ctx.fillStyle = '#1b2a1c';
    ctx.fillRect(2, 3, 8, 10);
    ctx.fillRect(1, 4, 10, 8);
    ctx.fillStyle = '#4e6b3a';
    ctx.fillRect(2, 4, 8, 8);
    ctx.fillStyle = '#6f8f50';
    ctx.fillRect(3, 5, 2, 3);
    ctx.fillStyle = '#2f4226';
    for (const y of [6, 9]) ctx.fillRect(2, y, 8, 1);
    ctx.fillStyle = '#9aa3ad';
    ctx.fillRect(4, 0, 4, 3);
    ctx.fillRect(8, 1, 3, 1);
  });
}

function makeMuzzleTex() {
  return pixelCanvas(16, 16, (ctx) => {
    ctx.fillStyle = 'rgba(255,170,40,0.55)';
    ctx.fillRect(2, 6, 12, 4);
    ctx.fillRect(6, 2, 4, 12);
    ctx.fillRect(3, 3, 3, 3);
    ctx.fillRect(10, 3, 3, 3);
    ctx.fillRect(3, 10, 3, 3);
    ctx.fillRect(10, 10, 3, 3);
    ctx.fillStyle = '#ffe28a';
    ctx.fillRect(4, 6, 8, 4);
    ctx.fillRect(6, 4, 4, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 4, 4);
  });
}

// The packed panorama has a flat fill block in its lower-left corner; keep only the clean part (x >= 314).
export const BACKDROP_CROP = { x: 314, width: 886, height: 204 };
function loadBackdrop(url) {
  const canvas = document.createElement('canvas');
  canvas.width = BACKDROP_CROP.width;
  canvas.height = BACKDROP_CROP.height;
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.MirroredRepeatWrapping;
  const image = new Image();
  image.onload = () => {
    canvas.getContext('2d').drawImage(image, BACKDROP_CROP.x, 0, BACKDROP_CROP.width, BACKDROP_CROP.height, 0, 0, BACKDROP_CROP.width, BACKDROP_CROP.height);
    tex.needsUpdate = true;
  };
  image.src = url;
  return tex;
}

export function createSpriteAssets() {
  const base = './assets/packed';

  return {
    marcoUpperTex: loadPixelStrip(`${base}/marco_upper.png`, 8),
    marcoLegsTex: loadPixelStrip(`${base}/marco_legs.png`, 12),
    tankTex: loadPixelStrip(`${base}/tank_drive.png`, 8),
    rebelTex: loadPixelStrip(`${base}/rebel_run.png`, 8),
    powTex: loadPixelStrip(`${base}/pow_tied.png`, 6),
    bossTex: loadPixelStrip(`${base}/boss_tank.png`, 6),
    explosionTex: loadPixelStrip(`${base}/explosion.png`, 8),
    mission1BgTex: loadBackdrop(`${base}/mission1_bg.png`),
    roadTex: makeRoadTex(),
    groundTex: makeGroundTex(),
    crateTex: makeCrateTex(),
    sandbagTex: makeSandbagTex(),
    grenadeTex: makeGrenadeTex(),
    muzzleTex: makeMuzzleTex(),
    bulletTex: (() => {
      const cache = new Map();
      return (color) => {
        if (!cache.has(color)) cache.set(color, makeBulletTex(color));
        return cache.get(color);
      };
    })(),
    pickupTextures: {
      HMG: makeIconTex('#06d6a0', 'H'),
      SHOTGUN: makeIconTex('#ff9f1c', 'S'),
      ROCKET: makeIconTex('#ef476f', 'R')
    }
  };
}
