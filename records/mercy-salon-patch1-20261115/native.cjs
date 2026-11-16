'use strict';
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const R='G:/somi/JO9sa',W='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/mercy-salon-patch1-20261115';
const c=require(R+'/tools/text-workshop/core.cjs');
const mode=process.argv[2],input=process.argv[3],raw=fs.readFileSync(input),doc=c.parse(raw);
const get=n=>c.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5),out=[];let checks=0;
const emit=s=>out.push(s),must=(cond,id)=>{checks++;emit(`if (${cond})=0: msg 'FAIL_MERCYSALON_${id}' & exit`);};
emit("killall\nusehtml=0\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0");
function setup(){emit("$master_cloth='qa'\nstyle_modifer['qa']=0\nmaster_hygiene=2\nmaster_energy=0\nmaster_visage=0\nmaster_haircut=0\nmaster_str=3\nmaster_mood=0\njo9_cruel_mercy=0\njo9_cruel_mercy_half=0");}
function calc(){emit("master_style=func('jo9_mercy_allure')");}
const city=get('interaction_city'),start=city.indexOf('if interaction_city = 11620:'),end=city.indexOf('if interaction_city = 11621:',start);
a(start>=0&&end>start);const section=city.slice(start,end),service=section.match(/\$do_service\s*=\s*\{\r\n([\s\S]*?)\r\n[\t ]+\}/);
a(service&&service[1].includes('master_haircut = 30')&&service[1].includes('master_visage = 10'));
setup();calc();must('master_style=0','before-salon-neutral');
emit('dynamic {'+service[1]+'}');must('master_haircut=30 and master_visage=10 and master_hygiene=0','actual-salon-effects');calc();must('master_style=5','salon-restores-allure-at-cm-zero');
const conditionCases=[['outfit',"style_modifer['qa']=1",1],['clean','master_hygiene=0',1],['energy','master_energy=1',1],['visage','master_visage=1',2],['hair','master_haircut=1',2],['strength','master_str=4',1],['mood','master_mood=1',1]];
for(const [id,code,grade]of conditionCases){setup();emit(code);calc();must('master_style='+grade,'restored-'+id);}
const mercyCases=[[-20,0,0],[0,0,0],[4,1,0],[5,-1,0],[5,0,1],[14,1,1],[15,0,2],[24,1,2],[25,0,3],[39,1,3],[40,0,4],[59,1,4],[60,0,5],[1000,0,5]];
for(const [whole,half,bonus]of mercyCases){for(const base of [0,4,5]){setup();if(base===4)emit('master_visage=1\nmaster_haircut=1');if(base===5)emit('master_visage=1\nmaster_haircut=1\nmaster_hygiene=0');emit(`jo9_cruel_mercy=${whole}\njo9_cruel_mercy_half=${half}`);calc();must('master_style='+Math.min(5,base+bonus),'mercy-'+whole+'-'+half+'-base-'+base);must(`jo9_cruel_mercy=${whole} and jo9_cruel_mercy_half=${half}`,'score-preserved-'+checks);}}
setup();emit("jo9_cruel_mercy=4\ngs 'jo9_cruel_mercy_apply',2");must('master_style=1 and 2*jo9_cruel_mercy+jo9_cruel_mercy_half=10','cm-rise-immediate');
emit("gs 'jo9_cruel_mercy_apply',-1");must('master_style=0 and 2*jo9_cruel_mercy+jo9_cruel_mercy_half=9','cm-fall-immediate');
setup();emit('jo9_cruel_mercy=25\nmaster_visage=1\nmaster_haircut=1');for(let i=0;i<8;i++)calc();must('master_style=5 and jo9_cruel_mercy=25','repeat-no-accumulation');
const load=get('$ongload'),open='! JO9 MOD START MERCY_ALLURE_20261113_LOAD',close='! JO9 MOD END MERCY_ALLURE_20261113_LOAD';
const lo=load.indexOf(open),hi=load.indexOf(close,lo);a(lo>=0&&hi>lo);
setup();emit("master_style=5\n$allure_help='old'\ndynamic {"+load.slice(lo,hi+close.length)+'}');must('master_style=0','load-current-allure');must("instr($allure_help,'미용실')>0",'load-help-refreshed');
emit("msg 'JO9_QA_MERCYSALON_restore_COMPLETE'");
doc.lines[doc.locations.find(l=>l.name==='Start').body]=c.shift(out.join('\r\n').replace(/\r?\n/g,'\r\n'),-5);
const dir=T+'/'+mode;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/allure.qsp',c.serialize(doc));fs.copyFileSync(W+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(dir+'/plan.json',JSON.stringify([{name:'allure',file:dir+'/allure.qsp',marker:'JO9_QA_MERCYSALON_restore_COMPLETE',checkpoint:'Actual salon do_service, restored appearance factors, Mercy thresholds/halves and caps, immediate CM changes, load refresh, no repeated accumulation.'}],null,2));
fs.writeFileSync(dir+'/fixture.json',JSON.stringify({source:input,sha256:c.hash(raw),assertions:checks,usesExactSalonService:true,personalSave:false},null,2));console.log(JSON.stringify({mode,assertions:checks,sourceSha256:c.hash(raw)}));
