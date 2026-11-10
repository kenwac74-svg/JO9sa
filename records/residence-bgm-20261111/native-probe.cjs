'use strict';
const fs=require('fs'),a=require('assert/strict'),path=require('path');const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',core=require(repo+'/tools/text-workshop/core.cjs');
const input=process.argv[2],out=process.argv[3];a(input&&out);const d=core.parse(fs.readFileSync(input));const get=n=>{const l=d.locations.find(l=>l.name===n);return l?core.shift(d.lines[l.body],5):'';};
function observe(s){return s.replace(/play \$music_now,\s*(music_volume|jo9_bg_volume),\s*'only, loop'/g,(m,v)=>'qa_plays+=1 & $qa_last_play=$music_now & qa_last_volume='+v).replace(/close \$music_now/g,'$qa_last_close=$music_now');}
const matrix=`
gs '#dynamic'
sound_on=1 & music_volume=37 & sound_volume=62
$estate='slum_house' & noble_status=0 & brand_reputation=0
$music['fight']='content/snd/fight_master.mp3'
$music['poor']='content/snd/city_poor.mp3'
$music['citizen']='content/snd/city_citizen.mp3'
$music['honor']='content/snd/city_honor.mp3'
gs 'jo9_residence_bgm','city'
if arrsize('$jo9_bgm_paths')!1 or $jo9_bgm_paths[0]!'content/snd/city_poor.mp3': msg 'FAIL base queue' & exit
faction_fame['serpis']=3
gs 'jo9_residence_bgm','city'
if arrsize('$jo9_bgm_paths')!1: msg 'FAIL below threshold' & exit
faction_fame['serpis']=4 & faction_fame['kamira']=5 & faction_fame['korvus']=6
gs 'jo9_residence_bgm','city'
if arrsize('$jo9_bgm_paths')!4: msg 'FAIL base plus three' & exit
qa_plays=0
gs 'jo9_residence_bgm','play'
$qa_token=$jo9_bgm_token
city_form=111
gs 'jo9_residence_bgm','city'
gs 'jo9_residence_bgm','play'
if $jo9_bgm_token!$qa_token or qa_plays!1: msg 'FAIL visit restarted track' & exit
gs 'jo9_residence_bgm','advance',$qa_token
if jo9_bgm_index!1 or qa_plays!2: msg 'FAIL advance' & exit
gs 'jo9_residence_bgm','advance',$qa_token
if jo9_bgm_index!1 or qa_plays!2: msg 'FAIL stale callback' & exit
__DIRECT_EVENT_CASE__
$toplay='fight'
dynamic $play_music
gs 'jo9_residence_bgm','advance',$jo9_bgm_token
if jo9_bgm_active!0 or $music_now!'content/snd/fight_master.mp3': msg 'FAIL event priority' & exit
gs 'jo9_residence_bgm','city'
gs 'jo9_residence_bgm','play'
music_volume=0
gs 'jo9_residence_bgm','play'
if jo9_bgm_active!0: msg 'FAIL BGM mute' & exit
music_volume=37
gs 'jo9_residence_bgm','play'
if jo9_bgm_active!1: msg 'FAIL BGM unmute' & exit
sound_on=0
gs 'jo9_residence_bgm','play'
if jo9_bgm_active!0: msg 'FAIL all mute' & exit
sound_on=1
killvar 'faction_fame'
$estate='serpis_house' & faction_fame['serpis']=4
gs 'jo9_residence_bgm','city'
if arrsize('$jo9_bgm_paths')!1 or $jo9_bgm_paths[0]!'content/snd/spires.mp3': msg 'FAIL residence duplicate' & exit
noble_status=1 & faction_fame['centralkvartal']=4
gs 'jo9_residence_bgm','city'
if arrsize('$jo9_bgm_paths')!2 or $jo9_bgm_paths[0]!'content/snd/city_honor.mp3': msg 'FAIL honor priority or duplicate' & exit
killvar 'faction_fame'
noble_status=0 & brand_reputation=5 & $estate='white_house'
gs 'jo9_residence_bgm','city'
if $jo9_bgm_paths[0]!'content/snd/city_honor.mp3': msg 'FAIL brand priority' & exit
brand_reputation=4
gs 'jo9_residence_bgm','city'
if $jo9_bgm_paths[0]!'content/snd/vatican.mp3': msg 'FAIL white residence' & exit
faction_fame['neutral']=99
gs 'jo9_residence_bgm','city'
if arrsize('$jo9_bgm_paths')!1: msg 'FAIL unsupported fame' & exit
gs 'jo9_residence_bgm','play'
$qa_token=$jo9_bgm_token
jo9_gameover_audio_active=1
gs 'jo9_residence_bgm','advance',$qa_token
if $jo9_bgm_token!$qa_token or jo9_bgm_index!0: msg 'FAIL gameover guard' & exit
if music_volume!37 or sound_volume!62: msg 'FAIL volume preserved' & exit
msg 'JO9_QA_RESIDENCE_matrix_COMPLETE'
exit`.trim();
function fixture(name,start,controller,extra=[]){const locations=[['Start',start],['#dynamic',observe(get('#dynamic'))],['jo9_residence_bgm',controller],...extra];const lines=['QSPGAME','','',core.shift(String(locations.length),-5)];for(const[n,b]of locations)lines.push(core.shift(n,-5),'',core.shift(b.replace(/\r?\n/g,'\r\n'),-5),core.shift('0',-5));lines.push('');fs.writeFileSync(out+'/'+name+'.qsp',core.serialize({lines}));}
const event=get('interaction_city').match(/gs 'jo9_residence_bgm','event','content\/snd\/Agraba\.mp3',0 & play 'content\/snd\/Agraba\.mp3', music_volume, 'only, loop'/)?.[0]||"qa_direct_event=1";
const fogEvent=get('#options').match(/gs 'jo9_residence_bgm','event','content\\snd\\fight_master\.mp3',1/)?.[0]||'qa_fog_event=1';
const eventCase=`${event.replace(/play 'content\/snd\/Agraba\.mp3', music_volume, 'only, loop'/,"$qa_direct_play='Agraba'")}\ngs 'jo9_residence_bgm','advance',$qa_token\nif jo9_bgm_active!0 or $toplay!'jo9_direct_event' or $music_now!'content/snd/Agraba.mp3': msg 'FAIL direct event priority' & exit\ncity_form=1000\ndynamic $city_sounds\ndynamic $play_music\nif jo9_bgm_active!0 or $music_now!'content/snd/Agraba.mp3' or qa_last_volume!37: msg 'FAIL direct event settings' & exit\ngs 'jo9_residence_bgm','load'\nif jo9_bgm_active!0 or $music_now!'content/snd/Agraba.mp3': msg 'FAIL direct event load' & exit\ncity_form=1\ngs 'jo9_residence_bgm','city'\ngs 'jo9_residence_bgm','play'\nif $qa_last_close!'content/snd/Agraba.mp3': msg 'FAIL event BGM close path' & exit\n${fogEvent}\ncity_form=1000\ndynamic $city_sounds\ndynamic $play_music\nif qa_last_volume!62 or jo9_bgm_active!0: msg 'FAIL event sound volume' & exit\ncity_form=1\ngs 'jo9_residence_bgm','city'\ngs 'jo9_residence_bgm','play'`;
fs.mkdirSync(out,{recursive:true});fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fixture('matrix',matrix.replace('__DIRECT_EVENT_CASE__',eventCase),observe(get('jo9_residence_bgm')));
const plan=[{name:'matrix',file:path.resolve(out,'matrix.qsp'),marker:'JO9_QA_RESIDENCE_matrix_COMPLETE',checkpoint:'base, fame threshold, 4-song list, duplicate, redraw, stale, events, mute, unsupported fame'}];
if(get('jo9_residence_bgm')){
 const src=process.env.JO9_BGM_CLOCK_MODULE||repo+'/assets/content/js/jo9_bgm_clock.js';fs.mkdirSync(out+'/content/js',{recursive:true});fs.copyFileSync(src,out+'/content/js/jo9_bgm_clock.js');const hk=path.resolve(out,'..','jo9_hotkeys.js');fs.copyFileSync(fs.existsSync(hk)?hk:game+'/content/js/jo9_hotkeys.js',out+'/content/js/jo9_hotkeys.js');
 const start=`usehtml=1\ngs '#dynamic'\nsound_on=1 & music_volume=0 & qa_plays=0\n$estate='slum_house' & faction_fame['serpis']=4 & faction_fame['kamira']=4 & faction_fame['korvus']=4\ngs 'jo9_residence_bgm','city'\nmusic_volume=37\njo9_bgm_ms[0]=1000 & jo9_bgm_ms[1]=500 & jo9_bgm_ms[2]=500 & jo9_bgm_ms[3]=500\ngs 'jo9_residence_bgm','play'\n*p '<a id="qa_move" href="EXEC: gs ''qa_move''">move</a><script>setTimeout(function(){document.getElementById("qa_move").click();},300);</script>'`;
 const controller=observe(get('jo9_residence_bgm')).replace('qa_plays+=1 & $qa_last_play=$music_now & qa_last_volume=music_volume',"qa_plays+=1 & $qa_last_play=$music_now & qa_last_volume=music_volume\r\n if qa_plays=5:\r\n  if qa_moves!1: msg 'FAIL page move' & exit\r\n  msg 'JO9_QA_RESIDENCE_clock_COMPLETE' & exit\r\n end");
 const move=`qa_moves+=1\nif jo9_bgm_index!0 or qa_plays!1: msg 'FAIL move reset' & exit\n*clr\n*p '<script src="content/js/jo9_hotkeys.js"></script>'`;
 fixture('clock',start,controller,[['qa_move',move]]);plan.push({name:'clock',file:path.resolve(out,'clock.qsp'),marker:'JO9_QA_RESIDENCE_clock_COMPLETE',checkpoint:'native HTML deadline advances 4 tracks and survives a page clear'});
 const lifecycle=`gs '#dynamic'\nsound_on=1 & music_volume=37 & sound_volume=62 & is_home=0\n$estate='slum_house' & faction_fame['serpis']=4\ngs 'jo9_residence_bgm','city'\ngs 'jo9_residence_bgm','play'\n$qa_old_token=$jo9_bgm_token\ngs 'jo9_gameover_audio','enter'\nif jo9_bgm_active!0 or jo9_gameover_audio_active!1: msg 'FAIL gameover entry' & exit\ngs 'jo9_residence_bgm','advance',$qa_old_token\nif $music_now!'content/snd/gameoverbgm.mp3': msg 'FAIL gameover hijack' & exit\ngs 'jo9_gameover_audio','leave','city_screen'\ngs 'jo9_residence_bgm','city'\ngs 'jo9_residence_bgm','play'\n$qa_old_token=$jo9_bgm_token\nqa_preserved_state=193\ngs 'jo9_residence_bgm','load'\nif $jo9_bgm_token=$qa_old_token or qa_preserved_state!193 or jo9_bgm_active!1: msg 'FAIL load reset' & exit\ngs 'jo9_residence_bgm','advance',$qa_old_token\nif jo9_bgm_index!0: msg 'FAIL loaded stale callback' & exit\nmsg 'JO9_QA_RESIDENCE_lifecycle_COMPLETE'\nexit`;
 const gameover=get('jo9_gameover_audio').replace(/play '([^']+)',music_volume,'only, loop'/g,"$qa_gameover_play='$1'").replace(/play '([^']+)',sound_volume/g,"$qa_gameover_sfx='$1'");
 fixture('lifecycle',lifecycle,observe(get('jo9_residence_bgm')),[['jo9_gameover_audio',gameover]]);plan.push({name:'lifecycle',file:path.resolve(out,'lifecycle.qsp'),marker:'JO9_QA_RESIDENCE_lifecycle_COMPLETE',checkpoint:'actual gameover and load hooks retain priority and invalidate stale tokens'});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2)+'\n');fs.writeFileSync(out+'/probe-input.json',JSON.stringify({inputSha256:d.hash,fixtures:plan.map(p=>({name:p.name,sha256:core.hash(fs.readFileSync(p.file))}))},null,2)+'\n');console.log(JSON.stringify({sha256:d.hash,controllerPresent:!!get('jo9_residence_bgm'),plan:out+'/plan.json'}));
