# 신규 특성 14종 적용 설명서 — 2026-10-17

> 시작·불러오기 회귀는 [줄바꿈 수정 기록](TRAITS_STARTUP_REGRESSION_FIX_20261017.md)을 우선한다.

사용자가 확정한 추천안을 최신 플레이 저장본에 적용한다. 기존 천재·백치와 달변가, 교대 전투, 인물 편집기 수동 수정과 대사 1단계는 보존한다. 미승인 특성이나 별도 자격 제한은 추가하지 않았다.

## 게임에서 바뀌는 내용

| 특성 | 효과 |
|---|---|
| 야심가 | 기술 등급이 오른 날 처음 칭찬받으면 기분 누적값 +5. 응석은 추가하지 않습니다. |
| 일벌레 | 하루 첫 업무·교육은 보통과 같고, 두 번째부터 수행할 때마다 기분 누적값 +2. |
| 안분지족 | 하루 첫 업무·교육은 보통과 같고, 두 번째부터 수행할 때마다 기분 누적값 -2. |
| 끈기 | 같은 업무·교육을 연속 수행하면 두 번째부터 기분 +2, 양의 경험치 +10%. 고정 규칙 업무는 제외합니다. |
| 산만함 | 같은 업무·교육을 연속 수행하면 두 번째부터 양의 경험치와 업무 성과 -10%. 고정 규칙 업무는 제외합니다. |
| 옹졸함 | 사건으로 생긴 부정적 기억이 약 1.5배 오래갑니다. 최초 기분 손실은 그대로입니다. |
| 너그러움 | 사건으로 생긴 부정적 기억이 약 0.7배 동안 유지됩니다. 최초 기분 손실은 그대로입니다. |
| 건강체질 | 2026-10-24 통합: 전투 최대 체력·스태미나 ×1.2, 기존 운동 교육의 양의 경험치 ×1.5, 영양·보조식품·충분휴식의 새 체력 성장 ×1.5. 선천/시술 동일 효과, 약골과 양립하지 않습니다. [최신 설명](../records/constitution-unification-20261024/MANUAL_KO.md) |
| 약골 | 전투 최대 체력·스태미나 및 운동 관련 교육의 양의 경험치 ×0.5. 건강체질과 양립하지 않습니다. |
| 광전사 | 최대 스태미나·사기 ×1.5. 체력이 최종 최대치의 30% 이하이면 공격 피해 ×2. 세 전투 특성 중 하나만 가집니다. |
| 성기사 | 현재 스태미나와 사기가 모두 최종 최대치의 50% 이상이면 받는 피해를 절반으로 줄입니다. 기존 최소 피해는 유지합니다. |
| 역전의 용사 | 전투 최대 체력·스태미나·사기 ×1.5. 세 전투 특성 중 하나만 가집니다. |
| 다재다능 | 표시되는 지식·기술과 성애기술·ST가 모두 A(4) 이상이면 영구 획득. 기본 가치 +25%. 편집기로 해제하면 자동 재획득을 보류합니다. |
| 경국지색 | 기본 외모에 한 단계를 더하여 최대 S++(6). 기존 흉터·체형 불이익은 유지합니다. 특별 판매·경매·흥정 우대 및 기존 양의 호감도·명성 보상 +50%. |

초기 성격 7종은 새 무작위 인물에서 각 10%, 건강체질·약골은 각 3%이다. 반대 특성은 같은 숫자 키의 부호로 구분하므로 동시에 붙지 않는다. 프리셋과 기존 인물은 무작위 재추첨하지 않는다. 성격 7종은 실제 효과가 처음 발생할 때 목록에 드러난다.

전투 3종은 해당 인물이 직접 이긴 실전 누적 10·15·20…승마다 특성 미보유자에 한해 한 번 추첨한다. 광전사·성기사·역전의 용사 각각 3%, 미획득 91%이며 획득한 특성은 유지한다. 연습, 동료가 패배한 뒤 주인공이 이긴 경우는 세지 않는다. 기존 연승은 새 누적 승수로 가져오지 않는다. 기존 용감함·겁쟁이는 최대 사기 ×1.5/×0.5가 추가된다. 타고난 투사의 기존 효과는 유지한다.

경국지색은 **최종 외모 5인 새 무작위 인물의 1%**에서 생성된다. 외모 5의 성형수술은 5% 대성공으로 획득한다. 기존 1회 수술 이력·비용·소모·회복은 유지한다. 외모 6만 S++이고 종합등급 상한은 10/S+이다. 흉터·멍·체형으로 현재 외모는 내려갈 수 있다.

다재다능은 표시되는 지식·기술 15개와 ST 9개가 모두 4(현재 A) 이상일 때 영구 획득한다. 기본 가치 +25%를 해당 판매 경로에서 한 번 적용한 뒤 특별 배수를 적용한다. 경국지색 단독 특별 판매 ×10·경매 ×2, 기존 특성과 동시 보유 시 ×15·×3이다. 흥정은 기존 적격 결과 범위와 구매자 자금 상한을 지킨다. 기존 양의 호감도·주인공 명성 보상만 +50%이며 1은 2로, 0은 0으로 남는다. 일반 재능 특성 전체의 가치 보정은 보류 상태다.

## 편집기

치트 화면의 **신규 특성 편집 (노예 / 조수)** 또는 기존 노예 편집기 마지막 페이지의 **신규 특성**으로 이동한다. 페이지 번호는 2107이다. 노예·조수를 선택한 뒤 특성 항목을 누르면 추가하거나 해제한다. 보유 중인 항목을 다시 누르면 해제한다. 같은 축의 다른 항목은 이전 값을 대체한다. 새 강제 교환이나 인물 슬롯 이동은 없다.

수동으로 추가한 성격은 바로 표시한다. 야심가 기준 등급표, 집중의 직전 과목·활성 상태·경험치 소수 잔여값, 기억 회복 잔여값은 해당 특성을 편집할 때 초기화한다. 이미 수행한 당일 활동 횟수는 지우지 않는다. 경국지색 버튼은 특성 플래그만 바꾸므로 기본 외모가 5일 때 6/S++가 되며 다른 외모 입력값을 강제로 올리지 않는다.

다재다능을 수동 해제하면 jo9_versatile_manual_off=1로 자동 재획득을 보류한다. 다시 추가하면 이 보류도 해제한다. 전투 특성을 해제한 인물도 누적 10·15·20…승 체크포인트에서만 같은 확률로 다시 추첨한다. 이 편집기는 다른 기술·성격·역사 값을 일괄 초기화하지 않는다.

## 구조와 저장

새 로케이션은 4개다. 기능별 계산을 분리한 것이며 저장된 개인 수치는 기존 인물 배열에 들어가 기존 인물 교환·냉동 저장을 따라간다.

| 로케이션 | 입출력·역할 |
|---|---|
| jo9_traits | generate: 새 무작위 stock의 추첨. $func(list, ROLE): 특성 HTML 반환. describe: 설명 표시. edit: 키 토글·관련 임시 이력 초기화. editor: 양쪽 열의 편집 링크 생성. |
| jo9_traits_personality | 등급 상승, 칭찬, 활동 횟수·연속 과목, 경험치·성과, 사건 기억 회복. 아래 상세 설명 참조. |
| jo9_traits_combat | 최대 자원, 조건부 피해, 누적 승리·직업 획득, 운동 교육 경험치. 아래 상세 설명 참조. |
| jo9_traits_value | 외모 재계산, 다재다능, 성형 대성공, 기본 가치와 특별 배수, 양의 보상. 아래 상세 설명 참조. |

jo9_traits_revision=2은 기존 저장의 동적 코드 캐시를 한 번 갱신하는 버전이다. #static_base/#dynamic/#static_txt/#variative와 수정한 캐시 플래그를 갱신한다. 원래 인물 특성을 재추첨하지 않는다. 일시 계산 변수는 전용 접두사를 사용하고 종료 시 정리한다. 구형 엔진이 지원하지 않는 LOCAL/FOR가 영향을 주던 기존 판매·교대·수행 경로는 같은 계산을 하는 레이블 반복문과 명시적 정리로 바꿨다.

