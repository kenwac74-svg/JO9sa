'use strict';
const fs = require('node:fs'), path = require('node:path');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const guards = require('./guards.cjs');
const inventoryPath = process.argv[2] || path.join(__dirname, '..', 'output', 'FEMALE_TEXT_BACKUP.json');
const outPath = process.argv[3] || path.join(__dirname, 'inventory-review.json');
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const doc = core.parse(fs.readFileSync(inventory.source.path));
const locations = new Map(doc.locations.map(l => [l.name, { ...l,
  decodedBody: core.shift(doc.lines[l.body], 5), decodedDesc: core.shift(doc.lines[l.desc], 5) }]));
const entriesByKey = new Map(inventory.entries.map(e => [JSON.stringify([e.location, e.field, e.start, e.end]), e]));
const mismatches = [], invalidFemaleProofs = [], missingKnownLabels = [], unmeasuredKnownLabels = [];
for (const entry of inventory.entries) {
  const l = locations.get(entry.location), source = entry.field === 'body' ? l.decodedBody : l.decodedDesc;
  const encoded = source.slice(entry.start, entry.end);
  const decoded = entry.quote ? encoded.split(entry.quote + entry.quote).join(entry.quote) : encoded;
  if (decoded !== entry.text) mismatches.push({ id: entry.id, location: entry.location, line: entry.line, kind: 'literal-offset-content' });
  if (entry.measurementEligible && entry.reasons.includes('female-only-effective-guard') &&
    !guards.classify(entry.conditions, { ...inventory.model, uncertain: entry.uncertainties.length > 0 }).femaleOnly)
    invalidFemaleProofs.push({ id: entry.id, location: entry.location, line: entry.line });
}
for (const module of inventory.modules) {
  const l = locations.get(module.location);
  if (l.decodedBody !== module.body || l.decodedDesc !== module.desc)
    mismatches.push({ location: module.location, kind: 'module-body-or-description' });
}
const femaleNames = new Set(['$female_virginity', '$female_vaginal_modification', '$female_boobs_modification',
  '$female_age_name', '$female_boobs', '$female_anal_description']);
const l = locations.get('#variative'), lines = l.decodedBody.split('\n');
let expectedFemaleLabels = 0;
for (const literal of core.literals(l.decodedBody)) {
  const line = lines[literal.line - 1], lhs = /^\s*(\$female_\w+)\s*\[[^\]]+\]\s*=/.exec(line);
  if (!lhs || !femaleNames.has(lhs[1])) continue;
  expectedFemaleLabels++;
  const entry = entriesByKey.get(JSON.stringify(['#variative', 'body', literal.start, literal.end]));
  const details = { location: '#variative', line: literal.line, variable: lhs[1], literalStart: literal.start, literalEnd: literal.end };
  if (!entry) missingKnownLabels.push(details);
  else if (!entry.measurementEligible) unmeasuredKnownLabels.push(details);
}
const report = { sourceSha256: doc.hash, inventoryEntries: inventory.entries.length,
  checkedModuleBodies: inventory.modules.length, exactContentMismatches: mismatches,
  invalidEligibleFemaleProofs: invalidFemaleProofs, knownFemaleDisplayTables: {
    expectedLabels: expectedFemaleLabels, missing: missingKnownLabels, unmeasured: unmeasuredKnownLabels },
  manuallyReviewedGuardBoundaries: [
    { location: '#variative', if: 278, else: 294, end: 306, eligibleCountBeforeTableFix: 11 },
    { location: '#variative', if: 784, else: 962, end: 1158, eligibleCountBeforeTableFix: 77 },
    { location: '#static_txt', if: 5393, else: 5401, end: 5409, eligibleCount: 3 },
    { location: '#txt_man', if: 1060, else: 1210, end: 1256, eligibleCount: 45 },
    { location: '#txt_man', if: 1272, else: 1292, end: 1311, eligibleCount: 12 },
    { location: '#sex_texts', if: 5, else: 665, end: 926, eligibleCount: 191 },
    { location: '#var_base', if: 2016, else: 2430, end: 2643, eligibleCount: 72 }
  ], notes: [
    'The additional #variative88, #static_txt3, #txt_man57 and #sex_texts191 are valid female-player branches under the current male1..18/female101..124 model.',
    'The six named female display tables include short non-Korean labels and colored concatenated RHS values; the dialogue heuristic alone misses these.',
    'IIF/dyneval/func lines containing hero_choice were inspected; no unarchived female-vs-male text argument pairs were found. jo9_rumor_roster IIF arms are numeric1/0.',
    'This review does not certify engine execution or safe removal. No game or save file was edited.'
  ] };
report.pass = !mismatches.length && !invalidFemaleProofs.length && !missingKnownLabels.length && !unmeasuredKnownLabels.length;
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ outPath, pass: report.pass, exactMismatches: mismatches.length,
  invalidFemaleProofs: invalidFemaleProofs.length, expectedFemaleLabels,
  missingKnownLabels: missingKnownLabels.length, unmeasuredKnownLabels: unmeasuredKnownLabels.length }));
