/* PNG Adventure Phase 2.1 — original, deterministic 48x64 character sprite frames.
 * Hand-authored anatomy and layered poses. Frames are created once, never per tick.
 * All positions in source pixels; visual pivot is bottom centre (24,64).
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined" && module.exports)module.exports=api;
  if(root)root.CoastBoy=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  const WIDTH=48,HEIGHT=64,ORIGIN={x:24,y:64};
  const palette=Object.freeze({
    outline:"#24313b",hair:"#242735",hairHighlight:"#44414c",
    skin:"#a96f4a",skinShadow:"#805035",skinLight:"#d39a69",
    shirt:"#d3554a",shirtLight:"#ec8361",shirtDark:"#a73e40",
    pants:"#294c67",pantsLight:"#46708b",sock:"#e8e4c1",
    shoes:"#2a3447",shoeLight:"#526479",pouch:"#e5b75f",
    pouchDark:"#91643d",strap:"#5e463d",eye:"#202735",
    white:"#fff1d1"
  });
  // The animation IDs and frame counts are frozen; duration/state logic comes in Phase 2.2.
  const FRAME_COUNTS=Object.freeze({
    idle:6,run:8,takeoff:2,rise:2,apex:1,fall:2,
    land:3,crouch:3,crouchIdle:2,climb:4,hurt:3,victory:6
  });
  const FRAME_FPS=Object.freeze({
    idle:5,run:12,takeoff:12,rise:8,apex:1,fall:8,
    land:15,crouch:12,crouchIdle:4,climb:8,hurt:12,victory:8
  });
  function drawFrame(ctx,action,index){
    if(!Object.prototype.hasOwnProperty.call(FRAME_COUNTS,action))throw new Error("Unknown character pose: "+action);
    if(!Number.isInteger(index)||index<0||index>=FRAME_COUNTS[action])throw new RangeError("Invalid frame index");
    const P=palette;
    const px=(x,y,w,h,c)=>{
      if(w<=0||h<=0)return;
      ctx.fillStyle=c;ctx.fillRect(x|0,y|0,w|0,h|0);
    };
    const band=(x,y,w,c)=>px(x,y,w,2,c);
    // Every frame shares the same ground-contact line (Y=62).
    const run=action==="run",idle=action==="idle",crouched=action==="crouch"||action==="crouchIdle";
    const air=["takeoff","rise","apex","fall"].includes(action);
    const climbing=action==="climb",hurt=action==="hurt",win=action==="victory";
    const stride=run?[-5,-3,0,3,6,3,0,-4][index]:0;
    const arm=run?[5,4,2,-2,-5,-4,-2,2][index]:0;
    const lift=run?[1,0,0,1,2,1,0,0][index]:idle?[0,0,1,1,1,0][index]:win?[0,1,2,2,1,0][index]:0;
    const blink=idle&&index===4;
    const expression=hurt?"hurt":win?"smile":"normal";
    const crouchPhase=action==="crouch"?[7,4,0][index]:0;
    const base=climbing?2:air?(action==="takeoff"?3:action==="rise"?4:action==="apex"?5:2):0;
    const bodyShift=base+lift;
    const legTop=crouched?48-crouchPhase:45-bodyShift;
    if(crouched){
      // Draw grounded, bent knees and shoes first; face retains normal character identity.
      px(12,56,11,5,P.outline);px(26,56,11,5,P.outline);
      px(13,55,9,5,P.shoes);px(27,55,9,5,P.shoes);
      px(13,52-crouchPhase,12,6,P.pants);
      px(24,51-crouchPhase,12,7,P.pantsLight);
    }else{
      // Legs have changing positions: raised stride, extension, airborne tuck, climbing split.
      let leftX=14+stride,rightX=29-stride, leftFoot=60,rightFoot=60;
      if(air){leftX=action==="fall"?13:18;rightX=action==="fall"?28:25;leftFoot=action==="rise"?55:58;rightFoot=action==="apex"?56:59;}
      if(climbing){leftX=12+(index%2)*7;rightX=31-(index%2)*7;leftFoot=56+(index%2)*4;rightFoot=60-(index%2)*4;}
      if(hurt){leftX=13;rightX=31;leftFoot=60;rightFoot=58;}
      px(leftX-2,legTop-2,11,14,P.outline);
      px(rightX-2,legTop-2,11,14,P.outline);
      px(leftX,legTop,7,12,P.pants);
      px(rightX,legTop,7,12,P.pants);
      px(leftX+1,legTop+3,3,5,P.pantsLight);
      px(rightX+1,legTop+3,3,5,P.pantsLight);
      px(leftX-4,leftFoot-4,13,6,P.outline);px(rightX-2,rightFoot-4,13,6,P.outline);
      px(leftX-3,leftFoot-3,11,3,P.shoes);px(rightX-1,rightFoot-3,11,3,P.shoes);
      band(leftX-2,leftFoot-2,10,P.shoeLight);
      band(rightX,rightFoot-2,10,P.shoeLight);
    }
    // Torso narrows at waist; separated neck makes it read as a boy, not a rectangle.
    const bodyY=crouched?38-crouchPhase:29-bodyShift;
    const torsoH=crouched?17:22;
    px(11,bodyY+3,28,torsoH,P.outline);
    px(13,bodyY+4,24,torsoH-2,P.shirtDark);
    px(15,bodyY+5,20,torsoH-4,P.shirt);
    px(17,bodyY+6,12,5,P.shirtLight);
    px(14,bodyY+torsoH-2,22,3,P.pants);
    px(18,bodyY-2,12,6,P.skinShadow);
    px(20,bodyY-3,8,5,P.skin);
    // Bag strap crosses the chest. Bag sways, remaining grounded to the silhouette.
    for(let s=0;s<8;s++)px(17+s,bodyY+4+s*2,3,3,P.strap);
    const bagX=win?31:31+Math.sign(arm);
    px(bagX,bodyY+torsoH-10,11,13,P.outline);
    px(bagX+1,bodyY+torsoH-9,9,11,P.pouchDark);
    px(bagX+2,bodyY+torsoH-8,7,7,P.pouch);
    band(bagX+4,bodyY+torsoH-4,3,P.white);
    // Arms are tapered, bent and have visible hands.
    let leftY=bodyY+8+arm,rightY=bodyY+9-arm;
    let leftX=7,rightX=37;
    if(air){leftY=bodyY-3;rightY=bodyY-2;leftX=6;rightX=38;}
    if(climbing){leftY=bodyY-8+(index%2)*7;rightY=bodyY-1-(index%2)*7;}
    if(win){leftY=bodyY-12-(index%3);rightY=bodyY-8+(index%3);}
    if(hurt){leftY=bodyY-3;rightY=bodyY+3;}
    if(crouched){leftY=bodyY+9;rightY=bodyY+9;leftX=6;rightX=37;}
    px(leftX-1,leftY,9,13,P.outline);px(rightX-1,rightY,9,13,P.outline);
    px(leftX,leftY+1,7,10,P.skin);
    px(rightX,rightY+1,7,10,P.skin);
    px(leftX+1,leftY+7,4,4,P.skinLight);
    px(rightX+1,rightY+7,4,4,P.skinLight);
    // Head with rounded outline, ears, cheek and clear eye direction (right-facing).
    const faceY=crouched?18-crouchPhase:13-bodyShift;
    px(14,faceY+3,23,24,P.outline);
    px(12,faceY+9,3,9,P.outline);px(37,faceY+9,3,9,P.outline);
    px(16,faceY+5,19,19,P.skinShadow);
    px(18,faceY+7,17,16,P.skin);
    px(13,faceY+12,5,7,P.skin);
    px(35,faceY+12,4,7,P.skin);
    px(19,faceY+14,13,8,P.skinLight);
    px(28,faceY+17,4,2,P.skinShadow);
    if(blink){
      band(20,faceY+13,4,P.eye);band(31,faceY+13,4,P.eye);
    }else if(expression==="hurt"){
      px(20,faceY+12,4,2,P.eye);px(31,faceY+12,4,2,P.eye);
      px(28,faceY+20,4,4,P.eye);
    }else{
      px(21,faceY+12,3,3,P.white);px(32,faceY+12,3,3,P.white);
      px(22,faceY+13,2,2,P.eye);px(33,faceY+13,2,2,P.eye);
      px(29,faceY+20,4,2,P.skinShadow);
      if(expression==="smile")px(27,faceY+21,8,2,P.white);
    }
    // Tightly textured, irregular hair silhouette with individually drawn curls.
    px(13,faceY-3,24,9,P.hair);
    px(16,faceY-6,5,5,P.hair);
    px(22,faceY-8,7,6,P.hair);
    px(31,faceY-5,6,5,P.hair);
    px(12,faceY+2,5,10,P.hair);
    px(35,faceY+1,3,7,P.hair);
    px(18,faceY-4,4,2,P.hairHighlight);
    px(28,faceY-5,4,2,P.hairHighlight);
    if(win){px(8,faceY-12,7,4,P.skin);px(39,faceY-8,7,4,P.skin);}
  }
  const SIZES=Object.freeze({width:WIDTH,height:HEIGHT,origin:ORIGIN});
  // External atlas uses 96x112 cells, ten columns, feet at (48,108).
  // Keep the procedural frames as a fallback until the image loads successfully.
  const SOURCE_FRAMES=Object.freeze({
    idle:[0,1,2,3,4,5],run:[19,20,21,22,19,20,21,26],
    takeoff:[27,28],rise:[28,30],apex:[30],fall:[32,33],
    land:[36,38,39],crouch:[39,40,41],crouchIdle:[40,41],
    climb:[63,64,65,64],hurt:[80,81,82],victory:[112,113,114,115,114,113]
  });
  const atlasURL=typeof document!=="undefined"&&document.currentScript
    ? new URL("../../assets/player/atlas.png",document.currentScript.src).href:null;
  function loadExternalAtlas(atlas){
    if(!atlasURL||typeof Image==="undefined")return;
    // A valid image replaces the existing canvases in place; consumers can retain references.
    const image=new Image();
    image.onload=()=>{
      if(image.naturalWidth!==960||image.naturalHeight!==1344)return;
      for(const [action,indices] of Object.entries(SOURCE_FRAMES)){
        indices.forEach((id,i)=>{
          const ctx=atlas[action][i].getContext("2d");
          ctx.clearRect(0,0,WIDTH,HEIGHT);
          ctx.imageSmoothingEnabled=false;
          const sx=(id%10)*96,sy=Math.floor(id/10)*112;
          // Normalize scale across artwork rows, preserving the foot anchor at y=62.
          const scale=action==="hurt"||action==="victory"?0.82:0.64;
          // The climbing reference includes ladder rails; crop them out to avoid
          // rendering a second ladder on top of the world geometry.
          const crop=action==="climb"?{x:35,y:43,w:26,h:61}:{x:0,y:0,w:96,h:112};
          ctx.drawImage(image,sx+crop.x,sy+crop.y,crop.w,crop.h,
            24+(crop.x-48)*scale,62+(crop.y-108)*scale,crop.w*scale,crop.h*scale);
        });
      }
    };
    image.src=atlasURL;
  }
  function createAtlas(createCanvas){
    if(typeof createCanvas!=="function")throw new TypeError("createCanvas required");
    const atlas=Object.create(null);
    for(const [action,count] of Object.entries(FRAME_COUNTS)){
      atlas[action]=Array.from({length:count},(_,i)=>{
        const cv=createCanvas(WIDTH,HEIGHT);
        if(!cv||!cv.getContext)throw new Error("Canvas unavailable");
        cv.width=WIDTH;cv.height=HEIGHT;
        const c=cv.getContext("2d");c.imageSmoothingEnabled=false;
        drawFrame(c,action,i);
        return cv;
      });
    }
    loadExternalAtlas(atlas);
    return atlas;
  }
  function draw(ctx,atlas,action,index,x,feet,scale=1,flip=false){
    const arr=atlas[action]||atlas.idle;
    if(!arr||!arr.length)throw new Error("Sprite atlas not ready");
    const n=((Math.floor(index)%arr.length)+arr.length)%arr.length;
    const width=WIDTH*scale,height=HEIGHT*scale;
    const left=Math.round(x-ORIGIN.x*scale),top=Math.round(feet-ORIGIN.y*scale);
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(flip){ctx.translate(left+width,0);ctx.scale(-1,1);ctx.drawImage(arr[n],0,top,width,height);}
    else ctx.drawImage(arr[n],left,top,width,height);
    ctx.restore();
  }
  return Object.freeze({WIDTH,HEIGHT,ORIGIN,SIZES,palette,FRAME_COUNTS,FRAME_FPS,SOURCE_FRAMES,drawFrame,createAtlas,draw});
});
