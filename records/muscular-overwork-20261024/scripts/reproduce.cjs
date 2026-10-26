'use strict';
const fs=require('node:fs'),cp=require('node:child_process'),z=require('node:zlib'),a=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/jo9-muscular-overwork-20261024',rec=repo+'/records/muscular-overwork-20261024';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const beforeHash='30f5f2e9458a7c10c4852270ee42203d0501ed705845509512043969836a04ae',roles=['slave','assistant','room1','room2','room3','room4','prisoner','cow','farmhand'];
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'')),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n'),cr=s=>s.replace(/\r?\n/g,'\r\n');
const body=(d,n)=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),set=(d,n,s)=>d.lines[d.locations.find(x=>x.name===n).body]=c.shift(cr(s),-5);
const phase=process.argv[2],routes=[...['slave','assistant','prisoner','cow'].map(r=>({role:r,code:`dynamic $${r}_energy_drop`,name:'named_'+r})),...roles.map(r=>({role:r,code:`dynamic $replace($dynamic_energy_drop,'dynslave','${r}')`,name:'generic_'+r}))];
function protect(){return [game+'/jack.qsp',game+'/css/base.css',game+'/FastQSP.ini',game+'/../FastQSP.ini','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/css/base.css',...fs.readdirSync(game+'/save').filter(n=>/\.sav$/i.test(n)).map(n=>game+'/save/'+n)].map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))}));}
function run(d,dir,name,code){fs.mkdirSync(dir,{recursive:true});set(d,'Start',code);const raw=c.serialize(d);qa.inspectWorld(raw);fs.writeFileSync(dir+'/'+name+'.qsp',raw);write(dir+'/plan.json',[{name,file:dir+'/'+name+'.qsp',marker:'JO9_QA_MOW_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:'Actual production energy-drop functions in installed FastQSP'}]);
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/qa/run-client-smoke.ps1','-Engine',game+'/engine/jack.exe','-Plan',dir+'/plan.json','-TimeoutSeconds','45'],{encoding:'utf8',windowsHide:true,timeout:60000});
 const results=read(dir+'/client-results.json'),log=new TextDecoder('euc-kr').decode(fs.readFileSync(dir+'/'+name+'-stderr.log'));return {exit:r.status,results,failure:(log.match(/FAIL_MOW_[^"\r\n]+/)||[])[0],log:dir+'/'+name+'-stderr.log'};
}
function definition(d,name,next){const t=body(d,'#dynamic'),st=t.indexOf('$'+name+' = {'),en=t.indexOf('$'+next+' = {',st+1);a(st>=0&&en>st);return t.slice(st,en);}
if(phase==='inspect'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp'));for(const n of ['$ongsave','get_special_assistant_quest']){if(!d.locations.some(x=>x.name===n))continue;const ls=body(d,n).split('\r\n');console.log(n+'\n'+ls.filter(x=>/gt |gs |msg |assistant_type|hero_choice/.test(x)&&x.length<300).join('\n'));}const dyn=body(d,'#dynamic');const swap=dyn.indexOf('$swap_slave_instances = {');console.log(dyn.slice(swap,swap+3500));
}else if(phase==='prepare'){
 a(!fs.existsSync(root));a(!fs.existsSync(rec));fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.mkdirSync(rec+'/scripts',{recursive:true});fs.mkdirSync(rec+'/evidence');const raw=fs.readFileSync(game+'/jack.qsp');a.equal(c.hash(raw),beforeHash);qa.inspectWorld(raw);a.deepEqual(c.serialize(c.parse(raw)),raw);fs.writeFileSync(root+'/inputs/before.qsp',raw);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(raw,{level:9}));a.deepEqual(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz')),raw);write(rec+'/inputs.json',protect());fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');
 write(rec+'/approved-scope.json',{staminaGrade:5,reductionPercent:50,penalty:'Negative raw AP causes stamina-rate loss in five energy-drop templates',carryKey:'jo9_overwork_half',carryUnits:'half stamina point debt,0 or1',newLocations:0,carryRetainedAcross:['normal energy','rest','rank changes','role swaps','days','saves'],freshConstructorsReset:true,excluded:['master strength','exercise soreness/exertion','wounds/battle HP','disease/nutrition','AP cost and exhaustion conditions'],next:'WAIT_REPORT_THEN_USER_APPROVAL'});
 fs.writeFileSync(repo+'/docs/superpowers/plans/2026-10-24-muscular-overwork.md',`# 근육질 과로50% 완화 구현 계획\r\n\r\n**Goal:** 근육질의 음수AP 과로 체력손실을 누적기준50%로 줄인다.\r\n**Architecture:** 기존5개 동적 소비함수에 지역계산,인물배열에0/1반점부채키1개.새함수/로케이션없음.옛5캐시를로드시점에정의검사로갱신하고신규생성때만잔여초기화.\r\n**Spec:** 사용자2026-10-24진행승인,approved-scope.json.\r\n**Review Focus:**정수홀수누적/동일인물named-generic공유/역할교환/정상회복과등급변경꼼수방지/구캐시첫행동/신규인물부채상속금지/반칸·치트조건보존.\r\n\r\n- [ ] baseline실제엔진RED.\r\n- [ ] 최소패치·경계GREEN.\r\n- [ ] 저장/교환/신규생성/옛캐시보강검사.\r\n- [ ] 문법·구조/줄/주석경계·정확재생/재적용·공식9경로.\r\n- [ ] 독립검토후최신WORK해시재확인및적용,기존세이브보존.\r\n- [ ] 설명서·작업묶음·진단정리,결과보고후다음단계승인대기.커밋/푸시없음.\r\n`);console.log(JSON.stringify({prepared:true,before:beforeHash,protected:read(rec+'/inputs.json').length}));
}else if(phase==='build'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp')),edits=[];
 function edit(location,old,newText,id){old=cr(old);newText=cr(newText);const t=body(d,location);a.equal(t.split(old).length-1,1,id);set(d,location,t.replace(old,newText));edits.push({location,field:'body',old,new:newText,count:1,patchId:id});}
 for(const role of ['slave','assistant','prisoner','cow','dynslave']){
  const tag=role==='dynslave'?'DYNAMIC':role.toUpperCase(),id='MUSCULAR_OVERWORK_50_'+tag;
  edit('#dynamic',`if ${role}['energy'] < 0: ${role}_rate['stamina'] += ${role}['energy']`,`if ${role}['energy'] < 0:
 ! JO9 MOD START ${id} | 2026-10-24_muscular_overwork
 if ${role}['stamina'] = 5:
  local jo9_overwork_total = -${role}['energy'] + max(0, min(1, ${role}['jo9_overwork_half']))
  ${role}_rate['stamina'] -= jo9_overwork_total / 2
  ${role}['jo9_overwork_half'] = jo9_overwork_total mod 2
 else
  ${role}_rate['stamina'] += ${role}['energy']
 end
 ! JO9 MOD END ${id}
end`,id);
 }
 for(const [location,role,anchor]of [['get_demo_slave','slave','! JO9 MOD END AP_CURVE_INIT_GET_DEMO_SLAVE'],['get_special_slave','slave','! JO9 MOD END AP_CURVE_INIT_GET_SPECIAL_SLAVE'],['get_special_assistant_quest','assistant','assistant_state = 1\nassistant["bcheck"] = 0']]){
  const id='MUSCULAR_OVERWORK_INIT_'+location.toUpperCase();edit(location,anchor,`${anchor}
! JO9 MOD START ${id} | 2026-10-24_muscular_overwork
${role}['jo9_overwork_half'] = 0
! JO9 MOD END ${id}`,id);
 }
 const note='근육질은 행동력이 음수일 때 과로로 인한 체력 손실이 50% 줄어듭니다.';
 edit('#help_msg','! JO9 MOD END J9M1755',`! JO9 MOD END J9M1755
! JO9 MOD START MUSCULAR_OVERWORK_HELP | 2026-10-24_muscular_overwork
$здоровье_совет += '<br>${note}'
! JO9 MOD END MUSCULAR_OVERWORK_HELP`,'MUSCULAR_OVERWORK_HELP');
 const markerChecks=['slave','assistant','prisoner','cow','dynamic'].map(r=>`instr($${r}_energy_drop, 'MUSCULAR_OVERWORK_50_${r==='dynamic'?'DYNAMIC':r.toUpperCase()}') = 0`).join(' or ');
 const load=`! JO9 MOD START MUSCULAR_OVERWORK_LOAD_CACHE | 2026-10-24_muscular_overwork
if ${markerChecks}: gs '#dynamic'
if instr($здоровье_совет, '${note}') = 0: gs '#help_msg'
! JO9 MOD END MUSCULAR_OVERWORK_LOAD_CACHE
`;
 const anchor='! JO9 MOD START CHAOTIC_ESSENCE_LOAD_CACHE | 2026-10-24_chaotic_essence';edit('$ongload',anchor,load+anchor,'MUSCULAR_OVERWORK_LOAD_CACHE');
 const raw=c.serialize(d);qa.inspectWorld(raw);a.equal(c.parse(raw).locations.length,267);
 const p={id:'2026-10-24_muscular_overwork',description:'근육질 음수AP 과로 체력손실50% 완화. 인물별 반점부채 누적, 로드 캐시 보완, 신규 직접생성 초기화, 도움말. AP소비/근육통/회복/일반등급 불변.',before_sha256:beforeHash,after_sha256:c.hash(raw),edits};
 fs.writeFileSync(root+'/inputs/candidate.qsp',raw);write(root+'/patches/2026-10-24_muscular_overwork.json',p);write(rec+'/patch.json',p);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({candidate:p.after_sha256,edits:edits.length,locations:[...new Set(edits.map(x=>x.location))],newLocations:0,newPersistentKeys:1}));
}else if(phase==='restore-fixtures'){
 a(!fs.existsSync(root));const p=read(rec+'/patch.json'),raw=z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'));a.equal(c.hash(raw),p.before_sha256);fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/patches');fs.writeFileSync(root+'/inputs/before.qsp',raw);const d=c.parse(raw);for(const e of p.edits){const t=body(d,e.location);a.equal(t.split(e.old).length-1,e.count);set(d,e.location,t.replace(e.old,e.new));}const candidate=c.serialize(d);a.equal(c.hash(candidate),p.after_sha256);fs.writeFileSync(root+'/inputs/candidate.qsp',candidate);write(root+'/patches/2026-10-24_muscular_overwork.json',p);console.log('Restored isolated inputs; WORK unchanged.');
}else if(phase==='install'){
 const p=read(rec+'/patch.json');for(const n of ['green','extended'])a.equal(read(rec+'/'+n+'-results.json').status,'PASS');const release='G:/Codex/tmp/jo9-muscular-overwork-release-20261024',runs=fs.readdirSync(release).filter(n=>n.startsWith('run-'));a.equal(runs.length,1);const rd=release+'/'+runs[0],gate=read(rd+'/report.json');a.equal(gate.verdict,'PASS');a(gate.client.probes.length===9&&gate.client.probes.every(x=>x.pass));
 for(const x of read(rec+'/inputs.json'))a.equal(c.hash(fs.readFileSync(x.path)),x.sha256,'Preinstall protected '+x.path);const oldNames=new Set(fs.readdirSync(game));
 const r=cp.spawnSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',repo+'/tools/apply_mods.ps1','-Qsp',game+'/jack.qsp','-ModsDir',root+'/patches'],{encoding:'utf8',windowsHide:true,timeout:90000});fs.writeFileSync(rec+'/install.log',r.stdout+'\n'+r.stderr);a.equal(r.status,0);a.deepEqual(fs.readFileSync(game+'/jack.qsp'),fs.readFileSync(root+'/inputs/candidate.qsp'));a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);
 fs.copyFileSync(rec+'/patch.json',repo+'/mods/2026-10-24_muscular_overwork.json');fs.copyFileSync(rd+'/report.json',rec+'/release-validation.json');fs.copyFileSync(rd+'/report.md',rec+'/release-validation.md');write(rec+'/install-backups.json',fs.readdirSync(game).filter(n=>!oldNames.has(n)&&n.startsWith('jack.qsp')).map(n=>game+'/'+n));
 const xs=read(rec+'/inputs.json').map(x=>({...x,expected:x.path===game+'/jack.qsp'?p.after_sha256:x.sha256,after:c.hash(fs.readFileSync(x.path))}));for(const x of xs)a.equal(x.after,x.expected);write(rec+'/preservation.json',{status:'PASS',files:xs.length,unchanged:xs.length-1,userSavesUnchanged:76,onlyChanged:game+'/jack.qsp',results:xs});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({installed:true,sha256:p.after_sha256,preservedOtherFiles:81,userSavesUnchanged:76}));
}else if(phase==='verify'){
 const p=read(rec+'/patch.json'),raw=fs.readFileSync(game+'/jack.qsp');a.equal(c.hash(raw),p.after_sha256);qa.inspectWorld(raw);a.deepEqual(c.serialize(c.parse(raw)),raw);a.equal(c.hash(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'))),p.before_sha256);for(const x of read(rec+'/inputs.json'))a.equal(c.hash(fs.readFileSync(x.path)),x.path===game+'/jack.qsp'?p.after_sha256:x.sha256);a(!fs.existsSync(root));a(!fs.existsSync('G:/Codex/tmp/jo9-muscular-overwork-release-20261024'));a.equal(read(rec+'/cleanup.json').status,'PASS');console.log(JSON.stringify({final:'PASS',work:p.after_sha256,protectedFiles:82,oldUserSavesUnchanged:76,tempRootsAbsent:true,rollbackExact:true}));
}else if(phase==='archive-cleanup'){
 a.equal(c.hash(z.gunzipSync(fs.readFileSync(rec+'/before.qsp.gz'))),beforeHash);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');fs.writeFileSync(rec+'/scripts/cleanup.ps1','\uFEFF'+fs.readFileSync('.overwork-cleanup.ps1','utf8').replace(/^\uFEFF/,''));console.log('Reproduction and scoped cleanup script archived; recovery gzip verified.');
}else if(phase==='document'){
 const p=read(rec+'/patch.json'),g=read(rec+'/green-results.json'),e=read(rec+'/extended-results.json');a.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),p.after_sha256);write(rec+'/independent-review.json',{status:'PASS',reviewer:'/root/overwork_rounding_review',mode:'Read-only static review; no separate native run',verified:{exactReplay:true,locations:267,changedBodies:6,edits:10,existingHalfEasyCheatFloorCaloriesPreserved:true,grade5Only:true,directFreshConstructorsReset:3,clearOrGenerateStockAlreadyCovers:3,onloadChecksFiveCaches:true,helpReloadConsistent:true},defects:[]});
 const approved=read(rec+'/approved-scope.json');approved.freshConstructors={changed:['get_demo_slave','get_special_slave','get_special_assistant_quest'],coveredByWholeArrayClear:['generate_stock','generate_clone','get_special_assistant']};write(rec+'/approved-scope.json',approved);
 const manual=`# 근육질 과로 페널티 50% 완화

패치 2026-10-24_muscular_overwork. 사용자 진행 승인에 따라 WORK에만 적용했다. 다음 미구현 항목은 결과 보고 후 승인을 받는다.

## 효과와 범위

체력 단계5인 근육질은 **행동력이 음수일 때 받는 체력 경험치 손실**이 누적 기준50%로 줄어든다. 기본 행동력5는 직전 패치 값을 유지한다. 게임 도움말의 붉은별 ‘과로’가 대상이며, 운동 한계에 따른 보라별 ‘근육통’은 별개다.

- 일반 손실1이 두 번이면 근육질은0,1로 합계1을 받는다. 손실5 반복은2,3,2,3으로 누적된다. 체력 단계0~4는 기존 손실을 그대로 받는다.
- 반점 잔여분은 인물별 숫자키 jo9_overwork_half에0/1로 보관한다. 이는 아직 정산하지 않은 **손실0.5점**이며 행동력 반칸을 주는 값이 아니다. 기존 세이브의 없는 키는0이다.
- 정상 행동력 회복·하루 전환·체력 등급 변경·노예/조수/개인실 교환·저장 후에도 잔여를 유지해 소수점 손실이 계속 사라지는 것을 막는다. 단계5 아래에서는 잔여를 쓰지 않고 온전한 기존 손실을 받으며, 다시5가 되면 이어서 정산한다.
- 신규 직접 생성만 잔여를0으로 만든다. 보유 인물의 역할 변경·해동·복원은 초기화하지 않는다.

행동력 소비, 쉬운 행동의 반칸, 치트 조건, 최저 행동력-5, 열량 소비는 바꾸지 않았다. 기존에는 치트가 행동력 소비만 막고 이미 음수인 상태의 손실은 막지 않았으며 그 구조도 유지한다. 운동 과잉·부상/피해·영양/질병·주인공 힘 손실·휴식 성장·일일 회복식·경제·지성 할인은 변경하지 않았다.

## 코드와 의존성

| 블록/위치 | 입력과 결과 | 호출·의존성 및 분리 영향 |
|---|---|---|
| MUSCULAR_OVERWORK_50_* / #dynamic | stamina, 음수energy, 반점 잔여 → stamina_rate 차감, 새0/1 잔여 | slave/assistant/prisoner/cow의 이름별4함수와 dynslave 공통1함수. 기존 행동/교육/이동/업무 호출을 유지. 지역변수 jo9_overwork_total 사용, 별도함수/로케이션 없음. 양쪽 중 일부만 제거하면 같은 인물도 호출 경로별 효과가 달라짐 |
| MUSCULAR_OVERWORK_INIT_* | 새 인물 생성 → 잔여0 | get_demo_slave/get_special_slave/get_special_assistant_quest의 전체 배열을 비우지 않는3생성자. generate_stock은 전체 배열 clear, generate_clone/get_special_assistant는 이를 호출하므로 수정 불필요. 초기화만 빼면 직접 생성에서 이전 인물의 잔여를 상속할 수 있음 |
| MUSCULAR_OVERWORK_LOAD_CACHE / $ongload |5개 저장 함수 표식과 도움말 확인 → 필요한 정의만 재적재 | 어느 하나라도 표식이 없으면 #dynamic, 도움말 문장이 없으면 #help_msg 호출. 첫 행동 전에 보완. #dynamic은 함수 정의와 음성용 고정ID 목록을 재작성하고 인물/AP/경험치는 초기화하지 않음. 이를 빼면 저장된 구형 함수가 다음 기존 캐시 갱신까지 남을 수 있음 |
| MUSCULAR_OVERWORK_HELP / #help_msg | 기존 체력 도움말 → 근육질50% 설명 추가 | 매 재정의에서 원래 도움말을 만든 후 한 번 연결. 반복 호출에 중복되지 않음 |

6개 본문·10개 편집,267로케이션 유지. 새 함수/로케이션/이관 버전 없이 인물별 숫자키1개만 추가했다. 되돌리면 기존 손실 규칙으로 돌아가고 남은 키는 사용하지 않으므로 임의로 세이브를 편집할 필요는 없다. 전체 수정은 patch.json의 안정된 JO9 MOD 식별자로 추적한다.

## 검증

- 수정 전 실제 엔진에서 근육질의 첫 손실1이 그대로-1인 것을 재현했다(RED).
- 실제 엔진 집중 ${g.cases}상황·${g.assertions}조건 PASS: 이름별4+공통9역할,6등급,음수1~5,잔여0/1,반칸/쉬운행동/치트 조합,잘못된 잔여값,하한 반복,하루 소비 누적.
- 실제 엔진 보강 ${e.cases}상황·${e.assertions}조건 PASS: 일반/근육질 전환,실제 일일 회복/상한,반복 정의 갱신,이름별/공통 혼용,구형5캐시 각각 누락→실제 $ongload→첫 행동,도움말 중복 방지,5신규 생성자,조수/개인실 전체 배열 교환,9역할의 실제 SAVEGAME 잔여 기록. 저장 파일은 save-codec로 키를 확인하고 바이트 왕복 보존도 확인했다.
- 구조·바이트 왕복·줄/주석 경계·인물 JSON등록·정확 패치 재생·재적용 및 공식 실제 엔진9경로 PASS. 독립 읽기 검토에서 결함 없음. 적용된 WORK가 통과 후보와 바이트 일치한다.
- 기존 세이브76개·Full·CSS·설정 등81개 보호 파일은 바뀌지 않았다. 진단 저장은 격리 폴더에만 만들고 검사 후 정리했다.

진단은 Start만 검사 진입점으로 바꾸고 실제 함수/생성자/로드 처리기를 호출했다. 일일 회복 정의는 원문 그대로 추출해 실행했다. **기존 세이브를 UI에서 고르는 실제 로드/CRC, 모든 동적 분기와 전수 화면을 증명한 검사는 아니다.** 구 캐시의 실제 $ongload 실행과 native 저장 직렬화 검사는 이 한계와 구분한다. 공식9경로의 일반 한계도 유지한다.

## 재현·기록·현재 상태

- before.qsp.gz: 직전 WORK ${beforeHash}의 바이트 일치 복구본. patch.json 및 mods에 해시 포함.
- scripts/reproduce.cjs restore-fixtures로 격리 입력을 복원하고 red/green/extended로 재현할 수 있다. 이 단계들은 WORK를 수정하지 않는다. 검사기는 설치 엔진·저장소 도구에 의존한다.
- 핵심 로그·결과·보존 검증·정리 명세를 이 폴더에 남겼다. 생성 가능한 진단 QSP·복제 JSON·시험 .sav는 정리했다.
- 적용 후 WORK: ${p.after_sha256}.
- Full/ZIP 동기화·커밋·푸시는 하지 않았다. 다음 미구현 항목은 사용자 승인 대기다.
`;
 fs.writeFileSync(rec+'/MANUAL_KO.md',manual.replace(/\n/g,'\r\n'));
 const result={status:'PASS_APPLIED_WORK',patch:p.id,work:p.after_sha256,before:beforeHash,changedLocations:6,edits:10,newLocations:0,newActorKeys:1,nativeFocusedCases:g.cases+e.cases,nativeFocusedAssertions:g.assertions+e.assertions,nativeReleaseProbes:9,nativeSavedRoles:9,oldNativeUserSavesLoadedViaUI:false,preservedUserSaves:76,fullSynced:false,packaged:false,committed:false,pushed:false,next:'WAIT_USER_APPROVAL'};write(rec+'/FINAL_RESULT.json',result);
 const finding=read(repo+'/records/post-patch-audit-20261024/findings.json'),u=finding.unimplemented.find(x=>x.id==='U01');u.status='APPLIED_BASE_AP_CURVE_AND_MUSCULAR_OVERWORK_50';u.evidence='../muscular-overwork-20261024/FINAL_RESULT.json';finding.followup={patch:p.id,work:p.after_sha256,next:'WAITING_USER_APPROVAL'};write(repo+'/records/post-patch-audit-20261024/findings.json',finding);
 function append(file,marker,text){const s=fs.readFileSync(file,'utf8');a(!s.includes(marker),'Already documented');fs.appendFileSync(file,cr('\n\n'+text+'\n'));}
 append(repo+'/docs/SECOND_PATCH_WORK_BUNDLE_20261021.md','MUSCULAR_OVERWORK_APPLIED_20261024',`## WORK 적용 — 근육질 과로50% 완화 (MUSCULAR_OVERWORK_APPLIED_20261024)\n\n- 체력5만 음수AP 과로 체력손실을 누적50%로 완화. 인물별 반점 잔여 보존, 구형5함수 로드갱신, 신규 직접생성3곳 초기화, 도움말 추가. 운동 근육통·행동력소비·주인공·다른등급 손실 불변.\n- 실제엔진 ${result.nativeFocusedCases}상황 ${result.nativeFocusedAssertions}조건·공식9경로·문법/줄/주석경계·정확재생/재적용 PASS, 독립검토. native저장9역할/역할교환/일일회복/구캐시첫행동 확인, UI기존세이브로드 별도. 기존76세이브·Full/CSS/설정 보존.\n- U01 기본AP곡선과 근육질완화 완료. U02 지성할인 수치는 미확정, 이번에 진행 안 함. 다음 구현 사용자 승인 대기. 커밋·푸시 없음. [설명·한계](../records/muscular-overwork-20261024/MANUAL_KO.md), [결과](../records/muscular-overwork-20261024/FINAL_RESULT.json).`);
 append(repo+'/docs/POST_PATCH_STATUS_AUDIT_20261024.md','MUSCULAR_OVERWORK_APPLIED_20261024',`## 감사 이후 순차 구현 — MUSCULAR_OVERWORK_APPLIED_20261024\n\n근육질 과로손실50% 완화를 WORK ${p.after_sha256.slice(0,12)}…에 적용했다. 이로써 U01의 기본AP0/2/3/4/5/5와 근육질 추가효과가 완료됐다. 실제엔진 ${result.nativeFocusedCases}상황 ${result.nativeFocusedAssertions}조건·공식9경로 PASS, 기존76세이브/Full 보존. 일반 운동 근육통은 기존 별도 체계이며 이번 반감 대상이 아니다. U02~U09와F02~F04는 이번에 진행하지 않았다. [상세·한계](../records/muscular-overwork-20261024/MANUAL_KO.md). 다음 단계 사용자 승인 대기.`);
 const plan=repo+'/docs/superpowers/plans/2026-10-24-muscular-overwork.md';fs.writeFileSync(plan,fs.readFileSync(plan,'utf8').replaceAll('- [ ]','- [x]')+'\r\n최종 결과: ../../../records/muscular-overwork-20261024/FINAL_RESULT.json. 다음 단계 승인 대기.\r\n');
 const release='G:/Codex/tmp/jo9-muscular-overwork-release-20261024';let copied=0;function archive(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const file=dir+'/'+ent.name;if(ent.isDirectory())archive(file);else if(/-stderr\.log$|client-results\.json$/.test(ent.name)){const to=rec+'/evidence/release-'+ent.name;a(!fs.existsSync(to));fs.copyFileSync(file,to);copied++;}}}archive(release);a.equal(copied,10);fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify(result));
}else if(phase==='extended'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp')),old=c.parse(fs.readFileSync(root+'/inputs/before.qsp'));let code="usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\nCONST_INT['slave_exist']=1\ncheat_inf_en=0\nsnk_room_target=0\njo9_lq['active']=0\n",cases=0,checks=0;
 const check=(condition,label)=>{checks++;code+=`if (${condition}) = 0: msg 'FAIL_MOW_${label}' & exit\n`;};
 const reset=(role,carry)=>{code+=`${role}_state=1\n${role}['stamina']=5\n${role}['energy']=0\n${role}['half_action']=0\n${role}['jo9_overwork_half']=${carry}\n${role}['calories']=100\n${role}_rate['stamina']=100\neasy_for_${role}=0\n`;};
 const nd=body(d,'next_day'),ndStart=nd.indexOf('$next_day_energy_refresh = {'),ndEnd=nd.indexOf("dynamic $do_for_each_slave_in_list, '$next_day_energy_refresh'",ndStart);a(ndStart>0&&ndEnd>ndStart);code+=nd.slice(ndStart,ndEnd)+'\nmaster_medic=0\n';
 for(const r of roles){cases++;reset(r,0);code+=`dynamic $replace($dynamic_energy_drop,'dynslave','${r}')\n`;check(`${r}_rate['stamina'] = 100 and ${r}['jo9_overwork_half'] = 1`,'carry_first_'+r);
  code+=`${r}['energy']=0\n${r}['wounds']=0\n${r}['half_action']=0\ndynamic $replace($next_day_energy_refresh,'dynslave','${r}')\ngs 'refresh_database'\ndynamic $replace($update_slave_energy_stars,'dynslave','${r}')\n`;check(`${r}['jo9_overwork_half'] = 1 and ${r}['energy'] = 5`,'normal_recovery_'+r);
  code+=`${r}['stamina']=4\n${r}['energy']=0\ndynamic $replace($dynamic_energy_drop,'dynslave','${r}')\n`;check(`${r}_rate['stamina'] = 99 and ${r}['jo9_overwork_half'] = 1`,'rank_lower_'+r);
  code+=`${r}['stamina']=5\n${r}['energy']=0\ndynamic $replace($dynamic_energy_drop,'dynslave','${r}')\n`;check(`${r}_rate['stamina'] = 98 and ${r}['jo9_overwork_half'] = 0`,'rank_restore_'+r);
 }
 for(const r of ['slave','assistant','prisoner','cow']){cases++;reset(r,0);code+=`dynamic $${r}_energy_drop\n${r}['energy']=0\ndynamic $replace($dynamic_energy_drop,'dynslave','${r}')\n`;check(`${r}_rate['stamina'] = 99 and ${r}['jo9_overwork_half'] = 0`,'named_generic_'+r);}
 const defs=[['slave_energy_drop','assistant_energy_drop'],['assistant_energy_drop','master_energy_drop'],['prisoner_energy_drop','cow_energy_drop'],['cow_energy_drop','dynamic_energy_drop'],['dynamic_energy_drop','transport_energy_drop']];
 for(const [name,next]of defs){cases++;code+=definition(old,name,next)+'\n';reset('slave',1);reset('assistant',0);code+="slave['id']=2571\nassistant['id']=2606\nslave['family_index']=2\nassistant['family_index']=2\ngs '$ongload'\n";
  for(const [nm]of defs)check(`instr($${nm}, 'MUSCULAR_OVERWORK_50_') > 0`,'legacy_'+name+'_'+nm);
  check("slave['energy'] = 0 and slave['jo9_overwork_half'] = 1 and slave_rate['stamina'] = 100 and assistant['jo9_overwork_half'] = 0 and assistant_rate['stamina'] = 100",'load_preserves_'+name);
  code+='dynamic $slave_energy_drop\n';check("slave_rate['stamina'] = 99 and slave['jo9_overwork_half'] = 0",'first_action_'+name);
 }
 cases++;code+="gs '#help_msg'\ngs '#help_msg'\n";check("(len($здоровье_совет)-len(replace($здоровье_совет,'근육질은 행동력이 음수일 때','')))/len('근육질은 행동력이 음수일 때') = 1",'help_no_duplicate');
 for(const ctor of ['generate_stock','generate_clone','get_demo_slave','get_special_slave']){cases++;const r=ctor.startsWith('generate_')?'stock':'slave';code+=`${r}['jo9_overwork_half']=1\nstock_type=2571\nslave_type=2571\nspecial_stock=2571\nseed_age[2571]=2\nseed_stamina[2571]=4\nseed_metabolism[2571]=1\nseed_beauty[2571]=3\ngs '${ctor}'\n`;check(`${r}['jo9_overwork_half'] = 0`,'fresh_'+ctor);}
 cases++;code+="assistant_type=2606\nhero_choice=1\ncheat_i=0\npet_tentacle=0\nseed_age[2606]=2\nseed_stamina[2606]=4\n$seed_name[2606]='QA'\nassistant['jo9_overwork_half']=1\ngs 'get_special_assistant_quest'\n";check("assistant['jo9_overwork_half'] = 0",'fresh_quest_assistant');
 for(const dest of ['assistant','room1']){cases++;reset('slave',1);reset(dest,0);code+=`slave['id']=910001\n${dest}['id']=910002\ndynamic $swap_slave_instances, 'slave', '${dest}'\n`;check(`slave['id'] = 910002 and slave['jo9_overwork_half'] = 0 and ${dest}['id'] = 910001 and ${dest}['jo9_overwork_half'] = 1`,'swap_'+dest);code+=`dynamic $replace($dynamic_energy_drop,'dynslave','${dest}')\n`;check(`${dest}_rate['stamina'] = 99 and ${dest}['jo9_overwork_half'] = 0`,'swap_consume_'+dest);}
 for(const r of roles)reset(r,1);cases++;code+="savegame 'carry.sav'\nmsg 'JO9_QA_MOW_extended_COMPLETE'\n";
 const result=run(d,root+'/extended','extended',code);fs.copyFileSync(result.log,rec+'/evidence/extended.log');a(result.results.every(x=>x.pass));const sc=require(repo+'/tools/qa/save-codec.cjs'),saved=fs.readFileSync(root+'/extended/carry.sav'),ss=sc.parse(saved);a.deepEqual(sc.serialize(ss),saved);for(const r of roles){a.equal(sc.value(ss,r,'jo9_overwork_half')[0],'1');checks++;}write(rec+'/extended-results.json',{status:'PASS',cases,assertions:checks,nativeSavedRoles:roles.length,save:{sha256:c.hash(saved),roundtripExact:true,existingUserSavesTouched:false,uiOpenGameTested:false},instrumentation:'Start only; exact production constructors, legacy single-cache replacement followed by actual $ongload, daily recovery, refresh, AP cap, named/generic helpers, whole-array swaps and native SAVEGAME. Saved carry decoded and byte-roundtripped; UI OPENGAME not tested. No state primer.',...result});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({cases,assertions:checks,...result}));
}else if(phase==='green'){
 const d=c.parse(fs.readFileSync(root+'/inputs/candidate.qsp'));let code="usehtml=1\n$onnewloc=''\n$counter=''\ngs 'refresh_database'\nCONST_INT['slave_exist']=1\ncheat_inf_en=0\n",cases=0,checks=0;
 const check=(condition,label)=>{checks++;code+=`if (${condition}) = 0: msg 'FAIL_MOW_${label}' & exit\n`;};
 function reset(role,grade,energy,half,carry){cases++;code+=`killvar '${role}'\nkillvar '${role}_rate'\n${role}_state=1\n${role}['stamina']=${grade}\n${role}['energy']=${energy}\n${role}['half_action']=${half}\n${role}['jo9_overwork_half']=${carry}\n${role}['calories']=100\n${role}_rate['stamina']=100\neasy_for_${role}=0\ncheat_inf_en=0\n`;}
 const damage=[[0,1,1,2,2],[1,1,2,2,3]],carryAfter=[[1,0,1,0,1],[0,1,0,1,0]];
 for(const route of routes)for(let grade=0;grade<6;grade++)for(let loss=1;loss<=5;loss++)for(let carry=0;carry<2;carry++){
  const r=route.role,label=route.name+'_'+grade+'_'+loss+'_'+carry;reset(r,grade,1-loss,0,carry);code+=route.code+'\n';
  check(`${r}['energy'] = ${-loss} and ${r}['half_action'] = 0`,label+'_ap');check(`${r}_rate['stamina'] = ${100-(grade===5?damage[carry][loss-1]:loss)}`,label+'_loss');check(`${r}['jo9_overwork_half'] = ${grade===5?carryAfter[carry][loss-1]:carry}`,label+'_carry');check(`${r}['calories'] = 99 and ${r}['stamina'] = ${grade}`,label+'_other');
 }
 for(const route of routes)for(const grade of [4,5])for(const en of [-5,-1,0,2])for(const half of [-2,-1,0,1])for(const easy of [0,1])for(const cheat of [0,1]){
  const r=route.role,label='variant_'+route.name+'_'+grade+'_'+en+'_'+half+'_'+easy+'_'+cheat;reset(r,grade,en,half,1);code+=`easy_for_${r}=${easy}\ncheat_inf_en=${cheat}\n`+route.code+'\n';
  let h=half,e=en,ez=easy;if(!cheat){h+=2;if(ez){h--;ez=0;}if(h>1){e--;h-=2;}e=Math.max(e,-5);}
  const loss=e<0?-e:0,dm=grade===5?Math.floor((loss+1)/2):loss,ca=grade===5&&loss?(loss+1)%2:1;
  check(`${r}['energy'] = ${e} and ${r}['half_action'] = ${h}`,label+'_ap');check(`${r}_rate['stamina'] = ${100-dm} and ${r}['jo9_overwork_half'] = ${ca}`,label+'_loss');check(`easy_for_${r} = ${ez} and ${r}['calories'] = 99`,label+'_easy_calories');
 }
 for(const carry of [-99,99])for(const loss of [1,5]){reset('slave',5,1-loss,0,carry);code+='dynamic $slave_energy_drop\n';const clamped=carry<0?0:1;check(`slave_rate['stamina'] = ${100-Math.floor((loss+clamped)/2)} and slave['jo9_overwork_half'] = ${(loss+clamped)%2}`,'invalid_'+carry+'_'+loss);}
 reset('slave',5,-5,0,0);for(let i=1;i<=6;i++){code+='dynamic $slave_energy_drop\n';check(`slave['energy'] = -5 and slave_rate['stamina'] = ${100-Math.floor(i*5/2)} and slave['jo9_overwork_half'] = ${i%2}`,'repeat_floor_'+i);}
 reset('slave',5,5,0,0);for(let i=1;i<=10;i++){code+='dynamic $slave_energy_drop\n';const total=i<=5?0:(i-5)*(i-4)/2;check(`slave['energy'] = ${5-i} and slave_rate['stamina'] = ${100-Math.floor(total/2)} and slave['jo9_overwork_half'] = ${total%2}`,'full_day_'+i);}
 code+="msg 'JO9_QA_MOW_boundaries_COMPLETE'\n";
 const result=run(d,root+'/green','boundaries',code);fs.copyFileSync(result.log,rec+'/evidence/green.log');write(rec+'/green-results.json',{status:result.results.every(x=>x.pass)?'PASS':'FAIL',cases,assertions:checks,routes:routes.length,instrumentation:'Only Start replaced; exact production cached named and generic helpers run by actual FastQSP; no state primer.',...result});fs.copyFileSync(__filename,rec+'/scripts/reproduce.cjs');console.log(JSON.stringify({cases,assertions:checks,...result}));a(result.results.every(x=>x.pass));
}else if(phase==='red'){
 const d=c.parse(fs.readFileSync(root+'/inputs/before.qsp'));const r=run(d,root+'/red','missing',"usehtml=1\ngs 'refresh_database'\nslave_state=1\nslave['stamina']=5\nslave['energy']=0\nslave['half_action']=0\nslave_rate['stamina']=0\ncheat_inf_en=0\ndynamic $slave_energy_drop\nif slave_rate['stamina'] ! 0: msg 'FAIL_MOW_first_half_observed_<<slave_rate[''stamina'']>>' & exit\nmsg 'JO9_QA_MOW_missing_COMPLETE'");fs.copyFileSync(r.log,rec+'/evidence/red.log');write(rec+'/red-results.json',{status:'EXPECTED_FAILURE',...r});a(r.failure&&r.failure.includes('observed_-1'));console.log(JSON.stringify(r));
}
