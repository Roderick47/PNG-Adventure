/* Phase 2.6.1: non-blocking interaction framework for Stilt Village.
 * Up / E near villagers or signs opens short contextual dialogue.
 * Pure authored placements; no new colliders or changes to movement logic.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.CoastInteractions=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
 "use strict";
 const RANGE=54,HEIGHT=47,VIEW=960;
 const OBJECTS=Object.freeze([
  Object.freeze({id:"welcome",kind:"sign",x:225,y:432,text:"Welcome to Stilt Village! Follow the boardwalks across the lagoon."}),
  Object.freeze({id:"fisher",kind:"villager",x:698,y:402,text:"The canoes cross the channels. Watch their movement before you jump!"}),
  Object.freeze({id:"net-guide",kind:"sign",x:1346,y:370,text:"Fishing nets make useful shortcuts. Climb with UP or DOWN."}),
  Object.freeze({id:"elder",kind:"villager",x:1837,y:390,text:"Our homes stand above the sea. Look out for loose planks on the upper paths."}),
  Object.freeze({id:"final-jetty",kind:"sign",x:3128,y:399,text:"Last jetty ahead! Follow the golden tokens to the finish."})
 ]);
 function nearest(player,objects=OBJECTS){
  if(!player||!Number.isFinite(player.x)||!Number.isFinite(player.feet))return null;
  let choice=null,best=Infinity;
  for(const obj of objects){
   const distance=Math.abs(player.x-obj.x);
   if(distance>RANGE||Math.abs(player.feet-obj.y)>HEIGHT||distance>=best)continue;
   choice=obj;best=distance;
  }
  return choice;
 }
 function create(objects=OBJECTS){
  let visited=new Set();
  function interact(player){
   const obj=nearest(player,objects);
   if(!obj)return null;
   const first=!visited.has(obj.id);
   visited.add(obj.id);
   return {id:obj.id,text:obj.text,first,discovered:visited.size,total:objects.length};
  }
  function reset(){visited=new Set();}
  return Object.freeze({interact,reset,near:player=>nearest(player,objects),progress:()=>visited.size});
 }
 function px(g,x,y,w,h,color){
  if(w<=0||h<=0)return;
  g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
 }
 function draw(g,camera,time,player,options={}){
  if(!g||typeof g.fillRect!=="function")throw new TypeError("Canvas required");
  const active=nearest(player);
  const t=options.reducedMotion?0:Number.isFinite(time)?time:0;
  const x=Number.isFinite(camera)?camera:0;
  for(const obj of OBJECTS){
   if(obj.x+32<x-48||obj.x-32>x+VIEW+48)continue;
   if(obj.kind==="sign"){
    px(g,obj.x-2,obj.y-33,5,33,"#654832");
    px(g,obj.x-16,obj.y-33,33,20,"#634331");
    px(g,obj.x-13,obj.y-30,27,14,"#dbbb78");
    px(g,obj.x-9,obj.y-26,18,3,"#866441");
    px(g,obj.x-5,obj.y-20,11,2,"#866441");
   }else{
    // Decorative villager facing the path: never an enemy or platform.
    px(g,obj.x-5,obj.y-38,11,11,"#80573c");
    px(g,obj.x-4,obj.y-36,9,8,"#b87d55");
    px(g,obj.x-7,obj.y-27,15,19,"#4a7d74");
    px(g,obj.x-6,obj.y-8,5,8,"#755440");
    px(g,obj.x+2,obj.y-8,5,8,"#755440");
   }
   if(active&&active.id===obj.id){
    const bob=options.reducedMotion?0:Math.round(Math.sin(t*3)*2);
    px(g,obj.x-18,obj.y-60+bob,36,18,"#163b46");
    px(g,obj.x-16,obj.y-58+bob,32,14,"#f7df9d");
    // Up arrow plus E hint: usable via existing mobile UP button.
    px(g,obj.x-11,obj.y-53+bob,3,5,"#264c50");
    px(g,obj.x-13,obj.y-55+bob,7,3,"#264c50");
    px(g,obj.x-2,obj.y-55+bob,3,10,"#264c50");
    px(g,obj.x+2,obj.y-55+bob,8,2,"#264c50");
    px(g,obj.x+2,obj.y-50+bob,7,2,"#264c50");
    px(g,obj.x+2,obj.y-46+bob,8,2,"#264c50");
   }
  }
 }
 return Object.freeze({RANGE,HEIGHT,OBJECTS,nearest,create,draw});
});
