const test=require("node:test");
const assert=require("node:assert/strict");
const Parallax=require("../coast/environment/parallax.js");
const L=require("../coast/level.js");

function harness(){
  const blocks=[],clouds=[],calls=[];
  const g={
    fillStyle:null,
    fillRect(x,y,w,h){blocks.push({x,y,w,h,color:this.fillStyle});},
    createLinearGradient(_x1,_y1,_x2,_y2){
      const stops=[];
      calls.push(stops);
      return {addColorStop(at,color){stops.push([at,color]);}};
    }
  };
  const art={
    house(_g,x,y,scale,tint){clouds.push(["house",x,y,scale,tint]);},
    palm(_g,x,y,scale){clouds.push(["palm",x,y,scale]);},
    boat(_g,x,y){clouds.push(["boat",x,y]);}
  };
  return {g,blocks,clouds,calls,art};
}
test("background layer camera speeds increase toward the foreground",()=>{
 const {clouds,farIslands,nearIslands,vegetation}=Parallax.LAYERS;
 assert.ok(clouds.speed<farIslands.speed);
 assert.ok(farIslands.speed<nearIslands.speed);
 assert.ok(nearIslands.speed<vegetation.speed);
 assert.equal(Parallax.WIDTH,960);
 assert.equal(Parallax.HEIGHT,540);
 assert.equal(Parallax.HORIZON,457);
});
test("parallax offsets wrap smoothly and are independent of frame rate",()=>{
 const layer=Parallax.LAYERS.farIslands;
 assert.equal(Parallax.offset(0,layer.speed,layer.spacing),0);
 assert.ok(Math.abs(Parallax.offset(100,layer.speed,layer.spacing)-10)<1e-9);
 assert.ok(Math.abs(Parallax.offset(100+layer.spacing/layer.speed,layer.speed,layer.spacing)-10)<1e-8);
 assert.equal(Parallax.offset(NaN,layer.speed,layer.spacing),0);
});
test("each layer draws a bounded number of visible cells even for huge camera values",()=>{
 const layer=Parallax.LAYERS.vegetation;
 let first=0,large=0;
 Parallax.repeat(null,0,layer,()=>first++);
 Parallax.repeat(null,100000000,layer,()=>large++);
 assert.equal(first,large);
 assert.ok(first<=Math.ceil(960/layer.spacing)+3);
});
test("draw paints the complete sky/ocean and original village silhouettes",()=>{
 const {g,blocks,clouds,calls,art}=harness();
 Parallax.draw(g,140,2,art);
 assert.ok(calls.length>=1);
 assert.equal(calls[0][0][0],0);
 assert.equal(calls[0].at(-1)[0],1);
 assert.ok(blocks.some(b=>b.x===0&&b.y===0&&b.w===960&&b.h===540));
 assert.ok(blocks.some(b=>b.y===457&&b.h===83));
 assert.ok(clouds.some(c=>c[0]==="house"));
 assert.ok(clouds.some(c=>c[0]==="palm"));
 assert.ok(clouds.some(c=>c[0]==="boat"));
 assert.ok(blocks.every(b=>[b.x,b.y,b.w,b.h].every(Number.isFinite)));
});
test("different cameras move nearer scenery more than distant scenery",()=>{
 const a=harness(),b=harness();
 Parallax.draw(a.g,0,1,a.art);
 Parallax.draw(b.g,200,1,b.art);
 const nearShift=a.clouds.find(v=>v[0]==="house")[1]-b.clouds.find(v=>v[0]==="house")[1];
 assert.ok(Math.abs(nearShift-80)<1e-7);
 const cloudLayer=Parallax.LAYERS.clouds;
 assert.ok(nearShift>200*cloudLayer.speed);
});
test("reduced motion suppresses time-based cloud drift and boat bob",()=>{
 const a=harness(),b=harness();
 Parallax.draw(a.g,100,0,a.art,{reducedMotion:true});
 Parallax.draw(b.g,100,150,b.art,{reducedMotion:true});
 assert.deepEqual(a.blocks,b.blocks);
 assert.deepEqual(a.clouds,b.clouds);
 const c=harness();
 Parallax.draw(c.g,100,5,c.art,{reducedMotion:false});
 assert.notDeepEqual(a.blocks,c.blocks);
});
test("renderer never changes level collision or gameplay state",()=>{
 const before={
  surfaces:L.surfaces.map(s=>({...s})),
  ladders:L.ladders.map(l=>({...l})),
  water:L.WATER_Y,
  checkpoint:{...L.checkpoint}
 };
 const a=harness();
 Parallax.draw(a.g,2500,5,a.art);
 assert.deepEqual(L.surfaces,before.surfaces);
 assert.deepEqual(L.ladders,before.ladders);
 assert.equal(L.WATER_Y,before.water);
 assert.deepEqual(L.checkpoint,before.checkpoint);
});
test("renders when art helpers are not supplied and fails on invalid context",()=>{
 const a=harness();
 assert.doesNotThrow(()=>Parallax.draw(a.g,0,0,null));
 assert.throws(()=>Parallax.draw(null,0,0),TypeError);
 assert.throws(()=>Parallax.draw({},0,0),TypeError);
});
