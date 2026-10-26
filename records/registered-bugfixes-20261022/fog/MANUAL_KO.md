# 안개 동료 전투 행동력 정산 — 2026-10-22

원인: `jo9_fog_relay`의 기존 정산은 남은 전투 지구력을 행동력으로 환산한 뒤 현재 행동력을 상한으로 사용했다. 행동력 5인 출전자가 지구력 75 이상으로 끝내면 행동력이 5로 유지되었다. `начать_бой`는 동료의 전투 지구력을 `50 + energy*5`, 전투 특화 시 `75 + energy*5`로 시작하므로 쉬운 승리에서 이 경로가 생긴다.

## 수정 조각

`edits.json`은 `jo9_fog_relay.body`의 독립 수정 2개이다. 원본 WORK는 수정하지 않았다.

- `FOG_ENERGY_MIN_COST_SLAVE`: 후보 본문 78~81행, 실행식 80행.
- `FOG_ENERGY_MIN_COST_ASSISTANT`: 후보 본문 117~120행, 실행식 119행.
- 기존 `min(환산값, energy_before)`를 `min(환산값, energy_before - 1)`로 바꾼다. 실제 정산 출전자에게 최소 1 행동력 비용을 보장하며, 원래 환산값이 더 낮으면 그 큰 피로 손실을 그대로 적용한다.
- 예: 5/지구력75 → 4, 3/지구력55 → 2, 5/지구력25 → 0, 1/지구력1 → -4.

기존 `settled` 가드 뒤의 생존 분기만 바꾼다. 기존 `actor` 값 1/2가 대상을 정한다. 반환값을 추가하지 않으며 새 로케이션·함수·영구 키·세이브 마이그레이션은 없다. 기존 임시 `energy_before` 키를 그대로 사용한다. 반행동·칼로리·별도 체력 차감을 추가하는 `$slave_energy_drop`/`$assistant_energy_drop` 호출은 넣지 않았다.

## 호출·의존성·제거 영향

- 안개 메뉴 `#options` → `jo9_fog_relay, begin` → `начать_бой` 무기 선택·전투 초기화.
- 패배 `конец_боя` → `jo9_fog_relay, handoff` → `settle` → 주인공 무기 선택. 기존 `settled=1`을 유지하므로 후속 finish/settle가 재차 차감하지 않는다.
- 종료 `выход_из_боя` → `jo9_fog_relay, finish` → `settle`. 주인공의 원래 정산은 `combatant=0` 분기이고, 동료 승리에서는 통과하지 않는다.
- `close/reset`과 `$combat_variable_reset`은 기존 안개 임시 상태를 지운다. 무기 선택 진입·전투 전 reset에는 비용을 새로 부과하지 않는다.
- 기존 잔여 지구력 환산, `здоровье_игрока`, `дух_игрока`, `jo9_fog['actor'/'active'/'settled'/'energy_before']`, `$dyn_calc_slave_attrs`, `$replace`에 의존한다. 사망 시 기존 `$clear_slave_instance`가 실행된다.
- 두 표식 구간을 기존 식으로 복원하면 구문·호출 구조는 유지되지만 행동력 무소모 결함이 돌아온다. `settled` 가드나 정산 호출을 제거하면 중복 비용 또는 정산 누락이 생길 수 있다.

## 검증

- 사전 WORK SHA-256: `c6701e3ab130b1a762d0b1a523d52cd53cee846f71c3d7899a4c369389aa853d`.
- 독립 후보 SHA-256: `e340ea08cf5f0278aeadb98e9f4c592db77909c43f9995fcb13bf36503e2b169`.
- 실제 설치 엔진 `game/engine/jack.exe`로 baseline의 노예/조수 최소비용 기대 검사 2개가 모두 FAIL한 뒤 후보 18개 시나리오 PASS를 확인했다. 보고서: `results-baseline.json`, `results-candidate.json`.
- 후보에는 역할별 행동력1~5 × 지구력20경계값의 총200개 조합과 각 조합의 반복 finish/settle 검사가 포함된다. 원래 exit 경로, 주인공 단독 전투 비용, weapon-entry/reset 무소모, 교대1회 정산·적상태 보존, 기절·사망·승리 사기 스냅샷 보존도 검사했다.
- `patch-validation.json`: QSP 262개 로케이션, 바이트 왕복, 줄/주석 경계, 정확 재생, 재적용 바이트 동일 PASS. 본문 변경 로케이션은 `jo9_fog_relay` 하나다. WORK 입력 해시는 baseline 검사 전후 동일했다.

재실행: `node tests.cjs <검사할QSP절대경로> <baseline|candidate|final>` (`baseline`은 결함 재현 2개만 실행). Node 경로는 `C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe`이다. 검사기는 해당 label의 `native-*`에 진단 QSP를 만든다. 기존 `run-client-smoke.ps1`이 숨김 진단 PID만 종료한다.

이 결과는 안개 행동력 수정의 구성요소 검사다. 진단본에서만 helper의 예상 모달 메시지를 `*pl`로 바꾸어 계속 검사하며, 무기 선택 화면 경계와 close 직후에 완료 검사를 삽입한다. 실제 GUI 클릭·화면 배치, 전투 피해/밸런스/전리품 전수검사, 저장 UI 불러오기는 검증하지 않았다. 전체 통합 후보의 필수 9경로 출고 검사는 메인 작업에서 별도로 실행해야 한다. 원본 WORK/QSP·배포본·저장소는 직접 수정하지 않았고 커밋·푸시하지 않았다.

큰 진단 QSP 사본과 `candidate.qsp`는 재생성 가능하다. 메인 검증 완료 후 이번 `fog/native-*/*.qsp`와 독립 후보만 정리하고, 검사 스크립트·JSON 수정 조각·해시·결과·로그·이 설명서는 남긴다.
