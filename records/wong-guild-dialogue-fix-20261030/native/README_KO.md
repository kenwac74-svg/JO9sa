# 웡 대사 수정 후보 실제 엔진 회귀 검증

현재 후보 SHA-256 `2b81e781d0ab56f10cb77aa340db27ee4dab7d707bafe857853ad600d474417e`를 대상으로 정상 항의 5사례와 재경고 결말 1사례를 실제 숨김 FastQSP에서 검증했다. 후보·WORK·기존 gold 세이브는 읽기만 했다.

| 사례 | 원래 평판 변화 | 대사 DOM | 결과 |
|---|---|---:|---|
| 질병 1건 | 50 → 40 | 129자 | 통과 |
| 질병 3건 | 50 → 20 | 143자 | 통과 |
| 첫 유충 감염 1건 | 50 → 0 | 171자 | 통과 |
| 첫 유충 감염 3건 | 90 → 10 | 177자 | 통과 |
| 질병·유충 동시 1건 | 100 → 10 | 177자 | 통과 |
| 유충 감염 재경고 결말 | 100 → 20 | 결말 52자 | 아래 fixture 보정 후 통과 |

정상 5사례는 방문 서술과 웡의 기존 항의를 모두 실제 `#text` 안에서 확인했다. 유충 관련 사례는 기존 `$text[3]`의 추가 안내도 포함했다. 모든 경우 clientHeight=scrollHeight=185px, clientWidth=scrollWidth=740px로 넘침이 없었다. 기존 질병·유충 카운터 0, 방문 가드 1, 필요한 재경고 플래그 1과 주요 이벤트 카운터 1도 확인했다.

재경고 결말은 원래 `$death`→`exit` 경로에서 day=0, 방출 안내와 Game Over를 실제 `#jo9_gameover_message`에 표시했다. 결말창 127px 높이에 넘침이 없었다. 이 경로는 원본대로 일반 항의 footer에 도달하지 않으므로 유충 카운터 1·방문 가드 0·이벤트 카운터 0이 남는 것까지 확인했다. 이 상태를 정상 항의와 같게 바꾸지 않았다.

처음의 재경고 진단은 timeout이었다. 실제 native 경계 로그를 좁혀 보니 진단용 sparse `primeState`에서 `$death`의 0번 동적 함수 대신 77자의 전투 대사가 들어 있었다. 원본 SAV의 DEATH[0]은 220자·줄바꿈 포함·day=0 및 `gt 'exit'`를 담은 정상 함수이고, EGEYA 별칭 대사는 원래 index 1의 77자다. `primeState`는 여러 줄 함수를 건너뛰면서 index 1 별칭만 복원해 배열의 첫 점유 위치가 달라질 수 있다.

따라서 재경고 단독 fixture의 Start에서만 원본 `gs '#dynamic'`을 다시 호출하고 `$death`가 원래 함수인지 검사한 뒤 실행했다. 후보나 제품 helper를 수정하지 않았다. 초기 실패는 `results.json`, 보정 후 성공은 `results-fatal-rehydrated.json`, SAV 구조 근거는 `save-death-metadata.json`으로 분리했다. 최종 검증은 이 보정된 fixture의 원래 동적 함수 경로이며, 기존 SAV를 native로 완전히 불러오는 별도 복원 과정까지 검증했다는 뜻은 아니다. 전역 변수 namespace 변경도 수행하지 않았다.

처음 6실행과 원인 경계 추적 3실행, 보정 후 재경고 1실행으로 엔진 실행은 총 10회다. 무사건 조건은 부모 작업의 정적 diff 검증 범위로 남겼다. 원본 처음 22줄과 실제 웡 사건·loop/footer·결말 흐름은 실행하고, 무관한 앞선 일일 사건만 명시적으로 건너뛰었다. OS 마우스는 사용하지 않고 실제 페이지의 DOM 콜백을 native EXEC/msg로 읽었다.

재현 스크립트: `native-regression.cjs <candidate.qsp> --run`, fatal 보정 단독 재현은 `--case=parasite-repeat-fatal --restore-dynamic`. 결과 판정은 `analyze-results.cjs`와 `analyze-results.cjs -fatal-rehydrated`, 요약은 `summarize-results.cjs`다. 원시 로그와 모든 기대 상태를 함께 보존했다.

임시 정리는 `cleanup-diagnostics.ps1`이 전용 `G:/Codex/tmp/jo9-wong-fix-20261030/native-regression`만 대상으로 한다. 정션은 대상 경로 검증 후 정션 자체만 제거하며, 부모의 before/candidate QSP와 release-run 폴더는 삭제하지 않는다.
