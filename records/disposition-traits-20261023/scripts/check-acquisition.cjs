'use strict';
// Prepare full-world native acquisition probes. This does not run the engine.
// node check-acquisition.cjs --input CANDIDATE.qsp --out G:/Codex/tmp/FRESH_DIR
const fs = require('node:fs');
const path = require('node:path');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa = require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const savecodec = require('G:/somi/JO9sa/tools/qa/save-codec.cjs');

const GAME = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const STATE = path.join(GAME, 'save/UI_TEST_MENU.sav');
const q = s => "'" + String(s).replaceAll("'", "''") + "'";
const lines = text => text.split(/\r?\n/).join('\r\n');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!['--input', '--out'].includes(key) || !argv[i + 1] || out[key.slice(2)]) {
      throw Error('Usage: node check-acquisition.cjs --input CANDIDATE.qsp --out FRESH_G_TMP_DIRECTORY');
    }
    out[key.slice(2)] = argv[i + 1];
  }
  if (!out.input || !out.out) throw Error('--input and --out are required');
  return out;
}

function realTarget(p) {
  const abs = path.resolve(p);
  if (fs.existsSync(abs)) return fs.realpathSync(abs);
  const parent = path.dirname(abs);
  return parent === abs ? abs : path.join(realTarget(parent), path.basename(abs));
}

function beneath(root, target) {
  const rel = path.relative(realTarget(root), realTarget(target));
  return rel !== '' && rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel);
}

function check(expression, label) {
  return [
    'if ' + expression + ':',
    'else',
    ' qa_failures += 1',
    ' if qa_failures <= 12: $qa_errors += ' + q(label + '|'),
    " if qa_failfast=1: msg 'JO9_QA_ASSERT_ACQUISITION_'+" + q(label) + ' & exit',
    'end',
  ];
}

const skillValues = {
  service: 1, cook: 2, secretary: 1, expression: 2, nurse: 1, alchemy: 2,
  enchanter: 1, gladiatrix: 2, calisthenics: 1, music: 2, art: 1,
  pet: 2, dressage: 1, cowSK: 2,
};

function fixture({ego = 1, pride = 1, temper = 1, intellect = 2, courage = 0,
  meekness = 0, age = 2, nature = 1, initialized = 0, psyBasic = 'hateful'} = {}) {
  const values = {
    age, ego, pride, temper, intellect, courage, meekness,
    beauty: 3, base_beauty: 3, stamina: 3, sensitivity: 3, fat: 2,
    energy: 3, calories: 3, diet_portion: 2, hygiene: 0,
    wounds: 0, ill: 0, parasite: 0, pregnant: 0, rehabilitation: 0,
    brand: 0, virginity: 0, grace: 0, fame: 0, scars: 0, bruises: 0,
    custom: 0, rational: 0, instinct: 0, moral: 0,
    fear: 3, angst: 2, spoil: 2, arousal: 4,
    mood: -2, neg_slave: 4, neg_fear: 1, neg_angst: 1,
    defiant: 0, jo9_slave_nature: nature, jo9_slave_nature_initialized: initialized,
    qa_extra_sentinel: 73021, ...skillValues,
  };
  const code = [
    "dynamic $clear_slave_instance, 'stock'",
    "dynamic $clear_slave_instance, 'slave'",
    "dynamic $clear_slave_instance, 'selected'",
    "stock_state=CONST_INT['slave_exist']", 'stock_type=1001',
  ];
  if (psyBasic === 'broken') code.push(
    "$seed_psy_basic[stock_type]='broken'", "gs 'get_stock_seed'",
    ...check("$stock_psy_basic='broken'", 'broken_basic_actual_seed_loaded'));
  code.push(
    "$stock_name='QA acquisition'", '$stock_psy_basic=' + q(psyBasic), '$stock_psy_status=' + q(psyBasic),
    "$stock['cloth']='голая'", "$stock['wpn']='безоружный'", "$stock['armor']='без_брони'",
    "$stock['scnd']=''", "$stock['fullimage']=''",
  );
  for (const [key, value] of Object.entries(values)) code.push(`stock[${q(key)}]=${value}`);
  code.push("stock_rate['beauty']=40", "stock_rate['mood']=-20");
  for (const key of ['ego', 'pride', 'temper', 'intellect', 'custom', 'rational', 'instinct',
    'moral', 'fear', 'angst', 'spoil', 'arousal', 'stamina', 'fat', ...Object.keys(skillValues)]) {
    code.push(`stock_rate[${q(key)}]=0`);
  }
  return {code, values};
}

