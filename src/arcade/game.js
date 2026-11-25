// Metal Slug 3 style rules, Mission 1. Pure logic (no DOM): fixed 60 Hz steps, units are pixels and frames.
import { ARENA, groundAt, LEVEL_END, LEVEL_START, pieceAt, SCREEN_W, SCRIPT } from './level.js';

export const FPS = 60;
const GRAVITY = 0.28;
const RUN = 1.5;
const JUMP_VY = -5.2;
const TIME_UNIT = 2 * FPS; // frames per TIME counter tick
export const WEAPONS = {
  P: { name: 'HANDGUN', ammo: Infinity, cooldown: 5, auto: false, speed: 8 },
  H: { name: 'HEAVY MACHINE GUN', ammo: 200, cooldown: 4, auto: true, speed: 9 },
  R: { name: 'ROCKET LAUNCHER', ammo: 30, cooldown: 22, auto: false, speed: 4.5 },
  S: { name: 'SHOTGUN', ammo: 30, cooldown: 24, auto: false, speed: 0 }
};

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}

export function createGame(seed = 7) {
  return {
    seed, rand: rng(seed), frame: 0, phase: 'title', phaseT: 0,
    camX: LEVEL_START, camY: -20, lock: null, scriptIndex: 0,
    time: 60, timeT: 0, score: 0, lives: 2, pows: 0, continueT: 0,
    player: newPlayer(LEVEL_START + 40),
    enemies: [], bullets: [], grenades: [], prisoners: [], items: [], effects: [],
    events: [], banner: null, nextId: 1,
    arena: false, boss: null, transition: null, // boss stage state
    vehicle: null, // the SV-001 Metal Slug: {x, y, hp, cool} (follows Marco while he rides it)
    prevInput: {}
  };
}

function newPlayer(x) {
  return {
    x, y: groundAt(x) - 110, vy: 0, facing: 1, grounded: false, crouch: false, aimUp: false,
    weapon: 'P', ammo: Infinity, bombs: 10, cooldown: 0, invuln: 120,
    action: null, actionT: 0, // 'shoot' | 'knife' | 'throw' (upper body one-shots)
    moving: false, walkT: 0, airT: 0, dead: false, deadT: 0,
    riding: false, gun: 0, enterT: 0, landT: 0 // gun = vulcan angle in radians (0 right, -PI/2 up)
  };
}

const ev = (g, name, data = {}) => g.events.push({ name, ...data });
const alive = (e) => e.state !== 'dead';

export function startGame(g) {
  Object.assign(g, createGame(g.seed), { phase: 'playing' });
  g.banner = { text: 'MISSION 1 START', t: 180, t0: 180 };
  ev(g, 'missionStart');
}

// One fixed step. input: {left,right,up,down,jump,shoot,bomb,start}
export function step(g, input) {
  g.events.length = 0;
  const pressed = (k) => input[k] && !g.prevInput[k];
  g.frame++;
  g.phaseT++;
  if (g.banner && --g.banner.t <= 0) g.banner = null;

  if (g.phase === 'title') {
    if (pressed('start') || pressed('shoot') || pressed('jump')) startGame(g);
    g.prevInput = { ...input };
    return;
  }
  if (g.phase === 'continue') {
    g.continueT--;
    if (pressed('start') || pressed('shoot')) { g.lives = 2; g.score = 0; g.phase = 'playing'; respawn(g); ev(g, 'continue'); }
    else if (g.continueT <= 0) { g.phase = 'gameover'; g.phaseT = 0; }
    g.prevInput = { ...input };
    return;
  }
  if (g.phase === 'gameover' || g.phase === 'complete') {
    if (g.phaseT > 120 && (pressed('start') || pressed('shoot'))) { g.phase = 'title'; g.phaseT = 0; }
    stepActors(g);
    g.prevInput = { ...input };
    return;
  }

  if (g.transition !== null) stepTransition(g);
  runScript(g);
  stepPlayer(g, input, pressed);
  stepActors(g);
  stepCamera(g);
  stepTime(g);
  g.prevInput = { ...input };
}

function stepTime(g) {
  if (g.player.dead || g.phase !== 'playing') return;
  if (++g.timeT >= TIME_UNIT) {
    g.timeT = 0;
    g.time--;
    if (g.time <= 0) killPlayer(g, true);
  }
}

