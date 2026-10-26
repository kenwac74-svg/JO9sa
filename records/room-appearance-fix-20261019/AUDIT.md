# Private room appearance path audit

Read-only input: `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp`.

Input SHA-256: `3611e194a385d0ed992e9f0ca45aca033e834dda9de901cb237c36439aba828f` (260 locations).

Decoded through `G:/somi/JO9sa/tools/text-workshop/core.cjs`. Adjacent `.txt` files are decoded location bodies with original body line numbering. No game, repo, or synced reference was modified and no interactive game was run.

## Confirmed rendering bypasses

| Location | Body lines | Actual behavior |
| --- | --- | --- |
| `slave_private_room1` | 47-49 | For an existing actor and `nsfw = 0`, renders `$room1['fullimage']` directly in `snk_room_character`. |
| `slave_private_room2` | 47-49 | Same direct `$room2['fullimage']` rendering. |
| `slave_private_room3` | 47-49 | Same direct `$room3['fullimage']` rendering. |
| `slave_private_room4` | 47-49 | Same direct `$room4['fullimage']` rendering. |
| `snk_room_menu_screen` | 13-15 | Room action menu renders the temporarily swapped `$slave['fullimage']` directly. |

All five use `interior_change`, `jo9_html` around the existing image HTML. They do not invoke `display_fullimage` and therefore do not consult `indpack_*` outfit or mood mappings.

`interior_change` body 1846-1917 transforms an existing image source through `jo9_path` and adds image controls. No `indpack` or actor/clothing resolution occurs in this location. Therefore this wrapper does not supply the resolution that room rendering skipped.

## Ordinary display resolution

`display_fullimage`:

- Body 11 checks actor state.
- Body 13-36 reads the actor's `cloth` and maps known game clothing names to patch outfit keys.
- Body 38-45 prepares the stored `fullimage` fallback and `indpack_<outfit>` array name.
- Body 51-99 selects actor type, fallback image, moral, and arousal. Existing supported actor branches are `slave`, `assistant`, `cow`, `prisoner`, `stock`, and `farmhand`.
- Body 102-126 reads `indpack_<outfit>[actor_type]`, then checks `_horny` when arousal > 3, otherwise `_rebel` when moral < 3. If the patch image is empty, it uses the actor's stored `fullimage`.
- Body 129 emits image HTML. Body 130 applies `interior_change` only for div ids `bg` or `large_image`.

`menu_form` body 199 (and numerous other slave action menu branches) calls `display_fullimage('slave', 'center_image_home')` only when `snk_room_target = 0`. During a room action, `main_screen` body 5 instead delegates to `snk_room_menu_screen`, whose direct image at body 14 bypasses the resolver.

`slave_stat` body 148 invokes `display_fullimage('slave', 'center_image', 'psy')`. Consequently the room actor's detail portrait can use the Indie appearance after the bridge swaps that actor into `slave`, while the room base and room action menu continue to use stored `fullimage`.

Important integration constraint: replacing a room call with `display_fullimage('roomN', ...)` alone is insufficient. The current resolver has no `room1`-`room4` branch, leaving `actor_type = 0` and `$def_image_path = ''` after the initialization at body 47-50.

## State transport and outfit changes

`snk_room_bridge` body 54-86 enters a room action. It saves `snk_room_target`, room actor and return location, swaps `slave` with the room actor at body 78, then swaps the now displaced room slot with `snk_parked_slave` at body 79. Body 88-106 leaves, restoring instances with swaps at body 99-100. No image map resolution occurs in the bridge itself.

`#static_base` body 409-444 defines the property/state/type/inventory/other variables transported by `$swap_slave_instances`. Body 449-476 swaps those arrays and refreshes feature/text bases. The actor's existing image properties and `cloth` travel with the instance; the swap does not generate an Indie `fullimage` value.

`item_change` body 194-196 changes `$slave['cloth']` in slot 24 without assigning `fullimage`. In room inventory this acts on the swapped room actor (`snk_room_bridge` body 39-46 and guard exception at body 119-122). Leaving the inventory restores that actor into the room, but direct room `fullimage` rendering still ignores the outfit selector.

## Home room shortcuts are separate

`main_screen` body 737-790 renders the four private room navigation portraits from `ava_clear` (existing actor), `ava_gray` (dead actor), `ava` (other nonempty states), or the empty portrait. It does not use `fullimage` or the outfit resolver. The room's header portrait similarly uses `ava_clear` (`slave_private_room1` body 113, corresponding lines for rooms 2-4).

This audit establishes the central resolver bypass. It does not establish whether an existing save's stored avatar fields are stale after database replacement; that is a separate refresh/migration question.
