const test=require("node:test");
const assert=require("node:assert/strict");
const Interactions=require("../coast/world/interactions.js");
const Level=require("../coast/level.js");
function mock(){const calls=[];const g={fillStyle:"",fillRect(x,y,w,h){calls.push([x,y,w,h,this.fillStyle]);}};return {g,calls};}
test("interactive locations are spread across the existing Stilt Village route",()=>{
 const names=new Set(Interactions.OBJECTS.map(o=>o.id));
 assert.equal(names.size,Interactions.OBJECTS.length);
 assert.ok(names.size>=4);
 assert.ok(Interactions.OBJECTS.some(o=>o.kind==="villager"));
 assert.ok(Interactions.OBJECTS.some(o=>o.kind==="sign"));
 for(const o of Interactions.OBJECTS){
  assert.ok(o.x>0&&o.x<Level.WORLD_WIDTH);
  assert.ok(Level.surfaces.some(p=>o.x>=p.x&&o.x<=p.x+p.w&&Math.abs(p.y-o.y)<2));
  assert.ok(o.text.length>24&&o.text.length<140);
 }
});
test("only a nearby player at the correct height can interact",()=>{
 const target=Interactions.OBJECTS[0];
 assert.equal(Interactions.nearest({x:target.x,feet:target.y}).id,target.id);
 assert.equal(Interactions.nearest({x:target.x+Interactions.RANGE+1,feet:target.y}),null);
 assert.equal(Interactions.nearest({x:target.x,feet:target.y+Interactions.HEIGHT+1}),null);
 assert.equal(Interactions.nearest({x:NaN,feet:target.y}),null);
 assert.equal(Interactions.nearest(null),null);
});
test("each location is recorded once and reset clears discoveries",()=>{
 const logic=Interactions.create();
 const objects=Interactions.OBJECTS;
 assert.equal(logic.progress(),0);
 assert.equal(logic.interact({x:-100,feet:432}),null);
 const a=logic.interact({x:objects[0].x,feet:objects[0].y});
 assert.equal(a.first,true);assert.equal(a.discovered,1);
 assert.equal(a.total,objects.length);
 const again=logic.interact({x:objects[0].x,feet:objects[0].y});
 assert.equal(again.first,false);assert.equal(again.discovered,1);
 const b=logic.interact({x:objects[1].x,feet:objects[1].y});
 assert.equal(b.discovered,2);
 logic.reset();
 assert.equal(logic.progress(),0);
});
test("camera-culled prop renderer does not draw the entire world",()=>{
 const a=mock(),b=mock();
 Interactions.draw(a.g,0,1,{x:225,feet:432});
 Interactions.draw(b.g,99000,1,{x:225,feet:432});
 assert.ok(a.calls.length>0);
 assert.equal(b.calls.length,0);
 assert.ok(a.calls.length<70);
});
test("interaction prompt is visible only in reach",()=>{
 const near=mock(),far=mock();
 Interactions.draw(near.g,0,1,{x:225,feet:432},{reducedMotion:true});
 Interactions.draw(far.g,0,1,{x:50,feet:432},{reducedMotion:true});
 assert.ok(near.calls.length>far.calls.length);
});
test("reduced motion freezes prompt bob and geometry",()=>{
 const a=mock(),b=mock();
 Interactions.draw(a.g,0,0,{x:225,feet:432},{reducedMotion:true});
 Interactions.draw(b.g,0,55,{x:225,feet:432},{reducedMotion:true});
 assert.deepEqual(a.calls,b.calls);
});
test("interactions cannot change level layout, enemies, atlas or collectibles",()=>{
 const before=JSON.stringify({surfaces:Level.surfaces,fish:Level.fish,crabs:Level.crabs,coins:Level.coinGroups,houses:Level.houses});
 const state=Interactions.create();
 for(const o of Interactions.OBJECTS)state.interact({x:o.x,feet:o.y});
 const c=mock();Interactions.draw(c.g,1500,2,{x:1837,feet:390});
 assert.equal(JSON.stringify({surfaces:Level.surfaces,fish:Level.fish,crabs:Level.crabs,coins:Level.coinGroups,houses:Level.houses}),before);
});
test("invalid drawing contexts reject while no actor is accepted",()=>{
 const c=mock();
 assert.throws(()=>Interactions.draw(null,0,0,null),TypeError);
 assert.doesNotThrow(()=>Interactions.draw(c.g,0,0,null));
});
