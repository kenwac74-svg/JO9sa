'use strict';
// Creates isolated native diagnostics only; never launches an engine or modifies inputs.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const repo = 'G:/somi/JO9sa';
const game = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const tempRoot = 'G:/Codex/tmp/argon-selective-followup-20261021';
const core = require(repo + '/tools/text-workshop/core.cjs');
const qa = require(repo + '/tools/qa/release-check.cjs');
const codec = require(repo + '/tools/qa/save-codec.cjs');
const baselinePin = 'a2e0265881bebd8a72b3fcbb214ddaf831106cfe50e9c96da8e0b6e7d692707a';
const savePin = '3c9dc2bb01ac729d81aeea08cdc8cb09ef1f9606c116474948fd3e21c2178fc6';
const eol = '\r\n';
const quote = s => "'" + String(s).replaceAll("'", "''") + "'";
const join = rows => rows.flat(Infinity).join(eol);
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
function options(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 2) {
    assert(['--baseline', '--candidate', '--state-save', '--out', '--npc-spec', '--editorial-spec'].includes(argv[i]) && argv[i + 1], 'Use --baseline FILE --candidate FILE --state-save FILE --out DIR [--npc-spec FILE --editorial-spec FILE]');
    const key = argv[i].slice(2);
    assert(!o[key], 'Duplicate option: ' + key);
    o[key] = path.resolve(argv[i + 1]);
  }
  for (const key of ['baseline', 'candidate', 'state-save', 'out']) assert(o[key], 'Missing --' + key);
  o['npc-spec'] ||= path.join(__dirname, 'npc-format-candidates.json');
  o['editorial-spec'] ||= path.join(__dirname, 'editorial-candidates.json');
  return o;
}
function body(doc, name) {
  const loc = doc.locations.find(l => l.name === name);
  assert(loc, 'Missing location: ' + name);
  return core.shift(doc.lines[loc.body], 5);
}
function oneLiteralRhs(line, variable) {
  assert(!/[\r\n]/.test(line), 'Expected one physical assignment line: ' + variable);
  const s = line.trimStart();
  assert(s.startsWith(variable), 'Assignment ref mismatch: ' + variable);
  const m = s.slice(variable.length).match(/^\s*=\s*([\s\S]+)$/);
  assert(m, 'Missing assignment: ' + variable);
  const rhs = m[1].trimEnd(), literals = core.literals(rhs);
  assert(literals.length === 1 && literals[0].start === 1 && literals[0].end === rhs.length - 1, 'Expected one complete literal RHS: ' + variable);
  return {rhs, text: literals[0].text};
}
function bFontStack(text) {
  const stack = [];
  for (const match of text.matchAll(/<\/?(?:b|font)\b[^>]*>/gi)) {
    const tag = match[0], name = tag.match(/^<\/?(b|font)\b/i)[1].toLowerCase();
    if (tag.startsWith('</')) assert.equal(stack.pop(), name, 'Mismatched b/font closing tag');
    else stack.push(name);
  }
  assert.equal(stack.length, 0, 'Unclosed b/font tag');
}
function specs(file, expectedLocation, baselineDoc, candidateDoc) {
  const spec = readJson(file), rows = spec.candidates || spec.items;
  assert(Array.isArray(rows) && rows.length, 'Missing nonempty candidate rows: ' + file);
  const seen = new Set();
  return rows.map((row, index) => {
    const location = row.location || spec.location, variable = row.variable || row.key;
    assert.equal(location, expectedLocation, 'Unexpected focused location');
    assert(typeof variable === 'string' && /^\$[\p{L}_][\p{L}\p{N}_]*(?:\[[^\r\n]+\])?$/u.test(variable), 'Unsafe target ref');
    assert(!seen.has(variable.toLowerCase()), 'Duplicate target ref: ' + variable);
    seen.add(variable.toLowerCase());
    const oldLine = row.oldLine || row.old, newLine = row.newLine || row.new;
    const manual = row.kind === 'manual-placeholder';
    assert(newLine && (manual || oldLine) && oldLine !== newLine, 'Missing distinct assignment lines');
    if (oldLine) assert.equal(body(baselineDoc, location).split(oldLine).length - 1, 1, 'Baseline assignment not unique: ' + variable);
    else {
      assert(manual, 'Only an approved manual placeholder may omit source prose');
      const matches = body(baselineDoc, location).split(eol).filter(line => line.trimStart().startsWith(variable) && /^\s*=/.test(line.trimStart().slice(variable.length)));
      assert.equal(matches.length, 1, 'Baseline manual target not unique');
      const pin = row.originalAssignmentSha256 || row.originalLineSha256 || row.originalLineSHA256 || row.baselineAssignmentSha256;
      assert(pin && /^[a-f\d]{64}$/i.test(pin), 'Manual target requires its original assignment SHA256');
      assert.equal(core.hash(Buffer.from(matches[0], 'utf8')), pin.toLowerCase(), 'Original manual-target assignment drift');
    }
    assert.equal(body(candidateDoc, location).split(newLine).length - 1, 1, 'Candidate assignment not unique: ' + variable);
    const newValue = oneLiteralRhs(newLine, variable);
    if (!manual) {
      const oldValue = oneLiteralRhs(oldLine, variable);
      const interpolation = text => text.match(/<<[\s\S]*?>>/g) || [];
      assert.deepEqual(interpolation(oldValue.text), interpolation(newValue.text), 'Interpolation changed: ' + variable);
      if (expectedLocation === '#txt_man') assert.deepEqual(core.protectedParts(oldValue.text), core.protectedParts(newValue.text), 'Editorial protected token changed: ' + variable);
    }
    core.validateMarkup(newValue.text);
    if (row.kind === 'inline-tag') bFontStack(newValue.text);
    return {...row, id: row.id || 'ARGONSEL_TEXT_' + String(index + 1).padStart(3, '0'), location, variable, oldLine, newLine, rhs: newValue.rhs, literal: newValue.text};
  });
}
function assertCode(condition, failure) {
  return 'if (' + condition + ')=0: msg ' + quote(failure) + ' & exit';
}
function pureDependencies(rows) {
  const all = [...new Set(rows.flatMap(row => (row.literal.match(/<<[\s\S]*?>>/g) || []).map(s => s.slice(2, -2).trim())))];
  const pure = [], skipped = [];
  for (const expression of all) {
    // Snapshot simple value references. Expressions with function calls remain covered by exact token preservation.
    if (/^\$?[\p{L}_][\p{L}\p{N}_]*(?:\[(?:\d+|'(?:[^']|'')*'|"(?:[^"]|"")*"|\$?[\p{L}_][\p{L}\p{N}_]*)\])?$/u.test(expression)) pure.push(expression);
    else skipped.push(expression);
  }
  return {pure, skipped};
}
function main(o) {
  const rel = path.relative(path.resolve(tempRoot), o.out);
  assert(rel && rel !== '..' && !rel.startsWith('..' + path.sep) && !path.isAbsolute(rel), 'Output must be a child of the approved temporary root');
  qa.assertOutside(o.out, [path.dirname(o.baseline), path.dirname(o.candidate), game, path.dirname(o['state-save'])]);
  assert(!fs.existsSync(o.out) || fs.readdirSync(o.out).length === 0, 'Focused output must be absent or empty');
  const baselineRaw = fs.readFileSync(o.baseline), candidateRaw = fs.readFileSync(o.candidate), stateRaw = fs.readFileSync(o['state-save']);
  const inputHashes = {baseline: core.hash(baselineRaw), candidate: core.hash(candidateRaw), 'state-save': core.hash(stateRaw)};
  assert.equal(inputHashes.baseline, baselinePin, 'Baseline drift');
  assert.equal(inputHashes['state-save'], savePin, 'Representative save drift');
  qa.inspectWorld(baselineRaw); qa.inspectWorld(candidateRaw);
  const baselineDoc = core.parse(baselineRaw), candidateDoc = core.parse(candidateRaw), state = codec.parse(stateRaw);
  assert(codec.serialize(state).equals(stateRaw), 'Save byte roundtrip failed');
  for (const role of ['slave', 'assistant']) assert.equal(codec.value(state, role + '_state')[0], '1', 'Representative role missing: ' + role);
  const npc = specs(o['npc-spec'], '#npc_base', baselineDoc, candidateDoc);
  const editorial = specs(o['editorial-spec'], '#txt_man', baselineDoc, candidateDoc);
  assert.equal(npc.length, 6, 'Expected exactly six NPC assignments');
  const prime = qa.primeState(state);
  const safety = join(['killall', 'usehtml=1', 'settimer 0', prime.code, 'snk_room_target=0', 'hero_choice=0', "gs 'refresh_database'", "$onnewloc=''", "$ongload=''", 'autosave=0', 'decadesave=0', 'autosave_day=0', 'autosave_decade=0', 'sound_on=0']);
  const groups = [{name: 'npc', location: '#npc_base', rows: npc}, {name: 'editorial', location: '#txt_man', rows: editorial}];
  const plans = {baseline: [], candidate: []}, summaries = [];
  fs.mkdirSync(o.out, {recursive: true});
  fs.cpSync(path.join(game, 'json'), path.join(o.out, 'json'), {recursive: true});
  fs.copyFileSync(path.join(game, 'config.xml'), path.join(o.out, 'config.xml'));
  fs.writeFileSync(path.join(o.out, 'FastQSP.ini'), '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
  for (const mode of ['baseline', 'candidate']) for (const group of groups) {
    const name = mode + '-' + group.name, marker = 'JO9_QA_ARGONSELECTIVE21_' + name.replaceAll('-', '_') + '_COMPLETE';
    const dependencies = pureDependencies(group.rows);
    const stateFields = ['day', 'sparks', 'slave_state', 'assistant_state'];
    const code = [safety];
    for (const [i, ref] of stateFields.entries()) code.push('jo9_qa_preserved[' + i + ']=' + ref);
    for (const [i, expression] of dependencies.pure.entries()) code.push('$jo9_qa_dependency[' + i + ']=' + quote('<<' + expression + '>>'));
    code.push('gs ' + quote(group.location));
    for (const [i, row] of group.rows.entries()) code.push(assertCode(row.variable + ' = ' + row.rhs, 'JO9_QA_ARGONSEL_' + group.name.toUpperCase() + '_' + String(i + 1).padStart(3, '0')));
    for (const [i, ref] of stateFields.entries()) code.push(assertCode(ref + ' = jo9_qa_preserved[' + i + ']', 'JO9_QA_ARGONSEL_STATE_' + String(i + 1).padStart(3, '0')));
    for (const [i, expression] of dependencies.pure.entries()) code.push(assertCode('$jo9_qa_dependency[' + i + '] = ' + quote('<<' + expression + '>>'), 'JO9_QA_ARGONSEL_DEPENDENCY_' + String(i + 1).padStart(3, '0')));
    code.push('msg ' + quote(marker));
    const doc = core.parse(mode === 'baseline' ? baselineRaw : candidateRaw), start = doc.locations.find(l => l.name === 'Start');
    assert(start, 'Missing Start');
    doc.lines[start.body] = core.shift(join(code), -5);
    const raw = core.serialize(doc); qa.inspectWorld(raw);
    const file = path.join(o.out, name + '.qsp'); fs.writeFileSync(file, raw);
    plans[mode].push({name, file, marker, checkpoint: 'Actual refreshed ' + group.location + ' assignments; ' + mode});
    summaries.push({mode, name, assignmentChecks: group.rows.length, statePreservationChecks: stateFields.length, interpolationValueChecks: dependencies.pure.length, interpolationExpressionSnapshotsSkipped: dependencies.skipped, expectedFirstBaselineFailure: mode === 'baseline' ? 'JO9_QA_ARGONSEL_' + group.name.toUpperCase() + '_001' : null, sha256: core.hash(raw)});
  }
  for (const mode of ['baseline', 'candidate']) fs.writeFileSync(path.join(o.out, mode + '-plan.json'), JSON.stringify(plans[mode], null, 2) + '\n');
  for (const key of ['baseline', 'candidate', 'state-save']) assert.equal(core.hash(fs.readFileSync(o[key])), inputHashes[key], 'Input changed: ' + key);
  const manifest = {schema: 1, createdAt: new Date().toISOString(), inputHashes, cacheRevision: 2, heroChoiceFixture: 0, stateAssignments: prime.assignments, inputHashesUnchanged: true, engineInvoked: false, probes: summaries, executionOrder: ['baseline-plan.json: expected two assertion failures', 'candidate-plan.json: required two completion markers'], limits: ['Actual initializer values are checked, not a self-assigned temporary literal.', 'Baseline failure must match each expected first assertion message; arbitrary failure is not a successful negative control.', 'hero_choice=0 explicitly selects the male protagonist definitions; female protagonist paths are not tested.', 'Representative state is primed; native saved-game loading and visual layout are not tested.', 'Only simple interpolation references are value-snapshotted; every interpolation token is statically preserved exactly.', 'All fixtures contain save-derived state and must be removed after sanitized reports and reproduction script are retained.']};
  fs.writeFileSync(path.join(o.out, 'prepared.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({output: o.out, probes: summaries.length, npcAssignments: npc.length, editorialAssignments: editorial.length, inputHashes, engineInvoked: false}));
}
function verifyResults(out, mode) {
  assert(['baseline', 'candidate'].includes(mode), 'Unknown verification mode');
  const manifest = readJson(path.join(out, 'prepared.json'));
  const probes = manifest.probes.filter(p => p.mode === mode);
  const results = readJson(path.join(out, 'client-results.json'));
  assert.equal(probes.length, 2, 'Expected two prepared probes');
  assert.equal(results.length, probes.length, 'Missing or extra runner results');
  for (const probe of probes) {
    const result = results.find(r => r.name === probe.name);
    assert(result, 'Missing result: ' + probe.name);
    if (mode === 'candidate') assert.equal(result.pass, true, 'Candidate did not reach completion: ' + probe.name);
    else {
      assert.equal(result.pass, false, 'Baseline unexpectedly passed candidate expectations: ' + probe.name);
      assert.equal(result.reason, 'Unexpected message before completion', 'Wrong baseline failure type: ' + probe.name);
      const stderr = fs.readFileSync(path.join(out, probe.name + '-stderr.log'), 'utf8');
      const messages = [...stderr.matchAll(/^showMessage\(\), str:\s*"([^"\r\n]*)"\s*$/gm)].map(m => m[1]);
      assert.deepEqual(messages, [probe.expectedFirstBaselineFailure], 'Baseline did not fail at the intended first assertion: ' + probe.name);
    }
  }
  const summary = {mode, verified: true, expected: probes.length, completed: mode === 'candidate' ? results.length : 0, intendedNegativeControls: mode === 'baseline' ? results.length : 0, probes: results};
  fs.writeFileSync(path.join(out, mode + '-results.json'), JSON.stringify(summary, null, 2) + '\n');
  return summary;
}
if (require.main === module) {
  if (process.argv[2] === '--verify') {
    assert(process.argv.length === 6 && process.argv[4] === '--out', 'Use --verify baseline|candidate --out DIR');
    console.log(JSON.stringify(verifyResults(path.resolve(process.argv[5]), process.argv[3])));
  } else main(options(process.argv.slice(2)));
}
module.exports = {options, oneLiteralRhs, bFontStack, pureDependencies, verifyResults};
