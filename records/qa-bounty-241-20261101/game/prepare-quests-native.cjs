'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const input='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(input),d=c.parse(raw);
assert.equal(d.hash,'78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d');
const q=s=>"'"+s.replaceAll("'","''")+"'",out=__dirname,tmp='G:/Codex/tmp/qa-bounty-241-game-20261101';
const roles=['slave','assistant','prisoner','farmhand','cow','harpy','pig','room1','room2','room3','room4',...Array.from({length:18},(_,i)=>'iced_'+(i+1))];
// Expected changes come from the approved actor-bound quest list; unrelated quests must remain pending.
const rules=[
 {type:2572,name:'felicity',pending:{'felicity':1},changes:{'$quest12':'fail'}},
 {type:2584,name:'venera',changes:{"active['q14']":3,"jo9_lq_failed_quest['venera']":1}},
 {type:2585,name:'pelageya',changes:{"active['q15']":3,"jo9_lq_failed_quest['pelageya']":1}},
 {type:2610,name:'kotshey',changes:{"npc_progress['kotshey']":2,"npc_progress['kotshey_2nd']":2}},
 {type:2613,name:'shlyapkin',changes:{"jo9_lq_failed_quest['shlyapkin']":1}},
 {type:2616,name:'elsa',changes:{'lost_quest_slave':1,"active['akabur']":22}},
 {type:2617,name:'jasmine',changes:{'lost_quest_slave_jasmine':1,"active['akabur']":22}},
 {type:2619,name:'Tsyuansu',changes:{"npc_progress['Tsyuansu']":2}},
 {type:2620,name:'Hotorn_aliman',changes:{"npc_progress['Hotorn_aliman']":2}},
 {type:2579,name:'black_arhangel',changes:{"jo9_lq_failed_quest['black_arhangel']":1}},
 {type:2609,name:'azazel',changes:{"jo9_lq_failed_quest['azazel']":1}},
 {type:2580,name:'Ledy_Karina',changes:{"jo9_lq_failed_quest['Ledy_Karina']":1}}
];
const defaults={felicity:1,'$quest12':'pending',"active['q12']":1,"active['q14']":1,"active['q15']":1,"active['akabur']":11,"npc_progress['kotshey']":1,"npc_progress['kotshey_2nd']":0,"npc_progress['shlyapkin']":1,"npc_progress['elsa']":1,"npc_progress['jasmine']":1,"npc_progress['Tsyuansu']":1,"npc_progress['Hotorn_aliman']":1,"npc_progress['black_arhangel']":1,"npc_progress['azazel']":1,"npc_progress['Ledy_Karina']":1,lost_quest_slave:0,lost_quest_slave_jasmine:0};
for(const n of ['venera','pelageya','shlyapkin','black_arhangel','azazel','Ledy_Karina'])defaults["jo9_lq_failed_quest['"+n+"']"]=0;
const lines=['killall','usehtml=0',"$onnewloc=''","$counter=''",'settimer 0',"$quest[12]='q12'","$quest[14]='q14'","$quest[15]='q15'","$event['Akabur_quest']='akabur'"],cases=[];let assertions=0;
const value=v=>typeof v==='string'?q(v):String(v);
function check(cond,label){assertions++;lines.push('if '+cond+': msg '+q('FAIL_BOUNTY_QUEST_'+assertions+'_'+label)+' & exit');}
function test(role,rule,overrides={},expect=true){
 const initial={...defaults,...overrides},changes=expect?(rule.changes||{}):{},id=cases.length;
 lines.push("jo9_lq['active']=1",'sparks=12345','day=37',role+'_type='+rule.type);
 for(const [k,v] of Object.entries(initial))lines.push(k+'='+value(v));
 lines.push("gs 'jo9_liquidation_sale','fail_quests',"+q(role));
 for(const [k,v] of Object.entries(initial))check(k+'!'+value(k in changes?changes[k]:v),id+'_'+rule.name);
 check('sparks!12345 or day!37 or '+role+'_type!'+rule.type,'no_sale_mutation_'+id);
 // Repeated failure notification cannot convert a terminal marker to another outcome or pay twice.
 lines.push("gs 'jo9_liquidation_sale','fail_quests',"+q(role));
 for(const [k,v] of Object.entries(changes))check(k+'!'+value(v),'repeat_'+id);
 check('sparks!12345','repeat_money_'+id);
 cases.push({role,type:rule.type,name:rule.name,overrides,expectFailure:expect});
}
for(const role of roles)for(const rule of rules)test(role,rule);
for(const role of roles)test(role,{type:9999,name:'unrelated',changes:{}},{},false);
// Completed and phase-inapplicable Akabur quests must never be converted to failure.
for(const type of [2616,2617])for(const phase of [0,1,21,22])test('slave',rules.find(r=>r.type===type),{"active['akabur']":phase},false);
test('slave',rules.find(r=>r.type===2616),{"npc_progress['elsa']":3},false);
for(const phase of [2,10])test('slave',rules.find(r=>r.type===2617),{"active['akabur']":phase},false);
for(const rule of rules)test('slave',rule,{"jo9_lq['active']":0},false);
for(const [type,overrides] of [[2572,{"active['q12']":0}],[2584,{"active['q14']":2}],[2585,{"active['q15']":2}],[2610,{"npc_progress['kotshey']":2}],[2613,{"npc_progress['shlyapkin']":2}],[2619,{"npc_progress['Tsyuansu']":2}],[2620,{"npc_progress['Hotorn_aliman']":2}],[2579,{"npc_progress['black_arhangel']":2}],[2609,{"npc_progress['azazel']":2}],[2580,{"npc_progress['Ledy_Karina']":2}]])test('slave',rules.find(r=>r.type===type),overrides,false);
// Guild and generic delivery quests are absent from the actor-specific list and stay unchanged.
// This is deliberately a contract-level test; actual valuation/clearing/relocation requires integration tests.
const marker='JO9_QA_BOUNTY_quests_COMPLETE';lines.push('msg '+q(marker));
d.lines[d.locations.find(l=>l.name==='Start').body]=c.shift(lines.join('\r\n'),-5);
const bytes=c.serialize(d);c.parse(bytes);fs.mkdirSync(tmp,{recursive:true});fs.writeFileSync(path.join(tmp,'native-quests.qsp'),bytes);
const plan=JSON.stringify([{name:'bounty-quests',file:path.join(tmp,'native-quests.qsp'),marker,checkpoint:'Actual fail_quests with synthetic initialized dictionaries: all 29 roles, bound actor types, unrelated types, preserved terminal quest states and stale repeat'}],null,2);
fs.writeFileSync(path.join(out,'native-quests-plan.json'),plan);fs.writeFileSync(path.join(tmp,'native-quests-plan.json'),plan);
const report={preparedOnly:true,sourceHash:c.hash(raw),diagnosticHash:c.hash(bytes),cases:cases.length,assertions,roles:roles.length,actorTypes:rules.length,limits:['Preparation only, no engine process launched.','No private SAV or game resources loaded; synthetic actor type and quest dictionaries.','Contract-level failure marking only; actual liquidation sale and move flow is a separate integration gap.']};
fs.writeFileSync(path.join(out,'native-quests-prepared.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'native-quest-cases.json'),JSON.stringify(cases,null,2));
assert.equal(c.hash(fs.readFileSync(input)),d.hash);console.log(JSON.stringify(report));
