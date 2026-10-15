# JO9UIpatch — 작업 결정과 근거 기록

계속 덧붙인다. 확인한 사실과 추정을 구분한다.

## 2026-09-25 세션 1

### 브랜치
- 인계 문서는 `JO9UIpatch` 브랜치를 지정하지만, 이 세션의 푸시 허용 브랜치는 `claude/sweet-meitner-72rd73`이다 (`JO9UIpatch` 병합 이력 위에서 분기). 이 세션의 기록은 여기에 커밋하고, `JO9UIpatch`로의 반영은 사용자가 결정한다.

### 인계 ZIP 검증
- `tools/verify_bundle.py`를 그대로 실행하면 Linux에서 `FAIL: payload/content/pic/ui/jon-UIadds/Fer_░í└╙.png`로 실패한다.
- 원인: FIX6 ZIP 내부 한글 파일명 8개(`Fer_가임/불임/산란/아동`, `Vir_비/처`)가 UTF-8 플래그 없이 CP949로 저장돼 있고, Python `zipfile`은 이를 CP437로 해석한다. 추출된 파일(`Fer_가임.png` 등)과 이름이 맞지 않는 것이지 바이트 손상이 아니다.
- 검증기 사본에서 이름을 `cp437→cp949`로 복원해 대조하니 PASS (152 / 128 / 117 / 119 / 5). 원본 검증기는 수정하지 않았다.
- 새 패키지 ZIP을 만들 때는 한글 파일명을 UTF-8 플래그로 저장해야 같은 문제를 피한다.

### 드라이브 자료 (`Moding/JO9main/game`)
- 있음: `jack.qsp`(16,677,048 B), `locations/*.qsrc`, `locations.zip`, `css/base.css`(135,619 B), `css/mainScreen.css`, `engine/`.
- 드라이브의 `sjm_UI_UIadds.qsrc`는 순정(FIX6 이전) 본문이다. 이미지 경로가 `content\pic\ui\jon-UIadds\...` 형식.
- `SNKmod` 폴더는 드라이브에서 찾지 못했다.
- `jack.qsp`는 도구가 base64를 인라인으로 반환해 이 크기는 받을 수 없다. 해시 대조는 미실행.

### 참조 경로 기준
- QSP HTML: `content\pic\...` (게임 루트 기준, 백슬래시).
- base.css: `url('content/pic/...')`. `css/` 폴더가 아닌 게임 루트 기준으로 쓰여 있다. 따라서 SNKmod 전환 시 두 곳 모두 접두사는 `SNKmod/content/pic/...`(QSP는 `SNKmod\content\pic\...`)이 될 것으로 보인다. **인게임 표시로는 미확인.**
- base.css 안에 `content/pic/ui overhaul/bar.png`와 `content/pic/UI overhaul/bar2.png`가 대소문자가 섞여 있다. Windows에서는 같은 폴더지만 SNKmod 미러 시 폴더명 표기를 하나로 정해야 한다 (원본 폴더 실제 표기 확인 필요).

### 동명 후보 묶음 1 — gear / sound_on / sound_off
- FIX6 내 두 사본은 각각 바이트 동일 (reports/DUPLICATE_CANDIDATES.json).
- 두 경로 모두 사용됨 (소스 참조 확인, 실제 표시 미확인).
  - `buttons/gear.png`: main_screen 162행, city_screen 255행.
  - `ui/grimdark/buttons/gear.png`: main_screen 164행, city_screen 253행.
  - `sound_on/off`: main_screen 181·183행이 `iif(ui_style = 2, 'ui\grimdark\buttons\…', 'buttons\…')`로 선택. city_screen 211–219행도 두 경로를 분기.
- 즉 `ui_style` 테마(2=grimdark)별로 경로가 갈린다. 현재 FIX6에서 그림이 같더라도 테마 구분 의도가 있다.
- 사용자 승인 전이므로 통합·이동하지 않았다.

### 사용자 결정 1 — 단일 UI, SNKmod 아래 단일 경로로 통합 (2026-09-25)
- 사용자 지시: 이 게임은 실제로 `ui_style`을 적용하지 않는 단일 UI다. 모더들이 흩어 놓은 UI 경로를 SNKmod 아래로 전부 통합하고 새 단일 경로를 지정한다.
- 이 결정은 인계 문서의 "기본은 원본 폴더 구조 미러" 규칙보다 우선한다.
- 결과: `gear/sound_on/sound_off`의 `buttons/` 사본과 `ui/grimdark/buttons/` 사본은 SNKmod의 한 파일로 합친다. `iif(ui_style = 2, …)` 분기는 두 쪽 모두 같은 새 경로를 가리키게 한다.
- 새 단일 경로의 구체적 모양은 사용자 확인 대기 중이다.

### 통합 대상이 되는 흩어진 UI 폴더 (5개 location + base.css + FIX6 payload 기준)
- `content/pic/` 루트 (padding, menu_button, hart_*, 소리, blank_ava, chart, money_counter, page_aura, page_blank 등)
- `buttons/`, `ui/approved_main_v1/`, `ui/grimdark/`(+`buttons/`, `bg/`), `ui/jo9_v197/`, `ui/jon-UIadds/`
- `ui overhaul/`(+`clothing bar/`, `clothing bar small/`), CSS에는 `UI overhaul/` 표기도 섞여 있음
- `bg/slave_psychology/`, `bg/trophy/`
- 이 5개 location 밖의 UI 참조(트로피룸·심리 화면 등)는 아직 조사하지 않았다. 통합하려면 다른 location도 고쳐야 할 가능성이 높고, 그 범위는 따로 승인받아야 한다.

### 파일명 충돌 (한 폴더로 합칠 때)
- 바이트 동일로 확인: gear.png, sound_on.png, sound_off.png.
- 미확인(한쪽 원본 미확보): `page_aura.png` (`pic/` vs `ui/grimdark/`), `page_blank.png` (`pic/` vs `ui/grimdark/bg/`).
- 동적 경로: `ui overhaul\clothing bar small\<<$slave["armor"]>>.png` 등은 아이템명으로 파일명을 만든다. 평평한 폴더로 합치면 다른 UI 파일명과 충돌할 수 있어 하위 폴더 유지가 안전하다.

### 사용자 결정 2 — SNKmod 아래 구조 규칙 (2026-09-25)
- SNKmod 아래는 원본 구조를 최대한 따른다. 예: `game/SNKmod/content/pic/bg/slave_psychology/`.
- 단, `ui/` 안의 모더 폴더(`grimdark`, `approved_main_v1`, `jo9_v197`, `jon-UIadds`)는 경로 단계에서 뺀다.
- 모더 폴더 안에 원본과 같은 이름의 하위 폴더가 있으면 원본 폴더로 합친다. 예: `ui/grimdark/buttons/` → `SNKmod/content/pic/buttons/`.
- ~~원본 루트에 같은 이름이 있는 page_blank·page_aura는 `SNKmod/content/pic/`로 합친다~~ → 결정 3으로 정정.
- 그 밖의 모더 폴더 파일은 `SNKmod/content/pic/ui/`로 바로 들어간다. 현재 확인 범위(FIX6와 5개 location·base.css 참조)에서는 이름 충돌이 없다.

### 묶음 1 처리
- gear / sound_on / sound_off는 `SNKmod/content/pic/buttons/`의 한 파일로 합친다 (바이트 동일, 결정 1·2로 승인).

