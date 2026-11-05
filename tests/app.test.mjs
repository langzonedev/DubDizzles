import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Game,KITS,safeProfile,clamp,TEAM_COLORS,angleDiff} from '../game.js';

// Execute the actual input/controller module with a minimal DOM. Rendering and
// browser APIs are replaced; these tests make no browser/device acceptance claim.
function harness({stored='{}',storageFails=false,touch=false,lockFails=false}={}){
 const listeners=new Map(),elements=new Map(),data=new Map([['war-dizzles-settings',stored]]);
 const classes=()=>({values:new Set(),add(...v){v.forEach(x=>this.values.add(x));},remove(...v){v.forEach(x=>this.values.delete(x));},toggle(v,on){on??=!this.values.has(v);on?this.values.add(v):this.values.delete(v);}});
 function element(id){if(elements.has(id))return elements.get(id);const events=new Map(),attrs={};const el={id,style:{},dataset:{},classList:classes(),children:[],hidden:false,value:'',checked:true,options:[],addEventListener(type,fn){events.set(type,fn);},emit(type,e={}){events.get(type)?.(e);},setAttribute(k,v){attrs[k]=v;},getAttribute(k){return attrs[k];},querySelector(){return element(id+'-inner');},setPointerCapture(){},focus(){document.activeElement=el;},prepend(child){el.children.unshift(child);},replaceChildren(){el.children=[];},remove(){for(const parent of elements.values())parent.children=parent.children.filter(c=>c!==el);}};Object.defineProperty(el,'lastChild',{get:()=>el.children.at(-1)});elements.set(id,el);return el;}
 const document={getElementById:element,body:{classList:classes()},querySelectorAll:()=>kits,createElement:()=>element('created-'+elements.size),addEventListener:(type,fn)=>listeners.set('document:'+type,fn),exitPointerLock(){document.pointerLockElement=null;}};
 const kits=['carbine','smg','marksman'].map(id=>{const el=element('kit-'+id);el.dataset.kit=id;return el;});
 element('difficulty').value='normal';element('difficulty').options=['easy','normal','hard'].map(value=>({value}));element('sensitivity').value='1';element('quality').value='auto';element('quality').options=['auto','low','high'].map(value=>({value}));element('world').requestPointerLock=()=>{if(lockFails)throw Error('unavailable');document.pointerLockElement=element('world');};
 let raf;let now=0;const localStorage={getItem(k){if(storageFails)throw Error('disabled');return data.get(k)||null;},setItem(k,v){if(storageFails)throw Error('disabled');data.set(k,v);}};
 class Renderer{constructor(){this.buffer={height:360};this.reduced=false;this.hurt=0;this.lookScale=1;}resize(){}draw(g){this.lastDraw=g;this.lastPose={...g.player};}minimap(){}}
 const context=vm.createContext({Game,KITS,safeProfile,clamp,TEAM_COLORS,angleDiff,Renderer,document,localStorage,navigator:{maxTouchPoints:touch?1:0},matchMedia:()=>({matches:touch}),performance:{now:()=>now},addEventListener:(type,fn)=>listeners.set(type,fn),requestAnimationFrame:fn=>raf=fn,setTimeout:()=>0,window:{}});
 const code=readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
 vm.runInContext(code+'\nthis.inspect=()=>({game,state,firing,aimHeld,aimToggle,storageOK,renderer});',context);
 return {element,data,document,inspect:()=>context.inspect(),emit:(type,e={})=>listeners.get(type)?.({preventDefault(){},...e}),step(ms=50){now+=ms;raf(now);},visibility(hidden){document.hidden=hidden;listeners.get('document:visibilitychange')?.();}};
}

test('releasing aim preserves held primary fire, releasing primary stops it',()=>{
 const h=harness();h.element('deploy').onclick();h.element('world').emit('pointerdown',{button:0,pointerId:1});h.element('world').emit('pointerdown',{button:2,pointerId:2});h.step();assert.equal(h.inspect().game.aiming,true);assert.equal(h.inspect().firing,true);
 h.emit('pointerup',{button:2});assert.equal(h.inspect().firing,true);h.step();assert.equal(h.inspect().game.aiming,false);const ammo=h.inspect().game.ammo;for(let i=0;i<5;i++)h.step();assert.ok(h.inspect().game.ammo<ammo);
 h.emit('pointerup',{button:0});assert.equal(h.inspect().firing,false);
});

test('pause freezes simulation and resume clears held fire and aim',()=>{
 const h=harness();h.element('deploy').onclick();h.emit('keydown',{code:'Space',repeat:false});h.emit('keydown',{code:'KeyQ',repeat:false});h.step();h.element('pause').onclick();const {game}=h.inspect(),time=game.time,ammo=game.ammo;h.step(5000);assert.equal(game.time,time);assert.equal(h.inspect().state,'paused');
 h.element('resume').onclick();h.step();assert.equal(h.inspect().state,'playing');assert.equal(game.ammo,ammo);assert.equal(game.aiming,false);assert.equal(h.inspect().firing,false);
});

