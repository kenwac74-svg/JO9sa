'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const core = require('../text-workshop/core.cjs');

const root = path.resolve(__dirname, '../..');
const task = path.join(root, 'tmp/commit-update3-20261107');
const generated = path.join(task, 'generated');
const git = args => cp.execFileSync('git', args, {cwd:root, maxBuffer:128 * 1024 * 1024});
const parent = git(['rev-parse', 'origin/main']).toString().trim();
assert.equal(parent, 'cb0123950a99084f7795de324d6a3a053d219bfe');
const branch = 'codex/release-2.4.1-update3-20261107';
const qspHash = '46e972bf98bc74cd79176312683e398bf7ae639bc7edeecadfcb6efd9a8f54b9';
const zipHash = '720ddc1876c9a5118f65a3d95744ed7f2b36764890f19f6062bcd0329569f4a0';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const parentFiles = new Map(git(['ls-tree','-r','-z',parent]).toString().split('\0').filter(Boolean).map(item => {
  const [meta, filename] = item.split('\t');
  return [filename, meta.split(' ')[2]];
}));
const entries = new Map();

function add(source, repositoryPath) {
  assert(!repositoryPath.includes('\\') && !repositoryPath.startsWith('/') && !repositoryPath.split('/').includes('..'));
  assert(!/(^|\/)(tmp|backups|node_modules|__pycache__)(\/|$)|\.sav$|\.bak$|\.zip$|local\.config|grok-settings/i.test(repositoryPath));
  const bytes = fs.readFileSync(source);
  assert(bytes.length < 100 * 1024 * 1024, repositoryPath);
  const oid = crypto.createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex');
  if (parentFiles.get(repositoryPath) === oid) return;
  if (/\.(json|cjs|ps1|md|txt|html|js)$/.test(repositoryPath)) {
    assert(!/(?:sk-(?:proj-|or-v1-)?[A-Za-z0-9_-]{35,}|AIza[0-9A-Za-z_-]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/.test(bytes.toString('utf8')),
      'Possible credential in ' + repositoryPath);
  }
  assert(!entries.has(repositoryPath), 'Duplicate commit entry ' + repositoryPath);
  entries.set(repositoryPath, {source:path.resolve(source), path:repositoryPath, bytes:bytes.length, sha256:sha(bytes), oid});
}
function generate(repositoryPath, bytes) {
  const filename = path.join(generated, repositoryPath);
  fs.mkdirSync(path.dirname(filename), {recursive:true});
  fs.writeFileSync(filename, bytes);
  add(filename, repositoryPath);
}
function walk(directory, visit) {
  for (const item of fs.readdirSync(directory, {withFileTypes:true})) {
    const filename = path.join(directory, item.name);
    if (item.isDirectory()) walk(filename, visit);
    else if (item.isFile()) visit(filename);
    else throw Error('Unexpected linked source ' + filename);
  }
}
const packageRoot = path.join(task, 'package');
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot,'PATCH_MANIFEST.json'),'utf8'));
const overlays = JSON.parse(fs.readFileSync(path.join(root,'tools/release-20261107/overlay.json'),'utf8'));
const runtimeUpdates = [];
for (const overlay of overlays) {
  const record = manifest.files.find(item => item.path === overlay.path);
  assert(record && record.sha256 === overlay.sha);
  const source = path.join(packageRoot, record.path);
  assert.equal(sha(fs.readFileSync(source)), record.sha256);
  const runtimePath = record.path.slice(5);
  const repositoryPath = runtimePath === 'jack.qsp' ? 'assets/runtime/2.4.1/jack.qsp'
    : runtimePath.startsWith('json/') ? 'assets/' + runtimePath : 'resources/new/' + runtimePath;
  add(source, repositoryPath);
  runtimeUpdates.push({runtimePath, repositoryPath, bytes:record.bytes, sha256:record.sha256});
}

