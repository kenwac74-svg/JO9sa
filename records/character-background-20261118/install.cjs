'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),a=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const H=__dirname,R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',HUB=R+'/tools/modding-hub',record=R+'/records/character-background-20261118',T='G:/Codex/tmp/character-background-20261118';
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p).toString('utf8').replace(/^\uFEFF/,'')),encode=x=>Buffer.from(JSON.stringify(x,null,2)+'\n'),hash=p=>fs.existsSync(p)?c.hash(read(p)):null;
const mod=json(H+'/patch.json'),manifest=json(H+'/editor/manifest.json'),scope=json(H+'/scope-proof.json');
a(read(T+'/candidate-native-stderr.log').toString('utf8').includes('JO9_BG_FINAL_PASS_71'));
a(read(T+'/replay.qsp').equals(read(T+'/expected-replay.qsp')));
const raw=read(G+'/jack.qsp'),out=read(T+'/candidate.qsp');a.equal(c.hash(raw),mod.before_sha256);a.equal(c.hash(out),mod.after_sha256);a(read(R+'/assets/runtime/2.4.1/jack.qsp').equals(raw));a.equal(scope.after,mod.after_sha256);
const writes=[],add=(file,next)=>writes.push({file,before:fs.existsSync(file)?read(file):null,next});a(!fs.existsSync(record));
add(G+'/jack.qsp',out);add(R+'/assets/runtime/2.4.1/jack.qsp',out);
for(const file of [R+'/assets/runtime-source-2.4.1.json',R+'/assets/runtime-manifests/2.4.2-work.json']){
 const meta=json(file);a.equal(meta.sourceQspSha256,mod.before_sha256);add(record+'/'+path.basename(file)+'.before.gz',zlib.gzipSync(read(file)));meta.sourceQspSha256=mod.after_sha256;if(meta.asOf)meta.asOf='2026-11-18';if(meta.snapshotDate)meta.snapshotDate='2026-11-18';meta.latestCharacterBackground={date:'2026-11-18',record:'records/character-background-20261118/REPORT_KO.md',canonicalFields:3,explicitSeedMarker:1,newActorFields:0,nativeAssertions:71};
 for(const row of meta.files||[])if(row.runtimePath==='jack.qsp'||row.path==='game/jack.qsp'){row.sha256=mod.after_sha256;row.bytes=out.length;}add(file,encode(meta));
}
for(const entry of manifest.files){
 const target=HUB+'/'+entry.path,source=H+'/editor/'+entry.path;a.equal(c.hash(read(source)),entry.candidateSha256);a.equal(hash(target),entry.new?null:entry.sourceSha256,'Live tool changed: '+entry.path);if(!entry.new)add(record+'/before/'+entry.path.replaceAll('/','__')+'.gz',zlib.gzipSync(read(target)));add(target,read(source));
}
a(!fs.existsSync(R+'/mods/'+mod.id+'.json'));add(R+'/mods/'+mod.id+'.json',encode(mod));
for(const file of ['REPORT_KO.md','PLAN_KO.md','runtime.cjs','background-runtime.qsps','run-native.ps1','scope.cjs','scope-proof.json','patch.json','prepared.json','before.qsp.gz','install.cjs'])add(record+'/'+file,read(H+'/'+file));
for(const file of ['manifest.json','EDITOR_INTERFACE_KO.md','editor-change.patch'])add(record+'/editor-'+file,read(H+'/editor/'+file));
for(const file of ['before-stderr.log','candidate-native-stderr.log'])add(record+'/'+file,read(T+'/'+file));
const verification={status:'PASS',nativeAssertions:71,nativeRoles:31,editorPython:11,editorJavaScript:5,masterRegression:11,officialReplay:'changed-location isolated fixture exact and idempotent',fullQspRoundtrip:true,scopeProof:scope,actualGuiSaveLoad:'not performed',gameJsonClassificationChoicesMassChanged:false};add(record+'/verification.json',encode(verification));
const done=[];try{
 for(const w of writes)a.equal(hash(w.file),w.before?c.hash(w.before):null);
 for(const w of writes){fs.mkdirSync(path.dirname(w.file),{recursive:true});const tmp=w.file+'.background-'+process.pid+'.tmp';fs.writeFileSync(tmp,w.next,{flag:'wx'});a.equal(hash(w.file),w.before?c.hash(w.before):null);fs.renameSync(tmp,w.file);done.push(w);}
 a.equal(hash(G+'/jack.qsp'),mod.after_sha256);a(read(G+'/jack.qsp').equals(read(R+'/assets/runtime/2.4.1/jack.qsp')));
 const result={installed:true,before:mod.before_sha256,after:mod.after_sha256,record,toolFiles:manifest.files.length,fullOrZipOrSavesWritten:false,commitOrPush:false};fs.writeFileSync(record+'/applied.json',encode(result));fs.writeFileSync(H+'/applied.json',encode(result));console.log(JSON.stringify(result));
}catch(error){for(const w of done.reverse())if(hash(w.file)===c.hash(w.next)){if(w.before===null)fs.unlinkSync(w.file);else fs.writeFileSync(w.file,w.before);}throw error;}
