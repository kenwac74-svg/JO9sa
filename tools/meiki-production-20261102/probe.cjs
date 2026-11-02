'use strict';
// Executes predicates and yield statements extracted from the real QSP in a disposable engine probe.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('../text-workshop/core.cjs');
const locations=['interaction','next_day','end_day_screen'];
function body(doc,name){const l=doc.locations.find(l=>l.name===name);assert(l,'Missing '+name);return core.shift(doc.lines[l.body],5);}
function gates(doc){
 const result=[];
 for(const name of locations){const lines=body(doc,name).split('\r\n');
  for(let i=0;i<lines.length;i++){
   const m=lines[i].match(/^\s*if (\w+)\['sub_tentacles'\] > tentacle_size or .*\['virginity'\] = 4.*:$/);
   if(m)result.push({location:name,role:m[1],line:i+1,condition:lines[i].trim().slice(3,-1),following:lines.slice(i+1,i+9)});
  }
 }
 assert.equal(result.length,15,'All production and report gates must be included');
 return result;
}
function diagnostic(raw){
 const doc=core.parse(raw),all=gates(doc);assert(core.serialize(doc).equals(raw));
 const code=['DEBUG=1','autosave=0','decadesave=0','sound_on=0','qa_meiki_checks=0'];
 let count=0;
 const quote=s=>"'"+s.replaceAll("'","''")+"'";
 function check(expression,label){count++;code.push('if '+expression+':',' qa_meiki_checks+=1','else',' msg '+quote('JO9_QA_MEIKI_FAIL_'+label),' exit','end');}
 // Hand-derived grade requirements, independent of production predicates.
 const ordinaryMin=[1,2,3,4,5],traitMin=[0,1,2,3,4];
 for(const g of all)for(let stage=0;stage<5;stage++)for(let skill=0;skill<6;skill++)for(const trait of [2,4]){
  const want=skill>=(trait===4?traitMin[stage]:ordinaryMin[stage])?1:0;
  code.push('tentacle_size='+stage,`${g.role}['sub_tentacles']=${skill}`,`${g.role}['virginity']=${trait}`,'qa_meiki_actual=0','if '+g.condition+': qa_meiki_actual=1');
  check('qa_meiki_actual='+want,`${g.location}_${g.role}_stage${stage}_skill${skill}_v${trait}`);
 }
 const base=[12,18,24,64,126],bonusYield=[14,23,33,96,201];
 code.push('spawn_milked=0',...base.map((n,i)=>`semen_gain[${i}]=${n}`));
 for(const g of all.filter(g=>g.location!=='end_day_screen')){
  const calculation=g.following.filter(s=>/^\s*(?:spawn_semen \+=|jo9_tentacle_report\['\w+_(?:bonus|gain)'\] =)/.test(s));
  assert.equal(calculation.length,g.location==='next_day'?3:1,'Real yield statements '+g.location+g.role);
  for(let stage=0;stage<5;stage++)for(const trait of [2,4]){
   code.push('tentacle_size='+stage,`${g.role}['virginity']=${trait}`,'spawn_semen=0',...calculation);
   check('spawn_semen='+(trait===4?bonusYield[stage]:base[stage]),`yield_${g.location}_${g.role}_stage${stage}_v${trait}`);
  }
 }
 const interaction=body(doc,'interaction').split('\r\n');
 const reset=interaction.find(s=>s.trim()==="code_defined['interaction_lesson_tentacles'] = 0");assert(reset,'Saved lesson refresh');
 const start=interaction.findIndex(s=>s.trim()==="if code_defined['interaction_lesson_tentacles'] = 0:");
 const close=interaction.findIndex((s,i)=>i>start&&s==='\t}');assert(close>start&&interaction[close+1]==='end','Full lesson definition boundary');
 code.push("code_defined['interaction_lesson_tentacles']=1","$interaction_lesson_tentacles='STALE_QA_LESSON'",reset,...interaction.slice(start,close+2));
 check("code_defined['interaction_lesson_tentacles']=1 and $interaction_lesson_tentacles!'STALE_QA_LESSON'",'saved_lesson_replaced');
 // Execute the rebuilt real template; its special part remains a stored code block.
 code.push("dynslave['sub_tentacles']=3","dynslave['virginity']=4",'tentacle_size=3','dynamic $interaction_lesson_tentacles');
 check("$special_part!''",'rebuilt_lesson_executed');
 // Use the exact gate from the refreshed special-part string, avoiding scene/image side effects.
 const lesson=all.find(g=>g.role==='dynslave');
 check('instr($special_part,'+quote('if '+lesson.condition+':')+')>0','rebuilt_production_gate');
 const marker='JO9_QA_M20261102_meiki_gate_COMPLETE';
 check('qa_meiki_checks='+(count),'assertion_count_before_completion');
 code.push('msg '+quote(marker));
 const loc=doc.locations.find(l=>l.name==='Start');assert(loc,'Start');doc.lines[loc.body]=core.shift(code.join('\r\n'),-5);
 return {raw:core.serialize(doc),marker,assertions:count,gates:all.map(({following,...g})=>g)};
}
function main(){const [file,out]=process.argv.slice(2);assert(file&&out,'usage: probe.cjs INPUT_QSP OUT_DIRECTORY');
 fs.mkdirSync(out,{recursive:true});const p=diagnostic(fs.readFileSync(file)),target=path.resolve(out,'meiki-gate.qsp');
 fs.writeFileSync(target,p.raw);fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify([{name:'meiki-gate',marker:p.marker,checkpoint:'production-grades-yield-saved-lesson',file:target}],null,2));
 fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify({source: path.resolve(file),sha256:core.hash(fs.readFileSync(file)),assertions:p.assertions,gates:p.gates},null,2));
 console.log(JSON.stringify({probe:target,assertions:p.assertions,gates:p.gates.length}));
}
if(require.main===module)main();module.exports={diagnostic,gates,body};
