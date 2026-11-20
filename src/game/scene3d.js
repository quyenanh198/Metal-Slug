import * as THREE from 'three';
import { STAGE_LENGTH } from './constants.js';
import { BACKDROP_CROP, createSpriteAssets } from './sprites.js';

function createHD2DSpritePlane(w, h, texture, { unlit = false } = {}) {
  const mat = unlit
    ? new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.35,
        side: THREE.DoubleSide
      })
    : new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.4,
        side: THREE.DoubleSide,
        roughness: 0.85,
        metalness: 0.05
      });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.castShadow = !unlit;
  mesh.receiveShadow = !unlit;
  return mesh;
}

export function createBattlefieldScene(scene) {
  const sprites = createSpriteAssets();

  // Tropical Metal Slug 3 Mission 1 Sky & Lighting
  scene.background = new THREE.Color(0x18607e);
  scene.fog = new THREE.FogExp2(0x2d7b92, 0.008);

  const hemi = new THREE.HemisphereLight(0xf8fafc, 0x475569, 1.15);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfffbeb, 1.35);
  sun.position.set(16, 26, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.camera.left = -45;
  sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  scene.add(sun);

  // Dynamic Explosion + Muzzle Flash Light
  const fxLight = new THREE.PointLight(0xff9f1c, 0, 18);
  fxLight.position.set(0, 2.2, 2);
  scene.add(fxLight);

  // 3D Textured Beach/Sand Road
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(STAGE_LENGTH + 40, 0.6, 8.5),
    new THREE.MeshStandardMaterial({ map: sprites.roadTex, roughness: 0.92 })
  );
  road.position.set(STAGE_LENGTH / 2, -0.3, 0);
  road.receiveShadow = true;
  scene.add(road);

  // Mission 1 panorama: one continuous strip at the image's own aspect ratio. Mirrored repeats hide the seam
  // where the image's two ends meet, and the strip trails the camera (parallax) so it reads as far away.
  const BG_HEIGHT = 13;
  const BG_TILE = BG_HEIGHT * (BACKDROP_CROP.width / BACKDROP_CROP.height);
  const BG_LENGTH = STAGE_LENGTH + 160;
  const bgTex = sprites.mission1BgTex;
  bgTex.repeat.set(BG_LENGTH / BG_TILE, 1);
  bgTex.needsUpdate = true;
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(BG_LENGTH, BG_HEIGHT), new THREE.MeshBasicMaterial({ map: bgTex, fog: false }));
  backdrop.position.set(STAGE_LENGTH / 2, 5.6, -7.2);
  scene.add(backdrop);

  // Sand in front of and behind the road, so no empty sky colour shows below the playfield.
  const groundTex = sprites.groundTex;
  groundTex.repeat.set((STAGE_LENGTH + 160) / 4, 30 / 4);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(STAGE_LENGTH + 160, 30), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(STAGE_LENGTH / 2, -0.05, 7.8);
  ground.receiveShadow = true;
  scene.add(ground);

  // Midground sandbag cover as pixel sprites
  const sandbagMat = new THREE.MeshStandardMaterial({ map: sprites.sandbagTex, transparent: true, alphaTest: 0.4, roughness: 0.92 });
  const sandbagGeo = new THREE.PlaneGeometry(2.6, 1.3);
  for (let x = 8; x <= STAGE_LENGTH; x += 16) {
    const bag = new THREE.Mesh(sandbagGeo, sandbagMat);
    bag.position.set(x, 0.62, -2.6);
    bag.castShadow = true;
    bag.receiveShadow = true;
    scene.add(bag);
  }

  // Marco Rossi: TRUE Metal Slug split Lower Legs + Upper Torso!
  const playerGroup = new THREE.Group();
  const marcoLegs = createHD2DSpritePlane(1.75, 1.05, sprites.marcoLegsTex);
  marcoLegs.position.set(0, 0.52, 0);
  playerGroup.add(marcoLegs);

  const marcoUpper = createHD2DSpritePlane(1.85, 1.65, sprites.marcoUpperTex);
  marcoUpper.position.set(0.08, 1.48, 0.04);
  playerGroup.add(marcoUpper);
  scene.add(playerGroup);

  // SV-001 Metal Slug Tank (Authentic MS3 Sprite)
  const tankSprite = createHD2DSpritePlane(3.3, 2.65, sprites.tankTex);
  scene.add(tankSprite);

  // Type 02 Di-Cokka Boss Tank (Authentic MS3 Sprite)
  const bossSprite = createHD2DSpritePlane(5.2, 4.05, sprites.bossTex);
  scene.add(bossSprite);

  // Muzzle flash
  const muzzleFlash = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 1.0),
    new THREE.MeshBasicMaterial({ map: sprites.muzzleTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  muzzleFlash.visible = false;
  scene.add(muzzleFlash);

  // 3D Brass Shell Casings
  const shells = [];
  const shellGeo = new THREE.BoxGeometry(0.16, 0.06, 0.06);
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.8, roughness: 0.2 });

  const pools = {
    crates: new Map(),
    pows: new Map(),
    pickups: new Map(),
    enemies: new Map(),
    bullets: new Map(),
    grenades: new Map(),
    explosions: new Map()
  };

  const crateGeo = new THREE.BoxGeometry(1.25, 1.25, 1.25);
  const crateMat = new THREE.MeshStandardMaterial({ map: sprites.crateTex, roughness: 0.85 });
  const bulletGeo = new THREE.PlaneGeometry(0.75, 0.38);
  const rocketGeo = new THREE.PlaneGeometry(1.2, 0.55);
  const bulletMats = new Map();
  const bulletMat = (color) => {
    if (!bulletMats.has(color)) bulletMats.set(color, new THREE.MeshBasicMaterial({ map: sprites.bulletTex(color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    return bulletMats.get(color);
  };
  const grenadeGeo = new THREE.PlaneGeometry(0.42, 0.49);
  const grenadeMat = new THREE.MeshStandardMaterial({ map: sprites.grenadeTex, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });

  function syncMap(map, list, factory, updater) {
    const activeIds = new Set();
    for (const item of list) {
      activeIds.add(item.id);
      let mesh = map.get(item.id);
      if (!mesh) {
        mesh = factory(item);
        scene.add(mesh);
        map.set(item.id, mesh);
      }
      updater(mesh, item);
    }
    for (const [id, mesh] of map.entries()) {
      if (!activeIds.has(id)) {
        scene.remove(mesh);
        map.delete(id);
      }
    }
  }

  let prevPlayerX = 0;

  return {
    sync(state, time) {
      const { player, tank, boss } = state;

      // Backdrop trails the camera at 55% so it scrolls slower than the playfield.
      const camX = Math.max(6, player.x + 4.5);
      backdrop.position.x = STAGE_LENGTH / 2 + (camX - STAGE_LENGTH / 2) * 0.55;

      // Marco Rossi split animation
      const moving = Math.abs(player.x - prevPlayerX) > 0.01;
      prevPlayerX = player.x;

      const legFrame = moving ? Math.floor(time * 16) % 12 : 0;
      const upperFrame = Math.floor(time * 8) % 8;
      sprites.marcoLegsTex.offset.x = legFrame / 12;
      sprites.marcoUpperTex.offset.x = upperFrame / 8;

      playerGroup.visible =
        !player.inTank && (player.invulnTimer <= 0 || Math.floor(player.invulnTimer * 16) % 2 === 0);
      playerGroup.position.set(player.x, player.y, 0);
      playerGroup.scale.x = player.facing > 0 ? 1 : -1;
      playerGroup.scale.y = player.crouching ? 0.72 : 1.0;
      marcoUpper.rotation.z = player.aimY > 0.5 ? 0.55 : 0;

      // Muzzle flash & shells
      const justShot = state.events.some((e) => e.startsWith('shoot_'));
      if (justShot) {
        muzzleFlash.visible = true;
        muzzleFlash.position.set(
          player.x + player.aimX * 1.15,
          player.y + (player.crouching ? 0.7 : 1.25) + player.aimY * 0.55,
          0.18
        );
        muzzleFlash.rotation.z = Math.random() * Math.PI;
        fxLight.position.set(player.x, player.y + 1.5, 1.5);
        fxLight.intensity = 2.6;

        const mesh = new THREE.Mesh(shellGeo, shellMat);
        mesh.position.set(player.x, player.y + 1.2, 0.2);
        scene.add(mesh);
        shells.push({
          mesh,
          vx: -player.facing * (2.5 + Math.random() * 2.5),
          vy: 4.5 + Math.random() * 2.0,
          vz: 0.8 + Math.random() * 1.5,
          ttl: 0.9
        });
      } else {
        muzzleFlash.visible = false;
      }

      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        s.vy -= 18 * 0.016;
        s.mesh.position.x += s.vx * 0.016;
        s.mesh.position.y = Math.max(0.05, s.mesh.position.y + s.vy * 0.016);
        s.mesh.position.z += s.vz * 0.016;
        s.mesh.rotation.z += 0.35;
        s.ttl -= 0.016;
        if (s.ttl <= 0) {
          scene.remove(s.mesh);
          shells.splice(i, 1);
        }
      }

      // SV-001 Tank
      sprites.tankTex.offset.x = (Math.floor(time * 10) % 8) / 8;
      tankSprite.visible = tank.active;
      tankSprite.position.set(tank.x, tank.y + 1.32, 0.05);
      tankSprite.scale.x = tank.facing > 0 ? 1 : -1;

      // Di-Cokka Boss Tank (faces left by default in sheet)
      sprites.bossTex.offset.x = (Math.floor(time * (boss.phase === 2 ? 12 : 7)) % 6) / 6;
      bossSprite.visible = boss.active && !boss.defeated;
      bossSprite.position.set(boss.x, boss.y + 2.02, 0.05);
      bossSprite.material.emissive = new THREE.Color(boss.phase === 2 ? 0x991b1b : 0x000000);
      bossSprite.material.emissiveIntensity = boss.phase === 2 ? 0.35 + Math.sin(time * 12) * 0.15 : 0;

      // Crates
      syncMap(
        pools.crates,
        state.crates,
        () => {
          const m = new THREE.Mesh(crateGeo, crateMat);
          m.castShadow = true;
          return m;
        },
        (m, c) => m.position.set(c.x, 0.62, 0)
      );

      // POWs (Authentic MS3 POW tied to post)
      sprites.powTex.offset.x = (Math.floor(time * 6) % 6) / 6;
      syncMap(
        pools.pows,
        state.pows.filter((p) => !p.rescued),
        () => createHD2DSpritePlane(1.9, 2.2, sprites.powTex),
        (m, p) => m.position.set(p.x, 1.1, 0)
      );

      // Pickups
      syncMap(
        pools.pickups,
        state.pickups,
        (p) => createHD2DSpritePlane(1.0, 1.0, sprites.pickupTextures[p.kind] || sprites.pickupTextures.HMG, { unlit: true }),
        (m, p) => m.position.set(p.x, 0.8 + Math.sin(time * 6) * 0.16, 0.12)
      );

      // Enemies (Authentic MS3 Rebel Soldiers — sheet faces left by default)
      sprites.rebelTex.offset.x = (Math.floor(time * 10) % 8) / 8;
      syncMap(
        pools.enemies,
        state.enemies,
        (e) => {
          const tex = e.kind === 'turret' ? sprites.bossTex : sprites.rebelTex;
          const size = e.kind === 'turret' ? [2.6, 2.0] : [1.95, 1.95];
          return createHD2DSpritePlane(size[0], size[1], tex);
        },
        (m, e) => {
          m.position.set(e.x, e.y + (e.kind === 'turret' ? 1.0 : 0.98), 0);
          m.scale.x = e.facing < 0 ? 1 : -1;
        }
      );

      // Bullets
      syncMap(
        pools.bullets,
        state.bullets,
        (b) => new THREE.Mesh(b.explosive ? rocketGeo : bulletGeo, bulletMat(b.color)),
        (m, b) => {
          m.position.set(b.x, b.y, 0.12);
          m.rotation.z = Math.atan2(b.vy, b.vx);
        }
      );

      // Grenades
      syncMap(
        pools.grenades,
        state.grenades,
        () => new THREE.Mesh(grenadeGeo, grenadeMat),
        (m, g) => {
          m.position.set(g.x, g.y, 0.12);
          m.rotation.z = time * -12;
        }
      );

      // Authentic MS3 8-Frame Explosions + Dynamic Light
      if (state.explosions.length > 0) {
        const latest = state.explosions[state.explosions.length - 1];
        fxLight.position.set(latest.x, latest.y + 1.5, 2.0);
        fxLight.intensity = 4.5 * (1 - latest.age / latest.maxAge);
      } else if (!justShot) {
        fxLight.intensity *= 0.8;
      }

      syncMap(
        pools.explosions,
        state.explosions,
        () => {
          const tex = sprites.explosionTex.clone();
          tex.needsUpdate = true;
          return createHD2DSpritePlane(1, 1, tex, { unlit: true });
        },
        (m, ex) => {
          const progress = Math.min(0.99, ex.age / ex.maxAge);
          const frame = Math.floor(progress * 8);
          m.material.map.offset.x = frame / 8;
          const s = ex.radius * 2.1;
          m.scale.set(s, s, 1);
          m.position.set(ex.x, ex.y + 0.65, 0.28);
        }
      );
    }
  };
}
