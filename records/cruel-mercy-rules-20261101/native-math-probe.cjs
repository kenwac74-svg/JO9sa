'use strict';
// Diagnostic copies only. The only game files read are the QSP, config and engine.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const W = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const T = 'G:/Codex/tmp/cruel-mercy-rules-20261101-math';
const C = require(W + '/modtools/text-workshop/core.cjs');
const RUNNER = 'G:/somi/JO9sa/tools/qa/run-client-smoke.ps1';
const HELPER_NAME = 'jo9_cruel_mercy_apply';
const MARKER = 'JO9_QA_CMHALF20261101_math_COMPLETE';
// After WORK advances, pass --qsp <archived b7e5 before.qsp> to reproduce.
const sourceAt = process.argv.indexOf('--qsp');
const sourcePath = sourceAt >= 0 ? path.resolve(process.argv[sourceAt + 1]) : W + '/jack.qsp';
const qsp = fs.readFileSync(sourcePath);
const sourceHash = C.hash(qsp);
const productionBeforeHash = C.hash(fs.readFileSync(W + '/jack.qsp'));
const doc = C.parse(qsp);
assert.equal(sourceHash, 'b7e5b385dcbd5d8e4b4ac18c9556e18bf371f25f6368c3eba729c9374d1cc07b');
const helper = fs.readFileSync(path.join(__dirname, 'cm-half-helper.qsp.txt'), 'utf8').replace(/\r?\n/g, '\r\n').trimEnd();
let assertions = 0;
function check(lines, expr, label) {
  const id = ++assertions;
  lines.push("if " + expr + ": msg 'FAIL_CM_HALF_" + id + '_' + label + "|whole=<<jo9_cruel_mercy>>|half=<<jo9_cruel_mercy_half>>|i=<<jo9_qa_i>>|temp=<<jo9_cm_total>>' & exit");
}
const boot = [];
boot.push('jo9_cm_total = 98765');
const cases = [
  { name: 'old-save-positive-integer', before: { whole: 4, half: null }, deltaHalf: 2, after: { whole: 5, half: 0 } },
  { name: 'old-save-negative-integer', before: { whole: -4, half: null }, deltaHalf: -2, after: { whole: -5, half: 0 } },
  { name: 'zero-to-positive-half', before: { whole: 0, half: 0 }, deltaHalf: 1, after: { whole: 0, half: 1 } },
  { name: 'zero-to-negative-half', before: { whole: 0, half: 0 }, deltaHalf: -1, after: { whole: 0, half: -1 } },
  { name: 'cross-negative-to-positive', before: { whole: 0, half: -1 }, deltaHalf: 2, after: { whole: 0, half: 1 } },
  { name: 'cross-positive-to-negative', before: { whole: 0, half: 1 }, deltaHalf: -2, after: { whole: 0, half: -1 } },
  { name: 'mercy-enter', before: { whole: 4, half: 1 }, deltaHalf: 1, after: { whole: 5, half: 0 } },
  { name: 'mercy-leave', before: { whole: 5, half: 0 }, deltaHalf: -1, after: { whole: 4, half: 1 } },
  { name: 'cruel-enter', before: { whole: -4, half: -1 }, deltaHalf: -1, after: { whole: -5, half: 0 } },
  { name: 'cruel-leave', before: { whole: -5, half: 0 }, deltaHalf: 1, after: { whole: -4, half: -1 } }
];
for (const [index, item] of cases.slice(0, 2).entries()) {
  boot.push('jo9_cruel_mercy = ' + item.before.whole, "killvar 'jo9_cruel_mercy_half'");
  check(boot, 'jo9_cruel_mercy_half ! 0', 'unset_half_defaults_zero');
  boot.push("gs '" + HELPER_NAME + "', " + item.deltaHalf);
  check(boot, 'jo9_cruel_mercy ! ' + item.after.whole, 'old_save_whole_' + index);
  check(boot, 'jo9_cruel_mercy_half ! ' + item.after.half, 'old_save_half_' + index);
  check(boot, 'jo9_cm_total ! 98765', 'helper_local_restored_' + index);
}
// GS uses the global score, not caller-local shadows. Copy its original values
// into local backup names, mutate the intended globals, then restore explicitly.
boot.push('jo9_cruel_mercy = 731', 'jo9_cruel_mercy_half = 1', 'jo9_qa_i = 445', 'jo9_qa_saved_whole = 2222', 'jo9_qa_saved_half = 3333', "gs 'CoreQAMath'");
check(boot, 'jo9_cruel_mercy ! 731', 'original_whole_restored');
check(boot, 'jo9_cruel_mercy_half ! 1', 'original_half_restored');
check(boot, 'jo9_qa_i ! 445', 'loop_index_restored');
check(boot, 'jo9_cm_total ! 98765', 'helper_sentinel_restored');
check(boot, "arrsize('jo9_qa_w') ! 0", 'local_array_cleaned');
check(boot, 'jo9_qa_saved_whole ! 2222', 'saved_whole_local_cleaned');
check(boot, 'jo9_qa_saved_half ! 3333', 'saved_half_local_cleaned');
boot.push("msg '" + MARKER + "'");
const loop = [];
loop.push('local jo9_qa_saved_whole = jo9_cruel_mercy', 'local jo9_qa_saved_half = jo9_cruel_mercy_half');
for (const name of ['jo9_qa_i', 'jo9_qa_w', 'jo9_qa_h', 'jo9_qa_d', 'jo9_qa_ew', 'jo9_qa_eh', 'jo9_qa_t']) loop.push('local ' + name);
for (const [index, item] of cases.slice(2).entries()) {
  const n = index + 1;
  loop.push('jo9_qa_w[' + n + '] = ' + item.before.whole, 'jo9_qa_h[' + n + '] = ' + item.before.half, 'jo9_qa_d[' + n + '] = ' + item.deltaHalf, 'jo9_qa_ew[' + n + '] = ' + item.after.whole, 'jo9_qa_eh[' + n + '] = ' + item.after.half);
}
loop.push('for jo9_qa_i = 1 to 8:', ' jo9_cruel_mercy = jo9_qa_w[jo9_qa_i]', ' jo9_cruel_mercy_half = jo9_qa_h[jo9_qa_i]', " gs '" + HELPER_NAME + "', jo9_qa_d[jo9_qa_i]");
check(loop, 'jo9_cruel_mercy ! jo9_qa_ew[jo9_qa_i]', 'loop_whole');
check(loop, 'jo9_cruel_mercy_half ! jo9_qa_eh[jo9_qa_i]', 'loop_half');
check(loop, 'jo9_cm_total ! 98765', 'loop_helper_local');
loop.push(' jo9_qa_t = 2 * jo9_cruel_mercy + jo9_cruel_mercy_half');
check(loop, '(jo9_cruel_mercy <= -5) ! (jo9_qa_t <= -10)', 'cruel_threshold');
check(loop, '(jo9_cruel_mercy >= 5) ! (jo9_qa_t >= 10)', 'mercy_threshold');
check(loop, '(jo9_cruel_mercy < 5) ! (jo9_qa_t < 10)', 'neutral_threshold');
loop.push('end', 'jo9_cruel_mercy = jo9_qa_saved_whole', 'jo9_cruel_mercy_half = jo9_qa_saved_half');
const start = doc.locations.find(location => location.name === 'Start');
assert.ok(start);
assert.equal(C.shift(doc.lines[start.desc], 5), '');
doc.lines[start.body] = C.shift("gs 'CoreQAStart'", -5);
function appendLocation(name, body) {
  assert.ok(!doc.locations.some(location => location.name === name), 'diagnostic location collision: ' + name);
  doc.lines.pop();
  doc.lines.push(C.shift(name, -5), '', C.shift(body, -5), C.shift('0', -5), '');
  doc.lines[3] = C.shift(String(Number(C.shift(doc.lines[3], 5)) + 1), -5);
}
appendLocation(HELPER_NAME, helper);
appendLocation('CoreQAStart', boot.join('\r\n'));
appendLocation('CoreQAMath', loop.join('\r\n'));
const fixture = C.serialize(doc);
assert.equal(C.parse(fixture).locations.length, C.parse(qsp).locations.length + 3);
assert.equal(C.hash(fs.readFileSync(sourcePath)), sourceHash, 'diagnostic source changed before native launch');
assert.equal(C.hash(fs.readFileSync(W + '/jack.qsp')), productionBeforeHash, 'WORK changed before native launch');
fs.mkdirSync(T, { recursive: true });
if (fs.existsSync(T + '/probe.qsp')) {
  const prior = JSON.parse(fs.readFileSync(path.join(__dirname, 'math-report.json'), 'utf8'));
  assert.equal(prior.diagnosticRoot, T);
  assert.equal(C.hash(fs.readFileSync(T + '/probe.qsp')), prior.fixtureHash, 'only overwrite this probe previous generated fixture');
}
fs.writeFileSync(T + '/probe.qsp', fixture);
fs.copyFileSync(W + '/config.xml', T + '/config.xml');
fs.writeFileSync(T + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plan = [{ name: 'cm-half-math', file: T + '/probe.qsp', marker: MARKER, checkpoint: 'Ten native half-point arithmetic cases, old-save default0, zero crossing, thresholds, caller-local restoration and helper-local cleanup' }];
fs.writeFileSync(T + '/plan.json', JSON.stringify(plan, null, 2) + '\n');
const started = Date.now();
const runner = cp.spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', RUNNER, '-Engine', W + '/engine/jack.exe', '-Plan', T + '/plan.json', '-TimeoutSeconds', '15'], { windowsHide: true, encoding: 'utf8', timeout: 35000 });
const resultsPath = T + '/client-results.json';
const nativeResults = fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8').replace(/^\uFEFF/, '')) : [];
const stderr = fs.existsSync(T + '/cm-half-math-stderr.log') ? fs.readFileSync(T + '/cm-half-math-stderr.log', 'utf8') : '';
const report = {
  date: new Date().toISOString(), source: sourcePath, sourceHash, sourceAfterHash: C.hash(fs.readFileSync(sourcePath)), productionBeforeHash, productionAfterHash: C.hash(fs.readFileSync(W + '/jack.qsp')),
  engine: W + '/engine/jack.exe', engineHash: C.hash(fs.readFileSync(W + '/engine/jack.exe')), runner: RUNNER,
  fixtureHash: C.hash(fixture), diagnosticRoot: T, helperName: HELPER_NAME, helperBodyFile: path.join(__dirname, 'cm-half-helper.qsp.txt'), helperHash: C.hash(Buffer.from(helper)),
  marker: MARKER, cases, sourceAssertionCount: assertions, executedAssertions: 8 + 7 + 6 * 8, nativeResults, durationMs: Date.now() - started,
  runnerStatus: runner.status, runnerError: runner.error && runner.error.message, runnerStdout: runner.stdout || '', runnerStderr: runner.stderr || '',
  engineMessages: stderr.split(/\r?\n/).filter(line => /showMessage\(\)|FAIL_CM_HALF|Error|error|Ошибка/.test(line)).slice(0, 30),
  sentinels: { originalWhole: 731, originalHalf: 1, callerLoopIndex: 445, helperLocalPriorValue: 98765, localArrayRestoredToAbsent: true, scorePreservedByExplicitLocalCopiesAndRestore: true, savedWholeBackupNamePriorValue: 2222, savedHalfBackupNamePriorValue: 3333 },
  nativeLocalScopeFinding: { detail: 'GS sees global score fields rather than a caller local shadow of the same name. A diagnostic must use distinct local savedWhole/savedHalf names and explicit restore. This does not affect the intended production-global helper.', observedFailedDiagnostic: ['caller local whole0/half0 remained unchanged', 'global sentinel whole731/half1 became whole732/half0 after deltaHalf1', 'helper local jo9_cm_total prior sentinel98765 remained unchanged'], corrected: true },
  productionWrites: 0, savedGamesReadOrWritten: 0,
  pass: runner.status === 0 && nativeResults.length === 1 && nativeResults.every(item => item.pass) && C.hash(fs.readFileSync(sourcePath)) === sourceHash && C.hash(fs.readFileSync(W + '/jack.qsp')) === productionBeforeHash
};
fs.writeFileSync(path.join(__dirname, 'math-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pass: report.pass, cases: cases.length, executedAssertions: report.executedAssertions, nativeResults, sourceHash, sourceAfterHash: report.sourceAfterHash, report: path.join(__dirname, 'math-report.json'), diagnosticRoot: T }));
assert.ok(report.pass, 'native arithmetic probe failed; inspect math-report.json');
