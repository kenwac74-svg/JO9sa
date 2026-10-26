# 장비 선택 툴팁 복구 패치 설명 — 2026-10-21

이 폴더는 패치·진단 산출물이다. 이 작업 에이전트는 Work·Full·저장소·세이브를 쓰지 않았다. 적용은 상위 작업의 통합 후보와 출고 검사에 맡긴다.

- 기준 QSP: `1e911ced3798826e8cd1f35ed1e4115e9fd6450a9fdecaeb231b5f6885c1abb4`
- 장비 단독 후보: `b4aac51a0654c8344066c8277b54118ec5d219fe5ba473c7ca61137bae51506f`
- 패치: `patches/2026-10-21_equipment_tooltip_restore.json`, 22개 exact old/new 편집, 바뀌는 location은 `#dynamic`, `$newloc` 두 곳이다.

## 동작과 범위

현재 실행되는 장비 선택 anchor는 189개다. 고정 아이템 링크188개 중 착용 해제12개를 제외한176개에 `class="tooltip-left"`와 `tooltip-data`를 연결한다. 나머지 공통 `$get_non_combat_equipment` anchor1개도 같은 설명 함수를 호출하므로 그 helper를 쓰는 노예·조수 비전투 장비 목록에 적용된다. 과거379/380발생에는 실행되지 않는 주석 예시가 섞여 있다. 모든 기존 주석과 비활성화된 혀 장신구 조건은 그대로다.

각 링크는 렌더링 시 `#dynamic`의 `$jo9_equipment_tooltip`을 `$dyneval`로 호출한다. 입력 `$args[0]`은 현재 링크의 아이템 키이며, 반환값 `$result`는 현재 `$item_description[키]`를 읽어 만든 HTML 속성용 문자열이다. 과거의 고정 설명은 복사하지 않는다. 최신 설명의 정의가 있는 `#item_base` 및 `#боевые_предметы`는 변경하지 않는다.

정규화는 br 계열 태그를 공백으로 바꾸고 나머지 알파벳 이름 HTML 태그를 제거한다. `&`, 큰따옴표, 작은따옴표, `<`, `>`를 각각 속성에 안전하게 인코딩하고 CR/LF를 공백으로 바꾼다. 원본 설명 변수는 건드리지 않는다. 현재 설명 정의에는 이미 인코딩된 HTML 엔티티가 없으며, 이 함수는 엔티티를 별도로 디코딩하지 않는다.

`href` 전체, 선택 표시·수량, 재고 조건, 슬롯, 강제 라벨, `item_change` 인수, 착용·해제 코드와 CSS는 바꾸지 않는다. 공통 helper의 `args[3]`은 기존대로 아우라 귀속 아이콘의 표시 여부만 제어하며, 아이템 설명 툴팁은 그대로 표시한다.

## 호출·의존성과 제거 시 영향

- 직접 호출자는 `master_*_list`, `slave_armor_list`/`slave_wpn_list*`, `assistant_armor_list`/`assistant_wpn_list*` 등20개 고정 링크 목록이다. 전체 이름과 개수는 `change-summary.json`의 `functions`에 있다.
- 비전투 호출자는 `$get_non_combat_equipment`를 `dynslave` 치환 후 실행하는 기존 노예·조수 장비 목록이다. 그 목록의 호출부와 아우라 툴팁 helper는 그대로다.
- 의존성은 현재 `$item_description` 데이터, 기존 `$dyneval`/`$strfind`/`$replace`, 기존 `tooltip-left` CSS다.
- 새 location과 새 인물 상태 필드·세이브 변환은 없다. 새 `$jo9_equipment_tooltip` 코드 문자열은 다른 동적 helper처럼 세이브에 캐시될 수 있다. 임시 `jo9_eq_text`, `jo9_eq_tag`는 반환 전에 `killvar`로 정리하며 기준 QSP에 같은 이름은 없었다.
- formatter만 지우고 링크 연결을 남기면 설명이 빈 값이 될 수 있다. 전체 `EQUIPMENT_TOOLTIP_*` 블록을 함께 되돌리면 장비 링크의 기존 클릭 동작만 남는다. CSS는 이 패치 밖에서 유지된다.

