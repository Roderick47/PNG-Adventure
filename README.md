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

## Phase 2.3 — Movement and physics polish

Stilt Village now uses the dedicated `coast/player/controller.js` movement module.
Horizontal movement accelerates and decelerates rather than snapping to full speed.
Held jumps and short hops support different jump heights.

Physics includes 100 ms coyote time, 120 ms jump buffering, and bounded
1/120-second substeps for more reliable collisions on slower mobile devices.
Collision uses the gameplay hitbox, not the 48x64 character sprites.
Crouching reduces movement speed; ladders now support descending from above.

The controller emits takeoff and landing events for the animation system.
The level layout, saved completion times, and PWA routes are unchanged.
Tests in `tests/controller.test.cjs` cover motion, input, platform edges,
ladders, respawning, and frame-rate consistency.


## Phase 2.4.1 — Responsive mobile gamepad

Stilt Village touch controls are now outside the canvas. On portrait coarse-pointer devices, the control dock sits **below** the stage; on landscape touch devices, it overlays the bottom corners. Direction buttons are approximately 58 × 58 CSS pixels (48 × 48 on short landscape screens); jump is 94 × 94 (82 × 82 on short landscape screens). Very narrow portrait screens use a 50-pixel directional fallback.

`coast/input/touch.js` tracks each pointer independently and exposes pressed visual feedback and accessible `aria-pressed` state. Two fingers on the same button do not release prematurely; simultaneous jump plus movement works; pointer cancellation, lost capture, pause, restart, and focus loss clear held touches. Keyboard and touch inputs are combined so neither can cancel the other. The existing physics, game levels, sprite art, scores, controls and save data remain unchanged.

Touch behavior is covered by `tests/touch.test.cjs`; the full game boot smoke test also loads the new adapter. The offline PWA cache now includes the touch adapter.


## Phase 2.4.2 — Dynamic platform engine

The new `coast/world/platforms.js` module provides a dependency-free registry for
moving or temporarily non-solid one-way surfaces. Platform IDs are stable; each
platform may provide an update callback, a landing callback, and optional reset
logic. Dynamic collision geometry is supplied independently of the original
`CoastLevel.surfaces` array, which is never modified.

The player physics controller advances platforms within its existing 1/120-second
substeps, carries grounded riders by the surface's x/y displacement, resolves
support and one-way landing across static and dynamic surfaces, and clears support
when jumping or when a surface disappears. Restart restores platform state and
clears displacement. A disappearing platform is not considered ground.

No moving canoes, breakable planks or nets are added to the shipped level in
this infrastructure milestone; Phase 2.4.3 and later add objects and their art.
No additional game controls or save migrations are needed.

See `tests/platforms.test.cjs` for collision, ride, jump, collapse,
reset, callback and frame-rate consistency tests.


## Phase 2.4.3 — Moving lagoon canoes

Three optional **moving outrigger canoes** now ferry along short sections of the
Stilt Village lagoon. They are playable one-way platforms: the character can
land on their timber decks, ride without holding a direction, and jump off.
The existing boardwalk and roof route stays intact.

Canoe positions are defined in `coast/world/canoes.js`, using deterministic
back-and-forth movement at 48–55 px/s, stable deck heights above the water,
and a reversible path. `coast/sprites.js` draws the canoe hulls, outriggers,
prow ornaments, and small wakes using original generated pixel artwork. The
hull bobs visually without moving the solid deck, preventing collision jitter.

Routes are registered in the Phase 2.4.2 platform manager at start-up; their
collision and carry behavior are calculated inside the existing player physics
substeps. Reset restores original phase, position and travel direction.
`tests/canoes.test.cjs` verifies route geometry, turnaround, landing, player
carry, jumping, resets, input rate consistency and invalid configuration.

This milestone doesn't introduce collapsing planks or nets (Phases 2.4.4–2.4.5).


## Phase 2.4.4 — Collapsing wooden planks

Three optional elevated wooden planks appear in Stilt Village: above the first
boardwalk, the middle village crossing, and the late jetty. The permanent
boardwalk beneath each one remains intact, so collapse does not make the
normal stage route unplayable.

A player's first landing starts a **0.65-second** crack-and-shake warning.
The plank then loses collision for **2.5 seconds**, displays falling wooden
fragments, and regenerates once its timer expires **only if the character
is clear of the respawn area**. The warning is visual: shaking never moves
the collision surface. The existing jump buffer and coyote-time behavior
remain in force, allowing a player to escape on time.

The finite-state machine is implemented in `coast/world/breakaways.js`,
registered through the existing dynamic-platform manager, and advanced in
the same bounded physics substeps as the player. Canvas artwork lives in
`coast/sprites.js`. Restart resets all plank timers and collision states.
`tests/breakaways.test.cjs` covers warning, collapse, rescue, respawn
safety, restart, canoe compatibility, and 30/60/120-FPS determinism.

Next: Phase 2.4.5 — suspended and climbable fishing nets.


## Phase 2.4.5 — Fishing nets

Stilt Village includes two new **suspended fishing-net platforms**, at the first
and second raised boardwalk crossings. The player lands and jumps on their
stable one-way collision surfaces. Netting sags briefly on landing, but this
is visual-only and does not inject unexpected physics impulses. The net pulse
clears automatically and resets on a fresh run.

Two **climbable fishing nets** run between existing boardwalks and house roofs:
near world x=1125 (upper y=310, lower y=418) and x=2337
(upper y=292, lower y=405). Use the ordinary **up/down** controls to climb,
then **jump** to detach. Climbing reuses the existing ladder movement and
character animation through a lightweight level adapter; original ladders
and gameplay physics remain unchanged. The new optional routes are not
required to finish the stage.

The module `coast/world/nets.js` registers decks and exposes climbing regions;
`coast/sprites.js` draws woven platforms and net ladders. Tests in
`tests/nets.test.cjs` cover landings, jump-off, climbing both directions,
the original ladders, resets, and equivalent physics at 30/60/120 FPS.


## Phase 2.5.1 — Parallax backgrounds and atmospheric depth

Stilt Village now renders the background through `coast/environment/parallax.js`,
a dedicated deterministic Canvas renderer. Four independent camera-scaled
layers create a visual sense of distance: slow-moving clouds (0.035×),
distant islands (0.10×), nearer ridgelines (0.22×), and background coastal
village silhouettes and palm trees (0.40×). Pixelated hill profiles, coastal
haze, an ocean horizon and subtle cloud drift provide atmosphere without
replacing the game's existing original art style.

Background repetition is capped to the visible 960px canvas width instead of
drawing the entire world. The renderer reuses the existing house, palm and
boat sprite functions rather than loading new external images. When the
device requests reduced motion, time-driven cloud drift and background boat
bobbing are disabled. The game still uses its original world-space collision
geometry, camera rules, physics, enemies, saves, hazards and interactive
platforms.

Tests in `tests/parallax.test.cjs` validate depth ratios, scroll wrapping,
view-bounded work, static ocean coverage, reduced motion and gameplay geometry
isolation. The original `CoastSprites.background` remains available for
compatibility; only Stage 1's background draw call is switched.
