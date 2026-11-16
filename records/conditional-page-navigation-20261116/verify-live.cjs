'use strict';
const fs=require('node:fs'),a=require('node:assert/strict');
const root='G:/somi/JO9sa/tools/text-workshop';
const core=require(root+'/core.cjs');
const doc=core.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const entries=core.entries(doc),menu=entries.find(e=>e.location==='jo9_slave_death'&&/jo9_sd_choice\s*=\s*1\b/.test(e.text));
const base='http://127.0.0.1:3813';
(async()=>{
 const response=await fetch(base+'/'),html=await response.text();
 a.equal(response.status,200);
 const token=html.match(/const token='([a-f0-9]+)'/)?.[1];a(token,'session token available');
 async function api(url,data){const r=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json','X-JO9-Token':token,Origin:base},body:JSON.stringify(data)});const result=await r.json();a.equal(r.status,200,result.error);return result;}
 const context=await api('/api/context',{selection:{...menu,hash:doc.hash},mode:'text'});
 a.equal(context.flow.kind,'pages');a.equal(context.flow.stages.length,5);
 const results=[];
 for(const [choice,line]of [['2',188],['22',192],['3',200]]){
  const branch=context.branches.find(b=>b.states.jo9_sd_choice===choice);a(branch);
  a.equal(branch.destinations.length,1);a.equal(branch.destinations[0].line,line);
  const result=await api('/api/scene',{destination:branch.destinations[0],hash:doc.hash,mode:'text'});
  a.equal(result.flow.stages.find(p=>p.number===result.flow.selected).sceneId,branch.destinations[0].sceneId);
  results.push({choice,result,branch});
 }
 const texts=x=>x.result.screen.map(e=>e.text).join('\n');
 a.notEqual(texts(results[0]),texts(results[1]));a.notEqual(texts(results[1]),texts(results[2]));
 a(results[1].result.screen.some(e=>e.line===196&&/\r?\n/.test(e.text)));
 const report={qsp:doc.hash,http:200,pages:context.flow.stages.map(p=>({number:p.number,title:p.title})),routes:results.map(x=>({choice:x.choice,destinationLine:x.branch.destinations[0].line,page:x.result.flow.selected,sourceLines:x.result.screen.map(e=>e.line)})),distinctResults:true,multilineResultPreserved:true,apiMutations:'none; context and scene are read-only'};
 fs.writeFileSync(__dirname+'/live-verification.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
