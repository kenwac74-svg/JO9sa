# 마스터 공통 초기값 전수 대조 및 편집기 반영

현재 WORK의 남주인공·여주인공 42개 프리셋과 초기화/계산 9개 위치에서 실제 대입 2,623건을 대조했다. 변수/상수 인덱스 318개를 등록했으며, CM의 기존 두 내부값을 한 칸으로 합쳐 사용자 편집칸은 317개다.

기존 UI의 **마스터 편집 → 능력치·특성**에 통합했다. 공통값, 개별값, 조건값, 재계산값을 구분하며 변수명/뜻/출처/저장 단계를 툴팁으로 보여준다. 같은 구조를 노예 편집의 마스터 전환용 설정에도 적용했다. 원본 코드 직접 편집도 유지한다.

| 묶음 | 내부 항목 수 |
|---|---:|
| CM | 2 |
| 능력치·상태·경험치 | 33 |
| 여주인 신체·설정 | 13 |
| 거주지·시설·소유물 | 27 |
| 장비·유물 | 20 |
| 자금·세력·평판 | 31 |
| 게임 시작 설정 (고급) | 74 |
| 성장·누적값 (고급) | 26 |
| 보유품·마법 | 92 |

## 저장 동작과 원본 보존

- 표 입력은 `initials: {변수명: 정수 또는 문자열}`로 전달한다. `null`은 표 지정만 해제한다. `dryRun`은 차이만 반환한다.
- `MasterEditor.initial_catalog`는 QSP를 실행하지 않고 초기화·프리셋·후속 초기화·계산 출처를 반환한다. 화면이 임의 코드를 평가하지 않는다.
- 선택을 넘길 때 story 초기화가 복원하는 값은 해당 프리셋 끝에 지정한다. CM·개 이름·말 보유·일부 옵션처럼 복원되지 않는 값은 선택한 인물로 게임을 시작할 때만 지정하여 다른 후보로 전파되지 않게 한다.
- 행동력은 `hero_description` 계산 이후, 시설·주인공 특수값은 `start_game` 초기화 이후에 인물 번호 조건으로 적용한다. 인테리어는 `new_estate` 호출 직전에 적용한다. 공통 초기화 원문을 일괄 덮어쓰지 않는다.
- 저장은 QSP·역할 보관 JSON·최초 QSP 백업·위치별 변경 mods를 한 작업으로 기록한다. 초기값을 편집해도 새로운 런타임 저장 변수를 만들지 않는다.
- 코드/공통 출처/본인 편집 구간이 외부에서 바뀌면 이전 화면의 저장을 거절하고 재읽기를 안내한다. 다른 인물의 변경은 덮어쓰지 않는다.
- 표 지정 해제는 도구가 만든 지정분만 해제한다. 사용자가 원본 편집 구간에 명령/식을 직접 추가했다면 자동 재생성으로 지우지 않고 원본 코드에서 편집하도록 알린다.
- 노예↔마스터 복제는 선택한 설정을 보존하고 새 번호에 연결한다. 복제 대응표에서 직접 입력한 값이 기존 표 지정값보다 우선한다.
- 현재 게임 QSP/JSON/세이브는 이번 도구 개발에서 저장하지 않았다. 사용자 저장 버튼은 새 게임 시작 프리셋을 바꾸며 진행 중인 세이브의 주인공을 갱신하지 않는다.

## 계산값과 대조 범위

조건식을 임의로 실행하지 않는다. 현재 인물 번호만으로 배제되는 다른 주인공 전용 분기는 표시값에 섞지 않으며, 나머지 조건/계산 결과는 자동·조건값으로 표시한다. 누적값·장비·CM 등으로 계속 다시 계산되는 능력치는 초기 지정이 영구 고정된다는 뜻이 아니다. 세련된 게임 내 표시 문구를 알 수 없는 변수는 원래 식별자와 실제 출처를 보존한다.

별도 이름·초상·소개는 기존 배경 설정 UI에 있으므로 같은 값을 중복 입력시키지 않는다. NPC 진행 상태·화면 배치·메뉴 코드·반복문 임시값은 인물의 시작 능력치/설정과 구분해 아래 제외 원장에 기록했다. 가변 인덱스와 배열 전체 초기화도 `inventory.json`에 별도로 기록한다. 커스텀 생성 경로의 보정은 별도 출처로 보여주며 스토리 프리셋 공통값으로 혼합하지 않는다.

## 검증 및 한계

- 42개 실제 프리셋을 읽어 항목 수·키 중복·원본 읽기를 확인했다.
- 관련 Python 26건, JavaScript 10건 및 격리 HTTP API 확인: 읽기·미리보기·저장·표 지정 해제·서로 다른 인물·양방향 복제·직접 원고 보존.
- 브라우저의 별도 확인 탭에서 CM·공통 문자열 값·검색·변경 보기·되돌리기·묶음 배치를 확인했다. 사용자 작업 탭은 새로고침하지 않았다.
- 실제 WORK에 시험 캐릭터/값을 저장하지 않았고 게임 EXE 플레이 검증은 하지 않았다. 배포용 전체 검사는 이 도구 변경 범위에 포함하지 않았다.

## 전체 등록 원장

