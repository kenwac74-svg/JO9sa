'use strict';

// Isolated QSP generation only. This module never writes WORK.
// Root embeds helper after the liquidation sale mode/role locals and whitelist.
const helper = `! JO9 MOD START INSOLVENCY_ACTOR_QUEST_FAILURE_20261025
if $jo9_lqs_mode = 'fail_quests':
 local jo9_lqf_type = 0
 dynamic 'jo9_lqf_type = <<$jo9_lqs_slot>>_type'
 result = 0
 if jo9_lq['active'] ! 1: exit
 if jo9_lqf_type = 2572 and felicity = 1 and active[$quest[12]] = 1 and $quest12 ! 'fail':
  $quest12 = 'fail'
  $quest12_failreason = '파산 정산으로 의뢰 대상자를 다른 노예상에게 넘겨버렸군, 노예상.'
  result = 1
 end
 if jo9_lqf_type = 2584 and active[$quest[14]] = 1:
  active[$quest[14]] = 3
  jo9_lq_failed_quest['venera'] = 1
  result = 1
 end
 if jo9_lqf_type = 2585 and active[$quest[15]] = 1:
  active[$quest[15]] = 3
  jo9_lq_failed_quest['pelageya'] = 1
  result = 1
 end
 if jo9_lqf_type = 2610 and npc_progress['kotshey'] = 1 and npc_progress['kotshey_2nd'] = 0:
  npc_progress['kotshey'] = 2
  npc_progress['kotshey_2nd'] = 2
  result = 1
 end
 if jo9_lqf_type = 2613 and npc_progress['shlyapkin'] = 1 and jo9_lq_failed_quest['shlyapkin'] = 0:
  jo9_lq_failed_quest['shlyapkin'] = 1
  result = 1
 end
 if jo9_lqf_type = 2616 and active[$event['Akabur_quest']] >= 2 and active[$event['Akabur_quest']] < 21 and npc_progress['elsa'] > 0 and npc_progress['elsa'] < 3:
  lost_quest_slave = 1
  active[$event['Akabur_quest']] = 22
  result = 1
 end
 if jo9_lqf_type = 2617 and active[$event['Akabur_quest']] >= 11 and active[$event['Akabur_quest']] < 21 and npc_progress['jasmine'] > 0:
  lost_quest_slave_jasmine = 1
  active[$event['Akabur_quest']] = 22
  result = 1
 end
 if jo9_lqf_type = 2619 and npc_progress['Tsyuansu'] = 1:
  npc_progress['Tsyuansu'] = 2
  result = 1
 end
 if jo9_lqf_type = 2620 and npc_progress['Hotorn_aliman'] = 1:
  npc_progress['Hotorn_aliman'] = 2
  result = 1
 end
 if jo9_lqf_type = 2579 and npc_progress['black_arhangel'] = 1 and jo9_lq_failed_quest['black_arhangel'] = 0:
  jo9_lq_failed_quest['black_arhangel'] = 1
  result = 1
 end
 if jo9_lqf_type = 2609 and npc_progress['azazel'] = 1 and jo9_lq_failed_quest['azazel'] = 0:
  jo9_lq_failed_quest['azazel'] = 1
  result = 1
 end
 if jo9_lqf_type = 2580 and npc_progress['Ledy_Karina'] = 1 and jo9_lq_failed_quest['Ledy_Karina'] = 0:
  jo9_lq_failed_quest['Ledy_Karina'] = 1
  result = 1
 end
 exit
end
! JO9 MOD END INSOLVENCY_ACTOR_QUEST_FAILURE_20261025`;