function runScript(g) {
  while (g.scriptIndex < SCRIPT.length && SCRIPT[g.scriptIndex].at <= g.camX) {
    const s = SCRIPT[g.scriptIndex++];
    if (s.type === 'rebel') spawnRebel(g, s.x, s.mode, s.facing);
    else if (s.type === 'crab') spawnCrab(g, s.x, s.facing ?? -1);
    else if (s.type === 'slug') g.vehicle = { x: s.x, y: groundAt(s.x), hp: SLUG.hp, cool: 0 };
    else if (s.type === 'pow') g.prisoners.push({ id: g.nextId++, x: s.x, y: groundAt(s.x), state: 'tied', t: 0, drop: s.drop, facing: -1 });
    else if (s.type === 'item') spawnItem(g, s.kind, s.x, groundAt(s.x));
    else if (s.type === 'lock') g.lock = { x: s.x, final: !!s.final, engaged: false };
  }
}

export function spawnRebel(g, x, mode = 'charge', facing = -1) {
  const e = { id: g.nextId++, x, y: groundAt(x), vy: 0, facing, mode, state: mode === 'chat' || mode === 'idle' ? mode : 'run', t: 0, cool: 40 + Math.floor(g.rand() * 60), deathAnim: 'rebel.death' };
  if (mode === 'grenadier') e.state = 'aim';
  g.enemies.push(e);
  return e;
}

function spawnItem(g, kind, x, y) {
  g.items.push({ id: g.nextId++, kind, x, y: y - 6, vy: -2.5, t: 0 });
}

// ---------------------------------------------------------------- player
function stepPlayer(g, input, pressed) {
  const p = g.player;
  if (p.invuln > 0) p.invuln--;
  if (p.dead) {
    p.deadT++;
    if (p.deadT > 90) {
      if (g.lives > 0) { g.lives--; respawn(g); }
      else { g.phase = 'continue'; g.continueT = 10 * FPS; g.phaseT = 0; }
    }
    return;
  }
  if (p.cooldown > 0) p.cooldown--;
  if (p.action && ++p.actionT > actionLength(p.action)) { p.action = null; p.actionT = 0; }
  if (g.vehicle && g.vehicle.cool > 0) g.vehicle.cool--;
  if (p.riding) return stepRiding(g, p, input, pressed);

  // movement
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  p.crouch = !!input.down && p.grounded;
  p.aimUp = !!input.up;
  if (dir) p.facing = dir;
  const speed = p.crouch ? RUN * 0.5 : RUN;
  p.moving = dir !== 0;
  if (p.moving) { p.x += dir * speed; p.walkT++; } else p.walkT = 0;
  p.x = Math.max(g.camX + 10, Math.min(g.camX + SCREEN_W - 10, p.x));
  if (g.arena) p.x = Math.max(ARENA.x + ARENA.minX, Math.min(ARENA.x + ARENA.maxX, p.x));
  else p.x = Math.min(p.x, LEVEL_END - 10);

  if (pressed('jump') && p.grounded && !p.crouch) { p.vy = JUMP_VY; p.grounded = false; p.airT = 0; ev(g, 'jump'); }
  const ground = groundAt(p.x);
  if (p.grounded) {
    if (ground - p.y > 10) { p.grounded = false; p.vy = 0; p.airT = 0; } else p.y = ground;
  }
  if (!p.grounded) {
    p.vy = Math.min(p.vy + GRAVITY, 7);
    p.y += p.vy;
    p.airT++;
    if (p.y >= ground && p.vy >= 0) { p.y = ground; p.vy = 0; p.grounded = true; }
  }

  // attacks
  const w = WEAPONS[p.weapon];
  const wantShoot = w.auto ? input.shoot : pressed('shoot');
  if (wantShoot && p.cooldown <= 0) attack(g);
  if (pressed('bomb') && p.bombs > 0 && p.action !== 'throw') throwGrenade(g);

  // walking (or dropping) into the parked Metal Slug climbs in
  const v = g.vehicle;
  if (v && !g.arena && v.cool <= 0 && p.vy >= 0 && Math.abs(p.x - v.x) < 16 && p.y >= v.y - 34 && p.y <= v.y + 4) enterSlug(g);
  touchStuff(g, p);
}

function touchStuff(g, p) {
  // pickups
  for (const it of g.items) {
    if (!it.taken && Math.abs(it.x - p.x) < (p.riding ? 26 : 16) && Math.abs(it.y - (p.y - 12)) < 24) collect(g, it);
  }
  // touching a tied prisoner frees him
  for (const pw of g.prisoners) if (pw.state === 'tied' && Math.abs(pw.x - p.x) < (p.riding ? 24 : 14) && Math.abs(pw.y - p.y) < 20) freePrisoner(g, pw);
}

