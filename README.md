# PNG Adventure — Stilt Village + Moresby Run

Two free PNG-themed browser game modes: the new **Stilt Village** free-movement platformer at `/coast/` and the earlier **Moresby Run** endless runner at `/`.

**Prototype v0.3** — no backend, game framework, ads, account, payments or wagers. It works in an ordinary browser, and is an offline-capable installable PWA when hosted securely.

## Stage 1: Stilt Village (Coastal Village Phase 1)

Open `/coast/` for the new handcrafted stage. **This is the recommended game.**

- **Keyboard:** Left/Right or A/D to move, Space to jump, Down/S to crouch, Up/Down at ladders to climb, P/Escape to pause.
- **Touch:** 5 on-screen controls for left, right, up, down and jump. Hold jump for more height.
- Cross the water on wooden boardwalks; visit stilt houses, climb to roofs, gather gold tokens, avoid crabs and timed leaping fish, reach the end jetty.
- A checkpoint is midway through the level; player keeps three hearts and the fastest stage clear is saved locally.
- Original generated pixel sprites are defined in `coast/sprites.js`; level geometry and hazards in `coast/level.js`; gameplay in `coast/game.js`. No external asset requests.

## Original mode: Moresby Run

## How to play

- **Desktop:** Space / Up Arrow = jump; Down Arrow = slide; P / Escape = pause.
- **Phone:** Use the on-screen JUMP and SLIDE buttons. Landscape is recommended.
- Dodge crates and potholes by jumping; slide under low MARKET banners.
- Jump onto elevated wooden/rock platforms to reach bonus coins. Land on top or run off to drop back to the ground.
- Progress visually from Gordons Market to Koki Waterfront and Highlands Track every 35 seconds.
- Start with three hearts. Collisions briefly grant invulnerability.
- Collect coins, beat your own best score and buy optional cosmetic outfits using earned coins.
- Progress is saved locally in the browser (localStorage); clearing browser data removes it.

## Project structure

- index.html — HTML shell, controls, HUD, and PWA registration
- style.css — responsive styling for desktop and mobile
- src/core.js — pure, unit-testable game/progression rules
- src/level.js — elevated platform generation, landing collision rules and area transitions
- src/art.js — original procedural character/obstacle/scenery art and animations
- src/game.js — canvas renderer, input, animation, audio and game loop
- assets/icon.svg — app icon
- manifest.webmanifest — PWA manifest
- sw.js — offline cache and service-worker lifecycle
- tests/core.test.cjs — Node.js unit tests
- tests/level.test.cjs — platform landing and area tests
- render.yaml — optional Render static-site Blueprint

## Run locally

No npm install or build system is needed. From the project root:

    python -m http.server 8000

Open http://localhost:8000. Avoid opening index.html as a file if testing the PWA: service workers require HTTPS or localhost.

## Test

    node --test tests/*.test.cjs

Requires Node.js 18+.

## Render deployment

**Use a Static Site**, not a Web Service:

- Repository: Roderick47/PNG-Adventure
- Branch: main (after merging the PR)
- Build command: leave empty
- Publish directory: .

Or configure from the included render.yaml Blueprint. A static site needs **no start command** and no database. Render serves the checked-in HTML, CSS, JS and assets directly over HTTPS.

If you already created a Render Web Service for this project, you can create a replacement Static Site pointing to the same repository. Keep the existing service until the new site's deployment succeeds.

## Status and limitations

- First launch requires an internet connection; subsequent gameplay can run offline if all files were cached successfully.
- Offline mode does not provide cloud saves, advertising, global rankings or device synchronization.
- No server-side score verification; local scores are not suitable for prize competitions.
- SVG manifest icons work in many modern browsers, but some Android installers require raster PNG 192px/512px icons. These can be added for broader distribution.
- This prototype is original and fictional; it does not depict or claim sponsorship from real political figures or organisations.

## Roadmap

1. Validate elevated routes, buffered jump timing, platform landings and obstacle fairness on budget Android devices.
2. Optimize artwork, sprite animation, music and mobile performance.
3. Add PNG-inspired levels with distinctive scenery, then player profiles and server-verified scores.
4. Evaluate ads/sponsorships only after confirming regular gameplay and legal compliance.


## Phase 2.1 — Character Sprite Redesign

Stilt Village now uses an original, hand-posed **48x64 pixel-art boy** generated into cached offscreen canvases in `coast/player/character.js`. All frames share a bottom-centre pivot at (24,64). Collision physics are unchanged.

Open `/coast/player/` to inspect, scrub, pause and flip the 12 pose groups (idle, run, takeoff, rise, apex, fall, land, crouch, crouchIdle, climb, hurt, victory). Phase 2.2 will connect the distinct transition animations to the gameplay state machine. The old 32x48 player generator is retired. Existing enemies, scenery and saves remain intact.


## Phase 2.2 — Event-driven animation

Stilt Village now uses `coast/player/animator.js`, an independently tested deterministic state machine with timing based on `CoastBoy.FRAME_COUNTS` and `CoastBoy.FRAME_FPS`. It selects idle/run/crouch/climb/airborne frames from player movement and plays explicit takeoff, land, hurt and victory events with interruption priorities. The existing platform collision, player control, level, save and reward mechanics are unchanged. Animation is frame-rate-independent, freezes on pause and continues celebrating at victory. Dedicated tests live in `tests/animator.test.cjs`.
