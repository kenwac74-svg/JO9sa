# Independent bath/wake review

Reviewed intermediate candidate `6b86c2c2de7a0a53d813bc4bf0eb9d9f83ee10b361342b8aafa5c18a4cd2c2f1` against Work baseline `8cbfec07ad3a3e3eab5c1f4d492ecb40f504d5545b6e71d436c1440359c956a5`. This review precedes any separately approved left-property daily-effect guards.

The candidate next_day body exactly equals the source-derived `bath-wake-transform.cjs` output. Original end_day_screen and display_pic bodies remain byte-identical to the baseline. Bath actor payloads remain original; only selection/reset/gates and the original main-refusal fallback routing are added. Actor-specific event flags continue to select the existing role-specific CG and text.

The selector gives checked eligible main slave first priority, then checked eligible assistant. Room candidates are considered only when neither upper role is both present and checked. Thus a checked but unavailable present upper actor blocks room fallback; an absent upper actor's stale rule flag does not. Room skill comparison remains relevant for the three original ranked jobs. Bath/wake room scores are equal, so their checked eligible rooms are sampled randomly. The selected worker is recalculated at the relevant point, not persisted across days.

The native syntax/return issues in the earlier `5dbd...` candidate were repaired: QSP inequality uses `!`, and the upper actor is stored in the returned winner before leaving the FOR. The corrected intermediate candidate passed four smoke cases: main bath priority, 64-repeat room bath variety, main wake priority, and assistant wake fallback. Earlier logs/fixtures remain separate and must not be counted as green.

Wake fallback runs source-derived actor templates rather than swapping the main actor. The main branch retains its original rule count/report flow. Non-main copies omit only the main global `overnight_rules_count` and `rules_broken_message` writes. Existing selected-actor acceptance, refusal/forced-rule handling, mood, rates, and growth calls are retained. No AP cost, energy threshold, or CG is added for wake.

Before a selected non-main actor's wake attempt, the template initializes its existing `num_rules_broken`, `num_rules_wanttobreak`, `blowjob_rule_broken`, and clears its `rules_explanations`. The first three duplicate existing per-actor daily resets in `$end_day_variable_reset`; main next_day already resets its generic counters/report before processing rules. A baseline source search found no other active helper-specific producer of these general rule counters, so this selected-only initialization does not currently erase a separate helper rule process. The report clear means the selected helper receives a fresh report for this wake attempt. These are existing actor properties, not new saved selector variables; document them explicitly.

The copied non-main wake aggregate can apply the original refusal penalties to that selected actor and shared master moodlets. The original `$sin_gained_now` function retains its existing main-only behavior when passed a non-main actor; the transform does not invent a replacement guilt mechanic. Non-selected actors keep their existing values and receive no wake growth.

Full native bath/wake coverage is staged by the two generators under `tests/`. Root requested holding the complete suites until the final candidate hash, so four smoke passes are not a claim that the complete final release gate has passed. No production file was modified by this reviewer.

## Final native result

Final candidate `f69637e965af4489a7328eee91864df3e0b3dc22c4ab948c4913b106a68fb753` passed bath 30/30 and wake 18/18 in the installed native engine. Every stderr log contains exactly its expected completion message and has zero assertion failures, unexpected messages, or engine errors. Both prepared input hashes match the final candidate; tracked candidate/save/config inputs are unchanged. The six source-derived bath/wake regions and original event/renderer preservation checks remain exact on this final hash. See `tests/bath-wake-final-summary.json` for all 48 case results.
