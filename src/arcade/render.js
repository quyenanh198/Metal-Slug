// Draws the game state onto the 304x224 arcade canvas.
import { drawAnim, drawBigCentered, drawContinueDigit, drawFrame, drawText, frameAt, textWidth } from './assets.js';
import { ARENA, GROUND_BASE, PIECES, SCREEN_H, SCREEN_W, groundAt, pieceTop } from './level.js';
import { FPS, WEAPONS } from './game.js';

const sec = (frames) => frames / FPS;
// Marco's upper body sits on the legs: offset of the upper sprite's bottom-centre from the feet anchor.
export const UPPER_OFFSET = { x: 3, y: -12 };

export function render(ctx, assets, g, debug = false) {
  const camX = Math.round(g.camX), camY = Math.round(g.camY);
  ctx.imageSmoothingEnabled = false;

  if (g.arena) drawArena(ctx, assets, g, camX, camY);
  else drawMission(ctx, assets, g, camX, camY);
  if (debug) {
    ctx.strokeStyle = '#ff0';
    ctx.beginPath();
    for (let x = 0; x <= SCREEN_W; x += 2) ctx.lineTo(x, groundAt(camX + x) - camY);
    ctx.stroke();
  }
  drawActors(ctx, assets, g, camX, camY);
  drawHud(ctx, assets, g);
  if (g.transition !== null && g.transition !== undefined) {
    ctx.fillStyle = `rgba(0,0,0,${Math.min(1, 1 - Math.abs(g.transition - 45) / 40)})`;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  }
}

