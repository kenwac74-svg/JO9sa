'use strict';

function applyDaily({ edit, lines, append }) {
  edit('next_day', lines('day += 1', 'decadecount += 1'), lines(
    'day += 1',
    "gs 'jo9_nymphomania_daily', 'tick'",
    'decadecount += 1',
  ));

  const recovery = "\t\tdynslave['energy'] += a &! can be negative if wounded";
  edit('next_day', recovery, lines(
    "\t\ta = func('jo9_nymphomania_daily', 'recovery', 'dynslave', a)",
    recovery,
  ));

  const soloPlan = "if slave_state = CONST_INT['slave_exist'] and previous_energy >= 0 and slave['arousal'] > slave['pride'] and slave['arousal'] > 2 and slave['nymphomania'] >= 0:";
  edit('next_day', soloPlan, soloPlan.replace('>= 0:', ">= 0 and slave['nymphomania'] <= 1:"));
  for (const role of ['room1', 'room2', 'room3', 'room4']) {
    edit('next_day', `if ${role}['arousal'] = 5:`, `if ${role}['arousal'] = 5 and ${role}['nymphomania'] <= 1:`);
  }
  edit('next_day', lines('if assistant_rape = 1:', '\tif assistant["arousal"] > 3 and slave_assistant_sex = 0 and assistant_state = CONST_INT[\'slave_exist\'] and slave_state = CONST_INT[\'slave_exist\'] and RAND(1,3) > 1:'), lines(
    "if assistant_rape = 1 and assistant['nymphomania'] <= 1 and slave['nymphomania'] <= 1:",
    '\tif assistant["arousal"] > 3 and slave_assistant_sex = 0 and assistant_state = CONST_INT[\'slave_exist\'] and slave_state = CONST_INT[\'slave_exist\'] and RAND(1,3) > 1:',
  ));

  edit('end_day_screen', lines('png = 0', 'npc = 0', '', 'if end_day_phase = 0:'), lines(
    'png = 0',
    'npc = 0',
    '',
    "if slave['nymphomania'] > 1: slave_will_masturbate = 0 & slave_masturbating_anyway = 0",
    "if assistant['nymphomania'] > 1 or slave['nymphomania'] > 1: slave_assistant_rape = 0 & slave_orgasm_anyway = 0",
    ...['room1', 'room2', 'room3', 'room4'].map(role => `if ${role}['nymphomania'] > 1: ${role}_will_masturbate = 0`),
    '',
    'if end_day_phase = 0:',
  ));
  const firstNativeLoss = "if slave_suicide = 1 and assistant['supervise_rule'] = 1:";
  edit('end_day_screen', firstNativeLoss, lines(
    "if func('jo9_nymphomania_daily', 'loss'): jump 'loop'",
    '',
    firstNativeLoss,
  ));

  append('jo9_nymphomania_daily', lines(
    "if $args[0] = 'tick' or $args[0] = 'loss':",
    " local $jo9_daily_mode = $args[0]",
    " local $jo9_daily_role",
    " local jo9_daily_i",
    " for jo9_daily_i = 0 to arrsize('$unfrozen_slave_characters') - 1:",
    "  $jo9_daily_role = $unfrozen_slave_characters[jo9_daily_i]",
    "  if arrpos('$barn_slave_characters', $jo9_daily_role) < 0:",
    "   if $jo9_daily_mode = 'tick':",
    "    gs 'jo9_nymphomania_daily', 'tick_actor', $jo9_daily_role",
    "   elseif $jo9_daily_role ! 'prisoner' and func('jo9_nymphomania_daily', 'lose_actor', $jo9_daily_role):",
    '    result = 1',
    '    exit',
    '   end',
    '  end',
    ' end',
    "elseif $args[0] = 'tick_actor':",
    ' dynamic $replace({',
    "  if jo9actor_state <= CONST_INT['no_slave'] or jo9actor['jo9_nymph_day_seen'] = day + 1: exit",
    "  jo9actor['jo9_nymph_day_seen'] = day + 1",
    "  jo9actor['jo9_addiction_pending_loss'] = 0",
    "  if jo9actor['nymphomania'] > 1 and max(cont_atr_min, min(cont_atr_max, jo9actor_rate['arousal'])) + jo9actor_rate['temp_arousal'] >= cont_atr_threshold[5]:",
    "   jo9actor['jo9_addiction_high_days'] += 1",
    "   if jo9actor['jo9_addiction_high_days'] >= 60 and 'jo9actor' ! 'prisoner': jo9actor['jo9_addiction_pending_loss'] = iif(jo9actor['gladiatrix'] >= 4, 1, 2)",
    '  else',
    "   jo9actor['jo9_addiction_high_days'] = 0",
    '  end',
    "  if jo9actor['nymphomania'] = -1 and max(jo9actor['penetration'], jo9actor['orgy'], jo9actor['xenophily']) <= 3:",
    "   jo9actor['jo9_frigid_days'] += 1",
    "   if jo9actor['jo9_frigid_days'] >= 30:",
    "    jo9actor['jo9_frigid_days'] = 0",
    '    if rand(1, 100) <= 30:',
    "     jo9actor['nymphomania'] = -2",
    "     jo9actor['nymphomania_revealed'] = 1",
    "     jo9actor['arousal'] = 0",
    "     jo9actor_rate['arousal'] = 0",
    "     jo9actor_rate['temp_arousal'] = 0",
    '    end',
    '   end',
    '  else',
    "   jo9actor['jo9_frigid_days'] = 0",
    '  end',
    " }, 'jo9actor', $args[1])",
    "elseif $args[0] = 'recovery':",
    ' result = args[2]',
    " if result > 0 and arrpos('$unfrozen_slave_characters', $args[1]) >= 0 and arrpos('$barn_slave_characters', $args[1]) < 0:",
    "  local jo9_recovery_days = dyneval($replace({if jo9actor['nymphomania'] > 1: result = jo9actor['jo9_addiction_high_days']}, 'jo9actor', $args[1]))",
    '  if jo9_recovery_days >= 12:',
    '   result = result * 40 / 100',
    '  elseif jo9_recovery_days >= 6:',
    '   result = result * 60 / 100',
    '  elseif jo9_recovery_days >= 3:',
    '   result = result * 80 / 100',
    '  end',
    ' end',
    "elseif $args[0] = 'lose_actor':",
    ' result = dyneval($replace({',
    "  local jo9_loss = jo9actor['jo9_addiction_pending_loss']",
    "  if jo9_loss < 1 or jo9actor_state <= CONST_INT['no_slave'] or jo9actor['nymphomania'] <= 1: exit",
    "  jo9actor['jo9_addiction_pending_loss'] = 0",
    "  if 'jo9actor' = 'slave': slave_escape = 0 & slave_suicide = 0",
    "  if 'jo9actor' = 'slave' or 'jo9actor' = 'assistant': jo9actor_died = 0",
    "  $place = 'study'",
    "  local jo9_loss_image",
    '  if jo9_loss = 1:',
    "   $text = '오랫동안 욕구를 억누르던 ' + $jo9actor_name + '(이)가 밤사이 도망쳤다. 아침이 되어서야 빈자리를 발견했다.'",
    "   $bg_path = 'scene/escape'",
    "   jo9_loss_image = rand(1, max(1, picMax['escape']))",
    "   master_moodlet['neg_escape'] = 10",
    '  else',
    "   $text = '오랫동안 욕구를 억누르던 ' + $jo9actor_name + '(이)가 밤사이 스스로 목숨을 끊었다.'",
    "   $bg_path = 'girls/normal_scenes/suicide'",
    "   jo9_loss_image = rand(1, max(1, picMax['suicide']))",
    "   master_moodlet['neg_slave_died'] = 10",
    '   dynamic $master_energy_drop',
    '  end',
    "  if jo9_loss_image > 1: $bg_path += '_' + $str(jo9_loss_image)",
    "  gs '$mod_master_drop', 1",
    "  dynamic $clear_slave_instance, 'jo9actor'",
    '  result = 1',
    " }, 'jo9actor', $args[1]))",
    'end',
  ));
}

module.exports = { applyDaily };
