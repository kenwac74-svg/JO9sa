'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const W = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const C = require(W + '/modtools/text-workshop/core.cjs');
function inspect(file) {
  const raw = fs.readFileSync(file), doc = C.parse(raw);
  const loc = doc.locations.find(item => item.name === 'next_day');
  const lines = C.shift(doc.lines[loc.body], 5).split(/\r?\n/);
  const blocks = [1, 2, 3, 4].map(room => {
    const at = lines.findIndex((line, index) => index > 4000 && line.includes("if room" + room + "['ego'] < 3:"));
    assert.ok(at >= 12, 'room ego growth block exists');
    const block = lines.slice(at - 12, at + 2);
    assert.equal(block[0].trim(), "if room" + room + "_state = CONST_INT['slave_exist']:");
    assert.equal(block[13].trim(), 'end');
    const normalized = block.map(line => line.replaceAll('room' + room, 'ROOM').trimEnd()).join('\n');
    const destination = lines[at].match(/:\s*(room\d+_rate)\['ego'\]\s*\+=\s*(\d+)/);
    assert.ok(destination);
    return { room, startLine: at - 11, egoLine: at + 1, endLine: at + 2, growthCondition: "room" + room + "['ego'] < 3", sink: destination[1], amount: Number(destination[2]), expectedSink: 'room' + room + '_rate', normalizedSha256: C.hash(Buffer.from(normalized)), normalized };
  });
  assert.equal(blocks[0].normalized, blocks[2].normalized, 'room1 and room3 symmetry');
  assert.equal(blocks[0].normalized, blocks[3].normalized, 'room1 and room4 symmetry');
  const room2Corrected = blocks[1].normalized.replace("room1_rate['ego'] += 1", "ROOM_rate['ego'] += 1");
  assert.equal(room2Corrected, blocks[0].normalized, 'room2 differs by only the erroneous ego sink token, or is already corrected');
  return { file, sha256: C.hash(raw), location: 'next_day', bodyLineCount: lines.length, blocks: blocks.map(({ normalized, ...record }) => record), mismatches: blocks.filter(item => item.sink !== item.expectedSink).map(({ room, egoLine, sink, expectedSink }) => ({ room, egoLine, sink, expectedSink })), sharedNumericRules: { halfActionDelta: -3, spoilAtMoral0: 'temper*5', spoilAtMoral1To3: 1, positiveSleepWhenSensitivityPositive: 1, moodWhenAngstBelow3: 'sensitivity', instinctWhenMasterSupermacyPositive: 1, customDelta: 1, sensitivityRateWhenBelow3: 1, egoRateWhenBelow3: 1 } };
}
const work = inspect(W + '/jack.qsp');
const original = inspect('G:/somi/JO9O/game/jack.qsp');
assert.equal(original.sha256, '26e15aaf30b6226a2883c6b532a6ee4eed34791110618597d234bb7d6fa3e052');
assert.deepEqual(original.mismatches.map(item => item.room), [2]);
const report = {
  date: new Date().toISOString(), pass: true, productionWrites: 0, nativeEngineUsed: false, sensitiveNarrativeEmitted: false,
  workAtFirstInspection: { sha256: '9a4bba2496616517fa4cbd8d791293ad413c5475efcf135039df4da68e869f39', location: 'next_day', line: 4755, condition: "room2['ego'] < 3", observedSink: "room1_rate['ego'] += 1" },
  workAtReport: work, protectedOriginal: original,
  provenanceConclusion: 'The same room2-to-room1 ego-rate typo exists in the protected original QSP; this is an original defect rather than a new WORK regression.',
  siblingComparison: 'All four fourteen-line growth blocks are identical after replacing their own room number, except the room2 ego-rate destination. No other mismatch exists in this bounded block.',
  minimalFix: { location: 'next_day', conditionUnchanged: true, oldSink: "room1_rate['ego'] += 1", newSink: "room2_rate['ego'] += 1", changedIdentifierTokens: 1, newSavedFields: 0, newLocations: 0 },
  consequence: 'When room2 is occupied and ego<3, the old code credits room1_rate instead of room2_rate. If eligible room1 also receives its own normal growth, its rate gets two credits. The incorrect room1 write is not gated on room1 occupancy.',
  existingSaveRecommendation: 'Preserve existing stored stats and rates. The historical excess/shortfall cannot be safely reconstructed without per-day actor history; apply the corrected recipient only to future day transitions.',
  scopeLimit: 'Read-only comparison of these four daily growth blocks; not a full next_day or every cross-room reference audit.'
};
const out = path.join(__dirname, 'audit.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pass: true, workHash: work.sha256, originalHash: original.sha256, workMismatches: work.mismatches, originalMismatches: original.mismatches, report: out, productionWrites: 0 }));
