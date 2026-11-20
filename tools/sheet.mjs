// Sprite-sheet inspection tool for the art pipeline (dev only, Node).
//   node tools/sheet.mjs scan    <sheet.png> [x y w h] [--gap N]   -> JSON boxes of sprites in the region
//   node tools/sheet.mjs preview <sheet.png> x y w h scale out.png   -> enlarged crop with numbered boxes
// Background = the colour of the region's top-left pixel (sheets use a flat magenta/teal fill), plus full transparency.
import fs from 'node:fs';
import { PNG } from 'pngjs';

export function loadSheet(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

export function bgOf(png, x = 0, y = 0) {
  const i = (y * png.width + x) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2]];
}

export function isBg(png, x, y, bg) {
  const i = (y * png.width + x) * 4;
  const d = png.data;
  if (d[i + 3] < 16) return true;
  return Math.abs(d[i] - bg[0]) < 8 && Math.abs(d[i + 1] - bg[1]) < 8 && Math.abs(d[i + 2] - bg[2]) < 8;
}

// Connected components (8-neighbour) of non-background pixels, then merge boxes closer than `gap` px.
export function scan(png, rx = 0, ry = 0, rw = png.width - rx, rh = png.height - ry, gap = 1, bg = bgOf(png, rx, ry)) {
  const w = rw, h = rh, label = new Int32Array(w * h).fill(-1), boxes = [];
  const stack = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (label[y * w + x] !== -1 || isBg(png, rx + x, ry + y, bg)) continue;
    const box = { x0: x, y0: y, x1: x, y1: y, n: 0 };
    const id = boxes.length; boxes.push(box);
    label[y * w + x] = id; stack.push(x, y);
    while (stack.length) {
      const cy = stack.pop(), cx = stack.pop(); box.n++;
      if (cx < box.x0) box.x0 = cx; if (cx > box.x1) box.x1 = cx; if (cy < box.y0) box.y0 = cy; if (cy > box.y1) box.y1 = cy;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = ny * w + nx;
        if (label[k] !== -1 || isBg(png, rx + nx, ry + ny, bg)) continue;
        label[k] = id; stack.push(nx, ny);
      }
    }
  }
  // merge near boxes until stable
  let list = boxes.filter((b) => b.n > 3);
  for (let changed = true; changed; ) {
    changed = false;
    outer: for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (a.x0 - gap <= b.x1 && b.x0 - gap <= a.x1 && a.y0 - gap <= b.y1 && b.y0 - gap <= a.y1) {
        a.x0 = Math.min(a.x0, b.x0); a.y0 = Math.min(a.y0, b.y0); a.x1 = Math.max(a.x1, b.x1); a.y1 = Math.max(a.y1, b.y1); a.n += b.n;
        list.splice(j, 1); changed = true; break outer;
      }
    }
  }
  list.sort((a, b) => (Math.abs(a.y0 - b.y0) > 12 ? a.y0 - b.y0 : a.x0 - b.x0));
  return list.map((b) => ({ x: rx + b.x0, y: ry + b.y0, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 }));
}

// 3x5 digit font for preview labels
const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function put(out, x, y, c) {
  if (x < 0 || y < 0 || x >= out.width || y >= out.height) return;
  const i = (y * out.width + x) * 4; out.data[i] = c[0]; out.data[i + 1] = c[1]; out.data[i + 2] = c[2]; out.data[i + 3] = 255;
}
function label(out, x, y, n, s) {
  const str = String(n);
  for (let k = 0; k < str.length; k++) {
    const g = DIGITS[+str[k]];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
      const on = g[r * 3 + c] === '1';
      for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) put(out, x + (k * 4 + c) * s + a, y + r * s + b, on ? [255, 255, 0] : [0, 0, 0]);
    }
  }
}

export function preview(png, rx, ry, rw, rh, scale, boxes, outFile) {
  const out = new PNG({ width: rw * scale, height: rh * scale });
  for (let y = 0; y < rh * scale; y++) for (let x = 0; x < rw * scale; x++) {
    const sx = rx + Math.floor(x / scale), sy = ry + Math.floor(y / scale), o = (y * out.width + x) * 4;
    if (sx >= png.width || sy >= png.height) continue;
    const i = (sy * png.width + sx) * 4; out.data[o] = png.data[i]; out.data[o + 1] = png.data[i + 1]; out.data[o + 2] = png.data[i + 2]; out.data[o + 3] = 255;
  }
  boxes.forEach((b, n) => {
    const x0 = (b.x - rx) * scale, y0 = (b.y - ry) * scale, x1 = (b.x - rx + b.w) * scale - 1, y1 = (b.y - ry + b.h) * scale - 1;
    for (let x = x0; x <= x1; x++) { put(out, x, y0, [0, 255, 255]); put(out, x, y1, [0, 255, 255]); }
    for (let y = y0; y <= y1; y++) { put(out, x0, y, [0, 255, 255]); put(out, x1, y, [0, 255, 255]); }
    label(out, x0 + 1, y0 + 1, n, Math.max(1, Math.floor(scale / 1.5)));
  });
  fs.writeFileSync(outFile, PNG.sync.write(out));
}

if (process.argv[1] && process.argv[1].endsWith('sheet.mjs')) {
  const [cmd, file, ...rest] = process.argv.slice(2);
  const gapIdx = rest.indexOf('--gap'); const gap = gapIdx >= 0 ? +rest.splice(gapIdx, 2)[1] : 1;
  const png = loadSheet(file);
  if (cmd === 'scan') {
    const [x = 0, y = 0, w = png.width - x, h = png.height - y] = rest.map(Number);
    console.log(JSON.stringify(scan(png, x, y, w, h, gap)));
  } else if (cmd === 'preview') {
    const [x, y, w, h, scale] = rest.slice(0, 5).map(Number);
    const boxes = scan(png, x, y, w, h, gap);
    preview(png, x, y, w, h, scale, boxes, rest[5]);
    console.log(boxes.length + ' boxes; bg ' + bgOf(png, x, y).join(','));
  } else console.log('usage: scan|preview');
}
