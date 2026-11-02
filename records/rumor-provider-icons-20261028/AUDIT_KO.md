# 구매자 소문 제공자 아이콘 — 독립 설계 감사

기준 WORK SHA-256: `f0911bef8f53ef1464edc3d107beccaca3af90c7f0368a4b7df92f7a6082e1b2`.

계획은 `jo9_buyer_rumors`의 provider 설정 직후 local 아이콘을 매번 기본값으로 초기화하고, barman/anes일 때 기존 전용 아이콘을 선택한 뒤 구매·이전·다음3개의 `$menu` 인자만 바꾸는 것이다. **읽은 코드 기준으로 local 범위·중첩 호출·레이아웃에 직접 충돌하는 문제는 없다.**

## Local 및 호출 경계

- 현재 `jo9_buyer_rumors:6-8`의 mode/provider/token을 읽은 뒤 local 아이콘을 선택하면 각 호출이 해당 provider의 값을 사용한다. 다른 제공자에서 남은 값을 이어받지 않도록 services 기본값을 항상 먼저 대입하는 계획이 적절하다.
- `menu:80`은 fee를 다시 호출하지만 fee 호출도 같은 provider를 받는다. local 변수의 호출 범위를 유지하며 외부 전역 상태를 새로 저장할 필요가 없다.
- `refreshmenus:11-67`이 저장하는 대화 코드는 각각 `:24/:45/:63`에서 helper의 menu 모드를 skups/barman/anes 인자와 함께 다시 호출한다. 생성 시점의 빈 provider나 local 아이콘을 저장된 대화가 나중에 참조하는 구조가 아니다.
- 구매 링크와 이전·다음 링크는 provider 문자열을 포함해 GT한다(`:86/:169/:172`). 다음 view 진입에서도 local 아이콘을 새로 선택한다.
- `$menu:68-73`은 icon 인자의 HTML을 즉시 `$text_display`에 합치고 실행문을 저장한다. 생성된 링크에 local 아이콘 변수 참조가 남지 않는다.

## 기존 자료와 표시 범위

- skups: `$menu_item_services` → `askaboutservices.png`
- barman: `$menu_item_preferencesbar` → `check preferences pub.png`
- anes: `$menu_item_anes` → `anes.png`

세 파일은 기존 `content/pic/ui/legacy_overhaul/` 자료다. 바텐더 요구사항 메뉴와 아네스 요구사항 메뉴도 이미 각각 해당 키를 사용한다(`jo9_buyer_rumors:38/:54`). 같은 `$menu` li 인자만 바꾸므로 컬러·열 위치·글꼴·클릭 명령·설명문을 변경할 이유가 없다.

제공자별 NPC 전체 이미지는 이미 `:145-150`에서 정상 분기한다. 그 NPC 매핑이나 파일을 바꿀 필요가 없다. refreshmenus 안의 스컵스 일반 업무 안내(`:19`)도 이번 소문3개 호출과 구별해 유지한다.

## 기존 SAV의 즉시 화면 갱신은 구별 필요

현재 `$ongload:39-42`는 대화 options를 새 helper 기준으로 재발급하고 해당 장소의 display_options를 갱신한다. 하지만 소문 결과 화면인 `$curloc='jo9_buyer_rumors'`를 다시 그리는 분기는 없다.

따라서 header와3개 icon 인자만 바꾸면 새 메뉴·재방문·이전/다음으로 다시 그린 페이지는 새 아이콘을 사용하지만, **이미 렌더된 소문 결과 화면을 그대로 담은 구 SAV는 로드 직후 기존 HTML을 유지할 수 있다.** 비용이나 추천 데이터 오류는 아니며 현재 화면 재표시의 범위 문제다.

로드 직후 즉시 갱신까지 포함한다면 `$ongload`의 기존 처리 뒤에서 현재 소문 화면이고 저장된 provider가 유효한 barman/anes인 경우만 **view 모드**로 재표시하는 별도 분기를 검토할 수 있다. 이때 consult/buy/scan을 다시 실행하거나 토큰을 재발급하면 안 된다. 기존 view는 저장된 `$jo9_rumor_pages`를 표시하므로 비용·할인·추천을 다시 계산할 필요가 없다. 새 location·영구 키도 필요 없다.

## 검증 한계

현재 소스와 `$menu` 및 로드 연결을 읽은 정적 설계 감사다. 후보 JSON이나 네이티브 동작은 아직 검토하지 않았다. 비용·토큰·추천·할인·대사를 변경하거나 제품·G:·세이브를 쓰지 않았고 이 감사 문서만 저장했다.
