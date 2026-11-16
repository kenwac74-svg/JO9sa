# 릴리즈 기준 감사 — 2026-11-13

읽기 전용으로 정책·기존 배포 원장·기존 포장 스크립트를 확인했다. 이 파일 이외의 게임/Full/원본/ZIP/저장소 파일은 변경하지 않았으며, 포장·실제 엔진 검사·커밋·푸시는 실행하지 않았다.

## 1. 기준을 혼동하지 않을 것

| 용도 | 확인된 기준 | 식별값 |
|---|---|---|
| 같은 본편에 대한 누적 패치의 원배포 기준 | 2026-11-02 배포 2.4.1 본편. `G:/somi/JO9sa/records/distribution-cleanup-20261102/BUILD_MANIFEST.json` | manifest SHA-256 `f133a60de8ef701c0202df4a65e032ca39a0bb0d70432b59893910e7ca0f2339`; 런타임 42,921파일 |
| 위 본편의 QSP | 원장 `game/jack.qsp`, 49,123,630 bytes | `6cc7066736cae7fc428d58f89fbf659f06ee6feae8c710d810ee67c99467d505` |
| 위 본편의 CSS | 원장 `game/css/base.css`, 252,350 bytes | `1676136c66213272031f11bb7891223e15862b3c3944079fd2925d8e5f277e77` |
| 최신 공개 패치 | 2.4.1 3차 r2, `JO9_2.4.1_Patch_20261107_3차_r2.zip` | 246,528,794 bytes; ZIP `720ddc1876c9a5118f65a3d95744ed7f2b36764890f19f6062bcd0329569f4a0` |
| 최신 공개 패치 QSP | 49,712,576 bytes | `46e972bf98bc74cd79176312683e398bf7ae639bc7edeecadfcb6efd9a8f54b9` |
| 최신 공개 패치 명세 | commit `1c3f76ddcf5c8da0a92cea1908ef3cdb1627af4f`, `releases/2.4.1-update3-20261107/PATCH_MANIFEST.json` | 명세 `54b6bebfa84306c4ad9096b65c0e1887ac0f80237a7eef477924fba2f8901298`; `gameVersion=2.4.1`, `patchRevision=2026-11-07-update3-r2`, `jsonMode=replace-complete` |

`docs/THIRD_PATCH_RELEASE_20261026*.md`는 구 2.4의 10월 26일 이력이다. 현재 2.4.1의 11월 7일 3차와 동일 차수라는 이유로 최신 기준으로 삼으면 안 된다. `docs/PACKAGING_POLICY_20261019.md`의 “현재 설치 기준 … r4” 문장 역시 11월 6일 시점이다. 최신 공개 패치는 11월 7일 3차 r2가 대체했다.

3차 r2의 파일 원장과 출고 기록은 로컬 Git 객체에서 현재 읽어 확인했다. 이 PC에 전달된 실제 배포 ZIP을 찾아 새로 해시한 검사는 아니다. `ARTIFACT.json`에도 사용자 수동 전달 및 배포 PC에서 체크섬 확인을 명시한다.

## 2. 필요한 누적 합집합

`G:/somi/JO9sa/AGENTS.md` 29항과 `docs/PACKAGING_POLICY_20261019.md:127`의 `CUMULATIVE_PATCH_POLICY_20261106`이 기준이다. 같은 2.4.1 본편 대상의 정식 패치는 최초 추가 패치부터 최신 승인 변경을 누적해, 본편에 최신 ZIP 하나만 적용할 수 있어야 한다.

현재 공개 3차 r2 원장에는 필수 2,409경로가 있다.

| 분류 | 경로 수 |
|---|---:|
| QSP | 1 |
| 전체 JSON | 1,158 |
| 게임 PNG | 831 |
| 동봉 WORKSHOP | 419 |
| 합계 | 2,409 |

`docs/CUMULATIVE_CHECK_20261107_KO.md`와 Git의 실제 manifest를 대조했다. 2차 r4 필수 1,967경로가 모두 보존됐고, 그중 기존 게임 그림 808장은 경로·해시 동일하다. 3차에서 그림 23장과 WORKSHOP 419파일이 추가됐으며 QSP와 시루·펠라게야 JSON 2개가 후속 교체됐다. 엘사 그림도 필수 이전 경로에 포함된다.

