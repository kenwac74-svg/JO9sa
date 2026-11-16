# Full242 packing ledger

- Plan: docs/superpowers/plans/2026-11-13-full242-packing.md
- Approved2.4.1 normal-screen saves; no combat saves.
- Current runtime64c2ce62e76cb9783e0c70dc4ba27febb037dccd65e077f97fa4826d92f0228c.
- Existing bds read-only format/role preflight; original unchanged.
- Release title corrected to 캐릭터 리마스터; Sadako/Yorha traits and Caroline bug-only, art unchanged.

- Added user-requested Chun reopening rumor to existing NPC rumor pages, WORK/source aligned. No separate gameplay checks requested. Runtime 3e63df565915e2158a7dce9ef169944c69edfa5b47eced5759b7a9ef772f4b6e.

- Input freeze completed:43,221 runtime files, only Marirose JSON drift; synchronized current outfit bindings without changing WORK.
- Player-only notes generated docs/release/2.4.2-player-20261113 (41 entries,53 portraits, no developer ledger/threshold/date spoilers). Developer notes preserved.
- Staging copying in session7812; output G:/somi/JO9_2.4.2_Full_20261113/JO9_2.4.2_Kor_Full. Current frozen QSP3e63df565915e2158a7dce9ef169944c69edfa5b47eced5759b7a9ef772f4b6e.
- Python3.14+PyInstaller+tkinter available via py -3.14; build portable save tool with no user Python install.
- bds.sav is2.4.1, non-combat realtor_office, assistant1/slave0. Original untouched. For official gate, make PRIVATE synthetic representative copying parked slave into live slot, never distribute it.
- Migration implementation still next: save-codec5.7 parses vars after header20; structurally map eligible header/path strings + vars, exact-ID/old-default names and default image fields only; no numeric/key/progress/CRC changes; reject combat/unsupported formats, no overwrite, repeat no-op. UI map canonical-link-journal rows (old/canonical) and audio converted.files plus current/old JSON ID mappings. Retain all legacy source addresses; no cleanup approved.
- Must run real engine load/save/reload and official9-path release-check, clean diagnostics before packaging. Full ZIP64 CRC+full extraction/hash test and final review required. No commit/push/remote upload or Kor_Full overwrite.

- Portable utility built at staging JO9_Save_242.exe using PyInstaller6.21/Python3.14, rules2711 paths/25 actor profiles. Unit14 pass incl actual legacy duplicate helper variables; real bds raw roundtrip exact, converted14 approved refs, all9849 variable numeric/slot/key structure and CRC preserved. Original unchanged.
- IMPORTANT cleanup: T/load-probe/{content,json,css,fonts} are owned junctions pointing to staging game resources. Remove ONLY junction entries after verifying targets, never recursively follow into staging.
- Gate attempt1 run-55lpO9:7/9 native pass; home/newgame blocked only by expected2.4.1->2.4.2 GAME_VER announcement, not an engine error. Attempt2 uses synthetic representative-current.sav with GAME_VER current to test baseline9paths, session18269 pending.
- Frozen exe inspection session16299 pending. Actual full-save OPENGAME/SAVEGAME probe prepared in T/load-probe, not run yet (must not overlap native engine gate). Current probe appends SAVEGAME/marker at end of compiled ongload; adjust only instrumentation if redraw goto bypasses it.
- Stage config.xml was UTF16LE BOM; fixed version title ONLY in stage, override recorded distribution-overrides.json. WORK config staysold; final package manifest must record this intentional override.
- Still needed: actual load/resave/reload; repeat migration; saveconverter CLI/frozen results; licenses, final review, ZIP64 CRC/extraction/full hashes, clean diagnostics, final user artifact link.

- Final QSP62a5f282... includes Shiru purchase portrait; focused enabled/gray/other-menu probePASS and official9-path gatePASS run-TCBn7C.
- Player notes43 entries,53 portrait cards: explicit Dohna23 backgrounds/stats/traits and Hassa reward. User late6 portraits copied only; no visual/gameplay reinspection.
- Final standalone tool17 testsPASS; report-path overwrite issue found in one review and fixed. Real converted save GUI load/new-file save/reload reached realtor_office. Version compatibility uses existing distribution option; CRC unchanged by converter.
- Ready for fresh ZIP64 manifest/CRC/complete extraction hashes. No commit/push/upload, old Full unchanged.
