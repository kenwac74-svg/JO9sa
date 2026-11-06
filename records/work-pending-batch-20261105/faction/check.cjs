'use strict';
// Runs WASM only, then prepares exact-source FastQSP fixtures without launching it.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const vendor = 'G:/Codex/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/fog-relay-startup-fix-20261017/legacy-engine-probe/package';
const { initQspEngine } = require(vendor + '/dist/node/wasm-engine.cjs');
const originalLog = console.log;
console.log = (...items) => { if (!items[0]?.event) originalLog(...items); };
const candidatePath = path.resolve(process.argv[2] || path.join(__dirname, 'candidate.qsp'));
const raw = fs.readFileSync(candidatePath), doc = core.parse(raw);
const pending = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../hard-trait-price-20261104/FACTION_REPUTATION_S_PLUS_PENDING.json'), 'utf8'));
const body = n => core.shift(doc.lines[doc.locations.find(x => x.name === n).body], 5);
for (const e of pending.edits) assert.ok(body(e.location).includes(e.new), `approved source block missing: ${e.location}`);
const page = pending.edits[0].new.slice(pending.edits[0].new.indexOf('if menu_form = 2111:')).trimEnd();
const staticBase = body('#static_base');
const fontStart = staticBase.indexOf('$_font_col_skill[0]');
const fontEnd = staticBase.indexOf('! Replacement for consecutive colors', fontStart);
assert.ok(fontStart >= 0 && fontEnd > fontStart);
const colorCode = staticBase.slice(fontStart, fontEnd);
const reputationCode = pending.edits[4].new;
const tooltipCode = pending.edits[5].new;
const crlf = code => code.replace(/\r?\n/g, '\r\n');
const quote = s => "'" + s.replaceAll("'", "''") + "'";
const fixture = (start, locations) => {
  const all = [['Start', start], ...locations];
  return Buffer.from(['QSPGAME', '', '', core.shift(String(all.length), -5), ...all.flatMap(([n, s]) => [core.shift(n, -5), '', core.shift(crlf(s), -5), core.shift('0', -5)]), ''].join('\r\n'), 'utf16le');
};
const resetPage = "$setting_display=''\r\n$setting_display_c=''\r\n$setting_display_c2=''\r\n";
const records = [['menu_form', resetPage + page], ['qa_reputation', colorCode + reputationCode], ['qa_tooltip', tooltipCode]];
const family = { korvus: 'serpis', taurus: 'kamira', serpis: 'korvus', kamira: 'taurus' };
const factions = Object.keys(family);
const icons = { minus: 'Minus_small', plus: 'Plus_small', max: 'teach_s' };
function expectedButtons(fame, noble, opposite, pope) {
  const result = {};
  if (fame > 0) {
    result.minus = noble && fame === 5 ? [4, 0] : noble && fame === 6 ? [4, 1] : !noble && fame === 6 ? [5, 1] : [fame - 1, noble];
  }
  if (opposite <= 2 || pope >= 2) {
    if (!noble && fame < 6) {
      result.plus = fame === 4 ? [5, 1] : [fame + 1, 0];
      result.max = [5, 1];
    } else if (noble) {
      if (fame < 4) result.plus = [fame + 1, 1];
      else if (fame === 4) result.plus = [6, 1];
      if (fame < 5) result.max = [6, 1];
    }
  }
  return result;
}
const setup = (f, fame, noble, opposite, pope, noFuta = 1) => [
  ...factions.map(n => `faction_fame['${n}']=0`),
  `faction_fame['${f}']=${fame}`, `faction_fame['${family[f]}']=${opposite}`, `noble_status=${noble}`,
  `npc_progress['pope']=${pope}`, `no_futa=${noFuta}`, 'menu_form=2111',
].join('\r\n');
const nativeCases = [], nativeChecks = [];
const stats = { render_scenarios: 0, button_clicks: 0, reputation_scenarios: 0, reputation_arrays_checked: 0, tooltip_boundaries: 0, ui_guard_boundaries: 0, assertions: 0 };
const errors = [];
let api;
function run(code) { api.execCode(crlf(code)); if (errors.length) throw Error(JSON.stringify(errors)); }
function equal(label, actual, expected) { stats.assertions++; assert.equal(actual, expected, label); }
function readNum(expr) { run('qa_value=' + expr); return Number(api.readVariable('qa_value')); }
function anchors(display, f) {
  const result = {};
  for (const a of display.matchAll(/<a href="EXEC: ([^"]+)"><img src="[^"]+\/(Minus_small|Plus_small|teach_s)\.png"><\/a>/g)) {
    if (!a[1].includes(`faction_fame['${f}']`)) continue;
    const kind = Object.keys(icons).find(x => icons[x] === a[2]);
    assert.ok(!result[kind], `duplicate button ${f}/${kind}`);
    result[kind] = { code: a[1], html: a[0] };
  }
  return result;
}
function nativeCase(initial, f, expectedFame, expectedNoble, click, expectedCount) {
  const needle = quote(`faction_fame['${f}']`);
  const countExpr = `(len($setting_display)-len($replace($setting_display,${needle},'')))/len(${needle})`;
  nativeCases.push({ initial, f, expectedFame, expectedNoble, click, expectedCount, countExpr });
}
function checkExpr(label, code, expression, wanted) {
  run(code);
  equal(label, readNum(expression), wanted);
  nativeChecks.push(code, `qa_value=${expression}`, `if qa_value ! ${wanted}: msg ${quote('JO9_FACTION_FAIL_' + nativeChecks.length)} & exit`);
}
(async () => {
  api = await initQspEngine(vendor + '/dist/qsp-engine.wasm');
  api.on('error', e => errors.push(e));
  const game = fixture('', records);
  api.openGame(game.buffer.slice(game.byteOffset, game.byteOffset + game.byteLength), true);
  for (const f of factions) for (const fame of [0, 1, 2, 3, 4, 5, 6]) for (const noble of [0, 1]) for (const opposite of [2, 3]) for (const pope of [0, 2]) {
    const initial = setup(f, fame, noble, opposite, pope);
    run(initial + "\r\ngs 'menu_form'");
    const display = String(api.readVariable('$setting_display'));
    const actual = anchors(display, f), expected = expectedButtons(fame, noble, opposite, pope);
    equal(`${f}/${fame}/${noble}/${opposite}/${pope} button kinds`, Object.keys(actual).sort().join(','), Object.keys(expected).sort().join(','));
    equal('render preserves fame', readNum(`faction_fame['${f}']`), fame);
    equal('render preserves noble_status', readNum('noble_status'), noble);
    equal('back page', String(api.readVariable('$setting_display_c')).includes('menu_form = 2110'), true);
    equal('next page', String(api.readVariable('$setting_display_c2')).includes('menu_form = 2100'), true);
    nativeCase(initial, f, fame, noble, '', Object.keys(expected).length);
    stats.render_scenarios++;
    for (const [kind, [nextFame, nextNoble]] of Object.entries(expected)) {
      run(initial);
      run(actual[kind].code); // Retains the actual GT callback in WASM.
      equal(`${f}/${kind} fame`, readNum(`faction_fame['${f}']`), nextFame);
      equal(`${f}/${kind} noble_status`, readNum('noble_status'), nextNoble);
      equal(`${f}/${kind} page`, readNum('menu_form'), 2111);
      const afterExpected = expectedButtons(nextFame, nextNoble, opposite, pope);
      nativeCase(initial, f, nextFame, nextNoble, actual[kind].code, Object.keys(afterExpected).length);
      stats.button_clicks++;
    }
  }
  for (const noFuta of [0, 1]) {
    run(setup('korvus', 0, 0, 2, 0, noFuta) + "\r\ngs 'menu_form'");
    equal('futa row visibility', String(api.readVariable('$setting_display')).includes('후타랜드:'), !noFuta);
  }
  // Actual source dynamic color helper plus the preserved attachment reputation block.
  const reputationNames = ['taurus', 'serpis', 'kamira', 'korvus', 'brand', 'RedLight', 'centralkvartal', 'otchuzhdenie', 'fogs', 'eastkvartal'];
  for (const creation of [0, 1, 2]) {
    run(`game_difficulty=${creation}\r\ngs 'qa_reputation'`);
    stats.reputation_scenarios++;
    nativeChecks.push(`game_difficulty=${creation}`, "gs 'qa_reputation'");
    for (const name of reputationNames) for (const index of Array.from({ length: factions.includes(name) ? 7 : 6 }, (_, i) => i)) {
      const text = String(api.readVariable('$' + name + '_fame', index));
      const colorIndex = index === 6 ? 5 : index;
      const wantedPrefix = String(api.readVariable('$_font_col_skill', colorIndex));
      equal(`${creation}/${name}/${index} color`, text.startsWith(wantedPrefix), true);
      equal(`${creation}/${name}/${index} closer`, text.endsWith('</font>'), true);
      nativeChecks.push(`if instr($${name}_fame[${index}],$_font_col_skill[${colorIndex}]) ! 1: msg 'JO9_FACTION_REPUTATION_COLOR_FAIL' & exit`);
      stats.reputation_arrays_checked++;
    }
    for (const name of ['taurus', 'serpis', 'kamira', 'korvus', 'RedLight', 'centralkvartal', 'otchuzhdenie']) {
      const a = String(api.readVariable('$' + name + '_fame', 1));
      const b = String(api.readVariable('$' + name + '_fame', 2));
      equal(`${creation}/${name} residence tier 1`, /거주|정착/.test(a), creation !== 2);
      equal(`${creation}/${name} residence tier 2`, /거주|정착/.test(b), creation === 2);
      for (const index of [1, 2]) {
        const shouldMention = (creation === 2) === (index === 2);
        nativeChecks.push(`qa_value=(instr($${name}_fame[${index}],'거주') > 0 or instr($${name}_fame[${index}],'정착') > 0)`, `if qa_value ! ${Number(shouldMention)}: msg 'JO9_FACTION_RESIDENCE_FAIL' & exit`);
      }
    }
  }
  for (const sum of [22, 23, 24, 25, 26]) {
    checkExpr(`S+ tooltip sum ${sum}`, `$rating_help=''\r\ndynslave['sex_sum']=${sum}\r\nskill_sum=30\r\ngs 'qa_tooltip'`, "instr($rating_help,'더 높은 성애기술 등급') > 0", Number(sum < 25));
    stats.tooltip_boundaries++;
  }
  const guardLines = pending.edits.slice(1, 4).map(e => e.new.split('\r\n').find(x => x.startsWith('if ')));
  for (const [i, line] of guardLines.entries()) for (const menu of [1999, 2000, 2110, 2111, 2112]) for (const exam of [0, 1]) for (const sex of [0, 100]) {
    const expression = line.slice(3, -1);
    const allowedPage = menu < 2000 || menu > 2111;
    const expected = i === 0 ? allowedPage : i === 1 ? allowedPage && !exam : allowedPage && sex !== 100 && !exam;
    checkExpr(`guard ${i}/${menu}/${exam}/${sex}`, `menu_form=${menu}\r\nexam_in_progress=${exam}\r\nsex_num=${sex}`, expression, Number(expected));
    stats.ui_guard_boundaries++;
  }
  // State-machine fixture preserves the exact clicked GT, then checks in menu_form.
  const nativeOut = path.join(__dirname, 'native');
  fs.mkdirSync(nativeOut, { recursive: true });
  const obsoleteLargeFixture = path.join(nativeOut, 'faction-editor.qsp');
  if (fs.existsSync(obsoleteLargeFixture)) fs.unlinkSync(obsoleteLargeFixture);
  const plan = [];
  // A long chain of literal GT calls also nests the legacy WASM engine C stack.
  // Bounded batches retain every actual callback while avoiding diagnostic recursion.
  for (let start = 0, batch = 0; start < nativeCases.length; start += 40, batch++) {
    const cases = nativeCases.slice(start, start + 40);
    const suffix = String.fromCharCode(97 + batch);
    const marker = `JO9_QA_FACTION_faction_editor_${suffix}_COMPLETE`;
    const footer = [
      "if faction_fame[$qa_faction] ! qa_expected_fame: msg 'JO9_FACTION_NATIVE_FAME_FAIL' & exit",
      "if noble_status ! qa_expected_noble: msg 'JO9_FACTION_NATIVE_NOBLE_FAIL' & exit",
      'dynamic $qa_render_check', 'qa_case+=1',
      `if qa_case=${cases.length}: msg '${marker}' & exit`, "gt 'qa_dispatch'",
    ].join('\r\n');
    const dispatch = cases.map((c, i) => [
      `if qa_case=${i}:`, c.initial, `$qa_faction=${quote(c.f)}`, `qa_expected_fame=${c.expectedFame}`, `qa_expected_noble=${c.expectedNoble}`,
      `$qa_render_check={qa_link_count=${c.countExpr}\r\nif qa_link_count ! ${c.expectedCount}: msg 'JO9_FACTION_NATIVE_BUTTON_COUNT_FAIL' & exit}`,
      c.click || "gt 'menu_form'", 'end',
    ].join('\r\n')).join('\r\n');
    const file = path.join(nativeOut, `faction-editor-${suffix}.qsp`);
    fs.writeFileSync(file, fixture("qa_case=0\r\ngt 'qa_dispatch'", [['menu_form', resetPage + page + '\r\n' + footer], ['qa_dispatch', dispatch]]));
    plan.push({ name: `faction-editor-${suffix}`, file, marker, checkpoint: `Exact page renders and GT callbacks ${start + 1}..${start + cases.length} of ${nativeCases.length}; fame, noble_status, post-click button count` });
  }
  const otherMarker = 'JO9_QA_FACTION_reputation_tooltip_guards_COMPLETE';
  const otherFile = path.join(nativeOut, 'reputation-tooltip-guards.qsp');
  fs.writeFileSync(otherFile, fixture(nativeChecks.join('\r\n') + `\r\nmsg '${otherMarker}'`, records));
  plan.push({ name: 'reputation-tooltip-guards', file: otherFile, marker: otherMarker, checkpoint: 'Actual reputation color helper and residence text tiers; S+ tooltip sum 22..26; three UI guards at 2111 boundary' });
  fs.writeFileSync(path.join(nativeOut, 'plan.json'), JSON.stringify(plan, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(nativeOut, 'config.xml'), '<game width="640" height="480" title="JO9 faction diagnostics"/>', 'utf8');
  fs.writeFileSync(path.join(nativeOut, 'FastQSP.ini'), '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n', 'utf8');
  const fixtureValidation = [];
  for (const probe of plan) {
    const fixtureApi = await initQspEngine(vendor + '/dist/qsp-engine.wasm');
    const fixtureErrors = [], messages = [];
    fixtureApi.on('error', e => fixtureErrors.push(e));
    fixtureApi.on('msg', (message, done) => { messages.push(message); done(); });
    const fixtureRaw = fs.readFileSync(probe.file);
    assert.ok(core.serialize(core.parse(fixtureRaw)).equals(fixtureRaw), 'native fixture structure');
    fixtureApi.openGame(fixtureRaw.buffer.slice(fixtureRaw.byteOffset, fixtureRaw.byteOffset + fixtureRaw.byteLength), true);
    fixtureApi.execCode("gt 'Start'");
    await new Promise(resolve => setTimeout(resolve, 0));
    assert.deepEqual(fixtureErrors, [], 'native fixture WASM errors');
    assert.deepEqual(messages, [probe.marker], 'native fixture WASM completion');
    fixtureValidation.push({ name: probe.name, status: 'WASM_COMPLETION_PASS', marker: probe.marker });
  }
  const report = {
    status: 'WASM_PASS_NATIVE_PREPARED', candidate: candidatePath, candidate_sha256: core.hash(raw), stats,
    actual_source_execution: ['2111 page block', 'Rendered minus/plus/maximum EXEC callbacks, including actual GT menu_form', 'Source skill color DYNEVAL helper and entire approved reputation block', 'Actual edited tooltip conditions', 'All three edited UI guard expressions'],
    native: { status: 'PREPARED_NOT_RUN', plan: path.join(nativeOut, 'plan.json'), cases: nativeCases.length, fixture_validation: fixtureValidation },
    limits: ['WASM fixture excludes unrelated full menu_form and main_screen code.', 'Native execution is serialized by the parent; this script does not launch FastQSP.', 'No actual GUI, old save loading, or game-wide syntax certification.'],
  };
  fs.writeFileSync(path.join(__dirname, 'targeted-test-report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(JSON.stringify(report));
})().catch(e => { console.error(e); process.exitCode = 1; });
