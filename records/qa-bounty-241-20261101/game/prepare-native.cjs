'use strict';
// Read-only production input. This program PREPARES a diagnostic; it never launches an engine.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const raw=fs.readFileSync(source),doc=core.parse(raw),out=__dirname,tmp='G:/Codex/tmp/qa-bounty-241-game-20261101';
const expectedHash='78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d';
assert.equal(doc.hash,expectedHash,'Review the changed live input before preparing another diagnostic.');
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
const body=n=>core.shift(doc.lines[doc.locations.find(x=>x.name===n).body],5);
const sourceHashes={};for(const n of ['jo9_battle_fate','jo9_cruel_mercy_apply'])sourceHashes[n]=core.hash(Buffer.from(body(n),'utf8'));
const lines=['killall','usehtml=0',"$onnewloc=''","$counter=''",'settimer 0','sound_on=0'];
let assertions=0;const cases=[];
function emit(...s){lines.push(...s);}
function check(condition,label){assertions++;emit('if '+condition+': msg '+quote('FAIL_BOUNTY_GAME_'+assertions+'_'+label)+' & exit');}
// Scores are specified independently as exact half-units; the diagnostic executes the production helper.
for(let units=-23;units<=23;units++)for(const delta of [-6,-2,-1,0,1,2,6]){
 const whole=Math.trunc(units/2),half=units-2*whole,total=units+delta,afterWhole=Math.trunc(total/2),afterHalf=total-2*afterWhole;
 emit('jo9_cruel_mercy='+whole,'jo9_cruel_mercy_half='+half,'jo9_cm_total=917',"gs 'jo9_cruel_mercy_apply',"+delta);
 check('jo9_cruel_mercy!'+afterWhole+' or jo9_cruel_mercy_half!'+afterHalf,'math_'+units+'_'+delta);
 check('jo9_cm_total!917','local_restore');
 check('((jo9_cruel_mercy<=-5) and '+Number(total>-10)+') or ((jo9_cruel_mercy>=5) and '+Number(total<10)+')','no_early_threshold');
 cases.push({family:'arithmetic',initialHalfUnits:units,deltaHalfUnits:delta,expectedHalfUnits:total});
}
// Old saves lack the new remainder variable. KILLVAR simulates that engine state.
emit('jo9_cruel_mercy=5',"killvar 'jo9_cruel_mercy_half'","gs 'jo9_cruel_mercy_apply',-1");
check('jo9_cruel_mercy!4 or jo9_cruel_mercy_half!1','legacy_default');
const arena=['dimaher','hoplite','secutor','kimerian'].flatMap(p=>['a','b','c','d','e'].map(s=>p+'_'+s));
const practiceIds=[1,2,3,4,5,11,12,13,14,15,21,22,23,24,25,31,32,33,34,35];
const practiceMobs=['голая_рабыня','госпожа','шиноби','латница','амазонка'];
const rosters=[['черный_медик','подручный','подручный','подручный'],['паладин','пехотинец','пехотинец'],['goblin','goblin'],['goblin','goblin','goblin'],['ogre'],['козлорогий','свинорылый','жабован','крысолюд'],['канибал','калека','нищеброд','безумец','изможденный']];
function fate(cfg){
 const {family,enemy,place,returnTo,sourceMode,mode,cf=0,cause=1,choice=1,expectAccepted=true,delta=0,prePhase=1,result='победа'}=cfg;
 const n=enemy.length,id=cases.length;
 emit("killvar 'jo9_fate'","killvar 'jo9_fate_enemy'","killvar 'труп'","killvar 'в_отключке'","killvar '$трофей'",'тр=0','поверженные_враги=0','количество_врагов='+n,'текущий=1','combatant=1','arena_mode=1','colosseum_fight='+cf,'$place='+quote(place),'$fight_return='+quote(returnTo),'jo9_cruel_mercy=0','jo9_cruel_mercy_half=1');
 enemy.forEach((e,i)=>emit('$враг['+(i+1)+']='+quote(e),'враг['+(i+1)+']=1','здоровье_врага['+(i+1)+']=0','выносливость_врага['+(i+1)+']=17',"$действия_врага["+(i+1)+"]=''"));
 emit("gs 'jo9_battle_fate','init',"+quote(sourceMode));check("jo9_fate['mode']!"+mode,'mode_'+id);
 enemy.forEach((e,i)=>emit("gs 'jo9_battle_fate','stage',"+(i+1)+','+cause));
 emit("$итог_боя='победа'","gs 'jo9_battle_fate','result'","jo9_fate['phase']="+prePhase,'$итог_боя='+quote(result),"gs 'jo9_battle_fate','choose',"+choice);
 const total=1+delta,whole=Math.trunc(total/2),half=total-2*whole;
 check('jo9_cruel_mercy!'+whole+' or jo9_cruel_mercy_half!'+half,'decision_score_'+id);
 if(expectAccepted){
  check("jo9_fate['phase']!2 or jo9_fate['choice']!"+choice+" or jo9_fate['count']!0",'accepted_'+id);
  enemy.forEach((e,i)=>check((choice===1?'труп['+quote(e)+']<1':'в_отключке['+quote(e)+']<1')+' or здоровье_врага['+(i+1)+']'+(choice===1?'>0':'<1'),'target_'+id+'_'+i));
  emit('qa_trophy=тр',"gs 'jo9_battle_fate','choose',1","gs 'jo9_battle_fate','choose',2");
  check('тр!qa_trophy or jo9_cruel_mercy!'+whole+' or jo9_cruel_mercy_half!'+half,'repeat_decision_'+id);
 }else{
  check("jo9_fate['phase']!"+prePhase+' or тр!0','blocked_unchanged_'+id);
 }
 cases.push({...cfg,id});
}
for(const e of arena)for(const cause of [1,2,3,4])for(const choice of [1,2])fate({family:'formal-arena',enemy:[e],place:'colosseum_arena',returnTo:'Start',sourceMode:'arena',mode:2,cause,choice,delta:choice===1?-2:2});
for(const e of ['gladiatrix1','gladiatrix2','gladiatrix3'])for(const cause of [1,2,3,4])for(const choice of [1,2])fate({family:'catfight',enemy:[e],place:'catfightclub',returnTo:'Start1',sourceMode:'catfight',mode:2,cause,choice,delta:choice===1?-2:2});
for(const cf of practiceIds)for(const cause of [1,2,3,4])for(const choice of [1,2])fate({family:'practice',enemy:[practiceMobs[(cf%10)-1]],place:'colosseum',returnTo:'',sourceMode:'normal',mode:2,cf,cause,choice,expectAccepted:choice===2});
for(const enemy of rosters)for(const cause of [1,2,3,4])for(const choice of [1,2])fate({family:'fog',enemy,place:'edge_patrol',returnTo:'',sourceMode:'normal',mode:1,cause,choice,expectAccepted:choice===1});
for(const choice of [-1,0,3,99])fate({family:'invalid-input',enemy:['gladiatrix1'],place:'catfightclub',returnTo:'Start1',sourceMode:'catfight',mode:2,choice,expectAccepted:false});
for(const prePhase of [0,2,3])fate({family:'invalid-phase',enemy:['gladiatrix1'],place:'catfightclub',returnTo:'Start1',sourceMode:'catfight',mode:2,prePhase,expectAccepted:false});
for(const result of ['бегство','вырубился','убит'])fate({family:'non-victory',enemy:['gladiatrix1'],place:'catfightclub',returnTo:'Start1',sourceMode:'catfight',mode:2,result,expectAccepted:false});
const marker='JO9_QA_BOUNTY_game_COMPLETE';emit('msg '+quote(marker));
const start=doc.locations.find(x=>x.name==='Start');doc.lines[start.body]=core.shift(lines.join('\r\n'),-5);
const bytes=core.serialize(doc);assert.equal(core.parse(bytes).locations.length,doc.locations.length);
for(const n in sourceHashes)assert.equal(core.hash(Buffer.from(body(n),'utf8')),sourceHashes[n],'production function changed by diagnostic preparation');
fs.mkdirSync(tmp,{recursive:true});fs.writeFileSync(path.join(tmp,'native-game.qsp'),bytes);
const plan=JSON.stringify([{name:'bounty-game',file:path.join(tmp,'native-game.qsp'),marker,checkpoint:'Independent fresh source, actual production fate/helper functions, exact half-units, eligible roster/cause/choice and stale callbacks'}],null,2);
fs.writeFileSync(path.join(out,'native-plan.json'),plan);fs.writeFileSync(path.join(tmp,'native-plan.json'),plan);
const report={preparedOnly:true,source,sourceHash:core.hash(raw),diagnosticHash:core.hash(bytes),sourceHashes,cases:cases.length,assertions,families:Object.fromEntries([...new Set(cases.map(x=>x.family))].map(f=>[f,cases.filter(x=>x.family===f).length])),limits:['No engine launched by this script. Root must run the G:/Codex/tmp native-plan.json serially.','Synthetic isolated state; no private SAV reads or writes.','This tests real decision/helper code but not complete turn processing or reward return UI.'],engineCommand:['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine','G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe','-Plan',path.join(tmp,'native-plan.json'),'-TimeoutSeconds','60']};
fs.writeFileSync(path.join(out,'native-prepared.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(out,'native-cases.json'),JSON.stringify(cases,null,2));
assert.equal(core.hash(fs.readFileSync(source)),expectedHash);
console.log(JSON.stringify(report));
