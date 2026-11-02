# 전투 MOB 등장 장소·배경 체크리스트

기준: 2026-10-29 현재 WORK QSP `5d7c16b17d9aa0c1bb9c818c67521b2693a32a2db068742fbe7072f2dd8343cd`. 정적 경로 조사이며 실제 플레이 전수검증과 구분한다.

이미 배경이 있는 올바른 컷은 유지한다. 투명 컷은 장소에 맞게 합성하며, `kimerian_e`처럼 확인된 잘못된 배경은 수정 예외로 관리한다. 이번 작업은 기록과 체크리스트 표시만 갱신하며 QSP·PNG·SAV를 교체하지 않는다.

## 장소와 렌더러를 구분하는 기준

- 콜로세움 검투 대회 32종, 대련 이미지 변형 14종, 캣파이트 3종, 안개경계 24종, 고유 이벤트 5종: 체크리스트 78항목 전부 연결. 단체 8세트 별도 연결.
- 장소 배경은 전투 준비 화면의 선언값이다. 실제 전투·결과 배경은 `боевой_интерфейс`/`конец_боя`의 선택값이다. 불투명 MOB 그림은 이 부모 배경을 가릴 수 있다.
- 현재 캣파이트와 이벤트 전투는 전용 장소 배경이 있어도 공통 `ui/grimdark/bg/fight.png`를 선택한다. 이것을 해당 장소의 권장 합성 원본으로 오인하지 않는다.
- 초상 프레임 분류는 등장 장소 분류가 아니다. 경주 전용 초상은 전투·패배 컷 제작 대상에서 계속 제외한다.

## 항목별 제작 정보

