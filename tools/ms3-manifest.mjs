// Which sprites to cut from the Metal Slug 3 sheets. region = [x, y, w, h] in sheet pixels; frames = sprites
// found inside it, left to right. Coordinates were read off tools/sheet.mjs previews of each sheet.
export const SHEET_DIR = 'art-source/Metal Slug 3';

const MARCO = 'Marco Rossi [11226].png';
const REBEL = 'Rebel Soldier [20652].png';
const POW = 'P.O.W.s _ Helpful NPCs [11293].png';
const ITEMS = 'Items [39080].png';
const EXPLO = 'Explosion SFX [11305].png';
const WSFX = 'Weapon SFX [20654].png';
const HUD = 'HUD & Interface [29721].png';
const M1 = 'Mission 1 [37874].png';
const HERMIT = 'Huge Hermit [99310].png';
const TITLE = 'Title Screen [551053].png';
const CRAB = 'Chowmein Conga [153630].png';
const SLUG = 'Metal Slug [32523].png';
const CRAB_BG = [[8, 16, 0], [24, 24, 0], [0, 0, 0], [128, 72, 0], [179, 160, 106], [160, 152, 104], [176, 144, 96], [115, 123, 24], [64, 64, 32], [255, 255, 255]];

export const ANIMS = [
  // Marco, handgun set. Upper body and legs are separate sprites, drawn on top of each other like the arcade.
  { name: 'marco.idle.upper', sheet: MARCO, region: [0, 262, 150, 32], fps: 8 },
  { name: 'marco.stand.legs', sheet: MARCO, region: [146, 272, 30, 22] },
  { name: 'marco.grenade.upper', sheet: MARCO, region: [0, 296, 370, 40], fps: 24, loop: false },
  { name: 'marco.run.upper', sheet: MARCO, region: [0, 476, 440, 32], fps: 20 },
  { name: 'marco.run.legs', sheet: MARCO, region: [0, 510, 330, 23], fps: 20 },
  { name: 'marco.jump.upper', sheet: MARCO, region: [0, 862, 215, 28], fps: 12, loop: false },
  { name: 'marco.jump.legs', sheet: MARCO, region: [0, 892, 160, 28], fps: 12, loop: false },
  { name: 'marco.shoot.upper', sheet: MARCO, region: [0, 1046, 460, 31], fps: 30, loop: false, minW: 15 },
  { name: 'marco.knife.upper', sheet: MARCO, region: [0, 1156, 225, 33], fps: 20, loop: false },
  { name: 'marco.shootup.upper', sheet: MARCO, region: [0, 1574, 300, 43], fps: 30, loop: false },
  { name: 'marco.crouch', sheet: MARCO, region: [0, 1726, 165, 28], fps: 8 },
  { name: 'marco.crouchwalk', sheet: MARCO, region: [0, 1755, 290, 28], fps: 14 },
  { name: 'marco.crouchshoot', sheet: MARCO, region: [0, 1814, 460, 33], fps: 30, loop: false, minW: 15 },
  { name: 'marco.death', sheet: MARCO, region: [0, 2642, 177, 38], fps: 8, loop: false },
  { name: 'marco.victory', sheet: MARCO, region: [0, 2889, 180, 46], fps: 8 },

  // Rebel grunt (full-body sprites)
  { name: 'rebel.idle', sheet: REBEL, region: [0, 44, 126, 40], fps: 6 },
  { name: 'rebel.chat', sheet: REBEL, region: [0, 100, 145, 43], fps: 6 },
  { name: 'rebel.scared', sheet: REBEL, region: [0, 245, 505, 46], fps: 14, loop: false },
  { name: 'rebel.run', sheet: REBEL, region: [0, 306, 330, 43], fps: 14 },
  { name: 'rebel.flee', sheet: REBEL, region: [0, 533, 430, 41], fps: 16 },
  { name: 'rebel.knife', sheet: REBEL, region: [0, 1041, 430, 41], fps: 16, loop: false },
  { name: 'rebel.grenade', sheet: REBEL, region: [981, 822, 600, 50], fps: 16, loop: false },
  { name: 'rebel.stickgrenade', sheet: REBEL, region: [981, 1073, 330, 22], fps: 20, anchor: 'center' },
  { name: 'rebel.death', sheet: REBEL, region: [0, 10466, 390, 41], fps: 12, loop: false },
  { name: 'rebel.death.cut', sheet: REBEL, region: [0, 10561, 720, 44], fps: 14, loop: false },

  // P.O.W. (Hyakutaro-style bearded prisoner)
  { name: 'pow.tied', sheet: POW, region: [4, 24, 186, 30], fps: 6 },
  { name: 'pow.walk', sheet: POW, region: [4, 246, 358, 41], fps: 14 },
  { name: 'pow.give', sheet: POW, region: [4, 396, 240, 41], fps: 12, loop: false, pick: [0, 1, 2, 3, 4, 5, 6, 7] },
  { name: 'pow.salute', sheet: POW, region: [4, 440, 430, 37], fps: 12, loop: false },
  { name: 'pow.run', sheet: POW, region: [4, 480, 330, 44], fps: 14 },

  // Items: bomb supply crate, flashing weapon letters, food
  { name: 'item.bombs', sheet: ITEMS, region: [14, 26, 185, 33], fps: 10 },
  { name: 'item.H', sheet: ITEMS, region: [14, 269, 100, 22], fps: 10 },
  { name: 'item.R', sheet: ITEMS, region: [117, 269, 100, 22], fps: 10 },
  { name: 'item.S', sheet: ITEMS, region: [219, 269, 103, 22], fps: 10 },
  { name: 'item.F', sheet: ITEMS, region: [325, 269, 103, 22], fps: 10 },
  { name: 'item.fish', sheet: ITEMS, region: [12, 454, 195, 27], fps: 8 },
  { name: 'item.chicken', sheet: ITEMS, region: [452, 492, 342, 33], fps: 10 },

  // Effects
  { name: 'fx.boom.small', sheet: EXPLO, regions: [[70, 10, 520, 35], [0, 46, 230, 36]], fps: 24, loop: false },
  { name: 'fx.boom.medium', sheet: EXPLO, regions: [[105, 88, 485, 52], [0, 148, 575, 56]], fps: 24, loop: false },
  { name: 'fx.boom.grenade', sheet: EXPLO, regions: [[110, 575, 482, 110], [0, 686, 592, 100]], fps: 24, loop: false, minW: 20, minH: 20, sortX: true },
  { name: 'fx.bullet', sheet: WSFX, rects: [[9, 176, 20, 10]], bg: [0, 248, 0], fps: 1, anchor: 'center' },
  { name: 'fx.hmg', sheet: WSFX, rects: [[4, 20, 30, 5]], bg: [0, 248, 0], fps: 1, anchor: 'center' },
  { name: 'fx.rocket', sheet: WSFX, region: [2, 248, 392, 16], fps: 16, anchor: 'center' },

  // Points font: A-Z then 0-9 (7x8 glyphs, the narrow "1" is 4 px)
  {
    name: 'font.points',
    sheet: HUD,
    bg: [255, 255, 255],
    rects: [
      ...Array.from({ length: 26 }, (_, k) => [3 + 9 * k, 963, 7, 8]),
      [82, 973, 7, 8],
      [4, 973, 4, 8],
      ...Array.from({ length: 8 }, (_, k) => [10 + 9 * k, 973, 7, 8])
    ],
    anchor: 'topleft'
  },

  // Chowmein Conga (small crab, sheet faces left). Each row sits on its own coloured cells, so frames are exact
  // rects and the background is flood-filled from the frame edge over any of the cell colours.
  ...[
    ['crab.idle', [[20, 27, 46, 45], [82, 27, 50, 45], [147, 27, 50, 45], [211, 28, 52, 44], [279, 28, 53, 44], [347, 28, 53, 44], [415, 27, 50, 44]], 8, true],
    ['crab.walk', [[20, 90, 46, 44], [82, 90, 48, 45], [150, 90, 49, 45], [210, 91, 49, 44], [275, 91, 48, 44], [349, 91, 51, 44], [415, 91, 50, 44]], 12, true],
    ['crab.attack', [[23, 295, 48, 44], [87, 295, 45, 44], [148, 287, 40, 52], [204, 289, 43, 50], [253, 293, 54, 46], [317, 295, 62, 44], [394, 295, 75, 44], [480, 294, 75, 45]], 14, false],
    ['crab.death', [[27, 892, 54, 43], [94, 893, 52, 42], [161, 894, 53, 41], [232, 892, 56, 43], [306, 887, 63, 48], [383, 884, 65, 51], [471, 889, 64, 46],
      [30, 959, 66, 47], [112, 963, 59, 43], [196, 963, 64, 43], [272, 955, 68, 51], [354, 954, 68, 52], [443, 951, 68, 55],
      [26, 1017, 68, 54], [103, 1019, 68, 52], [190, 1017, 68, 54], [278, 1024, 68, 47], [351, 1028, 68, 43], [439, 1030, 66, 41], [523, 1050, 62, 21]], 14, false]
  ].map(([name, rects, fps, loop]) => ({ name, sheet: CRAB, rects, fps, loop, flood: true, bg: [112, 24, 0], extraBg: CRAB_BG })),

  // SV-001 Metal Slug, "normal angle" body (faces right; it reverses rather than turning round). Marco rides inside.
  { name: 'slug.idle', sheet: SLUG, region: [0, 20, 210, 62], fps: 8, sortX: true, minW: 40 },
  { name: 'slug.drive', sheet: SLUG, region: [0, 95, 1330, 62], fps: 30, sortX: true, minW: 40 },
  { name: 'slug.fire', sheet: SLUG, region: [0, 437, 650, 62], fps: 30, loop: false, sortX: true, minW: 40 },
  { name: 'slug.jump', sheet: SLUG, region: [0, 572, 250, 76], fps: 12, loop: false, sortX: true, minW: 40 },
  { name: 'slug.land', sheet: SLUG, region: [0, 737, 270, 62], fps: 20, loop: false, sortX: true, minW: 40 },
  { name: 'slug.enter', sheet: SLUG, rects: [[10, 1438, 60, 45], [75, 1440, 60, 43], [140, 1438, 60, 45], [205, 1437, 65, 46], [275, 1444, 70, 39]], fps: 14, loop: false },
  // Vulcan cannon: 32 directions clockwise, frame 4 points straight up, 12 right, 20 down, 28 left
  { name: 'slug.vulcan', sheet: SLUG, rects: [[10,15311,21,21],[36,15309,18,23],[59,15307,15,25],[79,15306,13,26],[97,15306,13,26],[115,15306,13,26],[133,15307,15,25],[153,15309,18,23],[176,15311,21,21],[202,15313,24,19],[231,15317,25,15],[261,15319,26,13],[292,15319,26,13],[323,15319,26,13],[354,15319,24,15],[383,15319,23,18],[411,15319,21,21],[437,15319,18,23],[460,15319,15,25],[480,15319,13,26],[498,15319,13,26],[516,15319,13,26],[534,15319,15,25],[554,15319,18,23],[577,15319,21,21],[602,15319,23,18],[630,15319,25,15],[660,15319,26,13],[691,15319,26,13],[722,15319,26,13],[753,15317,25,15],[783,15314,23,18]], fps: 1, anchor: 'center' },
  // Cannon shell flying level, glowing hotter frame to frame
  { name: 'slug.shell', sheet: SLUG, rects: [3, 4, 5, 6].map((k) => [10 + 18 * k, 18911, 16, 16]), cellBg: true, fps: 16, anchor: 'center' },

  // Big "MISSION START!" font: A-Z, 1-9, ! and ?, each glyph on its own pink/green 32x32 cell (I, 1, ! are 16 wide)
  {
    name: 'font.big',
    sheet: HUD,
    cellBg: true,
    extraBg: [[255, 255, 255]],
    trimX: true,
    rects: [
      ...[3, 37, 71, 105, 139, 173, 207, 241].map((x) => [x, 3, 32, 32]), [275, 3, 16, 32],
      ...[293, 327, 361, 395, 429, 463, 497].map((x) => [x, 3, 32, 32]),
      ...Array.from({ length: 10 }, (_, k) => [3 + 34 * k, 37, 32, 32]),
      [3, 71, 16, 32], ...Array.from({ length: 8 }, (_, k) => [21 + 34 * k, 71, 32, 32]), [293, 71, 16, 32], [311, 71, 32, 32]
    ],
    anchor: 'topleft'
  },
  // CONTINUE? countdown digits 1-9 then 0
  {
    name: 'font.continue',
    sheet: HUD,
    bg: [255, 255, 255],
    flood: true,
    trimX: true,
    rects: [[3, 106, 21, 48], ...[27, 74, 121, 168, 215].map((x) => [x, 106, 44, 48]), [262, 106, 43, 48], ...[308, 355, 402].map((x) => [x, 106, 44, 48])],
    anchor: 'topleft'
  },
  // "GO!" sign: letters pop in, then the arrow sweeps right
  { name: 'sign.go', sheet: HUD, cellBg: true, rects: Array.from({ length: 16 }, (_, k) => [3 + 33 * k, 169, 32, 31]), fps: 16, anchor: 'topleft' },

  // Title screen pieces: METAL SLUG logo, the chrome "3" held by two claws, blue glow (drawn additively)
  { name: 'title.logo', sheet: TITLE, rects: [[283, 4, 210, 104]], bg: [0, 0, 0], flood: true, fps: 1, anchor: 'topleft' },
  { name: 'title.three', sheet: TITLE, rects: [[516, 8, 60, 106]], bg: [0, 0, 0], flood: true, fps: 1, anchor: 'topleft' },
  { name: 'title.claw.l', sheet: TITLE, rects: [[4, 4, 82, 130]], bg: [0, 0, 0], flood: true, fps: 1, anchor: 'topleft' },
  { name: 'title.claw.r', sheet: TITLE, rects: [[198, 4, 81, 130]], bg: [0, 0, 0], flood: true, fps: 1, anchor: 'topleft' },
  { name: 'title.streak', sheet: TITLE, rects: [[18, 138, 249, 35]], bg: [0, 0, 0], flood: true, fps: 1, anchor: 'topleft' },
  { name: 'title.glow', sheet: TITLE, rects: [[299, 194, 271, 152]], keepBg: true, fps: 1, anchor: 'topleft' },

  // Mission 1 scenery (separate images): far sky/sea panorama, animated sea band, and three ground pieces
  { name: 'm1.far', sheet: M1, region: [0, 0, 1745, 274], out: 'm1_far.png' },
  { name: 'm1.sea', sheet: M1, region: [1, 276, 707, 393], fps: 8, minW: 600, anchor: 'topleft' },
  { name: 'm1.beach', sheet: M1, region: [0, 1196, 1610, 209], out: 'm1_beach.png', erase: [[1528, 1196, 82, 72]] },
  { name: 'm1.ship', sheet: M1, region: [1614, 858, 1866, 226], out: 'm1_ship.png' },
  { name: 'm1.jungle', sheet: M1, region: [3481, 878, 1190, 206], out: 'm1_jungle.png' },

  // Boss stage: sunset sea backdrop and the Slug Transport Ferry Marco fights from (intact and damaged rows)
  { name: 'm1.sunset', sheet: M1, region: [2377, 82, 512, 192], out: 'm1_sunset.png', bg: [248, 0, 248] },
  { name: 'ferry', sheet: M1, region: [709, 289, 3180, 100], bg: [248, 0, 248], fps: 8, sortX: true, minW: 150 },
  { name: 'ferry.damaged', sheet: M1, region: [709, 398, 3180, 100], bg: [248, 0, 248], fps: 8, sortX: true, minW: 150, pick: [0, 1, 2, 3, 4, 5, 6, 7] },
  { name: 'ferry.wreck', sheet: M1, region: [709, 398, 3180, 100], bg: [248, 0, 248], fps: 8, sortX: true, minW: 150, pick: [8, 9, 10, 11, 12, 13, 14] },

  // Huge Hermit (sheet faces left). Label strips sit above each row, so regions start just below them.
  { name: 'hermit.move', sheet: HERMIT, region: [0, 14, 2580, 208], fps: 10, sortX: true, minW: 150, gap: 3 },
  { name: 'hermit.shoot', sheet: HERMIT, region: [0, 234, 2580, 206], fps: 12, loop: false, sortX: true, minW: 150, gap: 3 },
  { name: 'hermit.deploy', sheet: HERMIT, region: [0, 653, 2580, 212], fps: 10, loop: false, sortX: true, minW: 150, gap: 3 },
  { name: 'hermit.cmove', sheet: HERMIT, region: [0, 981, 2580, 212], fps: 10, sortX: true, minW: 150, gap: 3 },
  { name: 'hermit.cshoot', sheet: HERMIT, region: [0, 1205, 2580, 212], fps: 12, loop: false, sortX: true, minW: 150, gap: 3 },
  { name: 'hermit.defeat', sheet: HERMIT, region: [0, 1940, 2590, 186], fps: 10, sortX: true, minW: 150, gap: 3 },
  { name: 'hermit.waves', sheet: HERMIT, regions: [[0, 2139, 2400, 58], [0, 2197, 800, 54]], fps: 12, sortX: true, minW: 200, gap: 3 },
  { name: 'hermit.fireball', sheet: HERMIT, region: [0, 454, 100, 27], fps: 12, anchor: 'center', sortX: true, pick: [0, 2] },
  { name: 'hermit.boom', sheet: HERMIT, region: [0, 481, 700, 38], fps: 24, loop: false, sortX: true, minW: 10 },
  { name: 'hermit.shell', sheet: HERMIT, region: [0, 1430, 430, 48], fps: 1, anchor: 'center', sortX: true, minW: 20 }
];
