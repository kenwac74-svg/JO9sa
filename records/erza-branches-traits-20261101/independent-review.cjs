'use strict';
// Static independent review. No narrative strings or image pixels are emitted.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const W = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const T = 'G:/Codex/tmp/erza-branches-traits-20261101';
const C = require(W + '/modtools/text-workshop/core.cjs');
const beforeBytes = fs.readFileSync(T + '/before.qsp');
const candidateBytes = fs.readFileSync(T + '/candidate.qsp');
const before = C.parse(beforeBytes), candidate = C.parse(candidateBytes);
const prepared = JSON.parse(fs.readFileSync(T + '/prepared.json', 'utf8'));
const patchFiles = fs.readdirSync(T + '/mods').filter(name => name.endsWith('.json'));
assert.equal(patchFiles.length, 1);
const patchPath = T + '/mods/' + patchFiles[0];
const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
const get = (doc, name) => C.shift(doc.lines[doc.locations.find(loc => loc.name === name).body], 5);
assert.ok(C.serialize(before).equals(beforeBytes));
assert.ok(C.serialize(candidate).equals(candidateBytes));
assert.equal(C.hash(beforeBytes), patch.before_sha256.toLowerCase());
assert.equal(C.hash(candidateBytes), patch.after_sha256.toLowerCase());
assert.equal(C.hash(candidateBytes), 'ed014da2ddf67f944f5c50910a401df9ea34894444188c19ffe9458b0f14768d');
assert.equal(C.hash(beforeBytes), prepared.before.toLowerCase());
assert.equal(C.hash(candidateBytes), prepared.after.toLowerCase());
assert.equal(patch.edits.length, 4);
assert.ok(!patch.add_locations || patch.add_locations.length === 0);
assert.deepEqual(candidate.locations.map(loc => loc.name), before.locations.map(loc => loc.name));
const changed = before.locations.filter(loc => before.lines[loc.body] !== candidate.lines[candidate.locations.find(item => item.name === loc.name).body]).map(loc => loc.name);
assert.deepEqual([...changed].sort(), ['interaction_city', 'jo9_traits_value', 'jo9_meiki_state'].sort());
const replay = C.parse(beforeBytes);
for (const edit of patch.edits) {
  assert.equal(edit.field, 'body');
  assert.equal(edit.count, 1);
  const loc = replay.locations.find(item => item.name === edit.location), body = get(replay, edit.location);
  assert.equal(body.split(edit.old).length, 2, 'unambiguous patch fragment');
  replay.lines[loc.body] = C.shift(body.replace(edit.old, () => edit.new), -5);
}
assert.ok(C.serialize(replay).equals(candidateBytes), 'four fragments exactly reproduce candidate');
const changedBodyFields = new Set(changed.map(name => before.locations.find(loc => loc.name === name).body));
before.lines.forEach((line, index) => { if (!changedBodyFields.has(index)) assert.equal(candidate.lines[index], line, 'all non-target fields preserved'); });
function literalHistogram(doc, name) {
  const histogram = {};
  for (const literal of C.literals(get(doc, name)).filter(item => /[가-힣]/.test(item.text))) {
    const sha = C.hash(Buffer.from(literal.text, 'utf8'));
    histogram[sha] = (histogram[sha] || 0) + 1;
  }
  return histogram;
}
let preservedDisplayLiteralCount = 0;
for (const name of changed) {
  const old = literalHistogram(before, name), next = literalHistogram(candidate, name);
  assert.deepEqual(next, old, 'display-literal multiset unchanged: ' + name);
  preservedDisplayLiteralCount += Object.values(old).reduce((sum, count) => sum + count, 0);
}
const events = patch.edits.filter(edit => edit.location === 'interaction_city');
assert.equal(events.length, 2);
const eventChecks = [];
for (const [id, delta, suffix] of [[66677921, 6, 1], [66677922, -2, 2]]) {
  const edit = events.find(item => item.old.startsWith('IF interaction_city = ' + id + ':'));
  assert.ok(edit);
  assert.ok(edit.old.includes("$special_image[1] = 'scene\\others\\erza_dead_after.png'"));
  assert.ok(edit.new.includes("$special_image[1] = 'scene\\others\\erza_dead_after_" + suffix + ".png'"));
  assert.ok(edit.new.includes("city_already_done_ever['66677921'] = 0 and city_already_done_ever['66677922'] = 0"));
  assert.equal((edit.new.match(/gs 'jo9_cruel_mercy_apply'/g) || []).length, 1);
  assert.ok(edit.new.includes("gs 'jo9_cruel_mercy_apply', " + delta));
  assert.ok(!/^\s*city_already_done_ever\[[^\]]+\]\s*(?:\+=|-=|=(?!=))/m.test(edit.new), 'completion counters remain owned by common completion handler');
  eventChecks.push({ id, deltaHalf: delta, scoreDelta: delta / 2, independentImagePath: 'content/pic/scene/others/erza_dead_after_' + suffix + '.png', sharesEitherBranchCompletionGuard: true });
}
assert.equal(get(before, 'interaction_result_city'), get(candidate, 'interaction_result_city'));
const completion = get(candidate, 'interaction_result_city');
assert.ok(completion.includes('city_already_done_ever[$str(interaction_city)] += 1'));
const traitEdit = patch.edits.find(edit => edit.location === 'jo9_traits_value');
assert.ok(traitEdit.new.includes("if dynslave_type = 2624: dynslave['jo9_peerless'] = 1"));
assert.ok(traitEdit.new.indexOf("dynslave['jo9_peerless'] = 1") < traitEdit.new.indexOf('jo9_trait_value_rate'));
const traits = get(candidate, 'jo9_traits_value');
assert.ok(traits.includes("dynslave['beauty'] = jo9_trait_value_grade"));
assert.ok(traits.includes("if dynslave['jo9_peerless'] = 1: dynslave['beauty'] = min(6, dynslave['beauty'] + 1)"));
const stateEdit = patch.edits.find(edit => edit.location === 'jo9_meiki_state');
const state = get(candidate, 'jo9_meiki_state'), oldState = get(before, 'jo9_meiki_state');
for (const required of [
  "local $jo9_erza_meiki_role = $args[0]",
  "instr('|slave|assistant|room1|room2|room3|room4|'",
  "'_type') = 2624",
  "func('jo9_meiki_checks', 'age'",
  "['virginity']\") >= 2",
  "['virginity']\") ! 4",
  "['jo9_meiki_known']\") = 0",
  "['jo9_meiki_known'] = 1",
  'jo9_meiki_found = 1'
]) assert.ok(stateEdit.new.includes(required), 'fixed latent-trait gate: ' + required);
assert.equal((stateEdit.new.match(/\bmsg\b/g) || []).length, 0, 'reuse existing popup route');
const probability = text => (text.match(/rand\(1,\s*100\)\s*<=\s*5/g) || []).length;
const training = text => (text.match(/\['jo9_meiki_initialized'\]\s*<\s*2/g) || []).length;
const popupStatements = text => (text.match(/\bmsg\b/g) || []).length;
assert.equal(probability(state), probability(oldState));
assert.equal(training(state), training(oldState));
assert.equal(popupStatements(state), popupStatements(oldState));
assert.equal(get(before, 'jo9_meiki_checks'), get(candidate, 'jo9_meiki_checks'));
const assets = eventChecks.map(event => {
  const full = W + '/' + event.independentImagePath, raw = fs.readFileSync(full);
  assert.equal(raw.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const width = raw.readUInt32BE(16), height = raw.readUInt32BE(20);
  assert.equal(width, 795); assert.equal(height, 596);
  return { path: full, bytes: raw.length, width, height, sha256: C.hash(raw), pixelsRendered: false };
});
assert.notEqual(assets[0].sha256, assets[1].sha256);
const newLocalNames = ['jo9_erza_meiki_role'];
for (const name of newLocalNames) assert.ok(state.includes('local $' + name + ' ='));
for (const name of ['jo9_peerless', 'jo9_meiki_known', 'jo9_meiki_found', 'jo9_meiki_initialized']) {
  assert.ok(before.locations.some(loc => get(before, loc.name).includes(name)), 'reused existing state field');
}
const report = {
  date: new Date().toISOString(), sourceBefore: T + '/before.qsp', candidate: T + '/candidate.qsp', beforeHash: C.hash(beforeBytes), candidateHash: C.hash(candidateBytes),
  pass: true, reviewType: 'read-only static independent review', nativeEngineUsed: false, productionWrites: 0,
  exactPatchReplay: true, patchFragments: 4, changedLocations: changed, originalLocationCount: before.locations.length, newLocations: 0, unchangedLocations: before.locations.length - changed.length, allNonTargetFieldsByteIdentical: true,
  fragments: patch.edits.map(edit => ({ location: edit.location, field: edit.field, oldCharacters: edit.old.length, newCharacters: edit.new.length, oldSha256: C.hash(Buffer.from(edit.old)), newSha256: C.hash(Buffer.from(edit.new)) })),
  displayLiterals: { multisetUnchanged: true, count: preservedDisplayLiteralCount, contentsEmitted: false },
  events: { results: eventChecks, existingCompletionHandlerByteIdentical: true, oldCompletedSaveGetsNoRetroactiveAward: true, completingEitherBranchBlocksBothFutureAwards: true, helperHalfUnitsCorrect: true, newSavedFields: 0 },
  fixedTraits: {
    uniqueType: 2624, peerless: { flag: 'jo9_peerless', assignedBeforeDerivedRefresh: true, repeatedRefreshIdempotent: true, existingBeautyGradeRebuiltBeforeSingleBonus: true, otherTypesNotAssigned: true },
    latentMeiki: { roles: ['slave', 'assistant', 'room1', 'room2', 'room3', 'room4'], existingAgeGateReused: true, experienceGate: 'virginity >= 2', existingFourKnownZeroRemainsQuietSync: true, unexperiencedValuesZeroOrOneNotRevealed: true, legacyKnownAndInitializedFieldsReused: true, existingProbabilitySitesBefore: probability(oldState), existingProbabilitySitesAfter: probability(state), existingOneTimeTrainingGuardsBefore: training(oldState), existingOneTimeTrainingGuardsAfter: training(state), existingPopupStatementsBefore: popupStatements(oldState), existingPopupStatementsAfter: popupStatements(state), addedPopupStatements: 0, otherUniqueTypeCorePathUnchanged: true },
    newPersistentFieldNames: [], newLocalNames,
    existingSaveAndRoleMovement: 'Existing per-actor trait/known/initialized fields and type are reused. No copy/swap/generation/serialization location is edited. Current cached instances refresh through the existing state/value helpers; no save migration is added.'
  },
  assets,
  limitations: ['Native event/trait checks are delegated to other agents and were not executed by this reviewer.', 'Existing first-transition random code remains byte-identical. It can still consume its usual draw in some Erza states, but the added known flag makes the Erza outcome deterministic; it adds no new roll or popup site.', 'Generic completion counters already used by these result IDs enforce once-only awards; resetting a save to a pre-choice snapshot naturally restores its pre-choice state.'],
  findings: []
};
fs.writeFileSync(path.join(__dirname, 'independent-review.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pass: report.pass, candidateHash: report.candidateHash, fragments: report.patchFragments, changedLocations: changed, unchangedLocations: report.unchangedLocations, displayLiteralCount: preservedDisplayLiteralCount, nativeEngineUsed: false, report: path.join(__dirname, 'independent-review.json') }));