개인 키는 jo9_ambition, jo9_work_ethic, jo9_focus, jo9_grudge, jo9_constitution, jo9_combat_trait, jo9_versatile, jo9_peerless 및 발견 여부·누적 승수·당일 활동·분수 잔여값이다. 정확한 추가 키와 값 범위는 아래 도메인 설명에 적었다. 새 저장 파일 형식이나 별도 저장 파일은 만들지 않는다.

## 수정 위치와 분리 영향

패치 파일은 mods/2026-10-17_zzzzzzzz_traits_batch.json이다. 기존 본문 30개를 정확 비교로 갱신하고 로케이션 4개를 덧붙인다. 내부 기능 변경은 JO9 MOD START/END 표식으로 찾을 수 있다. 아래 행은 이번 후보의 실제 로케이션 본문 기준 1부터 센 번호다. QSP 바이너리에는 일반 텍스트 파일 전체의 행 번호가 없으므로 로케이션명과 표식이 안정적인 기준이다.

| 위치 | 새 표식 시작 행 |
|---|---|
| menu_form | 3729: TRAITS_EDITOR_ENTRY; 4430: TRAITS_EDITOR_NEXT; 4434: TRAITS_EDITOR_PAGE; 5218: TRAITS_EDITOR_LAYOUT |
| $newloc | 4: TRAITS_SAVE_CACHE; 378: TRAITS_DISPLAY_DYNSLAVE_COG_ICED_DISPLAY |
| $slave_price | 10: TBV_PRICE_REFRESH |
| $stock_traits | 13: TRAITS_DISPLAY_STOCK_COG_STOCK_DISPLAY |
| $cow_price | 7: TBV_COW_REFRESH; 127: TBV_COW_BASE_PRICE |
| $combat_variable_reset | 7: TRAITS_COMBAT_RESET |
| $guild_auction | 113: TBV_AUCTION_BASE; 118: TBV_AUCTION_PREMIUM; 124: TBV_AUCTION_NATIVE57; 129: TBV_AUCTION_TEXT |
| $gladiator_fight_start | 63: TRAITS_COMBAT_SETUP_ARENA |
| end_contract | 15: TBV_OLD_REWARD_end_contract_14; 18: TBV_OLD_REWARD_end_contract_15 |
| generate_stock | 1599: TBV_STOCK_TOP_EPITHET; 1649: TRAITS_GENERATE |
| slave_sell_done | 11: TBV_OLD_REWARD_slave_sell_done_10; 14: TBV_OLD_REWARD_slave_sell_done_11; 17: TBV_OLD_REWARD_slave_sell_done_12; 23: TBV_OLD_REWARD_slave_sell_done_16 |
| next_day | 200: J9TP_MEMORY_DECAY |
| main_screen | 788: TRAITS_EDITOR_MAIN_GUARD |
| slave_stat | 509: TBV_BEAUTY_FORMULA_slave |
| assistant_stat | 473: TBV_BEAUTY_FORMULA_assistant |
| interaction | 1: J9TP_ACTION_SCOPE_interaction; 1444: J9TP_GAIN_69; 1470: J9TP_GAIN_68; 1599: J9TP_GAIN_67; 1634: J9TP_GAIN_66; 1639: J9TP_GAIN_65; 1675: J9TP_GAIN_64; 1682: J9TP_GAIN_63; 1721: J9TP_GAIN_62; 1777: J9TP_GAIN_61; 1829: J9TP_GAIN_60; 2739: J9TP_GAIN_59; 2760: J9TP_GAIN_58; 2783: J9TP_GAIN_57; 2802: J9TP_GAIN_56; 2827: J9TP_GAIN_55; 2847: J9TP_GAIN_54; 2871: J9TP_GAIN_53; 2890: J9TP_GAIN_52; 3281: J9TP_GAIN_51; 3302: J9TP_GAIN_50; 3326: J9TP_GAIN_49; 3346: J9TP_GAIN_48; 3373: J9TP_GAIN_47; 3393: J9TP_GAIN_46; 3416: J9TP_GAIN_45; 3435: J9TP_GAIN_44; 3710: J9TP_GAIN_43; 3731: J9TP_GAIN_42; 3754: J9TP_GAIN_41; 3773: J9TP_GAIN_40; 3798: J9TP_GAIN_39; 3819: J9TP_GAIN_38; 3842: J9TP_GAIN_37; 3861: J9TP_GAIN_36; 3892: J9TP_GAIN_35; 3935: J9TP_GAIN_34; 3958: J9TP_GAIN_33; 3981: J9TP_GAIN_32; 4005: J9TP_GAIN_31; 4025: J9TP_GAIN_30; 4049: J9TP_GAIN_29; 4067: J9TP_GAIN_28; 5448: J9TP_GAIN_27; 5453: J9TP_GAIN_26; 5454: TRAITS_BODY_SEDUCTION_XP; 9654: J9TP_GAIN_25; 9704: J9TP_GAIN_24; 11470: J9TP_GAIN_23; 11497: J9TP_GAIN_22; 11632: J9TP_GAIN_21; 11660: J9TP_GAIN_20; 11802: J9TP_GAIN_19; 11834: J9TP_GAIN_18; 11867: J9TP_GAIN_17; 11910: J9TP_GAIN_16; 11933: J9TP_GAIN_15; 11956: J9TP_GAIN_14; 11980: J9TP_GAIN_13; 11993: J9TP_ROOM_MILK_BEGIN_596; 12002: J9TP_GAIN_12; 12012: J9TP_ROOM_MILK_OUTPUT_596; 12013: J9TP_GAIN_11; 12027: J9TP_ROOM_MILK_FINISH_596; 12033: J9TP_ROOM_MILK_BEGIN_597; 12042: J9TP_GAIN_10; 12052: J9TP_ROOM_MILK_OUTPUT_597; 12053: J9TP_GAIN_9; 12067: J9TP_ROOM_MILK_FINISH_597; 12073: J9TP_ROOM_MILK_BEGIN_598; 12082: J9TP_GAIN_8; 12092: J9TP_ROOM_MILK_OUTPUT_598; 12093: J9TP_GAIN_7; 12107: J9TP_ROOM_MILK_FINISH_598; 12113: J9TP_ROOM_MILK_BEGIN_599; 12122: J9TP_GAIN_6; 12132: J9TP_ROOM_MILK_OUTPUT_599; 12133: J9TP_GAIN_5; 12147: J9TP_ROOM_MILK_FINISH_599 |
| interaction_result | 313: J9TP_ACTIVITY_DUAL; 374: J9TP_ACTIVITY_ASSISTED; 426: J9TP_ACTIVITY_COACH; 458: J9TP_ACTIVITY_ESCORT; 469: J9TP_ACTIVITY_SCHOOL; 715: J9TP_ACTIVITY_MASTER; 785: J9TP_ACTIVITY_MASTER_ASSISTANT; 855: J9TP_ACTIVITY_SEX_LESSON; 960: J9TP_ACTIVITY_SEX_SPECIAL; 1296: J9TP_PRAISE_SLAVE; 1329: J9TP_PRAISE_ASSISTANT; 1434: J9TP_GAIN_78; 1441: J9TP_GAIN_77; 1519: J9TP_ACTIVITY_MILKING; 1542: J9TP_GAIN_76; 1552: J9TP_MILKING_OUTPUT; 1553: J9TP_GAIN_75; 1578: J9TP_ACTIVITY_FARMHAND; 1621: J9TP_GAIN_74; 1690: J9TP_ACTIVITY_LECTURE_A; 1703: J9TP_GAIN_73; 1725: J9TP_ACTIVITY_LECTURE_S; 1738: J9TP_GAIN_72; 1766: J9TP_ACTIVITY_COMPETITION; 1832: TRAITS_BODY_COMPETITION_SLAVE; 1833: J9TP_GAIN_71; 1839: TRAITS_BODY_COMPETITION_ASSISTANT; 1840: J9TP_GAIN_70; 1854: J9TP_ACTIVITY_FINISH |
| interaction_city | 1: J9TP_ACTION_SCOPE_interaction_city; 1919: J9TP_SPARRING_BEGIN_1297; 1944: J9TP_GAIN_82; 1945: TRAITS_BODY_SPAR_STAMINA_SLAVE; 1955: J9TP_GAIN_81; 1956: TRAITS_BODY_SPAR_GLADIATRIX_SLAVE; 1968: J9TP_SPARRING_FINISH_1297; 1976: J9TP_SPARRING_BEGIN_1298; 2001: J9TP_GAIN_80; 2002: TRAITS_BODY_SPAR_STAMINA_ASSISTANT; 2012: J9TP_GAIN_79; 2013: TRAITS_BODY_SPAR_GLADIATRIX_ASSISTANT; 2025: J9TP_SPARRING_FINISH_1298; 4568: TBV_CONTRACT_BASE; 4595: TBV_CONTRACT_REWARD_5; 4599: TBV_CONTRACT_REWARD_4; 4603: TBV_CONTRACT_REWARD_3; 4664: TBV_CONTRACT_REWARD_2; 4668: TBV_CONTRACT_REWARD_1; 4672: TBV_CONTRACT_REWARD_0; 4931: TBV_SPECTRE_REWARD_0; 4932: TBV_SPECTRE_REWARD_1; 12107: TBV_HAGGLE_VALUE; 12116: TBV_HAGGLE_TEXT; 12133: TBV_HAGGLE_FAVOR_12095; 12159: TBV_HAGGLE_FAVOR_12119; 12277: TBV_AUCTION_REWARD_M_0; 12278: TBV_AUCTION_REWARD_M_1; 12377: TBV_AUCTION_REWARD_F_0; 12378: TBV_AUCTION_REWARD_F_1; 12480: TBV_SUBPURCHASER_REWARD; 12484: TBV_SUBPURCHASER_BASE; 16763: TBV_GIFT_ANAMELEH; 22469: TBV_TOP_interaction_city_880900; 22515: TBV_TOP_interaction_city_882346; 31188: TBV_GIFT_BIKER |
| interaction_result_city | 4: TBV_SALE_REWARD_SNAPSHOT; 83: TBV_FIXED_PRICE_78; 91: TBV_SALE_REWARD_0_2; 97: TBV_SALE_REWARD_0_1; 100: TBV_SALE_REWARD_0_0; 154: TBV_SALE_REWARD_1_4; 161: TBV_SALE_REWARD_1_3; 166: TBV_SALE_REWARD_1_2; 172: TBV_SALE_REWARD_1_1; 176: TBV_SALE_REWARD_1_0; 200: TBV_FIXED_PRICE_177; 211: TBV_SALE_REWARD_2_3; 215: TBV_SALE_REWARD_2_2; 241: TBV_FIXED_PRICE_215; 246: TBV_SALE_REWARD_2_0; 247: TBV_SALE_REWARD_2_1; 385: TBV_SALE_REWARD_3_3; 391: TBV_SALE_REWARD_3_2; 396: TBV_SALE_REWARD_3_1; 403: TBV_SALE_REWARD_3_0; 892: TBV_SALE_REWARD_CLEANUP |
| slave_auction_sell | 20: TBV_MARKET_PREMIUM; 54: TBV_MARKET_CHOICE; 58: TBV_MARKET_OLD_LINK; 66: TBV_MARKET_TEXT |
| slave_auction_sell_end | 4: TBV_FARID_REWARD |
| #var_base | 849: TBV_TOP_DUP_slave; 860: TBV_TOP_DUP_assistant |
| #dynamic | 885: J9TP_GAIN_4; 895: J9TP_GAIN_3; 907: J9TP_GAIN_2; 1124: J9TP_FIXED_SKILL_WORK; 1165: TRAITS_BODY_MAIN_XP; 1166: J9TP_GAIN_1; 4927: TBV_SURGERY |
| #variative | 325: TBV_BEAUTY_LABEL; 1251: TBV_BEAUTY_FORMULA_LABEL |
| #static_base | 666: J9TP_GRADECHECK; 1236: TBV_BASE_PRICE; 1921: TRAITS_DISPLAY_DYNSLAVE_COG_DISPLAY |
| начать_бой | 96: TRAITS_COMBAT_RELAY_LOOP; 249: TRAITS_COMBAT_SETUP_GENERAL |
| рассчет_вреда | 57: TRAITS_COMBAT_DAMAGE |
| выход_из_боя | 6: TRAITS_COMBAT_WIN |
| $catfight_fight_start | 63: TRAITS_COMBAT_SETUP_CATFIGHT |
| jo9_meiki_sale | 5: TBV_HAGGLE_ELIGIBLE; 13: TBV_HAGGLE_NATIVE57 |
| jo9_traits | 1: TRAITS_REGISTRY |
| jo9_traits_personality | 1: J9TP_MODULE |
| jo9_traits_combat | 1: TRAITS_COMBAT |
| jo9_traits_value | 1: TBV_HELPER |

