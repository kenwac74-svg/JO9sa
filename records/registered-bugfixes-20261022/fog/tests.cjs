'use strict';
// Diagnostic QSP copies only. Original game, saves and settings are never written.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {inspectWorld}=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const root=__dirname;
const source=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const label=process.argv[3]||'baseline';
if(!/^[a-z-]+$/.test(label))throw Error('Invalid label');
const raw=fs.readFileSync(source),sourceHash=core.hash(raw);
const dir=path.join(root,'native-'+label);fs.mkdirSync(dir,{recursive:true});
const q=s=>"'"+s.replaceAll("'","''")+"'";
const cr=lines=>lines.join('\r\n');
const common=["killall","gs '#static_base'","gs '#dynamic'","autosave=0","decadesave=0","sound_on=0","day=3","slave_state=CONST_INT['slave_exist']","assistant_state=CONST_INT['slave_exist']","slave['stamina']=3","assistant['stamina']=3","slave['energy']=5","assistant['energy']=5","master_energy=5","master_half_action=0","slave['half_action']=0","assistant['half_action']=0","slave['calories']=100","assistant['calories']=100","здоровье_игрока=50","выносливость_игрока=75","дух_игрока=50","$итог_боя='победа'","cheat_fight_dif=1","cheat_inf_en=0"];
function check(cond,id){return [`if ${cond}:`,"else",` msg 'JO9_QA_ASSERTION_FAILED_${id}'`," exit","end"];}
const cases=[];
for(const [actor,role] of [[1,'slave'],[2,'assistant']])cases.push({name:'cost-'+role,checkpoint:'jo9_fog_relay settle full stamina',code:cr([...common,"jo9_fog['active']=1",`jo9_fog['actor']=${actor}`,`combatant=${actor}`,"gs 'jo9_fog_relay','finish'",...check(`${role}['energy']=4 and master_energy=5`,'FULL_'+role.toUpperCase())])});
if(label!=='baseline'){
 const mapped=v=>v>=75?5:v>=65?4:v>=55?3:v>=45?2:v>=35?1:v>=25?0:v>=20?-1:v>=15?-2:v>=10?-3:-4;
 for(const [actor,role,other] of [[1,'slave','assistant'],[2,'assistant','slave']]){
  const code=[...common];let n=0;
  for(let energy=1;energy<=5;energy++)for(const stamina of [1,9,10,14,15,19,20,24,25,34,35,44,45,54,55,64,65,74,75,100]){
   n++;code.push("killvar 'jo9_fog'","jo9_fog['active']=1",`jo9_fog['actor']=${actor}`,`combatant=${actor}`,`${role}['energy']=${energy}`,`выносливость_игрока=${stamina}`,"gs 'jo9_fog_relay','finish'",...check(`${role}['energy']=${Math.min(mapped(stamina),energy-1)} and ${other}['energy']=5 and master_energy=5`,'MATRIX_'+role.toUpperCase()+'_'+n),"gs 'jo9_fog_relay','finish'","gs 'jo9_fog_relay','settle'",...check(`${role}['energy']=${Math.min(mapped(stamina),energy-1)} and ${role}['half_action']=0 and ${role}['calories']=100`,'REPEAT_'+role.toUpperCase()+'_'+n));
  }
  cases.push({name:'matrix-'+role,checkpoint:'100 stamina/energy combinations and repeated finish/settle',assertionCount:200,code:cr(code)});
  cases.push({name:'exit-'+role,checkpoint:'actual exit combatant>0 through close',code:cr([...common,"jo9_fog['active']=1",`jo9_fog['actor']=${actor}`,`combatant=${actor}`,"$враг[1]='JO9_QA_DUMMY'","gt 'выход_из_боя'"]),instrument(d){const l=d.locations.find(x=>x.name==='выход_из_боя');let b=core.shift(d.lines[l.body],5);const anchor="gs 'jo9_fog_relay', 'close'";if(b.split(anchor).length!==2)throw Error('Close anchor mismatch');b=b.replace(anchor,anchor+'\r\n'+cr([...check(`${role}['energy']=4 and ${other}['energy']=5 and master_energy=5 and combatant=0 and jo9_fog['active']=0`,'EXIT_'+role.toUpperCase()),'@COMPLETE@','exit']));d.lines[l.body]=core.shift(b,-5);}});
  cases.push({name:'cancel-'+role,checkpoint:'begin -> original weapon-selection entry -> reset before combat',code:cr([...common,"$place='edge_patrol'",`gs 'jo9_fog_relay','begin',${actor}`]),instrument(d){const l=d.locations.find(x=>x.name==='interaction_city');d.lines[l.body]=core.shift(cr([...check("get_weapon=1 and jo9_fog['settled']=0 and slave['energy']=5 and assistant['energy']=5 and master_energy=5",'WEAPON_UNCHARGED_'+role.toUpperCase()),"gs '$combat_variable_reset'",...check("jo9_fog['active']=0 and slave['energy']=5 and assistant['energy']=5 and master_energy=5",'CANCEL_'+role.toUpperCase()),'@COMPLETE@']),-5);}});
  cases.push({name:'handoff-'+role,checkpoint:'actual handoff settles once and preserves enemies for master',code:cr([...common,"jo9_fog['active']=1",`jo9_fog['actor']=${actor}`,`combatant=${actor}`,"jo9_fog['moral_penalty']=10","jo9_fog['mood_penalty']=10","дух_игрока=0","здоровье_врага[1]=17","выносливость_врага[1]=23","дух_врага[1]=31","слабость[1]=7","$итог_боя='бегство'","gs 'jo9_fog_relay','handoff'"]),instrument(d){const l=d.locations.find(x=>x.name==='interaction_city');d.lines[l.body]=core.shift(cr(["gs 'jo9_fog_relay','finish'","gs 'jo9_fog_relay','settle'",...check(`${role}['energy']=4 and ${other}['energy']=5 and master_energy=5 and jo9_fog['settled']=1 and jo9_fog['switched']=1 and combatant=0 and jo9_fog['resuming']=1`,'HANDOFF_'+role.toUpperCase()),...check("здоровье_врага[1]=17 and выносливость_врага[1]=23 and дух_врага[1]=31 and слабость[1]=7",'ENEMY_'+role.toUpperCase()),'@COMPLETE@']),-5);}});
 }

 for(const [actor,role,other] of [[1,'slave','assistant'],[2,'assistant','slave']]){
  cases.push({name:'exhaust-'+role,checkpoint:'zero stamina retains original injury and fatigue result',code:cr([...common,"jo9_fog['active']=1",`jo9_fog['actor']=${actor}`, `combatant=${actor}`,"jo9_fog['wounds_penalty']=80","выносливость_игрока=0","$итог_боя='вырубился'","gs 'jo9_fog_relay','finish'",...check(`${role}['energy']=-4 and ${role}_rate['wounds']=80 and ${role}['neg_slave_wounded']=1 and ${other}['energy']=5 and master_energy=5`,'EXHAUST_'+role.toUpperCase())])});
  cases.push({name:'snapshot-'+role,checkpoint:'victory spirit snapshot avoids false morale loss',code:cr([...common,"jo9_fog['active']=1",`jo9_fog['actor']=${actor}`, `combatant=${actor}`,"jo9_fog['victory_snapshot']=1","jo9_fog['spirit_before_victory']=50","дух_игрока=0",`${role}['moral']=3`, `${role}_rate['moral']=0`,"gs 'jo9_fog_relay','finish'",...check(`${role}['energy']=4 and ${role}['moral']=3 and ${role}_rate['moral']=0 and дух_игрока=50 and master_energy=5`,'SNAPSHOT_'+role.toUpperCase())])});
  cases.push({name:'death-'+role,checkpoint:'original death branch clears only the actor',code:cr([...common,"jo9_fog['active']=1",`jo9_fog['actor']=${actor}`, `combatant=${actor}`,"здоровье_игрока=0","$итог_боя='убит'","gs 'jo9_fog_relay','finish'",...check(`${role}_state=CONST_INT['no_slave'] and ${other}['energy']=5 and master_energy=5`,'DEATH_'+role.toUpperCase())])});
 }
 cases.push({name:'guard-solo',checkpoint:'inactive finish and settled state do not charge',code:cr([...common,"combatant=0","gs 'jo9_fog_relay','finish'","gs 'jo9_fog_relay','settle'",...check("slave['energy']=5 and assistant['energy']=5 and master_energy=5",'INACTIVE'),"jo9_fog['active']=1","jo9_fog['actor']=2","jo9_fog['settled']=1","combatant=2","gs 'jo9_fog_relay','finish'",...check("slave['energy']=5 and assistant['energy']=5 and master_energy=5",'ALREADY_SETTLED')])});
 cases.push({name:'solo-exit',checkpoint:'actual solo exit retains original master energy cap',code:cr([...common,"combatant=0","макс_здоровье_игрока=50","макс_выносливость_игрока=75","норм_дух_игрока=50","$враг[1]='JO9_QA_DUMMY'","gt 'выход_из_боя'"]),instrument(d){const l=d.locations.find(x=>x.name==='выход_из_боя');let b=core.shift(d.lines[l.body],5);b=b.replace("gs 'jo9_fog_relay', 'close'","gs 'jo9_fog_relay', 'close'\r\n"+cr([...check("master_energy=1 and master_half_action=-1 and slave['energy']=5 and assistant['energy']=5",'SOLO_EXIT'),'@COMPLETE@','exit']));d.lines[l.body]=core.shift(b,-5);}});
}
const plan=[];
for(const test of cases){
 const d=core.parse(raw),loc=n=>{const l=d.locations.find(x=>x.name===n);if(!l)throw Error('Missing '+n);return l;};
 const marker='JO9_QA_FOGENERGY_'+test.name.replaceAll('-','_')+'_COMPLETE';
 const complete='msg '+q(marker);
 d.lines[loc('Start').body]=core.shift(test.code+'\r\n'+(test.instrument?'':complete),-5);
 if(test.instrument)test.instrument(d);
 // Preserve real settlement/calculation logic. Only expected modal presentation is changed in diagnostic copies so checks can continue.
 const fog=loc('jo9_fog_relay');let fb=core.shift(d.lines[fog.body],5);fb=fb.split('\r\n').map(line=>/^\s*msg /.test(line)?line.replace('msg ','*pl '):line).join('\r\n');d.lines[fog.body]=core.shift(fb,-5);
 for(const l of d.locations){const b=core.shift(d.lines[l.body],5);if(b.includes('@COMPLETE@'))d.lines[l.body]=core.shift(b.replaceAll('@COMPLETE@',complete),-5);}
 const file=path.join(dir,test.name+'.qsp');fs.writeFileSync(file,core.serialize(d));plan.push({name:test.name,marker,checkpoint:test.checkpoint,file});
}
const planFile=path.join(dir,'plan.json');fs.writeFileSync(planFile,JSON.stringify(plan,null,2));
const engine='G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe';
const proc=spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine',engine,'-Plan',planFile],{encoding:'utf8',windowsHide:true,timeout:120000,maxBuffer:2*1024*1024});
fs.writeFileSync(path.join(dir,'runner.log'),(proc.stdout||'')+(proc.stderr||''));
let results=[];const rf=path.join(dir,'client-results.json');if(fs.existsSync(rf))results=JSON.parse(fs.readFileSync(rf,'utf8').replace(/^\ufeff/,''));
const report={source,sourceHash,sourceHashAfter:core.hash(fs.readFileSync(source)),label,engine,runnerStatus:proc.status,structure:inspectWorld(raw),results,limits:['No GUI selection or rendered combat UI check.','Core/entry/exit/handoff logic is real source; expected helper messages use *pl instead of msg in disposable diagnostics.','Begin/cancel/handoff cases intercept interaction_city at the weapon-screen boundary; exit cases stop immediately after the original close call.','Combat damage/balance/loot generation and save UI loading are outside this component test.']};
for(const r of results){const stderr=fs.readFileSync(path.join(dir,r.name+'-stderr.log'),'utf8');r.assertions=stderr.match(/JO9_QA_ASSERTION_FAILED_[A-Z_0-9]+/g)||[];r.engineErrors=stderr.split(/\r?\n/).filter(s=>/error|ошибк/i.test(s));r.assertionCount=cases.find(t=>t.name===r.name).assertionCount||1;}
fs.writeFileSync(path.join(root,'results-'+label+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));process.exitCode=results.length===cases.length&&results.every(x=>x.pass)&&report.sourceHash===report.sourceHashAfter?0:1;
