'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = require('../text-workshop/core.cjs');
const { makeFixture } = require('./test-fixture.cjs');
let registry;
try { registry = require('./registry.cjs'); } catch (error) { if (error.code !== 'MODULE_NOT_FOUND') throw error; }
const raw = makeFixture();
function inspect(bytes = raw) { assert.ok(registry?.inspect, 'registry must inspect actual source bindings'); return registry.inspect(bytes); }
function body(bytes, name) { const doc = core.parse(bytes); return core.shift(doc.lines[doc.locations.find(l => l.name === name).body], 5); }
function alter(bytes, name, old, replacement) { const doc = core.parse(bytes), loc = doc.locations.find(l => l.name === name); doc.lines[loc.body] = core.shift(core.shift(doc.lines[loc.body], 5).replace(old, replacement), -5); return core.serialize(doc); }

test('discovers five display states, six lifecycle roles, exact source locations and readonly history', () => {
  const view = inspect();
  assert.equal(view.feature.id, 'jo9.meiki');
  assert.deepEqual(view.states.map(s => s.code), [0, 1, 2, 3, 4]);
  assert.equal(view.states[4].label, '명기');
  assert.equal(view.states[4].labelFieldId, 'state.4.label');
  const chance = view.fields.find(f => f.id === 'discovery.chance');
  assert.equal(chance.value, 5);
  assert.deepEqual(chance.bindings.map(b => b.role), ['slave', 'assistant', 'room1', 'room2', 'room3', 'room4']);
  assert.ok(chance.bindings.every(b => b.location === 'jo9_meiki_state' && b.line > 1 && b.code.includes('rand(1, 100) <= 5')));
  assert.equal(view.fields.find(f => f.id === 'state.4.tooltip').bindings.length, 7);
  assert.equal(view.fields.find(f => f.id === 'grant.sub_vaginal').value, 5);
  assert.equal(view.fields.find(f => f.id === 'training.xp').value, 1);
  assert.ok(view.history.some(h => h.key === 'jo9_meiki_initialized' && h.type === 'version'));
  assert.ok(view.warnings.some(w => /추가|복제/.test(w)));
});

test('shows actual external transition trigger call sites while preserving their existing eligibility arguments', () => {
  const view = inspect(), trigger = view.transitions.find(t => t.id === 'discovery-call-sites');
  assert.ok(trigger, 'actual transition callers must be inspectable');
  assert.deepEqual(trigger.bindings.map(b => b.location), ['#dynamic', 'sex_end', 'sex_end']);
  assert.deepEqual(trigger.bindings.map(b => b.role), ['dynslave', 'slave', 'assistant']);
  assert.match(trigger.bindings[1].code, /sex\['jo9_meiki_discovery_eligible'\]/);
  const result = registry.prepare(raw, [{ id: 'discovery.chance', value: 10 }], view.hash);
  assert.equal(body(result.raw, 'sex_end'), body(raw, 'sex_end'));
  assert.equal(body(result.raw, '#dynamic'), body(raw, '#dynamic'));
});

test('changes all and only registered role values, leaves actions and unrelated repeated literals byte exact', () => {
  const view = inspect(), prepared = registry.prepare(raw, [{ id: 'discovery.chance', value: 12 }], view.hash);
  assert.equal((body(prepared.raw, 'jo9_meiki_state').match(/rand\(1, 100\) <= 12/g) || []).length, 6);
  assert.equal(body(prepared.raw, 'unrelated'), body(raw, 'unrelated'));
  const before = core.parse(raw), after = core.parse(prepared.raw);
  const changedIndex = before.locations.find(l => l.name === 'jo9_meiki_state').body;
  before.lines.forEach((line, i) => { if (i !== changedIndex) assert.equal(after.lines[i], line); });
  let reverse = prepared.raw;
  for (const edit of prepared.patch.edits.slice().reverse()) reverse = alter(reverse, edit.location, edit.new, edit.old);
  assert.deepEqual(reverse, raw);
  assert.equal(prepared.changes[0].before, 5);
  assert.equal(prepared.changes[0].after, 12);
});

