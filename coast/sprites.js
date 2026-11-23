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
  function buildPlayer(action,frame){
    return createSprite(32,48,g=>{
      const run=action==="run",crouch=action==="crouch";
      const hop=run?(frame%4===0?-2:frame%4===2?2:0):0;
      if(crouch){
        pixel(g,6,30,22,7,P.ink);pixel(g,7,27,19,7,P.red);
        pixel(g,16,19,13,12,P.skin);
        pixel(g,15,15,14,7,P.hair);pixel(g,25,23,2,2,P.ink);
        pixel(g,3,35,13,5,P.ink);pixel(g,18,35,13,5,P.ink);
        return;
      }
      // Two-frame jumping posture, four-frame running cycle, idle breath.
      const airborne=action==="jump"||action==="fall";
      const legs=run?(frame%2===0?4:-4):airborne?(action==="jump"?-3:2):0;
      pixel(g,9+legs,35,6,10,P.ink);pixel(g,18-legs,35,6,10,P.ink);
      pixel(g,6+legs,43,12,4,P.cream);pixel(g,17-legs,43,12,4,P.cream);
      const bodyY=21+hop;
      pixel(g,7,bodyY,19,16,P.ink);
      pixel(g,9,bodyY+1,16,13,P.red);
      pixel(g,11,bodyY+2,11,3,P.redLight);
      pixel(g,10,bodyY+11,15,3,P.teal);
      const arm=run?(frame%2===0?3:-3):airborne?-2:0;
      pixel(g,3,bodyY+4+arm,6,12,P.skin);
      pixel(g,25,bodyY+4-arm,6,12,P.skin);
      pixel(g,13,7+hop,13,15,P.skin);
      pixel(g,11,5+hop,17,7,P.hair);
      pixel(g,12,9+hop,3,5,P.hair);
      pixel(g,15,15+hop,2,2,P.ink);
      pixel(g,23,15+hop,2,2,P.ink);
      pixel(g,19,19+hop,4,1,P.woodDark);
      pixel(g,11,20+hop,16,2,P.skinLight);
      pixel(g,21,27+hop,8,8,P.gold);
      pixel(g,23,28+hop,3,2,P.cream);
      if(action==="hurt"){
        pixel(g,12,13,4,2,P.cream);pixel(g,21,13,4,2,P.cream);
      }
      if(action==="victory"){
        pixel(g,3,bodyY-7,6,13,P.skin);
        pixel(g,25,bodyY-7,6,13,P.skin);
      }
    });
  }
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
    for(const action of ["idle","run","jump","fall","crouch","hurt","victory"]){
      atlas[action]=Array.from({length:action==="run"?4:action==="idle"?2:2},(_,i)=>buildPlayer(action,i));
    }
    atlas.crab=[buildCrab(0),buildCrab(1)];
    atlas.fish=[buildFish(0),buildFish(1)];
    atlas.coin=Array.from({length:4},(_,i)=>buildCoin(i));
  }
  function sprite(g,name,frame,x,y,w,h,flip=false){
    const sheet=atlas[name]||atlas.idle;
    const im=sheet[Math.abs(Math.floor(frame))%sheet.length];
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
  root.CoastSprites={sprite,house,palm,boat,plank,background,colors:P};
})(typeof window!=="undefined"?window:globalThis);
