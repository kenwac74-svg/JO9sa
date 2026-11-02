'use strict';
// Read-only resource audit. Do not add any copy/move/delete implementation here.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const C = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const W = 'G:/somi/Jack O Nine Tails v2.4_work/game', REPO = 'G:/somi/JO9sa', OUT = __dirname;
const invPath = OUT + '/inventory-work.json', invRaw = fs.readFileSync(invPath), inv = JSON.parse(invRaw);
const image = /\.(png|jpe?g|gif|webp|svg|bmp|ico|tiff?|avif)$/i;
const norm = s => { s = String(s).replace(/&amp;/gi, '&'); try { s = decodeURIComponent(s); } catch {} return s.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/+/g, '/').toLowerCase(); };
const raw = fs.readFileSync(W + '/jack.qsp'), doc = C.parse(raw), qspSha = doc.hash;
assert.equal(qspSha, 'a11ecde65897ab9c3d7bf736d0f539a35caa243c379e61a73ba6191241ef7755');
const all = inv.files.filter(x => norm(x.path).startsWith('game/')).map(x => ({ path: x.path.slice(5).replaceAll('\\', '/'), size: x.bytes, mtime_ns: x.mtime_ns }));
const pictures = all.filter(x => image.test(x.path));
const byPath = new Map(pictures.map(x => [norm(x.path), x]));
const refs = new Map(), stems = new Map(), protections = new Map(), dependencies = [], saves = [], errors = [], changed = [];
const dynamic = [], picMax = new Map(), bodies = new Map();
function cite(map, key, e) { key = norm(key); if (!map.has(key)) map.set(key, []); const a = map.get(key); if (a.length < 5 && !a.some(x => JSON.stringify(x) === JSON.stringify(e))) a.push(e); }
function protect(key, reason, source) { if (!key) return; key = norm(key); if (key.startsWith('pic/')) key = 'content/' + key; cite(protections, key, { reason, source }); }
function dep(rel, kind, data) { const b = data || fs.readFileSync(W + '/' + rel); dependencies.push({ path: rel, kind, bytes: b.length, sha256: C.hash(b) }); return b; }
function addPath(candidate, e) {
  let p = norm(candidate).replace(/[?#].*$/, '').replace(/\.$/, '');
  if (p.startsWith('pic/')) p = 'content/' + p;
  if (!p.startsWith('content/')) p = 'content/pic/' + p;
  if (p.includes('<<') || p.includes('>>') || p.includes('[') || p.includes(' + ')) return;
  if (byPath.has(p)) cite(refs, p, e);
  if (!image.test(p)) {
    cite(stems, p, e);
    for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']) if (byPath.has(p + ext)) cite(refs, p + ext, { ...e, resolution: 'renderer-appended-extension' });
  }
}
function scan(text, source, kind) {
  text = text.replace(/&quot;/gi, '"').replace(/&#39;|&#x27;/gi, "'");
  const full = /(?:content[\\/](?:pic|jo9o_original_cuts)[\\/]|pic[\\/])[^<>"'\r\n{}]*?\.(?:png|jpe?g|gif|webp|svg|bmp|ico|tiff?|avif)/gi;
  for (const m of text.matchAll(full)) addPath(m[0], { source, kind });
  const short = /(?:bg|scene|mob|characters|girls|ui(?: overhaul)?|buttons|demo|reserve|parts)[\\/][^<>"'\r\n{}]*?\.(?:png|jpe?g|gif|webp|svg|bmp|ico|tiff?|avif)/gi;
  for (const m of text.matchAll(short)) addPath(m[0], { source, kind, resolution: 'fixed-picture-prefix' });
  for (const m of text.matchAll(/picMax\s*\[\s*['"]([^'"\r\n]+)['"]/gi)) cite(picMax, m[1], { source, kind });
}
function literalPath(s, e) {
  s = s.trim();
  if (/^(?:content[\\/](?:pic|jo9o_original_cuts)[\\/]|pic[\\/]|bg[\\/]|scene[\\/]|mob[\\/]|characters[\\/]|girls[\\/]|ui[\\/]|buttons[\\/]|demo[\\/])[^<>\r\n]+$/i.test(s) && !s.includes('EXEC:')) addPath(s, e);
}
function stripComments(b) {
  const a = b.split('');
  for (const e of C.literals(b, true).filter(x => x.comment)) for (let i = Math.max(0, e.start - 1); i < Math.min(a.length, e.end + 1); i++) if (a[i] !== '\r' && a[i] !== '\n') a[i] = ' ';
  return a.join('');
}
dep('jack.qsp', 'runtime QSP', raw);
for (const loc of doc.locations) {
  const b = C.shift(doc.lines[loc.body], 5), active = stripComments(b); bodies.set(loc.name, active);
  scan(active, loc.name, 'active QSP body');
  for (const e of C.literals(active)) literalPath(e.text, { source: loc.name, kind: 'QSP literal', line: e.line });
  scan(C.shift(doc.lines[loc.desc], 5), loc.name, 'QSP description');
  const acts = Number(C.shift(doc.lines[loc.body + 1], 5));
  for (let i = 0; i < acts; i++) {
    scan(C.shift(doc.lines[loc.body + 2 + i * 3], 5), loc.name, 'QSP action image');
    scan(C.shift(doc.lines[loc.body + 4 + i * 3], 5), loc.name, 'QSP action body');
  }
  active.split(/\r?\n/).forEach((s, i) => {
    if (/display_pic|display_fullimage|picMax\s*\[|indpack_|_horny|_rebel|any_age|jo9_cut_choice|jo9_count/.test(s)) dynamic.push({ location: loc.name, line: i + 1, type: /display_fullimage|indpack_|_horny|_rebel/.test(s) ? 'outfit/state' : /display_pic|picMax/.test(s) ? 'indexed pool' : 'scene variants', text: s.trim().slice(0, 330) });
    const m = s.match(/\$bg\s*\[[^\]]+\]\s*=\s*['"]([^'"\r\n]+)['"]/i);
    if (m) addPath('bg/' + m[1], { source: loc.name, kind: 'place-background-array', line: i + 1 });
    const n = s.match(/\$npc_image\s*\[[^\]]+\]\s*=\s*['"]([^'"\r\n]+)['"]/i);
    if (n) addPath('characters/' + n[1], { source: loc.name, kind: 'NPC-image-array', line: i + 1 });
  });
}
for (const row of all) {
  const rel = row.path, low = norm(rel);
  if (!/^(?:css\/|content\/js\/|json\/)/.test(low) || !/\.(?:css|js|json|html?|xml|ini|txt)$/i.test(rel)) continue;
  try {
    const b = dep(rel, 'runtime data'), text = b[0] === 255 && b[1] === 254 ? b.subarray(2).toString('utf16le') : b.toString('utf8');
    scan(text, rel, 'runtime data');
    if (/\.json$/i.test(rel)) {
      const j = JSON.parse(text.replace(/^\uFEFF/, ''));
      const visit = (v, field) => { if (typeof v === 'string') literalPath(v, { source: rel, kind: 'JSON field', field }); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) visit(x, field ? field + '.' + k : k); };
      visit(j, '');
    }
    for (const m of text.matchAll(/url\(\s*['"]?([^\s)'"<>]+)['"]?\s*\)/gi)) {
      const candidate = norm(path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1])));
      if (byPath.has(candidate)) cite(refs, candidate, { source: rel, kind: 'relative CSS URL' });
    }
  } catch (e) { errors.push({ path: rel, error: e.message }); }
}
for (const rel of ['config.xml', 'FastQSP.ini', 'engine/FastQSP.ini']) if (fs.existsSync(W + '/' + rel)) {
  const b = dep(rel, 'runtime config'); scan(b.toString('utf8'), rel, 'runtime config');
}
dep('engine/jack.exe', 'installed engine identity');
const originalsPath = 'modtools/image-original-cuts.json', origRaw = dep(originalsPath, 'original B/C selection manifest'), originals = JSON.parse(origRaw);
const variantEntries = [...Object.values(originals.originals || {}), ...Object.values(originals.reservations || {})];
const originalTargets = [];
for (const e of variantEntries) {
  for (const k of ['base', 'alias']) if (e[k]) protect('content/pic/' + e[k], 'Original B/C selection alias; preserve saved cut numbering', originalsPath);
  if (e.target) { protect(e.target, 'Selected original B-cut physical target', originalsPath); originalTargets.push({ path: e.target, expectedSha256: e.sourceSha || null, exists: fs.existsSync(W + '/' + e.target) }); }
}
for (const m of bodies.get('interior_change').matchAll(/\$jo9_(?:base|path)\s*=\s*['"]([^'"]+)['"]/gi)) if (!m[1].includes('<<')) protect(m[1], 'Current interior_change exact A/B/C registry', 'interior_change');
const uiAliasPath = 'modtools/ui-resource-aliases.json', aliases = JSON.parse(dep(uiAliasPath, 'UI/save compatibility ledger'));
for (const e of aliases.aliases || []) for (const k of ['old', 'canonical']) protect(e[k], 'UI compatibility ledger address; duplicate bytes do not mean unused', uiAliasPath);
const compatibilityPath = REPO + '/assets/compatibility-aliases/2026-10-28_fullimage.json', compRaw = fs.readFileSync(compatibilityPath), comp = JSON.parse(compRaw);
for (const e of comp.files || []) for (const k of ['source', 'compatibility']) protect(e[k], 'Approved existing-save fullimage compatibility address', compatibilityPath);
const renameComp = REPO + '/records/full-client-build-20261031/resource-compatibility-additions.json';
if (fs.existsSync(renameComp)) { const j = JSON.parse(fs.readFileSync(renameComp)); const visit = v => { if (typeof v === 'string' && /^(?:content\/pic\/|game\/content\/pic\/)/i.test(norm(v))) protect(norm(v).replace(/^game\//, ''), 'Recorded runtime compatibility addition; re-evaluate before removing', renameComp); else if (v && typeof v === 'object') Object.values(v).forEach(visit); }; visit(j); }
const catalogPath = 'modtools/catalog/catalog_status.js', catalogRaw = dep(catalogPath, 'user catalogue decision ledger'), sandbox = { window: {} };
vm.runInNewContext(catalogRaw.toString('utf8'), sandbox, { timeout: 10000 });
const tags = sandbox.window.CATALOG_STATUS?.items || {};
const deleted = new Set(Object.entries(tags).filter(([, v]) => Array.isArray(v) && v.includes('delete')).map(([p]) => norm(p)));
const shiftPrefixes = ['content/pic', 'content\\pic', 'CONTENT/PIC', 'CONTENT\\PIC', 'content/jo9o_original_cuts', 'content\\jo9o_original_cuts'].map(s => Buffer.from(C.shift(s, -5), 'utf16le'));
for (const row of all.filter(x => /\.sav$/i.test(x.path))) {
  try {
    const b = fs.readFileSync(W + '/' + row.path); saves.push({ path: row.path, bytes: b.length, sha256: C.hash(b) });
    for (const needle of shiftPrefixes) { let at = 0; while ((at = b.indexOf(needle, at)) >= 0) { const end = Math.min(b.length - ((b.length - at) % 2), at + 1200); scan(C.shift(b.subarray(at, end).toString('utf16le'), 5), row.path, 'supported saved cached path'); at += needle.length; } }
  } catch (e) { errors.push({ path: row.path, error: e.message }); }
}
// Revalidate the small prior reviewed list, never inherit its old decision blindly.
const priorPath = REPO + '/records/full-client-preparation-20261029/prune-evidence.json', prior = JSON.parse(fs.readFileSync(priorPath));
const oldReviewed = new Map((prior.rows || []).map(x => [norm(x.path), x]));
const historical = [...oldReviewed.values()].map(x => ({ path: x.path, existsNow: byPath.has(norm(x.path)), priorSha256: x.sha256 }));
const activeBodies = [...bodies.values()].join('\n').toLowerCase();
const sourcePathSet = new Set(dependencies.map(x => x.path));
// A basename alone never establishes use. Require the exact directory/stem
// supplier as well as the active literal picMax key before protecting a pool.
for (const row of pictures) {
  const key = norm(row.path), stem = key.replace(/\.[^/.]+$/, '').replace(/_\d+$/, '').replace(/ \(\d+\)$/, '');
  const stemRefs = stems.get(stem), poolRefs = picMax.get(path.posix.basename(stem));
  if (stemRefs?.length && poolRefs?.length) protect(key, 'Exact directory/stem supplier plus active picMax pool key; retain every numbered member', stemRefs[0].source + ' / ' + poolRefs[0].source);
}
const ready = [], rows = [];
for (const row of pictures) {
  const key = norm(row.path), exact = refs.get(key) || [], protection = protections.get(key) || [];
  const creative = /^(?:content\/modworkpic\/|modtools\/|__jo9_imagebackups\/)/.test(key) || /\/__jo9_imagebackups\//.test(key);
  const pool = /^(?:content\/pic\/(?:girls|girl|jm|scene|mob|item|characters|bg|reserve|demo)\/)/.test(key);
  const stem = key.replace(/\.[^/.]+$/, ''), baseStem = stem.replace(/_\d+$/, '').replace(/ \(\d+\)$/, ''), stemEvidence = stems.get(stem) || stems.get(baseStem) || [];
  const candidate = oldReviewed.get(key);
  let status = protection.length || exact.length ? 'KEEP' : 'HOLD';
  let reason = protection.length ? 'Explicit variant/compatibility registry protects this exact address.' : exact.length ? 'Current runtime data or supported save refers to this exact normalized relative path.' : creative ? 'Authoring source/personal-tool resource: preserve working material and exclude from distribution.' : stemEvidence.length ? 'Current full-path stem supplier exists; dynamic suffix/selection family remains protected.' : pool ? 'Dynamic display/index/native-data supplier can address this runtime scope; exact nonuse not established.' : 'No direct reference found, but no complete five-proof nonuse decision exists.';
  const proof = { static: { passed: !exact.length, evidence: exact.length ? exact : [{ source: 'Current QSP bodies/descriptions/actions, runtime CSS/JS/JSON/config and exact-path index', note: 'No normalized exact path found; absence alone is not nonuse.' }] }, dynamic: { passed: false, evidence: protection.length ? protection : stemEvidence.length ? stemEvidence : [{ source: 'display_pic/display_fullimage/interior_change and dynamic-suppliers.json', note: pool ? 'This path lies within a dynamic or engine-indexed image scope.' : 'No file-specific supplier closure proven.' }] }, index: { passed: false, evidence: [{ source: 'picMax literal-key inventory and installed engine identity', note: pool ? 'Directory counts/sequence selection retained; no removal proof.' : 'Index independence not individually proven.' }] }, external: { passed: false, evidence: [{ source: '100-or-current supported WORK saves and compatibility/variant ledgers', note: 'Bounded encoded path scan performed; arbitrary historical callbacks and external saves are not exhaustively decoded.' }] }, intent: { passed: creative, evidence: [{ source: creative ? 'Current WORK authoring path and prior Full build exclusions' : catalogPath, note: creative ? 'Working original; preserve, distribution exclude; not trash.' : deleted.has(key) ? 'Delete marker is advisory until runtime use and replacement policy are reconciled.' : 'No per-file discard decision has been established.' }] } };
  if (candidate && !exact.length && !protection.length && !stemEvidence.length && !creative) {
    const token = key.includes('debug_legacy') ? 'debug_legacy' : key.includes('2.2 origin') ? '2.2 origin' : path.posix.basename(key).replace(/\.[^.]+$/, '');
    const tokenAbsent = !activeBodies.includes(token), outsideIndexedRoots = !pool;
    if (tokenAbsent && outsideIndexedRoots && errors.length === 0) {
      const b = fs.readFileSync(W + '/' + row.path), sha = C.hash(b);
      if (sha === candidate.sha256) {
        status = 'MOVE_READY'; reason = 'The previously reviewed non-runtime artifact is present unchanged and current exact/dynamic/index/compatibility checks remain discharged.';
        proof.dynamic = { passed: true, evidence: [{ source: priorPath, note: 'Same unchanged reviewed artifact; current QSP directory/basename supplier token absent.' }] };
        proof.index = { passed: true, evidence: [{ source: priorPath, note: 'Outside native indexed picture roots, and not a registered selection/alias.' }] };
        proof.external = { passed: true, evidence: [{ source: 'Current supported-save path scan and current compatibility manifests', note: 'No path references and no compatibility bindings for the reviewed non-runtime directory.' }] };
        proof.intent = { passed: true, evidence: [{ source: priorPath, note: 'Prior explicitly approved unused-artifact archive intent retained; original bytes to be preserved externally.' }] };
        ready.push({ path: row.path, size: row.size, sha256: sha, proofs: proof });
      }
    }
  }
  const compactProofs = Object.fromEntries(Object.entries(proof).map(([k, v]) => [k, { passed: v.passed, evidenceRef: k === 'static' ? (exact.length ? 'row.references' : 'P_STATIC_ABSENT') : k === 'dynamic' ? (protection.length ? 'row.protections' : stemEvidence.length ? 'P_FULLPATH_STEM' : pool ? 'P_DYNAMIC_POOL' : 'P_DYNAMIC_UNRESOLVED') : k === 'index' ? 'P_INDEX_UNPROVEN' : k === 'external' ? 'P_SUPPORTED_SAVE_SCOPE' : creative ? 'P_WORKING_PRESERVE' : deleted.has(key) ? 'P_DELETE_MARK_REVIEW' : 'P_INTENT_UNDECIDED' }]));
  rows.push({ path: row.path, size: row.size, status, distribution: creative ? (exact.length || protection.length ? 'RUNTIME_REF_IN_AUTHORING_PATH_REVIEW' : 'WORK_PRESERVE_DISTRIBUTION_EXCLUDE') : 'KEEP_UNLESS_SEPARATELY_REVIEWED', catalogDeleteMarked: deleted.has(key), reason, snapshotHash: C.hash(Buffer.from(JSON.stringify({ path: row.path, size: row.size, mtime_ns: row.mtime_ns }))), qspSha256: qspSha, references: exact, protections: protection, proofs: status === 'MOVE_READY' ? proof : compactProofs });
}
const creativeOther = all.filter(x => !image.test(x.path) && /^(?:content\/modworkpic\/|modtools\/|__jo9_imagebackups\/)/.test(norm(x.path))).map(x => ({ ...x, status: 'HOLD', distribution: 'WORK_PRESERVE_DISTRIBUTION_EXCLUDE', reason: 'Authoring source/archive/tool/settings preserved; not a game-unused trash decision.' }));
const byStatus = {}, bytesByStatus = {};
for (const r of rows) { byStatus[r.status] = (byStatus[r.status] || 0) + 1; bytesByStatus[r.status] = (bytesByStatus[r.status] || 0) + r.size; }
const sourceAfter = C.hash(fs.readFileSync(W + '/jack.qsp'));
for (const row of pictures) { try { const st = fs.statSync(W + '/' + row.path); if (st.size !== row.size || Math.abs(st.mtimeMs - row.mtime_ns / 1e6) > 2) changed.push({ path: row.path, reason: 'size or modification timestamp changed since root inventory' }); } catch (e) { changed.push({ path: row.path, reason: e.message }); } }
const snapshot = { inventoryPath: invPath, inventorySha256: C.hash(invRaw), inventoryGeneratedUtc: inv.generatedUtc, qspSha256: qspSha, sources: dependencies, saves, originalManifest: { originals: Object.keys(originals.originals || {}).length, reservations: Object.keys(originals.reservations || {}).length, physicalTargets: originalTargets }, compatibilityLedger: { path: compatibilityPath, sha256: C.hash(compRaw), entries: comp.files?.length || 0 }, metadataInventory: pictures };
const snapshotBytes = Buffer.from(JSON.stringify(snapshot, null, 2) + '\n'); fs.writeFileSync(OUT + '/unused-resource-snapshot.json', snapshotBytes);
fs.writeFileSync(OUT + '/dynamic-suppliers.json', JSON.stringify({ qspSha256: qspSha, supplierLines: dynamic, picMaxLiteralKeys: [...picMax].map(([key, evidence]) => ({ key, evidence })), protectionCount: protections.size, note: 'Supplier fragments are code/path metadata only. Basename collisions do not establish exact-path use.' }, null, 2) + '\n');
const questions = [
  'External personal saves and obsolete callbacks beyond the100-or-current WORK saves are not fully decoded. Any unmatched image remains HOLD.',
  'Native engine picMax directory-enumeration source is not proven identical to an available source checkout. Ambiguous indexed pools remain intact.',
  'Delete-marked files still used by the runtime need an approved replacement or code decision before exclusion.',
  'Unreferenced unique art may be active authoring work; preserve WORK/modworkpic and JO9resource rather than treating it as trash.'
];
const report = { schema: 1, readOnly: true, root: W, inventoryRoot: inv.root, scope: 'Every current WORK game image from root metadata inventory; non-image authoring material classified separately.', qspSha256: qspSha, qspAfterSha256: sourceAfter, qspLocations: doc.locations.length, sourceStable: sourceAfter === qspSha, snapshotPath: OUT + '/unused-resource-snapshot.json', snapshotSha256: C.hash(snapshotBytes), inventorySha256: C.hash(invRaw), summary: { images: rows.length, imageBytes: rows.reduce((n, r) => n + r.size, 0), statusCounts: byStatus, statusBytes: bytesByStatus, actualMoved: 0, actualMovedBytes: 0, sourceFilesScanned: dependencies.length, supportedSavesScanned: saves.length, supportedSaveBytes: saves.reduce((n, s) => n + s.bytes, 0), creativeNonImages: creativeOther.length, creativeNonImageBytes: creativeOther.reduce((n, s) => n + s.size, 0) }, rows, creativeOther, reviewedHistoricalCandidates: historical, catalogDeleteConflicts: rows.filter(r => r.catalogDeleteMarked && r.status === 'KEEP').map(r => ({ path: r.path, references: r.references, protections: r.protections })), originalTargetsMissing: originalTargets.filter(x => !x.exists), errors, inventoryChanges: changed, protectedExternalRoots: ['G:/somi/JO9O', 'G:/somi/JO9resource', 'C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/sources'], archiveProposalRoot: 'K:/doing/JO9_trash', relocationAuthorizedToParentOnly: true, pendingQuestions: questions, limits: ['No game window, image or narrative was rendered.', 'Current compiled QSP, CSS/JS/JSON/configs, path manifests and bounded shifted save paths were inspected. No QSP/JSON/CSS/resource was edited.', 'Image metadata SHA is not an image-content hash. MOVE_READY receives a separate exact image SHA.', 'Same basenames or byte duplicates in different folders are not a nonuse criterion.', 'All hidden/female/alternate-style executable branches are scanned; neither visibility nor current UI style is a removal criterion.', 'No ZIP, Full synchronization, rename, move or deletion was performed.'] };
report.proofDefinitions = {
  P_STATIC_ABSENT: { source: 'Current QSP bodies/descriptions/actions and runtime CSS/JS/JSON/config', detail: 'No normalized exact path found. This alone is not a nonuse decision.' },
  P_FULLPATH_STEM: { source: 'Current literal path-stem index', detail: 'An exact directory-and-stem supplier exists; dynamic suffix/family unresolved. No basename-only use assertion.' },
  P_DYNAMIC_POOL: { source: 'display_pic/display_fullimage/interior_change; dynamic-suppliers.json', detail: 'The runtime directory supports dynamic, actor-state, outfit, tag or indexed selection. Retain until file-specific supplier closure.' },
  P_DYNAMIC_UNRESOLVED: { source: 'Current active source scan and dynamic-suppliers.json', detail: 'No complete file-specific dynamic supplier closure has been established.' },
  P_INDEX_UNPROVEN: { source: 'Current picMax key inventory and installed engine hash', detail: 'Index/directory-count independence is unproven, so no pool members are removed.' },
  P_SUPPORTED_SAVE_SCOPE: { source: 'unused-resource-snapshot.json saves; current variant/UI/fullimage compatibility ledgers', detail: 'All current WORK SAV files were hashed and bounded shifted resource-path fragments scanned. Arbitrary historical callbacks/external saves remain a limitation.' },
  P_WORKING_PRESERVE: { source: 'WORK authoring paths and prior Full build exclusions', detail: 'Preserve original work, archives and tools; exclude from distribution. This is not a trash decision.' },
  P_DELETE_MARK_REVIEW: { source: catalogPath, detail: 'Delete marker alone does not prove nonuse or authorize removal of a runtime path.' },
  P_INTENT_UNDECIDED: { source: 'Current catalogue and source/work provenance', detail: 'No per-file discard intent established.' }
};
report.snapshotHashMeaning = 'Per-row snapshotHash is SHA256 of that inventory metadata record; global snapshotSha256 binds dependencies/save hashes; MOVE_READY adds exact image-content SHA256.';
report.authoringRuntimeConflicts = rows.filter(r => r.distribution === 'RUNTIME_REF_IN_AUTHORING_PATH_REVIEW').map(r => ({ path: r.path, references: r.references, protections: r.protections }));
// Keep the mandated per-file evidence compact; the small plan/summary is pretty printed.
fs.writeFileSync(OUT + '/unused-resource-audit.json', JSON.stringify(report) + '\n');
const plan = { readOnly: true, qspSha256: qspSha, snapshotSha256: report.snapshotSha256, sourceStable: report.sourceStable, archiveRoot: 'K:/doing/JO9_trash', actualMoved: 0, moveReady: ready, preservedWorkingMaterial: { images: rows.filter(r => r.distribution === 'WORK_PRESERVE_DISTRIBUTION_EXCLUDE').length, otherFiles: creativeOther.length, action: 'Preserve; exclude from distribution. Not automatic trash migration.' }, holdPolicy: 'Every HOLD and KEEP remains in place. Recheck snapshot/file SHA before the parent executes any authorized external archive plan.', errors, pendingQuestions: questions };
fs.writeFileSync(OUT + '/unused-resource-plan.json', JSON.stringify(plan, null, 2) + '\n');
console.log(JSON.stringify({ qspSha256: qspSha, sourceStable: report.sourceStable, summary: report.summary, ready: ready.length, historicalRemaining: historical.filter(x => x.existsNow).length, originalTargetsMissing: report.originalTargetsMissing.length, errors: errors.length, inventoryChanges: changed.length, output: OUT + '/unused-resource-audit.json' }));
