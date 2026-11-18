'use strict';
const {fs,assert,core,H,GAME,body,source,block,assignments,apply}=require('./common.cjs');
const raw=fs.readFileSync(GAME+'/jack.qsp'),candidate=process.argv.includes('--candidate');
const d=core.parse(candidate?apply(raw,JSON.parse(fs.readFileSync(H+'/patch.json','utf8'))):raw);
const src=assignments(block(body(source(),'#var_base'))),pool=d.locations.some(x=>x.name==='jo9_humiliation_pool')?body(d,'jo9_humiliation_pool'):block(body(d,'#var_base'));
const actual=assignments(pool.replaceAll('jo9_hum_actor','slave').replaceAll('jo9_hum_other','assistant'));
const checks=[];function check(name,fn){try{fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:e.message.slice(0,160)});}}
check('all 137 supplied original text assignments including nine auxiliary fragments',()=>assert.deepEqual(actual.map(x=>[x.field,x.rhs]),src.map(x=>[x.field,x.rhs])));
check('original mature category and body conditions',()=>{assert(pool.includes("['age'] = CONST_INT['milf_age']"));assert(pool.includes("['boobs'] = 1:"));assert(pool.includes("['boobs'] = 0 and jo9_hum_actor['age'] ! CONST_INT['loli_age']"));});
check('discovered positive or negative trait state accepts exactly1 or2',()=>{for(const k of ['perversion','homosexualism'])assert(pool.includes(`(jo9_hum_actor['${k}_revealed'] = 1 or jo9_hum_actor['${k}_revealed'] = 2)`));});
check('existing index fixes and psychological priority retained',()=>{assert(pool.includes('hum_num = rand(1, 1)'));assert(pool.includes('VARBASE_FALLBACK_INDEX_20261021'));for(const k of ['arrogant','hateful','lachrymose','hysteric'])assert(pool.includes(`= '${k}' and hum_cnt < 1`));assert(!/hum_sign\[hum_cnt\] = [124]/.test(pool));});
check('assistant actor selection and female description refresh are on uncached path',()=>{const b=body(d,'interaction');assert(b.includes("gs '#var_base', iif(interaction = 7034, 'assistant', 'slave')"));assert(b.includes("if interaction = 1375 or interaction = 7034: gs 'jo9_humiliation_description'"));assert(d.locations.some(x=>x.name==='jo9_humiliation_pool'));});
const report={status:checks.every(x=>x.pass)?'PASS':'FAIL',mode:candidate?'candidate':'baseline',originalAssignments:src.length,checks,passed:checks.filter(x=>x.pass).length,total:checks.length};fs.writeFileSync(H+(candidate?'/source-green.json':'/source-red.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.status!=='PASS')process.exitCode=1;
