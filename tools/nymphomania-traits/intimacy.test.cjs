'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../text-workshop/core.cjs');

const [input, output, option] = process.argv.slice(2);
assert.ok(input && output, 'Usage: node intimacy.test.cjs <input.qsp> <output-dir> [--apply]');
const doc = core.parse(fs.readFileSync(input));
const lines = (...rows) => rows.join('\r\n');
const field = name => doc.locations.find(loc => loc.name === name).body;
const body = name => core.shift(doc.lines[field(name)], 5);
const set = (name, value) => { doc.lines[field(name)] = core.shift(value, -5); };
const extraLocations = [];

if (option !== '--apply' && doc.locations.some(location => location.name === 'jo9_nymph_reaction')) {
  extraLocations.push(['jo9_nymph_reaction', body('jo9_nymph_reaction')]);
}

if (option === '--apply') {
  require('./intimacy.cjs').applyIntimacy({
    body, lines,
    edit(name, before, after) {
      const code = body(name);
      assert.equal(code.split(before).length - 1, 1, name + ': ' + before.slice(0, 160));
      set(name, code.replace(before, () => after));
    },
    append(name, value) {
      extraLocations.push([name, value]);
    },
  });
}

const marker = 'JO9_QA_V20261107_nymph_intimacy_COMPLETE';
const check = (label, condition) => lines(
  `if ${condition}:`,
  ' qa_checks += 1',
  'else',
  ` msg 'JO9_NYMPH_INTIMACY_FAIL_${label}_<<interaction_slave["res"]>>_<<interaction_assistant["res"]>>_<<interaction_room1["res"]>>_<<interaction_slave["diligence"]>>'`,
  ' exit',
  'end'
);

// Run the real acceptance/repulse/diligence templates using controlled actor data.
const decide = role => lines(
  `interaction_${role}['repulse'] = 13`,
  ...['sex_acceptance', 'repulse_check', 'diligence']
    .map(stage => `dynamic $replace($dyn_${stage}, 'dyn'+'slave', '${role}')`)
);
const setupActor = role => lines(
  `${role}_state = CONST_INT['slave_exist']`,
  `$${role}_psy_status = 'servile' & $${role}_psy_basic = 'soft'`,
  `${role}['moral'] = 1 & ${role}['obedience'] = 2 & ${role}['obedience_difficulty'] = 10`
);
const assignments = (name, expression) => body(name).split('\r\n')
  .filter(line => expression.test(line)).map(line => line.trim());
const direct = role => assignments('sex_initiate',
  new RegExp(`^\\s*sex\\['girl_(?:moral|obedience)'\\] = .*['(, ]${role}['\\[]`));
const gentle = role => assignments('sex_interaction_result',
  new RegExp(`^\\s*(?:if .*?: )?${role}\\['pos_gentle'\\] =`));

const templates = ['sex_acceptance', 'repulse_check', 'diligence'].map(name => {
  const template = body('#dynamic').match(new RegExp(`^\\$dyn_${name} = \\{\\r\\n[\\s\\S]*?^\\}`, 'm'))?.[0];
  assert.ok(template, name);
  return template;
});
const paidRoute = body('interaction').match(
  /^if code_defined\['jo9_interaction_paid_threesome'\] = 0:\r\n[\s\S]*?^if interaction = 65483:\r\n[\s\S]*?^end(?=\r\n)/m
)?.[0];
if (option === '--apply') assert.ok(paidRoute, 'Assistant paid 3P dispatcher');

