# 현재 WORK 초상·이벤트·복장·소문 아이콘 감사

읽기 전용 조사. 현재 `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp`의 SHA-256은 `dbe2948f7c827d8fc82ccd32b2c3453626d181a59eb744e015fa66a3846280ae`로 요청 기준과 일치한다. 아래 `location:행`은 해당 location의 복호화한 body에서 센 1-based 행이다. `qsp-evidence.txt`에 원래 행 번호를 붙인 근거를 보관했다. `audit-current.cjs`는 같은 QSP 해시에서 근거와 정적 경로 검사를 다시 생성한다.

## 1. 개인팩 노예의 안개 획득·콜로세움 소개 이미지

- **기본 별칭과 실제 파일의 불일치는 확정.** WORK `json/slaves/1064.json:2`는 `girls/full/1064_blue_long_young`, `:3`은 `girls/full/cloth/1064_blue_long_young`을 가리키며 두 PNG 모두 없다. 실제 root 파일은 `content/pic/girls/full/1064_blond_long_young.png`다.
- 같은 JSON의 `indpack_title`은 `girls/full/1064/1064_full_title`로 실제 존재한다. root의 blond 파일과 개인팩 title 파일은 모두 241,946바이트, 795×596, SHA-256 `0045daf37839353afcd4a05b94cf3a6c68e724eb589131d0ff894eefe4a5e273`로 완전히 같다. 확인된 동일 이미지이며 외형을 추측해서 교체할 필요가 없다.
- 전체 WORK JSON에서 기본 `fullimage` PNG가 없는 항목은 **23개**, 이 23개는 모두 `indpack_title` PNG가 존재한다. 목록은 `missing-fullimage-audit.json`에 있다. 같은 ID root 후보가 둘인 항목도 있어 파일명만으로 일괄 선택하면 안 된다.
- **현재 증상 경로에는 이미 우회가 들어 있다.** `interaction_city:1712`(12801, 콜로세움 소개), `:11151`(61120, 안개 구조/포획 제시), `:11234`(61132, 데려가기)는 모두 `jo9_seed_role_images`를 호출한다. `jo9_seed_role_images:44-58`은 actor의 저장 경로가 현재 `$fullimage[id]`와 정확히 같으면 `$indpack_title[id]`로 표시만 바꾼다. 1064가 JSON 그대로 생성되고 개인팩 전역값이 정상이라면 현재 코드는 실제 title PNG를 반환해야 한다.
- **따라서 “기본 경로 오타”와 “현재 WORK의 해당 이벤트에서 반드시 깨짐”은 구별해야 한다.** 전자는 확정이고 후자는 문제를 재현하는 actor cache/장면 상태를 확보하지 못했다. 현재 이벤트가 계속 blue 경로를 출력한다면 실행 중인 QSP, 해당 actor의 `fullimage`, 현재 `$fullimage[1064]`, `$indpack_title[1064]`, 장면 `$special_image`를 함께 대조해야 한다.

경로 생성·캐시:

- `get_stock_seed:294-297`은 `$stock['fullimage']`와 ava/ava_gray/ava_clear를 seed 전역값에서 **인물 인스턴스에 복사**한다. JSON만 바꾸면 이미 소유한 인물의 저장 경로까지 자동으로 바뀐다고 보장할 수 없다.
- fullimage 값은 `girls/full/...`처럼 **content/pic을 제외**한다. 최종 표시기 `display_fullimage:133`, `interaction_screen_city:44-46`이 `content/pic/`을 앞에 붙이고 `.png`를 붙인다.
- 얼굴 ava 값은 JSON에 **content/pic까지 포함**한다. 1064는 `content/pic/girls/face/1064/1064_face[_sepia|_gray]`이며 세 파일 모두 존재한다. `$gladiator_fight_start:31`은 ava_clear 값에 `.png`만 붙인다. 전신 경로와 얼굴 경로를 같은 규칙으로 바꾸면 안 된다.
- `display_pic:22-46`은 fullimage 문자열 속 `blue/blond/...`, `short`로 장면용 머리 특성도 추론한다. 모든 fullimage를 숫자 개인팩 경로로 바꾸면 이 부수효과를 검토해야 한다.

