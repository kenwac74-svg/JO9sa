'use strict';
// Read-only probe. QSP mutations below exist only in memory; only --report is written.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const TOOL_ROOT = 'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop';
const core = require(path.join(TOOL_ROOT, 'core.cjs'));
const scenes = require(path.join(TOOL_ROOT, 'scenes.cjs'));
const WORK_QSP = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const BASELINE_HASH = '0efd1092d910301d26d0354588c5a904195c7ee58542f389b6b2c66209e69222';
const SPECS = [
  { id: '66677921', label: '#긍정적 선택지', anchorId: 'jo9-erza-positive-choice', edited: '긍정적 반응을 보인다' },
  { id: '66677922', label: '#부정적 선택지', anchorId: 'jo9-erza-negative-choice', edited: '부정적 반응을 보인다' }
];
function option(name) { const at = process.argv.indexOf(name); return at < 0 ? null : process.argv[at + 1]; }
function locationBody(doc, name) {
  const loc = doc.locations.find(item => item.name === name);
  assert.ok(loc, 'missing location: ' + name);
  return core.shift(doc.lines[loc.body], 5);
}
function compactBranch(branch) {
  return {
    label: branch.label,
    target: branch.target,
    states: branch.states,
    destinations: (branch.destinations || []).map(destination => ({
      location: destination.location, title: destination.title, line: destination.line
    }))
  };
}
function inspect(raw, expectedChoices) {
  const doc = core.parse(raw);
  assert.ok(core.serialize(doc).equals(raw), 'QSP byte roundtrip');
  const entries = core.entries(doc);
  const entry = entries.find(item => item.location === 'interaction_city' && item.text.includes('생기 없는 몸을'));
  assert.ok(entry, 'Erza death dialogue is present');
  const navigator = scenes.buildNavigator(doc, entries);
  const result = { hash: core.hash(raw), locations: doc.locations.length, modes: {}, edits: [] };
  for (const mode of ['text', 'all']) {
    const context = navigator.context({ ...entry, hash: doc.hash }, undefined, mode);
    assert.equal(context.scene.title, 'interaction_city = 6667792', mode + ': correct death scene');
    const choices = context.branches.filter(branch => branch.kind === 'choice');
    assert.equal(choices.length, expectedChoices, mode + ': exact choice count');
    const visibleText = context.screen.map(item => item.text).join('\n');
    assert.ok(visibleText.includes('생기 없는 몸을'), mode + ': death text shares preview scene');
    if (expectedChoices === 2) {
      for (const spec of SPECS) {
        const branch = choices.find(item => item.label === spec.label);
        assert.ok(branch, mode + ': ' + spec.label);
        assert.equal(branch.target, 'interaction_city');
        assert.equal(branch.states.interaction_city, spec.id);
        assert.ok(branch.destinations.some(destination => destination.location === 'interaction_city' && destination.title === 'interaction_city = ' + spec.id), mode + ': resolved destination ' + spec.id);
        assert.ok(visibleText.includes(spec.label), mode + ': original dialogue and both labels share context.screen');
      }
    }
    result.modes[mode] = {
      scene: context.scene.title,
      choiceCount: choices.length,
      branchTotal: context.branchTotal,
      deathTextInScreen: true,
      labelsInScreen: SPECS.map(spec => ({ label: spec.label, present: visibleText.includes(spec.label) })),
      labelsInCombinedPreview: SPECS.map(spec => ({ label: spec.label, present: visibleText.includes(spec.label) || choices.some(item => item.label === spec.label) })),
      choices: choices.map(compactBranch)
    };
  }
  if (expectedChoices === 2) {
    for (const spec of SPECS) {
      const anchorEntry = entries.find(item => item.location === 'interaction_city' && item.text.includes('id="' + spec.anchorId + '"'));
      assert.ok(anchorEntry && anchorEntry.dialogue, 'anchor is editable dialogue: ' + spec.label);
      const before = scenes.links(anchorEntry.text);
      assert.equal(before.length, 2, 'one literal includes both complete anchors');
      const originalLink = before.find(link => link.label === spec.label);
      assert.ok(originalLink, 'correct editable label');
      const replacement = anchorEntry.text.replace(spec.label, spec.edited);
      const plan = core.prepare(doc, { ...anchorEntry, hash: doc.hash }, replacement);
      const after = scenes.links(plan.replacement);
      assert.equal(after.length, 2);
      const editedLink = after.find(link => link.label === spec.edited);
      assert.ok(editedLink);
      assert.equal(editedLink.code, originalLink.code, 'label edit preserves href/callback');
      for (const other of SPECS.filter(item => item.id !== spec.id)) {
        assert.deepEqual(after.find(link => link.label === other.label), before.find(link => link.label === other.label), 'other complete anchor remains unchanged');
      }
      assert.ok(plan.replacement.includes('id="' + spec.anchorId + '"'), 'label edit preserves anchor ID');
      assert.equal(plan.replacement.replace(spec.edited, spec.label), anchorEntry.text, 'only label changes');
      const selectedLabelContexts = {};
      for (const mode of ['text', 'all']) {
        const selected = navigator.context({ ...anchorEntry, hash: doc.hash }, undefined, mode);
        const selectedScreen = selected.screen.map(item => item.text).join('\n');
        assert.equal(selected.scene.title, 'interaction_city = 6667792');
        assert.ok(selectedScreen.includes('생기 없는 몸을'));
        for (const other of SPECS) assert.ok(selectedScreen.includes(other.label), mode + ': selecting a label shows the death dialogue and both labels together');
        selectedLabelContexts[mode] = { scene: selected.scene.title, deathTextInScreen: true, bothLabelsInScreen: true, choices: selected.branches.filter(branch => branch.kind === 'choice').length };
      }
      result.edits.push({ label: spec.label, line: anchorEntry.line, dialogue: true, preparePassed: true, onlyLabelChanged: true, hrefPreserved: true, selectedLabelContexts });
    }
  }
  return result;
}
function isolatedProof(raw) {
  const doc = core.parse(raw);
  const entry = core.entries(doc).find(item => item.location === 'interaction_city' && item.text.includes('생기 없는 몸을'));
  const additions = SPECS.map(spec => '<a id="' + spec.anchorId + '" href="EXEC: interaction_city = ' + spec.id + " & gt 'interaction_city'\">" + spec.label + '</a>').join('<br>');
  const plan = core.prepare(doc, { ...entry, hash: doc.hash }, entry.text + '<br><br>' + additions);
  // This is solely a parser/control-flow proof; no generated QSP is saved.
  return inspect(plan.raw, 2);
}
const baselinePath = option('--baseline') || WORK_QSP;
const raw = fs.readFileSync(baselinePath);
assert.equal(core.hash(raw), BASELINE_HASH, 'baseline must be the verified original 0efd1092 QSP');
const report = {
  date: new Date().toISOString(),
  tools: TOOL_ROOT,
  toolHashes: Object.fromEntries(['core.cjs', 'scenes.cjs', 'flow.cjs'].filter(name => fs.existsSync(path.join(TOOL_ROOT, name))).map(name => [name, core.hash(fs.readFileSync(path.join(TOOL_ROOT, name)))])),
  baseline: { path: baselinePath, ...inspect(raw, 0) },
  isolatedInMemoryProof: isolatedProof(raw),
  candidate: null,
  parserNote: 'A single $text[1] literal containing the original prose and both complete anchors is required. Separate += literals have branch buttons but are excluded by the text-mode array-flow screen; this probe strictly requires the single-literal form in both modes.',
  productionWrites: 0
};
const candidatePath = option('--candidate');
if (candidatePath) {
  const candidateRaw = fs.readFileSync(candidatePath);
  report.candidate = { path: candidatePath, ...inspect(candidateRaw, 2) };
  const candidateDoc = core.parse(candidateRaw);
  const renderer = locationBody(candidateDoc, 'interaction_screen_city');
  // Navigation may inspect anchor IDs to preserve old-save fallback. Only HTML
  // generation in the shared renderer must be absent.
  assert.ok(!core.literals(renderer).some(literal => literal.text.includes('<a') && SPECS.some(spec => literal.text.includes(spec.anchorId))), 'candidate renderer no longer appends anchors');
  report.candidate.rendererAppendRemoved = true;
  const originalEntry = core.entries(core.parse(raw)).find(item => item.location === 'interaction_city' && item.text.includes('생기 없는 몸을'));
  const candidateEntries = core.entries(candidateDoc);
  const originalAndChoices = candidateEntries.find(item => item.location === 'interaction_city' && item.text.includes('생기 없는 몸을'));
  assert.ok(originalAndChoices.text.startsWith(originalEntry.text), 'original prose is an exact unchanged prefix');
  assert.equal(candidateEntries.filter(item => item.location === 'interaction_city' && SPECS.some(spec => item.text.includes('id="' + spec.anchorId + '"'))).length, 1, 'only one literal contains the original text and both choices');
  report.candidate.originalProsePrefixUnchanged = true;
  report.candidate.singleLiteral = true;
}
report.pass = true;
const destination = option('--report');
if (destination) {
  const resolved = path.resolve(destination);
  const ownRoot = path.resolve(__dirname) + path.sep;
  assert.ok(resolved.startsWith(ownRoot), 'report must remain under this workspace artifact folder');
  fs.writeFileSync(resolved, JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify({ pass: report.pass, baseline: report.baseline.hash, baselineChoices: report.baseline.modes.text.choiceCount, isolatedChoices: report.isolatedInMemoryProof.modes.text.choiceCount, candidate: report.candidate && { hash: report.candidate.hash, textChoices: report.candidate.modes.text.choiceCount, allChoices: report.candidate.modes.all.choiceCount, edits: report.candidate.edits.length }, report: destination || null, productionWrites: 0 }));
