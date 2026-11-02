# 소문 제공자 아이콘 — 독립 후보 검토

검토 대상: `2026-10-28_rumor_provider_icons.json`.

- 기준 WORK: `f0911bef8f53ef1464edc3d107beccaca3af90c7f0368a4b7df92f7a6082e1b2`
- 후보: `e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0`
- 변경: 기존 `jo9_buyer_rumors`와 `$ongload`의 편집 5개. 새 location·영구 상태 키 없음.

**검토 범위에서 actionable finding은 없다.**

Local 아이콘은 호출마다 services 기본값에서 시작하고 barman은 preferencesbar, anes는 anes 키를 선택한다. 구매·이전·다음3개 호출의 icon 인자만 이 local 값으로 바꾼다. 실행문·페이지 조건·비용·토큰·추천·할인·대사·아네스 문체 처리 및 기존 레이아웃은 유지한다.

fee 중첩 호출 및 view GT는 provider를 전달하며, refreshmenus에 저장된 대화 코드도 menu 모드를 해당 provider와 함께 다시 호출한다. 아이콘은 각 실행에서 재계산되고 `$menu`가 HTML을 즉시 조립하므로 local 변수가 저장된 링크에 남지 않는다. 기존 refreshmenus와 display_options 갱신 논리도 변경하지 않는다.

로드 재표시는 기존 Julia 블록 뒤에 추가하며, 그 기존 조건과 본문을 그대로 보존한다. 현재 화면이 소문 결과 location이고 저장된 provider가 barman/anes일 때만 view로 이동한다. consult·buy·scan을 실행하지 않아 소문 구입이나 추가 비용·토큰 발급·추천 재계산이 발생하는 경로를 추가하지 않는다. skups와 다른 화면의 로드 분기도 유지한다.

현재 WORK의 기준 해시와 각 old 문자열의 정확히1회 일치를 확인했다. 메모리 재생 결과는 후보 해시와 일치했고 QSP 바이트 왕복도 일치한다. 변경한 body 외 encoded 필드는 모두 원본과 동일하며, 역순 정확 역적용 결과는 현재 WORK 전체 바이트와 일치한다. 해당 두 body 안에서도 명시한 아이콘 선택·인자·로드 재표시 외 기존 수동 편집은 유지된다.

이 결과는 독립 정적 코드 검토다. 실제 엔진의 메뉴·구 SAV 로드·화면 렌더링은 이번 검토에서 실행하지 않았다. 제품 QSP·G:·기존 세이브는 변경하지 않았고 이 검토 문서만 저장했다.
