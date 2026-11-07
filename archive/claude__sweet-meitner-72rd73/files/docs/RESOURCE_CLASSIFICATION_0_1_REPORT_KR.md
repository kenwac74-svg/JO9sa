# 0.1 리소스 전수 분류 보고서

- 작성: 2026-09-28 (Claude)
- 대상: `codex/snkmod-0.1-handoff` @ `b45ce99`의 `releases/JO9 UI_overhaul_SNKmod_0.1.zip`. SHA-256 `6249885f…75e0`이며 인계 문서와 일치한다. 재빌드하지 않았다.
- 기준: 순정 잭오나 2.3. `reference/vanilla_manifest.json`(JO9O 순정 복원본, jack.qsp `070dad…77dc`)과 `reference/vanilla-jack.qsp`(해시 일치)를 썼다.
- 분류 규칙 (사용자 확정):
  - 순정과 같은 경로·같은 해시 → 원본 참조를 유지하고 패키지에서 뺀다.
  - UI 작업으로 교체·추가된 것 → SNKmod에 넣는다.
  - 한글을 영문으로 바꾼 것 → 내용이 같아도 SNKmod에 넣는다.
  - 이미지팩 교체분 → 관할 밖이다.
- UI 작업 출처로 인정한 것: FIX6 원본 ZIP, `resources/new`, `resources/originals`, `resources/private_room`(0.1 브랜치), Claude 브랜치의 `resources/new`(cum_gray).
- 도구: `tools/classify_release_refs.py`. 원자료는 `audits/release_0_1_ref_classification.json`.

## 검사 범위 — 설치 후 게임이 읽는 텍스트 전체

- QSP 248개 location: 0.1이 순정 243개 본문을 모두 교체하고 5개를 추가한다 (`path-rules.json`은 비어 있다). 순정 location의 설명·액션도 포함했다.
- 0.1이 덮어쓰는 `css/base.css`, `json/menu_icon.json`.
- 덮어쓰지 않는 순정 `css/mainScreen.css`, `json/menu_item.json`, `json/slaves/*.json` 996개.
- 참조 형태:
  - 정적 경로: `content\pic\…`, `SNKmod\content\pic\…`, CSS `url()`, JSON HTML.
  - 동적 조립 경로: `<<…>>`가 들어간 경로.
  - QSP의 따옴표 상대경로: `$special_image` 류.

## 결과 요약

| 분류 | 개수 | 판정 |
|---|---:|---|
| 순정 파일 참조 (UI 폴더·pic 루트) | 2,160 | 정상. 순정과 같아 패키지 불필요 |
| 순정 파일 참조 (일반 이미지: girls·bg·scene 등) | 255 | 정상. UI 관할 밖 |
| SNKmod 참조 — 순정과 다른 UI 변경본 | 99 | 정상. 모두 패키지에 있음 |
| SNKmod 참조 — 순정에 없는 신규 | 3 | 정상. z_pregnant(금색), room_diet, private_room_notice. 소스는 `resources/private_room` |
| SNKmod 참조 — 한글→영문, 내용 동일 | 3 | 정상 (결정 13). Abortion, Birth, Sound |
| SNKmod 참조 — 한글→영문, 내용 변경 | 9 | 정상. Fer_·Vir_ 9개 |
| 순정에 없는 파일을 원본 경로로 참조 | 41 | 아래 A 참고 |
| **한글 경로 참조** | **0** | 대원칙 충족 |
| **패키지에 변경본이 있는데 원본을 가리키는 참조** | **0** | 연결 누락 없음 |
| **UI 작업 출처에서 바뀌었는데 패키지에 없는 파일** | **0** | UI 작업분 누락 없음 |

