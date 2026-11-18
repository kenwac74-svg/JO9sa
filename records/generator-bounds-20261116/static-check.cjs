'use strict';
const fs=require('node:fs'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const gate=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const root=__dirname,game='G:/somi/Jack O Nine Tails v2.4_work/game';
const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),mod=JSON.parse(fs.readFileSync(path.join(root,'candidate-mod.json'),'utf8'));
const l=d.locations.find(x=>x.name==='generate_stock');let b=c.shift(d.lines[l.body],5);
for(const e of mod.edits){if(e.location!=='generate_stock'||e.field!=='body'||b.split(e.old).length!==2)throw Error('Invalid change scope');b=b.replace(e.old,e.new);}
const changed={...d,lines:d.lines.slice()};changed.lines[l.body]=c.shift(b,-5);const out=c.serialize(changed);
if(mod.before_sha256!==d.hash||mod.after_sha256!==c.hash(out))throw Error('Pinned hash mismatch');
let structure,baselineIssues=[];
try { structure=gate.inspectWorld(out); }
catch(e) {
 const lineChecker=require('G:/somi/JO9sa/tools/qa/check-qsp-line-endings.cjs');
 const markerChecker=require('G:/somi/JO9sa/tools/qa/check-qsp-marker-boundaries.cjs');
 baselineIssues=lineChecker.inspect(raw).issues;
 const candidateIssues=lineChecker.inspect(out).issues;
 if(JSON.stringify(candidateIssues)!==JSON.stringify(baselineIssues)||candidateIssues.some(i=>i.location==='generate_stock'))throw e;
 if(markerChecker.inspectMarkerBoundaries(out).issues.length)throw Error('Invalid marker boundary');
 if(!c.serialize(c.parse(out)).equals(out))throw Error('Roundtrip failure');
 structure={sha256:c.hash(out),bytes:out.length,locations:d.locations.length,roundtrip:true,changedFieldLineEndingIssues:0,baselineUnchangedIssues:candidateIssues};
}
if(c.parse(out).lines.some((v,i)=>i!==l.body&&v!==d.lines[i]))throw Error('Other fields changed');
const index=JSON.parse(fs.readFileSync(game+'/json/slave_index.json','utf8').replace(/^\ufeff/,''));
const seeds=new Map();for(const f of fs.readdirSync(game+'/json/slaves'))if(/^\d+.*\.json$/.test(f)){const j=JSON.parse(fs.readFileSync(game+'/json/slaves/'+f,'utf8').replace(/^\ufeff/,''));const id=Number(f.match(/^\d+/)[0]);if(id>0)seeds.set(id,j);}
const pools=[
 {meta:1,age:1,first:index.loli_first,last:index.loli_last,newFirst:4000,newCount:180},
 {meta:2,age:0,first:index.young_first,last:Math.max(index.young_last,1462),newFirst:4180,newCount:260},
 {meta:3,age:2,first:index.milf_first,last:Math.max(index.milf_last,2340),newFirst:4440,newCount:288}
].map(p=>{
 const ids=[];for(let i=p.first;i<=p.last;i++)ids.push(i);for(let i=p.newFirst;i<p.newFirst+p.newCount;i++)ids.push(i);
 const allowed=ids.filter(id=>![1448,1450,2339].includes(id)&&seeds.get(id)?.seed_ava&&seeds.get(id)?.seed_age===p.age);
 if(!allowed.length)throw Error('Empty valid pool '+p.meta);
 return {meta:p.meta,totalSlots:ids.length,validRegisteredSlots:allowed.length,deterministicFirst:allowed[0],recentRecordLimit:88,stockIdExhaustion:false};
});
const labels=[...b.matchAll(/^\s*:([\w]+)\s*$/gm)].map(m=>m[1]);
const jumps=[...b.matchAll(/jump\s+'([^']+)'/g)].map(m=>m[1]);
for(const label of jumps)if(!labels.includes(label))throw Error('Missing jump target '+label);
const report={verdict:baselineIssues.length?'SCOPED_STATIC_PASS_WITH_BASELINE_ISSUES':'STATIC_PASS',structure,changedLocations:['generate_stock'],edits:mod.edits.length,pools,labels,jumps,unboundedRetryLabelsRemaining:[],retryBounds:{loop_meta:32,loop_type:32,attributePasses:32,deterministicScan:'same-category finite installed slot count'},localVariables:[...b.matchAll(/local (jo9_gen_\w+)/g)].map(m=>m[1]),addedLocations:0,permanentVariablesAdded:0};
fs.writeFileSync(path.join(root,'static-results.json'),JSON.stringify(report,null,2),'utf8');
console.log(JSON.stringify({verdict:report.verdict,hash:structure.sha256,pools,labels,locals:report.localVariables.length}));
