import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Game,KITS,safeProfile,clamp,TEAM_COLORS,angleDiff} from '../game.js';

// Execute the actual input/controller module with a minimal DOM. Rendering and
// browser APIs are replaced; these tests make no browser/device acceptance claim.
function harness({stored='{}',storageFails=false,touch=false,lockFails=false,rawUnsupported=false,rawRejects=false}={}){
 const listeners=new Map(),elements=new Map(),timers=new Map();let timerId=0;const listen=(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);};const data=new Map([['war-dizzles-settings',stored]]);
 const classes=()=>({values:new Set(),add(...v){v.forEach(x=>this.values.add(x));},remove(...v){v.forEach(x=>this.values.delete(x));},toggle(v,on){on??=!this.values.has(v);on?this.values.add(v):this.values.delete(v);}});
 function element(id){if(elements.has(id))return elements.get(id);const events=new Map(),attrs={};const el={id,style:{},dataset:{},classList:classes(),children:[],hidden:false,value:'',checked:true,options:[],addEventListener(type,fn){events.set(type,fn);},emit(type,e={}){events.get(type)?.(e);},setAttribute(k,v){attrs[k]=v;},getAttribute(k){return attrs[k];},querySelector(){return element(id+'-inner');},setPointerCapture(){},focus(){document.activeElement=el;},prepend(child){el.children.unshift(child);},replaceChildren(){el.children=[];},remove(){for(const parent of elements.values())parent.children=parent.children.filter(c=>c!==el);}};Object.defineProperty(el,'lastChild',{get:()=>el.children.at(-1)});elements.set(id,el);return el;}
 const document={getElementById:element,body:{classList:classes()},querySelectorAll:()=>kits,createElement:()=>element('created-'+elements.size),addEventListener:(type,fn)=>listen('document:'+type,fn),exitPointerLock(){document.pointerLockElement=null;}};
 const kits=['carbine','smg','marksman'].map(id=>{const el=element('kit-'+id);el.dataset.kit=id;return el;});
 element('difficulty').value='normal';element('difficulty').options=['easy','normal','hard'].map(value=>({value}));element('sensitivity').value='1';element('quality').value='auto';element('quality').options=['auto','low','high'].map(value=>({value}));element('aimSensitivity').value='1';element('inputProfile').value='trackpad';element('inputProfile').options=['trackpad','mouse'].map(value=>({value}));const lockCalls=[];element('world').requestPointerLock=options=>{lockCalls.push(options);if(options&&rawRejects)return Promise.reject(Object.assign(Error('raw unsupported'),{name:'NotSupportedError'}));if(options&&rawUnsupported)throw Object.assign(Error('raw unsupported'),{name:'NotSupportedError'});if(lockFails)throw Error('unavailable');document.pointerLockElement=element('world');};
 let raf;let now=0;const localStorage={getItem(k){if(storageFails)throw Error('disabled');return data.get(k)||null;},setItem(k,v){if(storageFails)throw Error('disabled');data.set(k,v);}};
 class Renderer{constructor(){this.buffer={height:360};this.reduced=false;this.hurt=0;this.lookScale=1;}resize(){}draw(g){this.lastDraw=g;this.lastPose={...g.player};}minimap(){}}
 const context=vm.createContext({Game,KITS,safeProfile,clamp,TEAM_COLORS,angleDiff,Renderer,document,localStorage,navigator:{maxTouchPoints:touch?1:0},matchMedia:()=>({matches:touch}),performance:{now:()=>now},addEventListener:(type,fn)=>listen(type,fn),requestAnimationFrame:fn=>raf=fn,setTimeout:(fn,ms)=>{timers.set(++timerId,{fn,ms});return timerId;},clearTimeout:id=>timers.delete(id),window:{}});
 const code=readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
 vm.runInContext(code+'\nthis.inspect=()=>({game,state,firing,aimHeld,aimToggle,storageOK,renderer,cruise,cruiseMove,triggerLatch,inputCheckActive,inputCheckCounts,inputCheckKeys:[...inputCheckKeys],keys:[...keys]});',context);
 return {element,data,document,lockCalls,expireInputCheck(){for(const {fn,ms}of timers.values())if(ms===30000)fn();},inspect:()=>context.inspect(),emit:(type,e={})=>listeners.get(type)?.forEach(fn=>fn({preventDefault(){},...e})),step(ms=50){now+=ms;raf(now);},visibility(hidden){document.hidden=hidden;listeners.get('document:visibilitychange')?.forEach(fn=>fn());}};
}


