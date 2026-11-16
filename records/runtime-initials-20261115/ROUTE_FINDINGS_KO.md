WORK QSP 영입 경로 조사 — 2026-11-15

대상은 `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp`이다. 조사 기준 SHA-256은 `d9e54998be9b9d2dbb56e69c1d464c582d6e047ea7c44ed9d50c03134b506c33`이다. 원본/WORK/도구 소스는 수정하지 않았다. JSON 110개에서 106개 ID의 구체적인 게임 영입 경로를 찾았고, 중복·다중 경로를 포함한 정적 후보는 115개다. 실행 엔진 결과를 산출한 보고서는 아니다.

기계 판독 자료는 `acquisition_routes_catalog.json`, 재현 스크립트는 `audit_routes.py`다. 모든 줄 번호는 QSP를 복호화한 해당 location 본문 안의 1부터 시작하는 실제 줄 번호다. `source_fragment`는 정확한 원문 구간, `replay_fragment`는 생성 대입부터 첫 UI 이동/갱신 직전까지 자른 후보이며 엔진 문법/실행 검증은 별도다. `helpers`에 핵심 보정 함수 원문을 넣었다.

| 경로 | 확인된 대상과 위치 | 실제 처리와 후처리 |
|---|---|---|
| 생성 후 일반 영입 | 다수 고유 ID; 각 `interaction_city` 선택자 수록 | `special_stock=ID` → `generate_stock` → `stock_to_slave_nogt`. 마지막 함수는 나이/처녀 상태에 따른 초기화, 에너지 상한, `base_exotic`, `calories`, 성향 초기화를 수행한다. |
| 생성 후 노예로 직접 교환 | 2576 줄리아: `interaction_city=163`, 5774~5781. 8878~8902: `6237`~`6261`의 개별 분기 | `generate_stock` → `dynamic $swap_slave_instances,'stock','slave'`. `stock_to_slave_nogt`를 거치지 않는다. 줄리아는 미용 강화·부정 감정·의상·newness를 별도 덮어쓴다. 도나 계열은 brand 등을 추가 설정한다. |
| 이사벨라 조수 | 2571: `get_special_assistant` 6~20; 호출 `interaction_city=6101` 11222~11228 | `generate_stock` 후 stock→assistant 직접 교환. beauty_enhanced=1, brand=2, neg_slave=0, leather_corset, newness=1. cheat_i일 때 테스트 보정이 추가된다. |
| 퀘스트 조수 | 2581: 7961; 2606: 1554/1558; 2615: 10101; 2621: 10395 | `assistant_type=ID` → `get_special_assistant_quest`. 이 함수는 `generate_stock`과 다르며 기본 속성 RAND(-1,1), 다수 기술 RAND(-2,1), 상하한 처리, energy=5/calories=3 등을 직접 적용한다. 일부 분기는 노예와 조수를 같이 생성하므로 그 앞쪽 노예 생성 대입도 조각에 보존했다. |
| 시루 | 1448: `interaction_city=6668021`, 21870~21876 | 일반 영입 함수까지 호출한다. `666802`는 확인 화면 경로다. `generate_stock` 1831~1834가 jo9_vampire=1, jo9_combat_trait=3을 추가하므로 별도 가짜 프로필을 만들면 안 된다. |
| 글로리아 | 2341: 951542/951543/951544 | `#npc_base` 945~998의 `$jo9_gloria_join` 호출. 가격별 custom/rational/instinct/moral/fear/angst, 호감 moodlet, 복종 성향, 의상을 후처리한다. 5000/2500 경로의 명성·잔혹도 성공 조건은 catalog의 preconditions에 수록했다. moral/fear는 jo9_cruel_mercy에도 좌우된다. |
| 춘향 | 3040: `jo9_chun_club,'acquire'` 77~100 | `generate_stock` 2061에서 `jo9_chunhyang_profile,'init'`를 실행한다. 일반 영입 함수가 arena_level을 0으로 지운 뒤 acquire 89에서 9 이상으로 복구한다. brand=0, jo9_sando=1, 특성 가치 refresh도 영입 끝에 적용한다. |
| 흑시장 순환 상품 | 3003~3026: `black_market_get_comm_slave` 20~48 | `bm_sequence_index`가 실제 special_stock 선택값이다. helper 첫 부분의 `s_type/get_special_slave` 결과가 최종 캐릭터 초기값은 아니다. 뒤의 생성/일반 영입으로 최종 노예가 교체된다. grace=RAND(0,1) 후처리도 있다. |
| 튜토리얼 | 2573/2574/2575: `choose_the_girl` 65~97 | 일반 영입 후 brand=4와 나체/인벤토리 설정을 추가한다. 같은 ID라도 일반 상점 영입과 분리해야 한다. |

