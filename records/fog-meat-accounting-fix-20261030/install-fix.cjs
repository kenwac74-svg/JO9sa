'use strict';
const fs=require('fs'),a=require('assert/strict'),cp=require('child_process'),zlib=require('zlib');
const H=__dirname,R='G:/somi/JO9sa',v=JSON.parse(fs.readFileSync(H+'/fix-inputs.json','utf8')),c=require(R+'/tools/text-workshop/core.cjs'),sc=require(R+'/tools/qa/save-codec.cjs'),qa=require(R+'/tools/qa/release-check.cjs');
const releaseRoot='G:/Codex/tmp/fog-meat-accounting-release-20261030',runs=fs.readdirSync(releaseRoot).filter(x=>x.startsWith('run-'));a.equal(runs.length,1);const run=releaseRoot+'/'+runs[0],report=JSON.parse(fs.readFileSync(run+'/report.json','utf8'));a.equal(report.verdict,'PASS');
const p=v.tmp+'/probes',native=JSON.parse(fs.readFileSync(p+'/client-results.json','utf8').replace(/^\uFEFF/,''));a.equal(native.length,2);a(native.every(x=>x.pass));
const display=sc.parse(fs.readFileSync(p+'/report.sav')),capture=sc.parse(fs.readFileSync(p+'/capture.sav'));a.equal(+sc.value(display,'qa_fail')[0],0);
const messages=display.vars.find(x=>x.name==='QA_MESSAGE').values.map(x=>x[1]);a.equal(messages.length,5);a(messages.every(x=>x.includes('육류')));
const captured={};for(const n of ['decade_mince','decade_meat','decade_virgin','sparks'])captured[n]=+sc.value(capture,n)[0];captured.fridgeMeat=+sc.value(capture,'fridge','meat')[0];a.deepEqual(captured,{decade_mince:0,decade_meat:4,decade_virgin:0,sparks:95,fridgeMeat:4});
const work=v.game+'/jack.qsp';a.equal(c.hash(fs.readFileSync(work)),v.before);a.equal(c.hash(fs.readFileSync(v.tmp+'/candidate.qsp')),v.after);
cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',work,'-ModsDir',v.tmp+'/mods'],{stdio:'inherit'});
const actual=fs.readFileSync(work);a.equal(c.hash(actual),v.after);qa.inspectWorld(actual);a(c.serialize(c.parse(actual)).equals(actual));
const before=c.parse(fs.readFileSync(v.baseline)),after=c.parse(actual);a.deepEqual(before.locations,after.locations);const changed=before.locations.filter(x=>before.lines[x.body]!==after.lines[x.body]).map(x=>x.name);a.deepEqual(changed,['billing']);
const patchName='2026-10-30_meat_production_report.json';fs.copyFileSync(v.tmp+'/mods/'+patchName,R+'/mods/'+patchName);
const planPath=R+'/records/full-client-preparation-20261029/full-client-input-plan.json',planRaw=fs.readFileSync(planPath),plan=JSON.parse(planRaw);a.equal(plan.qspSha256,v.before);fs.writeFileSync(v.backup+'/full-client-input-plan.json.gz',zlib.gzipSync(planRaw),{flag:'wx'});const row=plan.files.find(x=>x.path==='game/jack.qsp');a.equal(row.sha256,v.before);row.sha256=v.after;row.bytes=actual.length;plan.qspSha256=v.after;plan.summary.includedBytes=plan.files.reduce((n,x)=>n+x.bytes,0);fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n');
for(const f of ['report.json','report.md'])fs.copyFileSync(run+'/'+f,v.record+'/release-'+f);
for(const f of ['client-results.json','capture-stderr.log','report-stderr.log'])fs.copyFileSync(p+'/'+f,v.record+'/'+f);
for(const f of ['prepare-fix.cjs','install-fix.cjs','build-fix-probes.cjs','fix-probes.cjs','audit.cjs','fix-inputs.json'])fs.copyFileSync(H+'/'+f,v.record+'/'+f);
fs.writeFileSync(v.record+'/native-results.json',JSON.stringify({reportCases:messages,captured,native},null,2));
fs.writeFileSync(v.record+'/installation.json',JSON.stringify({...v,work,changedLocations:changed,releaseVerdict:report.verdict,productionInstalled:true},null,2));
fs.writeFileSync(v.record+'/REPORT_KO.md',[
'# 음식 생산량 결산 표시 수정 — 2026-10-30','',
'사용자 승인: 안개경계 획득 고기가 결산에서 누락되는 문제 수정. WORK만 반영. 배포 폴더·커밋·푸시 변경 없음.','',
'원인: billing의 생산 팝업 및 육류 구역 표시 조건이 다진육만 검사했다. 안심살·처녀육만 있으면 누적량이 있어도 표시되지 않고 결산 후 초기화됐다. 안개경계 interaction_city=61135는 기존부터 회계 누적량과 냉장고 재고를 모두 증가시켰다.','',
'수정: MEAT_PRODUCTION_REPORT_20261030 블록의 두 조건에 decade_meat와 decade_virgin을 포함했다. 획득량·비용·재고·누적량·초기화 시점은 유지한다. 새 저장 변수나 로케이션이 없으므로 기존 세이브 이관은 필요하지 않다. 이미 결산에서 초기화된 과거 생산 기록은 복원하지 않는다.','',
'검증: 수정 전 현재 엔진에서 단독 안심살/처녀육 및 달걀+안심살 누락을 재현했다. 수정 후 실제 FastQSP에서 5개 표시 사례를 모두 확인했다. 획득 경로는 안심살4 → 재고4·회계4·비용5를 유지했다. 공식 출고 검사 PASS: 구조·줄바꿈·패치 재생·재적용·대표 상태의 엔진 9경로. WORK 최종 파일이 검사 후보와 같은 해시이며 billing 외 모든 로케이션은 동일하다. 기존 입력 세이브는 보존했다.','',
'사용/의존성: billing은 기존 decade_mince/decade_meat/decade_virgin 값을 읽어 $produce_msg를 만든다. 호출 주기·부모 호출·후속 reset은 변경하지 않았다. 이 블록을 이전 내용으로 되돌리면 다진육0일 때 육류 표시 누락이 재발한다. 패치 JSON에 정확한 전후 본문·해시가 있다.','',
'한계: 격리 엔진의 실제 코드 실행·문자열/재고 검증이며 사용자 세이브 UI 버튼 불러오기·결산창의 시각 배치를 직접 클릭 검증한 것은 아니다. 용량 제한에 따른 생산 총량과 실제 보관량 차이는 기존 규칙이다.','',
'백업: '+v.baseline,'검사 후 해시: '+v.after,'배포 입력 목록: '+planPath,''].join('\r\n'));
console.log(JSON.stringify({installed:true,sha256:v.after,changed,release:'PASS',nativeCases:5,captured}));