### A. 순정에 없는 파일 참조 41개
- 일반 이미지 29개 (mob 22, master/vampire 3, bg/dungeon, bg/layout_2, scene/farm_cows_1, title17): **모두 순정 QSP에 원래 있던 참조**다. 0.1이 만든 문제가 아니고 UI 관할도 아니다.
- menu_icon.json 12개: `docs/MISSING_MENU_ICONS.md`의 목록과 같다. 이 중 `cum_gray.png`만 쓰인다. 생성본(`resources/new/content/pic/ui overhaul/cum_gray.png`)은 아직 0.1에 반영되지 않았다.

### B. 동적 조립 경로 250개
- UI 폴더 패턴:
  - `ui/crushboss/…<<n>>` 4개, `ui overhaul/clothing bar small/<<…>>` 1개. 그 폴더에는 패키지·UI 작업 파일이 없다 → 순정 사용, 정상.
  - `ui overhaul/contract a+~s+.png` 5개: 파일명의 `+` 때문에 동적으로 잡힌 정적 경로다. 모두 순정에 있다.
- 그 밖(`$fullimage`, 장면 변수 약 200종, `girls/face`, `girls/body`, `characters`, `bg/<<$bg[$place]>>`): 일반 이미지다. `$bg` 값 180개와 `$bg_path` 값에 UI·SNKmod 경로는 없다 → UI 관할 밖.

### C. QSP 상대경로 문자열 595개
- UI: `buttons/teach_a|r|s.png`, `ui/grimdark/buttons/teach_a|r|s.png` (iif 분기). 모두 순정과 같다 → 정상 (결정 4).
- 순정에 없는 15개(girls/scene): 모두 순정 QSP에 원래 있던 참조다. UI 관할 밖이다.

### D. 패키지 이미지 143개
- 참조 114개. 참조되지 않는 29개:
  - FIX6 예비 16개 (결정 7).
  - milk_drop_medium, hart_blue (예비 승인분).
  - `buttons/z_pregnant.png`(FIX6판): 0.1은 금색 `ui/z_pregnant.png`를 쓴다.
  - 한글→영문 pic 루트 10개(Ill, Wound, Pill0·0s·1·1s·2·2s, Preg, Preg_s): 0.1 QSP에서 해당 아이콘 표시가 모두 없어졌다. 인계 문서의 "작은 상태 아이콘 삭제"와 맞는다.
- **순정과 같은데 이름도 그대로인 파일 1개: `bg/trophy/trophywall.png`.** 결정 12에 따르면 패키지에서 빼야 한다. 결정 7(예비 포함) 때는 순정 비교를 하지 않았다.

### E. 해시 차이 148개 (legacy_resource_refs.json의 different=true)
- 147개 `ui overhaul` + `bg/guild.png`.
- 모두 순정에 같은 경로로 있고, 0.1이 원본 경로로 참조한다.
- **UI 작업 출처 어디에도 이 파일들의 다른 버전이 없다.** FIX6, resources 전체, 0.1 패키지를 확인했다.
- 결론: UI 작업분이라는 근거가 없다. 규칙상 UI 패치에서 제외한다 (이미지팩 등 다른 교체분으로 추정). 사용자가 UI 작업분으로 지정하는 파일만 추가한다.

## 결정이 필요한 것
1. `bg/trophy/trophywall.png`: 순정과 같다. 패키지에서 뺄지 (결정 12), 예비로 유지할지.
2. 참조되지 않게 된 패키지 이미지 13개 (buttons/z_pregnant, 한글→영문 10개, milk_drop_medium, hart_blue): 예비로 유지할지, 뺄지. FIX6 예비 16개는 결정 7대로 유지한다.
3. cum_gray.png를 다음 빌드에 넣을 것 (이미 지시받음).

## 별도 이슈 (이번 분류와 무관)
- JO9O에서 설치 후 QSP가 설치 기록과 달라진 현상은 미해결이다. 바뀐 뒤 해시 `cbb3c446…`는 FIX6 manifest의 OriginalQsp와 같다. 재컴파일인지, 옛 백업 복원인지 등의 원인은 실행 전후 해시 비교로 재현하기 전까지 단정하지 않는다.