수정 검토안: 검증된 동일 이미지에 대해 기존 잘못된 별칭을 보존하는 방법(파일 alias 복사), 또는 JSON 기본값 정정과 이전 정확한 별칭의 읽기 시 해석을 함께 다루는 방법이 있다. 전자는 저장 문자열/특성 추론을 건드리지 않는 대신 중복 PNG가 늘어난다. 후자는 기존 인물 캐시를 전역 치환하지 말고 ID와 이전 경로를 함께 확인해야 한다. **본 감사에서 어느 쪽도 실행하지 않았다.**

## 2. 남성 주인공 줄리아 재회 이벤트의 도나도나 인물

- **이벤트별 잘못된 NPC 지정이 확정.** `interaction_city=163`, `:5433/:5445/:5457`은 `$npc_id='alyce'`, `:5439/:5451`은 `'kuma'`를 지정한다. 화면 표시기 `interaction_screen_city:138-140`은 NPC ID로 `content/pic/characters/<<$npc_image[$npc_id]>>.png`를 읽는다.
- `#npc_base:655-678`에서 kuma는 쿠마, alyce는 아리스다. 반면 요한나는 `#npc_base:1126-1127`, 줄리아는 `:1215-1217`에 별도 등록되어 있다. `characters/alyce.png`, `kuma.png`, `julia.png`, `johanna.png` 모두 실제 존재한다.
- `#txt_2_man:348-368`의 텍스트는 줄리아·요한나와의 재회다. 화면 3과 18은 줄리아, 16·17은 요한나로 해석하는 근거가 명확하다. 15는 주인공이 줄리아에게 짐을 챙기라고 말하고 요한나와 이야기하러 나가는 전환이므로 “줄리아를 유지할지 요한나로 미리 전환할지”는 연출 판단이 남는다.
- 이 잘못된 alyce/kuma 지정은 **2026-10-01 보관 소스에서도 동일**하다(`interaction_city:4641/:4647/:4653/:4659/:4665`, 원본 SHA `59e1a1afb4fdd2e9bf9b1ffdcb12c10f2f4cc15d4cd3d890e21f8cb652f5958e`). 최근 전투 UI 때문에 새로 바뀐 것으로 볼 근거는 없다.

최소 수정 검토안: 이 이벤트의 `$special_action` 안 NPC ID만 장면별로 정정한다. alyce/kuma PNG 자체나 전역 NPC 매핑을 교체하면 정상적인 도나도나 이벤트까지 바뀌므로 하지 않는다. 이미 이벤트 중간에 저장한 세이브는 `$special_action` 배열과 현재 `$npc_id`가 저장될 수 있으므로, 이벤트를 다시 생성하면 줄리아 중복 생성이 생기는지까지 확인해야 한다. 로드 시 적용한다면 진행 페이지에 맞는 해당 이벤트 배열/ID만 갱신하는 범위를 검토한다. **현재 수정 없음.**

## 3. 에게야 기본/알몸 전신

