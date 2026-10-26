'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const core=require('./core.cjs');
const FIXTURES=path.resolve(process.env.JO9_MOB_TEST_ROOT||'G:/Codex/tmp/bcut-mob-repair-20261021/fixtures');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=','base64');
const changed=Buffer.from(png);changed[changed.length-12]^=1;
const protectedFiles=[path.resolve(__dirname,'../../mods/2026-10-08_persistent_image_cycle.json'),'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4_work/game/content/pic/mob/Warg.png'];
const protectedHashes=new Map(protectedFiles.filter(p=>fs.existsSync(p)).map(p=>[p,core.hash(fs.readFileSync(p))]));
test.after(()=>{for(const [p,sha] of protectedHashes)assert.equal(core.hash(fs.readFileSync(p)),sha,'Live file changed: '+p);});
function handler(){return [
 "if snk_room_target > 0: gs 'snk_room_bridge', 'guard', 'interior_change'",
 '! JO9 image-cycle: saved choices are keyed by original image path.',
 "if $args[0] = 'jo9_path':",
 ' local $jo9_base, $jo9_path, jo9_count, jo9_selected, $jo9_candidates, jo9_candidate_ids',
 ' $jo9_base = $args[1]', ' $jo9_path = $args[1]', ' jo9_count = 1',
 ' jo9_selected = jo9_cut_choice[$jo9_base]',
 ' ! JO9 WINDOWS IMAGE SLOT REGISTRY START',
 " if $jo9_base = 'content/pic/characters/legacy.png':", '  jo9_count = 3',
 "  $jo9_candidates[0] = 'content/pic/characters/Legacy.png'", '  jo9_candidate_ids[0] = 0',
 "  $jo9_candidates[1] = 'content/pic/characters/Legacy (2).png'", '  jo9_candidate_ids[1] = 1',
 "  $jo9_candidates[2] = 'content/pic/characters/Legacy (7).png'", '  jo9_candidate_ids[2] = 2', ' end',
 ' ! JO9 WINDOWS IMAGE SLOT REGISTRY END', ' $result = $jo9_path', ' exit', 'end',
 '!Move to a different room in your apartment', "*pl 'Keep room UI'"
 ].join('\r\n');}
