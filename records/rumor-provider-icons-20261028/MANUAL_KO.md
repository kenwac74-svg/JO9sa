# 소문 제공자별 아이콘 — 구현·검사·복구

사용자가 승인한 변경은 소문 듣기·이전·다음 메뉴에서 제공자별 기존 아이콘을 쓰는 것이다. 기존 세 호출은 모두 같은 `$menu_item_services`를 사용했다. 스컵스는 그대로, 바텐더는 `$menu_item_preferencesbar`, 아네스는 `$menu_item_anes`를 쓴다. 기존 PNG는 모두 `content/pic/ui/legacy_overhaul`에 있으며 새 이미지나 JSON은 추가하지 않는다.

## 입력·출력과 상태

기존 `jo9_buyer_rumors`의 `$args[1]` 제공자로 호출마다 LOCAL `$jo9_rm_icon`을 선택한다. `$menu`는 이 이미지 인자를 즉시 HTML에 넣는다. 링크에는 지역 변수 이름이 남지 않고 기존 consult/view 실행문·토큰·문구를 그대로 쓴다. 스컵스·기본은 services, 바텐더는 preferencesbar, 아네스는 anes다. 모드별 기존 지원 여부와 잘못된 제공자 처리는 유지한다.

비용·할인·추천·관할 지역·대사·페이징·결제 토큰은 변경하지 않는다. 일반 대화의 다른 서비스 메뉴·종료 메뉴도 바꾸지 않는다. 새 로케이션·API·영구 저장 키는 없으며 기존5편집/2로케이션만 바꾼다.

기존 `$ongload`는 대화 options를 갱신하지만 이미 열린 소문 결과 HTML은 다시 그리지 않았다. `$ongload` 끝에서 현재 위치가 `jo9_buyer_rumors`이고 저장된 제공자가 barman/anes인 경우에만 기존 `view`로 GT한다. 같은 페이지와 저장된 추천을 다시 표시할 뿐 consult/buy/scan을 실행하지 않아 소문값을 다시 내지 않는다. 스컵스·다른 화면은 이 추가 분기로 이동하지 않는다.

## 코드와 의존성

명세는 `2026-10-28_rumor_provider_icons.json`이다. `RUMOR_PROVIDER_ICON_SELECT_20261028`은 지역 선택, `RUMOR_PROVIDER_ICON_BUY/PREVIOUS/NEXT_20261028`은 세 이미지 인자, `RUMOR_PROVIDER_ICON_LOAD_20261028`은 옛 결과화면 재표시다. 기존 `$menu`, `$save_link`, PNG 키와 view·refreshmenus를 재사용한다.

지역 선택만 지우면 세 메뉴의 이미지 인자가 비게 되므로 세 인자와 함께 되돌려야 한다. 로드 재표시만 지우면 옛 저장 결과의 아이콘은 페이지 전환/재방문까지 남을 수 있다. 기존 Julia 로드 교정과 다른 로드 처리는 그대로다. 재표시 대신 consult나 scan으로 연결하면 재결제·추천 변경 위험이 생기므로 사용하지 않는다.

## 적용·복구

기준 QSP는 `f0911bef8f53ef1464edc3d107beccaca3af90c7f0368a4b7df92f7a6082e1b2`, 후보는 `e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0`다. WORK만 적용한다. 기존 세이브 파일·배포 폴더·PNG·JSON·CSS·JS·엔진·ZIP과 커밋·푸시는 변경하지 않는다. 적용 백업과 보호 입력 해시는 `installation.json`을 따른다.

게임을 종료하고 해당 자동 백업을 `jack.qsp`로 복원할 수 있다. 사용자 세이브는 삭제하지 않는다. `build.cjs`는 첫 인수로 기준 백업을 지정해 변경 JSON을 재생성한다. 실제 적용·공식 재생은 이 패치만 들어 있는 폴더를 사용한다. 테스트 스크립트·기준 경로는 `tests/REPORT_KO.md`를 따른다.

## 검사와 한계

수정 전 실제 `$menu`·JSON·`$save_link` 출력에서 바텐더의 소문 아이콘 기대가 services로 실패함을 확인했다. 후보는 제공자/할인/페이지/메뉴 캐시/로드 재표시와 비용·추천·토큰 동치를 실제 엔진에서 검사한다. 상세 조건·표본·격리는 `tests/REPORT_KO.md`, 독립 검토는 `REVIEW_KO.md`에 남긴다.

공식 검사 결과는 `official-report.json`이다. 구조·줄/주석 경계·바이트 왕복·패치 재생·멱등성과 설치 엔진9경로를 구분하며, 게임 전체 문법이나 모든 플레이를 증명하지 않는다. 합성 상태에서 기존 로드 콜백을 실행한 검사는 개인 SAV의 GUI 불러오기·모든 로드 migration·시각 배치와 다르다. 이번 작업에서 OPENGAME 파일 로더를 다시 시험하지 않는다.

재생성 가능한 진단 QSP·후보·복제 JSON만 절대 경계를 확인하여 정리한다. 백업·세이브·로그·핵심 보고·재현 스크립트는 보존하고 정리는 `cleanup.json`에 기록한다.
