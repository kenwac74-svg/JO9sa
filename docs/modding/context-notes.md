# JO9 로컬 모딩 — 작업 결정과 근거 기록

계속 덧붙인다. 확인한 사실과 추정을 구분한다.

## 2026-10-01 세션 1

### 확인한 사실
- 클라우드 repo(`kenwac74-svg/JO9sa`)에는 `jack.qproj`, `locations/*.qsrc`, 풀린 `jack.qsp`가 없다. UI 패치 도구, FIX6 원본 ZIP(`baseline/`), SNKmod 패키지(`releases/`)만 있다.
- FIX6 ZIP에는 `payload/engine/jack.exe`와 `qsp-patches.json`이 있다. `tools/qsp_dump.py`는 `jack.qsp`의 location을 JSON으로 푼다.
- 클라우드 환경에는 wine이 없어 게임 실행 검증이 불가능하다.

### 결정
- 소스 수정은 클라우드가 아니라 사용자 PC의 로컬 Claude Code에서 한다 (사용자 선택).
- 로컬 게임 폴더는 `C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex`.
- 기존 `docs/checklist.md`, `docs/context-notes.md`는 UI 패치용이라 덮어쓰지 않고 `docs/modding/`에 따로 둔다.

### 최신 소스 보관 (2026-10-01)
- 사용자가 준 `jack.qsp`를 `source/jack_2026-10-01.qsp`로 저장했다 (표는 `source/README.md`). 이후 분석은 이 파일 기준이다.

### 이벤트 이미지 랜덤 선택 구조
- `display_pic` location이 이미지 경로를 만든다. 경로는 `girls/sex_scenes/<행위>/<행위>_<머리색>_<길이>_<나이>_<번호>` 형식이다. 번호 1은 접미사가 없고 `_2`부터 붙는다.
- 선택 순서는 풀 구성(특정/공용, 2인이면 A~B 순서도 랜덤), 특정 대 공용 `rand`, 번호 `rand(1, picMax[풀])`, 직전 번호(`last_pic`) 재추첨 회피다.
- 고유 씬 태그(`$<배우>_scene_tag`)가 있고 그 풀에 이미지가 있으면 그 풀을 항상 우선한다. 특정 이벤트 전용 이미지에 쓸 수 있는 후보 방법이다.
- `picMax[...]`는 `.qsp` 전체에서 읽기만 하고 대입하는 곳이 없다. 폴더의 파일 수를 세어 채우는 주체는 엔진(`jack.exe`)으로 추정한다. 아직 확인하지 않았다 (Drive의 `add_scene.py` 주석에 "게임이 폴더를 세어 자동 인식(picMax)"라고 되어 있다).
- `picMax['이름']`을 직접 쓰는 이벤트(예: `interaction_city`의 `service_*`, `arena_*`, `end_day_screen`의 `escape`)는 `display_pic`을 거치지 않고 `rand(1, picMax['키'])`로 번호를 뽑는다.

### 화면 확인 방식 (2026-10-01)
- 사용자가 직접 플레이하며 지시하고, Claude는 `tools/screenshot.ps1`로 화면을 캡처해 이미지로 읽는다. 키 입력·클릭 자동화는 하지 않는다.
- 스크립트는 Linux 클라우드에서 실행할 수 없어 시험하지 못했다. 로컬에서 처음 실행해 확인해야 한다. 게임 창 제목에 "Jack"이 들어가야 창만 캡처되고, 아니면 주 모니터 전체를 캡처한다.

### 첫 수정 완료와 새 PC 재현 체계 (2026-10-01)
- 수정: `city_menu_form` 본문의 홍등가 메뉴 라벨 `'환락 센터'` → `'사창가 골목'` (1곳). 사용자가 게임 화면에서 직접 확인했다.
- 게임 qsp의 실제 위치는 `<게임폴더>\game\jack.qsp`, 엔진은 `<게임폴더>\game\engine\jack.exe`다. 이 PC의 적용 전후 SHA-256은 `59E1A1AF…F5958E` → `936C7AFB…DA24`(+2바이트)다. 장소 안쪽 제목 `'은밀한 유흥관'`(`#place_base`)은 바꾸지 않았다.
- 재현 체계(로컬 세션이 구현, 커밋 `98fb608`): `mods/*.json`(선언형 패치 기록) + `tools/apply_mods.ps1`(Python 불필요). 해시로 적용 상태를 판단하고, 왕복 검증과 백업 후에만 쓰며, 이미 적용됐으면 건너뛰고, 예상 밖 해시면 중단한다. 새 PC 순서는 `docs/modding/NEW_PC_KR.md`.
- 로컬 세션이 임시 폴더에서 시험한 결과(로컬 세션 보고, 이 클라우드 세션은 실행하지 못함): 원본 복사본 → 왕복 통과 → 치환 → `936C7AFB…` 일치, 재실행 시 "이미 적용됨", 다른 버전 해시는 중단.
- 한계: 대상 `jack.qsp`가 이 repo의 기준 버전(`59E1A1AF…`)과 바이트 동일해야 적용된다. 다른 버전이면 중단한다. 이때 문자열 단위 적용 모드가 필요하다면 별도로 만든다.
- 로컬 세션이 보고한 점: `.ps1` 파일은 UTF-8 BOM이 있어야 Windows PowerShell 5.1이 한국어를 올바로 읽는다. repo의 `.ps1`을 BOM 포함으로 저장했다. 버린 파일(`setup_local.ps1`, `qsp_patch.py`, `docs/NEW_PC_SETUP_KR.md`)은 로컬 브랜치 `local-work-20261001`에만 있다.

