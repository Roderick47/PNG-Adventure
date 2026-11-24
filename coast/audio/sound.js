/* Phase 2.5.6 — original procedural sounds, no downloaded audio.
 * AudioContext is created only in a user gesture, and remains optional.
 * All operations fail silently if Web Audio is missing or blocked.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.CoastSound=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
 "use strict";
 const SOUNDS=Object.freeze({
  step:Object.freeze({frequency:130,end:95,duration:.07,type:"triangle",volume:.065}),
  bird:Object.freeze({frequency:900,end:1220,duration:.12,type:"sine",volume:.055}),
  jump:Object.freeze({frequency:370,end:620,duration:.12,type:"sine",volume:.12}),
  land:Object.freeze({frequency:150,end:90,duration:.11,type:"triangle",volume:.11}),
  wood:Object.freeze({frequency:190,end:65,duration:.15,type:"triangle",volume:.15}),
  net:Object.freeze({frequency:310,end:230,duration:.13,type:"sine",volume:.08}),
  canoe:Object.freeze({frequency:170,end:110,duration:.17,type:"sine",volume:.09}),
  collect:Object.freeze({frequency:660,end:990,duration:.19,type:"sine",volume:.13}),
  checkpoint:Object.freeze({frequency:500,end:890,duration:.31,type:"sine",volume:.16}),
  hurt:Object.freeze({frequency:230,end:95,duration:.27,type:"sawtooth",volume:.11}),
  splash:Object.freeze({frequency:260,end:100,duration:.23,type:"triangle",volume:.11}),
  victory:Object.freeze({frequency:540,end:1010,duration:.43,type:"sine",volume:.15})
 });
 function create(env={}){
  const host=env.host|| (typeof window!=="undefined"?window:null);
  const Factory=env.AudioContext || (host&&(host.AudioContext||host.webkitAudioContext));
  let ctx=null,master=null,ambient=null,muted=!!env.muted,started=false,lastCue="",lastCueAt=-Infinity;
  function status(){return {muted,started,available:!!Factory};}
  function init(){
   if(!Factory)return false;
   if(ctx)return true;
   try{
    ctx=new Factory();
    master=ctx.createGain();master.gain.value=muted?0:.50;
    master.connect(ctx.destination);
    // Single filtered noise buffer approximates soft ocean surf.
    const len=Math.max(1,Math.floor(ctx.sampleRate*2));
    const buffer=ctx.createBuffer(1,len,ctx.sampleRate);
    const out=buffer.getChannelData(0);
    let prev=0;
    for(let i=0;i<len;i++){
      // deterministic pseudo-random noise rather than Math.random each frame
      const raw=(((i*16807+97)%32749)/16374.5)-1;
      prev=prev*.93+raw*.07;
      out[i]=prev*.48;
    }
    const source=ctx.createBufferSource();
    source.buffer=buffer;source.loop=true;
    const filter=ctx.createBiquadFilter();filter.type="lowpass";filter.frequency.value=420;
    ambient=ctx.createGain();ambient.gain.value=.11;
    source.connect(filter);filter.connect(ambient);ambient.connect(master);
    source.start();
    return true;
   }catch(_){
    try{if(ctx)ctx.close();}catch(_ignored){}
    ctx=null;master=null;ambient=null;
    return false;
   }
  }
  function unlock(){
   if(!init())return false;
   try{
    const promise=ctx.resume();
    if(promise&&typeof promise.catch==="function")promise.catch(()=>{});
    started=true;
    return true;
   }catch(_){return false;}
  }
  function mute(value){
   muted=!!value;
   if(master){
    try{master.gain.setTargetAtTime(muted?0:.50,ctx.currentTime,.015);}
    catch(_){master.gain.value=muted?0:.50;}
   }
   return muted;
  }
  function cue(name){
   if(muted||!started||!ctx||!SOUNDS[name])return false;
   const data=SOUNDS[name],when=ctx.currentTime;
   // Rate-limit any accidentally repeated contact in adjacent physics frames.
   if(name===lastCue&&when-lastCueAt<.055)return false;
   lastCue=name;lastCueAt=when;
   try{
    const oscillator=ctx.createOscillator(),gain=ctx.createGain();
    oscillator.type=data.type;
    oscillator.frequency.setValueAtTime(data.frequency,when);
    oscillator.frequency.exponentialRampToValueAtTime(data.end,when+data.duration);
    gain.gain.setValueAtTime(.0001,when);
    gain.gain.exponentialRampToValueAtTime(Math.max(.001,data.volume),when+.012);
    gain.gain.exponentialRampToValueAtTime(.0001,when+data.duration);
    oscillator.connect(gain);gain.connect(master);
    oscillator.start(when);oscillator.stop(when+data.duration+.01);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    return true;
   }catch(_){return false;}
  }
  function update(time,playing){
   if(!ambient||!ctx)return;
   try{
    // Slow, gentle amplitude breathing; audio entirely freezes on pause.
    const value=muted||!playing?0:.095+.035*Math.sin((Number.isFinite(time)?time:0)*1.1);
    ambient.gain.setTargetAtTime(value,ctx.currentTime,.08);
   }catch(_){}
  }
  function suspend(){
   if(!ctx)return;
   try{const result=ctx.suspend();if(result&&result.catch)result.catch(()=>{});}catch(_){}
  }
  return Object.freeze({status,unlock,mute,cue,update,suspend});
 }
 return Object.freeze({SOUNDS,create});
});
