# Independent staged core review

Verdict: no code blocker found for core-candidate.qsp, SHA-256 8cbfec07ad3a3e3eab5c1f4d492ecb40f504d5545b6e71d436c1440359c956a5. Reviewed read-only against before.qsp (c73188bc2ead3a01ed317d2e7a6928d7fcef2496c8d2332ac3621ec986d4e5fb), the seven-edit declarative mod, candidate helper, and native harness/evidence. No production files were written.

## Verified preservation

Only existing next_day and display_pic bodies changed; original descriptions, action records, other encoded records, shared UI bodies, and end_day_screen are unchanged. One location, jo9_household_worker, was appended. Applying the staged JSON edits and append operation independently reconstructs the candidate byte for byte. parse/serialize roundtrips pass, and inspectWorld reports 261 locations with zero line-ending issues.

For all three next_day sections, all 18 candidate guards exactly match the original guards plus the selected-role condition and approved checked-only changes. After stripping the dispatch additions and reverting those exact guard changes, every remaining nonblank payload line equals the original. This covers original AP, skill rates, trait calls, hygiene, mess, and other effects. The existing narrative payload is unchanged.

## Selection and fallback

jo9_household_worker:10-22 checks job-needed conditions. Lines 23-42 enumerate only six actor roles and require own rule=1, existing state, and energy>=0. Original slave cook/clean obedience thresholds remain; assistant collection still requires sub_tentacles>0, while rooms retain their existing skill eligibility. Lines 43-49 choose the maximum raw related skill with reservoir sampling among ties. No highest-skill candidate can be displaced by a lower score.

next_day:443,750,990 selects separately at each job point. New helper scratch variables, role list, and per-job winner variables use LOCAL; no persisted selector, day cache, or migration key is added. Function result is the returned role string.

For collection, the selected slave alone enters its unchanged availability preflight/action body. If it refuses, next_day:795 calls the selector again with slave excluded. The helper does not repeat the dynamic availability calculation, so existing refusal side effects occur once. Alternative checked available actors can proceed despite the slave's enabled rule. Exactly one successful role's branch can run.

The job flag initializations remove stale success flags before selection, including old -1 refusal flags, and the original chosen actor's scene flag is retained. The existing scene code still performs its delayed shared collection counters. No scene dispatcher replacement is introduced.

## CG and UI

The display_pic fullimage branches are untouched. Only room1..4 main_actor_type assignments change from assistant_type to each corresponding room_type (candidate display_pic:152,165,178,191). The existing event-to-role calls and shared portrait UI are preserved. This addresses the actual second-stage room identity mismatch without changing a shared portrait layout.

## Master cleanup fallback assessment

The original master fallback at candidate next_day:1113 still runs if master_energy>=0 and house_mess>3 after the selected worker's effort. This is compatible with the stated scope of preventing AP waste among the other six designated actors: the master is not one of those checkable roles, and removing emergency cleanup would change an unrelated existing fallback. Explain this preserved behavior in the manual. If the intended guarantee later becomes one actor including the master, that would require an explicit further behavior change.

## Runtime evidence and limits

Read the installed native client's recorded results directly: rank-cook, rank-clean, rank-tentacle, single-clean, and real-renderer are 5/5 PASS, with completion markers and no engine errors. The real-renderer case checks all four distinct room IDs against a competing assistant image pool for all three actions. These results are smoke coverage; the broader already-prepared exclusion/refusal/tie/no-worker/zero-energy cases still need their final native run before installation. Visual image content, actual save loading, and distribution migration are outside this static core review. No additional design or UI changes are requested by this review.

Evidence: core-review-evidence.json records exact payload and original-record preservation checks.
