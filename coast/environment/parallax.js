/* Phase 2.5.1 — deterministic Canvas parallax and coastal atmosphere.
 * Visuals only: never reads/mutates player, collision, enemy or level state.
 * Constant-cost view-local tile loops prevent work growing with world width.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CoastParallax=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  const WIDTH=960,HEIGHT=540,HORIZON=457;
  const LAYERS=Object.freeze({
    clouds:Object.freeze({speed:.035,spacing:238}),
    farIslands:Object.freeze({speed:.10,spacing:344}),
    nearIslands:Object.freeze({speed:.22,spacing:252}),
    vegetation:Object.freeze({speed:.40,spacing:330})
  });
  function normalize(v){return Number.isFinite(v)?v:0;}
  function offset(camera,speed,spacing){
    const shift=normalize(camera)*speed;
    return ((shift%spacing)+spacing)%spacing;
  }
  // Deliberately bounded to screen space, not the complete 3392px world.
  function repeat(g,camera,layer,fn){
    const {speed,spacing}=layer;
    const shift=offset(camera,speed,spacing);
    const count=Math.ceil(WIDTH/spacing)+3;
    for(let i=-1;i<count-1;i++)fn(i*spacing-shift,i);
  }
  function block(g,x,y,w,h,color){
    if(w<=0||h<=0)return;
    g.fillStyle=color;
    g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  }
  function ridge(g,x,y,width,height,color){
    // Pixelated hill silhouettes using stepped columns, not smooth polygons.
    const step=16;
    for(let i=0;i<width;i+=step){
      const u=(i+step/2)/width;
      const bell=Math.max(0,1-Math.pow(2*u-1,2));
      const top=Math.round(y-height*bell);
      block(g,x+i,top,Math.min(step,width-i),HORIZON-top,color);
    }
  }
  function cloud(g,x,y){
    block(g,x+20,y,78,12,"#e3f1dd");
    block(g,x+3,y+10,120,14,"#f1f4df");
    block(g,x+29,y-9,57,11,"#e9f4e9");
    block(g,x+19,y+24,84,4,"#badfdc");
  }
  function draw(g,camera,time,art,options={}){
    if(!g||typeof g.fillRect!=="function"||typeof g.createLinearGradient!=="function")
      throw new TypeError("Canvas context required");
    const x=normalize(camera),t=options.reducedMotion?0:normalize(time);
    const sky=g.createLinearGradient(0,0,0,HORIZON);
    sky.addColorStop(0,"#78bdcb");
    sky.addColorStop(.60,"#b5dac0");
    sky.addColorStop(1,"#f3d7ab");
    block(g,0,0,WIDTH,HEIGHT,sky);
    // Sun and haze are deliberately behind all gameplay surfaces.
    block(g,760-x*.02,77,52,52,"#fbe5aa");
    block(g,0,372,WIDTH,85,"#f0d4ae22");
    repeat(g,x,LAYERS.clouds,(cx,i)=>{
      cloud(g,cx+17+(options.reducedMotion?0:Math.sin(t*.12+i)*9),73+(i%3)*28);
    });
    repeat(g,x,LAYERS.farIslands,(cx,i)=>{
      ridge(g,cx-60,379,280,105+(i%3)*12,"#8abcb0");
      ridge(g,cx+90,397,175,56,"#98c5b5");
      block(g,cx-40,379,192,4,"#8eb9ac");
    });
    // Mist separates two hill ranges: the closer hills move faster.
    block(g,0,393,WIDTH,21,"#d7d9b7aa");
    repeat(g,x,LAYERS.nearIslands,(cx,i)=>{
      ridge(g,cx-35,445,242,80+(i%2)*13,"#679f96");
      ridge(g,cx+114,449,90,39,"#75aba1");
      block(g,cx+23,427,47,6,"#6aa39a");
    });
    block(g,0,HORIZON,WIDTH,HEIGHT-HORIZON,"#399ba6");
    block(g,0,HORIZON,WIDTH,6,"#77bdb2");
    // Reuse existing original coastal silhouettes, fully behind foreground
    // structures; no new distant assets or runtime image downloads.
    repeat(g,x,LAYERS.vegetation,(cx,i)=>{
      if(art&&typeof art.house==="function")art.house(g,cx+20,340,.63,i%3);
      if(art&&typeof art.palm==="function")art.palm(g,cx+224,457,.52);
      if(i%2===0&&art&&typeof art.boat==="function")
        art.boat(g,cx+125,492+(options.reducedMotion?0:Math.sin(t*1.2+i)*2));
    });
    // Existing ocean hue and world-space water hazards remain unchanged.
    repeat(g,x,{speed:.13,spacing:150},(cx,i)=>{
      block(g,cx,475+(i%3)*9,60,2,"#94d0c7");
      block(g,cx+26,503+(i%2)*7,39,2,"#7ec5c6");
    });
    block(g,0,535,WIDTH,5,"#266f82");
  }
  return Object.freeze({WIDTH,HEIGHT,HORIZON,LAYERS,offset,repeat,draw});
});
