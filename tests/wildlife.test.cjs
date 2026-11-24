const test=require("node:test");
const assert=require("node:assert/strict");
const Wildlife=require("../coast/environment/wildlife.js");
const Level=require("../coast/level.js");
function harness(){
 const draws=[];
 const g={fillStyle:null,fillRect(x,y,w,h){draws.push({x,y,w,h,color:this.fillStyle});}};
 return {g,draws};
}
test("ambient species stay visually separated from dangerous wildlife",()=>{
 assert.ok(Wildlife.BIRDS.length>=4);
 assert.ok(Wildlife.FISH.length>=4);
 assert.ok(Wildlife.VILLAGERS.length>=2);
 assert.ok(Wildlife.BIRDS.every(b=>b.y<210));
 assert.ok(Wildlife.FISH.every(f=>f.y>=Level.WATER_Y+20&&f.y<=535));
 assert.equal(Wildlife.BIRDS.some(b=>Level.fish.some(f=>f.x===b.x)),false);
});
test("bird movement is smooth, deterministic, and bounded",()=>{
 for(const bird of Wildlife.BIRDS){
  const p=Wildlife.birdPosition(bird,0);
  const p2=Wildlife.birdPosition(bird,10);
  assert.ok(Math.abs(p.x-bird.x)<=42);
  assert.ok(Math.abs(p2.x-bird.x)<=42);
  assert.ok(Math.abs(p.y-bird.y)<=4);
  assert.deepEqual(Wildlife.birdPosition(bird,10),p2);
 }
});
test("decorative fish swim only inside water with bounded movements",()=>{
 for(const fish of Wildlife.FISH){
  for(const time of [0,5,21]){
   const p=Wildlife.fishPosition(fish,time);
   assert.ok(Math.abs(p.x-fish.x)<=19);
   assert.ok(p.y>Level.WATER_Y+15);
   assert.ok(p.y<535);
  }
 }
});
test("ambient drawing is culled to the visible camera window",()=>{
 const near=harness(),far=harness();
 Wildlife.draw(near.g,0,2,Level);
 Wildlife.draw(far.g,999999,2,Level);
 assert.ok(near.draws.length>0);
 assert.equal(far.draws.length,0);
 assert.ok(near.draws.length<150);
});
test("reduced-motion mode freezes all position and flap animation",()=>{
 const a=harness(),b=harness(),animated=harness();
 Wildlife.draw(a.g,100,0,Level,{reducedMotion:true});
 Wildlife.draw(b.g,100,30,Level,{reducedMotion:true});
 Wildlife.draw(animated.g,100,30,Level);
 assert.deepEqual(a.draws,b.draws);
 assert.notDeepEqual(a.draws,animated.draws);
});
test("background figures follow existing houses but never add geometry",()=>{
 const a=harness();
 Wildlife.draw(a.g,1450,8,Level);
 assert.ok(a.draws.some(d=>d.color==="#4f7772"),"veranda silhouette drawn");
 assert.ok(a.draws.every(d=>d.w>0&&d.h>0&&[d.x,d.y,d.w,d.h].every(Number.isFinite)));
});
test("ambient rendering does not change level collisions or enemy positions",()=>{
 const snapshot={
  surfaces:JSON.stringify(Level.surfaces),
  ladders:JSON.stringify(Level.ladders),
  fish:JSON.stringify(Level.fish),
  crabs:JSON.stringify(Level.crabs),
  houses:JSON.stringify(Level.houses),
  water:Level.WATER_Y
 };
 for(const camera of [0,500,2000,3100]){
  const c=harness();
  Wildlife.draw(c.g,camera,10,Level);
 }
 assert.equal(JSON.stringify(Level.surfaces),snapshot.surfaces);
 assert.equal(JSON.stringify(Level.ladders),snapshot.ladders);
 assert.equal(JSON.stringify(Level.fish),snapshot.fish);
 assert.equal(JSON.stringify(Level.crabs),snapshot.crabs);
 assert.equal(JSON.stringify(Level.houses),snapshot.houses);
 assert.equal(Level.WATER_Y,snapshot.water);
});
test("renderer validates the canvas and tolerates missing house context",()=>{
 const c=harness();
 assert.throws(()=>Wildlife.draw(null,0,0,Level),TypeError);
 assert.throws(()=>Wildlife.draw({},0,0,Level),TypeError);
 assert.doesNotThrow(()=>Wildlife.draw(c.g,0,0,null));
});
