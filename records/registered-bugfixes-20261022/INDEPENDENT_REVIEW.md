# Independent registered-bugfix review (2026-10-22)

Reviewed candidate SHA-256 `ba2210ecc9df7159ccee4355120fab07f180b67a00c01458fdcb33e0d0113956` against baseline `c6701e3ab130b1a762d0b1a523d52cd53cee846f71c3d7899a4c369389aa853d` and the consolidated 20-edit declarative patch. Read-only review; no live game edits.

## Critical

None identified.

## Important

**I1 - Repair consumes stale actor role identity before fresh JSON values can arrive.** `jo9_seed_role_images:79,93-94` clears the saved global role string, replaces the matching actor role with that saved global, and replaces matching actor fullimage with the saved base. Both `$ongload:1-3` and `$newloc:1-3` invoke this mutation before normal dispatch. The retained engine-source finding in `records/seed-namespace-fix-20261020/MANUAL_KO.md:30` records restore variables -> ONGLOAD -> JSON registration. Under that order, loading a save with `fullmade[2579]=girls/full/maid/kirakira` and the same cached assistant role clears both before a newly supplied JSON custom maid path is registered. A later helper call cannot recognize the cleared role/rebased fullimage, so the selected maid display stays at base instead of the fresh custom art. A stale saved base can likewise become a permanent actor fallback. Existing hooksFixture exercises complete ONGLOAD plus only the newloc prefix against already-initialized tables; it does not exercise fresh JSON registration after ONGLOAD. Parent accepted for correction; re-review required on revised candidate. Actual installed-binary load ordering has not independently been proved in this review; the local source note explicitly limits source/executable parity.

## Minor

None independently identified beyond the stated load-order regression coverage gap folded into I1.

## Independently verified

- Exact patch replay matches all 13 changed existing location bodies; all other 249 existing bodies, descriptions, and zero action counts remain unchanged. One expected helper is added. Latest metadata contains 20 edits after quest-text consolidation.
- Known legacy mapping stems match the 25-entry independent inventory: 96 exact role paths; four absent pregnancy paths excluded. High IDs and nonmatching custom paths are outside the match conditions. No actor identity/stat/relationship/equipment writes occur in the candidate helper.
- Fog changes are only the two min(existing fatigue result, prior energy - 1) expressions. Existing energy threshold mapping and `settled` guard remain intact; cancel/invalid entry and solo routing were not changed.
- Grinch uses existing dedicated option 10384, preserving the direct original battle route; load repair is bounded to shop_general/Grinch_battle/event10384/get_weapon0 and maps only old index14. No self-call from shop_general or new ONGLOAD recursion was found. Weapon selection remains excluded by the guard.
- Translation changes preserve callbacks/identifiers/conditions. Continued quest text is replaced in full without inserting comments inside continuation expressions; other added comments delimit complete source lines.
- Milk CSS changes only the two unique sign selectors. Each is defined once and only shop_general's milk scene consumes the IDs; dimensions and relative board/number offset remain unchanged.

## Resolver replacement coverage notes

A display_fullimage-only fallback would leave direct cached-fullimage consumers: end_day_screen:176/660/668/829/841/865/959/970/979/1097-1157; interaction_screen_city:160; stasis_cell:32; interaction:10172-10195 (six special_action constructors); interaction_city:1473/1694/10747/10828; sex_interaction_result:19. display_pic:75-184 has ten direct fullimage getter branches. Its raw-image hair inference at22-44 writes hairColor/hairLen and should not be broadened as part of a visual-only fallback. No constant fullimage-mode display_pic callers were found.

Full official release gate is the coordinator's pending work. Previously reported focused green results do not resolve I1; revised candidate and tests need fresh review.

# Revised candidate re-review (non-mutating resolver)

Reviewed integrated SHA-256 `f24ed3fdf8b945b885ef7ef2bc252ae3ee5201f5420a789aac802aa1589da6e7`, 54 combined edits, against the unchanged original baseline and `egeya-revised/edits.json`. This pass focuses on the newly added resolver and direct consumers. No live files were edited.

