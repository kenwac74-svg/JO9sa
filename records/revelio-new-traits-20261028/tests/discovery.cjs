'use strict';
const h=require('./harness.cjs'),{fs,assert,c,sc,rec,tmp,write,quote,load,candidate,run,init,actor,roleView}=h,p=candidate();
let checks=0;const check=(v,n)=>{checks++;return `if (${v})=0: msg 'FAIL_REVELIO_DISCOVERY_${n}' & exit\n`;};
let code=init(p.d)+"day=10\nspell_revelio=0\n";
for(const role of ['slave','assistant','room1','stock']){
 code+=actor(role)+`${role}['jo9_ambition']=1\n${role}['jo9_ambition_known']=0\n${role}['jo9_ambition_grade_day']=day+1\n${role}['jo9_ambition_used_day']=0\n${role}['jo9_grudge_known']=0\n${role}['jo9_work_ethic']=1\n${role}['passion_comfort']=-1\n${role}['jo9_work_ethic_known']=0\n${role}['passion_comfort_revealed']=0\n`;
 code+=`gs 'jo9_traits_personality','praise','${role}'\n`+check(`${role}['jo9_ambition_known']=1`,'ambition_'+role);
 code+=`qa_result=func('jo9_traits_personality','activity','${role}','cook',0)\n`+check(`${role}['jo9_focus_known']=0 and ${role}['jo9_work_ethic_known']=0`,'first_activity_'+role);
 code+=`qa_result=func('jo9_traits_personality','activity','${role}','cook',0)\n`+check(`${role}['jo9_focus_known']=1 and ${role}['jo9_focus']=-1 and ${role}['jo9_work_ethic_known']=1`,'repeat_activity_'+role);
 code+=`$slave_bad_mood[0]='neg_pain'\n${role}['neg_pain']=7\nqa_result=func('jo9_traits_personality','decay','${role}')\n`+check(`${role}['jo9_grudge_known']=1 and ${role}['jo9_grudge']=1`,'decay_'+role);
 code+=`qa_result=func('jo9_traits_personality','xp','${role}','cook',100)\n`+check('qa_result=90','xp_'+role);
 code+=`qa_result=func('jo9_traits_personality','performance','${role}','cook',100)\n`+check('qa_result=90','performance_'+role);
 for(const[key,value]of [['jo9_ambition',1],['jo9_focus',1],['jo9_grudge',-1]]){
  code+=`${role}['${key}']=0\n${role}['${key}_known']=0\ngs 'jo9_traits','edit','${role}','${key}',${value}\n`+check(`${role}['${key}']=${value} and ${role}['${key}_known']=1`,'forced_'+key+'_'+role);
 }
 code+=`${role}['jo9_work_ethic']=0\n${role}['passion_comfort']=0\n${role}['jo9_work_ethic_known']=0\nqa_result=func('jo9_traits','activity_set','${role}',-1)\n`+check(`qa_result=1 and ${role}['jo9_work_ethic']=-1 and ${role}['passion_comfort']=1 and ${role}['jo9_work_ethic_known']=1 and ${role}['passion_comfort_revealed']=2`,'forced_activity_'+role);
 code+=`$qa_final_${role}=$func('jo9_traits','list','${role}')\n`;
}
const out=[];for(const[mode,d]of [['baseline',load().d],['candidate',p.d]]){const r=run(d,'discovery-'+mode,code+`savegame 'discovery-${mode}.sav'\n`);out.push({mode,engineExit:r.engineExit,results:r.results});assert.equal(r.engineExit,0);}
const base=sc.parse(fs.readFileSync(tmp+'/discovery-baseline.sav')),now=sc.parse(fs.readFileSync(tmp+'/discovery-candidate.sav')),comparisons=[];
for(const role of ['slave','assistant','room1','stock']){assert.deepEqual(roleView(now,role),roleView(base,role));assert.deepEqual(sc.value(now,'QA_FINAL_'+role),sc.value(base,'QA_FINAL_'+role));comparisons.push({role,groups:23,discoveryEffectsAndFinalListEqual:true});}
write(rec+'/discovery-results.json',{baseline:h.baseline,candidate:p.patch.after_sha256,checksPerVersion:checks,runs:out,comparisons,limits:['Actual discovery/editor/effect modes with deterministic conditions; random generation rates are verified through unchanged source body, not a statistical trial.']});console.log(JSON.stringify({checksPerVersion:checks,runs:out,comparisons}));
