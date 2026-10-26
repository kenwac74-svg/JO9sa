'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process');
const core=require('./core.cjs');

function fixture(extra='') {
  const rows=Array.from({length:235},(_,i)=>`*pl '사과 ${String(i).padStart(3,'0')}, 사과!'`).join('\n');
  const locations=[['묶음',rows+extra],['다른 위치',"*pl '사과 밖의 문장.'\n*pl '다른 사과 문장.'\n$path='content/pic/apple.png'"]];
  const lines=['QSPGAME','header','',core.shift(String(locations.length),-5)];
  for(const [name,body] of locations)lines.push(core.shift(name,-5),'',core.shift(body,-5),core.shift('0',-5));
  lines.push('');return Buffer.from(lines.join('\r\n'),'utf16le');
}
async function launch(t) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jo9-batch-api-')),game=path.join(dir,'game'),runtime=path.join(dir,'runtime');
  fs.mkdirSync(game);fs.writeFileSync(path.join(game,'jack.qsp'),fixture());
  const child=spawn(process.execPath,[path.join(__dirname,'server.cjs'),'--game-dir',game,'--runtime',runtime,'--catalog-dir',path.join(dir,'catalog'),'--original-dir',path.join(dir,'original')],{stdio:['ignore','pipe','pipe']});
  let errors='';child.stderr.on('data',b=>errors+=b);
  t.after(async()=>{if(child.exitCode===null){const done=new Promise(resolve=>child.once('exit',resolve));child.kill();await done;}fs.rmSync(dir,{recursive:true,force:true});});
  const ready=await new Promise((resolve,reject)=>{
    let out='';const timer=setTimeout(()=>reject(Error(errors||'server startup timeout')),15000);
    child.once('exit',()=>{clearTimeout(timer);reject(Error(errors||'server exited'));});
    child.stdout.on('data',b=>{out+=b;if(out.includes('\n')){clearTimeout(timer);resolve(JSON.parse(out.trim()));}});
  });
  const html=await(await fetch(ready.url)).text(),token=html.match(/const token='([a-f0-9]+)'/)[1];
  const request=async(route,data,headers={})=>{
    const response=await fetch(ready.url+route,{method:data===undefined?'GET':'POST',headers:{'X-JO9-Token':token,...(data===undefined?{}:{'Content-Type':'application/json'}),...headers},body:data===undefined?undefined:JSON.stringify(data)});
    return {status:response.status,value:await response.json()};
  };
  return {dir,game,runtime,target:path.join(game,'jack.qsp'),request,url:ready.url};
}
const query=(offset=0)=>'api/batch/search?q='+encodeURIComponent('사과')+'&location='+encodeURIComponent('묶음')+'&offset='+offset+'&limit=50';
const scope=search=>({hash:search.hash,query:search.query,location:search.location,mode:search.mode});
function replay(before,mod) {
  const doc=core.parse(before);
  for(const edit of mod.edits){
    const loc=doc.locations.find(l=>l.name===edit.location),index=loc[edit.field],old=core.shift(doc.lines[index],5);
    assert.equal(old.split(edit.old).length-1,1,'each exported edit has unique context at replay time');
    doc.lines[index]=core.shift(old.replace(edit.old,()=>edit.new),-5);
  }
  return core.serialize(doc);
}

test('batch subset preview writes nothing; one approved transaction exports replayable edits and restores exactly',async t=>{
  const app=await launch(t),before=fs.readFileSync(app.target);
  const first=await app.request(query()),last=await app.request(query(200));
  assert.equal(first.status,200);assert.equal(first.value.total,235);assert.equal(first.value.occurrences,470);assert.equal(first.value.results.length,50);
  assert.equal(last.value.results.length,35);
  const ids=[first.value.results[0].id,last.value.results[34].id];
  const prepared=await app.request('api/batch/preview',{...scope(first.value),selection:{all:false,ids},replacement:'배$&'});
  assert.equal(prepared.status,200);assert.equal(prepared.value.count,2);assert.equal(prepared.value.occurrences,4);assert.equal(prepared.value.changes.length,2);
  assert.equal(prepared.value.before,core.hash(before));assert.notEqual(prepared.value.after,prepared.value.before);
  assert.ok(prepared.value.changes.every(c=>c.new.includes('배$&')&&!c.new.includes('사과')));
  assert.deepEqual(fs.readFileSync(app.target),before);assert.deepEqual(fs.readdirSync(path.join(app.runtime,'backups')),[]);
  assert.equal((await app.request('api/apply',{id:prepared.value.id,approved:false})).status,400);
  assert.equal((await app.request('api/apply',{id:'forged',approved:true})).status,400);
  const applied=await app.request('api/apply',{id:prepared.value.id,approved:true});assert.equal(applied.status,200);
  assert.equal(applied.value.kind,'batch');assert.equal(applied.value.count,2);assert.equal(applied.value.occurrences,4);
  const after=fs.readFileSync(app.target),entries=core.entries(core.parse(after));
  assert.equal(entries.filter(e=>e.text.includes('배$&')).length,2);assert.equal(entries.filter(e=>e.location==='묶음'&&e.text.includes('사과')).length,233);
  const files=fs.readdirSync(path.join(app.runtime,'backups'));assert.equal(files.filter(n=>n.endsWith('.qsp')).length,1);assert.equal(files.filter(n=>n.endsWith('.json')).length,1);
  const exported=await app.request('api/export?id='+applied.value.id);assert.equal(exported.status,200);assert.ok(exported.value.edits.length>=1);
  assert.equal(exported.value.before_sha256,core.hash(before).toUpperCase());assert.equal(exported.value.after_sha256,core.hash(after).toUpperCase());
  const beforeDoc=core.parse(before);
  assert.equal(exported.value.edits.length,1,'multiple selections in one field share one replayable fragment');
  assert.ok(exported.value.edits.every(e=>{const loc=beforeDoc.locations.find(l=>l.name===e.location);return e.count===1&&e.old.length<=core.shift(beforeDoc.lines[loc[e.field==='desc'?'desc':'body']],5).length;}));
  assert.deepEqual(replay(before,exported.value),after);
  assert.equal((await app.request('api/apply',{id:prepared.value.id,approved:true})).status,400,'a consumed preview cannot apply twice');
  assert.equal((await app.request('api/restore',{id:applied.value.id})).status,200);assert.deepEqual(fs.readFileSync(app.target),before);
});

