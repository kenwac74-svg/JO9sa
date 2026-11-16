'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),R='G:/somi/JO9sa',D=R+'/records/hotfix-cumulative-20261115',T='G:/Codex/tmp/hotfix-cumulative-20261115',c=require(R+'/tools/text-workshop/core.cjs');
const result=JSON.parse(fs.readFileSync(D+'/package-result.json','utf8')),prepared=JSON.parse(fs.readFileSync(D+'/prepared.json','utf8'));a.equal(result.gameGate,'PASS');a(result.sameOverlayInFullAndPatch);a.equal(result['22RestoredTextAssignmentsExcluded'],12);
const gateRoot=T+'-gate';for(let dir of fs.readdirSync(gateRoot)){let f=gateRoot+'/'+dir+'/report.json';if(!fs.existsSync(f))continue;let report=JSON.parse(fs.readFileSync(f,'utf8'));let tag=report.verdict==='PASS'?'release-gate':'attempt-'+dir;for(let ext of ['json','md'])if(fs.existsSync(gateRoot+'/'+dir+'/report.'+ext))fs.copyFileSync(gateRoot+'/'+dir+'/report.'+ext,D+'/'+tag+'.'+ext);if(report.verdict==='PASS'){fs.copyFileSync(gateRoot+'/'+dir+'/client/client-results.json',D+'/release-client-results.json');for(let name of fs.readdirSync(gateRoot+'/'+dir+'/client'))if(name.endsWith('-stderr.log'))fs.copyFileSync(gateRoot+'/'+dir+'/client/'+name,D+'/release-'+name);}}
fs.copyFileSync(T+'/state-probe/client-results.json',D+'/state-client-results.json');
const report=`# 2.4.2 배포 — 2026-11-15

사용자 최신 지시에 따라 새 풀버전과 이전 2.4.2용 변경분 패치를 만들었다. 앞선 긴급패치 r1~r3 및 이후 승인 수정을 포함한다. 2.4.1용 옛 리소스를 다시 담는 패치는 아니다. 패치를 이전 2.4.2에 합친 게임 파일과 새 풀버전의 수정 파일은 동일하다.

- 풀버전: ${result.full.path}
- 크기: ${result.full.bytes} bytes / SHA-256 ${result.full.sha256}
- 변경분 패치: ${result.updateOnly.path}
- 크기: ${result.updateOnly.bytes} bytes / SHA-256 ${result.updateOnly.sha256}
- 배포 QSP SHA-256: ${result.sharedQspSha256}
- WORK QSP SHA-256: ${prepared.workQspSha256}

## 포함·제외

변경분 게임 파일 742개: 모브 728개 추가 JSON + 아프리카 프리셋 JSON 1개, 이미지 11개(춘향 초상 3개·아프리카 이미지 8개), CSS 1개, QSP 1개. 안내와 원장은 별도 동봉한다. 현재 WORK를 최초/r2 배포 원장과 대조하고 이전 긴급패치 필수 경로를 포함했다. 같은 본편에 이미 있는 호환 이미지 23개는 변경분에서 다시 넣지 않았으며 새 풀버전과 본편+패치 설치 결과의 보존을 확인했다.

기능: 개인실 업무/등뒤무기/툴팁, 안개 BGM 경로·음량, 춘향 테두리, 파리드 복원, 죄수 처형 CM, 모브 728종, 마법력별 하드모드 속성 공개/10일 누적, 닭 표기, 계란·우유 혼합 정산, 암시장 이름·출신·직업·일부 속성/특성 추첨. 이전 자동 세이브 보정도 유지한다.

2.2 복원 문구 12개만 배포 후보에서 기존 2.4 문구로 돌렸다. 정신상태 분기 수정은 유지했고 그 외 WORK 코드와의 역적용 바이트가 일치한다. 성적보상 18종 복원은 미적용이다. WORK와 추적 소스는 이 포장 작업에서 변경하지 않았다.

개인 세이브·모드 제작 도구·로컬 그림 작업 설정·설치기는 제외했다. WORK의 로컬 창제목 2.4.1 설정은 복사하지 않고 검증된 기존 풀버전의 2.4.2 설정을 유지했다. 최초 본편의 이미 퇴역한 미사용 복제 그림 1개는 덮어쓰기 설치의 비삭제 원칙에 따라 기존 리소스를 유지한다. 음원은 새 풀버전의 기존 리소스로만 들어가며 변경분에는 없다.

## 공유 검증과 포장 확인

공식 출고 검사 PASS: 구조/CRLF/등록부 1885개/패치 재생·멱등/배포 대조와 실제 엔진 9경로를 한 번 통과한 QSP를 두 배포물에 공유했다. 문구 제외 후 정신상태 5종×후보수 3종의 15조합도 한 번 확인했다. 패키지별 게임 기능 검사를 반복하지 않았다.

초기 검사 입력 bds에는 필요한 두 역할이 없어 거절되었다. 다음 입력의 2.4.0 버전 알림도 정상 알림이므로 오류로 고치지 않았다. 최종은 kura01_242의 격리 사본에서 GAME_VER 표시 문자열만 현재 버전으로 맞추어 정상 알림을 확인한 뒤의 상태를 사용했다. 나머지 저장값과 원본의 바이트는 보존했다. 실제 GUI 세이브 불러오기와 시청각/전체 게임 분기는 이번에 재검사하지 않았다.

두 ZIP의 모든 항목 CRC·SHA-256·안전 경로·중복 경로 검사를 포장 단계에서 한 번 수행했다. 새 풀버전 원본 입력은 기존 r2 원장과 스트리밍 대조했고, 변경 파일은 변경분과 완전히 같다. 기존 ZIP/Full/개인 SAV를 덮지 않았다. 업로드·커밋·푸시하지 않았다.

## 이후 기준

[패치 업데이트·검사 재사용 절차](../../docs/PATCH_UPDATE_PROCESS_KO.md)를 사용자 지시대로 만들고 AGENTS·출고·포장 지침에 연결했다. 수정 위험에 필요한 검사만 한 번 하고 동일 해시는 재사용한다. 화면/툴팁 육안, 청음, 게시/업로드처럼 사용자가 더 빠른 작업은 먼저 제안한다.
`;
fs.writeFileSync(D+'/REPORT_KO.md',report);let index=R+'/docs/SESSION_HANDOFF_INDEX.md',s=fs.readFileSync(index,'utf8');fs.writeFileSync(index,`## 2026-11-15 2.4.2 새 풀버전·변경분 패치 및 검사 재사용 기준

[배포·검증 기록](../records/hotfix-cumulative-20261115/REPORT_KO.md). 최신 수정 포함, 2.2 복원문 12개 배포 제외·정신상태 분기 유지. 공식 9경로 PASS를 풀버전/패치에 공유하고 포장 CRC/SHA만 확인. 사용자 최신 지시로 [검사 최소화·직접 확인 제안 절차](PATCH_UPDATE_PROCESS_KO.md)를 공식화. WORK/기존 Full/개인 SAV/음원 원본/커밋·푸시·업로드 미변경.

`+s);
let scope=R+'/docs/release-prep/2026-11-15/HOTFIX_SCOPE_KO.md';fs.appendFileSync(scope,'\n## 배포 완료 — 2026-11-15\n\n[새 풀버전 및 변경분 패치](../../../records/hotfix-cumulative-20261115/REPORT_KO.md). 복원문구 12개는 배포 QSP '+result.sharedQspSha256+'에서 실제 제외했다. WORK에는 기존 복원문이 보존되므로 다음 배포도 distribution-exclusion-mod.json 또는 해당 범위를 대조해야 한다. 정신상태 분기·다른 최신 수정은 유지한다. 같은 수정본의 포장별 게임 재검사는 하지 않았다.\n');
let p=D+'/PLAN_KO.md';s=fs.readFileSync(p,'utf8').replaceAll('- [ ]','- [x]');s+='\n최종 사용자 지시: 새 풀버전과 이전 2.4.2에 덮는 변경분 ZIP의 두 형태. 기존 2.4.2 긴급 수정은 모두 포함한다. 검증된 동일 수정본을 공유하므로 포장별 게임 검사를 반복하지 않았다.\n';fs.writeFileSync(p,s);fs.copyFileSync(p,R+'/docs/superpowers/plans/2026-11-15-hotfix-cumulative.md');
console.log(JSON.stringify({fullBytes:result.full.bytes,patchBytes:result.updateOnly.bytes,fullFiles:result.full.files,patchFiles:result.updateOnly.files,gate:result.gameGate,repeatedGameTests:false}));
