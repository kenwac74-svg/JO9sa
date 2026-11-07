'use strict';

const assert = require('node:assert/strict');

const assistantPaidThreesome = 65483;
const reaction = (value, actor = 'dynslave') =>
  `${value === 'status' ? '$' : ''}func('jo9_nymph_reaction', '${value}', '${actor}')`;

function applyIntimacy({ body, edit, lines, append }) {
  const updateTemplate = (location, name, indent, transform) => {
    const code = body(location);
    const before = code.match(new RegExp(
      `^${indent}\\$${name} = \\{\\r\\n[\\s\\S]*?^${indent}\\}`, 'm'
    ))?.[0];
    assert.ok(before, `${location} template ${name}`);
    edit(location, before, transform(before));
  };
  const replaceCount = (text, old, next, count = 1) => {
    assert.equal(text.split(old).length - 1, count, old);
    return text.replaceAll(old, () => next);
  };

  // The global interaction dispatcher computes responses for all visible
  // roles. Only participants in an eligible command receive the overlay.
  append('jo9_nymph_reaction', lines(
    "local $jo9_react_key = $args[0]",
    "local $jo9_react_actor = $args[1]",
    "if arrpos('$all_slave_characters', $jo9_react_actor) < 0: exit",
    "local jo9_react_eligible = 0",
    "if $jo9_react_actor = 'slave':",
    " jo9_react_eligible = (interaction = 5414 or interaction = 54141 or interaction = 54142 or interaction = 5415 or interaction > 0 and (interaction = menu_threesome or interaction = menu_threesome_noassistant))",
    "elseif $jo9_react_actor = 'assistant':",
    ` jo9_react_eligible = (interaction = 441 or interaction = 4411 or interaction = 4412 or interaction = 44 or interaction = ${assistantPaidThreesome} or interaction > 0 and interaction = menu_threesome)`,
    "elseif $jo9_react_actor = 'room1':",
    " jo9_react_eligible = (interaction = 1027)",
    "elseif $jo9_react_actor = 'room2':",
    " jo9_react_eligible = (interaction = 1028)",
    "elseif $jo9_react_actor = 'room3':",
    " jo9_react_eligible = (interaction = 1029)",
    "elseif $jo9_react_actor = 'room4':",
    " jo9_react_eligible = (interaction = 1030)",
    "end",
    "local $jo9_react_code = $replace({",
    " local jo9_react_moral = jo9subject['moral']",
    " local jo9_react_obedience = jo9subject['obedience']",
    " local $jo9_react_status = $jo9subject_psy_status",
    " if args[1] = 1 and jo9subject['nymphomania'] > 1 and $jo9_react_status ! 'broken' and jo9_react_moral < 5:",
    "  jo9_react_obedience += 4 * (5 - jo9_react_moral)",
    "  if difficulty_setting = 2: jo9_react_obedience += (jo9subject['obedience_difficulty'] - 6)/2",
    "  jo9_react_moral = 5",
    "  if $args[0] = 'status':",
    "   ! Derive the command reaction with moral 5 while keeping current fear, mood and personality.",
    "   local jo9_react_motivation = max(5, jo9subject['fear'], jo9subject['custom'], jo9subject['rational'], jo9subject['instinct'], jo9subject['spoil'], jo9subject['angst'], jo9subject['arousal'])",
    "   local jo9_react_hardness = max(jo9subject['ego'], jo9subject['temper'], jo9subject['spoil'], jo9subject['pride']) + jo9subject['courage']",
    "   local jo9_react_fear_threshold = jo9_react_hardness + max(0, jo9subject['mood'])",
    "   if jo9subject['courage'] = 2: jo9_react_fear_threshold = 100",
    "   $jo9_react_status = $jo9subject_psy_basic",
    "   if $jo9_react_status = 'lachrymose': $jo9_react_status = 'soft'",
    "   if jo9subject['mood'] < 0:",
    "    if $jo9subject_psy_basic = 'optimistic': $jo9_react_status = 'soft'",
    "    if jo9subject['temper'] >= jo9_react_motivation: $jo9_react_status = 'hysteric'",
    "    if jo9subject['ego'] >= jo9_react_motivation: $jo9_react_status = 'docile'",
    "    if jo9subject['pride'] >= jo9_react_motivation: $jo9_react_status = 'soft'",
    "   elseif rebell[$jo9subject_psy_basic] ! 0:",
    "    $jo9_react_status = 'reluctant'",
    "   end",
    "   if jo9subject['fear'] = jo9_react_motivation and jo9subject['fear'] >= jo9_react_fear_threshold:",
    "    $jo9_react_status = 'frightened'",
    "   elseif jo9subject['mood'] < 2 and (jo9subject['angst'] > jo9subject['temper']/3 or jo9subject['mood'] = -5):",
    "    $jo9_react_status = 'depresive'",
    "    if jo9subject['sensitivity'] >= 4 and jo9subject['mood'] < -1: $jo9_react_status = 'lachrymose'",
    "   elseif jo9_react_obedience >= jo9_react_hardness/2:",
    "    if jo9subject['spoil'] > max(jo9subject['fear'], 3):",
    "     $jo9_react_status = 'hysteric'",
    "    elseif jo9subject['mood'] >= 0:",
    "     $jo9_react_status = 'servile'",
    "     if jo9subject['spoil'] >= 3: $jo9_react_status = 'docile'",
    "     if jo9subject['arousal'] = jo9_react_motivation: $jo9_react_status = 'horny'",
    "    end",
    "   end",
    "  end",
    " end",
    " if $args[0] = 'moral':",
    "  result = jo9_react_moral",
    " elseif $args[0] = 'obedience':",
    "  result = jo9_react_obedience",
    " elseif $args[0] = 'status':",
    "  $result = $jo9_react_status",
    " end",
    "}, 'jo9subject', $jo9_react_actor)",
    "if $jo9_react_key = 'status':",
    " $result = $dyneval($jo9_react_code, $jo9_react_key, jo9_react_eligible)",
    "else",
    " result = dyneval($jo9_react_code, $jo9_react_key, jo9_react_eligible)",
    "end"
  ));

  updateTemplate('#dynamic', 'dyn_sex_acceptance', '', before => {
    let after = replaceCount(before, "dynslave['moral']", 'jo9_command_moral', 3);
    after = replaceCount(after, '$dynslave_psy_status', '$jo9_command_psy', 13);
    const anchor = "\tif dynslave_state = CONST_INT['slave_exist']:";
    return replaceCount(after, anchor, lines(
      anchor,
      "\t\tlocal jo9_command_moral = dynslave['moral']",
      "\t\tlocal $jo9_command_psy = $dynslave_psy_status",
      "\t\tif dynslave['nymphomania'] > 1:",
      `\t\t\tjo9_command_moral = ${reaction('moral')}`,
      `\t\t\t$jo9_command_psy = ${reaction('status')}`,
      '\t\tend'
    ));
  });

  const refusal = "interaction_dynslave['res'] = dynslave['obedience'] + interaction_dynslave['sex_acceptance'] - interaction_dynslave['repulse']";
  edit('#dynamic', refusal, lines(
    "local jo9_command_obedience = dynslave['obedience']",
    `\t\t\tif dynslave['nymphomania'] > 1: jo9_command_obedience = ${reaction('obedience')}`,
    '\t\t\t' + refusal.replace("dynslave['obedience']", 'jo9_command_obedience')
  ));

  updateTemplate('#dynamic', 'dyn_diligence', '', before => {
    let after = replaceCount(before, " + dynslave['moral'] + ", ' + jo9_command_moral + ');
    after = replaceCount(after, "dynslave['obedience']", 'jo9_command_obedience');
    const psyCount = after.split('$dynslave_psy_status').length - 1;
    assert.ok(psyCount > 0, 'Expected psychological diligence checks');
    after = replaceCount(after, '$dynslave_psy_status', '$jo9_command_psy', psyCount);
    const anchor = "\tif dynslave_state = CONST_INT['slave_exist']:";
    return replaceCount(after, anchor, lines(
      anchor,
      "\t\tlocal jo9_command_moral = dynslave['moral']",
      "\t\tlocal jo9_command_obedience = dynslave['obedience']",
      "\t\tlocal $jo9_command_psy = $dynslave_psy_status",
      "\t\tif dynslave['nymphomania'] > 1:",
      `\t\t\tjo9_command_moral = ${reaction('moral')}`,
      `\t\t\tjo9_command_obedience = ${reaction('obedience')}`,
      `\t\t\t$jo9_command_psy = ${reaction('status')}`,
      '\t\tend'
    ));
  });

  for (const command of ['vaginal', 'anal', 'oral']) {
    updateTemplate('interaction', 'interaction_relaxed_' + command, '\t', before => {
      let after = before;
      if (command !== 'oral') {
        after = replaceCount(after, "if dynslave['moral'] < 1: shameful", `if ${reaction('moral')} < 1: shameful`);
      }
      after = replaceCount(after, 'rebell[$dynslave_psy_status]', `rebell[${reaction('status')}]`);
      const gentle = "dynslave['pos_gentle'] = max(dynslave['pos_gentle'], 2)";
      return replaceCount(after, gentle, "if dynslave['nymphomania'] >= -1: " + gentle);
    });
  }

  for (const actor of ['slave', 'assistant']) {
    for (const key of ['moral', 'obedience']) {
      edit('sex_initiate', `sex['girl_${key}'] = ${actor}['${key}']`, `sex['girl_${key}'] = ${reaction(key, actor)}`);
    }
    const gentle = `${actor}['pos_gentle'] = max(${actor}['pos_gentle'], 2)`;
    edit('sex_interaction_result', gentle, `if ${actor}['nymphomania'] >= -1: ${gentle}`);
    const gentleWoman = `${actor}['pos_gentle'] = 1`;
    edit('sex_interaction_result_woman', gentleWoman, `if ${actor}['nymphomania'] >= -1: ${gentleWoman}`);

    const defloration = `${actor}['pride'] - ${actor}['moral']*2 - ${actor}['arousal']`;
    edit('sex_end', defloration, defloration.replace(`${actor}['moral']`, reaction('moral', actor)));
  }

  const eroticPraise = body('interaction_result').match(/^if \$interaction_type = 'praise_erotic':\r\n[\s\S]*?^end(?=\r\n)/m)?.[0];
  assert.ok(eroticPraise, 'Slave erotic praise');
  const praiseGentle = "slave['pos_gentle'] = max(slave['pos_gentle'], interaction_reward_potence)";
  const praiseMoral = "slave_rate['moral'] += max(0, min(2, (1 + interaction_reward_level)/2) - slave_already_done_today[$str(interaction)])";
  edit('interaction_result', eroticPraise, replaceCount(
    replaceCount(eroticPraise, praiseGentle, "if slave['nymphomania'] >= -1: " + praiseGentle),
    praiseMoral, "if slave['nymphomania'] >= -1: " + praiseMoral
  ));

  for (const [id, amount] of [[5608, 2], [5609, 1]]) {
    const block = body('interaction').match(new RegExp(`^IF interaction = ${id}:\\r\\n[\\s\\S]*?^END(?=\\r\\n)`, 'mi'))?.[0];
    assert.ok(block?.includes("$interaction_type = 'assistant_prise_erotic'"), 'Assistant erotic praise ' + id);
    const before = `assistant_rate["moral"] += ${amount}`;
    edit('interaction', block, replaceCount(block, before, "if assistant['nymphomania'] >= -1: " + before));
  }

  // The assistant menu used to route its paid fallback to the slave slot.
  // Share the existing paid scene while keeping the initiating actor explicit.
  const paid = body('interaction').match(/^if interaction = menu_threesome_noassistant:\r\n[\s\S]*?^end(?=\r\n)/m)?.[0];
  assert.ok(paid, 'Paid 3P scene');
  const paidScene = paid.split('\r\n').slice(1, -1).map(row => {
    if (row.includes('$subskill')) return row;
    if (row.includes("$replace($vaginally_penetrated, 'dyn'+'slave', 'slave')")) {
      return row.replace(", 'slave')", ", 'dynslave')");
    }
    return row.replace(/\bslave(?=\[|_rate\b|_name\b|, )/g, 'dynslave')
      .replaceAll("'slave'", "'dynslave'")
      .replaceAll('interaction_slave', 'interaction_dynslave')
      .replaceAll('make_slave_do', 'make_dynslave_do');
  }).join('\r\n');
  edit('interaction', paid, lines(
    "if code_defined['jo9_interaction_paid_threesome'] = 0:",
    " code_defined['jo9_interaction_paid_threesome'] = 1",
    ' $jo9_interaction_paid_threesome = {',
    paidScene,
    ' }',
    'end',
    "if interaction = menu_threesome_noassistant: dynamic $replace($jo9_interaction_paid_threesome, 'dyn'+'slave', 'slave')",
    `if interaction = ${assistantPaidThreesome}:`,
    " if assistant_state ! CONST_INT['slave_exist'] or assistant['energy'] <= -2 or sparks < 1 or master_excitement < 0: gt 'menu_form'",
    " dynamic $replace($jo9_interaction_paid_threesome, 'dyn'+'slave', 'assistant')",
    'end'
  ));

  const paidMenu = body('menu_form').match(/^\s*elseif assistant_state = CONST_INT\['slave_exist'\] and assistant\['energy'\] > -2:\r\n[^\r\n]*menu_Threesome_noassistant[^\r\n]*/m)?.[0];
  assert.ok(paidMenu, 'Assistant paid 3P menu');
  edit('menu_form', paidMenu, paidMenu
    .replace("assistant['energy'] > -2:", "assistant['energy'] > -2 and sparks >= 1 and master_excitement >= 0:")
    .replace('menu_Threesome_noassistant,', `${assistantPaidThreesome},`)
    .replace('<<$slave_name>>', '<<$assistant_name>>'));
}

module.exports = { applyIntimacy };
