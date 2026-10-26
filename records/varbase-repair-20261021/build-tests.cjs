'use strict';
// Generates isolated diagnostics only. It never launches an engine or edits inputs.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const repo = 'G:/somi/JO9sa';
const game = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const defaultStateSave = path.join(__dirname, 'state.sav');
const core = require(repo + '/tools/text-workshop/core.cjs');
const qa = require(repo + '/tools/qa/release-check.cjs');
const codec = require(repo + '/tools/qa/save-codec.cjs');
const eol = '\r\n';
const quote = s => "'" + String(s).replaceAll("'", "''") + "'";
const lines = rows => rows.flat(Infinity).filter(x => x !== undefined).join(eol);
function options(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i += 2) {
    assert(['--qsp', '--out', '--state-save'].includes(argv[i]) && argv[i + 1], 'Use --qsp FILE --out DIR [--state-save FILE]');
    assert(!o[argv[i].slice(2)], 'Duplicate option');
    o[argv[i].slice(2)] = path.resolve(argv[i + 1]);
  }
  assert(o.qsp && o.out, 'Use --qsp FILE --out DIR [--state-save FILE]');
  return o;
}
function check(condition, code) {
  return lines(['if ' + condition + ':', '\tqa_checks += 1', 'else', '\tmsg ' + quote('JO9_QA_ASSERT_' + code), '\texit', 'end']);
}
const neutral = {
  age: 2, anal_stretch: 0, boobs: 3, lactation: 0, beauty: 3, fat: 3,
  virginity: 0, intellect: 3, oral: 3, sub_dt: 0, penetration: 1,
  ego: 1, cook: 2, vaginal: 0, sub_bj: 0, sub_zoosex: 0, sub_horse: 0,
  sub_bestiality: 0, sub_gangbang: 0, perversion_revealed: 0, perversion: 0,
  homosexualism_revealed: 0, homosexualism: 0, sub_anal: 0,
  sub_masturbation: 0, masturbation_rule: 0, sub_kopro: 0,
  sub_asslik: 0, sub_bukkake: 0, obedience: 1
};
function adultSetup(overrides = {}) {
  return lines([
    Object.entries({...neutral, ...overrides}).map(([k, v]) => 'slave[' + quote(k) + ']=' + v),
    "assistant['age']=2", "CONST_INT['loli_age']=1", "CONST_INT['boobs5']=5",
    "CONST_INT['boobs_5']=5", "CONST_INT['adult_age']=2",
    "$slave_psy_status='normal'", "no_loli=0", "snk_room_target=0",
    'autosave=0', 'decadesave=0', 'autosave_day=0', 'autosave_decade=0',
    'sound_on=0', 'settimer 0'
  ]);
}
const persistent = ['sparks', 'day', 'month', 'year', 'daycount', 'decadecount', 'autosave', 'decadesave', 'autosave_day', 'autosave_decade'];
function savePersistent() { return lines(persistent.map(k => 'qa_keep_' + k + '=' + k)); }
function checkPersistent(tag) { return lines(persistent.map(k => check(k + '=qa_keep_' + k, tag + '_' + k.toUpperCase()))); }
function saveActor(role, tag) {
  const p = 'qa_' + tag + '_' + role;
  return lines([
    p + '_len=arrsize(' + quote(role) + ')', p + '_textlen=arrsize(' + quote('$' + role) + ')',
    'qa_i=0', ':' + p + '_snapshot',
    'if qa_i < ' + p + '_len or qa_i < ' + p + '_textlen:',
    '\t' + p + '[qa_i]=' + role + '[qa_i]', '\t$' + p + '[qa_i]=$' + role + '[qa_i]',
    '\tqa_i+=1', '\tjump ' + quote(p + '_snapshot'), 'end'
  ]);
}
function checkActor(role, tag) {
  const p = 'qa_' + tag + '_' + role;
  return lines([
    check('arrsize(' + quote(role) + ')=' + p + '_len', tag.toUpperCase() + '_' + role.toUpperCase() + '_SIZE'),
    check('arrsize(' + quote('$' + role) + ')=' + p + '_textlen', tag.toUpperCase() + '_' + role.toUpperCase() + '_TEXTSIZE'),
    'qa_i=0', ':' + p + '_compare',
    'if qa_i < ' + p + '_len or qa_i < ' + p + '_textlen:',
    check(role + '[qa_i]=' + p + '[qa_i] and $' + role + '[qa_i]=$' + p + '[qa_i]', tag.toUpperCase() + '_' + role.toUpperCase() + '_VALUES'),
    '\tqa_i+=1', '\tjump ' + quote(p + '_compare'), 'end'
  ]);
}
const cases = [
  {name: 'zero', attrs: {}, front: 1, total: 1, fallbackSign: 3, fallbackBranch: 1},
  {name: 'one', attrs: {anal_stretch: 5}, front: 1, total: 1},
  {name: 'multiple', attrs: {anal_stretch: 5, boobs: 5, lactation: 2, fat: 5, intellect: 2}, front: 4, total: 4},
  {name: 'lateonly', attrs: {cook: 1}, front: 1, total: 2, fallbackSign: 3, fallbackBranch: 1},
  {name: 'large', attrs: {anal_stretch: 5, boobs: 5, lactation: 2, beauty: 1, fat: 5, virginity: 3, intellect: 2, oral: 0, penetration: 0, ego: 0, cook: 1}, front: 8, total: 10},
  {name: 'small', attrs: {fat: 4}, front: 1, total: 1},
  {name: 'zeroagain', attrs: {}, front: 1, total: 1, fallbackSign: 3, fallbackBranch: 1},
  ...['reluctant', 'resistant', 'broken', 'depresive', 'frightened'].map(psy => ({name: 'psy' + psy, attrs: {}, psy, front: 1, total: 1, fallbackSign: 3, fallbackBranch: 2}))
];
function listCase(test, section) {
  const tag = test.name, code = tag.toUpperCase();
  return lines([
    adultSetup(test.attrs), test.psy ? '$slave_psy_status=' + quote(test.psy) : undefined,
    savePersistent(), saveActor('slave', tag), saveActor('assistant', tag),
    'hum_sign[1]=9876', [1, 2, 3, 4].map(i => '$hum_text' + i + "[1]='QA_STALE'"),
    'qa_fallback_branch=0', section,
    check('hum_cnt=' + test.total, code + '_COUNT'),
    check('flaw_num >= 1 and flaw_num <= ' + test.front, code + '_FRONT_INDEX'),
    test.fallbackSign !== undefined ? check('hum_sign[flaw_num]=' + test.fallbackSign, code + '_FALLBACK_SIGN') : undefined,
    test.fallbackBranch !== undefined ? check('qa_fallback_branch=' + test.fallbackBranch, code + '_FALLBACK_BRANCH') : undefined,
    test.psy ? check('$slave_psy_status=' + quote(test.psy), code + '_PSY_PRESERVED') : undefined,
    check('hum_num >= 1 and hum_num <= hum_cnt', code + '_FINAL_INDEX'),
    check("$hum_text1[hum_num] ! '' and $hum_text3[hum_num] ! ''", code + '_FINAL_FIELDS'),
    'qa_i=1', ':qa_' + tag + '_front_fields', 'if qa_i <= ' + test.front + ':',
    check([1, 2, 3, 4].map(i => "$hum_text" + i + "[qa_i] ! '' and $hum_text" + i + "[qa_i] ! 'QA_STALE'").join(' and ') + ' and hum_sign[qa_i] ! 9876', code + '_FRONT_FIELDS'),
    '\tqa_i+=1', '\tjump ' + quote('qa_' + tag + '_front_fields'), 'end',
    checkActor('slave', tag), checkActor('assistant', tag), checkPersistent(code), 'qa_cases+=1'
  ]);
}
const headerReference = path.join(__dirname, 'baseline.qsp');
const headerLines = [188, 242, 1244, 1312, 1389, 1418, 1429, 1438, 1439, 1470, 1518, 1570, 1596, 1671, 1760, 2007, 2031, 2036, 2046];
// Canonical context preserves every quoted character while ignoring external
// whitespace and comment lines. It matches the original inline RHS after the
// candidate moves it onto its own line, without relying on candidate line numbers.
function canonical(source) {
  const chars = [], map = [];
  let q = '', lineStart = true;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (!q && lineStart && ch === '!') {
      while (i < source.length && source[i] !== '\n') i++;
      lineStart = true;
      continue;
    }
    if (!q && /\s/.test(ch)) {
      if (ch === '\n') lineStart = true;
      continue;
    }
    chars.push(ch); map.push(i);
    if (q && ch === q) {
      if (source[i + 1] === q) { chars.push(source[++i]); map.push(i); }
      else q = '';
    } else if (!q && (ch === "'" || ch === '"')) q = ch;
    if (ch === '\n') lineStart = true;
    else if (!/\s/.test(ch)) lineStart = false;
  }
  return {text: chars.join(''), map};
}
function headerColon(line) {
  let q = '';
  for (let i = 0; i < line.length; i++) {
    if (q && line[i] === q) {
      if (line[i + 1] === q) i++; else q = '';
    } else if (!q && (line[i] === "'" || line[i] === '"')) q = line[i];
    else if (!q && line[i] === ':') return i;
  }
  throw Error('Reference header lacks statement colon');
}
function instrumentHeaders(body) {
  const referenceRaw = fs.readFileSync(headerReference), referenceDoc = core.parse(referenceRaw);
  const reference = core.shift(referenceDoc.lines[referenceDoc.locations.find(l => l.name === '#var_base').body], 5);
  const refLines = reference.split(eol), ref = canonical(reference), candidate = canonical(body);
  const insertions = [];
  for (const [index, line] of headerLines.entries()) {
    const sourceStart = refLines.slice(0, line - 1).reduce((n, s) => n + s.length + 2, 0);
    const header = refLines[line - 1], colon = headerColon(header);
    assert(/^\s*if\b/.test(header) && header.slice(colon + 1).trim(), 'Reference must retain original inline RHS');
    const prefix = canonical(header.slice(0, colon + 1)).text;
    const at = ref.map.findIndex(i => i >= sourceStart);
    assert.equal(ref.text.slice(at, at + prefix.length), prefix, 'Reference header offset');
    let found = -1;
    for (const context of [128, 256, 512, 1024, 2048, 4096]) {
      const left = Math.max(0, at - context), right = Math.min(ref.text.length, at + prefix.length + context);
      const anchor = ref.text.slice(left, right), first = candidate.text.indexOf(anchor);
      if (first >= 0 && candidate.text.indexOf(anchor, first + 1) < 0) { found = first + at - left; break; }
    }
    assert(found >= 0, 'Unique unchanged context required for reference header ' + line);
    assert.equal(candidate.text.slice(found, found + prefix.length), prefix, 'Candidate condition preserved');
    const sourceColon = candidate.map[found + prefix.length - 1];
    const lineEnd = body.indexOf(eol, sourceColon);
    assert(lineEnd >= sourceColon, 'Header newline required');
    insertions.push({at: lineEnd + 2, text: 'qa_block_entered[' + (index + 1) + ']=1' + eol});
  }
  assert.equal(new Set(insertions.map(x => x.at)).size, headerLines.length, 'Distinct header instrumentation');
  let instrumented = body;
  for (const insertion of insertions.sort((a, b) => b.at - a.at)) instrumented = instrumented.slice(0, insertion.at) + insertion.text + instrumented.slice(insertion.at);
  return {body: instrumented, referenceSha256: core.hash(referenceRaw)};
}
function falseHeaders(tag) {
  return lines(headerLines.map((line, index) => check('qa_block_entered[' + (index + 1) + ']=0', tag + '_BODY_' + (index + 1))));
}
function instrumentFallback(section) {
  const rows = section.split(eol);
  const fallback = rows.findIndex(row => /^\s*if hum_cnt < 1:\s*$/.test(row));
  assert(fallback >= 0, 'Fallback block required');
  const psy = rows.findIndex((row, index) => index > fallback && /^\s*elseif \$slave_psy_status = 'reluctant'/.test(row));
  assert(psy > fallback, 'Psychological fallback branch required');
  const normal = rows.findIndex((row, index) => index > psy && /^\s*else\s*$/.test(row));
  assert(normal > psy, 'Normal fallback branch required');
  rows.splice(normal + 1, 0, 'qa_fallback_branch=1');
  rows.splice(psy + 1, 0, 'qa_fallback_branch=2');
  return rows.join(eol);
}
function main() {
  const o = options(process.argv.slice(2));
  const stateSave = o['state-save'] || defaultStateSave;
  qa.assertOutside(o.out, [game, repo]);
  const raw = fs.readFileSync(o.qsp), beforeHash = core.hash(raw), doc = core.parse(raw);
  assert(core.serialize(doc).equals(raw), 'Source QSP must roundtrip');
  const target = doc.locations.find(l => l.name === '#var_base');
  assert(target, 'Missing #var_base');
  const body = core.shift(doc.lines[target.body], 5);
  const begin = body.indexOf('!HUMILIATION LESSONS');
  const end = body.indexOf('! Variable Text', begin);
  assert(begin >= 0 && end > begin, 'Unambiguous list section boundaries required');
  assert(body.indexOf('!HUMILIATION LESSONS', begin + 1) < 0, 'Duplicate list section');
  const section = instrumentFallback(body.slice(begin, end).trimEnd());
  const saveRaw = fs.readFileSync(stateSave), stateHash = core.hash(saveRaw), save = codec.parse(saveRaw);
  assert(codec.serialize(save).equals(saveRaw), 'Save byte roundtrip');
  for (const role of ['slave', 'assistant']) {
    assert.equal(codec.value(save, role + '_state')[0], '1', role + ' must exist');
    assert.equal(codec.value(save, role, 'age')[0], '2', role + ' must be adult');
  }
  const prime = qa.primeState(save);
  fs.mkdirSync(o.out, {recursive: true});
  for (const name of ['json', 'config.xml', 'FastQSP.ini']) {
    const output = path.join(o.out, name);
    if (name === 'FastQSP.ini') {
      const expected = Buffer.from('[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
      if (fs.existsSync(output)) assert(fs.readFileSync(output).equals(expected), 'Existing diagnostic INI differs');
      else fs.writeFileSync(output, expected);
    } else if (!fs.existsSync(output)) {
      fs.cpSync(path.join(game, name), output, {recursive: name === 'json'});
    }
  }
  const token = 'VARBASE' + beforeHash.slice(0, 12).toUpperCase();
  const marker = n => 'JO9_QA_' + token + '_' + n + '_COMPLETE';
  const full = core.parse(raw), fullTarget = full.locations.find(l => l.name === '#var_base');
  const instrumentedHeaders = instrumentHeaders(body);
  full.lines[fullTarget.body] = core.shift(instrumentedHeaders.body + eol + 'qa_varbase_reached_end=1', -5);
  const start = full.locations.find(l => l.name === 'Start');
  assert(start, 'Missing Start');
  full.lines[start.body] = core.shift(lines([
    prime.code, "gs 'refresh_database'", adultSetup(), 'qa_checks=0',
    savePersistent(), 'nsfw_sound_disabled=0', 'qa_varbase_reached_end=0', "killvar 'qa_block_entered'", "gs '#var_base'",
    check('qa_varbase_reached_end=1', 'FULL_SOUND_ON_END'), falseHeaders('FULL_FALSE_ON'), checkPersistent('FULL_SOUND_ON'),
    'nsfw_sound_disabled=1', 'qa_varbase_reached_end=0', "killvar 'qa_block_entered'", "gs '#var_base'",
    check('qa_varbase_reached_end=1', 'FULL_SOUND_OFF_END'), falseHeaders('FULL_FALSE_OFF'), checkPersistent('FULL_SOUND_OFF'),
    'no_loli=2', "slave['age']=2", "assistant['age']=2", "slave['boobs']=3", 'qa_varbase_reached_end=0', "killvar 'qa_block_entered'", "gs '#var_base'",
    check('qa_varbase_reached_end=1', 'FULL_POSITIVE_END'), check('qa_block_entered[1]=1', 'FULL_POSITIVE_FIRST_BODY'), checkPersistent('FULL_POSITIVE'),
    'msg ' + quote(marker('full'))
  ]), -5);
  const fullRaw = core.serialize(full);
  // The list world has exactly one location: no other game body can execute.
  const listBody = lines([prime.code, 'qa_checks=0', 'qa_cases=0', cases.map(t => listCase(t, section)), check('qa_cases=' + cases.length, 'LIST_CASES'), 'msg ' + quote(marker('list'))]);
  const listRaw = Buffer.from([doc.lines[0], doc.lines[1], doc.lines[2], core.shift('1', -5), core.shift('Start', -5), '', core.shift(listBody, -5), core.shift('0', -5), ''].join(eol), 'utf16le');
  qa.inspectWorld(fullRaw); qa.inspectWorld(listRaw);
  const fixtures = [
    {name: 'varbase-full', file: path.join(o.out, 'varbase-full.qsp'), marker: marker('full'), checkpoint: '#var_base', raw: fullRaw},
    {name: 'varbase-list', file: path.join(o.out, 'varbase-list.qsp'), marker: marker('list'), checkpoint: 'Start', raw: listRaw}
  ];
  for (const f of fixtures) {
    assert.notEqual(path.resolve(f.file).toLowerCase(), o.qsp.toLowerCase(), 'Never overwrite source');
    if (fs.existsSync(f.file)) assert(fs.readFileSync(f.file).equals(f.raw), 'Existing diagnostic fixture differs: ' + f.name);
    else fs.writeFileSync(f.file, f.raw);
  }
  const plan = fixtures.map(({raw: ignored, ...p}) => p);
  fs.writeFileSync(path.join(o.out, 'plan.json'), JSON.stringify(plan, null, 2) + '\n');
  assert.equal(core.hash(fs.readFileSync(o.qsp)), beforeHash, 'Source unchanged');
  assert.equal(core.hash(fs.readFileSync(stateSave)), stateHash, 'Save unchanged');
  const manifest = {schema: 1, source: o.qsp, sourceSha256: beforeHash, stateSave, stateSaveSha256: stateHash, stateAssignments: prime.assignments, instrumentedHeaders: headerLines.length, headerReferenceSha256: instrumentedHeaders.referenceSha256, sourcePreserved: true, savePreserved: true, engineRun: false, cases: cases.map(({name, front, total, psy, fallbackSign, fallbackBranch}) => ({name, front, total, psy, fallbackSign, fallbackBranch})), fixtures: fixtures.map(f => ({name: f.name, file: f.file, sha256: core.hash(f.raw), bytes: f.raw.length})), limits: ['Representative state primer, not native save loading or full cached script restoration.', 'Full body legitimately regenerates slave ero_rwd_cnt; strict actor preservation applies to isolated list cases.', 'Only eligible populated list entries are checked; unreachable stale tails are not required to be deleted.']};
  fs.writeFileSync(path.join(o.out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({built: fixtures.length, listCases: cases.length, sourceSha256: beforeHash, sourcePreserved: true, savePreserved: true, engineRun: false, plan: path.join(o.out, 'plan.json')}));
}
if (require.main === module) main();
module.exports = {options, adultSetup, listCase, cases};
