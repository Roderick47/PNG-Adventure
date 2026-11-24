/* Phase 2.4.5 — suspended fishing-net decks and climbable net lanes.
 * Gameplay collisions stay flat; sway and landing sag are cosmetic.
 * Existing ladders, static surfaces, and movement physics are not mutated.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CoastNets=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  // Suspended above permanent boardwalks; safe to fall if a jump is missed.
  const DECKS=Object.freeze([
    Object.freeze({id:"net-first-crossing",x:823,y:306,w:104}),
    Object.freeze({id:"net-second-crossing",x:2020,y:283,w:102})
  ]);
  // Tops meet existing rooftops, bottoms meet existing boardwalks.
  const CLIMBS=Object.freeze([
    Object.freeze({id:"net-climb-middle",x:1110,y:310,h:108,w:30}),
    Object.freeze({id:"net-climb-late",x:2322,y:292,h:113,w:30})
  ]);
  function install(manager,decks=DECKS){
    if(!manager||typeof manager.register!=="function")throw new TypeError("Platform registry required");
    return decks.map(d=>{
      if(!d||typeof d.id!=="string"||!Number.isFinite(d.x)||!Number.isFinite(d.y)||
        !Number.isFinite(d.w)||d.w<=0)throw new RangeError("Invalid suspended net");
      return manager.register({
        id:d.id,type:"fishing-net",x:d.x,y:d.y,w:d.w,h:12,pulse:0,
        update(dt,p){p.pulse=Math.max(0,p.pulse-dt);},
        onLand(_player,p){p.pulse=.42;},
        onReset(p){p.pulse=0;}
      });
    });
  }
  // Controller expects a ladder with an x+8 grip centre and a y/h range.
  function nearbyClimb(x,feet,lanes=CLIMBS){
    for(const n of lanes){
      if(Math.abs(x-(n.x+n.w/2))<22&&feet>=n.y-15&&feet<=n.y+n.h+15){
        return {id:n.id,x:n.x+n.w/2-8,y:n.y,h:n.h,kind:"net"};
      }
    }
    return null;
  }
  function withClimbs(level,lanes=CLIMBS){
    if(!level||typeof level.nearbyLadder!=="function")throw new TypeError("Level ladder API required");
    return {...level,nearbyLadder(x,feet){
      return level.nearbyLadder(x,feet)||nearbyClimb(x,feet,lanes);
    }};
  }
  return Object.freeze({DECKS,CLIMBS,install,nearbyClimb,withClimbs});
});
