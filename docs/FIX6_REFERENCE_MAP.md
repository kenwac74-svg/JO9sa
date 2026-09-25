# FIX6 이미지 참조 맵

기준: FIX6 설치 상태 `jack.qsp` (SHA-256 `9535334…b6d9` = manifest FinalQsp), location 243개 전부, FIX6 `base.css`.
검색: `content\pic\경로`, `content\pic\<<iif(…)>>` 안의 경로, `$special_image[N] = '경로'`를 정확한 경로로 비교(구분자·대소문자 무시). 소스 참조 확인이며 실제 표시 확인이 아니다.

## 파일별 참조 (location: 횟수)

| FIX6 파일 | 참조 위치 |
|---|---|
| `content/pic/bg/slave_psychology/1.png` | interaction_city: 1 |
| `content/pic/bg/slave_psychology/2.png` | interaction_city: 1 |
| `content/pic/bg/slave_psychology/3.png` | interaction_city: 1 |
| `content/pic/bg/slave_psychology/4.png` | interaction_city: 1 |
| `content/pic/bg/slave_psychology/5.png` | interaction_city: 1 |
| `content/pic/bg/slave_psychology/6.png` | interaction_city: 1 |
| `content/pic/bg/slave_psychology/7.png` | interaction_city: 1 |
| `content/pic/bg/trophy/bg_trophy.png` | trophy_room_screen: 1 |
| `content/pic/bg/trophy/Trophy.png` | trophy_room_screen: 1 |
| `content/pic/bg/trophy/trophywall.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/approve.png` | choice_screen: 1, item_buy: 1, slave_to_train: 1, epic_win: 1, black_market_interface: 1, epic_win_marsjinn: 1, female_pregant_end2: 1, female_pregant_end: 1 |
| `content/pic/buttons/approve_small.png` | hero_description: 1, slave_auction_buy: 1 |
| `content/pic/buttons/auk_next.png` | slave_auction_buy: 1 |
| `content/pic/buttons/close_button.png` | controls: 1, credits: 1, development: 1, hero_creation: 1, hero_customization: 1, hero_customization_woman: 1, hero_customization_man: 1, hero_description: 1, $addon_custom_data: 2, main_screen: 2, master_stat: 3, master_stat_clients: 1, teach_screen: 2, slave_stat: 3, assistant_stat: 2, city_screen: 2, guild_board: 1, trophy_room_screen: 1, sex_screen_woman: 4 |
| `content/pic/buttons/debug_a.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/debug_s.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/deny.png` | choice_screen: 1, guild_board: 1, item_buy: 1, slave_to_train: 1, epic_win: 1, black_market_interface: 1, epic_win_marsjinn: 1 |
| `content/pic/buttons/evaluate.png` | guild_board: 1 |
| `content/pic/buttons/fast_cook.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/fast_milking.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/fast_milking_gray.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/fast_punishment.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/fast_reward.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/fast_sweep.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/fast_wash.png` | barn: 1, assistant_private_room: 1, slave_private_room1: 1, slave_private_room2: 1, slave_private_room3: 1, slave_private_room4: 1 |
| `content/pic/buttons/fast_wash_assistant.png` | barn: 1, assistant_private_room: 1, slave_private_room1: 1, slave_private_room2: 1, slave_private_room3: 1, slave_private_room4: 1 |
| `content/pic/buttons/gear.png` | main_screen: 1, city_screen: 1, sex_screen: 1, sex_screen_woman: 1 |
| `content/pic/buttons/gear_console.png` | main_screen: 2, city_screen: 1 |
| `content/pic/buttons/gear_slave_editor.png` | main_screen: 1 |
| `content/pic/buttons/imprison.png` | main_screen: 1, prison_cell: 1, stasis_cell: 1 |
| `content/pic/buttons/influence.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/jo9_heart_a.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/jo9_heart_s.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/lab.png` | main_screen: 1 |
| `content/pic/buttons/milk_drop_large.png` | main_screen: 1, prison_cell: 1, barn: 1, assistant_private_room: 1, slave_private_room1: 1, slave_private_room2: 1, slave_private_room3: 1, slave_private_room4: 1 |
| `content/pic/buttons/Minus.png` | hero_creation: 2, main_screen: 2, city_screen: 2, sex_screen_woman: 4 |
| `content/pic/buttons/Minus_small.png` | menu_form: 122 |
| `content/pic/buttons/net_active.png` | $gladiator_setup: 1, $catfighter_setup: 1 |
| `content/pic/buttons/net_used.png` | $gladiator_setup: 1, конец_боя: 1, $catfighter_setup: 1 |
| `content/pic/buttons/ok-icon.png` | hero_creation: 1, _layout: 1 |
| `content/pic/buttons/Plus.png` | hero_creation: 2, main_screen: 2, city_screen: 2, sex_screen_woman: 4 |
| `content/pic/buttons/Plus_small.png` | menu_form: 122 |
| `content/pic/buttons/question.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/release.png` | main_screen: 1, prison_cell: 1, stasis_cell: 1 |
| `content/pic/buttons/rise_up.png` | slave_auction_buy: 1 |
| `content/pic/buttons/sel_button.png` | hero_creation: 17, master_stat: 8, teach_screen: 4, slave_stat: 43, assistant_stat: 31, prison_cell: 4, barn: 3, slave_private_room1: 3, slave_private_room2: 3, slave_private_room3: 3, slave_private_room4: 3 |
| `content/pic/buttons/shield_active.png` | $gladiator_setup: 1, $catfighter_setup: 1 |
| `content/pic/buttons/shield_used.png` | $gladiator_setup: 1, конец_боя: 5, $catfighter_setup: 1 |
| `content/pic/buttons/soc_btn.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/sound_off.png` | main_screen: 1, city_screen: 1, ride_interface: 1, боевой_интерфейс: 1, sex_screen: 2, sex_screen_woman: 1 |
| `content/pic/buttons/sound_on.png` | main_screen: 1, city_screen: 1, ride_interface: 1, боевой_интерфейс: 1, sex_screen: 2, sex_screen_woman: 1 |
| `content/pic/buttons/study_button.png` | assistant_stat: 15 |
| `content/pic/buttons/study_button_gray.png` | assistant_stat: 15 |
| `content/pic/buttons/teach.png` | main_screen: 1 |
| `content/pic/buttons/thumb_down.png` | конец_боя: 3 |
| `content/pic/buttons/thumb_up.png` | конец_боя: 1 |
| `content/pic/buttons/trotest.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/unactive_button.png` | master_stat: 4, teach_screen: 11, slave_stat: 12, assistant_stat: 28, barn: 1, slave_private_room1: 1, slave_private_room2: 1, slave_private_room3: 1, slave_private_room4: 1 |
| `content/pic/buttons/unsel_button.png` | hero_creation: 7, master_stat: 16, teach_screen: 12, slave_stat: 53, assistant_stat: 38, prison_cell: 4, barn: 3, slave_private_room1: 3, slave_private_room2: 3, slave_private_room3: 3, slave_private_room4: 3 |
| `content/pic/buttons/whip_active.png` | $gladiator_setup: 1, $catfighter_setup: 1 |
| `content/pic/buttons/whip_used.png` | $gladiator_setup: 1, конец_боя: 1, $catfighter_setup: 1 |
| `content/pic/buttons/yellow_button.png` | **참조 없음 (예비 리소스)** |
| `content/pic/buttons/z_ill.png` | sjm_UI_UIadds: 3, barn: 1, assistant_private_room: 1, slave_private_room1: 1, slave_private_room2: 1, slave_private_room3: 1, slave_private_room4: 1 |
| `content/pic/buttons/z_pregnant.png` | sjm_UI_UIadds: 4 |
| `content/pic/buttons/z_wounds.png` | sjm_UI_UIadds: 3, slave_private_room1: 1, slave_private_room2: 1, slave_private_room3: 1, slave_private_room4: 1 |
| `content/pic/ui/approved_main_v1/action_clean.png` | main_screen: 3 |
| `content/pic/ui/approved_main_v1/action_cook.png` | main_screen: 3 |
| `content/pic/ui/approved_main_v1/action_heart_a.png` | main_screen: 1 |
| `content/pic/ui/approved_main_v1/action_heart_s.png` | main_screen: 2 |
| `content/pic/ui/approved_main_v1/action_influence.png` | main_screen: 3 |
| `content/pic/ui/approved_main_v1/action_info_a.png` | main_screen: 1 |
| `content/pic/ui/approved_main_v1/action_info_s.png` | main_screen: 2 |
| `content/pic/ui/approved_main_v1/action_milking.png` | main_screen: 4 |
| `content/pic/ui/approved_main_v1/action_milking_gray.png` | main_screen: 1 |
| `content/pic/ui/approved_main_v1/action_punish.png` | main_screen: 6 |
| `content/pic/ui/approved_main_v1/action_question.png` | main_screen: 3 |
| `content/pic/ui/approved_main_v1/action_reward.png` | main_screen: 6 |
| `content/pic/ui/approved_main_v1/action_social.png` | main_screen: 3 |
| `content/pic/ui/approved_main_v1/action_wash.png` | main_screen: 4 |
| `content/pic/ui/approved_main_v1/action_wash_a.png` | main_screen: 2 |
| `content/pic/ui/approved_main_v1/header_trophy.png` | main_screen: 1 |
| `content/pic/ui/approved_main_v1/role_swap_hook.png` | [css/base.css]: 1 |
| `content/pic/ui/approved_main_v1/role_swap_sa.png` | [css/base.css]: 1 |
| `content/pic/ui/approved_main_v1/tool_room.png` | main_screen: 1 |
| `content/pic/ui/grimdark/bg.png` | _layout: 1 |
| `content/pic/ui/grimdark/bg_fight.png` | раскладка_бой: 1 |
| `content/pic/ui/grimdark/bg_main.png` | main_layout: 1 |
| `content/pic/ui/grimdark/bg_ride.png` | $ride_start: 1 |
| `content/pic/ui/grimdark/bg_stat.png` | stats_layout: 1 |
| `content/pic/ui/grimdark/buttons/gear.png` | main_screen: 1, city_screen: 1, sex_screen: 1, sex_screen_woman: 1 |
| `content/pic/ui/grimdark/buttons/sound_off.png` | main_screen: 1, city_screen: 1, ride_interface: 1, боевой_интерфейс: 1, sex_screen: 2, sex_screen_woman: 1 |
| `content/pic/ui/grimdark/buttons/sound_on.png` | main_screen: 1, city_screen: 1, ride_interface: 1, боевой_интерфейс: 1, sex_screen: 2, sex_screen_woman: 1 |
| `content/pic/ui/jo9_v197/06cfa32964c1.png` | [css/base.css]: 1 |
| `content/pic/ui/jo9_v197/2a81e31d426f.png` | [css/base.css]: 1 |
| `content/pic/ui/jo9_v197/49cdec4e6773.png` | [css/base.css]: 1 |
| `content/pic/ui/jo9_v197/4a0c7f1e9e75.png` | [css/base.css]: 1 |
| `content/pic/ui/jo9_v197/5d095d34b115.png` | [css/base.css]: 9 |
| `content/pic/ui/jo9_v197/728644846d9c.png` | [css/base.css]: 1 |
| `content/pic/ui/jo9_v197/a64f99c80000.png` | [css/base.css]: 1 |
| `content/pic/ui/jo9_v197/b974654aedb1.png` | [css/base.css]: 1 |
| `content/pic/ui/jo9_v197/d5977d72c018.png` | [css/base.css]: 1 |
| `content/pic/ui/jo9_v197/exit.png` | [css/base.css]: 1 |
| `content/pic/ui/jo9_v197/f36145a03cb3.png` | [css/base.css]: 1 |
| `content/pic/ui/jo9_v197/home.png` | [css/base.css]: 1 |
| `content/pic/ui/jon-UIadds/equipment.png` | sjm_UI_UIadds: 2, slave_stat: 1, assistant_stat: 1 |
| `content/pic/ui/jon-UIadds/Fer_가임.png` | sjm_UI_UIadds: 4 |
| `content/pic/ui/jon-UIadds/Fer_불임.png` | sjm_UI_UIadds: 2 |
| `content/pic/ui/jon-UIadds/Fer_산란.png` | sjm_UI_UIadds: 2 |
| `content/pic/ui/jon-UIadds/Fer_아동.png` | sjm_UI_UIadds: 2 |
| `content/pic/ui/jon-UIadds/milk_drop.png` | sjm_UI_UIadds: 2, slave_stat: 1, assistant_stat: 1 |
| `content/pic/ui/jon-UIadds/milk_drop_no.png` | sjm_UI_UIadds: 2 |
| `content/pic/ui/jon-UIadds/Vir_restored.png` | sjm_UI_UIadds: 2 |
| `content/pic/ui/jon-UIadds/Vir_shriveled.png` | sjm_UI_UIadds: 2 |
| `content/pic/ui/jon-UIadds/Vir_비.png` | sjm_UI_UIadds: 2 |
| `content/pic/ui/jon-UIadds/Vir_처.png` | sjm_UI_UIadds: 2 |