test('no-op preserves bytes and typed validation rejects stale, duplicate, unknown and unsafe values', () => {
  const view = inspect();
  const result = registry.prepare(raw, [{ id: 'discovery.chance', value: 5 }], view.hash);
  assert.deepEqual(result.raw, raw);
  assert.deepEqual(result.patch.edits, []);
  assert.deepEqual(result.changes, []);
  assert.throws(() => registry.prepare(raw, [], 'stale'), /변경|hash|해시/i);
  for (const value of ['12', 101, -1, 1.5, null, NaN]) assert.throws(() => registry.prepare(raw, [{ id: 'discovery.chance', value }], view.hash));
  assert.throws(() => registry.prepare(raw, [{ id: 'missing', value: 2 }], view.hash));
  assert.throws(() => registry.prepare(raw, [{ id: 'discovery.chance', value: 2 }, { id: 'discovery.chance', value: 3 }], view.hash));
  for (const value of ['../escape.png', 'content/pic/../../escape.png', 'https://example.test/x.png', 'content/pic/x.png" onerror="x']) assert.throws(() => registry.prepare(raw, [{ id: 'state.4.icon.main', value }], view.hash));
  assert.throws(() => registry.prepare(raw, [{ id: 'state.4.tooltip', value: '<img src=x>' }], view.hash));
});

test('missing, ambiguous and inconsistent role bindings cannot become silently partial editable fields', () => {
  inspect();
  const inconsistent = alter(raw, 'jo9_meiki_state', 'rand(1, 100) <= 5', 'rand(1, 100) <= 9');
  assert.throws(() => registry.inspect(inconsistent), /일치|inconsistent/i);
  const missing = alter(raw, 'jo9_meiki_state', 'rand(1, 100) <= 5', 'rand(1, 50) <= 5');
  assert.throws(() => registry.inspect(missing), /누락|missing|연결/i);
  const ambiguous = alter(raw, 'jo9_meiki_state', 'rand(1, 100) <= 5', 'rand(1, 100) <= 5:\n if rand(1, 100) <= 5');
  assert.throws(() => registry.inspect(ambiguous), /여러|중복|ambiguous|연결/i);
});

test('saved dynamic XP changes refresh the existing cache guard once without touching actor histories', () => {
  const view = inspect(), result = registry.prepare(raw, [{ id: 'training.xp', value: 4 }], view.hash);
  assert.match(body(result.raw, '#dynamic'), /subskill_xp>> \+= 4/);
  assert.match(body(result.raw, '$newloc'), /if jo9_meiki_revision < 4:\n jo9_meiki_revision = 4/);
  assert.equal(body(result.raw, 'jo9_meiki_state'), body(raw, 'jo9_meiki_state'));
  assert.ok(result.changes.some(c => c.id === 'cache.revision' && c.before === 3 && c.after === 4));
  assert.ok(result.patch.edits.some(e => e.location === '$newloc'));
});

test('display names refresh only their saved label slot and later edits keep the cache binding consistent', () => {
  const view = inspect(), first = registry.prepare(raw, [{ id: 'state.4.label', value: "새 '표시'" }], view.hash);
  assert.match(body(first.raw, '#variative'), /\$virginity\[4\] = '새 ''표시'''/);
  assert.match(body(first.raw, '$newloc'), /\$virginity\[4\] = '새 ''표시'''/);
  assert.doesNotMatch(body(first.raw, '$newloc'), /gs '#variative'/);
  assert.equal(body(first.raw, 'jo9_meiki_state'), body(raw, 'jo9_meiki_state'));
  const secondView = registry.inspect(first.raw);
  const second = registry.prepare(first.raw, [{ id: 'state.4.label', value: '두 번째 이름' }], secondView.hash);
  assert.equal((body(second.raw, '$newloc').match(/\$virginity\[4\] =/g) || []).length, 1);
  assert.match(body(second.raw, '$newloc'), /jo9_meiki_revision < 5/);
  assert.equal(registry.inspect(second.raw).fields.find(f => f.id === 'state.4.label').value, '두 번째 이름');
});

