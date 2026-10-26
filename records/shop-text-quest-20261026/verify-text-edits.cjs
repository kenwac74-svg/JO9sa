'use strict';
// Read-only verification. The candidate is built in memory and is never saved.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const c = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const { buildTextEdits } = require('./text-edits.cjs');
const input = process.argv[2] || 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw = fs.readFileSync(input), before = c.parse(raw);
const candidate = { ...before, lines: before.lines.slice() };
const edits = buildTextEdits(before), touched = new Set();
function nonliteralText(body) {
  let at = 0, result = '';
  for (const literal of c.literals(body)) {
    result += body.slice(at, literal.start) + '<LITERAL>';
    at = literal.end;
  }
  return result + body.slice(at);
}
for (const edit of edits) {
  const loc = candidate.locations.find(l => l.name === edit.location);
  const oldBody = c.shift(candidate.lines[loc.body], 5);
  assert.equal(oldBody.split(edit.old).length - 1, edit.count);
  const newBody = oldBody.replace(edit.old, edit.new);
  assert.equal(nonliteralText(oldBody), nonliteralText(newBody), 'Nonliteral code changed: ' + edit.location);
  candidate.lines[loc.body] = c.shift(newBody, -5);
  touched.add(loc.body);
}
const bytes = c.serialize(candidate), after = c.parse(bytes);
assert(c.serialize(after).equals(bytes), 'QSP roundtrip failed');
assert.equal(before.locations.length, after.locations.length);
assert.equal(before.lines.length, after.lines.length);
for (let i = 0; i < before.lines.length; i += 1) {
  if (!touched.has(i)) assert.equal(before.lines[i], after.lines[i], 'Unexpected field changed: ' + i);
}
assert.equal(buildTextEdits(after).length, 0, 'Edits are not idempotent');
const protectedLocations = ['jo9_traits_combat', 'jo9_contest_fame', 'interaction_city', '#options'];
for (const name of protectedLocations) {
  const loc = before.locations.find(l => l.name === name);
  assert.equal(before.lines[loc.body], after.lines[loc.body], 'Protected equations changed: ' + name);
}
assert(fs.readFileSync(input).equals(raw), 'Source file changed during verification');
console.log(JSON.stringify({ sourceHash: before.hash, edits: edits.length, runtimeWritten: false, checks: { qspRoundtrip: true, idempotent: true, locationCountUnchanged: true, nonliteralCodeUnchanged: true, untouchedFieldsUnchanged: true, protectedLocationsUnchanged: protectedLocations, sourceStillUnchanged: true } }, null, 2));
