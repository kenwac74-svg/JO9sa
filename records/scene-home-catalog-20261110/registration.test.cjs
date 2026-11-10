'use strict';
// Synthetic files only. Both scripts use the real catalog/personal-patch modules.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { spawnSync } = require('node:child_process');
const repo = path.resolve(__dirname, '../..');
const scripts = process.env.JO9_REGISTRATION_SCRIPT_ROOT || __dirname;
const sandbox = 'G:/Codex/tmp/claude-fix-tests-20261110/registration';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const variants = [
  { name: 'scenes', script: 'register.cjs', directory: 'scene/home', prefix: '20261110_private_room_duty_scenes',
    first: Array.from({ length: 28 }, (_, i) => 'fixture_' + String(i + 1).padStart(2, '0') + '.png'), next: 'fixture_29.png' },
  // There are eight accepted interior filenames; add the eighth after a seven-file first batch.
  { name: 'interiors', script: 'register_interiors.cjs', directory: 'bg/interiors', prefix: '20261110_private_room_interiors',
    first: ['basic_slave_room.png', 'basic_slave_room_large1.png', 'standard_slave_room.png', 'standard_slave_room_large1.png',
      'quality_slave_room.png', 'quality_slave_room_large1.png', 'luxury_slave_room.png'], next: 'luxury_slave_room_large1.png' }
];
function png(value) {
  function chunk(type, body) {
    const bytes = Buffer.concat([Buffer.from(type), body]);
    let crc = 0xffffffff;
    for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    const out = Buffer.alloc(body.length + 12);
    out.writeUInt32BE(body.length, 0); bytes.copy(out, 4); out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, out.length - 4);
    return out;
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.from([0, value, 120, 210, 255]))), chunk('IEND', Buffer.alloc(0))]);
}
function tree(root) {
  if (!fs.existsSync(root)) return {};
  const result = {};
  function visit(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, item.name);
      assert(!item.isSymbolicLink(), 'fixture must not contain links');
      if (item.isDirectory()) visit(full);
      else result[path.relative(root, full)] = { sha256: hash(fs.readFileSync(full)), mtime: fs.statSync(full).mtimeMs };
    }
  }
  visit(root); return result;
}
function fixture(t, variant) {
  fs.mkdirSync(sandbox, { recursive: true });
  const root = fs.mkdtempSync(path.join(sandbox, variant.name + '-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(sandbox), 'cleanup outside registration sandbox');
    tree(root); // Refuse link traversal before recursive cleanup.
    fs.rmSync(root, { recursive: true, force: true });
  });
  const f = { root, game: path.join(root, 'game'), catalog: path.join(root, 'catalog'), rec: path.join(root, 'record') };
  f.images = path.join(f.game, 'content/pic', variant.directory);
  f.personal = path.join(f.catalog, 'image_work/personal-patch');
  f.objects = path.join(f.personal, 'objects');
  for (const dir of [f.images, f.objects, f.rec]) fs.mkdirSync(dir, { recursive: true });
  const old = png(250), sha256 = hash(old), relative = 'content\\pic\\scene\\existing.png';
  fs.writeFileSync(path.join(f.objects, sha256), old);
  fs.writeFileSync(path.join(f.objects, 'manual-recovery-object'), 'sole recovery fixture');
  fs.writeFileSync(path.join(f.personal, 'settings.json'), JSON.stringify({ version: 1, trackingStarted: '2026-10-01T00:00:00.000Z', manual: 'keep' }));
  fs.writeFileSync(path.join(f.personal, 'events.jsonl'), JSON.stringify({ version: 1, key: 'earlier:create', id: 'earlier',
    created: '2026-10-01T00:00:00.000Z', createdKST: '2026-10-01 09:00:00 +09:00', recorded: '2026-10-01T00:00:00.000Z',
    operation: 'create', imported: false, files: [{ path: 'scene/existing.png', after: sha256, before: null, bytes: old.length, beforePath: null }] }) + '\n');
  fs.writeFileSync(path.join(f.catalog, 'catalog_merge_vs_original.html'), '<!doctype html><script>\nvar D=' +
    JSON.stringify([[relative, 'a', 'etc', old.length, 0, 1, 1, '']]) + ';\nvar MR=[];\n</script>');
  fs.writeFileSync(path.join(f.catalog, 'catalog_work_ids.json'), JSON.stringify({ version: 1, items: { [relative]: 'SC-0042' }, counters: { SC: 42, bg: 7 }, manual: 'keep' }));
  fs.writeFileSync(path.join(f.catalog, 'catalog_status.js'), 'window.CATALOG_STATUS=' + JSON.stringify({
    savedAt: 123456, items: { [relative]: ['done', 'wip'] }, characterItems: { 2577: ['spare'] }, autoDone: { child: relative }, manual: 'keep' }) + ';\n');
  fs.writeFileSync(path.join(f.catalog, 'image_work/progress.json'), JSON.stringify({ version: 3, manual: 'keep', updated_at: 'old',
    items: [{ relative_path: relative, work_code: 'SC-0042', work_status: 'manual', user_notes: 'keep all fields', gameplay_verified_by_user: true }] }));
  fs.writeFileSync(path.join(f.catalog, 'catalog_work_codes.js'), 'window.JO9_WORK_CODES={};window.JO9_WORK_UNITS={};\n');
  return f;
}
function place(f, names, start = 1) {
  names.forEach((name, i) => {
    const full = path.join(f.images, name); fs.writeFileSync(full, png(start + i));
    fs.utimesSync(full, new Date('2026-11-10T00:00:00Z'), new Date('2026-11-10T00:00:00Z'));
  });
}
function run(f, variant, apply) {
  const result = spawnSync(process.execPath, [path.join(scripts, variant.script), '--repo', repo, '--game', f.game,
    '--catalog', f.catalog, '--record-dir', f.rec, ...(apply ? ['--apply'] : [])], { encoding: 'utf8' });
  assert.equal(result.status, 0, (apply ? 'apply' : 'dry run') + ' must succeed: ' + result.stderr + result.stdout);
  return JSON.parse(result.stdout);
}
function events(f) { return fs.readFileSync(path.join(f.personal, 'events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse); }
function rows(f) { return JSON.parse(fs.readFileSync(path.join(f.catalog, 'catalog_merge_vs_original.html'), 'utf8').match(/var D=(\[[\s\S]*?\]);\nvar MR/)[1]); }
function state(f) {
  return { ids: read(path.join(f.catalog, 'catalog_work_ids.json')), progress: read(path.join(f.catalog, 'image_work/progress.json')),
    flags: fs.readFileSync(path.join(f.catalog, 'catalog_status.js'), 'utf8'), rows: rows(f),
    objects: tree(f.objects), ledger: fs.readFileSync(path.join(f.personal, 'events.jsonl'), 'utf8'), game: tree(f.game) };
}
function preserved(f, before) {
  const after = state(f);
  for (const [relative, id] of Object.entries(before.ids.items)) assert.equal(after.ids.items[relative], id, relative + ' changed code');
  assert.equal(after.ids.manual, 'keep'); assert.equal(after.flags, before.flags, 'checklist flags or character state changed');
  assert.deepEqual(after.progress.items.slice(0, before.progress.items.length), before.progress.items, 'old progress fields changed');
  assert.equal(after.progress.manual, 'keep'); assert.deepEqual(after.rows.slice(0, before.rows.length), before.rows);
  for (const [name, object] of Object.entries(before.objects)) assert.deepEqual(after.objects[name], object, 'old recovery object changed');
  assert(after.ledger.startsWith(before.ledger), 'prior ledger bytes changed'); assert.deepEqual(after.game, before.game, 'game PNG changed');
}
for (const variant of variants) {
  test(variant.name + ': adds a second batch after a legacy event, preserves prior state, and repeats without writes', t => {
    const f = fixture(t, variant); place(f, variant.first);
    const beforeDry = tree(f.root), dry = run(f, variant, false);
    assert.equal(dry.toRegister, variant.first.length); assert.deepEqual(tree(f.root), beforeDry, 'dry run wrote files');
    const original = state(f), first = run(f, variant, true);
    assert.equal(first.toRegister, variant.first.length); assert.equal(events(f).at(-1).files.length, variant.first.length); preserved(f, original);
    // Reproduce the deployed historical ID without changing event content or object bytes.
    const historical = events(f); historical.at(-1).id = variant.prefix; historical.at(-1).key = variant.prefix + ':create';
    fs.writeFileSync(path.join(f.personal, 'events.jsonl'), historical.map(e => JSON.stringify(e) + '\n').join(''));
    place(f, [variant.next], 100);
    const before = state(f), second = run(f, variant, true);
    assert.equal(second.toRegister, 1); assert.equal(second.alreadyRegistered, variant.first.length); preserved(f, before);
    const afterEvents = events(f), appended = afterEvents.at(-1);
    assert.equal(afterEvents.length, 3, 'new catalog PNG lost its event');
    assert.notEqual(appended.key, variant.prefix + ':create'); assert.equal(second.event.key, appended.key);
    assert.equal(appended.files.length, 1); assert.equal(appended.files[0].path, variant.directory + '/' + variant.next);
    assert.deepEqual(fs.readFileSync(path.join(f.objects, appended.files[0].after)), fs.readFileSync(path.join(f.images, variant.next)));
    const finalProgress = read(path.join(f.catalog, 'image_work/progress.json'));
    assert.equal(finalProgress.items.length, 1 + variant.first.length + 1);
    assert.equal(Object.keys(read(path.join(f.catalog, 'catalog_work_ids.json')).items).length, 1 + variant.first.length + 1);
    const beforeRepeat = tree(f.root), repeat = run(f, variant, true);
    assert.equal(repeat.status, 'NO_CHANGES'); assert.equal(repeat.toRegister, 0);
    assert.deepEqual(tree(f.root), beforeRepeat, 'repeat --apply wrote files or duplicated progress/events');
  });
  test(variant.name + ': batch event keys depend on paths and bytes, not mtimes or directory order', t => {
    const first = fixture(t, variant), second = fixture(t, variant);
    const names = variant.first.slice(0, 2);
    place(first, names);
    place(second, [...names].reverse(), 1);
    // Keep each name's bytes identical despite the opposite creation order.
    for (const name of names) { fs.copyFileSync(path.join(first.images, name), path.join(second.images, name));
      fs.utimesSync(path.join(second.images, name), new Date('2026-11-11T00:00:00Z'), new Date('2026-11-11T00:00:00Z')); }
    assert.equal(run(first, variant, true).event.key, run(second, variant, true).event.key);
    const changed = fixture(t, variant); place(changed, names, 100);
    assert.notEqual(run(first, variant, false).toRegister, 2);
    assert.notEqual(events(first).at(-1).key, run(changed, variant, true).event.key, 'changed bytes reused an event key');
  });
}
for (const variant of variants) {
  test(variant.name + ': an already-registered --apply returns without changing any file', t => {
    const f = fixture(t, variant); place(f, variant.first);
    run(f, variant, true);
    const before = tree(f.root), repeated = run(f, variant, true);
    assert.equal(repeated.status, 'NO_CHANGES'); assert.equal(repeated.toRegister, 0);
    assert.deepEqual(tree(f.root), before, 'empty apply changed catalog, progress, ledger, objects, or reports');
  });
}