function drawMission(ctx, assets, g, camX, camY) {
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
  sky.addColorStop(0, '#2f6d9c');
  sky.addColorStop(0.6, '#8cc4dd');
  sky.addColorStop(1, '#bfe0e8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // far panorama (parallax) with its animated sea band
  const far = assets.layers['m1.far'];
  const farX = -Math.round(camX * 0.3), farY = -88 - Math.round(camY * 0.35);
  ctx.drawImage(far, farX, farY);
  drawFrame(ctx, assets, 'm1.sea', frameAt(assets.anims['m1.sea'], sec(g.frame)), farX, farY + 225);

  // deep water under the ground pieces shows through their transparent gaps
  ctx.fillStyle = '#1f4f4f';
  ctx.fillRect(0, GROUND_BASE - 19 - camY, SCREEN_W, SCREEN_H);
  // ground pieces
  for (const piece of PIECES) {
    const sx = piece.x - camX;
    if (sx > SCREEN_W || sx + piece.w < 0) continue;
    ctx.drawImage(assets.layers[piece.layer], sx, pieceTop(piece) - camY);
  }
}

// Boss stage: sunset sea scrolling past (the ferry is under way), Huge Hermit wading behind, the ferry in front.
function drawArena(ctx, assets, g, camX, camY) {
  const sea = assets.layers['m1.sunset'];
  const top = SCREEN_H - sea.height;
  const off = Math.floor(g.frame * 0.6) % sea.width;
  for (let x = -off; x < SCREEN_W; x += sea.width) {
    ctx.drawImage(sea, 0, 0, sea.width, 1, x, 0, sea.width, top); // stretch the horizon row up as sky
    ctx.drawImage(sea, x, top);
  }
  const b = g.boss;
  if (b) {
    const name = { enter: 'hermit.move', walk: b.phase2 ? 'hermit.cmove' : 'hermit.move', shoot: 'hermit.shoot', deploy: 'hermit.deploy', cshoot: 'hermit.cshoot', defeat: 'hermit.defeat' }[b.state];
    const t = b.state === 'walk' || b.state === 'enter' || b.state === 'defeat' ? g.frame : b.t;
    if (b.flash > 0) ctx.filter = 'brightness(1.9)';
    drawAnim(ctx, assets, name, sec(t), Math.round(b.x - camX), Math.round(b.y - camY));
    ctx.filter = 'none';
    drawAnim(ctx, assets, 'hermit.waves', sec(g.frame), Math.round(b.x - camX + 10), SCREEN_H + 4);
  }
  // the ferry gets wrecked during the fight; once the boss falls only the SV-001 crate is left on deck
  const ferry = !b || b.state === 'defeat' ? (b ? 'ferry.wreck' : 'ferry') : b.phase2 ? 'ferry.damaged' : 'ferry';
  const f0 = assets.anims[ferry].frames[0];
  drawAnim(ctx, assets, ferry, sec(g.frame), ARENA.ferryX + Math.round(f0.w / 2), ARENA.ferryTop + f0.h - camY);
}

function drawActors(ctx, assets, g, camX, camY) {
  const at = (x, y) => [x - camX, y - camY];

  // items
  for (const it of g.items) {
    const name = { H: 'item.H', R: 'item.R', S: 'item.S', bombs: 'item.bombs', fish: 'item.fish', chicken: 'item.chicken' }[it.kind] ?? 'item.H';
    drawAnim(ctx, assets, name, sec(it.t), ...at(it.x, it.y));
  }

  // prisoners (sheet faces left)
  for (const pw of g.prisoners) {
    const name = { tied: 'pow.tied', walk: 'pow.walk', give: 'pow.give', salute: 'pow.salute', run: 'pow.run' }[pw.state];
    drawAnim(ctx, assets, name, sec(pw.t), ...at(pw.x, pw.y), pw.facing > 0);
  }

  // rebels (sheet faces left)
  for (const e of g.enemies) {
    if (e.state === 'dead' && e.kind !== 'crab' && e.t > 50 && Math.floor(e.t / 3) % 2) continue;
    if (e.kind === 'crab') {
      const name = { idle: 'crab.idle', walk: 'crab.walk', attack: 'crab.attack', dead: 'crab.death' }[e.state];
      if (e.flash > 0) ctx.filter = 'brightness(1.9)';
      drawAnim(ctx, assets, name, sec(e.t), ...at(e.x, e.y), e.facing > 0);
      ctx.filter = 'none';
      continue;
    }
    const name = { idle: 'rebel.idle', chat: 'rebel.chat', scared: 'rebel.scared', run: 'rebel.run', knife: 'rebel.knife', aim: 'rebel.idle', throw: 'rebel.grenade', dead: e.deathAnim }[e.state];
    drawAnim(ctx, assets, name, sec(e.t), ...at(e.x, e.y), e.facing > 0);
  }

  drawPlayer(ctx, assets, g, at);

  // projectiles
  for (const b of g.bullets) {
    const [x, y] = at(b.x, b.y);
    const name = b.kind === 'rocket' ? 'fx.rocket' : b.kind === 'hmg' ? 'fx.hmg' : 'fx.bullet';
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(Math.atan2(b.vy, b.vx));
    drawAnim(ctx, assets, name, sec(g.frame), 0, 0);
    ctx.restore();
  }
  for (const gr of g.grenades) {
    const [x, y] = at(gr.x, gr.y);
    if (gr.kind === 'fireball') drawAnim(ctx, assets, 'hermit.fireball', sec(gr.t), x, y);
    else if (gr.kind === 'shell') {
      // ten frames turn the shell from flying level to nose-down as it falls
      const fr = assets.anims['hermit.shell'].frames;
      const k = Math.max(0, Math.min(fr.length - 1, Math.round((Math.atan2(gr.vy, Math.abs(gr.vx)) / (Math.PI / 2)) * (fr.length - 1))));
      drawFrame(ctx, assets, 'hermit.shell', k, x, y);
    } else if (gr.from === 'e') drawAnim(ctx, assets, 'rebel.stickgrenade', sec(gr.t), x, y, gr.vx > 0);
    else drawPineapple(ctx, Math.round(x), Math.round(y), gr.t);
  }

  // effects (explosions are anchored at their base)
  for (const fx of g.effects) drawAnim(ctx, assets, fx.anim, sec(fx.t), ...at(fx.x, fx.y));
}

function drawPlayer(ctx, assets, g, at) {
  const p = g.player;
  if (g.phase === 'title') return;
  if (!p.dead && p.invuln > 0 && Math.floor(p.invuln / 3) % 2) return;
  const [x, y] = at(p.x, p.y);
  const flip = p.facing < 0;
  if (g.phase === 'complete') return drawAnim(ctx, assets, 'marco.victory', sec(g.phaseT), x, y, flip);
  if (p.dead) return drawAnim(ctx, assets, 'marco.death', sec(p.deadT), x, y, flip);

  if (p.crouch) {
    const name = p.action === 'shoot' ? 'marco.crouchshoot' : p.moving ? 'marco.crouchwalk' : 'marco.crouch';
    return drawAnim(ctx, assets, name, sec(p.action === 'shoot' ? p.actionT : p.walkT || g.frame), x, y, flip);
  }
  let legs, legsT, upper, upperT;
  if (!p.grounded) { legs = 'marco.jump.legs'; legsT = p.airT; upper = 'marco.jump.upper'; upperT = p.airT; }
  else if (p.moving) { legs = 'marco.run.legs'; legsT = p.walkT; upper = 'marco.run.upper'; upperT = p.walkT; }
  else { legs = 'marco.stand.legs'; legsT = 0; upper = 'marco.idle.upper'; upperT = g.frame; }
  if (p.action === 'shoot') { upper = p.aimUp ? 'marco.shootup.upper' : 'marco.shoot.upper'; upperT = p.actionT; }
  else if (p.action === 'knife') { upper = 'marco.knife.upper'; upperT = p.actionT; }
  else if (p.action === 'throw') { upper = 'marco.grenade.upper'; upperT = p.actionT; }
  else if (p.aimUp) { upper = 'marco.shootup.upper'; upperT = 999; }

  drawAnim(ctx, assets, legs, sec(legsT), x, y, flip);
  drawAnim(ctx, assets, upper, sec(upperT), x + UPPER_OFFSET.x * (flip ? -1 : 1), y + UPPER_OFFSET.y, flip);
}

function drawPineapple(ctx, x, y, t) {
  ctx.fillStyle = '#1c2a18';
  ctx.fillRect(x - 3, y - 4, 6, 7);
  ctx.fillStyle = '#4d6b34';
  ctx.fillRect(x - 2, y - 3, 4, 5);
  ctx.fillStyle = '#9fb06a';
  ctx.fillRect(x - 2, y - 3, 1, 2);
  ctx.fillStyle = '#b8b8b8';
  ctx.fillRect(x - 1 + (Math.floor(t / 4) % 2), y - 6, 2, 2);
}

function infinity(ctx, x, y) {
  // 9x5 pixel infinity sign in the points-font red
  const rows = ['.##...##.', '#..#.#..#', '#...#...#', '#..#.#..#', '.##...##.'];
  ctx.fillStyle = '#ff3b2f';
  rows.forEach((r, j) => [...r].forEach((c, i) => c === '#' && ctx.fillRect(x + i, y + j + 1, 1, 1)));
}

function drawHud(ctx, assets, g) {
  const p = g.player;
  if (g.phase !== 'title') {
    drawText(ctx, assets, String(g.score).padStart(7, '0'), 8, 6);
    // ARMS / BOMB box
    ctx.fillStyle = 'rgba(12,20,40,0.75)';
    ctx.fillRect(84, 4, 72, 22);
    ctx.strokeStyle = '#d8d8d8';
    ctx.strokeRect(84.5, 4.5, 71, 21);
    drawText(ctx, assets, 'ARMS', 88, 6);
    drawText(ctx, assets, 'BOMB', 124, 6);
    if (Number.isFinite(p.ammo)) drawText(ctx, assets, String(p.ammo), 90, 16);
    else infinity(ctx, 92, 16);
    drawText(ctx, assets, String(p.bombs), 128, 16);
    drawText(ctx, assets, `1UP ${g.lives}`, 8, 16);
    const tt = String(Math.max(0, g.time)).padStart(2, '0');
    drawText(ctx, assets, tt, SCREEN_W / 2 - textWidth(assets, tt, 2) / 2 + 40, 6, 2);
    if (WEAPONS[p.weapon] && p.weapon !== 'P') drawText(ctx, assets, p.weapon, 158, 16);
  }

  if (g.banner) drawBanner(ctx, assets, g.banner);

  if (g.phase === 'title') drawTitle(ctx, assets, g);
  else if (g.phase === 'continue') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    drawBigCentered(ctx, assets, 'CONTINUE?', 52);
    drawContinueDigit(ctx, assets, Math.max(0, Math.ceil(g.continueT / FPS) - 1), SCREEN_W / 2, 98);
  } else if (g.phase === 'gameover') {
    drawBigCentered(ctx, assets, 'GAME OVER', 90, Math.floor(g.phaseT / 4));
  } else if (g.phase === 'complete' && g.phaseT > 90) {
    const line = `POW RESCUED ${g.pows}`;
    drawText(ctx, assets, line, SCREEN_W / 2 - textWidth(assets, line) / 2, 144);
  }
}

