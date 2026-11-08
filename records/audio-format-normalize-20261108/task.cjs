'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const temp='G:/Codex/tmp/audio-format-normalize-20261108';
const tool='G:/Codex/tools/ffmpeg-9.0.2';
const out=__dirname;
const core=require(repo+'/tools/text-workshop/core.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const hash=f=>sha(fs.readFileSync(f));
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const write=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const run=(exe,args)=>cp.execFileSync(tool+'/'+exe,args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
const probe=f=>readProbe(run('ffprobe.exe',['-v','error','-show_streams','-show_format','-of','json',f]));
function readProbe(s){const x=JSON.parse(s),a=x.streams.find(x=>x.codec_type==='audio');assert(a,'No audio stream');return {codec:a.codec_name,sampleRate:+a.sample_rate,channels:a.channels,bits:a.bits_per_sample||0,duration:+(a.duration||x.format.duration),format:x.format.format_name};}
function bgmNames(raw){
 const d=core.parse(raw),names=new Set(['chinatown.wav','agraba_intro.wav']);
 for(const l of d.locations){const b=core.shift(d.lines[l.body],5);for(const line of b.split(/\r?\n/)){
  if(!/\$music\[|music_volume|only.*loop/i.test(line))continue;
  for(const m of line.matchAll(/content[\\/]snd[\\/]([\w .-]+\.wav)/gi))names.add(m[1].toLowerCase());
 }}return names;
}
function fixture(raw){
 const d=core.parse(raw),helper=d.locations.find(x=>x.name==='jo9_audio_formats');
 const body=[
  'sound_on=0 & music_volume=0 & qa_protected=2468',
  "$music['poor']='content/snd/city_poor.wav' & $music['external']='content/modworkpic/sound/outside.mp3'",
  "$fogs_options[2]=\"if sound_on=1: play 'content\\snd\\fight_master.wav',sound_volume,'only, loop'\"",
  "$music_now='content\\snd\\HOME.WAV'",
  "if loc('jo9_audio_formats'): gs 'jo9_audio_formats'",
  "if $music_now ! 'content/snd/home.mp3': msg 'JO9_QA_AUDIONORM_legacy_home_FAILED' & exit",
  "if $music['poor'] ! 'content/snd/city_poor.mp3' or $music['external'] ! 'content/modworkpic/sound/outside.mp3': msg 'JO9_QA_AUDIONORM_music_array_FAILED' & exit",
  "if instr($fogs_options[2],'fight_master.mp3')=0 or instr($fogs_options[2],'fight_master.wav')>0: msg 'JO9_QA_AUDIONORM_cached_dynamic_FAILED' & exit",
  "$music_now='content/snd/JAFARS_THEME.Wav' & gs 'jo9_audio_formats'",
  "if $music_now ! 'content/snd/Jafars_theme.mp3': msg 'JO9_QA_AUDIONORM_case_FAILED' & exit",
  "$music_now='content/snd/door.wav' & gs 'jo9_audio_formats'",
  "if $music_now ! 'content/snd/door.wav': msg 'JO9_QA_AUDIONORM_effect_changed_FAILED' & exit",
  "$music_now='content/modworkpic/sound/gameoverbgm.mp3' & gs 'jo9_audio_formats'",
  "if $music_now ! 'content/modworkpic/sound/gameoverbgm.mp3': msg 'JO9_QA_AUDIONORM_custom_changed_FAILED' & exit",
  "$music_now='content/snd/home.mp3' & gs 'jo9_audio_formats' & gs 'jo9_audio_formats'",
  "if $music_now ! 'content/snd/home.mp3' or qa_protected!2468: msg 'JO9_QA_AUDIONORM_idempotence_FAILED' & exit",
  "msg 'JO9_QA_AUDIONORM_migration_COMPLETE'"
 ].join('\r\n');
 const lines=d.lines.slice(0,4);lines[3]=core.shift(helper?'2':'1',-5);
 lines.push(core.shift('Start',-5),'',core.shift(body,-5),core.shift('0',-5));
 if(helper)lines.push(core.shift(helper.name,-5),'',d.lines[helper.body],core.shift('0',-5));
 lines.push('');const b=core.serialize({lines});core.parse(b);return b;
}
const mode=process.argv[2];
fs.mkdirSync(temp,{recursive:true});
if(mode==='inventory'){
 const raw=fs.readFileSync(game+'/jack.qsp'),names=bgmNames(raw),files=[];
 for(const name of fs.readdirSync(game+'/content/snd')){
  if(!/\.(wav|mp3|ogg|flac)$/i.test(name))continue;
  const file=game+'/content/snd/'+name;
  files.push({name,role:names.has(name.toLowerCase())?'bgm':'sfx',bytes:fs.statSync(file).size,sha256:hash(file),audio:probe(file)});
 }
 assert.equal(files.length,102);assert.equal(files.filter(x=>x.role==='bgm').length,30);assert.equal(files.filter(x=>x.role==='sfx').length,72);
 for(const x of files.filter(x=>x.role==='sfx'))assert(x.audio.format==='wav'&&/^pcm_/.test(x.audio.codec),x.name+' is not PCM WAV');
 const v={game,workQspSha256:sha(raw),files,missingBgm:[...names].filter(n=>!files.some(x=>x.name.toLowerCase()===n))};
 write(out+'/inventory.json',v);
 const fixtureFile=temp+'/migration-before.qsp';fs.writeFileSync(fixtureFile,fixture(raw));fs.copyFileSync(game+'/config.xml',temp+'/config.xml');fs.writeFileSync(temp+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 write(temp+'/before-plan.json',[{name:'migration-before',file:fixtureFile,checkpoint:'Old-save BGM path migration',marker:'JO9_QA_AUDIONORM_migration_COMPLETE'}]);
 console.log(JSON.stringify({files:files.length,bgm:30,sfx:72,missingBgm:v.missingBgm,bytes:files.reduce((s,x)=>s+x.bytes,0)}));
}else if(mode==='convert'){
 const inv=read(out+'/inventory.json'),stage=temp+'/converted';fs.mkdirSync(stage,{recursive:true});const converted=[];
 for(const x of inv.files.filter(x=>x.role==='bgm')){
  const source=game+'/content/snd/'+x.name,targetName=x.name.replace(/\.wav$/i,'.mp3'),dest=stage+'/'+targetName;assert.equal(hash(source),x.sha256,'Source changed: '+x.name);
  if(x.audio.codec==='mp3'&&x.audio.format==='mp3')fs.copyFileSync(source,dest);
  else run('ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-y','-i',source,'-map','0:a:0','-vn','-map_metadata','-1','-c:a','libmp3lame','-b:a','192k','-id3v2_version','3',dest]);
  const audio=probe(dest);assert.equal(audio.codec,'mp3');assert.equal(audio.format,'mp3');assert.equal(audio.channels,x.audio.channels);assert.equal(audio.sampleRate,x.audio.sampleRate);assert(Math.abs(audio.duration-x.audio.duration)<0.15,'Duration mismatch: '+x.name);
  run('ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-xerror','-i',dest,'-map','0:a:0','-f','null','-']);
  converted.push({oldName:x.name,name:targetName,bytes:fs.statSync(dest).size,sha256:hash(dest),audio,method:x.audio.codec==='mp3'?'copy-existing-mp3':'libmp3lame-192k'});
  console.log('verified '+converted.length+'/30 '+targetName);
 }
 for(const x of inv.files.filter(x=>x.role==='sfx')){
  assert.equal(hash(game+'/content/snd/'+x.name),x.sha256);run('ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-xerror','-i',game+'/content/snd/'+x.name,'-map','0:a:0','-f','null','-']);
 }
 write(out+'/converted.json',{files:converted,decodedSfx:72,beforeBytes:inv.files.reduce((s,x)=>s+x.bytes,0),afterBytes:converted.reduce((s,x)=>s+x.bytes,0)+inv.files.filter(x=>x.role==='sfx').reduce((s,x)=>s+x.bytes,0)});
 console.log('All 30 MP3 and 72 WAV decoded without errors');
}else if(mode==='fixture'){
 const file=process.argv[3],b=fs.readFileSync(file);fs.writeFileSync(temp+'/migration-after.qsp',fixture(b));write(temp+'/after-plan.json',[{name:'migration-after',file:temp+'/migration-after.qsp',checkpoint:'Legacy paths, cached dynamic code, case/backslash, SFX and custom paths, idempotence',marker:'JO9_QA_AUDIONORM_migration_COMPLETE'}]);
}else throw Error('Unknown mode');
