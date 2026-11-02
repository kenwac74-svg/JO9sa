'use strict';
// Install only after the final official and focused native reports both pass.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',rec=repo+'/records/battle-ui-test-v01-20261027',tmp='G:/Codex/tmp/battle-ui-v01-20261027',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(repo+'/tools/text-workshop/core.cjs'),j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),before=j(rec+'/before.json'),candidate=j(rec+'/candidate.json');
const official=j(tmp+'/official/run-sSUFf7/report.json'),focused=j(tmp+'/native-final/native-ui-results.json');
a.equal(official.verdict,'PASS');a.equal(focused.status,'PASS');a.equal(focused.hashes.candidate,candidate.qsp);
a.equal(c.hash(fs.readFileSync(work+'/jack.qsp')),before.qsp);a.equal(c.hash(fs.readFileSync(work+'/css/base.css')),before.css);a.equal(c.hash(fs.readFileSync(repo+'/assets/css-2.4/base.css')),before.css);
a.equal(c.hash(fs.readFileSync(candidate.candidate)),candidate.qsp);a.equal(c.hash(fs.readFileSync(tmp+'/game/css/base.css')),candidate.css);
const installedAsset=work+'/'+candidate.asset,sourceAsset=repo+'/resources/new/'+candidate.asset;
a(!fs.existsSync(installedAsset),'Unexpected existing asset; do not overwrite');a(!fs.existsSync(sourceAsset),'Unexpected existing source asset; do not overwrite');
const oldBackups=new Set(fs.readdirSync(work).filter(x=>x.startsWith('jack.qsp.bak_')));
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',work+'/jack.qsp','-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true,timeout:60000});a.equal(run.status,0,run.stdout+run.stderr);a.equal(c.hash(fs.readFileSync(work+'/jack.qsp')),candidate.qsp);
for(const dst of [work+'/css/base.css',repo+'/assets/css-2.4/base.css'])fs.copyFileSync(tmp+'/game/css/base.css',dst);
for(const dst of [installedAsset,sourceAsset]){fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(tmp+'/game/'+candidate.asset,dst);}
a.equal(c.hash(fs.readFileSync(work+'/css/base.css')),candidate.css);
// The apply tool creates another identical pre-change QSP. Keep the named external backup only.
const redundant=fs.readdirSync(work).filter(x=>x.startsWith('jack.qsp.bak_')&&!oldBackups.has(x));
for(const n of redundant){const f=path.resolve(work,n);a.equal(path.dirname(f),path.resolve(work));a.equal(c.hash(fs.readFileSync(f)),before.qsp);a.equal(c.hash(fs.readFileSync(before.backup+'/jack.qsp')),before.qsp);fs.unlinkSync(f);}
fs.copyFileSync(tmp+'/official/run-sSUFf7/report.json',rec+'/official-results.json');
fs.copyFileSync(tmp+'/native-final/native-ui-results.json',rec+'/native-ui-results.json');
fs.copyFileSync(tmp+'/native-red/native-ui-results.json',rec+'/baseline-red-results.json');
fs.copyFileSync(__filename,rec+'/scripts/install.cjs');
fs.copyFileSync(path.join(__dirname,'PLAN_KO.md'),rec+'/PLAN_KO.md');
fs.copyFileSync(path.join(__dirname,'MANUAL_KO.md'),rec+'/MANUAL_KO.md');
const report={status:'APPLIED',work,qsp:candidate.qsp,css:candidate.css,asset:candidate.asset,backup:before.backup,official:official.verdict,focused:focused.status,focusedCases:focused.scenarioCount,saveFilesModified:0,fullFolderModified:false,commit:false,push:false,redundantBackupsRemoved:redundant};
fs.writeFileSync(rec+'/applied.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
