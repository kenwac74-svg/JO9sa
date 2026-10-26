'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',task='G:/Codex/tmp/profile-polish-20261025-r3',backup='G:/somi/JO9_work_backups/profile-polish-20261025-r3';
const c=require(repo+'/tools/text-workshop/core.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),hash=p=>c.hash(fs.readFileSync(p)),write=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');
const before='256293ff14b41ac19efd1bfb412f21066b227f86e1b61ea0e523820a86ebcb3a',after='38aaaaa5e7c424ec0f9b0b22f125bc2ca4966392ea42f982750375c4d982c0ed';
assert.equal(hash(game+'/jack.qsp'),before);assert.equal(hash(task+'/candidate.qsp'),after);
const reportRoot='G:/Codex/tmp/profile-polish-release-20261025-r3/run-p6b0VK';const release=read(reportRoot+'/report.json');assert.equal(release.verdict,'PASS');
assert.equal(read(task+'/native-ui-final/prepared.json').sourceHash,after);assert.equal(read(task+'/native-currency-final/prepared.json').sourceHash,after);
for(const [dir,count]of[['native-ui-final',5],['native-currency-final',3]]){const rows=read(task+'/'+dir+'/client-results.json');assert.equal(rows.length,count);assert(rows.every(r=>r.pass));}
assert.equal(read(__dirname+'/readonly-review.json').candidate,after,'Independent review must refer to final candidate');
assert.equal(read(__dirname+'/readonly-review.json').status,'STATIC_REVIEW_PASS');
const protectedFiles=read(__dirname+'/inputs.json');for(const p of protectedFiles)assert.equal(hash(p.path),p.sha256,'Input changed before install: '+p.path);
assert(!fs.existsSync(game+'/content/js/jo9_word_wrap.js'),'New runtime helper unexpectedly exists');
const backupsBefore=new Set(fs.readdirSync(game).filter(p=>p.startsWith('jack.qsp.bak_')));
const apply=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',task+'/mods'],{encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:8*1024*1024});
fs.writeFileSync(__dirname+'/apply.log',apply.stdout+'\n'+apply.stderr);assert.equal(apply.status,0,'WORK patch failed');assert.equal(hash(game+'/jack.qsp'),after);
const backups=fs.readdirSync(game).filter(p=>p.startsWith('jack.qsp.bak_')&&!backupsBefore.has(p));assert.equal(backups.length,1);assert.equal(hash(game+'/'+backups[0]),before);assert.equal(hash(backup+'/jack.qsp'),before);
// This is the automatically generated duplicate, not the only original recovery copy.
fs.unlinkSync(game+'/'+backups[0]);
fs.copyFileSync(__dirname+'/jo9_traits_view.css',game+'/css/jo9_traits_view.css');
fs.copyFileSync(__dirname+'/jo9_word_wrap.js',game+'/content/js/jo9_word_wrap.js',fs.constants.COPYFILE_EXCL);
for(const p of protectedFiles)if(p.path!==game+'/jack.qsp'&&p.path!==game+'/css/jo9_traits_view.css')assert.equal(hash(p.path),p.sha256,'Protected input changed after install: '+p.path);
for(const [rel,local]of[['css/jo9_traits_view.css','jo9_traits_view.css'],['content/js/jo9_word_wrap.js','jo9_word_wrap.js']])assert.equal(hash(game+'/'+rel),hash(__dirname+'/'+local));
const decode=t=>{for(let n=0;n<3;n++){try{return JSON.parse(t);}catch{try{t=decodeURIComponent(t);}catch{return t;}}}return t;};
const metrics={};for(const [label,file,key]of[
 ['slave','native-ui-final/slave-profile-ui.sav','QA_POLISH_METRICS'],['assistant','native-ui-final/assistant-profile-ui.sav','QA_POLISH_METRICS'],['gameover','native-ui-final/gameover-wrap-pass.sav','QA_WRAP_METRICS'],
 ['rumors','native-currency-final/rumor-fees.sav','QA_CURRENCY_METRICS'],['range','native-currency-final/range-price.sav','QA_CURRENCY_METRICS'],['liquidation','native-currency-final/liquidation-money.sav','QA_CURRENCY_METRICS'],
]){const d=sc.parse(fs.readFileSync(task+'/'+file));metrics[label]=decode(sc.value(d,key)[1]);}
write(__dirname+'/dom-metrics.json',metrics);
for(const [name,folder]of[['ui',task+'/native-ui-final'],['currency',task+'/native-currency-final']])for(const ent of fs.readdirSync(folder,{withFileTypes:true}))if(ent.isFile()&&(/\.log$/i.test(ent.name)||['client-results.json','prepared.json'].includes(ent.name)))fs.copyFileSync(folder+'/'+ent.name,__dirname+'/'+name+'-'+ent.name);
for(const name of ['report.json','report.md'])fs.copyFileSync(reportRoot+'/'+name,__dirname+'/release-'+name);
fs.copyFileSync(task+'/mods/2026-10-25_profile_polish_r3.json',repo+'/mods/2026-10-25_profile_polish_r3.json',fs.constants.COPYFILE_EXCL);
const result={status:'APPLIED_AND_VERIFIED',before,after,work:game,backup,runtimeFiles:['jack.qsp','css/jo9_traits_view.css','content/js/jo9_word_wrap.js'],verification:{release:'PASS',enginePaths:9,uiAndCache:5,currency:3,patchReplay:true,idempotent:true,independentReview:true},originalSavesPreserved:protectedFiles.filter(p=>/\.sav$/i.test(p.path)).length,protectedOtherFiles:protectedFiles.length-2,fullSynced:false,packaged:false,committed:false,pushed:false};
write(__dirname+'/FINAL_RESULT.json',result);
const record=repo+'/records/profile-polish-20261025-r3';assert(!fs.existsSync(record));fs.mkdirSync(record);
for(const ent of fs.readdirSync(__dirname,{withFileTypes:true})){if(ent.isFile())fs.copyFileSync(__dirname+'/'+ent.name,record+'/'+ent.name,fs.constants.COPYFILE_EXCL);}
console.log(JSON.stringify(result));
