'use strict';
const fs=require('node:fs'),path=require('node:path');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const base='G:/Codex/tmp/jo9-insolvency-20261023';
const src=process.argv[2]||path.join(base,'assets-body.txt'),out=process.argv[3]||path.join(base,'native/assets');
const baseDoc=core.parse(fs.readFileSync(path.join(base,'before.qsp')));
const asset=fs.readFileSync(src,'utf8').replace(/^\uFEFF/,'').replace(/\r?\n/g,'\r\n');
const estate=fs.readFileSync(path.join(base,'source/new_estate.txt'),'utf8').replace(/^\uFEFF/,'').replace(/\r?\n/g,'\r\n');
const estateBase=fs.readFileSync(path.join(base,'source/#estate_base.txt'),'utf8').replace(/^\uFEFF/,'').replace(/\r?\n/g,'\r\n');
const cases=[];
const assert=(condition,label)=>`if ${condition}:\r\n msg 'JO9_QA_ASSERT_ASSETS_${label}'\r\n exit\r\nend`;
const common=["killall","settimer 0","gs '#estate_base'","CONST_INT['no_slave']=0","CONST_INT['slave_exist']=1","$estate='qa_estate'","$interior='basic'",'owner=1','sparks=0',"$study='basic'","$bed='basic'","$bath='basic'","$kitchen='basic'","$lab='econom'","$boudoir='basic'","$dungeon='basic'","estate_cost_main['qa_estate']=100"];
cases.push(['decor-repeat',[
 "kitchen=1","bath=1","lab=1","dungeon=1","boudoir=1","$study='victorian'","$bed='gothic'","$bath='gothic'","$dungeon='victorian'","$boudoir='lux'","$lab='gothic'",
 "gs 'jo9_liquidation_assets','quote'",assert("jo9_lq_value['decor'] ! 360",'DECOR_QUOTE'),assert("sparks ! 0",'QUOTE_NO_INCOME'),
 "gs 'jo9_liquidation_assets','sell','decor'",assert('sparks ! 360 or jo9_lq_paid ! 360 or jo9_lq_sold ! 1','DECOR_FIRST'),
 assert("$study ! 'basic' or $bed ! 'basic' or $lab ! 'basic'",'DECOR_MINIMUM'),
assert("$study ! 'basic' or $bg['study'] ! $interior_study['basic'] or $bg['home_lux'] ! $interior_study_large['basic'] or $place_info['study'] ! $interior_study_info['basic'] or $bg['study'] = '' or $bg['home_lux'] = ''",'DECOR_LINK_STUDY'),
assert("$bed ! 'basic' or $bg['bedroom'] ! $interior_bed['basic'] or $bg['bedroom_lux'] ! $interior_bed_large['basic'] or $place_info['bedroom'] ! $interior_bed_info['basic'] or $bg['bedroom'] = '' or $bg['bedroom_lux'] = ''",'DECOR_LINK_BED'),
assert("$kitchen ! 'basic' or $bg['kitchen'] ! $interior_kitchen['basic'] or $bg['kitchen_lux'] ! $interior_kitchen_large['basic'] or $place_info['kitchen'] ! $interior_kitchen_info['basic'] or $bg['kitchen'] = '' or $bg['kitchen_lux'] = ''",'DECOR_LINK_KITCHEN'),
assert("$bath ! 'basic' or $bg['bathroom'] ! $interior_bath['basic'] or $bg['bathroom_lux'] ! $interior_bath_large['basic'] or $place_info['bathroom'] ! $interior_bath_info['basic'] or $bg['bathroom'] = '' or $bg['bathroom_lux'] = ''",'DECOR_LINK_BATH'),
assert("$dungeon ! 'basic' or $bg['dungeon'] ! $interior_dungeon['basic'] or $bg['dungeon_lux'] ! $interior_dungeon_large['basic'] or $place_info['dungeon'] ! $interior_dungeon_info['basic'] or $bg['dungeon'] = '' or $bg['dungeon_lux'] = ''",'DECOR_LINK_DUNGEON'),
assert("$boudoir ! 'basic' or $bg['boudoir'] ! $interior_boudoir['basic'] or $bg['boudoir_lux'] ! $interior_boudoir_large['basic'] or $place_info['boudoir'] ! $interior_boudoir_info['basic'] or $bg['boudoir'] = '' or $bg['boudoir_lux'] = ''",'DECOR_LINK_BOUDOIR'),
assert("$lab ! 'basic' or $bg['lab'] ! $interior_lab['basic'] or $bg['lab_lux'] ! $interior_lab_large['basic'] or $place_info['lab'] ! $interior_lab_info['basic'] or $bg['lab'] = '' or $bg['lab_lux'] = ''",'DECOR_LINK_LAB'),
 "gs 'jo9_liquidation_assets','sell','decor'",assert('sparks ! 360 or jo9_lq_paid ! 0 or jo9_lq_sold ! 0','DECOR_DUPLICATE'),
 "gs 'jo9_liquidation_assets','decor_change','kitchen'","gs 'jo9_liquidation_assets','quote'",assert("jo9_lq_value['decor'] ! 10",'REPURCHASE_QUOTE'),
 "gs 'jo9_liquidation_assets','sell','decor'",assert('sparks ! 370 or jo9_lq_paid ! 10','REPURCHASE_ONCE'),
 "gs 'jo9_liquidation_assets','sell','decor'",assert('sparks ! 370 or jo9_lq_paid ! 0','REPURCHASE_DUPLICATE')
]]);
cases.push(['decor-rental',[
 'owner=0',"$interior='elite'","$study='elite'","$bed='elite'","$kitchen='elite'","$bath='elite'",'kitchen=1','bath=1',
 "gs 'jo9_liquidation_assets','quote'",assert("jo9_lq_value['decor'] ! 175",'CURRENT_CATALOG_DECOR'),
 "$study='elite'","gs 'jo9_liquidation_assets','quote'",assert("jo9_lq_value['decor'] ! 175",'CURRENT_CATALOG_SWAP'),
 "gs 'jo9_liquidation_assets','sell','decor'",assert('sparks ! 175','RENTAL_SALE'),
 "gs 'jo9_liquidation_assets','sell','decor'",assert('sparks ! 175','RENTAL_REPEAT')
]]);
const room=[];
for(let n=4;n>=1;n--){const expected={1:2500,2:1000,3:2500,4:5000}[n];room.push(`kulaconstruct=${n}`,`room${n}_state=1`,`$room${n}['id']='QA_KEEP_${n}'`,"gs 'jo9_liquidation_assets','quote'",assert(`jo9_lq_available['room${n}'] ! 0`,'ROOM_OCCUPIED_'+n),`gs 'jo9_liquidation_assets','sell','room${n}'`,assert(`kulaconstruct ! ${n} or jo9_lq_sold ! 0 or $room${n}['id'] ! 'QA_KEEP_${n}'`,'ROOM_OCCUPIED_PRESERVE_'+n),`room${n}_state=0`,"gs 'jo9_liquidation_assets','quote'",assert(`jo9_lq_value['room${n}'] ! ${expected}`,'ROOM_VALUE_'+n),`qa_money=sparks`,`gs 'jo9_liquidation_assets','sell','room${n}'`,assert(`kulaconstruct ! ${n-1} or sparks ! qa_money+${expected}`,'ROOM_SELL_'+n),`gs 'jo9_liquidation_assets','sell','room${n}'`,assert(`sparks ! qa_money+${expected} or jo9_lq_sold ! 0`,'ROOM_REPEAT_'+n));}
cases.push(['decor-free-move',["$study='lux'","$bed='lux'","gs 'jo9_liquidation_assets','sell','decor'",assert('sparks ! 200','MOVE_INITIAL_SALE'),"$estate='qa_other_estate'","$interior='lux'","gs 'new_estate'","gs 'jo9_liquidation_assets','quote'",assert("jo9_lq_value['decor_study'] ! 0 or jo9_lq_value['decor_bed'] ! 0",'MOVE_NO_MASK_RESET')]]);
cases.push(['rooms-repeat',room]);
const occupied=[];
for(const [key,state,flag]of [['dungeon','prisoner_state','dungeon'],['barn','farmhand_state','barn'],['barn','cow_state','barn'],['barn','harpy_state','barn'],['barn','pig_state','barn'],['pen','pet_tentacle','pen']]){
 for(const s of [1,2,-1])occupied.push(`${flag}=1`,`${state}=${s}`,"gs 'jo9_liquidation_assets','quote'",assert(`jo9_lq_available['${key}'] ! 0`,'OCCUPIED_'+state+'_'+(s<0?'negative':s)),`gs 'jo9_liquidation_assets','sell','${key}'`,assert(`${flag} ! 1 or ${state} ! ${s} or jo9_lq_sold ! 0`,'PRESERVE_'+state+'_'+(s<0?'negative':s)),`${state}=0`);
}
cases.push(['facilities-occupied',occupied]);
const ice=['stasis_tank=1'];for(let i=1;i<=18;i++){ice.push(`iced_${i}_state=1`,`$iced_${i}['id']='QA_ICE_${i}'`,"gs 'jo9_liquidation_assets','quote'",assert("jo9_lq_available['stasis'] ! 0",'ICE_BLOCK_'+i),"gs 'jo9_liquidation_assets','sell','stasis'",assert(`stasis_tank ! 1 or iced_${i}_state ! 1 or $iced_${i}['id'] ! 'QA_ICE_${i}' or jo9_lq_sold ! 0`,'ICE_PRESERVE_'+i),`iced_${i}_state=0`);}
ice.push("gs 'jo9_liquidation_assets','sell','stasis'",assert('stasis_tank ! 0 or jo9_lq_sold ! 1 or sparks ! 0','ICE_EMPTY'),"gs 'jo9_liquidation_assets','sell','stasis'",assert('jo9_lq_sold ! 0 or sparks ! 0','ICE_REPEAT'));
cases.push(['stasis-occupied',ice]);
cases.push(['stale-quotes',[
 'kulaconstruct=4','room4_state=0',"gs 'jo9_liquidation_assets','quote'",assert("jo9_lq_available['room4'] ! 1",'STALE_SETUP'),
 'room4_state=1',"gs 'jo9_liquidation_assets','sell','room4'",assert('jo9_lq_sold ! 0 or sparks ! 0 or room4_state ! 1 or kulaconstruct ! 4','STALE_ROOM'),
 'room4_state=0','kulaconstruct=0','stasis_tank=1',"gs 'jo9_liquidation_assets','quote'",'iced_18_state=1',"gs 'jo9_liquidation_assets','sell','stasis'",assert('jo9_lq_sold ! 0 or sparks ! 0 or stasis_tank ! 1 or iced_18_state ! 1','STALE_STASIS')
]]);
cases.push(['house-empty',[
 "slave_state=1","assistant_state=1","$slave_name='QA_SLAVE'","$assistant_name='QA_ASSISTANT'",
 "gs 'jo9_liquidation_assets','quote'",assert("jo9_lq_available['house'] ! 1 or jo9_lq_value['house'] ! 3750",'HOUSE_QUOTE'),
 "gs 'jo9_liquidation_assets','sell','house'",assert("$estate ! 'slum_house' or owner ! 0 or sparks ! 3750 or jo9_lq_sold ! 1",'HOUSE_SELL'),
 assert("slave_state ! 1 or assistant_state ! 1 or $slave_name ! 'QA_SLAVE' or $assistant_name ! 'QA_ASSISTANT'",'HOUSE_ACTORS'),
 "gs 'jo9_liquidation_assets','sell','house'",assert('sparks ! 3750 or jo9_lq_sold ! 0','HOUSE_REPEAT')
]]);
cases.push(['house-rounding',["estate_cost_main['qa_estate']=19","gs 'jo9_liquidation_assets','quote'",assert("jo9_lq_value['house'] ! 712",'HOUSE_ROUNDING')]]);
cases.push(['house-occupied',[
 'room1_state=1',"gs 'jo9_liquidation_assets','sell','house'",assert("$estate ! 'qa_estate' or owner ! 1 or jo9_lq_sold ! 0 or room1_state ! 1",'HOUSE_ROOM_BLOCK'),
 'room1_state=0','prisoner_state=1',"gs 'jo9_liquidation_assets','sell','house'",assert("$estate ! 'qa_estate' or owner ! 1 or jo9_lq_sold ! 0 or prisoner_state ! 1",'HOUSE_PRISONER_BLOCK'),
 'prisoner_state=0','stasis_tank=1','iced_1_state=1',"gs 'jo9_liquidation_assets','sell','house'",assert("$estate ! 'qa_estate' or owner ! 1 or jo9_lq_sold ! 0 or iced_1_state ! 1",'HOUSE_STASIS_BLOCK')
]]);
fs.mkdirSync(out,{recursive:true});const plan=[];
for(const[name,steps]of cases){const marker='JO9_QA_ASSETS_'+name.replaceAll('-','_')+'_COMPLETE';const bodies={Start:[...common,...steps,`msg '${marker}'`].join('\r\n'),jo9_liquidation_assets:asset,new_estate:estate,'#estate_base':estateBase};const head=baseDoc.lines.slice(0,4);head[3]=core.shift(String(Object.keys(bodies).length),-5);const lines=[...head];for(const[n,b]of Object.entries(bodies))lines.push(core.shift(n,-5),'',core.shift(b,-5),core.shift('0',-5));lines.push('');const bytes=Buffer.from(lines.join('\r\n'),'utf16le');core.parse(bytes);const file=path.join(out,name+'.qsp');fs.writeFileSync(file,bytes);plan.push({name,file,marker,checkpoint:'Exact production assets body; installed native engine state assertions'});}
fs.writeFileSync(path.join(out,'assets-plan.json'),JSON.stringify(plan,null,2));fs.writeFileSync(path.join(out,'prepared.json'),JSON.stringify({source:src,assetSha256:core.hash(Buffer.from(asset)),cases:cases.map(([name,steps])=>({name,assertions:steps.filter(s=>s.startsWith('if ')).length})),productionBodiesUnchanged:true},null,2));console.log(JSON.stringify({plan:path.join(out,'assets-plan.json'),cases:cases.length}));
