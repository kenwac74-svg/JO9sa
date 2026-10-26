"""Produce unique non-overlapping final hunks, never transient edit states."""
import difflib
import json
import sys

items = json.load(sys.stdin)
result = []
for item in items:
    old, new = item['old'], item['new']
    a, b = old.splitlines(keepends=True), new.splitlines(keepends=True)
    context = 4
    while True:
        groups = list(difflib.SequenceMatcher(None, a, b, autojunk=False).get_grouped_opcodes(context))
        hunks = []
        for group in groups:
            before = ''.join(a[group[0][1]:group[-1][2]])
            after = ''.join(b[group[0][3]:group[-1][4]])
            hunks.append({'location': item['name'], 'field': 'body', 'old': before, 'new': after, 'count': 1})
        if all(h['old'] and h['new'] and old.count(h['old']) == 1 and new.count(h['new']) == 1 for h in hunks):
            result.extend(hunks)
            break
        context *= 2
        if context > max(len(a), len(b)):
            result.append({'location': item['name'], 'field': 'body', 'old': old, 'new': new, 'count': 1})
            break
json.dump(result, sys.stdout, ensure_ascii=True)
