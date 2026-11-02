'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const s=read(__dirname+'/staging.json'),gate='G:/Codex/tmp/jo9-approved-gate-current-20261028/run-smrFZW/report.json',official=read(gate);
a.equal(official.verdict,'PASS');a.equal(official.client.probes.length,9);a(official.client.probes.every(p=>p.pass));
a.equal(c.hash(fs.readFileSync(s.candidate)),s.candidate_sha256);a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),s.baseline,'WORK changed since preparation');
const protectedBefore=read(__dirname+'/protected-before.json');for(const item of protectedBefore)a.equal(c.hash(fs.readFileSync(item.file)),item.sha256,item.file);
for(const file of ['rumor-native/dealer-results.json','rumor-native/preserve-results.json','rumor-native/scan-results.json','chaotic-expanded/green-results.json']){const result=read(__dirname+'/'+file);a(result.results.every(r=>r.pass),file);}
const rec=repo+'/records/bug-batch-20261028';a(!fs.existsSync(rec),'Existing record folder preserved');
for(const p of s.patches)a(!fs.existsSync(repo+'/mods/'+p.id+'.json'),'Existing mod preserved '+p.id);
const beforeBackups=new Set(fs.readdirSync(game).filter(f=>f.startsWith('jack.qsp.bak_')));
const applied=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',s.mods_dir],{encoding:'utf8',windowsHide:true,timeout:60000});
fs.writeFileSync(__dirname+'/apply-work.log',applied.stdout+'\n'+applied.stderr);a.equal(applied.status,0,'WORK apply_mods');
const actual=fs.readFileSync(game+'/jack.qsp');a.equal(c.hash(actual),s.candidate_sha256);qa.inspectWorld(actual);
const newBackups=fs.readdirSync(game).filter(f=>f.startsWith('jack.qsp.bak_')&&!beforeBackups.has(f));a.equal(newBackups.length,1);a.equal(c.hash(fs.readFileSync(game+'/'+newBackups[0])),s.baseline);
const preserved=[];for(const item of protectedBefore){if(item.file===game+'/jack.qsp')continue;const hash=c.hash(fs.readFileSync(item.file));a.equal(hash,item.sha256,item.file);preserved.push({file:item.file,sha256:hash,unchanged:true});}
fs.copyFileSync(gate,__dirname+'/official-report.json');fs.copyFileSync('G:/Codex/tmp/jo9-approved-gate-20261028/run-Y9iTNv/report.json',__dirname+'/official-first-report.json');
write(__dirname+'/installation.json',{status:'APPLIED_WORK_ONLY',before:s.baseline,after:s.candidate_sha256,work:game+'/jack.qsp',backup:game+'/'+newBackups[0],staging_backup:s.backup,locations:6,edits:12,new_locations:0,official:'PASS',official_native_paths:9,preserved,commit:false,push:false,distribution_modified:false});
for(const p of s.patches)fs.copyFileSync(__dirname+'/'+p.id+'.json',repo+'/mods/'+p.id+'.json');
function copyRecord(source,target){fs.mkdirSync(target,{recursive:true});for(const entry of fs.readdirSync(source,{withFileTypes:true})){if(entry.isSymbolicLink())continue;const src=path.join(source,entry.name),dst=path.join(target,entry.name);if(entry.isDirectory())copyRecord(src,dst);else if(entry.isFile()&&!/\.(qsp|sav|png|zip|ini)$/i.test(entry.name))fs.copyFileSync(src,dst);}}
copyRecord(__dirname,rec);
const handoff=repo+'/docs/SESSION_HANDOFF_INDEX.md',heading='## 2026-10-28 제보 점검·카오틱 우선순위·길드 소문 안내';
const handoffText=fs.readFileSync(handoff,'utf8');a(!handoffText.includes(heading));
fs.appendFileSync(handoff,'\n\n'+heading+'\n\n[승인 적용·미수정 제보·검증](../records/bug-batch-20261028/REPORT_KO.md). WORK에 카오틱 부정 우선/상황형 후순위와 가격 비노출 길드 재매입 소문 안내를 반영. 기존 거래48조합 동치, 기능별 실제 엔진 검사와 공식9경로 PASS. 경매 위탁 회수 유실·오베레그 신규 특성 표시·줄리아 NPC 참조는 원인/수정안 확인 뒤 미수정 상태로 별도 기록. 개인실 일반 잠자리 비활성은 기존 기획, 임신/고유 이미지 제보는 개별 상태 재현 필요. 조수 AP1/2 변경은 제안으로 기록. 기존 세이브·Full·이미지 보존, 커밋·푸시 없음.\n');
console.log(JSON.stringify({applied:true,hash:s.candidate_sha256,work_backup:game+'/'+newBackups[0],official_native:9,source_mods:s.patches.map(p=>p.id),record:rec,preserved:preserved.length}));
