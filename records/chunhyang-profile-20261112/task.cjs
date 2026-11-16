'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),assert=require('node:assert/strict'),cp=require('child_process');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/chunhyang-profile-20261112',rec=repo+'/records/chunhyang-profile-20261112',id='2026-11-12_chunhyang_profile';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\ufeff/,'')),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n'),hash=p=>c.hash(fs.readFileSync(p));
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5),put=(d,n,s)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);};
const discrete={stamina:5,sensitivity:2,temper:2,intellect:5,ego:3,pride:1,fat:1};
const continuous={beauty:5,exotic:5,style:3,fame:1};
const skills={service:1,cook:0,secretary:3,expression:2,nurse:4,alchemy:3,enchanter:4,gladiatrix:5,calisthenics:3,music:0,art:0,pet:0,dressage:0,cowSK:0};
const traits={exhibitionism:2,masochism:1,passion_luxury:-1,jo9_grudge:-1,jo9_work_ethic:1,passion_comfort:-1,jo9_constitution:1,metabolism:5,jo9_peerless:1,calisthenics_affinity:1,secretary_affinity:1,sport_affinity:1,gladiatrix_affinity:1,enchanter_affinity:1,jo9_combat_trait:1,courage:1,jo9_learning_trait:1,jo9_sando:1};
// The later user approval adds a latent orientation; existing first-stage preparation is retained.
if(fs.existsSync(rec+'/background-approved.json'))traits.homosexualism=1;
if(fs.existsSync(rec+'/champion-approved.json'))traits.arena_level=9;
const sex=['oral','penetration','orgy','roleplay','fetishism','xenophily','nipplefuck','lesbiansex','petting'];
const stage=process.argv[2];
function apply(file,log){const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',file,'-ModsDir',tmp+'/mods'],{encoding:'utf8',windowsHide:true,maxBuffer:4e6});fs.writeFileSync(rec+'/'+log,(r.stdout||'')+(r.stderr||''));assert.equal(r.status,0,log);}
if(stage==='prepare'){
 fs.mkdirSync(rec+'/before',{recursive:true});fs.mkdirSync(tmp+'/mods',{recursive:true});const raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw);assert.equal(d.hash,hash(repo+'/assets/runtime/2.4.1/jack.qsp'));if(fs.existsSync(rec+'/before.qsp.gz'))assert(zlib.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')).equals(raw));else fs.writeFileSync(rec+'/before.qsp.gz',zlib.gzipSync(raw));
 for(const [source,target]of [[game+'/json/slaves/3040_chunhyang.json','3040_chunhyang.json'],[repo+'/assets/runtime-source-2.4.1.json','runtime-source.json']])fs.copyFileSync(source,rec+'/before/'+target);
 const sub=[...new Set([...body(d,'get_stock_seed').matchAll(/stock\['(sub_[a-zA-Z_]+)'\]/g)].map(m=>m[1]))];assert(sub.length>25);
 const json=read(game+'/json/slaves/3040_chunhyang.json');for(const [key,value]of Object.entries({...discrete,...skills}))json['seed_'+key]=value;json.seed_beauty=5;json.seed_exotic=5;json.seed_fame_rate=10;json.seed_virginity=0;json.seed_anal_stretch=0;for(const key of sub)json['seed_'+key]=0;
 for(const [key,value]of Object.entries(traits).filter(([k])=>!k.startsWith('jo9_')&&!['passion_comfort'].includes(k)))json['seed_'+key]=value;
 for(const key of ['exhibitionism','masochism','passion_luxury','metabolism','calisthenics_affinity','secretary_affinity','sport_affinity','gladiatrix_affinity','enchanter_affinity','courage'])json['seed_'+key+'_revealed']=2;
 write(rec+'/profile.json',{discrete,continuous,skills,traits,sex,sub,experience:0,styleRate:40,fameRate:10,background:'PENDING_USER_APPROVAL',sando:'6/5 multiplier on each final combat resource, existing independent fractions combined before integer division'});
 write(rec+'/candidate-character.json',json);
 let init="! JO9 MOD START CHUNHYANG_PROFILE_20261112\r\nif $args[0] ! 'init' or stock_type ! 3040 or creating_clone ! 0: exit\r\n";
 const set=(key,value)=>"stock['"+key+"'] = "+value+"\r\n";
 const rate=(key,value)=>"stock_rate['"+key+"'] = "+value+"\r\n";
 for(const [key,value]of Object.entries(discrete)){init+=set(key,value)+rate(key,0);}
 for(const [key,value]of Object.entries(continuous))init+=set(key,value)+rate(key,'cont_atr_threshold['+value+']');
 for(const [key,value]of Object.entries(skills))init+=set(key,value)+rate(key,0);
 for(const key of [...sex,...sub])init+=set(key,0)+rate(key,0);
 const neutral=['jo9_ambition','jo9_focus','jo9_voice_trait','jo9_gag_reflex','jo9_slave_nature','defiant','oral_affinity','anal_affinity','jo9_versatile','jo9_vampire','cook_affinity','service_affinity','nurse_affinity','art_affinity','music_affinity','dressage_affinity','pet_affinity','cowSK_affinity','nymphomania','perversion','homosexualism','meekness','blood_attitude','darkness_attitude','fire_attitude','water_attitude','vermin_attitude','deprivation_attitude','jo9_meiki_known','scars','bruises','wounds','ill','parasite','starvation'];
 for(const key of neutral)init+=set(key,0);
 for(const [key,value]of Object.entries(traits))init+=set(key,value);
 for(const key of ['exhibitionism','masochism','passion_luxury','metabolism','calisthenics_affinity','secretary_affinity','sport_affinity','gladiatrix_affinity','enchanter_affinity','courage'])init+=set(key+'_revealed',2);
 init+=set('jo9_work_ethic_known',1)+set('passion_comfort_revealed',2)+set('jo9_grudge_known',1)+set('virginity',0)+set('anal_stretch',0)+set('jo9_erza_chun_preset_rev',1);
 init+="dynamic $replace($dyn_calc_slave_attrs, 'dyn'+'slave', 'stock')\r\n";
 init+="stock_rate['style'] = max(0, cont_atr_threshold[3] - stock_rate['temp_style'])\r\nstock['style'] = 3\r\nstock_rate['fame'] = cont_atr_threshold[1]\r\nstock['fame'] = 1\r\ngs 'jo9_traits_value', 'refresh', 'stock'\r\ngs 'jo9_traits', 'activity_repair', 'stock'\r\n! JO9 MOD END CHUNHYANG_PROFILE_20261112";
 const edits=[],change=(name,old,next,patchId)=>{const b=body(d,name);assert.equal(b.split(old).length-1,1,'anchor '+name);edits.push({location:name,field:'body',old,new:next,count:1,patchId});put(d,name,b.replace(old,next));};
 change('generate_stock',"gs 'jo9_traits', 'activity_repair', 'stock'\r\ngs '$stock_traits'","gs 'jo9_traits', 'activity_repair', 'stock'\r\n! JO9 MOD START CHUNHYANG_PROFILE_CALL_20261112\r\nif stock_type = 3040 and creating_clone = 0: gs 'jo9_chunhyang_profile', 'init'\r\n! JO9 MOD END CHUNHYANG_PROFILE_CALL_20261112\r\ngs '$stock_traits'",'CHUNHYANG_PROFILE_CALL_20261112');
 change('jo9_traits_value',"   if dynslave_type = 3040: dynslave['jo9_peerless'] = 1","   if dynslave_type = 3040: dynslave['jo9_peerless'] = 1\r\n! JO9 MOD START CHUNHYANG_SANDO_FLAG_20261112\r\n   if dynslave_type = 3040: dynslave['jo9_sando'] = 1\r\n! JO9 MOD END CHUNHYANG_SANDO_FLAG_20261112",'CHUNHYANG_SANDO_FLAG_20261112');
 const oldCombat=" макс_здоровье_игрока = max(1, args[2] * jo9_trait_combat_hp_num / jo9_trait_combat_hp_den)";
 const bonus=" ! JO9 MOD START CHUNHYANG_SANDO_RESOURCES_20261112\r\n if dyneval('result = ' + $args[1] + \"['jo9_sando']\") = 1:\r\n  jo9_trait_combat_hp_num *= 6 & jo9_trait_combat_hp_den *= 5\r\n  jo9_trait_combat_sta_num *= 6 & jo9_trait_combat_sta_den *= 5\r\n  jo9_trait_combat_mor_num *= 6 & jo9_trait_combat_mor_den *= 5\r\n end\r\n ! JO9 MOD END CHUNHYANG_SANDO_RESOURCES_20261112\r\n"+oldCombat;
 change('jo9_traits_combat',oldCombat,bonus,'CHUNHYANG_SANDO_RESOURCES_20261112');
 const description="! JO9 MOD START CHUNHYANG_SANDO_DESCRIBE_20261112\r\n if $args[1] = 'sando': $result = '[산도]<br>다른 전투 특성의 보정을 포함한 최대 체력·최대 스태미나·정상 사기가 각각 20% 증가한다. 전투 시작 때 적용하며, 화면 갱신으로 중복 증가하지 않는다.'\r\n! JO9 MOD END CHUNHYANG_SANDO_DESCRIBE_20261112\r\n";
 change('jo9_traits',"if $args[1] = 'peerless':",description+"if $args[1] = 'peerless':",'CHUNHYANG_SANDO_DESCRIBE_20261112');
 const list="! JO9 MOD START CHUNHYANG_SANDO_LIST_20261112\r\n   if dynslave['jo9_sando'] = 1: $result += '<a href=\"EXEC: gs ''jo9_traits'', ''describe'', ''sando''\">산도</a><br>'\r\n! JO9 MOD END CHUNHYANG_SANDO_LIST_20261112\r\n";
 change('jo9_traits',"if dynslave['jo9_vampire'] = 1:",list+"if dynslave['jo9_vampire'] = 1:",'CHUNHYANG_SANDO_LIST_20261112');
 // Append exactly one helper, preserving all original serialized fields.
 const existingCount=d.locations.length,acts=0,lines=d.lines.slice(0,-1);lines[3]=c.shift(String(existingCount+1),-5);lines.push(c.shift('jo9_chunhyang_profile',-5),c.shift('',-5),c.shift(init,-5),c.shift(String(acts),-5),'');const candidate=c.serialize({...d,lines});const checked=c.parse(candidate);assert.equal(checked.locations.length,existingCount+1);qa.inspectWorld(candidate);
 const patch={id,status:'APPROVED',description:'Apply user-confirmed Chunhyang3040 fresh-generation profile, all-F skills/experience0 and 16 traits. Add Sando to owned actors: combined final HP/STA/morale multipliers x6/5. Keep existing actors growth/history and fixed boss stats intact.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),add_locations:[{name:'jo9_chunhyang_profile',desc:'',body:init,actions:[]}],edits};
 write(repo+'/mods/'+id+'.json',patch);write(tmp+'/mods/'+id+'.json',patch);fs.writeFileSync(tmp+'/candidate.qsp',candidate);write(rec+'/prepared.json',{before:c.hash(raw),after:c.hash(candidate),jsonBefore:hash(game+'/json/slaves/3040_chunhyang.json'),jsonAfter:c.hash(Buffer.from(JSON.stringify(json,null,2)+'\n')),originalLocations:existingCount,subskills:sub.length,meikiBody:c.hash(Buffer.from(body(d,'jo9_meiki_state'))),enemyBody:c.hash(Buffer.from(body(d,'#противники')))});console.log(JSON.stringify({prepared:true,after:patch.after_sha256,subskills:sub.length}));
}
function fixture(phase,kind){
 const source=phase==='candidate'?tmp+'/candidate.qsp':game+'/jack.qsp',raw=fs.readFileSync(source),d=c.parse(raw),profile=read(rec+'/profile.json'),out=tmp+'/native-'+phase;fs.mkdirSync(out,{recursive:true});
 let code="killall\nautosave=0\ndecadesave=0\nsound_on=0\n$onnewloc=''\n$ongload=''\n$ongsave=''\n$counter=''\nsettimer 0\nsnk_room_target=0\n";let assertions=0;
 const check=(condition,label)=>{assertions++;return "if ("+condition+")=0: msg 'FAIL_CHUN_"+label+"' & exit\nqa_checks+=1\n";};
 const set=(r,k,v)=>r+"['"+k+"']="+v+'\n';
 if(kind==='profile'||kind==='generation'){
  code+="gs '#variative'\ngs '#static_base'\ngs '#dynamic'\n";
  const json=read(rec+'/candidate-character.json');for(const [key,value]of Object.entries(json))if(key.startsWith('seed_')&&typeof value==='number')code+=key+'[3040]='+value+'\n';code+="$seed_name[3040]='춘향'\n";
  if(kind==='generation'){
   put(d,'$slave_price','exit');
   code+="special_stock=3040\ncreating_clone=0\ngs 'generate_stock'\n";
  }else{
   code+="stock_type=3040\nstock_state=1\ncreating_clone=0\n"+set('stock','service',5)+set('stock','cook',5)+set('stock','virginity',3);
   if(d.locations.some(l=>l.name==='jo9_chunhyang_profile'))code+="gs 'jo9_chunhyang_profile','init'\n";
  }
  for(const [key,value]of Object.entries(skills))code+=check("stock['"+key+"']="+value,'profile_'+key);
  for(const [key,value]of Object.entries(discrete))code+=check("stock['"+key+"']="+value,'discrete_'+key);
  for(const [key,value]of Object.entries(traits))code+=check("stock['"+key+"']="+value,'trait_'+key);
  if(fs.existsSync(rec+'/background-approved.json'))code+=check("stock['homosexualism_revealed']=0",'latent_bi_hidden');
  for(const key of [...sex,...profile.sub])code+=check("stock['"+key+"']=0",'zero_'+key);
  code+=check("stock['virginity']=0 and stock['jo9_meiki_known']=0",'no_experience')+check("stock['beauty']=6 and stock['fame']=1 and stock['style']=3",'appearance');
  code+=check("func('jo9_traits','activity_sign','stock')=1",'workaholic');
  code+="$qa_list=$func('jo9_traits','list','stock')\n"+check("instr($qa_list,'산도')>0 and instr($qa_list,'광전사')>0 and instr($qa_list,'절세미인')>0",'trait_list');
  code+="stock_type=2579\nstock['cook']=4\ngs 'jo9_chunhyang_profile','init'\n"+check("stock['cook']=4",'other_guard');
  code+="stock_type=3040\ncreating_clone=1\nstock['cook']=4\ngs 'jo9_chunhyang_profile','init'\n"+check("stock['cook']=4",'clone_guard');
  if(fs.existsSync(rec+'/champion-approved.json')){
   code+="dynamic $replace($update_slave_features_list, 'dyn'+'slave', 'stock')\n"+check("instr($stock_features_list,'아레나 그랜드 챔피언')>0",'grand_champion_visible');
   code+="stock['arena_level']=10\ngs 'jo9_traits_value','refresh','stock'\n"+check("stock['arena_level']=10",'higher_arena_history_preserved');
   code+="stock['arena_level']=0\nstock['virginity']=3\ngs 'jo9_traits_value','refresh','stock'\n"+check("stock['arena_level']=9 and stock['cook']=4 and stock['virginity']=3",'existing_actor_history_preserved');
  }
 }else{
  for(const r of ['slave','assistant','room1','room2','room3','room4']){
   code+=set(r,'jo9_constitution',1)+set(r,'jo9_combat_trait',1)+set(r,'courage',1)+set(r,'jo9_sando',1);
   code+="gs 'jo9_traits_combat','setup','"+r+"',100,100,100\n";
   code+=check('макс_здоровье_игрока=144 and макс_выносливость_игрока=216 and норм_дух_игрока=270','sando_'+r);
   code+="gs 'jo9_traits_combat','setup','"+r+"',100,100,100\n"+check('макс_здоровье_игрока=144 and макс_выносливость_игрока=216 and норм_дух_игрока=270','repeat_'+r);
   code+=set(r,'jo9_sando',0)+"gs 'jo9_traits_combat','setup','"+r+"',100,100,100\n"+check('макс_здоровье_игрока=120 and макс_выносливость_игрока=180 and норм_дух_игрока=225','ordinary_'+r);
  }
  code+="slave['jo9_sando']=1\nslave['jo9_combat_trait']=3\ngs 'jo9_traits_combat','setup','slave',100,100,100\n"+check('макс_здоровье_игрока=216 and макс_выносливость_игрока=216 and норм_дух_игрока=270','veteran_combo');
  code+="макс_здоровье_игрока=123\nмакс_выносливость_игрока=234\nнорм_дух_игрока=345\ngs 'jo9_traits_combat','setup','',100,100,100\n"+check('макс_здоровье_игрока=123 and макс_выносливость_игрока=234 and норм_дух_игрока=345','master_unchanged');
 }
 code+=check('qa_checks='+assertions,'count');const marker='JO9_QA_CHUN_'+kind+'_COMPLETE';code+="savegame '"+kind+".sav'\nmsg '"+marker+"'\nexit";put(d,'Start',code);const bytes=c.serialize(d);qa.inspectWorld(bytes);fs.writeFileSync(out+'/'+kind+'.qsp',bytes);return{name:kind,file:out+'/'+kind+'.qsp',marker,checkpoint:assertions+' assertions; actual profile/stat/combat helpers; generation only stubs unrelated price appraisal',assertions};
}
if(stage==='probe'){
 const phase=process.argv[3],out=tmp+'/native-'+phase;const plan=(phase==='red'?['profile','combat']:['profile','generation','combat']).map(k=>fixture(phase,k));write(out+'/plan.json',plan);fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');write(rec+'/instrumentation-'+phase+'.json',{source:phase==='candidate'?tmp+'/candidate.qsp':game+'/jack.qsp',changedLocations:['Start','generation only: $slave_price'],jsonNumericSeedsPrimedFromCandidate:true,userSaveTouched:false,plans:plan});console.log(JSON.stringify({phase,probes:plan.length,assertions:plan.reduce((n,p)=>n+p.assertions,0)}));
}
if(stage==='run'){
 const phase=process.argv[3],out=tmp+'/native-'+phase;const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','20'],{encoding:'utf8',windowsHide:true,timeout:75000});fs.writeFileSync(rec+'/runner-'+phase+'.log',(r.stdout||'')+(r.stderr||''));const results=read(out+'/client-results.json');write(rec+'/native-'+phase+'.json',results);for(const x of results)fs.copyFileSync(out+'/'+x.name+'-stderr.log',rec+'/'+phase+'-'+x.name+'-stderr.log');
 if(phase==='red'){assert(!results.every(x=>x.pass));assert(fs.readFileSync(out+'/profile-stderr.log','utf8').includes('FAIL_CHUN_profile_service'));console.log('Expected RED baseline failure');}
 else{assert.equal(r.status,0);assert(results.every(x=>x.pass));const raw=fs.readFileSync(out+'/profile.sav'),s=sc.parse(raw);assert(sc.serialize(s).equals(raw));assert.equal(sc.value(s,'stock','jo9_sando')[0],'1');assert.equal(sc.value(s,'stock','jo9_combat_trait')[0],'1');write(rec+'/save-'+phase+'.json',{pass:true,syntheticSave:true,sandoPersisted:true,userSaveTouched:false,guiLoadTested:false});console.log(JSON.stringify({phase,pass:true,results}));}
}
if(stage==='install'){
 const p=read(rec+'/prepared.json');assert(read(rec+'/native-candidate.json').every(r=>r.pass));assert.equal(hash(game+'/jack.qsp'),p.before);assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),p.before);fs.copyFileSync(game+'/jack.qsp',tmp+'/replay.qsp');apply(tmp+'/replay.qsp','replay.log');assert.equal(hash(tmp+'/replay.qsp'),p.after);apply(tmp+'/replay.qsp','idempotence.log');assert.equal(hash(tmp+'/replay.qsp'),p.after);apply(game+'/jack.qsp','apply.log');assert.equal(hash(game+'/jack.qsp'),p.after);fs.copyFileSync(game+'/jack.qsp',repo+'/assets/runtime/2.4.1/jack.qsp');assert.equal(hash(game+'/json/slaves/3040_chunhyang.json'),p.jsonBefore);fs.copyFileSync(rec+'/candidate-character.json',game+'/json/slaves/3040_chunhyang.json');fs.copyFileSync(rec+'/candidate-character.json',repo+'/assets/json/slaves/3040_chunhyang.json');
 const mp=repo+'/assets/runtime-source-2.4.1.json',meta=read(mp);meta.sourceQspSha256=p.after;meta.snapshotDate='2026-11-12';for(const f of meta.files)if(f.repositoryPath==='assets/runtime/2.4.1/jack.qsp'){f.sha256=p.after;f.bytes=fs.statSync(game+'/jack.qsp').size;}else if(f.repositoryPath==='assets/json/slaves/3040_chunhyang.json'){f.sha256=hash(repo+'/'+f.repositoryPath);f.bytes=fs.statSync(repo+'/'+f.repositoryPath).size;}meta.latestChunhyangProfile={date:'2026-11-12',mod:id,report:'records/chunhyang-profile-20261112/REPORT_KO.md',background:'Pending user approval'};write(mp,meta);console.log(JSON.stringify({installed:true,hash:p.after}));
}
if(stage==='verify'){
 const p=read(rec+'/prepared.json'),raw=fs.readFileSync(game+'/jack.qsp'),d=c.parse(raw),old=c.parse(zlib.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')));assert.equal(d.hash,p.after);assert(read(rec+'/native-installed.json').every(r=>r.pass));assert.equal(d.locations.length,p.originalLocations+1);const changed=old.locations.filter(l=>l.name!=='jo9_chunhyang_profile'&&old.lines[l.body]!==d.lines[l.body]).map(l=>l.name);assert.deepEqual(changed.sort(),['generate_stock','jo9_traits','jo9_traits_combat','jo9_traits_value'].sort());assert.equal(c.hash(Buffer.from(body(d,'jo9_meiki_state'))),p.meikiBody);assert.equal(c.hash(Buffer.from(body(d,'#противники'))),p.enemyBody);const char=read(game+'/json/slaves/3040_chunhyang.json'),before=read(rec+'/before/3040_chunhyang.json');for(const key of ['seed_world_description','seed_family_description','seed_occupation_description'])assert.equal(char[key],before[key]);assert.equal(hash(repo+'/assets/runtime/2.4.1/jack.qsp'),p.after);assert.equal(hash(game+'/json/slaves/3040_chunhyang.json'),hash(repo+'/assets/json/slaves/3040_chunhyang.json'));write(rec+'/verification.json',{pass:true,before:p.before,after:p.after,changedLocations:changed,addedLocations:['jo9_chunhyang_profile'],structure:qa.inspectWorld(raw),generationAndProfileAndCombatNative:true,backgroundUntouched:true,enemyAndMeikiDefinitionsPreserved:true,sando20Percent:true,onlyNewGenerationProfile:true,userSaveTouched:false,guiAndExistingSaveLoadTested:false,fullTouched:false,audioTouched:false,commit:false,push:false});console.log('Verified '+p.after);
}
