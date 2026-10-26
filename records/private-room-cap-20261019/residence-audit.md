# Current Work residence and private-room audit

Read-only source: `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp`, decoded using `G:/somi/JO9sa/tools/qsp_dump.py`; 259 locations. References below are one-based lines within decoded location bodies. No game execution or game/repository changes were made.

| Residence | `$estate` | district | city location | requested total cap | evidence |
|---|---|---:|---:|---:|---|
| Exiles / 추방자 | `kamira_house` | 4 | 41 | 1 | `#estate_base:33-50` |
| Exclusion / 배제 | `otchuzhdenie_house` | 7 | 119 | 1 | `#estate_base:61-79` |
| Ophiuchus / 뱀자리 | `serpis_house` | 3 | 31 | 2 | `#estate_base:91-108`, `interaction_city:2164-2179` |
| Redlight / 홍등가 | `Redlight_house` | 8 | 117 | 2 | `#estate_base:120-137` |
| Taurus / 황소 | `taurus_house` | 2 | 21 | 3 | `#estate_base:150-167` |
| Necropolis / 네크로폴리스 | `korvus_house` | 5 | 51 | 3 | `#estate_base:178-195`, `interaction_city:2126-2141` |
| Central / 중앙 | `centralkvartal_house` | 9 | 118 | 4 | `#estate_base:206-223` |
| White Town / 백색 | `white_house` | 1 | 111 | 4 | `#estate_base:234-251` |

`slum_house`, `eastkvartal_house`, `fogs_house` also occur in the game. They were not included in the supplied cap mapping and should not silently gain an expansion allowance. Existing sources use mixed casing for some estate string values (e.g. `RedLight_house`, `Otchuzhdenie_house`, `Centralkvartal_house`), so a lookup should account for the existing case conventions.

## Existing expansion and counter semantics

- `kulaconstruct` is one global persistent number, with 0 as unbuilt/default and 1-4 as built room counts. It is separate from the rental `boudoir` flag. All 259 location bodies and their action inventories were searched: no explicit reset or per-estate copy of `kulaconstruct` exists; all action inventories are empty.
- `#options:4388-4433`: `$KulaShop_options[7]` is the expansion menu, gated by `$estate = 'white_house'` at line 4396. Stage prices are 5000, 2000, 5000, 10000 for total room counts 1, 2, 3, 4. Stage 4 is disabled. No owner/nobility check is part of this menu.
- `interaction_city:11754-11800`: handlers 951011-951014 set `kulaconstruct = 1/2/3/4` and charge the prices above. They currently do not independently validate money, current stage, or estate. Stage 1-3 text refers to a second floor.
- `#options:4090`: the Kula shop's initial page exposes expansion service without an extra residence check.

## Existing room access and persistence

- `menu_form:176-178`: second-floor navigation checks White Town and `kulaconstruct >= 1`.
- `menu_form:250-288`: second-floor room list. Room 1 is unconditional within this page; room 2/3/4 thresholds are at 265, 272, 279-280.
- `main_screen:736,748,760,772`: four portrait navigation gates each check White Town and the corresponding construction count.
- `slave_private_room1..4`: no residence/construction guard at location entry. `interaction:12264,12284,12304,12324`: assignment handlers check loyalty (`slave['moral'] >= 3`) and swap current slave and room instance, without construction/cap validation.
- `new_estate:6-39` reinitializes rental facilities and interior names; it leaves `kulaconstruct` and all four room occupants untouched. Rental completion calls this at `interaction_result_city:482-486`. Relinquishing residence calls it at `interaction_city:2074-2076`.
- `interaction_city:2049-2055` already blocks relinquishing the current residence if any room contains `slave_exist`; the check does not include faint/dead occupants. This old behavior was observed, not changed.
- Room food, chores, and daily processing continue without checking residence or construction count (e.g. `next_day:3391,3429,3467,3505` and `4493,4507,4521,4535`). Lowering or clamping access alone can hide saved occupants while their daily effects continue.

## Other state dependencies

- `#options:2047` uses `kulaconstruct > 0` as one of the broker quest prerequisites (with brand/guild reputation 3+, noble status, broker quest 0). Broader room construction eligibility naturally allows this prerequisite outside White Town unless separately changed.
- Garage access is unrelated. `city_menu_form:510,522-524` uses the biker garage icon and interaction IDs 9210/9214/9218, gated by `Байкер_квест` and `npc_progress['biker']`. There is no `kulaconstruct` dependency. Avoid broad replacements of facilities or generic house/estate flags.

## Design risks to keep explicit

1. Updating only the Kula expansion menu leaves room access White Town-only.
2. Enforce caps in construction action execution as well as rendered choices, because current handlers trust UI state.
3. Keep purchased count and occupants intact across old saves/moves. A current-residence access cap must leave a way to retrieve any existing occupant above that cap, or relocation must prevent this state; silent counter/occupant deletion is unnecessary.
4. Base `boudoir` rental and private `room1..4` are separate systems despite both using Korean display text translated as personal room.

Raw decoded JSON: `work-residence-audit.json`. Selected decoded locations are saved as `*-baseline.txt` next to this report for exact line references.
