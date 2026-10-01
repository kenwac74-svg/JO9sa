# JO9 로컬 모딩 — Claude 작업 규칙

이 repo를 연 Claude는 먼저 아래 문서를 읽고 그대로 따른다. 이미 정해진 결정은 다시 묻지 않는다.

1. `docs/modding/JO9_Claude_Local_Modding_Handoff.md` — 작업 방식과 원칙 전문
2. `docs/modding/LOCAL_HANDOFF_2026-10-01.md` — 확정된 결정, qsp 형식, 작업 순서
3. `docs/modding/context-notes.md` — 분석 결과와 근거 (계속 덧붙이는 기록)

## 이 PC의 경로
- 게임 폴더와 qsp 경로는 repo 루트의 `local.config.json`(git에 올리지 않음)에 있다. 없으면 `powershell -ExecutionPolicy Bypass -File tools\setup_pc.ps1`을 실행해 만든다. 경로를 문서에서 추측하지 않는다.
- 최신 소스 보관본은 `source/` 아래 날짜가 붙은 파일이다. 가장 최근 날짜 파일이 기준이다.

## 핵심 규칙
- qsp를 직접 수정한다. `.qsrc`로 재빌드하지 않는다.
- 수정 전에 qsp 왕복 검증(읽고 그대로 다시 쓴 결과가 원본과 바이트 동일)과 백업을 한다.
- 게임 폴더 전체를 git에 넣지 않는다. 수정 대상 파일만 날짜 붙여 백업한다.
- 화면 확인은 `tools\screenshot.ps1`로 PNG를 만들어 읽는다. 클릭·키 입력은 자동화하지 않는다.
- 보고는 수정 파일, location, 핵심 변경, 쓰기 여부, 확인 포인트만 짧게 한다. 확인하지 못한 것은 못 했다고 쓴다.
