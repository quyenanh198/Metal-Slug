import { BOSS_ARENA_X, GRAVITY, GROUND_Y, STAGE_LENGTH, WEAPONS } from './constants.js';

let nextId = 1;
const uid = () => nextId++;

export function createMissionState() {
  const crates = [
    { id: uid(), x: 14, y: 0, hp: 30, maxHp: 30, drop: 'HMG' },
    { id: uid(), x: 34, y: 0, hp: 30, maxHp: 30, drop: 'SHOTGUN' },
    { id: uid(), x: 56, y: 0, hp: 30, maxHp: 30, drop: 'ROCKET' },
    { id: uid(), x: 78, y: 0, hp: 30, maxHp: 30, drop: 'HMG' }
  ];

  const pows = [
    { id: uid(), x: 24, y: 0, rescued: false, drop: 'HMG' },
    { id: uid(), x: 50, y: 0, rescued: false, drop: 'SHOTGUN' },
    { id: uid(), x: 82, y: 0, rescued: false, drop: 'ROCKET' }
  ];

  const enemies = [
    { id: uid(), kind: 'soldier', x: 18, y: 0, hp: 30, maxHp: 30, fireTimer: 1.2, facing: -1 },
    { id: uid(), kind: 'soldier', x: 28, y: 0, hp: 30, maxHp: 30, fireTimer: 1.5, facing: -1 },
    { id: uid(), kind: 'turret', x: 38, y: 0, hp: 70, maxHp: 70, fireTimer: 1.4, facing: -1 },
    { id: uid(), kind: 'soldier', x: 46, y: 0, hp: 30, maxHp: 30, fireTimer: 1.0, facing: -1 },
    { id: uid(), kind: 'grenadier', x: 60, y: 0, hp: 45, maxHp: 45, fireTimer: 1.6, facing: -1 },
    { id: uid(), kind: 'turret', x: 70, y: 0, hp: 80, maxHp: 80, fireTimer: 1.2, facing: -1 },
    { id: uid(), kind: 'soldier', x: 76, y: 0, hp: 30, maxHp: 30, fireTimer: 1.1, facing: -1 },
    { id: uid(), kind: 'grenadier', x: 86, y: 0, hp: 45, maxHp: 45, fireTimer: 1.3, facing: -1 }
  ];

  return {
    phase: 'menu', // 'menu' | 'playing' | 'paused' | 'victory' | 'gameover'
    elapsed: 0,
    score: 0,
    powsRescued: 0,
    kills: 0,
    hitstopTimer: 0,
    shakeIntensity: 0,
    bannerText: 'MISSION 1 START!',
    bannerTimer: 2.2,
    player: {
      x: 2,
      y: GROUND_Y,
      vy: 0,
      facing: 1,
      aimX: 1,
      aimY: 0,
      crouching: false,
      grounded: true,
      hp: 100,
      maxHp: 100,
      lives: 3,
      invulnTimer: 0,
      weaponId: 'PISTOL',
      ammo: Infinity,
      grenades: 10,
      fireCooldown: 0,
      grenadeCooldown: 0,
      inTank: false
    },
    tank: {
      x: 40,
      y: GROUND_Y,
      vy: 0,
      grounded: true,
      hp: 160,
      maxHp: 160,
      active: true,
      facing: 1
    },
    boss: {
      active: false,
      defeated: false,
      x: BOSS_ARENA_X + 12,
      y: GROUND_Y,
      hp: 650,
      maxHp: 650,
      phase: 1, // phase 2 at <= 50% HP
      fireTimer: 1.5,
      moveDir: -1
    },
    crates,
    pows,
    pickups: [],
    enemies,
    bullets: [],
    grenades: [],
    explosions: [],
    events: [] // consumed by audio/FX each frame
  };
}

