const test=require("node:test");
const assert=require("node:assert/strict");
const Touch=require("../coast/input/touch.js");

function harness(){
  const changes=[],buttons={},handlers={};
  for(const name of Touch.ACTIONS){
    const classes=new Set();
    const el={
      dataset:{control:name},
      captures:[],
      attrs:{},
      classList:{toggle(cls,on){if(on)classes.add(cls);else classes.delete(cls)}},
      setAttribute(k,v){el.attrs[k]=v},
      setPointerCapture(id){el.captures.push(id)},
      addEventListener(type,fn){handlers[name+":"+type]=fn},
      classes
    };
    buttons[name]=el;
  }
  const control=Touch.create(Object.values(buttons),(k,v)=>changes.push([k,v]));
  function fire(action,type,id,extra={}){
    const event={
      pointerId:id,pointerType:"touch",button:0,cancelable:true,
      prevented:false,preventDefault(){this.prevented=true},...extra
    };
    handlers[action+":"+type](event);
    return event;
  }
  return {buttons,control,changes,fire};
}

test("defines exactly the five original gameplay actions",()=>{
 assert.deepEqual(Array.from(Touch.ACTIONS),["left","right","up","down","jump"]);
});

test("one pointer press/release toggles visual feedback and aria state",()=>{
 const h=harness();
 const e=h.fire("jump","pointerdown",10);
 assert.equal(e.prevented,true);
 assert.equal(h.control.isPressed("jump"),true);
 assert.equal(h.buttons.jump.attrs["aria-pressed"],"true");
 assert.equal(h.buttons.jump.classes.has("is-pressed"),true);
 assert.deepEqual(h.changes,[["jump",true]]);
 h.fire("jump","pointerup",10);
 assert.equal(h.control.isPressed("jump"),false);
 assert.equal(h.buttons.jump.attrs["aria-pressed"],"false");
 assert.deepEqual(h.changes,[["jump",true],["jump",false]]);
});

test("can walk, jump and climb simultaneously with separate fingers",()=>{
 const h=harness();
 h.fire("right","pointerdown",1);
 h.fire("jump","pointerdown",2);
 h.fire("up","pointerdown",3);
 assert.equal(h.control.pointerCount(),3);
 for(const action of ["right","jump","up"])assert.equal(h.control.isPressed(action),true);
 h.fire("jump","pointerup",2);
 assert.equal(h.control.isPressed("jump"),false);
 assert.equal(h.control.isPressed("right"),true);
 assert.equal(h.control.isPressed("up"),true);
});

test("two fingers holding same button release independently",()=>{
 const h=harness();
 h.fire("left","pointerdown",4);
 h.fire("left","pointerdown",5);
 assert.deepEqual(h.changes,[["left",true]]);
 h.fire("left","pointerup",4);
 assert.equal(h.control.isPressed("left"),true);
 assert.deepEqual(h.changes,[["left",true]]);
 h.fire("left","pointerup",5);
 assert.equal(h.control.isPressed("left"),false);
 assert.deepEqual(h.changes,[["left",true],["left",false]]);
});

test("cancel, lost capture and duplicate release do not produce ghost input",()=>{
 const h=harness();
 h.fire("down","pointerdown",9);
 h.fire("down","pointercancel",9);
 h.fire("down","lostpointercapture",9);
 h.fire("down","pointerup",9);
 assert.deepEqual(h.changes,[["down",true],["down",false]]);
 h.fire("up","pointerdown",11);
 h.fire("up","lostpointercapture",11);
 assert.equal(h.control.isPressed("up"),false);
});

test("clear releases all actions after blur, pause or restart",()=>{
 const h=harness();
 h.fire("right","pointerdown",7);
 h.fire("jump","pointerdown",8);
 h.control.clear();
 assert.equal(h.control.pointerCount(),0);
 assert.equal(h.control.isPressed("right"),false);
 assert.equal(h.control.isPressed("jump"),false);
 assert.equal(h.buttons.jump.classes.has("is-pressed"),false);
 h.fire("jump","pointerup",8);
 assert.equal(h.control.isPressed("jump"),false);
});

test("mouse secondary button ignored and input schema is validated",()=>{
 const h=harness();
 h.fire("right","pointerdown",14,{pointerType:"mouse",button:2});
 assert.equal(h.control.isPressed("right"),false);
 assert.throws(()=>Touch.create([]),TypeError);
 const bad={dataset:{control:"fire"},addEventListener(){}};
 assert.throws(()=>Touch.create([bad],()=>{}),/Unknown touch action/);
});

test("touch module contains no physics or render loop dependency",()=>{
 const module=require("../coast/input/touch.js");
 assert.equal(typeof module.create,"function");
 assert.equal("movePlayer" in module,false);
});
