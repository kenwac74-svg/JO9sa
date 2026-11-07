'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../text-workshop/core.cjs');

const [input, output] = process.argv.slice(2);
assert.ok(input && output, 'Pass the current WORK QSP and a separate output directory');
const raw = fs.readFileSync(input);
const doc = core.parse(raw);
assert.equal(doc.hash, '59f5d13fb6846b340db804ffb58de39f5df573c3bd936b7153247610241ff94e');
assert.ok(core.serialize(doc).equals(raw));
const location = doc.locations.find(item => item.name === '$ongload');
assert.ok(location);
const before = core.shift(doc.lines[location.body], 5);
const anchor = "gs 'jo9_seed_role_images'";
assert.equal(before.split(anchor).length - 1, 1);
const block = [
  '! JO9 MOD START SHIRU_EXISTING_SAVE_ADDICTION_20261107',
  'local $jo9_shiru_load_roles, $jo9_shiru_load_role, jo9_shiru_load_i',
  "copyarr '$jo9_shiru_load_roles', '$all_slave_characters'",
  "$jo9_shiru_load_roles[arrsize('$jo9_shiru_load_roles')] = 'snk_parked_slave'",
  "for jo9_shiru_load_i = 0 to arrsize('$jo9_shiru_load_roles') - 1:",
  ' $jo9_shiru_load_role = $jo9_shiru_load_roles[jo9_shiru_load_i]',
  ' dynamic $replace({',
  "  if jo9shiruactor_state > 0 and jo9shiruactor_type = 1448 and jo9shiruactor['jo9_shiru_addiction_migrated'] = 0:",
  "   if jo9shiruactor['jo9_nymph_no_upgrade'] = 0:",
  "    jo9shiruactor['nymphomania'] = 2",
  "    jo9shiruactor['nymphomania_revealed'] = 2",
  '   end',
  "   jo9shiruactor['jo9_shiru_addiction_migrated'] = 1",
  '  end',
  " }, 'jo9shiruactor', $jo9_shiru_load_role)",
  'end',
  '! JO9 MOD END SHIRU_EXISTING_SAVE_ADDICTION_20261107',
].join('\r\n');
const replacement = anchor + '\r\n' + block;
doc.lines[location.body] = core.shift(before.replace(anchor, () => replacement), -5);
const candidate = core.serialize(doc);
const checked = core.parse(candidate);
assert.ok(core.serialize(checked).equals(candidate));
assert.equal(checked.locations.length, doc.locations.length);
const original = core.parse(raw);
for (let i = 0; i < original.lines.length; ++i) {
  if (i !== location.body) assert.equal(checked.lines[i], original.lines[i]);
}
const replay = before.replace(anchor, () => replacement);
assert.equal(core.shift(checked.lines[location.body], 5), replay);
const manifest = {
  id:'SHIRU_EXISTING_SAVE_ADDICTION_20261107',
  before_sha256:original.hash,
  after_sha256:checked.hash,
  edits:[{location:'$ongload', field:'body', count:1, old:anchor, new:replacement}],
};
fs.mkdirSync(output, {recursive:true});
fs.writeFileSync(path.join(output, 'jack.qsp'), candidate);
fs.writeFileSync(path.join(output, 'patch.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({hash:checked.hash, location:'$ongload', edits:1}));
