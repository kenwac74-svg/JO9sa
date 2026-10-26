# Save factory reproduction notes

Use `prepare-live.cjs`, the recipe JSON files and actual native Game -> Load. The saved input uses an existing numeric slot only to choose the recipe; the engine creates and clears its temporary selector. Final output uses the original load callback and contains no helper calls.

Do not restore saved state with the older `qa.primeState` helper: it omits zero values and multiline script values. A complete literal-assignment prototype reached100MB and timed out; it was discarded. Native Load preserves the original complete variable table directly.

Before database refresh, repair the15 missing unaliased scalar slots described in the independent review. Do not assign an arbitrary new variable slot in the save codec; QSP's stored slot is a native variable lookup position.

This FastQSP maps script OPENGAME to world loading, so it cannot substitute for Game -> Load. Script SAVEGAME worked with the relative `out/name.sav` path; the absolute forward-slash path did not write a file. Use relative output paths inside the isolated task root.

The day-end `end_of_the_day=1` prelude precedes the starvation warning. The24th creation was completed by the original next button; its repeatable recipe now starts with that prelude cleared. No day-end gameplay was changed.

Refresh resets some ordinary room background cache entries. `stage-pack.cjs` restores those caches from the existing current decoration values and the same lookup tables as the original `interior_restore`, including the matching saved image URL. Final24 was actually loaded and advanced in the unmodified WORK afterward.

The engine checksum is taken from a native Save in a byte-identical WORK world. Installed20/24/28 were then actually loaded with ignoreCRC=false in the temporary host. Do not alter the real WORK INI.

Keep `settlement-reference.delta.json` with final12: reconstructing the verification save from that pair was checked byte-for-byte. Temporary world copies, input duplicates, output duplicates and linked resources can be removed after final artifact hashes pass.
