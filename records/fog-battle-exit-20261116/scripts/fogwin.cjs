'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const REPO = 'G:/somi/JO9sa', WORK = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const core = require(REPO + '/tools/text-workshop/core.cjs');
const codec = require(REPO + '/tools/qa/save-codec.cjs');
const gate = require(REPO + '/tools/qa/release-check.cjs');
const qsp = process.argv[2], savePath = process.argv[3], out = process.argv[4];
const enemies = (process.argv[5] || 'ogre').split(',');
const diff = process.argv[6] || '';
const raw = fs.readFileSync(qsp), save = codec.parse(fs.readFileSync(savePath));
const prime = gate.primeState(save).code;
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(WORK + '/config.xml', out + '/config.xml');
fs.writeFileSync(out + '/FastQSP.ini', '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
if (!fs.existsSync(out + '/json')) fs.cpSync(WORK + '/json', out + '/json', { recursive: true });
const plan = [];
for (const [i0, en] of enemies.entries()) {
  const d = core.parse(raw);
  const loc = n => d.locations.find(l => l.name === n);
  const idx = 'e' + String.fromCharCode(97 + i0); const marker = 'JO9_QA_FOGWIN_' + idx.toUpperCase() + '_COMPLETE';
  const setup = prime + (process.env.ONGL ? "\r\ngs '$ongload'" : '') + "\r\ngs 'refresh_database'\r\nis_home=0\r\ncity_district=1\r\nmenu_form=0\r\n" + diff +
    "$итог_боя='победа'\r\nколичество_врагов=1\r\nkillvar '$враг'\r\n$враг[1]='" + en + "'\r\nздоровье_врага[1]=0\r\nвыносливость_врага[1]=0\r\ncombatant=0\r\n" +
    "макс_здоровье_игрока=40\r\nздоровье_игрока=30\r\nмакс_выносливость_игрока=40\r\nвыносливость_игрока=30\r\nдух_игрока=10\r\nнорм_дух_игрока=10\r\n$fight_return=''\r\n$return_lock='credits'\r\njo9_fate['mode']=0\r\n";
  { // silence the save-version upgrade notice that would otherwise block the harness
    const ad = loc('$addon'); let t = core.shift(d.lines[ad.body], 5);
    t = t.replace(/(\r?\n[ \t]*)msg '<br><center>게임이/g, "$1! msg '<br><center>게임이");
    d.lines[ad.body] = core.shift(t, -5);
  }
  if (process.env.INSTR && process.env.INSTR !== 'TRIES') {
    const ex = loc('выход_из_боя'); let t = core.shift(d.lines[ex.body], 5);
    const rep = (a, b) => { if (!t.includes(a)) throw Error('instr anchor ' + a); t = t.replace(a, b); };
    if (process.env.INSTR === 'A') rep('\t:won_slave_calc', "\tmsg 'PROBE_A before girl loop'\r\n\t:won_slave_calc");
    if (process.env.INSTR === 'B') rep("\t$return_lock = 'interaction_city'\r\n\tinteraction_city = 61120", "\tmsg 'PROBE_B after girl loop'\r\n\t$return_lock = 'interaction_city'\r\n\tinteraction_city = 61120");
    if (process.env.INSTR === 'C') rep("!Reset and set vars - crushboss", "msg 'PROBE_C before reset/newloc'\r\n!Reset and set vars - crushboss");
    if (process.env.INSTR === 'COUNT') { rep("\tgs 'generate_stock'\r\n\tif slave_base_price < won_slave_minimum_value: jump 'won_slave_calc'", "\tgs 'generate_stock'\r\n\twon_loop_n += 1\r\n\tif slave_base_price < won_slave_minimum_value: jump 'won_slave_calc'"); }
    if (process.env.INSTR === 'D') rep("gs '$newloc'\r\ngt '<<$return_lock>>'", "msg 'PROBE_D before newloc'\r\ngs '$newloc'\r\nmsg 'PROBE_E after newloc rl='+$return_lock\r\ngt '<<$return_lock>>'");
    if (process.env.ANCH) { const a = process.env.ANCH.replace(/\\t/g, '\t'); rep(a, "msg 'PROBE_" + process.env.INSTR + "'\r\n" + a); }
    d.lines[ex.body] = core.shift(t, -5);
  }
  d.lines[loc('Start').body] = core.shift(setup + (process.env.CALL ? process.env.CALL.replace(/\n/g, '\r\n') : "gt 'выход_из_боя'"), -5);
  for (const nm of ['credits', 'interaction_screen_city']) {
    const end = loc(nm);
    d.lines[end.body] = core.shift(core.shift(d.lines[end.body], 5) + (process.env.INSTR === 'TRIES' ? "\r\nmsg 'TRIES=' + str(jo9_won_tries) + ' price=' + str(slave_base_price)" : process.env.INSTR === 'COUNT' ? "\r\nmsg 'LOOPS=' + str(won_loop_n) + ' price=' + str(slave_base_price)" : '') + "\r\nmsg '" + marker + "'", -5);
  }
  const file = out + '/' + idx + '.qsp';
  fs.writeFileSync(file, core.serialize(d));
  plan.push({ name: idx, file, marker, checkpoint: 'fog victory exit ' + en });
}
fs.writeFileSync(out + '/plan.json', JSON.stringify(plan, null, 2));
console.log('prepared', plan.map(p => p.name).join(','));
