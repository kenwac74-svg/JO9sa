# JSON history Korean translation and cross-PC handoff

> For agentic workers: use the approved continuous execution workflow; preserve the existing externally managed worktree and unrelated changes.

**Goal:** Translate the audited JSON display text, keep dynamic dialogue selection stable, support old stored histories, apply to the designated game, and commit/push a shareable handoff.

**Architecture:** Edit display-value literals only in JSON. Add a narrowly scoped display-time old-text-to-Korean adapter for cached biography/relationship strings; never rewrite personal saves. Keep original voice matching on its original input. Produce the commit using a selective index based on latest main, preserving this old detached checkout and its unrelated edits.

**Baseline:** origin/main 49458e65c6f3ee9d3d072e976fc4fe5a43b1013a; current game QSP 6cc7066736cae7fc428d58f89fbf659f06ee6feae8c710d810ee67c99467d505. Active game C:/MOVE/Jack O Nine Tails v2.4.1_Kor_Full/game.

## Constraints

- User approved translation, dynamic-dialogue compatibility, then commit/push and cross-PC sharing. No further permission gate.
- Translate 338 biography/relationship fields (247 distinct trimmed texts), 73 display names, and 51 pack descriptions. Preserve all IDs, indices, enum values, paths, pack UIDs and metadata authors.
- Preserve every W variant's meaning. Do not bulk-copy the base into W.
- Reuse existing Korean proper-name spellings where identifiable. Preserve source lore and stance; no invented events or mechanics.
- Hidden <!-- #nwtx --> on newly translated HTML biography/relation prose; no HTML marker in plain display names or pack metadata.
- Keep original QSP bytes/locations outside declared edits. Round-trip QSP before changes, back up first, and replay the patch exactly.
- Do not modify images or private saves; no distribution mirror or ZIP requested.
- Include the preceding applied 11-file/29-field image-path fix in the final handoff.

## Tasks

- [x] Back up affected JSON and QSP; preserve exact before hashes.
- [x] Translate/review two independent, character-grouped text batches plus names and metadata.
- [x] Validate JSON parsing, completeness, untouched fields, hidden markers and W distinctions; compare voice-match outcomes before/after.
- [x] Implement and test a display adapter for exact legacy strings; preserve unmatched/player-edited strings and existing numeric branch behavior.
- [x] Verify QSP structure, CRLF, patch replay/idempotence and relevant engine probes in an isolated diagnostic copy.
- [x] Apply only verified JSON/QSP, verify the live target and record the local backup.
- [ ] Create latest-main-based selective commit on codex/json-history-ko-20261102; push and verify the remote hash.
- [ ] Write handoff with exact file manifest, safe preflight/application guidance and untested native gameplay limits.

## Review focus

- Duplicate English source across characters must get a consistent translation so legacy exact lookup is deterministic.
- Existing cached voice functions need a safe refresh before they can use the adapter.
- Korean prose must remain outside unrelated canonical voice-match groups.
- Existing saves must remain untouched on disk; only known original history strings are translated at display time.
- Selective commit must inherit latest main without including this checkout's unrelated tracked/untracked changes.

## Rulings

- The active folder named Kor_Full is the user-designated WORK; no other distribution folder is synchronized.
- The 21 legacy debug-preview paths and duplicate pack UIDs remain unchanged because normal-play breakage was not established.
- Existing-save compatibility will use display-time exact mapping, avoiding broad mutation of saved actor state.
