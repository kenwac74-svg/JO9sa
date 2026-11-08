'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/sfx-hooks-20261108';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const write=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const helper=[
'! JO9 MOD START SFX_GARSID_BLUNT_20261108',
"if $args[0]='reset': killvar 'jo9_sfx_pending' & exit",
"if $args[0]='start':",
" killvar 'jo9_sfx_pending'",
' if args[1]=1: exit',
' local jo9_sfx_i',
' for jo9_sfx_i=1 to количество_врагов:',
"  if $враг[jo9_sfx_i]='garsid': jo9_sfx_pending['garsid']=1",
' end',' exit','end',
"if $args[0]='hit':",
" if $args[1]='дробящий': jo9_sfx_pending['blunt']=1",
' exit','end',
"if $args[0]='flush':",
" local jo9_sfx_g, jo9_sfx_b",
" jo9_sfx_g=jo9_sfx_pending['garsid']",
" jo9_sfx_b=jo9_sfx_pending['blunt']",
" killvar 'jo9_sfx_pending'",
' if sound_on!1: exit',
" if jo9_sfx_g=1: play 'content/snd/gsid.wav',sound_volume",
" if jo9_sfx_b=1: play 'content/snd/blunt.wav',sound_volume",
'end',
'! JO9 MOD END SFX_GARSID_BLUNT_20261108'
].join('\r\n');
const mode=process.argv[2];
if(mode==='prepare'){
 fs.mkdirSync(tmp+'/mods',{recursive:true});const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw);assert(c.serialize(d).equals(raw));
 const mod={id:'2026-11-08_garsid_blunt_playback',status:'APPROVED',description:'사용자 게임 적용 지시. 가르시드 전투 진입과 실제 둔기 피해 발생을 소리 ON/효과음 음량에 맞춰 연결. 사용자 청감 검사는 생략.',before_sha256:d.hash,after_sha256:'',edits:[],add_locations:[{name:'jo9_combat_sfx',desc:'',body:helper,actions:[]}]};
 function edit(name,old,add,tag){const l=d.locations.find(x=>x.name===name),b=c.shift(d.lines[l.body],5);assert.equal(b.split(old).length-1,1,name+' anchor');const next=old+'\r\n! JO9 MOD START '+tag+'\r\n'+add+'\r\n! JO9 MOD END '+tag;mod.edits.push({location:name,field:'body',old,new:next,count:1,patchId:tag});d.lines[l.body]=c.shift(b.replace(old,next),-5);}
 edit('начать_бой',"end\r\njo9_fog['resuming'] = 0","gs 'jo9_combat_sfx','start',jo9_fog['resuming']",'SFX_START_20261108');
 // The resuming flag must be read before the existing reset.
 let e=mod.edits[0];e.new=e.new.replace("end\r\njo9_fog['resuming'] = 0\r\n","end\r\n").replace('! JO9 MOD END SFX_START_20261108','! JO9 MOD END SFX_START_20261108\r\njo9_fog[\'resuming\'] = 0');d.lines[d.locations.find(l=>l.name==='начать_бой').body]=c.shift(c.shift(d.lines[d.locations.find(l=>l.name==='начать_бой').body],5).replace(e.old+'\r\n! JO9 MOD START SFX_START_20261108\r\ngs \'jo9_combat_sfx\',\'start\',jo9_fog[\'resuming\']\r\n! JO9 MOD END SFX_START_20261108',e.new),-5);
 edit('конец_раунда'," $jo9_bui_hit_id[текущий] = $враг[текущий]"," gs 'jo9_combat_sfx','hit',$тип_нанесенного_вреда",'SFX_HIT_20261108');
 edit('атака_игрока'," $jo9_bui_hit_id[вторцель] = $враг[вторцель]"," gs 'jo9_combat_sfx','hit',$тип_нанесенного_вреда",'SFX_SECONDARY_20261108');
 edit('конец_раунда',"\t\tif $тип_нанесенного_вреда[i] = 'дробящий':","   if cheat_fight_dif * нанесенный_вред[i] > 0: gs 'jo9_combat_sfx','hit','дробящий'",'SFX_ENEMY_HIT_20261108');
 edit('боевой_интерфейс','dynamic $play_music &! $toplay varies depending on the opponent so it is set elsewhere - ImperatorAugustus',"gs 'jo9_combat_sfx','flush'",'SFX_FLUSH_20261108');
 edit('конец_боя',"gs 'jo9_battle_fate', 'result'","gs 'jo9_combat_sfx','flush'",'SFX_FINAL_HIT_20261108');
 edit('$combat_variable_reset',"gs 'jo9_traits_combat', 'reset'","gs 'jo9_combat_sfx','reset'",'SFX_RESET_20261108');
 edit('$ongload',"gs 'jo9_gameover_audio','load',$curloc","gs 'jo9_combat_sfx','reset'",'SFX_LOAD_20261108');
 d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift('jo9_combat_sfx',-5),'',c.shift(helper,-5),c.shift('0',-5));const candidate=c.serialize(d);qa.inspectWorld(candidate);mod.after_sha256=c.parse(candidate).hash;
 // Replay the declared edits independently to check the prepared result.
 const check=c.parse(raw);for(const e of mod.edits){const l=check.locations.find(x=>x.name===e.location),b=c.shift(check.lines[l.body],5);assert.equal(b.split(e.old).length-1,1);check.lines[l.body]=c.shift(b.replace(e.old,e.new),-5);}check.lines[3]=c.shift(String(check.locations.length+1),-5);check.lines.splice(check.lines.length-1,0,c.shift('jo9_combat_sfx',-5),'',c.shift(helper,-5),c.shift('0',-5));assert(c.serialize(check).equals(candidate));
 fs.writeFileSync(tmp+'/candidate.qsp',candidate);write(tmp+'/mods/'+mod.id+'.json',mod);write(__dirname+'/prepared.json',{id:mod.id,before:mod.before_sha256,after:mod.after_sha256,edits:mod.edits.length});
 const lines=d.lines.slice(0,4);lines[3]=c.shift('2',-5);const start=["sound_on=0 & sound_volume=0", "количество_врагов=2 & $враг[1]='goblin' & $враг[2]='garsid'", "gs 'jo9_combat_sfx','start',0", "if jo9_sfx_pending['garsid']!1: msg 'JO9_QA_SFX_fail' & exit", "gs 'jo9_combat_sfx','hit','дробящий'", "gs 'jo9_combat_sfx','flush'", "if arrsize('jo9_sfx_pending')!0: msg 'JO9_QA_SFX_fail' & exit", "gs 'jo9_combat_sfx','start',1", "if arrsize('jo9_sfx_pending')!0: msg 'JO9_QA_SFX_fail' & exit", "sound_on=1", "gs 'jo9_combat_sfx','start',0 & gs 'jo9_combat_sfx','hit','дробящий' & gs 'jo9_combat_sfx','flush'", "msg 'JO9_QA_SFX_hooks_COMPLETE'"].join('\r\n');for(const[n,b]of[['Start',start],['jo9_combat_sfx',helper]])lines.push(c.shift(n,-5),'',c.shift(b,-5),c.shift('0',-5));lines.push('');fs.writeFileSync(tmp+'/hooks.qsp',c.serialize({lines}));fs.copyFileSync(game+'/config.xml',tmp+'/config.xml');fs.writeFileSync(tmp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');write(tmp+'/plan.json',[{name:'hooks',file:tmp+'/hooks.qsp',checkpoint:'Minimal hook syntax and pending state check, no listening test',marker:'JO9_QA_SFX_hooks_COMPLETE'}]);
 console.log(JSON.stringify({edits:mod.edits.length,after:mod.after_sha256}));
}else if(mode==='stage'){
 const p=JSON.parse(fs.readFileSync(__dirname+'/prepared.json'));assert.equal(hash(game+'/jack.qsp'),p.before);const stamp=new Date(Date.now()+9*3600000).toISOString().replace(/[-:.TZ]/g,'').slice(0,14),backup='G:/somi/JO9_work_backups/sfx-hooks-'+stamp;fs.mkdirSync(backup,{recursive:true});fs.copyFileSync(game+'/jack.qsp',backup+'/before.qsp');assert.equal(hash(backup+'/before.qsp'),p.before);fs.copyFileSync(tmp+'/mods/'+p.id+'.json',repo+'/mods/'+p.id+'.json');fs.copyFileSync(tmp+'/mods/'+p.id+'.json',game+'/mods/'+p.id+'.json');write(__dirname+'/backup.json',{backup,before:p.before});console.log(backup);
}else throw Error('mode');
