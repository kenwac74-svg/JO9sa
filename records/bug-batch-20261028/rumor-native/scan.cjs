'use strict';
const fs=require('fs'),cp=require('child_process'),assert=require('assert/strict');
const h=require('./dealer.cjs');const {c,sc,tmp,rec,init,actor,chk,get,set,read,write}=h;
const d=c.parse(c.serialize(h.candidate));let code="";
const roster=["result=0","if $args[0]='available': result=1 & exit","killvar '$jo9_rumor_buyer'","killvar '$jo9_rumor_mode'","killvar 'jo9_rumor_nocharm'","if qa_roster_count<1: exit","$jo9_rumor_buyer[0]='qa_first'","$jo9_rumor_mode[0]='simple'","jo9_rumor_nocharm[0]=1","if qa_roster_count>1:"," $jo9_rumor_buyer[1]='qa_second'"," $jo9_rumor_mode[1]=iif(qa_roster_mixed=1,'full','simple')"," jo9_rumor_nocharm[1]=1","end"].join('\n').replace("$jo9_rumor_mode[1]=iif(qa_roster_mixed=1,'full','simple')","if qa_roster_mixed=1: $jo9_rumor_mode[1]='full'\n if qa_roster_mixed=0: $jo9_rumor_mode[1]='simple'");
set(d,'jo9_rumor_roster',roster);
function setup(){return actor()+"killvar '$all_slave_characters'\n$all_slave_characters[0]='slave'\ndifficulty_setting=2\nqa_roster_count=1\nqa_roster_mixed=0\ndemand_rating['qa_first']=0\ndemand_rating['qa_second']=0\n$interesting_specialisation['qa_first']='none'\n$interesting_specialisation['qa_second']='none'\n$npc_name['qa_first']='QA_FIRST'\n$npc_name['qa_second']='QA_SECOND'\ngs '$slave_price','slave'\nqa_rating=rating\n"+chk('qa_rating>0','high_fixture_rating')+"auction_price[qa_rating]=100\ncommon_price[0]=20\n";}
function scan(){return "gs 'jo9_rumor_scan','skups'\n"+chk("arrsize('$jo9_rumor_pages')>0",'page_exists')+chk("$strfind($jo9_rumor_pages[0], '[0-9$]')=''",'no_price_in_rumor');}
code+=setup()+"qa_roster_count=0\n"+scan()+chk("instr($jo9_rumor_pages[0],'특별히 찾는 손님은 없군')>0 and instr($jo9_rumor_pages[0],'길드의 재매입상')>0",'no_hits_guild_hint');
code+=setup()+scan()+chk("instr($jo9_rumor_pages[0],'길드의 재매입상')>0 and instr($jo9_rumor_pages[0],'QA_FIRST')=0",'guild_higher');
code+=setup()+"common_price[0]=500\n"+scan()+chk("instr($jo9_rumor_pages[0],'QA_FIRST')>0 and instr($jo9_rumor_pages[0],'길드')=0",'personal_higher');
code+=setup()+"common_price[0]=100\n"+scan()+chk("instr($jo9_rumor_pages[0],'길드의 재매입상')>0",'equal_prefers_guild');
code+=setup()+"common_price[0]=500\nqa_roster_count=2\n"+scan()+chk("instr($jo9_rumor_pages[0],'QA_FIRST')>0 and instr($jo9_rumor_pages[0],'QA_SECOND')>0",'equal_personal_ties');
code+=setup()+"common_price[0]=500\nauction_price[qa_rating]=100\nrating=0\nauction_price[0]=6000\n"+scan()+chk("instr($jo9_rumor_pages[0],'QA_FIRST')>0 and instr($jo9_rumor_pages[0],'길드')=0",'probe_uses_appraised_local_not_stale_global');
code+=setup()+"slave['jo9_versatile']=1\nqa_roster_count=2\nqa_roster_mixed=1\ncommon_price[0]=100\nauction_price[qa_rating]=10\n"+scan()+chk("instr($jo9_rumor_pages[0],'QA_FIRST')>0 and instr($jo9_rumor_pages[0],'QA_SECOND')=0",'simple_versatile_beats_full_nonvirgin');
code+=setup()+"slave['jo9_versatile']=1\nslave['virginity']=0\nqa_roster_count=2\nqa_roster_mixed=1\ncommon_price[0]=100\nauction_price[qa_rating]=10\n"+scan()+chk("instr($jo9_rumor_pages[0],'QA_SECOND')>0 and instr($jo9_rumor_pages[0],'QA_FIRST')=0",'full_virgin_beats_simple');
for(const [label,extra]of [['unbranded',"slave['brand']=0\n"],['fainted',"slave_state=2\n"],['zero-hard-rating',actor('slave',0)+"slave['brand']=2\ngs '$slave_price','slave'\n"+chk('rating=0','low_fixture_rating')]]){
 code+=setup()+extra+"qa_roster_count=0\n"+scan()+chk("instr($jo9_rumor_pages[0],'길드의 재매입상')=0",label+'_no_false_guild');
}
// Full actor schemas and pre-existing scratch arrays must survive repeated multi-role scans.
code+=setup()+actor('assistant')+actor('room1')+actor('iced_1')+"$all_slave_characters[1]='assistant'\n$all_slave_characters[2]='room1'\n$all_slave_characters[3]='iced_1'\nslave['qa_preserve']=731\n$slave['qa_preserve']='PRESERVE'\nassistant['jo9_focus']=-1\nroom1['jo9_grudge']=1\niced_1['jo9_learning_trait']=1\nslave_inventory['qa_item']=17\niced_1_inventory['qa_item']=19\nslave_specialisation['qa_sentinel']=731\nrating=731\nrelative_rating=731\nis_stock=731\n$jo9_trait_value_mode[0]='MODE_KEEP'\n$jo9_trait_value_mode[1]='MODE_KEEP_TWO'\n$jo9_trait_value_actor[0]='ACTOR_KEEP'\njo9_trait_value_amount[0]=731\njo9_trait_value_amount[1]=732\n$jo9_trait_value_saved_peerless[0]='KEEP'\njo9_trait_value_rate[0]=731\njo9_trait_value_grade[0]=731\nsparks=30\nday=27\nsavegame 'owned-before.sav'\ngs 'jo9_rumor_scan','skups'\ncopyarr '$qa_first_pages','$jo9_rumor_pages'\ngs 'jo9_rumor_scan','skups'\n";
code+=chk("arrsize('$qa_first_pages')=arrsize('$jo9_rumor_pages')",'repeat_page_count')+chk("$qa_first_pages[0]=$jo9_rumor_pages[0] and $qa_first_pages[3]=$jo9_rumor_pages[3]",'repeat_stable_pages');
code+="savegame 'owned-after.sav'\n";
// Service fee is charged once per issued token, independent of the number of owned actors or pages.
code+="$place='guild_hall'\nsparks=30\ngs 'jo9_buyer_rumors','menu','skups'\nqa_token=jo9_rumor_pending\nqa_paid=func('jo9_buyer_rumors','buy','skups',qa_token)\n"+chk('qa_paid=1 and sparks=20','one_consult_charge_ten')+chk("arrsize('$jo9_rumor_pages')=4",'fee_independent_of_four_actors');
code+="qa_paid=func('jo9_buyer_rumors','buy','skups',qa_token)\n"+chk('qa_paid=0 and sparks=20','reused_token_no_double_charge');
code+="killvar '$all_slave_characters'\ngs 'jo9_buyer_rumors','menu','skups'\nqa_token=jo9_rumor_pending\nqa_paid=func('jo9_buyer_rumors','buy','skups',qa_token)\n"+chk('qa_paid=0 and sparks=20','no_owned_actors_no_charge');
// Execute the exact current presentation fragment with the newly generated lines.
const service=get(d,'jo9_buyer_rumors');const vstart=service.indexOf('local $jo9_rm_page_text ='),vend=service.indexOf('! JO9 MOD END ANES_RUMOR_VOICE_20261026',vstart);assert(vstart>0&&vend>vstart);let voice=service.slice(vstart,vend);voice=voice.replace(/\*p '[^\n]*\n/g,'');
const pages=[['no_hits','지금 이 근방에선 QA_ACTOR를 특별히 찾는 손님은 없군. 돈이 급하다면 길드의 재매입상에게 가보게.','손님은 없네요.'],['guild_best','QA_ACTOR라면 지금은 길드의 재매입상을 찾아가는 편이 낫겠군. 돈이 급하다면 그쪽과 이야기해 보게.','낫겠어요.'],['personal','내가 듣기로는 QA_FIRST 쪽에서 찾는 조건과 QA_ACTOR의 상태가 잘 맞는군. 이 근방에서도 눈여겨볼 만한 상대들이지. 직접 찾아가 이야기를 들어 보게.','제가 듣기로는']];
for(const [label,page,expected]of pages){code+="$jo9_rumor_pages[0]="+q(page)+"\njo9_rumor_page=0\n$jo9_rm_provider='anes'\n"+voice+'\n'+chk("instr($jo9_rm_page_text,"+q(expected)+")>0 and instr($jo9_rm_page_text,'가보게')=0 and instr($jo9_rm_page_text,'낫겠군')=0",'anes_polite_'+label);code+="$jo9_rm_provider='barman'\n"+voice+'\n'+chk('$jo9_rm_page_text=$jo9_rumor_pages[0]','barman_original_'+label);}
h.fixture(d,'candidate-scan',code);
const plan=h.plan.filter(p=>p.name==='candidate-scan');write(tmp+'/scan-plan.json',plan);
if(process.argv[2]==='run'){
 const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine','G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe','-Plan',tmp+'/scan-plan.json','-TimeoutSeconds','30'],{encoding:'utf8',windowsHide:true,timeout:40000});
 const results=read(tmp+'/client-results.json');let preservation=null;
 if(results.every(x=>x.pass)){
  const before=sc.parse(fs.readFileSync(tmp+'/owned-before.sav')),after=sc.parse(fs.readFileSync(tmp+'/owned-after.sav'));
  const names=new Set([...before.vars.map(v=>v.name),...after.vars.map(v=>v.name)].filter(n=>/^(SLAVE|ASSISTANT|ROOM1|ICED_1)(_|$)/.test(n)||['SLAVE','ASSISTANT','ROOM1','ICED_1','RATING','RELATIVE_RATING','IS_STOCK','SLAVE_SPECIALISATION','SPARKS','DAY','JO9_TRAIT_VALUE_MODE','JO9_TRAIT_VALUE_ACTOR','JO9_TRAIT_VALUE_AMOUNT','JO9_TRAIT_VALUE_SAVED_PEERLESS','JO9_TRAIT_VALUE_RATE','JO9_TRAIT_VALUE_GRADE'].includes(n)));
  for(const n of names){const a=before.vars.find(v=>v.name===n),b=after.vars.find(v=>v.name===n);assert.deepEqual(a?.values,b?.values,'Values changed: '+n);assert.deepEqual(a?.idx,b?.idx,'Indexes changed: '+n);}
  preservation={variables:[...names],exact:true};
 }
 const report={baseline:h.hash,candidate:h.patch.after_sha256,engineExit:run.status,results,assertions:h.assertions-96,preservation,worldUnchanged:c.hash(fs.readFileSync(h.input))===h.hash,limits:['Controlled synthetic regional roster; actual matcher, pricing, dealer quote, scan and service buy functions executed.','Anes exact presentation transformation fragment executed; no full GUI visual inspection.','Diagnostic-only state, no actual user save loaded or changed.']};write(rec+'/scan-results.json',report);fs.copyFileSync(tmp+'/candidate-scan-stderr.log',rec+'/candidate-scan.log');console.log(JSON.stringify(report));
 assert(results.every(r=>r.pass)&&preservation?.exact);
}
function q(s){return "'"+s.replaceAll("'","''")+"'";}