## 허용 5개 밖에서 FIX6 파일을 참조하는 곳

| location | 참조 수 |
|---|---|
| `$addon_custom_data` | 2 |
| `$catfighter_setup` | 6 |
| `$gladiator_setup` | 6 |
| `$ride_start` | 1 |
| `[css/base.css]` | 22 |
| `_layout` | 2 |
| `assistant_private_room` | 4 |
| `assistant_stat` | 131 |
| `barn` | 11 |
| `black_market_interface` | 2 |
| `choice_screen` | 2 |
| `controls` | 1 |
| `credits` | 1 |
| `development` | 1 |
| `epic_win` | 2 |
| `epic_win_marsjinn` | 2 |
| `female_pregant_end` | 1 |
| `female_pregant_end2` | 1 |
| `guild_board` | 3 |
| `hero_creation` | 30 |
| `hero_customization` | 1 |
| `hero_customization_man` | 1 |
| `hero_customization_woman` | 1 |
| `hero_description` | 2 |
| `interaction_city` | 7 |
| `item_buy` | 2 |
| `main_layout` | 1 |
| `master_stat` | 31 |
| `master_stat_clients` | 1 |
| `menu_form` | 244 |
| `prison_cell` | 11 |
| `ride_interface` | 4 |
| `sex_screen` | 10 |
| `sex_screen_woman` | 18 |
| `slave_auction_buy` | 3 |
| `slave_private_room1` | 12 |
| `slave_private_room2` | 12 |
| `slave_private_room3` | 12 |
| `slave_private_room4` | 12 |
| `slave_to_train` | 2 |
| `stasis_cell` | 2 |
| `stats_layout` | 1 |
| `teach_screen` | 29 |
| `trophy_room_screen` | 3 |
| `боевой_интерфейс` | 4 |
| `конец_боя` | 11 |
| `раскладка_бой` | 1 |