function acquire(route) {
  if (route === 'stock') return ["gs 'stock_to_slave_nogt'"];
  if (route === 'expert') return [
    "dynamic $swap_slave_instances, 'stock', 'selected'",
    "gs 'expert_to_slave'",
  ];
  throw Error('Unknown route ' + route);
}

function unchanged(values, label, keys) {
  // Keep every comparison, but let the native engine evaluate each preservation
  // assertion independently instead of one very long conjunction.
  return keys.flatMap(key => check(`slave[${q(key)}]=${values[key]}`, label + '_' + key));
}

function successfulCase(route, difficulty, kind) {
  const opts = kind === 'worst'
    ? {ego: 3, pride: 3, temper: 5, intellect: 5, courage: 2, meekness: -2}
    : kind === 'zero-sanity' ? {ego: 0, pride: 0, temper: 0, intellect: 1}
      : kind === 'broken-basic' ? {ego: 1, pride: 1, temper: 1, psyBasic: 'broken'} : {};
  const id = `${route}_${difficulty}_${kind}`;
  const {code, values} = fixture(opts);
  const expectedEgo = kind === 'zero-sanity' ? 3 : values.ego;
  return [
    'difficulty_setting=' + difficulty, ...code, ...acquire(route),
    ...check("slave_state=CONST_INT['slave_exist'] and slave['jo9_slave_nature']=1 and slave['jo9_slave_nature_initialized']=1", id + '_owned_initialized'),
    ...check("$slave_psy_status='obedient' and slave['obedience']>=5", id + '_immediate_real_obedience'),
    ...check("slave['moral']>=1 and slave['moral']<=3 and slave['custom']>=3 and slave['custom']<=5 and slave['rational']=5 and slave['instinct']>=0 and slave['instinct']<=5", id + '_bounded_motivations'),
    ...check("slave['fear']=0 and slave['angst']=0 and slave['spoil']=0 and slave['arousal']<5 and slave['mood']>=0", id + '_initial_mood'),
    ...check(`slave['ego']=${expectedEgo} and slave['pride']=${values.pride} and slave['temper']=${values.temper} and slave['intellect']=${values.intellect}`, id + '_personality_and_minimum_sanity_repair'),
    ...unchanged(values, id + '_skills_unboosted', Object.keys(skillValues)),
    ...unchanged(values, id + '_body_unboosted', ['age', 'stamina', 'sensitivity', 'fat', 'grace', 'energy', 'ill', 'wounds']),
    // An ordinary later refresh must preserve real compliance; it must not require a fake UI assignment.
    "gs '$slave_price', 'slave'",
    "dynamic $replace($newloc_update_slave, 'dyn'+'slave', 'slave')",
    "dynamic $replace($newloc_update_slave, 'dyn'+'slave', 'slave')",
    ...check("$slave_psy_status='obedient' and slave['obedience']>=5", id + '_native_recalculation'),
  ];
}

