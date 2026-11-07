'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../text-workshop/core.cjs');

const [qsp, output] = process.argv.slice(2);
assert.ok(qsp && output, 'Usage: node productivity-probe.cjs <source.qsp> <output-directory>');
const doc = core.parse(fs.readFileSync(qsp));
const body = name => doc.locations.find(location => location.name === name).body;
const daily = core.shift(doc.lines[body('next_day')], 5);
const cook = daily.split('\r\n').find(row => /^\s*slave_skill = .*slave\['cook'\].*slave\['mood'\]/.test(row));
const jobs = core.shift(doc.lines[body('interaction')], 5).split('\r\n');
const brew = jobs.find(row => /^\s*brewing_skill = .*dynslave\['alchemy'\]/.test(row))
  ?.replaceAll('dynslave', 'slave');
assert.ok(cook, 'Main actor cook quality calculation');
assert.ok(brew, 'Laboratory proficiency calculation');
const script = [
  "gs '#static_base'",
  "day = 10 & slave_state = CONST_INT['slave_exist']",
  "slave['cook'] = 3 & slave['mood'] = 3 & slave['nymphomania'] = 2",
  "slave['jo9_nymph_relief_day'] = day + 1",
  cook,
  "if slave_skill ! 4 or slave['cook'] ! 3: msg 'FAIL work result increased by one on relief day' & exit",
  "slave['alchemy'] = 3 & slave['enchanter'] = 4",
  brew,
  "if brewing_skill ! 4 or slave['alchemy'] ! 3: msg 'FAIL relief laboratory proficiency' & exit",
  "if func('jo9_traits_personality', 'xp', 'slave', 'cook', 4) ! 5: msg 'FAIL education effect on relief day' & exit",
  'day += 1',
  cook,
  "if slave_skill ! 3 or func('jo9_traits_personality', 'xp', 'slave', 'cook', 4) ! 4: msg 'FAIL effect expires at day boundary' & exit",
  "slave_rate['mood'] = 20 & slave['arousal'] = 5",
  "for qa_days = 3 to 12 step 3:",
  " if qa_days ! 9:",
  "  slave['jo9_addiction_high_days'] = qa_days",
  "  dynamic $replace($recalc_slave_mood, 'dyn'+'slave', 'slave')",
  "  if slave['mood'] ! 2 - iif(qa_days = 12, 3, qa_days / 3): msg 'FAIL tier mood effect' & exit",
  " end",
  "end",
  "slave['arousal'] = 4",
  "dynamic $replace($recalc_slave_mood, 'dyn'+'slave', 'slave')",
  "if slave['mood'] ! 2: msg 'FAIL below five must suppress neglect mood' & exit",
  "slave['arousal'] = 0 & slave['jo9_nymph_relief_day'] = day + 1",
  "dynamic $replace($recalc_slave_mood, 'dyn'+'slave', 'slave')",
  "if slave['mood'] ! 4: msg 'FAIL actual relief mood stages' & exit",
  "msg 'JO9_QA_NYMPH_productivity_COMPLETE'",
];
doc.lines[body('Start')] = core.shift(script.join('\r\n'), -5);
const out = path.resolve(output);
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'productivity.qsp');
fs.writeFileSync(file, core.serialize(doc));
fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify([{
  name: 'productivity',
  marker: 'JO9_QA_NYMPH_productivity_COMPLETE',
  checkpoint: 'native household work quality, positive education gain, and same-day duration',
  file,
}]));