// Arcade signs: "MISSION 1 / START!" and "MISSION 1 / COMPLETE!" type in letter by letter in the big font,
// "GO!" is the animated sign at the right edge; weapon names use the points font.
function drawBanner(ctx, assets, b) {
  const age = (b.t0 ?? b.t) - b.t;
  const two = { 'MISSION 1 START': ['MISSION 1', 'START!'], 'MISSION COMPLETE': ['MISSION 1', 'COMPLETE!'] }[b.text];
  if (two) {
    if (b.t < 24 && Math.floor(b.t / 4) % 2) return; // blinks out
    const n = Math.floor(age / 3);
    drawBigCentered(ctx, assets, two[0], 62, n);
    drawBigCentered(ctx, assets, two[1], 98, n - two[0].replace(/ /g, '').length);
  } else if (b.text === 'GO') {
    drawAnim(ctx, assets, 'sign.go', sec(age), SCREEN_W - 44, 64);
  } else {
    drawText(ctx, assets, b.text, SCREEN_W / 2 - textWidth(assets, b.text, 2) / 2, 84, 2);
  }
}

// Title screen built from the original pieces: blue glow, the chrome 3 in its claws, the METAL SLUG logo.
function drawTitle(ctx, assets, g) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  ctx.globalCompositeOperation = 'lighter';
  drawFrame(ctx, assets, 'title.glow', 0, 16, 40);
  ctx.globalCompositeOperation = 'source-over';
  drawFrame(ctx, assets, 'title.claw.l', 0, TITLE.clawL[0], TITLE.clawL[1]);
  drawFrame(ctx, assets, 'title.claw.r', 0, TITLE.clawR[0], TITLE.clawR[1]);
  drawFrame(ctx, assets, 'title.three', 0, TITLE.three[0], TITLE.three[1]);
  drawFrame(ctx, assets, 'title.logo', 0, TITLE.logo[0], TITLE.logo[1]);
  drawFrame(ctx, assets, 'title.streak', 0, TITLE.streak[0], TITLE.streak[1]);
  drawText(ctx, assets, 'MISSION 1', SCREEN_W / 2 - textWidth(assets, 'MISSION 1') / 2, 182);
  if (Math.floor(g.frame / 30) % 2) drawText(ctx, assets, 'PRESS START', SCREEN_W / 2 - textWidth(assets, 'PRESS START') / 2, 198);
}
const TITLE = { logo: [2, 40], three: [196, 34], clawL: [158, 22], clawR: [222, 22], streak: [14, 140] };

