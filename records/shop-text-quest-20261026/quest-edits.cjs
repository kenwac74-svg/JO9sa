'use strict';
// JO9 MOD START AGRABAH_PAMELA_ASSIGNMENT_20261026
// Build one exact-block fragment. The only runtime character inserted is '='.
const assert = require('node:assert/strict');
const c = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');

function buildQuestEdits(doc) {
  assert(doc && Array.isArray(doc.locations) && Array.isArray(doc.lines), 'Expected parsed QSP document');
  const loc = doc.locations.find(l => l.name === 'interaction_city');
  assert(loc, 'Missing interaction_city');
  const body = c.shift(doc.lines[loc.body], 5);
  const begin = 'IF interaction_city = 30045:';
  const next = 'IF interaction_city = 3000:';
  assert.equal(body.split(begin).length - 1, 1, 'Nonunique 30045 branch');
  const start = body.indexOf(begin), end = body.indexOf(next, start + begin.length);
  assert(end > start, 'Missing 30045 branch boundary');
  const old = body.slice(start, end);
  const missing = /(^\s*\$text\[2\])(\s+)(?=')/m;
  const correct = /^\s*\$text\[2\]\s*=\s*'/m;
  if (!missing.test(old)) {
    assert(correct.test(old), 'Unrecognized 30045 page-2 assignment');
    return [];
  }
  assert.equal((old.match(/(^\s*\$text\[2\])(\s+)(?=')/gm) || []).length, 1, 'Nonunique faulty page-2 assignment');
  assert(!correct.test(old), 'Mixed faulty and correct page-2 assignment');
  const after = old.replace(missing, '$1=$2');
  assert.equal(after.length, old.length + 1, 'Expected exactly one inserted character');
  return [{ location: 'interaction_city', field: 'body', old, new: after, count: 1 }];
}

module.exports = { buildQuestEdits };
// JO9 MOD END AGRABAH_PAMELA_ASSIGNMENT_20261026

if (require.main === module) {
  const fs = require('node:fs');
  const file = process.argv[2] || 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
  const doc = c.parse(fs.readFileSync(file));
  const edits = buildQuestEdits(doc);
  const changed = { ...doc, lines: doc.lines.slice() };
  for (const e of edits) {
    const loc = doc.locations.find(l => l.name === e.location);
    changed.lines[loc.body] = c.shift(c.shift(changed.lines[loc.body], 5).replace(e.old, e.new), -5);
  }
  const after = c.parse(c.serialize(changed));
  assert.equal(buildQuestEdits(after).length, 0, 'Quest edit is not idempotent');
  assert.equal(after.locations.length, doc.locations.length);
  console.log(JSON.stringify({ sourceSha256: doc.hash, runtimeWritten: false, fragments: edits.length, insertedCharacters: edits.reduce((n,e)=>n+e.new.length-e.old.length,0), afterSha256: after.hash, idempotent: true }, null, 2));
}
