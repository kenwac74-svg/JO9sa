'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('../text-workshop/core.cjs');
const {executionBlock,interactionBlock,executions}=require('./sections.cjs');
const quote=s=>"'"+s.replaceAll("'","''")+"'";
function probe(raw){
 const d=core.parse(raw),result=executionBlock(d),code=['DEBUG=1','autosave=0','decadesave=0','sound_on=0','debug_interactions=2',"CONST_INT['no_slave']=0",'qa_checks=0'];let count=0;
 const check=(c,l)=>{count++;code.push('if '+c+':',' qa_checks+=1','else',' msg '+quote('JO9_QA_EXECUTION_FAIL_'+l),' exit','end');};
 function reset(score=0,half=0){code.push("killvar 'slave'",'slave_state=1',"slave['ego']=3","slave['domini_dictum']=1",'jo9_cruel_mercy='+score,'jo9_cruel_mercy_half='+half,'qa_before=2*jo9_cruel_mercy+jo9_cruel_mercy_half',"$interaction_type=''",'qa_cleared=0','qa_special=0',"$dyn_erotic_stimulation=''",'$clear_slave_instance={qa_cleared+=1 & slave_state=0}');}
 function complete(){code.push('$special_part={qa_special+=1}','dynamic {'+result+'}');}
 const seeds=[[0,0],[0,1],[0,-1],[3,1],[-3,-1],[-1,0]];
 for(let i=0;i<executions.length;i++){
  const row=executions[i];reset(...seeds[i]);code.push('interaction='+row.confirm,'dynamic {'+interactionBlock(d,row.confirm)+'}');check('2*jo9_cruel_mercy+jo9_cruel_mercy_half=qa_before and qa_cleared=0',row.id+'_confirmation_no_penalty');
  code.push('interaction='+row.id,'dynamic {'+interactionBlock(d,row.id)+'}');check("$interaction_type='execution' and 2*jo9_cruel_mercy+jo9_cruel_mercy_half=qa_before",row.id+'_preparation_no_penalty');complete();check('2*jo9_cruel_mercy+jo9_cruel_mercy_half=qa_before-2 and qa_special=1 and qa_cleared=1 and slave_state=0',row.id+'_completed_minus_one');
  complete();check('2*jo9_cruel_mercy+jo9_cruel_mercy_half=qa_before-2',row.id+'_reentry_no_second_penalty');
 }
 // Banishment belongs to a separate path. The new execution rule must ignore it.
 reset(2,1);code.push("$interaction_type='drive_out'",'interaction=181');complete();check('2*jo9_cruel_mercy+jo9_cruel_mercy_half=qa_before and qa_special=0 and qa_cleared=0','banishment_excluded');
 reset(-2,-1);code.push("$interaction_type='execution'",'slave_state=0');complete();check('2*jo9_cruel_mercy+jo9_cruel_mercy_half=qa_before','absent_target_no_penalty');
 // Resistance can leave through GT before the completion/clear step. Exercise that exact branch.
 reset(1,1);code.push("$interaction_type='execution'","slave['domini_dictum']=0","slave['ego']=3","slave['gladiatrix']=100",'torture_intensity=6',"$slave_fights_back={gt 'qa_execution_escape'}");complete();code.push("msg 'JO9_QA_EXECUTION_FAIL_escape_did_not_redirect'",'exit');
 // A dedicated probe-only destination checks the state after the real GT path.
 let escape=["if 2*jo9_cruel_mercy+jo9_cruel_mercy_half!qa_before or qa_special!0 or qa_cleared!0:"," msg 'JO9_QA_EXECUTION_FAIL_resistance_penalty'",' exit','end','qa_checks+=1',`if qa_checks!${count+1}:`,` msg 'JO9_QA_EXECUTION_FAIL_check_count'`,' exit','end',"msg 'JO9_QA_E20261103_execution_mercy_COMPLETE'"];
 const start=d.locations.find(l=>l.name==='Start');d.lines[start.body]=core.shift(code.join('\r\n'),-5);
 // Append one diagnostic location without touching gameplay locations.
 const fields=[core.shift('qa_execution_escape',-5),core.shift('',-5),core.shift(escape.join('\r\n'),-5),core.shift('0',-5)];d.lines.splice(d.lines.length-1,0,...fields);d.lines[3]=core.shift(String(d.locations.length+1),-5);
 const out=core.serialize(d);assert(core.serialize(core.parse(out)).equals(out));return{raw:out,assertions:count+1,marker:'JO9_QA_E20261103_execution_mercy_COMPLETE'};
}
if(require.main===module){const[input,out]=process.argv.slice(2);assert(input&&out);const raw=fs.readFileSync(input),r=probe(raw);fs.mkdirSync(out,{recursive:true});const target=path.resolve(out,'execution-mercy.qsp');fs.writeFileSync(target,r.raw);fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify([{name:'execution-mercy',marker:r.marker,checkpoint:'six-execution-completions',file:target}],null,2));fs.writeFileSync(path.join(out,'probe.json'),JSON.stringify({source:path.resolve(input),sourceSha256:core.hash(raw),assertions:r.assertions,scope:'Actual six preparation/confirmation blocks and common execution block extracted unchanged; actual score helper; inert rendering and actor-clear instrumentation; real GT resistance exit'},null,2));console.log(JSON.stringify({target,assertions:r.assertions}));}
module.exports={probe};
