# 2.4.2 Full Girls·캐릭터 이미지 변경 이력 감사

2026-11-13. WORK/Full/개인 SAV/음원/원고/이미지/게임코드를 수정하지 않고 기록과 현재 메타데이터를 대조했다. 전체 바이너리 SHA·소스 복사는 부모 Q04를 재사용했다. 출력은 본 문서와 girls-history-audit.json 두 파일뿐이다.

기존 이미지·사운드140행 전부를 개별 보존·범위분류했다. 요약에 [object Object]가 있는 68행은 구조화 상세/로컬로그를 연결했다. 보완항목·실제저장·프레임그룹 포함 188항목이다.

## 핵심 누락·정정

- 로컬 캐릭터 실제 save23건/15번호를 확인했다. H293/294의 펠리시티·엘자 외 뱀피렐라·야즈민·줄리아·춘향·레이첼·베네라2번호·스네구로치카·자스민·샤크티·다이아나·스네자나 그림/경로와 야기슈나2339 JSON후속을 보완했다. 원고 원문은 복제하지 않았다.
- 초상 portrait-frame33건/33파일/11그룹이11/11~13실제저장됐다. 설치시험의 미리보기취소/PNG0 뒤 사용자 작업이며 현재부모SHA=이벤트after는 33개다.
- 1031은 전용617장면·72의상조건 정상조회 조사이며 실제변경은 체크리스트 구/신 역할키 오경고다. 플레이제보화면 미재현이다.
- 시루7기준/7옛주소KEEP→도미나수동교체→소스보존→옛도미나1주소임시복구를 순서대로 기록했다. D21검증전 정리하지 않는다.
- 옛9부재는 일반구초상4(이관미결),미배포Gloria옛4(복구제안철회),구2339.json(현재2339_yagisuna와 동시활성배포금지)로 구분했다.
- 초상108=93크롭+테두리전용15,테두리90중75중복. 원본B컷238/48쌍추가/호환·용도사본/UI별칭을 신규그림제작수로 세지 않는다.

## 보완 전후 원장

