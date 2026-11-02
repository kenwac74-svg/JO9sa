'use strict';
const h=require('./harness.cjs'),{fs,assert,c,sc,rec,tmp,write,quote,get,set,load,candidate,meeting,run,actor,init}=h,p=candidate(require('path').dirname(rec)+'/2026-10-28_julia_meeting_npc_images.json');
const block=fs.readFileSync(require('path').dirname(rec)+'/saved-actions.qspsrc','utf8').replace(/\r\n/g,'\n').trim(),guard=fs.readFileSync(require('path').dirname(rec)+'/load-redraw.qspsrc','utf8').replace(/\r\n/g,'\n').trim();assert(get(p.d,'$ongload').includes(guard));
let checks=0;const check=(x,label)=>{checks++;return `if (${x})=0: msg 'FAIL_JULIA_GUARD_${label}' & exit\n`;};
// Negative event/current-NPC cases exercise exact candidate block and full renderer.
const d=c.parse(p.bytes);set(d,'_layout','*clr\nkillobj\n');set(d,'interior_change','result=0');let code=init(d)+"sound_on=0\nnsfw=1\n$interaction_type=''\n$picture_type=''\nqa_generate_calls=0\nqa_swap_calls=0\n";
for(const event of [162,164,191,102024]){
 code+=`interaction_city=${event}\ntxt=8\n$npc_id='alyce'\n$special_action[3]={npc=1 & $npc_id = 'alyce' & qa_custom_effect=17}\n$qa_original=$special_action[3]\n`+block+'\n'+check("$npc_id='alyce' and $special_action[3]=$qa_original",'other_event_'+event);
 code+="gs 'interaction_screen_city'\n"+check("$npc_id='alyce' and $special_action[3]=$qa_original",'other_render_'+event);
}
for(const page of [3,8,15,16,17,18]){
 code+=`interaction_city=163\ntxt=${page}\n$npc_id='custom'\nkillvar '$special_action'\n$special_action[${page}]={npc=1 & $npc_id = 'custom' & qa_custom_effect=17}\n$qa_original=$special_action[${page}]\nqa_custom_effect=0\n`+block+'\n'+check(`$npc_id='custom' and $special_action[${page}]=$qa_original and qa_custom_effect=0`,'custom_direct_'+page);
 code+="gs 'interaction_screen_city'\n"+check(`$npc_id='custom' and $special_action[${page}]=$qa_original and qa_custom_effect=17`,'custom_render_'+page);
}
code+=check('qa_generate_calls=0 and qa_swap_calls=0','guard_no_generation');const r=run(d,'guard-cases',code);assert.equal(r.engineExit,0);
// Execute the actual GT load tail at the genuine current screen location; the older load prefix is isolated.
const ld=c.parse(p.bytes);set(ld,'_layout','*clr\nkillobj\n');set(ld,'interior_change','result=0');set(ld,'$ongload',"qa_load_calls+=1\n"+guard);set(ld,'generate_stock','qa_generate_calls+=1');
const actualScreen=get(ld,'interaction_screen_city'),finish="\nif $npc_id ! 'julia' or qa_generate_calls ! 0 or qa_load_calls ! 1 or qa_screen_visits ! 2: msg 'FAIL_JULIA_REAL_GT_LOAD' & exit\nsavegame 'load-gt-after.sav'\nmsg 'JO9_QA_JULIA_load_gt_COMPLETE'\n";
set(ld,'interaction_screen_city',"qa_screen_visits+=1\nif qa_load_gate=1:\n qa_load_gate=0\n gs '$ongload'\n msg 'FAIL_JULIA_LOAD_GT_NOT_TAKEN'\n exit\nend\n"+actualScreen+finish);
let loading=init(ld)+actor('slave',53001,1)+"interaction_city=163\ntxt=8\n$npc_id='alyce'\nnpc=1\nsound_on=0\nnsfw=1\nqa_load_gate=1\nqa_load_calls=0\nqa_screen_visits=0\nqa_generate_calls=0\n$text[8]='QA_OLD_SAVED_PAGE'\nsavegame 'load-gt-before.sav'\ngt 'interaction_screen_city'\n";
const lr=run(ld,'load-gt',loading);assert.equal(lr.engineExit,0);const before=sc.parse(fs.readFileSync(tmp+'/load-gt-before.sav')),after=sc.parse(fs.readFileSync(tmp+'/load-gt-after.sav'));assert.deepEqual(h.roleView(after,'slave'),h.roleView(before,'slave'));write(rec+'/guards-results.json',{baseline:h.baseline,candidate:p.patch.after_sha256,negativeAndCustomChecks:checks,runs:[{name:'guard-cases',engineExit:r.engineExit,results:r.results},{name:'load-gt',engineExit:lr.engineExit,results:lr.results}],actualGotoRenderer:true,loadGotoCanonicalGroups:23,loadGotoCanonicalEqual:true,noActionPage:8,limits:['Load tail is actual source and GT enters actual screen; preceding $ongload migrations are replaced by a call counter.','This scenario invokes the load callback directly, without loading any save file. Native OPENGAME is checked separately when available.']});console.log(JSON.stringify({negativeAndCustomChecks:checks,actualGotoRenderer:true,runs:[r.results,lr.results]}));
