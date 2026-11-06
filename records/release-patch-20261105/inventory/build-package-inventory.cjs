'use strict';
// Read-only source inventory; only adjacent inventory JSON outputs are written.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const game = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const repo = 'G:/somi/JO9sa';
const previous = path.resolve(__dirname, '../../patch-composition-report-20261105');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const baselinePath = repo + '/records/distribution-cleanup-20261102/BUILD_MANIFEST.json';
const baseline = read(baselinePath);
const baselineMap = new Map(baseline.files.filter(x => x.path.startsWith('game/')).map(x => [x.path.slice(5).toLowerCase(), { ...x, runtimePath: x.path.slice(5) }]));
const oldAudit = read(previous + '/image-delta.json');
const union = read(previous + '/image-required-keep-union.json');
const expectedRuntime = read(previous + '/runtime-file-delta.json');
const jsonDelta = read(previous + '/json-release-delta.json');
const felicity = read(repo + '/records/felicity-size-match-20261105/applied.json');
const imagePaths = new Set(union.requiredImagePayloadPaths);
for (const f of felicity.files) imagePaths.add(f.runtimePath);
const rootWorkCandidates = new Set(oldAudit.addedOrChanged.filter(x => x.path.startsWith('content/pic/girls/') && !x.path.slice('content/pic/girls/'.length).includes('/')).map(x => x.path));
const imageExt = /\.(png|jpe?g|gif|webp|bmp|tiff?|svg|ico|avif|apng)$/i;
const errors = [], unstable = [], skippedLinks = [], metadataImageCandidates = [], inspectedNonImages = [], missingBaselineNonImages = [], excludedSettingsDifferences = [];
const imageMetadataAtStart = new Map();
const stat = p => { const s = fs.statSync(game + '/' + p); return { bytes: s.size, mtimeMs: s.mtimeMs }; };
function enumerate(rel, consumer, skip) {
  if (!fs.existsSync(game + '/' + rel)) return;
  for (const d of fs.readdirSync(game + '/' + rel, { withFileTypes: true })) {
    const p = rel + '/' + d.name;
    if (d.isSymbolicLink()) { skippedLinks.push(p); continue; }
    if (skip(p, d)) continue;
    if (d.isDirectory()) enumerate(p, consumer, skip);
    else if (d.isFile()) consumer(p);
  }
}
enumerate('content/pic', p => {
  if (!imageExt.test(p)) return;
  const s = stat(p); imageMetadataAtStart.set(p, s);
  if (rootWorkCandidates.has(p)) return;
  const b = baselineMap.get(p.toLowerCase());
  if (!imagePaths.has(p) && (!b || b.bytes !== s.bytes || s.mtimeMs > Date.parse(oldAudit.finishedAt))) metadataImageCandidates.push(p);
}, p => p.split('/').some(x => x.toLowerCase() === '__jo9_imagebackups'));
const nonImagePaths = [];
for (const dir of ['content', 'css', 'engine', 'fonts', 'json']) enumerate(dir, p => nonImagePaths.push(p), p => p === 'content/pic' || p === 'content/modworkpic' || /(?:\.bak(?:_|$)|\.tmp$|\.log$)/i.test(p));
for (const d of fs.readdirSync(game, { withFileTypes: true })) if (d.isFile() && (baselineMap.has(d.name.toLowerCase()) || d.name === 'jack.qsp')) nonImagePaths.push(d.name);
const seenNonImage = new Set(nonImagePaths.map(x => x.toLowerCase()));
for (const b of baselineMap.values()) if (!b.runtimePath.startsWith('content/pic/') && !seenNonImage.has(b.runtimePath.toLowerCase())) missingBaselineNonImages.push(b.runtimePath);
const jobs = [...imagePaths].map(p => ({ path: p, role: 'image' }));
for (const p of metadataImageCandidates) jobs.push({ path: p, role: 'possible-extra-image' });
for (const p of nonImagePaths) jobs.push({ path: p, role: 'other-runtime' });
const payload = [], currentHashes = new Map();
let next = 0, done = 0;
const startedAt = new Date().toISOString();
function sha(p) { return new Promise((resolve, reject) => { const h = crypto.createHash('sha256'), s = fs.createReadStream(p, { highWaterMark: 1024 * 1024 }); s.on('data', b => h.update(b)); s.on('error', reject); s.on('end', () => resolve(h.digest('hex'))); }); }
async function worker() {
  for (;;) {
    const i = next++; if (i >= jobs.length) return;
    const j = jobs[i];
    try {
      const a = stat(j.path), digest = await sha(game + '/' + j.path), z = stat(j.path);
      if (a.bytes !== z.bytes || a.mtimeMs !== z.mtimeMs) unstable.push(j.path);
      currentHashes.set(j.path.toLowerCase(), digest);
      const b = baselineMap.get(j.path.toLowerCase()), changed = !b || b.sha256 !== digest;
      const row = { path: 'game/' + j.path, runtimePath: j.path, sourceAbsolutePath: game + '/' + j.path, bytes: z.bytes, sha256: digest, mtimeMs: z.mtimeMs,
        baselineSha256: b?.sha256 ?? null, baselineBytes: b?.bytes ?? null, status: !b ? 'added' : changed ? 'changed' : 'unchanged-required',
        kind: j.role === 'image' || j.role === 'possible-extra-image' ? 'image' : j.path.endsWith('.json') && j.path.startsWith('json/') ? 'json' : j.path === 'jack.qsp' ? 'qsp' : 'other-runtime' };
      if (j.role === 'image') payload.push(row);
      else if (j.role === 'possible-extra-image') { if (changed) payload.push({ ...row, newlyDiscoveredAfterPriorAudit: true }); }
      else {
        inspectedNonImages.push({ path: j.path, bytes: z.bytes, sha256: digest, changed });
        if (changed && /(?:^|\/)(?:FastQSP\.ini|config\.xml)$/i.test(j.path)) excludedSettingsDifferences.push(row);
        else if (changed) payload.push(row);
      }
      done++;
    } catch (e) { errors.push({ path: j.path, error: String(e) }); }
  }
}
Promise.all(Array.from({ length: 8 }, worker)).then(() => {
  for (const f of payload) { const s = stat(f.runtimePath); if (s.bytes !== f.bytes || s.mtimeMs !== f.mtimeMs) unstable.push(f.runtimePath); }
  payload.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const actualJsonPaths = payload.filter(x => x.kind === 'json').map(x => x.runtimePath);
  const expectedJsonPaths = expectedRuntime.jsonChanges.map(x => x.path);
  const actualJsonSet = new Set(actualJsonPaths), expectedJsonSet = new Set(expectedJsonPaths);
  const expectedJsonMismatch = { missing: expectedJsonPaths.filter(x => !actualJsonSet.has(x)), unexpected: actualJsonPaths.filter(x => !expectedJsonSet.has(x)) };
  const jsonPriorRecordHashMismatches = jsonDelta.files.filter(x => currentHashes.get(x.path.toLowerCase()) !== x.after).map(x => x.path);
  const felicityHashMismatches = felicity.files.filter(x => currentHashes.get(x.runtimePath.toLowerCase()) !== x.after).map(x => x.runtimePath);
  const missingDefaultImages = [], missingPortraits = [], duplicateIds = [], jsonErrors = [], idMap = new Map();
  let playableDefinitions = 0;
  for (const name of fs.readdirSync(game + '/json/slaves').filter(x => x.endsWith('.json'))) {
    try {
      const bytes = fs.readFileSync(game + '/json/slaves/' + name), obj = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, ''));
      const id = Number(name.match(/^\d+/)?.[0]); if (idMap.has(id)) duplicateIds.push({ id, first: idMap.get(id), second: name }); else idMap.set(id, name);
      if (name === '0_template.json') continue; playableDefinitions++;
      for (const field of ['fullimage', 'indpack_title', 'seed_ava', 'seed_ava_gray', 'seed_ava_clear']) {
        if (!obj[field] || typeof obj[field] !== 'string') continue;
        let ref = obj[field].replaceAll('\\', '/'); if (!ref.startsWith('content/pic/')) ref = 'content/pic/' + ref; if (!/\.(png|jpe?g|gif|webp)$/i.test(ref)) ref += '.png';
        if (!fs.existsSync(game + '/' + ref)) (field.startsWith('seed_ava') ? missingPortraits : missingDefaultImages).push({ json: 'json/slaves/' + name, field, path: ref });
      }
    } catch (e) { jsonErrors.push({ file: name, error: String(e) }); }
  }
  const cleanupFiles = jsonDelta.renamed.map(x => {
    const old = baselineMap.get(x.old.toLowerCase()), target = payload.find(f => f.runtimePath === x.current);
    if (!old || !target) errors.push({ path: x.old, error: 'Missing release hash or replacement payload for JSON cleanup' });
    return { path: 'game/' + x.old, runtimePath: x.old, characterId: x.id, expectedReleasedSha256: old?.sha256 ?? null, replacementPath: 'game/' + x.current,
      replacementRuntimePath: x.current, replacementSha256: target?.sha256 ?? null, oldNameAbsentInCurrentWork: !fs.existsSync(game + '/' + x.old),
      policy: 'Retire this exact old filename only after replacement verification; if its existing hash differs from expectedReleasedSha256, preserve it and report for review.' };
  });
  const counts = {};
  for (const f of payload) { const c = counts[f.kind] ||= { files: 0, bytes: 0, added: 0, changed: 0, unchangedRequired: 0 }; c.files++; c.bytes += f.bytes; if (f.status === 'unchanged-required') c.unchangedRequired++; else c[f.status]++; }
  const duplicatePackagePaths = payload.filter((f, i) => payload.findIndex(x => x.path.toLowerCase() === f.path.toLowerCase()) !== i).map(x => x.path);
  const stateChanges = [...new Set(unstable)];
  const issues = errors.length + stateChanges.length + expectedJsonMismatch.missing.length + expectedJsonMismatch.unexpected.length + jsonPriorRecordHashMismatches.length + felicityHashMismatches.length + missingDefaultImages.length + missingPortraits.length + duplicateIds.length + jsonErrors.length + duplicatePackagePaths.length;
  const report = { schema: 1, status: issues ? 'REVIEW_REQUIRED' : 'PASS', startedAt, finishedAt: new Date().toISOString(), gameRoot: game, baselinePath, baselineVersion: baseline.version, baselineQspSha256: baseline.qspSha256,
    baselinePolicy: 'ReleasedNov2 BUILD_MANIFEST only. HistoricalFull-only9 absentWORK paths are not patch deletions.',
    summary: { packageRuntimeFiles: payload.length, packageRuntimeBytes: payload.reduce((n, x) => n + x.bytes, 0), counts, uniqueImagePayloads: new Set(payload.filter(x => x.kind === 'image').map(x => x.sha256)).size, legacyJsonCleanupPaths: cleanupFiles.length,
      priorRequiredImagePaths: union.requiredImagePayloadPaths.length, latestFelicityPaths: felicity.files.length, currentImagePathsRehashed: payload.filter(x => x.kind === 'image').length, otherRuntimeFilesHashed: inspectedNonImages.length, possibleExtraImageCandidatesRehashed: metadataImageCandidates.length, playableDefinitions },
    expectedJsonMismatch, jsonPriorRecordHashMismatches, felicityHashMismatches, missingDefaultImages, missingPortraits, duplicateIds, jsonErrors, duplicatePackagePaths,
    metadataGuard: { allPicImageMetadataRows: imageMetadataAtStart.size, priorFullImageAudit: previous + '/image-delta.json', priorFullImageAuditFinishedAt: oldAudit.finishedAt, extraCandidates: metadataImageCandidates, skippedLinks, unstableFiles: stateChanges },
    otherRuntimeChanged: payload.filter(x => x.kind === 'other-runtime'), excludedSettingsDifferences, missingBaselineNonImages,
    excluded: { rootFelicityWorkingImages: [...rootWorkCandidates], workDirectories: ['content/pic/__JO9_ImageBackups', 'content/modworkpic', 'modtools', 'mods', 'save'], backupsAndLogs: true, rootDevelopmentCopiesAndArchives: true },
    verifiedPackageSourceHashes: true, writesLimitedToInventoryDirectory: true, workModified: false, repositoryModified: false, fullReadOrModified: false, errors };
  const manifest = { schema: 1, baselineVersion: baseline.version, baselineQspSha256: baseline.qspSha256, sourceGameRoot: game, createdAt: report.finishedAt,
    description: 'CurrentWORK changed runtime files plus mandatory compatibility KEEP image addresses. Package paths are relative to the install root and retain game/.', files: payload };
  fs.writeFileSync(path.join(__dirname, 'package-runtime.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, 'cleanup-legacy-json.json'), JSON.stringify({ schema: 1, baselineVersion: baseline.version, policy: 'Conditional retirement of25 old JSON filenames; never delete modified user files automatically.', files: cleanupFiles }, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify({ status: report.status, summary: report.summary, expectedJsonMismatch, jsonPriorRecordHashMismatches, felicityHashMismatches, missingDefaultImages, missingPortraits, duplicateIds, jsonErrors, otherRuntimeChanged: report.otherRuntimeChanged, excludedSettingsDifferences, missingBaselineNonImages, unstableFiles: stateChanges, errors }, null, 2));
}).catch(e => { console.error(e); process.exitCode = 1; });