| ID | 변경 | 이전 | 이후·현재상태 | 기존원장·보완 | 근거 |
|---|---|---|---|---|---|
| G01 | 전용폴더·공용역할 규칙 | 전용/공용경로와파일명혼동가능. | 전용은girls/full/<번호>·girls/face/<번호>·girls/sex_scenes/<번호>.전용없으면옷입은title=characters,알몸=girls/full,하녀=cloth또는maid,비서=secretary,도미나=mistress.파일명강제/자동이동/연결해제없이경고만. / 도구반영;PNG/JSON/QSP변경0 | H136 / Full의Girls설명에서전용3폴더와공용역할폴더구분. | [REPORT_KO.md](<G:/somi/JO9sa/records/character-path-rules-20261109/REPORT_KO.md>) [IMAGE_NAMING_RULES_KO.md](<G:/somi/JO9sa/docs/modding/IMAGE_NAMING_RULES_KO.md>) [AGENTS.md](<G:/somi/JO9sa/AGENTS.md>) |
| G02 | 1031 조사와체크리스트수정 분리 | 실제플레이이미지미표시제보. | 조사:90계열617전용PNG등록·단독조수90호출전용경로·72의상/역할상태조건정상.71의상기본참조+617장면=688PNG무결성.실제수정:legacy/indpack둘다역할인정·빈이전장면경고제거.역할복우선·두배우공용경로는정상. / 조사/도구수정완료;제보화면미재현 | H171,H127,H128 / 617을신규제작수·수리수로세지않고플레이문제해결로단정하지않음. | [REPORT_KO.md](<G:/somi/JO9sa/records/character-1031-assistant-audit-20261108/REPORT_KO.md>) [REPORT_KO.md](<G:/somi/JO9sa/records/checklist-role-status-20261108/REPORT_KO.md>) |
| G03 | 31명초상93+테두리15=108 | 전신/초상외형불일치31명,일부프레임누락. | 1203·1451~1462·2325~2332·2334~2338·2575·2613·2617·3011·3018전신얼굴크롭3종93PNG.프레임전용은1447·1448·1450·2339·빌헬미네15PNG.고유108파일,테두리90중75는93에중복.기존150/151×150·경로·유효프레임유지.AI재그림0.2324/2333유지. / WORK/소스반영;후속수동그림우선 | H172,H173,H174,H175,H176,H177,H178,H179,H180,H181,H182,H183,H184,H185,H186,H187,H188,H189,H190,H191,H192,H193,H194,H195,H196,H197,H198,H199,H200,H201,H202,H203,H204 / 108+90합산금지.2331/자스민등후속수동교체를옛크롭으로복구하지않음. | [REPORT_KO.md](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>) [plan.json](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) [inspection.csv](<G:/somi/JO9sa/records/portrait-sync-20261108/inspection.csv>) |
| G04 | 2331 초상후속수동그림 | 초상동기화시점그림. | personal-patch2026-11-07T21-03-35-138Z_310a3d54:replace가3초상후속교체.commit-handoff가최신WORK바이트를소스override로보존. / 현재수동본보존 | H206 / 기존before/after의 [object Object]를files의실제경로/해시로보완. | [REPORT_KO.md](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>) [work-source-sync.json](<G:/somi/JO9sa/records/commit-handoff-20261108/work-source-sync.json>) |
| G05 | 시루7기준·7옛주소와도미나후속 | 1448_white_long_young계열7참조. | 11/8→1448_shiru7기준/JSON7키,옛7주소KEEP·새그림0.11/9수동도미나456692B교체→11/10소스보존→11/11사용자승인으로옛도미나1주소현재바이트임시복구.다른6쌍결정유지. / D21이관/캐시검증전KEEP·정리미실행 | H211,H212,H298 / 중간부재를현재부재로반복하거나D21완료로쓰지않음. | [REPORT_KO.md](<G:/somi/JO9sa/records/character-image-links-20261108/REPORT_KO.md>) [REPORT_KO.md](<G:/somi/JO9sa/records/work-image-source-sync-20261110/REPORT_KO.md>) [REPORT_KO.md](<G:/somi/JO9sa/records/shiru-domina-alias-20261111/REPORT_KO.md>) [2026-11-08_shiru-paths.json](<G:/somi/JO9sa/assets/compatibility-aliases/2026-11-08_shiru-paths.json>) |
| G06 | 펠라게야비서추가·단방향공유 | 11/8비서pelageya_red_long부재;2585/2607역할연결없음. | 사용자PNG345977B추가후3역할구/신키를2577기존3PNG에연결.2577저장은2585/2607도갱신;다른번호직접저장은자기번호만.같은PNG내용교체는공유.설명/능력복사0. / 반영;일반복제그룹확장D19보류 | H210,H213,H214,H215,H226,H301,H304,H305,H134 / 초기비서fallback조사이후추가됨.모든복제본자동그룹아님. | [REPORT_KO.md](<G:/somi/JO9sa/records/character-image-links-20261108/REPORT_KO.md>) [REPORT_KO.md](<G:/somi/JO9sa/records/pelageya-outfits-20261109/REPORT_KO.md>) [REPORT_KO.md](<G:/somi/JO9sa/records/pelageya-group-gloria-list-20261109/REPORT_KO.md>) [CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) |
| G07 | 2341글로리아목록·현재연결 | 기존1154목록에없음·옛brown_short_milf참조. | 2341추가로당시1155명.현재full/역할3=2341_gloria,title=characters/2341_gloria_title.indpack_cocktail도초록원피스title.수동9이미지키/PNG5보존. / WORK/소스반영·명주의상실제화면대기 | H216,H219,H220,H221,H222,H223,H308,H135 / 목록/JSON/5수동연결/복장키를별도새그림수로중복집계하지않음. | [REPORT_KO.md](<G:/somi/JO9sa/records/pelageya-group-gloria-list-20261109/REPORT_KO.md>) [REPORT_KO.md](<G:/somi/JO9sa/records/gloria-cocktail-title-20261110/REPORT_KO.md>) |
| G08 | 옛9부재의서로다른결정 | 야간리소스요약은9부재를일괄미결로표시. | 일반구초상4=이관미결.미배포Gloria옛4=H308후속사용자확정으로복구제안철회.2339.json=현재2339_yagisuna.json과동시활성배포시ID중복이므로구소스보존/활성배포제외.9소스원본보존·현재WORK부재명시·임의복구0. / 상태분리;모두호환결함/삭제대상이아님 | H308 / 일반초상4/Gloria4/2339를동일미결버그로묶는과거제안은후속결정으로대체. | [release-data.json](<G:/somi/JO9sa/records/release-prep-20261113/release-data.json>) [RESOURCE_REVIEW_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/RESOURCE_REVIEW_KO.md>) [resource-sync-plan.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/resource-sync-plan.json>) |
| G09 | 수동title·알몸연결분리 | 기본전신과옷입은title혼동가능. | 1448·2341·2572·2573·2577(2585/2607공유)·2579·2583·3002수동title보존.2579의characters/egeya_title중간연결은girls/full/2579/egeya_title로후속대체.PNG내용변경0. / 현재JSON우선·상세manualImageLinkHistory | H217,H218,H219,H220,H221,H222,H223,H224,H225,H226,H227,H228,H229,H230,H129,H130,H131,H132 / JSON전체해시/[object Object]만으로는실제이미지필드/경로가설명되지않음. | [REPORT_KO.md](<G:/somi/JO9sa/records/character-image-links-20261108/REPORT_KO.md>) [release-data.json](<G:/somi/JO9sa/records/release-prep-20261113/release-data.json>) |
| G10 | 선택대사경로·조건·gloria01~04 | 공유그림참조일괄전파위험. | 선택대사개별대입문만경로/추가성향·금액·계급·평판/fallback편집지원.실제rental_sex3단계첫지정oral_general_milf_2→scene/others/gloria01.바깥master_excitement>=0/jo9_gloria_event=0/is_master_virgin=1·else그림유지.추가조건실제지정0.4/5/6단계gloria02/03/04후속연결. / 도구/QSP참조반영·픽셀덮어쓰기아님 | H139,H140,H141,H236,H237,H238,H239 / 조건편집지원과실제새조건적용을구분. | [REPORT_KO.md](<G:/somi/JO9sa/records/image-reference-20261109/REPORT_KO.md>) [2026-11-09_gloria_image_reference.json](<G:/somi/JO9sa/mods/2026-11-09_gloria_image_reference.json>) [2026-11-09_work_editor_image_sync.json](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_sync.json>) [2026-11-09_work_editor_image_stage5.json](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_stage5.json>) [2026-11-09_work_editor_image_stage6.json](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_stage6.json>) |
| G11 | 원본B컷238보존·48쌍추가 | 실제사본폴더를junction이아니라고오판;체크9/등록238/예약282불일치. | 기존238사본기록해시일치·실제폴더인정·최신9선택보존복구.승인네릴리스1보호해제후기존237+새48=등록285/예약44.새48물리B컷+48보관원본=96파일.네릴리스는바이트유지일반B컷.미등록수동B컷덮어쓰기없음. / 동기화완료·게임QSP본문변경0 | H142,H143,H144,H145,H233,H234,H235 / 238/96파일을신규제작그림수로세지않음. | [REPORT_KO.md](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>) [merge-plan.json](<G:/somi/JO9sa/records/catalog-sync-20261109/merge-plan.json>) [source-sync.json](<G:/somi/JO9sa/records/catalog-sync-20261109/source-sync.json>) |
| G12 | 공유PNG해제·전체삭제보존 | 타번호공유PNG삭제위험. | 다른번호모든이미지참조/물리별칭/ID0/옛초상/역할공유검사후공유PNG보존.해당연결/JSON만정리;단독파일기존삭제유지.shared_with/preserved_shared_with구분. / 도구안정성반영 | H295 / 모든파일삭제금지로과장하지않음.실제사용자캐릭터삭제시험없음. | [REPORT_KO.md](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>) [add_character.py](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>) |
| G13 | 추가팩27명108미리보기 WORK화 | 108dataURL중당시71개현재WORK해시차이. | original=0 WORK API/no-store/current runtimePath사용·내장미리보기108제거·메타갱신.출처기록유지.그림/JSON/QSP변경0. / 도구표시수정 | H170 / 파일이름/JSON참조바뀌면runtimePath별도갱신필요.새그림108아님. | [REPORT_KO.md](<G:/somi/JO9sa/records/additional-pack-work-preview-20261108/REPORT_KO.md>) |
| G14 | 전체JSON감지·춘향·무번호 | 고정1155ID만조회해3040춘향8PNG목록누락. | 정상객체JSON전체감지.무번호/중복숫자는json:<실제파일명>으로식별·가짜번호폴더없음.기존태그/메모/호환/검색유지.당시1157JSON=기존+춘향+0_template,오류0. / 도구반영;당시무번호실물0/합성저장검증 | 후속/누적/로컬로그 / 최초308행누락/후속부록포함;실제춘향등록과무번호시험자료구분. | [REPORT_KO.md](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>) |
| G15 | 춘향8PNG등록→완성배경 | 11/11사용자도구신규3040JSON·8PNG등록. | 11/12원본RGB1447×1087동일바이트bg/chunhyang.png를게임795×596표시.클럽/대화/조건/선택/공급/소개/관전첫장연결·투명전경중복제거.관전2전용컷·결과그림보존. / 표시반영;최초기획미구현기록후속대체 | 후속/누적/로컬로그 / 후속배경표시와최초8PNG실제저장이력연결필요. | [REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-menu-links-20261112/REPORT_KO.md>) [2026-11-12_chunhyang_scene_presentation.json](<G:/somi/JO9sa/mods/2026-11-12_chunhyang_scene_presentation.json>) [REPORT_KO.md](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>) |
| G16 | 야즈민2574검증과실제저장 | 프레임도구설치검증은미리보기취소/PNG무저장. | 이후사용자로그8PNG교체+3초상프레임실제저장.seed_boobs2→4도사용자로그사실.중간sourceExists=false는현재Q04소스보존후대체. / 도구시험/후속실제저장구분 | 후속/누적/로컬로그 / 설치검증PNG0을후속사용자저장없음으로확대하지않음. | [REPORT_KO.md](<G:/somi/JO9sa/records/slave-portrait-frame-20261111/REPORT_KO.md>) [yasmin-audit.json](<G:/somi/JO9sa/records/slave-portrait-frame-20261111/yasmin-audit.json>) |
| G17 | 자동프레임·선택일괄테두리 | legacy_overhaul/151규격누락으로원본보존체크비활성. | 59×66·150×150·151×150원본프레임보존복구.상단1버튼선택항목생성·원본만이면중앙RGBA보존·저장은기존백업/해시흐름.초상3종개별미리보기/명시적적용도별도지원. / 도구반영;미리보기와실제파일저장구분 | 후속/누적/로컬로그 / 후속부록도구기능외실제프레임33건은별도기록필요. | [REPORT_KO.md](<G:/somi/JO9sa/records/workshop-batch-frame-20261111/REPORT_KO.md>) [REPORT_KO.md](<G:/somi/JO9sa/records/slave-portrait-frame-20261111/REPORT_KO.md>) |
| G18 | UI legacy_overhaul·옛별칭 | 외부UI주소분산. | 10/27UI2681파일ui정식관리경로·QSP81본문/CSS/traitsJS/menu_icon확인된공급자변경.옛주소캐시호환유지·당시NTFS하드링크.현재ui-resource-aliases2694관계.ZIP은각주소로실체화가능. / 이전누적Full유지대상 | 후속/누적/로컬로그 / 2694메타/초기2681이력대조.이번2694전수해시재실행없음.신규그림수아님. | [MANUAL_KO.md](<G:/somi/JO9sa/records/ui-live-consolidation-20261027/MANUAL_KO.md>) [canonical-link-journal.json](<G:/somi/JO9sa/records/ui-live-consolidation-20261027/canonical-link-journal.json>) [ui-resource-aliases.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/ui-resource-aliases.json>) |
| G19 | 기존15·정확2·기본23·분리6·용도사본 | 해시중복제거시옛주소상실. | 10/26오기호환15주소+별도178/212JSON0교정/구PNG2주소.10/28기본fullimage23독립사본KEEP.2071/2324/2340분리6관계는동일/다른구도/오기복장구분.이사벨라영입/default2관계·2323옛그림전용보존,여교관characters/mob2독립용도.새그림수로세지않음. / 이전누적KEEP;자동동기화없음 | 후속/누적/로컬로그 / 36관계=23+6+시루7통과를기존15/정확2/UI/용도사본까지완전증명으로확대하지않음. | [IMAGE_COMPATIBILITY_ALIASES_KO.md](<G:/somi/JO9sa/docs/IMAGE_COMPATIBILITY_ALIASES_KO.md>) [compatibility.json](<G:/somi/JO9sa/records/girls-image-path-fix-20261026/compatibility.json>) [REPORT_KO.md](<G:/somi/JO9sa/records/third-patch-approved-followups-20261026/images/REPORT_KO.md>) [2026-10-28_fullimage.json](<G:/somi/JO9sa/assets/compatibility-aliases/2026-10-28_fullimage.json>) [2026-11-05_2071_split.json](<G:/somi/JO9sa/assets/compatibility-aliases/2026-11-05_2071_split.json>) [2026-10-31_isabella_recruitment.json](<G:/somi/JO9sa/assets/resource-role-copies/2026-10-31_isabella_recruitment.json>) [2026-11-05_isabella_default.json](<G:/somi/JO9sa/assets/resource-role-copies/2026-11-05_isabella_default.json>) [2026-10-30_mistress_mob.json](<G:/somi/JO9sa/assets/resource-role-copies/2026-10-30_mistress_mob.json>) |
| G20 | 11/10현재그림6개 소스보존 | broker아이콘/펠리시티전신/빌헬미네3초상/시루도미나원장차이. | WORK6바이트소스보존/메타갱신.펠리시티순정동일→교체정정.운영41337/seed41301행·태그·QSP분석해시보존. / 소스보존완료 | H209,H211,H293 / 옛원장해시를정답으로현재수동그림을되돌리지않음. | [REPORT_KO.md](<G:/somi/JO9sa/records/work-image-source-sync-20261110/REPORT_KO.md>) |
| G21 | 이미지선택 로직후속 | 기존cow조회/조수교육배우표시. | cow_costume=기존cow그림공유/새PNG0.교육menu_form238전신배우slave→assistant·표시참조수정.실제교육display_pic은이미조수치환정상·공용PNG재연결/덮어쓰기없음. / 게임표시선택반영 | 후속/누적/로컬로그 / 게임선택수정을새그림제작으로쓰지않음. | [REPORT_KO.md](<G:/somi/JO9sa/records/cow-costume-20261111/REPORT_KO.md>) [REPORT_KO.md](<G:/somi/JO9sa/records/assistant-training-ui-20261112/REPORT_KO.md>) |
| G22 | 전수현황·현재소스·기준구분 | 최초308행은작성시점스냅샷. | 현재Girls32356파일.원래2.4.1Full(20261102)대비신규주소69/변경853/동일31434.최신공개유효기준(Full+3차r2)대비신규54/변경160/동일32142.부모Q04소스182파일(JSON20/PNG162)보존·WORK수정0. / 주소/바이트누적차이;신규그림제작수아님 | H169 / not-in-patch3-inventory는부분원장미포함일뿐후속제작증명아님.유효공개기준은Full+patch합성으로비교. | [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) [source-sync-result.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/source-sync-result.json>) [resource-sync-plan.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/resource-sync-plan.json>) |
| M2572 | 2572 펠리시티 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-10T05:01:20+09:00~2026-11-10T05:01:20+09:00 save1건/고유PNG5경로.JSON필드:차이미기록 / 실제저장로그;도구검사와구분 | H293 / 기존행은파일/경로상세축약 | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2624 | 2624 엘자 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-10T11:14:21+09:00~2026-11-10T11:14:21+09:00 save1건/고유PNG4경로.JSON필드:fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | H294 / 기존행은파일/경로상세축약 | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2605 | 2605 뱀피렐라 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-10T13:31:02+09:00~2026-11-10T13:31:02+09:00 save1건/고유PNG4경로.JSON필드:fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2574 | 2574 야즈민 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-11T04:28:02+09:00~2026-11-11T04:28:52+09:00 save2건/고유PNG8경로.JSON필드:indpack_naked,indpack_title,seed_boobs / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2576 | 2576 줄리아 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-11T11:07:25+09:00~2026-11-11T11:07:25+09:00 save1건/고유PNG8경로.JSON필드:indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2339 | 2339 야기슈나 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-11T12:25:10+09:00~2026-11-11T12:25:53+09:00 save2건/고유PNG0경로.JSON필드:seed_family_description,seed_name,seed_occupation_description,seed_world_description / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M3040 | 3040 춘향 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-11T12:45:00+09:00~2026-11-11T12:54:33+09:00 save3건/고유PNG8경로.JSON필드:seed_boobs,seed_boobs_img,seed_pussy_img / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2582 | 2582 레이첼 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-11T23:20:27+09:00~2026-11-11T23:20:27+09:00 save1건/고유PNG8경로.JSON필드:fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2584 | 2584 베네라 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-12T02:29:14+09:00~2026-11-12T02:32:21+09:00 save4건/고유PNG8경로.JSON필드:fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2606 | 2606 베네라 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-12T02:30:46+09:00~2026-11-12T02:31:15+09:00 save2건/고유PNG4경로.JSON필드:fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2611 | 2611 스네구로치카 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-12T04:14:06+09:00~2026-11-12T04:14:06+09:00 save1건/고유PNG8경로.JSON필드:fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2617 | 2617 자스민 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-12T14:52:35+09:00~2026-11-12T14:52:35+09:00 save1건/고유PNG8경로.JSON필드:fullmade,indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M3013 | 3013 샤크티 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-12T23:30:55+09:00~2026-11-12T23:30:55+09:00 save1건/고유PNG8경로.JSON필드:fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M3021 | 3021 다이아나 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-13T03:03:45+09:00~2026-11-13T03:03:45+09:00 save1건/고유PNG8경로.JSON필드:fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| M2614 | 2614 스네자나 실제로컬저장 | 기존슬롯/JSON또는신규등록전;before미기록부분추정없음. | 2026-11-13T04:20:55+09:00~2026-11-13T04:20:55+09:00 save1건/고유PNG8경로.JSON필드:fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title / 실제저장로그;도구검사와구분 | 후속/누적/로컬로그 / 최초308행실제저장상세누락.도구/기획후속부록만으로대체불가. | [통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) |
| F-2341_brown_short_milf | 2341_brown_short_milf 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-11 04:58:27 +09:00 content/pic/girls/face/2341_brown_short_milf.png; 2026-11-11 04:58:34 +09:00 content/pic/girls/face/2341_brown_short_milf_gray.png; 2026-11-11 04:58:39 +09:00 content/pic/girls/face/2341_brown_short_milf_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |
| F-wilhelmine | wilhelmine 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-11 04:58:49 +09:00 content/pic/girls/face/wilhelmine.png; 2026-11-11 04:58:55 +09:00 content/pic/girls/face/wilhelmine_gray.png; 2026-11-11 04:59:02 +09:00 content/pic/girls/face/wilhelmine_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |
| F-yasmin | yasmin 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-11 04:59:10 +09:00 content/pic/girls/face/yasmin.png; 2026-11-11 04:59:16 +09:00 content/pic/girls/face/yasmin_gray.png; 2026-11-11 04:59:27 +09:00 content/pic/girls/face/yasmin_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |
| F-julia | julia 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-11 11:53:27 +09:00 content/pic/girls/face/julia.png; 2026-11-11 11:53:32 +09:00 content/pic/girls/face/julia_gray.png; 2026-11-11 11:53:39 +09:00 content/pic/girls/face/julia_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |
| F-Luminous | Luminous 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-11 11:55:45 +09:00 content/pic/girls/face/Luminous.png; 2026-11-11 11:55:50 +09:00 content/pic/girls/face/Luminous_gray.png; 2026-11-11 11:55:55 +09:00 content/pic/girls/face/Luminous_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |
| F-venera | venera 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-12 02:36:34 +09:00 content/pic/girls/face/venera.png; 2026-11-12 02:36:40 +09:00 content/pic/girls/face/venera_gray.png; 2026-11-12 02:36:46 +09:00 content/pic/girls/face/venera_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |
| F-rachel | rachel 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-12 02:36:56 +09:00 content/pic/girls/face/rachel.png; 2026-11-12 02:37:02 +09:00 content/pic/girls/face/rachel_gray.png; 2026-11-12 02:37:08 +09:00 content/pic/girls/face/rachel_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |
| F-Diane | Diane 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-13 03:04:14 +09:00 content/pic/girls/face/Diane.png; 2026-11-13 03:04:23 +09:00 content/pic/girls/face/Diane_gray.png; 2026-11-13 03:04:29 +09:00 content/pic/girls/face/Diane_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |
| F-Shaakti | Shaakti 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-13 03:06:04 +09:00 content/pic/girls/face/Shaakti.png; 2026-11-13 03:06:11 +09:00 content/pic/girls/face/Shaakti_gray.png; 2026-11-13 03:06:17 +09:00 content/pic/girls/face/Shaakti_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |
| F-jasmine | jasmine 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-13 03:06:37 +09:00 content/pic/girls/face/jasmine.png; 2026-11-13 03:06:44 +09:00 content/pic/girls/face/jasmine_gray.png; 2026-11-13 03:06:51 +09:00 content/pic/girls/face/jasmine_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |
| F-Snegurochka | Snegurochka 초상 실제프레임저장 | 도구시험미리보기취소/PNG0과별개실제저장전. | 2026-11-13 03:07:23 +09:00 content/pic/girls/face/Snegurochka.png; 2026-11-13 03:07:29 +09:00 content/pic/girls/face/Snegurochka_gray.png; 2026-11-13 03:07:35 +09:00 content/pic/girls/face/Snegurochka_sepia.png / 실제portrait-frame저장이력 | 후속/누적/로컬로그 / 기존308행/설치도구보고서에없는후속파일변경. | [events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) [girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) |