test('refuses cached-definition edits when the existing refresh guard cannot be verified', () => {
  const missing = alter(raw, '$newloc', " gs '#dynamic'", " ! refresh missing");
  const view = inspect(missing);
  assert.throws(() => registry.prepare(missing, [{ id: 'training.xp', value: 2 }], view.hash), /캐시|cache|갱신/i);
});

test('new cached label slots preserve literal replacement tokens and subsequent no-op keeps cache revision', () => {
  const first = registry.prepare(raw, [{ id: 'state.4.label', value: '검토 표시' }], inspect().hash);
  const view = registry.inspect(first.raw);
  const next = registry.prepare(first.raw, [{ id: 'state.3.label', value: "값 $& $` $' $$" }, { id: 'training.xp', value: 3 }], view.hash);
  const inspected = registry.inspect(next.raw);
  assert.equal(inspected.fields.find(f => f.id === 'state.3.label').value, "값 $& $` $' $$");
  assert.equal(inspected.fields.find(f => f.id === 'state.4.label').value, '검토 표시');
  assert.equal(body(next.raw, 'unrelated'), body(raw, 'unrelated'));
  assert.match(body(next.raw, '$newloc'), /jo9_meiki_revision < 5/);
  const noop = registry.prepare(next.raw, [{ id: 'training.xp', value: 3 }, { id: 'state.4.label', value: '검토 표시' }], inspected.hash);
  assert.equal(noop.raw, next.raw);
  assert.deepEqual(noop.patch.edits, []);
});

test('nested or conditional cache setup is refused instead of inserting scoped refresh under another condition', () => {
  const nested = alter(raw, '$newloc', " gs '#dynamic'", " gs '#dynamic'\n if another_condition = 1:\n  other = 2\n end");
  const view = inspect(nested);
  assert.throws(() => registry.prepare(nested, [{ id: 'state.4.label', value: '후보 표시' }], view.hash), /캐시|cache|갱신/i);
});

test('literal marker words inside labels cannot be confused with editor-owned source comments', () => {
  const value = '! JO9_STATE_EDITOR_LABEL_CACHE_BEGIN / ! JO9_STATE_EDITOR_LABEL_CACHE_END';
  const first = registry.prepare(raw, [{ id: 'state.4.label', value }], inspect().hash);
  const next = registry.prepare(first.raw, [{ id: 'state.3.label', value: '다른 슬롯' }], registry.inspect(first.raw).hash);
  const view = registry.inspect(next.raw);
  assert.equal(view.fields.find(f => f.id === 'state.4.label').value, value);
  assert.equal(view.fields.find(f => f.id === 'state.3.label').value, '다른 슬롯');
});

test('tooltip and both icon families edit exact UI attributes while labels, role conditions and other code stay intact', () => {
  const view = inspect(), result = registry.prepare(raw, [{ id: 'state.4.tooltip', value: "검토 '툴팁'" }, { id: 'state.4.icon.main', value: 'content/pic/ui/review-main.png' }, { id: 'state.4.icon.room', value: 'content\\pic\\ui\\review-room.png' }], view.hash);
  const changed = registry.inspect(result.raw);
  assert.equal(changed.fields.find(f => f.id === 'state.4.tooltip').value, "검토 '툴팁'");
  assert.equal(changed.fields.find(f => f.id === 'state.4.tooltip').bindings.length, 7);
  assert.equal((body(result.raw, 'sjm_UI_UIadds').match(/review-main.png/g) || []).length, 2);
  assert.equal((body(result.raw, 'slave_private_room1').match(/review-room.png/g) || []).length, 1);
  assert.equal(body(result.raw, '#variative'), body(raw, '#variative'));
  assert.equal(body(result.raw, '$newloc'), body(raw, '$newloc'));
  assert.equal(body(result.raw, 'jo9_meiki_state'), body(raw, 'jo9_meiki_state'));
  assert.equal(body(result.raw, 'unrelated'), body(raw, 'unrelated'));
});

