'use strict';
// Isolated preparation only. Never writes WORK, the source repository, or Full.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const lineChecks = require('G:/somi/JO9sa/tools/qa/check-qsp-line-endings.cjs');
const markerChecks = require('G:/somi/JO9sa/tools/qa/check-qsp-marker-boundaries.cjs');
const work = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const pendingPath = path.resolve(__dirname, '../../hard-trait-price-20261104/FACTION_REPUTATION_S_PLUS_PENDING.json');
const pending = JSON.parse(fs.readFileSync(pendingPath, 'utf8'));
const raw = fs.readFileSync(work);
assert.equal(core.hash(raw), pending.comparison_sha256, 'WORK drifted before isolated preparation');
const doc = core.parse(raw);
assert.ok(core.serialize(doc).equals(raw), 'baseline round trip');
const read = (d, name, field = 'body') => {
  const loc = d.locations.find(x => x.name === name);
  assert.ok(loc, name);
  return core.shift(d.lines[loc[field]], 5);
};
const occurrences = (text, needle) => text.split(needle).length - 1;
const edits = pending.edits.map(x => ({ ...x }));
const options = read(doc, '#options');
const labelsOld = ` FUNC('$menu', 'interaction_city', $menu_item_buyLuminous, menu_BuyLuminous, '츠키 ($2000)')\r\n ELSE\r\n FUNC('$menu', 'location_gray', $menu_item_buyLuminous_gray, empty, '츠키 ($2000)')`;
assert.equal(occurrences(options, labelsOld), 1, 'wrong Luminous block must be unique');
const labelAt = options.indexOf(labelsOld);
const optionsAfter = options.replace(labelsOld, labelsOld.replaceAll('츠키 ($2000)', '루미너스 ($2000)'));
let labelEdit;
for (let pad = 16; !labelEdit; pad *= 2) {
  const a = Math.max(0, labelAt - pad), b = Math.min(options.length, labelAt + labelsOld.length + pad);
  const old = options.slice(a, b), newText = optionsAfter.slice(a, b);
  if (occurrences(options, old) === 1 && occurrences(options, newText) === 0 && occurrences(optionsAfter, newText) === 1) labelEdit = { location: '#options', field: 'body', old, new: newText, count: 1 };
}
edits.push(labelEdit);
const audit = [];
for (const [index, e] of edits.entries()) {
  const loc = doc.locations.find(x => x.name === e.location);
  const before = read(doc, e.location, e.field);
  assert.equal(occurrences(before, e.old), e.count, `old count ${index}`);
  assert.equal(occurrences(before, e.new), 0, `already applied ${index}`);
  doc.lines[loc[e.field]] = core.shift(before.replace(e.old, e.new), -5);
  const after = read(doc, e.location, e.field);
  assert.equal(occurrences(after, e.new), e.count, `new count ${index}`);
  audit.push({ index, location: e.location, field: e.field, count: e.count, before_line: before.slice(0, before.indexOf(e.old)).split('\r\n').length, old_chars: e.old.length, new_chars: e.new.length });
}
const candidate = core.serialize(doc);
const parsed = core.parse(candidate);
assert.ok(core.serialize(parsed).equals(candidate), 'candidate round trip');
assert.equal(new Set(parsed.locations.map(x => x.name)).size, parsed.locations.length, 'unique locations');
const changedFields = [];
const baseline = core.parse(raw);
for (let i = 0; i < doc.lines.length; i++) if (doc.lines[i] !== baseline.lines[i]) {
  const loc = doc.locations.find(x => x.body === i || x.desc === i);
  assert.ok(loc, `non-body/desc data changed ${i}`);
  changedFields.push({ location: loc.name, field: loc.body === i ? 'body' : 'desc' });
}
assert.deepEqual(changedFields.map(x => x.location).sort(), ['#options', '#static_base', '#static_txt', 'main_screen', 'menu_form'].sort());
const reversed = core.parse(candidate);
for (const e of [...edits].reverse()) {
  const loc = reversed.locations.find(x => x.name === e.location);
  const current = read(reversed, e.location, e.field);
  assert.equal(occurrences(current, e.new), e.count, 'reverse unique');
  reversed.lines[loc[e.field]] = core.shift(current.replace(e.new, e.old), -5);
}
assert.ok(core.serialize(reversed).equals(raw), 'reverse replay must restore original bytes');
// Source blocks must remain byte-for-byte the approved extracted text.
for (let i = 0; i < 6; i++) assert.deepEqual(edits[i], pending.edits[i]);
assert.equal(read(doc, 'interaction_city'), read(baseline, 'interaction_city'), 'held Luminous event remains untouched');
assert.equal(occurrences(read(doc, '#options'), '츠키 ($1250)'), occurrences(options, '츠키 ($1250)'), 'actual Tsuki labels remain');
assert.equal(occurrences(read(doc, '#options'), '츠키 ($2000)'), occurrences(options, '츠키 ($2000)') - 2, 'only two wrong labels removed');
assert.equal(occurrences(read(doc, '#options'), '루미너스 ($2000)'), occurrences(options, '루미너스 ($2000)') + 2, 'two correct labels added');
const lineResult = lineChecks.inspect(candidate);
const markerResult = markerChecks.inspectMarkerBoundaries(candidate);
assert.equal(lineResult.issues.length, 0, 'line boundaries');
assert.equal(markerResult.issues.length, 0, 'marker boundaries');
const patch = {
  id: '2026-11-05_faction_reputation_s_plus_luminous_labels',
  description: 'Approved six preserved attachment blocks plus the two wrong Luminous sale labels. Isolated merge patch.',
  source: pending.source,
  source_sha256: pending.source_sha256,
  source_currently_available: fs.existsSync(pending.source),
  before_sha256: core.hash(raw),
  after_sha256: core.hash(candidate),
  edits,
};
const report = {
  status: 'STATIC_PASS',
  baseline: work,
  baseline_sha256: core.hash(raw),
  candidate_sha256: core.hash(candidate),
  locations: doc.locations.length,
  edits: audit,
  changed_fields: changedFields,
  approved_source_blocks_preserved: 6,
  labels_changed: 2,
  reverse_replay: true,
  byte_roundtrip: true,
  line_boundary_issues: lineResult.issues,
  marker_boundary_issues: markerResult.issues,
  source_currently_available: patch.source_currently_available,
  source_note: 'G:/Mod/jack.qsp is absent; approved pending JSON preserves the six original new blocks and the earlier attachment SHA-256. Current attachment hash was not rechecked.',
  held: ['interaction_city girls/full/Luminous.png reference and lore; user is preparing clothed art'],
  invariants: ['All six extracted new blocks are unchanged, including noble_status side effects and existing prose typo candidates.', 'Actual Tsuki $1250 sale labels, costs, conditions, action targets, and interaction_city are untouched.'],
  limitations: ['This is isolated preparation. WORK, repository source, Full, commit, and push are untouched.', 'Targeted engine fixtures are separate. Native execution is not performed by this script.', 'Actual EXE page appearance and old-save GUI loading remain unverified.'],
};
fs.writeFileSync(path.join(__dirname, 'merge-patch.json'), JSON.stringify(patch, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(__dirname, 'candidate.qsp'), candidate);
fs.writeFileSync(path.join(__dirname, 'static-report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
assert.equal(core.hash(fs.readFileSync(work)), core.hash(raw), 'WORK unchanged after preparation');
console.log(JSON.stringify({ status: report.status, before: report.baseline_sha256, after: report.candidate_sha256, locations: report.locations, edits: edits.length, changedFields, sourceAvailable: patch.source_currently_available }));
