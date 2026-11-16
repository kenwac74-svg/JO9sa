# Hard enemy specials — plan: docs/superpowers/plans/2026-11-11-hard-enemy-specials.md

Snapshot: current WORK, tracked runtime and metadata hash agree; byte roundtrip verified.
Ruling: tests use isolated QSP files in the user-designated G:/Codex/tmp task directory; existing WORK main checkout is the explicit target. No git operations.
RED: original native AI hard Egeya 100 turns never selected a special (expected assertion failed).
Implementation: 4 edits across 3 existing locations and one appended helper.
Ruling: complete current special fields require nonempty attack type, damage type, text and short text plus positive defined base damage. Empty effect scripts remain valid. All existing 30 meet this; incomplete fields are excluded without retry.
GREEN candidate+installed: 6 installed FastQSP probes each, 923 executed assertions per phase; all30 specials/24 species. Exact official replay and idempotence; source metadata aligned.
Save persistence: installed FastQSP saved array [0,1,0,0,1,0,1]; supplemental QSP5.7 API restored/resaved/reopened exactly. Installed FastQSP OPENGAME unsupported; GUI load untested. Old DLL helper local keyword unsupported; selection only claimed from installed FastQSP.
