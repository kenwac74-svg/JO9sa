'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',tmp='G:/Codex/tmp/jo9-insolvency-simple-20261025';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const quest=require('./quest-implementation.cjs');
const raw=fs.readFileSync(tmp+'/before.qsp'),d=c.parse(raw),edits=[];
const cr=s=>s.replace(/\r?\n/g,'\r\n');
const get=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
function set(n,s){const old=get(n),text=cr(s);assert.notEqual(old,text);let start=0;while(start<old.length&&start<text.length&&old[start]===text[start])start++;let a=old.length,b=text.length;while(a>start&&b>start&&old[a-1]===text[b-1]){a--;b--;}edits.push({location:n,field:'body',...c.minimalEdit(old,text,start,a,b),count:1});d.lines[d.locations.find(l=>l.name===n).body]=c.shift(text,-5);}
const roles=['prisoner','farmhand','cow','harpy','pig','room1','room2','room3','room4',...Array.from({length:18},(_,i)=>'iced_'+(i+1))];
let sale=get('jo9_liquidation_sale');
sale=sale.replace("if $jo9_lqs_slot ! 'slave' and $jo9_lqs_slot ! 'assistant': exit",()=>`! JO9 MOD START INSOLVENCY_FACILITY_SALE_20261025
if instr(',${['slave','assistant',...roles].join(',')},',','+$jo9_lqs_slot+',') = 0: exit
! JO9 MOD END INSOLVENCY_FACILITY_SALE_20261025`);
sale=sale.replace("if $jo9_lqs_mode ! 'query' and $jo9_lqs_mode ! 'sell': exit",()=>quest.helper+"\r\nif $jo9_lqs_mode ! 'query' and $jo9_lqs_mode ! 'sell': exit");
sale=sale.replace('! Only the selected actor and worn equipment are transferred; NPC state is untouched.',()=>"gs 'jo9_liquidation_sale','fail_quests',$jo9_lqs_slot\r\n! Only quests bound to this actor fail; no NPC completion rewards are issued.");
set('jo9_liquidation_sale',sale);

