'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=process.env.JO9_TEXT_ROOT||(fs.existsSync(path.join(__dirname,'character-image-links.cjs'))?__dirname:'G:/somi/JO9sa/tools/text-workshop');
const links=require(path.join(root,'character-image-links.cjs')),catalogModule=require(path.join(root,'catalog.cjs'));
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAOElEQVR4nO3QsREAMAgDMUJJTZ39twyXKWjkBd6nU31fLC434w4QIECAAAECBAgQIECAAAECX2AA6DMBe1+fSFcAAAAASUVORK5CYII=','base64');
function fixture(t){
 const base=process.env.JO9_DISCOVERY_TMP||'G:/Codex/tmp/jo9-json-character-discovery-20261111/backend';fs.mkdirSync(base,{recursive:true});const home=fs.mkdtempSync(path.join(base,'fixture-')),game=path.join(home,'game'),catalog=path.join(home,'catalog'),jsonDir=path.join(game,'json/slaves');
 fs.mkdirSync(jsonDir,{recursive:true});fs.mkdirSync(path.join(game,'content/pic/characters'),{recursive:true});fs.mkdirSync(catalog);fs.writeFileSync(path.join(game,'content/pic/characters/pick.png'),png);
 fs.writeFileSync(path.join(game,'json/slave_index.json'),JSON.stringify({young_first:1,young_last:1440,milf_first:2000,milf_last:2300}));
 fs.writeFileSync(path.join(catalog,'catalog_merge_vs_original.html'),'var D=[];\nvar MR=[];\n<script>window.JO9_GIRLS_CHECKLIST={"characters":[{"id":1}]};</script>');
 fs.writeFileSync(path.join(catalog,'catalog_status.js'),'window.CATALOG_STATUS={"items":{"kept.png":["done"]},"characterItems":{"1":["wip"]},"memo":"keep"};\n');
 const put=(name,obj)=>fs.writeFileSync(path.join(jsonDir,name),typeof obj==='string'?obj:JSON.stringify(obj,null,2));
 put('3040_chunhyang.json',{seed_name:'춘향',fullimage:'characters/pick',seed_beauty:4});put('numberless friend.json',{seed_name:'번호 없는 인물',fullimage:'characters/pick',seed_world_description:'보존할 설정'});
 t.after(()=>{const full=path.resolve(home);a(full.startsWith(path.resolve(base)+path.sep));a(!fs.lstatSync(full).isSymbolicLink());fs.rmSync(full,{recursive:true});});
 return{game,catalog,jsonDir,put,api:links.create(game,catalog)};
}
test('full discovery includes newly added numbered and numberless JSON; invalid JSON is isolated',t=>{
 const f=fixture(t);f.put('bad.json','{');f.put('array.json',[]);f.put('Other.JSON',{seed_name:'대문자 확장자'});
 const result=f.api.read(),chun=result.characters.find(c=>c.id===3040),named=result.characters.find(c=>c.id==='json:numberless friend.json');
 a(chun);a.equal(chun.characterNumber,3040);a(named);a.equal(named.characterNumber,null);a.equal(named.name,'번호 없는 인물');a.equal(named.json,'json/slaves/numberless friend.json');a(result.characters.some(c=>c.id==='json:Other.JSON'));
 a.equal(result.errors.length,2);a(result.errors.some(e=>e.json==='json/slaves/bad.json'));a(result.errors.some(e=>e.json==='json/slaves/array.json'));a.deepEqual(new Set(f.api.ids()),new Set([3040,'json:numberless friend.json','json:Other.JSON']));
 f.put('fresh.json',{seed_name:'다음 추가'});a(f.api.read().characters.some(c=>c.id==='json:fresh.json'));
});
test('numberless image links preserve unrelated JSON and safe backup filenames',t=>{
 const f=fixture(t),id='json:numberless friend.json',original=fs.readFileSync(path.join(f.jsonDir,'numberless friend.json'));
 const c=f.api.read([id]).characters[0],saved=f.api.apply({id,field:'indpack_maid',path:'characters/pick.png',expectedHash:c.jsonSha256}),after=JSON.parse(fs.readFileSync(path.join(f.jsonDir,'numberless friend.json')));
 a.equal(after.indpack_maid,'characters/pick');a.equal(after.fullmade,'characters/pick');a.equal(after.seed_world_description,'보존할 설정');a.equal(saved.character.id,id);a(fs.existsSync(saved.backup));a.deepEqual(fs.readFileSync(saved.backup),original);a(!path.basename(saved.backup).includes(':'));
 const bytes=fs.readFileSync(path.join(f.jsonDir,'numberless friend.json'));
 for(const bad of ['json:../outside.json','json:..\\outside.json','json:nope.json','3040',-1])a.throws(()=>f.api.read([bad]));
 a.deepEqual(fs.readFileSync(path.join(f.jsonDir,'numberless friend.json')),bytes);
});
test('duplicate numeric prefixes are each discoverable by file identity but numeric lookup stays ambiguous',t=>{
 const f=fixture(t);f.put('3040_variant.json',{seed_name:'분기 인물'});const result=f.api.read();
 for(const name of ['3040_chunhyang.json','3040_variant.json']){const c=result.characters.find(c=>c.id==='json:'+name);a(c);a.equal(c.characterNumber,3040);}
 a.throws(()=>f.api.read([3040]),/중복/);a.equal(f.api.read(['json:3040_variant.json']).characters[0].name,'분기 인물');
});
test('current JSON discoveries can save independent tags without regenerating the embedded manifest',t=>{
 const f=fixture(t),store=catalogModule.create(f.catalog,{characterIds:()=>f.api.ids()}),before=store.snapshot();
 const saved=store.update([{characterId:3040,flag:'done',checked:true,expected:false},{characterId:'json:numberless friend.json',flag:'todo',checked:true,expected:false}]);
 a.deepEqual(saved.characterItems['3040'],['done']);a.deepEqual(saved.characterItems['json:numberless friend.json'],['todo']);a.deepEqual(saved.characterItems['1'],['wip']);a.deepEqual(saved.items,before.items);a.equal(saved.memo,'keep');
 const bytes=fs.readFileSync(path.join(f.catalog,'catalog_status.js'));
 for(const id of ['json:nope.json','json:../escape.json','3040',Number.MAX_SAFE_INTEGER+1])a.throws(()=>store.update([{characterId:id,flag:'done',checked:true,expected:false}]),/캐릭터 ID/);
 a.deepEqual(fs.readFileSync(path.join(f.catalog,'catalog_status.js')),bytes);
});
test('portrait preview accepts a discovered numberless character identity',()=>{
 const id='json:named.json',service=require(path.join(root,'character-portrait-frame.cjs')).create({read(){return{characters:[{id,jsonSha256:'sha',refs:{seed_ava_clear:'characters/pick.png'}}]};},resolve(p){return{path:p,bytes:Buffer.from(p)};}},{apply(){throw Error('preview must not write');}},{processor:{composePortraitFrame(){return{pngBytes:Buffer.from('preview'),width:150,height:150,status:'unframed',changed:true,centerPixelsPreserved:true};}}});
 a.equal(service.preview({id,field:'seed_ava_clear',expectedHash:'sha'}).id,id);
});
test('complete discovery isolates an invalid only JSON and preserves safe numeric generation metadata',t=>{
 const f=fixture(t);for(const name of fs.readdirSync(f.jsonDir))fs.unlinkSync(path.join(f.jsonDir,name));f.put('only.json',null);a.equal(f.api.read().errors.length,1);a.equal(f.api.read().characters.length,0);
 f.put('1462_new.json',{seed_name:'신규 풀 캐릭터'});a.equal(f.api.read([1462]).characters[0].random,true);f.put('1448_exclusive.json',{});a.equal(f.api.read([1448]).characters[0].random,false);
 f.put('9007199254740992_large.json',{});const c=f.api.read(['json:9007199254740992_large.json']).characters[0];a.equal(c.characterNumber,null);a.equal(c.random,false);
});
test('real HTTP API discovers added files, saves numberless links/tags and rejects stale or unsafe writes',async t=>{
 const f=fixture(t),core=require(path.join(root,'core.cjs')),{spawn}=require('node:child_process'),runtime=path.join(f.game,'runtime'),id='json:numberless friend.json';
 const qsp=Buffer.from(['QSPGAME','','',core.shift('1',-5),core.shift('Start',-5),'',core.shift("*pl 'fixture'",-5),core.shift('0',-5),''].join('\r\n'),'utf16le');fs.writeFileSync(path.join(f.game,'jack.qsp'),qsp);
 const child=spawn(process.execPath,[path.join(root,'server.cjs'),'--game-dir',f.game,'--catalog-dir',f.catalog,'--runtime',runtime,'--original-dir',path.join(f.game,'none'),'--port','0'],{stdio:['ignore','pipe','pipe'],windowsHide:true});let errors='';child.stderr.on('data',b=>errors+=b);
 try{
  const ready=await new Promise((resolve,reject)=>{let stdout='';const timer=setTimeout(()=>reject(Error('startup '+errors)),10000);child.once('exit',()=>reject(Error(errors)));child.stdout.on('data',b=>{stdout+=b;if(stdout.includes('\n')){clearTimeout(timer);resolve(JSON.parse(stdout.trim()));}});});
  const html=await(await fetch(ready.url)).text(),token=html.match(/const token='([a-f0-9]+)'/)[1];
  async function api(route,input){const response=await fetch(new URL('api/catalog/'+route,ready.url),{method:'POST',headers:{'X-JO9-Token':token,'Content-Type':'application/json'},body:JSON.stringify(input)});return{status:response.status,value:await response.json()};}
  let result=await api('character-images/read',{});a.equal(result.status,200,JSON.stringify(result.value));a(result.value.characters.some(c=>c.id===3040));a(result.value.characters.some(c=>c.id===id));
  f.put('3041_later.json',{seed_name:'서버 실행 후 추가',fullimage:'characters/pick'});f.put('broken.json','{');result=await api('character-images/read',{});a.equal(result.status,200);a(result.value.characters.some(c=>c.id===3041));a.equal(result.value.errors.length,1);
  const c=result.value.characters.find(c=>c.id===id),request={id,field:'indpack_maid',path:'characters/pick.png',expectedHash:c.jsonSha256},saved=await api('character-images/apply',request);a.equal(saved.status,200,JSON.stringify(saved.value));a.equal(saved.value.character.id,id);a.equal(JSON.parse(fs.readFileSync(path.join(f.jsonDir,'numberless friend.json'))).seed_world_description,'보존할 설정');
  a.equal((await api('character-images/apply',request)).status,400);
  for(const invalid of ['json:../outside.json','json:..\\outside.json','json:unknown.json'])a.equal((await api('character-images/read',{ids:[invalid]})).status,400);
  const state=await api('status',{actions:[{characterId:id,flag:'todo',checked:true,expected:false},{characterId:3041,flag:'done',checked:true,expected:false}]});a.equal(state.status,200,JSON.stringify(state.value));a.deepEqual(state.value.characterItems[id],['todo']);a.deepEqual(state.value.characterItems['3041'],['done']);a.deepEqual(state.value.characterItems['1'],['wip']);a.deepEqual(state.value.items,{'kept.png':['done']});a.equal(state.value.memo,'keep');
  a.equal((await api('status',{actions:[{characterId:'json:unknown.json',flag:'done',checked:true,expected:false}]})).status,400);
  a.deepEqual(fs.readFileSync(path.join(f.game,'jack.qsp')),qsp);a.deepEqual(fs.readFileSync(path.join(f.game,'content/pic/characters/pick.png')),png);
 }finally{if(child.exitCode===null){const exited=new Promise(resolve=>child.once('exit',resolve));child.kill();await exited;}}
});