따라서 이번 정식 누적 패치의 명세는 **3차 r2 필수 경로의 승인된 최신 내용 + 3차 이후 승인·반영된 변경**을 포함해야 한다. 원배포 2.4.1 manifest와도 비교해 CSS/JS/음원 등 3차 명세 밖에서 변한 필요한 경로를 추가한다. 승인된 후속 교체·퇴역만 별도로 적용하며, 단순히 서로 다른 해시만 고르거나 직전 3차와의 차이만 모으면 안 된다. WORK의 모든 개인·개발 파일을 자동 포함하는 뜻도 아니다.

23개 기본 전신 호환 PNG와 시루 등 후속 호환 주소는 `docs/IMAGE_COMPATIBILITY_ALIASES_KO.md` 및 각 원장의 KEEP 지침을 유지한다. 같은 해시라도 다른 경로는 별도 필수 파일이다. 현재 Full 폴더는 원배포 기준이나 자동 동기화 입력으로 취급하지 않는다.

## 3. 기존 스크립트에서 주의할 점

Git commit `1c3f76dd…`의 `tools/release-20261107/build.ps1`은 당시 출고 재현용이다.

- 기본 입력 경로 `C:/MOVE/...`와 당시 WORK 경로가 고정돼 있다.
- r4 QSP/명세 해시, r4 필수 1,967경로, 복구 WORKSHOP 419파일, 최종 3차 QSP `46e972bf…`가 고정돼 있다.
- `Confirm-Row`와 overlay의 허용 분류는 QSP/JSON/게임 PNG/WORKSHOP이다. 이번 CSS·MP3·WAV 등 범위를 담는 현재 패치용 명세·복사·검사 규칙을 검토해야 한다.
- 기존 ZIP이 있으면 중단하고, 실제 게임 밖의 출력·빈 추출 mirror를 요구한다.
- 11월 5일 `records/release-patch-20261105/build-package.py`도 최초 942경로 및 구 JSON 25파일 정리 구조가 고정된 역사적 스크립트다. 최신 전체 JSON 교체 방식을 대신할 수 없다.

포장 승인이 생겨도 이 스크립트를 값만 추측해 바로 실행하지 않는다. 새 명세·새 출력 이름·현재 입력 해시와 설치 흐름을 먼저 확정한다.

## 4. 출고 전 필수 게이트

1. 현재 WORK 입력 해시와 승인 범위를 동결하고, 3차 r2 경로 합집합 및 원배포 대비 변경을 경로·해시로 대조한다. 보류/개인/개발 파일은 분리한다.
2. 전체 JSON을 교체하는 명세와 자동 `INSTALL.cmd`/수동 설치의 기존 선택권을 유지·검토한다. 구 25개 개별 수동 정리 안내는 최신 방식이 이미 대체했다. 설치 시 기존 SAV/INI/선택 `save_config.json` 보존을 확인한다.
3. `docs/QSP_RELEASE_VALIDATION.md`에 따라 격리 사본에서 구조·줄/주석 경계·정확 재생/재적용·JSON ID·실제 FastQSP 기본 9경로를 확인한다. 검사 baseline은 이번 정확한 패치 입력이며 과거 mods 전체를 무조건 지정하지 않는다. 실제 배포 QSP를 `--mirror`로 대조한다. STATIC_PASS/INCOMPLETE는 출고 PASS가 아니다.
4. 새 콜백·기존 보유 인물 갱신·생성 규칙·클럽/전투·CSS/장면 레이어·음원 등 이번 동작 범위는 관련 기존 검사 근거와 현 후보의 차이를 연결하고 필요한 회귀만 추가한다. 엔진 진단은 병렬 실행하지 않는다.
5. ZIP 생성 후 전체 CRC/항목 SHA, 재추출 런타임·명세 일치, 설치 시뮬레이션, 공개 문서/실제 파일명/체크섬 일치를 확인한다. 기존 ZIP은 보존한다.
6. 사용자의 일반 EXE에서 실제 세이브 선택→로드→저장→재로드·핵심 화면·청감은 자동 검사와 구분해 표시한다. 과거 체크리스트의 미확인을 새 후보의 완료로 바꾸지 않는다.
7. 재생성 가능한 이번 진단 복사본을 정리하고 핵심 보고서·명세·재현 스크립트와 유일 복구 자료는 남긴다.

