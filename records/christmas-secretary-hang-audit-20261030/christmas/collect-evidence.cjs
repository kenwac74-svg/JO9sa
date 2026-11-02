'use strict';
const fs=require('fs'),path=require('path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const here=__dirname,tmp='G:/Codex/tmp/jo9-christmas-audit-20261030',work='G:/somi/Jack O Nine Tails v2.4_work/game';
const specs=[['entry','report-christmas.json','grinch-current'],['victory','report-christmas.json','grinch-victory'],['ending','report-ending.json','grinch-ending'],['endingday','report-endingday.json','grinch-ending-day'],['loss','report-grinchloss.json','grinch-loss'],['legacy','report.json',null]];
const reports=[];fs.mkdirSync(here+'/evidence',{recursive:true});
for(const[group,file,name]of specs){const report=JSON.parse(fs.readFileSync(tmp+'/'+group+'/'+file));fs.writeFileSync(here+'/evidence/'+group+'-report.json',JSON.stringify(report,null,2));reports.push({group,...report});
 const names=name?[name+'-stderr.log']:['legacy-prebattle-stderr.log','weapon-page-guard-stderr.log','stale-fate-reset-stderr.log'];
 for(const n of names){const source=tmp+'/'+group+'/'+n;if(fs.existsSync(source))fs.copyFileSync(source,here+'/evidence/'+group+'-'+n);}
}
const saved=sc.parse(fs.readFileSync(tmp+'/entry/grinch-current-outcome.sav'));
const observed={};for(const n of ['итог_боя','здоровье_игрока','выносливость_игрока','дух_игрока','qa_turns','qa_battle_count','qa_exit_count','qa_end_count','get_weapon'])observed[n]=sc.value(saved,n);
fs.writeFileSync(here+'/evidence/initial-realstats-outcome.json',JSON.stringify(observed,null,2));
const targeted=reports.filter(x=>x.group!=='entry').flatMap(x=>x.results),pass=targeted.every(x=>x.pass);
const hash=c.hash(fs.readFileSync(work+'/jack.qsp'));if(hash!=='1e8e489eb4a2c6412f81af0e50b69d409bc9ffd5d5edb69e2308cd3e9f71bc7c')throw Error('WORK drift');
const result={status:'NOT_REPRODUCED_CURRENT_TARGETED_PATHS',qspBefore:hash,qspAfter:hash,workChanged:false,targetedChecks:targeted.length,pass,initialFixtureExpectationFailure:{expected:'victory',observed:observed['итог_боя'][1],turns:Number(observed.qa_turns[0]),classification:'Diagnostic expected-win assertion failed after a functioning real-stat battle; not a game freeze.'},reports,limits:['Actual unknown reporter SAV not available; no actual stuck-save GUI load tested.','Victory/end-page cases retain production AI, route and narrative; only the test enemy HP/stamina/spirit, damage and resistances are lowered to guarantee victory.','Initial and KO cases retain original Grinch enemy stats; diagnostic protagonist state is boosted, so not a difficulty/balance test.','One ending test stops at next_day entry. A separate seventh test executes the original next_day and reaches day103/end_day_phase1 daily report; later daily-report pages are outside this audit.','Legacy tests are scoped current-code boundary simulations, not proof for every historical cached HTML/SAV.','No WORK, deployment, source QSP, original save, image or configuration changes.']};
fs.writeFileSync(here+'/RESULTS.json',JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,targetedChecks:targeted.length,pass,workChanged:false}));
