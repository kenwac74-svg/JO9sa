'use strict';
const fs = require('node:fs');
const path = require('node:path');
const CRLF = '\r\n';
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8').trimEnd().replace(/\r?\n/g, CRLF);
const code = lines => lines.join(CRLF);
const value = (role, key) => "func('jo9_traits', 'activity_value', '" + role + "', '" + key + "')";

function apply(ctx) {
  const edit = (location, old, replacement, count = 1) => ctx.edit(location, old, replacement, count);
  function range(location, start, end, replace) {
    const body = ctx.get(location), from = body.indexOf(start), to = body.indexOf(end, from + start.length);
    if (from < 0 || to < 0) throw Error('Missing activity range ' + location + ': ' + start);
    const old = body.slice(from, to);
    edit(location, old, typeof replace === 'function' ? replace(old) : replace);
  }
  const marker = '! JO9 MOD START TRAIT_NAMES_DEFERRAL_JO_TRAITS';
  edit('jo9_traits', marker, read('activity-modes.qsrc') + CRLF + marker);
  const content = ctx.get('jo9_traits').split(CRLF).find(s => s.trimStart().startsWith("if $args[1] = 'content':"));
  if (!content) throw Error('Legacy content description missing');
  edit('jo9_traits', content, content + CRLF + code([
    "  if $args[1] = 'activity_active': $result = '활동적: 하루 두 번째 업무·교육부터 수행할 때마다 기분 누적값 +2. 휴식 보상과 노예 마사지의 보상 효과는 절반이며, 휴식 보상을 탐탁지 않게 여긴다. 성향을 발견한 뒤에는 푹 쉰 기분 효과를 얻지 않는다.'",
    "  if $args[1] = 'activity_passive': $result = '휴식 선호: 하루 두 번째 업무·교육부터 수행할 때마다 기분 누적값 -2. 휴식 보상과 노예 마사지의 보상 효과는 두 배이며, 휴식 보상을 기꺼이 받아들인다.'",
  ]));
  range('jo9_traits',
    "  if dynslave['jo9_work_ethic'] = 1 and dynslave['jo9_work_ethic_known']",
    "  if dynslave['jo9_focus'] = 1",
    old => code([
      "   if func('jo9_traits', 'activity_compatible', 'dynslave') = 1:",
      "    if func('jo9_traits', 'activity_known', 'dynslave') = 1 or spell_revelio = 1:",
      "     if func('jo9_traits', 'activity_sign', 'dynslave') = 1: $result += '<a href=\"EXEC: gs ''jo9_traits'', ''describe'', ''activity_active''\">활동적</a><br>'",
      "     if func('jo9_traits', 'activity_sign', 'dynslave') = -1: $result += '<a href=\"EXEC: gs ''jo9_traits'', ''describe'', ''activity_passive''\">휴식 선호</a><br>'",
      '    end',
      '   else',
      old.trimEnd(),
      '   end', '',
    ]));
  const positiveRoll = " if jo9_trait_registry_roll <= 10: stock['jo9_work_ethic'] = 1";
  edit('jo9_traits', positiveRoll,
    " if jo9_trait_registry_roll <= 10 and func('jo9_traits', 'allow', 'stock', 'jo9_work_ethic', 1) = 1: stock['jo9_work_ethic'] = 1");
  const negativeRoll = " if jo9_trait_registry_roll > 10 and jo9_trait_registry_roll <= 20: stock['jo9_work_ethic'] = -1";
  edit('jo9_traits', negativeRoll, negativeRoll + CRLF + " gs 'jo9_traits', 'activity_generate', 'stock'");
  const editorGuard = '! JO9 MOD START SLAVE_NATURE_EDITOR_GUARD';
  edit('jo9_traits', editorGuard, code([
    "if $args[0] = 'edit' and ($args[2] = 'jo9_work_ethic' or $args[2] = 'passion_comfort'):",
    " gs 'jo9_traits', 'activity_edit', $args[1], $args[2], args[3]",
    " gs 'jo9_traits_value', 'refresh', $args[1]",
    ' exit',
    'end',
  ]) + CRLF + editorGuard);
  range('jo9_traits',
    "  $setting_display += '<div id=\"under_cheats\"><a href=\"EXEC: gs ''jo9_traits'', ''edit'', ''dynslave'', ''jo9_work_ethic'', 1",
    "  $setting_display += '<div id=\"under_cheats\"><a href=\"EXEC: gs ''jo9_traits'', ''edit'', ''dynslave'', ''jo9_focus'', 1",
    read('activity-editor.qsrc') + CRLF);
  range('menu_form',
    '\tif slave["passion_comfort"]  = 1:',
    '\tif slave["passion_luxury"]  = 1:',
    '\t! Activity controls are supplied once by jo9_traits editor.' + CRLF);

  edit('jo9_traits_personality',
    " if jo9actor['jo9_work_ethic'] = 1 or jo9actor['jo9_work_ethic'] = -1:",
    " local j9av_work = " + value('jo9actor', 'jo9_work_ethic') + CRLF +
      ' if j9av_work = 1 or j9av_work = -1:');
  edit('jo9_traits_personality', "jo9actor_rate['mood'] += 2 * jo9actor['jo9_work_ethic']",
    "jo9actor_rate['mood'] += 2 * j9av_work");
  edit('chose_answer', "slave['passion_comfort']", value('slave', 'passion_comfort'), 2);
  edit('interaction',
    "\t\tif slave['passion_comfort'] ! 0 and slave['passion_comfort_revealed'] = 0: slave['passion_comfort_revealed'] = 1",
    "\t\tgs 'jo9_traits', 'activity_reveal', 'slave'");
  edit('interaction', "slave['passion_comfort']", value('slave', 'passion_comfort'), 2);
  edit('interaction',
    ' if assistant["passion_comfort"] ! 0 and assistant["passion_comfort_revealed"] = 0: assistant["passion_comfort_revealed"] = 1',
    " gs 'jo9_traits', 'activity_reveal', 'assistant'");
  edit('interaction_result',
    "\tif slave['passion_comfort'] ! 0 and slave['passion_comfort_revealed'] = 0: slave['passion_comfort_revealed'] = 1",
    "\tgs 'jo9_traits', 'activity_reveal', 'slave'");
  edit('interaction_result', "slave['passion_comfort']", value('slave', 'passion_comfort'), 4);
  range('#static_base',
    "\t\tif dynslave['passion_comfort_revealed'] = 1 and dynslave['passion_comfort'] ! 0:",
    "\t\tif dynslave['passion_luxury_revealed'] = 1",
    "\t\tgs 'jo9_traits', 'activity_discover', 'dynslave'" + CRLF + CRLF);
  range('#static_base',
    "        if dynslave['passion_comfort'] = 1 and",
    "        if dynslave['passion_luxury'] = 1 and",
    old => code([
      "        if func('jo9_traits', 'activity_compatible', 'dynslave') = 1:",
      "            if func('jo9_traits', 'activity_sign', 'dynslave') = 1 and func('jo9_traits', 'activity_known', 'dynslave') = 1: dynslave['pos_well_rested'] = 0",
      '        else',
      old.trimEnd(),
      '        end', '',
    ]));
  range('jo9_chaotic',
    " if jo9ceactor['jo9_work_ethic'] = -1:",
    " if jo9ceactor['jo9_focus'] = -1:",
    code([
      " if func('jo9_traits', 'activity_compatible', 'jo9ceactor') = 1 and func('jo9_traits', 'activity_sign', 'jo9ceactor') = -1:",
      "  $jo9_chaotic_keys[jo9_chaotic_count] = 'jo9_activity'",
      "  $jo9_chaotic_labels[jo9_chaotic_count] = '휴식 선호'",
      "  $jo9_chaotic_xps[jo9_chaotic_count] = ''",
      '  jo9_chaotic_count += 1',
      " elseif func('jo9_traits', 'activity_compatible', 'jo9ceactor') = 0 and jo9ceactor['jo9_work_ethic'] = -1:",
      "  $jo9_chaotic_keys[jo9_chaotic_count] = 'jo9_work_ethic'",
      "  $jo9_chaotic_labels[jo9_chaotic_count] = '안분지족'",
      "  $jo9_chaotic_xps[jo9_chaotic_count] = ''",
      '  jo9_chaotic_count += 1',
      ' end', '',
    ]));
  edit('jo9_chaotic', " jo9ceactor[$args[0]] = 0", code([
    " if $args[0] = 'jo9_activity':",
    "  gs 'jo9_traits', 'activity_remove', 'jo9ceactor'",
    ' else',
    "  jo9ceactor[$args[0]] = 0",
    ' end',
  ]));
}

module.exports = {apply};
