'use strict';

const PATCH = '2026-10-25_trait_attention_union';
const START = id => `! JO9 MOD START ${id} | ${PATCH}`;
const END = id => `! JO9 MOD END ${id}`;
const value = (role, key) => `func('jo9_traits', 'attention_value', '${role}', '${key}')`;
const has = role => `func('jo9_traits', 'attention_has', '${role}')`;
const known = role => `func('jo9_traits', 'attention_known', '${role}')`;
const observe = role => `gs 'jo9_traits', 'attention_observe', '${role}'`;
const description = '타인의 관심을 갈망하고 주목의 중심에 서기를 좋아한다. 칭찬과 격려를 반기며, 해변이나 극장에서 함께 보내는 시간도 효과적인 보상이 된다. 반면 모욕과 언어적 압박에는 예민해 부정적인 기억과 불안이 커질 수 있다. 심리피학 성향이 함께 있으면 언어적 압박에는 그 성향대로 반응한다. 은둔형 외톨이와는 양립하지 않는다.';

const helper = [
 START('ATTENTION_UNION_HELPERS'),
 '! Read-only queries retain legacy aliases; only explicit edit/remove/fresh/observe/confirm modes write state.',
 "if $args[0] = 'attention_has':",
 " result = dyneval($replace({result = iif(j9attention['jo9_attention'] = 1 or j9attention['abuse_attitude'] = -1 or j9attention['passion_fame'] = 1, 1, 0)}, 'j9attention', $args[1]))",
 ' exit',
 'end',
 "if $args[0] = 'attention_value':",
 ' local jo9_attention_raw = dyneval(\'result = \' + $args[1] + "[\'" + $args[2] + "\']")',
 ' result = jo9_attention_raw',
 " if func('jo9_traits', 'attention_has', $args[1]) = 1:",
 "  if $args[2] = 'abuse_attitude' and (jo9_attention_raw = -1 or jo9_attention_raw = 0): result = -1",
 "  if $args[2] = 'passion_fame' and (jo9_attention_raw = 0 or jo9_attention_raw = 1): result = 1",
 ' end',
 ' exit',
 'end',
 "if $args[0] = 'attention_known':",
 ' result = 0',
 " if func('jo9_traits', 'attention_has', $args[1]) = 1:",
 '  result = dyneval($replace({',
 "   result = j9attention['jo9_attention_known']",
 "   if j9attention['abuse_attitude'] = -1: result = max(result, j9attention['abuse_attitude_revealed'])",
 "   if j9attention['passion_fame'] = 1: result = max(result, j9attention['passion_fame_revealed'])",
 "  }, 'j9attention', $args[1]))",
 '  result = max(0, min(2, result))',
 ' end',
 ' exit',
 'end',
 "if $args[0] = 'attention_observe':",
 " if func('jo9_traits', 'attention_has', $args[1]) = 1 and func('jo9_traits', 'attention_known', $args[1]) = 0:",
 "  dynamic $replace({j9attention['jo9_attention_known'] = 1}, 'j9attention', $args[1])",
 ' end',
 ' exit',
 'end',
 "if $args[0] = 'attention_confirm':",
 ' result = 0',
 " if func('jo9_traits', 'attention_known', $args[1]) = 1:",
 "  dynamic $replace({j9attention['jo9_attention_known'] = 2}, 'j9attention', $args[1])",
 '  result = 1',
 ' end',
 ' exit',
 'end',
 "if $args[0] = 'attention_remove':",
 " result = func('jo9_traits', 'attention_has', $args[1])",
 ' if result = 1:',
 '  dynamic $replace({',
 "   j9attention['jo9_attention'] = 0",
 "   j9attention['jo9_attention_known'] = 0",
 "   if j9attention['abuse_attitude'] = -1 or j9attention['abuse_attitude'] = 0: j9attention['abuse_xp'] = 0",
 "   if j9attention['abuse_attitude'] = -1:",
 "    j9attention['abuse_attitude'] = 0",
 "    j9attention['abuse_attitude_revealed'] = 0",
 '   end',
 "   if j9attention['passion_fame'] = 1:",
 "    j9attention['passion_fame'] = 0",
 "    j9attention['passion_fame_revealed'] = 0",
 '   end',
 "  }, 'j9attention', $args[1])",
 ' end',
 ' exit',
 'end',
 "if $args[0] = 'attention_repair':",
 ' result = 0',
 ' if func(\'jo9_traits\', \'attention_has\', $args[1]) = 1 and dyneval(\'result = \' + $args[1] + "[\'passion_fame\']") = -1:',
 '  dynamic $replace({',
 "   j9attention['passion_fame'] = 0",
 "   j9attention['passion_fame_revealed'] = 0",
 "  }, 'j9attention', $args[1])",
 '  result = 1',
 ' end',
 ' exit',
 'end',
 "if $args[0] = 'attention_edit':",
 ' if dyneval(\'result = \' + $args[1] + \'_state\') ! CONST_INT[\'slave_exist\']: exit',
 " if func('jo9_traits', 'attention_has', $args[1]) = 1:",
 "  gs 'jo9_traits', 'attention_remove', $args[1]",
 ' else',
 "  dynamic $replace({j9attention['jo9_attention'] = 1 & j9attention['jo9_attention_known'] = 2}, 'j9attention', $args[1])",
 "  gs 'jo9_traits', 'attention_repair', $args[1]",
 ' end',
 ' exit',
 'end',
 "if $args[0] = 'attention_opposite':",
 ' if dyneval(\'result = \' + $args[1] + \'_state\') ! CONST_INT[\'slave_exist\']: exit',
 " if $args[2] = 'passion_fame' and args[3] = -1 and func('jo9_traits', 'attention_has', $args[1]) = 1:",
 '  if dyneval(\'result = \' + $args[1] + "[\'passion_fame\']") ! -1: result = 0 & exit',
 ' end',
 '! Explicit editor operation. Preserve a held alias logically before replacing that raw axis.',
 " local jo9_attention_before = func('jo9_traits', 'attention_has', $args[1])",
 " local jo9_attention_before_known = func('jo9_traits', 'attention_known', $args[1])",
 ' dynamic $replace({',
 '  if j9attention[$args[0]] = args[1]:',
 '   j9attention[$args[0]] = 0',
 "   j9attention[$args[0] + '_revealed'] = 0",
 '  else',
 "   if args[2] = 1: j9attention['jo9_attention'] = 1 & j9attention['jo9_attention_known'] = args[3]",
 '   j9attention[$args[0]] = args[1]',
 "   j9attention[$args[0] + '_revealed'] = 2",
 '  end',
 " }, 'j9attention', $args[1]), $args[2], args[3], jo9_attention_before, jo9_attention_before_known",
 " gs 'jo9_traits', 'attention_repair', $args[1]",
 ' result = 1',
 ' exit',
 'end',
 "if $args[0] = 'attention_fresh':",
 '! Caller limits this mode to a fresh random stock after the original draws, never an existing actor or clone.',
 ' dynamic $replace({',
 "  if j9attention['abuse_attitude'] = -1:",
 "   j9attention['jo9_attention'] = 1",
 "   j9attention['jo9_attention_known'] = max(j9attention['jo9_attention_known'], j9attention['abuse_attitude_revealed'])",
 "   j9attention['abuse_attitude'] = 0",
 "   j9attention['abuse_attitude_revealed'] = 0",
 '  end',
 "  if j9attention['passion_fame'] = 1:",
 "   j9attention['jo9_attention'] = 1",
 "   j9attention['jo9_attention_known'] = max(j9attention['jo9_attention_known'], j9attention['passion_fame_revealed'])",
 "   j9attention['passion_fame'] = 0",
 "   j9attention['passion_fame_revealed'] = 0",
 '  end',
 " }, 'j9attention', $args[1])",
 " gs 'jo9_traits', 'attention_repair', $args[1]",
 ' exit',
 'end',
 END('ATTENTION_UNION_HELPERS')
].join('\n');

