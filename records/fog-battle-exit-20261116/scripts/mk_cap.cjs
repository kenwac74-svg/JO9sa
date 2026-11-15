const fs = require('fs');
const c = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d = c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const t = c.shift(d.lines[d.locations.find(x => x.name === 'выход_из_боя').body], 5);
const NL = '\r\n';
const old = "\t:won_slave_calc" + NL + "\tgs 'generate_stock'" + NL + "\tif slave_base_price < won_slave_minimum_value: jump 'won_slave_calc'" + NL;
if (t.split(old).length !== 2) throw new Error('loop anchor not found once');
const nw = "\t! JO9 MOD START WON_SLAVE_TRY_CAP_20261116" + NL +
  "\t! The trophy girl is drawn again until she is worth the enemy minimum. Stop after 100 draws and keep the last one, so a rare minimum (300) cannot freeze the game for a long time." + NL +
  "\tjo9_won_tries = 0" + NL +
  "\t! JO9 MOD END WON_SLAVE_TRY_CAP_20261116" + NL +
  "\t:won_slave_calc" + NL +
  "\tgs 'generate_stock'" + NL +
  "\tjo9_won_tries += 1" + NL +
  "\tif slave_base_price < won_slave_minimum_value and jo9_won_tries < 100: jump 'won_slave_calc'" + NL;
fs.writeFileSync(process.argv[2], JSON.stringify({
  id: '2026-11-16_won_slave_try_cap', status: 'APPROVED',
  description: '안개 승리 전리품 여자 생성 반복(최소 가격 충족까지 generate_stock 재추첨)에 횟수 상한 100을 둔다. 상한에 이르면 마지막으로 뽑은 후보를 그대로 쓴다. 최소 가격 규칙과 보상 밸런스는 그대로, 오래 멈추는 최악 경우만 막는다.',
  before_sha256: process.argv[3], after_sha256: '',
  edits: [{ location: 'выход_из_боя', field: 'body', old, new: nw, count: 1, patchId: 'WON_SLAVE_TRY_CAP_20261116' }]
}, null, 2), 'utf8');
console.log('ok');
