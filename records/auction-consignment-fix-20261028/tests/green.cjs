'use strict';
const h=require('./harness.cjs');const {fs,assert,c,sc,rec,tmp,game,read,write,get,set,section,loadCandidate,instrumentMessages,isolate,actor,runFixture,roleView}=h;
const patchPath=process.argv[2]||h.root+'/2026-10-28_farid_consignment_storage.json',prepared=loadCandidate(patchPath),helper='jo9_farid_consignment',slot='jo9_farid_stored',flag='jo9_farid_stored_valid';
const liveBefore=c.hash(fs.readFileSync(game+'/jack.qsp'));const source=prepared.bytes;const d=c.parse(source);isolate(d);set(d,helper,instrumentMessages(get(d,helper)));set(d,'$slave_price',"qa_appraisal_calls+=1\nslaveprice=qa_appraisal\n");
let checks=0;const check=(s,n)=>{checks++;return `if (${s})=0: msg 'FAIL_CONSIGNMENT_${n}' & exit\n`;};
const call=(mode)=>`qa_result=func('${helper}','${mode}')\n`;
const reset=()=>`dynamic $clear_slave_instance,'slave'\ndynamic $clear_slave_instance,'stock'\ndynamic $clear_slave_instance,'${slot}'\n${flag}=0\nfarid_debt=0\nfarid_potential_debt=0\nsparks=100\nqa_appraisal=200\nqa_appraisal_calls=0\nhunting_prize=7\nchallenge_type=51\nmaster_moodlet['pos_new_slave']=19\n`;
const snap=name=>`savegame '${name}.sav'\n`;
let code='';
// New verified custody survives unrelated shared stock reuse, including complete metadata and ID0.
for(const[id,genius,label]of [[41001,1,'genius'],[0,0,'zero-id']]){
 code+=reset()+actor('stock',id,genius)+snap('expected-'+label)+call('deposit');
 code+=check(`qa_result=1 and farid_potential_debt=100 and farid_debt=0 and ${flag}=1 and ${slot}_state=1 and stock_state=0 and arrsize('stock')=0`,'deposit_'+label);
 code+=actor('stock',42002,0)+`dynamic $clear_slave_instance,'stock'\n`+actor('stock',42003,0)+snap('unrelated-'+label)+call('return');
 code+=check(`qa_result=1 and slave_state=1 and slave['id']=${id} and slave['jo9_learning_trait']=${genius} and sparks=95 and farid_potential_debt=0 and ${flag}=0 and ${slot}_state=0 and arrsize('${slot}')=0`,'return_'+label);
 code+=check("hunting_prize=7 and challenge_type=51",'no_new_actor_initialization_'+label)+check("master_moodlet['pos_new_slave']=6-brand_reputation",'existing_return_mood_effect_'+label)+snap('returned-'+label);
 code+=call('return')+check('qa_result=-1 and sparks=95 and farid_potential_debt=0','duplicate_return_'+label)+snap('duplicate-'+label);
}
// A second same-day deposit settles the earlier amount once and replaces only the one custody slot.
code+=reset()+"farid_debt=25\n"+actor('stock',41011,1)+call('deposit')+check('qa_result=1 and farid_debt=25 and farid_potential_debt=100','first_deposit_keeps_old_debt');
code+=actor('stock',41012,0)+"qa_appraisal=140\n"+snap('expected-second')+call('deposit')+check(`qa_result=1 and farid_debt=125 and farid_potential_debt=70 and ${slot}['id']=41012 and ${flag}=1`,'replacement_settles_once');
code+=call('return')+check('qa_result=1 and slave[\'id\']=41012 and sparks=95 and farid_debt=125 and farid_potential_debt=0','replacement_returns_latest')+snap('returned-second');
code+=call('settle')+call('settle')+check('qa_result=0 and farid_debt=125 and farid_potential_debt=0','replacement_no_duplicate_settlement');
// Day settlement is idempotent and collecting money never clears unrelated stock.
code+=reset()+"farid_debt=25\n"+actor('stock',41021,1)+call('deposit')+actor('stock',42021,0)+snap('settle-stock-before');
code+=call('settle')+check(`qa_result=100 and farid_debt=125 and farid_potential_debt=0 and ${flag}=0 and ${slot}_state=0`,'day_settles_one_amount');
code+=call('settle')+check('qa_result=0 and farid_debt=125','day_settle_twice');
code+=call('return')+check('qa_result=-1 and sparks=100 and slave_state=0','no_return_after_settlement');
code+=call('collect')+check('qa_result=125 and sparks=225 and farid_debt=0','collect_once');
code+=call('collect')+check('qa_result=0 and sparks=225 and farid_debt=0','collect_twice')+snap('settle-stock-after');
// Collecting an older debt must leave a newer verified pending person and amount intact.
code+=reset()+"farid_debt=25\n"+actor('stock',41031,1)+call('deposit')+snap('collect-pending-before')+call('collect');
code+=check(`qa_result=25 and sparks=125 and farid_debt=0 and farid_potential_debt=100 and ${flag}=1 and ${slot}['id']=41031`,'collect_preserves_new_pending')+snap('collect-pending-after');
code+=call('return')+check('qa_result=1 and sparks=120 and slave[\'id\']=41031','return_after_older_collection');
// Failure must preserve the active person, verified custody and all financial amounts.
code+=reset()+actor('stock',41041,1)+call('deposit')+actor('slave',41999,0)+actor('stock',42999,0)+snap('occupied-before')+call('return');
code+=check(`qa_result=-2 and sparks=100 and farid_potential_debt=100 and ${flag}=1 and ${slot}['id']=41041 and slave['id']=41999`,'occupied_failure')+snap('occupied-after');
code+=`dynamic $clear_slave_instance,'slave'\n`+call('return')+check('qa_result=1 and sparks=95 and slave[\'id\']=41041','later_return_after_free_slot');
// A bad replacement source or appraisal cannot destroy an earlier valid pending person.
for(const[state,label]of [[0,'empty'],[2,'faint']]){
 code+=reset()+actor('stock',41051,1)+call('deposit')+actor('stock',42051,0)+`stock_state=${state}\n`+snap('bad-source-'+label+'-before')+call('deposit');
 code+=check(`qa_result=0 and farid_potential_debt=100 and farid_debt=0 and ${flag}=1 and ${slot}['id']=41051 and stock_state=${state}`,'bad_deposit_'+label)+snap('bad-source-'+label+'-after');
}
code+=reset()+actor('stock',41052,1)+call('deposit')+actor('stock',42052,0)+"qa_appraisal=0\n"+snap('bad-price-before')+call('deposit');
code+=check(`qa_result=0 and farid_potential_debt=100 and farid_debt=0 and ${flag}=1 and ${slot}['id']=41052 and stock['id']=42052`,'bad_appraisal_keeps_custody')+snap('bad-price-after');
// Old pending money has no proof of the person, even if the current stock looks valid.
for(const[present,label]of [[0,'empty'],[1,'plausible-stock']]){
 code+=reset()+`farid_potential_debt=100\nfarid_debt=25\n`+(present?actor('stock',41001,1):'')+snap('legacy-'+label+'-before')+call('return');
 code+=check(`qa_result=-3 and sparks=100 and farid_potential_debt=100 and farid_debt=25 and ${flag}=0 and slave_state=0`,'legacy_unverified_'+label)+snap('legacy-'+label+'-after');
 code+=call('settle')+check('qa_result=100 and farid_debt=125 and farid_potential_debt=0','legacy_money_settles_'+label)+call('settle')+check('qa_result=0 and farid_debt=125','legacy_money_once_'+label);
}
// Corrupt saved custody state is preserved and never charged as a successful return.
code+=reset()+actor(slot,41061,1)+`${slot}_state=2\n${flag}=1\nfarid_potential_debt=100\n`+actor('stock',42061,0)+snap('bad-slot-before')+call('return');
code+=check(`qa_result=-3 and sparks=100 and farid_potential_debt=100 and ${flag}=1 and ${slot}_state=2 and ${slot}['id']=41061`,'invalid_slot_state')+snap('bad-slot-after');
// Existing fee behavior permits a successful return below five sparks; no new funds gate.
code+=reset()+actor('stock',41071,1)+call('deposit')+"sparks=0\n"+call('return')+check('qa_result=1 and sparks=-5 and slave[\'id\']=41071','original_fee_without_new_gate');
// No helper mode may register the custody slot among owned/daily character lists.
code+=check("arrsize('$all_slave_characters')=2 and $all_slave_characters[0]='slave' and $all_slave_characters[1]='assistant' and arrsize('$unfrozen_slave_characters')=2",'not_owned_or_daily');
const native=runFixture(d,'green-transactions',code);const comparisons=[];
function save(n){return sc.parse(fs.readFileSync(tmp+'/'+n+'.sav'));}
function equalRoles(a,ar,b,br,label){assert.deepEqual(roleView(save(a),ar),roleView(save(b),br),label);comparisons.push(label);}
if(native.results.every(r=>r.pass)){
 for(const label of ['genius','zero-id']){equalRoles('expected-'+label,'stock','returned-'+label,'slave','original_actor_'+label);equalRoles('unrelated-'+label,'stock','returned-'+label,'stock','unrelated_stock_'+label);equalRoles('returned-'+label,'slave','duplicate-'+label,'slave','repeat_preserves_actor_'+label);}
 equalRoles('expected-second','stock','returned-second','slave','replacement_actor_complete');equalRoles('settle-stock-before','stock','settle-stock-after','stock','settlement_collect_unrelated_stock');equalRoles('collect-pending-before',slot,'collect-pending-after',slot,'collect_keeps_new_pending_complete');
 for(const label of ['occupied','bad-source-empty','bad-source-faint','bad-price','legacy-empty','legacy-plausible-stock','bad-slot'])for(const role of ['slave','stock',slot])equalRoles(label+'-before',role,label+'-after',role,'failure_preserves_'+label+'_'+role);
}
const listLines=prepared.d.locations.flatMap(l=>get(prepared.d,l.name).split('\n').filter(s=>/^\s*\$[A-Za-z_]*slave_characters\[/.test(s)));assert(listLines.every(s=>!s.includes(slot)),'Custody slot registered in a standard actor list');
const report={baseline:h.baseline,candidate:prepared.patch.after_sha256,checks,native,canonicalComparisons:comparisons,worldUnchanged:c.hash(fs.readFileSync(game+'/jack.qsp'))===liveBefore,noOriginalSaveLoadedOrWritten:true,instrumentation:['Actual four public helper modes; appraiser fixed to200 or140 or0 to isolate transaction behavior.','Post-transfer display refresh3locations stubbed; original person arrays compared through complete $slave_vars schema.','Only product MSG statements converted to notice counters.'],limits:['Synthetic representative state; actual user save not loaded.','Full GUI navigation and every unrelated acquisition path are outside this isolated test.']};write(rec+'/green-transactions-results.json',report);console.log(JSON.stringify(report));assert(native.results.every(r=>r.pass)&&report.worldUnchanged);
