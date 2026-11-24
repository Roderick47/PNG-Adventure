/* Phase 2.5.3 — decorative tropical coastal vegetation.
 * All positions are authored in existing world coordinates and culled by camera.
 * Plants do not provide physics surfaces or obscure gameplay objects.
 */
(function(root,factory){
 const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.CoastVegetation=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
 "use strict";
 const PLANTS=Object.freeze([
   Object.freeze({x:62,y:433,type:"palm",size:1}),
   Object.freeze({x:418,y:432,type:"shrub",size:1}),
   Object.freeze({x:600,y:402,type:"flower",size:1}),
   Object.freeze({x:860,y:366,type:"shrub",size:1}),
   Object.freeze({x:1030,y:418,type:"flower",size:1}),
   Object.freeze({x:1372,y:370,type:"shrub",size:1}),
   Object.freeze({x:1604,y:315,type:"flower",size:1}),
   Object.freeze({x:1794,y:390,type:"shrub",size:1}),
   Object.freeze({x:2054,y:345,type:"flower",size:1}),
   Object.freeze({x:2325,y:405,type:"shrub",size:1}),
   Object.freeze({x:2562,y:350,type:"flower",size:1}),
   Object.freeze({x:2815,y:316,type:"shrub",size:1}),
   Object.freeze({x:3118,y:399,type:"palm",size:.85}),
   Object.freeze({x:3200,y:399,type:"flower",size:1})
 ]);
 function px(g,x,y,w,h,color){if(w<=0||h<=0)return;g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 function plant(g,p,time,options={}){
   const x=p.x,y=p.y,s=Number.isFinite(p.size)?p.size:1;
   const sway=options.reducedMotion?0:Math.round(Math.sin(time*1.15+x*.08)*2);
   if(p.type==="palm"){
     px(g,x-5*s,y-111*s,9*s,111*s,"#75503a");
     px(g,x-2*s,y-102*s,3*s,96*s,"#c39865");
     for(let i=0;i<5;i++){
       const dir=i%2?-1:1;
       px(g,x+(dir<0?-48:0)*s+sway,y-(116-i*4)*s,52*s,7*s,i%2?"#397d64":"#5c9568");
       px(g,x+(dir<0?-39:9)*s+sway,y-(107-i*4)*s,34*s,6*s,"#80ac7b");
     }
     px(g,x-5*s+sway,y-121*s,15*s,9*s,"#347257");
     for(let i=0;i<3;i++)px(g,x+(i-1)*6*s,y-112*s,5*s,5*s,"#91663e");
   }else if(p.type==="shrub"){
     px(g,x-22*s,y-14*s,44*s,14*s,"#357c60");
     px(g,x-14*s+sway,y-23*s,23*s,11*s,"#4e986a");
     px(g,x+4*s+sway,y-18*s,18*s,10*s,"#6daa7a");
     px(g,x-17*s,y-9*s,5*s,3*s,"#a9c18a");
     px(g,x+7*s,y-12*s,4*s,4*s,"#aad09a");
   }else if(p.type==="flower"){
     for(let i=0;i<3;i++){
       const px0=x+(i-1)*11*s,tip=y-(17+i%2*5)*s;
       px(g,px0,y-17*s,3*s,17*s,"#377f5e");
       px(g,px0-5*s+sway,tip,11*s,4*s,i%2?"#ecb5a1":"#f3ca87");
       px(g,px0-2*s+sway,tip-4*s,5*s,12*s,i%2?"#df816a":"#d99073");
       px(g,px0+sway,tip+3*s,3*s,3*s,"#ffe39b");
     }
   }
 }
 function draw(g,camera,time,options={}){
   if(!g||typeof g.fillRect!=="function")throw new TypeError("Canvas context required");
   for(const p of PLANTS){
     if(p.x+70<camera||p.x-70>camera+960)continue;
     plant(g,p,time,options);
   }
 }
 return Object.freeze({PLANTS,plant,draw});
});
