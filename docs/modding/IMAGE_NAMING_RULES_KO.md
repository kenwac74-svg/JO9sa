# 캐릭터 이미지 파일명·경로 규칙

작성: 2026-11-09. 대상: `content/pic/girls/` 아래 노예 캐릭터 그림과 `json/slaves/<번호>_<이름>.json`의 이미지 키.

## 왜 정리하는가

지금은 같은 종류의 그림이 인물마다 다른 폴더와 이름을 쓴다.

| 같은 의미 | 인물별 실제 경로 |
|---|---|
| 하녀 복장 | `girls/full/maid/isabella.png` / `girls/full/cloth/1448_shiru.png` |
| 기본 전신 | `girls/full/isabella_black_long_milf.png` / `girls/full/2341_brown_short_milf.png` |
| 옷별 개별 팩 | `girls/full/2571/2571_full_apron.png` (일부 인물만) |

경로만 보고 무슨 그림인지, 어느 인물 것인지 알기 어렵다. 새로 넣는 그림부터 아래 규칙을 쓴다.

## 규칙

모든 전신 그림은 **캐릭터 번호 폴더** 안에, 파일명은 `<번호>_<종류>[_<상태>].png`로 둔다.

| 종류 | 경로 | JSON 키 |
|---|---|---|
| 기본 전신(알몸) | `girls/full/<번호>/<번호>_naked.png` | `fullimage`, `indpack_naked` |
| 옷 입은 모습(대표) | `girls/full/<번호>/<번호>_title.png` | `indpack_title` |
| 하녀 | `girls/full/<번호>/<번호>_maid.png` | `fullmade`, `indpack_maid` |
| 비서·교복 | `girls/full/<번호>/<번호>_secr.png` | `fullsecretary`, `indpack_secr` |
| 도미나 | `girls/full/<번호>/<번호>_dom.png` | `fullmistress`, `indpack_dom` |
| 옷 아이템별 | `girls/full/<번호>/<번호>_<옷>.png` | `indpack_<옷>` |
| 흥분·반항 변형 | 위 이름 뒤에 `_horny` / `_rebel` | `indpack_<옷>_horny` / `_rebel` |
| 컬러 초상 | `girls/face/<번호>.png` | `seed_ava_clear` |
| 흑백 초상 | `girls/face/<번호>_gray.png` | `seed_ava_gray` |
| 세피아 초상 | `girls/face/<번호>_sepia.png` | `seed_ava` |

JSON에는 기존처럼 `.png`를 뺀 경로를 적는다. 초상 키만 앞에 `content/pic/`를 붙인다.

`<옷>`은 게임이 옷 아이템에서 고르는 이름이다(`display_fullimage`): `apron` 주름 앞치마, `maid` 하녀복, `nurse` 간호복, `school` 세일러복, `sorc` 마법 망토, `leotard` 치어리딩 복장, `chainmail` 사슬 비키니, `kimono` 유카타, `sundress` 반투명 원피스, `lace` 명주 속옷, `cocktail` 명주 의상, `latex` 캣슈트, `exotic` 벨리댄스, `corset` 가죽 코르셋, `gorgeous` 화려한 드레스, `bride` 웨딩드레스, `tail` 삽입 말꼬리, `cow` 젖소 장비, `pet` 펫슈트, `restrain` 구속복.

## 옷 입은 모습(대표 그림)

게임은 옷 아이템에 맞는 그림이 없으면 대표 그림(`indpack_title`)을, 그것도 없으면 기본 전신(알몸)을 보여 준다. 그래서 대표 그림이 없는 인물은 무엇을 입혀도 알몸으로 보인다.

- 전용 그림이 있으면 `<번호>_title.png`로 두고 연결한다.
- 전용 그림이 없으면 하녀·비서·도미나 중 하나를 **공용**으로 지정한다. 이때 대표 그림 키가 그 복장 파일을 가리킨다. 예: 시루 = 도미나 공용(`girls/full/mistress/1448_shiru`).
- 대표 그림을 지정하면 알몸 키(`indpack_naked`)도 기본 전신으로 고정한다. 그렇지 않으면 옷을 벗겨도 대표 그림이 나온다.

캐릭터 이미지 체크리스트의 **옷 입은 모습** 칸에서 파일 선택·연결 또는 "하녀/비서/도미나 공용" 버튼으로 지정한다.

## 적용 방식

- 이미 있는 파일과 JSON 경로는 옮기지 않는다. 세이브에 저장된 경로와 기존 연결이 깨지지 않게 하기 위해서다.
- **새로 추가하거나 교체하는 그림부터** 이 규칙으로 저장하고 JSON을 연결한다.
- 체크리스트는 각 칸의 현재 경로가 규칙과 다르면 아래에 "규칙 경로"를 함께 보여 준다. 표시일 뿐이며 파일을 옮기지 않는다.
- 기존 파일 일괄 정리는 세이브 호환 확인 뒤 별도 작업으로 한다.
