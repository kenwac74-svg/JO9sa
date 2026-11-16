# Occupation initialization implementation plan

Goal: Apply 73 confirmed rules from 31 specs to new random backgrounds only.
Architecture: one late initialization location, called in place of the former heroine innate roll; exact rational extra chances on non-target eligible characters. Reuse background random flag and identity strings. No new persistent fields.
Spec: occupation-specs.source.json, branch 66178cf5.

- [x] Freeze actual source conditional probabilities and exclusions, not sample estimates.
- [x] RED: require a module covering all confirmed rules, exact fraction calculations, exclusions and structural replay.
- [x] Build minimal literal edits plus jo9_occupation_init location.
- [x] GREEN: deterministic roll boundaries, fixed/clone exclusion, floors, forbidden traits, rejection groups and heroine 20/4 staged rules in native engine.
- [x] Document raw activity target and post-normalization canonical outcomes separately; main owns discovery/growth and final integration.

Constraints: write only this records directory and isolated regenerable G:/Codex/tmp diagnostic; no WORK/runtime updates, no personal saves, no new prose/experience histories.

Independent cross-review: background agent confirmed one late hook, fixed/clone guards, no overlapping edit anchor and preserved selected occupation. No actionable finding.
