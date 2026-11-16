'use strict';
const {fs,a,W,T,c,sections,body,inner,region,makeFixture}=require('./shared.cjs');
const mode=process.argv[2];a(['red','green'].includes(mode));
let raw=fs.readFileSync(process.env.JO9_PRIVATE_RULE_QSP||(mode==='green'&&fs.existsSync(T+'/candidate.qsp')?T+'/candidate.qsp':W+'/jack.qsp'));
if(mode==='red'&&fs.existsSync(__dirname+'/patch.json')){
 const patch=JSON.parse(fs.readFileSync(__dirname+'/patch.json','utf8'));
 if(c.hash(raw)===patch.after_sha256){const old=c.parse(raw);for(const e of [...patch.edits].reverse()){const l=old.locations.find(l=>l.name===e.location),b=body(old,e.location);a.equal(b.split(e.new).length,2);old.lines[l.body]=c.shift(b.replace(e.new,()=>e.old),-5);}raw=c.serialize(old);a.equal(c.hash(raw),patch.before_sha256);}
}
const s=sections(raw),call=region(s.next),cr='\r\n';if(mode==='red')a.equal(call,'','RED requires the pre-fix source. Supply JO9_PRIVATE_RULE_QSP when later edits exist.');
const quote=x=>"'"+x.replaceAll("'","''")+"'";
const check=(x,label)=>`qa_checks+=1${cr}if ${x}:msg 'FAIL_${label}' & exit${cr}`;
let code="killall\r\n$onnewloc=''\r\n$ongload=''\r\n$counter=''\r\nsettimer 0\r\nqa_checks=0\r\nCONST_INT['no_slave']=0\r\nCONST_INT['slave_exist']=1\r\nCONST_INT['slave_faint']=2\r\n"+s.foreach+cr+s.mood+cr;
code+=`$dyn_sex_acceptance={interaction_dynslave['sex_acceptance']=0}${cr}`;
code+=`$dyn_repulse_check={
 if interaction_dynslave['repulse']=18:interaction_dynslave['res']=qa_urinal
 if interaction_dynslave['repulse']=26:interaction_dynslave['res']=qa_toilet
 if interaction_dynslave['repulse']=6:interaction_dynslave['res']=qa_wake
}${cr}`.replace(/(?<!\r)\n/g,cr);
code+=`$reset_interaction_variables={stimulating=0 & impotent=0 & disgusting=0}${cr}$sin_gained_now={qa_sin_calls+=1}${cr}$master_ejaculate={qa_ejaculations+=1}${cr}$dyn_advance_sex_skills_nolesson={qa_skill_calls+=1}${cr}$recalc_equipment_bonuses={}${cr}`;
code+=`$slave_bad_mood[0]='neg_disgust'${cr}$slave_bad_mood[1]='neg_rules'${cr}$mood_description['neg_disgust']='QA_NEG_DISGUST <<$dynslave_name>>'${cr}$mood_description['neg_rules']='QA_NEG_RULES <<$dynslave_name>>'${cr}$mood_description['pos_']='QA_CALM <<$dynslave_name>>'${cr}`;
const actorNames=['slave','assistant','room1','room2','room3','room4'];
const base={ego:2,pride:1,temper:1,sensitivity:2,intellect:1,moral:1,instinct:1,sin:2,sub_piss:3,sub_kopro:4,sub_bj:4,age:0,stamina:3};
function seed(actor,opts={}){let out=`killvar '${actor}'${cr}killvar '$${actor}'${cr}killvar '${actor}_rate'${cr}killvar 'interaction_${actor}'${cr}${actor}_state=${opts.state??1}${cr}$${actor}_name='QA_PERSON'${cr}$${actor}_psy_status='calm'${cr}`;
 for(const[k,v]of Object.entries({...base,perversion:opts.perversion??0,urinal_rule:opts.urinal??0,toilet_rule:opts.toilet??0,force_rules:opts.force??0,blowjob_rule:opts.wake?1:0,duty:opts.duty??0,...(opts.fields||{})}))out+=`${actor}[${quote(k)}]=${v}${cr}`;
 return out;}
