'use strict';
// Isolated actual-engine tests; modifies diagnostic world copies only.
const fs=require('node:fs'),path=require('node:path');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs'),codec=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const opts={};for(let i=2;i<process.argv.length;i+=2)opts[process.argv[i].replace(/^--/,'')]=process.argv[i+1];
const work='G:/somi/Jack O Nine Tails v2.4_work/game',input=opts.input||work+'/jack.qsp',out=opts.out;
if(!out||fs.existsSync(out))throw Error('Fresh --out required');
let raw=fs.readFileSync(input),originalHash=c.hash(raw);
if(opts.transform==='yes'){
 const d=c.parse(raw),m=new Map(d.locations.map(l=>[l.name,c.shift(d.lines[l.body],5)])),t=require('./trait-transform.cjs').transformLocations(m);
 for(const l of d.locations)d.lines[l.body]=c.shift(t.locations.get(l.name).replace(/\r?\n/g,'\r\n'),-5);raw=c.serialize(d);
}
const base=c.parse(raw),prime=qa.primeState(codec.parse(fs.readFileSync(work+'/save/spete_dialogue_test.sav')));
const body=name=>c.shift(base.lines[base.locations.find(l=>l.name===name).body],5);
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
const a=(expr,label)=>['if '+expr+':','else','$qa_errors+='+q(label+'|'),'end'];
const roles=['slave','assistant','room1','room2','room3','room4'];
const keys=['oral_affinity','anal_affinity','jo9_gag_reflex','jo9_voice_trait','defiant','jo9_defiant_resolved','jo9_oral_xp_credit','jo9_anal_xp_credit','jo9_learning_trait','jo9_focus_active'];
const clear=r=>keys.map(k=>r+'['+q(k)+']=0');
const setup=['killall',prime.code,"$onnewloc=''",'snk_room_target=0','nsfw=0','sound_on=0',"$qa_errors=''","gs 'refresh_database'",'no_mindbreak=1'];
for(const r of roles)setup.push(r+"_state=CONST_INT['slave_exist']",r+"['ego']=3",r+"['temper']=3",r+"['pride']=3",r+"['moral']=1",r+"_rate['pride']=0",r+"_rate['moral']=0",'$'+r+"_psy_status='obedient'",'$'+r+"_psy_basic='obedient'",...clear(r));
const tests=[];
const helper=[];
for(const r of roles){
 helper.push(...clear(r),"qa_n=func('jo9_traits','restored_xp',"+q(r)+",'sub_bj',2)",...a('qa_n=2','zero_xp_'+r),...a(r+"['jo9_oral_xp_credit']=0 and "+r+"['jo9_anal_xp_credit']=0",'zero_credit_'+r));
 helper.push("qa_n=func('jo9_traits','restored_acceptance',"+q(r)+",'sub_bj')",...a('qa_n=0','zero_acceptance_'+r));
 helper.push(r+"['oral_affinity']=1","qa_n=func('jo9_traits','restored_xp',"+q(r)+",'sub_bj',2)",...a('qa_n=3','oral_xp_'+r));
 helper.push("qa_a=func('jo9_traits','restored_xp',"+q(r)+",'sub_dt',1)","qa_b=func('jo9_traits','restored_xp',"+q(r)+",'sub_dt',1)",...a('qa_a=1 and qa_b=2','carry_'+r));
 helper.push("qa_n=func('jo9_traits','restored_xp',"+q(r)+",'sub_hj',2)",...a('qa_n=2','unrelated_xp_'+r));
 helper.push("qa_n=func('jo9_traits','restored_xp',"+q(r)+",'sub_bj',-2)",...a('qa_n=-2','negative_xp_'+r));
 helper.push("qa_n=func('jo9_traits','restored_acceptance',"+q(r)+",'sub_bj')",...a('qa_n=2','oral_acceptance_'+r));
 helper.push(r+"['jo9_gag_reflex']=1","qa_n=func('jo9_traits','restored_acceptance',"+q(r)+",'sub_bj')",...a('qa_n=0','gag_net_'+r),"qa_n=func('jo9_traits','restored_acceptance',"+q(r)+",'sub_kiss')",...a('qa_n=2','gag_not_kiss_'+r));
 helper.push(r+"['oral_affinity']=0","qa_n=func('jo9_traits','restored_acceptance',"+q(r)+",'sub_dt')",...a('qa_n=-2','gag_penalty_'+r),"qa_n=func('jo9_traits','restored_acceptance',"+q(r)+",'sub_tongue')",...a('qa_n=0','gag_not_tongue_'+r));
 helper.push(r+"['anal_affinity']=1","qa_n=func('jo9_traits','restored_xp',"+q(r)+",'sub_anal',2)",...a('qa_n=3','anal_xp_'+r),"qa_n=func('jo9_traits','restored_acceptance',"+q(r)+",'anal_stretch')",...a('qa_n=2','anal_acceptance_'+r));
 helper.push(r+"['anal_affinity']=-1","qa_n=func('jo9_traits','restored_xp',"+q(r)+",'sub_anal',2)",...a('qa_n=2','anal_no_xp_penalty_'+r),"qa_n=func('jo9_traits','restored_acceptance',"+q(r)+",'sub_anal')",...a('qa_n=-2','anal_averse_'+r),"qa_n=func('jo9_traits','restored_acceptance',"+q(r)+",'cook')",...a('qa_n=0','unrelated_acceptance_'+r));
 helper.push(...clear(r));
}
// Same role normalization used by the real delayed lesson code.
helper.push("slave['oral_affinity']=1",'qa_n=func(\'jo9_traits\',\'restored_xp\',\'slave\',\'slave["sub_bj"]\',2)',...a('qa_n=3','expression_subject'),...clear('slave'));
tests.push({name:'traits-effect-helpers',code:helper,checkpoint:'All six roles; zero flags, +50% exact carry, unrelated/negative neutrality, oral/gag/anal acceptance and actual subskill-expression normalization.'});
const caller=[
 ...clear('slave'),"$slave_psy_status='obedient'","slave['mood']=0","slave['moral']=1","slave['pride']=3","slave['intellect']=3","slave['arousal']=0","slave['sex_sum']=0","slave['nymphomania']=0","slave['homosexualism']=1",'master_style=5','hero_choice=1','stimulating=1','orgastic=0','shameful=0','painful=0','disgusting=0','lesbian=0',"$interaction_type='self_sex_lesson'",'$subskill=\'slave["sub_bj"]\'',"dynamic $replace($dyn_sex_acceptance,'dyn'+'slave','slave')","qa_base=interaction_slave['sex_acceptance']","slave['oral_affinity']=1","dynamic $replace($dyn_sex_acceptance,'dyn'+'slave','slave')",...a("interaction_slave['sex_acceptance']=qa_base+2",'live_acceptance_oral'),"slave['jo9_gag_reflex']=1","dynamic $replace($dyn_sex_acceptance,'dyn'+'slave','slave')",...a("interaction_slave['sex_acceptance']=qa_base",'live_acceptance_gag'),
 '$subskill=\'slave["sub_hj"]\'',"dynamic $replace($dyn_sex_acceptance,'dyn'+'slave','slave')",...a("interaction_slave['sex_acceptance']=qa_base",'live_acceptance_other'),
 ...clear('slave'),"slave['oral_affinity']=1","slave['sub_bj']=1","slave['sub_bj_xp']=0",'$subskill=\'slave["sub_bj"]\'','$subskill_xp=\'slave["sub_bj_xp"]\'',"$subskill_two=''","$subskill_two_xp=''",'success=4','rise_difficulty=10000','skill_adv_mul=1',"dynamic $replace($dyn_advance_sex_skills,'dyn'+'slave','slave')",...a("slave['sub_bj_xp']=6",'live_primary_xp'),
 "slave['oral_affinity']=0","slave['anal_affinity']=1","slave['jo9_anal_xp_credit']=0","slave['sub_bj_xp']=0","slave['sub_anal']=2","slave['sub_anal_xp']=0",'$subskill_two=\'slave["sub_anal"]\'','$subskill_two_xp=\'slave["sub_anal_xp"]\'',
 'success=4',"dynamic $replace($dyn_advance_sex_skills,'dyn'+'slave','slave')",'success=4',"dynamic $replace($dyn_advance_sex_skills,'dyn'+'slave','slave')",...a("slave['sub_anal_xp']=3",'live_secondary_xp')
];
tests.push({name:'traits-live-callers',code:caller,checkpoint:'Original #dynamic acceptance and primary/secondary lesson XP code executed with actual role substitution, not replacement formulas.'});
const devotion=[];
for(const r of roles){
 devotion.push(...clear(r),r+"['defiant']=1",r+"['pride']=3",'$'+r+"_psy_status='obedient'",r+"['moral']=1",r+"_rate['moral']=20","gs 'jo9_traits','restored_refresh',"+q(r),...a(r+"['moral']=1 and "+r+"_rate['moral']=0 and "+r+"['defiant']=1",'blocked_'+r));
 devotion.push(r+"_rate['moral']=-5","gs 'jo9_traits','restored_refresh',"+q(r),...a(r+"_rate['moral']=-5",'negative_moral_'+r));
 devotion.push(r+"['pride']=0",r+"_rate['moral']=20","gs 'jo9_traits','restored_refresh',"+q(r),...a(r+"['defiant']=0 and "+r+"['jo9_defiant_resolved']=1 and "+r+"_rate['moral']=20",'resolved_pride_'+r));
 devotion.push(r+"['defiant']=1",r+"['jo9_defiant_resolved']=0",r+"['pride']=3",'$'+r+"_psy_status='broken'","gs 'jo9_traits','restored_refresh',"+q(r),...a(r+"['defiant']=0 and "+r+"['jo9_defiant_resolved']=1",'resolved_broken_'+r));
 devotion.push(...clear(r));
}
devotion.push("slave['defiant']=1","slave['moral']=1","slave_rate['moral']=100","slave['pride']=3","slave_rate['pride']=0","slave['ego']=3","slave['temper']=3","$slave_psy_status='obedient'", "dynamic $replace($dyn_calc_slave_attrs,'dyn'+'slave','slave')",...a("slave['moral']=1 and slave_rate['moral']=0 and slave['defiant']=1",'live_attrs_moral_block'));
const city=body('interaction_city');
for(const[id,minimum]of[[227581,2],[227582,3],[227583,3]]){
 const start=city.indexOf('IF interaction_city = '+id+':'),end=city.indexOf('\nEND',start);
 const actual=city.slice(start,end).split(/\r?\n/).find(l=>l.includes('if slave["moral"] < '+minimum));
 if(!actual)throw Error('Missing direct moral assignment '+id);
 devotion.push("slave['defiant']=1","slave['moral']=1","slave['pride']=3","$slave_psy_status='obedient'",actual,...a("slave['moral']=1",'direct_moral_block_'+id));
 devotion.push("slave['defiant']=0",actual,...a("slave['moral']="+minimum,'direct_moral_zero_parity_'+id));
 devotion.push("slave['defiant']=1","slave['moral']=1","slave['pride']=0",actual,...a("slave['moral']="+minimum,'direct_moral_resolved_'+id));
}
tests.push({name:'traits-devotion',code:devotion,checkpoint:'Six roles preserve existing moral and negative changes, resolve on pride/broken, then original stat-recalculation path blocks actual positive devotion progression.'});
const seeds=[
 'stock_type=900001','seed_oral_affinity[stock_type]=1','seed_anal_affinity[stock_type]=-1','seed_defiant[stock_type]=1','seed_jo9_gag_reflex[stock_type]=1','seed_jo9_voice_trait[stock_type]=2',"gs 'get_stock_seed'",...a("stock['oral_affinity']=1 and stock['anal_affinity']=-1 and stock['defiant']=1 and stock['jo9_gag_reflex']=1 and stock['jo9_voice_trait']=2",'fixed_seed_fields'),
 'stock_type=900002',"gs 'get_stock_seed'",...a("stock['oral_affinity']=0 and stock['anal_affinity']=0 and stock['defiant']=0 and stock['jo9_gag_reflex']=0 and stock['jo9_voice_trait']=0",'missing_seed_zero'),
 "slave['oral_affinity']=1","slave['anal_affinity']=-1","slave['defiant']=1","slave['jo9_voice_trait']=2","slave['jo9_gag_reflex']=1",'qa_oral=0','qa_gag=0','qa_analpos=0','qa_analneg=0','qa_defiant=0','qa_voice1=0','qa_voice2=0','qa_i=0',':qa_generate_loop',"gs 'jo9_traits','generate'",...a("stock['oral_affinity']>=0 and stock['oral_affinity']<=1 and stock['anal_affinity']>=-1 and stock['anal_affinity']<=1 and stock['jo9_gag_reflex']>=0 and stock['jo9_gag_reflex']<=1 and stock['jo9_voice_trait']>=0 and stock['jo9_voice_trait']<=2",'generation_bounds'),"qa_oral+=stock['oral_affinity']","qa_gag+=stock['jo9_gag_reflex']","qa_defiant+=stock['defiant']","if stock['anal_affinity']=1: qa_analpos+=1","if stock['anal_affinity']=-1: qa_analneg+=1","if stock['jo9_voice_trait']=1: qa_voice1+=1","if stock['jo9_voice_trait']=2: qa_voice2+=1",'qa_i+=1',"if qa_i<2000: jump 'qa_generate_loop'",...a('qa_oral>0 and qa_gag>0 and qa_analpos>0 and qa_analneg>0 and qa_defiant>0 and qa_voice1>0 and qa_voice2>0','generation_variants'),...a("slave['oral_affinity']=1 and slave['anal_affinity']=-1 and slave['defiant']=1 and slave['jo9_voice_trait']=2 and slave['jo9_gag_reflex']=1",'existing_actor_no_reroll')
];
tests.push({name:'traits-seeds-generation',code:seeds,checkpoint:'Actual get_stock_seed restores configured keys and absent keys to zero; stock generation produces bounded variants and preserves an existing slave.'});
fs.mkdirSync(out,{recursive:true});fs.cpSync(work+'/json',out+'/json',{recursive:true});fs.copyFileSync(work+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plan=[];
for(const test of tests.filter(t=>!opts.only||opts.only.split(',').includes(t.name))){
 const d=c.parse(raw),l=d.locations.find(l=>l.name==='Start'),marker='JO9_QA_ARGONTRAITEFFECTS_'+test.name.replaceAll('-','_')+'_COMPLETE';
 d.lines[l.body]=c.shift([...setup,...test.code,"if $qa_errors!'': msg 'JO9_QA_ASSERTION_FAILED_'+$qa_errors","if $qa_errors='': msg "+q(marker)].join('\r\n'),-5);
 const bytes=c.serialize(d);qa.inspectWorld(bytes);const file=path.join(out,test.name+'.qsp');fs.writeFileSync(file,bytes);plan.push({name:test.name,file,marker,checkpoint:test.checkpoint});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2));fs.writeFileSync(out+'/prepared.json',JSON.stringify({input,originalHash,inputHash:c.hash(raw),probes:plan.length,limits:['Primed actual save-state symbols in diagnostic worlds; no GUI save load or navigation.','Generation bounded sampling verifies presence and bounds, not exact probability distribution.','Original game text is executed only as data; no new narrative is authored in tests.']},null,2));
console.log(JSON.stringify({out,inputHash:c.hash(raw),probes:plan.length}));
