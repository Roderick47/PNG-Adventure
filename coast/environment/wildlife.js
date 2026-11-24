/* Phase 2.5.4 — lightweight, harmless village ambience.
 * Birds, decorative underwater fish and distant veranda silhouettes are
 * draw-only. No player, collision, enemy or platform state is ever touched.
 * World-coordinate culling bounds work to the visible camera window.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CoastWildlife=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  const WIDTH=960;
  const BIRDS=Object.freeze([
    Object.freeze({x:180,y:119,phase:0,dir:1}),
    Object.freeze({x:565,y:151,phase:1.4,dir:-1}),
    Object.freeze({x:1180,y:112,phase:2.1,dir:1}),
    Object.freeze({x:1880,y:143,phase:3.2,dir:-1}),
    Object.freeze({x:2600,y:105,phase:4.6,dir:1})
  ]);
  const FISH=Object.freeze([
    Object.freeze({x:392,y:510,phase:.3}),
    Object.freeze({x:860,y:517,phase:1.8}),
    Object.freeze({x:1560,y:506,phase:2.3}),
    Object.freeze({x:2150,y:518,phase:3.7}),
    Object.freeze({x:2910,y:510,phase:4.2})
  ]);
  const VILLAGERS=Object.freeze([
    Object.freeze({house:0,offset:82,phase:.5}),
    Object.freeze({house:2,offset:90,phase:1.7}),
    Object.freeze({house:4,offset:61,phase:2.7})
  ]);
  function rect(g,x,y,w,h,color){
    if(w<=0||h<=0)return;
    g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  }
  function birdPosition(b,time,reducedMotion=false){
    const t=reducedMotion?0:Number.isFinite(time)?time:0;
    const d=b.dir||1;
    return {x:b.x+d*42*Math.sin(t*.23+b.phase),y:b.y+Math.sin(t*.6+b.phase)*4};
  }
  function fishPosition(f,time,reducedMotion=false){
    const t=reducedMotion?0:Number.isFinite(time)?time:0;
    return {x:f.x+Math.sin(t*.45+f.phase)*19,y:f.y+Math.sin(t*.9+f.phase)*3};
  }
  function draw(g,camera,time,level,options={}){
    if(!g||typeof g.fillRect!=="function")throw new TypeError("Canvas context required");
    const x=Number.isFinite(camera)?camera:0;
    const t=Number.isFinite(time)?time:0;
    const min=x-90,max=x+WIDTH+90;
    const reduced=options.reducedMotion===true;
    // High, pale birds deliberately distinct from attacking crabs/leaping fish.
    for(const b of BIRDS){
      if(b.x+60<min||b.x-60>max)continue;
      const p=birdPosition(b,t,reduced);
      const flap=reduced?0:Math.round(Math.sin(t*3.5+b.phase)*3);
      rect(g,p.x-12,p.y+flap,10,2,"#f3e5c9");
      rect(g,p.x-3,p.y+1,7,3,"#e8dbc4");
      rect(g,p.x+4,p.y-flap,10,2,"#f3e5c9");
      rect(g,p.x+11,p.y-2-flap,3,2,"#e8dbc4");
    }
    // Small submerged silhouettes only, below the actual water hazard line.
    for(const f of FISH){
      if(f.x+27<min||f.x-27>max)continue;
      const p=fishPosition(f,t,reduced);
      rect(g,p.x-7,p.y,15,4,"#4eabb0");
      rect(g,p.x+8,p.y-2,5,8,"#57b9b7");
      rect(g,p.x-4,p.y+1,3,2,"#a5d4c8");
    }
    const houses=level&&Array.isArray(level.houses)?level.houses:[];
    // Decorative, tiny, muted veranda figures; they cannot be interacted with.
    for(const v of VILLAGERS){
      const h=houses[v.house];
      if(!h)continue;
      const scale=Number.isFinite(h.scale)?h.scale:1;
      const vx=h.x+v.offset*scale,vy=h.y+82*scale;
      if(vx+12<min||vx-12>max)continue;
      const nod=reduced?0:Math.round(Math.sin(t*1.05+v.phase)*2);
      rect(g,vx-3,vy-17+nod,7,7,"#9a745c");
      rect(g,vx-5,vy-10+nod,11,11,"#4f7772");
      rect(g,vx-4,vy+1+nod,3,7,"#624b43");
      rect(g,vx+3,vy+1+nod,3,7,"#624b43");
    }
  }
  return Object.freeze({WIDTH,BIRDS,FISH,VILLAGERS,birdPosition,fishPosition,draw});
});
