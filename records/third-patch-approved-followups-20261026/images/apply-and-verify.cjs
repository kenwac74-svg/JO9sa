// JO9 MOD START THIRD_IMAGE_EXACT_PATH_ALIASES_20261026
// Exact, approved JSON path corrections plus byte-identical compatibility PNGs.
// No QSP, catalog, archive, save or Full writes.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const WORK = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const FULL = 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const SOURCE = 'G:/somi/JO9O/game';
const RECORD = 'G:/somi/JO9sa/records/third-patch-approved-followups-20261026/images';
const TEMP = 'G:/Codex/tmp/third-patch-followups-images-20261026';
const changes = [
  { json: 'json/slaves/212.json', key: 'seed_ava_clear', line: 8,
    old: 'content/pic/girls/face/00212_white_long_loli', value: 'content/pic/girls/face/0212_white_long_loli',
    beforeSha256: 'bd9331a972cfb9abb974cc367c1b366baeee8b3cf264918759c3fe8217d0cb46',
    canonical: 'content/pic/girls/face/0212_white_long_loli.png', alias: 'content/pic/girls/face/00212_white_long_loli.png',
    pngBytes: 58193, pngSha256: '67c46a864dbd5b14d4599339431e134b047f13d6f9f8c7ab9e7d8bc0515f55be' },
  { json: 'json/slaves/178.json', key: 'fullmade', line: 3,
    old: 'girls/full/cloth/178_purple_short_loli', value: 'girls/full/cloth/0178_purple_short_loli',
    beforeSha256: '1419803a38afea194d5e1d0297bf820db8ab1cdbb5190eff972e9052abab5cc5',
    canonical: 'content/pic/girls/full/cloth/0178_purple_short_loli.png', alias: 'content/pic/girls/full/cloth/178_purple_short_loli.png',
    pngBytes: 133999, pngSha256: 'b1b7728851d4401865a002a630f33e6c53142bb7235d7b0287f12a4a6cf814a0' }
];
const join = (root, rel) => path.join(root, rel);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const read = f => fs.readFileSync(f);
const load = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const put = (f, value) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, value); };
const report = (name, value) => put(join(RECORD, name), JSON.stringify(value, null, 2) + '\n');
function fileInfo(f) {
  if (!fs.existsSync(f)) return { exists: false };
  const st = fs.lstatSync(f); assert(st.isFile() && !st.isSymbolicLink(), 'Expected regular file: ' + f);
  const b = read(f); return { exists: true, bytes: b.length, sha256: sha(b) };
}
function saveInventory(root) {
  const result = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir).sort()) {
      const f = join(dir, name), st = fs.lstatSync(f);
      assert(!st.isSymbolicLink(), 'Do not follow save links: ' + f);
      if (st.isDirectory()) scan(f);
      else if (st.isFile()) result.push({ path: path.relative(root, f).replaceAll('\\', '/'), ...fileInfo(f) });
    }
  }
  scan(join(root, 'save')); return result;
}
function protectedState() {
  const rels = changes.flatMap(c => [c.json, c.canonical, c.alias]);
  return {
    full: Object.fromEntries(rels.map(r => [r, fileInfo(join(FULL, r))])),
    source: Object.fromEntries(rels.map(r => [r, fileInfo(join(SOURCE, r))])),
    workSaves: saveInventory(WORK), fullSaves: saveInventory(FULL)
  };
}
function expectedJson(c) {
  const b = read(join(RECORD, 'before/' + path.basename(c.json)));
  assert.equal(sha(b), c.beforeSha256, 'Backup hash');
  const text = b.toString('utf8'), oldToken = JSON.stringify(c.old), newToken = JSON.stringify(c.value);
  assert.equal(text.split(oldToken).length - 1, 1, 'Exact occurrence count');
  const result = Buffer.from(text.replace(oldToken, newToken), 'utf8');
  const before = JSON.parse(text), after = JSON.parse(result.toString('utf8'));
  assert.equal(before[c.key], c.old); assert.equal(after[c.key], c.value);
  const unchanged = { ...after, [c.key]: c.old }; assert.deepEqual(unchanged, before, 'Only approved field changed');
  return result;
}
function verify(root, compareProtected) {
  const results = changes.map(c => {
    const json = read(join(root, c.json)), source = read(join(WORK, c.canonical)), alias = read(join(root, c.alias));
    assert(json.equals(expectedJson(c)), 'Exact JSON byte delta: ' + c.json);
    assert.equal(JSON.parse(json.toString('utf8'))[c.key], c.value);
    assert.equal(sha(source), c.pngSha256); assert.equal(source.length, c.pngBytes);
    assert(alias.equals(source), 'Alias must be byte-identical: ' + c.alias);
    assert.equal(alias.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'PNG signature');
    const resolved = c.value.startsWith('content/') ? c.value + '.png' : 'content/pic/' + c.value + '.png';
    assert.equal(resolved, c.canonical); assert(fs.existsSync(join(WORK, resolved)), 'Corrected reference resolves');
    return { ...c, afterSha256: sha(json), afterBytes: json.length, aliasSha256: sha(alias),
      aliasBytes: alias.length, correctedPathResolves: true, legacyPathResolves: true, aliasByteEquality: true };
  });
  if (compareProtected) assert.deepEqual(protectedState(), load(join(RECORD, 'baseline.json')).protected, 'Protected files/saves unchanged');
  return { status: 'PASS', observedAtUtc: new Date().toISOString(), workRoot: root,
    jsonCount: 2, aliasesAdded: 2, aliasBytes: 192192, results,
    protectedFilesAndSavesUnchanged: compareProtected,
    limitations: ['Filesystem resolution and byte equality verified; no GUI render or save-load UI performed.',
      'No QSP edited by this task; parent task independently owns QSP verification.'] };
}
const mode = process.argv[2];
if (mode === 'baseline') {
  assert(!fs.existsSync(join(RECORD, 'baseline.json')), 'Existing baseline must not be overwritten');
  const red = changes.map(c => {
    const f = join(WORK, c.json), b = read(f), parsed = JSON.parse(b.toString('utf8'));
    assert.equal(sha(b), c.beforeSha256, 'Current JSON is approved baseline'); assert.equal(parsed[c.key], c.old);
    assert.equal(fileInfo(join(WORK, c.canonical)).sha256, c.pngSha256);
    assert(!fs.existsSync(join(WORK, c.alias)), 'Alias is absent at baseline');
    put(join(RECORD, 'before/' + path.basename(c.json)), b);
    return { json: c.json, key: c.key, old: parsed[c.key], expected: c.value,
      jsonCorrectionPass: parsed[c.key] === c.value, legacyPathResolves: false,
      canonical: fileInfo(join(WORK, c.canonical)), alias: fileInfo(join(WORK, c.alias)) };
  });
  report('baseline.json', { schema: 1, status: 'EXPECTED_RED', observedAtUtc: new Date().toISOString(),
    exactJsonFailures: 2, exactMissingAliasPaths: 2, results: red, protected: protectedState() });
  report('delta.json', { schema: 1, patchId: 'THIRD_IMAGE_EXACT_PATH_ALIASES_20261026', changes,
    approved: 'JSON_CORRECTIONS_AND_EXACT_ASSET_ALIASES', addedBytes: 192192 });
  console.log('EXPECTED_RED: 2 JSON fields incorrect; 2 legacy PNG paths absent. Baseline/backups recorded.');
} else if (mode === 'apply') {
  assert(!fs.existsSync(TEMP), 'Temp directory must be new');
  assert.deepEqual(protectedState(), load(join(RECORD, 'baseline.json')).protected);
  for (const c of changes) {
    assert.equal(sha(read(join(WORK, c.json))), c.beforeSha256, 'Protect current manual edits');
    assert(!fs.existsSync(join(WORK, c.alias)), 'Refuse overwriting an alias');
    put(join(TEMP, c.json), expectedJson(c)); put(join(TEMP, c.alias), read(join(WORK, c.canonical)));
  }
  report('staged-validation.json', verify(TEMP, false));
  // Recheck every input immediately before the four approved runtime writes.
  for (const c of changes) {
    assert.equal(sha(read(join(WORK, c.json))), c.beforeSha256);
    assert.equal(sha(read(join(WORK, c.canonical))), c.pngSha256);
    assert(!fs.existsSync(join(WORK, c.alias)));
  }
  for (const c of changes) {
    fs.writeFileSync(join(WORK, c.json), read(join(TEMP, c.json)));
    fs.writeFileSync(join(WORK, c.alias), read(join(TEMP, c.alias)), { flag: 'wx' });
  }
  const result = verify(WORK, true); report('validation.json', result);
  // Only exact regenerated staging files are removed; no recursive delete.
  const removed = [];
  for (const c of changes) for (const r of [c.json, c.alias]) {
    const f = join(TEMP, r); assert(path.resolve(f).startsWith(path.resolve(TEMP) + path.sep));
    assert(!fs.lstatSync(f).isSymbolicLink()); fs.unlinkSync(f); removed.push(f);
  }
  const dirs = ['json/slaves', 'json', 'content/pic/girls/face', 'content/pic/girls/full/cloth',
    'content/pic/girls/full', 'content/pic/girls', 'content/pic', 'content', ''];
  for (const d of dirs) fs.rmdirSync(join(TEMP, d));
  report('cleanup.json', { status: 'PASS', temporaryRoot: TEMP, removedRegenerableFiles: removed,
    tempRootAbsent: !fs.existsSync(TEMP), retainedBackups: ['before/178.json', 'before/212.json'] });
  console.log(JSON.stringify({ status: result.status, jsonCount: result.jsonCount,
    aliasesAdded: result.aliasesAdded, aliasBytes: result.aliasBytes, protectedFilesAndSavesUnchanged: true,
    tempRootAbsent: !fs.existsSync(TEMP), results: result.results.map(c => ({ json: c.json,
      afterSha256: c.afterSha256, alias: c.alias, pngSha256: c.pngSha256 })) }, null, 2));
} else if (mode === 'verify') {
  const result = verify(WORK, true); console.log(JSON.stringify(result, null, 2));
} else if (mode === 'undo') {
  verify(WORK, false);
  // Precheck all four paths before restoring the two exact backups and removing only aliases.
  for (const c of changes) {
    assert.equal(sha(read(join(WORK, c.json))), sha(expectedJson(c)));
    assert.equal(sha(read(join(WORK, c.alias))), c.pngSha256);
  }
  for (const c of changes) {
    fs.writeFileSync(join(WORK, c.json), read(join(RECORD, 'before/' + path.basename(c.json))));
    fs.unlinkSync(join(WORK, c.alias));
  }
  console.log('Restored exact JSON backups; removed only the two verified compatibility aliases.');
} else throw new Error('Usage: node apply-and-verify.cjs baseline|apply|verify|undo');
// JO9 MOD END THIRD_IMAGE_EXACT_PATH_ALIASES_20261026