const tap=(h,code)=>{h.emit('keydown',{code,repeat:false});h.emit('keyup',{code});};
const deploy=h=>{h.element('deploy').onclick();h.inspect().game.bots=[];return h;};
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('delivered yaw and pitch remain immediate during sustained W+D+ADS+fire, absent data invents no look',()=>{
 const h=deploy(harness());h.emit('keydown',{code:'KeyW'});h.emit('keydown',{code:'KeyD'});h.element('world').emit('mousedown',{button:2});h.element('world').emit('mousedown',{button:0});
 const start={...h.inspect().game.player};
 for(let i=0;i<30;i++){const before={...h.inspect().game.player};h.emit('mousemove',{movementX:2,movementY:-1});near(h.inspect().game.player.a-before.a,.005);near(h.inspect().game.player.pitch-before.pitch,.0025);h.step(10);assert.equal(h.inspect().game.aiming,true);assert.equal(h.inspect().firing,true);}
 const after={...h.inspect().game.player};assert.ok(Math.hypot(after.x-start.x,after.y-start.y)>.1);assert.ok(h.inspect().game.ammo<24);
 for(let i=0;i<20;i++)h.step(10);near(h.inspect().game.player.a,after.a);near(h.inspect().game.player.pitch,after.pitch);
});

test('C cruise starts forward and tapped WASD latch independent axes with no keyboard key held',()=>{
 const h=deploy(harness());tap(h,'KeyC');assert.equal(h.inspect().cruise,true);assert.deepEqual({...h.inspect().cruiseMove},{forward:1,strafe:0});tap(h,'KeyD');assert.deepEqual({...h.inspect().cruiseMove},{forward:1,strafe:1});assert.equal(h.inspect().keys.length,0);
 const before={...h.inspect().game.player};h.step(100);assert.ok(Math.hypot(h.inspect().game.player.x-before.x,h.inspect().game.player.y-before.y)>.1);
 tap(h,'KeyW');assert.deepEqual({...h.inspect().cruiseMove},{forward:0,strafe:1});tap(h,'KeyS');tap(h,'KeyA');assert.deepEqual({...h.inspect().cruiseMove},{forward:-1,strafe:-1});tap(h,'KeyC');assert.equal(h.inspect().cruise,false);assert.deepEqual({...h.inspect().cruiseMove},{forward:0,strafe:0});
});

test('laptop trigger latch fires with C/Q toggles and all keys released; repeats do not retoggle',()=>{
 const h=deploy(harness());for(const code of ['KeyC','KeyQ','KeyF'])tap(h,code);const before={...h.inspect().game.player},ammo=h.inspect().game.ammo;assert.equal(h.inspect().keys.length,0);
 h.emit('keydown',{code:'KeyF',repeat:true});assert.equal(h.inspect().triggerLatch,true);h.emit('mousemove',{movementX:15,movementY:-10});h.step(100);h.step(100);assert.equal(h.inspect().game.aiming,true);assert.ok(h.inspect().game.ammo<ammo);assert.ok(h.inspect().game.player.a>before.a);assert.ok(h.inspect().game.player.pitch>before.pitch);assert.ok(Math.hypot(h.inspect().game.player.x-before.x,h.inspect().game.player.y-before.y)>.1);
 tap(h,'KeyF');assert.equal(h.inspect().triggerLatch,false);const stopped=h.inspect().game.ammo;h.step(100);h.step(100);assert.equal(h.inspect().game.ammo,stopped);
});

