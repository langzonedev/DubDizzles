import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, SIZE, KITS, SPAWNS, makeMap, canStand, moveEntity, raycast, visible, zoneOwner, loadoutPurchase, safeProfile } from '../game.js';
const game=options=>new Game({random:()=>.5,...options});
const advance=(g,seconds,input={})=>{for(let t=0;t<Math.ceil(seconds/.05);t++)g.update(.05,input);};
const emptyMap=()=>Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>x===0||y===0||x===7||y===7?1:0));

test('map boundaries are solid and all starting positions are traversable',()=>{
 const map=makeMap();assert.equal(map.length,SIZE);
 for(let i=0;i<SIZE;i++){assert.ok(map[0][i]);assert.ok(map[SIZE-1][i]);assert.ok(map[i][0]);assert.ok(map[i][SIZE-1]);}
 for(const [x,y]of SPAWNS)assert.ok(canStand(map,x,y));
 const g=game();for(const b of g.bots){assert.ok(canStand(g.map,b.x,b.y));if(b.team===0)assert.ok(Math.hypot(b.x-g.player.x,b.y-g.player.y)>2,'allies must leave the player spawn clear');}
 assert.equal(canStand(map,-1,1),false);
});
test('collision stops at solid wall while allowing movement along it',()=>{
 const map=emptyMap();map[3][3]=1;const p={x:2.7,y:3.4};moveEntity(map,p,.2,.2);assert.equal(p.x,2.7);assert.ok(p.y>3.4);
});
test('raycast measures an axis-aligned wall and visibility obeys occlusion',()=>{
 const map=emptyMap();map[3][4]=1;const hit=raycast(map,2.5,3.5,0);assert.equal(hit.distance,1.5);assert.equal(hit.tile,1);
 assert.equal(visible(map,{x:2.5,y:3.5},{x:5.5,y:3.5}),false);
 assert.equal(visible(map,{x:2.5,y:2.5},{x:5.5,y:2.5}),true);
});
test('a contested objective has no owner; a strict majority owns it',()=>{
 assert.equal(zoneOwner([0,0,0]),-1);assert.equal(zoneOwner([2,2,0]),-1);assert.equal(zoneOwner([3,2,1]),0);
});
test('paid loadouts cannot overdraw and the default remains free',()=>{
 assert.deepEqual(loadoutPurchase(249,'smg'),{ok:false,wallet:249});assert.deepEqual(loadoutPurchase(250,'smg'),{ok:true,wallet:0});
 assert.deepEqual(loadoutPurchase(0,'carbine'),{ok:true,wallet:0});assert.equal(loadoutPurchase(1000,'unknown').ok,false);
 const g=game({cash:0,kit:'marksman'});assert.equal(g.kit,'carbine');assert.equal(g.cash,0);
});
test('corrupt, negative and extreme profile values are bounded',()=>{
 assert.deepEqual(safeProfile(null),{cash:1000,best:0});assert.deepEqual(safeProfile({cash:Infinity,best:'bad'}),{cash:1000,best:0});
 assert.deepEqual(safeProfile({cash:-5,best:1e99}),{cash:0,best:999999});assert.equal(safeProfile({cash:12.9}).cash,12);
});
test('shots consume ammo, respect cooldown, and reload transfers reserve only',()=>{
 const g=game();g.bots=[];assert.equal(g.fire(),true);assert.equal(g.ammo,KITS.carbine.mag-1);assert.equal(g.fire(),false);
 g.reload();assert.ok(g.reloading>0);assert.equal(g.fire(),false);advance(g,2);
 assert.equal(g.ammo,KITS.carbine.mag);assert.equal(g.reserve,KITS.carbine.mag*5-1);
});
test('hitscan awards one kill and cannot shoot through a wall',()=>{
 const g=game();g.map=emptyMap();g.player={x:2.5,y:3.5,a:0,hp:100,dead:0,inv:0};
 const enemy={x:5.5,y:3.5,team:1,hp:30,dead:0};g.bots=[enemy];g.map[3][4]=1;g.fire();assert.equal(enemy.hp,30);
 g.cooldown=0;g.map[3][4]=0;g.fire();assert.equal(g.kills,1);assert.equal(g.cash,1100);
 g.hurtBot(enemy,100);assert.equal(g.kills,1);assert.equal(g.cash,1100);
});
test('supply restores resources and enforces its cooldown',()=>{
 const g=game();g.player.hp=1;g.reserve=0;g.nades=0;g.player.y=5.5;g.useSupply();assert.equal(g.player.hp,100);assert.equal(g.nades,2);
 g.player.hp=50;g.useSupply();assert.equal(g.player.hp,50);
});
test('cover costs money only when successfully placed',()=>{
 const g=game();g.player={x:13.5,y:13.5,a:0,hp:100,dead:0};g.bots=[];const before=g.cash;
 g.build();assert.equal(g.cash,before-100);assert.equal(g.map[13][15],2);g.build();assert.equal(g.cash,before-100);
});
test('grenades detonate, remove destructible cover and clear their transient entities',()=>{
 const g=game();g.bots=[];g.grenades=[{x:14.5,y:14.5,t:.01}];g.map[14][15]=2;g.update(.05);
 assert.equal(g.grenades.length,0);assert.equal(g.map[14][15],0);assert.equal(g.blasts.length,1);advance(g,.5);assert.equal(g.blasts.length,0);
});
test('death redeploys with restored health and spawn protection',()=>{
 const g=game();g.bots=[];g.player.dead=.01;g.player.hp=0;g.player.x=14;g.update(.05);
 assert.equal(g.player.dead,0);assert.equal(g.player.hp,100);assert.equal(g.player.x,3.5);assert.equal(g.player.inv,3);
});
test('a won match freezes scoring, movement and time; new match resets state',()=>{
 const g=game();g.bots=[];g.player.x=14;g.player.y=14;g.scores=[59,0,0];advance(g,1.1);assert.equal(g.ended,true);assert.equal(g.scores[0],60);
 const state=JSON.stringify({time:g.time,x:g.player.x,scores:g.scores});g.update(.05,{forward:1,fire:true});assert.equal(JSON.stringify({time:g.time,x:g.player.x,scores:g.scores}),state);
 const fresh=game();assert.equal(fresh.ended,false);assert.equal(fresh.time,0);assert.deepEqual(fresh.scores,[0,0,0]);assert.equal(fresh.kills,0);
});
test('a long interruption cannot advance simulation by minutes in one frame',()=>{
 const g=game();g.bots=[];g.update(300,{forward:1});assert.equal(g.time,.05);assert.ok(Math.hypot(g.player.x-3.5,g.player.y-3.5)<.2);
});

