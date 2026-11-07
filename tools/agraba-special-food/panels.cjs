'use strict';

const assert = require('node:assert/strict');
const crlf = '\r\n';
const rows = (...items) => items.join(crlf);
const assistant = 'assistant_stat';
const foodLabels = ['주류', '숙성 치즈/버터', '시리얼/곡물류', '허브류/향신료',
  '신선한 야채류', '크림', '달걀', '우유', '다진고기', '보통 살코기'];
const missionLabels = ['가내 회계', '연금술 명령', '요리 명령', '특별요리 명령', '잡일과 청소 명령',
  '촉수 착정 명령', '수행 보조', '주인 씻기기', '노예 씻기기', '절정 금지'];

function fragment(src, start, end) {
  const from = src.indexOf(start);
  const to = src.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, 'Missing assistant panel anchors: ' + start);
  return src.slice(from, to);
}

function labelRow(top, label, right = false) {
  return `\t*p '<div style="position:absolute;${right ? 'right:0' : 'left:4px'};top:${top - 35}px;line-height:25px;white-space:nowrap">${label}</div>'`;
}

function moveBox(src, id, top) {
  const anchor = `<div id="${id}">`;
  assert.ok(src.includes(anchor), 'Missing assistant checkbox: ' + id);
  return src.replaceAll(anchor, `<div id="${id}" style="top:${top}px">`);
}

