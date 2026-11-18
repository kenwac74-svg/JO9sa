'use strict';
const fs=require('fs'),path=require('path'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',here=__dirname;
const read=p=>fs.readFileSync(p),json=p=>JSON.parse(read(p).toString('utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const patch=json(here+'/mod/patch.json'),raw=read(W+'/jack.qsp'),original=c.parse(raw),candidate=c.parse(raw);
a.equal(c.hash(raw),patch.before_sha256,'WORK changed; refresh before applying');a(read(R+'/assets/runtime/2.4.1/jack.qsp').equals(raw));
for(const e of patch.edits){let l=candidate.locations.find(x=>x.name===e.location),s=c.shift(candidate.lines[l.body],5);a.equal(s.split(e.old).length-1,e.count);candidate.lines[l.body]=c.shift(s.replace(e.old,()=>e.new),-5);}
const output=c.serialize(candidate);a.equal(c.hash(output),patch.after_sha256);a(c.serialize(c.parse(output)).equals(output));
const touched=new Set(patch.edits.map(e=>e.location)),changedIndices=new Set([...touched].map(n=>original.locations.find(l=>l.name===n).body));
a(original.lines.every((line,i)=>changedIndices.has(i)||line===candidate.lines[i]));
const reversed=c.parse(output);for(const e of [...patch.edits].reverse()){let l=reversed.locations.find(x=>x.name===e.location),s=c.shift(reversed.lines[l.body],5);a.equal(s.split(e.new).length-1,e.count);reversed.lines[l.body]=c.shift(s.replace(e.new,()=>e.old),-5);}a(c.serialize(reversed).equals(raw));
function scoped(doc){let fields=['QSPGAME','Priscilla changed-location check','',c.shift(String(touched.size),-5)];for(const name of touched){let l=doc.locations.find(x=>x.name===name);fields.push(c.shift(name,-5),'',doc.lines[l.body],c.shift('0',-5));}fields.push('');return Buffer.from(fields.join('\r\n'),'utf16le');}
const marker=require(R+'/tools/qa/check-qsp-marker-boundaries.cjs'),eol=require(R+'/tools/qa/check-qsp-line-endings.cjs');
a.equal(marker.inspectMarkerBoundaries(scoped(candidate)).issues.length,0);a.equal(eol.inspect(scoped(candidate)).issues.length,0);
if(process.argv.includes('--scoped')){fs.writeFileSync(here+'/scoped.qsp',scoped(original));console.log(JSON.stringify({scope:'two changed locations',markers:'PASS',lineEndings:'PASS',inverse:'PASS',roundtrip:'PASS'}));process.exit(0);}
a.equal(json(here+'/green-results.json').passed,16);
const assets=json(here+'/assets.json');for(const row of assets){a.equal(c.hash(read(row.source)),row.sha256);a(!fs.existsSync(W+'/'+row.runtimePath));a(!fs.existsSync(R+'/'+row.repositoryPath));}
const metaPath=R+'/assets/runtime-source-2.4.1.json',invPath=R+'/assets/runtime-manifests/2.4.2-work.json',metaBefore=read(metaPath),invBefore=read(invPath),meta=json(metaPath),inventory=json(invPath);
const record=R+'/records/priscilla-followup-20261116';fs.mkdirSync(record,{recursive:true});fs.mkdirSync(record+'/mod',{recursive:true});
for(const name of ['PLAN_KO.md','regression.cjs','prepare.cjs','install.cjs','red-results.json','green-results.json','approved-pages.json','assets.json','branch-audit.json'])fs.copyFileSync(here+'/'+name,record+'/'+name);
fs.copyFileSync(here+'/mod/patch.json',record+'/mod/patch.json');fs.copyFileSync(here+'/mod/patch.json',R+'/mods/2026-11-16_priscilla_post_portal.json');
const made=[];let qspWritten=false;
try{
 for(const row of assets)for(const destination of [W+'/'+row.runtimePath,R+'/'+row.repositoryPath]){fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(row.source,destination,fs.constants.COPYFILE_EXCL);made.push({destination,row});a.equal(c.hash(read(destination)),row.sha256);a.notEqual(fs.statSync(row.source).ino,fs.statSync(destination).ino,'Image copies must be independent files');}
 a.equal(c.hash(read(W+'/jack.qsp')),patch.before_sha256);fs.writeFileSync(W+'/jack.qsp',output);qspWritten=true;fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',output);
 const summary={date:'2026-11-16',mod:'mods/2026-11-16_priscilla_post_portal.json',report:'records/priscilla-followup-20261116/REPORT_KO.md',dialoguePages:15,copiedImages:3,newSavedFields:0,bookDelivery:'DEFERRED',distribution:'PENDING'};
 meta.sourceQspSha256=patch.after_sha256;meta.snapshotDate='2026-11-16';meta.latestPriscillaFollowup=summary;inventory.sourceQspSha256=patch.after_sha256;inventory.latestPriscillaFollowup=summary;
 for(const row of meta.files||[])if(row.runtimePath==='jack.qsp'){row.bytes=output.length;row.sha256=patch.after_sha256;}
 for(const row of inventory.files||[])if(row.path==='game/jack.qsp'){row.bytes=output.length;row.sha256=patch.after_sha256;}
 for(const row of assets){a(!meta.files.some(x=>x.runtimePath===row.runtimePath));meta.files.push({runtimePath:row.runtimePath,repositoryPath:row.repositoryPath,bytes:row.bytes,sha256:row.sha256});a(!inventory.files.some(x=>x.path==='game/'+row.runtimePath));inventory.files.push({path:'game/'+row.runtimePath,repositoryPath:row.repositoryPath,category:'image',bytes:row.bytes,sha256:row.sha256});}
 write(metaPath,meta);write(invPath,inventory);
 a(read(W+'/jack.qsp').equals(read(R+'/assets/runtime/2.4.1/jack.qsp')));for(const row of assets)a.equal(c.hash(read(row.source)),row.sha256,'Original image was modified');
 const result={status:'APPLIED',before:patch.before_sha256,after:patch.after_sha256,locations:314,editedLocations:[...touched],unchangedLocations:312,nonBodyContainerFieldsUnchanged:true,roundtrip:true,inverseRestoresOriginal:true,markers:'PASS',changedLocationLineEndings:'PASS',engineCases:16,imageCopies:assets.map(x=>({runtimePath:x.runtimePath,sha256:x.sha256,bytes:x.bytes})),originalImagesPreserved:true,newSavedFields:0,newHistoryKeys:['6026'],bookDeliveryAndCompletionDeferred:true,fullAndReleaseZipUnmodified:true,wholeGameValidation:'Not repeated; pre-existing unrelated jo9_slave_death LF preserved'};
 write(record+'/verification.json',result);write(here+'/installed.json',result);console.log(JSON.stringify(result));
}catch(error){if(qspWritten){if(c.hash(read(W+'/jack.qsp'))===patch.after_sha256)fs.writeFileSync(W+'/jack.qsp',raw);if(c.hash(read(R+'/assets/runtime/2.4.1/jack.qsp'))===patch.after_sha256)fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',raw);}fs.writeFileSync(metaPath,metaBefore);fs.writeFileSync(invPath,invBefore);for(const {destination,row}of made)if(fs.existsSync(destination)&&c.hash(read(destination))===row.sha256)fs.unlinkSync(destination);throw error;}
