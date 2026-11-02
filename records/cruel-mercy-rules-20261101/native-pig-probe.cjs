'use strict';
// Diagnostic-only execution. Production files and personal saves are read-only.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const C = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const W = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const T = 'G:/Codex/tmp/cruel-mercy-rules-20261101-pig-native';
const SOURCE = process.env.JO9_QA_SOURCE || 'G:/Codex/tmp/cruel-mercy-rules-20261101/candidate.qsp';
const EXPECTED = process.env.JO9_QA_SOURCE_SHA || JSON.parse(fs.readFileSync('G:/Codex/tmp/cruel-mercy-rules-20261101/prepared.json','utf8')).after;
const MARKER = 'JO9_QA_CMPIG20261101_pig_complete_COMPLETE';
const RUNNER = 'G:/somi/JO9sa/tools/qa/run-client-smoke.ps1';
const mode = process.argv[2] || 'prepare';
const raw = fs.readFileSync(SOURCE), doc = C.parse(raw);
assert.equal(doc.hash, EXPECTED);
const productionBefore = C.hash(fs.readFileSync(W + '/jack.qsp'));
const bodies = new Map(doc.locations.map(l => [l.name, C.shift(doc.lines[l.body], 5)]));
const interaction = bodies.get('interaction');
const at = interaction.indexOf('if interaction = 6007:');
const next = interaction.indexOf('if interaction = 6008:', at);
assert(at >= 0 && next > at);
const body = interaction.slice(at, next);
assert.equal((body.match(/gs 'jo9_cruel_mercy_apply', -1/g) || []).length, 3);
const stat = bodies.get('#static_base');
const swapAt = stat.indexOf('$swap_slave_instances = {');
const clearAt = stat.indexOf('$clear_slave_instance = {', swapAt);
const swap = stat.slice(swapAt, clearAt).trim();
assert(swap.startsWith('$swap_slave_instances = {') && swap.endsWith('}'));
const countedSwap = swap.replace('$swap_slave_instances = {', '$swap_slave_instances = {\r\n qa_swap_count += 1');
const helper = bodies.get('jo9_cruel_mercy_apply');
assert(helper && helper.includes('jo9_cruel_mercy_half'));

