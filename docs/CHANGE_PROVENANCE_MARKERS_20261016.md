# 플레이본 변경 구간 표식

대상: G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp
원본 SHA256: 1e3ef5e1a8ebf434168bdb0b337d128380744ac94ab2799c6ff9b0e4fca5ef65
표식본 SHA256: cade22997ba349352d1458ad0a8a99ce71c4ff243091be26a7d47fd3795dda5f

실행 코드와 기존 주석은 삭제하거나 비활성화하지 않음. 새 표식만 제거하면 수정 전 QSP와 바이트 단위 일치. 문자열 리터럴도 동일.

JO9 MOD 구간 3029개, 로케이션 249개. 패치 기록에 따른 출처 표시이며 다른 작성자의 패치를 모두 Codex 작성으로 단정하지 않음.
useless 분류 44곳. 사용자 지정 분류명이며 기능 코드와 섞인 줄은 주석에 범위를 설명.
현재 문구와 일치하지 않는 과거 편집 기록 194건은 후속 변경 또는 수동 변경 가능성이 있어 미확정. 전부 미적용이라는 뜻이 아님. 원문 대비 모든 차이를 임의로 Codex 작업으로 표시하지 않음.

## 정책 목적 검사 위치

| 검색 표식 | QGen 로케이션 | 범위 |
|---|---|---|
| U001 | interaction | 추가 설명 주석; 실행 조건은 다음 코드 참조 |
| U002 | interaction | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |
| U003 | interaction | 추가 설명 주석; 실행 조건은 다음 코드 참조 |
| U004 | interaction | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |
| U005 | interaction | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |
| U006 | interaction | 추가 설명 주석; 실행 조건은 다음 코드 참조 |
| U007 | interaction | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |
| U008 | interaction | slave_les_txt5 유형 문자열 검사; 보정 대입과 혼합 |
| U009 | #dynamic | 추가 설명 주석; 실행 조건은 다음 코드 참조 |
| U010 | #dynamic | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |
| U011 | sex_initiate | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |
| U012 | sex_initiate | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |
| U013 | sex_initiate | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |
| U014 | sex_initiate | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |
| U015 | sex_interaction_result | sex_interaction 목록 밖이면 자격 해제 |
| U016 | sex_interaction_result | sex_interaction 목록 밖이면 자격 해제 |
| U017 | sex_interaction_result | 유형 및 상태 검사에 따른 자격 해제 |
| U018 | sex_interaction_result | 유형 및 상태 검사에 따른 자격 해제 |
| U019 | sex_interaction_result | 추가 자격 플래그 검사 |
| U020 | sex_interaction_result | 추가 단계 기록과 검사; 행위 및 중복 보정 검사와 혼합 |
| U021 | sex_interaction_result | 추가 단계 기록과 검사; 행위 및 중복 보정 검사와 혼합 |
| U022 | sex_interaction_result | 유형 및 상태 검사에 따른 자격 해제 |
| U023 | sex_interaction_result_woman | sex_interaction 목록 밖이면 자격 해제 |
| U024 | sex_interaction_result_woman | sex_interaction 목록 밖이면 자격 해제 |
| U025 | sex_interaction_result_woman | 유형 및 상태 검사에 따른 자격 해제 |
| U026 | sex_interaction_result_woman | 유형 및 상태 검사에 따른 자격 해제 |
| U027 | sex_interaction_result_woman | 추가 자격 플래그 검사 |
| U028 | sex_interaction_result_woman | 추가 단계 기록과 검사; 행위 및 중복 보정 검사와 혼합 |
| U029 | sex_interaction_result_woman | 추가 단계 기록과 검사; 행위 및 중복 보정 검사와 혼합 |
| U030 | sex_interaction_result_woman | 유형 및 상태 검사에 따른 자격 해제 |
| U031 | jo9_meiki_willing | 이 줄의 age 분류 검사; 존재 상태 검사와 혼합 |
| U032 | jo9_meiki_willing | fear, domini_dictum, neg_raped, neg_disgust 검사 |
| U033 | jo9_meiki_willing | res 및 sex_acceptance 검사 |
| U034 | jo9_meiki_willing | 이 줄의 age 분류 검사; 존재 상태 검사와 혼합 |
| U035 | jo9_meiki_willing | fear, domini_dictum, neg_raped, neg_disgust 검사 |
| U036 | jo9_meiki_willing | res 및 sex_acceptance 검사 |
| U037 | jo9_meiki_state | 이 줄의 age 분류 검사; 대상 선택과 혼합 |
| U038 | jo9_meiki_state | 이 줄의 age 분류 검사; 대상 선택과 혼합 |
| U039 | jo9_meiki_state | 이 줄의 age 분류 검사; 대상 선택과 혼합 |
| U040 | jo9_meiki_state | 이 줄의 age 분류 검사; 대상 선택과 혼합 |
| U041 | jo9_meiki_state | 이 줄의 age 분류 검사; 대상 선택과 혼합 |
| U042 | jo9_meiki_state | 이 줄의 age 분류 검사; 대상 선택과 혼합 |
| U043 | jo9_meiki_training_bonus | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |
| U044 | jo9_meiki_training_bonus | jo9_meiki_willing 호출 및 해당 줄의 diligence 검사; 기능 코드와 혼합 |