const releasePrefix = 'releases/2.4.1-update3-20261107/';
for (const name of ['PATCH_MANIFEST.json','INSTALL_HELPER.ps1','INSTALL.cmd','INSTALL_KO.txt','INSTALL_EN.txt',
  'RELEASE_NOTES_KO.html','RELEASE_NOTES_EN.html','release-notes-media/easy-mode-delivery.png',
  'release-notes-media/shiru-secretary.png','release-notes-media/pelageya-secretary.png']) {
  add(path.join(packageRoot, name), releasePrefix + name);
}
generate(releasePrefix + 'ARTIFACT.json', JSON.stringify({
  filename:'JO9_2.4.1_Patch_20261107_3차_r2.zip', bytes:246528794, sha256:zipHash,
  transfer:'User manually transferred the final ZIP. Verify this checksum on the distribution PC.',
  qspSha256:qspHash, patchRevision:manifest.patchRevision,
}, null, 2) + '\n');
generate(releasePrefix + 'ZIP.sha256.txt', zipHash + '  JO9_2.4.1_Patch_20261107_3차_r2.zip\n');

for (const directory of ['tools/agraba-special-food','tools/nymphomania-traits','tools/release-20261107',
  'records/release-20261107','records/auction-dialogue-20261106','records/library-categories-20261106']) {
  walk(path.join(root,directory), filename => {
    if (/\.(?:cjs|js|ps1|json|md|txt|html|png)$/.test(filename)) add(filename, path.relative(root,filename).replaceAll('\\','/'));
  });
}
for (const filename of fs.readdirSync(path.join(root,'mods'))) {
  if (/^2026-11-0[67]_.*\.json$/.test(filename)) add(path.join(root,'mods',filename),'mods/' + filename);
}
for (const filename of ['HOME_HANDOFF_UPDATE3_20261107.md','UPDATE_AUDIT_20261107_KO.md','EVENT_REBUILD_BACKLOG.md']) {
  add(path.join(root,'docs/modding',filename),'docs/modding/' + filename);
}
add(path.join(root,'tmp/open-modding-tools-20261106/catalog/catalog_status.js'),
  'tools/local-workspace/catalog-seed/catalog_status.js');
for (const filename of ['SUMMARY_KO.md','callback-results.json','client-results.json']) {
  add(path.join(root,'tmp/release-20261107/shiru-existing-qa',filename),
    'records/release-20261107/qa/shiru-existing/focused-' + filename);
}

const promotions = [
  ['tmp/nymphomania-traits-20261107/combined/patch.json', '2026-11-07_zzzzzzzzz_10_nymphomania_traits.json'],
  ['tmp/update-audit-20261107/shiru/mods/2026-11-07_zzzzzzzzz_shiru_black_market.json', '2026-11-07_zzzzzzzzz_20_shiru_black_market.json'],
  ['tmp/open-modding-tools-20261106/text-runtime/backups/2026-11-06T20-23-06-000Z_3c2016.json', '2026-11-07_zzzzzzzzz_30_fabrika_cut_conditions.json'],
  ['tmp/agraba-special-food-20261107/patch.json', '2026-11-07_zzzzzzzzz_40_agraba_special_food.json'],
];
for (const [source, filename] of promotions) {
  const raw = JSON.parse(fs.readFileSync(path.join(root,source),'utf8').replace(/^\uFEFF/,''));
  const mod = raw.mod || raw;
  let edits = mod.edits.filter(edit => edit.op !== 'append_location');
  if (filename.includes('_10_nymphomania_traits')) {
    // A short closing-END insertion is ambiguous for edit-level idempotence.
    // Use the exact before/after location bodies from this verified step.
    const before = core.parse(fs.readFileSync(path.join(root,'tmp/update-audit-20261107/jack.qsp')));
    const after = core.parse(fs.readFileSync(path.join(root,'tmp/nymphomania-traits-20261107/combined/jack.qsp')));
    assert.equal(before.hash, mod.before_sha256);
    assert.equal(after.hash, mod.after_sha256);
    const location = 'jo9_chaotic';
    const original = before.locations.find(item => item.name === location);
    const updated = after.locations.find(item => item.name === location);
    const replacement = {location,field:'body',count:1,
      old:core.shift(before.lines[original.body],5),new:core.shift(after.lines[updated.body],5)};
    edits = [replacement, ...edits.filter(edit => edit.location !== location)];
  }
  const additions = mod.edits.filter(edit => edit.op === 'append_location').map(edit => ({
    name:edit.location, desc:'', body:edit.body, actions:[],
  }));
  const normalized = {...mod, edits};
  if (additions.length) normalized.add_locations = additions;
  generate('mods/' + filename, JSON.stringify(normalized,null,2) + '\n');
}

