/* Phase 2.5.2 — purely decorative water, foam, wakes, and bounded splashes.
 * This module never changes physics, hazard positions, or collision surfaces.
 * World-coordinate rendering avoids camera-relative wake drift.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CoastWater=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  const VIEW_WIDTH=960,MAX_SPLASHES=24,MAX_AGE=.65;
  function bounded(n,fallback=0){return Number.isFinite(n)?n:fallback;}
  function pixel(ctx,x,y,w,h,color){
    if(w<=0||h<=0)return;
    ctx.fillStyle=color;
    ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  }
  function create(){
    const splashes=[];
    function splash(x,y,kind="water"){
      if(!Number.isFinite(x)||!Number.isFinite(y))return;
      if(splashes.length>=MAX_SPLASHES)splashes.shift();
      splashes.push({x,y,kind,age:0});
    }
    function advance(dt){
      const step=Math.max(0,Math.min(.1,bounded(dt)));
      for(let i=splashes.length-1;i>=0;i--){
        splashes[i].age+=step;
        if(splashes[i].age>=MAX_AGE)splashes.splice(i,1);
      }
    }
    function reset(){splashes.length=0;}
    return Object.freeze({splash,advance,reset,count:()=>splashes.length,snapshot:()=>splashes.map(s=>({...s}))});
  }
  function draw(ctx,camera,time,waterY,world,options={}){
    if(!ctx||typeof ctx.fillRect!=="function")throw new TypeError("Canvas context required");
    const start=bounded(camera),t=options.reducedMotion?0:bounded(time);
    const y=bounded(waterY,471);
    const scene=world||{};
    const min=start-60,max=start+VIEW_WIDTH+60;
    // All geometry is world-space; the canvas is expected to be translated
    // by -camera. Ocean paint ends below the gameplay water danger line.
    pixel(ctx,min,y+2,max-min,62,"#348e9f");
    pixel(ctx,min,y+2,max-min,4,"#78bcb5");
    // Short, semi-transparent wave bands with bounded work.
    for(let i=0;i<12;i++){
      const x=min+i*98;
      const wobble=options.reducedMotion?0:Math.sin(t*1.7+i*.9)*3;
      const v=y+10+(i%3)*15+wobble;
      pixel(ctx,x+9,v,51,2,i%2?"#71c6bf":"#a0d7cb");
      pixel(ctx,x+48,v+8,26,2,"#5bb4b4");
    }
    // Gentle sky-coloured reflection shards, all below the surface.
    for(let i=0;i<8;i++){
      const x=min+i*150+40;
      const drift=options.reducedMotion?0:Math.sin(t*.8+i)*6;
      pixel(ctx,x+drift,y+8+(i%3)*8,22,2,"#d0ddba");
    }
    // Subtle water foam around existing stilt posts. Does not imply a
    // new safe surface and never covers the platforms themselves.
    for(const s of scene.surfaces||[]){
      if(s.kind==="shore"||s.kind==="roof")continue;
      if(s.x+s.w<min||s.x>max)continue;
      for(let sx=s.x+24;sx<s.x+s.w;sx+=100){
        if(sx<min||sx>max)continue;
        const phase=options.reducedMotion?0:Math.sin(t*2+sx*.03)*3;
        pixel(ctx,sx-10,y+5+phase,18,2,"#b7e0d1");
        pixel(ctx,sx+2,y+10+phase,11,2,"#89d5ce");
      }
    }
    // Canoe hulls are rendered separately by the sprite kit; the wake here
    // follows the actual platform trajectory and turns with its direction.
    for(const c of scene.canoes||[]){
      if(c.x+c.w<min||c.x>max)continue;
      const tail=c.direction<0?c.x+c.w+5:c.x-38;
      const shimmer=options.reducedMotion?0:Math.sin(t*6+c.x*.05)*3;
      pixel(ctx,tail,y+8+shimmer,31,2,"#c7eee0");
      pixel(ctx,tail+8,y+14+shimmer,22,2,"#7ccbc8");
      pixel(ctx,c.x+10,y+24,c.w-20,2,"#67bcbc");
    }
    for(const s of scene.splashes||[]){
      if(s.x<min||s.x>max||s.age>=MAX_AGE)continue;
      const q=s.age/MAX_AGE;
      const spread=7+q*25;
      const up=options.reducedMotion?0:Math.sin(q*Math.PI)*9;
      const sy=Math.max(y+3,s.y-up);
      pixel(ctx,s.x-spread,sy,spread*.75,2,"#d2f2db");
      pixel(ctx,s.x+spread*.25,sy,spread*.75,2,"#d2f2db");
      if(q<.5){
        pixel(ctx,s.x-2,sy-6,4,4,"#f5f0d3");
      }
    }
  }
  return Object.freeze({VIEW_WIDTH,MAX_SPLASHES,MAX_AGE,create,draw});
});
