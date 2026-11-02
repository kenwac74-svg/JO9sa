# Full 독립 배포 검증 사전 검토

읽기 전용 조사. WORK/Full 변경, 빌드, 서버 및 게임 실행은 하지 않았다.

## 즉시 반영할 누락

기존 `records/full-client-preparation-20261029/build-input-plan.cjs`는 game 루트 허용 목록이 `jack.qsp`, `config.xml`뿐이라 `game/icon.ico`를 `non-runtime root file`로 제외한다. 현 계획에도 48,022 bytes가 제외로 기록되어 있다. `game/config.xml`의 `icon="icon.ico"`가 사용하므로 새 입력에는 반드시 포함해야 한다. 새 계획은 과거 목록을 그대로 복사하지 않고 최신 WORK 재인벤토리로 만든다.

## 현재 읽기 전용 사실

- 루트 `Jack-o-nine-tails.exe` 바이너리에서 `game/jack.qsp`, `game/engine/jack.exe` 상대 경로 문자열을 확인했다. 런처, 이 game 구조, 엔진 DLL/plugin 등을 함께 넣어야 한다.
- 현 WORK `config.xml`은 1280×800, 2.4 제목과 icon.ico 참조다. 원본 인코딩/바이트를 보존한다. 기존 UTF-16LE BOM을 UTF-8로 다시 쓰는 실수가 화면 검증을 깨뜨린 이력이 있다.
- 현재 root와 game의 `FastQSP.ini`는 `[General]`, `ignoreCRC=true`, `mutedState=false`다. 루트 2개 경로 설정을 어떤 기준으로 넣었는지 명세에 남기고 개인 창 위치·최근 파일·자동저장/디버그 진단 설정이 섞이지 않게 한다. `ignoreCRC=true`는 기존 세이브 호환의 합의 값이므로 무작정 false로 바꾸지 않는다.
- 기존 계획의 링크는 0개였지만 최신 전체 트리에서 reparse/junction/symlink를 다시 확인해야 한다. Full의 save는 WORK와 링크하면 안 된다. 개인 sav 전체는 제외하고 이번 TC용 sav만 별도 복사한다.
- 현 QSP의 실제 문자열(주석 제외)을 절대 드라이브/file URL/localhost/127.0.0.1 패턴으로 조사했을 때 0개였다. `content/js/jo9_traits_view.js`도 같은 로컬 경로 의존은 없다. `https:` 안의 `s:/`를 드라이브 경로로 오인하지 않도록 드라이브 앞 경계를 검사해야 한다.
- 최근 컷신 패치의 공식 검증 기록은 `records/catfight-result-cuts-20261031/release-report.json`, QSP SHA256 `ca4e09ef66c4044e415e2c543d008eeaad7a666df54b314dec0f8d5ef8bb412a`다. 사용자가 이후 QSP를 저장했을 수 있으므로 실제 복사 직전/후 해시를 다시 고정한다.

## Full 자체를 대상으로 실행할 출고 검사

가장 최근 패치만 별도 qa-mods 폴더에 복사해 재생한다. 모든 역사 mods를 무조건 적용하지 않는다. 아래 명령의 최신 WORK가 과거 기록 해시와 달라지면 새 baseline/선택 패치를 먼저 맞춘다.

```powershell
node G:/somi/JO9sa/tools/qa/release-check.cjs `
  --candidate 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp' `
  --baseline 'G:/somi/JO9_work_backups/catfight-result-cuts-20261031/before.qsp' `
  --mods-dir 'G:/Codex/tmp/full-client-build-20261031/qa-mods' `
  --engine 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/engine/jack.exe' `
  --game-dir 'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game' `
  --state-save 'G:/somi/Jack O Nine Tails v2.4_work/game/save/nege.sav' `
  --cache-revision 3 `
  --mirror 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp' `
  --client-timeout-seconds 30 `
  --out 'G:/Codex/tmp/full-client-release-gate-20261031'
```