const cases = [
  { name: 'fog-broken', origin: 61131, psy: 'broken', intellect: 3, state: 1, moral: 5, pig: 0, flags: [1, 0], half: -1 },
  { name: 'fog-low-intellect', origin: 61131, psy: 'normal', intellect: 1, state: 1, moral: 5, pig: 0, flags: [1, 0], half: -1 },
  { name: 'fog-faint', origin: 61131, psy: 'normal', intellect: 3, state: 2, moral: 0, pig: 0, flags: [0, 0], half: -1 },
  { name: 'fog-other', origin: 61131, psy: 'normal', intellect: 3, state: 1, moral: 5, pig: 0, flags: [1, 0], half: -1 },
  { name: 'ordinary-stale-hunting', origin: 0, psy: 'normal', intellect: 3, state: 1, moral: 5, pig: 0, flags: [1, 0], half: 0 },
  { name: 'ordinary-occupied-back-navigation', origin: 0, psy: 'normal', intellect: 3, state: 1, moral: 5, pig: 1, flags: [1, 0], half: 0 },
  { name: 'fog-fight-back-gt', origin: 61131, psy: 'normal', intellect: 3, state: 1, moral: 0, pig: 0, flags: [0, 0], half: 0, resistance: true }
];
const checks = [];
function failUnless(lines, pass, label) {
  checks.push(label);
  const i = checks.length;
  lines.push("if (" + pass + ") = 0: msg 'FAIL_CM_PIG_" + i + '_' + label + "|case=<<qa_case>>|whole=<<jo9_cruel_mercy>>|half=<<jo9_cruel_mercy_half>>|swaps=<<qa_swap_count>>|origin=<<interaction_city>>|subject=<<pig[\"qa_subject\"]>>' & exit");
}
const boot = [
  'killall', 'usehtml = 1', "CONST_INT['no_slave'] = 0", "CONST_INT['slave_exist'] = 1", "CONST_INT['slave_faint'] = 2",
  "$slave_vars[0] = 'instance'", "$slave_vars[1] = 'instance_state'", "$slave_vars[2] = 'instance_type'", "$slave_vars[3] = 'instance_rate'", "$slave_vars[4] = '$instance_name'",
  "$update_slave_features_list = ''", "$master_energy_drop = 'master_energy -= 1 & qa_energy_drops += 1'",
  "$dyn_slave_forced = 'qa_forced += 1'", "$slave_fights_back = {qa_fought = 1 & gt 'CoreQAPigAbort'}",
  countedSwap, 'qa_case = 0', "gt 'CoreQAPigNext'"
];
const setup = [
  "killvar 'slave'", "killvar 'pig'", "killvar 'slave_rate'", "killvar 'pig_rate'", "killvar '$slave'", "killvar '$pig'",
  "killvar '$text'", "killvar '$special_action'", "killvar '$bg_path'", "killvar 'rebell'",
  'interaction = 6007', 'hunting_prize = 1', 'jo9_cruel_mercy = 0', 'jo9_cruel_mercy_half = 0',
  'master_energy = 5', 'master_supermacy = 0', 'master_style = 0', 'master_hygiene_rate = 0', 'house_mess_rate = 0',
  'qa_swap_count = 0', 'qa_fought = 0', 'qa_forced = 0', 'qa_energy_drops = 0', 'show_pig_fullimage = 0', 'show_slave_fullimage = 0',
  "slave['qa_subject'] = 501", "pig['qa_subject'] = 0", "slave['ego'] = 3", "slave['gladiatrix'] = 10", "slave['courage'] = 0",
  "slave_type = 9001", "pig_type = 0", "$slave_name = 'Subject'", "$pig_name = ''"
];
for (let i = 0; i < cases.length; i++) {
  const x = cases[i];
  setup.push('if qa_case = ' + (i + 1) + ':', ' interaction_city = ' + x.origin, " $slave_psy_status = '" + x.psy + "'", " slave['intellect'] = " + x.intellect,
    ' slave_state = ' + x.state, " slave['moral'] = " + x.moral, ' pig_state = ' + x.pig,
    ' qa_expected_half = ' + x.half, ' qa_expected_resistance = ' + (x.resistance ? 1 : 0), ' qa_expected_show_pig = ' + x.flags[0], ' qa_expected_show_slave = ' + x.flags[1],
    ' qa_expected_pig_state = ' + x.state, ' qa_expected_origin = 0', ' qa_expected_old_subject = ' + (x.pig ? 702 : 0));
  if (x.pig) setup.push(" pig['qa_subject'] = 702", ' pig_type = 9002', "$pig_name = 'FormerPig'");
  setup.push('end');
}
const nextBody = ["qa_case += 1", 'if qa_case > ' + cases.length + ':', " msg '" + MARKER + "'", ' exit', 'end', "gs 'CoreQAPigSetup'", "gt 'CoreQAPigBody'"];
const after = [];
failUnless(after, 'qa_expected_resistance = 0', 'resistance_must_gt_before_callback');
failUnless(after, 'interaction_city = qa_expected_origin', 'origin_consumed');
failUnless(after, 'qa_swap_count = 0 and jo9_cruel_mercy = 0 and jo9_cruel_mercy_half = 0', 'no_early_commit');
after.push('dynamic $special_action[1]');
failUnless(after, 'qa_swap_count = 1', 'actual_swap_once');
failUnless(after, "pig['qa_subject'] = 501 and slave['qa_subject'] = qa_expected_old_subject", 'subject_and_former_pig_swapped');
failUnless(after, 'pig_state = qa_expected_pig_state', 'actual_pig_state');
failUnless(after, 'jo9_cruel_mercy = 0 and jo9_cruel_mercy_half = qa_expected_half', 'correct_half_point_commit');
failUnless(after, 'show_pig_fullimage = qa_expected_show_pig and show_slave_fullimage = qa_expected_show_slave', 'initial_display_flags');
after.push('if qa_case <= 4:');
failUnless(after, 'instr($special_action[1], "swap_slave_instances") = 0 and instr($special_action[1], "jo9_cruel_mercy_apply") = 0', 'pending_callback_consumed');
after.push(' for qa_redraw = 1 to 3:', '  show_pig_fullimage = 98', '  show_slave_fullimage = 0', '  dynamic $special_action[1]');
failUnless(after, 'qa_swap_count = 1 and jo9_cruel_mercy = 0 and jo9_cruel_mercy_half = -1', 'three_redraws_no_repeat_commit');
failUnless(after, 'show_pig_fullimage = qa_expected_show_pig and show_slave_fullimage = qa_expected_show_slave', 'three_redraws_restore_flags');
after.push(' end', 'end', 'if qa_case = 6:', ' dynamic $special_action[2]');
failUnless(after, "$text[2] ! 'placeholder' and show_slave_fullimage = 1 and show_pig_fullimage = 0", 'ordinary_second_page_retained');
after.push(' dynamic $special_action[1]');
failUnless(after, 'qa_swap_count = 1 and jo9_cruel_mercy = 0 and jo9_cruel_mercy_half = 0', 'ordinary_back_no_fog_score');
failUnless(after, 'show_pig_fullimage = 1 and show_slave_fullimage = 0', 'ordinary_back_flags');
after.push('end', "gs 'CoreQAPigObserve'", "gt 'CoreQAPigNext'");
const abort = [];
failUnless(abort, 'qa_expected_resistance = 1 and qa_fought = 1', 'real_gt_resistance_boundary');
failUnless(abort, 'qa_swap_count = 0 and jo9_cruel_mercy = 0 and jo9_cruel_mercy_half = 0', 'resistance_no_score_or_swap');
failUnless(abort, "slave['qa_subject'] = 501 and pig['qa_subject'] = 0", 'resistance_subject_unchanged');
failUnless(abort, 'interaction_city = 0', 'resistance_origin_already_consumed');
abort.push("gs 'CoreQAPigObserve'", "gt 'CoreQAPigNext'");
const observe = ["*pl 'QA_CM_PIG_OBS|case=<<qa_case>>|whole=<<jo9_cruel_mercy>>|half=<<jo9_cruel_mercy_half>>|swaps=<<qa_swap_count>>|origin=<<interaction_city>>|subject=<<pig[\"qa_subject\"]>>|resisted=<<qa_fought>>'"].join('\r\n');
const fixtureLines = doc.lines.slice(0, 4);
fixtureLines[3] = C.shift('0', -5);
let locationCount = 0;
function add(name, text) {
  fixtureLines.push(C.shift(name, -5), '', C.shift(Array.isArray(text) ? text.join('\r\n') : text, -5), C.shift('0', -5));
  locationCount++;
}
add('Start', "gt 'CoreQAPigBoot'");
add('CoreQAPigBoot', boot);
add('CoreQAPigNext', nextBody);
add('CoreQAPigSetup', setup);
add('CoreQAPigBody', body + "\r\ngt 'CoreQAPigAfter'");
add('CoreQAPigAfter', after);
add('CoreQAPigAbort', abort);
add('CoreQAPigObserve', observe);
add('jo9_cruel_mercy_apply', helper);
for (const n of ['#var_base', '#txt_man', '#txt_2_man']) add(n, '! Diagnostic dependency stub: no UI or unrelated derived-text refresh.');
fixtureLines[3] = C.shift(String(locationCount), -5);
fixtureLines.push('');
const fixture = Buffer.from(fixtureLines.join('\r\n'), 'utf16le');
assert.equal(C.parse(fixture).locations.length, locationCount);
const prepared = {
  source: SOURCE, sourceSha256: doc.hash, fixtureSha256: C.hash(fixture), diagnosticRoot: T,
  cases, checks, exactCopiedProductionCode: ['Complete6007 conditional block including original delayed callbacks/resistance/effects', 'jo9_cruel_mercy_apply body', 'swap_slave_instances primitive with one diagnostic call-counter prefix'],
  diagnosticReplacements: ['Standalone minimal Start/bootstrap and fixed subjects', '#var_base/#txt_man/#txt_2_man no-op dependency stubs', 'Empty update_features dynamic; dragging/forced effect counters; fight-back GT intercept instead of actual battle'],
  limitations: ['No normal interaction initialization or rendered narrative/image.', 'No full private-room/trait-derived-text recalculation.', 'The native test checks the requested callback/bookkeeping boundary; it is not a full gameplay UI test.'],
  correctedDiagnosticIssue: 'The first fixture redundantly listed instance and $instance in the swap-variable list. QSP numeric/string access shares a variable, so this swapped the subject array twice. The corrected list uses the actual distinct $instance_name field. This was a fixture issue, not a candidate failure.',
  productionWrites: false, savedGamesReadOrWritten: false
};
fs.mkdirSync(T, { recursive: true });
fs.writeFileSync(T + '/pig.qsp', fixture);
fs.copyFileSync(W + '/config.xml', T + '/config.xml');
fs.writeFileSync(T + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plan = [{ name: 'pig-boundary', file: T + '/pig.qsp', marker: MARKER, checkpoint: 'Seven actual6007 native callback/state boundaries; four fog success branches, redrawx3, ordinary controls and resistance GT' }];
fs.writeFileSync(T + '/plan.json', JSON.stringify(plan, null, 2) + '\n');
fs.writeFileSync(__dirname + '/native-pig-prepared.json', JSON.stringify(prepared, null, 2) + '\n');
if (mode === 'prepare') { console.log(JSON.stringify({ prepared: true, cases: cases.length, sourceSha256: doc.hash, diagnosticRoot: T })); process.exit(0); }
assert.equal(mode, 'run');
const started = Date.now();
const runner = cp.spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', RUNNER, '-Engine', W + '/engine/jack.exe', '-Plan', T + '/plan.json', '-TimeoutSeconds', '20'], { windowsHide: true, encoding: 'utf8', timeout: 35000 });
const results = fs.existsSync(T + '/client-results.json') ? JSON.parse(fs.readFileSync(T + '/client-results.json', 'utf8').replace(/^\uFEFF/, '')) : [];
const engineLog = fs.existsSync(T + '/pig-boundary-stderr.log') ? fs.readFileSync(T + '/pig-boundary-stderr.log', 'utf8') : '';
const report = { ...prepared, nativeResults: results, runnerStatus: runner.status, runnerError: runner.error?.message, durationMs: Date.now() - started,
  engineMessages: engineLog.split(/\r?\n/).filter(s => /showMessage\(\)|FAIL_CM_PIG|Error|error|Ошибка/.test(s)).slice(0, 30),
  productionBeforeSha256: productionBefore, productionAfterSha256: C.hash(fs.readFileSync(W + '/jack.qsp')), sourceAfterSha256: C.hash(fs.readFileSync(SOURCE)),
  observations: [...new Set((engineLog.match(/QA_CM_PIG_OBS[^<\r\n]*/g) || []))],
  pass: runner.status === 0 && results.length === 1 && results.every(x => x.pass) && C.hash(fs.readFileSync(SOURCE)) === doc.hash && C.hash(fs.readFileSync(W + '/jack.qsp')) === productionBefore };
fs.writeFileSync(__dirname + '/native-pig-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pass: report.pass, cases: cases.length, nativeResults: results, sourceSha256: doc.hash, engineMessages: report.engineMessages }));
assert(report.pass, 'Native pig fixture failed; inspect native-pig-report.json');
