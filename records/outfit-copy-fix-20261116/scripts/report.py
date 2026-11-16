from pathlib import Path
import difflib
import hashlib
import json

task = Path('G:/Codex/tmp/outfit-copy-fix-20261116')
changes = json.loads((task / 'source-changes.json').read_text('utf-8'))
diffs = []
for item in changes:
    path = Path(item['file'])
    current = path.read_bytes()
    assert hashlib.sha256(current).hexdigest() == item['after'], path
    compile(current.decode('utf-8-sig'), str(path), 'exec')
    diffs.extend(difflib.unified_diff(Path(item['backup']).read_text('utf-8').splitlines(True),
                                    current.decode('utf-8').splitlines(True),
                                    fromfile=item['backup'], tofile=str(path)))
(task / 'source.diff').write_text(''.join(diffs), 'utf-8')
repair = json.loads((task / 'mira-repair.json').read_text('utf-8'))
source = Path('G:/somi/JO9sa/assets/json/slaves/2609_mira.json')
assert source.read_bytes() == Path(repair['file']).read_bytes()
repair['trackedSource'] = str(source)
(task / 'mira-repair.json').write_text(json.dumps(repair, ensure_ascii=False, indent=2), 'utf-8')
report = '''# Shared appearance outfit copy fix - 2026-11-16

Mira 2578 and 2609 share `girls/full/mira_brown_long`. Only 2578 had title,
maid, secretary, and domina links. Character reads and clone operations used
only the selected JSON, so 2609 kept only its base appearance.

The common backend now fills absent image slots from JSONs sharing the same
resolved base-image file. Explicit fields (including empty unlink values),
manual background, stats, and traits remain authoritative. Conflicting donor
choices and missing image files are skipped. Reads do not write files; an
explicit image save or clone persists the resolved slots for that operation.

Both regular and role clones use the same resolution. Master appearance
display now also recognizes indpack outfit fields after role copying.

WORK and tracked Mira 2609 JSONs received exactly five image fields:
`indpack_naked`, `indpack_title`, `fullmade`, `fullsecretary`, `fullmistress`.
All 174 pre-existing fields and the complete original JSON body bytes were
preserved. Mira 2578 and all five image file bytes are unchanged. No real QSP,
save, Full folder, release ZIP, commit, or push was changed.

Validation: 7 new regressions first failed against the old code and now pass.
The complete backend suite passed 30 tests; the hub suite passed 62 tests.
Python syntax compilation passed for all four changed operational source files.
The task fixture directory is empty after automatic cleanup.

Operational source: see `source-changes.json` and `source.diff`.
Live data changes and hashes: see `mira-repair.json`.
Original recovery bytes: `before/` (retain).
The active source under `claude-character-studio-e0edb064` is operational and
was preserved. A Python hub/server restart is required to reload these changes.
Browser image display remains a separate final check after that restart.
'''
(task / 'REPORT.md').write_text(report, 'utf-8')
assert not list((task / 'fixtures').iterdir())
print(json.dumps({'report': str(task / 'REPORT.md'), 'pythonSyntax': 'pass', 'fixtureFilesRemaining': 0,
                  'trackedMiraMatchesWork': True}))
