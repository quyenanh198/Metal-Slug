// Draws the game state onto the 304x224 arcade canvas.
import { drawAnim, drawFrame, drawText, frameAt, textWidth } from './assets.js';
import { GROUND_BASE, PIECES, SCREEN_H, SCREEN_W, groundAt, pieceTop } from './level.js';
import { FPS, WEAPONS } from './game.js';

const sec = (frames) => frames / FPS;
// Marco's upper body sits on the legs: offset of the upper sprite's bottom-centre from the feet anchor.
export const UPPER_OFFSET = { x: 3, y: -12 };

export function render(ctx, assets, g, debug = false) {
  const camX = Math.round(g.camX), camY = Math.round(g.camY);
  ctx.imageSmoothingEnabled = false;

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
  if (debug) {
    ctx.strokeStyle = '#ff0';
    ctx.beginPath();
    for (let x = 0; x <= SCREEN_W; x += 2) ctx.lineTo(x, groundAt(camX + x) - camY);
    ctx.stroke();
  }

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
    if (e.state === 'dead' && e.t > 50 && Math.floor(e.t / 3) % 2) continue;
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
    if (gr.from === 'e') drawAnim(ctx, assets, 'rebel.stickgrenade', sec(gr.t), x, y, gr.vx > 0);
    else drawPineapple(ctx, Math.round(x), Math.round(y), gr.t);
  }

  // effects (explosions are anchored at their base)
  for (const fx of g.effects) drawAnim(ctx, assets, fx.anim, sec(fx.t), ...at(fx.x, fx.y));

  drawHud(ctx, assets, g);
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

  if (g.banner) {
    const s = g.banner.text === 'GO' ? 3 : 2;
    if (g.banner.text !== 'GO' || Math.floor(g.banner.t / 8) % 2) {
      drawText(ctx, assets, g.banner.text, SCREEN_W / 2 - textWidth(assets, g.banner.text, s) / 2, g.banner.text === 'GO' ? 70 : 84, s);
    }
  }

  if (g.phase === 'title') {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 60, SCREEN_W, 96);
    drawText(ctx, assets, 'METAL SLUG 3', SCREEN_W / 2 - textWidth(assets, 'METAL SLUG 3', 3) / 2, 72, 3);
    drawText(ctx, assets, 'MISSION 1', SCREEN_W / 2 - textWidth(assets, 'MISSION 1', 2) / 2, 106, 2);
    if (Math.floor(g.frame / 30) % 2) drawText(ctx, assets, 'PRESS START', SCREEN_W / 2 - textWidth(assets, 'PRESS START') / 2, 136);
  } else if (g.phase === 'continue') {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    drawText(ctx, assets, 'CONTINUE', SCREEN_W / 2 - textWidth(assets, 'CONTINUE', 2) / 2, 70, 2);
    const n = String(Math.max(0, Math.ceil(g.continueT / FPS) - 1));
    drawText(ctx, assets, n, SCREEN_W / 2 - textWidth(assets, n, 5) / 2, 100, 5);
  } else if (g.phase === 'gameover') {
    drawText(ctx, assets, 'GAME OVER', SCREEN_W / 2 - textWidth(assets, 'GAME OVER', 3) / 2, 90, 3);
  } else if (g.phase === 'complete' && g.phaseT > 90) {
    const line = `POW RESCUED ${g.pows}`;
    drawText(ctx, assets, line, SCREEN_W / 2 - textWidth(assets, line) / 2, 112);
  }
}
