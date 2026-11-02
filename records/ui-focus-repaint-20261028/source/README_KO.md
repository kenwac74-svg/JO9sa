# D15 검은 잔상: baseline 화면 준비

fixture 하나만 준비하며 엔진을 자동 실행하지 않는다. 원래 `slave_stat`이 현행 도움말·색상·특성 전체보기 HTML을 생성한다. `jo9_traits_view`, `stats_layout`, `$addon`, `#help_msg`, `jo9_traits`의 본문과 CSS/JS는 원문을 유지한다.

실행 파일: `G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe`

작업 디렉터리: `G:/Codex/tmp/jo9-ui-focus-repaint-20261028/baseline`

인자: `"G:/Codex/tmp/jo9-ui-focus-repaint-20261028/baseline/focus-baseline.qsp"`

창 제목: **JO9 D15 포커스·재도색 QA baseline**

GOLD 합성 표본의 숫자·짧은 문자열을 prime한 뒤 실제 세이브를 로드하지 않는다. 대상은 age2로 고정한 성인 에게야이며 중앙 그림은 단색 SVG다. 원래 중앙 이미지 wrapper와 현행 CSS를 사용한다. 화면 표시는 준비 상태이며 최초 실행은 root의 Computer Use 관찰로 확인한다.

반복 관찰 순서:

1. 좌측 체력·지성·성격 등 등급 링크에 포인터를 올려 tooltip을 보고 클릭한다.
2. 원래 도움말을 닫은 뒤 포인터를 빈 중앙으로 옮기고, 방금 클릭한 글자/주변 배경의 검은 흔적이 남는지 본다.
3. 색상이 다른 특성을 차례로 클릭한다.
4. **노예의 특성** 제목을 눌러 전체보기를 열고 항목 선택·닫기·다른 속성 클릭을 반복한다.

QA 격리: `$newloc`의 계산은 생략하되 원래 특성 전체보기의 다시 열기 상태 기억만 유지한다. `$slave_price`는 계산하지 않고 primed 등급을 표시한다. `$slave_traits`는 XP/발견 갱신을 생략하고 기존 목록 HTML builder만 호출한다. 프로필 탭은0으로 고정한다. 교육·날짜·거래로 이어지는 주요 진입점6개는 프로필로 되돌린다. `$onnewloc`, `$ongload`, `$onobjsel`, `$counter`와 타이머는 끈다. 실제 게임·개인 SAV·records·배포본·엔진은 수정하지 않는다.

`content`, `css`, `fonts`, `json`은 WORK의 읽기 참조 junction이다. 전체 게임을 복사하지 않는다. 사용 중 WORK CSS/JS를 바꾸면 이 baseline도 달라지므로 먼저 관찰을 끝낸다. 엔진 대비 수정 후보나 장기 테스트는 준비하지 않았다. 재현되지 않더라도 관찰 결과 그대로 기록한다.

정리는 해당 QA 창을 닫은 뒤 [cleanup.ps1](./cleanup.ps1)을 실행한다. 스크립트는 절대 범위를 확인하고 junction 자체만 비재귀 제거한다. 알 수 없는 생성물이나 저장 파일이 있으면 보존하고 중단한다. 생성 fixture는 관찰 전이므로 현재는 정리하지 않는다.