const runtime = JSON.parse(git(['show',parent + ':assets/runtime-source-2.4.1.json']).toString().replace(/^\uFEFF/,''));
const updatedPaths = new Map(runtimeUpdates.map(item => [item.runtimePath,item]));
runtime.files = runtime.files.filter(item => !updatedPaths.has(item.runtimePath)).concat(runtimeUpdates)
  .sort((a,b) => a.runtimePath.localeCompare(b.runtimePath));
runtime.snapshotDate = '2026-11-07';
runtime.source = 'C:\\MOVE\\Jack O Nine Tails v2.4.1_Kor_Full\\game';
runtime.sourceQspSha256 = qspHash;
runtime.latestPatchRelease = {branch, parent, manifest:releasePrefix+'PATCH_MANIFEST.json',
  handoff:'docs/modding/HOME_HANDOFF_UPDATE3_20261107.md', artifact:releasePrefix+'ARTIFACT.json'};
generate('assets/runtime-source-2.4.1.json', JSON.stringify(runtime,null,2) + '\n');
generate('assets/runtime/2.4.1/README_KO.md',
  '# 2.4.1 3차 r2 실행 소스\n\n2026-11-07 플레이 폴더와 최종 ZIP의 QSP를 보관한다.\n\nSHA-256 `' + qspHash + '`.\n\nJSON은 assets/json, 변경 이미지는 resources/new에 있다. 전달 절차는 docs/modding/HOME_HANDOFF_UPDATE3_20261107.md를 따른다.\n');
const indexText = git(['show',parent+':docs/SESSION_HANDOFF_INDEX.md']).toString();
generate('docs/SESSION_HANDOFF_INDEX.md', indexText +
  '\n\n## 2026-11-07 2.4.1 3차 r2 배포 인계\n\n[다른 PC에서 이어받기](modding/HOME_HANDOFF_UPDATE3_20261107.md). 브랜치 `' +
  branch + '`, 최종 ZIP과 원장은 `releases/2.4.1-update3-20261107/` 안내를 따른다. 배포 ZIP은 사용자가 수동 전달했다.\n');
generate('.gitattributes', git(['show',parent+':.gitattributes']).toString() +
  '\n# Exact update 3 package documents and illustrated notes.\nreleases/2.4.1-update3-20261107/** -text\n');

const metadataEntries = [...entries.values()].filter(entry =>
  !entry.path.startsWith('assets/') && !entry.path.startsWith('resources/'));
const plan = {parent, branch, worktreeHead:git(['rev-parse','HEAD']).toString().trim(),
  sourcePayloadPolicy:'Runtime and game art use the manually transferred ZIP. Future large-file transfers use Google Drive.',
  qspSha256:qspHash, zipSha256:zipHash, entries:metadataEntries.sort((a,b)=>a.path.localeCompare(b.path))};
fs.mkdirSync(task, {recursive:true});
fs.writeFileSync(path.join(task,'commit-plan.json'), JSON.stringify(plan,null,2));
console.log(JSON.stringify({parent,branch,files:metadataEntries.length,
  bytes:metadataEntries.reduce((sum,entry)=>sum+entry.bytes,0),
  byTopLevel:metadataEntries.reduce((map,entry)=>(map[entry.path.split('/')[0]]=(map[entry.path.split('/')[0]]||0)+1,map),{})}, null,2));