## 실제 캐릭터 저장

| 시각(KST) | 번호·이름 | 모드 | PNG수 | JSON변경필드 |
|---|---|---|---:|---|
| 2026-11-10T05:01:20+09:00 | 2572 펠리시티 | edit | 5 | 차이미기록 |
| 2026-11-10T11:14:21+09:00 | 2624 엘자 | edit | 4 | fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title |
| 2026-11-10T13:31:02+09:00 | 2605 뱀피렐라 | edit | 4 | fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title |
| 2026-11-11T04:28:02+09:00 | 2574 야즈민 | edit | 8 | indpack_naked,indpack_title |
| 2026-11-11T04:28:52+09:00 | 2574 야즈민 | edit | 0 | seed_boobs |
| 2026-11-11T11:07:25+09:00 | 2576 줄리아 | edit | 8 | indpack_naked,indpack_title |
| 2026-11-11T12:25:10+09:00 | 2339 야기슈나 | edit | 0 | seed_family_description,seed_name,seed_occupation_description,seed_world_description |
| 2026-11-11T12:25:53+09:00 | 2339 야기슈나 | edit | 0 | 차이미기록 |
| 2026-11-11T12:45:00+09:00 | 3040 춘향 | new | 8 | 차이미기록 |
| 2026-11-11T12:46:43+09:00 | 3040 춘향 | edit | 0 | seed_boobs,seed_boobs_img,seed_pussy_img |
| 2026-11-11T12:54:33+09:00 | 3040 춘향 | edit | 0 | 차이미기록 |
| 2026-11-11T23:20:27+09:00 | 2582 레이첼 | edit | 8 | fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title |
| 2026-11-12T02:29:14+09:00 | 2584 베네라 | edit | 8 | fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title |
| 2026-11-12T02:30:46+09:00 | 2606 베네라 | edit | 4 | fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title |
| 2026-11-12T02:31:15+09:00 | 2606 베네라 | edit | 0 | 차이미기록 |
| 2026-11-12T02:31:26+09:00 | 2584 베네라 | edit | 0 | 차이미기록 |
| 2026-11-12T02:31:50+09:00 | 2584 베네라 | edit | 0 | 차이미기록 |
| 2026-11-12T02:32:21+09:00 | 2584 베네라 | edit | 1 | 차이미기록 |
| 2026-11-12T04:14:06+09:00 | 2611 스네구로치카 | edit | 8 | fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title |
| 2026-11-12T14:52:35+09:00 | 2617 자스민 | edit | 8 | fullmade,indpack_naked,indpack_title |
| 2026-11-12T23:30:55+09:00 | 3013 샤크티 | edit | 8 | fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title |
| 2026-11-13T03:03:45+09:00 | 3021 다이아나 | edit | 8 | fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title |
| 2026-11-13T04:20:55+09:00 | 2614 스네자나 | edit | 8 | fullmade,fullmistress,fullsecretary,indpack_naked,indpack_title |

