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
