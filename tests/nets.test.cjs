const test=require("node:test");
const assert=require("node:assert/strict");
const L=require("../coast/level.js");
const P=require("../coast/world/platforms.js");
const Nets=require("../coast/world/nets.js");
const Controller=require("../coast/player/controller.js");
const empty={left:false,right:false,up:false,down:false,jump:false};
function setup(decks,lanes){
  const manager=P.create(),player={};
  const nets=Nets.install(manager,decks);
  const level=Nets.withClimbs(L,lanes);
  const controller=Controller.create(level,player,undefined,manager);
  return {manager,player,nets,level,controller};
}
function run(c,seconds,keys=empty,rate=120){
  let elapsed=0,events=null;
  while(elapsed<seconds-1e-9){
    const h=Math.min(1/rate,seconds-elapsed);
    events=c.step(keys,h);
    elapsed+=h;
  }
  return events;
}
test("two suspended decks are above permanent safe walkways",()=>{
 assert.equal(Nets.DECKS.length,2);
 for(const net of Nets.DECKS){
  assert.ok(L.surfaces.some(s=>s.y>net.y&&s.y-net.y<90&&
    net.x<s.x+s.w&&net.x+net.w>s.x));
 }
 assert.equal(L.platforms.length,12);
});
test("net collision is one-way and has no physical sag",()=>{
 const {player,controller,nets}=setup();
 const net=nets[0];
 controller.reset(net.x+40,net.y-60);
 player.grounded=false;player.vy=30;
 let landed=false;
 for(let i=0;i<120;i++){
   const e=controller.step(empty,1/120);
   if(e.landed && player.supportId===net.id){landed=true;break;}
 }
 assert.equal(landed,true);
 assert.equal(player.feet,net.y);
 assert.equal(net.pulse,.42);
 const y=net.y;
 run(controller,.26);
 assert.equal(player.feet,y);
 assert.ok(net.pulse<.42);
});
test("net can be jumped off without extra launch velocity",()=>{
 const {player,controller,nets}=setup();
 const net=nets[0];
 controller.reset(net.x+35,net.y);
 run(controller,.03);
 assert.equal(player.supportId,net.id);
 controller.requestJump();
 const e=controller.step({...empty,jump:true},1/120);
 assert.equal(e.jumped,true);
 assert.equal(player.supportId,null);
 assert.ok(player.vy<0);
});
test("climbable nets connect existing boardwalks to roofs",()=>{
 assert.equal(Nets.CLIMBS.length,2);
 const {level,player,controller}=setup();
 const n=Nets.CLIMBS[0],x=n.x+n.w/2;
 const synthetic=level.nearbyLadder(x,n.y+n.h);
 assert.equal(synthetic.kind,"net");
 controller.reset(x,n.y+n.h);
 let e=controller.step({...empty,up:true},1/120);
 assert.equal(player.climbing,true);
 assert.equal(e.climbing,true);
 const bottom=player.feet;
 run(controller,.45,{...empty,up:true});
 assert.ok(player.feet<bottom-55);
 assert.equal(player.climbing,true);
 run(controller,.65,{...empty,up:true});
 assert.ok(player.feet>=n.y-5-1e-6);
 assert.ok(player.feet<=n.y);
});
test("down climbs and jump detaches from hanging net",()=>{
 const {player,controller}=setup();
 const n=Nets.CLIMBS[1],x=n.x+n.w/2;
 controller.reset(x,n.y);
 controller.step({...empty,down:true},1/120);
 assert.equal(player.climbing,true);
 const y=player.feet;
 run(controller,.22,{...empty,down:true});
 assert.ok(player.feet>y+20);
 controller.requestJump();
 const e=controller.step({...empty,jump:true},1/120);
 assert.equal(e.jumped,true);
 assert.equal(player.climbing,false);
 assert.ok(player.vy<0);
});
test("original ladders continue to be found first",()=>{
 const {level}=setup();
 const original=L.ladders[0];
 const old=L.nearbyLadder(original.x+8,original.y+20);
 const next=level.nearbyLadder(original.x+8,original.y+20);
 assert.equal(next,old);
 assert.equal(next.kind,undefined);
});
test("reset clears net landing pulse, retains net collision",()=>{
 const {manager,nets,player,controller}=setup();
 const net=nets[0];
 controller.reset(net.x+40,net.y-40);
 player.grounded=false;player.vy=45;
 run(controller,.35);
 assert.ok(net.pulse>0);
 manager.reset();
 assert.equal(net.pulse,0);
 assert.ok(manager.getSurface(net.id));
});
test("time-stepping gives consistent net climb positions at 30/60/120 FPS",()=>{
 function result(rate){
   const {player,controller}=setup();
   const n=Nets.CLIMBS[0];
   controller.reset(n.x+n.w/2,n.y+n.h);
   run(controller,.5,{...empty,up:true},rate);
   return player.feet;
 }
 for(const hz of [30,60])assert.ok(Math.abs(result(hz)-result(120))<.01);
});
test("invalid nets or level adapters fail closed",()=>{
 assert.throws(()=>Nets.install(null),TypeError);
 assert.throws(()=>Nets.install(P.create(),[{id:"bad",x:1,y:2,w:0}]),RangeError);
 assert.throws(()=>Nets.withClimbs(null),TypeError);
});
