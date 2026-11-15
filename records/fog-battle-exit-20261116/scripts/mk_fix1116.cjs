const fs = require('fs');
const c = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d = c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
const text = n => c.shift(d.lines[d.locations.find(x => x.name === n).body], 5);
const NL = '\r\n';
const edits = [];
const E = (loc, old, nw, id) => {
  const t = text(loc);
  const n = t.split(old).length - 1;
  if (n !== 1) throw new Error(id + ': found ' + n + ' in ' + loc);
  edits.push({ location: loc, field: 'body', old, new: nw, count: 1, patchId: id });
};
// 1) fog battle exit: a save that already started leaving the battle (phase 3, result cleared) no longer dead-ends
E('выход_из_боя', " if jo9_fate['phase'] = 3: exit" + NL,
  " if jo9_fate['phase'] = 3:" + NL +
  "  ! JO9 MOD START BATTLE_EXIT_REENTRY_20261116" + NL +
  "  ! The exit already ran (result cleared) but the battle screen is still shown, e.g. a save made at that moment: leave the battle instead of doing nothing." + NL +
  "  ! Fog battles only (mode 1). Arena, colosseum and catfight results read this state, and a stored return target could replay a finished event, so those are left alone." + NL +
  "  if $итог_боя = '' and jo9_fate['mode'] = 1:" + NL +
  "   jo9_fate['mode'] = 0" + NL +
  "   jo9_fate['phase'] = 0" + NL +
  "   $return_lock = iif(is_home = 1, 'main_screen', 'city_menu_form')" + NL +
  "   gs '$combat_variable_reset'" + NL +
  "   gs '$newloc'" + NL +
  "   gt '<<$return_lock>>'" + NL +
  "  end" + NL +
  "  ! JO9 MOD END BATTLE_EXIT_REENTRY_20261116" + NL +
  "  exit" + NL +
  " end" + NL, 'BATTLE_EXIT_REENTRY_20261116');
// 2) the meal list is rebuilt from scratch on every database refresh instead of growing by 76 entries each time
E('#food_base', "!FOOD DATABASE" + NL,
  "!FOOD DATABASE" + NL +
  "! JO9 MOD START FOOD_BASE_NO_LEAK_20261116" + NL +
  "! The list is rebuilt below on every refresh; without this reset each load appended another copy (an old save held 28804 entries instead of 76)." + NL +
  "killvar '$meal_id'" + NL +
  "! JO9 MOD END FOOD_BASE_NO_LEAK_20261116" + NL, 'FOOD_BASE_NO_LEAK_20261116');
fs.writeFileSync(process.argv[2], JSON.stringify({
  id: '2026-11-16_battle_exit_reentry_and_meal_leak', status: 'APPROVED',
  description: '(1) 안개 전투 나가기(выход_из_боя)가 이미 시작된 세이브(phase 3, 결과 비어 있음)에서 아무것도 안 하고 끝나던 문제: 전투를 정리하고 원래 화면으로 이동. (2) #food_base가 $meal_id를 비우지 않고 76개씩 덧붙여 세이브가 커지고 로드가 느려지던 문제: 시작 때 목록을 비움.',
  before_sha256: process.argv[3], after_sha256: '', edits
}, null, 2), 'utf8');
console.log('edits', edits.length);
