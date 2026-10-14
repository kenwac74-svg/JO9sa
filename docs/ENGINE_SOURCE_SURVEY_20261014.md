# GitGud 잭오나 저장소 조사 (엔진 소스 위치)

조사일 2026-10-15 (파일명 날짜는 요청 문서 기준). 읽기만 했고 코드·게임 파일은 고치지 않았다. GitLab 공개 API로 확인했다.

## 1. 그룹 `jack-o-nine-tails` 저장소 (모두 public, 설명은 전부 비어 있음)

| 저장소 | 기본 브랜치 | 마지막 활동 | 비고 |
|---|---|---|---|
| game-base | master | 2025-09-02 | 게임 본체(QSP 소스·json·css) |
| engine-base | master | 2025-08-04 | **엔진(FastQSP, Qt/C++) 소스** |
| media/media-base | master | 2025-09-02 | 이미지 저장소(내용 미확인) |
| media/media-patch | master | 2025-09-02 | 이미지 패치(내용 미확인) |

media 두 곳은 목록만 확인했고 내부는 열어 보지 않았다.

## 2. game-base (`master-ia-patch` 브랜치)

- 브랜치: cleanup, guilt-ramp, guilt-ramp-uj, master(2024-08-26, v2.3 릴리스 노트), master-ia(2025-05-26), **master-ia-patch(2025-05-26)**, mod, patch(2024-05-21), trinity_translation_project(2024-03-30), wpn_armor. 태그는 v2.1, v2.0.1.
- 최상위: `Qgen/`(qgen.exe, txt2gam.exe, MakeQSP.bat, txtmerge.py, txtsplit.py, keywords.xml, langs), `game/`, `.gitattributes`, `.gitignore`, `Change Log.docx`, `FastQSP.ini`, `Jack-o-nine-tails.exe`, `Release_Notes.docx`, `keywords.xml`.
- `game/`: css, engine, fonts, json, locations(.qsrc 다수), picture_modding, testing, config.xml, icon.ico, jack.qproj, jack.qsp, qqsp.ini.
- **README 없음**(저장소 최상위에 없다. game/ 아래는 확인하지 않음).
- 최근 커밋(전부 2025-05-26):
  - Lokplart `e6c70b0f` Patch json files (`game/json/slaves/*.json` 등 100개 이상 변경)
  - Lokplart `eaf78bcf` Initial patch commit (`config.xml`, `locations/` 5개: `$newloc`, city_menu_form, init_game, main_menu, menu_form)
  - ImperatorAugustus `10eb7c70` bumped version to 2.3.2.5
- `config.xml`: 1280x800, title "Jack-o-nine-tails v2.3.2.5 Dev Version".

## 3. 엔진 소스: **engine-base** (FastQSP, GPL-3.0)

README: "FastQSP (Jack-o-Nine-Tails F95 Edition)". F95Zone판 전용 엔진이고 다른 버전에는 쓰지 말라고 적혀 있다. 관리자 Lokplart. 브랜치 master(2025-04-16, Wine 자동 컴파일 시도)와 master-ia(2023-01-23). 구성은 `gui/`(Qt 창, `fastqspwindow.cpp`, `qsp_htmlbuilder.cpp` 등)와 `qsp/`(QSP 코어 + `jack.cpp/h`).

아래 위치는 master 브랜치 기준이고 줄 번호는 조사 시점 값이다.

| 항목 | 위치 |
|---|---|
| FOR 반복문 | `qsp/statements.cpp` `qspStatementSinglelineFor`(~1131), `qspStatementMultilineFor`(~1181). 보조: `qspPrepareForLoop`(~1001), `qspCheckForLoop`(~1062), `qspEndForLoop`(~1113). 등록은 `qspStatFor`("FOR") |
| json/ 읽어 변수 채우기 | `qsp/jack.cpp` `Jack::executeJSON()`(~15). `game/json` 하위를 재귀 순회하며 `.json`을 읽고(`save_config` 제외) `Jack::iterateKeys`, `setStringVariable`, `setNumericVariable`로 변수에 넣는다. menu_icon·slaves를 이름으로 따로 처리하는 코드는 못 찾았고 폴더 전체를 일괄 처리하는 구조다 |
| picMax | `qsp/jack.cpp` `Jack::getImages()`(~50), `Jack::loadImages()`. `content/pic/girls/{normal_scenes,reward_scenes,sex_scenes,...}`를 재귀 순회하며 png를 세고(`/unused/` 폴더 제외) `picMax[파일 기본이름]`을 만들어 `picMax['이름']` 변수로 QSP에 올린다 |
| CSS 로드 | `Jack::setStylesheet()`(~308)가 `<게임폴더>/css/` 안의 `.css` 파일 이름을 전부 `css_files`에 모은다. 첫 `executeJSON()` 때 호출. `base.css`라는 이름은 코드에 없음. 이 목록을 HTML에 붙이는 부분은 확인하지 못함 |
| MAINDESC_X/Y/W/H | `gui/qsp_htmlbuilder.cpp` 8~11줄 기본값 4, 4, 589, 389. 사용처(~113)는 확인하지 못함 |
| 창 제목 | `gui/fastqspwindow.cpp` ~608: `config.xml`의 `title "..."`를 정규식으로 읽어 `setWindowTitle`, 없으면 "FastQSP" |

주의: 엔진 소스가 jack.exe 어느 버전과 일치하는지는 확인하지 못했다. 우리 `game\engine\jack.exe`를 이 소스로 다시 빌드해 비교하지 않았다.

## 4. 라이선스

engine-base: GNU GPL v3(LICENSE 파일 확인). game-base와 media 저장소의 라이선스는 확인하지 못했다.

## 5. jack.qsp와 우리 2.3.2.5 한국어판의 관계

- game-base `master-ia-patch`와 `master-ia`의 `game/jack.qsp`는 바이트 동일하다. 크기 9,749,282, SHA-256 `e9601d01dcf3c850417e271990f1ffe00283242bf409c8019abe179fc3c7ead2`. 같은 파일의 `master`(2.3 릴리스, 2024-08-26)는 9,110,642바이트로 다르다.
- 우리 `source/jack_2026-10-01.qsp`는 17,019,470바이트, SHA-256 `59e1a1af...958e`로 원격과 다르다. 한국어판이고 2.4 작업이 반영돼 있어 당연한 차이다.
- 따라서 같은 계열(ImperatorAugustus 2.3.2.5 ← Lokplart `patch` 가공)인지는 **확인하지 못했다.** 바이트 비교만 했고 location 단위 구조 비교는 하지 않았다. 근거는 `config.xml` 제목이 v2.3.2.5라는 점뿐이다.
- Lokplart의 `Initial patch commit`/`Patch json files`가 우리 한국어판에 들어 있는지도 비교하지 못했다.

## 못 한 것

- media 저장소 내부, game-base의 README/라이선스, engine 빌드 재현, 로컬 jack.exe와 소스의 일치 여부, CSS 목록이 HTML로 붙는 지점, 위 5항의 location 단위 비교.
