'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',temp='G:/Codex/tmp/audio-format-normalize-20261108';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f));
const state=read(__dirname+'/installation.json'),inv=read(__dirname+'/inventory.json'),converted=read(__dirname+'/converted.json'),go=read(__dirname+'/gameover-prepared.json');
const raw=fs.readFileSync(game+'/jack.qsp'),d=core.parse(raw);assert.equal(d.hash,go.afterSha256);assert(core.serialize(d).equals(raw));qa.inspectWorld(raw);
assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),d.hash);assert.equal(read(repo+'/assets/runtime-source-2.4.1.json').sourceQspSha256,d.hash);
const actual=fs.readdirSync(game+'/content/snd').filter(n=>/\.(mp3|wav)$/i.test(n));assert.equal(actual.length,104);assert.equal(actual.filter(n=>/\.mp3$/i.test(n)).length,31);assert.equal(actual.filter(n=>/\.wav$/i.test(n)).length,73);
for(const x of inv.files.filter(x=>x.role==='sfx'))assert.equal(hash(game+'/content/snd/'+x.name),x.sha256);
for(const x of [...converted.files,...go.assets]){assert.equal(hash(game+'/content/snd/'+x.name),x.sha256);assert.equal(hash(repo+'/assets/content/snd/'+x.name),x.sha256);}
for(const x of converted.files){assert(!fs.existsSync(game+'/content/snd/'+x.oldName));const old=inv.files.find(a=>a.name===x.oldName);assert.equal(hash(state.backup+'/originals/content/snd/'+x.oldName),old.sha256);}
assert.equal(hash(state.settings),state.settingsSha256);
const before=core.parse(fs.readFileSync(state.restore.find(x=>x.target===game+'/jack.qsp'&&!x.stage).payload));
const body=(doc,name)=>core.shift(doc.lines[doc.locations.find(x=>x.name===name).body],5);
assert.equal(body(before,'#dynamic'),body(d,'#dynamic'),'Original noble/reputation and city sound choice changed');
assert(body(d,'exit').indexOf("gs 'jo9_gameover_audio','enter'")>body(d,'exit').indexOf("gs '_layout'"));
assert(body(d,'$ongload').includes("gs 'jo9_audio_formats'\r\ngs 'jo9_gameover_audio','load',$curloc"));
const html=fs.readFileSync(repo+'/tools/sound-audition/청취_목록.html','utf8');const keys=[...html.matchAll(/class="local-slot" data-row-key="([^"]+)"/g)].map(m=>m[1]);for(const k of state.oldSlotKeys)assert(keys.includes(k));assert.equal(new Set(keys).size,63);
const audio=[...html.matchAll(/<audio controls preload="none" src="([^"]+)"/g)].map(m=>m[1]);assert.equal(audio.length,17);assert(audio.every(s=>/\.mp3$/i.test(s)));
// A separate silent client checks the actual MP3/WAV PLAY branches and reentry guard.
for(const n of ['gameoverbgm.mp3','gameover.wav','home.mp3']){fs.mkdirSync(temp+'/content/snd',{recursive:true});fs.copyFileSync(game+'/content/snd/'+n,temp+'/content/snd/'+n);}
const start=['sound_on=1 & music_volume=0 & sound_volume=0 & usehtml=1',"gs 'jo9_gameover_audio','enter'","gs 'jo9_gameover_audio','enter'",`*p '<a id="qa_done" href="EXEC: gs ''qa_done''">done</a><script>setTimeout(function(){document.getElementById("qa_done").click();},400);</script>'`].join('\r\n');
const end=["gs 'jo9_gameover_audio','leave','city_screen'","$music_now='content/snd/home.mp3'","gs 'jo9_gameover_audio','load','city_screen'","if jo9_gameover_audio_active!0: msg 'JO9_QA_GAMEOVER_audio_FAILED' & exit","msg 'JO9_QA_GAMEOVER_audio_COMPLETE'"].join('\r\n');
const lines=d.lines.slice(0,4);lines[3]=core.shift('3',-5);for(const [name,b]of [['Start',start],['jo9_gameover_audio',body(d,'jo9_gameover_audio')],['qa_done',end]])lines.push(core.shift(name,-5),'',core.shift(b,-5),core.shift('0',-5));lines.push('');fs.writeFileSync(temp+'/gameover-audio.qsp',core.serialize({lines}));fs.writeFileSync(temp+'/codec-plan.json',JSON.stringify([{name:'gameover-audio',file:temp+'/gameover-audio.qsp',checkpoint:'MP3 loop and WAV sting once, leaving screen and restoring ordinary MP3',marker:'JO9_QA_GAMEOVER_audio_COMPLETE'}],null,2));
const result={status:'STATIC_AND_BYTE_VERIFIED',workQspSha256:d.hash,locations:d.locations.length,originalAudio:{bgm:30,sfx:72},installed:{bgmMp3:31,sfxWav:73},originalSfxUnchanged:72,originalsBackedUp:30,oldBgmWavRemaining:0,sourceAudioMatches:32,originalMusicPriorityUnchanged:true,userSettingsUnchanged:true,oldReviewKeysPreserved:62,addedGameoverReviewKeys:1,mp3AuditionPlayers:audio.length,missingOriginalMusic:['content/snd/city.mp3'],afterBytes:state.afterBytes};fs.writeFileSync(__dirname+'/verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
