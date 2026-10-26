# Var-base structure and list-index repair implementation plan

User authorized execution on 2026-10-21. Commit/push hold remains.

Goal: repair only malformed multiline openings and the empty first derived-list index while preserving current literals, condition expressions, actor data and save schema.
Architecture: exact old/new QSP edits to #var_base only, with existing codec and declarative mods. No new runtime functions, persistent variables, migrations or resource dependencies.
Spec: records/translation-proposal-review-20261021/REPORT_KO.txt and the user's subsequent two-fix approval. The proposal's additional age-expression changes, array substitutions, new prose and reward behaviour are excluded.

- [x] Re-read/hash Work; retain exact baseline and save fingerprints.
- [x] Reproduce current failure in the installed FastQSP on isolated full-record and extracted-list diagnostics before implementation.
- [x] Preserve each of 19 current condition expressions and RHS literals, splitting the RHS onto its first indented line so the existing end has its opening block.
- [x] Build list from0, preserve the redundant initial RNG call as rand(1,1), and set fallback index1 before filling fields. Preserve flaw_num selection boundary and array keys.
- [x] Compare all other QSP fields byte-for-byte; exact patch replay and second-application idempotence.
- [x] Test zero/one/many/repeated-state list cases, stale saved index1, sounds/config states, complete record execution and representative save state invariants.
- [x] Test actual native save loading/roundtrip when supported; distinguish it from the nine-path representative-state smoke and GUI/CRC limits.
- [x] Run the mandatory release gate and focused regressions before replacing Work. Recheck current hash immediately before application.
- [x] Apply Work only, preserve Full/ZIP/saves, document inputs/outputs/callers/side effects and limits; update second-patch bundle.
- [x] Independently review the final minimal patch; retain compressed baseline, patch, script and concise evidence, remove reproducible G temporary diagnostic copies after success.

Review focus: fallback writes before counter changes; RNG call count; front/late list consumer differences; stale derived fields in old saves; keeping unrelated current #static_txt/manual edits and all existing conditions/literals.