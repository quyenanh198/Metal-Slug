// Mission 1 layout in world pixels. Ground pieces are drawn with their bottom edge on GROUND_BASE + dy; `ground`
// is the walkable surface inside each piece (local x, local y) as a polyline, read off the Mission 1 sheet.
export const SCREEN_W = 304;
export const SCREEN_H = 224;
export const GROUND_BASE = 224;

export const PIECES = [
  {
    layer: 'm1.beach', x: 0, w: 1610, h: 209,
    ground: [[0, 160], [290, 160], [330, 163], [450, 152], [560, 143], [680, 140], [760, 132], [860, 137], [930, 152], [990, 166], [1100, 178], [1200, 174], [1330, 166], [1450, 161], [1610, 163]]
  },
  {
    layer: 'm1.ship', x: 1610, w: 1866, h: 226, dy: 20,
    ground: [[0, 160], [190, 156], [215, 128], [260, 104], [300, 80], [420, 62], [560, 66], [700, 78], [830, 96], [960, 122], [1040, 142], [1440, 146], [1470, 196], [1866, 196]]
  },
  {
    // minCamY keeps the flat-cut tree tops of this piece above the screen
    layer: 'm1.jungle', x: 3476, w: 1190, h: 206, dy: 36, minCamY: 56,
    ground: [[0, 162], [1190, 162]]
  }
];

export const LEVEL_END = 4666;
// the first 290 px of the beach piece are open sea
export const LEVEL_START = 300;

export const pieceTop = (p) => GROUND_BASE - p.h + (p.dy ?? 0);
export const pieceAt = (x) => PIECES.find((q) => x >= q.x && x < q.x + q.w) ?? (x < 0 ? PIECES[0] : PIECES[PIECES.length - 1]);

// Boss stage: a single fixed screen at world x ARENA.x (camera y 0), Marco on the Slug Transport Ferry while
// Huge Hermit wades after it from the left. Ferry frame is 210x100; `deck` is its walkable top (local x, local y).
export const ARENA = {
  x: 5400,
  ferryX: 94, ferryTop: 124,
  deck: [[24, 73], [150, 73], [180, 64], [200, 58]],
  minX: 142, maxX: 290 // walkable screen x range on the deck (left of 142 is the crane)
};
const deckAt = (lx) => {
  const d = ARENA.deck;
  if (lx <= d[0][0]) return d[0][1];
  for (let i = 1; i < d.length; i++) if (lx <= d[i][0]) return d[i - 1][1] + ((d[i][1] - d[i - 1][1]) * (lx - d[i - 1][0])) / (d[i][0] - d[i - 1][0]);
  return d[d.length - 1][1];
};

// Walkable world y at world x (larger y = lower on screen).
export function groundAt(x) {
  if (x >= ARENA.x - 200) return ARENA.ferryTop + deckAt(x - ARENA.x - ARENA.ferryX);
  const p = pieceAt(x);
  const lx = Math.max(0, Math.min(p.w, x - p.x));
  const top = pieceTop(p);
  const g = p.ground;
  for (let i = 1; i < g.length; i++) {
    if (lx <= g[i][0]) {
      const [x0, y0] = g[i - 1], [x1, y1] = g[i];
      return top + y0 + ((y1 - y0) * (lx - x0)) / Math.max(1, x1 - x0);
    }
  }
  return top + g[g.length - 1][1];
}

