/* Phase 2.4.3: reversible coastal canoe ferries.
 * Collision decks move horizontally; animated hull bob and wake are visual only.
 * No dependency on DOM, Canvas or timers. All motion is driven by physics dt.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CoastCanoes=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  // Deck top sits above the waterline (471px); hull sits below deck.
  // All crossings are optional. The original jumping route stays intact.
  const ROUTES=Object.freeze([
    Object.freeze({id:"canoe-east-jetty",minX:437,maxX:557,y:441,w:108,speed:51,phase:0}),
    Object.freeze({id:"canoe-fish-landing",minX:1893,maxX:2025,y:446,w:106,speed:48,phase:.34}),
    Object.freeze({id:"canoe-far-lagoon",minX:2395,maxX:2545,y:443,w:112,speed:55,phase:.65})
  ]);
  function triangle(t){
    const u=((t%2)+2)%2;
    return u<=1?u:2-u;
  }
  function position(route,elapsed){
    if(!route||!Number.isFinite(elapsed)||elapsed<0)throw new RangeError("Invalid canoe time");
    const span=route.maxX-route.minX;
    if(!(span>0)||!(route.speed>0))throw new RangeError("Invalid canoe route");
    const progress=route.phase+elapsed*route.speed/span;
    return route.minX+span*triangle(progress);
  }
  function install(manager,routes=ROUTES){
    if(!manager||typeof manager.register!=="function")throw new TypeError("Platform registry required");
    const registered=[];
    for(const route of routes){
      if(!route.id||!Number.isFinite(route.y)||!Number.isFinite(route.w)||route.w<=0||
        !Number.isFinite(route.minX)||!Number.isFinite(route.maxX)||!Number.isFinite(route.speed)||
        !Number.isFinite(route.phase)||route.maxX<=route.minX||route.speed<=0)
        throw new RangeError("Invalid canoe route");
      const state=manager.register({
        id:route.id,type:"canoe",x:position(route,0),y:route.y,w:route.w,h:24,
        elapsed:0,direction:route.phase<1?1:-1,
        update(dt,p){
          p.elapsed+=dt;
          const next=position(route,p.elapsed);
          p.direction=next>=p.x?1:-1;
          p.x=next;
        },
        onReset(p){
          p.elapsed=0;
          p.direction=route.phase<1?1:-1;
          p.x=position(route,0);
        }
      });
      registered.push(state);
    }
    return registered;
  }
  return Object.freeze({ROUTES,triangle,position,install});
});
