const test=require("node:test");
const assert=require("node:assert/strict");
const L=require("../coast/level.js");
const Platforms=require("../coast/world/platforms.js");
const Canoes=require("../coast/world/canoes.js");
const Controller=require("../coast/player/controller.js");
const noKeys={left:false,right:false,up:false,down:false,jump:false};
const EPS=1e-7;
function setup(routes){
  const manager=Platforms.create();
  const canoes=Canoes.install(manager,routes);
  const player={};
  const controller=Controller.create(L,player,undefined,manager);
  return {manager,canoes,player,controller};
}
function stepFor(controller,seconds,fps=60,keys=noKeys){
  let elapsed=0,last=null;
  while(elapsed<seconds-1e-9){
    const h=Math.min(1/fps,seconds-elapsed);
    last=controller.step(keys,h);elapsed+=h;
  }
  return last;
}

test("three nonblocking canoe routes are placed beside existing lagoon walkways",()=>{
 assert.equal(Canoes.ROUTES.length,3);
 const ids=new Set(Canoes.ROUTES.map(p=>p.id));
 assert.equal(ids.size,3);
 for(const r of Canoes.ROUTES){
  assert.ok(r.maxX>r.minX&&r.speed>0);
  assert.ok(r.y<L.WATER_Y&&r.y>430,"deck stays above water and below boardwalk");
  assert.ok(r.w>=100&&r.w<130);
  assert.ok(r.maxX+r.w<L.WORLD_WIDTH);
 }
 assert.equal(L.platforms.length,12,"original paths remain unchanged");
});

test("canoes reverse continuously at each endpoint without overshoot",()=>{
 const route={id:"ferry",minX:100,maxX:200,w:100,y:440,speed:50,phase:0};
 assert.equal(Canoes.position(route,0),100);
 assert.equal(Canoes.position(route,1),150);
 assert.equal(Canoes.position(route,2),200);
 assert.equal(Canoes.position(route,3),150);
 assert.equal(Canoes.position(route,4),100);
 const {manager,canoes}=setup([route]);
 for(let i=0;i<900;i++){
  manager.advance(1/120);
  assert.ok(canoes[0].x>=100-EPS&&canoes[0].x<=200+EPS);
 }
});

test("riding a canoe maintains a stable foot-height deck and carries the player",()=>{
 const {manager,canoes,player,controller}=setup([{
  id:"ferry",minX:200,maxX:330,w:108,y:441,speed:50,phase:0
 }]);
 controller.reset(235,441);
 stepFor(controller,.07);
 assert.equal(player.supportId,"ferry");
 const x=player.x,feet=player.feet;
 stepFor(controller,1);
 assert.ok(player.x>x+45,"passenger rides without movement input");
 assert.equal(player.vx,0);
 assert.equal(player.feet,feet);
 assert.equal(player.feet,canoes[0].y);
 assert.equal(manager.getSurface("ferry").y,feet);
});

test("landing on an arriving canoe works from above while descending",()=>{
 const {manager,player,controller}=setup([{
  id:"ferry",minX:465,maxX:480,w:108,y:442,speed:20,phase:0
 }]);
 controller.reset(515,360);
 player.grounded=false;player.vy=50;
 let reached=false;
 for(let i=0;i<100;i++){
  const event=controller.step(noKeys,1/120);
  if(event.landed&&player.supportId==="ferry"){reached=true;break;}
 }
 assert.equal(reached,true);
 assert.equal(player.feet,442);
 assert.equal(player.grounded,true);
 assert.ok(manager.getSurface("ferry"));
});

test("jumping from canoe releases support immediately and preserves jump height",()=>{
 const {player,controller}=setup([{
  id:"ferry",minX:200,maxX:300,w:108,y:441,speed:50,phase:0
 }]);
 controller.reset(225,441);
 stepFor(controller,.06);
 assert.equal(player.supportId,"ferry");
 controller.requestJump();
 const event=controller.step({...noKeys,jump:true},1/120);
 assert.equal(event.jumped,true);
 assert.equal(player.supportId,null);
 assert.equal(player.grounded,false);
 const airborneX=player.x;
 stepFor(controller,.12,120,{...noKeys,jump:true});
 assert.ok(Math.abs(player.x-airborneX)<EPS,"canoe cannot drag an airborne player");
});

test("reset restores initial canoe positions, phase and direction",()=>{
 const {manager,canoes,controller}=setup();
 const initial=canoes.map(p=>({x:p.x,y:p.y,direction:p.direction}));
 stepFor(controller,4);
 assert.ok(canoes.some((p,i)=>Math.abs(p.x-initial[i].x)>1));
 manager.reset();
 canoes.forEach((p,i)=>{
  assert.ok(Math.abs(p.x-initial[i].x)<EPS);
  assert.equal(p.y,initial[i].y);
  assert.equal(p.elapsed,0);
  assert.equal(p.direction,initial[i].direction);
 });
 stepFor(controller,.5);
 assert.ok(canoes.some((p,i)=>Math.abs(p.x-initial[i].x)>1));
});

test("canoes are stable at 30, 60 and 120 physics updates per second",()=>{
 function run(fps){
  const {controller,canoes}=setup();
  stepFor(controller,3.1,fps);
  return canoes.map(p=>p.x);
 }
 const reference=run(120);
 for(const fps of [30,60]){
  const actual=run(fps);
  actual.forEach((x,i)=>assert.ok(Math.abs(x-reference[i])<.001));
 }
});

test("invalid routes and missing registry fail closed",()=>{
 assert.throws(()=>Canoes.install(null),TypeError);
 const m=Platforms.create();
 assert.throws(()=>Canoes.install(m,[{id:"oops",minX:30,maxX:10,y:440,w:100,speed:50,phase:0}]),RangeError);
 assert.throws(()=>Canoes.position(Canoes.ROUTES[0],-1),RangeError);
});
