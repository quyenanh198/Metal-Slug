# Metal Slug 3 — Mission 1 (arcade style, local play)

A browser remake of Metal Slug 3's first mission in the style of the arcade original: a 304×224 screen scaled up
in whole pixels, the original sprites and scenery, and the arcade rules. For local, non-commercial play only;
the art belongs to SNK.

## Run

```bash
npm install
npm run dev      # http://localhost:5174 (also reachable on the LAN)
```

## Controls

| Action | Keyboard | Gamepad |
| :--- | :--- | :--- |
| Move | ← → or A D | D-pad / left stick |
| Aim up / crouch | ↑ / ↓ (W / S) | up / down |
| Shoot (knife when next to an enemy) | J or Z, mouse click | Square / X, R2 |
| Jump | K, Space or X | Cross / A |
| Grenade (Metal Slug cannon) | L, G or C | Circle / B, R1 |
| Leave the Metal Slug | ↓ + jump | down + Cross / A |
| Start / continue | Enter | Options / Start |

## What follows the arcade

- One hit kills Marco; 2 spare lives, a 60-count TIME clock, CONTINUE countdown, GAME OVER.
- Upper body and legs are separate sprites (run, jump, crouch, shoot, aim up, knife, grenade, death, victory).
- The handgun fires once per press; Heavy Machine Gun (H), Rocket Launcher (R) and Shotgun (S) come from P.O.W.s and
  fall back to the handgun when empty. Shooting a rebel at close range uses the knife. 10 grenades, more from crates.
- Rebel soldiers idle or chat until they spot Marco, panic, then rush in with a knife or lob stick grenades;
  they die with the shot or knife-cut death animations.
- The SV-001 Metal Slug waits at the jungle edge: walk into it to drive. Its vulcan swings toward where you aim,
  the cannon fires shells (uses bombs), and hits wear down its 3-point armour before it blows up and Marco bails out.
- Chowmein Conga crabs on the beach and the wreck take several hits and swipe sand with a claw.
- P.O.W.s are freed by touch or gunfire, walk over, hand over an item, salute and run off.
- The camera only scrolls forward and stops at enemy waves until they are cleared ("GO").
- Boss: after the last jungle wave Marco rides the Slug Transport Ferry across the sunset sea while Huge Hermit wades
  after it. It lobs fireballs from its top cannon; at half health it deploys the big cannon and drops heavy shells,
  and the ferry gets wrecked down to the SV-001 crate. Destroying it ends the mission (victory pose, P.O.W. bonus).
- Every bullet stops at the first enemy it hits (no piercing); the handgun has unlimited ammo.
- Scenery: Mission 1 beach, wrecked ship and swamp bridge, jungle; far panorama with parallax and the animated sea;
  the boss fight on the scrolling sunset sea.

## Layout

- `src/arcade/game.js` — rules, fixed 60 Hz steps, no DOM (tested in `tests/arcade.test.js`).
- `src/arcade/level.js` — ground pieces, walkable ground lines and the encounter script.
- `src/arcade/render.js`, `assets.js`, `input.js`, `audio.js` — drawing, atlas, controls, synthesized sound.
- `tools/` — art pipeline: `ms3-manifest.mjs` lists which sprites to cut from `art-source/` sheets;
  `npm run atlas` rebuilds `public/assets/ms3/` (writes a check montage to `tools/out/`);
  `node tools/sheet.mjs preview <sheet> x y w h scale out.png` helps find coordinates.

## Tests

```bash
npm test
```

Includes a bot run that clears every wave, destroys Huge Hermit and completes Mission 1.
