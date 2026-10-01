# QSP 변경 작업 프로세스 (2026-10-01 확정)

## 결정 (사용자, 2026-10-01)
**QSP 최종 변경 권한은 실시간모딩 세션(게임 수정 세션)이 갖고, UI 화면 코드는 UI패치모드 세션이 계속 맡는다.** 빌드·패키징은 UI패치모드 세션이 한다.

## 역할
| 담당 | 하는 일 |
|---|---|
| **게임 수정 세션(이 repo의 Claude)** | `jack.qsp` 최종 변경 권한. UI 화면 코드 location 밖의 모든 변경(대사·로직·메뉴 문구·분기·변수)을 직접 하고 `mods/*.json`으로 기록한다. UI 세션의 QSP 변경이 최종본에 들어가기 전에 충돌을 점검하고 승인한다. |
| **UI패치모드 세션** | UI 화면 코드(아래 소유 location)를 계속 작성하고, UI 이미지·CSS·설치기를 만들고, 빌드·패키징을 한다. 소유 location 밖의 QSP 변경은 의뢰한다. |
| **사용자** | 의뢰 전달 시점 결정, 게임에서 확인, PR 병합과 패키징 승인. |

### UI 화면 코드 소유 location (UI 세션 보고 기준, 0.13 패키지)
- 0.12부터 UI 패키지는 완성된 `jack.qsp`를 통째로 넣는다. 0.13은 location 243개가 순정과 다르고 새 location 5개가 있다(UI 세션 보고, 이 세션이 직접 확인한 것은 아니다).
- **새로 추가한 location 5개(개인실 연결):** `snk_room_bridge`, `snk_room_menu_screen`, `snk_room_diet_migrate`, `snk_room_birth_check`, `snk_room_birth_return`.
- **모든 location 맨 위의 개인실 진입 보호 줄** `if snk_room_target > 0 and $curloc = '…': gs 'snk_room_bridge', 'guard', '…'`: 181개에는 이 줄만 붙었고, 27개는 이 줄과 이미지 경로만 바뀌었다. `city_menu_form`에도 이 줄이 한 줄 붙어 있다.
- **내용이 바뀐 35개(UI 소유):**
  - 화면: `_layout`, `main_layout`, `stats_layout`, `menu_form`, `sjm_UI_UIadds`, `debug_info`, `$newloc`, `$ride_start`, `next_day`, `main_screen`, `master_stat`, `slave_stat`, `assistant_stat`, `interaction`, `city_screen`, `interaction_city`, `ride_interface`, `trophy_room_screen`, `slave_private_room1`~`4`, `#food_base`, `конец_боя`, `раскладка_бой`, `боевой_интерфейс`, `sex_screen`, `sex_screen_woman`, `#txt_woman`, `#txt_man`
  - 장비 툴팁: `#dynamic`
  - 쿠라: `main_menu`, `init_custom_game`, `#masters_base`, `#dynamic`, `hero_customization_man`(초상화 경로)
- UI 빌드가 파일 이동에서 기계적으로 만드는 이미지 경로 치환 규칙(`content\pic\…` → `SNKmod\…`)도 UI 세션이 맡는다.
- 이 목록 밖의 location은 게임 수정 세션 소유다. 예: `city_menu_form`의 메뉴 라벨(UI 빌드 본문에서도 `old`가 정확히 1번 나와서 그대로 적용된다).
- 개인실(`slave_private_room1`~`4`, `snk_room_*`)처럼 UI와 게임 동작이 섞인 코드는 기본적으로 UI 세션이 작성하되, 게임 동작(식사·착유·출산 복귀 등)을 바꾸는 변경은 아래 최종 권한 절차를 거친다. (기본 가정, 사용자 확인 필요)

### 최종 권한 행사 방법
- UI 세션은 패키징 전에 자기 QSP 변경 목록(location 이름, 변경 요지)을 게임 수정 세션에 알린다.
- 게임 수정 세션은 `mods/`의 변경과 같은 location을 건드리는지 점검한다. 겹치면 적용 순서나 합치는 방법을 정하고 결과를 알린다. 겹치지 않으면 승인한다.
- 같은 location을 양쪽이 고쳐야 하면 게임 수정 세션이 정한 방식을 따른다.

