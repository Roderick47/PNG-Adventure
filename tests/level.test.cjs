const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../src/level.js");

test("areas change at 35 and 70 seconds", () => {
  assert.equal(L.zoneFor(0), 0);
  assert.equal(L.zoneFor(34.9), 0);
  assert.equal(L.zoneFor(35), 1);
  assert.equal(L.zoneFor(70), 2);
  assert.equal(L.zoneFor(999), 2);
});

test("platform elevations are attainable by a regular jump", () => {
  for (const r of [0, .45, .95]) {
    const p = L.makePlatform(980, 14, r);
    assert.ok(p.elevation >= 70 && p.elevation <= 118);
    assert.ok(p.width >= 220);
    assert.equal(p.y, 431 - p.elevation);
  }
});

test("landing only when descending over a platform", () => {
  const platforms = [{ x: 100, width: 220, y: 333 }];
  assert.equal(L.landingSurface(platforms, 330, 339, 180, 18, 431), 333);
  assert.equal(L.landingSurface(platforms, 339, 330, 180, 18, 431), null);
  assert.equal(L.landingSurface(platforms, 340, 350, 180, 18, 431), null);
  assert.equal(L.landingSurface(platforms, 330, 339, 380, 18, 431), null);
});

test("floor always catches a falling player", () => {
  assert.equal(L.landingSurface([], 425, 435, 183, 18, 431), 431);
});

test("higher surface takes precedence over floor when crossed", () => {
  const platforms = [{ x: 100, width: 220, y: 350 }];
  assert.equal(L.landingSurface(platforms, 340, 440, 183, 18, 431), 350);
});