test('hostile bot damage can kill the player and friendly bots do not target the player',()=>{
 const g=game({random:()=>0});g.map=emptyMap();g.player={x:2.5,y:3.5,a:0,hp:9,dead:0,inv:0};
 g.bots=[{team:1,x:5.5,y:3.5,hp:100,dead:0,a:0,cooldown:0}];g.update(.05);
 assert.equal(g.player.hp,9,'a newly spotted operator gets a readable acquisition window');advance(g,1);
 assert.equal(g.player.hp,0);assert.equal(g.deaths,1);assert.ok(g.player.dead>0);
 const friendly=game({random:()=>0});friendly.map=emptyMap();friendly.player={x:2.5,y:3.5,a:0,hp:100,dead:0,inv:0};friendly.bots=[{team:0,x:5.5,y:3.5,hp:100,dead:0,a:0,cooldown:0}];advance(friendly,2);assert.equal(friendly.player.hp,100);
});
test('rival zone victory produces a recoverable ended match',()=>{
 const g=game();g.scores=[0,59,0];g.tick=.99;g.bots=[{team:1,x:14,y:14,hp:100,dead:0,a:0,cooldown:1}];g.update(.05);
 assert.equal(g.scores[1],60);assert.equal(g.ended,true);assert.equal(game().ended,false);
});
test('an unattended deterministic full round ends without spawning extra bots or embedding them in walls',()=>{
 const g=game();for(let i=0;i<3600;i++)g.update(.05);
 assert.equal(g.ended,true);assert.equal(g.bots.length,12);for(const b of g.bots)if(!b.dead)assert.ok(canStand(g.map,b.x,b.y));
 assert.ok(g.scores.some(score=>score===60));
});

