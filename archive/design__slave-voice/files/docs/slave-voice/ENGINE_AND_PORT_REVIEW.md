# 잭오나 엔진·HTML 포팅·자동 저장 검토 (카일, 2026-10-14)

사용자와 논의한 결과를 남긴다. 결론과 근거만 적는다. 수정·빌드는 하지 않았다.

## 1. HTML 포팅 검토 → 하지 않음
- 순정 jack.qsp를 브라우저용 QSP 엔진(`@qsp/wasm-engine` 5.8, 1.6.1=QSP 5.9.5)에서 열어 봤다. 0.8초 만에 열리고 메인 메뉴·성별 선택·마스터 선택까지 오류 없이 HTML이 만들어졌다.
- 막힌 곳은 잭오나 전용 확장이었다. `FOR i = 1 TO n` 반복문 40곳은 공개 엔진에 없다(`LOOP` 문법으로 변환 가능 확인).
- 로컬 실행 기준으로 가장 적절한 후보는 qSpider 데스크톱판(Tauri, MIT)이다. aero 모드가 잭오나의 화면 배치 변수(`MAINDESC_X` 등)를 그대로 지원하고, game.cfg로 CSS·창 크기·제목을 지정한다.
- 잃는 것: 2.3 세이브 호환(가능성 높음), JSON·이미지를 바꿀 때마다 빌드가 필요해짐.
- **사용자 판단: UI는 지금 엔진 위에서 이미 완성됐고 큰 문제가 없으므로 바꿀 필요가 없다.**

## 2. 잭오나 엔진 소스 확보
- 위치: gitgud `jack-o-nine-tails` 그룹.
  - `engine-base`: jack.exe 소스. README 제목 "FastQSP (Jack-o-Nine-Tails F95 Edition)". 최근 커밋 2025-04/08.
  - `game-base`(`master-ia-patch`): 게임 원본 qsrc 174개, json 566개, Qgen. 기반 커밋이 ImperatorAugustus의 2.3.2.5다(우리 한국어판의 원본 계열).
  - `media/media-base`, `media-patch`: 이미지.
- 엔진: FastQSP 개조판, Qt 5.4.2 + **QtWebKit**(실제 브라우저 엔진), 32비트 빌드 설정, **GPL-3.0**(수정 배포 시 소스 공개 의무).
- 소스로 확정한 엔진 전용 기능
  - `FOR` 반복문: `qsp/statements.cpp`의 `qspStatFor`
  - JSON 로드: `qsp/jack.cpp`의 `executeJSON()`. `json/` 아래 모든 .json, 파일 이름 앞 숫자를 배열 번호로 쓴다.
  - picMax: `getImages()`. 대상 폴더는 `girls/normal_scenes`, `girls/reward_scenes`, `girls/sex_scenes`, `girls/torture_scenes`, `scene` 5곳(하위 포함)뿐이다. png만, `unused` 폴더와 이름에 `item`이 든 파일은 제외한다. 이름 끝 `_숫자`를 떼고 같은 이름끼리 센다(폴더가 달라도 합산). → `docs/modding/IMAGE_RANDOM_RULES.md`의 추정을 이 규칙으로 정정할 수 있다.
  - CSS: `css/` 폴더 전부 적용(`setStylesheet()`). 화면 배치: `gui/qsp_htmlbuilder.cpp`. 창 제목·크기: `config.xml`.
- 사용자 판단: 이미지는 메모리에 올리지 않고(이름만 셈) 32비트도 문제없다. 엔진은 고치지 않는다. 소스는 엔진 탓 문제가 생겼을 때의 참고로만 둔다.

## 3. BUG-002 (애완묘 훈련 후 빈 화면) 새 가설
- 엔진은 링크 클릭 때 `QSPExecString` 결과를 버리고, QSP 오류를 화면에 띄우지 않는다.
- 그래서 location이 화면을 지운 뒤 중간에 QSP 오류가 나면 오류 창 없이 빈 틀만 남는다. 증상(Show HTML에 빈 틀 두 개)과 맞는다.
- 사용자 판단: 오래 재현되지 않으므로 보류. 다시 생기면 이 가설부터 확인한다.

## 4. 자동 저장
- 엔진 메뉴 "Autosave when exiting"(기본 꺼짐)을 켜면 이름과 달리 **화면이 바뀔 때마다** `save/auto.sav`를 쓴다. HDD에서 느려지는 원인이다.
- 게임 안 설정의 하루 자동 저장(`autosave_day`)과 열흘 자동 저장(`autosave_decade`)은 순정·UI 0.14·2.4.0.0 모두 코드가 살아 있다. 다음 날 아침 집 화면에서 `save/auto_day.sav`, "하루 종료" 버튼에서 `save/auto_day_end.sav`를 쓴다.
- "저장이 안 되는 것 같다"의 유력 원인은 불러오기 쪽이다. 세이브에는 jack.qsp 지문(CRC)이 들어가고, QSP가 바뀐 뒤에는 불러오기를 **아무 표시 없이 거부**한다(F2 빠른 불러오기는 실패하면 게임을 다시 연다). `FastQSP.ini`의 `ignoreCRC=true`(엔진 메뉴 "Ignore version check when loading")로 끈다. gitgud 원본 배포판은 `true`다.
- 권장: 배포본 `FastQSP.ini`에 `ignoreCRC=true`를 넣는다(2.3 세이브를 2.4에서 불러오는 데도 필요). README에 "자동 저장은 엔진 메뉴 대신 게임 설정의 하루 자동 저장을 쓰라"고 안내한다. 사용자 실제 확인은 아직 하지 않았다.
