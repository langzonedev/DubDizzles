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
const deadline=setTimeout(()=>{console.error('Laptop smoke exceeded 60 seconds');process.exit(1);},60000);
(async()=>{
 const output=process.env.BROWSER_EVIDENCE_DIR||await fs.mkdtemp(path.join(os.tmpdir(),'dub-dizzles-laptop-'));await fs.mkdir(output,{recursive:true});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{channel:'chromium'})});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.route('**/app.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+`

   globalThis.__captureRequests=[];const qaRequestPointerLock=canvas.requestPointerLock.bind(canvas);canvas.requestPointerLock=options=>{__captureRequests.push({raw:options?.unadjustedMovement===true});return qaRequestPointerLock(options);};
   globalThis.__laptopInspect=()=>({x:game.player.x,y:game.player.y,a:game.player.a,pitch:game.player.pitch,aiming:game.aiming,firing,triggerLatch,cruise,cruiseMove:{...cruiseMove},keys:[...keys],ammo:game.ammo,time:game.time,state,lock:document.pointerLockElement?.id,inputCheckActive,inputCheckCounts:{...inputCheckCounts},captureRequests:[...__captureRequests]});
   globalThis.__crateFixture=async()=>{const {Renderer}=await import('./renderer.js');const c=document.createElement('canvas');c.style='position:fixed;inset:0;width:100vw;height:100vh;z-index:10000';document.body.append(c);const r=new Renderer(c);r.resize();const g=new Game();g.bots=[];g.supplies=[];Object.assign(g.player,{x:3.5,y:8.2,a:Math.PI/2,pitch:0});r.draw(g,1/60,true);return {x:3.5,y:8.2,a:Math.PI/2,visibleTile:g.map[10][3],crateVariant:(3*7+10*5)%r.crates.length};};`});});
  await page.goto(`http://127.0.0.1:${server.address().port}/DubDizzles/`);assert.equal(await page.locator('#inputProfile').inputValue(),'trackpad');await page.locator('summary').click();await page.locator('#checkInput').click();await page.mouse.move(400,400,{steps:4});const freeCheck=await page.evaluate(()=>__laptopInspect());await page.keyboard.down('w');await page.mouse.move(420,420,{steps:4});await page.keyboard.up('w');const heldCheck=await page.evaluate(()=>__laptopInspect());assert.ok(freeCheck.inputCheckCounts.free>0);assert.ok(heldCheck.inputCheckCounts.held>0);await page.screenshot({path:path.join(output,'input-delivery-check.png')});
  await page.locator('#deploy').click();assert.equal((await page.evaluate(()=>__laptopInspect())).inputCheckActive,false,'deploy stops optional checker');await page.waitForFunction(()=>__laptopInspect().lock==='world',null,{timeout:10000});
  const inspect=()=>page.evaluate(()=>__laptopInspect());
  // This uses actual browser mouse/keyboard input. It cannot reproduce or fix OS palm rejection.
  await page.keyboard.down('w');await page.keyboard.down('d');await page.mouse.down({button:'right'});await page.mouse.down({button:'left'});
  await page.mouse.move(720,450);const heldBefore=await inspect(),heldDirection=heldBefore.pitch>=0?1:-1;await page.mouse.move(760,450+20*heldDirection,{steps:8});
  await page.waitForFunction(time=>__laptopInspect().time-time>.18,heldBefore.time,{timeout:10000});const heldAfter=await inspect();
  assert.ok(heldAfter.aiming&&heldAfter.firing);assert.ok(heldAfter.a>heldBefore.a&&(heldAfter.pitch-heldBefore.pitch)*heldDirection<0,'delivered yaw and pitch continue with W/D/ADS/fire held');assert.ok(Math.hypot(heldAfter.x-heldBefore.x,heldAfter.y-heldBefore.y)>.1);
  await page.keyboard.up('w');await page.keyboard.up('d');await page.mouse.up({button:'left'});await page.mouse.up({button:'right'});
  for(const key of ['c','q','f'])await page.keyboard.press(key);const before=await inspect();assert.equal(before.keys.length,0);assert.ok(before.cruise&&before.triggerLatch&&before.aiming);
  await page.mouse.move(800,450+40*heldDirection,{steps:8});await page.waitForFunction(time=>__laptopInspect().time-time>.2,before.time,{timeout:10000});const after=await inspect();
  assert.equal(after.keys.length,0,'every keyboard key is released during the laptop scenario');assert.ok(after.aiming&&after.triggerLatch&&after.cruise);assert.ok(after.a>before.a&&(after.pitch-before.pitch)*heldDirection<0);assert.ok(after.ammo<before.ammo,'trigger latch fires without held keys');assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>.1,'cruise advances without held keys');
  await page.screenshot({path:path.join(output,'laptop-cruise-aim-trigger-look.png')});
  await page.keyboard.press('d');const diagonal=await inspect();assert.deepEqual(diagonal.cruiseMove,{forward:1,strafe:1});assert.equal(diagonal.keys.length,0);
  await page.keyboard.press('x');const stopped=await inspect();assert.ok(!stopped.cruise&&!stopped.triggerLatch&&!stopped.firing);await page.waitForFunction(time=>__laptopInspect().time-time>.2,stopped.time,{timeout:10000});const still=await inspect();assert.equal(still.ammo,stopped.ammo);assert.equal(still.x,stopped.x);assert.equal(still.y,stopped.y);
  await page.keyboard.press('Escape');const fixture=await page.evaluate(()=>__crateFixture());assert.equal(fixture.visibleTile,2);assert.equal(fixture.crateVariant,2);await page.screenshot({path:path.join(output,'ict-stores-crate-fixture.png')});
  // Exercise the explicit raw-mouse profile too. Capture may succeed raw or retry
  // adjusted input: either result is valid only after actual pointer lock exists.
  await page.reload();await page.locator('#inputProfile').selectOption('mouse');await page.locator('#deploy').click();await page.waitForFunction(()=>__laptopInspect().lock==='world',null,{timeout:15000});
  await page.mouse.move(720,450);await page.keyboard.down('w');await page.keyboard.down('d');await page.mouse.down({button:'right'});await page.mouse.down({button:'left'});
  const rawBefore=await inspect(),rawDirection=rawBefore.pitch>=0?1:-1;assert.ok(rawBefore.captureRequests.some(request=>request.raw),'Mouse profile requests raw capture without requiring platform support');
  await page.mouse.move(760,450+20*rawDirection,{steps:12});await page.waitForFunction(time=>__laptopInspect().time-time>.2,rawBefore.time,{timeout:15000});const rawAfter=await inspect();
  assert.equal(rawAfter.lock,'world');assert.ok(rawAfter.aiming&&rawAfter.firing);assert.ok(rawAfter.a>rawBefore.a&&(rawAfter.pitch-rawBefore.pitch)*rawDirection<0,'Mouse profile delivers continuous yaw and pitch away from pitch clamp with W/D/ADS/fire held');assert.ok(Math.hypot(rawAfter.x-rawBefore.x,rawAfter.y-rawBefore.y)>.1);assert.ok(rawAfter.ammo<rawBefore.ammo);
  await page.screenshot({path:path.join(output,'mouse-profile-held-move-aim-fire-look.png')});await page.keyboard.up('w');await page.keyboard.up('d');await page.mouse.up({button:'left'});await page.mouse.up({button:'right'});
  assert.deepEqual(errors,[]);const result={result:'PASS',evidenceKind:'local automated browser; no physical touchpad or phone claim',browser:browser.version(),freeCheck,heldCheck,heldBefore,heldAfter,before,after,diagonal,stopped,still,fixture,rawBefore,rawAfter,errors,evidence:output};await fs.writeFile(path.join(output,'laptop-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await context.close();
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;}).finally(()=>clearTimeout(deadline));