let assets=get('jo9_liquidation_assets');
const relocation=`! JO9 MOD START INSOLVENCY_RELOCATION_20261025
! Facility rent yields no proceeds. Character valuation uses the existing half-price helper.
if $jo9_ls_action = 'quote_move' or $jo9_ls_action = 'move_slums':
 jo9_lq_value['relocation'] = 0
 jo9_lq_value['relocation_people'] = 0
 jo9_lq_value['relocation_rooms'] = 0
 jo9_lq_value['relocation_house'] = 0
 jo9_lq_available['relocation'] = 0
 jo9_lq_move_count = 0
 jo9_lq_move_returns = 0
 if snk_room_target > 0: exit
 local jo9_lqm_idx
 local $jo9_lqm_slot
 local jo9_lqm_state
 local jo9_lqm_brand
 local $jo9_lqm_contractor
 local $jo9_lqm_slots
 ${roles.map((n,i)=>"$jo9_lqm_slots["+i+"] = '"+n+"'").join('\n ')}
 for jo9_lqm_idx = 1 to 27:
  $jo9_lqm_slot = $jo9_lqm_slots[jo9_lqm_idx - 1]
  dynamic 'jo9_lqm_state = <<$jo9_lqm_slot>>_state & jo9_lqm_brand = <<$jo9_lqm_slot>>["brand"]'
  if jo9_lqm_state ! CONST_INT['no_slave']: jo9_lq_available['relocation'] = 1
  if jo9_lqm_state = CONST_INT['slave_exist'] or jo9_lqm_state = CONST_INT['slave_faint']:
   if jo9_lqm_brand = 4:
    jo9_lq_move_returns += 1
   else
    gs 'jo9_liquidation_sale','query',$jo9_lqm_slot
    jo9_lq_value['relocation_people'] += jo9_lq_sale_price[$jo9_lqm_slot]
    jo9_lq_move_count += 1
   end
  end
 end
 if kulaconstruct >= 1: jo9_lq_value['relocation_rooms'] += 1000
 if kulaconstruct >= 2: jo9_lq_value['relocation_rooms'] += 400
 if kulaconstruct >= 3: jo9_lq_value['relocation_rooms'] += 1000
 if kulaconstruct >= 4: jo9_lq_value['relocation_rooms'] += 2000
 if owner = 1 and $estate ! '' and $estate ! 'slum_house': jo9_lq_value['relocation_house'] = max(0,75 * estate_cost_main[$estate] / 2)
 jo9_lq_value['relocation'] = jo9_lq_value['relocation_people'] + jo9_lq_value['relocation_rooms'] + jo9_lq_value['relocation_house']
 if ($estate ! '' and $estate ! 'slum_house') or kulaconstruct > 0 or lab > 0 or boudoir > 0 or dungeon > 0 or barn > 0 or pen > 0 or stasis_tank > 0 or pet_tentacle > 0: jo9_lq_available['relocation'] = 1
 if $jo9_ls_action = 'quote_move': exit
 jo9_lq_sold = 0
 jo9_lq_paid = 0
 if jo9_lq['active'] ! 1 or jo9_lq_available['relocation'] ! 1: exit
 local jo9_lqm_start_money = sparks
 local jo9_lqm_fixed = jo9_lq_value['relocation_rooms'] + jo9_lq_value['relocation_house']
 for jo9_lqm_idx = 1 to 27:
  $jo9_lqm_slot = $jo9_lqm_slots[jo9_lqm_idx - 1]
  dynamic 'jo9_lqm_state = <<$jo9_lqm_slot>>_state & jo9_lqm_brand = <<$jo9_lqm_slot>>["brand"] & $jo9_lqm_contractor = $<<$jo9_lqm_slot>>["contractor"]'
  if jo9_lqm_state ! CONST_INT['no_slave']:
   if (jo9_lqm_state = CONST_INT['slave_exist'] or jo9_lqm_state = CONST_INT['slave_faint']) and jo9_lqm_brand ! 4:
    gs 'jo9_liquidation_sale','query',$jo9_lqm_slot
    if jo9_lq_sale_price[$jo9_lqm_slot] > 0:
     gs 'jo9_liquidation_sale','sell',$jo9_lqm_slot,jo9_lq_sale_price[$jo9_lqm_slot],jo9_lq_sale_type[$jo9_lqm_slot],'quick_sale',$jo9_lq_sale_actor[$jo9_lqm_slot]
     if jo9_lq_sale_sold ! 1:
      jo9_lq_paid = sparks - jo9_lqm_start_money
      exit
     end
    else
     gs 'jo9_liquidation_sale','fail_quests',$jo9_lqm_slot
     dynamic $replace($sold_clothing,'$slave[','$'+$jo9_lqm_slot+'[')
     dynamic $clear_slave_instance,$jo9_lqm_slot
    end
   else
    gs 'jo9_liquidation_sale','fail_quests',$jo9_lqm_slot
    ! Approved failed return: no sale, no completion reward, no new financial penalty.
    if jo9_lqm_brand = 4:
     if $jo9_lqm_contractor ! '':
      if contract['active'] ! 1:
       contract['time'] = 0
       contract['salary'] = 0
      end
     elseif contract['active'] = 1:
      ! brand=4 also marks exam/demo actors. A retained trainee keeps its contract.
      if ((slave_state = CONST_INT['slave_exist'] or slave_state = CONST_INT['slave_faint']) and slave['brand'] = 4 and $slave['contractor'] = '') or ((assistant_state = CONST_INT['slave_exist'] or assistant_state = CONST_INT['slave_faint']) and assistant['brand'] = 4 and $assistant['contractor'] = ''):
       ! The retained actor is not part of this facility return.
      else
       active[$quest[10]] = 0
       killvar 'contract'
      end
     end
    end
    dynamic $replace($sold_clothing,'$slave[','$'+$jo9_lqm_slot+'[')
    dynamic $clear_slave_instance,$jo9_lqm_slot
   end
  end
 end
 ! Clear occupied roles before new_estate can restore rental access.
 kulaconstruct = 0
 cell_state = 0
 pet_tentacle = 0
 tentacle_size = 0
 tentacle_hp = 0
 owner = 0
 if slums_shakedown ! 0 and day > slums_shakedown + 100: slums_shakedown = day - 100
 $estate = 'slum_house'
 $interior = 'slum_house'
 gs 'new_estate'
 sparks += jo9_lqm_fixed
 jo9_lq_paid = sparks - jo9_lqm_start_money
 jo9_lq_sold = 1
 exit
end
! JO9 MOD END INSOLVENCY_RELOCATION_20261025
`;
// No original public house-sale action becomes an implicit bulk sale.
assets=assets.replace("if $jo9_ls_action = 'sell':",()=>cr(relocation)+"\r\nif $jo9_ls_action = 'sell':");
assert.equal(assets.split('! JO9 MOD END INSOLVENCY_ASSETS_20261023').length-1,1,'Literal replacement must not expand QSP dollar sequences');
// Old saved single-room callbacks must not retain the obsolete 50% rate.
for(const [n,v]of[[1,1000],[2,400],[3,1000],[4,2000]])assets=assets.replace(new RegExp("jo9_lq_value\\['room"+n+"'\\] = \\d+"),"jo9_lq_value['room"+n+"'] = "+v);
set('jo9_liquidation_assets',assets);