코드 블록을 임의로 통째로 삭제해도 안전하다는 뜻은 아니다. 특히 호출부만 남기고 로케이션을 지우면 해당 호출에서 오류가 난다. if/end 일부, 함수 인자 일부만 지우면 문법이나 반환 계약이 깨진다. 기능을 제거할 때는 호출부와 모듈을 함께 검토하고, 정확한 변경 전 본문으로 되돌리는 역패치를 사용한다. 기존 인물 키를 무조건 지우거나 값 1로 자동 통과시키는 복구는 하지 않았다. UI 표식만 지우면 기능은 계속 실행된다. 아래 세 도메인 설명에는 구체적인 호출·반환·부작용·제거 결과가 있다.

## 검증과 한계

- 최종 Play 기준 전: f74f7491787ad6a27b8d211240275ffc55b00bbdb7defb6b34274cf96c0d1610
- 최종 후보: f22c02dd2e206bc2ec31d768a8c59fa6d571d4331eb262703214e7b8a4f00dff; 로케이션 259개.
- 수정 없는 QSP 왕복, 정확 치환, 표준 apply_mods 재생·재적용, 정확 역복구를 검사한다.
- 공통 등록·편집 Native5.7 115개, 성격 Native5.7/WASM5.8 각45개, 전투 통합 Native5.7 133개와 실제 전체 후보 추가10개, 가치 Native5.7 110개/WASM5.8 104개가 통과했다.
- 기존 대사 1단계 2042개 검사와 1112 본문·#txt_man 보존을 검사한다. 인물 편집기 기존57개와 공유 판매 연결4개를 검사한다.
- 테스트는 실제 QSP 엔진으로 계산과 호출을 실행한다. 일부 전투·화면 의존성은 테스트 환경에서 표시용 스텁을 쓴다. 게임 클라이언트 실행·화면 배치·실제 저장 파일 선택과 로드는 사용자 확인 범위이며 자동 조작하지 않았다.
- 과거 변경 이력 전체는 수동 수정 후의 본문과 일치하지 않는 기록이 있어 한 번에 재생됐다고 주장하지 않는다. 이번 패치는 최신 Play 동결본에서 정확 재생·역복구했다. 배포 동기화는 Play가 최신이라는 사용자 지시에 따라 별도 백업과 파일 해시 기록을 남긴다.


---

# 성격 특성 모듈 — J9TP

`module.json`은 새 로케이션 `jo9_traits_personality` 하나와 기존 본문의 일치 횟수 1인 수정 조각 221개를 제공한다. 이 폴더에서만 작성했으며 Play/배포본/저장소에는 직접 쓰지 않았다. 각 조각은 배열 순서대로 적용해야 한다. 원래 명령·대사·조건은 유지하고 호출과 수치 반환 래퍼를 추가했다. 기존 5개 교육/지시 결과의 텍스트 평가 FOR 문은 실제 5.7 엔진에서도 실행되도록 동일한 시작값·상한·증가량의 라벨 반복문으로 바꿨다. 상한 미달 시 0회 실행하는 조건도 유지한다.

## 호출 규약

