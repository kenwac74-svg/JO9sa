'use strict';
// Read-only source audit plus an integer arithmetic model. Not a production patch.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const core = require(root + '/modtools/text-workshop/core.cjs');
const raw = fs.readFileSync(root + '/jack.qsp');
const doc = core.parse(raw);
const references = [];
for (const loc of doc.locations) {
  const lines = core.shift(doc.lines[loc.body], 5).split(/\r?\n/);
  lines.forEach((text, index) => {
    if (!text.includes('jo9_cruel_mercy')) return;
    references.push({ location: loc.name, line: index + 1, operation: /\bjo9_cruel_mercy\s*(?:\+=|-=|=(?!=))/.test(text) ? 'write' : 'read', text });
  });
}
assert.equal(core.hash(raw), 'b7e5b385dcbd5d8e4b4ac18c9556e18bf371f25f6368c3eba729c9374d1cc07b');
assert.equal(references.length, 11);
assert.equal(references.filter(ref => ref.operation === 'write').length, 3);
assert.equal(references.filter(ref => ref.operation === 'read').length, 8);
function canonical(totalHalf) {
  const whole = Math.trunc(totalHalf / 2) || 0;
  return { whole, half: totalHalf - 2 * whole };
}
function step(whole, half, deltaHalf) { return canonical(2 * whole + half + deltaHalf); }
let exhaustiveCases = 0;
for (let totalHalf = -2001; totalHalf <= 2001; totalHalf++) {
  const state = canonical(totalHalf);
  assert.equal(2 * state.whole + state.half, totalHalf);
  assert.ok(Math.abs(state.half) <= 1);
  assert.equal(state.half, totalHalf % 2 || 0);
  assert.ok(state.half === 0 || Math.sign(state.half) === Math.sign(totalHalf));
  for (let deltaHalf = -5; deltaHalf <= 5; deltaHalf++) {
    const next = step(state.whole, state.half, deltaHalf);
    const expected = totalHalf + deltaHalf;
    assert.equal(2 * next.whole + next.half, expected);
    assert.equal(next.whole <= -5, expected <= -10);
    assert.equal(next.whole >= 5, expected >= 10);
    assert.equal(next.whole < 5, expected < 10);
    const restored = step(next.whole, next.half, -deltaHalf);
    assert.deepEqual(restored, state);
    exhaustiveCases++;
  }
}
let legacyIntegerCases = 0;
for (let whole = -100; whole <= 100; whole++) {
  for (const deltaWhole of [-1, 1]) {
    assert.deepEqual(step(whole, 0, 2 * deltaWhole), { whole: whole + deltaWhole, half: 0 });
    legacyIntegerCases++;
  }
}
const sampleInputs = [
  [0, 1], [1, -2], [-1, 2], [1, -1], [-1, 1],
  [9, 1], [-9, -1], [10, -1], [-10, 1], [11, -2], [-11, 2]
];
const samples = sampleInputs.map(([totalHalf, deltaHalf]) => {
  const before = canonical(totalHalf), after = step(before.whole, before.half, deltaHalf);
  return { beforeScore: totalHalf / 2, before, delta: deltaHalf / 2, deltaHalf, afterScore: (totalHalf + deltaHalf) / 2, after, cruelThreshold: after.whole <= -5, mercyThreshold: after.whole >= 5 };
});
const nativeReportPath = path.join(__dirname, 'math-report.json');
const nativeReport = fs.existsSync(nativeReportPath) ? JSON.parse(fs.readFileSync(nativeReportPath, 'utf8')) : null;
const nativeVerified = !!(nativeReport && nativeReport.pass && nativeReport.sourceHash === core.hash(raw));
const report = {
  date: new Date().toISOString(),
  source: root + '/jack.qsp',
  qspSha256: core.hash(raw),
  productionWrites: 0,
  proposalOnly: true,
  confirmedScopePolicy: { fogForcedExecuteTargetDelta: 0, practiceFinishTargetDelta: 0, implementationByParentStillSeparateFromThisReadOnlyAudit: true },
  currentReferenceSummary: { writes: 3, reads: 8, locations: [...new Set(references.map(ref => ref.location))], references },
  currentEffects: {
    newGame: { location: 'init_game', line: 15, value: 0 },
    mutation: { location: 'jo9_battle_fate', lines: [265, 266], execute: -1, spare: 1, oncePerDecision: true, outsideEnemyLoop: true, appliesRegardlessOfCombatant: true },
    guards: { location: 'jo9_battle_fate', lines: [254, 255, 256, 257, 259, 261, 262], requiredMode: '>=1', requiredPhase: 1, requiredEnemyCount: '>=1 staged opponent', requiredResult: 'victory', validChoice: [1, 2], spareRequiresMode: 2, executionBlockedInPractice: true, phaseSetTo2BeforeMutation: true, duplicateApplyDoesNotMutate: true },
    regularArena: { source: 'arena', mode: 2, fightReturn: 'Start', arenaMode: 1, enemyCount: 1, eligibleEnemies: 'dimaher_a..e, hoplite_a..e, secutor_a..e, kimerian_a..e', initLines: [134, 152, 153] },
    catfight: { source: 'catfight', mode: 2, fightReturn: 'Start1', place: 'catfightclub', arenaMode: 1, enemyCount: 1, eligibleEnemies: ['gladiatrix1', 'gladiatrix2', 'gladiatrix3'], initLines: [156, 157] },
    fog: { source: 'normal', mode: 1, place: 'edge_patrol', eligibleEnemyCount: '1..5 and every enemy in fog allowlist', initLines: [133, 136, 137, 138, 142], spareDisabled: true, forcedExecuteCurrentlyChangesScore: -1, repeatsCanAccumulate: true },
    practice: { source: 'normal', mode: 2, place: 'colosseum', enemyCount: 1, colosseumFightRanges: ['1..5', '11..15', '21..25', '31..35'], eligibleEnemies: ['голая_рабыня', 'госпожа', 'шиноби', 'латница', 'амазонка'], initLines: [135, 147, 148, 149], executionBlocked: true, finishPracticeChoice: 2, finishPracticeCurrentlyChangesScore: 1, repeatsCanAccumulate: true },
    otherCases: 'No mutation on defeated player, flee/fallback, unsupported enemy rosters or special quest battles outside init allowlists. No current noncombat/free-captive writer exists.',
    lossJudgment: { location: 'выход_из_боя', lines: [37, 98], cruel: 'whole <= -5 => execution branch', mercy: 'whole >= 5 => survival branch', neutral: 'otherwise retain b > gladiator_valor test', lethalFailureException: 'Initial lethal stamina checks can reach 1291/103002 before reputation judgment; mercy does not suppress that existing death check.' }
  },
  halfPointProposal: {
    existingWholeVariable: 'jo9_cruel_mercy',
    newSavedScalarCount: 1,
    proposedHalfVariable: 'jo9_cruel_mercy_half',
    halfDefaultForNewAndUnsetOldSaves: 0,
    actualScore: 'whole + half / 2',
    update: ['T = 2 * whole + half + deltaHalf', 'whole = truncTowardZero(T / 2)', 'half = T - 2 * whole'],
    equivalentSignedRemainder: 'half = T mod 2 only when native QSP MOD returns the signed remainder with truncation toward zero',
    recommendedRemainderExpression: 'T - 2 * whole avoids reliance on negative-MOD convention while preserving the same canonical signed remainder.',
    canonicalHalfRange: [-1, 0, 1],
    canonicalInvariant: '2*whole+half=T; nonzero half has same sign as T; zero whole may carry either half sign.',
    existingBattleMutations: 'Route execute -1 through deltaHalf=-2, spare +1 through deltaHalf=+2 exactly once at current guarded point; do not keep the old direct +=/-= alongside helper.',
    thresholdCompatibility: 'Keep existing <=-5, >=5, <5 whole-variable reads unchanged after every update canonicalizes. At 4.5 the whole is4; at-4.5 the whole is-4.',
    saveCompatibility: 'Do not rename/rescale old whole values. Existing whole integer with missing half becomes the same exact score with half0. New games should explicitly reset half0.',
    noAdditionalRules: 'No extra clamp, stat effect, remote state, actor-specific tally or automatic retroactive award is proposed. Confirmed fog/practice score0 policy is separately implemented by the parent.',
    nativeQspArithmeticVerifiedByThisAudit: nativeVerified,
    nativeEvidence: nativeVerified ? { report: nativeReportPath, helperName: nativeReport.helperName, helperHash: nativeReport.helperHash, cases: nativeReport.cases.length, executedAssertions: nativeReport.executedAssertions, pass: true } : null,
    verificationLimit: nativeVerified ? 'The isolated native helper arithmetic, old-save default, zero crossings, threshold boundaries and variable restoration passed. Full gameplay scope/choice guards are audited from source only here and are tested separately by the parent.' : 'Arithmetic checks use an explicit truncation-toward-zero integer model. Native helper verification is reported separately when math-report.json is available.'
  },
  modelVerification: { pass: true, exhaustiveCases, legacyIntegerCases, comparisonsTested: ['<=-5', '>=5', '<5'], crossZeroAndBoundarySamples: samples }
};
const output = path.join(__dirname, 'fate-arithmetic-audit.json');
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pass: true, sourceHash: report.qspSha256, references: references.length, exhaustiveCases, legacyIntegerCases, output, productionWrites: 0 }));
