'use strict';
// Metadata-only candidate preparation. Never installs an HTML or writes game state.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const R = 'G:/somi/JO9sa';
const G = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const OUT = __dirname;
const core = require(R + '/tools/text-workshop/core.cjs');
const scenes = require(R + '/tools/text-workshop/scenes.cjs');
const expected = '5cbc0fbf858b8102bdc6afe8cdfeb2b07eacfe9329c3c5b1a7623c14ced4cf2e';
const priorExpected = 'c149e6b5728b3ec5ae4f5e508fa60b446bdca84644f3df9b84d70636672b19df';
const seedPriorExpected = '86ee16ad461540b4aca2e3c63a0b3806085cb93684ea72074cc16f2e4b7ba555';
const annotationAuthorityPath = R + '/records/arena-mercy-loss-rule-20261031/catalog/generation.json';
const annotationAuthority = JSON.parse(fs.readFileSync(annotationAuthorityPath, 'utf8')).importantConditions;
const baselinePath = 'G:/Codex/tmp/jo9-work-batch-20261105-recovery/work-before.qsp';
const read = p => fs.readFileSync(p);
const sha = p => core.hash(read(p));
const raw = read(G + '/jack.qsp');
assert.equal(core.hash(raw), expected, 'WORK drifted');
const priorRaw = read(baselinePath);
assert.equal(core.hash(priorRaw), priorExpected, 'prior baseline drifted');
const doc = core.parse(raw), priorDoc = core.parse(priorRaw);
assert.ok(core.serialize(doc).equals(raw));
assert.ok(core.serialize(priorDoc).equals(priorRaw));
const copyRoot = path.join(OUT, 'sourcecopy');
fs.mkdirSync(copyRoot, { recursive: true });
const sourceRecords = [];
for (const name of ['analyse.cjs', 'catalog-scene-conditions.js']) {
  const source = R + '/tools/scene-image-conditions/' + name;
  const target = path.join(copyRoot, name), bytes = read(source);
  fs.writeFileSync(target, bytes);
  assert.ok(read(target).equals(bytes));
  sourceRecords.push({ source, target, sha256: core.hash(bytes) });
}
const { build } = require(path.join(copyRoot, 'analyse.cjs'));
const htmlFiles = [G + '/modtools/catalog/catalog_merge_vs_original.html', R + '/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html'];
const protectedFiles = [G + '/jack.qsp', ...htmlFiles.flatMap(p => ['catalog_status.js', 'catalog_work_ids.json', 'catalog_work_codes.js'].map(n => path.join(path.dirname(p), n)))].map(p => ({ path: p, sha256: sha(p) }));
const blockRx = /<!-- JO9_SCENE_CONDITIONS_START -->[\s\S]*?<!-- JO9_SCENE_CONDITIONS_END -->/g;
const rowRx = /var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR/;
const snapshots = htmlFiles.map((file, index) => {
  const bytes = read(file), html = bytes.toString('utf8');
  assert.ok(Buffer.from(html, 'utf8').equals(bytes), 'source HTML UTF-8 round trip');
  const blocks = html.match(blockRx) || [];
  assert.equal(blocks.length, 1, 'one existing metadata block');
  const json = blocks[0].match(/window\.JO9_SCENE_CONDITIONS=([\s\S]*?);<\/script>/);
  assert.ok(json, 'existing metadata payload');
  const metadata = JSON.parse(json[1]);
  assert.ok([priorExpected, seedPriorExpected].includes(metadata.qspSha256), 'recognized prior metadata source: ' + file);
  assert.ok(html.match(rowRx), 'D rows');
  return { file, index, bytes, html, metadata, before: core.hash(bytes), block: blocks[0] };
});
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name), stat = fs.lstatSync(file);
    assert.ok(!stat.isSymbolicLink(), 'no link traversal ' + file);
    if (e.isDirectory()) out.push(...walk(file));
    else if (e.isFile()) out.push(file);
  }
  return out;
}
const inventory = walk(G + '/content/pic/scene').filter(p => /\.(png|gif|jpe?g|webp)$/i.test(p)).map(p => ({ path: path.relative(G, p).replaceAll('\\', '/'), bytes: fs.statSync(p).size, mtimeMs: fs.statSync(p).mtimeMs }));
const external = [], menuIds = {};
function inspect(x, source, key) {
  if (typeof x === 'string' && /^(?:content[\\/]pic[\\/])?scene[\\/]/i.test(x)) external.push({ source, path: /^content/i.test(x) ? x : 'content/pic/' + x, note: 'JSON 등록: ' + key + ' · 실제 소비 경로는 별도 확인이 필요합니다.' });
  else if (typeof x === 'number' && key) menuIds[key.split('.').at(-1)] = x;
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) inspect(v, source, key ? key + '.' + k : k);
}
for (const file of walk(G + '/json').filter(p => /\.json$/i.test(p))) inspect(JSON.parse(read(file).toString('utf8').replace(/^\uFEFF/, '')), path.relative(G, file).replaceAll('\\', '/'), '');
for (const file of walk(G + '/css').filter(p => /\.css$/i.test(p))) {
  const css = read(file).toString('utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/url\(['"]?(?:\.\.\/)?((?:content\/pic\/)?scene\/[^)'"\s]+)['"]?\)/gi)) external.push({ source: path.relative(G, file).replaceAll('\\', '/'), path: m[1].startsWith('content/') ? m[1] : 'content/pic/' + m[1], line: css.slice(0, m.index).split('\n').length, note: 'CSS 이미지 참조입니다. 해당 선택자의 화면 표시 조건은 별도 확인이 필요합니다.' });
}
const inputs = { core, scenes, files: inventory.map(x => x.path), menuIds, external };
const metadata = build({ doc, ...inputs });
const priorGenerated = build({ doc: priorDoc, ...inputs });
metadata.generatedAt = new Date().toISOString();
metadata.inventory = inventory;
function refKey(r) { return JSON.stringify([r.location, r.pathExpression, r.kind, r.parentPath || '', r.entry || null, r.slot || null, r.lhs || '', r.itemId || '', r.conditions || []]); }
function automaticSummary(e) {
  const live = e.references.filter(r => r.kind === 'direct');
  if (live.length) {
    const first = live[0], labels = [...new Set(live.flatMap(r => (r.menus || []).map(m => m.label)))];
    let text = first.itemId ? '아이템 설명: ' + (first.itemName || first.itemId) : labels.length ? '메뉴: ' + labels.slice(0, 3).join(' / ') : first.entry ? '이벤트: ' + first.entry.variable + ' = ' + first.entry.value : first.location + '에서 이미지 표시';
    if (first.slot) text += ' · 장면 ' + first.slot + '페이지';
    if (e.status === 'random') text += ' · 무작위 후보';
    if (e.status === 'dynamic') text += ' · 동적 조건 추가 확인';
    return text;
  }
  if (e.references.length) return e.status === 'alternate' ? '기본 컷이 표시될 때 이미지 전환으로 선택' : e.references[0].itemName ? '아이템 설명: ' + e.references[0].itemName : '코드/설정 등록은 확인됨 · 실제 호출 조건 추가 확인';
  if (e.alternates.length) return '추가 컷으로 등록됨 · 기본 컷의 실제 호출은 미확인';
  return '현재 WORK 소스에서 실행 연결을 확인하지 못했습니다.';
}
function automaticNote(text) {
  return !text || ['등록/정의부입니다. 실제 소비 경로는 별도 확인이 필요합니다.', '동적 파일명 패턴과 일치하는 후보입니다. 변수값과 실제 호출은 추가 확인이 필요합니다.', 'picMax와 난수로 번호를 붙이는 코드에 연결된 후보입니다.', '아이템 설명 화면이 이 이미지명표를 읽습니다. 실제 소지/구매 조건은 해당 메뉴에서 결정됩니다.', '이 기본 이미지가 표시될 때 좌상단 이미지 전환으로 선택하는 추가 컷입니다.', '외부 정의부에서 참조합니다. 실제 소비 경로는 추가 확인이 필요합니다.', 'CSS 이미지 참조입니다. 해당 선택자의 화면 표시 조건은 별도 확인이 필요합니다.'].includes(text) || text.startsWith('JSON 등록: ');
}
const annotationLog = [];
const manualSummaries = new Map(), manualNotes = new Map();
for (const snap of snapshots) for (const [image, old] of Object.entries(snap.metadata.entries)) {
  const generated = priorGenerated.entries[image];
  assert.ok(generated, 'prior metadata inventory entry ' + image);
  const authoredSummary = snap.metadata.qspSha256 === priorExpected ? old.summary !== generated.summary : old.summary !== automaticSummary(old);
  if (authoredSummary) {
    if (manualSummaries.has(image)) assert.equal(manualSummaries.get(image).text, old.summary, 'conflicting manual summaries');
    manualSummaries.set(image, { text: old.summary, old, generated, source: snap.file, priorRecordCorroborated: old.summary === annotationAuthority[image]?.summary });
  }
  for (const ref of old.references) {
    const matches = generated.references.filter(r => refKey(r) === refKey(ref));
    const authoredNote = snap.metadata.qspSha256 === priorExpected ? matches.length === 1 && (ref.note || '') !== (matches[0].note || '') : !automaticNote(ref.note || '');
    if (authoredNote) {
      assert.equal(matches.length, 1, 'unique prior annotation source ' + image + '/' + refKey(ref));
      const key = image + '\n' + refKey(ref);
      if (manualNotes.has(key)) assert.equal(manualNotes.get(key).ref.note, ref.note, 'conflicting manual notes');
      manualNotes.set(key, { image, ref, generated: matches[0], source: snap.file, priorRecordCorroborated: !!annotationAuthority[image]?.references.some(r => refKey(r) === refKey(ref) && r.note === ref.note) });
    }
  }
}
// The 11/04 automatic WORK refresh had already omitted the earlier verified
// 1294 page-copy annotations. Keep that authored information from its record,
// but only after the same fresh reference and actual copy line are rechecked.
for (const image of ['content/pic/scene/arena_victory_execute.png', 'content/pic/scene/arena_victory_spare.png']) {
  const authored = annotationAuthority[image], generated = priorGenerated.entries[image];
  assert.ok(authored && generated);
  if (!manualSummaries.has(image)) manualSummaries.set(image, { text: authored.summary, old: authored, generated, source: annotationAuthorityPath, priorRecordCorroborated: true, restoredFromRecord: true });
  for (const ref of authored.references.filter(r => r.entry?.value === '1294' && r.note)) {
    const matches = generated.references.filter(r => refKey(r) === refKey(ref));
    assert.equal(matches.length, 1, 'record annotation source identity');
    const key = image + '\n' + refKey(ref);
    if (!manualNotes.has(key)) manualNotes.set(key, { image, ref, generated: matches[0], source: annotationAuthorityPath, priorRecordCorroborated: true, restoredFromRecord: true });
  }
}
const body = (d, name) => core.shift(d.lines[d.locations.find(x => x.name === name).body], 5);
const cityRows = body(doc, 'interaction_city').split(/\r?\n/);
const exitRows = body(doc, 'выход_из_боя').split(/\r?\n/);
for (const [image, item] of manualSummaries) {
  const next = metadata.entries[image];
  assert.ok(next, 'manual summary target');
  assert.deepEqual(next.references.map(refKey).sort(), item.generated.references.map(refKey).sort(), 'manual summary source identities unchanged ' + image);
  next.summary = item.text;
  annotationLog.push({ image, field: 'summary', text: item.text, source: item.source, prior_record_corroborated: item.priorRecordCorroborated, restored_from_prior_record: !!item.restoredFromRecord, source_references_unchanged: true });
}
for (const { image, ref, generated, source, priorRecordCorroborated, restoredFromRecord } of manualNotes.values()) {
  const next = metadata.entries[image].references.filter(r => refKey(r) === refKey(ref));
  assert.equal(next.length, 1, 'manual note target');
  assert.deepEqual(next[0].conditions, generated.conditions, 'manual note conditions unchanged');
  let text = ref.note;
  if (text.includes('같은 그림을 $special_image_full[2]')) {
    assert.equal(next[0].location, 'interaction_city');
    assert.equal(next[0].entry?.value, '1294');
    assert.equal(cityRows[next[0].line].trim(), '$special_image_full[2] = $special_image_full[1]');
    text = text.replace(/interaction_city:\d+/, 'interaction_city:' + (next[0].line + 1));
  } else if (text.includes('이 생존 결과는 바로 앞의 평판·기존 판정에 대한 else 분기')) {
    const id = next[0].entry?.value;
    const line = exitRows.findIndex(s => new RegExp('^\\s*interaction_city\\s*=\\s*' + id + '\\s*$').test(s));
    assert.ok(line > 0);
    assert.equal(exitRows[line - 1].trim().toLowerCase(), 'else');
    const predicate = exitRows.slice(Math.max(0, line - 6), line).find(s => s.includes('jo9_cruel_mercy <= -5'));
    assert.ok(predicate);
    assert.ok(text.includes(predicate.trim()), 'manual else predicate still matches');
    text = text.replace(/выход_из_боя:\d+/, 'выход_из_боя:' + (line + 1));
  } else {
    // Unknown authored notes must remain backed by the identical source line.
    assert.equal(body(doc, ref.location).split(/\r?\n/)[next[0].line - 1], body(priorDoc, ref.location).split(/\r?\n/)[generated.line - 1], 'manual note source line unchanged');
    text = text.replaceAll(ref.location + ':' + ref.line, next[0].location + ':' + next[0].line);
  }
  next[0].note = text;
  annotationLog.push({ image, field: 'reference.note', identity: refKey(ref), source, prior_record_corroborated: priorRecordCorroborated, restored_from_prior_record: !!restoredFromRecord, before_line: ref.line, after_line: next[0].line, before_text: ref.note, text, conditions_unchanged: true });
}
const ui = read(path.join(copyRoot, 'catalog-scene-conditions.js')).toString('utf8');
const block = '<!-- JO9_SCENE_CONDITIONS_START -->\n<script>window.JO9_SCENE_CONDITIONS=' + JSON.stringify(metadata).replaceAll('<', '\\u003c') + ';</script>\n<script>\n' + ui + '\n</script>\n<!-- JO9_SCENE_CONDITIONS_END -->';
function checkScripts(html, label) {
  let count = 0;
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) if (!/\bsrc\s*=/.test(m[1])) {
    new Function(m[2]); // Parser only: do not evaluate document code.
    count++;
  }
  assert.ok(count > 0, label + ' inline scripts');
  return count;
}
function injected(html) {
  const cfg = JSON.stringify({ url: 'http://127.0.0.1:3813/', token: 'JO9_METADATA_PARSE_FIXTURE', originalCuts: {}, originalReservations: {} }).replaceAll('<', '\\u003c');
  html = html.replace(/<script src="catalog_workshop_config.js"><\/script>/, '');
  html = html.replace(/<head(?:\s[^>]*)?>/i, head => head + '<script>window.JO9_CATALOG_BRIDGE=' + cfg + ';</script>');
  // Exact first-closing-body operation used by the current /catalog server.
  return html.replace(/<\/body>/i, '<script src="catalog_grok.js"></script><script src="catalog_cuts.js"></script><script src="catalog-cut-conditions.js"></script></body>');
}
const candidates = snapshots.map(snap => {
  const html = snap.html.replace(blockRx, () => block);
  assert.equal(html.replace(blockRx, '__CONDITIONS__'), snap.html.replace(blockRx, '__CONDITIONS__'), 'outside block byte text identical');
  assert.equal(html.match(rowRx)[1], snap.html.match(rowRx)[1], 'D row literal byte text identical');
  assert.equal((html.match(/<\/body>/gi) || []).length, 1, 'one literal closing body; no script-string injection target');
  const beforeScripts = checkScripts(snap.html, 'snapshot');
  const scripts = checkScripts(html, 'candidate');
  assert.equal(scripts, beforeScripts, 'same inline script count');
  const served = injected(html);
  assert.ok(served.includes('<script src="catalog-cut-conditions.js"></script></body>'), 'server injects at body end');
  assert.equal((served.match(/<\/body>/gi) || []).length, 1);
  const servedScripts = checkScripts(served, 'server injected');
  assert.equal(servedScripts, scripts + 1, 'bridge adds one inline script');
  const file = path.join(OUT, 'conditions-only-catalog-' + snap.index + '.html');
  fs.writeFileSync(file, html, 'utf8');
  assert.equal(core.hash(read(file)), core.hash(Buffer.from(html)), 'candidate written');
  return { target: snap.file, candidate: file, before_sha256: snap.before, after_sha256: core.hash(Buffer.from(html)), previous_metadata_qsp: snap.metadata.qspSha256, outside_block_sha256: core.hash(Buffer.from(snap.html.replace(blockRx, '__CONDITIONS__'))), outside_block_identical: true, d_rows_literal_identical: true, rows: JSON.parse(html.match(rowRx)[1]).length, inline_scripts: scripts, server_injected_inline_scripts: servedScripts, closing_body_count: 1, installed: false };
});
fs.writeFileSync(path.join(OUT, 'condition-block.html'), block, 'utf8');
fs.writeFileSync(path.join(OUT, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(OUT, 'manual-annotations.json'), JSON.stringify(annotationLog, null, 2) + '\n', 'utf8');
for (const p of protectedFiles) assert.equal(sha(p.path), p.sha256, 'protected unchanged ' + p.path);
const report = {
  status: 'PREPARED_STATIC_PASS', installed: false, qsp_sha256: metadata.qspSha256, old_qsp_sha256: priorExpected,
  counts: metadata.counts, total: metadata.total, unresolved: metadata.unresolved.length,
  block: path.join(OUT, 'condition-block.html'), block_sha256: sha(path.join(OUT, 'condition-block.html')),
  manual_summaries_preserved: manualSummaries.size, manual_reference_notes_preserved: manualNotes.size,
  annotations_restored_from_prior_record: annotationLog.filter(x => x.restored_from_prior_record).length,
  annotation_authority: { path: annotationAuthorityPath, sha256: sha(annotationAuthorityPath) },
  annotation_log: path.join(OUT, 'manual-annotations.json'), candidates, protected_files: protectedFiles, source_copy: sourceRecords,
  invariants: ['Only isolated outputs were written.', 'Each HTML candidate differs from its exact source snapshot only in JO9_SCENE_CONDITIONS.', 'D rows, checklist state/tags, stable IDs, QSP/image condition rules, and all other HTML were not written.', 'WORK authored annotations were detected against a fresh analysis of its exact prior QSP. Older seed authored summaries were distinguished from the automatic summary formula using their own stored references; authored notes were distinguished from fixed automatic-note texts. All retained annotations were checked against current reference identities, conditions, and source lines.', 'Two 1294 summaries and two copy-line notes omitted by earlier automatic refreshes were recovered from the prior recorded manual annotations after checking the current actual copy assignments.', 'All inline scripts parse with new Function before and after first-closing-body bridge injection.'],
  installation_note: 'Parent must merge condition-block.html into the latest HTML using the one-block guard; do not adopt either full HTML candidate because the girls block may change concurrently.',
  limits: ['Static QSP/JSON/CSS source analysis; no scene playthrough or GUI appearance verification.', 'Closing-body verification reproduces bridge placement and parses scripts; external browser modules were not executed.'],
};
fs.writeFileSync(path.join(OUT, 'verification.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ status: report.status, installed: false, qsp: metadata.qspSha256, total: metadata.total, counts: metadata.counts, unresolved: metadata.unresolved.length, manualSummaries: manualSummaries.size, manualNotes: manualNotes.size, candidates: candidates.map(c => ({ target: c.target, rows: c.rows, outsideIdentical: true, inlineScripts: c.inline_scripts, serverInjectedScripts: c.server_injected_inline_scripts })) }));
