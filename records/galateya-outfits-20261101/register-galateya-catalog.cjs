'use strict';

// Incremental registration only. Do not regenerate either catalog or write a ledger.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const http = require('node:http');
const OUT = __dirname;
const GAME = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const REPO = 'G:/somi/JO9sa';
const WORK = GAME + '/modtools/catalog';
const SEED = REPO + '/tools/local-workspace/catalog-seed';
const ORIGINAL = 'G:/somi/JO9O/game';
const TASK = 'GALATEYA_OUTFITS_CATALOG_20261101';
const TMP = 'G:/Codex/tmp/galateya-outfits-20261101';
const NAMES = ['catalog_merge_vs_original.html', 'catalog_work_ids.json', 'catalog_work_codes.js', 'catalog_status.js'];
const ROLE_PATHS = {
  maid: 'content/pic/girls/full/2583/2583_full_maid.png',
  secr: 'content/pic/girls/full/2583/2583_full_secr.png',
  dom: 'content/pic/girls/full/2583/2583_full_dom.png'
};
const ROWS = /var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const catalog = require(REPO + '/tools/text-workshop/catalog.cjs');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const read = file => fs.readFileSync(file);
const hash = file => sha(read(file));
const json = file => JSON.parse(read(file).toString('utf8').replace(/^\uFEFF/, ''));
const norm = value => String(value).replace(/\\/g, '/').toLowerCase();
const key = value => String(value).replace(/\//g, '\\');
const absoluteNorm = value => norm(path.resolve(value));
const inside = (root, file) => absoluteNorm(file).startsWith(absoluteNorm(root) + '/');
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const snapshot = file => ({ path: file, bytes: fs.statSync(file).size, sha256: hash(file) });

function spliceMatch(text, match, value) {
  const start = match.index + match[0].indexOf(match[1]);
  return text.slice(0, start) + value + text.slice(start + match[1].length);
}

function rows(text) {
  const match = text.match(ROWS);
  assert(match, 'Catalog D array is missing.');
  return { match, value: JSON.parse(match[1]) };
}

function scripts(text) {
  let count = 0;
  for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(match[1])) continue;
    new vm.Script(match[2]);
    count++;
  }
  return count;
}

function jsonAssignment(text, expression) {
  const match = text.match(expression);
  assert(match, 'Expected data assignment is missing.');
  return { match, value: JSON.parse(match[1]) };
}

function preserveKeys(before, after, label) {
  for (const [name, value] of Object.entries(before)) assert.deepEqual(after[name], value, label + ': existing key changed: ' + name);
}

function assertOnlyAddedKeys(before, after, expected, label) {
  preserveKeys(before, after, label);
  assert.deepEqual(Object.keys(after).filter(name => !Object.hasOwn(before, name)).sort(), [...expected].sort(), label + ': unexpected added keys');
}

