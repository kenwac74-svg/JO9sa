'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../text-workshop/core.cjs');
const { applyTraitIntegration } = require('./integration.cjs');

const baseline = '38e4027fb3dc792a3c15b91a3c8adc83241dcc0e181f582b87db80733d7bac6b';
const defaultSource = 'C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game/jack.qsp';
const outputRoot = path.resolve(process.argv[3] || 'tmp/nymphomania-traits-20261107/combined');
const integrationOnly = process.argv.includes('--integration-only');
const rootOnly = process.argv.includes('--root-only');

function open(raw) {
  const doc = core.parse(raw);
  assert.ok(core.serialize(doc).equals(raw), 'The input QSP must round trip');
  const locations = new Map(doc.locations.map(location => [location.name, location]));
  const operations = [];
  const lines = (...rows) => rows.join('\r\n');
  function body(name) {
    assert.ok(locations.has(name), 'Missing QSP location: ' + name);
    return core.shift(doc.lines[locations.get(name).body], 5);
  }
  function edit(name, before, after) {
    const original = body(name);
    assert.equal(original.split(before).length - 1, 1, name + ': ' + before.slice(0, 180));
    doc.lines[locations.get(name).body] = core.shift(original.replace(before, () => after), -5);
    operations.push({ location: name, field: 'body', count: 1, old: before, new: after });
  }
  function append(name, source) {
    assert.ok(!locations.has(name), 'Duplicate QSP location: ' + name);
    const offset = doc.lines.length - 1;
    const location = { index: locations.size, name, desc: offset + 1, body: offset + 2 };
    doc.lines.splice(offset, 0, core.shift(name, -5), '', core.shift(source, -5), core.shift('0', -5));
    locations.set(name, location);
    doc.lines[3] = core.shift(String(locations.size), -5);
    operations.push({ op: 'append_location', location: name, body: source });
  }
  return { doc, api: { body, edit, append, lines }, operations };
}

const raw = fs.readFileSync(process.argv[2] || defaultSource);
const build = open(raw);
assert.equal(build.doc.hash, baseline, 'Use the verified live baseline or rebase the anchors explicitly.');
if (!integrationOnly && !rootOnly) {
  require('./arousal.cjs').applyArousal(build.api);
  require('./daily.cjs').applyDaily(build.api);
  require('./intimacy.cjs').applyIntimacy(build.api);
}
if (!integrationOnly) require('./productivity.cjs').applyProductivity(build.api);
applyTraitIntegration(build.api);

const result = core.serialize(build.doc);
const verified = core.parse(result);
assert.ok(core.serialize(verified).equals(result));
const replay = open(raw);
for (const op of build.operations) {
  if (op.op === 'append_location') replay.api.append(op.location, op.body);
  else replay.api.edit(op.location, op.old, op.new);
}
assert.ok(core.serialize(replay.doc).equals(result), 'Recorded operations must reproduce the candidate');
const affected = [...new Set(build.operations.map(op => op.location))];
fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(path.join(outputRoot, 'jack.qsp'), result);
fs.writeFileSync(path.join(outputRoot, 'patch.json'), JSON.stringify({
  id: 'NYMPHOMANIA_TRAITS_20261107',
  before_sha256: baseline,
  after_sha256: verified.hash,
  edits: build.operations,
}, null, 2) + '\n');
console.log(JSON.stringify({ hash: verified.hash, operations: build.operations.length, affected }, null, 2));
