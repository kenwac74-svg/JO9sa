const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/room-bgm-audit-20261114',d=c.parse(fs.readFileSync(W+'/jack.qsp'));fs.mkdirSync(T,{recursive:true});fs.cpSync(W+'/json',T+'/json',{recursive:true});fs.copyFileSync(W+'/config.xml',T+'/config.xml');let code=`killall
$onnewloc=''
$counter=''
settimer 0
gs '#static_base'
room1_state=CONST_INT['slave_exist']
room1['stamina']=4
room1['gladiatrix']=4
$room1['armor']='кольчуга'
$room1['right_wpn']='безоружный'
$room1['left_wpn']='безоружный'
$room1['back_wpn']='фламберг'
if func('jo9_room_duty','can',1,2) ! 0: msg 'FAIL_EXPECT_BACK_BUG' & exit
$room1['right_wpn']='гладиус'
if func('jo9_room_duty','can',1,2) ! 1: msg 'FAIL_HAND_WEAPON' & exit
$estate='taurus_house'
noble_status=0
brand_reputation=0
gs 'jo9_residence_bgm','city'
if $jo9_bgm_paths[0] ! 'content/snd/palace.mp3': msg 'FAIL_TAURUS_BASE' & exit
noble_status=1
gs 'jo9_residence_bgm','city'
if $jo9_bgm_paths[0] ! 'content/snd/city_honor.mp3': msg 'FAIL_NOBLE_PRIORITY' & exit
$music['fight']='content\\snd\\fight_master.wav'
gs 'jo9_audio_formats'
if $music['fight'] ! 'content/snd/fight_master.mp3': msg 'FAIL_OLD_WAV_MIGRATION' & exit
kitchen=1
cooked_food=0
ate_already=0
master_str=4
slave_state=CONST_INT['slave_exist']
slave['cooks_rule']=1
slave['energy']=5
slave['cook']=5
slave['obedience']=5
room1['duty']=1
room1['duty_ok']=1
room1['energy']=5
if func('jo9_household_worker','cook') ! 'room1': msg 'FAIL_CHORES_PRIORITY' & exit
msg 'JO9_QA_ROOMBGMAUDIT_probe_COMPLETE'`;d.lines[d.locations.find(l=>l.name==='Start').body]=c.shift(code.replace(/\n/g,'\r\n'),-5);fs.writeFileSync(T+'/probe.qsp',c.serialize(d));fs.writeFileSync(T+'/plan.json',JSON.stringify([{name:'probe',file:T+'/probe.qsp',marker:'JO9_QA_ROOMBGMAUDIT_probe_COMPLETE',checkpoint:'Current back-slot omission, hand allowed, Taurus/noble tracks, old WAV migration, chores priority.'}]));