test('explicit cache recovery refreshes all five current labels from original source without value changes or actor history writes', () => {
  const view = inspect(), result = registry.prepare(raw, [], view.hash, { refreshCache: true, cacheRevision: 100 });
  assert.notEqual(result.afterHash, view.hash);
  assert.equal(result.patch.edits.length, 1);
  assert.equal(result.patch.edits[0].location, '$newloc');
  assert.match(body(result.raw, '$newloc'), /jo9_meiki_revision < 100/);
  assert.match(body(result.raw, '$newloc'), /jo9_meiki_revision = 100/);
  assert.equal((body(result.raw, '$newloc').match(/\$virginity\[[0-4]\] =/g) || []).length, 5);
  assert.deepEqual(registry.inspect(result.raw).fields.map(f => [f.id, f.value]), view.fields.map(f => [f.id, f.value]));
  assert.equal(body(result.raw, 'jo9_meiki_state'), body(raw, 'jo9_meiki_state'));
  assert.equal(body(result.raw, '#dynamic'), body(raw, '#dynamic'));
  assert.equal(body(result.raw, '#variative'), body(raw, '#variative'));
  assert.ok(result.changes.some(c => c.id === 'cache.revision' && c.before === 3 && c.after === 100));
  const labels = result.changes.find(c => c.id === 'cache.labels');
  assert.ok(labels);
  assert.equal(labels.bindings.length, 5);
  assert.match(labels.after, /명기/);
  let reversed = result.raw;
  for (const edit of result.patch.edits.slice().reverse()) reversed = alter(reversed, edit.location, edit.new, edit.old);
  assert.deepEqual(reversed, raw);
});

test('cache revision floors prevent restored-source version reuse while normal no-op remains byte exact', () => {
  const original = inspect();
  const first = registry.prepare(raw, [{ id: 'state.4.label', value: '첫 표시' }, { id: 'training.xp', value: 2 }], original.hash, { cacheRevision: 700 });
  assert.match(body(first.raw, '$newloc'), /jo9_meiki_revision < 700/);
  const second = registry.prepare(first.raw, [{ id: 'state.4.label', value: '다음 표시' }], registry.inspect(first.raw).hash, { cacheRevision: 600 });
  assert.match(body(second.raw, '$newloc'), /jo9_meiki_revision < 701/);
  const restoredRecovery = registry.prepare(raw, [], original.hash, { refreshCache: true, cacheRevision: 702 });
  assert.match(body(restoredRecovery.raw, '$newloc'), /jo9_meiki_revision < 702/);
  assert.match(body(restoredRecovery.raw, '$newloc'), /\$virginity\[4\] = '명기'/);
  const third = registry.prepare(restoredRecovery.raw, [{ id: 'state.4.label', value: '복구 후 표시' }], registry.inspect(restoredRecovery.raw).hash, { refreshCache: true, cacheRevision: 703 });
  assert.equal((body(third.raw, '$newloc').match(/\$virginity\[[0-4]\] =/g) || []).length, 5);
  assert.equal(registry.inspect(third.raw).states[4].label, '복구 후 표시');
  const noop = registry.prepare(third.raw, [], registry.inspect(third.raw).hash, { cacheRevision: 800 });
  assert.equal(noop.raw, third.raw);
  assert.deepEqual(noop.changes, []);
  let reversed = third.raw;
  for (const edit of third.patch.edits.slice().reverse()) reversed = alter(reversed, edit.location, edit.new, edit.old);
  assert.deepEqual(reversed, restoredRecovery.raw);
});

test('malformed cache options are rejected even for an otherwise empty edit list', () => {
  const view = inspect();
  for (const options of [null, [], true, 3, new Date(), { refreshCache: 'true' }, { refreshCache: 1 }, { cacheRevision: '100' }, { cacheRevision: -1 }, { cacheRevision: 1.5 }, { cacheRevision: 2147483647 }, { cacheRevision: NaN }, { refreshCache: true, extra: 1 }]) assert.throws(() => registry.prepare(raw, [], view.hash, options), /옵션|버전|cache|캐시/i);
  const noop = registry.prepare(raw, [], view.hash, { refreshCache: false, cacheRevision: 0 });
  assert.equal(noop.raw, raw);
});

