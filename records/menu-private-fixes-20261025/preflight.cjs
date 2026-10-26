'use strict';
// Read-only final input audit. Never restores, rewrites, moves or deletes any input.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const artifact=__dirname,inputs=JSON.parse(fs.readFileSync(artifact+'/inputs.json','utf8').replace(/^\uFEFF/,''));
const canonical=p=>path.resolve(p).toLowerCase(),work='G:/somi/Jack O Nine Tails v2.4_work/game';
function inspect(file,expected){
 try{
  const before=fs.statSync(file),hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),after=fs.statSync(file);
  const stable=before.size===after.size&&before.mtimeMs===after.mtimeMs;
  return {path:file,expected,actual:hash,bytes:after.size,stableDuringRead:stable,status:!stable?'CHANGED_DURING_READ':hash===expected?'MATCH':'CHANGED'};
 }catch(error){return {path:file,expected,status:error.code==='ENOENT'?'MISSING':'UNREADABLE',error:error.code||String(error)};}
}
const rows=inputs.map(x=>inspect(x.path,x.sha256));
const originals=[
 {path:'G:/somi/JO9O/game/jack.qsp',sha256:'26e15aaf30b6226a2883c6b532a6ee4eed34791110618597d234bb7d6fa3e052'},
 {path:'G:/somi/JO9sa/source/jack_2026-10-01.qsp',sha256:'59e1a1afb4fdd2e9bf9b1ffdcb12c10f2f4cc15d4cd3d890e21f8cb652f5958e'},
].map(x=>inspect(x.path,x.sha256));
const source=rows.find(x=>canonical(x.path)===canonical(work+'/jack.qsp'));
const css=rows.find(x=>canonical(x.path)===canonical(work+'/css/base.css'));
const saves=rows.filter(x=>/\.sav$/i.test(x.path)),known=new Set(saves.map(x=>canonical(x.path))),extraSaves=[],skippedLinks=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isSymbolicLink()){skippedLinks.push(p);continue;}if(e.isDirectory())walk(p);else if(e.isFile()&&/\.sav$/i.test(p)&&!known.has(canonical(p)))extraSaves.push(p);}}
walk(work+'/save');
const issues=[...rows,...originals].filter(x=>x.status!=='MATCH');
const report={status:issues.length?'INPUT_CHANGES_DETECTED':'PASS',protectedInputCount:inputs.length,protectedMatches:rows.filter(x=>x.status==='MATCH').length,existingSaveCount:saves.length,existingSavesMatched:saves.filter(x=>x.status==='MATCH').length,workSource:source,workCss:css,protectedOriginalSources:originals,allProtectedInputs:rows,additionalSavesPreserved:extraSaves,skippedLinks,issues,mutation:false,note:'No original, user save, runtime, setting or backup is changed. Differences are reported only; no restoration or cleanup is attempted.'};
fs.writeFileSync(artifact+'/FINAL_RUNTIME_PREFLIGHT.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:report.status,protected:report.protectedInputCount,matches:report.protectedMatches,saves:report.existingSaveCount,savesMatched:report.existingSavesMatched,originalSourcesMatched:originals.filter(x=>x.status==='MATCH').length,workSource:source?.actual,workCss:css?.actual,additionalSaves:extraSaves.length,issues:issues.map(x=>({path:x.path,status:x.status})),mutation:false}));
if(issues.length)process.exitCode=2;
