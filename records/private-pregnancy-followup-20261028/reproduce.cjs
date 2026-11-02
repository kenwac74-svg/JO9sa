'use strict';
// Execute narrowly extracted, unchanged state calculations in isolated native QSP copies.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const work='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',original='G:/somi/JO9O/game/jack.qsp';
const protectedFiles=[work,original,'G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_MANUAL_20261025/02_수동확인_문제재현/27_private_reports.sav'];
const before=protectedFiles.map(p=>({path:p,hash:c.hash(fs.readFileSync(p))}));
const raw=fs.readFileSync(work),doc=c.parse(raw);assert.equal(doc.hash,'e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0');
const tmp=path.resolve('G:/Codex/tmp/jo9-private-pregnancy-followup-20261028'),normalTrials=12;
const body=n=>{const l=doc.locations.find(l=>l.name===n);assert(l,n);return c.shift(doc.lines[l.body],5).replace(/\r\n/g,'\n');};
const refs=[];
function span(n,a,b,includeB=false){const text=body(n),start=text.indexOf(a);assert(start>=0,n+' '+a);const end=text.indexOf(b,start+a.length);assert(end>start,n+' end '+b);const s=text.slice(start,end+(includeB?b.length:0));refs.push({location:n,startLine:text.slice(0,start).split('\n').length,endLine:text.slice(0,start+s.length).split('\n').length,sha256:c.hash(Buffer.from(s))});return s;}
function fn(n,name){const text=body(n),a=text.indexOf(name+' = {'),b=text.indexOf('\n}',a);assert(a>=0&&b>a,name);return span(n,name+' = {','\n}',true);}
const forEach=fn('#static_base','$do_for_each_slave_in_list');
const swap=fn('#static_base','$swap_slave_instances');
const schema=span('#static_base',"killvar '$playable_vars'",'$swap_slave_instances = {');
const inseminate=fn('#dynamic','$inseminate'),penetrated=fn('#dynamic','$vaginally_penetrated'),night=fn('next_day','$next_day_menses_preg_egglaying_update');
const roster=span('#static_base',"killvar '$main_screen_slave_characters'",'!slaves in management roles');
const typeArrays=body('interaction_result').split('\n').filter(s=>/^\s*\$(?:master_.*_interaction_types|other_interaction_types|ignored_interaction_types)\[\]\s*=/.test(s)).join('\n');
const selector=span('interaction_result',"if arrcomp('$master_slave_interaction_types'",'!consolidated pre-work');
const display=span('sjm_UI_UIadds',"if $args[0] = 'preg_label'",'! JO9 MOD END J9M2690');
const nativeNightCall=body('next_day').split('\n').find(s=>s.startsWith("dynamic $do_for_each_slave_in_list, '$next_day_menses_preg_egglaying_update'"));assert(nativeNightCall);
const clinics={};
for(let n=1;n<=4;n++){
 const role='room'+n;
 const source=span('interaction_city',`\tif ${role}['pregnant'] > 9 and`, '\n\tend',true);
 // Only the rendered clinic sentence changes; all diagnosis conditions/counters/flags remain native.
 const sanitized=source.split('\n').map(line=>/^\s*\$text\[/.test(line)?`  $text[${role}_issues] = 'QA_DIAGNOSIS'`:line).join('\n');
 clinics[role]=`$qa_clinic_${role} = {\n${sanitized}\n}\n`;
}
const general="usehtml=1\n$onnewloc=''\n$counter=''\nCONST_INT['no_slave']=0\nCONST_INT['slave_exist']=1\nCONST_INT['slave_faint']=2\nCONST_INT['young_age']=1\nCONST_INT['milf_age']=3\nhero_choice=13\nday=100\nmaster_libido=2\nmaster_excitement=3\nmaster_ill=0\nmaster_str=3\n";
let checks=0,code=general+roster+'\n'+forEach+'\n'+inseminate+'\n'+penetrated+'\n'+night+'\n'+typeArrays+'\n'+Object.values(clinics).join('\n');
// The parent calculation is outside the pregnancy subject; isolate it from unrelated protagonist stats.
code+="$master_ejaculate = {qa_suppressed_master_stats+=1}\n";
function check(cond,label){const terms=cond.split(' and ');for(let i=0;i<terms.length;i+=8){checks++;code+=`if (${terms.slice(i,i+8).join(' and ')})=0: msg 'FAIL_PRIVATEPREG_${label}${i?'_'+i:''}' & exit\nqa_assertions_passed+=1\nqa_stage=${checks}\nsavegame '${tmp.replace(/\\/g,'/')}/qa-progress.sav'\n`;}}
function set(role,values){for(const [key,value]of Object.entries(values))code+=`${role}['${key}']=${value}\n`;}
function clearRoles(){for(const role of ['slave','assistant','prisoner','cow','room1','room2','room3','room4'])code+=`killvar '${role}'\nkillvar '$${role}'\nkillvar '${role}_rate'\n${role}_state=0\n${role}_type=0\n`;}
function adult(role,type=1435){clearRoles();code+=`${role}_state=1\n${role}_type=${type}\n`;set(role,{age:2,virginity:2,sub_vaginal:1,jo9_meiki_initialized:2,jo9_meiki_prev:2,jo9_meiki_checked:1,fertility:0,cycle_day:20,ovulation:1,menstruation:0,pregnant:0,pregnant_revealed:0,inseminated:0,stamina:3});}
const summaries=[];
for(let n=1;n<=4;n++){
 const role='room'+n,id=1026+n;
 const start=body('interaction').indexOf(`if interaction = ${id}:`);assert(start>=0);
 const tail=body('interaction').slice(start),kind=tail.match(/^\s*\$interaction_type = 'make_room[1-4]_do'/m)?.[0];assert(kind);
 const nativePenetrationCall=tail.split('\n').find(s=>s.includes("$vaginally_penetrated")&&s.includes("'"+role+"'"));assert(nativePenetrationCall);
 adult(role);code+=`interaction=${id}\n${kind}\n${selector}\n`;
 check(`$interaction_partner='${role}'`,role+'_native_subject');
 code+=`ejaculation_intensity=5\n${nativePenetrationCall}\n`;
 check(`${role}['inseminated']>=3 and ${role}['inseminated']<=5 and ${role}['cum_load']=5 and slave['inseminated']=0 and assistant['inseminated']=0`,role+'_native_common_assignment');
 // Valid native special-case type2572 guarantees conception at a fresh ovulation opportunity.
 adult(role,2572);code+=`ejaculation_intensity=5\n${nativePenetrationCall}\n${nativeNightCall}\n`;
 check(`${role}['pregnant']=1 and ${role}['pregnant_revealed']=0 and ${role}['ovulation']=0 and ${role}['cycle_day']=19`,role+'_special2572_deterministic');
 // Normal non-special type: actual rand(3,5), daily decrement, and actual rand(1,5) over120 trials.
 code+=`qa_success['${role}']=0\nqa_failures['${role}']=0\n`;
 code+=`qa_trial=0\n:qa_normal_${role}\n`;
 {
  adult(role);code+=`ejaculation_intensity=5\n${nativePenetrationCall}\n${nativeNightCall}\nif qa_trial=0:\n`;
  check(`${role}['inseminated']>=2 and ${role}['inseminated']<=4 and ${role}['ovulation']=0 and ${role}['pregnant']>=0 and ${role}['pregnant']<=1`,role+'_normal_domain');code+='end\n';
  code+=`if ${role}['pregnant']=1:\n qa_success['${role}']+=1\nelse\n qa_failures['${role}']+=1\nend\n`;
 }
 code+=`qa_trial+=1\nif qa_trial<${normalTrials}: jump 'qa_normal_${role}'\n`;
 check(`qa_success['${role}']+qa_failures['${role}']=${normalTrials}`,role+'_normal_native_observed');
 adult(role);set(role,{inseminated:5,ovulation:2});code+=nativeNightCall+'\n';
 check(`${role}['pregnant']=0 and ${role}['ovulation']=1 and ${role}['cycle_day']=19 and ${role}['inseminated']=4`,role+'_no_ovulation_no_conception');
 for(const infertile of [-1,-3]){adult(role,2572);set(role,{fertility:infertile,inseminated:5});code+=nativeNightCall+'\n';check(`${role}['pregnant']=0 and ${role}['inseminated']=4`,role+'_infertile_'+String(infertile).replace('-','minus'));}
 adult(role);set(role,{pregnant:30,inseminated:4});code+=nativeNightCall+'\n';
 check(`${role}['pregnant']=31 and ${role}['inseminated']=3 and ${role}['pregnant_revealed']=0`,role+'_pregnancy_continues_hidden');
 code+=`$qa_label=$func('sjm_UI_UIadds','preg_label',${role}['pregnant'],${role}['pregnant_revealed'],${role}['fertility'],${role}['vaginal_modification'],${role}['parasite'])\n`;
 check("$qa_label=''",role+'_hidden_label');
 adult(role);set(role,{pregnant:119});code+=nativeNightCall+'\n';
 check(`${role}['pregnant']=120 and ${role}['pregnant_revealed']=1 and ${role}['fertility_revealed']=1`,role+'_natural_discovery_120');
 code+=`$qa_label=$func('sjm_UI_UIadds','preg_label',${role}['pregnant'],${role}['pregnant_revealed'],${role}['fertility'],${role}['vaginal_modification'],${role}['parasite'])\n`;
 check("$qa_label ! ''",role+'_discovered_label');
 adult(role);set(role,{pregnant:9});code+=`${role}_issues=0\n${role}_abortion=0\ndynamic $qa_clinic_${role}\n`;
 check(`${role}['pregnant_revealed']=0 and ${role}_issues=0 and ${role}_abortion=0`,role+'_clinic_day9_not_detected');
 set(role,{pregnant:10});code+=`dynamic $qa_clinic_${role}\n`;
 check(`${role}['pregnant_revealed']=2 and ${role}_issues=1 and ${role}_abortion=1`,role+'_clinic_day10_detected');
 code+=`$qa_label=$func('sjm_UI_UIadds','preg_label',${role}['pregnant'],${role}['pregnant_revealed'],${role}['fertility'],${role}['vaginal_modification'],${role}['parasite'])\n`;
 check("$qa_label ! ''",role+'_clinic_discovery_label');
 summaries.push({role,interaction:id,normalType:1435,normalTrials,normalStateDomain:'age2,hero13,fertility0,cycle_day20,ovulation1,inseminated from original rand3..5',deterministicType:2572,deterministicMeaning:'Native type-specific threshold1, not a general-play guarantee'});
}
// Inactive role must not progress; zero viable marker cannot conceive even with special type.
adult('room1',2572);set('room1',{inseminated:0});code+=nativeNightCall+'\n';check("room1['pregnant']=0",'no_viable_marker');
adult('room1');code+="room1_state=0\n";set('room1',{pregnant:40,inseminated:4});code+=nativeNightCall+'\n';check("room1['pregnant']=40 and room1['inseminated']=4",'inactive_skipped');
assert(tmp===path.resolve('G:/Codex/tmp/jo9-private-pregnancy-followup-20261028'));assert(!fs.existsSync(tmp),'Preserve existing diagnostic directory');fs.mkdirSync(tmp,{recursive:true});
code+=`savegame '${tmp.replace(/\\/g,'/')}/qa-summary.sav'\nmsg 'JO9_QA_PRIVATEPREG_main_COMPLETE'\n`;
function clone(){return {...doc,lines:doc.lines.slice()};}
function put(d,n,text){const l=d.locations.find(l=>l.name===n);assert(l,n);d.lines[l.body]=c.shift(text.replace(/\n/g,'\r\n'),-5);}
const main=clone();put(main,'Start',code);put(main,'sjm_UI_UIadds',display);fs.writeFileSync(path.join(tmp,'main.qsp'),c.serialize(main));
const plan=[{name:'main',file:path.join(tmp,'main.qsp'),marker:'JO9_QA_PRIVATEPREG_main_COMPLETE',checkpoint:'Native room1..4 subject, original insemination and nightly updater, display and clinic mechanics;48 normal-domain examples and special deterministic controls'}];
for(let n=1;n<=4;n++){
 const d=clone(),role='room'+n;
 let init=general+schema+'\n'+swap+'\n'+inseminate+"\n$update_slave_features_list=''\nslave_state=1\nslave_type=1447\nslave['id']=100\nslave['age']=2\nslave['pregnant']=0\nslave['energy']=3\nsnk_room_target=0\n";
 init+=`${role}_state=1\n${role}_type=1435\n${role}['id']=${200+n}\n${role}['age']=2\n${role}['energy']=3\n${role}['pregnant']=31\n`;
 init+=`gs 'snk_room_bridge','enter',${n},1\n`;
 init+=`if slave['id']!${200+n} or snk_parked_slave['id']!100: msg 'FAIL_PRIVATEPREG_bridge_enter_${n}' & exit\n`;
 init+="ejaculation_intensity=5\ndynamic $inseminate,'slave'\ngs 'snk_room_bridge','room_sex'\nmsg 'FAIL_PRIVATEPREG_route_did_not_transfer'\n";
 let route=`if interaction!${1026+n} or snk_room_target!0 or slave['id']!100 or ${role}['id']!${200+n}: msg 'FAIL_PRIVATEPREG_route_${n}' & exit\n`;
 route+=`if ${role}['pregnant']!31 or ${role}['inseminated']<3 or ${role}['inseminated']>5 or slave['inseminated']!0 or snk_parked_slave_state!0: msg 'FAIL_PRIVATEPREG_commit_${n}' & exit\n`;
 route+=`msg 'JO9_QA_PRIVATEPREG_room_${['one','two','three','four'][n-1]}_COMPLETE'\n`;
 put(d,'Start',init);put(d,'interaction',route);
 for(const loc of ['#var_base','#txt_man','#txt_2_man'])put(d,loc,'qa_suppressed_display_refreshes+=1');
 fs.writeFileSync(path.join(tmp,'room-'+['one','two','three','four'][n-1]+'.qsp'),c.serialize(d));
 plan.push({name:'room-'+['one','two','three','four'][n-1],file:path.join(tmp,'room-'+['one','two','three','four'][n-1]+'.qsp'),marker:'JO9_QA_PRIVATEPREG_room_'+['one','two','three','four'][n-1]+'_COMPLETE',checkpoint:'Original bridge enter, original schema swap, insemination while temporarily active, original leave/room_sex routing; narrative refreshes replaced by QA counters only'});
}
fs.writeFileSync(path.join(tmp,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');fs.writeFileSync(path.join(tmp,'plan.json'),JSON.stringify(plan,null,2));
fs.writeFileSync(__dirname+'/plan.json',JSON.stringify({sha256:doc.hash,assertions:checks,mainFixtures:summaries,routeFixtures:4,refs,diagnosticOnlyChanges:['Start replaced by synthetic adult fixture','sjm_UI_UIadds restricted to original pregnancy label function','Route fixtures interaction stops before its original scene; display refresh locations use QA counters only','Main fixture replaces unrelated master-stat dynamic with QA counter; pregnancy gate and original inseminate remain unchanged'],forbiddenWrites:protectedFiles},null,2)+'\n');
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine','G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe','-Plan',path.join(tmp,'plan.json'),'-TimeoutSeconds','25'],{encoding:'utf8',windowsHide:true,timeout:150000});
const results=JSON.parse(fs.readFileSync(path.join(tmp,'client-results.json'),'utf8').replace(/^\uFEFF/,''));
for(const item of plan)fs.copyFileSync(path.join(tmp,item.name+'-stderr.log'),path.join(__dirname,item.name+'-native-log.txt'));
const summaryPath=path.join(tmp,'qa-summary.sav'),summary=fs.existsSync(summaryPath)?sc.parse(fs.readFileSync(summaryPath)):null;
if(summary){assert(sc.serialize(summary).equals(fs.readFileSync(summaryPath)));fs.copyFileSync(summaryPath,__dirname+'/qa-summary.sav');}
const progressPath=path.join(tmp,'qa-progress.sav');if(!summary&&fs.existsSync(progressPath))fs.copyFileSync(progressPath,__dirname+'/qa-progress.sav');
const report={status:results.every(r=>r.pass)&&summary?'NATIVE_ISOLATED_PASS':'NATIVE_ISOLATED_FAILED',workHash:doc.hash,engineExit:run.status,assertionsExpected:checks,assertionsObserved:summary?Number(sc.value(summary,'qa_assertions_passed')[0]):null,results,normalTrials:summaries.map(s=>({...s,successes:summary?Number(sc.value(summary,'qa_success',s.role)[0]):null,failures:summary?Number(sc.value(summary,'qa_failures',s.role)[0]):null})),summarySaved:!!summary,summaryHash:summary?c.hash(fs.readFileSync(summaryPath)):null,protected:before.map(p=>({...p,unchanged:c.hash(fs.readFileSync(p.path))===p.hash})),userSaveLoaded:false,userSaveWritten:false,limitations:['Synthetic adult age2/male hero13 state only; no actual reported save or saved dynamic cache loaded.','Four type2572 controls use an existing native special threshold; they do not establish a guarantee for ordinary types.','48 normal-domain examples force valid ovulation opportunities rather than simulate20-30 complete game days. The observed mix is not a success-rate estimate.','Original pregnancy functions and target/routing code execute; rendered prose and unrelated master-stat/display refreshes are isolated as documented.','Main common-helper tests assume an accepted qualifying interaction; actual acceptance/refusal and the complete interaction scene are not run.','No physical GUI interaction, full clinic navigation, whole-day economic/event progression, childbirth, relationship or balance changes are tested.']};
fs.writeFileSync(__dirname+'/native-results.json',JSON.stringify(report,null,2)+'\n');
assert(report.protected.every(p=>p.unchanged));
// Delete only known files created by this script, after checking absolute scope and junction status.
assert(fs.realpathSync(tmp)===tmp&&!fs.lstatSync(tmp).isSymbolicLink());
const known=new Set(['FastQSP.ini','plan.json','client-results.json','qa-summary.sav','qa-progress.sav',...plan.flatMap(p=>[path.basename(p.file),p.name+'-stderr.log',p.name+'-stdout.log'])]);
if(fs.existsSync(path.join(tmp,'save'))){const save=path.join(tmp,'save');assert(!fs.lstatSync(save).isSymbolicLink());assert.equal(fs.readdirSync(save).length,0,'Preserve unexpected saves');fs.rmdirSync(save);}
for(const name of fs.readdirSync(tmp)){assert(known.has(name),'Preserve unexpected file '+name);assert(fs.lstatSync(path.join(tmp,name)).isFile());}
for(const name of fs.readdirSync(tmp))fs.unlinkSync(path.join(tmp,name));fs.rmdirSync(tmp);report.diagnosticsCleaned=true;fs.writeFileSync(__dirname+'/native-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,engineExit:run.status,checks:report.assertionsObserved,results,normalTrials:report.normalTrials.map(x=>({role:x.role,n:x.normalTrials,success:x.successes,fail:x.failures})),protectedUnchanged:report.protected.every(x=>x.unchanged),diagnosticsCleaned:true}));
assert.equal(report.status,'NATIVE_ISOLATED_PASS');assert.equal(report.assertionsObserved,checks);