function png(file) {
  const raw = read(file);
  assert.equal(raw.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(raw.subarray(12, 16).toString('ascii'), 'IHDR');
  assert.deepEqual([raw.readUInt32BE(16), raw.readUInt32BE(20), raw[24], raw[25]], [795, 596, 8, 6], 'Expected 795x596 RGBA8: ' + file);
  return raw;
}

function loadAssets(file) {
  const raw = read(file), manifest = JSON.parse(raw.toString('utf8').replace(/^\uFEFF/, ''));
  assert.equal(manifest.id, 'GALATEYA_OUTFITS_20261101');
  assert.equal(absoluteNorm(manifest.game), absoluteNorm(GAME));
  assert.equal(manifest.assets.length, 3);
  const assets = ['maid', 'secr', 'dom'].map(role => {
    const asset = manifest.assets.find(value => value.role === role);
    assert(asset, 'Missing manifest role: ' + role);
    assert.equal(asset.path, ROLE_PATHS[role]);
    assert.deepEqual(asset.dimensions, [795, 596]);
    const installed = GAME + '/' + asset.path;
    const image = png(installed);
    assert.equal(image.length, asset.bytes);
    assert.equal(sha(image), asset.sha256, 'Installed PNG differs from the current prepared manifest.');
    assert.equal(hash(asset.staged), asset.sha256, 'Staged PNG changed.');
    assert.equal(hash(GAME + '/' + asset.source), asset.sourceSha256, 'User-provided source changed.');
    assert(!fs.existsSync(ORIGINAL + '/' + asset.path), 'The new catalog path unexpectedly exists in the original game.');
    return { ...asset, installed };
  });
  assert.equal(manifest.json.path, 'json/slaves/2583_galateya.json');
  assert.equal(hash(GAME + '/' + manifest.json.path), manifest.json.after, 'Install the approved JSON before catalog registration.');
  assert.equal(hash(manifest.json.staged), manifest.json.after);
  const template = json(GAME + '/' + manifest.json.path);
  const expected = { fullimage: 'girls/full/galateya_purple_long', fullmade: ROLE_PATHS.maid.slice(12, -4), fullsecretary: ROLE_PATHS.secr.slice(12, -4), fullmistress: ROLE_PATHS.dom.slice(12, -4), indpack_title: 'characters/galateya', indpack_naked: 'characters/galateya', indpack_maid: ROLE_PATHS.maid.slice(12, -4), indpack_secr: ROLE_PATHS.secr.slice(12, -4), indpack_dom: ROLE_PATHS.dom.slice(12, -4) };
  for (const [name, value] of Object.entries(expected)) assert.equal(template[name], value, 'Unexpected outfit JSON: ' + name);
  assert.equal(template.seed_name, 'Galateya');
  assert.equal(template.seed_age, 0);
  for (const item of manifest.protected) assert.equal(hash(item.path), item.sha256, 'Protected source changed: ' + item.path);
  return { file, rawHash: sha(raw), manifest, assets };
}

function hiddenPaths() {
  const file = REPO + '/records/db-bg-catalog-dedup-20261101/exclusions-and-restore.json';
  const source = json(file);
  const hidden = new Set(source.catalogs.filter(value => value.file.endsWith('.html')).flatMap(value => value.removed.map(item => norm(item.row[0]))));
  assert.equal(hidden.size, 82);
  return { file, sha256: hash(file), paths: [...hidden] };
}

function loadCatalog(root) {
  const files = Object.fromEntries(NAMES.map(name => {
    const file = root + '/' + name, raw = read(file);
    return [name, { path: file, raw, bytes: raw.length, sha256: sha(raw) }];
  }));
  const html = files[NAMES[0]].raw.toString('utf8');
  const data = rows(html);
  const ids = JSON.parse(files[NAMES[1]].raw.toString('utf8').replace(/^\uFEFF/, ''));
  const codesText = files[NAMES[2]].raw.toString('utf8');
  const codes = jsonAssignment(codesText, /window\.JO9_WORK_CODES\s*=\s*(\{[\s\S]*?\});\s*window\.JO9_WORK_UNITS/);
  const statusText = files[NAMES[3]].raw.toString('utf8');
  const status = jsonAssignment(statusText, /window\.CATALOG_STATUS\s*=\s*([\s\S]*);\s*$/);
  const normalized = data.value.map(row => norm(row[0]));
  assert.equal(new Set(normalized).size, normalized.length, 'Pre-existing duplicate D paths must be reviewed separately.');
  for (const role of ['maid', 'secr', 'dom']) {
    const relative = ROLE_PATHS[role];
    assert(!normalized.includes(norm(relative)), 'The new path is already indexed: ' + relative);
    assert(!Object.keys(ids.items).some(item => norm(item) === norm(relative)), 'The new path already has an ID.');
    assert(!Object.keys(codes.value).some(item => norm(item) === norm(relative)), 'The new path already has a code.');
  }
  return { root, files, html, data, ids, codesText, codes, statusText, status, inlineScripts: scripts(html) };
}

function catalogProtected() {
  const result = [];
  for (const root of [WORK, SEED]) {
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) if (entry.isFile() && !NAMES.includes(entry.name)) result.push(snapshot(root + '/' + entry.name));
    for (const relative of ['image_work/history.jsonl', 'image_work/progress.json', 'image_work/bg_queue.json', 'image_work/personal-patch/events.jsonl', 'image_work/personal-patch/settings.json']) {
      const file = root + '/' + relative;
      if (fs.existsSync(file)) result.push(snapshot(file));
    }
  }
  return result;
}

