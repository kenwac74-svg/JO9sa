'use strict';
const fs=require('fs'),a=require('assert/strict'),crypto=require('crypto');
const here=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/catfight-combat-adopted-20261030';
const read=p=>fs.readFileSync(p),sha=p=>crypto.createHash('sha256').update(read(p)).digest('hex');
const r=JSON.parse(read(rec+'/installation.json')),audit=JSON.parse(read(here+'/independent-verification.json')),live=JSON.parse(read(here+'/live-verification.json')),archive=JSON.parse(read(here+'/original-archive-final-verification.json'));
a.equal(r.status,'INSTALLED');a(audit.pass&&live.pass&&archive.pass);a(audit.checks.length>=12&&audit.checks.every(x=>x.pass));a.equal(live.matchingPngFiles,6);
for(const f of r.files){a.equal(sha(game+'/'+f.path),f.after);a.equal(sha(repo+'/resources/new/'+f.path),f.after);if(f.before)a.equal(sha(f.beforePath),f.before);}
for(const [p,h] of Object.entries(r.protectedHashes))a.equal(sha(p),h);
a(!fs.existsSync(game+'/content/pic/mob/gladiatrix1.png.jo9-stage-20261030'),'Temporary WORK stage remains');
for(const name of ['REPORT_KO.md','prepare_adoption.py','independent_audit.py','independent-verification.json','verify_live.cjs','live-verification.json','original-archive-final-verification.json','finalize.cjs'])fs.copyFileSync(here+'/'+name,rec+'/'+name);
for(const name of ['preliminary-independent-verification.json','concurrent-change-evidence.json'])if(fs.existsSync(here+'/'+name))fs.copyFileSync(here+'/'+name,rec+'/'+name);
r.verification={pass:true,independentChecks:audit.checks.length,httpPngFiles:6,size:[795,596],opaque:true,actualGameplay:false,originalArchiveVerified:true};
r.portableSeedUpdated=true;r.fullClientInputPlanUpdated=true;
fs.writeFileSync(rec+'/installation.json',JSON.stringify(r,null,2));
const sidecar={adopted:true,adoptedAt:r.created,approval:r.approval,record:rec+'/installation.json',files:6,subjects:3,standing:3,defeat:3,selectedPaths:r.files.map(f=>f.path),originalArchive:r.originalArchive,note:'Review ZIP, HTML and metadata remain immutable review snapshots; this sidecar records subsequent approved WORK adoption.'};
fs.writeFileSync(here.replace('catfight-combat-adopted-20261030','catfight-combat-redraw-20261030')+'/WORK_ADOPTION.json',JSON.stringify(sidecar,null,2));
console.log(JSON.stringify({status:'VERIFIED_AND_RECORDED',files:6,standing:3,defeat:3,independentChecks:audit.checks.length,httpPngFiles:6,qspUnchanged:true,report:rec+'/REPORT_KO.md'}));
