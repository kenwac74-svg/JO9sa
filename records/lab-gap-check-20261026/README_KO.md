# 연구실 목록 공백 재점검

현재 WORK는 망각의 정수 뒤 빈 줄이 이미 제거된 상태이며 이번에는 실행 파일을 수정하지 않았다. 실제 설치 엔진에서 연구실 유무 두 경우 모두 검사했다. 글자26px, 항목 간28px, 마지막 카오틱 에센스 하단628px가 패널 하단632px 안에 들어간다. 첨부 화면의 큰 공백은 최신 WORK 출력과 다르지만 사용 중인 게임의 메모리상 QSP 판본은 확인하지 않았다.

재현: records/menu-private-fixes-20261025/native-inventory.cjs를 사용하되 temp task root만 G:/Codex/tmp/lab-gap-20261026으로 치환하고 현재 WORK QSP를 입력했다. 이어 tools/qa/run-client-smoke.ps1로 생성된 plan.json을 실행했다. 입력 QSP와 대표 세이브 SHA-256은 검사 전후 동일하다.

원본/배포/세이브 변경 없음. 커밋·푸시 없음. 진단 사본은 결과 추출 후 정리한다.