일반형은 `gs 'jo9_traits_personality', 모드, 인물슬롯, 주제, 수치`이다. 반환값이 필요한 XP/성과는 `func`로 호출한다. `slave`, `assistant`, `room1`~`room4`, `cow`, `prisoner`, `farmhand`, `stock`, `iced`, `dynslave`처럼 실제 슬롯 이름을 받는다. 다른 슬롯의 배열을 고정해서 읽지 않는다.

| 모드 | 뒤의 인자 | 반환 및 변경 |
|---|---|---|
| `gradecheck` | 슬롯 | 야심가의 현재 지식 15개·성 개별 기술 39개·ST 9개를 비교한다. 첫 호출은 기준만 저장한다. 실제 증가를 발견하면 그날의 칭찬 자격을 기록한다. |
| `praise` | 슬롯 | 먼저 등급 비교. 그날 증가 후 첫 칭찬이면 기분 누적치 +5, 알려짐 1, 그날 사용 표시. 응석에는 쓰지 않는다. |
| `activity` | 슬롯, 정규 주제, 고정 규칙 여부 0/1 | 실제 수행한 작업/교육 1회를 센다. 첫 일일 수행은 중립, 두 번째부터 일중독 +2/안주 -2. 고정 규칙 1이면 여기까지 적용하고 집중의 이전 주제는 유지한다. |
| `xp` | 슬롯, 성장 항목, 최종 양의 XP | 현재 수행에만 적용한다. 끈기 +10%, 산만 -10%. 0·음수는 원래 값. 기존 천재/바보 및 체질 보정의 바깥에 중첩한다. |
| `performance` | 슬롯, 항목 문자열, 원래 수치 | 산만의 연속 수행 중 양의 작업 성과 ×9/10, 그 외 원래 값. 정수 버림이며 작은 성과는 0이 될 수 있다. 영구 기술 등급은 바꾸지 않는다. |
| `finish` | 슬롯 | 해당 수행의 집중 보정을 해제한다. 이전 주제는 지워지지 않는다. |
| `decay` | 슬롯 | 원래 야간 부정 기분 기억 -1 처리를 대신한다. 지정한 사건 기억만 회복 속도를 바꾸며 다른 기분 항목은 원래 -1을 유지한다. |

`activity`는 거부/자격 미달 분기 바깥으로 이동하면 안 된다. 열심히 하지 않아 XP가 0인 경우라도 수행을 완료했다면 1회다. 같은 과목의 주인은 교사가 바뀌어도 같으며 `learn:cook`과 `work:cook`은 구분한다. 구형 `slave_rate["cook"]` 및 다른 인물의 같은 표현은 `cook`으로 정규화한다. 인물이 직접 고른 연속 과제는 날짜가 바뀌어도 이어진다. 규칙으로 수행한 자동 일은 그 연속 기록을 끊거나 늘리지 않는다.

## 기존 호출 위치와 의존성

- `#static_base / $dyn_calc_slave_attrs`: 원래 등급 재계산의 끝에서 `gradecheck`. 직접 증가시키는 구형 교육/성 기술 경로도 다음 재계산 또는 칭찬 직전에 잡힌다. 새/기존 인물 초기화 시 root가 `gradecheck`를 호출해야 이전 등급을 새 증가로 오인하지 않는다.
- `interaction_result`: 실제 수락된 지시, 양쪽 인물 작업, 조수/주인/강사/학교 교육, 성 교육, 강의, 경쟁 교육, 착유의 수행 시작. 조수가 가르치는 행위도 조수 자신의 작업으로 센다. 학교 규칙 동행은 조수의 고정 작업으로 센다. 보통 칭찬과 조수 칭찬에 추가 효과만 넣었다.
- `#dynamic / $dyn_skill_rise`, 성 XP 보조 경로 및 `interaction`의 기존 XP 명령: 원래 XP 함수를 중첩해 보존. `interaction_result`의 구형 경쟁 교육 문자열도 같은 방식이다. 체질 모듈이 동일한 원래 표현을 감싸면 root가 `focus(combat(cognitive(original)))` 순서로 병합한다.
- `next_day`: 기존 요리/청소의 공통 기술 상승 경로와 실제 성공한 목욕/규칙 교육/착유 보조 작업에 일일 작업 횟수. 기존 실패 -1 표시는 수행으로 세지 않는다. 이전 야간 회복 호출 하나를 `decay`로 교체한다. 원래 동결 인물 제외 목록을 바꾸지 않는다.
- `interaction`: 청소, 요리, 공연, 마사지, 씻기기 및 착유의 실제 수치 출력에 산만 성과 반환값. 개인실 착유도 해당 실제 인물의 키로 처리한다. 농장 일꾼이 착유하면 병 수의 작업 성과는 작업자인 일꾼을 기준으로 하고 젖소의 기술 XP는 젖소에게 귀속된다.
- `interaction_city`: 연습 대련 1297/1298은 교육으로 세고 양의 전투술/지구력 XP를 보정한다. 기존 패배/소진 손실·A 제한·조건은 보존한다. 실전 전투 보상에는 교육 횟수를 붙이지 않았다.
- `finish`는 결과를 떠나기 전에 호출하고, 원래 중간 GOTO가 있는 경로의 잔여 보정을 막기 위해 새 `interaction`/`interaction_city` 준비 시작에서도 해제한다. 이전 연속 주제는 계속 남는다.

모듈이 의존하는 원래 자료는 `$sex_atr`의 현재 필드 목록, `$slave_bad_mood`, `day`, actor/actor_rate 배열이다. `jo9_learning_xp`의 천재/바보 효과와 원래 양·음수 조건을 그대로 감싼다. 별도 게임 클라이언트 실행이나 파일/네트워크 호출은 없다.

## 저장되는 상태

모든 인물별 키는 원래 actor 배열 안에 있으므로 원래 슬롯 교환·저장·동결 복사 기능을 그대로 따른다. 다른 인물의 카운터를 공유하지 않는다.

| 키 | 내용/해제 |
|---|---|
| `$actor['jo9_ambition_levels']` | 위 63개 등급의 한 글자씩 된 기준 문자열. 야심가 1인 경우에만 작성. 편집기로 야심가를 새로 붙일 때 지우고 `gradecheck`로 초기화한다. |
| `jo9_ambition_grade_day`, `jo9_ambition_used_day` | 당일 증가/당일 추가 칭찬 사용. 값은 `day+1`이라 초기 0과 첫날을 구분한다. |
| `jo9_activity_day`, `jo9_activity_count` | 일중독/안주에 필요한 일일 횟수. 다음 실제 수행에서 날짜가 다르면 0부터 다시 센다. |
| `$actor['jo9_focus_subject']` | 마지막 수동 작업/교육의 정규 주제. 고정 규칙 작업은 바꾸지 않는다. |
| `jo9_focus_active` | 현재 수행의 -1/0/+1 보정. 시작 때 설정하고 결과/새 준비에서 0으로 해제한다. |
| `jo9_focus_xp_credit` | XP의 ±10%를 소수점 없이 정확히 누적하기 위한 부호 있는 십분의 1 XP 잔여. 예를 들어 +1 XP 10회는 끈기에서 총 11 XP가 된다. 음수 XP는 이 잔여에도 손대지 않는다. |
| `jo9_memory_` + 원래 부정 기억 키 | 2/3 또는 10/7 야간 회복의 분자 잔여. 기억이 끝나면 0. 특성이 없을 때 0인 잔여 키를 새로 만들지 않는다. |
| 승인된 `jo9_ambition_known`, `jo9_work_ethic_known`, `jo9_focus_known`, `jo9_grudge_known` | 실제 첫 효과에서 1. 정의/표시/편집기는 root 소유. |

일중독과 안주, 끈기와 산만은 각각 승인된 단일 -1/0/+1 값이므로 동시에 존재하지 않는다. 모듈은 승인 범위 밖 값 2 등을 중립으로 처리한다. 런타임 임시는 `jo9_trait_personality_` 접두어이며 반환 전 모두 `killvar`한다. 실제 5.7 엔진에 없는 LOCAL 명령은 사용하지 않는다.

## 사건 기억의 정수 근사

