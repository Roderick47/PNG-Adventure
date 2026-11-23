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
      actionButton("▶ START RUN", "start", "primary") +
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
    speed = Math.min(520, 320 + elapsed * 2);
    distance += speed * dt;
    player.stride += dt * (speed / 30);
    if (player.rise > 0 || player.velocity > 0) {
      player.rise += player.velocity * dt;
      player.velocity -= 1900 * dt;
      if (player.rise <= 0) { player.rise = 0; player.velocity = 0; }
    }
    player.slide = Math.max(0, player.slide - dt);
    immunity = Math.max(0, immunity - dt);
    nextSpawn -= dt;
    if (nextSpawn <= 0) {
      spawn();
      nextSpawn = C.clamp(1.86 - elapsed / 150, 1.48, 1.86) + Math.random() * .45;
    }
    const height = player.slide > 0 ? 31 : 76;
    const hitbox = { x: player.x - 20, y: FLOOR - player.rise - height, w: 40, h: height };
    for (const item of objects) {
      item.x -= speed * dt;
      if (item.hit || state !== "running") continue;
      if (item.type === "coin") {
        if (C.intersects(hitbox, { x: item.x - 11, y: item.y - 11, w: 22, h: 22 })) {
          item.hit = true; coins++; effect("coin");
          burst(item.x, item.y, "#ffdf76", 5);
        }
      } else if (item.type === "pothole") {
        if (item.x + 10 < hitbox.x + hitbox.w &&
            item.x + item.width - 10 > hitbox.x && player.rise < 28) {
          item.hit = true; damage();
        }
      } else {
        const obstacle = item.type === "crate" ?
          { x: item.x + 2, y: FLOOR - 48, w: item.width - 4, h: 48 } :
          { x: item.x + 2, y: FLOOR - 101, w: item.width - 4, h: 62 };
        if (C.intersects(hitbox, obstacle)) { item.hit = true; damage(); }
      }
    }
    objects = objects.filter(function (x) {
      return x.x + x.width > -30 && !(x.type === "coin" && x.hit);
    });
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 245 * dt; p.life -= dt; }
    particles = particles.filter(function (x) { return x.life > 0; });
    score = C.scoreFor(distance, coins);
    hudUpdate();
  }
  function box(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function oval(x, y, rx, ry, color) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
  function line(x1, y1, x2, y2, width, color) {
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function polygon(points, color) {
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  function cloud(x, y, scale) {
    oval(x, y, 41 * scale, 17 * scale, "#f9fffbdb");
    oval(x - 22 * scale, y - 11 * scale, 27 * scale, 20 * scale, "#f9fffbdb");
    oval(x + 18 * scale, y - 16 * scale, 31 * scale, 23 * scale, "#f9fffbdb");
  }
  function palm(x, y, scale) {
    line(x, y, x + 7 * scale, y - 95 * scale, 10 * scale, "#704b39");
    const tx = x + 7 * scale, ty = y - 95 * scale;
    for (let a = 0; a < 6; a++) {
      const ang = -Math.PI + a * Math.PI / 5;
      line(tx, ty, tx + Math.cos(ang) * 57 * scale, ty + Math.sin(ang) * 26 * scale, 8 * scale, "#2c8a6b");
      line(tx, ty, tx + Math.cos(ang) * 45 * scale, ty + Math.sin(ang) * 33 * scale, 4 * scale, "#64b678");
    }
  }
  function hut(x, y, color) {
    box(x + 6, y + 27, 102, 78, color);
    polygon([[x, y + 30], [x + 57, y - 9], [x + 116, y + 30]], "#b65c45");
    polygon([[x + 15, y + 26], [x + 57, y - 2], [x + 101, y + 26]], "#f1c26d");
    box(x + 19, y + 55, 24, 26, "#294e5a");
    box(x + 66, y + 55, 29, 50, "#214757");
    box(x + 70, y + 58, 21, 43, "#876545");
  }
  function sceneryDraw() {
    const sky = ctx.createLinearGradient(0, 0, 0, FLOOR);
    sky.addColorStop(0, "#75bfd9"); sky.addColorStop(.68, "#b9e1c9"); sky.addColorStop(1, "#e5d9a8");
    box(0, 0, W, H, sky);
    oval(784, 102, 51, 51, "#ffdb91");
    const clouds = (scenery * .07) % 1200;
    cloud(190 - clouds, 95, 1); cloud(820 - clouds, 150, .77);
    cloud(1390 - clouds, 80, .9);
    polygon([[0, 325], [120, 244], [213, 290], [375, 177], [514, 296], [632, 215], [760, 310], [880, 230], [960, 302], [960, 443], [0, 443]], "#6e9d92");
    polygon([[0, 362], [160, 291], [307, 363], [467, 266], [646, 365], [790, 274], [960, 333], [960, 446], [0, 446]], "#4d8e86");
    const shift = (scenery * .26) % 280;
    for (let i = -1; i < 6; i++) {
      const x = i * 280 - shift;
      hut(x + 26, 305, i % 2 ? "#d89d64" : "#e7c18e");
      palm(x + 212, 421, .84);
    }
    box(0, FLOOR - 2, W, H - FLOOR + 2, "#8d6850");
    box(0, FLOOR + 11, W, 96, "#6c7775");
    box(0, FLOOR + 13, W, 7, "#c9b39a");
    const dash = (scenery * .95) % 120;
    for (let i = -1; i < 10; i++) box(i * 120 - dash, FLOOR + 65, 67, 6, "#dfc999");
    box(0, FLOOR + 103, W, H - FLOOR - 103, "#526560");
    const grit = (scenery * .7) % 55;
    for (let i = -1; i < 21; i++) box(i * 55 - grit, FLOOR + 4, 15, 3, "#b8a08e");
  }
  function drawCoin(item) {
    oval(item.x, item.y + 2, 13, 14, "#a76f2b");
    oval(item.x, item.y, 12, 13, "#ffd768");
    oval(item.x, item.y, 8, 9, "#f3ad38");
    line(item.x - 3, item.y - 6, item.x + 3, item.y + 5, 2, "#ffec9b");
  }
  function drawObstacle(item) {
    const x = item.x;
    if (item.type === "coin") { drawCoin(item); return; }
    if (item.type === "pothole") {
      oval(x + item.width / 2, FLOOR + 12, item.width / 2, 17, "#363b3d");
      oval(x + item.width / 2, FLOOR + 14, item.width / 2 - 13, 9, "#171e27");
    } else if (item.type === "crate") {
      box(x, FLOOR - 49, 52, 49, "#91532e");
      box(x + 5, FLOOR - 44, 42, 39, "#c17d42");
      line(x + 5, FLOOR - 44, x + 47, FLOOR - 5, 6, "#89522e");
      line(x + 47, FLOOR - 44, x + 5, FLOOR - 5, 6, "#89522e");
      box(x + 4, FLOOR - 49, 44, 5, "#dca365");
    } else {
      line(x + 8, FLOOR - 140, x + 8, FLOOR - 102, 5, "#5c5040");
      line(x + 82, FLOOR - 140, x + 82, FLOOR - 102, 5, "#5c5040");
      box(x, FLOOR - 103, 90, 64, "#a5483e");
      box(x + 5, FLOOR - 98, 80, 53, "#f3c56b");
      ctx.fillStyle = "#67432e"; ctx.font = "900 14px system-ui"; ctx.textAlign = "center";
      ctx.fillText("MARKET", x + 45, FLOOR - 70);
    }
  }
  function runner() {
    if (immunity > 0 && Math.floor(immunity * 10) % 2 === 0) return;
    const x = player.x, y = FLOOR - player.rise;
    oval(x, FLOOR + 5, player.rise ? 20 : 27, 7, "#273c4099");
    const shirt = C.OUTFITS[save.outfit].shirt;
    if (player.slide > 0) {
      box(x - 30, y - 30, 57, 25, shirt);
      oval(x + 18, y - 29, 16, 16, "#865034");
      box(x - 36, y - 13, 24, 10, "#283c59");
      box(x + 18, y - 13, 25, 10, "#283c59");
      return;
    }
    const swing = Math.sin(player.stride) * 12;
    line(x - 12, y - 33, x - 15 + swing, y - 4, 13, "#284258");
    line(x + 10, y - 33, x + 9 - swing, y - 4, 13, "#284258");
    box(x - 24 + swing, y - 7, 24, 7, "#302a32");
    box(x + 2 - swing, y - 7, 24, 7, "#302a32");
    box(x - 20, y - 74, 40, 42, shirt);
    line(x - 16, y - 67, x - 26 - swing, y - 44, 11, "#895337");
    line(x + 17, y - 67, x + 27 + swing, y - 42, 11, "#895337");
    oval(x, y - 87, 19, 22, "#a66a43");
    oval(x + 7, y - 88, 2.5, 3, "#1f242b");
    oval(x - 4, y - 108, 18, 8, "#262527");
    box(x - 17, y - 112, 31, 10, "#282729");
    box(x - 22, y - 74, 44, 8, "#f4d778");
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    sceneryDraw();
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
