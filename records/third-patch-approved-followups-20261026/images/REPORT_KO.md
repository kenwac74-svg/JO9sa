# 승인된 이미지 경로 두 건 — WORK 적용 결과

변경 식별명: `THIRD_IMAGE_EXACT_PATH_ALIASES_20261026`. 기준일 2026-10-26.

사용자가 승인한 JSON 교정 + 정확한 구 경로 PNG 사본 방식을 WORK에 적용했다. 기존 PNG의 파일명·내용과 색상/머리길이 접미사는 유지했다. 이 작업은 QSP·세이브·Full·순정 원본·기존 ZIP·카탈로그·배포이력을 쓰지 않았다. 해당 파일들의 다른 작업 변경까지 이 보고서가 인증하는 것은 아니다.

## 적용한 네 파일

모든 경로는 `G:/somi/Jack O Nine Tails v2.4_work/game/` 기준이다.

| 파일 | 변경 | SHA-256 (적용 후) |
|---|---|---|
| `json/slaves/212.json:8` | `seed_ava_clear`: `content/pic/girls/face/00212_white_long_loli` → `content/pic/girls/face/0212_white_long_loli` | `8ec1a71d7ad54d6da6e97473a5569f70ea70ef7c8fd73c6f3dbe3a698e24fb30` |
| `json/slaves/178.json:3` | `fullmade`: `girls/full/cloth/178_purple_short_loli` → `girls/full/cloth/0178_purple_short_loli` | `93876df04a99969a4eafb9900178821d5f9974c41e83cc5d3beafa28606f456f` |
| `content/pic/girls/face/00212_white_long_loli.png` | 정상 `0212_white_long_loli.png`의 58,193바이트 사본 추가 | `67c46a864dbd5b14d4599339431e134b047f13d6f9f8c7ab9e7d8bc0515f55be` |
| `content/pic/girls/full/cloth/178_purple_short_loli.png` | 정상 `0178_purple_short_loli.png`의 133,999바이트 사본 추가 | `b1b7728851d4401865a002a630f33e6c53142bb7235d7b0287f12a4a6cf814a0` |

추가 PNG 합계는 192,192바이트다. JSON 교정은 해당 값의 숫자 0만 변경했다. JSON의 나머지 키/값·서식·줄바꿈은 바이트 비교로 보존했다. 새 그림을 제작하거나 이미지 생성 도구를 사용하지 않았다.

## 검사 근거와 한계

`baseline.json`은 적용 전 두 JSON의 잘못된 필드와 구 경로 PNG 두 개의 부재를 기록한다. 정상 PNG 두 개는 이미 존재했고, 기존 제안의 해시와 일치했다. `before/178.json`, `before/212.json`은 이 시점의 정확한 원본이다.

`staged-validation.json`과 `validation.json`이 PASS다. JSON 파싱, 키별 정확한 교정, 다른 값 불변, 예상 바이트 치환과의 완전일치, 신규 경로의 정상 PNG 존재, 구 경로 PNG의 정상 원본과 바이트일치/PNG 시그니처를 확인했다. PNG 원본도 지정 해시를 유지했다. WORK 세이브 167파일 및 Full 세이브 18파일의 경로·크기·해시, Full/JO9O의 관련 여섯 경로 상태가 적용 전후 일치했다.

실제 게임 화면 렌더링, 신규 인물 생성 UI, 메이드 선택 UI, 기존 세이브 GUI 로드는 이 하위 작업에서 실행하지 않았다. 파일 경로 해결과 내용 동일성의 검증을 전 화면 플레이 검증으로 확대해 보고하지 않는다. QSP 수정·문법·실제 엔진 출고 검사는 상위 통합 작업이 담당한다.

## 동작과 유지보수

