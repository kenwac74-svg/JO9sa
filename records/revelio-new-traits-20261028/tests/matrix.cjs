'use strict';
const h=require('./harness.cjs'),{assert,rec,write,candidate,run,quote}=h,prepared=candidate();
const roles=['slave','assistant','room1','stock'],labels=['야심가','일벌레','안분지족','끈기','산만함','옹졸함','너그러움','활동적','휴식 선호'];
let code='',scenarios=[];
for(const role of roles){
 for(const [key,values,knownKey,names,legacy] of [
 ['jo9_ambition',[-1,0,1,2],'jo9_ambition_known',{1:'야심가'}],
 ['jo9_focus',[-2,-1,0,1,2],'jo9_focus_known',{1:'끈기','-1':'산만함'}],
 ['jo9_grudge',[-2,-1,0,1,2],'jo9_grudge_known',{1:'옹졸함','-1':'너그러움'}],
 ['jo9_work_ethic',[-2,-1,0,1,2],'jo9_work_ethic_known',{1:'일벌레','-1':'안분지족'},true],
 ['jo9_work_ethic',[-1,0,1],'jo9_work_ethic_known',{1:'활동적','-1':'휴식 선호'}],
 ['passion_comfort',[-1,0,1],'passion_comfort_revealed',{1:'휴식 선호','-1':'활동적'}]
 ])for(const value of values)for(const known of [0,1])for(const spell of [0,1]){
  const expected=(known||spell)?names[value]:undefined;const row={role,key,value,known,spell,legacy:!!legacy,expected:expected||null};scenarios.push(row);
  code+=`killvar '${role}'\n${role}_state=1\n${role}['${key}']=${value}\n${role}['${knownKey}']=${knownKey==='passion_comfort_revealed'?known*2:known}\nspell_revelio=${spell}\n`;
  if(legacy)code+=`${role}['passion_comfort']=2\n`;
  code+=`$qa_list=$func('jo9_traits','list','${role}')\n`;
  const parts=labels.map(x=>`instr($qa_list,${quote(x)})${x===expected?'>0':'=0'}`);
  parts.push(`${role}['${key}']=${value}`,`${role}['${knownKey}']=${knownKey==='passion_comfort_revealed'?known*2:known}`);
  code+=`if (${parts.join(' and ')})=0: msg 'FAIL_REVELIO_MATRIX_${scenarios.length}' & exit\n`;
 }
}
// Visibility is temporary; removing the spell hides only an undiscovered held trait.
code+="killvar 'slave'\nslave['jo9_focus']=-1\nslave['jo9_focus_known']=0\nspell_revelio=1\n$qa_on=$func('jo9_traits','list','slave')\nspell_revelio=0\n$qa_off=$func('jo9_traits','list','slave')\nif instr($qa_on,'산만함')=0 or instr($qa_off,'산만함')>0 or slave['jo9_focus']!-1 or slave['jo9_focus_known']!0: msg 'FAIL_REVELIO_TEMPORARY' & exit\n";
const r=run(prepared.d,'green-matrix',code);write(rec+'/matrix-results.json',{baseline:h.baseline,candidate:prepared.patch.after_sha256,scenarios:scenarios.length,roles,heldAndAbsentAndNonstandard:true,knownAndSpell:[0,1],temporaryVisibility:true,engineExit:r.engineExit,results:r.results,cases:scenarios});assert.equal(r.engineExit,0);console.log(JSON.stringify({scenarios:scenarios.length,engineExit:r.engineExit,results:r.results}));
