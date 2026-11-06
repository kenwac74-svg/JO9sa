'use strict';
const fs=require('node:fs'), path=require('node:path'), core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const source=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(source), doc=core.parse(raw), edits=[];
if(!core.serialize(doc).equals(raw))throw Error('Baseline roundtrip failed');
const nl=s=>s.replace(/\r?\n/g,'\r\n');
const block=s=>nl('! JO9 MOD START SALE_TAX_20261105\n'+s+'\n! JO9 MOD END SALE_TAX_20261105');
const receiptPage = "killobj\nkillvar '$text'\nkillvar '$yes'\nkillvar '$no'\nkillvar '$special_action'\nkillvar '$special_image'\nkillvar '$special_image_full'\nkillvar '$play_sound'\n$bg_path = ''\n$picture_type = ''\n$interaction_type = ''";
function edit(location,old,value,count=1){
 old=nl(old);const replacement=nl(value), loc=doc.locations.find(l=>l.name===location);if(!loc)throw Error(location);
 const text=core.shift(doc.lines[loc.body],5), found=text.split(old).length-1;
 if(found!==count)throw Error(`${location}: expected ${count}, found ${found}: ${old}`);
 doc.lines[loc.body]=core.shift(text.split(old).join(replacement),-5);edits.push({location,field:'body',old,new:replacement,count});
}
edit('jo9_traits_value','! JO9 MOD START DEALER_QUOTE | 2026-10-24_dealer_economy',block(`! Input is the finalized gross; no persistent tax state or quote cache is created.
if $args[0] = 'sale_tax' or $args[0] = 'sale_net' or $args[0] = 'sale_receipt' or $args[0] = 'sale_pay':
 local jo9_sale_gross = args[1]
 local jo9_sale_rate = 0
 if difficulty_setting = 2 and jo9_sale_gross >= 6000: jo9_sale_rate = iif(jo9_sale_gross >= 10000, 10, 5)
 local jo9_sale_tax = jo9_sale_gross * jo9_sale_rate / 100
 result = jo9_sale_gross - jo9_sale_tax
 if $args[0] = 'sale_tax': result = jo9_sale_tax
 if $args[0] = 'sale_receipt' or $args[0] = 'sale_pay':
  $result = '<br><br>'
  if jo9_sale_tax > 0: $result += '악질적인 세금징수원이 거래 장부를 들이밀며 대금에서 세금을 떼어 갔다.<br>'
  $result += '거래 총액: $<<jo9_sale_gross>><br>판매세 (<<jo9_sale_rate>>%): $<<jo9_sale_tax>><br>실수령: $<<jo9_sale_gross - jo9_sale_tax>>'
 end
 if $args[0] = 'sale_pay': sparks += jo9_sale_gross - jo9_sale_tax
 exit
end`)+"\r\n\r\n! JO9 MOD START DEALER_QUOTE | 2026-10-24_dealer_economy");
edit('jo9_traits_value',' result = min(6000, result)',block('! Dealer quotes retain the full appraisal amount.'));
edit('slave_auction_sell','sell_price = min(6000, sell_price)',block('! Retain the full gross dealer quote, including any chosen premium.'));
edit('slave_auction_sell_end','sell_price = min(6000, sell_price)',block('! Settlement uses the validated full gross quote.'));
edit('interaction_city','\tsell_price = min(sell_price, 8000)',block('! Retain the full private quote; existing buyer budgets still apply.'),3);
for(const sex of ['M','F']){
 const old=`\tif difficulty_setting = 2 and sparks_get > 6000:
\t\t$text[arrsize('$text')-1] += '<br><br>악질적인 세금징수원이 낙찰가에서 이런저런 핑계로 스파크를 뜯어 가고, 내 손에는 $6,000만 쥐어졌다.'
\t\tsparks_get = 6000
\tend
\tsparks += sparks_get`;
 if(sex==='M')edit('interaction_city',old,block("\t$text[arrsize('$text')-1] += $func('jo9_traits_value', 'sale_pay', sparks_get)"),2);
}
edit('$guild_auction','! The gross quote is retained; difficulty_setting = 2 is capped only at payment.','! The gross quote is retained; the finalized payment uses the shared Hard sales tax.');
edit('interaction_screen_city',`if (interaction_city = 911 or interaction_city = 912 or interaction_city = 913) and ($interaction_type = 'slave_sold' or $interaction_type = 'slave_sold_house') and slave_state = CONST_INT['slave_exist'] and sell_price > 8000:
 $jo9_gold_result_text += '<br><br>개인 거래의 최종 지급액은 최대 $8,000이다.'
end`,block(`if (interaction_city = 911 or interaction_city = 912 or interaction_city = 913) and ($interaction_type = 'slave_sold' or $interaction_type = 'slave_sold_house') and slave_state = CONST_INT['slave_exist']:
 $jo9_gold_result_text += $func('jo9_traits_value', 'sale_receipt', sell_price)
end`));
edit('interaction_result_city','\tsell_price = min(sell_price, 8000)',block('! Use the finalized private gross without the old fixed cap.'),2);
edit('interaction_result_city','\tsparks += sell_price',block("\t$text[1] += $func('jo9_traits_value', 'sale_pay', sell_price)"),2);
const fixed="sparks += func('jo9_traits_value', 'base_price', 'slave', common_price[demand_rating[$npc_id]])";
edit('interaction_result_city',fixed,block("$text[1] += $func('jo9_traits_value', 'sale_pay', func('jo9_traits_value', 'base_price', 'slave', common_price[demand_rating[$npc_id]]))"),3);
edit('slave_sell_done','sparks += sell_price',block("$text[1] += $func('jo9_traits_value', 'sale_pay', sell_price)"));
edit('jo9_traits_value',' sparks += jo9_dealer_payment',block(receiptPage+"\n $text[1] = '[마스터 봉]<br>거래가 성사되었네.' + $func('jo9_traits_value', 'sale_pay', jo9_dealer_payment)"));
edit('jo9_traits_value'," master_moodlet['pos_deal'] = 3\n gt 'guild'",block(" master_moodlet['pos_deal'] = 3\n $place = 'guild_hall'\n $return_lock = 'guild'\n $npc_id = 'master_vong'\n npc = 1\n txt = 1\n gt 'interaction_screen_city'"));
edit('slave_auction_sell_end','sparks += sell_price',block(receiptPage+"\n$text[1] = '[잡파]<br>거래가 성사되었소.' + $func('jo9_traits_value', 'sale_pay', sell_price)"));
edit('slave_auction_sell_end',"! JO9 MOD END DEALER_FARID_PAID\ngt 'city_menu_form'", "! JO9 MOD END DEALER_FARID_PAID\r\n"+block("$place = 'slave_stage'\n$return_lock = 'city_menu_form'\n$npc_id = 'фарид_аукционщик'\nnpc = 1\ntxt = 1\ngt 'interaction_screen_city'"));
edit('jo9_rumor_scan',"jo9_rs_rank = min(8000, common_price[demand_rating[$jo9_rumor_buyer[jo9_rs_b]]] + jo9_rs_virgin_bonus)","jo9_rs_rank = common_price[demand_rating[$jo9_rumor_buyer[jo9_rs_b]]] + jo9_rs_virgin_bonus");
edit('jo9_rumor_scan',"   jo9_rs_best = -1",block("   jo9_rs_guild_quote = func('jo9_traits_value', 'sale_net', jo9_rs_guild_quote)\n   jo9_rs_best = -1"));
edit('jo9_rumor_scan',"       if jo9_rs_rank > jo9_rs_best:",block("       jo9_rs_rank = func('jo9_traits_value', 'sale_net', jo9_rs_rank)\n       if jo9_rs_rank > jo9_rs_best:"));
edit('$ongload',"if $npc_id = 'master_vong' and (instr($yes, 'TBV_SUBPURCHASER_BASE') > 0 or (instr($yes, 'dealer_wong_finish') > 0 and jo9_dealer_wong_quote > 6000)):","if $npc_id = 'master_vong' and (slave_state = CONST_INT['slave_exist'] or slave_state = CONST_INT['slave_faint']) and (instr($yes, 'TBV_SUBPURCHASER_BASE') > 0 or instr($yes, 'dealer_wong_finish') > 0):");
edit('$ongload','! JO9 MOD END DEALER_OLD_CONFIRM_REFRESH',"! JO9 MOD END DEALER_OLD_CONFIRM_REFRESH\r\n"+block(`! Rebuild pending private quotations only; paid result pages have no owned slave.
if slave_state = CONST_INT['slave_exist'] and (interaction_city = 911 or interaction_city = 912 or interaction_city = 913) and ($interaction_type = 'slave_sold' or $interaction_type = 'slave_sold_house'):
 if $curloc = 'interaction_city' or $curloc = 'interaction_screen_city' or $curloc = 'choice_screen':
  buyer_from_house = iif($interaction_type = 'slave_sold_house', 1, 0)
  gs 'refresh_database'
  killobj
  txt = 1
  gt 'interaction_city'
 end
end
if $interaction_type = 'sell_milk_cow' and cow_state = CONST_INT['slave_exist'] and instr($yes, 'sparks += cowprice') > 0:
 killobj
 gt 'interaction_result_city'
end`));
// Settlement entry guards prevent a repeated result call from adding money again.
for(const type of ['sell_slave_simple','sell_slave_complex','slave_sold','slave_sold_house']){
 const original=`if $interaction_type = '${type}':`;
 const count=type==='sell_slave_complex'?2:1;
 edit('interaction_result_city',original,original+'\r\n'+block("\tif slave_state ! CONST_INT['slave_exist']: gt 'interaction_screen_city'"),count);
}
for(const hero of ['<','>']){
 const old=`if interaction_city = 931 and hero_choice ${hero} 100:`;
 edit('interaction_city',old,old+'\r\n'+block("\tif slave_state ! CONST_INT['slave_exist'] and slave_state ! CONST_INT['slave_faint']: gt 'interaction_screen_city'"));
}
// Consignment is taxed once per newly agreed owner share before joining saved receivables.
edit('jo9_farid_consignment'," jo9_fc_amount = slaveprice / 2\n if jo9_fc_amount < 1: exit",block(" jo9_fc_amount = slaveprice / 2\n if jo9_fc_amount < 1: exit\n local $jo9_fc_receipt = $func('jo9_traits_value', 'sale_receipt', jo9_fc_amount)\n jo9_fc_amount = func('jo9_traits_value', 'sale_net', jo9_fc_amount)"));
edit('jo9_farid_consignment'," jo9_fc_ok = func('jo9_farid_consignment', 'clear', 'stock')\n result = 1", " jo9_fc_ok = func('jo9_farid_consignment', 'clear', 'stock')\n $result = $jo9_fc_receipt");
edit('interaction_city',"\tlocal jo9_farid_deposited = func('jo9_farid_consignment', 'deposit')\n\tif jo9_farid_deposited ! 1:",block("\tlocal $jo9_farid_sale_receipt = $func('jo9_farid_consignment', 'deposit')\n\tif $jo9_farid_sale_receipt = '' or $jo9_farid_sale_receipt = '0':"));
edit('interaction_city',"\t$text[2] = '집으로 오는 길, 당신은 그 노예를 떠올리고 마음속으로 계산했다. 노예시장에 팔아버리는 것보다 내가 키우는 것이 더 이윤이 남지 않을까? 그렇다면 지금 데리고 있는 노예를 어떻게 처리할지 결정해야 한다...'",block("\t$text[1] += $jo9_farid_sale_receipt + '<br>이 건의 판매세를 반영한 대금을 내일 받을 수 있다.'")+"\r\n\t$text[2] = '집으로 오는 길, 당신은 그 노예를 떠올리고 마음속으로 계산했다. 노예시장에 팔아버리는 것보다 내가 키우는 것이 더 이윤이 남지 않을까? 그렇다면 지금 데리고 있는 노예를 어떻게 처리할지 결정해야 한다...'");
// Cow sale uses the same ordinary-person sale economics, with its existing eligibility and price.
edit('interaction_result_city',"\t\t\tsparks += cowprice",block("\t\t\tif cow_state ! CONST_INT['slave_exist']: gt 'shop_general'\n"+receiptPage+"\n\t\t\t$text[1] = '매각이 성사되었다.' + $func('jo9_traits_value', 'sale_pay', cowprice)"));
edit('interaction_result_city',"\t\t\tmaster_moodlet['pos_deal'] = 5\n\t\t\tgt 'shop_general'",block("\t\t\tmaster_moodlet['pos_deal'] = 5\n\t\t\tkillvar '$interaction_type'\n\t\t\t$return_lock = 'shop_general'\n\t\t\ttxt = 1\n\t\t\tgt 'interaction_screen_city'"));
const candidate=core.serialize(doc);core.parse(candidate);
const patch={id:'NORMAL_SALE_CAP_REMOVAL_HARD_TAX_20261105',before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits};
fs.writeFileSync(path.join(__dirname,'sale-tax.patch.json'),JSON.stringify(patch,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'candidate.qsp'),candidate);
fs.writeFileSync(path.join(__dirname,'manifest.json'),JSON.stringify({source,before_sha256:core.hash(raw),after_sha256:core.hash(candidate),edits:edits.length,locations:[...new Set(edits.map(e=>e.location))]},null,2)+'\n');
console.log(JSON.stringify({edits:edits.length,hash:core.hash(candidate)}));
