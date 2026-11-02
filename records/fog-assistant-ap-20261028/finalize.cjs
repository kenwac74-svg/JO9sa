'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const repo='G:/somi/JO9sa',record=repo+'/records/fog-assistant-ap-20261028';
function read(p){return fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');}
const install=JSON.parse(read(record+'/installation.json'));assert.equal(install.status,'PASS');
function copy(src,dst){fs.mkdirSync(dst,{recursive:true});for(const e of fs.readdirSync(src,{withFileTypes:true})){assert(!e.isSymbolicLink());const a=path.join(src,e.name),b=path.join(dst,e.name);if(e.isDirectory())copy(a,b);else fs.copyFileSync(a,b);}}
copy(__dirname+'/tests',record+'/tests');
for(const name of ['MANUAL_KO.md','finalize.cjs'])fs.copyFileSync(__dirname+'/'+name,record+'/'+name);
const report='# 10/28 조수 안개전투 행동력 — WORK 적용 완료\n\n주인공 기본 행동1회·조수 최소2 정산을 적용했다. 큰 지구력 손실은 유지하고 추가2를 붙이지 않는다. 동료 패배 후 교대는 기존 주인공 정산을 사용하며 중복 청구하지 않는다. 노예 선봉·AP>0 진입과 기존 반행동/반지/치트 보정은 유지했다.\n\n현재 WORK '+install.after+'; 직전 백업 '+install.backup.path+' ('+install.before+'). 기존 사용자 세이브·Full·엔진·CSS·JS·설정·원본9개 보호 파일의 해시가 동일하다. 커밋·푸시·배포 ZIP 없음.\n\n기준·후보 실제 엔진 각4사례/147조건, 공식 구조·정확 재생·멱등성·설치 엔진9경로, 독립 범위 검토가 PASS다. 설치 QSP는 검증 후보와 바이트가 같다. actual 사용자 세이브 로드·전체 전투 플레이나 모든 명성/사망 분기를 검증한 뜻은 아니다. 검사 격리와 초기 harness timeout은 tests/README_KO.md, 자세한 동작·복구는 MANUAL_KO.md를 따른다.\n';
fs.writeFileSync(record+'/REPORT_KO.md',report);fs.writeFileSync(__dirname+'/REPORT_KO.md',report);
const plan=read(__dirname+'/PLAN_KO.md').replaceAll('- [ ]','- [x]');fs.writeFileSync(__dirname+'/PLAN_KO.md',plan);fs.writeFileSync(record+'/PLAN_KO.md',plan);
function edit(p,fn){fs.writeFileSync(p,fn(read(p)));}
function append(p,marker,text){edit(p,s=>s.includes(marker)?s:s.trimEnd()+'\n\n'+text+'\n');}
edit(repo+'/records/bug-batch-20261028/REPORT_KO.md',s=>s.replace('| 조수 안개전투 AP 최소비용 | 현재 승리는 주인공0/조수최소1. 어려운 승리는 잔여 전투지구력 환산으로 더 소모. 패배 교대는 별도 정산 | 주인공1/조수2는 밸런스 제안으로 기록, 미적용. 통합 난이도/AP 조정 보류와 구분 |','| 조수 안개전투 AP 최소비용 | 사용자 후속 해결 지시로 주인공 기본행동1회·조수최소2를 WORK 반영. 더 큰 지구력 손실·반지/반행동/치트·노예선봉 유지 | 단회정산/패배교대 중복없음, 기준·후보 각147조건·공식9경로 PASS. 별도 통합 난도 보류는 유지. ../fog-assistant-ap-20261028/REPORT_KO.md |'));
append(repo+'/docs/SESSION_HANDOFF_INDEX.md','FOG_ASSISTANT_AP_APPLIED_20261028','## 2026-10-28 제보 우선 처리·조수 안개 행동력 비용\n\nFOG_ASSISTANT_AP_APPLIED_20261028: 사용자 `10/28 제보부터 다 해결하자` 지시로 별도 D15 UI 잔상 조사를 중단하고 제보 잔여부터 처리했다. [조수 비용 구현·복구·한계](../records/fog-assistant-ap-20261028/MANUAL_KO.md): 조수 min(지구력환산,전AP−2), 교대없는 조수승리에서 기존 주인공 행동helper1회. 기존 settled·반지/반행동/치트·노예선봉·교대후 주인공정산 유지. native 각147조건·공식9경로·정적검토 PASS, WORK e8300284·백업 jack.qsp.bak_20261028_203116. 기존SAV·Full·엔진·CSS·JS·커밋·푸시 보존. 개인실 임신은 실제 연결 추가 검증 중. D15는 [중단·증거·정리 기록](../records/ui-focus-repaint-20261028/REPORT_KO.md)을 따르며 원인 확정/수리 없음.');
append(repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md','FOG_ASSISTANT_AP_APPLIED_20261028','## 2026-10-28 조수 안개전투 비용 적용\n\nFOG_ASSISTANT_AP_APPLIED_20261028: 주인공 기본행동1회·조수최소2 정산을 WORK에 반영했다. 큰 손실에 추가2를 청구하지 않고, 교대후 기존 주인공 비용과 중복하지 않는다. 노예선봉·진입>0·반행동·반지·치트 보정 유지. 신규loc/영구key0·기존loc본문2edit. native 기준/후보 각147조건 및 공식9경로·독립검토 PASS, WORK e8300284. records/fog-assistant-ap-20261028/MANUAL_KO.md 참조. Full/세이브/커밋/푸시/ZIP 변경없음. 별도 통합 난도 조정과 D15 일반UI잔상은 이번 수정에 포함하지 않는다.');
const previous=read(path.dirname(__dirname)+'/egeya-naked-followup-20261028/cleanup.ps1');
const cleanup=previous.replaceAll('jo9-egeya-naked-stage-20261028','jo9-fog-assistant-ap-20261028\\stage').replaceAll('jo9-egeya-naked-gate-20261028','jo9-fog-assistant-ap-gate-20261028').replaceAll('run-rErWm7','run-P1EllG').replaceAll('egeya-naked-followup-20261028','fog-assistant-ap-20261028').replaceAll('f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97',install.after);
fs.writeFileSync(__dirname+'/cleanup.ps1','\uFEFF'+cleanup);fs.writeFileSync(record+'/cleanup.ps1','\uFEFF'+cleanup);
console.log('REPORTS UPDATED; guarded cleanup prepared.');