초기 기억 강도와 즉시 기분 손해는 바꾸지 않는다. 야간마다 원래 1씩 줄던 기억을 뒤끝 있는 성격은 평균 2/3씩, 너그러운 성격은 평균 10/7씩 줄인다. 따라서 10일 기억은 각각 15일/7일이며, 원래 1일처럼 짧은 기억은 반올림 오차가 더 눈에 띈다. 회복 약/칭찬 등 원래의 별도 즉시 기억 회복 명령은 유지한다.

대상: `neg_pain`, `neg_abuse`, `neg_disgust`, `neg_no_praise`, `neg_shame`, `neg_prisoner`, `neg_job`, `neg_forced`, `neg_raped`, `neg_defloration`, `neg_artifact`, `neg_cheap_gift`, `neg_cheap_reward`, `neg_pony_died`, `neg_sa_catfight`, `neg_sa_love_lost2`, `neg_sa_demote`, `neg_sa_friend_prisoned`, `neg_sa_friend_punished`, `neg_sa_love_lost1`, `neg_another_sleep_together`.

배고픔·질병·월경·피로·중독·더러움 등 계속되는 몸 상태와 매일 다시 평가하는 규칙/관계 상태는 대상에 넣지 않았다. 인물 동결 중에는 기존 야간 목록대로 자연 회복하지 않는다.

## 새 게임/기존 저장의 캐시

`#static_base`, `#dynamic`의 바뀐 템플릿을 다시 로드하고 `build-info.json`의 `cacheFlags` 16개를 0으로 돌린다. 추가 기능을 끄려면 호출부와 로케이션을 함께 제거한다. 호출부만 남기면 없는 로케이션 오류가 난다. 데이터 키만 남는 것은 원래 actor 배열 값이므로 새 모듈이 없으면 효과가 없지만, 원상복구는 선언된 수정 조각의 역적용으로 해야 한다.

## 검증

먼저 수정 전 실제 등급 재계산/칭찬을 실행해 “기분 +5 기대, 실제 0”으로 실패하는 것을 `red-output.txt`에 기록했다. 구현 뒤 `node test.cjs`로 실제 생성 QSP를 Windows 32비트 native 5.7.0 DLL에서 실행했다. `node wasm-test.cjs`는 같은 생성 QSP와 같은 테스트 코드를 WASM 5.8.0에서 실행했다. 두 엔진 모두 45개 확인, 실패 0, 엔진 오류 0이다.

검증에는 실제 원래 지시 결과·기술 상승·청소 출력 본문을 사용한다. 거부 시 횟수/XP 없음, 첫 작업 기본 XP, 둘째 작업 -10%, 청소 48→43, 조수 자신의 키 사용, 칭찬 한 번/일, 기분 +5와 응석 불변, 새 날짜, 레거시 기준, 동결 초기화, 빈/잘못된 enum, canonical 표현, 짧은 XP 정수 잔여, 10→15/7일 기억, 병/허기 제외, scratch 정리가 포함된다. 게임 UI 전체 실행·모든 수작업 대사 경로 클릭은 하지 않았다. 최종 합본의 캐시/표시/확률/편집기 및 기존 회귀 검증은 root 통합 단계다.


---

# 신체·전투 특성 구현 설명서

기준은 `APPROVED_SPEC.md`와 2026-10-17 Play 동결본이다. 산출물은 이 폴더에만 작성했으며 실제 Play·Distribution·저장소·동기화 참조 파일을 수정하지 않았다.

## 구성과 호출 관계

`module.json`은 새 `jo9_traits_combat` 로케이션 1개와 기존 본문에 순서대로 적용하는 정확 일치 편집 21개이다. 모든 기존 편집은 `count:1` 조건을 가진다. 실제 소스는 `jo9_traits_combat.qsrc`, 재생성기는 `build.cjs`이다.

| 패치 ID | 위치 | 역할 |
|---|---|---|
| TRAITS_COMBAT_SETUP_GENERAL | начать_бой | 기존 동료별 계산·난이도·갑옷 적용 뒤 신체/직업/용기 최대치를 계산한다. |
| TRAITS_COMBAT_SETUP_ARENA | $gladiator_fight_start | 기존 투기장 출전자를 slave로 기록하고 최대치를 계산한다. |
| TRAITS_COMBAT_SETUP_CATFIGHT | $catfight_fight_start | 기존 캣파이트 출전자를 slave로 기록하고 최대치를 계산한다. |
| TRAITS_COMBAT_DAMAGE | рассчет_вреда | 기존 공격 유형·상태·저항 계산 뒤, 기존 최소 피해 처리 전에 현재 조건으로 공격·방어 배수를 적용한다. |
| TRAITS_COMBAT_WIN | выход_из_боя | 안개 동료 정산·사망 처리·주인공 교대 상태가 지워지기 전에 실제 승자를 기록한다. |
| TRAITS_COMBAT_RESET | $combat_variable_reset | 전투 임시 배열과 출전자 슬롯을 정리한다. |
| TRAITS_BODY_MAIN_XP | #dynamic / $dyn_skill_rise | 기존 천재/바보 보정 결과를 신체 보정에 전달한다. |
| TRAITS_BODY_COMPETITION_SLAVE / ASSISTANT | interaction_result | 기존 두 사람의 교육·경쟁 경험치 경로에도 같은 보정을 적용한다. |
| TRAITS_BODY_SEDUCTION_XP | interaction / $interaction_lesson_seduction | 기존 유혹 교육에서 직접 주는 유연성 경험치에도 같은 보정을 적용한다. |
| TRAITS_BODY_SPAR_GLADIATRIX_SLAVE / ASSISTANT | interaction_city 1297/1298 | 연습 대련의 전투술 경험치에 기존 천재/바보 이후 신체 보정을 적용한다. |
| TRAITS_BODY_SPAR_STAMINA_SLAVE / ASSISTANT | interaction_city 1297/1298 | 연습 대련의 양수 지구력 +2를 건강 +3 / 병약 +1로 보정한다. 과훈련 -2는 유지한다. |
| TRAITS_COMBAT_RELAY_LOOP | начать_бой | 기존 안개 교대의 특수기 슬롯 1~10 초기화를 네이티브 5.7에서 실행되는 동일한 계수형 레이블 반복문으로 바꾼다. |

일반 전투에서는 `combatant=1/2`를 각각 slave/assistant로 매핑한다. 기존 투기장 두 진입점은 `combatant=1`을 설정하지 않으므로 출전자 슬롯을 명시적으로 slave로 기록한다. 기존 나이·상태·타고난 전사 `gladiatrix_affinity` 조건은 유지한다. 추가 출전 자격 조건을 만들지 않는다.

## 공개 모드와 입출력

- `gs 'jo9_traits_combat','setup', ROLE, HP, STA, MORALE`: ROLE은 빈 문자열(주인공), slave, assistant 등 현재 액터 슬롯 이름이다. 뒤의 세 숫자는 **이번 전투에서 기존 계산을 마친 보정 전 최종 최대치**이다. 반환 숫자는 없으며 전투 최대치와 배수가 실제로 적용된 자원의 시작 현재치를 갱신한다. 기존 진입점은 매번 원래 공식을 재계산한 뒤 이 모드를 한 번 호출하므로 새로고침해도 배수가 누적되지 않는다. 이미 보정한 최대치를 다시 입력하는 용도로 사용하지 않는다.
- `gs ...,'damage'`: 현재 atk/def와 현재 HP/STA/사기를 읽고 이번에 재계산한 `нанесенный_вред[atk]`만 보정한다. 캐릭터의 영구 공격/갑옷 수치를 수정하지 않는다.
- `gs ...,'finish'`: 결과가 승리이고 연습이 아니며 이번 전투가 아직 기록되지 않은 경우에만 저장된 출전자의 누적 실전 승수를 1 올린다. 기존 중간 전투 저장에는 새 출전자 기록이 없으므로 기존 arena 반환값 또는 combatant로 승자를 복구한다. 출전 후 액터 id가 바뀌었다면 다른 사람에게 승리를 넘기지 않는다.
- `gs ...,'win', ROLE`: 위 finish에서만 사용하는 내부 승수 반영 함수이다. 직접 호출하면 결과·연습 검사를 우회하므로 일반 호출자는 finish를 사용한다.
- `func(...,'education_xp', ROLE, AMOUNT, SUBJECT)`: 이미 천재/바보를 적용한 이번 경험치를 받아 신체 보정 후 숫자를 반환한다. SUBJECT는 stamina/calisthenics/gladiatrix/dressage 또는 기존 `slave_rate["stamina"]` 형태이다. 이외 과목·0·음수는 그대로 반환한다. 누적 경험치·등급을 직접 수정하지 않는다.
- `gs ...,'reset'`: 전투 출전자·중복 기록 방지 임시 상태를 삭제한다. 저장되는 특성·누적 승수는 삭제하지 않는다.
- `gs ...,'clean'`: 내부 계산 임시변수만 정리한다. 네이티브 5.7은 LOCAL을 지원하지 않아 `jo9_trait_combat_` 접두사 전역 임시변수를 각 경로 종료 시 명시적으로 삭제한다.

