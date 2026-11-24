const test=require("node:test");
const assert=require("node:assert/strict");
const Water=require("../coast/environment/water.js");
const L=require("../coast/level.js");
function harness(){
  const draws=[];
  const g={fillStyle:null,fillRect(x,y,w,h){draws.push({x,y,w,h,color:this.fillStyle});}};
  return {g,draws};
}
function world(){
  return {
    surfaces:L.surfaces,
    canoes:[{x:503,y:441,w:108,direction:1}],
    splashes:[{x:513,y:L.WATER_Y+5,age:.2,kind:"canoe"}]
  };
}
test("water decoration is limited to lagoon below unchanged hazard height",()=>{
 const a=harness();
 Water.draw(a.g,150,5,L.WATER_Y,world());
 assert.ok(a.draws.length>20);
 assert.ok(a.draws.every(d=>d.y>=L.WATER_Y+2-10),"only splash droplets may rise above surface");
 assert.ok(a.draws.find(d=>d.h===62&&d.y===L.WATER_Y+2));
 assert.equal(L.WATER_Y,471);
});
test("waves remain view-bounded even with far camera and entire level surfaces",()=>{
 const first=harness(),far=harness();
 Water.draw(first.g,0,0,L.WATER_Y,world());
 Water.draw(far.g,1e8,0,L.WATER_Y,world());
 assert.ok(first.draws.length<220);
 assert.ok(far.draws.length<220);
 assert.ok(far.draws.length<=first.draws.length);
});
test("canoe wake follows world position and travel direction",()=>{
 const left=harness(),right=harness();
 Water.draw(left.g,500,0,471,{canoes:[{x:580,w:108,direction:-1}]},{reducedMotion:true});
 Water.draw(right.g,500,0,471,{canoes:[{x:580,w:108,direction:1}]},{reducedMotion:true});
 const findWake=r=>r.draws.filter(d=>d.color==="#c7eee0");
 assert.equal(findWake(left).length,1);
 assert.equal(findWake(right).length,1);
 assert.ok(findWake(left)[0].x>findWake(right)[0].x);
});
test("splash pool is bounded, expires and resets without modifying player",()=>{
 const water=Water.create(),player={x:520,feet:440};
 for(let i=0;i<100;i++)water.splash(500+i,472,"canoe");
 assert.equal(water.count(),Water.MAX_SPLASHES);
 const snapshot=water.snapshot();
 snapshot[0].age=999;
 assert.notEqual(water.snapshot()[0].age,999);
 water.advance(.1);
 assert.equal(water.count(),Water.MAX_SPLASHES);
 for(let i=0;i<8;i++)water.advance(.1);
 assert.equal(water.count(),0);
 water.splash(510,477);
 water.reset();
 assert.equal(water.count(),0);
 assert.deepEqual(player,{x:520,feet:440});
});
test("invalid coordinates do not add splash particles",()=>{
 const w=Water.create();
 w.splash(NaN,490);w.splash(100,Infinity);
 assert.equal(w.count(),0);
 w.advance(NaN);
 assert.equal(w.count(),0);
});
test("reduced motion freezes wave movement but retains static atmosphere",()=>{
 const a=harness(),b=harness(),animated=harness();
 Water.draw(a.g,200,0,471,world(),{reducedMotion:true});
 Water.draw(b.g,200,10,471,world(),{reducedMotion:true});
 Water.draw(animated.g,200,10,471,world(),{reducedMotion:false});
 assert.deepEqual(a.draws,b.draws);
 assert.notDeepEqual(a.draws,animated.draws);
});
test("without scenery objects, renderer works and validates canvas",()=>{
 const a=harness();
 assert.doesNotThrow(()=>Water.draw(a.g,0,0,471));
 assert.throws(()=>Water.draw(null,0,0,471),TypeError);
 assert.throws(()=>Water.draw({},0,0,471),TypeError);
});
