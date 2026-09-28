# menu_icon.json 누락 아이콘 목록

- 작성: 2026-09-28
- 기준: 순정 잭오나 2.3 (`reference/vanilla_manifest.json`, JO9O 순정 복원본)
- 검사 범위:
  - `json/menu_icon.json`의 `menu_item` 2,640개 항목이 가리키는 이미지 2,054종 중 순정 `content/pic/`에 없는 파일.
  - 사용처는 사용자 제공 `ref.zip`의 `locations/*.qsrc` 243개, `json/`, `css/`, `picture_modding/`의 txt·py를 전수 검색했다.
  - FIX6 상태 jack.qsp도 같은 결과였다. `$menu_item_…` 키를 변수로 조립하는 코드는 없었다.
- ref.zip의 css/base.css, json/menu_icon.json, json/menu_item.json은 순정 목록과 해시가 같다.

## 누락 파일 12개 (모두 `content/pic/ui overhaul/`)

| 파일 | menu_icon.json 키 | 순정의 정상판 | 게임 코드 사용처 | 처리 |
|---|---|---|---|---|
| agraba_gray.png | menu_item_agraba_gray | agraba.png 있음 (43,300 B) | 없음 | 보고만 |
| agraba_poor2.png | menu_item_agraba_poor2 | 해당 없음 | 없음 | 보고만 |
| agraba_poor2_gray.png | menu_item_agraba_poor2_gray | 없음 | 없음 | 보고만 |
| **cum_gray.png** | menu_item_cum_gray | cum.png 있음 (12,035 B) | **#sex_options 4곳, #sex_options_woman 4곳** | **cum.png를 회색 처리해 SNKmod에 추가 (사용자 지시)** |
| elisabet_gray.png | menu_item_elisabet_gray | 있음 (37,890 B) | 없음 | 보고만 |
| farm_shop.png | menu_item_farm_shop | 해당 없음 | 없음 | 보고만 |
| futaland_tower_gray.png | menu_item_futaland_tower_gray | 있음 (38,902 B) | 없음 | 보고만 |
| kamasutra.png | menu_item_kamasutra | 해당 없음 | 없음 | 보고만 |
| left hand_gray.png | menu_item_left_side_gray | 있음 (9,629 B) | 없음 | 보고만 |
| over the shoulder_gray.png | menu_item_the_shoulder_gray | 있음 (10,951 B) | 없음 | 보고만 |
| right hand_gray.png | menu_item_right_side_gray | 있음 (10,418 B) | 없음 | 보고만 |
| sabrina_2_gray.png | menu_item_sabrina_2_gray | 있음 (42,121 B) | 없음 | 보고만 |

- `agraba_poor2`, `futaland_tower`, `kamasutra` 같은 이름은 qsrc에 `$place`나 `$item_id` 값으로도 나온다. 이것들은 메뉴 아이콘 키가 아니다 (배경·아이템 식별자).
- `cum_gray.png`는 순정에 없는 파일이다. 결정 12에 따라 `content/pic/SNKmod/ui overhaul/cum_gray.png`에 넣고, menu_icon.json의 `menu_item_cum_gray` 경로를 SNKmod로 바꾼다.
- 0.1 소스를 받으면 0.1 QSP 기준으로 사용처를 다시 확인한다.
