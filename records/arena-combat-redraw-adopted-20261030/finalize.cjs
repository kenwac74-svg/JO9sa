'use strict';
const fs=require('fs'),a=require('assert/strict'),crypto=require('crypto');
const here=__dirname,repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',rec=repo+'/records/arena-combat-redraw-adopted-20261030';
const read=p=>fs.readFileSync(p),sha=p=>crypto.createHash('sha256').update(read(p)).digest('hex');
const r=JSON.parse(read(rec+'/installation.json')),audit=JSON.parse(read(here+'/independent-verification.json')),live=JSON.parse(read(here+'/live-verification.json'));
a(audit.pass&&live.pass);a.equal(audit.checks.length,15);a(audit.checks.every(x=>x.pass));a.equal(live.matchingPngFiles,43);
for(const f of r.files){a.equal(sha(game+'/'+f.path),f.after);a.equal(sha(repo+'/resources/new/'+f.path),f.after);}
for(const [p,h] of Object.entries(r.protectedHashes))a.equal(sha(p),h);
for(const name of ['REPORT_KO.md','prepare_adoption.py','independent_audit.py','independent-verification.json','verify_live.cjs','live-verification.json','finalize.cjs'])fs.copyFileSync(here+'/'+name,rec+'/'+name);
r.verification={pass:true,independentChecks:15,httpPngFiles:43,size:[795,596],opaque:true,actualGameplay:false};
r.portableSeedUpdated=true;r.fullClientInputPlanUpdated=true;
fs.writeFileSync(rec+'/installation.json',JSON.stringify(r,null,2));
const sidecar={adopted:true,adoptedAt:r.created,approval:r.approval,record:rec+'/installation.json',files:43,subjects:22,standing:22,defeat:21,selectedPaths:r.files.map(f=>f.path),blockedRetained:r.blockedRetained,note:'Review ZIP, HTML and metadata are immutable review snapshots; this sidecar records subsequent WORK adoption.'};
fs.writeFileSync(here.replace('arena-combat-redraw-adopted-20261030','arena-combat-redraw-20261030')+'/WORK_ADOPTION.json',JSON.stringify(sidecar,null,2));
console.log(JSON.stringify({status:'VERIFIED_AND_RECORDED',files:43,standing:22,defeat:21,independentChecks:15,httpPngFiles:43,qspUnchanged:true,report:rec+'/REPORT_KO.md'}));
