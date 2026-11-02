'use strict';

// Read-only review of game/QSP inputs. The only output is the requested JSON report.
// Usage: node review.cjs [--baseline FILE] [--candidate FILE] [--patch FILE] [--out FILE]
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const repo = 'G:/somi/JO9sa';
const work = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const full = 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const temp = 'G:/Codex/tmp/arena-mercy-loss-rule-20261031';
const core = require(repo + '/tools/text-workshop/core.cjs');
const patchName = '2026-10-31_arena_mercy_loss_rule.json';
const options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const name = process.argv[i];
  assert(['--baseline', '--candidate', '--patch', '--out'].includes(name), 'Unknown option: ' + name);
  assert(process.argv[i + 1], 'Missing value for ' + name);
  options[name.slice(2)] = process.argv[i + 1];
}

const baselinePath = options.baseline || 'G:/somi/JO9_work_backups/arena-mercy-loss-rule-20261031/before.qsp';
const patchPath = options.patch || [temp + '/mods/' + patchName, repo + '/mods/' + patchName].find(p => fs.existsSync(p));
assert(patchPath, 'Retained patch JSON is required');
const patchRaw = fs.readFileSync(patchPath);
const patch = JSON.parse(patchRaw.toString('utf8').replace(/^\uFEFF/, ''));
const baselineRaw = fs.readFileSync(baselinePath);
assert.equal(core.hash(baselineRaw), patch.before_sha256, 'Pinned baseline hash');
assert.equal(patch.edits.length, 8, 'Expected minimal eight edits');

const parse = raw => {
  const doc = core.parse(raw);
  assert(core.serialize(doc).equals(raw), 'QSP byte roundtrip');
  return doc;
};
const body = (doc, name) => {
  const loc = doc.locations.find(x => x.name === name);
  assert(loc, 'Missing location: ' + name);
  return core.shift(doc.lines[loc.body], 5);
};
const setBody = (doc, name, text) => {
  const loc = doc.locations.find(x => x.name === name);
  assert(loc, name);
  doc.lines[loc.body] = core.shift(text, -5);
};
const occurrences = (text, fragment) => text.split(fragment).length - 1;
const baseline = parse(baselineRaw);
let candidatePath = options.candidate;
if (!candidatePath && fs.existsSync(temp + '/candidate.qsp')) candidatePath = temp + '/candidate.qsp';
if (!candidatePath && fs.existsSync(work + '/jack.qsp') && core.hash(fs.readFileSync(work + '/jack.qsp')) === patch.after_sha256) candidatePath = work + '/jack.qsp';
let candidateRaw;
let candidateOrigin;
if (candidatePath) {
  candidateRaw = fs.readFileSync(candidatePath);
  candidateOrigin = 'read-existing-candidate';
} else {
  // After diagnostic cleanup, reconstruct only in memory from the retained baseline/patch.
  const reconstructed = parse(baselineRaw);
  for (const edit of patch.edits) {
    assert.equal(edit.field, 'body');
    const text = body(reconstructed, edit.location);
    assert.equal(occurrences(text, edit.old), edit.count, 'Replay count in ' + edit.location);
    setBody(reconstructed, edit.location, text.split(edit.old).join(edit.new));
  }
  candidateRaw = core.serialize(reconstructed);
  candidateOrigin = 'reconstructed-in-memory-from-retained-patch';
}
assert.equal(core.hash(candidateRaw), patch.after_sha256, 'Pinned candidate hash');
const candidate = parse(candidateRaw);
assert.deepEqual(candidate.locations.map(x => x.name), baseline.locations.map(x => x.name));
const changedLocations = baseline.locations.filter(x => body(baseline, x.name) !== body(candidate, x.name)).map(x => x.name);
assert.deepEqual([...changedLocations].sort(), ['interaction_city', 'выход_из_боя'].sort());

const reversed = parse(candidateRaw);
for (const edit of [...patch.edits].reverse()) {
  assert.equal(edit.field, 'body');
  const text = body(reversed, edit.location);
  assert.equal(occurrences(text, edit.new), edit.count, 'Reverse count in ' + edit.location);
  setBody(reversed, edit.location, text.split(edit.new).join(edit.old));
}
assert(core.serialize(reversed).equals(baselineRaw), 'All changes reverse to exact baseline bytes');

