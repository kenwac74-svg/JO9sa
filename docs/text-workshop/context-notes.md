# Text Workshop — 결정과 근거 기록

계속 덧붙인다. 확인한 사실과 추정을 구분한다.

## 2026-09-30 세션 1

### 브랜치
- 시스템이 지정한 `claude/lucid-ramanujan-2821xz`를 그대로 사용한다. `main`·다른 브랜치는 건드리지 않는다.

### 확인한 사실
- 저장소에 Image Workshop 소스가 없다. `docs/JO9imgtool_BASELINE.md`는 기준본(`JO9_CurrentScreenImageWorkshop_v1.1.2_PATCH_MANAGER_PIC_TOP_R1.zip`, 수정 HTML `payload/modtools/place/JO9_Place_Workshop.html`)만 등록한 문서이고, 소스 반입은 별도 커밋으로 하기로 되어 있다. 그 브랜치 `JO9imgtool`은 원격에 없다.
- 게임의 `locations/*.qsrc`와 `jack.qsp`도 저장소에 없다. `tools/qsp_dump.py`가 jack.qsp를 읽는 방식(UTF-16LE, 문자 코드 +5 시프트)은 재사용 가능하다.

### 결정
- 기획 §39.5에 따라 Image Workshop은 수정하지 않고 Text Workshop을 별도 경로로 둔다. 위치는 자료 확인 후 확정.
- 코어(파서·트랜잭션)는 시험 가능한 순수 로직으로 먼저 만든다. 언어는 자료 확인 후 확정 (Python 미사용 원칙이 기획 §1에 있으므로 배포물은 HTML/JS/PowerShell 계열로 볼 가능성이 높다. 추정).

### 사용자 결정 (2026-09-30)
- 보조 서버는 **Text Workshop 전용**으로 새로 만든다 (Image Workshop 서버 확장 안 함).
- 배포물은 **Python 구동이 필요 없어야** 한다. 서버·설치·롤백은 PowerShell, 화면과 코어 로직은 HTML/JS.

## 2026-09-30 세션 1 — 받은 자료 분석

받은 자료는 `locations.zip`(QSRC 243개)과 `JO9_ImageWorkshop_v1.1.2l_SAnk.zip`(기준본 v1.1.2 PIC_TOP_R1)이다. 저장소에는 아직 반입하지 않았다(사용자 결정 대기).

### Image Workshop 구조 (읽어서 확인)
- 엔진 `game/engine/jack.exe`는 순정에 `.jpatch` 섹션을 붙인 바이너리 패치본이다(+512 B). 메뉴 항목 문자열 `Image Workshop`, 실행 문자열 `1autosave()`, 실행 경로 `/../modtools/JO9_Launch.cmd`가 들어 있다.
- `JO9_Launch.cmd` → `JO9_Detect.ps1`: 게임 창에 키 시퀀스(Other → Show html)를 보내 QTextEdit에 뜬 **현재 화면 HTML 전체**를 UI Automation(실패 시 클립보드)으로 읽는다. 여기서 `content/pic/...` 이미지 경로를 정규식으로 뽑아 `runtime/context.json`에 쓴다.
- `JO9_Server.ps1`: `TcpListener` 루프백 동적 포트. `/api/context`, `/api/asset`, `/api/status` 등. 브라우저 heartbeat가 끊기면 종료. Python 미사용.
- 이미지 쓰기·백업·복구는 HTML(`JO9_Place_Workshop.html`, 240 KB)과 설치 스크립트 쪽에 있다. Text Workshop이 재사용할 수 있는 것은 이 패턴(Show HTML 캡처, 동적 포트 서버, heartbeat, 해시 매니페스트)이다.

