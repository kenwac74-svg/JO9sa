# 내부 재현

복구ZIP의 baseline-995cd980.qsp를 inputs/baseline.qsp로, 현재 대표 세이브의 복사본을 inputs/state.sav로 준비한다. 원본 게임과 세이브를 입력으로 덮어쓰지 않는다.

1. Node로 format-regression.cjs inputs/baseline.qsp format-baseline.json 실행: 실패6개가 맞는지 확인한다.
2. prepare-native.cjs baseline 후, powershell.exe -File tools/qa/run-client-smoke.ps1 -Engine <jack.exe> -Plan <baseline-native/plan.json> 실행: 두 경로가 MILK_VALUE_MISMATCH/QUINTA_BAD_COLOR로 실패해야 한다. 다른 오류·시간초과는 재현 성공이 아니다.
3. build.cjs로정확수리후보/이번mods를재생성한다. format-regression.cjs candidate.qsp format-candidate.json은6개모두통과해야한다.
4. prepare-native.cjs candidate를실행하고동일외부powershell호출로candidate-native/plan.json을검사한다. 두경로완료마커가필수다.
5. docs/QSP_RELEASE_VALIDATION.md에따라이번baseline/mods/candidate/state로release-check를실행한다. 현재Work해시다르면무조건덮어쓰지말고재검토한다.
6. 진단QSP/JSON복제/시험사본은복구와핵심기록보존검증후정리한다. 이재현은새적용·배포승인이아니다.
