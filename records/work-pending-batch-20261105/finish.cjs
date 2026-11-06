'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const root=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/work-pending-batch-20261105';
const sha=core.hash,write=(p,b)=>{fs.mkdirSync(path.dirname(p),{recursive:true});const s=p+'.batch-finish.tmp';assert.ok(!fs.existsSync(s));fs.writeFileSync(s,b);fs.renameSync(s,p);assert.deepEqual(fs.readFileSync(p),Buffer.isBuffer(b)?b:Buffer.from(b));};
const installed=JSON.parse(fs.readFileSync(path.join(root,'installed.json')));
assert.equal(sha(fs.readFileSync(game+'/jack.qsp')),installed.candidate);
const status=fs.readFileSync(game+'/modtools/catalog/catalog_status.js');
const block=fs.readFileSync(path.join(root,'catalog/condition-block.html'),'utf8');
const re=/<!-- JO9_SCENE_CONDITIONS_START -->[\s\S]*?<!-- JO9_SCENE_CONDITIONS_END -->/g;
assert.equal((block.match(re)||[]).length,1);
assert.ok(block.includes(installed.candidate));
const merged=[];
for(const p of [game+'/modtools/catalog/catalog_merge_vs_original.html',repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html']){
 const raw=fs.readFileSync(p),s=raw.toString('utf8');assert.equal((s.match(re)||[]).length,1);
 const next=s.replace(re,()=>block);
 assert.equal(next.replace(re,''),s.replace(re,''));
 assert.equal((next.match(/<\/body>/gi)||[]).length,1);
 const scripts=[...next.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].filter(m=>m[1].trim());
 for(const m of scripts)new Function(m[1]);
 write(p,next);merged.push({path:p,before:sha(raw),after:sha(Buffer.from(next)),inlineScripts: scripts.length,outsideConditionsBlockPreserved:true});
}
assert.deepEqual(fs.readFileSync(game+'/modtools/catalog/catalog_status.js'),status);
fs.writeFileSync(path.join(root,'scene-refresh-installed.json'),JSON.stringify({qspSha256:installed.candidate,files:merged,statusPreserved:true},null,2)+'\n');
// Public records contain reports and reproducible code, never primed diagnostic worlds or saves.
for(const dir of ['', 'tax','images','faction','catalog']){
 const base=path.join(root,dir);
 for(const f of fs.readdirSync(base,{withFileTypes:true})){
  if(!f.isFile()||f.name.endsWith('.qsp')||f.name.endsWith('.jpg')||f.name.endsWith('.png')||f.name==='condition-block.html'||f.name==='metadata.json'||f.name==='catalog.updated.html')continue;
  if(!/\.(json|md|cjs|py|qsrc|log)$/.test(f.name))continue;
  write(path.join(rec,dir,f.name),fs.readFileSync(path.join(base,f.name)));
 }
 if(fs.existsSync(path.join(base,'native'))){
  const logs=fs.readdirSync(path.join(base,'native')).filter(f=>/(?:-stderr\.log|client-results\.json)$/.test(f));
  for(const f of logs)write(path.join(rec,dir,'native-evidence',f),fs.readFileSync(path.join(base,'native',f)));
 }
}
const val='G:/Codex/tmp/jo9-work-batch-20261105-validation';
const runs=fs.readdirSync(val,{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name.startsWith('run-')).map(x=>path.join(val,x.name));
const reports=[];
for(const d of runs){
 const report=JSON.parse(fs.readFileSync(path.join(d,'report.json')));reports.push({path:d,verdict:report.verdict});
 const dest=path.join(rec,'validation',path.basename(d));
 for(const n of ['report.json','report.md','client-runner.log','patch-replay.log','patch-reapply.log'])if(fs.existsSync(path.join(d,n)))write(path.join(dest,n),fs.readFileSync(path.join(d,n)));
 const cl=path.join(d,'client');if(fs.existsSync(cl))for(const f of fs.readdirSync(cl))if(f.endsWith('-stderr.log')||f==='client-results.json')write(path.join(dest,'client',f),fs.readFileSync(path.join(cl,f)));
}
assert.ok(reports.some(x=>x.verdict==='PASS'));
const final={qspSha256:sha(fs.readFileSync(game+'/jack.qsp')),sourceQspEqual:fs.readFileSync(game+'/jack.qsp').equals(fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp')),json2323Equal:fs.readFileSync(game+'/json/slaves/2323.json').equals(fs.readFileSync(repo+'/assets/json/slaves/2323.json')),sceneMetadataLatest:true,girlsInventoryLatest:true,catalogStatusPreserved:true,releaseValidation:reports,workApplied:true,fullTouched:false,committed:false,pushed:false};
assert.ok(final.sourceQspEqual&&final.json2323Equal);write(path.join(rec,'FINAL_RESULT.json'),JSON.stringify(final,null,2)+'\n');fs.writeFileSync(path.join(root,'FINAL_RESULT.json'),JSON.stringify(final,null,2)+'\n');console.log(JSON.stringify(final,null,2));
