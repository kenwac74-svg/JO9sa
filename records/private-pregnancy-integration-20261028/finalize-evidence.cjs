'use strict';
// 실행을 추가하지 않고 이미 생성된 숫자 근거와 합성 SAV만 대조한다.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const dir=__dirname;
const ten=JSON.parse(fs.readFileSync(path.join(dir,'unmodified-ten-results.json'),'utf8'));
const probe=JSON.parse(fs.readFileSync(path.join(dir,'unmodified-probe-results.json'),'utf8'));
const doc=sc.parse(fs.readFileSync(path.join(dir,'unmodified-ten-summary.sav')));
const num=(n,k)=>Number(sc.value(doc,n,k)[0]);
assert(ten.pass&&ten.casesPassed===10&&ten.assertions===284&&ten.rendererEntries===10);
assert(num('qa_case_index')===10&&num('qa_cases_passed')===10&&num('qa_assertions')===284&&num('qa_renderer_entries')===10);
const cases=ten.cases.map((c,index)=>{
 const observed=ten.outcomes.find(x=>x.role===c.role&&x.route===c.route);
 assert.equal(observed.pregnant+observed.notPregnant,1);
 const last=index===ten.cases.length-1;
 return {index,role:c.role,interaction:c.id,route:c.route,before:{inseminated:0,ovulation:1,pregnant:0,pregnant_revealed:0,cycle_day:20},afterAction:{inseminatedVerifiedRange:[3,5],inseminatedRecordedExact:last?num('qa_marker_before'):null},afterDay:{inseminatedVerifiedRange:[2,4],inseminatedRecordedExact:last?num(c.role,'inseminated'):null,ovulation:0,pregnant:observed.pregnant,pregnant_revealed:0,cycle_day:19},nonTarget:{identityPreserved:true,inseminatedBefore:0,inseminatedAfterAction:0,inseminatedAfterDay:0,pregnantBefore:0,pregnantAfterDay:0,cycle_dayAfter:19,ovulationAfter:1},basis:'통과한 사례별 QA 조건 및 역할/진입로당1회의 원장 결과. 정확한 표식 난수는 마지막 사례만 최종 SAV에 남음'};
});
fs.writeFileSync(path.join(dir,'case-states.json'),JSON.stringify({cases,pregnant:cases.reduce((a,c)=>a+c.afterDay.pregnant,0),notPregnant:cases.filter(c=>c.afterDay.pregnant===0).length,notStatistics:true},null,2)+'\n');
const saves=[];
for(const run of ['unmodified-probe','unmodified-ten']) {
 const files=['progress','summary'].map(kind=>{const name=run+'-'+kind+'.sav',b=fs.readFileSync(path.join(dir,name));return {name,bytes:b.length,sha256:core.hash(b)};});
 const equal=fs.readFileSync(path.join(dir,files[0].name)).equals(fs.readFileSync(path.join(dir,files[1].name)));
 saves.push({run,files,byteIdentical:equal,decision:equal?'동일 복구본을 유지한 뒤 명시적 중복만 제거 가능':'서로 다른 바이트이므로 양쪽 모두 보존'});
}
fs.writeFileSync(path.join(dir,'save-preservation.json'),JSON.stringify({saves,failedCheckpoints:['initial-qa-progress.sav','second-qa-progress.sav','qa-progress.sav'],failedDecision:'서로 다른 실패 시점의 합성 SAV이므로 전부 보존'},null,2)+'\n');
for(const [name,preserved] of [['native-results.json','sanitized-final-native-results.json'],['plan.json','sanitized-final-plan.json']]) {
 const dest=path.join(dir,preserved);if(!fs.existsSync(dest))fs.copyFileSync(path.join(dir,name),dest);
}
const report={status:'NATIVE_CONNECTED_PASS',sourceSha256:ten.sourceSha256,currentWorkSha256:ten.currentWorkSha256,currentWorkDelta:ten.currentWorkDelta,caseCount:ten.caseCount,casesPassed:ten.casesPassed,assertions:ten.assertions,rendererEntries:ten.rendererEntries,modifiedLocations:ten.modifiedLocations,unmodifiedLocationCount:ten.unmodifiedLocationCount,completionEvidence:'새 최종 SAV의 완전 파싱과 사례수/검사수/renderer 수/마지막 상태 대조',stateCompletion:ten.status,elapsedMs:ten.elapsedMs,outcomes:{pregnant:cases.reduce((a,c)=>a+c.afterDay.pregnant,0),notPregnant:cases.filter(c=>c.afterDay.pregnant===0).length,notStatistics:true},perCaseEvidence:'case-states.json',exactMarkerLimit:'개별 난수 수치를 누적하지 않았으므로 마지막 사례 외에는 통과 조건의 검증범위로 표시',probe:{wrapperStatus:probe.status,stateCasesPassed:probe.casesPassed,stateAssertions:probe.assertions,stateRendererEntries:probe.rendererEntries,stdoutBytes:probe.stdoutBytes,stderrBytes:probe.stderrBytes},excludedDiagnosticAttempts:['initial-native-results.json','second-native-results.json','sanitized-final-native-results.json'],messageObservation:'직접 spawn 파이프 출력0바이트. MSG 발생0은 증명하지 않음',protected:ten.protected,userReport:'전달받은 제보라 진단/아이콘/주인공/행동/SAV 정보를 확인할 수 없다고 사용자 답변',userReportReproduced:false,userSaveLoaded:false,userSaveWritten:false,productionChanged:false,diagnosticsCleaned:false,review:'REVIEW_KO.md',limitations:['실제 사용자의 저장 캐시와 GUI 클릭·동의 과정은 재현하지 않음','정상 수락 조건의 원문 분기와 상태 계산을 검증함','최종 interaction_screen 안의 화면·special_action 등 renderer 내부 후속 동작은 실행하지 않음','일일 전체 사건·경제·출산 동선과20~30일 연속 플레이는 실행하지 않음']};
assert(report.protected.every(x=>x.unchanged));
fs.writeFileSync(path.join(dir,'native-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,cases:report.casesPassed,assertions:report.assertions,pregnant:report.outcomes.pregnant,notPregnant:report.outcomes.notPregnant,distinctSavesPreserved:saves.every(x=>!x.byteIdentical)}));
