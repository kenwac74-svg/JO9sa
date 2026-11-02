# 소문 가격 비교 독립 감사 — 읽기 전용

현재98명 고정 소문 목록은 **house74명, full20명, simple4명**이다. `full`은 구매조건 검사 방식이며 가격 경로 이름이 아니다. 현재 full20명 전원은 원래 상호작용에서 `slave_sell`로 이동한다. 따라서 이번 비교는 house/full94명의 정가와 simple4명의 즉시 고정 지급액을 각각 사용해야 한다.

기준 WORK SHA256: `dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae`. 모든 행 번호는 복호화 location 본문의 1기준 행이다. 스크립트 `audit.cjs`가 실제98명 목록과 full20명 경로를 검증하고 `evidence.json`에 남긴다. WORK 및 세이브는 수정하지 않았으며 판매·퀘스트는 실행하지 않았다.

## 확인한 실제 지급식

**house/full94명**: `slave_sell`의 정가 선택 `sl_txt=12`가 `interaction_city=912`로 이동한다. `interaction_city` 12631–12645행, 특히12638–12640행의 계산은 다음과 같다.

`정가 = min(8000, common_price[demand_rating[buyer]] + virgin_price)`

`slave_sell_chek` 153–154행의 처녀 가산은 `relative_rating = rating/2`를 사용한다(`#static_base`1499행). QSP 정수 나눗셈 순서 그대로 계산해야 한다.

- virginity>=2: 가산0.
- virginity=1: `50 * (rating/2)`.
- virginity<1: `2 * (50 * (rating/2))`.

가격 배열의 인덱스는 **고객 demand_rating**이다. `relative_rating`을 common_price 인덱스로 사용하면 틀린다. 실제 지급은 `interaction_result_city` 183–185행 또는415–417행에서 같은8000 상한을 다시 적용하고 `sparks+=sell_price`다. 정가912에는 별도의 `base_price` 다재다능25%나 `haggle` 명기·절세 가산이 없다. 다만 특성이 외모·인지도·등급에 간접 영향을 미친 결과는 재평가된 rating에 반영된다.

**simple4명(realtor, doctor, jarik, sergant)**: 원래 경로는 `sell_slave_simple`이다. `interaction_result_city`58–117행, 특히85행의 지급은 다음과 같다.

`즉시 고정 지급 = func('jo9_traits_value','base_price',actor,common_price[demand_rating[buyer]])`

즉 다재다능이면 기존 `base_price`에 의해 `base + base/4`이고, 처녀 가산이 없다. 이 실제 경로에는8000 상한이 없다. 소문 비교에만 임의로 상한을 추가하면 실제 지급과 달라진다. 현재 이 네 고객의 기본 수요는 낮지만, 실제 세이브 배열을 읽어야 한다. `#npc_base_woman`이 doctor/realtor/sergant의 수요 등급을 남성 기본과 다르게 설정하므로 숫자를 하드코딩하지 않는다.

`sell_slave_complex`의 즉시 고정 지급도 `interaction_result_city`205/249행에 존재하나, 현행 소문98명의 full20명은 이 경로를 사용하지 않는다. 과거 제안에서 full을 즉시 고정 지급으로 분류한 가설은 실제 경로 검사로 기각했다.

**길드**: `jo9_traits_value`3–31행의 기존 `dealer_quote,wong`를 같은 probe actor에 재사용하는 방향이 정확하다. 쉬움/보통은 `max(30, slave_base_price*3/2, base_price(common_price[rating]))`에서 복종0 감가, broken감가,90%/75% 지급 순으로 계산하고6000 상한을 적용한다. 기존 `slave_base_price` 자체에 다재다능이 한 번 반영되므로 다시 중복 가산하지 않는다. 어려움은 `auction_price[rating]` 기반 broken감가 후 base_price 및6000 상한이다. 정수 계산 순서를 유지한다.

