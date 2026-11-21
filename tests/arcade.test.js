import test from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_HP, createGame, spawnRebel, startGame, step, _internal } from '../src/arcade/game.js';
import { ARENA, groundAt, LEVEL_END, PIECES, SCRIPT } from '../src/arcade/level.js';

const run = (g, input, frames) => { const seen = []; for (let i = 0; i < frames; i++) { step(g, typeof input === 'function' ? input(i) : input); seen.push(...g.events.map((e) => e.name)); } return seen; };
const playing = () => { const g = createGame(3); startGame(g); g.scriptIndex = SCRIPT.length; run(g, {}, 130); return g; };

test('the ground is continuous across the three Mission 1 pieces (no wall the player cannot walk over)', () => {
  for (let x = 1; x < LEVEL_END; x++) assert.ok(Math.abs(groundAt(x) - groundAt(x - 1)) <= 3, `step at x=${x}`);
  assert.equal(PIECES.at(-1).x + PIECES.at(-1).w, LEVEL_END);
});

test('title screen waits for START, then the mission begins with the banner', () => {
  const g = createGame(1);
  run(g, {}, 30);
  assert.equal(g.phase, 'title');
  const seen = run(g, (i) => ({ start: i === 0 }), 2);
  assert.equal(g.phase, 'playing');
  assert.ok(seen.includes('missionStart'));
  assert.equal(g.banner.text, 'MISSION 1 START');
});

test('one hit kills Marco (no health bar); he respawns with a life less and 60 on the clock', () => {
  const g = playing();
  g.time = 31;
  _internal.killPlayer(g);
  run(g, {}, 100);
  assert.equal(g.lives, 1);
  assert.equal(g.player.dead, false);
  assert.equal(g.time, 60);
  assert.ok(g.player.invuln > 0, 'respawn is briefly invulnerable');
});

test('the handgun shoots once per press; the heavy machine gun fires while held and runs dry back to the handgun', () => {
  const g = playing();
  run(g, { shoot: true }, 30);
  assert.equal(g.bullets.length, 1);
  g.player.weapon = 'H'; g.player.ammo = 5;
  run(g, { shoot: true }, 40);
  assert.equal(g.player.weapon, 'P');
  assert.equal(g.player.ammo, Infinity);
});

test('a handgun bullet is not piercing: it kills only the first rebel in its path', () => {
  const g = playing();
  // spawned far-to-near so array order differs from distance order
  const row = [72, 66, 60].map((dx) => spawnRebel(g, g.player.x + dx, 'idle'));
  row.forEach((e) => { e.state = 'throw'; e.t = -500; });
  run(g, (i) => ({ shoot: i === 0 }), 30);
  assert.deepEqual(row.map((e) => e.state === 'dead'), [false, false, true]);
  assert.equal(g.player.ammo, Infinity, 'the handgun never runs out');
});

test('shooting a rebel next to you uses the knife, as in the arcade', () => {
  const g = playing();
  const e = spawnRebel(g, g.player.x + 14, 'idle');
  const seen = run(g, (i) => ({ shoot: i === 0 }), 2);
  assert.ok(seen.includes('knife'));
  assert.equal(e.state, 'dead');
  assert.equal(e.deathAnim, 'rebel.death.cut');
  assert.equal(g.bullets.length, 0);
});

test('an unaware rebel panics when Marco shows up, then attacks with a knife at close range', () => {
  const g = playing();
  const e = spawnRebel(g, g.player.x + 120, 'chat');
  run(g, {}, 2);
  assert.equal(e.state, 'scared');
  g.rand = () => 0.9; // choose the knife rush
  run(g, {}, 45);
  assert.equal(e.state, 'run');
  g.player.invuln = 0;
  const seen = run(g, {}, 160);
  assert.ok(seen.includes('playerDie'), 'the rebel reached Marco and stabbed him');
});

test('rebel stick grenades arc toward Marco and kill him if he stands still', () => {
  const g = playing();
  g.player.invuln = 0;
  const e = spawnRebel(g, g.player.x + 120, 'grenadier');
  e.cool = 1;
  const seen = run(g, {}, 200);
  assert.ok(seen.includes('enemyThrow'));
  assert.ok(seen.includes('playerDie'));
});

