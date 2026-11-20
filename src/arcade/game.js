// Metal Slug 3 style rules, Mission 1. Pure logic (no DOM): fixed 60 Hz steps, units are pixels and frames.
import { groundAt, LEVEL_END, LEVEL_START, pieceAt, SCREEN_W, SCRIPT } from './level.js';

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
    prevInput: {}
  };
}

function newPlayer(x) {
  return {
    x, y: groundAt(x) - 110, vy: 0, facing: 1, grounded: false, crouch: false, aimUp: false,
    weapon: 'P', ammo: Infinity, bombs: 10, cooldown: 0, invuln: 120,
    action: null, actionT: 0, // 'shoot' | 'knife' | 'throw' (upper body one-shots)
    moving: false, walkT: 0, airT: 0, dead: false, deadT: 0
  };
}

const ev = (g, name, data = {}) => g.events.push({ name, ...data });
const alive = (e) => e.state !== 'dead';

export function startGame(g) {
  Object.assign(g, createGame(g.seed), { phase: 'playing' });
  g.banner = { text: 'MISSION 1 START', t: 150 };
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
    if (g.time <= 0) killPlayer(g);
  }
}

function runScript(g) {
  while (g.scriptIndex < SCRIPT.length && SCRIPT[g.scriptIndex].at <= g.camX) {
    const s = SCRIPT[g.scriptIndex++];
    if (s.type === 'rebel') spawnRebel(g, s.x, s.mode, s.facing);
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

  // movement
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  p.crouch = !!input.down && p.grounded;
  p.aimUp = !!input.up;
  if (dir) p.facing = dir;
  const speed = p.crouch ? RUN * 0.5 : RUN;
  p.moving = dir !== 0;
  if (p.moving) { p.x += dir * speed; p.walkT++; } else p.walkT = 0;
  p.x = Math.max(g.camX + 10, Math.min(g.camX + SCREEN_W - 10, p.x));
  p.x = Math.min(p.x, LEVEL_END - 10);

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

  // pickups
  for (const it of g.items) {
    if (!it.taken && Math.abs(it.x - p.x) < 16 && Math.abs(it.y - (p.y - 12)) < 24) collect(g, it);
  }
  // touching a tied prisoner frees him
  for (const pw of g.prisoners) if (pw.state === 'tied' && Math.abs(pw.x - p.x) < 14 && Math.abs(pw.y - p.y) < 20) freePrisoner(g, pw);
}

function actionLength(a) {
  return a === 'shoot' ? 10 : a === 'knife' ? 18 : a === 'throw' ? 18 : 10;
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
    killEnemy(g, near, 'rebel.death.cut');
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
      if ((vx && dx > -4 && dx < 70 && Math.abs(dy) < 30) || (vy && Math.abs(e.x - m.x) < 26 && dy < 0 && dy > -80)) killEnemy(g, e);
    }
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
    g.banner = { text: WEAPONS[it.kind].name, t: 90 };
    ev(g, 'weapon', { kind: it.kind });
  } else if (it.kind === 'bombs') { p.bombs += 10; ev(g, 'pickup'); }
  else { g.score += it.kind === 'chicken' ? 1000 : 500; ev(g, 'pickup'); }
}

function killPlayer(g) {
  const p = g.player;
  if (p.dead) return;
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
      for (const pw of g.prisoners) if (pw.state === 'tied' && b.life > 0 && Math.abs(pw.x - b.x) < 10 && b.y > pw.y - 26 && b.y < pw.y) { freePrisoner(g, pw); b.life = 0; }
      if (b.kind === 'rocket' && b.life > 0 && b.y >= groundAt(b.x)) { explode(g, b.x, b.y, 28, 'p', 'fx.boom.medium'); b.life = 0; }
      if (b.kind === 'rocket') b.vx *= 1.05;
    }
  }
  g.bullets = g.bullets.filter((b) => b.life > 0);

  // grenades (player bombs and rebel stick grenades)
  for (const gr of g.grenades) {
    gr.t++;
    gr.vy += gr.from === 'p' ? 0.2 : 0.16;
    gr.x += gr.vx; gr.y += gr.vy;
    const gy = groundAt(gr.x);
    const hitEnemy = gr.from === 'p' && g.enemies.some((e) => alive(e) && Math.abs(e.x - gr.x) < 10 && gr.y > e.y - 36 && gr.y < e.y);
    if (gr.y >= gy || hitEnemy) {
      gr.y = Math.min(gr.y, gy);
      if (gr.from === 'p' && gr.bounces === 0 && !hitEnemy) { gr.bounces = 1; gr.vy = -1.6; gr.vx *= 0.6; }
      else { gr.done = true; explode(g, gr.x, gr.y, gr.from === 'p' ? 32 : 18, gr.from, gr.from === 'p' ? 'fx.boom.grenade' : 'fx.boom.small'); }
    }
  }
  g.grenades = g.grenades.filter((gr) => !gr.done);

  for (const e of g.enemies) stepRebel(g, e);
  g.enemies = g.enemies.filter((e) => !(e.state === 'dead' && e.t > 80) && e.x > g.camX - 120);

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
    if (g.lock.final) { g.phase = 'complete'; g.phaseT = 0; g.banner = { text: 'MISSION COMPLETE', t: 600 }; g.score += g.pows * 1000; ev(g, 'missionComplete'); }
    else { g.banner = { text: 'GO', t: 90 }; ev(g, 'go'); }
    g.lock = null;
  }
}

function explode(g, x, y, radius, from, anim) {
  g.effects.push({ anim, x, y, t: 0 });
  ev(g, 'explode', { big: radius > 24 });
  if (from === 'p') {
    for (const e of g.enemies) if (alive(e) && Math.abs(e.x - x) < radius && Math.abs(e.y - 18 - y) < radius + 18) killEnemy(g, e);
  } else {
    const p = g.player;
    if (!p.dead && p.invuln <= 0 && Math.abs(p.x - x) < radius && Math.abs(p.y - 16 - y) < radius + 16) killPlayer(g);
  }
}

function killEnemy(g, e, anim = 'rebel.death') {
  if (!alive(e)) return;
  e.state = 'dead'; e.t = 0; e.deathAnim = anim;
  g.score += 100;
  ev(g, 'enemyDie');
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

// ---------------------------------------------------------------- camera
function stepCamera(g) {
  const p = g.player;
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
export const _internal = { killPlayer, killEnemy, explode, collect, freePrisoner };
