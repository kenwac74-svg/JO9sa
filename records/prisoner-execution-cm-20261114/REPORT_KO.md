# 죄수 처형 CM 누락 수정

경로 menu_executeprisoner=1485 → 확인 승인 14850 → prisoner_torture의 $special_part → prisoner 삭제. 일반 execution 경로의 기존 CM −1을 거치지 않아 누락되어 있었다. 처형 전 죄수 상태가 no_slave보다 클 때만 기존 half-point helper에 −2를 전달해 CM −1로 적용한다. 취소·빈 죄수·반복 삭제 후에는 차감하지 않는다. 다른 고문 관람·가격·보상·세이브 구조는 그대로다. helper의 매력 재계산도 기존 규칙대로 따른다.

패치 PRISONER_EXECUTION_CM_20261114. 제거 시 추가한 3줄만 제거하며 일반 execution 기존 감소는 유지해야 한다. 실제 UI 전체 경로는 사용자 확인 대기, 지정 상태 네이티브 검사와 패치 구조 검사는 별도 기록한다.