## 기록과 현재 내용이 일치하지 않는 항목

- 2026-10-01_robertus_rufus_art_tutor, edit 0, interaction
- 2026-10-01_robertus_rufus_art_tutor, edit 3, #txt_man
- 2026-10-02_redlight_bj_variant, edit 0, interaction_city
- 2026-10-02_whore_redlight_sequences, edit 0, interaction_city
- 2026-10-03_whore_redlight_b_u_sequence, edit 0, interaction_city
- 2026-10-03_whore_redlight_b_v_tu_random, edit 0, interaction_city
- 2026-10-03_whore_redlight_c_p_sequence, edit 0, interaction_city
- 2026-10-04_credits_2_4, edit 0, credits
- 2026-10-04_fog_milking_button, edit 0, main_screen
- 2026-10-04_fog_milking_button, edit 1, main_screen
- 2026-10-05_afina_korean_name, edit 0, city_menu_form
- 2026-10-05_afina_korean_name, edit 1, city_menu_form
- 2026-10-05_afina_korean_name, edit 2, #npc_base
- 2026-10-05_afina_korean_name, edit 3, #npc_base
- 2026-10-05_afina_korean_name, edit 4, #npc_base
- 2026-10-05_afina_korean_name, edit 5, #npc_base
- 2026-10-05_afina_korean_name, edit 6, #npc_base
- 2026-10-05_afina_korean_name, edit 7, #npc_base
- 2026-10-05_afina_korean_name, edit 8, #npc_base
- 2026-10-05_afina_korean_name, edit 9, #npc_base
- 2026-10-05_afina_korean_name, edit 10, #npc_base
- 2026-10-08_cutscene_only_view, edit 0, interior_change
- 2026-10-08_cutscene_view_ui_fix, edit 0, interior_change
- 2026-10-08_persistent_image_cycle, edit 104, interior_change
- 2026-10-08_persistent_image_cycle, edit 147, slave_private_room1
- 2026-10-08_persistent_image_cycle, edit 148, slave_private_room1
- 2026-10-08_persistent_image_cycle, edit 149, slave_private_room2
- 2026-10-08_persistent_image_cycle, edit 150, slave_private_room2
- 2026-10-08_persistent_image_cycle, edit 151, slave_private_room3
- 2026-10-08_persistent_image_cycle, edit 152, slave_private_room3
- 2026-10-08_persistent_image_cycle, edit 153, slave_private_room4
- 2026-10-08_persistent_image_cycle, edit 154, slave_private_room4
- 2026-10-09_city_scene_menu_alignment, edit 0, $menu
- 2026-10-09_dialogue_format_and_protagonist, edit 4, menu_form
- 2026-10-09_dialogue_format_and_protagonist, edit 5, menu_form
- 2026-10-09_dialogue_format_and_protagonist, edit 6, menu_form
- 2026-10-09_dialogue_format_and_protagonist, edit 7, menu_form
- 2026-10-09_dialogue_format_and_protagonist, edit 8, menu_form
- 2026-10-09_dialogue_format_and_protagonist, edit 9, menu_form
- 2026-10-09_dialogue_format_and_protagonist, edit 10, menu_form
- 2026-10-09_dialogue_format_and_protagonist, edit 56, end_day_screen
- 2026-10-09_dialogue_format_and_protagonist, edit 57, end_day_screen
- 2026-10-09_dialogue_format_and_protagonist, edit 58, end_day_screen
- 2026-10-09_dialogue_format_and_protagonist, edit 59, end_day_screen
- 2026-10-09_dialogue_format_and_protagonist, edit 60, end_day_screen
- 2026-10-09_dialogue_format_and_protagonist, edit 61, end_day_screen
- 2026-10-09_dialogue_format_and_protagonist, edit 66, master_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 78, master_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 79, master_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 92, slave_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 93, slave_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 106, slave_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 107, slave_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 120, assistant_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 121, assistant_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 137, assistant_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 139, assistant_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 140, assistant_stat
- 2026-10-09_dialogue_format_and_protagonist, edit 1638, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 1639, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 1640, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 1852, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 1860, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 1910, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 1922, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2101, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2115, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2142, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2261, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2313, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2314, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2317, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2318, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2319, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2334, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2354, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2355, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2356, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2357, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2358, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2365, interaction_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2385, interaction_result_city
- 2026-10-09_dialogue_format_and_protagonist, edit 2391, interaction_screen_city
- 2026-10-09_dialogue_format_and_protagonist, edit 4956, #options
- 2026-10-09_dialogue_format_and_protagonist, edit 4961, #options
- 2026-10-09_dialogue_format_and_protagonist, edit 4978, #options
- 2026-10-09_dialogue_format_and_protagonist, edit 5864, боевой_интерфейс
- 2026-10-09_dialogue_format_and_protagonist, edit 5865, боевой_интерфейс
- 2026-10-09_dialogue_format_and_protagonist, edit 5866, боевой_интерфейс
- 2026-10-09_dialogue_format_and_protagonist, edit 5867, боевой_интерфейс
- 2026-10-09_dialogue_format_and_protagonist, edit 5918, black_market_interface
- 2026-10-09_dialogue_format_and_protagonist, edit 5920, pharmacy
- 2026-10-09_dialogue_format_and_protagonist, edit 5921, pharmacy
- 2026-10-10_missing_reference_descriptions_male, edit 0, #npc_base
- 2026-10-10_missing_reference_descriptions_male, edit 1, #place_base
- 2026-10-10_missing_reference_descriptions_male, edit 2, $newloc
- 2026-10-10_reference_info_crlf_runtime_fix, edit 0, jo9_reference_info
- 2026-10-10_restore_home_ui_block, edit 0, main_screen
- 2026-10-10_restore_legacy_scene_button_alignment, edit 0, $menu
- 2026-10-10_restore_private_room_ui, edit 0, slave_private_room1
- 2026-10-10_restore_private_room_ui, edit 1, slave_private_room1
- 2026-10-10_restore_private_room_ui, edit 2, slave_private_room1
- 2026-10-10_restore_private_room_ui, edit 3, slave_private_room2
- 2026-10-10_restore_private_room_ui, edit 4, slave_private_room2
- 2026-10-10_restore_private_room_ui, edit 5, slave_private_room2
- 2026-10-10_restore_private_room_ui, edit 6, slave_private_room3
- 2026-10-10_restore_private_room_ui, edit 7, slave_private_room3
- 2026-10-10_restore_private_room_ui, edit 8, slave_private_room3
- 2026-10-10_restore_private_room_ui, edit 9, slave_private_room4
- 2026-10-10_restore_private_room_ui, edit 10, slave_private_room4
- 2026-10-10_restore_private_room_ui, edit 11, slave_private_room4
- 2026-10-10_restore_private_room_ui, edit 74, warning
- 2026-10-10_restore_private_room_ui, edit 75, main_menu
- 2026-10-10_restore_private_room_ui, edit 76, controls
- 2026-10-10_restore_private_room_ui, edit 77, credits
- 2026-10-10_restore_private_room_ui, edit 78, development
- 2026-10-10_restore_private_room_ui, edit 83, hero_creation
- 2026-10-10_restore_private_room_ui, edit 84, hero_customization
- 2026-10-10_restore_private_room_ui, edit 85, hero_customization_woman
- 2026-10-10_restore_private_room_ui, edit 86, hero_customization_man
- 2026-10-10_restore_private_room_ui, edit 87, hero_description
- 2026-10-10_restore_private_room_ui, edit 94, $menu
- 2026-10-10_restore_private_room_ui, edit 96, sjm_UI_UIadds
- 2026-10-10_restore_private_room_ui, edit 108, $newloc
- 2026-10-10_restore_private_room_ui, edit 110, $ongload
- 2026-10-10_restore_private_room_ui, edit 154, next_day
- 2026-10-10_restore_private_room_ui, edit 167, interaction
- 2026-10-10_restore_private_room_ui, edit 220, #quest_base
- 2026-10-10_restore_private_room_ui, edit 292, get_demo_slave
- 2026-10-10_restore_private_room_ui_corrections, edit 3, main_screen
- 2026-10-10_restore_private_room_ui_corrections, edit 4, slave_private_room1
- 2026-10-10_restore_private_room_ui_corrections, edit 6, slave_private_room2
- 2026-10-10_restore_private_room_ui_corrections, edit 8, slave_private_room3
- 2026-10-10_restore_private_room_ui_corrections, edit 10, slave_private_room4
- 2026-10-10_restore_private_room_ui_corrections, edit 23, #txt_man
- 2026-10-10_restore_private_room_ui_corrections, edit 24, #txt_man
- 2026-10-10_restore_private_room_ui_corrections, edit 25, #txt_man
- 2026-10-10_restore_private_room_ui_corrections, edit 26, #txt_man
- 2026-10-10_restore_ui_format_after_dialogue_normalization, edit 7, master_stat
- 2026-10-10_restore_ui_format_after_dialogue_normalization, edit 8, slave_stat
- 2026-10-10_restore_ui_format_after_dialogue_normalization, edit 9, slave_stat
- 2026-10-10_restore_ui_format_after_dialogue_normalization, edit 11, assistant_stat
- 2026-10-10_restore_ui_format_after_dialogue_normalization, edit 12, assistant_stat
- 2026-10-11_fix_hunting_result_character_origin, edit 0, shop_general
- 2026-10-11_relocate_snkmod_resources, edit 0, interaction
- 2026-10-11_relocate_snkmod_resources, edit 1, interaction_city
- 2026-10-11_relocate_snkmod_resources, edit 2, slave_private_room1
- 2026-10-11_relocate_snkmod_resources, edit 3, slave_private_room2
- 2026-10-11_relocate_snkmod_resources, edit 4, slave_private_room3
- 2026-10-11_relocate_snkmod_resources, edit 5, slave_private_room4
- 2026-10-11_relocate_snkmod_resources, edit 7, snk_room_menu_screen
- 2026-10-11_relocate_snkmod_resources, edit 8, $ongload
- 2026-10-11_rm_restaurant_meal_record, edit 0, interaction
- 2026-10-11_rm_restaurant_meal_record, edit 1, interaction
- 2026-10-12_fix_rm_group_meal_execution, edit 0, interaction
- 2026-10-12_visible_menu_prices, edit 23, menu_form
- 2026-10-12_visible_menu_prices, edit 37, #options
- 2026-10-12_visible_menu_prices, edit 38, #options
- 2026-10-12_visible_menu_prices, edit 46, #options
- 2026-10-12_visible_menu_prices, edit 47, #options
- 2026-10-12_visible_menu_prices, edit 53, #options
- 2026-10-12_visible_menu_prices, edit 65, #options
- 2026-10-12_visible_menu_prices, edit 66, #options
- 2026-10-12_zzzz_gameover_layout, edit 0, exit
- 2026-10-12_zzzzz_gameover_unboxed, edit 0, exit
- 2026-10-15_barbarian_princess_general_occupation, edit 0, generate_stock
- 2026-10-15_cryo_paged_portraits, edit 0, shop_general
- 2026-10-15_private_room_diet_selection, edit 9, slave_private_room1
- 2026-10-15_private_room_diet_selection, edit 11, slave_private_room2
- 2026-10-15_private_room_diet_selection, edit 13, slave_private_room3
- 2026-10-15_private_room_diet_selection, edit 15, slave_private_room4
- 2026-10-15_refresh_message_ui_before_save_upgrade, edit 0, $ongload
- 2026-10-15_status_detail_only, edit 0, sjm_UI_UIadds
- 2026-10-15_status_detail_only, edit 1, sjm_UI_UIadds
- 2026-10-15_status_detail_only, edit 2, slave_private_room1
- 2026-10-15_status_detail_only, edit 3, slave_private_room2
- 2026-10-15_status_detail_only, edit 4, slave_private_room3
- 2026-10-15_status_detail_only, edit 5, slave_private_room4
- 2026-10-15_status_detail_only, edit 6, snk_room_menu_screen
- 2026-10-15_z_meiki_voluntary_outcome, edit 4, sex_initiate
- 2026-10-15_z_meiki_voluntary_outcome, edit 5, sex_interaction_result
- 2026-10-15_z_meiki_voluntary_outcome, edit 6, sex_interaction_result_woman
- 2026-10-15_z_meiki_voluntary_outcome, edit 7, sjm_UI_UIadds
- 2026-10-15_z_meiki_voluntary_outcome, edit 8, sjm_UI_UIadds
- 2026-10-15_z_meiki_voluntary_outcome, edit 9, slave_private_room1
- 2026-10-15_z_meiki_voluntary_outcome, edit 10, slave_private_room2
- 2026-10-15_z_meiki_voluntary_outcome, edit 11, slave_private_room3
- 2026-10-15_z_meiki_voluntary_outcome, edit 12, slave_private_room4
- 2026-10-15_z_meiki_voluntary_outcome, edit 13, snk_room_menu_screen
- 2026-10-15_z_restore_personal_equipment_text, edit 3, assistant_stat
- 2026-10-15_zz_meiki_state, edit 0, jo9_meiki_willing
- 2026-10-15_zz_meiki_state, edit 1, $newloc
- 2026-10-15_zzz_meiki_training, edit 8, #dynamic
- 2026-10-16_meiki_market_auction_dialogue, edit 1, slave_auction_sell