'use strict';
// Re-analyze the existing native engine logs, decoding Qt's encoded EXEC URL.
// Does not generate a new fixture or launch a new engine process.
const fs=require('fs'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const here=__dirname,p=here+'/results.json',r=JSON.parse(fs.readFileSync(p));
for(const x of r.results){
 const log=fs.readFileSync(here+'/'+x.name+'-stderr.log','utf8');
 const m=log.match(/showMessage\(\), str:\s*"(JO9_QA_WONG_[^"\r\n]+)"/);assert(m,x.name+' native marker missing');
 x.rawMarker=m[1];x.marker=decodeURIComponent(m[1]);
 const fields=Object.fromEntries(x.marker.split('|').slice(1).map(z=>z.split('=')));x.observed=fields;
 assert.equal(fields.REP,'40');assert.equal(fields.ILL,'0');assert.equal(fields.PARA,'0');assert.equal(fields.GUARD,'1');assert.equal(fields.NPC,'master_vong');assert.equal(fields.TXT2LEN,'3');assert.equal(fields.EVENTS,'1');assert.equal(fields.WONG,'1');
 if(x.name==='baseline'){assert.equal(fields.DOMLEN,'0');assert.equal(fields.LINE1,'0');assert.equal(fields.LINE2,'0');}
 else{assert(Number(fields.DOMLEN)>0);assert.equal(fields.LINE1,'1');assert.equal(fields.LINE2,'1');assert.equal(fields.CLIENTHEIGHT,fields.SCROLLHEIGHT);assert.equal(fields.CLIENTWIDTH,fields.SCROLLWIDTH);}
 x.pass=true;x.reason='';
}
r.after={qsp:c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),save:c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_GOLD_AP_CHECK_20261026.sav'))};assert.deepEqual(r.after,r.before);
r.sourceUnchanged=true;r.exit=0;r.nativeRuns=2;r.analysisCorrection='The native EXEC URL encoded separators as %7C. Both original showMessage markers were captured; decodeURIComponent is applied before assertion. No native rerun or alternate evidence is used.';
fs.writeFileSync(p,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({pass:true,nativeRuns:2,sourceUnchanged:true,results:r.results}));
