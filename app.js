import {Game,KITS,safeProfile,clamp,TEAM_COLORS,angleDiff} from './game.js';
import {Renderer} from './renderer.js';
const $=id=>document.getElementById(id),canvas=$('world'),renderer=new Renderer(canvas);renderer.resize();addEventListener('resize',()=>renderer.resize());
let storageOK=true,profile;try{profile=safeProfile(JSON.parse(localStorage.getItem('dub-dizzles-profile')||'null'));}catch{profile=safeProfile(null);storageOK=false;}
const save=()=>{try{localStorage.setItem('dub-dizzles-profile',JSON.stringify(profile));}catch{storageOK=false;}};
let kit='carbine',game=new Game(),state='menu',last=performance.now(),keys=new Set(),firing=false,move={x:0,y:0},audio=null,lookPointer=null,stickPointer=null,stickOrigin=null,prevLook=null,firePointer=null,endReport='',lastSave=0,aimHeld=false,aimToggle=false;
const STEP=1/120;
let accumulator=0,hudElapsed=1,mapElapsed=1,ambientElapsed=1,killUntil=0,audioBus=null;
const noiseBuffers=new Map(),hudValues=new Map();
let settings={};try{settings=JSON.parse(localStorage.getItem('war-dizzles-settings')||'{}')||{};}catch{}
if(typeof settings!=='object'||Array.isArray(settings))settings={};
for(const id of ['difficulty','sensitivity','quality','sound']){const el=$(id);if(!el)continue;if(id==='sound')el.checked=settings[id]!==false;else if([...el.options||[]].some(o=>o.value===settings[id])||id==='sensitivity'&&Number(settings[id])>=.5&&Number(settings[id])<=2)el.value=settings[id];el.addEventListener('change',()=>{settings[id]=id==='sound'?el.checked:el.value;try{localStorage.setItem('war-dizzles-settings',JSON.stringify(settings));}catch{}if(id==='quality'){renderer.quality=el.value;renderer.resize();}});}
renderer.quality=$('quality')?.value||'auto';renderer.resize();
let touch=matchMedia('(pointer:coarse)').matches;
document.body.classList.toggle('touch',touch);
// Touch-capable laptops still need mouse capture. Follow the active input source.
addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.pointerType==='touch'){touch=e.pointerType==='touch';document.body.classList.toggle('touch',touch);}});
function career(){ if(profile.cash<KITS[kit].cost){kit='carbine';for(const el of document.querySelectorAll('[data-kit]')){const chosen=el.dataset.kit===kit;el.classList.toggle('selected',chosen);el.setAttribute('aria-pressed',String(chosen));}} kitSummary();$('wallet').textContent='$'+profile.cash.toLocaleString();$('best').textContent=profile.best;for(const b of document.querySelectorAll('[data-kit]')){b.disabled=profile.cash<KITS[b.dataset.kit].cost;b.title=b.disabled?'Earn more cash with the free carbine':'';}}
career();
function resetInput(){keys.clear();aimHeld=false;aimToggle=false;game.aiming=false;$('tAim')?.setAttribute('aria-pressed','false');firing=false;move={x:0,y:0};lookPointer=null;stickPointer=null;stickOrigin=null;prevLook=null;firePointer=null;accumulator=0;$('stick').querySelector('i').style.transform='';}
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
function event(e){if(e.type==='shot'&&!renderer.reduced)renderer.flash=.07;if(e.type==='hit'){renderer.hit=e.kill?.24:.15;if(e.kill)killUntil=performance.now()+1100;}if(e.type==='damage')renderer.hurt=.3;if(e.type==='death'){aimHeld=false;aimToggle=false;firing=false;keys.delete('Space');}sound(e.type);if(e.text)log(e.text);hudElapsed=1;if(e.type==='end'){record();endReport=e.text;showOverlay('end');}}
function requestLook(force=false){if((force||!touch)&&canvas.requestPointerLock){try{const p=canvas.requestPointerLock();p?.catch(()=>log('Mouse capture unavailable. Drag to look or use arrow keys; Space fires.'));}catch{log('Drag to look or use arrow keys; Space fires.');}}}
function modalBackground(inert){for(const el of [canvas,$('hud'),document.querySelector?.('header')])if(el)el.inert=inert;}
function deploy(){resetInput();startAudio();game=new Game({cash:profile.cash,kit,difficulty:$('difficulty').value,onEvent:event});profile.cash=game.cash;save();$('feed').replaceChildren();state='playing';endReport='';killUntil=0;renderer.pitch=0;renderer.flash=0;renderer.hit=0;renderer.hurt=0;hudElapsed=1;mapElapsed=1;last=performance.now();$('menu').hidden=true;$('overlay').hidden=true;$('footer').hidden=true;$('hud').hidden=false;modalBackground(false);document.body.classList.add('playing');canvas.focus();requestLook();log('Clocked in. Capture the flag zone to score.');log(storageOK?'Cash and best score save on this device.':'Storage unavailable: progress lasts this session.');}
function showOverlay(mode='paused'){if(state==='menu')return;state=mode;resetInput();document.exitPointerLock?.();record();modalBackground(true);$('overlay').hidden=false;$('overlayTitle').textContent=mode==='end'?(game.scores[0]>=60?'INVOICE APPROVED.':'CONTRACT LOST.'):'ON YOUR BREAK.';$('overlayText').textContent=mode==='end'?`${endReport}\n${game.kills} eliminations · ${game.deaths} redeploys · $${game.earned} earned\n${Math.round(game.accuracy)}% accuracy · ${game.hits}/${game.shots} rounds on target\nFinal score: ${game.scores.join(' / ')}`:'The battle is paused. Your squad can wait.\nCapture the central zone; staying inside counts double for your crew.';$('resume').textContent=mode==='end'?'NEW CONTRACT ↗':'BACK TO THE YARD ↗';$('resume').focus();}
function resume(){if(state==='end'){deploy();return;}if(state!=='paused')return;state='playing';resetInput();last=performance.now();hudElapsed=1;$('overlay').hidden=true;modalBackground(false);startAudio();canvas.focus();requestLook();}
function menu(){record();state='menu';resetInput();document.exitPointerLock?.();modalBackground(false);$('overlay').hidden=true;$('menu').hidden=false;$('footer').hidden=false;$('hud').hidden=true;document.body.classList.remove('playing','aiming','reloading');career();$('deploy').focus();}
function kitSummary(){const el=$('kitSummary');if(el)el.textContent=({carbine:'YARD CARBINE · balanced automatic · 24 rounds · free every life',smg:'OFFICE SHREDDER · close-range automatic · 36 rounds · $250 per life',marksman:'LONG DISTANCE HR · precision rifle · 10 rounds · $400 per life'})[kit];}
kitSummary();
$('deploy').onclick=deploy;$('pause').onclick=()=>state==='playing'?showOverlay():state==='menu'?null:resume();$('resume').onclick=resume;$('backMenu').onclick=menu;
for(const b of document.querySelectorAll('[data-kit]'))b.onclick=()=>{kit=b.dataset.kit;for(const el of document.querySelectorAll('[data-kit]')){const chosen=el===b;el.classList.toggle('selected',chosen);el.setAttribute('aria-pressed',String(chosen));}kitSummary();};
addEventListener('keydown',e=>{if(state==='paused'||state==='end'){if(e.code==='Tab'){e.preventDefault();(document.activeElement===$('resume')?$('backMenu'):$('resume')).focus();}if(e.code==='Escape'&&state==='paused'){e.preventDefault();resume();}return;}if(state!=='playing')return;if(e.code==='Tab'){e.preventDefault();showOverlay();return;}if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(state==='playing')showOverlay();return;}if(state!=='playing')return;keys.add(e.code);if(!e.repeat){if(e.code==='Space')game.fire();if(e.code==='KeyQ')aimToggle=!aimToggle;if(e.code==='KeyR')game.reload();if(e.code==='KeyE')game.useSupply();if(e.code==='KeyB')game.build();if(e.code==='KeyG')game.grenade();}});addEventListener('keyup',e=>keys.delete(e.code));
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;if(state==='playing'&&e.button===2){aimHeld=true;return;}if(state!=='playing'||e.button!==0)return;if(document.pointerLockElement===canvas){firing=true;game.fire();}else if(lookPointer===null){requestLook(true);prevLook={x:e.clientX,y:e.clientY};lookPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);}});
function endMouse(e){if(e.pointerType==='touch')return;if(e.button===2||e.type==='pointercancel')aimHeld=false;if(e.button===0||e.type==='pointercancel'){firing=false;lookPointer=null;prevLook=null;}}
addEventListener('pointerup',endMouse);addEventListener('pointercancel',endMouse);
addEventListener('mousemove',e=>{if(state!=='playing'||document.pointerLockElement!==canvas)return;game.player.a+=e.movementX*.0025*(game.aiming?.55:1)*Number($('sensitivity').value);renderer.pitch=clamp(renderer.pitch-e.movementY*.35,-renderer.buffer.height*.2,renderer.buffer.height*.2);});
canvas.addEventListener('pointermove',e=>{if(state!=='playing'||document.pointerLockElement===canvas||lookPointer!==e.pointerId||!prevLook)return;game.player.a+=(e.clientX-prevLook.x)*.005*(game.aiming?.55:1)*Number($('sensitivity').value);renderer.pitch=clamp(renderer.pitch-(e.clientY-prevLook.y)*.35,-renderer.buffer.height*.2,renderer.buffer.height*.2);prevLook={x:e.clientX,y:e.clientY};});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&state==='playing')showOverlay();});
addEventListener('blur',()=>{if(state==='playing')showOverlay();else resetInput();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')showOverlay();});
const stick=$('stick');stick.onpointerdown=e=>{if(state!=='playing'||stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stickOrigin={x:e.clientX,y:e.clientY};stick.setPointerCapture(e.pointerId);};stick.onpointermove=e=>{if(e.pointerId!==stickPointer||!stickOrigin)return;move.x=clamp((e.clientX-stickOrigin.x)/38,-1,1);move.y=clamp((e.clientY-stickOrigin.y)/38,-1,1);stick.querySelector('i').style.transform=`translate(${move.x*28}px,${move.y*28}px)`;};const endStick=e=>{if(e.pointerId!==stickPointer)return;stickPointer=null;move={x:0,y:0};stick.querySelector('i').style.transform='';};stick.onpointerup=endStick;stick.onpointercancel=endStick;stick.onlostpointercapture=endStick;
const look=$('look');look.onpointerdown=e=>{if(state!=='playing'||lookPointer!==null)return;e.preventDefault();lookPointer=e.pointerId;prevLook={x:e.clientX,y:e.clientY};look.setPointerCapture(e.pointerId);};look.onpointermove=e=>{if(state!=='playing'||e.pointerId!==lookPointer||!prevLook)return;game.player.a+=(e.clientX-prevLook.x)*.006*(game.aiming?.55:1)*Number($('sensitivity').value);renderer.pitch=clamp(renderer.pitch-(e.clientY-prevLook.y)*.35,-renderer.buffer.height*.2,renderer.buffer.height*.2);prevLook={x:e.clientX,y:e.clientY};};const endLook=e=>{if(e.pointerId===lookPointer){lookPointer=null;prevLook=null;}};look.onpointerup=endLook;look.onpointercancel=endLook;look.onlostpointercapture=endLook;
$('tFire').onpointerdown=e=>{if(state!=='playing'||firePointer!==null)return;e.preventDefault();$('tFire').setPointerCapture(e.pointerId);firePointer=e.pointerId;firing=true;game.fire();};const endFire=e=>{if(e.pointerId===firePointer){firing=false;firePointer=null;}};$('tFire').onpointerup=endFire;$('tFire').onpointercancel=endFire;$('tFire').onlostpointercapture=endFire;
if($('tAim'))$('tAim').onpointerdown=e=>{e.preventDefault();if(state==='playing'){aimToggle=!aimToggle;$('tAim').setAttribute('aria-pressed',String(aimToggle));}};
for(const [id,method]of [['tReload','reload'],['tUse','useSupply'],['tBuild','build'],['tGrenade','grenade']])$(id).onpointerdown=e=>{e.preventDefault();if(state==='playing')game[method]();};
// DOM text is cached; HUD updates at 20Hz, minimap at 10Hz. Combat flashes stay per-frame.
function text(id,value){if(hudValues.get(id)===value)return;hudValues.set(id,value);const el=$(id);if(el)el.textContent=value;}
function hud(){
 document.body.classList.toggle('aiming',!!game.aiming);document.body.classList.toggle('reloading',game.reloading>0);$('tAim')?.setAttribute('aria-pressed',String(aimHeld||aimToggle));
 if($('reloadProgress')){$('reloadProgress').value=game.reloading?1-game.reloading/game.weapon.reload:0;$('reloadProgress').hidden=!game.reloading;}
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
function frame(now){
 const dt=clamp((now-last)/1000,0,.1);last=now;hudElapsed+=dt;mapElapsed+=dt;ambientElapsed+=dt;
 if(state==='playing'){
  accumulator+=dt;
  const axis=(a,b)=>(keys.has(a)?1:0)-(keys.has(b)?1:0),input={forward:axis('KeyW','KeyS')+axis('ArrowUp','ArrowDown')-move.y,strafe:axis('KeyD','KeyA')+move.x,turn:axis('ArrowRight','ArrowLeft'),sprint:keys.has('ShiftLeft')||keys.has('ShiftRight')||(touch&&move.y<-.9),aim:aimHeld||aimToggle,fire:firing||keys.has('Space')};
  while(accumulator+1e-9>=STEP&&state==='playing'){accumulator=Math.max(0,accumulator-STEP);game.update(STEP,input);}
  if(hudElapsed>=.05){hud();hudElapsed=0;}if(mapElapsed>=.1){renderer.minimap(game,$('map'));mapElapsed=0;}
  $('hit').style.opacity=renderer.hit>0?1:0;$('damage').style.opacity=renderer.hurt/.3;
  text('killConfirm',now<killUntil?'CONTRACTOR DISMISSED / +$100':'');if($('killConfirm'))$('killConfirm').hidden=now>=killUntil;
  if(now-lastSave>5000){record();lastSave=now;}
 }
 if(state==='menu'){game.player.x=4;game.player.y=5;game.player.a=.5+(renderer.reduced?0:Math.sin(now*.00003)*.4);}
 if(state==='playing'||ambientElapsed>=1/30){renderer.draw(game,state==='playing'?dt:ambientElapsed,state!=='menu');ambientElapsed=0;}
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').then(reg=>{if(reg.waiting)$('menuNote').textContent='Update ready. Refresh to load the latest contract.';reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed')$('menuNote').textContent=navigator.serviceWorker.controller?'Update ready. Refresh to load the latest contract.':'Ready for offline play on this browser.';});});}).catch(()=>{$('menuNote').textContent='Online play ready. Offline caching unavailable in this browser.';});
addEventListener('pagehide',()=>{if(state!=='menu')record();});
