# PNG Adventure: Moresby Run

A lightweight, free-to-play, Papua New Guinea-inspired 2D endless runner.

**Prototype v0.3** — no backend, game framework, ads, account, payments or wagers. It works in an ordinary browser, and is an offline-capable installable PWA when hosted securely.

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