function fixture(t,{original=false,body=handler()}={}){
 fs.mkdirSync(FIXTURES,{recursive:true});const dir=fs.mkdtempSync(path.join(FIXTURES,'mob-'));
 const tools=path.join(dir,'project/tools/text-workshop'),mods=path.join(dir,'project/mods');
 for(const p of [tools,mods])fs.mkdirSync(p,{recursive:true});
 // Canonical export and every writable module run inside the temporary project.
 for(const name of fs.readdirSync(__dirname).filter(n=>n.endsWith('.cjs')&&!n.endsWith('.test.cjs')).concat(['apply_mods.ps1']))fs.copyFileSync(path.join(__dirname,name),path.join(tools,name));
 const canonical=path.join(mods,'2026-10-08_persistent_image_cycle.json');fs.writeFileSync(canonical,JSON.stringify({edits:[{location:'interior_change',old:'!Move to a different room in your apartment',new:'fixture'}]}));
 const game=path.join(dir,'game'),catalogRoot=path.join(dir,'catalog'),runtime=path.join(dir,'runtime'),originalRoot=path.join(dir,'original'),folder=path.join(game,'content/pic/mob');
 for(const p of [folder,path.join(game,'content/pic/characters'),path.join(game,'modtools'),catalogRoot,runtime,path.join(originalRoot,'content/pic/mob')])fs.mkdirSync(p,{recursive:true});
 fs.writeFileSync(path.join(folder,'Warg.png'),png);fs.writeFileSync(path.join(game,'content/pic/characters/Legacy.png'),png);
 const entry={base:'mob/Warg.png',alias:'mob/Warg (2).png',source:'content/pic/mob/Warg.png',target:'content/jo9o_original_cuts/mob/Warg.png',sourceSha:core.hash(png),bytes:png.length,width:1,height:1};
 if(original){fs.writeFileSync(path.join(folder,'Warg (2).png'),png);fs.writeFileSync(path.join(originalRoot,'content/pic/mob/Warg.png'),png);fs.symlinkSync(path.join(originalRoot,'content/pic'),path.join(game,'content/jo9o_original_cuts'),'junction');fs.writeFileSync(path.join(game,'modtools/image-original-cuts.json'),JSON.stringify({version:1,originals:{'mob/warg.png':entry},reservations:{'mob/warg.png':{base:entry.base,alias:entry.alias,status:'linked'}}}));}
 const rows=[['content\\pic\\mob\\Warg.png','a','etc',png.length,0,1,1,'']];
 fs.writeFileSync(path.join(catalogRoot,'catalog_merge_vs_original.html'),'<!doctype html><html><head></head><body><script>var D='+JSON.stringify(rows)+';\nvar MR="test",OR="test";</script></body></html>');
 fs.writeFileSync(path.join(catalogRoot,'catalog_status.js'),'window.CATALOG_STATUS='+JSON.stringify({items:original?{[rows[0][0]]:['spare']}:{}})+';');
 const raw=Buffer.from(['QSPGAME','header','',core.shift('2',-5),core.shift('interior_change',-5),'',core.shift(body,-5),core.shift('0',-5),core.shift('untouched',-5),core.shift('Keep description',-5),core.shift("*pl 'Keep dialogue'",-5),core.shift('0',-5),''].join('\r\n'),'utf16le');
 fs.writeFileSync(path.join(game,'jack.qsp'),raw);
 const cat=require(path.join(tools,'catalog.cjs')).create(catalogRoot),api=require(path.join(tools,'image-cuts.cjs')).create(game,catalogRoot,cat,runtime),pic=require(path.join(tools,'pic-local.cjs')).create(game,catalogRoot,cat,api);
 const f={dir,tools,game,catalogRoot,runtime,originalRoot,folder,entry,canonical,raw,cat,api,pic,child:null};
 t.after(async()=>{if(f.child&&f.child.exitCode===null){await new Promise(resolve=>{f.child.once('close',resolve);f.child.kill();});}const actual=path.resolve(f.dir);assert.equal(path.dirname(actual),FIXTURES);assert.ok(path.basename(actual).startsWith('mob-'));assert.ok(!fs.lstatSync(actual).isSymbolicLink());fs.rmSync(actual,{recursive:true,force:true});});
 return f;
}
function readBody(f){const d=core.parse(fs.readFileSync(path.join(f.game,'jack.qsp'))),l=d.locations.find(x=>x.name==='interior_change');return core.shift(d.lines[l.body],5);}
function add(f){const p=f.api.info('content/pic/mob/Warg.png');return f.api.add({base:p.base,next:p.next,before:p.before,data:png.toString('base64')});}
test('mob A/B family and PIC listing include an ordinary user B',t=>{
 const f=fixture(t);fs.writeFileSync(path.join(f.folder,'Warg (2).png'),png);
 assert.deepEqual(f.api.family('mob/Warg.png').items.map(x=>[x.file,x.readOnly]),[['Warg.png',false],['Warg (2).png',false]]);
 assert.deepEqual(f.pic.entries('mob').entries.map(x=>x.name),['Warg (2).png','Warg.png']);
});
test('adding mob B then replacing B preserves A and QSP byte for byte',t=>{
 const f=fixture(t),saved=add(f);assert.equal(saved.path,'mob/Warg (2).png');
 assert.deepEqual(fs.readFileSync(path.join(f.game,'jack.qsp')),f.raw);
 const result=f.pic.apply([{path:saved.path,before:core.hash(png),data:changed.toString('base64'),cap:1024}]);
 assert.equal(result.status,'applied');assert.deepEqual(fs.readFileSync(path.join(f.folder,'Warg (2).png')),changed);assert.deepEqual(fs.readFileSync(path.join(f.folder,'Warg.png')),png);assert.deepEqual(fs.readFileSync(path.join(f.game,'jack.qsp')),f.raw);
 assert.ok(require(path.join(f.tools,'original-cuts.cjs')).readRows(f.catalogRoot).some(d=>d[0]==='content\\pic\\mob\\Warg (2).png'));
});
test('mob fifth cut registers10005 while existing registry IDs and other QSP fields remain intact',t=>{
 const f=fixture(t);for(const n of [2,3,4])fs.writeFileSync(path.join(f.folder,'Warg ('+n+').png'),png);
 assert.equal(add(f).path,'mob/Warg (5).png');const body=readBody(f);
 assert.ok(body.includes("if $jo9_base = 'content/pic/mob/warg.png':"));assert.match(body,/jo9_candidate_ids\[1\] = 10005/);
 const legacySection=s=>s.split("if $jo9_base = 'content/pic/characters/legacy.png':")[1].split(/\r\n\s*end/)[0].trim().split(/\r\n/).map(line=>line.trim());assert.deepEqual(legacySection(body),legacySection(handler()));
 const before=core.parse(f.raw),after=core.parse(fs.readFileSync(path.join(f.game,'jack.qsp'))),idx=before.locations.find(l=>l.name==='interior_change').body;
 assert.deepEqual(after.lines.filter((_,i)=>i!==idx),before.lines.filter((_,i)=>i!==idx));assert.deepEqual(f.api.refresh('repeat'),{unchanged:true});assert.match(fs.readFileSync(f.canonical,'utf8'),/10005/);
});
test('mob physical original B is listed once, read-only, and rejected by the image writer',t=>{
 const f=fixture(t,{original:true}),fam=f.api.family(f.entry.base);assert.equal(fam.items.length,2);assert.equal(fam.items[1].readOnly,true);assert.equal(f.api.resolveAlias(f.entry.alias),path.join(f.folder,'Warg (2).png'));
 assert.equal(f.pic.scan().filter(x=>x.path===f.entry.alias).length,1);assert.throws(()=>f.pic.apply([{path:f.entry.alias,before:core.hash(png),data:changed.toString('base64'),cap:1024}]),/예약/);
 const registered=require(path.join(f.tools,'original-cuts.cjs')).register(f.game,f.catalogRoot,f.originalRoot,f.runtime,undefined,true);assert.equal(registered.registered.length,1);assert.equal(registered.released.length,0);assert.deepEqual(fs.readFileSync(path.join(f.folder,'Warg (2).png')),png);
});
test('mob traversal and external directory junction are rejected without writing a cut',t=>{
 const f=fixture(t),outside=path.join(f.dir,'outside');fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'Outside.png'),png);fs.symlinkSync(outside,path.join(f.folder,'linked'),'junction');
 assert.throws(()=>f.api.info('mob/../outside/Outside.png'),/상대 경로|선택/);assert.throws(()=>f.api.info('mob/linked/Outside.png'),/PIC 밖/);assert.ok(!fs.existsSync(path.join(outside,'Outside (2).png')));
});
async function server(f){
 const child=f.child=spawn(process.execPath,[path.join(f.tools,'server.cjs'),'--game-dir',f.game,'--original-dir',f.originalRoot,'--catalog-dir',f.catalogRoot,'--runtime',f.runtime,'--port','0'],{windowsHide:true,stdio:['ignore','pipe','pipe']});let stderr='';child.stderr.on('data',b=>stderr+=b);
 const state=await new Promise((resolve,reject)=>{let stdout='';const timer=setTimeout(()=>reject(Error('Fixture server timed out: '+stderr)),10000);child.once('error',e=>{clearTimeout(timer);reject(e);});child.once('exit',code=>{clearTimeout(timer);reject(Error('Fixture server exited '+code+': '+stderr));});child.stdout.on('data',b=>{stdout+=b;for(const s of stdout.split(/\r?\n/)){try{const v=JSON.parse(s);if(v.url){clearTimeout(timer);resolve(v);return;}}catch{}}});});
 const config=fs.readFileSync(path.join(f.catalogRoot,'catalog_workshop_config.js'),'utf8').match(/window.JO9_CATALOG_BRIDGE=(.*);/),token=JSON.parse(config[1]).token;
 return async(action,input)=>{const r=await fetch(state.url+'api/catalog/cuts/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-JO9-Token':token},body:JSON.stringify(input)});return{status:r.status,value:await r.json()};};
}
test('HTTP cut file and replace endpoints accept mob B and retain traversal rejection',async t=>{
 const f=fixture(t);fs.writeFileSync(path.join(f.folder,'Warg (2).png'),png);const call=await server(f);
 const loaded=await call('file',{path:'mob/Warg (2).png'});assert.equal(loaded.status,200,JSON.stringify(loaded.value));assert.equal(loaded.value.data,png.toString('base64'));
 const saved=await call('replace',{path:'mob/Warg (2).png',before:core.hash(png),data:changed.toString('base64'),cap:1024});assert.equal(saved.status,200,JSON.stringify(saved.value));
 assert.deepEqual(fs.readFileSync(path.join(f.folder,'Warg (2).png')),changed);assert.deepEqual(fs.readFileSync(path.join(f.folder,'Warg.png')),png);assert.deepEqual(fs.readFileSync(path.join(f.game,'jack.qsp')),f.raw);
 const bad=await call('file',{path:'mob/../outside.png'});assert.equal(bad.status,400);
});

test('selected mob original creates physical B and rollback removes only that new copy',t=>{
 const f=fixture(t,{original:true}),registrar=require(path.join(f.tools,'original-cuts.cjs'));
 fs.unlinkSync(path.join(f.folder,'Warg (2).png'));fs.unlinkSync(path.join(f.game,'modtools/image-original-cuts.json'));
 const record=registrar.register(f.game,f.catalogRoot,f.originalRoot,f.runtime,undefined,true);
 assert.equal(record.registered.length,1);assert.equal(record.createdPhysical.length,1);assert.deepEqual(fs.readFileSync(path.join(f.folder,'Warg (2).png')),png);assert.deepEqual(fs.readFileSync(path.join(f.folder,'Warg.png')),png);
 assert.equal(f.api.family(f.entry.base).items[1].readOnly,true);assert.deepEqual(fs.readFileSync(path.join(f.originalRoot,'content/pic/mob/Warg.png')),png);
 registrar.rollback(record);assert.ok(!fs.existsSync(path.join(f.folder,'Warg (2).png')));assert.deepEqual(fs.readFileSync(path.join(f.folder,'Warg.png')),png);assert.deepEqual(fs.readFileSync(path.join(f.game,'jack.qsp')),f.raw);
});