## 수치와 정수 처리

건강/병약은 최대 HP·STA에 각각 3/2·1/2, 버서커는 최대 STA·사기에 3/2, 베테랑은 세 최대 자원에 3/2, 용감/겁쟁이는 최대 사기에 3/2·1/2를 적용한다. 독립 축의 분자·분모를 먼저 곱한 뒤 나누므로 건강+베테랑은 9/4를 한 번 적용한다. 예를 들어 기본 101은 227이 된다. HP의 기존 최소 1은 유지한다. 용기 값 2에는 새로운 배수를 추가하지 않는다.

버서커는 `현재HP*100 <= 최종최대HP*30`일 때 이번 공격 피해를 2배 한다. 팔라딘은 `현재STA*2 >= 최종최대STA`와 `현재사기*2 >= 최종최대사기`가 모두 참일 때 받는 피해를 1/2로 한다. 이 엔진에는 독립적인 숫자 방어력 변수가 없으므로 승인된 방어력 2배를 위 방식으로 구현했다. 기존 최소 피해와 해당 난수 규칙은 유지된다. 따라서 최소 피해 구간에서는 표시 피해가 정확히 절반일 필요는 없다.

교육 경험치는 기존 천재/바보 보정 다음에 건강 3/2·병약 1/2를 적용한다. 천재/바보의 stamina 제외를 유지한다. 정수 나눗셈은 버림이며, 양수 경험치가 병약 보정 때문에 0이 되는 경우 기존 바보 보정과 같이 최소 1을 유지한다. 예: 건강+천재 calisthenics 10→20→30, stamina 10→10→15, 과훈련 stamina -5→-5이다. 성격의 끈기/산만 경험치 보정은 이 결과 바깥에 중첩하도록 루트·성격 담당자에게 공유했다.

## 저장 상태와 교대

액터별 영구 필드는 `jo9_constitution`, `jo9_combat_trait`, `jo9_real_wins`이다. 앞 두 값의 생성·편집 UI는 루트 담당이다. `jo9_real_wins`는 새 누적 실전 승수이며 기존 `winning_series` 연승 필드를 가져오거나 덮어쓰지 않는다. 과거 승리를 추정하지 않고 새 필드가 없는 기존 액터는 0부터 센다. 누적 실전 승수가 10 이상이고 5의 배수인 승리에서 특성이 없으면 한 번 `rand(1,100)`으로 추첨한다. 1~3은 광전사, 4~6은 성기사, 7~9는 역전의 용사, 10~100은 미획득이다. 이미 있는 특성은 재추첨하지 않는다. 편집기로 특성을 지워도 다음 10·15·20…승 체크포인트에서만 추첨한다.

전투 중에는 `$jo9_trait_combat_actor`와 `jo9_trait_combat['id'/'won']`만 남겨 저장·불러오기 후에도 출전자와 중복 방지를 유지한다. 모든 계산 임시는 정리한다. 안개 동료가 직접 이기면 정산 전에 그 동료가 승수를 받는다. 동료 패배 후 주인공이 이어서 이기는 경우에는 `jo9_fog['switched']=1`과 주인공 진입의 빈 역할을 통해 패배 동료에게 승수를 주지 않는다. 연습은 `colosseum_fight>0`일 때 제외한다.

기존 액터 교체/냉동 저장은 배열 키 전체를 복사하므로 새 영구 키도 같은 사람을 따라간다. 이번 도메인은 별도 저장 파일이나 저장 마이그레이션 배열을 만들지 않는다.

## 의존성과 분리/삭제 시 영향

호출부는 새 로케이션이 존재해야 한다. 호출부만 남기고 로케이션을 빼면 로케이션 찾기 오류가 난다. 로케이션과 호출부를 같이 제거하면 새 배수·승수 획득·신체 교육 보정이 중단된다. 이미 저장된 특성/승수 키는 남지만 사용되지 않는다. 기존 최대치·승수·경험치 공식을 제거하지 않았으므로 이 도메인의 태그만 정확히 역적용하면 원래 로직으로 돌아간다. 안개 FOR 호환 수정은 신체 특성과 독립적인 기존 교대 오류 수정이므로 따로 유지할 수 있다.

`#dynamic`의 `$dyn_skill_rise`는 저장에 캐시되는 실행 문자열이다. 통합 버전 부트스트랩에서 `gs '#dynamic'`을 실행하여 기존 저장의 문자열을 새 본문으로 갱신해야 한다. 이 정의에는 별도 `code_defined` 조건이 없다. 직접 유연성 경험치가 있는 유혹 교육은 캐시된 `$interaction_lesson_seduction`에 속하므로 `code_defined['interaction_lesson_seduction']=0`으로 초기화하여 다음 교육 선택 시 다시 정의해야 한다. interaction_result의 두 경쟁 호출과 interaction_city의 대련 결과는 저장 캐시가 아닌 로케이션 본문이다.

경험치 추가 감사에서 실제 교육인 유혹 수업과 연습 대련의 직접 증가 경로를 포함했다. 실제 경기·퀘스트 전투 보상, 전차 경주 보상, 일과 종료의 자동 몸놀림 향상, 성행위 모드의 탈의 행동 보너스는 교육 경로가 아니므로 이 교육 보정의 범위를 넓히지 않았다. 영양·치료·휴식으로 회복하는 지구력은 운동 교육 경험치가 아니다.

## 검증

실행 명령: `node outputs/traits-batch-20261017/domain-combat/build.cjs`, 이어서 `node outputs/traits-batch-20261017/domain-combat/test.cjs`.

네이티브 QSP 5.7.0 DLL을 32비트 PowerShell에서 사용했다. 원래 배포할 새 함수와 기존 수정 로케이션 본문을 그대로 QSP로 생성하여 실행했으며 FOR/LOCAL 등 문법을 테스트에서 변환하지 않았다. 화면·DB 의존 로케이션만 빈 대역으로 대체했고 실제 게임 클라이언트를 실행하지 않았다. GT가 현재 호출을 끝내는 엔진 동작 때문에 명령을 여러 QSPExecString 호출로 나누며, 마지막 완료 sentinel이 실행되고 실패 수가 0인지 확인한다.

`test-results.json`: 129개 검증, 단위 225명령·통합 55명령, 엔진 오류 0·검증 실패 0. 무특성 원래 수치, 모든 신체/직업/용기 배수, 독립 배수의 한 번 계산, 실제 반복 전투 초기화, 타고난 전사 공존, HP30%/STA·사기50% 및 홀수 최대치 경계, 실제 피해 재계산과 최소 피해, 실제 두 투기장 승리 출전자, 새 누적10승과 연승 독립성, 연습/패배 제외, 출전자 id 교체 방지, 안개 조수 직접 승리, 실제 동료 패배→주인공 교대→승리, 캐시된 교육 문자열의 실제 천재/신체 순서 및 음수 손실, 두 역할의 실제 유혹 수업 유연성 및 대련 전투술·지구력 증가와 과훈련 손실, 300회 직업 추첨의 세 값 도달과 영구성 등을 확인했다.

통합 최종본은 성격 도메인의 같은 경험치 RHS 중첩과 루트 캐시 부트스트랩을 추가한 뒤 다시 검증해야 한다. 화면 외형·클라이언트 상호작용 검증은 이 엔진 테스트에 포함되지 않는다.


