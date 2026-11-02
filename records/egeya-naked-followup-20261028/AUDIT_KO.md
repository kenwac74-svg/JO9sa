# 에게야 알몸 표시 후속 원인 감사

2026-10-28. 현재 WORK QSP `e620353d0db6374ae293c6919d511966c31e2bb68ebd1763bb5a956bec069ba0`를 읽기 전용으로 확인했다. 제품·JSON·PNG·세이브를 수정하거나 게임을 실행하지 않았다. 본문 행 번호는 이 기준 QSP를 `text-workshop/core.cjs`로 해독한 로케이션 내부 번호다.

## 확인된 원인

`display_fullimage:15-50`은 실제 `cloth`에서 의상팩 키를 먼저 선택한다. 조수는 `:59`에서 `$assistant_img_key=''`로 시작하고, mode 1/2/3일 때만 각각 `fullmistress/fullmade/fullsecretary`를 설정한다(`:60-70`). mode 0에는 역할키가 계속 비어 있다. `:104`는 이 빈 키를 `jo9_seed_role_images`에 전달한다.

`jo9_seed_role_images:44-58`의 현재 기본/역할 alias → 개인팩 변환은 요청키가 `fullimage`일 때만 수행한다. 따라서 조수 mode 0에서 실제 의상이 `sun_dress`, `nurse_dress`, `chainmail_bikini`, `common_apron`이면 각각 `indpack_sundress/nurse/chainmail/apron`이 선택되지만 에게야 JSON에 그 팩이 없어 `display_fullimage:106`이 빈 값을 얻는다. `:108-109`에서 조수의 기존 기본 캐시 `girls/full/egeya_blond_long`을 그대로 선택한다. PNG 존재 여부 문제와 구별되는 읽기 분기 문제다.

`assistant_stat:191`의 실제 ‘알몸’ EXEC는 `image_mode=0`과 `$assistant['fullimage']=$fullimage[assistant_type]`만 설정한다. `cloth`는 바꾸지 않으므로 이 조건은 버튼을 눌러도 유지된다. `slave_to_assistant:28`의 외형 초기화는 주석이고 `:30`에서 기존 인물 묶음을 교환하므로 옷과 외형 값이 함께 남을 수도 있다. `get_stock_seed:294`가 기본 캐시를 `$fullimage[type]`에서 생성하는 것도 정상 기존 동작이다. 해당 캐시 자체를 손상된 저장값으로 판단하면 안 된다.

## 모드 및 캐시 구분

| 현재 JSON 전역값이 있는 경우 | 기준 QSP의 선택 |
| --- | --- |
| 조수 mode 0, `cloth='голая'` | `indpack_naked`가 있어 현재 알몸 PNG |
| 조수 mode 0, 미매핑/빈 cloth | `indpack_title`이 있어 현재 알몸 PNG |
| 조수 mode 0, 위 네 가지 미보유 의상팩 | 빈 팩 → 기존 base PNG |
| 조수 mode 0, 보유 `maid_dress` 팩 | 기존 규칙대로 메이드 팩 우선 |
| 조수 mode 1/2/3 | 각각 dom/maid/secr 팩 우선 |
| 일반 인물 기본 조회 | 요청키 `fullimage`로 알려진 alias를 개인팩으로 해석 |
| stock | `indpack_title`을 명시 선택 |

기분별 이미지가 없다는 이유만으로 base로 빠지지는 않는다. 기본 의상팩이 있으면 `display_fullimage:120-127`에서 그 팩을 유지한다. 사용자 임의 경로는 알려진 alias와 일치하지 않는 한 resolver가 유지한다. 과거 `girls/full/maid/kirakira` 같은 legacy 역할 캐시는 별도 `jo9_seed_role_images:61-73` 분기이며 현재 base 캐시 문제와 구별한다.

## 현재 JSON·파일 및 로드 한계

`G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2579_egeya.json` SHA256은 `3e6055b7709a9dc57b02f688ea44639f6d95af261c9fffd0ff523d83ba84a8ec`이다. `fullimage`는 `girls/full/egeya_blond_long`, `indpack_title`과 `indpack_naked`는 모두 `girls/full/2579/2579_full_naked`다. maid/secr/dom 3종도 지정되어 있고, 위 네 가지 의상팩은 없다.

base PNG와 현재 알몸 PNG는 모두 795×596이며 서로 다른 파일이다. base는 125,368바이트/SHA256 `9721334d792c098d3f3d629e7ca3f77418f040c33139d09ee8778cea92ac4bb3`, 알몸은 259,298바이트/SHA256 `f291b7ff6735663d69179f047fed3a666fdd2bf226082b3a267b8cfab6eff45b`다. maid/secr/dom도 현재 존재한다. 이미지 픽셀은 열람하지 않았다.

`$ongload:74-76`은 알려진 과거 역할 전역값만 정리하는 helper를 호출한다. 인물별 fullimage 캐시를 일괄 덮는 코드가 아니다. JSON 파일의 현재 값만으로 개인 세이브의 엔진 전역값·인물 캐시를 확정할 수 없으며, ‘전역값이 갱신되지 않았을 것’이라는 가정은 위 원인의 필수 조건이 아니다. 현재 JSON 전역값과 정상 기본 캐시만으로 설명된다.

담당 native 검사에서 실제 알몸 EXEC의 대입문과 현재 display/resolver를 사용해 위 네 의상에서 base 선택, `голая`에서 현재 알몸 선택을 재현한 기록을 별도로 제공받았다(`tests/red-results.json`, `tests/matrix-results.json`). 개인 세이브나 GUI 픽셀 검증과는 구분한다. 초기 10/26 검사의 `cloth='голая'`만으로는 이 분기를 검증할 수 없었다.

본 감사에서는 파일 교체·이름 변경·새 그림·모드별 옷 우선순위 재설계를 제안하거나 적용하지 않았다. 후속 후보 검토는 `REVIEW_KO.md`에 분리했다.
