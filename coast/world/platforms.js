/* Phase 2.4.2 — dynamic one-way platform registry.
 * No browser/physics dependency. A platform updates once per physics substep.
 * Motion and collision remain separate from visual bobbing/renderer effects.
 */
(function(root,factory){
  const API=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=API;
  if(root)root.CoastPlatforms=API;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  const number=(n)=>typeof n==="number"&&Number.isFinite(n);
  function create(){
    const entries=new Map();
    const initial=new Map();
    const deltas=new Map();
    function register(config){
      if(!config||typeof config.id!=="string"||!config.id.trim())throw new TypeError("Unique platform id required");
      if(entries.has(config.id))throw new Error("Duplicate platform id: "+config.id);
      if(![config.x,config.y,config.w].every(number)||config.w<=0)
        throw new RangeError("Platform requires finite x/y and positive width");
      if(config.h!==undefined&&(!number(config.h)||config.h<0))
        throw new RangeError("Invalid platform height");
      if(config.update!==undefined&&typeof config.update!=="function")
        throw new TypeError("update must be a function");
      if(config.onLand!==undefined&&typeof config.onLand!=="function")
        throw new TypeError("onLand must be a function");
      const state={
        ...config,
        h:config.h===undefined?0:config.h,
        enabled:config.enabled!==false,
        solid:config.solid!==false,
        state:config.state||"idle"
      };
      entries.set(config.id,state);
      initial.set(config.id,Object.freeze({
        x:state.x,y:state.y,w:state.w,h:state.h,
        enabled:state.enabled,solid:state.solid,state:state.state
      }));
      deltas.set(config.id,{dx:0,dy:0});
      return state;
    }
    function advance(dt){
      if(!number(dt)||dt<0||dt>1/30+1e-8)throw new RangeError("Platform substep must be between 0 and 1/30 s");
      for(const [id,p] of entries){
        const x=p.x,y=p.y;
        if(p.update)p.update(dt,p);
        if(![p.x,p.y,p.w].every(number)||p.w<=0)
          throw new RangeError("Invalid bounds after platform update: "+id);
        deltas.set(id,{dx:p.x-x,dy:p.y-y});
      }
    }
    function getSurfaces(){
      const surfaces=[];
      for(const p of entries.values()){
        if(p.enabled&&p.solid){
          surfaces.push({id:p.id,x:p.x,y:p.y,w:p.w,kind:p.type||"dynamic"});
        }
      }
      return surfaces;
    }
    function getSurface(id){
      const p=entries.get(id);
      if(!p||!p.enabled||!p.solid)return null;
      return {id:p.id,x:p.x,y:p.y,w:p.w,kind:p.type||"dynamic"};
    }
    function getDelta(id){return deltas.get(id)||{dx:0,dy:0};}
    function onLand(id,player){
      const p=entries.get(id);
      if(p&&p.enabled&&p.solid&&p.onLand)p.onLand(player,p);
    }
    function reset(){
      for(const [id,p] of entries){
        Object.assign(p,initial.get(id));
        deltas.set(id,{dx:0,dy:0});
        if(typeof p.onReset==="function")p.onReset(p);
      }
    }
    return Object.freeze({
      register,advance,getSurfaces,getSurface,getDelta,onLand,reset,
      size:()=>entries.size,get:id=>entries.get(id)||null
    });
  }
  return Object.freeze({create});
});