function guard(prepared, installed) {
  for (const output of prepared.outputs) assert.equal(hash(output.path), installed ? output.after : output.before, 'Concurrent catalog edit: ' + output.path);
  for (const item of prepared.protected) assert.equal(hash(item.path), item.sha256, 'Protected input changed: ' + item.path);
}

function destination(file) {
  assert([WORK, SEED].some(root => NAMES.some(name => absoluteNorm(file) === absoluteNorm(root + '/' + name))), 'Write destination is outside the eight approved catalog files: ' + file);
}

function prepare(manifestFile) {
  const input = loadAssets(manifestFile);
  const hidden = hiddenPaths();
  const catalogs = [loadCatalog(WORK), loadCatalog(SEED)];
  const id = new Date().toISOString().replace(/[-:.TZ]/g, '') + '-' + crypto.randomBytes(3).toString('hex');
  const temporaryRoot = TMP + '/catalog-' + id;
  assert(inside(TMP, temporaryRoot));
  assert(!fs.existsSync(temporaryRoot));
  fs.mkdirSync(temporaryRoot, { recursive: true });
  writeJson(temporaryRoot + '/.galateya-catalog-owned.json', { task: TASK, temporaryRoot });
  const used = new Set(catalogs.flatMap(value => Object.values(value.ids.items)));
  let counter = Math.max(...catalogs.map(value => Number(value.ids.counters.GL || 0)));
  const stable = {};
  for (const asset of input.assets) {
    let code;
    do { code = 'GL-' + String(++counter).padStart(4, '0'); } while (used.has(code));
    stable[key(asset.path)] = code;
    used.add(code);
  }
  const newRows = input.assets.map(asset => [key(asset.path), 'a', 'etc', asset.bytes, 0, 795, 596, '']);
  const newKeys = newRows.map(row => row[0]);
  const outputs = [], preservation = [], recovery = {};
  function output(file, text, label) {
    destination(file.path);
    const raw = Buffer.from(text), candidate = temporaryRoot + '/' + label;
    fs.writeFileSync(candidate, raw, { flag: 'wx' });
    outputs.push({ path: file.path, candidate, before: file.sha256, after: sha(raw), bytes: raw.length });
    recovery[file.path] = file.raw.toString('base64');
  }
  for (const [index, current] of catalogs.entries()) {
    for (const row of current.data.value) assert(!hidden.paths.includes(norm(row[0])), 'A previously hidden DB_BG row reappeared.');
    const appended = current.data.match[1].slice(0, -1) + (current.data.value.length ? ',' : '') + newRows.map(row => JSON.stringify(row)).join(',') + ']';
    const html = spliceMatch(current.html, current.data.match, appended);
    const nextRows = rows(html).value;
    assert.deepEqual(nextRows.slice(0, current.data.value.length), current.data.value, 'An existing D row changed.');
    assert.deepEqual(nextRows.slice(current.data.value.length), newRows);
    assert.equal(scripts(html), current.inlineScripts);
    assert.equal(spliceMatch(html, html.match(ROWS), '__UNCHANGED_D__'), spliceMatch(current.html, current.data.match, '__UNCHANGED_D__'), 'HTML outside the D data changed.');
    output(current.files[NAMES[0]], html, index + '-catalog.html');

    const ids = structuredClone(current.ids);
    Object.assign(ids.items, stable);
    ids.counters.GL = counter;
    assertOnlyAddedKeys(current.ids.items, ids.items, newKeys, 'Stable IDs');
    for (const [name, value] of Object.entries(current.ids)) if (!['items', 'counters'].includes(name)) assert.deepEqual(ids[name], value);
    for (const [name, value] of Object.entries(current.ids.counters)) if (name !== 'GL') assert.equal(ids.counters[name], value);
    output(current.files[NAMES[1]], JSON.stringify(ids, null, 2) + '\n', index + '-ids.json');

    const codes = { ...current.codes.value, ...stable };
    assertOnlyAddedKeys(current.codes.value, codes, newKeys, 'Work codes');
    const codeText = spliceMatch(current.codesText, current.codes.match, JSON.stringify(codes));
    assert.equal(spliceMatch(codeText, codeText.match(/window\.JO9_WORK_CODES\s*=\s*(\{[\s\S]*?\});\s*window\.JO9_WORK_UNITS/), '__CODES__'), spliceMatch(current.codesText, current.codes.match, '__CODES__'), 'Work-units or module code changed.');
    new vm.Script(codeText);
    output(current.files[NAMES[2]], codeText, index + '-codes.js');

    const status = structuredClone(current.status.value);
    for (const newKey of newKeys) {
      if (!Object.hasOwn(status.items, newKey)) status.items[newKey] = ['done'];
      else {
        assert(Array.isArray(status.items[newKey]));
        if (!status.items[newKey].includes('done')) status.items[newKey].push('done');
      }
    }
    status.savedAt = Math.max(Date.now(), Number(status.savedAt || 0) + 1);
    for (const [name, value] of Object.entries(current.status.value)) if (!['savedAt', 'items'].includes(name)) assert.deepEqual(status[name], value, 'Status field changed: ' + name);
    for (const [name, value] of Object.entries(current.status.value.items)) if (!newKeys.includes(name)) assert.deepEqual(status.items[name], value, 'Existing flags changed: ' + name);
    const statusText = spliceMatch(current.statusText, current.status.match, JSON.stringify(status));
    new vm.Script(statusText);
    output(current.files[NAMES[3]], statusText, index + '-status.js');
    preservation.push({ root: current.root, rowsBefore: current.data.value.length, rowsAfter: nextRows.length, oldRowsUnchanged: true, oldIdKeysUnchanged: Object.keys(current.ids.items).length, oldCodeKeysUnchanged: Object.keys(current.codes.value).length, oldStatusKeysUnchanged: Object.keys(current.status.value.items).filter(name => !newKeys.includes(name)).length, autoDoneUnchanged: true, htmlOutsideDUnchanged: true, inlineScriptCount: current.inlineScripts, hiddenPathsStillAbsent: hidden.paths.length });
  }
  const protectedFiles = new Map();
  for (const item of [...catalogProtected(), ...input.manifest.protected, snapshot(input.file), snapshot(input.manifest.json.staged), snapshot(GAME + '/' + input.manifest.json.path), snapshot(hidden.file)]) protectedFiles.set(absoluteNorm(item.path), item);
  for (const asset of input.assets) for (const file of [asset.installed, asset.staged]) protectedFiles.set(absoluteNorm(file), snapshot(file));
  const baseline = Buffer.from(JSON.stringify({ task: TASK, id, files: recovery }));
  const recoveryPath = OUT + '/catalog-' + id + '-before.json.gz';
  const compressed = zlib.gzipSync(baseline, { level: 9 });
  assert(zlib.gunzipSync(compressed).equals(baseline));
  fs.writeFileSync(recoveryPath, compressed, { flag: 'wx' });
  const preparationPath = OUT + '/catalog-' + id + '-preparation.json';
  const prepared = { task: TASK, id, createdAt: new Date().toISOString(), manifest: { path: input.file, sha256: input.rawHash }, temporaryRoot, recovery: { path: recoveryPath, sha256: sha(compressed), bytes: compressed.length }, stableIds: stable, newRows, assets: input.assets, outputs, protected: [...protectedFiles.values()], preservation, limits: ['Exactly three rows and stable IDs appended to each current catalog; prior WORK/seed differences are retained.', 'New PNGs are user supplied, source etc, original bytes zero, and done. Existing status keys and autoDone remain intact.', 'No scene-condition regeneration, module rewrite, ledger event, Full write, QSP write, or packaging.', 'Existing count banners and unrelated catalog metadata are preserved with the HTML outside D.'] };
  guard(prepared, false);
  writeJson(preparationPath, prepared);
  console.log(JSON.stringify({ status: 'PREPARED', preparation: preparationPath, stableIds: stable, preservation, changedFiles: outputs.length }, null, 2));
}