function apply(ctx) {
 const changes = [];
 const nl = name => ctx.get(name).includes('\r\n') ? '\r\n' : '\n';
 function edit(name, old, next, count = 1) {
  if (old === next) return;
  ctx.edit(name, old, next, count);
  changes.push({location:name, count, old, new:next});
 }
 function pattern(name, regex, make) {
  const source = ctx.get(name);
  const grouped = new Map();
  for (const match of source.matchAll(regex)) {
   const old = match[0], next = typeof make === 'function' ? make(match) : make;
   if (old === next) continue;
   if (grouped.has(old)) {
    if (grouped.get(old).next !== next) throw Error('Ambiguous attention replacement');
    grouped.get(old).count++;
   } else grouped.set(old, {next,count:1});
  }
  if (!grouped.size) throw Error(`Attention anchor not found: ${name}: ${regex}`);
  for (const [old, {next,count}] of grouped) edit(name, old, next, count);
 }
 function line(name, regex, make) {
  const source = ctx.get(name), eol = nl(name), grouped = new Map();
  for (const match of source.matchAll(regex)) {
   const old = eol + match[0] + eol, next = eol + make(match) + eol;
   if (grouped.has(old)) grouped.get(old).count++;
   else grouped.set(old, {next,count:1});
  }
  if (!grouped.size) throw Error(`Attention line anchor not found: ${name}: ${regex}`);
  for (const [old, {next,count}] of grouped) edit(name, old, next, count);
 }

 // Exact reader categories only. Never rewrite assignments, dormant snapshots, or the helpers below.
 for (const [name, role, key, tail] of [
  ['chose_answer','slave','passion_fame',' = 1'],
  ['chose_answer','slave','abuse_attitude',' = -1'],
  ['interaction','slave','passion_fame','\\*5'],
  ['interaction','slave','abuse_attitude','\\*5'],
  ['interaction','slave','passion_fame',' > 0'],
  ['interaction','assistant','passion_fame',' > 0'],
  ['interaction.relations','slave','passion_fame',' > 0'],
  ['interaction_result','dynslave','abuse_attitude',' < 0'],
  ['#dynamic','dynslave','abuse_attitude',' = -1'],
  ['master_love','slave1','abuse_attitude',' = -1'],
 ]) {
  const quoted = `${role}\\[(?:'|\")${key}(?:'|\")\\]`;
  pattern(name, new RegExp(quoted + tail, 'g'), m => {
   const originalTail = m[0].slice(m[0].indexOf(']') + 1);
   return value(role,key) + originalTail;
  });
 }
 // Arithmetic phobia readers carry no following comparison.
 pattern('#dynamic', /phobia \+= dynslave\['abuse_attitude'\]/g, () => `phobia += ${value('dynslave','abuse_attitude')}`);
 pattern('#dynamic', /interaction_dynslave\['phobia'\] \+= dynslave\['abuse_attitude'\]/g, () => `interaction_dynslave['phobia'] += ${value('dynslave','abuse_attitude')}`);
 // Scalar emotional-reaction multipliers, including the assistant variant.
 for (const [name, role] of [['next_day','slave'],['interaction','assistant']]) {
  pattern(name, new RegExp(`if ${role}\\["abuse_attitude"\\] = (-1|1): rape_negative`, 'g'), m => `if ${value(role,'abuse_attitude')} = ${m[1]}: rape_negative`);
 }
 // Praise diminishing returns already tested an OR; use the canonical/legacy union once.
 pattern('interaction', /slave\['abuse_attitude'\] ! -1 and slave\['passion_fame'\] ! 1/g, () => `${has('slave')} = 0`);
 pattern('interaction', /slave\['abuse_attitude'\] ! -1 and \$slave_psy_status ! 'broken'/g, () => `${has('slave')} = 0 and $slave_psy_status ! 'broken'`);

 const praiseOld = /^\tif slave\['abuse_attitude'\] = -1 and \$slave_psy_status ! 'broken':[\s\S]*?^\tif slave\['passion_fame'\] = 1 and \$slave_psy_status ! 'broken':[\s\S]*?^\tend(?=\r?$)/gm;
 pattern('interaction_result', praiseOld, () => [
  START('ATTENTION_PRAISE_ONCE'),
  `\tif ${has('slave')} = 1 and $slave_psy_status ! 'broken':`,
  `\t\t${observe('slave')}`,
  "\t\tslave_rate['mood'] += interaction_reward_potence",
  "\t\tslave['pos_praise'] += max(interaction_reward_level, 2)",
  '\t\t$text[2] = $compliment_plus',
  '\tend',
  END('ATTENTION_PRAISE_ONCE')
 ].join(nl('interaction_result')));

 // Observe the union on the actual encouragement/threat/abuse/social-reward/compliment paths.
 line('interaction', /^([\t ]*)cheer_effect = 2[^\r\n]*/gm, m => `${m[1]}${observe('slave')}${nl('interaction')}${m[0]}`);
 line('interaction', /^([\t ]*)threat_effect = min[^\r\n]*/gm, m => `${m[1]}${observe('slave')}${nl('interaction')}${m[0]}`);
 for (const name of ['interaction','interaction.relations']) {
  line(name, /^([\t ]*)if (slave|assistant)\[(?:'|")passion_fame(?:'|")\] ! 0 and [^\r\n]*/gm,
   m => `${m[0]}${nl(name)}${m[1]}${observe(m[2])}`);
 }
 line('interaction', /^([\t ]*)if assistant\["abuse_attitude"\] ! 0 and [^\r\n]*/gm,
  m => `${m[0]}${nl('interaction')}${m[1]}${observe('assistant')}`);
 line('interaction_result', /^([\t ]*)if dynslave\['abuse_attitude_revealed'\] = 0 and 'dynslave' = \$interaction_partner:[^\r\n]*/gm,
  m => `${m[0]}${nl('interaction_result')}${m[1]}if 'dynslave' = $interaction_partner: ${observe('dynslave')}`);

 // Fresh random stock only; source draws and their random consumption remain unchanged.
 edit('generate_stock', "if special_stock = 0: gs 'jo9_traits', 'generate'", [
  START('ATTENTION_FRESH_GENERATION'),
  "if special_stock = 0 and creating_clone = 0: gs 'jo9_traits', 'attention_fresh', 'stock'",
  END('ATTENTION_FRESH_GENERATION'),
  "if special_stock = 0: gs 'jo9_traits', 'generate'"
 ].join(nl('generate_stock')));

 // The original habit cannot replace either legacy or canonical attention.
 edit('#static_base', "if dynslave['abuse_xp'] > 50 and dynslave['abuse_attitude'] = 0:",
  `if dynslave['abuse_xp'] > 50 and dynslave['abuse_attitude'] = 0 and ${has('dynslave')} = 0:`);
 pattern('#static_base', /^\t\tif dynslave\['abuse_attitude_revealed'\] = 1 and dynslave\['abuse_attitude'\] ! 0:[\s\S]*?^\t\tend(?=\r?$)/gm, () => [
  START('ATTENTION_DISCOVERY_ONCE'),
  `\t\tif ${known('dynslave')} = 1:`,
  '\t\t\tmsg $jo9_attention_text',
  "\t\t\tgs 'jo9_traits', 'attention_confirm', 'dynslave'",
  '\t\tend',
  END('ATTENTION_DISCOVERY_ONCE'),
  "\t\tif dynslave['abuse_attitude_revealed'] = 1 and dynslave['abuse_attitude'] ! 0 and dynslave['abuse_attitude'] ! -1:",
  "\t\t\tif dynslave['abuse_attitude'] = 2: msg '<<$Пси_мазохистка>>'",
  "\t\t\tdynslave['abuse_attitude_revealed'] = 2",
  "\t\telseif dynslave['abuse_attitude'] = 0:",
  "\t\t\tdynslave['abuse_attitude_revealed'] = 0",
  '\t\tend'
 ].join(nl('#static_base')));
 pattern('#static_base', /^\t\tif dynslave\['passion_fame_revealed'\] = 1 and dynslave\['passion_fame'\] ! 0:[\s\S]*?^\t\tend(?=\r?$)/gm, () => [
  "\t\tif dynslave['passion_fame_revealed'] = 1 and dynslave['passion_fame'] ! 0 and dynslave['passion_fame'] ! 1:",
  "\t\t\tif dynslave['passion_fame'] = -1: msg '<<$Хикикомори>>'",
  "\t\t\tdynslave['passion_fame_revealed'] = 2",
  "\t\telseif dynslave['passion_fame'] = 0:",
  "\t\t\tdynslave['passion_fame_revealed'] = 0",
  '\t\tend'
 ].join(nl('#static_base')));
 pattern('#static_base', /^        if dynslave\['abuse_attitude'\] = -1 and \(dynslave\['abuse_attitude_revealed'\] = 2 or spell_revelio = 1\):[\s\S]*?^        end(?=\r?$)/gm, () => [
  START('ATTENTION_SINGLE_DISPLAY'),
  `        if ${has('dynslave')} = 1 and (${known('dynslave')} = 2 or spell_revelio = 1):`,
  '            $dynslave_features_list += \'<a href="EXEC: msg $jo9_attention_text"><<dyneval($vb_cycle_skill, 3, "주목욕구")>></a><br>\'',
  '        end',
  END('ATTENTION_SINGLE_DISPLAY')
 ].join(nl('#static_base')));
 pattern('#static_base', /^        if dynslave\['passion_fame'\] = 1 and \(dynslave\['passion_fame_revealed'\] = 2 or spell_revelio = 1\):[\s\S]*?^        end(?=\r?$)/gm,
  () => `${START('ATTENTION_FAME_ALIAS_DISPLAY_REMOVED')}${nl('#static_base')}${END('ATTENTION_FAME_ALIAS_DISPLAY_REMOVED')}`);

 // Existing text aliases remain callable, with a single honest mixed-effects description.
 for (const name of ['#static_txt','#txt_woman']) {
  pattern(name, /^\$Истеричка = '[^\r\n]*'/gm,
   () => `$jo9_attention_text = $func('jo9_traits', 'text', 'attention')${nl(name)}$Истеричка = $jo9_attention_text`);
  pattern(name, /^\$Тщеславная = '[^\r\n]*'/gm, () => '$Тщеславная = $jo9_attention_text');
 }
 edit('jo9_traits', `if $args[0] = 'describe' or $args[0] = 'text':${nl('jo9_traits')} $result = ''`, `if $args[0] = 'describe' or $args[0] = 'text':${nl('jo9_traits')} $result = ''${nl('jo9_traits')} ${START('ATTENTION_DESCRIPTION')}${nl('jo9_traits')} if $args[1] = 'attention': $result = '${description}'${nl('jo9_traits')} ${END('ATTENTION_DESCRIPTION')}`, 1);
 const roleEditorAnchor = '! JO9 MOD START ARGON_RESTORED_EDITOR | 2026-10-19_argon_trait_text_integration';
 edit('jo9_traits', roleEditorAnchor, [
  START('ATTENTION_ROLE_EDITOR'),
  '  $setting_display_r += \'<div id="under_cheats"><a href="EXEC: gs \'\'jo9_traits\'\', \'\'attention_edit\'\', \'\'dynslave\'\' & gt \'\'menu_form\'\'">주목욕구: \'',
  `  if ${has('dynslave')} = 1: $setting_display_r += '있음'`,
  `  if ${has('dynslave')} = 0: $setting_display_r += '없음'`,
  "  $setting_display_r += '</a></div>'",
  END('ATTENTION_ROLE_EDITOR'),
  roleEditorAnchor
 ].join(nl('jo9_traits')));

 // Replace the two old coupled cycles by three independent, explicitly edited traits.
 pattern('menu_form', /^\tif slave\["abuse_attitude"\]  = 2:[\s\S]*?^\tif slave\["abuse_attitude"\]  = 0 or slave\["abuse_attitude"\]  = 1:[\s\S]*?^\tend(?=\r?$)/gm, () => [
  START('ATTENTION_EDITOR_LEFT'),
  '\t$setting_display += \'<div id="under_cheats"><a href="EXEC: gs \'\'jo9_traits\'\', \'\'attention_opposite\'\', \'\'slave\'\', \'\'abuse_attitude\'\', 2 & gt \'\'menu_form\'\'">심리피학 성애자: <<$iif(slave["abuse_attitude"] = 2, "있음", "없음")>></a></div>\'',
  `\t$setting_display += '<div id="under_cheats"><a href="EXEC: gs ''jo9_traits'', ''attention_edit'', ''slave'' & gt ''menu_form''">주목욕구: <<$iif(${has('slave').replaceAll("'",'"')} = 1, "있음", "없음")>></a></div>'`,
  END('ATTENTION_EDITOR_LEFT')
 ].join(nl('menu_form')));
 pattern('menu_form', /^\tif slave\["passion_fame"\]  = 1:[\s\S]*?^\tif slave\["passion_fame"\]  = 0:[\s\S]*?^\tend(?=\r?$)/gm, () => [
  START('ATTENTION_EDITOR_RIGHT'),
  '\t$setting_display_r += \'<div id="under_cheats"><a href="EXEC: gs \'\'jo9_traits\'\', \'\'attention_opposite\'\', \'\'slave\'\', \'\'passion_fame\'\', -1 & gt \'\'menu_form\'\'">은둔형 외톨이: <<$iif(slave["passion_fame"] = -1, "있음", "없음")>></a></div>\'',
  END('ATTENTION_EDITOR_RIGHT')
 ].join(nl('menu_form')));

 // One item candidate for one merged trait. Explicit removal clears aliases only at their attention values.
 edit('jo9_chaotic', "if jo9ceactor['abuse_attitude'] = -1:", `if ${has('jo9ceactor')} = 1:`);
 edit('jo9_chaotic', "$jo9_chaotic_keys[jo9_chaotic_count] = 'abuse_attitude'", "$jo9_chaotic_keys[jo9_chaotic_count] = 'jo9_attention'");
 edit('jo9_chaotic', "$jo9_chaotic_labels[jo9_chaotic_count] = '연극성 인격장애'", "$jo9_chaotic_labels[jo9_chaotic_count] = '주목욕구'");
 edit('jo9_chaotic', "$jo9_chaotic_xps[jo9_chaotic_count] = 'abuse_xp'", "$jo9_chaotic_xps[jo9_chaotic_count] = ''");
 edit('jo9_chaotic', " jo9ceactor[$args[0]] = 0", [
  " if $args[0] = 'jo9_attention':",
  "  gs 'jo9_traits', 'attention_remove', 'jo9ceactor'",
  ' else',
  '  jo9ceactor[$args[0]] = 0',
  ' end'
 ].join(nl('jo9_chaotic')));

 // Append helper bodies last, so their raw storage reads cannot recursively rewrite themselves.
 const traits = ctx.get('jo9_traits');
 const anchor = traits.split(/\r?\n/).at(-1) || traits.split(/\r?\n/).at(-2);
 edit('jo9_traits', anchor, `${anchor}${nl('jo9_traits')}${helper.replaceAll('\n', nl('jo9_traits'))}`);
 return {patch:PATCH, changes, newLocations:[], keys:['jo9_attention','jo9_attention_known'], dormantSnapshotPreserved:true};
}

function testCases(ctx) {
 const tests = [];
 function make(name, lines) {
  return {name, body:lines.join('\n').replaceAll('FAIL_MERGER_', `FAIL_MERGER_${name}_`)};
 }
 function assert(expression, label) {
  return `qa_checks += 1\nif (${expression}) = 0: msg 'FAIL_MERGER_${label}' & exit`;
 }
 // Full nine-pair supported legacy state matrix; raw snapshots must survive all query modes.
 for (const abuse of [-1,0,2]) for (const fame of [-1,0,1]) {
  const active = abuse === -1 || fame === 1;
  const abuseEff = abuse === 2 ? 2 : active ? -1 : abuse;
  const fameEff = fame === -1 ? -1 : active ? 1 : fame;
  tests.push(make(`attention_legacy_${abuse}_${fame}`, [
   "killvar 'slave'", `slave['abuse_attitude'] = ${abuse}`, `slave['passion_fame'] = ${fame}`,
   assert(`${has('slave')} = ${Number(active)}`, 'has'),
   assert(`${value('slave','abuse_attitude')} = ${abuseEff}`, 'abuse'),
   assert(`${value('slave','passion_fame')} = ${fameEff}`, 'fame'),
   assert(`slave['abuse_attitude'] = ${abuse} and slave['passion_fame'] = ${fame} and slave['jo9_attention'] = 0 and slave['jo9_attention_known'] = 0`, 'query-preserves-storage')
  ]));
 }
 for (const role of ['slave','assistant','slave1','dynslave','stock']) {
  tests.push(make(`attention_actor_${role}`, [
   `killvar '${role}'`, `${role}_state = CONST_INT['slave_exist']`, `${role}['jo9_attention'] = 1`,
   assert(`${has(role)} = 1 and ${value(role,'abuse_attitude')} = -1 and ${value(role,'passion_fame')} = 1`, 'canonical-union'),
   `${role}['abuse_attitude'] = 2`, `${role}['passion_fame'] = -1`,
   assert(`${has(role)} = 1 and ${value(role,'abuse_attitude')} = 2 and ${value(role,'passion_fame')} = -1`, 'opposites'),
   `gs 'jo9_traits', 'attention_remove', '${role}'`,
   assert(`${has(role)} = 0 and ${role}['abuse_attitude'] = 2 and ${role}['passion_fame'] = -1`, 'remove-preserves-opposites'),
   `gs 'jo9_traits', 'attention_edit', '${role}'`,
   assert(`${has(role)} = 1 and ${known(role)} = 2 and ${role}['abuse_attitude'] = 2 and ${role}['passion_fame'] = 0`, 'new-positive-repairs-recluse')
  ]));
 }
 tests.push(make('attention_unknown_values', [
  "killvar 'slave'", "slave['jo9_attention'] = 1", "slave['abuse_attitude'] = 1", "slave['passion_fame'] = 2",
  assert(`${value('slave','abuse_attitude')} = 1 and ${value('slave','passion_fame')} = 2`, 'unknown-read'),
  "gs 'jo9_traits', 'attention_repair', 'slave'",
  assert(`slave['abuse_attitude'] = 1 and slave['passion_fame'] = 2`, 'unknown-repair'),
  "gs 'jo9_traits', 'attention_remove', 'slave'",
  assert(`slave['abuse_attitude'] = 1 and slave['passion_fame'] = 2`, 'unknown-remove')
 ]));
 tests.push(make('attention_discovery_no_migration', [
  "killvar 'slave'", "slave['abuse_attitude'] = -1", "slave['passion_fame'] = 1",
  "gs 'jo9_traits', 'attention_observe', 'slave'",
  assert(`${known('slave')} = 1`, 'observed'),
  assert(`func('jo9_traits', 'attention_confirm', 'slave') = 1 and ${known('slave')} = 2`, 'discovered'),
  assert(`func('jo9_traits', 'attention_confirm', 'slave') = 0`, 'once'),
  assert(`slave['abuse_attitude'] = -1 and slave['passion_fame'] = 1 and slave['jo9_attention'] = 0 and slave['abuse_attitude_revealed'] = 0 and slave['passion_fame_revealed'] = 0`, 'aliases-unmodified'),
  "gs 'jo9_traits', 'attention_remove', 'slave'",
  assert(`${has('slave')} = 0 and ${known('slave')} = 0 and slave['abuse_attitude'] = 0 and slave['passion_fame'] = 0`, 'explicit-remove-all-aliases')
 ]));
 tests.push(make('attention_editor_preserves_legacy_trait', [
  "killvar 'slave'", "slave_state = CONST_INT['slave_exist']", "slave['abuse_attitude'] = -1", "slave['abuse_attitude_revealed'] = 2",
  "gs 'jo9_traits', 'attention_opposite', 'slave', 'abuse_attitude', 2",
  assert(`${has('slave')} = 1 and ${known('slave')} = 2 and slave['abuse_attitude'] = 2`, 'psi-does-not-erase-attention'),
  "slave['passion_fame'] = 1",
  assert(`func('jo9_traits', 'attention_opposite', 'slave', 'passion_fame', -1) = 0`, 'reject-new-negative'),
  assert(`${has('slave')} = 1 and slave['abuse_attitude'] = 2 and slave['passion_fame'] = 1`, 'positive-kept'),
  "gs 'jo9_traits', 'attention_remove', 'slave'",
  "qa_attention_return = func('jo9_traits', 'attention_opposite', 'slave', 'passion_fame', -1)",
  assert(`qa_attention_return = 1 and slave['passion_fame'] = -1`, 'negative-allowed-after-positive-removed'),
  "qa_attention_return = func('jo9_traits', 'attention_opposite', 'slave', 'passion_fame', -1)",
  assert(`qa_attention_return = 1 and slave['passion_fame'] = 0`, 'negative-removal-allowed')
 ]));
 for (const role of ['slave','assistant','stock','dynslave']) {
  tests.push(make(`attention_positive_wins_repair_${role}`, [
   `killvar '${role}'`, `${role}['abuse_attitude'] = -1`, `${role}['passion_fame'] = -1`, `${role}['passion_fame_revealed'] = 2`,
   assert(`${has(role)} = 1 and ${value(role,'passion_fame')} = -1 and ${role}['passion_fame'] = -1`, 'query-pure-before-repair'),
   assert(`func('jo9_traits', 'attention_repair', '${role}') = 1`, 'repair-happened'),
   assert(`${has(role)} = 1 and ${role}['abuse_attitude'] = -1 and ${role}['passion_fame'] = 0 and ${role}['passion_fame_revealed'] = 0`, 'only-negative-cleared'),
   assert(`${value(role,'passion_fame')} = 1`, 'merged-value-after-repair'),
   assert(`func('jo9_traits', 'attention_repair', '${role}') = 0`, 'repair-idempotent'),
   `${role}['jo9_attention'] = 1`, `${role}['abuse_attitude'] = 2`, `${role}['passion_fame'] = -1`,
   "gs 'jo9_traits', 'attention_repair', '" + role + "'",
   assert(`${role}['abuse_attitude'] = 2 and ${role}['passion_fame'] = 0 and ${has(role)} = 1`, 'psi-positive-kept')
  ]));
 }
 tests.push(make('attention_editor_invalid_state', [
  "killvar 'slave'", "slave_state = CONST_INT['no_slave']",
  "gs 'jo9_traits', 'attention_edit', 'slave'",
  "gs 'jo9_traits', 'attention_opposite', 'slave', 'abuse_attitude', 2",
  assert(`slave['jo9_attention'] = 0 and slave['abuse_attitude'] = 0`, 'no-actor-no-edit')
 ]));
 tests.push(make('attention_fresh_preserves_draws', [
  "killvar 'stock'", "stock['abuse_attitude'] = -1", "stock['passion_fame'] = 1",
  "gs 'jo9_traits', 'attention_fresh', 'stock'",
  assert(`stock['jo9_attention'] = 1 and stock['abuse_attitude'] = 0 and stock['passion_fame'] = 0`, 'fresh-single-key'),
  "stock['abuse_attitude'] = 2", "stock['passion_fame'] = -1",
  "gs 'jo9_traits', 'attention_fresh', 'stock'",
  assert(`stock['abuse_attitude'] = 2 and stock['passion_fame'] = 0`, 'fresh-positive-wins'),
  "stock['abuse_attitude'] = 1", "stock['passion_fame'] = 2",
  "gs 'jo9_traits', 'attention_fresh', 'stock'",
  assert(`stock['abuse_attitude'] = 1 and stock['passion_fame'] = 2`, 'fresh-unknown'),
  "killvar 'stock'", "stock['abuse_attitude'] = 2", "stock['passion_fame'] = -1",
  "gs 'jo9_traits', 'attention_fresh', 'stock'",
  assert(`stock['abuse_attitude'] = 2 and stock['passion_fame'] = -1`, 'no-attention-no-repair')
 ]));
 for (const role of ['slave','assistant']) {
  tests.push(make(`attention_chaotic_${role}`, [
   `killvar '${role}'`, `${role}_state = CONST_INT['slave_exist']`,
   `${role}['jo9_attention'] = 1`, `${role}['abuse_attitude'] = -1`, `${role}['passion_fame'] = 1`,
   'chaotic_essence = 1',
   assert(`func('jo9_chaotic', 'count', '${role}') = 1`, 'single-candidate'),
   assert(`func('jo9_chaotic', 'apply', '${role}') = 1`, 'item-success'),
   assert(`chaotic_essence = 0 and ${has(role)} = 0 and $jo9_chaotic_removed = '주목욕구'`, 'item-once'),
   `${role}['jo9_attention'] = 1`, `${role}['abuse_attitude'] = 2`, `${role}['passion_fame'] = -1`,
   'chaotic_essence = 1',
   assert(`func('jo9_chaotic', 'count', '${role}') = 1`, 'opposite-candidate'),
   assert(`func('jo9_chaotic', 'apply', '${role}') = 1`, 'opposite-item-success'),
   assert(`${has(role)} = 0 and ${role}['abuse_attitude'] = 2 and ${role}['passion_fame'] = -1`, 'item-preserves-opposites')
  ]));
 }
 if (ctx) {
  const source = ctx.get('interaction_result');
  const actual = source.match(/! JO9 MOD START ATTENTION_PRAISE_ONCE[^\r\n]*[\r\n]+([\s\S]*?)! JO9 MOD END ATTENTION_PRAISE_ONCE/)[1];
  for (const combination of ['legacy-abuse','legacy-fame','legacy-both','canonical-and-both']) {
   const lines = ["killvar 'slave'", "killvar 'slave_rate'", "$slave_psy_status = 'normal'", 'interaction_reward_potence = 7', 'interaction_reward_level = 3'];
   if (combination !== 'legacy-fame') lines.push("slave['abuse_attitude'] = -1");
   if (combination !== 'legacy-abuse') lines.push("slave['passion_fame'] = 1");
   if (combination === 'canonical-and-both') lines.push("slave['jo9_attention'] = 1");
   lines.push(actual, assert(`slave_rate['mood'] = 7 and slave['pos_praise'] = 3`, 'actual-branch-once'));
   tests.push(make(`attention_praise_${combination}`, lines));
  }
  const actualDisplay = ctx.get('#static_base').match(/! JO9 MOD START ATTENTION_SINGLE_DISPLAY[^\r\n]*[\r\n]+([\s\S]*?)! JO9 MOD END ATTENTION_SINGLE_DISPLAY/)[1];
  for (const role of ['slave','assistant']) {
   tests.push(make(`attention_display_${role}`, [
    `killvar '${role}'`, `${role}['abuse_attitude'] = -1`, `${role}['passion_fame'] = 1`,
    `${role}['abuse_attitude_revealed'] = 2`, `${role}['passion_fame_revealed'] = 2`,
    "spell_revelio = 0", `$${role}_features_list = ''`,
    `dynamic $replace({${actualDisplay}}, 'dynslave', '${role}')`,
    assert(`len($${role}_features_list) - len($replace($${role}_features_list, '주목욕구', '')) = 4`, 'one-visible-row'),
    assert(`instr($${role}_features_list, '연극성 인격장애') = 0 and instr($${role}_features_list, '인지욕구') = 0`, 'no-old-labels')
   ]));
   tests.push(make(`attention_role_editor_${role}`, [
    `killvar '${role}'`, `${role}_state = CONST_INT['slave_exist']`, `${role}['jo9_attention'] = 1`,
    "$setting_display = ''", "$setting_display_r = ''",
    `gs 'jo9_traits', 'editor', '${role}'`,
    assert(`len($setting_display_r) - len($replace($setting_display_r, '주목욕구', '')) = 4`, 'one-editor-row'),
    assert(`instr($setting_display_r, 'attention_edit') > 0 and instr($setting_display_r, '${role}') > 0`, 'actor-link'),
    assert(`${role}['jo9_attention'] = 1 and ${role}['abuse_attitude'] = 0 and ${role}['passion_fame'] = 0`, 'render-no-migration')
   ]));
  }
 }
 return tests;
}

module.exports = {apply,testCases,helper,description,patch:PATCH};