test('whole query selection spans more than 200 matches and honours a deselected entry from a later page',async t=>{
  const app=await launch(t),before=fs.readFileSync(app.target),first=(await app.request(query())).value,page=(await app.request(query(50))).value;
  assert.equal(first.total,235);assert.equal(page.offset,50);assert.notEqual(page.results[7].id,first.results[7].id);
  const except=page.results[7].id,prepared=await app.request('api/batch/preview',{...scope(first),selection:{all:true,except:[except]},replacement:'배'});
  assert.equal(prepared.status,200);assert.equal(prepared.value.count,234);assert.equal(prepared.value.occurrences,468);assert.equal(prepared.value.totalChanges,234);assert.equal(prepared.value.changes.length,50);
  const review=await app.request('api/batch/preview?id='+prepared.value.id+'&offset=200&limit=50');assert.equal(review.status,200);assert.equal(review.value.totalChanges,234);assert.equal(review.value.changes.length,34);assert.equal(review.value.offset,200);
  assert.deepEqual(fs.readFileSync(app.target),before);
  assert.equal((await app.request('api/apply',{id:prepared.value.id,approved:true})).status,200);
  const entries=core.entries(core.parse(fs.readFileSync(app.target)));
  assert.equal(entries.filter(e=>e.location==='묶음'&&e.text.includes('배')).length,234);
  assert.deepEqual(entries.filter(e=>e.location==='묶음'&&e.text.includes('사과')).map(e=>e.text),['사과 057, 사과!']);
  assert.deepEqual(entries.filter(e=>e.location==='다른 위치').map(e=>e.text),['사과 밖의 문장.','다른 사과 문장.','content/pic/apple.png']);
});

test('batch routes require the session token, same origin, current hash and valid selection',async t=>{
  const app=await launch(t),before=fs.readFileSync(app.target),found=(await app.request(query())).value;
  assert.equal((await fetch(app.url+query())).status,403);
  assert.equal((await app.request(query(),undefined,{Origin:'https://evil.example'})).status,403);
  const payload={...scope(found),selection:{all:false,ids:[found.results[0].id]},replacement:''};
  assert.equal((await app.request('api/batch/preview',payload,{'X-JO9-Token':'forged'})).status,403);
  assert.equal((await app.request('api/batch/preview',payload,{Origin:'null'})).status,403);
  assert.equal((await app.request('api/batch/preview',{...payload,hash:'bad-hash'})).status,400);
  assert.equal((await app.request('api/batch/preview',{...payload,selection:{all:false,ids:['999:0:1']}})).status,400);
  const prepared=await app.request('api/batch/preview',payload);assert.equal(prepared.status,200);assert.equal(prepared.value.changes[0].new,' 000, !');
  assert.equal((await app.request('api/batch/preview?id=forged')).status,400);
  fs.writeFileSync(app.target,fixture("\n*pl '외부에서 추가한 문장.'"));
  assert.equal((await app.request('api/apply',{id:prepared.value.id,approved:true})).status,400);
  assert.deepEqual(fs.readdirSync(path.join(app.runtime,'backups')),[]);
  assert.notDeepEqual(fs.readFileSync(app.target),before);
});

test('legacy single dialogue preview and apply still use the existing path',async t=>{
  const app=await launch(t),found=(await app.request('api/search?q='+encodeURIComponent('사과 000'))).value;
  const prepared=await app.request('api/preview',{selection:found.results[0],replacement:'단일 문구 수정.'});assert.equal(prepared.status,200);assert.equal(prepared.value.operation,'edit');
  const applied=await app.request('api/apply',{id:prepared.value.id,approved:true});assert.equal(applied.status,200);assert.equal(applied.value.kind,'edit');assert.equal(applied.value.selection.text,'단일 문구 수정.');
});

test('batch search caps responses at 50 without limiting the full query count',async t=>{
  const app=await launch(t),page=await app.request(query().replace('limit=50','limit=500'));
  assert.equal(page.status,200);assert.equal(page.value.total,235);assert.equal(page.value.limit,50);assert.equal(page.value.results.length,50);
  assert.equal((await app.request(query().replace('limit=50','limit=0'))).status,400);
  assert.equal((await app.request(query().replace('offset=0','offset=-1'))).status,400);
});