export function spawnExplosion(state, x, y, radius = 2.2, damage = 0, fromPlayer = true) {
  state.explosions.push({ id: uid(), x, y, radius, age: 0, maxAge: 0.45 });
  state.shakeIntensity = Math.min(1.0, state.shakeIntensity + 0.45);
  state.hitstopTimer = Math.max(state.hitstopTimer, 0.035);
  state.events.push('explosion');

  if (damage > 0 && fromPlayer) {
    for (const e of state.enemies) {
      if (Math.hypot(e.x - x, e.y + 0.8 - y) <= radius + 0.9) {
        e.hp -= damage;
      }
    }
    if (state.boss.active && !state.boss.defeated) {
      if (Math.hypot(state.boss.x - x, state.boss.y + 2.0 - y) <= radius + 2.6) {
        state.boss.hp -= damage;
      }
    }
    for (const c of state.crates) {
      if (Math.hypot(c.x - x, c.y + 0.6 - y) <= radius + 0.8) {
        c.hp -= damage;
      }
    }
  }
}

export function toggleTankBoarding(state) {
  const { player, tank } = state;
  if (!tank.active) return false;

  if (player.inTank) {
    player.inTank = false;
    player.x = tank.x;
    player.y = tank.y + 1.4;
    player.vy = 10;
    player.grounded = false;
    state.events.push('eject');
    return true;
  }

  if (Math.abs(player.x - tank.x) <= 2.6 && Math.abs(player.y - tank.y) <= 2.0) {
    player.inTank = true;
    player.x = tank.x;
    player.y = tank.y;
    state.bannerText = 'SV-001 METAL SLUG READY!';
    state.bannerTimer = 1.8;
    state.events.push('board');
    return true;
  }
  return false;
}

export function fireWeapon(state) {
  const { player, tank } = state;
  if (player.fireCooldown > 0) return false;

  if (player.inTank && tank.active) {
    player.fireCooldown = 0.09;
    const angle = Math.atan2(player.aimY, player.aimX);
    state.bullets.push({
      id: uid(),
      fromPlayer: true,
      x: tank.x + player.aimX * 1.4,
      y: tank.y + 1.45 + player.aimY * 0.6,
      vx: Math.cos(angle) * 40,
      vy: Math.sin(angle) * 40,
      damage: 18,
      explosive: false,
      color: 0xffd166,
      ttl: 1.5
    });
    state.events.push('shoot_hmg');
    return true;
  }

  const weapon = WEAPONS[player.weaponId] || WEAPONS.PISTOL;
  player.fireCooldown = weapon.fireRate;

  const baseAngle = Math.atan2(player.aimY, player.aimX);
  for (let i = 0; i < weapon.pellets; i++) {
    const offset = (Math.random() - 0.5) * weapon.spread;
    const a = baseAngle + offset;
    state.bullets.push({
      id: uid(),
      fromPlayer: true,
      x: player.x + player.aimX * 0.75,
      y: player.y + (player.crouching ? 0.6 : 1.05) + player.aimY * 0.35,
      vx: Math.cos(a) * weapon.speed,
      vy: Math.sin(a) * weapon.speed,
      damage: weapon.damage,
      explosive: weapon.explosive,
      color: weapon.color,
      ttl: 1.4
    });
  }

  if (Number.isFinite(player.ammo)) {
    player.ammo -= 1;
    if (player.ammo <= 0) {
      player.weaponId = 'PISTOL';
      player.ammo = Infinity;
    }
  }

  state.events.push(weapon.id === 'ROCKET' ? 'shoot_rocket' : weapon.id === 'SHOTGUN' ? 'shoot_shotgun' : 'shoot_hmg');
  return true;
}

export function throwGrenade(state) {
  const { player, tank } = state;
  if (player.grenadeCooldown > 0) return false;

  if (player.inTank && tank.active) {
    player.grenadeCooldown = 0.65;
    state.grenades.push({
      id: uid(),
      fromPlayer: true,
      x: tank.x + tank.facing * 1.6,
      y: tank.y + 1.55,
      vx: tank.facing * 20,
      vy: 6.5,
      damage: 85,
      radius: 3.4,
      ttl: 2.0
    });
    state.events.push('shoot_rocket');
    return true;
  }

  if (player.grenades <= 0) return false;
  player.grenades -= 1;
  player.grenadeCooldown = 0.45;
  state.grenades.push({
    id: uid(),
    fromPlayer: true,
    x: player.x + player.facing * 0.5,
    y: player.y + 1.2,
    vx: player.facing * 14,
    vy: 12.5,
    damage: 65,
    radius: 2.8,
    ttl: 2.2
  });
  state.events.push('grenade');
  return true;
}

