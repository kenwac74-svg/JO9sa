# 집 상단 장비 아이콘 누락 조사 — 2026-11-02

번역 작업은 사용자 요청에 따라 중단했다. 이 조사는 현재 WORK의 QSP와 관련 이미지 경로를 읽기만 했다.

- 현재 WORK: `C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game`
- 조사 QSP SHA-256: `2f74d3194ee16c5400e09e06669fee39e32c851e5f03b22c188534ae3f9be9cb`
- 근거 파일: [audit.json](audit.json). QSP 행 번호는 로케이션 본문 기준이다.

## 확인된 원인

`main_screen:87–124`의 상단 의류바는 현재 아이템 그림인 `$item_demo`를 사용하지 않고 `content/pic/ui/legacy_overhaul/clothing bar small/<장착ID>.png`를 직접 조합한다. 기존 소형 아이콘과 현재 아이템 그림은 서로 별도 파일이므로 큰 그림을 교체해도 상단은 따라 바뀌지 않는다.

| 아이템 | ID / 장착 부위 | 아이템 정의·장착 목록 | 큰 그림 | 상단 전용 소형 아이콘 |
|---|---|---|---|---|
| 퍼레이드 복장 | `slaveparad` / 의류 | 있음 | `scene/item/slaveparad.png`, 795×596, 있음 | 없음 |
| 노예 팔찌 | `sleivbraslety` / 손 | 있음 | `scene/item/sleivbraslety.png`, 795×596, 있음 | 없음 |
| 빵봉지 | `paper_bag` / 머리 | 있음 | `scene/item/item_paper_bag.png`, 795×596, 있음 | 없음 |

세 항목 모두 `ui/legacy_overhaul/<ID>.png`의 59×66 메뉴용 그림도 존재하지만 상단에서는 그 파일을 읽지 않는다. 기존 상단 소형 아이콘의 예인 `rich_dress.png`는 25×25다. 최종 표시 크기는 `css/base.css:9780,9785–9787`에서 26×26으로 고정한다.

## 같은 원인의 누락 범위

상단의 10개 장착 부위와 대응하는 노예 장착 목록을 대조했다. 부위별 중복을 포함한 후보 131개 중 소형 파일이 없는 아이템 ID는 29개다. 아래 29개는 실제 아이템 이름 정의, 장착 소스 내 ID, 소형 파일 부재를 재확인했으며 개별 큰 그림이 있는 22개는 그 PNG의 존재도 확인했다. 전투 장비 후보에는 이번 소형 파일 누락이 없었다.

| 부위 | 개별 큰 그림이 있는 누락 ID — 22개 |
|---|---|
| 의류 — 13개 | `deprivation_suit`, `slavecostume`, `smalldress`, `dancecostume`, `korset`, `wooltunika`, `slaveparad`, `slavetunika`, `kimono`, `charcostume`, `tunika`, `toga`, `paradtunika` |
| 머리 — 1개 | `paper_bag` |
| 귀 — 2개 | `klips`, `kaffs` |
| 목 — 1개 | `steel_leash` |
| 손 — 4개 | `sleivbraslety`, `encrustedbracelet`, `brasletyboho`, `chain_straps` |
| 신발 — 1개 | `sandalii` |

개별 큰 그림이 없는 7개는 미정의 아이템이 아니라 이름이 등록된 세트 부품이다(`#item_base:1777–1808`). `underwear_nun`(수녀 드레스), `wimple_nun`(수녀 머릿수건), `rosary_nun`(묵주), `heels_nun`(수녀 하이힐), `slut_dress`(창녀 드레스), `slut_wig`(창녀 가발), `slut_boots`(창녀 부츠)다. 이들은 개별 그림 재사용만으로 해결할 수 없어 세트 대표 그림 또는 부품별 소형 그림 중 표시 방식을 정해야 한다.

따라서 이 세 항목은 아이템 정의나 장착 기능이 사라진 것이 아니라 상단 전용 이미지 경로에 파일이 빠진 표시 결함이다. 실제 플레이 화면은 이번 조사에서 실행하지 않았으므로, 현재 세이브의 장착 상태나 다른 화면에서의 표시까지 재현했다고 보고하지 않는다.

## 표시 조건

- 상단바는 현재 훈련 중인 노예의 실제 장착 장비를 표시한다(`main_screen:80–86`). 소유 중인 모든 장비나 조수의 장비 목록이 아니다.
- `header_clothing=0`은 의류·장신구 모드이며 위 세 아이템은 여기서 표시된다. `header_clothing=1`은 전투 장비 모드다(`main_screen:129–154`).
- 기존 조사인 구형 하녀 전신 `fullmade` 21개 누락과는 별개다. 그때 수정한 캐릭터 JSON 경로는 이번 상단 렌더 경로를 바꾸지 않았다.

## 수정 방향 — 아직 미적용

상단의 착용 아이템 이미지를 현재 사용하는 아이템 그림과 연결하면 구형 이미지 잔류와 개별 그림이 있는 신규 장비 22개의 소형 파일 누락을 함께 해결할 수 있다. 세트 부품 7개는 별도 표시 방식을 정한다. 기존 26×26 표시 크기·위치·장비 전환 버튼과 미착용 상태 표시는 유지하는 범위로 수정한다. 파일별 소형 그림을 계속 별도 관리할 경우에는 모든 장착 가능한 아이템의 빠진 소형 그림을 보충하고 이후 그림 교체 시 함께 갱신해야 한다.

현재 게임 파일·이미지·세이브 수정 및 커밋·푸시는 하지 않았다.

## 후속 확인 — 7개 부품의 실제 획득 여부

7개 모두 실제 구매 및 장착 경로가 있다. 개별 판매가 아니라 **홍등가 → 벼룩시장 → 노예를 꾸민다 → 노출 의상**에서 세트 구매로 지급된다. 현재 훈련 노예가 있어야 진입할 수 있다.

- `interaction_city=39932`: 수녀 복장(`nuncostume`) 구매, 가격 60스파크. `buy_item_nun` 처리의 구매 확정 콜백에서 세트와 함께 `underwear_nun`, `wimple_nun`, `rosary_nun`, `heels_nun`을 각 1개씩 노예 소지품에 더한다.
- `interaction_city=39933`: 창녀 복장(`slutcostume`) 구매, 가격 30스파크. `buy_item_slut` 처리에서 세트와 함께 `slut_dress`, `slut_wig`, `slut_boots`를 각 1개씩 더한다.
- 조수용 구매에도 같은 부품 지급 코드는 있으나(`buy_item_assistant_nun`, `buy_item_assistant_slut`), 메인 상점의 조수 꾸미기 진입 버튼은 주석 처리되어 있다. 조수용 일반 접근 경로를 보장한 것으로 해석하지 않는다. 노예용 구매로 지급된 각 부품은 해당 부위의 착용 목록에 나타난다.
- 판매는 `bara_appear[19]=3`(수녀 복장), `bara_appear[20]=3`(창녀 복장)인 재고 조건에서 활성화된다. `next_day:4430–4434`에서 재고를 다시 추첨한다. 이미 해당 세트를 보유했거나 해당 드레스를 입은 경우 메뉴가 비활성화된다.
- 세트 대표 그림인 `scene/item/nuncostume.png`와 `scene/item/slut_costume.png`는 모두 존재한다. 앞서 말한 '그림 없음'은 **부품별 개별 그림과 상단 소형 아이콘**에 한정한다.

따라서 미사용 잔여 ID로 제거할 항목은 아니다. 이 후속 확인도 현재 소스 경로 조사이며 실제 게임에서 구매 버튼을 눌러 재현한 것은 아니다.
