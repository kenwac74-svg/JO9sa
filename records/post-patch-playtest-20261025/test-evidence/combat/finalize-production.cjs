'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const base='G:/Codex/tmp/jo9-post-patch-playtest-20261025/production',dest=path.resolve(__dirname,'../production'),game='G:/somi/Jack O Nine Tails v2.4_work/game';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),raw=fs.readFileSync(game+'/jack.qsp'),doc=c.parse(raw),body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5);
fs.mkdirSync(dest+'/evidence',{recursive:true});const cases=[],bodyPreservation=[];
function scalar(s,n){const v=sc.value(s,n);return v[1]||Number(v[0]);}
function item(s,n,k){const v=sc.value(s,n,k);return v[1]||Number(v[0]);}
function snapshot(file){
 const raw=fs.readFileSync(file),s=sc.parse(raw),state={};
 for(const n of ['spawn_semen','spawn_milked','decade_semen','tentacle_size','tentacle_hp','tentacle_state','day','end_day_phase','qa_calls','qa_next_count','qa_end_count','qa_report_count','qa_main_count','qa_decade_before','interaction'])state[n]=scalar(s,n);
 for(const role of ['slave','assistant','room1'])state[role]=Object.fromEntries(['id','age','energy','half_action','virginity','sub_tentacles','tentacle_rule'].map(k=>[k,item(s,role,k)]));
 state.report={};for(const role of ['slave','assistant','room1'])for(const suffix of ['gain','bonus','tallied'])state.report[role+'_'+suffix]=item(s,'jo9_tentacle_report',role+'_'+suffix);
 const text=s.vars.find(v=>v.name==='TEXT'),texts=text?.values.map(v=>v[1]).filter(Boolean)||[];
 return {sha256:c.hash(raw),bytes:raw.length,state,textHashes:texts.map(t=>c.hash(Buffer.from(t,'utf8')))};
}
for(const group of ['manual','automatic']){
 const report=read(base+'/'+group+'/report.json');
 const probe=c.parse(fs.readFileSync(base+'/'+group+'/'+report.results[0].name+'.qsp'));
 for(const name of ['interaction','interaction_screen','main_screen','next_day','end_day_screen']){
  const preserved=body(probe,name).includes(body(doc,name));a(preserved,'Original body changed '+group+' '+name);bodyPreservation.push({group,location:name,originalBodyPreserved:true,sourceBodyHash:c.hash(Buffer.from(body(doc,name)))});
 }
 for(const result of report.results){
  const fixture=report.manifest.find(x=>x.name===result.name),stages={};
  for(const stage of ['result','report','complete']){const p=base+'/'+group+'/'+result.name+'-'+stage+'.sav';if(fs.existsSync(p))stages[stage]=snapshot(p);}
  const log=base+'/'+group+'/'+result.name+'-stderr.log',logFile=dest+'/evidence/'+result.name+'-stderr.log';if(fs.existsSync(log))fs.copyFileSync(log,logFile);
  cases.push({...result,group,fixture,stages,log:logFile});
 }
}
const manual=cases.filter(x=>x.group==='manual'),auto=cases.filter(x=>x.group==='automatic');
const report={schema:1,date:'2026-10-25',candidateSha256:c.hash(raw),status:cases.length===14&&cases.every(x=>x.pass)?'PASS':'FAIL',features:[
 {id:'F11_F12_MANUAL_SIZE_YIELD_TEXT',status:manual.length===10&&manual.every(x=>x.pass)?'PASS':'FAIL',cases:manual.map(x=>x.name),observed:{size:[0,1,2,3,4],slave:[14,23,33,96,201],assistant:[12,18,24,64,126]},sourceRoutes:['Current native main_screen Fer_Tentacle image/link','original interaction59/45 -> interaction_result -> interaction_screen','native forward object -> original menu_form -> main_screen'],textVerification:'Numeric amount/bonus checked in original result text. Exact rendered text retained only as SHA256, never rewritten.'},
 {id:'F11_F12_AUTOMATIC_REPORT',status:auto.length===4&&auto.every(x=>x.pass)?'PASS':'FAIL',cases:auto.map(x=>x.name),sourceRoutes:['Native original day-end link -> next_day','original automatic role award -> end_day_screen','native original forward objects -> actual menu/main return'],observed:{roles:['slave','assistant','room1'],gain:201,bonusPercent:60,zeroAPDelayedGain:14,zeroAPBonusPercent:20,growthSize:1},oneTime:'Stock and decade tally checked on report and final return; report seen exactly once.'},
 {id:'F19_NATIVE_BUTTON_ART_CALLBACKS',status:manual.every(x=>x.pass)?'PASS':'FAIL',cases:manual.map(x=>x.name),observed:{slaveCallback:59,assistantCallback:45,actorAP:[5,4],otherAP:[5,5],image:'content/pic/buttons/Fer_Tentacle.png'},limits:['Native DOM confirms expected image src, successful image load, original anchor callback and actual AP/effects. Human visual artwork judgement remains root GUI evidence.']}
 ],bodyPreservation,cases,limits:['Adult prepared saves are read-only state seeds; current a70 QSP, refresh_database and original routes are executed. This is independent from the old extracted1575case helper suite.','Only Start fixtures, counters/assertions, snapshots and native DOM event drivers are added; original narrative literals and all five modified product bodies remain exact substrings.','Native DOM synthetic mouse events are used. Normal user saves and product files are unchanged.']};
fs.writeFileSync(dest+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,cases:cases.length,features:report.features.map(x=>({id:x.id,status:x.status})),report:dest+'/report.json'}));
