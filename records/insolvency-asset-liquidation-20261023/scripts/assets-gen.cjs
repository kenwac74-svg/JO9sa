const fs = require('node:fs');
const path = require('node:path');
const dir = 'G:/Codex/tmp/jo9-insolvency-20261023';
const city = fs.readFileSync(path.join(dir,'source/interaction_city.txt'),'utf8');
const catalog = {study:{basic:0},bed:{basic:0},bath:{basic:0},kitchen:{},dungeon:{},boudoir:{},lab:{}};
const re = /\$(study|bed|kitchen|bath|dungeon|boudoir|lab) = '([^']+)'\r?\n\s*sparks -= (\d+)/g;
let match; while ((match = re.exec(city))) catalog[match[1]][match[2]] = +match[3];
const rooms = ['study','bed','kitchen','bath','dungeon','boudoir','lab'];
const place = {study:'study',bed:'bedroom',kitchen:'kitchen',bath:'bathroom',dungeon:'dungeon',boudoir:'boudoir',lab:'lab'};
const large = {study:'home_lux',bed:'bedroom_lux',kitchen:'kitchen_lux',bath:'bathroom_lux',dungeon:'dungeon_lux',boudoir:'boudoir_lux',lab:'lab_lux'};
const actual = {study:"$estate ! '' and $estate ! 'slum_house'",bed:"$estate ! '' and $estate ! 'slum_house'",kitchen:'kitchen > 0',bath:'bath > 0',dungeon:'dungeon > 0',boudoir:'boudoir > 0',lab:'lab > 0'};
const floor = {study:'basic',bed:'basic',kitchen:'basic',bath:'basic',dungeon:'basic',boudoir:'basic',lab:'basic'};
let code = `! JO9 MOD START INSOLVENCY_ASSETS_20261023
! quote is read-only; sell always re-quotes immediately before mutation.
! decor_state: 0 current installed decor remains, 1 already recovered.
local $jo9_ls_action = $args[0]
local $jo9_ls_target = $args[1]
local jo9_ls_amount = 0
local jo9_ls_iced = 0

if $jo9_ls_action = 'decor_change':
 jo9_lq_decor_state[$jo9_ls_target] = 0
 exit
end

if $jo9_ls_action = 'sell':
 jo9_lq_sold = 0
 jo9_lq_paid = 0
 gs 'jo9_liquidation_assets', 'quote'
 if jo9_lq_available[$jo9_ls_target] ! 1: exit
 jo9_ls_amount = jo9_lq_value[$jo9_ls_target]
 if $jo9_ls_target = 'decor':
`;
for (const room of rooms) {
 code += `  if jo9_lq_value['decor_${room}'] > 0:
   $${room} = '${floor[room]}'
   jo9_lq_decor_state['${room}'] = 1
   $bg['${place[room]}'] = $interior_${room}[$${room}]
   $bg['${large[room]}'] = $interior_${room}_large[$${room}]
   $place_info['${place[room]}'] = $interior_${room}_info[$${room}]
  end
`;
}
code += ` elseif $jo9_ls_target = 'room4':
  kulaconstruct = 3
 elseif $jo9_ls_target = 'room3':
  kulaconstruct = 2
 elseif $jo9_ls_target = 'room2':
  kulaconstruct = 1
 elseif $jo9_ls_target = 'room1':
  kulaconstruct = 0
 elseif $jo9_ls_target = 'lab':
  lab = 0
 elseif $jo9_ls_target = 'boudoir':
  boudoir = 0
 elseif $jo9_ls_target = 'dungeon':
  dungeon = 0
  if cell_state = 1: cell_state = 0
 elseif $jo9_ls_target = 'barn':
  barn = 0
  if cell_state = 2: cell_state = 0
 elseif $jo9_ls_target = 'pen':
  pen = 0
 elseif $jo9_ls_target = 'stasis':
  stasis_tank = 0
  if cell_state = 3: cell_state = 0
 elseif $jo9_ls_target = 'house':
  owner = 0
  if slums_shakedown ! 0 and day > slums_shakedown + 100: slums_shakedown = day - 100
  $estate = 'slum_house'
  $interior = 'slum_house'
  gs 'new_estate'
 else
  exit
 end
 sparks += jo9_ls_amount
 jo9_lq_paid = jo9_ls_amount
 jo9_lq_sold = 1
 exit
end

if $jo9_ls_action ! 'quote': exit
killvar 'jo9_lq_value'
killvar 'jo9_lq_available'
killvar '$jo9_lq_reason'
`;
for (const room of rooms) {
 code += `jo9_ls_amount = 0\nif (${actual[room]}) and jo9_lq_decor_state['${room}'] = 0:\n`;
 for (const [style,cost] of Object.entries(catalog[room])) code += ` if $${room} = '${style}': jo9_ls_amount = ${cost}\n`;
 code += `end\njo9_lq_value['decor_${room}'] = max(0, jo9_ls_amount / 2)\njo9_lq_value['decor'] += jo9_lq_value['decor_${room}']\n`;
}
code += `jo9_lq_available['decor'] = iif(jo9_lq_value['decor'] > 0, 1, 0)
if jo9_lq_available['decor'] = 0: $jo9_lq_reason['decor'] = '지금 처분해서 돈을 마련할 수 있는 실내장식은 없다.'
`;
for (const [n,refund] of [[1,2500],[2,1000],[3,2500],[4,5000]]) {
 code += `
if kulaconstruct >= ${n}:
 if room${n}_state ! CONST_INT['no_slave']:
  $jo9_lq_reason['room${n}'] = '개인실 ${n}에는 아직 입주자가 있다. 직접 방을 비운 뒤에 철거해야 한다.'
 elseif kulaconstruct ! ${n}:
  $jo9_lq_reason['room${n}'] = '가장 나중에 증축한 개인실부터 차례로 철거해야 한다.'
 else
  jo9_lq_available['room${n}'] = 1
  jo9_lq_value['room${n}'] = ${refund}
 end
else
 $jo9_lq_reason['room${n}'] = '아직 증축하지 않은 개인실이다.'
end
`;
}
code += `
! Facilities are rentals billed for the previous decade, not owned buildings.
! At the failed billing boundary there is no unused prepaid period to refund.
if lab > 0:
 jo9_lq_available['lab'] = 1
else
 $jo9_lq_reason['lab'] = '사용 중인 연구실이 없다.'
end
if boudoir > 0:
 jo9_lq_available['boudoir'] = 1
else
 $jo9_lq_reason['boudoir'] = '사용 중인 별실이 없다.'
end
if dungeon > 0:
 if prisoner_state = CONST_INT['no_slave']:
  jo9_lq_available['dungeon'] = 1
 else
  $jo9_lq_reason['dungeon'] = '감옥에 사람이 남아 있다. 직접 비운 뒤에 시설을 정리해야 한다.'
 end
else
 $jo9_lq_reason['dungeon'] = '사용 중인 감옥이 없다.'
end
if barn > 0:
 if farmhand_state = CONST_INT['no_slave'] and cow_state = CONST_INT['no_slave'] and harpy_state = CONST_INT['no_slave'] and pig_state = CONST_INT['no_slave']:
  jo9_lq_available['barn'] = 1
 else
  $jo9_lq_reason['barn'] = '외양간에 사람이 남아 있다. 직접 비운 뒤에 시설을 정리해야 한다.'
 end
else
 $jo9_lq_reason['barn'] = '사용 중인 외양간이 없다.'
end
if pen > 0:
 if pet_tentacle = 0:
  jo9_lq_available['pen'] = 1
 else
  $jo9_lq_reason['pen'] = '우리 안에 안개 괴물이 남아 있다. 직접 우리를 비운 뒤에 정리해야 한다.'
 end
else
 $jo9_lq_reason['pen'] = '사용 중인 괴물 우리가 없다.'
end
`;
for(let n=1;n<=18;n++) code += `if iced_${n}_state ! CONST_INT['no_slave']: jo9_ls_iced = 1\n`;
code += `if stasis_tank > 0:
 if jo9_ls_iced = 0:
  jo9_lq_available['stasis'] = 1
 else
  $jo9_lq_reason['stasis'] = '냉동 보관 중인 사람이 있다. 직접 모두 꺼낸 뒤에 장치를 반납해야 한다.'
 end
else
 $jo9_lq_reason['stasis'] = '집에 대여한 냉동 보관 장치가 없다.'
end

if $estate = '' or $estate = 'slum_house':
 $jo9_lq_reason['house'] = '현재 처분할 주택이 없다.'
elseif kulaconstruct > 0:
 $jo9_lq_reason['house'] = '증축한 개인실을 먼저 비우고 철거해야 한다.'
elseif room1_state ! CONST_INT['no_slave'] or room2_state ! CONST_INT['no_slave'] or room3_state ! CONST_INT['no_slave'] or room4_state ! CONST_INT['no_slave']:
 $jo9_lq_reason['house'] = '개인실에 사람이 남아 있다. 직접 방을 비운 뒤에 주거를 정리해야 한다.'
elseif prisoner_state ! CONST_INT['no_slave'] or farmhand_state ! CONST_INT['no_slave'] or cow_state ! CONST_INT['no_slave'] or harpy_state ! CONST_INT['no_slave'] or pig_state ! CONST_INT['no_slave'] or pet_tentacle ! 0:
 $jo9_lq_reason['house'] = '부속 시설에 사람이 있거나 괴물이 남아 있다. 직접 시설을 비운 뒤에 주거를 정리해야 한다.'
elseif lab > 0 or pen > 0 or stasis_tank > 0:
 $jo9_lq_reason['house'] = '별도로 대여한 시설부터 정리해야 한다.'
elseif (dungeon > 0 and estate_cost_dungeon[$estate] > 0) or (boudoir > 0 and estate_cost_boudoir[$estate] > 0) or (barn > 0 and estate_cost_barn[$estate] > 0):
 $jo9_lq_reason['house'] = '별도로 대여한 시설부터 정리해야 한다.'
else
 jo9_lq_available['house'] = 1
 if owner = 1: jo9_lq_value['house'] = max(0, 75 * estate_cost_main[$estate] / 2)
end

! During a pending bill, ordinary relocation must not empty occupied facilities.
if room1_state ! CONST_INT['no_slave'] or room2_state ! CONST_INT['no_slave'] or room3_state ! CONST_INT['no_slave'] or room4_state ! CONST_INT['no_slave'] or prisoner_state ! CONST_INT['no_slave'] or farmhand_state ! CONST_INT['no_slave'] or cow_state ! CONST_INT['no_slave'] or harpy_state ! CONST_INT['no_slave'] or pig_state ! CONST_INT['no_slave'] or pet_tentacle ! 0:
 $jo9_lq_reason['move'] = '시설 안에 남아 있는 인물을 먼저 직접 옮겨야 한다.'
elseif stasis_tank > 0 and jo9_ls_iced ! 0:
 $jo9_lq_reason['move'] = '냉동 보관 중인 인물을 먼저 직접 옮겨야 한다.'
else
 jo9_lq_available['move'] = 1
end
! JO9 MOD END INSOLVENCY_ASSETS_20261023
`;
const replacements=[];
for(const room of rooms) for(const [style,cost] of Object.entries(catalog[room])) {
 const anchor = `$${room} = '${style}'`;
 const regex = new RegExp(`(^[ \\t]*\\$${room} = '${style}'\\r?\\n)([ \\t]*sparks -= ${cost}\\r?\\n)?`,'m');
 const m=city.match(regex);
 if(!m) throw new Error(`Missing decor hook ${room}/${style}`);
 const old=m[0], indent=m[1].match(/^[ \t]*/)[0];
 replacements.push({location:'interaction_city',label:`decor_${room}_${style}`,old,new:old+`${indent}! JO9 MOD START INSOLVENCY_DECOR_CHANGE_20261023\r\n${indent}gs 'jo9_liquidation_assets', 'decor_change', '${room}'\r\n${indent}! JO9 MOD END INSOLVENCY_DECOR_CHANGE_20261023\r\n`,count:1});
}
// new_estate leaves recovery flags intact: moving cannot reissue refunded decor.

