'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../text-workshop/core.cjs');

const [qsp, output] = process.argv.slice(2);
assert.ok(qsp && output, 'Usage: node treatment-probe.cjs <source.qsp> <output-directory>');
const raw = fs.readFileSync(qsp);
const doc = core.parse(raw);
assert.ok(core.serialize(doc).equals(raw));
const start = doc.locations.find(location => location.name === 'Start').body;
const staticBase = doc.locations.find(location => location.name === '#static_base').body;
const staticText = core.shift(doc.lines[staticBase], 5);
const swapRefresh = /\r\n\t! update strings that may contain if statements or subexpressions referring to these slave instances\r\n[\s\S]*?(?=\r\n\})/;
assert.match(staticText, swapRefresh);
doc.lines[staticBase] = core.shift(staticText.replace(swapRefresh, ''), -5);
const script = [
  "gs '#static_base'",
  "slave_state = CONST_INT['slave_exist']",
  "slave['nymphomania'] = 2 & slave['nymphomania_xp'] = 700",
  "slave['jo9_addiction_high_days'] = 12 & slave['jo9_nymph_relief_day'] = 2",
  "slave['sport_affinity'] = -1 & chaotic_essence = 2",
  "if func('jo9_chaotic', 'count', 'slave') ! 1: msg 'FAIL treatment priority count' & exit",
  "if func('jo9_chaotic', 'apply', 'slave') ! 1: msg 'FAIL higher priority apply' & exit",
  "if slave['sport_affinity'] ! 0 or slave['nymphomania'] ! 2 or chaotic_essence ! 1: msg 'FAIL higher priority removal' & exit",
  "if func('jo9_chaotic', 'count', 'slave') ! 1: msg 'FAIL final-tier candidate count' & exit",
  "if func('jo9_chaotic', 'apply', 'slave') ! 1: msg 'FAIL addiction treatment' & exit",
  "if slave['nymphomania'] ! 1 or slave['nymphomania_xp'] ! 700 or chaotic_essence ! 0: msg 'FAIL treatment must downgrade to base trait' & exit",
  "if slave['jo9_nymph_no_upgrade'] ! 1 or slave['jo9_addiction_high_days'] ! 0 or slave['jo9_nymph_relief_day'] ! 0: msg 'FAIL treatment lock or state cleanup' & exit",
  "dynamic $swap_slave_instances, 'slave', 'room1'",
  "if room1['jo9_nymph_no_upgrade'] ! 1 or room1['nymphomania'] ! 1: msg 'FAIL treatment did not follow actor' & exit",
  "assistant_state = CONST_INT['slave_exist'] & assistant['nymphomania'] = -2 & chaotic_essence = 2",
  "if func('jo9_chaotic', 'apply', 'assistant') ! 1: msg 'FAIL frigid tier treatment' & exit",
  "if assistant['nymphomania'] ! -1 or chaotic_essence ! 1: msg 'FAIL frigid tier downgrade' & exit",
  "qa_treatment_result = func('jo9_chaotic', 'apply', 'assistant')",
  "if qa_treatment_result ! 1 or assistant['nymphomania'] ! 0 or chaotic_essence ! 0: msg 'FAIL normal frigid treatment <<qa_treatment_result>>/<<assistant[''nymphomania'']>>/<<chaotic_essence>>' & exit",
  "msg 'JO9_QA_NYMPH_treatment_COMPLETE'",
];
doc.lines[start] = core.shift(script.join('\r\n'), -5);
const out = path.resolve(output);
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, 'treatment.qsp');
fs.writeFileSync(file, core.serialize(doc));
fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify([{
  name: 'treatment',
  marker: 'JO9_QA_NYMPH_treatment_COMPLETE',
  checkpoint: 'chaotic essence priority, downgrade, and permanent actor treatment state',
  file,
}]));
