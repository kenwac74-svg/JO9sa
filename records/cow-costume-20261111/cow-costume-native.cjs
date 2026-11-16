const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const dir='G:/Codex/tmp/jo9-cow-costume-20261111/native',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const raw=fs.readFileSync(process.argv[2]),d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const assignment=(loc,name)=>{const s=body(loc),a=s.indexOf(name+' = {'),z=s.indexOf('\r\n}',a);if(a<0||z<a)throw Error(name);return s.slice(a,z+3);};
const recalc=assignment('#item_base','$recalc_equipment_bonuses');
const purchase=body('interaction_result_city').slice(body('interaction_result_city').indexOf("if $interaction_type = 'buy_item':"),body('interaction_result_city').indexOf('!interaction type - purchase item for the home')).replace("gt 'item_buy'",'exit');
let code=`gs 'jo9_cow_costume','data'
if $item_name['cow_costume'] ! '젖소 코스튬' or item_price['cow_costume'] ! 25: msg 'FAIL costume registration' & exit
CONST_INT['no_slave']=0 & CONST_INT['slave_exist']=1
${recalc}
slave_state=1 & slave['intellect']=5 & slave['pride']=5
$slave['cloth']='cow_costume'
dynamic $replace($recalc_equipment_bonuses,'dyn'+'slave','slave')
if daily_bonus['instinct']!1 or learn_bonus['cowSK']!2 or slave['ex_plus']!1 or slave['st_plus']!-1: msg 'FAIL costume effects' & exit
if daily_bonus['intellect']!0 or daily_bonus['pride']!0 or slave['neg_clothes']!0: msg 'FAIL costume harmful effects' & exit
$slave['cloth']='none'
dynamic $replace($recalc_equipment_bonuses,'dyn'+'slave','slave')
if daily_bonus['instinct']!0 or learn_bonus['cowSK']!0 or slave['ex_plus']!0 or slave['st_plus']!0: msg 'FAIL unequip' & exit
${assignment('#dynamic','$slave_cloth_list')}
${assignment('#dynamic','$assistant_cloth_list')}
${assignment('#options','$baraholka_s_options[3]')}
${assignment('#options','$baraholka_a_options[3]')}
$display_options[3]=$baraholka_s_options[3]
gs 'jo9_cow_costume','load'
if instr($slave_cloth_list,'cow_costume')=0 or instr($assistant_cloth_list,'cow_costume')=0: msg 'FAIL saved equipment list' & exit
if instr($baraholka_s_options[3],'39934')=0 or instr($baraholka_a_options[3],'39834')=0 or instr($display_options[3],'cow_costume')=0: msg 'FAIL saved market menu' & exit
$qa_menu=$display_options[3] & $qa_list=$slave_cloth_list
gs 'jo9_cow_costume','load'
if $qa_menu!$display_options[3] or $qa_list!$slave_cloth_list: msg 'FAIL repeated load' & exit
one_time_aurabound_items_hint=1 & sound_on=0 & item_qty=1
$item_id='cow_costume' & $interaction_type='buy_item'
sparks=24
gs 'QA_costume_buy'
if $do_buy!'': msg 'FAIL insufficient funds' & exit
sparks=25
gs 'QA_costume_buy'
dynamic $do_buy
if sparks!0 or inventory['cow_costume']!1: msg 'FAIL purchase' & exit
$slave['cloth']='none' & is_home=1 & $return_lock='none' & $new_item='cow_costume' & slot=24
gs 'item_change'
if $slave['cloth']!'cow_costume' or inventory['cow_costume']!0: msg 'FAIL actual equip' & exit
slave_type=99999 & $slave['fullimage']='qa/default' & $slave['cloth']='cow_gear'
$qa_image=$func('display_fullimage','slave','qa')
if $patch_img_arr_name!'indpack_cow': msg 'FAIL original cow image route' & exit
$slave['cloth']='cow_costume'
$qa_costume_image=$func('display_fullimage','slave','qa')
if $patch_img_arr_name!'indpack_cow' or $qa_image!$qa_costume_image: msg 'FAIL shared cow image route' & exit
msg 'JO9_QA_COWCOSTUME_costume_COMPLETE'
exit`;
code=code.replace(/\r\n|\n/g,'\r\n');d.lines[d.locations.find(l=>l.name==='Start').body]=c.shift(code,-5);
d.lines.splice(d.lines.length-1,0,c.shift('QA_costume_buy',-5),'',c.shift(purchase,-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);
fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(dir+'/costume.qsp',c.serialize(d));fs.writeFileSync(dir+'/plan.json',JSON.stringify([{name:'costume',file:dir+'/costume.qsp',marker:'JO9_QA_COWCOSTUME_costume_COMPLETE',checkpoint:'actual item registration/effects/unequip/cache repair/price boundary/purchase/equip'}],null,2));
console.log(dir+'/plan.json');
