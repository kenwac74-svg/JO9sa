'use strict';
const fs=require('fs'),assert=require('assert/strict'),zlib=require('zlib'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const read=n=>JSON.parse(fs.readFileSync(__dirname+'/'+n+'.json','utf8')),m=read('snapshot'),b=read('build-report'),red=read('red-report'),green=read('green-report'),generation=read('green-generation-report'),official=read('official-report');
assert(red.reproduced);assert(green.pass);assert(generation.pass);assert.equal(official.verdict,'PASS');assert.equal(official.client.probes.length,9);assert(official.client.probes.every(x=>x.pass));
const baseline=fs.readFileSync(m.baseline),candidate=fs.readFileSync(m.candidate),live=fs.readFileSync(m.workPath);assert.equal(c.hash(baseline),m.sourceSha256);assert.equal(c.hash(live),m.sourceSha256);assert.equal(c.hash(candidate),b.candidateSha256);assert.equal(c.hash(zlib.gunzipSync(fs.readFileSync(__dirname+'/baseline.qsp.gz'))),m.sourceSha256);assert.equal(c.hash(zlib.gunzipSync(fs.readFileSync(__dirname+'/candidate.qsp.gz'))),b.candidateSha256);assert.equal(c.hash(fs.readFileSync(m.publicFixture.source)),m.publicFixture.sourceSha256);
const result={status:'PASS',checkedAt:new Date().toISOString(),baselineSha256:m.sourceSha256,candidateSha256:b.candidateSha256,currentWorkStillBaseline:true,publicFixtureSourceUnchanged:true,recoveryGzipVerified:true,functionalCases:green.completedCase-1+generation.completedCase-1,functionalAssertions:green.checks+generation.checks,functionalFailures:green.failures+generation.failures,redFailures:red.failures,officialVerdict:official.verdict,officialNativePaths:9,productionWritten:false};fs.writeFileSync(__dirname+'/final-verification.json',JSON.stringify(result,null,2)+'\n');
const text=`# 하드코어 공개경매 후보 검증

상태: 격리 후보 PASS. 이 담당자는 WORK·Kor_Full·추적 소스에 쓰지 않았다. 설치는 부모 담당자의 최신 WORK 해시 재검사 뒤 별도 적용 단계다. ZIP·커밋·푸시는 하지 않았다.

## 입력과 산출물

- 최신 WORK 기준 SHA-256: \`${m.sourceSha256}\`
- 후보 SHA-256: \`${b.candidateSha256}\`
- 후보: \`${m.candidate}\`
- 패치: \`00_credits_crlf.json\` → \`01_hardcore_auction.json\` 순서. 실제 apply_mods 재생과 재적용이 후보와 바이트 동일하다.
- 기준·후보 압축 복구본은 \`baseline.qsp.gz\`, \`candidate.qsp.gz\`. 해제한 바이트의 SHA를 각각 확인했다.
- 시작 지시의 86ee16ad 기준과 현재 저장 WORK의 차이는 main_screen, city_screen, slave_private_room1~4의 6개 body다. 새 db4e 기준을 사용하여 그 변경을 모두 보존했다.

## 구현 범위

277개 로케이션 이름·순서·기본 행동을 유지했다. 바뀐 body는 $guild_auction, interaction_city, interaction_screen_city, credits 4개뿐이다. credits는 검토된 단독 LF 한 곳을 CRLF로 바꿨으며 원문 글자는 그대로다. 다른 273개 body와 모든 나머지 필드는 바이트 그대로다.

공개경매의 총액 bank_size와 프리미엄 계산을 유지하고, 정산 시점 difficulty_setting=2이며 sparks_get>6000인 경우만 sparks_get을6000으로 정한다. copyarr로 복사된 기존 마지막 경매 페이지에 확정 세금 문구를 한 번 붙인 뒤 기존 지급문을 실행한다. 후속 제안의 페이지·행동 인덱스는 그대로다. 화면의 옛 공개경매 $6000 안내는 제거했다. 신규 영구 변수·helper·로케이션은 없다. 상인·개인 고객·고정 의뢰·파산 정산 body는 바꾸지 않았다.

파일에 잔존하는 두 성별 정산 블록의 지급 부분은 동일하다. 삭제된 여주인 콘텐츠의 대사·접근 경로를 번역하거나 복구하지 않았다. 실제 기능 검증은 hero_choice=1만 사용했다.

## 실제 FastQSP 결과

| 검사 | 결과 |
|---|---|
| 현행 red: 설정0/1/2 × 금액5999/6000/6001/12000 × 후속제안 유무 | 24조합·528 assertion. 기대대로 ${red.failures}실패로 기존 지급 부족·세금 문구 누락 재현 |
| 후보 green: 같은 금액·설정·후속 조합 | 24조합·528 assertion·0실패 |
| 실제 경매 생성·평가·프리미엄 및 생성 후 설정 전환 | 15조합·105 assertion·0실패 |
| 공식 release-check | PASS. 실제 엔진9경로, 구조·줄바꿈·주석경계·JSON registry·패치 재생·멱등성·입력 SHA 보존 통과 |

경계 검사는 실제 interaction_city → interaction_result_city → interaction_screen_city를 유지했다. 배열 길이, 마지막 경매 페이지의 정확 문구 개수, 앞 페이지에 문구 없음, purse 사운드의 페이지 인덱스와 소비, 후속 안젤리카 페이지·행동 인덱스, 낙찰 배열 보존, 역할 비우기를 검사했다. 실제 최종 화면을 두 번 표시한 뒤 잔액·문구·배열 길이 불변을 확인했다. 화면 body를 빈 stub으로 바꾸지 않았다.

생성 검사는 실제 평가·premium helper·낙찰 문구·정산 코드를 유지하고 reserve=12000/입찰자 없음만 진단 입력으로 주입했다. 일반12000, 희귀 특성24000, 절세24000, 희귀+절세+다재다능45000의 낙찰총액을 확인했다. 설정0/1은 그 전액, 설정2는6000을 지급했다. 생성0→정산2는6000, 생성2→정산0/1은45000으로 정산 시점 설정을 적용했다. game_difficulty에는 다른 값을 주어 캐릭터 생성 난이도와 혼동하지 않는 것도 확인했다.

공식 검사 출력을 후보 입력 폴더 아래에 둔 첫 시도는 검사기의 경로 방어로 실행 전 중단됐다. 출력만 별도 형제 임시 폴더로 바꾼 최종 실행이 PASS다. 후보 내용은 그 과정에서 바뀌지 않았다.

## 보존·한계·잔여 작업

공개 TC fixture를 복사하여 GAME_VER만 현행 버전으로 맞춘 진단 상태를 사용했다. 개인 세이브를 읽거나 불러오거나 저장하지 않았다. 숨김 프로세스는 기존 QA 실행기가 만든 PID만 종료한다. 입력 WORK와 공개 fixture의 검사 전후 SHA는 같다.

GUI 개인 세이브 불러오기, CRC 호환, 모든 저장 스크립트 복원, 화면의 육안 배치와 실제 수동 플레이는 미검증이다. 이미 지급 완료된 옛 세이브의 금액을 소급 복원하지 않는다. Kor_Full mirror 검사는 배포 보류 범위라 수행하지 않았다. 이 PASS는 전체 동적 QSP 문법·모든 분기·게임 밸런스의 증명이 아니다.

부모 담당자의 검토/설치에 필요한 후보와 기준/패치는 임시 폴더에 남겼다. 진단 QSP·공식 검사 복제 JSON은 재생성 가능한 임시자료이며, \`cleanup.cjs\`를 먼저 plan 모드로 확인하고 승인된 단계에서 clean 모드로 정리할 수 있다. 정션 대상에는 내려가지 않고 개인/공개 원본·세이브·압축 복구본·설정·보고서는 삭제하지 않는다.
`;
fs.writeFileSync(__dirname+'/REPORT_KO.md',text);console.log(JSON.stringify(result,null,2));
