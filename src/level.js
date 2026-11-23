/* Pure level generation and landing rules, no browser dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.PNLevel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const ZONES = Object.freeze([
    { label: "GORDONS MARKET", subtitle: "Market day" },
    { label: "KOKI WATERFRONT", subtitle: "Coastal road" },
    { label: "HIGHLANDS TRACK", subtitle: "Mountain trail" }
  ]);
  function zoneFor(seconds) {
    return Math.min(ZONES.length - 1, Math.max(0, Math.floor(seconds / 35)));
  }
  function makePlatform(x, seconds, randomness) {
    const r = Math.max(0, Math.min(.99999, Number(randomness) || 0));
    const heights = [70, 94, 118];
    const elevation = heights[Math.floor(r * heights.length)];
    return {
      x: x,
      y: 431 - elevation,
      width: 220 + Math.floor((1 - r) * 70),
      elevation: elevation,
      type: zoneFor(seconds) === 2 ? "rock" : zoneFor(seconds) === 1 ? "pier" : "market"
    };
  }
  // One-way platforms: land only when descending through the top.
  function landingSurface(platforms, previousFoot, nextFoot, centerX, halfWidth, floorY) {
    if (nextFoot < previousFoot) return null;
    let surface = previousFoot <= floorY + 2 && nextFoot >= floorY ? floorY : null;
    for (const p of platforms) {
      if (centerX + halfWidth <= p.x || centerX - halfWidth >= p.x + p.width) continue;
      if (previousFoot > p.y + 3 || nextFoot < p.y) continue;
      surface = surface === null ? p.y : Math.min(surface, p.y);
    }
    return surface;
  }
  return { ZONES, zoneFor, makePlatform, landingSurface };
});
