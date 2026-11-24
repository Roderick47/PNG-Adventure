const test=require("node:test");
const assert=require("node:assert/strict");
const Feedback=require("../coast/environment/feedback.js");
const Level=require("../coast/level.js");
const Breakaways=require("../coast/world/breakaways.js");
const Nets=require("../coast/world/nets.js");
function harness(){
 const rects=[];
 const g={fillStyle:"",fillRect(x,y,w,h){rects.push({x,y,w,h,color:this.fillStyle});}};
 return {g,rects};
}
const scene=()=>({
 player:{x:1169,feet:418},surfaces:Level.surfaces,
 breakaways:Breakaways.PLANKS.map(p=>({...p,state:"intact"})),
 netClimbs:Nets.CLIMBS,ladders:Level.ladders,
 coins:Level.coinGroups.map(([x,y])=>({x,y,taken:false})),
 checkpoint:Level.checkpoint,activated:false,
 crabs:Level.crabs.map(p=>({...p,alive:true}))
});
test("feedback creates bounded effects and ignores invalid events",()=>{
 const f=Feedback.create();
 assert.equal(f.emit("unknown",4,5),false);
 assert.equal(f.emit("jump",NaN,5),false);
 assert.equal(f.count(),0);
 for(let i=0;i<200;i++)assert.equal(f.emit("jump",100+i,400),true);
 assert.equal(f.count(),Feedback.MAX_EFFECTS);
 assert.equal(f.snapshot()[0].x,260);
 const list=f.snapshot();
 list[0].age=99;
 assert.notEqual(f.snapshot()[0].age,99);
});
test("particle lifecycle is frame driven and restart clears it",()=>{
 const f=Feedback.create();
 f.emit("collect",400,310);
 f.advance(.1);
 assert.ok(f.snapshot()[0].age>0);
 f.advance(NaN);f.advance(-3);
 assert.equal(f.count(),1);
 for(let i=0;i<6;i++)f.advance(.1);
 assert.equal(f.count(),0);
 f.emit("checkpoint",500,300);
 f.reset();
 assert.equal(f.count(),0);
});
test("effect rendering is culled and distinguishes event kinds",()=>{
 const near=harness(),far=harness();
 const effects=[
  {type:"collect",x:200,y:300,age:.1},
  {type:"land",x:250,y:320,age:.2},
  {type:"danger",x:270,y:360,age:.2},
  {type:"canoe",x:10000,y:400,age:.1}
 ];
 Feedback.drawEffects(near.g,0,effects);
 Feedback.drawEffects(far.g,20000,effects);
 assert.ok(near.rects.length>6);
 assert.equal(far.rects.length,0);
 assert.ok(near.rects.some(r=>r.color===Feedback.COLORS.collect));
 assert.ok(near.rects.some(r=>r.color===Feedback.COLORS.danger));
 assert.equal(near.rects.some(r=>r.color===Feedback.COLORS.canoe),false);
});
test("fragile boards and safe timber have different non-color-only cues",()=>{
 const c=harness();
 Feedback.drawCues(c.g,600,0,scene(),{reducedMotion:true});
 assert.ok(c.rects.some(r=>r.color===Feedback.COLORS.safe));
 assert.ok(c.rects.some(r=>r.color===Feedback.COLORS.wood));
 const s=scene();s.breakaways[0].state="warning";
 const d=harness();Feedback.drawCues(d.g,600,0,s,{reducedMotion:true});
 assert.ok(d.rects.some(r=>r.color===Feedback.COLORS.danger));
});
test("climbing arrow appears only near climbable ladder or net",()=>{
 const s=scene();s.player.x=1168;s.player.feet=370;
 s.surfaces=[];s.breakaways=[];s.crabs=[];s.coins=[];s.checkpoint=null;
 const near=harness();Feedback.drawCues(near.g,1050,0,s);
 assert.ok(near.rects.some(r=>r.color===Feedback.COLORS.net));
 s.player.x=700;
 const far=harness();Feedback.drawCues(far.g,1050,0,s);
 assert.equal(far.rects.some(r=>r.color===Feedback.COLORS.net),false);
});
test("collected tokens do not retain their glint",()=>{
 const s=scene();s.surfaces=[];s.breakaways=[];s.crabs=[];
 s.checkpoint=null;s.ladders=[];s.netClimbs=[];s.player=null;
 s.coins=[{x:120,y:330,taken:false},{x:170,y:330,taken:true}];
 const a=harness();Feedback.drawCues(a.g,0,0,s,{reducedMotion:true});
 assert.equal(a.rects.length,2);
 assert.ok(a.rects.every(r=>r.x<135));
});
test("reduced motion stops decorative cue movement",()=>{
 const a=harness(),b=harness(),animated=harness();
 Feedback.draw(a.g,140,0,scene(),[{type:"land",x:190,y:402,age:.2}],{reducedMotion:true});
 Feedback.draw(b.g,140,70,scene(),[{type:"land",x:190,y:402,age:.2}],{reducedMotion:true});
 Feedback.draw(animated.g,140,70,scene(),[{type:"land",x:190,y:402,age:.2}],{reducedMotion:false});
 assert.deepEqual(a.rects,b.rects);
 assert.notDeepEqual(a.rects,animated.rects);
});
test("drawing cannot mutate physics geometry, enemy or collectible state",()=>{
 const s=scene();
 const before=JSON.stringify(s);
 for(const camera of [0,800,1800,3000]){
  const a=harness();Feedback.draw(a.g,camera,4,s,[{type:"checkpoint",x:1727,y:350,age:.2}]);
 }
 assert.equal(JSON.stringify(s),before);
 assert.equal(Level.WATER_Y,471);
});
test("renderer rejects invalid canvas and accepts empty scene",()=>{
 assert.throws(()=>Feedback.draw(null,0,0),TypeError);
 assert.throws(()=>Feedback.draw({},0,0),TypeError);
 const a=harness();assert.doesNotThrow(()=>Feedback.draw(a.g,0,0));
});
