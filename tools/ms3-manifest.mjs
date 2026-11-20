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

  // Mission 1 scenery (separate images): far sky/sea panorama, animated sea band, and three ground pieces
  { name: 'm1.far', sheet: M1, region: [0, 0, 1745, 274], out: 'm1_far.png' },
  { name: 'm1.sea', sheet: M1, region: [1, 276, 707, 393], fps: 8, minW: 600, anchor: 'topleft' },
  { name: 'm1.beach', sheet: M1, region: [0, 1196, 1610, 209], out: 'm1_beach.png', erase: [[1528, 1196, 82, 72]] },
  { name: 'm1.ship', sheet: M1, region: [1614, 858, 1866, 226], out: 'm1_ship.png' },
  { name: 'm1.jungle', sheet: M1, region: [3481, 878, 1190, 206], out: 'm1_jungle.png' }
];