// ---------------------------------------------------------------- SV-001 Metal Slug
// The tank always faces right and reverses to go left. The vulcan turns toward where Marco aims (over the top when
// swinging round), the cannon fires shells forward and uses the BOMB count, and hits wear down its 3-point armour
// instead of killing Marco. Down + jump bails out.
export const SLUG = { hp: 3, speed: 1.25, jumpVy: -4.6, pivot: { x: 6, y: -33 }, barrel: 18 };
const TURN = Math.PI / 16; // one vulcan frame

function enterSlug(g) {
  const p = g.player, v = g.vehicle;
  p.riding = true; p.x = v.x; p.y = v.y; p.vy = 0; p.grounded = true; p.crouch = false;
  p.enterT = 22; p.gun = 0; p.action = null;
  ev(g, 'slugEnter');
}

function exitSlug(g) {
  const p = g.player, v = g.vehicle;
  p.riding = false;
  v.x = p.x; v.y = groundAt(p.x); v.cool = 45;
  p.vy = JUMP_VY; p.grounded = false; p.airT = 0; p.invuln = Math.max(p.invuln, 30);
  ev(g, 'slugExit');
}

function hitSlug(g) {
  const p = g.player, v = g.vehicle;
  if (p.invuln > 0) return;
  v.hp--; p.invuln = 60;
  ev(g, 'slugHit');
  if (v.hp > 0) return;
  for (let i = 0; i < 4; i++) g.effects.push({ anim: 'fx.boom.grenade', x: p.x - 20 + i * 13, y: p.y - (i % 2) * 14, t: -i * 6 });
  exitSlug(g);
  g.vehicle = null;
  p.invuln = 120;
  ev(g, 'slugDestroyed');
}

export function slugMuzzle(p) {
  const hx = p.x + SLUG.pivot.x, hy = p.y + SLUG.pivot.y;
  return { x: hx + Math.cos(p.gun) * SLUG.barrel, y: hy + Math.sin(p.gun) * SLUG.barrel };
}

const turnBy = (a, d) => Math.atan2(Math.sin(a + d), Math.cos(a + d));

function stepRiding(g, p, input, pressed) {
  const v = g.vehicle;
  if (p.enterT > 0) p.enterT--;
  if (p.landT > 0) p.landT--;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  p.crouch = false;
  p.aimUp = !!input.up;
  if (dir) p.facing = dir;
  p.moving = dir !== 0 && p.enterT <= 0;
  if (p.moving) { p.x += dir * SLUG.speed; p.walkT++; } else p.walkT = 0;
  p.x = Math.max(g.camX + 24, Math.min(g.camX + SCREEN_W - 24, p.x));
  p.x = Math.min(p.x, LEVEL_END - 24);

  if (input.down && pressed('jump') && p.enterT <= 0) { exitSlug(g); return; }
  if (pressed('jump') && p.grounded) { p.vy = SLUG.jumpVy; p.grounded = false; p.airT = 0; ev(g, 'jump'); }
  const ground = groundAt(p.x);
  if (p.grounded) {
    if (ground - p.y > 10) { p.grounded = false; p.vy = 0; p.airT = 0; } else p.y = ground;
  }
  if (!p.grounded) {
    p.vy = Math.min(p.vy + GRAVITY, 7);
    p.y += p.vy;
    p.airT++;
    if (p.y >= ground && p.vy >= 0) { p.y = ground; p.vy = 0; p.grounded = true; p.landT = 12; }
  }
  v.x = p.x; v.y = p.y;

  // vulcan: one frame (11.25 degrees) every 2 steps toward the aim, swinging over the top between left and right
  const target = input.up ? -Math.PI / 2 : input.down && !p.grounded ? Math.PI / 2 : p.facing > 0 ? 0 : Math.PI;
  let diff = Math.atan2(Math.sin(target - p.gun), Math.cos(target - p.gun));
  if (Math.abs(diff) > Math.PI - 0.01) diff = Math.cos(p.gun) > 0 ? -Math.PI : Math.PI;
  if (g.frame % 2 === 0 && Math.abs(diff) > 0.01) p.gun = turnBy(p.gun, Math.sign(diff) * Math.min(Math.abs(diff), TURN));

  if (p.enterT <= 0 && input.shoot && p.cooldown <= 0) {
    // point blank: an enemy pressed against the hull is hit straight away (the on-foot knife rule, tank style)
    const close = g.enemies.find((e) => alive(e) && Math.abs(e.x - p.x) < 24 && Math.abs(e.y - p.y) < 24);
    const m = slugMuzzle(p);
    if (close) killEnemy(g, close, 'rebel.death', 1);
    else g.bullets.push({ id: g.nextId++, from: 'p', kind: 'hmg', x: m.x, y: m.y, vx: Math.cos(p.gun) * 9, vy: Math.sin(p.gun) * 9, life: 90 });
    p.cooldown = 5;
    ev(g, 'hmg');
  }
  if (p.enterT <= 0 && pressed('bomb') && p.bombs > 0 && p.action !== 'cannon') {
    p.bombs--; p.action = 'cannon'; p.actionT = 0;
    g.grenades.push({ id: g.nextId++, from: 'p', kind: 'cshell', x: p.x + 24, y: p.y - 26, vx: 4.6, vy: -0.8, a: 0.05, bounces: 1, t: 0, radius: 34, anim: 'fx.boom.grenade' });
    ev(g, 'cannon');
  }
  touchStuff(g, p);
}

