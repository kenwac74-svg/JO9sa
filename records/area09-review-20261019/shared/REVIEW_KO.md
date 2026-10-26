공유 12개 문구 최종 검토: 휴면 원고 보관 9 / 현행에 맞춘 부분 병합 3 / 그대로 이식 권고 0

Work QSP SHA256: ae591ef904a5fe0f4cbac3454815ac36cd1475464689869bb75c94e3e7fe7826

| 키 | 최종 판정 | 이유 |
|---|---|---|
| $slave_ration[1] | hold | 휴면 원고로 보관. 정상 메뉴에서 구형 interaction331–338로 들어가는 호출을 정적 검색에서 찾지 못했으며 [9]는 출력 소비자도 없음. 지금 재연결하거나 효과를 복원할 제안은 하지 않음. 남성 플레이어 지정 표현이 없으며 굶김/존중 안내를 원문대로 옮긴 비활성 설명. |
| $slave_ration[2] | hold | 휴면 원고로 보관. 정상 메뉴에서 구형 interaction331–338로 들어가는 호출을 정적 검색에서 찾지 못했으며 [9]는 출력 소비자도 없음. 지금 재연결하거나 효과를 복원할 제안은 하지 않음. 여성 노예를 가리키던 대명사를 노예로 옮겨 남성 플레이어 문맥에 적합. 기존 효과를 변경하지 않음. |
| $slave_ration[3] | hold | 휴면 원고로 보관. 정상 메뉴에서 구형 interaction331–338로 들어가는 호출을 정적 검색에서 찾지 못했으며 [9]는 출력 소비자도 없음. 지금 재연결하거나 효과를 복원할 제안은 하지 않음. 채소·섬유질·감량·추가 비용 설명이 원문과 일치. 효과 근거로 사용하지 말 것. |
| $slave_ration[4] | hold | 휴면 원고로 보관. 정상 메뉴에서 구형 interaction331–338로 들어가는 호출을 정적 검색에서 찾지 못했으며 [9]는 출력 소비자도 없음. 지금 재연결하거나 효과를 복원할 제안은 하지 않음. 통조림·수입 식량 설명이 원문과 일치. 성별 엔진 불필요. |
| $slave_ration[5] | hold | 휴면 원고로 보관. 정상 메뉴에서 구형 interaction331–338로 들어가는 호출을 정적 검색에서 찾지 못했으며 [9]는 출력 소비자도 없음. 지금 재연결하거나 효과를 복원할 제안은 하지 않음. 내용은 같으나 "길러지는 사람의 옆구리"가 부자연스러워 해당 어구만 다듬어 병합 권장. |
| $slave_ration[6] | hold | 휴면 원고로 보관. 정상 메뉴에서 구형 interaction331–338로 들어가는 호출을 정적 검색에서 찾지 못했으며 [9]는 출력 소비자도 없음. 지금 재연결하거나 효과를 복원할 제안은 하지 않음. 집에서 조리한 음식·기분·조리 담당 안내가 원문과 일치. |
| $slave_ration[7] | hold | 휴면 원고로 보관. 정상 메뉴에서 구형 interaction331–338로 들어가는 호출을 정적 검색에서 찾지 못했으며 [9]는 출력 소비자도 없음. 지금 재연결하거나 효과를 복원할 제안은 하지 않음. 디저트 추가의 비용·열량 설명이 원문과 일치. 실제 enable_dessert 코드 유지. |
| $slave_ration[8] | hold | 휴면 원고로 보관. 정상 메뉴에서 구형 interaction331–338로 들어가는 호출을 정적 검색에서 찾지 못했으며 [9]는 출력 소비자도 없음. 지금 재연결하거나 효과를 복원할 제안은 하지 않음. 디저트 제외 설명이 원문과 일치. 실제 enable_dessert 코드 유지. |
| $slave_ration[9] | hold | 휴면 원고로 보관. 정상 메뉴에서 구형 interaction331–338로 들어가는 호출을 정적 검색에서 찾지 못했으며 [9]는 출력 소비자도 없음. 지금 재연결하거나 효과를 복원할 제안은 하지 않음. 보충제 설명은 성별 독립. 현재 소비자 검색에서는 대입 외 참조가 없어 휴면 문구로만 채택 가능. |
| $auction_intro[1] | merge | 현행 경매가 입찰·낙찰·지급까지 구현되어 있어 "경매장 공사 미착수/길드에 나와 게시판뿐"을 그대로 이식하면 기능 설명과 충돌. 여성 플레이어 관련 문제는 없으나 현행 기능에 맞춰 절충해야 함. |
| $auction_intro[2] | merge | 현행에는 길드 경매와 재매입상 경로가 존재하므로 "노예를 팔 데가 없다"는 도입을 그대로 이식하기 부적절. 안젤리카의 직접 매입이라는 기존 맥락만 유지하는 절충 검토. 효과·가격·흥정 로직 수정 없음. |
| $auction_intro[3] | merge | 체력4/요리3/가사2의 기존 표시 단계명과 맞춰야 하며 최고 수준이라는 과장을 피함. 구형 interaction_city92는 demand_rating을 현재 rating으로 설정하므로 D 고정을 현행 조건으로 단정하지 않음. 처녀 웃돈도 실제 계산 추가 검증 없이 확정하지 않음. |

식단: 주석은 interaction:1207–1208의 "unused". 별도로 전체 디코딩 본문에서 interaction331–338 대입·메뉴 호출과 JSON 별칭을 검색했으나 처리부 외 정상 호출을 찾지 못했다. 331의 UI 호출들은 interaction_city 의료 화면이며 같은 번호의 interaction 식단 처리부가 아니다. [9]는 대입 외 출력 참조가 없다. 이는 정적 조사 결과이며 임의 계산/주입 스크립트까지 불가능하다고 증명한 것은 아니다.

개인방 roomN_ration의 별도 식사 설정 경로는 현재 코드에 존재한다. 이 검토로 해당 기능의 메뉴·효과·금액·열량·저장 상태를 바꾸지 않는다.

실제 경매 경로:
- guild:28–30: conditions auction_count=0, existing branded slave, rating>0; menu_auction_slaves
- game/json/menu_item.json:719: menu_auction_slaves=93
- $menu:120–121: interaction_city menu emits interaction_city=93 and gt interaction_city
- interaction_city:12268–12282:93 confirmation ->930
- interaction_city:12285–12290:930 sets return_lock=$guild_auction
- $objsel:34–48 advances text and calls gt $return_lock at final page
- $guild_auction:67–140: bidders, price increases, hammer, sparks_get, interaction_city=931
- interaction_city:12295–12309: male931 adds sparks_get and clears sold slave instance
- next_day:254–257: auction countdown decrements and resets

구형 도입은 interaction_city92의 별도 블록에서만 발견했다. 정상 메뉴의 city92 호출은 찾지 못했으며 JSON의92는 조수 마법약(menu_form)용이다. 구형 도입을 향후 사용하더라도 활성 경매 및 판매 경로와 충돌하는 서술을 그대로 가져오지 않는다.

검증 한계: 읽기 및 정적 추적만 수행. 런타임 테스트·게임 파일 수정 없음. D 고정등급/처녀 가산의 실제 수치는 확정하지 않음.
