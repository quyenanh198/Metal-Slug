// Builds public/assets/ms3/atlas.png + atlas.json from the MS3 source sheets (dev only, Node).
//   node tools/build-atlas.mjs            -> atlas + a montage per animation in tools/out/ for checking
// Each animation lists a sheet and a region; frames are the sprites found in that region, left to right.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { loadSheet, scan } from './sheet.mjs';
import { ANIMS, SHEET_DIR } from './ms3-manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public/assets/ms3');
const CHECK_DIR = path.join(ROOT, 'tools/out');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(CHECK_DIR, { recursive: true });

const sheets = new Map();
const sheet = (name) => {
  if (!sheets.has(name)) sheets.set(name, loadSheet(path.join(ROOT, SHEET_DIR, name)));
  return sheets.get(name);
};
const only = process.argv[2];

const pixel = (png, x, y) => { const i = (y * png.width + x) * 4; return [png.data[i], png.data[i + 1], png.data[i + 2]]; };
function trimX(png, b, bgs) {
  const isBg = (p) => bgs.some((k) => Math.abs(p[0] - k[0]) < 8 && Math.abs(p[1] - k[1]) < 8 && Math.abs(p[2] - k[2]) < 8);
  const solid = (x) => { for (let y = b.y; y < b.y + b.h; y++) if (!isBg(pixel(png, x, y))) return true; return false; };
  let x0 = b.x, x1 = b.x + b.w - 1;
  while (x0 < x1 && !solid(x0)) x0++;
  while (x1 > x0 && !solid(x1)) x1--;
  return { x: x0, y: b.y, w: x1 - x0 + 1, h: b.h };
}

// Collect frames. Entries with `out` are big scenery layers written as their own PNG (bg made transparent).
const anims = {};
const layers = {};
const crops = [];
for (const a of ANIMS) {
  if (a.out) {
    const png = sheet(a.sheet);
    const [x, y, w, h] = a.region;
    const bg = a.bg ?? [png.data[(y * png.width + x) * 4], png.data[(y * png.width + x) * 4 + 1], png.data[(y * png.width + x) * 4 + 2]];
    const img = new PNG({ width: w, height: h });
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const si = ((y + yy) * png.width + x + xx) * 4, di = (yy * w + xx) * 4, d = png.data;
      if (d[si + 3] < 16 || (Math.abs(d[si] - bg[0]) < 8 && Math.abs(d[si + 1] - bg[1]) < 8 && Math.abs(d[si + 2] - bg[2]) < 8)) continue;
      img.data[di] = d[si]; img.data[di + 1] = d[si + 1]; img.data[di + 2] = d[si + 2]; img.data[di + 3] = 255;
    }
    // erase = sheet rectangles belonging to other sprites that overlap the layer
    for (const [ex, ey, ew, eh] of a.erase ?? []) for (let yy = ey; yy < ey + eh; yy++) for (let xx = ex; xx < ex + ew; xx++) {
      const lx = xx - x, ly = yy - y;
      if (lx >= 0 && ly >= 0 && lx < w && ly < h) img.data[(ly * w + lx) * 4 + 3] = 0;
    }
    fs.writeFileSync(path.join(OUT_DIR, a.out), PNG.sync.write(img));
    layers[a.name] = { file: a.out, w, h };
    continue;
  }
  const png = sheet(a.sheet);
  // `rects` = exact frame rectangles; `regions` = several scan areas concatenated; `region` = one scan area
  const regions = a.regions ?? [a.region ?? a.rects[0]];
  const [x, y] = regions[0];
  const bg = a.bg ?? [png.data[(y * png.width + x) * 4], png.data[(y * png.width + x) * 4 + 1], png.data[(y * png.width + x) * 4 + 2]];
  let boxes = a.rects
    ? a.rects.map(([rx, ry, rw, rh]) => ({ x: rx, y: ry, w: rw, h: rh }))
    : a.whole
      ? regions.map(([rx, ry, rw, rh]) => ({ x: rx, y: ry, w: rw, h: rh }))
      : regions.flatMap(([rx, ry, rw, rh]) => { const found = scan(png, rx, ry, rw, rh, a.gap ?? 1, bg); return a.sortX ? found.sort((p, q) => p.x - q.x) : found; }).filter((b) => b.w >= (a.minW ?? 6) && b.h >= (a.minH ?? 6));
  if (a.pick) boxes = a.pick.map((i) => boxes[i]).filter(Boolean);
  if (!boxes.length) throw new Error(`no frames for ${a.name}`);
  anims[a.name] = { fps: a.fps ?? 12, loop: a.loop ?? true, frames: [] };
  for (let b of boxes) {
    // cellBg: every rect sits on its own coloured cell, so its background is the rect's top-left pixel
    const cbg = a.cellBg ? pixel(png, b.x, b.y) : bg;
    // trimX: crop the empty columns either side (glyphs keep their cell height so baselines line up)
    if (a.trimX) b = trimX(png, b, [cbg, ...(a.extraBg ?? [])]);
    crops.push({ anim: a.name, png, b, bg: a.keepBg ? null : cbg, extraBg: a.extraBg ?? [], flood: !!a.flood, anchor: a.anchor ?? 'bottom' });
  }
}

