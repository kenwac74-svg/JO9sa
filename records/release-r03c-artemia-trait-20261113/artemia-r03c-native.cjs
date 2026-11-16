'use strict';
const fs=require('fs'),a=require('assert/strict'),{R,G,D,T,c,qa,sv,rd,wr,nl,q,body,put}=require('./artemia-r03c.cjs');
const phase=process.argv[2],variant=process.argv[3]||'red',N=T+'/native',source=variant==='red'?G+'/jack.qsp':T+'/candidate.qsp';
let checks=0;const ck=(expr,name)=>{checks++;return `qa_checks+=1\nif (${expr})=0: qa_failed+=1 & $qa_failures+=${q(name+';')}\n`;};
const boot="killall\nautosave=0\ndecadesave=0\nsound_on=0\n$onnewloc=''\n$ongload=''\n$ongsave=''\n$counter=''\nsettimer 0\nsnk_room_target=0\nqa_checks=0\nqa_failed=0\n$qa_failures=''\ngs '#static_base'\ngs '#dynamic'\ngs '#variative'\ngs '#var_base'\ngs '#static_txt'\ngs '#options'\ngs '#npc_base'\n";
const actor="slave_type=1000\nslave_state=CONST_INT['slave_exist']\n$slave_name='QA adult custom name'\n$slave_psy_status='normal'\nslave['age']=2\nslave['qa_marker']=73\nslave['stamina']=5\nslave['energy']=5\nslave['fat']=2\nslave['style']=5\nslave['exotic']=2\nslave['fame']=5\nslave['moral']=5\nslave['sanity']=5\nslave['virginity']=2\nslave['jo9_versatile_manual_off']=1\nbrand_reputation=5\nbuyer_from_house=0\nday=20\nsparks=7777\nnpc_progress['Artemia']=3\nfridge['eggs']=42\n";
const skills=['sensitivity','temper','intellect','ego','pride','service','cook','secretary','expression','nurse','alchemy','enchanter','gladiatrix','calisthenics','music','art','pet','dressage','cowSK','petting','oral','penetration','orgy','roleplay','fetishism','xenophily','lesbiansex','nipplefuck','exhibitionism','instinct','custom','rational'];
const reset="slave['beauty']=5\nslave['base_beauty']=5\nslave_rate['beauty']=cont_atr_threshold[5]\nslave_rate['temp_beauty']=0\n"+skills.map(k=>`slave[${q(k)}]=5\n`).join('');
const finish=name=>`savegame ${q(name+'.sav')}\nif qa_failed>0: msg 'FAIL_ARTEMIAC '+$qa_failures & exit\nmsg ${q('JO9_QA_ARTEMIAC_'+name.replaceAll('-','_')+'_COMPLETE')}\nexit\n`;
const calls="is_stock=0\nsl_txt=1\n$refuse_txt=''\ngs 'slave_sell_chek'\n";
const groups=[
 {name:'trait-boundaries',cases:[
  {label:'negative_hidden',trait:-1,reveal:0,want:100}, {label:'absent_hidden',trait:0,reveal:0,want:100},
  {label:'one_hidden',trait:1,reveal:0,want:2}, {label:'upper_hidden',trait:2,reveal:0,want:2},
  {label:'negative_revealed',trait:-1,reveal:2,want:100}, {label:'absent_revealed',trait:0,reveal:2,want:100},
  {label:'one_revealed',trait:1,reveal:2,want:2}, {label:'upper_revealed',trait:2,reveal:2,want:2}
 ],scope:'Real customer and full sale/price functions: -1/0/1/2, hidden/revealed. No trait discovery requirement.'},
 {name:'sale-regression',cases:[
  {label:'beauty4',trait:1,reveal:2,beauty:4,want:100,refusal:'아름다운'},
  {label:'music3',trait:1,reveal:2,music:3,want:102},
  {label:'oral4',trait:1,reveal:2,oral:4,want:102},
  {label:'exact_minima',trait:1,reveal:2,minima:true,want:2},
  {label:'azura_absent',buyer:'azura',trait:0,reveal:0,want:2},
  {label:'azura_negative',buyer:'azura',trait:-1,reveal:2,want:2}
 ],scope:'Real beauty/skill refusals, all exact approved minima, and real Azura trades without this requirement.'}
];
if(phase==='prepare'){
 const raw=fs.readFileSync(source);if(!fs.existsSync(N+'/json'))fs.cpSync(G+'/json',N+'/json',{recursive:true});fs.copyFileSync(G+'/config.xml',N+'/config.xml');fs.writeFileSync(N+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');const plan=[],instrumentation=[];
 for(const group of groups){let code=boot+actor;let index=0;
  for(const v of group.cases){index++;const buyer=v.buyer||'Artemia';code+=reset+`$npc_id=${q(buyer)}\nslave['nymphomania']=${v.trait}\nslave['nymphomania_revealed']=${v.reveal}\n`;
   if(v.beauty)code+=`slave['beauty']=${v.beauty}\nslave['base_beauty']=${v.beauty}\nslave_rate['beauty']=cont_atr_threshold[${v.beauty}]\n`;
   for(const key of ['music','oral'])if(v[key]!==undefined)code+=`slave[${q(key)}]=${v[key]}\n`;
   if(v.minima)code+="slave['music']=4\nslave['xenophily']=4\nslave['fetishism']=4\n";
   code+=calls+ck(`sl_txt=${v.want} and buyer_interested=${v.want<3?1:0}`,'outcome_'+v.label);
   if(v.refusal)code+=ck(`instr($refuse_txt,${q(v.refusal)})>0`,'refusal_'+v.label);
   code+=ck(`slave['nymphomania']=${v.trait} and slave['nymphomania_revealed']=${v.reveal} and slave_type=1000 and slave['qa_marker']=73 and $slave_name='QA adult custom name'`,'actor_'+v.label);
   code+=ck(`rating>=8 and sparks=7777 and npc_progress['Artemia']=3 and fridge['eggs']=42 and demand['nymphomania']=${buyer==='Artemia'?1:0}`,'unrelated_'+v.label);
   code+=`qa_result[${index}]=sl_txt\nqa_price[${index}]=slaveprice\nqa_rating[${index}]=rating\nqa_trait[${index}]=slave['nymphomania']\nqa_revealed[${index}]=slave['nymphomania_revealed']\n`;
  }
  const d=c.parse(raw);put(d,'Start',code+finish(group.name));const out=c.serialize(d);qa.inspectWorld(out);fs.writeFileSync(N+'/'+group.name+'.qsp',out);plan.push({name:group.name,file:N+'/'+group.name+'.qsp',marker:'JO9_QA_ARTEMIAC_'+group.name.replaceAll('-','_')+'_COMPLETE',checkpoint:group.scope});instrumentation.push({name:group.name,assertions:checks,cases:group.cases,scope:group.scope});checks=0;
 }wr(N+'/plan.json',plan);wr(D+'/native-'+variant+'-instrumentation.json',{source,sourceHash:c.hash(raw),groups:instrumentation});console.log(JSON.stringify({variant,groups:instrumentation.map(g=>({name:g.name,assertions:g.assertions,cases:g.cases.length})),plan:N+'/plan.json'}));
}else if(phase==='collect'){
 const results=rd(N+'/client-results.json'),observations=[],cases=[];a.equal(results.length,groups.length);
 for(const e of results){const s=sv.parse(fs.readFileSync(N+'/'+e.name+'.sav')),get=(key,i)=>{const v=s.vars.find(x=>x.name===key.toUpperCase());a(v,key);return +v.values[i][0];};observations.push({name:e.name,checks:+sv.value(s,'qa_checks')[0],failed:+sv.value(s,'qa_failed')[0],failures:sv.value(s,'qa_failures')[1]});const g=groups.find(x=>x.name===e.name);g.cases.forEach((v,i)=>cases.push({...v,group:e.name,actualResult:get('qa_result',i+1),price:get('qa_price',i+1),rating:get('qa_rating',i+1),actualTrait:get('qa_trait',i+1),actualRevealed:get('qa_revealed',i+1)}));
  for(const f of [e.name+'-stderr.log',e.name+'-stdout.log'])if(fs.existsSync(N+'/'+f))fs.copyFileSync(N+'/'+f,D+'/'+variant+'-'+f);
 }const proof={source,sourceHash:c.hash(fs.readFileSync(source)),results,observations,assertions:observations.reduce((n,x)=>n+x.checks,0),passed:results.every(x=>x.pass)&&observations.every(x=>x.failed===0)};wr(D+'/native-'+variant+'-report.json',proof);wr(D+'/cases-'+variant+'.json',cases);console.log(JSON.stringify(proof));
}else throw Error('prepare/collect required');
