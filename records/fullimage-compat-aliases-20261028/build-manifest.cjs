'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),game='G:/somi/Jack O Nine Tails v2.4_work/game';
const workHash=hash(fs.readFileSync(game+'/jack.qsp'));a.equal(workHash,'e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0');
const pre=JSON.parse(fs.readFileSync(path.join(__dirname,'verification/preflight.json'),'utf8').replace(/^\uFEFF/,''));a.equal(pre.count,23);a.equal(pre.qspSha256,workHash);
const files=pre.rows.map(row=>{
 const json='json/slaves/'+row.jsonFile,raw=fs.readFileSync(game+'/'+json);a.equal(hash(raw),row.jsonSha256);const data=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));
 const source='content/pic/'+data.indpack_title+'.png',compatibility='content/pic/'+data.fullimage+'.png';
 a(new RegExp('^content/pic/girls/full/'+row.id+'/'+row.id+'_full_title\\.png$').test(source));
 a(new RegExp('^content/pic/girls/full/'+row.id+'_[a-z0-9_]+\\.png$').test(compatibility));
 const image=fs.readFileSync(game+'/'+source);a.equal(hash(image),row.sourceSha256);a.equal(image.length,row.sourceBytes);
 if(fs.existsSync(game+'/'+compatibility))a.equal(hash(fs.readFileSync(game+'/'+compatibility)),row.sourceSha256);
 const relatedExistingFilesAtApproval=row.sameIdExistingRootCandidates.map(x=>({path:path.relative(game,x.path).replaceAll('\\','/'),sha256:x.sha256,bytes:x.bytes,identicalToSource:x.identicalToTitleSource}));
 return {id:Number(row.id),json,field:'fullimage',jsonValue:data.fullimage,sourceField:'indpack_title',sourceValue:data.indpack_title,jsonSha256:row.jsonSha256,source,compatibility,sha256:row.sourceSha256,bytes:row.sourceBytes,width:795,height:596,existedBefore:false,classification:'KEEP',intentionalDuplicate:true,relatedExistingFilesAtApproval};
});
a.equal(new Set(files.map(x=>x.compatibility.toLowerCase())).size,23);a.equal(files.reduce((n,x)=>n+x.bytes,0),4213447);
const manifest={schema:1,id:'2026-10-28_fullimage_compatibility',status:'APPROVED',reason:'Missing default fullimage paths remain in JSON and existing saved actor references. Preserve exact addresses with byte-identical title copies.',newArtwork:false,copyType:'independent-byte-copy',classification:'KEEP',intentionalDuplicates:true,qspChanged:false,jsonChanged:false,savesChanged:false,workQspSha256:workHash,count:23,addedBytes:4213447,sourceApproval:'User approved default-path compatibility copies and requested duplicate provenance and future maintenance records.',maintenance:{doNotDeduplicateByHashAlone:true,sourceAndCompatibilityBothRequired:true,noAutomaticSynchronization:true,onSourceReplacement:'Review related compatibility copies, update them deliberately and record new hashes; verification reports divergence and does not overwrite.',onDeletion:'First prove current JSON, saved actor paths and all consumers no longer need the compatibility address.',onPackaging:'Include every compatibility path; these are required runtime files even though their hashes match existing art.'},files};
fs.writeFileSync(path.join(__dirname,'2026-10-28_fullimage.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({count:23,bytes:4213447,classification:'KEEP',newArtwork:0,manifest:'2026-10-28_fullimage.json'}));
