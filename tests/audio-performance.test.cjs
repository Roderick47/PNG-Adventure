const test=require("node:test");
const assert=require("node:assert/strict");
const Sound=require("../coast/audio/sound.js");
const Budget=require("../coast/environment/render-budget.js");
function fakeContext(){
 const calls=[];
 function param(){return {value:0,setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}};}
 class Context{
  constructor(){this.currentTime=1;this.sampleRate=100;this.destination={};}
  createGain(){return {gain:param(),connect(){},disconnect(){}};}
  createOscillator(){return {type:"",frequency:param(),connect(){},start(t){calls.push(["toneStart",t]);},stop(t){calls.push(["toneStop",t]);},disconnect(){},onended:null};}
  createBuffer(_channels,length){return {getChannelData(){return new Float32Array(length)}};}
  createBufferSource(){return {loop:false,buffer:null,connect(){},start(){calls.push(["surfStart"]);}};}
  createBiquadFilter(){return {type:"",frequency:param(),connect(){}};}
  resume(){calls.push(["resume"]);return Promise.resolve();}
  suspend(){calls.push(["suspend"]);return Promise.resolve();}
  close(){calls.push(["close"]);return Promise.resolve();}
 }
 return {Context,calls};
}
test("audio module is silent until a user gesture requests unlock",()=>{
 const {Context,calls}=fakeContext();
 const sound=Sound.create({AudioContext:Context});
 assert.equal(sound.status().started,false);
 assert.equal(sound.status().available,true);
 assert.equal(sound.cue("jump"),false);
 assert.equal(calls.length,0);
 assert.equal(sound.unlock(),true);
 assert.equal(sound.status().started,true);
 assert.ok(calls.some(c=>c[0]==="surfStart"));
 assert.ok(calls.some(c=>c[0]==="resume"));
});
test("mute prevents tones, persists in engine state and can restore sound",()=>{
 const {Context,calls}=fakeContext();
 const sound=Sound.create({AudioContext:Context,muted:true});
 assert.equal(sound.status().muted,true);
 assert.equal(sound.unlock(),true);
 assert.equal(sound.cue("collect"),false);
 assert.equal(sound.mute(false),false);
 assert.equal(sound.cue("collect"),true);
 assert.equal(sound.cue("collect"),false,"rapid duplicate cues throttled");
 assert.ok(calls.some(c=>c[0]==="toneStart"));
 assert.equal(sound.mute(true),true);
 assert.equal(sound.cue("hurt"),false);
});
test("all events have valid short synthesized sound definitions",()=>{
 const needed=["jump","land","wood","net","canoe","collect","checkpoint","hurt","splash","victory"];
 for(const name of needed){
  const cue=Sound.SOUNDS[name];
  assert.ok(cue,name);
  assert.ok(cue.frequency>0&&cue.end>0);
  assert.ok(cue.duration>0&&cue.duration<=.5);
  assert.ok(cue.volume>0&&cue.volume<.2);
 }
});
test("pause and resume suspend ambience without changing gameplay state",()=>{
 const {Context,calls}=fakeContext();
 const sound=Sound.create({AudioContext:Context});
 sound.unlock();
 sound.update(2,false);
 sound.suspend();
 assert.ok(calls.some(c=>c[0]==="suspend"));
 sound.unlock();
 sound.update(5,true);
 assert.equal(sound.cue("checkpoint"),true);
});
test("audio absent or denied is nonfatal and never starts automatically",()=>{
 const silent=Sound.create({host:{}});
 assert.equal(silent.status().available,false);
 assert.equal(silent.unlock(),false);
 assert.equal(silent.cue("jump"),false);
 assert.doesNotThrow(()=>silent.update(1,true));
 const denied=Sound.create({AudioContext:class{constructor(){throw Error("denied")}}});
 assert.equal(denied.unlock(),false);
 assert.doesNotThrow(()=>denied.mute(true));
});
test("render culling respects camera, margins and invalid positions",()=>{
 assert.equal(Budget.visible(0,20,0),true);
 assert.equal(Budget.visible(1000,5,0),true);
 assert.equal(Budget.visible(1050,5,0),false);
 assert.equal(Budget.visible(5000,100,4600),true);
 assert.equal(Budget.visible(2,10,5000),false);
 assert.equal(Budget.visible(NaN,10,0),false);
 assert.equal(Budget.visible(0,10,Infinity),false);
});
test("decorative particles are capped and recycled in place",()=>{
 const particles=[];
 for(let i=0;i<300;i++)Budget.addParticle(particles,{x:i,y:100,vx:10,vy:0,life:.5});
 assert.equal(particles.length,Budget.MAX_PARTICLES);
 assert.equal(particles[0].x,300-Budget.MAX_PARTICLES);
 const same=particles;
 Budget.advanceParticles(particles,.2);
 assert.equal(particles,same);
 assert.ok(particles[0].x>300-Budget.MAX_PARTICLES);
 Budget.advanceParticles(particles,.4);
 assert.equal(particles.length,0);
});
