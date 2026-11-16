'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),z=require('zlib'),a=require('assert/strict'),cp=require('child_process');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work',G=W+'/game',D=R+'/records/release-q04-work-source-20261113';
const rd=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),wr=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const phase=process.argv[2],mp=R+'/assets/runtime-source-2.4.1.json',pub='1c3f76ddcf5c8da0a92cea1908ef3cdb1627af4f';
const image=/\.(?:png|jpe?g|gif|webp|bmp|svg|ico|cur|avif)$/i;
function classify(p){
 if(/(?:^|\/)(?:__JO9_ImageBackups|image_work|modworkpic|__pycache__|\.git)(?:\/|$)/i.test(p)||/\.(?:sav|bak|log|pyc|zip|pngbk)$/i.test(p)||/\.bak_/i.test(p))return'preserve-private-backup';
 if(/^modtools\//i.test(p))return'optional-tools-Q05';
 if(/^mods\//i.test(p))return'authoring-patches';
 if(/^save\//i.test(p)||/(?:FastQSP|desktop)\.ini$/i.test(p))return'personal-state';
 if(/^content\/pic\//i.test(p)&&/\.(?:ttf|otf|woff2?)$/i.test(p))return'runtime-font';
 if(/^content\/pic\/ui\/dialogue_emoji\/(?:LICENSE-fluent\.txt|manifest\.json)$/i.test(p))return'runtime-support';
 if(/^content\/pic\//i.test(p)&&image.test(p))return'runtime-image';
 if(/^content\/jo9o_original_cuts\//i.test(p)&&image.test(p))return'runtime-original-cuts';
 if(/^content\/snd\//i.test(p)&&/\.(?:wav|mp3|ogg)$/i.test(p))return'runtime-audio';
 if(/^content\/js\//i.test(p))return'runtime-script';
 if(/^json\//i.test(p)&&/\.json$/i.test(p))return'runtime-json';
 if(/^css\//i.test(p))return'runtime-css';
 if(/^fonts\//i.test(p))return'runtime-font';
 if(/^engine\//i.test(p))return'runtime-engine';
 if(['jack.qsp','config.xml','icon.ico'].includes(p))return'runtime-core';
 return'review-before-package';
}
function rootpath(rel){a(!rel.includes('..')&&!path.isAbsolute(rel));const p=path.resolve(G,rel);a(p.toLowerCase().startsWith(path.resolve(G).toLowerCase()+path.sep));return p;}
function targetSafe(rel){a(rel&&!path.isAbsolute(rel)&&!rel.split(/[\\/]/).includes('..'));a(!/^(?:sources|source)\//i.test(rel));const p=path.resolve(R,rel);let parent=path.dirname(p);while(!fs.existsSync(parent))parent=path.dirname(parent);a(fs.realpathSync(parent).toLowerCase().startsWith(fs.realpathSync(R).toLowerCase()),'external repository junction');return p;}
if(phase==='scan'){
 fs.mkdirSync(D,{recursive:true});const manifest=rd(mp),sourceHash=sha(G+'/jack.qsp');a.equal(sourceHash,manifest.sourceQspSha256);a.equal(sourceHash,sha(R+'/assets/runtime/2.4.1/jack.qsp'));
 const base=rd(R+'/records/distribution-cleanup-20261102/BUILD_MANIFEST.json'),baseMap=new Map(base.files.filter(x=>x.path.startsWith('game/')).map(x=>[x.path.slice(5).toLowerCase(),x]));
 const released=JSON.parse(cp.execFileSync('git',['-C',R,'show',pub+':releases/2.4.1-update3-20261107/PATCH_MANIFEST.json'],{encoding:'utf8',maxBuffer:10e6}));wr(D+'/released-update3-manifest.json',released);
 const pubRows=released.files||released.entries||released.payload; a(Array.isArray(pubRows));const pubMap=new Map(pubRows.map(x=>[(x.path||x.runtimePath||x.relativePath).replace(/^game\//i,'').toLowerCase(),x]));
 const oldMap=new Map(manifest.files.map(x=>[x.runtimePath.toLowerCase(),x])),metadata=[],skipped=[];
 function walk(dir,rel=''){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name),r=(rel?rel+'/':'')+ent.name;if(ent.isSymbolicLink()||fs.lstatSync(p).isSymbolicLink()){skipped.push(r);continue;}if(ent.isDirectory())walk(p,r);else if(ent.isFile()){const st=fs.statSync(p);metadata.push({path:r,bytes:st.size,mtimeMs:st.mtimeMs,category:classify(r)});}}}walk(G);
 let cache=new Map();if(process.argv.includes('--reuse-verified-scan')){const prior=JSON.parse(z.gunzipSync(fs.readFileSync(D+'/runtime-scan.json.gz'))),oldmeta=new Map(prior.metadata.map(x=>[x.path,x]));a.equal(prior.sourceQspSha256,sourceHash);for(const row of prior.rows){const cur=metadata.find(x=>x.path===row.path),old=oldmeta.get(row.path);a(cur&&old&&cur.bytes===old.bytes&&cur.mtimeMs===old.mtimeMs,'metadata changed since full hash '+row.path);cache.set(row.path,row.sha256);}}
 const rows=[],copies=[],sourceChecks=[],sourceDrift=[],jsonErrors=[],ids=new Map(),dupes=[],legacy=[];let n=0;
 for(const meta of metadata){if(!meta.category.startsWith('runtime-'))continue;const p=rootpath(meta.path),hash=cache.get(meta.path)||sha(p),st=fs.statSync(p);a.equal(st.size,meta.bytes);a.equal(st.mtimeMs,meta.mtimeMs,'changed while hashing '+meta.path);const old=oldMap.get(meta.path.toLowerCase()),orig=baseMap.get(meta.path.toLowerCase()),prev=pubMap.get(meta.path.toLowerCase());let repo=old?.repositoryPath||null;
  const baseStatus=!orig?'added':orig.sha256===hash?'same':'changed',release3Status=prev?(prev.sha256===hash?'same':'changed'):'not-in-patch3-inventory';
  if(!repo&&baseStatus!=='same'&&meta.category!=='runtime-audio'){
   if(meta.category==='runtime-json')repo='assets/'+meta.path;
   else if(['runtime-image','runtime-original-cuts','runtime-script'].includes(meta.category))repo='assets/'+meta.path;
   else if(meta.category==='runtime-css')repo='assets/css-2.4/'+meta.path.slice(4);
  }
  if(repo&&meta.category!=='runtime-audio'){
   const dest=targetSafe(repo),exists=fs.existsSync(dest),beforeHash=exists?sha(dest):null;sourceChecks.push({path:meta.path,repositoryPath:repo,matches:beforeHash===hash});
   if(beforeHash!==hash){const row={path:meta.path,repositoryPath:repo,sourceBeforeSha256:beforeHash,workSha256:hash,bytes:st.size,category:meta.category};copies.push(row);sourceDrift.push(row);}
  }
  if(meta.category==='runtime-json'){try{rd(p);}catch(e){jsonErrors.push({path:meta.path,message:e.message});}if(/^json\/slaves\//i.test(meta.path)){const match=path.basename(meta.path).match(/^(\d+)(?:_|\.)/);if(match){const id=+match[1];if(ids.has(id))dupes.push({id,paths:[ids.get(id),meta.path]});else ids.set(id,meta.path);}}}
  rows.push({path:meta.path,bytes:st.size,sha256:hash,category:meta.category,repositoryPath:repo,baseStatus,release3Status});n++;if(n%5000===0)console.log('Hashed '+n+' runtime files');
 }
 for(const old of manifest.files){if(old.runtimePath.startsWith('../'))continue;if(!fs.existsSync(rootpath(old.runtimePath)))legacy.push({...old,workPresence:'missing-before-Q04',retention:'KEEP_PENDING_MIGRATION',includedInCurrentPayload:false});}
 a.equal(jsonErrors.length,0,JSON.stringify(jsonErrors));a.equal(dupes.length,0,JSON.stringify(dupes));a.equal(sha(G+'/jack.qsp'),sourceHash);
 const girls=rows.filter(x=>/^content\/pic\/girls\//i.test(x.path)),summary={asOf:'2026-11-13',sourceQspSha256:sourceHash,totalMetadata:metadata.length,runtimeFiles:rows.length,runtimeBytes:rows.reduce((n,x)=>n+x.bytes,0),copies:copies.length,copyByCategory:copies.reduce((o,x)=>(o[x.category]=(o[x.category]||0)+1,o),{}),sourceChecked:sourceChecks.length,jsonErrors,duplicateCharacterIds:dupes,legacyMissing:legacy.length,skippedLinks:skipped,girls:{files:girls.length,bytes:girls.reduce((n,x)=>n+x.bytes,0),added:girls.filter(x=>x.baseStatus==='added').length,changed:girls.filter(x=>x.baseStatus==='changed').length,unchanged:girls.filter(x=>x.baseStatus==='same').length},buckets:metadata.reduce((o,x)=>{const b=o[x.category]||(o[x.category]={files:0,bytes:0});b.files++;b.bytes+=x.bytes;return o;},{})};
 fs.writeFileSync(D+'/runtime-scan.json.gz',z.gzipSync(Buffer.from(JSON.stringify({sourceQspSha256:sourceHash,rows,metadata,sourceChecks,legacy,base:'records/distribution-cleanup-20261102/BUILD_MANIFEST.json',released:pub}))));wr(D+'/resource-sync-plan.json',{sourceQspSha256:sourceHash,manifestBeforeSha256:sha(mp),approved:true,copies,legacy,rule:'WORK authoritative. Keep all old files and missing-path records pending migration. No audio copies. No Full/ZIP/Git mutation.'});wr(D+'/resource-scan-summary.json',summary);wr(D+'/girls-changes.json',{sourceQspSha256:sourceHash,scope:'Every current Girls runtime image hashed; baseStatus compares original 2.4.1 Full, not patch3 timing.',summary:summary.girls,changed: girls.filter(x=>x.baseStatus!=='same'),folders:girls.reduce((o,x)=>{const key=path.posix.dirname(x.path);const b=o[key]||(o[key]={files:0,added:0,changed:0});b.files++;if(x.baseStatus==='added')b.added++;if(x.baseStatus==='changed')b.changed++;return o;},{})});
 console.log(JSON.stringify(summary));
}else if(phase==='apply'){
 const plan=rd(D+'/resource-sync-plan.json'),snapshot=JSON.parse(z.gunzipSync(fs.readFileSync(D+'/runtime-scan.json.gz'))),manifest=rd(mp);a.equal(sha(mp),plan.manifestBeforeSha256);a.equal(sha(G+'/jack.qsp'),plan.sourceQspSha256);a(!fs.existsSync(D+'/source-before.json.gz'));
 const backups=[];for(const row of plan.copies){const target=targetSafe(row.repositoryPath);a.equal(fs.existsSync(target)?sha(target):null,row.sourceBeforeSha256,'source changed '+row.repositoryPath);a.equal(sha(rootpath(row.path)),row.workSha256,'WORK changed '+row.path);if(fs.existsSync(target))backups.push({path:row.repositoryPath,sha256:row.sourceBeforeSha256,data:fs.readFileSync(target).toString('base64')});}
 fs.writeFileSync(D+'/source-before.json.gz',z.gzipSync(Buffer.from(JSON.stringify(backups))));fs.writeFileSync(D+'/runtime-source-manifest.before.json.gz',z.gzipSync(fs.readFileSync(mp)));
 for(const row of plan.copies){const target=targetSafe(row.repositoryPath);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(rootpath(row.path),target);a.equal(sha(target),row.workSha256);}
 const map=new Map(manifest.files.map(x=>[x.runtimePath.toLowerCase(),x]));for(const row of snapshot.rows){const key=row.path.toLowerCase(),old=map.get(key);if(old){old.bytes=row.bytes;old.sha256=row.sha256;if(row.repositoryPath)old.repositoryPath=row.repositoryPath;delete old.workPresence;}else if(row.baseStatus!=='same'||row.repositoryPath)map.set(key,{runtimePath:row.path,repositoryPath:row.repositoryPath,bytes:row.bytes,sha256:row.sha256});}
 for(const row of plan.legacy){const old=map.get(row.runtimePath.toLowerCase());Object.assign(old,{workPresence:'missing-before-Q04',retention:'KEEP_PENDING_MIGRATION',includedInCurrentPayload:false});if(row.runtimePath==='json/slaves/2339.json')old.activeReplacement='json/slaves/2339_yagisuna.json';}
 manifest.files=[...map.values()];manifest.fullReleaseInventory='assets/runtime-manifests/2.4.2-work.json';manifest.previousFullReleaseInventory='records/distribution-cleanup-20261102/BUILD_MANIFEST.json';manifest.latestReleaseQ04={date:'2026-11-13',sourceQspSha256:plan.sourceQspSha256,sourceFilesSynchronized:plan.copies.length,newSaveFields:0,report:'records/release-q04-work-source-20261113/REPORT_KO.md',legacyPaths:'KEEP_PENDING_MIGRATION',fullPackageCreated:false};wr(mp,manifest);
 fs.mkdirSync(R+'/assets/runtime-manifests',{recursive:true});wr(R+'/assets/runtime-manifests/2.4.2-work.json',{schema:1,asOf:'2026-11-13',version:'2.4.2',state:'WORK_RUNTIME_INPUT_SNAPSHOT_NOT_PACKAGE_FROZEN',sourceRoot:W,sourceQspSha256:plan.sourceQspSha256,files:snapshot.rows.map(x=>({path:'game/'+x.path,bytes:x.bytes,sha256:x.sha256,category:x.category,repositoryPath:x.repositoryPath})),requiredLegacyRetention:plan.legacy,optionalTools:{decision:'Q05_PENDING',files:snapshot.metadata.filter(x=>x.category==='optional-tools-Q05').map(x=>({path:'game/'+x.path,bytes:x.bytes})),payloadIncluded:false},launcher:{path:'Jack-o-nine-tails.exe',bytes:fs.statSync(W+'/Jack-o-nine-tails.exe').size,sha256:sha(W+'/Jack-o-nine-tails.exe'),finalConfig:'pending-distribution-validation'},exclusionsPreserved:snapshot.metadata.filter(x=>!x.category.startsWith('runtime-')&&x.category!=='optional-tools-Q05').map(x=>({path:'game/'+x.path,bytes:x.bytes,reason:x.category})),fullAndZipCreated:false,migration:'Q06/D21 pending; legacy runtime addresses retained; missing addresses are not fabricated.'});
 wr(D+'/source-sync-result.json',{sourceQspSha256:plan.sourceQspSha256,copied:plan.copies.map(x=>({path:x.path,repositoryPath:x.repositoryPath,sha256:x.workSha256})),backupFiles:backups.length,keptLegacy:plan.legacy.map(x=>x.runtimePath),audioCopied:0,fullWritten:false,workWritten:false});console.log(JSON.stringify({copied:plan.copies.length,backups:backups.length,manifestFiles:manifest.files.length,fullInput:snapshot.rows.length,keptLegacy:plan.legacy.length}));
}else throw Error('scan/apply');
