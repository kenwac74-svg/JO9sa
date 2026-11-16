'use strict';
// Targeted synthetic native diagnostic. Product and personal SAV files are read-only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const input=path.resolve(process.argv[2]||''),out=path.resolve(process.argv[3]||'');
assert(process.argv.length===4,'node .jo9-private-sex-native.cjs input.qsp outputDir');
assert(out.toLowerCase().startsWith(path.resolve('G:/Codex/tmp').toLowerCase()+path.sep),'Diagnostics belong under task tmp');
assert(!fs.existsSync(out),'Use a fresh diagnostic directory');
const raw=fs.readFileSync(input),doc=core.parse(raw),original=doc.lines.slice();
const body=n=>core.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
const put=(n,s)=>{const l=doc.locations.find(l=>l.name===n);assert(l,n);doc.lines[l.body]=core.shift(s.replace(/\r?\n/g,'\r\n'),-5);};
const menuItems=JSON.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/json/menu_item.json','utf8'));
const marker='JO9_QA_PRIVATESEX_bridge_COMPLETE';
const q=s=>"'"+s.replaceAll("'","''")+"'";
const check=(condition,label)=>`if (${condition}) = 0: msg 'FAIL_PRIVATESEX_${label}' & exit\nqa_assertions += 1\n`;
let start="killall\nusehtml=1\nautosave=0\ndecadesave=0\nsound_on=0\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\n";
for(const n of ['#static_base','#static_txt','#variative','#dynamic','#moodlet_base','#item_base'])start+=`gs '${n}'\n`;
start+=`$onnewloc=''\n$ongload=''\n$counter=''\nmenu_sex=${menuItems.menu_sex}\nqa_assertions=0\n`;
for(let room=1;room<=4;room++){
 start+=`snk_room_target=0\nmaster_excitement=3\nslave_state=CONST_INT['slave_exist']\nroom${room}_state=CONST_INT['slave_exist']\nslave['qa_identity']=100\nroom${room}['qa_identity']=${100+room}\nslave['energy']=3\nroom${room}['energy']=3\nslave_already_sex_today[999]=11\nroom${room}_already_sex_today[999]=${20+room}\n$onnewloc='QA_KEEP_CALLBACK'\ngs 'snk_room_bridge','enter',${room},menu_sex\n`;
 start+=check(`snk_room_target=${room} and slave['qa_identity']=${100+room} and snk_parked_slave['qa_identity']=100 and menu_form=menu_sex`,'enter_'+room);
 start+=check(`slave_already_sex_today[999]=${20+room} and snk_parked_slave_already_sex_today[999]=11`,'history_swap_'+room);
 start+=`gs 'snk_room_bridge','guard','menu_form'\n`;
 start+=check(`snk_room_target=${room} and slave['qa_identity']=${100+room} and menu_form=menu_sex`,'menu16_allowed_'+room);
 start+=`slave['qa_written']=77\nslave_already_sex_today[998]=88\ngs 'snk_room_bridge','leave'\n`;
 start+=check(`snk_room_target=0 and slave['qa_identity']=100 and room${room}['qa_identity']=${100+room} and room${room}['qa_written']=77 and slave['qa_written']=0`,'restored_'+room);
 start+=check(`slave_already_sex_today[999]=11 and room${room}_already_sex_today[999]=${20+room} and room${room}_already_sex_today[998]=88 and slave_already_sex_today[998]=0 and snk_parked_slave_state=0`,'history_restore_'+room);
 start+=check("$onnewloc='QA_KEEP_CALLBACK'",'callback_restore_'+room);
 start+="$onnewloc=''\n";
}
start+=`msg '${marker}'\nexit\n`;
put('Start',start);
for(let room=1;room<=4;room++)put('slave_private_room'+room,`msg 'FAIL_PRIVATESEX_menu16_returned_to_room_${room}'\nexit`);
const generated=core.serialize(doc);qa.inspectWorld(generated);fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'bridge.qsp'),generated);
fs.copyFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/config.xml',path.join(out,'config.xml'));
fs.writeFileSync(path.join(out,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify([{name:'bridge',file:path.join(out,'bridge.qsp'),marker,checkpoint:'Four synthetic room subjects enter native menu16; original bridge guard; instance/history swap and callback restoration. Room renderer replaced by failure sentinel.'}],null,2)+'\n');
fs.writeFileSync(path.join(out,'instrumentation.json'),JSON.stringify({input,sourceSha256:core.hash(raw),probeSha256:core.hash(generated),changedLocations:doc.locations.filter(l=>original[l.body]!==doc.lines[l.body]).map(l=>l.name),originalBodiesPreserved:['snk_room_bridge','interaction','interaction_result','sex_initiate','sex_end'],syntheticOnly:true,userSaveLoaded:false,userSaveWritten:false,phase:'bridge-red-green'},null,2)+'\n');
console.log(path.join(out,'plan.json'));

// A second full-world copy drives real deterministic costs and active init/end.
// Final renderers and UI-only layout/newloc work are isolated, not the product logic.
const life=core.parse(raw),lifeOriginal=life.lines.slice();
const get=n=>core.shift(life.lines[life.locations.find(l=>l.name===n).body],5);
const set=(n,s)=>{const l=life.locations.find(l=>l.name===n);assert(l,n);life.lines[l.body]=core.shift(s.replace(/\r?\n/g,'\r\n'),-5);};
const sourceMenu=get('menu_form').split(/\r?\n/),sexStart=sourceMenu.findIndex(l=>/^if menu_form = menu_sex:\s*$/.test(l));assert(sexStart>=0);
let depth=0,sexFinish=-1;
for(let i=sexStart;i<sourceMenu.length;i++){
 if(/^\s*if\b.*:\s*$/.test(sourceMenu[i]))depth++;
 if(/^\s*end\s*$/.test(sourceMenu[i]))depth--;
 if(depth===0){sexFinish=i;break;}
}
assert(sexFinish>sexStart);
const sexMenu=sourceMenu.slice(sexStart,sexFinish+1).join('\n');
const buttons=[];
for(let room=1;room<=4;room++){
 const line=get('slave_private_room'+room).split(/\r?\n/).find(l=>l.includes('$menu_item_sex +')&&l.includes('href='));assert(line,'Room button '+room);
 const href=line.match(/href\s*=\s*"EXEC:\s*([^"]+)"/i);assert(href,'Room EXEC '+room);buttons.push(href[1].replaceAll("''","'"));
}
const cases=[];
for(let room=1;room<=4;room++)for(const kind of ['button','back','escape','relaxed_main','relaxed_room','active_main','active_room'])cases.push({room,kind});
const roles=['slave','assistant','room1','room2','room3','room4','snk_parked_slave'];
const values={age:2,energy:3,half_action:0,stamina:3,fat:2,beauty:3,style:3,exotic:3,metabolism:3,intellect:3,ego:2,temper:2,pride:0,moral:5,custom:5,rational:5,instinct:3,obedience:5,mood:5,arousal:3,fear:0,angst:0,spoil:0,virginity:2,sub_vaginal:3,roleplay:3,oral:3,fertility:0,cycle_day:20,ovulation:1,menstruation:0,pregnant:0,pregnant_revealed:0,inseminated:0,jo9_work_ethic:1,passion_comfort:-1,jo9_work_ethic_known:1,passion_comfort_revealed:2,jo9_meiki_initialized:2,jo9_meiki_prev:2,jo9_meiki_checked:1};
let seed="snk_room_target=0\nsnk_room_inventory=0\nsnk_room_debug_open=0\n$onnewloc=''\n$ongload=''\n$counter=''\n$sex_partner=''\n$return_lock='Start'\n$return_lock_prev='Start'\nmenu_form=0\nsex_num=0\nkillvar 'sex'\nkillvar 'sex_done_thisperson'\nkillvar 'sex_done_today'\nkillvar '$special_action'\nmaster_excitement=3\nmaster_excitement_rate=80\nmaster_style=5\nmaster_libido=2\nmaster_penetration=3\nmaster_domination=3\nmaster_str=3\nmaster_str_rate=100\nmaster_energy=5\nmaster_half_action=0\nmaster_ill=0\nmaster_check=1\nmaster_hygiene_rate=0\ncheat_inf_en=0\neasy_for_master=0\neasy_for_slave=0\nsparks=100\nhero_choice=13\nis_perv=0\ndebug=0\ndebug_interactions=0\nday=100\nbull_ring_on=0\nsex_interaction=0\n";
for(let index=0;index<roles.length;index++){
 const role=roles[index];seed+=`for qa_clear_i=0 to arrsize('$slave_vars')-1 step 1:\n $qa_clear_var=$replace($slave_vars[qa_clear_i],'instance','${role}')\n killvar $qa_clear_var\nend\n`;
 if(role==='snk_parked_slave'){seed+=`${role}_state=0\n`;continue;}
 seed+=`${role}_state=CONST_INT['slave_exist']\n${role}_type=1435\n${role}['qa_identity']=${100+index}\n$${role}_name='QA_${role}'\n$${role}_psy_status='obedient'\n$${role}['wpn']='безоружный'\n$${role}['armor']='без_брони'\n$${role}['cloth']='maid_dress'\n${role}_already_sex_today[999]=${10+index}\n${role}_already_sex_total[999]=${20+index}\n`;
 for(const [key,value]of Object.entries(values))seed+=`${role}['${key}']=${value}\n`;
 for(const key of ['beauty','style','exotic'])seed+=`${role}_rate['${key}']=100\n`;
}
// Existing native effects contain random values. Compare only deterministic costs,
// and verify the original code locations are unchanged rather than fixing RNG.
const metrics=[['master_energy','master_energy'],['master_half','master_half_action'],['sparks','sparks'],['target_energy',"dyneval('result='+$qa_actor+\"['energy']\")"],['target_half',"dyneval('result='+$qa_actor+\"['half_action']\")"],['target_calories',"dyneval('result='+$qa_actor+\"['calories']\")"]];
const lifeMarker='JO9_QA_PRIVATESEX_lifecycle_COMPLETE';
let lifeStart="if qa_life_initialized=0:\n killall\n usehtml=1\n autosave=0\n decadesave=0\n sound_on=0\n $onnewloc=''\n $ongload=''\n $counter=''\n settimer 0\n";
for(const n of ['#static_base','#static_txt','#variative','#dynamic','#moodlet_base','#item_base'])lifeStart+=` gs '${n}'\n`;
for(const [key,value]of Object.entries(menuItems))if(typeof value==='number')lifeStart+=` ${key}=${value}\n`;
lifeStart+=" $onnewloc=''\n $ongload=''\n $counter=''\n qa_life_initialized=1\n qa_life_index=0\n qa_life_assertions=0\n $qa_phase=''\n $qa_seed={\n"+seed+"}\n $qa_native_menu={\n"+sexMenu+"\n}\n $save_link={$qa_links[args[0]]=$args[1]}\n";
buttons.forEach((b,i)=>lifeStart+=` $qa_button[${i+1}]=${q(b)}\n`);
cases.forEach(({room,kind},i)=>lifeStart+=` qa_life_rooms[${i}]=${room}\n $qa_life_kinds[${i}]='${kind}'\n`);
lifeStart+='end\n';
const lcheck=(expr,label)=>`if (${expr})=0: msg 'FAIL_PRIVATESEX_LIFE_${label}' & exit\nqa_life_assertions+=1\n`;
let finish='';
// Fixed assertions for all six identities and untouched main/assistant histories.
finish+=lcheck("snk_room_target=0 and snk_parked_slave_state=0",'context_restored');
for(let i=0;i<6;i++)finish+=lcheck(`${roles[i]}['qa_identity']=${100+i}`,'identity_'+roles[i]);
finish+=lcheck("slave_already_sex_today[999]=10 and slave_already_sex_total[999]=20 and assistant_already_sex_today[999]=11 and assistant_already_sex_total[999]=21",'original_histories');
finish+=lcheck("$onnewloc='main_layout'",'callback_restore');
finish+="$onnewloc=''\nqa_life_index+=1\n$qa_phase=''\n";
// At the real result boundary the bridge still owns its temporary actor slot.
lifeStart+="if $qa_phase='relaxed_result':\n $qa_actor='slave'\n";
for(const [name,expr]of metrics){
 lifeStart+=` if $qa_kind='relaxed_main': qa_cost['r'+str(qa_room)+':${name}']=${expr}\n`;
 lifeStart+=` if $qa_kind='relaxed_room':\n`+lcheck(`${expr}=qa_cost['r'+str(qa_room)+':${name}']`,'relaxed_cost_'+name)+' end\n';
}
lifeStart+=lcheck("slave['qa_identity']=iif($qa_kind='relaxed_room',101+qa_room,100)",'relaxed_actor');
lifeStart+=" if $qa_kind='relaxed_room':\n  $qa_phase='finish'\n  menu_form=0\n  gt 'menu_form'\n else\n  $onnewloc='main_layout'\n  $qa_phase='finish'\n end\nend\n";
lifeStart+="if $qa_phase='active_end':\n $qa_actor='slave'\n if $qa_kind='active_room': $qa_actor='room'+str(qa_room)\n";
for(const [name,expr]of metrics){
 lifeStart+=` if $qa_kind='active_main': qa_cost['a'+str(qa_room)+':${name}']=${expr}\n`;
 lifeStart+=` if $qa_kind='active_room':\n`+lcheck(`${expr}=qa_cost['a'+str(qa_room)+':${name}']`,'active_cost_'+name)+' end\n';
}
lifeStart+=lcheck("sex_num=0 and arrsize('sex')=0 and $sex_partner=''",'active_cleanup');
lifeStart+=lcheck("dyneval('result='+$qa_actor+'_already_sex_today[997]')=77 and dyneval('result='+$qa_actor+'_already_sex_total[997]')=88",'active_history_settlement');
lifeStart+=" if $qa_kind='active_main': $onnewloc='main_layout'\n $qa_phase='finish'\nend\n";
lifeStart+="if $qa_phase='finish':\n"+finish+'end\n';
lifeStart+=`if qa_life_index>=${cases.length}: msg '${lifeMarker}' & exit\nqa_room=qa_life_rooms[qa_life_index]\n$qa_kind=$qa_life_kinds[qa_life_index]\ndynamic $qa_seed\n$onnewloc='main_layout'\n`;
lifeStart+="if $qa_kind='button':\n $qa_phase='button'\n dynamic $qa_button[qa_room]\n msg 'FAIL_PRIVATESEX_LIFE_button_did_not_navigate'\n exit\nend\n";
lifeStart+="if $qa_kind='back' or $qa_kind='escape':\n gs 'snk_room_bridge','enter',qa_room,menu_sex\n $qa_phase='finish'\n if $qa_kind='back': menu_form=0 & gt 'menu_form'\n gt 'city_menu_form'\nend\n";
lifeStart+="if $qa_kind='relaxed_room' or $qa_kind='active_room': gs 'snk_room_bridge','enter',qa_room,menu_sex\n$onnewloc=''\nif $qa_kind='relaxed_main' or $qa_kind='relaxed_room': $qa_phase='relaxed_result' & interaction=5414 & gt 'interaction'\nif $qa_kind='active_main' or $qa_kind='active_room': $qa_phase='active_init' & interaction=5415 & gt 'interaction'\nmsg 'FAIL_PRIVATESEX_LIFE_case_dispatch'\nexit\n";
set('Start',lifeStart);
const menuHarness="if $qa_phase='button':\n gs 'snk_room_bridge','guard','menu_form'\n"+lcheck('menu_form=menu_sex and snk_room_target=qa_room and slave["qa_identity"]=101+qa_room','button_target')+" killvar '$qa_links'\n $text_display=''\n dynamic $qa_native_menu\n qa_relaxed_link=0\n qa_active_link=0\n qa_third_link=0\n for qa_link_i=0 to arrsize('$qa_links')-1 step 1:\n  if instr($qa_links[qa_link_i],'interaction=5414')>0: qa_relaxed_link=1\n  if instr($qa_links[qa_link_i],'interaction=5415')>0: qa_active_link=1\n  if instr($qa_links[qa_link_i],'interaction=5416')>0: qa_third_link=1\n end\n"+lcheck('qa_relaxed_link=1 and qa_active_link=1 and qa_third_link=1','native_menu_links')+" assistant_state=0\n killvar '$qa_links'\n $text_display=''\n dynamic $qa_native_menu\n qa_external_link=0\n for qa_link_i=0 to arrsize('$qa_links')-1 step 1:\n  if instr($qa_links[qa_link_i],'interaction=5418')>0: qa_external_link=1\n end\n"+lcheck('qa_external_link=1','native_external_link')+" assistant_state=CONST_INT['slave_exist']\n $qa_phase='finish'\n menu_form=0\n gs 'snk_room_bridge','guard','menu_form'\n msg 'FAIL_PRIVATESEX_LIFE_cancel_no_return'\n exit\nend\nif $qa_phase='finish':\n gs 'snk_room_bridge','guard','menu_form'\n if snk_room_target=0: gt 'Start'\n msg 'FAIL_PRIVATESEX_LIFE_back_no_return'\n exit\nend\nmsg 'FAIL_PRIVATESEX_LIFE_unexpected_menu'\nexit\n";
set('menu_form',menuHarness);
for(let room=1;room<=4;room++)set('slave_private_room'+room,`if snk_room_target>0: gs 'snk_room_bridge','guard','slave_private_room${room}'\n`+lcheck(`qa_room=${room} and snk_room_target=0`,'return_room_'+room)+"gt 'Start'\n");
set('city_menu_form',"gs 'snk_room_bridge','guard','city_menu_form'\nmsg 'FAIL_PRIVATESEX_LIFE_escape_no_return'\nexit\n");
set('interaction',"if $qa_phase='button': msg 'FAIL_PRIVATESEX_LIFE_button_old_route' & exit\n"+get('interaction'));
set('interaction_screen',"if $qa_phase='active_init': msg 'FAIL_PRIVATESEX_LIFE_active_refused' & exit\nif $qa_phase='relaxed_result': gt 'Start'\nmsg 'FAIL_PRIVATESEX_LIFE_unexpected_result'\nexit\n");
const activeScreen=lcheck("$qa_phase='active_init' and sex['pc_energy']>0 and sex['girl_energy']>0",'active_initialized')+lcheck("$sex['girl_name']=$slave_name",'active_name')+"sex['climax_count']=1\nsex['climax_top']=1\nsex['pc_boner']=2\nsex['nymphomania_revealed']=1\ndeflorated=0\nsex_done_today[997]=77\nsex_done_thisperson[997]=88\n$qa_phase='active_end'\ngt 'sex_end'\n";
set('sex_screen',activeScreen);set('sex_screen_woman',activeScreen);
set('main_layout','exit\n');set('$newloc','exit\n');
const lifeBytes=core.serialize(life);qa.inspectWorld(lifeBytes);fs.writeFileSync(path.join(out,'lifecycle.qsp'),lifeBytes);
const plan=JSON.parse(fs.readFileSync(path.join(out,'plan.json'),'utf8'));
plan.push({name:'lifecycle',file:path.join(out,'lifecycle.qsp'),marker:lifeMarker,checkpoint:'28 synthetic cases: four native room button/menu/3P links, back/escape, main vs room relaxed deterministic cost parity, active init plus synthetic end settlement and target/history restoration. UI-only renderers/layout/newloc isolated.'});
fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify(plan,null,2)+'\n');
fs.writeFileSync(path.join(out,'lifecycle-instrumentation.json'),JSON.stringify({input,sourceSha256:core.hash(raw),probeSha256:core.hash(lifeBytes),changedLocations:life.locations.filter(l=>lifeOriginal[l.body]!==life.lines[l.body]).map(l=>l.name),originalBodiesPreserved:['snk_room_bridge','interaction_result','sex_initiate','sex_end','#static_base','#dynamic'],interactionOnlyPrefix:'Old UI button route detection; actual interaction body otherwise unchanged',nativeMenuBlockHash:core.hash(Buffer.from(sexMenu)),cases,metrics:metrics.map(x=>x[0]),controlledEndState:{climax_count:1,climax_top:1,pc_boner:2,deflorated:0,historyToday:77,historyTotal:88},limits:['No actual sexual dialogue renderer or full UI layout/newloc pass','No mini-game middle action sequence','Random effects are preserved but excluded from exact cost comparison','3P options tested as links, not full 3P outcome execution','No personal SAV or physical UI click'],syntheticOnly:true,userSaveLoaded:false,userSaveWritten:false},null,2)+'\n');