이 검사는 구조/UTF-16 왕복/중복 로케이션/줄·주석 경계, JSON 번호, 선택 패치 정확 재생/재적용, Full 엔진의 실제 9경로 완료 신호, WORK/Full/원본 sav 해시 보존을 확인한다. `PASS`만 납품 자동 검사 완료다. 출력은 candidate/게임/세이브 입력 폴더 밖이어야 한다.

단독 정적 도구: `tools/qa/check-qsp-line-endings.cjs <Full/game/jack.qsp>`, `tools/qa/check-qsp-marker-boundaries.cjs <...>`, `tools/qa/check-slave-template-ids.cjs <Full/game/json/slaves>`. 정적 도구만 통과했다고 엔진 검사로 보고하지 않는다.

## 파일·리소스 납품 게이트

1. Full 각 파일의 SHA256을 빌드 입력 manifest와 대조한다. 실제 파일 수/bytes와 포함·제외 수/bytes를 별도로 기록한다. WORK hash도 복사 직전과 최종에 대조하여 도중 수동 저장을 포착한다.
2. Full 내부 symlink/junction/reparse 0개, 절대 WORK/원본/IMGMG/드라이브 참조 0개, 개인 저장·도구 runtime/키 설정·중첩 zip·백업·원본 제작자료 0개를 경로 인벤토리에서 확인한다. 세이브는 새 TC 묶음의 명시적 목록만 허용한다.
3. json/css/content/js의 문법 검사와 포함 이미지 참조 대조를 한다. `scene` direct 참조 미발견은 곧 unused라는 뜻이 아니다. `display_pic`, `display_fullimage`, picMax, 난수, JSON 외형 키, `interior_change`, B/C컷·original cut 경로를 보존한다.
4. 필수 호환 사본 23개 검증 명령: `node G:/somi/JO9sa/tools/manage-fullimage-compat-aliases-20261028.cjs --game '<Full/game>' --manifest G:/somi/JO9sa/assets/compatibility-aliases/2026-10-28_fullimage.json --out G:/Codex/tmp/full-build-alias-check.json`. 기본 읽기 전용 모드만 사용한다. 과거 15개 오기 경로와 2개 JSON/PNG 호환 경로도 별도 기록을 따라 보존한다.
5. `game/modtools/ui-resource-aliases.json` 원장의 old/canonical 파일은 원장 자체를 배포하지 않아도 양쪽 이미지 경로를 Full에 포함한다. `characters/mistress_morrigan.png`/mistress_ava.png와 mob 사본은 용도가 달라 둘 다 유지한다.
6. PNG/JPEG/GIF 손상·크기, battle/defeated 795×596, avatar 150×150, 별도 cutscene 신규 `catfdef1.png`/`catdef2.png` 및 `coldef1/2/3` 존재를 확인한다. 사용자가 아직 넣지 않은 파일이면 미완성으로 명시하며 게임 코드를 몰래 fallback으로 돌리지 않는다.
7. 루트 런처를 Full 경로에서 실행해 실제 자식 프로세스가 Full/game/engine/jack.exe이고 QSP 경로도 Full인지 확인한다. WORK의 실행 중 창을 종료하거나 경로를 바꾸지 않는다. 가능하면 다른 CWD에서도 같은 Full 런처를 실행해 CWD 의존을 구분한다. 자동 진단 9경로는 런처가 아니라 engine 직접 실행이라 이 검사는 별도다.
8. 최종 TC sav의 실제 CRC/현재 로케이션·인물 배열·복귀 경로를 확인하고 간략 조작/기대결과를 적는다. GUI Load/실제 픽셀 배치·최종 그림 품질·전체 플레이는 사람의 수동 TC로 구분한다.

## 재발 방지의 의미

과거 대표 실수는 END/주석과 코드 줄 결합, 오래된 캐시, QSP만 복사해 리소스 누락, 동일 해시 호환 사본 제외, 번호 충돌, 전체 WORK를 미러해 키/도구/개인 sav 섞임, 설정 인코딩 손상, 다른 게임 창/프로세스를 테스트한 것으로 오인, 진단 실패를 정상으로 오기하는 경우다. 이번 납품 문서에는 이 각각을 어떤 게이트에서 확인했는지 간단히 연결하고 실제 미검사 부분을 남긴다.