|이름·키|전투 구분 / 장소|배경 기준|현재 실제 전투 배경|전투 전 장소 배경|QSP 출전 근거|
|---|---|---|---|---|---|
|하인 · `подручный`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:10983`|
|식인종 · `канибал`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11090`|
|불구자 · `калека`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11090`|
|거지 · `нищеброд`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11090`|
|미치광이 · `безумец`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11090`|
|말라깽이 · `изможденный`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11090`|
|성기사 · `паладин`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11000`|
|병사 · `пехотинец`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11001`|
|염소 머리 · `козлорогий`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11171`|
|돼지낯짝 · `свинорылый`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11172`|
|두꺼비인간 · `жабован`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11173`|
|쥐인간 · `крысолюд`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11174`|
|가르시드 · `garsid`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11175`|
|검은 의사 · `черный_медик`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:10982`|
|성장기 안개 괴물 · `исчадие_молодь`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:10937`|
|안개 괴물 · `исчадие`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:10947`|
|거대 안개 괴물 · `чудовщиное_исчадие`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:10967`|
|흡혈귀 · `вампир`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11050`|
|늑대인간 · `вервольф`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11040`|
|리치 · `лич`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11065`|
|오우거 · `ogre`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11110`|
|고블린 · `goblin`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11125`|
|와그 · `warg`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11141`|
|오크 전사 · `orc`|안개경계 정찰 전투 / `edge_patrol`|안개경계의 숲|`bg/battle_mist_forest.png`|`bg/edge_of_mists1.png / bg/edge_of_mists2.png`|`interaction_city:11156`|
|전투적인 탈옥수 · `fugituive_a`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:70`|
|음침한 탈옥수 · `fugituive_b`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:71`|
|겁에 질린 탈옥수 · `fugituive_c`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:72`|
|키 큰 탈옥수 · `fugituive_d`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:73`|
|어린 탈옥수 · `fugituive_e`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:74`|
|쌍수 투사A · `dimaher_a`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:21`|
|쌍수 투사B · `dimaher_b`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:27`|
|쌍수 투사C · `dimaher_c`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:33`|
|쌍수 투사D · `dimaher_d`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:39`|
|쌍수 투사E · `dimaher_e`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:45`|
|보병 투사A · `hoplite_a`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:22`|
|보병 투사B · `hoplite_b`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:28`|
|보병 투사C · `hoplite_c`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:34`|
|보병 투사D · `hoplite_d`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:40`|
|보병 투사E · `hoplite_e`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:46`|
|여성 검투사A · `secutor_a`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:23`|
|여성 검투사B · `secutor_b`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:29`|
|여성 검투사C · `secutor_c`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:35`|
|여성 검투사D · `secutor_d`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:41`|
|여성 검투사E · `secutor_e`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:47`|
|킴메르 투사A · `kimerian_a`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:24`|
|킴메르 투사B · `kimerian_b`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:30`|
|킴메르 투사C · `kimerian_c`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:36`|
|킴메르 투사D · `kimerian_d`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:42`|
|킴메르 투사E · `kimerian_e`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:48`|
|특급 투사 · `champion_corvus`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:62`|
|특급 투사 · `champion_kamira`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:61`|
|특급 투사 · `champion_serpis`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:63`|
|특급 투사 · `champion_taurus`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:64`|
|특급 투사 · `champion_vatican`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:65`|
|최후의 심판자 · `champion_absolute`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:82`|
|아레나 안개 괴물 · `исчадие_арены`|콜로세움 검투 대회 / `colosseum_arena`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/arena.png`|`$gladiator_setup:78`|
|여검투사 · `gladiatrix1`|동부 캣파이트 클럽 정규 시합 / `catfightclub`|캣파이트 클럽 실내|`ui/grimdark/bg/fight.png`|`bg/catfightclub.png`|`interaction_city:17720`|
|여검투사 · `gladiatrix2`|동부 캣파이트 클럽 정규 시합 / `catfightclub`|캣파이트 클럽 실내|`ui/grimdark/bg/fight.png`|`bg/catfightclub.png`|`interaction_city:17721`|
|여검투사 · `gladiatrix3`|동부 캣파이트 클럽 정규 시합 / `catfightclub`|캣파이트 클럽 실내|`ui/grimdark/bg/fight.png`|`bg/catfightclub.png`|`interaction_city:17722`|
|에게야 · `egeya`|캣파이트 클럽 주인 에게야와의 이벤트 결투 / `egeya_battle`|캣파이트 클럽 주인 에게야 결투 장소|`ui/grimdark/bg/fight.png`|`bg/egeya.png`|`interaction_city:17651`|
|성기사 · `vatican_paladin`|포털 접근권을 위한 바티칸 성기사 이벤트 결투 / `fogs_battle1`|포털 접근권을 위한 바티칸 성기사 이벤트 결투|`ui/grimdark/bg/fight.png`|`bg/vatican_paladin.png`|`interaction_city:22986`|
|포탈 가디언 · `strazhnik`|포털 가디언 최종 이벤트 전투 / `fogs_battle2`|포털 가디언 최종 이벤트 장소|`ui/grimdark/bg/fight.png`|`bg/strazhnik.png`|`interaction_city:22998`|
|그린치 · `grinch`|겨울 동화 그린치 이벤트 전투 / `Grinch_battle`|겨울 동화 그린치 이벤트 장소|`ui/grimdark/bg/fight.png`|`bg/Grinch_battle.png`|`interaction_city:24507`|
|엘자 · `erza`|엘자 영입 관련 이벤트 결투 / `erza_battle`|엘자 영입 관련 이벤트 결투|`ui/grimdark/bg/fight.png`|`bg/erza.png`|`interaction_city:32108`|
|헐벗은 노예 · glad_naked · `variant:glad_naked`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:11`|
|헐벗은 노예 · glad_naked_2 · `variant:glad_naked_2`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:11`|
|헐벗은 노예 · glad_naked_3 · `variant:glad_naked_3`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:11`|
|여교관 · mistress_morrigan · `variant:mistress_morrigan`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:19`|
|여교관 · glad_mistress_2 · `variant:glad_mistress_2`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:19`|
|여교관 · glad_mistress_3 · `variant:glad_mistress_3`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:19`|
|여닌자 · glad_shinobi · `variant:glad_shinobi`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:27`|
|여닌자 · glad_shinobi_2 · `variant:glad_shinobi_2`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:27`|
|여닌자 · glad_shinobi_3 · `variant:glad_shinobi_3`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:27`|
|철갑투사 · glad_armored · `variant:glad_armored`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:35`|
|철갑투사 · glad_armored_2 · `variant:glad_armored_2`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:35`|
|철갑투사 · glad_armored_3 · `variant:glad_armored_3`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:35`|
|여전사 · glad_amason · `variant:glad_amason`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:42`|
|여전사 · glad_amason_2 · `variant:glad_amason_2`|콜로세움 투사 훈련소 대련 / `colosseum`|콜로세움 경기장|`ui/jo9_battle_test_v01/arena.png`|`bg/colosseum.png`|`colosseum_fight:42`|

