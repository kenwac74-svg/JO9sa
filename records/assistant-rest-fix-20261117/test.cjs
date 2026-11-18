'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');
const here=__dirname,source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(source),doc=c.parse(raw);
const body=n=>c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
const modPath=path.join(here,'patch.json'),candidate=process.argv.includes('--candidate');
let resultBody=body('interaction_result');
if(candidate){const mod=JSON.parse(fs.readFileSync(modPath,'utf8'));assert.equal(doc.hash,mod.before_sha256);for(const e of mod.edits){assert.equal(resultBody.split(e.old).length-1,e.count);resultBody=resultBody.replace(e.old,e.new);}}
const helper=body('#dynamic');
const variable=n=>helper.slice(helper.indexOf('$'+n+' = {'),helper.indexOf('\r\n}',helper.indexOf('$'+n+' = {'))+3);
const definitions=variable('assistant_energy_drop')+'\r\n'+variable('master_energy_drop');
let result="if qa_refuse=1: interaction_assistant['res']=-1\r\n$special_part += '\r\nqa_special_calls+=1'\r\n"+resultBody;
const bodies=new Map([['Start','exit'],['interaction',body('interaction')],['interaction_result',result],['jo9_origin_growth',body('jo9_origin_growth')],...['#var_base','#txt','#txt_2','jo9_traits','jo9_traits_personality'].map(n=>[n,'result=0']),['interaction_screen','exit'],['menu_form','exit']]);
const lines=['QSPGAME','','',c.shift(String(bodies.size),-5)];for(const[n,b]of bodies)lines.push(c.shift(n,-5),'',c.shift(b,-5),c.shift('0',-5));lines.push('');const fixture=Buffer.from(lines.join('\r\n'),'utf16le');
const savedLog=console.log;console.log=()=>{};
(async()=>{
const api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm'),errors=[],checks=[];
api.on('error',e=>errors.push(e));api.on('msg',(_t,done)=>done());for(const n of ['main_changed','stats_changed','actions_changed','objects_changed','timer','refresh','show_window','panel_visibility','close_file'])api.on(n,()=>{});
api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
const run=s=>{const start=errors.length;api.execCode(s.replace(/\r?\n/g,'\r\n'));assert.equal(errors.length,start,JSON.stringify(errors.slice(start)));};
const num=(n,k)=>Number(k===undefined?api.readVariable(n):api.readVariableByKey(n,k));
function reset(id,{cheat=0,refuse=0,cached=false,growth=false}={}){
run(`killall
${definitions}
CONST_INT['slave_exist']=1
CONST_INT['no_slave']=0
slave_state=1
assistant_state=1
slave_type=2583
assistant_type=1214
master_energy=5
sparks=1000
cheat_inf_en=${cheat}
qa_refuse=${refuse}
$do_for_each_slave_in_list='qa_noop=0'
$dyn_reward_potence='qa_noop=0'
$dyn_erotic_stimulation='qa_noop=0'
$slave_energy_drop={if cheat_inf_en=0: slave['energy']-=1}
slave['energy']=5
slave['sensitivity']=2
assistant['energy']=5
assistant['sensitivity']=2
assistant['ego']=3
assistant['temper']=3
assistant['pride']=3
assistant['moral']=2
assistant['rational']=3
assistant['instinct']=3
assistant['custom']=3
assistant['fear']=2
assistant['angst']=2
assistant['spoil']=2
assistant['arousal']=3
assistant['hygiene']=40
assistant_rate['hygiene']=40
${cached?"first_visit['interaction_result']=1\n$master_assistant_interaction_types[0]='assistant_rest'\n$master_slave_interaction_types[0]='rest'\n$dyn_interaction_result_extras='qa_noop=0'":''}
${growth?"assistant['jo9_bg_random']=1\n$assistant_family='mprincess'\nassistant['jo9_origin_frac_sensitivity']=80":''}
interaction=${id}
gs 'interaction'`);
}
function snapshot(){const fields=['sensitivity','ego','temper','moral','pride','fear','angst','spoil','arousal','hygiene'];return {calls:num('qa_special_calls'),masterAP:num('master_energy'),assistantAP:num('assistant','energy'),half:num('assistant','half_action'),sparks:num('sparks'),freeTime:num('free_time'),count:num('assistant_already_done_today',String(num('interaction'))),rates:Object.fromEntries(fields.map(k=>[k,num('assistant_rate',k)])),wellRested:num('assistant','pos_well_rested'),games:num('assistant','pos_games'),clean:num('assistant','pos_slave_clean'),hygiene:num('assistant','hygiene')};}
function check(name,fn){try{fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message});}}
for(const [id,cost,money,hygiene]of [[5605,2,0,50],[5606,1,2,0],[5607,2,5,43]]){
check('success '+id,()=>{reset(id);const s=snapshot();assert.equal(s.calls,1);assert.equal(s.rates.sensitivity,2);assert.equal(s.masterAP,5);assert.equal(s.assistantAP,5-cost);assert.equal(s.half,0);assert.equal(s.sparks,1000-money);assert.equal(s.count,1);assert.equal(s.freeTime,0);assert.equal(s.rates.hygiene,hygiene);assert.equal(s.rates.ego,id===5606?1:2);assert.equal(s.rates.moral,id===5606?1:2);if(id===5605){assert.equal(s.rates.pride,-1);assert.equal(s.rates.fear,-8);assert.equal(s.rates.angst,-8);assert.equal(s.games,5);assert.equal(s.wellRested,1);}if(id===5606){assert.equal(s.hygiene,0);assert.equal(s.clean,2);assert.equal(s.rates.fear,-11);assert.equal(s.games,2);}if(id===5607){assert.equal(s.rates.temper,1);assert.equal(s.rates.angst,-24);assert.equal(s.wellRested,1);assert.equal(s.games,8);}});
check('infinite AP '+id,()=>{reset(id,{cheat:1});assert.equal(num('qa_special_calls'),1);assert.equal(num('assistant','energy'),5);assert.equal(num('master_energy'),5);assert.equal(num('assistant_rate','sensitivity'),2);});
check('refused '+id,()=>{reset(id,{refuse:1});assert.equal(num('qa_special_calls'),0);assert.equal(num('assistant_rate','sensitivity'),0);assert.equal(num('assistant_rate','hygiene'),40);assert.equal(num('assistant','energy'),5);assert.equal(num('master_energy'),5);assert.equal(num('sparks'),1000-money);});
check('existing cached result '+id,()=>{reset(id,{cached:true});assert.equal(num('qa_special_calls'),1);assert.equal(num('assistant_rate','sensitivity'),2);assert.equal(num('assistant_already_done_today',String(id)),1);});
}
check('source growth bonus remains intact',()=>{reset(5605,{growth:true});assert.equal(num('assistant_rate','sensitivity'),3);assert.equal(num('assistant','jo9_origin_frac_sensitivity'),10);});
check('ordinary slave rest remains intact',()=>{reset(1526);assert.equal(num('qa_special_calls'),1);assert.equal(num('slave_rate','sensitivity'),1);assert.equal(num('assistant_rate','sensitivity'),0);assert.equal(num('slave_already_done_today','1526'),1);});
check('a repeated rest executes one effect per completion',()=>{reset(5606);run("interaction=5606\ngs 'interaction'");assert.equal(num('qa_special_calls'),2);assert.equal(num('assistant_rate','sensitivity'),4);assert.equal(num('assistant_already_done_today','5606'),2);assert.equal(num('assistant','energy'),3);assert.equal(num('master_energy'),5);assert.equal(num('sparks'),996);});
assert.equal(c.hash(fs.readFileSync(source)),doc.hash,'WORK changed during isolated checks');
const report={status:checks.every(x=>x.pass)?'PASS':'FAIL',mode:candidate?'candidate':'work',engine:api.version(),workQspSha256:doc.hash,checks,passed:checks.filter(x=>x.pass).length,total:checks.length,engineErrors:errors.length,limits:['Full original interaction and result with neutral peripheral helpers; real energy helpers and growth helper retained.','No personal SAV or GUI was used.']};
fs.writeFileSync(path.join(here,candidate?'candidate-verification.json':'work-verification.json'),JSON.stringify(report,null,2)+'\n');process.stdout.write(JSON.stringify(report)+'\n');if(report.status!=='PASS')process.exitCode=1;
})().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1;}).finally(()=>console.log=savedLog);
