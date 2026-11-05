// Optional real-browser verification. No browser/runtime dependency is shipped.
// npm install --prefix <temporary-tools-directory> playwright
// PLAYWRIGHT_MODULE=<temporary-tools-directory>/node_modules/playwright
// BROWSER_EXECUTABLE=<installed Chrome/Edge executable> node tests/browser-smoke.cjs
// Optional BROWSER_CPU_THROTTLE=4 exercises bounded waits with slower rendering.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!pathname.startsWith('/DubDizzles/'))throw Error('outside scope');
 const file=path.resolve(root,pathname.slice('/DubDizzles/'.length)||'index.html');if(!file.startsWith(root+path.sep))throw Error('outside root');
 const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
const deadline=setTimeout(()=>{console.error('Browser smoke exceeded 90 seconds');process.exit(1);},90000);
async function throttlePage(page){
 const rate=Number(process.env.BROWSER_CPU_THROTTLE||1);assert.ok(Number.isFinite(rate)&&rate>=1,'CPU throttle must be at least 1');
 if(rate>1)await(await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate',{rate});
}
// Inspect the real controller through a test-only response suffix, never a shipped
// debug API. Offline/update checks above use a separate unmodified browser context.
async function instrumentController(page){
 await throttlePage(page);
 await page.route('**/app.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+`\nimport {cameraView as qaCameraView} from './renderer.js';
 globalThis.__feelTrace=[];globalThis.__feelMouse={x:0,y:0,count:0};
 addEventListener('mousemove',e=>{__feelMouse.x+=e.movementX;__feelMouse.y+=e.movementY;__feelMouse.count++;},true);
 for(const type of ['mousemove','mousedown','mouseup','pointerdown','pointerup','pointerlockchange'])for(const phase of ['before','after'])addEventListener(type,e=>{__feelTrace.push({type,phase,time:e.timeStamp,movementX:e.movementX,movementY:e.movementY,clientX:e.clientX,clientY:e.clientY,screenX:e.screenX,screenY:e.screenY,button:e.button,buttons:e.buttons,trusted:e.isTrusted,touch:e.sourceCapabilities?.firesTouchEvents,pitch:game.player.pitch||0,a:game.player.a,state,lock:document.pointerLockElement?.id});if(__feelTrace.length>300)__feelTrace.shift();},phase==='before');
 globalThis.__feelInspect=()=>({x:game.player.x,y:game.player.y,a:game.player.a,pitch:game.player.pitch||0,aiming:game.aiming,firing,ammo:game.ammo,reloading:game.reloading,time:game.time,shotInterval:game.weapon.rate,state,renderAim:renderer.aim,view:qaCameraView(game.kit,renderer.aim),lock:document.pointerLockElement?.id,mouse:{...__feelMouse}});`});});
}
// Slow software-rendered browsers can advance less simulation than wall time.
// Observe actual simulation progress, retaining a strict ten-second response bound.
async function observeSimulation(page,duration){
 return page.evaluate(duration=>new Promise((resolve,reject)=>{
  const samples=[],start=__feelInspect().time,deadline=performance.now()+10000;
  function sample(){const state=__feelInspect();samples.push(state);if(state.state!=='playing')return reject(Error('Simulation left playing state'));if(state.time-start>=duration)return resolve(samples);if(performance.now()>deadline)return reject(Error(`Simulation did not advance ${duration}s within 10s`));requestAnimationFrame(sample);}sample();
 }),duration);
}
async function waitForADS(page){await page.waitForFunction(()=>{const s=__feelInspect();return s.aiming&&s.renderAim>.98;},null,{timeout:10000});}
async function probeCapturedPitch(page,output){
 // Prime known Playwright coordinates, then use actual input to reach each clamp.
 // Small probes always move away from that clamp; no simulation state is reset.
 const point={x:720,y:450},results=[];await page.mouse.move(point.x,point.y);
 try{for(const bound of [.65,-.65]){
  point.y+=bound>0?-4096:4096;await page.mouse.move(point.x,point.y);await page.waitForFunction(bound=>Math.abs(__feelInspect().pitch-bound)<1e-9,bound,{timeout:10000});
  const before=await page.evaluate(()=>__feelInspect());point.x+=24;point.y+=bound>0?24:-24;await page.mouse.move(point.x,point.y);await page.waitForFunction(count=>__feelInspect().mouse.count>count,before.mouse.count,{timeout:10000});const after=await page.evaluate(()=>__feelInspect());
  const pitchDelta=after.pitch-before.pitch,yawDelta=after.a-before.a;results.push({bound,before,after,pitchDelta,yawDelta});
  assert.ok(Math.abs(after.pitch)<=.65&&Math.abs(pitchDelta)>.0001&&Math.abs(pitchDelta)<.2,'small captured input changes bounded pitch away from either clamp');assert.ok(pitchDelta*bound<0,'pitch moves away from the starting limit');assert.ok(Math.abs(yawDelta)>.0001&&Math.abs(yawDelta)<.2,'small captured input changes yaw without an uncontrolled jump');
 }}finally{await fs.writeFile(path.join(output,'marksman-pitch-probes.json'),JSON.stringify({results,trace:await page.evaluate(()=>__feelTrace)},null,2));}
}
async function feelGauntlet(browser,url,output,errors){
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));await instrumentController(page);
 await page.goto(url);
 for(const kit of ['carbine','smg','marksman']){
  await page.locator(`[data-kit="${kit}"]`).click();await page.locator('#deploy').click();await page.waitForFunction(()=>__feelInspect().lock==='world',null,{timeout:10000});
  assert.equal(await page.evaluate(()=>__feelInspect().lock),'world','actual mouse capture is required for this scenario');
  await page.screenshot({path:path.join(output,kit+'-hip.png')});const beforeRMB=await page.evaluate(()=>__feelInspect());await page.mouse.down({button:'right'});await waitForADS(page);const afterRMB=await page.evaluate(()=>__feelInspect());const inputTrace={kit,beforeRMB,afterRMB,trace:await page.evaluate(()=>__feelTrace)};await fs.writeFile(path.join(output,kit+'-mouse-trace.json'),JSON.stringify(inputTrace,null,2));console.log('Captured ADS input',JSON.stringify({kit,beforeRMB,afterRMB,events:inputTrace.trace.slice(-12)}));
  assert.ok(Math.abs(afterRMB.pitch-beforeRMB.pitch)<1e-6&&Math.abs(afterRMB.a-beforeRMB.a)<1e-6,'pressing RMB without commanded movement must not warp the camera; inspect saved mouse trace');
  const ads=await page.evaluate(()=>__feelInspect());assert.equal(ads.aiming,true);assert.ok(ads.renderAim>.92);assert.ok(ads.view.magnification>(kit==='marksman'?3.8:kit==='carbine'?1.4:1.17));
  await page.screenshot({path:path.join(output,kit+'-ads.png')});
  if(kit==='marksman'){
   assert.equal(ads.view.scoped,true);
   const outside=await page.locator('#world').evaluate(canvas=>{const px=canvas.getContext('2d').getImageData(Math.round(canvas.width*.05),Math.round(canvas.height*.5),1,1).data;return px[0]+px[1]+px[2];});assert.ok(outside<100,'sniper optic has an actual opaque peripheral mask');
  }
  await page.keyboard.down('w');await page.keyboard.down('d');const before=await page.evaluate(()=>__feelInspect());await page.mouse.down({button:'left'});
  const sequence=await observeSimulation(page,.35);
  const after=sequence.at(-1);assert.ok(sequence.every(s=>s.aiming&&s.firing),'ADS and fire stay held throughout walk/strafe');assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>.2,'walk and strafe change the actual player pose during ADS');assert.ok(after.ammo<before.ammo,'RMB then LMB chord actually fires');
  await page.keyboard.up('w');await page.keyboard.up('d');await page.mouse.up({button:'left'});const released=await page.evaluate(()=>__feelInspect());assert.equal(released.firing,false);assert.equal(released.aiming,true);const releaseSamples=await observeSimulation(page,released.shotInterval+.05);assert.ok(releaseSamples.every(s=>s.ammo===released.ammo&&!s.firing&&s.aiming),'primary release stops shots for a full firing interval while RMB stays down');
  await page.mouse.up({button:'right'});await page.mouse.down({button:'left'});await page.mouse.down({button:'right'});await waitForADS(page);assert.equal((await page.evaluate(()=>__feelInspect())).aiming,true,'LMB then RMB chord also enters ADS');await page.mouse.up({button:'right'});assert.equal((await page.evaluate(()=>__feelInspect())).firing,true,'aim release preserves held primary fire');await page.mouse.up({button:'left'});
  if(kit==='marksman'){
   await page.mouse.down({button:'right'});await waitForADS(page);await probeCapturedPitch(page,output);await page.screenshot({path:path.join(output,'marksman-look.png')});
   await page.keyboard.press('r');await page.waitForFunction(()=>{const s=__feelInspect();return s.reloading>0&&!s.aiming&&!s.view.scoped;},null,{timeout:10000});assert.equal((await page.evaluate(()=>__feelInspect())).aiming,false,'reload leaves scoped aiming');await page.screenshot({path:path.join(output,'marksman-reload.png')});await page.waitForFunction(()=>{const s=__feelInspect();return s.reloading===0&&s.ammo===10&&s.aiming&&s.view.scoped;},null,{timeout:15000});const reloaded=await page.evaluate(()=>__feelInspect());assert.equal(reloaded.ammo,10);assert.equal(reloaded.aiming,true,'held RMB re-enters scope after reload');await page.mouse.up({button:'right'});
  }
  await page.keyboard.press('Escape');await page.locator('#backMenu').click();
 }
 // Deterministic renderer fixture measures actual on-canvas target growth, rather
 // than trusting only the FOV helper or a class name. Production simulation stays untouched.
 const hipTarget=await page.evaluate(async()=>{
  const{Game}=await import('./game.js'),{Renderer}=await import('./renderer.js');const canvas=document.createElement('canvas');canvas.style='position:fixed;inset:0;width:100vw;height:100vh;z-index:10000';document.body.append(canvas);const renderer=new Renderer(canvas);renderer.resize();const soldier=renderer.soldier.bind(renderer);renderer.soldier=(ink,...args)=>{soldier(ink,...args);ink.fillStyle='#ff00ff';ink.fillRect(56,56,16,4);};const game=new Game({kit:'marksman',random:()=>.5});Object.assign(game.player,{x:14,y:14,a:0,pitch:0});game.supplies=[];game.bots=[{...game.spawnBot(1,0),x:19,y:14,a:Math.PI,moving:0,walkPhase:0}];
  const bounds=()=>{const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let left=canvas.width,right=-1;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){const i=(y*canvas.width+x)*4;if(pixels[i]>180&&pixels[i+1]<30&&pixels[i+2]>180){left=Math.min(left,x);right=Math.max(right,x);}}return right>=left?right-left+1:0;};renderer.draw(game,1/60,true);globalThis.__opticFixture={renderer,game,bounds};return bounds();
 });
 await page.screenshot({path:path.join(output,'optic-target-hip.png')});const adsTarget=await page.evaluate(()=>{const{renderer,game,bounds}=__opticFixture;game.aiming=true;for(let i=0;i<30;i++)renderer.draw(game,1/60,true);return bounds();});await page.screenshot({path:path.join(output,'optic-target-ads.png')});assert.ok(hipTarget>0&&adsTarget/hipTarget>3.65&&adsTarget/hipTarget<4.35,`visible target should grow 4x (${hipTarget}→${adsTarget}px)`);
 await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(String(e)));await instrumentController(phone);await phone.goto(url);await phone.locator('[data-kit="marksman"]').tap();await phone.locator('#deploy').tap();await phone.locator('#tAim').tap();await waitForADS(phone);assert.equal((await phone.evaluate(()=>__feelInspect())).view.scoped,true);await phone.screenshot({path:path.join(output,'marksman-portrait-ads.png')});
 const cdp=await mobile.newCDPSession(phone),stick=await phone.locator('#stick').boundingBox(),fire=await phone.locator('#tFire').boundingBox(),points=[{id:1,x:stick.x+stick.width/2,y:stick.y+stick.height/2},{id:2,x:230,y:360},{id:3,x:fire.x+fire.width/2,y:fire.y+fire.height/2}],before=await phone.evaluate(()=>__feelInspect());await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});points[0].x+=15;points[0].y-=25;points[1].x+=15;points[1].y-=8;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points});const phoneSamples=await observeSimulation(phone,.35);assert.ok(phoneSamples.every(s=>s.aiming&&s.firing&&s.view.scoped),'portrait scoped input remains concurrent');const moved=phoneSamples.at(-1);assert.ok(moved.view.scoped&&moved.ammo<before.ammo&&Math.hypot(moved.x-before.x,moved.y-before.y)>.2&&moved.pitch>before.pitch,'portrait sniper scope preserves move/look/fire and angular pitch');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.slice(2)});assert.equal((await phone.evaluate(()=>__feelInspect())).firing,false);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.slice(0,2)});await phone.screenshot({path:path.join(output,'marksman-portrait-moving.png')});await cdp.detach();await mobile.close();
}
(async()=>{
 const output=process.env.BROWSER_EVIDENCE_DIR||await fs.mkdtemp(path.join(os.tmpdir(),'war-dizzles-browser-'));
 await fs.mkdir(output,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/DubDizzles/`;
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
  await throttlePage(page);
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(url);await page.waitForFunction(async()=>Boolean((await navigator.serviceWorker.getRegistration())?.active),null,{timeout:15000});await page.waitForFunction(()=>navigator.serviceWorker.controller,null,{timeout:15000});
  await page.screenshot({path:path.join(output,'desktop-menu.png'),fullPage:true});await page.locator('#deploy').click();await page.locator('#hud').waitFor({state:'visible',timeout:10000});
  assert.equal(await page.locator('#stick').isVisible(),false,'fine-pointer desktop must retain mouse mode');
  await page.screenshot({path:path.join(output,'desktop-game.png')});await page.keyboard.press('Space');await page.waitForFunction(()=>Number(document.querySelector('#ammo').textContent)<24,null,{timeout:10000});await page.keyboard.press('r');await page.waitForFunction(()=>document.querySelector('#ammo').textContent==='24'&&document.querySelector('#reloadProgress').hidden,null,{timeout:15000});assert.equal(await page.locator('#ammo').textContent(),'24');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#overlay').isVisible(),true);assert.equal(await page.locator('#hud').evaluate(el=>el.inert),true);
  for(let i=0;i<5;i++){await page.keyboard.press('Tab');assert.ok(['resume','backMenu'].includes(await page.evaluate(()=>document.activeElement.id)));}
  await page.locator('#backMenu').click();await page.reload();await context.setOffline(true);await page.reload();await page.locator('#deploy').click();assert.equal(await page.locator('#hud').isVisible(),true);
  assert.deepEqual(await page.evaluate(async()=>{const manifest=await fetch('./manifest.webmanifest').then(r=>r.json());return Promise.all(manifest.icons.map(async icon=>({src:icon.src,ok:(await fetch(icon.src)).ok})));}),[{src:'./icon-192.png',ok:true},{src:'./icon-512.png',ok:true},{src:'./icon.svg',ok:true}]);await context.close();
  for(const [name,width,height]of [['portrait',390,844],['landscape',844,390],['narrow',320,740]]){
   const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await instrumentController(p);await p.goto(url);
   await p.screenshot({path:path.join(output,name+'-menu.png'),fullPage:true});await p.locator('#deploy').tap();await p.locator('#hud').waitFor({state:'visible',timeout:10000});
   for(const id of ['tFire','tAim','tReload','tBuild','tUse','tGrenade','pause']){const b=await p.locator('#'+id).boundingBox();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,`${name} ${id} is within viewport`);assert.ok(b.width>=44&&b.height>=44,`${name} ${id} meets touch target size`);}
   await p.locator('#tFire').tap();await p.waitForFunction(()=>Number(document.querySelector('#ammo').textContent)<24,null,{timeout:10000});assert.ok(Number(await p.locator('#ammo').textContent())<24,'touch tap fires');
   if(name==='landscape'){
    await p.locator('#tAim').tap();await waitForADS(p);assert.equal((await p.evaluate(()=>__feelInspect())).aiming,true);
    const cdp=await c.newCDPSession(p),stick=await p.locator('#stick').boundingBox(),fire=await p.locator('#tFire').boundingBox();
    const points=[{id:1,x:stick.x+stick.width/2,y:stick.y+stick.height/2},{id:2,x:width*.55,y:height*.4},{id:3,x:fire.x+fire.width/2,y:fire.y+fire.height/2}];
    const before=Number(await p.locator('#ammo').textContent()),pose=await p.evaluate(()=>__feelInspect());await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
    points[0].y-=25;points[1].x+=30;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points});const touchSamples=await observeSimulation(p,.4);assert.ok(touchSamples.every(s=>s.aiming&&s.firing),'touch ADS and fire remain concurrent during simulation progress');assert.ok(Number(await p.locator('#ammo').textContent())<before,'three simultaneous fingers can move/look/fire');const moved=await p.evaluate(()=>__feelInspect());assert.ok(moved.aiming&&Math.hypot(moved.x-pose.x,moved.y-pose.y)>.2&&Math.abs(moved.a-pose.a)>.01,'touch ADS preserves actual movement and look');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.slice(2)});const released=await p.evaluate(()=>__feelInspect());const releaseSamples=await observeSimulation(p,released.shotInterval+.05);assert.ok(releaseSamples.every(s=>!s.firing&&s.ammo===released.ammo&&s.aiming),'lifting fire finger stops fire independently for a complete firing interval');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.slice(0,2)});await cdp.detach();
   }
   await p.screenshot({path:path.join(output,name+'-game.png')});await p.locator('#pause').tap();assert.equal(await p.locator('#overlay').isVisible(),true);await c.close();
  }
  await feelGauntlet(browser,url,output,errors);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',browser:browser.version(),cpuThrottle:Number(process.env.BROWSER_CPU_THROTTLE||1),scenarios:['desktop deploy/fire/reload/pause/focus','offline reload/deploy','390x844, 844x390 and 320x740 touch layout/fire/pause','three-finger touch ownership','all weapons: actual captured mouse chords, ADS walk/strafe/fire, sniper optic and magnification'],errors,evidence:output},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;}).finally(()=>clearTimeout(deadline));
