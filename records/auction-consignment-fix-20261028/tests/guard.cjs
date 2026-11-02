'use strict';
const h=require('./harness.cjs');const {fs,assert,c,sc,rec,tmp,game,baseline,write,read,get,set,isolate,actor,runFixture,roleView}=h;
const phase=process.argv[2]||'red';let source,patch=null;
if(phase==='red'){source=h.inputBytes();assert.equal(c.hash(source),baseline);}else{const prepared=h.loadCandidate(process.argv[3]||h.root+'/2026-10-28_farid_consignment_storage.json');source=prepared.bytes;patch=prepared.patch;}
const beforeWork=c.hash(fs.readFileSync(game+'/jack.qsp'));const reports=[];
for(const [label,state]of [['zero',0],['faint',2]]){
 const d=c.parse(source);isolate(d);let code=actor('slave',41999,0)+actor('stock',41001,1)+`stock_state=${state}\nqa_notices=0\n`;
 code+=`savegame 'guard-${label}-before.sav'\nqa_guard_result=func('stock_to_slave_nogt')\nsavegame 'guard-${label}-after.sav'\n`;
 code+=`if stock_state ! ${state} or stock['id'] ! 41001 or stock['arena_level'] ! 7 or stock['diet_portion'] ! 7 or stock_rate['stamina'] ! 731 or slave_state ! 1 or slave['id'] ! 41999 or qa_guard_result ! 0: msg 'FAIL_CONSIGNMENT_EXPECT_GUARD_${label}' & exit\n`;
 const native=runFixture(d,'guard-'+label,code);const a=sc.parse(fs.readFileSync(tmp+'/guard-'+label+'-before.sav')),b=sc.parse(fs.readFileSync(tmp+'/guard-'+label+'-after.sav'));const diffRoles=[];for(const role of ['slave','stock'])if(JSON.stringify(roleView(a,role))!==JSON.stringify(roleView(b,role)))diffRoles.push(role);
 const log=fs.readFileSync(rec+'/guard-'+label+'.log','utf8'),expectedFailure=native.results.length===1&&!native.results[0].pass&&log.includes('FAIL_CONSIGNMENT_EXPECT_GUARD_'+label);
 reports.push({label,sourceState:state,native,changedCanonicalRoles:diffRoles,status:phase==='red'?(expectedFailure?'EXPECTED_FAILURE':'UNEXPECTED_RESULT'):(native.results.every(r=>r.pass)&&diffRoles.length===0?'PASS':'FAIL')});
}
const report={baseline,candidate:patch?.after_sha256||null,phase,reports,worldUnchanged:c.hash(fs.readFileSync(game+'/jack.qsp'))===beforeWork,noOriginalSaveLoadedOrWritten:true,instrumentation:['Only warning MSG statements converted to diagnostic notice counters.','Post-transfer display refresh3locations stubbed.','Actual stock_to_slave_nogt guard and all stock normalization statements otherwise executed.']};write(rec+'/guard-'+phase+'-results.json',report);console.log(JSON.stringify(report));assert(report.worldUnchanged);assert(reports.every(r=>r.status===(phase==='red'?'EXPECTED_FAILURE':'PASS')));
