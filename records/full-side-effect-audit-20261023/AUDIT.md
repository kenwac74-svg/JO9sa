# Disposition initializer side-effect audit

Audited input: `G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp`, SHA256 `5aeff11fffe6e5f2523749987577f42dab870f4d0adee0df385375f9eefb074f`. All line numbers below are one-based decoded location-body lines in this pinned snapshot. This audit did not write WORK, Full, saves, repository production files, or commits.

## Confirmed defect

The acquisition helper compensates mood before the normal state refresh builds situational negative moodlets. The terminal state refresh can therefore change a newly initialized actor back to a noncompliant psychology despite the new trait being marked initialized.

- `jo9_traits:359-367`: set temporary psychology to reluctant and raise mood rate until the existing mood calculation reaches 1.
- `jo9_traits:387-388`: only afterward execute the full native refresh twice.
- `#static_base:1022-1029`: that refresh adds `neg_ugly` and `neg_slave_mess`.
- `#static_base:1031-1033`: it adds `neg_slave_dirty`.
- `#static_base:1046-1049`: it adds `neg_naked`.
- `#static_base:1061-1119`: it recalculates mood and psychology after those additions.

Parent ran the eight exact native probes prepared by `prepare-mood-gap.cjs`: clean environment passed for both stock and expert routes; messy home, low appearance with scarring, and dirty hygiene failed for both routes. All six failures had final mood -1, obedience 11, psychology hateful immediately after acquisition and after both later native refreshes. The old acquisition tests masked this because their fixtures preloaded `neg_fear=1` and `neg_angst=1`; the refresh clears these two and offsets new situational penalties. Actual `generate_stock` does not initialize either negative moodlet.

The probe modifies only Start. The actual `jo9_traits`, `stock_to_slave_nogt`, `expert_to_slave`, and `#static_base` location bodies are hash-verified unchanged. It performs no narrative event or player action. Parent owns engine execution and preservation of result logs.

Suggested narrow repair: move one of the two existing full refreshes before the mood-compensation loop, after the minimum-sanity repair and initial training assignments, then reset psychology to reluctant again before the loop. Retain one final full refresh after the price/training loops. The second reluctant reset handles a fixed `psy_basic=broken` baseline that the early refresh can restore. This keeps exactly two full refreshes, with no new persistent key, location, daily correction, or permanent clamp. Candidate verification must rerun the broken-basic, zero-sanity, worst-case, reinitialization, no-flag, eligibility and eight mood-gap probes.

## Verified paths and limits

- New random traits are assigned only at `generate_stock:1652`, under `special_stock=0`. `jo9_traits:79-86` clears residual flags, uses one disposition roll, assigns 1-2 to defiant and 3-12 to eligible slave nature, and makes the traits exclusive.
- Fixed seed loading clears the new flags in `get_stock_seed:98-102`; direct stock-to-slave swaps at `interaction_city:5054` and `11321-11769` all follow explicit fixed special_stock assignments. These are not missing random-acquisition hooks. `get_special_assistant` also uses a fixed special_stock.
- Standard stock acquisition reaches `stock_to_slave_nogt:80-81`, directly or via `stock_to_slave:6`. Expert acquisition reaches `expert_to_slave:7-8`. The two actual array-transfer hooks invoke initialization after transfer.
- Expert search rechecks final ego/pride after search boosts at `$expert_search:47-48`; clone construction clears the new flag after assigning pride 4 at `generate_clone:17-19`.
- The initializer exits without stat writes when the trait is absent or its initialized flag is already set (`jo9_traits:337-338`). Reacquisition, ordinary role changes and normal refreshes do not reroll or repeat initialization.
- `#static_base:410-417,425-443,449-477` puts the complete actor and rate arrays in the swap class. The array keys containing both new flags travel with role, room, barn, prison and frozen transfers. Native copyarr-based temporary actor backup/copy paths likewise copy the full actor array. No new save-format or save/load edits were introduced by this patch.
- Native dependencies use shared scratch globals, including i/n/a, price/rating fields and equipment bonuses. The extra initialization calls therefore update these scratches. The inspected acquisition continuations do not depend on an unrefreshed price after acquisition: auction charges use a cached bid before transfer, other purchases use constants or perform their own price refresh. No additional charge or reward change was demonstrated.
- The helper changes the approved initial training/motivation values and, only when their sum is below 3, ego to prevent native mind break. It has no direct stamina or professional-skill assignment. Its native refresh calls still apply the existing normal attribute normalization, linked-stat updates, appearance/rating calculations and trait refreshes. The ordering repair retains the same number of those calls.

These are static source-path findings plus the eight targeted native cases reported by the parent. They do not constitute an exhaustive run of every narrative route, a GUI save restoration test, or proof for arbitrary edited/corrupt actor arrays.

## Artifacts

- `prepare-mood-gap.cjs`: reproducible native fixture preparation. Arguments: output directory, optional candidate QSP path, optional required SHA256.
- Parent test plan: `G:/Codex/tmp/jo9-full-audit-20261023/traits/mood-gap-plan.json`.
- Temporary decoded-source extracts and indexes used for this audit are regenerable and should be removed after candidate review; keep this report and reproduction script.
