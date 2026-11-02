# 줄리아 재회 NPC 참조 — 독립 native 검사

핵심 재회 표시·상태 검사에서는 후보의 새 실패를 발견하지 못했다. 수정 전 실제 action3은 `alyce`를 지정하여 기대값 `julia` 검사가 실패했다. 후보는 새 이벤트와 옛 중간 상태 모두에서 페이지별 NPC를 교정했고, 재렌더링에서 인물을 다시 생성하거나 교환하지 않았다. 실제 파일 불러오기 완료는 아래 별도 시도에서 확인하지 못했다.

- 수정 전 WORK: `3fbdb2cca0e3eb2d4a70c2f9b442f2fb39bb756f1aefe6217cf8c10668f1106c`
- 후보: `f0911bef8f53ef1464edc3d107beccaca3af90c7f0368a4b7df92f7a6082e1b2`
- 상위 제품 JSON의 7편집·3로케이션·신규 로케이션0. 정확 재생 해시와 전체 역적용 바이트 일치를 독립 확인했다.

| 검사 | 결과 |
| --- | --- |
| RED | 원문 이벤트163 초기화 뒤 실제 action3 실행: `actualNpcId=alyce`, `FAIL_JULIA_ACTION_THREE_EXPECT_JULIA`. 생성1회, 실제 swap으로 합성 인물 이동 확인. |
| 핵심 native | 105조건 PASS. fresh action3/15/18→Julia,16/17→Johanna; 배경·전신 숨김 효과 유지. 옛 action 배열 교정, page1~2 현재ID 유지,3~15/18→Julia,16~17→Johanna를 old ID 두 종류로 검사. 전체 실제 renderer의 페이지1~18·이미지 입력 참조·반복 렌더링 멱등성 및 생성/교환0 확인. |
| 인물·대사·기타 action | slave·assistant·room1·room2·cow·stock 각각23묶음, fresh baseline/candidate와 saved-before/after 총12개 역할 비교 동일. 저장 전후 비교 인물은 모두23묶음을 nonempty로 seed했다. 대사 배열·owned/daily 역할목록 동일. fresh의 다섯 action은 지정 NPC 문자열 이외 완전 동일, 비활성 action 보존. |
| 비대상·custom | 21조건 PASS. 다른 이벤트162/164/191/102024에서 기존 참조 유지. 직접 지정한 custom NPC/current ID/action은 페이지3/8/15/16/17/18에서 유지되고, 기존 action 부수효과만 실행. |
| 실제 load 꼬리 GT | PASS. 실제 현재 로케이션이 `interaction_screen_city`인 상태에서 후보 load 꼬리를 실행하자 `gt`가 전체 renderer에 재진입했다. action이 없는 page8의 옛 현재ID를 즉시 Julia로 교정, 생성0. 이전 `$ongload` prefix는 호출 카운터로 격리했다. |

`generate_stock`은 호출 카운터와 결정적인 성인 합성 인물 생성으로 대체했다. 실제 2576 생성 확률·캐릭터 JSON 초기화는 검사하지 않았다. 원문의 실제 swap 함수와 이벤트 block, 후보의 전체 renderer·action·복구 블록을 실행했다. `_layout`은 출력 초기화, `interior_change`는 전달받은 이미지 HTML을 기록하는 wrapper로 대체했다. 장면 본문은 합성 대사 표식으로 대체했으며, 실제 대사 원문의 불변성은 패치의 전체 바이트 역적용과 action 비교로 확인했다. 인물 seed·canonical23 함수는 이전 위탁 테스트 스크립트를 읽기 참조한다.

현재 baseline에는 `addslave`라는 등록 API가 없다. 재생성·재등록 여부는 실제 `generate_stock` 및 `$swap_slave_instances` 호출수, owned/daily 역할목록과 전체 인물 데이터 보존으로 확인했다. 화면의 CSS 배치·실제 이미지 픽셀은 검사하지 않았다.

## 합성 native 파일 불러오기 추가 시도

`native-load.cjs`는 옛 배열/현재ID·screen 로케이션을 가진 합성 SAV를 실제 `SAVEGAME`으로 만드는 데 성공했다. 후보 진단본에서 이 파일을 `OPENGAME`으로 불러오는 추가 시도는 클라이언트가 `.sav`를 compile/open하려는 로그와 `Could not open file`을 남긴 뒤 완료 표식 없이 timeout했다. 후보의 callback 검사까지 도달한 것은 확인되지 않았으며 제품 회귀로 분류하지 않았다. 실패 결과·로그·합성 SAV는 별도 `native-load-results.json` 및 관련 파일에 보존했다.

따라서 **SAVEGAME 생성·판독 및 직접 실행한 load 꼬리→실제 renderer는 확인했고, 파일에서 native LOAD 완료·전체 `$ongload` migration prefix·GUI 저장/불러오기는 미확인**이다. 개인 세이브는 읽거나 변경하지 않았다. 합성 파일 불러오기 시도에서도 이전 load prefix는 격리했으므로, 성공하더라도 전체 migration 검증을 의미하지 않는다.

조건 수는 항목별로 표시하며 중복 합산하지 않았다. `SUMMARY.json`과 각 `*-results.json`/로그가 원시 실행 근거다. 재실행 시 이미 WORK가 갱신됐다면 `JO9_JULIA_TEST_BASELINE`에 SHA `3fbdb2`인 보존 QSP 또는 gzip 백업 경로를 지정한다.

지정 G 임시 폴더의 링크·경계·QSP/JSON 재파스를 확인한 뒤 재생성 가능한 QSP·계획 JSON·ini 18개, 390,320,664바이트를 정리했다. 링크0이며 합성 SAV8개·로그16개를 보존하고 해시를 재확인했다. 스크립트·보고서와 실패 시도 증거도 보존했다. 세부 목록·해시는 `cleanup.json`에 기록했다.
