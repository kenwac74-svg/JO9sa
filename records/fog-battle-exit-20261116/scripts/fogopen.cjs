'use strict';
// Load the real save with OPENGAME, then press the "next" link (gt 'выход_из_боя') from the load hook.
const fs = require('fs');
const REPO = 'G:/somi/JO9sa', WORK = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const core = require(REPO + '/tools/text-workshop/core.cjs');
const [qsp, savePath, out] = process.argv.slice(2);
const raw = fs.readFileSync(qsp);
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(WORK + '/config.xml', out + '/config.xml');
fs.writeFileSync(out + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
if (!fs.existsSync(out + '/json')) fs.cpSync(WORK + '/json', out + '/json', { recursive: true });
fs.copyFileSync(savePath, out + '/problem.sav');
const d = core.parse(raw);
const loc = n => d.locations.find(l => l.name === n);
const marker = 'JO9_QA_FOGOPEN_COMPLETE';
{ const ad = loc('$addon'); let t = core.shift(d.lines[ad.body], 5);
  t = t.replace(/(\r?\n[ \t]*)msg '<br><center>게임이/g, "$1! msg '<br><center>게임이"); d.lines[ad.body] = core.shift(t, -5); }
const trace = (name, text) => { const l = loc(name); d.lines[l.body] = core.shift(core.shift(d.lines[l.body], 5) + '\r\n' + text, -5); };
for (const nm of ['city_screen', 'main_screen', 'interaction_screen_city', 'end_day_screen', 'special_screen'])
  if (loc(nm)) trace(nm, "msg '" + marker + " at " + nm + "'");
// after the real load hook finishes, press the link
trace('$ongload', "msg 'LOADED phase=' + str(jo9_fate['phase']) + ' res=' + $итог_боя + ' enemies=' + str(количество_врагов)\r\ngt 'выход_из_боя'");
d.lines[loc('Start').body] = core.shift("killall\r\nopengame 'problem.sav'", -5);
fs.writeFileSync(out + '/fo.qsp', core.serialize(d));
fs.writeFileSync(out + '/plan.json', JSON.stringify([{ name: 'fo', file: out + '/fo.qsp', marker: 'JO9_QA_FOGOPEN_NEVER_COMPLETE', checkpoint: 'real opengame' }], null, 2));
console.log('prepared');
