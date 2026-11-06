'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',record=repo+'/records/independent-qa-r3-20261105';
const get=p=>JSON.parse(fs.readFileSync(p)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const r3=get(here+'/r3-package.json'),dest=path.dirname(r3.archive),resources=get(here+'/package-resources-r3.json'),qsp=get(here+'/qsp/results.json');
const ap=get(here+'/qsp/ap-wasm-results.json'),tax=get(here+'/qsp/wasm-results.json'),trait=get(here+'/qsp/trait-and-parser-wasm-results.json'),iq=get(here+'/installer/FINAL_SUMMARY.json');
assert.equal(hash(fs.readFileSync(r3.archive)),r3.sha256);assert.equal(r3.status,'PASS');assert.equal(resources.status,'PASS');
assert.equal(ap.failed+tax.failed+trait.failed,0);const assertions=ap.total+tax.checks+trait.checks;assert.equal(assertions,634);
assert.equal(iq.candidate.failed,0);assert.equal(iq.candidate.passed,9);assert.equal(iq.gameExecutableLaunched,false);
const data=get(here+'/qsp/data-classification.json');assert.ok(data.allDuplicateGroupsUnchanged);
const preserveCopy=(source,target)=>{fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);assert.equal(hash(fs.readFileSync(source)),hash(fs.readFileSync(target)));};
for(const folder of ['qsp','installer','manual']){
 const walk=(dir)=>{for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())walk(p);else{
  assert.ok(!/\.(qsp|sav)$/i.test(f.name),'Temporary game/state file must not enter QA records');
  assert.ok(fs.statSync(p).size<5*1024*1024,'Review unexpectedly large QA file');
  preserveCopy(p,record+'/'+folder+'/'+path.relative(here+'/'+folder,p));
 }}};walk(here+'/'+folder);
}
for(const f of ['check-package.py','package-resources.initial.json','package-resources-r3.json','data-observations.json','build-r3.py','finish-qa.cjs'])preserveCopy(here+'/'+f,record+'/'+f);
for(const f of ['PLAYTEST_TC_KO.md','PLAYTEST_TC_KO.txt']){
 const text=fs.readFileSync(here+'/manual/'+f,'utf8');assert.ok(text.includes(path.basename(r3.archive)));
 assert.equal((text.match(/결과[:* ]*[_ ]{3,}/g)||[]).length,13);
 assert.ok(fs.existsSync(r3.archive));preserveCopy(here+'/manual/'+f,dest+'/'+f);
}
const report=`# r2 독립 QA 결과 및 r3 수정본 — 2026-11-05

이번 검수는 제작과 분리한 QA 에이전트의 독립 검사와 재현 시험입니다. 외부 업체나 사람에게 유료로 고용을 집행한 기록이 아닙니다.

## 결론

r2 설치 도우미에서 확정 오류2건을 재현하여 r3에 수정했습니다. **새 자동 검사 범위는 통과했고, 실제 게임 EXE·GUI·기존 저장 플레이는 사용자 확인 대기**입니다. 이번 검사에서 게임 EXE/native jack.exe는 실행하지 않았습니다.

| 항목 | 결과 | 확인 범위 |
| --- | --- | --- |
| QSP 정적 검사 | STATIC_PASS | 실제 ZIP의278로케이션 구조·바이트 왕복·CRLF·중복 이름·주석 경계, 미닫힘 따옴표/중괄호0 |
| 오프라인 실제 코드 판정 | 634통과 / 실패0 | 행동력290, 판매세·지급·위탁272, 특성 가격72 |
| 설치 독립 TC | r2 17개 중2실패 | 아래 F01·F02를 각각 재현 |
| 수정 후보 회귀 | 9/9통과 | 정상·반복·같은폴더·권한제한2조건·부분복사실패복원·CMD두모드·실제전체payload |
| 패키지/리소스 TC | 18/18통과 | ZIP전항목CRC/SHA, JSON1158/ID1155, 실제기본전신참조1154, PNG807해독, 호환주소29, 펠리시티규격·구도 계약 |
| 실제 플레이 | 미실행 | 수동 TC13개: P0 6개부터, P1 7개는 조건있을때 |

## 수정한 확정 버그

- **F01 / P1 — 권한 오류 중 JSON 복귀 누락.** PowerShell Move-Item이 old JSON 폴더를 일부 옮긴 뒤 실패하면 상태 플래그가 설정되지 않아 game/json이 빈 채로 남았습니다. 원본 데이터는 rollback 폴더에 남아 있었지만 자동 복귀가 누락됐습니다. 같은 볼륨의 JSON 전환·복원4곳을 원자적인 Directory.Move로 바꿨습니다. 서로 다른 두 ACL fixture에서 기존 JSON/QSP를 보존한 채 안전하게 실패하는 것을 확인했습니다.
- **F02 / P2 — ! 경로 + CMD 지연 확장.** 지연 확장이 켜진 CMD에서 !가 포함된 설치 경로가 잘못 확장되어 설치가 시작되지 않았습니다. CMD 진입 시 DisableDelayedExpansion을 명시하고 /V:ON·OFF 모두 확인했습니다.

수정은 설치 스크립트와 안내·명세에만 있습니다. **QSP·전체JSON·PNG 합계1966개는 r2와 바이트 그대로**입니다. 수정 후보를 실제 전체 payload로 설치해 모든1966파일 SHA와 세이브/INI/XML/save_config 보존을 확인했습니다. 해당 실행은 격리된 가짜 게임 폴더이며 실제 게임 플레이가 아닙니다.

## 경고·검사 한계

- 제한된 다중행 문법 검사기가8로케이션에 플래그를 냈습니다. QSP WASM에서는 고립 END와 중복 ELSE가 허용됐고, 플래그가 포함된 interaction_city 원문도 외부 호출만 stub한6관측에서 오류0이었습니다. 이 경고를 확정 문법 오류로 세지 않았으며 모든 동적 코드와 전체 문법이 증명됐다고도 주장하지 않습니다.
- 9개 JSON의 중복키27그룹·추가출현29회는 Git49458e6과 필드 경로·값·순서가 모두 같습니다. 기존 데이터의 모호성으로 기록하고 이번 패치의 신규 오류나 새 수정으로 합치지 않았습니다. 데이터는 변경하지 않았습니다.
- 0_template의 예시 이미지 누락은 정상 생성 범위에서 제외되는 작성용 템플릿을 검사에 포함한 오탐이었습니다. 실제1154개 플레이 인물의 기본 전신 후보는 출시본+패치 구성에서 존재합니다.
- 같은 f9 QSP의 과거 native9경로·정확 재생/멱등성 PASS는 해시로 대조한 이전 근거입니다. 이번 새 실행으로 합산하지 않았습니다. 저장 UI 로드·CRC 호환·모든 이벤트·전투·화면은 사용자 TC로 인계합니다.

## 사용자가 확인할 파일

- [플레이 확인표](PLAYTEST_TC_KO.md) / [텍스트](PLAYTEST_TC_KO.txt). 결과란13개는 모두 미실행 공란입니다.
- 기존 일반 게임 EXE로 실행하세요. 설치용 CMD와 게임 실행은 구분합니다.
- 가능한 항목부터 PASS/FAIL/N/A를 적고 실패 시 TC번호·SAV·누른 메뉴·기대/실제·캡처를 보내 주세요.

## 최신 수정 패키지

- ${r3.archive.replaceAll('\\','/')}
- SHA-256: ${r3.sha256}
- QSP SHA-256: ${r3.qspSha256}

기존 r2 ZIP·WORK·Full·사용자SAV는 변경하지 않았습니다. 진단QSP·설치fixture는 정리하고 핵심로그·재현스크립트·판정만 남겼습니다.
`;
for(const p of [here+'/QA_RESULT_KO.md',record+'/QA_RESULT_KO.md',dest+'/QA_RESULT_KO.md'])fs.writeFileSync(p,report);
const final={status:'AUTO_SCOPE_PASS_MANUAL_PENDING',fixedInstallerFindings:2,r3Archive:r3.archive,r3Sha256:r3.sha256,
 qspStatic:'STATIC_PASS',offlineAssertions:assertions,offlineFailures:0,candidateInstallerTc:9,packageResourceTc:18,
 gameExecutableRunsThisAudit:0,manualTC:{total:13,P0:6,P1:7,status:'NOT_RUN'},legacyDuplicateKeyGroups:27,
 formalFullDynamicGrammar:'not certified',workFullAndUserSavesChanged:false};
