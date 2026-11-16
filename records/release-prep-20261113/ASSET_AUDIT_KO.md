# 배포 리소스 읽기 전용 감사 · 2026-11-13

현재 WORK와 추적 원장/QSP 기준은 `2ad5be48346be378983ca0eb018067eb358b5a347b6863ff8c37bb1071f13d30`이다. 이번 감사는 파일 경로·바이트 길이와 지정된 소규모 표본의 해시를 확인했다. Full, 게임/소스 파일, 세이브, 설정, 개인 자료는 수정하지 않았다. 패키징·Git·native 실행·이동·삭제·마이그레이션은 하지 않았다. 작성물은 이 보고서와 `release-assets-audit.json`뿐이다.

**사용자가 배포 형태를 2.4.2 Full로 확정했다. 현재 원장만으로 Full 배포 준비 완료라고 할 수 없다.** WORK 수동 JSON17개가 소스와 다르고, 이들 새 연결에서 원장 밖 PNG50개를 확인했다. 그중 본편에 없던38개와 본편과 다른10개는 최종 Full 입력에서 보존할 현재 WORK 리소스48개다. 실물은 WORK에 있으므로 Full 파일 누락이 확정됐다는 뜻은 아니다. 원본 본편 대비 전체 메타데이터 차분에서는 소스 원장 밖 이미지101개가 나왔다. 최종 Full은 현재 WORK 전체 runtime을 새로 명세하고 개발·개인 자료를 분리해야 하며, 이101개도 그 입력에서 놓치지 않아야 한다. 아래 수치들을 합산해 새 그림 수로 계산하지 않는다.

## 1. 현재 원장과 WORK 차이

| 확인 범위 | 결과 | 판정 |
|---|---:|---|
| runtime 원장 | 5304경로 | 존재/크기만 전체 대조, 대량 해시 아님 |
| WORK에서 원장 경로 부재 | 9 | 옛 호환4·옛 글로리아4·2339 옛 JSON1 |
| WORK와 원장 바이트 길이 다름 | 27 | JSON17·초상9·UI1. 자동 덮어쓰기 금지 |
| 호환 전신23 | source/target46해시 일치 | 경로23개는 차기 누적 패치에 모두 KEEP |
| 시루 호환7쌍·2071 분리6관계 | 지정 경로/해시 일치 | D21 전 삭제 금지 |
| WORK 도나도나8877~8899 JSON23 | 소스/원장/WORK 표적해시 일치 | 최신 배경·능력·특성 자료 포함 |
| 춘향3040 JSON·전신/역할/초상/타이틀8PNG·완성배경1PNG | 소스/원장/WORK 표적해시 일치 | bg/chunhyang.png 필수, 원본픽셀 해시12bd8f... 보존 |
| CSS3개·현재Gloria JSON/새5PNG | 소스/원장/WORK 표적해시 일치 | 최신장면프레임/CSS포함. 실제게임육안은 별도 |
| 개인실 추가PNG36 | WORK존재/크기 및 IMGMG object36존재 | assets/additional-resources/2026-11-10_private-room.json 필수. 전체PNG해시/재디코딩은 이번에 생략 |
| 음원 최신 원장61 | WORK/로컬 assets 존재/크기 일치 | 전체 실제 snd는136개. Git업로드제외와 게임패치포함은 별개 |
| 지정음원7 | 원장/WORK 표적해시 일치 | 게임오버2·지역BGM3·ledger·gsid |

### 원장 부재9경로

- `content/pic/girls/1207_green_long_young_sepia.png`
- `content/pic/girls/1212_blue_long_young_sepia.png`
- `content/pic/girls/face0177_black_short_loli.png`
- `content/pic/girls/face0222_blond_long_loli_sepia.png`
- `json/slaves/2339.json`
- `content/pic/girls/full/2341_brown_short_milf.png`
- `content/pic/girls/full/cloth/2341_brown_short_milf.png`
- `content/pic/girls/full/mistress/2341_brown_short_milf.png`
- `content/pic/girls/full/secretary/2341_brown_short_milf.png`

