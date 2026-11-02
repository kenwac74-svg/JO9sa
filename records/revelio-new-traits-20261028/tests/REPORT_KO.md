# 리벨리스·오베레그 신규 숨은 특성 표시 — 독립 native 검사

수정 전 실제 목록에서 숨은 산만함이 리벨리스 중에도 나오지 않는 기대 실패를 확인했다. 후보의 7개 표시 조건 수정 후 검사한 범위에서 같은 누락은 해결됐으며, 인물 보유값·영구 발견 기록·발견 및 효과 동작의 회귀는 발견하지 못했다. 이 테스트 작업은 WORK와 개인 세이브를 변경하지 않았다.

- 수정 전: `972d1b7a8719c9b44e6aca4bfaf5a6f73908240762ce65061a7d298d0aa82679`
- 검사 후보: `3fbdb2cca0e3eb2d4a70c2f9b442f2fb39bb756f1aefe6217cf8c10668f1106c`
- 제품 후보: 상위 폴더 `2026-10-28_revelio_new_traits.json`. `jo9_traits` 표시 7조건만 수정, 새 로케이션 없음. exact edit 재생 해시 일치 및 전체 역적용 바이트 일치를 독립 확인했다.

| 검사 | 실행 결과 |
| --- | --- |
| 수정 전 RED | 실제 `$func('jo9_traits','list','slave')`: known1·spell0은 산만함 표시, known0·spell0은 비표시, known0·spell1의 기대 표시가 `FAIL_REVELIO_HIDDEN_FOCUS_EXPECT_VISIBLE`로 실패. SAV의 보유값 -1, known0, spell1 확인. |
| 후보 표시 행렬 | 400조건 PASS. slave·assistant·room1·stock, 야심가/끈기/산만함/옹졸함/너그러움·구형 활동 fallback±·통합 활동±, known0/1×spell0/1, 0 및 비표준 미보유값 포함. |
| 목록·flag 연결 | 17조건 PASS. 실제 기존 전체 특성 빌더·stock 빌더·sidebar·확장 open/close·설명 metadata, 오베레그 실제 장착/해제 본문, 리벨리스 실제 시전 본문 및 원래 일일 reset/장착 reapply문 실행. 미발견 특성은 해제 후 숨고, known1은 계속 표시. |
| 인물 데이터 보존 | 위 연결 검사 전후 네 역할 각각 23묶음 전부 nonempty로 seed한 상태가 완전 동일. 이름·식별자·장비·기술·각종 카운터·known 등을 포함. 기존 repair는 canonical snapshot 전에 실행했다. |
| 자연·강제 발견/효과 | 수정 전과 후보 각 40조건 PASS. 칭찬 야심가, 반복 활동의 집중·활동성 발견, 기억 decay의 옹졸함, editor 및 activity_set, 학습·업무 효과. 네 역할의 최종 23묶음과 목록이 수정 전/후 동일. |
| 항상 표시되는 신규 특성 | 14분기×spell0/1, 버전별 28조건 PASS. 출력 전체가 수정 전/후 동일하고 보유값과 미보유 `jo9_meiki_state=0` 유지. |

실행 결과는 `red-results.json`, `matrix-results.json`, `integration-results.json`, `discovery-results.json`, `always-visible-results.json` 및 각 `.log`에 분리했다. 서로 겹치는 검사를 하나의 합계로 더하지 않았다. `SUMMARY.json`은 해시 및 항목별 요약이다.

`harness.cjs`는 이전 위탁 테스트의 합성 인물 seed·23묶음 canonical 비교·초기화 함수만 읽기 참조한다. 제품 메커니즘 호출은 이번 후보의 실제 본문이다. QSP 엔진은 WORK의 `engine/jack.exe`, 진단 실행본은 `G:/Codex/tmp/jo9-revelio-traits-tests-20261028`에서 실행했다.

실제 엔진이 만든 합성 SAVEGAME을 판독해 상태를 비교했으나 개인 세이브 LOADGAME이나 GUI에서 저장 후 다시 불러오기는 검사하지 않았다. CSS 화면의 시각적 배치, 전체 다음날 진행·지역 이동, 장기 플레이는 재현하지 않았다. 시전·reset·재적용문은 원문 그대로 고립 실행했다. 생성 확률과 효과 본문의 불변성은 전체 패치 역적용 바이트 일치로 확인했으며 통계적 추첨 실험은 하지 않았다.

정리 결과는 `cleanup.json`을 따른다. 경계·재파스·링크 검사를 거친 재생성 가능한 진단 QSP/계획 JSON/ini만 삭제하고, 합성 세이브·로그·스크립트·보고서는 보존한다. 원본·제품 WORK·다른 에이전트 폴더는 정리 대상에 포함하지 않는다.
