const fs = require('fs');
const path = require('path');
const dir='G:/Codex/tmp/jo9-insolvency-20261023';
// No buyer catalogue or NPC quest logic is part of the emergency sale.
const body=`! JO9 MOD START LIQUIDATION_SALE_V1 | 2026-10-23_asset_liquidation
! Emergency sale: half of current valuation, independent from named NPC orders.
local $jo9_lqs_mode = $args[0]
local $jo9_lqs_slot = $args[1]
local jo9_lqs_expected_price = args[2]
local jo9_lqs_expected_type = args[3]
local $jo9_lqs_expected_buyer = $args[4]
local $jo9_lqs_expected_name = $args[5]
result = 0
jo9_lq_sale_sold = 0
if $jo9_lqs_slot ! 'slave' and $jo9_lqs_slot ! 'assistant': exit
if $jo9_lqs_mode ! 'query' and $jo9_lqs_mode ! 'sell': exit
if $jo9_lqs_mode = 'sell' and jo9_lq['active'] ! 1: exit
jo9_lq_sale_price[$jo9_lqs_slot] = 0
$jo9_lq_sale_buyer[$jo9_lqs_slot] = ''
$jo9_lq_sale_id[$jo9_lqs_slot] = ''
$jo9_lq_sale_scheme[$jo9_lqs_slot] = ''
$jo9_lq_sale_reason[$jo9_lqs_slot] = '급매로 내놓을 인물이 없다.'
if snk_room_target > 0:
 $jo9_lq_sale_reason[$jo9_lqs_slot] = '개인실 인물창을 닫은 뒤, 실제 노예와 조수를 다시 확인하자.'
 exit
end
! Nested GS/FUNC reads globals in the bundled engine; this clone is temporary.
killvar 'jo9_lq_probe'
killvar 'jo9_lq_probe_rate'
killvar 'jo9_lq_probe_state'
killvar 'jo9_lq_probe_type'
killvar '$jo9_lq_probe_psy_status'
killvar '$jo9_lq_probe_name'
copyarr 'jo9_lq_probe', $jo9_lqs_slot
copyarr '$jo9_lq_probe', '$' + $jo9_lqs_slot
copyarr 'jo9_lq_probe_rate', $jo9_lqs_slot + '_rate'
dynamic 'jo9_lq_probe_state = <<$jo9_lqs_slot>>_state & jo9_lq_probe_type = <<$jo9_lqs_slot>>_type & $jo9_lq_probe_psy_status = $<<$jo9_lqs_slot>>_psy_status & $jo9_lq_probe_name = $<<$jo9_lqs_slot>>_name'
jo9_lq_sale_type[$jo9_lqs_slot] = jo9_lq_probe_type
$jo9_lq_sale_actor[$jo9_lqs_slot] = $jo9_lq_probe_name
if jo9_lq_probe_state ! CONST_INT['slave_exist'] and jo9_lq_probe_state ! CONST_INT['slave_faint']: jump 'jo9_lqs_cleanup'
if jo9_lq_probe['brand'] = 4:
 $jo9_lq_sale_reason[$jo9_lqs_slot] = '내 소유가 아닌 인물은 처분할 수 없다.'
 jump 'jo9_lqs_cleanup'
end
! Existing valuation dependencies read the temporary clone and local scratch.
local slave_specialisation
local slave_obedience_bonus
local slaveprice
local haggling_limit
local relative_rating
local rating
local $rating_help
local is_stock
local slave_mood_bonus
local slave_nature
local slave_fear_bonus
local slave_obedience_penalty
local attribute_sum
local max_skill
local max_sex
local skill_sum
local maxsum
local slave_base_price
local base_meat_gain
local mince_gain
local mince_bonus
local meat_max
local meat_gain
local virgin_meat_gain
local meat_price
local skill_adv_mul
local overnight_rules_count
local relative_fat
local charm_from_aura
local charm
local $charm_stat
local $jo9_trait_value_mode
local $jo9_trait_value_actor
local jo9_trait_value_amount
local jo9_trait_value_saved_peerless
local jo9_trait_value_rate
local jo9_trait_value_grade
gs 'jo9_traits_value', 'refresh', 'jo9_lq_probe'
dynamic $replace($update_slave_price, 'dyn'+'slave', 'jo9_lq_probe')
! Apply the emergency discount once to slaveprice, before any merchant cut.
local jo9_lqs_price = slaveprice / 2
if jo9_lqs_price <= 0: jump 'jo9_lqs_cleanup'
jo9_lq_sale_price[$jo9_lqs_slot] = jo9_lqs_price
$jo9_lq_sale_id[$jo9_lqs_slot] = 'quick_sale'
$jo9_lq_sale_scheme[$jo9_lqs_slot] = 'quick_sale'
$jo9_lq_sale_buyer[$jo9_lqs_slot] = '다른 노예상'
$jo9_lq_sale_reason[$jo9_lqs_slot] = ''
if $jo9_lqs_mode = 'query': jump 'jo9_lqs_cleanup'
if jo9_lqs_price ! jo9_lqs_expected_price or jo9_lq_probe_type ! jo9_lqs_expected_type or $jo9_lqs_expected_buyer ! 'quick_sale' or $jo9_lq_probe_name ! $jo9_lqs_expected_name: jump 'jo9_lqs_cleanup'
! Only the selected actor and worn equipment are transferred; NPC state is untouched.
jo9_lq_sale_price[$jo9_lqs_slot] = 0
dynamic $replace($sold_clothing, '$slave[', '$' + $jo9_lqs_slot + '[')
dynamic $clear_slave_instance, $jo9_lqs_slot
sparks += jo9_lqs_price
jo9_lq_sale_sold = 1
result = 1
:jo9_lqs_cleanup
killvar 'jo9_lq_probe'
killvar 'jo9_lq_probe_rate'
killvar 'jo9_lq_probe_state'
killvar 'jo9_lq_probe_type'
killvar '$jo9_lq_probe_psy_status'
killvar '$jo9_lq_probe_name'
! JO9 MOD END LIQUIDATION_SALE_V1
`;
const dest=path.join(dir,'sales-body.txt');
fs.writeFileSync(dest,body.replace(/\n/g,'\r\n'),'utf8');
console.log(JSON.stringify({destination:dest,lines:body.trimEnd().split('\n').length,bytes:Buffer.byteLength(body)}));
