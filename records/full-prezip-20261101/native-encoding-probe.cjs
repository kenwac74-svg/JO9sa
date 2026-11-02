'use strict';
// Reads live/backup bytes. Writes only diagnostic output and its temporary fixture.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const C = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const W = 'G:/somi/Jack O Nine Tails v2.4_work/game', F = 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const R = 'G:/somi/JO9sa', T = 'G:/Codex/tmp/full-prezip-20261101-encoding-native';
const K = 'K:/doing/JO9_trash/full-prezip-20261101';
const mode = process.argv[2] || 'prepare', MARKER = 'JO9_QA_ENCODING20261101_templates_complete_COMPLETE';
const RUNNER = R + '/tools/qa/run-client-smoke.ps1';
const oldBuildPath = R + '/records/full-client-build-20261031/input-plan.json', oldBuild = JSON.parse(fs.readFileSync(oldBuildPath, 'utf8'));
const repairPath = __dirname + '/encoding-repair.json', repair = JSON.parse(fs.readFileSync(repairPath, 'utf8'));
const raw = fs.readFileSync(W + '/jack.qsp'), doc = C.parse(raw), engine = fs.readFileSync(W + '/engine/jack.exe');
assert.equal(doc.hash, 'a11ecde65897ab9c3d7bf736d0f539a35caa243c379e61a73ba6191241ef7755');
const desc = ['seed_world_description', 'seed_family_description', 'seed_occupation_description'];
const rows = [], objects = [], protectedInputs = [{ path: W + '/jack.qsp', sha256: doc.hash }];
for (let id = 3021; id <= 3026; id++) {
  const rel = 'game/json/slaves/' + id + '.json', oldW = fs.readFileSync(K + '/work-before-encoding/' + rel), oldF = fs.readFileSync(K + '/full-before-encoding/' + rel);
  const workPath = W + '/json/slaves/' + id + '.json', fullPath = F + '/json/slaves/' + id + '.json', now = fs.readFileSync(workPath), full = fs.readFileSync(fullPath);
  const originalPath = 'G:/somi/JO9O/' + rel, original = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
  const historical = oldBuild.files.find(x => x.path === rel), change = repair.files.find(x => x.path === rel);
  assert.equal(C.hash(oldW), historical.sha256); assert(oldW.equals(oldF)); assert(now.equals(full));
  let invalidBefore = false; try { new TextDecoder('utf-8', { fatal: true }).decode(oldW); } catch { invalidBefore = true; }
  assert(invalidBefore);
  const oldObject = JSON.parse(new TextDecoder('windows-1251', { fatal: true }).decode(oldW));
  const object = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(now));
  assert.deepEqual(object, oldObject);
  const pieces = []; for (const byte of oldW) pieces.push(byte === 0x92 ? Buffer.from([0xe2, 0x80, 0x99]) : Buffer.from([byte]));
  assert(Buffer.concat(pieces).equals(now));
  const affected = desc.filter(k => oldObject[k]?.includes('\u2019')).map(field => ({ field, count: (oldObject[field].match(/\u2019/g) || []).length, matchesJO9OAfterAsciiApostrophe: oldObject[field].replace(/\u2019/g, "'") === original[field] }));
  const high = [...new Set([...oldW].filter(b => b >= 128))]; assert.deepEqual(high, [0x92]);
  const count = affected.reduce((n, x) => n + x.count, 0); assert.equal(count, change.occurrences);
  rows.push({ id, relativePath: rel, oldBytes: oldW.length, newBytes: now.length, beforeSha256: C.hash(oldW), afterSha256: C.hash(now), fullEqualsWorkBefore: true, fullEqualsWorkAfter: true, oldBuildMatchesBefore: true,
    beforeEncoding: 'ASCII plus single-byte0x92 punctuation; Windows1251 and1252 map this byte toU+2019. The broader codepage is not uniquely determined.', strictUtf8Before: false, strictUtf8After: true, affectedFields: affected, totalReplacements: count,
    changesOnlyByte92ToUtf8CurlyApostrophe: true, parsedLogicalObjectUnchangedFromLegacyCodepage: true, oldWorkBackup: K + '/work-before-encoding/' + rel, oldFullBackup: K + '/full-before-encoding/' + rel });
  objects.push({ id, object }); protectedInputs.push({ path: workPath, sha256: C.hash(now) }, { path: fullPath, sha256: C.hash(full) });
}
const configPath = W + '/config.xml', config = fs.readFileSync(configPath), configText = config.subarray(2).toString('utf16le'), previousConfig = oldBuild.files.find(x => x.path === 'game/config.xml');
assert.equal(config.subarray(0, 2).toString('hex'), 'fffe'); assert.equal(C.hash(config), previousConfig.sha256); assert(config.equals(fs.readFileSync(F + '/config.xml')));
const configAudit = { path: configPath, sha256: C.hash(config), encoding: 'UTF-16LE with BOM', containsUnescapedAmpersand: /&(?!#\d+;|#x[\da-f]+;|amp;|lt;|gt;|quot;|apos;)/i.test(configText), matchesPriorFullBuildBytes: true, workEqualsFull: true, changed: false,
  classification: 'Pre-existing not-well-formed strictXML title attribute; existing native startup tolerates the shipped config. Leave unchanged for this build.', evidenceLimit: 'Parent reports mandatory9 startup/smoke and unrelated-working-directory launcher checks pass. This audit does not claim the exact title attribute was fully parsed or displayed.' };
protectedInputs.push({ path: configPath, sha256: C.hash(config) }, { path: F + '/config.xml', sha256: C.hash(config) });
const encodingAudit = { schema: 1, readOnlyInvestigator: true, qspSha256: doc.hash, rows, summary: { files: rows.length, affectedFields: rows.reduce((n, x) => n + x.affectedFields.length, 0), replacements: rows.reduce((n, x) => n + x.totalReplacements, 0), addedBytes: rows.reduce((n, x) => n + x.newBytes - x.oldBytes, 0) },
  provenance: { oldBuildPath, oldBuildCreated: oldBuild.created, repairPath, beforeBackupsVerified: true, tracked3026PriorSource: { path: R + '/assets/json/slaves/3026.json', exists: fs.existsSync(R + '/assets/json/slaves/3026.json'), sha256: fs.existsSync(R + '/assets/json/slaves/3026.json') ? C.hash(fs.readFileSync(R + '/assets/json/slaves/3026.json')) : null } },
  gameDecoder: { enginePath: W + '/engine/jack.exe', engineSha256: C.hash(engine), exportedLoader: '?loadJSONObjFromFile@Jack@@AAE?AVQJsonObject@@VQString@@@Z', loaderExportRva: 60112,
    relevantImportedApi: ['QJsonDocument::fromJson', 'QTextStream::setCodec', 'QTextStream::readAll', 'QTextCodec::codecForName', 'QString::fromUtf8'], encodingLiteral: 'UTF-8',
    interpretation: 'The installed binary contains an exported JSON-file loader and the listed Qt JSON/text APIs. Their presence is not a complete decoder control-flow proof. The bounded native probe attempts to verify actual corrected template reads; only a completed successful report establishes this.', sourceEquivalentToInstalledBinaryProven: false },
  issueClassification: 'Strict UTF8 input defect existed before this synchronization. A failure to load the entire character or exact pre-fix display corruption was not reproduced, so do not market this as a proven character-generation crash fix.',
  approvedMinimalHandling: 'Parent preserved both old sets and replaced only0x92 with UTF8 U+2019 in six files. This keeps every parsed number/key/path and legacy-codepage logical string unchanged. Do not replace entire files from JO9O, whose other legitimate attributes/scene fields differ.',
  investigatorProductionWrites: false, parentRepairSeparate: true, config: configAudit, nativeProbePending: true, prosePrinted: false };
fs.writeFileSync(__dirname + '/encoding-audit.json', JSON.stringify(encodingAudit, null, 2) + '\n');
const checks = [], boot = ['settimer 0', 'usehtml = 1'];
const quote = s => "'" + String(s).replaceAll("'", "''") + "'";
function check(expr, label) { checks.push(label); boot.push('if (' + expr + ") = 0: msg 'FAIL_ENCODING_" + checks.length + '_' + label + "' & exit"); }
for (const { id, object: j } of objects) {
  check('len($seed_name[' + id + ']) > 0', 'identity_present_' + id);
  check('$seed_name[' + id + '] = ' + quote(j.seed_name), 'identity_exact_' + id);
  for (const k of ['seed_age', 'seed_beauty', 'seed_stamina', 'seed_intellect', 'seed_callisthenics']) check(k + '[' + id + '] = ' + (j[k] || 0), 'numeric_' + id + '_' + k);
  for (const k of desc) {
    const v = j[k] || '', n = (v.match(/\u2019/g) || []).length, ref = '$' + k + '[' + id + ']';
    check('len(' + ref + ') = ' + v.length, 'description_length_' + id + '_' + k);
    check('instr(' + ref + ", '�') = 0", 'no_utf8_replacement_' + id + '_' + k);
    check('len(' + ref + ') - len(replace(' + ref + ", '’', '')) = " + n, 'curly_apostrophes_' + id + '_' + k);
  }
  for (const k of ['fullimage', 'seed_ava', 'seed_ava_gray', 'seed_ava_clear']) check('$' + k + '[' + id + '] = ' + quote(j[k] || ''), 'path_' + id + '_' + k);
}
boot.push("msg '" + MARKER + "'");
const fl = doc.lines.slice(0, 4); fl[3] = C.shift('2', -5);
// Normal Start clears variables. This second bounded fixture attempts to wait
// for native JSON initialization using the first timer callback.
fl.push(C.shift('Start', -5), '', C.shift("killall\r\nusehtml = 1\r\n$counter = 'CoreQAEncoding'\r\nsettimer 100", -5), C.shift('0', -5), C.shift('CoreQAEncoding', -5), '', C.shift(boot.join('\r\n'), -5), C.shift('0', -5), '');
const fixture = Buffer.from(fl.join('\r\n'), 'utf16le'); assert.equal(C.parse(fixture).locations.length, 2);
fs.mkdirSync(T, { recursive: true }); const link = T + '/json';
if (fs.existsSync(link)) assert.equal(fs.realpathSync(link).toLowerCase(), fs.realpathSync(W + '/json').toLowerCase()); else fs.symlinkSync(W + '/json', link, 'junction');
fs.writeFileSync(T + '/encoding.qsp', fixture); fs.copyFileSync(configPath, T + '/config.xml'); fs.writeFileSync(T + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(T + '/plan.json', JSON.stringify([{ name: 'encoding-templates', file: T + '/encoding.qsp', marker: MARKER, checkpoint: 'Native loader six corrected templates: identity, numeric/path preservation, description lengths, apostrophe counts and no U+FFFD; no narrative output' }], null, 2) + '\n');
if (mode === 'prepare') { console.log(JSON.stringify({ prepared: true, files: rows.length, checks: checks.length, qspSha256: doc.hash, diagnosticRoot: T })); process.exit(0); }
assert.equal(mode, 'run'); const start = Date.now();
const run = cp.spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', RUNNER, '-Engine', W + '/engine/jack.exe', '-Plan', T + '/plan.json', '-TimeoutSeconds', '20'], { windowsHide: true, encoding: 'utf8', timeout: 35000 });
const nativeResults = fs.existsSync(T + '/client-results.json') ? JSON.parse(fs.readFileSync(T + '/client-results.json', 'utf8').replace(/^\uFEFF/, '')) : [];
const log = fs.existsSync(T + '/encoding-templates-stderr.log') ? fs.readFileSync(T + '/encoding-templates-stderr.log', 'utf8') : '';
const changedInputs = protectedInputs.filter(x => C.hash(fs.readFileSync(x.path)) !== x.sha256);
const report = { pass: run.status === 0 && nativeResults.length === 1 && nativeResults.every(x => x.pass) && !changedInputs.length, qspSha256: doc.hash, fixtureSha256: C.hash(fixture), diagnosticRoot: T, sourceAssertions: checks.length, templates: rows.map(x => x.id), nativeResults, durationMs: Date.now() - start, runnerStatus: run.status,
  engineMessages: log.split(/\r?\n/).filter(x => /showMessage\(\)|FAIL_ENCODING|Error|error|Ошибка/.test(x)).slice(0, 20), protectedInputs, changedInputs, productionWrites: false, noNarrativeOrImagesRendered: true,
  limits: ['Reads the actual engine-loaded template arrays through a JSON-directory junction; does not generate/acquire full characters or load personal saves.', 'Original invalid bytes were audited from preserved backups, not executed as a pre-fix native reproduction.', 'The strictXML config issue remains unchanged and outside this template test.'] };
fs.writeFileSync(__dirname + '/native-encoding-report.json', JSON.stringify(report, null, 2) + '\n');
encodingAudit.nativeProbePending = false; encodingAudit.nativeProbeReport = 'native-encoding-report.json'; encodingAudit.nativeProbePass = report.pass;
fs.writeFileSync(__dirname + '/encoding-audit.json', JSON.stringify(encodingAudit, null, 2) + '\n');
console.log(JSON.stringify({ pass: report.pass, templates: rows.length, checks: checks.length, nativeResults, changedInputs: changedInputs.length, engineMessages: report.engineMessages })); assert(report.pass, 'Native template loader check failed; see native-encoding-report.json');
