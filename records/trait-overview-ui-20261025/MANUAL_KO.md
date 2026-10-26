# 기존 UI 기반 특성 전체보기

사용자가 승인한 2026-10-25 시안의 구현이다. 새 슬롯 획득 제한·특성 삭제·칭호 획득 규칙은 이 패치에 포함하지 않는다.

## 화면과 사용

노예/조수 프로필의 기존 제목은 검정 밑줄 링크다. 제목을 누르면 기존 전공 조건보기의 양피지와 프레임 안에 전체 목록이 나온다. 1열을 위에서 아래로 채운 다음 2열로 이어지며 3열은 칭호 전용이다. 상태는 먼저, 나머지는 원래 목록의 상대 순서를 유지한다. 좌측은 분류 제목을 추가하지 않는다. 글꼴과 색은 기존 목록을 보존하고, 예전 전체 축소 래퍼만 제거해 기본 글꼴을 사용한다.

실제 글자 높이·줄바꿈이 남은 좌측 공간을 넘을 때만 아래에 파란 밑줄 전체보기 링크를 표시한다. 넘친 행을 반으로 자르지 않는다. 목록이 짧으면 하단 링크가 없으며 제목으로 전체보기를 연다. 기존에 많이 보유한 특성은 지우지 않고 중앙 열 안에서 모두 확인할 수 있다. 중앙 열의 높이를 넘는 기존 보유자는 해당 열을 스크롤한다.

특성·상태·칭호를 누르면 기존 하단 설명 영역에 설명이 나온다. 기본 속성·등급 도움말은 원래 엔진 MSG 경로를 유지한다. 실제 프로필 새로고침이 있는 도움말에서만 같은 인물의 전체보기를 한 번 복원한다. 중앙창 닫기는 원래 인물 화면으로 돌아오며 하단 원문을 복원한다.

## 변경 파일과 호출 관계

- jack.qsp: slave_stat, assistant_stat의 제목·목록 출력과 하단 설명 구간만 연결했다. jo9_traits에 기존 설명을 그대로 반환하는 text 모드를 추가했으며 기존 describe 호출은 계속 MSG를 띄운다.
- 새 로케이션 jo9_traits_view: sidebar(role, raw_list)는 이미 생성된 목록 HTML을 읽고 기존 설명 메타데이터를 만든다. 기존 특성 생성·발견·목록 빌더를 다시 실행하지 않는다. open, close, info(index)는 현재 main HTML과 $info_text만 바꾸며 다른 로케이션으로 GT하지 않는다. remember는 기존 도움말의 프로필 새로고침 뒤 UI를 복원한다.
- content/js/jo9_traits_view.js: 설치 엔진에 맞춘 ES5다. 표시된 행만 파싱하고 상태 우선 정렬·3열 배치·실제 넘침 측정·링크 연결을 담당한다. 발견되지 않은 저장 특성을 조회하거나 특성 효과를 변경하지 않는다.
- css/jo9_traits_view.css: 기존 page_blank.png·닫기 아이콘을 재사용한다. 기본 base.css와 상단 속성 배치는 수정하지 않는다. 엔진 __message__가 중앙창 위에 표시되도록 레이어를 지정한다.

QSP/JS/CSS는 함께 필요하다. JS 로딩 전에는 원래 목록이 보이며 준비 후 새 표시로 전환한다. 코드를 제거할 때는 선언형 패치의 제목/설명 연결과 helper를 함께 되돌린다. CSS·JS만 빼면 전체보기 기능이 완성되지 않는다. UI 표시에 쓰는 $jo9_tv_reopen_key는 한 번만 소비하는 전역 UI 문자열이며 세이브에 직렬화될 수 있다. 인물 저장 필드나 이력은 추가하지 않는다. 기존 세이브의 특성·상태·인물 데이터는 변환하거나 삭제하지 않는다.

## 검증과 한계

결과는 release-report.json, native-focused-results.json, browser-results.json, native-dom-results.json을 함께 본다. 실제 엔진 콜백·개인실 인물 복원, 브라우저 장문/기존 초과 보유, 실제 QtWebKit 스크립트 및 메시지 표시 검사는 서로 다른 검증이다. 전체 게임의 모든 동적 분기나 모든 기존 세이브의 GUI 로드를 증명하는 보고서가 아니다.

QtWebKit의 전역 div display:table 규칙이 중앙창과 좌측 높이를 늘리는 문제는 이 프로필용 CSS에서만 display:block으로 명시해 해결한다. 기존 메시지 닫기 동작은 유지한다. native-message-results.json은 실제 엔진 MSG와 원래 api/closemsg 링크의 클릭·복귀를 따로 확인한 결과다.

임시 진단본을 정리한 뒤 재현하려면 기록의 scripts/application.cjs restore-diagnostics로 압축 원본과 선언형 패치에서 격리 후보를 정확하게 복원한다. WORK에는 쓰지 않는다. 이어 scripts/focused-native.cjs, scripts/browser-qa.cjs, scripts/native-dom.cjs --run, scripts/native-dom.cjs --run --messages로 검증 자료를 다시 만든다. 재현 전 같은 작업 임시 폴더가 남아 있으면 스크립트가 중단하므로 먼저 내용과 보존 필요성을 확인한다. 이 명령들은 현재 로컬 엔진·JSON·지정된 대표 세이브가 필요하다. 공식 검사는 before.qsp를 baseline으로, candidate.qsp와 patches 폴더를 입력하고 출력은 별도 jo9-trait-overview-release-20261025 폴더로 지정한다. 실제 MSG 검사는 진단용 runner 사본에서 안내 메시지 두 개만 허용하며 엔진 원본이나 공용 검증기는 수정하지 않는다.

패치 경계는 UI_TRAIT_OVERVIEW_20261025, 선언형 패치는 2026-10-25_trait_overview_ui다. 최소 복구본은 before.qsp.gz와 patch.json; 재현 코드와 핵심 보고서를 보관하고 복제 QSP/JSON/세이브·브라우저 프로필은 정리한다. WORK만 반영하며 Full·배포 ZIP·커밋·푸시는 하지 않는다.
