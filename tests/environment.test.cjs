const test=require("node:test");
const assert=require("node:assert/strict");
const Village=require("../coast/environment/village.js");
const Vegetation=require("../coast/environment/vegetation.js");
const Level=require("../coast/level.js");

function canvas(){
  const draws=[],transforms=[];
  const g={
    fillStyle:"",
    fillRect(x,y,w,h){draws.push({x,y,w,h,c:this.fillStyle});},
    save(){transforms.push(["save"]);},
    restore(){transforms.push(["restore"]);},
    translate(x,y){transforms.push(["translate",x,y]);},
    scale(x,y){transforms.push(["scale",x,y]);}
  };
  return {g,draws,transforms};
}
test("house details use original house positions and restore draw transforms",()=>{
 const {g,draws,transforms}=canvas();
 Village.draw(g,0,Level.houses);
 assert.ok(draws.length>30);
 assert.equal(transforms.filter(t=>t[0]==="save").length,
              transforms.filter(t=>t[0]==="restore").length);
 const x=transforms.find(t=>t[0]==="translate");
 assert.deepEqual(x,["translate",112,313]);
});
test("camera culling avoids drawing off-screen village details",()=>{
 const a=canvas(),b=canvas();
 Village.draw(a.g,0,Level.houses);
 Village.draw(b.g,50000,Level.houses);
 assert.ok(a.draws.length>0);
 assert.equal(b.draws.length,0);
});
test("village pixel art includes woven patterns and fishing props",()=>{
 const a=canvas();
 Village.draw(a.g,1100,Level.houses);
 const palette=new Set(a.draws.map(d=>d.c));
 assert.ok(palette.has(Village.COLORS.weave));
 assert.ok(palette.has(Village.COLORS.rope));
 assert.ok(palette.has(Village.COLORS.fish)||palette.has(Village.COLORS.basket));
});
test("vegetation has multiple plant types and consistent world placements",()=>{
 const kinds=new Set(Vegetation.PLANTS.map(p=>p.type));
 assert.deepEqual([...kinds].sort(),["flower","palm","shrub"]);
 assert.ok(Vegetation.PLANTS.length>=12);
 assert.ok(Vegetation.PLANTS.every(p=>p.x>=0&&p.x<=Level.WORLD_WIDTH&&p.y<Level.WATER_Y));
});
test("vegetation camera culling limits draw work",()=>{
 const near=canvas(),far=canvas();
 Vegetation.draw(near.g,0,4);
 Vegetation.draw(far.g,999999,4);
 assert.ok(near.draws.length>0);
 assert.equal(far.draws.length,0);
});
test("reduced-motion vegetation remains deterministic at different times",()=>{
 const a=canvas(),b=canvas(),c=canvas();
 Vegetation.draw(a.g,0,0,{reducedMotion:true});
 Vegetation.draw(b.g,0,50,{reducedMotion:true});
 Vegetation.draw(c.g,0,50,{reducedMotion:false});
 assert.deepEqual(a.draws,b.draws);
 assert.notDeepEqual(a.draws,c.draws);
});
test("new scenery does not change the collision layout or existing hazards",()=>{
 const before={
  platform:JSON.stringify(Level.surfaces),ladders:JSON.stringify(Level.ladders),
  houses:JSON.stringify(Level.houses),fish:JSON.stringify(Level.fish),crabs:JSON.stringify(Level.crabs)
 };
 const a=canvas();
 Village.draw(a.g,1400,Level.houses);
 Vegetation.draw(a.g,1400,4);
 assert.equal(JSON.stringify(Level.surfaces),before.platform);
 assert.equal(JSON.stringify(Level.ladders),before.ladders);
 assert.equal(JSON.stringify(Level.houses),before.houses);
 assert.equal(JSON.stringify(Level.fish),before.fish);
 assert.equal(JSON.stringify(Level.crabs),before.crabs);
});
test("renderers validate inputs without affecting physics state",()=>{
 assert.throws(()=>Village.draw(null,0,Level.houses),TypeError);
 assert.throws(()=>Vegetation.draw({},0,0),TypeError);
 const a=canvas();
 assert.doesNotThrow(()=>Village.draw(a.g,0,[]));
 assert.doesNotThrow(()=>Vegetation.draw(a.g,0,0));
});
