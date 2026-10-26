# 특성·관계 실제 엔진 플레이 검사

현재 WORK a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a 격리 사본을 실제 설치 FastQSP로 새로 실행했다. 20/20 경로가 완료표식까지 도달했다. 원래 메뉴/GT/콜백을 유지한 UI 흐름이며 기존 helper 시험의 재실행으로 집계하지 않았다. 게임·Full·원본 세이브·ZIP 수정과 커밋/푸시는 없다.

| 기능 | 상태 | 직접 실행 |
|---|---|---|
|F07|PASS_REPRESENTATIVE_PLAYER_FLOW|relation-home, relation-relation|
|F08|PASS_REPRESENTATIVE_PLAYER_FLOW|nature-eligible, nature-ineligible|
|F15|PASS_REPRESENTATIVE_PLAYER_FLOW|versatile-new, versatile-old, versatile-missing|
|F16|PASS_REPRESENTATIVE_PLAYER_FLOW|slave-short, slave-overflow, assistant-short, assistant-overflow, room-overflow|
|F28|PASS_REPRESENTATIVE_PLAYER_FLOW|slave-short, slave-overflow, assistant-short, assistant-overflow, room-overflow|
|F29|PASS_REPRESENTATIVE_PLAYER_FLOW|merge-slave, merge-assistant, merge-nature-free|
|F31|PASS_REPRESENTATIVE_PLAYER_FLOW|supplements-description|
|F05|PARTIAL_PLAYER_FLOW_OTHER_TRANSLATION_SITES_NOT_RUN|disabled-choices, dance-max-warning|
|F32|PASS_LINK_MSG_CLOSE_AND_RESTORED_HIT_TEST|master-question|
|F17|REPRODUCED_UI_OVERFLOW_NOT_FIXED|essence-geometry|

카오틱 에센스 재고행이 종이 하단을 24px, 하단 정보영역을 14px 침범했다. 원본 CSS/폰트에서 행 y630~656, 종이하단632, 정보시작642다. 구매/사용 결과와 구분하며 수정하지 않았다.

관계01/05는 원래질문과6페이지 forward를 각각3회 반복했다. 0ID는 연애확정으로 바뀌지 않았고, 양수ID의 마지막 핵심답변은 서로 다른 문장3개였다. 노예근성은 적격/부적격 생성 뒤 실제 경매즉시구매250스파크→영입→시내복귀까지 확인했다. 다재다능은 원래 프로필 갱신에서24기술A 신규획득19→20과 표시등급상승, 기존보유/1기술미달/재조회 보존을 확인했다.

특성전체보기는 노예/조수의 짧은목록·넘침목록과 개인실의 실제 portrait브리지에서 제목→3열→강한복종심→하단설명→닫기→원문복원을 실행했다. 개인실 종료에서 원래 주노예 이름/ID를 복원했다. 구특성의 긍정우선 정리는 원래 프로필 갱신에서 확인했으며, 과거긍정끼리동시보유와 무관한값은 유지됐다.

F05는 일부 실제 동선만 검사했다. 개 미보유 회색메뉴와 취소, 무용최대숙련도 한국어 경고/MSG닫기는 확인했다. 거미·바다촉수 미보유 분기는 원래$newloc가 dungeon1이면보유1로복원해 정상진입으로 도달하지 못했으며, 검사기를 바꿔 도달한 것으로 꾸미지 않았다. 이름입력/동의ACT/의뢰Back/흡혈조건/다른Tip은 미검이다.

나노분자 설명은 원래 보조식품 체크박스를 눌러 실제 하단 문장과 일일1스파크 문구를 확인했다. F32의 도움말 결과와 실제닫기 로그는 RESULT.json의 master-question 및 evidence/master-question.log를 따른다.

실제 마우스·기존파일의 메뉴Load/엄격CRC·모든 장기육성/특성조합·모든 해상도의 무결함을 주장하지 않는다. 상세 기능별 한계와 원래콜백/관찰기 경계는 RESULT.json에 있다.

재현: 같은 a70b WORK가 있는 상태에서 node playtest.cjs overview/merge/versatile/relations/acquisition/language/misc --run을 각각 실행한다. G:/Codex/tmp 작업폴더에만 진단자료를 만들며 다른버전이면 중단한다. --case=room-overflow 같은 개별선택도 가능하다. 컴퓨터사용과 물리클릭은 root담당으로 남겼다.

기존 실패시도는 진단JS재렌더 반복, 무조건GT 뒤 관찰기, 탭번호/전용forward이미지/개인실portrait진입 및 원래 시설갱신 조건을 잘못 가정한 검사기 문제였다. 원인 대조 후 검사기만 보정했다. 게임 코드의 신규 확정 실패로 집계하지 않았다.
