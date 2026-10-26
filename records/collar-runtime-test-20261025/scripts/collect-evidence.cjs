'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const src='G:/Codex/tmp/jo9-collar-runtime-20261025/day',dest=__dirname;
const report=JSON.parse(fs.readFileSync(src+'/report.json','utf8'));
for(const name of Object.keys(report.snapshots))for(const stage of Object.keys(report.snapshots[name])){
 const file=src+'/'+name+'-'+stage+'.sav',s=sc.parse(fs.readFileSync(file));
 report.snapshots[name][stage].actor=Object.fromEntries(['id','age','obedience','stamina','passion_luxury','beaten','beaten_ever','calories','virtue','collar','ego','domini_dictum'].map(k=>[k,sc.value(s,'PRISONER',k)]));
 report.snapshots[name][stage].psyStatus=sc.value(s,'PRISONER_PSY_STATUS');
 report.snapshots[name][stage].goldenCollarInventory=sc.value(s,'PRISONER_INVENTORY','golden_collar');
 report.snapshots[name][stage].masterStrRate=sc.value(s,'MASTER_STR_RATE');
 report.snapshots[name][stage].snapshotSha256=c.hash(fs.readFileSync(file));
}
report.inputPreservation={
 workAfter:c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),
 saveAfter:c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_TEST_20261023_01_HOME.sav'))
};
a.equal(report.inputPreservation.workAfter,report.candidate);a.equal(report.inputPreservation.saveAfter,report.sourceSaveHash);
a.equal(report.status,'PASS');a.equal(report.results.length,4);a(report.results.every(x=>x.pass));
fs.writeFileSync(dest+'/report.json',JSON.stringify(report,null,2));
for(const name of report.results.map(x=>x.name)){
 const raw=fs.readFileSync(src+'/'+name+'-stderr.log');
 fs.writeFileSync(dest+'/'+name+'-stderr.log',raw);
 fs.writeFileSync(dest+'/'+name+'-stderr-utf8.log',new TextDecoder('euc-kr').decode(raw));
}
for(const file of ['plan.json','client-results.json'])fs.copyFileSync(src+'/'+file,dest+'/'+file);
console.log(JSON.stringify({status:report.status,results:report.results,inputPreservation:report.inputPreservation}));
