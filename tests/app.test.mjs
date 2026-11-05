import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Game,KITS,safeProfile,clamp,TEAM_COLORS} from '../game.js';

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
 class Renderer{constructor(){this.buffer={height:360};this.reduced=false;this.hurt=0;}resize(){}draw(){}minimap(){}}
 const context=vm.createContext({Game,KITS,safeProfile,clamp,TEAM_COLORS,Renderer,document,localStorage,navigator:{maxTouchPoints:touch?1:0},matchMedia:()=>({matches:touch}),performance:{now:()=>now},addEventListener:(type,fn)=>listeners.set(type,fn),requestAnimationFrame:fn=>raf=fn,setTimeout:()=>0,window:{}});
 const code=readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 vm.runInContext(code+'\nthis.inspect=()=>({game,state,firing,aimHeld,aimToggle,storageOK});',context);
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
