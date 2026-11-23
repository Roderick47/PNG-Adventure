/* Coastal Village Phase 1 — handcrafted platform layout + portable collision rules. */
(function (root, factory) {
  const API = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  if (root) root.CoastLevel = API;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const TILE = 32, WORLD_WIDTH = 3392, FLOOR = 432, WATER_Y = 471;
  // Walkable pieces can be seen from below. Every platform is one-way.
  const platforms = [
    {x:0,y:FLOOR,w:490,kind:"shore"},
    {x:535,y:402,w:204,kind:"boardwalk"},
    {x:780,y:366,w:180,kind:"boardwalk"},
    {x:996,y:418,w:220,kind:"boardwalk"},
    {x:1250,y:370,w:188,kind:"boardwalk"},
    {x:1490,y:315,w:185,kind:"boardwalk"},
    {x:1712,y:390,w:220,kind:"boardwalk"},
    {x:1975,y:345,w:170,kind:"boardwalk"},
    {x:2200,y:405,w:234,kind:"boardwalk"},
    {x:2475,y:350,w:190,kind:"boardwalk"},
    {x:2705,y:316,w:194,kind:"boardwalk"},
    {x:2930,y:399,w:462,kind:"shore"}
  ];
  // Short optional upper routes — ordinary running/jumping, not auto-scroll.
  const upper = [
    {x:321,y:337,w:174,kind:"roof"},
    {x:1077,y:310,w:125,kind:"roof"},
    {x:1610,y:248,w:140,kind:"roof"},
    {x:2304,y:292,w:115,kind:"roof"}
  ];
  const surfaces = platforms.concat(upper);
  const ladders = [
    {x:1160,y:310,h:108},
    {x:1642,y:248,h:67}
  ];
  const houses = [
    {x:112,y:313,scale:1.05,tint:0},
    {x:1060,y:305,scale:.92,tint:1},
    {x:1532,y:244,scale:1.02,tint:2},
    {x:2270,y:298,scale:1,tint:0},
    {x:2806,y:252,scale:1.02,tint:1}
  ];
  const coinGroups = [
    [200,390],[290,390],[372,296],[425,296],
    [575,357],[630,357],[690,357],[820,322],[884,322],
    [1070,374],[1145,274],[1300,327],[1365,327],
    [1540,268],[1620,211],[1690,211],[1780,345],[1860,345],
    [2040,306],[2090,306],[2315,253],[2380,253],
    [2525,310],[2615,310],[2760,277],[2830,277],
    [3030,358],[3160,358],[3260,358]
  ];
  const crabs = [
    {x:302,min:245,max:453,y:FLOOR-19},
    {x:1040,min:1004,max:1180,y:418-19},
    {x:1826,min:1740,max:1907,y:390-19},
    {x:3010,min:2970,max:3200,y:399-19}
  ];
  // Fish leap from ocean between platforms. Their visible ripples telegraph jumps.
  const fish = [
    {x:503,phase:0.4}, {x:760,phase:1.35},
    {x:1231,phase:0.2},{x:1461,phase:1.15},
    {x:1947,phase:0.65},{x:2453,phase:1.55},{x:2689,phase:0.95}
  ];
  const checkpoint = {x:1727,y:350};
  const finish = {x:3250,y:399};
  function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
  function overlap(a,b){return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;}
  // Fixed-width player. Collision on descending top crosses only.
  function landing(previousFeet,nextFeet,x,width,items=surfaces){
    if(nextFeet < previousFeet) return null;
    let best=null;
    for(const p of items){
      if(x+width/2<=p.x || x-width/2 >=p.x+p.w)continue;
      if(previousFeet > p.y+3 || nextFeet < p.y)continue;
      if(best===null || p.y<best.y)best=p;
    }
    return best;
  }
  function nearbyLadder(x,feet){
    return ladders.find(l=>Math.abs(x-(l.x+8)) < 22 && feet>=l.y-15 && feet<=l.y+l.h+15) || null;
  }
  function fishPosition(f,t){
    const period=2.9, q=((t+f.phase)%period+period)%period;
    if(q<1.25)return {x:f.x,y:WATER_Y+8,active:false,warning:q>.75};
    const u=(q-1.25)/1.16;
    if(u>1)return {x:f.x,y:WATER_Y+8,active:false,warning:false};
    return {x:f.x+12*Math.sin(u*Math.PI),y:WATER_Y+8-126*4*u*(1-u),active:true,warning:false};
  }
  return {TILE,WORLD_WIDTH,FLOOR,WATER_Y,platforms,upper,surfaces,ladders,houses,coinGroups,crabs,fish,checkpoint,finish,clamp,overlap,landing,nearbyLadder,fishPosition};
});
