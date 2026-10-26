'use strict';
// Archive small reproducible evidence, or record a separately applied exact WORK.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const repo = 'G:/somi/JO9sa';
const tmp = 'G:/Codex/tmp/jo9-disposition-20261023';
const record = repo + '/records/disposition-traits-20261023';
const work = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const before = '26115873b7cfbe72cc35531345fa319cfd759a5704b46bf80378e8fe1da59796';
const after = 'daa953cd391d8268a57724d27b54194e71378dc9ef54ad1e79279cce6897d7db';
const id = '2026-10-23_disposition_traits';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
function copyExact(from, to) {
  fs.mkdirSync(path.dirname(to), {recursive: true});
  if (fs.existsSync(to) && hash(from) !== hash(to)) throw Error('Existing evidence differs: ' + to);
  if (!fs.existsSync(to)) fs.copyFileSync(from, to);
  if (hash(from) !== hash(to)) throw Error('Copy verification: ' + to);
}
function checks() {
  const release = json('G:/Codex/tmp/jo9-disposition-release-final-20261023/run-ETmAIx/report.json');
  if (release.checks.some(c => c.required && c.status !== 'PASS')) throw Error('Release gate failed');
  if (release.checks[0].detail.candidate !== after) throw Error('Release candidate hash mismatch');
  const generation = json(tmp + '/generation-final/client-results.json');
  const acquisition = json(tmp + '/green-verified/client-results.json');
  if (generation.length !== 1 || !generation.every(x => x.pass)) throw Error('Generation not PASS');
  if (acquisition.length !== 4 || !acquisition.every(x => x.pass)) throw Error('Acquisition not PASS');
  if (json(tmp + '/green-verified/prepared.json').sourceSha256 !== after) throw Error('Acquisition source mismatch');
  return {release, generation, acquisition};
}
const mode = process.argv[2];
if (mode === 'guard') {
  checks();
  if (hash(work) !== before) throw Error('WORK changed since baseline; rebase required');
  console.log('PASS live WORK still equals pinned baseline');
} else if (mode === 'archive') {
  checks();
  const pairs = [
    ['G:/Codex/tmp/jo9-disposition-release-final-20261023/run-ETmAIx/report.json', 'release-validation.json'],
    ['G:/Codex/tmp/jo9-disposition-release-final-20261023/run-ETmAIx/report.md', 'release-validation.md'],
    ['G:/Codex/tmp/jo9-disposition-release-20261023/run-LxQ06l/report.json', 'release-initial-version-notice.json'],
  ];
  for (const dir of ['red-generation', 'generation-final', 'green-verified']) {
    for (const file of fs.readdirSync(tmp + '/' + dir)) {
      if (file === 'prepared.json' || file === 'client-results.json' || /-(stderr|stdout)\.log$/.test(file)) {
        pairs.push([tmp + '/' + dir + '/' + file, dir + '/' + file]);
      }
    }
  }
  for (const [from, to] of pairs) copyExact(from, record + '/' + to);
  for (const file of ['build.cjs', 'check-generation.cjs', 'check-acquisition.cjs', 'finalize.cjs']) {
    copyExact(path.join(__dirname, file), record + '/scripts/' + file);
  }
  copyExact(tmp + '/mods/' + id + '.json', repo + '/mods/' + id + '.json');
  writeJson(record + '/independent-review.json', {
    candidateSha256: after, result: 'PASS', reviewer: '/root/disposition_final_review',
    findingsResolved: ['Expert-search final ego adjustment now revalidates eligibility', 'Clone pride override now clears the trait'],
    finalGuardPass: true,
    testFixtureNote: 'Original combined preservation assertion timed out. Each identical indexed comparison now has its own native assertion; baseline fails as intended and final candidate passes all checks. Engine-internal cause was not established.',
    limits: ['Independent source review and native evidence; no GUI appearance or full saved-script restoration claim'],
  });
  console.log('PASS small evidence, scripts and exact declarative mod archived');
} else if (mode === 'record') {
  const verified = checks();
  if (hash(work) !== after) throw Error('WORK does not match tested candidate');
  const inputs = json(record + '/input-preservation.json');
  const comparisons = inputs.map(x => ({file: x.file, expected: path.resolve(x.file) === path.resolve(work) ? after : x.hash, actual: hash(x.file)}));
  if (comparisons.some(x => x.expected !== x.actual)) throw Error('Preserved input changed');
  writeJson(record + '/input-preservation-after.json', comparisons);
  const manual = `# 노예근성·거센 반항심 조정 — WORK 적용 기록

2026-10-23 사용자 승인 범위. 패치 ID: ${id}.

## 실제 동작

- 새 무작위 인물의 거센 반항심은 2%. 노예근성은 자아가 단호함 미만(ego<4), 태도가 건방짐 미만(pride<4)일 때 10%이며 두 특성은 중복되지 않는다. 제외 조건에 걸리면 노예근성 0%이고 남는 확률을 재추첨하지 않는다.
- 노예근성 인물은 영입할 때 기본 복종훈련이 끝난 실제 복종중 상태로 초기화된다. 일·교육·판매의 개별 기술/체력/고객 조건은 원래대로다. 새로운 직업 기술이나 체력 상승 효과가 아니다.
- 고정 인물과 기존 세이브 인물에게 새 특성을 자동 추첨하지 않는다. 기존 거센 반항심 보유자를 제거하지 않는다. 노예근성 초기화가 끝난 인물도 이후 정상 플레이로 상태가 바뀔 수 있다.
- 특성 목록·설명·기존 특성 편집기에 노예근성을 추가했다. 편집기에서도 자아/태도 제한과 반대 특성의 배타성을 검사한다. 특성을 제거해도 이전에 얻은 훈련치를 되돌리지 않는다.

## 입력·출력·의존성과 저장 영향

- jo9_traits의 generate 입력은 stock 배열이다. 하나의 rand(1,100)에서 1~2는 defiant, 3~12는 조건부 jo9_slave_nature다. 함수 반환값 대신 배열 키를 기록한다.
- 새 키 jo9_slave_nature와 jo9_slave_nature_initialized는 해당 인물 배열에 저장된다. 누락 키는 기존 QSP 규칙에 따라 0이다. 기존 ID·세이브 형식·보류된 혀 손실 특성은 변경하지 않았다.
- init_slave_nature 입력은 대상 배열명이다. flag=1이고 initialized=0일 때만 실행하고 재실행은 값을 바꾸지 않는다. 제외 조건이 발견되면 특성만 해제한다.
- 유효 인물은 rational=5, custom 최소3, moral 최소1로 시작한다. 기본 fear/angst/spoil/arousal 및 관련 누적값을 정리한다. 최저 정신 합계가3 미만이면 ego만 합계3까지 보정하여 원래 정신붕괴 판정에 빠지지 않게 한다.
- 원래 recalc_slave_mood로 정상 기분이 될 때까지 일회성 mood 누적치를 조정한다(최대200회). 기존 broken 캐시로 인한 반복을 막기 위해 재계산 직전 psy_status를 reluctant로 둔다. 원래 $slave_price의 obedience>=5 판정에 도달하도록 필요한 만큼만 custom<=5, instinct<=5, moral<=3으로 올린다. 마지막으로 원래 $newloc_update_slave를 두 번 실행해 최종 상태와 다음 재계산을 확인한다.
- 의존성: $recalc_slave_mood, $slave_price, $newloc_update_slave, 기존 배열 교환 코드. 자체 별도 QSP location이나 영구 유지용 매일 보정은 없다. 가격식을 교체하지 않았으며 기존 가격 계산에 들어가는 복종 관련 수치만 이 특성의 영입 초기화에 따라 달라진다.

## 호출 위치·부분 제거 시 영향

총7 location,14개 정확 대체 블록이다. 위치별 JO9 MOD START/END와 패치 ID로 찾을 수 있다.

- jo9_traits: 생성·설명·목록·편집기·일회 초기화.
- get_stock_seed, get_special_assistant_quest: 신규 키 기본값0.
- stock_to_slave_nogt, expert_to_slave: 배열 교환 직후 새 노예를 초기화한다. 이 연결만 빼면 특성 이름만 있고 즉시 복종이 되지 않는다.
- $expert_search: 검색 후 자아가 상승하는 최종 결과를 재검사한다. generate_clone: 원래 태도4 지정 이후 특성을 제거한다. 이를 따로 빼면 최종 능력치와 등장 조건이 충돌할 수 있다.
- 생성만 제거하면 신규 추첨은 사라지지만 저장된 특성과 그 초기화/표시는 남는다. 목록·설명만 제거하면 효과가 숨는다. 통째 복구 시 기존 개인 세이브를 덮어쓰지 말고, 재현 패치와 현재 WORK 차이를 먼저 확인해야 한다.

## 검증과 한계

- 생성 확률: 실제 엔진에서 자아/태도0~5의36조합 × 추첨값1~100 및 잔류 stock 검사, 총3,601회 통과. 실제 생성 분기의 해당 RAND 하나만 진단용으로 고정했다.
- 실제 영입 코드24사례(2경로 × 난이도3 × 기본/최악/정신합계0/고정기본 broken), 제외·재실행·기존값 보존8사례, 목록·편집기10검사 통과. 영입·특성 location은 진단 사본에서도 원본 그대로이며 Start만 검사로 교체했다.
- 공식 출고 검사: 구조263 location, 왕복 바이트/줄·주석 경계, 정확 패치 재생·멱등성, JSON1,126개 등록 충돌0, 실제 클라이언트9경로 PASS.
- 최초 구버전 UI_TEST_MENU 상태에서는 정상 버전 안내창 때문에 신규게임 완료 마커 검사가 실패했다. 게임 코드를 우회하지 않고 현재2.4의 기존24TEST 상태를 사용한 최종 검사9경로가 통과했다.
- 긴 결합 비교문을 쓰던 보존 검사 한 건이 진단에서 시간 초과했다. 동일한 각 항목을 개별 assert로 분리한 뒤 기존본 RED 실패와 최종본 GREEN 통과를 확인했다. 엔진 내부 원인은 단정하지 않는다.
- 기존 save57개와 Full QSP 해시 보존. 세이브 데이터를 읽어 초기 상태를 재현했으며 실제 GUI 세이브 로드/저장 스크립트 전체 복원, 화면 배치, 모든 게임 분기는 검증한 것이 아니다. 설명 팝업은 구조 검사 대상이며 직접 화면 확인은 하지 않았다.

## 반영 범위·재현

- WORK/game/jack.qsp만 반영. Full·배포ZIP·세이브·이미지·JSON·CSS·커밋·푸시 변경 없음. 다음 패치 작업묶음에 적용 완료·미배포로 기록했다.
- 이전 SHA256: ${before}
- 적용 SHA256: ${after}
- 최소 복구본: G:/somi/JO9_work_backups/disposition_traits_20261023/before.qsp.
- mods/${id}.json과 scripts/build.cjs, check-generation.cjs, check-acquisition.cjs를 보존했다. 후보 제작 스크립트는 복구본 해시를 고정하며 WORK를 직접 수정하지 않는다. 실제 적용은 기존 tools/apply_mods.ps1로 이번 패치 파일 하나만 지정했다.
- 진단 QSP·복제 JSON·중복 빌드는 결과 보존 후 정리한다. 경제 가격·소문·행동력 곡선·체질개선 등 별도 논의 항목은 이 작업에 구현하지 않았다.
`;
  fs.writeFileSync(record + '/MANUAL_KO.md', manual);
  fs.writeFileSync(repo + '/docs/DISPOSITION_TRAITS_20261023.md', '# 노예근성·거센 반항심 조정\n\nWORK 적용 완료·미배포. 거센 반항심2%, 노예근성 조건부10%(ego<4 및 pride<4), 획득 즉시 기본 복종. 기존 인물 자동 재추첨 없음.\n\n[동작·저장 영향·검증·복구](../records/disposition-traits-20261023/MANUAL_KO.md), [결과](../records/disposition-traits-20261023/FINAL_RESULT.json), [재현 패치](../mods/' + id + '.json).\n');
  const bundle = repo + '/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';
  const heading = '## WORK 수정 완료 — 노예근성 추가·거센 반항심 확률 조정 (DISPOSITION_TRAITS_20261023)';
  let bundleText = fs.readFileSync(bundle, 'utf8');
  if (!bundleText.includes(heading)) {
    bundleText += '\n\n' + heading + '\n\n- 사용자 승인 후 WORK 반영 완료·미배포. 거센 반항심은2%, 노예근성은 자아 단호함 미만·태도 건방짐 미만 신규 무작위 인물에10%. 중복되지 않으며 노예근성은 영입 즉시 기본 복종 상태다.\n- 기존 인물/고정 프리셋 자동 재추첨·세이브 이관 없음. 특성 목록·설명·기존 편집기 연결, 최종 생성 조건 재검사와 영입 초기화 포함.\n- 생성3,601회, 실제 영입24/보존 경계8/UI10검사 및 공식 실제 엔진9경로·구조·줄/주석 경계·정확 재생/멱등성 PASS. 기존 세이브57개·Full QSP 해시 보존. GUI 로드와 전수 플레이는 별도.\n- Full·배포 ZIP·커밋·푸시 미변경. [동작 및 검증](../records/disposition-traits-20261023/MANUAL_KO.md), [결과](../records/disposition-traits-20261023/FINAL_RESULT.json).\n';
    fs.writeFileSync(bundle, bundleText);
  }
  writeJson(record + '/FINAL_RESULT.json', {
    id, recordedAt: new Date().toISOString(), status: 'APPLIED_WORK_ONLY_UNRELEASED', work,
    beforeSha256: before, afterSha256: after,
    generation: {defiantPercent: 2, eligibleSlaveNaturePercent: 10, excludedSlaveNaturePercent: 0, egoExclusiveMax: 4, prideExclusiveMax: 4, mutuallyExclusive: true, callsPassed: 3601},
    native: {acquisitionCases: 24, guardCases: 8, uiCases: 10, releasePaths: 9, pass: true},
    preserved: {saveFiles: inputs.filter(x => /\.sav$/i.test(x.file)).length, fullQsp: true, existingActorsNoReroll: true},
    changedLocations: json(record + '/candidate-summary.json').changed,
    releaseStatus: verified.release.checks.filter(c => c.required).map(c => ({name: c.name, status: c.status})),
    exclusions: ['Full sync', 'packaging', 'commit', 'push', 'economy and rumor design', 'AP curve and constitution-improvement design'],
    limitations: verified.release.limits,
  });
  console.log('PASS WORK exact candidate, saves/Full unchanged; documentation and next-patch bundle recorded');
} else throw Error('Use guard, archive, or record');
