'use strict';
// JO9 MOD START WONG_GUILD_NOTICE_WORK_ADOPTION_20261030
const fs=require('fs'),path=require('path'),cp=require('child_process'),zlib=require('zlib'),a=require('assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',id='wong-guild-dialogue-fix-20261030';
const c=require(repo+'/tools/text-workshop/core.cjs'),ct=require(repo+'/tools/text-workshop/catalog.cjs');
const read=p=>fs.readFileSync(p),j=p=>JSON.parse(read(p)),sha=p=>c.hash(read(p)),v=j(here+'/path.json');
const rec=repo+'/records/'+id,backup='G:/somi/JO9_work_backups/'+id,qp=work+'/jack.qsp',planp=repo+'/records/full-client-preparation-20261029/full-client-input-plan.json';
const releaseRoot='G:/Codex/tmp/jo9-wong-release-20261030';
const reports=fs.readdirSync(releaseRoot).map(x=>releaseRoot+'/'+x+'/report.json').filter(p=>fs.existsSync(p));a.equal(reports.length,1);
const release=j(reports[0]),native=j(here+'/native/results-final.json'),independent=j(here+'/independent-review.json');
a.equal(release.verdict,'PASS');a(release.checks.filter(x=>x.required).every(x=>x.status==='PASS'));a(independent.pass);
a(native.allRequiredCasesPass);a.equal(native.normalNativeCases,5);a.equal(native.fatalNativeCases,1);a(native.normalCases.every(x=>x.pass),'All normal Wong native cases required');
a(native.fatalCase.pass);a.equal(native.before.candidate,v.candidateSha256);a.equal(native.after.candidate,v.candidateSha256);
a.equal(sha(qp),v.beforeSha256,'Concurrent WORK edit; refuse overwrite');a.equal(sha(v.candidate),v.candidateSha256);a.equal(sha(v.stateSave),v.saveSha256);
a(!fs.existsSync(backup),'Already installed or backed up; inspect before repeating');
const modDest=repo+'/mods/'+path.basename(v.patch);a(!fs.existsSync(modDest),'Existing patch record; inspect before replacing');
const planRaw=read(planp),plan=j(planp);a.equal(plan.qspSha256,v.beforeSha256);const target=plan.files.find(x=>x.path==='game/jack.qsp');a(target);a.equal(target.sha256,v.beforeSha256);
const priorBak=new Set(fs.readdirSync(work).filter(x=>x.startsWith('jack.qsp.bak_')));
if(!process.argv.includes('--apply')){console.log(JSON.stringify({status:'PREFLIGHT_PASS',nativeCases:6,clientSmoke:release.client.probes.length,changedLocations:v.changedLocations}));process.exit(0);}
fs.mkdirSync(backup,{recursive:true});fs.mkdirSync(rec,{recursive:true});
a.equal(fs.realpathSync(backup).toLowerCase(),path.resolve(backup).toLowerCase(),'Backup directory must resolve to the intended path');
fs.writeFileSync(backup+'/full-client-input-plan.before.json.gz',zlib.gzipSync(planRaw,{level:9}),{flag:'wx'});
const installation={id,status:'APPLYING',approval:v.approval,dateKST:v.dateKST,before:v.beforeSha256,after:v.candidateSha256,workQsp:qp,backup:backup+'/before.qsp',patch:modDest,sourceSave:v.stateSave,saveBeforeSha256:v.saveSha256,saveWrites:false,fullSynced:false,commitPush:false,changedLocations:v.changedLocations,newLocations:0,newPersistentVariables:0,planBackup:backup+'/full-client-input-plan.before.json.gz'};
const save=()=>fs.writeFileSync(rec+'/installation.json',JSON.stringify(installation,null,2));save();
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',qp,'-ModsDir',v.mods],{windowsHide:true,encoding:'utf8',timeout:120000,maxBuffer:1000000});
fs.writeFileSync(here+'/work-apply.log',run.stdout+'\n'+run.stderr);a.equal(run.status,0,'Native patch application failed; inspect work-apply.log');a.equal(sha(qp),v.candidateSha256);
const newBaks=fs.readdirSync(work).filter(x=>x.startsWith('jack.qsp.bak_')&&!priorBak.has(x));a.equal(newBaks.length,1,'Expected one exact pre-edit backup');
const original=path.resolve(work,newBaks[0]);a.equal(path.dirname(original).toLowerCase(),path.resolve(work).toLowerCase());a(/^jack\.qsp\.bak_\d{8}_\d{6}$/.test(path.basename(original)));a.equal(sha(original),v.beforeSha256);
// Native same-volume rename moves the only recovery copy outside the runtime folder.
const beforePath=path.resolve(backup,'before.qsp');a(beforePath.toLowerCase().startsWith(path.resolve(backup).toLowerCase()+path.sep));a(!fs.existsSync(beforePath));fs.renameSync(original,beforePath);a.equal(sha(beforePath),v.beforeSha256);
fs.copyFileSync(v.patch,modDest,fs.constants.COPYFILE_EXCL);a.equal(sha(v.patch),sha(modDest));
a(read(planp).equals(planRaw),'Concurrent input-plan edit; QSP applied but plan needs review');
target.bytes=fs.statSync(qp).size;target.sha256=v.candidateSha256;plan.qspSha256=v.candidateSha256;plan.summary.includedBytes=plan.files.reduce((n,x)=>n+x.bytes,0);
ct.atomic(planp,JSON.stringify(plan,null,2)+'\n');
a.equal(sha(v.stateSave),v.saveSha256);installation.status='INSTALLED';installation.saveAfterSha256=sha(v.stateSave);installation.nativeCases=6;installation.clientSmoke=9;installation.independentReview=true;installation.fullClientInputPlanUpdated=true;save();
fs.mkdirSync(here+'/release-check',{recursive:true});
for(const name of ['report.json','report.md','patch-replay.log','patch-reapply.log','client-runner.log']){const src=path.dirname(reports[0])+'/'+name;if(fs.existsSync(src))fs.copyFileSync(src,here+'/release-check/'+name);}
const client=path.dirname(reports[0])+'/client';if(fs.existsSync(client))for(const name of fs.readdirSync(client))if(/(?:-stderr\.log|-stdout\.log|client-results\.json|plan\.json)$/.test(name))fs.copyFileSync(client+'/'+name,here+'/release-check/'+name);
fs.writeFileSync(here+'/installation.json',JSON.stringify(installation,null,2));console.log(JSON.stringify({status:'INSTALLED',after:v.candidateSha256,backup:beforePath,patch:modDest,nativeCases:6,clientSmoke:9,saveUnchanged:true}));
// JO9 MOD END WONG_GUILD_NOTICE_WORK_ADOPTION_20261030
