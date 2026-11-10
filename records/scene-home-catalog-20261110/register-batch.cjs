'use strict';
// Shared append-only registration for the two private-room asset lists. No game image is written.
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib'), assert = require('node:assert/strict');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
function options(argv) {
  const result = { repo: 'G:/somi/JO9sa', game: 'G:/somi/Jack O Nine Tails v2.4_work/game', catalog: 'G:/somi/IMGMG', apply: false };
  const names = { '--repo': 'repo', '--game': 'game', '--catalog': 'catalog', '--record-dir': 'recordDir' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--apply') { result.apply = true; continue; }
    const name = names[argv[i]];
    assert(name, 'unknown argument: ' + argv[i]);
    const value = argv[++i];
    assert(value && !value.startsWith('--'), 'missing path for ' + argv[i - 1]);
    result[name] = value;
  }
  result.recordDir ||= path.join(result.repo, 'records/scene-home-catalog-20261110');
  return result;
}
function register(config, argv = process.argv.slice(2)) {
  const opts = options(argv), { game, catalog: catroot, recordDir: rec, apply } = opts;
  const mod = require(path.join(opts.repo, 'tools/text-workshop/catalog.cjs'));
  const personal = require(path.join(opts.repo, 'tools/text-workshop/personal-patch.cjs'));
  const htmlPath = path.join(catroot, 'catalog_merge_vs_original.html'), statusPath = path.join(catroot, 'catalog_status.js');
  const idsPath = path.join(catroot, 'catalog_work_ids.json'), progressPath = path.join(catroot, 'image_work/progress.json');
  const ledgerPath = path.join(catroot, 'image_work/personal-patch/events.jsonl');
  const homeDir = path.join(game, 'content/pic', config.directory);
  const assets = fs.readdirSync(homeDir).filter(n => config.include.test(n)).sort().map(name => {
    const full = path.join(homeDir, name), b = fs.readFileSync(full);
    assert(b.length >= 24 && b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')), 'not a png: ' + name);
    return { name, rel: mod.normalize('content/pic/' + config.directory + '/' + name), patchPath: config.directory + '/' + name,
      bytes: b.length, width: b.readUInt32BE(16), height: b.readUInt32BE(20), sha256: personal.hash(b), mtime: fs.statSync(full).mtime, full };
  });
  const html = fs.readFileSync(htmlPath, 'utf8'), m = html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);
  assert(m, 'catalog rows not found');
  const rows = JSON.parse(m[1]), have = new Set(rows.map(r => mod.normalize(r[0]).toLowerCase()));
  const todo = assets.filter(a => !have.has(a.rel.toLowerCase()));
  const summary = { apply, found: assets.length, alreadyRegistered: assets.length - todo.length, toRegister: todo.length,
    files: todo.map(a => a.name), oldRows: rows.length };
  if (!apply) return summary;
  // Do not rewrite even the prior result report on a repeat invocation.
  if (todo.length === 0) return { status: 'NO_CHANGES', ...summary, newRows: rows.length };

  const oldIds = read(idsPath), statusBefore = fs.readFileSync(statusPath, 'utf8'), oldStatus = mod.parseStatus(statusBefore);
  const progressText = fs.readFileSync(progressPath, 'utf8'), progress = JSON.parse(progressText.replace(/^\uFEFF/, ''));
  const progressBefore = JSON.stringify(progress.items), oldProgressCount = progress.items.length;
  const ledgerBefore = fs.readFileSync(ledgerPath, 'utf8');
  // The same paths and bytes identify a retry, while every later distinct batch gets its own key.
  const batchFiles = todo.map(a => ({ path: a.patchPath, before: null, after: a.sha256 }));
  const batchId = config.eventPrefix + '_' + personal.hash(Buffer.from(JSON.stringify(batchFiles)));
  const eventKey = batchId + ':create';
  const eventFiles = e => e.files.map(f => ({ path: f.path, before: f.before || null, after: f.after }));
  const findEvent = () => fs.readFileSync(ledgerPath, 'utf8').split('\n').filter(s => s.trim()).map(JSON.parse).find(e => e.key === eventKey);
  const existingEvent = findEvent();
  if (existingEvent) assert.deepEqual(eventFiles(existingEvent), batchFiles, 'batch key already has different files');

  const backup = path.join(rec, config.backupDirectory);
  fs.mkdirSync(backup, { recursive: true });
  for (const p of [htmlPath, statusPath, idsPath, progressPath, ledgerPath, path.join(catroot, 'catalog_work_codes.js')]) {
    const gz = path.join(backup, path.basename(p) + '.gz');
    if (!fs.existsSync(gz)) fs.writeFileSync(gz, zlib.gzipSync(fs.readFileSync(p), { level: 9 }), { flag: 'wx' });
  }
  const created = new Date(Math.max(...todo.map(a => +a.mtime))).toISOString();
  // Establish the event and recoverable objects before changing catalog/progress. A duplicate API return is never dereferenced.
  const event = existingEvent || personal.create(game, catroot).record({ id: batchId, created, files: batchFiles }, 'create') || findEvent();
  assert(event && event.key === eventKey, 'registration event was not recorded');
  assert.deepEqual(eventFiles(event), batchFiles, 'registration event files differ');
  for (const file of event.files) {
    assert.equal(personal.hash(fs.readFileSync(path.join(catroot, 'image_work/personal-patch/objects', file.after))), file.after, 'patch object differs: ' + file.path);
  }
  assert.equal(fs.readFileSync(htmlPath, 'utf8'), html, 'catalog changed during registration');
  assert.equal(fs.readFileSync(progressPath, 'utf8'), progressText, 'progress changed during registration');
  assert.equal(fs.readFileSync(statusPath, 'utf8'), statusBefore, 'checklist changed during registration');
  for (const a of todo) rows.push([a.rel, 'a', 'etc', a.bytes, 0, a.width, a.height, '']);
  mod.atomic(htmlPath, html.replace(m[1], JSON.stringify(rows)));

  const cat = mod.create(catroot); cat.load();
  const ids = read(idsPath);
  for (const [k, v] of Object.entries(oldIds.items)) assert.equal(ids.items[k], v, 'old id changed: ' + k);
  const status = cat.state();
  for (const [k, v] of Object.entries(oldStatus.items)) assert.deepEqual(status.items[k], v);
  const codes = {};
  for (const a of todo) {
    const meta = cat.meta(a.rel); assert(meta && meta.code, 'new work code missing: ' + a.rel); codes[a.name] = meta.code;
    progress.items.push({ relative_path: a.rel, work_code: meta.code, catalog_tags: meta.flags, work_status: 'placed',
      completed_at: a.mtime.toISOString(), sha256_before: null, sha256_after: a.sha256, game_path: a.full, backup_paths: [],
      gameplay_verified_by_user: false });
  }
  assert.equal(JSON.stringify(progress.items.slice(0, oldProgressCount)), progressBefore, 'old progress entries changed');
  progress.updated_at = new Date().toISOString();
  mod.atomic(progressPath, JSON.stringify(progress, null, 2) + '\n');
  const snap = cat.snapshot();
  mod.atomic(path.join(catroot, 'catalog_work_codes.js'), 'window.JO9_WORK_CODES=' + JSON.stringify(snap.codes) + ';window.JO9_WORK_UNITS=' + JSON.stringify(snap.unitCodes) + ';\n');
  assert(fs.readFileSync(ledgerPath, 'utf8').startsWith(ledgerBefore), 'existing ledger events changed');
  assert.equal(fs.readFileSync(statusPath, 'utf8'), statusBefore, 'existing checklist state changed');
  const result = { status: 'PASS', ...summary, newRows: rows.length, codes, oldWorkIdsUnchanged: true, oldFlagsUnchanged: true,
    oldProgressEntriesUnchanged: true, event: { key: event.key, created: event.created, files: event.files.length } };
  fs.writeFileSync(path.join(rec, config.resultName), JSON.stringify(result, null, 2));
  return result;
}
module.exports = { register };
