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
 const g=game();for(const b of g.bots)assert.ok(canStand(g.map,b.x,b.y));
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
 assert.equal(g.player.hp,0);assert.equal(g.deaths,1);assert.ok(g.player.dead>0);
 const friendly=game({random:()=>0});friendly.map=emptyMap();friendly.player={x:2.5,y:3.5,a:0,hp:100,dead:0,inv:0};friendly.bots=[{team:0,x:5.5,y:3.5,hp:100,dead:0,a:0,cooldown:0}];friendly.update(.05);assert.equal(friendly.player.hp,100);
});
test('rival zone victory produces a recoverable ended match',()=>{
 const g=game();g.scores=[0,59,0];g.tick=.99;g.bots=[{team:1,x:14,y:14,hp:100,dead:0,a:0,cooldown:1}];g.update(.05);
 assert.equal(g.scores[1],60);assert.equal(g.ended,true);assert.equal(game().ended,false);
});
test('an unattended deterministic full round ends without spawning extra bots or embedding them in walls',()=>{
 const g=game();for(let i=0;i<2400;i++)g.update(.05);
 assert.equal(g.ended,true);assert.equal(g.bots.length,12);for(const b of g.bots)if(!b.dead)assert.ok(canStand(g.map,b.x,b.y));
 assert.ok(g.scores.some(score=>score===60));
});
