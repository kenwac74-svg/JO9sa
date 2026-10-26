'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const base=__dirname,record='G:/somi/JO9sa/records/menu-private-fixes-20261025';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const staged=json(base+'/STAGED.json');assert.equal(staged.status,'VERIFIED_READY_TO_APPLY');
const bytes=fs.readFileSync(staged.qsp);assert.equal(c.hash(bytes),staged.after);assert(c.serialize(c.parse(bytes)).equals(bytes));qa.inspectWorld(bytes);
const inputs=json(base+'/inputs.json'),same=[];
for(const x of inputs){if(path.resolve(x.path).toLowerCase()===path.resolve(staged.qsp).toLowerCase())continue;assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,x.path);same.push(x.path);}
assert.equal(c.hash(fs.readFileSync('G:/somi/JO9_work_backups/menu-private-fixes-20261025/jack.qsp')),staged.before);
for(const [p,sha]of [['G:/somi/JO9O/game/jack.qsp','26e15aaf30b6226a2883c6b532a6ee4eed34791110618597d234bb7d6fa3e052'],['G:/somi/JO9sa/source/jack_2026-10-01.qsp','59e1a1afb4fdd2e9bf9b1ffdcb12c10f2f4cc15d4cd3d890e21f8cb652f5958e']]){
 assert.equal(c.hash(fs.readFileSync(p)),sha);
}
const docs='G:/somi/JO9sa/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',marker='MENU_PRIVATE_QUOTA_APPLIED_20261025';
let text=fs.readFileSync(docs,'utf8');assert(!text.includes(marker),'Do not append a duplicate result');
text+='\r\n\r\n## WORK 적용 — 소문·보관함·개인실 보고와 괴물 자원 소진 ('+marker+')\r\n\r\n소문을 종료 선택지 바로 위로 옮기고 인용부호가 잘리던 실행 링크를 수정했다. 보관함의 빈 행을 줄이고, 일반 노예·개인실 모유량 아이콘 6곳을 실행 가능한 링크로 고쳤다. 개인실 교육135는 기존 bridge 허용 목록의 누락 한 행만 복구했으며 기존 항목·대사·행동을 변경하지 않았다.\r\n\r\n괴물의 만족/공유 사용량 검사를 전용 작업·교육·결과 계산에 적용해 옛 실행 명령 재사용도 차단한다. 숙련0의 양수 보상에만 최소 소모1을 기록하며 원래 보상식·특성 보너스·행동력·회복·저장 상한은 유지한다. 새 위치·영구 키0, QSP 한 파일만 반영. CSS 레이어 가설은 진단 재진입 오류로 기각되어 CSS는 변경하지 않았다.\r\n\r\n공식 실제 엔진9경로, 소문5/보관함2/소진11 및 별도 보고·개인실 경로 검사 PASS. 기존151세이브와 다른 보호 입력·원본 보존. WORK만 미배포, Full·ZIP·커밋·푸시 없음. [동작·의존성·검증 한계](../records/menu-private-fixes-20261025/MANUAL_KO.md), [최종 결과](../records/menu-private-fixes-20261025/FINAL_RESULT.json).\r\n';
fs.writeFileSync(docs,text,'utf8');
const report={status:'APPLIED_AND_VERIFIED',runtimeWritten:true,runtimeFiles:[{path:staged.qsp,before:staged.before,after:staged.after}],patch:staged.patch,record,checks:{deliveredBytesMatchTestedCandidate:true,structureAndRoundtrip:true,officialNative:staged.officialPassed,functional:staged.functional,unrelatedProtectedFilesUnchanged:same.length,existingSavesUnchanged:same.filter(x=>/\.sav$/i.test(x)).length,originalCssUnchanged:true,newLocations:0,newPersistentKeys:0},limits:['Native QtWebKit DOM events; not physical mouse verification.','Input saves prime diagnostic state; full GUI Save/Load/CRC restoration combinations are not proved.','Automatic roles have static coverage plus one complete private-room representative.','Insufficient-funds popup branch is captured before display; dismissal is not covered.'],fullSynced:false,zipUpdated:false,committed:false,pushed:false,temporaryDiagnostics:'Cleanup follows final evidence staging'};
fs.writeFileSync(record+'/FINAL_RESULT.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync(base+'/FINAL_RESULT.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