test('ended match restarts with a fresh simulation and cleared input',()=>{
 const h=harness();h.element('deploy').onclick();const old=h.inspect().game;old.bots=[];old.player.x=14;old.player.y=14;old.scores=[59,0,0];old.tick=.99;h.step();assert.equal(h.inspect().state,'end');assert.equal(h.element('overlay').hidden,false);
 h.element('resume').onclick();const fresh=h.inspect().game;assert.notEqual(fresh,old);assert.equal(h.inspect().state,'playing');assert.equal(fresh.ended,false);assert.equal(fresh.time,0);assert.equal(fresh.kills,0);assert.equal(fresh.scores.join(','),'0,0,0');assert.equal(fresh.bots.length,12);
});

test('valid JSON primitives and corrupt settings recover and remain writable',()=>{
 for(const stored of ['true','42','"oops"','null','[]','{broken']){const h=harness({stored});const quality=h.element('quality');quality.value='low';assert.doesNotThrow(()=>quality.emit('change'));assert.equal(JSON.parse(h.data.get('war-dizzles-settings')).quality,'low');assert.doesNotThrow(()=>h.element('deploy').onclick());}
});

test('storage rejection and pointer-lock rejection still permit keyboard play',()=>{
 const h=harness({storageFails:true,lockFails:true});assert.doesNotThrow(()=>h.element('deploy').onclick());assert.equal(h.inspect().storageOK,false);const initial={...h.inspect().game.player};h.emit('keydown',{code:'KeyW',repeat:false});h.step();assert.ok(Math.hypot(h.inspect().game.player.x-initial.x,h.inspect().game.player.y-initial.y)>0);h.emit('keydown',{code:'Space',repeat:false});assert.ok(h.inspect().game.ammo<h.inspect().game.weapon.mag);
});

test('touch cancellation releases fire and hidden-tab interruption clears movement',()=>{
 const h=harness({touch:true});h.element('deploy').onclick();h.element('tFire').onpointerdown({pointerId:10,preventDefault(){}});h.element('stick').onpointerdown({pointerId:11,clientX:0,clientY:0,preventDefault(){}});h.element('stick').onpointermove({pointerId:11,clientX:0,clientY:-38});h.step();assert.equal(h.inspect().firing,true);h.element('tFire').onpointercancel({pointerId:10});assert.equal(h.inspect().firing,false);
 h.visibility(true);assert.equal(h.inspect().state,'paused');h.element('resume').onclick();const {game}=h.inspect(),x=game.player.x,y=game.player.y;h.step();assert.equal(game.player.x,x);assert.equal(game.player.y,y);
});

test('a touch fire tap shoots immediately and a second finger cannot steal ownership',()=>{
 const h=harness({touch:true});h.element('deploy').onclick();const fire=h.element('tFire'),start=h.inspect().game.ammo;
 fire.onpointerdown({pointerId:1,preventDefault(){}});assert.equal(h.inspect().game.ammo,start-1);
 fire.onpointerdown({pointerId:2,preventDefault(){}});fire.onpointerup({pointerId:2});assert.equal(h.inspect().firing,true);
 fire.onlostpointercapture({pointerId:1});assert.equal(h.inspect().firing,false);
});

test('fallback drag supports vertical look and cancellation clears held mouse actions',()=>{
 const h=harness({lockFails:true});h.element('deploy').onclick();const world=h.element('world');
 world.emit('pointerdown',{button:0,pointerId:7,clientX:20,clientY:20});world.emit('pointermove',{pointerId:7,clientX:40,clientY:40});assert.ok(h.inspect().game.player.pitch<0);
 world.emit('pointerdown',{button:2,pointerId:8});h.emit('pointercancel',{type:'pointercancel',button:-1,pointerId:7});assert.equal(h.inspect().aimHeld,false);assert.equal(h.inspect().firing,false);
});

test('pause makes gameplay inert, traps keyboard focus and Escape resumes safely',()=>{
 const h=harness();h.element('deploy').onclick();h.emit('keydown',{code:'Escape'});assert.equal(h.element('hud').inert,true);assert.equal(h.element('world').inert,true);assert.equal(h.document.activeElement,h.element('resume'));
 h.emit('keydown',{code:'Tab'});assert.equal(h.document.activeElement,h.element('backMenu'));h.emit('keydown',{code:'Tab',shiftKey:true});assert.equal(h.document.activeElement,h.element('resume'));
 h.emit('keydown',{code:'Escape'});assert.equal(h.inspect().state,'playing');assert.equal(h.element('hud').inert,false);assert.equal(h.element('world').inert,false);
});

