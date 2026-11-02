'use strict';
// Fields/hashes only: never emit narrative text or render character images.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const W = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const T = 'G:/Codex/tmp/erza-libido-audit-20261101-native';
const C = require(W + '/modtools/text-workshop/core.cjs');
const S = require(W + '/modtools/text-workshop/scenes.cjs');
const mode = process.argv[2] || 'prepare';
const marker = 'JO9_QA_ERZALIBIDO20261101_latent_COMPLETE';
const seedPath = W + '/json/slaves/2624_erza.json';
const seedRaw = fs.readFileSync(seedPath), seed = JSON.parse(seedRaw.toString('utf8').replace(/^\uFEFF/, ''));
assert.equal(seed.seed_nymphomania, 1);
assert.equal(Object.hasOwn(seed, 'seed_nymphomania_revealed'), false);
assert.equal(seed.seed_age, 0);
const raw = fs.readFileSync(W + '/jack.qsp'), doc = C.parse(raw);
const body = name => C.shift(doc.lines[doc.locations.find(loc => loc.name === name).body], 5);
const generation = body('generate_stock'), seedBody = body('get_stock_seed');
const sourceFunctions = ['generate_stock', 'get_stock_seed', 'stock_to_slave_nogt', '#static_base', '#dynamic', '#variative', 'jo9_traits', 'jo9_traits_value', 'jo9_meiki_state', 'jo9_chaotic'];
const functionHashes = Object.fromEntries(sourceFunctions.map(name => [name, C.hash(Buffer.from(body(name), 'utf8'))]));
const analysis = S.analyse('generate_stock', generation), randomAt = generation.indexOf("stock['nymphomania'] = rand(-1,1)");
assert.ok(randomAt >= 0);
const randomParents = analysis.blocks.filter(block => randomAt >= block.start && randomAt < block.end).map(block => ({ condition: block.condition, line: block.line }));
assert.ok(randomParents.some(block => block.condition === 'special_stock = 0'));
assert.ok(seedBody.includes("stock['nymphomania'] = seed_nymphomania[stock_type]"));
assert.ok(seedBody.includes("stock['nymphomania_revealed'] = seed_nymphomania_revealed[stock_type]"));
const audit = {
  date: new Date().toISOString(), qspHash: C.hash(raw), source: W + '/jack.qsp', sourceFunctionHashesUtf8: functionHashes,
  seed: { path: seedPath, sha256: C.hash(seedRaw), type: 2624, seed_nymphomania: 1, seed_nymphomania_revealedPresent: false, missingNumericSeedDefault: 0, seed_age: 0, contentsEmitted: false },
  currentDefinitionAlreadyMeetsRequest: true, productionChangesRequired: false, newSavedFieldsRequired: 0,
  randomOverwrite: { randomAssignmentIsInsideSpecialStockZero: true, enclosingConditions: randomParents, uniqueSpecialStock: 2624, uniqueGenerationSkipsRandomAssignment: true },
  hiddenDisplay: { location: '#static_base', gate: 'nymphomania > 0 and (nymphomania_revealed = 2 or spell_revelio = 1)', initial: { value: 1, revealed: 0 }, revealStates: { 0: 'hidden', 1: 'discovery notification pending', 2: 'discovered and visible' }, existingMagicRevealOverridePreserved: true },
  discoveryRoutes: [
    { location: 'interaction_result', condition: 'interaction result res>=0, orgastic>0, matching interaction_partner and current revealed0', effect: 'set actor revealed1' },
    { location: 'sex_interaction / sex_interaction_woman', condition: 'specific existing activity branch', effect: 'set session nymphomania_revealed1' },
    { location: 'sex_end', condition: 'session flag1 and actor revealed0', effect: 'set slave/assistant revealed1' },
    { location: '#static_base', condition: 'revealed1 and nymphomania!=0', effect: 'existing notification then revealed2' },
    { location: 'interaction:5609 / next_day specific branch', condition: 'existing branch and nonzero trait with revealed0', effect: 'set revealed1' }
  ],
  removal: { location: 'jo9_chaotic', ambiguousPoolContainsValues: [1, 2], negativePoolFirst: true, clearedFields: ['nymphomania', 'nymphomania_revealed', 'nymphomania_xp'], afterRemoval: [0, 0, 0], permanentPerActorRemovalTombstonePresent: false, currentUniqueRefreshRegrantHook: false, forceEveryRefreshWouldUndoRemoval: true, naturalLaterTrainingPreserved: 'Existing nymphomania_xp>200 can independently reacquire value1; removal resets xp0 so this is not an immediate refresh resurrection.' },
  legacySaves: { latentValue1Revealed0AlreadyWorks: true, preserveCurrentValue0: true, zeroStateIsAmbiguousBetweenNeverAssignedAndRemoved: true, guaranteedRetroactiveGrantIntoAllExistingZerosWouldNeedNewPerActorProvenance: true, recommendation: 'No grant or migration hook: seed already1. Preserve existing value0/removal intent; use the existing discovery path for current latent1 instances.' },
  sensitiveNarrativeEmitted: false, imagesOpenedOrRendered: false, productionWrites: 0, native: null
};
const reportPath = path.join(__dirname, 'erza-libido-audit.json');
if (mode === 'prepare') {
  const lines = ['killall', 'sound_on = 0', 'settimer 0', "gs '#static_base'", "gs '#dynamic'", "gs '#variative'", 'spell_revelio = 0'];
  let assertions = 0;
  const check = (expr, label) => { assertions++; lines.push("if (" + expr + ") = 0: msg 'FAIL_ERZA_LIBIDO_" + assertions + '_' + label + "|type=<<stock_type>>|trait=<<stock[\"nymphomania\"]>>|revealed=<<stock[\"nymphomania_revealed\"]>>' & exit"); };
  const numericSeedFields = [];
  for (const [key, value] of Object.entries(seed)) if (typeof value === 'number' && /^[A-Za-z_]\w*$/.test(key)) {
    lines.push(key + '[2624] = ' + value); numericSeedFields.push(key);
  }
  for (const key of ['seed_name', 'seed_psy_basic']) if (typeof seed[key] === 'string') lines.push('$' + key + "[2624] = '" + seed[key].replaceAll("'", "''") + "'");
  lines.push("killvar 'seed_nymphomania_revealed'", 'special_stock = 2624', "gs 'generate_stock'");
  check("stock_type = 2624 and stock['age'] = CONST_INT['young_age'] and stock['age'] ! CONST_INT['loli_age']", 'actual_adult_unique_generation');
  check("stock['nymphomania'] = 1 and stock['nymphomania_revealed'] = 0", 'latent_seed_survives_generation');
  // Handoff and the actual common feature-list generator operate in memory only.
  lines.push("gs 'stock_to_slave_nogt'");
  check("slave_type = 2624 and slave['nymphomania'] = 1 and slave['nymphomania_revealed'] = 0", 'owned_role_keeps_hidden_trait');
  lines.push("dynamic $replace($update_slave_features_list, 'dyn'+'slave', 'slave')");
  check("instr($slave_features_list, '색정광') = 0", 'hidden_trait_absent_from_feature_list');
  lines.push("slave['nymphomania_revealed'] = 2", "dynamic $replace($update_slave_features_list, 'dyn'+'slave', 'slave')");
  check("instr($slave_features_list, '색정광') > 0", 'revealed_trait_visible_in_feature_list');
  // Reproduce only the existing item's three field clears; do not invoke random
  // item selection or run a sexual scene to trigger discovery.
  lines.push("slave['nymphomania'] = 0", "slave['nymphomania_revealed'] = 0", "slave['nymphomania_xp'] = 0", 'for qa_repeat = 1 to 4:', " gs 'jo9_traits_value', 'refresh', 'slave'", " gs 'jo9_meiki_state', 'slave', 0", " dynamic $replace($update_slave_features_list, 'dyn'+'slave', 'slave')");
  check("slave['nymphomania'] = 0 and slave['nymphomania_revealed'] = 0 and slave['nymphomania_xp'] = 0", 'removed_trait_not_regranted');
  check("instr($slave_features_list, '색정광') = 0", 'removed_trait_stays_hidden');
  lines.push('end', "msg '" + marker + "'");
  const start = doc.locations.find(loc => loc.name === 'Start');
  doc.lines[start.body] = C.shift("gs 'CoreQALibidoStart'", -5);
  assert.ok(!doc.locations.some(loc => loc.name === 'CoreQALibidoStart'));
  doc.lines.splice(-1, 0, C.shift('CoreQALibidoStart', -5), '', C.shift(lines.join('\r\n'), -5), C.shift('0', -5));
  doc.lines[3] = C.shift(String(doc.locations.length + 1), -5);
  const fixture = C.serialize(doc); C.parse(fixture);
  fs.mkdirSync(T, { recursive: true });
  assert.ok(!fs.existsSync(T + '/libido.qsp'), 'do not overwrite existing diagnostic fixture');
  fs.writeFileSync(T + '/libido.qsp', fixture);
  fs.copyFileSync(W + '/config.xml', T + '/config.xml');
  fs.writeFileSync(T + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
  fs.writeFileSync(T + '/plan.json', JSON.stringify([{ name: 'erza-libido', file: T + '/libido.qsp', marker, checkpoint: 'Actual adult unique generation, hidden nymphomania1/revealed0, existing feature-list gate and no refresh resurrection after existing removal field clears' }], null, 2));
  const prepared = { ...audit, fixtureHash: C.hash(fixture), diagnosticRoot: T, sourceAssertions: assertions, executedAssertions: 5 + 2 * 4, numericSeedFieldCount: numericSeedFields.length, actualProductionFunctionsUnmodified: true, scriptOnlyOverrides: ['Start bootstrap and added numeric test location', 'Actual numeric JSON seed inputs plus name/basic-state identifiers; no images or narrative displayed', 'Discovery visibility flag is simulated directly; no sexual activity scene runs', 'Removal reproduces existing three field clears; random item selection not invoked'] };
  fs.writeFileSync(path.join(__dirname, 'native-generation-prepared.json'), JSON.stringify(prepared, null, 2) + '\n');
  fs.writeFileSync(reportPath, JSON.stringify(audit, null, 2) + '\n');
  console.log(JSON.stringify({ prepared: true, qspHash: audit.qspHash, seedTrait: 1, seedRevealed: 0, assertions, diagnosticRoot: T }));
} else {
  assert.equal(mode, 'run');
  const prepared = JSON.parse(fs.readFileSync(path.join(__dirname, 'native-generation-prepared.json'), 'utf8'));
  assert.equal(C.hash(fs.readFileSync(T + '/libido.qsp')), prepared.fixtureHash);
  assert.equal(C.hash(seedRaw), prepared.seed.sha256);
  for (const [name, sha] of Object.entries(prepared.sourceFunctionHashesUtf8)) assert.equal(functionHashes[name], sha, 'tested function changed since prepare: ' + name);
  const productionBeforeHash = C.hash(raw);
  const run = cp.spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'G:/somi/JO9sa/tools/qa/run-client-smoke.ps1', '-Engine', W + '/engine/jack.exe', '-Plan', T + '/plan.json', '-TimeoutSeconds', '20'], { windowsHide: true, encoding: 'utf8', timeout: 35000 });
  const results = fs.existsSync(T + '/client-results.json') ? JSON.parse(fs.readFileSync(T + '/client-results.json', 'utf8').replace(/^\uFEFF/, '')) : [];
  const log = fs.existsSync(T + '/erza-libido-stderr.log') ? fs.readFileSync(T + '/erza-libido-stderr.log', 'utf8') : '';
  const result = { ...prepared, native: { pass: run.status === 0 && results.length === 1 && results.every(item => item.pass), results, runnerStatus: run.status, runnerError: run.error && run.error.message, engineMessages: log.split(/\r?\n/).filter(line => /showMessage\(\)|FAIL_ERZA_LIBIDO|error|Ошибка/.test(line)).slice(0, 20), productionBeforeHash, productionAfterHash: C.hash(fs.readFileSync(W + '/jack.qsp')), seedAfterHash: C.hash(fs.readFileSync(seedPath)) } };
  result.native.pass = result.native.pass && result.native.productionAfterHash === productionBeforeHash && result.native.seedAfterHash === prepared.seed.sha256;
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ pass: result.native.pass, sourceHash: prepared.qspHash, assertions: prepared.executedAssertions, results, report: reportPath }));
  assert.ok(result.native.pass, 'native generation check failed');
}
