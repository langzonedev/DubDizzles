import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer,cameraView} from '../renderer.js';
import {Game} from '../game.js';

// Execute real renderer decisions with a recording Canvas2D boundary. These are
// geometry/state checks; browser screenshots remain the visual acceptance gate.
function context(){const calls=[];return new Proxy({calls,createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get(target,key){if(key in target)return target[key];return (...args)=>calls.push([key,...args]);}});}
function renderer(){const c=context(),r=Object.create(Renderer.prototype);Object.assign(r,{c,ctx:context(),buffer:{width:160,height:90},canvas:{width:160,height:90},z:new Float32Array(160),flash:0,hit:0,hurt:0,walk:0,pitch:0,motion:0,aim:0,recoil:0,lastAmmo:null,lastGame:null,lastPlayer:null,casings:[],reduced:false,materials:[null,{}, {}, {}],soldiers:new Map()});r.sky=(_c,_w,_h,horizon)=>r.observedHorizon=horizon;r.floor=()=>{};r.zone=()=>{};return r;}
function game(kit='carbine'){const g=new Game({kit});g.bots=[];g.supplies=[];g.grenades=[];g.blasts=[];return g;}

test('scope magnification scales target focal size by four and each kit has distinct ADS',()=>{
 const hip=cameraView('marksman',0);for(const [kit,power]of [['marksman',4],['carbine',1.45],['smg',1.2]]){const ads=cameraView(kit,1);assert.ok(Math.abs(Math.tan(hip.fov/2)/Math.tan(ads.fov/2)-power)<1e-12);assert.equal(ads.scoped,kit==='marksman');}
});

test('ADS settles consistently across frame rates and scoped rendering excludes the foreground gun',()=>{
 const outcomes=[];for(const hz of [20,144]){const r=renderer(),g=game('marksman');g.aiming=true;let guns=0,scopes=0;r.gun=()=>guns++;r.scope=()=>scopes++;for(let n=0;n<hz;n++)r.draw(g,1/hz,true);assert.ok(scopes>0);const before=guns;r.draw(g,1/hz,true);assert.equal(guns,before);assert.ok(Math.abs(r.lookScale-.25)<1e-10);outcomes.push(r.aim);g.aiming=false;r.draw(g,.2,true);assert.ok(guns>before);}
 assert.ok(Math.abs(outcomes[0]-outcomes[1])<1e-12);
});

test('walking ADS keeps the reticle horizon stable and angular pitch agrees with focal projection',()=>{
 const r=renderer(),g=game('marksman');g.aiming=true;r.scope=()=>{};r.gun=()=>{};for(let n=0;n<30;n++){g.player.x+=.001;r.draw(g,1/60,true);assert.equal(r.observedHorizon,45);}
 g.player.pitch=.12;r.draw(g,1/60,true);const projection=160/(2*Math.tan(cameraView(g.kit,r.aim).fov/2));assert.ok(Math.abs(r.observedHorizon-(45+Math.tan(.12)*projection))<1e-9);
});

test('scope masks outside its circular optic and places the reticle at the actual viewport centre',()=>{
 const r=renderer(),c=context();r.scope(c,800,450);assert.ok(c.calls.some(x=>x[0]==='fill'&&x[1]==='evenodd'));assert.ok(c.calls.some(x=>x[0]==='arc'&&x[1]===400&&x[2]===225&&x[3]===450*.435));assert.ok(c.calls.some(x=>x[0]==='ellipse'&&x[1]===400&&x[2]===225));
});

test('carbine reflex and SMG open sights reuse the detailed gun below a clear sight window',()=>{
 const r=renderer();let detailed=0;r.gun=()=>detailed++;for(const kit of ['carbine','smg']){r.c=context();r.ads({kit},800,450);assert.ok(r.c.calls.some(x=>x[0]==='ellipse'&&x[1]===400&&x[2]===225));assert.ok(r.c.calls.some(x=>x[0]==='rect'&&x[2]>225));assert.ok(r.c.calls.some(x=>x[0]==='clip'));}assert.equal(detailed,2);
});

test('continuous soldier facing draws one head with correctly signed left and right profiles',()=>{
 const r=renderer();for(const angle of [0,.1,.4,.7,Math.PI/2,Math.PI,-Math.PI/2]){const c=context();r.drawSoldier(c,0,angle,0,1,80,80,40);assert.equal(c.calls.filter(x=>x[0]==='ellipse'&&x[3]===16&&x[4]===19).length,1);assert.equal(c.calls.filter(x=>x[0]==='drawImage').length,0);}
 const left=context(),right=context();r.soldier(left,0,Math.PI/2);r.soldier(right,0,-Math.PI/2);const muzzle=c=>c.calls.find(x=>x[0]==='fillRect'&&x[2]===67&&x[3]===9&&x[4]===5)[1];assert.ok(muzzle(left)<64);assert.ok(muzzle(right)>64);
});

test('walking legs and torso articulate continuously without sprite allocation or double silhouettes',()=>{
 const r=renderer(),a=context(),b=context();r.drawSoldier(a,0,0,0,1,80,80,40);r.drawSoldier(b,0,.001,.001,1,80,80,40);const legA=a.calls.find(x=>x[0]==='lineTo'),legB=b.calls.find(x=>x[0]==='lineTo');assert.ok(Math.abs(legA[1]-legB[1])<.02);const c=context();r.drawSoldier(c,0,0,Math.PI/2,1,80,80,40);assert.notDeepEqual(a.calls.filter(x=>x[0]==='lineTo'),c.calls.filter(x=>x[0]==='lineTo'));assert.equal(a.calls.length,b.calls.length);
});

test('reduced motion switches optics without zoom animation or walking sway',()=>{
 const r=renderer(),g=game('marksman');r.reduced=true;r.scope=()=>{};r.gun=()=>{};g.aiming=true;r.draw(g,1/144,true);assert.equal(r.aim,1);assert.equal(r.lookScale,.25);g.aiming=false;r.draw(g,1/144,true);assert.equal(r.aim,0);assert.equal(r.observedHorizon,45);
});
