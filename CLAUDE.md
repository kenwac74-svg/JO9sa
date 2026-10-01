# JO9 로컬 모딩 — Claude 작업 규칙

이 repo를 연 Claude는 먼저 아래 문서를 읽고 그대로 따른다. 이미 정해진 결정은 다시 묻지 않는다.

1. `docs/modding/JO9_Claude_Local_Modding_Handoff.md` — 작업 방식과 원칙 전문
2. `docs/modding/LOCAL_HANDOFF_2026-10-01.md` — 확정된 결정, qsp 형식, 작업 순서
3. `docs/modding/context-notes.md` — 분석 결과와 근거 (계속 덧붙이는 기록)

## 경로
- 게임 폴더와 qsp 경로는 사용자가 알려 준다. 문서나 이전 대화에서 추측하지 않는다. repo 루트에 `local.config.json`(git 제외)이 있으면 거기 적힌 값을 쓴다.
- 게임 qsp의 실제 위치는 `<게임폴더>\game\jack.qsp`다.
- 최신 소스 보관본은 `source/` 아래 날짜가 붙은 파일이다. 가장 최근 날짜 파일이 기준이며 원본(패치 전) 상태로 둔다.

## 패치 기록
- 확정된 수정은 `mods/` 에 선언형 JSON(location, old, new, count, 적용 전·후 SHA-256)으로 남기고 `tools\apply_mods.ps1`로 적용한다. 형식과 새 PC 절차는 `docs/modding/NEW_PC_KR.md`.

## 작업 분담
- `jack.qsp` 변경은 이 repo의 Claude가 전담한다. UI패치모드 세션의 변경 의뢰는 `docs/modding/PROCESS.md`의 형식과 순서로 처리한다.

## 핵심 규칙
- qsp를 직접 수정한다. `.qsrc`로 재빌드하지 않는다.
- 수정 전에 qsp 왕복 검증(읽고 그대로 다시 쓴 결과가 원본과 바이트 동일)과 백업을 한다.
- 게임 폴더 전체를 git에 넣지 않는다. 수정 대상 파일만 날짜 붙여 백업한다.
- 화면 확인은 `tools\screenshot.ps1`로 PNG를 만들어 읽는다. 클릭·키 입력은 자동화하지 않는다.
- 보고는 수정 파일, location, 핵심 변경, 쓰기 여부, 확인 포인트만 짧게 한다. 확인하지 못한 것은 못 했다고 쓴다.
