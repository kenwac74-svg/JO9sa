'use strict';

const assert = require('node:assert/strict');

function applyArousal({ body, edit, lines, append }) {
  const gains = {
    '#dynamic': 2,
    next_day: 11,
    end_day_screen: 2,
    interaction: 7,
    interaction_result: 1,
  };
  const sourceGain = /\b(\w+)_rate\[(['"])arousal\2\]\s*(?:\+=|=(?= rand\())\s*([^\r\n]+?)(?=\s*&!|$)/;
  for (const [location, count] of Object.entries(gains)) {
    const rows = body(location).split('\r\n');
    const changes = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.trimStart().startsWith('!')) continue;
      const match = sourceGain.exec(row);
      if (!match) continue;
      const [code, role, , value] = match;
      const mode = code.includes('+=') ? 'gain' : 'set';
      const next = row.replace(code, code.slice(0, -value.length) +
        `func('jo9_nymph_arousal', '${mode}', '${role}', ${value.trim()})`);
      // The overnight assistant branches share the same line at different indent levels.
      if (location === 'next_day' && role === 'slave' && value.includes('"sub_masturbation"')) {
        changes.push([lines(rows[i - 1], row), lines(rows[i - 1], next)]);
      } else {
        changes.push([row, next]);
      }
    }
    assert.equal(changes.length, count, `${location}: arousal gain path count`);
    // Replace the deeper of identical indented lines before a shallower substring can match it.
    changes.sort(([left], [right]) => right.length - left.length);
    for (const [before, after] of changes) edit(location, before, after);
  }

  function forceMax(location, role, indent, before) {
    edit(location, before, lines(
      `${indent}if ${role}['nymphomania'] >= -1:`,
      ...before.split('\r\n').map(row => '\t' + row),
      `${indent}else`,
      `${indent}\t${role}['arousal'] = 0 & ${role}_rate['arousal'] = 0`,
      `${indent}end`
    ));
  }
  for (const role of ['assistant', 'slave']) {
    forceMax('interaction', role, '\t\t', lines(
      `\t\t${role}['arousal'] = 5`,
      `\t\t${role}_rate['arousal'] = 200`
    ));
  }
  forceMax('interaction_result', 'slave', '\t', lines(
    "\tslave_rate['arousal'] += func('jo9_nymph_arousal', 'gain', 'slave', 200)",
    "\tslave['arousal'] = 5"
  ));
  edit('hard_return', "\tslave['arousal'] = 3",
    "\tslave['arousal'] = iif(slave['nymphomania'] < -1, 0, 3)");

  const sharedXp = "dynslave['nymphomania_xp'] += (1 + orgastic)/2";
  edit('#dynamic', sharedXp, "gs 'jo9_nymph_arousal', 'xp', 'dynslave', (1 + orgastic)/2");
  const sharedRelief = "dynslave_rate['arousal'] -= interaction_dynslave['final_stimulation'] * (dynslave['arousal'] + orgastic * dynslave['temper'])";
  for (const [indent, branch] of [['\t\t\t', 1], ['\t\t\t\t', 3]]) {
    const before = lines(
      `${indent}orgasm_description = ${branch}`,
      '',
      `${indent}dynslave['pos_orgasm'] += 1 &! moodlet exponentially decays in next_day -ImperatorAugustus`,
      indent + sharedRelief
    );
    edit('#dynamic', before, lines(before, `${indent}gs 'jo9_nymph_arousal', 'mark_relief', 'dynslave'`));
  }
  for (const role of ['slave', 'assistant']) {
    const actual = `\t\t${role}_rate['arousal'] -= sex['climax_count'] * ${role}['arousal'] * sex['climax_top']`;
    edit('sex_end', lines(
      `\t\t${role}['nymphomania_xp'] += min(3, (1 + sex['climax_count'])/2)`, actual
    ), lines(
      `\t\tgs 'jo9_nymph_arousal', 'xp', '${role}', min(3, (1 + sex['climax_count'])/2)`,
      actual,
      `\t\tif sex['climax_top'] > 0: gs 'jo9_nymph_arousal', 'mark_relief', '${role}'`
    ));
  }

  const stats = '#static_base';
  const continuous = lines("\t\ti = 0", "\t\tn = arrsize('$cont_atr')", '\t\t:slave_cont_loop');
  edit(stats, continuous, lines("\t\tlocal jo9_nymph_previous_arousal = dynslave['arousal']", continuous));
  const independentEnd = "\t\tif i < n: jump 'slave_independent_loop'";
  edit(stats, independentEnd, lines(independentEnd,
    "\t\tgs 'jo9_nymph_arousal', 'recalc', 'dynslave', jo9_nymph_previous_arousal"));

  append('jo9_nymph_arousal', lines(
    '! JO9 MOD START NYMPHOMANIA_AROUSAL',
    'result = dyneval($replace({',
    " if $args[0] = 'gain' or $args[0] = 'set':",
    "  local jo9_nymph_start = iif($args[0] = 'set', jo9nymphactor_rate['arousal'], 0)",
    '  local jo9_nymph_gain = args[1] - jo9_nymph_start',
    '  result = args[1]',
    "  if jo9nymphactor['nymphomania'] < -1:",
    '   result = 0',
    "  elseif jo9nymphactor['nymphomania'] > 1 and jo9_nymph_gain > 0:",
    "   local jo9_nymph_doubled = jo9_nymph_gain * 3 + jo9nymphactor['jo9_nymph_gain_half']",
    '   result = jo9_nymph_start + jo9_nymph_doubled / 2',
    "   jo9nymphactor['jo9_nymph_gain_half'] = jo9_nymph_doubled mod 2",
    '  end',
    " elseif $args[0] = 'xp':",
    '  if args[1] > 0:',
    "   jo9nymphactor['nymphomania_xp'] += args[1]",
    "   if jo9nymphactor['nymphomania'] = 1 and jo9nymphactor['nymphomania_xp'] > 600 and jo9nymphactor['jo9_nymph_no_upgrade'] = 0:",
    '    if rand(1, 10) = 1:',
    "     jo9nymphactor['nymphomania'] = 2",
    "     jo9nymphactor['nymphomania_revealed'] = 1",
    '    end',
    '   end',
    '  end',
    " elseif $args[0] = 'mark_relief':",
    "  if $curloc ! 'next_day' and $curloc ! 'end_day_screen' and jo9nymphactor['nymphomania'] > 1 and jo9nymphactor['arousal'] > 0:",
    "   jo9nymphactor['jo9_nymph_relief_pending'] = 1",
    '  end',
    " elseif $args[0] = 'recalc':",
    "  if jo9nymphactor['nymphomania'] < -1:",
    "   jo9nymphactor['arousal'] = 0",
    "   jo9nymphactor_rate['arousal'] = 0",
    "   jo9nymphactor_rate['temp_arousal'] = 0",
    '  end',
    "  if jo9nymphactor['arousal'] < 5: jo9nymphactor['jo9_addiction_high_days'] = 0",
    "  if jo9nymphactor['jo9_nymph_relief_pending'] = 1:",
    "   jo9nymphactor['jo9_nymph_relief_pending'] = 0",
    "   if jo9nymphactor['nymphomania'] > 1 and args[1] > 0 and jo9nymphactor['arousal'] = 0:",
    "    local jo9_nymph_ap_cap = iif(jo9nymphactor['stamina'] > 0, min(5, jo9nymphactor['stamina'] + iif(difficulty_setting = 2, 0, 1)), 0)",
    "    jo9nymphactor['energy'] = max(jo9nymphactor['energy'], min(jo9_nymph_ap_cap, jo9nymphactor['energy'] + 2))",
    "    jo9nymphactor['jo9_nymph_relief_day'] = day + 1",
    '   end',
    '  end',
    ' end',
    "}, 'jo9nymphactor', $args[1]), $args[0], args[2])",
    '! JO9 MOD END NYMPHOMANIA_AROUSAL'
  ));
}

module.exports = { applyArousal };
