# 종합정보 갱신 · 클린 세이브 분석과 헛간 오타 인계 (2026-11-23)

- 대상 WORK: `G:\somi\Jack O Nine Tails v2.4_work\game\jack.qsp`
  - 2026-11-23 01:03:05, SHA-256 `1914daaa3ea178770da2ab93fc9a675388086e310ce1b201246ecbb5d94f2907`
- 이 문서는 분석과 수정 기획만 담는다. WORK·mods는 바꾸지 않았다.
- 적용은 모드 개발 담당이 `mods/` 선언형 JSON → `tools\apply_mods.ps1` 절차로 한다.

## 1. 종합정보 갱신 버튼 (상단 바 톱니 콘솔 아이콘)

- 위치: 상단 바 HTML, `<div id="refresh_database_icon">`, 툴팁 `종합정보 갱신`, 이미지 `content/pic/ui/buttons/legacy/gear_console.png`
- 실행 코드:
  ```
  gs 'interior_storage' & gs 'refresh_database' & gs 'interior_restore' & play 'content/snd/kkm.wav', sound_volume & gt $curloc
  ```
- 원작자(crushboss)가 만든 옛 세이브 호환용 기능이다. 원 주석은 "완벽한 해결책은 아니지만 도움이 된다"는 취지다.

| 단계 | location | 하는 일 |
|---|---|---|
| 1 | `interior_storage` | `ui_style`, `nsfw`, 방 인테리어(`$study $bed $bath $dungeon $kitchen $lab $boudoir $barn`)를 `previous_*` 변수에 보관 |
| 2 | `refresh_database` | 데이터 location 전체를 다시 실행: `#static_base`, `#static_txt`, `#dynamic`, `#food_base`, `#variative`, `#help_msg`, `#item_base`, `#masters_base`, `#moodlet_base`, `#simple_npc`, `#npc_base`, `#options`, `#place_base`, `#estate_base`, `#var_base`, `#txt_man`, `#txt_2_man`, `#chariots_base`, `#quest_base`, `#event_base`, 전투 엔진 4개, `#sex_texts`, `#sex_options`. 시작할 때 `code_defined`, `first_visit`를 지운다. |
| 3 | `interior_restore` | 보관한 값을 되돌리고 방 배경·이름·설명(`$bg`, `$place_name` 등)을 다시 만든다. |
| 4 | — | 효과음을 재생하고 `gt $curloc`으로 현재 화면을 다시 그린다. |

- 진행 상태(스탯·돈·날짜)를 직접 지우는 코드는 없다. 다만 데이터 location 안에서 진행 변수를 초기값으로 덮어쓰는 경우가 있는지는 location마다 확인하지 않았다.
- 자동 호출처: `main_menu`, `$addon`, `$ongload`, `jo9_liquidation`, `jo9_ledger_end`.
  - `$ongload`에서는 파산 청산 중일 때, 딜러 옛 확인 상태일 때, 판매 견적 화면일 때 호출한다.

## 2. 클린 세이브 만들기 (설정 화면)

- 링크: `jo9_save_maintenance`의 `clean_link`. `menu_form`의 두 설정 화면(`CLEAN_SAVE_OPTION_20261118`)에 붙어 있다.
- `make_clean` 동작:
  1. `can_clean` 검사. 집 기본 화면(`menu_form=2000`)이나 도시 기본 화면(`city_form=1000`)에서만 허용한다. 전투(`mode=1`), `get_weapon>0`, `exam_in_progress>0`이면 막는다.
  2. `gs 'jo9_save_maintenance','clean'`
     - 대사 캐시(`$voice_fragment_*`, `voice_fragment_*`)를 삭제한다. `$voice_pick_fragment`의 지연 로드 패치가 확인될 때만 삭제한다.
     - `$masters_vars`를 삭제한다.
     - `$meal_id`가 76개 음식의 반복이면 첫 76개만 남긴다.
  3. `savegame`으로 저장한다.
- 저장 훅: `$ongsave = 'jo9_save_maintenance'`라서 `$masters_vars` 삭제와 `$meal_id` 정리는 저장할 때마다 실행된다. 대사 캐시 삭제는 `clean` 모드에서만 한다.

## 3. 두 기능의 차이와 관계

| | 종합정보 갱신 | 클린 세이브 |
|---|---|---|
| 출처 | 원작 | JO9 모드 (2026-11-18) |
| 목적 | 새 qsp 데이터를 옛 세이브에 덮어쓰기 | 세이브 군더더기 정리 후 저장 |
| 저장 | 하지 않음 | 함 |
| 사용 위치 | 어디서나 | 기본 화면만 |

- `#food_base`는 실행될 때마다 `$meal_id[] = $_fb_meal_name`으로 76개를 다시 덧붙인다. 그래서 갱신할 때마다 `$meal_id`가 76개씩 늘고, 클린 세이브나 일반 저장이 이를 76개로 줄인다.
- 업데이트 뒤 옛 세이브를 쓸 때 권장 순서는 종합정보 갱신 → 클린 세이브 만들기(새 이름으로 저장)다.

## 4. 수정 기획: 헛간 인테리어 오타 (미적용)

- 증상: `interior_storage`가 헛간 값을 오타 변수에 저장한다.
  ```
  if barn > 0: $prvious_barn = $barn
  ```
  `interior_restore`는 `$previous_barn`에서 읽는다.
  ```
  if barn > 0: $barn = $previous_barn
  ```
  `$previous_barn`을 설정하는 곳은 qsp 전체에 없다. 그래서 헛간이 있으면 갱신 버튼이나 파산 청산 로드 경로를 거칠 때 `$barn`이 빈 문자열이 될 가능성이 크다. 게임에서 직접 재현하지는 않았다.
- 수정안: `interior_storage`에서 `$prvious_barn` → `$previous_barn` (count 1).
  - 원작 코드를 바꾸는 것이므로 JO9 MOD 마커로 감싼다.
- 확인 포인트:
  1. 헛간을 산 세이브에서 헛간 인테리어를 기본값이 아닌 것으로 바꾼 뒤 종합정보 갱신을 누른다. 헛간 배경과 인테리어가 그대로 남는지 본다.
  2. 헛간이 없는 세이브에서 갱신을 눌러도 오류가 없는지 본다.
- `interior_restore`에서 헛간 배경(`$bg` 등)을 다시 만드는 블록이 있는지는 이번에 확인하지 않았다. 적용할 때 함께 본다.
