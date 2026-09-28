# FIX6 리소스 → SNKmod 0.1 경로 대응표

- 작성: 2026-09-28. 사용자가 FIX6 원본 ZIP을 다시 첨부했다. `baseline/`의 파일과 바이트가 같다 (SHA-256 `254dc8c5…bc82`, 9,073,868 B).
- 0.1 정책의 자산 루트는 `game/content/pic/SNKmod/`다. 이 표는 그 루트에 기존 배치 규칙을 적용한 **예상 대응**이다. 규칙은 원래 구조 유지, 모더 폴더 단계 제거, grimdark 하위 폴더는 원래 폴더로, 한글 파일명은 영문으로 바꾸는 것이다. 0.1 소스·ui_map을 받으면 이 표와 대조한다.
- "최신본으로 대체"는 사용자가 이후에 준 새 디자인(resources/new)이 FIX6판을 대신한다는 뜻이다. 0.1에서의 최종 채택은 0.1 ui_map으로 확인한다.
- FIX6 이미지 115개가 SNKmod 경로 112개로 모인다 (grimdark/buttons의 동일 사본 3개가 합쳐짐).

| FIX6 경로 | 0.1 예상 경로 | FIX6 SHA-256 앞 12자 | 비고 |
|---|---|---|---|
| `content/pic/bg/slave_psychology/1.png` | `content/pic/SNKmod/bg/slave_psychology/1.png` | `d4f0657bd67e` |  |
| `content/pic/bg/slave_psychology/2.png` | `content/pic/SNKmod/bg/slave_psychology/2.png` | `c9550d95e9f6` |  |
| `content/pic/bg/slave_psychology/3.png` | `content/pic/SNKmod/bg/slave_psychology/3.png` | `3a8c1c5bc5fc` |  |
| `content/pic/bg/slave_psychology/4.png` | `content/pic/SNKmod/bg/slave_psychology/4.png` | `f20b9c4fe881` |  |
| `content/pic/bg/slave_psychology/5.png` | `content/pic/SNKmod/bg/slave_psychology/5.png` | `eed91d1f46fa` |  |
| `content/pic/bg/slave_psychology/6.png` | `content/pic/SNKmod/bg/slave_psychology/6.png` | `814a40d69f2b` |  |
| `content/pic/bg/slave_psychology/7.png` | `content/pic/SNKmod/bg/slave_psychology/7.png` | `068dc31b83f0` |  |
| `content/pic/bg/trophy/bg_trophy.png` | `content/pic/SNKmod/bg/trophy/bg_trophy.png` | `16ef24c37893` |  |
| `content/pic/bg/trophy/Trophy.png` | `content/pic/SNKmod/bg/trophy/Trophy.png` | `bc767a75e40e` |  |
| `content/pic/bg/trophy/trophywall.png` | `content/pic/SNKmod/bg/trophy/trophywall.png` | `0eab2b15a7dc` |  |
| `content/pic/buttons/approve.png` | `content/pic/SNKmod/buttons/approve.png` | `ad5f858376d3` |  |
| `content/pic/buttons/approve_small.png` | `content/pic/SNKmod/buttons/approve_small.png` | `48510e9dc85c` |  |
| `content/pic/buttons/auk_next.png` | `content/pic/SNKmod/buttons/auk_next.png` | `0a03210f1d98` |  |
| `content/pic/buttons/close_button.png` | `content/pic/SNKmod/buttons/close_button.png` | `50e299d3122d` |  |
| `content/pic/buttons/debug_a.png` | `content/pic/SNKmod/buttons/debug_a.png` | `65fb8490209f` |  |
| `content/pic/buttons/debug_s.png` | `content/pic/SNKmod/buttons/debug_s.png` | `f7305d001ab9` |  |
| `content/pic/buttons/deny.png` | `content/pic/SNKmod/buttons/deny.png` | `876309fc46fd` |  |
| `content/pic/buttons/evaluate.png` | `content/pic/SNKmod/buttons/evaluate.png` | `3e0ba1c24c8a` |  |
| `content/pic/buttons/fast_cook.png` | `content/pic/SNKmod/buttons/fast_cook.png` | `9b064ffbac43` |  |
| `content/pic/buttons/fast_milking.png` | `content/pic/SNKmod/buttons/fast_milking.png` | `657914d9932d` |  |
| `content/pic/buttons/fast_milking_gray.png` | `content/pic/SNKmod/buttons/fast_milking_gray.png` | `4ba8807dc0ce` |  |
| `content/pic/buttons/fast_punishment.png` | `content/pic/SNKmod/buttons/fast_punishment.png` | `ab6c5af3023b` |  |
| `content/pic/buttons/fast_reward.png` | `content/pic/SNKmod/buttons/fast_reward.png` | `5e4c4d98f63d` |  |
| `content/pic/buttons/fast_sweep.png` | `content/pic/SNKmod/buttons/fast_sweep.png` | `3bd7112dd0b4` |  |
| `content/pic/buttons/fast_wash.png` | `content/pic/SNKmod/buttons/fast_wash.png` | `bb5f94746ed2` |  |
| `content/pic/buttons/fast_wash_assistant.png` | `content/pic/SNKmod/buttons/fast_wash_assistant.png` | `a27883ddbc28` |  |
| `content/pic/buttons/gear.png` | `content/pic/SNKmod/buttons/gear.png` | `9c912a2179b2` | 동일 사본 합침 |
| `content/pic/buttons/gear_console.png` | `content/pic/SNKmod/buttons/gear_console.png` | `47f05cc2dcb9` |  |
| `content/pic/buttons/gear_slave_editor.png` | `content/pic/SNKmod/buttons/gear_slave_editor.png` | `8c5857e8dab6` |  |
| `content/pic/buttons/imprison.png` | `content/pic/SNKmod/buttons/imprison.png` | `765bd3241121` |  |
| `content/pic/buttons/influence.png` | `content/pic/SNKmod/buttons/influence.png` | `4c87d2cf2ca2` |  |
| `content/pic/buttons/jo9_heart_a.png` | `content/pic/SNKmod/buttons/jo9_heart_a.png` | `26cfef801626` |  |
| `content/pic/buttons/jo9_heart_s.png` | `content/pic/SNKmod/buttons/jo9_heart_s.png` | `badc33ed4bc2` |  |
| `content/pic/buttons/lab.png` | `content/pic/SNKmod/buttons/lab.png` | `70700b13e930` |  |
| `content/pic/buttons/milk_drop_large.png` | `content/pic/SNKmod/buttons/milk_drop_large.png` | `be32cf3a4647` | 최신본으로 대체 |
| `content/pic/buttons/Minus.png` | `content/pic/SNKmod/buttons/Minus.png` | `78a3e0cbebfd` |  |
| `content/pic/buttons/Minus_small.png` | `content/pic/SNKmod/buttons/Minus_small.png` | `50eb73058590` |  |
| `content/pic/buttons/net_active.png` | `content/pic/SNKmod/buttons/net_active.png` | `cc59053677ed` |  |
| `content/pic/buttons/net_used.png` | `content/pic/SNKmod/buttons/net_used.png` | `dc21b7215ffb` |  |
| `content/pic/buttons/ok-icon.png` | `content/pic/SNKmod/buttons/ok-icon.png` | `2b3224917536` |  |
| `content/pic/buttons/Plus.png` | `content/pic/SNKmod/buttons/Plus.png` | `8cbc3b4cc0d1` |  |
| `content/pic/buttons/Plus_small.png` | `content/pic/SNKmod/buttons/Plus_small.png` | `3685da6ac1c5` |  |
| `content/pic/buttons/question.png` | `content/pic/SNKmod/buttons/question.png` | `f8812f5dbcd1` |  |
| `content/pic/buttons/release.png` | `content/pic/SNKmod/buttons/release.png` | `ddcb36a84e42` |  |
| `content/pic/buttons/rise_up.png` | `content/pic/SNKmod/buttons/rise_up.png` | `e0869a10396c` |  |
| `content/pic/buttons/sel_button.png` | `content/pic/SNKmod/buttons/sel_button.png` | `c0eb2f0fbd83` |  |
| `content/pic/buttons/shield_active.png` | `content/pic/SNKmod/buttons/shield_active.png` | `a5d0160c2425` |  |
| `content/pic/buttons/shield_used.png` | `content/pic/SNKmod/buttons/shield_used.png` | `2ec020f90757` |  |
| `content/pic/buttons/soc_btn.png` | `content/pic/SNKmod/buttons/soc_btn.png` | `47fac56106d8` |  |
| `content/pic/buttons/sound_off.png` | `content/pic/SNKmod/buttons/sound_off.png` | `b57bca42d681` | 동일 사본 합침 |
| `content/pic/buttons/sound_on.png` | `content/pic/SNKmod/buttons/sound_on.png` | `51875322cb2f` | 동일 사본 합침 |
| `content/pic/buttons/study_button.png` | `content/pic/SNKmod/buttons/study_button.png` | `8e516c13f731` |  |
| `content/pic/buttons/study_button_gray.png` | `content/pic/SNKmod/buttons/study_button_gray.png` | `0d6d7e1b5f6b` |  |
| `content/pic/buttons/teach.png` | `content/pic/SNKmod/buttons/teach.png` | `42f45ef23db9` |  |
| `content/pic/buttons/thumb_down.png` | `content/pic/SNKmod/buttons/thumb_down.png` | `af263ecfecc3` | 최신본으로 대체 |
| `content/pic/buttons/thumb_up.png` | `content/pic/SNKmod/buttons/thumb_up.png` | `3a22bde19998` | 최신본으로 대체 |
| `content/pic/buttons/trotest.png` | `content/pic/SNKmod/buttons/trotest.png` | `68b46a04a03e` |  |
| `content/pic/buttons/unactive_button.png` | `content/pic/SNKmod/buttons/unactive_button.png` | `f44673b0b434` |  |
| `content/pic/buttons/unsel_button.png` | `content/pic/SNKmod/buttons/unsel_button.png` | `dd8e1bd7da52` |  |
| `content/pic/buttons/whip_active.png` | `content/pic/SNKmod/buttons/whip_active.png` | `a372f2c72667` |  |
| `content/pic/buttons/whip_used.png` | `content/pic/SNKmod/buttons/whip_used.png` | `b008c105e5af` |  |
| `content/pic/buttons/yellow_button.png` | `content/pic/SNKmod/buttons/yellow_button.png` | `8e0825982c19` |  |
| `content/pic/buttons/z_ill.png` | `content/pic/SNKmod/buttons/z_ill.png` | `516d98dfcd00` |  |
| `content/pic/buttons/z_pregnant.png` | `content/pic/SNKmod/buttons/z_pregnant.png` | `326a8cf29387` |  |
| `content/pic/buttons/z_wounds.png` | `content/pic/SNKmod/buttons/z_wounds.png` | `07893dad6211` |  |
| `content/pic/ui/approved_main_v1/action_clean.png` | `content/pic/SNKmod/ui/action_clean.png` | `fd7bec11786c` |  |
| `content/pic/ui/approved_main_v1/action_cook.png` | `content/pic/SNKmod/ui/action_cook.png` | `2c47d7c27496` |  |
| `content/pic/ui/approved_main_v1/action_heart_a.png` | `content/pic/SNKmod/ui/action_heart_a.png` | `d510b0e61940` |  |
| `content/pic/ui/approved_main_v1/action_heart_s.png` | `content/pic/SNKmod/ui/action_heart_s.png` | `f1796a029b0e` |  |
| `content/pic/ui/approved_main_v1/action_influence.png` | `content/pic/SNKmod/ui/action_influence.png` | `9ae5c22662c4` |  |
| `content/pic/ui/approved_main_v1/action_info_a.png` | `content/pic/SNKmod/ui/action_info_a.png` | `d911956594ba` |  |
| `content/pic/ui/approved_main_v1/action_info_s.png` | `content/pic/SNKmod/ui/action_info_s.png` | `7548cc2cc23f` |  |
| `content/pic/ui/approved_main_v1/action_milking.png` | `content/pic/SNKmod/ui/action_milking.png` | `40a1d4bfdc53` |  |
| `content/pic/ui/approved_main_v1/action_milking_gray.png` | `content/pic/SNKmod/ui/action_milking_gray.png` | `9fefcf83634b` |  |
| `content/pic/ui/approved_main_v1/action_punish.png` | `content/pic/SNKmod/ui/action_punish.png` | `398d8e605967` |  |
| `content/pic/ui/approved_main_v1/action_question.png` | `content/pic/SNKmod/ui/action_question.png` | `69b39a80b272` |  |
| `content/pic/ui/approved_main_v1/action_reward.png` | `content/pic/SNKmod/ui/action_reward.png` | `b9939ff45cfe` |  |
| `content/pic/ui/approved_main_v1/action_social.png` | `content/pic/SNKmod/ui/action_social.png` | `d59ae6623b3c` |  |
| `content/pic/ui/approved_main_v1/action_wash.png` | `content/pic/SNKmod/ui/action_wash.png` | `38e793d1ea94` |  |
| `content/pic/ui/approved_main_v1/action_wash_a.png` | `content/pic/SNKmod/ui/action_wash_a.png` | `cb9ed5a734b9` |  |
| `content/pic/ui/approved_main_v1/header_trophy.png` | `content/pic/SNKmod/ui/header_trophy.png` | `818c695686f7` |  |
| `content/pic/ui/approved_main_v1/role_swap_hook.png` | `content/pic/SNKmod/ui/role_swap_hook.png` | `392144a5bc5e` |  |
| `content/pic/ui/approved_main_v1/role_swap_sa.png` | `content/pic/SNKmod/ui/role_swap_sa.png` | `2a69b40aec88` |  |
| `content/pic/ui/approved_main_v1/tool_room.png` | `content/pic/SNKmod/ui/tool_room.png` | `2b54fec996c0` |  |
| `content/pic/ui/grimdark/bg.png` | `content/pic/SNKmod/ui/bg.png` | `ade5a0148c87` |  |
| `content/pic/ui/grimdark/bg_fight.png` | `content/pic/SNKmod/ui/bg_fight.png` | `3ed490a40eb3` |  |
| `content/pic/ui/grimdark/bg_main.png` | `content/pic/SNKmod/ui/bg_main.png` | `1bef0b53f84a` |  |
| `content/pic/ui/grimdark/bg_ride.png` | `content/pic/SNKmod/ui/bg_ride.png` | `08ee8109f37c` |  |
| `content/pic/ui/grimdark/bg_stat.png` | `content/pic/SNKmod/ui/bg_stat.png` | `d400d7710051` |  |
| `content/pic/ui/grimdark/buttons/gear.png` | `content/pic/SNKmod/buttons/gear.png` | `9c912a2179b2` | 동일 사본 합침 |
| `content/pic/ui/grimdark/buttons/sound_off.png` | `content/pic/SNKmod/buttons/sound_off.png` | `b57bca42d681` | 동일 사본 합침 |
| `content/pic/ui/grimdark/buttons/sound_on.png` | `content/pic/SNKmod/buttons/sound_on.png` | `51875322cb2f` | 동일 사본 합침 |
| `content/pic/ui/jo9_v197/06cfa32964c1.png` | `content/pic/SNKmod/ui/06cfa32964c1.png` | `5fe94096d16e` |  |
| `content/pic/ui/jo9_v197/2a81e31d426f.png` | `content/pic/SNKmod/ui/2a81e31d426f.png` | `79d85d1ec36b` |  |
| `content/pic/ui/jo9_v197/49cdec4e6773.png` | `content/pic/SNKmod/ui/49cdec4e6773.png` | `364df77d576c` |  |
| `content/pic/ui/jo9_v197/4a0c7f1e9e75.png` | `content/pic/SNKmod/ui/4a0c7f1e9e75.png` | `287ff45b2246` |  |
| `content/pic/ui/jo9_v197/5d095d34b115.png` | `content/pic/SNKmod/ui/5d095d34b115.png` | `6be0dfa3af14` |  |
| `content/pic/ui/jo9_v197/728644846d9c.png` | `content/pic/SNKmod/ui/728644846d9c.png` | `875770e99b3e` |  |
| `content/pic/ui/jo9_v197/a64f99c80000.png` | `content/pic/SNKmod/ui/a64f99c80000.png` | `e87b00b88ee5` |  |
| `content/pic/ui/jo9_v197/b974654aedb1.png` | `content/pic/SNKmod/ui/b974654aedb1.png` | `e5d23c2e7018` |  |
| `content/pic/ui/jo9_v197/d5977d72c018.png` | `content/pic/SNKmod/ui/d5977d72c018.png` | `f9375ddeee2c` |  |
| `content/pic/ui/jo9_v197/exit.png` | `content/pic/SNKmod/ui/exit.png` | `254387b0a80f` |  |
| `content/pic/ui/jo9_v197/f36145a03cb3.png` | `content/pic/SNKmod/ui/f36145a03cb3.png` | `5ba9d27bd964` |  |
| `content/pic/ui/jo9_v197/home.png` | `content/pic/SNKmod/ui/home.png` | `28bdc4a9391b` |  |
| `content/pic/ui/jon-UIadds/equipment.png` | `content/pic/SNKmod/ui/equipment.png` | `32fd7666fba5` |  |
| `content/pic/ui/jon-UIadds/Fer_가임.png` | `content/pic/SNKmod/ui/Fer_PregO.png` | `3c3c2628b6f9` |  |
| `content/pic/ui/jon-UIadds/Fer_불임.png` | `content/pic/SNKmod/ui/Fer_PregX.png` | `1ab27879fe24` |  |
| `content/pic/ui/jon-UIadds/Fer_산란.png` | `content/pic/SNKmod/ui/Fer_PregEg.png` | `e806ef054e12` |  |
| `content/pic/ui/jon-UIadds/Fer_아동.png` | `content/pic/SNKmod/ui/Fer_Mi.png` | `e762635a1c39` |  |
| `content/pic/ui/jon-UIadds/milk_drop.png` | `content/pic/SNKmod/ui/milk_drop.png` | `adeec0e2f3cb` |  |
| `content/pic/ui/jon-UIadds/milk_drop_no.png` | `content/pic/SNKmod/ui/milk_drop_no.png` | `484fe7fe73d2` |  |
| `content/pic/ui/jon-UIadds/Vir_restored.png` | `content/pic/SNKmod/ui/Vir_restored.png` | `257823dc5ceb` |  |
| `content/pic/ui/jon-UIadds/Vir_shriveled.png` | `content/pic/SNKmod/ui/Vir_shriveled.png` | `88c586e0bdbf` |  |
| `content/pic/ui/jon-UIadds/Vir_비.png` | `content/pic/SNKmod/ui/Vir_Xcr.png` | `7d6edbc3c860` |  |
| `content/pic/ui/jon-UIadds/Vir_처.png` | `content/pic/SNKmod/ui/Vir_Ocr.png` | `83c53a15b454` |  |