| 변수 | 뜻/표기 | 묶음 | 저장 단계 | 주요 출처 |
|---|---|---|---|---|
| jo9_cruel_mercy | jo9_cruel_mercy | CM | start | init_game |
| jo9_cruel_mercy_half | jo9_cruel_mercy_half | CM | start | init_game |
| master_str | 힘 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_cha | 매력 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_style | 스타일 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_libido | 욕구 | 능력치·상태·경험치 | start | init_game, init_story_mode, init_custom_game, hero_creation, start_game, $calculate_attributes |
| master_energy | 행동력 | 능력치·상태·경험치 | description | init_game, init_story_mode, init_custom_game, hero_description, $calculate_attributes |
| master_tutor | 교육 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_fighter | 전투 기술 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_butler | 관리 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_artdirector | 예술 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_medic | 의학 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_mage | 마법 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_torture | 고문 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_domination | 지배 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_bondage | 결박 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_flagelation | 채찍 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_petting | 애무 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_oral | 구강 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_penetration | 삽입 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| master_fetish | 페티시즘 | 능력치·상태·경험치 | preset | init_game, init_story_mode, init_custom_game, hero_creation, $calculate_attributes |
| female['boobs'] | 여주인 가슴 분류 | 여주인 신체·설정 | preset | init_game, init_story_mode, init_custom_game |
| stock_limit | 기본 수용 인원 | 거주지·시설·소유물 | start | init_game |
| bath | 욕실 | 거주지·시설·소유물 | start | init_game, init_custom_game, hero_creation, new_estate |
| kitchen | 주방 | 거주지·시설·소유물 | start | init_game, init_custom_game, hero_creation, new_estate |
| dungeon | 감옥 | 거주지·시설·소유물 | start | init_game, init_custom_game, hero_creation, new_estate |
| lab | 연구실 | 거주지·시설·소유물 | start | init_game, init_custom_game, hero_creation, new_estate |
| library | 도서관 | 거주지·시설·소유물 | start | init_game, new_estate |
| barn | 외양간 | 거주지·시설·소유물 | start | init_game, init_custom_game, hero_creation, new_estate |
| musical_instruments | 악기 보유 | 거주지·시설·소유물 | start | init_game |
| svine | 돼지 | 거주지·시설·소유물 | start | init_game |
| horse | 말 | 거주지·시설·소유물 | start | init_game |
| dog | 개 | 거주지·시설·소유물 | start | init_game |
| $dog_name | 개 이름 | 거주지·시설·소유물 | start | init_game |
| arachnidspider | 거미 사육 | 거주지·시설·소유물 | start | init_game, init_custom_game, hero_creation |
| polypusvermin | 촉수 사육 | 거주지·시설·소유물 | start | init_game, init_custom_game, hero_creation |
| cooked_food | 준비된 식사 | 거주지·시설·소유물 | start | init_game |
| $master_wpn | 주 무기 (호환값) | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_armor | 방어구 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_scnd | 보조 장비 (호환값) | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_back_wpn | 등 무기 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_left_wpn | 왼손 무기 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_right_wpn | 오른손 무기 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_arm_wpn | 팔 장비 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_leg_wpn | 허벅지 장비 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_cloth | 평상복 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_head_gear | 투구 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_earring | 귀걸이 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_amulet | 목걸이 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_ring | 반지 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $master_karman | 주머니 장비 | 장비·유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $estate | 시작 거주지 | 거주지·시설·소유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| $starting_area | 시작 지역 안내 | 거주지·시설·소유물 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| faction_fame['neutral'] | 세력 명성 ['neutral'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| faction_fame['taurus'] | 세력 명성 ['taurus'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| faction_fame['serpis'] | 세력 명성 ['serpis'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| faction_fame['korvus'] | 세력 명성 ['korvus'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| faction_fame['kamira'] | 세력 명성 ['kamira'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game, hero_creation |
| faction_fame['RedLight'] | 세력 명성 ['RedLight'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game |
| faction_fame['centralkvartal'] | 세력 명성 ['centralkvartal'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game |
| faction_fame['otchuzhdenie'] | 세력 명성 ['otchuzhdenie'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game |
| faction_fame['fogs'] | 세력 명성 ['fogs'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game |
| faction_fame['eastkvartal'] | 세력 명성 ['eastkvartal'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game |
| faction_fame['futaland'] | 세력 명성 ['futaland'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game |
| faction_fame['russiankvartal'] | 세력 명성 ['russiankvartal'] | 자금·세력·평판 | preset | init_game, init_story_mode, init_custom_game |
| faction_purchase_futaland | 세력 구매 기록 · futaland | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_kamira | 세력 구매 기록 · kamira | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_serpis | 세력 구매 기록 · serpis | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_taurus | 세력 구매 기록 · taurus | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_korvus | 세력 구매 기록 · korvus | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_neutral | 세력 구매 기록 · neutral | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_redlight | 세력 구매 기록 · redlight | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_centralkvartal | 세력 구매 기록 · centralkvartal | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_otchuzhdenie | 세력 구매 기록 · otchuzhdenie | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_fogs | 세력 구매 기록 · fogs | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_eastkvartal | 세력 구매 기록 · eastkvartal | 자금·세력·평판 | start | init_game, init_custom_game |
| faction_purchase_russiankvartal | 세력 구매 기록 · russiankvartal | 자금·세력·평판 | start | init_game, init_custom_game |
| vibrator | 진동기 | 거주지·시설·소유물 | start | init_game, hero_creation |
| get_initial_slave | 시작 인물 지급 여부 | 게임 시작 설정 (고급) | description | init_game, init_custom_game, hero_description |
| brand_rate | 상표 평판 누적값 | 성장·누적값 (고급) | start | init_game, init_custom_game, hero_creation |
| master_vampire | 뱀파이어 | 능력치·상태·경험치 | start | init_game, init_story_mode, init_custom_game, hero_creation |
| nsfw | nsfw | 게임 시작 설정 (고급) | start | init_game |
| no_loli | no_loli | 게임 시작 설정 (고급) | start | init_game, $calculate_attributes |
| no_milf | no_milf | 게임 시작 설정 (고급) | start | init_game |
| no_mindbreak | no_mindbreak | 게임 시작 설정 (고급) | start | init_game |
| no_guro | no_guro | 게임 시작 설정 (고급) | start | init_game |
| no_futa | no_futa | 게임 시작 설정 (고급) | start | init_game |
| no_debug | no_debug | 게임 시작 설정 (고급) | start | init_game |
| game_version | game_version | 게임 시작 설정 (고급) | start | init_game |
| cheat_a | 치트 설정 · a | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_b | 치트 설정 · b | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_c | 치트 설정 · c | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_d | 치트 설정 · d | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_e | 치트 설정 · e | 게임 시작 설정 (고급) | start | init_game, hero_creation |
| cheat_f | 치트 설정 · f | 게임 시작 설정 (고급) | start | init_game, hero_creation |
| cheat_g | 치트 설정 · g | 게임 시작 설정 (고급) | start | init_game, hero_creation |
| cheat_h | 치트 설정 · h | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_i | 치트 설정 · i | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_j | 치트 설정 · j | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_k | 치트 설정 · k | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_l | 치트 설정 · l | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_ioff | 치트 설정 · ioff | 게임 시작 설정 (고급) | start | init_game |
| cheat_all_basic | 치트 설정 · all_basic | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_all_low | 치트 설정 · all_low | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_all | 치트 설정 · all | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| cheat_all_max | 치트 설정 · all_max | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| extended_rental_cheat | extended_rental_cheat | 게임 시작 설정 (고급) | start | init_game, init_custom_game, hero_creation |
| $special_age | $special_age | 게임 시작 설정 (고급) | start | init_game |
| purse | 소지금 보조값 | 자금·세력·평판 | start | init_game |
| daily_reward_count | daily_reward_count | 게임 시작 설정 (고급) | start | init_game |
| spell_adverto_servili | 습득 마법 · adverto_servili | 보유품·마법 | start | init_game |
| spell_vulnus_sanare | 습득 마법 · vulnus_sanare | 보유품·마법 | start | init_game |
| master_check | 초기 경험치 환산 완료 여부 | 성장·누적값 (고급) | start | init_game, $calculate_attributes |
| auspex | auspex | 보유품·마법 | start | init_game |
| female_virginity | 여주인 경험 상태 | 여주인 신체·설정 | preset | init_game, init_story_mode, init_custom_game |
| female['fertility'] | 가임성 | 여주인 신체·설정 | start | init_game |
| female['fertility_revealed'] | 가임성 발견 여부 | 여주인 신체·설정 | start | init_game |
| female_nipple_piercing | 유두 피어싱 | 여주인 신체·설정 | preset | init_game, init_story_mode, init_custom_game |
| sententia_veritas | sententia_veritas | 보유품·마법 | start | init_game |
| sententia_veritas_casted | sententia_veritas_casted | 게임 시작 설정 (고급) | start | init_game |
| magna_magnifika | magna_magnifika | 보유품·마법 | start | init_game |
| cruciato | cruciato | 보유품·마법 | start | init_game |
| tremendio | tremendio | 보유품·마법 | start | init_game |
| spell_revelio | 습득 마법 · revelio | 보유품·마법 | start | init_game |
| auspex_auto_cast | 자동 마법 사용 · auspex | 게임 시작 설정 (고급) | start | init_game |
| sententia_auto_cast | 자동 마법 사용 · sententia | 게임 시작 설정 (고급) | start | init_game |
| magna_magnifika_auto_cast | 자동 마법 사용 · magna_magnifika | 게임 시작 설정 (고급) | start | init_game |
| silent_auto_cast | 자동 마법 사용 · silent | 게임 시작 설정 (고급) | start | init_game |
| difficulty_setting | 복종 난이도 | 게임 시작 설정 (고급) | preset | init_game, init_story_mode, init_custom_game |
| gladiatrix_contest_count | gladiatrix_contest_count | 게임 시작 설정 (고급) | start | init_game |
| heavy_frame | 전차 프레임 | 거주지·시설·소유물 | start | init_game |
| heavy_boards | 전차 판재 | 거주지·시설·소유물 | start | init_game |
| heavy_chasis | 전차 차대 | 거주지·시설·소유물 | start | init_game |
| heavy_wheels | 전차 바퀴 | 거주지·시설·소유물 | start | init_game |
| heavy_rider_armor | 전차 기수 방어구 | 거주지·시설·소유물 | start | init_game |
| demo_game | 데모 모드 | 게임 시작 설정 (고급) | preset | init_game, init_story_mode, init_custom_game |
| story_mode | 스토리 모드 | 게임 시작 설정 (고급) | preset | init_game, init_story_mode, init_custom_game |
| custom_game | 커스텀 모드 | 게임 시작 설정 (고급) | preset | init_game, init_story_mode, init_custom_game |
| perv_revealed | perv_revealed | 게임 시작 설정 (고급) | start | init_game |
| likes_lolis | likes_lolis | 게임 시작 설정 (고급) | start | init_game |
| total_bought | total_bought | 게임 시작 설정 (고급) | start | init_game |
| lolis_bought | lolis_bought | 게임 시작 설정 (고급) | start | init_game |
| lolis_rented | lolis_rented | 게임 시작 설정 (고급) | start | init_game |
| total_bought_threshold | total_bought_threshold | 게임 시작 설정 (고급) | start | init_game |
| lolis_rented_threshold | lolis_rented_threshold | 게임 시작 설정 (고급) | start | init_game |
| is_perv | is_perv | 능력치·상태·경험치 | start | init_game, start_game, $calculate_attributes |
| loli_magic | loli_magic | 게임 시작 설정 (고급) | start | init_game, $calculate_attributes |
| libido_msg | libido_msg | 게임 시작 설정 (고급) | start | init_game, $calculate_attributes |
| hero_points | 커스텀 제작 포인트 | 게임 시작 설정 (고급) | preset | init_story_mode, init_custom_game, hero_creation |
| sparks | 시작 스파크 | 자금·세력·평판 | preset | init_story_mode, init_custom_game, hero_creation |
| female_anal_description | 여주인 신체 묘사 단계 | 여주인 신체·설정 | preset | init_story_mode, init_custom_game |
| female['clit_piercing'] | 클리토리스 피어싱 | 여주인 신체·설정 | preset | init_story_mode, init_custom_game |
| female['brand'] | 여주인 상표 | 여주인 신체·설정 | preset | init_story_mode, init_custom_game |
| female['breast_enchanced'] | 가슴 강화 | 여주인 신체·설정 | preset | init_story_mode, init_custom_game |
| female_lactation | 수유 상태 | 여주인 신체·설정 | preset | init_story_mode, init_custom_game |
| piercing_in | 피어싱 장착 상태 | 여주인 신체·설정 | preset | init_story_mode, init_custom_game |
| female_vaginal_modification | 신체 개조 상태 | 여주인 신체·설정 | preset | init_story_mode, init_custom_game |
| inventory['нагайка'] | 보관함 ['нагайка'] | 보유품·마법 | preset | init_story_mode |
| inventory['кнут'] | 보관함 ['кнут'] | 보유품·마법 | preset | init_story_mode |
| вакхический_нектар | вакхический_нектар | 보유품·마법 | preset | init_story_mode, init_custom_game, hero_creation |
| тонизируюзщий_эликсир | тонизируюзщий_эликсир | 보유품·마법 | preset | init_story_mode, init_custom_game, hero_creation |
| целительный_бальзам | целительный_бальзам | 보유품·마법 | preset | init_story_mode, init_custom_game, hero_creation |
| приворотное_зелье | приворотное_зелье | 보유품·마법 | preset | init_story_mode, init_custom_game, hero_creation |
| мощный_афодизиак | мощный_афодизиак | 보유품·마법 | preset | init_story_mode, init_custom_game, hero_creation |
| вода_леты | вода_леты | 보유품·마법 | preset | init_story_mode, init_custom_game, hero_creation |
| метаболизм_плюс | метаболизм_плюс | 보유품·마법 | preset | init_story_mode, init_custom_game, hero_creation |
| метаболизм_минус | метаболизм_минус | 보유품·마법 | preset | init_story_mode, init_custom_game, hero_creation |
| жир_плюс | жир_плюс | 보유품·마법 | preset | init_story_mode, init_custom_game, hero_creation |
| жир_минус | жир_минус | 보유품·마법 | preset | init_story_mode, init_custom_game, hero_creation |
| chaotic_essence | chaotic_essence | 보유품·마법 | preset | init_story_mode, init_custom_game |
| inventory['regal_suit'] | 보관함 ['regal_suit'] | 보유품·마법 | preset | init_story_mode |
| inventory['medic_robes'] | 보관함 ['medic_robes'] | 보유품·마법 | preset | init_story_mode |
| inventory['wizard_robes'] | 보관함 ['wizard_robes'] | 보유품·마법 | preset | init_story_mode |
| inventory['miracle_robes'] | 보관함 ['miracle_robes'] | 보유품·마법 | preset | init_story_mode |
| fridge['alcohol'] | 식료품 보관함 ['alcohol'] | 보유품·마법 | preset | init_story_mode, hero_creation |
| fridge['virgin_meat'] | 식료품 보관함 ['virgin_meat'] | 보유품·마법 | preset | init_story_mode |
| alcohol | alcohol | 게임 시작 설정 (고급) | preset | init_story_mode |
| virgin_meat | virgin_meat | 게임 시작 설정 (고급) | preset | init_story_mode |
| game_difficulty | 게임 난이도 | 게임 시작 설정 (고급) | preset | init_story_mode, hero_creation |
| master_excitement | 흥분 | 능력치·상태·경험치 | start | init_custom_game, hero_creation, start_game, $calculate_attributes |
| master_excitement_rate | 흥분 누적값 | 성장·누적값 (고급) | start | init_custom_game, hero_creation, start_game, $calculate_attributes |
| master_str_rate | 힘 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_cha_rate | 매력 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_libido_rate | 욕구 누적값 | 성장·누적값 (고급) | start | init_custom_game, start_game, $calculate_attributes |
| master_domination_rate | 지배 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_tutor_rate | 교육 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_fighter_rate | 전투 기술 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_butler_rate | 관리 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_artdirector_rate | 예술 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_medic_rate | 의학 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_mage_rate | 마법 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_torture_rate | 고문 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_bondage_rate | 결박 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_flagelation_rate | 채찍 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_petting_rate | 애무 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_oral_rate | 구강 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_penetration_rate | 삽입 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| master_fetish_rate | 페티시즘 누적값 | 성장·누적값 (고급) | start | init_custom_game, $calculate_attributes |
| guild_reputation_rate | 길드 평판 누적값 | 성장·누적값 (고급) | start | init_custom_game, hero_creation |
| master_wealth_target | 목표 재산 | 성장·누적값 (고급) | start | init_custom_game, hero_creation |
| master_wealth | 재산 평가 | 능력치·상태·경험치 | start | init_custom_game, hero_creation |
| noble_status | 귀족 지위 | 자금·세력·평판 | start | init_custom_game, hero_creation |
| boudoir | 개인실 | 거주지·시설·소유물 | start | init_custom_game, hero_creation, new_estate |
| pen | 우리 | 거주지·시설·소유물 | start | init_custom_game, hero_creation, new_estate |
| фламберг | фламберг | 보유품·마법 | start | init_custom_game, hero_creation |
| нагината | нагината | 보유품·마법 | start | init_custom_game, hero_creation |
| моргенштерн | моргенштерн | 보유품·마법 | start | init_custom_game, hero_creation |
| грейтекс | грейтекс | 보유품·마법 | start | init_custom_game, hero_creation |
| бита | бита | 보유품·마법 | start | init_custom_game, hero_creation |
| скотобой | скотобой | 보유품·마법 | start | init_custom_game, hero_creation |
| кнут | кнут | 보유품·마법 | start | init_custom_game, hero_creation |
| шпага | шпага | 보유품·마법 | start | init_custom_game, hero_creation |
| рапира | рапира | 보유품·마법 | start | init_custom_game, hero_creation |
| кончар | кончар | 보유품·마법 | start | init_custom_game, hero_creation |
| гладиус | гладиус | 보유품·마법 | start | init_custom_game, hero_creation |
| бастард | бастард | 보유품·마법 | start | init_custom_game, hero_creation |
| мачете | мачете | 보유품·마법 | start | init_custom_game, hero_creation |
| катана | катана | 보유품·마법 | start | init_custom_game, hero_creation |
| трезубец | трезубец | 보유품·마법 | start | init_custom_game, hero_creation |
| демократизатор | демократизатор | 보유품·마법 | start | init_custom_game, hero_creation |
| кинжал | кинжал | 보유품·마법 | start | init_custom_game, hero_creation |
| стилет | стилет | 보유품·마법 | start | init_custom_game, hero_creation |
| кастет | кастет | 보유품·마법 | start | init_custom_game, hero_creation |
| нагайка | нагайка | 보유품·마법 | start | init_custom_game, hero_creation |
| глушилка | глушилка | 보유품·마법 | start | init_custom_game, hero_creation |
| тесак | тесак | 보유품·마법 | start | init_custom_game, hero_creation |
| мулава | мулава | 보유품·마법 | start | init_custom_game, hero_creation |
| плейт | плейт | 보유품·마법 | start | init_custom_game, hero_creation |
| кольчуга | кольчуга | 보유품·마법 | start | init_custom_game |
| посох_огня | посох_огня | 보유품·마법 | start | init_custom_game |
| comfy_robes | comfy_robes | 게임 시작 설정 (고급) | start | init_custom_game |
| fancy_suit | fancy_suit | 게임 시작 설정 (고급) | start | init_custom_game |
| regal_suit | regal_suit | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| formal_suit | formal_suit | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| aketon | aketon | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| livery | livery | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| medic_robes | medic_robes | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| wizard_robes | wizard_robes | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| raven_crown | raven_crown | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| chimera_earring | chimera_earring | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| snake_amulet | snake_amulet | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| bull_ring | bull_ring | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| obereg | obereg | 게임 시작 설정 (고급) | start | init_custom_game, hero_creation |
| raven_crown_on | raven_crown_on | 장비·유물 | start | init_custom_game, hero_creation |
| chimera_gem_on | chimera_gem_on | 장비·유물 | start | init_custom_game, hero_creation |
| snake_amulet_on | snake_amulet_on | 장비·유물 | start | init_custom_game, hero_creation |
| bull_ring_on | bull_ring_on | 장비·유물 | start | init_custom_game, hero_creation |
| obereg_on | obereg_on | 장비·유물 | start | init_custom_game, hero_creation |
| item_supermacy_bonus | item_supermacy_bonus | 장비·유물 | start | init_custom_game, hero_creation |
| spawn_semen | spawn_semen | 보유품·마법 | start | init_custom_game, hero_creation |
| cheat_m | 치트 설정 · m | 게임 시작 설정 (고급) | start | hero_creation |
| inventory['stethoscope'] | 보관함 ['stethoscope'] | 보유품·마법 | start | hero_creation |
| spm_learned['удар_с_разворота'] | 습득한 전투 기술 ['удар_с_разворота'] | 보유품·마법 | start | hero_creation |
| spm_learned['рассечение'] | 습득한 전투 기술 ['рассечение'] | 보유품·마법 | start | hero_creation |
| spm_learned['воинственный_клич'] | 습득한 전투 기술 ['воинственный_клич'] | 보유품·마법 | start | hero_creation |
| spm_learned['подрезка'] | 습득한 전투 기술 ['подрезка'] | 보유품·마법 | start | hero_creation |
| spm_learned['ослепление'] | 습득한 전투 기술 ['ослепление'] | 보유품·마법 | start | hero_creation |
| spm_learned['оглушение'] | 습득한 전투 기술 ['оглушение'] | 보유품·마법 | start | hero_creation |
| spm_learned['ответный_удар'] | 습득한 전투 기술 ['ответный_удар'] | 보유품·마법 | start | hero_creation |
| spm_learned['лицо_прикладом'] | 습득한 전투 기술 ['лицо_прикладом'] | 보유품·마법 | start | hero_creation |
| $master_spm[1] | 선택한 전투 기술 [1] | 보유품·마법 | start | hero_creation |
| $master_spm[2] | 선택한 전투 기술 [2] | 보유품·마법 | start | hero_creation |
| $master_spm[3] | 선택한 전투 기술 [3] | 보유품·마법 | start | hero_creation |
| $master_spm[4] | 선택한 전투 기술 [4] | 보유품·마법 | start | hero_creation |
| $master_spm[5] | 선택한 전투 기술 [5] | 보유품·마법 | start | hero_creation |
| $master_spm[6] | 선택한 전투 기술 [6] | 보유품·마법 | start | hero_creation |
| $master_spm[7] | 선택한 전투 기술 [7] | 보유품·마법 | start | hero_creation |
| $master_spm[8] | 선택한 전투 기술 [8] | 보유품·마법 | start | hero_creation |
| fridge['vegetables'] | 식료품 보관함 ['vegetables'] | 보유품·마법 | start | hero_creation |
| fridge['grain'] | 식료품 보관함 ['grain'] | 보유품·마법 | start | hero_creation |
| fridge['spice'] | 식료품 보관함 ['spice'] | 보유품·마법 | start | hero_creation |
| fridge['cheese'] | 식료품 보관함 ['cheese'] | 보유품·마법 | start | hero_creation |
| fridge['eggs'] | 식료품 보관함 ['eggs'] | 보유품·마법 | start | hero_creation |
| fridge['milk'] | 식료품 보관함 ['milk'] | 보유품·마법 | start | hero_creation |
| fridge['cream'] | 식료품 보관함 ['cream'] | 보유품·마법 | start | hero_creation |
| fridge['mince'] | 식료품 보관함 ['mince'] | 보유품·마법 | start | hero_creation |
| fridge['meat'] | 식료품 보관함 ['meat'] | 보유품·마법 | start | hero_creation |
| lab_store['slime'] | 연구 재료 ['slime'] | 보유품·마법 | start | hero_creation |
| lab_store['kanabis'] | 연구 재료 ['kanabis'] | 보유품·마법 | start | hero_creation |
| lab_store['koffe'] | 연구 재료 ['koffe'] | 보유품·마법 | start | hero_creation |
| lab_store['meth'] | 연구 재료 ['meth'] | 보유품·마법 | start | hero_creation |
| lab_store['opium'] | 연구 재료 ['opium'] | 보유품·마법 | start | hero_creation |
| inventory['deprivation_suit'] | 보관함 ['deprivation_suit'] | 보유품·마법 | start | hero_creation |
| inventory['vaginal_balls'] | 보관함 ['vaginal_balls'] | 보유품·마법 | start | hero_creation |
| inventory['anal_plug'] | 보관함 ['anal_plug'] | 보유품·마법 | start | hero_creation |
| inventory['secure_gag'] | 보관함 ['secure_gag'] | 보유품·마법 | start | hero_creation |
| inventory['chastity_belt'] | 보관함 ['chastity_belt'] | 보유품·마법 | start | hero_creation |
| inventory['pissuar_stable'] | 보관함 ['pissuar_stable'] | 보유품·마법 | start | hero_creation |
| inventory['toilet_stable'] | 보관함 ['toilet_stable'] | 보유품·마법 | start | hero_creation |
| wizard_mode | 특수 주인공 모드 | 게임 시작 설정 (고급) | start | start_game |
| $interior | 인테리어 | 거주지·시설·소유물 | residence | start_game |
| day | day | 게임 시작 설정 (고급) | start | start_game |
| decade | decade | 게임 시작 설정 (고급) | start | start_game |
| decadecount | decadecount | 게임 시작 설정 (고급) | start | start_game |
| ride_count | ride_count | 게임 시작 설정 (고급) | start | start_game |
| auction_count | auction_count | 게임 시작 설정 (고급) | start | start_game |
| gladi_count | gladi_count | 게임 시작 설정 (고급) | start | start_game |
| is_kid | 특수 주인공 분류 | 능력치·상태·경험치 | start | start_game |
| is_master_virgin | 주인공 미경험 상태 | 능력치·상태·경험치 | start | start_game |
| is_gangbang | 단체 행동 설정 | 게임 시작 설정 (고급) | start | start_game |
| stasis_tank | 냉동 보관 시설 | 거주지·시설·소유물 | start | new_estate |
| master_wounds | 부상 | 능력치·상태·경험치 | start | $calculate_attributes |
| master_perv_rate | 특수 욕구 진행 누적값 | 성장·누적값 (고급) | start | $calculate_attributes |
| master_mood_rate | 기분 누적값 | 성장·누적값 (고급) | start | $calculate_attributes |
| guild_reputation | 길드 평판 | 자금·세력·평판 | start | $calculate_attributes |
| master_hygiene | 청결 등급 | 능력치·상태·경험치 | start | $calculate_attributes |
| master_hygiene_rate | 청결 누적값 | 성장·누적값 (고급) | start | $calculate_attributes |
| master_ill | 질병 상태 | 능력치·상태·경험치 | start | $calculate_attributes |
| master_issues | 개인 문제 상태 | 능력치·상태·경험치 | start | $calculate_attributes |
| master_wounds_rate | 부상 누적값 | 성장·누적값 (고급) | start | $calculate_attributes |
| master_half_action | 행동력 반점 잔여 | 능력치·상태·경험치 | start | $calculate_attributes |
| master_moodlet['neg_master_overexerted'] | 주인공 무들렛 ['neg_master_overexerted'] | 능력치·상태·경험치 | start | $calculate_attributes |
| master_supermacy | 장악력 | 능력치·상태·경험치 | start | $calculate_attributes |
| master_mood | 기분 등급 | 능력치·상태·경험치 | start | $moodlets_account |
| debt | 부채 | 자금·세력·평판 | start |  |
| debt_count | 부채 횟수 | 자금·세력·평판 | start |  |
| debt_history | 부채 이력 | 자금·세력·평판 | start |  |
| female['age'] | 여주인 연령 분류 | 여주인 신체·설정 | start |  |

## 다른 기능에 속해 중복 등록하지 않은 항목

| 식별자 | 이유 | 출처 |
|---|---|---|
| $assistant['armor'] | 다른 인물/업무의 시작 상태 | init_game, init_story_mode |
| $barn | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bath | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation, new_estate |
| $bed | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation, new_estate |
| $bg['barn'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['barn_lux'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['bathroom'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['bathroom_lux'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['bedroom'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['bedroom_lux'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['boudoir'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['boudoir_lux'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['dungeon'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['dungeon_lux'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['home_lux'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['kitchen'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['kitchen_lux'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['lab'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['lab_lux'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $bg['study'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $boudoir | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation, new_estate |
| $curmod | 다른 실행 상태 | $moodlets_account |
| $current_sub | 화면/초기화 절차의 실행 임시값 | init_custom_game, init_game, init_story_mode |
| $difficulty_description[0] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| $difficulty_description[1] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| $difficulty_description[2] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| $dungeon | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation, new_estate |
| $kitchen | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation, new_estate |
| $lab | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation, new_estate |
| $libido_msg[1] | 다른 실행 상태 | $calculate_attributes |
| $libido_msg[2] | 다른 실행 상태 | $calculate_attributes |
| $libido_msg[3] | 다른 실행 상태 | $calculate_attributes |
| $libido_msg[4] | 다른 실행 상태 | $calculate_attributes |
| $libido_msg[5] | 다른 실행 상태 | $calculate_attributes |
| $master_ava | 다른 전용 편집 항목 또는 인물 선택 번호 | hero_creation, hero_description, init_game |
| $master_ava_color | 다른 전용 편집 항목 또는 인물 선택 번호 | hero_creation, hero_description, init_game |
| $master_energy_stars | 다른 실행 상태 | $calculate_attributes |
| $master_mood_list | 다른 실행 상태 | $moodlets_account |
| $master_name | 다른 전용 편집 항목 또는 인물 선택 번호 | hero_description, init_game, start_game |
| $msg_backimage | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| $msg_format | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| $msg_ok_image | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| $place | 화면/초기화 절차의 실행 임시값 | start_game |
| $place_info['barn'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_info['bathroom'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_info['bedroom'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_info['boudoir'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_info['dungeon'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_info['kitchen'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_info['lab'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_info['study'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_location['barn'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_location['bathroom'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_location['bedroom'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_location['boudoir'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_location['dungeon'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_location['kitchen'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_location['lab'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_location['study'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_name['barn'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_name['bathroom'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_name['bedroom'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_name['boudoir'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_name['dungeon'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_name['kitchen'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_name['lab'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $place_name['study'] | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | new_estate |
| $preset_name[1] | 메뉴·경로·퀘스트 참조 자료 | init_game |
| $preset_name[2] | 메뉴·경로·퀘스트 참조 자료 | init_game |
| $preset_name[3] | 메뉴·경로·퀘스트 참조 자료 | init_game |
| $preset_name[4] | 메뉴·경로·퀘스트 참조 자료 | init_game |
| $preset_name[5] | 메뉴·경로·퀘스트 참조 자료 | init_game |
| $preset_name[6] | 메뉴·경로·퀘스트 참조 자료 | init_game |
| $secondary_stt | 화면/초기화 절차의 실행 임시값 | hero_description |
| $slave['armor'] | 다른 인물/업무의 시작 상태 | init_game, init_story_mode |
| $slave_assistant_management | 다른 인물/업무의 시작 상태 | init_game |
| $study | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation, new_estate |
| $tmp | 다른 실행 상태 | $calculate_attributes |
| $trace[12] | 메뉴·경로·퀘스트 참조 자료 | start_game |
| $trace[1] | 메뉴·경로·퀘스트 참조 자료 | start_game |
| $update_master_energy_stars | 함수/메뉴 코드 · QSP 이벤트에서 편집 | $calculate_attributes |
| $защита[0] | 전투 메뉴 동작 코드 · QSP 이벤트에서 편집 | init_game |
| $суперудар[1] | 전투 메뉴 동작 코드 · QSP 이벤트에서 편집 | init_game |
| $суперудар[2] | 전투 메뉴 동작 코드 · QSP 이벤트에서 편집 | init_game |
| $суперудар[3] | 전투 메뉴 동작 코드 · QSP 이벤트에서 편집 | init_game |
| $суперудар[4] | 전투 메뉴 동작 코드 · QSP 이벤트에서 편집 | init_game |
| $суперудар[5] | 전투 메뉴 동작 코드 · QSP 이벤트에서 편집 | init_game |
| $суперудар[6] | 전투 메뉴 동작 코드 · QSP 이벤트에서 편집 | init_game |
| a | 화면/초기화 절차의 실행 임시값 | init_game, start_game |
| assistant['domini_dictum'] | 다른 인물/업무의 시작 상태 | init_game |
| assistant['nude'] | 다른 인물/업무의 시작 상태 | init_game |
| assistant['rewarded_today'] | 다른 인물/업무의 시작 상태 | init_custom_game, init_game, init_story_mode |
| assistant_exhaustion_fainted | 다른 인물/업무의 시작 상태 | init_game |
| assistant_nearly_fainted | 다른 인물/업무의 시작 상태 | init_game |
| assistant_rules['sleep_condition'] | 다른 인물/업무의 시작 상태 | init_custom_game, init_game, init_story_mode |
| assistant_stamina_fainted | 다른 인물/업무의 시작 상태 | init_game |
| brand_reputation | 다른 실행 상태 | $calculate_attributes |
| change_loc | 화면/초기화 절차의 실행 임시값 | init_game |
| code_defined['update_master_energy_stars'] | 다른 실행 상태 | $calculate_attributes |
| contractor_demand['max_temper'] | 다른 인물/업무의 시작 상태 | start_game |
| contractor_demand['refuse_age'] | 다른 인물/업무의 시작 상태 | start_game |
| daycount | 화면/초기화 절차의 실행 임시값 | init_game |
| event_get['doagirls'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| event_get['girl'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| event_get['isabella'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| event_get['madelyn'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| event_get['snegurochka'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| event_met['Julia'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| event_met['doagirls'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| event_met['girl'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| event_met['isabella'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| event_met['madelyn'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| event_met['snegurochka'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| first_visit['hero_creation'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | hero_creation |
| hero_choice | 다른 전용 편집 항목 또는 인물 선택 번호 | hero_creation, init_custom_game, init_game |
| hero_select | 다른 전용 편집 항목 또는 인물 선택 번호 | start_game |
| href | 화면/초기화 절차의 실행 임시값 | hero_description |
| i | 화면/초기화 절차의 실행 임시값 | $calculate_attributes, $moodlets_account, start_game |
| id | 화면/초기화 절차의 실행 임시값 | hero_description |
| is_home | 화면/초기화 절차의 실행 임시값 | start_game |
| is_perv | 다른 실행 상태 | $calculate_attributes |
| isabella_get | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | hero_creation, init_custom_game |
| libido_msg | 다른 실행 상태 | $calculate_attributes |
| loli_magic | 다른 실행 상태 | $calculate_attributes |
| madelyn | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| mira | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| msg_ok_x | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| msg_ok_y | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| msg_text_h | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| msg_text_w | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| msg_text_x | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| msg_text_y | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| msg_x | 화면 배치/배경 참조 · 거주지/인테리어로 계산 | hero_creation |
| n | 다른 실행 상태 | $moodlets_account |
| no_loli | 다른 실행 상태 | $calculate_attributes |
| one_time_virgin_bonus | 다른 실행 상태 | $calculate_attributes |
| pelageya | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| pelageya2 | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| prisoner['domini_dictum'] | 다른 인물/업무의 시작 상태 | init_game |
| release_notes_message | 화면/초기화 절차의 실행 임시값 | init_game |
| slave['domini_dictum'] | 다른 인물/업무의 시작 상태 | init_game |
| slave['rewarded_today'] | 다른 인물/업무의 시작 상태 | init_custom_game, init_game, init_story_mode |
| slave['vs_bonus'] | 다른 인물/업무의 시작 상태 | init_game |
| slave_exhaustion_fainted | 다른 인물/업무의 시작 상태 | init_game |
| slave_nearly_fainted | 다른 인물/업무의 시작 상태 | init_game |
| slave_stamina_fainted | 다른 인물/업무의 시작 상태 | init_game |
| snezhana | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| src | 화면/초기화 절차의 실행 임시값 | hero_description |
| train_slave_count['madame_jofre'] | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | start_game |
| trainer_slave_training_count['applejack'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['avgia'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['geralt'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['giess'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['goji'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['ippolita'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['jeevs'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['ling'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['marivana'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['master_s'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['minosia'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['mistress_angelika'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['morrigan'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['rabban'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['sheepherd'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['von_valtz'] | 다른 인물/업무의 시작 상태 | start_game |
| trainer_slave_training_count['yodson'] | 다른 인물/업무의 시작 상태 | start_game |
| trophy_beastmen | 다른 실행 상태 | $calculate_attributes |
| trophy_blackmedic | 다른 실행 상태 | $calculate_attributes |
| trophy_goblins | 다른 실행 상태 | $calculate_attributes |
| trophy_hugefiend | 다른 실행 상태 | $calculate_attributes |
| trophy_lich | 다른 실행 상태 | $calculate_attributes |
| trophy_maturefiend | 다른 실행 상태 | $calculate_attributes |
| trophy_ogre | 다른 실행 상태 | $calculate_attributes |
| trophy_orc | 다른 실행 상태 | $calculate_attributes |
| trophy_paladin | 다른 실행 상태 | $calculate_attributes |
| trophy_scum | 다른 실행 상태 | $calculate_attributes |
| trophy_vampire | 다른 실행 상태 | $calculate_attributes |
| trophy_warg | 다른 실행 상태 | $calculate_attributes |
| trophy_werewolf | 다른 실행 상태 | $calculate_attributes |
| trophy_youngfiend | 다른 실행 상태 | $calculate_attributes |
| txt | 화면/초기화 절차의 실행 임시값 | start_game |
| ui_style | 화면/초기화 절차의 실행 임시값 | init_game, start_game |
| venera | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| venera2 | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
| was_virgin | 다른 실행 상태 | $calculate_attributes |
| zhanna | NPC/이벤트 진행 상태 · 인물 능력치가 아님 | init_game |
