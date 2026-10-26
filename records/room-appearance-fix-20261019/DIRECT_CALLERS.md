# Direct fullimage rendering inventory

Input hash remains `3611e194a385d0ed992e9f0ca45aca033e834dda9de901cb237c36439aba828f`.

There are 16 uncommented direct `fullimage` image-source expressions across 14 location bodies. `DIRECT_FULLIMAGE_INVENTORY.json` records each exact source line and nearby context. Button sources on lines that merely assign a `fullimage` property were excluded.

## Live ordinary role displays: 11 expressions

| Location/body line | Image expression | Surrounding condition | Existing resolver role |
| --- | --- | --- | --- |
| `assistant_private_room:25` | `$assistant["fullimage"]` | `assistant_state = CONST_INT['slave_exist'] and nsfw = 0` | `assistant` supported; applies image_mode 1/2/3 plus moral/arousal. Strong direct match for an existing assistant of type 2571. |
| `prison_cell:65` | `$prisoner["fullimage"]` | `prisoner_state = CONST_INT['slave_exist'] and nsfw = 0`, then else of `prisoner['prison_food_type'] = 3 and prisoner['fat'] = 5` | `prisoner` supported; outfit map plus moral/arousal. Preserve the special fat-scene branch. |
| `barn:26` | `$cow["fullimage"]` | `cow_state = CONST_INT['slave_exist'] and nsfw = 0` | `cow` supported; forces `indpack_cow` plus moral/arousal. |
| `menu_form:255` | `$assistant["fullimage"]` | `menu_form = 30010`; `nsfw = 0 and $assistant['fullimage'] ! ''` | `assistant` supported. Room selection menu; no uncommented current QSP setter for menu 30010 was found. |
| `menu_form:330` | `$assistant[''fullimage'']` | `menu_form = 4`; `nsfw = 0` | `assistant` supported. Assistant assignments. |
| `menu_form:2703` | `$assistant["fullimage"]` | `menu_form = 239`; `nsfw = 0` | `assistant` supported. Assistant lesbian activity menu. |
| `slave_private_room1..4:48` (four expressions) | `$roomN["fullimage"]` | `roomN_state = CONST_INT['slave_exist'] and nsfw = 0` | `room1..4` not supported yet. |
| `snk_room_menu_screen:14` | `$slave["fullimage"]` | `slave_state = CONST_INT['slave_exist'] and nsfw = 0` | `slave` supported; contains the room actor while the bridge is active. |

The assistant, prison and barn image wrappers use `style="position:absolute;top:3px;left:150px;"`; the rooms use `id="snk_room_character"`; the three menu branches use `id="center_image_home"`. Preserve these wrappers/positions and the existing `interior_change('jo9_html', ...)` coverage when rewiring image selection.

Resolver actor behavior (`display_fullimage:51-99`): assistant uses its own type, moral/arousal and image_mode (1 = `indpack_dom` / `fullmistress`, 2 = `indpack_maid` / `fullmade`, 3 = `indpack_secr` / `fullsecretary`), falling back to stored `fullimage` if the selected assistant fallback property is empty. It does not inspect the assistant job variable. Cow selects `indpack_cow` regardless of clothing. Prisoner selects the clothing array. Resolver state gate at line 11 accepts only `slave_exist`.

## Additional role-specific event overlay: one expression

`special_screen:85` directly renders `$fullimage[assistant_type]` inside `$interaction_type = 'talk_assistant'`, `nsfw = 0`, and `assistant['image_mode'] = 0`. This is a live assistant role overlay rather than a registry browser; it can also miss the Indie outfit selection. Current QSP has an incoming `gt 'special_screen'` at `выход_из_боя:583`. Keep the existing mode-0 condition if rewiring; broadening it to other modes would add display behavior. This is an appropriate small additional appearance repair if the parent includes all role overlays.

## Frozen/template views: four expressions

- `stasis_cell:31`: `$dynslave["fullimage"]` within `$stasis_cell`, expanded at line 186 by replacing `dynslave` with `iced_<<cryo_cell_selected>>`. It displays any nonempty frozen instance (`dynslave_state ! no_slave`) when `nsfw = 0`, unlike the common resolver's `slave_exist` gate. Current common resolver has no `iced_N` branch. Repair would broaden role support and needs preservation of frozen state display semantics; separate from the ordinary private-room links.
- `$addon_custom_data:517`: `$fullimage[args[1]]` in `display_slave_id`, a template/id preview; no live actor or outfit.
- `slavebase_test:109`: `$fullimage[slave_type]` when `txt = 0`; database debug view. Adjacent lines intentionally preview `fullmade`, `fullmistress`, and `fullsecretary` separately.
- `black_market_interface:98`: `$fullimage[s_type]` where `s_type = bm_index[txt - 1]`; seed catalog before purchase, not the current `$stock` instance. No actor outfit/moral to resolve.

## Indirect scene snapshots

This direct inventory deliberately does not classify arbitrary `$bg_path` and `$special_image` renderers as ordinary role portrait links. There are event/death/end-day snapshots copied from actor `fullimage` into those variables. Several are captured immediately before clearing the actor (`end_day_screen:1097-1157`). Changing the generic scene renderer to resolve a current actor would lose that snapshot association. They require event-specific inspection if separately requested.

The obvious completion scope for the reported live links is the 11 ordinary expressions above; adding the single `special_screen` assistant overlay closes the remaining direct live-role expression. The four frozen/template expressions should remain separately recorded, rather than being silently redirected through a live actor.
