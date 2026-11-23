const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

test("game boots, jumps, scores and pauses with the art renderer loaded", () => {
  const root = path.join(__dirname, "..");
  const source = name => fs.readFileSync(path.join(root, "src", name), "utf8");
  const canvasContext = new Proxy({}, {
    get(_target, key) {
      if (key === "createLinearGradient") return () => ({ addColorStop() {} });
      return () => {};
    },
    set() { return true; }
  });
  const listeners = {};
  const elements = {};
  const element = id => elements[id] || (elements[id] = {
    textContent: "", innerHTML: "",
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(event, fn) { listeners[id + ":" + event] = fn; },
    setAttribute() {},
    getContext() { return canvasContext; }
  });
  const document = {
    hidden: false,
    getElementById: element,
    addEventListener(event, fn) { listeners["document:" + event] = fn; }
  };
  const window = { addEventListener() {} };
  let animation = null;
  const context = vm.createContext({
    window, document,
    localStorage: { getItem() { return null; }, setItem() {} },
    performance: { now() { return 0; } },
    navigator: {},
    requestAnimationFrame(fn) { animation = fn; }
  });
  vm.runInContext(source("core.js"), context);
  vm.runInContext(source("level.js"), context);
  window.PNGameCore = context.PNGameCore;
  window.PNLevel = context.PNLevel;
  vm.runInContext(source("art.js"), context);
  let runnerPose = null;
  const originalDrawRunner = window.PNArt.drawRunner;
  window.PNArt.drawRunner = (ctx, pose) => {
    runnerPose = pose;
    originalDrawRunner(ctx, pose);
  };
  vm.runInContext(source("game.js"), context);
  assert.match(elements.overlay.innerHTML, /ORIGINAL RUNNER/);
  assert.match(elements.overlay.innerHTML, /PLAY STILT VILLAGE/);

  listeners["overlay:click"]({
    target: { closest() { return { dataset: { action: "start" } }; } }
  });
  let ms = 0;
  for (let i = 0; i < 34; i++) { ms += 16; animation(ms); }
  assert.ok(Number(elements.score.textContent.replaceAll(",", "")) > 0);
  assert.equal(elements.area.textContent, "GORDONS MARKET");
  assert.equal(runnerPose.grounded, true);

  listeners["document:keydown"]({ code: "Space", repeat: false, preventDefault() {} });
  for (let i = 0; i < 5; i++) { ms += 16; animation(ms); }
  assert.ok(runnerPose.footY < 431, "jump takes the character off the ground");

  listeners["document:keydown"]({ code: "KeyP", repeat: false, preventDefault() {} });
  assert.match(elements.overlay.innerHTML, /PAUSED/);
  listeners["document:keydown"]({ code: "KeyP", repeat: false, preventDefault() {} });
  assert.equal(elements.overlay.innerHTML, "");
});