## 의뢰 형식 (UI패치모드 → 게임 수정 세션, 소유 location 밖의 QSP 변경)
```text
[QSP 변경 요청] 짧은 제목
- 요청 세션/버전: JO9UI패치모드, 0.xx
- 목적:
- 대상 location / 줄:
- 현재 문자열(old):
- 원하는 결과(new 또는 설명):
- 영향 범위(다른 location·이미지·세이브):
- 게임에서 확인하는 방법(어디서 무엇이 보이면 성공):
```

## 전달 경로
- 의뢰: UI 세션은 다른 세션에 메시지를 보내는 도구가 없다. 위 형식을 자기 대화창에 적고, 사용자가 "요청 확인해"라고 하면 게임 수정 세션이 UI 세션의 최근 메시지를 읽어 처리한다. 사용자가 그대로 붙여 넣어도 된다.
- 결과: 게임 수정 세션이 UI 세션에 메시지로 전달한다.

## 처리 순서
1. 게임 수정 세션이 의뢰를 읽고, 최신 소스(`source/`의 가장 최근 날짜 파일)에서 대상을 찾아 영향 범위를 점검한다. 모호하면 사용자에게 먼저 묻는다.
2. `mods/YYYY-MM-DD_이름.json`을 만든다. `edits`(location, field, old, new, count)가 이 기록의 핵심이다.
3. 로컬 PC에서 `apply_mods.ps1 -DryRun`과 적용으로 검증한다. 화면에 보이는 변경은 사용자가 게임에서 확인한다.
4. PR을 만들고 사용자가 병합한다.
5. 결과(mods 파일 경로, commit/PR, 확인 방법)를 UI 세션에 전달한다.
6. UI 세션이 다음 빌드에 `mods/*.json`을 적용한다.

## 빌드 연동 규칙 (UI 빌드가 mods를 쓰는 방법)
- 적용 기준은 각 edit의 `location`·`field`·`old`·`count`다. `old` 문자열이 location 안에서 정확히 `count`번 나오지 않으면 빌드를 멈춘다.
- `before_sha256`·`after_sha256`은 사용자 작업본(`source/`의 파일)에서의 값이다. UI 빌드의 기반 `jack.qsp`는 다른 파일이므로 UI 빌드는 이 해시를 검사하지 않는다.
- `mods/*.json`은 파일 이름 순서로 적용한다. 같은 문자열을 고치는 변경은 앞 변경을 전제로 한다.
- UI 빌드는 지금 `field`가 `body`인 edit만 처리한다. `desc`나 액션 칸을 고치는 mods가 생기면 UI 세션이 빌드를 확장해야 하므로 미리 알린다.
- `old`·`new`에 원본 이미지 경로가 들어 있으면 UI 빌드가 SNKmod 경로로 같은 변환을 한 뒤 찾는다.
- 위 "내용이 바뀐 35개(UI 소유)"를 고치는 mods는 UI 본문 기준으로 `old`가 맞지 않아 빌드가 멈출 수 있다. 이런 mods는 UI 세션에 미리 알리고, 필요하면 UI 본문 기준으로 `old`를 다시 쓴다.
- UI 빌드는 `main`을 작업 브랜치로 가져온 뒤 `mods/`를 적용한다.
- UI 세션은 `mods/`와 `source/`를 읽기만 한다. 소유 location의 자기 변경은 자기 빌드에서 관리한다.

## 지킬 것
- QSP 변경은 항상 `mods/`에 남긴다. 게임 폴더만 직접 바꿔서 끝내지 않는다.
- 이미 적용된 변경의 `old`/`new`를 나중에 바꾸지 않는다. 고칠 때는 새 `mods` 파일을 추가한다.
- 패키징은 사용자의 명시 승인 후에 한다.
