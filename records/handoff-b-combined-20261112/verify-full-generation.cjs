'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const mode=process.argv[2]||'baseline',sampleTarget=Number(process.argv[3]||300),randomOnly=process.argv[4]==='random-only',tag=process.argv[5]||'',root='G:/Codex/tmp/handoff-b-combined-20261112/full-generation',records=__dirname;
assert(/^[a-z-]*$/.test(tag));
const work='G:/somi/Jack O Nine Tails v2.4_work/game',candidate='G:/Codex/tmp/handoff-b-combined-20261112/candidate.qsp';
const q=s=>"'"+String(s).replaceAll("'","''").replaceAll('<<',"<'+'<")+"'";
const nl=s=>s.replace(/\r?\n/g,'\r\n');
fs.mkdirSync(root,{recursive:true});
if(!fs.existsSync(root+'/json'))fs.cpSync(work+'/json',root+'/json',{recursive:true});
if(!fs.existsSync(root+'/config.xml'))fs.copyFileSync(work+'/config.xml',root+'/config.xml');
fs.writeFileSync(root+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const sourceFiles=fs.readdirSync(work+'/json/slaves').filter(f=>/^\d+(?:_|\.json)/.test(f)&&f.endsWith('.json'));
const seeds=new Map(),manifest=[];
for(const f of sourceFiles){const raw=fs.readFileSync(work+'/json/slaves/'+f),j=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,'')),id=Number(f.match(/^\d+/)[0]);assert(!seeds.has(id),'duplicate seed '+id);seeds.set(id,j);manifest.push({id,file:f,sha256:c.hash(raw)});}
const seedCode=[];
for(const [id,j]of seeds)for(const [k,v]of Object.entries(j)){if(!/^\w+$/.test(k))continue;if(typeof v==='number')seedCode.push(`${k}[${id}]=${v}`);if(typeof v==='string')seedCode.push(`$${k}[${id}]=${q(v)}`);}
for(const[k,v]of Object.entries(JSON.parse(fs.readFileSync(work+'/json/slave_index.json','utf8'))))seedCode.push(k+'='+v);
fs.writeFileSync(records+'/seed-source-manifest.json',JSON.stringify({workJsonRoot:work+'/json/slaves',count:manifest.length,files:manifest},null,2));
// The installed client resolves seed_* arrays from the copied current JSON database.
// Use the previously proven full-generation initialization; do not reassign 58k constants in Start.
const setup=['killall','settimer 0',"$counter=''","$ongload=''","$onnewloc=''",'sound_on=0','autosave=0','decadesave=0','usehtml=1',"gs 'refresh_database'","gs 'init_game'",'sound_on=0',"$counter=''","$ongload=''","$onnewloc=''",'difficulty_setting=1','creating_clone=0','no_loli=0','no_milf=0','snk_room_target=0','qa_assertions=0'];
const fixedIds=[...Array.from({length:23},(_,i)=>8877+i),3040];
let checks=0;
function check(code,expr,label){checks++;code.push(`qa_assertions+=1\nif (${expr})=0: msg ${q('FAIL_FULLGEN_'+label)} & exit`);}
function snapshot(code,prefix){code.push(`copyarr '${prefix}','stock'\ncopyarr '$${prefix}','$stock'\n$${prefix}_name=$stock_name\n$${prefix}_world=$stock_world\n$${prefix}_family=$stock_family\n$${prefix}_occupation=$stock_occupation`);}
const source=fs.readFileSync(mode==='baseline'?work+'/jack.qsp':candidate),doc=c.parse(source),start=doc.locations.find(l=>l.name==='Start');
const code=[...setup];
if(mode==='baseline'){
 for(const id of fixedIds){code.push(`special_stock=${id}\ncreating_clone=0\nkillvar 'prev_num_type'\nnum_count=0\ngs 'generate_stock'`);check(code,'stock_state=CONST_INT[\'slave_exist\']','baseline_state_'+id);snapshot(code,'qa_fixed_'+id);}
 code.push("savegame 'fixed-baseline.sav'","msg 'JO9_QA_BFULL_fixed_baseline_COMPLETE'",'exit');
}else{
 const state=sc.parse(fs.readFileSync(root+'/fixed-baseline.sav'));
 const authority=require('G:/somi/JO9sa/records/handoff-b-background-20261112/BACKGROUND_AUTHORITY_SNAPSHOT.json'),settings=authority.settings;
 const allowed=(world,family,job,age)=>{
  if(!(settings.links.worldFamilies[world]||[]).includes(family)||!(settings.links.worldOccupations[world]||[]).includes(job))return false;
  const r=settings.links.occupationFamilies[world+':'+job]||{};
  if(r.required&&!r.required.includes(family)||r.rejected?.includes(family))return false;
  for(const[k,id]of[['world',world],['family',family],['occupation',job]]){const a=settings.ageRules[k]?.[id];if(a&&(a.required&&!a.required.includes(age)||a.rejected?.includes(age)))return false;}
  return true;
 };
 const legal=[];
 for(const world of [...new Set(authority.worldPool)])for(let age=0;age<3;age++)for(const family of settings.links.worldFamilies[world]||[])for(const job of settings.links.worldOccupations[world]||[])if(allowed(world,family,job,age)){const key=[world,family,job,age].join('|');legal.push(key);}
 const helper=c.shift(doc.lines[doc.locations.find(l=>l.name==='jo9_background_b').body],5),reached={world:new Set(),family:new Set(),occupation:new Set()},triples=[];
 const re=/if \$args\[1\] = '([^']+)' and \$args\[2\] = '([^']+)' and args\[3\] = (\d+): \$result = '([^']*)'/g;
 for(const m of helper.matchAll(re))for(const job of m[4].split('|').filter(Boolean)){assert(allowed(m[1],m[2],job,+m[3]),'helper illegal '+m[0]);reached.world.add(m[1]);reached.family.add(m[2]);reached.occupation.add(job);triples.push([m[1],m[2],job,+m[3]]);}
 const newIds={world:['earth_rome'],family:['ancient_noble','ancient_citizen','roman_freedslave'],occupation:['courtesan','serial_killer','gang_member','mafia_boss','former_slave','schoolgirl','dancer']};
 for(const[k,ids]of Object.entries(newIds))for(const id of ids)assert(reached[k].has(id),'new id unreachable '+id);
 fs.writeFileSync(records+'/full-generation-static.json',JSON.stringify({candidateHash:doc.hash,legalTriples:legal.length,helperTriples:triples.length,newIds,newIdsAllReachable:true,illegalHelperTriples:0},null,2));
 if(sampleTarget<=10)code.push("savegame 'progress-tables.sav'");
 const primary=['beauty','stamina','sensitivity','temper','ego','pride','intellect'];
 const nonphysical=new Set(['jo9_focus','jo9_work_ethic','passion_comfort']);
 if(!randomOnly)for(const id of fixedIds){
  code.push(`special_stock=${id}\ncreating_clone=0\nkillvar 'prev_num_type'\nnum_count=0\ngs 'generate_stock'`);
  check(code,"stock_state=CONST_INT['slave_exist']",'fixed_state_'+id);check(code,"stock['jo9_bg_random']=0",'fixed_flag_'+id);
  const numericKeys=Object.entries(seeds.get(id)||{}).filter(([k,v])=>k.startsWith('seed_')&&typeof v==='number').map(([k])=>k.slice(5));
  const profileBody=c.shift(doc.lines[doc.locations.find(l=>l.name=== (id===3040?'jo9_chunhyang_profile':'jo9_dohna_traits')).body],5);
  if(id===3040)for(const m of profileBody.matchAll(/stock\['([^']+)'\]/g))numericKeys.push(m[1]);
  for(const key of new Set(numericKeys)){
   if(nonphysical.has(key))continue;
   if(primary.includes(key)&&!seeds.get(id)?.['seed_'+key])continue;
   const expected=Number(sc.value(state,'qa_fixed_'+id,key)[0]);check(code,`stock[${q(key)}]=${expected}`,'fixed_'+id+'_'+key);
  }
  const oldFocus=+sc.value(state,'qa_fixed_'+id,'jo9_focus')[0],oldWork=+sc.value(state,'qa_fixed_'+id,'jo9_work_ethic')[0],oldComfort=+sc.value(state,'qa_fixed_'+id,'passion_comfort')[0],stage=oldWork>0||oldComfort<0?2:oldFocus>0?1:oldWork<0||oldComfort>0?-2:oldFocus<0?-1:0;
  check(code,`func('jo9_traits','activity_stage','stock')=${stage}`,'fixed_stage_'+id);
  check(code,`$stock_name=${q(sc.value(state,'qa_fixed_'+id+'_name')[1])}`,'fixed_name_'+id);
  code.push("copyarr 'slave','stock'\ncopyarr '$slave','$stock'\n$slave_family=$stock_family");
  for(const key of ['ego','pride','sensitivity'])for(const delta of [-10,10])check(code,`func('jo9_origin_growth','delta','slave',${q(key)},${delta})=${delta}`,'fixed_delta_'+id+'_'+key+'_'+delta);
  snapshot(code,'qa_fixed_'+id);if(sampleTarget<=10&&id===8877)code.push("savegame 'progress-first.sav'");
 }
 if(sampleTarget<=10)code.push("savegame 'progress-fixed.sav'");
 code.push('qa_random_count=0','qa_random_attempts=0','qa_preset_pool_count=0','qa_roman=0',':qa_fullgen_loop','qa_random_attempts+=1',"killvar 'prev_num_type'",'num_count=0','special_stock=0','creating_clone=0','cheat_e=iif((qa_random_attempts mod 3)=0,1,0)','cheat_f=iif((qa_random_attempts mod 3)=1,1,0)','cheat_g=iif((qa_random_attempts mod 3)=2,1,0)');
 if(sampleTarget<=10)code.push("savegame 'progress-random-before.sav'");code.push("gs 'generate_stock'");if(sampleTarget<=10)code.push("savegame 'progress-random-after.sav'");
 check(code,"stock_state=CONST_INT['slave_exist']",'random_state');
 code.push("if stock['jo9_bg_random']=1:",' qa_random_count+=1'," qa_age_seen[stock['age']]+=1"," $qa_triple=$stock_world+'|'+$stock_family+'|'+$stock_occupation+'|'+str(stock['age'])");
 code.push("$qa_worlds=$func('jo9_background_b','worlds',stock['age'])\n$qa_families=$func('jo9_background_b','families',$stock_world,stock['age'])\n$qa_jobs=$func('jo9_background_b','occupations',$stock_world,$stock_family,stock['age'])");
 check(code,"instr('|'+$qa_worlds+'|','|'+$stock_world+'|')>0 and instr('|'+$qa_families+'|','|'+$stock_family+'|')>0 and instr('|'+$qa_jobs+'|','|'+$stock_occupation+'|')>0",'random_v2_triple');
 check(code,"$stock_world_description ! '' and $stock_family_description ! '' and $stock_occupation_description ! ''",'random_descriptions');
 check(code,"stock['family_index']>=1 and stock['family_index']<=5",'family_index');
 for(const[key,value]of Object.entries({ancient_noble:2,ancient_citizen:3,roman_freedslave:4}))code.push(`if $stock_family=${q(key)}:\n if stock['family_index']!${value}: msg ${q('FAIL_FULLGEN_newfamily_'+key)} & exit\nend`);
 for(const key of primary)check(code,key==='beauty'?"stock['beauty']>=0 and (stock['beauty']<=5 or (stock['beauty']=6 and stock['jo9_peerless']=1))":`stock[${q(key)}]>=0 and stock[${q(key)}]<=5`,'random_bound_'+key);
 check(code,"(stock['jo9_focus']=0 or stock['jo9_work_ethic']=0) and stock['passion_comfort']=-stock['jo9_work_ethic']",'activity_single');
 code.push("if $stock_world='earth_rome':\n qa_roman+=1");
 check(code,"stock['nation_index']=10 and stock['world_index']=4 and $namebase='roman'",'roman_metadata');
 code.push("qa_roman_name_ok=0\nfor qa_name_i=1 to arrsize('$roman_name')-1:\n if $stock_name=$roman_name[qa_name_i]: qa_roman_name_ok=1\nend");
 check(code,'qa_roman_name_ok=1','roman_name');code.push('end');
 code.push("$qa_random_world[qa_random_count]=$stock_world\n$qa_random_family[qa_random_count]=$stock_family\n$qa_random_job[qa_random_count]=$stock_occupation\nqa_random_age[qa_random_count]=stock['age']",'else',' qa_preset_pool_count+=1','end',`if qa_random_count<${sampleTarget} and qa_random_attempts<${sampleTarget*2}: jump 'qa_fullgen_loop'`);
 check(code,'qa_random_count='+sampleTarget,'random_sample_count');for(let age=0;age<3;age++)check(code,`qa_age_seen[${age}]>0`,'age_coverage_'+age);if(sampleTarget>=100)check(code,'qa_roman>0','roman_reached');
 code.push("savegame 'candidate-results"+(tag?'-'+tag:'')+".sav'","msg 'JO9_QA_BFULL_combined_generate_COMPLETE'",'exit');
}
doc.lines[start.body]=c.shift(nl(code.join('\n')),-5);
const nativeName=mode==='baseline'?'fixed-baseline':'combined-generation'+(tag?'-'+tag:'');
const file=root+'/'+nativeName+'.qsp';fs.writeFileSync(file,c.serialize(doc));
const marker=mode==='baseline'?'JO9_QA_BFULL_fixed_baseline_COMPLETE':'JO9_QA_BFULL_combined_generate_COMPLETE';
fs.writeFileSync(root+'/plan-'+mode+(tag?'-'+tag:'')+'.json',JSON.stringify([{name:nativeName,file,marker,checkpoint:'Actual full generate_stock with current WORK JSON seed data; no generation/helper stubs.'}],null,2));
fs.writeFileSync(records+'/full-generation-prepared-'+mode+(tag?'-'+tag:'')+'.json',JSON.stringify({sourceHash:c.hash(source),sourceJsonFiles:sourceFiles.length,seedLoading:'Installed client JSON constant resolver',primeAssignments:0,fixedIds:randomOnly?[]:fixedIds,randomTarget:mode==='baseline'?0:sampleTarget,assertions:checks,fixture:file},null,2));
console.log(JSON.stringify({mode,sourceHash:c.hash(source),sourceJsonFiles:sourceFiles.length,primeAssignments:0,assertions:checks,fixture:file}));
