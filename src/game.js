/* PNG Adventure: Moresby Run — dependency-free canvas prototype. */
(function () {
  "use strict";
  const C = window.PNGameCore;
  const L = window.PNLevel;
  const A = window.PNArt;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const hud = document.getElementById("hud");
  const controls = document.getElementById("controls");
  const toast = document.getElementById("toast");
  const scoreEl = document.getElementById("score");
  const distanceEl = document.getElementById("distance");
  const coinsEl = document.getElementById("coins");
  const heartsEl = document.getElementById("health");
  const soundButton = document.getElementById("sound-toggle");
  const W = 960, H = 540, FLOOR = 431;
  const KEY = "png-adventure-save-v2";
  const player = { x: 183, footY: FLOOR, vy: 0, grounded: true, coyote: 0, jumpBuffer: 0, slide: 0, stride: 0 };
  let state = "menu", save = load(), muted = false, audio = null, lastFrame = 0;
  let objects = [], platforms = [], particles = [], elapsed = 0, speed = 320, distance = 0;
  let zone = 0, nextPlatform = 3.6;
  let coins = 0, score = 0, hearts = 3, immunity = 0, nextSpawn = 1.55;
  let scenery = 0, toastDeadline = 0, resultCommitted = false;

  function load() {
    try { return C.normalizeSave(JSON.parse(localStorage.getItem(KEY))); }
    catch (_) { return C.normalizeSave(null); }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (_) {}
  }
  function number(n) { return Math.floor(n).toLocaleString("en-US"); }
  function actionButton(label, action, kind) {
    return '<button type="button" class="btn ' + (kind || "secondary") +
      '" data-action="' + action + '">' + label + "</button>";
  }
  function show(markup) { overlay.innerHTML = '<div class="panel">' + markup + "</div>"; overlay.classList.remove("hidden"); }
  function conceal() { overlay.classList.add("hidden"); overlay.innerHTML = ""; }
  function visibleGame(active) {
    hud.classList.toggle("hidden", !active);
    controls.classList.toggle("hidden", !active);
  }
  function toastMessage(message) {
    toast.textContent = message;
    toast.classList.add("visible");
    toastDeadline = performance.now() + 1300;
  }
  function effect(kind) {
    if (muted) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      if (!audio) audio = new Audio();
      if (audio.state === "suspended") audio.resume().catch(function () {});
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const now = audio.currentTime;
      const pitch = { jump: 500, coin: 850, hit: 180, over: 220, buy: 710 }[kind] || 450;
      osc.type = kind === "hit" ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(80, pitch * (kind === "hit" ? .45 : 1.25)), now + .11);
      gain.gain.setValueAtTime(.05, now);
      gain.gain.exponentialRampToValueAtTime(.001, now + .14);
      osc.connect(gain); gain.connect(audio.destination);
      osc.start(now); osc.stop(now + .15);
    } catch (_) {}
  }
  function hudUpdate() {
    scoreEl.textContent = number(score);
    distanceEl.textContent = number(distance / 12) + " m";
    coinsEl.textContent = "● " + number(coins);
    heartsEl.textContent = ("♥ ".repeat(hearts) + "♡ ".repeat(3 - hearts)).trim();
    heartsEl.setAttribute("aria-label", hearts + " of 3 hearts");
    document.getElementById("area").textContent = L.ZONES[zone].label;
  }
  function menu() {
    state = "menu";
    visibleGame(false);
    show('<div class="eyebrow">One city. Endless adventure.</div>' +
      '<h1>PNG <span>ADVENTURE</span></h1>' +
      '<p>Run through Moresby, jump over hazards, collect kina coins and chase your personal best. How far can you go?</p>' +
      '<div class="actions">' +
      '<a class="btn primary" href="./coast/">🌊 PLAY STILT VILLAGE</a>' +
      actionButton("▶ ORIGINAL RUNNER", "start") +
      actionButton("★ OUTFITS", "locker") +
      actionButton("? HOW TO PLAY", "how") + '</div>' +
      '<div class="stats"><div class="stat"><small>PERSONAL BEST</small><strong>' + number(save.best) + ' PTS</strong></div>' +
      '<div class="stat"><small>COINS SAVED</small><strong>● ' + number(save.bank) + '</strong></div></div>');
  }
  function how() {
    state = "how"; visibleGame(false);
    show('<div class="eyebrow">Quick start</div><h2>HOW TO PLAY</h2>' +
      '<p>Your character runs automatically. Jump over crates and potholes, then slide beneath the hanging banners.</p>' +
      '<ul><li><b>Desktop:</b> Space / ↑ jump, ↓ slide, P or Esc pause.</li>' +
      '<li><b>Mobile:</b> Use the two on-screen controls. Landscape is recommended.</li>' +
      '<li>You start with <b>three hearts</b>. A hit removes one heart, then gives brief protection.</li>' +
      '<li>Collect coins and buy <b>guaranteed cosmetic outfits</b>. There are no wagers or random purchases.</li>' +
      '<li>Your best score and coins stay on this device, including offline.</li></ul>' +
      '<div class="actions">' + actionButton("▶ PLAY NOW", "start", "primary") +
      actionButton("← MENU", "menu") + '</div>');
  }
  function locker() {
    state = "locker"; visibleGame(false);
    const cards = Object.entries(C.OUTFITS).map(function (entry) {
      const id = entry[0], item = entry[1];
      const owned = save.unlocked.includes(id), selected = save.outfit === id;
      return '<div class="locker-card"><span class="avatar">' + item.symbol + '</span>' +
        '<strong>' + item.name + '</strong><small>' +
        (owned ? "UNLOCKED" : number(item.price) + " COINS") + '</small>' +
        '<button type="button" class="btn ' + (selected ? "secondary" : "primary") +
        '" data-action="outfit:' + id + '"' + (selected ? " disabled" : "") + '>' +
        (selected ? "EQUIPPED" : owned ? "EQUIP" : "● " + number(item.price)) +
        "</button></div>";
    }).join("");
    show('<div class="eyebrow">Earn coins. Pick your look.</div><h2>OUTFIT LOCKER</h2>' +
      '<p>Your coins: <b style="color:#ffd36c">● ' + number(save.bank) + '</b>. Outfits do not affect gameplay.</p>' +
      '<div class="locker">' + cards + '</div><div class="actions">' +
      actionButton("▶ PLAY NOW", "start", "primary") + actionButton("← MENU", "menu") + "</div>");
  }
  function start() {
    objects = []; platforms = []; particles = []; elapsed = 0; speed = 320; distance = 0;
    coins = 0; score = 0; hearts = 3; immunity = 0; nextSpawn = 1.3;
    nextPlatform = 3.4; zone = 0;
    player.footY = FLOOR; player.vy = 0; player.grounded = true;
    player.coyote = 0; player.jumpBuffer = 0; player.slide = 0; player.stride = 0;
    resultCommitted = false; state = "running";
    hudUpdate(); conceal(); visibleGame(true);
    toastMessage("WELCOME TO GORDONS MARKET");
  }
  function pause() {
    if (state !== "running") return;
    state = "paused"; visibleGame(false);
    show('<div class="eyebrow">Take a break</div><h2>PAUSED</h2>' +
      '<p>Score: <b>' + number(score) + '</b>. Your progress is waiting.</p>' +
      '<div class="actions">' + actionButton("▶ RESUME", "resume", "primary") +
      actionButton("END RUN", "end") + '</div>');
  }
  function resume() {
    if (state !== "paused") return;
    state = "running"; conceal(); visibleGame(true);
  }
  function finish() {
    if (resultCommitted || (state !== "running" && state !== "paused")) return;
    resultCommitted = true;
    const oldBest = save.best;
    save = C.finishSave(save, score, coins);
    persist(); state = "over"; visibleGame(false); effect("over");
    show('<div class="eyebrow">Adventure complete</div><h2>' +
      (score > oldBest ? "NEW PERSONAL BEST!" : "NICE RUN!") + '</h2>' +
      '<p>You banked <b>' + number(coins) + '</b> coins. One more run could beat that score.</p>' +
      '<div class="result-row">' +
      '<div class="result"><small>SCORE</small><strong>' + number(score) + '</strong></div>' +
      '<div class="result"><small>DISTANCE</small><strong>' + number(distance / 12) + ' m</strong></div>' +
      '<div class="result"><small>COINS EARNED</small><strong>+' + number(coins) + '</strong></div></div>' +
      '<div class="actions">' + actionButton("↻ PLAY AGAIN", "start", "primary") +
      actionButton("↗ SHARE SCORE", "share") + actionButton("★ OUTFITS", "locker") +
      actionButton("MENU", "menu") + '</div>');
  }
  function performJump() {
    player.vy = -790; player.grounded = false; player.coyote = 0;
    player.jumpBuffer = 0; player.slide = 0;
    effect("jump");
    burst(player.x, player.footY - 6, "#f0d6a2", 5);
  }
  function jump() {
    if (state !== "running") return;
    player.jumpBuffer = .13;
    if (player.grounded || player.coyote > 0) performJump();
  }
  function slide() {
    if (state !== "running" || !player.grounded) return;
    player.slide = .69;
    burst(player.x - 20, player.footY - 4, "#ead4ac", 3);
  }
  function spawn() {
    const type = C.obstacleKind(elapsed, Math.random());
    const width = type === "pothole" ? 96 : type === "banner" ? 90 : 52;
    const x = W + 30;
    objects.push({ type, x, width, hit: false });
    const coinY = type === "banner" ? FLOOR - 23 : FLOOR - 100;
    for (let i = 0; i < 3; i++) {
      objects.push({ type: "coin", x: x + 140 + i * 38, y: coinY - (i === 1 ? 15 : 0), width: 20, hit: false });
    }
  }
  function spawnPlatform() {
    const p = L.makePlatform(W + 40, elapsed, Math.random());
    platforms.push(p);
    for (let i = 0; i < 4; i++) {
      objects.push({
        type: "coin", x: p.x + 43 + i * 48,
        y: p.y - 27 - (i === 2 ? 17 : 0), width: 20, hit: false
      });
    }
  }
  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      particles.push({ x, y, vx: (Math.random() - .5) * 180, vy: -Math.random() * 180,
        life: .4 + Math.random() * .3, color });
    }
  }
  function damage() {
    if (immunity > 0 || state !== "running") return;
    hearts--; immunity = 1.5; effect("hit");
    burst(player.x, player.footY - 40, "#ff6262", 9);
    if (hearts <= 0) finish();
    else toastMessage(hearts + (hearts === 1 ? " HEART LEFT!" : " HEARTS LEFT!"));
  }
  function update(dt) {
    scenery += (state === "running" ? speed : 32) * dt;
    if (state !== "running") return;
    elapsed += dt;
    speed = Math.min(510, 320 + elapsed * 1.6);
    distance += speed * dt;
    player.stride += dt * (speed / 31);
    const nextZone = L.zoneFor(elapsed);
    if (zone !== nextZone) {
      zone = nextZone;
      toastMessage("NEW AREA: " + L.ZONES[zone].label);
      burst(player.x + 15, player.footY - 80, "#ffdf8f", 12);
    }
    nextSpawn -= dt;
    if (nextSpawn <= 0) {
      spawn();
      nextSpawn = C.clamp(1.94 - elapsed / 160, 1.53, 1.94) + Math.random() * .42;
    }
    nextPlatform -= dt;
    if (nextPlatform <= 0) {
      spawnPlatform();
      nextPlatform = 3.5 + Math.random() * 1.3;
    }
    for (const item of objects) item.x -= speed * dt;
    for (const platform of platforms) platform.x -= speed * dt;
    platforms = platforms.filter(p => p.x + p.width >= -35);
    const previousFoot = player.footY;
    const previouslyGrounded = player.grounded;
    if (previouslyGrounded) player.coyote = .10;
    else player.coyote = Math.max(0, player.coyote - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.vy = Math.min(1120, player.vy + 1840 * dt);
    player.footY += player.vy * dt;
    const landing = L.landingSurface(
      platforms, previousFoot, player.footY, player.x, 17, FLOOR
    );
    if (player.vy >= 0 && landing !== null) {
      player.footY = landing;
      player.vy = 0;
      player.grounded = true;
      if (!previouslyGrounded) {
        burst(player.x - 8, player.footY - 2, "#e9d8ae", 6);
        if (player.jumpBuffer > 0) performJump();
      }
    } else {
      player.grounded = false;
    }
    player.slide = Math.max(0, player.slide - dt);
    immunity = Math.max(0, immunity - dt);
    const height = player.slide > 0 ? 31 : 99;
    const hitbox = { x: player.x - 17, y: player.footY - height, w: 34, h: height };
    for (const item of objects) {
      if (item.hit || state !== "running") continue;
      if (item.type === "coin") {
        if (C.intersects(hitbox, { x: item.x - 12, y: item.y - 12, w: 24, h: 24 })) {
          item.hit = true; coins++; effect("coin");
          burst(item.x, item.y, "#ffdf76", 7);
        }
      } else if (item.type === "pothole") {
        if (item.x + 10 < hitbox.x + hitbox.w &&
            item.x + item.width - 10 > hitbox.x && player.footY >= FLOOR - 24) {
          item.hit = true; damage();
        }
      } else {
        if (item.type === "banner" && player.footY < FLOOR - 65) continue;
        const obstacle = item.type === "crate" ?
          { x: item.x + 2, y: FLOOR - 53, w: item.width - 4, h: 53 } :
          { x: item.x + 2, y: FLOOR - 103, w: item.width - 4, h: 64 };
        if (C.intersects(hitbox, obstacle)) { item.hit = true; damage(); }
      }
    }
    objects = objects.filter(function (x) {
      return x.x + x.width > -30 && !(x.type === "coin" && x.hit);
    });
    for (const p of particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 245 * dt; p.life -= dt;
    }
    particles = particles.filter(function (x) { return x.life > 0; });
    score = C.scoreFor(distance, coins);
    hudUpdate();
  }
  function box(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function sceneryDraw() { A.drawWorld(ctx, scenery, zone); }
  function drawObstacle(item) { A.drawObstacle(ctx, item); }
  function runner() {
    A.drawRunner(ctx, {
      x: player.x, footY: player.footY, slide: player.slide,
      immunity, stride: player.stride, grounded: player.grounded,
      shirt: C.OUTFITS[save.outfit].shirt, outfit: save.outfit
    });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    sceneryDraw();
    for (const platform of platforms) A.drawPlatform(ctx, platform, scenery);
    for (const item of objects) drawObstacle(item);
    runner();
    for (const p of particles) {
      ctx.globalAlpha = C.clamp(p.life * 1.6, 0, 1);
      box(p.x, p.y, 5, 5, p.color);
    }
    ctx.globalAlpha = 1;
    if (state === "menu" || state === "locker" || state === "how") {
      ctx.fillStyle = "#fff2d6"; ctx.textAlign = "right"; ctx.font = "bold 15px system-ui";
      ctx.fillText("MORESBY · PAPUA NEW GUINEA", 940, 32);
    }
  }
  async function shareScore() {
    const msg = "I scored " + number(score) + " points in PNG Adventure: Moresby Run! Can you beat me?";
    try {
      if (navigator.share) await navigator.share({ text: msg });
      else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(msg); toastMessage("SCORE COPIED!");
      } else toastMessage(msg);
    } catch (_) {}
  }
  overlay.addEventListener("click", function (event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    const command = target.dataset.action;
    if (command === "start") start();
    else if (command === "menu") menu();
    else if (command === "how") how();
    else if (command === "locker") locker();
    else if (command === "resume") resume();
    else if (command === "end") finish();
    else if (command === "share") shareScore();
    else if (command.startsWith("outfit:")) {
      const result = C.selectOutfit(save, command.slice(7));
      if (!result.ok) { toastMessage(result.reason === "coins" ? "NOT ENOUGH COINS" : "UNKNOWN OUTFIT"); return; }
      save = result.save; persist(); effect("buy"); locker();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (["Space", "ArrowUp", "ArrowDown"].includes(event.code) && state === "running") event.preventDefault();
    if (event.repeat) return;
    if (event.code === "Space" || event.code === "ArrowUp") jump();
    else if (event.code === "ArrowDown") slide();
    else if (event.code === "KeyP" || event.code === "Escape") {
      if (state === "running") pause(); else if (state === "paused") resume();
    }
  });
  document.getElementById("jump").addEventListener("pointerdown", function (e) { e.preventDefault(); jump(); });
  document.getElementById("slide").addEventListener("pointerdown", function (e) { e.preventDefault(); slide(); });
  document.getElementById("pause").addEventListener("click", pause);
  soundButton.addEventListener("click", function () {
    muted = !muted;
    soundButton.textContent = muted ? "♪ SOUND OFF" : "♪ SOUND ON";
    soundButton.setAttribute("aria-pressed", String(!muted));
  });
  window.addEventListener("blur", function () { if (state === "running") pause(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && state === "running") pause();
  });
  function frame(now) {
    const dt = lastFrame ? Math.min(.04, (now - lastFrame) / 1000) : 0;
    lastFrame = now;
    update(dt); draw();
    if (toastDeadline && now > toastDeadline) { toastDeadline = 0; toast.classList.remove("visible"); }
    requestAnimationFrame(frame);
  }
  menu(); requestAnimationFrame(frame);
})();
