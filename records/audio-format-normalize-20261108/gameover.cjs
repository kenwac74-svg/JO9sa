'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',temp='G:/Codex/tmp/audio-format-normalize-20261108';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f));
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const write=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const mode=process.argv[2];
if(mode==='fixture'){
 const raw=fs.readFileSync(process.argv[3]||game+'/jack.qsp'),d=core.parse(raw),helper=d.locations.find(x=>x.name==='jo9_gameover_audio');
 const start=[
  'sound_on=0 & music_volume=0 & sound_volume=0 & qa_guard=5791',
  "$music_now='content/snd/home.mp3'",
  "if loc('jo9_gameover_audio'): gs 'jo9_gameover_audio','enter'",
  "if jo9_gameover_audio_active!1 or $music_now!'content/snd/gameoverbgm.mp3': msg 'JO9_QA_GAMEOVER_enter_FAILED' & exit",
  "$music_now='sentinel' & gs 'jo9_gameover_audio','enter'",
  "if $music_now!'sentinel': msg 'JO9_QA_GAMEOVER_reentry_FAILED' & exit",
  "$music_now='content/snd/gameoverbgm.mp3' & gs 'jo9_gameover_audio','leave','exit'",
  "if jo9_gameover_audio_active!1: msg 'JO9_QA_GAMEOVER_exit_screen_FAILED' & exit",
  "gs 'jo9_gameover_audio','leave','city_screen'",
  "if jo9_gameover_audio_active!0 or $music_now!'': msg 'JO9_QA_GAMEOVER_leave_FAILED' & exit",
  "jo9_gameover_audio_active=1 & $music_now='content/snd/home.mp3' & gs 'jo9_gameover_audio','leave','main_screen'",
  "if $music_now!'content/snd/home.mp3': msg 'JO9_QA_GAMEOVER_normal_music_FAILED' & exit",
  "jo9_gameover_audio_active=1 & gs 'jo9_gameover_audio','load','city_screen'",
  "if jo9_gameover_audio_active!0 or $music_now!'content/snd/home.mp3': msg 'JO9_QA_GAMEOVER_load_FAILED' & exit",
  "gs 'jo9_gameover_audio','load','exit'",
  "if jo9_gameover_audio_active!1 or qa_guard!5791: msg 'JO9_QA_GAMEOVER_gameover_load_FAILED' & exit",
  "msg 'JO9_QA_GAMEOVER_scope_COMPLETE'"
 ].join('\r\n');
 const lines=d.lines.slice(0,4);lines[3]=core.shift(helper?'2':'1',-5);lines.push(core.shift('Start',-5),'',core.shift(start,-5),core.shift('0',-5));if(helper)lines.push(core.shift(helper.name,-5),'',d.lines[helper.body],core.shift('0',-5));lines.push('');
 const file=temp+'/gameover-scope.qsp';fs.writeFileSync(file,core.serialize({lines}));write(temp+'/gameover-plan.json',[{name:'gameover-scope',file,checkpoint:'Only gameover entry starts music; reentry, leave, normal music and save load boundaries',marker:'JO9_QA_GAMEOVER_scope_COMPLETE'}]);console.log(helper?'candidate fixture':'baseline fixture');
}else if(mode==='prepare'){
 const bg='content/snd/gameoverbgm.mp3',fx='content/snd/gameover.wav';
 const helper=[
  '! JO9 MOD START GAMEOVER_AUDIO_SCREEN_ONLY_20261108',
  "if $args[0]='enter':",
  ' if jo9_gameover_audio_active=1: exit',
  ' jo9_gameover_audio_active=1',
  ` $music_now='${bg}'`,
  ' if sound_on=1:',
  `  play '${bg}',music_volume,'only, loop'`,
  `  play '${fx}',sound_volume`,
  ' end',' exit','end',
  "if $args[0]='leave':",
  " if $args[1]='exit' or jo9_gameover_audio_active!1: exit",
  ' jo9_gameover_audio_active=0',
  ` close '${bg}'`,` close '${fx}'`,
  ` if $music_now='${bg}': $music_now=''`,
  ' exit','end',
  "if $args[0]='load':",
  ' jo9_gameover_audio_active=0',
  " if $args[1]='exit': gs 'jo9_gameover_audio','enter' & exit",
  ` if $music_now='${bg}': $music_now=''`,
  " if sound_on=1 and $music_now!'':",
  "  play $music_now,music_volume,'only, loop'",
  ' else',`  close '${bg}'`,`  close '${fx}'`,
  ' end','end',
  '! JO9 MOD END GAMEOVER_AUDIO_SCREEN_ONLY_20261108'
 ].join('\r\n');
 const raw=fs.readFileSync(game+'/jack.qsp'),d=core.parse(raw),id='2026-11-08_gameover_audio_screen_only';
 const mod={id,status:'APPROVED',description:'게임오버 화면에만 gameoverbgm.mp3와 gameover.wav를 재생한다. 화면 이탈과 로드에서 정지하고 일반 전투 패배에는 연결하지 않는다.',before_sha256:d.hash,after_sha256:'',edits:[],add_locations:[{name:'jo9_gameover_audio',desc:'',body:helper,actions:[]}]};
 function prepend(name,code,marker){const l=d.locations.find(x=>x.name===name),body=core.shift(d.lines[l.body],5),old=body.split('\r\n').slice(0,3).join('\r\n');assert.equal(body.split(old).length-1,1);const next='! JO9 MOD START '+marker+'\r\n'+code+'\r\n! JO9 MOD END '+marker+'\r\n'+old;mod.edits.push({location:name,field:'body',old,new:next,count:1,patchId:marker});d.lines[l.body]=core.shift(body.replace(old,next),-5);}
 {const l=d.locations.find(x=>x.name==='exit'),body=core.shift(d.lines[l.body],5),old="gs '_layout'";assert.equal(body.split(old).length-1,1);const next=old+"\r\n! JO9 MOD START GAMEOVER_AUDIO_ENTER_20261108\r\ngs 'jo9_gameover_audio','enter'\r\n! JO9 MOD END GAMEOVER_AUDIO_ENTER_20261108";mod.edits.push({location:'exit',field:'body',old,new:next,count:1,patchId:'GAMEOVER_AUDIO_ENTER_20261108'});d.lines[l.body]=core.shift(body.replace(old,next),-5);}
 prepend('_layout',"gs 'jo9_gameover_audio','leave',$curloc",'GAMEOVER_AUDIO_LAYOUT_LEAVE_20261108');
 prepend('main_menu',"gs 'jo9_gameover_audio','leave','main_menu'",'GAMEOVER_AUDIO_MENU_LEAVE_20261108');
 const formatMod=read(repo+'/mods/2026-11-08_audio_formats_mp3_bgm_wav_sfx.json');
 const l=d.locations.find(x=>x.name==='$ongload'),body=core.shift(d.lines[l.body],5),old=formatMod.edits.find(x=>x.location==='$ongload').new;assert.equal(body.split(old).length-1,1);const next=old.replace("gs 'jo9_audio_formats'","gs 'jo9_audio_formats'\r\ngs 'jo9_gameover_audio','load',$curloc");mod.edits.push({location:'$ongload',field:'body',old,new:next,count:1,patchId:'GAMEOVER_AUDIO_LOAD_20261108'});d.lines[l.body]=core.shift(body.replace(old,next),-5);
 d.lines[3]=core.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,core.shift('jo9_gameover_audio',-5),'',core.shift(helper,-5),core.shift('0',-5));const candidate=core.serialize(d);qa.inspectWorld(candidate);mod.after_sha256=core.parse(candidate).hash;
 fs.mkdirSync(temp+'/gameover-mods',{recursive:true});fs.writeFileSync(temp+'/gameover-mods/'+id+'.json',JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(temp+'/gameover-candidate.qsp',candidate);
 const media=temp+'/gameover-media';fs.mkdirSync(media,{recursive:true});fs.copyFileSync(game+'/content/modworkpic/sound/gameoverbgm.mp3',media+'/gameoverbgm.mp3');
 const ffmpeg='G:/Codex/tools/ffmpeg-9.0.2/ffmpeg.exe';cp.execFileSync(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-y','-i',game+'/content/modworkpic/sound/gameover.mp3','-map','0:a:0','-vn','-map_metadata','-1','-c:a','pcm_s16le',media+'/gameover.wav'],{windowsHide:true});
 const assets=[];for(const name of ['gameoverbgm.mp3','gameover.wav']){cp.execFileSync(ffmpeg,['-nostdin','-hide_banner','-loglevel','error','-xerror','-i',media+'/'+name,'-f','null','-'],{windowsHide:true});assets.push({name,sha256:hash(media+'/'+name),bytes:fs.statSync(media+'/'+name).size});}
 write(__dirname+'/gameover-prepared.json',{id,beforeSha256:mod.before_sha256,afterSha256:mod.after_sha256,assets});console.log(JSON.stringify({after:mod.after_sha256,assets}));
}else if(mode==='stage'){
 const p=read(__dirname+'/gameover-prepared.json'),state=read(__dirname+'/installation.json');assert.equal(hash(game+'/jack.qsp'),p.beforeSha256);
 for(const f of [game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp']){const h=hash(f),saved=state.backup+'/payloads/'+h;if(!fs.existsSync(saved))fs.copyFileSync(f,saved);assert.equal(hash(saved),h);state.restore.push({target:f,payload:saved,sha256:h,stage:'before-gameover'});}
 state.gameoverApplyBackupsBefore=fs.readdirSync(game).filter(n=>/^jack\.qsp\.bak_/.test(n));
 for(const x of p.assets)for(const root of [game+'/content/snd',repo+'/assets/content/snd']){const target=root+'/'+x.name;if(fs.existsSync(target))assert.equal(hash(target),x.sha256);else fs.copyFileSync(temp+'/gameover-media/'+x.name,target);assert.equal(hash(target),x.sha256);}
 fs.copyFileSync(temp+'/gameover-mods/'+p.id+'.json',repo+'/mods/'+p.id+'.json');fs.copyFileSync(temp+'/gameover-mods/'+p.id+'.json',game+'/mods/'+p.id+'.json');write(__dirname+'/installation.json',state);write(state.backup+'/restore.json',state);
}else if(mode==='finish'){
 const p=read(__dirname+'/gameover-prepared.json'),state=read(__dirname+'/installation.json');assert.equal(hash(game+'/jack.qsp'),p.afterSha256);fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');
 const mf=repo+'/assets/runtime-source-2.4.1.json',m=read(mf);m.sourceQspSha256=p.afterSha256;
 for(const x of p.assets){const v={runtimePath:'content/snd/'+x.name,repositoryPath:'assets/content/snd/'+x.name,bytes:x.bytes,sha256:x.sha256};const i=m.files.findIndex(a=>a.runtimePath===v.runtimePath);if(i<0)m.files.push(v);else m.files[i]=v;}
 write(mf,m);
 let build=fs.readFileSync(repo+'/tools/sound-audition/build.cjs','utf8');const needle="${esc(c.role)}</code>";assert.equal(build.split(needle).length-1,1);build=build.replace(needle,"${esc(c.role === 'defeat' ? '게임오버' : c.role)}</code>");
 const end="${player('chinatown.wav', 'bgm:unassigned:chinatown.wav')}</td></tr>`;";assert.equal(build.split(end).length-1,1);build=build.replace(end,"${player('chinatown.wav', 'bgm:unassigned:chinatown.wav')}</td></tr>` + `<tr><td>게임오버 화면</td><td>해당 화면에서만 재생</td><td>${player('gameoverbgm.mp3', 'bgm:gameover:gameoverbgm.mp3')}</td></tr>`;");fs.writeFileSync(repo+'/tools/sound-audition/build.cjs',build);cp.execFileSync(process.execPath,[repo+'/tools/sound-audition/build.cjs'],{cwd:repo,windowsHide:true});
 const html=fs.readFileSync(repo+'/tools/sound-audition/청취_목록.html','utf8'),keys=[...html.matchAll(/class="local-slot" data-row-key="([^"]+)"/g)].map(a=>a[1]);for(const k of state.oldSlotKeys)assert(keys.includes(k));assert.equal(keys.length,state.oldSlotKeys.length+1);assert.equal(hash(state.settings),state.settingsSha256);
 for(const name of fs.readdirSync(game).filter(n=>/^jack\.qsp\.bak_/.test(n)&&!state.gameoverApplyBackupsBefore.includes(n))){const f=path.resolve(game+'/'+name);assert.equal(path.dirname(f),path.resolve(game));if(hash(f)===p.beforeSha256){assert(fs.existsSync(state.backup+'/payloads/'+p.beforeSha256));fs.unlinkSync(f);}}
 state.workQspSha256=p.afterSha256;state.runtimeSnapshotSha256=hash(repo+'/assets/runtime/2.4.1/jack.qsp');state.gameover=p;state.auditionKeysPreserved=state.oldSlotKeys.length;state.auditionAddedKeys=['bgm:gameover:gameoverbgm.mp3'];state.totalBgm=31;state.totalSfx=73;state.afterBytes=read(__dirname+'/converted.json').afterBytes+p.assets.reduce((n,a)=>n+a.bytes,0);write(__dirname+'/installation.json',state);write(state.backup+'/restore.json',state);console.log(JSON.stringify({after:p.afterSha256,bgm:31,sfx:73,existingKeysPreserved:state.oldSlotKeys.length,addedKeys:1}));
}else throw Error('Unknown mode');