for(const p of [here+'/QA_RESULT.json',record+'/QA_RESULT.json'])fs.writeFileSync(p,JSON.stringify(final,null,2)+'\n');
const append=(p,h,b)=>{const t=fs.readFileSync(p,'utf8');if(!t.includes(h))fs.writeFileSync(p,t+'\n\n'+h+'\n\n'+b+'\n');};
append(repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md','## 2026-11-05 독립 QA·r3 설치 수정','[QA결과](../records/independent-qa-r3-20261105/QA_RESULT_KO.md). r2설치2건(P1권한오류JSON복원/P2 CMD지연확장!경로)재현후r3수정. 오프라인판정634·수정회귀9·패키지18통과. 게임데이터1966바이트동일. 이번게임EXE실행0,일반EXE수동TC13은사용자인계. 최신ZIP은r3/SHA1af000b9… . r2/WORK/Full/SAV보존.');
append(repo+'/docs/SESSION_HANDOFF_INDEX.md','## 2026-11-05 독립QA 완료·r3 최신 ZIP','[검수·수동TC](../records/independent-qa-r3-20261105/QA_RESULT_KO.md). r2의설치2오류를고친r3배포본과13개수동TC를제공했다. 자동검사범위통과/실제EXE플레이대기,기존데이터중복키·문법도구한계는분리기록. 게임QSP/JSON/PNG무변경.');
console.log(JSON.stringify(final));
