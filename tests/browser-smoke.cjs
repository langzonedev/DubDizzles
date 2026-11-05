// Optional real-browser verification. No browser/runtime dependency is shipped.
// npm install --prefix <temporary-tools-directory> playwright
// PLAYWRIGHT_MODULE=<temporary-tools-directory>/node_modules/playwright
// BROWSER_EXECUTABLE=<installed Chrome/Edge executable> node tests/browser-smoke.cjs
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
// Inspect the real controller through a test-only response suffix, never a shipped
// debug API. Offline/update checks above use a separate unmodified browser context.
async function instrumentController(page){
 await page.route('**/app.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+`\nimport {cameraView as qaCameraView} from './renderer.js';globalThis.__feelInspect=()=>({x:game.player.x,y:game.player.y,a:game.player.a,pitch:game.player.pitch||0,aiming:game.aiming,firing,ammo:game.ammo,reloading:game.reloading,state,renderAim:renderer.aim,view:qaCameraView(game.kit,renderer.aim),lock:document.pointerLockElement?.id});`});});
}
async function feelGauntlet(browser,url,output,errors){
 const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(String(e)));await instrumentController(page);
 await page.goto(url);
 for(const kit of ['carbine','smg','marksman']){
  await page.locator(`[data-kit="${kit}"]`).click();await page.locator('#deploy').click();await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>__feelInspect().lock),'world','actual mouse capture is required for this scenario');
  await page.screenshot({path:path.join(output,kit+'-hip.png')});await page.mouse.down({button:'right'});await page.waitForTimeout(180);
  const ads=await page.evaluate(()=>__feelInspect());assert.equal(ads.aiming,true);assert.ok(ads.renderAim>.92);assert.ok(ads.view.magnification>(kit==='marksman'?3.8:kit==='carbine'?1.4:1.17));
  await page.screenshot({path:path.join(output,kit+'-ads.png')});
  if(kit==='marksman'){
   assert.equal(ads.view.scoped,true);
   const outside=await page.locator('#world').evaluate(canvas=>{const px=canvas.getContext('2d').getImageData(Math.round(canvas.width*.05),Math.round(canvas.height*.5),1,1).data;return px[0]+px[1]+px[2];});assert.ok(outside<100,'sniper optic has an actual opaque peripheral mask');
  }
  await page.keyboard.down('w');await page.keyboard.down('d');const before=await page.evaluate(()=>__feelInspect());await page.mouse.down({button:'left'});
  const sequence=await page.evaluate(()=>new Promise(resolve=>{const samples=[],start=performance.now();function sample(){const state=__feelInspect();samples.push(state);if(performance.now()-start<350)requestAnimationFrame(sample);else resolve(samples);}sample();}));
  const after=sequence.at(-1);assert.ok(sequence.every(s=>s.aiming&&s.firing),'ADS and fire stay held throughout walk/strafe');assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>.2,'walk and strafe change the actual player pose during ADS');assert.ok(after.ammo<before.ammo,'RMB then LMB chord actually fires');
  await page.keyboard.up('w');await page.keyboard.up('d');await page.mouse.up({button:'left'});await page.waitForTimeout(100);const released=await page.evaluate(()=>__feelInspect());assert.equal(released.firing,false);assert.equal(released.aiming,true);await page.waitForTimeout(200);assert.equal((await page.evaluate(()=>__feelInspect())).ammo,released.ammo,'primary release stops shots while RMB stays down');
  await page.mouse.up({button:'right'});await page.mouse.down({button:'left'});await page.mouse.down({button:'right'});await page.waitForTimeout(100);assert.equal((await page.evaluate(()=>__feelInspect())).aiming,true,'LMB then RMB chord also enters ADS');await page.mouse.up({button:'right'});assert.equal((await page.evaluate(()=>__feelInspect())).firing,true,'aim release preserves held primary fire');await page.mouse.up({button:'left'});
  if(kit==='marksman'){
   await page.mouse.down({button:'right'});await page.waitForTimeout(160);const pose=await page.evaluate(()=>__feelInspect());await page.mouse.move(760,430);const looked=await page.evaluate(()=>__feelInspect());assert.notEqual(looked.pitch,pose.pitch,'scoped mouse input changes actual shot pitch');assert.notEqual(looked.a,pose.a,'scoped mouse input still turns');await page.screenshot({path:path.join(output,'marksman-look.png')});
   await page.keyboard.press('r');await page.waitForTimeout(160);assert.equal((await page.evaluate(()=>__feelInspect())).aiming,false,'reload leaves scoped aiming');await page.screenshot({path:path.join(output,'marksman-reload.png')});await page.waitForTimeout(2300);const reloaded=await page.evaluate(()=>__feelInspect());assert.equal(reloaded.ammo,10);assert.equal(reloaded.aiming,true,'held RMB re-enters scope after reload');await page.mouse.up({button:'right'});
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
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}),phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(String(e)));await instrumentController(phone);await phone.goto(url);await phone.locator('[data-kit="marksman"]').tap();await phone.locator('#deploy').tap();await phone.locator('#tAim').tap();await phone.waitForTimeout(180);assert.equal((await phone.evaluate(()=>__feelInspect())).view.scoped,true);await phone.screenshot({path:path.join(output,'marksman-portrait-ads.png')});
 const cdp=await mobile.newCDPSession(phone),stick=await phone.locator('#stick').boundingBox(),fire=await phone.locator('#tFire').boundingBox(),points=[{id:1,x:stick.x+stick.width/2,y:stick.y+stick.height/2},{id:2,x:230,y:360},{id:3,x:fire.x+fire.width/2,y:fire.y+fire.height/2}],before=await phone.evaluate(()=>__feelInspect());await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});points[0].x+=15;points[0].y-=25;points[1].x+=15;points[1].y-=8;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points});await phone.waitForTimeout(350);const moved=await phone.evaluate(()=>__feelInspect());assert.ok(moved.view.scoped&&moved.ammo<before.ammo&&Math.hypot(moved.x-before.x,moved.y-before.y)>.2&&moved.pitch>before.pitch,'portrait sniper scope preserves move/look/fire and angular pitch');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.slice(2)});assert.equal((await phone.evaluate(()=>__feelInspect())).firing,false);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.slice(0,2)});await phone.screenshot({path:path.join(output,'marksman-portrait-moving.png')});await cdp.detach();await mobile.close();
}
(async()=>{
 const output=process.env.BROWSER_EVIDENCE_DIR||await fs.mkdtemp(path.join(os.tmpdir(),'war-dizzles-browser-'));
 await fs.mkdir(output,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/DubDizzles/`;
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(url);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);
  await page.screenshot({path:path.join(output,'desktop-menu.png'),fullPage:true});await page.locator('#deploy').click();await page.waitForTimeout(300);
  assert.equal(await page.locator('#stick').isVisible(),false,'fine-pointer desktop must retain mouse mode');
  await page.screenshot({path:path.join(output,'desktop-game.png')});await page.keyboard.press('Space');await page.keyboard.press('r');await page.waitForTimeout(2200);assert.equal(await page.locator('#ammo').textContent(),'24');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#overlay').isVisible(),true);assert.equal(await page.locator('#hud').evaluate(el=>el.inert),true);
  for(let i=0;i<5;i++){await page.keyboard.press('Tab');assert.ok(['resume','backMenu'].includes(await page.evaluate(()=>document.activeElement.id)));}
  await page.locator('#backMenu').click();await page.reload();await context.setOffline(true);await page.reload();await page.locator('#deploy').click();assert.equal(await page.locator('#hud').isVisible(),true);
  assert.deepEqual(await page.evaluate(async()=>{const manifest=await fetch('./manifest.webmanifest').then(r=>r.json());return Promise.all(manifest.icons.map(async icon=>({src:icon.src,ok:(await fetch(icon.src)).ok})));}),[{src:'./icon-192.png',ok:true},{src:'./icon-512.png',ok:true},{src:'./icon.svg',ok:true}]);await context.close();
  for(const [name,width,height]of [['portrait',390,844],['landscape',844,390],['narrow',320,740]]){
   const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await instrumentController(p);await p.goto(url);
   await p.screenshot({path:path.join(output,name+'-menu.png'),fullPage:true});await p.locator('#deploy').tap();await p.waitForTimeout(200);
   for(const id of ['tFire','tAim','tReload','tBuild','tUse','tGrenade','pause']){const b=await p.locator('#'+id).boundingBox();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,`${name} ${id} is within viewport`);assert.ok(b.width>=44&&b.height>=44,`${name} ${id} meets touch target size`);}
   await p.locator('#tFire').tap();await p.waitForTimeout(100);assert.ok(Number(await p.locator('#ammo').textContent())<24,'touch tap fires');
   if(name==='landscape'){
    await p.locator('#tAim').tap();await p.waitForTimeout(160);assert.equal((await p.evaluate(()=>__feelInspect())).aiming,true);
    const cdp=await c.newCDPSession(p),stick=await p.locator('#stick').boundingBox(),fire=await p.locator('#tFire').boundingBox();
    const points=[{id:1,x:stick.x+stick.width/2,y:stick.y+stick.height/2},{id:2,x:width*.55,y:height*.4},{id:3,x:fire.x+fire.width/2,y:fire.y+fire.height/2}];
    const before=Number(await p.locator('#ammo').textContent()),pose=await p.evaluate(()=>__feelInspect());await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
    points[0].y-=25;points[1].x+=30;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points});await p.waitForTimeout(400);assert.ok(Number(await p.locator('#ammo').textContent())<before,'three simultaneous fingers can move/look/fire');const moved=await p.evaluate(()=>__feelInspect());assert.ok(moved.aiming&&Math.hypot(moved.x-pose.x,moved.y-pose.y)>.2&&Math.abs(moved.a-pose.a)>.01,'touch ADS preserves actual movement and look');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.slice(2)});await p.waitForTimeout(100);const released=await p.locator('#ammo').textContent();await p.waitForTimeout(300);assert.equal(await p.locator('#ammo').textContent(),released,'lifting fire finger stops fire independently');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.slice(0,2)});await cdp.detach();
   }
   await p.screenshot({path:path.join(output,name+'-game.png')});await p.locator('#pause').tap();assert.equal(await p.locator('#overlay').isVisible(),true);await c.close();
  }
  await feelGauntlet(browser,url,output,errors);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',browser:browser.version(),scenarios:['desktop deploy/fire/reload/pause/focus','offline reload/deploy','390x844, 844x390 and 320x740 touch layout/fire/pause','three-finger touch ownership','all weapons: actual captured mouse chords, ADS walk/strafe/fire, sniper optic and magnification'],errors,evidence:output},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;}).finally(()=>clearTimeout(deadline));