옛 오류 얼굴4경로는 2026-10-26 compatibility.json에 기존 세이브용으로 기록되어 있다. 바른 face/ 경로와 원장 repositoryPath의 resources/new 사본은 존재한다. 현재 WORK에서만 옛 경로4개가 없다. 승인된 D21 세이브 이관이 끝났다는 증거는 없으므로 검토 필요이며 이 감사에서 복원하지 않았다. 옛 Gloria 역할4PNG는 현재 JSON에서 새 gloria 경로로 대체되어 현재 영입 그림은 정상이나, 기존 저장의 옛 주소 필요성·명시 퇴역 승인은 미확인이다. `2339.json`은 현재 `2339_yagisuna.json`으로 이름/소개가 바뀌었다. 후자는 원장 밖이며 소스 옛파일과4키가 달라 단순 rename으로 취급할 수 없다.

### WORK 수동 JSON17

| JSON | 소스와 다른 키 |
|---|---|
| `2572_felicity.json` | `indpack_title`, `indpack_naked` |
| `2573_wilhelmine.json` | `seed_world_description`, `seed_family_description`, `seed_occupation_description`, `indpack_title`, `indpack_naked` |
| `2574_yasmin.json` | `seed_boobs`, `indpack_title`, `indpack_naked` |
| `2576_julia.json` | `indpack_title`, `indpack_naked` |
| `2577_pelageya.json` | `indpack_title`, `indpack_naked` |
| `2579_egeya.json` | `indpack_title` |
| `2582_rachel.json` | `indpack_title`, `indpack_naked`, `fullmade`, `fullsecretary`, `fullmistress` |
| `2583_galateya.json` | `indpack_title` |
| `2584_venera.json` | `indpack_title`, `indpack_naked`, `fullmade`, `fullsecretary`, `fullmistress` |
| `2585_pelageya.json` | `indpack_title`, `indpack_naked` |
| `2605_vampirella.json` | `indpack_title`, `indpack_naked`, `fullmade`, `fullsecretary`, `fullmistress` |
| `2611_snegurochka.json` | `fullmade`, `fullmistress`, `fullsecretary`, `indpack_title`, `indpack_naked` |
| `2617_jasmine.json` | `fullmade`, `indpack_title`, `indpack_naked` |
| `2624_erza.json` | `fullmade`, `fullmistress`, `fullsecretary`, `indpack_title`, `indpack_naked` |
| `3002_Luminous.json` | `fullmade`, `fullmistress`, `fullsecretary`, `indpack_title`, `indpack_naked` |
| `1448_Shiru.json` | `indpack_title` |
| `3013_Shaakti.json` | `fullmade`, `fullmistress`, `fullsecretary`, `indpack_title`, `indpack_naked` |

이 JSON들의 변경된 기본/복장 이미지 경로는 모두 현재 실물이 있다. 빌헬미네3개 배경·야즈민 seed_boobs도 달라 수동 경로만 복사하거나 옛 소스JSON을 덮는 방식은 안전하지 않다. 펠리시티는 후속 개발 제외 지시를 유지한다. 여기의 현물 보존 감사는 펠리시티 개발 재개가 아니다.

### 현재 수동 연결이 참조하는 원장 밖50PNG

