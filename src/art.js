/* Original lightweight vector art for PNG Adventure. No external assets/downloads. */
(function () {
  "use strict";
  const W = 960, H = 540, FLOOR = 431, TAU = Math.PI * 2;
  function rect(c,x,y,w,h,color) { c.fillStyle=color; c.fillRect(x,y,w,h); }
  function ellipse(c,x,y,rx,ry,color) {
    c.beginPath(); c.ellipse(x,y,Math.max(1,rx),Math.max(1,ry),0,0,TAU);
    c.fillStyle=color; c.fill();
  }
  function line(c,x,y,x2,y2,w,color) {
    c.beginPath(); c.moveTo(x,y); c.lineTo(x2,y2); c.lineWidth=w;
    c.strokeStyle=color; c.lineCap="round"; c.stroke();
  }
  function poly(c,points,color) {
    c.beginPath(); c.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
    c.closePath(); c.fillStyle=color;c.fill();
  }
  function round(c,x,y,w,h,r,color){
    c.fillStyle=color;c.beginPath();
    r=Math.max(0,Math.min(r,w/2,h/2));
    c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r);
    c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);
    c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y); c.closePath(); c.fill();
  }
  function cloud(c,x,y,s) {
    ellipse(c,x,y,40*s,14*s,"#fffcefdd");
    ellipse(c,x-18*s,y-11*s,25*s,20*s,"#fffcefdd");
    ellipse(c,x+19*s,y-15*s,28*s,22*s,"#fffcefdd");
  }
  function palm(c,x,y,s) {
    line(c,x,y,x+13*s,y-99*s,10*s,"#654c42");
    line(c,x+2*s,y-15*s,x+15*s,y-84*s,2*s,"#aa845e");
    const tx=x+13*s,ty=y-99*s;
    for(let i=0;i<7;i++){
      const a=(-Math.PI*.94)+i*Math.PI/6;
      const ex=tx+Math.cos(a)*61*s,ey=ty+Math.sin(a)*33*s+7*s;
      line(c,tx,ty,ex,ey,8*s,"#1d725d");
      line(c,tx,ty,ex-5*s,ey+5*s,4*s,"#3c9a67");
      for(let j=1;j<=3;j++){
        const q=j/4;
        line(c,tx+(ex-tx)*q,ty+(ey-ty)*q,tx+(ex-tx)*q-7*s,ty+(ey-ty)*q+13*s,2*s,"#246d55");
      }
    }
    ellipse(c,tx-2*s,ty+7*s,5*s,5*s,"#8b6a44");
  }
  function stall(c,x,y,variant) {
    const color=variant%3===0?"#df6b55":variant%3===1?"#418a88":"#e9b34e";
    rect(c,x+9,y+35,115,65,"#a87959");
    rect(c,x+9,y+70,115,30,"#8d694f");
    rect(c,x+15,y+48,103,22,"#d8b894");
    for(let j=0;j<3;j++){
      const px=x+25+j*28;
      ellipse(c,px,y+61,15,7,j===1?"#e9aa59":"#74a55f");
    }
    poly(c,[[x,y+37],[x+21,y+8],[x+114,y+8],[x+136,y+37]],color);
    for(let j=0;j<6;j++) poly(c,[[x+j*22,y+37],[x+(j+1)*22,y+37],[x+(j+1)*22-3,y+45],[x+j*22+3,y+45]],j%2?"#fff0c8":color);
    rect(c,x+8,y+43,5,58,"#77563d");rect(c,x+121,y+43,5,58,"#77563d");
    rect(c,x+52,y-4,33,13,"#f9e4a9");
    rect(c,x+57,y+1,23,3,"#88503b");
  }
  function hut(c,x,y,shade) {
    rect(c,x+8,y+24,101,76,shade);
    poly(c,[[x,y+28],[x+59,y-13],[x+121,y+28]],"#a75b41");
    poly(c,[[x+15,y+26],[x+59,y-2],[x+107,y+26]],"#f0c17d");
    rect(c,x+26,y+46,23,23,"#2b5763");
    rect(c,x+68,y+43,27,57,"#375b60");
    rect(c,x+73,y+48,17,52,"#6d5d47");
    rect(c,x+12,y+98,100,7,"#6e634b");
  }
  function bus(c,x,y) {
    round(c,x,y,170,77,12,"#326d94");
    round(c,x+8,y+6,150,38,5,"#bbdfdb");
    for(let i=0;i<4;i++)line(c,x+42+i*27,y+8,x+42+i*27,y+44,3,"#2c526c");
    round(c,x+10,y+51,142,15,3,"#e7a34b");
    ellipse(c,x+36,y+75,16,16,"#243641");ellipse(c,x+131,y+75,16,16,"#243641");
    ellipse(c,x+36,y+75,7,7,"#b4beb7");ellipse(c,x+131,y+75,7,7,"#b4beb7");
    rect(c,x+159,y+46,8,12,"#ffde9b");
    c.fillStyle="#fff6d2";c.textAlign="center";c.font="900 12px system-ui";c.fillText("PMV",x+88,y+63);
  }
  function drawWorld(c,scroll,zone){
    const themes=[
      {top:"#80c8de",bottom:"#ebdfbd",far:"#98b7a6",mid:"#588d81",grass:"#4f9872",road:"#676f73"},
      {top:"#70c7df",bottom:"#fae5bc",far:"#88bbad",mid:"#4d9b91",grass:"#56a17e",road:"#697b78"},
      {top:"#88b7d6",bottom:"#eddcc0",far:"#799e9f",mid:"#557f79",grass:"#5b9b6e",road:"#656966"}
    ];
    const t=themes[zone]||themes[0],g=c.createLinearGradient(0,0,0,FLOOR);
    g.addColorStop(0,t.top);g.addColorStop(.92,t.bottom);
    rect(c,0,0,W,H,g);
    ellipse(c,zone===2?745:780,94,44,44,"#fff0af");
    const drift=(scroll*.08)%1350;
    cloud(c,260-drift,104,.86);cloud(c,835-drift,68,1);
    cloud(c,1370-drift,145,.63);
    poly(c,[[0,322],[125,246],[232,305],[378,177],[526,321],[640,219],[783,300],[884,225],[960,270],[960,433],[0,433]],t.far);
    poly(c,[[0,370],[158,291],[311,362],[468,255],[648,350],[780,283],[960,351],[960,432],[0,432]],t.mid);
    if(zone===1){
      rect(c,0,350,W,76,"#66b4bc");
      for(let i=0;i<18;i++) line(c,i*67-(scroll*.2)%67,372+(i%3)*12,i*67+21-(scroll*.2)%67,372+(i%3)*12,2,"#dcf5d1");
      for(let i=-1;i<5;i++){
        const x=i*285-(scroll*.28)%285;
        poly(c,[[x+32,370],[x+198,370],[x+160,390],[x+62,390]],"#805743");
        line(c,x+110,365,x+110,316,4,"#72533f");
        poly(c,[[x+110,315],[x+112,360],[x+164,354]],"#fff3cb");
        palm(c,x+224,419,.88);
      }
    }else if(zone===2){
      for(let i=-1;i<6;i++){
        const x=i*255-(scroll*.31)%255;
        rect(c,x+25,374,164,52,"#4b8568");
        for(let k=0;k<4;k++)line(c,x+32,381+k*11,x+172,381+k*11,3,"#79b88a");
        hut(c,x+85,309,i%2?"#ccad7f":"#d5b07c");
      }
    }else{
      for(let i=-1;i<6;i++){
        const x=i*284-(scroll*.34)%284;
        stall(c,x+25,326,i);
        if(i%2===0)bus(c,x+160,347);
        else palm(c,x+231,423,.92);
      }
    }
    rect(c,0,FLOOR-20,W,23,t.grass);
    rect(c,0,FLOOR,W,H-FLOOR,t.road);
    rect(c,0,FLOOR,W,7,"#d6b38c");
    rect(c,0,FLOOR+9,W,12,"#79827b");
    const streak=(scroll*.85)%110;
    for(let i=-1;i<12;i++)round(c,i*110-streak,FLOOR+68,64,6,2,"#e4d6ad");
    rect(c,0,FLOOR+108,W,H-FLOOR-108,"#4b635b");
    for(let i=-1;i<26;i++){
      const x=i*43-(scroll*.63)%43;
      rect(c,x,FLOOR+12,11,3,"#9eae9a");
      rect(c,x+14,FLOOR+102,7,2,"#9eae9a");
    }
    // Roadside depth strip to anchor shadows and the character.
    rect(c,0,FLOOR-4,W,5,"#d2bd93");
  }
  function drawPlatform(c,p,scroll) {
    const x=p.x,y=p.y,w=p.width;
    if(p.type==="rock"){
      poly(c,[[x+4,y+4],[x+17,y-10],[x+w-16,y-10],[x+w-2,y+5],[x+w-20,y+20],[x+24,y+22]],"#708678");
      rect(c,x+9,y-11,w-18,9,"#a3bc9d");
      for(let i=0;i<4;i++) line(c,x+35+i*(w-70)/3,y+15,x+22+i*(w-70)/3,FLOOR,8,"#6c7867");
    }else{
      for(let i=0;i<3;i++) {
        const sx=x+16+i*(w-32)/2;
        line(c,sx,y+9,sx+6,FLOOR,8,p.type==="pier"?"#795b45":"#79624c");
        line(c,sx+6,y+34,sx+65,y+83,4,"#806e53");
      }
      rect(c,x,y,w,19,p.type==="pier"?"#a47a4f":"#c38357");
      rect(c,x,y,w,7,p.type==="pier"?"#e3b87a":"#f2bd71");
      for(let i=0;i<Math.floor(w/30);i++)line(c,x+i*30,y+9,x+i*30,y+18,2,"#704a34");
      if(p.type==="market"){
        for(let i=0;i<2;i++)rect(c,x+25+i*(w-50),y+20,8,14,"#675d4d");
      }
    }
    rect(c,x,y-4,w,4,"#e4d3a4");
  }
  function drawObstacle(c,o) {
    const x=o.x;
    if(o.type==="coin") {
      ellipse(c,x,o.y+2,14,15,"#ad7330");
      ellipse(c,x,o.y,13,14,"#ffe28c");
      ellipse(c,x,o.y,10,11,"#f5b94c");
      c.fillStyle="#ffedb3";c.font="900 14px system-ui";c.textAlign="center";c.fillText("K",x,o.y+5);
    }else if(o.type==="pothole"){
      ellipse(c,x+o.width/2,FLOOR+6,o.width/2+6,15,"#c5b5a2");
      ellipse(c,x+o.width/2,FLOOR+9,o.width/2,12,"#2d373c");
      ellipse(c,x+o.width/2,FLOOR+12,o.width/2-14,6,"#182e36");
      for(let j=0;j<3;j++)line(c,x+8+j*31,FLOOR,x+17+j*28,FLOOR-6,3,"#c0aaa0");
    }else if(o.type==="crate"){
      round(c,x,FLOOR-53,54,53,5,"#704d37");
      round(c,x+4,FLOOR-50,46,46,3,"#bb7a47");
      line(c,x+6,FLOOR-46,x+46,FLOOR-7,6,"#8c593c");
      line(c,x+46,FLOOR-46,x+6,FLOOR-7,6,"#8c593c");
      line(c,x+6,FLOOR-47,x+45,FLOOR-47,3,"#e6ad6e");
      rect(c,x+21,FLOOR-52,12,10,"#e6b57a");
    }else if(o.type==="banner"){
      line(c,x+8,FLOOR-143,x+8,FLOOR-104,5,"#6b5b4c");
      line(c,x+82,FLOOR-143,x+82,FLOOR-104,5,"#6b5b4c");
      round(c,x-1,FLOOR-103,92,65,3,"#9c493f");
      round(c,x+5,FLOOR-97,80,52,3,"#f3cb73");
      for(let i=0;i<6;i++)poly(c,[[x+i*15,FLOOR-44],[x+i*15+7,FLOOR-32],[x+i*15+15,FLOOR-44]],i%2?"#d95c4a":"#f6dba2");
      c.fillStyle="#553b2b";c.textAlign="center";c.font="900 14px system-ui";c.fillText("MARKET",x+45,FLOOR-72);
    }
  }
  function boot(c,x,y,angle,color){
    c.save();c.translate(x,y);c.rotate(angle);round(c,-10,-2,24,11,4,"#202e39");
    rect(c,-9,-2,19,4,color);rect(c,-5,7,23,3,"#f0e4ca");c.restore();
  }
  function drawRunner(c,o) {
    const x=o.x,y=o.footY,sliding=o.slide>0,airborne=!o.grounded;
    if(o.immunity>0 && Math.floor(o.immunity*12)%2===0)return;
    ellipse(c,x,FLOOR+3,airborne?16:28,6,"#223a3a66");
    const shirt=o.shirt||"#e84d47",t=o.stride||0,swing=airborne?.28:Math.sin(t)*.75;
    c.save();c.translate(x,y);
    if(sliding){
      c.translate(0,-1);
      // Low center of mass and horizontal silhouette.
      line(c,-13,-14,-34,-8,10,"#b8764e");
      line(c,10,-18,29,-9,10,"#b8764e");
      boot(c,-36,-3,-.05,shirt);boot(c,15,-2,0,shirt);
      round(c,-30,-30,55,24,10,"#243f62");
      round(c,-20,-35,44,26,10,shirt);
      round(c,6,-44,35,32,14,"#9d6544");
      ellipse(c,39,-33,3,3,"#1b2b32");
      round(c,6,-54,32,13,6,"#272b32");
      c.restore();return;
    }
    // Animated legs, drawn behind the torso for a clear silhouette.
    line(c,-10,-29,-10+Math.sin(t)*15,-7,13,"#293d57");
    line(c,9,-29,11-Math.sin(t)*15,-7,13,"#233950");
    boot(c,-10+Math.sin(t)*15,-3,Math.sin(t)*.15,shirt);
    boot(c,11-Math.sin(t)*15,-3,-Math.sin(t)*.15,shirt);
    // Lightweight cross-body bag strap with animated runner arms.
    line(c,-15,-68,-24-swing*10,-42,12,"#a56a45");
    line(c,16,-68,25+swing*10,-40,12,"#a56a45");
    ellipse(c,-24-swing*10,-41,6,7,"#ac7049");
    ellipse(c,25+swing*10,-39,6,7,"#ac7049");
    round(c,-23,-80,46,52,10,"#21394d");
    round(c,-21,-78,42,48,9,shirt);
    round(c,-17,-74,34,7,4,"#f5d782");
    line(c,-8,-72,15,-32,5,"#46545d");
    round(c,11,-44,17,19,4,"#e9b75e");
    // Face, hair and friendly expression.
    round(c,-20,-116,40,41,17,"#a8714c");
    ellipse(c,-20,-94,5,8,"#9d6544");
    ellipse(c,20,-94,5,8,"#9d6544");
    ellipse(c,-1,-99,15,13,"#ae7955");
    ellipse(c,8,-100,2.6,3.1,"#1c2b34");
    ellipse(c,-7,-100,2.6,3.1,"#1c2b34");
    line(c,0,-88,8,-89,2,"#6a3e31");
    round(c,-21,-124,42,18,8,"#252c32");
    ellipse(c,13,-115,14,9,"#252c32");
    if(o.outfit==="sea"){
      round(c,-22,-126,44,12,5,"#3ba6df");
      round(c,9,-119,30,6,3,"#2b8bc3");
    }else if(o.outfit==="gold"){
      poly(c,[[-4,-132],[0,-122],[11,-122],[3,-115],[7,-106],[-4,-112],[-15,-106],[-11,-116],[-19,-123],[-7,-123]],"#ffe599");
    }
    c.restore();
  }
  window.PNArt = { drawWorld, drawPlatform, drawObstacle, drawRunner };
})();