let flow=get('jo9_liquidation');
const preserved=flow.slice(0,flow.indexOf('! JO9 MOD START INSOLVENCY_MANUAL_ORDER_20261024'));
const rewritten=`! JO9 MOD START INSOLVENCY_FOUR_STEPS_20261025
! The first remaining asset determines the page, including older 15-page saves.
gs 'jo9_liquidation_assets','quote'
gs 'jo9_liquidation_assets','quote_move'
gs 'jo9_liquidation_sale','query','slave'
gs 'jo9_liquidation_sale','query','assistant'
jo9_lq['page'] = 4
if jo9_lq_value['decor'] > 0:
 jo9_lq['page'] = 0
elseif jo9_lq_available['relocation'] = 1:
 jo9_lq['page'] = 1
elseif jo9_lq_sale_price['slave'] > 0:
 jo9_lq['page'] = 2
elseif jo9_lq_sale_price['assistant'] > 0:
 jo9_lq['page'] = 3
end
if sparks >= jo9_lq['bill']:
 if $jo9_lq_action ! 'view': gt 'jo9_liquidation','finish'
elseif jo9_lq['page'] = 4:
 dynamic $death,'가구도 집도, 함께했던 이들까지 모두 떠나보냈다. 그러나 남은 빚을 갚기에는 끝내 모자랐다.<br><br>채권자들은 마지막으로 당신의 몸값을 계산했다. 한때 노예를 사고팔던 당신은 이제 경매장 위에 서서, 자신에게 매겨지는 값을 듣는다.<br><br>빚을 갚지 못한 노예상의 마지막 상품은 자기 자신이었다.'
 exit
end
if $jo9_lq_action = 'manual':
 jo9_lq['manual'] = 1
 is_home = 1
 city_form = estate_location[$estate]
 city_district = -1
 menu_form = 0
 gt 'menu_form'
end
if $jo9_lq_action = 'dispose':
 jo9_lq_sold = 0
 if jo9_lq['page'] = 0 and $args[1] = 'decor': gs 'jo9_liquidation_assets','sell','decor'
 if jo9_lq['page'] = 1 and $args[1] = 'relocation': gs 'jo9_liquidation_assets','move_slums'
 if jo9_lq_sold = 1:
  $jo9_lq_notice = '정리를 마쳤다. <<jo9_lq_paid>>스파크를 마련했다.'
 else
  $jo9_lq_notice = '자산 상태가 달라졌다. 현재 남아 있는 자산부터 다시 확인하자.'
 end
 if sparks >= jo9_lq['bill']: gt 'jo9_liquidation','finish'
 gt 'jo9_liquidation','view'
end
if $jo9_lq_action = 'sell_person':
 jo9_lq_sale_sold = 0
 if (jo9_lq['page'] = 2 and $args[1] = 'slave') or (jo9_lq['page'] = 3 and $args[1] = 'assistant'):
  gs 'jo9_liquidation_sale','sell',$args[1],args[2],args[3],$args[4],$args[5]
 end
 if jo9_lq_sale_sold = 1:
  $jo9_lq_notice = '거래를 마쳤다. 이제 남은 비용을 확인하자.'
 else
  $jo9_lq_notice = '거래 조건이 달라졌다. 현재 남아 있는 자산부터 다시 확인하자.'
 end
 if sparks >= jo9_lq['bill']: gt 'jo9_liquidation','finish'
 gt 'jo9_liquidation','view'
end
jo9_lq['manual'] = 0
local $jo9_lq_key
local $jo9_lq_title
local $jo9_lq_prose
local $jo9_lq_choice
local jo9_lq_missing = max(0,jo9_lq['bill'] - sparks)
if jo9_lq['page'] = 0:
 $jo9_lq_key = 'decor'
 $jo9_lq_title = '실내장식 정리'
 $jo9_lq_prose = '이번 비용을 낼 돈이 모자란다. 우선 집 안의 장식을 팔아 당장의 고비를 넘겨 보자. 정가의 절반을 받을 수 있고, 각 방은 가장 검소한 모습으로 돌아간다.'
 $jo9_lq_choice = '실내장식을 정리한다'
elseif jo9_lq['page'] = 1:
 $jo9_lq_key = 'relocation'
 $jo9_lq_title = '빈민가 이주'
 $jo9_lq_prose = '집과 시설을 정리하고 빈민가로 돌아가자. 시설과 냉동 보관소의 노예는 기본가의 절반에 급매한다. 증축 개인실은 공사비의 20%를 회수한다. 활동 중인 노예와 조수는 데리고 간다.'
 $jo9_lq_choice = '빈민가로 이주하고 시설을 정리한다'
 if $estate = 'slum_house':
  $jo9_lq_title = '남은 보관시설 정리'
  $jo9_lq_prose = '아직 남은 시설과 냉동 보관 계약을 끝내고, 그곳의 노예들을 기본가의 절반에 급매하자. 활동 중인 노예와 조수는 남겨 둔다.'
  $jo9_lq_choice = '남은 시설과 보관 노예를 정리한다'
 end
elseif jo9_lq['page'] = 2 or jo9_lq['page'] = 3:
 if jo9_lq['page'] = 2:
  $jo9_lq_key = 'slave'
  $jo9_lq_title = '노예 급매'
 else
  $jo9_lq_key = 'assistant'
  $jo9_lq_title = '조수 급매'
 end
 $jo9_lq_prose = '남은 비용을 해결하려면 <<$jo9_lq_sale_actor[$jo9_lq_key]>>를 떠나보내야 할지도 모르겠다. 납품 의뢰를 노리는 경쟁 노예상에게 급히 넘기면 산정 기본가의 절반을 받을 수 있다.'
 $jo9_lq_choice = '<<$jo9_lq_sale_actor[$jo9_lq_key]>>를 급매한다 (<<jo9_lq_sale_price[$jo9_lq_key]>>스파크)'
end
*clr & cla & killobj
killvar '$menu_links'
gs '_layout'
*p '<div id="bg"><img style="width:795px;height:595px;" src="content/pic/bg/jo9_bankruptcy_seizure.png"><div style="position:absolute;top:24px;left:0;width:795px;text-align:center;"><span style="font-size:42px;font-weight:bold;color:#ffe0bb;background-color:#511b16;padding:8px 24px;">파산 위기</span></div></div>'
*p '<div id="side_panel_main"><center><div style="font-size:32px;">당장의 고비</div><<$jo9_lq_title>><br>정리 순서 <<min(4,jo9_lq["page"] + 1)>> / 4</center></div>'
*p '<div id="side_panel_text" style="color:#20160e;font-size:20px;line-height:1.3;overflow:auto;"><b>밀린 비용</b> <<jo9_lq["bill"]>>스파크<br><b>가진 돈</b> <<sparks>>스파크<br><b>부족한 돈</b> <<jo9_lq_missing>>스파크<br><br>'
if $jo9_lq_notice ! '': *p '<<$jo9_lq_notice>><br><br>'
if jo9_lq['page'] <= 1:
 *p '정리하면 <b><<jo9_lq_value[$jo9_lq_key]>>스파크</b>를 마련할 수 있다.<br>'
 if jo9_lq['page'] = 1:
  *p '시설 입주 노예: <<jo9_lq_value["relocation_people"]>>스파크<br>증축 개인실: <<jo9_lq_value["relocation_rooms"]>>스파크<br>자가 주택: <<jo9_lq_value["relocation_house"]>>스파크<br>임대시설 해지 대금: 0스파크<br>'
  if jo9_lq_move_returns > 0: *p '<br>교육 의뢰 인물 <<jo9_lq_move_returns>>명은 보상 없이 실패 반환한다.<br>'
 end
elseif jo9_lq['page'] <= 3:
 *p '급매 대금은 <b><<jo9_lq_sale_price[$jo9_lq_key]>>스파크</b>다.<br>'
end
*p '<br>장식 → 빈민가 이주 → 노예 → 조수 순서로 정리한다. 비용을 해결하기 전에는 다음 날로 넘어갈 수 없다.</div>'
*p '<div id="text" style="color:#20160e;font-size:18px;line-height:1.2;overflow:auto;"><<$jo9_lq_prose>><br>'
if sparks >= jo9_lq['bill']:
 *p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''finish''">청구액을 지불하고 돌아간다</a><br>'
elseif jo9_lq['page'] <= 1:
 *p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''dispose'',''<<$jo9_lq_key>>''"><<$jo9_lq_choice>></a><br>'
elseif jo9_lq['page'] <= 3:
 *p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''sell_person'',''<<$jo9_lq_key>>'',<<jo9_lq_sale_price[$jo9_lq_key]>>,<<jo9_lq_sale_type[$jo9_lq_key]>>,''quick_sale'',$jo9_lq_sale_actor[''<<$jo9_lq_key>>'']"><<$jo9_lq_choice>></a><br>'
end
*p '▶ <a style="color:#6a2904;font-weight:bold;" href="EXEC:gt ''jo9_liquidation'',''manual''">직접 방법을 찾는다</a><br>'
*p '</div>'
! JO9 MOD END INSOLVENCY_FOUR_STEPS_20261025
! JO9 MOD END INSOLVENCY_FLOW_20261023
`;
set('jo9_liquidation',preserved+rewritten);