function actionLength(a) {
  return a === 'shoot' ? 10 : a === 'knife' ? 18 : a === 'throw' ? 18 : a === 'cannon' ? 24 : 10;
}

export function muzzle(p) {
  if (p.aimUp) return { x: p.x + p.facing * 4, y: p.y - 46 };
  return { x: p.x + p.facing * 22, y: p.y - (p.crouch ? 13 : 22) };
}

function attack(g) {
  const p = g.player;
  // knife when a rebel is in reach (arcade auto-melee)
  const near = g.enemies.find((e) => alive(e) && Math.abs(e.x - p.x) < 26 && Math.abs(e.y - p.y) < 24);
  if (near && !p.aimUp) {
    p.action = 'knife'; p.actionT = 0; p.cooldown = 14;
    near.facing = Math.sign(p.x - near.x) || 1;
    killEnemy(g, near, 'rebel.death.cut', 3);
    ev(g, 'knife');
    return;
  }
  const w = WEAPONS[p.weapon];
  const m = muzzle(p);
  const vx = p.aimUp ? 0 : p.facing, vy = p.aimUp ? -1 : 0;
  p.action = 'shoot'; p.actionT = 0; p.cooldown = w.cooldown;
  if (p.weapon === 'S') {
    // shotgun: instant short-range blast
    g.effects.push({ anim: 'fx.boom.small', x: m.x + vx * 18, y: m.y + 8 + vy * 18, t: 0 });
    for (const e of g.enemies) {
      if (!alive(e)) continue;
      const dx = (e.x - m.x) * vx, dy = e.y - 18 - m.y;
      if ((vx && dx > -4 && dx < 70 && Math.abs(dy) < 30) || (vy && Math.abs(e.x - m.x) < 26 && dy < 0 && dy > -80)) killEnemy(g, e, 'rebel.death', 3);
    }
    const b = g.boss;
    if (b && vx < 0 && m.x - (b.x + BOSS_BOX.right) < 70) hitBoss(g, 4); // the boss is always to the left
    ev(g, 'shotgun');
  } else {
    const jitter = p.weapon === 'H' ? (g.frame % 2 ? 2 : -2) : 0;
    g.bullets.push({ id: g.nextId++, from: 'p', kind: p.weapon === 'R' ? 'rocket' : p.weapon === 'H' ? 'hmg' : 'bullet', x: m.x, y: m.y + (vy ? 0 : jitter), vx: vx * w.speed, vy: vy * w.speed, life: 90 });
    ev(g, p.weapon === 'H' ? 'hmg' : p.weapon === 'R' ? 'rocket' : 'shoot');
  }
  if (Number.isFinite(p.ammo) && --p.ammo <= 0) { p.weapon = 'P'; p.ammo = Infinity; }
}

function throwGrenade(g) {
  const p = g.player;
  p.bombs--; p.action = 'throw'; p.actionT = 0;
  g.grenades.push({ id: g.nextId++, from: 'p', x: p.x + p.facing * 8, y: p.y - 30, vx: p.facing * 2.6, vy: -3.4, bounces: 0, t: 0 });
  ev(g, 'throw');
}

