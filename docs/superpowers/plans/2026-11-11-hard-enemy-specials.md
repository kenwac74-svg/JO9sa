# Hard enemy specials implementation plan

> For agentic workers: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement the tasks below.

**Goal:** Activate the existing defined enemy special attacks only for the in-game hard setting difficulty_setting=2.

**Architecture:** Keep the original ordinary attack selection and non-hard behavior. Extend hard selection with valid, unspent specials with equal probability across the available pool. Track each special once per enemy per fresh battle and preserve that state through relay, redraw and save/load. Retain actual attack definitions and effects, with the existing adaptation effects targeting their caster rather than fixed enemy1 in hard combat.

**Tech stack:** Existing QSP codec, declarative mods JSON, official apply_mods.ps1, installed FastQSP engine and isolated native harness.

**Spec:** User approved hard-only activation after the 30-defined-specials audit. WORK baseline fef0baedfa22746366fc9ce5acf16e4fa04922fd63e9c5c133c559ecb4265357.

## Constraints

- Use in-game difficulty_setting=2; do not change character-creation game_difficulty, cheat_fight_dif or held original difficulty bonus discrepancies.
- Each enemy can use each defined special once per battle. Missing special fields must never enter selection. Existing ordinary attacks remain in the pool with their original class limit1/2/3.
- Do not fix the ordinary-attack HTML status-key mismatch or alter enemy numbers, skill effects/durations or protagonist/slave mechanics.
- The missing archmage AI may route to the existing standard AI in hard only so its existing three specials are reachable; other difficulty behavior stays unchanged.
- Preserve WORK manual changes, personal files, audio, Full and existing saves. No commit/push.

## Review focus

1. Easy/normal select only the existing normal attacks.
2. Absent specials and already-used specials do not become selectable or cause an infinite retry.
3. Two enemies can independently use the same special slot; adaptation affects the actual caster.
4. Fresh battles reset use flags; weapon UI redraw and fog relay resume do not refill specials. Save/load retains flags.
5. Ordinary attack definitions/effects and all enemy resources remain unchanged; all30 specials are reachable in hard.

## Tasks

- [x] Build a failing baseline engine test for hard special reachability; record RED before writing product code.
- [x] Add focused hard selection/effect bookkeeping and fresh-battle reset, plus hard-only archmage routing. Record every QSP edit in mods.
- [x] Run actual-engine hard/easy/normal, all30 effects, multi-enemy target/once-per-enemy, missing skills, fresh/reset/relay and save/load tests. Record instrumentation limits.
- [x] Verify QSP roundtrip, CRLF/markers, exact official replay and idempotent reapply, then install WORK and tracked runtime/metadata.
- [x] Independently review final scope; refresh the existing enemy reference tab and documents without regenerating the other DB sections or personal ideas.
- [x] Preserve minimal recovery and reproduction scripts; remove reproducible diagnostics. Report gameplay UI/manual save limitations.

## Completion record

Installed WORK/tracked QSP 21f41a5203fffa565369c81a9fd11f57874f1af99010709ef1af1240e01fdc40. Actual-engine candidate and installed suites each passed six probes and 923 executed assertions. Persistent use flags were restored/resaved through supplemental native API; actual GUI SAV loading remains unverified. The later user naming request is complete: 30 specials use 16 shared reference names with caster and slot labels in a real HTML table. Chunhyang hard balm stock 6 is recorded as unimplemented planning; easy/normal stock is 3. Full/audio/commit/push were not changed. See records/hard-enemy-specials-20261111/REPORT_KO.md and records/enemy-special-reference-20261111/REPORT_KO.md.
