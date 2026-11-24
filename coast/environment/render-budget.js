/* Phase 2.5.6 — simple view bounds and bounded mutable visual particles.
 * A renderer-only helper; physics and logical entity updates are unchanged.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.CoastRenderBudget=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
 "use strict";
 const VIEW=960,MAX_PARTICLES=96;
 function visible(x,width,camera,margin=40){
   if(!Number.isFinite(x)||!Number.isFinite(width)||!Number.isFinite(camera))return false;
   return x+width>=camera-margin&&x<=camera+VIEW+margin;
 }
 function addParticle(list,particle){
   if(list.length>=MAX_PARTICLES)list.splice(0,list.length-MAX_PARTICLES+1);
   list.push(particle);
 }
 function advanceParticles(list,dt){
   for(let i=list.length-1;i>=0;i--){
     const v=list[i];
     v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=260*dt;v.life-=dt;
     if(v.life<=0)list.splice(i,1);
   }
 }
 return Object.freeze({VIEW,MAX_PARTICLES,visible,addParticle,advanceParticles});
});