test('X, pause, death, blur and hidden-page interruption clear latches and reject orphan repeats',()=>{
 for(const action of ['X','pause','death','blur','hidden']){
  const h=deploy(harness());for(const code of ['KeyC','KeyQ','KeyF'])tap(h,code);h.emit('keydown',{code:'KeyW'});
  if(action==='X')tap(h,'KeyX');else if(action==='pause')h.element('pause').onclick();else if(action==='death')h.inspect().game.event('death','test');else if(action==='blur')h.emit('blur');else h.visibility(true);
  assert.equal(h.inspect().cruise,false,action);assert.equal(h.inspect().triggerLatch,false,action);assert.equal(h.inspect().firing,false,action);assert.equal(h.inspect().keys.length,0,action);
  if(h.inspect().state==='paused')h.element('resume').onclick();
  for(const code of ['KeyW','KeyF','KeyC'])h.emit('keydown',{code,repeat:true});const pose={...h.inspect().game.player},ammo=h.inspect().game.ammo;h.step(100);h.step(100);assert.equal(h.inspect().keys.length,0,action);assert.equal(h.inspect().game.ammo,ammo,action);near(h.inspect().game.player.x,pose.x);near(h.inspect().game.player.y,pose.y);
 }
});

test('ADS sensitivity is independent from hip sensitivity and validates persisted range',()=>{
 const h=deploy(harness({stored:'{"sensitivity":"1.5","aimSensitivity":"0.5"}'}));let a=h.inspect().game.player.a;h.emit('mousemove',{movementX:10,movementY:0});near(h.inspect().game.player.a-a,.0375);tap(h,'KeyQ');a=h.inspect().game.player.a;h.emit('mousemove',{movementX:10,movementY:0});near(h.inspect().game.player.a-a,.01875);
 const invalid=harness({stored:'{"aimSensitivity":"0"}'});assert.equal(invalid.element('aimSensitivity').value,'1');
});

test('trackpad requests adjusted capture; mouse raw NotSupportedError falls back to normal capture',()=>{
 const trackpad=deploy(harness());assert.equal(trackpad.lockCalls.length,1);assert.equal(trackpad.lockCalls[0],undefined);
 const mouse=deploy(harness({stored:'{"inputProfile":"mouse"}',rawUnsupported:true}));assert.equal(mouse.lockCalls.length,2);assert.equal(mouse.lockCalls[0].unadjustedMovement,true);assert.equal(mouse.lockCalls[1],undefined);tap(mouse,'KeyF');assert.equal(mouse.inspect().triggerLatch,false);
});


test('asynchronous raw-pointer NotSupported rejection retries normal capture without unhandled failure',async()=>{
 const h=deploy(harness({stored:'{"inputProfile":"mouse"}',rawRejects:true}));await new Promise(resolve=>setImmediate(resolve));assert.equal(h.lockCalls.length,2);assert.equal(h.lockCalls[0].unadjustedMovement,true);assert.equal(h.lockCalls[1],undefined);assert.equal(h.document.pointerLockElement,h.element('world'));
});


test('opt-in input checker counts delivered free/held events only and stops on every interruption',()=>{
 for(const stop of ['manual','escape','blur','hidden','deploy','timeout']){
  const h=harness();h.emit('mousemove',{movementX:3,movementY:2});assert.equal(h.inspect().inputCheckCounts.free,0);h.element('checkInput').onclick();assert.equal(h.inspect().inputCheckActive,true);
  h.emit('mousemove',{movementX:1,movementY:2});h.emit('keydown',{code:'KeyW'});h.emit('mousemove',{movementX:3,movementY:4});h.emit('keyup',{code:'KeyW'});assert.deepEqual({...h.inspect().inputCheckCounts},{free:1,held:1});
  if(stop==='manual')h.element('checkInput').onclick();else if(stop==='escape')tap(h,'Escape');else if(stop==='blur')h.emit('blur');else if(stop==='hidden')h.visibility(true);else if(stop==='deploy')h.element('deploy').onclick();else h.expireInputCheck();
  assert.equal(h.inspect().inputCheckActive,false,stop);assert.equal(h.inspect().inputCheckKeys.length,0,stop);h.emit('mousemove',{movementX:10,movementY:20});assert.deepEqual({...h.inspect().inputCheckCounts},{free:1,held:1},stop);
 }
});