const entryGuards = `! JO9 MOD START INSOLVENCY_FAILED_REQUEST_ENTRY_20261025
local jo9_lq_failed_request = 0
if jo9_lq_failed_quest['venera'] = 1 and ((interaction_city >= 1540 and interaction_city <= 1543) or interaction_city = 6540): jo9_lq_failed_request = 1
if jo9_lq_failed_quest['pelageya'] = 1 and interaction_city >= 1550 and interaction_city <= 1555: jo9_lq_failed_request = 1
if jo9_lq_failed_quest['shlyapkin'] = 1 and interaction_city >= 10372 and interaction_city <= 10375: jo9_lq_failed_request = 1
if jo9_lq_failed_quest['black_arhangel'] = 1 and (interaction_city = 7923 or (interaction_city >= 79231 and interaction_city <= 79233)): jo9_lq_failed_request = 1
if jo9_lq_failed_quest['azazel'] = 1 and (interaction_city = 7932 or (interaction_city >= 79321 and interaction_city <= 79323) or interaction_city = 6541): jo9_lq_failed_request = 1
if jo9_lq_failed_quest['Ledy_Karina'] = 1 and interaction_city >= 9000 and interaction_city <= 9003: jo9_lq_failed_request = 1
if jo9_lq_failed_request = 1:
 msg '파산 정산으로 의뢰 대상자를 처분하여 이 의뢰는 실패로 끝났다. 더는 이 의뢰를 진행할 수 없다.'
 gt 'city_menu_form'
end
! JO9 MOD END INSOLVENCY_FAILED_REQUEST_ENTRY_20261025
`;

const edits = [
  {location: 'interaction_city', old: '!INTERACTIONS IN CITY', new: entryGuards + '!INTERACTIONS IN CITY', count: 1},
  {
    location: '$newloc',
    old: "if active[$event['Akabur_quest']] >= 12 and npc_progress['jasmine'] > 0:",
    new: "if active[$event['Akabur_quest']] >= 12 and active[$event['Akabur_quest']] < 21 and npc_progress['jasmine'] > 0:",
    count: 1
  },
  {
    location: '$newloc',
    old: "if active[$event['Akabur_quest']] >= 2 and npc_progress['elsa'] > 0 and npc_progress['elsa'] < 3:",
    new: "if active[$event['Akabur_quest']] >= 2 and active[$event['Akabur_quest']] < 21 and npc_progress['elsa'] > 0 and npc_progress['elsa'] < 3:",
    count: 1
  }
];