function apply(preparationPath) {
  const prepared = json(preparationPath);
  assert.equal(prepared.task, TASK);
  assert.equal(prepared.outputs.length, 8);
  assert.equal(hash(prepared.recovery.path), prepared.recovery.sha256);
  const beforeRecords = JSON.parse(zlib.gunzipSync(read(prepared.recovery.path)).toString('utf8'));
  assert.equal(beforeRecords.task, TASK);
  for (const output of prepared.outputs) assert.equal(sha(Buffer.from(beforeRecords.files[output.path], 'base64')), output.before, 'Recovery snapshot differs from the captured before hash.');
  assert.equal(hash(prepared.manifest.path), prepared.manifest.sha256);
  loadAssets(prepared.manifest.path);
  guard(prepared, false);
  const stages = [];
  const installed = [];
  try {
    for (const output of prepared.outputs) {
      destination(output.path);
      const raw = read(output.candidate);
      assert.equal(sha(raw), output.after);
      const stage = output.path + '.galateya-' + prepared.id + '.tmp';
      assert(!fs.existsSync(stage));
      fs.writeFileSync(stage, raw, { flag: 'wx' });
      stages.push({ ...output, stage });
    }
    // Check every before hash again immediately before the first destination write.
    guard(prepared, false);
    for (const output of stages) {
      assert.equal(hash(output.path), output.before, 'Concurrent destination edit immediately before write.');
      fs.renameSync(output.stage, output.path);
      installed.push(output.path);
      assert.equal(hash(output.path), output.after);
    }
    guard(prepared, true);
  } catch (error) {
    const failurePath = OUT + '/catalog-' + prepared.id + '-apply-failure.json';
    writeJson(failurePath, { task: TASK, error: error.stack, installed, preparationPath, recovery: prepared.recovery, note: 'No unrelated or concurrent changes were rolled back. Use the compressed exact before snapshot for reviewed recovery.' });
    throw error;
  } finally {
    for (const output of stages) if (fs.existsSync(output.stage)) fs.unlinkSync(output.stage);
  }
  const installationPath = OUT + '/catalog-' + prepared.id + '-installation.json';
  writeJson(installationPath, { task: TASK, status: 'PASS', installedAt: new Date().toISOString(), preparationPath, preparedSha256: hash(preparationPath), outputs: prepared.outputs, stableIds: prepared.stableIds, preservation: prepared.preservation, protectedUnchanged: true });
  console.log(JSON.stringify({ status: 'PASS', installation: installationPath, stableIds: prepared.stableIds, preservation: prepared.preservation, changedFiles: installed.length }, null, 2));
}

