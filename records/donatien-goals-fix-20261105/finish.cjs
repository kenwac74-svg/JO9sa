'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const repo = 'G:/somi/JO9sa';
const checks = JSON.parse(fs.readFileSync(path.join(__dirname, 'checks.json')));
const pack = JSON.parse(fs.readFileSync(path.join(__dirname, 'r4-package.json')));
const work = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const tracked = repo + '/assets/runtime/2.4.1/jack.qsp';
assert.equal(sha(fs.readFileSync(work)), checks.after);
assert.equal(sha(fs.readFileSync(tracked)), checks.after);
assert.equal(pack.qspSHA256, checks.after);
for (const [p, h] of [[pack.hotfix, pack.hotfixSHA256], [pack.archive, pack.archiveSHA256]]) assert.equal(sha(fs.readFileSync(p)), h);
const record = repo + '/records/donatien-goals-fix-20261105';
fs.mkdirSync(record, { recursive: true });
for (const name of ['prepare.cjs', 'build-r4.py', 'finish.cjs', 'checks.json', 'r4-package.json']) fs.copyFileSync(path.join(__dirname, name), path.join(record, name));
for (const name of ['probe.cjs', 'results.json']) fs.copyFileSync(path.join(__dirname, '../donatien-goals-audit-20261105', name), path.join(record, 'audit-' + name));
const runtimeManifestPath = repo + '/assets/runtime-source-2.4.1.json';
const manifest = JSON.parse(fs.readFileSync(runtimeManifestPath, 'utf8').replace(/^\uFEFF/, ''));
assert.equal(manifest.sourceQspSha256, checks.before);
const item = manifest.files.find(x => x.runtimePath === 'jack.qsp');
assert(item && item.sha256 === checks.before);
manifest.sourceQspSha256 = checks.after;
item.sha256 = checks.after; item.bytes = checks.bytes;
manifest.latestQspFix = { id: 'DONATIEN_OBJECTIVE_BACK_20261105', record: 'records/donatien-goals-fix-20261105/REPORT_KO.md', patchRevision: '2026-11-05-r4', qspSha256: checks.after };
fs.writeFileSync(runtimeManifestPath, JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(repo + '/assets/runtime/2.4.1/README_KO.md', [
  '# 2.4.1 WORK QSP 스냅샷', '',
  '- `jack.qsp`는 현재 WORK와 차기 배포 패치 r4에 쓰는 동일 바이트의 QSP다.',
  '- SHA-256: `' + checks.after + '`',
  '- 기존 `source/jack_2026-10-01.qsp`와 이미 배포한 ZIP은 비교 기준으로 보존한다.',
  '- 선별 리소스의 위치·해시는 `assets/runtime-source-2.4.1.json`에 기록한다.',
  '- 과거 `mods/`는 변경 이력이며 완성 QSP에 전부 다시 적용하지 않는다.',
  '- 최신 수정: `records/donatien-goals-fix-20261105/REPORT_KO.md`.',
  '- Kor_Full은 사용자 수동 패치 설치 대상으로 이번에 수정하지 않았다.', '',
].join('\n'));
const report = `# 후작 도나시앵 목표 상세 복귀 수정 — 2026-11-05

사용자 승인 후 WORK와 추적 QSP에 반영하고 r4 패치에 포함했다. r3 대비 게임 데이터 변경은 game/jack.qsp 한 개이다. JSON·PNG·Full·사용자 SAV는 수정하지 않았다. 커밋·푸시 없음.

## 변경

- 위치: $quest_list, DONATIEN_OBJECTIVE_BACK_20261105. 본문 한 곳만 변경, 나머지277로케이션 동일.
- 입력: quest_description_mode=1, choosen_quest=5. 출력: 기존 의뢰 설명 뒤에 목표 목록 복귀 링크를 추가한다.
- 링크 선택 시 quest_description_mode=0으로 바꾸고 현재 master_stat 화면을 다시 그린다. 호출자는 master_stat의 목표 탭이며 $curloc와 기존 $quest_list 표시를 사용한다.
- 저장된 $quest_description[5]나 새 영구 변수를 변경하지 않으므로 이미 받은 의뢰에도 적용된다. 다른 목표나 의뢰 보상·진행 조건은 바꾸지 않는다.
- 이 블록을 제거하면 후작 상세에 복귀 링크가 없는 기존 증상이 다시 생긴다.
- 원본·10/01·수정 전 WORK에 같은 결함이 있었음: audit-results.json 및 재현 스크립트 참조.

## 최소 확인

사용자 요청에 따라 전체 엔진·QA·설치 회귀를 반복하지 않았다. 수정 전 조사에서 관련 코드를 WASM으로 재현했고, 이번 변경은 QSP 바이트 왕복·CRLF/주석 경계·한 위치 변경·정확 패치 적용·WORK/추적/ZIP 해시를 확인했다. 실제 게임 EXE·기존 저장 화면 조작은 사용자 확인 대기다.

직접 확인: 거리에서 주인공 → 목표 → 후작 의뢰 → 뒤로. 이미 의뢰를 받은 기존 세이브에서도 목록으로 복귀하는지 확인한다. 집에서도 동일한 링크가 작동해야 한다.

## 산출물

- 전체 r4: ${pack.archive}
- QSP 전용 수정 ZIP: ${pack.hotfix}
- QSP SHA-256: ${checks.after}
- 전체 r4 SHA-256: ${pack.archiveSHA256}
- QSP 전용 ZIP SHA-256: ${pack.hotfixSHA256}

기존 r3와 설치 수정2건을 보존했다. QSP 전용 ZIP은 r3를 이미 적용한 게임에 game/jack.qsp만 덮어쓰는 용도이며 JSON 삭제나 설치 CMD 실행은 필요 없다.
`;
fs.writeFileSync(path.join(record, 'REPORT_KO.md'), report);
fs.writeFileSync(path.join(__dirname, 'REPORT_KO.md'), report);
for (const relative of ['docs/SECOND_PATCH_WORK_BUNDLE_20261021.md', 'docs/SESSION_HANDOFF_INDEX.md']) {
  const p = repo + '/' + relative;
  const before = fs.readFileSync(p, 'utf8');
  if (!before.includes('DONATIEN_OBJECTIVE_BACK_20261105')) fs.appendFileSync(p, '\n\n## 2026-11-05 후작 의뢰 목표 복귀 · r4\n\nDONATIEN_OBJECTIVE_BACK_20261105: [반영 기록](../records/donatien-goals-fix-20261105/REPORT_KO.md). WORK·추적 QSP 한 위치 수정 및 r4 전체/QSP전용 ZIP 제작. 이미 받은 의뢰 세이브에도 복귀 링크 표시. 사용자 요청으로 변경 범위·파일 구조·포장 확인만 수행, 전체 QA·EXE 재실행 없음. Full·JSON·PNG·SAV·기존 ZIP·커밋푸시 무변경.\n');
}
console.log(JSON.stringify({ status: 'WORK_TRACKED_R4_ALIGNED', qspSha256: checks.after, fullZip: pack.archive, hotfixZip: pack.hotfix, record, manualTestPending: true, fullSuiteRerun: false }));
