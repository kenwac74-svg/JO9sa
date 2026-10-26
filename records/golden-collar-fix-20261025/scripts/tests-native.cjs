'use strict';
// Focused engine fixtures. This file never edits a product QSP or user save.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const assert = require('assert/strict');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const ROOT = 'G:/Codex/tmp/jo9-golden-collar-fix-20261025';
const GAME = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const ROLES = ['slave', 'assistant', 'prisoner', 'cow', 'room1', 'room2', 'room3', 'room4'];
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback;
const candidatePath = option('--candidate', ROOT + '/candidate.qsp');
const beforePath = option('--before', ROOT + '/before.qsp');
const outputRoot = path.resolve(option('--out', ROOT + '/native-fixtures'));
const cr = s => s.replace(/\r?\n/g, '\r\n');
const quote = s => "'" + s.replaceAll("'", "''") + "'";
const model = file => {
  const raw = fs.readFileSync(file), parsed = core.parse(raw);
  return { raw, parsed, hash: core.hash(raw), body(name) {
    const location = parsed.locations.find(x => x.name === name);
    assert(location, 'Missing actual location ' + name);
    return core.shift(parsed.lines[location.body], 5);
  }};
};
const before = model(beforePath), candidate = model(candidatePath);
assert.equal(before.hash, 'be2c993d24911fec5edfc0efceee9d4bd570c2d9e3a511975a69e29e383ba898');
assert(candidate.body('#item_base').includes('GC_CHOICE_20261025'), 'Candidate callback marker absent');
const definition = (body, name) => {
  const start = body.indexOf(name + ' = {');
  assert(start >= 0, 'Missing actual dynamic definition ' + name);
  const end = body.indexOf('\r\n}', start);
  assert(end > start, 'Unterminated actual dynamic definition ' + name);
  return body.slice(start, end + 3);
};
const property = m => definition(m.body('#item_base'), "$item_property['golden_collar']");
const fail = label => `msg 'FAIL_${label}' & exit`;
const check = (condition, label) => `if ${condition}: ${fail(label)}`;
const economicCheck = [
  check('day ! 102 or end_day_phase ! 0 or sparks ! 20000', 'DAY_OR_MONEY_CHANGED'),
  check("jo9_lq['bill'] ! 375 or jo9_lq['active'] ! 0", 'BILL_STATE_CHANGED')
].join('\n');
const fixture = (m, locations) => {
  const lines = m.parsed.lines.slice(0, 4);
  lines[3] = core.shift(String(locations.length), -5);
  for (const [name, code] of locations) lines.push(core.shift(name, -5), core.shift('', -5), core.shift(cr(code), -5), core.shift('0', -5));
  lines.push('');
  const bytes = core.serialize({ lines });
  core.parse(bytes);
  return bytes;
};
const actorSetup = role => `${role}_state=1
${role}_type=${2570 + ROLES.indexOf(role)}
${role}['id']=${71000 + ROLES.indexOf(role)}
${role}['age']=2
${role}['passion_luxury']=0
${role}['obedience']=-1
${role}['beaten_ever']=0
${role}['beaten']=0
${role}['domini_dictum']=0
${role}['ego']=2
${role}['virtue']=3
${role}['sin']=1
${role}['calories']=50
${role}['stamina']=3
${role}['sensitivity']=1
${role}['hygiene']=2
${role}['wounds']=0
${role}['gladiatrix']=0
$${role}_name='QA ${role}'
$${role}_psy_status='arrogant'
$${role}['collar']='golden_collar'
${role}_inventory['golden_collar']=0`;
const commonSetup = m => `usehtml=1
$onnewloc=''
$counter=''
CONST_INT['no_slave']=0
CONST_INT['slave_exist']=1
CONST_INT['loli_age']=0
rebell['arrogant']=1
day=102
end_day_phase=0
sparks=20000
jo9_lq['bill']=375
jo9_lq['active']=0
master_str=2
master_fighter=1
master_supermacy=3
master_style=1
is_kid=0
snk_room_target=0
cont_atr_threshold[1]=10
$slave_good_mood[0]='qa_unused_mood'
$return_lock='qa_return'
${ROLES.map(actorSetup).join('\n')}
${property(m)}`;
// Deliberately a call sentinel, not a replacement simulation of real force or combat.
const stubHelpers = `$dyn_slave_forced={
 qa_force_calls+=1
 $qa_force_role='dynslave'
 dynslave['beaten_ever']=1
 dynslave['calories']-=1
}
$slave_fights_back={
 qa_fight_calls+=1
 gt 'начать_бой'
}`;
const realHelpers = m => ['$dyn_slave_forced', '$dyn_slave_damaged', '$sin_gained_now', '$slave_fights_back']
  .map(name => definition(m.body('#dynamic'), name)).join('\n');
