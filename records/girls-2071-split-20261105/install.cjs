'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const tmp='G:/Codex/tmp/girls-2071-split-20261105',record=repo+'/records/girls-2071-split-20261105';
const p=JSON.parse(fs.readFileSync(root+'/plan.json'));
const put=(f,b)=>{fs.mkdirSync(path.dirname(f),{recursive:true});const t=f+'.split2071.tmp';assert.ok(!fs.existsSync(t));fs.writeFileSync(t,b);fs.renameSync(t,f);};
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.baseline);assert.equal(c.hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),p.baseline);
for(const [id,hash]of Object.entries(p.protectedJson))assert.equal(c.hash(fs.readFileSync(game+'/json/slaves/'+id+'.json')),hash);
assert.equal(c.hash(fs.readFileSync(game+'/json/slave_index.json')),p.oldIndexSha256);assert.ok(!fs.existsSync(game+'/json/slaves/2340.json'));
const native=JSON.parse(fs.readFileSync(tmp+'/native/client-results.json','utf8').replace(/^\uFEFF/,''));assert.ok(native.length===1&&native[0].pass);
const runtimeFile=repo+'/assets/runtime-source-2.4.1.json',runtimeBefore=fs.readFileSync(runtimeFile),runtime=JSON.parse(runtimeBefore);
assert.equal(runtime.sourceQspSha256,p.baseline);
for(const [name,source]of [['jack.before.qsp',game+'/jack.qsp'],['slave_index.before.json',game+'/json/slave_index.json'],['2071.original.json','G:/somi/JO9O/game/json/slaves/2071.json']]){assert.ok(!fs.existsSync(record+'/recovery/'+name));put(record+'/recovery/'+name,fs.readFileSync(source));}
const created=[];
for(const f of p.images){const b=fs.readFileSync(game+'/content/pic/'+f.old);assert.equal(c.hash(b),f.sha256);assert.ok(!fs.existsSync(game+'/content/pic/'+f.target));put(game+'/content/pic/'+f.target,b);created.push('content/pic/'+f.target);}
put(game+'/json/slaves/2340.json',fs.readFileSync(root+'/2340.json'));created.push('json/slaves/2340.json');
const index=fs.readFileSync(game+'/json/slave_index.json','utf8');assert.equal((index.match(/"milf_last"\s*:\s*2339/g)||[]).length,1);
const afterIndex=index.replace(/("milf_last"\s*:\s*)2339/,'$12340');assert.equal(JSON.parse(afterIndex).milf_last,2340);put(game+'/json/slave_index.json',afterIndex);
const backupsBefore=new Set(fs.readdirSync(game).filter(f=>f.startsWith('jack.qsp.bak_')));
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/mods'],{encoding:'utf8',windowsHide:true});
put(record+'/apply.log',run.stdout+'\n'+run.stderr);assert.equal(run.status,0,run.stdout+run.stderr);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.candidate);
put(repo+'/assets/runtime/2.4.1/jack.qsp',fs.readFileSync(game+'/jack.qsp'));
const blue=JSON.parse(fs.readFileSync(game+'/json/slaves/2324.json'));
const bluePaths=['fullimage','seed_ava','seed_ava_gray','seed_ava_clear'].map(k=>'content/pic/'+blue[k].replace(/^content\/pic\//,'')+'.png');
const required=[...new Set(['json/slaves/2340.json','json/slaves/2324.json','json/slaves/2071.json','json/slave_index.json',...p.images.flatMap(f=>['content/pic/'+f.old,'content/pic/'+f.target]),...bluePaths,'content/pic/girls/full/2071_blue_short_milf.png','content/pic/girls/full/cloth/2071_blue_short_milf.png'])];
const runtimeMap=new Map(runtime.files.map(f=>[f.runtimePath,f])),delta=[];
for(const rel of required){const b=fs.readFileSync(game+'/'+rel),to=repo+'/assets/'+rel;const old=runtimeMap.get(rel);delta.push({runtimePath:rel,before:old?{...old}:null,trackedFileExisted:fs.existsSync(to)});put(to,b);const row={runtimePath:rel,repositoryPath:'assets/'+rel,bytes:b.length,sha256:c.hash(b)};if(old)Object.assign(old,row);else{runtime.files.push(row);runtimeMap.set(rel,row);}}
const qrow=runtime.files.find(f=>f.runtimePath==='jack.qsp');if(qrow){delta.push({runtimePath:'jack.qsp',before:{...qrow}});Object.assign(qrow,{repositoryPath:'assets/runtime/2.4.1/jack.qsp',bytes:fs.statSync(game+'/jack.qsp').size,sha256:p.candidate});}
runtime.sourceQspSha256=p.candidate;runtime.latestCharacterSplit={date:'2026-11-05',brownId:2071,existingBlueId:2324,newBlondId:2340,record:'records/girls-2071-split-20261105/REPORT_KO.md'};
assert.ok(fs.readFileSync(runtimeFile).equals(runtimeBefore));put(runtimeFile,JSON.stringify(runtime,null,2)+'\n');put(record+'/runtime-index-delta.json',JSON.stringify(delta,null,2)+'\n');
const aliasFiles=p.images.map(f=>({alias:'content/pic/'+f.old,canonical:'content/pic/'+f.target,ownerId:2340,relationship:'byte-identical',sha256:f.sha256,status:'KEEP'}));
for(const [old,canonical,ownerId,relationship] of [
 ['girls/full/2071_blue_short_milf.png','girls/full/2324_blue_short_milf.png',2324,'same-character-different-framing'],
 ['girls/full/cloth/2071_blue_short_milf.png','girls/full/cloth/2071_brown_long_milf.png',2071,'legacy-misnamed-brown-outfit']
])aliasFiles.push({alias:'content/pic/'+old,canonical:'content/pic/'+canonical,ownerId,relationship,sha256:c.hash(fs.readFileSync(game+'/content/pic/'+old)),canonicalSha256:c.hash(fs.readFileSync(game+'/content/pic/'+canonical)),status:'KEEP'});
put(repo+'/assets/compatibility-aliases/2026-11-05_2071_split.json',JSON.stringify({schema:1,id:p.id,policy:'Keep old image addresses for saved actors; canonical and legacy copies are not automatically synchronized.',files:aliasFiles},null,2)+'\n');
const tracker=require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,game+'/modtools/catalog');
tracker.record({id:p.id,created:new Date().toISOString(),files:p.images.map(f=>({path:f.target,after:f.sha256,before:null}))},'replace');
const importPaths=[...new Set([...aliasFiles.map(f=>f.alias),...bluePaths])];
tracker.record({id:p.id+'_preserved_paths',created:new Date().toISOString(),files:importPaths.map(rel=>({path:rel.replace(/^content\/pic\//,''),after:c.hash(fs.readFileSync(game+'/'+rel)),before:null}))},'replace',true);
for(const f of fs.readdirSync(root+'/mods')){put(repo+'/mods/'+f,fs.readFileSync(root+'/mods/'+f));put(record+'/mods/'+f,fs.readFileSync(root+'/mods/'+f));}
for(const f of ['prepare.cjs','install.cjs','plan.json','2340.json'])put(record+'/'+f,fs.readFileSync(root+'/'+f));
put(record+'/native-results.json',JSON.stringify(native,null,2)+'\n');put(record+'/native.log',fs.readFileSync(tmp+'/native/split-characters-stderr.log'));
for(const name of fs.readdirSync(game).filter(f=>f.startsWith('jack.qsp.bak_')&&!backupsBefore.has(f))){const b=fs.readFileSync(game+'/'+name);assert.equal(c.hash(b),p.baseline);assert.ok(b.equals(fs.readFileSync(record+'/recovery/jack.before.qsp')));fs.unlinkSync(game+'/'+name);}
for(const [id,hash]of Object.entries(p.protectedJson))assert.equal(c.hash(fs.readFileSync(game+'/json/slaves/'+id+'.json')),hash);
const report={status:'APPLIED',brown:2071,blue:2324,blond:2340,newImages:4,newDefinitions:1,createdPaths:created,preservedJsonIds:[2017,2071,2324],compatibilityAddresses:aliasFiles.length,poolLast:2340,workQsp:p.candidate,trackedQsp:c.hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),fullTouched:false};
put(root+'/applied.json',JSON.stringify(report,null,2)+'\n');put(record+'/applied.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