function damagePlayer(state, amount) {
  const { player, tank } = state;
  if (player.invulnTimer > 0) return;

  if (player.inTank && tank.active) {
    tank.hp -= amount;
    state.shakeIntensity = Math.min(1, state.shakeIntensity + 0.35);
    if (tank.hp <= 0) {
      tank.active = false;
      player.inTank = false;
      player.invulnTimer = 1.6;
      player.vy = 11;
      spawnExplosion(state, tank.x, tank.y + 1.0, 3.5, 40, true);
      state.bannerText = 'SV-001 DESTROYED!';
      state.bannerTimer = 1.8;
    }
    return;
  }

  player.hp -= amount;
  player.invulnTimer = 1.2;
  state.shakeIntensity = Math.min(1, state.shakeIntensity + 0.4);
  state.events.push('hit');

  if (player.hp <= 0) {
    player.lives -= 1;
    if (player.lives <= 0) {
      state.phase = 'gameover';
      state.bannerText = 'MISSION FAILED';
      state.bannerTimer = 4;
      state.events.push('gameover');
    } else {
      player.hp = player.maxHp;
      player.invulnTimer = 2.4;
      player.weaponId = 'PISTOL';
      player.ammo = Infinity;
      state.bannerText = `LIVES REMAINING: ${player.lives}`;
      state.bannerTimer = 1.8;
    }
  }
}

