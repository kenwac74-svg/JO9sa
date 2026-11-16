'use strict';
const fs=require('fs'),a=require('assert/strict'),R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/barn-eggs-20261115',D=R+'/records/barn-eggs-20261115';
const c=require(R+'/tools/text-workshop/core.cjs'),raw=fs.readFileSync(process.argv[3]||W+'/jack.qsp'),d=c.parse(raw),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
const body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
const next=body('next_day'),dynamic=body('#dynamic');
const eggCode=next.slice(next.indexOf('\t!calculate egg amount',next.indexOf('!harpy egglaying')),next.indexOf("\tif harpy_state = CONST_INT['slave_faint'] and farmhand_state"));a(eggCode.includes('decade_eggs += barn_harpy_eggs'));a(eggCode.includes('barn_egg_profit += barn_harpy_eggs'));
const fridgeCode=dynamic.slice(dynamic.indexOf('$get_fridge_space = {')).split('\r\n}\r\n')[0]+'\r\n}';
const settlement=body('jo9_ledger_end').split('!Refresh all databases')[0];
const stage=process.argv[2]||'eggs',milk=stage==='eggs'?0:10;
let start="killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\nCONST_INT['no_slave']=0\nCONST_INT['slave_exist']=1\nCONST_INT['slave_faint']=2\nqa_checks=0\nqa_failed=0\n"+fridgeCode+'\n';
const check=(expr,want,tag)=>{start+=`qa_checks+=1\nif ${expr}!${typeof want==='string'?q(want):want}:\nqa_failed+=1\n$qa_errors[]=${q(tag||expr)}\nend\n`;};
for(const [index,rehab,fridgeFill]of [[0,0,0],[1,0,50],[2,2,0]]){
 start+=`killvar 'fridge'\nkillvar '$produce_msg'\n$estate='qa'\nestate_size['qa']=50\nfridge['grain']=${fridgeFill}\nharpy_state=1\nharpy_type=1500\nharpy['rehabilitation']=${rehab}\nharpy['age']=2\nharpy['stamina']=3\nharpy['fat']=2\nfarmhand_state=1\nfarmhand['homosexualism']=0\ndecade_eggs=0\nbarn_egg_profit=0\ndecade_consume=0\nsparks=1000\n`;
 for(let day=1;day<=10;day++){start+=`day=${day}\ndynamic $get_fridge_space\n${eggCode}\n`;check("barn_egg_profit+fridge['eggs']",'__unused__','placeholder');start=start.replace("qa_checks+=1\nif barn_egg_profit+fridge['eggs']!'__unused__':\nqa_failed+=1\n$qa_errors[]='placeholder'\nend\n","qa_checks+=1\nif barn_egg_profit+fridge['eggs']!decade_eggs:qa_failed+=1\n");}
 start+=`qa_produced[${index}]=decade_eggs\nqa_sold[${index}]=barn_egg_profit\nqa_stored[${index}]=fridge['eggs']\nqa_savedfood[${index}]=decade_consume\nowner=1\nmaster_wealth_target=0\nmaster_cha=0\ntotal_food_cost=0\nautobuy_cost=0\nbarn_cow_food=0\nbarn_harpy_food=0\nbarn_pig_food=0\nbarn_pig_profit=0\ndecade_milk=${milk}\ndecade_cream=0\ngs 'billing'\n`;
 if(rehab===0){check("instr($produce_msg,'달걀:')>0",1,'egg report exists');start+=`qa_checks+=1\nif instr($produce_msg,str(qa_produced[${index}]))=0:qa_failed+=1\n`;}
 else{check('barn_total_profit',0,'rehab no income');check('qa_produced[2]',0,'rehab no eggs');}
 if(milk>0)check("instr($produce_msg,'우유:')>0",1,'milk report exists');
 start+=`qa_expected_balance=1000+qa_sold[${index}]+qa_savedfood[${index}]\n${settlement}\nqa_checks+=1\nif sparks!qa_expected_balance:qa_failed+=1\nqa_balance[${index}]=sparks\n`;
 check('decade_eggs',0,'report resets after use');check('barn_egg_profit',0,'income resets after capture');
}
start+=`savegame 'qa.sav'\nif qa_failed>0:msg 'FAIL eggs '+str(qa_failed)+' '+$qa_errors[0] & exit\nmsg 'JO9_QA_EGGS_${stage}_COMPLETE'\nexit`;
let billingBody=body('billing');
if(stage==='fixed'){
 a.equal(billingBody.split('$produce_msg = +=').length,2);
 billingBody=billingBody.replace('$produce_msg = +=','$produce_msg +=');
}
const locs=[['Start',start],['billing',billingBody]],lines=['QSPGAME','','',c.shift(String(locs.length),-5)];for(const[n,b]of locs)lines.push(c.shift(n,-5),'',c.shift(nl(b),-5),c.shift('0',-5));lines.push('');
fs.mkdirSync(T+'/'+stage,{recursive:true});fs.mkdirSync(D,{recursive:true});fs.writeFileSync(T+'/'+stage+'/test.qsp',c.serialize({lines}));fs.copyFileSync(W+'/config.xml',T+'/'+stage+'/config.xml');fs.writeFileSync(T+'/'+stage+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(T+'/'+stage+'/plan.json',JSON.stringify([{name:'egg-settlement',file:T+'/'+stage+'/test.qsp',marker:'JO9_QA_EGGS_'+stage+'_COMPLETE',checkpoint:'Actual 10-day egg generation/storage/sales, full billing report and settlement arithmetic'}],null,2));if(require('path').resolve(__filename)!==require('path').resolve(D+'/probe.cjs'))fs.copyFileSync(__filename,D+'/probe.cjs');console.log(JSON.stringify({stage,sourceHash:c.hash(raw),assertions:(start.match(/qa_checks\+=1/g)||[]).length}));
