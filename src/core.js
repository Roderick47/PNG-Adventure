/* Pure game rules. Browser: PNGameCore; tests: require('../src/core.js'). */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.PNGameCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const OUTFITS = Object.freeze({
    classic: { name: "Moresby Runner", price: 0, symbol: "🏃", shirt: "#e84d47" },
    sea: { name: "Coastal Blue", price: 75, symbol: "🌊", shirt: "#3ca6ee" },
    gold: { name: "Golden Adventurer", price: 180, symbol: "⭐", shirt: "#f7bb3b" }
  });
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
      a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function normalizeSave(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const unlocked = ["classic"];
    if (Array.isArray(data.unlocked)) {
      for (const id of data.unlocked) {
        if (Object.prototype.hasOwnProperty.call(OUTFITS, id) && !unlocked.includes(id)) unlocked.push(id);
      }
    }
    return {
      best: Number.isFinite(data.best) ? clamp(Math.floor(data.best), 0, 1e9) : 0,
      bank: Number.isFinite(data.bank) ? clamp(Math.floor(data.bank), 0, 1e9) : 0,
      unlocked,
      outfit: unlocked.includes(data.outfit) ? data.outfit : "classic"
    };
  }
  function finishSave(raw, score, collected) {
    const save = normalizeSave(raw);
    save.best = Math.max(save.best, Math.max(0, Math.floor(Number(score) || 0)));
    save.bank = clamp(save.bank + Math.max(0, Math.floor(Number(collected) || 0)), 0, 1e9);
    return save;
  }
  function selectOutfit(raw, id) {
    const save = normalizeSave(raw);
    if (!Object.prototype.hasOwnProperty.call(OUTFITS, id)) return { save, ok: false, reason: "unknown" };
    if (!save.unlocked.includes(id)) {
      if (save.bank < OUTFITS[id].price) return { save, ok: false, reason: "coins" };
      save.bank -= OUTFITS[id].price;
      save.unlocked.push(id);
    }
    save.outfit = id;
    return { save, ok: true };
  }
  function obstacleKind(elapsed, random) {
    const possible = elapsed < 9 ? ["crate", "pothole"] : ["crate", "pothole", "banner"];
    return possible[Math.min(possible.length - 1, Math.floor(clamp(random, 0, 0.999999) * possible.length))];
  }
  function scoreFor(distance, collected) {
    return Math.floor(Math.max(0, distance) / 3.5) + Math.max(0, collected) * 10;
  }
  return { OUTFITS, clamp, intersects, normalizeSave, finishSave, selectOutfit, obstacleKind, scoreFor };
});
