# Role and private-room link investigation

Read-only investigation; no runtime, source-mod, save, or configuration changes. Body line numbers below are one-based lines of the decoded QSP location, not physical lines of the compiled file.

## Verified inputs

- Current Work: `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp`
- SHA-256: `be2c993d24911fec5edfc0efceee9d4bd570c2d9e3a511975a69e29e383ba898`
- Manifest-matched original: `G:/somi/JO9O/game/_JO9_SNKmod_STATE/20260929_001051_6069d51a/original/jack.qsp`
- Original SHA-256: `070dad711ec21038684c713e7e4999bd913741aa953be4d16ebf123ffccf77dc`; matches `G:/somi/JO9sa/reference/vanilla_manifest.json`, `Rel=jack.qsp`.
- SNKmod 0.14 payload: `G:/somi/JO9O/JO9 UI_overhaul_SNKmod_0.14/payload/jack.qsp`
- Payload SHA-256: `8d963ae88dcea0db9500b29bcd5112933abd81042d5be8516113840094e607c6`.
- `G:/somi/JO9O/game/jack.qsp` itself already contains SNKmod code and is not the manifest-matched original.

## Milk-quantity icon

The inactive icon has a navigation `href` on a `div`. The working assistant icon has the same callback shape on an anchor. A normal `div` does not create a clickable hyperlink.

| Role/path | Current location:body line | Element | Callback |
|---|---|---|---|
| Ordinary slave status | `sjm_UI_UIadds:85` | `div` | `gs '#var_base' & msg $slave_milk_quantity` |
| Assistant status | `sjm_UI_UIadds:196` | `a` | `gs '#var_base' & msg $assistant_milk_quantity` |
| Private room 1-4 | `slave_private_room1` through `slave_private_room4:239` | `div` | matching `$roomN_milk_quantity` |
| Private-room activity screen while target is bridged | `snk_room_menu_screen:205` | `div` | `$slave_milk_quantity`, where the room subject is temporarily in `slave` |
| Slave profile, body tab | `slave_stat:619` | `a` | `$slave_milk_quantity` |
| Assistant profile, body tab | `assistant_stat:489` | `a` | `$assistant_milk_quantity` |

The ordinary status output is built by `sjm_UI_UIadds` and called from `main_screen:998`. Its generated status wrappers are output at `sjm_UI_UIadds:102` and `:213`.

`#var_base:376-482` contains separate quantity text builders for `slave`, `assistant`, and `room1` through `room4`. Each role starts its zero-or-more quantity case and overwrites it at higher thresholds. The non-clicking icon does not reach these callbacks; absence of a room quantity variable is not the identified cause.

Verified provenance:

- The manifest-matched original already has the ordinary-slave `div` at `sjm_UI_UIadds:51`, while assistant uses an anchor at `:142`.
- The original has working quantity anchors in all four private rooms at body line 208.
- The SNKmod 0.14 payload has the private-room `div` version at line 206, along with the new activity-screen copy at `snk_room_menu_screen:185`.
- Therefore ordinary-slave status is inherited from the original snapshot; the private-room failure is present in SNKmod 0.14. These defects predate the current trait-overview helper. This comparison does not assign an individual author or motive.

Minimal repair proposal, not applied: replace the six active milk-icon elements (`sjm_UI_UIadds` slave path, four private rooms, and `snk_room_menu_screen`) from `div.../div` to `a.../a`, preserving callbacks, role variables, style, image, and lactation conditions. Do not change the already working assistant or body-tab anchors. No new function, actor property, save migration, or persistence state is needed.

## Private-room portrait -> xenophily skill returns to room

The return is the deterministic fallback of an omitted menu number in the room bridge.

1. `slave_private_roomN:115` invokes `gs 'snk_room_bridge', 'portrait', N`.
2. Bridge `:24-34` enters the selected room, sets `snk_room_inventory=1`, clears profile information, sets profile tab 0, and goes to `slave_stat`.
3. Bridge `:54-86` records target N, sets `$snk_room_return='slave_private_room'+str(N)`, and swaps the selected room instance into the existing `slave` role using `$swap_slave_instances`. The ordinary slave is parked separately.
4. When no exam is in progress, `slave_stat:774` emits the original skill callback `menu_form=135 & $place='home_lux' & gt 'menu_form'`.
5. `menu_form:5` invokes the bridge guard before the menu body.
6. Bridge `:119-124` clears `snk_room_inventory` for destinations other than the supported profile/item screens.
7. The menu whitelist at bridge `:139-146` permits `131,132,133,134,136,137,138,139`. It omits `135`.
8. Bridge `:156-157` consequently calls `leave` and immediately goes to `$snk_room_return`. `leave:99-103` restores role ownership and clears the room-target flags.
9. The existing `menu_form=135` content at `menu_form:2212` is never reached through this path.

Affected: all private rooms 1-4 using the same bridge; also an existing room activity menu link to 135 if it reaches the same guard. The ordinary slave has no active room target, so this guard does not run. Assistant uses `menu_form=235` and its ordinary assistant path does not use the room bridge.

Exam caveat: when `exam_in_progress=1`, `slave_stat:770` uses the exam-message callback and returns to the current profile rather than requesting menu 135. The reported fallback matches the non-exam branch.

Verified provenance:

- The original snapshot contains the ordinary `slave_stat` callback to menu 135, but has no `snk_room_bridge` or `snk_room_menu_screen` location.
- The SNKmod 0.14 payload contains a bridge with the same missing 135 between lines 140 and 141.
- `G:/somi/JO9sa/mods/2026-10-10_restore_private_room_ui.json` explicitly adds this bridge, retaining the omission in `add_locations[name=snk_room_bridge].body`.
- Current `menu_form:4-7` guard integration carries verified patch marker `J9M2805` with that restore patch identifier.

Minimal repair proposal, not applied: add `if menu_form = 135: exit` between 134 and 136 in the existing bridge whitelist. This retains the existing room subject, its ordinary menu, lesson callbacks, and established close/return path. No additional function, actor property, or save state is required. The downstream interactions and ownership restoration require native runtime verification before implementation is called complete.

## Current lower-information trait path

`jo9_traits_view` is a separate UI path. `sidebar:26-80` consumes the already rendered trait list and recognizes simple existing `msg $name` or `gs 'jo9_traits','describe',key` callbacks for description metadata. `open/close/info:82-129` replaces only existing main HTML and `$info_text`; it does not execute `gt` or the skill-menu callback. Its role value is slave or assistant; a room subject viewed through the bridge uses the slave profile but remains the selected swapped actor.

`content/js/jo9_traits_view.js:138-146` only adds a one-shot remember call to existing native-message status anchors when the trait overview is open and those anchors already have `gt $curloc`. It does not turn status `div` elements into anchors or modify the right-side menu-135 skill link. Neither symptom is explained by the lower-information helper.

## Verification limits

- Current QSP structure parsed successfully and its supplied SHA matched.
- Source, generated markup, role swaps, guard order, original snapshots, and patch provenance were checked statically.
- This subtask did not run the engine, click the UI, load or modify saves, or test a proposed repair.
- Native checks should click the actual milk icons in each affected path, verify the correct role-specific quantity, then exercise room1-4 portrait -> menu135 -> back/cancel and downstream supported activities while checking original and room actor ownership. Ordinary slave/assistant and the exam branch provide regression comparisons.
- No temporary diagnostic QSP, extracted copy, or build was created by this subtask.
