// Metal Slug 3 (arcade style) - browser entry: 304x224 canvas, integer-scaled, fixed 60 Hz logic.
import { loadAssets } from './arcade/assets.js';
import { arcadeAudio } from './arcade/audio.js';
import { createGame, FPS, step } from './arcade/game.js';
import { createInput } from './arcade/input.js';
import { SCREEN_H, SCREEN_W } from './arcade/level.js';
import { render } from './arcade/render.js';

const canvas = document.getElementById('screen');
canvas.width = SCREEN_W;
canvas.height = SCREEN_H;
const ctx = canvas.getContext('2d');
const readInput = createInput(window);

function fit() {
  const k = Math.max(1, Math.floor(Math.min(innerWidth / SCREEN_W, innerHeight / SCREEN_H)));
  canvas.style.width = `${SCREEN_W * k}px`;
  canvas.style.height = `${SCREEN_H * k}px`;
}
addEventListener('resize', fit);
fit();

const muteBtn = document.getElementById('mute');
muteBtn.addEventListener('click', () => {
  muteBtn.textContent = arcadeAudio.toggleMute() ? 'SOUND OFF' : 'SOUND ON';
  muteBtn.blur();
});

const debug = location.hash.includes('debug');
const showGround = location.hash.includes('ground');

loadAssets().then((assets) => {
  document.getElementById('loading').remove();
  const game = createGame((Date.now() & 0xffff) | 1);
  if (debug) window.__ms3 = { game, assets, step };
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc = Math.min(acc + (now - last) / 1000, 0.25);
    last = now;
    while (acc >= 1 / FPS) {
      step(game, readInput());
      for (const e of game.events) arcadeAudio.playEvent(e.name);
      acc -= 1 / FPS;
    }
    render(ctx, assets, game, showGround);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}).catch((err) => {
  document.getElementById('loading').textContent = 'Failed to load art: ' + err.message;
});