function patchPanels({edit, text, append}) {
  const source = text(assistant);
  const oldAppearance = fragment(source, '\t!assistant alternate appearances', "\tkillvar '$assistant_appearance'");
  const heading = (label, top) => `<div style="position:absolute;right:0;top:${top - 35}px;line-height:25px">${label}</div>`;
  const report = heading('- 보고 -', 508);
  let newAppearance = oldAppearance
    .replace(/<div id="right_padding">- 임무 -[^\r\n]*?<\/div>/g,
      original => '<div id="right_padding">- 임무 -' + (original.includes('- 외형 -') ? heading('- 외형 -', 362) : '') + report + '</div>')
    .replace('<div id="assistant_appear"><br>', '<div id="assistant_appear" style="top:392px">')
    .replaceAll("$assistant_appearance += '<br>'", "! Keep the unused appearance row empty.");
  for (const [caption, offset] of [['알몸', 0], ['하녀', 30], ['비서', 60], ['교복', 60], ['도미나', 90]]) {
    const original = `${caption} : &nbsp<br><span style="display:block; height:8px;"></span>`;
    assert.ok(newAppearance.includes(original), 'Missing appearance label: ' + caption);
    newAppearance = newAppearance.replace(original,
      `<div style="position:absolute;right:0;top:${offset}px;line-height:25px">${caption} : &nbsp;</div>`);
  }
  for (let i = 10; i <= 13; ++i) newAppearance = moveBox(newAppearance, `chekbox_${i}r`, 392 + 30 * (i - 10));
  edit(assistant, oldAppearance, newAppearance, 'Keep appearance and report rows clear of the extra mission row');

  const oldLabels = fragment(source,
    '*p \'<div style ="line-height:71%;font-family:Sandoll 미생;font-size:22px;" id="right_rules">\'',
    '\tif assistant["account_rule"] = 1:');
  const newLabels = rows(
    '*p \'<div style="font-size:22px" id="right_rules">\'',
    ...missionLabels.map((label, i) => labelRow(62 + 30 * i, label, true)),
    labelRow(535, '침묵 유지', true),
    labelRow(567, '주인과 동침', true),
    labelRow(595, '노예강간 허가', true),
    "\t*p '</div>'", '', '');
  edit(assistant, oldLabels, newLabels, 'Align mission labels with their own checkbox rows');

  const oldMissionBoxes = fragment(source, '\tif assistant["cleans_rule"] = 1:',
    '\tif assistant_quiet_rule = 1:');
  let shifted = oldMissionBoxes;
  for (let i = 4; i <= 9; ++i) shifted = moveBox(shifted, `chekbox_${i}r`, 62 + i * 30);
  const specialBox = '<div id="jo9_special_cooks_rule" style="position:absolute;left:1012px;top:152px;width:25px;height:25px">';
  const button = (action, image) =>
    `\t\t*p '${specialBox}<a href = "EXEC: ${action} & gt $curloc"><img src="content/pic/ui/buttons/legacy/${image}_button.png"></a></div>'`;
  edit(assistant, oldMissionBoxes, rows(
    '\tif kitchen <= 0:',
    button('msg $no_kitchen', 'unactive'),
    '\telseif assistant["special_cooks_rule"] = 1:',
    button("assistant[''special_cooks_rule''] = 0 & $info_text = ''특별요리 명령을 해제했다.''", 'sel'),
    '\telse',
    button("assistant[''special_cooks_rule''] = 1 & $info_text = ''조수가 요리할 때 특별 식재료를 사용한다.''", 'unsel'),
    '\tend', '', shifted
  ), 'Add the opt-in special cooking checkbox below ordinary cooking');

  const oldFood = fragment(source, '\t*p \'<div id="left_padding"><div style="line-height: 0.4;"',
    '\tif sparks > 50:');
  const [calculator] = oldFood.split(crlf).filter(line => line.includes('id="chekbox_133l"'));
  const [reset] = oldFood.split(crlf).filter(line => line.includes('dynamic $reset_assistant_rules,0'));
  assert.ok(calculator && reset, 'Missing calculator or role reset');
  edit(assistant, oldFood, rows(
    '\t*p \'<div id="left_padding"><div style="position:absolute;left:4px;top:8px;white-space:nowrap">식재료 받아오기</div></div>\'',
    calculator,
    '\t*p \'<div id="left_rules" style="font-size:22px">\'',
    ...foodLabels.map((label, i) => labelRow(77 + 30 * i, label)),
    labelRow(395, reset.slice(reset.indexOf('<a'), reset.indexOf('</div>'))),
    labelRow(598, '남은 칼로리: <<iif(assistant["calories"] > 0, "+", "")>><<assistant["calories"]*100>> cal'),
    "\t*p '</div>'", '', ''
  ), 'Use one ten-row grocery list and retain reset and calorie controls');

  const oldFoodBoxes = fragment(source, '\tif sparks > 50:' + crlf + '\t\tif assistant["buy_alcohol"]',
    '\t!조수 아기마크');
  const foodIds = ['1l', '2l', '3l', '4l', '5l', '6l_a', '7l_a', '8l_a', '10l_a', '11l_a'];
  const newFoodBoxes = foodIds.reduce((code, suffix, i) => {
    const top = 77 + 30 * i;
    return i < 5 ? code : moveBox(code, 'chekbox_' + suffix, top);
  }, oldFoodBoxes);
  edit(assistant, oldFoodBoxes, newFoodBoxes, 'Align the existing grocery controls without changing eligibility');

  edit('#dynamic',
    rows("\tassistant['cooks_rule'] = args[0]", "\tassistant['washes_master_rule'] = args[0]"),
    rows("\tassistant['cooks_rule'] = args[0]", "\tassistant['special_cooks_rule'] = 0",
      "\tassistant['washes_master_rule'] = args[0]"),
    'Keep special ingredients opt-in when assistant roles are reset');

  edit('master_stat',
    rows("if kitchen > 0 or jo9_agraba_stock['fruit'] > 0 or jo9_agraba_stock['wine'] > 0:",
      " if kitchen > 0: $left_text_list += '<br>'",
      ' $left_text_list += \'신선한 과일 *<<jo9_agraba_stock["fruit"]>><br>아그라바 와인 *<<jo9_agraba_stock["wine"]>><br>\''),
    rows("if kitchen > 0 or jo9_agraba_stock['fruit'] > 0 or jo9_agraba_stock['wine'] > 0 or jo9_agraba_stock['premium_virgin_meat'] > 0:",
      " if kitchen > 0: $left_text_list += '<br>'",
      ' $left_text_list += \'신선한 과일 *<<jo9_agraba_stock["fruit"]>><br>아그라바 와인 *<<jo9_agraba_stock["wine"]>><br>특등급 처녀고기 *<<jo9_agraba_stock["premium_virgin_meat"]>><br>\''),
    'Show premium meat separately from the legacy recipe ingredient');

  append('jo9_agraba_food_reward', rows(
    '! Future acquisition events can grant a twelve-portion bundle explicitly.',
    "if $args[0] = 'premium_virgin_meat':",
    "\tjo9_agraba_stock['premium_virgin_meat'] += 12",
    'end', ''
  ));
}

module.exports = {patchPanels};
