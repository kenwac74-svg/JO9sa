'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('../text-workshop/core.cjs');
const cfg=JSON.parse(fs.readFileSync('local.config.json','utf8').replace(/^\uFEFF/,''));
const raw=fs.readFileSync(cfg.GameQsp),doc=core.parse(raw);
function body(d,name){const l=d.locations.find(x=>x.name===name);assert(l);return core.shift(d.lines[l.body],5);}
const dynamic=body(doc,'#dynamic'),player=dynamic.match(/\$play_music = \{\r\n([\s\S]*?)\r\n\}/)[1];
const command="play $music_now, music_volume, 'only, loop'";
assert.equal(player.split(command).length-1,1);
// Intercept the final media instruction only. No actual audio is played.
const intercepted=player.replace(command,'qa_bgm_plays += 1 & $qa_bgm_path = $music_now & qa_bgm_volume = music_volume');
const oldFile='backups/original-ui-retained-20261008T123626/jack.qsp';
const oldDoc=core.parse(fs.readFileSync(oldFile)),oldPlayer=body(oldDoc,'#dynamic').match(/\$play_music = \{\r\n([\s\S]*?)\r\n\}/)[1];
const cases=[
 {name:'normal',sound:1,volume:100,mapping:'content/snd/fight_master.wav',now:'content/snd/home.wav',plays:1},
 {name:'same-track-reentry',sound:1,volume:100,mapping:'content/snd/fight_master.wav',now:'content/snd/fight_master.wav',plays:1},
 {name:'saved-bgm-volume-zero',sound:1,volume:0,mapping:'content/snd/fight_master.wav',now:'',plays:1},
 {name:'saved-sound-off',sound:0,volume:100,mapping:'content/snd/fight_master.wav',now:'',plays:0},
 {name:'missing-saved-track-map',sound:1,volume:100,mapping:'',now:'content/snd/home.wav',plays:0},
];
const quote=s=>"'"+s.replaceAll("'","''")+"'";
const code=['DEBUG=1','autosave=0','decadesave=0','$play_music={\r\n'+intercepted+'\r\n}','qa_bgm_checks=0'];let assertions=0;
function check(condition,label){assertions++;code.push('if '+condition+':',' qa_bgm_checks+=1','else',' msg '+quote('JO9_QA_BGM_FAIL_'+label),' exit','end');}
for(const item of cases){code.push('qa_bgm_plays=0',"$qa_bgm_path=''",'qa_bgm_volume=-1','sound_on='+item.sound,'music_volume='+item.volume,"$toplay='fight'","$music['fight']="+quote(item.mapping),'$music_now='+quote(item.now),'dynamic $play_music');check('qa_bgm_plays='+item.plays,item.name+'_play_count');if(item.plays){check('$qa_bgm_path='+quote(item.mapping),item.name+'_path');check('qa_bgm_volume='+item.volume,item.name+'_volume');}else if(item.mapping==='')check("$music_now=''",item.name+'_empty_map_clears_old_path');}
check('qa_bgm_checks='+assertions,'check_count');const marker='JO9_QA_M20261103_bgm_routing_COMPLETE';code.push('msg '+quote(marker));
doc.lines[doc.locations.find(l=>l.name==='Start').body]=core.shift(code.join('\r\n'),-5);
const out='tmp/battle-bgm-audit-20261103/native';fs.mkdirSync(out,{recursive:true});const target=path.resolve(out,'bgm-routing.qsp');fs.writeFileSync(target,core.serialize(doc));fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify([{name:'bgm-routing',marker,checkpoint:'actual-music-helper-final-play-intercepted-no-audio',file:target}],null,2));
const report={source:cfg.GameQsp,sha256:core.hash(raw),oldSource:oldFile,musicHelperSameAsOctoberBackup:player===oldPlayer,assertions,cases,scope:'Read-only investigation. Native logic check intercepts the media call; it is not an audible playback test and uses no personal saves.'};
fs.mkdirSync('records/battle-bgm-audit-20261103',{recursive:true});fs.writeFileSync('records/battle-bgm-audit-20261103/routing.json',JSON.stringify(report,null,2));console.log(JSON.stringify({assertions,musicHelperSameAsOctoberBackup:report.musicHelperSameAsOctoberBackup}));
