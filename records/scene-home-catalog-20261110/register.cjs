'use strict';
// Register the private-room cutscenes (game/content/pic/scene/home) in the image catalog and the personal patch ledger.
// Follows records/asset-event-ui-20261024/scripts/asset-event-finish.cjs (catalog phase). Dry run unless --apply.
const fs = require('fs'), path = require('path'), zlib = require('zlib'), assert = require('assert');
const repo = 'G:/somi/JO9sa', game = 'G:/somi/Jack O Nine Tails v2.4_work/game', catroot = 'G:/somi/IMGMG';
const rec = repo + '/records/scene-home-catalog-20261110';
const apply = process.argv.includes('--apply');
const mod = require(repo + '/tools/text-workshop/catalog.cjs');
const personal = require(repo + '/tools/text-workshop/personal-patch.cjs');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const htmlPath = catroot + '/catalog_merge_vs_original.html', statusPath = catroot + '/catalog_status.js',
  idsPath = catroot + '/catalog_work_ids.json', progressPath = catroot + '/image_work/progress.json';

const homeDir = game + '/content/pic/scene/home';
const files = fs.readdirSync(homeDir).filter(n => /\.png$/i.test(n)).sort();
const assets = files.map(name => {
  const full = homeDir + '/' + name, b = fs.readFileSync(full);
  assert(b.slice(1, 4).toString() === 'PNG', 'not a png: ' + name);
  return { name, rel: 'content\\pic\\scene\\home\\' + name, patchPath: 'scene/home/' + name, bytes: b.length,
    width: b.readUInt32BE(16), height: b.readUInt32BE(20), sha256: personal.hash(b), mtime: fs.statSync(full).mtime, full };
});

const html = fs.readFileSync(htmlPath, 'utf8');
const m = html.match(/var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/);
assert(m, 'catalog rows not found');
const rows = JSON.parse(m[1]);
const have = new Set(rows.map(r => r[0].toLowerCase()));
const todo = assets.filter(a => !have.has(a.rel.toLowerCase()));
const oldIds = read(idsPath), oldStatus = mod.parseStatus(fs.readFileSync(statusPath, 'utf8')), progress = read(progressPath);
const progressBefore = JSON.stringify(progress.items);
const ledgerBefore = fs.readFileSync(catroot + '/image_work/personal-patch/events.jsonl', 'utf8');
const summary = { apply, found: assets.length, alreadyRegistered: assets.length - todo.length, toRegister: todo.length,
  files: todo.map(a => a.name), oldRows: rows.length };
if (!apply) { console.log(JSON.stringify(summary, null, 2)); process.exit(0); }
assert(todo.length > 0, 'nothing to register');

fs.mkdirSync(rec + '/catalog-before', { recursive: true });
for (const p of [htmlPath, statusPath, idsPath, progressPath, catroot + '/image_work/personal-patch/events.jsonl', catroot + '/catalog_work_codes.js']) {
  const gz = rec + '/catalog-before/' + path.basename(p) + '.gz';
  if (!fs.existsSync(gz)) fs.writeFileSync(gz, zlib.gzipSync(fs.readFileSync(p), { level: 9 }));
}
for (const a of todo) rows.push([a.rel, 'a', 'etc', a.bytes, 0, a.width, a.height, '']);
assert.equal(fs.readFileSync(htmlPath, 'utf8'), html);
mod.atomic(htmlPath, html.replace(m[1], JSON.stringify(rows)));

const cat = mod.create(catroot); cat.load();
const ids = read(idsPath);
for (const [k, v] of Object.entries(oldIds.items)) assert.equal(ids.items[k], v, 'old id changed: ' + k);
assert.equal(Object.keys(ids.items).length, Object.keys(oldIds.items).length + todo.length);
const status = cat.state();
for (const [k, v] of Object.entries(oldStatus.items)) assert.deepEqual(status.items[k], v);

const created = new Date(Math.max(...todo.map(a => +a.mtime))).toISOString();
const event = personal.create(game, catroot).record({
  id: '20261110_private_room_duty_scenes', created,
  files: todo.map(a => ({ path: a.patchPath, before: null, after: a.sha256 }))
}, 'create');
assert.equal(JSON.stringify(progress.items), progressBefore);
const codes = {};
for (const a of todo) {
  const meta = cat.meta(a.rel); codes[a.name] = meta && meta.code;
  progress.items.push({ relative_path: a.rel, work_code: meta.code, catalog_tags: meta.flags, work_status: 'placed',
    completed_at: a.mtime.toISOString(), sha256_before: null, sha256_after: a.sha256, game_path: a.full, backup_paths: [],
    gameplay_verified_by_user: false });
}
progress.updated_at = new Date().toISOString();
mod.atomic(progressPath, JSON.stringify(progress, null, 2) + '\n');
const snap = cat.snapshot();
mod.atomic(catroot + '/catalog_work_codes.js', 'window.JO9_WORK_CODES=' + JSON.stringify(snap.codes) + ';window.JO9_WORK_UNITS=' + JSON.stringify(snap.unitCodes) + ';\n');
const ledgerAfter = fs.readFileSync(catroot + '/image_work/personal-patch/events.jsonl', 'utf8');
assert(ledgerAfter.startsWith(ledgerBefore), 'existing ledger events changed');
const result = { status: 'PASS', ...summary, newRows: rows.length, codes, oldWorkIdsUnchanged: true, oldFlagsUnchanged: true,
  oldProgressEntriesUnchanged: true, event: { key: event.key, created: event.created, files: event.files.length } };
fs.writeFileSync(rec + '/REGISTRATION_RESULT.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
