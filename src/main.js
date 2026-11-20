import * as THREE from 'three';
import { WEAPONS } from './game/constants.js';
import { createMissionState, stepMissionState, toggleTankBoarding } from './game/state.js';
import { createBattlefieldScene } from './game/scene3d.js';
import { arcadeAudio } from './game/audio.js';

const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 140);
camera.position.set(6, 5.2, 14.5);

const battlefield = createBattlefieldScene(scene);
let state = createMissionState();

// DOM
const hudEl = document.getElementById('hud');
const menuModal = document.getElementById('menu-modal');
const endModal = document.getElementById('end-modal');
const weaponEl = document.getElementById('hud-weapon');
const bombEl = document.getElementById('hud-bomb');
const hpEl = document.getElementById('hud-hp');
const scoreEl = document.getElementById('hud-score');
const tankBoxEl = document.getElementById('hud-tank-box');
const tankEl = document.getElementById('hud-tank');
const bannerEl = document.getElementById('hud-banner');
const bossBarWrap = document.getElementById('boss-bar-wrap');
const bossHpFill = document.getElementById('boss-hp-fill');
const btnMute = document.getElementById('btn-mute');

const keys = {};
let mouseDown = false;
let prevPadBoard = false;

function startMission() {
  state = createMissionState();
  state.phase = 'playing';
  menuModal.classList.add('hidden');
  endModal.classList.add('hidden');
  hudEl.classList.remove('hidden');
}

function showEndModal() {
  document.getElementById('end-tag').textContent = state.phase === 'victory' ? 'MISSION COMPLETE' : 'GAME OVER';
  document.getElementById('end-title').textContent = state.phase === 'victory' ? '🏆 MISSION 1 COMPLETE!' : '💀 MISSION FAILED';
  document.getElementById('end-score').textContent = state.score.toLocaleString();
  document.getElementById('end-pow').textContent = state.powsRescued;
  document.getElementById('end-kills').textContent = state.kills;
  endModal.classList.remove('hidden');
}

document.getElementById('btn-start').addEventListener('click', startMission);
document.getElementById('btn-retry').addEventListener('click', startMission);
btnMute.addEventListener('click', () => {
  btnMute.textContent = arcadeAudio.toggleMute() ? '🔇' : '🔊';
});

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === 'enter' && (state.phase === 'menu' || state.phase === 'victory' || state.phase === 'gameover')) {
    startMission();
  }
  if (k === 'e' && state.phase === 'playing') {
    toggleTankBoarding(state);
  }
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});
window.addEventListener('mousedown', (e) => {
  if (e.button === 0 && state.phase === 'playing') mouseDown = true;
});
window.addEventListener('mouseup', () => {
  mouseDown = false;
});
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function readGamepad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = pads && pads[0];
  if (!pad) return {};
  const boardPressed = Boolean(pad.buttons[3]?.pressed); // Triangle / Y
  if (boardPressed && !prevPadBoard && state.phase === 'playing') {
    toggleTankBoarding(state);
  }
  prevPadBoard = boardPressed;
  return {
    left: pad.axes[0] < -0.35 || pad.buttons[14]?.pressed,
    right: pad.axes[0] > 0.35 || pad.buttons[15]?.pressed,
    up: pad.axes[1] < -0.35 || pad.buttons[12]?.pressed,
    down: pad.axes[1] > 0.35 || pad.buttons[13]?.pressed,
    jump: pad.buttons[0]?.pressed, // Cross / A
    shoot: pad.buttons[2]?.pressed || pad.buttons[7]?.pressed, // Square / R2
    grenade: pad.buttons[1]?.pressed || pad.buttons[5]?.pressed // Circle / R1
  };
}

let lastTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (state.phase === 'playing') {
    const pad = readGamepad();
    stepMissionState(state, dt, {
      left: keys['a'] || keys['arrowleft'] || pad.left,
      right: keys['d'] || keys['arrowright'] || pad.right,
      up: keys['w'] || keys['arrowup'] || pad.up,
      down: keys['s'] || keys['arrowdown'] || pad.down,
      jump: keys[' '] || keys['k'] || pad.jump,
      shoot: keys['j'] || mouseDown || pad.shoot,
      grenade: keys['g'] || keys['l'] || pad.grenade
    });

    for (const ev of state.events) arcadeAudio.playEvent(ev);

    if (state.phase === 'victory' || state.phase === 'gameover') {
      showEndModal();
    }

    // Update HUD
    const w = WEAPONS[state.player.weaponId] || WEAPONS.PISTOL;
    weaponEl.textContent = state.player.inTank
      ? 'VULCAN • ∞'
      : `${w.code} • ${Number.isFinite(state.player.ammo) ? state.player.ammo : '∞'}`;
    bombEl.textContent = state.player.inTank ? 'CANNON' : state.player.grenades;
    hpEl.textContent = `${Math.max(0, state.player.hp)} • ${'❤️'.repeat(Math.max(0, state.player.lives))}`;
    scoreEl.textContent = state.score.toLocaleString();

    tankBoxEl.classList.toggle('hidden', !state.player.inTank);
    if (state.player.inTank) tankEl.textContent = Math.max(0, state.tank.hp);

    bannerEl.classList.toggle('hidden', state.bannerTimer <= 0);
    bannerEl.textContent = state.bannerText;

    bossBarWrap.classList.toggle('hidden', !state.boss.active || state.boss.defeated);
    if (state.boss.active) {
      bossHpFill.style.width = `${Math.max(0, (state.boss.hp / state.boss.maxHp) * 100)}%`;
    }
  }

  // Smooth side-scrolling camera with Screen Shake
  const targetX = Math.max(6, state.player.x + 4.5);
  camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 6);
  const shakeX = (Math.random() - 0.5) * state.shakeIntensity * 0.7;
  const shakeY = (Math.random() - 0.5) * state.shakeIntensity * 0.7;
  camera.position.y = 5.2 + shakeY;
  camera.lookAt(camera.position.x + shakeX, 2.4, 0);

  battlefield.sync(state, now / 1000);
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
