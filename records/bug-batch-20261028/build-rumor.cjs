'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),baseline='dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae';
a.equal(d.hash,baseline);const edits=[];
const cr=s=>s.replace(/\r?\n/g,'\r\n');
const get=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
function edit(location,old,now,patchId){old=cr(old);now=cr(now);const body=get(location);a.equal(body.split(old).length-1,1,patchId);d.lines[d.locations.find(l=>l.name===location).body]=c.shift(body.replace(old,()=>now),-5);edits.push({location,field:'body',old,new:now,count:1,patchId});}
let old=get('jo9_traits_value').split('! JO9 MOD END DEALER_QUOTE')[0];
let now=old;
now=now.replace(/\brating\b/g,'jo9_dealer_rating').replace(/\bslave_base_price\b/g,'jo9_dealer_base').replace(/\bslaveprice\b/g,'jo9_dealer_price');
now=now.replace(" local $jo9_dealer_vendor = $args[1]",()=>` local $jo9_dealer_vendor = $args[1]
 ! JO9 MOD START RUMOR_GUILD_QUOTE_ACTOR_20261028
 local $jo9_dealer_actor = $args[2]
 if $jo9_dealer_actor = '': $jo9_dealer_actor = 'slave'
 if $jo9_dealer_actor ! 'slave' and $jo9_dealer_actor ! 'jo9_rumor_probe': result = 0 & exit
 local jo9_dealer_rating = args[3]
 local jo9_dealer_base = args[4]
 local jo9_dealer_price = args[5]
 local jo9_dealer_state = dyneval('result = ' + $jo9_dealer_actor + '_state')
 local jo9_dealer_brand = dyneval('result = ' + $jo9_dealer_actor + "['brand']")
 ! JO9 MOD END RUMOR_GUILD_QUOTE_ACTOR_20261028`);
now=now.replace("if slave_state ! CONST_INT['slave_exist'] and slave_state ! CONST_INT['slave_faint']", "if jo9_dealer_state ! CONST_INT['slave_exist'] and jo9_dealer_state ! CONST_INT['slave_faint']");
now=now.replaceAll("slave['brand']",'jo9_dealer_brand').replaceAll("slave['obedience']",'jo9_dealer_obedience').replaceAll('$slave_psy_status','$jo9_dealer_psy');
now=now.replace(" killvar 'is_stock'", " if $jo9_dealer_actor = 'slave': killvar 'is_stock'");
now=now.replace(" gs '$slave_price'", ()=>` ! The rumor probe receives explicit appraisal inputs from the isolated scan.
 if $jo9_dealer_actor = 'slave':
  gs '$slave_price', $jo9_dealer_actor
  jo9_dealer_rating = rating
  jo9_dealer_base = slave_base_price
  jo9_dealer_price = slaveprice
 end
 ! Read derived values after the existing appraisal recalculates them.
 local jo9_dealer_obedience = dyneval('result = ' + $jo9_dealer_actor + "['obedience']")
 local $jo9_dealer_psy = $dyneval('$result = $' + $jo9_dealer_actor + '_psy_status')`);
now=now.replaceAll("'base_price', 'slave',", "'base_price', $jo9_dealer_actor,");
now=now.replace("if $args[0] = 'dealer_quote':",()=>"! JO9 MOD START RUMOR_GUILD_QUOTE_SHARED_20261028\r\nif $args[0] = 'dealer_quote':");
now+='! JO9 MOD END RUMOR_GUILD_QUOTE_SHARED_20261028\r\n';
edit('jo9_traits_value',old,now,'RUMOR_GUILD_QUOTE_ACTOR_20261028');
edit('jo9_rumor_scan',"   jo9_rs_best = -1",`   ! JO9 MOD START RUMOR_COMPARE_GUILD_20261028
   local jo9_rs_guild_quote = 0
   local jo9_rs_virgin_bonus = 0
   if jo9_rumor_probe['virginity'] < 2: jo9_rs_virgin_bonus = 50 * relative_rating
   if jo9_rumor_probe['virginity'] < 1: jo9_rs_virgin_bonus *= 2
   if jo9_rumor_probe_state = CONST_INT['slave_exist'] and jo9_rumor_probe['brand'] > 0:
    if difficulty_setting ! 2 or rating > 0: jo9_rs_guild_quote = func('jo9_traits_value', 'dealer_quote', 'wong', 'jo9_rumor_probe', rating, slave_base_price, slaveprice)
   end
   jo9_rs_best = -1
   ! JO9 MOD END RUMOR_COMPARE_GUILD_20261028`,'RUMOR_COMPARE_GUILD_20261028');