### 텍스트 구조 (QSRC 샘플로 확인)
- QSRC는 UTF-8, CRLF. **텍스트가 이미 한글**이다. 영어 원문 병존이나 별도 로컬라이제이션 팩은 이 샘플에서 확인되지 않는다. (기획 §40 질문의 답, 이 샘플 범위에서.)
- 대사·지문은 대부분 `$text[1] = '[글로리아]<br> ... <<$master_name>>님 ... </div>'`처럼 **작은따옴표 문자열 안에 HTML 태그와 `<<변수>>`가 섞여** 있다. 예 `interaction_city.qsrc` 1896행 이후. 기획 §5.1의 변수 포함 텍스트 판별과 HTML 태그 처리가 핵심 난점이다.
- `#txt`·`#txt_2`는 `hero_choice`로 `_man`/`_woman` 파일을 `gs`로 호출하는 분기 파일이다. 실제 텍스트 DB는 `#txt_man/_woman`, `#static_txt`(3,993행) 등에 있다. 같은 문장이 남/여 버전으로 갈릴 수 있다.
- `interaction_city.qsrc`는 33,174행, 1.8 MB. 전체 QSRC 243개를 인덱싱하는 규모는 브라우저 JS에서 무리 없을 것으로 추정(미측정).

### 발견한 제약 (설계에 영향)
1. **게임이 읽는 것은 `jack.qsp`이지 QSRC가 아니다.** 편집 대상은 `game/jack.qsp`(QSPGAME, UTF-16LE, 문자 코드 +5 시프트 — `tools/qsp_dump.py` 참조)다. QSRC는 개발용 참고본이며 사용자 설치본과 다를 수 있다. 따라서 Resolver 인덱스는 **jack.qsp에서 직접** 만들어야 한다. (추정, jack.qsp 실물로 확인 필요.)
2. **현재 Location 이름은 Show HTML로 얻을 수 없다.** 기준본 `context.json`의 `place`는 항상 빈 문자열이다. 얻는 것은 화면 HTML(=보이는 문장)뿐이다. 기획 §10의 `currentLocation`은 지금 구조로는 없다. 대안은 화면 문장을 전 location 대상으로 완전 일치 검색해 여러 문장이 겹치는 location을 "현재 장면"으로 우선 정렬하는 것이다(추정, 시험 필요).
3. **엔진 메뉴 항목 추가에는 jack.exe 바이너리 패치가 필요하다.** Text Workshop 메뉴를 별도로 만들려면 `.jpatch` 섹션을 확장해야 한다. 이 환경에서는 Windows 실행 검증이 불가능해 위험이 크다.
4. 이 환경에는 PowerShell(`pwsh`)이 없다. Node는 있다. 그래서 파서·Resolver·escape 코어는 JS로 작성해 Node에서 시험하고, PowerShell 서버는 얇게 유지한다. PowerShell 서버·롤백은 Windows 사용자 시험 전까지 **미검증**으로 기록한다.

### 미해결 질문
1. 엔진 메뉴 진입 방식 (jack.exe 추가 패치 vs 기존 Image Workshop 실행에 편승).
2. 실제 설치본 `jack.qsp` 실물 (형식·헤더 확인과 왕복 시험용).
3. 두 자료를 이 저장소에 반입할 위치·방식.

## 2026-09-30 세션 1 — 사용자 답변과 코어 구현

### 사용자 결정
- 엔진 메뉴 진입은 **기존 Image Workshop 메뉴에 편승**한다(jack.exe는 건드리지 않음).
- 자료 위치는 구글 드라이브 `Moding\JO9mod`(Image Workshop ZIP), `Moding\JO9main\game`(locations).
- 실제 `jack.qsp`(16,677,048 B, SHA-256 `9f70cc32…ccad67`) 수신. 저장소에는 넣지 않고 시험 때 `--qsp`로 받는다.

### jack.qsp로 확인한 사실
- 243개 Location, QSRC와 일치. 헤더는 `QSPGAME` / 버전 필드 / `No`(암호 없음) / 개수. 필드는 UTF-16 코드 단위 -5 시프트.
- 파싱→직렬화가 **바이트 동일**(코어 시험).
- 본문 안에서 `'`·`"` 문자열 후보 29,818개 중 변수 없음 약 22,000, 변수 포함 7,621개(대사 10,266 / 지문 19,552, 휴리스틱 분류).

