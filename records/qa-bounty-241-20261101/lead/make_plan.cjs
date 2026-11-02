'use strict';
// Read-only planning snapshot. Does not start an engine or write game files.
const fs=require('fs'), path=require('path');
const R='G:/somi/JO9sa', W='G:/somi/Jack O Nine Tails v2.4_work/game', F='G:/somi/Jack O Nine Tails v2.4 Kor_Full/game';
const c=require(R+'/tools/text-workshop/core.cjs');
const out=__dirname;
const qsp={work:W+'/jack.qsp',full:F+'/jack.qsp'};
const expected={work:'78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d',full:'f87363c3050547ae6b7a5387ae9870425fdc4d68cb2e07855e4550df29664168'};
const doc={},snapshot={audit:'independent-QA-planning',date:'2026-11-01',enginesRun:0,privateSavesRead:false,gameFilesWritten:false,productionFoldersSynced:false,qsp:{},publicFixtures:[],sourceChecks:[]};
for(const [target,p] of Object.entries(qsp)){const raw=fs.readFileSync(p);doc[target]=c.parse(raw);snapshot.qsp[target]={path:p,bytes:raw.length,sha256:c.hash(raw),expectedSha256:expected[target],hashMatches:c.hash(raw)===expected[target],locations:doc[target].locations.length};}
const body=(d,n)=>{const l=d.locations.find(l=>l.name===n);if(!l)throw Error('Missing location '+n);return c.shift(d.lines[l.body],5);};
const fullBodies=new Map(doc.full.locations.map(l=>[l.name,body(doc.full,l.name)]));
snapshot.locationDifferences=doc.work.locations.filter(l=>body(doc.work,l.name)!==fullBodies.get(l.name)).map(l=>l.name);
const allowedDiff=['slave_stat','assistant_stat','interior_change','trophy_room_screen','#options','jo9_liquidation'];
snapshot.onlyAuthorizedWorkOnlyLocationsDiffer=JSON.stringify(snapshot.locationDifferences.slice().sort())===JSON.stringify(allowedDiff.slice().sort());
const check=(id,location,predicate,note)=>snapshot.sourceChecks.push({id,location,pass:predicate(body(doc.work,location)),type:'independent_read_only_source_check',note});
check('S01','interaction',t=>t.includes("killvar '$special_image_full'")&&!t.includes("killvar '$special_Fimage_full'"),'새 행동의 전체 화면 이미지 배열 변수명 수정을 확인했다. 동작 시험은 아니다.');
check('S02','next_day',t=>t.includes("if room2['ego'] < 3: room2_rate['ego'] += 1")&&!t.includes("if room2['ego'] < 3: room1_rate['ego'] += 1"),'개인실 2 성장 지급 대상 원문 확인. 엔진 실행 아님.');
check('S03','jo9_battle_fate',t=>t.includes('CRUEL_MERCY_RULES_20261101')&&t.includes("gs 'jo9_cruel_mercy_apply', iif(jo9_bf_choice = 1, -2, 2)"),'최신 전투 성향 점수 호출 존재 확인.');
check('S04','interior_change',t=>t.includes('JO9_CUT_CONDITION_CORE_20261101'),'WORK 전용 조건 core 존재 확인. 개별 조건은 설치하지 않음.');
check('S05','jo9_traits_value',t=>t.includes('ERZA_BRANCH_IMAGES_TRAITS_20261101'),'엘자 외모 특성 hook 존재 확인.');
check('S06','jo9_meiki_state',t=>t.includes('ERZA_BRANCH_IMAGES_TRAITS_20261101'),'엘자 명기 발견 hook 존재 확인.');
check('S07','jo9_battle_fate',t=>t.includes("if jo9_fate['mode'] = 2 and (($place = 'colosseum_arena' and $fight_return = 'Start') or ($place = 'catfightclub' and $fight_return = 'Start1')):"),'최신 점수 호출은 정식 경기/캣파이트에만 허용되며 연습 colosseum은 포함되지 않는다.');
const fixtureNames=['TC_01_HOME_TRAITS.sav','TC_02_CATFIGHT_INTRO.sav','TC_03_CATFIGHT_VICTORY.sav','TC_04_AGRABAH_FRUIT.sav','TC_05_BANKRUPTCY_CHAIN.sav','TC_06_FOG_GROUP.sav','TC_07_EGEYA_EVENT.sav'];
const manifest=JSON.parse(fs.readFileSync(R+'/records/full-client-build-20261031/test-save-manifest.json','utf8').replace(/^\uFEFF/,''));
for(const name of fixtureNames){const p=F+'/save/'+name,b=fs.readFileSync(p),m=manifest.created.find(x=>x.path.endsWith('/'+name));snapshot.publicFixtures.push({id:name.slice(0,5),name,path:p,bytes:b.length,sha256:c.hash(b),manifestHashMatches:!!m&&m.sha256===c.hash(b),existsInWork:fs.existsSync(W+'/save/'+name),inputPolicy:'read-only-public-TC-input',guiLoadTestedThisAudit:false});}
const rec=(folder,file='REPORT_KO.md')=>R+'/records/'+folder+'/'+file;
const mod=name=>R+'/mods/'+name+'.json';
const src=(p,locations,marker)=>({path:p,...(locations?{locations}:{}),...(marker?{marker}:{} )});
const updates=[
 ['U01','2.4.1 버전·감사·단독 실행',rec('build-2.4.1-20261101','REPORT_KO.md')],
 ['U02','전투 결과 컷신 수명·다음 생활행동 초기화',rec('catfight-image-leak-20261101')],
 ['U03','캣파이트 참가자·소개·승패·상금·관람',rec('full-client-build-20261031')],
 ['U04','콜로세움 생사·연습·가변 상금·패배 평판',rec('colosseum-prize-single-page-20261101','MANUAL_KO.md')],
 ['U05','8그룹 단일 컷·괴물 단계·MOB 무기 피해',rec('group-defeat-single-cut-20261101','MANUAL_KO.md')],
 ['U06','조수 안개 AP 정산',rec('fog-assistant-ap-20261028','MANUAL_KO.md')],
 ['U07','잔혹·자비 반점과 행동 완료 정산',rec('cruel-mercy-rules-20261101')],
 ['U08','엘자 두 결과·구 캐시·고유 특성',rec('erza-branches-traits-20261101')],
 ['U09','특성 통합·숨은 특성 공개·전체보기',rec('revelio-new-traits-20261028','MANUAL_KO.md')],
 ['U10','잡파 위탁 보관·회수·중복 정산',rec('auction-consignment-fix-20261028','MANUAL_KO.md')],
 ['U11','판매 상한·파산 자산 정리',rec('sale-cap-b-20261026','MANUAL_KO.md')],
 ['U12','금화·특수 식재료·육류 결산',rec('agrabah-special-food-20261030')],
 ['U13','개인실 2 성장·역할/정보 복귀',rec('room2-ego-growth-20261101')],
 ['U14','NPC 그림·소문 제공자·참고정보·웡 대사',rec('reference-panel-spacing-20261101')],
 ['U15','호환 주소·추가27인·인코딩·통합 자원',rec('full-prezip-20261101')],
 ['U16','이미지 B/C컷 등장조건 WORK 전용 도구/core',rec('image-cut-conditions-20261101')]
].map(([id,title,record])=>({id,title,record}));
const cases=[];
function add(id,title,priority,update_ids,source_refs,preconditions,steps,expected_result,prior_report,extra={}){cases.push({id,title,priority,update_ids,source_refs,owner:'auto',target:'WORK_and_Full_separately',method:'isolated_native_engine',preconditions,steps,expected_result,evidence:{state:'not_run_this_audit',independentCurrentEnginePass:false,previousReports:prior_report?[prior_report]:[],previousEvidenceIsNotCurrentPass:true},...extra});}
add('Q241-REL-001','현재 입력 식별·최소 패치 재현','P0',['U01','U16'],[src(qsp.work),src(qsp.full),src(R+'/docs/QSP_RELEASE_VALIDATION.md')],['엔진 실행을 서로 겹치지 않는다. WORK/Full 원본을 수정하지 않는 격리 사본.'],['입력 QSP 해시·277 loc·CRLF/주석 경계·바이트 왕복을 확인한다.','최신 WORK 조건 core 패치의 직전본으로 정확 재생·재적용을 확인한다. 필수 native9경로를 최신 입력으로 실행한다.','WORK/Full 원천과 공개 TC 입력의 작업 전후 해시를 대조한다.'],['현재 해시는 snapshot과 일치. WORK/Full의 의도된 6 loc 차이를 결함으로 오분류하지 않음.','STATIC_PASS나 출력 marker만으로 전체 분기/GUI/SAV 호환 PASS라고 쓰지 않음.'],rec('image-cut-conditions-20261101','release-report.json'),{method:'read_only_structure_plus_isolated_native',evidence:{state:'independent_snapshot_checked_engine_not_run',snapshot:'source_snapshot.json',independentCurrentEnginePass:false}});
add('Q241-RES-001','이미지 호환 주소와 통합팩 누락','P0',['U15'],[src(R+'/assets/compatibility-aliases/2026-10-28_fullimage.json'),src(rec('full-prezip-20261101','Full-only-compat-audit.json'))],['WORK/Full 런타임은 읽기만 한다.'],['전신 호환23쌍과 UI2694쌍의 경로·파일형식·현재 해시를 각각 확인한다.','Full 전용 호환9경로와 추가27인135파일의 입력 원장/실제 파일을 대조한다.','현재 QSP/CSS/JSON 동적 참조가 쓰는 주소를 유지하는지 확인한다.'],['동일 해시여도 서로 다른 호환 주소는 모두 존재.','옛 저장용 경로를 중복/미사용으로 제거하지 않음. 누락·옛팹 재덮기 발견 시 개별 주소로 제보.'],rec('full-prezip-20261101','release-layout-audit.json'),{method:'read_only_resource_audit'});
add('Q241-RES-002','추가27인 생성·역할 복사·퇴역번호','P1',['U15'],[src(mod('2026-10-29_full_client_preparation')),src(rec('full-client-preparation-20261029','REPORT_KO.md'))],['개인 SAV 대신 새 init_game 상태. 새번호1451~1462/2324~2338, 퇴역1450.'],['27개 인물 JSON을 실제 로더로 생성하고 기본 초상/전신 경로를 확인한다.','각 한 번 노예→조수→개인실 bridge를 통과시켜 type/name/23묶음과 이미지 경로를 비교한다.','무작위 생성범위에27개가 들어가고1450이 신규 선택되지 않는지 확인한다.'],['인물 등록·생성 가능, 서로 다른 번호가 충돌하지 않음.','무작위 표본에 안 나왔다는 이유만으로 등록 누락이라고 단정하지 않음.'],rec('full-prezip-20261101','runtime-verification.json'),{method:'read_only_registry_plus_isolated_native'});
add('Q241-RES-003','3021~3026 설명문 실제 표시','P1',['U15'],[src(rec('full-prezip-20261101','encoding-repair.json'))],['실제 JSON 로더를 정상 초기화한 새 합성 상태. 기존 보고의 미완료120판정을 재사용하지 않음.'],['3021~3026을 각각 로드하고 교정한14개 설명필드를 실제 인물 정보 renderer에 전달한다.','아포스트로피·한글·문단 및 ID/수치/경로 보존을 비교한다.'],['UTF-8 JSON 구문 PASS와 실제 표시 PASS를 따로 기록.','깨진 문자 없이 설명을 표시하고 인물별 loader 초기화 실패는 fixture 문제와 제품 오류를 구분.'],rec('full-prezip-20261101','native-encoding-report.json'));
add('Q241-SCN-001','결과→생활행동에서 이전 컷신 부재','P0',['U02','U03'],[src(mod('2026-11-01_interaction_image_scope_reset'),['interaction']),src(rec('catfight-image-leak-20261101','dom.cjs'))],['TC_03은 읽기 전용 입력. 현재/옛 주인공 분기×처형/생존. 실제 renderer와 앞으로가기 콜백 유지.'],['생사 선택→결과 재표시→실제 앞으로가기→도시→집을 같은 세션으로 잇는다.','목욕34, 주인공 요리35, 청소36과 일반 도시 대화를 각각 시작한다.','가능한 조수/노예 식사 준비도 별도 실행하고 #bg>img의 현재src·naturalWidth·이전src 부재를 확인한다.'],['각 새 행동의 그림이 로드되고 catfdef1/catdef2 등 이전 결과 그림은 없음.','아이콘을 장면 그림 수에 세지 않는다. 공통 초기화로 생활장면이 사라지거나 정상 페이지 그림이 지워지지 않음.'],rec('catfight-image-leak-20261101','REPORT_KO.md'),{method:'isolated_native_real_renderer_and_DOM',fixture:'TC_03_CATFIGHT_VICTORY.sav'});
add('Q241-SCN-002','같은 이벤트 두 페이지·반복 표시 보존','P0',['U02','U03'],[src(mod('2026-10-31_catfight_loss_watch_cuts')),src(mod('2026-11-01_interaction_image_scope_reset'))],['캣파이트 관람2페이지 합성 fixture. 공개7개에는 해당 진입 상태 없음.'],['관람1→2페이지→같은2페이지 재표시를 실행한다.','정상2페이지 그림을 확인하고 이벤트를 끝낸 뒤 새 일반행동을 시작한다.'],['같은 이벤트의 페이지별 그림은 유지되며, 새 행동에서만 배열이 초기화됨.','관람 반복 표시로 금전/승수/성향을 정산하지 않음.'],rec('catfight-image-leak-20261101','REPORT_KO.md'),{method:'isolated_native_real_renderer_and_DOM',fixture_gap:'관람 2페이지용 공개 SAV 없음'});
add('Q241-CAT-001','현재 참가자·소개 캐시·참가 승수 제한','P0',['U03'],[src(mod('2026-10-31_catfight_current_name')),src(mod('2026-10-31_catfight_slave_role')),src(mod('2026-10-30_catfight_fate'))],['TC_02 intro는 현재 노예 이사벨라·옛 에게야 소개 캐시. 승수0/2/3/9 경계.'],['실제 참가 메뉴를 표시하고 승수 경계별 활성/차단을 확인한다.','현재 이름을 수동 변경한 합성 상태와 옛 소개 캐시에서103001 소개→전투를 실행한다.','전투 participant/좌하단 프로필이 현재 slave와 일치하는지 확인한다.'],['이사벨라/수동 이름을 사용하고 옛 이름·내부 변수 문자열이 없음.','참가자 role이 노예이며 승수 조건을 우회하거나 다른 인물이 출전하지 않음.'],rec('full-prezip-20261101','native-historical-report.json'),{fixture:'TC_02_CATFIGHT_INTRO.sav'});
add('Q241-CAT-002','캣파이트 양 결과 $100·1회 정산·복귀','P0',['U03'],[src(mod('2026-10-31_catfight_prize_single_page')),src(mod('2026-10-31_catfight_result_image_render'))],['TC_03/합성 현재·옛 주인공×양 선택. phase1 선택→phase2 정산→phase3 재표시를 구분.'],['실제 choose→전투출구→결과 renderer→앞으로가기를 실행한다.','결과 페이지와 종료를 반복 호출하고 실행 전후sparks/승수/성향/인물 상태를 비교한다.'],['처형/생존 모두 현재 $100, 성장·상금 같은1페이지, 현재 이미지 로드, 클럽복귀.','반복 표시/연속 선택/이전 완료 캐시에서 지급·승수·성향이 더 늘지 않음.'],rec('catfight-prize-page-20261031','result-report.json'),{method:'isolated_native_real_renderer_and_DOM',fixture:'TC_03_CATFIGHT_VICTORY.sav'});
add('Q241-CAT-003','내 노예 패배·관람과 주인공 게임오버 구분','P0',['U03','U04'],[src(mod('2026-10-31_catfight_loss_watch_cuts'))],['승부 actor=slave, 주인공 생존. 치명상 즉사/처형/생존3종 및 관람 fixture.'],['실제 패배출구와103002/103003/103004 결과를 실행한다.','노예가 치명상을 버틴 경우와 사망한 경우를 각각 진행하고 관람2페이지도 확인한다.'],['해당 패배/관람 컷과 참가자 이름이 맞음.','내 노예가 생존한 패배에서 주인공GameOver로 잘못 이동하지 않음. 사망의 원래 처리·성장·보상 유지.'],rec('catfight-loss-watch-cuts-20261031','release-report.json'),{fixture_gap:'패배3종/관람 공개 SAV 없음'});
add('Q241-ARE-001','정식 일반승리 가변상금×2·한 페이지','P0',['U04'],[src(mod('2026-11-01_colosseum_prize_single_page'),['interaction_city'])],['정식 일반승리1294: 단계1/9×처형/생존. 챔피언1295·연습1296~1298은 대조군.'],['선택→전투종료→원래 정산→실제 결과UI→다음 버튼을 실행한다.','동일 결과 재표시·종료 재호출을 수행하고 지급·승수·XP를 비교한다.'],['해당 기준상태 단계1 $100, 단계9 $224; 고정$100 아님. 성장·상금은1페이지.','챔피언/연습 지급 불변, 이미 완료된 옛결과 소급 재지급 없음.'],rec('colosseum-prize-single-page-20261101','MANUAL_KO.md'),{fixture_gap:'콜로세움 단계1/9 양 결과 공개 SAV 없음'});
add('Q241-ARE-002','연습20번호 처형 차단·역할별 종료','P0',['U04','U07'],[src(mod('2026-10-31_colosseum_practice_no_execution')),src(mod('2026-11-01_cruel_mercy_rules'))],['$place=colosseum and colosseum_fight>0, 20번호×4종 종료원인. 노예/조수/주인공.'],['실제 choices에서 disabled 처형과 종료선택을 확인한다.','처형콜백을 직접 호출해 phase/HP/시체/전리품/성향 불변을 확인한다.','옛 phase1 pending캐시를 새 표시로 그린 뒤 종료한다. phase2/3 완료 결과는 재정산하지 않는다.'],['연습 처형은 링크 없는 비활성, 우회호출도 무효.','최신11/01 규칙상 연습 성향0. 기존10/31 MANUAL의+1은 후속 규칙으로 대체됨.','역할별 컷/서술/XP/복귀 유지. 다른place의 오래된양수 colosseum_fight에 연습제한이 번지지 않음.'],rec('colosseum-sparring-fate-20261031','MANUAL_KO.md'),{fixture_gap:'연습역할/옛pending 공개 SAV 없음'});
add('Q241-ARE-003','패배 생사 signed 임계와 즉사 우선','P0',['U04','U07'],[src(mod('2026-10-31_arena_mercy_loss_rule'))],['양무대 정식/캣파이트; 성향−5/−4.5/0/+4.5/+5; 옛loser_rating100. 난수 제어.'],['부상 즉사/생존 KO/도주를 실제 출구에서 실행한다.','중립의 b>valor 경계, 잔혹/자비 강제판정을 확인하고 결과문을 비교한다.'],['실제부상즉사는 자비+5보다 우선. 살아있는패배만 <=−5 처형, >=+5 생존.','새KO 기록+1, 도주/즉사 새KO 없음; 옛100은 환산하지 않음. NPC판정으로 내 성향을 다시 가산하지 않음.'],rec('arena-mercy-loss-rule-20261031','MANUAL_KO.md'));
add('Q241-GRP-001','8그룹 단체컷 단일출력·오류/대조 편성','P0',['U05'],[src(mod('2026-11-01_group_defeat_single_cut'),['конец_боя'])],['검은의사+3/성기사+2/고블린2·3/가르시드+4/탈옥수5/수인4/부랑자5. 단독/미매칭/플레이어패배 대조군.'],['실제 새결과 DOM에서단체IMG1·개별wrapper0·795×596 로드를 센다.','그룹 이미지 실패 onerror를 격리해서 프레임/배경 보존을 확인한다.','성기사 controls 대조와 각종 정상/처형 필터를 비교한다.'],['알려진그룹은 단체1장만, 개별겹침0. 이미지오류는 해당img만 숨김.','else대조군/선택/보상/성향은 원래대로. 옛 저장HTML을 새 결과로 강제 재정산하지 않음.'],rec('group-defeat-single-cut-20261101','MANUAL_KO.md'),{method:'isolated_native_real_renderer_and_DOM',fixture:'TC_06_FOG_GROUP.sav',fixture_gap:'공개 TC06은8그룹 중 검은의사1그룹만 제공'});
add('Q241-COM-001','괴물 성장3단계·아레나 경로/수치 보존','P1',['U05'],[src(mod('2026-10-30_spawn_stage_image_split'))],['young/normal/giant/arena 적ID를 실제 DB로 읽는다.'],['각ID 전신·초상·패배·트로피 경로를 실제 함수로 조회한다.','새전투에서각PNG 로드와원래 능력치/AI/선택상태를 비교한다.'],['young/giant는전용6파일, normal/arena는기존주소.','다른단계/원래 수치가 변하지 않고새전투 DB재호출후 새그림 사용. 이미 저장된HTML의 즉시 갱신까지 보장하지 않음.'],rec('spawn-stage-image-fix-20261030'));
add('Q241-COM-002','무기메시지와 실제 피해 계산 동치','P0',['U05'],[src(mod('2026-10-30_mob_weapon_message_consistency'),['#противники','искусственный_идиот','рассчет_вреда'])],['성기사/킴메르D/리치/쥐인간/늑대인간; 실제 DB·AI·피해계산기를 유지.'],['AI일반13분기의 실제선택을 확인하고 각피해유형/메시지/HP·스태미나·정신력을 검사한다.','늑대인간 비선택특수는 직접계산 대조로 분리한다.'],['성기사검문구; 킴메르D 타격; 리치 전격/화염; 쥐/늑대 참격키 рубящий.','원래피해량/상태효과 보존. 타입교정에 따른 실효피해변화는 승인범위이며 숨은특수AI를 새활성화하지 않음.'],rec('mob-weapon-message-fix-20261030'));
add('Q241-FOG-001','조수 AP 최소2·주인공1행동·교대 중복방지','P0',['U06'],[src(mod('2026-10-28_fog_assistant_ap_cost'),['jo9_fog_relay'])],['조수AP5에서지구력75/55/35, AP1, 반지/반행동/easy/치트/오베레그, 선봉노예 대조.'],['실제 begin→finish 또는 handoff→주인공출구를 실행한다.','finish/settle을 반복하고주인공 행동helper 호출횟수·상태를 비교한다.'],['조수 min(잔여지구력환산,정산전AP−2):5→3/3/1. AP1출전은 허용되고−1가능.','교대없는조수승리에서주인공기존1행동helper1회. 교대후에는기존비용만; 반복정산0, 노예최소1 유지.'],rec('fog-assistant-ap-20261028','MANUAL_KO.md'));
add('Q241-SCORE-001','반점 정규화·기존 정수점수 호환','P0',['U07','U16'],[src(mod('2026-11-01_cruel_mercy_rules'),['jo9_cruel_mercy_apply'])],['기존whole만있는상태와 half−1/0/+1, ±4.5/±5, +/−부호교차.'],['helper입력−2/−1/+1/+2를 순서대로 적용한다.','정수임계 판정과조건편집기 비교값을 합산값으로 비교하고local복원을 확인한다.'],['whole+half/2가정확, half는−1/0/+1,0방향정규화.','옛 정수값을재배율/초기화하지 않음. ±5경계가정확하며 helper외 인물/돈값 불변.'],rec('cruel-mercy-rules-20261101'));
add('Q241-SCORE-002','행동 성공뒤 성향1회·취소/재호출0','P0',['U07'],[src(mod('2026-11-01_cruel_mercy_rules'),['interaction_city','jo9_battle_fate'])],['정식/캣파이트±1;안개행동−0.5/+0.5/도축−1;식품점도축−1;사파리풀어줌+1/판매0/죽임−1/데려감+0.5.'],['각실제완료분기에서성향/돈/대상/생산량을기록한다.','확인창만열기·취소·대상없음·빈슬롯없음·처리비부족·연속40회재호출을확인한다.','같은외형번호의새사파리전리품을다시얻어정상정산여부를확인한다.'],['실제성공시만지정점수1회.','안개강제처형/연습/크라이오/경매/NPC의내인물판정은0;미지정이벤트점수추가없음. 옛완료선택소급0.'],rec('cruel-mercy-rules-20261101'));
add('Q241-SCORE-003','외양간 지연callback 점수·swap 단일실행','P0',['U07'],[src(mod('2026-11-01_cruel_mercy_rules'),['interaction_city','interaction'])],['61131→6007실제지연callback,정상4형태/저항전투/일반전환/뒤로가기.'],['swap완료전후성향과원도시ID소비를확인한다.','성공callback3회재실행·같은화면재표시·다른외양간전환을실행한다.'],['실제swap성공후−0.5한번,인물교환한번.','저항으로전투진입하면0,다른일반전환으로이전61131점수가번지지않음.'],rec('cruel-mercy-rules-20261101'));
add('Q241-ERZ-001','엘자 선택지2·완료기록·구캐시 탈출','P0',['U08','U07'],[src(mod('2026-11-01_erza_editor_choice_visibility')),src(mod('2026-11-01_erza_branches_traits'),['interaction_city','interaction_screen_city'])],['6667792새장면,옛대사만있는캐시,완료기록0/각1;마지막사용자대사그대로.'],['실제anchor2개를각각눌러66677921/22→기존다음객체→menu_form까지진행한다.','같은결과재표시·반대선택재호출·옛완료화면을불러온다.','구공용erza_dead_after참조와사용자가지정한다른이미지를구별해표시보정한다.'],['새본문선택2개·정상복귀;21은erza_dead_after_1및+3,22는_2및−1최초1회.','두결과중어느완료기록이라도있으면재누적0.옛본문은선택지없는상태에서도기존앞/뒤로탈출.','알려진옛공용경로만분기별보정,다른수동이미지/대사보존.'],rec('erza-branches-traits-20261101'),{fixture_gap:'엘자 직전/구결과캐시 공개 SAV 없음'});
add('Q241-ERZ-002','고유엘자6역할 절세미인·명기1회·이름변경','P0',['U08','U09'],[src(mod('2026-11-01_erza_branches_traits'),['jo9_traits_value','jo9_meiki_state'])],['type2624;노예/조수/개인실1~4;경험값0/1/2/3/4,성인나이통과/비통과,known구상태.'],['실제traits refresh/상태갱신을반복해절세미인과외모계산을확인한다.','경험전숨김→경험후발견·기존MSG1회·효과1회·이미발견상태조용한동기화를확인한다.','사용자이름변경과다른인물대조·색정광삭제후상태를검사한다.'],['type으로판별,이름바뀌어도적용.반복파생계산으로능력치누적안됨.','엘자경험전0/1보존,성인조건+경험후미발견만확정발견.다른인물확률유지.색정광을매번재부여하지않음.'],rec('erza-branches-traits-20261101'),{fixture_gap:'6역할 엘자 상태 공개 SAV 없음'});
add('Q241-TRT-001','주문/오베레그 일시공개7조건','P0',['U09'],[src(mod('2026-10-28_revelio_new_traits'),['jo9_traits'])],['야심가/끈기/산만함/옹졸함/너그러움/옛일벌레/안분지족;보유×발견×주문×역할.'],['실제공통list를좌측/중앙/위탁후보에연결하고주문/장착해제를비교한다.','인물23묶음·known/revealed·명기값을검사전후비교한다.'],['보유AND(발견OR주문)만표시;미보유/반대특성없음.','주문끄면미발견은숨김,자연발견은유지.표시조회로영구known/특성/효과변경없음.'],rec('revelio-new-traits-20261028','MANUAL_KO.md'));
add('Q241-TRT-002','통합특성 별칭·충돌정리·효과 중복방지','P0',['U09'],[src(rec('trait-merger-20261025','patch.json'),['jo9_traits','interaction_result'])],['주목욕구별칭/활동양방향/긍정부정5묶음/비표준comfort2/이미동시보유cow·운동광.'],['조회·repair·신규부여·수동감소·카오틱삭제를구분해실행한다.','구저장revision갱신후같은효과/보상호출을반복하고23묶음및돈을비교한다.'],['통합표시/효과/삭제는1번,명확한긍정우선시승인부정값/발견값만정리.','기존허용동시보유/비표준값보존,카오틱900·1회분·대상없음무소모유지.신규일반8칸/칭호/혀손실규칙추가없음.'],rec('trait-merger-20261025','MANUAL_KO.md'));
add('Q241-TRT-003','전체보기 role복귀·MSG/하단설명·넘침','P1',['U09','U13'],[src(rec('trait-overview-ui-20261025','patch.json')),src(W+'/content/js/jo9_traits_view.js')],['공개TC01 기본상태+장문/과다특성/개인실4역할은격리합성.'],['제목/넘침링크→특성상태칭호설명→원래MSG→닫기순으로실제콜백을실행한다.','개인실bridge전후인물·role·하단원문을비교한다.'],['상태우선·3열칭호전용·넘침행반잘림0;짧은목록하단링크없음.','하단설명과MSG가가려지지않고닫으면원래인물/문구복귀;특성생성/효과재실행0.'],rec('trait-overview-ui-20261025','MANUAL_KO.md'),{method:'isolated_native_real_renderer_and_DOM',fixture:'TC_01_HOME_TRAITS.sav'});
add('Q241-CUS-001','위탁 후 stock교체해도 동일인물23묶음 반환','P0',['U10'],[src(mod('2026-10-28_farid_consignment_storage'),['jo9_farid_consignment','interaction_city'])],['새합성천재/ID0포함인물,23묶음문자열·장비·교육·대회이력sentinel.'],['119위탁→다른후보생성/거절로stock교체→상세표시→1191회수를실행한다.','소유슬롯점유·전용보관무효·현금0에서도각회수분기를확인한다.'],['이름ID특성장비식단대회23묶음전부동일한당사자반환.','반환성공확인뒤$5만차감;빈슬롯없음/무효보관은돈·청구보존.현금부족의새차단을만들지않음.'],rec('auction-consignment-fix-20261028','MANUAL_KO.md'),{fixture_gap:'위탁직후/stock교체/ID0 공개 SAV 없음'});
add('Q241-CUS-002','다수위탁·일일정산·대금수령·옛저장','P0',['U10'],[src(mod('2026-10-28_farid_consignment_storage'),['next_day','interaction_city','stock_to_slave_nogt'])],['당일2명위탁·옛보관정보없는위탁액·새위탁과옛채권동시존재.'],['위탁/settle/collect를반복하고money/debt/custody/stock을기록한다.','무효stock획득과상세표시용viewprobe의정리까지확인한다.'],['이전금액은채권으로넘기고가장최근1명만당일회수.일일/수령지급한번.','옛소실인물을현재stock으로추정복구하지않고수수료0;옛대금수령이새위탁/다른stock을지우지않음.'],rec('auction-consignment-fix-20261028','MANUAL_KO.md'));
add('Q241-SAL-001','견적과실지급 상한6000/8000·비대상보존','P0',['U11'],[src(rec('sale-cap-b-20261026','patch.json'),['jo9_traits_value','interaction_city','interaction_result_city'])],['상인/공개경매5999/6000/6001,개인7999/8000/8001;난도·희귀배수·복종감액;옛고액콜백.'],['실제최종견적과매각지급위치를각각실행한다.','옛931/개인결과의고액이박힌확인/결과캐시를표시·진행하고이미완료결과재표시를검사한다.','고정납품/퀘스트/파산급매/환전대조군을확인한다.'],['일반/공개실지급<=6000,개인<=8000.미만원래값과정당한감액유지.','표시조회가거래재실행안함;고액옛확인문구전체갱신보장은없어도실지급guard유효.비대상지급불변.'],rec('sale-cap-b-20261026','MANUAL_KO.md'));
add('Q241-BNK-001','파산자산 단계·재환급·청구회피·계약인물','P0',['U11'],[src(rec('insolvency-simple-flow-20261025','MANUAL_KO.md'),['jo9_liquidation'])],['공개TC05 50000청구;장식/이주/노예/조수전체.시설/계약인물은추가합성상태.'],['실제begin→view→자산처분→다음단계및반복선택을실행한다.','직접방법찾기로나갔다복귀/날짜진행을시도한다.','이주후집시설입주자소유관계/관련계약실패표식을비교한다.'],['이미처분자산재환급0,최종청구차감1회.미해결청구유지·날짜회피불가.','길드소유계약인물에매각대금없음,시설입주자정리와안내일치.50000TC는끝에파산엔딩.'],rec('full-prezip-20261101','native-historical-report.json'),{fixture:'TC_05_BANKRUPTCY_CHAIN.sav'});
add('Q241-BIL-001','다진육0의안심살/처녀육 결산표시·reset','P0',['U12'],[src(mod('2026-10-30_meat_production_report'),['billing'])],['decade_mince=0,meat만/virgin만/달걀+meat/모두0/혼합;냉장고용량경계.'],['실제61135획득→기간billing생산팝업→회계본문→원래reset을잇는다.','생산총량/실제재고/비용을각각비교하고재표시한다.'],['안심살/처녀육단독도생산팝업·육류행표시,모두0은불필요팝업없음.','획득량비용재고산식및원래reset주기불변.용량으로재고가덜들어가는기존규칙은생산누락으로오분류하지않음.'],rec('fog-meat-accounting-fix-20261030'),{fixture_gap:'기간결산직전 육류단독 공개 SAV 없음'});
add('Q241-AGR-001','과일/와인 상시구매·잔액경계·오래된링크','P0',['U12'],[src(mod('2026-10-30_agrabah_special_food'),['#options','interaction_city'])],['gold24/25/50,sparks249/250;퀘스트없음/있음/기구매;공개TC04기반.'],['실제메뉴→소형과일반복구매·와인구매를실행한다.','메뉴표시뒤잔액을바꾼오래된선택지를재호출한다.','연회대량상품의기존퀘스트/일회조건과툴팁을확인한다.'],['과일금화25우선,부족시스파크250;와인금화25만.성공마다해당재고+1.','잔액부족음수결제/무료재고0;연회는계속기존조건.구매로퀘스트단계자동진행없음.'],rec('agrabah-special-food-20261030'),{fixture:'TC_04_AGRABAH_FRUIT.sav'});
add('Q241-AGR-002','특수재고 분리·주방없음·옛플래그 호환','P0',['U12'],[src(mod('2026-10-30_agrabah_special_food'),['master_stat'])],['기존구매플래그1·새재고0,주방없음양수재고,fridge11개sentinel.'],['실제식품저장고를출력하고거래전후새fruit/wine과일반fridge/용량을비교한다.','격리출력SAV에서신규배열을읽고재로드해서표시한다.'],['옛구매플래그를수량으로추정이관하지않음.주방없어도보유재고2행표시.','일반식사/열량/자동구매/창고용량불변,재고는정확저장·복원.'],rec('agrabah-special-food-20261030'),{fixture:'TC_04_AGRABAH_FRUIT.sav'});
add('Q241-ROM-001','개인실2 자아성장 대상·상한·빈방','P0',['U13'],[src(mod('2026-11-01_room2_ego_growth'),['next_day'])],['room2만존재,room1+2,4방동시;ego2/3;빈방/사망/기절.'],['실제4방성장블록과전체하루진행을구분해실행한다.','room1_rate/room2_rate각ego증분및다른항목을전후비교한다.'],['조건이충족된room2 ego<3만room2_rate+1,room1에오지급없음.','상한/빈방/사망/기절에지급없음,다른성장불변.과거잘못누적치는소급추정수정안함.'],rec('room2-ego-growth-20261101'),{fixture_gap:'개인실2 단독/4방성장 공개 SAV 없음'});
add('Q241-NPC-001','줄리아/조니5참조·옛중간캐시·재생성없음','P1',['U14'],[src(mod('2026-10-28_julia_meeting_npc_images'),['interaction_city','$ongload'])],['event163장면별Julia/Johanna와알려진옛NPC/action캐시;다른NPC대조.'],['실제장면renderer와로드꼬리GT를실행한다.','인물23묶음/기존진행/소유상태를전후비교한다.'],['장면별정확NPC그림.알려진옛참조만표시교정,인물생성분기재진입0.','별도nativeOPENGAME실패를실제GUI로드PASS로바꾸지않음.'],rec('julia-meeting-images-20261028'),{fixture_gap:'재회전/옛중간상태 공개 SAV 없음'});
add('Q241-NPC-002','소문제공자 아이콘·옛결과무과금재표시','P1',['U14'],[src(mod('2026-10-28_rumor_provider_icons')),src(mod('2026-10-28_rumor_guild_fallback'))],['스컵스/바텐더/아네스;옛barman/anes결과;소문장수/토큰/가격sentinel.'],['소문듣기/이전/다음실제메뉴와ongload꼬리view를실행한다.','현재결과재표시와새구매를분리해돈/추천/토큰을비교한다.'],['services/preferencesbar/anes아이콘을각제공자에사용.','기존결과재표시는view만,consult/buy/scan0·추가과금0.길드재매입힌트는가격비노출.'],rec('rumor-provider-icons-20261028'));
add('Q241-NPC-003','웡항의 실제하단문구·재범결말','P1',['U14'],[src(mod('2026-10-30_wong_guild_notice_text'),['end_day_screen'])],['질병1/3,감염첫경고1/3,동시,재범결말;실제동적함수0번슬롯정상초기화.'],['실제end_day_screen항의→다음객체를실행하고하단DOM/제재상태를기록한다.','재범에서원래death→exit를실행한다.'],['준비된1/2/3문구가0번출력에모이고추가안내가패널밖으로빠지지않음.','기존평판/카운터/방문/결말조건불변.안젤리카/매일재방문제보까지고쳤다고확대하지않음.'],rec('wong-guild-dialogue-fix-20261030','MANUAL_KO.md'),{fixture_gap:'웡기간종료 항의 공개 SAV 없음'});
add('Q241-UI-001','참고정보 시작위치·긴이름/본문·특수칸분리','P1',['U14'],[src(mod('2026-11-01_reference_panel_spacing')),src(W+'/css/base.css')],['엘리자베스/바이너/웡/모르게레나/상류신사모임;공백BR/NBSP/태도만/빈본문.'],['실제도시경로→정보창에서본문첫glyph/끝glyph를측정한다.','링크/문단/서식·이름/부제와파산회계/소문안내/암시장별도속성표를비교한다.'],['기본네이티브기준첫글자Y206,20px/25px,385×585영역내.참고정보제목/독립콜론제거.','내부문단/실제문구/사용자편집보존;특수회계칸좌표미변경.다른창크기픽셀보장은별도.'],rec('reference-panel-spacing-20261101'),{method:'isolated_native_real_renderer_and_DOM'});
add('Q241-CUT-001','조건판정 AND·반점·경계·B우선·원래선택보존','P0',['U16'],[src(mod('2026-11-01_image_cut_conditions_core'),['interior_change','slave_stat','assistant_stat','trophy_room_screen','#options','jo9_liquidation'])],['WORK격리사본에만합성조건설정;bg/characters/scene가족A/B/C. Full은대조군이며동기화안함.'],['반점−10~10·보유금0/경계/2147483647·계급0~5·평판0~5·AND충족/하나불충족을실행한다.','B/C동시충족·파일없음·기존수동무조건컷·조건미충족이전선택·A없음·mode0/1/2를확인한다.','집/전투수동전환제외와직접renderer10곳의원래HTML을통과시킨다.'],['경계포함·정확단계일치·작은컷번호우선·실제존재파일만표시.','조건없으면원래HTML/수동선택유지.불충족조건컷은수동후보에서도제외.이미표시된그림을타이머로강제변환안함.','원래스타일/버튼/레이어보존,이미지수명SCN001회귀유지.'],rec('image-cut-conditions-20261101'),{target:'WORK_only',method:'isolated_native_real_renderer_and_DOM'});
add('Q241-CUT-002','조건편집 저장/다시읽기·가족보존·충돌거부','P0',['U16'],[src(rec('image-cut-conditions-20261101','MANUAL_KO.md')),src(R+'/tools/text-workshop/image-cut-conditions.cjs')],['실제WORK서버저장금지.기존도구모듈을읽어격리임시서버/임시QSP로실행.'],['한가족저장→다시읽기→해제→다른가족보존을확인한다.','열린이후QSP변경후옛해시save·잘못된범위/중복컷/다른가족/없는파일/외부·연결경로를요청한다.','변경없는저장과조건전체해제뒤공통core를확인한다.'],['기존transact로백업/전후해시검증;충돌은덮어쓰지않고입력유지;다른조건·본문보존.','해제는그림삭제아님,조건0이면설정8블록만제거하고공통함수유지.실제WORK/Full/개인SAV쓰기0.'],rec('image-cut-conditions-20261101'),{target:'WORK_tool_in_isolation_only',method:'isolated_HTTP_UI_contract'});
function human(id,title,priority,update_ids,fixture,steps,expected_result,sources,minutes){add(id,title,priority,update_ids,sources,['Full2.4.1을완전히종료후 게임 실행.cmd로재실행.각항목은지정공개TC를다시불러온다.','공개TC는읽기전용입력으로사용하고덮어저장하지않는다.2.4.0생성본의정상업데이트알림과실제오류를구분한다.'],steps,expected_result,null,{owner:'human',target:'Full_2.4.1_visual_play',method:'human_GUI_and_visual_judgment',fixture,estimated_minutes:minutes,evidence:{state:'human_not_executed',independentCurrentEnginePass:false,previousReports:[],previousEvidenceIsNotCurrentPass:true}});}
human('Q241-H01','실행·버전·감사와새게임화면','P1',['U01'],null,['배포루트의 게임 실행.cmd로시작한다.창제목과제작진감사를연다.','새게임첫화면과Game→Load메뉴가열리는지확인한다.'],['2.4.1표시와PSP_PSP/zonezizone/콤콤삼촌감사항목을읽을수있음.','글자/링크가잘리거나진입직후진행불능없음.'],[src(rec('build-2.4.1-20261101','PLAYTEST_KO.md'))],2);
human('Q241-H02','캣파이트결과후목욕·요리·청소','P0',['U02','U03'],'TC_03_CATFIGHT_VICTORY.sav',['처형→오른쪽엄지→결과문/상금100/잔액→클럽복귀순으로진행한다.','같은세션에서집으로가목욕·주인공요리·청소를각각시작한다.','같은TC를다시불러와살려주기결과도비교한다.'],['처형/생존의서로다른컷,상금100과성장안내한페이지.','생활장면에이전경기컷이남지않음.장면전체·앞/뒤버튼·하단문구가제대로보임.','반복넘김으로보상/승수다시증가없음.'],[src(rec('catfight-image-leak-20261101','REPORT_KO.md'))],7);
human('Q241-H03','현재이름·좌하단행동·무기효과·기록','P0',['U03','U05'],'TC_02_CATFIGHT_INTRO.sav',['소개에서현재노예이사벨라의이름을읽고다음으로전투에진입한다.','행동과무기기술을선택해2~3턴진행하고긴전투기록을스크롤한다.'],['옛에게야소개이름/빈참가자패널없음.','좌하단행동·우하단무기·기록·타격이프레임밖으로벗어나거나겹치지않음.로그끝글자읽을수있음.','포커스를바꾸면사라지는검은잔상은별도D15로기록.'],[src(rec('build-2.4.1-20261101','PLAYTEST_KO.md'))],5);
human('Q241-H04','안개단체컷한장·전투틀·적이미지','P0',['U05','U06'],'TC_06_FOG_GROUP.sav',['준비안내에서주인공또는조수를출전시킨다.적초상을바꾸고공격/피격을본다.','승리후결과와복귀까지진행한다.'],['검은의사+하인들이보이고승리결과는단체패배그림한장.','개별패배그림겹침·잠깐다른프레임·타격때틀이동없음.이미지자체의절단/부자연스러운구도는캡처로기록.'],[src(rec('group-defeat-single-cut-20261101','MANUAL_KO.md'))],6);
human('Q241-H05','특성전체보기·하단설명·역할복귀','P1',['U09','U13'],'TC_01_HOME_TRAITS.sav',['노예와조수정보에서특성제목을눌러전체보기를연다.','특성/상태/칭호를각1개누르고하단설명을읽는다.등급도움말MSG를열고닫은뒤전체보기도닫는다.','가능한역할복장을바꾸고개인실에갔다돌아온다.'],['목록끝/3열칭호와하단설명을가리지않음;MSG가전체보기뒤에갇히지않음.','닫으면원래인물/문구,복장은해당역할에맞음.다른인물로바뀌거나메뉴작동중단없음.'],[src(rec('trait-overview-ui-20261025','MANUAL_KO.md'))],5);
human('Q241-H06','금화·과일/와인툴팁·식품저장고','P1',['U12'],'TC_04_AGRABAH_FRUIT.sav',['발삼상점환전화면의보유금화를본뒤뒤로가작은과일을2번산다.','와인상점에서소형와인을사고각아이콘툴팁을띄운다.','집의식품저장고에서신선한과일·아그라바와인수량과목록끝을본다.'],['결제통화/보유금화/구매수량이일치하고두특수재고행이잘리지않음.','연회주문은의뢰/기구매/자금조건안내가있음.'],[src(rec('agrabah-special-food-20261030','REPORT_KO.md'))],5);
human('Q241-H07','파산청구전체흐름·나갔다복귀','P0',['U11'],'TC_05_BANKRUPTCY_CHAIN.sav',['장식처분→빈민가이주→노예급매→조수급매순으로제시항목을진행한다.','TC를다시불러와직접방법을찾는다로나갔다다시정산화면에돌아온다.'],['처분내역/시설/인물상태가안내와맞고중복수입없음.','미해결청구가사라지지않고일일진행으로회피되지않음.50000시험청구의최종파산엔딩은예정결과.'],[src(rec('full-client-build-20261031','build-test-saves.cjs'))],7);
human('Q241-H08','에게야도전·전신·글라디우스·종료','P1',['U05'],'TC_07_EGEYA_EVENT.sav',['도전을수락하고전투에서에게야전신과공격대사를확인한다.','전투종료후다음화면으로진행한다.'],['붉은배경만남지않고전투전신표시.글라디우스와모순되는톱니채찍문구없음.','빈화면/진행불능/잘못된캐릭터컷이없음.'],[src(rec('egeya-gladius-20261029','REPORT_KO.md'))],5);
// Keep the human handoff readable and independent of the detailed engine matrix.
const humanCopy={
 'Q241-H01':{title:'실행·버전·감사와 새 게임 화면',steps:['배포 루트의 게임 실행.cmd로 시작한다. 창 제목과 제작진 감사를 연다.','새 게임 첫 화면과 Game → Load 메뉴가 열리는지 확인한다.'],expected_result:['2.4.1 표기와 PSP_PSP / zonezizone / 콤콤삼촌 감사 항목을 읽을 수 있다.','글자·링크가 잘리거나 진입 직후 진행이 멈추지 않는다.']},
 'Q241-H02':{title:'캣파이트 결과 후 목욕·요리·청소',steps:['처형 → 오른쪽 엄지 → 결과문·상금 $100·잔액 → 클럽 복귀 순으로 진행한다.','같은 세션에서 집으로 가 목욕·주인공 요리·청소를 각각 시작한다.','TC를 다시 불러와 살려주기 결과도 비교한다.'],expected_result:['처형·생존은 서로 다른 컷이며 상금 $100과 성장 안내가 한 페이지에 나온다.','생활 장면에 이전 경기 컷이 남지 않는다. 장면·앞뒤 버튼·하단 문구가 제대로 보인다.','반복 넘김으로 보상·승수가 다시 증가하지 않는다.']},
 'Q241-H03':{title:'현재 이름·행동·무기 효과·기록',steps:['소개에서 현재 노예 이사벨라의 이름을 읽고 다음으로 전투에 진입한다.','행동·무기 기술을 선택해 2~3턴 진행하고 긴 전투 기록을 스크롤한다.'],expected_result:['옛 에게야 소개 이름이나 빈 참가자 패널이 없다.','좌하단 행동·우하단 무기·기록·타격이 프레임 밖으로 벗어나거나 겹치지 않는다. 로그 끝 글자를 읽을 수 있다.','포커스를 바꾸면 사라지는 검은 잔상은 별도 D15로 기록한다.']},
 'Q241-H04':{title:'안개 단체 컷 한 장·전투 틀·적 이미지',steps:['준비 안내에서 주인공 또는 조수를 출전시킨다. 적 초상을 바꾸고 공격·피격을 본다.','승리 후 결과와 복귀까지 진행한다.'],expected_result:['검은 의사와 하인들이 보이고 승리 결과는 단체 패배 그림 한 장이다.','개별 패배 그림 겹침·순간적인 다른 프레임·타격 때 틀 이동이 없다. 그림의 절단·부자연스러운 구도는 캡처한다.']},
 'Q241-H05':{title:'특성 전체보기·하단 설명·역할 복귀',steps:['노예·조수 정보에서 특성 제목을 눌러 전체보기를 연다.','특성·상태·칭호를 각 1개 눌러 하단 설명을 읽는다. 등급 도움말 MSG를 열고 닫은 뒤 전체보기도 닫는다.','가능한 역할 복장을 바꾸고 개인실에 갔다 돌아온다.'],expected_result:['목록 끝·칭호 열·하단 설명이 가려지지 않는다. MSG가 전체보기 뒤에 갇히지 않는다.','닫으면 원래 인물·문구로 돌아온다. 역할에 맞는 복장이 나오고 메뉴가 계속 동작한다.']},
 'Q241-H06':{title:'금화·과일/와인 툴팁·식품 저장고',steps:['발삼 상점 환전 화면의 보유 금화를 본 뒤 뒤로 가 작은 과일을 2번 산다.','와인 상점에서 소형 와인을 사고 각 아이콘 툴팁을 띄운다.','집의 식품 저장고에서 신선한 과일·아그라바 와인 수량과 목록 끝을 본다.'],expected_result:['결제 통화·보유 금화·구매 수량이 일치하고 두 특수 재고 행이 잘리지 않는다.','연회 주문에는 의뢰·기구매·자금 조건 안내가 있다.']},
 'Q241-H07':{title:'파산 청구 전체 흐름·나갔다 복귀',steps:['장식 처분 → 빈민가 이주 → 노예 급매 → 조수 급매 순으로 제시 항목을 진행한다.','TC를 다시 불러와 직접 방법을 찾는다로 나갔다가 정산 화면에 돌아온다.'],expected_result:['처분 내역·시설·인물 상태가 안내와 맞고 중복 수입이 없다.','미해결 청구가 사라지지 않고 날짜 진행으로 회피되지 않는다. $50,000 시험 청구의 최종 파산 엔딩은 예정 결과다.']},
 'Q241-H08':{title:'에게야 도전·전신·글라디우스·종료',steps:['도전을 수락하고 전투에서 에게야 전신과 공격 대사를 확인한다.','전투 종료 후 다음 화면으로 진행한다.'],expected_result:['붉은 배경만 남지 않고 전투 전신이 보인다. 글라디우스와 모순되는 톱니채찍 문구가 없다.','빈 화면·진행 중단·잘못된 캐릭터 컷이 없다.']}
};
for(const t of cases.filter(t=>t.owner==='human')){
 Object.assign(t,humanCopy[t.id]);
 t.preconditions=['Full 2.4.1을 완전히 종료한 뒤 게임 실행.cmd로 재실행한다. 각 항목은 지정 공개 TC를 다시 불러온다.','공개 TC는 읽기 전용 입력으로 사용하고 덮어저장하지 않는다. 2.4.0 생성본의 정상 업데이트 알림과 실제 오류를 구분한다.'];
}
for(const t of cases){
 if(t.id==='Q241-CAT-002')t.evidence.previousReports=[rec('catfight-prize-page-20261031','green-report.json')];
 if(t.id==='Q241-CAT-003')t.evidence.previousReports=[rec('catfight-loss-watch-cuts-20261031','full-release-report.json')];
}
const fixtureGaps=[
 {id:'G01',cases:['Q241-ARE-001','Q241-ARE-002','Q241-ARE-003'],need:'정식 단계 1/9 양 승리·3역할 연습 직전·패배 생사 3종',trigger:'정식 1294/1291~1293, 연습 1296~1298, phase1 옛 pending',reason:'TC02/03은 캣파이트이므로 콜로세움 수동 분기를 대표하지 않는다.'},
 {id:'G02',cases:['Q241-CUS-001','Q241-CUS-002'],need:'위탁 당일·stock 교체 후·다수 위탁·옛 전용 보관 없음',trigger:'잡파 119 → 1191/1193',reason:'공개 TC 7개에 위탁 상태가 없다.'},
 {id:'G03',cases:['Q241-ERZ-001','Q241-ERZ-002'],need:'엘자 사망 선택 직전/양 완료 옛 캐시·6역할 경험 전후',trigger:'6667792 → 66677921/22, 기존 상태 갱신',reason:'공개 TC 7개에는 type2624·해당 퀘스트 상태가 없다.'},
 {id:'G04',cases:['Q241-ROM-001'],need:'개인실 2만 입주, ego2와 성장치 sentinel, 4방 동시',trigger:'하루 진행 next_day',reason:'TC01은 정보 UI 표본이며 성장 지급 대상을 증명할 표본이 아니다.'},
 {id:'G05',cases:['Q241-BIL-001','Q241-NPC-003'],need:'육류 단독 기간 결산 직전·웡 항의/재범 직전',trigger:'billing / end_day_screen',reason:'실제 팝업 순서·줄바꿈·종료까지 육안 검증이 필요하다.'},
 {id:'G06',cases:['Q241-SAL-001'],need:'실제 평가 6000/8000 경계와 옛 고액 확인 화면',trigger:'상인/공개경매/개인 고객의 최종 판매 확인',reason:'TC05 급매는 일반 판매 상한 대상이 아니다.'},
 {id:'G07',cases:['Q241-SCN-002','Q241-CAT-003'],need:'캣파이트 관람 2페이지와 노예 치명상 생존/처형/즉사',trigger:'103002/103003/103004 및 관람 2페이지',reason:'TC03은 플레이어 승리 결과만 제공한다.'},
 {id:'G08',cases:['Q241-RES-003','Q241-NPC-001'],need:'3021~3026 정보·줄리아 재회 5장면·옛 중간 캐시',trigger:'각 인물 프로필 / event163',reason:'인코딩과 NPC 그림을 사람이 바로 볼 공개 재현 상태가 없다.'},
 {id:'G09',cases:['Q241-CUT-001','Q241-CUT-002'],need:'WORK 격리 A/B/C 조건 샘플과 경계별 합성값',trigger:'/catalog 조건 창 → 격리 QSP 실행 후 해당 그림 재출력',reason:'Full 미포함 WORK 전용 기능이다. 실제 사용자 WORK에 시험 조건을 저장하지 않는다.'}
];
const unresolved=[
 {id:'D-WORKSHOP',state:'held_unfixed',title:'워크숍·Show HTML 불러오기 실패',source:rec('full-prezip-20261101','QUESTIONS_DEFERRED_KO.md'),action:'수정목록유지;이번PASS집계제외'},
 {id:'D-FOCUS',state:'cause_unconfirmed_unfixed',title:'포커스변화시사라지는검은UI잔상',source:rec('ui-focus-repaint-20261028','REPORT_KO.md'),action:'컷신상태초기화수정과구분;엔진문제해결주장금지'},
 {id:'D-BRAND',state:'awaiting_actual_reproduction',title:'마법낙인이벤트제보',source:rec('full-prezip-20261101','QUESTIONS_DEFERRED_KO.md'),action:'공개TC7개로재현했다고주장하지않음'},
 {id:'D-PREG',state:'report_not_reproduced_no_fix',title:'개인실장기임신제보',source:rec('private-pregnancy-integration-20261028','REPORT_KO.md'),action:'확률/발견조건임의변경없음;실제제보재현미확정'},
 {id:'D-BALANCE',state:'explicitly_deferred',title:'통합난도·추가칭호·혀손실연계·QSP리팩터링',source:rec('full-prezip-20261101','QUESTIONS_DEFERRED_KO.md'),action:'현재승인규칙만시험;새밸런스/제약추가안함'},
 {id:'R-MOB',state:'historical_unfixed_candidates_current_recheck_needed',title:'미친대마법사AI/특수공격선택/상태키HTML/정신력패배문구',source:rec('mob-weapon-message-fix-20261030','REPORT_KO.md'),action:'14필드수정완료와분리;현재소스재현전새확정버그로세지않음'},
 {id:'R-ANGELICA',state:'historical_unfixed_candidate_current_recheck_needed',title:'안젤리카항의text슬롯·웡매일재방문제보',source:rec('wong-guild-dialogue-fix-20261030','MANUAL_KO.md'),action:'웡표시수정의해결범위아님.참조된dialogue-slot-mismatch-audit폴더는현경로없음.'},
 {id:'R-DOC',state:'confirmed_stale_document',title:'연습성향+1옛매뉴얼과최신0규칙충돌',source:rec('colosseum-sparring-fate-20261031','MANUAL_KO.md'),superseded_by:rec('cruel-mercy-rules-20261101','REPORT_KO.md'),action:'TC기대는최신0.이번감사에서게임/문서수정은하지않음.'}
];
for(const t of cases){t.evidence.previousReports=t.evidence.previousReports||[];t.evidence.previousEvidenceIsNotCurrentPass=true;}
for(const u of updates)if(!fs.existsSync(u.record))throw Error('Missing inventory source '+u.record);
const missingSources=[];for(const t of cases)for(const s of t.source_refs)if(!fs.existsSync(s.path))missingSources.push({id:t.id,path:s.path});
// Previous report filenames are evidence pointers and can be stale; expose rather than invent their existence.
const missingPriorReports=[];for(const t of cases)for(const p of t.evidence.previousReports||[])if(!fs.existsSync(p))missingPriorReports.push({id:t.id,path:p});
snapshot.missingSourceRefs=missingSources;snapshot.missingPriorReports=missingPriorReports;
snapshot.verification={hashesMatch:Object.values(snapshot.qsp).every(x=>x.hashMatches),publicFixturesMatch:snapshot.publicFixtures.every(x=>x.manifestHashMatches),uniqueIds:new Set(cases.map(x=>x.id)).size===cases.length,sourceChecksPass:snapshot.sourceChecks.every(x=>x.pass),cases:cases.length,autoCases:cases.filter(x=>x.owner==='auto').length,humanCases:cases.filter(x=>x.owner==='human').length};
const plan={schema_version:'1.0',audit_date:'2026-11-01',language:'ko',scope:{kind:'independent_QA_plan_and_read_only_inventory',engine_runs_this_subtask:0,private_save_access:false,full_sync_authorized:false,zip_commit_push_authorized:false,expected_qsp:expected,intentional_difference:'WORK image-cut-conditions core/tool only; 6 changed locations'},status_semantics:{not_run_this_audit:'기존보고를참고해설계했으나최신입력에서이번독립감사실행아님',independent_snapshot_checked_engine_not_run:'현재파일해시/지정소스확인만완료;엔진PASS아님',human_not_executed:'사용자GUI/육안플레이미실행'},update_inventory:updates,public_fixtures:snapshot.publicFixtures,test_cases:cases,manual_fixture_gaps:fixtureGaps,known_held_and_followup:unresolved,evidence_rules:['기존개발자PASS는이번독립실행PASS로승격하지않는다.','최종renderer대체시험은정산상태증거이며화면/이미지수명증거가아니다.','301판정은imagesRendered=false.후속163DOM판정은91판정을포함하므로합산하지않는다.','공개TC7개해시/존재확인은GUI불러오기/CRC호환PASS아니다.','피드백은TCID·입력해시·실제트리거·기대/실제·재현횟수·스크린샷/상태차이·격리여부로작성한다.']};
fs.writeFileSync(out+'/source_snapshot.json',JSON.stringify(snapshot,null,2)+'\n');
fs.writeFileSync(out+'/tc.json',JSON.stringify(plan,null,2)+'\n');
const h=cases.filter(t=>t.owner==='human');
const md=[
'# 2.4.1 독립 QA 시험 계획',
'',
'현재 WORK `78835089…` / Full `f87363c3…`, 각 277 loc를 직접 읽었다. 두 파일의 차이는 이미지 등장조건 core가 연결된 6 loc뿐이다. 이 차이는 WORK 전용 승인 범위다. 공개 TC 7개는 Full/game/save에만 있고 현재 해시는 제작 manifest와 모두 일치한다.',
'',
'이 하위 작업은 엔진을 실행하지 않았다. tc.json의 과거 보고서는 설계 근거이며 이번 감사의 PASS가 아니다. 최신 실행 결과는 루트 QA의 별도 증거와 결합해야 한다. 개인 SAV·게임 파일·배포 폴더·ZIP·Git은 변경하지 않았다.',
'',
'## 자동 검사 우선순위',
'',
'|순서|TC|반드시 확인할 경계|',
'|---|---|---|',
'|1|REL-001, SCN-001/002, CAT-001~003|최신 입력 식별, 실제 결과 렌더러·앞으로가기 유지, 다음 행동의 이전 컷 부재, 정상 두 페이지 보존, 중복 지급/게임오버|',
'|2|ARE-001~003, GRP-001, FOG-001|가변상금×2, 연습 처형 우회 차단·성향0, 부상즉사 우선, 단체1장·개별wrapper0, 조수 비용·교대|',
'|3|CUS-001/002, SAL-001, BNK-001, BIL-001, AGR-001/002, ROM-001|인물23묶음 보존, 재호출/구캐시, 실지급 상한, 청구회피, 다진육0, 잔액 경계, 방2 지급대상|',
'|4|SCORE-001~003, ERZ-001/002, TRT-001~003|반점/±5, 실제 성공 뒤1회, 지연 callback, 결과완료 공통기록, 6역할·별칭·일시공개|',
'|5|RES-001~003, COM-001/002, NPC-001~003, UI-001|호환주소, 신규등록, 실제 JSON로더, 단계별 PNG, 실제 피해계산, NPC/문구/본문 영역|',
'|6|CUT-001/002|WORK 격리사본 전용. AND/경계/B우선·기존선택보존·해시충돌거부. 실제 WORK 서버에 시험 조건 저장 금지|',
'',
'상세한 사전 상태·절차·기대 결과·소스·담당은 `tc.json`의 안정 ID `Q241-*`를 사용한다. 자동 '+snapshot.verification.autoCases+'개, 사람 '+h.length+'개로 구성했다. 엔진은 한 번에 한 개만 실행한다.',
'',
'## 사람이 직접 확인할 짧은 순서',
'',
'Full을 완전히 종료한 뒤 배포 루트의 **게임 실행.cmd**로 시작한다. 세이브 위치는 `G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/save`다. 매 항목은 원래 공개 TC를 새로 불러오고 덮어저장하지 않는다. 이전 버전에서 만든 TC의 정상 업데이트 안내는 실제 오류와 구분한다. 8개 총 약 '+h.reduce((n,t)=>n+t.estimated_minutes,0)+'분이며 P0부터 해도 된다.',
'',
'|ID/우선|파일·바로 누를 동작|눈으로 판단할 결과|',
'|---|---|---|',
...h.map(t=>'|'+t.id.replace('Q241-','')+' '+t.priority+'|'+(t.fixture||'세이브 없음')+'<br>'+t.steps.join('<br>')+'|'+t.expected_result.join('<br>')+'|'),
'',
'실패 제보는 **TC ID / 누른 메뉴 / 기대와 실제 / 반복 여부 / 화면 캡처**만 먼저 남기면 된다. 포커스를 다른 창으로 옮겼을 때 사라지는 검은 잔상과, 생활장면에 실제 이전 컷 PNG가 다시 나오는 현상은 따로 기록한다.',
'',
'## 없는 공개 재현 상태',
'',
'아래는 기존 TC로 즉시 확인할 수 없다. 개인 SAV를 대신 읽거나 시험 완료로 표시하지 않는다. 필요하면 새 init_game에서 최소 합성 fixture를 준비한 뒤 사람에게 넘긴다.',
'',
'|구분|필요한 상태·정확한 트리거|이유|',
'|---|---|---|',
...fixtureGaps.map(g=>'|'+g.id+'|'+g.need+'<br>'+g.trigger+'|'+g.reason+'|'),
'',
'## 미해결·보류와 근거 한계',
'',
'- 워크숍·Show HTML 실패, 마법낙인 실제 재현, 포커스 검은 잔상, 장기 개인실 임신 제보는 해결 완료가 아니다. 난도·추가 칭호·혀 손실·QSP 리팩터링 보류를 유지한다.',
'- 과거 301판정은 `imagesRendered=false`이며 결과 renderer를 대체했다. 이번 이미지 수명 보증에 재사용하지 않는다. 후속 163 DOM 판정에는 91 native 판정이 포함되어 합산하지 않는다.',
'- 10/31 연습 매뉴얼의 성향 +1은 11/01 최신 지정행동 규칙의 **연습 0**으로 대체됐다. TC 기대도 0이다. 문서 불일치는 확인했으며 이 작업에서 문서를 고치지는 않았다.',
'- MOB 무기 수정 보고에 남은 대마법사 AI·특수공격 선택·상태 키 HTML·정신력 패배 문구와, 웡 매뉴얼의 안젤리카 슬롯/매일 재방문은 후속 조사 후보다. 현재 독립 재현 전 새 확정 결함으로 세지 않는다. 웡 매뉴얼이 가리킨 dialogue-slot-mismatch-audit 폴더는 현 위치에 없다.',
'- 3021~3026 설명 인코딩은 정적 보존검사와 실제 인물 로더/시각 검사를 분리한다. 이전 미완료 120개 예정 검증문은 통과 수가 아니다.',
'',
'근거: `source_snapshot.json`(직접 읽은 해시/6 loc 차이/공개 TC/좁은 소스 확인), `tc.json`(변경 인벤토리·소스·46개 세부 TC·이전 근거 상태), `make_plan.cjs`(원본을 읽기만 하는 재생성 스크립트).',
''
];
fs.writeFileSync(out+'/TC_PLAN.md',md.join('\n'));
console.log(JSON.stringify({out,...snapshot.verification,missingSources,missingPriorReports,authorizedWorkOnlyDiff:snapshot.onlyAuthorizedWorkOnlyLocationsDiffer}));