---

# 가치·외모 특성 구현 인계

기준은 `../before.qsp`와 `../APPROVED_SPEC.md`이다. `module.json`은 새 로케이션 `jo9_traits_value` 1개와 기존 본문의 정확한 치환 74개를 담는다. 기존 편집·원문은 이 모듈만으로 직접 덮어쓰지 않는다. 루트 통합기가 `edits` 순서대로 각 `old`가 정확히 1회인지 확인하여 반영해야 한다. 모든 변경의 식별자는 `TBV_*`이며 새 코드에는 `JO9 MOD START/END`가 있다.

## 동작과 저장 상태

- `actor['jo9_versatile']=1`: 다재다능. 아래 24개 표시 등급이 각각 4(A) 이상일 때 자동으로 1이 된다. 이후 등급이 내려가도 자동으로 사라지지 않는다.
- `actor['jo9_versatile_manual_off']=1`: 편집기에서 명시적으로 제거한 경우 자동 재획득만 막는다. 기존 세이브에서 없는 키는 0이므로 자동 발견이 정상 작동한다. 수동 추가 시 루트 편집기가 이 키를 0으로 되돌린다.
- `actor['jo9_peerless']=1`: 절세미인. 기존 외모율과 임시 외모율에서 기존 0~5 등급을 다시 계산하고 1등급을 더한다. 상한은 6이다. 원래 최고 외모5가 6(S++)이 되며 흉터·멍·체격에 따른 기존 임시 외모율은 그대로 읽는다. `base_beauty`와 원래 외모율 상한 200은 변경하지 않는다. 특성을 제거하면 다음 갱신에서 기존 외모로 돌아간다.
- 외모6이 종합 등급 11을 만들지 않는다. 종합 등급의 기존 최대 10(S+)을 유지한다.
- 신규 랜덤 생성의 확률·프리셋 제외·수동 편집기·특성 목록 표시는 루트 모듈의 책임이다. 이 모듈은 기존 인물에게 무작위 특성을 부여하지 않는다.

다재다능에 필요한 개별 표시 필드는 다음과 같다. 합계나 평균으로 대신하지 않는다. S.T는 표시 열의 약칭이며 별도의 내성 수치를 추가하지 않는다.

| 표시 열 | 배열 키 |
| --- | --- |
| 지식/기술 15개 | `service`, `cook`, `secretary`, `expression`, `nurse`, `alchemy`, `enchanter`, `stamina`, `gladiatrix`, `calisthenics`, `music`, `art`, `pet`, `dressage`, `cowSK` |
| S.T 9개 | `petting`, `oral`, `penetration`, `orgy`, `roleplay`, `fetishism`, `xenophily`, `nipplefuck`, `lesbiansex` |

새 키는 기존 인물 배열 안에 있으므로 기존 인스턴스 교환·보관·저장 경로를 따른다. 새로운 독립 저장소나 세이브 재작성은 없다. 모든 실행 임시 변수는 `jo9_trait_value_*` 접두사를 가지며 해당 계산이 끝나면 정리된다. 판매 완료 보상의 임시 플래그는 기존 코드가 인물 배열을 먼저 지우는 경우에만 전달하기 위한 값이다.

## 호출 규약

모든 모드의 `$args[0]`는 모드, `$args[1]`는 인물 배열 이름이다. 이름은 기존 코드처럼 `slave`, `assistant`, `stock`, `dynslave`, `room1` 등을 사용한다. 역할을 노예로 고정하지 않는다.

| 호출 | 결과와 영향 |
| --- | --- |
| `gs 'jo9_traits_value','refresh',role` | 외모 재계산 및 다재다능 자동 획득. 반환값을 사용하지 않는다. 반복해도 등급이나 가격이 누적되지 않는다. |
| `func('jo9_traits_value','base_price',role,amount)` | 다재다능이면 입력 금액에 `amount/4`를 한 번 더한 값. 원래 가격 변수를 직접 저장하지 않는다. 정수 나눗셈의 나머지는 버린다. |
| `gs 'jo9_traits_value','surgery',role` | 현재 외모가 정확히5이고 아직 절세미인이 아닐 때 `rand(1,100)<=5`이면 특성1과 외모6을 부여한다. 짧은 비노골적 대성공 문장 한 줄을 표시한다. 비용 등 기존 수술 처리는 호출자가 그대로 수행한다. |
| `func('jo9_traits_value','premium',role)` | 기존 명기 또는 절세미인이면1, 아니면0. 시장의 기존 특별 가격 선택지를 여는 데만 쓴다. |
| `func('jo9_traits_value','market',role,amount)` | 기존 명기나 절세미인이면 ×10, 둘 다 있으면 그 결과에 ×1.5를 한 번 적용하여 ×15. 특성이 없으면 입력 그대로. |
| `func('jo9_traits_value','auction',role,amount)` | 기존 명기나 절세미인이면 ×2, 둘 다 있으면 ×3. 특성이 없으면 입력 그대로. |
| `func('jo9_traits_value','haggle',role,amount)` | 두 특성이 모두 있으면 최고 유효 흥정 금액에 ×1.5. 다른 경우 입력 그대로. 기존의 구매자 적합성 및 보유금 상한 안에서만 호출한다. |
| `func('jo9_traits_value','reward',role,amount)` | 절세미인의 기존 양수 보상에 `(amount+1)/2`를 더한다. 1→2, 2→3, 3→5. 0과 음수는 그대로. |
| `func('jo9_traits_value','reward','',amount,savedFlag)` | 인물을 먼저 제거한 기존 인계 경로에서 저장한 절세미인 플래그를 사용한다. 위와 같은 보상 계산이다. |

## 기존 호출부와 의존 관계

| 변경 위치 / 주요 패치 ID | 목적 |
| --- | --- |
| `#static_base` / `TBV_GRADE_REFRESH` | 모든 개별 등급 및 연결된 S.T 등급 계산이 끝난 뒤 해당 인물만 갱신한다. 원래 계산용 동적 문자열 안의 `dynslave` 이름이 기존 치환 방식을 따른다. |
| `$slave_price` / `TBV_PRICE_REFRESH` | 가격만 독립 갱신하는 경로에도 같은 특성 발견과 외모를 적용한다. |
| `#static_base` / `TBV_BASE_PRICE` | 원래 최소 평가액을 계산한 다음 다재다능25%를 한 번 적용한다. 이어지는 Farid 가격·흥정 한도는 그 값을 사용한다. |
| `$cow_price` / `TBV_COW_REFRESH`, `TBV_COW_BASE_PRICE` | 같은 인물이 젖소 역할로 옮겨져도 영구 다재다능을 유지한다. 독립 `cow_base_price`를 기존 감점·협상·최소값 이후25% 가산하고 최종 `cowprice`를 계산한다. 절세미인 특별 배율이나 새 수락 경로를 이 판매처에 추가하지 않는다. |
| `#dynamic` / `TBV_SURGERY` | 기존 공통 수술 함수 앞에서 대성공 여부를 판단한다. 기존 비용, 행동력, 체력율 감소, 재활기간, `beauty_enhanced` 기록과 일반 외모 개선 코드는 유지한다. 노예와 조수 모두 같은 함수 치환을 사용한다. |
| `#variative`, `slave_stat`, `assistant_stat` | 외모6의 `S++` 명칭과 외모 계산 설명의 특성 항목을 제공한다. 기존 `$addon` 툴팁은 이미 등급6의 S++를 지원하므로 수정하지 않는다. |
| `generate_stock`, `interaction_city`, `#var_base` / `TBV_STOCK_TOP_EPITHET`, `TBV_TOP_*` | 최고 외모5를 요구하던 해당 외모 조건만 `>=5`로 넓힌다. 무관한 기술 상한·프리셋 숫자·최소 외모 요구는 바꾸지 않는다. |
| `slave_auction_sell` / `TBV_MARKET_*` | 기존 특별 판매 화면/선택 경로에서 ×10/×15를 한 번 계산한다. Farid 기본가격은 이미25%를 받으므로 다시 적용하지 않는다. 절세미인용 짧은 가격 문구를 사용한다. |
| `$guild_auction` / `TBV_AUCTION_*` | 일반 입찰 결과에 다재다능25%를 한 번, 이어 기존 특별 수집가의 ×2/×3을 한 번 적용한다. 표시되는 최종 금액도 맞춘다. |
| `jo9_meiki_sale`, `interaction_city` / `TBV_HAGGLE_*` | 기존 구매자 관심 분야 조건을 보존하고 명기 또는 절세미인이 해당 최고 흥정 결과를 받게 한다. 다재다능25% 및 두 특성의 추가1.5배를 독립 가격 기준에 한 번씩 적용한다. 기존 수락·거절·구매자 보유금 처리는 유지한다. |
| `interaction_result_city` / `TBV_FIXED_PRICE_*`, `TBV_SALE_REWARD_*` | 고정 등급 가격 판매에도25%를 적용한다. 판매·무상 인계의 기존 양수 관계/평판 보상만50% 가산한다. 인물 삭제 전에 확보한 플래그를 사용하므로 삭제 후에도 반영된다. |
| `interaction_city` / `TBV_CONTRACT_BASE`, `TBV_SUBPURCHASER_BASE` | 계약 완료 시 남은 지급액과 Vong의 독립 평가액에25%를 적용한다. 기존 공포·부상·기한·정신 붕괴 등 기존 감점은 먼저 계산한다. 선지급금이나 고정 이야기 퀘스트 상금은 재평가하지 않는다. |
| `interaction_city`, `slave_auction_sell_end`, 기존 `slave_sell_done`, `end_contract` / `TBV_*REWARD*`, `TBV_GIFT_*` | 경매·계약·기존 거래 및 인계의 양수 관계/평판 보상을 가산한다. 원래 보상 조건과 음수 처리는 유지한다. 이야기 인계에서 인물 제거 후 보상하는 경우 원래 인물의 플래그를 잠시 보관한다. |

