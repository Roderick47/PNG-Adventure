/* Coastal Village sprite kit. All visuals are authored pixel sprites/tiles; no remote assets. */
(function(root){
  "use strict";
  const P={
    ink:"#203a49",skin:"#aa724d",skinLight:"#d59b68",hair:"#252a36",
    red:"#c94f4b",redLight:"#e47c57",teal:"#3b938f",sea:"#3b869c",
    gold:"#f7d06a",cream:"#f7e5b8",wood:"#976044",woodLight:"#c48a58",
    woodDark:"#62473a",leaf:"#45866a",leafLight:"#83b478"
  };
  const atlas={};
  function pixel(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function createSprite(w,h,draw){
    const c=document.createElement("canvas");c.width=w;c.height=h;
    const g=c.getContext("2d");g.imageSmoothingEnabled=false;draw(g);
    return c;
  }
  // Phase 2.1 character atlas is prepared by coast/player/character.js.
  // The older block-style player generator is intentionally retired.
  const boy=root.CoastBoy;
  if(!boy)throw new Error("CoastBoy module must load before CoastSprites");
  const boyAtlas=boy.createAtlas((w,h)=>{
    const c=document.createElement("canvas");c.width=w;c.height=h;return c;
  });
  function buildCrab(frame){
    return createSprite(28,20,g=>{
      pixel(g,7,8,15,9,P.ink);pixel(g,8,7,13,8,"#e67d5d");
      pixel(g,10,8,4,3,P.cream);pixel(g,17,8,4,3,P.cream);
      pixel(g,12,9,2,2,P.ink);pixel(g,19,9,2,2,P.ink);
      pixel(g,2,10+(frame%2),6,4,P.red);
      pixel(g,22,10+(frame%2?0:1),6,4,P.red);
      pixel(g,0,5+(frame%2),5,6,P.redLight);
      pixel(g,23,4+(frame%2),5,6,P.redLight);
      for(let i=0;i<3;i++){
        pixel(g,8+i*6,16+(frame%2),3,3,P.woodDark);
      }
    });
  }
  function buildFish(frame){
    return createSprite(32,22,g=>{
      pixel(g,3,6,21,11,P.ink);
      pixel(g,6,7,18,9,frame%2?"#f6ab63":"#f4c47f");
      pixel(g,23,6,7,3,"#e78a5c");pixel(g,23,14,7,3,"#e78a5c");
      pixel(g,11,2,9,5,"#df8061");
      pixel(g,10,15,9,4,"#f7e0ae");
      pixel(g,8,9,3,3,P.cream);pixel(g,9,10,1,2,P.ink);
    });
  }
  function buildCoin(frame){
    return createSprite(18,20,g=>{
      const w=frame%4===0?5:frame%4===2?15:11;
      pixel(g,Math.floor((18-w)/2),3,w,14,"#94603b");
      pixel(g,Math.floor((18-w)/2)+1,2,w-2,14,P.gold);
      if(w>8){
        pixel(g,5,5,8,2,P.cream);
        pixel(g,8,8,2,6,P.cream);
      }
    });
  }
  function prepare(){
    for(const action of Object.keys(boy.FRAME_COUNTS))atlas[action]=boyAtlas[action];
    atlas.crab=[buildCrab(0),buildCrab(1)];
    atlas.fish=[buildFish(0),buildFish(1)];
    atlas.coin=Array.from({length:4},(_,i)=>buildCoin(i));
  }
  function sprite(g,name,frame,x,y,w,h,flip=false){
    if(Object.prototype.hasOwnProperty.call(boy.FRAME_COUNTS,name)){
      boy.draw(g,boyAtlas,name,frame,x+w/2,y+h,1,flip);
      return;
    }
    const sheet=atlas[name]||atlas.idle;
    const n=((Math.floor(frame)%sheet.length)+sheet.length)%sheet.length;
    const im=sheet[n];
    g.save();g.imageSmoothingEnabled=false;
    if(flip){g.translate(x+w,0);g.scale(-1,1);x=0;}
    g.drawImage(im,Math.round(x),Math.round(y),Math.round(w),Math.round(h));
    g.restore();
  }
  function house(g,x,y,s=1,variant=0){
    g.save();g.translate(Math.round(x),Math.round(y));g.scale(s,s);
    const roof=variant===1?"#b8604e":variant===2?"#a9774e":"#9b554d";
    pixel(g,7,25,128,93,P.woodDark);
    pixel(g,11,29,120,84,variant===1?"#d3a475":"#b7845b");
    for(let i=0;i<5;i++)pixel(g,17+i*24,29,3,84,"#926646");
    pixel(g,45,63,29,50,P.woodDark);pixel(g,49,66,21,46,"#494b47");
    pixel(g,91,52,25,31,P.woodDark);pixel(g,95,55,17,22,"#628e93");
    pixel(g,4,19,133,12,P.ink);
    for(let i=0;i<6;i++)pixel(g,3+i*22,17-i*3,24,14,roof);
    pixel(g,25,4,89,11,roof);pixel(g,16,15,111,8,roof);
    for(let j=0;j<3;j++){
      pixel(g,20+j*39,115,9,100,P.woodDark);
      pixel(g,23+j*39,116,2,95,"#c39264");
    }
    pixel(g,0,109,139,8,P.woodDark);
    pixel(g,2,109,133,4,P.woodLight);
    pixel(g,6,117,11,60,P.woodDark);
    g.restore();
  }
  function palm(g,x,y,s){
    g.save();g.translate(Math.round(x),Math.round(y));g.scale(s,s);
    pixel(g,38,-100,12,103,P.woodDark);
    pixel(g,43,-100,4,97,P.woodLight);
    for(let i=0;i<5;i++){
      const side=i%2===0?-1:1,by=-122+i*7;
      pixel(g,40+side*12,by,45,8,P.leaf);
      pixel(g,40+side*25,by+8,31,7,P.leafLight);
    }
    pixel(g,31,-122,24,15,P.leaf);
    g.restore();
  }
  function boat(g,x,y){
    pixel(g,x,y,94,8,P.woodDark);
    pixel(g,x+9,y+8,74,12,"#a35b41");
    pixel(g,x+19,y+20,53,7,P.woodDark);
    pixel(g,x+39,y-32,4,36,P.woodDark);
    pixel(g,x+44,y-30,35,28,P.cream);
  }
  // Playable canoe: the top timber rail corresponds exactly to the collision
  // deck at p.y. Drawn bobbing is intentionally only below that top rail.
  function canoePlatform(g,p,time){
    const x=Math.round(p.x),y=Math.round(p.y),w=Math.round(p.w);
    const bob=Math.round(Math.sin(time*2.7+p.x*.012)*2);
    const hullY=y+6+bob;
    // Light wake and ripple trails follow motion, not a secondary collision.
    const wake=p.direction<0?x+w+4:x-27;
    const shimmer=Math.round(Math.sin(time*5+p.x*.02)*3);
    pixel(g,wake,y+24+shimmer,25,2,"#c2eee1");
    pixel(g,wake+8,y+30+shimmer,19,2,"#8bd4d2");
    pixel(g,x+10,y+29+bob,w-21,2,"#8ed8d0");
    pixel(g,x+24,y+33+bob,w-47,2,"#54b4bb");
    // Outrigger (distinctive PNG canoe silhouette).
    pixel(g,x-12,hullY+15,w+24,4,P.woodDark);
    pixel(g,x-9,hullY+13,w+18,3,"#d5a66e");
    pixel(g,x+14,hullY+4,6,13,P.woodDark);
    pixel(g,x+w-20,hullY+4,6,13,P.woodDark);
    // Carved timber hull with pointed bow/stern, shading and visible gunwale.
    pixel(g,x+5,hullY,w-10,11,P.woodDark);
    pixel(g,x+8,hullY+3,w-16,13,"#ae6844");
    pixel(g,x+17,hullY+10,w-34,10,"#8d4936");
    pixel(g,x+27,hullY+17,w-54,5,P.woodDark);
    pixel(g,x,hullY-1,13,7,P.woodDark);
    pixel(g,x+w-13,hullY-1,13,7,P.woodDark);
    pixel(g,x+12,hullY+7,w-24,3,"#deaa6c");
    // The solid, foot-height deck remains at a stable y even on waves.
    pixel(g,x+5,y-2,w-10,5,P.woodDark);
    pixel(g,x+9,y-2,w-18,3,"#ecc58a");
    for(let step=20;step<w-12;step+=18)pixel(g,x+step,y,2,2,P.woodDark);
    // Decorative prow ornaments; do not alter collision.
    pixel(g,x+5,y-6,4,7,P.cream);
    pixel(g,x+w-9,y-6,4,7,P.cream);
  }
  // Breakaway boards: shake/cracks are visual only. The solid deck stays
  // at its registered y until the warning expires, then disappears at once.
  function breakawayPlank(g,p,time){
    const {x,y,w,state}=p;
    if(state==="collapsed"){
      // Draw a short falling-fragment animation. Never paint a solid-looking
      // deck while collisions are disabled.
      const age=Math.max(0,2.5-p.remaining);
      if(age>.5)return;
      const fall=Math.min(70,age*135);
      for(let i=0;i<4;i++){
        const bx=x+i*w/4+Math.sin(i*4.2+time*3)*5;
        const by=y+fall+(i%2)*9;
        pixel(g,bx,by,Math.max(9,w/5),5,i%2?"#8b5039":"#c28b5c");
        pixel(g,bx+3,by+5,3,6,"#704532");
      }
      return;
    }
    const warning=state==="warning";
    const progress=warning?Math.max(0,Math.min(1,1-p.remaining/.65)):0;
    const shake=warning?Math.round(Math.sin(time*43)*Math.min(3,1+progress*3)):0;
    const bx=Math.round(x+shake),by=Math.round(y);
    // The caution-colored plank edges distinguish fragile wood from ordinary
    // walkways even before their first activation.
    pixel(g,bx,by,w,10,"#65442e");
    pixel(g,bx+2,by+1,w-4,4,warning?"#edb16d":"#c99b65");
    pixel(g,bx+3,by+5,w-6,4,"#986044");
    for(let i=24;i<w-3;i+=24){
      pixel(g,bx+i,by+1,2,8,"#66432f");
      pixel(g,bx+i+4,by+2,3,2,"#eacb8d");
    }
    // High contrast cracks grow throughout the 650 ms countdown.
    for(let i=0;i<3;i++){
      const cx=bx+10+i*(w-22)/3,cy=by+(i%2);
      pixel(g,cx,cy+1,5+progress*7,2,"#573a31");
      pixel(g,cx+6+progress*3,cy+3,3,4,"#573a31");
      if(warning){
        pixel(g,cx-1,cy-5,10,2,progress>.5?"#ff795e":"#ffe18b");
      }
    }
    if(warning&&progress>.6){
      pixel(g,bx+w/2-13,by-15,26,5,"#ff875d");
      pixel(g,bx+w/2-9,by-19,18,3,"#ffe49b");
    }
  }
  function plank(g,x,y,w,kind){
    const shore=kind==="shore",roof=kind==="roof";
    const plankColor=roof?"#a55d49":shore?"#cb9b66":P.woodLight;
    pixel(g,x,y,w,11,P.woodDark);
    pixel(g,x,y,w,5,plankColor);
    for(let t=0;t<w;t+=32){
      pixel(g,x+t+2,y+5,2,3,"#e6bb7c");
      pixel(g,x+t+29,y+5,2,3,P.woodDark);
    }
    if(shore){
      pixel(g,x,y+11,w,72,"#bd996d");
      for(let t=0;t<w;t+=38)pixel(g,x+t,y+18,26,3,"#d4b387");
      return;
    }
    for(let t=24;t<w;t+=100){
      pixel(g,x+t,y+11,10,Math.max(0,480-y-11),P.woodDark);
      pixel(g,x+t+3,y+12,2,Math.max(0,470-y-14),P.woodLight);
    }
  }
  function background(g,camera,time){
    const sky=g.createLinearGradient(0,0,0,480);
    sky.addColorStop(0,"#84c8ce");sky.addColorStop(.7,"#b3dbbc");sky.addColorStop(1,"#f0d7a5");
    pixel(g,0,0,960,540,sky);
    pixel(g,0,457,960,83,"#3d9da9");
    for(let i=-1;i<14;i++){
      const x=i*93-(camera*.08)%93;
      pixel(g,x,474+(i%3)*8,59,2,"#8bc7c3");
      pixel(g,x+30,494+(i%2)*8,45,2,"#9bd3c3");
    }
    const sunX=760-camera*.025;
    pixel(g,sunX,75,54,54,"#ffdf98");
    for(let i=-1;i<8;i++){
      const x=i*222-(camera*.15)%222;
      pixel(g,x,284,128,5,"#75a69f");
      pixel(g,x+31,258,71,29,"#83b1a7");
      pixel(g,x+48,241,40,17,"#89b7a8");
    }
    for(let i=-1;i<7;i++){
      const x=i*330-(camera*.3)%330;
      house(g,x+30,335,.75,i%3);
      palm(g,x+232,456,.62);
      if(i%2===0)boat(g,x+126,492+(Math.sin(time*1.2+i)*2));
    }
    pixel(g,0,535,960,5,"#266f82");
  }
  prepare();
  root.CoastSprites={sprite,house,palm,boat,canoePlatform,breakawayPlank,plank,background,colors:P,playerManifest:boy.FRAME_COUNTS,playerOrigin:boy.ORIGIN};
})(typeof window!=="undefined"?window:globalThis);
