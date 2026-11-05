import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
function worker(fail=false){const handlers={},calls=[];const self={location:'https://example.test/DubDizzles/sw.js',addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:async()=>calls.push('activate-ready'),clients:{claim:async()=>calls.push('claim')}};self.location=new URL(self.location);const cache={addAll:async requests=>{calls.push('cache');assert.ok(requests.every(r=>r.cache==='reload'));if(fail)throw new Error('offline');},match:async()=>null};vm.runInNewContext(source,{self,caches:{open:async()=>cache,keys:async()=>['another-app-v1','dub-dizzles-v5','dub-dizzles-v7'],delete:async key=>calls.push(key)},URL,Request:class{constructor(url,options){this.url=url;Object.assign(this,options);}},fetch:async()=>null});return {handlers,calls};}
test('worker activates only after the complete refreshed bundle is cached',async()=>{const w=worker();let pending;w.handlers.install({waitUntil:p=>pending=p});await pending;assert.deepEqual(w.calls,['cache','activate-ready']);});
test('a failed bundle install does not activate the incomplete update',async()=>{const w=worker(true);let pending;w.handlers.install({waitUntil:p=>pending=p});await assert.rejects(pending,/offline/);assert.deepEqual(w.calls,['cache']);});
test('activation removes only older game caches and claims without forced reload',async()=>{const w=worker();let pending;w.handlers.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(w.calls,['dub-dizzles-v5','claim']);});