const generationAnchor = '!PREPARE TRAIT LIST FOR DISPLAY (NOT EVERYTHING IS VISIBLE BEFORE ACQUISITION)';
test('generation defaults to original rules with actual state-name select options and byte exact no-op', () => {
  const view = inspect(), field = view.fields.find(f => f.id === 'generation.milf.state');
  assert.ok(field, 'mature generation must be an actual registered source rule');
  assert.equal(field.kind, 'select');
  assert.equal(field.group, '생성 초기값');
  assert.equal(field.value, -1);
  assert.deepEqual(field.options.map(o => o.value), [-1, 0, 1, 2, 3]);
  assert.equal(field.options[0].label, '기존 생성 규칙 유지');
  assert.ok(field.options[4].label.includes(view.states[3].label));
  assert.equal(field.bindings[0].location, 'generate_stock');
  assert.match(field.help, /특수|고유/);
  assert.match(field.help, /퀘스트|의뢰/);
  assert.match(field.help, /이력/);
  const result = registry.prepare(raw, [{ id: field.id, value: -1 }], view.hash);
  assert.equal(result.raw, raw);
  assert.deepEqual(result.patch.edits, []);
});

test('users can identify a generation state by its familiar icon description as well as its current display name', () => {
  const view = inspect(), field = view.fields.find(f => f.id === 'generation.milf.state');
  const enlarged = field.options.find(option => option.label.includes('크게 늘어난 상태'));
  assert.ok(enlarged, 'the familiar icon description must identify its matching generation option');
  assert.equal(enlarged.value, 3);
  assert.ok(enlarged.label.includes('상태 삼'));
  const renamed = registry.prepare(raw, [{ id: 'state.3.label', value: '새 표시 이름' }, { id: 'state.3.tooltip', value: '새 아이콘 설명' }], view.hash);
  const current = registry.inspect(renamed.raw).fields.find(f => f.id === 'generation.milf.state');
  const identified = current.options.find(option => option.label.includes('새 아이콘 설명'));
  assert.equal(identified.value, 3);
  assert.ok(identified.label.includes('새 표시 이름'));
  assert.equal(current.value, -1);
  assert.equal(body(renamed.raw, 'generate_stock'), body(raw, 'generate_stock'));
});

test('mature initial state applies after existing calculations to ordinary new stock only and removes exactly to original bytes', () => {
  const view = inspect(), originalBody = body(raw, 'generate_stock');
  const first = registry.prepare(raw, [{ id: 'generation.milf.state', value: 3 }], view.hash);
  const text = body(first.raw, 'generate_stock');
  assert.match(text, /if special_stock = 0 and stock\['age'\] = CONST_INT\['milf_age'\]: stock\['virginity'\] = 3/);
  assert.ok(text.indexOf('JO9_STATE_EDITOR_MILF_INITIAL_BEGIN') > text.indexOf('dynamic $replace($dyn_calc_slave_attrs'));
  assert.ok(text.indexOf('JO9_STATE_EDITOR_MILF_INITIAL_END') < text.indexOf(generationAnchor));
  assert.equal(body(first.raw, '$newloc'), body(raw, '$newloc'));
  assert.equal(body(first.raw, 'jo9_meiki_state'), body(raw, 'jo9_meiki_state'));
  assert.equal(first.patch.edits.length, 1);
  assert.equal(first.patch.edits[0].location, 'generate_stock');
  assert.deepEqual(first.changes.map(c => c.id), ['generation.milf.state']);
  const next = registry.prepare(first.raw, [{ id: 'generation.milf.state', value: 1 }], registry.inspect(first.raw).hash);
  assert.equal(registry.inspect(next.raw).fields.find(f => f.id === 'generation.milf.state').value, 1);
  assert.equal((body(next.raw, 'generate_stock').match(/JO9_STATE_EDITOR_MILF_INITIAL_BEGIN/g) || []).length, 1);
  const disabled = registry.prepare(next.raw, [{ id: 'generation.milf.state', value: -1 }], registry.inspect(next.raw).hash);
  assert.equal(body(disabled.raw, 'generate_stock'), originalBody);
  assert.deepEqual(disabled.raw, raw);
  for (const result of [first, next, disabled]) {
    let reversed = result.raw;
    for (const edit of result.patch.edits.slice().reverse()) {
      assert.equal(body(reversed, edit.location).split(edit.new).length - 1, 1);
      reversed = alter(reversed, edit.location, edit.new, edit.old);
    }
    assert.deepEqual(reversed, result === first ? raw : result === next ? first.raw : next.raw);
  }
});

