'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),zlib=require('node:zlib'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/jo9-duty-sfx-wav-20261110',tool='G:/Codex/tools/ffmpeg-9.0.2',rec=repo+'/records/duty-ledger-wav-20261110';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),names=['bad_secen','great-success','ledger'],id='2026-11-10_duty_ledger_sfx_wav';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')),write=(f,x)=>fs.writeFileSync(f,JSON.stringify(x,null,2)+'\n'),hash=f=>core.hash(fs.readFileSync(f));
const run=(exe,args)=>cp.execFileSync(tool+'/'+exe,args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
function probe(f){const r=JSON.parse(run('ffprobe.exe',['-v','error','-show_streams','-show_format','-of','json',f])),s=r.streams.find(x=>x.codec_type==='audio');a(s);return {codec:s.codec_name,format:r.format.format_name,rate:+s.sample_rate,channels:s.channels,bits:+s.bits_per_sample,duration:+(s.duration||r.format.duration)};}
const pcm=f=>run('ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-xerror','-i',f,'-map','0:a:0','-vn','-c:a','pcm_s16le','-f','hash','-hash','sha256','-']).trim();
const body=(d,n)=>core.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
function probes(raw,dir,codecs){
 fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=false\r\n');
 const d=core.parse(raw),sound=body(d,'jo9_duty_text').split('\r\n').filter(s=>/jo9_rd_snd/.test(s)).join('\r\n').replace(/play 'content\/snd\/'\+\$jo9_rd_snd\+'\.(mp3|wav)', sound_volume/,"qa_plays+=1 & $qa_path='content/snd/'+$jo9_rd_snd+'.$1'"),ledger=body(d,'main_screen').split('\r\n').find(s=>/play 'content\/snd\/ledger\.(mp3|wav)'/.test(s)).replace(/play '([^']+)', sound_volume/,"qa_plays+=1 & $qa_path='$1'"),plan=[];
 function add(name,code,marker){code=code.replace(/msg ('FAIL[^']*')/g,'qa_failed=1 & msg $1');const count=name==='sound-route'?"\nif qa_checked!14: qa_failed=1 & msg 'FAIL matrix count'":'';const lines=['QSPGAME','','',core.shift('1',-5),core.shift('Start',-5),'',core.shift(("qa_failed=0 & qa_checked=0\n"+code+count+"\nif qa_failed=0: msg '"+marker+"'\nexit").replace(/\r?\n/g,'\r\n'),-5),core.shift('0',-5),''];fs.writeFileSync(dir+'/'+name+'.qsp',core.serialize({lines}));plan.push({name,file:dir+'/'+name+'.qsp',marker,checkpoint:name});}
 add('sound-route',`for qa_m=0 to 1 step 1:
 sound_on=qa_m & sound_volume=37
 for qa_case=0 to 5 step 1:
  jo9_rd_rep=4 & jo9_rd_tier=1 & jo9_rd_kind=0 & jo9_rd_wd=0 & $qa_expected=''
  if qa_case=1: jo9_rd_tier=0 & $qa_expected='bad_secen'
  if qa_case=2: jo9_rd_tier=4 & $qa_expected='great-success'
  if qa_case=3: jo9_rd_rep=8 & jo9_rd_tier=4 & jo9_rd_wd=1 & $qa_expected='bad_secen'
  if qa_case=4: jo9_rd_rep=8 & jo9_rd_tier=4 & jo9_rd_kind=2 & $qa_expected='bad_secen'
  if qa_case=5: jo9_rd_rep=6 & jo9_rd_tier=0 & $qa_expected='bad_secen'
  qa_plays=0 & $qa_path=''
${sound}
  if qa_m=0 and qa_plays!0: msg 'FAIL mute' & exit
  if qa_m=1 and $qa_expected='' and qa_plays!0: msg 'FAIL normal' & exit
  if qa_m=1 and $qa_expected!'' and (qa_plays!1 or $qa_path!'content/snd/'+$qa_expected+'.wav'): msg 'FAIL route' & exit
  if sound_volume!37: msg 'FAIL volume' & exit
  qa_checked+=1
 end
 qa_plays=0 & $qa_path=''
${ledger}
 if qa_m=0 and qa_plays!0: msg 'FAIL ledger mute' & exit
 if qa_m=1 and (qa_plays!1 or $qa_path!'content/snd/ledger.wav'): msg 'FAIL ledger path' & exit
 qa_checked+=1
end`,'JO9_QA_DUTYWAV_route_COMPLETE');
 if(codecs){fs.mkdirSync(dir+'/content/snd',{recursive:true});for(const name of names){fs.copyFileSync(tmp+'/converted/'+name+'.wav',dir+'/content/snd/'+name+'.wav');add('play-'+name.replace(/_/g,'-'),"sound_on=1 & sound_volume=0\nplay 'content/snd/"+name+".wav', sound_volume\nwait 500",'JO9_QA_DUTYWAV_'+name.replace(/-/g,'_')+'_COMPLETE');}}
 write(dir+'/plan.json',plan);
}
const mode=process.argv[2];
if(mode==='prepare'){
 fs.mkdirSync(tmp+'/mods',{recursive:true});const raw=fs.readFileSync(game+'/jack.qsp'),doc=core.parse(raw);a(core.serialize(doc).equals(raw));
 const backup='G:/somi/JO9_work_backups/duty-wav-20261110-'+doc.hash.slice(0,12);fs.mkdirSync(backup,{recursive:true});fs.writeFileSync(backup+'/work-before.qsp',raw);a.equal(hash(backup+'/work-before.qsp'),doc.hash);
 const src=fs.readFileSync(repo+'/assets/runtime/2.4.1/jack.qsp');if(core.hash(src)!==doc.hash){const zip=zlib.gzipSync(src);fs.writeFileSync(backup+'/source-before.qsp.gz',zip);a(zlib.gunzipSync(zip).equals(src));}fs.copyFileSync(repo+'/assets/runtime-source-2.4.1.json',backup+'/runtime-source-before.json');
 const edits=[];for(const [loc,old]of [['jo9_duty_text'," if $jo9_rd_snd ! '' and sound_on = 1: play 'content/snd/'+$jo9_rd_snd+'.mp3', sound_volume"],['main_screen',"\tif sound_on = 1: play 'content/snd/ledger.mp3', sound_volume"]]){const l=doc.locations.find(l=>l.name===loc),b=core.shift(doc.lines[l.body],5);a.equal(b.split(old).length-1,1);const patchId=loc==='main_screen'?'LEDGER_SFX_WAV_20261110':'DUTY_REPORT_SFX_WAV_20261110',indent=old.match(/^\s*/)[0],next=indent+'! JO9 MOD START '+patchId+'\r\n'+old.replace('.mp3','.wav')+'\r\n'+indent+'! JO9 MOD END '+patchId;edits.push({location:loc,field:'body',old,new:next,count:1,patchId});doc.lines[l.body]=core.shift(b.replace(old,next),-5);}
 const candidate=core.serialize(doc);qa.inspectWorld(candidate);const mod={id,status:'APPROVED',description:'Three local SFX to PCM WAV; timing, volume, priority and latest dialogue preserved; no audio uploads.',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits};write(tmp+'/mods/'+id+'.json',mod);write(repo+'/mods/'+id+'.json',mod);fs.writeFileSync(tmp+'/candidate.qsp',candidate);
 const files=names.map(name=>{const file=game+'/content/snd/'+name+'.mp3';a(!fs.existsSync(game+'/content/snd/'+name+'.wav'));return {name,sourceSha256:hash(file),sourceAudio:probe(file)};});write(rec+'/prepared.json',{before:core.hash(raw),after:core.hash(candidate),backup,files});probes(raw,tmp+'/before',false);console.log(JSON.stringify({before:mod.before_sha256,after:mod.after_sha256,files}));
}else if(mode==='convert'){
 const s=read(rec+'/prepared.json');a.equal(hash(game+'/jack.qsp'),s.before);fs.mkdirSync(tmp+'/converted',{recursive:true});for(const f of s.files){const src=game+'/content/snd/'+f.name+'.mp3',dest=tmp+'/converted/'+f.name+'.wav';a.equal(hash(src),f.sourceSha256);run('ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-n','-i',src,'-map','0:a:0','-vn','-map_metadata','-1','-c:a','pcm_s16le',dest]);const audio=probe(dest);a.equal(audio.codec,'pcm_s16le');a.equal(audio.format,'wav');a.equal(audio.rate,f.sourceAudio.rate);a.equal(audio.channels,f.sourceAudio.channels);a(Math.abs(audio.duration-f.sourceAudio.duration)<0.15);const decoded=pcm(src);a.equal(pcm(dest),decoded);Object.assign(f,{wav:f.name+'.wav',sha256:hash(dest),bytes:fs.statSync(dest).size,audio,decoded});}write(rec+'/converted.json',s);probes(fs.readFileSync(tmp+'/candidate.qsp'),tmp+'/after',true);fs.copyFileSync(s.backup+'/work-before.qsp',tmp+'/replay.qsp');console.log(JSON.stringify({converted:3,decodedSamplesIdentical:true,files:s.files.map(f=>({name:f.wav,bytes:f.bytes,audio:f.audio}))}));
}else if(mode==='probes'){
 const s=read(rec+'/prepared.json');probes(fs.readFileSync(s.backup+'/work-before.qsp'),tmp+'/before',false);probes(fs.readFileSync(tmp+'/candidate.qsp'),tmp+'/after',true);console.log('Regenerated fail-guarded probes with 14 route assertions.');
}else if(mode==='install'){
 const s=read(rec+'/converted.json');a.equal(hash(game+'/jack.qsp'),s.before,'WORK changed: rebase required');a.equal(hash(tmp+'/replay.qsp'),s.after);const native=read(tmp+'/after/client-results.json');a.equal(native.length,4);a(native.every(x=>x.pass));
 for(const f of s.files){a.equal(hash(game+'/content/snd/'+f.name+'.mp3'),f.sourceSha256);a.equal(hash(tmp+'/converted/'+f.wav),f.sha256);a(!fs.existsSync(game+'/content/snd/'+f.wav));fs.copyFileSync(tmp+'/converted/'+f.wav,game+'/content/snd/'+f.wav,fs.constants.COPYFILE_EXCL);}
 const applied=cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true});fs.writeFileSync(rec+'/apply.log',applied);a.equal(hash(game+'/jack.qsp'),s.after);fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');fs.mkdirSync(repo+'/assets/content/snd',{recursive:true});for(const f of s.files)fs.copyFileSync(game+'/content/snd/'+f.wav,repo+'/assets/content/snd/'+f.wav);
 const file=repo+'/assets/runtime-source-2.4.1.json',m=read(file);m.sourceQspSha256=s.after;m.snapshotDate='2026-11-10';const q=m.files.find(f=>f.repositoryPath==='assets/runtime/2.4.1/jack.qsp');if(q){q.sha256=s.after;q.bytes=fs.statSync(game+'/jack.qsp').size;}for(const f of s.files){const r={runtimePath:'content/snd/'+f.wav,repositoryPath:'assets/content/snd/'+f.wav,bytes:f.bytes,sha256:f.sha256};const n=m.files.findIndex(x=>x.runtimePath===r.runtimePath);if(n<0)m.files.push(r);else m.files[n]=r;}m.latestDutyLedgerWav={date:'2026-11-10',beforeSha256:s.before,qspSha256:s.after,mod:id,report:'records/duty-ledger-wav-20261110/REPORT_KO.md',audioLocalOnly:true,files:s.files.map(f=>f.wav)};write(file,m);write(rec+'/installed.json',{...s,installed:true,nativePass:4,originalMp3Preserved:true,audioUploaded:false});console.log(JSON.stringify({installed:true,sha256:s.after,files:3}));
}else if(mode==='verify'){
 const s=read(rec+'/installed.json'),before=core.parse(fs.readFileSync(s.backup+'/work-before.qsp')),raw=fs.readFileSync(game+'/jack.qsp'),after=core.parse(raw);a.equal(after.hash,s.after);a.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),s.after);a.equal(read(repo+'/assets/runtime-source-2.4.1.json').sourceQspSha256,s.after);const structure=qa.inspectWorld(raw),changed=[];a.equal(before.lines.length,after.lines.length);for(let i=0;i<before.lines.length;i++)if(before.lines[i]!==after.lines[i]){const l=before.locations.find(l=>l.body===i);a(l);changed.push(l.name);}a.deepEqual(changed.sort(),['jo9_duty_text','main_screen']);for(const e of read(repo+'/mods/'+id+'.json').edits)a.equal(body(before,e.location).replace(e.old,e.new),body(after,e.location));for(const f of s.files){a.equal(hash(game+'/content/snd/'+f.name+'.mp3'),f.sourceSha256);a.equal(hash(game+'/content/snd/'+f.wav),f.sha256);a.equal(hash(repo+'/assets/content/snd/'+f.wav),f.sha256);a.equal(pcm(game+'/content/snd/'+f.wav),f.decoded);}const r={...structure,beforeSha256:s.before,afterSha256:s.after,changedLocations:changed,wavFiles:3,decodedSamplesIdentical:true,originalMp3Preserved:true,latestDialoguesPreserved:true,nativePass:4,workAndSourceMatch:true,audioUploaded:false};write(rec+'/verification.json',r);console.log(JSON.stringify(r));
}else throw Error('prepare / convert / install / verify required');
