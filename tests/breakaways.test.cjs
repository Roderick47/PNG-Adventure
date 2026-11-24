const test=require("node:test");
const assert=require("node:assert/strict");
const L=require("../coast/level.js");
const Registry=require("../coast/world/platforms.js");
const Breakaways=require("../coast/world/breakaways.js");
const Controller=require("../coast/player/controller.js");
const Canoes=require("../coast/world/canoes.js");
const quiet={left:false,right:false,up:false,down:false,jump:false};
function setup(items,options){
 const manager=Registry.create(),player={};
 const planks=Breakaways.install(manager,player,items,options);
 const controller=Controller.create(L,player,undefined,manager);
 return {manager,player,planks,controller};
}
function frames(controller,duration,rate=120,keys=quiet){
 let remaining=duration;
 let last=null;
 while(remaining>1e-9){
  const dt=Math.min(1/rate,remaining);
  last=controller.step(keys,dt);
  remaining-=dt;
 }
 return last;
}
function sample(id="test",x=603,y=341,w=100){return [{id,x,y,w}];}

test("three optional breakaways sit above existing permanent walkway safety nets",()=>{
 assert.equal(Breakaways.PLANKS.length,3);
 assert.equal(new Set(Breakaways.PLANKS.map(x=>x.id)).size,3);
 for(const p of Breakaways.PLANKS){
  assert.ok(L.surfaces.some(s=>s.y>p.y&&s.y-p.y<90&&
    s.x<p.x+p.w&&s.x+s.w>p.x),"each plank has permanent support below");
 }
 assert.equal(L.platforms.length,12,"original routes are untouched");
});

test("breakaway is solid until first landing, then starts full warning",()=>{
 const {manager,player,planks,controller}=setup(sample());
 controller.reset(650,290);
 player.grounded=false;player.vy=45;
 let landed=false;
 for(let n=0;n<100;n++){
  const e=controller.step(quiet,1/120);
  if(e.landed&&player.supportId==="test"){landed=true;break;}
 }
 assert.equal(landed,true);
 assert.equal(planks[0].state,"warning");
 assert.equal(planks[0].solid,true);
 assert.equal(planks[0].remaining,Breakaways.WARNING);
 assert.notEqual(manager.getSurface("test"),null);
});

test("warning continues through physics frames and disappears at expiry",()=>{
 const {manager,player,planks,controller}=setup(sample());
 controller.reset(650,341);
 frames(controller,.05);
 // Spawned standing on the board: explicitly simulate its initial landing.
 manager.onLand("test",player);
 frames(controller,.45);
 assert.equal(planks[0].state,"warning");
 assert.equal(planks[0].solid,true);
 frames(controller,.22);
 assert.equal(planks[0].state,"collapsed");
 assert.equal(planks[0].solid,false);
 assert.equal(manager.getSurface("test"),null);
 assert.equal(player.supportId,null);
 assert.equal(player.grounded,false);
 assert.ok(player.feet>341);
});

test("the player can jump away after cracking begins",()=>{
 const {player,planks,controller,manager}=setup(sample());
 controller.reset(640,341);
 frames(controller,.025);
 manager.onLand("test",player);
 controller.requestJump();
 const ev=controller.step({...quiet,jump:true},1/120);
 assert.equal(ev.jumped,true);
 assert.ok(player.vy<0);
 assert.equal(player.supportId,null);
 assert.equal(planks[0].state,"warning");
});

test("collapsed plank recovers after 2.5 seconds when the area is clear",()=>{
 const {manager,player,planks,controller}=setup(sample());
 controller.reset(640,341);
 frames(controller,.025);
 manager.onLand("test",player);
 frames(controller,.70);
 assert.equal(planks[0].state,"collapsed");
 // Keep the player well away from the plank during recovery.
 player.x=300;player.feet=L.FLOOR;
 frames(controller,2.6);
 assert.equal(planks[0].state,"intact");
 assert.equal(planks[0].remaining,0);
 assert.equal(planks[0].solid,true);
 assert.ok(manager.getSurface("test"));
});

test("plank never respawns within a nearby player hitbox",()=>{
 const {manager,player,planks,controller}=setup(sample());
 controller.reset(640,341);
 frames(controller,.015);
 manager.onLand("test",player);
 frames(controller,.7);
 assert.equal(planks[0].state,"collapsed");
 player.x=640;player.feet=335;player.grounded=false;player.vy=0;
 frames(controller,2.55);
 // Player is no longer in the danger zone if gravity naturally drops them
 // to the permanent lower walkway; hold their position for a direct manager test.
 planks[0].state="collapsed";planks[0].remaining=0;planks[0].solid=false;
 player.x=640;player.feet=338;
 manager.advance(1/120);
 assert.equal(planks[0].state,"collapsed");
 assert.equal(planks[0].solid,false);
 player.x=800;
 manager.advance(1/120);
 assert.equal(planks[0].state,"intact");
 assert.equal(planks[0].solid,true);
});

test("restart restores intact planks and forgets warning timer",()=>{
 const {manager,player,planks,controller}=setup(sample());
 controller.reset(640,341);
 frames(controller,.025);
 manager.onLand("test",player);
 frames(controller,.75);
 assert.equal(planks[0].state,"collapsed");
 manager.reset();
 assert.equal(planks[0].state,"intact");
 assert.equal(planks[0].solid,true);
 assert.equal(planks[0].remaining,0);
 assert.ok(manager.getSurface("test"));
});

test("intact→warning→collapsed sequence agrees at 30/60/120 FPS",()=>{
 function run(fps){
  const {manager,controller,player,planks}=setup(sample());
  controller.reset(640,341);
  manager.onLand("test",player);
  frames(controller,.56,fps);
  const warn={state:planks[0].state,remaining:planks[0].remaining};
  frames(controller,.25,fps);
  const fallen=planks[0].state;
  player.x=850;player.feet=432;
  frames(controller,2.55,fps);
  return {warn,fallen,recovered:planks[0].state};
 }
 const reference=run(120);
 for(const fps of [30,60]){
  const v=run(fps);
  assert.equal(v.warn.state,"warning");
  assert.ok(Math.abs(v.warn.remaining-reference.warn.remaining)<.01);
  assert.equal(v.fallen,"collapsed");
  assert.equal(v.recovered,"intact");
 }
});

test("breakaways remain compatible with moving canoes and static ground",()=>{
 const {manager,player,controller}=setup(sample());
 Canoes.install(manager,[{id:"boat",minX:100,maxX:220,w:100,y:441,speed:40,phase:0}]);
 controller.reset(85,L.FLOOR);
 frames(controller,1);
 assert.equal(player.grounded,true);
 assert.equal(player.feet,L.FLOOR);
 assert.ok(manager.getSurface("boat"));
 assert.ok(manager.getSurface("test"));
});

test("invalid timing and bad plank geometry fail closed",()=>{
 const manager=Registry.create(),player={};
 assert.throws(()=>Breakaways.install(null,player),TypeError);
 assert.throws(()=>Breakaways.install(manager,null),TypeError);
 assert.throws(()=>Breakaways.install(manager,player,sample(),{warning:0}),RangeError);
 assert.throws(()=>Breakaways.install(manager,player,[{id:"bad",x:0,y:0,w:0}]),RangeError);
});
