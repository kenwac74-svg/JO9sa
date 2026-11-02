# Alchemy UI and terminology implementation plan

**Goal:** Apply the user's requested bottom-aligned alchemy character, two stock columns and shorter Korean item names to the active game.

**Design:** Keep the existing 795×595 scene frame. Remove the alchemist foreground from the offset menu and place it under the scene background at bottom0, retaining its native horizontal origin216. Clip the foreground to the scene so it cannot overlap dialogue. In the right parchment keep the location title and skill; show materials (distilled spirit plus six material stocks) and fourteen potions in two columns using storage UI Sandoll 미생26px/110%. Use scoped QSP styles, with no shared CSS/image edits.

**Terminology:** Visible 도수높은 주류→증류주 and 안개 괴물 점액질 / 안개 괴물의 점액질→괴물 점액질. Preserve inventory variables and image paths. Keep old persisted gastronomy-stock text recognizable by accepting both names in its migration regex; normalize old cached menu labels in the alchemy view.

- [x] Inspect current installation and root cause; independently audit layout and all terminology occurrences. Back up QSP/CSS and check byte roundtrip.
- [x] Write and observe failing native regression using actual shop_general with isolated external layout/image wrappers; cover both roles, old cached menus, no character, no inventory mutations, non-lab unchanged.
- [x] Implement minimal QSP patch and inspect field-level diff; no recipes or balance changes. Targeted on-load cache normalization covers existing saves.
- [x] Pass native regression115checks and official patch replay/idempotence. Check browser-rendered character boundary and stock widths with real game CSS/font. Previous storage regression110checks also passed.
- [x] Independent layout and terminology reviews; guarded install to current WORK at2026-11-03 00:38 KST; installed hash38ec5afc matches candidate; CSS unchanged. Report and restore point recorded.

Native diagnostics use no personal save. Rendered browser geometry and actual native gameplay verification are distinct; final gameplay visual confirmation remains with the user.