// A realtor's old confirmation is not consent to the new bulk quicksale.
let city=get('interaction_city');
const old="gs 'jo9_liquidation_assets', 'sell', 'house'";
if(city.includes(old))city=city.replace(old,"gt 'jo9_liquidation', 'view'");
else throw Error('Expected current pending realtor callback missing');
const guardStart=city.indexOf('! JO9 MOD START INSOLVENCY_OCCUPIED_GUARD_20261023');
const guardEnd=city.indexOf('! JO9 MOD END INSOLVENCY_OCCUPIED_GUARD_20261023',guardStart);
assert(guardStart>=0&&guardEnd>guardStart);
const guard=city.slice(guardStart,guardEnd);
assert(guard.includes("jo9_lq_available['house']"));
city=city.slice(0,guardStart)+"! JO9 MOD START INSOLVENCY_REALTOR_REDIRECT_20261025\r\n\t\tif jo9_lq['active'] = 1: gt 'jo9_liquidation', 'view'\r\n\t\t! JO9 MOD END INSOLVENCY_REALTOR_REDIRECT_20261025"+city.slice(guardEnd+'! JO9 MOD END INSOLVENCY_OCCUPIED_GUARD_20261023'.length);
set('interaction_city',city);
// Apply independent actor-quest edits against current bodies, retaining the relocation edits.
for(const e of quest.edits){const body=get(e.location);assert.equal(body.split(cr(e.old)).length-1,e.count,e.location+' quest patch anchor');set(e.location,body.replace(cr(e.old),()=>cr(e.new)));}
const init=get('init_game');assert(init.includes("killvar 'jo9_lq'"));set('init_game',init.replace("killvar 'jo9_lq'",()=>"killvar 'jo9_lq'\r\n! JO9 MOD START INSOLVENCY_QUEST_INIT_20261025\r\nkillvar 'jo9_lq_failed_quest'\r\n! JO9 MOD END INSOLVENCY_QUEST_INIT_20261025"));
const uiPath=__dirname+'/../ui/ui-edits.json';
if(fs.existsSync(uiPath))for(const e of JSON.parse(fs.readFileSync(uiPath)).edits){assert.equal(e.field,'body');const body=get(e.location);assert.equal(body.split(cr(e.old)).length-1,e.count,e.location+' UI patch anchor');set(e.location,body.replace(cr(e.old),()=>cr(e.new)));}
const candidate=c.serialize(d),world=qa.inspectWorld(candidate);fs.writeFileSync(tmp+'/candidate.qsp',candidate);
fs.mkdirSync(tmp+'/mods',{recursive:true});fs.writeFileSync(tmp+'/mods/2026-10-25_insolvency_four_steps.json',JSON.stringify({id:'2026-10-25_insolvency_four_steps',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits},null,2)+'\n');
fs.writeFileSync(tmp+'/build.json',JSON.stringify({before:c.hash(raw),after:c.hash(candidate),changed:edits.map(e=>e.location),world},null,2));
console.log(JSON.stringify({before:c.hash(raw),after:c.hash(candidate),changed:edits.map(e=>e.location),locations:d.locations.length}));
