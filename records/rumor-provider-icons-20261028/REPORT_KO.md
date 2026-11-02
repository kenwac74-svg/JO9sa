# 소문 제공자별 아이콘 — WORK 적용 결과

사용자 승인에 따라 소문 듣기·이전·다음 메뉴를 제공자별 기존 아이콘으로 연결했다. 스컵스는services, 바텐더는preferencesbar, 아네스는anes를 쓴다. 같은 남성 아이콘을 공통 사용하던 세 호출의 이미지 인자를 교정했다. 새 PNG나 JSON은 추가하지 않았다.

저장 당시 열린 바텐더·아네스 소문 결과도 기존view로만 다시 표시한다. consult/buy/scan은 재실행하지 않는다. 기존 가격·할인·문구·추천·페이지·결제 토큰·종료 메뉴와 이전Julia로드처리는 보존한다. 새 로케이션·영구 저장 키는 없다.

실제 `$menu`·현재JSON·`$save_link` 출력으로 수정 전 바텐더 아이콘 실패를 확인했다. 후보에서 baseline/candidate 버전별37 native 조건·30 HTML 출력 사례가 통과했고, 로드 꼬리의 실제 GT→view와16상태 보존도 확인했다. 추천 scan은 고정 결과와 호출 카운터로 격리했으며 추천 알고리즘 자체는 본문 동일성을 확인했다. 이번 아이콘 검사로 추천 매칭 전부를 다시 검증했다고 확대하지 않는다.

공식 구조·줄/주석 경계·바이트 왕복·재생·멱등성과 설치 엔진9경로가 PASS다. 정확 역적용은 기준 전체 바이트와 같다. 기능 검사는 합성 상태에서 실제 메뉴·서비스·로드 꼬리를 실행한 것이다. 개인 SAV의 GUI 불러오기·native OPENGAME·이전 로드 migration·실제 CSS 화면은 이번에 검사하지 않았다.

WORK QSP: `e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0`.
자동 백업: `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp.bak_20261028_160106`.

기존 세이브·배포용 QSP·아이콘·menu_icon.json·CSS·JS·엔진·설정·ZIP을 보존했다. 커밋·푸시는 하지 않았다. 다른 미수정 제보는 적용하지 않았다. 구현·복구는 `MANUAL_KO.md`, 기능별 결과는 `tests/REPORT_KO.md`, 독립 검토는 `REVIEW_KO.md`, 공식 결과는 `official-report.json`, 설치·보호 해시는 `installation.json`, 정리는 `cleanup.json`을 따른다.