파일별 경로·용량·기록SHA·안전한 이미지/숫자변경은 JSON actualCharacterSaveEvents에 있다. 원고 원문은 복제하지 않았다. before없는부분/제작자 추정0.

## 실제 초상 프레임 저장

| 시각(KST) | 파일 | 현재부모SHA=이벤트after |
|---|---|---|
| 2026-11-11 04:58:27 +09:00 | content/pic/girls/face/2341_brown_short_milf.png | True |
| 2026-11-11 04:58:34 +09:00 | content/pic/girls/face/2341_brown_short_milf_gray.png | True |
| 2026-11-11 04:58:39 +09:00 | content/pic/girls/face/2341_brown_short_milf_sepia.png | True |
| 2026-11-11 04:58:49 +09:00 | content/pic/girls/face/wilhelmine.png | True |
| 2026-11-11 04:58:55 +09:00 | content/pic/girls/face/wilhelmine_gray.png | True |
| 2026-11-11 04:59:02 +09:00 | content/pic/girls/face/wilhelmine_sepia.png | True |
| 2026-11-11 04:59:10 +09:00 | content/pic/girls/face/yasmin.png | True |
| 2026-11-11 04:59:16 +09:00 | content/pic/girls/face/yasmin_gray.png | True |
| 2026-11-11 04:59:27 +09:00 | content/pic/girls/face/yasmin_sepia.png | True |
| 2026-11-11 11:53:27 +09:00 | content/pic/girls/face/julia.png | True |
| 2026-11-11 11:53:32 +09:00 | content/pic/girls/face/julia_gray.png | True |
| 2026-11-11 11:53:39 +09:00 | content/pic/girls/face/julia_sepia.png | True |
| 2026-11-11 11:55:45 +09:00 | content/pic/girls/face/Luminous.png | True |
| 2026-11-11 11:55:50 +09:00 | content/pic/girls/face/Luminous_gray.png | True |
| 2026-11-11 11:55:55 +09:00 | content/pic/girls/face/Luminous_sepia.png | True |
| 2026-11-12 02:36:34 +09:00 | content/pic/girls/face/venera.png | True |
| 2026-11-12 02:36:40 +09:00 | content/pic/girls/face/venera_gray.png | True |
| 2026-11-12 02:36:46 +09:00 | content/pic/girls/face/venera_sepia.png | True |
| 2026-11-12 02:36:56 +09:00 | content/pic/girls/face/rachel.png | True |
| 2026-11-12 02:37:02 +09:00 | content/pic/girls/face/rachel_gray.png | True |
| 2026-11-12 02:37:08 +09:00 | content/pic/girls/face/rachel_sepia.png | True |
| 2026-11-13 03:04:14 +09:00 | content/pic/girls/face/Diane.png | True |
| 2026-11-13 03:04:23 +09:00 | content/pic/girls/face/Diane_gray.png | True |
| 2026-11-13 03:04:29 +09:00 | content/pic/girls/face/Diane_sepia.png | True |
| 2026-11-13 03:06:04 +09:00 | content/pic/girls/face/Shaakti.png | True |
| 2026-11-13 03:06:11 +09:00 | content/pic/girls/face/Shaakti_gray.png | True |
| 2026-11-13 03:06:17 +09:00 | content/pic/girls/face/Shaakti_sepia.png | True |
| 2026-11-13 03:06:37 +09:00 | content/pic/girls/face/jasmine.png | True |
| 2026-11-13 03:06:44 +09:00 | content/pic/girls/face/jasmine_gray.png | True |
| 2026-11-13 03:06:51 +09:00 | content/pic/girls/face/jasmine_sepia.png | True |
| 2026-11-13 03:07:23 +09:00 | content/pic/girls/face/Snegurochka.png | True |
| 2026-11-13 03:07:29 +09:00 | content/pic/girls/face/Snegurochka_gray.png | True |
| 2026-11-13 03:07:35 +09:00 | content/pic/girls/face/Snegurochka_sepia.png | True |

## 호환·용도 주소

