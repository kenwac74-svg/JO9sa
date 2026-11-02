# Meiki Production Grade Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. User approved the preceding A proposal; continue implementation without another approval round.

**Goal:** Require B education for a meiki character to produce from Kraken, retaining the existing yield bonus.

**Architecture:** Apply the approved one-step reduction relative to ordinary education requirements in the existing 15 predicates. Preserve all other code, including the unconditional saved lesson cache refresh.

**Tech Stack:** Existing QSP binary parser, declarative mods JSON, PowerShell patch applier, installed Qt QSP engine in an isolated diagnostic directory.

**Spec:** User approval 2026-11-02, following A proposal in `records/fog-meiki-review-20261102/REPORT_KO.md`.

## Global Constraints

- Ordinary minimum education D/C/B/A/S remains unchanged; meiki minimum becomes F/D/C/B/A for the five monster stages.
- Preserve existing yield bonus +20/+30/+40/+50/+60 percent, refusal/readiness/fatigue/damage and assistant automatic minimum D.
- Modify only current WORK jack.qsp after byte-exact backup and roundtrip checks. No translation, prisoner-discovery, save, image, CSS, packaging or Git operation.

## Review Focus

- All 15 gates must agree: interaction3, next_day6, end_day_screen6.
- Kraken meiki C fails/B succeeds; ordinary B fails/A succeeds.
- Lowest monster meiki F succeeds; Leviathan meiki B fails/A succeeds.
- Existing saved lesson cache must be replaced with the new definition.
- Yield amounts and integer rounding must remain the same, and unedited QSP bodies must be byte-identical.

### Task 1: Implement and apply the approved gate

**Files:** Create `tools/meiki-production-20261102/{probe,build}.cjs`; create `mods/2026-11-02_meiki_production_grade.json`; create scoped backup and records; change only WORK `game/jack.qsp`.

- [x] Write native diagnostic using actual extracted predicates, 5 stages × 6 education levels × 2 trait states × 15 gates = 900 assertions. Test the real yield expressions and saved lesson cache refresh separately.
- [x] Run against the original binary and record the expected failure at low-education meiki production.
- [x] Replace each predicate with ordinary requirement OR (meiki AND education >= monster stage); emit exact mods and candidate.
- [x] Run candidate diagnostic; all assertions must pass. Verify only 15 predicate replacements in 3 existing locations, no location additions and exact roundtrip.
- [x] Replay declarative patch on a disposable QSP and reapply to prove idempotence. Independently review the candidate.
- [x] Back up actual WORK, verify unchanged since snapshot, install candidate, and verify installed bytes. Keep native testing distinguished from manual gameplay testing.
- [x] Record result and handoff status; no commit/push requested for this patch.
