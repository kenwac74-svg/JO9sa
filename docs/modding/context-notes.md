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

### 2.4 전환 후 첫 정리 (2026-10-04, homecom)
- 사용자 결정: 홍등가 mods는 2.4 정식 콘텐츠. 2.4 경로 전환(`SNKmod\` 제거)은 카일 빌드가 일괄 처리하므로 mods와 assets는 SNKmod 경로 그대로 둔다.
- 노트북 브랜치(`claude/elegant-carson-nbb823`)에서 mods 3개(`2026-10-02_whore_redlight_sequences`, `2026-10-03_whore_redlight_b_u_sequence`, `2026-10-03_whore_redlight_b_v_tu_random`)와 `tools/apply_mods.ps1`의 "뒤 mod가 앞 mod 결과를 다시 바꾼 edit은 적용된 것으로 건너뜀" 수정을 main에 가져왔다. 이 수정이 없으면 r/s 시퀀스가 `2026-10-02_redlight_bj_variant`의 결과를 덮어써서, 모두 적용된 qsp에서 apply_mods가 중단된다. 브랜치의 다른 도구·스냅샷 qsp는 가져오지 않았다.
- r/s 시퀀스가 적용되면 `whore_redlight-1121`/`1131`(bj_variant용)은 쓰이지 않는다.
- `mods/2026-10-04_credits_2_4.json`: `credits` 화면에 "잭오나 2.4.0 한국어판 - 2.4 작업: SAnk", 변경 내역 한 줄, "AI 걸 팩 이미지는 smsfbatalovehandle 님의 작업" 추가(원본 한국어판 감사 문구 뒤, count 1). 변경 내역 문구는 초안이며 사용자 점검 대상.
- 검증: 기준 원본 복사본에 mods 10개 전체 적용 → `6D5E7563DEB3A155437D2F14E5756D9BDCA95DED2A9B76FD7D0615596B06A05B`, 재실행 시 전부 건너뜀. 이 PC 게임 qsp도 같은 해시(백업 `jack.qsp.bak_20261004_002852`).
- `assets/content/pic/SNKmod/scene/whore_redlight/`에 홍등가 시퀀스 이미지 15개(p/r/s/t/u 001~003)를 넣었다(`assets/README.md`).
- BUG-001(아마란스 살롱 `$service_picture` 잔류)은 2.4.0에서 미해결로 남긴다. 로컬 해결 과제.

### 2.4 결정·이미지 교체 팩 v8·IMGMG (2026-10-04, homecom)
- 상세는 `docs/session-handoffs/2026-10-04/homecom-2026-10-04.md`. 요점: 대체된 구버전 원본 이미지는 2.4에서 폐기, 여자 주인공 플레이 제거 예정(범위 미정), 엔진·창 제목은 빌드 지시 때, 테스트 게임 QSP는 그대로, BUG-001은 2.4.0 미해결, 이미지 교체 팩은 버전업과 무관하게 사용자 작업물만 수시 배포(v8부터 `game/` 구조).
- `whore_redlight-1121/1131`은 참조 0 확인 후 게임 폴더·IMGMG에서 삭제.

### 이미지 무작위 선택 규칙 정리 (2026-10-04, homecom)
- `docs/modding/IMAGE_RANDOM_RULES.md`: 번호 규칙(기본 이름 + `_2`…), `picMax`(qsp에 대입 코드 없음, 엔진이 채우는 것으로 추정), `display_pic`의 특정/일반·2인(`A~B`) 풀, 반복 방지, 모딩 반영법. 창 제목은 `game\config.xml`의 `title`.
- 체크리스트 카탈로그: 400px 미만(UI·포트레이트)은 기본 숨김, 큰 그림과 이름 줄기가 같은 짝은 그 카드 안에 함께 표시.

### 대사 편집실(Codex, tools/text-workshop) 점검과 첫 반영 기록 (2026-10-04, homecom)
- 테스트 9개 통과(Codex 번들 node v24). 실제 게임 qsp로 읽기 전용 확인: 바이트 왕복 일치, location 248, 문자열 133,291, 장면 탐색 동작. 저장소본과 게임 설치본(`G:\somi\JO9\game\modtools\text-workshop`) 동일.
- 사용자가 편집실로 1건 반영(10-04 05:39): `interaction_city` 22700 사창가 골목 첫 화면 "엘리트 모담 조프리 살롱" → "고급스러운 마담 조프리 살롱". 게임 qsp `6D5E7563…` → `88F6A7F0…`. mods에 없어서 `mods/2026-10-04_redlight_intro_text.json`으로 최소 문구만 기록(원본에서 mods 11개 → `88F6A7F0…`, 게임 qsp DryRun 전부 건너뜀).
- 주의: 편집실의 "수정 기록 내보내기"는 old/new에 **location 필드 전체**를 넣는다(이번 건은 약 130만 자). 그대로 mods에 넣으면 파일이 1 MB를 넘고 같은 location의 다른 mod와 충돌한다. 내보낸 JSON은 그대로 쓰지 말고 바뀐 문구만 old/new로 줄여 기록한다(개선 제안: 내보내기를 바뀐 문자열 + 앞뒤 맥락의 최소 고유 구간으로).


### 대사 편집실 분기/이미지 체크리스트 연동 (2026-10-04, Codex)
- 사용자 승인 후 「분기 한눈에」 UI, 대사 배열 → 사용 장면 → 단계 이미지 추적, 조건별 카드, 최신 플레이 이미지와 체크리스트 공통 상태·카드 이동을 추가. bg/UO 등 파일별 고정 번호와 큰 그림 연결 번호 원장은 IMGMG에 보관. 자세한 경로·규칙·한계·검증은 `tools/text-workshop/VERIFICATION.md`의 마지막 절.
- 저장소와 게임 설치본 동일 배치. 사용자 승인 후 편집실 3813 서버만 재시작. 실제 문제 대사의 2단계 이미지와 SC-1395 확인. 테스트 16개 및 시험 화면 양방향 상태 확인. QSP와 기존 체크 상태, 게임 리소스 변경 없음. 번호 원장 `catalog_work_ids.json`은 PC 이전 때 반드시 함께 옮긴다.


### 안개괴물 착정 전용 버튼 (2026-10-04, Codex)
- 사용자 제공 `Fer_착정.jpg`를 비율을 유지한 32×32 RGBA PNG `content/pic/buttons/Fer_Tentacle.png`로 반영. 노예와 조수 단축 버튼의 폐기된 녹색 이미지 두 곳만 교체했다. 표시 조건·툴팁·interaction 59/45는 유지.
- 선언형 패치: `mods/2026-10-04_fog_milking_button.json`. 리소스: `resources/new/content/pic/buttons/Fer_Tentacle.png`(SNKmod 없는 2.4 경로). 플레이 및 IMGMG merge_work에 동일 이미지 배치. UI 패치 통합·패키징은 하지 않았다.
- 게임 QSP SHA-256: `88F6A7F0A8060E47DFB0475FED4AD1D66442DABDADB931E8C71E744BE2F08FA6` → `A90A9ED558F1F48115AA15FEFEE06FD5D4BF984497F4EA8087FD8DEAF208E6CB`. 원본 왕복 일치, 복사본에 apply_mods 적용 결과 일치, 변경 location은 main_screen 하나·이미지 경로 두 곳. 기존 녹색 이미지와 원본 JO9O는 유지.
- 체크리스트 UI-0559 추가 및 done 체크. 기존 항목·번호·체크 상태·PIC 공유 등록 기능 유지. progress.json/history.jsonl에도 기록. 백업 및 제공 원본: `G:\somi\IMGMG\image_work\backups\fog_button_20261004_191021`. 게임 실행·화면 검증은 사용자 담당(미검증).


### 대사 줄맞춤·주인공 호칭 통일 (2026-10-09, Codex)
- 사용자 기준: 머리 대시 제거, NPC 이름 아래 <br>&nbsp; 한 칸 들여쓰기, 물리 개행·탭 정리, 주인공 너는/넌→당신은. 다른 인물을 지칭하는 말과 의도 문단은 유지.
- 6674개 표시 문자열 정리. 규칙은 DIALOGUE_FORMAT_RULES_KR.md, mods/2026-10-09_dialogue_format_and_protagonist.json에 선언형 기록. 실행 코드·치환문·HTML 속성 보존 및 공식 적용기 재생·재적용 검사 통과.
- 플레이 QSP 165F3986B3B3 → 11E712F41E96. 순정 변경 없음. 편집실 백업/이력에 일괄 기록. 게임 화면 확인은 사용자 담당.

- 공유 저장 후 재시작 검증에서 PowerShell 명령 본문의 `-File`을 워크샵 스크립트 인자로 오인하는 런처 오류를 수정했다. 명령 실행 옵션(축약형 포함), 상대 경로, 잘못된 프로세스 경로를 무시하며 실제 워크샵 PID/포트 검증은 유지한다. 격리된 런처 회귀 검사를 통과했다.


### 조프리 개인 대사 누락 복구 (2026-10-09)
- 집컴 10월 6일 백업의 가게명·입장 벽보가 노트북 이전 QSP와 오늘 서식 정리 전 QSP에서 이미 누락된 것을 확인했다. 정확한 덮어쓰기 실행 시점은 확정하지 않았다.
- 최신 체크·하트 아이콘 벽보와 마담 조프리 가게명 2곳을 현재 플레이에 복구했다. 전체 과거 QSP로 되돌리지 않았으며 최근 이미지 컷과 대사 서식은 유지한다.
- mods/2026-10-09_restore_joffrey_personal_text.json 및 records/dialogue/2026-10-09_joffrey-recovery.json에 원본 이력·대조 해시·복구 범위를 기록했다. 현재 파일 백업, 코드 보존, 공식 적용기 일치·재적용 검사를 통과했다. 게임 화면은 사용자 확인 대기.


### 조프레 → 조프리 전역 표기 통일 (2026-10-09)
- 사용자 명시 지시에 따라 현재 플레이의 남은 9곳(대사 3, 선택지 3, 장소 정보 2, NPC 정보 1)을 변경했다. 이전 표기 잔여 0건. 복구된 벽보와 다른 대사 내용·실행 코드는 유지했다.
- mods/2026-10-09_joffrey_name_unification.json 및 records/dialogue/2026-10-09_joffrey-name.json에 기록. 현재 파일 백업, QSP 왕복, 코드 보존, 공식 적용기 일치·재적용 검사 통과. 순정 수정 없음.


### 도시·메시지 화면 메뉴 위치 통일 (2026-10-09)
- 사용자가 대금업자 메뉴와 동부·홍등가·중앙 구역 UI 위치 불일치를 지적했다. 공통 상점 메뉴가 그림 #bg 원점에 붙던 구조와 도시별 spacer/상대 위치를 제거했다.
- 메시지 화면: 왼쪽 x36/y64, 오른쪽 x420/y64. 도시 최상위: 왼쪽 x36/y96, 오른쪽 x420/y96. 메뉴 폭 330px, 행 간격 62px 유지. city_screen 및 공통 상점/길드 등 7개 렌더러에 한정하며 개인 방의 별도 UI는 변경하지 않았다.
- 공통 스타일은 $menu의 layout_style에서 반환해 QSP와 함께 이전된다. 선택지 조건·이동 명령·대사·이미지·인물 상태 패널은 변경하지 않았다. 우측 UI가 상태 패널인지에 대한 질문은 미응답이므로 현재는 선택지 열을 기준으로 적용했다.
- 왕복·공식 재생·재적용·기준 좌표 경계 검사 통과. 내장 브라우저는 file URL 시험 화면을 정책상 차단했다. 실제 게임 렌더링은 사용자 확인 필요.


## 2026-10-09 카탈로그 양쪽 이미지 작업폴더 복사
- 원본 및 현재/교체 이미지 각각 작업폴더로 복사 버튼 제공. source 구분을 복사 API, 하단 미리보기, 수동 OpenRouter 요청과 대화 식별에 유지. 기존 원본/B컷 호출 호환.
- 기존 같은 이름 충돌 확인, 백업 및 변경 해시 검증 유지. 순정 및 QSP 변경 없음. 버튼/출처 회귀 및 JS 문법 검사 통과.


## 2026-10-10 일반 임신 단계 표시
- 기존 pregnant 일수와 pregnant_revealed를 이용. 미발견 120일 미만 숨김; 120일 중기, 196일 후기, 273일 만삭. 120일은 기존 발견 조건이며 196/273은 표시용 구분. 150일 교회 이벤트는 그대로.
- 활성 캐릭터 특성 목록과 노예/조수 홈 아이콘 툴팁 적용. 노예 아이콘이 조수 발견값을 참조하던 오류 수정. 알려진 임신은 청진기 없이도 표시. 산란·비임신·기생 상태 제외. 괴물 임신은 기존 의료 진단 표시 유지; 위험 시점 확인 전 단계 추정하지 않음.
- 저장된 특성 렌더러에는 표식으로 한 번만 표시 코드 추가. 인물 수치/진단/출산/교회 이벤트 불변. 동결 목록·주인공 별도 표시는 이번 범위 밖.
- 왕복, 공식 패치 재생/재적용, 16개 표시 경계 사례 검사 통과. 실제 게임 화면은 사용자 확인.


## 2026-10-10 개인실 UI 선택 복원
- 홈컴 10월 6일 백업에서 개인실 1~4의 화면, 종합정보 팝업, 소지품/교육 메뉴 및 방 복귀 연결을 현재 QSP에 선택 복원. 현재 QSP는 before-private-room-ui 이름의 검증된 별도 백업으로 보관.
- snk_room_bridge/snk_room_menu_screen 2개 location 추가. 기존 location에 대상 방의 인물 복원을 위한 조건부 이동 guard를 복구하며 기존 본문은 UI 대상 외 유지.
- 현재 이미지 경로와 이미지 워크샵 중계, 최근 대사, 임신 표시 함수를 유지. 개인실 임신 아이콘도 같은 표시 함수 사용. 과거 식단 마이그레이션/일일 효과 변경 및 출산 이벤트 라우팅은 적용하지 않음. 식단 창은 현재 게임의 값/주방 조건에 맞춤.
- apply_mods.ps1에 add_locations(빈 actions) 지원 추가. 동일 내용 재적용은 건너뛰고 기존 location 충돌은 쓰기 전에 중단. 선언형 mod로 복원 내용 재현 가능.
- 왕복, 공식 재생 일치, 반복 적용, 블록 균형, 이미지 존재 검사 통과. 실제 게임 화면은 사용자 확인 대기.


## 2026-10-10 개인실 UI 누락 결정 복구 (직전 복원 기록 정정)
- 직전 복원에서 식단을 제외한 결정은 잘못이었다. UI 편집 4의 사용자 채택 기록과 JO9 UI_overhaul_SNKmod_0.14.zip을 대조해 식단 변경을 복구했다. 출산 로직은 현재 상태 유지.
- 일반식 2 / 고열량식 4 / 특별식 8 스파크를 total_food_cost에 매일 합산. 굶김·촉수 산란액·주방 제한 폐지. 최초 마이그레이션에서 예전 -1/2는 일반식(1), 0/1 유지. 이후 특별식(2)은 직접 선택.
- 특별식 연속 5일부터 pos_cookie 및 spoil 증가(1+moral), 10일부터 pos_dessert. 다른 식단 선택·실제 방 배치/해제·빈 방/사망 시 누적 초기화. 임시 bridge 교환에는 초기화하지 않음. 일일 식단 본문은 배포본과 정확히 일치.
- 잠자리 선호 표기만 개인실→개인침대. 실제 방의 명칭/메뉴는 유지. 집 메인의 구형 네 방 초상화 바로가기와 부속 생리/건강 배지 출력 제거, 새 방 메뉴 유지. 이미지 파일은 삭제하지 않음. 명칭 변경/구 초상화 제거는 ZIP에 없고 이번 사용자 명시 결정으로 반영.
- 이미지 전환 버튼이 left:150px 캐릭터 레이어 안에 삽입돼 밀리던 원인 수정: 개인실 배경/캐릭터에서는 해당 레이어 밖 형제 요소로 부착.
- mods/2026-10-10_restore_private_room_ui_corrections.json, records/ui/2026-10-10_private_room_policy_recovery.json에 출처·변경·해시·백업·검증 기록. 공식 패치 재생/반복 적용 검사 통과, 실제 게임 화면 확인은 미실시.


## 2026-10-10 집 UI 실제 회귀 수정 및 개인실 바로가기 복구
- 앞선 구 개인실 아이콘 삭제 범위가 main_screen 외부 시설 조건문의 end까지 포함했다. 제거 조각의 블록 깊이는 -1이었다. end를 복구하여 시설·감옥·이동목록·카드 행동·외출 출력 회귀를 수정. 이전 검증은 main_screen 블록 구조를 검사하지 못했으며 정상 판단이 잘못이었다.
- 실제 클라이언트에서 집 UI 표시, 감옥 전환, 외출/귀환, 개인실 진입/귀환 확인. records/ui/2026-10-10_home_ui_recovery.png에 화면 보관.
- 추가 사용자 표시: 상단 개인실 초상화 줄은 필요한 이동 기능이다. 구 아이콘 폐지를 기능 삭제로 해석하지 말 것. 방 1~4 초상화 클릭 바로가기를 복구하고, 낡은 maidroom.png 덮개와 생리상태 배지는 생략. 방 개방/빈방/생존/사망 표시 조건 유지. 이 후속 변경의 화면 확인은 사용자 담당.
- 두 수정은 각각 mods/2026-10-10_restore_home_ui_block.json 및 mods/2026-10-10_restore_room_portrait_navigation.json에 기록. 식단·개인침대 명칭·이미지 전환 수정 유지. 게임 저장 파일은 덮어쓰지 않음.

- 감옥 인물 교체 아이콘: 사용자가 지정한 content/pic/SNKmod/buttons/cell_exchange.png(08DD514A...)를 현재 참조 경로 content/pic/buttons/cell_exchange.png에 복사해 복구. QSP 이동/교체 로직 유지. resources/new에도 동일 파일과 assets mod 기록.


## 2026-10-10 빈 참고 정보 반영 및 남자 주인공 기준 확정
- 사용자 승인 초안 중 남자 주인공·공용 인물 73명, 장소 62곳의 설명을 보충. 여자 주인공 전용 mister_grease/Jade_Guardsman 2명은 제외. 기존 비어 있지 않은 설명은 덮어쓰지 않음.
- 사용자 결정: 여자 주인공 플레이는 폐지 예정. 앞으로 남자 주인공 플레이 기준으로 설계. 이번에는 여자 주인공 분기 삭제·메뉴 폐쇄를 수행하지 않았음. 별도 변경에서 시작 선택/세이브/전용 이벤트 참조를 함께 점검할 것.
- jo9_reference_info location 추가. #npc_base/#place_base 초기화 후 보충, 기존 세이브는 $newloc 최초 호출 때 보충. 게임 진행 조건·UI·전투·수치 코드는 유지.
- gastronom/meat의 동적 상품 재고 설명은 기존 동작 유지. dojo는 예비, erza_battle은 전투용 등록 장소.
- 왕복 바이트 일치, 남자/공용 인물·장소 등록 확인, 기존 location 3곳 외 변경 없음, 공식 패치 재생 일치 및 반복 적용 검사 통과. 실제 화면은 사용자 확인.
- mods/2026-10-10_missing_reference_descriptions_male.json 및 records/reference-info/2026-10-10_missing_reference_descriptions_male.json에 본문·범위·백업·해시·검사 기록.


## 2026-10-10 쿠라 개인 패치 복구
- 사용자 화면에서 13번이 에드워드로 남은 것을 확인. 배포본 0.14 QSP(SHA 8d963ae8…e607c6)의 쿠라 개인 패치를 대조. 앞선 개인실 UI/연결부 복원 범위에서 시작 캐릭터 변경을 제외하여 누락이 남았음.
- main_menu, init_custom_game, #masters_base의 13번 블록, #dynamic의 초상화 순환/시작 거처 helper, hero_customization_man만 7 edits로 복구. 전체 배포 QSP를 덮어쓰지 않음.
- 쿠라 이름·배경·능력·장비·약품·2만 스파크·세르피스 우호 3·serpis_house 시작을 0.14와 동일하게 복구. 일반 시작은 남자 선택화면, 커스텀은 남자 1번, 초상화 순환은 1~18. 여자 플레이 신규 진입 경로를 기존 쿠라 패치대로 제한하며 여성 전용 런타임 코드는 삭제하지 않음.
- master_kura.png/master_kura_sepia.png는 content/pic/master/와 resources/new/에 보관. SNKmod 참조를 새로 만들지 않음. 공유폴더 복원용 개인 이미지 ledger에도 등록.
- 기존 세이브의 돈·능력치·장비·거처는 자동 덮어쓰지 않음. 새 시작 화면은 게임 재실행 후 일반 시작에서 확인.
- QSP 왕복, 공식 재생/반복, 5 locations 이외 바이트 보존, 개인실·식단·임신·설명 유지 확인. tests/test_kura_patch.cjs는 쿠라 preset/시작/42개 선택 경계/초상화 해시를 확인. 실제 화면은 사용자 확인.


## 2026-10-10 시작 흰 화면 회귀 QA 및 수정
- 설명 보충 패치의 실행 코드에 CRLF 대신 bare LF를 넣은 내 오류. 메인 메뉴 버튼 출력 이후 DB 초기화가 중단되어 배경이 흰색, 쿠라 승인 뒤 시작도 흰색으로 중단. 실제 클라이언트에서 두 증상 재현. 기존 코드 검사 통과를 동작 검증으로 보고한 것은 부적절했음.
- jo9_reference_info 408행과 #npc_base/#place_base/$newloc 호출부 개행만 수정. 기존 인물/장소 문장과 쿠라 능력치·돈·집 UI·식단·임신 코드는 유지.
- 공식 패치 원본→수정 재생 결과 일치, 합본 재적용 무변경, 임의 added body 충돌 시 무쓰기 검사 통과. apply_mods.ps1은 후속 full-body edit로 변경된 added location을 정확한 선언형 기록으로 확인하고, 이전 anchor가 남아 있어도 후속 적용 상태를 먼저 검사.
- 사용자 “이제 되네”로 정상 동작 확인. 수정 뒤 현재 NPC 화면 정상 출력 관찰. 수정 후 메뉴→새 게임→집 전체 경로와 개인실/식사/하루 넘김을 내가 모두 플레이 검증한 것은 아님. records/ui/2026-10-10_startup_runtime_qa.json에 구분 기록.
- 사용자 명시 결정: 플레이 테스트는 어지간하면 사용자가 한다. 앞으로 테스트가 필요하면 요청하고, 기본적으로 직접 클라이언트를 조작하지 말 것.
- 새 QSP 실행 코드 생성 시 CRLF 사용. tests/test_reference_runtime.cjs로 helper 블록 및 호출 delimiter 확인. 바이트 왕복 검사는 실행 검증을 대체하지 않음.

## 2026-10-10 New-cut save rejected after private-room UI recovery
- Symptom: adding bg/Erza (2).png reported that the image-cycle patch must be installed, even though the patch was present.
- Cause: image-cuts.refresh required its marker at body offset zero. The private-room bridge guard legitimately precedes that marker in interior_change.
- Fix: locate a unique CRLF-anchored cycle marker and replace only its registry. Preserve the preceding guard and original room-switching tail. Canonical cycle-mod export begins at the marker, so the separate bridge guard is not duplicated in the mod.
- QA: reproduced two failures before the fix; three regression/integration tests pass afterward. Temporary-QSP cut save preserves the guard, unrelated location and room UI tail, writes a backup, and repeats without a change. Missing/incomplete cycle blocks still fail without writing.
- Runtime/gameplay verification: no game client automation. The PLAY QSP and user images are not changed by installing this tool fix. User retries the failed new-cut save after refreshing the tool.

## 2026-10-10 전투 메뉴 한 줄 표시 회귀 복구

10/09 대사 정리 패치가 전투 메뉴의 실제 CRLF를 공백으로 접었다. 같은 패치의 UI 조각 24개(8 location)를 패치 전 형식으로 복원했고, 대사 정리 도구에서 UI 구조를 제외했다. [근거·백업·검증·남은 확인](../COMBAT_MENU_RESTORATION_20261010.md). QSP 적용 완료, 12개 테스트 통과, 사용자 플레이 검증 대기. 전체 과거 모드 재실행은 기존 debug_info 매칭 문제로 미확인이다.

### 2026-10-10 무기 선택 글자 정렬

도시 메뉴 정렬 패치가 옛 under/under_gray 버튼에 왼쪽 정렬을 상속시켰다. 해당 버튼 내부 정렬만 가운데로 복원했고 위치·크기·클릭 오버레이를 유지했다. [검증과 백업](../LEGACY_SCENE_BUTTON_ALIGNMENT_20261010.md). QSP 클라이언트 화면 검증은 사용자 담당이다.


## 2026-10-14 초기 화면 외곽 테두리

현재 실행 중인 2.4 풀팩에 화면 한정 숨김 적용. [수정·검증·사용자 확인 항목](../STARTUP_OUTER_FRAME_FIX_20261014.md). 시작 화면 11곳에만 적용하며 플레이 프레임은 유지. 사용자 재실행 확인 대기.


## 2026-10-14 선택창 캐릭터 하단 정렬

center_Isabella가 메뉴 이동 좌표를 상속하는 원인을 해결. 현재 G:/somi/Jack O Nine Tails v2.4 Kor_Full에 적용, 기존 사냥 분리는 유지. [원인·변경·검증·사용자 확인 항목](../MENU_FOREGROUND_ALIGNMENT_20261014.md). 사용자 재실행 확인 대기.
