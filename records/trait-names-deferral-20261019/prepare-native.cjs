'use strict';
// Follow-up probes; disposable worlds only. Never edits product QSP or saves.
const fs=require('node:fs'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const opts={};for(let i=2;i<process.argv.length;i+=2)opts[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
const work='G:/somi/Jack O Nine Tails v2.4_work/game',input=opts.input||work+'/jack.qsp',out=opts.out;
if(!out||fs.existsSync(out))throw Error('Fresh --out required');const raw=fs.readFileSync(input),base=c.parse(raw),body=n=>c.shift(base.lines[base.locations.find(l=>l.name===n).body],5);
const prime=qa.primeState(codec.parse(fs.readFileSync(work+'/save/spete_dialogue_test.sav'))),q=s=>"'"+String(s).replaceAll("'","''")+"'";
const a=(expr,label)=>['if '+expr+':','else','qa_failed=1','$qa_errors+='+q(label+'|'),'end'];
const finish=tag=>["if qa_failed=1: msg 'JO9_QA_ASSERTION_FAILED_' + $qa_errors","if qa_failed=0: msg "+q('JO9_QA_TRAITDEFER_'+tag+'_COMPLETE')];
const roles=['slave','assistant','room1','room2','room3','room4'];
const ids=['oral_pref','gag_reflex','anal_pref','anal_averse','defiant','innate_mute'];
const names=['펠라 중독','반사적 구역질','애널섹스 중독','애널섹스 혐오','거센 반항심','선천적 벙어리'];
const fields=['oral_affinity','jo9_gag_reflex','anal_affinity','anal_affinity','defiant','jo9_voice_trait'],values=[1,1,1,-1,1,1];
const clear=r=>[...new Set(fields)].map(k=>r+'['+q(k)+']=0');
const setup=['killall',prime.code,"$onnewloc=''",'snk_room_target=0','nsfw=0','sound_on=0','qa_failed=0',"$qa_errors=''","gs 'refresh_database'"];
for(const r of roles)setup.push('special_stock=1069',"gs 'generate_stock'","dynamic $swap_slave_instances, 'stock', "+q(r),r+"_state=CONST_INT['slave_exist']",'$'+r+'_name='+q('QA_'+r),r+"['energy']=5",r+"['ego']=5",r+"['temper']=5",r+"['pride']=5",r+"['obedience']=5",...clear(r));
const tests=[];
const ui=[];
for(const r of roles){
 for(let i=0;i<ids.length;i++){
  ui.push(...clear(r),r+'['+q(fields[i])+']='+values[i],'$qa_list=$func('+q('jo9_traits')+', '+q('list')+', '+q(r)+')',...a('instr($qa_list,'+q("'"+ids[i]+"'")+')>0 and instr($qa_list,'+q(names[i])+')>0','name_'+r+'_'+ids[i]));
 }
 ui.push(...clear(r),r+"['jo9_voice_trait']=2",'$qa_list=$func('+q('jo9_traits')+', '+q('list')+', '+q(r)+')',...a("instr($qa_list,'tongue_loss')=0 and instr($qa_list,'혀 손실')=0 and instr($qa_list,'innate_mute')=0",'deferred_list_'+r),...a(r+"['jo9_voice_trait']=2",'inherited_value_preserved_'+r));
}
for(const r of ['slave','assistant']){
 ui.push("$setting_display=''","$setting_display_r=''",'gs '+q('jo9_traits')+', '+q('editor')+', '+q(r),'$qa_editor=$setting_display+$setting_display_r');
 for(let i=0;i<names.length;i++)ui.push(...a('instr($qa_editor,'+q(names[i])+')>0','editor_name_'+r+'_'+ids[i]));
 ui.push(...a("instr($qa_editor,'혀 손실')=0 and instr($qa_editor,'tongue_loss')=0",'deferred_editor_'+r));
}
ui.push("$qa_captured='UNCHANGED'","gs 'jo9_traits','describe','tongue_loss'",...a("$qa_captured='UNCHANGED'",'deferred_description'));
tests.push({name:'names-and-list',tag:'names_and_list',code:ui,interceptDescribe:true,checkpoint:'Six exact display names across six roles; deferred seventh entry absent from actual list/editor/describe; inherited value 2 remains stored and invisible.'});
const cases=roles.flatMap(r=>[0,1,2].flatMap(state=>(r==='assistant'?[1118,5015]:[1112,1731]).map(id=>({role:r,state,id,blocked:state===1}))));
const driver=['if qa_returned=1:'];
for(const [i,t]of cases.entries())driver.push('if qa_case='+i+':',...a('$qa_reached='+q(t.blocked?'screen':'result'),'route_'+t.role+'_'+t.state+'_'+t.id),...(t.blocked?a("instr($text[1],'말을 할 수 없어')>0",'notice_'+t.role+'_'+t.id):[]),...a("sparks=qa_before_sparks and master_energy=qa_before_master_energy and slave['energy']=qa_before_slave_energy and assistant['energy']=qa_before_assistant_energy",'no_cost_'+t.role+'_'+t.state+'_'+t.id),'end');
driver.push("gs 'snk_room_bridge','leave'",'qa_case+=1','end','qa_returned=0');
for(const [i,t]of cases.entries()){
 driver.push('if qa_case='+i+':',...roles.map(r=>r+"['jo9_voice_trait']=0"),t.role+"['jo9_voice_trait']="+t.state);
 if(t.role.startsWith('room'))driver.push("gs 'snk_room_bridge','enter',"+Number(t.role.slice(-1))+',1');
 driver.push('interaction='+t.id,'qa_before_sparks=sparks','qa_before_master_energy=master_energy',"qa_before_slave_energy=slave['energy']","qa_before_assistant_energy=assistant['energy']","gt 'interaction'",'end');
}
driver.push(...finish('voice_states'));
tests.push({name:'voice-states',tag:'voice_states',driver,code:['qa_case=0','qa_returned=0',"gt 'demo_estate'"],checkpoint:cases.length+' actual question and rhetoric entries: state 1 blocked; inherited 2 and normal 0 take original route for main/assistant/all four room bridges.'});
const gen=[];
for(const val of [0,1,2]){
 gen.push('stock_type=1069','seed_jo9_voice_trait[1069]='+val,"gs 'get_stock_seed'",...a("stock['jo9_voice_trait']="+(val===1?1:0),'stock_seed_'+val));
 gen.push('assistant_type=1069','seed_jo9_voice_trait[1069]='+val,"gs 'get_special_assistant_quest'",...a("assistant['jo9_voice_trait']="+(val===1?1:0),'assistant_seed_'+val));
}
// Actual registry generation repeatedly; static validation also proves no assignment of 2 remains.
gen.push('qa_generation=0',':qa_generation_loop',"gs 'jo9_traits','generate'",...a("stock['jo9_voice_trait']=0 or stock['jo9_voice_trait']=1",'random_voice_only_zero_one'),'qa_generation+=1','if qa_generation<1000: jump '+q('qa_generation_loop'));
const twoAssignment=/stock\[['"]jo9_voice_trait['"]\]\s*=\s*2(?!\d)/.test(body('jo9_traits'));
gen.push(...a(twoAssignment?'0':'1','no_random_two_assignment'));
tests.push({name:'generation-seeds',tag:'generation_seeds',code:gen,checkpoint:'Actual seed copying for values 0/1/2 through ordinary and special-assistant creation, plus 1000 actual registry rolls and static prohibition of random value 2.'});
fs.mkdirSync(out,{recursive:true});fs.cpSync(work+'/json',out+'/json',{recursive:true});fs.copyFileSync(work+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plan=[];
for(const t of tests.filter(t=>!opts.only||opts.only.split(',').includes(t.name))){const d=c.parse(raw),set=(n,b)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(b,-5);};
 if(t.interceptDescribe)set('jo9_traits',body('jo9_traits').replace(/\bmsg\s+(?=')/g,'$qa_captured = '));
 if(t.driver){set('demo_estate',t.driver.join('\r\n'));set('interaction_screen',"$qa_reached='screen'\r\nqa_returned=1\r\ngt 'demo_estate'");set('interaction_result',"$qa_reached='result'\r\nqa_returned=1\r\ngt 'demo_estate'");}
 set('Start',[...setup,...t.code,...(t.driver?[]:finish(t.tag))].join('\r\n'));const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=path.join(out,t.name+'.qsp');fs.writeFileSync(file,bytes);plan.push({name:t.name,file,marker:'JO9_QA_TRAITDEFER_'+t.tag+'_COMPLETE',checkpoint:t.checkpoint});}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2));fs.writeFileSync(out+'/prepared.json',JSON.stringify({input,inputHash:c.hash(raw),probes:plan.length,names,cases,limits:['No production writes or existing-save mutation. Inherited 2 is deliberately stored but neutral.','Voice route probes intercept result/screen so original effect payouts are not executed.','Descriptions are captured only in diagnostic world; visual UI layout and full save-file loading are outside this probe.']},null,2));console.log(JSON.stringify({out,inputHash:c.hash(raw),probes:plan.length}));
