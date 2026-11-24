/* Stage 1: Stilt Village — free-moving, handcrafted platformer. */
(function () {
  "use strict";
  const L=window.CoastLevel,S=window.CoastSprites;
  const water=window.CoastWater.create();
  const parallax=window.CoastParallax;
  const reduceMotion=typeof window.matchMedia==="function"&&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animator=window.CoastAnimator.create(window.CoastBoy);
  const canvas=document.getElementById("scene"),g=canvas.getContext("2d");
  const overlay=document.getElementById("overlay"),hud=document.getElementById("hud");
  const health=document.getElementById("hearts"),coinsEl=document.getElementById("coins"),timeEl=document.getElementById("timer");
  const statusEl=document.getElementById("status");
  const keys={left:false,right:false,up:false,down:false,jump:false};
  const keyboardHeld={...keys},touchHeld={...keys};
  const playArea=document.getElementById("play-area");
  const SAVE_KEY="png-adventure-coast-v1";
  let mode="menu",camera=0,clock=0,runTime=0,last=0,coins=[],crabs=[],fish=[],collected=0,hearts=3;
  let checkpoint=false,invulnerable=0,waterSplash=0,fx=[],best=null,lastSafe={x:83,feet:L.FLOOR};
  const p={x:83,feet:L.FLOOR,vx:0,vy:0,grounded:true,climbing:false,face:1,crouch:false,anim:0,coyote:0,buffer:0};
  const platforms=window.CoastPlatforms.create();
  const canoes=window.CoastCanoes.install(platforms);
  const breakaways=window.CoastBreakaways.install(platforms,p);
  const nets=window.CoastNets.install(platforms);
  const climbLevel=window.CoastNets.withClimbs(L);
  const controller=window.CoastController.create(climbLevel,p,undefined,platforms);
  try{best=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");}catch(_){}
  function saveBest(){
    if(!best||runTime<best.time||runTime===best.time&&collected>best.coins){
      best={time:runTime,coins:collected};
      try{localStorage.setItem(SAVE_KEY,JSON.stringify(best));}catch(_){}
    }
  }
  function reset(){
    water.reset();
    platforms.reset();
    controller.reset();p.anim=0;
    animator.reset();
    camera=0;clock=0;runTime=0;hearts=3;checkpoint=false;invulnerable=0;collected=0;fx=[];
    lastSafe={x:83,feet:L.FLOOR};
    coins=L.coinGroups.map(([x,y])=>({x,y,taken:false}));
    crabs=L.crabs.map(c=>({...c,dir:1,alive:true}));
    fish=L.fish.map(f=>({...f}));
    releaseAll();
    updateHud();
    mode="playing";
    playArea.classList.add("controls-live");
    overlay.classList.add("hidden");hud.classList.remove("hidden");
    statusEl.textContent="";
    canvas.focus();
  }
  function display(type){
    mode=type;hud.classList.toggle("hidden",type!=="playing");
    playArea.classList.remove("controls-live");
    releaseAll();
    overlay.classList.remove("hidden");
    let title="STILT VILLAGE",desc="Explore a PNG-inspired coastal village, jump between wooden walkways, avoid crabs and leaping fish, and find the final jetty.";
    let actions='<button data-action="play" class="primary">▶ START ADVENTURE</button><button data-action="help">CONTROLS</button>';
    if(type==="win"){
      title="VILLAGE CLEARED!";
      desc="You crossed the coast in "+formatTime(runTime)+" and collected "+collected+" golden tokens. "+(best?"Best: "+formatTime(best.time)+".":"");
      actions='<button class="primary" data-action="play">↻ PLAY AGAIN</button><button data-action="menu">MAIN MENU</button>';
    }else if(type==="over"){
      title="TRY AGAIN!";
      desc="The lagoon won this round. Try another route, watch for fish ripples, and use the ladders and roofs.";
      actions='<button class="primary" data-action="play">↻ RETRY</button><button data-action="menu">MAIN MENU</button>';
    }else if(type==="pause"){
      title="PAUSED";desc="Your coastal adventure is waiting.";
      actions='<button class="primary" data-action="resume">▶ RESUME</button><button data-action="play">RESTART</button>';
    }else if(type==="help"){
      title="HOW TO PLAY";
      desc="← → or A/D: walk. Space: jump (hold for a higher jump). ↓ or S: crouch. ↑/↓ by a ladder: climb. On mobile, use the large touch controls. Reach the glowing finish sign on the last jetty.";
      actions='<button class="primary" data-action="play">▶ PLAY</button><button data-action="menu">BACK</button>';
    }else if(best){
      desc+=' Personal best: '+formatTime(best.time)+', '+best.coins+' tokens.';
    }
    overlay.innerHTML='<div class="panel"><span class="tag">PNG ADVENTURE · STAGE 01</span><h1>'+title+'</h1><p>'+desc+'</p><div class="buttons">'+actions+'</div><div class="hint">Pixel-art prototype · original assets · free to play</div></div>';
  }
  function formatTime(v){const n=Math.max(0,Math.floor(v));return Math.floor(n/60)+":"+String(n%60).padStart(2,"0");}
  function updateHud(){
    health.textContent="♥ ".repeat(hearts)+"♡ ".repeat(3-hearts);
    health.setAttribute("aria-label",hearts+" hearts remaining");
    coinsEl.textContent="◆ "+collected;
    timeEl.textContent=formatTime(runTime);
  }
  function flash(text){
    statusEl.textContent=text;
    setTimeout(()=>{if(statusEl.textContent===text)statusEl.textContent=""},1300);
  }
  function burst(x,y,color,n){
    for(let i=0;i<n;i++)fx.push({x,y,vx:(Math.random()-.5)*130,vy:-70-Math.random()*100,life:.45+Math.random()*.25,color});
  }
  function hurt(fall=false){
    if(mode!=="playing"||(!fall&&invulnerable>0))return;
    const damage=invulnerable<=0;
    if(damage){
      hearts--;invulnerable=1.4;
      burst(p.x,p.feet-25,"#ffe0a7",12);
      updateHud();
      animator.trigger("hurt");
      if(hearts<=0){display("over");return;}
    }
    // Water must ALWAYS recover the player to a safe surface, even during
    // post-hit invulnerability. Otherwise they can remain below the stage.
    const spawn=checkpoint?{x:L.checkpoint.x,feet:390}:lastSafe;
    controller.reset(spawn.x,spawn.feet);
    flash(fall?"SPLASH! WATCH THE GAPS":"OUCH! BE CAREFUL");
  }
  function jump(){
    if(mode!=="playing")return;
    controller.requestJump();
  }
  function update(dt){
    clock+=dt;
    if(mode!=="playing")return;
    water.advance(dt);
    runTime+=dt;
    invulnerable=Math.max(0,invulnerable-dt);
    const wasOnCanoe=typeof p.supportId==="string"&&p.supportId.startsWith("canoe-");
    const movement=controller.step(keys,dt);
    if(movement.jumped&&wasOnCanoe)water.splash(p.x,L.WATER_Y+5,"canoe");
    if(movement.jumped){
      animator.trigger("takeoff");
      burst(p.x,p.feet-3,"#f2dbaa",7);
    }
    if(movement.landed){
      if(typeof p.supportId==="string"&&p.supportId.startsWith("canoe-"))water.splash(p.x,L.WATER_Y+5,"canoe");
      burst(p.x,p.feet,"#e4c591",5);
      animator.trigger("land");
    }
    if(p.grounded && p.feet===L.FLOOR && p.x<475){
      lastSafe={x:p.x,feet:p.feet};
    }
    if(p.feet>L.WATER_Y+80){water.splash(p.x,L.WATER_Y+7,"fall");hurt(true);return;}
    if(!checkpoint&&p.x>=L.checkpoint.x){checkpoint=true;flash("CHECKPOINT REACHED!");}
    const body={x:p.x-14,y:p.feet-(p.crouch?27:58),w:28,h:p.crouch?27:58};
    for(const coin of coins){
      if(coin.taken)continue;
      if(L.overlap(body,{x:coin.x-9,y:coin.y-10,w:18,h:20})){
        coin.taken=true;collected++;burst(coin.x,coin.y,"#ffe291",6);updateHud();
      }
    }
    for(const crab of crabs){
      if(!crab.alive)continue;
      crab.x+=crab.dir*48*dt;
      if(crab.x<crab.min||crab.x>crab.max)crab.dir*=-1;
      if(!L.overlap(body,{x:crab.x-15,y:crab.y-15,w:30,h:17}))continue;
      if(p.vy>100&&p.feet-4<crab.y+8){
        crab.alive=false;p.vy=-330;p.grounded=false;p.coyote=0;p.buffer=0;
        burst(crab.x,crab.y,"#f4b383",13);flash("CRAB BOUNCE!");
      }else {hurt();return;}
    }
    for(const f of fish){
      const pose=L.fishPosition(f,clock);
      if(pose.active&&L.overlap(body,{x:pose.x-13,y:pose.y-10,w:26,h:20})){hurt();return;}
    }
    if(p.x>=L.finish.x&&p.feet<=L.finish.y+10){
      animator.trigger("victory");
      saveBest();display("win");return;
    }
    for(const v of fx){v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=260*dt;v.life-=dt;}
    fx=fx.filter(v=>v.life>0);
    const goal=L.clamp(p.x-320,0,L.WORLD_WIDTH-960);
    camera+= (goal-camera)*Math.min(1,dt*7);
    updateHud();
  }
  function rect(x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.floor(x),Math.floor(y),Math.ceil(w),Math.ceil(h));}
  function waterRenderer(ctx,cameraPos,time){
    window.CoastWater.draw(ctx,cameraPos,time,L.WATER_Y,{
      surfaces:L.surfaces,canoes,splashes:water.snapshot()
    },{reducedMotion:reduceMotion});
  }
  function draw(){
    parallax.draw(g,camera,clock,S,{reducedMotion:reduceMotion});
    g.save();g.translate(-Math.floor(camera),0);g.imageSmoothingEnabled=false;
    waterRenderer(g,camera,clock);
    for(const h of L.houses){
      // Foreground stilt houses add recognisable village architecture to the platform layer.
      if(h.x>camera-240&&h.x<camera+1150)S.house(g,h.x,h.y,h.scale,h.tint);
    }
    window.CoastVillage.draw(g,camera,L.houses);
    window.CoastVegetation.draw(g,camera,clock,{reducedMotion:reduceMotion});
    for(const pform of L.surfaces){
      if(pform.x+pform.w<camera-80||pform.x>camera+1040)continue;
      S.plank(g,pform.x,pform.y,pform.w,pform.kind);
    }
    for(const net of nets){
      if(net.x+net.w>=camera-60&&net.x<=camera+1020){
        S.netDeck(g,net,clock);
      }
    }
    for(const net of window.CoastNets.CLIMBS){
      if(net.x+net.w>=camera-60&&net.x<=camera+1020){
        S.climbNet(g,net,clock);
      }
    }
    for(const board of breakaways){
      if(board.x+board.w>=camera-60&&board.x<=camera+1020){
        S.breakawayPlank(g,board,clock);
      }
    }
    for(const canoe of canoes){
      if(canoe.x+canoe.w>=camera-60&&canoe.x<=camera+1020){
        S.canoePlatform(g,canoe,clock);
      }
    }
    for(const ladder of L.ladders){
      for(let y=ladder.y;y<ladder.y+ladder.h;y+=16){
        rect(ladder.x,y,5,18,"#76503e");rect(ladder.x+22,y,5,18,"#76503e");
        rect(ladder.x,y+8,27,4,"#d1a36f");
      }
    }
    for(const f of fish){
      const pose=L.fishPosition(f,clock);
      if(pose.warning){
        rect(f.x-21,L.WATER_Y-3,43,3,"#f6e5b0");
        rect(f.x-10,L.WATER_Y-10,20,3,"#f6e5b0");
      }
      if(pose.active)S.sprite(g,"fish",clock*6,pose.x-16,pose.y-11,32,23,false);
    }
    for(const crab of crabs){
      if(crab.alive)S.sprite(g,"crab",clock*7,crab.x-16,crab.y-17,32,24,crab.dir<0);
    }
    for(const coin of coins){
      if(!coin.taken)S.sprite(g,"coin",clock*8,coin.x-10,coin.y-12,20,23);
    }
    const cp=L.checkpoint;
    rect(cp.x-3,cp.y-70,6,70,"#80593e");
    rect(cp.x+3,cp.y-70,49,28,checkpoint?"#f5d684":"#67bcb5");
    g.font="bold 11px monospace";g.textAlign="left";g.fillStyle="#173f48";
    g.fillText(checkpoint?"SAVED":"CHECK",cp.x+5,cp.y-53);
    const finish=L.finish;
    rect(finish.x,finish.y-104,7,104,"#654a37");
    rect(finish.x-44,finish.y-103,52,41,"#eedc90");
    g.font="bold 15px monospace";g.fillStyle="#273b44";g.fillText("END",finish.x-38,finish.y-79);
    for(const v of fx)rect(v.x,v.y,5,5,v.color);
    const pose=animator.current();
    const flashInv=invulnerable>0&&Math.floor(invulnerable*10)%2===0;
    if(!flashInv || pose.action==="victory"){
      S.sprite(g,pose.action,pose.frame,p.x-22,p.feet-(p.crouch?50:64),44,p.crouch?50:64,p.face<0);
    }
    g.restore();
    if(mode==="playing"&&p.x<400){
      rect(20,426,210,25,"#163b4aaa");
      g.textAlign="left";g.fillStyle="#f9e8b9";g.font="bold 12px monospace";
      g.fillText("WALK →  JUMP ↑/SPACE",31,443);
    }
  }
  function loop(now){
    const dt=last?Math.min(.034,(now-last)/1000):0;last=now;
    update(dt);
    // Animate after world state updates. Paused/game-over poses freeze; a stage
    // victory continues celebrating behind its results overlay.
    if(mode==="playing"||mode==="win"){
      animator.update({
        grounded:p.grounded,
        velocityY:p.vy,
        moving:Math.abs(p.vx)>18,
        crouching:p.crouch,
        climbing:p.climbing,
        victorious:mode==="win"
      },dt);
    }
    draw();requestAnimationFrame(loop);
  }
  function setHeld(k,isDown,source="keyboard"){
    if(!Object.prototype.hasOwnProperty.call(keys,k))return;
    const channel=source==="touch"?touchHeld:keyboardHeld;
    channel[k]=!!isDown;
    const held=keyboardHeld[k]||touchHeld[k];
    if(k==="jump"&&held&&!keys.jump)jump();
    keys[k]=held;
  }
  function mapped(code){
    if(["ArrowLeft","KeyA"].includes(code))return "left";
    if(["ArrowRight","KeyD"].includes(code))return "right";
    if(["ArrowUp","KeyW"].includes(code))return "up";
    if(["ArrowDown","KeyS"].includes(code))return "down";
    if(["Space","KeyK"].includes(code))return "jump";
    return null;
  }
  window.addEventListener("keydown",e=>{
    if(e.code==="Escape"||e.code==="KeyP"){
      if(!e.repeat){if(mode==="playing")display("pause");else if(mode==="pause")resume();}
      return;
    }
    const k=mapped(e.code);if(!k)return;
    e.preventDefault();if(e.repeat)return;setHeld(k,true);
  });
  window.addEventListener("keyup",e=>{
    const k=mapped(e.code);if(!k)return;e.preventDefault();setHeld(k,false);
  });
  const touchController=window.CoastTouch.create(
    document.querySelectorAll("[data-control]"),
    (action,held)=>setHeld(action,held,"touch")
  );
  function releaseAll(){
    for(const k of Object.keys(keys)){
      keyboardHeld[k]=false;
      touchHeld[k]=false;
      keys[k]=false;
    }
    touchController.clear();
  }
  window.addEventListener("blur",()=>{
    releaseAll();
    if(mode==="playing")display("pause");
  });
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){
      releaseAll();
      if(mode==="playing")display("pause");
    }
  });
  overlay.addEventListener("click",e=>{
    const action=e.target.closest("[data-action]")?.dataset.action;
    if(action==="play")reset();
    if(action==="help")display("help");
    if(action==="menu")display("menu");
    if(action==="resume")resume();
  });
  function resume(){releaseAll();mode="playing";playArea.classList.add("controls-live");overlay.classList.add("hidden");hud.classList.remove("hidden");last=performance.now();}
  document.getElementById("pause").addEventListener("click",()=>{if(mode==="playing")display("pause");});
  document.getElementById("reset").addEventListener("click",()=>reset());
  canvas.setAttribute("tabindex","0");
  display("menu");requestAnimationFrame(loop);
})();
