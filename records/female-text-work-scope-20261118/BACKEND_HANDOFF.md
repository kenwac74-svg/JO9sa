# FEMALE_TEXT_WORK_SCOPE_20261118 backend

Candidate only: no repository, WORK, Full, QSP, SAV, image, archive, commit or push mutation was performed by this agent. Install only the 15 files listed in `backend-manifest.json`; that manifest includes original source SHA-256 values. Unlisted files in `backend/` are unchanged local test dependencies.

## Behavior

- `includeFemale` is strictly `true` in POST requests, or `1` in GET query parameters; default is exclusion.
- Entry `workScope.category` is `female`, `review` or `general`, with evidence identifiers in `reasons`. Review remains visible for manual search/context inspection. Default batch search/replacement and script/range export omit female and review entries.
- Search and batch responses include `scope.includeFemale`, `scope.excludedFemale` and `scope.excludedReview` counts over their query candidates.
- Direct edit, page/paragraph addition, choice addition/format, dialogue image binding/reference, script import (including old/revalidated maps), and dialogue AI requests protect excluded selections. AI rejects before provider/key use. Related page/index/guard modifications are rejected when excluded text would be affected.
- Preview captures the explicit scope. Apply requires the current scope to match it, plus all previous hash/approval checks. Selecting the woman script edition requires explicit female inclusion.
- Classification is recomputed from current parsed data and cached by document hash plus the actual line contents. No archive offsets are used at runtime. Current master IDs are derived from `#masters_base`; the documented current 1..18 / 101..124 model is the fallback for minimal fixtures without that definition.
- Ownership covers the 13 audited modules, audited aliases/master arrays, effective hero-choice conditions, and the four positive female player-state clauses. Incomplete scene-ownership candidates are review entries. Female NPC/slave content and asset-management APIs are not broadly excluded.

## Evidence

- Fresh read-only agreement with the final audit archive at WORK QSP SHA-256 `acd6bc3c868cb8f39e89a261d3733f351c7f4fe21da87f873ab9ba914686885b`: 448641 editor entries; 18994 female, 735 review, 428912 general. All 19729 archived scoped entries agree; confirmed missing=0 and extra=0.
- First measured entry scan/classification: 4869.5 ms; cached entry lookup: 0.109 ms; QSP parse: 146.7 ms. This measurement preceded the final small structural-prefix protection addition.
- Existing related core/navigation/flow/page/script/batch/image suite: 69/69 passed before the final additional structural-protection assertion. The latest focused work-scope/addition/batch run: 21/21 passed, including old/revalidated imports and unchanged-prose page/guard protection.
- Latest isolated HTTP/API regression: 12/12 passed, including original single edit/apply/backups/export/restore, batch pagination past 200 entries, default exclusion, explicit inclusion, stale scope rejection, and AI review rejection before a provider call. Temporary fixture trees were removed by test cleanup.
- One final wider repeat was started after the additional structural assertion; returned output was truncated before its summary, so no final total from that repeat is claimed.

Production files: `addition-pages.cjs`, `batch-replace.cjs`, `choice-addition.cjs`, `choice-format.cjs`, `core.cjs`, `dialogue-image.cjs`, `image-reference.cjs`, `scenes.cjs`, `script-import.cjs`, `server.cjs`, `work-scope.cjs`, `work-scope-guards.cjs`.

Tests: `work-scope.test.cjs`, `work-scope-api.test.cjs`, and the updated explicit woman-edition opt-in in `script-export.test.cjs`.

The ownership inventory remains partial by the user's decision to retain game content. This implementation enforces the audited boundary and marks the unfinished standalone scene candidates for review; it does not claim full game reachability analysis.