test('generation rejects unregistered select values and damaged, ambiguous or moved source rules', () => {
  const view = inspect();
  for (const value of [-2, 4, 99, '3', 2.5, null, NaN]) assert.throws(() => registry.prepare(raw, [{ id: 'generation.milf.state', value }], view.hash));
  const active = registry.prepare(raw, [{ id: 'generation.milf.state', value: 3 }], view.hash).raw;
  for (const [before, after] of [
    [generationAnchor, generationAnchor + '\n' + generationAnchor],
    [generationAnchor, '! missing anchor'],
    ['! JO9_STATE_EDITOR_MILF_INITIAL_END', '! JO9_STATE_EDITOR_MILF_INITIAL_BAD'],
    ['! JO9_STATE_EDITOR_MILF_INITIAL_BEGIN', '! JO9_STATE_EDITOR_MILF_INITIAL_BEGIN\n! JO9_STATE_EDITOR_MILF_INITIAL_BEGIN'],
    ["stock['virginity'] = 3", "stock['virginity'] = 4"],
    ['if special_stock = 0 and', 'if special_stock >= 0 and'],
    ['! JO9_STATE_EDITOR_MILF_INITIAL_END', "other = 10\n! JO9_STATE_EDITOR_MILF_INITIAL_END"],
    [generationAnchor, "other = 10\n" + generationAnchor],
  ]) assert.throws(() => registry.inspect(alter(active, 'generate_stock', before, after)), /생성|initial|연결|블록/i);
  assert.throws(() => registry.inspect(alter(raw, 'generate_stock', "\nspecial_stock = 0", "\nspecial_stock = 0\nstock['virginity'] = 2")), /생성|연결/i);
});

test('generation is visibly unsupported when its source location is absent while other registered fields remain usable', () => {
  inspect();
  const doc = core.parse(raw), source = doc.locations.find(l => l.name === 'generate_stock');
  doc.lines[source.desc - 1] = core.shift('unsupported_generator', -5);
  const bytes = core.serialize(doc), view = registry.inspect(bytes);
  assert.ok(!view.fields.some(f => f.id === 'generation.milf.state'));
  assert.ok(view.warnings.some(w => /생성/.test(w)));
  assert.equal(view.fields.find(f => f.id === 'discovery.chance').value, 5);
  assert.throws(() => registry.prepare(bytes, [{ id: 'generation.milf.state', value: 3 }], view.hash));
});

const realPaths = ['G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp', 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'];
test('real installed QSP candidates reverse to every original byte while installed files remain untouched', { skip: !realPaths.every(p => fs.existsSync(p)) }, () => {
  inspect();
  for (const filename of realPaths) {
    const bytes = fs.readFileSync(filename), view = registry.inspect(bytes);
    const edits = view.fields.map(field => ({ id: field.id, value: field.kind === 'select' ? 3 : field.kind === 'number' ? field.value + (field.value === field.max ? -1 : 1) : field.kind === 'icon' ? field.value.replace(/\.png$/i, '-review.png') : field.value + ' 검토' }));
    const result = registry.prepare(bytes, edits, view.hash);
    assert.equal(result.changes.length, 32);
    let reversed = result.raw;
    for (const edit of result.patch.edits.slice().reverse()) {
      const oldBody = body(reversed, edit.location);
      assert.equal(oldBody.split(edit.new).length - 1, 1);
      reversed = alter(reversed, edit.location, edit.new, edit.old);
    }
    assert.deepEqual(reversed, bytes);
    assert.deepEqual(fs.readFileSync(filename), bytes);
  }
});
