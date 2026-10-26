'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-insolvency-simple-20261025';
const artifact=path.resolve(__dirname,'..'),rec=repo+'/records/insolvency-simple-flow-20261025',backup='G:/somi/JO9_work_backups/insolvency_four_steps_20261025';
const c=require(repo+'/tools/text-workshop/core.cjs'),read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');
const expectedBefore='a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a',expectedAfter='256293ff14b41ac19efd1bfb412f21066b227f86e1b61ea0e523820a86ebcb3a';
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),expectedBefore,'WORK changed during preparation; do not overwrite');
assert.equal(c.hash(fs.readFileSync(tmp+'/candidate.qsp')),expectedAfter);
const release=read('G:/Codex/tmp/jo9-insolvency-release-20261025/run-Do9SKJ/report.json');assert.equal(release.verdict,'PASS');
const native=read(tmp+'/native-final/client-results.json'),play=read(tmp+'/play-verified/client-results.json'),ui=read(tmp+'/ui-final/client-results.json');
for(const [cases,n]of[[native,14],[play,3],[ui,4]]){assert.equal(cases.length,n);assert(cases.every(x=>x.pass));}
assert.equal(read(tmp+'/native-final/prepared.json').sourceHash,expectedAfter);
assert.equal(read(tmp+'/play-verified/prepared.json').sourceHash,expectedAfter);
const final=c.parse(fs.readFileSync(tmp+'/candidate.qsp')),uiSource=c.parse(fs.readFileSync(tmp+'/play-final/asset-chain.qsp'));
for(const n of ['slave_stat','assistant_stat','jo9_traits_view','jo9_traits','#static_txt','#txt_woman','$ongload','$newloc'])assert.equal(final.lines[final.locations.find(l=>l.name===n).body],uiSource.lines[uiSource.locations.find(l=>l.name===n).body],'UI tested bytes changed '+n);
const resources=[['content/js/jo9_traits_view.js','jo9_traits_view.js'],['css/jo9_traits_view.css','jo9_traits_view.css']];
const originalResources=resources.map(([rel,name])=>({path:game+'/'+rel,relative:rel,name,sha256:c.hash(fs.readFileSync(game+'/'+rel))}));
assert(fs.readFileSync(artifact+'/ui/jo9_traits_view.css','utf8').startsWith(fs.readFileSync(game+'/css/jo9_traits_view.css','utf8')),'Unexpected base stylesheet drift');
assert(!fs.existsSync(backup),'Refuse to overwrite an existing backup');fs.mkdirSync(backup,{recursive:true});
for(const r of originalResources)fs.copyFileSync(r.path,backup+'/'+r.name);
write(backup+'/original-resources.json',originalResources);
const beforeBackups=new Set(fs.readdirSync(game).filter(n=>n.startsWith('jack.qsp.bak_')));
const applied=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:1024*1024});
if(applied.status!==0)throw Error('Patch application failed: '+applied.stdout+'\n'+applied.stderr);
assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),expectedAfter);
const newBackups=fs.readdirSync(game).filter(n=>n.startsWith('jack.qsp.bak_')&&!beforeBackups.has(n));assert.equal(newBackups.length,1);
assert.equal(c.hash(fs.readFileSync(game+'/'+newBackups[0])),expectedBefore);fs.renameSync(game+'/'+newBackups[0],backup+'/before.qsp');
for(const [rel,name]of resources){fs.copyFileSync(artifact+'/ui/'+name,game+'/'+rel);assert.equal(c.hash(fs.readFileSync(game+'/'+rel)),c.hash(fs.readFileSync(artifact+'/ui/'+name)));}
const protectedFiles=read(tmp+'/protected.json');for(const f of protectedFiles)assert.equal(c.hash(fs.readFileSync(f.path)),f.sha256,'Protected file changed '+f.path);
fs.mkdirSync(rec,{recursive:true});for(const n of ['MANUAL_KO.md','PLAN_KO.md'])fs.copyFileSync(artifact+'/'+n,rec+'/'+n);
for(const n of ['scripts','ui'])fs.cpSync(artifact+'/'+n,rec+'/'+n,{recursive:true});
fs.copyFileSync(tmp+'/mods/2026-10-25_insolvency_four_steps.json',repo+'/mods/2026-10-25_insolvency_four_steps.json');
fs.mkdirSync(rec+'/evidence',{recursive:true});
for(const [name,folder]of[['native',tmp+'/native-final'],['play',tmp+'/play-verified'],['ui',tmp+'/ui-final']]){
 for(const ent of fs.readdirSync(folder,{withFileTypes:true}))if(ent.isFile()&&(/\.log$/i.test(ent.name)||['client-results.json','prepared.json'].includes(ent.name)))fs.copyFileSync(folder+'/'+ent.name,rec+'/evidence/'+name+'-'+ent.name);
}
for(const name of ['report.json','report.md'])fs.copyFileSync('G:/Codex/tmp/jo9-insolvency-release-20261025/run-Do9SKJ/'+name,rec+'/release-'+name);
const decodeMetric=t=>{try{return JSON.parse(t);}catch{try{return JSON.parse(decodeURIComponent(t));}catch{return t;}}};
const sc=require(repo+'/tools/qa/save-codec.cjs'),metrics={};
for(const [label,file]of[['chain',tmp+'/play-verified/chain-ending.sav'],['bill',tmp+'/play-verified/bill-finished.sav'],['manual',tmp+'/play-verified/manual-city.sav'],['slaveProfile',tmp+'/ui-final/slave-profile-ui.sav'],['assistantProfile',tmp+'/ui-final/assistant-profile-ui.sav']])if(fs.existsSync(file)){
 const s=sc.parse(fs.readFileSync(file));metrics[label]={money:sc.value(s,'sparks')[0],day:sc.value(s,'day')[0],estate:sc.value(s,'estate')[1],page:sc.value(s,'jo9_lq','page')[0],profile:decodeMetric(sc.value(s,'qa_profile_metrics')[1]),clicks:sc.value(s,'qa_dom_clicks')[0]};const arr=s.vars.find(v=>v.name==='QA_DOM_METRICS');if(arr)metrics[label].decisions=arr.values.map(v=>decodeMetric(v[1])).filter(Boolean);
}
write(rec+'/dom-metrics.json',metrics);
const result={status:'APPLIED_AND_VERIFIED',before:expectedBefore,after:expectedAfter,work:game+'/jack.qsp',backup,runtimeFiles:['jack.qsp',...resources.map(r=>r[0])],protectedFiles:protectedFiles.length,saveFilesPreserved:protectedFiles.filter(f=>/\.sav$/i.test(f.path)).length,verification:{release:release.verdict,officialEnginePaths:release.client.probes.length,nativePaths:native.length,nativePassed:native.filter(r=>r.pass).length,actualDomPaths:play.length,actualDomPassed:play.filter(r=>r.pass).length,profileAndCachePaths:ui.length,profileAndCachePassed:ui.filter(r=>r.pass).length,uiTestedBodiesUnchanged:true,patchReplayAndIdempotence:true},fullSynced:false,packaged:false,committed:false,pushed:false,limits:['Native diagnostic state priming and QtWebKit EXEC clicks do not prove every user save CRC or full-game quest chain.','Existing save files are unchanged; their test guides describe the older flow unless this new manual is consulted.']};
write(rec+'/FINAL_RESULT.json',result);write(artifact+'/FINAL_RESULT.json',result);console.log(JSON.stringify(result));
