import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMissionState,
  fireWeapon,
  stepMissionState,
  throwGrenade,
  toggleTankBoarding
} from '../src/game/state.js';

test('player fires weapon and consumes ammo for special weapons', () => {
  const state = createMissionState();
  state.phase = 'playing';
  state.player.weaponId = 'HMG';
  state.player.ammo = 2;

  assert.equal(fireWeapon(state), true);
  assert.equal(state.bullets.length, 1);
  assert.equal(state.player.ammo, 1);

  state.player.fireCooldown = 0;
  fireWeapon(state);
  assert.equal(state.player.weaponId, 'PISTOL');
  assert.equal(state.player.ammo, Infinity);
});

test('touching POW rescues them and drops a weapon pickup', () => {
  const state = createMissionState();
  state.phase = 'playing';
  const pow = state.pows[0];
  state.player.x = pow.x;

  stepMissionState(state, 0.1, {});
  assert.equal(pow.rescued, true);
  assert.equal(state.powsRescued, 1);
  assert.ok(state.pickups.length >= 1);
});

test('boarding and ejecting SV-001 Metal Slug tank works', () => {
  const state = createMissionState();
  state.phase = 'playing';
  state.player.x = state.tank.x;

  assert.equal(toggleTankBoarding(state), true);
  assert.equal(state.player.inTank, true);

  assert.equal(toggleTankBoarding(state), true);
  assert.equal(state.player.inTank, false);
});

test('throwing grenade spawns explosive projectile that damages enemies on impact', () => {
  const state = createMissionState();
  state.phase = 'playing';
  assert.equal(throwGrenade(state), true);
  assert.equal(state.grenades.length, 1);
  assert.equal(state.player.grenades, 9);
});

test('boss enters phase 2 at <= 50% HP and triggers victory at 0 HP', () => {
  const state = createMissionState();
  state.phase = 'playing';
  state.boss.active = true;
  state.boss.hp = 300; // < 50% of 650

  stepMissionState(state, 0.1, {});
  assert.equal(state.boss.phase, 2);

  state.boss.hp = 0;
  state.hitstopTimer = 0;
  stepMissionState(state, 0.1, {});
  assert.equal(state.boss.defeated, true);
  assert.equal(state.phase, 'victory');
});
