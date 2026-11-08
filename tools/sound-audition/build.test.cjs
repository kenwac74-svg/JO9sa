'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), vm = require('node:vm');
const { spawnSync } = require('node:child_process');
test('staged build honors repo/output options and preserves every original link and BGM row', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'jo9-sound-build-'));
  try {
    const out = path.join(temp, '청취.html');
    const run = spawnSync(process.execPath, [__dirname + '/build.cjs', '--repo', 'G:/somi/JO9sa', '--out', out], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const html = fs.readFileSync(out, 'utf8');
    const original = fs.readFileSync('G:/somi/JO9sa/tools/sound-audition/청취_목록.html', 'utf8');
    const links = value => [...value.matchAll(/<a class="snd" href="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(links(html), links(original));
    const bgmCount = [...original.matchAll(/class="bgm"/g)].length;
    assert.equal([...html.matchAll(/class="bgm"/g)].length, bgmCount);
    const keys = [...html.matchAll(/class="local-slot" data-row-key="([^"]+)"/g)].map(match => match[1]);
    assert.equal(keys.length, links(original).length + bgmCount);
    assert.equal(new Set(keys).size, keys.length);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
    assert.equal(scripts.length, 2);
    for (const script of scripts) new vm.Script(script);
  } finally {
    if (path.dirname(temp) !== os.tmpdir() || !path.basename(temp).startsWith('jo9-sound-build-')) throw new Error('unexpected temp directory');
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
