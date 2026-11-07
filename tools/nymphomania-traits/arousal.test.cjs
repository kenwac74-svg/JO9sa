'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../text-workshop/core.cjs');

const [input, output, option, checkpoint] = process.argv.slice(2);
assert.ok(input && output, 'Usage: node arousal.test.cjs <input.qsp> <output-dir> [--apply|--extended]');
const source = fs.readFileSync(input);
const doc = core.parse(source);
assert.ok(core.serialize(doc).equals(source));
const field = name => doc.locations.find(loc => loc.name === name).body;
const lines = (...rows) => rows.join('\r\n');
const body = name => core.shift(doc.lines[field(name)], 5);
const set = (name, code) => { doc.lines[field(name)] = core.shift(code, -5); };
if (option === '--apply') {
  require('./arousal.cjs').applyArousal({
    body, lines,
    edit(location, before, after) {
      const code = body(location);
      assert.equal(code.split(before).length - 1, 1, location + ': ' + before);
      set(location, code.replace(before, () => after));
    },
    append(name, code) {
      assert.ok(!doc.locations.some(loc => loc.name === name));
      doc.lines.splice(-1, 0, core.shift(name, -5), '', core.shift(code, -5), core.shift('0', -5));
      doc.lines[3] = core.shift(String(doc.locations.length + 1), -5);
    },
  });
}
const testedHash = core.hash(core.serialize(doc));
const marker = 'JO9_QA_V20261107_nymph_arousal_COMPLETE';
const check = (label, condition) => lines(
  `if ${condition}:`,
  ' qa_checks += 1',
  ...(checkpoint === label ? [` msg '${marker}'`, ' exit'] : []),
  'else',
  ` msg 'JO9_NYMPH_AROUSAL_FAIL_${label}_value_<<slave_rate["arousal"]>>_ap_<<slave["energy"]>>_day_<<slave["jo9_nymph_relief_day"]>>'`,
  ' exit',
  'end'
);

const common = "dynamic $replace($dyn_erotic_stimulation, 'dyn'+'slave', 'slave')";
const stats = "dynamic $replace($dyn_calc_slave_attrs, 'dyn'+'slave', 'slave')";
const xp = "gs 'jo9_nymph_arousal', 'xp', 'slave', 1";
const mark = "gs 'jo9_nymph_arousal', 'mark_relief', 'slave'";
const extended = option === '--apply' || option === '--extended';

set('Start', lines(
  "gs '#static_base'",
  "gs '#dynamic'",
  "gs '#variative'",
  'debug = 1 & autosave = 0 & decadesave = 0 & sound_on = 0',
  "slave_state = CONST_INT['slave_exist'] & slave['nymphomania'] = 2",
  "slave['sensitivity'] = 2 & interaction_slave['erotic_stimulation'] = 2",
  common,
  check('shared_gain_150_percent', "slave_rate['arousal'] = 6"),
  ...(extended ? [
    "slave['nymphomania'] = 1 & slave_rate['arousal'] = 0",
    common,
    check('normal_gain_unchanged', "slave_rate['arousal'] = 4"),
    "slave['nymphomania'] = 2",
    "qa_odd_a = func('jo9_nymph_arousal', 'gain', 'slave', 1)",
    "qa_odd_b = func('jo9_nymph_arousal', 'gain', 'slave', 1)",
    check('odd_carry', "qa_odd_a = 1 and qa_odd_b = 2 and slave['jo9_nymph_gain_half'] = 0"),
    "qa_negative = func('jo9_nymph_arousal', 'gain', 'slave', -3)",
    check('decay_unchanged', 'qa_negative = -3'),
    "room1['nymphomania'] = 2 & room1_rate['arousal'] = 20",
    "qa_set_higher = func('jo9_nymph_arousal', 'set', 'room1', 30)",
    "qa_set_lower = func('jo9_nymph_arousal', 'set', 'room1', 10)",
    check('scripted_rate_change_positive_only', 'qa_set_higher = 35 and qa_set_lower = 10'),
    "slave['nymphomania'] = -2 & slave['arousal'] = 5 & slave_rate['arousal'] = 200 & slave_rate['temp_arousal'] = 100",
    xp,
    stats,
    check('stone_cold', "slave['arousal'] = 0 and slave_rate['arousal'] = 0 and slave_rate['temp_arousal'] = 0 and slave['nymphomania_xp'] = 1 and slave['nymphomania'] = -2"),
    "slave['nymphomania'] = 1 & slave['nymphomania_xp'] = 599",
    xp,
    check('threshold_is_strict', "slave['nymphomania'] = 1 and slave['nymphomania_xp'] = 600"),
    "slave['jo9_nymph_no_upgrade'] = 1",
    'for qa_trial = 1 to 100:',
    xp,
    'end',
    check('treated_never_upgrades', "slave['nymphomania'] = 1 and slave['nymphomania_xp'] = 700"),
    "slave['jo9_nymph_no_upgrade'] = 0",
    'qa_upgrades = 0',
    'for qa_trial = 1 to 500:',
    " slave['nymphomania'] = 1 & slave['nymphomania_revealed'] = 0",
    xp,
    " if slave['nymphomania'] = 2 and slave['nymphomania_revealed'] = 1: qa_upgrades += 1",
    'end',
    check('xp_event_probability_<<qa_upgrades>>', 'qa_upgrades >= 20 and qa_upgrades <= 85'),
    "slave['nymphomania'] = 2 & day = 17 & slave['stamina'] = 5 & slave['energy'] = 2",
    "slave['arousal'] = 1 & slave_rate['arousal'] = cont_atr_threshold[1] - 1",
    stats,
    check('natural_zero_no_bonus', "slave['arousal'] = 0 and slave['energy'] = 2 and slave['jo9_nymph_relief_day'] = 0"),
    "slave['arousal'] = 1 & slave_rate['arousal'] = cont_atr_threshold[1]",
    "interaction_slave['erotic_stimulation'] = 22 & orgastic = 1 & slave['no_orgasm_rule'] = 0",
    common,
    stats,
    check('confirmed_zero_bonus', "slave['arousal'] = 0 and slave['energy'] = 4 and slave['jo9_nymph_relief_day'] = 18"),
    stats,
    check('one_award', "slave['energy'] = 4"),
    "slave['arousal'] = 1 & slave_rate['arousal'] = cont_atr_threshold[1] - 1",
    mark,
    stats,
    check('repeated_day_energy_cap', "slave['energy'] = 5 and slave['jo9_nymph_relief_day'] = 18"),
    "slave['arousal'] = 5 & slave_rate['arousal'] = cont_atr_threshold[4] & slave['jo9_addiction_high_days'] = 8",
    mark,
    stats,
    check('partial_relief_clears_pending_and_streak', "slave['arousal'] = 4 and slave['jo9_nymph_relief_pending'] = 0 and slave['jo9_addiction_high_days'] = 0"),
    "dynamic $swap_slave_instances, 'assistant', 'slave'",
    check('role_swap_carries_bonus', "assistant['jo9_nymph_relief_day'] = 18 and assistant['nymphomania'] = 2 and slave['jo9_nymph_relief_day'] = 0"),
  ] : []),
  `msg '${marker}'`
));
const out = path.resolve(output);
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'nymph-arousal-probe.qsp');
const plan = path.join(out, 'plan.json');
fs.writeFileSync(file, core.serialize(doc));
fs.writeFileSync(plan, JSON.stringify([{ name: 'nymph-arousal', marker, checkpoint: 'Native shared arousal action', file }]));
console.log(JSON.stringify({ inputHash: doc.hash, testedHash, plan }));
