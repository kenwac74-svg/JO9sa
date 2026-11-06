'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const stage='G:/Codex/tmp/jo9-patch-20261105/stage',record=repo+'/records/release-patch-20261105';
const recovery='G:/somi/JO9resource/release_tracking_20261105/objects';
const inventory=JSON.parse(fs.readFileSync(here+'/inventory/package-runtime.json'));
const cleanup=JSON.parse(fs.readFileSync(here+'/inventory/cleanup-legacy-json.json'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const put=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const tmp=p+'.release-20261105.tmp';assert.ok(!fs.existsSync(tmp));fs.writeFileSync(tmp,b);fs.renameSync(tmp,p);};
const safe=p=>assert.ok(p&&!p.includes('\\')&&!p.startsWith('/')&&!p.includes(':')&&!p.split('/').some(x=>!x||x==='.'||x==='..'));
const runtimePath=repo+'/assets/runtime-source-2.4.1.json',runtime=JSON.parse(fs.readFileSync(runtimePath));
const rows=new Map(runtime.files.map(r=>[r.runtimePath,r]));assert.equal(rows.size,runtime.files.length);
const ledgerPath=game+'/modtools/catalog/image_work/personal-patch/events.jsonl';
const ledger=fs.readFileSync(ledgerPath,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse),latest=new Map();
for(const e of ledger)for(const f of e.files||[])latest.set(f.path,f);
const trackingDiff=[],trackingFiles=[],imageRegistrations=[],stageFiles=[];
assert.equal(inventory.files.length,942);
for(const f of inventory.files){
 safe(f.path);safe(f.runtimePath);assert.equal(f.path,'game/'+f.runtimePath);
 const actual=fs.readFileSync(game+'/'+f.runtimePath);assert.equal(actual.length,f.bytes);assert.equal(hash(actual),f.sha256,'WORK drift: '+f.path);
 const dst=stage+'/'+f.path;
 if(fs.existsSync(dst))assert.equal(hash(fs.readFileSync(dst)),f.sha256,'stage drift: '+f.path);else put(dst,actual);
 stageFiles.push({path:f.path,bytes:f.bytes,sha256:f.sha256,kind:f.kind});
 const repositoryPath=f.kind==='qsp'?runtime.qspSnapshot:'assets/'+f.runtimePath,tracked=repo+'/'+repositoryPath;
 let before=null,beforePath=null;
 if(fs.existsSync(tracked)){
  const b=fs.readFileSync(tracked);before=hash(b);
  if(before!==f.sha256){beforePath=recovery+'/'+before;fs.mkdirSync(recovery,{recursive:true});if(!fs.existsSync(beforePath))fs.writeFileSync(beforePath,b,{flag:'wx'});assert.equal(hash(fs.readFileSync(beforePath)),before);}
 }
 if(before!==f.sha256){put(tracked,actual);trackingFiles.push({runtimePath:f.runtimePath,repositoryPath,before,after:f.sha256,beforePath});}
 if(f.kind!=='qsp'){
  const old=rows.get(f.runtimePath)||null,next={...(old||{}),runtimePath:f.runtimePath,repositoryPath,bytes:f.bytes,sha256:f.sha256};
  if(JSON.stringify(old)!==JSON.stringify(next))trackingDiff.push({path:f.runtimePath,before:old,after:next});rows.set(f.runtimePath,next);
 }
 if(f.kind==='image'){
  const rel=f.runtimePath.slice('content/pic/'.length),last=latest.get(rel);
  if(!last||last.after!==f.sha256)imageRegistrations.push({path:rel,after:f.sha256,before:before&&before!==f.sha256?before:null,beforePath,registrationReason:last?'refresh latest manual WORK image':'register existing WORK image omitted from delivery ledger'});
 }
}
const retired=[];
for(const f of cleanup.files){
 const old=rows.get(f.runtimePath);if(old){retired.push({path:f.runtimePath,before:old,replacement:f.replacementRuntimePath});rows.delete(f.runtimePath);}
 assert.ok(rows.has(f.replacementRuntimePath));
}
runtime.files=[...rows.values()];runtime.sourceQspSha256=inventory.files.find(f=>f.kind==='qsp').sha256;runtime.snapshotDate='2026-11-05';
runtime.retiredRuntimePaths=[...(runtime.retiredRuntimePaths||[]).filter(r=>!cleanup.files.some(c=>c.runtimePath===r.path)),...cleanup.files.map(c=>({path:c.runtimePath,replacement:c.replacementRuntimePath,reason:'same character ID, renamed JSON; old path excluded from current runtime',retired:'2026-11-05'}))];
put(runtimePath,JSON.stringify(runtime,null,2)+'\n');
if(imageRegistrations.length)require(repo+'/tools/text-workshop/personal-patch.cjs').create(game,game+'/modtools/catalog').record({id:'release-work-image-registration-20261105',created:new Date().toISOString(),files:imageRegistrations},'replace');
const result={created:new Date().toISOString(),stage,runtimeFiles:stageFiles.length,runtimeBytes:stageFiles.reduce((s,f)=>s+f.bytes,0),trackingFilesUpdated:trackingFiles.length,runtimeRowsUpdated:trackingDiff.length,retiredRuntimeRows:retired.length,imageLedgerRegistrations:imageRegistrations.length,workRuntimeModified:false,fullModified:false,trackingFiles,trackingDiff,retired,stageFiles};
for(const dst of [here+'/staging.json',record+'/staging.json'])put(dst,JSON.stringify(result,null,2)+'\n');
for(const n of ['package-runtime.json','cleanup-legacy-json.json','report.json','build-package-inventory.cjs'])put(record+'/inventory/'+n,fs.readFileSync(here+'/inventory/'+n));
put(record+'/stage-and-track.cjs',fs.readFileSync(__filename));
console.log(JSON.stringify({runtimeFiles:result.runtimeFiles,runtimeBytes:result.runtimeBytes,trackingFilesUpdated:result.trackingFilesUpdated,runtimeRowsUpdated:result.runtimeRowsUpdated,retiredRuntimeRows:result.retiredRuntimeRows,imageLedgerRegistrations:result.imageLedgerRegistrations,stage,workRuntimeModified:false,fullModified:false}));
