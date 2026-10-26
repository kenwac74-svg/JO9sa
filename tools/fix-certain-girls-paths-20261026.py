"""Apply only reviewed JSON image-path typos on the verified home-PC baseline."""
import argparse
import hashlib
import json
import os
import re
import shutil
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXPECTED_QSP = 'eafdc1a2ffcc3f5806735617c2eec88c79449c9aca0ce1dabee6e78d835a2574'


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def replace_field(raw, field, old, new):
    literal = lambda s: json.dumps(s, ensure_ascii=True).encode('ascii')
    pattern = rb'("' + re.escape(field.encode('ascii')) + rb'"\s*:\s*)' + re.escape(literal(old))
    updated, count = re.subn(pattern, lambda m: m[1] + literal(new), raw)
    if count != 1:
        raise ValueError(f'{field}: expected exactly one matching field, found {count}')
    return updated


def exact_asset(game, relative):
    parts = relative.replace('\\', '/').split('/')
    if parts[:3] != ['content', 'pic', 'girls'] or '..' in parts:
        raise ValueError('Image target outside girls')
    cursor = game
    for part in parts:
        if part not in os.listdir(cursor):
            return False
        cursor = cursor / part
    return cursor.is_file()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--game', type=Path, required=True)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    game = args.game.resolve()
    plan = json.loads((ROOT / 'tmp/girls-fix-20261026/certain-candidates.json').read_text(encoding='utf-8'))
    alignment = json.loads((ROOT / 'tmp/girls-fix-20261026/home-runtime-alignment.json').read_text(encoding='utf-8'))
    if not alignment['qsp']['matches'] or not all(r['matches'] for r in alignment['runtime']):
        raise ValueError('Home-PC baseline alignment was not confirmed')
    if digest((game / 'jack.qsp').read_bytes()) != EXPECTED_QSP:
        raise ValueError('Current QSP changed after home-PC baseline verification')
    grouped = defaultdict(list)
    for change in plan['candidates']:
        grouped[change['json']].append(change)
    if len(grouped) != 12 or sum(map(len, grouped.values())) != 15:
        raise ValueError('Unexpected correction scope')
    prepared = []
    for name, changes in grouped.items():
        if Path(name).name != name:
            raise ValueError('Invalid JSON filename')
        path = game / 'json/slaves' / name
        before = path.read_bytes()
        baseline = plan['json_baselines'][name]
        if digest(before) != baseline['sha256']:
            raise ValueError(f'{name}: changed since review; no files applied')
        original = json.loads(before.decode(baseline['encoding']))
        expected = original.copy()
        after = before
        for c in changes:
            if original[c['field']] != c['old'] or not exact_asset(game, c['new_png']):
                raise ValueError(f'{name}/{c["field"]}: invalid old value or missing exact target')
            expected[c['field']] = c['new']
            after = replace_field(after, c['field'], c['old'], c['new'])
        if json.loads(after.decode(baseline['encoding'])) != expected:
            raise ValueError(f'{name}: unrelated JSON values changed')
        restored = after
        for c in reversed(changes):
            restored = replace_field(restored, c['field'], c['new'], c['old'])
        if restored != before:
            raise ValueError(f'{name}: unrelated bytes/encoding/formatting changed')
        prepared.append((name, path, before, after, changes))
    record = {'schema': 1, 'baselineCommit': alignment['commit'], 'baselineQspSha256': EXPECTED_QSP,
              'game': str(game), 'jsonCount': len(prepared), 'fieldCount': 15,
              'qspChanged': False, 'imagesChanged': False, 'savesChanged': False,
              'applied': False, 'files': []}
    for name, _, before, after, changes in prepared:
        record['files'].append({'path': 'json/slaves/' + name, 'beforeSha256': digest(before),
                                'afterSha256': digest(after), 'changes': [
                                    {k: c[k] for k in ('field', 'old', 'new', 'new_png')} for c in changes]})
    output = ROOT / 'records/girls-image-path-fix-20261026'
    output.mkdir(parents=True, exist_ok=True)
    (output / 'prepared.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    if not args.apply:
        print('PREPARED: 12 JSON / 15 fields; exact targets and byte-preserving changes verified')
        return
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = ROOT / 'backups' / ('girls-image-paths-' + stamp)
    backup.mkdir(parents=True, exist_ok=False)
    for name, path, before, _, _ in prepared:
        if path.read_bytes() != before:
            raise ValueError(f'{name}: concurrent modification; no files applied')
        shutil.copy2(path, backup / name)
    applied = []
    try:
        for name, path, before, after, _ in prepared:
            if path.read_bytes() != before:
                raise ValueError(f'{name}: concurrent modification')
            temp = path.with_name(path.name + '.jo9-path-fix.tmp')
            with temp.open('xb') as stream:
                stream.write(after)
            os.replace(temp, path)
            applied.append((path, before, after))
        for path, _, after in applied:
            if path.read_bytes() != after:
                raise ValueError(f'{path.name}: post-write verification failed')
    except Exception:
        for path, before, after in reversed(applied):
            if path.read_bytes() == after:
                path.write_bytes(before)
        raise
    source = ROOT / 'assets/json/slaves'
    source.mkdir(parents=True, exist_ok=True)
    for name, _, _, after, _ in prepared:
        (source / name).write_bytes(after)
    record.update(applied=True, backup=str(backup), appliedAtUtc=datetime.now(timezone.utc).isoformat())
    (output / 'patch.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'APPLIED: 12 JSON / 15 fields; backup: {backup}')


if __name__ == '__main__':
    main()