test('fixed simulation steps preserve movement across 20Hz and 144Hz render schedules',()=>{
 const positions=[];
 for(const hz of [20,144]){const h=harness();h.element('deploy').onclick();h.inspect().game.bots=[];h.emit('keydown',{code:'KeyW'});for(let i=0;i<hz;i++)h.step(1000/hz);positions.push(h.inspect().game.player.y);assert.ok(Math.abs(h.inspect().game.time-1)<.01);}
 assert.ok(Math.abs(positions[0]-positions[1])<.025);
});

test('hybrid input follows the active pointer and mouse release survives a concurrent touch',()=>{
 const h=harness({touch:true});h.element('deploy').onclick();h.emit('pointerdown',{pointerType:'mouse'});h.document.pointerLockElement=h.element('world');assert.equal(h.document.body.classList.values.has('touch'),false);
 h.element('world').emit('pointerdown',{button:0,pointerId:1,pointerType:'mouse'});assert.equal(h.inspect().firing,true);
 h.emit('pointerdown',{pointerType:'touch'});assert.equal(h.document.body.classList.values.has('touch'),true);h.emit('pointerup',{button:0,pointerId:1,pointerType:'mouse'});assert.equal(h.inspect().firing,false);
});

test('Tab opens a safe pause instead of moving focus behind the playing field',()=>{
 const h=harness();h.element('deploy').onclick();h.emit('keydown',{code:'Tab'});assert.equal(h.inspect().state,'paused');assert.equal(h.document.activeElement,h.element('resume'));
});

test('pushing touch stick fully forward sprints and releasing it clears sprint',()=>{
 const h=harness({touch:true});h.element('deploy').onclick();const stick=h.element('stick');stick.onpointerdown({pointerId:1,clientX:100,clientY:100,preventDefault(){}});stick.onpointermove({pointerId:1,clientX:100,clientY:60});h.step();assert.equal(h.inspect().game.sprinting,true);assert.ok(h.inspect().game.stamina<100);
 stick.onpointerup({pointerId:1});h.step();assert.equal(h.inspect().game.sprinting,false);
});

test('real mouse button chords support ADS, movement and fire in either press order',()=>{
 for(const first of [2,0]){
  const h=harness();h.element('deploy').onclick();const world=h.element('world'),down=(button,buttons)=>world.emit('mousedown',{button,buttons,preventDefault(){}});down(first,first===2?2:1);down(first===2?0:2,3);
  h.emit('keydown',{code:'KeyW'});h.emit('keydown',{code:'KeyD'});const start={...h.inspect().game.player};h.step();assert.equal(h.inspect().game.aiming,true);assert.equal(h.inspect().firing,true);assert.ok(h.inspect().game.ammo<h.inspect().game.weapon.mag);assert.ok(Math.hypot(h.inspect().game.player.x-start.x,h.inspect().game.player.y-start.y)>0);
  h.emit('mouseup',{button:0,buttons:2});assert.equal(h.inspect().firing,false);h.step();assert.equal(h.inspect().game.aiming,true);h.emit('mouseup',{button:2,buttons:0});h.step();assert.equal(h.inspect().game.aiming,false);
 }
});

test('touch-generated compatibility mouse events do not create held mouse actions',()=>{
 const h=harness({touch:true});h.element('deploy').onclick();h.element('world').emit('mousedown',{button:2,buttons:2,sourceCapabilities:{firesTouchEvents:true},preventDefault(){}});h.step();assert.equal(h.inspect().aimHeld,false);
});

test('angular look updates the player shot pitch and respects scoped sensitivity',()=>{
 const h=harness();h.element('deploy').onclick();h.inspect().renderer.lookScale=.25;
 const start=h.inspect().game.player.a;h.emit('mousemove',{movementX:100,movementY:-100});assert.ok(h.inspect().game.player.pitch>0);assert.ok(h.inspect().game.player.pitch<.3);assert.ok(h.inspect().game.player.a-start<.1);
 h.emit('mousemove',{movementX:0,movementY:-100000});assert.ok(h.inspect().game.player.pitch<=.65);
});

test('display interpolation fills frames between simulation steps without delaying mouse look',()=>{
 const h=harness();h.element('deploy').onclick();h.inspect().game.bots=[];h.emit('keydown',{code:'KeyW'});h.step(1000/120);
 const {game,renderer}=h.inspect(),simY=game.player.y,firstDraw=renderer.lastPose.y,stableDisplay=renderer.lastDraw;assert.ok(firstDraw<simY);
 h.emit('mousemove',{movementX:20,movementY:-10});h.step(1000/240);assert.equal(game.player.y,simY);assert.ok(renderer.lastPose.y>firstDraw&&renderer.lastPose.y<simY);assert.equal(renderer.lastPose.a,game.player.a);assert.equal(renderer.lastPose.pitch,game.player.pitch);assert.equal(renderer.lastDraw,stableDisplay);assert.notEqual(renderer.lastDraw,game);
 h.emit('keyup',{code:'KeyW'});game.player.x+=5;h.step(1);assert.equal(renderer.lastPose.x,game.player.x,'teleports must snap instead of interpolating through intervening walls');
});