| 경로 | 본편 대비 | 현재 byte | 소스 assets/resources/new 실물 |
|---|---|---:|---|
| `content/pic/characters/felicity_title.png` | 없음: 포함후보 | 256647 | 없음 |
| `content/pic/characters/wilhelmine_title.png` | 없음: 포함후보 | 188860 | 없음 |
| `content/pic/girls/full/wilhelmine_pink_long_loli.png` | 내용다름: 포함후보 | 171918 | 없음 |
| `content/pic/characters/yasmin_red_long_milf_title.png` | 없음: 포함후보 | 278794 | 없음 |
| `content/pic/girls/full/yasmin_red_long_milf.png` | 내용다름: 포함후보 | 251403 | 없음 |
| `content/pic/characters/julia_red_long_young_title.png` | 없음: 포함후보 | 171432 | 없음 |
| `content/pic/girls/full/julia_red_long_young.png` | 내용다름: 포함후보 | 170126 | 없음 |
| `content/pic/characters/pelageya_title.png` | 없음: 포함후보 | 384619 | 없음 |
| `content/pic/girls/full/pelageya_red_long.png` | 내용다름: 포함후보 | 271814 | 없음 |
| `content/pic/girls/full/2579/egeya_title.png` | 없음: 포함후보 | 399512 | 없음 |
| `content/pic/characters/rachel_blond_short_title.png` | 없음: 포함후보 | 196056 | 없음 |
| `content/pic/girls/full/rachel_blond_short.png` | 내용다름: 포함후보 | 184112 | 없음 |
| `content/pic/girls/full/cloth/rachel_blond_short.png` | 없음: 포함후보 | 186715 | 없음 |
| `content/pic/girls/full/secretary/rachel_blond_short.png` | 없음: 포함후보 | 172964 | 없음 |
| `content/pic/girls/full/mistress/rachel_blond_short.png` | 없음: 포함후보 | 224071 | 없음 |
| `content/pic/characters/galateya_title.png` | 없음: 포함후보 | 455729 | 없음 |
| `content/pic/characters/Venera_red_long_title.png` | 없음: 포함후보 | 266964 | 없음 |
| `content/pic/girls/full/Venera_red_long.png` | 내용다름: 포함후보 | 196638 | 없음 |
| `content/pic/girls/full/cloth/Venera_red_long.png` | 없음: 포함후보 | 204043 | 없음 |
| `content/pic/girls/full/secretary/Venera_red_long.png` | 없음: 포함후보 | 308348 | 없음 |
| `content/pic/girls/full/mistress/Venera_red_long.png` | 없음: 포함후보 | 231999 | 없음 |
| `content/pic/characters/vampirella_black_long_title.png` | 없음: 포함후보 | 334084 | 없음 |
| `content/pic/girls/full/vampirella_black_long.png` | 본편동일 | 266810 | 없음 |
| `content/pic/girls/full/cloth/vampirella_black_long.png` | 없음: 포함후보 | 303713 | 없음 |
| `content/pic/girls/full/secretary/vampirella_black_long.png` | 없음: 포함후보 | 223949 | 없음 |
| `content/pic/girls/full/mistress/vampirella_black_long.png` | 없음: 포함후보 | 261744 | 없음 |
| `content/pic/girls/full/cloth/Snegurochka_blond_short.png` | 없음: 포함후보 | 251423 | 없음 |
| `content/pic/girls/full/mistress/Snegurochka_blond_short.png` | 없음: 포함후보 | 244383 | 없음 |
| `content/pic/girls/full/secretary/Snegurochka_blond_short.png` | 없음: 포함후보 | 259952 | 없음 |
| `content/pic/characters/Snegurochka_blond_short_title.png` | 없음: 포함후보 | 203882 | 없음 |
| `content/pic/girls/full/Snegurochka_blond_short.png` | 내용다름: 포함후보 | 227219 | 없음 |
| `content/pic/girls/full/cloth/jasmine_black_long.png` | 없음: 포함후보 | 341547 | 없음 |
| `content/pic/characters/jasmine_black_long_title.png` | 없음: 포함후보 | 426510 | 없음 |
| `content/pic/girls/full/jasmine_black_long.png` | 내용다름: 포함후보 | 421822 | 없음 |
| `content/pic/girls/full/cloth/Erza_red_long.png` | 없음: 포함후보 | 226097 | 없음 |
| `content/pic/girls/full/mistress/Erza_red_long.png` | 없음: 포함후보 | 248430 | 없음 |
| `content/pic/girls/full/secretary/Erza_red_long.png` | 없음: 포함후보 | 265964 | 없음 |
| `content/pic/characters/Erza_red_long_title.png` | 없음: 포함후보 | 210666 | 없음 |
| `content/pic/girls/full/Erza_red_long.png` | 본편동일 | 258004 | 없음 |
| `content/pic/girls/full/cloth/Luminous_blue_long.png` | 없음: 포함후보 | 250828 | 없음 |
| `content/pic/girls/full/mistress/Luminous_blue_long.png` | 없음: 포함후보 | 259746 | 없음 |
| `content/pic/girls/full/secretary/Luminous_blue_long.png` | 없음: 포함후보 | 238739 | 없음 |
| `content/pic/characters/Luminous_title.png` | 없음: 포함후보 | 381299 | 없음 |
| `content/pic/girls/full/Luminous_blue_long.png` | 내용다름: 포함후보 | 222841 | 없음 |
| `content/pic/characters/1448_shiru_title.png` | 없음: 포함후보 | 442798 | 없음 |
| `content/pic/girls/full/cloth/Shaakti_white_long.png` | 없음: 포함후보 | 329431 | 없음 |
| `content/pic/girls/full/mistress/Shaakti_white_long.png` | 없음: 포함후보 | 302657 | 없음 |
| `content/pic/girls/full/secretary/Shaakti_white_long.png` | 없음: 포함후보 | 293121 | 없음 |
| `content/pic/characters/Shaakti_white_long_title.png` | 없음: 포함후보 | 289079 | 없음 |
| `content/pic/girls/full/Shaakti_white_long.png` | 내용다름: 포함후보 | 285596 | 없음 |