신규 JSON 참조는 정상 PNG 경로를 읽는다. 구 세이브에 `ava_clear`, `fullimage` 또는 저장 HTML로 남은 정확한 옛 URL은 추가한 PNG 경로로 파일을 찾을 수 있다. 세이브 값 교정·인물 재생성·새 로케이션/함수·저장키를 추가하지 않았다.

두 JSON은 기존 seed/외형 로더의 입력이고, 두 PNG는 기존 렌더러가 요청하는 정적 파일이다. 호출 관계 조사 근거는 `records/bug-report-review-20261025/image-paths-report.md`에 있다. 이 작업에 새 런타임 함수나 반환값은 없다. JSON 교정만 제거하면 새 인물에도 옛 참조가 다시 들어갈 수 있으나 호환 PNG가 있으면 파일은 찾는다. 호환 PNG만 제거하면 기존 저장의 옛 URL은 다시 누락될 수 있다. 정상 원본을 향후 교체할 때는 두 호환 사본도 함께 갱신해야 한다.

## 패키지 통합 인계

현재 3차 기존 core/personal/indie ZIP의 실제 central entry를 조회했다. 두 JSON, 두 정상 PNG, 두 구 경로 PNG는 이 세 ZIP에 포함되지 않았다. 따라서 해당 JSON이 현재 인디팩에 들어 있다고 추정해 대용량 인디팩을 교체하지 않는다. 조회 결과는 `package-mapping.json`에 있다.

상위 작업의 새 3차 r1 합의에 따라 다음 네 런타임 파일을 추가한다.

- **core**: `game/json/slaves/212.json`, `game/json/slaves/178.json` (기존 7 + 2 = 9 런타임).
- **personal**: `game/content/pic/girls/face/00212_white_long_loli.png`, `game/content/pic/girls/full/cloth/178_purple_short_loli.png` (기존 146 + 2 = 148 런타임, 이미지 147 + JSON 1).
- **indie**: 기존 `JO9_2.4_IndieResources_20261021.zip` 바이트 그대로 재사용.

기존 ZIP은 이 작업에서 변경하지 않았다. 구 3차 구성에 대해 새 core/personal을 덮어씌우면 된다. 기존 인디팩을 나중에 다시 덮어쓴다고 이 네 경로를 되돌리지는 않는다(현재 인디팩에 이 경로가 없다는 central entry 근거). 이 매핑은 파일 전달 지침이며 이 하위 작업이 ZIP 제작을 수행한 것은 아니다.

## 백업·재현·복구

`apply-and-verify.cjs`가 정확한 네 대상만 다룬다. `baseline`은 사전 상태/세이브 해시/백업을 남기며 기존 baseline 덮어쓰기를 거부한다. `apply`는 현재 JSON/PNG 해시와 구 경로 부재를 확인하고 staging 검증 후 적용한다. `verify`는 저장된 두 JSON 원본과 정확한 치환 결과 및 PNG 바이트일치를 재검사한다. `undo`는 현재 파일들이 이 변경 결과 그대로인지 먼저 확인한 후 JSON 백업을 복원하고 정확한 호환 PNG 두 개만 비재귀 삭제한다. 파일이 달라졌으면 중단한다.

재검사:

```powershell
node 'G:/somi/JO9sa/records/third-patch-approved-followups-20261026/images/apply-and-verify.cjs' verify
```

복구가 필요할 때만 같은 명령의 마지막 인수를 `undo`로 바꾼다. 개발 기록과 `before` 백업은 런타임 ZIP에 넣지 않는다. 별도 설치기/자동 백업/세이브 변환 기능은 제공하지 않는다.

`G:/Codex/tmp/third-patch-followups-images-20261026`의 생성 가능한 staging 네 파일과 빈 폴더를 검증 후 정확 경로 비재귀 삭제했다. `cleanup.json`에서 임시 루트 부재를 확인했다. 최소 원본 JSON 백업 두 개(합계 1,041바이트), 변경 명세·재현 스크립트·핵심 검증 기록만 보존했다. 커밋/푸시는 하지 않았다.
