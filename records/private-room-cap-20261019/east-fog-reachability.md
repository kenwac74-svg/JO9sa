# East and Fog residence reachability

Read-only investigation of the current Work QSP decoded as `work-residence-audit.json`, and current Work `game/json/` definitions. All references below are one-based body lines unless a JSON filename is given. No engine or game UI was executed.

## Result

Normal player acquisition routes for `eastkvartal_house` and `fogs_house` were not found in this build. East has a dormant rental demonstration/purchase handler but no offer leading to it, while Fog has residual demonstration dialogue and interior fallbacks but no residence assignment handler. Both also lack normal housing database definitions. Visiting those districts is implemented and does not make the district the player's residence.

## East: implemented handler, missing offer and database

1. `interaction_city:2247-2255` has action 1330: `$interaction_type = 'rental_demo'`, `$place = 'eastkvartal_street_rental'`, `$demo_var = 'basic'`, demo display location East, `$yes` sets `interaction_city = 13301` and jumps to `interaction_city`, then copies `$realtor_demo_eastkvartal`.
2. `interaction_city:2256-2261` has action 13301: `$interaction_type = 'rental_sex'`, charge 25 sparks, `$estate = 'eastkvartal_house'`, `$interior = 'basic'`.
3. Normal rental demonstration dispatch is `interaction_result_city:422-479`; at dialogue step 16 it jumps to `choice_screen` (`470-473`), where the previously supplied `$yes` would be used. Normal completion for `rental_sex` calls `gs 'new_estate'` at `482-486`.
4. No QSP caller of action 1330 exists, and 13301 is referenced only by the dormant demo `$yes` and its own handler. No menu-item JSON value 1330 or 13301 exists. Thus the handler chain is present but lacks its initial menu entry.
5. The visible realtor offer list is `$realtor_options[2]`, `#options:1727-1781`: White, Necropolis, Taurus, Ophiuchus, Exiles, Central, Redlight, Exclusion only. Current `game/json/menu_item.json:606-610` maps the first five to 1321-1325; lines 2132-2134 map the latter three to 1326-1328. There is no East/Fog realtor key.
6. `#estate_base` has housing definitions only for the slum plus those eight. It has no prestige, size, cost, location/district, or facility names for `eastkvartal_house` or `fogs_house`. No definitions of those house keys occur anywhere under current Work `game/json/` either. If forced into East, generic `new_estate` dispatch would still run but would read missing housing metadata; it is not evidence of a complete supported residence.

## East residential district visit is a different flow

- `city_menu_form:775-787`: East street is `city_form = 121`. A home link is drawn only if the player already has `$estate = 'eastkvartal_house'` (`779-781`).
- The public `주거 구역` menu item invokes action 102001 (`783-787`). This is a visitor area, not housing rental.
- `interaction_city:14496-14509` sets `$place = 'eastkvartal_residences'`, `city_form = 121`, copies `$eastkvartal_options` into `$display_options`, and enters `shop_general`. It does not change `$estate`.
- `#options:5141-5165` lists named NPC houses/shops and a return-to-main-street action. It contains no residence rental/purchase action and no 1330 reference.

## Fog: residual text, no assignment

- `fogs_house` occurs only in `start_game:21` and `hard_return:300`, where an already-set residence would choose the slum interior. There is no `$estate = 'fogs_house'` assignment in any location.
- `$realtor_demo_fogs[1..16]` is defined at `#txt_woman:2099-2126`, but is never copied or called by a rental action. The next array, `$realtor_demo_eastkvartal`, is defined at 2127-2154 and has the dormant call described above.
- Fog district visiting is `city_menu_form:1147-1154` (`city_form = 120`), with the theater (791), portal area (6217), and return to city gate. There is no player-home or rental entry.
- Portal action 6217 (`interaction_city:22330-22340`) sets `$place = 'fogs_street'` and copies `$fogs_options`. `#options:6783-6798` provides quest/portal actions and leaving to city_form 120. It does not change `$estate`.

## Character start, quest, and facility checks

- Character creation's visible residence `[+]/[-]` controls invoke `$rise_rep` / `$lower_rep` (`hero_creation:402`). The implementation cycles only slum, Exiles, Ophiuchus, Taurus, Necropolis, White (`#dynamic:3392-3550`).
- Default name/start selection assigns Ophiuchus for hero 13 or slum otherwise (`#dynamic:119-127`). Other explicit hero start overrides assign White Town. None select East/Fog.
- All QSP `$estate` assignments were reviewed, including dynamic fragments and quest code: East's single dormant handler is the only East assignment, and Fog has none. All 259 QSP descriptions and action arrays are empty, so no extra static actions are omitted from that body search.
- Basement rental is independent: `interaction_city:2263-2281` action 1331 sets `dungeon = 1`, its background, and payment; it does not change `$estate`. `new_estate:6-25` initializes facility flags from the already-selected residence; it does not select East/Fog or any other residence.

Conclusion is static reachability evidence from the current build, not a claim that old saves, console/state editors, or external modifications cannot hold these values. Neither residence should gain a new cap policy without a separate decision.
