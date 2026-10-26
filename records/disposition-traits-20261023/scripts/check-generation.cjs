'use strict';
// Prepare one native-engine probe from the exact input jo9_traits location.
// Usage: node check-generation.cjs INPUT.qsp FRESH_OUTPUT_DIRECTORY
// This prepares diagnostics only. Run the emitted plan with run-client-smoke.ps1.
const fs = require('node:fs');
const path = require('node:path');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa = require('G:/somi/JO9sa/tools/qa/release-check.cjs');

function exactlyOne(values, label) {
  if (values.length !== 1) throw Error(label + ': expected one match, found ' + values.length);
  return values[0];
}

function instrumentDisposition(original) {
  const generate = exactlyOne([...original.matchAll(/^if\s+\$args\[0\]\s*=\s*'generate'\s*:\s*$/gm)], 'generate branch');
  const edit = exactlyOne([...original.matchAll(/^if\s+\$args\[0\]\s*=\s*'edit'\s*:\s*$/gm)], 'edit branch');
  if (edit.index <= generate.index) throw Error('Unexpected generation/edit branch order');
  const block = original.slice(generate.index, edit.index);
  const lines = block.split('\r\n');
  const rand = /\brand\s*\(\s*1\s*,\s*100\s*\)/i;
  const markerLines = lines.map((line, index) => ({line, index}))
    .filter(x => /DISPOSITION_ROLL/.test(x.line) && !/JO9 MOD END/.test(x.line));
  let selected;
  let mode;
  if (markerLines.length) {
    const marker = exactlyOne(markerLines, 'DISPOSITION_ROLL start marker');
    const matches = lines.map((line, index) => ({line, index})).filter(x =>
      x.index >= marker.index && x.index <= marker.index + 8 &&
      /\bjo9_trait_registry_roll\s*=\s*rand\s*\(\s*1\s*,\s*100\s*\)/i.test(x.line));
    // Other trait rolls can be only a few lines later. The marker identifies
    // the first following assignment, not every same-named scratch roll nearby.
    if (!matches.length) throw Error('No disposition roll assignment at/after DISPOSITION_ROLL');
    selected = matches[0];
    mode = 'marked-shared-disposition-roll';
  } else {
    const matches = lines.map((line, index) => ({line, index})).filter(x =>
      /^\s*if\s+rand\s*\(\s*1\s*,\s*100\s*\)\s*<=\s*10\s*:\s*stock\[['"]defiant['"]\]\s*=\s*1\s*(?:&?\s*!.*)?$/i.test(x.line));
    selected = exactlyOne(matches, 'baseline defiant roll');
    mode = 'baseline-defiant-roll';
  }
  if (!rand.test(selected.line)) throw Error('Selected line has no disposition RAND');
  lines[selected.index] = selected.line.replace(rand, "func('qa_disposition_rand')");
  const instrumentedBlock = lines.join('\r\n');
  const beforeRandCount = (block.match(/\brand\s*\(/gi) || []).length;
  const afterRandCount = (instrumentedBlock.match(/\brand\s*\(/gi) || []).length;
  if (beforeRandCount - afterRandCount !== 1) throw Error('Instrumentation changed more than one RAND expression');
  const instrumented = original.slice(0, generate.index) + instrumentedBlock + original.slice(edit.index);
  return {instrumented, evidence: {
    mode,
    originalGenerationSha256: core.hash(Buffer.from(block, 'utf8')),
    instrumentedGenerationSha256: core.hash(Buffer.from(instrumentedBlock, 'utf8')),
    originalLocationSha256: core.hash(Buffer.from(original, 'utf8')),
    originalLine: selected.line,
    instrumentedLine: lines[selected.index],
    generationRandCountBefore: beforeRandCount,
    generationRandCountAfter: afterRandCount,
    instrumentedExpressions: 1,
  }};
}

function prepare(qspPath, outputDirectory) {
  const source = path.resolve(qspPath);
  const output = path.resolve(outputDirectory);
  for (const forbidden of [
    'G:/somi/Jack O Nine Tails v2.4_work/game',
    'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game',
  ]) {
    const relative = path.relative(path.resolve(forbidden), output);
    if (relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) {
      throw Error('Diagnostic output must stay outside runtime game folders');
    }
  }
  if (fs.existsSync(output)) throw Error('Fresh output directory required: ' + output);
  const raw = fs.readFileSync(source);
  const doc = core.parse(raw);
  const location = exactlyOne(doc.locations.filter(x => x.name === 'jo9_traits'), 'jo9_traits location');
  const original = core.shift(doc.lines[location.body], 5);
  const {instrumented, evidence} = instrumentDisposition(original);
  const marker = 'JO9_QA_DISPOSITION_generation_COMPLETE';
  const q = s => "'" + String(s).replaceAll("'", "''") + "'";
  const check = (expression, label) => [
    'if ' + expression + ':',
    'else',
    ' qa_failures += 1',
    " if qa_failures <= 20: $qa_errors += " + q(label + '|'),
    'end',
  ];
  const code = [
    'killall', 'settimer 0', 'autosave=0', 'decadesave=0', 'autosave_day=0', 'autosave_decade=0',
    "$counter=''", "$onnewloc=''", 'sound_on=0', 'nsfw=0',
    "CONST_INT['no_slave']=0", "CONST_INT['slave_exist']=1", 'stock_state=1',
    'stock_type=900001', "stock['beauty']=3", 'qa_failures=0', "$qa_errors=''",
    "slave['defiant']=1", "slave['jo9_slave_nature']=0", "slave['ego']=5", "slave['pride']=5",
    "assistant['defiant']=0", "assistant['jo9_slave_nature']=1", "assistant['ego']=4", "assistant['pride']=4",
  ];
  const cases = [];
  for (let ego = 0; ego <= 5; ego++) {
    for (let pride = 0; pride <= 5; pride++) {
      const eligible = ego <= 3 && pride <= 3;
      const id = 'ego_' + ego + '_pride_' + pride;
      const expected = {defiant: 2, slaveNature: eligible ? 10 : 0, none: eligible ? 88 : 98};
      cases.push({ego, pride, eligible, expected});
      code.push(
        "stock['ego']=" + ego, "stock['pride']=" + pride,
        'qa_negative=0', 'qa_positive=0', 'qa_none=0', 'qa_roll=1', ':qa_' + id,
        // Reset unrelated fixtures each time; the separate stale test checks actual generation clearing.
        "stock['defiant']=0", "stock['jo9_slave_nature']=0", 'qa_disposition_calls=0',
        "gs 'jo9_traits', 'generate'",
        ...check('qa_disposition_calls=1', id + '_roll_call_count'),
        ...check("stock['defiant']>=0 and stock['defiant']<=1 and stock['jo9_slave_nature']>=0 and stock['jo9_slave_nature']<=1", id + '_flag_bounds'),
        ...check("stock['defiant']*stock['jo9_slave_nature']=0", id + '_no_overlap'),
        "if stock['defiant']=1: qa_negative += 1",
        "if stock['jo9_slave_nature']=1: qa_positive += 1",
        "if stock['defiant']=0 and stock['jo9_slave_nature']=0: qa_none += 1",
        'qa_roll += 1', 'if qa_roll <= 100: jump ' + q('qa_' + id),
        ...check('qa_negative=' + expected.defiant, id + '_negative_count'),
        ...check('qa_positive=' + expected.slaveNature, id + '_positive_count'),
        ...check('qa_none=' + expected.none, id + '_none_count'),
      );
    }
  }
  code.push(
    "stock['ego']=3", "stock['pride']=3", "stock['defiant']=1", "stock['jo9_slave_nature']=1",
    'qa_roll=100', 'qa_disposition_calls=0', "gs 'jo9_traits', 'generate'",
    ...check("stock['defiant']=0 and stock['jo9_slave_nature']=0 and qa_disposition_calls=1", 'stale_stock_flags_cleared'),
    ...check("slave['defiant']=1 and slave['jo9_slave_nature']=0 and slave['ego']=5 and slave['pride']=5", 'existing_slave_unchanged'),
    ...check("assistant['defiant']=0 and assistant['jo9_slave_nature']=1 and assistant['ego']=4 and assistant['pride']=4", 'existing_assistant_unchanged'),
    "if qa_failures>0: msg 'JO9_QA_ASSERT_DISPOSITION_'+$qa_errors & exit",
    'msg ' + q(marker),
  );
  // Preserve the original header/password and use the actual, instrumented trait location.
  const locations = [
    ['Start', code.join('\r\n')],
    ['jo9_traits', instrumented],
    ['qa_disposition_rand', 'qa_disposition_calls += 1\r\nresult=qa_roll'],
  ];
  const lines = doc.lines.slice(0, 4);
  lines[3] = core.shift(String(locations.length), -5);
  for (const [name, body] of locations) {
    lines.push(core.shift(name, -5), '', core.shift(body, -5), core.shift('0', -5));
  }
  lines.push('');
  const fixture = core.serialize({lines});
  const inspection = qa.inspectWorld(fixture);
  if (core.hash(fs.readFileSync(source)) !== doc.hash) throw Error('Input QSP changed during preparation');
  fs.mkdirSync(output, {recursive: true});
  const fixturePath = path.join(output, 'generation.qsp');
  fs.writeFileSync(fixturePath, fixture);
  const plan = [{
    name: 'generation', file: fixturePath, marker,
    checkpoint: 'Actual jo9_traits: 36 ego/pride combinations, 100 exhaustive disposition rolls each; exact 2% negative, eligible 10% positive, excluded positive 0%; no overlap, stale stock reset, existing actors unchanged.',
  }];
  const prepared = {
    source, sourceSha256: doc.hash, output, fixtureSha256: inspection.sha256,
    engine: 'G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe',
    runner: 'G:/somi/JO9sa/tools/qa/run-client-smoke.ps1',
    instrumentation: evidence, cases, matrixCalls: cases.length * 100, additionalStaleCall: 1,
    limits: [
      'Preparation only; success requires the emitted native-engine completion marker.',
      'Only the disposition RAND expression is replaced; unrelated trait RAND calls remain original.',
      'Exhaustive controlled rolls prove threshold/eligibility logic, not empirical randomness or RNG quality.',
      'Tiny native world executes the actual jo9_traits location; acquisition initialization, save loading, UI layout, editor and fixed-seed behavior require separate probes.',
      'No existing saves or JSON files are read or changed. The source QSP is read only.',
    ],
  };
  fs.writeFileSync(path.join(output, 'plan.json'), JSON.stringify(plan, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'prepared.json'), JSON.stringify(prepared, null, 2) + '\n');
  return {sourceSha256: doc.hash, output, plan: path.join(output, 'plan.json'), cases: cases.length, calls: 3601, instrumentation: evidence.mode};
}

if (require.main === module) {
  if (process.argv.length !== 4) throw Error('Usage: node check-generation.cjs INPUT.qsp FRESH_OUTPUT_DIRECTORY');
  console.log(JSON.stringify(prepare(process.argv[2], process.argv[3]), null, 2));
}
module.exports = {instrumentDisposition, prepare};