const guard = (target, indent) => `${indent}! JO9 MOD START INSOLVENCY_OCCUPIED_GUARD_20261023\r\n${indent}if jo9_lq['active'] = 1:\r\n${indent} gs 'jo9_liquidation_assets', 'quote'\r\n${indent} if jo9_lq_available['${target}'] ! 1:\r\n${indent}  msg $jo9_lq_reason['${target}']\r\n${indent}  gt 'shop_general'\r\n${indent} end\r\n${indent}end\r\n${indent}! JO9 MOD END INSOLVENCY_OCCUPIED_GUARD_20261023\r\n`;
for (const [label,old,target] of [
 ['cancel_dungeon',"\t\tdungeon = 0\r\n\t\tif cell_state = 1",'dungeon'],
 ['cancel_boudoir',"\t\tboudoir = 0\r\n\t\tgt 'shop_general'",'boudoir'],
 ['cancel_lab',"\t\tlab = 0\r\n\t\tgt 'shop_general'",'lab'],
 ['cancel_pen',"\t\tpen = 0\r\n\t\tpet_tentacle = 0",'pen'],
 ['cancel_barn',"\t\tif farmhand_state = CONST_INT['no_slave'] and harpy_state = CONST_INT['no_slave'] and _",'barn'],
 ['cancel_stasis',"\t\tstasis_tank = 0\r\n\t\tif cell_state = 3",'stasis'],
 ['sell_house',"if owner = 1:\r\n\t\t\tsparks += (25 * estate_cost_main[$estate])",'house']
]) {
 const count=city.split(old).length-1;if(count!==1)throw Error(label+' anchor count '+count);
 const redirect = target === 'house' ? "\t\t! JO9 MOD START INSOLVENCY_PENDING_HOUSE_PRICE_20261023\r\n\t\tif jo9_lq['active'] = 1:\r\n\t\t gs 'jo9_liquidation_assets', 'sell', 'house'\r\n\t\t gt 'shop_general'\r\n\t\tend\r\n\t\t! JO9 MOD END INSOLVENCY_PENDING_HOUSE_PRICE_20261023\r\n" : '';
 replacements.push({location:'interaction_city',label:'pending_'+label,old,new:guard(target,'\t\t')+redirect+old,count:1});
}
for(const id of [13211,13221,13231,13241,13251,13261,13271,13281,13301]){
 const regex=new RegExp('^if interaction_city = '+id+':\\r?\\n','mi');const m=city.match(regex);if(!m)throw Error('Missing estate move '+id);const old=m[0];replacements.push({location:'interaction_city',label:'pending_move_'+id,old,new:old+guard('move','\t'),count:1});
}
fs.writeFileSync(path.join(dir,'assets-body.txt'),code.replace(/\r?\n/g,'\r\n'),'utf8');
fs.writeFileSync(path.join(dir,'assets-replacements.json'),JSON.stringify(replacements,null,2),'utf8');
fs.writeFileSync(path.join(dir,'assets-catalog.json'),JSON.stringify(catalog,null,2),'utf8');
console.log(JSON.stringify({bodyLines:code.split('\n').length,replacements:replacements.length,catalogEntries:Object.values(catalog).reduce((n,x)=>n+Object.keys(x).length,0)}));
