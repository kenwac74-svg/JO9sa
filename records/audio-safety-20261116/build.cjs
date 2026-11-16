'use strict';
const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/audio-safety-20261116',H=__dirname;
const before=fs.readFileSync(G+'/jack.qsp'),base=c.parse(before),next=c.parse(before),get=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(n,b)=>{next.lines[next.locations.find(x=>x.name===n).body]=c.shift(b,-5);};
const guard=`! JO9 MOD START AUDIO_CLOSE_GUARD_20261116
if $args[0]='exists':
 local $jo9_audio_check=replace($args[1],'\\','/')
 local jo9_audio_file_exists=0
 if $jo9_audio_check='': result=0 & exit
 if instr($jo9_audio_check,'%')>0: result=0 & exit
 dynamic 'jo9_audio_file_exists = %<<$jo9_audio_check>>%'
 result=jo9_audio_file_exists
 exit
end
if $args[0]='close':
 local $jo9_audio_close_path=replace($args[1],'\\','/')
 if func('jo9_audio_formats','exists',$jo9_audio_close_path)=1: close $jo9_audio_close_path
 exit
end
if $args[0]='effect':
 local $jo9_audio_effect=replace($args[1],'\\','/')
 if $jo9_audio_effect='': $result='' & exit
 if instr($jo9_audio_effect,'/')>0:
  $result=$jo9_audio_effect
 else
  $result='content/snd/'+$jo9_audio_effect
 end
 if instr(lcase($result),'.wav')=0 and instr(lcase($result),'.mp3')=0 and instr(lcase($result),'.ogg')=0: $result+='.wav'
 exit
end
! JO9 MOD END AUDIO_CLOSE_GUARD_20261116
`.replace(/\r?\n/g,'\r\n');
let audio=get(next,'jo9_audio_formats');audio=guard+audio.replace('  close $jo9_audio_old',"  ! JO9 MOD START AUDIO_CLOSE_GUARD_20261116\r\n  gs 'jo9_audio_formats','close',$jo9_audio_old\r\n  ! JO9 MOD END AUDIO_CLOSE_GUARD_20261116");
const cached=" $play_music=replace($play_music,'$music[','$jo9_bgm_track[')";
a.equal(audio.split(cached).length-1,1);
audio=audio.replace(cached,cached+`\r\n ! JO9 MOD START AUDIO_LOADED_TRACK_REPAIR_20261116
 if $toplay!'' and $toplay!'jo9_playlist' and $toplay!'jo9_direct_event':
  local $jo9_audio_expected=$jo9_bgm_track[$toplay]
  if $jo9_audio_expected!'':
   if func('jo9_audio_formats','exists',$music_now)=0 and func('jo9_audio_formats','exists',$jo9_audio_expected)=1: $music_now=$jo9_audio_expected
  end
 end
 ! JO9 MOD END AUDIO_LOADED_TRACK_REPAIR_20261116`.replace(/\r?\n/g,'\r\n'));