function collect(g, it) {
  const p = g.player;
  it.taken = true;
  if ('HRS'.includes(it.kind)) {
    p.weapon = it.kind; p.ammo = WEAPONS[it.kind].ammo;
    g.banner = { text: WEAPONS[it.kind].name, t: 90, t0: 90 };
    ev(g, 'weapon', { kind: it.kind });
  } else if (it.kind === 'bombs') { p.bombs += 10; ev(g, 'pickup'); }
  else { g.score += it.kind === 'chicken' ? 1000 : 500; ev(g, 'pickup'); }
}

// force: the TIME counter running out kills Marco even inside the Metal Slug
function killPlayer(g, force = false) {
  const p = g.player;
  if (p.dead) return;
  if (p.riding) {
    if (!force) return hitSlug(g);
    p.riding = false; g.vehicle = null;
  }
  p.dead = true; p.deadT = 0; p.action = null;
  ev(g, 'playerDie');
}

function respawn(g) {
  const keep = g.player;
  g.player = newPlayer(Math.max(g.camX + 50, Math.min(keep.x, g.camX + 200)));
  g.time = 60; g.timeT = 0;
}

// ---------------------------------------------------------------- actors
function stepActors(g) {
  for (const b of g.bullets) {
    b.x += b.vx; b.y += b.vy; b.life--;
    if (b.x < g.camX - 20 || b.x > g.camX + SCREEN_W + 20 || b.y < g.camY - 40) b.life = 0;
    if (b.from === 'p') {
      for (const e of g.enemies) {
        if (!alive(e) || b.life <= 0) continue;
        if (Math.abs(e.x - b.x) < 10 && b.y > e.y - 38 && b.y < e.y) {
          if (b.kind === 'rocket') explode(g, b.x, b.y, 28, 'p', 'fx.boom.medium');
          else killEnemy(g, e);
          b.life = 0;
        }
      }
      if (b.life > 0 && inBoss(g, b.x, b.y)) {
        if (b.kind === 'rocket') explode(g, b.x, b.y, 28, 'p', 'fx.boom.medium'); else { hitBoss(g, 1); g.effects.push({ anim: 'fx.boom.small', x: b.x, y: b.y + 6, t: 12 }); }
        b.life = 0;
      }
      for (const pw of g.prisoners) if (pw.state === 'tied' && b.life > 0 && Math.abs(pw.x - b.x) < 10 && b.y > pw.y - 26 && b.y < pw.y) { freePrisoner(g, pw); b.life = 0; }
      if (b.kind === 'rocket' && b.life > 0 && b.y >= groundAt(b.x)) { explode(g, b.x, b.y, 28, 'p', 'fx.boom.medium'); b.life = 0; }
      if (b.kind === 'rocket') b.vx *= 1.05;
    }
  }
  g.bullets = g.bullets.filter((b) => b.life > 0);

  // grenades (player bombs and rebel stick grenades)
  for (const gr of g.grenades) {
    gr.t++;
    gr.vy += gr.a ?? (gr.from === 'p' ? 0.2 : 0.16);
    gr.x += gr.vx; gr.y += gr.vy;
    const gy = groundAt(gr.x);
    const hitEnemy = gr.from === 'p' && (g.enemies.some((e) => alive(e) && Math.abs(e.x - gr.x) < 10 && gr.y > e.y - 36 && gr.y < e.y) || inBoss(g, gr.x, gr.y));
    const p = g.player;
    const hitPlayer = gr.from === 'e' && gr.kind && !p.dead && Math.abs(p.x - gr.x) < 10 && gr.y > p.y - 34 && gr.y < p.y;
    if (gr.y >= gy || hitEnemy || hitPlayer) {
      gr.y = Math.min(gr.y, gy);
      if (gr.from === 'p' && gr.bounces === 0 && !hitEnemy) { gr.bounces = 1; gr.vy = -1.6; gr.vx *= 0.6; }
      else { gr.done = true; explode(g, gr.x, gr.y, gr.radius ?? (gr.from === 'p' ? 32 : 18), gr.from, gr.anim ?? (gr.from === 'p' ? 'fx.boom.grenade' : 'fx.boom.small')); }
    }
  }
  g.grenades = g.grenades.filter((gr) => !gr.done);

  if (g.boss) stepBoss(g, g.boss);
  for (const e of g.enemies) (e.kind === 'crab' ? stepCrab : stepRebel)(g, e);
  g.enemies = g.enemies.filter((e) => !(e.state === 'dead' && e.t > (e.kind === 'crab' ? 110 : 80)) && e.x > g.camX - 120);

  for (const pw of g.prisoners) stepPrisoner(g, pw);
  g.prisoners = g.prisoners.filter((pw) => !(pw.state === 'run' && pw.x < g.camX - 40) && pw.x > g.camX - 200);

  for (const it of g.items) {
    it.t++;
    const gy = groundAt(it.x);
    if (it.y < gy || it.vy < 0) { it.vy += 0.2; it.y = Math.min(gy, it.y + it.vy); if (it.y >= gy) it.vy = 0; }
  }
  g.items = g.items.filter((it) => !it.taken && it.x > g.camX - 40);

  for (const fx of g.effects) fx.t++;
  g.effects = g.effects.filter((fx) => fx.t < 90);

  // lock release / mission complete
  if (g.lock && g.lock.engaged && !g.enemies.some(alive) && g.phase === 'playing') {
    if (g.lock.final) g.transition = 0;
    else { g.banner = { text: 'GO', t: 150, t0: 150 }; ev(g, 'go'); }
    g.lock = null;
  }
}