const ordinaryLocations = (m, start, choice, arrival, actualForce = false) => [
  ['Start', start], ['choice_screen', choice], ['#item_base', m.body('#item_base')],
  ...['qa_return', 'menu_form', 'slave_stat', 'assistant_stat', 'prison_cell', 'начать_бой'].map(name => [name, arrival]),
  ...(actualForce ? [['$mood_drop', m.body('$mood_drop')]] : [])
];
fs.mkdirSync(outputRoot, { recursive: true });
fs.copyFileSync(GAME + '/config.xml', outputRoot + '/config.xml');
fs.writeFileSync(outputRoot + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plans = [], manualPlans = [];
function add(name, m, locations, checkpoint, expectedFailure = false, manual = false) {
  assert(/^[a-z-]+$/.test(name));
  const marker = 'JO9_QA_GC_' + name.replaceAll('-', '_') + '_COMPLETE';
  const file = path.join(outputRoot, name + '.qsp');
  fs.writeFileSync(file, fixture(m, locations.map(([n, text]) => {
    text = text.replaceAll('QA_COMPLETION_MARKER', marker);
    if (argv.includes('--trace')) {
      const safeName = n.replace(/[^a-z_]/gi, '_');
      text = `savegame '${name}-trace-${safeName}.sav'\n` + text;
      if (n === 'Start') {
        text = text.replace(/\ndynamic \$replace\(\$item_property/, `\nsavegame '${name}-trace-before-property.sav'\ndynamic $replace($item_property`);
        text = text.replace("$item_property['golden_collar'] = {", "$item_property['golden_collar'] = {\n savegame '" + name + "-trace-property-entry.sav'");
        text = text.replace('jo9_gc_seq += 1', "jo9_gc_seq += 1\n savegame '" + name + "-trace-after-seq.sav'");
        text = text.replace(/(\$yes = "! GC_CHOICE_20261025"[^\r\n]*)/, "$1\n savegame '" + name + "-trace-after-yes.sav'");
        text = text.replace(/(\$no = "! GC_CHOICE_20261025"[^\r\n]*)/, "$1\n savegame '" + name + "-trace-after-no.sav'");
      }
    }
    return [n, text];
  })));
  (manual ? manualPlans : plans).push({ name, file, marker, checkpoint, expectedFailure });
}
const runProperty = role => `dynamic $replace($item_property['golden_collar'], 'dyn'+'slave', '${role}')`;
const roleUnchanged = target => ROLES.filter(x => x !== target).map(role =>
  check(`${role}_inventory['golden_collar'] ! 0 or ${role}['calories'] ! 50 or ${role}['beaten_ever'] ! 0`, 'OTHER_ACTOR_' + role.toUpperCase())
).join('\n');
function standardCase(role, action, stale, actualForce = false) {
  const name = (actualForce ? 'manual-' : 'green-') + role.replace(/\d/, n => ['zero','one','two','three','four'][+n]) + '-' + action + '-' + stale;
  const m = candidate, selected = action === 'yes' ? '$yes' : '$no';
  const mutation = {
    normal: '', missing: `${role}_state=0`, identity: `${role}['id']+=100`, type: `${role}_type+=100`, collar: `$${role}['collar']='plain_pendant'`
  }[stale];
  const active = stale === 'normal', forced = active && action === 'yes';
  const expectedCollar = stale === 'collar' ? 'plain_pendant' : active && action === 'no' ? 'пусто' : 'golden_collar';
  const dest = role === 'slave' ? 'slave_stat' : role === 'assistant' ? 'assistant_stat' : 'qa_return';
  const outcome = [
    economicCheck, roleUnchanged(role),
    check(`$${role}['collar'] ! '${expectedCollar}'`, 'COLLAR'),
    check(`${role}_inventory['golden_collar'] ! ${active && action === 'no' ? 1 : 0}`, 'REFUND'),
    check(`${role}['beaten_ever'] ! ${forced ? 1 : 0} or ${role}['calories'] ! ${forced ? 49 : 50}`, 'FORCE_ACTOR'),
    ...(actualForce ? [check(`${role}['virtue'] ! 0 or ${role}['neg_forced'] ! 2 or ${role}_rate['bruises'] ! 10 or ${role}_rate['stamina'] ! -1 or master_str_rate ! 1`, 'REAL_FORCED_CONSEQUENCES')]
      : [check(`qa_force_calls ! ${forced ? 1 : 0} or qa_fight_calls ! 0`, 'HELPER_COUNTS'), ...(forced ? [check(`$qa_force_role ! '${role}'`, 'HELPER_ROLE')] : [])]),
    check("$yes ! '' or $no ! ''", 'CALLBACKS_NOT_CONSUMED')
  ].join('\n');
  const start = `${commonSetup(m)}\n${actualForce ? realHelpers(m) : stubHelpers}\n${runProperty(role)}\n${fail('NO_PROMPT')}`;
  const choice = `if qa_phase=0:
 if instr($yes,'GC_CHOICE_20261025')=0 or instr($no,'GC_CHOICE_20261025')=0: ${fail('MISSING_SAFE_CALLBACK')}
 $qa_saved_callback=${selected}
 ${mutation}
 qa_phase=1
 dynamic $qa_saved_callback
 ${fail('FIRST_CALLBACK_DID_NOT_GT')}
else
 if qa_phase ! 2: ${fail('UNEXPECTED_CHOICE')}
 dynamic $qa_saved_callback
 ${outcome}
 msg 'QA_COMPLETION_MARKER'
end`;
  const arrival = `if qa_phase ! 1: ${fail('REPLAY_NAVIGATED')}
${check(`$curloc ! '${dest}'`, 'WRONG_NATIVE_GT_DESTINATION')}
${outcome}
qa_phase=2
gt 'choice_screen'`;
  add(name, m, ordinaryLocations(m, start, choice, arrival, actualForce),
    `Exact candidate property/dispatch and native GT; ${role}, ${action}, ${stale}; replay original cached callback; unrelated actors/day/bill unchanged.`, false, actualForce);
}
for (const role of ROLES) for (const action of ['yes', 'no']) for (const stale of ['normal', 'missing', 'identity', 'type', 'collar']) standardCase(role, action, stale);
for (const role of ROLES) standardCase(role, 'yes', 'normal', true);

// Baseline red tests use the actual old callback and native GT, with no GT rewriting.
for (const bug of ['return', 'refund']) {
  const name = 'red-' + bug, m = before;
  const start = `${commonSetup(m)}\n${stubHelpers}\n$return_lock=${quote(bug === 'return' ? '' : 'qa_return')}\n${runProperty('prisoner')}\n${fail('NO_RED_PROMPT')}`;
  const choice = `$qa_saved_callback=$no\nqa_phase+=1\ndynamic $qa_saved_callback\n${fail('RED_CALLBACK_DID_NOT_GT')}`;
  const arrival = bug === 'return'
    ? `msg 'QA_COMPLETION_MARKER'`
    : `if qa_phase=1:\n ${check("prisoner_inventory['golden_collar'] ! 1", 'FIRST_REFUND')}\n gt 'choice_screen'\nend\n${check("prisoner_inventory['golden_collar'] ! 1", 'DUPLICATE_REFUND')}\nmsg 'QA_COMPLETION_MARKER'`;
  add(name, m, ordinaryLocations(m, start, choice, arrival),
    bug === 'return' ? 'Manual baseline reproduction: actual GT with empty destination; observe native location error. No timeout is accepted as proof.' : 'Must reach exact FAIL_DUPLICATE_REFUND after two actual baseline callbacks and native destination transfers.',
    true, bug === 'return');
}
// Actual menu prefix retains its original navigation guards and call ordering.
for (const [prefix, m, expectedFailure] of [['green', candidate, false], ['red', before, true]]) {
  const menu = m.body('menu_form'), at = menu.indexOf("gs '$newloc'");
  assert(at > 0);
  const start = `${commonSetup(m)}\nis_home=1\ncity_district=-1\nmenu_form=0\n$return_lock=''\ngt 'menu_form'`;
  add(prefix + '-menu-return-order', m, [['Start', start], ['menu_form', menu.slice(0, at) + "gs '$newloc'\n" + fail('NEWLOC_RETURNED')],
    ['$newloc', `${check("$return_lock ! 'menu_form'", 'RETURN_NOT_READY_BEFORE_RECALC')}\nmsg 'QA_COMPLETION_MARKER'`]],
  'Actual menu guards/prefix must establish return before GS $newloc; recalculation itself is an assertion stub.', expectedFailure);
}
// Threshold test proves branch selection and native transfer, not combat mechanics.
for (const [suffix, strength, expected] of [['equal', 2, 0], ['above', 3, 1]]) {
  const start = `${commonSetup(candidate)}\n${stubHelpers}\nslave['gladiatrix']=${strength}\n${runProperty('slave')}\n${fail('NO_BATTLE_PROMPT')}`;
  const choice = `qa_phase=1\ndynamic $yes\n${fail('NO_BRANCH_GT')}`;
  const arrival = `${economicCheck}\n${check(`qa_fight_calls ! ${expected} or qa_force_calls ! ${1 - expected}`, 'BATTLE_THRESHOLD_BRANCH')}\n${check(`$curloc ! '${expected ? 'начать_бой' : 'slave_stat'}'`, 'BATTLE_NATIVE_GT')}\n${check("$yes ! '' or $no ! ''", 'BATTLE_CALLBACKS_NOT_CONSUMED')}\nmsg 'QA_COMPLETION_MARKER'`;
  add('green-battle-' + suffix, candidate, ordinaryLocations(candidate, start, choice, arrival), 'Preserve strict gladiatrix > max(0, supremacy-style), with no additional force call after combat transfer.');
}
// A live second question must survive replay of the first question's stale callback.
{
  const start = `${commonSetup(candidate)}\n${stubHelpers}\n${runProperty('prisoner')}\n${fail('NO_FIRST_PROMPT')}`;
  const choice = `if qa_phase=0:
 $qa_first_callback=$no
 qa_phase=1
 dynamic $no
 ${fail('FIRST_NO_GT')}
elseif qa_phase=2:
 $qa_second_callback=$no
 qa_second_seq=jo9_gc_seq
 dynamic $qa_first_callback
 ${check('$no ! $qa_second_callback or jo9_gc_seq ! qa_second_seq', 'STALE_REPLAY_CONSUMED_SECOND')}
 ${check("cow_inventory['golden_collar'] ! 0 or $cow['collar'] ! 'golden_collar'", 'STALE_REPLAY_CHANGED_SECOND')}
 qa_phase=3
 dynamic $qa_second_callback
 ${fail('SECOND_NO_GT')}
else
 ${fail('UNEXPECTED_TWO_CHOICE_PHASE')}
end`;
  const arrival = `${economicCheck}
${check("$curloc ! 'qa_return'", 'TWO_NATIVE_DESTINATION')}
${check("prisoner_inventory['golden_collar'] ! 1 or $prisoner['collar'] ! 'пусто'", 'FIRST_RESOLUTION')}
if qa_phase=1:
 qa_phase=2
 ${runProperty('cow')}
 ${fail('NO_SECOND_PROMPT')}
end
${check("qa_phase ! 3 or cow_inventory['golden_collar'] ! 1 or $cow['collar'] ! 'пусто'", 'SECOND_RESOLUTION')}
${check('qa_force_calls ! 0 or qa_fight_calls ! 0', 'TWO_UNEXPECTED_HELPER')}
msg 'QA_COMPLETION_MARKER'`;
  add('green-two-live-refusers', candidate, ordinaryLocations(candidate, start, choice, arrival), 'Two actual property prompts; stale first callback cannot consume or mutate the live second question.');
}
if (argv.includes('--only')) {
  const selected = new RegExp(option('--only', ''));
  for (let i = plans.length - 1; i >= 0; i--) if (!selected.test(plans[i].name)) plans.splice(i, 1);
}
const manifest = {
  candidate: { path: candidatePath, sha256: candidate.hash }, before: { path: beforePath, sha256: before.hash },
  automaticCases: plans.length, realForceManualCases: manualPlans.filter(x => x.name.startsWith('manual-')).length,
  manualCases: manualPlans.length, outputRoot,
  boundaries: [
    'Exact golden_collar property and entire candidate #item_base dispatch; generated callbacks and native GT are not rewritten.',
    'Automatic force/combat helpers are explicit call sentinels, so automatic results do not validate real damage, native MSG, or combat gameplay.',
    'Separate manual force fixtures retain exact forced/damaged/sin definitions and $mood_drop; acknowledge native MSG, then terminal marker certifies deterministic real deltas and replay safety.',
    'Destination rendering and choice rendering are assertion stubs. No native pointer hitbox or game UI integration is established by automatic results.',
    'Day/sparks/bill invariants cover callback execution only; full next_day accounting, native save/load migration, role bridge swaps and actual old-save restoration require separate integration tests.',
    'Menu prefix test uses actual guards up to $newloc, with an assertion stub for recalculation.'
  ]
};
fs.writeFileSync(path.join(outputRoot, 'plan.json'), JSON.stringify(plans, null, 2) + '\n');
fs.writeFileSync(path.join(outputRoot, 'manual-force-plan.json'), JSON.stringify(manualPlans.filter(x => x.name.startsWith('manual-')), null, 2) + '\n');
fs.writeFileSync(path.join(outputRoot, 'manual-baseline-plan.json'), JSON.stringify(manualPlans.filter(x => !x.name.startsWith('manual-')), null, 2) + '\n');
fs.writeFileSync(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
if (argv.includes('--run')) {
  const run = cp.spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
    'G:/somi/JO9sa/tools/qa/run-client-smoke.ps1', '-Engine', GAME + '/engine/jack.exe',
    '-Plan', path.join(outputRoot, 'plan.json'), '-TimeoutSeconds', '3'],
  { encoding: 'utf8', windowsHide: true, timeout: Math.max(120000, plans.length * 5000), maxBuffer: 1000000 });
  const resultPath = path.join(outputRoot, 'client-results.json');
  const native = fs.existsSync(resultPath) ? JSON.parse(fs.readFileSync(resultPath, 'utf8').replace(/^\uFEFF/, '')) : [];
  const results = plans.map(test => {
    const observed = native.find(x => x.name === test.name);
    // Expected red must fail for the intended reason, never a missing file/timeout.
    const logFile = path.join(outputRoot, test.name + '-stderr.log');
    const log = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
    const intendedRed = test.name === 'red-refund' ? 'FAIL_DUPLICATE_REFUND'
      : test.name === 'red-menu-return-order' ? 'FAIL_RETURN_NOT_READY_BEFORE_RECALC' : null;
    const pass = !!observed && (test.expectedFailure
      ? !observed.pass && intendedRed !== null && log.includes('"' + intendedRed + '"')
      : observed.pass);
    return { name: test.name, expectedFailure: test.expectedFailure, pass, nativePass: observed?.pass ?? null, reason: observed?.reason ?? 'No engine result' };
  });
  const report = { ...manifest, results, status: results.every(x => x.pass) ? 'PASS' : 'FAIL',
    inputsUnchanged: core.hash(fs.readFileSync(candidatePath)) === candidate.hash && core.hash(fs.readFileSync(beforePath)) === before.hash,
    runnerExitCode: run.status };
  fs.writeFileSync(path.join(outputRoot, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, cases: results.length, passed: results.filter(x => x.pass).length,
    failed: results.filter(x => !x.pass), inputsUnchanged: report.inputsUnchanged, report: path.join(outputRoot, 'results.json') }));
  assert(report.inputsUnchanged, 'Input QSP changed during native test');
  process.exitCode = report.status === 'PASS' ? 0 : 1;
} else console.log(JSON.stringify({ status: 'PREPARED', ...manifest }));
