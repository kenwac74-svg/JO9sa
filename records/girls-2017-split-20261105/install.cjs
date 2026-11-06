'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const tmp='G:/Codex/tmp/girls-2017-split-20261105',record=repo+'/records/girls-2017-split-20261105';
const plan=JSON.parse(fs.readFileSync(root+'/plan.json'));
const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const t=p+'.split2340.tmp';assert.ok(!fs.existsSync(t));fs.writeFileSync(t,b);fs.renameSync(t,p);};
assert.equal(core.hash(fs.readFileSync(game+'/jack.qsp')),plan.baseline);
assert.equal(core.hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),plan.baseline);
assert.equal(core.hash(fs.readFileSync(game+'/json/slaves/2017.json')),plan.old2017JsonSha256);
assert.equal(core.hash(fs.readFileSync(game+'/json/slave_index.json')),plan.oldIndexSha256);
assert.ok(!fs.existsSync(game+'/json/slaves/2340.json'));
const log=fs.readFileSync(tmp+'/native/split-pool-stderr.log','utf8');
assert.ok(log.includes('JO9_QA_GIRLS_split_pool_COMPLETE'));
const snapshots=[['jack.before.qsp',game+'/jack.qsp'],['slave_index.before.json',game+'/json/slave_index.json'],['2017.short.before.json',game+'/json/slaves/2017.json'],['2017.long.original.json','G:/somi/JO9O/game/json/slaves/2017.json']];
for(const [name,p]of snapshots){assert.ok(!fs.existsSync(record+'/recovery/'+name));put(record+'/recovery/'+name,fs.readFileSync(p));}
const created=[];
for(const f of plan.images){
 const b=fs.readFileSync(game+'/content/pic/'+f.old);assert.equal(core.hash(b),f.sha256);
 const to=game+'/content/pic/'+f.target;assert.ok(!fs.existsSync(to));put(to,b);created.push('content/pic/'+f.target);
}
put(game+'/json/slaves/2340.json',fs.readFileSync(root+'/2340.json'));created.push('json/slaves/2340.json');
const oldIndex=fs.readFileSync(game+'/json/slave_index.json','utf8');
assert.equal((oldIndex.match(/"milf_last"\s*:\s*2339/g)||[]).length,1);
const newIndex=oldIndex.replace(/("milf_last"\s*:\s*)2339/,'$12340');
assert.equal(JSON.parse(newIndex.replace(/^\uFEFF/,'' )).milf_last,2340);
put(game+'/json/slave_index.json',newIndex);
const preBaks=new Set(fs.readdirSync(game).filter(f=>f.startsWith('jack.qsp.bak_')));
const applied=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/mods'],{encoding:'utf8',windowsHide:true});
put(record+'/apply.log',applied.stdout+'\n'+applied.stderr);assert.equal(applied.status,0,applied.stdout+applied.stderr);
assert.equal(core.hash(fs.readFileSync(game+'/jack.qsp')),plan.candidate);
put(repo+'/assets/runtime/2.4.1/jack.qsp',fs.readFileSync(game+'/jack.qsp'));
const runtimePath=repo+'/assets/runtime-source-2.4.1.json',runtime=JSON.parse(fs.readFileSync(runtimePath)),map=new Map(runtime.files.map(f=>[f.runtimePath,f]));
const required=['json/slaves/2340.json','json/slave_index.json',...plan.images.flatMap(f=>['content/pic/'+f.target,'content/pic/'+f.old])];
for(const rel of required){const b=fs.readFileSync(game+'/'+rel),rp='assets/'+rel;put(repo+'/'+rp,b);const entry={runtimePath:rel,repositoryPath:rp,bytes:b.length,sha256:core.hash(b)};const old=map.get(rel);if(old)Object.assign(old,entry);else{runtime.files.push(entry);map.set(rel,entry);}}
const qrow=runtime.files.find(f=>f.runtimePath==='jack.qsp');if(qrow)Object.assign(qrow,{repositoryPath:'assets/runtime/2.4.1/jack.qsp',bytes:fs.statSync(game+'/jack.qsp').size,sha256:plan.candidate});
runtime.sourceQspSha256=plan.candidate;runtime.latestCharacterSplit={date:'2026-11-05',from:2017,to:2340,record:'records/girls-2017-split-20261105/REPORT_KO.md'};
put(runtimePath,JSON.stringify(runtime,null,2)+'\n');
const aliases={schema:1,id:plan.id,created:'2026-11-05',policy:'KEEP: old saves retain their image strings; hashes alone do not authorize deletion. New edits require an explicit alias refresh.',oldId:2017,newId:2340,files:plan.images.map(f=>({alias:'content/pic/'+f.old,canonical:'content/pic/'+f.target,sha256:f.sha256,bytes:f.bytes,status:'KEEP',reason:'Intentional duplicate for pre-split saves; canonical belongs to character 2340.'}))};
put(repo+'/assets/compatibility-aliases/2026-11-05_2017_2340.json',JSON.stringify(aliases,null,2)+'\n');
const tracker=require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,game+'/modtools/catalog');
tracker.record({id:plan.id,created:new Date().toISOString(),files:plan.images.map(f=>({path:f.target,after:f.sha256,before:null}))},'replace');
tracker.record({id:plan.id+'_compatibility_aliases',created:new Date().toISOString(),files:plan.images.map(f=>({path:f.old,after:f.sha256,before:null}))},'replace',true);
for(const p of fs.readdirSync(root+'/mods')){put(repo+'/mods/'+p,fs.readFileSync(root+'/mods/'+p));put(record+'/mods/'+p,fs.readFileSync(root+'/mods/'+p));}
for(const f of ['prepare.cjs','install.cjs','plan.json','2340.json'])put(record+'/'+f,fs.readFileSync(root+'/'+f));
put(record+'/native-pool.log',fs.readFileSync(tmp+'/native/split-pool-stderr.log'));
const redundantBaks=[];for(const name of fs.readdirSync(game).filter(f=>f.startsWith('jack.qsp.bak_')&&!preBaks.has(f))){const b=fs.readFileSync(game+'/'+name);assert.equal(core.hash(b),plan.baseline);assert.ok(b.equals(fs.readFileSync(record+'/recovery/jack.before.qsp')));fs.unlinkSync(game+'/'+name);redundantBaks.push(name);}
assert.equal(core.hash(fs.readFileSync(game+'/json/slaves/2017.json')),plan.old2017JsonSha256);
const result={createdPaths:created,newId:2340,oldId:2017,old2017JsonUnchanged:true,oldAliasesPreserved:4,poolUpperBound:2340,workQspSha256:plan.candidate,trackedQspSha256:core.hash(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),redundantBackupRemoved:redundantBaks,fullTouched:false};
put(root+'/applied.json',JSON.stringify(result,null,2)+'\n');put(record+'/applied.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
