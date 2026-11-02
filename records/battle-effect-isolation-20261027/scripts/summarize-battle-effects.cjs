const fs = require('fs');
const cp = require('child_process');
const assert = require('assert');
const rec = 'G:/somi/JO9sa/records/battle-effect-isolation-20261027';
const r = JSON.parse(fs.readFileSync(rec + '/native-effects-results.json', 'utf8'));
const baseline = JSON.parse(fs.readFileSync(rec + '/baseline-contract-results.json', 'utf8'));
assert.equal(r.hashes.qsp, '7c366e1ae35a5922e32052847bceb28737ddab32c3861b19bbefd7661b45c2b7');
assert.equal(r.hashes.css['base.css'], 'f8844167776c4c98ea93966f5743f241c2e832dbd40f4043bb2ace37f21d9c0c');
assert.equal(r.status, 'MEASURED');
assert.equal(r.client.length, 6);
assert(r.client.every(x => x.pass));
assert.equal(baseline.isolationContract.status, 'EXPECTED_FAIL');
assert(baseline.isolationContract.cases.every(x => !x.pass));
assert.equal(r.isolationContract.status, 'PASS');
assert(r.isolationContract.cases.every(x => x.pass && Object.values(x.checks).every(Boolean)));
assert.equal(r.effectGeometryReproduced, false);
assert(r.inputsUnchanged && r.edgeBackground.pass);
assert.equal(r.configEncoding, 'raw UTF-16LE FF FE');
for (const c of r.cases) {
  assert.equal(c.data.samples.length, 5);
  assert(c.data.samples.every(s => s.viewport.join(' ') === '1280 800'));
  assert(c.data.samples.every(s => s.scroll.join(' ') === '0 0'));
  if (c.data.expectedEnemy) {
    assert(c.data.samples.some(s => s.scheduled < 650 && s.effects.enemy.opacity > 0));
    assert.equal(c.data.samples.at(-1).effects.enemy.opacity, 0);
  }
  if (c.data.expectedPlayer) {
    assert(c.data.samples.some(s => s.scheduled < 650 && s.effects.player.opacity > 0));
    assert.equal(c.data.samples.at(-1).effects.player.opacity, 0);
  }
}
const result = r.cases.find(x => x.data.result);
assert(result.data.samples.every(s => s.isolation.resultThumbHit && s.isolation.pagerHitThrough));
assert(result.data.samples.every(s => s.logReady.pages === 3));
assert(result.data.samples.every(s => s.isolation.resultThumbHref === 'EXEC: gt "выход_из_боя"'));
const summary = {
  nativeCases: r.client.map(x => ({name:x.name, pass:x.pass})),
  baselineIsolationContract: baseline.isolationContract.status,
  candidateIsolationContract: r.isolationContract.status,
  observedGeometryChange: r.effectGeometryReproduced,
  animationSamplesMs: r.snapshotsMilliseconds,
  edgeImage: r.edgeBackground.image,
  resultThumbHref: result.data.samples[0].isolation.resultThumbHref,
  resultLogPages: 3,
  resultThumbAndPagerHitAllSamples: true,
  inputFilesUnchanged: r.inputsUnchanged,
  candidateHashes: r.hashes,
  manualGuiPlay: false
};
fs.copyFileSync(rec + '/native-effects-results.json', rec + '/candidate-native-results.json');
fs.copyFileSync(__filename, rec + '/scripts/summarize-battle-effects.cjs');
fs.writeFileSync(rec + '/native-effects-summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
