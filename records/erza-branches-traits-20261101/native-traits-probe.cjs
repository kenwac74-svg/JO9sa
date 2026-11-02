'use strict';
// Isolated numeric fixtures; no personal saves, narrative rendering or image access.
const fs = require('node:fs');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const C = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const W = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const SOURCE = process.env.JO9_QA_SOURCE || 'G:/Codex/tmp/erza-branches-traits-20261101/candidate.qsp';
const T = 'G:/Codex/tmp/erza-branches-traits-20261101-traits-native';
const EXPECTED = process.env.JO9_QA_SOURCE_SHA || JSON.parse(fs.readFileSync('G:/Codex/tmp/erza-branches-traits-20261101/prepared.json','utf8')).after;
const RUNNER = 'G:/somi/JO9sa/tools/qa/run-client-smoke.ps1';
const MARKER = 'JO9_QA_ERZATRAITS20261101_traits_complete_COMPLETE';
const mode = process.argv[2] || 'prepare';
const raw = fs.readFileSync(SOURCE), doc = C.parse(raw);
assert.equal(doc.hash, EXPECTED);
const productionBefore = C.hash(fs.readFileSync(W + '/jack.qsp'));
const seedPath = W + '/json/slaves/2624_erza.json', seedRaw = fs.readFileSync(seedPath), seed = JSON.parse(seedRaw);
assert.equal(seed.seed_age, 0);
assert.equal(seed.seed_virginity, 0);
const body = n => C.shift(doc.lines[doc.locations.find(l => l.name === n).body], 5);
const sourceValue = body('jo9_traits_value'), sourceState = body('jo9_meiki_state'), checksBody = body('jo9_meiki_checks');
assert(sourceValue.includes("if dynslave_type = 2624: dynslave['jo9_peerless'] = 1"));
assert(sourceState.includes("['virginity']\") ! 4"));
const popupLines = sourceState.split(/\r?\n/).filter(s => /^\s*msg /.test(s));
assert.equal(popupLines.length, 1);
let rolls = 0;
let stateBody = sourceState.replace(/if rand\(1,\s*100\) <= 5:/g, () => { rolls++; return 'qa_rolls += 1\r\n   if qa_rand <= 5:'; });
assert.equal(rolls, 6);
stateBody = stateBody.replace(popupLines[0], ' qa_popups += 1 & $qa_popup_name = $jo9_meiki_found_name');
const roles = ['stock', 'slave', 'assistant', 'room1', 'room2', 'room3', 'room4', 'prisoner', 'cow'];
const meikiRoles = ['slave', 'assistant', 'room1', 'room2', 'room3', 'room4'];
const skillKeys = ['sub_vaginal', 'sub_threesome', 'sub_dp', 'sub_tp', 'sub_gangbang', 'sub_bukkake'];
const skillBefore = [2, 4, 1, 0, 7, 1], skillAfterGrant = [5, 4, 3, 3, 7, 3];
const cases = [];
for (const role of roles) for (const variant of [
  { name: 'unique-top', type: 2624, priorPeerless: 0, temp: 0, virginity: 0, expectedPeerless: 1, expectedBeauty: 6 },
  { name: 'unique-penalty', type: 2624, priorPeerless: 0, temp: -1, virginity: 1, expectedPeerless: 1, expectedBeauty: 5 },
  { name: 'other-no-trait', type: 1111, priorPeerless: 0, temp: 0, virginity: 2, expectedPeerless: 0, expectedBeauty: 5 },
  { name: 'other-existing-trait', type: 1111, priorPeerless: 1, temp: 0, virginity: 0, expectedPeerless: 1, expectedBeauty: 6 }
]) cases.push({ kind: 'appearance', role, ...variant });
const scenarios = [
  { name: 'hidden-initial0', virginity: 0, initialized: 0, prev: 0, checked: 0, known: 0, allow: 0, rand: 100, expectedVirginity: 0, expectedKnown: 0, expectedPopup: 0, grant: false },
  { name: 'hidden-restored1', virginity: 1, initialized: 1, prev: 1, checked: 1, known: 0, allow: 0, rand: 100, expectedVirginity: 1, expectedKnown: 0, expectedPopup: 0, grant: false },
  { name: 'legacy-checked-miss2', virginity: 2, initialized: 1, prev: 2, checked: 1, known: 0, allow: 0, rand: 100, expectedVirginity: 4, expectedKnown: 1, expectedPopup: 1, grant: true },
  { name: 'legacy-uninitialized3', virginity: 3, initialized: 0, prev: 0, checked: 0, known: 0, allow: 0, rand: 100, expectedVirginity: 4, expectedKnown: 1, expectedPopup: 1, grant: true },
  { name: 'first-transition-random-miss-still-guaranteed', virginity: 2, initialized: 1, prev: 0, checked: 0, known: 0, allow: 1, rand: 100, expectedVirginity: 4, expectedKnown: 1, expectedPopup: 1, grant: true },
  { name: 'known4-no-regrant', virginity: 4, initialized: 2, prev: 4, checked: 1, known: 1, allow: 1, rand: 1, expectedVirginity: 4, expectedKnown: 1, expectedPopup: 0, grant: false },
  { name: 'visible4-unknown-sync-without-popup', virginity: 4, initialized: 0, prev: 0, checked: 0, known: 0, allow: 0, rand: 100, expectedVirginity: 4, expectedKnown: 1, expectedPopup: 0, grant: true },
  { name: 'fresh0-then-experienced2', virginity: 0, initialized: 0, prev: 0, checked: 0, known: 0, allow: 1, rand: 100, expectedVirginity: 4, expectedKnown: 1, expectedPopup: 1, grant: true, transition: true },
  { name: 'other-first-roll5-hit', type: 1111, virginity: 2, initialized: 1, prev: 0, checked: 0, known: 0, allow: 1, rand: 5, expectedVirginity: 4, expectedKnown: 1, expectedPopup: 1, grant: true, expectedRolls: 1 },
  { name: 'other-first-roll6-miss', type: 1111, virginity: 2, initialized: 1, prev: 0, checked: 0, known: 0, allow: 1, rand: 6, expectedVirginity: 2, expectedKnown: 0, expectedPopup: 0, grant: false, expectedRolls: 1 },
  { name: 'other-checked-miss-not-retried', type: 1111, virginity: 2, initialized: 1, prev: 2, checked: 1, known: 0, allow: 1, rand: 1, expectedVirginity: 2, expectedKnown: 0, expectedPopup: 0, grant: false, expectedRolls: 0 },
  { name: 'other-already-experienced-no-first-roll', type: 1111, virginity: 2, initialized: 0, prev: 0, checked: 0, known: 0, allow: 1, rand: 1, expectedVirginity: 2, expectedKnown: 0, expectedPopup: 0, grant: false, expectedRolls: 0 }
];
for (const role of meikiRoles) for (const scenario of scenarios) cases.push({ kind: 'discovery', role, type: 2624, ...scenario });
const assertions = [];
function check(out, expr, label) {
  assertions.push(label);
  out.push("if (" + expr + ") = 0: msg 'FAIL_ERZA_TRAITS_" + assertions.length + '_' + label + "|case=<<qa_case>>|popups=<<qa_popups>>|rolls=<<qa_rolls>>' & exit");
}
const boot = ['killall', 'usehtml = 1', "CONST_INT['young_age'] = 0", "CONST_INT['loli_age'] = 1", "CONST_INT['milf_age'] = 2", "CONST_INT['slave_exist'] = 1", 'cont_atr_min = 0', 'cont_atr_max = 160'];
[10, 20, 40, 80, 160].forEach((v, i) => boot.push('cont_atr_threshold[' + (i + 1) + '] = ' + v));
boot.push('sparks = 1234', 'master_health = 88', 'master_energy = 4', 'day = 100', 'jo9_cruel_mercy = 2', 'jo9_cruel_mercy_half = 1', "unique_slave['erza'] = 1");
cases.forEach((x, i) => {
  const n = x.role, f = key => n + "['" + key + "']";
  boot.push('qa_case = ' + (i + 1));
  for (const r of roles) boot.push("killvar '" + r + "'", "killvar '" + r + "_rate'", "killvar '" + r + "_type'", "killvar '$" + r + "_name'");
  boot.push('qa_popups = 0', 'qa_rolls = 0', "$qa_popup_name = ''", n + '_type = ' + x.type, '$' + n + "_name = 'QA_" + n + "'", f('age') + ' = ' + seed.seed_age, f('virginity') + ' = ' + x.virginity,
    f('jo9_focus') + ' = -1');
  skillKeys.forEach((k, j) => boot.push(f(k) + ' = ' + skillBefore[j]));
  if (x.kind === 'appearance') {
    boot.push(f('jo9_peerless') + ' = ' + x.priorPeerless, n + "_rate['beauty'] = 160", n + "_rate['temp_beauty'] = " + x.temp, 'for qa_repeat = 1 to 5:', " gs 'jo9_traits_value', 'refresh', '" + n + "'");
    check(boot, f('jo9_peerless') + ' = ' + x.expectedPeerless + ' and ' + f('beauty') + ' = ' + x.expectedBeauty, 'appearance_and_idempotence_' + (i + 1));
    check(boot, f('virginity') + ' = ' + x.virginity + ' and ' + f('jo9_meiki_known') + ' = 0 and ' + f('jo9_focus') + ' = -1', 'appearance_preserves_hidden_and_other_trait_' + (i + 1));
    boot.push('end');
    skillKeys.forEach((k, j) => check(boot, f(k) + ' = ' + skillBefore[j], 'appearance_preserves_skill_' + (i + 1) + '_' + j));
  } else {
    boot.push(f('jo9_meiki_initialized') + ' = ' + x.initialized, f('jo9_meiki_prev') + ' = ' + x.prev, f('jo9_meiki_checked') + ' = ' + x.checked, f('jo9_meiki_known') + ' = ' + x.known, 'qa_rand = ' + x.rand);
    if (x.transition) {
      boot.push("gs 'jo9_meiki_state', '" + n + "', 0");
      check(boot, f('virginity') + ' = 0 and ' + f('jo9_meiki_known') + ' = 0 and qa_popups = 0', 'fresh_state0_not_revealed_' + (i + 1));
      boot.push(f('virginity') + ' = 2');
    }
    boot.push("gs 'jo9_meiki_state', '" + n + "', " + x.allow);
    check(boot, f('virginity') + ' = ' + x.expectedVirginity + ' and ' + f('jo9_meiki_known') + ' = ' + x.expectedKnown, 'discovery_state_' + (i + 1));
    check(boot, 'qa_popups = ' + x.expectedPopup, 'first_popup_count_' + (i + 1));
    if (x.expectedPopup) check(boot, '$qa_popup_name = $' + n + '_name', 'discovery_name_' + (i + 1));
    if (x.expectedRolls !== undefined) check(boot, 'qa_rolls = ' + x.expectedRolls, 'generic_roll_boundary_' + (i + 1));
    const skills = x.grant ? skillAfterGrant : skillBefore;
    skillKeys.forEach((k, j) => check(boot, f(k) + ' = ' + skills[j], 'one_time_floor_or_history_' + (i + 1) + '_' + j));
    if (x.grant) {
      check(boot, f('jo9_meiki_initialized') + ' = 2', 'grant_revision_' + (i + 1));
      boot.push(f('sub_vaginal') + ' = 1');
    }
    boot.push('for qa_repeat = 1 to 3:', " gs 'jo9_meiki_state', '" + n + "', 1");
    check(boot, 'qa_popups = ' + x.expectedPopup, 'repeat_popup_not_added_' + (i + 1));
    check(boot, f('virginity') + ' = ' + x.expectedVirginity + ' and ' + f('jo9_meiki_known') + ' = ' + x.expectedKnown, 'repeat_state_stable_' + (i + 1));
    if (x.grant) check(boot, f('sub_vaginal') + ' = 1', 'grant_not_repeated_' + (i + 1));
    boot.push('end');
    check(boot, f('jo9_focus') + ' = -1', 'unrelated_trait_preserved_' + (i + 1));
  }
  check(boot, "sparks = 1234 and master_health = 88 and master_energy = 4 and day = 100 and jo9_cruel_mercy = 2 and jo9_cruel_mercy_half = 1 and unique_slave['erza'] = 1", 'external_sentinels_' + (i + 1));
});
boot.push("msg '" + MARKER + "'");
const fl = doc.lines.slice(0, 4); let count = 0;
function add(n, text) { fl.push(C.shift(n, -5), '', C.shift(Array.isArray(text) ? text.join('\r\n') : text, -5), C.shift('0', -5)); count++; }
add('Start', "gt 'CoreQATraitsBoot'");
add('CoreQATraitsBoot', boot);
add('jo9_traits_value', sourceValue);
add('jo9_meiki_state', stateBody);
add('jo9_meiki_checks', checksBody);
fl[3] = C.shift(String(count), -5); fl.push('');
const fixture = Buffer.from(fl.join('\r\n'), 'utf16le');
assert.equal(C.parse(fixture).locations.length, count);
const meta = { source: SOURCE, sourceSha256: doc.hash, seedPath, seedSha256: C.hash(seedRaw), seedAge: seed.seed_age, initialState: seed.seed_virginity,
  diagnosticRoot: T, fixtureSha256: C.hash(fixture), appearanceRoles: roles, discoveryRoles: meikiRoles, cases, sourceAssertions: assertions.length,
  exactProductionCode: ['jo9_traits_value full body', 'jo9_meiki_checks full body', 'jo9_meiki_state full body except diagnostic popup and random boundary substitution'],
  diagnosticChanges: ['Popup msg is replaced by a numeric emission counter and name capture; no text is displayed.', 'Six existing rand1..100 checks use a fixture-selected deterministic value and count calls; original threshold5 is unchanged.', 'Synthetic numeric actor arrays and native constants match adult seed_age0; no normal gameplay initialization or images.'],
  limits: ['Numeric/handler fixture, not a personal-save or rendered UI test.', 'The popup branch is counted; modal close/keyboard behavior is not retested.', '5/6 are threshold tests, not a statistical random-distribution estimate.'], productionWrites: false, fullWrites: false, savedGamesReadOrWritten: false };