dealer_quote가 faint도 계산하는 사실과 실제 길드 메뉴 활성은 다르다. `guild`24–27행은 `slave_state=slave_exist` 및 `brand>0`일 때만 재매입 메뉴를 연다. `interaction_city`12949행과 `jo9_traits_value`39–45행의 완료 조건은 어려움에서rating>0, 양수 지급, 낙인을 추가로 요구한다. 따라서 소문에서 guildQuote>0만 보지 말고 **존재·의식 상태, brand>0, 어려움의rating>0**도 확인해야 한다. 계약brand4는 현행 scan에서 이미 제외된다.

## 비교와 표시 권고

- 기존 후보 조건과 availability 검사는 유지하고, 실제 숫자 지급액으로 최고 및 동가 그룹을 선정한다. 같은 demand_rating이어도 simple의25%와 house/full의 처녀 가산 차이 때문에 등급 순서만으로는 지급액 동가를 보장하지 못한다.
- 길드와 비교할 값은 후보의 **흥정 전 정가/확정 지급 기준**이다. 흥정911은 별도 결과다. 일반 의사난수, 주인 능력·브랜드·호감도·매력·특성·고객 예산이 작용하며 정가를 넘거나 낮출 수 있다. 최고 roll을 모사한 값을 알려진 제시액처럼 사용하지 않는다.
- 이번 사용자 요청에 맞춰 소문 대사에는 금액을 표시하지 않는다. “지금 이 근방에 딱 맞춰 찾는 손님은 없지만, 돈이 급하면 길드 재매입상을 찾아가 보게.”처럼 방문 권유로 쓰면 절대 최고가를 보장하는 오류를 피할 수 있다. “어디보다 가장 비싸다”는 표현은 실제 흥정 결과를 포함한 주장이라 위 비교만으로는 보장할 수 없다.
- brand0이거나 길드 실제 거래 조건을 만족하지 못하면 길드 구매가 가능한 것처럼 안내하지 않는다. 어떤 후보도 없을 때의 지역 안내는 가격 비교와 분리한다.

## 최소 native fixture 제안

격리 진단 QSP에서 actual quote 함수를 호출하되 판매 완료·퀘스트·npc_progress 변경은 실행하지 않는 구성이다. scan 전후 전체 소유 인물 스키마, sparks/day/설정, NPC/수요/특성 scratch 배열을 비교한다.

1. 기존 `dealer_quote,wong` 기본 인자와 actor=`slave` 명시 인자가 같아야 한다. 쉬움·보통·어려움과 정상/broken/복종0/다재다능을 작은 표로 확인한다. probe 호출 결과도 동일 actor 복사본의 기존 기본 호출 결과와 일치해야 한다.
2. same-actor 평가에서 guildQuote가 지역 최고 정가보다 큰 사례, 작은 사례, 같은 사례를 각각 확인한다. 동가는 정한 한 방식대로 처리하고, 금액 문자열이 소문에 나타나지 않아야 한다.
3. simple1명과 house/full1명을 같은 수요 등급으로 둔 격리 수치에서 다재다능/처녀0/복원1/비처녀2를 교차 확인한다. simple에는 처녀 가산을 붙이지 않고 house/full 정가에는25%를 붙이지 않아야 한다. rating 홀수로 정수 나눗셈도 확인한다.
4. 거래 불가 사례: brand0, faint, hard+rating0. 이때 양수 helper 결과가 있더라도 허위 길드 추천을 하지 않아야 한다. 후보0에서는 요청한 지역 안내/길드 가능 안내가 구분돼야 한다.
5. scan을 반복하고 일반 주 노예·조수·개인실·동결 보관 인물이 섞인 상태로 실행하여 원래 인물 배열 및 진행도 보존, 중첩 helper scratch 복원, 결과 안정성을 확인한다. global 최고 이론값 탐색이나 quest 상태 변경은 이 검사의 일부가 아니다.

별도 판매 완료를 실행하지 않아도 기존 수식과 quote 함수의 동치 검사는 가능하다. native 정가 계산 블록을 격리 호출하는 경우 완료 location 직전에 멈춰 `sell_price`만 관찰하고, 생산 세이브에는 저장하지 않는다. 이 제안은 구현 권한을 확대하거나 실제 판매를 실행한 결과가 아니다.