### 스캐너 결정과 근거
- `!` 주석 안의 문자열은 **여러 줄에 걸칠 수 있고 엔진이 한 덩어리로 건너뛴다**. 예 `#npc_base`의 `!$nastia_otkaz[1] = " ...\r\n- ... "`. 처음엔 줄 끝까지만 건너뛰어 6곳에서 문자열 경계가 어긋났고(그중 하나는 `#npc_base` 전체가 밀림), 주석 안 문자열을 통째로 건너뛰게 고쳐 스캔 실패 0건, 리터럴 뒤 문자도 정상 분포(줄바꿈·`&`·`]`·`,`·`)`·`+`·and/or 등)로 확인.
- `<<식>>` 안의 따옴표는 문자열 경계로 세지 않는다.
- 후보 분류: 한글이 있거나(또는 공백 포함 8자 이상 영문) 태그·변수 제거 후 2자 이상, 그리고 `gs`/`dynamic`/대입식으로 시작하는 코드 문자열이 아닌 것. 키(`'realtor'`)와 짧은 조각은 제외. 이는 **휴리스틱**이라 오분류 가능성이 있고, 편집 전 원문·주변 줄을 보여주고 사용자가 선택하는 흐름으로 보완한다.
- 편집 안전장치: 적용 시 원문 리터럴과 앞뒤 따옴표 일치를 다시 확인하고, 결과를 다시 파싱해 의도한 리터럴만 바뀌었는지 검증한다.

### 화면 매칭 설계
- 화면 HTML과 소스 리터럴 모두 태그 제거·엔티티 해제·공백 전부 제거한 키로 비교(Qt HTML 재포맷 흡수). 4자 미만은 매칭 제외.
- 변수 포함 문자열은 정적 조각이 화면에 순서대로 나오면 "변수 포함(편집 불가)"로 표시.
- Location 정렬은 겹치는 문장이 많은 곳 우선(추정, Location 이름을 화면에서 얻을 수 없어서).

### 구조 결정
- 코어 로직은 `textworkshop/payload/modtools/text/tw_core.js`(브라우저·Node 공용). 브라우저가 jack.qsp를 받아 파싱·편집·검증해서 결과 바이트를 서버로 보내고, PowerShell 서버는 해시 확인·백업·원자적 교체·롤백·기록만 맡긴다. 이렇게 하면 핵심 편집 로직을 이 환경에서 시험할 수 있다.

### 서버·UI·연동 구현 결과 (같은 날)
- 이 환경에 이동식 PowerShell 7.4.6(Linux)을 받아 서버·설치기를 실제로 실행해 시험했다. **Windows PowerShell 5.1, Windows 게임 실행, 실제 UI Automation 캡처(Detect)는 미검증**이다.
- 서버(`JO9_Text_Server.ps1`): 요청 헤더를 바이트 단위로 읽는다(StreamReader는 본문을 먹을 수 있어 사용하지 않음). 브라우저가 편집 결과 전체 바이트를 `X-TW-Base`(원본 해시), `X-TW-After`(결과 해시), `X-TW-Meta`(변경 내역 base64)와 함께 POST하면 서버가 ① 원본 해시 재확인 ② 본문 해시 확인 ③ 백업 후 백업 해시 확인 ④ 임시 파일 기록·해시 확인 ⑤ 교체 후 재읽기 해시 확인 ⑥ 실패 시 백업 복구 ⑦ 기록 저장 순으로 처리한다. 설계상 서버는 QSP 내용을 해석하지 않는다.
- 시험 중 잡은 결함: jack.qsp를 읽지 못하는 예외에서 응답 없이 연결이 끊겼다 → 오류 JSON(500)을 돌려주도록 수정.
- 롤백은 현재 파일 해시가 그 작업의 결과 해시와 같을 때만 허용한다(후속 변경이 있으면 409). 결과적으로 여러 작업은 최신부터 되돌려야 한다.
- UI: Image Workshop 색상 재사용. 탭은 현재 화면·텍스트 검색·기록. 변수 포함 항목은 숨기지 않고 "변수 포함 텍스트" 배지와 안내를 보여주며 수정 버튼을 주지 않는다. Chromium 시험에서 일치→수정→확인→적용→기록→되돌리기, 검색 선택 치환(미선택 유지), 외부 변경 시 중단을 확인.
- 화면 일치 최소 키 길이를 4→6으로 올렸다. 4일 때 `글로리아` 같은 이름 정의 문자열이 현재 화면 후보로 섞여 나왔다.
- 연동(Image Workshop 편승): `Install-TextWorkshop.ps1`이 기준본 해시(Detect `0045852F…`, Server `4E92D9D0…`, Html `E196E4B4…`)를 확인한 뒤 3곳에 표식 `JO9_TEXT_WORKSHOP_HOOK` 코드를 붙인다. 앵커가 정확히 한 곳이 아니면 중단, 원본은 `text\hook_backup`에 보관, 제거 시 해시 검증 후 복구. 시험(Linux pwsh)에서 설치→문법 검사→재설치 멱등→`/api/open-text`가 Text 서버 기동→제거 시 원본 바이트 복구→비기준본 거부까지 확인. Linux 시험에서는 `-WindowStyle`(Linux 미지원)을 시험 복사본에서만 뺐다.
- `JO9_Detect.ps1` 연동(화면 HTML을 `text\runtime\screen.html`로 저장)은 문법 검사만 했고 실행은 못 했다. Show HTML이 돌려주는 실제 HTML 형태(Qt `toHtml` 여부)에 따라 화면 매칭 정확도가 달라질 수 있어 **사용자 실게임 시험에서 가장 먼저 확인할 항목**이다.