## Critical

None identified.

## Important

**I1 closed.** The helper's resolve branch (`jo9_seed_role_images:38-59`) returns a resolved path and does not mutate actor cache fields. It initializes the return to the original path, restricts replacement to the exact same-ID legacy role path, and uses the current registered requested role or base only at read time. Global cleanup (`:62-71`) retains the 96 exact known key/path pairs. No persistent repair flag is introduced. Consequently a later JSON registration can be observed on the next read because the original actor cache marker survives every pre-registration hook. I independently inspected both order fixtures: they exercise actual candidate ONGLOAD including its early GT, two newloc-prefix calls, a fresh base/role registration between those calls, and the original display_fullimage function. The coordinator supplied a source finding at engine-game.cpp:723-725 supporting ONGLOAD-before-JSON ordering; installed binary/source identity remains unproved.

No remaining functional Important issue identified.

## Minor

**M1 - Direct consumer replacements lack new inline provenance wrappers.** The 41 direct-consumer lines (42 expressions) are identified in the declarative mod and consumer inventory but are not themselves wrapped in new JO9 MOD START/END markers. Helper, hooks, and main display_fullimage resolver insertion are wrapped. Standing project provenance guidance asks for markers around changed blocks. Parent was notified; add appropriate wrappers or record the accepted provenance decision before the final handoff. This does not change the reviewed runtime behavior.

## Independent checks and evidence

- Verified the candidate hash and exact 54-edit replay across every existing location. The 20 changed existing locations are precisely those declared; descriptions/action counts remain unchanged and one expected helper is added.
- Independently rebuilt every new direct-consumer expression from its original cached field and corresponding actor_type. All 41 lines / 42 substitutions match exactly; outside the wrapped expression each original line is preserved, including EXEC construction quotes, interpolation delimiters, conditional guards, indpack preference, and before-clear image retrieval comments.
- Recomputed all 96 helper key/path pairs from its literal stems and exclusion condition and matched them against the independent pre-revision mapping inventory. No actor identity/stat/relationship/equipment/image_mode write or persistent revision/repair flag exists in the helper.
- Inspected display_fullimage ordering: resolution is applied after actor and assistant role selection and before the existing indpack/mood override, preserving override priority and nonmatching custom art.
- Repeated the whole-QSP raw cached-fullimage reference scan. Remaining unwrapped references are existing hair inference, image-show guards, and writes from registered base/role globals. All identified direct visual reads are covered. Raw hairColor/hairLen inference remains unchanged.
- Inspected the integrated all-direct-consumers fixture: it executes copied candidate expressions, checks rendered/interpolated strings, and dynamically executes all six generated special_action callbacks. Reviewed the two old-helper RED order results and the revised integrated 13/13 PASS records. Those native executions were performed by the implementer; this re-review independently inspected their fixture bodies and performed read-only replay/inventory checks.

Full official release gate remains the coordinator's separate check. This review does not assert actual user-save GUI loading or installed executable/source identity.

# M1 provenance closure

Final reviewed candidate SHA-256: `baaa39836b905e748a6ec8f356494b0260160a364164bc3684812394e4a9dbc9`.

**M1 closed.** Independently verified all 41 complete consumer statements now have matching JO9 MOD START/END EGEYA_STALE_ROLE_IMAGES_20261022 wrappers. Removing exactly those 41 wrappers (82 complete comment lines) in memory reconstructs the prior reviewed candidate byte-for-byte, SHA-256 `f24ed3fdf8b945b885ef7ef2bc252ae3ee5201f5420a789aac802aa1589da6e7`. Thus there are no new executable changes in this closure. No wrapper splits an underscore-continued predecessor line or statement. The final combined 54-edit patch also independently replays exactly from the original baseline.

No remaining Critical, Important, or Minor review finding. Prior resolver/consumer review conclusions apply unchanged. Native rerun and thin replay passes were reported by the implementer; the coordinator's final official gate remains separate. No further native concern was introduced by the verified comment-only difference.
