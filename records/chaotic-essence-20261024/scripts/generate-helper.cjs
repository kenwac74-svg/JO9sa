'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = 'G:/Codex/tmp/jo9-chaotic-essence-20261024';
const rows = [
 { key:'grace', op:'<', value:0, label:'촌뜨기', revealed:true },
 { key:'dexterity', op:'<', value:0, label:'투박한 손놀림', revealed:true },
 { key:'sport_affinity', op:'=', value:-1, label:'게으름', revealed:true },
 { key:'masochism', op:'=', value:-1, label:'통증 공포증', revealed:true, xp:'masochism_xp' },
 { key:'exhibitionism', op:'=', value:-1, label:'노출 기피', revealed:true, xp:'exhibitionism_xp' },
 { key:'meekness', op:'<', value:0, label:'자유로운 영혼', revealed:true },
 { key:'selfesteem', op:'<', value:0, label:'자책망상', revealed:true },
 { key:'abuse_attitude', op:'=', value:-1, label:'연극성 인격장애', revealed:true, xp:'abuse_xp' },
 { key:'darkness_attitude', op:'=', value:-1, label:'암흑 공포증', revealed:true, xp:'darkness_xp' },
 { key:'blood_attitude', op:'=', value:-1, label:'혈액 공포증', revealed:true, xp:'blood_xp' },
 { key:'fire_attitude', op:'=', value:-1, label:'발화 공포증', revealed:true, xp:'fire_xp' },
 { key:'water_attitude', op:'=', value:-1, label:'물 공포증', revealed:true, xp:'water_xp' },
 { key:'vermin_attitude', op:'=', value:-1, label:'벌레 공포증', revealed:true, xp:'vermin_xp' },
 { key:'deprivation_attitude', op:'=', value:-1, label:'폐소 공포증', revealed:true, xp:'deprivation_xp' },
 { key:'jo9_gag_reflex', op:'=', value:1, label:'반사적 구역질' },
 { key:'anal_affinity', op:'<', value:0, label:'애널섹스 혐오' },
 { key:'defiant', op:'=', value:1, label:'거센 반항심' },
 { key:'jo9_voice_trait', op:'=', value:1, label:'선천적 벙어리' },
 { key:'jo9_work_ethic', op:'=', value:-1, label:'안분지족', known:true },
 { key:'jo9_focus', op:'=', value:-1, label:'산만함', known:true },
 { key:'jo9_grudge', op:'=', value:1, label:'옹졸함', known:true },
 { key:'jo9_constitution', op:'=', value:-1, label:'약골' },
 { key:'jo9_learning_trait', op:'=', value:-1, label:'백치' }
];
const grudgeSuffixes = ['neg_pain','neg_abuse','neg_disgust','neg_no_praise','neg_shame','neg_prisoner','neg_job','neg_forced','neg_raped','neg_defloration','neg_artifact','neg_cheap_gift','neg_cheap_reward','neg_pony_died','neg_sa_catfight','neg_sa_love_lost2','neg_sa_demote','neg_sa_friend_prisoned','neg_sa_friend_punished','neg_sa_love_lost1','neg_another_sleep_together'];
const lines = [
 '! JO9 MOD START CHAOTIC_ESSENCE_HELPER | 2026-10-24_chaotic_essence',
 '! count: eligible negative axes. apply: remove one held axis and consume one chaotic_essence on success.',
 '! use: invoke apply and show the result. Actor roles are limited to the active slave or assistant.',
 'result = 0',
 "local $jo9_chaotic_mode = $args[0]",
 "local $jo9_chaotic_role = $args[1]",
 "if $jo9_chaotic_mode = 'apply': $jo9_chaotic_removed = ''",
 "if $jo9_chaotic_mode ! 'count' and $jo9_chaotic_mode ! 'apply' and $jo9_chaotic_mode ! 'use': exit",
 "if $jo9_chaotic_role ! 'slave' and $jo9_chaotic_role ! 'assistant': exit",
 "local jo9_chaotic_state = dyneval('result = ' + $jo9_chaotic_role + '_state')",
 "if jo9_chaotic_state <= CONST_INT['no_slave']:",
 " if $jo9_chaotic_mode = 'use': msg '사용할 대상이 없습니다.'",
 ' exit',
 'end',
 "if $jo9_chaotic_mode = 'use':",
 ' if chaotic_essence < 1:',
 "  msg '카오틱 에센스가 없습니다.'",
 '  exit',
 ' end',
 " local jo9_chaotic_used = func('jo9_chaotic', 'apply', $jo9_chaotic_role)",
 ' if jo9_chaotic_used = 1:',
 "  msg '카오틱 에센스를 사용해 <<$jo9_chaotic_removed>> 특성을 제거했습니다. 남은 수량: <<chaotic_essence>>개.'",
 ' else',
 "  msg '제거할 부정 특성이 없습니다. 카오틱 에센스는 소모되지 않았습니다.'",
 ' end',
 ' result = jo9_chaotic_used',
 ' exit',
 'end',
 "if $jo9_chaotic_mode = 'apply' and chaotic_essence < 1: exit",
 'local jo9_chaotic_count = 0',
 "local $jo9_chaotic_keys = ''",
 "local $jo9_chaotic_labels = ''",
 "local $jo9_chaotic_xps = ''",
 'dynamic $replace({'
];
for (const r of rows) lines.push(
 ` if jo9ceactor['${r.key}'] ${r.op} ${r.value}:`,
 `  $jo9_chaotic_keys[jo9_chaotic_count] = '${r.key}'`,
 `  $jo9_chaotic_labels[jo9_chaotic_count] = '${r.label}'`,
 `  $jo9_chaotic_xps[jo9_chaotic_count] = '${r.xp || ''}'`,
 '  jo9_chaotic_count += 1',
 ' end'
);
lines.push(
 "}, 'jo9ceactor', $jo9_chaotic_role)",
 "if $jo9_chaotic_mode = 'count': result = jo9_chaotic_count & exit",
 'if jo9_chaotic_count < 1: exit',
 'local jo9_chaotic_pick = rand(0, jo9_chaotic_count - 1)',
 'local $jo9_chaotic_selected = $jo9_chaotic_keys[jo9_chaotic_pick]',
 'local $jo9_chaotic_selected_xp = $jo9_chaotic_xps[jo9_chaotic_pick]',
 'dynamic $replace({',
 ' jo9ceactor[$args[0]] = 0',
 " if $args[1] ! '': jo9ceactor[$args[1]] = 0",
 ` if instr('|${rows.filter(r=>r.revealed).map(r=>r.key).join('|')}|', '|' + $args[0] + '|') > 0: jo9ceactor[$args[0] + '_revealed'] = 0`,
 " if $args[0] = 'jo9_work_ethic' or $args[0] = 'jo9_focus' or $args[0] = 'jo9_grudge': jo9ceactor[$args[0] + '_known'] = 0",
 " if $args[0] = 'jo9_focus':",
 "  jo9ceactor['jo9_focus_active'] = 0",
 "  jo9ceactor['jo9_focus_xp_credit'] = 0",
 "  $jo9ceactor['jo9_focus_subject'] = ''",
 ' end',
 " if $args[0] = 'jo9_grudge':"
);
for (const suffix of grudgeSuffixes) lines.push(`  jo9ceactor['jo9_memory_${suffix}'] = 0`);
lines.push(
 ' end',
 "}, 'jo9ceactor', $jo9_chaotic_role), $jo9_chaotic_selected, $jo9_chaotic_selected_xp",
 '$jo9_chaotic_removed = $jo9_chaotic_labels[jo9_chaotic_pick]',
 'chaotic_essence -= 1',
 "if $get_lab_space ! '': dynamic $get_lab_space",
 'result = 1',
 '! JO9 MOD END CHAOTIC_ESSENCE_HELPER'
);
const body = lines.join('\r\n') + '\r\n';
const helper = { name:'jo9_chaotic', desc:'', body, actions:[] };
const jsonPath = path + '/helper.json';
fs.writeFileSync(jsonPath, JSON.stringify(helper,null,2)+'\n', 'utf8');
const metadata = {
 id:'2026-10-24_chaotic_essence', name:helper.name,
 status:'GENERATED_NOT_NATIVE_VERIFIED', output:jsonPath,
 baselineSha256:'f2d5a9c2970bd7cbc7479f80901204b8fcdcaeab6cff83019a4a3ece6f8a9775',
 bodySha256:crypto.createHash('sha256').update(body).digest('hex'),
 bodyLineEndings:'CRLF', bodyLineCount:lines.length,
 inventory:'chaotic_essence', roles:['slave','assistant'],
 interfaces:{count:'func(jo9_chaotic,count,role): eligible axis count without mutation',apply:'func(jo9_chaotic,apply,role): 1 on one removal and one inventory consumed, otherwise 0',use:'gs(jo9_chaotic,use,role): apply result message'},
 globalRemovalName:'$jo9_chaotic_removed', selection:'One rand(0,count-1) call; one candidate entry per held eligible axis',
 rows:rows.map(r=>({...r,neutralValue:0,line:lines.findIndex(s=>s===` if jo9ceactor['${r.key}'] ${r.op} ${r.value}:`)+1})),
 grudgeFractionKeys:grudgeSuffixes.map(s=>'jo9_memory_'+s),
 cleanup:{revealedAxes:rows.filter(r=>r.revealed).map(r=>r.key),xpAxes:rows.filter(r=>r.xp).map(r=>r.key),knownAxes:rows.filter(r=>r.known).map(r=>r.key),focus:['jo9_focus_active','jo9_focus_xp_credit','$jo9_focus_subject']},
 externalDependency:'Only dynamic $get_lab_space after success, if defined',
 preserved:['All other traits and statuses','jo9_versatile','jo9_versatile_manual_off','arena_level','has_ride_win','jo9_real_wins','jo9_defiant_resolved','jo9_slave_nature_initialized','base attributes and all skill XP','fame and surgery history','actual neg_* mood memories','work activity history','learning and oral/anal positive-trait fraction credits'],
 forbiddenCallsPresent:false, productionTestHooks:false
};
fs.writeFileSync(path+'/helper-meta.json',JSON.stringify(metadata,null,2)+'\n','utf8');
const back=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
if (back.name!=='jo9_chaotic' || back.actions.length || /(?<!\r)\n|\r(?!\n)/.test(back.body)) throw Error('Invalid helper shape or line endings');
if (new Set(rows.map(r=>r.key)).size!==23 || rows.filter(r=>r.xp).length!==9 || grudgeSuffixes.length!==21) throw Error('Invalid candidate or cleanup counts');
if (/gs\s+'(?:jo9_traits|\$slave_price)'|jo9_traits_value|jo9_traits_personality|newloc_update_slave|update_slave_price|test_seed|forced_target/.test(body)) throw Error('Unexpected refresh dependency or test hook');
console.log(JSON.stringify({output:jsonPath,metadata:path+'/helper-meta.json',bodyLineCount:lines.length,candidates:rows.length,xpKinds:rows.filter(r=>r.xp).length,grudgeFractionKeys:grudgeSuffixes.length,bodySha256:metadata.bodySha256,staticShapeCheck:true}));