// Root can execute each code string in a disposable native-engine fixture.
// Tests deliberately call the failure mode directly; actual-sale and relocation
// integration must separately prove this mode is never called for quote/manual.
// Each string sets jo9_lqf_test_ok to 1 or 0, with no modal UI or navigation.
const tests = [
  `jo9_lq['active'] = 1
slave_type = 2584
active[$quest[14]] = 1
active[$quest[15]] = 1
jo9_lq_failed_quest['venera'] = 0
gs 'jo9_liquidation_sale', 'fail_quests', 'slave'
jo9_lqf_test_ok = iif(active[$quest[14]] = 3 and active[$quest[15]] = 1 and jo9_lq_failed_quest['venera'] = 1, 1, 0)`,
  `jo9_lq['active'] = 1
room4_type = 2585
active[$quest[15]] = 1
jo9_lq_failed_quest['pelageya'] = 0
gs 'jo9_liquidation_sale', 'fail_quests', 'room4'
jo9_lqf_test_ok = iif(active[$quest[15]] = 3 and jo9_lq_failed_quest['pelageya'] = 1, 1, 0)`,
  `jo9_lq['active'] = 1
iced_18_type = 2579
npc_progress['black_arhangel'] = 1
npc_progress['hell_hound'] = 0
jo9_lq_failed_quest['black_arhangel'] = 0
gs 'jo9_liquidation_sale', 'fail_quests', 'iced_18'
jo9_lqf_test_ok = iif(npc_progress['black_arhangel'] = 1 and npc_progress['hell_hound'] = 0 and jo9_lq_failed_quest['black_arhangel'] = 1, 1, 0)`,
  `jo9_lq['active'] = 1
slave_type = 2610
npc_progress['kotshey'] = 1
npc_progress['kotshey_2nd'] = 0
active[$quest[5]] = 1
gs 'jo9_liquidation_sale', 'fail_quests', 'slave'
jo9_lqf_test_ok = iif(npc_progress['kotshey'] = 2 and npc_progress['kotshey_2nd'] = 2 and active[$quest[5]] = 1, 1, 0)`,
  `jo9_lq['active'] = 1
slave_type = 2616
npc_progress['elsa'] = 2
active[$event['Akabur_quest']] = 11
lost_quest_slave = 0
gs 'jo9_liquidation_sale', 'fail_quests', 'slave'
jo9_lqf_test_ok = iif(lost_quest_slave = 1 and active[$event['Akabur_quest']] = 22, 1, 0)`,
  `jo9_lq['active'] = 1
assistant_type = 2617
npc_progress['jasmine'] = 3
active[$event['Akabur_quest']] = 20
lost_quest_slave_jasmine = 0
gs 'jo9_liquidation_sale', 'fail_quests', 'assistant'
jo9_lqf_test_ok = iif(lost_quest_slave_jasmine = 1 and active[$event['Akabur_quest']] = 22, 1, 0)`,
  `jo9_lq['active'] = 1
assistant_type = 2617
npc_progress['jasmine'] = 3
active[$event['Akabur_quest']] = 21
lost_quest_slave_jasmine = 0
gs 'jo9_liquidation_sale', 'fail_quests', 'assistant'
jo9_lqf_test_ok = iif(lost_quest_slave_jasmine = 0 and active[$event['Akabur_quest']] = 21, 1, 0)`,
  `jo9_lq['active'] = 1
slave_type = 2584
active[$quest[14]] = 2
jo9_lq_failed_quest['venera'] = 0
gs 'jo9_liquidation_sale', 'fail_quests', 'slave'
jo9_lqf_test_ok = iif(active[$quest[14]] = 2 and jo9_lq_failed_quest['venera'] = 0, 1, 0)`,
  `jo9_lq['active'] = 1
slave_type = 2579
npc_progress['black_arhangel'] = 2
jo9_lq_failed_quest['black_arhangel'] = 0
gs 'jo9_liquidation_sale', 'fail_quests', 'slave'
jo9_lqf_test_ok = iif(npc_progress['black_arhangel'] = 2 and jo9_lq_failed_quest['black_arhangel'] = 0, 1, 0)`,
  `jo9_lq['active'] = 1
slave_type = 2572
felicity = 1
active[$quest[12]] = 1
$quest12 = ''
gs 'jo9_liquidation_sale', 'fail_quests', 'slave'
jo9_lqf_test_ok = iif($quest12 = 'fail' and active[$quest[12]] = 1, 1, 0)`,
  `jo9_lq['active'] = 0
slave_type = 2584
active[$quest[14]] = 1
jo9_lq_failed_quest['venera'] = 0
gs 'jo9_liquidation_sale', 'fail_quests', 'slave'
jo9_lqf_test_ok = iif(active[$quest[14]] = 1 and jo9_lq_failed_quest['venera'] = 0, 1, 0)`,
  `jo9_lq['active'] = 1
slave_type = 1001
active[$quest[6]] = 1
active[$quest[7]] = 1
active[$quest[8]] = 1
active[$quest[9]] = 1
active[$quest[13]] = 1
gs 'jo9_liquidation_sale', 'fail_quests', 'slave'
jo9_lqf_test_ok = iif(active[$quest[6]] = 1 and active[$quest[7]] = 1 and active[$quest[8]] = 1 and active[$quest[9]] = 1 and active[$quest[13]] = 1, 1, 0)`
];

for (const [type, npc, flag] of [
  [2613, 'shlyapkin', 'shlyapkin'],
  [2609, 'azazel', 'azazel'],
  [2580, 'Ledy_Karina', 'Ledy_Karina']
]) {
  tests.push(`jo9_lq['active'] = 1
slave_type = ${type}
npc_progress['${npc}'] = 1
jo9_lq_failed_quest['${flag}'] = 0
sparks = 1234
gs 'jo9_liquidation_sale', 'fail_quests', 'slave'
jo9_lqf_test_ok = iif(npc_progress['${npc}'] = 1 and jo9_lq_failed_quest['${flag}'] = 1 and sparks = 1234, 1, 0)`);
}
for (const [type, npc] of [[2619, 'Tsyuansu'], [2620, 'Hotorn_aliman']]) {
  tests.push(`jo9_lq['active'] = 1
slave_type = ${type}
npc_progress['${npc}'] = 1
sparks = 1234
gs 'jo9_liquidation_sale', 'fail_quests', 'slave'
jo9_lqf_test_ok = iif(npc_progress['${npc}'] = 2 and sparks = 1234, 1, 0)`);
}

module.exports = {helper, edits, tests};
