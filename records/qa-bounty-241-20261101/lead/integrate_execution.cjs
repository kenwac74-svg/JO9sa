'use strict';
// Integrates root-owned reports. Does not launch engines or write production inputs.
// make_plan.cjs is the original planning snapshot; rerun this after that script if needed.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),a=require('assert/strict');
const L=__dirname,B=path.dirname(L),R='G:/somi/JO9sa';
const W='G:/somi/Jack O Nine Tails v2.4_work/game',F='G:/somi/Jack O Nine Tails v2.4 Kor_Full';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const write=(name,obj)=>fs.writeFileSync(L+'/'+name,JSON.stringify(obj,null,2)+'\n');
const tc=read(L+'/tc.json'),snap=read(L+'/source_snapshot.json');
const workHash='78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d',fullHash='f87363c3050547ae6b7a5387ae9870425fdc4d68cb2e07855e4550df29664168';
const reportPaths={game:B+'/game/native-final-results.json',static:B+'/game/static-test-results.json',historical:B+'/historical/native-historical-report.json',service:B+'/conditions/adversarial-report.json',package:B+'/package/package-report.json',toggle:B+'/toggle-native-report.json',candidate:B+'/toggle-fix-native-report.json',proposal:B+'/conditions/fix-proposal.json',css:B+'/package/css-candidate.json'};
const data=Object.fromEntries(Object.entries(reportPaths).map(([k,p])=>[k,read(p)]));
a.equal(data.game.sourceHash,workHash);a.equal(data.historical.sourceSha256,workHash);a.equal(data.toggle.sourceSha256,workHash);a.equal(data.candidate.sourceSha256,workHash);a.equal(data.package.manifest.qspActual,fullHash);
a.equal(data.game.cases,1149);a.equal(data.game.assertions,14027);a.equal(data.game.failures,0);a(data.game.runs.every(x=>x.pass));a(data.historical.pass);a.equal(data.historical.checks,301);a.equal(data.historical.imagesRendered,false);a.equal(data.static.tests.length,11);a(data.static.tests.every(x=>x.pass));a.equal(data.service.tests,22);a.equal(data.service.failed,0);a.equal(data.package.manifest.actualPayloadFiles,42941);a.equal(data.package.manifest.sha256Mismatches.length,0);a(data.toggle.confirmedRegression);a(data.candidate.pass);a.equal(data.candidate.productionApplied,false);a.equal(data.candidate.isolatedCandidate,data.proposal.after_sha256);
const originalIds=tc.test_cases.filter(x=>x.id!=='Q241-CUT-003').map(x=>x.id);a.equal(originalIds.length,46);a.equal(tc.manual_fixture_gaps.length,9);
const checkSum=x=>x.cases.reduce((s,c)=>s+c.checks,0),failSum=x=>x.cases.reduce((s,c)=>s+c.failures,0);
a.equal(checkSum(data.toggle),15);a.equal(failSum(data.toggle),4);a.equal(checkSum(data.candidate),29);a.equal(failSum(data.candidate),0);
const suite=(id,p,kind,result,counts,limits)=>({id,report:p,report_sha256:sha(fs.readFileSync(p)),kind,result,counts,limits});
const suites=[
 suite('S-GAME',reportPaths.game,'root_serial_native','pass_within_reported_contract',{cases:1149,assertions:14027,failed_assertions:0},['실제 성향 helper/전투 선택 및 파산 fail_quests 계약. 전체 전투 턴·보상 UI·급매/이주 전체 연쇄는 실행하지 않았다.']),
 suite('S-HIST',reportPaths.historical,'root_serial_native','pass_within_reported_contract',{cases:6,assertions:301,failed_assertions:0},['최신 WORK 입력에서 새 실행. 결과 renderer/종료점을 대체했으며 imagesRendered=false.','공개 TC를 priming한 소유 진단 사본의 GAME_VER만 2.4.1로 맞췄다. 원래 공개 SAV는 변경하지 않았다.']),
 suite('S-STATIC',reportPaths.static,'read_only_static_and_PNG','pass_static_only',{checks:11,failed:0},['실제 QSP 문장과 PNG 바이트 확인. QSP 실행·DOM·픽셀 배치 검사와 구분한다.']),
 suite('S-SERVICE',reportPaths.service,'isolated_service_HTTP_browser_contract','pass_within_reported_contract',{checks:22,failed:0},['격리 서버·도구·모달 계약. 실제 WORK 저장 0. 추가 native 전환 결함은 별도 S-TOGGLE이다.']),
 suite('S-PACKAGE',reportPaths.package,'read_only_package_integrity','manifest_pass_with_reference_candidate',{payload_files:42941,payload_bytes:17167244409,all_files_including_manifest:42942,sha256_mismatches:0},['배포 명세와 전체 payload 일치. 실제 실행·깨끗한 PC·GUI 저장/로드는 미실행.','CSS content/a.jpg 정적 부재 후보를 별도 유지하며 전체 런타임 무결함으로 확대하지 않는다.']),
 suite('S-TOGGLE',reportPaths.toggle,'root_serial_native_original_pipeline','confirmed_fail',{probes:3,assertions:15,failed_assertions:4},['현재 WORK의 원래 jo9_html과 jo9_toggle 4회를 실행했다. client.pass는 완료 marker 성공이며 assertion 통과를 뜻하지 않는다.','무조건 대조군은 통과, 조건 1개/2개 그룹에서만 각 2개 기대가 실패했다.']),
 suite('S-CANDIDATE',reportPaths.candidate,'root_serial_native_isolated_candidate','isolated_contract_pass_not_applied',{probes:5,assertions:29,failed_assertions:0},['05f5726d… 격리 후보만 검사했다. WORK/Full 생산 반영 0. 전체 출고/모든 fallback/실제 GUI 픽셀 검증은 별도 gate다.'])
];
const rows=tc.test_cases.filter(x=>x.id!=='Q241-CUT-003').map(t=>({tc_id:t.id,owner:t.owner,planned_target:t.target,status:t.owner==='human'?'human_not_run':'not_run_current',full_planned_case_pass:false,current_evidence:[],remaining_scope:t.owner==='human'?['사람의 GUI/육안 실행 전이다.']:['이번 실행 보고에서 이 TC 전체의 실행 증거를 확인하지 못했다.'],counts_are_suite_level:true}));
const by=new Map(rows.map(x=>[x.tc_id,x]));
function map(id,status,evidence,remaining){const r=by.get(id);a(r,id);r.status=status;r.current_evidence=evidence.map(([suite_id,covered_scope])=>({suite_id,covered_scope}));r.remaining_scope=remaining;}
map('Q241-REL-001','static_pass_only',[['S-STATIC','현재 QSP 입력 해시·파싱 왕복'],['S-PACKAGE','현재 Full QSP/명세 해시와 payload 일치']],[ '이 감사의 최신 입력 대상 공식 native 9경로·최소 패치 재현/멱등성 전체 실행 증거는 이 매핑에 없다.','WORK와 Full의 서로 다른 입력을 각각 실행한 전체 출고 판정은 아니다.']);
map('Q241-RES-001','static_pass_only',[['S-PACKAGE','전신23쌍·UI2694쌍·Full 전용9경로와 전체 명세의 새 해시 대조']],[ '모든 동적 QSP/JSON 선택 분기의 실제 파일 로딩·WORK 전체 경로 런타임 검증은 미실행.']);
map('Q241-CAT-001','partial_engine_pass',[['S-HIST','current/legacy 주인공 × 승수0/2/3/9 메뉴 참가 조건 및 실제 slave 승수 증가']],[ '현재 이름/옛 소개 캐시 교정과 실제 참가자 패널의 시각 판단은 별도 미실행.']);
map('Q241-CAT-002','partial_engine_pass',[['S-HIST','정산 4상황: $100·정확 인물 승수·1페이지 텍스트·이미지 경로 변수'],['S-STATIC','두 주인공 분기 $100 단일 지급/페이지 구조'],['S-GAME','선택 함수의 성향 1회·무효/반복 콜백 차단']],[ '최종 renderer를 대체했다. 그림 로딩·실제 다음 버튼·클럽 복귀 전체·다음 생활 장면 수명은 통과로 계산하지 않는다.']);
map('Q241-ARE-001','static_pass_only',[['S-STATIC','1294 최저/단계별 산식 뒤 ×2·단일 지급·1페이지·1295 미변경']],[ '실제 단계1/9 지급 $100/$224와 renderer→다음 버튼→복귀 전체는 미실행.']);
map('Q241-ARE-002','partial_engine_pass',[['S-GAME','연습20번호 × 4원인 × 2선택: 처형 무효·종료 성향0·반복 정산 방어']],[ '실제 choices의 회색 span/옛 pending 캐시·3역할의 컷/문구/XP/복귀는 미실행.']);
map('Q241-ARE-003','static_pass_only',[['S-STATIC','양 무대 signed 임계식·KO+1·완료 guard 존재'],['S-GAME','반점 helper와 ±5 조기 임계 방지 산술']],[ '실제 패배 출구·제어 난수·치명상 즉사 우선·옛 loser_rating100·결과 대사 native 행렬은 미실행.']);
map('Q241-GRP-001','static_pass_only',[['S-STATIC','단체 PNG8개 서명·795×596 및 공용 출력부에 개별 sprite/onload 없음']],[ '8그룹의 실제 DOM 단일 장면·onerror·성기사 controls·정상/처형 필터·이벤트 복귀는 미실행.','S-GAME의 안개7로스터 선택 검사와 이8그룹 시각 검사는 범위가 다르다.']);
map('Q241-COM-001','partial_engine_pass',[['S-HIST','실제 DB/sprite 4단계/context의 경로·원래 수치·전투 상태 sentinel37판정']],[ '전투 PNG/초상/트로피 전체 실제 렌더 및 기존 SAV의 새 전투 진입은 미실행.']);
map('Q241-SCORE-001','partial_engine_pass',[['S-GAME','산술329행·구 remainder 누락 상태·부호 교차·정규화·±5·local 복원']],[ '이미지 조건 편집기의 합산 비교값과 런타임 연결 전체는 별도이다.']);
map('Q241-SCORE-002','partial_engine_pass',[['S-GAME','정식160/캣파이트24/안개56 및 무효입력/phase/비승리·반복 선택 점수/전리품 guard']],[ '도시 처분·획득·식품점·사파리 성공/취소/비용부족/같은 외형 새 전리품 분기는 이번에 실행하지 않았다.']);
map('Q241-CUS-001','partial_engine_pass',[['S-HIST','stock 교체 후 위탁 당사자 반환·대표 숫자/문자열/교육/장비 sentinel 및 $5 차감14판정의 일부']],[ '모든23묶음 전체 동등성·ID0·슬롯 점유·현금0·실제 상세 renderer는 이 배치의 검증 전체와 같지 않다.']);
map('Q241-CUS-002','partial_engine_pass',[['S-HIST','return/settle/collect 반복0·옛 전용보관 없는 반환 차단']],[ '당일 다수 위탁·새 위탁+옛 채권 공존·실제 하루 진행/상세 viewprobe 전체는 미실행.']);
map('Q241-SAL-001','partial_engine_pass',[['S-HIST','dealer_quote 5999/6000/6001 및 복종 감액4판정; appraisal 제어']],[ '실제 상인 지급·경매·개인8000·구 고액 콜백·비대상 지급 전체는 미실행.']);
map('Q241-BNK-001','partial_engine_pass',[['S-HIST','TC05 기반 장식/이주 자산 helper·재환급 차단·27시설/입주자 정리38판정'],['S-GAME','29역할 × 고유type/의뢰 상태의 fail_quests 계약410사례'],['S-STATIC','청구 active guard·실제 급매의 신원확인→의뢰실패→clear 순서']],[ '전체 파산 UI 단계·실제 급매/계약 소유 처리·직접 방법 찾기·날짜 회피·최종 청구 지불의 전체 연쇄는 미실행.']);
map('Q241-AGR-001','partial_engine_pass',[['S-HIST','실제 메뉴·구매 handler의 통화/자금 경계·반복 구매·기존 플래그 보존180판정의 일부']],[ '결과/상점 종료점을 대체했다. 네이티브 툴팁·시각 배치·실제 상점 복귀 전체는 미실행.']);
map('Q241-AGR-002','partial_engine_pass',[['S-HIST','특수 재고 및 일반 fridge 분리·저장고 HTML의 상태 계약180판정의 일부']],[ '사용자가 Game→Save/Load로 신규 재고를 복원하는 GUI/CRC 시험과 실제 목록 픽셀은 미실행.']);
map('Q241-ROM-001','source_snapshot_only',[],['source_snapshot S02에서 지급 대상 한 토큰만 읽어 확인했다. 실제 성장/하루 진행 엔진은 이번에 실행하지 않았다.']);
map('Q241-CUT-001','confirmed_fail_partial_scope',[['S-TOGGLE','실제 jo9_html→jo9_toggle 파이프라인에서 수동 C 다음 D/A에 도달하지 못함; 상세는 Q241-CUT-003']],[ '결함은 수동 전환 보존 기대를 위반한다. AND/계급/평판/모든 경계/직접renderer10곳 전체를 새로 실행했다는 뜻은 아니다.']);
map('Q241-CUT-002','service_contract_pass_only',[['S-SERVICE','격리22검사: 가족/경로·삭제/추가 컷·동시 hash충돌·저장/복원·본문제한·인증·모달 응답/재시도·보호해시']],[ '22개에 명시된 HTTP/서비스/브라우저 계약의 통과이다. 조건 QSP의 모든 런타임 분기·실제 게임 수동 컷 순환/픽셀까지 포함하지 않는다.']);
const newTC={id:'Q241-CUT-003',title:'조건 컷이 일치할 때 실제 수동 전환이 B/C 반복에 갇힘',priority:'P2',update_ids:['U16'],source_refs:[{path:R+'/tools/text-workshop/image-cut-condition-rules.cjs'},{path:W+'/jack.qsp',locations:['interior_change'],marker:'JO9_CUT_CONDITION_CORE_20261101'},{path:B+'/toggle-native.cjs'},{path:reportPaths.toggle}],owner:'auto',target:'WORK_only_current_78835089',method:'isolated_native_original_jo9_html_then_4_original_jo9_toggle_calls',preconditions:['A/B/C/D 실제 파일이 있는 격리 가족. B에 만족하는 조건1개 또는 B·C에 만족하는 조건2개.','현재 WORK 원문 함수로 시작한다. 개인 SAV·실제 사용자 조건·그림은 변경하지 않는다.'],steps:['원래 jo9_html로 처음 그림을 출력해 자동 B 선택을 확인한다.','원래 jo9_toggle을4번 호출하고 각 저장 선택 ID를 기록한다.','조건 없는 A/B/C/D 대조군도 같은 함수로4번 전환한다.'],expected_result:['조건 그룹: 초기 B → C → D → A → B. 조건이 없는 대조군: A → B → C → D → A.','새 mode0 출력에서는 가장 작은 만족 컷인 B가 자동 우선되되, 수동 전환 중에는 그 우선 선택이 매번 재실행되지 않는다.'],actual_result:['현재 조건1개/2개 모두 B → C → B → C → B. 조건 없는 대조군만 A → B → C → D → A.','3probe·15assert 중 조건 그룹의4기대가 실패했다. 엔진 완료 client.pass와 assertion 실패를 구별한다.'],evidence:{state:'confirmed_fail',independentCurrentEnginePass:false,previousReports:[],previousEvidenceIsNotCurrentPass:true,current_reports:[reportPaths.toggle],suite_id:'S-TOGGLE',assertions:15,failed_assertions:4,productionApplied:false},fix_candidate_gate:'GATE-CUT-003'};
tc.test_cases=tc.test_cases.filter(x=>x.id!==newTC.id);tc.test_cases.push(newTC);
const newRow={tc_id:newTC.id,owner:'auto',planned_target:newTC.target,status:'confirmed_fail',full_planned_case_pass:false,current_evidence:[{suite_id:'S-TOGGLE',covered_scope:'조건1개/2개와 무조건 대조군의 실제 출력→4회 수동 전환 재현'}],remaining_scope:['현 생산 WORK는 미수정. 격리 수정 후보의 통과는 아래 gate와 분리한다.'],counts_are_suite_level:true,fix_candidate_gate:'GATE-CUT-003'};rows.push(newRow);
const gate={id:'GATE-CUT-003',bug_tc_id:newTC.id,proposal:reportPaths.proposal,status:'isolated_candidate_contract_pass_not_production_fixed',before_sha256:workHash,candidate_sha256:data.candidate.isolatedCandidate,production_applied:false,full_synced:false,scope:{changed_locations:1,changed_calls:1,new_variables:0,new_locations:0,save_migration:false},change:{location:'interior_change',old:data.proposal.edits[0].old,new:data.proposal.edits[0].new,reason:'수동 선택 검증의 implicit mode0 자동 우선선택을 건너뛰고 기존 mode3의 유지/필터/fallback을 사용한다.'},passed_gate:{suite_id:'S-CANDIDATE',probes:5,assertions:29,failed_assertions:0,contracts:['무조건 대조군 순환 유지','조건1/2개가 일치할 때 B→C→D→A→B','조건 소실시 A/남은 후보 fallback','새 mode0 출력은 여전히 B 자동 우선']},remaining_gates:[{id:'candidate-extra-edges',state:'not_run',scope:'선택 파일 삭제, A 부재, 기존 compact ID, overlay 실제 전환의 별도 native 경계.'},{id:'candidate-official-release',state:'not_run',scope:'후보의 구조/CRLF/주석·정확 패치 재생/멱등성·공식 native9경로와 원문 보존.'},{id:'candidate-visual-click',state:'not_run_fixture_unready',fixture_gap:'G09',scope:'실제 B/C컷 전환 버튼·레이어·조건 상실 이후 육안 확인.'},{id:'production-integration',state:'not_authorized_this_audit',scope:'현재 감사는 생산 반영·Full 동기화·ZIP·커밋·푸시를 하지 않는다. 현재 입력 해시가 달라지면 후보를 그대로 적용하지 않는다.'}]};
const statuses=rows.reduce((m,r)=>(m[r.status]=(m[r.status]||0)+1,m),{});
const execution={schema_version:'1.0',audit_date:'2026-11-01',source_qsp:{work:workHash,full:fullHash},scope:{integration_only:true,engines_run_by_this_integrator:0,private_sav_read:false,new_sav_manufactured:false,production_edits:false,baseline_make_plan_script_untouched:true},summary:{original_planned_cases:46,original_auto_cases:38,original_human_cases:8,added_confirmed_regression_cases:1,total_cases:47,entire_original_planned_case_pass_claims:0,status_counts:statuses,manual_fixture_gap_groups_unready:9},counting_rules:['Suite 수는 각 보고서의 실제 수행 수다. 여러 TC에 연결된 같은 suite의 assertion을 다시 합산하지 않는다.','partial_engine_pass는 지정 helper/분기만 통과했다는 뜻이며 TC 전체 UI·renderer·통합 흐름 PASS가 아니다.','이번 301판정은 최신 WORK에서 새로 수행한 결과다. 예전 301판정과 합산하지 않는다.','새 조건 결함1건은 CUT-001과 CUT-003에 연결되어도1건으로 센다.','후보5probe29assert 통과는 현 생산 결함이 해결됐다는 의미가 아니다.'],suites,mappings:rows,candidate_gates:[gate],manual_fixture_gaps:tc.manual_fixture_gaps.map(g=>({...g,readiness:'unready_no_new_fixture_prepared'})),findings_summary:{confirmed_new_runtime_bug:1,confirmed_document_inconsistency:1,static_reference_candidate_runtime_unproven:1,held_items_resolved:0}};
tc.execution_map_file=L+'/execution-map.json';tc.addenda=[{id:'current-run-integration',script:L+'/integrate_execution.cjs',note:'원래46TC의 계획 증거 상태는 보존하고 현재 수행 범위를 별도 execution-map에 연결했다. CUT003만 새 확정 재현으로 추가했다.'}];tc.candidate_gates=[gate];
write('tc.json',tc);write('execution-map.json',execution);
const target=p=>'[공개 '+path.basename(p)+'](<'+p+'>)';
const publicLink=name=>target(F+'/game/save/'+name);
const handoff=[
'# 2.4.1 사람이 직접 확인할 항목',
'',
'자동 검사는 합성 상태의 함수·분기와 파일 구성을 확인했다. 아래 화면 배치·그림·실제 클릭·저장 복원은 아직 사람이 실행하지 않았다. 기존 공개 TC 7개를 그대로 사용하며 새 시험 SAV를 제작하지 않았다.',
'',
'[Full 폴더](<'+F+'>)의 [게임 실행.cmd](<'+F+'/게임 실행.cmd>)로 완전히 새로 실행한다. 각 항목은 원래 TC를 새로 불러오고 원본에 덮어저장하지 않는다. 이전 버전에서 만든 TC의 업데이트 안내는 오류 여부와 구분해 문구를 기록한다. 우선 H02·H03·H04·H07만 하면 약25분, 전체8개는 약42분이다.',
'',
'|순서|시작점과 동작|확인할 결과|',
'|---|---|---|',
...tc.test_cases.filter(t=>t.owner==='human').map(t=>{
 const steps=t.steps.slice();const result=t.expected_result.slice();
 if(t.id==='Q241-H03'){steps.push('전투 소리를 켰다 끄고, 좌우150×150 초상 주변도 본다.');result.push('실제 인물 초상·소리가 정상인지 본다. 초상 주변 빈 배경은 CSS content/a.jpg 후보와 구분해 캡처한다.');}
 return '|'+t.id.replace('Q241-','')+' '+t.priority+'|'+(t.fixture?publicLink(t.fixture):'[게임 실행.cmd](<'+F+'/게임 실행.cmd>)')+'<br>'+steps.join('<br>')+'|'+result.join('<br>')+'|';
}),
'',
'가능할 때만 아래3개를 더 확인한다. 같은 공개 TC를 사용하며 개인 SAV는 열지 않는다.',
'',
'|추가|준비·실행|기대 결과|',
'|---|---|---|',
'|O01 깨끗한 PC·이동 실행|개발 도구·추가 팩이 없는 Windows 환경에 Full 전체 점검 사본을 공백·한글 경로로 복사한다. 네트워크를 끄고 CMD로 실행해 '+publicLink('TC_01_HOME_TRAITS.sav')+' 정보, '+publicLink('TC_02_CATFIGHT_INTRO.sav')+' 전투, '+publicLink('TC_04_AGRABAH_FRUIT.sav')+' 상품을 연다. 소리 켜기·도시/전투 전환도 본다.|2.4.1·한글·인물·UI·소리가 동작하며 제작자 G드라이브·모드툴·외부 코덱을 요구하지 않는다. 현재 감사 PC의 DLL 존재 검사로 이 항목을 대신하지 않는다.|',
'|O02 DPI·클릭 위치|Windows 배율100%와 실제 사용 배율에서 '+publicLink('TC_01_HOME_TRAITS.sav')+' 특성/장문 설명과 '+publicLink('TC_02_CATFIGHT_INTRO.sav')+' 전투를 열고 닫는다.|글자·스크롤·하단/우측 버튼이 잘리지 않고 보이는 위치를 누르면 정확히 반응한다.|',
'|O03 별도 QA 저장/재로드|쓰기 가능한 별도 점검 사본에서 '+publicLink('TC_03_CATFIGHT_VICTORY.sav')+' 선택 대기를 새 QA_TEST_PENDING 슬롯에 저장한다. 재시작·로드 후 한 번 완료하고 새 QA_TEST_DONE 슬롯에 저장·재로드한다. 이후 TC01→TC02→TC06→TC01도 같은 세션으로 연다.|대기는 한 번 완료 가능, 완료 화면은 상금·승수·성향을 추가 정산하지 않는다. 저장 위치·CRC/로드·이전 인물/배경 잔류를 확인한다. 원본 공개 TC와 개인 슬롯은 덮어쓰지 않는다.|',
'',
'실패는 **H/O ID, 세이브 이름, 누른 메뉴, 기대/실제, 재현 횟수, 캡처**로 남긴다. 이식성 문제에는 Windows 버전·설치 경로·배율도 적는다.',
'',
'## 아직 준비되지 않은 상태',
'',
'G01~G09의9묶음은 그대로 미준비다: 콜로세움·연습/패배, 위탁, 엘자, 방2성장, 기간 결산/웡 항의, 상한 경계 판매, 캣파이트 패배/관람, 인코딩/줄리아, WORK 조건 컷 전용 상태. 이 항목을 공개 TC7개로 확인했다고 표시하지 않는다. 정확한 트리거는 [TC_PLAN.md](<'+L+'/TC_PLAN.md>)와 execution-map.json에 있다.',
'',
'WORK 전용 조건 컷의 수동 전환 결함은 자동 native로 확인했다. 현재 생산본은 미수정이다. Full에는 이 기능을 동기화하지 않았으므로 위8항목으로 수정 후보의 채택/완료를 판정하지 않는다.',
'',
'워크숍·Show HTML, 마법낙인 재현, 포커스 검은 잔상, 장기 임신 제보는 보류/미해결 상태를 유지한다. 전차 경주용 공개 상태는 이번 점검에 없으므로 초상 주변 후보의 경주 분기를 완료로 세지 않는다.',
''
];
fs.writeFileSync(L+'/HUMAN_HANDOFF_KO.md',handoff.join('\n'));
const findings=[
'# 이번 감사의 결함·후보 구분',
'',
'## 확정 P2 — 조건 컷이 맞을 때 수동 전환이 B/C에 갇힘',
'',
'현재 WORK `'+workHash+'`의 원래 jo9_html과 jo9_toggle을 실행했다. 조건 없는 A/B/C/D는 정상 순환한다. B조건1개 또는 B·C조건2개를 만족시키면 자동 B 이후 수동 클릭이 **B → C → B → C → B**로 반복된다. 기대는 **B → C → D → A → B**다. 3probe·15assert 중 조건 그룹의4기대가 실패했다. Q241-CUT-003으로 기록했다.',
'',
'jo9_toggle의 현재 선택 검증이 implicit mode0를 호출하여 매번 조건 B를 다시 우선 선택한다. C에서 B로 정규화된 것으로 판단되어 기존 수동 증가가 건너뛰어진다. [실제 실패 근거](<'+reportPaths.toggle+'>), [재현 코드](<'+B+'/toggle-native.cjs>)가 있다.',
'',
'격리 후보는 기존 jo9_path 호출1개에 mode3 인수만 추가한다. 조건/후보 필터와 fallback을 유지하면서 수동 검증의 자동 우선선택을 피한다. 후보 SHA `'+data.candidate.isolatedCandidate+'`에서5probe·29assert 실패0을 확인했다. [후보 검사](<'+reportPaths.candidate+'>), [최소 변경 제안](<'+reportPaths.proposal+'>). **생산 WORK/Full에 반영하지 않았다.** 추가 경계·공식 출고·실제 버튼 gate는 execution-map.json의 GATE-CUT-003에 미완료로 남겼다.',
'',
'## 확정 문서 불일치 — 연습 성향 +1 안내',
'',
'10/31 연습 매뉴얼은 종료 시+1이라고 설명하지만11/01 지정행동 규칙과 현행 코드는 연습0이다. 이번 native 연습160사례에서도0을 확인했다. 게임 결함과 구분한 문서 불일치1건이며 이번 감사에서 문서를 수정하지 않았다.',
'',
'## 낮은 영향의 정적 후보 — content/a.jpg 배경 주소',
'',
'Full CSS에 `content/a.jpg` 배경 선언10개가 있으나 파일은 없다. 정적 부재는 확인했고, 실제 화면 손상·인물 그림 누락·진행 장애는 재현하지 않았다. 앞의 인물 img는 별도 주소를 사용한다. **확정 런타임 버그 수에는 더하지 않는다.** [후보 근거](<'+reportPaths.css+'>). H03/O01에서 초상 주변을 확인하고 경주 분기는 공개 상태가 없으므로 미검증으로 둔다.',
'',
'집계: 새 확정 런타임 결함1건(P2), 문서 불일치1건, 화면 영향 미확정 정적 후보1건. 기존 보류항목은 해결 완료로 바꾸지 않았다. 게임·이미지·개인 SAV·Full 동기화·ZIP·커밋·푸시 수정0.',
''
];
fs.writeFileSync(L+'/CONFIRMED_FINDINGS_KO.md',findings.join('\n'));
const appendix='\n<!-- QA_EXECUTION_ADDENDUM_START -->\n## 이번 실행 연결과 새 결함\n\n원래46개 계획은 유지했다. 새 확정 재현 `Q241-CUT-003`을 더해 총47개(자동39·사람8)다. [execution-map.json](<'+L+'/execution-map.json>)은 최신 suite 실행을 좁은 범위로 연결한다. 원래38개 자동 계획 전부를 수행/통과했다는 판정이 아니다.\n\n조건 컷 수동 전환 P2결함은 현재 WORK에서 확인했고 격리 후보5probe29assert는 통과했다. 생산 반영은 하지 않았다. [결함/후보](<'+L+'/CONFIRMED_FINDINGS_KO.md>), [수동8개+선택3개](<'+L+'/HUMAN_HANDOFF_KO.md>)를 사용한다. 공개TC7개는 재사용하며9개 fixture 부족 묶음은 미준비다.\n<!-- QA_EXECUTION_ADDENDUM_END -->\n';
const oldPlan=fs.readFileSync(L+'/TC_PLAN.md','utf8').replace(/\n<!-- QA_EXECUTION_ADDENDUM_START -->[\s\S]*?<!-- QA_EXECUTION_ADDENDUM_END -->\n?/,'');fs.writeFileSync(L+'/TC_PLAN.md',oldPlan+appendix);
const evidence_files=Object.entries(reportPaths).map(([id,p])=>({id,path:p,bytes:fs.statSync(p).size,sha256:sha(fs.readFileSync(p))}));
write('integration-metadata.json',{scope:execution.scope,original_plan_script_sha256:sha(fs.readFileSync(L+'/make_plan.cjs')),source_snapshot_sha256:sha(fs.readFileSync(L+'/source_snapshot.json')),evidence_files,summary:execution.summary});
console.log(JSON.stringify({summary:execution.summary,suites:suites.map(x=>({id:x.id,result:x.result,counts:x.counts})),manual_top:8,manual_optional:3,production_edit:false}));
