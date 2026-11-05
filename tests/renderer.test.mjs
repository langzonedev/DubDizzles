import test from 'node:test';
import assert from 'node:assert/strict';
import {Renderer,cameraView,material,wallTextureU} from '../renderer.js';
import {Game,raycast} from '../game.js';

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
 const r=renderer();for(const angle of [0,.1,.4,.7,Math.PI/2,Math.PI,-Math.PI/2]){const c=context();r.drawSoldier(c,0,angle,0,1,80,80,40);assert.equal(c.calls.filter(x=>x[0]==='ellipse'&&x[3]===14&&x[4]===16).length,1);assert.equal(c.calls.filter(x=>x[0]==='drawImage').length,0);}
 const left=context(),right=context();r.soldier(left,0,Math.PI/2);r.soldier(right,0,-Math.PI/2);const muzzle=c=>c.calls.find(x=>x[0]==='fillRect'&&x[2]===67&&x[3]===9&&x[4]===5)[1];assert.ok(muzzle(left)<64);assert.ok(muzzle(right)>64);
});

test('walking legs and torso articulate continuously without sprite allocation or double silhouettes',()=>{
 const r=renderer(),a=context(),b=context();r.drawSoldier(a,0,0,0,1,80,80,40);r.drawSoldier(b,0,.001,.001,1,80,80,40);const legA=a.calls.find(x=>x[0]==='lineTo'),legB=b.calls.find(x=>x[0]==='lineTo');assert.ok(Math.abs(legA[1]-legB[1])<.02);const c=context();r.drawSoldier(c,0,0,Math.PI/2,1,80,80,40);assert.notDeepEqual(a.calls.filter(x=>x[0]==='lineTo'),c.calls.filter(x=>x[0]==='lineTo'));assert.equal(a.calls.length,b.calls.length);
});

test('reduced motion switches optics without zoom animation or walking sway',()=>{
 const r=renderer(),g=game('marksman');r.reduced=true;r.scope=()=>{};r.gun=()=>{};g.aiming=true;r.draw(g,1/144,true);assert.equal(r.aim,1);assert.equal(r.lookScale,.25);g.aiming=false;r.draw(g,1/144,true);assert.equal(r.aim,0);assert.equal(r.observedHorizon,45);
});

test('sprite occlusion coalesces visible columns while preserving wall-hidden gaps',()=>{
 const r=renderer(),c=context();r.z=Float32Array.from([9,9,9,1,1,9,9,1]);r.clipSprite(c,0,8,5,10,20);assert.deepEqual(c.calls.filter(x=>x[0]==='rect'),[['rect',0,10,3,20],['rect',5,10,2,20]]);assert.ok(c.calls.some(x=>x[0]==='clip'));
});

test('view ray geometry is reused until field of view or buffer size changes',()=>{
 const r=renderer(),a=r.prepareRays(800,1.12);assert.equal(r.prepareRays(800,1.12),a);assert.equal(a.offsets.length,800);assert.equal(a.offsets[400],0);assert.ok(Math.abs(a.cosines[0]-Math.cos(a.offsets[0]))<1e-7);assert.notEqual(r.prepareRays(800,.7),a);assert.equal(r.prepareRays(480,.7).offsets.length,480);
});

test('original ICT crate variants contain readable shipment and service-desk details',()=>{
 const original=globalThis.document;globalThis.document={createElement(){const c=context();return {getContext:()=>c,calls:c.calls};}};
 try{const labels=[0,1,2].map(n=>material(2,n).calls.filter(x=>x[0]==='fillText').map(x=>x[1]).join(' / '));assert.match(labels[0],/DELL.*RMA/);assert.match(labels[1],/FRAGILE.*SERVER KIT.*TICKET/);assert.match(labels[2],/ICT STORES.*PATCH PANEL.*NO TICKET/);}finally{globalThis.document=original;}
});

test('Auto quality responds to sustained pressure with bounded rare resizing and slow recovery',()=>{
 const r=renderer();let resizes=0;r.resize=()=>resizes++;r.quality='auto';for(let n=0;n<10;n++)r.frameBudget(.03);assert.equal(resizes,0);for(let n=0;n<600;n++)r.frameBudget(.03);assert.ok(Math.abs(r.autoScale-.6)<1e-8);assert.equal(resizes,4);const before=resizes;for(let n=0;n<420;n++)r.frameBudget(1/60);assert.equal(resizes,before);for(let n=0;n<80;n++)r.frameBudget(1/60);assert.ok(r.autoScale>.6&&r.autoScale<.7);const scale=r.autoScale;r.quality='high';for(let n=0;n<100;n++)r.frameBudget(.05);assert.equal(r.autoScale,scale);assert.equal(cameraView('marksman',1).magnification,4);
});

test('settled ADS and hip views reuse exact ray arrays even while the player walks',()=>{
 const r=renderer(),g=game('marksman');r.scope=()=>{};r.gun=()=>{};
 for(const aimed of [true,false]){g.aiming=aimed;for(let n=0;n<24;n++)r.draw(g,1/60,true);assert.equal(r.aim,aimed?1:0);const rays=r.rayView;for(let n=0;n<12;n++){g.player.x+=.001;r.draw(g,1/60,true);assert.equal(r.rayView,rays);}}
});

test('wall labels progress left-to-right on all four faces and repeated headings',()=>{
 const map=[[2,2,2],[2,0,2],[2,2,2]];
 for(const heading of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const revolution of [-Math.PI*4,0,Math.PI*4]){
  const a=heading+revolution,left=raycast(map,1.5,1.5,a-.12),right=raycast(map,1.5,1.5,a+.12);
  assert.equal(left.side,right.side);assert.ok(wallTextureU(left,a-.12)<wallTextureU(right,a+.12),`heading ${a}`);
 }
});

test('Auto quality handles sustained four-FPS pressure without reacting to one isolated stall',()=>{
 const r=renderer();r.quality='auto';let resizes=0;r.resize=()=>resizes++;r.frameBudget(.8);assert.equal(resizes,0);for(let n=0;n<20;n++)r.frameBudget(1/60);assert.equal(resizes,0);for(let n=0;n<10;n++)r.frameBudget(.25);assert.equal(resizes,1);assert.ok(Math.abs(r.autoScale-.9)<1e-8);for(let n=0;n<4;n++)r.frameBudget(.25);assert.equal(resizes,1);r.frameBudget(2);assert.equal(resizes,1);r.frameBudget(.25,false);assert.equal(resizes,1);
 for(const quality of ['low','high']){r.quality=quality;for(let n=0;n<30;n++)r.frameBudget(.25);assert.equal(resizes,1);}
});