test('aim slows movement, improves precision, and overrides sprint',()=>{
 const aiming=game(),normal=game();aiming.bots=[];normal.bots=[];
 aiming.update(.05,{forward:1,aim:true,sprint:true});normal.update(.05,{forward:1});
 assert.equal(aiming.aiming,true);assert.equal(aiming.sprinting,false);
 assert.ok(Math.hypot(aiming.player.x-3.5,aiming.player.y-3.5)<Math.hypot(normal.player.x-3.5,normal.player.y-3.5));
 const makeTarget=g=>{g.map=emptyMap();g.player={x:2.5,y:3.5,a:0,hp:100,dead:0,inv:0};g.random=()=>1;g.bots=[{x:6.5,y:3.66,team:1,hp:100,dead:0}];g.weapon={...KITS.smg,spread:.3};};
 makeTarget(aiming);makeTarget(normal);aiming.fire();normal.fire();
 assert.ok(aiming.bots[0].hp<100);assert.equal(normal.bots[0].hp,100);
});
test('sprinting consumes stamina and releasing sprint recovers it',()=>{
 const g=game();g.bots=[];advance(g,1,{forward:1,sprint:true});assert.ok(g.stamina<80);assert.equal(g.sprinting,true);
 const spent=g.stamina;advance(g,.5);assert.ok(g.stamina>spent);assert.equal(g.sprinting,false);
 g.stamina=0;g.update(.05,{forward:1,sprint:true});assert.equal(g.sprinting,false);
});
test('firing exits sprint and recoil recovers over time',()=>{
 const g=game();g.bots=[];g.update(.05,{forward:1,sprint:true,fire:true});assert.equal(g.sprinting,false);assert.equal(g.ammo,g.weapon.mag-1);assert.ok(g.recoil>0);
 advance(g,1);assert.equal(g.recoil,0);
});
test('reload transfers only available rounds and cannot restart while active',()=>{
 const g=game();g.bots=[];g.ammo=0;g.reserve=3;g.reload();const remaining=g.reloading;g.reload();assert.equal(g.reloading,remaining);
 advance(g,2);assert.equal(g.ammo,3);assert.equal(g.reserve,0);assert.equal(g.reloading,0);
});
test('navigation is reused until destructible map geometry changes',()=>{
 const g=game();g.bots=[];g.update(.05);const field=g.flow;g.update(.05);assert.equal(g.flow,field);
 g.player={x:13.5,y:13.5,a:0,hp:100,dead:0,inv:0};g.build();assert.equal(g.flowDirty,true);g.update(.05);assert.notEqual(g.flow,field);assert.equal(g.flow[13][15],Infinity);
 g.grenades=[{x:14.5,y:14.5,t:.01}];g.update(.05);assert.equal(g.flowDirty,true);g.update(.05);assert.ok(Number.isFinite(g.flow[13][15]));
});
test('enemy accuracy does not bypass the player spawn shield',()=>{
 const g=game({random:()=>0});g.map=emptyMap();g.player={x:2.5,y:3.5,a:0,hp:100,dead:0,inv:3};
 g.bots=[{team:1,x:5.5,y:3.5,hp:100,dead:0,a:0,cooldown:0}];g.update(.05);assert.equal(g.player.hp,100);
});
test('close-range SMG damage falls off while marksman keeps long-range power',()=>{
 const targetAt=(g,x)=>{g.map=makeMap();for(let y=1;y<SIZE-1;y++)for(let x=1;x<SIZE-1;x++)g.map[y][x]=0;g.player={x:2.5,y:3.5,a:0,hp:100,dead:0,inv:0};const b={x,y:3.5,team:1,hp:100,dead:0};g.bots=[b];return b;};
 const smg=game({kit:'smg'}),close=targetAt(smg,5.5);smg.fire();const closeDamage=100-close.hp;
 const far=targetAt(smg,22.5);smg.cooldown=0;smg.fire();assert.ok(100-far.hp<closeDamage);
 const marksman=game({kit:'marksman'}),distant=targetAt(marksman,22.5);marksman.fire();assert.equal(100-distant.hp,KITS.marksman.damage);
});
test('holding exhausted sprint recovers to twenty stamina without frame-by-frame sprint jitter',()=>{
 const g=game();g.bots=[];g.stamina=2;
 for(let i=0;i<24;i++){g.update(.05,{forward:1,sprint:true});assert.equal(g.sprinting,false);assert.equal(g.sprintExhausted,true);}
 assert.equal(g.stamina,20);g.update(.05,{forward:1,sprint:true});assert.equal(g.sprinting,true);assert.equal(g.sprintExhausted,false);
 g.stamina=2;g.update(.05,{forward:1,sprint:true});assert.equal(g.sprinting,false);
 g.update(.05,{forward:1});assert.equal(g.sprintExhausted,false);g.update(.05,{forward:1,sprint:true});assert.equal(g.sprinting,true);
});

