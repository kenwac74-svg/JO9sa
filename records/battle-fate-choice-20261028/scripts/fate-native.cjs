'use strict';
// Diagnostic-only native QSP regression suite. No WORK/save/production writes.
// Prepare: node fate-native.cjs --candidate CANDIDATE.qsp --state-save STATE.sav --out NEW_EMPTY_DIR
// Run:     same arguments plus --run (launches only the existing native smoke runner).
// RED:     --baseline-red executes the untouched baseline round and detects eager corpse/trophy bookkeeping.
// Focus:   --case choose-spare-clamps-negative-health-stamina runs that real helper case alone.
// Read-only: --list, --self-check. Official release nine-path gate remains separate.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const REPO = 'G:/somi/JO9sa';
const WORK = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const core = require(REPO + '/tools/text-workshop/core.cjs');
const codec = require(REPO + '/tools/qa/save-codec.cjs');
const gate = require(REPO + '/tools/qa/release-check.cjs');
const RUNNER = REPO + '/tools/qa/run-client-smoke.ps1';
const HELPER = 'jo9_battle_fate';
const q = s => "'" + String(s).replace(/'/g, "''") + "'";
const cr = s => s.replace(/\r?\n/g, '\r\n');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const TEXT = {
  fogFatal: '적이 치명상을 입고 피를 쏟으며 바닥에 쓰러졌다. 이대로 두면 죽을 것 같다.',
  fogFaint: '적이 힘없이 바닥에 쓰러져 기절했다. 더 이상 싸울 수 없어 보인다.',
  arenaFatal: '상대는 치명타를 맞고 피를 흘리며 주저 앉았다. 결투를 포기하고 죽음을 각오한 것 같다',
  arenaFaint: '상대는 더 이상 버티지 못하고 바닥에 주저 앉았다. 싸울 의지가 없어 보인다.'
};
const RENDER_CASES = ['render-pending-preserves-state', 'render-spare-preserves-state-and-hud', 'render-execution-once-preserves-state'];
const call = (mode, ...args) => "gs '" + HELPER + "', " + q(mode) + args.map(x => ', ' + (typeof x === 'number' ? x : q(x))).join('');
// RESULT belongs to the called QSP location. Read a numeric return through FUNC,
// never by reading the caller's RESULT after GS. Mutation-only calls may use GS.
const resultOf = (mode, ...args) => "func(" + q(HELPER) + ', ' + q(mode) + args.map(x => ', ' + (typeof x === 'number' ? x : q(x))).join('') + ')';
function check(condition, tag) {
  return `if (${condition}) = 0:\n qa_failed = 1\n msg ${q('FAIL_FATE_' + tag)}\n exit\nend`;
}
function base(enemy = 'hoplite_b', count = 1) {
  return [
    "killvar 'jo9_fate'", "killvar 'jo9_fate_enemy'", "killvar '$jo9_fate_enemy'",
    "killvar '$jo9_fate_text'", "killvar 'jo9_fog'", "killvar 'jo9_combat'",
    "killvar '$враг'", "killvar 'враг'", "killvar '$действия_врага'",
    "killvar 'труп'", "killvar 'в_отключке'", "killvar '$трофей'",
    "killvar '$труп_моба_в_локацию'", "killvar '$вырубленный_моб_в_локацию'",
    "killvar '$состояние'", "killvar '$тип_нанесенного_вреда'", "killvar 'нанесенный_вред'",
    "killvar '$наложение'", "killvar 'длительность'",
    'snk_room_target = 0', 'combatant = 0', 'arena_mode = 0', 'colosseum_fight = 0',
    'challenge_type = 0', 'get_girl = 0', 'fog_battle = 0', 'fighting_experience = 0',
    'поверженные_враги = 0', 'тр = 0', 'текущий = 1', 'это_суперудар = 0',
    "jo9_fate['mode'] = 0", "jo9_fate['phase'] = 0", "$итог_боя = ''",
    "$fight_return = ''", "$return_lock = 'qa_fate_return'", "$place = 'qa_fate'",
    'is_home = 1', 'ui_style = 0', 'cheat_fight_dif = 1',
    'здоровье_игрока = 100', 'выносливость_игрока = 100', 'дух_игрока = 100',
    'макс_здоровье_игрока = 100', 'макс_выносливость_игрока = 100', 'норм_дух_игрока = 100',
    "$броня = 'qa_fate_no_armor'", "$броня_снять['qa_fate_no_armor'] = 'qa_armor_removals += 1'", 'qa_armor_removals = 0',
    "$боевая_обстановка = ''", "$действия_игрока = ''", 'нанесенный_вред = 0',
    'количество_врагов = ' + count,
    ...Array.from({ length: count }, (_, k) => {
      const i = k + 1;
      return [`$враг[${i}] = ${q(enemy)}`, `враг[${i}] = 1`,
        `$класс_врага[${i}] = 'рядовой'`, `$имя_врага[${i}] = '검증 적'`,
        `здоровье_врага[${i}] = 10`, `выносливость_врага[${i}] = 10`, `дух_врага[${i}] = 10`,
        `$труп_врага[${i}] = $смерть[$враг[${i}]]`,
        `$тело_врага[${i}] = $отключка[$враг[${i}]]`,
        `$беглец[${i}] = $бегство[$враг[${i}]]`].join('\n');
    })
  ].join('\n');
}
function forced(mode, enemy = 'hoplite_b', count = 1) {
  return base(enemy, count) + `\njo9_fate['mode'] = ${mode}\njo9_fate['phase'] = 0`;
}
const openChoice = () => "$итог_боя = 'победа'\n" + call('result');
function ledgerSeed(enemy = 'hoplite_b') {
  return [`тр = 1`, `$трофей[0] = 'legacy'`, `труп[${q(enemy)}] = 3`,
    `в_отключке[${q(enemy)}] = 4`, `$труп_моба_в_локацию[${q(enemy)}] = 'corpse-token'`,
    `$вырубленный_моб_в_локацию[${q(enemy)}] = 'ko-token'`].join('\n');
}
function unitCases() {
  const cases = [], add = (name, setup, conditions) => cases.push({ name, code: setup + '\n' + conditions.map(([c, t]) => check(c, name.replace(/-/g, '_') + '_' + t)).join('\n') });
  const init = (id, context, setup = '') => base(id) + '\n' + setup + '\n' + call('init', context);
  add('init-fog', init('ogre', 'normal', "$place = 'edge_patrol'\njo9_fog['active'] = 1"), [["jo9_fate['mode'] = 1", 'mode']]);
  add('init-arena-regular', init('hoplite_b', 'arena', "$fight_return = 'Start'\narena_mode = 1\ncombatant = 1"), [["jo9_fate['mode'] = 2", 'mode']]);
  for (const [prefix, offset, actor] of [['master', 0, 0], ['slave', 10, 1], ['assistant-legacy', 20, 2], ['assistant', 30, 2]]) {
    for (const [j, pair] of [['unarmed', 'голая_рабыня'], ['whip', 'госпожа'], ['shinobi', 'шиноби'], ['armored', 'латница'], ['amazon', 'амазонка']].entries()) {
      const [n, id] = pair;
      add('init-colosseum-' + prefix + '-' + n, init(id, 'normal', "$place = 'colosseum'\ncolosseum_fight = " + (offset + j + 1) + '\ncombatant = ' + actor), [["jo9_fate['mode'] = 2", 'mode']]);
    }
  }
  for (const [n, id] of [['egeya', 'egeya'], ['erza', 'erza'], ['owned-slave', 'воспитуемая']]) {
    add('init-special-' + n, init(id, 'normal', "$place = 'edge_patrol'\njo9_fog['active'] = 1"), [["jo9_fate['mode'] = 0", 'mode']]);
  }
  for (const id of ['champion_corvus', 'champion_kamira', 'champion_serpis', 'champion_taurus', 'champion_vatican', 'champion_absolute']) {
    add('init-special-' + id.replace(/_/g, '-'), init(id, 'arena', "$fight_return = 'Start'\narena_mode = 1\ncombatant = 1\nchallenge_type = 1"), [["jo9_fate['mode'] = 0", 'mode']]);
  }
  add('init-arena-nonhuman', init('warg', 'arena', "$fight_return = 'Start'\narena_mode = 1\ncombatant = 1"), [["jo9_fate['mode'] = 0", 'mode']]);
  add('init-arena-mixed-outside-allowlist', base('hoplite_b', 2) + "\n$враг[2] = 'warg'\n$fight_return = 'Start'\narena_mode = 1\ncombatant = 1\n" + call('init', 'arena'), [["jo9_fate['mode'] = 0", 'mode']]);
  add('stage-slot-idempotent', forced(2) + '\n' + ledgerSeed() + '\nqa_first_accepted = ' + resultOf('stage', 1, 1) + '\nqa_duplicate_accepted = ' + resultOf('stage', 1, 1), [
    ['qa_first_accepted = 1 and qa_duplicate_accepted = 0', 'return_contract'],
    ["jo9_fate_enemy[1] = 1 and jo9_fate['count'] = 1", 'pending'], ['тр = 1', 'no_trophy'], ["труп['hoplite_b'] = 3 and в_отключке['hoplite_b'] = 4", 'no_commit']]);
  const double = forced(2, 'hoplite_b', 2) + '\n' + ledgerSeed() + '\nздоровье_врага[1] = 0\nвыносливость_врага[2] = 0\n' + call('stage', 1, 1) + '\n' + call('stage', 2, 2) + '\n' + openChoice();
  add('choose-execute-duplicate-id', double + '\nqa_first_accepted = ' + resultOf('choose', 1) + '\nqa_duplicate_accepted = ' + resultOf('choose', 1) + '\nqa_conflict_accepted = ' + resultOf('choose', 2), [
    ['qa_first_accepted = 1 and qa_duplicate_accepted = 0 and qa_conflict_accepted = 0', 'return_contract'],
    ["jo9_fate['phase'] = 2", 'phase'], ["труп['hoplite_b'] = 5 and в_отключке['hoplite_b'] = 4", 'two_slots_once'],
    ['тр = 3', 'trophy_once'], ["$трофей[0] = 'legacy' and $трофей[1] = 'corpse-token' and $трофей[2] = 'corpse-token'", 'append'],
    ['здоровье_врага[1] <= 0 and здоровье_врага[2] <= 0', 'fatal']]);
  add('choose-spare-duplicate-id', double + '\nqa_first_accepted = ' + resultOf('choose', 2) + '\nqa_duplicate_accepted = ' + resultOf('choose', 2) + '\nqa_conflict_accepted = ' + resultOf('choose', 1), [
    ['qa_first_accepted = 1 and qa_duplicate_accepted = 0 and qa_conflict_accepted = 0', 'return_contract'],
    ["jo9_fate['phase'] = 2", 'phase'], ["труп['hoplite_b'] = 3 and в_отключке['hoplite_b'] = 6", 'two_slots_once'],
    ['тр = 3', 'trophy_once'], ["$трофей[0] = 'legacy' and $трофей[1] = 'ko-token' and $трофей[2] = 'ko-token'", 'append'],
    ['здоровье_врага[1] >= 1 and здоровье_врага[2] >= 1 and выносливость_врага[1] = 0 and выносливость_врага[2] = 0', 'alive_ko']]);
  add('choose-spare-hp-and-morale-same-id', forced(2, 'hoplite_b', 2) + '\n' + ledgerSeed() + "\nздоровье_врага[1] = 0\nдух_врага[2] = 0\n" + call('stage', 1, 1) + '\n' + call('stage', 2, 4) + '\n' + openChoice() + '\n' + call('choose', 2), [
    ["в_отключке['hoplite_b'] = 6 and труп['hoplite_b'] = 3 and тр = 3", 'two_causes_two_slots'],
    ['здоровье_врага[1] >= 1 and здоровье_врага[2] >= 1 and выносливость_врага[1] = 0 and выносливость_врага[2] = 0', 'both_alive_ko']]);
  add('choose-spare-clamps-negative-health-stamina', forced(2) + "\nздоровье_врага[1] = -7\nвыносливость_врага[1] = -5\n" + call('stage', 1, 1) + '\n' + openChoice() + '\n' + call('choose', 2), [
    ["jo9_fate['phase'] = 2 and здоровье_врага[1] >= 1 and выносливость_врага[1] = 0", 'exact_zero'],
    ["труп['hoplite_b'] = 0 and в_отключке['hoplite_b'] = 1 and тр = 1", 'ko_ledger_once']]);
  add('fog-spare-invalid', forced(1, 'ogre') + '\n' + call('stage', 1, 1) + '\n' + openChoice() + '\nqa_invalid_accepted = ' + resultOf('choose', 2), [
    ['qa_invalid_accepted = 0', 'return_contract'],
    ["jo9_fate['phase'] = 1 and jo9_fate_enemy[1] = 1", 'still_pending'], ["труп['ogre'] = 0 and в_отключке['ogre'] = 0 and тр = 0", 'no_commit']]);
  const fall = forced(2, 'goblin', 4) + "\n$враг[2] = 'orc'\n$враг[4] = 'warg'\nтр = 1\n$трофей[0] = 'legacy'\nтруп['goblin'] = 5\nв_отключке['orc'] = 3\n$труп_моба_в_локацию['goblin'] = 'goblin-corpse'\n$вырубленный_моб_в_локацию['orc'] = 'orc-ko'\njo9_fate_enemy[1] = 1\njo9_fate_enemy[2] = 2\njo9_fate_enemy[3] = 3\njo9_fate_enemy[4] = 4\njo9_fate['count'] = 4\n$итог_боя = 'убит'\n" + call('fallback') + '\n' + call('fallback');
  add('fallback-original-causes-once', fall, [
    ["труп['goblin'] = 7 and в_отключке['orc'] = 4", 'original_causes'], ['тр = 4', 'three_ledger_entries'],
    ["труп['warg'] = 0 and в_отключке['warg'] = 0", 'morale_no_trophy'],
    ["$трофей[0] = 'legacy' and $трофей[1] = 'goblin-corpse' and $трофей[2] = 'orc-ko' and $трофей[3] = 'goblin-corpse'", 'append'],
    ["$итог_боя = 'убит'", 'player_outcome_unchanged']]);
  add('result-opens-only-pending-victory', forced(2) + "\njo9_fate_enemy[1] = 1\njo9_fate['count'] = 1\n$итог_боя = 'победа'\n" + call('result'), [
    ["jo9_fate['phase'] = 1 and jo9_fate['mode'] = 2", 'pending_phase']]);
  add('result-player-loss-flushes-once', forced(1, 'goblin', 2) + "\njo9_fate_enemy[1] = 1\njo9_fate_enemy[2] = 4\njo9_fate['count'] = 2\n$итог_боя = 'вырубился'\n" + call('result') + '\n' + call('result'), [
    ["труп['goblin'] = 1 and в_отключке['goblin'] = 0 and тр = 1", 'original_fatal_only'],
    ["jo9_fate['mode'] = 0 and $итог_боя = 'вырубился'", 'defeat_mode_and_outcome']]);
  add('old-save-committed-slot-not-repeated', forced(2, 'hoplite_b', 2) + '\n' + ledgerSeed() + "\nвраг[1] = 0\nздоровье_врага[1] = 0\nповерженные_враги = 1\njo9_fate_enemy[1] = 0\n" + call('stage', 2, 2) + '\n' + openChoice() + '\n' + call('choose', 1) + '\n' + call('choose', 1), [
    ["труп['hoplite_b'] = 4 and в_отключке['hoplite_b'] = 4", 'only_new_slot'], ['тр = 2', 'legacy_not_reappended'], ["$трофей[0] = 'legacy'", 'legacy_preserved']]);
  add('old-save-uninitialized-no-new-choice', base('hoplite_b', 2) + '\n' + ledgerSeed() + "\nвраг[1] = 0\nздоровье_врага[1] = 0\nповерженные_враги = 1\nqa_stage_accepted = " + resultOf('stage', 2, 2) + "\n$итог_боя = 'победа'\n" + call('result'), [
    ["jo9_fate['mode'] = 0 and jo9_fate['phase'] = 0 and jo9_fate_enemy[2] = 0 and qa_stage_accepted = 0", 'legacy_optout'],
    ["труп['hoplite_b'] = 3 and в_отключке['hoplite_b'] = 4 and тр = 1", 'legacy_ledger_unchanged']]);
  add('render-clears-cached-hit-effects', forced(2) + "\nqa_round_on = 0\nздоровье_врага[1] = 0\nвыносливость_врага[1] = 0\n" + call('stage', 1, 1) + [
    "\n$итог_боя = 'победа'", 'jo9_bui_ready = 1', 'jo9_bui_enemy_index = 1',
    "$jo9_bui_enemy_id = 'hoplite_b'", 'jo9_bui_enemy_hp = 10', 'jo9_bui_player_hp = 110',
    "gs 'конец_боя'",
    check(`instr($jo9_bui_fx, ${q('class="jo9-battle-hit"')}) > 0 and instr($jo9_bui_fx, ${q('class="jo9-battle-player-hit"')}) > 0`, 'cached_hit_source_created'),
    check(`instr($jo9_fate['page'], ${q('class="jo9-battle-hit"')}) > 0 and instr($jo9_fate['page'], ${q('class="jo9-battle-player-hit"')}) > 0`, 'cached_hit_page_captured'),
    call('choose', 1), call('render'),
    check(`instr($MAINTXT, ${q('class="jo9-battle-hit"')}) = 0 and instr($MAINTXT, ${q('class="jo9-battle-player-hit"')}) = 0`, 'cached_hit_not_replayed'),
    check(`instr($MAINTXT, ${q('class="jo9-battle-execution"')}) > 0`, 'execution_effect_preserved'),
    call('render')
  ].join('\n'), [
    [`instr($MAINTXT, ${q('class="jo9-battle-hit"')}) = 0 and instr($MAINTXT, ${q('class="jo9-battle-player-hit"')}) = 0`, 'second_render_no_old_hits'],
    ["jo9_fate['phase'] = 2 and jo9_fate['fx_played'] = 1 and тр = 1 and труп['hoplite_b'] = 1 and в_отключке['hoplite_b'] = 0", 'state_and_ledger_once'],
    ['qa_armor_removals = 1', 'no_armor_reentry']]);
  cases[cases.length - 1].needsRenderer = true;
  return cases;
}
function roundCases() {
  return [
    { name: 'round-fog-hp-over-ko', mode: 1, cause: 1, hp: 0, stamina: 0, spirit: 0, text: TEXT.fogFatal },
    { name: 'round-fog-ko-over-morale', mode: 1, cause: 2, hp: 10, stamina: 0, spirit: 0, text: TEXT.fogFaint },
    { name: 'round-fog-morale-faints', mode: 1, cause: 4, hp: 10, stamina: 10, spirit: 0, text: TEXT.fogFaint },
    { name: 'round-fog-state-defeat', mode: 1, cause: 3, hp: 10, stamina: 10, spirit: 10, pawn: true, text: TEXT.fogFatal },
    { name: 'round-arena-hp', mode: 2, cause: 1, hp: 0, stamina: 0, spirit: 0, text: TEXT.arenaFatal },
    { name: 'round-arena-ko', mode: 2, cause: 2, hp: 10, stamina: 0, spirit: 0, text: TEXT.arenaFaint },
    { name: 'round-arena-morale', mode: 2, cause: 4, hp: 10, stamina: 10, spirit: 0, text: TEXT.arenaFaint }
  ];
}
function location(doc, name) { const l = doc.locations.find(x => x.name === name); assert(l, 'Missing location ' + name); return l; }
function set(doc, name, body) { doc.lines[location(doc, name).body] = core.shift(cr(body), -5); }
function add(doc, name, body) {
  assert(!doc.locations.some(x => x.name === name), 'Duplicate diagnostic location ' + name);
  doc.lines.splice(-1, 0, core.shift(name, -5), core.shift('', -5), core.shift(cr(body), -5), core.shift('0', -5));
  doc.lines[3] = core.shift(String(doc.locations.length + 1), -5);
  doc.locations = core.parse(core.serialize(doc)).locations;
}
function buildBaselineRed(raw, prime, marker) {
  const doc = core.parse(raw);
  assert(core.serialize(doc).equals(raw), 'Baseline QSP byte roundtrip');
  set(doc, 'Start', ["killall", 'usehtml = 1', 'SHOWOBJS 0', 'SHOWACTS 0', 'SHOWINPUT 0', 'SHOWSTAT 0', prime,
    "$counter = ''", "$onnewloc = ''", "$ongload = ''", 'sound_on = 0', 'autosave = 0', 'decadesave = 0',
    "gs '#противники'", base('goblin'), "$place = 'edge_patrol'", "jo9_fog['active'] = 1", "jo9_fate['mode'] = 1",
    'здоровье_врага[1] = 0', 'выносливость_врага[1] = 10', 'дух_врага[1] = 10',
    "gt 'конец_раунда'"].join('\n'));
  // The real production round is untouched. Stop only at its completed outcome boundary.
  set(doc, 'конец_боя', [
    check("$итог_боя = 'победа' and поверженные_враги = 1 and враг[1] = 0", 'BASELINE_NOT_VICTORY'),
    "if труп['goblin'] = 1 and тр = 1:",
    " msg 'FAIL_FATE_BASELINE_EAGER_CORPSE_1_TROPHY_1'", ' exit', 'end',
    check("труп['goblin'] = 0 and тр = 0", 'BASELINE_UNEXPECTED_LEDGER'), `msg ${q(marker)}`
  ].join('\n'));
  const bytes = core.serialize(doc);
  assert(core.serialize(core.parse(bytes)).equals(bytes), 'RED fixture QSP roundtrip');
  return { raw: bytes, caseNames: ['baseline-real-round-defers-fatal-ledger'],
    hasHelper: doc.locations.some(x => x.name === HELPER), expectedFailure: 'FAIL_FATE_BASELINE_EAGER_CORPSE_1_TROPHY_1' };
}
function build(raw, prime, marker, allowMissing = false, options = {}) {
  const doc = core.parse(raw), units = unitCases(), rounds = roundCases();
  assert(core.serialize(doc).equals(raw), 'Candidate QSP byte roundtrip');
  const hasHelper = doc.locations.some(x => x.name === HELPER);
  assert(hasHelper || allowMissing, 'Missing production helper ' + HELPER);
  const start = ["killall", 'usehtml = 1', 'SHOWOBJS 0', 'SHOWACTS 0', 'SHOWINPUT 0', 'SHOWSTAT 0', prime,
    "$counter = ''", "$onnewloc = ''", "$ongload = ''", 'sound_on = 0', 'autosave = 0', 'decadesave = 0',
    "gs '#противники'", 'qa_failed = 0', 'qa_completed = 0', "$qa_passed = ''"];
  if (options.case) {
    const selected = units.find(x => x.name === options.case);
    assert(selected, '--case currently selects a helper/init unit case: ' + options.case);
    start.push(selected.code, 'qa_completed += 1', check('qa_completed = 1', 'single_case_count'), `msg ${q(marker)}`);
    set(doc, 'Start', start.join('\n'));
    if (selected.needsRenderer) set(doc, 'interior_change', "$result = $args[1]");
    const fixture = core.serialize(doc);
    assert(core.serialize(core.parse(fixture)).equals(fixture), 'Selected-case QSP roundtrip');
    return { raw: fixture, caseNames: [selected.name], hasHelper, onlyCase: selected.name, selectedRenderer: !!selected.needsRenderer };
  }
  for (const test of units) start.push(test.code, 'qa_completed += 1', '$qa_passed += ' + q(test.name + '|'));
  start.push('qa_round_index = 0', 'qa_round_on = 1', "gt 'qa_fate_round_next'");
  set(doc, 'Start', start.join('\n'));
  const next = [];
  rounds.forEach((test, i) => {
    next.push(`if qa_round_index = ${i}:`, base(test.mode === 1 ? 'ogre' : 'hoplite_b'),
      `jo9_fate['mode'] = ${test.mode}`, "jo9_fate['phase'] = 0",
      `здоровье_врага[1] = ${test.hp}`, `выносливость_врага[1] = ${test.stamina}`, `дух_врага[1] = ${test.spirit}`,
      test.pawn ? "$класс_врага[1] = 'пешка'\n$состояние[1] = 'повержен'" : '', "gt 'конец_раунда'", 'end');
  });
  next.push('qa_round_on = 0', "gt 'qa_fate_exit_begin'");
  add(doc, 'qa_fate_round_next', next.join('\n'));
  const returned = [];
  rounds.forEach((test, i) => {
    returned.push(`if qa_round_index = ${i}:`,
    check(`jo9_fate_enemy[1] = ${test.cause}`, test.name + '_cause'),
    check("jo9_fate['phase'] = 1", test.name + '_choice_phase'),
    check("$итог_боя = 'победа' and враг[1] = 0 and поверженные_враги = 1", test.name + '_winner'),
    check(`тр = 0 and труп[$враг[1]] = 0 and в_отключке[$враг[1]] = 0`, test.name + '_deferred_ledger'),
    check(`instr($действия_врага[1], ${q(test.text)}) > 0`, test.name + '_exact_log'),
    'qa_completed += 1', '$qa_passed += ' + q(test.name + '|'));
    if (test.name === 'round-arena-hp') {
      returned.push(
        check("$jo9_fate['page'] ! ''", 'render_page_cached'),
        'qa_render_hp = здоровье_врага[1]', 'qa_render_stamina = выносливость_врага[1]',
        call('render'),
        check("jo9_fate['phase'] = 1 and jo9_fate['count'] = 1 and jo9_fate_enemy[1] = 1 and тр = 0", 'render_pending_ledger'),
        check('здоровье_врага[1] = qa_render_hp and выносливость_врага[1] = qa_render_stamina and qa_armor_removals = 1', 'render_pending_state'),
        'qa_completed += 1', "$qa_passed += 'render-pending-preserves-state|'",
        call('choose', 2), call('render'),
        check("jo9_fate['phase'] = 2 and jo9_fate['choice'] = 2 and jo9_fate['count'] = 0 and тр = 1", 'render_spare_phase'),
        check("здоровье_врага[1] >= 1 and выносливость_врага[1] = 0 and труп['hoplite_b'] = 0 and в_отключке['hoplite_b'] = 1", 'render_spare_state'),
        check(`instr($MAINTXT, ${q('<div id = "combat_ui_health"><center>')} + $str(здоровье_врага[1]) + ${q('</center></div>')}) > 0`, 'render_spare_health_hud'),
        check(`instr($MAINTXT, ${q('<div id = "combat_ui_stamina"><center>0</center></div>')}) > 0`, 'render_spare_stamina_hud'),
        call('render'),
        check("тр = 1 and в_отключке['hoplite_b'] = 1 and труп['hoplite_b'] = 0 and qa_armor_removals = 1 and jo9_fate['phase'] = 2", 'render_spare_reentry_once'),
        'qa_completed += 1', "$qa_passed += 'render-spare-preserves-state-and-hud|'"
      );
    }
    if (test.name === 'round-arena-ko') {
      returned.push(call('choose', 1), call('render'),
        check(`instr($MAINTXT, ${q('class="jo9-battle-execution"')}) > 0 and jo9_fate['fx_played'] = 1`, 'render_execution_first_fx'),
        check("jo9_fate['phase'] = 2 and тр = 1 and труп['hoplite_b'] = 1 and в_отключке['hoplite_b'] = 0", 'render_execution_committed_once'),
        call('render'),
        check(`instr($MAINTXT, ${q('class="jo9-battle-execution"')}) = 0 and jo9_fate['fx_played'] = 1`, 'render_execution_no_replay'),
        check("jo9_fate['phase'] = 2 and тр = 1 and труп['hoplite_b'] = 1 and в_отключке['hoplite_b'] = 0 and qa_armor_removals = 1", 'render_execution_state_unchanged'),
        'qa_completed += 1', "$qa_passed += 'render-execution-once-preserves-state|'"
      );
    }
    returned.push('end');
  });
  returned.push('qa_round_index += 1', "gt 'qa_fate_round_next'");
  add(doc, 'qa_fate_round_return', returned.join('\n'));
  const endBody = core.shift(doc.lines[location(doc, 'конец_боя').body], 5);
  set(doc, 'конец_боя', endBody + "\nif qa_round_on = 1: gt 'qa_fate_round_return'");
  if (hasHelper) {
    const body = core.shift(doc.lines[location(doc, HELPER).body], 5);
    set(doc, HELPER, "if $args[0] = 'render' and qa_exit_guard_case = 1:\n qa_blocked_render += 1\n gt 'qa_fate_exit_pending_done'\nend\n" + body);
  }
  // These are downstream/display seams only. Fate helper mutations, actual round and actual exit stay production code.
  set(doc, 'jo9_traits_combat', "if $args[0] = 'finish': qa_traits_finish += 1");
  set(doc, 'jo9_fog_relay', "if $args[0] = 'finish': qa_fog_finish += 1");
  set(doc, '$newloc', 'qa_newloc += 1');
  set(doc, 'interior_change', "$result = $args[1]");
  add(doc, 'qa_fate_exit_begin', forced(2, 'hoplite_b') + '\n' + call('stage', 1, 2) + '\n' + openChoice() + "\n$fight_return = 'qa_fate_return'\nqa_traits_finish = 0\nqa_fog_finish = 0\nqa_newloc = 0\nqa_blocked_render = 0\nqa_exit_guard_case = 1\ngt 'выход_из_боя'");
  add(doc, 'qa_fate_exit_pending_done', [check('qa_blocked_render = 1', 'exit_pending_render'),
    check('qa_traits_finish = 0 and qa_fog_finish = 0 and qa_newloc = 0', 'exit_pending_no_side_effect'),
    'qa_completed += 1', "$qa_passed += 'exit-pending-guard|'", 'qa_exit_guard_case = 2',
    call('choose', 2), check("jo9_fate['phase'] = 2", 'exit_choice_confirmed'), "gt 'выход_из_боя'"].join('\n'));
  add(doc, 'qa_fate_return', [
    check('qa_exit_guard_case = 2', 'unexpected_return'),
    check('qa_traits_finish = 1 and qa_fog_finish = 1 and qa_newloc = 1', 'exit_confirmed_once'),
    check("jo9_fate['phase'] = 3", 'exit_phase_three_survives_reset'),
    'qa_completed += 1', "$qa_passed += 'exit-confirmed-once|'", 'qa_exit_guard_case = 3',
    "gs 'выход_из_боя'", check('qa_traits_finish = 1 and qa_fog_finish = 1 and qa_newloc = 1', 'exit_duplicate_stopped'),
    'qa_completed += 1', "$qa_passed += 'exit-duplicate-stopped|'",
    check(`qa_completed = ${units.length + rounds.length + RENDER_CASES.length + 3}`, 'case_count'), `msg ${q(marker)}`].join('\n'));
  const fixture = core.serialize(doc);
  assert(core.serialize(core.parse(fixture)).equals(fixture), 'Diagnostic QSP byte roundtrip');
  return { raw: fixture, caseNames: [...units.map(x => x.name), ...rounds.map(x => x.name), ...RENDER_CASES, 'exit-pending-guard', 'exit-confirmed-once', 'exit-duplicate-stopped'], hasHelper };
}
function parseArgs(argv) {
  const opts = { engine: WORK + '/engine/jack.exe', 'game-dir': WORK, timeout: 30 };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i].replace(/^--/, '');
    if (['run', 'list', 'self-check', 'allow-missing-helper', 'baseline-red'].includes(k)) opts[k] = true;
    else if (['candidate', 'state-save', 'out', 'engine', 'game-dir', 'timeout', 'case'].includes(k)) { assert(argv[i + 1] && !argv[i + 1].startsWith('--'), 'Missing --' + k); opts[k] = argv[++i]; }
    else throw Error('Unknown option ' + argv[i]);
  }
  return opts;
}
function main(argv) {
  const opts = parseArgs(argv);
  if (opts.list || opts['self-check']) {
    const names = [...unitCases().map(x => x.name), ...roundCases().map(x => x.name), ...RENDER_CASES, 'exit-pending-guard', 'exit-confirmed-once', 'exit-duplicate-stopped'];
    assert.equal(new Set(names).size, names.length); assert(names.every(x => /^[a-z-]+$/.test(x)));
    console.log(JSON.stringify({ status: opts.list ? 'LIST_ONLY' : 'SCRIPT_SELF_CHECK_ONLY', cases: names.length, names, engineExecuted: false, filesWritten: 0 }, null, 2)); return;
  }
  for (const k of ['candidate', 'state-save', 'out']) assert(opts[k], '--' + k + ' is required');
  const candidate = path.resolve(opts.candidate), stateSave = path.resolve(opts['state-save']), out = path.resolve(opts.out);
  gate.assertOutside(out, [WORK, 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game', 'G:/somi/JO9O', REPO]);
  assert(!fs.existsSync(out) || fs.readdirSync(out).length === 0, 'Output must be new or empty; no automatic deletion/overwrite');
  assert.notEqual(path.resolve(out, 'fate-native.qsp'), candidate, 'Cannot overwrite candidate');
  const timeout = Number(opts.timeout); assert(Number.isInteger(timeout) && timeout >= 1 && timeout <= 60, 'Invalid timeout');
  const raw = fs.readFileSync(candidate), saveRaw = fs.readFileSync(stateSave), saved = codec.parse(saveRaw);
  assert(codec.serialize(saved).equals(saveRaw), 'Save byte roundtrip');
  const before = { candidate: hash(raw), stateSave: hash(saveRaw) };
  const token = crypto.randomBytes(8).toString('hex').toUpperCase();
  const marker = 'JO9_QA_' + token + '_fate_native_COMPLETE';
  const prepared = opts['baseline-red'] ? buildBaselineRed(raw, gate.primeState(saved).code, marker) : build(raw, gate.primeState(saved).code, marker, !!opts['allow-missing-helper'], { case: opts.case });
  fs.mkdirSync(out, { recursive: true });
  const fixturePath = path.join(out, 'fate-native.qsp'); fs.writeFileSync(fixturePath, prepared.raw);
  const config = path.join(opts['game-dir'], 'config.xml'); if (fs.existsSync(config)) fs.copyFileSync(config, path.join(out, 'config.xml'));
  const resourcesLinked = [];
  for (const dir of ['css', 'content', 'fonts', 'json']) {
    const src = path.join(opts['game-dir'], dir);
    if (fs.existsSync(src)) {
      const target = fs.realpathSync(src);
      fs.symlinkSync(target, path.join(out, dir), process.platform === 'win32' ? 'junction' : 'dir');
      resourcesLinked.push({ directory: dir, target, copiedBytes: 0 });
    }
  }
  fs.writeFileSync(path.join(out, 'FastQSP.ini'), '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
  const plan = [{ name: 'fate-native', file: fixturePath, marker, checkpoint: 'actual helper mutations, round staging, exit guard; downstream/display seams instrumented' }];
  fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify(plan, null, 2) + '\n');
  const report = { status: 'PREPARED_ONLY', createdUTC: new Date().toISOString(), cases: prepared.caseNames,
    candidate, stateSave, inputHashes: before, hasProductionHelper: prepared.hasHelper, fixturePath,
    diagnosticSeams: opts['baseline-red'] ? ['Start', 'end-of-round outcome sentinel'] : prepared.onlyCase ? ['Start', ...(prepared.selectedRenderer ? ['interior_change HTML passthrough'] : [])] : ['Start', 'end-render completion tail', 'render-only helper branch for pending-exit sentinel', 'trait/fog finish counters', '$newloc return counter', 'armor-removal invocation counter', 'interior_change HTML passthrough'],
    productionBodiesUnderTest: opts['baseline-red'] ? ['конец_раунда'] : prepared.onlyCase ? [HELPER + ' mutation/render branches', ...(prepared.selectedRenderer ? ['конец_боя'] : [])] : [HELPER + ' mutation/render branches', 'конец_раунда', 'конец_боя', 'выход_из_боя', '$combat_variable_reset'],
    limits: ['No production or original-save writes.', 'Not the official nine-path release gate.', 'HUD assertions inspect actual QSP MAINTXT, not DOM geometry, effects timing or GUI save-file loading.', 'Native PASS is claimed only after the real engine completion marker.'],
    engineExecuted: false, resourcesLinked, baselineRed: !!opts['baseline-red'], expectedFailure: prepared.expectedFailure || null };
  if (opts.run) {
    assert(fs.existsSync(opts.engine), 'Engine missing'); report.engineExecuted = true;
    const r = cp.spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', RUNNER, '-Engine', path.resolve(opts.engine), '-Plan', path.join(out, 'plan.json'), '-TimeoutSeconds', String(timeout)],
      { encoding: 'utf8', windowsHide: true, timeout: (timeout + 15) * 1000, maxBuffer: 4 * 1024 * 1024 });
    fs.writeFileSync(path.join(out, 'runner.log'), (r.stdout || '') + (r.stderr || ''));
    const results = path.join(out, 'client-results.json'); report.client = fs.existsSync(results) ? JSON.parse(fs.readFileSync(results, 'utf8').replace(/^\uFEFF/, '')) : [];
    report.status = r.status === 0 && !r.error && report.client.length === 1 && report.client[0].pass ? 'PASS' : 'FAIL';
    if (opts['baseline-red'] && !r.error) {
      const stderr = path.join(out, 'fate-native-stderr.log');
      const evidence = fs.existsSync(stderr) ? fs.readFileSync(stderr, 'utf8') : '';
      report.expectedFailureObserved = evidence.includes(prepared.expectedFailure);
      if (report.expectedFailureObserved && report.client.length === 1 && !report.client[0].pass) report.status = 'EXPECTED_RED';
    }
    if (r.error) report.runnerError = r.error.message;
  }
  report.inputHashesUnchanged = hash(fs.readFileSync(candidate)) === before.candidate && hash(fs.readFileSync(stateSave)) === before.stateSave;
  if (!report.inputHashesUnchanged) report.status = 'FAIL';
  fs.writeFileSync(path.join(out, 'fate-native-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, cases: prepared.caseNames.length, engineExecuted: report.engineExecuted, inputHashesUnchanged: report.inputHashesUnchanged, output: out }, null, 2));
  if (report.status === 'FAIL') process.exitCode = 1;
}
if (require.main === module) { try { main(process.argv.slice(2)); } catch (e) { console.error(e.stack || String(e)); process.exitCode = 2; } }
module.exports = { TEXT, unitCases, roundCases, buildBaselineRed, build, parseArgs, main };
