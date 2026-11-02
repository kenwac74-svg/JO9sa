# 전투 연출 repaint 분리 검증 계획

현재 FX 규칙은 두 종류이며 prefixed/표준 animation 선언 4개와 keyframes 블록 4개가 있다. 기존 native 측정에서 적 연출은 scale 행렬과 opacity가 실제로 변하고, 피격 연출도 opacity가 변했다. 현재 CSS의 해당 규칙이 동일함을 확인했다. 앞선 UI 치수 불변 PASS는 이번에 재발한 실제 화면 그리기 결함을 고쳤다는 증거가 아니다.

후보는 기존 이미지와 좌표를 유지한 정적 연출을 짧게 보였다가 visibility로 숨기는 방식이 검증하기 가장 단순하다. 투명한 피격색이 필요하면 고정 RGBA 배경을 사용하고 요소 opacity는 1로 유지한다. CSS animation/keyframes, transition, transform 및 will-change/filter 지정은 FX 범위에서 제거한다. PNG 스트립의 프레임 교체는 검증 상태가 더 늘고, animated PNG는 QtWebKit 지원과 재생 종료를 따로 확인해야 하므로 이번 최소 회귀검사의 우선 대안으로 삼지 않는다.

후보를 받으면 native 3조건만 실행한다. (1) 적 명중 (2) 플레이어 피격 (3) 동시 명중·피격 뒤 수명 만료 전에 실제 공통 렌더러를 한 번 더 호출하는 연속 2회다. 보이기 직후·종료 직전·종료 후에 animation-name none, transform none, transition-duration 0, opacity 1과 visibility 상태를 확인한다. 이미지 자산·정해진 좌표·색상·clip·pointer-events 및 명령/기술 링크 적중을 함께 검사한다. 두 번째 렌더링에서 첫 번째 타이머가 새 노드를 일찍 숨기지 않아야 하고, 두 번째 수명이 끝난 뒤 연출은 모두 숨김/제거되어야 한다. QSP 계산·분기는 교체하지 않고 진단 사본의 상태와 호출 시점만 준비한다. SAV는 쓰지 않는다.

이 검사는 해당 CSS/JS 트리거가 없어지고 수명 처리가 맞는지를 검증한다. 내부 compositor 레이어가 실제 0개인지 또는 Windows 화면 잔상이 사라졌는지는 DOM으로 판정하지 않는다. 화면 캡처 복구와 최종 paint 재현은 부모 작업에서 별도로 확인하며 다른 Win32 캡처 방법을 사용하지 않는다. 현재 단계는 계획과 기존 근거 정리뿐이며 새 native 엔진 실행이나 WORK 수정은 없다.
