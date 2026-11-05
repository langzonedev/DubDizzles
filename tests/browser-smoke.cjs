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
   const c=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));await p.goto(url);
   await p.screenshot({path:path.join(output,name+'-menu.png'),fullPage:true});await p.locator('#deploy').tap();await p.waitForTimeout(200);
   for(const id of ['tFire','tAim','tReload','tBuild','tUse','tGrenade','pause']){const b=await p.locator('#'+id).boundingBox();assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,`${name} ${id} is within viewport`);assert.ok(b.width>=44&&b.height>=44,`${name} ${id} meets touch target size`);}
   await p.locator('#tFire').tap();await p.waitForTimeout(100);assert.ok(Number(await p.locator('#ammo').textContent())<24,'touch tap fires');
   if(name==='landscape'){
    const cdp=await c.newCDPSession(p),stick=await p.locator('#stick').boundingBox(),fire=await p.locator('#tFire').boundingBox();
    const points=[{id:1,x:stick.x+stick.width/2,y:stick.y+stick.height/2},{id:2,x:width*.55,y:height*.4},{id:3,x:fire.x+fire.width/2,y:fire.y+fire.height/2}];
    const before=Number(await p.locator('#ammo').textContent());await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
    points[0].y-=25;points[1].x+=30;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points});await p.waitForTimeout(400);assert.ok(Number(await p.locator('#ammo').textContent())<before,'three simultaneous fingers can move/look/fire');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.slice(2)});await p.waitForTimeout(100);const released=await p.locator('#ammo').textContent();await p.waitForTimeout(300);assert.equal(await p.locator('#ammo').textContent(),released,'lifting fire finger stops fire independently');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:points.slice(0,2)});await cdp.detach();
   }
   await p.screenshot({path:path.join(output,name+'-game.png')});await p.locator('#pause').tap();assert.equal(await p.locator('#overlay').isVisible(),true);await c.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'PASS',browser:browser.version(),scenarios:['desktop deploy/fire/reload/pause/focus','offline reload/deploy','390x844, 844x390 and 320x740 touch layout/fire/pause','three-finger touch ownership'],errors,evidence:output},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;}).finally(()=>clearTimeout(deadline));