function get(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { headers: { 'Cache-Control': 'no-cache' } }, response => {
      const parts = [];
      response.on('data', part => parts.push(part));
      response.on('end', () => resolve({ status: response.statusCode, type: response.headers['content-type'], body: Buffer.concat(parts) }));
    });
    request.on('error', reject);
    request.setTimeout(15000, () => request.destroy(Error('Catalog image HTTP timeout.')));
  });
}

async function verifyHttp(installationPath) {
  const installed = json(installationPath), prepared = json(installed.preparationPath);
  assert.equal(installed.task, TASK);
  assert.equal(installed.status, 'PASS');
  assert.equal(hash(installed.preparationPath), installed.preparedSha256);
  guard(prepared, true);
  const configText = read(WORK + '/catalog_workshop_config.js').toString('utf8');
  const bridge = jsonAssignment(configText, /window\.JO9_CATALOG_BRIDGE\s*=\s*([\s\S]*);\s*$/).value;
  const base = new URL(bridge.url);
  assert.equal(base.protocol, 'http:');
  assert.equal(base.hostname, '127.0.0.1');
  const results = [];
  // Serial GETs read only the three exact new runtime files. Never log the token.
  for (const asset of prepared.assets) {
    const url = new URL('/api/catalog-asset', base);
    url.searchParams.set('t', bridge.token);
    url.searchParams.set('original', '0');
    url.searchParams.set('p', asset.path);
    const response = await get(url);
    const actual = sha(response.body);
    assert.equal(response.status, 200, 'Image HTTP status: ' + asset.path);
    assert(/^image\/png\b/i.test(response.type || ''));
    assert.equal(actual, asset.sha256, 'HTTP PNG differs: ' + asset.path);
    assert.equal(response.body.length, asset.bytes);
    results.push({ path: asset.path, status: response.status, contentType: response.type, bytes: response.body.length, sha256: actual });
  }
  guard(prepared, true);
  const report = OUT + '/catalog-' + prepared.id + '-http.json';
  writeJson(report, { task: TASK, status: 'PASS', checkedAt: new Date().toISOString(), origin: base.origin, endpoint: '/api/catalog-asset', installationPath, results, protectedUnchanged: true });
  console.log(JSON.stringify({ status: 'PASS', report, images: results.length, hashesMatch: true }, null, 2));
}