set('jo9_audio_formats',audio);
for(const n of ['jo9_gameover_audio','jo9_residence_bgm','interaction_city']){
 let b=get(next,n),count=0;
 b=b.replace(/^(\s*)(.*?)(close (?:'content\/snd\/(?:gameoverbgm\.mp3|gameover\.wav|Agraba\.mp3)'|\$music_now))\s*$/gm,(all,sp,prefix,call)=>{
  if(n==='interaction_city'&&!call.includes('Agraba'))return all;
  count++;return sp+'! JO9 MOD START AUDIO_CLOSE_GUARD_20261116\r\n'+sp+prefix+"gs 'jo9_audio_formats','close',"+call.slice(6)+'\r\n'+sp+'! JO9 MOD END AUDIO_CLOSE_GUARD_20261116';
 });
 a.equal(count,n==='jo9_gameover_audio'?4:1,n);set(n,b.replace(/\r?\n/g,'\r\n'));
}
let effectSites=0;for(const l of next.locations){const b=get(next,l.name),re=/(['"])content[\\/]snd[\\/]<<\$play_sound\[txt\]>>\.wav\1/g;let n=0;const value=b.replace(re,()=>{n++;return "$func('jo9_audio_formats','effect',$play_sound[txt])";});if(n){effectSites+=n;set(l.name,value);}}a.equal(effectSites,13);
const edits=[];for(const l of next.locations){const old=get(base,l.name),value=get(next,l.name);if(old===value)continue;let start=0,endOld=old.length,endNew=value.length;while(old[start]===value[start]&&start<Math.min(endOld,endNew))start++;while(endOld>start&&endNew>start&&old[endOld-1]===value[endNew-1]){endOld--;endNew--;}const e=c.minimalEdit(old,value,start,endOld,endNew);edits.push({location:l.name,field:'body',...e,count:1,patchId:'AUDIO_CLOSE_GUARD_20261116'});}
const after=c.serialize(next);a(c.serialize(c.parse(after)).equals(after));
fs.writeFileSync(H+'/patch.json',JSON.stringify({id:'2026-11-16_audio_close_guard',before_sha256:c.hash(before),after_sha256:c.hash(after),edits},null,2));
fs.mkdirSync(T,{recursive:true});fs.mkdirSync(T+'/content/snd',{recursive:true});
for(const f of ['spires.mp3','fight_master.mp3','girl_suffering.wav'])if(!fs.existsSync(T+'/content/snd/'+f))fs.linkSync(G+'/content/snd/'+f,T+'/content/snd/'+f);
fs.writeFileSync(T+'/config.xml','<game width="400" height="150" title="JO9 Audio Safety QA"/>');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=false\r\n');
const cases={
 legacy:"sound_on=0\r\n$music_now='content/snd/fight_master.wav'\r\nplay $music_now,0,'loop'\r\ngs 'jo9_audio_formats'",
 gameoverleave:"sound_on=0\r\njo9_gameover_audio_active=1\r\nplay 'content/snd/gameoverbgm.mp3',0,'loop'\r\nplay 'content/snd/gameover.wav',0\r\ngs 'jo9_gameover_audio','leave','main_screen'",
 gameoverload:"sound_on=0\r\nplay 'content/snd/gameoverbgm.mp3',0,'loop'\r\nplay 'content/snd/gameover.wav',0\r\ngs 'jo9_gameover_audio','load','city_screen'",
 pause:"jo9_bgm_active=1\r\n$jo9_bgm_paths[0]='content/snd/missing_old.mp3'\r\n$music_now=$jo9_bgm_paths[0]\r\nplay $music_now,0,'loop'\r\ngs 'jo9_residence_bgm','pause'",
 agraba:"play 'content/snd/Agraba.mp3',0,'loop'\r\n@AGRABA@",
 validclose:"play 'content/snd/spires.mp3',50,'loop'\r\ngs 'jo9_audio_formats','close','content\\snd\\spires.mp3'\r\n$ongsave=''\r\nsavegame 'valid-stop.sav'",
 loadedtrack:"$toplay='fight'\r\n$music_now='girls/scene/Alexia/music'\r\ngs 'jo9_audio_formats','tracks'\r\nif $music_now!'content/snd/fight_master.mp3': msg 'BAD_REPAIR' & exit",
 effects:"if $func('jo9_audio_formats','effect','girl_suffering')!'content/snd/girl_suffering.wav': msg 'BAD_STEM' & exit\r\nif $func('jo9_audio_formats','effect','content/snd/girl_suffering.wav')!'content/snd/girl_suffering.wav': msg 'BAD_FULL' & exit\r\nif $func('jo9_audio_formats','effect','content\\snd\\girl_suffering.wav')!'content/snd/girl_suffering.wav': msg 'BAD_SLASH' & exit\r\nif $func('jo9_audio_formats','effect','spires.mp3')!'content/snd/spires.mp3': msg 'BAD_MP3' & exit\r\nplay $func('jo9_audio_formats','effect','content/snd/girl_suffering.wav'),50\r\n$ongsave=''\r\nsavegame 'effect-path.sav'"
};
const names=['jo9_audio_formats','jo9_gameover_audio','jo9_residence_bgm'],plan=[];
for(const [caseName,setup]of Object.entries(cases))for(const mode of (['validclose','loadedtrack','effects'].includes(caseName)?['green']:['red','green'])){
 const doc=mode==='red'?base:next;
 const agraba=mode==='red'?"close 'content/snd/Agraba.mp3'":"gs 'jo9_audio_formats','close','content/snd/Agraba.mp3'";
 const name=mode+'-'+caseName,marker='JO9_QA_AUDIOSAFE_'+name.replaceAll('-','_')+'_COMPLETE';
 const start=setup.replace('@AGRABA@',agraba)+"\r\nplay 'content/snd/spires.mp3',50,'only, loop'\r\nmsg '"+marker+"'";
 const fields=['QSPGAME','audio safety','',c.shift(names.length+1+'',-5),c.shift('Start',-5),'',c.shift(start,-5),c.shift('0',-5)];
 for(const n of names)fields.push(c.shift(n,-5),'',c.shift(get(doc,n),-5),c.shift('0',-5));fields.push('');const b=Buffer.from(fields.join('\r\n'),'utf16le');c.parse(b);fs.writeFileSync(T+'/'+name+'.qsp',b);plan.push({name,file:T+'/'+name+'.qsp',marker,checkpoint:caseName});
}
fs.writeFileSync(T+'/plan.json',JSON.stringify(plan,null,2));fs.writeFileSync(T+'/plan-green.json',JSON.stringify(plan.filter(p=>p.name.startsWith('green-')),null,2));fs.writeFileSync(H+'/stage.json',JSON.stringify({before:c.hash(before),after:c.hash(after),locations:edits.map(e=>e.location),tests:plan.map(p=>p.name)},null,2));
console.log('Prepared guarded CLOSE candidate and '+plan.length+' native cases. Production unchanged.');
