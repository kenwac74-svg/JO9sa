'use strict';
// Uses compiled native bodies. No production QSP, mod, source, or personal save is written.
const h=require('./harness.cjs'),{fs,path,assert,c,rec,tmp,game,baseline,read,write,body,span,load,fixture,run,value}=h;
const args=process.argv.slice(2);let candidate,basePath=game+'/jack.qsp',keep=false;
for(let i=0;i<args.length;i++){if(args[i]==='--candidate')candidate=args[++i];else if(args[i]==='--baseline')basePath=args[++i];else if(args[i]==='--keep-diagnostics')keep=true;else throw Error('Unknown argument '+args[i]);}
const source=load(basePath);assert.equal(source.sha256,baseline);const input=candidate?load(path.resolve(candidate)):source,mode=candidate?'candidate':'baseline',newCost=!!candidate;
assert.equal(h.helper(input.d),h.helper(source.d),'The original common master helper must remain unchanged');
let assertions=0;
function check(bad,label){assert(/^[a-z0-9_]+$/.test(label));assertions++;return `if ${bad}: msg 'FAIL_FOGAP_${label}' & exit\nqa_assertions+=1\n`;}
const g=s=>s>=75?5:s>=65?4:s>=55?3:s>=45?2:s>=35?1:s>=25?0:s>=20?-1:s>=15?-2:s>=10?-3:-4;
const cases=[
 {label:'s75',s:75},{label:'s65',s:65},{label:'s64',s:64},{label:'s55',s:55},{label:'s54',s:54},{label:'s35',s:35},{label:'s20',s:20},{label:'s9',s:9},{label:'s0_wound',s:0},
 {label:'ap1',ap:1},{label:'half1',ahalf:1,mhalf:1},{label:'master_half_credit',mhalf:-1},{label:'ring_half0',ring:1},{label:'ring_half1',ring:1,mhalf:1},
 {label:'cheat',cheat:1,easy:1,aeasy:1},{label:'easy_master',easy:1},{label:'master_overwork',master:0},{label:'master_overwork_obereg',master:0,obereg:1},
 {label:'assistant_easy_untouched',aeasy:1,ahalf:1},{label:'slave_front_unchanged',actor:1},{label:'defeat_no_master_addition',victory:false,s:45}
].map(x=>({actor:2,ap:5,s:75,master:5,mhalf:0,ahalf:0,ring:0,easy:0,aeasy:0,cheat:0,obereg:0,victory:true,...x}));
let code="qa_assertions=0\n";
for(const [i,x]of cases.entries()){
 const companion=Math.min(g(x.s),x.ap-(newCost&&x.actor===2?2:1)),charge=newCost&&x.actor===2&&x.victory;
 // An independent direct execution of the unchanged original helper supplies all master side-effect expectations.
 code+=fixture(x)+"dynamic $qa_original_master_drop\nqa_ref_energy=master_energy\nqa_ref_half=master_half_action\nqa_ref_strength=master_str_rate\nqa_ref_easy=easy_for_master\n"+fixture(x);
 if(!charge)code+=`qa_ref_energy=${x.master}\nqa_ref_half=${x.mhalf}\nqa_ref_strength=17\nqa_ref_easy=${x.easy}\n`;
 code+=`gs 'jo9_fog_relay','${i%2?'settle':'finish'}'\n`;
 code+=check(`${x.actor===2?'assistant':'slave'}['energy']!${companion} or ${x.actor===2?'slave':'assistant'}['energy']!5 or jo9_fog['settled']!1`,x.label+'_companion');
 code+=check(`master_energy!qa_ref_energy or master_half_action!qa_ref_half or master_str_rate!qa_ref_strength or easy_for_master!qa_ref_easy`,x.label+'_native_master_side_effects');
 code+=check(`qa_master_calls!${charge?1:0} or assistant['half_action']!${x.ahalf} or easy_for_assistant!${x.aeasy} or assistant['calories']!41`,x.label+'_no_unrequested_helper');
 code+=check("assistant_rate['stamina']!7 or qa_clear!0 or qa_attrs!1",x.label+'_other_state');
 code+=`qa_first_energy=master_energy\nqa_first_half=master_half_action\nqa_first_strength=master_str_rate\nqa_first_easy=easy_for_master\nqa_first_companion=${x.actor===2?'assistant':'slave'}['energy']\nqa_first_calls=qa_master_calls\ngs 'jo9_fog_relay','settle'\ngs 'jo9_fog_relay','finish'\ngs 'jo9_fog_relay','finish'\n`;
 code+=check(`master_energy!qa_first_energy or master_half_action!qa_first_half or master_str_rate!qa_first_strength or easy_for_master!qa_first_easy`,x.label+'_repeat_master');
 code+=check(`${x.actor===2?'assistant':'slave'}['energy']!qa_first_companion or qa_master_calls!qa_first_calls or qa_attrs!1`,x.label+'_repeat_companion');
 if(x.s===0)code+=check("assistant_rate['wounds']!80 or assistant['neg_slave_wounded']!1 or qa_relay_messages!1",x.label+'_native_wounds');
 code+=`qa_observed_companion[${i}]=${x.actor===2?'assistant':'slave'}['energy']\nqa_observed_master[${i}]=master_energy\nqa_observed_half[${i}]=master_half_action\nqa_observed_strength[${i}]=master_str_rate\nqa_observed_easy[${i}]=easy_for_master\nqa_observed_calls[${i}]=qa_master_calls\n`;
}
const matrixAssertions=assertions;const matrixName=mode+'-matrix';code+=`savegame '${matrixName}-state.sav'\nmsg 'JO9_QA_FOGAP_${matrixName.replaceAll('-','_')}_COMPLETE'\n`;
const matrix=run(input.d,matrixName,code);assert.equal(matrix.engineExit,0,JSON.stringify(matrix.results));assert(matrix.results.every(x=>x.pass));const matrixSave=matrix.saves[matrixName+'-state.sav'];assert(matrixSave);assert.equal(Number(value(matrixSave,'qa_assertions')),matrixAssertions);
const observations=cases.map((x,i)=>({...x,expectedCompanion:Math.min(g(x.s),x.ap-(newCost&&x.actor===2?2:1)),observedCompanion:Number(value(matrixSave,'qa_observed_companion',i)),masterEnergy:Number(value(matrixSave,'qa_observed_master',i)),masterHalfAction:Number(value(matrixSave,'qa_observed_half',i)),masterStrengthRate:Number(value(matrixSave,'qa_observed_strength',i)),masterEasy:Number(value(matrixSave,'qa_observed_easy',i)),masterHelperCalls:Number(value(matrixSave,'qa_observed_calls',i))}));
// Use the exact native failure redirection and the minimal native exit cost segment. Full battle scenes are outside this harness.
const endBody=body(input.d,'конец_боя'),handoffGuard=endBody.match(/if jo9_fog\['active'\] = 1[^\n]*\n\s*gt 'jo9_fog_relay', 'handoff'\nend/)[0];assert(handoffGuard);
const exitBlock=span(input.d,'выход_из_боя','if combatant = 0:\n\tlethal_damage_received =','! JO9 MOD START FOG_CLOSE');
const exitCost="gs 'jo9_fog_relay', 'finish'\n"+exitBlock+"gs 'jo9_fog_relay', 'close'\n";
const routes=[];
for(const kind of ['handoff','solo','ap-one']){
 const name=mode+'-'+kind,actor=kind==='solo'?0:2,ap=kind==='ap-one'?1:5;let routeChecks=0;
 const routeCheck=(bad,label)=>{routeChecks++;return check(bad,kind.replaceAll('-','_')+'_'+label);};
 let start=fixture({actor,ap})+"qa_assertions=0\nqa_route_stage=0\n$враг[1]='qa_enemy_one'\n$враг[2]='qa_enemy_two'\nздоровье_врага[1]=37\nздоровье_врага[2]=29\nсостояние_врага[1]=2\nсостояние_врага[2]=3\n";
 start+=`gt 'jo9_fog_relay','begin',${actor}\n`;
 let arrival="if qa_route_stage=0:\n";
 arrival+=routeCheck(`combatant!${actor} or jo9_fog['actor']!${actor} or master_energy!5 or assistant['energy']!${ap}`,'begin_preserves_ap');
 arrival+=routeCheck(`jo9_fog['active']!${actor===0?0:1} or qa_master_calls!0`,'begin_guard');
 if(kind==='handoff'){
  arrival+="qa_route_stage=1\n$итог_боя='поражение'\nвыносливость_игрока=45\nдух_игрока=0\ngt 'конец_боя'\nend\nif qa_route_stage=1:\n";
  arrival+=routeCheck("combatant!0 or jo9_fog['switched']!1 or jo9_fog['settled']!1 or jo9_fog['resuming']!1",'original_handoff_flags');
  arrival+=routeCheck("assistant['energy']!2 or master_energy!5 or qa_master_calls!0 or qa_armor!1",'handoff_cost_once');
  arrival+=routeCheck("assistant_rate['moral']!-10 or assistant_rate['mood']!-10 or qa_relay_messages!2",'native_morale_and_message_spies');
  arrival+=routeCheck("здоровье_врага[1]!37 or здоровье_врага[2]!29 or состояние_врага[1]!2 or состояние_врага[2]!3",'enemy_arrays_preserved');
  arrival+="gs 'jo9_fog_relay','settle'\ngs 'jo9_fog_relay','finish'\n";
  arrival+=routeCheck("assistant['energy']!2 or master_energy!5 or qa_master_calls!0 or qa_attrs!1",'settled_handoff_no_extra');
 }
 arrival+="qa_route_stage=2\n$итог_боя='победа'\nздоровье_игрока=50\nмакс_здоровье_игрока=50\nвыносливость_игрока=75\nмакс_выносливость_игрока=75\nдух_игрока=30\nнорм_дух_игрока=30\ngt 'выход_из_боя'\nend\nmsg 'FAIL_FOGAP_ROUTE_STAGE'\n";
 let finish=exitCost;
 const expectedMaster=kind==='ap-one'?(newCost?4:5):1,expectedHalf=kind==='ap-one'?0:-1,expectedAssistant=kind==='handoff'?2:kind==='ap-one'?(newCost?-1:0):5,expectedCalls=kind==='ap-one'&&newCost?1:0;
 finish+=routeCheck(`master_energy!${expectedMaster} or master_half_action!${expectedHalf} or assistant['energy']!${expectedAssistant} or qa_master_calls!${expectedCalls}`,'exit_native_cost');
 finish+=routeCheck("jo9_fog['active']!0 or jo9_fog['settled']!0 or combatant!0",'close_clears_transient');
 finish+="gs 'jo9_fog_relay','finish'\ngs 'jo9_fog_relay','settle'\n";
 finish+=routeCheck(`master_energy!${expectedMaster} or master_half_action!${expectedHalf} or assistant['energy']!${expectedAssistant} or qa_master_calls!${expectedCalls}`,'post_close_no_cost');
 finish+=`savegame '${name}-state.sav'\nmsg 'JO9_QA_FOGAP_${name.replaceAll('-','_')}_COMPLETE'\n`;
 const r=run(input.d,name,start,{'начать_бой':arrival,'конец_боя':handoffGuard,'выход_из_боя':finish});assert.equal(r.engineExit,0,JSON.stringify(r.results));assert(r.results.every(x=>x.pass));const saved=r.saves[name+'-state.sav'];assert(saved);assert.equal(Number(value(saved,'qa_assertions')),routeChecks);routes.push({kind,conditions:routeChecks,results:r.results,masterEnergy:Number(value(saved,'master_energy')),masterHalfAction:Number(value(saved,'master_half_action')),assistantEnergy:Number(value(saved,'assistant','energy')),masterHelperCalls:Number(value(saved,'qa_master_calls')),protected:r.protected});
}
const report={status:'NATIVE_ISOLATED_PASS',mode,baseline:source.sha256,inputSha256:input.sha256,matrixCases:cases.length,matrixConditions:matrixAssertions,totalConditions:assertions,results:[...matrix.results,...routes.flatMap(r=>r.results)],observations,routes,diagnostic:matrix.diagnostic,sourceRefs:{relay:matrix.diagnostic.relayHash,masterHelper:matrix.diagnostic.masterHelperHash,nativeHandoffGuard:c.hash(Buffer.from(handoffGuard)),nativeExitCostBlock:c.hash(Buffer.from(exitBlock))},protected:matrix.protected,limits:['Accepted battle outcome and combat stamina are synthetic; no battle turns, user save, or general GUI input is run.','The exact relay body executes, except its9 text MSG statements are QA counters. Attribute recalculation and actor-clear helpers are spies; all tested HP values are positive.','Original master helper is retained byte-for-byte and called through a count-only wrapper. Each matrix master reference executes that same native body directly, including ring/easy/cheat/half-action/negative-energy strength side effects.','Zero enemy count and fame80 isolate unrelated random fame. Snapshot spirit remains unset in these cost fixtures; snapshot/fame/death behavior is not claimed tested.','Begin/handoff use original relay navigation and original end-of-battle redirection. Weapon selection and rendering are replaced by assertion continuations.','Exit tests use the unchanged combatant0 state/cost block plus original relay finish/close calls. Other exit rewards, HP/death, cheats restored later in the full exit, and full battle UI are outside these minimal route tests.'],diagnosticsCleaned:false};
write(rec+'/'+mode+'-results.json',report);console.log(JSON.stringify({status:report.status,mode,baseline:source.sha256,input:input.sha256,conditions:assertions,cases:cases.length,results:report.results,routes:routes.map(({kind,masterEnergy,masterHalfAction,assistantEnergy,masterHelperCalls})=>({kind,masterEnergy,masterHalfAction,assistantEnergy,masterHelperCalls}))},null,2));
// Cleanup waits until the candidate also passes. Preserve SAV/logs; delete only our known direct files, never recurse.
if(newCost&&!keep){const target=path.resolve(tmp);assert.equal(target,path.resolve('G:/Codex/tmp/jo9-fog-assistant-ap-20261028/tests'));assert.equal(fs.realpathSync(target),target);assert(!fs.lstatSync(target).isSymbolicLink());const allowed=/^(?:(?:red|debug|smoke|setup-check|setup-full|one-settle|baseline-(?:matrix|handoff|solo|ap-one)|candidate-(?:matrix|handoff|solo|ap-one))(?:-plan\.json|-stderr\.log|-stdout\.log|(?:-stage\d+|-state)?\.sav|\.qsp)|client-results\.json|FastQSP\.ini)$/;const files=fs.readdirSync(target);for(const name of files){const p=path.join(target,name);if(name==='save'){assert(fs.lstatSync(p).isDirectory()&&!fs.lstatSync(p).isSymbolicLink());assert.equal(fs.readdirSync(p).length,0);continue;}assert(allowed.test(name),'Preserve unexpected diagnostic file '+name);assert(fs.lstatSync(p).isFile()&&!fs.lstatSync(p).isSymbolicLink());if(name.endsWith('.sav')||name.endsWith('-stderr.log')||name.endsWith('-stdout.log'))fs.copyFileSync(p,path.join(rec,'retained-'+name));}for(const name of files){const p=path.join(target,name);if(name==='save')fs.rmdirSync(p);else fs.unlinkSync(p);}fs.rmdirSync(target);report.diagnosticsCleaned=true;write(rec+'/'+mode+'-results.json',report);}
