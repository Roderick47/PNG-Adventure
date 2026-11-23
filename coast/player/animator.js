/* Phase 2.2: deterministic state-based sprite animation.
 * Presentation-only: never mutates world physics or player collision boxes.
 * Tick with elapsed seconds; sprite frame remains stable across render frequency.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CoastAnimator=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  const NON_LOOP=new Set(["takeoff","rise","apex","land","crouch","hurt"]);
  const FORCED={victory:4,hurt:3,takeoff:2,land:1};
  function create(manifest){
    if(!manifest||!manifest.FRAME_COUNTS||!manifest.FRAME_FPS)throw new TypeError("Character manifest is required");
    const counts=manifest.FRAME_COUNTS,fps=manifest.FRAME_FPS;
    let state="idle",age=0,forced=null,poseTime=0;
    const duration=name=>counts[name]/fps[name];
    const has=name=>Object.prototype.hasOwnProperty.call(counts,name);
    function enter(name,lock=false){
      if(!has(name))throw new Error("Unknown animation: "+name);
      state=name;age=0;
      if(lock)forced=name;
    }
    function reset(){
      state="idle";age=0;poseTime=0;forced=null;
    }
    function trigger(name){
      if(!Object.prototype.hasOwnProperty.call(FORCED,name))throw new Error("Unknown animation event: "+name);
      // Victory is terminal until reset. Repeated hurt/landing events cannot
      // interrupt higher-priority animations.
      if(forced && FORCED[name]<FORCED[forced])return false;
      if(forced===name)return false;
      enter(name,true);
      return true;
    }
    function resolve(p){
      if(p.victorious)return "victory";
      if(p.climbing)return "climb";
      if(!p.grounded){
        if(p.velocityY < -90)return "rise";
        if(p.velocityY <= 90)return "apex";
        return "fall";
      }
      if(p.crouching)return "crouchIdle";
      if(p.moving)return "run";
      return "idle";
    }
    function update(input,dt){
      const p=input||{};
      const step=Math.max(0,Math.min(Number.isFinite(dt)?dt:0,.05));
      poseTime+=step;
      if(p.victorious && forced!=="victory")trigger("victory");
      // Hurt events are explicit: the game calls trigger("hurt") on damage.
      // Nothing else may suppress victory; terminal victory loops as a celebration.
      if(forced){
        age+=step;
        if(forced==="victory"){
          return current();
        }
        if(age < duration(forced))return current();
        forced=null;
        age=0;
      }
      let desired=resolve(p);
      if(desired==="crouchIdle"&&state!=="crouch"&&state!=="crouchIdle"){
        enter("crouch");age=step;
        return current();
      }
      // Hold the crouch transition until finished, unless airborne/climbing.
      if(state==="crouch"&&desired==="crouchIdle"){
        age+=step;
        if(age<duration("crouch"))return current();
        desired="crouchIdle";
      }
      // Airborne rises after the takeoff event, and apex/fall follow velocity.
      // A landing event takes priority over run/idle for its short duration.
      if(state!==desired)enter(desired);
      age+=step;
      return current();
    }
    function current(){
      const count=counts[state],rate=fps[state];
      const pos=Math.floor(Math.max(0,age)*rate);
      const frame=NON_LOOP.has(state)?Math.min(count-1,pos):pos%count;
      return {action:state,frame,elapsed:age,locked:forced!==null};
    }
    return Object.freeze({reset,trigger,update,current,get state(){return state;}});
  }
  return Object.freeze({create});
});