const oldExit = body(baseline, 'выход_из_боя');
const newExit = body(candidate, 'выход_из_боя');
assert.equal((oldExit.match(/slave\['loser_rating'\]\s*\+=\s*100\b/g) || []).length, 1);
assert.equal((newExit.match(/slave\['loser_rating'\]\s*\+=\s*100\b/g) || []).length, 0);
assert.equal((oldExit.match(/slave\['loser_rating'\]\s*\+=\s*1\b/g) || []).length, 1);
assert.equal((newExit.match(/slave\['loser_rating'\]\s*\+=\s*1\b/g) || []).length, 2);
const rngLines = text => text.split('\r\n').filter(x => /\brand\s*\(/.test(x));
assert.deepEqual(rngLines(newExit), rngLines(oldExit), 'Random calls and their order remain unchanged');
function fatalFragments(text) {
  const out = [];
  let at = -1;
  while ((at = text.indexOf("if $итог_боя = 'убит':", at + 1)) >= 0) {
    const end = text.indexOf('+= rand(80,100)', at);
    if (end >= 0 && end - at < 600) out.push(text.slice(at, end + '+= rand(80,100)'.length));
  }
  return out;
}
assert.equal(fatalFragments(oldExit).length, 2);
assert.deepEqual(fatalFragments(newExit), fatalFragments(oldExit), 'Lethal injury roll and early death routing preserved');
const expectedPredicate = 'jo9_cruel_mercy <= -5 or (jo9_cruel_mercy < 5 and b > gladiator_valor)';
const predicates = [...newExit.matchAll(/if\s+(jo9_cruel_mercy[^\r\n:]+):/g)].map(x => x[1]);
assert.deepEqual(predicates, [expectedPredicate, expectedPredicate]);
const sites = [
  {name: 'formal-arena', start: newExit.indexOf("if $fight_return = 'Start':")},
  {name: 'catfight', start: newExit.indexOf("if $fight_return = 'Start1':")}
];
for (const site of sites) {
  assert(site.start >= 0);
  const fatalAt = newExit.indexOf("if $итог_боя = 'убит':", site.start);
  const predicateAt = newExit.indexOf('if ' + expectedPredicate, site.start);
  const incrementAt = newExit.indexOf("slave['loser_rating'] += 1", predicateAt);
  assert(fatalAt < predicateAt && predicateAt < incrementAt, site.name + ' survival and increment order');
}

const reputations = [-100, -6, -5, -4, -1, 0, 1, 4, 5, 6, 100];
const valors = [-100, -1, 0, 1, 2, 3, 5];
const rolls = [0, 1, 2, 3];
const inputs = [];
for (const reputation of reputations) for (const valor of valors) for (const roll of rolls) inputs.push({reputation, valor, roll});
assert.equal(inputs.length, 308);
let predicateEvaluations = 0;
for (const predicate of predicates) {
  // The exact, pinned expression was checked above; translate only its known operators.
  const expression = predicate.replaceAll('jo9_cruel_mercy', 'reputation').replaceAll('gladiator_valor', 'valor').replace(/\band\b/g, '&&').replace(/\bor\b/g, '||');
  const evaluate = new Function('reputation', 'valor', 'b', 'return (' + expression + ');');
  for (const input of inputs) {
    const expected = input.reputation <= -5 ? true : input.reputation >= 5 ? false : input.roll > input.valor;
    assert.equal(evaluate(input.reputation, input.valor, input.roll), expected, JSON.stringify(input));
    predicateEvaluations++;
  }
}

function caseFragments(text, event) {
  const headers = [...text.matchAll(/^\s*if interaction_city = (\d+):[^\r\n]*\r?\n/gim)].map(x => ({event: +x[1], at: x.index}));
  return headers.flatMap((x, i) => x.event === event ? [text.slice(x.at, i + 1 < headers.length ? headers[i + 1].at : text.length)] : []);
}
const oldCity = body(baseline, 'interaction_city');
const newCity = body(candidate, 'interaction_city');
const proseReview = [];
for (const [event, count, condition] of [[1292, 1, 'jo9_cruel_mercy <= -5'], [1293, 1, 'jo9_cruel_mercy >= 5'], [103003, 2, 'jo9_cruel_mercy <= -5'], [103004, 2, 'jo9_cruel_mercy >= 5']]) {
  const oldFragments = caseFragments(oldCity, event), newFragments = caseFragments(newCity, event);
  assert.equal(oldFragments.length, count);
  assert.equal(newFragments.length, count);
  for (let i = 0; i < count; i++) {
    const original = oldFragments[i].match(/^[\t ]*\$text\[1\] = '([^\r\n]*)'\r?$/m);
    assert(original, 'Original prose ' + event);
    assert(newFragments[i].includes(original[0]), 'Neutral/original line retained for ' + event);
    const override = newFragments[i].match(/if (jo9_cruel_mercy[^\r\n:]+): \$text\[1\] = '([^\r\n]*)'/);
    assert(override, 'Conditional override ' + event);
    assert.equal(override[1], condition);
    const suffix = original[1].includes('<br><br>') ? original[1].slice(original[1].indexOf('<br><br>')) : '';
    assert(override[2].endsWith(suffix));
    proseReview.push({event, branch: i + 1, condition, neutralLinePreserved: true, suffixPreserved: true});
  }
}
assert.equal(proseReview.length, 6);
const headerEdits = patch.edits.filter(x => x.location === 'interaction_city').map(x => ({event: +(x.old.match(/if interaction_city = (\d+):/i) || [])[1], count: x.count, originalPrefixStillPresent: x.new.startsWith(x.old)}));
assert(headerEdits.every(x => x.originalPrefixStillPresent));
assert.deepEqual(headerEdits.map(x => [x.event, x.count]), [[1292, 1], [1293, 1], [103003, 1], [103003, 1], [103004, 2]]);
assert.equal(core.hash(fs.readFileSync(baselinePath)), patch.before_sha256);
assert.equal(core.hash(fs.readFileSync(patchPath)), core.hash(patchRaw));
if (candidatePath) assert.equal(core.hash(fs.readFileSync(candidatePath)), patch.after_sha256);

const report = {
  status: 'STATIC_REVIEW_PASS',
  reviewScope: 'Independent code/diff and threshold review. This is not an engine or mouse-play test.',
  inputs: {baseline: baselinePath, baselineSha256: patch.before_sha256, patch: patchPath, candidate: candidatePath || null, candidateOrigin, candidateSha256: patch.after_sha256},
  changes: {locations: changedLocations, patchEdits: patch.edits.length, proseOverrides: proseReview.length, reverseToExactBaseline: true, unrelatedLocationsUnchanged: true},
  predicates: {expression: expectedPredicate, sites: sites.map(x => x.name), reputations, valors, rolls, inputCases: inputs.length, predicateEvaluations, failures: 0, thresholdsInclusive: true, neutralRulePreserved: true},
  ordering: {lethalRollAndEarlyDeathPreserved: true, deathBeforeReputationJudgment: true, knockoutIncrementAfterJudgment: true, randomCallsAndOrderPreserved: true},
  knockoutPoints: {formalNewEventsBefore: 100, formalNewEventsAfter: 1, catfightNewEvents: 1, existingHistoryMigrated: false},
  prose: proseReview,
  duplicateHeaderEdits: headerEdits,
  saveCompatibility: {newPersistentFields: 0, schemaChanged: false, signedVariable: 'jo9_cruel_mercy', existingLoserRatingPreserved: true, missingReputationUsesExistingDefaultZero: true, noPersonalSaveReadOrWritten: true},
  notes: [
    'Reputation is one signed protagonist value, not separate cruel/mercy counters.',
    'Mercy does not resurrect a character who fails the earlier lethal-injury survival roll.',
    'Saved loser_rating values such as 100 remain unchanged and still penalize neutral judgment. Mercy >=5 overrides that judgment only while its threshold is met.',
    'The existing loser_rating=0 requirement for champion liberation is not changed.',
    'Formal arena and Catfight share the same per-person loser_rating history; role swaps preserve the person array.',
    'Conditional extreme-reputation prose keeps the original neutral line and existing suffix; lethal-injury death messages are unchanged.'
  ],
  productionWritten: false,
  engineExecuted: false
};

const output = path.resolve(options.out || path.join(__dirname, 'review.json'));
assert.equal(path.extname(output).toLowerCase(), '.json');
const parent = fs.realpathSync(path.dirname(output));
for (const protectedRoot of [work, full, 'G:/somi/JO9O']) {
  const root = fs.realpathSync(protectedRoot);
  assert(parent !== root && !parent.startsWith(root + path.sep), 'Review output must stay outside game folders');
}
if (fs.existsSync(output)) assert(!fs.lstatSync(output).isSymbolicLink(), 'Do not follow a report symlink');
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({status: report.status, inputCases: inputs.length, predicateEvaluations, proseOverrides: proseReview.length, productionWritten: false, output}));