## 단체 컷신

|세트|등장 장소|패배 파일|
|---|---|---|
|검은 의사와 하인 3명|안개경계 정찰 전투|`mob/defeated/groups/medic_group.png`|
|타우루스 성기사와 병사 2명|안개경계 정찰 전투|`mob/defeated/groups/paladin_group.png`|
|고블린 2마리|안개경계 정찰 전투|`mob/defeated/groups/goblin_pair.png`|
|고블린 3마리|안개경계 정찰 전투|`mob/defeated/groups/goblin_trio.png`|
|가르시드와 수인 4명|안개경계 정찰 전투|`mob/defeated/groups/garsid_group.png`|
|투기장 탈옥수 5명|콜로세움 검투 대회|`mob/defeated/groups/prisoners_group.png`|
|수인 4인조 · 무작위 구성 대표 컷신|안개경계 정찰 전투|`mob/defeated/groups/beastmen_group.png`|
|부랑자 5인조 · 무작위 구성 대표 컷신|안개경계 정찰 전투|`mob/defeated/groups/vagrants_group.png`|

## 우선 확인할 공유·오류 경로

- `spawn_ava.png`: 안개 3종과 아레나 1종이 공유하는 초상. 장소별 초상 배경에는 파일·연결 분리가 필요하다. 전신·패배는 이미 `spawn.png`/`gladiator_spawn.png`로 나뉜다. 트로피룸 아이콘 사용도 보존해야 한다.
- `kimerian_e`: `gladiator_kimerian_5.png`에 숲 배경이 있으나 출전은 콜로세움이다. **배경 수정 필요, 미적용**. 기존 배경을 무조건 보존하는 항목이 아니다.
- 캣파이트 일반 상대 `gladiatrix1~3`와 클럽 주인 에게야의 이벤트 결투 `egeya`는 배경 문맥을 분리한다.
- `$catfighter_setup`의 임시 `gladiatrix*_ava` 키는 interaction103001에서 정식 `gladiatrix1~3`으로 다시 선택한다. 임시 문자열만 보고 출전 오류로 판단하지 않는다.
- 소유 노예의 야간 습격/교육 중 반격은 고정 MOB 원화가 아닌 현재 인물을 사용하는 동적 전투다. 침실/호출 장소를 별도 문맥으로 유지한다.

## 후속 배경 적용 때 사용할 자료

정본: `tools/mob-image-sets/background-contexts.json`. 각 항목의 `appearanceContexts`는 종류·장소·조건·실제 배경·장소 배경·QSP 위치/행을 보존한다. `sharedAssets`는 같은 경로의 여러 용도를 보여준다. 다른 배경이 필요한 공유 경로를 먼저 분리한 뒤 해당 전투 문맥에서 연결해야 한다. 이 기록만으로 이미지 교체 완료나 기존 전투 중 세이브 호환 완료를 의미하지 않는다.


## 2026-10-29 이미지 반영 갱신

승인된 배경 합성128장을 WORK 및 resources/new에 반영했다. 원본 배경 유지13장, 파일 없는 패배 슬롯14곳, 편집 제외1곳은 유지한다. 전신·패배132슬롯의 해시/크기를 갱신했으며 초상·단체8컷·QSP 근거는 보존했다. 킴메르 투사E와 아레나 산란괴물의 잘못된 배경은 수정 완료다. 상세 파일 및 복구 위치: records/mob-backgrounds-adopted-20261029/installation.json. 기존 본문의 전투 배경 경로는 QSP가 그리는 부모 배경을 뜻하며, 이번 PNG에 합성한 배경과 구분한다.


## 2026-10-29 전투·패배 재작화 반영