export function stepMissionState(state, dt, input = {}) {
  state.events.length = 0;
  if (state.phase !== 'playing') return state;

  if (state.hitstopTimer > 0) {
    state.hitstopTimer = Math.max(0, state.hitstopTimer - dt);
    return state;
  }

  state.elapsed += dt;
  state.shakeIntensity = Math.max(0, state.shakeIntensity - dt * 2.2);
  if (state.bannerTimer > 0) state.bannerTimer = Math.max(0, state.bannerTimer - dt);

  const { player, tank, boss } = state;
  if (player.fireCooldown > 0) player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  if (player.grenadeCooldown > 0) player.grenadeCooldown = Math.max(0, player.grenadeCooldown - dt);
  if (player.invulnTimer > 0) player.invulnTimer = Math.max(0, player.invulnTimer - dt);

  // Horizontal movement & 8-dir aim
  const moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const moveY = (input.up ? 1 : 0) - (input.down ? 1 : 0);
  if (moveX !== 0) player.facing = moveX > 0 ? 1 : -1;

  player.crouching = !player.inTank && Boolean(input.down) && player.grounded;

  if (moveX !== 0 || moveY > 0 || (moveY < 0 && !player.grounded)) {
    const ax = moveX !== 0 ? moveX : (moveY !== 0 ? 0 : player.facing);
    const ay = moveY > 0 ? 1 : (moveY < 0 && !player.grounded ? -1 : 0);
    const len = Math.hypot(ax, ay) || 1;
    player.aimX = ax / len;
    player.aimY = ay / len;
  } else {
    player.aimX = player.facing;
    player.aimY = 0;
  }

  const moveSpeed = player.inTank ? 8.2 : (player.crouching ? 3.2 : 9.2);
  const minX = boss.active ? BOSS_ARENA_X - 8 : 0;
  const maxX = STAGE_LENGTH;

  if (player.inTank && tank.active) {
    tank.x = Math.max(minX, Math.min(maxX, tank.x + moveX * moveSpeed * dt));
    tank.facing = player.facing;
    if (input.jump && tank.grounded) {
      tank.vy = 13.5;
      tank.grounded = false;
      state.events.push('jump');
    }
    if (!tank.grounded) {
      tank.vy += GRAVITY * dt;
      tank.y += tank.vy * dt;
      if (tank.y <= GROUND_Y) {
        tank.y = GROUND_Y;
        tank.vy = 0;
        tank.grounded = true;
      }
    }
    player.x = tank.x;
    player.y = tank.y;
    player.grounded = tank.grounded;
  } else {
    player.x = Math.max(minX, Math.min(maxX, player.x + moveX * moveSpeed * dt));
    if (input.jump && player.grounded) {
      player.vy = 15.2;
      player.grounded = false;
      state.events.push('jump');
    }
    if (!player.grounded) {
      player.vy += GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y <= GROUND_Y) {
        player.y = GROUND_Y;
        player.vy = 0;
        player.grounded = true;
      }
    }
  }

  if (input.shoot) fireWeapon(state);
  if (input.grenade) throwGrenade(state);

  // Trigger Boss Arena
  if (!boss.active && !boss.defeated && player.x >= BOSS_ARENA_X - 4) {
    boss.active = true;
    state.bannerText = '⚠️ WARNING! IRON TITAN BOSS!';
    state.bannerTimer = 3.0;
    state.events.push('boss_warning');
  }

  // Rescue POWs on touch
  for (const pow of state.pows) {
    if (!pow.rescued && Math.abs(player.x - pow.x) < 1.5) {
      pow.rescued = true;
      state.powsRescued += 1;
      state.score += 1000;
      state.pickups.push({ id: uid(), x: pow.x + 1.8, y: 0.4, kind: pow.drop });
      state.bannerText = 'THANK YOU! +1000';
      state.bannerTimer = 1.4;
      state.events.push('pow');
    }
  }

  // Collect Pickups
  for (let i = state.pickups.length - 1; i >= 0; i--) {
    const p = state.pickups[i];
    if (Math.abs(player.x - p.x) < 1.5 && Math.abs(player.y - p.y) < 1.8) {
      const w = WEAPONS[p.kind];
      if (w) {
        player.weaponId = w.id;
        player.ammo = w.ammo;
        player.grenades = Math.min(20, player.grenades + 4);
        state.score += 500;
        state.bannerText = `${w.name.toUpperCase()}!`;
        state.bannerTimer = 1.6;
        state.events.push('pickup');
      }
      state.pickups.splice(i, 1);
    }
  }

  // Update Bullets
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    const b = state.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.ttl -= dt;

    let hit = b.ttl <= 0 || b.y < 0;

    if (!hit && b.fromPlayer) {
      // Check Crates
      for (const c of state.crates) {
        if (Math.abs(b.x - c.x) < 1.1 && b.y < 1.5) {
          c.hp -= b.damage;
          hit = true;
          break;
        }
      }
      // Check Enemies
      if (!hit) {
        for (const e of state.enemies) {
          if (Math.abs(b.x - e.x) < 0.9 && Math.abs(b.y - (e.y + 0.9)) < 1.1) {
            e.hp -= b.damage;
            hit = true;
            break;
          }
        }
      }
      // Check Boss
      if (!hit && boss.active && !boss.defeated) {
        if (Math.abs(b.x - boss.x) < 2.6 && b.y < 4.0) {
          boss.hp -= b.damage;
          hit = true;
        }
      }
    } else if (!hit && !b.fromPlayer) {
      const hitRadius = player.inTank ? 1.4 : 0.7;
      const hitHeight = player.inTank ? 2.0 : (player.crouching ? 0.9 : 1.6);
      if (Math.abs(b.x - player.x) < hitRadius && b.y >= player.y && b.y <= player.y + hitHeight) {
        damagePlayer(state, b.damage);
        hit = true;
      }
    }

    if (hit) {
      if (b.explosive) spawnExplosion(state, b.x, Math.max(0.4, b.y), 2.6, 35, b.fromPlayer);
      state.bullets.splice(i, 1);
    }
  }

  // Update Grenades
  for (let i = state.grenades.length - 1; i >= 0; i--) {
    const g = state.grenades[i];
    g.vy += GRAVITY * dt;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.ttl -= dt;
    if (g.y <= GROUND_Y || g.ttl <= 0) {
      spawnExplosion(state, g.x, 0.5, g.radius, g.damage, g.fromPlayer);
      state.grenades.splice(i, 1);
    }
  }

  // Cleanup Destroyed Crates
  for (let i = state.crates.length - 1; i >= 0; i--) {
    if (state.crates[i].hp <= 0) {
      const c = state.crates[i];
      spawnExplosion(state, c.x, 0.6, 1.4, 0, true);
      state.pickups.push({ id: uid(), x: c.x, y: 0.4, kind: c.drop });
      state.score += 200;
      state.crates.splice(i, 1);
    }
  }

  // Update & Cleanup Enemies
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (e.hp <= 0) {
      spawnExplosion(state, e.x, 0.9, 1.8, 0, true);
      state.score += e.kind === 'turret' ? 450 : 250;
      state.kills += 1;
      state.enemies.splice(i, 1);
      continue;
    }

    const dist = Math.abs(e.x - player.x);
    if (dist < 18) {
      e.facing = player.x < e.x ? -1 : 1;
      if (e.kind === 'soldier' && dist > 6) {
        e.x += e.facing * 2.4 * dt;
      }
      e.fireTimer -= dt;
      if (e.fireTimer <= 0) {
        e.fireTimer = e.kind === 'turret' ? 1.5 : 2.0;
        if (e.kind === 'grenadier') {
          state.grenades.push({
            id: uid(),
            fromPlayer: false,
            x: e.x,
            y: 1.2,
            vx: e.facing * 9.5,
            vy: 11.5,
            damage: 25,
            radius: 2.0,
            ttl: 2.2
          });
        } else {
          state.bullets.push({
            id: uid(),
            fromPlayer: false,
            x: e.x + e.facing * 0.8,
            y: 1.0,
            vx: e.facing * 16,
            vy: 0,
            damage: 18,
            explosive: false,
            color: 0xff4d6d,
            ttl: 2.0
          });
        }
      }
    }
  }

  // Update Boss AI (2 Phases)
  if (boss.active && !boss.defeated) {
    if (boss.hp <= boss.maxHp * 0.5 && boss.phase === 1) {
      boss.phase = 2;
      state.bannerText = '🔥 BOSS PHASE 2 — OVERDRIVE!';
      state.bannerTimer = 2.2;
      spawnExplosion(state, boss.x, 2.2, 2.5, 0, false);
    }

    boss.x += boss.moveDir * (boss.phase === 2 ? 3.2 : 1.8) * dt;
    if (boss.x < BOSS_ARENA_X + 3) boss.moveDir = 1;
    if (boss.x > STAGE_LENGTH - 2) boss.moveDir = -1;

    boss.fireTimer -= dt;
    if (boss.fireTimer <= 0) {
      boss.fireTimer = boss.phase === 2 ? 0.95 : 1.55;
      const spread = boss.phase === 2 ? [-0.22, 0, 0.22] : [-0.1, 0.1];
      for (const ang of spread) {
        state.bullets.push({
          id: uid(),
          fromPlayer: false,
          x: boss.x - 2.4,
          y: 2.0,
          vx: -Math.cos(ang) * 18,
          vy: Math.sin(ang) * 18,
          damage: 22,
          explosive: false,
          color: 0xff4d6d,
          ttl: 2.4
        });
      }
    }

    if (boss.hp <= 0) {
      boss.defeated = true;
      boss.active = false;
      state.score += 5000;
      spawnExplosion(state, boss.x, 1.8, 4.5, 0, true);
      state.phase = 'victory';
      state.bannerText = '🏆 MISSION 1 COMPLETE!';
      state.bannerTimer = 5.0;
      state.events.push('victory');
    }
  }

  // Update Explosions
  for (let i = state.explosions.length - 1; i >= 0; i--) {
    state.explosions[i].age += dt;
    if (state.explosions[i].age >= state.explosions[i].maxAge) {
      state.explosions.splice(i, 1);
    }
  }

  return state;
}