edit('jo9_rumor_scan',"       jo9_rs_rank = demand_rating[$jo9_rumor_buyer[jo9_rs_b]]",`       ! JO9 MOD START RUMOR_CURRENT_PRICE_ORDER_20261028
       if $jo9_rumor_mode[jo9_rs_b] = 'simple':
        jo9_rs_rank = func('jo9_traits_value', 'base_price', 'jo9_rumor_probe', common_price[demand_rating[$jo9_rumor_buyer[jo9_rs_b]]])
       else
        jo9_rs_rank = min(8000, common_price[demand_rating[$jo9_rumor_buyer[jo9_rs_b]]] + jo9_rs_virgin_bonus)
       end
       ! JO9 MOD END RUMOR_CURRENT_PRICE_ORDER_20261028`,'RUMOR_CURRENT_PRICE_ORDER_20261028');
edit('jo9_rumor_scan',`   if arrsize('$jo9_rs_hits') = 0:
    $jo9_rs_sentence = '<<$jo9_rs_actor>>에게는 지금 이 지역에서 권할 만한 고정 구매처가 떠오르지 않는군. 몸 상태나 낙인, 교육 정도를 다시 살펴보게.'
    $jo9_rumor_pages[arrsize('$jo9_rumor_pages')] = $jo9_rs_sentence
   else`, `   ! JO9 MOD START RUMOR_GUILD_FALLBACK_20261028
   if jo9_rs_guild_quote > 0 and jo9_rs_guild_quote >= jo9_rs_best:
    if arrsize('$jo9_rs_hits') = 0:
     $jo9_rs_sentence = '지금 이 근방에선 <<$jo9_rs_actor>>를 특별히 찾는 손님은 없군. 돈이 급하다면 길드의 재매입상에게 가보게.'
    else
     $jo9_rs_sentence = '<<$jo9_rs_actor>>라면 지금은 길드의 재매입상을 찾아가는 편이 낫겠군. 돈이 급하다면 그쪽과 이야기해 보게.'
    end
    $jo9_rumor_pages[arrsize('$jo9_rumor_pages')] = $jo9_rs_sentence
   elseif arrsize('$jo9_rs_hits') = 0:
    $jo9_rs_sentence = '<<$jo9_rs_actor>>에게는 지금 이 지역에서 권할 만한 고정 구매처가 떠오르지 않는군. 몸 상태나 낙인, 교육 정도를 다시 살펴보게.'
    $jo9_rumor_pages[arrsize('$jo9_rumor_pages')] = $jo9_rs_sentence
   else
   ! JO9 MOD END RUMOR_GUILD_FALLBACK_20261028`,'RUMOR_GUILD_FALLBACK_20261028');
const line=" $jo9_rm_page_text = replace($jo9_rm_page_text, '내가 듣기로는 ', '제가 듣기로는 ')";
edit('jo9_buyer_rumors',line,`${line}
 ! JO9 MOD START RUMOR_GUILD_ANES_VOICE_20261028
 $jo9_rm_page_text = replace($jo9_rm_page_text, '를 특별히 찾는 손님은 없군. 돈이 급하다면 길드의 재매입상에게 가보게.', '를 특별히 찾는 손님은 없네요. 돈이 급하시다면 길드의 재매입상에게 가보세요.')
 $jo9_rm_page_text = replace($jo9_rm_page_text, '라면 지금은 길드의 재매입상을 찾아가는 편이 낫겠군. 돈이 급하다면 그쪽과 이야기해 보게.', '라면 지금은 길드의 재매입상을 찾아가는 편이 낫겠어요. 돈이 급하시다면 그쪽과 이야기해 보세요.')
 ! JO9 MOD END RUMOR_GUILD_ANES_VOICE_20261028`,'RUMOR_GUILD_ANES_VOICE_20261028');
const after=c.serialize(d);qa.inspectWorld(after);a.deepEqual(c.serialize(c.parse(after)),after);
const patch={id:'2026-10-28_rumor_guild_fallback',description:'가격을 드러내지 않는 지역 구매자 소문: 실제 정가와 길드 재매입 견적을 비교하고 길드 우선 안내. 일반 거래 견적과 상태·금액 보존.',before_sha256:baseline,after_sha256:c.hash(after),edits};
fs.writeFileSync(__dirname+'/rumor-patch.json',JSON.stringify(patch,null,2)+'\n');
for(const name of ['jo9_traits_value','jo9_rumor_scan','jo9_buyer_rumors'])fs.writeFileSync(__dirname+'/candidate-'+name+'.txt',get(name));
console.log(JSON.stringify({id:patch.id,before:baseline,after:patch.after_sha256,edits:edits.length,newLocations:0}));