| 원장 | 옛/별도주소 | 기준주소 | WORK옛주소 | 소스옛주소 |
|---|---|---|---|---|
| 2026-10-28_fullimage.json | content/pic/girls/full/1015_black_short_young.png | content/pic/girls/full/1015/1015_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1039_blond_long_young.png | content/pic/girls/full/1039/1039_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1063_blue_long_young.png | content/pic/girls/full/1063/1063_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1064_blue_long_young.png | content/pic/girls/full/1064/1064_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1065_blue_long_young.png | content/pic/girls/full/1065/1065_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1086_brown_long_young.png | content/pic/girls/full/1086/1086_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1110_green_long_young.png | content/pic/girls/full/1110/1110_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1132_pink_short_young.png | content/pic/girls/full/1132/1132_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1156_purple_short_young.png | content/pic/girls/full/1156/1156_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1172_red_long_young.png | content/pic/girls/full/1172/1172_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1190_white_long_young.png | content/pic/girls/full/1190/1190_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1205_pink_long_young.png | content/pic/girls/full/1205/1205_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1224_pink_short_young.png | content/pic/girls/full/1224/1224_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1237_purple_long_young.png | content/pic/girls/full/1237/1237_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/1258_red_long_young.png | content/pic/girls/full/1258/1258_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/2057_blond_short_milf.png | content/pic/girls/full/2057/2057_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/2076_blue_long_milf.png | content/pic/girls/full/2076/2076_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/2095_blue_short_milf.png | content/pic/girls/full/2095/2095_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/2118_brown_long_milf.png | content/pic/girls/full/2118/2118_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/2134_brown_short_milf.png | content/pic/girls/full/2134/2134_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/2154_green_long_milf.png | content/pic/girls/full/2154/2154_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/2171_green_short_milf.png | content/pic/girls/full/2171/2171_full_title.png | True | True |
| 2026-10-28_fullimage.json | content/pic/girls/full/2181_pink_long_milf.png | content/pic/girls/full/2181/2181_full_title.png | True | True |
| 2026-11-05_2071_split.json | content/pic/girls/full/2071_blond_short_milf.png | content/pic/girls/full/2340_blond_short_milf.png | True | True |
| 2026-11-05_2071_split.json | content/pic/girls/face/2071_blond_short_milf_sepia.png | content/pic/girls/face/2340_blond_short_milf_sepia.png | True | True |
| 2026-11-05_2071_split.json | content/pic/girls/face/2071_blond_short_milf_gray.png | content/pic/girls/face/2340_blond_short_milf_gray.png | True | True |
| 2026-11-05_2071_split.json | content/pic/girls/face/2071_blond_short_milf.png | content/pic/girls/face/2340_blond_short_milf.png | True | True |
| 2026-11-05_2071_split.json | content/pic/girls/full/2071_blue_short_milf.png | content/pic/girls/full/2324_blue_short_milf.png | True | True |
| 2026-11-05_2071_split.json | content/pic/girls/full/cloth/2071_blue_short_milf.png | content/pic/girls/full/cloth/2071_brown_long_milf.png | True | True |
| 2026-11-08_shiru-paths.json | content/pic/girls/full/1448_white_long_young.png | content/pic/girls/full/1448_shiru.png | True | True |
| 2026-11-08_shiru-paths.json | content/pic/girls/full/cloth/1448_white_long_young.png | content/pic/girls/full/cloth/1448_shiru.png | True | True |
| 2026-11-08_shiru-paths.json | content/pic/girls/full/mistress/1448_white_long_young.png | content/pic/girls/full/mistress/1448_shiru.png | True | True |
| 2026-11-08_shiru-paths.json | content/pic/girls/full/secretary/1448_white_long_young.png | content/pic/girls/full/secretary/1448_shiru.png | True | True |
| 2026-11-08_shiru-paths.json | content/pic/girls/face/1448_white_long_young_sepia.png | content/pic/girls/face/1448_shiru_sepia.png | True | True |
| 2026-11-08_shiru-paths.json | content/pic/girls/face/1448_white_long_young_gray.png | content/pic/girls/face/1448_shiru_gray.png | True | True |
| 2026-11-08_shiru-paths.json | content/pic/girls/face/1448_white_long_young.png | content/pic/girls/face/1448_shiru.png | True | True |
| compatibility.json | content/pic/girls/1207_green_long_young_sepia.png | content/pic/girls/face/1207_green_long_young_sepia.png | False | False |
| compatibility.json | content/pic/girls/face/1207_green_long_young_young.png | content/pic/girls/face/1207_green_long_young.png | True | False |
| compatibility.json | content/pic/girls/face/1208_pink_short_young_young.png | content/pic/girls/face/1208_pink_short_young.png | True | False |
| compatibility.json | content/pic/girls/face/1209_purple_short_young_young.png | content/pic/girls/face/1209_purple_short_young.png | True | False |
| compatibility.json | content/pic/girls/face/1210_red_long_young_young.png | content/pic/girls/face/1210_red_long_young.png | True | False |
| compatibility.json | content/pic/girls/face/1211_white_long_young_young.png | content/pic/girls/face/1211_white_long_young.png | True | False |
| compatibility.json | content/pic/girls/face/1214_blue_long_young_young.png | content/pic/girls/face/1214_blue_long_young.png | True | False |
| compatibility.json | content/pic/girls/1212_blue_long_young_sepia.png | content/pic/girls/face/1212_blue_long_young_sepia.png | False | False |
| compatibility.json | content/pic/girls/full/0176__black_short_loli.png | content/pic/girls/full/0176_black_short_loli.png | True | False |
| compatibility.json | content/pic/girls/face0177_black_short_loli.png | content/pic/girls/face/0177_black_short_loli.png | False | False |
| compatibility.json | content/pic/girls/face/0220_green_long_loli_loli.png | content/pic/girls/face/0220_green_long_loli.png | True | False |
| compatibility.json | content/pic/girls/face0222_blond_long_loli_sepia.png | content/pic/girls/face/0222_blond_long_loli_sepia.png | False | False |
| compatibility.json | content/pic/girls/face/Sword_Maiden_sepia.png | content/pic/girls/face/SwordMaiden_sepia.png | True | False |
| compatibility.json | content/pic/girls/face/Sword_Maiden_gray.png | content/pic/girls/face/SwordMaiden_gray.png | True | False |
| compatibility.json | content/pic/girls/face/Sword_Maiden.png | content/pic/girls/face/SwordMaiden.png | True | False |
| 2026-10-30_mistress_mob.json | content/pic/mob/mistress_morrigan.png | content/pic/characters/mistress_morrigan.png | True | False |
| 2026-10-30_mistress_mob.json | content/pic/mob/mistress_ava.png | content/pic/characters/mistress_ava.png | True | False |
| 2026-10-31_isabella_recruitment.json | content/pic/girls/full/isabella_black_long.png | content/pic/girls/full/2571/2571_full_title.png | True | False |
| 2026-11-05_isabella_default.json | content/pic/girls/full/isabella_black_long_milf.png | content/pic/girls/full/isabella_black_long.png | True | True |

UI별칭2694관계와 초기정리2681파일은 별도 원장으로 대조했다. 같은해시만으로 주소를 제거하지 않으며 별도주소가 자동으로 원본교체를 따라가는 구조가 아니다.

## 기존140행 범위 확인

