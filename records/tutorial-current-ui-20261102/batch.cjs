'use strict';
// One disposable QSP, independent native engine processes, no chained-screen stack.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),n=require('./native.cjs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const O=__dirname,phase=process.argv[2],source=process.argv[3];delete process.env.JO9_TUTORIAL_ONLY;
const p=n.prepare(phase,source),dir=path.dirname(p.plan),plan=JSON.parse(fs.readFileSync(p.plan)),d=c.parse(fs.readFileSync(plan[0].file));
const body=name=>c.shift(d.lines[d.locations.find(x=>x.name===name).body],5),set=(name,text)=>{d.lines[d.locations.find(x=>x.name===name).body]=c.shift(text,-5);};
const start=body('Start'),next=body('qa_next_case');assert(next.includes('if qa_case>'+p.cases.length+':'));set('qa_next_case',next.replace('if qa_case>'+p.cases.length+':','if qa_case>qa_end_case:'));
const filter=process.env.JO9_TUTORIAL_CASES?.split(','),results=[];fs.mkdirSync(O+'/cases',{recursive:true});
for(let i=1;i<=p.cases.length;i++){
 const name=p.cases[i-1].name;if(filter&&!filter.includes(name))continue;
 set('Start',start.replace('qa_case=0','qa_case='+(i-1)+'\r\nqa_end_case='+i));const raw=c.serialize(d);if(!results.length)qa.inspectWorld(raw);fs.writeFileSync(plan[0].file,raw);
 if(fs.existsSync(dir+'/result.sav'))fs.unlinkSync(dir+'/result.sav');
 n.run(phase);const report=JSON.parse(fs.readFileSync(O+'/'+phase+'-report.json'));report.caseName=name;report.prepared={...p,cases:[p.cases[i-1]],caseIndex:i};
 if(report.html&&report.html[i])fs.writeFileSync(O+'/cases/'+phase+'-'+name+'.html',report.html[i]);
 fs.writeFileSync(O+'/cases/'+phase+'-'+name+'-report.json',JSON.stringify(report,null,2)+'\n');
 results.push(report);process.exitCode=0;console.log(JSON.stringify({phase,caseName:name,completed:report.completed,checks:report.checks,failures:report.failures}));
}
const total={phase,cases:results.length,sourceSha256:p.sourceSha256,fixture:p.publicFixture,fixtureSha256:p.publicFixtureSha256,css:p.css,completed:results.every(x=>x.completed),checks:results.reduce((a,x)=>a+(x.checks||0),0),failures:results.reduce((a,x)=>a+(x.failures||0),0),results:results.map(x=>({name:x.caseName,completed:x.completed,checks:x.checks,failures:x.failures,failedKeys:x.failedKeys}))};total.pass=total.completed&&total.failures===0;fs.writeFileSync(O+'/'+phase+'-batch-report.json',JSON.stringify(total,null,2)+'\n');console.log(JSON.stringify(total));if(!total.completed||phase==='green'&&!total.pass)process.exitCode=1;
