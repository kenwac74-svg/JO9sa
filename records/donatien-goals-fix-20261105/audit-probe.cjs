'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const path = require('node:path');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const vendor = 'G:/Codex/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/fog-relay-startup-fix-20261017/legacy-engine-probe/package';
const { initQspEngine } = require(vendor + '/dist/node/wasm-engine.cjs');
const sources = [
  ['original', 'G:/somi/JO9O/game/jack.qsp'],
  ['source_20261001', 'G:/somi/JO9sa/source/jack_2026-10-01.qsp'],
  ['WORK_patch_r3', 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'],
];
const body = (doc, name) => core.shift(doc.lines[doc.locations.find(l => l.name === name).body], 5);
const encode = s => core.shift(s, -5);
(async () => {
  const observations = [];
  for (const [label, file] of sources) {
    const doc = core.parse(fs.readFileSync(file));
    const city = body(doc, 'interaction_city');
    const branch = city.match(/IF interaction_city = 217:[\s\S]*?\r?\nEND/i)[0];
    const a = branch.indexOf('$quest_description[5] =');
    const b = branch.indexOf('txt_count = 5', a);
    assert(a >= 0 && b > a);
    const assignmentAndStandaloneBack = branch.slice(a, b);
    const homeReset = body(doc, 'menu_form').split(/\r?\n/).find(s => /^\s*quest_description_mode\s*=\s*0\s*$/i.test(s));
    assert(homeReset);
    const streetHasReset = /quest_description_mode/.test(body(doc, 'city_menu_form'));
    assert.equal(streetHasReset, false);
    const locs = [
      ['Start', ''],
      ['qa_capture', assignmentAndStandaloneBack],
      ['$quest_list', body(doc, '$quest_list')],
      ['qa_home_reset', homeReset],
      ['snk_room_bridge', ''],
    ];
    const fixture = Buffer.from(['QSPGAME', '', '', encode(String(locs.length)), ...locs.flatMap(([n, s]) => [encode(n), '', encode(s), encode('0')]), ''].join('\r\n'), 'utf16le');
    const api = await initQspEngine(vendor + '/dist/qsp-engine.wasm');
    const errors = [];
    api.on('error', e => errors.push(e));
    for (const ev of ['msg', 'input', 'wait', 'play_file', 'close_file', 'is_play', 'version', 'menu']) api.on(ev, (...args) => {
      const cb = args.find(v => typeof v === 'function');
      if (cb) cb(ev === 'input' ? '' : ev === 'is_play' ? false : ev === 'version' ? '5.7.0' : -1);
    });
    api.openGame(fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength), true);
    api.execCode("$master_name='QA'\r\n$rating[8]='S'\r\n$quest[5]='QA_OBJECTIVE_LIST'\r\nactive[$quest[5]]=1\r\nsnk_room_target=0\r\nis_perv=0\r\ngs 'qa_capture'\r\n$qa_desc=$quest_description[5]\r\nchoosen_quest=5\r\nquest_description_mode=1\r\ngs '$quest_list'\r\n$qa_open=$quest_list");
    const description = api.readVariable('$qa_desc');
    const opened = api.readVariable('$qa_open');
    assert.equal(typeof description, 'string');
    assert.equal(description.includes('quest_description_mode = 0'), false);
    assert.equal(opened.trim(), description.trim());
    api.execCode("gs '$quest_list'\r\n$qa_street=$quest_list");
    assert.equal(api.readVariable('quest_description_mode'), 1);
    assert.equal(api.readVariable('$qa_street'), opened);
    api.execCode("gs 'qa_home_reset'\r\ngs '$quest_list'\r\n$qa_home=$quest_list");
    assert.equal(api.readVariable('quest_description_mode'), 0);
    assert(api.readVariable('$qa_home').includes('QA_OBJECTIVE_LIST'));
    assert.equal(errors.length, 0, JSON.stringify(errors));
    observations.push({ label, file, sha256: doc.hash, descriptionContainsBack: false, streetHasReset, streetRetainsDetail: true, homeResetRestoresList: true, engineErrors: 0 });
  }
  const result = { status: 'REPRODUCED_IN_ORIGINAL_AND_WORK', observations, gameExeRuns: 0, productionFilesChanged: false, limits: ['The WASM probe uses the unchanged quest assignment, quest list body, and home reset statement. It isolates UI presentation and other game locations; it is not a rendered client test.'] };
  fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