| 행 | 변경 | 담당 범위 | 상세 보완 |
|---|---|---|---|
| H169 | 3차r2 출시 누적 기준 | Girls/캐릭터직접대조 |  |
| H170 | 추가팩 미리보기 WORK 실시간 전환 | Girls/캐릭터직접대조 |  |
| H171 | 1031 조수 의상·전용 장면 조사 | Girls/캐릭터직접대조 |  |
| H172 | 전신과 초상 동기화 1203 | Girls/캐릭터직접대조 |  |
| H173 | 전신과 초상 동기화 1451 | Girls/캐릭터직접대조 |  |
| H174 | 전신과 초상 동기화 1452 | Girls/캐릭터직접대조 |  |
| H175 | 전신과 초상 동기화 1453 | Girls/캐릭터직접대조 |  |
| H176 | 전신과 초상 동기화 1454 | Girls/캐릭터직접대조 |  |
| H177 | 전신과 초상 동기화 1455 | Girls/캐릭터직접대조 |  |
| H178 | 전신과 초상 동기화 1456 | Girls/캐릭터직접대조 |  |
| H179 | 전신과 초상 동기화 1457 | Girls/캐릭터직접대조 |  |
| H180 | 전신과 초상 동기화 1458 | Girls/캐릭터직접대조 |  |
| H181 | 전신과 초상 동기화 1459 | Girls/캐릭터직접대조 |  |
| H182 | 전신과 초상 동기화 1460 | Girls/캐릭터직접대조 |  |
| H183 | 전신과 초상 동기화 1461 | Girls/캐릭터직접대조 |  |
| H184 | 전신과 초상 동기화 1462 | Girls/캐릭터직접대조 |  |
| H185 | 전신과 초상 동기화 2325 | Girls/캐릭터직접대조 |  |
| H186 | 전신과 초상 동기화 2326 | Girls/캐릭터직접대조 |  |
| H187 | 전신과 초상 동기화 2327 | Girls/캐릭터직접대조 |  |
| H188 | 전신과 초상 동기화 2328 | Girls/캐릭터직접대조 |  |
| H189 | 전신과 초상 동기화 2329 | Girls/캐릭터직접대조 |  |
| H190 | 전신과 초상 동기화 2330 | Girls/캐릭터직접대조 |  |
| H191 | 전신과 초상 동기화 2331 | Girls/캐릭터직접대조 |  |
| H192 | 전신과 초상 동기화 2332 | Girls/캐릭터직접대조 |  |
| H193 | 전신과 초상 동기화 2334 | Girls/캐릭터직접대조 |  |
| H194 | 전신과 초상 동기화 2335 | Girls/캐릭터직접대조 |  |
| H195 | 전신과 초상 동기화 2336 | Girls/캐릭터직접대조 |  |
| H196 | 전신과 초상 동기화 2337 | Girls/캐릭터직접대조 |  |
| H197 | 전신과 초상 동기화 2338 | Girls/캐릭터직접대조 |  |
| H198 | 전신과 초상 동기화 2575 | Girls/캐릭터직접대조 |  |
| H199 | 전신과 초상 동기화 2613 | Girls/캐릭터직접대조 |  |
| H200 | 전신과 초상 동기화 2617 | Girls/캐릭터직접대조 |  |
| H201 | 전신과 초상 동기화 3011 | Girls/캐릭터직접대조 |  |
| H202 | 전신과 초상 동기화 3018 | Girls/캐릭터직접대조 |  |
| H203 | 1447·1448·1450·2339·빌헬미네 초상 테두리 보완 | Girls/캐릭터직접대조 |  |
| H204 | 초상과 테두리 중복 수량 | Girls/캐릭터직접대조 |  |
| H205 | 도서관 도시 아이콘2경로 교체 | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H206 | 2331 초상3종 후속교체 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H207 | 뱀자리 이동 V 아이콘 교체 | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H208 | 중개인 그림·아이콘 교체 | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H209 | 중개인 그림·아이콘 교체 | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H210 | 펠라게야 누락 비서복 PNG 추가 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H211 | 시루 도미나 PNG 후속교체 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H212 | 시루1448 이미지7경로 새기준과 호환 | Girls/캐릭터직접대조 |  |
| H213 | 2585 펠라게야3역할 기존그림 연결 | Girls/캐릭터직접대조 |  |
| H214 | 2607 펠라게야3역할 기존그림 연결 | Girls/캐릭터직접대조 |  |
| H215 | 펠라게야 단방향 공유 그룹 | Girls/캐릭터직접대조 |  |
| H216 | 2341 글로리아 이미지 목록 등록 | Girls/캐릭터직접대조 |  |
| H217 | 1448 indpack_title 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H218 | 1448 indpack_title 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H219 | 2341 fullimage 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H220 | 2341 indpack_maid 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H221 | 2341 indpack_secr 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H222 | 2341 indpack_dom 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H223 | 2341 indpack_title 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H224 | 2572 indpack_title 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H225 | 2573 indpack_title 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H226 | 2577 indpack_title 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H227 | 2579 indpack_title 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H228 | 2579 indpack_title 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H229 | 2583 indpack_title 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H230 | 3002 indpack_title 경로 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H231 | 수녀 드레스 설명그림 연결 | 부모일반UI/개인실감사 |  |
| H232 | 창녀 드레스 설명그림 연결 | 부모일반UI/개인실감사 |  |
| H233 | 체크 상태 복구 | Girls/캐릭터직접대조 |  |
| H234 | 원본 B컷48개 물리등록 | Girls/캐릭터직접대조 |  |
| H235 | 네릴리스 주교 일반 B컷 전환 | Girls/캐릭터직접대조 |  |
| H236 | 글로리아 특별서비스 3단계 그림 | Girls/캐릭터직접대조 |  |
| H237 | 글로리아 특별서비스 4단계 그림 | Girls/캐릭터직접대조 |  |
| H238 | 글로리아 특별서비스 5단계 그림 | Girls/캐릭터직접대조 |  |
| H239 | 글로리아 특별서비스 6단계 그림 | Girls/캐릭터직접대조 |  |
| H240 | 깨끗한 V 아이콘 후보 | 부모일반UI/개인실감사 |  |
| H241 | 개인실 비활성 메뉴 글꼴 | 부모일반UI/개인실감사 |  |
| H242 | 기존 BGM30개 형식통일 | 부모음원감사 |  |
| H243 | 게임오버 전용 BGM/SFX | 부모음원감사 |  |
| H244 | 가르시드 사용자파일 채택 | 부모음원감사 |  |
| H245 | 둔기 사용자파일 채택 | 부모음원감사 |  |
| H246 | 가르시드 등장/둔기 타격 실제 재생 | 부모음원감사 |  |
| H247 | 채택 승리 실제PLAY 보완 | 부모음원감사 |  |
| H248 | 채택 전투 패배 실제PLAY 보완 | 부모음원감사 |  |
| H249 | 채택 처형 실제PLAY 보완 | 부모음원감사 |  |
| H250 | 채택 석방 실제PLAY 보완 | 부모음원감사 |  |
| H251 | 채택 치명타 실제PLAY 보완 | 부모음원감사 |  |
| H252 | 몬스터18종 대표 등장음 | 부모음원감사 |  |
| H253 | 거주지·명성 순차 BGM | 부모음원감사 |  |
| H254 | 사운드 폴더 정리 취소 | 부모음원감사 |  |
| H255 | 사운드 Git 업로드 제외 | 부모음원감사 |  |
| H256 | 개인실 빈손/부상 보고 효과음 | 부모음원감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H257 | 개인실 초대박 보고 효과음 | 부모음원감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H258 | 개인실 10일 장부 진입 효과음 | 부모음원감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H259 | 개인실 효과음 문자열 변수 | 부모음원감사 |  |
| H260 | home/daywork_empty.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H261 | home/daywork_happy.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H262 | home/daywork_normal.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H263 | home/daywork_rest.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H264 | home/daywork_rich.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H265 | home/fog_empty.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H266 | home/fog_injured.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H267 | home/fog_jackpot.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H268 | home/fog_normal.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H269 | home/fog_rest.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H270 | home/jo9_ledger_centralkvartal_house.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H271 | home/jo9_ledger_kamira_house.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H272 | home/jo9_ledger_korvus_house.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H273 | home/jo9_ledger_otchuzhdenie_house.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H274 | home/jo9_ledger_redlight_house.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H275 | home/jo9_ledger_serpis_house.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H276 | home/jo9_ledger_slum_house.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H277 | home/jo9_ledger_taurus_house.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H278 | home/jo9_ledger_white_house.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H279 | home/street_empty.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H280 | home/street_normal.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H281 | home/street_pleasure.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H282 | home/street_pregnant.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H283 | home/street_rest.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H284 | home/street_rich.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H285 | home/street_unpleasant.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H286 | interior/basic_slave_room.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H287 | interior/luxury_slave_room.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H288 | interior/quality_slave_room.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H289 | interior/standard_slave_room.png | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H290 | 개인실36PNG 복구·배포 입력명세 | 부모일반UI/개인실감사 |  |
| H291 | 두번째 그림묶음 등록·반복 보완 | 부모일반UI/개인실감사 |  |
| H292 | 개인실 업무·장부·인테리어 그림조회 | 부모일반UI/개인실감사 |  |
| H293 | 2572 펠리시티 도구 실제 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H294 | 2624 엘자 도구 실제 저장 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H295 | 공유PNG 해제·전체삭제 보존 | Girls/캐릭터직접대조 |  |
| H296 | 신규정식ZIP·Full 동기화 미실행 | Girls/캐릭터직접대조 |  |
| H297 | json/menu_icon.json 출시 기준→현재 WORK 순변경 | 부모일반UI/개인실감사 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H298 | json/slaves/1448_Shiru.json 출시 기준→현재 WORK 순변경 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H299 | json/slaves/2572_felicity.json 출시 기준→현재 WORK 순변경 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H300 | json/slaves/2573_wilhelmine.json 출시 기준→현재 WORK 순변경 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H301 | json/slaves/2577_pelageya.json 출시 기준→현재 WORK 순변경 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H302 | json/slaves/2579_egeya.json 출시 기준→현재 WORK 순변경 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H303 | json/slaves/2583_galateya.json 출시 기준→현재 WORK 순변경 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H304 | json/slaves/2585_pelageya.json 출시 기준→현재 WORK 순변경 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H305 | json/slaves/2607_pelageya2.json 출시 기준→현재 WORK 순변경 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H306 | json/slaves/2624_erza.json 출시 기준→현재 WORK 순변경 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H307 | json/slaves/3002_Luminous.json 출시 기준→현재 WORK 순변경 | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |
| H308 | 2341 글로리아 신규 캐릭터JSON | Girls/캐릭터직접대조 | 요약의 [object Object]를구조화상세로보완.제작수와파일수를구분. |

## 전수기준·검증한계

현재Girls32356파일. 원래2.4.1Full(20261102)대비 신규주소69/내용변경853/동일31434. 최신공개유효기준(Full+3차r2)대비 신규54/변경160/동일32142다. 신규그림제작수/캐릭터수가 아니다. 부분원장미포함을 후속제작으로 단정하지 않는다.

