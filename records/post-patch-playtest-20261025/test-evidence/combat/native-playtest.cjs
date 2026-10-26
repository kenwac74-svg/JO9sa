'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const group=process.env.JO9_COMBAT_GROUP||'';assert(!group||/^[a-z]+$/.test(group));
const out='G:/Codex/tmp/jo9-post-patch-playtest-20261025/combat'+(group?'/'+group:'');
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const raw=fs.readFileSync(game+'/jack.qsp'),hash=c.hash(raw),prime=qa.primeState(sc.parse(fs.readFileSync(game+'/save/JO9_TEST_20261023_01_HOME.sav'))).code;
assert.equal(hash,'a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a');
const cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'",write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
fs.mkdirSync(out,{recursive:true});
// Files used by the real renderer. Resource folders are junctioned read-only in practice;
// the diagnostics disable every autosave and only save under this task directory.
for(const rel of ['config.xml','css/base.css','fonts/경기천년제목 Medium.ttf','fonts/Sandoll 미생.ttf']) {
 fs.mkdirSync(path.dirname(out+'/'+rel),{recursive:true});if(!fs.existsSync(out+'/'+rel))fs.copyFileSync(game+'/'+rel,out+'/'+rel);
}
for(const rel of ['content','json'])if(!fs.existsSync(out+'/'+rel))fs.symlinkSync(game+'/'+rel,out+'/'+rel,'junction');
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const check=(expr,id)=>`if (${expr})=0: msg 'FAIL_COMBAT_${id}' & exit\n`;
function driver(test,predicate){
 const portrait=test.endsWith('_attack')&&!test.startsWith('grinch')?`if(!painted){var im=document.querySelector('#ally_combat_ui #combat_ui_pic img');if(!im||!im.complete||im.naturalWidth<1){if(++n<120)setTimeout(tick,60);else fail('PORTRAIT_NOT_LOADED');return}if((im.getAttribute('src')||'').indexOf('2571_face.png')<0){fail('PORTRAIT_URL');return}try{var cv=document.createElement('canvas');cv.width=32;cv.height=32;var cx=cv.getContext('2d');cx.drawImage(im,0,0,32,32);var data=cx.getImageData(0,0,32,32).data,col=0;for(var k=0;k<data.length;k+=4){if(data[k+3]>0&&Math.max(data[k],data[k+1],data[k+2])-Math.min(data[k],data[k+1],data[k+2])>24)col++}if(col<50){fail('PORTRAIT_COLOR');return}portraitBits='qa_portrait_loaded=1 & qa_portrait_colored=1 & qa_portrait_width='+im.naturalWidth+' & '}catch(e){portraitBits='qa_portrait_loaded=1 & qa_canvas_blocked=1 & qa_portrait_width='+im.naturalWidth+' & '}painted=true}`:'';
 const js=`(function(){var n=0,sent=false,painted=false,portraitBits='';function click(a){var r=(a.querySelector('img')||a).getBoundingClientRect();if(r.width<=0||r.height<=0)return false;var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,r.left+r.width/2,r.top+r.height/2,false,false,false,false,0,null);a.dispatchEvent(e);return true}function fail(s){var a=document.createElement('a');a.href="EXEC: msg 'FAIL_COMBAT_DOM_${test}_"+s+"'";a.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px';document.body.appendChild(a);click(a)}function tick(){var m=document.getElementById('__message__');if(m){var close=document.querySelector('a[href="api/closemsg"]');if(close){click(close);setTimeout(tick,50);return}}if(sent){setTimeout(tick,80);return}${portrait}var as=document.getElementsByTagName('a'),a=null;for(var i=0;i<as.length;i++){var h=as[i].getAttribute('href')||'';if(${predicate}){a=as[i];break}}if(a){a.scrollIntoView(false);if(portraitBits)a.setAttribute('href','EXEC: '+portraitBits+(a.getAttribute('href')||'').replace(/^EXEC:\\s*/i,''));if(click(a)){sent=true;setTimeout(tick,80);return}}if(++n<120)setTimeout(tick,60);else fail('LINK_MISSING')}setTimeout(tick,180)}());`;
 return '*p '+q('<script type="text/javascript">'+js+'</script>')+'\n';
}
const fixture=`usehtml=1
${prime}
$onnewloc='' & $counter=''
gs 'refresh_database'
$onnewloc='' & $counter=''
autosave=0 & decadesave=0 & autosave_day=0 & autosave_decade=0 & sound_on=0
snk_room_target=0 & is_home=0 & hero_choice=1 & game_difficulty=0 & cheat_fight_dif=1
day=102 & sparks=10000 & master_energy=5 & master_half_action=0
master_str=50 & master_fighter=50 & master_cha=50 & master_domination=50
master_wounds_rate=0 & $master_name='Adult QA Master'
$master_armor='без_брони' & $master_back_wpn='тесак' & $master_left_wpn='' & $master_right_wpn='' & $master_arm_wpn='' & $master_leg_wpn=''
slave_state=CONST_INT['slave_exist'] & assistant_state=CONST_INT['slave_exist']
slave['id']=91401 & assistant['id']=91402 & slave['age']=2 & assistant['age']=2
slave_type=2571 & assistant_type=2571 & $slave_name='Adult QA Slave' & $assistant_name='Adult QA Assistant'
slave['stamina']=50 & assistant['stamina']=50 & slave['gladiatrix']=50 & assistant['gladiatrix']=50
slave['ego']=50 & assistant['ego']=50 & slave['energy']=5 & assistant['energy']=5
slave['obedience']=5 & slave['oral']=3 & slave['xenophily']=3 & slave['temper']=10
slave['catfight_level']=0 & slave['arena_level']=0 & slave['loser_rating']=0
slave['calories']=500 & assistant['calories']=500 & slave['half_action']=0 & assistant['half_action']=0
slave_rate['wounds']=0 & assistant_rate['wounds']=0 & slave_rate['fame']=23 & assistant_rate['fame']=61
$slave['ava']='content/pic/girls/face/2571/2571_face_sepia'
$assistant['ava']=$slave['ava']
$slave['ava_clear']='content/pic/girls/face/2571/2571_face'
$assistant['ava_clear']=$slave['ava_clear']
$slave['armor']='без_брони' & $assistant['armor']='без_брони'
$slave['back_wpn']='тесак' & $assistant['back_wpn']='тесак'
$slave['left_wpn']='' & $slave['right_wpn']='' & $slave['arm_wpn']='' & $slave['leg_wpn']=''
$assistant['left_wpn']='' & $assistant['right_wpn']='' & $assistant['arm_wpn']='' & $assistant['leg_wpn']=''
sp_txt_is_set_from_save=0 & txt_is_set_from_save=0 & get_weapon=0 & colosseum_fight=0
qa_battle_count=0 & qa_turns=0 & qa_exit_count=0 & qa_end_count=0 & qa_settle_count=0 & qa_city_count=0
`;
const plans=[],manifest=[];
function make(name,kind,{actor=1,event=61102,fame=23,witnessFame=61,witness=null,weak=false,wins=0,loss=false,series=false,resultReturn=false,rallyWon=0,quarter=0,draw=1,constitution=null}={}) {
 const d=c.parse(raw),loc=n=>{const l=d.locations.find(x=>x.name===n);assert(l,n);return l;},body=n=>c.shift(d.lines[loc(n).body],5),set=(n,b)=>d.lines[loc(n).body]=c.shift(cr(b),-5),prefix=(n,b)=>set(n,b+'\n'+body(n)),tail=(n,b)=>set(n,body(n)+'\n'+b);
 const marker='JO9_QA_COMBAT_'+name.replaceAll('-','_')+'_COMPLETE';
 let start=fixture+`\nslave_rate['fame']=${fame}\nassistant_rate['fame']=${witnessFame}\n`;
 if(kind==='grinch')start+="$place='Grinch_battle'\ninteraction_city=10383\ngt 'interaction_city'";
 if(kind==='fog')start+=`$place='edge_patrol'\ninteraction_city=${event}\ngt 'interaction_city'`;
 if(kind==='catfight')start+="$place='catfightclub'\ninteraction_city=10201\ngt 'interaction_city'";
 if(kind==='rally')start+=`slave['jo9_rally_won']=${rallyWon}\nslave['jo9_rally_fame_quarter']=${quarter}\n$place='erosalon'\nsp_txt=4\ncopyarr '$display_options','$erosalon_options'\ngt 'shop_general'`;
 if(kind==='arena')start+="$place='colosseum'\ncombatant=1\nsp_txt=24\ncopyarr '$display_options','$colosseum_options'\ngt 'shop_general'";
 if(kind==='catfight')start=start.replace("slave['catfight_level']=0",`slave['catfight_level']=${wins}`);
 if(constitution!==null){
  start=start.replace("slave['stamina']=50", "slave['stamina']=5").replace("assistant['stamina']=50", "assistant['stamina']=5");
  start=start.replace("sp_txt_is_set_from_save=0",`slave['jo9_constitution']=${constitution} & assistant['jo9_constitution']=${constitution}\nslave['jo9_combat_trait']=0 & assistant['jo9_combat_trait']=0\nslave['gladiatrix_affinity']=0 & assistant['gladiatrix_affinity']=0\nsp_txt_is_set_from_save=0`);
 }
 set('Start',start);
 if(weak)tail('#противники',`qa_weak_i=1\n:qa_weak_loop\nif qa_weak_i<=количество_врагов:\n базовое_здоровье[$враг[qa_weak_i]]=1\n базовая_выносливость[$враг[qa_weak_i]]=1\n базовый_дух[$враг[qa_weak_i]]=1\n базовый_вред[$враг[qa_weak_i]]=0\n модификатор_колющий[$враг[qa_weak_i]]=0\n модификатор_рубящий[$враг[qa_weak_i]]=0\n модификатор_дробящий[$враг[qa_weak_i]]=0\n qa_weak_i+=1\n jump 'qa_weak_loop'\nend`);
 if(loss)tail('#противники',`qa_loss_i=1\n:qa_loss_loop\nif qa_loss_i<=количество_врагов:\n базовое_здоровье[$враг[qa_loss_i]]=9999\n базовая_выносливость[$враг[qa_loss_i]]=9999\n базовый_дух[$враг[qa_loss_i]]=9999\n базовый_вред[$враг[qa_loss_i]]=1000\n $атака_1_тип_вреда[$враг[qa_loss_i]]='психический'\n $атака_2_тип_вреда[$враг[qa_loss_i]]='психический'\n $атака_3_тип_вреда[$враг[qa_loss_i]]='психический'\n базовый_вред_суператаки_1[$враг[qa_loss_i]]=0\n базовый_вред_суператаки_2[$враг[qa_loss_i]]=0\n qa_loss_i+=1\n jump 'qa_loss_loop'\nend`);
 if(witness!==null){const fog=body('jo9_fog_relay');assert.equal(fog.split('if rand(1, 100) <= 20:').length,3);set('jo9_fog_relay',fog.replaceAll('if rand(1, 100) <= 20:',`if ${witness} <= 20:`));}
 if(kind==='rally'){
  let city=body('interaction_city'),changes=0;
  for(const id of [102113,102114,102115,102116]){
   const rx=new RegExp('(^[ \\t]*IF interaction_city = '+id+':[\\s\\S]*?)(^[ \\t]*END[ \\t]*$)','gmi');
   city=city.replace(rx,(all,pre,end)=>{assert.equal((pre.match(/a = RAND\(1,[34]\)/g)||[]).length,1);changes++;return pre.replace(/a = RAND\(1,[34]\)/,'a = '+draw)+end;});
  }
  assert.equal(changes,8);set('interaction_city',city);
 }
 prefix('начать_бой',"if get_weapon>0: qa_battle_count+=1");prefix('$catfight_fight_start','qa_battle_count+=1');prefix('$gladiator_fight_start','qa_battle_count+=1');prefix('выход_из_боя','qa_exit_count+=1');prefix('interaction_city','qa_city_count+=1');
 prefix('jo9_fog_relay',`if $args[0]='settle' and jo9_fog['active']=1 and jo9_fog['settled']=0:\n qa_settle_count+=1\n qa_finish_stamina=выносливость_игрока\n qa_pre_settle_energy=iif(jo9_fog['actor']=1,slave['energy'],assistant['energy'])\nend`);
 if(constitution!==null){prefix('jo9_traits_combat',`if $args[0]='setup': qa_base_hp=args[2] & qa_base_stamina=args[3]\n`);tail('боевой_интерфейс',check(`макс_здоровье_игрока=qa_base_hp*${constitution===1?'6/5':'1'} and макс_выносливость_игрока=qa_base_stamina*${constitution===1?'6/5':'1'}`,'CONSTITUTION_BATTLE_MAXIMA'));}
 const attack=driver(name+ '_attack',"h.indexOf('EXEC:')===0 && as[i].parentNode && document.getElementById('fight_subtions') && document.getElementById('fight_subtions').contains(as[i])");
 tail('боевой_интерфейс',`qa_turns+=1\n`+check('qa_turns<60','TOO_MANY_TURNS')+ (kind!=='grinch'?check("$combatant_ava='content/pic/girls/face/2571/2571_face.png'",'COLOR_PATH'):'')+`savegame '${name}-combat.sav'\n`+attack);
 tail('конец_боя',`qa_end_count+=1\nsavegame '${name}-outcome.sav'\n`+check(loss?"$итог_боя='бегство' or $итог_боя='вырубился'":"$итог_боя='победа'",'EXPECTED_VICTORY')+`savegame '${name}-victory.sav'\n`+driver(name+'_exit',"h.indexOf('выход_из_боя')>=0"));
 const weapon=driver(name+'_weapon',"h.indexOf('nogoto = 0')>=0 && h.indexOf('начать_бой')>=0 && h.indexOf('no_wpn')<0");
 let shop="if get_weapon=1:\n"+weapon+"end\n";
 if(kind==='grinch') {
  shop=shop.replace(weapon,driver(name+'_weapon',"h.indexOf('за_спиной')>=0 && h.indexOf('= 1')>=0 || h.indexOf('nogoto = 0')>=0 && h.indexOf('начать_бой')>=0 && h.indexOf('no_wpn')<0"));
  shop+="if get_weapon=0 and interaction_city=10384:\n"+check("sp_txt=10384 and instr($text_display,'начать_бой')>0",'GRINCH_MENU')+driver(name+'_enter',"h.indexOf('начать_бой')>=0")+'end\n';
  tail('interaction_screen_city',`if interaction_city=10385:\n`+check("qa_turns>0 and qa_exit_count=1 and qa_end_count=1 and active[$event['спасение_рождества']]=10 and $return_lock='next_day'",'GRINCH_QUEST_RETURN')+`savegame '${name}-complete.sav'\nmsg '${marker}'\nend`);
 }
 if(kind==='fog') {
  shop+=`if get_weapon=0 and qa_exit_count=0:\n`+check('master_energy=5 and slave[\'energy\']=5 and assistant[\'energy\']=5','PRECHOICE_AP')+driver(name+'_enter',`h.indexOf('jo9_fog_relay')>=0 && h.indexOf('begin')>=0 && /, ${actor}$/.test(h)`)+'end\n';
  // Observe original close call after all settlement, without replacing its GT target.
  const exitBody=body('выход_из_боя'),anchor="gs 'jo9_fog_relay', 'close'";assert.equal(exitBody.split(anchor).length,2);
  set('выход_из_боя',exitBody.replace(anchor,anchor+`\nqa_closed=1\nsavegame '${name}-settled.sav'\n`));
  const expected=actor===1?fame:witnessFame,role=actor===1?'slave':'assistant',other=actor===1?'assistant':'slave';
  const mapped="iif(qa_finish_stamina>=75,5,iif(qa_finish_stamina>=65,4,iif(qa_finish_stamina>=55,3,iif(qa_finish_stamina>=45,2,iif(qa_finish_stamina>=35,1,iif(qa_finish_stamina>=25,0,iif(qa_finish_stamina>=20,-1,iif(qa_finish_stamina>=15,-2,iif(qa_finish_stamina>=10,-3,-4)))))))))";
  const tier=[61103,61107,61108,61109,61111,61113].includes(event)?[3,1]:event===61115?[5,2]:[61101,61110].includes(event)?[0,0]:[1,0];
  const reward=expected>=80?0:Math.min(expected<40?tier[0]:tier[1],80-expected);
  const fameCheck=witness===null?`${role}_rate['fame']>=${expected} and ${role}_rate['fame']<=${expected+reward}`:`${role}_rate['fame']=${expected+(witness<=20?reward:0)}`;
  const done=`if qa_closed=1:\nqa_expected_energy=min(${mapped},qa_pre_settle_energy-1)\n`+check(`qa_turns>0 and qa_exit_count=1 and qa_end_count=1 and qa_settle_count=1 and combatant=0 and jo9_fog['active']=0`,'FOG_ROUTE')+check(`${role}['energy']=qa_expected_energy and ${other}['energy']=5 and master_energy=5`,'FOG_AP_ONCE')+check(fameCheck,'FOG_FAME')+check(`${other}_rate['fame']=${actor===1?witnessFame:fame}`,'FOG_OTHER_FAME')+`savegame '${name}-complete.sav'\nmsg '${marker}'\nend\n`;
  shop=done+shop;tail('city_screen',done);tail('interaction_screen_city',done);
 }
 if(kind==='catfight') {
  if(wins>=3){
   shop+=check("slave['catfight_level']=3 and qa_turns=0 and instr($text_display,'combatant = 1')=0",'CF_BLOCKED_MENU')+`if qa_stale_attempt=0:\nqa_stale_attempt=1\n`+testAnchor(name,'gt "$catfight_fight_start"')+`else\n`+check('qa_stale_attempt=1 and qa_battle_count=1 and interaction_city=10201','CF_STALE_BLOCK')+`savegame '${name}-complete.sav'\nmsg '${marker}'\nend\n`;
  }else shop+="if get_weapon=0:\n"+driver(name+'_setup',"h.indexOf('combatant = 1')>=0 || h.indexOf('dimacherus')>=0")+'end\n';
  let result=`if interaction_city=103001:\n`+driver(name+'_forward',"/forward_button[.]png/.test(as[i].innerHTML)")+`end\nif interaction_city=103005:\n`+check(`slave['catfight_level']=${wins+1} and slave_rate['fame']=${Math.min(fame+(wins===0?10:3),100)} and qa_exit_count=1 and qa_turns>0`,'CF_WIN')+`savegame '${name}-complete.sav'\n`;
  result+=resultReturn?driver(name+'_result_return',"/forward_button[.]png/.test(as[i].innerHTML)"):`msg '${marker}'\n`;
  result+='end';
  if(loss)result=`if interaction_city=103001:\n`+driver(name+'_forward',"/forward_button[.]png/.test(as[i].innerHTML)")+`end\nif interaction_city=103004:\n`+check(`slave['catfight_level']=${wins} and slave_rate['fame']=${fame} and qa_exit_count=1 and qa_turns>0`,'CF_LOSS_COUNT')+`savegame '${name}-complete.sav'\nmsg '${marker}'\nend`;
  if(series){
   result=`if interaction_city=103001:\n`+driver(name+'_forward',"/forward_button[.]png/.test(as[i].innerHTML)")+`end\nif interaction_city=103005:\n`+check("slave['catfight_level']=qa_exit_count and qa_exit_count<=3 and slave_rate['fame']=33+(qa_exit_count-1)*3",'CF_CONNECTED_SERIES')+`savegame '${name}-win-<<qa_exit_count>>.sav'\n`+testAnchor(name,"slave['energy']=5 & slave_rate['wounds']=0 & master_energy=5 & get_weapon=0 & interaction_city=10201 & gt 'interaction_city'")+`end`;
   shop=`if slave['catfight_level']=3:\n`+check("qa_exit_count=3 and qa_battle_count=3 and instr($text_display,'combatant = 1')=0",'CF_CONNECTED_BLOCK')+`savegame '${name}-complete.sav'\nmsg '${marker}'\nexit\nend\n`+shop;
  }
  tail('interaction_screen_city',result);
  if(resultReturn)tail('shop_general',`if qa_exit_count=1: msg '${marker}'`);
 }
 if(kind==='rally') {
  shop+=driver(name+'_rally_enter',"h.indexOf('102102')>=0");
  const success=draw!==2,gain=success&&fame<80?Math.min(rallyWon===0?40:fame<40?4:1,320-fame*4-quarter):0,expected=Math.floor((fame*4+quarter+gain)/4),expectedQ=(fame*4+quarter+gain)%4;
  tail('interaction_screen_city',check(`interaction_city=${success?102118:102117} and slave_rate['fame']=${expected} and slave['jo9_rally_fame_quarter']=${expectedQ} and slave['jo9_rally_won']=${success?1:rallyWon}`,'RALLY_FAME')+check(`slave['energy']=2 and sparks=${success?10300:9900} and assistant_rate['fame']=61 and master_energy=5`,'RALLY_NATIVE_EFFECTS')+check("arrsize('jo9_rally_ticket')=0 and arrsize('$jo9_rally_ticket')=0",'RALLY_TICKET_CONSUMED')+`savegame '${name}-complete.sav'\nmsg '${marker}'`);
 }
 if(kind==='arena'){
  shop+=driver(name+'_arena_style',"h.indexOf('retiarius')>=0 && h.indexOf('$gladiator_setup')>=0");
  tail('interaction_screen_city',`if interaction_city=12801:\n`+driver(name+'_arena_forward',"/forward_button[.]png/.test(as[i].innerHTML)")+`end\nif interaction_city=1294:\n`+check("slave['arena_level']=1 and slave['catfight_level']=0 and qa_exit_count=1 and qa_turns>0 and qa_portrait_loaded=1 and qa_portrait_width=151",'ARENA_COLOR_NATIVE')+`savegame '${name}-complete.sav'\nmsg '${marker}'\nend`);
 }
 tail('shop_general',shop);
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);
 plans.push({name,file,marker,checkpoint:'Current WORK with intact product routes and native DOM click callbacks: '+kind});
 manifest.push({name,kind,actor,event,fame,witnessFame,witness,wins,loss,draw,rallyWon,quarter,resultReturn,constitution,series,weakEnemyFixture:weak,instrumentation:['Start fixture','prefix counters','tail assertions and save snapshots','native DOM synthetic click driver',...(weak?['Enemy test fixture HP/stamina/spirit=1, damage/resistance=0 after actual database load']:[]),...(witness!==null?['Only witness RNG draw substituted by '+witness]:[]),...(kind==='rally'?['Only eight native rally RNG draw lines substituted']:[]),...(series?['Between matches only AP/wounds are reset and the original club entry is invoked. Cumulative wins and fame are never reseeded; original result-return tested separately.']:[])],productionHelpersUnchanged:witness===null&&kind!=='rally',GTTargetsRetained:true,combatOutcomeInjected:false});
}
function testAnchor(name,code){return '*p '+q('<a id="qa_test_action" href="EXEC: '+code.replaceAll('"','&quot;')+'" style="position:fixed;left:10px;top:10px;width:30px;height:30px;z-index:99999">QA</a>')+'\n'+driver(name+'_diagnostic_callback',"as[i].id==='qa_test_action'");}
const selected=process.argv[2]||'prototype';
if(['prototype','all'].includes(selected)){make('fog-slave','fog');make('fog-assistant','fog',{actor:2});make('grinch','grinch',{weak:true});make('catfight-first','catfight');}
if(['fame','all'].includes(selected)){
 make('fog-witness-twenty','fog',{event:61103,fame:39,witness:20,weak:true});
 make('fog-witness-twentyone','fog',{event:61103,fame:39,witness:21,weak:true});
 make('fog-assistant-cap','fog',{actor:2,event:61115,witnessFame:79,witness:20,weak:true});
 make('fog-assistant-eighty','fog',{actor:2,event:61103,witnessFame:80,witness:20,weak:true});
}
if(['extended','all'].includes(selected)){
 make('catfight-second','catfight',{wins:1});make('catfight-third','catfight',{wins:2});make('catfight-blocked','catfight',{wins:3});make('catfight-loss','catfight',{wins:2,loss:true});make('catfight-return','catfight',{resultReturn:true,weak:true});
 make('rally-first','rally');make('rally-repeat-below','rally',{fame:39,rallyWon:1});make('rally-repeat-quarter','rally',{fame:40,rallyWon:1});make('rally-repeat-cap','rally',{fame:79,rallyWon:1,quarter:3});make('rally-eighty','rally',{fame:80,rallyWon:1});make('rally-loss','rally',{fame:39,rallyWon:1,draw:2});
}
if(selected==='color'){make('fog-color','fog',{weak:true});make('catfight-color','catfight',{weak:true});make('grinch','grinch',{weak:true});}
if(selected==='health'){for(const actor of [1,2])for(const constitution of [0,1])make(`healthy-${actor===1?'slave':'assistant'}-${constitution===1?'on':'off'}`,'fog',{actor,constitution,weak:true});}
if(selected==='series'){make('catfight-series','catfight',{series:true});make('grinch','grinch',{weak:true});}
if(selected==='loss'){make('catfight-loss','catfight',{wins:2,loss:true});}
if(selected==='arena'){make('arena-color','arena',{weak:true});}
write(out+'/plan.json',plans);write(out+'/manifest.json',{hash,fixtures:manifest});
let runner=fs.readFileSync(repo+'/tools/qa/run-client-smoke.ps1','utf8').replace("if($probeLog -match 'showMessage\\(\\)')","if($probeLog -match 'showMessage\\(\\), str:\\s*\"FAIL_')");fs.writeFileSync(out+'/runner.ps1',runner);
console.log(JSON.stringify({prepared:plans.length,out,hash}));
if(!process.argv.includes('--run'))process.exit();
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',out+'/runner.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:220000,maxBuffer:1000000});
fs.writeFileSync(out+'/runner.log',run.stdout+'\n'+run.stderr);
const results=JSON.parse(fs.readFileSync(out+'/client-results.json','utf8').replace(/^\uFEFF/,''));
write(out+'/report-'+selected+'.json',{hash,exit:run.status,results,fixtures:manifest,limits:['Native engine DOM synthetic clicks, no external mouse automation.','Adult fixture stats deliberately strong; no product damage, AI, win/loss decisions or GT routes replaced.','Normal saves only read as seed; all snapshots saved under task root.']});
console.log(JSON.stringify({exit:run.status,results}));
