/* Phase 2.5.3 — PNG-inspired architectural detailing.
 * Decorations align to existing houses; no new physical geometry is created.
 */
(function(root,factory){
 const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.CoastVillage=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
 "use strict";
 const WIDTH=960;
 const COLORS=Object.freeze({thatch:"#e5b875",weave:"#a47855",trim:"#553b31",light:"#edcf98",rope:"#c4b18a",basket:"#966b4c",fish:"#a9d2c7"});
 function px(g,x,y,w,h,color){if(w<=0||h<=0)return;g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 function detail(g,h){
   const scale=Number.isFinite(h.scale)?h.scale:1;
   if(scale<=0)return;
   const x=h.x,y=h.y;
   // Existing house sprite is 140x215 in local coordinates.
   // Apply exactly the same transform without touching its walkable roof.
   g.save();g.translate(Math.round(x),Math.round(y));g.scale(scale,scale);
   // Thatch roof fibres and a carved fascia trim.
   for(let i=0;i<12;i++){
     px(g,10+i*10,17-Math.min(12,i*1.2),7,2,COLORS.thatch);
   }
   px(g,8,26,124,3,COLORS.trim);
   for(let i=0;i<15;i++)px(g,17+i*7,33+(i%2)*5,3,7,COLORS.weave);
   // Modest woven diagonal wall motif, stays behind doorway/window.
   for(let row=0;row<3;row++){
     for(let col=0;col<5;col++){
       px(g,18+col*22,47+row*17,5,2,COLORS.light);
       px(g,22+col*22,49+row*17,2,5,COLORS.weave);
     }
   }
   // Veranda rail and hanging fibre baskets to signal inhabited homes.
   px(g,10,103,125,4,COLORS.trim);
   for(let col=0;col<6;col++)px(g,18+col*20,96,3,13,COLORS.light);
   px(g,125,86,2,18,COLORS.rope);
   px(g,117,100,17,5,COLORS.basket);
   px(g,120,105,12,9,COLORS.basket);
   for(let i=0;i<3;i++)px(g,121+i*4,108,2,4,COLORS.light);
   g.restore();
 }
 function rack(g,x,y){
   // Fishing racks are background props, drawn clear of playable walkways.
   px(g,x,y-38,4,39,COLORS.trim);
   px(g,x+48,y-38,4,39,COLORS.trim);
   px(g,x-2,y-36,56,5,COLORS.light);
   for(let i=0;i<4;i++){
     const fx=x+8+i*11;
     px(g,fx,y-30,2,7,COLORS.rope);
     px(g,fx-3,y-24,9,11,COLORS.fish);
     px(g,fx-3,y-18,9,2,"#527f7a");
     px(g,fx+3,y-20,2,2,COLORS.trim);
   }
 }
 function crate(g,x,y){
   px(g,x,y-14,29,14,COLORS.trim);
   px(g,x+3,y-12,23,10,"#bd8d62");
   px(g,x+3,y-8,23,3,COLORS.weave);
   px(g,x+9,y-12,3,10,COLORS.thatch);
   px(g,x+19,y-12,3,10,COLORS.thatch);
 }
 function draw(g,camera,houses){
   if(!g||typeof g.fillRect!=="function"||typeof g.save!=="function")throw new TypeError("Canvas context required");
   for(const h of houses||[]){
     if(h.x+h.scale*140<camera-80||h.x>camera+WIDTH+80)continue;
     detail(g,h);
     const baseY=h.y+h.scale*116;
     const xx=h.x+h.scale*141;
     if(xx>=camera-30&&xx<=camera+WIDTH+30){
       if(h.tint%2===0)rack(g,xx+5,baseY);
       else crate(g,xx+9,baseY);
     }
   }
 }
 return Object.freeze({COLORS,detail,rack,crate,draw});
});