test('automatic weapon cadence remains consistent from 20 to 144 simulation frames per second',()=>{
 for(const kit of ['carbine','smg','marksman']){
  const shots=[];
  for(const fps of [20,30,60,144]){const g=game({kit});g.bots=[];for(let i=0;i<fps*1.5;i++)g.update(1/fps,{fire:true});shots.push(g.weapon.mag-g.ammo);}
  assert.ok(Math.max(...shots)-Math.min(...shots)<=1,`${kit} cadence varies: ${shots}`);
  assert.ok(Math.min(...shots)>=Math.floor(1.5/KITS[kit].rate),`${kit} should retain its advertised rate`);
 }
});

test('long movement vectors cannot tunnel through thin cover',()=>{
 const map=emptyMap();map[3][3]=2;const p={x:1.5,y:3.5};moveEntity(map,p,4,0);
 assert.ok(p.x<3);assert.ok(canStand(map,p.x,p.y));
});

test('raycasts stop at their requested range before distant geometry',()=>{
 const map=emptyMap();map[3][4]=1;const hit=raycast(map,2.5,3.5,0,1);
 assert.equal(hit.distance,1);assert.equal(hit.tile,0);assert.equal(hit.x,3.5);
});

test('fortifying the centre cell preserves navigation to the rest of the objective',()=>{
 const g=game();g.map[14][14]=2;g.update(.05);
 assert.equal(g.flow[14][14],Infinity);
 for(const [x,y] of SPAWNS)assert.ok(Number.isFinite(g.flow[Math.floor(y)][Math.floor(x)]));
 const before=g.bots.map(b=>Math.hypot(b.x-14,b.y-14));advance(g,8);
 assert.ok(g.bots.some((b,i)=>Math.hypot(b.x-14,b.y-14)<before[i]-2));
});

test('soft squad separation resolves overlapping bots without pushing them through walls',()=>{
 const g=game();g.player.inv=100;g.bots=[0,1].map(()=>({team:0,x:3.5,y:8,hp:100,dead:0,a:0,cooldown:100}));
 advance(g,.5);const [a,b]=g.bots;
 assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>.4);
 for(const bot of g.bots)assert.ok(canStand(g.map,bot.x,bot.y));
});

