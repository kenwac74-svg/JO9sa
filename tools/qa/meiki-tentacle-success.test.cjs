'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const core = require('../text-workshop/core.cjs');
const target = process.env.JO9_CHECK_QSP || 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw = fs.readFileSync(target), doc = core.parse(raw);
const baseline = process.env.JO9_BEFORE_QSP ? core.parse(fs.readFileSync(process.env.JO9_BEFORE_QSP)) : doc;
const body = (name, source = doc) => core.shift(source.lines[source.locations.find(l => l.name === name).body], 5);
const roles = ['slave', 'assistant', 'room1', 'room2', 'room3', 'room4'];

function gates(name) {
  return body(name).split(/\r?\n/).flatMap((line, index) => {
    const m = /^\s*if (.+\['sub_tentacles'\] > tentacle_size[^:]*):\s*$/i.exec(line);
    if (!m) return [];
    return [{ condition: m[1], role: /^([a-z0-9]+)/i.exec(m[1])[1], line: index + 1 }];
  });
}
function evaluate(condition, role, state, skill, size) {
  let expression = condition.replaceAll(`${role}['virginity']`, String(state))
    .replaceAll(`${role}['sub_tentacles']`, String(skill)).replaceAll('tentacle_size', String(size))
    .replace(/\bor\b/gi, '||').replace(/\band\b/gi, '&&').replace(/(?<![<>=!])=(?!=)/g, '===');
  assert.match(expression, /^[\d\s()<>!=&|]+$/, 'Only the supported numeric comparison subset is evaluated');
  return Function(`'use strict'; return Boolean(${expression});`)();
}

test('QSP container survives exact byte round trip', () => assert.deepEqual(core.serialize(doc), raw));

test('status sidebar uses approved existing gray safe-day image in both slots', () => {
  const value = body('sjm_UI_UIadds');
  assert.equal((value.match(/Fer_안전\.png/g) || []).length, 0);
  assert.equal((value.match(/content\\pic\\ui\\Fer_PregS\.png/g) || []).length, 2);
  const icon = path.join(path.dirname(process.env.JO9_ICON_GAME_QSP || target), 'content/pic/ui/Fer_PregS.png');
  assert(fs.existsSync(icon), 'Approved icon must already exist in the target installation');
});

for (const [location, count, actors] of [['interaction', 3, ['dynslave', 'assistant', 'slave']], ['next_day', 6, roles], ['end_day_screen', 6, roles]]) {
  test(`${location}: meiki succeeds at every skill/size while other states retain the original strict threshold`, () => {
    const rows = gates(location);
    assert.equal(rows.length, count);
    assert.deepEqual(rows.map(x => x.role).sort(), [...actors].sort());
    for (const gate of rows) for (let state = 0; state <= 4; state++) for (let skill = 0; skill <= 5; skill++) for (let size = 0; size <= 5; size++) {
      assert.equal(evaluate(gate.condition, gate.role, state, skill, size), state === 4 || skill > size,
        `${location}:${gate.line}, ${gate.role}, state=${state}, skill=${skill}, size=${size}`);
    }
  });
}

test('current meiki success dialogue binds each role to its displayed amount and bonus', () => {
  const entries = core.entries(doc);
  const manualAmount = 'semen_gain[max(0, tentacle_size - spawn_milked)] * (12 + tentacle_size) / 10';
  const manualBonus = '20 + tentacle_size * 10';
  const bindings = [
    ...['dynslave', 'assistant', 'slave'].map(role => ['interaction', role, manualAmount, manualBonus]),
    ...roles.map(role => ['end_day_screen', role, `jo9_tentacle_report['${role}_gain']`, `jo9_tentacle_report['${role}_bonus']`]),
  ];
  const executable = new Map(['interaction', 'end_day_screen'].map(location => [location,
    body(location).split(/\r?\n/).filter(line => !/^\s*!\s*JO9 MOD (?:START|END)\b/.test(line)).join('\n')]));
  const escapePattern = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [location, role, amount, bonus] of bindings) {
    const tokens = ['$' + role + '_name', amount, bonus];
    const matches = entries.filter(entry => entry.location === location && tokens.every(token => entry.text.includes('<<' + token + '>>')));
    assert.equal(matches.length, 1, `${location}: ${role} has one success dialogue with its own amount and bonus`);
    const entry = matches[0];
    assert.equal(entry.dialogue, true, `${location}: ${role} is searchable as dialogue`);
    assert.deepEqual(Array.from(entry.text.matchAll(/<<([\s\S]*?)>>/g), match => match[1]), tokens,
      `${location}: ${role} has no mismatched role or unresolved interpolation`);
    assert.doesNotThrow(() => core.validateMarkup(entry.text), `${location}: ${role} has valid QSP interpolation and markup`);
    const guard = location === 'interaction' ? `if ${role}['virginity'] = 4:` : `if jo9_tentacle_report['${role}_bonus'] > 0:`;
    const assignment = (location === 'interaction' ? '$text[1]' : '$text') + " = '" + entry.text.replaceAll("'", "''") + "'";
    assert.match(executable.get(location), new RegExp(escapePattern(guard) + '\\s*' + escapePattern(assignment)),
      `${location}: ${role} success dialogue stays directly under its current success guard`);
  }
});

test('saved lesson definition is refreshed before it is reused', () => {
  const value = body('interaction');
  const reset = value.indexOf("code_defined['interaction_lesson_tentacles'] = 0");
  const definition = value.indexOf("if code_defined['interaction_lesson_tentacles'] = 0:");
  assert(reset >= 0 && reset < definition, 'Existing saves must reload the amended lesson template');
});

test('discovery, refusal gates, unrelated fields, and training thresholds are preserved', { skip: !process.env.JO9_BEFORE_QSP }, () => {
  const allowed = new Set(['sjm_UI_UIadds', 'interaction', 'next_day', 'end_day_screen']);
  assert.equal(doc.lines.length, baseline.lines.length);
  const allowedIndices = new Set(doc.locations.filter(l => allowed.has(l.name)).map(l => l.body));
  for (let i = 0; i < doc.lines.length; i++) if (!allowedIndices.has(i)) assert.equal(doc.lines[i], baseline.lines[i], `Unrelated QSP field ${i} changed`);
  const unchanged = body('interaction', baseline).split(/\r?\n/).filter(line => /sub_tentacles.*tentacle_size/.test(line) && /rise_difficulty|\$text\[1\] \+=/.test(line));
  assert.equal(unchanged.length, 3);
  for (const line of unchanged) assert(body('interaction').includes(line));
  for (const name of ['interaction', 'next_day']) {
    const refusal = source => body(name, source).split(/\r?\n/).filter(line => /\['res'\]\s*<\s*0|repulse|motivation_repulse/.test(line));
    assert.deepEqual(refusal(doc), refusal(baseline));
  }
});