- **현재 WORK에는 `content/pic/girls/full/egeya_blond_long.png`가 실제 존재한다.** 일반 파일(링크 아님), 125,368바이트, 795×596, SHA `9721334d792c098d3f3d629e7ca3f77418f040c33139d09ee8778cea92ac4bb3`. 따라서 현재 조사 폴더에서는 “이 파일 자체가 없다”는 전제는 성립하지 않는다.
- `json/slaves/2579_egeya.json:89`의 fullimage는 이 기존 기본 파일이다. `:101-108`에는 fullmade/secretary/mistress 및 indpack_title/naked/maid/secr/dom이 등록되어 있으며 모든 PNG가 실제 존재한다.
- 알몸/title은 모두 `girls/full/2579/2579_full_naked`. 이 파일은 259,298바이트, 795×596, SHA `f291b7ff6735663d69179f047fed3a666fdd2bf226082b3a267b8cfab6eff45b`. 기존 base와 다른 이미지다. 기존 base를 덮어쓰거나 원본 naked를 이동할 필요를 현재 경로 감사에서 확인하지 못했다.
- `display_fullimage:18`은 알몸 장비 `'голая'`를 naked로 매핑한다. `:60-70`에서 조수 image_mode 2/3/1은 maid/secr/dom을 선택한다. `:106-127`은 해당 indpack 이미지/기분 변형을 우선 사용한다. 현재 JSON 기준 4종 경로는 모두 유효하다.
- 10/26 작업 설명 `G:/somi/JO9sa/records/egeya-outfits-profile-20261026/MANUAL_KO.md:9`는 이전 세이브의 기본 별칭을 인식하기 위해 fullimage를 남기고 title에서 새 naked를 읽도록 했다고 기록한다. 이는 현재 코드·JSON과 일치한다. 예전 네이티브 테스트는 현재 실행 증명이 아니므로 이번 판정의 근거를 대신하지 않는다.

확인 남음: 실제 문제가 나타나는 폴더/세이브의 image_mode, cloth, 인물 fullimage 및 indpack globals. 특히 `display_fullimage:104`은 조수 mode0에서 helper wanted가 빈 문자열이 될 수 있지만, naked/title indpack 전역값이 정상이라면 뒤의 `:106` 우선 선택으로 정상 파일이 나온다. 이 빈 wanted만으로 현재 증상을 확정하면 안 된다. **이름변경·복사·덮어쓰기 없음.**

## 4. 구매자 소문 메뉴의 동일 인물 아이콘

- **공통 아이콘 사용이 확정.** `jo9_buyer_rumors:86`의 소문 구입, `:165/:168`의 이전·다음 소문은 provider에 관계없이 `$menu_item_services`를 쓴다. WORK `json/menu_icon.json:776`은 이 변수를 `content/pic/ui/legacy_overhaul/askaboutservices.png`로 정의한다.
- 화면 속 NPC 자체는 `jo9_buyer_rumors:145-150`에서 skups→master_skups, barman→barman, anes→anes로 정상 분기한다. 문제는 캐릭터 전체 매핑보다 메뉴 아이콘 선택 범위다.
- 기존에 사용 중인 후보: skups=`$menu_item_services`(askaboutservices.png), barman=`$menu_item_preferencesbar`(check preferences pub.png, menu_icon.json:1426), anes=`$menu_item_anes`(anes.png, :2302). 세 파일 모두 실제 존재하고 각각 59×66이다. barman은 현재 대화 메뉴 `jo9_buyer_rumors:38`, anes는 `:54`에서 이미 같은 NPC의 기능에 사용하는 키이므로 별도 그림 제작 없이 재사용할 수 있다.

최소 수정 검토안: provider별 로컬 아이콘 값을 골라 위 세 호출에 전달한다. 비용·토큰·소문/세이브 자료구조는 바꿀 필요가 없다. `$ongload:38-43`은 소문 메뉴를 다시 생성하고 현재 대화의 display_options도 갱신하므로 그 경로를 유지하며 확인한다. **현재 수정 없음.**

## 검증 범위와 보존

- QSP/JSON/파일 metadata/hash 및 기존 기록 대조. 게임 실행·GUI 재현·이미지 내용 열람은 하지 않았다.
- 최신 세이브 네 개(auto_day, quicksave, assaasas, nege)는 읽기 전용으로 관련 전역값만 확인했다. 모두 1064·2579 개인팩 globals가 현재 JSON과 같고, 조사한 소유 역할 29개와 stock에 1064·2579가 없어서 문제 actor의 저장 경로는 확인하지 못했다. 상세는 `save-reference-evidence.json`에 있다.
- 원본 QSP·JSON·PNG·세이브·Full·Git은 변경하지 않았다. 이 폴더에는 보고서·핵심 텍스트 발췌·경로/metadata 증거·재현 스크립트만 남긴다. 임시 전체 location 복사본은 제거했다.
