# Selected dialogue choice addition implementation plan

**Goal:** Add a choice to a selected dialogue through the existing preview, approval and backup transaction.

**Files:** stage/choice-addition.cjs generates a separate marked append statement; stage/choice-editor.js owns the form and per-dialogue drafts; staged index/server expose and route it; page-flow/flow include the new branches in the current page; unified-workshop includes choice drafts in its dirty guard.

- [x] Write neutral fixtures and verify missing-feature failures.
- [x] Generate one marked choice append per request, preserving original literal and enclosing conditions. Refuse ambiguous assignments and malformed expression boundaries.
- [x] Add the form below dialogue addition, keep per-selection drafts, invalidate old approvals on edits, and use the existing apply transaction.
- [x] Verify array/scalar navigation, repeated additions, conditions, quoting, preview-only behavior, approval, backup/export/restore and conflict rejection.
- [x] Check JS syntax, document support and verification limits, and deliver staged files without installing or restarting anything.

**Constraints:** No production source, WORK QSP, server state, Full, commit or push mutations. One-line QSP action and one condition expression are directly user supplied; no command catalog or AI selection. The original dialogue must be a standalone literal assignment to a scalar or a static-index string array. Unsupported output expressions are rejected with an explanation. Static checks do not prove arbitrary QSP expressions execute successfully.
