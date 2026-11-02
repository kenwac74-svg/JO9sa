const fs=require('fs'),crypto=require('crypto');
const repo='G:/somi/JO9sa', w=__dirname.replace(/\\/g,'/').replace(/\/egeya-naked-followup-20261028$/,'');
const rec=repo+'/records/egeya-naked-followup-20261028', pr=repo+'/records/private-pregnancy-followup-20261028';
const read=p=>fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
function edit(p,fn){fs.writeFileSync(p,fn(read(p)));}
function append(p,marker,text){edit(p,s=>s.includes(marker)?s:s.trimEnd()+'\n\n'+text+'\n');}
const after='f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97';
if(crypto.createHash('sha256').update(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')).digest('hex')!==after) throw Error('Installed WORK differs.');
const report=read(__dirname+'/REPORT_KO.md').replace('수정 후보 검증 완료, 반영 승인 대기','사용자 승인 후 WORK 반영 완료').replace('WORK는 변경하지 않았다.','사용자 승인 후 기본 조회키 한 줄을 WORK에 반영했다.').replace('상태: **CANDIDATE_NOT_APPLIED — 사용자 반영 확인 대기**. 후보 JSON은 records에만 보관하며 mods의 적용 대상에 넣지 않는다.','상태: **APPLIED — 사용자 승인 후 WORK 반영 완료**. 확정 JSON은 mods에 등록했다. 설치 결과는 검증 후보와 바이트가 같다. `installation.json`과 `MANUAL_KO.md`에 적용·백업·보존 정보를 기록했다.').replace('기존 세이브·JSON·PNG·CSS·JS·엔진·배포본은 변경하지 않았고','기존 세이브·게임 JSON·PNG·CSS·JS·엔진·배포본은 변경하지 않았고');
fs.writeFileSync(__dirname+'/REPORT_KO.md',report);fs.writeFileSync(rec+'/REPORT_KO.md',report);
for(const name of ['MANUAL_KO.md','install-approved.cjs','finalize-records.cjs']) fs.copyFileSync(__dirname+'/'+name,rec+'/'+name);
const plan=read(__dirname+'/PLAN_KO.md').replace('- [ ] 기본 조회키','- [x] 기본 조회키').replace('- [ ] 다른 남은','- [x] 다른 남은')+'\n최종: 사용자 `WORK에 반영` 승인 후 적용·직전 백업·후보 바이트 일치·보호 파일 보존 확인 완료.\n';
fs.writeFileSync(__dirname+'/PLAN_KO.md',plan);fs.writeFileSync(rec+'/PLAN_KO.md',plan);
const pregnancy=w+'/private-pregnancy-followup-20261028';
edit(pregnancy+'/REPORT_KO.md',s=>s.replace('병원은 원래 방별 진단 조건과 상태 대입을 그대로 실행하고 문장만 QA로 바꿨다.','bridge 왕복 진단은 `$update_slave_features_list`도 빈 코드로 두었으므로 해당 특성 목록 갱신·repair와의 결합은 검사하지 않았다. 병원은 원래 방별 진단 조건과 상태 대입을 그대로 실행하고 문장만 QA로 바꿨다.'));
const planJson=JSON.parse(read(pregnancy+'/plan.json'));planJson.reviewedIsolationLimit='Bridge route probes replace $update_slave_features_list with empty code; feature-list refresh/repair interaction is not covered.';fs.writeFileSync(pregnancy+'/plan.json',JSON.stringify(planJson,null,2)+'\n');
for(const name of ['REPORT_KO.md','plan.json'])fs.copyFileSync(pregnancy+'/'+name,pr+'/'+name);
fs.writeFileSync(pr+'/REVIEW_KO.md','# 개인실 임신 진단 독립 검토\n\nportrait_reports_audit의 읽기 전용 대조 결과, 최종 실제 엔진 5/5·62조건과 실제 제보 원인 미확정 결론은 증거에 맞았다. bridge 왕복에서 특성 목록 갱신·repair도 격리한 점이 문서에서 빠져 있어 REPORT_KO.md와 plan.json에 추가했다. 검사 수·게임 코드는 바꾸지 않았고 재실행하지 않았다. 이 진단은 전체 하루·개인 GUI나 해당 repair 결합을 증명하지 않는다.\n');
edit(repo+'/records/bug-batch-20261028/REPORT_KO.md',s=>s.replace('한 줄 후보 native 행렬·보존·공식9경로 PASS. WORK 미반영, 개별 승인 대기.','사용자 승인 후 한 줄 수정 WORK 반영. native 행렬·보존·공식9경로 PASS, 설치 후보 바이트 일치.'));
append(repo+'/docs/SESSION_HANDOFF_INDEX.md','EGEYA_DEFAULT_LOOKUP_APPLIED_20261028','## 2026-10-28 에게야 기본 이미지 조회 WORK 반영\n\nEGEYA_DEFAULT_LOOKUP_APPLIED_20261028: 위 후보는 후속 사용자 승인으로 적용 완료됐다. [구현·복구·한계](../records/egeya-naked-followup-20261028/MANUAL_KO.md). 조수 mode0 빈 키만 기본 fullimage로 전달하며 의복·모드·능력·저장 키는 유지한다. 현재/후보240경로씩·실제체크박스·23묶음 보존 및 공식9 PASS, 설치 해시 f6520ef1. 직전 백업 jack.qsp.bak_20261028_194030. 기존 세이브·Full·그림·게임JSON·CSS·JS·커밋·푸시 변경 없음. 옛 kirakira 캐시는 별도 후속 조사이며 전체 GUI 로드 미검증.');
append(repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md','EGEYA_DEFAULT_LOOKUP_APPLIED_20261028','## 2026-10-28 에게야 기본 이미지 조회 승인 적용\n\nEGEYA_DEFAULT_LOOKUP_APPLIED_20261028: 앞선 승인 대기 후보는 사용자 후속 승인으로 WORK 반영 완료. 최종 QSP f6520ef1이며 records/egeya-naked-followup-20261028/MANUAL_KO.md를 따른다. mods/2026-10-28_assistant_default_image_lookup.json 등록, native·공식9경로와 설치 바이트 일치 PASS. 별도 legacy 캐시·개인 GUI 미검증은 남으며 PNG·게임JSON·기존SAV·Full·커밋·푸시 무변경.');
const source=read(w+'/rumor-provider-icons-20261028/cleanup.ps1');
const clean=source.replaceAll('jo9-rumor-icons-stage-20261028','jo9-egeya-naked-stage-20261028').replaceAll('jo9-rumor-icons-gate-20261028','jo9-egeya-naked-gate-20261028').replaceAll('run-NryPT0','run-rErWm7').replaceAll('rumor-provider-icons-20261028','egeya-naked-followup-20261028').replaceAll('e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0',after);
fs.writeFileSync(__dirname+'/cleanup.ps1','\uFEFF'+clean);fs.writeFileSync(rec+'/cleanup.ps1','\uFEFF'+clean);
console.log('RECORDS UPDATED; cleanup script prepared; game not modified by finalization.');
