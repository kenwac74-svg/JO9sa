# QSP 작업 프로세스 (2026-10-02 결정 17로 갱신)

역할의 기준은 `docs/PROJECT.md`다. 이 문서는 QSP 변경(mods)의 기록·적용 절차만 적는다. 이전의 "게임 수정 세션 컨펌" 절차는 폐지했다.

## 역할 (요약, 기준은 PROJECT.md)
| 담당 | 하는 일 |
|---|---|
| **JO9UI패치모드 (PM)** | UI 이미지·화면 코드. main의 `mods/*.json`을 적용한 빌드, 검증(`tools/qsp_verify.py` 등), 패키징·배포. 기록과 작업 지휘. |
| **로컬 모딩 도구 (homecom·notebook)** | 사용자가 플레이하며 지시한 대사·분기 등 QSP 내용 수정을 `mods/*.json`으로 기록해 main에 올린다. 빌드·패키징은 하지 않는다. |
| **실시간모딩** | 모딩 환경(도구·절차) 자문만. 직접 모딩·컨펌에 참여하지 않는다. |
| **사용자** | 게임 실행과 화면 점검(수동), 지시와 판단, PR 병합, 패키징 승인. |

## 빌드·배포 절차
1. 로컬 도구가 `mods/*.json`을 main에 올린다.
2. PM이 main을 병합해 빌드한다. mods는 파일 이름 순서로 적용하고, `old`가 location 안에서 정확히 `count`번 나오지 않으면 빌드를 멈춘다. 해시는 검사하지 않는다.
3. PM이 후보 `jack.qsp`를 검증한다(모든 mods 반영, 예상 밖 변경 없음, 파일 구조).
4. 사용자가 후보로 게임을 직접 실행해 점검한다(수동, 필수).
5. 사용자 승인 후 PM이 버전을 올려 패키징한다.

## 로컬 모딩 도구의 변경 처리
1. 사용자 지시를 받는다. PM이 QSP 내용 변경이 필요하면 아래 형식으로 PM 대화창에 적고, 사용자가 로컬 도구에 전달한다.
```text
[QSP 변경 요청] 짧은 제목
- 요청 세션/버전:
- 목적:
- 대상 location / 줄:
- 현재 문자열(old):
- 원하는 결과(new 또는 설명):
- 게임에서 확인하는 방법:
```
2. `mods/YYYY-MM-DD_이름.json`을 만든다(location, field, old, new, count). 적용(`tools\apply_mods.ps1`)과 게임 실행 확인은 사용자가 수동으로 한다.
3. main에 올린다(PR이면 사용자가 병합한다). PM은 다음 빌드 때 main에서 가져간다.
4. UI 빌드는 `main`의 `mods/`를 가져와 파일 이름 순서로 적용한다. `field`가 `body`인 edit만 지원한다(`desc`·액션 칸은 UI 세션이 빌드를 확장해야 하므로 미리 알린다).
5. UI 본문을 바꾼 location(부록)을 고치는 mods는 UI 본문 기준으로 `old`가 안 맞을 수 있다. 그런 변경은 UI 세션에 미리 알린다.

## 지킬 것
- QSP 변경은 항상 `mods/`에 남긴다. 게임 폴더만 고쳐서 끝내지 않는다.
- 이미 적용된 변경의 `old`/`new`를 나중에 바꾸지 않는다. 고칠 때는 새 `mods` 파일을 추가한다.
- 사용자 게임 점검과 승인 없이 설치 빌드를 배포하지 않는다.
- 도구는 사람을 돕는 보조 수단이다. 실행 확인, 화면 점검, 취향·판단이 필요한 결정은 사용자에게 남긴다.
- 기존에 UI 세션이 넣은 QSP 패치(장비 툴팁, 쿠라 등)는 UI 쪽에 그대로 둔다.

## 부록 — UI 세션 보고 기준 UI 코드 location (0.13 패키지)
- 0.12부터 UI 패키지는 완성된 `jack.qsp`를 통째로 넣는다. 0.13은 location 243개가 순정과 다르고 새 location 5개가 있다(UI 세션 보고, 이 세션이 직접 확인한 것은 아니다).
- **새로 추가한 location 5개(개인실 연결):** `snk_room_bridge`, `snk_room_menu_screen`, `snk_room_diet_migrate`, `snk_room_birth_check`, `snk_room_birth_return`.
- **모든 location 맨 위의 개인실 진입 보호 줄** `if snk_room_target > 0 and $curloc = '…': gs 'snk_room_bridge', 'guard', '…'`: 181개에는 이 줄만 붙었고, 27개는 이 줄과 이미지 경로만 바뀌었다. `city_menu_form`에도 이 줄이 한 줄 붙어 있다.
- **내용이 바뀐 35개(UI 소유):**
  - 화면: `_layout`, `main_layout`, `stats_layout`, `menu_form`, `sjm_UI_UIadds`, `debug_info`, `$newloc`, `$ride_start`, `next_day`, `main_screen`, `master_stat`, `slave_stat`, `assistant_stat`, `interaction`, `city_screen`, `interaction_city`, `ride_interface`, `trophy_room_screen`, `slave_private_room1`~`4`, `#food_base`, `конец_боя`, `раскладка_бой`, `боевой_интерфейс`, `sex_screen`, `sex_screen_woman`, `#txt_woman`, `#txt_man`
  - 장비 툴팁: `#dynamic`
  - 쿠라: `main_menu`, `init_custom_game`, `#masters_base`, `#dynamic`, `hero_customization_man`(초상화 경로)
- UI 빌드가 파일 이동에서 기계적으로 만드는 이미지 경로 치환 규칙(`content\pic\…` → `SNKmod\…`)도 UI 세션이 맡는다.
- 이 목록 밖의 location 내용 변경은 로컬 모딩 도구가 mods로 한다. 예: `city_menu_form`의 메뉴 라벨(UI 빌드 본문에서도 `old`가 정확히 1번 나와서 그대로 적용된다).
- 개인실(`slave_private_room1`~`4`, `snk_room_*`)처럼 UI와 게임 동작이 섞인 코드는 기본적으로 UI 세션이 작성하되, 게임 동작(식사·착유·출산 복귀 등)을 바꾸는 변경은 사용자 지시와 게임 점검을 거친다.

