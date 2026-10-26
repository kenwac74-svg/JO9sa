# UI investigation and minimal edit specification

Source inspected: `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp`, SHA-256 `8b9cf39fe2327079b0823f6e474c93151538a512fa8738ed5f330749a0940db5`.
This subtask did not write WORK, Full, protected originals, engine, images, or production saves. Root owns integration.

## Verified causes and fixes

1. `#options`, `$milk_cooperative[1]`: `내일의 우유 가격을 묻는다 ($0~5)` occupied two 62px rows. Its price suffix looked like a separate floating link but remained in the same original `interaction_city=472` anchor. Remove only ` ($0~5)`. `shop_general` additionally removes the exact old label suffix from the generated menu when `$place='milk_cooperative'`, so cached `$display_options` from an old save also renders correctly. The question action and right price board remain intact.
2. `json/menu_icon.json`, 11 pharmacy disabled icons: `<li id="grey" ="background:...">` lacked the `style` attribute name. Every referenced PNG already exists. Correct the 11 JSON values. `$menu` also corrects that exact malformed `<li>` prefix at its common `$args[1]` input, guarded by INSTR. This covers old saved icon variables without rewriting 11 globals on every pharmacy render. Numeric spacer arguments have empty string components and do not match. Paths, disabled grey identifiers, link commands, prices, and effects stay unchanged.
3. `menu_form=58` and `92`: the left potion column was absolute, while the right was relative and followed intervening normal-flow line breaks. Native measurements showed first rows at y212/y250. Add a `jo9_home_potions` class to the existing `main_screen` div only for these two menus, then give both columns `position:absolute;top:63px`, preserving their existing horizontal positions and left row height. The native right first label is **각인의 물약**, not 강인의 물약. The protagonist potion menu (38) is a single column.
4. `#barn_milk_can_stock`: the can is x1125 with rendered width85, but the quantity started at x1183 without a width. Three digits extended to x1234 beyond the can's x1210 edge. Set stock x1125/width85 and retain centered text and the existing y697. Native digit rectangles for 0, 8, and 250 are centered inside the can.

## Miracle Balm: existing behavior, no changes

All names below use the same `целительный_бальзам` stock. Pharmacy calls it **기적의 연고**; the home menu and inventory use **기적의 향유**; the battle link uses **치유의 연고**. There is no distinct `기적의 물약` stock identified here.

- Pharmacy `sp_txt=114`: $1200 buys five doses. Existing menu availability uses `sparks>1200`, while purchase execution accepts `>=1200`; neither condition is changed by this UI repair.
- Protagonist, `interaction=383`: consumes one dose; `master_wounds_rate-=25`; if `master_str<3`, adds `skill_adv_mul*2` to `master_str_rate`. The first use shows existing advice that recently received wounds benefit most. This is a rate adjustment, not an unconditional reset of every wound state.
- Slave, `interaction=583`: accepted administration consumes one dose; reduces `slave_rate['wounds']` by25 only when it was positive. Existing refusal/acceptance handling remains. Assistant `5513` similarly consumes one dose and conditionally reduces `assistant_rate['wounds']` by25. They do not receive the protagonist's strength-rate addition.
- Battle dynamic effect in `#боевые_предметы`: consumes one dose; sets `здоровье_игрока=макс_здоровье_игрока`, `выносливость_игрока=макс_выносливость_игрока`, adds20 to `дух_игрока`, sets `боль=0`, then goes to the enemy turn. The current descriptive label is less precise than these actual assignments.

## Interface, dependencies, and verification

`UI-edits.cjs` exports `buildUiEdits(doc)` -> four exact unique `{location,field:'body',old,new,count:1}` edits. It requires the existing text-workshop codec. `buildUiAssetEdits()` returns 13 relative-path edits: 11 JSON values and two CSS edits. Frozen copies are in `ui-edits.json` and `ui-asset-edits.json`. The helper reads WORK only to identify the asset baseline; consume the frozen specification after integration changes that baseline.

No location or persistent key is added. The only variable assignment added is the function-local `$args[1]` presentation correction and the existing `$text_display` presentation correction. Removing JSON repair retains the legacy source typo; removing `$menu` repair leaves old save variables vulnerable. Removing either the main-screen class or its CSS loses scoped two-column alignment. Removing milk CSS loses number centering. None of these pieces changes inventory, money, item effects, stats, or image bytes.

`ui-verification.json` and `ui-native-metrics.json` contain results. Eight native QtWebKit cases passed: pharmacy, steroids, slave columns, assistant columns, milk0, milk8, milk250, and the old cached milk label. All 11 legacy pharmacy backgrounds changed from `none` to the existing correct grey PNG URLs; both potion first rows are y212; quantity digit centers equal the can center; the question occupies one62px row with the same command. UI-only candidate structure, roundtrip, CRLF and marker boundary checks passed with273 locations.

`ui-probe.cjs` recreates disposable before/after suites under `G:/Codex/tmp/shop-text-quest-20261026/ui`; execute the generated `plan.json` with the existing `tools/qa/run-client-smoke.ps1`, then run `collect-ui.cjs`. The experimental `json-load-plan.json` is separate: OPENGAME probes timed out, so **native GUI Save/Load compatibility is not verified**. Cold KILLALL imported corrected JSON; an explicit `GS refresh_database` left a deliberately assigned icon sentinel intact. The common `$menu` input repair was therefore verified against deliberately primed old malformed icon values, independently of automatic JSON loading.

The first metric driver stored JSON directly in an EXEC URL, whose Qt normalization changed escaped href quotes to slash-quote. Collector handles that known diagnostic encoding; the retained reproduction script percent-encodes JSON before transport. This is diagnostic instrumentation only.

Temporary diagnostic QSPs, duplicate JSON/CSS, and diagnostic saves are reproducible and are cleaned after reports are collected. Production saves and original resources are preserved.
