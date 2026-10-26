import difflib
import json
from pathlib import Path
import sys

source = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
edits = []
for field in source.pop('fields'):
    old, new = field['old'], field['new']
    a, b = old.splitlines(keepends=True), new.splitlines(keepends=True)
    matcher = difflib.SequenceMatcher(None, a, b, autojunk=False)
    chunks = None
    for context in (2, 4, 8, 16, 32, 64, 128):
        trial = []
        for group in matcher.get_grouped_opcodes(context):
            previous = ''.join(a[group[0][1]:group[-1][2]])
            following = ''.join(b[group[0][3]:group[-1][4]])
            if not previous or old.count(previous) != 1 or new.count(following) != 1:
                trial = None
                break
            trial.append({'location': field['location'], 'field': field['field'], 'old': previous, 'new': following, 'count': 1})
        if trial is not None:
            chunks = trial
            break
    edits.extend(chunks if chunks is not None else [field | {'count': 1}])
source['edits'] = edits
Path(sys.argv[2]).write_text(json.dumps(source, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'edits': len(edits), 'bytes': Path(sys.argv[2]).stat().st_size}))
