'use strict';
const h=require('./harness.cjs'),{fs,assert,c,sc,rec,tmp,write,quote,get,set,load,candidate,meeting,run,actor,init,roleView}=h;
const patch=process.argv[2]||require('path').dirname(rec)+'/2026-10-28_julia_meeting_npc_images.json',p=candidate(patch),old=load().d;
const roles=['slave','assistant','room1','room2','cow','stock'],ids={3:'julia',15:'julia',16:'johanna',17:'johanna',18:'julia'};
const block=fs.readFileSync(require('path').dirname(rec)+'/saved-actions.qspsrc','utf8').replace(/\r\n/g,'\n').trim();assert(get(p.d,'interaction_screen_city').includes(block));
function prepare(d){set(d,'generate_stock',"qa_generate_calls+=1\n"+actor('stock',51001,1));set(d,'_layout','*clr\nkillobj\n');set(d,'interior_change',"qa_image_calls+=1\n$qa_image_html=$args[1]\n$result=$args[1]\n");}
function initial(d){let s=init(d)+"no_loli=1\nsound_on=0\nnsfw=0\n$interaction_type=''\n$picture_type=''\n";for(const [i,role]of roles.entries())s+=actor(role,52001+i,i%2);for(let i=1;i<=18;i++)s+=`$julia_meeting[${i}]='QA_DIALOGUE_${i}'\n`;s+="$interior_boudoir['gothic']='QA_GOTHIC'\n$npc_image['julia']='julia'\n$npc_image['johanna']='johanna'\n$npc_image['alyce']='alyce'\n$npc_image['kuma']='kuma'\n$npc_image['custom']='custom'\n$qa_real_swap=$swap_slave_instances\n$swap_slave_instances={qa_swap_calls+=1 & dynamic $qa_real_swap,$args[0],$args[1]}\nqa_generate_calls=0\nqa_swap_calls=0\nqa_image_calls=0\n";return s;}
let checks=0;const check=(x,label)=>{checks++;return `if (${x})=0: msg 'FAIL_JULIA_GREEN_${label}' & exit\n`;};
const snap=n=>`savegame '${n}.sav'\n`;const runs=[];
// Fresh event initialization executes the exact original/candidate event block, with only generation stubbed.
for(const[mode,d]of [['baseline',old],['candidate',p.d]]){prepare(d);let code=initial(d)+"interaction_city=163\n"+meeting(d)+snap('fresh-'+mode);
 code+=check("qa_generate_calls=1 and qa_swap_calls=1 and slave['id']=51001 and stock['id']=52001",'fresh_transfer_'+mode);
 if(mode==='candidate')for(const[k,id]of Object.entries(ids)){code+=`show_slave_fullimage=7\ndynamic $special_action[${k}]\n`+check(`$npc_id='${id}' and npc=1 and $place='church'`,'fresh_action_'+k);if(k==='3')code+=check("$bg['vatican_bedroom']='QA_GOTHIC'",'action_three_background');if(k==='16'||k==='17')code+=check('show_slave_fullimage=0','action_fullimage_'+k);}
 const r=run(d,'fresh-'+mode,code);runs.push({name:'fresh-'+mode,engineExit:r.engineExit,results:r.results});assert.equal(r.engineExit,0);
}
const base=sc.parse(fs.readFileSync(tmp+'/fresh-baseline.sav')),fresh=sc.parse(fs.readFileSync(tmp+'/fresh-candidate.sav'));const comparisons=[];
for(const role of roles){assert.deepEqual(roleView(fresh,role),roleView(base,role));comparisons.push({test:'freshBaselineCandidate',role,groups:23,equal:true});}
for(const n of ['TEXT','ALL_SLAVE_CHARACTERS','UNFROZEN_SLAVE_CHARACTERS'])assert.deepEqual(fresh.vars.find(x=>x.name===n),base.vars.find(x=>x.name===n));
const actions=s=>s.vars.find(x=>x.name==='SPECIAL_ACTION').values;
for(let i=0;i<actions(base).length;i++){const oldPair=actions(base)[i],newPair=actions(fresh)[i],replace={3:['alyce','julia'],15:['kuma','julia'],16:['alyce','johanna'],17:['kuma','johanna'],18:['alyce','julia']}[i];assert.deepEqual(newPair,replace?[oldPair[0],oldPair[1].replace("$npc_id = '"+replace[0]+"'","$npc_id = '"+replace[1]+"'")]:oldPair,'action '+i);}
// Simulated saved state: use original saved action strings; never re-run event initialization during render.
const d=c.parse(p.bytes);prepare(d);let code=initial(d)+"interaction_city=163\n"+meeting(old)+"\nqa_generate_calls=0\nqa_swap_calls=0\n$special_action[99]={qa_inactive_action=719}\n$qa_expected_inactive=$special_action[99]\n"+snap('saved-before');
for(const page of Array.from({length:18},(_,i)=>i+1))for(const obsolete of ['alyce','kuma']){
 const expected=page>=3?(page===16||page===17?'johanna':'julia'):obsolete;
 code+=`txt=${page}\n$npc_id='${obsolete}'\n`+block+'\n'+check(`$npc_id='${expected}'`,'saved_direct_'+page+'_'+obsolete);
}
for(const k of [3,15,16,17,18])code+=`dynamic $special_action[${k}]\n`+check(`$npc_id='${ids[k]}'`,'saved_action_'+k);
// Full renderer executes its actual repair block then its existing dynamic action.
for(let page=1;page<=18;page++){
 const expected=page===1?'alyce':page===2?'johanna':page===16||page===17?'johanna':'julia';
 code+=`txt=${page}\n$npc_id='alyce'\nnpc=1\ngs 'interaction_screen_city'\n`+check(`$npc_id='${expected}' and qa_generate_calls=0 and qa_swap_calls=0 and $text[${page}]='QA_DIALOGUE_${page}'`,'render_'+page);
 if(page>1)code+=check(`instr($qa_image_html,'characters\\${expected}.png')>0`,'render_image_'+page);
 code+="$qa_once_id=$npc_id\n$qa_once_action3=$special_action[3]\n$qa_once_action15=$special_action[15]\n$qa_once_action16=$special_action[16]\n$qa_once_action17=$special_action[17]\n$qa_once_action18=$special_action[18]\ngs 'interaction_screen_city'\n"+check("$npc_id=$qa_once_id and $special_action[3]=$qa_once_action3 and $special_action[15]=$qa_once_action15 and $special_action[16]=$qa_once_action16 and $special_action[17]=$qa_once_action17 and $special_action[18]=$qa_once_action18 and qa_generate_calls=0 and qa_swap_calls=0",'idempotent_'+page);
}
code+=check("$special_action[99]=$qa_expected_inactive and qa_inactive_action=0",'inactive_actions_preserved')+snap('saved-after');
const r=run(d,'saved-render',code);runs.push({name:'saved-render',engineExit:r.engineExit,results:r.results});assert.equal(r.engineExit,0);
const before=sc.parse(fs.readFileSync(tmp+'/saved-before.sav')),after=sc.parse(fs.readFileSync(tmp+'/saved-after.sav'));
for(const role of roles){const expected=roleView(before,role);assert.equal(Object.values(expected).filter(Boolean).length,23);assert.deepEqual(roleView(after,role),expected);comparisons.push({test:'savedRenderPreservation',role,groups:23,nonempty:23,equal:true});}
for(const n of ['TEXT','ALL_SLAVE_CHARACTERS','UNFROZEN_SLAVE_CHARACTERS'])assert.deepEqual(after.vars.find(x=>x.name===n),before.vars.find(x=>x.name===n));
write(rec+'/green-results.json',{baseline:h.baseline,candidate:p.patch.after_sha256,checks,runs,comparisons,textAndOwnedListsUnchanged:true,freshSpecialActionsOnlyExpectedNpcAssignmentsChanged:true,limits:['Generation is a counter plus deterministic synthetic adult actor; layout reset and image HTML wrapper are instrumented.','Actual event163 block and complete renderer run; saved state is assembled from original action arrays without personal save loading.','A named addslave API does not exist in this baseline; actual transfer swap calls and owned/daily role lists are checked instead.']});console.log(JSON.stringify({checks,runs,comparisons:comparisons.length}));
