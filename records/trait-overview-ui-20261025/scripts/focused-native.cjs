'use strict';
// Isolated native functional probes; install nothing into WORK or Full.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const core=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const opt={};for(let i=2;i<process.argv.length;i+=2){assert(/^--/.test(process.argv[i]));opt[process.argv[i].slice(2)]=process.argv[i+1];}
const candidate=opt.candidate||'G:/Codex/tmp/jo9-trait-overview-20261025/candidate.qsp';
const out=path.resolve(opt.out||'G:/Codex/tmp/jo9-trait-overview-20261025/focus');
const record=opt.record||'G:/somi/JO9sa/records/trait-overview-ui-20261025';
const sourceSave=opt.save||game+'/save/JO9_TEST_20261023_01_HOME.sav';
assert(out.toLowerCase().startsWith(path.resolve('G:/Codex/tmp/jo9-trait-overview-20261025').toLowerCase()+path.sep),'Outside task output');
const raw=fs.readFileSync(candidate),input=sc.parse(fs.readFileSync(sourceSave));qa.inspectWorld(raw);
const prime=qa.primeState(input).code,cr=s=>s.replace(/\r?\n/g,'\r\n'),q=s=>"'"+String(s).replaceAll("'","''")+"'";
const tracked=[game+'/jack.qsp',game+'/css/base.css',sourceSave,...fs.readdirSync(game+'/save').filter(x=>/\.sav$/i.test(x)).map(x=>game+'/save/'+x)];
const protectedHashes=[...new Set(tracked)].map(p=>({path:p,sha256:core.hash(fs.readFileSync(p))}));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,o)=>fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');
const registry=read(repo+'/records/trait-system-review-20261024/all-traits.json');
const fields=[...new Set(['energy','stamina','stamina_accum','fame','fame_accum','brand','wounds','scars','bruises','pregnant','rehabilitation','ego','temper','pride',...registry.rows.map(x=>x.key)])];
const actors=['slave','assistant','room1','room2','room3','room4'];
const snap=["$result=''"];
for(const r of actors){snap.push('$result += '+q(r+'|')+' + $'+r+'_name + '+q('|')+' + str('+r+'_state)');for(const k of fields)snap.push('$result += '+q('|')+' + str('+r+'['+q(k)+']) + '+q(':')+' + $'+r+'['+q(k)+']');}
snap.push("$result += '|' + str(sparks)");
let assertionCount=0;
function check(expr,label){assertionCount++;return `qa_checks+=1\nif (${expr})=0: msg ${q('FAIL_TV_'+label)} & exit\n`;}
function metadataExercise(tag){
 let s="$qa_curloc=$curloc\n$qa_actor_before=$func('qa_tv_snapshot')\n$qa_story=$info_text\n";
 s+="gs 'jo9_traits_view','open'\n"+check("instr($maintxt,'data-open=\"1\"')>0",tag+'_OPEN');
 s+=`savegame ${q(tag+'-open.sav')}\n`;
 s+="$qa_scan=$maintxt\n$qa_match=$strfind($qa_scan,'id=\"jo9_tv_desc_([0-9]+)\"',1)\nqa_meta_count=0\n:qa_tv_each_meta\nif $qa_match!'':\n qa_index=val($qa_match)\n if qa_index>0:\n  gs 'jo9_traits_view','info',qa_index\n";
 s+=check("$info_text!''",tag+'_DESCRIPTION_NONEMPTY')+check("instr($maintxt,$info_text)>0",tag+'_DESCRIPTION_RENDERED')+check("instr($maintxt,'data-open=\"1\"')>0",tag+'_INFO_STAYS_OPEN')+check("$curloc=$qa_curloc",tag+'_SAME_LOCATION');
 s+="  qa_meta_count+=1\n end\n $qa_whole=$strfind($qa_scan,'id=\"jo9_tv_desc_([0-9]+)\"')\n qa_match_at=instr($qa_scan,$qa_whole)\n $qa_scan=$mid($qa_scan,qa_match_at+len($qa_whole))\n $qa_match=$strfind($qa_scan,'id=\"jo9_tv_desc_([0-9]+)\"',1)\n jump 'qa_tv_each_meta'\nend\n";
 s+=check('qa_meta_count>=4',tag+'_ALL_METADATA')+check("$func('qa_tv_snapshot')=$qa_actor_before",tag+'_NO_ACTOR_MUTATION');
 s+=`savegame ${q(tag+'-info.sav')}\n`;
 s+="gs 'jo9_traits_view','close'\n"+check("instr($maintxt,'data-open=\"0\"')>0",tag+'_CLOSE')+check('$info_text=$qa_story',tag+'_RESTORE_STORY')+check('$curloc=$qa_curloc',tag+'_CLOSE_LOCATION')+check("$func('qa_tv_snapshot')=$qa_actor_before",tag+'_CLOSE_NO_MUTATION');
 return s.replaceAll('qa_tv_each_meta','qa_tv_each_meta_'+tag.replaceAll('-','_'));
}
function roleFixture(role,large){
 let s=`${role}_state=CONST_INT['slave_exist']\n$${role}_name=${q('QA_'+role)}\n${role}['ego']=5\n${role}['temper']=5\n${role}['pride']=5\n`;
 for(const k of registry.rows.map(x=>x.key))s+=`${role}[${q(k)}]=0\n`;
 s+=`${role}['brand']=1\n${role}['wounds']=0\n${role}['scars']=0\n${role}['bruises']=0\n${role}['days_without_food']=0\n${role}['neg_hungry']=0\n${role}['rehabilitation']=0\n${role}['pregnant']=0\n`;
 if(large){
  // Stage 2 is already disclosed: stage 1 deliberately opens the original pregnancy announcement MSG.
  const v={ego:1,temper:1,pride:1,brand:0,wounds:1,scars:5,bruises:5,days_without_food:2,neg_hungry:1,rehabilitation:30,pregnant:120,pregnant_revealed:2,fertility:0,fertility_revealed:1,vaginal_modification:0,parasite:0,grace:1,dexterity:1,sport_affinity:1,sport_affinity_revealed:2,expression_affinity:1,expression_affinity_revealed:2,nurse_affinity:1,nurse_affinity_revealed:2,service_affinity:1,service_affinity_revealed:2,cook_affinity:1,cook_affinity_revealed:2,art_affinity:1,art_affinity_revealed:2,jo9_versatile:1,arena_level:5,has_ride_win:4};
  for(const [k,n]of Object.entries(v))s+=`${role}[${q(k)}]=${n}\n`;
  s+="cheat_no_starve=0\nmaster_medic=4\n";
 }
 const tag=role+'-'+(large?'overflow':'short');
 s+=`*clr\n$info_text=${q('QA_STORY_'+tag)}\n${role}_stat_screen=0\ngs ${q(role+'_stat')}\n`;
 s+=check(`instr($maintxt,'id="jo9_tv_root" data-role="${role}"')>0`,tag+'_ROOT')+check("instr($maintxt,'J9TV_INFO_BEGIN')>0 and instr($maintxt,'J9TV_INFO_END')>0",tag+'_INFO_MARKERS')+check("instr($maintxt,'jo9_traits_view.js')>0",tag+'_SCRIPT');
 s+=`savegame ${q(tag+'-before.sav')}\n`+metadataExercise(tag);
 s+="gs 'jo9_traits_view','open'\ngs 'jo9_traits_view','remember'\n*clr\ngs "+q(role+'_stat')+'\n'+check("instr($maintxt,'data-open=\"1\"')>0",tag+'_REMEMBER_SAME_ROLE');
 s+="gs 'jo9_traits_view','remember'\n*clr\n$info_text='QA_SWITCH'\ngs "+q(role==='slave'?'assistant_stat':'slave_stat')+'\n'+check("instr($maintxt,'data-open=\"0\"')>0",tag+'_NO_CROSS_ROLE_REOPEN');
 return {name:tag,code:s};
}
function roomsFixture(){
 let s="$slave_name='QA_MAIN'\nslave_state=CONST_INT['slave_exist']\nslave['energy']=4\nslave['jo9_ambition']=1\n";
 for(let n=1;n<=4;n++){
  const r='room'+n,tag='room-'+n;
  s+="qa_copy_i=0\n:qa_tv_clone_room\nif qa_copy_i<arrsize('$slave_vars'):\n $qa_from=$replace($slave_vars[qa_copy_i],'instance','slave')\n $qa_to=$replace($slave_vars[qa_copy_i],'instance',"+q(r)+")\n killvar $qa_to\n copyarr $qa_to,$qa_from\n qa_copy_i+=1\n jump 'qa_tv_clone_room'\nend\n";
  s=s.replaceAll('qa_tv_clone_room','qa_tv_clone_'+r);
  s+=`${r}_state=CONST_INT['slave_exist']\n$${r}_name=${q('QA_ROOM_'+n)}\n${r}['energy']=${n}\n${r}['jo9_focus']=1\n${r}['jo9_focus_known']=1\n`;
  s+="$qa_main_name=$slave_name\nqa_main_energy=slave['energy']\n"+`gs 'snk_room_bridge','enter',${n},1\n`;
  s+=check(`snk_room_target=${n} and $slave_name=${q('QA_ROOM_'+n)}`,tag+'_ENTER_SUBJECT');
  s+=`*clr\n$info_text=${q('QA_ROOM_STORY_'+n)}\nslave_stat_screen=0\ngs 'slave_stat'\n`+metadataExercise(tag);
  s+="gs 'snk_room_bridge','leave'\n"+check("snk_room_target=0 and $slave_name=$qa_main_name and slave['energy']=qa_main_energy",tag+'_MAIN_RESTORED')+check(`$${r}_name=${q('QA_ROOM_'+n)} and ${r}['energy']=${n}`,tag+'_ROOM_RESTORED')+check("snk_parked_slave_state=0 and $snk_parked_slave_name=''",tag+'_NO_PARKED_DUPLICATE');
 }
 return {name:'private-rooms',code:s};
}
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(record+'/evidence',{recursive:true});
fs.cpSync(game+'/json',out+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const tests=[roleFixture('slave',false),roleFixture('slave',true),roleFixture('assistant',false),roleFixture('assistant',true),roomsFixture()],plan=[];
function addLocation(doc,name,body){doc.lines[3]=core.shift(String(doc.locations.length+1),-5);doc.lines.splice(doc.lines.length-1,0,core.shift(name,-5),core.shift('',-5),core.shift(cr(body),-5),core.shift('0',-5));doc.locations=core.parse(core.serialize(doc)).locations;}
for(const test of tests){
 const doc=core.parse(raw);addLocation(doc,'qa_tv_snapshot',snap.join('\n'));
 const marker='JO9_QA_TRAITUI_'+test.name.replaceAll('-','_')+'_COMPLETE';
 const setup="usehtml=1\n"+prime+"\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\n$onnewloc=''\n$counter=''\nsound_on=0\nsnk_room_target=0\nis_home=1\ncity_district=-1\n$place='home_lux'\nslave_stat_screen=0\nassistant_stat_screen=0\nqa_checks=0\n";
 doc.lines[doc.locations.find(l=>l.name==='Start').body]=core.shift(cr(setup+test.code+'\nmsg '+q(marker)),-5);
 const bytes=core.serialize(doc);qa.inspectWorld(bytes);const file=path.join(out,test.name+'.qsp');fs.writeFileSync(file,bytes);plan.push({name:test.name,file,marker,checkpoint:'Actual profile renderer and read-only callback/description/remember/private-room paths'});
}
write(out+'/plan.json',plan);write(out+'/prepared.json',{candidate,sha256:core.hash(raw),sourceSave,tests:plan.length,staticAssertions:assertionCount,metadataLoops:true});
if(opt.prepare==='only'){console.log(JSON.stringify({prepared:true,out,cases:plan.length}));process.exit(0);}
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',out+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:245000});
fs.writeFileSync(out+'/runner.log',(run.stdout||'')+'\n'+(run.stderr||''));const results=fs.existsSync(out+'/client-results.json')?read(out+'/client-results.json'):[];
const htmlCaptures=[],captureErrors=[];
for(const file of fs.readdirSync(out).filter(x=>/-(before|open|info)\.sav$/.test(x))){
 const bytes=fs.readFileSync(path.join(out,file));
 if(bytes.length===0){captureErrors.push({file,bytes:0,error:'Diagnostic save is empty after interrupted/failed fixture'});continue;}
 try{const saved=sc.parse(bytes),html=sc.dec(saved.lines[8]),name=file.replace(/\.sav$/,'.html');fs.writeFileSync(path.join(record,'evidence',name),html);htmlCaptures.push({name,sha256:core.hash(Buffer.from(html)),chars:html.length});}
 catch(e){captureErrors.push({file,bytes:bytes.length,prefix:bytes.subarray(0,60).toString('utf16le'),error:e.message});}
}
for(const test of plan)for(const suffix of ['-stderr.log','-stdout.log']){const src=path.join(out,test.name+suffix);if(fs.existsSync(src))fs.copyFileSync(src,path.join(record,'evidence',test.name+suffix));}
for(const p of protectedHashes)assert.equal(core.hash(fs.readFileSync(p.path)),p.sha256,'Protected input changed: '+p.path);
const report={status:run.status===0&&results.length===plan.length&&results.every(x=>x.pass)&&captureErrors.length===0?'PASS':'FAIL',candidate:core.hash(raw),results,htmlCaptures,captureErrors,protectedInputs:protectedHashes.length,fixtureNotes:['Overflow fixture uses pregnant_revealed=2: pregnancy announcement already acknowledged, preserving the actual pregnancy display row.'],limits:['Native callback dispatch and HTML serialization; native DOM layout/click/popup layering tested separately.','GS profile rendering primes representative state and is not a full GUI save-load test.','Actor and money snapshot begins after original profile builder, preserving original builder side effects.']};
write(record+'/native-focused-results.json',report);console.log(JSON.stringify(report));assert.equal(report.status,'PASS','Native focus failed; see evidence and runner log');
