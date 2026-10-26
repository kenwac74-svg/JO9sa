'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),z=require('node:zlib'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-dealer-economy-20261024',rec=repo+'/records/dealer-economy-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const baseline='c362bde0e8cf814e3e28efd594e27482ef33ea0fa3a5b142f95c96164c5ea3eb',id='2026-10-24_dealer_economy';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);
function protect(){return [game+'/jack.qsp',game+'/css/base.css',game+'/FastQSP.ini',game+'/../FastQSP.ini','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)].map(path=>({path,sha256:c.hash(fs.readFileSync(path))}));}
function run(d,name,code){const dir=root+'/'+name;fs.mkdirSync(dir,{recursive:true});set(d,'Start',code);const raw=c.serialize(d);qa.inspectWorld(raw);fs.writeFileSync(dir+'/'+name+'.qsp',raw);write(dir+'/plan.json',[{name,file:dir+'/'+name+'.qsp',marker:'JO9_QA_DEALER_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:'Production dealer valuation and transaction code in installed FastQSP'}]);const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:60000});const results=read(dir+'/client-results.json'),log=new TextDecoder('euc-kr').decode(fs.readFileSync(dir+'/'+name+'-stderr.log'));fs.copyFileSync(dir+'/'+name+'-stderr.log',rec+'/evidence/'+name+'.log');return {exit:r.status,results,failure:(log.match(/FAIL_DEALER_[^"\r\n]+/)||[])[0],log:rec+'/evidence/'+name+'.log'};}
const init="usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\n";
function fixture(o={}){const p={game:0,obed:0,state:1,brand:2,style:0,exotic:0,fame:0,versatile:0,broken:0,custom:10,moral:2,skills:2,beauty:3,stamina:3,...o};let s="killvar 'slave'\nkillvar 'slave_rate'\nkillvar 'is_stock'\nkillvar 'jo9_dealer_farid_id'\nkillvar '$jo9_dealer_farid_name'\nkillvar 'jo9_dealer_farid_type'\nkillvar 'jo9_dealer_farid_quote'\nkillvar '$jo9_dealer_wong_name'\nkillvar 'jo9_dealer_wong_type'\nkillvar 'jo9_dealer_wong_quote'\n"+`game_difficulty=${p.game}\ndifficulty_setting=${p.obed}\nslave_state=${p.state}\nslave_type=2571\nslave['id']=910001\nslave['age']=2\nslave['brand']=${p.brand}\nslave['stamina']=${p.stamina}\nslave['base_beauty']=${p.beauty}\nslave['fat']=2\nslave['sensitivity']=3\nslave['temper']=3\nslave['intellect']=3\nslave['ego']=3\nslave['pride']=2\nslave['virginity']=2\nslave['style']=${p.style}\nslave['exotic']=${p.exotic}\nslave['fame']=${p.fame}\nslave['jo9_versatile']=${p.versatile}\nslave['custom']=${p.custom}\nslave['moral']=${p.moral}\nslave['instinct']=2\nslave['rational']=2\nslave_rate['beauty']=cont_atr_threshold[${p.beauty}]\n$slave_name='QA Trade'\n$slave_psy_status='${p.broken?'broken':''}'\nbrand_reputation=5\nfarid_debt=0\nfarid_potential_debt=0\nsnk_room_target=0\nsparks=100\n$place='guild_hall'\n`;
for(const k of ['expression','pet','dressage','cowSK','nurse','service','cook','gladiatrix','alchemy','enchanter','art','music','calisthenics','secretary'])s+=`slave['${k}']=${p.skills}\n`;return s;}
const phase=process.argv[2];
if(phase==='prepare'){
 a(!fs.existsSync(root));a(!fs.existsSync(rec));fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.mkdirSync(rec+'/scripts',{recursive:true});fs.mkdirSync(rec+'/evidence');const raw=fs.readFileSync(game+'/jack.qsp');a.equal(c.hash(raw),baseline);qa.inspectWorld(raw);a.deepEqual(c.serialize(c.parse(raw)),raw);fs.writeFileSync(root+'/inputs/before.qsp',raw);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(raw,{level:9}));a.deepEqual(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')),raw);write(rec+'/inputs.json',protect());
 write(rec+'/approved-scope.json',{date:'2026-10-24',status:'USER_APPROVED',fairValue:'max(native pre-rank attribute valuation, native common grade price); preserve versatile once in either component',untrained:'native current obedience < 1; recognize 20 percent once before payout',settingVariable:'difficulty_setting from in-game settings, NOT game_difficulty from character creation',economicDifficulty:{1:'easy 90 percent',0:'normal 75 percent',2:'hard original route formulas and eligibility'},scope:['existing Jabba and Wong resale','current-state native appraisal without acquisition histories','quote/confirmation consistency and stale callback guard'],excluded:['new merchant buyback services','private buyers','public guild auctions','contracts','emergency liquidation','new attribute or trait weights','Full/ZIP/commit/push'],integerOrder:'existing integer arithmetic: recognized value then dealer percent',rulings:['Hard means exact original formula rather than guessed new percentage, per user similar to original','Existing versatile applies once to each native candidate component before max','Broken-state merchant depreciation remains independent native behavior','Existing Jabba ownership/reputation entry conditions retained; new ownership market services are outside this pricing step']});
 fs.writeFileSync(rec+'/PLAN_KO.md',cr('# 일반 매입 경제 조정 실행 계획\n\n승인: 쉬움90%, 보통75%, 어려움은기존산식. 현재능력치의 기존평가와등급표를재사용.\n\n1. 격리본 baseline에서 실제 매입 제시가의 실패를 확인.\n2. 기존 가치 helper에 매입견적 분기만 추가. 잡파·웡 제시/지급·이전확인세이브 연결.\n3. 값의 우세/동률·복종경계·난도·다재다능·특별우대·재고오염·중복지급·대상교체·구세이브를 실제엔진 검사.\n4. 공식9경로·구조/줄/주석·정확패치재생/재적용·독립검토 후 WORK만적용.\n5. 76세이브 등 입력 보존·설명서·패치묶음 기록, 재생성가능임시본정리.\n\n격리: 사용자지정 G:/Codex/tmp 작업사본을 사용. 사용자요청대로 Git커밋/푸시없음. 핵심평가캐시/구매/개인판매/급매공용값 변경없음.\n'));fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({prepared:true,baseline,protected:protect().length}));
}else if(phase==='red'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp'));const code=init+fixture({obed:1})+"txt=4\ngs 'slave_auction_sell'\nqa_expected=max(30,slave_base_price*3/2,common_price[rating])*90/100\nif sell_price ! qa_expected: msg 'FAIL_DEALER_old_offer_<<sell_price>>_expected_<<qa_expected>>' & exit\nmsg 'JO9_QA_DEALER_red_COMPLETE'";const r=run(d,'red',code);write(rec+'/red-results.json',{status:'EXPECTED_FAILURE',...r});a(r.failure?.includes('old_offer_'));console.log(JSON.stringify(r));
}else if(phase==='build'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp')),edits=[];
 function edit(location,old,newText,patchId){old=cr(old);newText=cr(newText);const s=body(d,location);a.equal(s.split(old).length-1,1,patchId);set(d,location,s.split(old).join(newText));edits.push({location,field:'body',old,new:newText,count:1,patchId});}
 const handler=`! JO9 MOD START DEALER_QUOTE | ${id}
! In-game difficulty_setting: 1 easy, 0 normal, 2 original hard; creation difficulty does not select the payout.
if $args[0] = 'dealer_quote':
 local $jo9_dealer_vendor = $args[1]
 result = 0
 killvar 'is_stock'
 if $jo9_dealer_vendor ! 'farid' and $jo9_dealer_vendor ! 'wong': exit
 if slave_state ! CONST_INT['slave_exist'] and slave_state ! CONST_INT['slave_faint']: exit
 if snk_room_target > 0: exit
 if difficulty_setting = 2 and $jo9_dealer_vendor = 'farid' and slave['brand'] = 0: is_stock = 1
 gs '$slave_price'
 if difficulty_setting = 0 or difficulty_setting = 1:
  ! Native attribute price already includes versatile; apply it once to the independent grade candidate too.
  local jo9_dealer_grade_price = func('jo9_traits_value', 'base_price', 'slave', common_price[rating])
  local jo9_dealer_value = max(30, slave_base_price * 3 / 2, jo9_dealer_grade_price)
  if slave['obedience'] < 1: jo9_dealer_value = jo9_dealer_value * 20 / 100
  ! Keep the original Wong broken-state depreciation, separate from current obedience.
  if $jo9_dealer_vendor = 'wong' and $slave_psy_status = 'broken': jo9_dealer_value -= 4 * jo9_dealer_value / 5
  result = jo9_dealer_value * iif(difficulty_setting = 1, 90, 75) / 100
 else
  if $jo9_dealer_vendor = 'farid': result = max(10, slaveprice / 2)
  if $jo9_dealer_vendor = 'wong':
   local jo9_dealer_value = auction_price[rating]
   if $slave_psy_status = 'broken': jo9_dealer_value -= 4 * auction_price[rating] / 5
   result = func('jo9_traits_value', 'base_price', 'slave', jo9_dealer_value)
  end
 end
 exit
end
! JO9 MOD END DEALER_QUOTE

! JO9 MOD START DEALER_WONG_FINISH | ${id}
if $args[0] = 'dealer_wong_finish':
 local jo9_dealer_expected_id = args[1]
 if slave_state ! CONST_INT['slave_exist'] and slave_state ! CONST_INT['slave_faint']: gt 'guild'
 if slave['id'] ! jo9_dealer_expected_id or slave['brand'] < 1 or snk_room_target > 0: gt 'guild'
 if $jo9_dealer_wong_name ! '' and $jo9_dealer_wong_name ! $slave_name: gt 'guild'
 if jo9_dealer_wong_type ! 0 and jo9_dealer_wong_type ! slave_type: gt 'guild'
 local jo9_dealer_payment = func('jo9_traits_value', 'dealer_quote', 'wong')
 if jo9_dealer_wong_quote > 0 and jo9_dealer_payment ! jo9_dealer_wong_quote: gt 'guild'
 if difficulty_setting = 2 and rating < 1: gt 'guild'
 if jo9_dealer_payment < 1: gt 'guild'
 if guild_reputation <= rating / 2: guild_reputation_rate += func('jo9_traits_value', 'reward', 'slave', 5 + rating)
 if sound_on = 1: play $large_money_sound, sound_volume
 if slave['ill'] > 0: gave_guild_ill_slave = 1
 if slave['parasite'] > 0: gave_guild_parasite_slave = 1
 dynamic $clear_slave_instance, 'slave'
 sparks += jo9_dealer_payment
 killvar '$jo9_dealer_wong_name'
 killvar 'jo9_dealer_wong_type'
 killvar 'jo9_dealer_wong_quote'
 master_moodlet['pos_deal'] = 3
 gt 'guild'
end
! JO9 MOD END DEALER_WONG_FINISH

`;
 edit('jo9_traits_value',body(d,'jo9_traits_value').split('\r\n')[0],handler+body(d,'jo9_traits_value').split('\r\n')[0],'DEALER_HELPERS');
 edit('slave_auction_sell',"if slave['brand'] = 0: is_stock = 1 &! stock ratings are based purely on attribute_sum and the greater of beauty or fame, ignoring skills, obedience and stamina\ngs '$slave_price'\n\nsell_price = slaveprice/2",`! JO9 MOD START DEALER_FARID_OFFER | ${id}
if slave_state ! CONST_INT['slave_exist'] and slave_state ! CONST_INT['slave_faint']: gt 'city_menu_form'
sell_price = func('jo9_traits_value', 'dealer_quote', 'farid')
jo9_dealer_farid_id = slave['id']
$jo9_dealer_farid_name = $slave_name
jo9_dealer_farid_type = slave_type
jo9_dealer_farid_quote = sell_price
! JO9 MOD END DEALER_FARID_OFFER`,'DEALER_FARID_OFFER');
 edit('slave_auction_sell','if sell_price < 10: sell_price = 10',`! JO9 MOD START DEALER_FARID_FLOOR | ${id}
if difficulty_setting = 2 and sell_price < 10: sell_price = 10
! JO9 MOD END DEALER_FARID_FLOOR`,'DEALER_FARID_FLOOR');
 edit('slave_auction_sell','end\n\nif nsfw = 1:',`end
! JO9 MOD START DEALER_FARID_TEXT | ${id}
if difficulty_setting = 0 or difficulty_setting = 1:
 if slave['brand'] = 0: $text[3] = '[잡파]<br>낙인은 없군. 몸 상태와 배운 솜씨를 함께 살펴보겠소. 아직 말을 듣지 않는다면 그만큼 값은 낮아질 거요.'
 $text[4] = '[잡파]<br>몸 상태와 배운 솜씨를 따져 보니, 내가 줄 수 있는 금액은 <<sell_price>> 스파크요. 직접 구매자를 찾아다닐 수고는 덜 수 있을 거요.'
end
! JO9 MOD END DEALER_FARID_TEXT

if nsfw = 1:`,'DEALER_FARID_TEXT');
 edit('slave_auction_sell_end','! JO9 MOD START TBV_FARID_REWARD',`! JO9 MOD START DEALER_FARID_FINISH | ${id}
if slave_state ! CONST_INT['slave_exist'] and slave_state ! CONST_INT['slave_faint']: gt 'city_menu_form'
if snk_room_target > 0: gt 'city_menu_form'
if slave['brand'] > 0 and brand_reputation <= 3: gt 'city_menu_form'
if farid_debt > 0 or farid_potential_debt > 0: gt 'city_menu_form'
if jo9_dealer_farid_id ! 0 and jo9_dealer_farid_id ! slave['id']: gt 'city_menu_form'
if $jo9_dealer_farid_name ! '' and $jo9_dealer_farid_name ! $slave_name: gt 'city_menu_form'
if jo9_dealer_farid_type ! 0 and jo9_dealer_farid_type ! slave_type: gt 'city_menu_form'
sell_price = func('jo9_traits_value', 'dealer_quote', 'farid')
if jo9_dealer_farid_quote > 0 and sell_price ! jo9_dealer_farid_quote: gt 'city_menu_form'
if txt >= 6 and txt <= 7: sell_price = func('jo9_traits_value', 'market', 'slave', sell_price)
if sell_price < 1: gt 'city_menu_form'
! JO9 MOD END DEALER_FARID_FINISH
! JO9 MOD START TBV_FARID_REWARD`,'DEALER_FARID_FINISH');
 edit('slave_auction_sell_end','sparks += sell_price',`! JO9 MOD START DEALER_FARID_PAID | ${id}
sparks += sell_price
killvar 'jo9_dealer_farid_id'
killvar '$jo9_dealer_farid_name'
killvar 'jo9_dealer_farid_type'
killvar 'jo9_dealer_farid_quote'
killvar 'sell_price'
! JO9 MOD END DEALER_FARID_PAID`,'DEALER_FARID_PAID');
 const begin=body(d,'interaction_city').indexOf('if interaction_city = menu_subpurchaser:'),end=body(d,'interaction_city').indexOf('if interaction_city = 95:',begin),old=body(d,'interaction_city').slice(begin,end);
 const block=`! JO9 MOD START DEALER_WONG_OFFER | ${id}
if interaction_city = menu_subpurchaser:
 local jo9_dealer_offer = func('jo9_traits_value', 'dealer_quote', 'wong')
 $place = 'guild_hall'
 $return_lock = 'guild'
 npc = 1
 $npc_id = 'master_vong'
 $text[1] = '[마스터 봉]<br>길드 계약의 조건에 맞지 않는 노예도 몸 상태와 배운 솜씨에 따라 매입하지. 다만 특정 구매자의 취향에 맞춰 직접 거래하는 것보다는 값이 낮다.'
 $text[2] = $speculator_text[rating]
 if difficulty_setting = 2 and rating > 0: $text[2] = $replace($text[2], $str(auction_price[rating]), $str(jo9_dealer_offer))
 if difficulty_setting = 0 or difficulty_setting = 1: $text[2] = '[마스터 봉]<br>현재 몸 상태와 교육 정도를 기준으로 <<jo9_dealer_offer>> 스파크에 매입하겠네. 이 조건으로 넘기겠나?'
 if (rating > 0 or difficulty_setting = 0 or difficulty_setting = 1) and jo9_dealer_offer > 0 and slave['brand'] > 0:
  $jo9_dealer_wong_name = $slave_name
  jo9_dealer_wong_type = slave_type
  jo9_dealer_wong_quote = jo9_dealer_offer
  $special_action[2] = { gt 'choice_screen' }
  $yes = 'gs ''jo9_traits_value'', ''dealer_wong_finish'', ' + str(slave['id'])
  $no = { gt 'guild' }
 end
end
! JO9 MOD END DEALER_WONG_OFFER

`;
 edit('interaction_city',old,block,'DEALER_WONG_OFFER');
 edit('$ongload',body(d,'$ongload').split('\r\n')[0],`! JO9 MOD START DEALER_OLD_CONFIRM_LOAD | ${id}
! Re-issue only an obsolete Wong confirmation after native cache refresh and load restoration.
if $npc_id = 'master_vong' and instr($yes, 'TBV_SUBPURCHASER_BASE') > 0:
 jo9_dealer_old_confirm = 1
end
if $curloc = 'slave_auction_sell': jo9_dealer_old_confirm = 2
! JO9 MOD END DEALER_OLD_CONFIRM_LOAD
${body(d,'$ongload').split('\r\n')[0]}`,'DEALER_OLD_CONFIRM_LOAD');
 edit('$ongload',"if $curloc = 'main_screen': gt 'menu_form'",`! JO9 MOD START DEALER_OLD_CONFIRM_REFRESH | ${id}
if jo9_dealer_old_confirm = 1:
 killvar 'jo9_dealer_old_confirm'
 gs 'refresh_database'
 killobj
 interaction_city = menu_subpurchaser
 txt = 2
 gt 'interaction_city'
end
if jo9_dealer_old_confirm = 2:
 killvar 'jo9_dealer_old_confirm'
 gs 'refresh_database'
 killobj
 gt 'slave_auction_sell'
end
! JO9 MOD END DEALER_OLD_CONFIRM_REFRESH
if $curloc = 'main_screen': gt 'menu_form'`,'DEALER_OLD_CONFIRM_REFRESH');
 const raw=c.serialize(d);qa.inspectWorld(raw);a.equal(c.parse(raw).locations.length,267);a.deepEqual(c.serialize(c.parse(raw)),raw);const p={id,description:'옵션창 difficulty_setting 일반매입: 기존속성평가와등급표중높은정가. 쉬움1=90%,보통0=75%,하드2=기존산식. 불복종20%1회·다재다능1회. 잡파/웡 견적·지급동일화,중복확정/대상교체/이전확인세이브보호.',before_sha256:baseline,after_sha256:c.hash(raw),edits};
 const workRaw=fs.readFileSync(game+'/jack.qsp');if(c.hash(workRaw)!==baseline&&c.hash(workRaw)!==p.after_sha256){const previous=read(rec+'/patch.json');a.equal(c.hash(workRaw),previous.after_sha256);const wd=c.parse(workRaw),oldLine="if difficulty_setting = 2 and $slave_psy_status = 'broken': $text[2] = $replace($text[2], $str(auction_price[rating]), $str(auction_price[rating] - (4*auction_price[rating])/5))",newLine="if difficulty_setting = 2 and rating > 0: $text[2] = $replace($text[2], $str(auction_price[rating]), $str(jo9_dealer_offer))";a.equal(body(wd,'interaction_city').split(oldLine).length-1,1);set(wd,'interaction_city',body(wd,'interaction_city').split(oldLine).join(newLine));a.deepEqual(c.serialize(wd),raw);const delta={id:id+'_hard_quote_display',description:'하드 웡 실제지급 산식은 보존하고 표시금액만 실제견적과 일치',before_sha256:previous.after_sha256,after_sha256:p.after_sha256,edits:[{location:'interaction_city',field:'body',old:oldLine,new:newLine,count:1,patchId:'DEALER_HARD_DISPLAY'}]};fs.mkdirSync(root+'/install-patches',{recursive:true});write(root+'/install-patches/'+delta.id+'.json',delta);write(rec+'/install-delta.json',delta);}
 fs.writeFileSync(root+'/inputs/candidate.qsp',raw);write(root+'/patches/'+id+'.json',p);write(rec+'/patch.json',p);const spec=read(rec+'/approved-scope.json');spec.settingVariable='difficulty_setting from game options, NOT game_difficulty from character selection';spec.economicDifficulty={1:'easy 90 percent',0:'normal 75 percent',2:'hard original formulas'};write(rec+'/approved-scope.json',spec);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({candidate:p.after_sha256,edits:edits.length,bodies:[...new Set(edits.map(x=>x.location))],newLocations:0,newActorKeys:0}));
}else if(phase==='trace'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp'));let s=init;const mode=process.argv[3];if(mode!=='init')s+=fixture();if(mode==='price')s+="gs '$slave_price'\n";if(mode==='quote')s+="qa_actual=func('jo9_traits_value','dealer_quote','farid')\n";if(mode.startsWith('base'))s+="qa_actual=func('jo9_traits_value','base_price','slave',500)\n";if(mode==='base-quote'){const t=body(d,'jo9_traits_value'),from=t.indexOf('! JO9 MOD START DEALER_WONG_FINISH'),to=t.indexOf('! JO9 MOD END DEALER_WONG_FINISH')+'! JO9 MOD END DEALER_WONG_FINISH'.length;set(d,'jo9_traits_value',t.slice(0,from)+t.slice(to));}if(mode==='base-finish'){const t=body(d,'jo9_traits_value'),to=t.indexOf('! JO9 MOD END DEALER_QUOTE')+'! JO9 MOD END DEALER_QUOTE'.length;set(d,'jo9_traits_value',t.slice(to));}const n='trace-'+mode;const r=run(d,n,s+`msg 'JO9_QA_DEALER_${n.replaceAll('-','_')}_COMPLETE'`);write(rec+'/'+n+'.json',r);console.log(JSON.stringify(r));
}else if(phase==='green'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp'));let code=init,cases=0,checks=0;const games=process.argv[3]==='one'?[0]:process.argv[3]!==undefined?[Number(process.argv[3])]:[0,1,2],obs=process.argv[3]==='one'?[0]:[0,1,2];
 const check=(condition,label)=>{checks++;code+=`if (${condition}) = 0: msg 'FAIL_DEALER_${label}_rating_<<rating>>_actual_<<qa_actual>>_expected_<<qa_expected>>' & exit\n`;};
 const styles=[{style:0,exotic:0},{style:5,exotic:5,fame:5},{style:3,exotic:2,stamina:1},{skills:0},{beauty:1,stamina:2}];
 for(const gameDifficulty of games)for(const obedienceDifficulty of obs)for(const vendor of (process.argv[3]==='one'?['farid']:['farid','wong']))for(const versatile of (process.argv[3]==='one'?[0]:[0,1]))for(const custom of (process.argv[3]==='one'?[10]:[-20,0,10]))for(const setup of (process.argv[3]==='one'?[styles[0]]:styles)){
  const label='q'+cases++;code+=fixture({...setup,game:gameDifficulty,obed:obedienceDifficulty,versatile,custom,moral:custom<0?0:2});
  // An independent calculation from original evaluator outputs, without calling the candidate quote.
  code+="if difficulty_setting = 2 and '"+vendor+"' = 'farid' and slave['brand'] = 0: is_stock=1\ngs '$slave_price'\nqa_rank=rating\nqa_obed=slave['obedience']\nqa_attr=max(30,slave_base_price*3/2)\nqa_grade=common_price[rating]\nif slave['jo9_versatile'] = 1: qa_grade += qa_grade/4\n";
  if(obedienceDifficulty<2){code+="qa_expected=max(qa_attr,qa_grade)\nif qa_obed < 1: qa_expected=qa_expected*20/100\nqa_expected=qa_expected*"+(obedienceDifficulty===1?90:75)+"/100\n";}else if(vendor==='farid')code+='qa_expected=max(10,slaveprice/2)\n';else code+="qa_expected=auction_price[rating]\nif slave['jo9_versatile'] = 1: qa_expected += qa_expected/4\n";
  code+=`is_stock=1\nqa_actual=func('jo9_traits_value','dealer_quote','${vendor}')\n`;check('qa_actual = qa_expected',label+'_price');check('rating = qa_rank and slave["obedience"] = qa_obed',label+'_actual_grade');check('is_stock = 0',label+'_stock_reset');code+=`qa_again=func('jo9_traits_value','dealer_quote','${vendor}')\n`;check('qa_again = qa_actual',label+'_repeat');check("slave['id'] = 910001 and slave_state = 1 and sparks = 100",label+'_no_transfer');
 }
 if(process.argv[3]!=='one')for(const gameDifficulty of games)for(const obedienceDifficulty of [0,1,2])for(const vendor of ['farid','wong'])for(const versatile of [0,1]){
  const label='broken'+cases++;code+=fixture({game:gameDifficulty,obed:obedienceDifficulty,versatile,broken:1,custom:-20,moral:0});code+="gs '$slave_price'\nqa_grade=common_price[rating]\nif slave['jo9_versatile']=1: qa_grade += qa_grade/4\n";
  if(obedienceDifficulty<2){code+='qa_expected=max(30,slave_base_price*3/2,qa_grade)\n';if(vendor==='wong')code+='qa_expected-=4*qa_expected/5\n';code+=`qa_expected=qa_expected*${obedienceDifficulty===1?90:75}/100\n`;}else if(vendor==='farid')code+='qa_expected=max(10,slaveprice/2)\n';else code+="qa_expected=auction_price[rating]-4*auction_price[rating]/5\nif slave['jo9_versatile']=1: qa_expected += qa_expected/4\n";
  code+=`qa_actual=func('jo9_traits_value','dealer_quote','${vendor}')\n`;check('qa_actual = qa_expected and slave["obedience"] = 100',label);
 }
 if(process.argv[3]!=='one')for(const state of [-1,0,1,2])for(const brand of [0,1,2,3,4])for(const vendor of ['farid','wong']){
  const label='state'+cases++;code+=fixture({state,brand})+`slaveprice=99999\nsell_price=99999\nis_stock=1\nqa_actual=func('jo9_traits_value','dealer_quote','${vendor}')\n`;check((state===-1||state===0)?'qa_actual = 0':'qa_actual > 0',label);check('sparks = 100 and slave_state = '+state,label+'_preserve');check('is_stock = 0',label+'_no_stock_leak');
 }
 // Current grade alone must not cause an obedience discount: trained F can still be valued.
 cases++;code+=fixture({skills:0,obed:1})+"qa_actual=func('jo9_traits_value','dealer_quote','wong')\nqa_expected=max(30,slave_base_price*3/2,common_price[rating])*90/100\n";check('rating = 0 and slave["obedience"] >= 1 and qa_actual = qa_expected','trained_f');
 // Exact double-depreciation and rounding boundaries, using native meat-floor appraisal input.
 for(const b of [20,26,1000]){cases++;code+=fixture({custom:-20,moral:0,obed:1});code+=`slave['base_beauty']=0\nslave['intellect']=0\nslave['ego']=0\nslave['temper']=0\nslave['sensitivity']=0\n$dyn_meat_evaluation={meat_price=${b}}\nqa_actual=func('jo9_traits_value','dealer_quote','farid')\nqa_expected=max(30,slave_base_price*3/2,common_price[rating])*20/100\nqa_expected=qa_expected*90/100\n`;check('qa_actual = qa_expected and slave["obedience"] < 1','floor_'+b);}
 const name=process.argv[3]==='one'?'probe':process.argv[3]===undefined?'green':['green-easy','green-normal','green-hard'][Number(process.argv[3])];code+=`msg 'JO9_QA_DEALER_${name.replaceAll('-','_')}_COMPLETE'\n`;const r=run(d,name,code);write(rec+'/'+name+'-results.json',{status:r.results.every(x=>x.pass)?'PASS':'FAIL',cases,assertions:checks,...r});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');a(r.results.every(x=>x.pass),JSON.stringify(r));console.log(JSON.stringify({cases,checks,...r}));
}else if(phase==='integration'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp'));const redirects=["gt 'guild'","gt 'city_menu_form'"];for(const n of ['jo9_traits_value','slave_auction_sell_end']){let s=body(d,n);for(const dest of redirects)s=s.split(dest).join('exit');set(d,n,s);}
 const orig=body(d,'interaction_city'),st=orig.indexOf('! JO9 MOD START DEALER_WONG_OFFER'),en=orig.indexOf('! JO9 MOD END DEALER_WONG_OFFER')+'! JO9 MOD END DEALER_WONG_OFFER'.length;set(d,'interaction_city',orig.slice(st,en));
 let code=init,cases=0,checks=0;const check=(condition,label)=>{checks++;code+=`if (${condition})=0: msg 'FAIL_DEALER_${label}_cash_<<sparks>>_want_<<qa_pay>>' & exit\n`;};
 for(const setting of [0,1,2])for(const vendor of ['farid','wong'])for(const kind of ['trained','untrained','trained-f','versatile','broken','rare']){
  cases++;code+=fixture({obed:setting,custom:kind==='untrained'?-20:10,moral:kind==='untrained'?0:2,skills:kind==='trained-f'?0:2,versatile:kind==='versatile'?1:0,broken:kind==='broken'?1:0});
  code+="assistant_state=1\nassistant['id']=999001\nassistant['energy']=4\nassistant['custom']=77\nstock['id']=999002\nselected['id']=999003\nsaved_stock['id']=999004\n";
  if(kind==='rare')code+="slave['jo9_peerless']=1\n";
  code+=`qa_pay=func('jo9_traits_value','dealer_quote','${vendor}')\n`;
  if(vendor==='farid'){
   code+=`txt=${kind==='rare'?6:4}\ngs 'slave_auction_sell'\n`;if(kind==='rare')code+="qa_pay=func('jo9_traits_value','market','slave',qa_pay)\n";
   check('sell_price = qa_pay','farid_offer_'+cases);code+="gs 'slave_auction_sell_end'\n";
  }else{
   code+="killvar '$yes'\ninteraction_city=menu_subpurchaser\ngs 'interaction_city'\n";
   if(setting===2&&(kind==='untrained'||kind==='trained-f')){check("$yes = ''",'hard_f_refusal_'+cases);continue;}
   check("instr($yes,'dealer_wong_finish') > 0",'wong_confirm_'+cases);
   check("instr($text[2],str(qa_pay)) > 0",'wong_display_'+cases);
   code+="dynamic $yes\n";
  }
  check('sparks = 100 + qa_pay and slave_state = 0','paid_once_'+cases);check("assistant['id']=999001 and assistant['energy']=4 and assistant['custom']=77 and stock['id']=999002 and selected['id']=999003 and saved_stock['id']=999004",'unrelated_slots_'+cases);
  code+=vendor==='farid'?"gs 'slave_auction_sell_end'\n":"dynamic $yes\n";check('sparks = 100 + qa_pay','duplicate_'+cases);
 }
 for(const vendor of ['farid','wong'])for(const change of ['id','name','type','price','absent','dead','private-room','unbrand']){
  cases++;code+=fixture({obed:1});if(vendor==='farid')code+="txt=4\ngs 'slave_auction_sell'\n";else code+="interaction_city=menu_subpurchaser\ngs 'interaction_city'\n";
  const changes={id:"slave['id']=910002",name:"$slave_name='Same seed, other actor'",type:'slave_type=2606',price:'difficulty_setting=0',absent:'slave_state=0',dead:'slave_state=-1','private-room':'snk_room_target=1',unbrand:'slave["brand"]=0'};code+=changes[change]+'\n';
  if(vendor==='farid'&&change==='unbrand'){code+='brand_reputation=0\n';/* unmarked is an existing Farid eligible route */code+="farid_debt=1\n";}
  code+=vendor==='farid'?"gs 'slave_auction_sell_end'\n":"dynamic $yes\n";check('sparks = 100','changed_'+vendor+'_'+change);if(!['absent','dead'].includes(change))check('slave_state = 1','kept_'+vendor+'_'+change);
 }
 // A loaded obsolete confirmation must request a fresh offer, not silently change its payment.
 cases++;code+=fixture({obed:1});code+="$npc_id='master_vong'\n$yes={\n! JO9 MOD START TBV_SUBPURCHASER_BASE\nsparks+=375\n}\n$text[2]='Old quote 375'\ngs '$ongload'\n";check('jo9_dealer_old_confirm = 0','load_flag_cleared');check("instr($yes,'dealer_wong_finish') > 0 and instr($text[2],'675 스파크') > 0 and sparks=100",'load_offer_reissued');code+="dynamic $yes\n";check('sparks=775 and slave_state=0','loaded_offer_paid');
 // Save uses the native serializer, without touching any existing user saves.
 code+="savegame 'dealer-probe.sav'\nmsg 'JO9_QA_DEALER_integration_COMPLETE'\n";
 // Only final navigation is changed to a subroutine return; transaction statements and guards are exact production code.
 let load=body(d,'$ongload');load=load.split("gt 'interaction_city'").join("gs 'interaction_city' & exit");set(d,'$ongload',load);
 const r=run(d,'integration',code);write(rec+'/integration-results.json',{status:r.results.every(x=>x.pass)?'PASS':'FAIL',cases,assertions:checks,instrumentation:'Exact production offer blocks, transaction guards, valuation, actor clear and rewards. Guild/city final navigation replaced with EXIT; loaded old-confirm rerender uses GS+EXIT. Start runs synthetic state and native SAVEGAME.',...r});a(r.results.every(x=>x.pass),JSON.stringify(r));const sc=require(repo+'/tools/qa/save-codec.cjs'),saved=fs.readFileSync(root+'/integration/dealer-probe.sav');a.deepEqual(sc.serialize(sc.parse(saved)),saved);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({cases,checks,...r}));
}else if(phase==='settings'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),old=c.parse(fs.readFileSync(root+'/inputs/before.qsp'));let code=init,cases=0,checks=0;const evidence={status:'PENDING',characterCreation:'game_difficulty',gameOptions:'difficulty_setting',creationToOptions:{0:1,1:0,2:2},reverseSynchronization:false,menus:{}};
 const check=(cond,label)=>{checks++;code+=`if (${cond})=0: msg 'FAIL_DEALER_settings_${label}_quote_<<qa_actual>>_setting_<<difficulty_setting>>' & exit\n`;};
 for(const menu of ['menu_form','city_menu_form']){
  const callbacks=[...body(old,menu).matchAll(/EXEC: (difficulty_setting = [012] & gt ''menu_form'')/g)].map(m=>m[1].split("''").join("'"));a.equal(callbacks.length,3);evidence.menus[menu]=callbacks;
  for(const creation of [0,1,2])for(const callback of callbacks){const setting=Number(callback.match(/= ([012])/)[1]);cases++;code+=fixture({game:creation,obed:2});code+="$estate='kamira_house'\ngs '#estate_base'\nqa_rent=estate_cost_main[$estate]\nqa_cash=sparks\nqa_points=hero_points\n"+callback.split(" & gt 'menu_form'").join('')+"\nqa_actual=func('jo9_traits_value','dealer_quote','wong')\n";check(`difficulty_setting=${setting} and game_difficulty=${creation}`,menu+'_variable_'+cases);check('estate_cost_main[$estate]=qa_rent and sparks=qa_cash and hero_points=qa_points',menu+'_other_balance_'+cases);check(`qa_actual=${setting===1?675:setting===0?562:375}`,menu+'_payout_'+cases);}
 }
 // Execute actual creation callbacks too, removing only their final navigation.
 for(const [start,callback,want,obed,cash,points]of [[1,'decrease',0,1,10000,3525],[1,'increase',2,2,400,335],[0,'increase',1,0,6000,585],[2,'decrease',1,0,6000,585]]){cases++;code+=`game_difficulty=${start}\ndifficulty_setting=99\nsparks=${start===0?10000:start===1?6000:400}\nhero_points=${start===0?3525:start===1?585:335}\ndynamic $replace($game_difficulty_${callback},'gt $curloc','')\n`;check(`game_difficulty=${want} and difficulty_setting=${obed} and sparks=${cash} and hero_points=${points}`,'creation_'+cases);}
 code+="msg 'JO9_QA_DEALER_settings_COMPLETE'\n";const r=run(d,'settings',code);evidence.status=r.results.every(x=>x.pass)?'PASS':'FAIL';write(rec+'/settings-linkage-results.json',{...evidence,cases,assertions:checks,...r});a(evidence.status==='PASS',JSON.stringify(r));fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({cases,checks,...r}));
}else if(phase==='native-load'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp'));
 const hook=`
if qa_dealer_load_phase = 0:
 qa_dealer_load_phase = 1
 sell_price = 23
 $text[4] = 'OLD OFFER 23'
 killvar 'jo9_dealer_farid_id'
 killvar '$jo9_dealer_farid_name'
 killvar 'jo9_dealer_farid_type'
 killvar 'jo9_dealer_farid_quote'
 savegame 'old-dealer-screen.sav'
 opengame 'old-dealer-screen.sav'
 exit
end
if qa_dealer_load_phase = 1:
 if sell_price ! 675 or instr($text[4], '675 스파크') = 0 or sparks ! 100 or slave_state ! 1: msg 'FAIL_DEALER_native_load' & exit
 msg 'JO9_QA_DEALER_native_load_COMPLETE'
end
`;
 set(d,'slave_auction_sell',body(d,'slave_auction_sell')+hook);const r=run(d,'native-load',init+fixture({obed:1})+"txt=4\nqa_dealer_load_phase=0\ngt 'slave_auction_sell'\n");write(rec+'/native-load-results.json',{status:r.results.every(x=>x.pass)?'PASS':'FAIL',cases:1,assertions:5,method:'Native SAVEGAME then OPENGAME of diagnostic legacy-priced screen; production $ongload rerenders actual slave_auction_sell location',...r});a(r.results.every(x=>x.pass),JSON.stringify(r));console.log(JSON.stringify(r));
}else if(phase==='release'){
 const r=cp.spawnSync('node',[repo+'/tools/qa/release-check.cjs','--candidate',root+'/inputs/candidate.qsp','--baseline',root+'/inputs/before.qsp','--mods-dir',root+'/patches','--engine',game+'/engine/jack.exe','--game-dir',game,'--state-save',game+'/save/JO9_TEST_20261023_01_HOME.sav','--cache-revision','2','--out',root+'/release'],{encoding:'utf8',windowsHide:true,timeout:240000});fs.writeFileSync(rec+'/release-command.log',r.stdout+'\n'+r.stderr);console.log(r.stdout.slice(-1600));a.equal(r.status,0,r.stderr);const runs=fs.readdirSync(root+'/release').filter(n=>n.startsWith('run-')).sort((x,y)=>fs.statSync(root+'/release/'+x).mtimeMs-fs.statSync(root+'/release/'+y).mtimeMs);const rd=root+'/release/'+runs.at(-1),result=read(rd+'/report.json');a.equal(result.verdict,'PASS');a.equal(result.client.probes.length,9);a.equal(result.checks.find(x=>x.name==='inputs-readable').detail.candidate,read(rec+'/patch.json').after_sha256);fs.copyFileSync(rd+'/report.json',rec+'/release-validation.json');fs.copyFileSync(rd+'/report.md',rec+'/release-validation.md');console.log('RELEASE PASS');
}else if(phase==='archive-release'){
 const p=read(rec+'/patch.json'),runs=fs.readdirSync(root+'/release').filter(n=>n.startsWith('run-')).map(n=>root+'/release/'+n).filter(rd=>fs.existsSync(rd+'/report.json')).filter(rd=>{const r=read(rd+'/report.json');return r.verdict==='PASS'&&r.checks.find(x=>x.name==='inputs-readable').detail.candidate===p.after_sha256;});a.equal(runs.length,1);for(const ext of ['json','md'])fs.copyFileSync(runs[0]+'/report.'+ext,rec+'/release-validation.'+ext);console.log('Archived exact final candidate PASS report.');
}else if(phase==='install'){
 const p=read(rec+'/patch.json');for(const f of ['green-results.json','integration-results.json','settings-linkage-results.json'])a.equal(read(rec+'/'+f).status,'PASS');const r=read(rec+'/release-validation.json');a.equal(r.verdict,'PASS');a.equal(r.client.probes.length,9);a.equal(r.checks.find(x=>x.name==='inputs-readable').detail.candidate,p.after_sha256);
 let mods=root+'/patches';const current=c.hash(fs.readFileSync(game+'/jack.qsp'));if(current!==baseline){const delta=read(rec+'/install-delta.json');a.equal(current,delta.before_sha256);a.equal(p.after_sha256,delta.after_sha256);mods=root+'/install-patches';}
 for(const x of read(rec+'/inputs.json'))a.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?current:x.sha256,'Changed while testing: '+x.path);
 const oldNames=new Set(fs.readdirSync(game)),oldBackups=fs.existsSync(rec+'/install-backups.json')?read(rec+'/install-backups.json'):[];const out=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',mods],{encoding:'utf8',windowsHide:true,timeout:90000});fs.writeFileSync(rec+'/install.log',out.stdout+'\n'+out.stderr);a.equal(out.status,0,out.stderr);a.deepEqual(fs.readFileSync(game+'/jack.qsp'),fs.readFileSync(root+'/inputs/candidate.qsp'));write(repo+'/mods/'+id+'.json',p);write(rec+'/install-backups.json',[...oldBackups,...fs.readdirSync(game).filter(n=>!oldNames.has(n)&&n.startsWith('jack.qsp')).map(n=>game+'/'+n)]);
 const xs=read(rec+'/inputs.json').map(x=>({...x,after:c.hash(fs.readFileSync(x.path))}));for(const x of xs)a.equal(x.after,x.path===game+'/jack.qsp'?p.after_sha256:x.sha256);write(rec+'/preservation.json',{status:'PASS',files:xs.length,userSavesUnchanged:xs.filter(x=>/\.sav$/i.test(x.path)).length,unchanged:xs.length-1,onlyChanged:game+'/jack.qsp',results:xs});console.log(JSON.stringify({installed:true,work:p.after_sha256,preserved:xs.length-1}));
}else if(phase==='restore-fixtures'){
 a(!fs.existsSync(root));const p=read(rec+'/patch.json'),raw=z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'));a.equal(c.hash(raw),baseline);fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.writeFileSync(root+'/inputs/before.qsp',raw);const d=c.parse(raw);for(const e of p.edits){const t=body(d,e.location);a.equal(t.split(e.old).length-1,e.count);set(d,e.location,t.split(e.old).join(e.new));}const candidate=c.serialize(d);a.equal(c.hash(candidate),p.after_sha256);fs.writeFileSync(root+'/inputs/candidate.qsp',candidate);write(root+'/patches/'+id+'.json',p);console.log('Isolated inputs restored; WORK unchanged.');
}else if(phase==='document'){
 const p=read(rec+'/patch.json');a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);const g=read(rec+'/green-results.json'),it=read(rec+'/integration-results.json'),st=read(rec+'/settings-linkage-results.json');
 const manual=`# 일반 매입 가격·옵션 난이도 연동\n\n2026-10-24. 사용자 승인 구조를 WORK에 적용했다. 패치 ${id}. 이전 ${baseline}, 현재 ${p.after_sha256}. 변경5로케이션/9편집, 전체267로케이션. 새로케이션·인물영구키·구매이력 없음.\n\n## 난이도는 무엇을 읽는가\n\n사용자의 최종 정정대로 게임 중 옵션창의 difficulty_setting을 읽는다. 쉬움1=90%, 클래식/보통0=75%, 하드코어2=기존 거래처 산식. 캐릭터 선택창의 game_difficulty는 지급률을 직접 선택하지 않는다. 두 변수는 원래 별개이며 생성할 때만0→1,1→0,2→2로 맞춘다. 기존 시작자금·집세·전투·생성점수 보정은 game_difficulty에 그대로 남는다. 옵션창과 도시 복제본 실제 콜백6개 및 생성콜백4개를 실행해 연결을 확인했다.\n\n## 가격\n\n기존 $slave_price로 현재 속성·기술/복종/종합등급을 먼저 다시 계산한다. 기존 slave_base_price×3/2(최소30)와 기존 common_price[등급] 중 큰 금액을 정가로 쓴다. 속성 쪽에는 원래 다재다능25%가 이미 들어 있으므로, 독립된 등급표 후보에만 원래25%를 한 번 적용하고 max한다. 새 속성/성격/장식문신 점수표는 만들지 않았다.\n\n현재 복종도<1이면 정가×20%로 먼저 정수 절사하고, 옵션 난도에 따라90/75%를 곱해 다시 절사한다. 종합등급F라는 이유만으로 불복종이라 판단하지 않는다. 기존 stock20%·등급20~100%·잡파 절반은 쉬움/보통에 다시 곱하지 않는다. 하드는 기존 잡파 stock/등급/절반/최소10, 웡 등급표 절반 및 기존 다재다능을 유지한다. 하드의 원래 하한을 보존하므로 아주 낮은 미훈련 평가에서는 난도별 최저금액이 단순 비례하지 않는다.\n\n웡의 정신붕괴80%감액과 잡파의 기존 특수우대/협상은 그대로다. 이들은 이번90/75%와 별개인 기존 규칙이다. 특수우대는 협상 시 한 번만 적용한다. 일반 개인구매자의 취향·가격/공개경매/납품계약/파산급매/밀수업자·나타샤 신규매입서비스/매입조건 재설계는 변경하지 않았다. 기존 잡파 낙인·평판 제한과 웡의 길드 진입 조건도 유지한다. 쉬움/보통의 웡은 불복종·F도 현재견적에 매입하며 하드의F거절은 유지한다.\n\n## 입력·반환·호출·부작용\n\n- jo9_traits_value의 DEALER_QUOTE: func('jo9_traits_value','dealer_quote','farid' 또는 'wong'). 현재 slave 슬롯과 옵션을 입력으로 읽고 정수 지급액을 반환한다. 빈칸·사망·개인실투영은0. native $slave_price를 호출하므로 원래 외모/복종/기술합/등급 캐시 갱신과 조건달성 다재다능·명성 부여는 발생할 수 있다. 돈과인물을 넘기지 않는다.\n- DEALER_WONG_OFFER: interaction_city의 기존 menu_subpurchaser에서 같은견적을 표시하고 확인문을 만든다.\n- DEALER_WONG_FINISH: 확인의 종자ID와 현재 이름·타입·견적을 재검사한 뒤 native 길드평판/질병후속/인물정리/대금지급을 한 번 실행한다.\n- DEALER_FARID_OFFER/FINISH: slave_auction_sell/끝 로케이션. 지급 직전 새견적을 계산하고 이름·타입·종자ID/견적을 확인한다. 원래 의상정리·평판·판매처 복귀를 유지한다. 종자ID는 인스턴스 고유번호가 아니므로 이름·타입·가격도 함께 검사한다. 이들까지 완전히 같은 인물 둘은 구별하지 않는다. 별도 고유키를 만들지 않았다.\n- DEALER_OLD_CONFIRM_LOAD/REFRESH: $ongload. 이전 웡 결제 코드가 저장된 확인은 새견적으로 다시 표시한다. 저장된 잡파 판매 화면도 다시 그린다. 일반 로드·기존 재산처분 우선 복원은 원래대로다.\n- 견적 대기값은 인물 능력치가 아닌 몇 개의 기존 형식 전역 변수이며, 새제시 때 덮어쓰고 지급 후 지운다. 생성·획득·역할교환 코드는 바꾸지 않았다.\n\n의존성: 기존 $slave_price/#static_base/$update_slave_price·기존 가격표/조수·노예 상태상수·jo9_traits_value의 기존 base_price/market/reward·$clear_slave_instance/의상정리·원래 시내/길드화면. helper를 제거하고 호출부를 남기면 견적/지급이 작동하지 않는다. 예전 콜백을 남기고 helper만 바꾸면 가격표시·확정이 달라질 수 있다. 롤백은 개별구간을 추측해서 지우지 말고 before.qsp.gz 또는 정확패치를 사용한다.\n\n## 검증과 한계\n\n실제 설치 FastQSP 가격경계${g.cases}상황/${g.assertions}조건, 거래흐름${it.cases}/${it.assertions}, 옵션연결${st.cases}/${st.assertions}: 모두PASS. 이전 화면확인 콜백은 진단의 최종시내이동만 EXIT/GS로 바꾸어 실제금액·인물정리·재진입·후속을 검사했다. 구확인 복원은 실제$ongload와생산견적코드를 실행했다. native SAVEGAME와 세이브코덱 바이트왕복PASS. 공식9경로/문법·줄·주석경계/정확패치재생/재적용/1126JSON등록 검사PASS.\n\n별도의 OPENGAME 자동로드는 파일을 일반게임처럼 여는 설치FastQSP의 기존 실패와 같은 증상으로 완료하지 못했다. 해당1건은PASS나상황수에 포함하지 않았다. 실제사용자 세이브의 GUI불러오기·마우스클릭/배치 확인은 미검증이며, 기존76개세이브가 바이트동일함을 확인했다. 게임전체 문법·모든분기 인증은 아니다.\n\n개발 중 새주석의 홀수아포스트로피가QSP전처리를깨뜨리는문제를 실제엔진에서분리·수정했고 최종전체검사를통과했다. 검토중 낙인4거래제한을추가한후보는기존자격변경범위밖이라제거했다. 이전가격과다르게결제하던구확인, 종자ID만으로대상검사하던부분은이름/타입/견적과새견적재표시로보완했다.\n\n## 재현·보존\n\n스크립트 scripts/reproduce.cjs restore-fixtures 후 red, green, settings, integration, release로 격리 재현한다. native-load는 알려진미완료진단을재현한다. 원래세이브76개·CSS·설정·Full 등81개보호입력은그대로이며 WORK QSP만변경했다. 복구gzip과정확mods패치·보고서·핵심로그·재현스크립트를보관하고 재생성가능QSP/복제JSON/시험세이브는정리한다. Full/ZIP/커밋/푸시없음. 다음미구현은사용자승인대기.\n`;
 fs.writeFileSync(rec+'/MANUAL_KO.md',cr(manual));write(rec+'/independent-review.json',{status:'RESOLVED_BY_TESTS',reviewer:'/root/resale_price_paths',reviewedCandidates:['341107cefa1488933a972d614dfbaeb0e60aeedbcf2ebea3439d9ec4c45465a4','c2de0ff32303246e22faeb181116986a0b98f333fb6a47901ca5cd7044446b14'],blockingFindings:[],resolved:['Out-of-scope brand4 refusal removed','Same seed identity additionally checked by name/type/quote, integration same-ID name change rejects','Legacy confirmation reissues current offer instead of silently paying new amount','Final user clarification binds option difficulty_setting not creation game_difficulty'],limits:['No claim of instance uniqueness when seed,name,type and price all match','Reviewer did not run engine; root executed covering regression cases']});write(rec+'/development-findings.json',{quoteParser:{status:'FIXED',cause:'Unbalanced apostrophe in new QSP comment swallowed block parsing',red:'Old base_price call timed out with prefix; removing quote block restored it',green:'Changing only comment apostrophe restored base_price and all final cases'},nativeLoad:{status:'INCOMPLETE_KNOWN_ENGINE_COMMAND_PATH',countedInPassingTests:false,evidence:'native-load-results.json',priorEvidence:['records/seed-namespace-fix-20261020/MANUAL_KO.md:32','records/varbase-repair-20261021/MANUAL_KO.md:37']}});
 const result={status:'PASS_APPLIED_WORK',before:baseline,work:p.after_sha256,changedBodies:5,edits:p.edits.length,locations:267,newLocations:0,newActorKeys:0,setting:'difficulty_setting: easy1=90 normal0=75 hard2=legacy',nativeFocusedCases:g.cases+it.cases+st.cases,nativeFocusedAssertions:g.assertions+it.assertions+st.assertions,nativeReleasePaths:9,oldUserSavesPreserved:76,saveUiLoadVerified:false,nativeCommandLoadCompleted:false,fullSync:false,packaged:false,committed:false,pushed:false,next:'WAIT_USER_APPROVAL'};write(rec+'/FINAL_RESULT.json',result);
 const bundle=repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md',text=fs.readFileSync(bundle,'utf8'),tag='DEALER_ECONOMY_APPLIED_20261024';a(!text.includes(tag));fs.appendFileSync(bundle,cr(`\n\n## WORK 적용 — 일반 매입·게임옵션 난이도 (${tag})\n\n- 현재속성평가/등급가격표중높은정가,옵션 difficulty_setting 쉬움1=90%/보통0=75%/하드2=기존산식. 생성 game_difficulty 와 구분. 불복종20%한번·다재다능한번,기존특수우대/웡정신붕괴감가유지.\n- 기존잡파/웡매입만,확인직전재평가·이름/타입/종자ID/가격검사·재진입중복지급방어·구확인새견적. 신규상인서비스/개인거래/공개경매/급매/새특성가중치변경없음.\n- 실제엔진${result.nativeFocusedCases}상황/${result.nativeFocusedAssertions}조건·옵션콜백/생성콜백·공식9경로/문법/정확재생/재적용PASS. 기존76세이브/Full/CSS/설정보존. 자동OPENGAME은기존엔진명령연결실패로미완료·PASS제외,사용자세이브GUI로드미검증.\n- WORK만,Full/ZIP/커밋/푸시없음. 다음미구현사용자승인대기. [설명·검증한계](../records/dealer-economy-20261024/MANUAL_KO.md).\n`));fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify(result));
}else if(phase==='cleanup-prepare'){
 const p=read(rec+'/patch.json');a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);a.equal(c.hash(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'))),baseline);const allowed=new Set([baseline]);if(fs.existsSync(rec+'/install-delta.json')){const delta=read(rec+'/install-delta.json'),d=c.parse(fs.readFileSync(game+'/jack.qsp'));for(const e of delta.edits)set(d,e.location,body(d,e.location).split(e.new).join(e.old));a.equal(c.hash(c.serialize(d)),delta.before_sha256);allowed.add(delta.before_sha256);}
 const backups=read(rec+'/install-backups.json').map(path=>({path,sha256:c.hash(fs.readFileSync(path))}));for(const x of backups)a(allowed.has(x.sha256));const transient=[];for(const f of fs.readdirSync(rec))if(/^(trace.*\.json|probe-results\.json|green-easy-results\.json)$/.test(f))transient.push(rec+'/'+f);for(const f of fs.readdirSync(rec+'/evidence'))if(/^(trace.*\.log|probe\.log|green-easy\.log)$/.test(f))transient.push(rec+'/evidence/'+f);
 write(rec+'/cleanup-plan.json',{tempRoot:root,recordRoot:rec,gameRoot:game,backups,recordTransient:transient});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');fs.writeFileSync(rec+'/scripts/cleanup.ps1','\uFEFF'+cr(`$ErrorActionPreference='Stop'
$rec='${rec}'
$plan=Get-Content -LiteralPath ($rec+'/cleanup-plan.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$target=[IO.Path]::GetFullPath($plan.tempRoot)
$expected=[IO.Path]::GetFullPath('${root}')
if($target -ne $expected -or $target -notlike 'G:\\Codex\\tmp\\jo9-dealer-economy-*'){throw 'Unexpected temp root'}
function Check-NoLinks([string]$Path){
 $item=Get-Item -LiteralPath $Path -Force
 if(($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw ('Reparse point: '+$Path)}
 if($item.PSIsContainer){foreach($child in Get-ChildItem -LiteralPath $Path -Force){Check-NoLinks $child.FullName}}
}
if(Test-Path -LiteralPath $target){Check-NoLinks $target}
foreach($file in $plan.backups){
 $path=[IO.Path]::GetFullPath($file.path)
 if((Split-Path -Parent $path) -ne [IO.Path]::GetFullPath($plan.gameRoot) -or (Split-Path -Leaf $path) -notmatch '^jack\\.qsp\\.bak_\\d{8}_\\d{6}$'){throw 'Unexpected backup path'}
 if((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLower() -ne $file.sha256){throw 'Backup changed'}
 Check-NoLinks $path
}
foreach($file in $plan.recordTransient){
 $path=[IO.Path]::GetFullPath($file)
 if(-not $path.StartsWith([IO.Path]::GetFullPath($rec)+[IO.Path]::DirectorySeparatorChar)){throw 'Unexpected record path'}
 Check-NoLinks $path
}
foreach($file in $plan.backups){Remove-Item -LiteralPath $file.path -Force}
foreach($file in $plan.recordTransient){Remove-Item -LiteralPath $file -Force}
if(Test-Path -LiteralPath $target){Remove-Item -LiteralPath $target -Recurse -Force}
if(Test-Path -LiteralPath $target){throw 'Temporary root remains'}
[ordered]@{status='PASS';tempRootAbsent=$true;verifiedDuplicateBackupsRemoved=@($plan.backups).Count;transientRecordsRemoved=@($plan.recordTransient).Count;reparsePointsFollowed=$false} | ConvertTo-Json | Set-Content -LiteralPath ($rec+'/cleanup.json') -Encoding UTF8
Write-Output 'Scoped temporary cleanup PASS'
`));console.log(JSON.stringify({cleanupReady:true,backups:backups.length,transientRecords:transient.length}));
}else if(phase==='verify'){
 const p=read(rec+'/patch.json'),raw=fs.readFileSync(game+'/jack.qsp');a.equal(c.hash(raw),p.after_sha256);qa.inspectWorld(raw);a.deepEqual(c.serialize(c.parse(raw)),raw);a.equal(c.hash(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'))),baseline);for(const x of read(rec+'/inputs.json'))a.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?p.after_sha256:x.sha256);console.log(JSON.stringify({final:'PASS',work:p.after_sha256,protectedFiles:82,userSavesPreserved:76,roundtrip:true,rollback:true,tempRootAbsent:!fs.existsSync(root)}));
}else throw Error('Unknown phase '+phase);
