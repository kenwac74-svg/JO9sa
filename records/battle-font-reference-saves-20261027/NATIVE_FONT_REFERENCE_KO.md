# 전투 글꼴·결과 배치 native 검증

CSS fa132498 후보를 QSP 7c366e1a·로그 JS b4656fe7과 함께 일반 전투/승리/KO패배 3조건에서 확인했다. 모두 이름은 26px, 그 외 속성·행동·기술·효과·결과 제목은 20px 경기천년제목 Medium, 기록은 Sandoll 미생 23px·normal 행간이었다. 결과 로그는 763px 전체 폭이며, 원본 특수 이미지와 thumb는 각각 좌우 하단 영역에 들어가 실제 이미지가 로드되고 thumb의 원본 EXEC 복귀 링크가 적중했다. 679자의 긴 스트레스 기록은 공백까지 보존됐고 진행은 172/384px에서 scrollTop 212, 결과는 150/384px에서 234로 최하단에 이동하여 마지막 글자가 표시됐다. 양쪽 이펙트 활성 중 clip·명령 hit도 통과했다. source 확인상 캣파이트 시작과 투기장 시작은 같은 전투 렌더러를 사용하고 공통 라운드 종료가 같은 결과 렌더러로 이동하므로 이 CSS가 두 경로에도 적용된다.

실제 숨김 native 엔진의 DOM·글꼴·이미지 크기·hit-test이며 수동 플레이나 실제 복귀 클릭 완료를 뜻하지 않는다. 각 적 슬롯에 원본 공격 문구 3줄을 반복해 용량을 시험했으며 계산·분기는 바꾸지 않았다. 원문 비교용 진단 JS 한 줄 외 후보 바이트와 렌더러 본문을 보존했다. SAV는 새로 작성하지 않았고 대표 세이브는 읽기만 했다. 입력 QSP·세이브 해시 불변, WORK·배포 미수정이다. 원시 결과는 native-font-reference-results.json, 재현은 scripts/battle-font-reference-native.cjs이며 시험 세션은 exit 0으로 종료됐다.

추가 최대 7행 스트레스 검증도 같은 CSS로 PASS했다. 우측 기술 패널은 20px/25px, clientHeight=scrollHeight=360이며 실제 내용은 11줄이었다. 7개 기술명은 각각 한 줄이고 3줄로 감기는 명칭은 없었다. 전체 glyph와 7개 링크가 패널 안에 있고 모든 링크가 적중했다. 이 표본에서는 행간을 더 줄일 필요가 없다. 원시 결과는 native-seven-weapon-results.json, 재현은 scripts/seven-weapon-reference-native.cjs이다.

최종 정렬 후보 a6e5032d는 앞선 fa132498에서 기록의 text-align 두 선언만 바뀌었음을 파일 대조로 확인했다. 따라서 앞선 3조건과 7행 용량 결과를 유지하고 긴 승리 1조건만 추가 실행해 PASS했다. 원래 font[color] 속성·문구 순서가 유지되며 보라/초록/빨강이 각각 선언한 RGB로 렌더됐다. 이 표본에는 파랑이 없으므로 파랑 실행 검증까지 주장하지 않는다. 기본 텍스트색은 rgb(37,25,8)로 별도 확인했다. 16개 BR 문단 모두 왼쪽 x259에서 각 한 줄로 표시됐고, white-space:normal로 필요한 경우 자연 줄바꿈을 허용한다. 원문 679자·세로 스크롤·원래 thumb 링크·이펙트 분리도 유지됐다. 원시 결과는 native-log-alignment-results.json이다.
