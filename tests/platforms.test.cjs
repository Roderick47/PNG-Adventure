const test=require("node:test");
const assert=require("node:assert/strict");
const L=require("../coast/level.js");
const Platform=require("../coast/world/platforms.js");
const Controller=require("../coast/player/controller.js");
const empty={left:false,right:false,up:false,down:false,jump:false};
const make=()=>{
  const manager=Platform.create(),player={};
  const controller=Controller.create(L,player,undefined,manager);
  return {manager,player,controller};
};
function simulate(controller,seconds,fps=60,keys=empty){
  let elapsed=0;
  let last=null;
  while(elapsed<seconds-1e-9){
    const dt=Math.min(1/fps,seconds-elapsed);
    last=controller.step(keys,dt);
    elapsed+=dt;
  }
  return last;
}
function moving(manager,opts={}){
  return manager.register({
    id:"canoe-prototype",type:"test-moving",x:200,y:300,w:120,
    update(dt,p){p.x+=60*dt;},
    ...opts
  });
}

test("registry rejects invalid IDs, duplicates, and invalid geometry",()=>{
 const manager=Platform.create();
 assert.throws(()=>manager.register({x:1,y:2,w:20}),TypeError);
 assert.throws(()=>manager.register({id:"bad",x:1,y:2,w:0}),RangeError);
 manager.register({id:"safe",x:1,y:2,w:20});
 assert.throws(()=>manager.register({id:"safe",x:3,y:4,w:10}),/Duplicate/);
 assert.throws(()=>manager.advance(-1),RangeError);
 assert.equal(manager.size(),1);
});

test("moving surface tracks collision geometry independently of rendering",()=>{
 const manager=Platform.create(),p=moving(manager);
 const initial=manager.getSurfaces()[0];
 assert.equal(initial.y,300);
 manager.advance(1/120);
 const current=manager.getSurface(p.id);
 assert.ok(current.x>initial.x);
 assert.equal(current.y,initial.y);
 assert.equal(manager.getDelta(p.id).dx,0.5);
 assert.equal(manager.getDelta(p.id).dy,0);
 assert.equal(L.surfaces.length,16,"fixed level surfaces stay unchanged");
});

test("standing player is carried horizontally by platform without input",()=>{
 const {manager,player,controller}=make();
 moving(manager);
 controller.reset(230,300);
 simulate(controller,.04);
 assert.equal(player.grounded,true);
 assert.equal(player.supportId,"canoe-prototype");
 const x=player.x;
 simulate(controller,1);
 assert.ok(player.x>x+58 && player.x<x+62,JSON.stringify({x,now:player.x}));
 assert.equal(player.feet,300);
 assert.equal(player.vx,0);
});

test("moving platform carries rider vertically without sinking or snapping",()=>{
 const {manager,player,controller}=make();
 moving(manager,{update(dt,p){p.x+=30*dt;p.y-=10*dt;}});
 controller.reset(230,300);
 simulate(controller,.03);
 const y=player.feet;
 simulate(controller,.6);
 assert.ok(player.feet<y-5);
 assert.ok(Math.abs(player.feet-manager.getSurface("canoe-prototype").y)<0.0001);
 assert.equal(player.grounded,true);
});

test("player can jump from moving platform; momentum comes from player input",()=>{
 const {manager,player,controller}=make();
 moving(manager);
 controller.reset(230,300);
 simulate(controller,.04);
 controller.requestJump();
 const event=controller.step({...empty,jump:true},1/120);
 assert.equal(event.jumped,true);
 assert.equal(player.grounded,false);
 assert.equal(player.supportId,null);
 assert.ok(player.vy<0);
 const x=player.x;
 simulate(controller,.15,120,{...empty,jump:true});
 assert.ok(player.x===x,"player is no longer carried while airborne");
});

test("landing event fires once on a dynamic surface",()=>{
 const {manager,player,controller}=make();
 let touched=0;
 moving(manager,{update(){},onLand(){touched++;}});
 controller.reset(230,240);
 player.grounded=false;player.vy=60;
 let landed=false;
 for(let i=0;i<100;i++){
   const event=controller.step(empty,1/120);
   if(event.landed)landed=true;
   if(landed)break;
 }
 assert.equal(landed,true);
 assert.equal(touched,1);
 assert.equal(player.feet,300);
 assert.equal(player.supportId,"canoe-prototype");
 simulate(controller,.4);
 assert.equal(touched,1,"standing still cannot retrigger landing");
});

test("disappearing platform removes collision and releases rider into fall",()=>{
 const {manager,player,controller}=make();
 const platform=moving(manager,{update(){}});
 controller.reset(230,300);
 simulate(controller,.04);
 assert.equal(player.supportId,platform.id);
 platform.solid=false;
 simulate(controller,.06);
 assert.equal(manager.getSurface(platform.id),null);
 assert.equal(player.grounded,false);
 assert.equal(player.supportId,null);
 assert.ok(player.feet>300);
});

test("platform can be disabled without changing static level collision",()=>{
 const {manager,player,controller}=make();
 moving(manager,{enabled:false});
 assert.equal(manager.getSurfaces().length,0);
 controller.reset(85,L.FLOOR);
 simulate(controller,.3);
 assert.equal(player.grounded,true);
 assert.equal(player.feet,L.FLOOR);
 assert.equal(player.supportId,null);
});

test("world reset restores original state and clears frame displacement",()=>{
 const {manager,player,controller}=make();
 const obj=moving(manager,{state:"moving"});
 simulate(controller,.2);
 obj.enabled=false;obj.state="collapsed";obj.solid=false;
 manager.reset();
 assert.deepEqual(manager.getDelta(obj.id),{dx:0,dy:0});
 assert.equal(obj.x,200);
 assert.equal(obj.y,300);
 assert.equal(obj.enabled,true);
 assert.equal(obj.solid,true);
 assert.equal(obj.state,"moving");
 assert.equal(manager.getSurface(obj.id).x,200);
});

test("platform travel is consistent across 30/60/120 FPS inputs",()=>{
 const run=fps=>{
   const {manager,player,controller}=make();
   moving(manager);
   controller.reset(230,300);
   simulate(controller,1,fps);
   return {x:player.x,feet:player.feet,surface:manager.getSurface("canoe-prototype").x};
 };
 const reference=run(120);
 for(const hz of [30,60]){
   const actual=run(hz);
   assert.ok(Math.abs(actual.x-reference.x)<.01,JSON.stringify([hz,actual,reference]));
   assert.ok(Math.abs(actual.feet-reference.feet)<.01);
   assert.ok(Math.abs(actual.surface-reference.surface)<.01);
 }
});
