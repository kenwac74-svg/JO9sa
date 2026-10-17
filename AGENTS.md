# AGENTS.md — 이 저장소에서 일하는 에이전트(Codex 등) 안내

## 기본 작업 원칙: 창작 의도 보존

사용자 확정: docs/CREATIVE_INTENT_RULES_20261015.md. 세계관과 창작 의도를 임의로 왜곡하지 않는다. 지원 제한이 있으면 가능한 대안을 먼저 제시하고 제한을 필요한 최소 범위로 한정한다. 제한을 게임 내 임의의 발동 조건으로 바꾸지 않는다. 사용자 기획·대안·미구현 범위를 구분한다. 시스템·개발자 정책을 변경하거나 우회하지 않는다.

## 프로젝트 작업 안내

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

10. 2.4 CSS 기준: docs/CSS_2_4_POLICY_20261015.md. 원본 CSS의 역할(배치/폰트/배경/툴팁 표현)은 CSS에 유지한다. 비원본 문구/상태 출력의 CSS 임시 변경은 커밋·푸시 전에 QSP로 이관하고 제거·검증한다. 기준본은 assets/css-2.4이며 원본 JO9O는 수정하지 않는다. CSS 전체를 QSP로 옮기지 않는다.

11. 2026-10-16 사용자 확정: 플레이 폴더가 항상 최신이다. 작업 전 현재 저장된 플레이 QSP를 새로 읽어 먼저 적용한다. 배포 폴더는 별도 지시 또는 작업 마무리 후 커밋·푸시 지시 때만 반영한다. 이전 플레이·배포 동시 반영 기본값보다 우선한다. 자세한 기준: docs/WORKING_COPY_POLICY_20261016.md.

12. 2026-10-17 사용자 요청: QSP 수정본을 내보내거나 배포하기 전 `docs/QSP_RELEASE_VALIDATION.md`의 `tools/qa/release-check.cjs` 출고 검사를 실행하고 보고서를 남긴다. 실제 엔진 실행을 포함한 `PASS`만 자동 검사 완료로 인정한다. `STATIC_PASS`·`INCOMPLETE`·실패 또는 생략을 정상 실행 확인으로 보고하지 않는다. 이번 작업 직전 백업과 해당 패치만 지정하고, 배포 시 실제 배포 QSP를 `--mirror`로 대조한다. 기존 세이브 UI 불러오기·실제 화면·기능별 플레이 검증은 별도로 표시한다.