function cleanup(installationPath) {
  const installed = json(installationPath), prepared = json(installed.preparationPath);
  assert.equal(installed.task, TASK);
  assert.equal(installed.status, 'PASS');
  assert.equal(hash(prepared.recovery.path), prepared.recovery.sha256);
  guard(prepared, true);
  const target = fs.realpathSync(prepared.temporaryRoot);
  assert(inside(TMP, target));
  assert(!fs.lstatSync(target).isSymbolicLink());
  const owner = json(target + '/.galateya-catalog-owned.json');
  assert.equal(owner.task, TASK);
  assert.equal(absoluteNorm(owner.temporaryRoot), absoluteNorm(target));
  const expected = new Set(['.galateya-catalog-owned.json', ...prepared.outputs.map(output => path.basename(output.candidate))]);
  const entries = fs.readdirSync(target, { withFileTypes: true });
  assert.deepEqual(entries.map(entry => entry.name).sort(), [...expected].sort());
  let removedBytes = 0;
  for (const entry of entries) {
    const file = path.join(target, entry.name);
    assert(entry.isFile() && !entry.isSymbolicLink());
    assert(inside(target, fs.realpathSync(file)));
    const output = prepared.outputs.find(output => path.basename(output.candidate) === entry.name);
    if (output) assert.equal(hash(file), output.after);
    removedBytes += fs.statSync(file).size;
  }
  for (const entry of entries) fs.unlinkSync(path.join(target, entry.name));
  fs.rmdirSync(target);
  const report = OUT + '/catalog-' + prepared.id + '-cleanup.json';
  writeJson(report, { task: TASK, status: 'PASS', temporaryRoot: target, removed: !fs.existsSync(target), removedFiles: entries.length, removedBytes, retainedRecovery: prepared.recovery, retainedPreparation: installed.preparationPath, retainedInstallation: installationPath, protectedUnchanged: true });
  console.log(JSON.stringify({ status: 'PASS', report, removedBytes }, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--prepare' && args.length <= 2) prepare(path.resolve(args[1] || OUT + '/assets-prepared.json'));
  else if (args[0] === '--apply' && args.length === 2) apply(path.resolve(args[1]));
  else if (args[0] === '--http' && args.length === 2) await verifyHttp(path.resolve(args[1]));
  else if (args[0] === '--cleanup' && args.length === 2) cleanup(path.resolve(args[1]));
  else throw Error('Usage: node register-galateya-catalog.cjs --prepare [assets-prepared.json] | --apply <preparation.json> | --http <installation.json> | --cleanup <installation.json>');
}

main().catch(error => { console.error(error.stack || String(error)); process.exitCode = 1; });
