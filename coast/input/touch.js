/* Phase 2.4.1 — multitouch input adapter. No movement or physics rules.
 * Each pointer owns its button until release/cancel/lost capture.
 * Releasing one finger never releases another active finger.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CoastTouch=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  const ACTIONS=Object.freeze(["left","right","up","down","jump"]);
  function create(buttons,onChange){
    if(typeof onChange!=="function")throw new TypeError("onChange callback required");
    const pointers=new Map();
    const pressed=new Set();
    const buttonFor=new Map();
    for(const button of buttons){
      const action=button.dataset&&button.dataset.control;
      if(!ACTIONS.includes(action))throw new Error("Unknown touch action: "+action);
      if(buttonFor.has(action))throw new Error("Duplicate touch action: "+action);
      buttonFor.set(action,button);
      button.addEventListener("pointerdown",event=>{
        if(event.cancelable)event.preventDefault();
        // Do not bind mouse clicks to the gameplay buttons. Pointer touches
        // and pen input use pointer events, keyboard uses the normal keydown.
        if(event.pointerType==="mouse"&&event.button!==0)return;
        if(pointers.has(event.pointerId))return;
        pointers.set(event.pointerId,action);
        if(button.setPointerCapture){
          try{button.setPointerCapture(event.pointerId);}catch(_){}
        }
        sync();
      });
      const release=event=>{
        if(event.cancelable)event.preventDefault();
        if(pointers.get(event.pointerId)!==action)return;
        pointers.delete(event.pointerId);
        sync();
      };
      for(const type of ["pointerup","pointercancel","lostpointercapture"]){
        button.addEventListener(type,release);
      }
      // Avoid a compatibility click activating an unrelated control.
      button.addEventListener("contextmenu",event=>event.preventDefault());
    }
    function sync(){
      const next=new Set(pointers.values());
      for(const action of ACTIONS){
        if(pressed.has(action)===next.has(action))continue;
        if(next.has(action))pressed.add(action);
        else pressed.delete(action);
        const button=buttonFor.get(action);
        if(button){
          if(button.classList)button.classList.toggle("is-pressed",next.has(action));
          if(button.setAttribute)button.setAttribute("aria-pressed",String(next.has(action)));
        }
        onChange(action,next.has(action));
      }
    }
    function clear(){
      pointers.clear();
      sync();
    }
    return Object.freeze({
      clear,
      isPressed:action=>pressed.has(action),
      pointerCount:()=>pointers.size
    });
  }
  return Object.freeze({ACTIONS,create});
});