위50개만 표적해시로 본편과 비교했다. 별도 세부 hashes·참조 JSON/키는 기계 JSON에 있다. 2차r4 보존 원장에는50개가 동일 경로·해시로 들어 있지 않았다. 3차r2 실제 ZIP/원장의 새 전수 대조는 하지 않았으므로 3차에 이미 포함됐다는 가정도 하지 않는다.

## 2. 원본 본편 대비 경로/크기 메타데이터 차분

기준: records/distribution-cleanup-20261102/BUILD_MANIFEST.json. header의 runtimeFiles42921과 files배열의 game/ 경로42926은 집계 분모가 다르다. 그 배열을 그대로 상대경로로 대조했다. 현재45630파일을 읽었고55개 제외 지점(세이브·modworkpic·백업·로그 등)을 기록했다. 링크는 따라가지 않았다.

| 항목 | raw 개수 | 해석 |
|---|---:|---|
| 본편에 없는 현재 경로 | 2773 | 대부분 도구·개인편집 상태 포함 |
| 본편과 크기 다른 현재 경로 | 991 | 동일크기 내용변경은 이 검사로 검출 불가 |
| 본편 경로 중 현재 부재 | 69 | 이미지13·변환전BGM30·JSON25·폰트옛위치1 |
| 위 추가/변경 중 runtime5304원장 밖 | 2524 | 모든 항목을 게임필수로 취급하지 않음 |
| 원장 밖 이미지 | 101 | 현재JSON직접참조48후보 포함, UI/초상/변형·B컷도 추가검토 |
| 원장 밖 JSON | 1 | 2339_yagisuna.json |
| 원장 밖 폰트 | 1 | fonts/Solimeo.ttf: 옛 content/snd/Solimeo.ttf 이동과 경로 확인 |
| 원장 밖 음원 | 3 | bad_secen/great-success/ledger.mp3 원본보존. 현재훅은 WAV이므로 단순누락 아님 |
| 원장 밖 모드툴 경로 | 2403 | image_work 편집자료1865는 공개런타임과 분리. 개인자료를 배포물에 무작정 복사 금지 |

기계 JSON의 added/sizeChanged/missingBase에는 경로·크기·분류가 있다. candidateClassification은 image101·JSON1·font1·보존MP3·도구프로그램/자산·개인편집자료를 구분한다. 모드툴 추가수2403을 실제 공개배포 필수수로 보고하지 않는다.

## 3. 배포에서 유지할 실제 연결

- 춘향 `bg/chunhyang.png`는 완성 배경으로 표시되며 투명 타이틀과 용도가 다르다. 3040JSON 및8PNG를 유지한다. 번호 없는 JSON도 감지하도록 고친 목록의 표시 규칙을 가짜 번호/새폴더 강제 규칙으로 바꾸지 않는다.
- 펠라게야2577→2585/2607 공유 하녀/비서/도미나3경로와 양쪽 구/신 키6개가 현재 모두 일치한다. 같은PNG를 공유하지만 원고·능력치 복제는 하지 않는다.
- 기본 호환23경로, 시루7쌍, 2071 분리6관계, 원본 B컷·UI 별칭은 같은 해시로 제거하지 않는다. 원본 china/town 명칭·주소는 별도 사용자 지시 없이 변경하지 않는다. 이 감사는 해당 실제 원본2경로의 모든 소비자를 재확정하지 않았다.
- 99턴버프·무작위일섬·회피상성은 현재 춘향 QSP 변경이고 별도 99buff PNG를 새 필수파일로 추정하지 않았다. 최신 REPORT_KO.md는 감사 중 작성 완료되어 현재 존재한다. 초기 순간 부재는 미해결 누락으로 세지 않는다.
- 음원은 로컬 WORK에서 채취해야 한다. 원장61개는 BGM변환30+게임오버2+효과/등장/업무 등과 지역BGM3을 포함한다. 기존 기본효과음까지 합친 실물136개 중 필요한 기존파일은 본편 기준으로 보존한다. sound-audition 후보34개나 미채택 제작기획을 전부 게임필수로 넣지 않는다.
- city.mp3는 없지만 11/11 설정창 기존BGM유지 수정으로 해당 선택을 우회한 기록이 있다. 새 미해결 필수음원으로 무조건 생성/대체하지 않는다.
- bgm 순차재생의 `content/js/jo9_bgm_clock.js`와 `jo9_hotkeys.js` 로더도 함께 배포한다. MP3만 담으면 자동 다음곡이 보장되지 않는다.

