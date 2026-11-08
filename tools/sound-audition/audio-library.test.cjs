'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const api = fs.existsSync(__dirname + '/audio-library.cjs') ? require('./audio-library.cjs') : {};
const need = key => { assert.equal(typeof api[key], 'function', 'missing feature: ' + key); return api[key]; };
const sound = (name, relativePath = name, size = 123, lastModified = 7) => ({ name, webkitRelativePath: relativePath, size, lastModified, type: '' });

test('audio filter accepts supported extensions case-insensitively without admitting unrelated files', () => {
  const isAudio = need('isAudio');
  assert.equal(isAudio(sound('SONG.WAV')), true);
  assert.equal(isAudio({ name: 'sound', type: 'audio/ogg' }), true);
  assert.equal(isAudio(sound('cover.png')), false);
  assert.equal(isAudio(sound('notes.wav.txt')), false);
});

test('folder matching uses exact case-insensitive filenames and reports duplicate basenames', () => {
  const match = need('matchFile');
  const a = sound('Town.WAV', 'Music/Town.WAV'), b = sound('town.wav', 'Extras/town.wav');
  assert.equal(match('town.wav', [a]).file, a);
  assert.equal(match('TOWN.wav', [a, b]).status, 'ambiguous');
  assert.equal(match('town.wav', [sound('downtown.wav')]).status, 'missing');
});

test('relative paths disambiguate matching without falling back to a different directory', () => {
  const match = need('matchFile');
  const a = sound('Town.WAV', 'Music/Town.WAV'), b = sound('town.wav', 'Extras/town.wav');
  assert.equal(match('music/town.wav', [a, b]).file, a);
  assert.equal(match('Other/town.wav', [a, b]).status, 'missing');
});

test('saved metadata restores names and assignments without storing audio bytes or live object URLs', () => {
  const describe = need('describeFile'), restore = need('restoreState');
  const file = { ...sound('Song.wav', 'Library/Song.wav'), bytes: 'large payload', url: 'blob:old', handle: {} };
  const meta = describe(file);
  const state = restore({ version: 1, files: [{ ...meta, bytes: 'large payload', url: 'blob:old' }], assignments: { row1: meta.id }, audioBytes: 'bad' });
  assert.equal(state.files[0].relativePath, 'Library/Song.wav');
  assert.equal(state.assignments.row1, meta.id);
  assert.equal(JSON.stringify(state).includes('large payload'), false);
  assert.equal(JSON.stringify(state).includes('blob:old'), false);
  assert.equal(JSON.stringify(state).includes('handle'), false);
});

test('an explicit replacement wins over automatic BGM matching and survives unavailable file restoration', () => {
  const describe = need('describeFile'), choose = need('rowSource');
  const automatic = sound('Town.wav'), chosen = sound('Mine.wav');
  const id = describe(chosen).id;
  const state = { files: [describe(chosen)], assignments: { town: id } };
  const row = { key: 'town', filename: 'Town.wav', baseline: 'file:///Town.wav' };
  assert.equal(choose(row, state, [automatic, chosen]).file, chosen);
  assert.equal(choose(row, state, [automatic]).status, 'unavailable');
  assert.equal(choose(row, { files: [], assignments: {} }, [automatic]).file, automatic);
  assert.equal(choose(row, { files: [], assignments: {} }, []).src, 'file:///Town.wav');
});

test('assignment replacement and reset preserve other rows and restore baseline behavior', () => {
  const describe = need('describeFile'), assign = need('assignRow'), choose = need('rowSource');
  const first = sound('A.wav'), second = sound('B.wav');
  let state = { files: [describe(first), describe(second)], assignments: { other: describe(first).id } };
  state = assign(state, 'row1', describe(first).id);
  state = assign(state, 'row1', describe(second).id);
  assert.equal(choose({ key: 'row1' }, state, [first, second]).file, second);
  state = assign(state, 'row1', null);
  assert.equal(state.assignments.other, describe(first).id);
  assert.equal(choose({ key: 'row1', baseline: 'file:///original.wav' }, state, []).src, 'file:///original.wav');
});

test('script JSON cannot close an inline script and round-trips unusual filenames', () => {
  const encode = need('scriptJson');
  const value = { name: '</script><script>bad()</script>&\u2028한글.wav' };
  const encoded = encode(value);
  assert.equal(/<\/script/i.test(encoded), false);
  assert.deepEqual(JSON.parse(encoded), value);
  const context = {};
  vm.runInNewContext('value=' + encoded, context);
  assert.equal(context.value.name, value.name);
});

test('review status is mutually exclusive, toggles clear, and survives file assignment changes', () => {
  const toggle = need('toggleReview'), assign = need('assignRow'), describe = need('describeFile');
  const meta = describe(sound('A.wav'));
  let state = { files: [meta], assignments: {}, reviews: {} };
  state = toggle(state, 'candidate:a', 'remake');
  state = toggle(state, 'candidate:a', 'adopted');
  state = assign(state, 'candidate:a', meta.id);
  assert.deepEqual(state.reviews, { 'candidate:a': 'adopted' });
  assert.equal(state.assignments['candidate:a'], meta.id);
  state = toggle(state, 'candidate:a', 'adopted');
  assert.deepEqual(state.reviews, {});
});

test('review restoration retains stable entry IDs and excludes unknown status values', () => {
  const restore = need('restoreState');
  const saved = JSON.stringify({ files: [], assignments: {}, reviews: { 'candidate:https://example.test/a': 'hold', 'bgm:Town.wav': 'adopted', bad: 'deleted' } });
  assert.deepEqual(restore(JSON.parse(saved)).reviews, { 'candidate:https://example.test/a': 'hold', 'bgm:Town.wav': 'adopted' });
});

test('importing another library removes unlisted live files from automatic BGM resolution', () => {
  const restore = need('restoreState'), available = need('filesForState'), choose = need('rowSource');
  const oldFile = sound('Town.wav');
  const imported = restore({ version: 1, files: [], assignments: {}, reviews: {} });
  const remaining = available(imported, [oldFile]);
  assert.equal(remaining.length, 0);
  assert.equal(choose({ key: 'town', filename: 'Town.wav', baseline: 'file:///default.wav' }, imported, remaining).src, 'file:///default.wav');
});

test('indistinguishable added files never silently replace the first selected bytes', () => {
  const merge = need('mergeFiles');
  const first = { ...sound('Town.wav'), marker: 'first bytes' };
  const different = { ...sound('Town.wav'), marker: 'other bytes' };
  const combined = merge([first], [different]);
  assert.equal(combined.files.length, 1);
  assert.equal(combined.files[0], first);
  assert.equal(combined.added.length, 0);
  assert.equal(combined.collisions.length, 1);
  const folderA = sound('Town.wav', 'A/Town.wav'), folderB = sound('Town.wav', 'B/Town.wav');
  assert.equal(merge([], [folderA, folderB]).files.length, 2);
});
