'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os'),{once}=require('node:events');
const {createServer}=require(path.join(process.env.JO9_REFERENCE_SOURCE||__dirname,'serve.cjs'));
test('private ideas API persists, rejects conflicts/foreign writes, exports portable JSON',async t=>{
 const root=process.env.JO9_TEST_TMP||os.tmpdir();fs.mkdirSync(root,{recursive:true});const dir=fs.mkdtempSync(path.join(root,'reference-api-'));fs.writeFileSync(path.join(dir,'jo9-reference.html'),'<title>test</title>');const server=createServer({root:dir});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(async()=>{await new Promise(r=>server.close(r));a(path.resolve(dir).startsWith(path.resolve(root)+path.sep));a(!fs.lstatSync(dir).isSymbolicLink());fs.rmSync(dir,{recursive:true,force:true});});const base='http://127.0.0.1:'+server.address().port;
 const get=async suffix=>(await fetch(base+suffix)).json();
 const post=(suffix,value,headers={})=>fetch(base+suffix,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(value)});
 const status=await get('/api/status');a.equal(status.app,'jo9-game-reference');a.equal(status.apiVersion,2);
 const initial=await get('/api/ideas');a.equal(initial.items.length,0);a(initial.storagePath.endsWith(path.join('runtime','ideas.json')));
 let r=await post('/api/ideas',{revision:initial.revision,item:{kind:'items',title:'개인 아이템',description:'<img onerror=bad>\n둘째줄'}});a.equal(r.status,200);const saved=await r.json();a.equal(saved.items[0].description,'<img onerror=bad>\n둘째줄');a.equal((await get('/api/ideas')).items.length,1);
 r=await post('/api/ideas',{revision:initial.revision,item:{kind:'traits',title:'다른 창'}});a.equal(r.status,409);
 r=await post('/api/ideas',{revision:saved.revision,item:{kind:'spells',title:'외부 쓰기'}},{Origin:'https://example.invalid'});a.equal(r.status,403);a.equal((await get('/api/ideas')).items.length,1);
 r=await post('/api/ideas/import',{revision:saved.revision,document:{schema:1,items:saved.items}});a.equal(r.status,200);const imported=await r.json();a.equal(imported.added,0);
 const exported=await get('/api/ideas/export');a.equal(exported.schema,1);a.equal(exported.items.length,1);a(!('storagePath' in exported));
 r=await post('/api/ideas/delete',{revision:imported.revision,id:saved.items[0].id});a.equal(r.status,200);a.equal((await r.json()).items.length,0);
 r=await post('/api/ideas',{revision:(await get('/api/ideas')).revision,item:{kind:'wrong',title:'bad'}});a.equal(r.status,400);
 a.equal((await fetch(base+'/../ideas.json')).status,404);
});