### 묶음 2 조사 — `ui/grimdark/buttons/`의 나머지 (드라이브 `JO9main/game/content/pic` 원본)
| 파일 | `pic/buttons/` 원본 | `pic/ui/grimdark/buttons/` | FIX6 `buttons/` |
|---|---|---|---|
| teach_a.png | 1,737 B | 1,737 B, 내용 동일 | 없음 |
| teach_r.png | 1,618 B | 1,618 B, 내용 동일 | 없음 |
| teach_s.png | 1,716 B | 1,716 B, 내용 동일 | 없음 |
| lab.png | 21,464 B | 26,575 B, 다름 | 17,714 B (교체본) |
| teach.png | 20,585 B | 25,681 B, 다름 | 16,098 B (교체본) |
- 내용 동일은 드라이브에서 받은 두 파일의 base64 문자열이 같은 것으로 확인했다 (SHA-256 계산은 하지 않음).
- `ui_style`은 이 5개 location 밖에서도 쓰인다 (`master_stat`, `ride_interface`, `interior_restore`, `боевой_интерфейс`, `раскладка_бой` 등). 통합하려면 이 location들도 고쳐야 하며, 범위 승인이 필요하다.

### 묶음 3 후보 (다음 질문) — page_blank / page_aura
- `pic/page_blank.png` 472,690 B vs `pic/ui/grimdark/bg/page_blank.png` 643,281 B: 다름.
- `pic/page_aura.png` 990,058 B vs `pic/ui/grimdark/page_aura.png` 990,058 B: 크기 같음, 파일이 커서 내용 비교는 아직 못함.
- 참고: `pic/bg/`에도 다른 `page_blank.png`(312,416 B)와 `page_aura.png`(144,250 B)가 있다.

### 사용자 결정 3 — grimdark 하위 폴더의 의미와 최신본 기준 (2026-09-25)
- `grimdark` 아래 하위 폴더는 그 이미지가 원래 있어야 할 폴더를 뜻한다. `ui/grimdark/buttons/` → `SNKmod/content/pic/buttons/`, `ui/grimdark/bg/` → `SNKmod/content/pic/bg/`.
  - 따라서 `ui/grimdark/bg/page_blank.png`는 `SNKmod/content/pic/bg/page_blank.png`로 간다 (앞선 미리보기의 `pic/` 루트 안은 폐기).
  - 하위 폴더 없이 `grimdark` 바로 아래 있는 파일(`bg*.png`, `page_aura.png`)은 규칙 2에 따라 `SNKmod/content/pic/ui/`로 간다.
- 모든 파일의 최신 기준은 FIX6 교체본이다. 사용자가 제공한 UI 파일이나 이미 패키징된 FIX6가 최신본이다.
- 모드의 핵심: 원본 이미지 파일을 건드리지 않고 새 UI 리소스를 SNKmod에 넣어 구현한다.

### 묶음 2 처리 (결정 3으로 해결)
- `SNKmod/content/pic/buttons/`에 teach_a·teach_r·teach_s (원본 = grimdark, 내용 동일), lab·teach (FIX6 교체본).
- grimdark의 lab(26,575 B)·teach(25,681 B)는 패키징에서 제외. 게임 원본 파일은 건드리지 않는다.

### page_blank 참고
- `SNKmod/content/pic/bg/page_blank.png`에는 grimdark판(643,281 B)이 들어간다. slave_stat 491·543행이 grimdark판을 직접 참조하므로 지금 화면에 보이는 것도 이 파일이다.
- 원본 `pic/bg/page_blank.png`(312,416 B)는 게임 원본 그대로 둔다. 이 파일을 참조하는 코드가 SNKmod로 옮겨질 때만 충돌하며, 그때 다시 확인한다.

