'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const mode=process.argv[2]||'green',input='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(input),hash=c.hash(raw);
assert.equal(hash,'dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae');
const doc=c.parse(raw);
if(mode!=='red'){
 const patch=JSON.parse(fs.readFileSync(__dirname+'/2026-10-28_chaotic_priority.json','utf8'));
 for(const e of patch.edits){const l=doc.locations.find(l=>l.name===e.location),b=c.shift(doc.lines[l.body],5);assert.equal(b.split(e.old).length-1,e.count);doc.lines[l.body]=c.shift(b.replace(e.old,()=>e.new),-5);}
}
let code="usehtml=1\n$onnewloc=''\n$counter=''\nCONST_INT['no_slave']=0\nslave_state=1\nassistant_state=1\n",checks=0;
if(mode!=='red'){
 const get=n=>{const l=doc.locations.find(l=>l.name===n);return c.shift(doc.lines[l.body],5).replace(/\r\n/g,'\n');};
 const fn=(loc,name)=>{const s=get(loc),a=s.indexOf(name+' = {');assert(a>=0,name);const b=s.indexOf('\n}',a);assert(b>a,name+' closing body');return s.slice(a,b+2);};
 code+="gs '#variative'\n"+fn('#static_base','$dyn_calc_slave_attrs')+'\n'+fn('next_day','$next_day_resolve_previous_day_calorie_effects')+'\n';
}
const check=(condition,label)=>{const terms=condition.split(' and ');for(let i=0;i<terms.length;i+=8){checks++;code+=`if (${terms.slice(i,i+8).join(' and ')})=0: msg 'FAIL_CHAOS_${label}${i?'_'+i:''}' & exit\n`;}};
const setup=(role,fields)=>{code+=`killvar '${role}'\nkillvar '$${role}'\n${role}_state=1\nchaotic_essence=3\n`;for(const [k,v]of Object.entries(fields))code+=`${role}['${k}']=${v}\n`;};
for(const role of ['slave','assistant']){
 const other=role==='slave'?'assistant':'slave';
 setup(role,{nymphomania:-1,nymphomania_xp:99,nymphomania_revealed:2});
 code+=`qa_count=func('jo9_chaotic','count','${role}')\n`;
 check('qa_count=1',role+'_frigid_count');
 if(mode==='red')break;
 code+=`qa_apply=func('jo9_chaotic','apply','${role}')\n`;
 check(`qa_apply=1 and chaotic_essence=2 and ${role}['nymphomania']=0 and ${role}['nymphomania_xp']=0 and ${role}['nymphomania_revealed']=0`,role+'_frigid_removed');
 setup(role,{grace:-1,perversion:-1,perversion_xp:77,perversion_revealed:2});
 code+=`qa_count=func('jo9_chaotic','count','${role}')\nqa_apply=func('jo9_chaotic','apply','${role}')\n`;
 check(`qa_count=1 and qa_apply=1 and ${role}['grace']=0 and ${role}['perversion']=-1 and ${role}['perversion_xp']=77 and chaotic_essence=2`,role+'_negative_priority');
 code+=`qa_apply=func('jo9_chaotic','apply','${role}')\n`;
 check(`qa_apply=1 and ${role}['perversion']=0 and ${role}['perversion_xp']=0 and ${role}['perversion_revealed']=0 and chaotic_essence=1`,role+'_fallback_after_negative');
 const negatives=[['grace',-1],['dexterity',-1],['sport_affinity',-1],['masochism',-1],['exhibitionism',-1],['meekness',-1],['selfesteem',-1],['jo9_attention',1],['darkness_attitude',-1],['blood_attitude',-1],['fire_attitude',-1],['water_attitude',-1],['vermin_attitude',-1],['deprivation_attitude',-1],['jo9_gag_reflex',1],['anal_affinity',-1],['defiant',1],['jo9_voice_trait',1],['jo9_work_ethic',-1],['jo9_focus',-1],['jo9_grudge',1],['jo9_constitution',-1],['jo9_learning_trait',-1],['nymphomania',-1]];
 for(const [key,value]of negatives){setup(role,{[key]:value});code+=`qa_count=func('jo9_chaotic','count','${role}')\nqa_apply=func('jo9_chaotic','apply','${role}')\n`;check(`qa_count=1 and qa_apply=1 and ${role}['${key}']=0 and chaotic_essence=2`,role+'_negative_'+key);}
 for(let repeat=0;repeat<20;repeat++){
  setup(role,{grace:-1,jo9_focus:-1,nymphomania:-1,perversion:-1,metabolism:5});code+=`qa_count=func('jo9_chaotic','count','${role}')\nqa_apply=func('jo9_chaotic','apply','${role}')\nqa_changed=iif(${role}['grace']=0,1,0)+iif(${role}['jo9_focus']=0,1,0)+iif(${role}['nymphomania']=0,1,0)\n`;
  check(`qa_count=3 and qa_apply=1 and qa_changed=1 and ${role}['perversion']=-1 and ${role}['metabolism']=5 and chaotic_essence=2`,role+'_mixed_priority_'+repeat);
  setup(role,{perversion:-1,metabolism:5,compassion:1});code+=`qa_count=func('jo9_chaotic','count','${role}')\nqa_apply=func('jo9_chaotic','apply','${role}')\nqa_changed=iif(${role}['perversion']=0,1,0)+iif(${role}['metabolism']=3,1,0)+iif(${role}['compassion']=0,1,0)\n`;
  check(`qa_count=3 and qa_apply=1 and qa_changed=1 and chaotic_essence=2`,role+'_mixed_fallback_'+repeat);
 }
 const ambiguous=[['metabolism',1,3],['metabolism',2,3],['metabolism',4,3],['metabolism',5,3],['nymphomania',1,0,'nymphomania_xp'],['nymphomania',2,0,'nymphomania_xp'],['perversion',-1,0,'perversion_xp'],['perversion',2,0,'perversion_xp'],['homosexualism',-1,0,'lesbian_xp'],['homosexualism',2,0,'lesbian_xp'],['courage',-1,0],['courage',1,0],['courage',2,0],['selfesteem',1,0],['compassion',-1,0,'compassion_xp'],['compassion',1,0,'compassion_xp'],['passion_luxury',-1,0],['passion_luxury',1,0],['passion_sweets',-1,0],['passion_sweets',1,0],['passion_fame',-1,0]];
 for(const [key,value,neutral,xp]of ambiguous){
  setup(role,{[key]:value,[key+'_revealed']:2,...(xp?{[xp]:40}:{})});
  code+=`${other}['${key}']=8\nqa_count=func('jo9_chaotic','count','${role}')\nqa_apply=func('jo9_chaotic','apply','${role}')\n`;
  check(`qa_count=1 and qa_apply=1 and ${role}['${key}']=${neutral} and ${role}['${key}_revealed']=0 and chaotic_essence=2 and ${other}['${key}']=8`+(xp?` and ${role}['${xp}']=0`:''),role+'_'+key+'_'+String(value).replace('-','minus'));
 }
 setup(role,{metabolism:5,metabolism_revealed:2,calories:5,stamina:3,fat:2});code+=`qa_apply=func('jo9_chaotic','apply','${role}')\ndynamic $replace($next_day_resolve_previous_day_calorie_effects,'dynslave','${role}')\ndynamic $replace($dyn_calc_slave_attrs,'dynslave','${role}')\n`;
 check(`qa_apply=1 and ${role}['metabolism']=3 and ${role}['metabolism_revealed']=0 and chaotic_essence=2`,role+'_metabolism_daily_recalc_stable');
 const positive={grace:1,dexterity:1,sport_affinity:1,expression_affinity:1,pet_affinity:1,dressage_affinity:1,cowSK_affinity:1,nurse_affinity:1,service_affinity:1,cook_affinity:1,gladiatrix_affinity:1,enchanter_affinity:1,art_affinity:1,music_affinity:1,calisthenics_affinity:1,secretary_affinity:1,masochism:2,exhibitionism:2,homosexualism:1,meekness:1,abuse_attitude:2,darkness_attitude:2,blood_attitude:2,fire_attitude:2,water_attitude:2,vermin_attitude:2,deprivation_attitude:2,oral_affinity:1,anal_affinity:1,jo9_slave_nature:1,jo9_ambition:1,jo9_work_ethic:1,passion_comfort:-1,jo9_focus:1,jo9_grudge:-1,jo9_constitution:1,jo9_combat_trait:3,jo9_versatile:1,jo9_peerless:1,jo9_learning_trait:1,virginity:4,metabolism:3};
 setup(role,positive);code+=`qa_count=func('jo9_chaotic','count','${role}')\nqa_apply=func('jo9_chaotic','apply','${role}')\n`;
 check(`qa_count=0 and qa_apply=0 and chaotic_essence=3 and `+Object.entries(positive).map(([k,v])=>`${role}['${k}']=${v}`).join(' and '),role+'_positive_preserved_nocharge');
 setup(role,{grace:-1,jo9_learning_trait:1,jo9_peerless:1,virginity:4,pregnant:40,parasite:2,tattoo:3,wounds:2,lactation:3,arena_level:9,has_ride_win:7,jo9_versatile:1,jo9_real_wins:20,jo9_defiant_resolved:1,jo9_slave_nature_initialized:1,jo9_combat_trait:3,neg_pain:12});
 code+=`qa_apply=func('jo9_chaotic','apply','${role}')\n`;
 check(`qa_apply=1 and ${role}['grace']=0 and `+Object.entries({jo9_learning_trait:1,jo9_peerless:1,virginity:4,pregnant:40,parasite:2,tattoo:3,wounds:2,lactation:3,arena_level:9,has_ride_win:7,jo9_versatile:1,jo9_real_wins:20,jo9_defiant_resolved:1,jo9_slave_nature_initialized:1,jo9_combat_trait:3,neg_pain:12}).map(([k,v])=>`${role}['${k}']=${v}`).join(' and '),role+'_status_title_preserved');
 setup(role,{grace:-9,dexterity:-9,meekness:-9,selfesteem:-9,anal_affinity:-9,nymphomania:-9,perversion:7,metabolism:9,homosexualism:7,courage:7,compassion:-9,passion_luxury:7,passion_sweets:7,passion_fame:7,jo9_voice_trait:2,jo9_work_ethic:7,passion_comfort:7,jo9_attention:7});
 code+=`qa_count=func('jo9_chaotic','count','${role}')\nqa_apply=func('jo9_chaotic','apply','${role}')\n`;
 check(`qa_count=0 and qa_apply=0 and chaotic_essence=3 and ${role}['grace']=-9 and ${role}['jo9_voice_trait']=2 and ${role}['metabolism']=9 and ${role}['perversion']=7`,role+'_unknown_values_preserved');
 setup(role,{perversion:-1});code+=`chaotic_essence=0\nqa_apply=func('jo9_chaotic','apply','${role}')\n`;
 check(`qa_apply=0 and chaotic_essence=0 and ${role}['perversion']=-1`,role+'_empty_stock');
}
if(mode!=='red'){
 code+="room1_state=1\nroom1['grace']=-1\nchaotic_essence=2\nqa_apply=func('jo9_chaotic','apply','room1')\n";check("qa_apply=0 and room1['grace']=-1 and chaotic_essence=2",'wrong_role');
 code+="slave_state=0\nslave['grace']=-1\nqa_apply=func('jo9_chaotic','apply','slave')\n";check("qa_apply=0 and slave['grace']=-1 and chaotic_essence=2",'absent_actor');
}
code+=`msg 'JO9_QA_CHAOS_${mode}_COMPLETE'\n`;
const start=doc.locations.find(l=>l.name==='Start');doc.lines[start.body]=c.shift(code.replace(/\n/g,'\r\n'),-5);
const tmp=path.resolve('G:/Codex/tmp/jo9-chaotic-priority-20261028-'+mode+'-'+Date.now());
assert(tmp.startsWith(path.resolve('G:/Codex/tmp')+path.sep));assert(!fs.existsSync(tmp));fs.mkdirSync(tmp,{recursive:true});
fs.writeFileSync(path.join(tmp,mode+'.qsp'),c.serialize(doc));fs.writeFileSync(path.join(tmp,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const plan=[{name:mode,file:path.join(tmp,mode+'.qsp'),marker:`JO9_QA_CHAOS_${mode}_COMPLETE`,checkpoint:'Original helper native priority/fallback and preservation assertions; no user save loaded'}];fs.writeFileSync(path.join(tmp,'plan.json'),JSON.stringify(plan));
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine','G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe','-Plan',path.join(tmp,'plan.json'),'-TimeoutSeconds','18'],{encoding:'utf8',windowsHide:true,timeout:26000});
const results=JSON.parse(fs.readFileSync(path.join(tmp,'client-results.json'),'utf8').replace(/^\uFEFF/,'')),log=fs.readFileSync(path.join(tmp,mode+'-stderr.log'),'utf8');
fs.writeFileSync(__dirname+'/'+mode+'-native-log.txt',log);assert(fs.readFileSync(input).equals(raw));
const report={mode,baselineHash:hash,checks,engineExit:run.status,results,expectedFailure:mode==='red'?'FAIL_CHAOS_slave_frigid_count':null,workUnchanged:true,userSaveLoaded:false,userSaveWritten:false};
fs.writeFileSync(__dirname+'/'+mode+'-results.json',JSON.stringify(report,null,2)+'\n');
const known=new Set([mode+'.qsp','FastQSP.ini','plan.json',mode+'-stderr.log',mode+'-stdout.log','client-results.json']);
assert(fs.realpathSync(tmp)===tmp&&!fs.lstatSync(tmp).isSymbolicLink());
if(fs.existsSync(path.join(tmp,'save'))){const s=path.join(tmp,'save');assert(!fs.lstatSync(s).isSymbolicLink());assert.equal(fs.readdirSync(s).length,0);fs.rmdirSync(s);}
for(const name of fs.readdirSync(tmp)){assert(known.has(name),'Preserve unexpected file '+name);assert(fs.lstatSync(path.join(tmp,name)).isFile());}
for(const name of fs.readdirSync(tmp))fs.unlinkSync(path.join(tmp,name));fs.rmdirSync(tmp);report.diagnosticCleaned=true;fs.writeFileSync(__dirname+'/'+mode+'-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
if(mode==='red')assert(log.includes('FAIL_CHAOS_slave_frigid_count'),'Expected behavioral failure absent');else assert(results.every(x=>x.pass),'Native assertion failed');
