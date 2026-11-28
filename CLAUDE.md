# JO9 로컬 모딩 — Claude 작업 규칙

<!-- JO9 MOD START BRANCH_READ_LOCK_20261119 -->
## 이 브랜치 읽기 제한 (사용자 지시, 2026-11-19)

**`claude/vibrant-turing-ysgmbv` 브랜치는 사용자 허락 없이 다른 AI(Codex·Claude 다른 세션·모딩 개발 AI 등)가 자동으로 읽거나, 가져오거나, 작업 근거로 쓰지 않는다.** 이 브랜치의 내용이 필요하면 먼저 사용자에게 묻는다. 사용자는 필요한 자료를 zip 등으로 직접 전달한다.
<!-- JO9 MOD END BRANCH_READ_LOCK_20261119 -->


<!-- JO9 MOD START CODEX_TO_CLAUDE_HANDOFF_20261108 -->
## 2026-11-08 최신 인수인계

**추가 사용자 지시: 사운드 바이너리 Git 업로드 금지.** MP3/WAV 등 음원은 로컬 WORK·assets에 보존하고 경로·채택 정보·재생 코드만 추적한다.

사용자 지시로 Codex 사용량 충전 동안 Claude가 이어받는다. 먼저 [최신 인수인계](docs/session-handoffs/2026-11-08/CLAUDE_HANDOFF_KO.md)와 AGENTS.md를 읽는다. 현재 실행 기준은 WORK와 assets/runtime/2.4.1/jack.qsp이며, 아래의 옛 source/ 기준보다 최신 WORK 정책이 우선한다. Full은 별도 지시 없이 동기화하지 않는다.
<!-- JO9 MOD END CODEX_TO_CLAUDE_HANDOFF_20261108 -->



이 repo를 연 Claude는 먼저 `docs/PROJECT.md`(채팅별 역할, PM 관리)를 읽고 자기 역할만 한다. 그다음 아래 문서를 읽고 그대로 따른다. 이미 정해진 결정은 다시 묻지 않는다.

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
- 역할은 `docs/PROJECT.md`가 기준이다 (2026-10-02 결정 17).
- 로컬 모딩 도구(homecom·notebook): 텍스트 수정·이벤트 분기 등 QSP 내용 변경을 `mods/`로 기록해 main에 올린다. 빌드·패키징은 하지 않는다.
- JO9UI패치모드(PM): 빌드·검증·패키징, 기록과 작업 지휘.

## 핵심 규칙
- qsp를 직접 수정한다. `.qsrc`로 재빌드하지 않는다.
- 수정 전에 qsp 왕복 검증(읽고 그대로 다시 쓴 결과가 원본과 바이트 동일)과 백업을 한다.
- 게임 폴더 전체를 git에 넣지 않는다. 수정 대상 파일만 날짜 붙여 백업한다.
- 게임 실행과 화면 점검은 사용자가 수동으로 한다. 사용자가 요청할 때만 `tools\screenshot.ps1`로 화면을 캡처해 읽는다. 클릭·키 입력은 자동화하지 않는다.
- 모든 것을 도구로 해결하려 하지 않는다. 사람이 하는 편이 나은 일(실행 확인, 판단)은 사용자에게 남긴다.
- 보고는 수정 파일, location, 핵심 변경, 쓰기 여부, 확인 포인트만 짧게 한다. 확인하지 못한 것은 못 했다고 쓴다.


## 2026-11-18 발육·외형 분류 판단 정정

AGE_CLASSIFICATION_FACTS_20261118: age/seed_age 0·1·2는 실제 만 나이가 아닌 분류 코드다. 내부 이름만으로 실제 나이를 판단하지 않으며 이전 정정 기록을 먼저 확인한다. 코드명 정리는 분류 숫자와 동작을 바꾸지 않는다. [확정 정책](docs/modding/AGE_CLASSIFICATION_POLICY_20261118_KO.md).
