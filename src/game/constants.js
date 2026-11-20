export const STAGE_LENGTH = 115;
export const BOSS_ARENA_X = 96;
export const GRAVITY = -34;
export const GROUND_Y = 0;

export const WEAPONS = {
  PISTOL: {
    id: 'PISTOL',
    code: 'P',
    name: 'Handgun',
    damage: 14,
    fireRate: 0.22,
    speed: 32,
    ammo: Infinity,
    pellets: 1,
    spread: 0.02,
    explosive: false,
    color: 0xffd166
  },
  HMG: {
    id: 'HMG',
    code: 'H',
    name: 'Heavy Machine Gun',
    damage: 13,
    fireRate: 0.08,
    speed: 38,
    ammo: 120,
    pellets: 1,
    spread: 0.08,
    explosive: false,
    color: 0xff9f1c
  },
  SHOTGUN: {
    id: 'SHOTGUN',
    code: 'S',
    name: 'Shotgun',
    damage: 16,
    fireRate: 0.48,
    speed: 28,
    ammo: 30,
    pellets: 5,
    spread: 0.28,
    explosive: false,
    color: 0xff595e
  },
  ROCKET: {
    id: 'ROCKET',
    code: 'R',
    name: 'Rocket Launcher',
    damage: 55,
    fireRate: 0.55,
    speed: 22,
    ammo: 20,
    pellets: 1,
    spread: 0.01,
    explosive: true,
    color: 0xef476f
  }
};