지금 요청은 릴리즈노트와 체크리스트 작성·누락 검토 단계이므로 위 엔진 검사·포장·설치·마이그레이션 실행을 승인된 일로 처리하지 않는다.

## 5. 결정 또는 정정이 필요한 것

- **현재 정식 명칭/형태:** 11월 10일 `docs/SESSION_HANDOFF_INDEX.md:1341`에는 “모든 수정사항 완료 후 2.4.2 Full 배포 직전에 세이브 마이그레이션 도구 작업”이라는 사용자 확정이 있다. 이것은 미래 Full의 버전·작업 시점을 확인하지만, 지금 검토 중인 산출물을 곧바로 “2.4.2 Full” 또는 “2.4.1 4차”로 확정하는 근거는 부족하다. 릴리즈노트는 확정 전까지 “3차 r2 이후 누적 변경 후보”로 식별할 수 있다.
- **누적과 델타의 충돌:** `docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md:187`의 “4차 패치 후보(델타, 누적 아님, 선행조건 3차 …)”는 전체 정식 패치 누적 지침과 충돌한다. 정식 공개 패치를 뜻한다면 누적 정책이 우선한다. 개별 실험 후보를 뜻한다면 정식 누적 배포물과 혼동하지 않도록 문서에서 구별해야 한다.
- **4차 착수 시 원고 결정:** 4차로 정하면 `docs/FOG_EAST_CONTENT_BACKLOG_20261019.md`의 안개·동부 부동산 소개 32문구를 이번에 넣을지 계속 미룰지 사용자의 결정이 필요하다. 주택 판매 활성화 승인은 별개다.
- **2.4.2 Full 직전 D21:** 모든 수정 완료 후에만 구세이브 이미지 경로·화면 캐시와 동일 ID+옛 기본 이름을 이관한다. 플레이어 작명 보존이 필수다. 시루 도미나 임시 호환 PNG의 정리도 이 검증이 끝난 뒤다. 지금은 마이그레이션/삭제 보류다.
- **실물 배포본 확보 여부:** 원배포 본편은 BUILD_MANIFEST로 식별했고 최신 3차 ZIP은 보존된 Git ARTIFACT/출고 기록으로 식별했다. 최종 배포 준비 때 사용하는 실물 원본 ZIP/본편의 위치·해시를 다시 연결해야 한다.

## 근거

- `G:/somi/JO9sa/AGENTS.md` 11·12·13·18·23·25·28·29항.
- `G:/somi/JO9sa/docs/PACKAGING_POLICY_20261019.md:123`, `:127`.
- `G:/somi/JO9sa/docs/CUMULATIVE_CHECK_20261107_KO.md`.
- `G:/somi/JO9sa/docs/NEXT_PATCH_CHECKLIST_20261107_KO.md`.
- `G:/somi/JO9sa/docs/QSP_RELEASE_VALIDATION.md`.
- `G:/somi/JO9sa/records/distribution-cleanup-20261102/BUILD_MANIFEST.json`와 `REPORT_KO.md`.
- Git `1c3f76ddcf5c8da0a92cea1908ef3cdb1627af4f`의 `records/release-20261107/REPORT_KO.md`, `qa/shiru-existing/package-verification.json`, `releases/2.4.1-update3-20261107/ARTIFACT.json`, `PATCH_MANIFEST.json`, `tools/release-20261107/build.ps1`.
- `G:/somi/JO9sa/docs/SESSION_HANDOFF_INDEX.md:1341`, `:1343`, `:1358`.
- `G:/somi/JO9sa/docs/session-handoffs/2026-11-10/CLAUDE_HANDOFF_KO.md:187`.