[부모Girls전수자료](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>)와 [Q04동기화결과](<G:/somi/JO9sa/records/release-q04-work-source-20261113/source-sync-result.json>)를 재사용했다. 현재182소스보존(JSON20/PNG162) 이후 참조는JSON currentImageReferenceSnapshots에 있다. 과거Yasmin sourceExists=false는현재상태가아니다.

- 기존실행/PNG검증기록대조이며이번전체출고PASS/실제EXE/SAV/원본PNG무결성재인증아님.
- 현재SHA는부모Q04재사용;본편대비누적차이와최신공개Full+3차r2대비차이구분.
- 로그에없는before픽셀/제작자/제작시점추정0;파일수는신규그림수아님.
- 일반구초상4이관미결/Gloria옛4복구철회/2339구JSON동시활성금지/시루D21대기구분.
- 이감사에서원고/이미지재생성0·복구/삭제/이동0·자체전체SHA/복사0·WORK/Full/SAV/음원/커밋/푸시변경0.

Git 경로별 log/show의 관련 commit은JSON gitEvidence에 있다. 음원/일반UI/개인실36PNG세부는 부모·다른 담당 감사로 연결하며, 이 문서의140행 표에서 범위를 명시했다. 진단QSP·중복이미지·임시사본은 만들지 않았다.

## 확인한 기록 파일

근거주소의 존재확인과 본문 직접대조를 구분한다. 이 목록의 모든파일을 전수정독/재실행했다는 뜻은 아니다. JSON coverage.contentReview를 참조한다.

- [G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json](<G:/Codex/tmp/jo9-post3-changelog-20261110/third-r2-manifest.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/.gitignore](<G:/somi/JO9sa/.gitignore>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/AGENTS.md](<G:/somi/JO9sa/AGENTS.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json](<G:/somi/JO9sa/assets/additional-resources/2026-11-10_private-room.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/compatibility-aliases/2026-10-28_fullimage.json](<G:/somi/JO9sa/assets/compatibility-aliases/2026-10-28_fullimage.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/compatibility-aliases/2026-11-05_2071_split.json](<G:/somi/JO9sa/assets/compatibility-aliases/2026-11-05_2071_split.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/compatibility-aliases/2026-11-08_shiru-paths.json](<G:/somi/JO9sa/assets/compatibility-aliases/2026-11-08_shiru-paths.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/content/pic/scene/others/gloria01.png](<G:/somi/JO9sa/assets/content/pic/scene/others/gloria01.png>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/content/pic/scene/others/gloria02.png](<G:/somi/JO9sa/assets/content/pic/scene/others/gloria02.png>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/content/pic/scene/others/gloria03.png](<G:/somi/JO9sa/assets/content/pic/scene/others/gloria03.png>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/content/pic/scene/others/gloria04.png](<G:/somi/JO9sa/assets/content/pic/scene/others/gloria04.png>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/css-2.4/base.css](<G:/somi/JO9sa/assets/css-2.4/base.css>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/json/slaves/2341_Gloria.json](<G:/somi/JO9sa/assets/json/slaves/2341_Gloria.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/resource-role-copies/2026-10-30_mistress_mob.json](<G:/somi/JO9sa/assets/resource-role-copies/2026-10-30_mistress_mob.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/resource-role-copies/2026-10-31_isabella_recruitment.json](<G:/somi/JO9sa/assets/resource-role-copies/2026-10-31_isabella_recruitment.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/assets/resource-role-copies/2026-11-05_isabella_default.json](<G:/somi/JO9sa/assets/resource-role-copies/2026-11-05_isabella_default.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/docs/CUMULATIVE_CHECK_20261107_KO.md](<G:/somi/JO9sa/docs/CUMULATIVE_CHECK_20261107_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/docs/IMAGE_COMPATIBILITY_ALIASES_KO.md](<G:/somi/JO9sa/docs/IMAGE_COMPATIBILITY_ALIASES_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/docs/modding/IMAGE_NAMING_RULES_KO.md](<G:/somi/JO9sa/docs/modding/IMAGE_NAMING_RULES_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/docs/release-prep/2026-11-13/CHANGE_LEDGER_KO.md](<G:/somi/JO9sa/docs/release-prep/2026-11-13/CHANGE_LEDGER_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-08/GPT_HANDOFF_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md](<G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-08_adopted_combat_monster_sfx.json](<G:/somi/JO9sa/mods/2026-11-08_adopted_combat_monster_sfx.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-08_audio_formats_mp3_bgm_wav_sfx.json](<G:/somi/JO9sa/mods/2026-11-08_audio_formats_mp3_bgm_wav_sfx.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-08_gameover_audio_screen_only.json](<G:/somi/JO9sa/mods/2026-11-08_gameover_audio_screen_only.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-08_garsid_blunt_playback.json](<G:/somi/JO9sa/mods/2026-11-08_garsid_blunt_playback.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-08_item_component_images.json](<G:/somi/JO9sa/mods/2026-11-08_item_component_images.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-09_gloria_image_reference.json](<G:/somi/JO9sa/mods/2026-11-09_gloria_image_reference.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-09_work_editor_image_stage5.json](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_stage5.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-09_work_editor_image_stage6.json](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_stage6.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-09_work_editor_image_sync.json](<G:/somi/JO9sa/mods/2026-11-09_work_editor_image_sync.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-10_duty_ledger_sounds.json](<G:/somi/JO9sa/mods/2026-11-10_duty_ledger_sounds.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-10_private_room_scene_bg.json](<G:/somi/JO9sa/mods/2026-11-10_private_room_scene_bg.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-10_stability_01_duty_sound.json](<G:/somi/JO9sa/mods/2026-11-10_stability_01_duty_sound.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-10_street_empty_scene.json](<G:/somi/JO9sa/mods/2026-11-10_street_empty_scene.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/mods/2026-11-12_chunhyang_scene_presentation.json](<G:/somi/JO9sa/mods/2026-11-12_chunhyang_scene_presentation.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/additional-pack-work-preview-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/additional-pack-work-preview-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/assistant-training-ui-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/assistant-training-ui-20261112/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/audio-format-normalize-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/audio-format-normalize-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/audio-format-normalize-20261108/converted.json](<G:/somi/JO9sa/records/audio-format-normalize-20261108/converted.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/catalog-sync-20261109/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/catalog-sync-20261109/merge-plan.json](<G:/somi/JO9sa/records/catalog-sync-20261109/merge-plan.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/catalog-sync-20261109/recovery-plan.json](<G:/somi/JO9sa/records/catalog-sync-20261109/recovery-plan.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/catalog-sync-20261109/source-sync.json](<G:/somi/JO9sa/records/catalog-sync-20261109/source-sync.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/character-1031-assistant-audit-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/character-1031-assistant-audit-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/character-image-links-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/character-image-links-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/character-image-links-20261108/before/54c0e92247a5eb89ae48eaa91fdc14e51410564e4f66dc66aa62f41cd4cb4cf2.gz](<G:/somi/JO9sa/records/character-image-links-20261108/before/54c0e92247a5eb89ae48eaa91fdc14e51410564e4f66dc66aa62f41cd4cb4cf2.gz>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/character-path-rules-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/character-path-rules-20261109/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/checklist-role-status-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/checklist-role-status-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/chunhyang-menu-links-20261112/REPORT_KO.md](<G:/somi/JO9sa/records/chunhyang-menu-links-20261112/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/claude-stability-fixes-20261110/resource-verification.json](<G:/somi/JO9sa/records/claude-stability-fixes-20261110/resource-verification.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/commit-handoff-20261108/audio-exclusion.json](<G:/somi/JO9sa/records/commit-handoff-20261108/audio-exclusion.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/commit-handoff-20261108/work-source-sync.json](<G:/somi/JO9sa/records/commit-handoff-20261108/work-source-sync.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/cow-costume-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/cow-costume-20261111/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/girls-image-path-fix-20261026/compatibility.json](<G:/somi/JO9sa/records/girls-image-path-fix-20261026/compatibility.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/gloria-cocktail-title-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/gloria-cocktail-title-20261110/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/image-reference-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/image-reference-20261109/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/item-component-images-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/item-component-images-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/json-character-discovery-20261111/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/pelageya-group-gloria-list-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/pelageya-group-gloria-list-20261109/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/pelageya-outfits-20261109/REPORT_KO.md](<G:/somi/JO9sa/records/pelageya-outfits-20261109/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/portrait-sync-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/portrait-sync-20261108/inspection.csv](<G:/somi/JO9sa/records/portrait-sync-20261108/inspection.csv>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/portrait-sync-20261108/plan.json](<G:/somi/JO9sa/records/portrait-sync-20261108/plan.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/portrait-sync-20261108/verification.json](<G:/somi/JO9sa/records/portrait-sync-20261108/verification.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/post3-ledger-refresh-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/post3-ledger-refresh-20261111/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/release-night-preflight-20261113/REPORT_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/release-night-preflight-20261113/RESOURCE_REVIEW_KO.md](<G:/somi/JO9sa/records/release-night-preflight-20261113/RESOURCE_REVIEW_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/release-patch-20261105/REPORT_KO.md](<G:/somi/JO9sa/records/release-patch-20261105/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/release-prep-20261113/release-data.json](<G:/somi/JO9sa/records/release-prep-20261113/release-data.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/girls-changes.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/release-q04-work-source-20261113/resource-sync-plan.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/resource-sync-plan.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/release-q04-work-source-20261113/source-sync-result.json](<G:/somi/JO9sa/records/release-q04-work-source-20261113/source-sync-result.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/residence-bgm-feasibility-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/residence-bgm-feasibility-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT_interiors.json](<G:/somi/JO9sa/records/scene-home-catalog-20261110/REGISTRATION_RESULT_interiors.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/scene-home-catalog-20261110/register-batch.cjs](<G:/somi/JO9sa/records/scene-home-catalog-20261110/register-batch.cjs>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/sfx-hooks-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/sfx-hooks-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/sfx-runtime-fix-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/sfx-runtime-fix-20261108/assets.json](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/assets.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/sfx-runtime-fix-20261108/monsters.json](<G:/somi/JO9sa/records/sfx-runtime-fix-20261108/monsters.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/shiru-domina-alias-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/shiru-domina-alias-20261111/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/slave-portrait-frame-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/slave-portrait-frame-20261111/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/slave-portrait-frame-20261111/yasmin-audit.json](<G:/somi/JO9sa/records/slave-portrait-frame-20261111/yasmin-audit.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/sound-adoption-20261108/REPORT_KO.md](<G:/somi/JO9sa/records/sound-adoption-20261108/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/third-patch-approved-followups-20261026/images/REPORT_KO.md](<G:/somi/JO9sa/records/third-patch-approved-followups-20261026/images/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/ui-live-consolidation-20261027/MANUAL_KO.md](<G:/somi/JO9sa/records/ui-live-consolidation-20261027/MANUAL_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/ui-live-consolidation-20261027/canonical-link-journal.json](<G:/somi/JO9sa/records/ui-live-consolidation-20261027/canonical-link-journal.json>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/work-image-source-sync-20261110/REPORT_KO.md](<G:/somi/JO9sa/records/work-image-source-sync-20261110/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/records/workshop-batch-frame-20261111/REPORT_KO.md](<G:/somi/JO9sa/records/workshop-batch-frame-20261111/REPORT_KO.md>) — 변경기록/현재메타데이터대조
- [G:/somi/JO9sa/tools/character-image-adder/add_character.py](<G:/somi/JO9sa/tools/character-image-adder/add_character.py>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/menu_icon.json](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/menu_icon.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2572_felicity.json](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2572_felicity.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2573_wilhelmine.json](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2573_wilhelmine.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2579_egeya.json](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2579_egeya.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2583_galateya.json](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2583_galateya.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2585_pelageya.json](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2585_pelageya.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2607_pelageya2.json](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2607_pelageya2.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2624_erza.json](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/2624_erza.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/3002_Luminous.json](<G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/json/slaves/3002_Luminous.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/content/pic/ui/jon-UIadds/qm_v_clean.png](<G:/somi/Jack O Nine Tails v2.4_work/game/content/pic/ui/jon-UIadds/qm_v_clean.png>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/content/snd/bad_secen.mp3](<G:/somi/Jack O Nine Tails v2.4_work/game/content/snd/bad_secen.mp3>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/content/snd/great-success.mp3](<G:/somi/Jack O Nine Tails v2.4_work/game/content/snd/great-success.mp3>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/content/snd/ledger.mp3](<G:/somi/Jack O Nine Tails v2.4_work/game/content/snd/ledger.mp3>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/css/base.css.bak_20261108_snk_font](<G:/somi/Jack O Nine Tails v2.4_work/game/css/base.css.bak_20261108_snk_font>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/menu_icon.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/menu_icon.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/1448_Shiru.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/1448_Shiru.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2341_Gloria.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2341_Gloria.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2572_felicity.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2572_felicity.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2573_wilhelmine.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2573_wilhelmine.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2577_pelageya.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2577_pelageya.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2579_egeya.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2579_egeya.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2583_galateya.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2583_galateya.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2585_pelageya.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2585_pelageya.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2607_pelageya2.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2607_pelageya2.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2624_erza.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2624_erza.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/3002_Luminous.json](<G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/3002_Luminous.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-08T17-48-29-097Z_56f345df/before.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-08T17-48-29-097Z_56f345df/before.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-24-08-735Z_0ba4859d/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-24-08-735Z_0ba4859d/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-30-44-223Z_cd16a9b2/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-30-44-223Z_cd16a9b2/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-58-48-043Z_c8c19b1a/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-58-48-043Z_c8c19b1a/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-59-20-702Z_53e21ea2/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-59-20-702Z_53e21ea2/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-59-44-763Z_84a811fa/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-59-44-763Z_84a811fa/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-59-52-655Z_6fe1999c/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T04-59-52-655Z_6fe1999c/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T05-00-03-550Z_c96ce963/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T05-00-03-550Z_c96ce963/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T07-01-19-587Z_1ed111cd/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T07-01-19-587Z_1ed111cd/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T10-43-25-893Z_efd83a55/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T10-43-25-893Z_efd83a55/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T15-11-37-001Z_e42aff84/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T15-11-37-001Z_e42aff84/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T15-42-58-380Z_78cf4ecf/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T15-42-58-380Z_78cf4ecf/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T15-47-04-943Z_e6c0b37a/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T15-47-04-943Z_e6c0b37a/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T16-31-42-523Z_d4223ab0/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T16-31-42-523Z_d4223ab0/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T18-19-03-636Z_04539a5e/record.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/character-links/2026-11-09T18-19-03-636Z_04539a5e/record.json>) — 변경기록/현재메타데이터대조
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/image_work/personal-patch/events.jsonl>) — 전체JSONL파싱
- [G:/somi/Jack O Nine Tails v2.4_work/game/modtools/ui-resource-aliases.json](<G:/somi/Jack O Nine Tails v2.4_work/game/modtools/ui-resource-aliases.json>) — 변경기록/현재메타데이터대조
- [G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl](<G:/somi/잭오나인_이미지추가도구/캐릭터및씬추가/작업기록/통합작업기록.jsonl>) — 전체JSONL파싱

