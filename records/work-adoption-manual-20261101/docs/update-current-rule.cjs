'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const target = 'G:/somi/JO9sa/records/colosseum-sparring-fate-20261031/MANUAL_KO.md';
const expectedBeforeSha256 = '9af1c08d5f5badefc3d2366f91db4dba3fd0c26a0fd4314b7314d702bb659324';
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const before = fs.readFileSync(target);
const beforeText = before.toString('utf8');
const heading = '# 콜로세움 연습경기 처형 차단과 대사 각색\n\n';
const inserted = '> **현재 규칙 — 2026-11-01 갱신:** 콜로세움 연습 종료의 성향 변화는 0이다. 콜로세움 정식 경기·캣파이트에서 플레이어가 정하는 상대 처형/생존은 각각 −1/+1이며, 안개 전투의 강제 처형은 0이다. 최신 승인 규칙과 구현 설명은 [cruel / mercy 지정 행동 누적](../cruel-mercy-rules-20261101/REPORT_KO.md)을 따른다. 아래 `jo9_cruel_mercy+1` 설명과 검사 결과는 2026-10-31 적용 당시의 이력으로 보존하며, 현재 연습 성향 규칙은 이 갱신 안내가 우선한다.\n\n';
if (!beforeText.startsWith(heading)) throw new Error('Document heading/line ending drift');
if (hash(before) !== expectedBeforeSha256) throw new Error('Document changed before patch; reread required');
const after = Buffer.from(heading + inserted + beforeText.slice(heading.length), 'utf8');
const textPatch = {
  id: 'R-DOC_PRACTICE_CURRENT_RULE_20261101',
  target,
  field: 'text',
  before_sha256: hash(before),
  after_sha256: hash(after),
  edits: [{ old: heading, new: heading + inserted, count: 1 }],
  historicalRemainderByteIdentical: after.subarray(Buffer.byteLength(heading + inserted, 'utf8')).equals(before.subarray(Buffer.byteLength(heading, 'utf8'))),
  source: [
    'G:/somi/JO9sa/records/cruel-mercy-rules-20261101/REPORT_KO.md',
    'G:/somi/JO9sa/records/qa-bounty-241-20261101/game/REPORT_KO.md',
  ],
  activeWorkspaceCopySearch: {
    root: 'C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output',
    relativeMatch: 'colosseum-sparring-fate-20261031/MANUAL_KO.md',
    found: [],
  },
  scope: 'Current-rule note only. Preserve complete 2026-10-31 historical description and all native results. No QSP, Full, runtime or test changes.',
};
fs.writeFileSync(path.join(__dirname, 'R-DOC-text-patch.json'), JSON.stringify(textPatch, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(__dirname, 'R-DOC.diff'), [
  '--- G:/somi/JO9sa/records/colosseum-sparring-fate-20261031/MANUAL_KO.md',
  '+++ G:/somi/JO9sa/records/colosseum-sparring-fate-20261031/MANUAL_KO.md',
  '@@ -1,3 +1,5 @@',
  ' # 콜로세움 연습경기 처형 차단과 대사 각색',
  ' ',
  '+' + inserted.trimEnd(),
  '+',
  ' 사용자 지시: 연습경기에서는 처형을 비활성화하고, 짧은 안내문이 아닌 게임 서술에 맞게 승패 대사를 각색한다. 최신 사용자 대사편집기 최종 저장본554e3570…를 기준으로 WORK와 현재 Full 테스트 빌드에 같은11개 수정만 적용했다. jo9_battle_fate와 interaction_city 두 로케이션 외에는 바이트 단위로 유지했다.',
  '',
].join('\n'), 'utf8');
if (process.argv.includes('--apply')) {
  fs.writeFileSync(target, after);
  const installed = fs.readFileSync(target);
  if (!installed.equals(after)) throw new Error('Written document mismatch');
  const report = {
    id: textPatch.id,
    recordedAt: new Date().toISOString(),
    modifiedFiles: [target],
    before_sha256: textPatch.before_sha256,
    after_sha256: hash(installed),
    insertedCurrentRuleNotes: 1,
    originalHistoricalRemainderByteIdentical: textPatch.historicalRemainderByteIdentical,
    linkTargetExists: fs.existsSync(path.resolve(path.dirname(target), '../cruel-mercy-rules-20261101/REPORT_KO.md')),
    activeWorkspaceCopiesFound: 0,
    QspWrites: 0,
    FullWrites: 0,
    enginesRun: 0,
    manualTestsRun: 0,
  };
  fs.writeFileSync(path.join(__dirname, 'R-DOC-installed.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(JSON.stringify({ prepared: true, ...textPatch }, null, 2));
}