### 로베르투스 루푸스 미술 교사 분리 (2026-10-01, 다른 세션 핸드오프)
- 출처: 사용자가 준 `JO9_ArtTutor_RobertusRufus_LocalChanges_20261001.zip`(다른 로컬 게임 기준의 전체 `jack.qsp`·qsrc·`menu_icon.json`과 이미지 3개). ZIP의 `jack.qsp`(16,716,622 B)는 이 repo의 기준 `source/jack_2026-10-01.qsp`와 다른 파일이라 통째로 덮어쓰지 않고 루푸스 관련 줄만 뽑았다.
- ZIP과 기준 파일은 243개 location이 서로 다르다(개인실 보호 줄, 경로, 개인실·식단 문구 등 루푸스와 무관한 기반 차이). 루푸스 관련 변경은 4개 location의 아래 줄뿐이다.
  - `interaction`: 미술 수업의 `$coach = 'walz'` → `'robertus_rufus'`, `$bg_path` → `SNKmod\characters\master_robertus_rufus` (음악 수업의 `walz`는 그대로).
  - `interaction_result`: `$coach = 'robertus_rufus'`일 때 `$robertus_rufus_diligence[...]`를 쓰는 줄 추가.
  - `#txt_man`, `#txt_woman`: `$art_coach` 첫 대사를 루푸스로 교체하고 평가 대사 `$robertus_rufus_diligence[0~5]`를 추가(한국어 `#txt_man`, 영어 `#txt_woman`). 평가 등급과 비용·능력치 처리는 기존대로다.
- 기록: `mods/2026-10-01_robertus_rufus_art_tutor.json`(edit 4개, 모두 count 1). 앞 패치(`2026-10-01_city_menu_label`)의 적용 후 해시 `936C7AFB…DA24`에서 이어지고, 적용 후 해시는 `DCFC4D65…E2BB`(17,026,220 B)다. 이 해시는 이 세션의 Python 구현으로 계산한 값이며(앞 패치 해시는 PC의 `apply_mods.ps1` 결과와 일치했다), 루푸스 패치의 PC 실행 결과는 아직 확인하지 않았다. `tools/qsp_verify.py`로 후보를 검사하면 PASS, 기준 대비 바뀐 location은 5개(`city_menu_form` 포함)다.
- `mods`에 넣지 않은 것(UI 쪽 작업): 이미지 3개(`SNKmod/characters/master_robertus_rufus.png`, `SNKmod/ui overhaul/robertus_rufus.png`, `…_gray.png`)와 `json/menu_icon.json`의 `menu_item_art_tutor`, `menu_item_art_tutor_gray`(원본의 `walz.png`/`walz_gray.png` → 루푸스 이미지). ZIP의 `menu_icon.json`에는 루푸스와 무관한 `menu_item_take_drug`, `menu_item_drug_s` 변경도 있다(UI 세션이 이미 처리한 변경이라 제외).
- 주의: `interaction` edit의 `new`에는 이미 SNKmod 경로(`SNKmod\characters\...`)가 들어 있다. UI 빌드가 mods의 이미지 경로를 SNKmod 경로로 바꾸는 변환을 하므로, 이미 SNKmod 경로인 문자열이 중복 변환되지 않는지 UI 세션이 확인해야 한다(UI 세션 확인 전).
- 핸드오프 원문의 전제: 초기 이미지·대사 수정은 사용자가 정상 작동을 확인했고, 경로 이동과 아이콘 변경의 플레이 검증은 별도로 필요하다. UI 패치 통합·패키징은 사용자가 지시할 때만 한다.

## 2026-10-02 세션 1

- `#place_base`의 지역 제목 `은밀한 유흥관`을 `사창가 골목`으로 통일하는 패치를 적용했다. 게임 QSP 적용 후 SHA-256은 `81526C0B2A890ADC1663748A7CD14734D4EFB68DF48CAA737A5FD7C90B15CE88`이며, 적용 전 파일은 `jack.qsp.bak_20261002_044142`로 백업했다.
- 사용자가 게임에서 변경된 제목을 확인했다.
- 이 PC의 게임 `jack.qsp` 상태(2026-10-02 확인): `81526C0B…CE88` = 원본 + 사창가 골목 메뉴 라벨 + `#place_base` 제목. 루푸스 패치는 아직 적용 전. 백업: `jack.qsp.bak_20261002_033841`(원본 `59E1A1AF…`), `jack.qsp.bak_20261002_044142`(`936C7AFB…`), `jack.qsp.PC2_20261001`(이 PC의 원래 qsp, 16,716,622 B, `42253490…A5BE`).