function globals(o){return `killvar 'master_moodlet'${cr}master_mood_rate=0${cr}qa_skill_calls=0${cr}qa_sin_calls=0${cr}qa_ejaculations=0${cr}overnight_rules_count=7${cr}qa_urinal=${o.refuse?-1:1}${cr}qa_toilet=${o.refuse?-1:1}${cr}qa_wake=${o.wakeRefuse?-1:1}${cr}inventory['pissuar_stable']=${o.furniture??1}${cr}inventory['toilet_stable']=${o.furniture??1}${cr}master_excitement=2${cr}master_penetration=0${cr}master_style=2${cr}master_ill=0${cr}`;}
function cleanActors(){return actorNames.map(n=>`killvar '${n}'${cr}killvar '$${n}'${cr}killvar '${n}_rate'${cr}killvar 'interaction_${n}'${cr}${n}_state=0${cr}`).join('');}
const wakePrefix=inner(s.wakeAccept).split("\tif dynslave['num_rules_broken'] > 0:")[0];
const wakeFollow=inner(s.wakeEffects).split("\tif dynslave['num_rules_wanttobreak'] > 0:")[0];
const reference=o=>{
 let ref="slave['num_rules_broken']=0\r\nslave['num_rules_wanttobreak']=0\r\n$slave['rules_explanations']=''\r\n";
 if(o.wake)ref+=wakePrefix.replaceAll('dynslave','slave')+cr;
 ref+=s.accept+cr+s.refusal+cr+s.effects+cr;
 if(o.wake)ref+=wakeFollow.replaceAll('dynslave','slave')+cr;
 return ref+s.forced+cr;
};
const dataFields=['num_rules_broken','num_rules_wanttobreak','urinal_rule_broken','toilet_rule_broken','rules_broken','neg_rules','neg_disgust','perversion_xp','sin'];
const rateFields=['custom','pride','hygiene','angst','mood','moral','rational','instinct','ego'];
const cases=[
 {name:'urinal',urinal:1},{name:'toilet',toilet:1},
 {name:'urinal-trained',urinal:1,perversion:1},{name:'toilet-trained',toilet:1,perversion:2},
 {name:'refused-urinal',urinal:1,refuse:true},{name:'refused-toilet',toilet:1,refuse:true},
 {name:'forced-urinal',urinal:1,refuse:true,force:1},{name:'forced-toilet',toilet:1,refuse:true,force:1},
 {name:'no-furniture',urinal:1,refuse:true,force:1,furniture:0},
 {name:'both',urinal:1,toilet:1},
 {name:'wake-refusal',urinal:1,refuse:true,wake:true,wakeRefuse:true},
 {name:'wake-force-cap',toilet:1,refuse:true,force:1,wake:true,wakeRefuse:true,fields:{intellect:1}},
];
let scenarios=0;
for(const actor of ['room1','room2','room3','room4'])for(const o of cases){
 scenarios++;const id=actor+'_'+o.name.replaceAll('-','_');
 code+=cleanActors()+seed('slave',o)+globals(o)+reference(o);
 code+=`copyarr 'qa_expected','slave'${cr}copyarr '$qa_expected','$slave'${cr}copyarr 'qa_expected_rate','slave_rate'${cr}copyarr 'qa_expected_master','master_moodlet'${cr}qa_expected_mood=master_mood_rate${cr}qa_expected_skill=qa_skill_calls${cr}qa_expected_sin=qa_sin_calls${cr}qa_expected_ejaculations=qa_ejaculations${cr}`;
 code+=cleanActors()+seed(actor,o)+globals(o)+"slave['custom']=71\r\nslave_rate['custom']=72\r\nassistant['custom']=81\r\nassistant_rate['custom']=82\r\n";
 if(o.wake)code+=`$jo9_wake_worker='${actor}'${cr}`+s.wakeAccept+cr+s.wakeEffects+cr+`dynamic $replace($jo9_wake_accept,'dyn'+'slave','${actor}'), '${actor}'${cr}dynamic $replace($jo9_wake_effects,'dyn'+'slave','${actor}'), '${actor}'${cr}`;
 else code+="$jo9_wake_worker=''\r\n";
 code+=call+cr;
 for(const k of dataFields)code+=check(`${actor}[${quote(k)}] ! qa_expected[${quote(k)}]`,id+'_'+k);
 for(const k of rateFields)code+=check(`${actor}_rate[${quote(k)}] ! qa_expected_rate[${quote(k)}]`,id+'_rate_'+k);
 code+=check(`$${actor}['rules_explanations'] ! $qa_expected['rules_explanations']`,id+'_text');
 code+=check('master_mood_rate ! qa_expected_mood',id+'_master_mood')+check('qa_skill_calls ! qa_expected_skill',id+'_skills')+check('qa_sin_calls ! qa_expected_sin',id+'_sin_calls')+check('qa_ejaculations ! qa_expected_ejaculations',id+'_wake_calls');
 for(const k of ['pos_toilet','neg_rebell','pos_nice_slave','pos_good_morning'])code+=check(`master_moodlet[${quote(k)}] ! qa_expected_master[${quote(k)}]`,id+'_master_'+k);
 code+=check('overnight_rules_count ! 7',id+'_primary_rule_count')+check("slave['custom'] ! 71 or slave_rate['custom'] ! 72",id+'_primary_unchanged')+check("assistant['custom'] ! 81 or assistant_rate['custom'] ! 82",id+'_assistant_unchanged');
 code+=`dynamic $replace($recalc_slave_mood,'dyn'+'slave','${actor}')${cr}$qa_mood=''${cr}for qa_i=0 to arrsize('$${actor}_mood_list')-1 step 1:$qa_mood+=$${actor}_mood_list[qa_i]${cr}`;
 code+=check(`iif(instr($qa_mood,'QA_NEG_DISGUST')>0,1,0) ! iif(${actor}['neg_disgust']>0,1,0)`,id+'_mood_display');
}
for(const actor of ['room1','room2','room3','room4'])for(const duty of [2,3,4]){
 scenarios++;code+=cleanActors()+seed(actor,{urinal:1,toilet:1,duty})+globals({})+"$jo9_wake_worker=''\r\n"+call+cr;
 code+=check(`${actor}_rate['custom'] ! 0 or ${actor}_rate['hygiene'] ! 0 or ${actor}['neg_disgust'] ! 0`,actor+'_external_'+duty);
}
for(const actor of ['room1','room2','room3','room4']){
 scenarios++;code+=cleanActors()+seed(actor,{state:2,urinal:1,toilet:1})+globals({})+"$jo9_wake_worker=''\r\n"+call+cr;
 code+=check(`${actor}_rate['custom'] ! 0 or ${actor}['neg_disgust'] ! 0`,actor+'_fainted');
 scenarios++;code+=cleanActors()+seed(actor,{})+globals({})+`$${actor}['rules_explanations']='OLD_RULES'${cr}$jo9_wake_worker=''${cr}`+call+cr;
 code+=check(`$${actor}['rules_explanations'] ! ''`,actor+'_rules_off_clear');
}
scenarios++;code+=cleanActors()+globals({})+"$jo9_wake_worker=''\r\n";
for(const actor of ['room1','room2','room3','room4'])code+=seed(actor,{urinal:1});
code+=call+cr;for(const actor of ['room1','room2','room3','room4'])code+=check(`${actor}_rate['custom'] ! 2`,actor+'_once');
const marker='JO9_QA_PRIVATERULES_'+mode+'_COMPLETE';code+=`msg '${marker}'`;
fs.mkdirSync(T,{recursive:true});fs.writeFileSync(T+'/'+mode+'.qsp',makeFixture(code,[['jo9_origin_growth','result=args[3]']]));fs.copyFileSync(W+'/config.xml',T+'/config.xml');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(T+'/'+mode+'-plan.json',JSON.stringify([{name:mode,file:T+'/'+mode+'.qsp',marker,checkpoint:'Private rule parity, states, external duties, wake overlap and mood display'}],null,2));
fs.writeFileSync(__dirname+'/'+mode+'-fixture.json',JSON.stringify({input:c.hash(raw),scenarios,assertions:(code.match(/qa_checks\+=1/g)||[]).length,expectedMissingCall:mode==='red'},null,2));console.log(JSON.stringify({mode,scenarios,assertions:(code.match(/qa_checks\+=1/g)||[]).length,bytes:Buffer.byteLength(code)}));
