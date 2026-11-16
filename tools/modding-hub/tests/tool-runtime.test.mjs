import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureWorkspaceTool} from '../tool-runtime.mjs';
test('image click resolves a stopped server before updating the frame address',async()=>{
 const config={tools:{workshop:'http://127.0.0.1:5290/',dialogue:'unchanged'}};let calls=0;
 const result=await ensureWorkspaceTool('workshop',config,async(path,options)=>{calls++;assert.equal(path,'/workspace/tools/ensure');assert.deepEqual(JSON.parse(options.body),{key:'workshop'});return {ok:true,json:async()=>({url:'http://127.0.0.1:6000/',reused:false})};});
 assert.deepEqual(result,{url:'http://127.0.0.1:6000/',reused:false});assert.equal(config.tools.dialogue,'unchanged');assert.equal(calls,1);
});
test('a restarted server on the same port still requests an iframe reload',async()=>{
 const config={tools:{imageReview:'http://127.0.0.1:11332/'}};
 const r=await ensureWorkspaceTool('imageReview',config,async()=>({ok:true,json:async()=>({url:config.tools.imageReview,reused:false})}));assert.equal(r.reused,false);
});
test('other tools retain their existing behavior',async()=>{
 assert.deepEqual(await ensureWorkspaceTool('dialogue',{tools:{dialogue:'same'}},()=>assert.fail('not managed')),{url:'same',reused:true});
});
test('startup errors preserve the previous address',async()=>{
 const config={tools:{workshop:'http://127.0.0.1:5290/'}};
 await assert.rejects(ensureWorkspaceTool('workshop',config,async()=>({ok:false,json:async()=>({error:'start failed'})})),/start failed/);assert.equal(config.tools.workshop,'http://127.0.0.1:5290/');
});
test('external redirects are rejected',async()=>{
 await assert.rejects(ensureWorkspaceTool('workshop',{tools:{}},async()=>({ok:true,json:async()=>({url:'https://example.com/',reused:false})})),/주소/);
});
test('repeated clicks share one startup and preserve the fresh-server signal',async()=>{
 const config={tools:{imageReview:'http://127.0.0.1:11332/'}};let release,calls=0;
 const wait=new Promise(resolve=>release=resolve);
 const request=async()=>{calls++;await wait;return {ok:true,json:async()=>({url:config.tools.imageReview,reused:false})};};
 const a=ensureWorkspaceTool('imageReview',config,request),b=ensureWorkspaceTool('imageReview',config,request);release();
 const results=await Promise.all([a,b]);assert.equal(calls,1);assert(results.every(r=>r.reused===false));
});
