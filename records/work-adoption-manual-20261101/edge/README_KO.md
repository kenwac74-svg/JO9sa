# 수동 전환 수정의 추가 경계 검사

준비 완료: 5개 엔진 케이스, 명시적 검증 49개. **엔진 실행과 통과 판정은 아직 하지 않았다.** 상위 작업이 엔진을 직렬로 실행한다.

- 원본 WORK SHA256: `78835089f1dc8d0d5272f991926f35fa40e7e26dede5970a3fc03612967c130d`
- 메모리의 mode3 후보 SHA256: `05f5726d813a883805c81c794f08de129c047c04b030ee6e0c37c27f5d8735ef`
- 실행 계획: `G:/Codex/tmp/work-adoption-edge-20261101/plan.json`
- QSP 총량: 848,750바이트. `Start`와 실제 `interior_change` 전체 본문을 담은 2개 로케이션의 격리 파일 5개로 구성했다. 49MB 원본 세계를 중복 저장하지 않았다.
- 이미지: 해당 G 임시 폴더 안에 만든 소유권이 분명한 1px 파일만 사용하며 외부 링크는 없다.

| 케이스 | 검증 수 | 확인 내용 |
| --- | --- | --- |
| selected-deleted | 7 | 선택된 C의 실제 파일이 없는 상태에서 mode2의 이전 경로 식별, A 복귀, 다음 B 전환 |
| a-absent | 8 | A 파일 없음과 B 조건 불충족이 겹칠 때 첫 유효 C로 복귀하고 C/D 순환 |
| registered-id | 9 | 실제 beach 등록 구간의 기존 ID1 보존, runtime ID10002로 중복되지 않음, mode2·mode3 호환 |
| overlay-last-image | 16 | 실제 이미지 출력 후 앞에 같은 B 속성을 둔 레이어 추가, 실제 clean_toggle·jo9_toggle로 마지막 그림만 전환하고 overlay 1개·UI 복원 보존 |
| condition-became-eligible | 9 | C를 보여 주던 중 B도 조건을 만족했을 때 수동 전환은 D로, 새 장면 출력은 낮은 번호 B로 선택 |

삭제 관련 두 케이스는 파일이 사라진 직후의 이미 출력된 HTML·저장 선택을 진단 Start에서 구성한다. 파일 없음은 실제 엔진의 존재 검사로 확인한다. 검사 중 운영 파일을 삭제하거나 외부 프로그램으로 파일을 건드리지 않는다. 기능 함수들은 교체하지 않았다.

엔진 실행은 상위 작업의 `run-client-smoke.ps1`에 위 계획을 전달한다. 엔진 실행이 끝나면 `node native-edge.cjs collect`로 생성된 진단 SAV와 client 결과를 읽어 `native-edge-report.json`을 만든다. 결과 수집 후 `node native-edge.cjs cleanup`은 소유 폴더·링크 부재를 확인하고 필요한 JSON·로그를 남긴 뒤 재생성 가능한 QSP·진단 SAV·1px 사본을 정리한다. 이 스크립트에는 엔진 실행 명령이 없다.

별도 회귀 단위 검사 `mode3-regression.test.cjs` 1건은 통과했다. 조건 저장·다른 가족 추가·기존 조건 변경·가족별 제거·최종 제거를 거치면서 명시적 mode3 호출과 기존 registry가 그대로 남고 마지막에는 기본 본문과 바이트 단위로 같아지는지 검사한다. 생산 테스트나 소스를 변경하지 않았다.
