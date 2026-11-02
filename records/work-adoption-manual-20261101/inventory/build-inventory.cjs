'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const repo = 'G:/somi/JO9sa';
const work = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const full = 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const qa = `${repo}/records/qa-bounty-241-20261101`;
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const json = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const qsp = core.parse(fs.readFileSync(`${work}/jack.qsp`));
const body = n => core.shift(qsp.lines[qsp.locations.find(x => x.name === n).body], 5);
const evidence = (file, needle) => {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const ix = lines.findIndex(line => line.includes(needle));
  if (ix < 0) throw new Error(`Missing evidence: ${file}: ${needle}`);
  return { path: file, line: ix + 1, excerpt: lines[ix] };
};
const proposal = json(`${qa}/conditions/fix-proposal.json`);
const native = json(`${qa}/toggle-fix-native-report.json`);
const adoption = json(`${repo}/records/isabella-tavern-adoption-20261101/asset-change.json`);
const deferred = json(`${repo}/records/deferred-discussions-20261024/index.json`);
const edit = proposal.edits[0];
const pendingOldCount = body(edit.location).split(edit.old).length - 1;
const pendingNewCount = body(edit.location).split(edit.new).length - 1;
if (pendingOldCount !== 1 || pendingNewCount !== 0) throw new Error('Inventory baseline drift: mode3 proposal changed or applied');
const currentCatfightFix = "if $итог_боя = 'бегство' or $итог_боя = 'вырубился' or $итог_боя = 'убит':";
if (!body('выход_из_боя').includes(currentCatfightFix)) throw new Error('Historical catfight fix is absent');
const adoptedAssetHash = sha(adoption.target);
if (adoptedAssetHash !== adoption.after.sha256) throw new Error('Isabella adoption asset drift');
const items = [
  {
    id: 'Q241-CUT-003', status: 'ready_to_adopt', kind: 'production_code', priority: 'P2',
    title: '조건 컷 수동 전환의 mode3 검증 한 호출',
    scope: 'WORK jack.qsp interior_change 한 호출 + 추적 mods/기록. 새 변수/로케이션/저장 이관 없음.',
    action: '정확 한 호출만 mode3로 적용하고 추가 경계·공식 출고·실제 버튼 수동 검증을 마친다.',
    patch: { proposal: `${qa}/conditions/fix-proposal.json`, ...edit, before_sha256: proposal.before_sha256, after_sha256: proposal.after_sha256 },
    liveVerification: { oldCallCount: pendingOldCount, newCallCount: pendingNewCount },
    isolatedVerification: { source: `${qa}/toggle-fix-native-report.json`, pass: native.pass, probes: native.client.length, assertions: native.cases.reduce((n, x) => n + x.checks, 0), failures: native.cases.reduce((n, x) => n + x.failures, 0) },
    evidence: [evidence(`${qa}/QA_REPORT_KO.md`, '그 호출 한 곳만 mode3 검증'), evidence(`${qa}/lead/CONFIRMED_FINDINGS_KO.md`, '추가 경계·공식 출고·실제 버튼 gate')],
    remainingValidation: ['추가 경계: 선택 파일 제거, A 없음, legacy ID, overlay', '공식 release-check 실제 native 9경로', '조건 설정 후 실제 수동 전환 버튼 클릭 및 새 출력 자동 우선순위'],
    adoptionAuthority: '현재 WORK 미룬 결과 반영 지시 및 AGENTS.md 27; 명시적 설계 보류와 구분',
  },
  {
    id: 'R-DOC', status: 'ready_to_adopt', kind: 'documentation_only',
    title: '연습 종료 성향의 현재 안내 0 및 과거 +1 이력 보존',
    scope: 'records/colosseum-sparring-fate-20261031/MANUAL_KO.md의 현재 안내만 갱신. 게임 코드 변경 없음.',
    action: '10/31 당시 +1은 역사임을 밝히고 11/01 현재 규칙은 0임을 표시한다. 검증 로그는 다시 쓰지 않는다.',
    evidence: [evidence(`${repo}/records/colosseum-sparring-fate-20261031/MANUAL_KO.md`, 'jo9_cruel_mercy+1'), evidence(`${repo}/records/cruel-mercy-rules-20261101/REPORT_KO.md`, '콜로세움 연습 종료'), evidence(`${qa}/game/REPORT_KO.md`, '기존 연습 +1 기록은 최신')],
    engineEvidence: `${qa}/game/native-final-results.json`,
    productionDocsEditedByThisInventory: false,
  },
  {
    id: 'IMAGE_CUT_CONDITIONS_20261101', status: 'already_applied', kind: 'feature',
    title: 'B·C컷 등장 조건 편집기 본체',
    scope: 'WORK QSP 6로케이션 및 편집 모듈4개. Full 별도 범위.',
    evidence: [evidence(`${repo}/records/image-cut-conditions-20261101/REPORT_KO.md`, '요청한 기능을 WORK와 추적 소스에 반영'), evidence(`${repo}/records/image-cut-conditions-20261101/REPORT_KO.md`, '78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d')],
    currentWorkSha256: sha(`${work}/jack.qsp`),
    caveat: '본기능 재적용 불필요. 위 Q241-CUT-003이 이 기능의 별도 수동 전환 수리다.',
  },
  {
    id: 'ISABELLA_TAVERN_ADOPTION_20261101', status: 'already_applied', kind: 'asset',
    title: '이사벨라 술집 review-only 시안 후속 채택',
    scope: adoption.target,
    currentAssetSha256: adoptedAssetHash,
    evidence: [evidence(`${repo}/records/isabella-tavern-adoption-20261101/REPORT_KO.md`, '시안으로 남아 있던 술집 컷신을 채택'), { path: `${repo}/records/isabella-tavern-adoption-20261101/asset-change.json`, verifiedAfterSha256: adoptedAssetHash }],
    caveat: '현재 그림 hash 일치; 화면 재생 미검증은 재적용 사유가 아니다.',
  },
  {
    id: 'CATFIGHT_LETHAL_SURVIVAL_ROUTING_20261031', status: 'already_applied', kind: 'production_code',
    title: '캣파이트 치명상 생존이 주인공 GAMEOVER로 빠진 누락 조건',
    scope: 'выход_из_боя Start1 및 패배/관람 컷신',
    liveVerification: { location: 'выход_из_боя', containsFixedCondition: true, fixedCondition: currentCatfightFix },
    evidence: [evidence(`${repo}/records/catfight-defeat-audit-20261031/REPORT_KO.md`, '누락 조건 수정과 사망·생존·관람 컷신 연결'), evidence(`${repo}/records/catfight-loss-watch-cuts-20261031/MANUAL_KO.md`, 'Start1 패배 조건에 убит')],
    caveat: '옛 proposed-edit.json의 PROPOSAL_ONLY는 후속 완료 기록으로 대체됐다.',
  },
  {
    id: 'ASSISTANT_DEFAULT_IMAGE_LOOKUP_20261028', status: 'already_applied', kind: 'production_code',
    title: '에게야 알몸 기본 fullimage 조회 한 줄 후보',
    scope: 'display_fullimage 빈 조수 역할키',
    evidence: [evidence(`${repo}/records/egeya-naked-followup-20261028/REPORT_KO.md`, 'APPLIED — 사용자 승인 후 WORK 반영 완료')],
    caveat: '오래된 tests/REPORT_KO.md의 미반영 후보 제목은 이력이다. legacy 캐시 후속과 구분한다.',
  },
  {
    id: 'THIRD_PATCH_APPROVED_FOLLOWUPS_20261026', status: 'already_applied', kind: 'historical_proposal',
    title: '랠리 거절·최고 기술 구간 및 이미지 JSON/호환 PNG',
    scope: '오래된 third-followups 승인대기 목록',
    evidence: [evidence(`${repo}/records/third-followups-20261026/REPORT_KO.md`, '이후 사용자가 승인하여 WORK 적용과 검증을 마쳤다')],
    caveat: '옛 제안 내용을 최신 WORK에 다시 적용하지 않는다.',
  },
  {
    id: 'PKG-C01', status: 'unconfirmed', kind: 'resource_reference',
    title: 'CSS content/a.jpg 부재',
    scope: '10개 CSS 배경 선언. 인물 IMG 본체는 다른 경로.',
    evidence: [evidence(`${qa}/QA_REPORT_KO.md`, '10개 배경 선언'), { path: `${qa}/package/css-candidate.json` }],
    action: '현재 부재는 확정이나 화면 손상은 미재현. 새 파일 생성·대체·선언 삭제 대상에 넣지 않는다.',
  },
  {
    id: 'WORKSHOP_SHOW_HTML', status: 'explicit_hold', kind: 'external_tool',
    title: '워크숍·Show HTML 불러오기 실패',
    scope: '모딩 도구',
    evidence: [evidence('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/full-prezip-20261101/QUESTIONS_DEFERRED_KO.md', '바로 수정하지 말고 수정목록에 넣어')],
    action: '수정목록 유지. 현재 미뤄둔 결과물 채택 지시는 검증된 수리 후보가 없는 이 문제의 임의 수리 승인으로 확대하지 않는다.',
  },
  {
    id: 'PRIVATE_PREGNANCY_REPORT', status: 'unconfirmed', kind: 'user_report',
    title: '개인실 임신 전달 제보의 전체 진행 재현',
    scope: '장기 진행·최초 발견 표시',
    evidence: [evidence('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/full-prezip-20261101/QUESTIONS_DEFERRED_KO.md', '기존 개인실 임신 제보의 실제 재현')],
    action: '직접 분기 검증 완료와 실제 제보 전체 재현을 구분. 검증된 미반영 수리 없음.',
  },
];
const holdIds = new Set(['D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','D11','D12','D13','D16']);
for (const d of deferred.items.filter(d => holdIds.has(d.id))) {
  items.push({ id: d.id, status: 'explicit_hold', kind: 'deferred_register', title: d.title, scope: d.facts, decision: d.decision, trigger: d.trigger, evidence: [{ path: `${repo}/records/deferred-discussions-20261024/index.json`, item: d.id }, ...d.evidence.map(path => ({ path: path.startsWith('WORK:') ? path : `${repo}/${path}` }))], action: '명시적 보류 유지; 이번 검증된 채택 대기 결과물 목록에서 제외한다.' });
}
const d15 = deferred.items.find(d => d.id === 'D15');
items.push({ id: 'D15', status: 'unconfirmed', kind: 'visual_report', title: d15.title, scope: d15.facts, decision: d15.decision, evidence: [{ path: `${repo}/records/deferred-discussions-20261024/index.json`, item: 'D15' }, evidence(`${qa}/QA_REPORT_KO.md`, '포커스 검은 잔상')], action: '원인 미확정·검증된 미반영 수리 없음. 전투 타격 애니메이션 수리 완료와 구분한다.' });
const recentReportPaths = fs.readdirSync(`${repo}/records`, { withFileTypes: true }).filter(x => x.isDirectory() && /20261031|20261101/.test(x.name)).flatMap(x => ['REPORT_KO.md','MANUAL_KO.md'].map(f => `${repo}/records/${x.name}/${f}`).filter(p => fs.existsSync(p)));
const inventory = {
  schema: 1, recordedAt: new Date().toISOString(), task: 'WORK 미룬 반영 결과 채택 범위 독립 조사',
  mode: 'read-only-production',
  baselines: { work: { path: `${work}/jack.qsp`, sha256: sha(`${work}/jack.qsp`) }, full: { path: `${full}/jack.qsp`, sha256: sha(`${full}/jack.qsp`), scope: '현재 지시에 Full 자동 동기화 포함 없음' } },
  reviewCoverage: { recentTopLevelReportsScannedForPendingPhrases: recentReportPaths.length, paths: recentReportPaths, historicalPendingPhraseSearch: 'records/*REPORT*.md, *MANUAL*.md, *decision*.json, *findings*.json 검색; 후속 완료 기록 우선', deferredRegisterItemsReviewed: deferred.items.length },
  summary: { readyProductionCode: 1, readyDocumentationOnly: 1, otherValidatedPendingChangesFound: 0, productionWrites: 0, enginesRun: 0, CUA: 0 },
  items,
  restrictions: ['WORK 최신 수동 편집 보존', 'sources/ 읽기 전용', 'Full·ZIP·커밋·푸시 범위 아님', '이 조사 보고는 엔진 출고/수동 클릭 완료 주장 아님', 'D14 공통 안내 원칙은 향후 문구 작성 원칙이며 미반영 결과물 아님'],
};
const out = __dirname;
fs.writeFileSync(path.join(out, 'pending-inventory.json'), JSON.stringify(inventory, null, 2) + '\n', 'utf8');
const ready = items.filter(x => x.status === 'ready_to_adopt');
const lines = [
  '# WORK 채택 대기 독립 조사 — 2026-11-01', '',
  '검증된 미반영 게임 수정은 **1건**, 문서 정정은 **1건**이다. 생산 파일·엔진·사용자 세션을 변경하지 않았다.', '',
  `- WORK: \`${inventory.baselines.work.sha256}\``,
  `- Full: \`${inventory.baselines.full.sha256}\` (현재 반영 범위 밖)`,
  `- 최근 10/31~11/01 최상위 REPORT/MANUAL ${recentReportPaths.length}개, 이전 미반영 문구 및 보류 등록부16건 대조.`, '',
  '| ID | 상태 | 현재 조치 |', '|---|---|---|',
  ...ready.map(x => `| ${x.id} | ${x.status} | ${x.action} |`), '',
  'Q241-CUT-003은 interior_change의 현재 선택 검증 호출 한 곳에 mode3을 명시한다. 자동 조건 우선순위·기존 ID·저장 구조를 보존한다. 격리 후보 5시나리오/29판정 통과이며 추가 경계·공식 출고·실제 버튼 검증은 상위 작업에서 수행해야 한다.', '',
  '| 과거 미반영 문구가 있는 항목 | 최신 판단 |', '|---|---|',
  ...items.filter(x => x.status === 'already_applied').map(x => `| ${x.id} | ${x.title}: 후속 완료 기록 확인. 중복 반영 제외. |`), '',
  'CSS content/a.jpg 부재, 개인실 임신 전달 제보, UI 검은 잔상은 검증된 미반영 수리 후보가 없다. 워크숍·Show HTML은 바로 고치지 말라는 개별 지시를 유지한다. 마법낙인 재현, 난도·지성AP·아이템·부동산·혀손실·XP·칭호·상인확장·한글식별자·이전 휴면기능·QSP리팩터링은 보류 등록부의 개별 결정대로 제외했다.', '',
  '정확한 각 출처의 파일·행·현행 확인값은 pending-inventory.json에 기록했다. Full 자동 동기화·ZIP·커밋·푸시를 하지 않는다.', '',
];
fs.writeFileSync(path.join(out, 'pending-inventory_KO.md'), lines.join('\n'), 'utf8');
console.log(JSON.stringify({ summary: inventory.summary, recentReports: recentReportPaths.length, counts: Object.fromEntries(['ready_to_adopt','already_applied','explicit_hold','unconfirmed'].map(s => [s, items.filter(x => x.status === s).length])), files: ['pending-inventory.json','pending-inventory_KO.md'] }, null, 2));
