'use strict';
const CRLF = '\r\n';
const q = s => "'" + String(s).replaceAll("'", "''") + "'";
const join = a => a.join(CRLF);
const F = (mode, role, key) => "func('jo9_traits', " + q(mode) + ', ' + q(role) + (key ? ', ' + q(key) : '') + ')';
const check = (expression, label) => join([
  'if ' + expression + ':', 'else',
  " msg " + q('FAIL_MERGER_activity_' + label) + ' & exit', 'end',
]);
function currentPatchedContext() {
  const fs = require('node:fs'), core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
  const doc = core.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
  const bodies = new Map(doc.locations.map(l => [l.name, core.shift(doc.lines[l.body], 5)]));
  const ctx = {get: n => bodies.get(n), edit(n, old, next, count = 1) {
    const body = bodies.get(n), found = body.split(old).length - 1;
    if (found !== count) throw Error(n + ' expected ' + count + ' refs, got ' + found);
    bodies.set(n, body.split(old).join(next));
  }};
  require('./implement.cjs').apply(ctx);
  return ctx;
}
function fixture(role, a, c) {
  return [
    'killvar ' + q(role), 'killvar ' + q(role + '_rate'),
    role + "['jo9_work_ethic']=" + a,
    role + "['passion_comfort']=" + c,
    role + "['energy']=0",
    role + "['qa_activity_sentinel']=81273",
  ];
}
function oracle(a, c) {
  const ok = c <= 1;
  const sign = ok ? (a === 1 || c === -1 ? 1 : a === -1 || c === 1 ? -1 : 0) : 0;
  return {ok: Number(ok), sign, work: ok ? sign : a, comfort: ok ? -sign : c};
}
const pairs = [-1, 0, 1].flatMap(a => [-1, 0, 1, 2].map(c => [a, c]));

