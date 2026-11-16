'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const base=process.env.JO9_FRAME_TEST_TOOLS||__dirname,gameRoot=process.env.JO9_FRAME_GAME_ROOT||'G:/somi/Jack O Nine Tails v2.4_work/game';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function png(){const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});const chunk=(tag,data)=>{const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(tag,4);data.copy(b,8);let v=0xffffffff;for(const p of b.subarray(4,8+data.length))v=table[(v^p)&255]^(v>>>8);b.writeUInt32BE((v^0xffffffff)>>>0,8+data.length);return b;};const header=Buffer.alloc(13);header.writeUInt32BE(151);header.writeUInt32BE(150,4);header[8]=8;header[9]=6;const row=Buffer.alloc(151*4+1);for(let i=0;i<151;i++)row.set([40,90,130,255],1+i*4);return Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(Buffer.concat(Array(150).fill(row)))),chunk('IEND',Buffer.alloc(0))]);}
test('HTTP portrait preview/apply validates authorization and versions, backs up the fixture and leaves QSP/JSON untouched',async()=>{
 const f=require(base+'/dialogue-image-fixture.cjs').create(),tools=f.home+'/project/tools/text-workshop',original=f.home+'/original';fs.mkdirSync(tools,{recursive:true});fs.mkdirSync(original+'/content/pic',{recursive:true});fs.mkdirSync(f.game+'/json/slaves',{recursive:true});fs.mkdirSync(f.game+'/content/pic/girls/face',{recursive:true});
 for(const file of fs.readdirSync(base).filter(n=>n.endsWith('.cjs')&&!n.endsWith('.test.cjs')).concat(['index.html','apply_mods.ps1','portrait-frame.py']))fs.copyFileSync(base+'/'+file,tools+'/'+file);
 const target=f.game+'/content/pic/girls/face/test.png',before=png();fs.writeFileSync(target,before);
 for(const suffix of ['','_gray','_sepia'])fs.copyFileSync(gameRoot+'/content/pic/girls/face/0001_black_long_loli'+suffix+'.png',f.game+'/content/pic/girls/face/0001_black_long_loli'+suffix+'.png');
 const json=f.game+'/json/slaves/1_test.json',raw=Buffer.from(JSON.stringify({seed_name:'TEST',fullimage:'girls/face/test',seed_ava_clear:'content/pic/girls/face/test'}));fs.writeFileSync(json,raw);
 const child=spawn(process.execPath,[tools+'/server.cjs','--game-dir',f.game,'--catalog-dir',f.catalog,'--runtime',f.runtime,'--original-dir',original,'--port','0'],{stdio:['ignore','pipe','pipe'],windowsHide:true});let errors='';child.stderr.on('data',b=>errors+=b);
 try{
  const ready=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error(errors||'fixture startup timeout')),15000);child.once('exit',()=>{clearTimeout(timer);reject(Error(errors));});child.stdout.on('data',b=>{text+=b;if(text.includes('\n')){clearTimeout(timer);resolve(JSON.parse(text.trim()));}});});
  const html=await(await fetch(ready.url)).text(),token=html.match(/const token='([a-f0-9]+)'/)[1];
  const request={id:1,field:'seed_ava_clear',expectedHash:sha(raw)};
  const selection=v=>Object.fromEntries(['id','field','expectedHash','path','before','after','frameHash'].map(k=>[k,v[k]]));
  const api=async(action,value,auth=true,origin)=>{const response=await fetch(ready.url+'api/catalog/portrait-frame/'+action,{method:'POST',headers:{'Content-Type':'application/json',...(auth?{'X-JO9-Token':token}:{}),...(origin?{Origin:origin}:{})},body:JSON.stringify(value)});return{status:response.status,value:await response.json()};};
  a.equal((await api('preview',request,false)).status,403);a.equal((await api('preview',request,true,'https://invalid.example')).status,403);
  const view=await api('preview',request);a.equal(view.status,200,JSON.stringify(view.value));a(view.value.changed);a.equal(view.value.width,151);a.deepEqual(fs.readFileSync(target),before);a(!fs.existsSync(f.game+'/content/pic/__JO9_ImageBackups'));
  fs.appendFileSync(json,' ');a.equal((await api('apply',{...selection(view.value),confirmed:true})).status,400);a.deepEqual(fs.readFileSync(target),before);fs.writeFileSync(json,raw);
  const saved=await api('apply',{...selection(view.value),confirmed:true});a.equal(saved.status,200,JSON.stringify(saved.value));a.equal(saved.value.operation,'portrait-frame');a.equal(sha(fs.readFileSync(target)),view.value.after);
  const backup=path.join(f.game,'content/pic/__JO9_ImageBackups',saved.value.id,'original/girls/face/test.png');a.deepEqual(fs.readFileSync(backup),before);
  const second=await api('preview',request);a.equal(second.value.changed,false);a.equal(second.value.frameState,'framed');const unchanged=await api('apply',selection(second.value));a.equal(unchanged.value.status,'unchanged');a.equal(fs.readdirSync(f.game+'/content/pic/__JO9_ImageBackups').length,1);
  a.deepEqual(fs.readFileSync(json),raw);a.deepEqual(fs.readFileSync(f.game+'/jack.qsp'),f.raw);
 }finally{child.kill();if(child.exitCode===null)await new Promise(resolve=>child.once('exit',resolve));const resolved=path.resolve(f.home),safeRoot=path.resolve('G:/Codex/tmp/dialogue-image-20261108')+path.sep;a(resolved.startsWith(safeRoot));a(!fs.lstatSync(resolved).isSymbolicLink());fs.rmSync(resolved,{recursive:true});}
});
