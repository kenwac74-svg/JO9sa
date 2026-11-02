'use strict';
// Actual candidate choose/helper bodies, read-only candidate and production game.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const W = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const ROOT = 'G:/Codex/tmp/cruel-mercy-rules-20261101';
const C = require(W + '/modtools/text-workshop/core.cjs');
const candidatePath = process.argv[2] || ROOT + '/candidate.qsp';
const T = ROOT + '/cm-fate-native';
const marker = 'JO9_QA_CMFRULES20261101_scoring_COMPLETE';
const runnerPath = 'G:/somi/JO9sa/tools/qa/run-client-smoke.ps1';
const productionBeforeHash = C.hash(fs.readFileSync(W + '/jack.qsp'));
const raw = fs.readFileSync(candidatePath), doc = C.parse(raw);
const body = name => C.shift(doc.lines[doc.locations.find(loc => loc.name === name).body], 5);
assert.ok(doc.locations.some(loc => loc.name === 'jo9_cruel_mercy_apply'), 'candidate arithmetic helper exists');
const originalFateBody = body('jo9_battle_fate');
const originalHelperBody = body('jo9_cruel_mercy_apply');
const testedFunctionHashesUtf8 = { jo9_battle_fate: C.hash(Buffer.from(originalFateBody, 'utf8')), jo9_cruel_mercy_apply: C.hash(Buffer.from(originalHelperBody, 'utf8')) };
const formal = { mode: 2, place: 'colosseum_arena', back: 'Start' };
const catfight = { mode: 2, place: 'catfightclub', back: 'Start1' };
const fog = { mode: 1, place: 'edge_patrol', back: 'city_menu_form' };
const practice = { mode: 2, place: 'colosseum', back: 'shop_general', practice: 1 };
const cases = [
  { name: 'arena-execute', ...formal, choice: 1, score: [0, 0], expected: [-1, 0], accepted: true },
  { name: 'arena-spare-old-save-half-unset', ...formal, choice: 2, score: [0, null], expected: [1, 0], accepted: true },
  { name: 'catfight-execute', ...catfight, choice: 1, score: [0, 0], expected: [-1, 0], accepted: true },
  { name: 'catfight-spare', ...catfight, choice: 2, score: [0, 0], expected: [1, 0], accepted: true },
  { name: 'fog-forced-execute-zero', ...fog, choice: 1, score: [0, 0], expected: [0, 0], accepted: true },
  { name: 'fog-spare-disallowed', ...fog, choice: 2, score: [0, 0], expected: [0, 0], accepted: false },
  { name: 'practice-finish-zero', ...practice, choice: 2, score: [0, 0], expected: [0, 0], accepted: true },
  { name: 'practice-execute-disallowed', ...practice, choice: 1, score: [0, 0], expected: [0, 0], accepted: false },
  { name: 'synthetic-arena-group-three-once', ...formal, count: 3, choice: 1, score: [0, 0], expected: [-1, 0], accepted: true, syntheticPendingState: true },
  { name: 'synthetic-catfight-group-five-once', ...catfight, count: 5, choice: 2, score: [0, 0], expected: [1, 0], accepted: true, syntheticPendingState: true },
  { name: 'fog-group-five-zero', ...fog, count: 5, choice: 1, score: [0, 0], expected: [0, 0], accepted: true },
  { name: 'cross-negative-half-to-positive-half', ...formal, choice: 2, score: [0, -1], expected: [0, 1], accepted: true },
  { name: 'cross-positive-half-to-negative-half', ...catfight, choice: 1, score: [0, 1], expected: [0, -1], accepted: true },
  { name: 'positive-half-stays-below-five', ...formal, choice: 2, score: [3, 1], expected: [4, 1], accepted: true },
  { name: 'mercy-enters-exact-five', ...formal, choice: 2, score: [4, 0], expected: [5, 0], accepted: true },
  { name: 'mercy-five-and-half-canonical', ...formal, choice: 2, score: [4, 1], expected: [5, 1], accepted: true },
  { name: 'mercy-leaves-to-four-and-half', ...formal, choice: 1, score: [5, 1], expected: [4, 1], accepted: true },
  { name: 'cruel-minus-five-and-half-canonical', ...catfight, choice: 1, score: [-4, -1], expected: [-5, -1], accepted: true },
  { name: 'cruel-leaves-to-minus-four-and-half', ...catfight, choice: 2, score: [-5, -1], expected: [-4, -1], accepted: true },
  { name: 'practice-half-preserved-zero', ...practice, choice: 2, score: [4, 1], expected: [4, 1], accepted: true },
  { name: 'fog-half-preserved-zero', ...fog, choice: 1, score: [-4, -1], expected: [-4, -1], accepted: true },
  { name: 'out-of-scope-mode-two-zero', mode: 2, place: 'erza_battle', back: 'city_menu_form', choice: 1, score: [0, 1], expected: [0, 1], accepted: true, syntheticPendingState: true },
  { name: 'mode-zero-guard', ...formal, mode: 0, choice: 1, score: [0, 0], expected: [0, 0], accepted: false },
  { name: 'phase-zero-guard', ...formal, phase: 0, choice: 1, score: [0, 0], expected: [0, 0], accepted: false },
  { name: 'phase-two-guard', ...formal, phase: 2, choice: 1, score: [0, 0], expected: [0, 0], accepted: false },
  { name: 'phase-three-guard', ...formal, phase: 3, choice: 1, score: [0, 0], expected: [0, 0], accepted: false },
  { name: 'count-zero-guard', ...formal, pending: 0, choice: 1, score: [0, 0], expected: [0, 0], accepted: false },
  { name: 'nonvictory-guard', ...formal, outcome: 'поражение', choice: 1, score: [0, 0], expected: [0, 0], accepted: false },
  { name: 'invalid-choice-guard', ...formal, choice: 99, score: [0, 0], expected: [0, 0], accepted: false }
];
const lines = ["sound_on = 0", 'settimer 0', 'jo9_cm_total = 983476'];
let assertions = 0, duplicateCalls = 0;
function check(expr, label, name) {
  assertions++;
  lines.push("if " + expr + ": msg 'FAIL_CM_FATE_" + assertions + '_' + label + '_' + name + "|whole=<<jo9_cruel_mercy>>|half=<<jo9_cruel_mercy_half>>|phase=<<jo9_fate[\"phase\"]>>' & exit");
}
for (const item of cases) {
  const count = item.count || 1, phase = item.phase ?? 1, pending = item.pending ?? count;
  lines.push("killvar 'jo9_fate'", "killvar 'jo9_fate_enemy'", "killvar 'труп'", "killvar 'в_отключке'", "killvar '" + '$трофей' + "'", 'тр = 1', 'количество_врагов = ' + count, 'текущий = 1', 'arena_mode = 1', 'colosseum_fight = ' + (item.practice || 0), "$place = '" + item.place + "'", "$fight_return = '" + item.back + "'", "$итог_боя = '" + (item.outcome || 'победа') + "'", "jo9_fate['mode'] = " + item.mode, "jo9_fate['phase'] = " + phase, "jo9_fate['count'] = " + pending, 'jo9_cruel_mercy = ' + item.score[0]);
  lines.push(item.score[1] === null ? "killvar 'jo9_cruel_mercy_half'" : 'jo9_cruel_mercy_half = ' + item.score[1]);
  for (let index = 1; index <= count; index++) {
    lines.push("$враг[" + index + "] = 'qa_enemy_" + index + "'", "jo9_fate_enemy[" + index + '] = 1', 'здоровье_врага[' + index + '] = 7', 'выносливость_врага[' + index + '] = 8', "$труп_моба_в_локацию['qa_enemy_" + index + "'] = 'qa_corpse_" + index + "'", "$вырубленный_моб_в_локацию['qa_enemy_" + index + "'] = 'qa_ko_" + index + "'");
  }
  lines.push("gs 'jo9_battle_fate', 'choose', " + item.choice);
  check('jo9_cruel_mercy ! ' + item.expected[0], 'whole', item.name);
  check('jo9_cruel_mercy_half ! ' + item.expected[1], 'half', item.name);
  check('jo9_cm_total ! 983476', 'local-cleanup', item.name);
  check("jo9_fate['phase'] ! " + (item.accepted ? 2 : phase), 'phase', item.name);
  check("jo9_fate['count'] ! " + (item.accepted ? 0 : pending), 'pending', item.name);
  check('тр ! ' + (item.accepted ? count + 1 : 1), 'loot-index', item.name);
  const totalHalf = 2 * item.expected[0] + item.expected[1];
  check('(jo9_cruel_mercy <= -5) ! (' + totalHalf + ' <= -10)', 'cruel-threshold', item.name);
  check('(jo9_cruel_mercy >= 5) ! (' + totalHalf + ' >= 10)', 'mercy-threshold', item.name);
  for (let index = 1; index <= count; index++) {
    check('jo9_fate_enemy[' + index + '] ! ' + (item.accepted ? 0 : 1), 'enemy-once-' + index, item.name);
    check("труп['qa_enemy_" + index + "'] ! " + (item.accepted && item.choice === 1 ? 1 : 0), 'corpse-' + index, item.name);
    check("в_отключке['qa_enemy_" + index + "'] ! " + (item.accepted && item.choice === 2 ? 1 : 0), 'ko-' + index, item.name);
  }
  if (item.accepted) {
    for (const retry of [item.choice, item.choice === 1 ? 2 : 1]) {
      lines.push("gs 'jo9_battle_fate', 'choose', " + retry);
      duplicateCalls++;
      check('jo9_cruel_mercy ! ' + item.expected[0], 'retry-whole', item.name);
      check('jo9_cruel_mercy_half ! ' + item.expected[1], 'retry-half', item.name);
      check('тр ! ' + (count + 1), 'retry-loot', item.name);
    }
  }
}
lines.push("msg '" + marker + "'");
const start = doc.locations.find(loc => loc.name === 'Start');
assert.ok(start && C.shift(doc.lines[start.desc], 5) === '');
doc.lines[start.body] = C.shift("gs 'CoreQAFateStart'", -5);
assert.ok(!doc.locations.some(loc => loc.name === 'CoreQAFateStart'));
doc.lines.splice(-1, 0, C.shift('CoreQAFateStart', -5), '', C.shift(lines.join('\r\n'), -5), C.shift('0', -5));
doc.lines[3] = C.shift(String(doc.locations.length + 1), -5);
const fixture = C.serialize(doc), reread = C.parse(fixture);
for (const name of ['jo9_battle_fate', 'jo9_cruel_mercy_apply']) {
  const actual = C.shift(reread.lines[reread.locations.find(loc => loc.name === name).body], 5);
  assert.equal(actual, name === 'jo9_battle_fate' ? originalFateBody : originalHelperBody, 'actual candidate function preserved: ' + name);
}
fs.mkdirSync(T, { recursive: true });
assert.ok(!fs.existsSync(T + '/cm-fate-probe.qsp'), 'refuse overwriting existing diagnostic');
fs.writeFileSync(T + '/cm-fate-probe.qsp', fixture);
fs.copyFileSync(W + '/config.xml', T + '/config.xml');
fs.writeFileSync(T + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(T + '/plan.json', JSON.stringify([{ name: 'cm-fate-scoring', file: T + '/cm-fate-probe.qsp', marker, checkpoint: 'Actual choose + candidate helper; formal arena/catfight +/-1, fog/practice0, duplicate and invalid guards, synthetic group once and half-score boundaries' }], null, 2) + '\n');
assert.equal(C.hash(fs.readFileSync(W + '/jack.qsp')), productionBeforeHash);
const native = cp.spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', runnerPath, '-Engine', W + '/engine/jack.exe', '-Plan', T + '/plan.json', '-TimeoutSeconds', '20'], { windowsHide: true, encoding: 'utf8', timeout: 35000 });
const nativeResults = fs.existsSync(T + '/client-results.json') ? JSON.parse(fs.readFileSync(T + '/client-results.json', 'utf8').replace(/^\uFEFF/, '')) : [];
const stderr = fs.existsSync(T + '/cm-fate-scoring-stderr.log') ? fs.readFileSync(T + '/cm-fate-scoring-stderr.log', 'utf8') : '';
const report = { date: new Date().toISOString(), candidate: candidatePath, candidateHash: C.hash(raw), candidateAfterHash: C.hash(fs.readFileSync(candidatePath)), productionBeforeHash, productionAfterHash: C.hash(fs.readFileSync(W + '/jack.qsp')), fixtureHash: C.hash(fixture), diagnosticRoot: T, cases, assertions, duplicateCalls, testedFunctionHashesUtf8, actualChooseAndHelperBodiesUnchanged: true, initScopeTested: false, uiRendererInvoked: false, nativeResults, engineMessages: stderr.split(/\r?\n/).filter(line => /showMessage\(\)|FAIL_CM_FATE|error|Ошибка/.test(line)).slice(0, 30), nativeStatus: native.status, nativeError: native.error && native.error.message, nativeStdout: native.stdout || '', nativeStderr: native.stderr || '', productionWrites: 0, pass: native.status === 0 && nativeResults.length === 1 && nativeResults.every(item => item.pass) && C.hash(fs.readFileSync(W + '/jack.qsp')) === productionBeforeHash && C.hash(fs.readFileSync(candidatePath)) === C.hash(raw) };
fs.writeFileSync(path.join(__dirname, 'native-fate-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pass: report.pass, candidateHash: report.candidateHash, cases: cases.length, assertions, duplicateCalls, nativeResults, report: path.join(__dirname, 'native-fate-report.json') }));
assert.ok(report.pass, 'native fate suite failed');