정적 연결을 찾지 못한 ID는 2339, 2577, 2578, 2608이다. 2339는 `generate_stock` 67에서 일반 무작위 풀에서도 제외한다. 이 네 개를 임의의 게임 영입 경로로 단정하면 안 된다. 편집기 전용 생성은 별도 경로로 제공할 수 있으나 게임에서 실제 영입한 값으로 표기할 근거가 없다.

에게야 2579는 `interaction_city=102017` 블록이 18429와 18708에 두 번 있다. 앞 블록은 영입 뒤 brand=0을 적용하고 102018로 GT한다. 뒤 블록은 brand를 생성 전에 설정한다. 코드 실행 순서와 GT 때문에 뒤 블록은 정적 후보로만 남겼으며 실제 게임 경로로 채택하려면 앞 블록을 우선 추적해야 한다.

2586~2597은 고정 JSON의 이름/능력치만으로 대표할 수 없다. 생성 중 `jo9_background_b,'market_traits'`, 특성 생성, 끝의 `market_identity`가 호출되어 시장 상품용 무작위 신원/특성이 적용된다. JSON 대조와 실제 생성 결과를 따로 보여야 한다.

현재 QSP를 포괄하는 최소 추출 절차는 다음과 같다.

1. 현재 WORK JSON을 로드한 동일 게임 초기화 상태에서 대상 마스터/난이도/관련 영입 조건을 설정한다. seed 원본과 영입 결과를 별도 보관한다.
2. 따옴표·주석·중첩 IF/ACT/동적 코드 블록을 인식해 숫자 ID의 `special_stock`, `slave_type`, `assistant_type` 대입을 인덱싱한다. 단순히 `get_special_slave` 호출만 검색하면 현재 경로 대부분을 놓친다.
3. 해당 대입을 감싸는 선택자 블록을 찾고 생성 이후 첫 UI 이동 전까지 모든 대입/조건/동적 코드 호출 순서를 보존한다. 혼합 퀘스트는 같은 블록의 최초 생성 대입부터 보존한다.
4. 문자 변수에 저장된 함수(글로리아)와 변수 선택값을 쓰는 공용 helper(3003~3026)는 별도 명시적 매핑으로 연결한다. 실제 순서와 GT를 추적하여 중복 분기를 구분한다.
5. 격리 엔진에서 해당 경로와 실제 helper를 실행해 최종 역할 배열 전체를 덤프한다. 일반 영입 함수를 모든 대상에 자동으로 추가하지 않는다. 생성 마지막의 refresh/profile 호출을 임의로 재배열하지 않는다.
6. 난수가 있는 경로는 선택한 seed로 재현 가능한 한 회 결과와 무작위 항목임을 표시한다. 알려진 경로가 없는 ID는 경로 미확인으로 남긴다. 이 단계의 실제 엔진 검증은 상위 작업에서 수행한다.

검증은 catalog JSON의 재로딩, ID/route 참조 일치, 각 원문 조각의 현재 QSP location/줄 구간 대조, 원본 SHA-256 대조로 한정한다. 생성 스크립트와 catalog/보고서 외 임시 복제 QSP는 만들지 않았다.