## 수동 이미지 연결의 정확한 전후

| 행 | 변경 키 | 이전 | 이후 |
|---|---|---|---|
| H217 | indpack_title | girls/full/mistress/1448_shiru | girls/full/mistress/1448_white_long_young |
| H218 | indpack_title | girls/full/mistress/1448_white_long_young | characters/1448_shiru_title |
| H219 | fullimage | girls/full/2341_brown_short_milf | girls/full/2341_gloria |
| H220 | fullmade | girls/full/cloth/2341_brown_short_milf | girls/full/cloth/2341_gloria |
| H220 | indpack_maid | None | girls/full/cloth/2341_gloria |
| H221 | fullsecretary | girls/full/secretary/2341_brown_short_milf | girls/full/secretary/2341_gloria |
| H221 | indpack_secr | None | girls/full/secretary/2341_gloria |
| H222 | fullmistress | girls/full/mistress/2341_brown_short_milf | girls/full/mistress/2341_gloria |
| H222 | indpack_dom | None | girls/full/mistress/2341_gloria |
| H223 | indpack_title | None | characters/2341_gloria_title |
| H223 | indpack_naked | None | girls/full/2341_gloria |
| H224 | indpack_title | None | characters/felicity_title |
| H224 | indpack_naked | None | girls/full/felicity_blond_long_young |
| H225 | indpack_title | None | characters/wilhelmine_title |
| H225 | indpack_naked | None | girls/full/wilhelmine_pink_long_loli |
| H226 | indpack_title | None | characters/pelageya_title |
| H226 | indpack_naked | None | girls/full/pelageya_red_long |
| H227 | indpack_title | girls/full/2579/2579_full_naked | characters/egeya_title |
| H228 | indpack_title | characters/egeya_title | girls/full/2579/egeya_title |
| H229 | indpack_title | characters/galateya | characters/galateya_title |
| H230 | indpack_title | None | characters/Luminous_title |
| H230 | indpack_naked | None | girls/full/Luminous_blue_long |
