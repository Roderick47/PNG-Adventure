/* Phase 2.3 — deterministic, dependency-free player movement and collision.
 * Uses bounded substeps so low-FPS devices cannot tunnel through platforms.
 * Never renders or touches the browser. Positions are game-world pixels.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.CoastController=api;
})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this),function(){
  "use strict";
  const SETTINGS=Object.freeze({
    maxSpeed:235,crouchSpeed:115,groundAccel:1900,airAccel:1250,
    groundBrake:2400,airBrake:650,gravity:1180,maxFall:860,
    jumpVelocity:-525,earlyRelease:-210,ladderSpeed:155,
    coyoteSeconds:.10,bufferSeconds:.12,halfWidth:14,maxStep:1/120
  });
  const moveTowards=(current,target,amount)=>current<target?
    Math.min(current+amount,target):Math.max(current-amount,target);
  function create(level,player,overrides){
    if(!level||!level.landing||!level.nearbyLadder)throw new TypeError("Coastal level collision API required");
    if(!player||typeof player!=="object")throw new TypeError("Mutable player required");
    const c={...SETTINGS,...(overrides||{})};
    if(c.maxStep<=0||c.gravity<=0)throw new RangeError("Invalid physics settings");
    function reset(x=83,feet=level.FLOOR){
      Object.assign(player,{x,feet,vx:0,vy:0,grounded:true,climbing:false,
        face:1,crouch:false,coyote:0,buffer:0});
    }
    function requestJump(){
      player.buffer=c.bufferSeconds;
    }
    function doJump(events){
      player.vy=c.jumpVelocity;player.grounded=false;player.climbing=false;
      player.coyote=0;player.buffer=0;events.jumped=true;
    }
    function step(keys,elapsed){
      const events={jumped:false,landed:false,walkedOff:false,climbing:false};
      const dt=Math.max(0,Math.min(.10,Number.isFinite(elapsed)?elapsed:0));
      let remaining=dt;
      while(remaining>1e-9){
        const h=Math.min(c.maxStep,remaining);remaining-=h;
        advance(keys||{},h,events);
      }
      return events;
    }
    function advance(keys,h,events){
      const axis=(keys.right?1:0)-(keys.left?1:0);
      const vertical=(keys.down?1:0)-(keys.up?1:0);
      const ladder=level.nearbyLadder(player.x,player.feet);
      const wantsClimb=ladder && !keys.jump && (keys.up || (keys.down&&!player.grounded));
      if(wantsClimb&&!player.climbing){
        player.climbing=true;player.vy=0;player.grounded=false;
        player.coyote=0;player.buffer=0;
      }
      if(player.climbing&&!ladder){
        player.climbing=false;player.vy=0;
      }
      const allowedCrouch=keys.down&&player.grounded&&!player.climbing;
      player.crouch=!!allowedCrouch;
      const maxHorizontal=player.crouch?c.crouchSpeed:c.maxSpeed;
      const target=axis*maxHorizontal;
      const acceleration=axis?
        (player.grounded?c.groundAccel:c.airAccel):
        (player.grounded?c.groundBrake:c.airBrake);
      player.vx=moveTowards(player.vx||0,target,acceleration*h);
      player.x=Math.max(18,Math.min(level.WORLD_WIDTH-18,player.x+player.vx*h));
      if(axis)player.face=axis;
      if(player.climbing){
        if(player.buffer>0&&keys.jump){
          doJump(events);
        }else{
          const currentLadder=level.nearbyLadder(player.x,player.feet);
          if(currentLadder){
            player.vy=0;
            player.feet=Math.max(currentLadder.y-5,Math.min(currentLadder.y+currentLadder.h+8,
              player.feet+vertical*c.ladderSpeed*h));
            player.crouch=false;events.climbing=true;
            return;
          }
          player.climbing=false;
        }
      }
      const wasGrounded=player.grounded;
      // Check the surface under the current position, using exactly the same
      // horizontal bounds as landing. Leaving an edge enables coyote time.
      if(wasGrounded){
        const support=level.surfaces.some(s=>
          Math.abs(s.y-player.feet)<1.5 &&
          player.x+c.halfWidth>s.x && player.x-c.halfWidth<s.x+s.w);
        if(!support){
          player.grounded=false;
          player.coyote=c.coyoteSeconds;
          events.walkedOff=true;
        }
      }else{
        player.coyote=Math.max(0,(player.coyote||0)-h);
      }
      if((player.buffer||0)>0&&(player.grounded||player.coyote>0)){
        doJump(events);
      }
      player.buffer=Math.max(0,(player.buffer||0)-h);
      if(!keys.jump&&player.vy<c.earlyRelease)player.vy=c.earlyRelease;
      const before=player.feet;
      player.vy=Math.min(c.maxFall,player.vy+c.gravity*h);
      player.feet+=player.vy*h;
      const surface=player.vy>=0?
        level.landing(before,player.feet,player.x,c.halfWidth*2):null;
      if(surface){
        player.feet=surface.y;player.vy=0;
        if(!player.grounded){
          player.grounded=true;
          player.coyote=0;
          if(!events.jumped)events.landed=true;
        }
        if(player.buffer>0)doJump(events);
      }else{
        player.grounded=false;
      }
    }
    return Object.freeze({reset,requestJump,step,settings:Object.freeze(c)});
  }
  return Object.freeze({SETTINGS,create});
});
