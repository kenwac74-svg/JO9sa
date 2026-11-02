'use strict';
const fs=require('fs'),cp=require('child_process'),a=require('assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/cruel-mercy-rules-20261101-actions';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(W+'/modtools/text-workshop/scenes.cjs');
const source=process.argv[2]||'G:/Codex/tmp/cruel-mercy-rules-20261101/candidate.qsp',raw=fs.readFileSync(source),d=c.parse(raw),cr=s=>s.replace(/\r?\n/g,'\r\n');
const body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),set=(n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(cr(s),-5);};
function add(n,s){d.lines.splice(-1,0,c.shift(n,-5),'',c.shift(cr(s),-5),c.shift('0',-5));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.locations=c.parse(c.serialize(d)).locations;}
// Copy the actual approved branch bytes; never replace the ledger or guard with a test double.
const events=[61121,61132,61134,61135,11544,11545,115441,115451,8994,8995,8996,8998];
const b=body('interaction_city').replace(/\r\n/g,'\n'),analysis=sc.analyse('interaction_city',b);
const sourceBranches=[];for(const id of events){const s=analysis.scenes.find(s=>s.predicate?.value===String(id));a(s,'event '+id);const text=b.slice(s.start,s.end);a(new RegExp('^if interaction_city = '+id+':','i').test(text));sourceBranches.push({id,text});}
add('qa_cm_actions',sourceBranches.map(s=>s.text+'\nEND').join('\n\n'));
// Preserve general clear/swap/evaluation/acquisition functions. No scene or sexual image is rendered.
set('hard_return',"qa_cm_hard_returns += 1\ngt $qa_cm_next");
set('choice_screen',"if $no = '': msg 'FAIL_CM_ACTION_CANCEL_ABSENT' & exit\ndynamic $no");
set('shop_general','gt $qa_cm_next');
const arr=[],cases=[];let assertions=0;
const emit=(...x)=>arr.push(...x),check=(cond,label)=>{assertions++;emit(`if ${cond}: msg 'FAIL_CM_ACTION_${assertions}_${label}' & exit`);};
const score=units=>check(`2 * jo9_cruel_mercy + jo9_cruel_mercy_half ! ${units}`,'score');
const run=id=>emit('interaction_city = '+id,"gs 'qa_cm_actions'");
function reset(){emit("killvar 'slave'","killvar '$slave'","killvar 'stock'","killvar '$stock'","slave_state = CONST_INT['no_slave']","stock_state = CONST_INT['slave_exist']","stock_type = 1001","stock['age'] = CONST_INT['mature_age']","stock['weight'] = 3","stock['stamina'] = 3","stock['strength'] = 3","stock['fertility'] = 1","$stock['name'] = 'QA Adult'","$stock['fullimage'] = 'girls/full/1001'","hunting_prize = 1","safari.slave = -1","jo9_cruel_mercy = 0","jo9_cruel_mercy_half = 0","sparks = 1000","meat_price = 37","mince_gain = 3","meat_gain = 2","virgin_meat_gain = 1","fridge = 1000","kitchen = 1","fridge_mince = 0","fridge_meat = 0","fridge_virgin = 0","decade_mince = 0","decade_meat = 0","decade_virgin = 0","farid_potential_debt = 0","get_girl = 0","cheat_h = 0","cheat_j = 0","cheat_k = 0","cheat_l = 0","$return_lock = 'qa_cm_actions'","$text[1] = ''","$special_action[1] = ''");}
emit('killall','usehtml = 0',"gs 'refresh_database'","gs 'init_game'","$onnewloc = ''","$counter = ''",'settimer 0','sound_on = 0',"gs '#static_base'","gs '#dynamic'","gs '#options'");
for(const [id,delta] of [[61121,-1],[61132,1],[61134,-2],[61135,-2],[8994,2],[8995,0],[8996,-2],[8998,1]]){
 reset();cases.push({id,deltaHalf:delta});
 if([8994,8995,8996,8998].includes(id))emit('hunting_prize = 0','qa_cm_hard_returns = 0');
 // Avoid narrative rendering; the actual nonterminal handler executes its numeric effects only.
 if(id===61121)emit('master_energy = 5','master_excitement = 100',"stock['vaginal'] = 2","stock['anal'] = 2");
 if(id===8998)emit("stock['fullimage'] = ''");
 run(id);score(delta);
 if(id===61132||id===8998)check("slave_state ! CONST_INT['slave_exist']",'acquired');
 if(id===61121)check('hunting_prize ! 2','nonterminal_transition');
 emit('qa_cash = sparks','qa_mince = decade_mince','qa_meat = decade_meat','qa_virgin = decade_virgin');
 run(id);score(delta);check('sparks ! qa_cash','repeat_cash');check('decade_mince ! qa_mince or decade_meat ! qa_meat or decade_virgin ! qa_virgin','repeat_production');
 if(id===8998)check('qa_cm_hard_returns ! 1','handoff_return');
}
// Cancellation of confirmation pages and stale confirmations must not settle twice.
for(const id of [11544,11545]){reset();emit("slave_state = CONST_INT['slave_exist']","slave['age'] = CONST_INT['mature_age']");run(id);score(0);check('sparks ! 1000','confirmation_only');cases.push({id,confirmation:true});}
for(const id of [115441,115451]){
 reset();emit("slave_state = CONST_INT['slave_exist']","slave['weight'] = 3","slave['stamina'] = 3","slave['age'] = CONST_INT['mature_age']");run(id);score(-2);check("slave_state ! CONST_INT['no_slave']",'removed');emit('qa_cash = sparks','qa_mince = decade_mince','qa_meat = decade_meat','qa_virgin = decade_virgin');run(id);score(-2);check('sparks ! qa_cash','stale_confirmation_cash');check('decade_mince ! qa_mince or decade_meat ! qa_meat or decade_virgin ! qa_virgin','stale_confirmation_production');cases.push({id,deltaHalf:-2});
}
// Negative -> positive half crossing on two fresh, independently captured subjects.
reset();emit('jo9_cruel_mercy = 0','jo9_cruel_mercy_half = -1');run(8994);score(1);emit('safari.slave = -1');run(8996);score(-1);cases.push({name:'fresh_capture_chain',scoreUnits:[1,-1]});
// No operation for invalid pending stock/current person/funds or unavailable safari captive.
for(const id of [61121,61132,61134,61135]){reset();emit("stock_state = CONST_INT['no_slave']");run(id);score(0);check('sparks ! 1000 or decade_mince ! 0','no_subject');cases.push({id,invalid:'no-stock'});}
for(const id of [8994,8995,8996,8998]){reset();emit('safari.slave = 0');run(id);score(0);check('sparks ! 1000','no_captive');cases.push({id,invalid:'no-safari-prize'});}
reset();emit("slave_state = CONST_INT['slave_exist']");run(61132);score(0);check("stock_state ! CONST_INT['slave_exist']",'occupied_take');
reset();emit("slave_state = CONST_INT['slave_exist']");run(8998);score(0);check('safari.slave ! -1','occupied_safari');
reset();emit("slave_state = CONST_INT['slave_exist']",'sparks = 4');run(115451);score(0);check("sparks ! 4 or slave_state ! CONST_INT['slave_exist']",'insufficient_confirmed_processing');
const marker='JO9_QA_CM20261101_actions_COMPLETE';emit("msg '"+marker+"'");
// GT intentionally abandons the caller. Continue at the same assertion stage from real destinations.
let start=0,stage=0;for(let i=0;i<arr.length;i++)if(arr[i]==="gs 'qa_cm_actions'"){
 const next='qa_cm_stage_'+(stage+1),chunk=arr.slice(start,i);chunk.push("$qa_cm_next = '"+next+"'",arr[i],"gt '"+next+"'");add('qa_cm_stage_'+stage,chunk.join('\n'));start=i+1;stage++;
}
add('qa_cm_stage_'+stage,arr.slice(start).join('\n'));set('Start',"gt 'qa_cm_stage_0'");
fs.mkdirSync(T,{recursive:true});for(const n of ['content','css','fonts','json'])if(!fs.existsSync(T+'/'+n))fs.symlinkSync(fs.realpathSync(W+'/'+n),T+'/'+n,'junction');fs.copyFileSync(W+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const bytes=c.serialize(d);qa.inspectWorld(bytes);fs.writeFileSync(T+'/actions.qsp',bytes);fs.writeFileSync(T+'/plan.json',JSON.stringify([{name:'actions',file:T+'/actions.qsp',marker,checkpoint:'Actual approved city handler branches, success-only ledger, stale repeats, confirmation-only, same-template fresh capture, resources and transfer boundaries'}],null,2));
const setup={source:c.hash(raw),diagnostic:c.hash(bytes),cases,assertions,sourceBranches:sourceBranches.map(s=>({id:s.id,hash:c.hash(Buffer.from(cr(s.text),'utf8'))})),limits:['Calls the actual branch code copied byte-for-byte into an isolated dispatcher. The shared gameplay dependencies are preserved except hard_return, which records the destination instead of displaying the normal menu.','No player save or production file is written; scene rendering is suppressed.']};
fs.writeFileSync(__dirname+'/native-actions-setup.json',JSON.stringify(setup,null,2)+'\n');
if(process.argv.includes('--prepare-only')){console.log(JSON.stringify({prepared:true,assertions,caseCount:cases.length}));process.exit(0);}
const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/qa/run-client-smoke.ps1','-Engine',W+'/engine/jack.exe','-Plan',T+'/plan.json','-TimeoutSeconds','30'],{windowsHide:true,encoding:'utf8',timeout:45000});
fs.writeFileSync(T+'/runner.log',(r.stdout||'')+(r.stderr||''));const client=JSON.parse(fs.readFileSync(T+'/client-results.json','utf8').replace(/^\uFEFF/,''));const report={...setup,pass:r.status===0&&client.every(x=>x.pass),client};fs.writeFileSync(__dirname+'/native-actions-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,assertions,caseCount:cases.length,client}));if(!report.pass)process.exitCode=1;
