'use strict';
// Read-only input audit. Write disposable Start-only probes; never run the client here.
const fs = require('node:fs');
const path = require('node:path');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa = require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const savecodec = require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const fixtures = require('G:/somi/JO9sa/records/disposition-traits-20261023/scripts/check-acquisition.cjs');
const source = process.argv[3] || 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const expectedHash = process.argv[4] || '5aeff11fffe6e5f2523749987577f42dab870f4d0adee0df385375f9eefb074f';
const output = process.argv[2] || 'G:/Codex/tmp/jo9-full-audit-20261023/traits';
const raw = fs.readFileSync(source), doc = core.parse(raw);
if (core.hash(raw) !== expectedHash) throw Error('WORK drifted');
if (!core.serialize(doc).equals(raw)) throw Error('Input roundtrip');
const stateFile = 'G:/somi/Jack O Nine Tails v2.4_work/game/save/UI_TEST_MENU.sav';
const stateRaw = fs.readFileSync(stateFile);
const primed = qa.primeState(savecodec.parse(stateRaw));
const loc = name => { const a = doc.locations.filter(l => l.name === name); if (a.length !== 1) throw Error(name); return a[0]; };
const watch = ['jo9_traits', 'stock_to_slave_nogt', 'expert_to_slave', '#static_base'];
const hashes = Object.fromEntries(watch.map(n => [n, core.hash(Buffer.from(core.shift(doc.lines[loc(n).body], 5), 'utf8'))]));
const common = ['killall', 'settimer 0', primed.code, "$counter=''", "$onnewloc=''", "$ongload=''",
  "gs 'refresh_database'", "$counter=''", "$onnewloc=''", "$ongload=''", 'settimer 0',
  'sound_on=0', 'nsfw=0', 'wizard_mode=0', 'no_mindbreak=0', 'game_difficulty=2', 'difficulty_setting=1',
  'cheat_h=0', 'cheat_j=0', 'cheat_k=0', 'cheat_l=0', 'creating_clone=0', 'get_girl=0',
  'qa_failures=0', 'qa_failfast=0', "$qa_errors=''", "$qa_observed=''", 'is_home=1', 'city_form=0'];
const plan = [], manifest = [];
fs.mkdirSync(output, {recursive: true});
for (const route of ['stock', 'expert']) for (const kind of ['clean', 'messy', 'ugly', 'dirty']) {
  const f = fixtures.fixture({age: 1, ego: 1, pride: 1, temper: 1, intellect: 2});
  const name = 'gap-' + route + '-' + kind, marker = 'JO9_QA_MOODGAP_' + route + '_' + kind + '_COMPLETE';
  const code = [...common, ...f.code,
    "stock['age']=CONST_INT['young_age']",
    "stock['neg_slave']=1+stock['pride']+stock['temper']+stock['ego']+stock['intellect']-stock['rational']-stock['custom']",
    "stock['neg_fear']=0", "stock['neg_angst']=0", "stock['neg_naked']=0", "stock['neg_ugly']=0",
    "stock['neg_slave_dirty']=0", "stock['neg_slave_mess']=0", "stock['sub_exhibit']=0",
    "stock['mood']=0", "stock_rate['mood']=0", 'house_mess=0',
    "stock['scars']=0", "stock_rate['scars']=0", "stock['hygiene']=0", "stock_rate['hygiene']=0"];
  if (kind === 'messy') code.push('house_mess=4');
  if (kind === 'ugly') code.push("stock['beauty']=0", "stock_rate['beauty']=0", "stock['scars']=1", "stock_rate['scars']=10");
  if (kind === 'dirty') code.push("stock['hygiene']=5", "stock_rate['hygiene']=160");
  code.push(...fixtures.acquire(route));
  const snapshot = stage => [
    `$qa_observed += '${stage}:mood='+$str(slave['mood'])+',obedience='+$str(slave['obedience'])+',status='+$slave_psy_status+',mood_rate='+$str(slave_rate['mood'])+';'`,
    `if $slave_psy_status ! 'obedient' or slave['obedience']<5 or slave['mood']<0: qa_failures+=1`,
  ];
  code.push(...snapshot('acquisition'));
  for (let n = 1; n <= 2; n++) code.push("dynamic $replace($newloc_update_slave,'dyn'+'slave','slave')", ...snapshot('later' + n));
  // A visible exact diagnostic reports each value. The standard runner records it as a failure;
  // the diagnostic log is the evidence, and a clean case receives the ordinary completion marker.
  code.push(`if qa_failures>0: msg 'JO9_QA_ASSERT_MOODGAP_${route}_${kind}|'+$qa_observed & exit`, `msg '${marker}'`);
  const d = core.parse(raw);
  d.lines[loc('Start').body] = core.shift(code.join('\r\n'), -5);
  for (const n of watch) if (core.hash(Buffer.from(core.shift(d.lines[loc(n).body], 5), 'utf8')) !== hashes[n]) throw Error('Native source changed: ' + n);
  const bytes = core.serialize(d); qa.inspectWorld(bytes);
  const file = path.join(output, name + '.qsp'); fs.writeFileSync(file, bytes);
  plan.push({name, file, marker, checkpoint: 'Immediate and two later native refreshes; ' + kind + ' environment'});
  manifest.push({name, sha256: core.hash(bytes), sourceHash: expectedHash});
}
fs.writeFileSync(path.join(output, 'mood-gap-plan.json'), JSON.stringify(plan, null, 2));
fs.writeFileSync(path.join(output, 'mood-gap-prepared.json'), JSON.stringify({source, sourceHash:expectedHash, stateFile, stateSha256:core.hash(stateRaw), sourceLocations:hashes, fixtures:manifest, writes:'Only Start-only fixture QSPs and diagnostic manifests in output; no engine launch'}, null, 2));
console.log(JSON.stringify({plan:path.join(output, 'mood-gap-plan.json'), probes:plan.length, sourceHash:expectedHash}));
