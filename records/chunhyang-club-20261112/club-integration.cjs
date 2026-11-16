'use strict';
const t=require('./club-task.cjs'),fs=require('fs');
const {game,tmp,rec,c,body,put,write,fixture}=t,phase=process.argv[3],source=process.argv[4]==='installed'?game+'/jack.qsp':tmp+'/candidate.qsp';let assertions=0;
const check=(condition,label)=>{assertions++;return "if ("+condition+")=0: msg 'FAIL_CHUNINT_"+label+"' & exit\nqa_checks+=1\n";};
const setup="gs '#variative'\ngs '#static_base'\ngs '#dynamic'\ngs '#var_base'\ngs '#options'\ngs '#противники'\negeya_lose=1\njo9_chunhyang['open']=1\nday=20\nsparks=250000\nmaster_str=5\nmaster_fighter=6\nmaster_cha=5\nmaster_domination=5\nmaster_energy=5\nmaster_half_energy=0\nmaster_hygiene=5\nbull_ring_on=1\nsnake_amulet_on=1\n$master_armor='без_брони'\n$master_name='QA'\n$master_ava='content/pic/empty.png'\n$estate='slum_house'\n$place='catfightclub'\nui_style=2\ngame_difficulty=2\ndifficulty_setting=2\ncheat_fight_dif=1\n";
const slave="slave_type=1000\nslave_state=CONST_INT['slave_exist']\n$slave_name='QA slave'\nslave['age']=2\nslave['stamina']=5\nslave['gladiatrix']=5\nslave['gladiatrix_affinity']=1\nslave['ego']=3\nslave['energy']=5\nslave['catfight_level']=3\nslave['arena_level']=0\nslave['jo9_chun_entries']=0\n";
const plan=[];function add(name,code,mutate){plan.push(fixture(name,source,code,assertions,mutate));assertions=0;}
function capture(d,target,name,checks){put(d,target,body(d,target)+"\n"+checks+"\nsavegame '"+name+".sav'\nmsg 'JO9_QA_CHUNCLUB_"+name.replaceAll('-','_')+"_COMPLETE'\nexit");}
let checks,code=setup+slave+"gs 'jo9_chun_club','menu'\n"+check("sparks=250000 and instr($text_display,'춘향에게 결투')>0 and instr($text_display,'노예를 싸움')>0",'open_menu');
code+="jo9_chunhyang['open']=0\njo9_chunhyang['sale_seen']=1\njo9_chunhyang['sale_day']=day\n$text_display=''\ngs 'jo9_chun_club','city'\n"+check("instr($text_display,'매물로 나왔습니다')>0 and func('jo9_chun_club','stage')=3",'sale_tooltip')+"day+=29\n"+check("func('jo9_chun_club','stage')=3",'sale_day29')+"day+=1\n"+check("func('jo9_chun_club','stage')=1",'sale_day30_transition');
code+="jo9_chunhyang['owned']=1\njo9_chunhyang['won']=1\ngs 'jo9_chun_club','city'\n"+check("instr($text_display,'재개장하려면 지배인이 필요')>0 and instr($text_display,'춘향 영입 약속')>0",'owned_tooltip_and_pending_link');
code+="gs 'jo9_chun_club','menu'\n"+check("instr($text_display,'춘향 영입 대기')>0 and instr($text_display,'결투를 신청')=0",'pending_menu_protects_actor');
code+="slave_state=CONST_INT['no_slave']\ngs 'jo9_chun_club','menu'\n"+check("instr($text_display,'약속대로 춘향을 영입')>0",'pending_claim_menu');
add('menus',code);
code=setup+slave+"interaction_city=904030\ngt 'jo9_chun_club','style'\n";
const styleInitial=check("sp_txt=3 and instr($text_display,'그물과 삼지창')>0",'style_page_rendered_before_back');
checks=check("interaction_city=904030 and instr($text_display,'춘향에게 결투')>0 and instr($text_display,'노예를 싸움에 내보낸다')>0 and instr($text_display,'에게야에게 결투')=0",'style_back_keeps_chun');
add('style-back',code,d=>{put(d,'shop_general',body(d,'shop_general')+"\nif qa_style_back=0:\n"+styleInitial+"\n qa_style_back=1\n sp_txt=1\n gt 'shop_general'\nend\n"+checks+"\nsavegame 'style-back.sav'\nmsg 'JO9_QA_CHUNCLUB_style_back_COMPLETE'\nexit");});
code=setup+slave+"gt 'jo9_chun_club','duel'\n";
checks=check("$place='chunhyang_battle' and $bg['chunhyang_battle'] ! '' and $place_name['chunhyang_battle'] ! '' and $place_location['chunhyang_battle'] ! '' and $place_info['chunhyang_battle'] ! ''",'weapon_chooser_place_mapped')+check("get_weapon=1 and jo9_chun_fight['active']=0 and sparks=250000 and slave_type=1000",'chooser_before_snapshot_and_no_charge');
add('weapon-chooser',code,d=>capture(d,'shop_general','weapon-chooser',checks));
code=setup+"slave_state=CONST_INT['slave_exist']\nslave_type=999\nslave['cook']=4\njo9_chun_requested=1\ncombatant=0\nget_weapon=1\nколичество_врагов=1\n$враг[1]='chunhyang'\n$right_weapon='безоружный'\n$left_weapon='безоружный'\n$primary_weapon=''\n$secondary_weapon=''\n$оружие='безоружный'\n$вторичный=''\ngt 'начать_бой'\n";
checks=check("jo9_chun_fight['active']=1 and jo9_chun_fight['units']>=2100 and jo9_chun_fight['balm']=6",'actual_start')+check("здоровье_врага[1]=200 and выносливость_врага[1]=300 and дух_врага[1]=200 and slave_type=999 and slave['cook']=4 and sparks=250000",'start_preserves_actor_cash');
add('engine-start',code,d=>capture(d,'боевой_интерфейс','engine-start',checks));
code=setup+slave+"количество_врагов=1\n$враг[1]='gladiatrix2'\n$g_type='dimacherus'\ngt '$catfight_fight_start'\n";
checks=check("slave['jo9_chun_entries']=1 and slave['catfight_level']=3 and $враг[1]='chun_gladiatrix2'",'actual_regular_entry')+check("здоровье_врага[1]=160 and выносливость_врага[1]=140 and дух_врага[1]=140 and вред_врага[1]=16",'actual_regular_scaled');
add('regular-start',code,d=>capture(d,'боевой_интерфейс','regular-start',checks));
code=setup+slave+"jo9_chun_match=1\nslave['jo9_chun_entries']=6\nslave['jo9_chun_wins']=0\n$fight_return='Start1'\n$враг[1]='chun_gladiatrix2'\n$итог_боя='победа'\ncombatant=1\ngt 'выход_из_боя'\n";
checks=check("slave['catfight_level']=3 and slave['jo9_chun_entries']=6 and slave['jo9_chun_wins']=1 and jo9_chun_match=0",'actual_regular_win_counts')+check("interaction_city=103005 and instr($text[1],'에게야')=0 and $special_image[1]='characters\\3040_chunhyang_title.png'",'current_operator_result');
add('regular-win',code,d=>capture(d,'interaction_screen_city','regular-win',checks));
code=setup+slave+"interaction_city=102017\ngt 'interaction_city'\n";
checks=check("slave_type=1000 and slave['catfight_level']=3 and sparks=250000 and jo9_chunhyang['won']=0",'stale_egeya_no_duplicate')+check("interaction_city=904030 and instr($text_display,'춘향에게 결투')>0",'stale_egeya_routes_successor');
add('legacy-route',code,d=>capture(d,'shop_general','legacy-route',checks));
for(const [name,outcome,cm,half,cash]of [['exit-win','победа',-10,0,250000],['exit-loss','убит',0,1,150000]]){
 code=setup+slave+"combatant=0\nколичество_врагов=1\n$враг[1]='chunhyang'\njo9_chun_fight['active']=1\n$итог_боя='"+outcome+"'\njo9_cruel_mercy="+cm+"\njo9_cruel_mercy_half="+half+"\nздоровье_игрока=0\nмакс_здоровье_игрока=70\ngt 'выход_из_боя'\n";
 checks=check("sparks="+cash+" and slave_type=1000 and slave['catfight_level']=3 and jo9_chun_fight['active']=0",'actual_exit_'+name);
 if(name==='exit-win')checks+=check("jo9_chunhyang['owned']=1 and jo9_chunhyang['won']=1 and instr($sp_text[1],'클럽')>0",'actual_ownership_win');
 else checks+=check("jo9_chunhyang['won']=0 and jo9_chunhyang['owned']=0 and jo9_chunhyang['last_cost']=100000",'actual_cm_loss');
 add(name,code,d=>capture(d,'shop_general',name,checks));
}
code=setup+"combatant=0\n$враг[1]='chunhyang'\njo9_chun_fight['active']=1\n$итог_боя='вырубился'\njo9_cruel_mercy=-10\njo9_cruel_mercy_half=0\ngt 'выход_из_боя'\n";
checks=check("day=0 and sparks=250000 and jo9_chunhyang['owned']=0 and jo9_chun_fight['active']=0",'cm_death_route');
add('cm-death',code,d=>{put(d,'exit',checks+"\nsavegame 'cm-death.sav'\nmsg 'JO9_QA_CHUNCLUB_cm_death_COMPLETE'\nexit");});
for(const [name,action]of [['defend-turn',"gt 'передышка'"],['potion-turn',"целительный_бальзам=77\ndynamic $применить['целительный_бальзам']"],['weapon-turn',"$слева='гладиус'\n$вторичный=''\nnogoto=0\ndynamic $взять_оружие_слева"]]){
 code=setup+"gs '#боевые_предметы'\ncombatant=0\nколичество_врагов=1\n$враг[1]='chunhyang'\n$класс_врага[1]='элитный'\n$имя_врага[1]='춘향'\nвраг[1]=1\nтекущий=1\nмакс_здоровье_врага[1]=200\nздоровье_врага[1]=200\nвыносливость_врага[1]=300\nдух_врага[1]=200\nмакс_здоровье_игрока=1000\nздоровье_игрока=500\nмакс_выносливость_игрока=1000\nвыносливость_игрока=500\nнорм_дух_игрока=1000\nдух_игрока=500\njo9_chun_fight['active']=1\njo9_chun_fight['units']=3001\njo9_chun_fight['balm']=3\njo9_chun_fight['turn']=0\njo9_chun_fight['kill_at']=7\njo9_chun_fight['evade_at']=3\n$оружие='безоружный'\n$вторичный=''\n"+action+"\n";
 checks=check("jo9_chun_fight['turn']=1 and jo9_chun_fight['units']=3001 and jo9_chun_fight['balm']=3",'consumed_'+name);
 if(name==='potion-turn')checks+=check("целительный_бальзам=76",'actual_potion_consumed');
 if(name==='weapon-turn')checks+=check("$оружие='гладиус'",'actual_weapon_changed');
 add(name,code,d=>capture(d,'боевой_интерфейс',name,checks));
}
const out=tmp+'/native-'+phase;write(out+'/plan.json',plan);fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');write(rec+'/instrumentation-'+phase+'.json',{source,sourceSha256:c.hash(fs.readFileSync(source)),plans:plan,assertions:plan.reduce((n,p)=>n+p.assertions,0),routing:'Actual full standard battle initialization/UI, club menu, standard regular result and custom exit; completion markers appended to actual renderers. Death scene intercepted after real death handler.',userSavesTouched:false});console.log(JSON.stringify({phase,probes:plan.length,assertions:plan.reduce((n,p)=>n+p.assertions,0)}));
