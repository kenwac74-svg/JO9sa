'use strict';
// Copy current WORK snapshots into tracked source, never the reverse.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const here=__dirname,repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const read=p=>fs.readFileSync(p),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const json=p=>JSON.parse(read(p).toString('utf8').replace(/^\uFEFF/,''));
const write=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');};
const inside=(p,r)=>{const v=path.relative(r,p);return v!==''&&!v.startsWith('..')&&!path.isAbsolute(v);};
const audit=json(here+'/work-sync-audit.json');
const core=require(repo+'/tools/text-workshop/core.cjs');
const qspSource=repo+'/assets/runtime/2.4.1/jack.qsp',qspWork=work+'/jack.qsp';
const oldRaw=read(qspSource),currentRaw=read(qspWork),old=core.parse(oldRaw),current=core.parse(currentRaw);
assert.equal(old.hash,audit.sourceQsp.sha256);assert.equal(current.hash,audit.workQsp.sha256);
assert(core.serialize(current).equals(currentRaw));assert.equal(current.locations.length,314);
assert.equal(old.lines.length,current.lines.length);
const edits=[];
for(let i=0;i<old.locations.length;i++){
 const a=old.locations[i],b=current.locations[i];assert.equal(a.name,b.name);
 if(old.lines[a.body]===current.lines[b.body])continue;
 const before=core.shift(old.lines[a.body],5),after=core.shift(current.lines[b.body],5);
 let start=0,end=0;while(start<Math.min(before.length,after.length)&&before[start]===after[start])start++;
 while(end<Math.min(before.length,after.length)-start&&before[before.length-1-end]===after[after.length-1-end])end++;
 start=before.lastIndexOf('\n',start)+1;
 let beforeEnd=before.indexOf('\n',before.length-end);if(beforeEnd<0)beforeEnd=before.length;
 const extra=beforeEnd-(before.length-end),afterEnd=after.length-end+extra;
 const from=before.slice(start,beforeEnd),to=after.slice(start,afterEnd);
 assert.equal(before.split(from).length-1,1);assert.equal(before.replace(from,()=>to),after);
 edits.push({location:a.name,field:'body',old:from,new:to,count:1,patchId:'WORK_SAVED_SOURCE_20261116'});
}
assert.equal(edits.length,1);assert.equal(edits[0].location,'jo9_slave_death');
const allowedFields=new Set(old.locations.map(x=>x.body));
assert(old.lines.every((line,i)=>line===current.lines[i]||allowedFields.has(i)));
const reportDir=repo+'/records/commit-work-source-20261116';
assert(!fs.existsSync(reportDir),'Already synced; inspect prior report before retrying');
for(const row of audit.copyCandidates){
 assert(inside(row.source,work));assert(inside(row.destination,repo+'/assets'));
 assert(!/\.(sav|wav|mp3|ogg|flac|zip)$/i.test(row.source));
 const bytes=read(row.source);assert.equal(bytes.length,row.bytes);assert.equal(hash(bytes),row.sha256);
 if(row.before){assert.equal(hash(read(row.destination)),row.before.sha256);}
 else assert(!fs.existsSync(row.destination));
 if(row.destination.endsWith('.json'))JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));
 if(row.destination.endsWith('.png'))assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
}
const metaPath=repo+'/assets/runtime-source-2.4.1.json',invPath=repo+'/assets/runtime-manifests/2.4.2-work.json';
const meta=json(metaPath),inventory=json(invPath),priorMetaHash=hash(read(metaPath)),priorInventoryHash=hash(read(invPath));
for(const row of audit.copyCandidates){
 // Preserve small, uncommitted source originals locally; no duplicate QSP.
 if(row.before&&!row.destination.endsWith('.qsp')){
  const backup=here+'/source-before/'+path.relative(repo,row.destination);fs.mkdirSync(path.dirname(backup),{recursive:true});
  fs.copyFileSync(row.destination,backup,fs.constants.COPYFILE_EXCL);
 }
 fs.mkdirSync(path.dirname(row.destination),{recursive:true});fs.copyFileSync(row.source,row.destination);
 assert.equal(hash(read(row.destination)),row.sha256);
}
for(const change of audit.manifestUpdates){
 const values=change.current||{bytes:change.bytes,sha256:change.sha256};
 let entry=meta.files.find(x=>x.runtimePath===change.runtimePath&&x.repositoryPath===change.repositoryPath);
 if(!entry){entry={runtimePath:change.runtimePath,repositoryPath:change.repositoryPath};meta.files.push(entry);}
 entry.bytes=values.bytes;entry.sha256=values.sha256;
}
for(const row of audit.copyCandidates){
 let entry=meta.files.find(x=>x.runtimePath===row.runtimePath&&x.repositoryPath===path.relative(repo,row.destination).replaceAll('\\','/'));
 if(!entry){entry={runtimePath:row.runtimePath,repositoryPath:path.relative(repo,row.destination).replaceAll('\\','/')};meta.files.push(entry);}
 entry.bytes=row.bytes;entry.sha256=row.sha256;
}
const touched=new Map(audit.manifestUpdates.map(row=>[row.runtimePath,row]));
for(const row of audit.copyCandidates)touched.set(row.runtimePath,row);
for(const [runtimePath,row] of touched){
 const source=work+'/'+runtimePath;if(!fs.existsSync(source)||!inside(source,work))continue;
 let entry=inventory.files.find(x=>x.path==='game/'+runtimePath);
 if(!entry){entry={path:'game/'+runtimePath,category:runtimePath.endsWith('.png')?'image':'runtime-core',repositoryPath:null};inventory.files.push(entry);}
 const bytes=read(source);entry.bytes=bytes.length;entry.sha256=hash(bytes);
 const mapping=meta.files.find(x=>x.runtimePath===runtimePath);if(mapping)entry.repositoryPath=mapping.repositoryPath;
}
const summary={date:'2026-11-16',report:'records/commit-work-source-20261116/REPORT_KO.md',sourceQspSha256:current.hash,copiedFiles:audit.copyCandidates.length,manualEditMod:'mods/2026-11-16_work_saved_source.json',fullUnmodified:true,saveAndAudioBinariesExcluded:true};
meta.sourceQspSha256=current.hash;meta.snapshotDate='2026-11-16';meta.latestWorkSourceSync=summary;
inventory.sourceQspSha256=current.hash;inventory.asOf='2026-11-16';inventory.latestWorkSourceSync=summary;
write(metaPath,meta);write(invPath,inventory);
write(repo+'/mods/2026-11-16_work_saved_source.json',{id:'2026-11-16_work_saved_source',status:'APPROVED',approval:'Preserve user-saved WORK dialogue and image binding; user requested commit and push. No gameplay edit is applied by this snapshot operation.',before_sha256:old.hash,after_sha256:current.hash,edits});
write(reportDir+'/sync.json',{...summary,sourceBefore:old.hash,metadataBefore:priorMetaHash,inventoryBefore:priorInventoryHash,copies:audit.copyCandidates,roundtrip:true,locations:314,changedLocation:edits[0].location,patchReconstructsCurrent:true,sourceBackupLocation:here+'/source-before',knownMissingWork:audit.missingWork});
fs.writeFileSync(reportDir+'/REPORT_KO.md','# 현재 WORK 변경분 커밋 준비 — 2026-11-16\n\n사용자 커밋·푸시 지시에 따라 WORK에서 저장소로 QSP 1개, JSON 4개, PNG 42개를 복사했다. WORK·Full·세이브·음원·기존 배포 ZIP은 수정하지 않았다.\n\nQSP '+old.hash+' → '+current.hash+'. 수동 변경 위치는 jo9_slave_death 한 곳이며 2-2 결과의 문구와 이미지 연결을 그대로 보존했다. 구조 314위치, 왕복 바이트 일치, 선언형 차이 재생 일치를 확인했다. 기존 기능의 엔진 검증은 이전 기록을 재사용했으며 전체 게임 경로를 다시 실행하지 않았다. 현재 화면 육안은 새로 확인하지 않았다.\n\n아프리카인·미라 JSON 및 이미지, 펠리시티·마리로즈 얼굴, 선택 결과 이미지의 최신 WORK 파일을 채택했다. 파일별 원경로·소스경로·이전/현재 해시는 sync.json에 있다. 이미 소스가 일치한 CSS·단축키·미라 항목의 메타데이터도 최신화했다. 기존 명세의 WORK 누락 경로는 삭제하지 않고 기록에 유지했다. assets/runtime/2.4.1 경로는 기존 도구 호환을 위해 유지한다.\n\n음원·개인 세이브·진단 QSP·복구 사본·배포 ZIP은 Git 추가에서 제외한다. 기존의 완료된 모딩 도구 및 해당 검증·재현 기록은 관련 소스와 함께 보존한다. 퇴역 안내문과 공지 이미지는 기타 산출물에서 실제로 사용하는 자료이므로 보존한다.\n');
assert.equal(hash(read(qspWork)),current.hash);
console.log(JSON.stringify({synced:true,copies:audit.copyCandidates.length,bytes:audit.summary.totalCopyBytes,locations:314,qspSha256:current.hash,workUnmodified:true}));
