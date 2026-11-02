# 전투기록 세로 스크롤 검증

QSP 7c366e1a는 그대로 두고 CSS 6441512d·JS b4656fe7 후보를 실제 native 엔진의 원본 전투/승리 렌더러에서 3조건 검증했다. 짧은 기록 91자는 172/172px·scrollTop 0이라 불필요한 스크롤이 없었다. 5적 진행 259자는 172/196px에서 scrollTop 24, 좁은 승리 기록 259자는 150/300px에서 scrollTop 150까지 이동하고 마지막 글자가 패널 안에 보였다. 모든 조건에서 JS 실행 전후 textContent가 공백까지 정확히 같았으며 페이지 버튼은 없었다. 행동·무기 패널은 hidden을 유지했고 양쪽 이펙트 활성 중에도 명령·기술·승리 thumb가 적중했다. 기존 hidden·3페이지 native 측정은 새 계약의 EXPECTED_FAIL 근거로 재사용했다.

이는 숨김 QtWebKit native DOM 검증이며 수동 플레이나 마우스 휠 조작 완료를 뜻하지 않는다. 스크롤 이동은 DOM scrollTop으로 확인했다. 엄격 원문 비교를 위해 시험 사본 logJS 앞에 textContent 캡처 한 줄만 붙였고, 후보 JS 바이트와 QSP 렌더러 본문은 보존했다. 원본 세이브·입력 QSP 해시 불변이며 WORK·배포 폴더는 이 검사에서 수정하지 않았다. 시험 프로세스는 runner 종료로 정리됐다. 재현 스크립트는 scripts/battle-log-scroll-native.cjs, 원시 결과는 native-scroll-results.json이다.