test('freed P.O.W.s walk to Marco, hand over their item, salute and run off', () => {
  const g = playing();
  g.prisoners.push({ id: 99, x: g.player.x + 40, y: groundAt(g.player.x + 40), state: 'tied', t: 0, drop: 'H', facing: -1 });
  run(g, (i) => ({ shoot: i === 0 }), 3);
  const pw = g.prisoners[0];
  assert.equal(pw.state, 'walk');
  const seen = run(g, {}, 120);
  assert.ok(seen.includes('thankYou'));
  assert.equal(g.pows, 1);
  run(g, { right: true }, 40);
  assert.equal(g.player.weapon, 'H', 'walking over the dropped crate gives the Heavy Machine Gun');
  assert.equal(g.player.ammo, 200);
});

test('grenades bounce once and blow up nearby rebels', () => {
  const g = playing();
  const e = spawnRebel(g, g.player.x + 120, 'idle');
  e.state = 'throw'; e.t = -500; // keep him standing where the grenade lands (about 120 px out)
  const seen = run(g, (i) => ({ bomb: i === 0 }), 120);
  assert.equal(g.player.bombs, 9);
  assert.ok(seen.includes('explode'));
  assert.equal(e.state, 'dead');
});

test('the TIME counter kills Marco when it runs out', () => {
  const g = playing();
  g.time = 1; g.timeT = 0;
  const seen = run(g, {}, 130);
  assert.ok(seen.includes('playerDie'));
});

test('losing the last life offers a CONTINUE countdown, then GAME OVER', () => {
  const g = playing();
  g.lives = 0;
  _internal.killPlayer(g);
  run(g, {}, 100);
  assert.equal(g.phase, 'continue');
  run(g, {}, 10 * 60 + 2);
  assert.equal(g.phase, 'gameover');
});

const onFerry = () => { const g = playing(); _internal.enterArena(g); return g; };
const bossReady = (g) => { while (g.boss.state === 'enter') step(g, {}); };

test('clearing the last jungle wave fades to the ferry, where Huge Hermit wades in from the left', () => {
  const g = playing();
  g.lock = { x: g.camX, final: true, engaged: true };
  const seen = run(g, {}, 100);
  assert.ok(seen.includes('bossAppear'));
  assert.equal(g.arena, true);
  assert.equal(g.camX, ARENA.x);
  assert.equal(g.player.y, groundAt(g.player.x), 'Marco stands on the ferry deck');
  assert.ok(g.boss.x < g.player.x, 'the boss is behind (left of) the ferry');
  run(g, { right: true }, 300);
  assert.ok(g.player.x <= ARENA.x + ARENA.maxX, 'Marco cannot walk off the ferry');
});

test('Huge Hermit lobs fireballs onto the deck that kill Marco if he stands still', () => {
  const g = onFerry();
  bossReady(g);
  const seen = run(g, {}, 400);
  assert.ok(seen.includes('bossShoot'));
  assert.ok(seen.includes('playerDie'));
});

test('at half health Huge Hermit deploys its cannon and fires heavy shells', () => {
  const g = onFerry();
  bossReady(g);
  g.player.invuln = 1e9;
  _internal.hitBoss(g, BOSS_HP / 2);
  const seen = run(g, {}, 600);
  assert.ok(seen.includes('bossDeploy'));
  assert.ok(g.boss.phase2);
  assert.ok(seen.includes('bossCannon'));
});

test('handgun shots aimed left damage the boss; each bullet counts once', () => {
  const g = onFerry();
  bossReady(g);
  g.player.invuln = 1e9;
  run(g, (i) => ({ left: true, shoot: i % 2 === 0 }), 120);
  assert.ok(g.boss.hp < BOSS_HP && g.boss.hp >= BOSS_HP - 60, `boss hp ${g.boss.hp}`);
});

test('a bot that cannot die clears every screen lock and completes Mission 1', () => {
  const g = createGame(11);
  startGame(g);
  // the bot turns to the nearest live rebel on screen, otherwise walks right; stops once the mission is over
  const seen = [];
  for (let i = 0; i < 60 * 60 * 6 && g.phase !== 'complete'; i++) {
    g.player.invuln = 99; g.time = 60;
    const p = g.player;
    const foe = g.enemies.filter((e) => e.state !== 'dead' && e.x > g.camX && e.x < g.camX + 304).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const left = g.boss ? true : foe ? foe.x < p.x - 4 : false;
    step(g, { left, right: !left, shoot: i % 6 === 0, jump: i % 90 === 0, bomb: i % 400 === 0 });
    seen.push(...g.events.map((e) => e.name));
  }
  assert.equal(g.phase, 'complete');
  assert.ok(seen.includes('go'), 'a GO! sign appeared after a cleared lock');
  assert.ok(seen.includes('bossDie'), 'Huge Hermit was destroyed');
  assert.ok(seen.includes('missionComplete'));
  assert.ok(g.pows >= 5, `rescued ${g.pows} P.O.W.s`);
});
