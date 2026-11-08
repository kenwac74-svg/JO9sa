'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),cp=require('node:child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const temp='G:/Codex/tmp/audio-format-normalize-20261108',out=__dirname;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f));
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const write=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const inv=read(out+'/inventory.json'),converted=read(out+'/converted.json'),patch=read(out+'/patch-summary.json');
const mode=process.argv[2];
if(mode==='stage'){
 assert.equal(hash(game+'/jack.qsp'),inv.workQspSha256,'WORK changed during preparation');
 const stamp=new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14),backup='G:/somi/JO9_work_backups/audio-format-normalize-'+stamp;
 fs.mkdirSync(backup+'/payloads',{recursive:true});
 const restore=[];
 for(const f of [game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp',repo+'/assets/runtime-source-2.4.1.json',repo+'/tools/sound-audition/build.cjs',repo+'/tools/sound-audition/청취_목록.html']){
  if(!fs.existsSync(f))continue;const h=hash(f),saved=backup+'/payloads/'+h; if(!fs.existsSync(saved))fs.copyFileSync(f,saved);assert.equal(hash(saved),h);restore.push({target:f,payload:saved,sha256:h});
 }
 const before=fs.readdirSync(game).filter(n=>/^jack\.qsp\.bak_/.test(n));
 const html=fs.readFileSync(repo+'/tools/sound-audition/청취_목록.html','utf8');
 const keys=[...html.matchAll(/class="local-slot" data-row-key="([^"]+)"/g)].map(x=>x[1]);
 const settings=game+'/content/modworkpic/JO9_사운드_설정 (3).json';
 const state={backup,restore,applyBackupsBefore:before,oldSlotKeys:keys,settings,settingsSha256:hash(settings),moved:[],newAssets:[]};
 for(const x of converted.files){
  const src=temp+'/converted/'+x.name;assert.equal(hash(src),x.sha256);
  for(const target of [game+'/content/snd/'+x.name,repo+'/assets/content/snd/'+x.name]){
   if(fs.existsSync(target))assert.equal(hash(target),x.sha256,'Existing target differs: '+target);
   else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(src,target);}
   assert.equal(hash(target),x.sha256);state.newAssets.push({target,sha256:x.sha256});
  }
 }
 fs.copyFileSync(temp+'/mods/'+patch.id+'.json',repo+'/mods/'+patch.id+'.json');
 fs.mkdirSync(game+'/mods',{recursive:true});fs.copyFileSync(temp+'/mods/'+patch.id+'.json',game+'/mods/'+patch.id+'.json');
 write(out+'/installation.json',state);write(backup+'/restore.json',state);
 console.log(JSON.stringify({backup,installedMp3:converted.files.length,sourceCopies:converted.files.length,settingsPreserved:state.settingsSha256}));
}else if(mode==='finish'){
 const state=read(out+'/installation.json');assert.equal(hash(game+'/jack.qsp'),patch.afterSha256,'Canonical patch result differs');
 for(const x of inv.files){const current=game+'/content/snd/'+x.name,archived=state.backup+'/originals/content/snd/'+x.name;const p=fs.existsSync(current)?current:archived;assert.equal(hash(p),x.sha256,'Original changed before archival: '+x.name);}
 const root=path.resolve(game+'/content/snd'),backupRoot=path.resolve(state.backup);
 state.pendingLocked=[];
 for(const x of converted.files){
  const source=path.resolve(game+'/content/snd/'+x.oldName),target=path.resolve(state.backup+'/originals/content/snd/'+x.oldName);
  assert.equal(path.dirname(source),root);assert(target.startsWith(backupRoot+path.sep));
  const expected=inv.files.find(a=>a.name===x.oldName).sha256;assert.equal(hash(game+'/content/snd/'+x.name),x.sha256);
  if(!fs.existsSync(source)){assert.equal(hash(target),expected);continue;}
  assert(!fs.lstatSync(source).isSymbolicLink());fs.mkdirSync(path.dirname(target),{recursive:true});
  try{
   if(fs.existsSync(target)){assert.equal(hash(target),expected);fs.unlinkSync(source);}
   else fs.renameSync(source,target);
   assert.equal(hash(target),expected);if(!state.moved.some(a=>a.from===source))state.moved.push({from:source,to:target,sha256:expected});
  }catch(e){
   if(!['EBUSY','EACCES','EPERM'].includes(e.code))throw e;
   if(!fs.existsSync(target))fs.copyFileSync(source,target);assert.equal(hash(target),expected);state.pendingLocked.push({from:source,to:target,sha256:expected,reason:e.code});
  }
  write(out+'/installation.json',state);write(state.backup+'/restore.json',state);
 }
 fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');
 const manifestPath=repo+'/assets/runtime-source-2.4.1.json',manifest=read(manifestPath);
 manifest.snapshotDate='2026-11-08';manifest.sourceQspSha256=patch.afterSha256;
 for(const x of converted.files){const entry={runtimePath:'content/snd/'+x.name,repositoryPath:'assets/content/snd/'+x.name,bytes:x.bytes,sha256:x.sha256};const i=manifest.files.findIndex(a=>a.runtimePath.toLowerCase()===entry.runtimePath.toLowerCase());if(i<0)manifest.files.push(entry);else manifest.files[i]=entry;}
 manifest.audioFormats={decision:'AUDIO_FORMAT_MP3_BGM_WAV_SFX_20261108',bgm:'MP3',effects:'PCM WAV',report:'records/audio-format-normalize-20261108/REPORT_KO.md',retiredBgmPaths:converted.files.map(x=>'content/snd/'+x.oldName)};
 write(manifestPath,manifest);
 const buildPath=repo+'/tools/sound-audition/build.cjs';let build=fs.readFileSync(buildPath,'utf8');
 const old="  const real = sndFiles.find(x => x.toLowerCase() === name.toLowerCase());";
 const next="  // Keep review/assignment keys stable while resolving the current WORK music format.\n  const mp3Name = name.replace(/\\.wav$/i, '.mp3');\n  const real = sndFiles.find(x => x.toLowerCase() === mp3Name.toLowerCase())\n    || sndFiles.find(x => x.toLowerCase() === name.toLowerCase());";
 if(build.includes(old)){assert.equal(build.split(old).length-1,1);build=build.replace(old,next).replace('game 폴더 content/snd 원본 WAV 재생','game 폴더 content/snd 현재 BGM 재생').replace('slot(key, name, baseline)','slot(key, real || name, baseline)');}
 else assert.equal(build.split(next).length-1,1,'Unexpected audition builder changes');
 fs.writeFileSync(buildPath,build);cp.execFileSync(process.execPath,[buildPath],{cwd:repo,stdio:'pipe',windowsHide:true});
 const html=fs.readFileSync(repo+'/tools/sound-audition/청취_목록.html','utf8');const keys=[...html.matchAll(/class="local-slot" data-row-key="([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(keys,state.oldSlotKeys,'Saved review row IDs changed');
 const audio=[...html.matchAll(/<audio controls preload="none" src="([^"]+)"/g)].map(x=>x[1]);assert(audio.length>0&&audio.every(x=>/\.mp3$/i.test(x)),'BGM audition references not all MP3');
 assert.equal(hash(state.settings),state.settingsSha256,'User sound settings changed');
 for(const x of inv.files.filter(x=>x.role==='sfx'))assert.equal(hash(game+'/content/snd/'+x.name),x.sha256,'SFX changed');
 for(const name of fs.readdirSync(game).filter(n=>/^jack\.qsp\.bak_/.test(n)&&!state.applyBackupsBefore.includes(n))){
  const f=path.resolve(game+'/'+name);assert.equal(path.dirname(f),path.resolve(game));if(hash(f)===inv.workQspSha256){assert.equal(hash(state.restore.find(x=>x.target===game+'/jack.qsp').payload),inv.workQspSha256);fs.unlinkSync(f);state.deduplicatedQspBackup=f;}
 }
 state.status=state.pendingLocked.length?'INSTALLED_PENDING_LOCKED_LEGACY_CLEANUP':'INSTALLED_AND_VERIFIED';state.workQspSha256=hash(game+'/jack.qsp');state.runtimeSnapshotSha256=hash(repo+'/assets/runtime/2.4.1/jack.qsp');state.auditionMp3Players=audio.length;state.auditionKeysPreserved=keys.length;
 state.beforeBytes=converted.beforeBytes;state.afterBytes=converted.afterBytes;
 write(out+'/installation.json',state);write(state.backup+'/restore.json',state);
 console.log(JSON.stringify({status:state.status,movedOriginals:state.moved.length,pendingLocked:state.pendingLocked,auditionMp3Players:audio.length,reviewKeysPreserved:keys.length,sourceMatches:state.workQspSha256===state.runtimeSnapshotSha256,beforeBytes:state.beforeBytes,afterBytes:state.afterBytes}));
}else throw Error('Unknown mode');