function explode(g, x, y, radius, from, anim) {
  g.effects.push({ anim, x, y, t: 0 });
  ev(g, 'explode', { big: radius > 24 });
  if (from === 'p') {
    for (const e of g.enemies) if (alive(e) && Math.abs(e.x - x) < radius && Math.abs(e.y - 18 - y) < radius + 18) killEnemy(g, e, 'rebel.death', 4);
    if (g.boss && inBoss(g, Math.min(x + radius, Math.max(x - radius, g.boss.x)), y)) hitBoss(g, radius >= 28 ? 6 : 3);
  } else {
    const p = g.player;
    if (!p.dead && p.invuln <= 0 && Math.abs(p.x - x) < radius && Math.abs(p.y - 16 - y) < radius + 16) killPlayer(g);
  }
}

// dmg only matters for enemies with hit points (crabs); a rebel dies to anything.
function killEnemy(g, e, anim = 'rebel.death', dmg = 1) {
  if (!alive(e)) return;
  if (e.hp !== undefined) {
    e.hp -= dmg; e.flash = 4;
    if (e.hp > 0) { ev(g, 'enemyHit'); return; }
    anim = 'crab.death';
  }
  e.state = 'dead'; e.t = 0; e.deathAnim = anim;
  g.score += e.kind === 'crab' ? 300 : 100;
  ev(g, 'enemyDie');
}

// Chowmein Conga: a crab that scuttles at Marco and swipes a claw that throws up a sand blast.
export const CRAB_HP = 6;
export function spawnCrab(g, x, facing = -1) {
  const e = { id: g.nextId++, kind: 'crab', x, y: groundAt(x), facing, state: 'idle', t: 0, hp: CRAB_HP, flash: 0, cool: 0, deathAnim: 'crab.death' };
  g.enemies.push(e);
  return e;
}

function stepCrab(g, e) {
  const p = g.player;
  e.t++;
  if (e.flash > 0) e.flash--;
  if (e.state === 'dead') return;
  e.y = groundAt(e.x);
  const dx = p.x - e.x, dist = Math.abs(dx);
  const onScreen = e.x > g.camX - 10 && e.x < g.camX + SCREEN_W + 10;
  if (e.cool > 0) e.cool--;
  switch (e.state) {
    case 'idle':
      if (onScreen && dist < 220) { e.state = 'walk'; e.t = 0; }
      break;
    case 'walk':
      e.facing = Math.sign(dx) || e.facing;
      if (dist > 34) e.x += e.facing * 0.55;
      else if (e.cool <= 0 && !p.dead) { e.state = 'attack'; e.t = 0; }
      break;
    case 'attack':
      // the sand blast leaves the claw on the 7th frame of the 14 fps swipe
      if (e.t === 26) {
        ev(g, 'crabSwipe');
        if (!p.dead && p.invuln <= 0 && dist < 50 && Math.sign(dx) === e.facing && Math.abs(p.y - e.y) < 30) killPlayer(g);
      }
      if (e.t > 40) { e.state = 'walk'; e.t = 0; e.cool = 50; }
      break;
  }
}