### 알려진 한계·주의
- 게임 실행 중 jack.qsp를 교체하면 게임에는 재시작·재로드 후 반영될 가능성이 높다(추정, 미확인). 파일 잠금이 있으면 저장 단계에서 실패하고 자동 복구된다.
- Image Workshop 패치 관리자의 "설치/업데이트"를 다시 하면 연동이 덮어써진다. 그 패치 관리자의 검증 기능이 수정된 3개 파일을 불일치로 볼 수 있다(미확인).
- UI 패치(SNKmod) 등 다른 모드가 jack.qsp를 바꾸면 이전 텍스트 작업은 되돌릴 수 없고, 그 모드를 다시 설치하면 텍스트 수정이 덮어써질 수 있다.
- 기획 §22 "작업 단위 롤백"은 구현, 개별 줄 롤백은 v0.1 범위 밖.
- 후보 분류(대사/지문, 코드 문자열 제외)는 휴리스틱이라 오분류가 있을 수 있다.

### Windows PowerShell 5.1 실검증에서 잡은 결함 (2026-10-03)
Linux pwsh 시험으로는 보이지 않았고, Windows 11의 5.1에서 실행해서 발견·수정했다.
- `.ps1`에 BOM이 없으면 5.1이 한글을 ANSI로 읽어 설치기 파싱이 실패했다(오류 12개). 두 `.ps1`에 UTF-8 BOM 추가.
- `/api/qsp`(17 MB)가 마지막 약 29 KB를 남기고 연결이 끊겼다. 응답을 64 KB씩 쓰고 `Shutdown(Send)` 후 상대가 닫을 때까지 읽도록 수정.
- 5.1의 `ConvertFrom-Json`이 JSON 배열을 한 개체로 돌려줘 기록 목록이 이중 배열이 되고 롤백이 실패했다. 읽을 때 평탄화.
- 실제 사용 중인 Image Workshop Html이 기준본과 달랐다(`[연동형 경로복구 1.1.3]`, SHA-256 `6A5C7A38…F978CC`, 249,703 B). 연동 앵커는 동일하여 허용 해시에 추가하고, 백업·복구 검증은 "실제 원본 해시" 기준으로 변경.
- 5.1 시험 결과: 설치·제거(기준본/변형본 모두 원본 바이트 복원), 서버 ping·state·qsp 전체 수신·apply·history·rollback·오래된 base 409 통과. **미검증**: 실제 게임 실행 중 Detect의 screen.html 저장, 브라우저 UI 클릭(이 PC에는 Node/Playwright 없음).