`jo9_meiki_sale`의 기존 `roll`에는 운영 엔진5.7이 지원하지 않는 `LOCAL`/`FOR`가 들어 있었다. `TBV_HAGGLE_NATIVE57`은 기존 계산식과 비교 순서를 그대로 두고 임시 변수 이름을 전용 접두사로 바꾸며, 반복문을 동일한 0~4 범위의 라벨/조건 점프로 바꾼다. 마지막 65536 후보도 유지한다. 사용한 임시 변수는 결과를 정한 뒤 모두 제거한다. 경매의 기존 `LOCAL jo9_auction_base`도 같은 이유로 전용 임시 변수와 정리 호출로 바꾼다. 이는 기존 명기 전용 계산 결과를 바꾸기 위한 수정이 아니다.

## 분리·삭제 시 영향

- 새 로케이션만 제거하고 호출부를 두면 존재하지 않는 로케이션 오류가 생긴다. 완전 제거는 선언된 치환을 역순으로 되돌린 뒤 로케이션을 제거해야 한다.
- 등급 갱신 호출만 제거하면 외모6과 다재다능의 자동 획득이 다음 남은 호출 시점까지 지연된다. 저장된 플래그 자체는 지워지지 않는다.
- 가격 호출만 제거하면 그 판매 경로에서만 가격 효과가 빠진다. Farid와 다른 독립 가격 경로의 호출을 서로 대신할 수 없다.
- 명칭 정의만 제거하면 외모6의 UI 문자열이 비거나 특성 설명이 누락될 수 있다. 종합 등급 상한은 이 정의와 별개다.
- 저장 플래그를 지우면 다재다능의 영구 획득·수동 제거 의사와 절세미인의 획득 상태가 사라진다. 실행 임시 변수만 지우는 것은 다음 계산에 영향을 주지 않는다.

## 검증과 한계

`qa.cjs`는 모듈의 치환74개를 원본에 순차 적용하며 모두 정확히1회인지 검증하고, 실제 QSP를 생성하여 WASM 엔진5.8에서 실행했다. `qa-report.json`: 104개 검증 통과, 엔진 오류0. 모든24개 개별 항목의 하나씩 미달 사례, 노예·조수·stock·dynslave·room1의 반복 외모 갱신, 특성 부재, 영구 획득, 원래 전체 외모 갱신 함수의 흉터·멍·체격 불이익, 일반·젖소 기본 가격의 반복 평가, 현재 외모6과 실제 종합 등급10, 기존 명기의 최고 흥정40개 입력 조합 비교, 수술의 원래 지출/기록, 실제 무작위500회 중 대성공24회, 가격 중첩, 실제 판매·인계 호출부의 성공·거절·0보상·인물 제거 후 보상을 포함한다. 무작위 횟수 검사는 확률식을 증명하는 통계 검정이 아니라 실제 분기를 관측하는 확인이다. 5% 조건 자체는 소스에서 `rand(1,100)<=5`이다.

`native-qa.cjs`는 실제 운영과 같은 32비트 네이티브 QSP5.7 DLL을 호출한다. `native-report.txt`: 110개 검증 통과, 로딩/실행 오류0. 실제 수정된 일반·젖소 기본 가격 계산, 수술 함수, 시장/경매 호출 블록, 판매 완료 분기, 인물 삭제 후 인계 보상, 외모6에서도 종합10을 포함한다. 프런트엔드나 게임 클라이언트를 실행하지 않았다.

통합 후보 SHA256 `f22c02dd2e206bc2ec31d768a8c59fa6d571d4331eb262703214e7b8a4f00dff`의 실제 본문으로도 동일 시험을 다시 실행했다. `integrated-qa-report.json`: WASM104개 통과·오류0. `native-integrated-report.txt`: 네이티브110개 통과·오류0. 통합 시험은 실제 공통·성격·전투 도메인 로케이션도 함께 로드한다. 일반 가격, 젖소 가격, Farid, 경매, 흥정, 고정 NPC 가격, Vong, 계약 지급액의 기준을 대조했고, 각 독립 경로에서25%가 한 번만 들어가며 이미 계산된 `sell_price`/`sparks_get`를 완료 단계에서 다시 가산하지 않는 것을 확인했다.

호출부 시험의 화면 전환·가격 공급·거래 검사 일부는 명시적인 시험용 스텁으로 제어했다. 게임의 기존 수락 조건을 이 모듈에서 바꾸지는 않았으며 실제 UI 조작 전체를 시험한 것은 아니다. 전체 게임의 다른 도메인과 합친 검사 및 기존 세이브 통합 검사는 루트 단계에서 수행해야 한다. `candidate.qsp`는 이 도메인만 적용한 검토용 파일이며 라이브 Play나 배포본이 아니다.


## 2026-10-19 후천 획득 확률·안개 성장 보상 수정

기존 10승 보장 획득을 사용자 요청으로 10·15·20…승 단일 추첨(각3%, 총9%)으로 변경했다. 앞선 조건부 요청에 따라 안개 전투 개인 승리의 자아·기질 성장 누적값도 각각5 추가했다. 기존 특성·승수는 보존한다. 위 이전 검사 결과는 당시 보장 획득 버전에 대한 이력이며, 현재 변경의 463개 네이티브 검사와 실제 클라이언트9경로 출고 검사는 [최신 설명서](COMBAT_TRAIT_BALANCE_20261019.md)를 따른다. 발견 시 선천 부여는 별도 배경·빈도 검토 중이며 이 변경에 포함하지 않았다.

## 2026-10-19 발견 배경별 전투 특성 초기 보유

신규 일반 무작위 인물의 본인 직업이 heroine일 때만 기존 가족키로 후보를 정해 한 번 추첨한다. amazon/viking 가족은 광전사50%, knight 가족은 성기사50%, 그 외 가족은 역전의용사25%다. 프리셋·복제인간의 임시 배경·기존 특성은 추첨하지 않으며 기존 인물을 재처리하지 않는다. [정확한 조건·의존성과 검사](COMBAT_TRAIT_INNATE_20261019.md)를 따른다. 후천의 실전10·15·20…승 각3% 추첨과 안개 승리 성장 누적값각5는 유지한다.
