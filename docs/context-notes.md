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
