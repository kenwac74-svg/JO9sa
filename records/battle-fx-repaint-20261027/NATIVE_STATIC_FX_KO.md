# 정적 전투 연출 검증

CSS 9032c426·JS 631f549e 후보에서 원본 전투 renderer의 적 명중/플레이어 피격 2조건은 각각 500/600ms 수명까지 PASS했다. animation-name/transform/transition은 none, opacity는 1이며, slash 500×460의 좌표·자산, 고정 RGBA 피격색, clip·클릭 통과, 로그 원문·강조색·Sandoll23과 이름26은 유지됐다. 전투 FX keyframes 블록도 0개다. 동시 표시 후 300ms에 DOM root를 clone으로 교체하고 동일 후보 JS 바이트를 재실행한 별도 단위 검사 역시 PASS했다. 이전 root 타이머가 새 root를 일찍 숨기지 않았고 새 노드는 자신의 500/600ms에 숨겨졌다. 같은 새 노드에 JS를 다시 실행해도 수명이 연장되지 않았다. 최종 묶음 native-static-fx-final-results.json의 PASS 범위는 이 두 초기 renderer 검사와 DOM 범위 단위 검사로 한정된다.

QSP 두 번째 renderer 호출은 직접 gs/gt 및 counter 진단 경로에서 모두 첫 phase PASS 후 completion 전에 엔진이 종료되어 미검증으로 남겼다. 각 runner 결과는 각각 약 13.7/14.0/13.3초이며 native OS 종료 코드는 기존 runner가 수집하지 않았다. 이 경로는 제품 회귀로 단정하지 않으며 실패 원본을 별도 보존했다. 실제 게임 링크의 재렌더·물리적 프레임 겹침은 부모의 독립 창 실측 범위다. DOM 기하 불변이나 CSS 트리거 제거를 실제 paint 완치 또는 GPU/compositor 레이어 0개라는 증거로 쓰지 않는다. SAV는 쓰지 않았고 원본 QSP·대표 세이브 해시는 보존했다.

시각 비교용 visual-animated-baseline은 6초 무한 animation, visual-static-candidate는 visibility 강제 유지라는 진단 변경이 있다. 이는 화면 비교를 위해 별도로 정지시킨 장면이며 정상 수명 검증을 대체하지 않는다. 두 visual.qsp에는 자동 callback·MSG가 없고 생성만 했으며 부모가 독립 창에서 실행한다. 재현은 scripts/battle-static-fx-native.cjs의 단독 --case enemy-static/--case player-static과 scripts/battle-static-fx-dom-race.cjs, 시각 준비는 scripts/make-static-fx-visual.cjs이다. 모든 본 에이전트 소유 native 세션은 종료했다. 부모 소유 시각 시험창은 종료하지 않았다.