function guards(route) {
  // Stop at the first violated contract. Continuing the baseline's unsupported
  // initialization path obscures the intended RED assertion with later behavior.
  const code = ['qa_failfast=1'];
  for (const [label, options] of [
    ['ego-cutoff', {ego: 4, pride: 1}], ['pride-cutoff', {ego: 1, pride: 4}],
  ]) {
    const f = fixture(options);
    code.push(...f.code, ...acquire(route),
      ...check("slave['jo9_slave_nature']=0", route + '_' + label + '_positive_removed'),
      ...unchanged(f.values, route + '_' + label + '_stats_unchanged',
        ['ego', 'pride', 'temper', 'intellect', 'moral', 'custom', 'rational', 'instinct',
          'fear', 'angst', 'spoil', 'arousal', 'mood', 'qa_extra_sentinel', ...Object.keys(skillValues)]));
  }
  const absent = fixture({nature: 0});
  code.push(...absent.code, ...acquire(route),
    ...check("slave['jo9_slave_nature']=0 and slave['jo9_slave_nature_initialized']=0", route + '_no_flag_no_init'),
    ...unchanged(absent.values, route + '_no_flag_sentinels_unchanged',
      ['ego', 'pride', 'temper', 'intellect', 'moral', 'custom', 'rational', 'instinct',
        'fear', 'angst', 'spoil', 'arousal', 'mood', 'qa_extra_sentinel', ...Object.keys(skillValues)]));
  const present = fixture();
  code.push(...present.code, ...acquire(route),
    ...check("slave['jo9_slave_nature_initialized']=1", route + '_reinit_initially_marked'));
  const later = {moral: 0, custom: 1, rational: 1, instinct: 0, fear: 4, angst: 3,
    spoil: 2, arousal: 4, mood: -2, service: 2, energy: 1};
  for (const [key, value] of Object.entries(later)) code.push(`slave[${q(key)}]=${value}`);
  code.push("slave_rate['moral']=-7", "slave_rate['mood']=-40", "$slave_psy_status='reluctant'",
    "gs 'jo9_traits', 'init_slave_nature', 'slave'",
    ...unchanged(later, route + '_reinit_guard_preserves_later_changes', Object.keys(later)),
    ...check("slave_rate['moral']=-7 and slave_rate['mood']=-40 and $slave_psy_status='reluctant' and slave['jo9_slave_nature_initialized']=1", route + '_reinit_guard_preserves_rates_and_label'));
  return code;
}

function traitUi() {
  const code = ['qa_failfast=1'];
  const roles = ['slave', 'assistant', 'room1', 'room2', 'room3', 'room4'];
  for (const role of roles) {
    const f = fixture({initialized: 1});
    code.push(...f.code,
      "dynamic $swap_slave_instances, 'stock', " + q(role),
      "$qa_list=$func('jo9_traits', 'list', " + q(role) + ')',
      ...check("instr($qa_list,'노예근성')>0 and instr($qa_list,'slave_nature')>0 and instr($qa_list,'describe')>0", role + '_list_description_link'),
      "$setting_display_r=''", "gs 'jo9_traits', 'editor', " + q(role),
      ...check("instr($setting_display_r,'노예근성:')>0 and instr($setting_display_r,'jo9_slave_nature')>0 and instr($setting_display_r,'거센 반항심:')>0", role + '_editor_actions'));
  }
  const f = fixture({nature: 0});
  code.push(...f.code, ...acquire('stock'),
    "slave['defiant']=1", "gs 'jo9_traits', 'edit', 'slave', 'jo9_slave_nature', 1",
    ...check("slave['jo9_slave_nature']=1 and slave['defiant']=0 and slave['jo9_slave_nature_initialized']=1 and slave['obedience']>=5 and $slave_psy_status='obedient'", 'editor_enable_positive_initializes_and_excludes_negative'));
  const watched = ['moral', 'custom', 'rational', 'instinct', 'mood', 'service', 'cook', 'energy'];
  for (const key of watched) code.push(`qa_edit_before[${q(key)}]=slave[${q(key)}]`);
  code.push("qa_edit_before['mood_rate']=slave_rate['mood']",
    "gs 'jo9_traits', 'edit', 'slave', 'jo9_slave_nature', 1",
    ...check("slave['jo9_slave_nature']=0 and " + watched.map(key => `slave[${q(key)}]=qa_edit_before[${q(key)}]`).join(' and ') + " and slave_rate['mood']=qa_edit_before['mood_rate']", 'editor_disable_preserves_acquired_training'),
    "gs 'jo9_traits', 'edit', 'slave', 'jo9_slave_nature', 1",
    "gs 'jo9_traits', 'edit', 'slave', 'defiant', 1",
    ...check("slave['defiant']=1 and slave['jo9_slave_nature']=0 and slave['jo9_slave_nature_initialized']=0", 'editor_negative_excludes_positive'),
    "gs 'jo9_traits', 'edit', 'slave', 'jo9_slave_nature', 1",
    ...check("slave['defiant']=0 and slave['jo9_slave_nature']=1 and slave['jo9_slave_nature_initialized']=1", 'editor_positive_excludes_negative_again'));
  return code;
}

