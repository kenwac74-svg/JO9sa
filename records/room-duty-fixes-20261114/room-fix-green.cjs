const fs=require('fs'),R='G:/somi/JO9sa',T='G:/Codex/tmp/room-duty-fixes-20261114',c=require(R+'/tools/text-workshop/core.cjs'),d=c.parse(fs.readFileSync(T+'/candidate.qsp')),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),quote=s=>"'"+s.replaceAll("'","''")+"'";fs.mkdirSync(T+'/proof',{recursive:true});for(let f of ['client-results.json','gear-stderr.log','audio-stderr.log'])(!fs.existsSync(T+'/proof/red-'+f)&&fs.copyFileSync(T+'/'+f,T+'/proof/red-'+f));let plan=[];function f(n,code){let p=c.parse(fs.readFileSync(T+'/candidate.qsp'));p.lines[p.locations.find(l=>l.name==='Start').body]=c.shift("killall\r\n$onnewloc=''\r\n$counter=''\r\nsettimer 0\r\ngs '#static_base'\r\n"+code.replace(/\n/g,'\r\n')+`\r\nmsg 'JO9_QA_ROOMFIX_${n}_COMPLETE'`,-5);fs.writeFileSync(T+'/'+n+'.qsp',c.serialize(p));plan.push({name:n,file:T+'/'+n+'.qsp',marker:`JO9_QA_ROOMFIX_${n}_COMPLETE`,checkpoint:n});}
let gear=`room1_state=CONST_INT['slave_exist']
room1['stamina']=4
room1['gladiatrix']=4
$room1['armor']='кольчуга'
`;for(let [slot,w,grade]of [['back_wpn','фламберг',4],['right_wpn','гладиус',2],['left_wpn','кинжал',1],['back_wpn','посох_огня',5]])gear+=`$room1['right_wpn']='безоружный'\n$room1['left_wpn']='безоружный'\n$room1['back_wpn']=''\n$room1['${slot}']='${w}'\nif func('jo9_room_duty','can',1,2) ! 1: msg 'FAIL_WEAPON_${slot}_${grade}' & exit\ngs 'jo9_room_duty','gear',1\nif jo9_rd_gw ! ${grade}: msg 'FAIL_GRADE_${grade}' & exit\n`;gear+=`$room1['armor']='без_брони'
if func('jo9_room_duty','can',1,2) ! 0: msg 'FAIL_NO_ARMOR' & exit
$room1['armor']='кольчуга'
room1['gladiatrix']=3
if func('jo9_room_duty','can',1,2) ! 0: msg 'FAIL_SKILL_THRESHOLD' & exit
`;for(let room=2;room<=4;room++)gear+=`room${room}_state=CONST_INT['slave_exist']\nroom${room}['stamina']=4\nroom${room}['gladiatrix']=4\n$room${room}['armor']='кольчуга'\n$room${room}['back_wpn']='фламберг'\nif func('jo9_room_duty','can',${room},2) ! 1: msg 'FAIL_ROOM_${room}' & exit\n`;f('gear',gear);
let line=body('#options').split('\n').find(x=>x.includes("'event','content\\snd\\fight_master.mp3'"));line=line.replace(/play 'content\\snd\\fight_master\.mp3', (sound_volume|music_volume),'only, loop'/,'qa_play_volume=$1');f('audio',`sound_on=1
music_volume=73
sound_volume=0
${line.trim()}
if qa_play_volume ! 73 or jo9_bgm_event_sound ! 0: msg 'FAIL_BGM_VOLUME' & exit
music_volume=0
sound_volume=81
${line.trim()}
if qa_play_volume ! 0: msg 'FAIL_MUSIC_MUTE' & exit`);
let cache='';for(let slash of ['/','\\'])for(let ext of ['wav','mp3'])for(let space of [' ','']){let path='content'+slash+'snd'+slash+'fight_master.'+ext,old=`if sound_on = 1: gs 'jo9_residence_bgm','event','${path}',1 & play '${path}',${space}sound_volume,'only, loop'`;cache+=`$qa_old=${quote(old)}\n$qa_new=func('jo9_audio_formats','fog_cache',$qa_old)\nif instr($qa_new,'sound_volume')>0 or instr($qa_new,'fight_master.wav')>0: msg 'FAIL_OLD_CACHE_VOLUME' & exit\nif instr($qa_new,${quote("event','"+path.replace('.wav','.mp3')+"',0")})=0: msg 'FAIL_OLD_CACHE_EVENT' & exit\n$qa_twice=func('jo9_audio_formats','fog_cache',$qa_new)\nif $qa_twice ! $qa_new: msg 'FAIL_CACHE_IDEMPOTENCE' & exit\n`;}
cache+=`$display_options[0]='unrelated text'
$display_options[7]="play 'content/snd/fight_master.wav', sound_volume,'only, loop'"
$toplay='jo9_direct_event'
$music_now='content\\snd\\fight_master.wav'
jo9_bgm_event_sound=1
sound_on=0
gs 'jo9_audio_formats'
if jo9_bgm_event_sound ! 0: msg 'FAIL_LIVE_OLD_VOLUME' & exit
if instr($display_options[7],'music_volume')=0 or instr($display_options[7],'.wav')>0: msg 'FAIL_DISPLAY_OTHER_PAGE' & exit
if $display_options[0] ! 'unrelated text': msg 'FAIL_UNRELATED_MENU' & exit`;f('cache',cache);
f('panel',`room1_state=CONST_INT['slave_exist']
room1['stamina']=3
room1['gladiatrix']=3
*clr
gs 'jo9_room_duty','panel',1
if instr($maintxt,'하루 칼로리')=0: msg 'FAIL_TOOLTIP_CONTENT' & exit
if instr($maintxt,'&#10;현재 불가 사유:')=0: msg 'FAIL_TOOLTIP_NEWLINE' & exit
if instr($maintxt,'<style')>0: msg 'FAIL_INLINE_LAYOUT' & exit
if instr($maintxt,'jo9_duty_label')=0: msg 'FAIL_LABEL_STRUCTURE' & exit`);
fs.writeFileSync(T+'/green-plan.json',JSON.stringify(plan,null,2));console.log(plan.map(x=>x.name));
