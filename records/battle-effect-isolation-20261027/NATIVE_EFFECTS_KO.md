# 전투 이펙트 격리 native 검증

대상 후보: QSP `7c366e1ae35a5922e32052847bceb28737ddab32c3861b19bbefd7661b45c2b7`, base.css `f8844167776c4c98ea93966f5743f241c2e832dbd40f4043bb2ace37f21d9c0c`.

## 결론

- 현재 기본 글꼴 수정본에서는 이펙트 유무 때문에 프레임·패널·로그의 좌표, 글꼴 또는 스크롤이 달라지는 현상을 재현하지 못했다. 이는 원본 관찰과 후보 모두에 해당한다. 따라서 후보를 해당 시각 증상의 직접 원인 수리로 단정하지 않는다.
- 기존에는 이펙트가 전투 루트의 직접 자식이었다. 전용 이펙트 레이어를 요구하는 새 분리 계약은 baseline 4조건에서 EXPECTED_FAIL, 후보 5조건에서 PASS였다. 루트 자체의 기존 overflow:hidden과 전용 이펙트 레이어 부재는 구분했다.
- 후보의 명중·피격 연출은 전용 레이어 안에서 실제로 진행된다. 25/120/350ms에는 opacity가 양수이고, 650/1100ms에는 0이다. 전용 레이어와 모든 UI 패널의 기하는 전 구간에서 변하지 않는다.
- 기본 4조건, 실제 안개경계 배경 1조건, 승리 결과와 양쪽 이펙트 1조건으로 총 6개 native 실행이 완료됐다. 추가 실행 중인 시험 엔진은 없다.

## 확인 범위

원본 전투 중 렌더러 `боевой_интерфейс`와 원본 결과 렌더러 `конец_боя`를 호출했다. 실제 HP·인물·메뉴·로그 상태는 고정하고, 이전 HP를 기억하는 표시 전용 tracker만 달리해 이펙트 없음/적 명중/플레이어 피격/양쪽 효과를 비교했다. 게임 분기나 계산 본문을 교체하지 않았다. 결과 화면의 원본 복귀 링크 `EXEC: gt "выход_из_боя"`는 변경하지 않았으며 이동을 실행하지 않았다.

후보는 `#jo9_battle_fx_layer`가 항상 전투 루트의 자식으로 하나만 존재하며, 루트와 같은 사각형을 사용한다. 레이어는 absolute, overflow:hidden, pointer-events:none, transform:none이고 모든 FX는 해당 레이어 소속이다. 명령·기술·결과 thumb·로그 다음 링크의 중앙점에 elementFromPoint를 적용하여 연출 중에도 해당 링크가 적중함을 확인했다.

승리 결과는 3페이지짜리 긴 로그를 사용했다. 모든 5시점에서 thumb와 다음 페이지 링크가 레이어에 가려지지 않았다. 이번에는 실제 복귀 동작이나 페이지 전환을 실행하지 않았다. 원본 callback 실행과 페이지 왕복·문자 보존은 앞선 `ui-live-consolidation-20261027/battle-font-native-results.json`의 별도 검증 범위이다.

대표 저장값의 `$bg['edge_patrol']='edge_of_mists1'`을 그대로 사용한 실제 안개경계 분기에서 `content/pic/bg/edge_of_mists1.png`가 795×596으로 로드됐다. QA용 전투 배경을 이 조건에 강제하지 않았다.

config.xml은 원본 UTF-16LE BOM FF FE를 바이너리 복사했고 실제 viewport는 모든 조건에서 1280×800, 문서 스크롤은 (0,0)이었다. 원본 세이브·입력 QSP 해시 불변을 확인했다. 운영 WORK 및 배포 폴더는 이 검사에서 수정하지 않았다.

## 한계

이는 숨김 native 엔진의 실제 QSP/QtWebKit DOM 측정이며 사용자의 직접 플레이나 CUA 수동 클릭 검증이 아니다. 별도의 OS 합성·다시 그리기 잔상까지 없음을 증명하지 않는다. 제공된 스크린샷 파일의 생성/수정 시각 15:59:58은 기본 글꼴·스크롤 수정 WORK 반영 18:09보다 앞선다. 파일 시각만으로 촬영 시각을 확정하지 않으며, 예전 글꼴 화면과 최신 이펙트 격리를 구분해야 한다.

## 재현

`node records/battle-effect-isolation-20261027/scripts/battle-effect-native.cjs --candidate <candidate/jack.qsp> --game <candidate> --out <disposable-output> --run`

기록: `baseline-observation-results.json`, `baseline-contract-results.json`, `candidate-native-results.json`, `native-effects-summary.json`. 실제 측정치 원본은 candidate-native-results에 보존했다. 재생성 가능한 시험 QSP·JSON·리소스 정션의 정리는 부모 작업에서 수행하며, 정션의 WORK 대상을 따라 삭제하지 않는다.