// Scripted encounters. `at` = camera left edge that triggers the entry. Kinds:
//   rebel {mode: 'idle'|'chat'|'grenadier'|'charge', x, facing}, crab {x, facing?}, pow {x, drop}, item {x, kind},
//   lock {x, final?}
export const SCRIPT = [
  { at: 300, type: 'pow', x: 560, drop: 'H' },
  // Chowmein Conga crabs come out of the surf on the beach and crawl over the wreck
  { at: 420, type: 'crab', x: 760 },
  { at: 1100, type: 'crab', x: 1420 },
  { at: 1100, type: 'crab', x: 1460 },
  { at: 2300, type: 'crab', x: 2620 },
  { at: 2300, type: 'crab', x: 2660 },
  { at: 300, type: 'rebel', mode: 'chat', x: 680, facing: -1 },
  { at: 300, type: 'rebel', mode: 'idle', x: 710, facing: -1 },
  { at: 500, type: 'rebel', mode: 'grenadier', x: 860, facing: -1 },
  { at: 600, type: 'item', kind: 'bombs', x: 940 },
  { at: 720, type: 'rebel', mode: 'charge', x: 1060, facing: -1 },
  { at: 720, type: 'rebel', mode: 'charge', x: 1100, facing: -1 },
  { at: 940, type: 'lock', x: 940 },
  { at: 940, type: 'rebel', mode: 'charge', x: 1260, facing: -1 },
  { at: 940, type: 'rebel', mode: 'grenadier', x: 1290, facing: -1 },
  { at: 940, type: 'rebel', mode: 'charge', x: 1310, facing: -1 },
  { at: 900, type: 'pow', x: 1180, drop: 'chicken' },
  { at: 1050, type: 'rebel', mode: 'chat', x: 1320, facing: -1 },
  { at: 1050, type: 'rebel', mode: 'chat', x: 1350, facing: 1 },
  { at: 1300, type: 'rebel', mode: 'grenadier', x: 1620, facing: -1 },
  { at: 1500, type: 'pow', x: 1780, drop: 'R' },
  { at: 1650, type: 'rebel', mode: 'grenadier', x: 1960, facing: -1 },
  { at: 1700, type: 'rebel', mode: 'charge', x: 2020, facing: -1 },
  { at: 1900, type: 'rebel', mode: 'idle', x: 2200, facing: -1 },
  { at: 1900, type: 'item', kind: 'bombs', x: 2150 },
  { at: 2150, type: 'lock', x: 2150 },
  { at: 2150, type: 'rebel', mode: 'charge', x: 2460, facing: -1 },
  { at: 2150, type: 'rebel', mode: 'charge', x: 2490, facing: -1 },
  { at: 2150, type: 'rebel', mode: 'grenadier', x: 2440, facing: -1 },
  { at: 2400, type: 'pow', x: 2680, drop: 'S' },
  { at: 2600, type: 'rebel', mode: 'charge', x: 2900, facing: -1 },
  { at: 2650, type: 'rebel', mode: 'charge', x: 2950, facing: -1 },
  { at: 3000, type: 'pow', x: 3300, drop: 'fish' },
  { at: 3300, type: 'rebel', mode: 'chat', x: 3600, facing: -1 },
  { at: 3300, type: 'rebel', mode: 'grenadier', x: 3650, facing: -1 },
  { at: 3600, type: 'rebel', mode: 'charge', x: 3900, facing: -1 },
  { at: 3800, type: 'pow', x: 4080, drop: 'H' },
  { at: 4100, type: 'lock', x: 4100 },
  { at: 4100, type: 'rebel', mode: 'charge', x: 4400, facing: -1 },
  { at: 4100, type: 'rebel', mode: 'grenadier', x: 4380, facing: -1 },
  { at: 4100, type: 'rebel', mode: 'charge', x: 4430, facing: -1 },
  { at: 4100, type: 'rebel', mode: 'grenadier', x: 4120, facing: 1 },
  { at: 4250, type: 'lock', x: 4362, final: true },
  { at: 4250, type: 'rebel', mode: 'charge', x: 4600, facing: -1 },
  { at: 4250, type: 'rebel', mode: 'charge', x: 4640, facing: -1 },
  { at: 4250, type: 'rebel', mode: 'grenadier', x: 4650, facing: -1 },
  { at: 4250, type: 'rebel', mode: 'charge', x: 4370, facing: 1 },
].sort((a, b) => a.at - b.at);
