# Mercy 매력표 적용 Implementation Plan

> For agentic workers: execute inline with one bounded final review. No commit/push or Full copy.

Goal: 현재 CM 자비값에 따라 매력을0~5로 직접 산정하고 상승·하락을 즉시 반영한다.
Architecture: pure jo9_mercy_allure returns grade, helper help mode returns current help text. Existing calculate_attributes, CM apply and load refresh use the same helper. No new saved XP or highest-rank lock.
Tech Stack: QSP codec, declarative mods, native FastQSP synthetic state fixture, apply_mods replay.
Spec: user-approved current-Mercy thresholds 5/15/25/40/60; below5 rank0; decrease lowers rank. Existing signed half-point CM preserved.

Global Constraints: WORK/tracked source only; no personal SAV/Full/audio/ZIP/commit/push. No new saved values. Original CM gains and negative-CM dominance formula retained.
Review Focus: every threshold at ±0.5; CM half signed/noncanonical input; live decrease without waiting for refresh; old saves missing half remainder; stale loaded grade/help; unrelated clothing/mood bonuses must not override final rank.

## Task1
- [x] Native RED on actual old calculation segment: old best conditions at CM−100 produced a nonzero rank.
- [x] Add helper; replace old situational allure calculation; refresh immediately after CM adjustment and before load redraw; update help.
- [x] Native59 cases GREEN; exact patch replay/idempotence; structural roundtrip and changed scope.
- [x] Independent scoped review; fix any findings with focused RED/GREEN.
- [x] Install WORK/source, metadata and release journal; preserve recovery/reproducer and remove own temporary copies.

Ruling: “그 표대로” means final master_style is exactly the CM table, not a hidden bonus added to old clothes/hygiene formula. Otherwise 60→59.5 would often stay capped5, violating the explicit decline requirement. Clothing/hygiene/beauty service functions remain; only their direct contribution to master_style is removed.
Ruling: helper compares two-point integer representation 2*whole+half to10/30/50/80/120; this honors exact half-point boundaries without a new save field.
Ruling: authoritative WORK and tracked snapshot are uncommitted on main; edits are prepared/tested in isolated temporary QSP with exact guards, then only requested files synchronized. No branch merge or commit.

Completion: Mercy step5097bca0, final combined WORKe58aa4d77b1be754837bc9f619ed8953536218c58c73ca69df6da643f40c7a6a. Native Mercy59 + subsequent Yagisuna5, exact replay/idempotence, roundtrip, no Important review findings. Own synthetic temporary copies removed after final record.
