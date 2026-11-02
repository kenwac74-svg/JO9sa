'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',record=repo+'/records/private-pregnancy-integration-20261028',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
const result=JSON.parse(read(__dirname+'/unmodified-ten-results.json'));
assert.equal(result.status,'STATE_COMPLETE');assert(result.pass);assert.equal(result.casesPassed,10);assert.equal(result.assertions,284);assert.equal(result.rendererEntries,10);
const report=read(__dirname+'/REPORT_KO.md'),review=read(__dirname+'/REVIEW_KO.md');assert(report.includes('284')&&report.includes('미확정'),'Final report is not ready');assert(review.includes('284'));
assert.equal(hash(game+'/jack.qsp'),'e830028463ab3ca675e5e931110182883bb773e9a9403a1385d1d968114b9c98');
assert(result.protected.every(x=>hash(x.path)===x.sha256));
fs.mkdirSync(record,{recursive:true});const saves=[];
for(const e of fs.readdirSync(__dirname,{withFileTypes:true})){
 assert(!e.isSymbolicLink());assert(!e.isDirectory(),'Unexpected nested folder');
 const src=path.join(__dirname,e.name);
 if(e.name.toLowerCase().endsWith('.sav')) saves.push({path:src,sha256:hash(src),bytes:fs.statSync(src).size,purpose:'Preserved synthetic diagnostic state; not a manual gameplay save.'});
 else fs.copyFileSync(src,path.join(record,e.name));
}
fs.writeFileSync(record+'/preserved-save-references.json',JSON.stringify(saves,null,2)+'\n');
function edit(p,fn){fs.writeFileSync(p,fn(read(p)));}
function append(p,marker,text){edit(p,s=>s.includes(marker)?s:s.trimEnd()+'\n\n'+text+'\n');}
edit(repo+'/records/bug-batch-20261028/REPORT_KO.md',s=>s.replace('| 개인실 임신 의심 | 격리 실제 엔진 5사례·62조건에서 네 방 대상 연결·정상 계산·불임·발견 경계·임시 역할 왕복을 확인 | 정상 임신/비임신 모두 관찰. 실제 제보 세이브·전체 GUI는 미재현이므로 원인 미확정, 수정하지 않음. ../private-pregnancy-followup-20261028/REPORT_KO.md |','| 개인실 임신 의심 | 공통 계산62조건에 이어 원래 행동·결과·특성/repair·일일 계산10경로284조건 상태완료, 개인실 실제 임신도 관찰 | 전달 제보라 진단/아이콘/실제SAV 확인불가. 정상조건에서 결함 미재현, 임의 확률변경·수리 없음. 실제 제보 상태는 미확정. ../private-pregnancy-integration-20261028/REPORT_KO.md |'));
append(repo+'/records/bug-batch-20261028/REPORT_KO.md','1028_BATCH_STATUS_20261028','## 10/28 우선 처리 최종 현황\n\n1028_BATCH_STATUS_20261028: 8건을 WORK에 조치했다(위탁 회수, 숨은 특성, 카오틱 범위, 기본 전신 경로, 줄리아 이미지, 에게야 알몸 이미지, 소문 아이콘, 조수 안개 행동력). 목록의 개인실 헌신 보너스1건은 기존 기획 유지, 임신 의심1건은 정상 경로 상태 검사까지 완료했지만 실제 제보 상태 미확정이다. 이를10건 모두 버그 수정 완료로 집계하지 않는다. 최신 WORK e8300284. 기존SAV·배포·원본 보존, 커밋·푸시 없음.');
append(repo+'/docs/SESSION_HANDOFF_INDEX.md','PRIVATE_PREGNANCY_STATE_COMPLETE_20261028','## 2026-10-28 개인실 임신 원문 경로 대조 완료\n\nPRIVATE_PREGNANCY_STATE_COMPLETE_20261028: 사용자는 전달받은 제보라 의료센터 진단인지 아이콘만 확인했는지 알 수 없다고 답했다. 원래 interaction/result/traits/repair를 보존한 진단에서 주노예·조수·4개인실 직접6+bridge4 경로,10사례284조건·renderer경계10회 상태완료 및 개인실 임신 발생을 확인했다. 초기 미발견은 원래 동작이며 이번에 확률/발견조건을 고치지 않았다. [최종 범위·관측·미검증](../records/private-pregnancy-integration-20261028/REPORT_KO.md), [독립 검토](../records/private-pregnancy-integration-20261028/REVIEW_KO.md). 상태완료는 개인SAV GUI재현/원문MSG미발생/전체하루 동선의 보장이 아니다. 이전3QA필터timeout과 probe출력채널timeout은 제품결함으로 집계하지 않는다. WORK e830·사용자SAV·엔진·Full 변경없음. 10/28제보는8건조치/1기존기획/1실제제보미확정으로 기록.');
append(repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md','PRIVATE_PREGNANCY_STATE_COMPLETE_20261028','## 2026-10-28 개인실 임신 제보 검증 결과\n\nPRIVATE_PREGNANCY_STATE_COMPLETE_20261028: 원문 행동→결과→특성갱신/repair→일일 임신 계산의10경로284조건과 개인실 임신 발생을 확인했다. 실제 제보는 전달 내용뿐이며 진단/아이콘/SAV 상태 미상으로 재현 미확정. 임신 확률·발견조건·추가 UI를 임의 변경하지 않았으므로 패치의 새 수정으로 세지 않는다. records/private-pregnancy-integration-20261028/REPORT_KO.md 참조. 기존 공통62조건 검사와 한계를 구분하며 현재 WORK e830·Full·기존SAV·커밋·푸시 무변경.');
const final={status:'ARCHIVED',runtimeChanged:false,actualReportReproduced:false,stateIntegration:'STATE_COMPLETE',cases:10,conditions:284,rendererEntries:10,workSha256:hash(game+'/jack.qsp'),userAnswer:'전달받은 제보라 확인 불가',sourceSha256:result.sourceSha256,currentWorkDelta:result.currentWorkDelta,preservedSyntheticSaves:saves,protected:result.protected.map(x=>({...x,unchanged:hash(x.path)===x.sha256})),userSaveLoaded:false,userSaveWritten:false,distributionWritten:false,committed:false,pushed:false};
fs.writeFileSync(record+'/archive-audit.json',JSON.stringify(final,null,2)+'\n');console.log(JSON.stringify({status:'ARCHIVED',cases:10,conditions:284,actualReportReproduced:false,work:final.workSha256,preservedSyntheticSaves:saves.length}));