최신 안개경계 재작화51장(전투22·개별 패배22·단체 패배7), 아레나·캣파이트 샘플4장, 쌍수 투사A2장 등57장을 WORK 및 resources/new에 반영했다. 초기 늑대인간 샘플은 최신 안개경계 재작화로 대체한다. 전투 장소·경로·집단 구성·초상·Mage Edit 프롬프트는 보존하고 PNG 및 체크리스트61슬롯만 갱신했다. 795×596 불투명 장면이며 QSP는 변경하지 않았다. 상세 원본·최종 해시와 복구 위치: records/mob-redraw-adopted-20261029/installation.json.


## 2026-10-29 전투·패배 재작화 반영

승인된 쌍수 투사E(dimaher_e)의 전투·패배2장을 WORK 및 resources/new에 반영했다. 전투 장소·경로·집단 구성·초상·Mage Edit 프롬프트와 다른 이미지의 기존 사용자 작업을 보존하고 PNG2개 및 체크리스트2슬롯만 갱신했다. 795×596 불투명 장면이며 QSP는 변경하지 않았다. 상세 원본·최종 해시와 복구 위치: records/dimaher-e-adopted-20261029/installation.json.


## 2026-10-29 전투·패배 재작화 반영

승인된 쌍수 투사D(dimaher_d)의 전투·패배2장을 WORK 및 resources/new에 반영했다. 전투 장소·경로·집단 구성·초상·Mage Edit 프롬프트와 다른 이미지의 기존 사용자 작업을 보존하고 PNG2개 및 체크리스트2슬롯만 갱신했다. 795×596 불투명 장면이며 QSP는 변경하지 않았다. 상세 원본·최종 해시와 복구 위치: records/dimaher-d-adopted-20261029/installation.json.


## 2026-10-29 전투·패배 재작화 반영

승인된 아레나22종 전투22장·패배21장(43 PNG)을 WORK 및 resources/new에 반영했다. 전투 장소·경로·집단 구성·초상·Mage Edit 프롬프트와 다른 이미지의 기존 사용자 작업을 보존하고 PNG43개 및 체크리스트43슬롯을 갱신했다. 쌍수 투사E 패배컷은 보류 상태로 기존 PNG를 유지했다. 795×596 불투명 장면이며 QSP는 변경하지 않았다. 상세 원본·최종 해시와 복구 위치: records/arena-combat-redraw-adopted-20261030/installation.json.


## 2026-10-30 캣파이트 전투·패배 재작화 반영

캣파이트 일반 상대 gladiatrix1·2·3의 전투·패배 총6장을 승인된 지하 격투장 배경으로 통일하여 WORK와 resources/new에 반영했다. 1번의 없던 패배 파일을 추가했고 기존 5장을 교체했다. 초상·등장 장소·무기 수치·Mage Edit 프롬프트·QSP·세이브는 보존했다. 원본은 G:/somi/JO9resource/mob_body/catfight_originals_20261030에 이동 보관했다. 상세 해시 및 복구 경로: records/catfight-combat-adopted-20261030/installation.json.


## 2026-10-30 퀘스트 전투·패배 재작화 반영

에게야·성기사·포털 가디언·그린치·엘자의 승인 시안9장(전투5·패배4)을 WORK와 resources/new에 반영했다. 에게야 패배1장은 기존 그림·경로·표시를 유지했다. 각 장소의 환경, 기존 무기·초상·등장 조건·Mage Edit 프롬프트·QSP·세이브는 변경하지 않았다. 기존9원본은 G:/somi/JO9resource/mob_body/quest_originals_20261030에 실제 이동 보관했다. 성기사의 옛 무기명 대사5곳은 별도 미결 항목이며 이번 이미지 반영에서는 코드를 수정하지 않았다. 상세 해시 및 복구 경로: records/quest-combat-adopted-20261030/installation.json.


## 2026-10-30 안개 괴물 성장 단계 분리

성장기(`исчадие_молодь`)는 mob/spawn_young.png·spawn_young_ava.png·defeated/spawn_young.png, 거대(`чудовщиное_исчадие`)는 spawn_giant.png·spawn_giant_ava.png·defeated/spawn_giant.png로 구분했다. 전신·패배는795×596, 초상은150×150 기본 프레임이다. 보통 spawn 세트와 아레나 gladiator_spawn 세트는 보존한다. 전리품실의 성장기·거대 초상도 분리했으며 능력치·ID·저장 형식은 바뀌지 않았다. 상세: records/spawn-stage-image-fix-20261030/REPORT_KO.md.
