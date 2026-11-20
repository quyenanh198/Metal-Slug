// Loads the MS3 atlas (built by tools/build-atlas.mjs) and the big scenery layers, and draws frames.
const BASE = './assets/ms3/';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('failed to load ' + src));
    img.src = src;
  });
}

export async function loadAssets() {
  const meta = await (await fetch(BASE + 'atlas.json')).json();
  const atlas = await loadImage(BASE + 'atlas.png');
  const layers = {};
  await Promise.all(Object.entries(meta.layers).map(async ([name, l]) => { layers[name] = await loadImage(BASE + l.file); }));
  return { meta, atlas, layers, anims: meta.anims };
}

// Frame index for an animation that started `t` seconds ago.
export function frameAt(anim, t) {
  const n = anim.frames.length;
  const i = Math.floor(Math.max(0, t) * anim.fps);
  return anim.loop ? i % n : Math.min(n - 1, i);
}

export function animDone(anim, t) {
  return !anim.loop && Math.floor(t * anim.fps) >= anim.frames.length;
}

// Draw a frame with its anchor at (x, y). flip mirrors around the anchor (sprites face right in the sheets).
export function drawFrame(ctx, assets, name, index, x, y, flip = false) {
  const anim = assets.anims[name];
  if (!anim) return;
  const f = anim.frames[Math.max(0, Math.min(anim.frames.length - 1, index))];
  const dx = Math.round(x), dy = Math.round(y);
  if (flip) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(assets.atlas, f.x, f.y, f.w, f.h, -f.ox, -f.oy, f.w, f.h);
    ctx.restore();
  } else {
    ctx.drawImage(assets.atlas, f.x, f.y, f.w, f.h, dx - f.ox, dy - f.oy, f.w, f.h);
  }
}

export function drawAnim(ctx, assets, name, t, x, y, flip = false) {
  const anim = assets.anims[name];
  if (anim) drawFrame(ctx, assets, name, frameAt(anim, t), x, y, flip);
}

// Points font: A-Z then 0-9.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export function drawText(ctx, assets, text, x, y, scale = 1) {
  const font = assets.anims['font.points'];
  let cx = Math.round(x);
  for (const ch of String(text).toUpperCase()) {
    const i = GLYPHS.indexOf(ch);
    if (i < 0) { cx += 8 * scale; continue; }
    const f = font.frames[i];
    ctx.drawImage(assets.atlas, f.x, f.y, f.w, f.h, cx, Math.round(y), f.w * scale, f.h * scale);
    cx += (f.w + 1) * scale;
  }
  return cx;
}

export function textWidth(assets, text, scale = 1) {
  const font = assets.anims['font.points'];
  let w = 0;
  for (const ch of String(text).toUpperCase()) {
    const i = GLYPHS.indexOf(ch);
    w += (i < 0 ? 8 : font.frames[i].w + 1) * scale;
  }
  return w;
}
