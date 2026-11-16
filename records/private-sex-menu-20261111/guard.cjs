'use strict';
const fs=require('node:fs'),p=require('node:path'),a=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const input=process.argv[2],dir=p.resolve(process.argv[3]);a(input&&dir);
const d=c.parse(fs.readFileSync(input));
const source=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const put=(n,s)=>{const l=d.locations.find(l=>l.name===n);a(l,n);d.lines[l.body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);};
let start=`killall
$onnewloc = ''
$ongload = ''
$counter = ''
settimer 0
gs '#static_base'
gs '#variative'
gs '#dynamic'
$onnewloc = ''
menu_sex = 16
qa_failed = 0
for qa_present = 0 to 1 step 1:
for qa_room = 1 to 4 step 1:
 slave_state = qa_present * CONST_INT['slave_exist']
 slave['qa_id'] = 100
 dynamic 'room' + str(qa_room) + '_state = CONST_INT["slave_exist"]'
 dynamic 'room' + str(qa_room) + '["qa_id"] = 100 + qa_room'
 dynamic 'room' + str(qa_room) + '["energy"] = 3'
 $onnewloc = ''
 gs 'snk_room_bridge', 'enter', qa_room, menu_sex
 if snk_room_target ! qa_room or slave['qa_id'] ! 100 + qa_room: qa_failed = 1 & msg 'FAIL_PRIVATE_ENTER' & exit
 gs 'snk_room_bridge', 'guard', 'menu_form'
 if snk_room_target ! qa_room or menu_form ! menu_sex: qa_failed = 1 & msg 'FAIL_PRIVATE_MENU_CONTEXT' & exit
 slave['energy'] = -4
 gs 'snk_room_bridge', 'guard', 'menu_form'
 if snk_room_target ! qa_room or menu_form ! 1: qa_failed = 1 & msg 'FAIL_PRIVATE_MENU_TIRED' & exit
 slave['energy'] = -3
 menu_form = menu_sex
 gs 'snk_room_bridge', 'guard', 'menu_form'
 if snk_room_target ! qa_room or menu_form ! menu_sex: qa_failed = 1 & msg 'FAIL_PRIVATE_MENU_ENERGY_BOUNDARY' & exit
 gs 'snk_room_bridge', 'leave'
 if snk_room_target ! 0 or slave['qa_id'] ! 100 or slave_state ! qa_present * CONST_INT['slave_exist']: qa_failed = 1 & msg 'FAIL_PRIVATE_RESTORE' & exit
end
end
`;
if(source('slave_private_room1').includes('PRIVATE_ROOM_ORIGINAL_MENU_1_20261111')){
 for(let r=1;r<=4;r++){
  const b=source('slave_private_room'+r),at=b.indexOf('! JO9 MOD START PRIVATE_ROOM_ORIGINAL_MENU_'+r+'_20261111'),end=b.indexOf('! JO9 MOD END PRIVATE_ROOM_ORIGINAL_MENU_'+r+'_20261111');a(at>=0&&end>at);
  const block=b.slice(at,end),quoted="'"+block.replaceAll("'","''")+"'";
  start+=`$qa_button_block = ${quoted}\r\n`;
  start+=`for qa_state = 0 to 2 step 1:
 room${r}_state = CONST_INT['no_slave']
 if qa_state = 1: room${r}_state = CONST_INT['slave_faint']
 if qa_state = 2: room${r}_state = CONST_INT['slave_exist']
 for qa_energy = -5 to -3 step 1:
  room${r}['energy'] = qa_energy
  $text_display = ''
  dynamic $qa_button_block
  qa_click = 0
  if instr($text_display, 'href="EXEC: gs') > 0: qa_click = 1
  qa_expected = 0
  if qa_state = 2 and qa_energy > -4: qa_expected = 1
  if qa_click ! qa_expected: qa_failed = 1 & msg 'FAIL_PRIVATE_BUTTON_BOUNDARY' & exit
 end
end
`;
 }
}
start+="if qa_failed = 0: msg 'JO9_QA_PRIVATESEXMENU_guard_COMPLETE'\r\nexit";
put('Start',start);
for(let r=1;r<=4;r++)put('slave_private_room'+r,"qa_failed = 1\r\nmsg 'FAIL_PRIVATE_MENU_REJECTED'\r\nexit");
fs.mkdirSync(dir,{recursive:true});const bytes=c.serialize(d);qa.inspectWorld(bytes);fs.writeFileSync(dir+'/guard.qsp',bytes);
fs.copyFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(dir+'/plan.json',JSON.stringify([{name:'guard',file:dir+'/guard.qsp',marker:'JO9_QA_PRIVATESEXMENU_guard_COMPLETE',checkpoint:'Four room actors must remain bound when original menu16 guard is evaluated; exact original bridge and swap.'}],null,2));
console.log(JSON.stringify({inputSha256:c.hash(fs.readFileSync(input)),plan:dir+'/plan.json'}));
