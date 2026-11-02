# 전투 결과 좌우 배경 native 검증

CSS 4121a217 후보를 QSP 7c366e1a·JS b4656fe7과 함께 승리/KO패배 두 결과에서 검사해 2/2 PASS했다. 결과 root의 ::before/::after는 각각 (0,440,242×360)/(1037,440,243×360), absolute/z-index 0/pointer-events none이며 기존 bg_stat.png가 실제 1280×800으로 로드됐다. 원본 자산 SHA-256은 d400d771005197c19c92d5e3f2abce7520f445b4b0b97315bf50f2fe8ff486b1이다. 기존 로그 763px 폭·Sandoll23/정보20/이름26·왼쪽 정렬·원문 679자·강조색·최하단 스크롤·원본 thumb 링크 hit·FX 격리는 모두 유지됐다. 승리 표본의 로그 전후 치수, 좌우 패널, 결과 아이콘·제목, 이름·정보 글꼴, 색상·문단 시작 데이터 7개 구조는 앞선 a6e5032d 결과와 정확히 일치했다.

이는 실제 숨김 QtWebKit 엔진의 DOM/CSS·자산 로드·hit-test 검사다. pseudo의 사각형은 계산된 CSS 좌표와 크기이며 전체 데스크톱 캡처나 사용자 눈으로 확인한 최종 미감까지 검증했다는 뜻은 아니다. SAV는 작성하지 않았고 원본 대표 세이브와 입력 QSP 해시는 보존했다. WORK·배포는 이 검사에서 수정하지 않았다. 시험 세션 75816은 exit 0으로 종료됐다. 원시 결과는 native-side-skins-results.json, 재현은 scripts/battle-result-side-skins-native.cjs이다.