function testCases(ctx = currentPatchedContext()) {
  const cases = [];
  const matrix = [];
  for (const [a, c] of pairs) {
    const expected = oracle(a, c), id = a + '_' + c;
    matrix.push(...fixture('slave', a, c),
      check(F('activity_compatible', 'slave') + '=' + expected.ok, 'compatible_' + id),
      check(F('activity_sign', 'slave') + '=' + expected.sign, 'sign_' + id),
      check(F('activity_value', 'slave', 'jo9_work_ethic') + '=' + expected.work, 'work_' + id),
      check(F('activity_value', 'slave', 'passion_comfort') + '=' + expected.comfort, 'comfort_' + id),
      check(F('activity_known', 'slave') + '=0', 'unknown_' + id),
      check("slave['jo9_work_ethic']=" + a + " and slave['passion_comfort']=" + c, 'raw_preserved_' + id),
      check("slave['energy']=0 and slave['qa_activity_sentinel']=81273", 'ap0_preserved_' + id),
      check("slave['jo9_work_ethic_known']=0 and slave['passion_comfort_revealed']=0", 'read_no_discovery_' + id),
      'day=79',
      "gs 'jo9_traits_personality','activity','slave','work:service',0",
      "gs 'jo9_traits_personality','activity','slave','learn:service',0",
      check("slave_rate['mood']=" + (expected.work * 2), 'native_activity_once_' + id),
      check("slave['jo9_work_ethic']=" + a + " and slave['passion_comfort']=" + c, 'native_activity_raw_' + id));
  }
  cases.push({name: 'activity_matrix_12_raw_and_ap0', body: join(matrix)});

  const roles = [];
  for (const role of ['slave', 'assistant', 'room1', 'room2', 'room3', 'room4', 'farmhand', 'cow', 'prisoner', 'stock']) {
    roles.push(...fixture(role, 0, -1), 'day=87',
      "gs 'jo9_traits_personality', 'activity', " + q(role) + ", 'work:service', 0",
      check(role + "_rate['mood']=0 and " + role + "['jo9_activity_count']=1", role + '_first'),
      "gs 'jo9_traits_personality', 'activity', " + q(role) + ", 'learn:service', 0",
      check(role + "_rate['mood']=2 and " + role + "['jo9_activity_count']=2", role + '_second_once'),
      check(role + "['jo9_work_ethic_known']=1", role + '_activity_discovery'),
      "gs 'jo9_traits_personality', 'activity', " + q(role) + ", 'work:service', 0",
      check(role + "_rate['mood']=4 and " + role + "['jo9_activity_count']=3", role + '_third_once'),
      'day=88',
      "gs 'jo9_traits_personality', 'activity', " + q(role) + ", 'work:service', 0",
      check(role + "_rate['mood']=4 and " + role + "['jo9_activity_count']=1", role + '_next_day_reset'),
      check("func('jo9_traits_personality','xp'," + q(role) + ",'service',10)=10", role + '_no_new_xp_multiplier'),
      check(role + "['energy']=0 and " + role + "['jo9_work_ethic']=0 and " + role + "['passion_comfort']=-1", role + '_ap0_raw_preserved'));
  }
  roles.push(...fixture('slave', 0, 1), 'day=91',
    "gs 'jo9_traits_personality','activity','slave','work:service',0",
    "gs 'jo9_traits_personality','activity','slave','learn:service',0",
    check("slave_rate['mood']=-2", 'passive_second_once'));
  cases.push({name: 'activity_roles_day_reset_no_double_xp', body: join(roles)});

  const resultBody = ctx.get('interaction_result');
  const restStart = resultBody.indexOf("if $interaction_type = 'rest':");
  const restEnd = resultBody.indexOf('!interaction type - verbal punishment', restStart);
  if (restStart < 0 || restEnd < 0) throw Error('Actual native rest block missing');
  const actualRest = resultBody.slice(restStart, restEnd).trimEnd();
  const rests = ["local $qa_activity_saved_erotic=$dyn_erotic_stimulation", "$dyn_erotic_stimulation=''"];
  for (const [a, c] of pairs) {
    const expected = oracle(a, c), potency = expected.comfort === 1 ? 16 : expected.comfort === -1 ? 4 : 8;
    rests.push(...fixture('slave', a, c),
      "$interaction_type='rest'", "$slave_psy_status='obedient'", "$special_part=''", "$text[1]=''",
      'interaction=813', 'interaction_reward_potence=8', 'interaction_reward_level=1', 'interaction_reward_cost=0',
      'free_time=0', "slave['promise_reward']=1", "slave_already_done_today['813']=0",
      actualRest,
      check('interaction_reward_potence=' + potency, 'native_rest_potence_' + a + '_' + c),
      check("slave['energy']=0", 'native_rest_ap0_' + a + '_' + c),
      check("slave['jo9_work_ethic']=" + a + " and slave['passion_comfort']=" + c, 'native_rest_raw_' + a + '_' + c));
  }
  rests.push('$dyn_erotic_stimulation=$qa_activity_saved_erotic');
  cases.push({name: 'activity_native_rest_matrix_12', body: join(rests)});

  const interactionLines = ctx.get('interaction').split(CRLF);
  const massageStart = interactionLines.findIndex(s => s.includes(value('slave', 'passion_comfort')) && s.includes('interaction_reward_potence *= 2'));
  if (massageStart < 0) throw Error('Actual native massage branch missing');
  const actualMassage = interactionLines.slice(massageStart, massageStart + 3).join(CRLF);
  const massages = [];
  for (const [a, c] of pairs) {
    const expected = oracle(a, c), potency = expected.comfort > 0 ? 16 : expected.comfort < 0 ? 4 : 8;
    massages.push(...fixture('slave', a, c), 'interaction_reward_potence=8', actualMassage,
      check('interaction_reward_potence=' + potency, 'native_massage_' + a + '_' + c),
      check("slave['jo9_work_ethic']=" + a + " and slave['passion_comfort']=" + c, 'massage_raw_' + a + '_' + c));
  }
  cases.push({name: 'activity_native_massage_matrix_12', body: join(massages)});

  const staticBody = ctx.get('#static_base');
  const featureStart = staticBody.indexOf("        if func('jo9_traits', 'activity_compatible', 'dynslave') = 1:");
  const featureEnd = staticBody.indexOf("        if dynslave['passion_luxury'] = 1 and", featureStart);
  if (featureStart < 0 || featureEnd < 0) throw Error('Actual native feature branch missing');
  const actualFeatures = staticBody.slice(featureStart, featureEnd).replaceAll('dynslave', 'slave');
  const ui = [...fixture('slave', 1, 0), 'spell_revelio=0',
    "$qa_activity_list=$func('jo9_traits','list','slave')",
    check("instr($qa_activity_list,'activity_active')=0", 'unknown_list_hidden'),
    'spell_revelio=1', "slave['pos_well_rested']=1",
    "$qa_activity_list=$func('jo9_traits','list','slave')", actualFeatures,
    check("instr($qa_activity_list,'activity_active')>0 and instr($qa_activity_list,'workaholic')=0", 'spell_merged_link'),
    check("slave['pos_well_rested']=1 and slave['jo9_work_ethic_known']=0", 'spell_only_not_known_or_suppressed'),
    'spell_revelio=0', "gs 'jo9_traits','activity_reveal','slave'",
    check("slave['passion_comfort_revealed']=1 and slave['jo9_work_ethic_known']=0", 'rest_pending_discovery'),
    "slave['jo9_work_ethic_known']=1",
    "gs 'jo9_traits','activity_discover','slave'",
    check("slave['passion_comfort_revealed']=2 and slave['jo9_work_ethic']=1 and slave['passion_comfort']=0", 'discovery_without_normalizing'),
    "$qa_activity_list=$func('jo9_traits','list','slave')", actualFeatures,
    check("instr($qa_activity_list,'activity_active')>0 and instr($qa_activity_list,'workaholic')=0", 'known_single_merged_link'),
    check("slave['pos_well_rested']=0", 'known_active_rested_suppression'),
    ...fixture('slave', 1, 1), "slave['jo9_work_ethic_known']=1", "slave['passion_comfort_revealed']=2",
    "$qa_activity_list=$func('jo9_traits','list','slave')", "$slave_features_list=''", actualFeatures,
    check("instr($qa_activity_list,'activity_active')>0 and instr($qa_activity_list,'workaholic')=0", 'conflict_unified_active_description'),
    check("instr($slave_features_list,'무기력증')=0 and instr($slave_features_list,'과다행동장애')=0", 'conflict_no_negative_or_duplicate_label'),
    check("slave['jo9_work_ethic']=1 and slave['passion_comfort']=1", 'display_is_pure_before_repair'),
    "gs 'jo9_traits','activity_repair','slave'",
    check("slave['jo9_work_ethic']=1 and slave['passion_comfort']=-1", 'display_conflict_repaired_active'),
    ...fixture('slave', 1, 2), "slave['jo9_work_ethic_known']=1",
    "$qa_activity_list=$func('jo9_traits','list','slave')",
    check("instr($qa_activity_list,'workaholic')>0 and instr($qa_activity_list,'activity_active')=0", 'c2_keeps_legacy_component_description'),
    check("instr($func('jo9_traits','text','activity_active'),'활동적')>0", 'overview_ascii_active_description'),
    check("instr($func('jo9_traits','text','activity_passive'),'휴식 선호')>0", 'overview_ascii_passive_description'),
  ];
  cases.push({name: 'activity_knowledge_overview_legacy_labels', body: join(ui)});

  const editor = [...fixture('slave', 0, 0),
    check("func('jo9_traits','activity_set','slave',1)=1", 'editor_grant_active'),
    check("slave['jo9_work_ethic']=1 and slave['passion_comfort']=-1", 'editor_canonical_active'),
    "gs 'jo9_traits','activity_edit','slave','jo9_work_ethic',1",
    check("slave['jo9_work_ethic']=0 and slave['passion_comfort']=0 and slave['jo9_work_ethic_known']=0 and slave['passion_comfort_revealed']=0", 'editor_toggle_removes_both'),
    "gs 'jo9_traits','edit','slave','jo9_work_ethic',-1",
    check("slave['jo9_work_ethic']=-1 and slave['passion_comfort']=1", 'native_editor_passive'),
    "gs 'jo9_traits','edit','slave','passion_comfort',1",
    check("slave['jo9_work_ethic']=0 and slave['passion_comfort']=0", 'legacy_alias_editor_removes_axis'),
    ...fixture('slave', -1, 1),
    check("func('jo9_traits','activity_set','slave',1)=1", 'editor_active_over_passive'),
    check("slave['jo9_work_ethic']=1 and slave['passion_comfort']=-1", 'editor_positive_replaces_negative'),
    check("func('jo9_traits','activity_set','slave',-1)=1", 'editor_explicit_passive_choice'),
    check("slave['jo9_work_ethic']=-1 and slave['passion_comfort']=1", 'editor_explicit_passive_canonical'),
    ...fixture('slave', 1, 2),
    check("func('jo9_traits','activity_set','slave',-1)=0", 'c2_grant_rejected'),
    check("slave['jo9_work_ethic']=1 and slave['passion_comfort']=2", 'c2_grant_preserved'),
    "gs 'jo9_traits','activity_remove','slave','jo9_work_ethic'",
    check("slave['jo9_work_ethic']=0 and slave['passion_comfort']=2", 'explicit_unknown_legacy_target_removal'),
  ];
  cases.push({name: 'activity_editor_and_targeted_removal', body: join(editor)});

  const generation = [];
  for (const [a, c] of pairs) {
    const sign = a === 1 || c === -1 ? 1 : a === -1 || c > 0 ? -1 : 0;
    generation.push(...fixture('stock', a, c),
      "gs 'jo9_traits','activity_generate','stock'",
      check("stock['jo9_work_ethic']=" + sign + " and stock['passion_comfort']=" + -sign, 'fresh_generation_priority_' + a + '_' + c),
      check("stock['jo9_work_ethic_known']=0 and stock['passion_comfort_revealed']=0", 'generation_stays_unknown_' + a + '_' + c));
  }
  cases.push({name: 'activity_fresh_generation_12_priority', body: join(generation)});

  const repairs = [];
  for (const [a, c] of pairs) {
    const conflict = a === c && a !== 0;
    repairs.push(...fixture('slave', a, c), "slave['jo9_work_ethic_known']=1", "slave['passion_comfort_revealed']=2",
      check("func('jo9_traits','activity_repair','slave')=" + Number(conflict), 'repair_report_' + a + '_' + c),
      check("slave['jo9_work_ethic']=" + (conflict ? 1 : a) + " and slave['passion_comfort']=" + (conflict ? -1 : c), 'repair_only_known_negative_' + a + '_' + c),
      check("slave['jo9_work_ethic_known']=1 and slave['passion_comfort_revealed']=2 and slave['energy']=0", 'repair_knowledge_ap_preserved_' + a + '_' + c),
      check("func('jo9_traits','activity_repair','slave')=0", 'repair_idempotent_' + a + '_' + c));
  }
  cases.push({name: 'activity_repair_12_positive_wins', body: join(repairs)});

  const essence = ["local $qa_activity_saved_lab=$get_lab_space", "$get_lab_space=''",
    ...fixture('slave', 0, 1), "slave_state=CONST_INT['slave_exist']", "slave['oral_affinity']=1", 'chaotic_essence=2',
    check("func('jo9_chaotic','count','slave')=1", 'essence_passive_one_candidate'),
    check("func('jo9_chaotic','apply','slave')=1", 'essence_passive_removed'),
    check("slave['jo9_work_ethic']=0 and slave['passion_comfort']=0 and chaotic_essence=1", 'essence_no_alias_resurrection'),
    check("slave['oral_affinity']=1 and func('jo9_chaotic','count','slave')=0", 'essence_positive_preserved'),
    ...fixture('slave', -1, -1), "slave_state=CONST_INT['slave_exist']", 'chaotic_essence=2',
    check("func('jo9_chaotic','count','slave')=0", 'essence_conflict_positive_projection_not_negative'),
    "gs 'jo9_traits','activity_repair','slave'",
    check("slave['jo9_work_ethic']=1 and slave['passion_comfort']=-1 and chaotic_essence=2", 'essence_conflict_repair_keeps_positive'),
    ...fixture('slave', -1, 2), "slave_state=CONST_INT['slave_exist']", 'chaotic_essence=2',
    check("func('jo9_chaotic','count','slave')=1", 'essence_c2_legacy_one_candidate'),
    check("func('jo9_chaotic','apply','slave')=1", 'essence_legacy_removed'),
    check("slave['jo9_work_ethic']=0 and slave['passion_comfort']=2 and chaotic_essence=1", 'essence_unknown_legacy_survivor_preserved'),
    ...fixture('slave', 1, 1), "slave_state=CONST_INT['slave_exist']", 'chaotic_essence=1',
    check("func('jo9_chaotic','count','slave')=0", 'essence_legacy_comfort_not_reclassified'),
    ...fixture('slave', 0, 2), "slave_state=CONST_INT['slave_exist']",
    check("func('jo9_chaotic','count','slave')=0", 'essence_c2_not_reclassified'),
    '$get_lab_space=$qa_activity_saved_lab'];
  cases.push({name: 'activity_chaotic_essence_axis_and_legacy', body: join(essence)});
  return cases;
}
function value(role, key) { return "func('jo9_traits', 'activity_value', '" + role + "', '" + key + "')"; }
module.exports = {testCases};
