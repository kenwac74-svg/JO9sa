'use strict';
const fs=require('node:fs'),a=require('node:assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',raw=fs.readFileSync(process.argv[2]||game+'/jack.qsp'),d=c.parse(raw),baseline='efdff96228e6cd77b59808c22b3391947e1682918480aea55c89b0a0bb3adebb';a.equal(d.hash,baseline);
const cr=s=>s.replace(/\r?\n/g,'\r\n'),get=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),edits=[];
function edit(location,old,now,patchId){old=cr(old);now=cr(now);const s=get(location);a.equal(s.split(old).length-1,1,patchId);d.lines[d.locations.find(l=>l.name===location).body]=c.shift(s.replace(old,()=>now),-5);edits.push({location,field:'body',old,new:now,count:1,patchId});}
edit('interaction_city',`\tgs '$slave_price', 'stock'
\tfarid_debt += farid_potential_debt &! accumulate debt when dropping off multiple slaves on the same day - ImperatorAugustus
\tfarid_potential_debt = slaveprice/2`, `\t! JO9 MOD START FARID_DEPOSIT_20261028
\tlocal jo9_farid_deposited = func('jo9_farid_consignment', 'deposit')
\tif jo9_farid_deposited ! 1:
\t $interaction_type = ''
\t $npc_id = 'фарид_аукционщик'
\t $place = 'slave_stage'
\t $text[1] = '[잡파]<br>지금은 위탁할 인물을 확인할 수 없군. 맡겨 둔 거래는 그대로 둘 테니 다시 살펴보게.'
\t gt 'interaction_screen_city'
\tend
\t! JO9 MOD END FARID_DEPOSIT_20261028`,'FARID_DEPOSIT_20261028');
edit('interaction_city',`\t$special_image[2] = '<<func("jo9_seed_role_images", "resolve", stock_type, $stock["fullimage"], "fullimage")>>.png'\r\n! JO9 MOD END EGEYA_STALE_ROLE_IMAGES_20261022\r\n\tif slave_state ! CONST_INT['no_slave']: $text[2] += ' 다만 이미 가진 노예를 어떻게 할지는 정해야 한다…'`, `\t! JO9 MOD START FARID_STORED_PICTURE_20261028
\t$special_image[2] = '<<func("jo9_seed_role_images", "resolve", jo9_farid_stored_type, $jo9_farid_stored["fullimage"], "fullimage")>>.png'
\t! JO9 MOD END FARID_STORED_PICTURE_20261028
! JO9 MOD END EGEYA_STALE_ROLE_IMAGES_20261022
\tif slave_state ! CONST_INT['no_slave']: $text[2] += ' 다만 이미 가진 노예를 어떻게 할지는 정해야 한다…'`,'FARID_STORED_PICTURE_20261028');
edit('interaction_city',`\tsparks -= 5
\tgs 'stock_to_slave'
\tfarid_potential_debt = 0 &! reset only after calling stock_to_slave to avoid triggering hard_return - ImperatorAugustus`, `\t! JO9 MOD START FARID_RETURN_20261028
\tlocal jo9_farid_returned = func('jo9_farid_consignment', 'return')
\tif jo9_farid_returned ! 1:
\t $npc_id = 'фарид_аукционщик'
\t $place = 'slave_stage'
\t if jo9_farid_returned = -2:
\t  $text[1] = '[잡파]<br>이미 데리고 다니는 노예가 있군. 자리를 마련한 뒤 다시 오게. 맡긴 거래는 그대로 두겠네.'
\t elseif jo9_farid_returned = -1:
\t  $text[1] = '[잡파]<br>지금은 되돌려 줄 위탁 인물이 없군. 같은 거래를 다시 취소할 수는 없네.'
\t else
\t  $text[1] = '[잡파]<br>위탁 인물의 기록을 확인할 수 없어 지금은 돌려줄 수 없군. 수수료는 받지 않겠네. 맡긴 거래의 대금은 예정대로 정산하겠어.'
\t end
\t gt 'interaction_screen_city'
\tend
\t! JO9 MOD END FARID_RETURN_20261028`,'FARID_RETURN_20261028');
edit('interaction_city',`\tsparks += farid_debt
\t$place = 'slave_stage'`, `\t! JO9 MOD START FARID_COLLECT_20261028
\tlocal jo9_farid_payment = func('jo9_farid_consignment', 'collect')
\t! JO9 MOD END FARID_COLLECT_20261028
\t$place = 'slave_stage'`,'FARID_COLLECT_20261028');
edit('interaction_city',`\t$text[1] = '<font color="#660000">[잡파]<br>&nbsp;어이, <<$master_name>>! 네가 맡긴 소녀 팔았어, 꽤 잘 팔린듯해. 경매 시작하자마자 팔렸다니까! 자, 여기 자네 몫: $<<farid_debt>>, 수수료는 50%야!</font>'`, `\t! JO9 MOD START FARID_COLLECT_TEXT_20261028
\tif jo9_farid_payment > 0:
\t $text[1] = '<font color="#660000">[잡파]<br>&nbsp;어이, <<$master_name>>! 네가 맡긴 노예를 팔았네. 자, 여기 자네 몫인 $<<jo9_farid_payment>>일세. 약속한 중개료는 이미 제했어.</font>'
\telse
\t $text[1] = '[잡파]<br>지금은 더 지급할 대금이 없군. 같은 거래를 두 번 정산할 수는 없네.'
\tend
\t! JO9 MOD END FARID_COLLECT_TEXT_20261028`,'FARID_COLLECT_TEXT_20261028');
edit('interaction_city',`\tfarid_debt = 0
\tdynamic $clear_slave_instance, 'stock'
end`, `\t! JO9 MOD START FARID_COLLECT_KEEP_STOCK_20261028
\t! Collection updates only consignment money and its stored actor.
\t! JO9 MOD END FARID_COLLECT_KEEP_STOCK_20261028
end`,'FARID_COLLECT_KEEP_STOCK_20261028');
edit('next_day',`farid_debt += farid_potential_debt
farid_potential_debt = 0`, `! JO9 MOD START FARID_DAILY_SETTLE_20261028
gs 'jo9_farid_consignment', 'settle'
! JO9 MOD END FARID_DAILY_SETTLE_20261028`,'FARID_DAILY_SETTLE_20261028');
edit('interaction_screen_city',`if ($interaction_type = 'drop_to_farid' and txt = 2) or interaction_city = 61120 or interaction_city = 61121:`, `! JO9 MOD START FARID_STORED_INFO_PANEL_20261028
if $interaction_type = 'drop_to_farid' and txt = 2:
 npc = 0
 gs 'jo9_farid_consignment', 'panel'
 jump 'second_point'
end
! JO9 MOD END FARID_STORED_INFO_PANEL_20261028
if interaction_city = 61120 or interaction_city = 61121:`,'FARID_STORED_INFO_PANEL_20261028');
const warning="if stock_state ! CONST_INT['slave_exist']: msg '오류: stock_to_slave_nogt 상태가 예상과 다릅니다. 이 메시지를 보기 직전에 무엇을 했는지 제보해 주세요'";
edit('stock_to_slave_nogt',`!move stock slave to master without changing location (to be called with 'gs')`, `!move stock slave to master without changing location (to be called with 'gs')
! JO9 MOD START STOCK_TO_SLAVE_EARLY_GUARD_20261028
result = 0
if stock_state ! CONST_INT['slave_exist']:
 msg '오류: stock_to_slave_nogt 상태가 예상과 다릅니다. 이 메시지를 보기 직전에 무엇을 했는지 제보해 주세요'
 exit
end
! JO9 MOD END STOCK_TO_SLAVE_EARLY_GUARD_20261028`,'STOCK_TO_SLAVE_EARLY_GUARD_20261028');
edit('stock_to_slave_nogt',warning,`! JO9 MOD START STOCK_TO_SLAVE_OLD_GUARD_REMOVED_20261028
! Invalid source is rejected before any acquisition resets.
! JO9 MOD END STOCK_TO_SLAVE_OLD_GUARD_REMOVED_20261028`,'STOCK_TO_SLAVE_OLD_GUARD_REMOVED_20261028');
edit('stock_to_slave_nogt','!End of Testing Code',`!End of Testing Code
! JO9 MOD START STOCK_TO_SLAVE_SUCCESS_20261028
result = 1
! JO9 MOD END STOCK_TO_SLAVE_SUCCESS_20261028`,'STOCK_TO_SLAVE_SUCCESS_20261028');
edit('stock_to_slave',"gs 'stock_to_slave_nogt'",`! JO9 MOD START STOCK_TO_SLAVE_CHECK_SUCCESS_20261028
if func('stock_to_slave_nogt') ! 1: exit
! JO9 MOD END STOCK_TO_SLAVE_CHECK_SUCCESS_20261028`,'STOCK_TO_SLAVE_CHECK_SUCCESS_20261028');
// Reuse current presentation text without evaluating or repairing the stored actor.
const stockTraits=get('$stock_traits');
const traitCode=stockTraits.slice(stockTraits.indexOf('!Stock Traits')).replaceAll('stock','jo9_farid_viewprobe');
const screen=get('interaction_screen_city');
let panelCode=screen.slice(screen.indexOf('$for_inter_screen_city = '),screen.indexOf('! JO9 MOD START EGEYA_STALE_ROLE_IMAGES_20261022',screen.indexOf('$for_inter_screen_city = ')));
a(panelCode.includes("gs '$slave_price', 'stock'"));
panelCode=panelCode.replaceAll('stock[','jo9_farid_viewprobe[').replaceAll('$stock_features_list','$jo9_farid_viewprobe_features_list').replaceAll('$for_inter_screen_city','$jo9_fc_panel');
panelCode=panelCode.replace("gs '$slave_price', 'stock'",()=>"is_stock = 1\r\n\tgs '$slave_price', 'jo9_farid_viewprobe'");
a(panelCode.includes('$stock_boobs2_txt'),'Keep shared grammar map');
const panel=`if $jo9_fc_mode = 'panel':
 $info_bar = '위탁 인물의 보관 기록을 확인할 수 없습니다.'
 if jo9_farid_stored_valid ! 1 or jo9_farid_stored_state ! CONST_INT['slave_exist']: exit
 jo9_fc_ok = func('jo9_farid_consignment', 'copy', 'jo9_farid_stored', 'jo9_farid_viewprobe')
 if jo9_fc_ok ! 1: exit
 ${traitCode}
 ${panelCode}
 ! Trait links must refer to the retained actor, not the disposable probe.
 $info_bar = replace($info_bar, 'jo9_farid_viewprobe', 'jo9_farid_stored')
 $special_image[3] = '<<func("jo9_seed_role_images", "resolve", jo9_farid_stored_type, $jo9_farid_stored["fullimage"], "fullimage")>>.png'
 jo9_fc_ok = func('jo9_farid_consignment', 'clear', 'jo9_farid_viewprobe')
 result = 1
 exit
end`;
const helper=cr(fs.readFileSync(__dirname+'/helper.qspsrc','utf8').replace('! __FARID_PANEL__',()=>panel));
fs.writeFileSync(__dirname+'/helper-built.qspsrc',helper);
a(!d.locations.some(l=>l.name==='jo9_farid_consignment'));
d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift('jo9_farid_consignment',-5),'',c.shift(helper,-5),c.shift('0',-5));
const candidate=c.serialize(d),checked=qa.inspectWorld(candidate);a.equal(checked.locations,275);
const patch={id:'2026-10-28_farid_consignment_storage',description:'잡파 위탁 전용 인물 보관·성공 확인 후 회수/수수료·중복 정산 방지·구저장 금전 정산 보존',before_sha256:baseline,after_sha256:c.hash(candidate),edits,add_locations:[{name:'jo9_farid_consignment',desc:'',body:helper,actions:[]}]};
fs.writeFileSync(__dirname+'/2026-10-28_farid_consignment_storage.json',JSON.stringify(patch,null,2)+'\n');
for(const name of ['interaction_city','next_day','stock_to_slave_nogt','stock_to_slave','interaction_screen_city']){const doc=c.parse(candidate),l=doc.locations.find(x=>x.name===name);const body=c.shift(doc.lines[l.body],5);if(name==='interaction_city')fs.writeFileSync(__dirname+'/candidate-farid-city.txt',body.slice(body.indexOf('if interaction_city = 119:'),body.indexOf('if interaction_city = 12:',body.indexOf('if interaction_city = 119:')+1)));else fs.writeFileSync(__dirname+'/candidate-'+name+'.txt',body);}
console.log(JSON.stringify({before:baseline,after:patch.after_sha256,edits:edits.length,newLocations:1,locations:checked.locations}));
