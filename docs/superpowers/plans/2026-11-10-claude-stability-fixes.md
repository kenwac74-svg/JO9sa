# Claude review stability fixes

User approval: fix the six verified findings according to the review recommendations. WORK/source only. No Full, release ZIP, commit or push.

Baseline:607c7ec; WORK/source QSP8332e1857fa594283eddda448177e3e63dbf554a2f3b241350aa7a9c3291c94f.

- [x] QSP sound: fix numeric/string variable names; muted/normal/empty/jackpot/wound cases must reach completion.
- [x] QSP duties: clear legacy household flags on external assignment, exclude external room workers from housekeeping (including existing saves). Preserve rewards, diet and difficulty design. Test energy3 without double assignment.
- [x] QSP hard construction: apply1.5x to existing bankruptcy construction refund/quote paths; preserve20% promise and existing interior refund.
- [x] Character tool: unlink shared files without deleting other users' PNG; whole delete checks all image refs. Include name/story/slug in unsaved-change detection. Synthetic save/delete only.
- [x] Image registration: additive unique event IDs, harmless repeat, preserve old status/IDs/objects; fake catalog tests for second registration.
- [x] Documentation/resource inventory: reflect actual workaholic table (no balancing), remove stale pending entries, identify36 additional PNG and recoverable object hashes for next cumulative patch/new PC.
- [x] Final review, regression/native probes, original hash preservation, install WORK/tool and tracked source after revalidation; record backup/diff/replay and manual game limits; cleanup disposable test copies.

Implementation ownership: agents edit disjoint files in this worktree. Parent owns docs/runtime manifest/install/release checks. Do not change live WORK or main checkout until parent integration. Do not commit.
