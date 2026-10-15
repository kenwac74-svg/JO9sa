'use strict';
const core = require('../text-workshop/core.cjs');
const ROLES = ['slave', 'assistant', 'room1', 'room2', 'room3', 'room4'];
function makeFixture({ chance = 5, label = '명기', unrelated = 'keep' } = {}) {
  const state = ROLES.map(role => `if $args[0] = '${role}' and (${role}['age'] = CONST_INT['young_age'] or ${role}['age'] = CONST_INT['milf_age']):
 if ${role}['jo9_meiki_initialized'] = 0:
  ${role}['jo9_meiki_initialized'] = 1
  ${role}['jo9_meiki_prev'] = ${role}['virginity']
 end
 if ${role}['jo9_meiki_prev'] = 0 and ${role}['virginity'] >= 2 and ${role}['jo9_meiki_checked'] = 0:
  ${role}['jo9_meiki_checked'] = 1
  if args[1] = 1:
   if rand(1, 100) <= ${chance}:
    ${role}['jo9_meiki_known'] = 1
   end
  end
 end
 if ${role}['jo9_meiki_known'] = 1 and ${role}['virginity'] >= 2:
  ${role}['virginity'] = 4
  if ${role}['jo9_meiki_initialized'] < 2:
   ${['sub_vaginal', 'sub_threesome', 'sub_dp', 'sub_tp', 'sub_gangbang', 'sub_bukkake'].map(key => `${role}['${key}'] = max(${role}['${key}'], ${key === 'sub_vaginal' ? 5 : 3})`).join('\n   ')}
   ${role}['jo9_meiki_initialized'] = 2
  end
 end
 ${role}['jo9_meiki_prev'] = ${role}['virginity']
end`).join('\n');
  const tooltips = ['처녀막 있음', '복원된 처녀막', '처녀막 없음', '크게 늘어난 상태', label];
  function ui(role, main) {
    const names = main ? ['Vir_처.png', 'Vir_restored.png', 'Vir_비.png', 'Vir_black.png', 'Vir_golden.png'] : ['Vir_Ocr.png', 'Vir_restored.png', 'Vir_Xcr.png', 'Vir_black.png', 'Vir_golden.png'];
    const prefix = 'content\\pic\\ui\\' + (main ? 'jon-UIadds\\' : '');
    return [1, 3, 4, 0, 2].map((code, i) => `${i === 0 ? 'if' : i === 4 ? 'else' : 'elseif'}${i === 4 ? '' : ` ${role}['virginity'] ${code === 0 ? '< 2' : '= ' + code}:`}\n $tmp += '<div tooltip-data="${tooltips[code]}"><img src="${prefix}${names[code]}"></div>'`).join('\n') + '\nend';
  }
  const labels = ['처녀', '복원된 처녀막', '상태 이', '상태 삼', label];
  const locations = [
    ['jo9_meiki_state', state],
    ['#variative', labels.map((value, i) => `$virginity[${i}] = '${value}'`).join('\n')],
    // A compact reference of the real generator ordering: clear/new stock,
    // preset + randomization, derived attributes, traits, price, reset.
    ['generate_stock', "dynamic $clear_slave_instance, 'stock'\nstock_state = CONST_INT['slave_exist']\ngs 'get_stock_seed'\nif special_stock = 0:\n if stock['age'] = CONST_INT['milf_age'] and rand(1,100) <= 80: stock['virginity'] = 2\n stock['service'] += rand(1,2)\nend &! end of randomization to make slaves more unique\ndynamic $replace($dyn_calc_slave_attrs, 'dyn'+'slave', 'stock')\n!PREPARE TRAIT LIST FOR DISPLAY (NOT EVERYTHING IS VISIBLE BEFORE ACQUISITION)\ngs '$stock_traits'\ngs '$slave_price', 'stock' &! original price calculation\nspecial_stock = 0"],
    ['sjm_UI_UIadds', ui('slave', true) + '\n' + ui('assistant', true)],
    ...[1, 2, 3, 4].map(i => [`slave_private_room${i}`, ui('room' + i, false)]),
    ['snk_room_menu_screen', ui('slave', false)],
    ['#dynamic', `$lesson = {\n if func('jo9_meiki_training_bonus', 'dynslave', $subskill) = 1: dynamic $replace('<<$subskill_xp>> += 1', 'slave', 'dynslave')\n gs 'jo9_meiki_state', 'dynslave', 1\n}`],
    ['sex_end', "gs 'jo9_meiki_state', 'slave', sex['jo9_meiki_discovery_eligible']\ngs 'jo9_meiki_state', 'assistant', sex['jo9_meiki_discovery_eligible']"],
    ['$newloc', "! original cache guard\nif jo9_meiki_revision < 3:\n jo9_meiki_revision = 3\n gs '#static_base'\n gs '#dynamic'\nend\ngs 'jo9_meiki_state', 'slave', 0"],
    ['slave_auction_sell', "if slave['virginity'] = 4 and txt >= 6 and txt <= 7: sell_price *= 10\n! JO9_MEIKI_MARKET_V1\n! JO9_MEIKI_MARKET_END"],
    ['$guild_auction', "! JO9_MEIKI_AUCTION_V1\nif slave['virginity'] = 4:\n local jo9_auction_base = bank_size\n bank_size *= 2\nend\n! JO9_MEIKI_AUCTION_END"],
    ['unrelated', `! ${unrelated}\n*p '명기'\nother = 5\nif rand(1, 100) <= 5: other += 1`],
  ];
  const lines = ['QSPGAME', '', core.shift('fixture', -5), core.shift(String(locations.length), -5)];
  for (const [name, body] of locations) {
    lines.push(core.shift(name, -5), core.shift('description ' + name, -5), core.shift(body, -5), core.shift('1', -5), core.shift('action.png', -5), core.shift('Action ' + unrelated, -5), core.shift("*p 'unrelated action 5'", -5));
  }
  lines.push('');
  return Buffer.from(lines.join('\r\n'), 'utf16le');
}
module.exports = { makeFixture };