function stepRebel(g, e) {
  const p = g.player;
  e.t++;
  if (e.state === 'dead') return;
  e.y = groundAt(e.x);
  const dx = p.x - e.x, dist = Math.abs(dx);
  const onScreen = e.x > g.camX - 10 && e.x < g.camX + SCREEN_W + 10;

  switch (e.state) {
    case 'idle':
    case 'chat': {
      const heard = g.bullets.some((b) => b.from === 'p' && Math.abs(b.x - e.x) < 90);
      if ((onScreen && dist < 150) || heard) { e.state = 'scared'; e.t = 0; e.facing = Math.sign(dx) || -1; }
      break;
    }
    case 'scared':
      if (e.t > 40) { e.state = e.mode === 'grenadier' || g.rand() < 0.4 ? 'aim' : 'run'; e.t = 0; }
      break;
    case 'run': {
      e.facing = Math.sign(dx) || e.facing;
      if (dist > 22) e.x += e.facing * 1.25;
      else if (!p.dead) { e.state = 'knife'; e.t = 0; }
      break;
    }
    case 'knife':
      // the blade is out on the 10th frame of the 16 fps knife animation
      if (e.t === 36 && !p.dead && p.invuln <= 0 && Math.abs(p.x - e.x) < 34 && Math.abs(p.y - e.y) < 30) killPlayer(g);
      if (e.t > 48) { e.state = 'run'; e.t = 0; }
      break;
    case 'aim': {
      e.facing = Math.sign(dx) || e.facing;
      if (!onScreen) e.x += e.facing * 1.0;
      else if (dist > 170) e.x += e.facing * 0.8;
      else if (dist < 70) e.x -= e.facing * 0.8;
      if (--e.cool <= 0 && onScreen && !p.dead) { e.state = 'throw'; e.t = 0; }
      break;
    }
    case 'throw':
      if (e.t === 30) {
        const flight = 60, tx = p.x - e.x;
        g.grenades.push({ id: g.nextId++, from: 'e', x: e.x + e.facing * 6, y: e.y - 40, vx: Math.max(-3, Math.min(3, tx / flight)), vy: -4.2, bounces: 1, t: 0 });
        ev(g, 'enemyThrow');
      }
      if (e.t > 60) { e.state = 'aim'; e.t = 0; e.cool = 90 + Math.floor(g.rand() * 90); }
      break;
  }
}

function freePrisoner(g, pw) {
  pw.state = 'walk'; pw.t = 0;
  ev(g, 'powFree');
}

function stepPrisoner(g, pw) {
  const p = g.player;
  pw.t++;
  pw.y = groundAt(pw.x);
  if (pw.state === 'walk') {
    pw.facing = Math.sign(p.x - pw.x) || 1;
    if (Math.abs(p.x - pw.x) > 18) pw.x += pw.facing * 0.9;
    else { pw.state = 'give'; pw.t = 0; }
    if (pw.t > 240) { pw.state = 'give'; pw.t = 0; }
  } else if (pw.state === 'give') {
    if (pw.t === 30) { spawnItem(g, pw.drop, (pw.x + p.x) / 2, pw.y); g.pows++; ev(g, 'thankYou'); }
    if (pw.t > 42) { pw.state = 'salute'; pw.t = 0; }
  } else if (pw.state === 'salute') {
    if (pw.t > 70) { pw.state = 'run'; pw.t = 0; pw.facing = -1; }
  } else if (pw.state === 'run') {
    pw.x -= 2.4;
  }
}

// ---------------------------------------------------------------- boss stage
// Huge Hermit faces right (toward the ferry). x/y = bottom-centre of its sprite in world pixels.
export const BOSS_HP = 160;
const BOSS_BOX = { left: -70, right: 92, top: -200, bottom: -20 };
const inBoss = (g, x, y) => {
  const b = g.boss;
  return !!b && b.state !== 'defeat' && b.state !== 'enter' && x > b.x + BOSS_BOX.left && x < b.x + BOSS_BOX.right && y > b.y + BOSS_BOX.top && y < b.y + BOSS_BOX.bottom;
};

// Fade out, put Marco on the ferry, fade in. The swap happens at the darkest frame.
function stepTransition(g) {
  g.transition++;
  if (g.transition === 45) enterArena(g);
  if (g.transition >= 90) g.transition = null;
}

function enterArena(g) {
  g.arena = true;
  g.camX = ARENA.x; g.camY = 0;
  g.enemies = []; g.bullets = []; g.grenades = []; g.items = []; g.prisoners = []; g.effects = [];
  g.vehicle = null; // the Metal Slug stays on the shore
  const keep = g.player;
  g.player = { ...newPlayer(ARENA.x + 200), weapon: keep.weapon, ammo: keep.ammo, bombs: keep.bombs, invuln: 0 };
  g.player.y = groundAt(g.player.x); g.player.grounded = true;
  g.time = 60; g.timeT = 0;
  g.boss = { x: ARENA.x - 130, y: 236, hp: BOSS_HP, state: 'enter', t: 0, phase2: false, flash: 0, goal: ARENA.x + 55, volley: 0 };
  ev(g, 'bossAppear');
}

