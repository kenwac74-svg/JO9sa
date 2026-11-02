# 제공자별 소문 아이콘 — 독립 native 검사

수정 전 바텐더 메뉴의 실제 HTML이 공용 `askaboutservices.png`를 가리키는 기대 실패를 확인했다. 후보는 제공자별 기존 아이콘으로 연결됐고, 검사 범위에서 아이콘 이외 비용·할인·문구·추천 페이지·토큰·콜백 차이를 발견하지 못했다.

- 수정 전: `f0911bef8f53ef1464edc3d107beccaca3af90c7f0368a4b7df92f7a6082e1b2`
- 후보: `e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0`
- 상위 제품 JSON 5편집·2로케이션·신규 로케이션0. exact edit 재생 해시와 전체 역적용 바이트 일치 확인. `$menu`와 `jo9_rumor_scan` 본문은 수정 전/후 동일.

| 검사 | 결과 |
| --- | --- |
| RED | 실제 `$menu`·실제 `$save_link`·기존 menu_icon JSON 값으로 barman 메뉴 생성. 기대 `check preferences pub.png`가 없고 `askaboutservices.png`가 출력되어 `FAIL_RUMOR_ICON_BARMAN_EXPECT_PREFERENCESBAR`. 토큰1 및 consult callback1도 SAV에서 확인. |
| 기본 native | 수정 전/후 각각37조건 PASS. 3제공자의 일반/할인 메뉴, 실제 buy 결제1회·토큰 재사용, cache refreshmenus와 기존 메뉴 동적 실행, 결과 첫/중간/끝, 미지원 제공자·비소문 메뉴 포함. |
| 실제 출력 | 버전별30출력 사례 비교 PASS. 소문 듣기·이전·다음의 `<li>`만 해당 기존 아이콘 HTML로 바뀌고 나머지 전체 메뉴 HTML은 동일. 결과 view의 전체 출력도 아이콘 외 동일. 종료 메뉴와 다른 메뉴 아이콘은 유지. |
| 상태·콜백 | 일반10/할인5, 결제 후 잔액·할인 플래그·serial·pending token/provider·추천 페이지 배열·페이지 번호·스캔 횟수·consult 및 pagination callback이 수정 전/후 동일. |
| load 꼬리 | 실제 현재 로케이션 `jo9_buyer_rumors`에서 callback→GT→전체 view 재진입 PASS. 바텐더·아네스 각각8개 저장 상태, 총16비교 동일. refreshmenus 실제 API 호출, consult/buy/scan 호출0. 다른 로케이션 및 스컵스 결과는 재진입하지 않음. |

확인한 기존 키/파일은 `services`→`content/pic/ui/legacy_overhaul/askaboutservices.png`, `preferencesbar`→`content/pic/ui/legacy_overhaul/check preferences pub.png`, `anes`→`content/pic/ui/legacy_overhaul/anes.png`이다. 세 파일의 실존·해시를 `SUMMARY.json`에 기록했다. 아네스 키의 기존 CSS 형식도 그대로 사용하므로 파일명만 바꾸는 기대값 대신 기존 키의 HTML 전체를 비교했다.

이번 검사는 전달 인자만 가로채지 않았다. 실제 `$menu` 본문으로 생성된 HTML과 실제 `$save_link`의 실행 문자열을 비교했다. 아이콘 변수는 WORK `json/menu_icon.json`의 기존 값 전체를 읽어 초기화했고 데이터베이스 로더 자체는 호출하지 않았다. `_layout`과 이미지 wrapper는 출력 격리용이며, 구매자 조건 스캔은 고정 페이지·호출 카운터로 대체했다. 대규모 추천 계산은 재검사하지 않았고 스캔 본문 바이트 불변·주어진 추천 페이지 및 전체 view 문구 불변으로 이번 아이콘 범위를 검증했다.

load 검사는 실제 load 꼬리와 기존 refreshmenus 호출만 연결하고, 앞선 `$ongload` migration prefix는 호출 카운터로 격리했다. callback을 직접 실행했으므로 개인/GUI 불러오기나 native OPENGAME 성공을 의미하지 않는다. 이전 작업의 불명확한 OPENGAME 실험은 이번에 반복하지 않았다. 개인 세이브·WORK·G 기록은 수정하지 않았다. 픽셀 배치와 아이콘 이미지의 시각적 품질은 검사하지 않았다.

조건별 원시 결과는 `red-results.json`, `green-results.json`, `load-results.json`과 각 로그, 요약은 `SUMMARY.json`이다. 중복되는 조건 수는 합산하지 않았다. 재실행 시 WORK가 이미 갱신됐다면 `JO9_RUMOR_ICON_BASELINE`에 위 수정 전 SHA의 QSP 또는 gzip 백업을 지정한다.

이번 G 임시 폴더의 경계·링크·QSP/JSON 재파스를 확인한 뒤 재생성 가능한 QSP·계획 JSON·ini 14개, 297,802,493바이트를 정리했다. 링크0이며 합성 SAV7개·로그12개를 보존하고 해시를 재확인했다. 재현 스크립트·보고서도 보존했으며 세부 목록은 `cleanup.json`에 기록했다.
