'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const dir='G:/Codex/tmp/jo9-auction-consignment-tests-20261028',root=path.resolve(dir);assert.equal(root.toLowerCase(),'g:\\codex\\tmp\\jo9-auction-consignment-tests-20261028');assert(!fs.lstatSync(root).isSymbolicLink());
const runs=['red','guard-zero','guard-faint','green-transactions','green-callers','green-panel','real-price-baseline','real-price-candidate'];
const removable=new Set(['client-results.json','FastQSP.ini',...runs.flatMap(n=>[n+'.qsp',n+'-plan.json'])]);
const removed=[],retained=[],skippedLinks=[];
for(const e of fs.readdirSync(root,{withFileTypes:true})){
 const p=path.resolve(root,e.name);assert.equal(path.dirname(p).toLowerCase(),root.toLowerCase());const st=fs.lstatSync(p);
 if(st.isSymbolicLink()){skippedLinks.push(e.name);continue;}
 if(st.isDirectory()){assert.equal(e.name,'save');retained.push({name:e.name+'/',directory:true,entries:fs.readdirSync(p).length});continue;}
 assert(st.isFile());
 if(removable.has(e.name)){
  const bytes=fs.readFileSync(p);if(e.name.endsWith('.qsp'))c.parse(bytes);if(e.name.endsWith('.json'))JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));
  removed.push({name:e.name,bytes:st.size,sha256:c.hash(bytes)});
 }else{assert(/\.(sav|log)$/i.test(e.name),'Preserve unknown file and stop: '+e.name);retained.push({name:e.name,bytes:st.size,sha256:c.hash(fs.readFileSync(p))});}
}
for(const x of removed)fs.unlinkSync(path.join(root,x.name));
for(const x of retained)if(!x.directory)assert.equal(c.hash(fs.readFileSync(path.join(root,x.name))),x.sha256,'Preserved output changed '+x.name);
const report={status:'PASS',root,removedFiles:removed.length,reclaimedBytes:removed.reduce((n,x)=>n+x.bytes,0),removed,retainedSaveFiles:retained.filter(x=>/\.sav$/i.test(x.name)).length,retainedLogFiles:retained.filter(x=>/\.log$/i.test(x.name)).length,retained,linksSkipped:skippedLinks,originalSavesOrBackupsTargeted:false,onlyDiagnosticQspPlansAndConfigDeleted:true};
fs.writeFileSync(path.join(__dirname,'cleanup.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,removedFiles:report.removedFiles,reclaimedBytes:report.reclaimedBytes,retainedSaveFiles:report.retainedSaveFiles,retainedLogFiles:report.retainedLogFiles,remainingDirectory:root,linksSkipped:skippedLinks.length}));
