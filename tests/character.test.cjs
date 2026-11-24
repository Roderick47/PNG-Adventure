const test=require("node:test");
const assert=require("node:assert/strict");
const boy=require("../coast/player/character.js");

test("character manifest defines source geometry and planned poses",()=>{
 assert.equal(boy.WIDTH,48);
 assert.equal(boy.HEIGHT,64);
 assert.deepEqual(boy.ORIGIN,{x:24,y:64});
 assert.deepEqual(Object.keys(boy.FRAME_COUNTS),[
  "idle","run","takeoff","rise","apex","fall","land","crouch","crouchIdle","climb","hurt","victory"
 ]);
 assert.equal(boy.FRAME_COUNTS.idle,6);
 assert.equal(boy.FRAME_COUNTS.run,8);
 for(const [name,count] of Object.entries(boy.FRAME_COUNTS)){
  assert.ok(count>0,name+" must have frames");
  assert.ok(boy.FRAME_FPS[name]>0,name+" must have a playback rate");
 }
});

test("every pose creates correctly sized frames with nonempty deliberate paint",()=>{
 let draws=0;
 const createCanvas=(w,h)=>{
  const ctx={imageSmoothingEnabled:true,set fillStyle(_v){},fillRect(x,y,dx,dy){
   assert.ok(Number.isFinite(x)&&Number.isFinite(y));
   assert.ok(dx>0&&dy>0);
   draws++;
  }};
  return {width:w,height:h,getContext:()=>ctx};
 };
 const atlas=boy.createAtlas(createCanvas);
 let total=0;
 for(const [name,count] of Object.entries(boy.FRAME_COUNTS)){
  assert.equal(atlas[name].length,count);
  for(const image of atlas[name]){
   assert.equal(image.width,48);
   assert.equal(image.height,64);
   total++;
  }
 }
 assert.ok(total>=40);
 assert.ok(draws>=total*10);
});

test("sprites anchor feet at y coordinate and mirror safely",()=>{
 const calls=[];
 const context={
  save(){calls.push(["save"])},
  restore(){calls.push(["restore"])},
  translate(...args){calls.push(["translate",...args])},
  scale(...args){calls.push(["scale",...args])},
  drawImage(...args){calls.push(["drawImage",...args])},
  set imageSmoothingEnabled(_value){}
 };
 const atlas={idle:[{width:48,height:64}]};
 boy.draw(context,atlas,"idle",0,100,400,1,false);
 let draw=calls.find(c=>c[0]==="drawImage");
 assert.equal(draw[2],76);
 assert.equal(draw[3],336);
 assert.equal(draw[4],48);
 assert.equal(draw[5],64);
 calls.length=0;
 boy.draw(context,atlas,"idle",0,100,400,1,true);
 assert.ok(calls.some(c=>c[0]==="scale"&&c[1]===-1));
 assert.ok(calls.some(c=>c[0]==="translate"&&c[1]===124));
});

test("invalid poses and frame indices fail explicitly",()=>{
 const c={set fillStyle(_v){},fillRect(){}};
 assert.throws(()=>boy.drawFrame(c,"unknown",0),/Unknown/);
 assert.throws(()=>boy.drawFrame(c,"idle",6),RangeError);
});


test("external atlas matches committed PNG and animation manifest",()=>{
 const fs=require("node:fs"),path=require("node:path");
 const dir=path.join(__dirname,"../assets/player");
 const png=fs.readFileSync(path.join(dir,"atlas.png"));
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,"manifest.json"),"utf8"));
 assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 assert.equal(png.readUInt32BE(16),960);
 assert.equal(png.readUInt32BE(20),1344);
 assert.equal(png[25],6);
 assert.deepEqual(manifest.anchor,[48,108]);
 const ids=Object.values(manifest.animations).flat().map(f=>f.index);
 assert.equal(new Set(ids).size,116);
 for(const [action,count] of Object.entries(boy.FRAME_COUNTS)){
  assert.equal(boy.SOURCE_FRAMES[action].length,count);
  for(const id of boy.SOURCE_FRAMES[action])assert.ok(ids.includes(id));
 }
 assert.ok(!boy.SOURCE_FRAMES.rise.includes(29));
 assert.notEqual(boy.SOURCE_FRAMES.apex[0],29);
});

test("browser atlas loader preserves fallback and replaces frames in place",()=>{
 const fs=require("node:fs"),vm=require("node:vm");
 const code=fs.readFileSync(require.resolve("../coast/player/character.js"),"utf8");
 let image,ready=0,draws=0,clears=0;
 const sandbox={URL,document:{currentScript:{src:"https://example.test/coast/player/character.js"}},Image:class{constructor(){image=this;}}};
 vm.runInNewContext(code,sandbox);
 const atlas=sandbox.CoastBoy.createAtlas((w,h)=>({width:w,height:h,getContext:()=>({
  fillRect(){},clearRect(){clears++},drawImage(){draws++}
 })}),()=>ready++);
 const idle=atlas.idle[0];
 assert.equal(image.src,"https://example.test/assets/player/atlas.png");
 image.naturalWidth=1;image.naturalHeight=1;image.onload();
 assert.equal(clears,0);assert.equal(ready,0);
 image.naturalWidth=960;image.naturalHeight=1344;image.onload();
 assert.equal(atlas.idle[0],idle);
 assert.equal(draws,Object.values(boy.FRAME_COUNTS).reduce((a,b)=>a+b,0));
 assert.equal(clears,draws);assert.equal(ready,1);
});
