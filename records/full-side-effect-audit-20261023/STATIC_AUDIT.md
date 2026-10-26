# Read-only full QSP static inventory — 2026-10-23

Pinned input SHA-256: `5aeff11fffe6e5f2523749987577f42dab870f4d0adee0df385375f9eefb074f`.

## Coverage and interpretation

All 263 location main bodies were decoded and inspected. The compiled QSP contains zero location-default action bodies. This does not mean the game has zero runtime ACT statements. The source spans 328,084 physical lines and 291,912 lines after string/brace grouping and continuation joining.

- Container parse and exact byte round trip: pass; case-insensitive location names unique; CRLF and provenance marker boundary checks: pass.
- Engine-derived preformat quote/brace grouping: no unterminated top-level quote or brace strings in any location.
- Source-derived standalone block screen: 14 warnings, itemized in `static-current.json`. These are 12 extra END flags, one duplicate ELSE flag (`interaction:9623`), and one unscoped ELSE flag (`interaction_city:20786`). This screen is stricter than some engine behavior and does not validate expression grammar. Do not report these 14 warnings as 14 confirmed runtime errors.
- Independent delimiter screen: one extra closing bracket at `interaction_city:16341`, `active[$quest[16]]] = 1`, in the `interaction_city=9021` block starting at16338. Installed FastQSP accepts the exact statement, and a follow-up assertion confirms `active['QA_QUEST']=1`. This is a static style warning, not an engine syntax or assignment defect.
- Direct literal location calls: 5,240; dynamic location calls:41. Strings, comments and brace-quoted code are excluded from this direct count.
- Unresolved direct literal references:79 call sites/56 target names. Two sites are custom data dependencies preceded by `INCLIB 'jack_custom.qsp'`, so absence from this world alone is expected.72sites belong to the legacy picture-selector family;5other sites are listed below. Every unresolved site is unchanged in both task baselines. This is a dependency inventory, not a claim that every site is reachable from current UI.
- Literal local JUMP calls:206; missing label names:0.72 label declarations include one duplicate: `$menu` `vampire_override` at222and277. A duplicate name is a review candidate; effect depends on engine label lookup and branch execution.
- Literal event callback assignments:7; targets exist or are explicitly cleared.
- Potential code-containing literals:5,554, including2,746brace strings. These are inventoried separately.36candidate strings trigger partial static warnings; examples include assembled menu string fragments and ordinary English prose beginning with `if`, so this number is not a bug count. Thirteen unresolved embedded-candidate references also include incomplete concatenation fragments.

## Concrete unresolved direct references outside selector family

| Location and line | Reference | Local condition |
|---|---|---|
| `city_menu_form:555` | `GS 'slave_to_temporary_cell'` | `city_form=119`, `temporary_cell_state=1`, no current slave |
| `interaction:12342` | `GT 'slave_private_room5'` | `interaction=7775` |
| `interaction:12346` | `GT 'slave_private_smroom'` | `interaction=7776` |
| `interaction:12351` | `GT '창관'` | `interaction=7778` |
| `interaction_result:1826` | `GS '$mod_slave_drop',1` | `slave[$target_affinity]<0` within teaching path |

The selector dispatcher itself has real incoming calls in `interaction.relations` and `sex_interaction_woman`; its missing targets must not be dismissed merely because they are old. Current UI reachability, customization settings and save states require targeted runtime checks.

## Baseline comparison

Both baselines have identical14block warnings, the same malformed bracket statement, the same79unresolved direct calls, and the same36candidate-literal static warnings. The current changes introduced no new findings in those screens.

- Before image change: `G:/somi/JO9_work_backups/isabella_event_image_20261023/before.qsp`, SHA-256 `daa953cd391d8268a57724d27b54194e71378dc9ef54ad1e79279cce6897d7db`.
- Before trait and image changes: `G:/somi/JO9_work_backups/disposition_traits_20261023/before.qsp`, SHA-256 `26115873b7cfbe72cc35531345fa319cfd759a5704b46bf80378e8fe1da59796`.

Historical presence establishes provenance; it does not establish safety.

## Installed-engine warning triage

A corrected bracket control passed before the other diagnostics. The seven initial semantic probes plus four focused follow-ups ran in isolated minimal worlds with the pinned snapshot's actual header, using the installed Work `jack.exe`. Results and stderr are preserved in `native-static-results.json`.

- Exact extra bracket: completion and expected assignment both pass.
- Top-level END: accepted; subsequent assignment and completion pass.
- Duplicate ELSE: both true-branch and false-branch minimal skeletons complete.
- ELSE without a preceding IF but with a following END: completes. The earlier unclosed ELSE fixture times out, but it differs materially from the large source, which has a later END.
- Two identical label names in separate IF branches: the second branch completes. A backward-loop failure was not reproduced.
- A nonexistent-location control and the actual unresolved `GS 'picture_selector_doublehousework'` both time out without completion. Stderr contains only startup text, so the runner does not identify the exact engine error dialog. Current UI reachability of each unresolved call remains unproved.

No fatal syntax failure was reproduced from the14standalone-block or1bracket warnings. These focused controls do not prove all original branch behavior.

## Final candidate rescan

The final candidate `81201e0eb964124b71fe0862ffca30e589a74d1578d7c140296574b3362760e0` was rescanned across all263bodies after the parent audit's mood-refresh reorder. Only the `jo9_traits` body differs from pinned input `5aeff11ff...`; descriptions and location inventory are unchanged. The final source has328,090physical lines and291,912grouped logical lines. Container/roundtrip/CRLF/marker checks pass, quote/brace grouping has no failures, and all existing warning/dependency inventories are unchanged. `static-final.json` records `NO_NEW_STATIC_FINDINGS`; it is not a whole-game syntax or behavior certificate.

## Reproduction and side effects

`static-audit.cjs` accepts `QSP_INPUT [OUTPUT_JSON]`. It uses the repository's existing QSP codec, release structure checks, marker checker, and source-derived preprocessor/block checker. It only reads the input. The optional output path receives one audit JSON; absent that argument, it prints a compact inventory. No game, save, Full folder or repository product file is changed. `static-summary.json` preserves compact baseline comparisons; the duplicate full baseline reports were removed after comparison.

`build-static-probes.cjs TEMP_OUTPUT_DIR` writes seven minimal one-location diagnostic worlds plus `probe-plan.json` under the specified temporary directory. Adding `--followup` writes the four focused follow-up worlds instead. It copies the container header from the pinned snapshot, validates native-runner name/marker formats, and uses the unchanged extra-bracket expression plus a corrected control. Additional worlds probe extra END, orphan ELSE, duplicate ELSE, duplicate labels and missing-location engine behavior. The first plan used an invalid marker naming format and was rejected before execution; it was corrected, and this fixture error is not a product finding.

Independent lexer smoke assertions verified that GS-looking text in comments, quoted strings and brace strings is excluded; a valid direct GS is counted; concatenated targets remain dynamic; and the extra bracket is detected while its corrected control passes.

These tools do not constitute a whole-language QSP compiler. They do not prove all expressions, generated code, save compatibility, rendering, all branch reachability or all gameplay side effects. Native engine and focused state probes remain separate evidence.
