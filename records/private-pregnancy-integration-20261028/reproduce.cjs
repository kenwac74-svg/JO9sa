'use strict';
// 실행 보류: 최종 MSG 치환이 inline 중괄호를 손상시킨 실패 재현 스크립트다. STAGE18_KO.md 참조.
// 원래 상태 계산을 잇는 격리 QA. 게임·개인 SAV·records에는 쓰지 않는다.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const core = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const saveCodec = require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const workPath = 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const baselineHash='f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97';
const approvedWorkHash='e830028463ab3ca675e5e931110182883bb773e9a9403a1385d1d968114b9c98';
const currentDoc=core.parse(fs.readFileSync(workPath));
assert([baselineHash,approvedWorkHash].includes(currentDoc.hash),'예상 밖 WORK 변경은 중단');
const sourcePath=currentDoc.hash===baselineHash?workPath:'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp.bak_20261028_203116';
const enginePath = 'G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe';
const tmp = path.resolve('G:/Codex/tmp/jo9-private-pregnancy-integration-20261028');
const out = __dirname;
const protectedPaths = [...new Set([workPath,sourcePath, enginePath, 'G:/somi/JO9O/game/jack.qsp', 'G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_MANUAL_20261025/02_수동확인_문제재현/27_private_reports.sav'])];
const protectedBefore = protectedPaths.map(p => ({path:p,sha256:core.hash(fs.readFileSync(p))}));
const doc = core.parse(fs.readFileSync(sourcePath));
assert.equal(doc.hash,baselineHash);
const rootAuthorizedDelta={baselineHash,currentWorkHash:currentDoc.hash,changedLocations:doc.locations.filter(l=>{const other=currentDoc.locations.find(x=>x.name===l.name);return !other||doc.lines[l.body]!==currentDoc.lines[other.body];}).map(l=>l.name)};
assert(rootAuthorizedDelta.changedLocations.every(x=>x==='jo9_fog_relay'),'임신 관련 원문이 현재 WORK와 일치해야 한다');
const retry=process.argv.includes('--retry');
if (fs.existsSync(tmp)) {
 assert(retry, '기존 진단 폴더는 보존한다');
 assert.equal(fs.realpathSync(tmp),tmp);
 assert(!fs.lstatSync(tmp).isSymbolicLink());
 const prefix=fs.existsSync(path.join(out,'initial-native-results.json'))?'second-':'initial-';
 for(const name of ['native-results.json','native-stderr.log','native-stdout.log','qa-progress.sav','plan.json'])if(fs.existsSync(path.join(out,name))) {
  assert(!fs.existsSync(path.join(out,prefix+name)),'이전 실행 기록 보존');
  fs.copyFileSync(path.join(out,name),path.join(out,prefix+name));
 }
 // 첫 실행 근거를 보존한 뒤, 이번 스크립트가 만든 정확한 파일만 교체한다.
 const known=new Set(['integration.qsp','FastQSP.ini','plan.json','client-results.json','main-stderr.log','main-stdout.log','qa-progress.sav','qa-summary.sav']);
 for(const name of fs.readdirSync(tmp)) {
  if(name==='save') {assert(!fs.lstatSync(path.join(tmp,name)).isSymbolicLink());assert.equal(fs.readdirSync(path.join(tmp,name)).length,0);continue;}
  assert(known.has(name),'예상 밖 파일은 보존: '+name);
  assert(fs.lstatSync(path.join(tmp,name)).isFile());
  fs.unlinkSync(path.join(tmp,name));
 }
}
const refs = [];
const sanitizerChecks=[];
function body(n) { const l=doc.locations.find(x=>x.name===n); assert(l,n); return core.shift(doc.lines[l.body],5).replace(/\r\n/g,'\n'); }
function lines(n,a,b) { const s=body(n).split('\n').slice(a-1,b).join('\n'); refs.push({location:n,startLine:a,endLine:b,sha256:core.hash(Buffer.from(s))}); return s; }
function fn(n,k) { const t=body(n), a=t.indexOf(k+' = {'); assert(a>=0,k); const p=t.slice(0,a).split('\n').pop().match(/^\s*/)[0], r=new RegExp('\\n'+p+'\\}'); const m=r.exec(t.slice(a)); assert(m,k+' 끝'); const s=t.slice(a,a+m.index+m[0].length); refs.push({location:n,startLine:t.slice(0,a).split('\n').length,endLine:t.slice(0,a+s.length).split('\n').length,sha256:core.hash(Buffer.from(s))}); return s; }
// 조건·반복·레이블·분기 종료의 순서를 전후 비교한다. 따옴표 안의 콜론은 건너뛴다.
function firstColon(s) {
 let quote='';
 for(let i=0;i<s.length;i++) {
  if(quote) {if(s[i]===quote) {if(s[i+1]===quote)i++;else quote='';}}
  else if(s[i]==="'"||s[i]==='"')quote=s[i];
  else if(s[i]===':')return i;
 }
 return -1;
}
function controls(s) {
 const tokens=[];
 for(const line of s.split('\n')) {
  const t=line.trim();
  if(/^(if|elseif|loop|while|until|step)\b/i.test(t)) {const j=firstColon(t);tokens.push(j>=0?t.slice(0,j+1):t);}
  else if(/^(else|end)\b/i.test(t))tokens.push(t.match(/^(else|end)\b/i)[0]);
  if(/^:[A-Za-z0-9_]+/.test(t))tokens.push(t.match(/^:[A-Za-z0-9_]+/)[0]);
  for(const m of t.matchAll(/\bjump\s+(['"])([A-Za-z0-9_]+)\1/gi))tokens.push('jump '+m[2]);
  if(t==='{'||t==='}')tokens.push(t);
 }
 return tokens;
}
function textTargets(s) {return [...s.matchAll(/\$text\[[^\]]*\]\s*(\+?=)/g)].map(m=>m[0].replace(/\s+/g,''));}
// 표시 문자열은 QA로 바꾸되 원래 배열 인덱스·대입 연산·조건을 보존한다.
function qaProse(s) {
 const transformed=s.split('\n').map(l=> {
  const m=/\$(?:text\[[^\]]*\]|refuse_txt|tmp|bg_path|play_sound(?:\[[^\]]*\])?)\s*(\+?=)/.exec(l);
  if(m) {
   const prefix=/^\s*dynamic\b/.test(l)?'':l.slice(0,m.index);
   return prefix+m[0]+" 'QA'";
  }
  if(/\bpicMax\[/.test(l))return l.slice(0,l.indexOf('='))+'= 1';
  return l.replace(/\bmsg\s+.*$/, "msg 'QA_MESSAGE'");
 }).join('\n');
 const before=controls(s),after=controls(transformed);
 assert.deepEqual(after,before,'QA 치환이 제어 흐름 전체를 보존해야 한다');
 assert.deepEqual(textTargets(transformed),textTargets(s),'QA 치환이 text 배열 길이의 대입 구조를 보존해야 한다');
 sanitizerChecks.push({pass:true,controlCount:before.length,controlSha256:core.hash(Buffer.from(JSON.stringify(before))),textAssignments:textTargets(s).length});
 return transformed;
}
function put(d,n,s) { const l=d.locations.find(x=>x.name===n); assert(l,n); d.lines[l.body]=core.shift(s.replace(/\n/g,'\r\n'),-5); }
const d={...doc,lines:doc.lines.slice()};
let staticBody=body('#static_base');
staticBody=staticBody.replace('$update_slave_features_list = {', "$update_slave_features_list = {\n qa_features['dynslave'] += 1");
put(d,'#static_base',staticBody);
let dynamicBody=body('#dynamic');
for (const [key,addition] of [ ['$inseminate',"qa_inseminate[$args[0]] += 1"], ['$vaginally_penetrated',"qa_penetrated['dynslave'] += 1"], ['$master_ejaculate','qa_master_ejaculate += 1'] ]) {
 assert(dynamicBody.includes(key+' = {')); dynamicBody=dynamicBody.replace(key+' = {',key+' = {\n '+addition);
}
put(d,'#dynamic',dynamicBody);
put(d,'jo9_traits',body('jo9_traits').replace("if $args[0] = 'repair':", "if $args[0] = 'repair':\n qa_repair[$args[1]] += 1"));
let night=fn('next_day','$next_day_menses_preg_egglaying_update');
night=night.replace('$next_day_menses_preg_egglaying_update = {',"$next_day_menses_preg_egglaying_update = {\n qa_night['dynslave'] += 1");
const nightlyCall=lines('next_day',2055,2055);
const roles=['slave','assistant','room1','room2','room3','room4'];
const roster=['slave','assistant','prisoner','cow','room1','room2','room3','room4'];
const cases=[{role:'slave',interaction:5414,route:'direct'},{role:'assistant',interaction:441,route:'direct'}];
for(let n=1;n<=4;n++) cases.push({role:'room'+n,interaction:1026+n,route:'direct'});
const trials=Number(process.env.JO9_PP_TRIALS||(retry?1:12)); assert(Number.isInteger(trials)&&trials>=1&&trials<=12);
for(let n=1;n<=4;n++)for(let trial=0;trial<trials;trial++)cases.push({role:'room'+n,interaction:1026+n,route:'bridge',trial});
let assertions=0;
function check(cond,label) { assertions++; return `if (${cond})=0: msg 'FAIL_PPINTEGRATION_${label}' & exit\nqa_assertions += 1\n`; }
function progress(stage) {return `qa_stage=${stage}\nif qa_case_index=0: savegame 'qa-progress.sav'\n`;}
let driver="usehtml=1\nif qa_initialized=0:\n killall\n usehtml=1\n $onnewloc=''\n $ongload=''\n $onobjsel=''\n $counter=''\n settimer 0\n";
for(const n of ['#static_base','#static_txt','#variative','#dynamic','#moodlet_base','#item_base'])driver+=` gs '${n}'\n`;
driver+=" $onnewloc=''\n $ongload=''\n $onobjsel=''\n $counter=''\n qa_initialized=1\n qa_case_index=0\n qa_case_inflight=0\n hero_choice=13\n day=100\n debug=0\n debug_interactions=0\n cheat_no_starve=1\n is_perv=0\n slave_exist=1\n"+night+'\n';
for(const c of cases) driver+=` $qa_case_role[]='${c.role}'\n qa_case_interaction[]=${c.interaction}\n $qa_case_route[]='${c.route}'\n`;
driver+=" savegame 'qa-progress.sav'\nend\n";
driver+='if qa_case_inflight=1:\n';
driver+=check("$qa_result_partner=$qa_role and qa_result_res>=0",'accepted_partner');
driver+=check("qa_common_called=1 and qa_target_inseminated>=3 and qa_target_inseminated<=5",'actual_common_assignment');
driver+=check("snk_room_target=0 and snk_parked_slave_state=0",'restored_context');
for(let i=0;i<roles.length;i++) {
 const r=roles[i];
 driver+=check(`${r}['qa_id']=${100+i} and ${r}['age']=2 and ${r}_type=1435 and ${r}['fertility']=0`,r+'_identity');
 driver+=`if $qa_role ! '${r}':\n`+check(`${r}['inseminated']=0 and qa_inseminate['${r}']=0`,r+'_non_target')+'end\n';
}
driver+=progress(20)+"qa_before_features=dyneval('result = '+$qa_role+\"['inseminated']\")\n";
driver+="gs '$slave_traits'\n"+progress(21)+"dynamic $do_for_each_slave_in_list, '$newloc_update_slave', '$main_screen_slave_characters'\n"+progress(22);
driver+=check("dyneval('result = '+$qa_role+\"['inseminated']\")=qa_before_features",'features_preserve_marker');
driver+=check("qa_features[$qa_role]>0 and qa_repair[$qa_role]>0",'real_features_repair_executed');
driver+=check("dyneval('result = '+$qa_role+\"['jo9_work_ethic']\")=1 and dyneval('result = '+$qa_role+\"['passion_comfort']\")=-1",'canonical_trait_preserved');
driver+="qa_stage=30\n"+nightlyCall+'\n';
for(const r of roster) driver+=check(`qa_night['${r}']=1`,r+'_nightly_roster_call');
for(const r of roles) {
 driver+=check(`${r}['cycle_day']=19`,r+'_daily_cycle');
 driver+=`if $qa_role='${r}':\n`+check(`${r}['inseminated']=qa_before_features-1 and ${r}['ovulation']=0 and ${r}['pregnant']>=0 and ${r}['pregnant']<=1 and ${r}['pregnant_revealed']=0`,r+'_daily_target');
 driver+=` if ${r}['pregnant']=1: qa_success['${r}:'+ $qa_route]+=1\n if ${r}['pregnant']=0: qa_failures['${r}:'+ $qa_route]+=1\nelse\n`+check(`${r}['inseminated']=0 and ${r}['pregnant']=0 and ${r}['ovulation']=1`,r+'_daily_other')+'end\n';
}
driver+="qa_cases_passed+=1\nqa_case_inflight=0\nqa_case_index+=1\nqa_stage=40\n";
driver+="savegame 'qa-progress.sav'\nend\n";
driver+=`if qa_case_index>=${cases.length}:\n savegame 'qa-summary.sav'\n msg 'JO9_QA_PPINTEGRATION_main_COMPLETE'\n exit\nend\n`;
driver+="$qa_role=$qa_case_role[qa_case_index]\n$qa_route=$qa_case_route[qa_case_index]\nqa_interaction=qa_case_interaction[qa_case_index]\n"+progress(10);
for(const r of [...roster,'snk_parked_slave'])driver+=`killvar '${r}'\nkillvar '$${r}'\nkillvar '${r}_rate'\nkillvar 'interaction_${r}'\n${r}_state=0\n${r}_type=0\n`;
driver+=progress(11)+"killvar 'qa_inseminate'\nkillvar 'qa_penetrated'\nkillvar 'qa_features'\nkillvar 'qa_repair'\nkillvar 'qa_night'\nqa_master_ejaculate=0\nsnk_room_target=0\nmaster_excitement=3\nmaster_excitement_rate=80\nmaster_style=5\nmaster_libido=2\nmaster_penetration=3\nmaster_domination=3\nmaster_str=3\nmaster_str_rate=100\nmaster_energy=5\nmaster_half_action=0\nmaster_ill=0\nmaster_check=1\n";
const values={age:2,energy:3,stamina:3,fat:2,beauty:3,style:3,exotic:3,metabolism:3,intellect:3,ego:2,temper:2,pride:0,moral:5,custom:5,rational:5,instinct:3,obedience:5,mood:5,arousal:3,fear:0,angst:0,spoil:0,virginity:2,sub_vaginal:3,roleplay:3,oral:3,fertility:0,cycle_day:20,ovulation:2,menstruation:0,pregnant:0,pregnant_revealed:0,inseminated:0,jo9_work_ethic:1,passion_comfort:-1,jo9_work_ethic_known:1,passion_comfort_revealed:2,jo9_meiki_initialized:2,jo9_meiki_prev:2,jo9_meiki_checked:1};
for(let i=0;i<roles.length;i++) {
 const r=roles[i]; driver+=`${r}_state=CONST_INT['slave_exist']\n${r}_type=1435\n${r}['qa_id']=${100+i}\n$${r}_name='QA_${r}'\n$${r}_psy_status='obedient'\n$${r}['wpn']='безоружный'\n$${r}['armor']='без_брони'\n$${r}['cloth']='maid_dress'\n`;
 for(const [k,v] of Object.entries(values))driver+=`${r}['${k}']=${v}\n`;
 for(const k of ['beauty','style','exotic'])driver+=`${r}_rate['${k}']=100\n`;
}
driver+=progress(12)+"dynamic $qa_role+\"['ovulation']=1\"\nqa_case_inflight=1\nqa_common_called=0\nqa_target_inseminated=0\n$qa_result_partner=''\nqa_result_res=-999\ninteraction=qa_interaction\n"+progress(13);
driver+="if $qa_route='bridge':\n gs 'snk_room_bridge','enter',qa_interaction-1026,1\n";
driver+=check("snk_room_target=qa_interaction-1026 and slave['qa_id']=102+snk_room_target-1 and snk_parked_slave['qa_id']=100",'bridge_enter_identity');
driver+=" gs 'snk_room_bridge','room_sex'\n msg 'FAIL_PPINTEGRATION_bridge_transfer'\n exit\nend\ngt 'interaction'\n";
put(d,'Start',driver);
let interaction=progress(14)+"qa_actual_interaction_entries+=1\n";
interaction+=check('snk_room_target=0 and slave[\'qa_id\']=100 and interaction=qa_interaction','interaction_entry_context');
interaction+=progress(15)+qaProse(lines('interaction',1,160))+'\n'+progress(16);
interaction+=qaProse(lines('interaction',2092,2140))+'\n';
interaction+=qaProse(lines('interaction',8372,8554))+'\n';
interaction+="$text[1]='QA_ACTION'\n"+progress(17)+"gt 'interaction_result'\n";
put(d,'interaction',interaction);
let result=progress(18)+qaProse(lines('interaction_result',12,240))+'\n';
result+=qaProse(lines('interaction_result',244,253))+'\nend\n';
result+=progress(19)+"$qa_result_partner=$interaction_partner\nqa_result_res=dyneval('result = interaction_'+$interaction_partner+\"['res']\")\n";
result+=qaProse(lines('interaction_result',642,704))+'\n';
result+="qa_common_called=qa_inseminate[$interaction_partner]\nqa_target_inseminated=dyneval('result = '+$interaction_partner+\"['inseminated']\")\n";
result+=qaProse(lines('interaction_result',1712,1729))+'\n';
result+=lines('interaction_result',1795,1795)+'\n'+lines('interaction_result',1899,1907)+"\ngt 'interaction_screen'\n";
assert(result.includes("if i <= arrsize('$text') - 1:"),'QA 표시 제거가 원래 반복 종료조건을 보존해야 한다');
put(d,'interaction_result',result);
put(d,'interaction_screen',"qa_actual_result_returns+=1\ngt 'Start'");
put(d,'display_pic',"$result=''");
const plan=[{name:'main',file:path.join(tmp,'integration.qsp'),marker:'JO9_QA_PPINTEGRATION_main_COMPLETE',checkpoint:'실제 수락 계산·공통 결과·bridge 복귀·원래 특성 갱신/repair·일일8역할 순회의 연결'}];
fs.mkdirSync(tmp,{recursive:true});
fs.writeFileSync(plan[0].file,core.serialize(d));
fs.writeFileSync(path.join(tmp,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
fs.writeFileSync(path.join(tmp,'plan.json'),JSON.stringify(plan,null,2));
const manifest={status:'PREPARED',sourceSha256:doc.hash,sourcePath,rootAuthorizedDelta,cases,normalState:values,refs,sanitizerChecks,instrumentation:['표식·실제 공통 함수·특성 목록·repair·일일 순회에 QA 카운터만 추가','장면/이미지/소리 문자열을 QA로 치환하고 text 배열 인덱스·대입을 보존','관련 수락/결과 분기를 추출하고 원래 주인공 계산·원래 특성 갱신을 유지','결과 화면을 합성 QA 이어달리기로 변경','체크포인트 SAVEGAME은 작업 tmp 기준 상대 경로 사용'],limitations:['실제 GUI 선택/수락 클릭, 사용자 SAV 및 동적 캐시 로드는 없음','일일 전체 사건·경제·진단/출산 동선은 실행하지 않음','정상 범위의 배란 전날 예시이며 자연20~30일 플레이 재현이나 확률 통계가 아님']};
fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify(manifest,null,2)+'\n');
if(process.argv.includes('--prepare-only')) { console.log(JSON.stringify({prepared:true,tmp,cases:cases.length})); process.exit(0); }
const run=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File','G:/somi/JO9sa/tools/qa/run-client-smoke.ps1','-Engine',enginePath,'-Plan',path.join(tmp,'plan.json'),'-TimeoutSeconds','60'],{encoding:'utf8',windowsHide:true,timeout:75000});
const resultsPath=path.join(tmp,'client-results.json');
const results=fs.existsSync(resultsPath)?JSON.parse(fs.readFileSync(resultsPath,'utf8').replace(/^\uFEFF/,'')):[];
for(const ext of ['stderr','stdout'])if(fs.existsSync(path.join(tmp,'main-'+ext+'.log')))fs.copyFileSync(path.join(tmp,'main-'+ext+'.log'),path.join(out,'native-'+ext+'.log'));
let summary=null;
for(const name of ['qa-progress.sav','qa-summary.sav'])if(fs.existsSync(path.join(tmp,name))) {fs.copyFileSync(path.join(tmp,name),path.join(out,name)); if(name==='qa-summary.sav')summary=saveCodec.parse(fs.readFileSync(path.join(tmp,name)));}
const state=summary|| (fs.existsSync(path.join(out,'qa-progress.sav'))?saveCodec.parse(fs.readFileSync(path.join(out,'qa-progress.sav'))):null);
const num=(name,key)=>state?Number(saveCodec.value(state,name,key)[0]||0):null;
const report={status:results.length===1&&results[0].pass&&summary?'NATIVE_CONNECTED_PASS':'NATIVE_CONNECTED_INCOMPLETE',sourceSha256:doc.hash,sourcePath,rootAuthorizedDelta,results,engineRunnerExit:run.status,caseCount:cases.length,casesPassed:num('qa_cases_passed'),assertions:num('qa_assertions'),lastStage:num('qa_stage'),lastCaseIndex:num('qa_case_index'),actualInteractionEntries:num('qa_actual_interaction_entries'),actualResultReturns:num('qa_actual_result_returns'),outcomes:roles.flatMap(role=>['direct','bridge'].map(route=>({role,route,pregnant:num('qa_success',role+':'+route),notPregnant:num('qa_failures',role+':'+route)}))),protected:protectedBefore.map(p=>({...p,unchanged:core.hash(fs.readFileSync(p.path))===p.sha256})),userSaveLoaded:false,userSaveWritten:false,limitations:manifest.limitations,diagnosticsCleaned:false};
assert(report.protected.every(p=>p.unchanged));
fs.writeFileSync(path.join(out,'native-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
