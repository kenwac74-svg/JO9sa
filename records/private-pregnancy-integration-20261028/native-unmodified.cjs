'use strict';
// 승인된 접근 변경: 원문 location은 Start와 최종 renderer 외에는 바꾸지 않는다.
// 원문 문자열을 편집·출력하지 않고, 엔진 메시지는 메모리에서 식별자만 분류한다.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const baseline='f6520ef11a720f6d15127738032be960acc1153eb653e2760495b880e85cef97';
const work='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp';
const source='G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp.bak_20261028_203116';
const engine='G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe';
const count=Number(process.argv[2]||1);assert([1,10].includes(count));
const runName=count===1?'unmodified-probe':'unmodified-ten';
const root=path.resolve('G:/Codex/tmp/jo9-private-pregnancy-integration-20261028');
const tmp=path.join(root,runName);assert(tmp.startsWith(root+path.sep));assert(!fs.existsSync(tmp),'기존 실행 자료 보존');
const protectedFiles=[work,source,engine,'G:/somi/JO9O/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4_work/game/save/JO9_MANUAL_20261025/02_수동확인_문제재현/27_private_reports.sav'];
const before=protectedFiles.map(p=>({path:p,sha256:core.hash(fs.readFileSync(p))}));
const doc=core.parse(fs.readFileSync(source)),current=core.parse(fs.readFileSync(work));assert.equal(doc.hash,baseline);
const delta=doc.locations.filter(l=>{const x=current.locations.find(x=>x.name===l.name);return !x||doc.lines[l.body]!==current.lines[x.body];}).map(l=>l.name);
assert(delta.every(n=>n==='jo9_fog_relay'));assert.equal(doc.locations.length,current.locations.length);
const body=n=>{const l=doc.locations.find(x=>x.name===n);assert(l,n);return core.shift(doc.lines[l.body],5).replace(/\r\n/g,'\n');};
const nightStart=body('next_day').indexOf('$next_day_menses_preg_egglaying_update = {');
const nightEnd=body('next_day').indexOf('\n}',nightStart)+2;assert(nightStart>=0&&nightEnd>nightStart);
const night=body('next_day').slice(nightStart,nightEnd);
const nightCall=body('next_day').split('\n').find(l=>l.startsWith("dynamic $do_for_each_slave_in_list, '$next_day_menses_preg_egglaying_update'"));assert(nightCall);
const roles=['slave','assistant','room1','room2','room3','room4'];
const roster=['slave','assistant','prisoner','cow','room1','room2','room3','room4'];
const cases=[{role:'slave',id:5414,route:'direct'},{role:'assistant',id:441,route:'direct'}];
for(let n=1;n<=4;n++)cases.push({role:'room'+n,id:1026+n,route:'direct'});
for(let n=1;n<=4;n++)cases.push({role:'room'+n,id:1026+n,route:'bridge'});
cases.length=count;
const marker='JO9_QA_PPNATIVE_'+(count===1?'probe':'ten')+'_COMPLETE';
function check(condition,id){return `if (${condition})=0: msg 'FAIL_PPNATIVE_${id}' & exit\nqa_assertions+=1\n`;}
const checkpoint=n=>`qa_stage=${n}\nsavegame 'qa-progress.sav'\n`;
let start="usehtml=1\nif qa_initialized=0:\n killall\n usehtml=1\n $onnewloc=''\n $ongload=''\n $onobjsel=''\n $counter=''\n settimer 0\n";
for(const n of ['#static_base','#static_txt','#variative','#dynamic','#moodlet_base','#item_base'])start+=` gs '${n}'\n`;
start+=" $onnewloc=''\n $ongload=''\n $onobjsel=''\n $counter=''\n hero_choice=13\n day=100\n debug=0\n debug_interactions=0\n is_perv=0\n cheat_no_starve=1\n qa_initialized=1\n qa_case_index=0\n qa_case_inflight=0\n"+night+'\n';
for(const c of cases)start+=` $qa_roles[]='${c.role}'\n qa_ids[]=${c.id}\n $qa_routes[]='${c.route}'\n`;
start+='end\nif qa_case_inflight=1:\n'+checkpoint(20);
start+=check('snk_room_target=0 and snk_parked_slave_state=0','context_restored');
start+=check("$interaction_partner=$qa_role",'partner');
start+="qa_marker_before=dyneval('result = '+$qa_role+\"['inseminated']\")\n";
start+=check('qa_marker_before>=3 and qa_marker_before<=5','original_result_marker');
for(let i=0;i<roles.length;i++) {
 const r=roles[i];
 start+=check(`${r}['qa_id']=${100+i} and ${r}['age']=2 and ${r}_type=1435 and ${r}['fertility']=0`,r+'_identity');
 start+=`if $qa_role ! '${r}':\n`+check(`${r}['inseminated']=0`,r+'_not_target')+'end\n';
}
start+="gs '$slave_traits'\n"+checkpoint(21)+"dynamic $do_for_each_slave_in_list, '$newloc_update_slave', '$main_screen_slave_characters'\n"+checkpoint(22);
start+=check("dyneval('result = '+$qa_role+\"['inseminated']\")=qa_marker_before",'features_repair_marker');
start+=check("dyneval('result = '+$qa_role+\"['jo9_work_ethic']\")=1 and dyneval('result = '+$qa_role+\"['passion_comfort']\")=-1",'canonical_traits');
start+=nightCall+'\n'+checkpoint(30);
for(const r of roles) {
 start+=check(`${r}['cycle_day']=19`,r+'_roster_cycle');
 start+=`if $qa_role='${r}':\n`+check(`${r}['inseminated']=qa_marker_before-1 and ${r}['ovulation']=0 and ${r}['pregnant']>=0 and ${r}['pregnant']<=1 and ${r}['pregnant_revealed']=0`,r+'_day_target');
 start+=` if ${r}['pregnant']=1: qa_pregnant['${r}:'+$qa_route]+=1\n if ${r}['pregnant']=0: qa_not_pregnant['${r}:'+$qa_route]+=1\nelse\n`+check(`${r}['inseminated']=0 and ${r}['ovulation']=1 and ${r}['pregnant']=0`,r+'_day_other')+'end\n';
}
start+="qa_cases_passed+=1\nqa_case_inflight=0\nqa_case_index+=1\n"+checkpoint(40)+'end\n';
start+=`if qa_case_index>=${cases.length}:\n savegame 'qa-summary.sav'\n msg '${marker}'\n exit\nend\n`;
start+="$qa_role=$qa_roles[qa_case_index]\nqa_interaction=qa_ids[qa_case_index]\n$qa_route=$qa_routes[qa_case_index]\n";
for(const r of [...roster,'snk_parked_slave']) {
 for(const v of [r,'$'+r,r+'_rate','interaction_'+r,r+'_already_done_today',r+'_already_done_total',r+'_already_done_recent',r+'_already_sex_today',r+'_already_sex_total'])start+=`killvar '${v}'\n`;
 start+=`${r}_state=0\n${r}_type=0\n`;
}
start+="snk_room_target=0\nmaster_excitement=3\nmaster_excitement_rate=80\nmaster_style=5\nmaster_libido=2\nmaster_penetration=3\nmaster_domination=3\nmaster_str=3\nmaster_str_rate=100\nmaster_energy=5\nmaster_half_action=0\nmaster_ill=0\nmaster_check=1\n";
const values={age:2,energy:3,stamina:3,fat:2,beauty:3,style:3,exotic:3,metabolism:3,intellect:3,ego:2,temper:2,pride:0,moral:5,custom:5,rational:5,instinct:3,obedience:5,mood:5,arousal:3,fear:0,angst:0,spoil:0,virginity:2,sub_vaginal:3,roleplay:3,oral:3,fertility:0,cycle_day:20,ovulation:2,menstruation:0,pregnant:0,pregnant_revealed:0,inseminated:0,jo9_work_ethic:1,passion_comfort:-1,jo9_work_ethic_known:1,passion_comfort_revealed:2,jo9_meiki_initialized:2,jo9_meiki_prev:2,jo9_meiki_checked:1};
for(let i=0;i<roles.length;i++) {
 const r=roles[i];start+=`${r}_state=CONST_INT['slave_exist']\n${r}_type=1435\n${r}['qa_id']=${100+i}\n$${r}_name='QA_${r}'\n$${r}_psy_status='obedient'\n$${r}['wpn']='безоружный'\n$${r}['armor']='без_брони'\n$${r}['cloth']='maid_dress'\n`;
 for(const [k,v] of Object.entries(values))start+=`${r}['${k}']=${v}\n`;
 for(const k of ['beauty','style','exotic'])start+=`${r}_rate['${k}']=100\n`;
}
start+="dynamic $qa_role+\"['ovulation']=1\"\nqa_case_inflight=1\ninteraction=qa_interaction\n"+checkpoint(10);
start+="if $qa_route='bridge':\n gs 'snk_room_bridge','enter',qa_interaction-1026,1\n";
start+=check("snk_room_target=qa_interaction-1026 and slave['qa_id']=101+snk_room_target and snk_parked_slave['qa_id']=100",'bridge_enter');
start+=" gs 'snk_room_bridge','room_sex'\n msg 'FAIL_PPNATIVE_bridge_transfer'\n exit\nend\ngt 'interaction'\n";
const d={...doc,lines:doc.lines.slice()};
function put(n,s){const l=d.locations.find(x=>x.name===n);d.lines[l.body]=core.shift(s.replace(/\n/g,'\r\n'),-5);}
put('Start',start);put('interaction_screen',"qa_renderer_entries+=1\ngt 'Start'");
const modified=doc.locations.filter(l=>doc.lines[l.body]!==d.lines[l.body]).map(l=>l.name);
assert.deepEqual(modified,['Start','interaction_screen']);
const originalBodyHashes=['interaction','interaction_result','snk_room_bridge','#static_base','#dynamic','$slave_traits','$newloc','jo9_traits'].map(n=>{const l=doc.locations.find(x=>x.name===n);assert.equal(d.lines[l.body],doc.lines[l.body]);return {location:n,sha256:core.hash(Buffer.from(core.shift(doc.lines[l.body],5)))}});
fs.mkdirSync(tmp,{recursive:true});fs.writeFileSync(path.join(tmp,'integration.qsp'),core.serialize(d));
fs.writeFileSync(path.join(tmp,'FastQSP.ini'),'[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const manifest={runName,caseCount:cases.length,cases,sourceSha256:doc.hash,currentWorkSha256:current.hash,currentWorkDelta:delta,modifiedLocations:modified,unmodifiedLocationCount:doc.locations.length-modified.length,originalBodyHashes,nightSha256:core.hash(Buffer.from(night)),normalState:values,renderer:'interaction_screen → gt Start',messageHandling:'원문 MSG 내용은 기록하지 않고 완료/실패 식별자와 예상 밖 메시지 발생 여부만 분류'};
fs.writeFileSync(path.join(__dirname,runName+'-plan.json'),JSON.stringify(manifest,null,2)+'\n');
const started=Date.now(),events=[];
let status='TIMEOUT',failureId=null,stderrBytes=0,stdoutBytes=0,partial='';
const proc=cp.spawn(engine,[path.join(tmp,'integration.qsp')],{cwd:tmp,windowsHide:true,stdio:['ignore','pipe','pipe']});
function classify(line) {
 if(/showMessage\(\)/.test(line)) {
  if(line.includes(marker)){status='COMPLETE';events.push({event:'QA_COMPLETE',ms:Date.now()-started});}
  else {const match=line.match(/FAIL_PPNATIVE_[A-Za-z0-9_]+/);failureId=match?match[0]:null;status=match?'QA_ASSERTION_FAILED':'UNEXPECTED_MESSAGE_REDACTED';events.push({event:status,id:failureId,ms:Date.now()-started});}
  proc.kill();
 } else if(/Compiling/.test(line))events.push({event:'COMPILE',ms:Date.now()-started});
}
proc.stdout.on('data',b=>{stdoutBytes+=b.length;});
proc.stderr.on('data',b=>{
 stderrBytes+=b.length;partial+=b.toString('utf8');
 let at;while((at=partial.indexOf('\n'))>=0){classify(partial.slice(0,at));partial=partial.slice(at+1);}
 // 엔진의 modal 메시지는 줄바꿈 없이 flush될 수 있다. 완결된 메시지만 메모리에서 분류한다.
 if(partial.includes('showMessage()') && (partial.includes(marker)||/showMessage\(\).*str:\s*".*"\s*$/s.test(partial))) {
  classify(partial);partial='';
 }
});
const timer=setTimeout(()=>{events.push({event:'TIMEOUT',ms:Date.now()-started});proc.kill();},60000);
// 이 GUI 엔진은 직접 spawn 파이프에 진단 출력을 쓰지 않을 수 있다.
// 새 폴더의 마지막 SAV가 완전히 쓰이고 모든 QA 종료값이 맞을 때만 상태 완료로 판정한다.
const expectedAssertions=28*cases.length+cases.filter(c=>c.route==='bridge').length;
const statePoll=setInterval(()=>{
 const p=path.join(tmp,'qa-summary.sav');
 if(!fs.existsSync(p))return;
 try {
  const s=sc.parse(fs.readFileSync(p)),n=x=>Number(sc.value(s,x)[0]);
  if(n('qa_cases_passed')===cases.length&&n('qa_case_index')===cases.length&&n('qa_case_inflight')===0&&n('qa_renderer_entries')===cases.length&&n('qa_assertions')===expectedAssertions&&n('qa_stage')===40) {
   status='STATE_COMPLETE';events.push({event:'COMPLETE_SAV_VERIFIED',ms:Date.now()-started});clearInterval(statePoll);proc.kill();
  }
 } catch (_) { /* 쓰는 중인 파일은 다음 관찰에서 다시 읽는다. */ }
},250);
proc.on('error',()=>{status='ENGINE_START_FAILED';});
proc.on('close',()=>{
 clearTimeout(timer);clearInterval(statePoll);if(partial)classify(partial);partial='';
 const summary=path.join(tmp,'qa-summary.sav'),progress=path.join(tmp,'qa-progress.sav');
 let save=null;
 for(const [p,suffix] of [[progress,'progress'],[summary,'summary']])if(fs.existsSync(p)){const b=fs.readFileSync(p);save=sc.parse(b);assert(sc.serialize(save).equals(b));fs.writeFileSync(path.join(__dirname,runName+'-'+suffix+'.sav'),b);}
 const num=(n,k)=>save?Number(sc.value(save,n,k)[0]):null;
 const report={...manifest,status,pass:['COMPLETE','STATE_COMPLETE'].includes(status)&&fs.existsSync(summary)&&num('qa_cases_passed')===cases.length,failureId,elapsedMs:Date.now()-started,events,stderrBytes,stdoutBytes,messageObservation:stderrBytes?'식별자만 분류':'파이프 출력 없음; MSG 발생0으로 단정하지 않음',casesPassed:num('qa_cases_passed'),assertions:num('qa_assertions'),assertionsExpected:expectedAssertions,lastStage:num('qa_stage'),lastCaseIndex:num('qa_case_index'),rendererEntries:num('qa_renderer_entries'),outcomes:roles.flatMap(r=>['direct','bridge'].map(route=>({role:r,route,pregnant:num('qa_pregnant',r+':'+route),notPregnant:num('qa_not_pregnant',r+':'+route)}))),protected:before.map(x=>({...x,unchanged:core.hash(fs.readFileSync(x.path))===x.sha256})),userSaveLoaded:false,userSaveWritten:false};
 assert(report.protected.every(x=>x.unchanged));
 fs.writeFileSync(path.join(__dirname,runName+'-results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({runName,status:report.status,pass:report.pass,casesPassed:report.casesPassed,assertions:report.assertions,lastStage:report.lastStage,rendererEntries:report.rendererEntries,failureId:report.failureId,protectedUnchanged:true}));
 process.exitCode=report.pass?0:1;
});