test('invalid time deltas cannot poison match state',()=>{
 const g=game();g.bots=[];g.update(NaN);g.update(Infinity);g.update(-1);
 assert.equal(g.time,0);assert.equal(g.player.hp,100);assert.ok(Number.isFinite(g.player.x));
});

test('reload completion emits one readiness event and ended matches reject resource actions',()=>{
 const events=[],g=game({onEvent:e=>events.push(e)});g.bots=[];g.ammo=0;g.reload();advance(g,3);
 assert.equal(events.filter(e=>e.type==='reloaded').length,1);
 g.ended=true;g.ammo=1;g.reload();assert.equal(g.reloading,0);
 g.player.y=5.5;g.player.hp=10;g.nades=0;g.useSupply();assert.equal(g.player.hp,10);assert.equal(g.nades,0);
});

test('objective notices announce ownership changes without flooding during rapid contests',()=>{
 const events=[],g=game({onEvent:e=>events.push(e)});g.bots=[];g.player.x=14;g.player.y=14;g.update(.05);
 assert.deepEqual(events.filter(e=>e.type==='objective').map(e=>e.owner),[0]);
 g.player.x=3.5;g.player.y=3.5;advance(g,1);g.player.x=14;g.player.y=14;advance(g,1);
 assert.equal(events.filter(e=>e.type==='objective').length,1);
 g.player.x=3.5;g.player.y=3.5;advance(g,1.5);
 assert.deepEqual(events.filter(e=>e.type==='objective').map(e=>e.owner),[0,-1]);
});

test('a short trigger tap interrupts an active sprint without bypassing weapon timing',()=>{
 const g=game();g.bots=[];g.update(.05,{forward:1,sprint:true});assert.equal(g.sprinting,true);
 assert.equal(g.fire(),true);assert.equal(g.sprinting,false);assert.equal(g.ammo,g.weapon.mag-1);
 g.sprinting=true;assert.equal(g.fire(),false);assert.equal(g.ammo,g.weapon.mag-1);assert.equal(g.sprinting,false);
 g.cooldown=0;g.reload();g.sprinting=true;assert.equal(g.fire(),false);assert.equal(g.sprinting,false);
});

test('round accuracy counts fired bullets and direct hits, excluding rejected shots and grenades',()=>{
 const g=game();assert.equal(g.shots,0);assert.equal(g.hits,0);assert.equal(g.accuracy,0);
 g.map=emptyMap();g.player={x:2.5,y:3.5,a:0,hp:100,dead:0,inv:0};const enemy={x:5.5,y:3.5,team:1,hp:100,dead:0};g.bots=[enemy];
 g.fire();assert.equal(g.shots,1);assert.equal(g.hits,1);assert.equal(g.accuracy,100);
 g.fire();assert.equal(g.shots,1);g.cooldown=0;g.player.a=Math.PI/2;g.fire();assert.equal(g.shots,2);assert.equal(g.hits,1);assert.equal(g.accuracy,50);
 g.grenades=[{x:enemy.x,y:enemy.y,t:.01}];g.update(.05);assert.equal(g.hits,1);assert.equal(g.shots,2);
 g.player.dead=.01;g.player.hp=0;g.update(.05);assert.equal(g.shots,2);assert.equal(g.hits,1);
 const fresh=game();assert.equal(fresh.shots,0);assert.equal(fresh.hits,0);assert.equal(fresh.accuracy,0);
});

test('aim, diagonal movement, turning and held fire remain simultaneous at every simulation step',()=>{
 const g=game();g.bots=[];g.player.x=14;g.player.y=14;g.player.a=0;
 for(let i=0;i<120;i++){const before={x:g.player.x,y:g.player.y,a:g.player.a};g.update(1/120,{aim:true,forward:1,strafe:1,turn:.1,fire:true,sprint:true});assert.equal(g.aiming,true);assert.equal(g.sprinting,false);assert.ok(Math.hypot(g.player.x-before.x,g.player.y-before.y)>0);assert.ok(g.player.a>before.a);}
 assert.ok(g.shots>=6);assert.ok(Math.hypot(g.player.x-14,g.player.y-14)>2.1);
});

