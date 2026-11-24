(function(){
"use strict";
const boy=window.CoastBoy,atlas=boy.createAtlas((w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c},()=>refreshThumbnails());
const select=document.getElementById("pose"),slider=document.getElementById("frame"),label=document.getElementById("frame-label");
const info=document.getElementById("info"),grid=document.getElementById("frames");
const canvas=document.getElementById("preview"),ctx=canvas.getContext("2d");
let action="idle",index=0,play=true,flip=false,accum=0,last=0;
for(const name of Object.keys(boy.FRAME_COUNTS)){
 const option=document.createElement("option");option.value=name;option.textContent=name.toUpperCase()+" ("+boy.FRAME_COUNTS[name]+")";select.append(option);
}
function selectPose(name){
 action=name;index=0;accum=0;slider.max=String(boy.FRAME_COUNTS[name]-1);slider.value="0";
 grid.replaceChildren();
 atlas[name].forEach((img,i)=>{
  const btn=document.createElement("button");btn.className="frame";btn.type="button";btn.setAttribute("aria-label","Frame "+(i+1));
  const c=document.createElement("canvas");c.width=48;c.height=64;const g=c.getContext("2d");g.imageSmoothingEnabled=false;g.drawImage(img,0,0);
  btn.append(c);btn.addEventListener("click",()=>{play=false;document.getElementById("play").textContent="▶ PLAY";index=i;slider.value=String(i);draw(0)});
  grid.append(btn);
 });
 draw(0);
}
function refreshThumbnails(){
 [...grid.children].forEach((btn,i)=>{const c=btn.querySelector("canvas"),g=c.getContext("2d");g.clearRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;g.drawImage(atlas[action][i],0,0);});
}
function draw(t){
 ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,512,512);
 const sky=ctx.createLinearGradient(0,0,0,512);sky.addColorStop(0,"#9ad3d2");sky.addColorStop(1,"#b0c997");
 ctx.fillStyle=sky;ctx.fillRect(0,0,512,512);
 ctx.fillStyle="#d7a66f";ctx.fillRect(0,450,512,15);ctx.fillStyle="#886347";ctx.fillRect(0,465,512,47);
 for(let x=0;x<512;x+=55){ctx.fillStyle="#6e4f3e";ctx.fillRect(x,461,4,6);}
 boy.draw(ctx,atlas,action,index,256,448,5,flip);
 label.textContent=String(index+1)+" / "+boy.FRAME_COUNTS[action];
 info.textContent="SOURCE 48×64 PX · PIVOT (24,64) · "+boy.FRAME_FPS[action]+" FPS";
 [...grid.children].forEach((el,i)=>el.setAttribute("aria-current",String(i===index)));
}
function loop(now){
 const dt=last?Math.min(.06,(now-last)/1000):0;last=now;
 if(play){accum+=dt;const duration=1/boy.FRAME_FPS[action];if(accum>=duration){const steps=Math.floor(accum/duration);accum%=duration;index=(index+steps)%boy.FRAME_COUNTS[action];slider.value=String(index);}}
 draw(now);
 requestAnimationFrame(loop);
}
select.addEventListener("change",()=>selectPose(select.value));
slider.addEventListener("input",()=>{index=Number(slider.value);accum=0;play=false;document.getElementById("play").textContent="▶ PLAY";draw(0)});
document.getElementById("play").addEventListener("click",()=>{play=!play;document.getElementById("play").textContent=play?"Ⅱ PAUSE":"▶ PLAY"});
document.getElementById("flip").addEventListener("click",()=>{flip=!flip;draw(0)});
selectPose("idle");requestAnimationFrame(loop);
})();
