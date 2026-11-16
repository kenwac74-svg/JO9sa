'use strict';
// Read-only financial probes. Scene/UI refresh and clearing an occupant are excluded.
const fs=require('fs'),a=require('assert/strict'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/hard-visibility-20261115/barn';
const c=require(R+'/tools/text-workshop/core.cjs'),raw=fs.readFileSync(W+'/jack.qsp'),d=c.parse(raw),nl=s=>s.replace(/\r?\n/g,'\r\n');
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const dynamicBody=body('#dynamic'),next=body('next_day'),billing=body('billing');
const ev=dynamicBody.slice(dynamicBody.indexOf('$dyn_meat_evaluation = {')).split('\r\n}\r\n')[0]+'\r\n}';
a(ev.startsWith('$dyn_meat_evaluation = {'));
const slaughter=next.slice(next.indexOf('!pig slaughter'),next.indexOf('if barn_farmhand_prison = 1'));
a(slaughter.includes('barn_pig_profit +='));
const bill=billing.slice(billing.indexOf('!barn_report_cow_profit'),billing.indexOf('$bill_message ='));
const settle=body('jo9_ledger_end').split('!Refresh all databases')[0];
let start="killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\nCONST_INT['no_slave']=0\nCONST_INT['slave_exist']=1\nCONST_INT['loli_age']=1\nCONST_INT['young_age']=0\nqa_failed=0\nqa_checks=0\n"+ev+"\n$clear_slave_instance={pig_state=0}\n";
for(const charge of [0,100]){
 start+=`sparks=1000\npig_state=1\nfarmhand_state=1\nbarn_farmhand_slaughters=1\npig['age']=2\npig['fat']=4\npig['stamina']=3\npig['boobs']=0\npig['virginity']=1\n$estate='qa'\nestate_size['qa']=0\nfridge_space=0\nkillvar 'fridge'\nbarn_pig_profit=0\nbarn_egg_profit=0\ndecade_consume=0\nbarn_cow_food=0\nbarn_harpy_food=0\nbarn_pig_food=0\n${slaughter}\n`;
 for(const[expr,want]of [['barn_pig_profit',24],['sparks',1000]])start+=`qa_checks+=1\nif ${expr}!${want}:qa_failed+=1\n`;
 start+=bill+`\nfinal_payment=${charge}\n${settle}\nqa_checks+=1\nif sparks!${1024-charge}:qa_failed+=1\n`;
}
start+="savegame 'qa.sav'\nif qa_failed>0:msg 'FAIL barn money '+str(qa_failed) & exit\nmsg 'JO9_QA_BARN_money_COMPLETE'\nexit";
const lines=['QSPGAME','','',c.shift('1',-5),c.shift('Start',-5),'',c.shift(nl(start),-5),c.shift('0',-5),''];
fs.mkdirSync(T,{recursive:true});fs.copyFileSync(W+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(T+'/test.qsp',c.serialize({lines}));
fs.writeFileSync(T+'/plan.json',JSON.stringify([{name:'barn-money',file:T+'/test.qsp',marker:'JO9_QA_BARN_money_COMPLETE',checkpoint:'Actual slaughter evaluation, surplus profit, billing sum, ledger payment; UI and occupant clear stubbed'}],null,2));
console.log('Barn financial fixture prepared: actual surplus and settlement code; no WORK write');
