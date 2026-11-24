/* Phase 2.4.4: warning-and-collapse timber boardwalk platforms.
 * Entire simulation is substep driven; visual shake does not affect physics.
 * Player-safe respawn avoids generating a solid platform inside the character.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CoastBreakaways=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  const WARNING=.65,RECOVERY=2.5;
  // Optional upper paths, directly above permanent walkways: falling has
  // a safe boardwalk below rather than an unavoidable water penalty.
  const PLANKS=Object.freeze([
    Object.freeze({id:"plank-training",x:603,y:341,w:100}),
    Object.freeze({id:"plank-middle",x:1320,y:305,w:96}),
    Object.freeze({id:"plank-late",x:2240,y:343,w:92})
  ]);
  function safelyClear(player,p){
    if(!player)return true;
    // A player with their feet at the plank height, standing or jumping
    // nearby, must not be enclosed by freshly regenerated solid wood.
    const horizontal=player.x+18>p.x && player.x-18<p.x+p.w;
    const vertical=player.feet>=p.y-70 && player.feet<=p.y+34;
    return !(horizontal&&vertical);
  }
  function install(manager,player,items=PLANKS,options={}){
    if(!manager||typeof manager.register!=="function")throw new TypeError("Platform manager required");
    if(!player||typeof player!=="object")throw new TypeError("Player state required");
    const warning=options.warning===undefined?WARNING:options.warning;
    const recovery=options.recovery===undefined?RECOVERY:options.recovery;
    if(!Number.isFinite(warning)||warning<=0||!Number.isFinite(recovery)||recovery<0)
      throw new RangeError("Invalid plank timing");
    return items.map(item=>{
      if(!item||!item.id||!Number.isFinite(item.x)||!Number.isFinite(item.y)||
         !Number.isFinite(item.w)||item.w<=0)throw new RangeError("Invalid collapsing plank");
      return manager.register({
        id:item.id,type:"breakaway",x:item.x,y:item.y,w:item.w,h:10,
        state:"intact",remaining:0,solid:true,enabled:true,
        onLand(_player,p){
          if(p.state==="intact"){
            p.state="warning";
            p.remaining=warning;
          }
        },
        update(dt,p){
          if(p.state==="warning"){
            p.remaining-=dt;
            if(p.remaining<=0){
              p.state="collapsed";
              p.solid=false;
              p.remaining=recovery;
            }
          }else if(p.state==="collapsed"){
            p.remaining=Math.max(0,p.remaining-dt);
            if(p.remaining<=0&&safelyClear(player,p)){
              p.state="intact";p.solid=true;p.remaining=0;
            }
          }
        },
        onReset(p){p.remaining=0;}
      });
    });
  }
  return Object.freeze({PLANKS,WARNING,RECOVERY,safelyClear,install});
});
