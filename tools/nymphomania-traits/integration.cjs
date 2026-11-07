'use strict';

const assert = require('node:assert/strict');

function applyTraitIntegration({ body, edit, lines, append }) {
  function replace(name, pattern, update) {
    const matches = [...body(name).matchAll(new RegExp(pattern.source, pattern.flags.replace('g', '') + 'g'))];
    assert.equal(matches.length, 1, name + ': ' + pattern);
    const found = matches[0];
    edit(name, found[0], update(found[0], ...found.slice(1)));
  }

  replace('jo9_chaotic', /^([ \t]*)if jo9ceactor\['nymphomania'\] = -1:/m,
    (_, indent) => indent + "if jo9ceactor['nymphomania'] < 0:");
  replace('jo9_chaotic', /^([ \t]*)\$jo9_chaotic_keys\[jo9_chaotic_count\] = 'nymphomania'\r\n[ \t]*\$jo9_chaotic_labels\[jo9_chaotic_count\] = '불감증'/m,
    (_, indent) => lines(
      indent + "$jo9_chaotic_keys[jo9_chaotic_count] = iif(jo9ceactor['nymphomania'] < -1, 'jo9_stone_treatment', 'nymphomania')",
      indent + "$jo9_chaotic_labels[jo9_chaotic_count] = iif(jo9ceactor['nymphomania'] < -1, '석녀', '불감증')"));
  replace('jo9_chaotic', /^if \$jo9_chaotic_mode = 'count': result = jo9_chaotic_count & exit/m, original => lines(
    'if jo9_chaotic_count = 0:',
    ' dynamic $replace({',
    "  if jo9ceactor['nymphomania'] > 1:",
    "   $jo9_chaotic_keys[0] = 'jo9_addiction_treatment'",
    "   $jo9_chaotic_labels[0] = '정액 중독'",
    "   $jo9_chaotic_xps[0] = ''",
    '   jo9_chaotic_count = 1',
    '  end',
    " }, 'jo9ceactor', $jo9_chaotic_role)",
    'end',
    original));
  replace('jo9_chaotic', /^([ \t]*)if \$args\[0\] = 'jo9_attention':\r\n/m, (_, indent) => lines(
    indent + "if $args[0] = 'jo9_addiction_treatment':",
    indent + " jo9ceactor['nymphomania'] = 1",
    indent + " jo9ceactor['nymphomania_revealed'] = 2",
    indent + " jo9ceactor['jo9_nymph_no_upgrade'] = 1",
    indent + " jo9ceactor['jo9_addiction_high_days'] = 0",
    indent + " jo9ceactor['jo9_addiction_pending_loss'] = 0",
    indent + " jo9ceactor['jo9_nymph_relief_day'] = 0",
    indent + " jo9ceactor['jo9_nymph_relief_pending'] = 0",
    indent + "elseif $args[0] = 'jo9_stone_treatment':",
    indent + " jo9ceactor['nymphomania'] = -1",
    indent + " jo9ceactor['nymphomania_revealed'] = 2",
    indent + " jo9ceactor['nymphomania_xp'] = 0",
    indent + " jo9ceactor['jo9_frigid_days'] = 0",
    indent + 'else',
    indent + "if $args[0] = 'jo9_attention':",
    ''));
  replace('jo9_chaotic', /^}, 'jo9ceactor', \$jo9_chaotic_role\), \$jo9_chaotic_selected, \$jo9_chaotic_selected_xp/m,
    original => lines(' end', original));
  replace('jo9_chaotic', /^([ \t]*)msg '카오틱 에센스를 사용해 <<\$jo9_chaotic_removed>> 특성을 제거했습니다\. 남은 수량: <<chaotic_essence>>개\.'/m,
    (original, indent) => lines(
      indent + "if $jo9_chaotic_removed = '정액 중독':",
      indent + " msg '카오틱 에센스로 정액 중독을 색정광으로 완화했습니다. 남은 수량: <<chaotic_essence>>개.'",
      indent + "elseif $jo9_chaotic_removed = '석녀':",
      indent + " msg '카오틱 에센스로 석녀를 불감증으로 완화했습니다. 남은 수량: <<chaotic_essence>>개.'",
      indent + 'else',
      ' ' + original,
      indent + 'end'));

  const descriptionRows = [
    "$jo9_nymph_addiction_text = '[정액 중독]<br>색정광의 상위 특성이다. 흥분도가 더 빨리 오르며 해소하면 그날의 기분과 활동에 보너스를 받는다. 최고 흥분도가 오래 이어지면 기분과 행동력 회복이 나빠진다.'",
    "$jo9_nymph_stone_text = '[석녀]<br>흥분도는 0에 고정된다. 훈련과 경험은 쌓이지만 성적 상호작용을 통해 주인과의 친밀감이 오르지 않는다.'",
  ];
  for (const name of ['#static_txt', '#txt_woman']) {
    replace(name, /^\$Нимфоманка = [^\r\n]*/m, original => lines(original, ...descriptionRows));
  }
  replace('#static_base', /^([ \t]*)if dynslave\['nymphomania_xp'\] > 200 and dynslave\['nymphomania'\] < 1: [^\r\n]*/m,
    (original) => original.replace("dynslave['nymphomania'] < 1", "dynslave['nymphomania'] >= -1 and dynslave['nymphomania'] < 1"));
  replace('#static_base', /^([ \t]*)if dynslave\['nymphomania'\] > 0: msg '<<\$Нимфоманка>>'\r\n[ \t]*if dynslave\['nymphomania'\] < 0: msg '<<\$Фригидная>>'/m,
    (_, indent) => lines(
      indent + "if dynslave['nymphomania'] > 1: msg $jo9_nymph_addiction_text",
      indent + "if dynslave['nymphomania'] = 1: msg $Нимфоманка",
      indent + "if dynslave['nymphomania'] = -1: msg $Фригидная",
      indent + "if dynslave['nymphomania'] < -1: msg $jo9_nymph_stone_text"));
  replace('#static_base', /^([ \t]*)if dynslave\['nymphomania'\] > 0 and \(dynslave\['nymphomania_revealed'\] = 2 or spell_revelio = 1\):\r\n[ \t]*\$dynslave_features_list \+= [^\r\n]+\r\n[ \t]*end\r\n[ \t]*if dynslave\['nymphomania'\] < 0 and \(dynslave\['nymphomania_revealed'\] = 2 or spell_revelio = 1\):\r\n[ \t]*\$dynslave_features_list \+= [^\r\n]+\r\n[ \t]*end/m,
    (original, indent) => lines(
      indent + "if dynslave['nymphomania'] > 1 and (dynslave['nymphomania_revealed'] = 2 or spell_revelio = 1):",
      indent + " $dynslave_features_list += '<a href=\"EXEC: msg $jo9_nymph_addiction_text\"><<dyneval($vb_cycle_skill, 5, \"정액 중독\")>></a><br>'",
      indent + 'end',
      original.replace("dynslave['nymphomania'] > 0", "dynslave['nymphomania'] = 1").replace("dynslave['nymphomania'] < 0", "dynslave['nymphomania'] = -1"),
      indent + "if dynslave['nymphomania'] < -1 and (dynslave['nymphomania_revealed'] = 2 or spell_revelio = 1):",
      indent + " $dynslave_features_list += '<a href=\"EXEC: msg $jo9_nymph_stone_text\"><<dyneval($vb_cycle_skill, 0, \"석녀\")>></a><br>'",
      indent + 'end'));
  replace('#static_base', /^[ \t]*elseif dynslave\['nymphomania'\] > 1 and dynslave\['arousal'\] > 0:\r\n[ \t]*dynslave\['neg_horny'\] = 100\r\n/m, () => '');
  replace('#static_base', /^([ \t]*)! keep mood within \[-5, \+5\] range/m, (original, indent) => lines(
    indent + "if dynslave['nymphomania'] > 1:",
    indent + " if dynslave['jo9_nymph_relief_day'] = day + 1:",
    indent + "  dynslave['mood'] += 2",
    indent + "  $dynslave_mood_list[] = '욕구를 해소해 기분이 좋아졌다.'",
    indent + ' end',
    indent + " if dynslave['arousal'] >= 5 and arrpos('$barn_slave_characters', 'dynslave') = -1 and arrpos('$iced_slave_characters', 'dynslave') = -1:",
    indent + "  local jo9_nymph_mood_penalty = iif(dynslave['jo9_addiction_high_days'] >= 12, 3, iif(dynslave['jo9_addiction_high_days'] >= 6, 2, iif(dynslave['jo9_addiction_high_days'] >= 3, 1, 0)))",
    indent + '  if jo9_nymph_mood_penalty > 0:',
    indent + "   dynslave['mood'] -= jo9_nymph_mood_penalty",
    indent + "   $dynslave_mood_list[] = '욕구가 오래 해소되지 않아 기분이 나빠졌다.'",
    indent + '  end',
    indent + ' end',
    indent + 'end',
    original));

  replace('interaction_result', /^([ \t]*)if dynslave\['nymphomania'\] < 0: rise_mod \+= -2/m,
    original => original.replace(' < 0:', ' = -1:'));
  replace('interaction_result', /^([ \t]*)if dynslave\['nymphomania'\] = 2: rise_mod \+= 2/m,
    original => original.replace(' = 2:', ' > 1:'));
  replace('slave_stat', /^([ \t]*)if slave\["masturbation_rule"\] = 1:/m, (original, indent) => lines(
    indent + "if slave['nymphomania'] > 1:",
    indent + " *p '<div id=\"chekbox_12r\"><img src=\"content/pic/ui/buttons/legacy/sel_button.png\" title=\"정액 중독 특성에 따른 자위 금지\"></div>'",
    original.replace('if slave', 'elseif slave')));
  replace('interaction_city', /slave\["nymphomania"\] = 1 and slave\["beauty"\] > 3/,
    original => original.replace(' = 1 ', ' >= 1 '));
  replace('master_love', /slave1\["nymphomania"\] = 1/, original => original.replace(' = 1', ' >= 1'));
  replace('master_love', /slave1\["nymphomania"\] = -1/, original => original.replace(' = -1', ' <= -1'));
}

module.exports = { applyTraitIntegration };