### apply_mods.ps1 edit 단위 멱등 적용 (2026-10-02)
- 해시 체인 판단을 없애고 edit마다 `old`가 `count`번이면 적용, `new`가 `count`번이면 건너뜀, 둘 다 아니면 중단하도록 바꿨다. 해시는 참고 출력만 한다. 왕복 검증·백업·쓴 뒤 해시 재확인은 유지. `new`가 `old`를 품는 경우는 `new`를 먼저 본다.
- 임시 폴더 원본 복사본 시험: 메뉴 라벨+루푸스 → `DCFC4D65…E2BB`, 재실행 시 전부 건너뜀, 순서를 바꿔도 `DCFC4D65…E2BB`, old/new 없는 edit은 중단(쓰지 않음). 세 mods 전부 → `26E15AAF30B6226A2883C6B532A6EE4EED34791110618597D234BB7D6FA3E052`. 이 PC 게임 qsp 복사본(`81526C0B…`)에 세 mods를 적용해도 같은 `26E15AAF…E052`.

### 홍등가 mods 2개 추가와 UI 반영 요청 (2026-10-02, VS Code 세션)
- `mods/2026-10-02_redlight_text.json`: `#txt_man` 홍등가 펠라 담당 대사 `자기 불알을 가지고 놀아 보라는 듯` → `자기 가슴을 가지고 놀아 보라는 듯` (count 1).
- `mods/2026-10-02_redlight_bj_variant.json`: `interaction_city` 펠라 담당 장면에서 `whore_redlight_bj_variant = rand(1, 2)`로 변형을 무작위 선택한다. 2이면 `$special_image[2]`, `[3]`을 `SNKmod\scene\whore_redlight\whore_redlight-1121.png`, `-1131.png`로 바꾼다. 1이면 기존 `-112`, `-113`이다 (count 1). `interaction_city`는 UI 세션이 화면 코드를 바꾼 location 목록(35개)에 들어 있어서, UI 빌드 본문에서 `old`가 정확히 1번 나오는지 UI 세션이 확인해야 한다.
- 이 PC 게임 `jack.qsp`는 기준 원본에 `main`의 mods 3개와 위 2개, 총 5개 mods를 모두 적용한 상태다. `apply_mods.ps1 -DryRun`에서 8개 edit이 전부 "이미 적용됨"이었고 SHA-256은 `8D963AE88DCEA0DB9500B29BCD5112933ABD81042D5BE8516113840094E607C6`(17,026,702 B)다. 이 해시는 이 PC의 PowerShell 구현으로 읽은 값이다.
- UI 쪽에 필요한 파일(이 PC `game\content\pic` 기준, 모두 존재 확인): `SNKmod\characters\master_robertus_rufus.png`(735,178 B), `SNKmod\ui overhaul\robertus_rufus.png`(8,235 B), `SNKmod\ui overhaul\robertus_rufus_gray.png`(6,171 B), `SNKmod\scene\whore_redlight\whore_redlight-1121.png`(535,175 B), `SNKmod\scene\whore_redlight\whore_redlight-1131.png`(514,654 B). `json\menu_icon.json`의 `menu_item_art_tutor`, `menu_item_art_tutor_gray`는 위 루푸스 아이콘을 가리키고 있다.
- 게임 실행 점검은 사용자가 수동으로 한다. 이 PC에서 5개 mods 전체의 화면 점검 결과는 아직 받지 못했다.

### 개인 영업녀(22703) p 시퀀스 (2026-10-03, homecom)
- `mods/2026-10-03_whore_redlight_c_p_sequence.json`: 홍등가 사창가 골목 > 경험 많은 여자들 > 개인 영업녀(`interaction_city = 22703`, 남자 주인공 분기)의 `whore_redlight-211`(배경)/`212`/`213`을 `SNKmod\scene\whore_redlight\whore_redlight-p001`~`p003`으로 교체(count 1). 노트북의 r/s, t/u 시퀀스와 같은 방식으로 `$special_bg`와 `$special_image[1]`에 p001, `[2]`/`[3]`에 p002/p003.
- old 문자열은 기준 원본(`source/jack_2026-10-01.qsp`)과 이 PC 게임 qsp 모두에 1번 있다. 이 PC 게임 qsp `76FB3394…9BAA` → `B30E31E3…A2BA`, 백업 `jack.qsp.bak_20261003_230921`.
- 이 PC 게임 qsp에는 노트북 브랜치(`claude/elegant-carson-nbb823`)의 홍등가 시퀀스 mods 3개(r/s, b_u, t/u)도 적용돼 있다(2026-10-03, 이미지 12개는 `assets\`에서 설치). 그 3개는 아직 main에 병합되지 않았다.
- p001~p003 이미지는 사용자가 게임 폴더 `game\content\pic\SNKmod\scene\whore_redlight\`에 넣었다. repo `assets\`에는 없다. 게임 화면 점검은 사용자가 한다.
