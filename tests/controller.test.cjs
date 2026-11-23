const test=require("node:test");
const assert=require("node:assert/strict");
const L=require("../coast/level.js");
const P=require("../coast/player/controller.js");
const fresh=(x=85,y=L.FLOOR)=>{const p={};const c=P.create(L,p);c.reset(x,y);return {p,c};};
const empty={left:false,right:false,up:false,down:false,jump:false};
const tick=(c,keys,seconds,step=1/60)=>{
  let events={jumped:false,landed:false,walkedOff:false};
  while(seconds>1e-9){
    const h=Math.min(step,seconds);
    const e=c.step(keys,h);
    for(const k of Object.keys(events))events[k]=events[k]||e[k];
    seconds-=h;
  }
  return events;
};

test("walking starts smoothly, reverses direction, and stops without drift",()=>{
 const {p,c}=fresh();
 c.step({...empty,right:true},.016);
 assert.ok(p.vx>0&&p.vx<235);
 tick(c,{...empty,right:true},.5);
 assert.ok(Math.abs(p.vx-235)<1);
 const before=p.x;
 c.step({...empty,left:true},.016);
 assert.ok(p.vx<235&&p.vx>0);
 tick(c,{...empty,left:true},.5);
 assert.ok(p.x<before+80);
 tick(c,empty,.25);
 assert.ok(Math.abs(p.vx)<1);
});

test("short press makes lower jump than a held press",()=>{
 const run=hold=>{
  const {p,c}=fresh();
  c.requestJump();
  tick(c,{...empty,jump:true},.04);
  let peak=p.feet;
  for(let i=0;i<26;i++){
   c.step({...empty,jump:hold},.012);
   peak=Math.min(peak,p.feet);
  }
  return peak;
 };
 assert.ok(run(true)+25<run(false),"held jump should rise visibly higher");
});

test("buffered jump fires immediately on landing, but not twice",()=>{
 const {p,c}=fresh();
 c.requestJump();
 tick(c,{...empty,jump:true},.4);
 // After initial jump the player is descending; a buffered tap near landing
 // must trigger at the first contact, not wait for the next keydown.
 let fired=0;
 for(let i=0;i<110;i++){
   if(p.vy>0&&p.feet>390&&p.feet<432&&p.buffer===0)c.requestJump();
   const e=c.step({...empty,jump:true},1/120);
   if(e.jumped)fired++;
   if(fired>0)break;
 }
 assert.equal(fired,1);
 assert.ok(p.vy<0);
 const e=c.step({...empty,jump:true},1/120);
 assert.equal(e.jumped,false);
});

test("coyote jump works just after leaving a platform, then expires",()=>{
 const tiny={...L,surfaces:[{x:0,y:432,w:100}],landing:(a,b,x,w)=>L.landing(a,b,x,w,[{x:0,y:432,w:100}]),nearbyLadder:()=>null,WORLD_WIDTH:300};
 const p={};const c=P.create(tiny,p);c.reset(90,432);
 const e=c.step({...empty,right:true},.10);
 assert.equal(e.walkedOff,true);
 assert.ok(p.coyote>0);
 c.requestJump();
 assert.equal(c.step({...empty,right:true,jump:true},.015).jumped,true);
 const q={};const d=P.create(tiny,q);d.reset(90,432);
 d.step({...empty,right:true},.11);
 tick(d,empty,.15);
 d.requestJump();
 assert.equal(d.step({...empty,jump:true},.01).jumped,false);
});

test("platform collision catches downward movement and not upward movement",()=>{
 const p={};const c=P.create(L,p);
 c.reset(602,335);p.grounded=false;p.vy=60;
 let landed=false;
 for(let i=0;i<80;i++){
  const e=c.step(empty,1/120);
  if(e.landed){landed=true;break;}
 }
 assert.equal(landed,true);
 assert.equal(p.feet,402);
 c.requestJump();
 c.step({...empty,jump:true},1/120);
 assert.ok(p.vy<0);
 assert.ok(p.feet<402);
});

test("crouch slows running, respects ground, and exits cleanly",()=>{
 const {p,c}=fresh();
 tick(c,{...empty,right:true,down:true},.4);
 assert.equal(p.crouch,true);
 assert.ok(p.vx<=115.01);
 c.requestJump();
 c.step({...empty,jump:true,right:true},.02);
 assert.equal(p.crouch,false);
 tick(c,{...empty,right:true},.45);
 assert.equal(p.crouch,false);
});

test("ladder ascent and top descent are controllable",()=>{
 const {p,c}=fresh(1168,385);
 p.grounded=false;
 c.step({...empty,up:true},.016);
 assert.equal(p.climbing,true);
 const feet=p.feet;
 tick(c,{...empty,up:true},.12);
 assert.ok(p.feet<feet);
 p.feet=310;p.climbing=false;p.grounded=true;
 c.step({...empty,down:true},.016);
 assert.equal(p.climbing,true);
});

test("30/60/120 FPS produce close positions on constant input",()=>{
 function run(fps){
  const {p,c}=fresh();
  tick(c,{...empty,right:true},.35,1/fps);
  c.requestJump();
  tick(c,{...empty,right:true,jump:true},.5,1/fps);
  return {x:p.x,feet:p.feet};
 }
 const a=run(30),b=run(60),c=run(120);
 for(const v of [a,b]){
  assert.ok(Math.abs(v.x-c.x)<1.6,JSON.stringify([v,c]));
  assert.ok(Math.abs(v.feet-c.feet)<1.6,JSON.stringify([v,c]));
 }
});

test("reset after damage clears velocity, timers, and climb state",()=>{
 const {p,c}=fresh();
 p.vx=100;p.vy=400;p.coyote=.09;p.buffer=.12;p.climbing=true;
 c.reset(200,402);
 assert.equal(p.x,200);
 assert.equal(p.feet,402);
 assert.equal(p.vx,0);
 assert.equal(p.vy,0);
 assert.equal(p.climbing,false);
 assert.equal(p.coyote,0);
 assert.equal(p.buffer,0);
});
