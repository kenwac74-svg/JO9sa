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