function hitBoss(g, dmg) {
  const b = g.boss;
  if (!b || b.state === 'defeat' || b.state === 'enter') return;
  b.hp -= dmg; b.flash = 4;
  g.score += 10 * dmg;
  if (b.hp <= 0) { b.state = 'defeat'; b.t = 0; g.grenades = g.grenades.filter((gr) => gr.from === 'p'); g.score += 30000; ev(g, 'bossDie'); }
}

// Lob a projectile from (x, y) that lands on the deck at tx after `flight` frames.
function lob(g, kind, x, y, tx, flight, vy) {
  const ty = groundAt(tx);
  const a = (2 * (ty - y - vy * flight)) / (flight * flight);
  g.grenades.push({ id: g.nextId++, from: 'e', kind, x, y, vx: (tx - x) / flight, vy, a, bounces: 1, t: 0,
    radius: kind === 'shell' ? 26 : 18, anim: kind === 'shell' ? 'fx.boom.grenade' : 'hermit.boom' });
}

function stepBoss(g, b) {
  const p = g.player;
  b.t++;
  if (b.flash > 0) b.flash--;
  const next = () => { b.state = 'walk'; b.t = 0; b.goal = ARENA.x + (b.goal > ARENA.x + 55 ? 40 : 70); };
  switch (b.state) {
    case 'enter':
      b.x += 0.8;
      if (b.x >= b.goal) next();
      break;
    case 'walk':
      if (Math.abs(b.goal - b.x) > 0.5) b.x += Math.sign(b.goal - b.x) * 0.4;
      if (b.t > 80) {
        b.t = 0;
        if (!b.phase2 && b.hp <= BOSS_HP / 2) { b.state = 'deploy'; ev(g, 'bossDeploy'); }
        else b.state = b.phase2 && b.volley++ % 3 !== 2 ? 'cshoot' : 'shoot';
      }
      break;
    case 'shoot':
      // the small top cannon spits a fireball up and over onto the deck
      if (b.t === 30 && !p.dead) { lob(g, 'fireball', b.x + 62, b.y - 186, p.x, 70, -3); ev(g, 'bossShoot'); }
      if (b.t > 60) next();
      break;
    case 'deploy':
      if (b.t > 72) { b.phase2 = true; next(); }
      break;
    case 'cshoot':
      // the deployed cannon fires a heavy shell that tips over and drops on Marco
      if (b.t === 24 && !p.dead) { lob(g, 'shell', b.x + 96, b.y - 112, p.x + (g.rand() - 0.5) * 40, 60, -3.6); ev(g, 'bossCannon'); }
      if (b.t > 60) next();
      break;
    case 'defeat':
      if (b.t % 7 === 0 && b.t < 180) {
        g.effects.push({ anim: b.t % 14 ? 'fx.boom.medium' : 'fx.boom.grenade', x: b.x - 60 + g.rand() * 140, y: b.y - 30 - g.rand() * 150, t: 0 });
        ev(g, 'explode', { big: true });
      }
      if (b.t > 150) b.y += 0.6; // sinks under the waves
      if (b.t === 300) { g.phase = 'complete'; g.phaseT = 0; g.banner = { text: 'MISSION COMPLETE', t: 600, t0: 600 }; g.score += g.pows * 1000; ev(g, 'missionComplete'); }
      break;
  }
}

// ---------------------------------------------------------------- camera
function stepCamera(g) {
  const p = g.player;
  if (g.arena) { g.camX = ARENA.x; g.camY = 0; return; }
  let target = Math.max(g.camX, p.x - 120);
  if (g.lock) {
    if (g.camX >= g.lock.x) g.lock.engaged = true;
    target = Math.min(target, g.lock.x);
  }
  target = Math.min(target, LEVEL_END - SCREEN_W);
  g.camX = Math.round(g.camX + Math.max(0, Math.min(3, target - g.camX)));
  const wantY = Math.max(pieceAt(g.camX + SCREEN_W / 2).minCamY ?? -130, Math.min(24, groundAt(p.x) - 186));
  g.camY += (wantY - g.camY) * 0.08;
}

// Exposed for tests
export const _internal = { enterSlug, exitSlug, hitSlug, killPlayer, killEnemy, explode, collect, freePrisoner, enterArena, hitBoss };