test('aimed strafing preserves precision rather than applying the hip-fire movement penalty',()=>{
 const aimed=game({random:()=>1}),hip=game({random:()=>1});
 for(const g of [aimed,hip]){g.bots=[];g.player.a=0;g.moving=1;}
 aimed.aiming=true;aimed.fire();hip.fire();
 assert.ok(Math.abs(aimed.lastShot.a)<Math.abs(hip.lastShot.a)*.3);
 assert.ok(Math.abs(aimed.lastShot.a)<=KITS.carbine.spread*.4*1.15*.5+.000001);
});

test('bot heading and velocity steer continuously while locomotion phase follows travelled distance',()=>{
 const g=game();g.map=emptyMap();g.player.inv=100;
 const b={team:0,x:2.5,y:3.5,a:Math.PI,hp:100,dead:0,cooldown:100};
 const enemy={team:1,x:5.5,y:3.5,a:0,hp:100,dead:0,cooldown:100};g.bots=[b,enemy];
 const x=b.x,y=b.y;g.update(.05);
 assert.ok(Math.abs(Math.atan2(Math.sin(b.a-Math.PI),Math.cos(b.a-Math.PI)))<=.05*5.5+.000001);
 assert.ok(Math.hypot(b.vx,b.vy)<.7,'a stationary soldier accelerates into his strafe');
 assert.ok(Math.abs(b.walkPhase-Math.hypot(b.x-x,b.y-y)*7)<.000001);
 assert.ok(b.moving>0);
});

test('bot target hysteresis keeps crossing opponents stable and switches for a substantially nearer threat',()=>{
 const g=game();g.map=emptyMap();g.player.inv=100;
 const b={team:0,x:2.5,y:3.5,a:0,hp:100,dead:0,cooldown:100};
 const first={team:1,x:5.5,y:3.5,a:0,hp:100,dead:0,cooldown:100};
 const second={team:2,x:5.7,y:3.6,a:0,hp:100,dead:0,cooldown:100};g.bots=[b,first,second];
 g.update(.01);assert.equal(b.targetIndex,1);
 second.x=5.4;g.update(.01);assert.equal(b.targetIndex,1);
 second.x=3.7;g.update(.01);assert.equal(b.targetIndex,2);
});

test('angular vertical aim must intersect the visible soldier body to register a shot',()=>{
 const g=game();g.map=emptyMap();g.player={x:2.5,y:3.5,a:0,pitch:.5,hp:100,dead:0,inv:0};
 const enemy={team:1,x:5.5,y:3.5,a:0,hp:100,dead:0,cooldown:100};g.bots=[enemy];
 g.fire();assert.equal(enemy.hp,100);assert.equal(g.hits,0);
 g.player.pitch=-.5;g.cooldown=0;g.fire();assert.equal(enemy.hp,100);assert.equal(g.hits,0);
 g.player.pitch=Math.atan((.7-.46)/3);g.cooldown=0;g.fire();assert.ok(enemy.hp<100);assert.equal(g.hits,1);
 g.player.pitch=0;g.cooldown=0;g.fire();assert.equal(g.hits,2);
});

test('respawning resets vertical aim without resetting round accuracy',()=>{
 const g=game();g.bots=[];g.player.pitch=.6;g.shots=5;g.hits=2;g.player.dead=.01;g.player.hp=0;g.update(.05);
 assert.equal(g.player.pitch,0);assert.equal(g.shots,5);assert.equal(g.hits,2);
});

test('round collision footprint clears a box corner without allowing wall penetration',()=>{
 const map=emptyMap();map[3][3]=1;
 assert.equal(canStand(map,2.82,2.82),true,'the circular body clears the corner a square probe would snag');
 assert.equal(canStand(map,2.9,2.9),false);
 const p={x:2.65,y:2.65};moveEntity(map,p,.17,.17);assert.ok(Math.abs(p.x-2.82)<1e-9);assert.ok(Math.abs(p.y-2.82)<1e-9);
 for(let i=0;i<30;i++){moveEntity(map,p,.05,.05);assert.ok(canStand(map,p.x,p.y));}
});