function prepare(input, out) {
  const source = path.resolve(input), output = path.resolve(out);
  if (!beneath('G:/Codex/tmp', output)) throw Error('--out must be a fresh child of G:/Codex/tmp');
  qa.assertOutside(output, [GAME, 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game']);
  if (fs.existsSync(output)) throw Error('Fresh output directory required: ' + output);
  const raw = fs.readFileSync(source), doc = core.parse(raw);
  const saveRaw = fs.readFileSync(STATE), save = savecodec.parse(saveRaw);
  if (!savecodec.serialize(save).equals(saveRaw)) throw Error('Representative save roundtrip failed');
  const primed = qa.primeState(save);
  const loc = name => {
    const matches = doc.locations.filter(x => x.name === name);
    if (matches.length !== 1) throw Error('Missing/duplicate actual location ' + name);
    return matches[0];
  };
  for (const name of ['Start', 'refresh_database', 'jo9_traits', 'stock_to_slave_nogt', 'expert_to_slave']) loc(name);
  const actualBodies = Object.fromEntries(['stock_to_slave_nogt', 'expert_to_slave', 'jo9_traits'].map(name =>
    [name, core.hash(Buffer.from(core.shift(doc.lines[loc(name).body], 5), 'utf8'))]));
  const common = [
    'killall', 'settimer 0', primed.code, "$counter=''", "$onnewloc=''", "$ongload=''",
    "gs 'refresh_database'", "$counter=''", "$onnewloc=''", "$ongload=''",
    'settimer 0', 'sound_on=0', 'nsfw=0', 'wizard_mode=0', 'no_mindbreak=0',
    'game_difficulty=2', 'cheat_h=0', 'cheat_j=0', 'cheat_k=0', 'cheat_l=0', 'creating_clone=0',
    'get_girl=0', 'qa_failures=0', 'qa_failfast=0', "$qa_errors=''", 'is_home=1', 'city_form=0',
  ];
  const definitions = [
    {name: 'stock-acquisition', code: [0, 1, 2].flatMap(d => ['default', 'worst', 'zero-sanity', 'broken-basic'].flatMap(k => successfulCase('stock', d, k))), cases: 12},
    {name: 'expert-acquisition', code: [0, 1, 2].flatMap(d => ['default', 'worst', 'zero-sanity', 'broken-basic'].flatMap(k => successfulCase('expert', d, k))), cases: 12},
    {name: 'acquisition-guards', code: ['stock', 'expert'].flatMap(guards), cases: 8},
    {name: 'trait-ui', code: traitUi(), cases: 10},
  ];
  // All QSPs share this one disposable client directory, and JSON is copied only once.
  fs.mkdirSync(output, {recursive: true});
  fs.cpSync(path.join(GAME, 'json'), path.join(output, 'json'), {recursive: true});
  fs.copyFileSync(path.join(GAME, 'config.xml'), path.join(output, 'config.xml'));
  fs.writeFileSync(path.join(output, 'FastQSP.ini'), '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
  const plan = [], fixtures = [];
  for (const p of definitions) {
    const fixtureDoc = core.parse(raw);
    const marker = 'JO9_QA_ACQUISITION_' + p.name.replaceAll('-', '_') + '_COMPLETE';
    const code = [...common, ...p.code,
      "if qa_failures>0: msg 'JO9_QA_ASSERT_ACQUISITION_'+$qa_errors & exit",
      'msg ' + q(marker)];
    fixtureDoc.lines[loc('Start').body] = core.shift(lines(code.join('\r\n')), -5);
    const bytes = core.serialize(fixtureDoc), inspection = qa.inspectWorld(bytes);
    // Native source locations must remain byte-for-byte identical to the candidate.
    for (const name of Object.keys(actualBodies)) {
      const body = core.shift(fixtureDoc.lines[loc(name).body], 5);
      if (core.hash(Buffer.from(body, 'utf8')) !== actualBodies[name]) throw Error('Actual source was instrumented: ' + name);
    }
    const file = path.join(output, p.name + '.qsp');
    fs.writeFileSync(file, bytes);
    plan.push({name: p.name, file, marker, checkpoint: 'Actual full-world acquisition and native psychology; ' + p.cases + ' cases'});
    fixtures.push({name: p.name, cases: p.cases, sha256: inspection.sha256});
  }
  // The normal smoke runner deliberately rejects unexpected MSGs. Keep the real
  // description call separate, with its exact expected text for a message-aware runner.
  const traitBody = core.shift(doc.lines[loc('jo9_traits').body], 5);
  const description = traitBody.match(/^\s*if\s+\$args\[1\]\s*=\s*'slave_nature'\s*:\s*msg\s+'((?:[^']|'')*)'\s*$/m);
  let descriptionProbe = null;
  if (description) {
    const fixtureDoc = core.parse(raw);
    fixtureDoc.lines[loc('Start').body] = core.shift(lines([...common,
      "gs 'jo9_traits', 'describe', 'slave_nature'"].join('\r\n')), -5);
    const bytes = core.serialize(fixtureDoc);
    qa.inspectWorld(bytes);
    const file = path.join(output, 'trait-description.qsp');
    fs.writeFileSync(file, bytes);
    descriptionProbe = {file, expectedMessage: description[1].replaceAll("''", "'"),
      actualSourceUnmodified: true, standardRunnerCompatible: false,
      reason: 'Expected native description MSG, not a JO9_QA completion marker.'};
    fs.writeFileSync(path.join(output, 'description-probe.json'), JSON.stringify(descriptionProbe, null, 2) + '\n');
  }
  if (core.hash(fs.readFileSync(source)) !== doc.hash || core.hash(fs.readFileSync(STATE)) !== core.hash(saveRaw)) {
    throw Error('Input QSP or representative save changed during preparation');
  }
  const manifest = {
    schema: 1, source, sourceSha256: doc.hash, stateSave: STATE, stateSaveSha256: core.hash(saveRaw),
    primedAssignments: primed.assignments, output, actualLocationSha256: actualBodies, fixtures, descriptionProbe,
    engine: path.join(GAME, 'engine/jack.exe'), runner: 'G:/somi/JO9sa/tools/qa/run-client-smoke.ps1',
    limits: [
      'Preparation only. Native completion markers are required before claiming PASS.',
      'Only Start is replaced in disposable complete-world copies; product acquisition/trait source is unmodified.',
      'Savecodec and qa.primeState reconstruct representative state; this does not test GUI saved-script restoration or CRC loading.',
      'Randomized probability and general JSON seed defaults require separate probes; broken-basic explicitly loads get_stock_seed with a controlled basic personality.',
      'UI probe executes list and editor code for six roles, plus eligible editor toggles. Description MSG has a separate raw-message fixture; no invalid-editor popup is invoked.',
      'Ordinary professional/health sale requirements remain separate from initial obedient state.',
      'No source QSP, JSON or existing save is written. Reinit and no-flag comparisons cover explicit economic/personality/skill sentinels, not every possible array key.',
    ],
  };
  fs.writeFileSync(path.join(output, 'plan.json'), JSON.stringify(plan, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'prepared.json'), JSON.stringify(manifest, null, 2) + '\n');
  return {sourceSha256: doc.hash, output, plan: path.join(output, 'plan.json'), probes: plan.length,
    acquisitionCases: 24, guardCases: 8, uiCases: 10, descriptionProbe: descriptionProbe && path.join(output, 'description-probe.json'), jsonCopies: 1};
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  console.log(JSON.stringify(prepare(args.input, args.out), null, 2));
}
module.exports = {parseArgs, fixture, acquire, successfulCase, guards, traitUi, prepare};
