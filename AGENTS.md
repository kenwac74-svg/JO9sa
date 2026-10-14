# AGENTS.md — 이 저장소에서 일하는 에이전트(Codex 등) 안내

1. `docs/PROJECT.md` — 역할과 진행 기준(카일 PM 관리).
2. `docs/SESSION_HANDOFF_INDEX.md` — 세션 통합 인계. 최신 결정과 작업은 여기서 링크된 문서를 본다.
   - 집컴(VS Code Claude) 세션: `docs/session-handoffs/2026-10-04/homecom-2026-10-04.md`
3. 모딩 규칙: `CLAUDE.md`(QSP는 `mods/*.json`으로 기록, `tools/apply_mods.ps1`로 적용), `docs/modding/`(특히 `IMAGE_RANDOM_RULES.md`, `context-notes.md`).
4. 경로: 저장소 `G:\somi\JO9sa`, 플레이(테스트) 게임 `G:\somi\JO9\game`, 순정 원본 `G:\somi\JO9O`(건드리지 않음), 이미지 통합 작업 `G:\somi\IMGMG`(git 밖, 도구는 `tools/imgmg/`).
5. 게임 실행·화면 점검은 사용자가 한다. PowerShell 스크립트는 UTF-8 BOM으로 저장한다(Windows PowerShell 5.1).
6. 대사 편집실(`tools/text-workshop`)은 2026-10-04에 집컴 Claude가 고쳤다(보기 모드, 게임 화면 미리보기, 최소 mods 내보내기, 장면 그림 규칙). 고치기 전에 `tools/text-workshop/VERIFICATION.md`와 집컴 인계 8절을 읽을 것. 게임 설치본(`G:\somi\JO9\game\modtools\text-workshop`)도 같이 맞춘다.

7. 커뮤니티 배포 담당과 최신 기준: `docs/COMMUNITY_RELEASE_2_4_0.md`(2026-10-11 사용자 확정). Codex가 풀팩·간소화 패치 2.4.0을 제작한다. 기존 PM 전용 빌드 제한보다 이 기준을 우선한다.

8. 최신 사용자 지침: `docs/USER_DIRECTIONS_20261011.md`. 미사용 이미지 이동·복구 결과와 검증 한계는 `docs/UNUSED_IMAGES_ARCHIVE_20261011.md`. 새 장면전환/B컷 및 불확실한 동적 리소스를 미체크라는 이유로 제거하지 않는다.

9. 2026-10-15 사용자 확정 경로: 플레이 G:/somi/Jack O Nine Tails v2.4_work, 빌드배포 G:/somi/Jack O Nine Tails v2.4 Kor_Full. 이전 G:/somi/JO9와 JO924는 JO9_trash/2026-10-15_cleanup으로 퇴역. QSP 수정은 새 두 대상에 각각 적용·검증하며 보호 순정 JO9O와 현재 원천 IMGMG/JO9sa는 유지. 자세한 이동·복구는 docs/SOMI_CLEANUP_20261015.md.