test('ADS responds, stops and reverses immediately with no movement inertia',()=>{
 const g=game();g.bots=[];g.player.x=14;g.player.y=14;g.player.a=0;
 g.update(.05,{aim:true,strafe:1});assert.ok(Math.abs(g.player.y-14-KITS.carbine.aimSpeed*.05)<1e-9);
 const y=g.player.y;g.update(.05,{aim:true});assert.equal(g.player.y,y);assert.equal(g.moving,0);
 g.update(.05,{aim:true,strafe:-1});assert.ok(g.player.y<y);assert.ok(Math.abs(g.player.y-14)<1e-9);
});

test('each weapon keeps a deliberate ADS speed while diagonal motion stays normalized',()=>{
 for(const kit of Object.keys(KITS)){
  const g=game({kit});g.bots=[];g.player.x=14;g.player.y=14;g.player.a=0;
  g.update(.05,{aim:true,forward:1,strafe:1,fire:true});
  assert.ok(Math.abs(Math.hypot(g.player.x-14,g.player.y-14)-KITS[kit].aimSpeed*.05)<1e-9);
  assert.equal(g.aiming,true);assert.equal(g.shots,1);
 }
 assert.ok(KITS.smg.aimSpeed>KITS.carbine.aimSpeed);assert.ok(KITS.carbine.aimSpeed>KITS.marksman.aimSpeed);
});

test('pressing against cover does not report imaginary walking or add movement spread',()=>{
 const g=game();g.map=emptyMap();g.bots=[];g.map[3][3]=1;g.player.x=2.78;g.player.y=3.5;g.player.a=0;
 g.update(.05,{forward:1,aim:true});assert.equal(g.moving,0);assert.equal(g.player.x,2.78);
});

test('hostiles face the operator before damaging them and reacquire after cover breaks sight',()=>{
 const g=game({random:()=>0});g.map=emptyMap();g.player={x:2.5,y:3.5,a:0,pitch:0,hp:100,dead:0,inv:0};
 const b={team:1,x:5.5,y:3.5,a:0,hp:100,dead:0,cooldown:0};g.bots=[b];
 advance(g,.3);assert.equal(g.player.hp,100,'turning away is not a valid shot');assert.equal(b.alert,1);
 advance(g,.4);assert.ok(g.player.hp<100);
 g.map[3][4]=1;advance(g,.1);assert.equal(b.alert,0);
 g.map[3][4]=0;b.cooldown=0;const hp=g.player.hp;advance(g,.15);assert.equal(g.player.hp,hp,'a new line of sight requires reacquisition');
 advance(g,.3);assert.ok(g.player.hp<hp);
});

test('actual hit feedback carries shot damage, distance and body height without changing awards',()=>{
 const events=[],g=game({onEvent:e=>events.push(e)});g.map=emptyMap();g.player={x:2.5,y:3.5,a:0,pitch:0,hp:100,dead:0,inv:0};
 const b={team:1,x:5.5,y:3.5,a:Math.PI,hp:100,dead:0,cooldown:100};g.bots=[b];const cash=g.cash;g.fire();
 const hit=events.find(e=>e.type==='hit');assert.equal(hit.damage,KITS.carbine.damage);assert.equal(hit.distance,3);assert.equal(hit.height,.46);assert.equal(hit.team,1);
 assert.equal(g.lastShot.damage,hit.damage);assert.equal(g.lastShot.distance,3);assert.equal(g.lastShot.hitHeight,.46);assert.equal(b.hitFlash,.14);assert.equal(g.cash,cash);
 advance(g,.2);assert.equal(b.hitFlash,0);
});