안정적인 경계 ID는 `EQUIPMENT_TOOLTIP_TEXT_20261021`, `EQUIPMENT_TOOLTIP_GET_NON_COMBAT_EQUIPMENT_20261021`, 각 목록의 `EQUIPMENT_TOOLTIP_<목록명>_20261021`, `EQUIPMENT_TOOLTIP_SAVE_CACHE_20261021`이다. JSON의 old/new는 각 변경 블록의 원문과 결과를 정확히 보관한다.

## 기존 세이브 캐시

현재 정상 불러오기 흐름은 `$ongload`가 `saved_game_loaded=1`을 기록하고, `$newloc`가 `$addon`의 `update/full`을 호출하며, `refresh_database`가 `#dynamic`, `#item_base`, `#боевые_предметы`를 다시 읽는다. 따라서 실제 정상 로드에서는 현재 설명 데이터와 현재 링크 helper가 함께 준비된다.

추가 호환 조치는 `$newloc`에 이미 있는 `jo9_meiki_revision` 갱신 문턱을214348873에서214348874로 한 단계 올리는 것뿐이다. 기존 `gs '#static_base'`, `gs '#dynamic'` 경로를 재사용하여 이미 메모리에 남은 낡은 목록 코드도 한 번 교체한다. 새 영속 개정 변수나 전체 데이터 초기화는 추가하지 않는다. 이 짧은 경로 자체는 `#item_base`/`#боевые_предметы`를 강제로 다시 읽지 않으며 정상 불러오기 흐름이 설명 데이터를 갱신한다. 이미 새 개정값이면 다시 초기화하지 않는 것을 실제 엔진에서 확인했다.

## 검증과 재현

`build-tests.cjs <검사할 QSP> <게임 폴더 밖 출력 폴더>`로4개 진단 QSP를 만든 뒤 기존 `tools/qa/run-client-smoke.ps1`을 설치된 FastQSP `engine/jack.exe`에 연결해 실행한다. 입력 QSP와 세이브는 수정하지 않고, 진단 사본의 Start만 검사 코드로 바꾼다.

- `red-complete`: 같은 최종 검사로 기준 QSP4경로가 각각 MISSING_TOOLTIP, MISSING_TOOLTIP, STALE_REVISION, STALE_COMBAT_DESCRIPTION 메시지로 실패했다.
- `green-complete`: 장비 단독 최종 후보4경로가 모두 완료 메시지와 함께 통과했다. 경로 수와 내부 assertion 개수를 같은 수로 보고하지 않는다. 세부 검사항목은 `RESULT.json`의 `greenScenarioContracts`에 있다.
- 특수문자·따옴표·HTML·원문 `<<6+7>>`의 안전 출력, 원래 href와 수량·라벨, 아우라 인수·1/4표시, 빈 설명, 임시 변수 정리, 캐시1회 갱신, 실제 최신 한국어 설명·수치를 검사했다.
- core 코덱의 바이트 왕복과 qsp_dump의 독립 파싱262location을 확인했다. 기존 모든 활성 item_change href와 주석, 다른 location/field가 보존되는 정적 대조도 통과했다.

최초 호환 시도와 테스트 입력 구성 오류가 있던 중간 실패는 PASS로 취급하지 않는다. `RESULT.json`의 `supersededAttempts`와 해당 로그에 남겼다. 최종 기대값은 낮추지 않았고, QSP가 테스트 입력의 보간식을 미리 계산하지 않도록 문자열 연결로 입력을 만들었다.

실제 세이브 UI 불러오기, 마우스로 올렸을 때의 배치와 글자 잘림, 실제 착용 전환은 확인하지 않았다. 원래 착용 handler와 클릭 명령은 바이트 그대로이며, 전체 출고 검사·명기 패치와의 통합 후보는 상위 작업에서 별도 검사한다.

진단 QSP와 재생성 가능한 중간 사본은 상위 작업에서 통합 검증 후 정리하며, 패치·변경 명세·이 설명서·재현 스크립트와 로그만 남긴다.
