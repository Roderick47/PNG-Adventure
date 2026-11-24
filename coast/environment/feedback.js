/* Phase 2.5.5 — deterministic, non-interactive gameplay visual feedback.
 * Gameplay events push short-lived pixel effects; cues only read level state.
 * This module never registers surfaces, applies damage, or changes physics.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.CoastFeedback=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
 "use strict";
 const WIDTH=960,MAX_EFFECTS=40,MAX_LIFE=.6;
 const COLORS=Object.freeze({
   jump:"#f5e2bc",land:"#d6b88b",wood:"#e4be83",net:"#a6d5b2",
   canoe:"#b5ece3",collect:"#ffe28a",checkpoint:"#f7dd91",
   danger:"#f58b68",outline:"#355b57",safe:"#d9d7a8"
 });
 function paint(g,x,y,w,h,color){
   if(w<=0||h<=0)return;
   g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
 }
 function create(){
   const effects=[];
   function emit(type,x,y){
     if(!COLORS[type]||!Number.isFinite(x)||!Number.isFinite(y))return false;
     if(effects.length>=MAX_EFFECTS)effects.shift();
     effects.push({type,x,y,age:0});
     return true;
   }
   function advance(dt){
     const step=Number.isFinite(dt)?Math.max(0,Math.min(.1,dt)):0;
     for(let i=effects.length-1;i>=0;i--){
       effects[i].age+=step;
       if(effects[i].age>=MAX_LIFE)effects.splice(i,1);
     }
   }
   function reset(){effects.length=0;}
   function snapshot(){return effects.map(v=>({...v}));}
   return Object.freeze({emit,advance,reset,snapshot,count:()=>effects.length});
 }
 function drawEffects(g,camera,effects,options={}){
   const min=camera-40,max=camera+WIDTH+40,reduced=options.reducedMotion===true;
   for(const e of effects||[]){
     if(e.x<min||e.x>max||!(e.age>=0&&e.age<MAX_LIFE)||!COLORS[e.type])continue;
     const u=e.age/MAX_LIFE;
     const spread=reduced?13:Math.round(7+u*27);
     const lift=reduced?0:Math.round(u*12);
     const color=COLORS[e.type];
     // Distinct horizontal fragments communicate direction and contact.
     paint(g,e.x-spread,e.y-lift,8,3,color);
     paint(g,e.x+spread-8,e.y-lift,8,3,color);
     if(e.type==="checkpoint"||e.type==="collect"){
       paint(g,e.x-2,e.y-15-lift,4,9,color);
       paint(g,e.x-5,e.y-11-lift,10,3,color);
     }else if(e.type==="danger"){
       paint(g,e.x-3,e.y-19-lift,6,10,COLORS.danger);
     }else{
       paint(g,e.x-3,e.y-4-lift,6,2,color);
     }
   }
 }
 function drawCues(g,camera,time,scene={},options={}){
   const x=Number.isFinite(camera)?camera:0;
   const t=options.reducedMotion?0:Number.isFinite(time)?time:0;
   const min=x-50,max=x+WIDTH+50;
   // Small repeated timber end-cap markings: stable platforms are visually
   // different from breakaways' cracks and nets' patterned weave.
   for(const platform of scene.surfaces||[]){
     if(platform.kind==="shore"||platform.kind==="roof"||platform.x>max||platform.x+platform.w<min)continue;
     paint(g,platform.x+5,platform.y-3,11,3,COLORS.safe);
     paint(g,platform.x+platform.w-16,platform.y-3,11,3,COLORS.safe);
   }
   // One static caution glyph per collapsing platform: visible even before
   // touching it. No need to use color alone to tell its danger state.
   for(const board of scene.breakaways||[]){
     if(board.x+board.w<min||board.x>max||board.state==="collapsed")continue;
     const cx=board.x+board.w/2,y=board.y-12;
     const urgency=board.state==="warning";
     paint(g,cx-9,y,18,3,urgency?COLORS.danger:COLORS.wood);
     paint(g,cx-4,y-6,8,6,urgency?COLORS.danger:COLORS.outline);
     paint(g,cx-1,y-5,2,3,"#fff2d6");
   }
   // Climb indicators are aligned with the actual ladder/net geometry and
   // shown only near the player to avoid a screen full of arrows.
   const p=scene.player;
   if(p&&Number.isFinite(p.x)&&Number.isFinite(p.feet)){
     const climbs=[...(scene.ladders||[]),...(scene.netClimbs||[])];
     for(const l of climbs){
       const center=l.w?l.x+l.w/2:l.x+8;
       if(Math.abs(p.x-center)>55||p.feet<l.y-32||p.feet>l.y+l.h+32)continue;
       const cy=l.y+13;
       if(center<min||center>max)continue;
       paint(g,center-5,cy+5,10,3,COLORS.net);
       paint(g,center-3,cy+2,6,3,COLORS.net);
       paint(g,center-1,cy-2,2,4,COLORS.net);
       break;
     }
   }
   // Collectibles receive a faint four-point glint; no fake collectibles.
   for(const coin of scene.coins||[]){
     if(coin.taken||coin.x<min||coin.x>max)continue;
     const gleam=options.reducedMotion?0:Math.round(Math.sin(t*3+coin.x*.02)*3);
     paint(g,coin.x-2,coin.y-17+gleam,4,3,"#fff2c1");
     paint(g,coin.x-11,coin.y-8+gleam,3,3,"#fff2c1");
   }
   // Checkpoint flag cue is always legible and changes when activated.
   const cp=scene.checkpoint;
   if(cp&&cp.x>=min&&cp.x<=max){
     const color=scene.activated?COLORS.checkpoint:COLORS.net;
     paint(g,cp.x+12,cp.y-79,24,4,color);
     paint(g,cp.x+18,cp.y-84,12,5,color);
   }
   // Preserve the game's original enemy telegraphs while adding one
   // non-animated hazard underline to hostile crabs.
   for(const crab of scene.crabs||[]){
     if(crab.alive===false||crab.x<min||crab.x>max)continue;
     paint(g,crab.x-12,crab.y+6,24,2,COLORS.danger);
   }
 }
 function draw(g,camera,time,scene={},effects=[],options={}){
   if(!g||typeof g.fillRect!=="function")throw new TypeError("Canvas context required");
   const x=Number.isFinite(camera)?camera:0;
   drawCues(g,x,time,scene,options);
   drawEffects(g,x,effects,options);
 }
 return Object.freeze({WIDTH,MAX_EFFECTS,MAX_LIFE,COLORS,create,draw,drawCues,drawEffects});
});
