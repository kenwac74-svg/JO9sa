# JO9 Text Workshop v0.1 — 작업 계획

원본 기획은 [HANDOFF_PLAN_v0.1.md](HANDOFF_PLAN_v0.1.md). 이 문서는 그 구현 순서(§42)를 이 저장소 상태에 맞춰 쪼갠 것이다.

## 목표
게임 화면의 변수 없는 순수 대사·지문을 엔진 메뉴에서 열어, 실제 QSRC 사용처를 목록으로 찾고, 선택한 항목만 수정하며, 백업·SHA-256 검증·작업 단위 롤백까지 안전하게 처리한다.

## 현재 저장소 상태 (2026-09-30 확인)
- 있음 `tools/qsp_dump.py`(jack.qsp → location JSON), `docs/JO9imgtool_BASELINE.md`(Image Workshop 기준본 등록 문서).
- 없음 Image Workshop 소스 HTML(`JO9_Place_Workshop.html`), 게임 `locations/*.qsrc`, `jack.qsp`, 로컬 보조 서버 코드.
- 결과 기획 §42-1(기존 구조 파악)과 §40(텍스트 구조 조사)은 위 자료를 받아야 진행할 수 있다.

## 단계
1. 입력 자료 확보 — Image Workshop 소스, 게임 QSRC 샘플. 사용자에게 요청.
2. 구조 조사 — Image Workshop의 진입 루트·서버·백업/롤백 방식, QSRC 텍스트 구조(`#txt` 등, 언어 구성).
3. 순수 함수 코어 — QSRC 파서와 텍스트 인덱서, 완전 일치 Resolver, QSP 문자열 escape. 시험 먼저.
4. 트랜잭션 코어 — 해시 확인, 백업, 적용, 재읽기 검증, 실패 롤백, History. 시험 먼저.
5. UI — `[현재 화면]` `[텍스트 검색]` `[기록]` 탭. Image Workshop 톤 재사용.
6. 엔진 메뉴 진입과 Context 전달.
7. 기획 §36 시나리오 A–G 시험, 실제 게임 시험은 사용자.

## 범위 밖
Preset, Asset Registry, 변수·조건 편집, Key 분리, 치트 메뉴. Image Workshop 대규모 리팩터링 금지.
