'use strict';
const fs=require('fs'),a=require('assert/strict'),cp=require('child_process'),zlib=require('zlib'),path=require('path'),H=__dirname;
const v=JSON.parse(fs.readFileSync(H+'/paths.json','utf8')),R=v.repo,c=require(R+'/tools/text-workshop/core.cjs'),sc=require(R+'/tools/qa/save-codec.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),record=R+'/records/catfight-fate-20261030';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const releaseRoot='G:/Codex/tmp/catfight-fate-release-20261030',runs=fs.readdirSync(releaseRoot).filter(x=>x.startsWith('run-')),passRuns=runs.filter(x=>json(releaseRoot+'/'+x+'/report.json').verdict==='PASS');a.equal(passRuns.length,1);const run=releaseRoot+'/'+passRuns[0],release=json(run+'/report.json');
const red='G:/Codex/tmp/catfight-fate-red-20261030',green='G:/Codex/tmp/catfight-fate-green-20261030',client=json(green+'/client-results.json');a.equal(client.length,5);a(client.every(x=>x.pass));const nativeInputs=json(H+'/native-green-inputs.json');a.equal(nativeInputs.hash,v.after);
const evidence=[];for(const name of client.map(x=>x.name)){const d=sc.parse(fs.readFileSync(green+'/'+name+'.sav'));const checks=+sc.value(d,'qa_checks')[0],fail=+sc.value(d,'qa_fail')[0];a.equal(fail,0,name);a(checks>0);evidence.push({name,checks,fail,choices:sc.value(d,'qa_choices')[1],rendered:sc.value(d,'qa_rendered')[1],followup:sc.value(d,'qa_final_text')[1],alignment:+sc.value(d,'jo9_cruel_mercy')[0],wins:+sc.value(d,'slave','catfight_level')[0],fame:+sc.value(d,'slave_rate','fame')[0],sparks:+sc.value(d,'sparks')[0]});}
const rd=sc.parse(fs.readFileSync(red+'/logic.sav')),redEvidence={checks:+sc.value(rd,'qa_checks')[0],fail:+sc.value(rd,'qa_fail')[0],firstFailures:rd.vars.find(x=>x.name==='QA_FAILURES').values.slice(0,8).map(x=>x[1])};a(redEvidence.fail>0);
const work=v.game+'/jack.qsp',raw=fs.readFileSync(work),candidate=fs.readFileSync(v.candidate);a.equal(c.hash(raw),v.before);a.equal(c.hash(candidate),v.after);a.equal(c.hash(fs.readFileSync(v.stateSave)),v.saveHash);
const old=c.parse(raw),now=c.parse(candidate),patch=json(v.patch),expected=old.lines.slice();for(const e of patch.edits){const l=old.locations.find(x=>x.name===e.location),body=c.shift(expected[l.body],5);a.equal(body.split(e.old).length-1,e.count);expected[l.body]=c.shift(body.split(e.old).join(e.new),-5);}a.deepEqual(now.lines,expected);a.deepEqual(now.locations,old.locations);qa.inspectWorld(candidate);
const planPath=R+'/records/full-client-preparation-20261029/full-client-input-plan.json',planRaw=fs.readFileSync(planPath),plan=JSON.parse(planRaw);a.equal(plan.qspSha256,v.before);const row=plan.files.find(x=>x.path==='game/jack.qsp');a.equal(row.sha256,v.before);
fs.mkdirSync(record,{recursive:true});fs.writeFileSync(v.backup+'/full-client-input-plan.json.gz',zlib.gzipSync(planRaw),{flag:'wx'});
cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',work,'-ModsDir',v.tmp+'/mods'],{stdio:'inherit'});a.equal(c.hash(fs.readFileSync(work)),v.after);a.equal(c.hash(fs.readFileSync(v.stateSave)),v.saveHash);
const patched=c.parse(fs.readFileSync(work));qa.inspectWorld(fs.readFileSync(work));a(c.serialize(patched).equals(fs.readFileSync(work)));a.deepEqual(patched.lines,now.lines);
fs.copyFileSync(v.patch,R+'/mods/'+path.basename(v.patch));plan.qspSha256=v.after;row.sha256=v.after;row.bytes=candidate.length;plan.summary.includedBytes=plan.files.reduce((n,x)=>n+x.bytes,0);fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n');
for(const name of ['PLAN_KO.md','prepare.cjs','native.cjs','install.cjs','paths.json','native-red-inputs.json','native-green-inputs.json'])fs.copyFileSync(H+'/'+name,record+'/'+name);
for(const f of ['report.json','report.md','client-runner.log','patch-reapply.log','patch-replay.log'])if(fs.existsSync(run+'/'+f))fs.copyFileSync(run+'/'+f,record+'/release-'+f);
for(const failed of runs.filter(x=>!passRuns.includes(x)))for(const f of ['report.json','patch-reapply.log'])if(fs.existsSync(releaseRoot+'/'+failed+'/'+f))fs.copyFileSync(releaseRoot+'/'+failed+'/'+f,record+'/initial-failed-'+f);
fs.writeFileSync(record+'/native-results.json',JSON.stringify({red:redEvidence,green:evidence,totalGreenChecks:evidence.reduce((n,x)=>n+x.checks,0),client},null,2));
const refs={};for(const n of v.changed){const l=patched.locations.find(x=>x.name===n),ls=c.shift(patched.lines[l.body],5).split('\r\n');refs[n]=ls.map((s,i)=>({line:i+1,code:s})).filter(x=>/JO9 MOD START CATFIGHT_/.test(x.code));}
fs.writeFileSync(record+'/installation.json',JSON.stringify({...v,work,record,sourcePatch:R+'/mods/'+path.basename(v.patch),releaseVerdict:release.verdict,changedLocations:v.changed,totalGreenChecks:evidence.reduce((n,x)=>n+x.checks,0),nativeOriginalSaveLoad:false,refs,buildInputPlan:planPath},null,2));
fs.writeFileSync(record+'/MANUAL_KO.md',[
'# 캣파이트 승리 후 처분 선택 — 2026-10-30','',
'사용자 승인에 따라 WORK에 반영했다. 일반 상대 gladiatrix1/2/3에 처형/살려주기를 연결한다. 에게야의 영입 결투·패배 판정·보상 수치는 변경하지 않았다.','',
'## 변경과 호출','',
'$catfight_fight_start: 전투 배열/전투 UI 초기화 뒤 jo9_battle_fate(init, catfight)를 호출한다. CATFIGHT_FATE_START_20261030.','',
'jo9_battle_fate: source=catfight, arena_mode=1, fight_return=Start1, place=catfightclub, 적1명, 허용된 상대3종일 때 기존 mode2를 활성화한다. CATFIGHT_FATE_SCOPE_20261030. 기존 stage/result/choose/exit 단계와 기존 UI·처형 필터를 그대로 쓴다. init는 입력 인자를 읽어 mode를 설정하고 반환한다. 신규 로케이션·영구 변수·이미지는 없다.','',
'선택: 상대의 전투불능은 승리 후 처분 전까지 사망/기절 집계를 미룬다. 처형은 기존 jo9_cruel_mercy에 -1, 생존은 +1이며 중복 선택은 기존 phase 방어로 무시한다. render 문구를 주인공의 지시→승리한 노예의 행동으로 맞췄다. CATFIGHT_FATE_INSTRUCTION_20261030.','',
'interaction_city=103005: 현행/옛 역할 분기의 결과 대사를 모두 선택별로 맞췄다. mode2/phase3일 때 현재 선택을 읽고, 그 외에는 중립 승리문을 사용한다. 기존 상금300, 승수, 명성10/3/3, 성장·부상·기분 정산은 그대로다. CATFIGHT_FATE_FOLLOWUP_HERO_20261030 / CATFIGHT_FATE_FOLLOWUP_LEGACY_20261030. 옛 분기의 돈지갑 표기만 상금으로 통일했다.','',
'## 검증','',
'수정 전 격리 엔진: 198조건 중168실패로 누락을 재현. 수정 후: 상대3종×원인4종×처분2종 및 제외/기존범위 198조건 모두 통과. 실제 시작→라운드판정→선택→렌더→결과정산4경로에서52조건 통과. 총250조건. 처형·생존 후 지시문/필터, 재표시 동일성, 반복 선택/출구에서 잔혹·자비/승수/명성/상금·행동력 중복 없음 확인.','',
'공식 출고 PASS: 구조/왕복/줄바꿈·주석경계, 패치 재생·재적용, JSON 등록, 기존 상태를 구성한 실제 엔진9경로. 첫 재적용 검사에서 두 결과대사의 동일 패치표식을 구분하지 못한 기록이 있어 경로별 고유표식으로 보완한 뒤 다시 통과했다. 최초 실패보고도 보존했다.','',
'세이브 원본 해시는 동일하다. 새 세이브 이관은 없다. 이번 변경은 새로 시작한 캣파이트에서 활성화된다. 이미 전투 중인 구형 세이브를 새 선택 상태로 소급 변환하지 않는다.','',
'## 의존성과 한계','',
'기존 раcкладка_бой의 전투상태 초기화, конец_раунда의 stage 호출, конец_боя의 선택 표시, выход_из_боя의 단계별 중복정산 방어, 조합상대 정의와 기존 CSS/붉은 필터 파일을 사용한다. 시작 연결이나 허용 조건을 빼면 선택이 나오지 않는다. 기존 phase 방어를 제거하면 보상/잔혹·자비 중복 방지 계약이 깨진다. 대사 블록은 mode2/phase3을 확인해 지난 선택의 혼입을 피한다.','',
'검사는 기존 세이브의 대표 값을 진단용 Start에 구성해 실제 엔진 코드를 실행한 것이다. 원본 SAV를 UI로 불러오거나 실제 마우스로 선택지를 클릭한 수동 플레이 검사는 아니다. 시작/라운드/승패/정산 소스는 유지했고 진단의 화면 진입·결과 출력 끝점만 계측했다. 결과 HTML과 필터 삽입은 실제 render로 확인했으며 픽셀 배치 자체는 변경하지 않았다. 모든 게임 분기의 무결성을 보증하지 않는다.','',
'검사 후 WORK SHA256: '+v.after,'직전 복구본: '+v.baseline,'변경 원문/줄 위치: installation.json의 refs와 선언형 mods JSON.','배포 폴더·ZIP·커밋·푸시 변경 없음.',''].join('\r\n'));
console.log(JSON.stringify({installed:true,sha256:v.after,locations:v.changed,nativeChecks:evidence.reduce((n,x)=>n+x.checks,0),release:'PASS'}));
