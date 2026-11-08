'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict'),vm=require('node:vm');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',temp='G:/Codex/tmp/sound-adoption-20261108',tool='G:/Codex/tools/ffmpeg-9.0.2',here=__dirname,stage=here+'/staged';
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')),write=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const A=require(stage+'/audio-library.cjs');
const hammerUrl='https://pixabay.com/sound-effects/film-special-effects-hammer-smash-effect-382731/';
const keys={garsid:'monster:garsid:a',blunt:'other:blunt_alternative:'+hammerUrl};
const run=(name,args)=>cp.execFileSync(tool+'/'+name,args,{encoding:'utf8',windowsHide:true,maxBuffer:1024*1024});
function probe(file){const p=JSON.parse(run('ffprobe.exe',['-v','error','-show_streams','-show_format','-of','json',file])),s=p.streams.find(x=>x.codec_type==='audio');return {codec:s.codec_name,format:p.format.format_name,seconds:+(s.duration||p.format.duration),sampleRate:+s.sample_rate,channels:s.channels,bits:s.bits_per_sample};}
const mode=process.argv[2];
if(mode==='prepare'){
 fs.mkdirSync(temp,{recursive:true});const files=[],entries=[],assignments={},reviews={};
 for(const [role,name,label]of [['garsid','gsid','가르시드 · 사용자 채택'],['blunt','blunt','둔기 · 사용자 채택']]){
  const source=game+'/content/modworkpic/sound/'+name+'.mp3',dest=temp+'/'+name+'.wav',s=fs.statSync(source),before=probe(source),sourceHash=hash(source);
  run('ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-y','-i',source,'-map','0:a:0','-vn','-map_metadata','-1','-c:a','pcm_s16le',dest]);
  run('ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-xerror','-i',dest,'-f','null','-']);const after=probe(dest);
  assert.equal(after.format,'wav');assert.equal(after.codec,'pcm_s16le');assert.equal(after.channels,before.channels);assert.equal(after.sampleRate,before.sampleRate);assert(Math.abs(after.seconds-before.seconds)<0.1);assert.equal(hash(source),sourceHash);
  const meta=A.describeFile({name:name+'.mp3',relativePath:name+'.mp3',size:s.size,lastModified:Math.trunc(s.mtimeMs),type:'audio/mpeg'});files.push(meta);assignments[keys[role]]=meta.id;reviews[keys[role]]='adopted';
  entries.push({key:keys[role],role,label,sourceName:name+'.mp3',filename:name+'.wav',sourcePage:role==='blunt'?hammerUrl:null,source,sourceSha256:sourceHash,sourceAudio:before,sha256:hash(dest),bytes:fs.statSync(dest).size,audio:after});
 }
 const selection={version:1,entries,extraCandidates:[{role:'blunt_alternative',title:'Hammer Smash Effect',url:hammerUrl,creator:'DRAGON-STUDIO',seconds:2}],decisions:[{id:'20261108-gsid-blunt-v1',files,assignments,reviews}]};
 write(stage+'/approved-selections.json',selection);write(here+'/selection.json',selection);
 const baseline=game+'/content/modworkpic/JO9_사운드_설정 (3).json',old=read(baseline),next=A.applyDecisions(old,selection.decisions,[]).state;
 for(const [key,value]of Object.entries(old.reviews))if(key!==keys.garsid)assert.equal(next.reviews[key],value);for(const[key,value]of Object.entries(old.assignments))assert.equal(next.assignments[key],value);
 write(here+'/JO9_사운드_설정 (4).json',next);
 cp.execFileSync(process.execPath,[stage+'/build.cjs','--repo',repo,'--out',stage+'/청취_목록.html'],{windowsHide:true});
 const original=fs.readFileSync(repo+'/tools/sound-audition/청취_목록.html','utf8'),html=fs.readFileSync(stage+'/청취_목록.html','utf8');const getKeys=s=>[...s.matchAll(/class="local-slot" data-row-key="([^"]+)"/g)].map(x=>x[1]);const oldKeys=getKeys(original),newKeys=getKeys(html);for(const key of oldKeys)assert(newKeys.includes(key));assert.equal(newKeys.length,oldKeys.length+1);assert.equal(new Set(newKeys).size,newKeys.length);
 for(const e of entries)assert(html.includes('/'+e.filename+'"'));
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);assert.equal(scripts.length,2);for(const script of scripts)new vm.Script(script);
 const capture=[repo+'/tools/sound-audition/build.cjs',repo+'/tools/sound-audition/browser.js',repo+'/tools/sound-audition/audio-library.cjs',repo+'/tools/sound-audition/청취_목록.html',repo+'/assets/runtime-source-2.4.1.json',repo+'/docs/SESSION_HANDOFF_INDEX.md'];
 write(here+'/prepared.json',{baseline,baselineSha256:hash(baseline),qspSha256:hash(game+'/jack.qsp'),oldKeys,inputs:capture.map(file=>({file,sha256:hash(file)})),entries:entries.map(e=>({role:e.role,filename:e.filename,bytes:e.bytes,seconds:e.audio.seconds}))});console.log(JSON.stringify({entries:entries.map(e=>({name:e.filename,seconds:e.audio.seconds,bytes:e.bytes})),oldKeys:oldKeys.length,newKeys:newKeys.length,previousSettingsPreserved:true}));
}else if(mode==='install'){
 const p=read(here+'/prepared.json'),selection=read(here+'/selection.json');assert.equal(hash(game+'/jack.qsp'),p.qspSha256);assert.equal(hash(p.baseline),p.baselineSha256);for(const input of p.inputs)assert.equal(hash(input.file),input.sha256,'File changed: '+input.file);
 const stamp=new Date(Date.now()+9*3600000).toISOString().replace(/[-:.TZ]/g,'').slice(0,14),backup='G:/somi/JO9_work_backups/sound-adoption-'+stamp;fs.mkdirSync(backup+'/payloads',{recursive:true});const restore=[];
 function back(file){if(!fs.existsSync(file))return;const h=hash(file),dest=backup+'/payloads/'+h;if(!fs.existsSync(dest))fs.copyFileSync(file,dest);assert.equal(hash(dest),h);restore.push({target:file,payload:dest,sha256:h});}
 const originals=p.inputs.map(x=>x.file);for(const f of originals)back(f);
 for(const name of ['build.cjs','browser.js','audio-library.cjs','approved-selections.json','청취_목록.html']){const dest=repo+'/tools/sound-audition/'+name;if(!originals.includes(dest))back(dest);fs.copyFileSync(stage+'/'+name,dest);}
 for(const e of selection.entries)for(const root of [game+'/content/snd',repo+'/assets/content/snd']){const dest=root+'/'+e.filename;back(dest);fs.copyFileSync(temp+'/'+e.filename,dest);assert.equal(hash(dest),e.sha256);}
 const settings=game+'/content/modworkpic/JO9_사운드_설정 (4).json';if(fs.existsSync(settings))assert.equal(hash(settings),hash(here+'/JO9_사운드_설정 (4).json'));else fs.copyFileSync(here+'/JO9_사운드_설정 (4).json',settings);
 const mf=repo+'/assets/runtime-source-2.4.1.json',m=read(mf);for(const e of selection.entries){const entry={runtimePath:'content/snd/'+e.filename,repositoryPath:'assets/content/snd/'+e.filename,bytes:e.bytes,sha256:e.sha256};const i=m.files.findIndex(x=>x.runtimePath===entry.runtimePath);if(i<0)m.files.push(entry);else m.files[i]=entry;}m.soundAdoptions={date:'2026-11-08',report:'records/sound-adoption-20261108/REPORT_KO.md',roles:['garsid','blunt'],combatPlaybackHooksChanged:false};write(mf,m);
 let tests=fs.readFileSync(here+'/decision.test.cjs','utf8').replace("require('./staged/audio-library.cjs')","require('./audio-library.cjs')");fs.writeFileSync(repo+'/tools/sound-audition/decision.test.cjs',tests);
 const result={status:'ADOPTED_AND_WAV_PREPARED',backup,restore,settings,baselineSha256:p.baselineSha256,qspSha256:p.qspSha256,entries:selection.entries,oldKeysPreserved:p.oldKeys.length,newCandidateKeys:1,combatPlaybackHooksChanged:false};write(here+'/installation.json',result);write(backup+'/restore.json',result);console.log(JSON.stringify({status:result.status,settings,backup,entries:selection.entries.map(x=>x.filename)}));
}else throw Error('Unknown mode');
