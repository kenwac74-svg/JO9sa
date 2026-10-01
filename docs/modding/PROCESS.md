# QSP 작업 프로세스 (사용자 결정, 2026-10-01)

## 역할
| 담당 | 하는 일 |
|---|---|
| **UI패치모드 세션** | 이미지 변경과 UI 작업(화면 코드, CSS, 개인실 등). 컨펌된 QSP로 **설치 빌드·패키징**. |
| **게임 수정 세션(이 repo의 Claude)** | 텍스트 수정, 이벤트·분기 수정 등 **텍스트 기반 코드 변경**(주 작업). 변경은 `mods/*.json`으로 기록. 그리고 **최종 QSP 검증·컨펌**. |
| **사용자** | 게임에서 확인, PR 병합, 패키징 승인. |

빌드를 여러 세션이 하면 꼬이므로 **설치 빌드는 UI패치모드 한 곳에서만** 만든다. 게임 수정 세션은 빌드를 만들지 않고, UI 빌드가 쓸 QSP가 올바르게 병합됐는지 확인해서 컨펌만 한다.

## 컨펌 절차 (패키징 전에 매번)
1. UI 세션이 후보 QSP를 만든다: 자기 변경 위에 `mods/*.json`(게임 수정 세션의 변경)을 적용한 `jack.qsp`.
2. UI 세션이 아래를 게임 수정 세션에 전달한다.
   - 후보 `jack.qsp`와, `mods` 적용 전 기반 `jack.qsp`(둘 다 접근 가능한 위치: 작업 브랜치의 파일 또는 패키지)
   - UI 세션이 바꾼 location 이름 목록
3. 게임 수정 세션이 `tools/qsp_verify.py`로 검사한다.
   - 모든 `mods` edit이 후보에 반영됐는가(`new`가 `count`번 이상, `old`가 남아 있지 않음)
   - 기반 대비 바뀐 location이 `mods` + UI 신고 목록 안에만 있는가(예상 밖 변경, 사라진 location이 없는가)
   - 바뀐 location의 if/act/end 블록 균형이 기반과 같은가
   - 파일 구조가 온전한가(location 248개 이상, 중복 이름 없음)
4. 통과하면 **컨펌**한다: 후보의 SHA-256, 적용된 `mods` 목록, 검사 결과를 UI 세션에 알린다. 실패하면 이유와 고칠 곳을 알린다.
5. UI 세션은 **컨펌된 SHA-256과 같은 `jack.qsp`로만** 설치 빌드를 만든다. 컨펌 후 QSP가 한 글자라도 바뀌면 다시 컨펌을 받는다.
6. (필요하면) 사용자가 후보로 게임을 실행해 화면을 확인한다.

```bash
python3 tools/qsp_verify.py --candidate <후보 jack.qsp> --base <기반 jack.qsp> --ui-locations <쉼표 구분 또는 파일>
```

## 게임 수정 세션의 변경 처리
1. 사용자 지시 또는 UI 세션의 의뢰를 받는다. UI 세션은 아래 형식으로 대화창에 적는다. 사용자가 "요청 확인해"라고 하면 내가 읽는다.
```text
[QSP 변경 요청] 짧은 제목
- 요청 세션/버전:
- 목적:
- 대상 location / 줄:
- 현재 문자열(old):
- 원하는 결과(new 또는 설명):
- 게임에서 확인하는 방법:
```
2. `mods/YYYY-MM-DD_이름.json`을 만든다(location, field, old, new, count). 로컬 PC에서 `tools\apply_mods.ps1`로 검증하고, 화면에 보이는 것은 사용자가 확인한다.
3. PR을 만들어 사용자가 병합한다. 결과는 UI 세션에 메시지로 전달한다.
4. UI 빌드는 `main`의 `mods/`를 가져와 파일 이름 순서로 적용한다. `field`가 `body`인 edit만 지원한다(`desc`·액션 칸은 UI 세션이 빌드를 확장해야 하므로 미리 알린다).
5. UI 본문을 바꾼 location(부록)을 고치는 mods는 UI 본문 기준으로 `old`가 안 맞을 수 있다. 그런 변경은 UI 세션에 미리 알린다.

## 지킬 것
- QSP 변경은 항상 `mods/`에 남긴다. 게임 폴더만 고쳐서 끝내지 않는다.
- 이미 적용된 변경의 `old`/`new`를 나중에 바꾸지 않는다. 고칠 때는 새 `mods` 파일을 추가한다.
- 컨펌 없이 설치 빌드를 배포하지 않는다. 패키징은 사용자 승인 후에 한다.
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
- 이 목록 밖의 location은 게임 수정 세션 소유다. 예: `city_menu_form`의 메뉴 라벨(UI 빌드 본문에서도 `old`가 정확히 1번 나와서 그대로 적용된다).
- 개인실(`slave_private_room1`~`4`, `snk_room_*`)처럼 UI와 게임 동작이 섞인 코드는 기본적으로 UI 세션이 작성하되, 게임 동작(식사·착유·출산 복귀 등)을 바꾸는 변경은 아래 최종 권한 절차를 거친다. (기본 가정, 사용자 확인 필요)

