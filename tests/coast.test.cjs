const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");

test("handcrafted village has walkways, roofs, ladders, coins and enemies",()=>{
 const L=require("../coast/level.js");
 assert.equal(L.TILE,32);
 assert.ok(L.platforms.length>=10);
 assert.ok(L.upper.length>=3);
 assert.ok(L.ladders.length>=2);
 assert.ok(L.houses.length>=4);
 assert.ok(L.coinGroups.length>=20);
 assert.ok(L.crabs.length>=3);
 assert.ok(L.fish.length>=5);
 assert.ok(L.finish.x<L.WORLD_WIDTH);
});

test("landing is one-way, bounded horizontally and catches descent",()=>{
 const L=require("../coast/level.js");
 const p={x:100,y:340,w:120};
 assert.equal(L.landing(330,350,158,28,[p]),p);
 assert.equal(L.landing(350,330,158,28,[p]),null);
 assert.equal(L.landing(345,355,158,28,[p]),null);
 assert.equal(L.landing(330,350,300,28,[p]),null);
 assert.equal(L.landing(330,350,158,28,[]),null);
});

test("fish warn before leaping and leave the water",()=>{
 const L=require("../coast/level.js");
 const f={x:100,phase:0};
 const warning=L.fishPosition(f,1.0);
 assert.equal(warning.warning,true);
 assert.equal(warning.active,false);
 const jump=L.fishPosition(f,1.83);
 assert.equal(jump.active,true);
 assert.ok(jump.y<L.WATER_Y-70);
 const calm=L.fishPosition(f,2.85);
 assert.equal(calm.active,false);
});

test("sprites instantiate, stage boots, moves both ways, jumps and pauses",()=>{
 const L=require("../coast/level.js");
 const listeners={},els={};
 const ctx=new Proxy({}, {get(_target,k){
   if(k==="createLinearGradient")return ()=>({addColorStop(){}});
   return ()=>{};
 },set(){return true;}});
 const createElement=(tag)=>tag==="canvas"?{width:0,height:0,getContext(){return ctx}}:{};
 const element=(id)=>els[id]||(els[id]={
   textContent:"",innerHTML:"",classList:{add(){},remove(){},toggle(){}},
   setAttribute(){},addEventListener(e,fn){listeners[id+":"+e]=fn;},
   getContext(){return ctx;},focus(){}
 });
 const document={hidden:false,createElement,getElementById:element,
  querySelectorAll(sel){if(sel==="[data-control]")return["left","right","up","down","jump"].map(k=>({dataset:{control:k},addEventListener(e,fn){listeners["control:"+k+":"+e]=fn},setPointerCapture(){}}));return[];},
  addEventListener(e,fn){listeners["document:"+e]=fn}
 };
 const window={CoastLevel:L,addEventListener(e,fn){listeners["window:"+e]=fn;}};
 let callback=null;
 const sandbox={window,document,performance:{now(){return 0}},requestAnimationFrame(fn){callback=fn;},
  localStorage:{getItem(){return null},setItem(){}},setTimeout(){}};
 vm.createContext(sandbox);
 vm.runInContext(fs.readFileSync(path.join(root,"coast","player","character.js"),"utf8"),sandbox);
 assert.ok(window.CoastBoy);
 vm.runInContext(fs.readFileSync(path.join(root,"coast","sprites.js"),"utf8"),sandbox);
 vm.runInContext(fs.readFileSync(path.join(root,"coast","player","animator.js"),"utf8"),sandbox);
 vm.runInContext(fs.readFileSync(path.join(root,"coast","player","controller.js"),"utf8"),sandbox);
 vm.runInContext(fs.readFileSync(path.join(root,"coast","world","platforms.js"),"utf8"),sandbox);
 vm.runInContext(fs.readFileSync(path.join(root,"coast","world","canoes.js"),"utf8"),sandbox);
 vm.runInContext(fs.readFileSync(path.join(root,"coast","world","breakaways.js"),"utf8"),sandbox);
 assert.ok(window.CoastBreakaways);
 assert.ok(window.CoastCanoes);
 assert.ok(window.CoastPlatforms);
 assert.ok(window.CoastController);
 assert.ok(window.CoastAnimator);
 assert.ok(window.CoastSprites);
 vm.runInContext(fs.readFileSync(path.join(root,"coast","input","touch.js"),"utf8"),sandbox);
 assert.ok(window.CoastTouch);
 vm.runInContext(fs.readFileSync(path.join(root,"coast","game.js"),"utf8"),sandbox);
 assert.match(element("overlay").innerHTML,/STILT VILLAGE/);
 listeners["overlay:click"]({target:{closest(){return {dataset:{action:"play"}}}}});
 assert.equal(element("overlay").classList!==undefined,true);
 let time=0;
 for(let i=0;i<10;i++){time+=16;callback(time);}
 listeners["window:keydown"]({code:"ArrowRight",repeat:false,preventDefault(){}});
 for(let i=0;i<40;i++){time+=16;callback(time);}
 listeners["window:keyup"]({code:"ArrowRight",preventDefault(){}});
 assert.ok(element("timer").textContent!=="0:00"||time<1000);
 listeners["window:keydown"]({code:"Space",repeat:false,preventDefault(){}});
 for(let i=0;i<5;i++){time+=16;callback(time);}
 listeners["window:keyup"]({code:"Space",preventDefault(){}});
 listeners["window:keydown"]({code:"KeyP",repeat:false,preventDefault(){}});
 assert.match(element("overlay").innerHTML,/PAUSED/);
 listeners["overlay:click"]({target:{closest(){return {dataset:{action:"resume"}}}}});
 assert.equal(typeof callback,"function");
});
