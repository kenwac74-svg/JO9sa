# 내부 재현 순서

1. application.json의 recoveryArchive에서 baseline-c6ba9600.qsp를 이 폴더의 inputs/baseline.qsp로 복원한다. 이 입력은 해시 c6ba9600…0195e로 고정되어 있다.
2. 현재 환경의 대표 세이브를 inputs/state.sav에 복사한다. 원본 세이브를 직접 수정하지 않는다.
3. Node로 build.cjs를 실행한다. fragments/의 선별된 차이로 candidate.qsp, mods/, selection.json을 재생성한다. build는 기존 문자열 밖의 코드 및 키/태그/보간 변경을 거부한다.
4. Node로 prepare-focused.cjs를 실행한다. 게임의 json/config를 격리 폴더로 복제한다. 경로는 스크립트 상단의 repo/game 기준을 확인한다.
5. powershell.exe -NoProfile -ExecutionPolicy Bypass -File G:/somi/JO9sa/tools/qa/run-client-smoke.ps1 -Engine <현재 jack.exe> -Plan <focused/plan.json>를 외부 프로세스로 실행하고 종료 코드와 client-results.json의 9개 완료 마커를 확인한다.
6. docs/QSP_RELEASE_VALIDATION.md의 release-check를 candidate/baseline/이번 mods/state와 함께 실행한다. 실제 배포를 하지 않는 검사에는 mirror를 지정하지 않는다.
7. 실제 적용은 최신 Work 해시 재확인과 사용자 승인 범위 확인 뒤 apply_mods.ps1을 사용한다. 재현 도구 실행 자체는 적용 승인이 아니다.
8. 결과 보고서와 스크립트만 남기고 원본 보존을 검증한 후 재생성 가능한 진단 QSP·JSON 복사본·시험 빌드 사본을 정리한다.

소스 원본 11~14와 적용 전 QSP는 검증한 복구 ZIP에 보관했다. ZIP 전체를 게임 배포에 넣지 않는다. 입력/반환·호출·부작용·제거 영향은 MANUAL_KO.md, 미적용 수리는 FUNCTIONAL_CONFIRMATION_KO.md를 본다.
