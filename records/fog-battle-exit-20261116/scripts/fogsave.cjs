'use strict';
const fs = require('fs');
const REPO = 'G:/somi/JO9sa', WORK = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const core = require(REPO + '/tools/text-workshop/core.cjs');
const codec = require(REPO + '/tools/qa/save-codec.cjs');
const gate = require(REPO + '/tools/qa/release-check.cjs');
const [qsp, savePath, out, mode] = process.argv.slice(2);
const raw = fs.readFileSync(qsp), save = codec.parse(fs.readFileSync(savePath));
const prime = gate.primeState(save).code;
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(WORK + '/config.xml', out + '/config.xml');
fs.writeFileSync(out + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
if (!fs.existsSync(out + '/json')) fs.cpSync(WORK + '/json', out + '/json', { recursive: true });
const d = core.parse(raw);
const loc = n => d.locations.find(l => l.name === n);
const marker = 'JO9_QA_FOGSAVE_END_COMPLETE';
{ const ad = loc('$addon'); let t = core.shift(d.lines[ad.body], 5);
  t = t.replace(/(\r?\n[ \t]*)msg '<br><center>게임이/g, "$1! msg '<br><center>게임이"); d.lines[ad.body] = core.shift(t, -5); }
// trace points
const trace = (name, text) => { const l = loc(name); d.lines[l.body] = core.shift(core.shift(d.lines[l.body], 5) + '\r\n' + text, -5); };
const pre = (name, text) => { const l = loc(name); d.lines[l.body] = core.shift(text + '\r\n' + core.shift(d.lines[l.body], 5), -5); };
for (const nm of ['main_screen', 'interaction_screen_city', 'menu_form', 'city_menu_form', 'credits', 'end_day_screen', 'special_screen', 'shop_general', 'city_screen'])
  if (loc(nm)) trace(nm, "msg '" + marker + " at " + nm + " meals0=' + str(qa_meals0) + ' now=' + str(arrsize('$meal_id')) + ' rd=' + str(qa_rd) + ' fb=' + str(qa_fb) + ' addon=' + str(qa_ad) + ' newloc=' + str(qa_nl) + ' cm=' + str(qa_cm)");
for (const [nm, v] of [['refresh_database', 'qa_rd'], ['#food_base', 'qa_fb'], ['$addon', 'qa_ad'], ['$newloc', 'qa_nl'], ['city_menu_form', 'qa_cm'], ['city_screen', 'qa_cs']]) pre(nm, v + '+=1');
let call = process.env.STOP === 'ongload' ? "msg 'JO9_QA_FOGSAVE_END_COMPLETE'" : "qa_meals0=arrsize('$meal_id')\r\nqa_rd=0\r\nqa_fb=0\r\nqa_ad=0\r\nqa_nl=0\r\nqa_cm=0\r\ngt 'выход_из_боя'";
if (process.env.BISLOC) {
  const L = loc(process.env.BISLOC); const rows = core.shift(d.lines[L.body], 5).split(/\r?\n/);
  let dep = 0; const cand = [];
  rows.forEach((r, i) => { const s = r.trim(); const isEnd = /^end\s*$/i.test(s); if (isEnd) dep--; if (dep === 0 && s && s[0] !== '!' && s[0] !== ':' && !/^(else|elseif)\b/i.test(s) && !/^\s*end/i.test(s)) cand.push(i); if (!isEnd && /^(if|for|while|act)\b.*:\s*$/i.test(s)) dep++; });
  if (process.env.BISLIST) { console.log('LIST', rows.length, cand.length); }
  const at = cand[Number(process.env.BIS)];
  if (at !== undefined) { rows.splice(at, 0, "msg 'BIS_REACHED'"); d.lines[L.body] = core.shift(rows.join('\r\n'), -5); }
  console.log('candidates', cand.length, 'insert at row', at);
}
if (process.env.TRACEI) {
  const ex2 = loc('выход_из_боя'); let t2 = core.shift(d.lines[ex2.body], 5);
  const A2 = ["gs 'jo9_traits_combat', 'finish'", "gs 'jo9_fog_relay', 'finish'", "if is_home = 0: dynamic $city_sounds", "!Fog Battle Results and Rewards - crushboss", "!Slave won and get girl code - Overhauled - crushboss", "!Reset and set vars - crushboss", "gs '$newloc'", "gt '<<$return_lock>>'"];
  const a2 = A2[Number(process.env.TRACEI) - 1]; if (!t2.includes(a2)) throw Error('anchor ' + a2);
  t2 = t2.replace(a2, "msg 'TRACE" + process.env.TRACEI + " reached rl=' + $return_lock + ' fr=' + $fight_return + ' ic=' + str(interaction_city) + ' girl=' + str(get_girl)\r\n" + a2); d.lines[ex2.body] = core.shift(t2, -5);
}
if (mode === 'trace') {
  const ex = loc('выход_из_боя'); let t = core.shift(d.lines[ex.body], 5);
  // mark progress at several anchors (each msg is modal, so only the first is shown); use a counter variable instead
  const anchors = ["gs 'jo9_traits_combat', 'finish'", "gs 'jo9_fog_relay', 'finish'", "if is_home = 0: dynamic $city_sounds", "!Fog Battle Results and Rewards - crushboss", "!Slave won and get girl code - Overhauled - crushboss", "!Reset and set vars - crushboss"];
  anchors.forEach((a, i) => { if (!t.includes(a)) throw Error('anchor ' + a); t = t.replace(a, 'qa_trace=' + (i + 1) + '\r\n' + a); });
  d.lines[ex.body] = core.shift(t, -5);
  // error-handler: after 6 seconds the timer reports the last trace point
  call = "settimer 6000\r\n" + call;
  const tl = loc('$counter') || null;
}
const setup = prime + (process.env.SND ? "\r\nsound_on=1\r\n" : '') + "\r\ngs '$ongload'\r\nqa_trace=0\r\n" + (process.env.PHASE ? "jo9_fate['phase']=" + process.env.PHASE + "\r\n" : '');
d.lines[loc('Start').body] = core.shift(setup + call, -5);
fs.writeFileSync(out + '/fs.qsp', core.serialize(d));
fs.writeFileSync(out + '/plan.json', JSON.stringify([{ name: 'fs', file: out + '/fs.qsp', marker, checkpoint: 'saved fog victory exit' }], null, 2));
console.log('prepared', prime.split('\n').length, 'assignments');
