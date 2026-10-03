# AGENTS.md — 이 저장소에서 일하는 에이전트(Codex 등) 안내

1. `docs/PROJECT.md` — 역할과 진행 기준(카일 PM 관리).
2. `docs/SESSION_HANDOFF_INDEX.md` — 세션 통합 인계. 최신 결정과 작업은 여기서 링크된 문서를 본다.
   - 집컴(VS Code Claude) 세션: `docs/session-handoffs/2026-10-04/homecom-2026-10-04.md`
3. 모딩 규칙: `CLAUDE.md`(QSP는 `mods/*.json`으로 기록, `tools/apply_mods.ps1`로 적용), `docs/modding/`(특히 `IMAGE_RANDOM_RULES.md`, `context-notes.md`).
4. 경로: 저장소 `G:\somi\JO9sa`, 플레이(테스트) 게임 `G:\somi\JO9\game`, 순정 원본 `G:\somi\JO9O`(건드리지 않음), 이미지 통합 작업 `G:\somi\IMGMG`(git 밖, 도구는 `tools/imgmg/`).
5. 게임 실행·화면 점검은 사용자가 한다. PowerShell 스크립트는 UTF-8 BOM으로 저장한다(Windows PowerShell 5.1).