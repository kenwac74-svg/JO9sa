'use strict';
// Diagnostic generator only. The parent runs this against its prepared candidate.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const taskTmp='G:/Codex/tmp/chunhyang-combat-fixes-20261112';
const rec=repo+'/records/chunhyang-combat-fixes-20261112';
const source=process.argv[2]||taskTmp+'/candidate.qsp';
const run=process.argv[3]||'fate-probes';assert(/^[a-z-]+$/.test(run));
const out=taskTmp+'/'+run;
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(source);assert(c.serialize(c.parse(raw)).equals(raw));
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const put=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);};
let assertions=0;const check=(condition,label)=>{assertions++;return "if ("+condition+")=0: msg 'FAIL_CHUNFATE_"+label+"' & exit\nqa_checks+=1\n";};
const boot="killall\nautosave=0\ndecadesave=0\nsound_on=0\n$onnewloc=''\n$ongload=''\n$ongsave=''\n$counter=''\nsettimer 0\nsnk_room_target=0\nhero_choice=1\ngs '#variative'\ngs '#static_base'\ngs '#dynamic'\ngs '#var_base'\ngs '#options'\ngs '#противники'\negeya_lose=1\njo9_chunhyang['open']=1\nday=20\nsparks=250000\nmaster_str=5\nmaster_fighter=6\nmaster_cha=5\nmaster_domination=5\nmaster_energy=5\nmaster_half_energy=0\nmaster_hygiene=5\nbull_ring_on=1\nsnake_amulet_on=1\n$master_armor='без_брони'\n$master_name='QA'\n$master_ava='content/pic/empty.png'\n$estate='slum_house'\n$place='catfightclub'\nui_style=2\ngame_difficulty=2\ndifficulty_setting=2\ncheat_fight_dif=1\nsaved_game_loaded=0\n$ongload='qa_unused'\n$game_ver='잭 오 나인 테일 v2.4.1 Kor Ver'\none_time_conversion_of_interaction_counter_arrays=4\nslave_type=1000\nslave_state=CONST_INT['slave_exist']\n$slave_name='QA slave'\nslave['age']=2\nslave['stamina']=5\nslave['gladiatrix']=5\nslave['gladiatrix_affinity']=1\nslave['ego']=3\nslave['energy']=5\nslave['catfight_level']=3\nslave['arena_level']=0\nslave['jo9_chun_entries']=5\nslave['jo9_chun_wins']=0\njo9_cruel_mercy=0\njo9_cruel_mercy_half=0\n";
const finish=name=>"\nsavegame '"+name+".sav'\nmsg 'JO9_QA_CHUNFATE_"+name.replaceAll('-','_')+"_COMPLETE'\nexit\n";
const plan=[];
function fixture(name,code,mutate){
 const d=c.parse(raw);if(mutate)mutate(d);put(d,'Start',boot+code+finish(name));const bytes=c.serialize(d);qa.inspectWorld(bytes);fs.writeFileSync(out+'/'+name+'.qsp',bytes);plan.push({name,file:out+'/'+name+'.qsp',marker:'JO9_QA_CHUNFATE_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:assertions+' assertions: native catfight fate routing and guarded settlement',assertions});assertions=0;
}
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(rec,{recursive:true});
let rules="$place='catfightclub'\n$fight_return='Start1'\narena_mode=1\nколичество_врагов=1\n";
for(const id of ['gladiatrix1','gladiatrix2','gladiatrix3','chun_gladiatrix1','chun_gladiatrix2','chun_gladiatrix3'])rules+="$враг[1]='"+id+"'\ngs 'jo9_battle_fate','init','catfight'\n"+check("jo9_fate['mode']=2",id+'_recognized');
rules+="$враг[1]='chunhyang'\ngs 'jo9_battle_fate','init','catfight'\n"+check("jo9_fate['mode']=0",'boss_excluded');
rules+="$враг[1]='chun_gladiatrix2'\n$place='edge_patrol'\ngs 'jo9_battle_fate','init','catfight'\n"+check("jo9_fate['mode']=0",'wrong_place_excluded');
rules+="$place='catfightclub'\ngs 'jo9_battle_fate','init','normal'\n"+check("jo9_fate['mode']=0",'wrong_source_excluded');
rules+="количество_врагов=2\ngs 'jo9_battle_fate','init','catfight'\n"+check("jo9_fate['mode']=0",'wrong_count_excluded');
fixture('rules',rules);
for(const [name,choice,cm]of [['execute',1,-2],['spare',2,2]]){
 const start="qa_fate_integration=1\nqa_fate_route=0\nqa_fate_choice="+choice+"\nтр=0\nколичество_врагов=1\n$враг[1]='gladiatrix2'\n$g_type='dimacherus'\ngt '$catfight_fight_start'\n";
 const startChecks=check("$враг[1]='chun_gladiatrix2' and jo9_fate['mode']=2 and $fight_return='Start1'",'real_init_'+name)+check("slave['jo9_chun_entries']=6 and slave['jo9_chun_wins']=0 and sparks=250000",'init_no_reward_'+name);
 const resultChecks=check("jo9_fate['mode']=2 and jo9_fate['phase']=1 and jo9_fate['count']=1",'victory_pending_'+name)+check("instr($maintxt,'처형한다')>0 and instr($maintxt,'살려준다')>0",'both_choices_rendered_'+name);
 const blockedChecks=check("slave['jo9_chun_wins']=0 and sparks=250000 and jo9_fate['phase']=1",'continue_blocked_'+name);
 let selectedChecks=check("jo9_fate['phase']=2 and jo9_fate['choice']="+choice+" and 2*jo9_cruel_mercy+jo9_cruel_mercy_half="+cm,'choice_cm_'+name);
 selectedChecks+=choice===1?check("труп['chun_gladiatrix2']=1 and в_отключке['chun_gladiatrix2']=0 and здоровье_врага[1]<=0",'executed_once'):check("труп['chun_gladiatrix2']=0 and в_отключке['chun_gladiatrix2']=1 and здоровье_врага[1]>=1 and выносливость_врага[1]=0",'spared_once');
 selectedChecks+="gs 'jo9_battle_fate','choose',"+choice+"\n"+check("2*jo9_cruel_mercy+jo9_cruel_mercy_half="+cm+" and тр=1",'repeat_choice_guard_'+name);
 let finalChecks=check("interaction_city=103005 and jo9_fate['phase']=3 and jo9_fate['choice']="+choice,'continue_result_'+name)+check("slave['jo9_chun_entries']=6 and slave['jo9_chun_wins']=1 and slave['catfight_level']=3 and jo9_chun_match=0",'new_ledger_once_'+name)+check("sparks=250100 and purse=100 and 2*jo9_cruel_mercy+jo9_cruel_mercy_half="+cm,'payout_once_'+name);
 finalChecks+=choice===1?check("instr($text[1],'마지막 일격')>0",'execution_result_prose'):check("instr($text[1],'살려주기로')>0",'spare_result_prose');
 finalChecks+="$qa_result_html=$maintxt\ngs 'выход_из_боя'\n"+check("sparks=250100 and slave['jo9_chun_wins']=1 and slave['jo9_chun_entries']=6 and 2*jo9_cruel_mercy+jo9_cruel_mercy_half="+cm,'repeat_continue_guard_'+name);
 fixture(name,start,d=>{
  put(d,'боевой_интерфейс',body(d,'боевой_интерфейс')+"\nif qa_fate_integration=1 and qa_fate_route=0:\n"+startChecks+"qa_fate_route=1\nздоровье_врага[1]=0\ngs 'jo9_battle_fate','stage',1,1\n$итог_боя='победа'\ngt 'конец_боя'\nend\n");
  put(d,'конец_боя',body(d,'конец_боя')+"\nif qa_fate_integration=1 and qa_fate_route=1:\n"+resultChecks+"$qa_choice_html=$maintxt\nqa_fate_route=2\ngt 'выход_из_боя'\nend\n");
  const needle=/(\r?\n[ \t]*\*p \$jo9_bf_page)(\r?\n[ \t]*exit)/;let fate=body(d,'jo9_battle_fate');assert(needle.test(fate));
  const hook="\nif qa_fate_integration=1 and qa_fate_route=2 and jo9_fate['phase']=1:\n"+blockedChecks+"qa_fate_route=3\ngt 'jo9_battle_fate','apply',qa_fate_choice\nend\nif qa_fate_integration=1 and qa_fate_route=3 and jo9_fate['phase']=2:\n"+selectedChecks+"qa_fate_route=4\ngt 'выход_из_боя'\nend\n";
  fate=fate.replace(needle,(_,render,exit)=>render+hook+exit);put(d,'jo9_battle_fate',fate);
  put(d,'interaction_screen_city',body(d,'interaction_screen_city')+"\nif qa_fate_integration=1 and qa_fate_route=4:\n"+finalChecks+finish(name)+"end\n");
 });
}
fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2)+'\n');fs.writeFileSync(rec+'/instrumentation-'+run+'.json',JSON.stringify({source,sourceSha256:c.hash(raw),plans:plan,totalAssertions:plan.reduce((n,x)=>n+x.assertions,0),userSavesTouched:false,instrumentation:'Actual regular catfight initialization; deterministic enemy HP0/fate stage; real victory renderer, early continue guard, real apply/choose/render, real exit and narrative payout. Completion hooks added only to diagnostic copies.'},null,2)+'\n');console.log(JSON.stringify({out,fixtures:plan.length,assertions:plan.reduce((n,x)=>n+x.assertions,0)}));
