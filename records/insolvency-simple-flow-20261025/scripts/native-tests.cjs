'use strict';
// Disposable native probes only. This script never changes WORK, release or user saves.
const fs = require('node:fs');
const path = require('node:path');
const c = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa = require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const sc = require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const input = path.resolve(process.argv[2] || 'G:/Codex/tmp/jo9-insolvency-simple-20261025/candidate.qsp');
const out = path.resolve(process.argv[3] || 'G:/Codex/tmp/jo9-insolvency-simple-20261025/native');
const game = 'G:/somi/Jack O Nine Tails v2.4_work/game';
const saves = path.join(game, 'save/JO9_MANUAL_20261025/01_검사완료재확인');
const allowed = path.resolve('G:/Codex/tmp/jo9-insolvency-simple-20261025');
const relative = path.relative(allowed, out);
if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw Error('Output must be a diagnostic subdirectory of ' + allowed);
qa.assertOutside(out, [game, 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game', 'G:/somi/JO9O']);
const raw = fs.readFileSync(input);
fs.mkdirSync(out, {recursive: true});
fs.cpSync(path.join(game, 'json'), path.join(out, 'json'), {recursive: true});
fs.copyFileSync(path.join(game, 'config.xml'), path.join(out, 'config.xml'));
fs.writeFileSync(path.join(out, 'FastQSP.ini'), '[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const A = (condition, label) => `if ${condition}:\r\n msg 'JO9_QA_ASSERT_SIMPLE_${label}'\r\n exit\r\nend`;
const records = [];
const roles = ['slave', 'assistant'];
const facilityRoles = ['room1', 'room2', 'room3', 'room4', 'prisoner', 'farmhand', 'cow', 'harpy', 'pig', ...Array.from({length: 18}, (_, i) => 'iced_' + (i + 1))];
const facilities = ['lab', 'boudoir', 'dungeon', 'barn', 'pen', 'stasis_tank'];
const fixtureNames = {11: '11_assets-and-quick.sav', 12: '12_bill-settle-once.sav', 13: '13_occupied-assets.sav'};
function snapshot(names, prefix) {
  return names.flatMap(n => [`copyarr '${prefix}_${n}','${n}'`, `copyarr '$${prefix}_${n}','$${n}'`]);
}
function unchanged(names, prefix, label) {
  return names.flatMap(n => [
    A(`arrsize('${n}') ! arrsize('${prefix}_${n}')`, label + '_SIZE_' + n),
    `for qa_simple_i=0 to arrsize('${n}')-1:`,
    A(`${n}[qa_simple_i] ! ${prefix}_${n}[qa_simple_i] or $${n}[qa_simple_i] ! $${prefix}_${n}[qa_simple_i]`, label + '_' + n), 'end'
  ]);
}
function add(name, fixture, steps, stubs = {}) {
  const save = fs.readFileSync(path.join(saves, fixtureNames[fixture]));
  const prime = qa.primeState(sc.parse(save));
  const d = c.parse(raw);
  const loc = n => { const l = d.locations.find(x => x.name === n); if (!l) throw Error('Missing location ' + n); return l; };
  const marker = 'JO9_QA_SIMPLIFIED_' + name.replaceAll('-', '_') + '_COMPLETE';
  const common = ['killall', 'settimer 0', prime.code, "$counter=''", "$onnewloc=''", "$ongload=''", "gs 'refresh_database'", "$counter=''", "$onnewloc=''", "$ongload=''", 'settimer 0', 'autosave=0', 'decadesave=0', 'autosave_day=0', 'autosave_decade=0', 'sound_on=0', 'is_home=1', 'snk_room_target=0'];
  d.lines[loc('Start').body] = c.shift([...common, ...steps, `msg '${marker}'`].join('\r\n').replace(/\r?\n/g,'\r\n'), -5);
  for (const [n, body] of Object.entries(stubs)) d.lines[loc(n).body] = c.shift(body.replaceAll('@COMPLETE@', marker), -5);
  const bytes = c.serialize(d);
  qa.inspectWorld(bytes);
  const file = path.join(out, name + '.qsp');
  fs.writeFileSync(file, bytes);
  records.push({name, file, marker, checkpoint: 'Native production helpers with primed manual save; navigation-only stubs: ' + Object.keys(stubs).join(','), fixture: fixtureNames[fixture], saveHash: c.hash(save), sha256: c.hash(bytes)});
}

const stable = ['slave', 'slave_rate', 'assistant', 'assistant_rate', 'npc_progress', 'personal_relations', 'faction_fame', 'active'];
add('quote-move', 11, [
  ...snapshot(stable, 'qa_quote'), 'qa_money=sparks', 'qa_day=day', 'qa_estate_owner=owner', '$qa_estate=$estate',
  "gs 'jo9_liquidation_assets','quote_move'",
  A("jo9_lq_value['relocation_rooms'] ! 4400", 'ROOMS_TWENTY_PERCENT'),
  A("jo9_lq_value['relocation_people'] ! 0", 'EMPTY_OCCUPANTS_ZERO'),
  A("jo9_lq_value['relocation_house'] ! 75*estate_cost_main[$estate]/2", 'OWNED_HOUSE_VALUE'),
  A("jo9_lq_value['relocation'] ! jo9_lq_value['relocation_rooms']+jo9_lq_value['relocation_people']+jo9_lq_value['relocation_house']", 'QUOTE_SUM'),
  A('sparks ! qa_money or day ! qa_day or owner ! qa_estate_owner or $estate ! $qa_estate or kulaconstruct ! 4', 'QUOTE_NO_MUTATION'),
  ...unchanged(stable, 'qa_quote', 'QUOTE_PURE'),
  'owner=0', "gs 'jo9_liquidation_assets','quote_move'", A("jo9_lq_value['relocation_house'] ! 0 or jo9_lq_value['relocation'] ! 4400", 'RENTALS_NO_INCOME')
]);

add('move-empty-once', 11, [
  ...snapshot(stable, 'qa_move'), 'qa_slave_state=slave_state', 'qa_assistant_state=assistant_state',
  '$qa_slave_name=$slave_name', '$qa_assistant_name=$assistant_name',
  "gs 'jo9_liquidation_assets','quote_move'", "qa_expected=jo9_lq_value['relocation']", 'qa_money=sparks', "qa_bill=jo9_lq['bill']", 'qa_day=day',
  "gs 'jo9_liquidation_assets','move_slums'",
  A("$estate ! 'slum_house' or owner ! 0 or kulaconstruct ! 0", 'MOVE_HOME_STATE'),
  A(facilities.map(n => n + ' ! 0').join(' or '), 'MOVE_FACILITIES_ZERO'),
  A('sparks ! qa_money+qa_expected or day ! qa_day', 'MOVE_CREDIT_ONCE'),
  A("jo9_lq['bill'] ! qa_bill or jo9_lq['active'] ! 1", 'MOVE_BILL_SNAPSHOT'),
  A('slave_state ! qa_slave_state or assistant_state ! qa_assistant_state or $slave_name ! $qa_slave_name or $assistant_name ! $qa_assistant_name', 'MOVE_KEEP_ACTIVE_IDENTITY'),
  ...unchanged(stable, 'qa_move', 'MOVE_KEEP_ACTIVE'),
  'qa_money=sparks', "gs 'jo9_liquidation_assets','move_slums'",
  A('sparks ! qa_money or kulaconstruct ! 0', 'MOVE_REPEAT_NO_REFUND'),
  "gs 'jo9_liquidation_assets','quote_move'", A("jo9_lq_value['relocation'] ! 0", 'MOVED_QUOTE_ZERO')
]);

// Compare occupied facility quotes against the existing public half-value quick-sale helper.
const expectedOccupied = [];
for (const n of ['room4', 'iced_1']) expectedOccupied.push(
  `copyarr 'slave','${n}'`, `copyarr '$slave','$${n}'`, `copyarr 'slave_rate','${n}_rate'`,
  `slave_state=${n}_state`, `slave_type=${n}_type`, `$slave_name=$${n}_name`, `$slave_psy_status=$${n}_psy_status`,
  "gs 'jo9_liquidation_sale','query','slave'", A("jo9_lq_sale_price['slave'] <= 0", 'OCCUPANT_BASE_' + n),
  "qa_people_expected+=jo9_lq_sale_price['slave']", "dynamic $clear_slave_instance,'slave'"
);
add('move-occupied-once', 13, [
  ...snapshot(['npc_progress', 'personal_relations', 'faction_fame', 'active'], 'qa_people'), 'qa_people_expected=0', ...expectedOccupied,
  "gs 'jo9_liquidation_assets','quote_move'",
  A("jo9_lq_value['relocation_people'] ! qa_people_expected", 'OCCUPANT_HALF_VALUE'),
  "qa_expected=jo9_lq_value['relocation']", 'qa_money=sparks',
  "gs 'jo9_liquidation_assets','move_slums'",
  ...facilityRoles.map(n => A(n + "_state ! CONST_INT['no_slave']", 'ALL_OCCUPANCY_CLEARED_'+n)),
  A(facilities.map(n => n + ' ! 0').join(' or '), 'OCCUPIED_FACILITIES_ZERO'),
  A("$estate ! 'slum_house' or kulaconstruct ! 0 or sparks ! qa_money+qa_expected", 'OCCUPIED_MOVE_CREDIT'),
  ...unchanged(['npc_progress', 'personal_relations', 'faction_fame', 'active'], 'qa_people', 'NO_QUEST_REWARD'),
  'qa_money=sparks', "gs 'jo9_liquidation_assets','move_slums'", A('sparks ! qa_money', 'OCCUPIED_REPEAT_ZERO')
]);

add('decor-and-ledger', 12, [
  "qa_bill=jo9_lq['bill']", 'qa_day=day', "gs 'jo9_liquidation_assets','sell','decor'",
  A('sparks ! 460', 'DECOR_ACTUAL_REFUND'),
  A("$study ! 'basic' or $bed ! 'basic' or $kitchen ! 'basic' or $bath ! 'basic' or $lab ! 'basic' or $boudoir ! 'basic' or $dungeon ! 'basic'", 'DECOR_BASIC_STATE'),
  "gs 'jo9_liquidation_assets','sell','decor'", A('sparks ! 460', 'DECOR_NO_DOUBLE'),
  'final_payment=9999', "gs 'jo9_liquidation','begin'", A("jo9_lq['bill'] ! qa_bill", 'BILL_IMMUTABLE'),
  "gs 'jo9_liquidation','settle'", A("sparks ! 360 or jo9_lq['active'] ! 0 or day ! qa_day", 'SETTLE_ONCE'),
  "gs 'jo9_liquidation','settle'", A('sparks ! 360', 'SETTLE_NO_DOUBLE')
]);

add('stage-skips', 11, [
  "jo9_lq['page']=14", "gs 'jo9_liquidation','view'", A("jo9_lq['page'] ! 0", 'LEGACY_PAGE_DERIVED'),
  "gs 'jo9_liquidation_assets','sell','decor'", "gs 'jo9_liquidation','view'", A("jo9_lq['page'] ! 1", 'DECOR_TO_MOVE'),
  "gs 'jo9_liquidation_assets','move_slums'", "gs 'jo9_liquidation','view'", A("jo9_lq['page'] ! 2", 'SLUM_TO_SLAVE'),
  "dynamic $clear_slave_instance,'slave'", "gs 'jo9_liquidation','view'", A("jo9_lq['page'] ! 3", 'EMPTY_SLAVE_TO_ASSISTANT')
]);

const boundaryChecks = [
  A("day ! qa_day or sparks ! qa_money or jo9_lq['bill'] ! qa_bill or jo9_lq['active'] ! 1", 'DAY_BOUNDARY_BLOCKED'),
  A("total_food_cost ! qa_food or decade_cryo_costs ! qa_cryo or master_energy ! -5", 'NO_DAILY_CHARGES_OR_AP'),
  "msg '@COMPLETE@'"
].join('\r\n');
add('day-boundary-zero-ap', 11, [
  'qa_day=day', 'qa_money=sparks', "qa_bill=jo9_lq['bill']", 'qa_food=total_food_cost', 'qa_cryo=decade_cryo_costs', 'master_energy=-5', "gt 'next_day'"
], {jo9_liquidation: boundaryChecks});

const manualChecks = [
  A("jo9_lq['manual'] ! 1 or jo9_lq['active'] ! 1 or jo9_lq['bill'] ! qa_bill", 'MANUAL_PENDING'),
  A('day ! qa_day or sparks ! qa_money or kulaconstruct ! 4 or $estate ! $qa_estate', 'MANUAL_NO_MUTATION'),
  "msg '@COMPLETE@'"
].join('\r\n');
add('manual-preserves-state', 11, [
  'qa_day=day', 'qa_money=sparks', "qa_bill=jo9_lq['bill']", '$qa_estate=$estate', "gt 'jo9_liquidation','manual'"
], {menu_form: manualChecks});

// The same adult owned source is cloned into each supported home/storage role.
// Each role has a distinct display name; current active characters stay in place.
function cloneAssistant(role) {
  return [`copyarr '${role}','assistant'`, `copyarr '$${role}','$assistant'`, `copyarr '${role}_rate','assistant_rate'`,
    `${role}_state=CONST_INT['slave_exist']`, `${role}_type=assistant_type`, `$${role}_name='QA_${role}'`, `$${role}_psy_status=$assistant_psy_status`, `$${role}['contractor']=''`];
}
add('all-occupants-once', 11, [
  "jo9_lq['bill']=10000000", ...snapshot(['slave', 'slave_rate', 'assistant', 'assistant_rate', 'npc_progress', 'personal_relations', 'faction_fame', 'active'], 'qa_all'),
  "gs 'jo9_liquidation_sale','query','assistant'", "qa_unit=jo9_lq_sale_price['assistant']", A('qa_unit <= 0', 'ALL_SOURCE_POSITIVE'),
  ...facilityRoles.flatMap(cloneAssistant), ...facilities.map(n => n + '=1'),
  'qa_money=sparks', "qa_expected=27*qa_unit+4400+75*estate_cost_main[$estate]/2",
  "gs 'jo9_liquidation_assets','quote_move'", A("jo9_lq_value['relocation_people'] ! 27*qa_unit or jo9_lq_move_count ! 27", 'ALL_TWENTY_SEVEN_QUOTED'),
  A("jo9_lq_value['relocation'] ! qa_expected", 'ALL_TOTAL'),
  "gs 'jo9_liquidation_assets','move_slums'",
  ...facilityRoles.map(n => A(n + "_state ! CONST_INT['no_slave']", 'ALL_TWENTY_SEVEN_CLEARED_'+n)),
  A("sparks ! qa_money+qa_expected or $estate ! 'slum_house' or kulaconstruct ! 0 or cell_state ! 0", 'ALL_TOTAL_PAID'),
  A(facilities.map(n => n + ' ! 0').join(' or '), 'ALL_RENTALS_ENDED'),
  ...unchanged(['slave', 'slave_rate', 'assistant', 'assistant_rate', 'npc_progress', 'personal_relations', 'faction_fame', 'active'], 'qa_all', 'ALL_KEEP_ACTORS_QUESTS'),
  'qa_money=sparks', "gs 'jo9_liquidation_assets','move_slums'", A('sparks ! qa_money', 'ALL_REPEAT_ZERO')
]);

add('contract-returns', 11, [
  "jo9_lq['bill']=10000000", ...snapshot(['slave', 'slave_rate', 'assistant', 'assistant_rate'], 'qa_contract'),
  ...cloneAssistant('room1'), "room1['brand']=4", "$room1['contractor']=''", "contract['active']=1", "contract['salary']=77", "contract['time']=12", "active[$quest[10]]=1",
  'qa_guild_rate=guild_reputation_rate', 'qa_brand_rate=brand_rate', 'qa_money=sparks', "qa_fixed=4400+75*estate_cost_main[$estate]/2",
  "gs 'jo9_liquidation_assets','quote_move'", A("jo9_lq_value['relocation_people'] ! 0 or jo9_lq_move_returns ! 1", 'GUILD_RETURN_NOT_SOLD'),
  "gs 'jo9_liquidation_assets','move_slums'",
  A("room1_state ! CONST_INT['no_slave'] or contract['active'] ! 0 or active[$quest[10]] ! 0", 'GUILD_RETURN_FAILED_CLEANUP'),
  A('sparks ! qa_money+qa_fixed or guild_reputation_rate ! qa_guild_rate or brand_rate ! qa_brand_rate', 'GUILD_NO_REWARD_OR_PENALTY'),
  ...unchanged(['slave', 'slave_rate', 'assistant', 'assistant_rate'], 'qa_contract', 'GUILD_KEEP_ACTIVE'),
  "$estate='white_house'", "$interior='basic'", 'owner=0', "gs 'new_estate'", ...cloneAssistant('room1'), "room1['brand']=4", "$room1['contractor']='QA_NPC'",
  "contract['active']=1", "contract['salary']=88", "contract['time']=13", "active[$quest[10]]=1", ...snapshot(['contract', 'active'], 'qa_npc_contract'), 'qa_money=sparks',
  "gs 'jo9_liquidation_assets','move_slums'",
  A("room1_state ! CONST_INT['no_slave'] or sparks ! qa_money", 'NPC_RETURN_NO_SALE'),
  ...unchanged(['contract', 'active'], 'qa_npc_contract', 'NPC_KEEP_CONCURRENT_GUILD'),
  ...unchanged(['slave', 'slave_rate', 'assistant', 'assistant_rate'], 'qa_contract', 'NPC_KEEP_ACTIVE')
]);

add('room-levels-twenty', 11, [
  'qa_money=sparks', 'owner=0',
  ...[1000, 1400, 2400, 4400].flatMap((v, i) => [`kulaconstruct=${i + 1}`, "gs 'jo9_liquidation_assets','quote_move'", A(`jo9_lq_value['relocation_rooms'] ! ${v} or jo9_lq_value['relocation_people'] ! 0 or jo9_lq_value['relocation_house'] ! 0`, 'ROOM_LEVEL_' + (i + 1))]),
  A('sparks ! qa_money or kulaconstruct ! 4', 'ROOM_QUOTES_READ_ONLY'),
  "gs 'jo9_liquidation_assets','move_slums'", A('sparks ! qa_money+4400 or kulaconstruct ! 0', 'ROOM_ALL_CREDIT'),
  'qa_money=sparks', "gs 'jo9_liquidation_assets','move_slums'", A('sparks ! qa_money', 'ROOM_REPEAT_ZERO')
]);

// Actual manual dispatch remains in production. The navigation stub records the
// successful same-turn return and executes the real public existing quick-sale.
const manualTradeChecks = [
  A("jo9_lq['active'] ! 1 or jo9_lq['manual'] ! 1 or day ! qa_day or master_energy ! qa_master_ap or slave['energy'] ! qa_slave_ap or assistant['energy'] ! qa_assistant_ap", 'MANUAL_AP_PRESERVED'),
  "gs 'jo9_liquidation_sale','query','slave'", "qa_price=jo9_lq_sale_price['slave']", "qa_type=jo9_lq_sale_type['slave']", "$qa_name=$jo9_lq_sale_actor['slave']",
  A('qa_price <= 0', 'MANUAL_TRADE_AVAILABLE'),
  "gs 'jo9_liquidation_sale','sell','slave',qa_price,qa_type,'quick_sale',$qa_name",
  A("sparks ! qa_money+qa_price or slave_state ! CONST_INT['no_slave'] or day ! qa_day or master_energy ! qa_master_ap or assistant['energy'] ! qa_assistant_ap", 'MANUAL_SAME_TURN_TRADE'),
  "msg '@COMPLETE@'"
].join('\r\n');
add('manual-same-turn-trade', 11, [
  'master_energy=3', "slave['energy']=2", "assistant['energy']=4", 'qa_master_ap=master_energy', "qa_slave_ap=slave['energy']", "qa_assistant_ap=assistant['energy']", 'qa_day=day', 'qa_money=sparks', "gt 'jo9_liquidation','manual'"
], {menu_form: manualTradeChecks});

const questCases=require('./quest-implementation.cjs').tests;
add('actor-quest-failures',11,questCases.flatMap((body,i)=>[body,A('jo9_lqf_test_ok ! 1','ACTOR_QUEST_'+i)]));
add('quest-sale-integration',11,[
  "slave_type=2584", "active[$quest[14]]=1", "jo9_lq_failed_quest['venera']=0",
  "gs 'jo9_liquidation_sale','query','slave'",A("active[$quest[14]] ! 1 or jo9_lq_failed_quest['venera'] ! 0",'QUERY_NOT_FAILURE'),
  A("jo9_lq_sale_price['slave'] <= 0",'INTEGRATION_PRICE_POSITIVE'),
  "gs 'jo9_liquidation_sale','sell','slave',jo9_lq_sale_price['slave'],jo9_lq_sale_type['slave'],'quick_sale',$jo9_lq_sale_actor['slave']",
  A("slave_state ! 0 or active[$quest[14]] ! 3 or jo9_lq_failed_quest['venera'] ! 1",'ACTUAL_SALE_FAILS_QUEST')
]);
add('failed-request-guard',11,[
  "jo9_lq_failed_quest['venera']=1", 'interaction_city=1540', "gt 'interaction_city'"
],{city_menu_form:A('qa_guard_notice ! 1','FAILED_REQUEST_REENTRY_BLOCKED')+"\r\nmsg '@COMPLETE@'"});
{
 const r=records[records.length-1],d=c.parse(fs.readFileSync(r.file)),l=d.locations.find(x=>x.name==='interaction_city');
 const body=c.shift(d.lines[l.body],5),text="msg '파산 정산으로 의뢰 대상자를 처분하여 이 의뢰는 실패로 끝났다. 더는 이 의뢰를 진행할 수 없다.'";
 if(!body.includes(text))throw Error('Expected specific quest guard notice');
 d.lines[l.body]=c.shift(body.replace(text,()=>"qa_guard_notice=1"),-5);fs.writeFileSync(r.file,c.serialize(d));
 r.checkpoint+='; only expected guard modal replaced with assertion flag';
}

fs.writeFileSync(path.join(out, 'plan.json'), JSON.stringify(records.map(({sha256, saveHash, fixture, ...r}) => r), null, 2));
fs.writeFileSync(path.join(out, 'prepared.json'), JSON.stringify({input, sourceHash: c.hash(raw), records, limits: [
  'Native focused helper tests; Start is replaced and listed navigation checkpoints are stubbed only in disposable QSP copies.',
  'Manual save variables are primed with qa.primeState; original .sav files are never changed.',
  'Visual click layout and actual load CRC remain separate production release-check tasks.'
]}, null, 2));
console.log(JSON.stringify({input, out, sourceHash: c.hash(raw), probes: records.length}));