fs.mkdirSync(T, { recursive: true }); fs.writeFileSync(T + '/traits.qsp', fixture);
fs.copyFileSync(W + '/config.xml', T + '/config.xml');
fs.writeFileSync(T + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plan = [{ name: 'erza-traits', file: T + '/traits.qsp', marker: MARKER, checkpoint: 'Actual shared appearance and state handlers:9roles/6roles, hidden states, legacy correction, one-time grant, popup counter and ordinary5percent boundary' }];
fs.writeFileSync(T + '/plan.json', JSON.stringify(plan, null, 2) + '\n');
fs.writeFileSync(__dirname + '/native-traits-prepared.json', JSON.stringify(meta, null, 2) + '\n');
if (mode === 'prepare') { console.log(JSON.stringify({ prepared: true, sourceSha256: doc.hash, cases: cases.length, assertions: assertions.length, diagnosticRoot: T })); process.exit(0); }
assert.equal(mode, 'run');
const began = Date.now();
const run = cp.spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', RUNNER, '-Engine', W + '/engine/jack.exe', '-Plan', T + '/plan.json', '-TimeoutSeconds', '30'], { windowsHide: true, encoding: 'utf8', timeout: 45000 });
const results = fs.existsSync(T + '/client-results.json') ? JSON.parse(fs.readFileSync(T + '/client-results.json', 'utf8').replace(/^\uFEFF/, '')) : [];
const log = fs.existsSync(T + '/erza-traits-stderr.log') ? fs.readFileSync(T + '/erza-traits-stderr.log', 'utf8') : '';
const report = { ...meta, nativeResults: results, runnerStatus: run.status, runnerError: run.error?.message, durationMs: Date.now() - began,
  engineMessages: log.split(/\r?\n/).filter(s => /showMessage\(\)|FAIL_ERZA_TRAITS|Error|error|Ошибка/.test(s)).slice(0, 24),
  productionBeforeSha256: productionBefore, productionAfterSha256: C.hash(fs.readFileSync(W + '/jack.qsp')), sourceAfterSha256: C.hash(fs.readFileSync(SOURCE)), seedAfterSha256: C.hash(fs.readFileSync(seedPath)),
  pass: run.status === 0 && results.length === 1 && results.every(x => x.pass) && C.hash(fs.readFileSync(SOURCE)) === doc.hash && C.hash(fs.readFileSync(seedPath)) === C.hash(seedRaw) && C.hash(fs.readFileSync(W + '/jack.qsp')) === productionBefore };
fs.writeFileSync(__dirname + '/native-traits-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pass: report.pass, sourceSha256: doc.hash, cases: cases.length, sourceAssertions: assertions.length, nativeResults: results, engineMessages: report.engineMessages }));
assert(report.pass, 'Native trait fixture failed; inspect native-traits-report.json');