### 수정 범위 조사
- 드라이브 location 중 `grimdark` 또는 `UIadds`를 포함한 파일이 25개다 (5개 허용 범위 밖: teach_screen, assistant_stat, master_stat, sex_screen, sex_screen_woman, slave_private_room1–4, ride_interface, #sex_options, init_game, 레이아웃·전투 location 등).
- `buttons\` 등 원본 UI 폴더 참조까지 모두 SNKmod로 돌리면 수정 대상 location은 더 늘어난다.

### 사용자 결정 4 — SNKmod 범위는 FIX6 리소스만, 새 리소스는 매번 배치 승인 (2026-09-25)
- SNKmod에는 우리가 바꾼 UI 리소스(FIX6 제공 파일)만 둔다. 우리가 바꾸지 않은 이미지는 원본 경로를 그대로 쓴다.
- 앞으로 사용자가 새 리소스를 줄 때마다 다음 순서로 한다. ① 어디에 배치할지 묻는다. ② 원본 이미지와 파일명을 대조·비교한다. ③ 승인을 받는다.
- 결정 4에 따른 묶음 2·page_blank 정정:
  - teach_a·teach_r·teach_s는 FIX6 파일이 아니므로 SNKmod에 넣지 않는다. 원본 경로를 그대로 쓴다. grimdark 분기 참조를 원본 `buttons/`로 모을지는 location 수정 범위를 승인받을 때 함께 정한다.
  - lab·teach는 FIX6 파일이라 `SNKmod/content/pic/buttons/`에 넣는다.
  - grimdark `page_blank.png`는 FIX6 파일이 아니므로 SNKmod에 넣지 않고 원본 경로를 쓴다.

### 참조 전수 조사의 한계
- 드라이브 fullText 검색은 전수 결과를 주지 않는다. 예: `close_button` 검색 결과에 실제로 쓰는 main_screen·city_screen이 빠졌다. 순위가 매겨진 일부 결과만 온다.
- FIX6 파일의 상당수(`buttons/close_button`, `Plus`, `approve`, `z_ill` 등)는 원본 파일을 같은 이름으로 교체한 것이다. 5개 밖 location에서도 쓰인다 (확인 예: trophy_room_screen, master_stat, sex_screen_woman, hero_customization, development).
- SNKmod로 참조를 옮기려면 게임 전체 location을 텍스트로 검사해야 한다. `locations.zip`(2.4MB)이나 `jack.qsp`(16.6MB)는 현재 드라이브 도구로 받을 수 없어 사용자에게 파일 첨부를 요청한다.

### 게임 소스 확보 (사용자 첨부, 2026-09-25)
- `jack.qsp` 16,709,704 B, SHA-256 `953533402226c874f1d22a9023da4d235bd512b61c2fc30f028465226f49b6d9` = FIX6 manifest `FinalQsp`. 즉 FIX6 설치 후 상태다. 순정 상태(`OriginalQsp` `cbb3c446…f607`)는 아직 없다.
- `locations.zip` 2,431,129 B, location 243개. jack.qsp도 location 243개로, 전체 목록과 수가 같다.
- `tools/qsp_dump.py`로 jack.qsp를 풀었다. 5개 location 본문의 SHA-256이 qsp-patches.json `After`와 모두 일치해 디코더가 맞음을 확인했다.

### FIX6 참조 맵 (`docs/FIX6_REFERENCE_MAP.md`, `tools/fix6_refmap.py`로 생성)
- FIX6 이미지 115개 중 99개는 소스에서 참조된다. 16개는 참조가 없다.
- 허용 5개 밖에서 FIX6 파일을 참조하는 location이 46개다. base.css에도 14개가 있다.
- 동적 경로 확인:
  - slave_psychology 1–7은 `interaction_city`가 `$special_image[N] = 'bg\slave_psychology\N.png'`로 넣는다. 그리면 `interaction_screen_city`가 `content\pic\` 접두사를 붙인다.
  - 같은 화면은 `$special_image_full[txt]`가 있으면 그 전체 경로를 우선 쓴다. 따라서 `interaction_city`만 고쳐 `$special_image_full`에 SNKmod 전체 경로를 넣으면, 표시 location을 고치지 않고 전환할 수 있다 (소스 확인, 표시 미확인).
  - 참조 없는 16개(`trophywall`, `debug_a/s`, `fast_cook/milking/milking_gray/punishment/reward/sweep`, `influence`, `jo9_heart_a/s`, `question`, `soc_btn`, `trotest`, `yellow_button`)는 `buttons\<<…>>`처럼 이름을 조합하는 경로도 없다.
    - `main_screen`의 `fast_cook` 등은 div id와 변수명일 뿐 이미지 경로가 아니다.
    - `trophywall`은 FIX6 README에도 "호출 코드 추가 안 함"으로 적혀 있다.

### 사용자 기본 정책 — exe 수정 제외 (2026-09-25)
- exe를 고치는 모딩은 다른 AI에서 한다. 이 작업은 qsp(와 CSS·리소스) 범위만 다룬다. qsp를 넘는 수정이 필요하면 사용자에게 알린다.
- 기존 FIX6의 엔진 교체 로직(순정+Qt 검증 시 교체)은 그대로 보존한다. 새로 바꾸지 않는다.

### 사용자 결정 5 — 경로 치환형 패치 채택, 해시 불일치로 설치를 거부하지 않음 (2026-09-25)
- 목적: 흩어진 UI를 SNKmod로 모아 개발 관리를 쉽게 하고, 다른 모드와 충돌을 줄인다.
- 기존 문제: jack.qsp·location 해시가 맞지 않으면 설치 자체를 거부했다. 사용자는 해시와 상관없이 설치할 수 있다면 해시 규칙을 완화해도 된다고 했다.
- 채택 방식:
  - FIX6 파일을 참조하는 location(5개 밖 46개 포함)은 본문을 통째로 바꾸지 않는다. 이미지 경로 문자열만 `content\pic\…` → `SNKmod\content\pic\…`로 바꾼다.
  - 복구는 우리 파일 경로만 되돌린다.
  - 안전 검사는 본문 해시 대신 다음으로 한다. ① 치환 대상 문자열 개수 확인. ② 치환 뒤 모든 경로가 SNKmod 실제 파일을 가리키는지 확인. ③ location별 적용 결과 기록.
- UI 리소스는 표 하나(`ui_map` 가칭)로 관리한다. 항목은 원래 경로, SNKmod 경로, 출처 폴더, 참조 location이다.
- 46개 location 수정 범위는 이 결정으로 승인된 것으로 본다 (경로 문자열만 바꾸는 조건).
- 미결정: FIX6가 본문 자체(레이아웃·로직)를 바꾼 5개 location을, Before 해시가 맞지 않는 jack.qsp에 어떻게 적용할지.

### 사용자 결정 6 — 호환성 정책 (2026-09-25)
- 다른 모드와의 호환성은 고려하지 않는다. QSP 구조상 모드끼리 호환하려면 모더들이 통합 빌드를 만들어야 한다.
- **QSP를 수정하는 모드는 이 모드와 호환불가**로 정책에 정의한다.
- 호환성 점검 대상은 이미지 리소스 교체 모드뿐이다.
  - 우리가 SNKmod로 경로를 돌린 이미지는, 다른 모드가 원본 경로에 교체해도 게임에 적용되지 않는다.
  - 따라서 이 모드와 같은 이미지를 교체하는 모드는 그 이미지에 대해 호환되지 않는다. 겹치는 목록은 `ui_map`(참조 맵의 99개 사용 파일)으로 안내한다.
- 이 결정에 따른 처리 (결정 5의 미결정 사항 해소):
  - 본문을 교체하는 5개 location은 해시가 맞지 않아도 설치를 거부하지 않는다. 경고를 보여 주고 기록한 뒤 교체한다.
  - 복구를 위해 교체 전 location 본문(QSP 상태)은 기록한다. 이것은 UI 연결 복구용 QSP 상태 기록이며, 일반 이미지 백업과는 별개다.
  - 경로 치환 46개도 같은 원칙이다. 치환할 문자열이 없으면 그 항목만 건너뛰고 보고한다.

### 사용자 결정 7 — 참조 없는 FIX6 파일 16개는 예비 리소스로 포함 (2026-09-25)
- 16개(trophywall, debug_a/s, fast_cook/milking/milking_gray/punishment/reward/sweep, influence, jo9_heart_a/s, question, soc_btn, trotest, yellow_button)를 SNKmod에 넣는다. 위치는 원래 구조를 따른다 (`SNKmod/content/pic/buttons/`, `SNKmod/content/pic/bg/trophy/`).
- 이 모드에서는 쓰지 않지만 앞으로 쓸 수 있는 리소스라는 점을 명시한다. `ui_map`에 상태 `예비(미사용)`로 표시하고, 배포 안내에도 적는다.
- 참조가 없으므로 이 16개는 경로 치환 대상이 아니다.

### CSS 로딩 확인
- jack.qsp의 location 243개 어디에도 `.css`, `<link>`, `usercss`, `stylesheet`가 없다. 즉 `css/base.css`는 QSP 코드가 아니라 엔진(jack.exe)이 고정 경로로 읽는 것으로 보인다 (코드상 추정, 엔진 소스 없음).
- 따라서 base.css를 SNKmod로 옮기거나 로딩 경로를 바꾸려면 exe 수정이 필요하다. 이는 정책상 이 작업 범위 밖이다.

### 참조 맵 정정 (2026-09-25)
- 첫 참조 맵은 부분 문자열로 비교해서 오탐이 있었다. 예: `ui/grimdark/buttons/thumb_down.png`가 `buttons/thumb_down.png` 참조로도 잡혔다.
- `tools/fix6_refmap.py`를 정확한 경로 비교로 고쳤다. 비교 대상 형태는 세 가지다. ① `content\pic\경로`. ② `content\pic\<<iif(…)>>` 안의 경로. ③ `$special_image[N] = '경로'`.
- 결과: 사용 99개와 미사용 16개, 5개 밖 location 46개와 base.css는 그대로다. 파일별 location 목록만 바뀌었다.

### 사용자 결정 8 — 이미지 외 파일은 원본 경로 덮어쓰기 + 복구 제공 (2026-09-25)
- 이미지 리소스를 뺀 모든 파일(jack.qsp, css/base.css, 기존 정책상의 engine/jack.exe)은 원본 경로에 덮어쓴다. 복구할 수 있도록 설치 전 원본을 보관한다.
- base.css는 엔진이 고정 경로로 읽으므로 이 방식이 맞다. CSS 안의 FIX6 이미지 경로는 SNKmod 경로로 바꾼다.

### 경로 치환 규칙 (결정 2·3·4·5에서 도출)
- FIX6 파일 X(`content/pic/<rel>`)를 참조하는 모든 곳은 `SNKmod/content/pic/<SNKmod rel>`로 바꾼다. 구분자는 원래 쓰인 것(`\` 또는 `/`)을 따른다.
- `iif(ui_style = 2, ''ui\grimdark\buttons\X'', ''buttons\X'')` 형태는 `buttons\X`가 FIX6 파일일 때만 식 전체를 SNKmod 고정 경로로 바꾼다. 두 분기가 같은 파일을 가리키게 되기 때문이다 (lab, teach, sound_on/off). teach_a/r/s처럼 FIX6에 없으면 그대로 둔다.
- `ui/grimdark/buttons/X` 직접 참조도 `buttons/X`가 FIX6 파일이면 SNKmod `buttons/X`로 보낸다 (gear, sound_on/off, thumb_up/down). thumb는 FIX6에 grimdark판이 없으나, 결정 3(grimdark 하위 폴더 = 원래 폴더)과 FIX6 최신 기준에 따른다. 이 참조는 `ui_style = 2` 분기라 현재 화면에는 영향이 없다.
- FIX6에 없는 grimdark 참조(`cryobutton`, `teach_a/r/s`, `bg/fight`, `bg/page_blank`, `page_aura`)는 바꾸지 않는다.
- slave_psychology: `interaction_city`의 `$special_image[N] = 'bg\slave_psychology\N.png'`를 `$special_image_full[N] = 'SNKmod\content\pic\bg\slave_psychology\N.png'`로 바꾼다. `interaction_city`는 시작할 때 `killvar '$special_image_full'`을 하고, 표시 쪽은 `$special_image_full`을 우선 쓴다 (소스 확인).

### 빌드 스크립트 결과 (R1)
- `python build/build_package.py --qsp <FIX6 상태 jack.qsp>` 실행 결과, `dist/JO9_UI_v1_9_14_SNKmod_R1/`가 생성된다.
- 이미지 112개. FIX6 115개에서 grimdark/buttons 동일 사본 3개가 합쳐졌다. 사용 96개, 예비 16개.
- 경로 치환: 46개 location, 규칙 164개, 치환 649회. 본문 교체: 5개 location.
- 정적 검증: 치환 후 모든 `SNKmod\…` 참조가 payload 파일을 가리키고, FIX6 파일의 옛 경로 참조가 남지 않았다. 빌드에 포함돼 있어 어긋나면 빌드가 실패한다.
- 5개 본문은 FIX6 Text와 줄 수가 같고, 바뀐 줄은 모두 SNKmod 경로가 들어간 줄이다 (sjm 34, main 60, slave_stat 113, city 9, #food_base 0).
- 5개 본문의 `Before` 목록은 FIX6 Before와 FIX6 After(= FIX6 설치 상태)다. 결정 6에 따라 목록에 없으면 경고만 하고 교체한다.
- baseline FIX6 ZIP(9,073,868 B, SHA-256 `254dc8c5…bc82`)을 `baseline/`에 저장했다. 빌드는 이 해시를 확인한다.

### 설치기 R1 구현 메모
- 상태 기록 폴더: `_JO9_SNKmod_STATE/<시각>_<id>/` (`state.json`, `original/`). 이미지 외 파일과, SNKmod에 원래 있던 다른 내용 파일만 보관한다. 원본 content/pic 이미지는 쓰지 않으므로 보관할 것이 없다.
- 복구는 모든 파일을 먼저 검사한다. 설치 후 바뀐 파일이 하나라도 있으면 아무것도 바꾸지 않고 중단한다.
- 다른 버전의 SNKmod가 설치돼 있으면 적용 전에 먼저 복구한다. 같은 버전이면 아무것도 하지 않는다.
- FIX6 전환은 FIX6의 복구 검사(백업 해시, 현재 = Before 또는 After)를 다시 구현했다. 통과하면 FIX6 이전으로 되돌리고, 실패하면 경고만 하고 계속한다.
- 엔진: 순정인데 Qt가 맞지 않으면 FIX6는 설치를 거부했다. R1은 결정 6에 따라 경고 후 엔진만 건너뛴다.
- `[IO.File]::Replace`의 세 번째 인수는 `[NullString]::Value`여야 한다. `$null`은 빈 문자열로 넘어가 오류가 난다. 첫 시험에서 발견해 고쳤다.
- 릴리스 ZIP은 한글 파일명을 UTF-8 플래그로 저장한다 (FIX6 ZIP의 CP949 이름 문제를 피함).

### 사용자 작업 규칙 — 패키징은 명시 승인 후 (2026-09-25)
- 사용자 지시가 없으면 패키징(빌드·릴리스 ZIP 생성·전달)을 하기 전에 먼저 패키징할지 묻는다.
- 사용자가 명시적으로 패키징을 승인했을 때만 진행한다.
- 코드·문서 수정과 시험, 커밋은 패키징과 별개로 계속한다. 릴리스 ZIP 갱신과 전달만 승인 대상이다.

### 사용자 작업 규칙 — 최종 저장소는 JO9UIpatch (2026-09-25)
- UI 패치 작업의 최종 저장 브랜치는 `JO9UIpatch`다. `claude/…` 브랜치는 작업용이다.
- 원격 `JO9UIpatch`에는 이 세션 밖에서 쌓인 커밋 6개가 있었다 (정책 문서, FIX6 첨부 기록, `tools/import_fix6.py`, Actions 가져오기 워크플로). 작업 브랜치에 병합하고 README 충돌만 손으로 합쳤다.
- 워크플로 `import-fix6.yml`은 `releases/JO9_UI_v1_9_14_AllInOne_R2_FIX6.zip`이 push될 때만 실행된다. 이 작업은 FIX6 원본을 `baseline/`에 두므로 실행되지 않는다.

### 사용자 결정 9 — 한글 파일명 처리 (2026-09-25)
- 앞으로 한국어 파일명이 포함되면 사용자에게 알리고 대체 이름을 받는다.
- 한글 이름 파일은 영문 이름으로 바꿔 이 모드(SNKmod) 안에 포함한다. 우리가 바꾸지 않은 원본 이미지라도 한글 이름이면 포함 대상이다 (결정 4의 예외). 원본 파일은 지우거나 바꾸지 않는다.
- 사용자 지정 이름:

| 원래 이름 | 새 이름 |
|---|---|
| ui/jon-UIadds/Fer_가임.png | Fer_PregO.png |
| ui/jon-UIadds/Fer_불임.png | Fer_PregX.png |
| ui/jon-UIadds/Fer_산란.png | Fer_PregEg.png |
| ui/jon-UIadds/Fer_아동.png | Fer_Mi.png |
| ui/jon-UIadds/Vir_비.png | Vir_Xcr.png |
| ui/jon-UIadds/Vir_처.png | Vir_Ocr.png |
| ui/jon-UIadds/Fer_안전.png | Fer_PregS.png |
| ui/jon-UIadds/Fer_젖소.png | Fer_Milk.png |

- 해석: "가임=PregO"처럼 한글 부분만 적은 항목도 `Fer_` 접두사를 유지한다 (`아동=Fer_Mi`와 같은 형식).

### 게임 전체의 한글 이미지 참조 (jack.qsp 243개 location + base.css, 동적 경로 없음)
- 위 8개 외에 이름이 정해지지 않은 파일이 14개 있다.
  - `ui/jon-UIadds/Fer_평시.png`: sjm_UI_UIadds 2곳.
  - `content/pic/` 바로 아래 13개.
    - 낙태, 출산: assistant_stat 각 5곳.
    - 상처, 질병, 임신s: main_screen 각 4곳.
    - 소리: main_screen 1, city_screen 1, base.css 2곳.
    - 임신: slave_private_room1–4 각 1곳.
    - 피임약0: slave_private_room1–4 각 2곳. 피임약1, 피임약2: slave_private_room1–4 각 1곳.
    - 피임약0s: main_screen 8곳. 피임약1s, 피임약2s: main_screen 각 4곳.
- 참조하는 location은 모두 이미 승인된 범위(5개 + 46개)에 있다.

### 사용자 결정 10 — pic 루트의 UI 파일은 SNKmod ui/ 아래로 (2026-09-25)
- `content/pic/` 바로 아래 있는 파일 중 사용자가 UI라고 판단한 것은 `SNKmod/content/pic/ui/`로 옮긴다. 원래 구조를 그대로 따르는 규칙의 예외다.
- UI 여부는 사용자가 판단한다. 파일마다 묻고 받은 답대로 배치한다.
- 원본 파일은 그대로 둔다.

### 한글 파일 영문화 구현 (빌드 스크립트)
- `build/resource_rules.json`에 두 가지를 둔다.
  - `rename`: 원래 경로 → SNKmod 새 경로. 22개.
  - `extra`: FIX6에 없지만 포함할 원본. 16개. 원본은 `resources/originals/content/pic/`에 바이트 그대로 둔다.
- 빌드는 `extra` 원본이 하나라도 없으면 목록을 보여 주고 멈춘다. SNKmod 파일 이름에 비ASCII 문자가 남아 있어도 멈춘다 (결정 9 강제).
- 사용자가 14개 제안 이름을 모두 승인했다. pic 루트 13개는 표에서 제안한 대로 `SNKmod/content/pic/ui/`에 두었다. 사용자에게 UI 여부를 한 번 더 확인한다.
- 자리표시 원본으로 흐름을 시험했다. 빌드 결과 이미지 128개(사용 112, 예비 16), 경로 치환 679회. 설치기 시험 30/30 통과, SNKmod 참조 963곳이 모두 실제 파일을 가리킨다. 한글 경로 참조는 남지 않았다.
- 원본 16개는 드라이브 도구가 base64 문자열로만 주기 때문에 바이트를 안전하게 옮길 수 없다. 사용자에게 첨부를 요청한다. 사용자 로컬 폴더(K:\…)는 클라우드 컨테이너에서 접근할 수 없다.

### 사용자 제공 원본 13개 (pic.zip, 2026-09-25)
- `pic.zip` 안의 13개(낙태, 출산, 상처, 질병, 소리, 임신, 임신s, 피임약0/0s/1/1s/2/2s)는 드라이브 `JO9main/game/content/pic/`의 같은 이름 파일과 바이트 크기가 모두 일치한다. `resources/originals/content/pic/`에 바이트 그대로 저장했다. ZIP의 한글 이름은 CP949(UTF-8 표시 없음)였다.
- 함께 붙여 주신 새 아이콘 3개(28×30)는 `jon-UIadds`의 Fer_안전·Fer_젖소·Fer_평시를 대신할 새 디자인으로 보인다. 원본 세 파일도 28×30이지만 옛 스타일이다(1,517–1,602 B). 새 아이콘은 FIX6 Fer 아이콘과 같은 스타일이다(2,2xx B). 새 리소스이므로 배치·비교 승인을 받는다.
- 새 아이콘 대응 확정 (사용자 답): 회색 자궁 = 안전일 → `Fer_PregS.png`, 젖소 머리 = 착유용 젖소 → `Fer_Milk.png`, 분홍 자궁 = 평시(임신률 저하) → `Fer_Normal.png`.
- `JO9_FerVir_UI_11_20260925.zip`: Fer_안전·Fer_젖소·Fer_평시 새 디자인 3개. 붙여 주신 이미지와 바이트가 같다. `resources/new/content/pic/ui/jon-UIadds/`에 저장했다. 빌드는 `resources/new`를 원본보다 우선한다. ui_map의 Source는 `new`다.
- 사용자 확인: 이번에 준 이미지 자료(pic 루트 13개, 새 아이콘 3개)는 모두 UI다. 따라서 13개는 `SNKmod/content/pic/ui/`에 둔다 (결정 10 적용).
- 실제 파일로 빌드한 결과: 이미지 128개(사용 112, 예비 16), 5개 밖 경로 치환 679회, 설치기 시험 30/30 통과. 설치 후 jack.qsp·base.css에 한글 이미지 경로가 0곳이다. `releases/`의 R1 ZIP은 아직 갱신하지 않았다 (패키징 승인 대기).

### R2 패키징 (사용자 승인, 2026-09-25)
- 사용자가 R2로 패키징하라고 승인했다. 사용자가 설치 후 시험할 예정이다.
- 빌드 버전을 R2로 올렸다. `releases/JO9_UI_v1_9_14_SNKmod_R2.zip`: 9,111,180 B, SHA-256 `d8b68119…e28a`, 140개 항목, 비ASCII 파일명 0개.
- 시험 결과:
  - 가짜 게임 폴더 시험 30/30 통과.
  - R1→R2 업데이트: R1 기록은 restored, R2 기록은 applied가 된다. R2 복구 후 jack.qsp·base.css가 R1 설치 전과 같다.
- R1 ZIP은 이력으로 남긴다.

### 사용자 시험 결과와 buttons.zip 검토 (2026-09-25)
- 사용자 R2 설치 시험 결과: 정상. 다만 누락된 이미지가 있다며 `buttons.zip`(28개)을 주었다.
- 비교 기준: FIX6 payload, 선택 버튼 묶음(`JO9_UI_buttons.zip`), 드라이브 게임 원본(`JO9main/game/content/pic/`), jack.qsp 참조.
- FIX6와 바이트가 같은 파일 13개(이미 포함): imprison, lab, net_active/used, release, shield_active/used, teach, whip_active/used, z_ill, z_pregnant, z_wounds.
- 새로 반영할 후보 15개:
  - FIX6에 없고 게임이 `buttons/`로 참조하는 파일 6개:
    - dual_active(32,915 B, 원본 12,860 B), dual_used(30,290 B, 원본 10,803 B) — 208×173.
    - dual_active_trophy(4,115 B, 원본 2,119 B), dual_used_trophy(4,060 B, 원본 1,726 B) — 63×52.
    - heavy_active(37,717 B, 원본 13,829 B), heavy_used(29,295 B, 원본 13,865 B) — 200×175.
    - 참조: $gladiator_setup, $catfighter_setup, конец_боя, trophy_room_screen, toggle_trophy. **toggle_trophy는 승인된 46개 밖이다.**
  - FIX6와 이름은 같고 내용이 다른 파일 3개:
    - thumb_up·thumb_down: FIX6는 400×350(약 147 KB), 새 파일은 200×175(약 37 KB, net/shield/whip과 같은 규격), 원본은 21–22 KB.
    - milk_drop_large: 59×66, FIX6 6,082 B, 새 파일 8,862 B, 원본 18,069 B.
  - pic 루트 파일의 새 디자인 4개: hart_red·hart_green·hart_purple·hart_blue. 40×40, 약 2.3 KB. 원본은 `content/pic/hart_*.png`(40×40, 약 476 B)다. red·green·purple은 base.css와 боевой_интерфейс, конец_боя가 참조하고, blue는 참조가 없다.
  - 참조가 없는 파일 2개: milk_drop_medium(44×49, 5,313 B, 원본 3,276 B), `take a drug.png`(59×66, 8,792 B, 원본 없음, 파일명에 공백이 있음).
- 새 리소스이므로 배치·비교 승인을 받은 뒤에 반영한다. 아직 저장하거나 빌드에 넣지 않았다.

### 중요 정정 — 엔진이 읽는 json 폴더의 참조를 놓쳤다 (2026-09-25)
- 메뉴 항목 아이콘(`$menu_item_*`)은 jack.qsp 어디에도 정의가 없다. `$menu`의 `goto`는 `$args[1]`(= `$menu_item_*`, 아이콘 HTML)을 그대로 출력한다.
- `start_refresh`의 주석에 "engine has been updated to reload json files"라고 적혀 있다. 드라이브 `game/json/`에는 `menu_item.json`(74,222 B), `menu_icon.json`(388,262 B), `slave_index.json`, `slaves/`가 있다. 즉 엔진이 JSON을 읽어 변수를 채운다 (코드상 추정).
- 영향:
  1. 참조 맵(99개 사용, 16개 미사용)은 jack.qsp와 base.css만 본 결과다. JSON 참조는 빠져 있다. 예비로 분류한 16개(fast_*, influence, question, soc_btn 등) 중 일부는 JSON에서 쓰일 수 있다.
  2. FIX6는 원본 경로를 덮어썼기 때문에 JSON이 가리키는 아이콘도 새 그림으로 보였다. R2는 원본을 건드리지 않으므로, JSON이 참조하는 FIX6 이미지는 옛 그림으로 되돌아갔을 수 있다.
  3. `seed_fertility`는 json/slaves에서 정해질 가능성이 높다. 그렇다면 Fer_평시가 "소스상 도달 불가"라는 분석은 틀렸을 수 있다.
- 사용자 스크린샷의 "약물 복용" 메뉴 아이콘(빨간 사각형에 녹색 선)은 원본 `content/pic/ui overhaul/take a drug.png`(5,201 B)로 보인다. 새 디자인(8,792 B)이 반영되지 않은 상태다.
- 다음 조치: 사용자에게 `game/json` 폴더를 받아 JSON 참조를 전수 조사하고, 참조 맵과 빌드에 JSON 경로 치환을 넣는다. JSON은 이미지가 아닌 파일이므로 결정 8에 따라 원본 경로에 덮어쓰고 복구를 제공한다.

### game.zip(json·css·fonts·picture_modding) 전수 조사 결과 (2026-09-25)
- 사용자 지적: 구글 드라이브 원본을 처음부터 제대로 읽었어야 했다. 이후 게임 폴더 전체(qsp·json·css)를 참조 조사 대상으로 삼는다.
- `json/menu_icon.json`: 키 `menu_item` 아래에 메뉴 아이콘 HTML 2,640개가 있다. 이미지 2,054종이며 모두 `content/pic/ui overhaul/`이다. 엔진이 읽어 `$menu_item_*` 변수로 쓴다 (QSP 변수 이름은 대소문자를 가리지 않는다).
- `json/menu_item.json`: 메뉴 id 숫자 표다. 이미지 참조는 없다.
- json·css에서 FIX6 파일을 참조하는 곳은 0곳이다. 따라서 "R2에서 JSON 아이콘이 옛 그림으로 돌아갔을 수 있다"는 우려는 해당하지 않는다. 사용 99개·미사용 16개 분류도 그대로다.
- `json/slaves/*.json`의 seed_fertility 값은 -1, -2, 0, 1뿐이다. Fer_평시(-1·-2·-3 외의 음수)와 Fer_젖소(-3이면서 공개 전)가 소스상 나오지 않는다는 분석은 유지된다.
- json·css의 한글 이미지 참조는 `소리.png`(base.css) 하나이고, 이미 처리했다.
- game.zip의 `css/base.css`(SHA-256 `7ec25fa3…aa06`)는 FIX6 CssBefore 목록에 있다 (FIX6 설치 전 상태).
- `take a drug.png`(원본 `content/pic/ui overhaul/`, 5,201 B)는 menu_icon.json의 `menu_item_take_drug`와 `menu_item_drug_s`에서 쓴다. 스크린샷의 "약물 복용" 아이콘이다. 새 디자인을 SNKmod로 돌리려면 `json/menu_icon.json`의 두 곳을 고쳐야 한다. 이미지 외 파일이므로 원본 경로에 덮어쓰고 복구를 제공한다.

### 사용자 결정 11 — buttons.zip 반영, 이름은 원본대로 (2026-09-25)
- 사용자 지시: 한글 파일을 빼고 모든 이름은 원본대로 둔다. toggle_trophy와 json/menu_icon.json 수정을 승인한다.
- `resources/new/content/pic/`에 저장했다. 빌드는 FIX6·원본보다 이 파일을 우선한다.
  - `buttons/`: dual_active, dual_used, dual_active_trophy, dual_used_trophy, heavy_active, heavy_used, thumb_up, thumb_down, milk_drop_large, milk_drop_medium.
  - pic 루트: hart_red, hart_green, hart_purple, hart_blue. SNKmod에서는 `ui/`에 둔다 (결정 10).
  - `ui overhaul/take a drug.png`: 이름 그대로, 원래 구조 위치.
- thumb_up·thumb_down·milk_drop_large는 FIX6판 대신 새 파일을 쓴다 (사용자 제공 최신본 우선).
- 예비 리소스가 늘었다: milk_drop_medium, hart_blue. 예비 합계는 18개다.
- 이미지 외 파일 덮어쓰기에 `json/menu_icon.json`을 추가했다. 원본(`resources/originals/json/menu_icon.json`, SHA-256 `53296851…64fd`, CRLF·BOM 없음)에서 두 줄(`menu_item_take_drug`, `menu_item_drug_s`)만 SNKmod 경로로 바꾼다. 설치기는 `Overwrite` 목록(base.css, menu_icon.json)을 같은 방식으로 처리한다.
- 결과: 이미지 140개(사용 122, 예비 18), 경로 치환 대상 location 47개(toggle_trophy 추가), 치환 705회. 설치기 시험 30/30 통과, SNKmod 참조 1,000곳이 모두 실제 파일을 가리킨다.
- `.gitattributes`에 `resources/** -text`를 추가해 원본 바이트(CRLF)를 보존한다.

### R3 패키징 (사용자 승인, 2026-09-25)
- `releases/JO9_UI_v1_9_14_SNKmod_R3.zip`: 9,085,710 B, SHA-256 `99b9a604…dc17`, 153개 항목, 비ASCII 파일명 0개.
- 시험 결과:
  - 가짜 게임 폴더 시험 30/30 통과.
  - R2→R3 업데이트: R2 기록은 restored, R3 기록은 applied가 된다. R3 복구 후 jack.qsp·base.css·menu_icon.json이 R2 설치 전과 같다.
- 사용자 R3 Windows 설치·인게임 시험: 이상 없음.
- R3에 포함된 README_KR.txt에 숫자 오류 3곳이 있었다. location "46개"는 47개, 예비 "16개"는 18개가 맞고, RESTORE 설명에 menu_icon.json이 빠져 있었다. 소스만 고쳤다. 배포 ZIP 반영은 다음 패키징 때 한다 (패키징은 승인 후).

### 배포용 설치 패치 (사용자 지시 "설치용 패치를 만들어", 2026-09-25)
- 인게임 시험을 통과한 R3를 배포판으로 만들었다. 설치 내용(이미지·jack.qsp 패치·치환 규칙·CSS·JSON·설치기)은 R3와 바이트가 같다. 다른 것은 README_KR.txt와, 그 해시를 담은 manifest.json뿐이다 (파일별 SHA-256으로 대조).
- README 변경:
  - "미검증 개발판"을 "제작자 환경 시험을 마친 배포판"으로 고쳤다.
  - [빠른 설치] 절을 추가했다.
  - 숫자 오류 3곳을 정정했다.
- manifest Version은 R3 그대로다. 이미 R3를 설치한 사용자가 실행하면 "이미 설치돼 있습니다"로 끝난다.
- `releases/JO9_UI_v1_9_14_SNKmod_R3_release.zip`: 9,086,026 B, SHA-256 `65eedd44…bdb8`, 153개 항목, 비ASCII 파일명 0개. 가짜 게임 폴더 시험 30/30 통과.

### 새 아이콘 1개 제안 대기 (2026-09-25)
- 사용자가 새 아이콘 1개를 주었다: 32×32 RGBA, 2,283 B. 초록 테두리 안에 임신한 실루엣이 있다. 사용자 지시는 "패키징하지 말고 대기"다.
- 규격과 스타일로 보면 `buttons/z_pregnant.png`의 새 디자인으로 보인다. 현재 FIX6판은 32×32, 2,895 B의 옅은 베이지 그림이다. 같은 계열인 z_ill·z_wounds는 초록 테두리 스타일이다.
- z_pregnant 참조: sjm_UI_UIadds 4곳. 노예·조수의 임신 표시이고 툴팁은 "임신함"·"임신"이다.
- 승인을 받기 전에는 저장하거나 빌드에 넣지 않는다.

### buttons.zip 두 번째 검토 (2026-09-26)
- 사용자 지시: 마지막 패키지에 없는 이미지가 있으면 포함한다. ZIP은 만들지 말고 기록만 하고 대기한다.
- 결과: 28개 모두 R3(배포판 포함) 패키지의 SNKmod 파일과 바이트가 같다. 새로 포함할 파일이 없다.
- 이 ZIP의 `z_pregnant.png`(2,895 B)는 현재 FIX6판이다. 앞서 받은 초록 테두리 새 임신 아이콘(32×32, 2,283 B, 채팅 이미지)은 이 ZIP에 없다. 새 아이콘으로 교체할지는 아직 답을 받지 못했다.
- 빌드·ZIP 변경 없음.
- 사용자 답 (2026-09-26): 초록 임신 아이콘은 쓰지 않는다. 다른 아이콘으로 대체할 예정이다. 새 아이콘을 받을 때까지 z_pregnant는 현재 FIX6판을 유지하고 대기한다.
- 사용자 지정 임신 아이콘 (2026-09-26): 베이지 테두리 안에 임신한 실루엣이 있다. 28×30 RGBA, 2,369 B, SHA-256 `08d0517f0e9f8c12…`. 채팅 이미지이며, 청크는 IHDR·IDAT·IEND만 있다 (재인코딩 흔적 없음). `resources/pending/pregnant_icon_28x30.png`에 기록용으로 저장했다. 아직 빌드에 넣지 않았다.
- 규격 참고: 28×30은 jon-UIadds의 Fer_·Vir_ 상태 아이콘 규격이다. 현재 `buttons/z_pregnant.png`(FIX6판)는 32×32다. sjm_UI_UIadds의 z_pregnant 표시 중 두 곳은 `height="32px"`를 지정하고 있어, 28×30 그림을 넣으면 그 두 곳에서는 늘어나 보인다.
- 배치 위치(어느 파일을 대체하는지)는 사용자 확인이 필요하다. ZIP 금지, 대기.

### Codex 0.1 인수 (2026-09-28)
- 사용자 요청에 따라 Codex에서 한 작업(JO9 UI_overhaul_SNKmod 0.1)을 이 대화로 넘겨받았다. 원격 `JO9UIpatch`는 `30fb1b9`다. `codex/snkmod-0.1-handoff`(4d8b927)와 0.1 소스·audits는 아직 원격에 없다.
- 이 브랜치의 R3 계열 기록(`095d6cd` 이후)은 0.1로 대체된다. 구 R3를 최신본으로 수정하거나 배포하지 않는다.
- 0.1 자산 루트는 `game/content/pic/SNKmod/`다 (R3의 `game/SNKmod/content/pic`는 폐기).
- 미해결 두 가지:
  - 독립 설치가 아니다. 원본 경로 UI 참조가 2,157개 있고, 그중 패키지에 없는 변경 이미지가 147개다. 원인은 빌드가 목록 기반으로 치환·검증하기 때문이다.
  - JO9O에서 설치 후 QSP가 바뀐다. 바뀐 뒤 QSP 해시 `cbb3c446…`는 FIX6 manifest의 OriginalQsp와 같다.
- 이전 기록의 "buttons.zip에 새로 포함할 파일 없음"은 목록끼리 비교한 결과라 철회한다.
- 사용자가 FIX6 ZIP을 다시 첨부했다. `baseline/`의 파일과 동일하다. 변경된 SNKmod 정책으로 반영할 대상이다. 예상 대응표 `docs/FIX6_TO_SNKMOD_0_1_MAP.md`를 만들었고, 0.1 소스를 받으면 대조한다.

### 사용자 결정 12 — 독립 설치형의 기준은 순정 잭오나 2.3 (2026-09-28)
- 기준 판: `Jack O Nine Tails v2.3 Kor_nosex.zip`.
- 이 순정 판에 같은 경로·같은 내용으로 있는 이미지는 원본 경로를 그대로 쓴다 (패키지에 넣지 않음).
- 순정에 없는 이미지, 또는 새로 만들어 교체한 이미지(순정과 내용이 다름)는 `content/pic/SNKmod/`에 넣고 참조를 SNKmod로 바꾼다.
- 설치할 때 이 구분(원본 유지 / SNKmod 추가·교체)을 사용자에게 알린다.
- 분류에 필요한 순정 목록 도구: `tools/make_vanilla_manifest.ps1`, `tools/MAKE_VANILLA_MANIFEST.cmd`(ZIP을 끌어다 놓아 실행). ZIP이나 game 폴더에서 content/pic·css·json·jack.qsp의 경로·크기·SHA-256을 `vanilla_manifest.json`으로 만든다. ZIP 안의 game 위치는 jack.qsp로 찾는다. PowerShell 7 합성 ZIP 시험(한글 이름 포함)을 통과했다.
- 적용 계획 (0.1 소스를 받은 뒤):
  1. 0.1의 최종 QSP·CSS·JSON에서 이미지 참조를 전수 추출한다. 정적 경로뿐 아니라 iif·변수 조립 경로도 가능한 만큼 추출한다.
  2. 참조마다 채택할 파일(작업 폴더 JO9 또는 사용자 승인본)의 해시를 순정 목록과 대조한다. 같으면 원본 경로를 유지하고, 다르거나 순정에 없으면 SNKmod에 넣는다.
  3. 빌드 검증을 추가한다. SNKmod 밖을 가리키는 참조는 반드시 순정 목록에 같은 해시로 있어야 하며, 아니면 빌드 실패로 처리한다.
  4. 설치기가 원본 유지 개수와 SNKmod 추가·교체 목록을 화면과 로그 파일로 알린다.
- 사용자 정보 (2026-09-28): JO9O가 현재 순정판과 동일하다.
  - 단, Codex 진단 기준으로 JO9O에는 0.1이 설치된 기록이 있다. `content/pic/SNKmod/`가 생겼고, `css/base.css`·`json/menu_icon.json`은 패키지 것으로 바뀌어 있다.
  - 목록 도구는 `content/pic/SNKmod/`를 제외하도록 고쳤다. JO9O 폴더에서 뽑으면 이미지 목록은 순정으로 쓸 수 있지만, css·json·jack.qsp 항목은 순정이 아닐 수 있다. 순정 ZIP에서 뽑는 것이 가장 정확하다.
- `make_vanilla_manifest.ps1`에 UTF-8 BOM을 붙였다 (Windows PowerShell 5.1이 한글을 CP949로 잘못 읽는 문제 방지). cmd 안내문은 ASCII로 바꿨다. 폴더 입력(SNKmod 제외)과 ZIP 입력을 모두 시험했다.
- 사용자 정보 (2026-09-28): JO9O를 순정으로 복원했다. 이제 JO9O game 폴더에서 뽑은 목록(css·json·jack.qsp 포함)을 순정 기준으로 쓸 수 있다. 목록 파일을 받으면 jack.qsp 해시를 인계 문서의 순정 QSP `070dad…77dc`와 대조해 복원 여부를 확인한다.

### 순정 목록 수신·분류 (2026-09-28)
- `reference/vanilla_manifest.json`: JO9O game 폴더에서 뽑은 18,214개 항목이다 (content/pic 17,214개).
- 순정 확인: jack.qsp `070dad…77dc`(인계 문서의 순정 QSP), css/base.css `7ec25fa3…`, json/menu_icon.json `53296851…`(game.zip과 같음). SNKmod 잔존 파일 없음. 순정 복원이 확인됐다.
- FIX6 이미지 115개를 순정과 비교한 결과:
  - 내용이 다름 79개, 순정에 없음 35개 → SNKmod 대상.
  - 순정과 같음 1개(`bg/trophy/trophywall.png`, 예비 리소스) → 결정 12에 따르면 원본 경로에 두고 패키지에서 뺀다.
- `resources/new`의 사용자 새 디자인 18개는 모두 순정과 다르다 → SNKmod 대상 (현행 유지).
- 한글 이름 pic 루트 13개(`resources/originals`)는 순정과 바이트가 같다. 결정 12만 적용하면 원본 경로를 그대로 쓰게 되지만, 결정 9(한글 파일명은 영문으로 바꿔 모드에 포함)와 충돌한다 → 사용자에게 확인한다.
- menu_icon.json이 참조하는 이미지 2,054개 중 12개는 순정에도 없다 (agraba_gray, agraba_poor2, agraba_poor2_gray, cum_gray, elisabet_gray, farm_shop, futaland_tower_gray, kamasutra, left hand_gray, over the shoulder_gray, right hand_gray, sabrina_2_gray). 순정 자체의 누락이다. 우리가 가진 파일이 없으므로 보고만 한다.

### 사용자 결정 13 — 대원칙: QSP가 연결하는 파일명에 한글을 남기지 않는다 (2026-09-28)
- 영어로 이름이 바뀐 파일은 내용이 순정과 같더라도 변경된 파일로 본다. SNKmod에 넣는다.
- QSP(와 CSS·JSON)가 연결하는 이미지 파일명은 한글로 두지 않는다. 결정 12(순정과 같으면 원본 경로 유지)보다 이 원칙이 우선한다.
- 적용 방법:
  - 한글 이름 pic 루트 13개는 현행대로 영문 이름으로 SNKmod `ui/`에 넣는다.
  - 0.1 전수 검사 때 한글 이름 참조가 남아 있으면 빌드 실패 조건으로 둔다 (지금 빌드의 비ASCII SNKmod 파일명 검사를 참조 전체로 넓힌다).
  - 새 한글 파일이 나오면 사용자에게 알리고 영문 이름을 받는다 (결정 9 유지).
- 12개 누락 파일 상세 (2026-09-28 보고):
  - 순정에 정상판이 있는 `_gray` 8개: agraba_gray, cum_gray, elisabet_gray, futaland_tower_gray, left hand_gray, over the shoulder_gray, right hand_gray, sabrina_2_gray.
  - 순정에 짝이 없는 4개: agraba_poor2, agraba_poor2_gray, farm_shop, kamasutra.
  - 사용처(FIX6 상태 jack.qsp 정적 검색): `$menu_item_cum_gray`만 #sex_options·#sex_options_woman에서 쓴다. 나머지 11개 키는 정적 참조가 없다. 0.1·순정 QSP와 동적 조립 경로는 아직 확인하지 않았다.
- 사용자 지시 (2026-09-28): cum_gray는 cum.png를 회색 처리해 넣는다. 누락 목록은 별도 문서로 저장한다 → `docs/MISSING_MENU_ICONS.md`. 화면 코드 확인은 QSP뿐 아니라 제공 ZIP의 내용(qsrc·json·css·txt)까지 함께 본다.
- ref.zip 전수 검색 결과도 같다. 12개 키 중 `menu_item_cum_gray`만 #sex_options·#sex_options_woman(각 4곳)에서 쓰인다. 키를 동적으로 조립하는 코드는 없다.
- cum_gray.png 생성 (2026-09-28): 순정 회색 처리 방식을 예시 한 쌍에서 분석해 재현했다. 재현 오차는 1.72이고, 결과는 `resources/new`에 보관했다. 0.1 빌드에 적용할 예정이며, 구 R3 빌드는 건드리지 않았다. 상세는 `docs/MISSING_MENU_ICONS.md`에 있다.


## 2026-10-15 테스트 시작 버튼 종료 후속

[직접 로드 세이브와 검증 한계](MEIKI_READY_SAVE_RECOVERY_20261015.md): 주석 수정 뒤에도 종료 재현. 기존 EXEC 초기화 버튼을 폐기하고 정상 홈 세이브의 성인 이사벨라를 오프라인으로 준비한 JO9_MEIKI_READY_20261015.sav를 두 설치본에 배치. 게임 QSP/CSS/원본 저장 파일 보존. 실제 클라이언트 로드·클릭은 아직 사용자 확인 대기.


## 2026-10-15 검은색·황금색 체리 프레임 수정

[아이콘 수정과 test2 확인](CHERRY_FRAME_FIX_20261015.md): 두 아이콘을 기존 28×30 배경·테두리·줄기·alpha와 동일하게 복구. 두 설치본 8개 자산과 QSP 표시 폭 14곳만 변경, CSS·상태 로직 보존. test2 이사벨라의 발견 상태4/known1 및 S+1개·B+5개 저장 확인. 수정 아이콘의 게임 화면은 사용자 재확인 대기.


## 2026-10-15 가장 오래된 펜딩 순차 처리

[순차 처리 장부](PENDING_ISSUES_20261015.md): 첫 항목은 2026-09-27 등록 BUG-001 아마란스 살롱 이전 서비스 이미지 잔류. 현재 두 설치본에 이벤트 4곳 초기화 및 화면 2곳 보호가 이미 있다. 게임 파일은 추가 변경하지 않음. 옛 미해결 기록을 수정 반영 완료·사용자 재현 확인 대기로 정정하며 다음 항목은 아직 착수하지 않음.


## 2026-10-15 BUG-001 사용자 해결 확인 및 다음 펜딩

사용자가 아마란스 살롱 이미지 이벤트 교체 시 이미 해결됐다고 확인해 BUG-001을 종료한다. 새 수정이나 재시험을 요구하지 않음. 다음은 2026-10-03 인계의 BUG-002(애완묘 훈련 후 간헐적 메인 화면 공백)로, 현행 발생 여부·재현 세이브 확인 단계다. 게임 파일은 이번 정정에서 변경하지 않음. [순차 처리 장부](PENDING_ISSUES_20261015.md).


## 2026-10-15 BUG-002 잠정 해결 및 전투 메뉴 확인

사용자 재현 불가·잠정 해결 지시에 따라 BUG-002를 종료, 재발 시에만 재개한다. 원인 확인이나 코드 수정 완료로 기록하지 않는다. 다음은 10월 10일 전투 메뉴 줄바꿈 복구의 사용자 화면 확인. 두 설치본 4개 복원 조각 존재·옛 조각 부재 확인, 게임 추가 변경 없음.


## 순차 검토 후속 — 전투 메뉴·무기 정렬 종료

사용자 “정상표시 된다.”와 무기 정렬 안내 뒤 “정상” 확인으로 두 표시 이슈 종료. 두 게임의 수정 코드 존재도 확인했고 추가 게임 변경은 없다. 다음은 10월 10일 기록의 중앙 전투 로그 공백으로, 메뉴와 별도로 현행 증상 확인 단계다. [순차 장부](PENDING_ISSUES_20261015.md).
