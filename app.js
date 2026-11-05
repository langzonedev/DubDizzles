import {Game,KITS,safeProfile,clamp,TEAM_COLORS,angleDiff} from './game.js';
import {Renderer} from './renderer.js';
const $=id=>document.getElementById(id),canvas=$('world'),renderer=new Renderer(canvas);renderer.resize();addEventListener('resize',()=>renderer.resize());
let storageOK=true,profile;try{profile=safeProfile(JSON.parse(localStorage.getItem('dub-dizzles-profile')||'null'));}catch{profile=safeProfile(null);storageOK=false;}
const save=()=>{try{localStorage.setItem('dub-dizzles-profile',JSON.stringify(profile));}catch{storageOK=false;}};
let kit='carbine',game=new Game(),state='menu',last=performance.now(),keys=new Set(),firing=false,move={x:0,y:0},audio=null,lookPointer=null,stickPointer=null,stickOrigin=null,prevLook=null,firePointer=null,endReport='',lastSave=0,aimHeld=false,aimToggle=false;
const STEP=1/120;
let cruise=false,cruiseMove={forward:0,strafe:0},triggerLatch=false,lockPending=false;
let accumulator=0,hudElapsed=1,mapElapsed=1,ambientElapsed=1,killUntil=0,audioBus=null;
const noiseBuffers=new Map(),hudValues=new Map();
let displayGame=null,previousPose=null;
let settings={};try{settings=JSON.parse(localStorage.getItem('war-dizzles-settings')||'{}')||{};}catch{}
if(typeof settings!=='object'||Array.isArray(settings))settings={};
for(const id of ['difficulty','sensitivity','aimSensitivity','inputProfile','quality','sound']){const el=$(id);if(!el)continue;if(id==='sound')el.checked=settings[id]!==false;else if([...el.options||[]].some(o=>o.value===settings[id])||['sensitivity','aimSensitivity'].includes(id)&&Number(settings[id])>=.5&&Number(settings[id])<=2)el.value=settings[id];el.addEventListener('change',()=>{settings[id]=id==='sound'?el.checked:el.value;try{localStorage.setItem('war-dizzles-settings',JSON.stringify(settings));}catch{}if(id==='quality'){renderer.quality=el.value;renderer.resize();}if(id==='inputProfile')controlHelp();});}
renderer.quality=$('quality')?.value||'auto';renderer.resize();
function laptop(){return ($('inputProfile')?.value||'trackpad')==='trackpad';}
function controlHelp(){const el=$('controlHelp');if(el)el.textContent=laptop()?'Laptop: Q toggles aim. C starts cruise; tap WASD to steer, C or X stops. F toggles the trigger. No keys need to stay held.':'Mouse: hold WASD to move, RMB to aim and LMB to fire. C cruise and Q aim toggles are also available.';}
controlHelp();
let touch=matchMedia('(pointer:coarse)').matches;
document.body.classList.toggle('touch',touch);
// Touch-capable laptops still need mouse capture. Follow the active input source.
addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.pointerType==='touch'){touch=e.pointerType==='touch';document.body.classList.toggle('touch',touch);}});
function career(){ if(profile.cash<KITS[kit].cost){kit='carbine';for(const el of document.querySelectorAll('[data-kit]')){const chosen=el.dataset.kit===kit;el.classList.toggle('selected',chosen);el.setAttribute('aria-pressed',String(chosen));}} kitSummary();$('wallet').textContent='$'+profile.cash.toLocaleString();$('best').textContent=profile.best;for(const b of document.querySelectorAll('[data-kit]')){b.disabled=profile.cash<KITS[b.dataset.kit].cost;b.title=b.disabled?'Earn more cash with the free carbine':'';}}
career();
function resetInput(){cruise=false;cruiseMove={forward:0,strafe:0};triggerLatch=false;keys.clear();aimHeld=false;aimToggle=false;game.aiming=false;$('tAim')?.setAttribute('aria-pressed','false');firing=false;move={x:0,y:0};lookPointer=null;stickPointer=null;stickOrigin=null;prevLook=null;firePointer=null;accumulator=0;previousPose=null;$('stick').querySelector('i').style.transform='';}
function sound(type){
 if(!$('sound').checked||!audio||audio.state!=='running')return;
 const now=audio.currentTime,shot=type==='shot',blast=type==='blast';
 // Noise samples are retained; transient nodes are disconnected after playback.
 if(shot||blast){
  const length=blast?.38:.12,key=blast?'blast':'shot';
  if(!noiseBuffers.has(key)){const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*length),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);noiseBuffers.set(key,buffer);}
  const noise=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();noise.buffer=noiseBuffers.get(key);filter.type='lowpass';filter.frequency.value=blast?450:game.kit==='smg'?2400:1500;gain.gain.value=blast?.18:.09;noise.connect(filter);filter.connect(gain);gain.connect(audioBus);noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};noise.start(now);
 }
 const freq={shot:game.kit==='marksman'?75:120,hit:720,damage:65,reward:520,blast:40,reload:200,reloaded:380,dry:160,objective:580}[type];if(!freq)return;
 const o=audio.createOscillator(),v=audio.createGain();o.connect(v);v.connect(audioBus);o.type=shot?'triangle':'sine';o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(Math.max(20,freq*.4),now+.09);v.gain.setValueAtTime(shot?.045:.025,now);v.gain.exponentialRampToValueAtTime(.001,now+.12);o.onended=()=>{o.disconnect();v.disconnect();};o.start(now);o.stop(now+.13);
}
function startAudio(){try{if(!audio){audio=new(window.AudioContext||window.webkitAudioContext)();audioBus=audio.createDynamicsCompressor();audioBus.connect(audio.destination);}audio.resume().catch(()=>{});}catch{/* Sound optional. */}}
function log(text){if(!text)return;const div=document.createElement('div');div.textContent=text;$('feed').prepend(div);while($('feed').children.length>4)$('feed').lastChild.remove();setTimeout(()=>div.remove(),6500);}
function record(){profile.cash=Math.floor(game.cash);profile.best=Math.max(profile.best,game.kills);save();if(state==='menu')career();}
function event(e){if(e.type==='shot'&&!renderer.reduced)renderer.flash=.07;if(e.type==='hit'){renderer.hit=e.kill?.24:.15;if(e.kill)killUntil=performance.now()+1100;}if(e.type==='damage')renderer.hurt=.3;if(e.type==='death')resetInput();sound(e.type);if(e.text)log(e.text);hudElapsed=1;if(e.type==='end'){record();endReport=e.text;showOverlay('end');}}
function requestLook(force=false){
 if((touch&&!force)||!canvas.requestPointerLock||lockPending||document.pointerLockElement===canvas)return;
 lockPending=true;
 const unavailable=()=>log('Mouse capture unavailable. Drag to look or use arrow keys; Q toggles aim.');
 const normal=()=>{lockPending=true;try{const pending=canvas.requestPointerLock();if(pending?.then)return pending.catch(unavailable).finally(()=>lockPending=false);lockPending=false;}catch{lockPending=false;unavailable();}};
 try{
  // Raw mouse input improves consistency; trackpads keep their adjusted fine motion.
  // Neither path can recover movements suppressed by the OS before browser delivery.
  const pending=laptop()?canvas.requestPointerLock():canvas.requestPointerLock({unadjustedMovement:true});
  if(pending?.then)pending.catch(error=>{if(!laptop()&&error.name==='NotSupportedError'){return normal();}unavailable();}).finally(()=>lockPending=false);
  else lockPending=false;
 }catch(error){lockPending=false;if(!laptop()&&error.name==='NotSupportedError')normal();else unavailable();}
}
// Opt-in, menu-only hardware troubleshooting. Counts stay in memory: no key text,
// pointer coordinates, device identifiers, storage or network reporting.
let inputCheckActive=false,inputCheckKeys=new Set(),inputCheckCounts={free:0,held:0},inputCheckTimer=0,inputCheckReport=0;
function reportInputCheck(force=false){
 const now=performance.now();if(!force&&now-inputCheckReport<50)return;inputCheckReport=now;
 $('inputCheck').textContent=`${inputCheckActive?'CHECKING':'CHECK STOPPED'} / Free pointer events: ${inputCheckCounts.free} / With WASD held: ${inputCheckCounts.held}. Move your finger in both cases; counts show only what reaches this page.`;
}
function stopInputCheck(){if(!inputCheckActive)return;inputCheckActive=false;inputCheckKeys.clear();clearTimeout(inputCheckTimer);$('checkInput').textContent='CHECK TRACKPAD INPUT';reportInputCheck(true);}
if($('checkInput'))$('checkInput').onclick=()=>{
 if(inputCheckActive){stopInputCheck();return;}if(state!=='menu')return;
 inputCheckActive=true;inputCheckKeys.clear();inputCheckCounts={free:0,held:0};$('checkInput').textContent='STOP INPUT CHECK';reportInputCheck(true);inputCheckTimer=setTimeout(stopInputCheck,30000);
};
addEventListener('mousemove',()=>{if(!inputCheckActive||state!=='menu')return;inputCheckCounts[inputCheckKeys.size?'held':'free']++;reportInputCheck();});
addEventListener('keydown',e=>{if(!inputCheckActive)return;if(e.code==='Escape'){stopInputCheck();return;}if(['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();inputCheckKeys.add(e.code);reportInputCheck(true);}});
addEventListener('keyup',e=>{if(inputCheckActive){inputCheckKeys.delete(e.code);reportInputCheck(true);}});
addEventListener('blur',stopInputCheck);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopInputCheck();});
function modalBackground(inert){for(const el of [canvas,$('hud'),document.querySelector?.('header')])if(el)el.inert=inert;}
function deploy(){stopInputCheck();displayGame=null;previousPose=null;resetInput();startAudio();game=new Game({cash:profile.cash,kit,difficulty:$('difficulty').value,onEvent:event});profile.cash=game.cash;save();$('feed').replaceChildren();state='playing';endReport='';killUntil=0;renderer.pitch=0;renderer.flash=0;renderer.hit=0;renderer.hurt=0;hudElapsed=1;mapElapsed=1;last=performance.now();$('menu').hidden=true;$('overlay').hidden=true;$('footer').hidden=true;$('hud').hidden=false;modalBackground(false);document.body.classList.add('playing');canvas.focus();requestLook();log('Clocked in. Capture the flag zone to score.');log(storageOK?'Cash and best score save on this device.':'Storage unavailable: progress lasts this session.');}
function showOverlay(mode='paused'){if(state==='menu')return;state=mode;resetInput();document.exitPointerLock?.();record();modalBackground(true);$('overlay').hidden=false;$('overlayTitle').textContent=mode==='end'?(game.scores[0]>=60?'INVOICE APPROVED.':'CONTRACT LOST.'):'ON YOUR BREAK.';$('overlayText').textContent=mode==='end'?`${endReport}\n${game.kills} eliminations · ${game.deaths} redeploys · $${game.earned} earned\n${Math.round(game.accuracy)}% accuracy · ${game.hits}/${game.shots} rounds on target\nFinal score: ${game.scores.join(' / ')}`:'The battle is paused. Your squad can wait.\nCapture the central zone; staying inside counts double for your crew.';$('resume').textContent=mode==='end'?'NEW CONTRACT ↗':'BACK TO THE YARD ↗';$('resume').focus();}
function resume(){if(state==='end'){deploy();return;}if(state!=='paused')return;state='playing';resetInput();last=performance.now();hudElapsed=1;$('overlay').hidden=true;modalBackground(false);startAudio();canvas.focus();requestLook();}
function menu(){record();state='menu';resetInput();document.exitPointerLock?.();modalBackground(false);$('overlay').hidden=true;$('menu').hidden=false;$('footer').hidden=false;$('hud').hidden=true;document.body.classList.remove('playing','aiming','scoped','reloading');career();$('deploy').focus();}
function kitSummary(){const el=$('kitSummary');if(el)el.textContent=({carbine:'YARD CARBINE · balanced automatic · 24 rounds · free every life',smg:'OFFICE SHREDDER · close-range automatic · 36 rounds · $250 per life',marksman:'LONG DISTANCE HR · 4x scoped rifle · 10 rounds · $400 per life'})[kit];}
kitSummary();
$('deploy').onclick=deploy;$('pause').onclick=()=>state==='playing'?showOverlay():state==='menu'?null:resume();$('resume').onclick=resume;$('backMenu').onclick=menu;
for(const b of document.querySelectorAll('[data-kit]'))b.onclick=()=>{kit=b.dataset.kit;for(const el of document.querySelectorAll('[data-kit]')){const chosen=el===b;el.classList.toggle('selected',chosen);el.setAttribute('aria-pressed',String(chosen));}kitSummary();};
function stopMotion(){cruise=false;cruiseMove={forward:0,strafe:0};triggerLatch=false;firing=false;firePointer=null;keys.clear();}
function steerCruise(code){const axis=code==='KeyW'||code==='KeyS'?'forward':'strafe',value=code==='KeyW'||code==='KeyD'?1:-1;cruiseMove[axis]=cruiseMove[axis]===value?0:value;}
addEventListener('keydown',e=>{
 if(state==='paused'||state==='end'){
  if(e.code==='Tab'){e.preventDefault();(document.activeElement===$('resume')?$('backMenu'):$('resume')).focus();}
  if(e.code==='Escape'&&state==='paused'){e.preventDefault();resume();}return;
 }
 if(state!=='playing')return;
 if(e.code==='Escape'||e.code==='Tab'){e.preventDefault();showOverlay();return;}
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyC','KeyX','KeyF'].includes(e.code))e.preventDefault();
 // After interruption/emergency stop, a held key must be released before reuse.
 if(e.repeat&&!keys.has(e.code))return;
 keys.add(e.code);
 if(e.repeat)return;
 if(e.code==='KeyX'){stopMotion();return;}
 if(e.code==='KeyC'){
  if(cruise){cruise=false;cruiseMove={forward:0,strafe:0};for(const code of ['KeyW','KeyA','KeyS','KeyD'])keys.delete(code);}
  else{cruise=true;cruiseMove={forward:1,strafe:0};}hudElapsed=1;return;
 }
 if(cruise&&['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){steerCruise(e.code);hudElapsed=1;return;}
 if(e.code==='KeyF'&&laptop()){triggerLatch=!triggerLatch;if(triggerLatch){syncAim();game.fire();}hudElapsed=1;}
 if(e.code==='Space'){syncAim();game.fire();}
 if(e.code==='KeyQ'){aimToggle=!aimToggle;syncAim();}
 if(e.code==='KeyR')game.reload();if(e.code==='KeyE')game.useSupply();if(e.code==='KeyB')game.build();if(e.code==='KeyG')game.grenade();
});
addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;if(state==='playing'&&e.button===2){aimHeld=true;syncAim();return;}if(state!=='playing'||e.button!==0)return;if(document.pointerLockElement===canvas){firing=true;syncAim();game.fire();}else if(lookPointer===null){requestLook(true);prevLook={x:e.clientX,y:e.clientY};lookPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);}});
function endMouse(e){if(e.pointerType==='touch'||e.sourceCapabilities?.firesTouchEvents)return;if(e.button===2||e.type==='pointercancel')aimHeld=false;if(e.button===0||e.type==='pointercancel'){firing=false;lookPointer=null;prevLook=null;}}
addEventListener('pointerup',endMouse);addEventListener('pointercancel',endMouse);
// Mouse chords emit mousedown/up for every button; pointerdown/up only track the
// first/last depressed button. Keep aim and primary fire independent in both orders.
canvas.addEventListener('mousedown',e=>{
 if(state!=='playing'||e.sourceCapabilities?.firesTouchEvents)return;
 if(e.button===2)aimHeld=true;
 if(e.button===0&&document.pointerLockElement===canvas){firing=true;syncAim();game.fire();}
 syncAim();
});
addEventListener('mouseup',e=>{endMouse(e);syncAim();});
function syncAim(){game.aiming=state==='playing'&&!game.player.dead&&!game.reloading&&(aimHeld||aimToggle);}
function lookDelta(dx,dy,base){
 const scoped=game.aiming?Number($('aimSensitivity')?.value||1):1;
 const rate=base*Number($('sensitivity').value)*scoped*(renderer.lookScale??(game.aiming?.55:1));
 game.player.a+=dx*rate;game.player.pitch=clamp((game.player.pitch||0)-dy*rate,-.65,.65);
}
addEventListener('mousemove',e=>{if(state==='playing'&&document.pointerLockElement===canvas)lookDelta(e.movementX,e.movementY,.0025);});
canvas.addEventListener('pointermove',e=>{if(state!=='playing'||document.pointerLockElement===canvas||lookPointer!==e.pointerId||!prevLook)return;lookDelta(e.clientX-prevLook.x,e.clientY-prevLook.y,.005);prevLook={x:e.clientX,y:e.clientY};});
document.addEventListener('pointerlockchange',()=>{lockPending=false;if(!document.pointerLockElement&&state==='playing')showOverlay();});
addEventListener('blur',()=>{if(state==='playing')showOverlay();else resetInput();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')showOverlay();});
const stick=$('stick');stick.onpointerdown=e=>{if(state!=='playing'||stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stickOrigin={x:e.clientX,y:e.clientY};stick.setPointerCapture(e.pointerId);};stick.onpointermove=e=>{if(e.pointerId!==stickPointer||!stickOrigin)return;move.x=clamp((e.clientX-stickOrigin.x)/38,-1,1);move.y=clamp((e.clientY-stickOrigin.y)/38,-1,1);stick.querySelector('i').style.transform=`translate(${move.x*28}px,${move.y*28}px)`;};const endStick=e=>{if(e.pointerId!==stickPointer)return;stickPointer=null;move={x:0,y:0};stick.querySelector('i').style.transform='';};stick.onpointerup=endStick;stick.onpointercancel=endStick;stick.onlostpointercapture=endStick;
const look=$('look');look.onpointerdown=e=>{if(state!=='playing'||lookPointer!==null)return;e.preventDefault();lookPointer=e.pointerId;prevLook={x:e.clientX,y:e.clientY};look.setPointerCapture(e.pointerId);};look.onpointermove=e=>{if(state!=='playing'||e.pointerId!==lookPointer||!prevLook)return;lookDelta(e.clientX-prevLook.x,e.clientY-prevLook.y,.006);prevLook={x:e.clientX,y:e.clientY};};const endLook=e=>{if(e.pointerId===lookPointer){lookPointer=null;prevLook=null;}};look.onpointerup=endLook;look.onpointercancel=endLook;look.onlostpointercapture=endLook;
$('tFire').onpointerdown=e=>{if(state!=='playing'||firePointer!==null)return;e.preventDefault();$('tFire').setPointerCapture(e.pointerId);firePointer=e.pointerId;firing=true;syncAim();game.fire();};const endFire=e=>{if(e.pointerId===firePointer){firing=false;firePointer=null;}};$('tFire').onpointerup=endFire;$('tFire').onpointercancel=endFire;$('tFire').onlostpointercapture=endFire;
if($('tAim'))$('tAim').onpointerdown=e=>{e.preventDefault();if(state==='playing'){aimToggle=!aimToggle;syncAim();$('tAim').setAttribute('aria-pressed',String(aimToggle));}};
for(const [id,method]of [['tReload','reload'],['tUse','useSupply'],['tBuild','build'],['tGrenade','grenade']])$(id).onpointerdown=e=>{e.preventDefault();if(state==='playing')game[method]();};
// DOM text is cached; HUD updates at 20Hz, minimap at 10Hz. Combat flashes stay per-frame.
function text(id,value){if(hudValues.get(id)===value)return;hudValues.set(id,value);const el=$(id);if(el)el.textContent=value;}
function hud(){
 document.body.classList.toggle('aiming',!!game.aiming);document.body.classList.toggle('reloading',game.reloading>0);$('tAim')?.setAttribute('aria-pressed',String(aimHeld||aimToggle));
 if($('reloadProgress')){$('reloadProgress').value=game.reloading?1-game.reloading/game.weapon.reload:0;$('reloadProgress').hidden=!game.reloading;}
 const motion=cruise?[cruiseMove.forward>0?'W':cruiseMove.forward<0?'S':'',cruiseMove.strafe>0?'D':cruiseMove.strafe<0?'A':''].filter(Boolean).join('+'):'';
 const controls=!touch&&(cruise||triggerLatch)?`${cruise?'CRUISE '+(motion||'STOPPED')+' / ':''}${triggerLatch?'TRIGGER ON / ':''}X STOP`:!touch&&laptop()?'C CRUISE / Q AIM / F TRIGGER':'';text('controlStatus',controls);if($('controlStatus'))$('controlStatus').hidden=!controls;
 text('combatStatus',game.player.dead?'REDEPLOYING':game.player.inv>0?'SPAWN SHIELD':game.reloading?'RELOADING':game.sprinting?'SPRINTING':game.aiming?'AIMING':game.ammo<=Math.ceil(game.weapon.mag*.2)?'LOW AMMO / RELOAD':'');
 if($('stamina'))$('stamina').value=game.stamina??100;
 for(let i=0;i<3;i++)text('score'+i,game.scores[i]);
 text('health',Math.ceil(game.player.hp));$('healthbar').value=game.player.hp;text('ammo',game.reloading?'…':game.ammo);text('reserve',game.reserve);text('cash','$'+Math.floor(game.cash).toLocaleString());text('weaponLabel',game.weapon.name+' / G '+game.nades);
 text('zoneStatus',game.owner===0?'Yard Dogs holding':game.owner===1?'Rent-a-Tank holding':game.owner===2?'HR Department holding':'Contested / neutral');$('zoneStatus').style.color=game.owner<0?'#dbf57a':TEAM_COLORS[game.owner];
 const distance=Math.hypot(game.player.x-14,game.player.y-14),inside=distance<4,bearing=angleDiff(Math.atan2(14-game.player.y,14-game.player.x),game.player.a);
 text('zoneLabel',inside?'IN THE ZONE / 2× PRESENCE':'CAPTURE THE YARD');
 text('objectiveBearing',inside?`ZONE PRESENCE / ${(game.counts||[0,0,0]).join(' / ')}`:`${bearing<-.3?'◀':bearing>.3?'▶':'▲'} ZONE A / ${Math.ceil(distance)} m`);
 const supply=game.supplies.find(s=>Math.hypot(s.x-game.player.x,s.y-game.player.y)<1.7);
 const hint=game.player.dead?'':supply?(supply.ready>game.time?`SUPPLY READY IN ${Math.ceil(supply.ready-game.time)}s`:`${touch?'SUPPLY':'E'} / RESUPPLY HEALTH + AMMO`):game.ammo===0&&!game.reloading?(game.reserve?`${touch?'RELOAD':'R'} / RELOAD`:'FIND A GREEN SUPPLY CRATE'):'';
 text('interactionHint',hint);if($('interactionHint'))$('interactionHint').hidden=!hint;
 const seconds=Math.floor(game.time);text('matchClock',`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`);
}
// Interpolate only displayed positions between fixed simulation steps. Mouse
// heading/pitch stay immediate; collision, hit tests and bot decisions use Game.
function renderState(){
 if(!displayGame||Object.getPrototypeOf(displayGame)!==game){displayGame=Object.create(game);displayGame.player={...game.player};displayGame.bots=game.bots.map(b=>({...b}));}
 const alpha=state==='playing'?clamp(accumulator/STEP,0,1):1;
 function pose(out,current,previous,turn=false){
  Object.assign(out,current);
  if(!previous||current.dead||previous.dead||Math.hypot(current.x-previous.x,current.y-previous.y)>1)return;
  out.x=previous.x+(current.x-previous.x)*alpha;out.y=previous.y+(current.y-previous.y)*alpha;
  if(turn)out.a=previous.a+angleDiff(current.a,previous.a)*alpha;
 }
 pose(displayGame.player,game.player,previousPose?.player);
 for(let i=0;i<game.bots.length;i++){displayGame.bots[i]??={};pose(displayGame.bots[i],game.bots[i],previousPose?.bots[i],true);}
 displayGame.bots.length=game.bots.length;
 return displayGame;
}
function frame(now){
 const elapsed=Math.max(0,(now-last)/1000),dt=clamp(elapsed,0,.1);last=now;renderer.frameBudget?.(elapsed,state==='playing');hudElapsed+=dt;mapElapsed+=dt;ambientElapsed+=dt;
 if(state==='playing'){
  syncAim();accumulator+=dt;
  const axis=(a,b)=>(keys.has(a)?1:0)-(keys.has(b)?1:0),input={forward:(cruise?cruiseMove.forward:axis('KeyW','KeyS'))+axis('ArrowUp','ArrowDown')-move.y,strafe:(cruise?cruiseMove.strafe:axis('KeyD','KeyA'))+move.x,turn:axis('ArrowRight','ArrowLeft'),sprint:keys.has('ShiftLeft')||keys.has('ShiftRight')||(touch&&move.y<-.9),aim:aimHeld||aimToggle,fire:firing||triggerLatch||keys.has('Space')};
  while(accumulator+1e-9>=STEP&&state==='playing'){accumulator=Math.max(0,accumulator-STEP);previousPose={player:{...game.player},bots:game.bots.map(b=>({x:b.x,y:b.y,a:b.a,dead:b.dead}))};game.update(STEP,input);}
  document.body.classList.toggle('aiming',!!game.aiming);document.body.classList.toggle('scoped',game.kit==='marksman'&&!!game.aiming);
  if(hudElapsed>=.05){hud();hudElapsed=0;}if(mapElapsed>=.1){renderer.minimap(game,$('map'));mapElapsed=0;}
  $('hit').style.opacity=renderer.hit>0?1:0;$('damage').style.opacity=renderer.hurt/.3;
  text('killConfirm',now<killUntil?'CONTRACTOR DISMISSED / +$100':'');if($('killConfirm'))$('killConfirm').hidden=now>=killUntil;
  if(now-lastSave>5000){record();lastSave=now;}
 }
 if(state==='menu'){game.player.x=4;game.player.y=5;game.player.a=.5+(renderer.reduced?0:Math.sin(now*.00003)*.4);}
 if(state==='playing'||ambientElapsed>=1/30){renderer.draw(state==='menu'?game:renderState(),state==='playing'?dt:ambientElapsed,state!=='menu');ambientElapsed=0;}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').then(reg=>{if(reg.waiting)$('menuNote').textContent='Update ready. Refresh to load the latest contract.';reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')$('menuNote').textContent=navigator.serviceWorker.controller?'Update ready. Refresh to load the latest contract.':'Ready for offline play on this browser.';});});}).catch(()=>{$('menuNote').textContent='Online play ready. Offline caching unavailable in this browser.';});
addEventListener('pagehide',()=>{if(state!=='menu')record();});
