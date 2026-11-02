'use strict';
// Prepare isolated native probes; this script never launches the game engine.
// Examples: node native.cjs --phase red
//           node native.cjs --phase green --trophy
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const REPO = 'G:/somi/JO9sa';
const TMP = 'G:/Codex/tmp/spawn-stage-image-fix-20261030';
const WORK = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const core = require(REPO + '/tools/text-workshop/core.cjs');
const qa = require(REPO + '/tools/qa/release-check.cjs');
const quote = s => "'" + String(s).replaceAll("'", "''") + "'";
const stages = [
  {key:'young', id:'исчадие_молодь', avatar:'spawn_young_ava.png', standing:'spawn_young.png', defeated:'spawn_young.png'},
  {key:'mature', id:'исчадие', avatar:'spawn_ava.png', standing:'spawn.png', defeated:'spawn.png'},
  {key:'giant', id:'чудовщиное_исчадие', avatar:'spawn_giant_ava.png', standing:'spawn_giant.png', defeated:'spawn_giant.png'},
  {key:'arena', id:'исчадие_арены', avatar:'spawn_ava.png', standing:'gladiator_spawn.png', defeated:'gladiator_spawn.png'}
];
const statProperties = [
  ['hp', 'базовое_здоровье'],
  ['endurance', 'базовая_выносливость'],
  ['spirit', 'базовый_дух'],
  ['damage', 'базовый_вред']
];
const liveSentinels = [
  ['здоровье_игрока',83], ['выносливость_игрока',74], ['дух_игрока',65],
  ['здоровье_врага[1]',47], ['выносливость_врага[1]',36], ['дух_врага[1]',25],
  ["jo9_fate['phase']",2], ["jo9_fate['count']",3], ['sparks',1234]
];
function body(doc, name) {
  const loc = doc.locations.find(x => x.name === name);
  assert(loc, 'Missing required location: ' + name);
  return core.shift(doc.lines[loc.body], 5);
}
function baselineNumber(doc, id, property) {
  const prefix = property + '[' + quote(id) + ']';
  const lines = body(doc, '#противники').split(/\r?\n/).filter(s => s.trimStart().startsWith(prefix));
  assert.equal(lines.length, 1, 'Expected one literal definition for ' + prefix);
  const match = lines[0].slice(lines[0].indexOf('=') + 1).trim().match(/^-?\d+$/);
  assert(match, 'Expected a literal integer for ' + prefix);
  return Number(match[0]);
}
function parseArgs(args) {
  const o = {trophy:false};
  for (let i=0; i<args.length; i++) {
    if (args[i] === '--trophy') o.trophy = true;
    else if (args[i] === '--phase' || args[i] === '--out') {
      assert(args[i+1] && !args[i+1].startsWith('--'), 'Missing value for ' + args[i]);
      o[args[i].slice(2)] = args[++i];
    } else throw Error('Unknown argument: ' + args[i]);
  }
  assert(['red','green'].includes(o.phase), '--phase red or --phase green is required');
  o.out = path.resolve(o.out || path.join(TMP, 'native-' + o.phase));
  const rel = path.relative(path.resolve(TMP), o.out);
  assert(rel && !rel.startsWith('..') && !path.isAbsolute(rel), 'Output must be a new child of the task temporary directory');
  return o;
}
function makeCode(baseline, options) {
  const phase = options.phase;
  const code = [
    'killall', 'settimer 0', "$counter=''", "$ongload=''", "$onnewloc=''", 'snk_room_target=0',
    'qa_spawn_checks=0', 'qa_spawn_failures=0', 'qa_spawn_path_checks=0', 'qa_spawn_path_failures=0',
    'qa_spawn_stat_checks=0', 'qa_spawn_stat_failures=0', 'qa_spawn_live_checks=0', 'qa_spawn_live_failures=0',
    'qa_spawn_trophy_checks=0', 'qa_spawn_trophy_failures=0', "$qa_spawn_failed_keys=''",
    '$qa_spawn_phase=' + quote(phase), 'количество_врагов=1'
  ];
  const expected = [];
  function check(key, expression, value, category, stringValue=false) {
    const variable = (stringValue?'$':'') + key;
    code.push(variable + '=' + expression);
    code.push('qa_spawn_checks+=1 & qa_spawn_' + category + '_checks+=1');
    code.push('if ' + variable + ' ! ' + (stringValue?quote(value):value) + ': qa_spawn_failures+=1 & qa_spawn_' + category + '_failures+=1 & $qa_spawn_failed_keys+=' + quote(key+'|'));
    expected.push({key, category, stringValue, expected:value, expression});
  }
  for (const [reference,value] of liveSentinels) code.push(reference + '=' + value);
  code.push("gs '#противники'");
  for (const stage of stages) {
    code.push('$враг[1]=' + quote(stage.id));
    check('qa_spawn_' + stage.key + '_avatar', '$аватара_моба[' + quote(stage.id) + ']', 'content/pic/mob/' + stage.avatar, 'path', true);
    check('qa_spawn_' + stage.key + '_standing', "$func('jo9_battle_fate','sprite',1,0)", 'content/pic/mob/' + stage.standing, 'path', true);
    check('qa_spawn_' + stage.key + '_defeated', "$func('jo9_battle_fate','sprite',1,1)", 'content/pic/mob/defeated/' + stage.defeated, 'path', true);
    for (const [key,property] of statProperties) {
      check('qa_spawn_' + stage.key + '_' + key, property + '[' + quote(stage.id) + ']', baselineNumber(baseline, stage.id, property), 'stat');
    }
  }
  liveSentinels.forEach(([reference,value],index) => check('qa_spawn_live_' + index, reference, value, 'live'));
  if (options.trophy) {
    code.push('*clr', 'trophy_youngfiend=1', 'trophy_maturefiend=1', 'trophy_hugefiend=1', 'trophy_arenafiend=1', "gs 'trophy_room'");
    code.push("$qa_spawn_trophy_html=$replace($maintxt,'\\','/')");
    for (const [key,div,avatar] of [
      ['young','trophy_room_youngfiend','spawn_young_ava.png'],
      ['mature','trophy_room_maturefiend','spawn_ava.png'],
      ['giant','trophy_room_hugefiend','spawn_giant_ava.png'],
      ['arena','trophy_room_arenafiend','spawn_ava.png']
    ]) {
      const needle = 'id = "' + div + '"><img src="content/pic/mob/' + avatar + '"';
      check('qa_spawn_trophy_' + key, 'iif(instr($qa_spawn_trophy_html,' + quote(needle) + ')>0,1,0)', 1, 'trophy');
    }
  }
  const expectedPathFailures = phase === 'red' ? 6 : 0;
  const expectedTrophyFailures = phase === 'red' && options.trophy ? 2 : 0;
  code.push('qa_spawn_expected_path_failures=' + expectedPathFailures);
  code.push('qa_spawn_expected_trophy_failures=' + expectedTrophyFailures);
  code.push('qa_spawn_expected_failures=' + (expectedPathFailures + expectedTrophyFailures));
  code.push('savegame ' + quote('spawn-' + phase + '.sav'));
  const marker = 'JO9_QA_SPAWN_STAGE_' + phase.toUpperCase() + (phase==='red'?'_EXPECTED_FAIL':'_PASS') + '_COMPLETE';
  const condition = 'qa_spawn_checks=' + expected.length + ' and qa_spawn_path_checks=12 and qa_spawn_stat_checks=16 and qa_spawn_live_checks=' + liveSentinels.length + ' and qa_spawn_failures=qa_spawn_expected_failures and qa_spawn_path_failures=qa_spawn_expected_path_failures and qa_spawn_trophy_failures=qa_spawn_expected_trophy_failures and qa_spawn_stat_failures=0 and qa_spawn_live_failures=0';
  code.push('if ' + condition + ':', ' msg ' + quote(marker), 'else', " msg 'JO9_QA_SPAWN_STAGE_UNEXPECTED_RESULT'", 'end', 'exit');
  return {code:code.join('\r\n'), marker, expected, expectedPathFailures, expectedTrophyFailures, expectedFailures:expectedPathFailures+expectedTrophyFailures};
}
function prepare(options) {
  const baselineFile = process.env.JO9_MOB_STAGE_STAT_BASELINE || path.join(TMP, 'before.qsp');
  const sourceFile = path.join(TMP, options.phase==='red'?'before.qsp':'candidate.qsp');
  const baselineRaw = fs.readFileSync(baselineFile);
  const sourceRaw = fs.readFileSync(sourceFile);
  const baseline = core.parse(baselineRaw);
  const doc = core.parse(sourceRaw);
  qa.inspectWorld(baselineRaw);
  qa.inspectWorld(sourceRaw);
  for (const name of ['Start','#противники','jo9_battle_fate']) body(doc, name);
  if (options.trophy) body(doc, 'trophy_room');
  const probe = makeCode(baseline, options);
  const originalLines = doc.lines.slice();
  const start = doc.locations.find(x => x.name==='Start');
  doc.lines[start.body] = core.shift(probe.code, -5);
  const diagnostic = core.serialize(doc);
  qa.inspectWorld(diagnostic);
  assert(core.serialize(core.parse(diagnostic)).equals(diagnostic), 'Diagnostic byte roundtrip failed');
  const modified = doc.locations.filter(loc => doc.lines[loc.body] !== originalLines[loc.body]);
  const changedFields = doc.lines.map((line,index) => line===originalLines[index] ? -1 : index).filter(index => index>=0);
  assert.deepEqual(changedFields, [start.body], 'Only the diagnostic Start body field may change');
  assert.deepEqual(modified.map(loc=>loc.name), ['Start'], 'Only diagnostic Start may change');
  const protectedInputs = [REPO, WORK, path.join('G:/somi/JO9O')];
  qa.assertOutside(options.out, protectedInputs);
  assert(!fs.existsSync(options.out), 'Refusing to overwrite existing diagnostic directory: ' + options.out);
  fs.mkdirSync(options.out, {recursive:true});
  fs.writeFileSync(path.join(options.out,'FastQSP.ini'), '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
  const file = path.join(options.out,'spawn-' + options.phase + '.qsp');
  fs.writeFileSync(file, diagnostic);
  const plan = [{name:'spawn-' + options.phase, file, marker:probe.marker, checkpoint:'Real #противники + real jo9_battle_fate sprite; no battle entry/result location reexecution'}];
  fs.writeFileSync(path.join(options.out,'plan.json'), JSON.stringify(plan,null,2)+'\n');
  const manifest = {
    schema:1, phase:options.phase, preparedAt:new Date().toISOString(), sourceFile, sourceHash:core.hash(sourceRaw),
    baselineFile, baselineHash:core.hash(baselineRaw), diagnosticFile:file, diagnosticHash:core.hash(diagnostic),
    onlyDiagnosticStartChanged:true, engineExecutedByGenerator:false, userSaveLoaded:false,
    cases:1, pathAssertions:12, statAssertions:16, liveStateAssertions:liveSentinels.length,
    trophyAssertions:options.trophy?4:0, totalAssertions:probe.expected.length,
    expectedPathFailures:probe.expectedPathFailures, expectedTrophyFailures:probe.expectedTrophyFailures,
    expectedFailures:probe.expectedFailures, marker:probe.marker, saveFile:path.join(options.out,'spawn-'+options.phase+'.sav'),
    expectedVariables:probe.expected,
    redMeaning:'Image assertions for young and giant deliberately fail against the old shared paths; completion requires exactly those six failures, plus two trophy failures if enabled. All other assertions must pass.',
    greenMeaning:'All path, baseline stats, live-state sentinels and optional trophy checks must pass.',
    supplementaryPlans:[
      {name:'body-img-output', required:false, executed:false, approach:'After the actual dictionary/sprite checks, evaluate only the existing img output expressions copied from боевой_интерфейс and конец_боя in an isolated Start. Inspect $maintxt. Do not GS/GT either whole battle location.', sourceExpressions:['боевой_интерфейс: $силуэт_моба[$враг[текущий]] img','боевой_интерфейс: $аватара_моба[$враг[текущий]] img','конец_боя: local $jo9_bv_image img with data-standing fallback']},
      {name:'trophy-output', required:false, prepared:options.trophy, switch:'--trophy', approach:'Fresh diagnostic state only: set four trophy flags, call the unchanged real trophy_room once, normalize its $maintxt slashes and assert four id+img src fragments.'}
    ],
    limits:['No engine process is launched by this generator.','No production files, original saves or source QSP files are written.','Only isolated Start is replaced; actual dictionary and sprite functions remain unchanged.','Path strings are tested; asset existence, image quality and GUI layout are not tested here.','No full battle, existing-save loading, rewards, damage or outcome processing is exercised.']
  };
  fs.writeFileSync(path.join(__dirname,'native-prepared-'+options.phase+'.json'),JSON.stringify(manifest,null,2)+'\n');
  assert.equal(core.hash(fs.readFileSync(sourceFile)),core.hash(sourceRaw),'Input source changed');
  assert.equal(core.hash(fs.readFileSync(baselineFile)),core.hash(baselineRaw),'Input baseline changed');
  return {prepared:true,phase:options.phase,cases:1,assertions:manifest.totalAssertions,expectedFailures:manifest.expectedFailures,out:options.out,plan:path.join(options.out,'plan.json')};
}
if (require.main===module) {
  try { console.log(JSON.stringify(prepare(parseArgs(process.argv.slice(2))),null,2)); }
  catch (error) { console.error(error.stack || error.message); process.exitCode=1; }
}
module.exports={stages,statProperties,liveSentinels,parseArgs,makeCode,prepare};
