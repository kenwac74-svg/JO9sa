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

### 미해결 질문
1. Image Workshop 소스(ZIP 또는 `JO9imgtool` 브랜치)를 이 저장소에 반입할 수 있는가.
2. 게임 `locations/*.qsrc`(또는 locations.zip) 샘플을 받을 수 있는가.
3. 로컬 보조 서버는 Image Workshop이 쓰는 것을 그대로 확장하는가, Text Workshop 전용을 만드는가.
4. 개발 시험 환경에서 쓸 수 있는 언어 (Node 등) 제약이 있는가.
