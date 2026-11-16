const fs=require('fs'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/room-duty-fixes-20261114',c=require(R+'/tools/text-workshop/core.cjs');fs.mkdirSync(T,{recursive:true});fs.copyFileSync(W+'/jack.qsp',T+'/baseline.qsp');fs.copyFileSync(W+'/css/base.css',T+'/base-before.css');fs.cpSync(W+'/json',T+'/json',{recursive:true});fs.copyFileSync(W+'/config.xml',T+'/config.xml');let raw=fs.readFileSync(T+'/baseline.qsp'),d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);let audioLine=body('#options').split('\n').find(x=>x.includes("'event','content\\snd\\fight_master.mp3'"));if(!audioLine)throw Error('audio source missing');fs.writeFileSync(T+'/audio-line.txt',audioLine);function fixture(n,code){let p=c.parse(raw);p.lines[p.locations.find(l=>l.name==='Start').body]=c.shift("killall\r\n$onnewloc=''\r\n$counter=''\r\nsettimer 0\r\ngs '#static_base'\r\n"+code.replace(/\n/g,'\r\n')+`\r\nmsg 'JO9_QA_ROOMFIX_${n}_COMPLETE'`,-5);fs.writeFileSync(T+'/'+n+'.qsp',c.serialize(p));return{name:n,file:T+'/'+n+'.qsp',marker:`JO9_QA_ROOMFIX_${n}_COMPLETE`,checkpoint:n};}let plan=[];plan.push(fixture('gear',`room1_state=CONST_INT['slave_exist']
room1['stamina']=4
room1['gladiatrix']=4
$room1['armor']='кольчуга'
$room1['right_wpn']='безоружный'
$room1['left_wpn']='безоружный'
$room1['back_wpn']='фламберг'
if func('jo9_room_duty','can',1,2) ! 1: msg 'FAIL_BACK_WEAPON_REJECTED' & exit
gs 'jo9_room_duty','gear',1
if jo9_rd_gw ! 4: msg 'FAIL_BACK_GRADE' & exit`));let line=audioLine.replace(/play 'content\\snd\\fight_master\.mp3', (sound_volume|music_volume),'only, loop'/,"qa_play_volume=$1");plan.push(fixture('audio',`sound_on=1
music_volume=73
sound_volume=0
${line.trim()}
if qa_play_volume ! 73: msg 'FAIL_BGM_USES_EFFECTS_VOLUME' & exit
if jo9_bgm_event_sound ! 0: msg 'FAIL_BGM_RESUME_EFFECTS_VOLUME' & exit`));fs.writeFileSync(T+'/red-plan.json',JSON.stringify(plan));console.log(T+'/red-plan.json');
