# MOB information tab implementation plan

**Goal:** Add the requested MOB information tab including Chunhyang without replacing enemy traits.
**Architecture:** Reuse current enemy data for 70 QSP-defined entries and append one clearly labelled unimplemented plan. Lazy setup, manual search and filters, sortable resource comparison, selected detail and existing idea drafts preserved.
**Tech stack:** Existing Node generator and standalone browser DOM; no dependencies.
**Spec:** User request 2026-11-11: add MOB information including Chunhyang as a tab. Display confirmed planning values from DESIGN_DRAFT_KO.md and CHUNHYANG_DEFENSE_DRAFT_KO.md. Routine presentation choices are implementation decisions; no new game rules.

- [x] Back up current template/generator/HTML/README/snapshot and record protected hashes.
- [x] Add mobs-data.cjs and mobs-ui.js, actual template tab/panel and lazy hookup; retain all existing DB sections and enemy table.
- [x] Rebuild enemies-only, compare previous data deeply, confirm 70 defined + 1 plan and installed/source equality.
- [x] Verify manual search, resource sorting, selected detail, planning boundaries and tab/draft retention in browser; run existing relevant regression suite.
- [x] Record usage/limits and clean task scratch; no QSP/audio/Full/commit/push changes.
