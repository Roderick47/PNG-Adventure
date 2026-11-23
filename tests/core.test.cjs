const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../src/core.js");

test("default save has one free outfit and no banked currency", () => {
  assert.deepEqual(core.normalizeSave(null), {
    best: 0, bank: 0, unlocked: ["classic"], outfit: "classic"
  });
});

test("malformed saves cannot grant invalid outfits or negative coins", () => {
  const save = core.normalizeSave({
    best: -10, bank: -500, unlocked: ["hacker", "classic", "classic"], outfit: "hacker"
  });
  assert.equal(save.best, 0);
  assert.equal(save.bank, 0);
  assert.deepEqual(save.unlocked, ["classic"]);
  assert.equal(save.outfit, "classic");
});

test("run earnings persist and update only personal best", () => {
  let save = core.finishSave(null, 600, 8);
  assert.equal(save.bank, 8);
  assert.equal(save.best, 600);
  save = core.finishSave(save, 300, 3);
  assert.equal(save.best, 600);
  assert.equal(save.bank, 11);
});

test("cosmetics require enough earned coins and are purchased once", () => {
  let save = core.normalizeSave({ bank: 74 });
  let result = core.selectOutfit(save, "sea");
  assert.equal(result.ok, false);
  assert.equal(result.save.bank, 74);
  save.bank = 110;
  result = core.selectOutfit(save, "sea");
  assert.equal(result.ok, true);
  assert.equal(result.save.bank, 35);
  assert.equal(result.save.outfit, "sea");
  result = core.selectOutfit(result.save, "sea");
  assert.equal(result.save.bank, 35);
  assert.equal(result.ok, true);
});

test("unknown cosmetics fail closed", () => {
  const result = core.selectOutfit(null, "__proto__");
  assert.equal(result.ok, false);
});

test("hit boxes only collide on overlap", () => {
  assert.equal(core.intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 10, h: 10 }), true);
  assert.equal(core.intersects({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 1, w: 10, h: 10 }), false);
});

test("early hazards have no banners; late hazards include them", () => {
  assert.equal(core.obstacleKind(0, .99), "pothole");
  assert.equal(core.obstacleKind(12, .99), "banner");
});

test("scores are nonnegative and coins add ten points each", () => {
  assert.equal(core.scoreFor(350, 2), 120);
  assert.equal(core.scoreFor(-500, -1), 0);
});
