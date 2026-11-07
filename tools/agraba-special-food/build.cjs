'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../text-workshop/core.cjs');
const {patchPanels} = require('./panels.cjs');

const baseline = '789a4634b77ad62c55e991b468ad24550d00e3093e741f492f8f5dab55ce58e3';
const [input, output, mode = 'complete'] = process.argv.slice(2);
assert.ok(input && output && ['complete', 'panels-qa'].includes(mode),
  'Usage: node build.cjs BASE.qsp OUTPUT_DIRECTORY [panels-qa]');
const outputQsp = path.resolve(output, 'jack.qsp');
assert.notEqual(path.resolve(input).toLowerCase(), outputQsp.toLowerCase(), 'Build to a separate directory');
const raw = fs.readFileSync(input);
const doc = core.parse(raw);
assert.equal(doc.hash, baseline, 'Recheck patch anchors against the current WORK baseline');
assert.ok(core.serialize(doc).equals(raw), 'Baseline must round-trip');

const sourceLines = doc.lines.slice();
const byName = new Map(doc.locations.map(loc => [loc.name, loc]));
const changedFields = new Set();
const edits = [];
function text(location) {
  const loc = byName.get(location);
  assert.ok(loc, 'Missing location: ' + location);
  return core.shift(doc.lines[loc.body], 5);
}
function edit(location, old, next, label) {
  const before = text(location);
  assert.ok(old && old !== next, 'Empty or no-op edit: ' + label);
  assert.equal(before.split(old).length - 1, 1, location + ': ' + (label || old.slice(0, 120)));
  const {body} = byName.get(location);
  doc.lines[body] = core.shift(before.replace(old, () => next), -5);
  changedFields.add(body);
  edits.push({location, field:'body', count:1, old, new:next, label});
}
function append(location, body) {
  assert.ok(!byName.has(location), 'Location already exists: ' + location);
  const offset = doc.lines.length - 1;
  doc.lines.splice(offset, 0, core.shift(location, -5), '', core.shift(body, -5), core.shift('0', -5));
  byName.set(location, {name:location, desc:offset + 1, body:offset + 2});
  doc.lines[3] = core.shift(String(byName.size), -5);
  edits.push({op:'append_location', location, body});
}
const api = {edit, text, append};
patchPanels(api);
if (mode === 'complete') {
  require('./purchases.cjs').patchPurchases(api);
  require('./cooking.cjs').patchCooking(api);
}
const candidate = core.serialize(doc);
const checked = core.parse(candidate);
assert.ok(core.serialize(checked).equals(candidate), 'Candidate must round-trip');
assert.deepEqual(checked.locations.map(loc => loc.name), [...byName.keys()]);
for (let i = 0; i < sourceLines.length - 1; ++i) {
  if (i !== 3 && !changedFields.has(i)) assert.equal(checked.lines[i], sourceLines[i], 'Unexpected changed QSP field ' + i);
}
for (const loc of checked.locations) assert.equal(core.shift(checked.lines[loc.body], 5), text(loc.name));

const manifest = {id:'AGRABA_SPECIAL_FOOD_20261107', mode, before_sha256:doc.hash, after_sha256:checked.hash, edits};
fs.mkdirSync(output, {recursive:true});
fs.writeFileSync(outputQsp, candidate);
fs.writeFileSync(path.resolve(output, 'patch.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({hash:checked.hash, edits:edits.length, locations:[...new Set(edits.map(op => op.location))]}, null, 2));