## 4. 도구 배포/확인 한계

현재 WORK modtools/text-workshop의 server.cjs, catalog.cjs, character-image-links.cjs, character-portrait-frame.cjs, portrait-frame.cjs, portrait-frame.py 6개는 소스와 표적해시가 일치했다. 최신 전체JSON감지·무번호 표시·복장공유·초상테두리 기능의 서버측 설치본은 맞는다. 실제 카탈로그 HTML 저장본/체크 상태·일정·개인 아이디어는 사용자 자료여서 초기 seed로 덮지 않는다. game-reference는 만들어진 jo9-reference.html로 배포되므로 빌드용 mobs-data.cjs가 설치 폴더에 없다는 이유만으로 누락으로 세지 않았다.

현재 WORK 루트에 공개용 WORKSHOP 폴더는 없다. 문서상의3차r2 도구419파일은 과거 출고원장 기준이다. 이번에는 그 실제ZIP·419파일 전체와 현재도구를 재대조하지 않았고, 다른PC의 Python/Pillow/런타임 가용성도 미확인이다. 기존2.4.0 tools/release/README_KO.txt의 설치exe 안내는 최신 설치기없는ZIP정책과 다르므로 새 배포 안내로 재사용하면 안 된다.

## 5. 출고 전 체크리스트

- [x] 배포 형태/버전: 사용자 2.4.2 Full 확정. 최종 WORK 전체 runtime 명세와 개발/개인 제외 목록을 기준으로 준비한다. 같은 본편용 별도 패치를 나중에 만들 경우 누적 정책도 유지한다.
- [ ] 2.4.2 Full 직전 D21 세이브 이름/이미지경로/화면캐시 마이그레이션을 정식 설계·검증한다. 그 결과로 승인한 퇴역/호환 정리만 반영한다. 이번 감사는 이관 실행 승인이 아니며 자동 복사·이동·삭제하지 않는다.
- [ ] 현재 WORK를 권위로 JSON17·이름/소개2339·PNG48이상 및 전체원장밖이미지101의 채택/연결/소스보존 범위를 대조한다. 덮어쓰기/경로이동은 별도 승인범위에서만 수행.
- [ ] 원장 부재9의 옛세이브주소 필요성·승인퇴역을 확정한다. D21 이전 마이그레이션·이미지삭제 자동실행 금지.
- [ ] 초상9·UI unfamiliar1 현재PNG를 카탈로그 최신 체크/수동편집과 대조하고 원장byte/hash 갱신 여부 결정.
- [ ] 호환23필수경로와 과거 호환/B컷/UI주소를 경로단위 포함. 동일해시중복제거 금지.
- [ ] 최신음원61 및 기본136세트 의존경로·지역BGM3·게임오버2·업무WAV3를 로컬에서 포함. 음원Git업로드 금지 유지.
- [ ] 개인실36PNG와IMGMG원본objects의 입력 원장을 패치파일목록과 연결.
- [ ] 최신 도구프로그램·의존자산·현재 생성HTML을 구배포419과 대조하고 사용자상태/image_work/개인자료를 배포물과 분리.
- [ ] 최종 실제출고 QSP 기준 정식 release-check·패키지 파일원장/CRC·대상mirror 검사는 배포 승인 후 수행. 기존 기록184검사를 이번 최종패키지출고PASS로 확대하지 않음.
- [ ] 개인SAV UI로드/저장/재로드,춘향배경/클릭/버프표시,새복장·초상,사운드청감은 실제게임확인 범위로 별도 표시.

기억 참고는 누적패치/WORK우선·호환보존 지침 탐색에만 사용했고, 위 수치와 파일 상태는 현재 실제 파일로 확인했다. 새 임시QSP·복제게임·압축해제본은 만들지 않았다.