set('Start', lines(
  ...templates,
  "CONST_INT['slave_exist'] = 1 & CONST_INT['no_slave'] = 0",
  "$all_slave_characters[0] = 'slave' & $all_slave_characters[1] = 'assistant' & $all_slave_characters[2] = 'room1'",
  "difficulty_setting = 2 & master_style = 5 & stimulating = 1 & orgastic = 0",
  setupActor('slave'),
  setupActor('assistant'),
  setupActor('room1'),
  "slave['nymphomania'] = 2 & assistant['nymphomania'] = 2 & room1['nymphomania'] = 2",
  'interaction = 5414',
  "slave['moral'] = 5 & slave['obedience'] = 20 & slave['obedience_difficulty'] = 6",
  decide('slave'),
  "qa_expected_diligence = interaction_slave['diligence']",
  "slave['moral'] = 1 & slave['obedience'] = 2 & slave['obedience_difficulty'] = 10",
  decide('slave'),
  check('relaxed_hard_virtual_devotion', "interaction_slave['res'] = 9 and interaction_slave['diligence'] = qa_expected_diligence"),
  'interaction = 54141',
  decide('slave'),
  check('relaxed_anal', "interaction_slave['res'] = 9"),
  'interaction = 54142',
  decide('slave'),
  check('relaxed_oral', "interaction_slave['res'] = 9"),
  'interaction = 441',
  decide('assistant'),
  check('assistant_relaxed', "interaction_assistant['res'] = 9"),
  'interaction = 4411',
  decide('assistant'),
  check('assistant_anal', "interaction_assistant['res'] = 9"),
  'interaction = 4412',
  decide('assistant'),
  check('assistant_oral', "interaction_assistant['res'] = 9"),
  'interaction = 1027',
  decide('room1'),
  check('room_sex', "interaction_room1['res'] = 9"),
  'menu_threesome = 5416 & menu_threesome_noassistant = 5418 & interaction = menu_threesome',
  "slave['nymphomania'] = 1",
  decide('slave'),
  decide('assistant'),
  check('three_person_participant_isolation', "interaction_slave['res'] = -11 and interaction_assistant['res'] = 9"),
  "slave['nymphomania'] = 2",
  'interaction = menu_threesome_noassistant',
  decide('slave'),
  decide('assistant'),
  check('paid_three_person_original_slot', "interaction_slave['res'] = 9 and interaction_assistant['res'] = -11"),
  'interaction = 65483',
  decide('slave'),
  decide('assistant'),
  check('paid_three_person_assistant_slot', "interaction_slave['res'] = -11 and interaction_assistant['res'] = 9"),
  ...(paidRoute ? [
    "slave_state = CONST_INT['no_slave'] & sparks = 1 & master_excitement = 0",
    "assistant['virginity'] = 2 & assistant['oral'] = 4 & assistant['sub_vaginal'] = 2",
    "interaction_slave['repulse'] = 33 & interaction_assistant['repulse'] = 0",
    "gs 'paid_route'",
    check('paid_dispatch_targets_selected_assistant', "$interaction_type = 'make_assistant_do' and interaction_assistant['repulse'] = 8 and interaction_assistant['motivation_repulse'] = 2 and interaction_slave['repulse'] = 33"),
    "slave_state = CONST_INT['slave_exist']",
  ] : []),
  'interaction = 5415',
  ...direct('slave'),
  check('direct_slave_minigame', "sex['girl_moral'] = 5 and sex['girl_obedience'] = 20"),
  'interaction = 44',
  ...direct('assistant'),
  check('direct_assistant_minigame', "sex['girl_moral'] = 5 and sex['girl_obedience'] = 20"),
  "interaction = 99999",
  decide('assistant'),
  check('unrelated_command', "interaction_assistant['res'] = -11"),
  check('stored_values', "slave['moral'] = 1 and assistant['moral'] = 1 and room1['moral'] = 1 and slave['obedience'] = 2 and assistant['obedience'] = 2"),
  "slave['nymphomania'] = -2 & slave['pos_gentle'] = 0",
  "assistant['nymphomania'] = -1 & assistant['pos_gentle'] = 0",
  ...gentle('slave'),
  ...gentle('assistant'),
  check('frigid_has_no_intimacy', "slave['pos_gentle'] = 0 and assistant['pos_gentle'] = 2"),
  `msg '${marker}'`
));

const folder = path.resolve(output);
fs.mkdirSync(folder, { recursive: true });
const file = path.join(folder, 'nymph-intimacy.qsp');
const plan = path.join(folder, 'plan.json');
const runtime = [['Start', body('Start')], ['jo9_traits', body('jo9_traits')], ...extraLocations];
if (paidRoute) runtime.push(['paid_route', paidRoute]);
const qsp = [
  ...doc.lines.slice(0, 3),
  core.shift(String(runtime.length), -5),
  ...runtime.flatMap(([name, code]) => [core.shift(name, -5), '', core.shift(code, -5), core.shift('0', -5)]),
  '',
];
fs.writeFileSync(file, Buffer.from(qsp.join('\r\n'), 'utf16le'));
fs.writeFileSync(plan, JSON.stringify([{
  name: 'nymph-intimacy', marker, checkpoint: 'Virtual devotion, actor routing, and intimacy preservation', file,
}]));