// Shelf-pack into a 2048-wide atlas with 1px padding (tallest first packs tighter)
const W = 2048;
const order = [...crops].sort((p, q) => q.b.h - p.b.h);
let cx = 0, cy = 0, shelf = 0;
for (const c of order) {
  if (cx + c.b.w + 1 > W) { cx = 0; cy += shelf + 1; shelf = 0; }
  c.ax = cx; c.ay = cy; cx += c.b.w + 1; shelf = Math.max(shelf, c.b.h);
}
const H = cy + shelf + 1;
const atlas = new PNG({ width: W, height: H });
// flood: only background connected to the rect's border is dropped (keeps same-coloured highlights inside)
function outsideMask(c) {
  const { png, b, bg } = c, m = new Uint8Array(b.w * b.h), q = [];
  const isBgAt = (x, y) => { const [r, g, bl] = pixel(png, b.x + x, b.y + y); return Math.abs(r - bg[0]) < 8 && Math.abs(g - bg[1]) < 8 && Math.abs(bl - bg[2]) < 8; };
  const push = (x, y) => { if (x < 0 || y < 0 || x >= b.w || y >= b.h || m[y * b.w + x] || !isBgAt(x, y)) return; m[y * b.w + x] = 1; q.push([x, y]); };
  for (let x = 0; x < b.w; x++) { push(x, 0); push(x, b.h - 1); }
  for (let y = 0; y < b.h; y++) { push(0, y); push(b.w - 1, y); }
  while (q.length) { const [x, y] = q.pop(); push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1); }
  return m;
}
for (const c of crops) {
  const mask = c.flood ? outsideMask(c) : null;
  for (let y = 0; y < c.b.h; y++) for (let x = 0; x < c.b.w; x++) {
    const si = ((c.b.y + y) * c.png.width + c.b.x + x) * 4, di = ((c.ay + y) * W + c.ax + x) * 4, d = c.png.data;
    const near = (k) => Math.abs(d[si] - k[0]) < 8 && Math.abs(d[si + 1] - k[1]) < 8 && Math.abs(d[si + 2] - k[2]) < 8;
    const isBg = mask ? mask[y * c.b.w + x] : c.bg && (near(c.bg) || c.extraBg.some(near)); // extraBg: more colours to drop (e.g. white cell gaps)
    if (isBg || d[si + 3] < 16) continue;
    atlas.data[di] = d[si]; atlas.data[di + 1] = d[si + 1]; atlas.data[di + 2] = d[si + 2]; atlas.data[di + 3] = 255;
  }
  // anchor (ox, oy) inside the frame: bottom-centre (feet) by default
  const ox = Math.round(c.b.w / 2), oy = c.anchor === 'top' ? 0 : c.anchor === 'center' ? Math.round(c.b.h / 2) : c.anchor === 'topleft' ? 0 : c.b.h;
  anims[c.anim].frames.push({ x: c.ax, y: c.ay, w: c.b.w, h: c.b.h, ox: c.anchor === 'topleft' ? 0 : ox, oy });
}
fs.writeFileSync(path.join(OUT_DIR, 'atlas.png'), PNG.sync.write(atlas));
fs.writeFileSync(path.join(OUT_DIR, 'atlas.json'), JSON.stringify({ width: W, height: H, anims, layers }));

// Montage: one row per animation, frames bottom-aligned, scale 2, for visual checking
const S = 2, rows = Object.entries(anims).filter(([n]) => !only || n.startsWith(only));
const mw = Math.min(3600, Math.max(...rows.map(([, a]) => a.frames.reduce((n, f) => n + f.w + 4, 4))) * S);
const rowH = rows.map(([, a]) => Math.min(200, Math.max(...a.frames.map((f) => f.h))) + 6);
const mh = rowH.reduce((n, h) => n + h, 0) * S;
const mont = new PNG({ width: mw, height: mh });
for (let i = 0; i < mont.data.length; i += 4) { mont.data[i] = 40; mont.data[i + 1] = 44; mont.data[i + 2] = 52; mont.data[i + 3] = 255; }
let my = 0;
rows.forEach(([, a], r) => {
  let mx = 4;
  for (const f of a.frames) {
    const top = my + rowH[r] - 3 - Math.min(f.h, 200);
    for (let y = 0; y < Math.min(f.h, 200); y++) for (let x = 0; x < f.w; x++) {
      const si = ((f.y + y) * W + f.x + x) * 4;
      if (atlas.data[si + 3] < 16) continue;
      for (let a2 = 0; a2 < S; a2++) for (let b2 = 0; b2 < S; b2++) {
        const px = (mx + x) * S + a2, py = (top + y) * S + b2;
        if (px >= mw || py >= mh) continue;
        const di = (py * mw + px) * 4; mont.data[di] = atlas.data[si]; mont.data[di + 1] = atlas.data[si + 1]; mont.data[di + 2] = atlas.data[si + 2];
      }
    }
    mx += f.w + 4;
  }
  my += rowH[r];
});
fs.writeFileSync(path.join(CHECK_DIR, 'montage.png'), PNG.sync.write(mont));
console.log(`atlas ${W}x${H}, ${crops.length} frames`);
for (const [name, a] of rows) console.log(`  ${name}: ${a.frames.length} frames`);
