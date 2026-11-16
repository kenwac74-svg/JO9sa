'use strict';
const fs=require('fs'),a=require('assert/strict'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const D=__dirname,G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/handoff-b-occupation-20261112';
const m=JSON.parse(fs.readFileSync(D+'/module.json','utf8')),specs=JSON.parse(fs.readFileSync(D+'/occupation-specs.source.json','utf8'));
const activity=JSON.parse(fs.readFileSync('G:/somi/JO9sa/records/handoff-b-activity-20261112/activity.mod.json','utf8'));
const raw=fs.readFileSync(process.env.OCCUPATION_BASELINE||G+'/jack.qsp'),d=c.parse(raw),nl=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+s.replaceAll("'","''")+"'";
let traits=c.shift(d.lines[d.locations.find(x=>x.name==='jo9_traits').body],5);for(const e of activity.edits.filter(e=>e.location==='jo9_traits')){a.equal(traits.split(e.old).length-1,e.count);traits=traits.replace(e.old,e.new);}
const helper=m.add_locations[0].body;
function fixture(name,start,helperSource=helper){const lines=d.lines.slice(0,4),locs=[{name:'Start',body:start},{name:'jo9_occupation_init',body:helperSource},{name:'jo9_traits',body:traits},...activity.add_locations];lines[3]=c.shift(String(locs.length),-5);for(const l of locs)lines.push(c.shift(l.name,-5),'',c.shift(nl(l.body),-5),c.shift('0',-5));lines.push('');const output=c.serialize({lines});c.parse(output);const dir=T+'/'+name;fs.mkdirSync(dir,{recursive:true});fs.copyFileSync(G+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(dir+'/test.qsp',output);fs.writeFileSync(dir+'/plan.json',JSON.stringify([{name:'occupation-'+name,file:dir+'/test.qsp',marker:'JO9_QA_OCCUPATION_'+name+'_COMPLETE',checkpoint:'Actual occupation helper and current activity module; no personal saves'}],null,2));}
const prefix="killall\n$onnewloc=''\n$ongload=''\n$counter=''\nsettimer 0\nqa_checks=0\nqa_failed=0\n";
const setup=occ=>`killvar 'stock'\nkillvar 'stock_rate'\nstock['jo9_bg_random']=1\nstock['ego']=3\nstock['pride']=3\nstock['stamina']=1\nstock['beauty']=5\nstock['manual_progress']=71\nspecial_stock=0\ncreating_clone=0\ndifficulty_setting=2\n$stock_occupation=${q(occ)}\nqa_occ_index=-1\nqa_occ_calls=0\nkillvar 'qa_occ_draw'\n`;
const expr=t=>t.id==='activity_sign = -1'?"func('jo9_traits','activity_value','stock','jo9_work_ethic') = -1":`stock[${q(t.key)}] ${t.id.slice(t.key.length).trim()}`;
let s=prefix,checks=0;
const check=(condition,label)=>{s+=`qa_checks+=1\nif (${condition}) = 0:\n qa_failed+=1\n $qa_errors[]=${q(label)}\nend\n`;checks++;};
for(const spec of specs.specs)for(const occ of spec.occupations){s+=setup(occ.id)+"qa_occ_mode=1\ngs 'jo9_occupation_init'\n";for(const r of spec.rules.filter(r=>r.status==='확정')){if(r.type==='chance'||r.type==='grant')check(expr(r.trait),occ.id+' '+r.trait.id);if(r.type==='exclude'||r.type==='forbid')check('('+expr(r.trait)+') = 0',occ.id+' excludes '+r.trait.id);if(r.type==='skillMin')check(`stock[${q(r.skill.key)}] >= ${r.minValue}`,occ.id+' skill '+r.skill.key);if(r.type==='skillExclude')check(`stock[${q(r.skill.key)}] >= ${r.grades.includes('D')?2:1}`,occ.id+' skill exclude '+r.skill.key);}
check("stock['manual_progress']=71",occ.id+' preserve unrelated progress');}
for(const [flag,sp,cl]of [[0,0,0],[1,1,0],[1,0,1]]){s+=setup('mech')+`stock['jo9_bg_random']=${flag}\nspecial_stock=${sp}\ncreating_clone=${cl}\nstock['meekness']=5\nstock['jo9_focus']=-1\nstock['jo9_work_ethic']=1\nqa_occ_mode=1\ngs 'jo9_occupation_init'\n`;for(const k of ['defiant','sport_affinity'])check(`stock[${q(k)}]=0`,'fixed/clone '+flag+sp+cl+' '+k);check("stock['meekness']=5",'fixed preserves raw axis');check("stock['jo9_focus']=-1",'fixed skips canonical rewrite');}
for(const spec of specs.specs)for(const r of spec.rules.filter(r=>r.type==='exclude'||r.type==='forbid')){const t=r.trait,v=t.id.includes('<')?-1:t.id.includes('>')?1:+t.id.split('=').at(-1).trim();s+=setup(spec.occupations[0].id)+`stock[${q(t.key)}]=${t.key==='virginity'?0:v}\nqa_occ_mode=2\ngs 'jo9_occupation_init'\n`;check('('+expr(t)+')=0','explicit forbidden '+spec.label+' '+t.id);}
for(const [occ,k,v]of [['artist','jo9_ambition',1],['huntress','grace',-1]]){s+=setup(occ)+`stock[${q(k)}]=${v}\n`;if(occ==='huntress')s+="stock['metabolism']=4\n";s+="qa_occ_mode=1\ngs 'jo9_occupation_init'\n";check('qa_occ_calls=0','already held target not rerolled '+occ);}
const queue=draws=>"qa_occ_mode=3\n"+draws.map((v,i)=>`qa_occ_draw[${i}]=${v}`).join('\n')+"\ngs 'jo9_occupation_init'\n";
for(const [draws,aff,courage,combat]of [[[20,1,20,1],1,0,1],[[20,2,20,3],0,1,3],[[21],0,0,0],[[20,2,21],0,1,0]]){s+=setup('heroine')+"stock['gladiatrix_affinity']=1\nstock['courage']=1\nstock['jo9_combat_trait']=2\n"+queue(draws);check(`stock['gladiatrix_affinity']=${aff}`,'heroine first '+draws);check(`stock['courage']=${courage}`,'heroine courage '+draws);check(`stock['jo9_combat_trait']=${combat}`,'heroine upper '+draws);}
for(const [roll,want]of [[30,2],[31,1],[60,1],[61,0]]){s+=setup('sufragist')+queue([roll]);check(`stock['homosexualism']=${want}`,'group boundary '+roll);}
for(const [occ,extra,assertion]of [['mech',"stock['meekness']=5\nstock['jo9_slave_nature']=1\nstock['cowSK_affinity']=1\n","stock['defiant']=1 and stock['meekness']=0 and stock['jo9_slave_nature']=0 and stock['sport_affinity']=1 and stock['cowSK_affinity']=0"],['serial_killer',"stock['darkness_attitude']=-1\nstock['blood_attitude']=-1\nstock['fire_attitude']=-1\nstock['water_attitude']=-1\nstock['vermin_attitude']=-1\nstock['deprivation_attitude']=-1\n","stock['courage']=2 and stock['darkness_attitude']=0 and stock['fire_attitude']=0 and stock['vermin_attitude']=0"],['writer',"stock['jo9_voice_trait']=1\n","stock['expression_affinity']=1 and stock['jo9_voice_trait']=0 and stock['jo9_learning_trait']=1 and stock['intellect']=5"]]){s+=setup(occ)+extra+"qa_occ_mode=1\ngs 'jo9_occupation_init'\n";check(assertion,'rejection '+occ);}
s+=setup('major')+"stock['jo9_work_ethic']=1\nstock['passion_comfort']=-1\nqa_occ_mode=1\ngs 'jo9_occupation_init'\n";check("stock['jo9_work_ethic']=1 and stock['passion_comfort']=-1 and stock['cowSK_affinity']=0",'positive upper retained major');
s+=setup('weaver')+"stock['jo9_work_ethic']=1\nstock['passion_comfort']=-1\nqa_occ_mode=1\ngs 'jo9_occupation_init'\n";check("stock['jo9_work_ethic']=1 and stock['jo9_focus']=0",'upper folds perseverance');
s+=setup('major')+"stock['jo9_focus']=1\nqa_occ_mode=1\ngs 'jo9_occupation_init'\n";check("stock['jo9_focus']=1 and stock['jo9_work_ethic']=0 and stock['passion_comfort']=0",'positive lower beats negative upper');
s+="savegame 'qa.sav'\nif qa_failed>0: msg 'FAIL occupation '+str(qa_failed)+' '+$qa_errors[0] & exit\nmsg 'JO9_QA_OCCUPATION_deterministic_COMPLETE'\nexit\n";
const deterministic=helper.replace('result = rand(1,args[1])',"qa_occ_calls += 1\n if qa_occ_mode = 1: result = 1 & exit\n if qa_occ_mode = 2: result = args[1] & exit\n if qa_occ_mode = 3:\n  qa_occ_index += 1\n  result = args[1]\n  if qa_occ_index < arrsize('qa_occ_draw'): result = qa_occ_draw[qa_occ_index]\n  exit\n end\n result = rand(1,args[1])");
fixture('deterministic',s,deterministic);
// True RNG smoke uses the production source without replacing its draw function.
let random=prefix;
for(const occ of ['huntress','nun','serial_killer','sorceress','mprincess','voleyball','writer','model','major','weaver','heroine']){random+=setup(occ)+"qa_i=0\n:qa_sample_"+occ+"\nkillvar 'stock'\nkillvar 'stock_rate'\nstock['jo9_bg_random']=1\nstock['ego']=3\nstock['pride']=3\nstock['stamina']=3\nstock['beauty']=5\n";
const source=c.shift(d.lines[d.locations.find(x=>x.name==='generate_stock').body],5),get=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
random+=get('\t!TRAITS\r\n\tstock[\'metabolism\']','\t!ILLNESS');
random+="if stock['gladiatrix_affinity']=1: stock['cowSK_affinity']=0 & stock['dressage_affinity']=0 & stock['pet_affinity']=0\ngs 'jo9_traits','attention_fresh','stock'\n";
random+=get('! JO9 MOD START COG_GENERATE','! JO9 MOD END COG_GENERATE');
random+="gs 'jo9_traits','generate'\ngs 'jo9_occupation_init'\n";
const rs=specs.specs.filter(s=>s.occupations.some(o=>o.id===occ)).flatMap(s=>s.rules).filter(r=>r.trait&&['chance','grant','exclude','forbid'].includes(r.type));
for(const r of rs)random+=`if ${expr(r.trait)}: qa_sample[${q(occ+'|'+r.trait.id)}]+=1\n`;
if(occ==='heroine')random+="if stock['gladiatrix_affinity']=1 or stock['courage']=1: qa_sample['heroine|entry']+=1\nif stock['jo9_combat_trait']>0: qa_sample['heroine|upper']+=1\n";
random+=`qa_i+=1\nif qa_i<1000: jump 'qa_sample_${occ}'\n`;}
random+="savegame 'qa.sav'\nmsg 'JO9_QA_OCCUPATION_samples_COMPLETE'\nexit\n";
fixture('samples',random);fs.writeFileSync(D+'/native-fixtures.json',JSON.stringify({temporaryRoot:T,checks,sourceHash:d.hash,activityModule:activity.id,randomSamples:11000},null,2));console.log(JSON.stringify({temporaryRoot:T,deterministicChecks:checks,samples:11000}));

// Optional focused reproduction for the positive-meekness sample audit.
if(process.argv.includes('--focused')){
 const a=random.indexOf('qa_i=0\n:qa_sample_sorceress'),z=random.indexOf("if qa_i<1000: jump 'qa_sample_sorceress'",a)+"if qa_i<1000: jump 'qa_sample_sorceress'".length;
 let focused=random.slice(a,z).replace('qa_i<1000','qa_i<10000').replace("gs 'jo9_occupation_init'","if stock['meekness']>0: qa_basepositive+=1\ngs 'jo9_occupation_init'");
 focused=prefix+"$stock_occupation='sorceress'\nspecial_stock=0\ncreating_clone=0\ndifficulty_setting=2\n"+focused+"\nsavegame 'qa.sav'\nmsg 'JO9_QA_OCCUPATION_focused_COMPLETE'\nexit\n";
 fixture('focused',focused);
}
