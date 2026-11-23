const test=require("node:test");
const assert=require("node:assert/strict");
const boy=require("../coast/player/character.js");
const Animator=require("../coast/player/animator.js");
const make=()=>Animator.create(boy);
const idle={grounded:true,velocityY:0,moving:false,crouching:false,climbing:false,victorious:false};
const run={...idle,moving:true};
const air=(vy)=>({...idle,grounded:false,velocityY:vy});

test("stable looping idle/run frames and no reset on identical input",()=>{
 const a=make();
 assert.deepEqual({action:a.current().action,frame:a.current().frame},{action:"idle",frame:0});
 a.update(idle,.05);
 assert.equal(a.current().frame,0);
 a.update(idle,.05);
 a.update(idle,.05);
 assert.equal(a.current().frame,0);
 a.update(idle,.05);
 assert.equal(a.current().frame,1);
 assert.equal(a.update(run,.05).action,"run");
 a.update(run,.04);a.update(run,.04);
 assert.equal(a.current().frame,1);
 a.update(idle,.01);
 assert.equal(a.current().action,"idle");
 assert.equal(a.current().frame,0);
});

test("takeoff cannot be interrupted by normal airborne movement",()=>{
 const a=make();
 assert.equal(a.trigger("takeoff"),true);
 for(let i=0;i<3;i++)assert.equal(a.update(air(-470),.03).action,"takeoff");
 assert.equal(a.update(air(-400),.04).action,"takeoff");
 assert.equal(a.update(air(-350),.02).action,"takeoff");
 assert.equal(a.update(air(-290),.03).action,"rise");
 assert.equal(a.update(air(0),.05).action,"apex");
 assert.equal(a.update(air(220),.05).action,"fall");
});

test("land plays a single timed clip before returning to idle",()=>{
 const a=make();
 assert.equal(a.trigger("land"),true);
 assert.equal(a.update(idle,.05).action,"land");
 assert.equal(a.update(run,.05).action,"land");
 assert.equal(a.update(run,.05).action,"land");
 assert.equal(a.update(run,.05).action,"run");
});

test("crouching transitions once to crouch idle, then exits on release",()=>{
 const a=make();
 let pose=a.update({...idle,crouching:true},.03);
 assert.equal(pose.action,"crouch");
 for(let i=0;i<10;i++)pose=a.update({...idle,crouching:true},.04);
 assert.equal(pose.action,"crouchIdle");
 const held=pose.frame;
 a.update({...idle,crouching:true},.05);
 assert.ok(a.current().frame===held || a.current().frame===((held+1)%2));
 a.update(idle,.02);
 assert.equal(a.current().action,"idle");
});

test("climbing responds to the player state; velocity chooses rise/apex/fall",()=>{
 const a=make();
 assert.equal(a.update({...idle,climbing:true},.04).action,"climb");
 assert.equal(a.update(air(-200),.04).action,"rise");
 assert.equal(a.update(air(50),.04).action,"apex");
 assert.equal(a.update(air(100),.04).action,"fall");
});

test("hurt overrides takeoff and landing; weaker events cannot override hurt",()=>{
 const a=make();
 a.trigger("takeoff");
 assert.equal(a.trigger("hurt"),true);
 assert.equal(a.trigger("land"),false);
 assert.equal(a.trigger("takeoff"),false);
 assert.equal(a.update(run,.08).action,"hurt");
 assert.equal(a.update(run,.05).action,"hurt");
 assert.equal(a.update(run,.05).action,"hurt");
 assert.equal(a.update(run,.05).action,"hurt");
 assert.equal(a.update(run,.05).action,"run");
});

test("victory is highest priority and remains until reset",()=>{
 const a=make();
 a.trigger("hurt");
 a.update({...idle,victorious:true},.02);
 assert.equal(a.current().action,"victory");
 assert.equal(a.trigger("hurt"),false);
 for(let i=0;i<80;i++)a.update({...idle,victorious:true},.04);
 assert.equal(a.current().action,"victory");
 a.reset();
 assert.deepEqual({action:a.current().action,frame:a.current().frame},{action:"idle",frame:0});
});

test("animation timing is independent of render-loop frequency",()=>{
 const a=make(),b=make();
 for(let i=0;i<20;i++)a.update(run,.025);
 for(let i=0;i<10;i++)b.update(run,.05);
 assert.equal(a.current().action,b.current().action);
 assert.equal(a.current().frame,b.current().frame);
});

test("unknown events and missing manifests fail closed",()=>{
 assert.throws(()=>Animator.create(null),TypeError);
 assert.throws(()=>make().trigger("fly"),/Unknown/);
});
