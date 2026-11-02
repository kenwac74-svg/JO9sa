'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const task=__dirname,root='G:/Codex/tmp/coldef-routing-baseline-control-20261029';
const source='G:/Codex/tmp/coldef-routing-finalgate-20261029/run-xWgL6V/client';
const baseline='G:/Codex/tmp/coldef-routing-20261029/baseline.qsp';
const names=['newgame','cache'],j=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const hash=p=>c.hash(fs.readFileSync(p));
const reportPath=path.join(task,'baseline-control-report.json');
if(process.argv[2]==='prepare'){
 a.equal(path.dirname(path.resolve(root)).toLowerCase(),path.resolve('G:/Codex/tmp').toLowerCase());
 a(!fs.existsSync(root),'Require fresh task-owned diagnostic directory');
 const realParent=fs.realpathSync(path.dirname(root));a.equal(realParent.toLowerCase(),path.resolve('G:/Codex/tmp').toLowerCase());
 const raw=fs.readFileSync(baseline),b=c.parse(raw),bl=b.locations.find(l=>l.name==='interaction_city');a(bl);
 const plan=j(source+'/plan.json').filter(p=>names.includes(p.name));a.equal(plan.length,2);
 const protectedInputs=[baseline,source+'/plan.json',source+'/config.xml',source+'/FastQSP.ini',...names.map(n=>source+'/'+n+'.qsp')].map(p=>({path:p,sha256:hash(p)}));
 fs.mkdirSync(root);
 const fixtures=[];
 for(const p of plan){
  const original=fs.readFileSync(p.file),d=c.parse(original),l=d.locations.find(l=>l.name==='interaction_city');a(l);
  const originalBody=d.lines[l.body];a.notEqual(originalBody,b.lines[bl.body]);d.lines[l.body]=b.lines[bl.body];
  const control=c.serialize(d),roundtrip=c.parse(control);a(c.serialize(roundtrip).equals(control));
  const sourceDoc=c.parse(original),changed=[];for(let i=0;i<d.lines.length;i++)if(d.lines[i]!==sourceDoc.lines[i])changed.push(i);a.deepEqual(changed,[l.body]);
  const file=root+'/'+p.name+'.qsp';fs.writeFileSync(file,control);p.file=file;
  fixtures.push({name:p.name,sourceSha256:c.hash(original),controlSha256:c.hash(control),onlyChangedField:'interaction_city.body',baselineBodyExact:true,allDiagnosticInstrumentationPreserved:true});
 }
 for(const name of ['config.xml','FastQSP.ini'])fs.copyFileSync(source+'/'+name,root+'/'+name);
 fs.symlinkSync(fs.realpathSync(source+'/json'),root+'/json','junction');
 fs.writeFileSync(root+'/plan.json',JSON.stringify(plan,null,2)+'\n');
 fs.writeFileSync(reportPath,JSON.stringify({schema:1,status:'PREPARED',scope:'Two matching failed diagnostic probes with only the coldef body restored from pre-patch baseline',root,source,baselineSha256:c.hash(raw),protectedInputs,fixtures,limits:['Does not change the candidate, game, user saves, feature, smoke tool, or expected completion criteria.','Expected version notice is still a smoke failure; this control only establishes whether it predates the patch.']},null,2)+'\n');
 console.log('Prepared baseline control: '+root);
}else if(process.argv[2]==='collect'){
 const report=j(reportPath),results=j(root+'/client-results.json');a.equal(results.length,2);
 const messages=s=>[...s.matchAll(/showMessage\(\), str:\s*"([^"\r\n]*)"/g)].map(m=>m[1]);
 const cases=[];
 for(const n of names){
  const oldLog=fs.readFileSync(source+'/'+n+'-stderr.log','utf8'),log=fs.readFileSync(root+'/'+n+'-stderr.log','utf8');
  fs.writeFileSync(task+'/baseline-control-'+n+'-stderr.log',log);
  const oldMessages=messages(oldLog),controlMessages=messages(log),r=results.find(r=>r.name===n);a(r);
  a.equal(r.pass,false);a.equal(r.reason,'Unexpected message before completion');a.equal(oldMessages.length,1);a.deepEqual(controlMessages,oldMessages);
  a(/v2\.3\.2\.5[\s\S]*v2\.4/.test(controlMessages[0]),'Expected same version update notice');
  cases.push({...r,sameUnexpectedMessageAsCandidate:true,versionUpdateNotice:controlMessages[0],completionReached:false});
 }
 for(const p of report.protectedInputs)a.equal(hash(p.path),p.sha256,'Protected input changed '+p.path);
 report.status='PREEXISTING_MESSAGE_REPRODUCED';report.diagnosisConfirmed=true;report.results=cases;report.protectedInputsUnchanged=true;report.initialCandidateGateStatusRemains='FAIL';
 report.conclusion='The two initial candidate smoke failures reproduce with the original interaction_city body and identical test instrumentation. Both stop on the same legacy version update notice, before completion. No completion criterion or code was changed to suppress it.';
 fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:cases.map(x=>({name:x.name,pass:x.pass,reason:x.reason,sameUnexpectedMessageAsCandidate:x.sameUnexpectedMessageAsCandidate})),protectedInputsUnchanged:true}));
}else throw Error('Use prepare or collect');
