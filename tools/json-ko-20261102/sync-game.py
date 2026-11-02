"""Copy only reviewed handoff files; default is read-only preflight."""
import argparse
import hashlib
import json
import os
from pathlib import Path


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare(repo, game, manifest):
    repo, game = repo.resolve(), game.resolve()
    if not (game / 'jack.qsp').is_file():
        raise ValueError('Specify the game directory containing jack.qsp')
    result = []
    for entry in manifest['files']:
        rel = Path(entry['game_path'])
        parts = rel.parts
        if rel.is_absolute() or '..' in parts or not (
            rel.as_posix() == 'jack.qsp' or
            len(parts) == 3 and parts[:2] == ('json', 'slaves') and rel.suffix == '.json'
        ):
            raise ValueError('Unexpected target: ' + str(rel))
        source = (repo / entry['source']).resolve()
        target = (game / rel).resolve()
        if not source.is_relative_to(repo / 'assets') or not target.is_relative_to(game):
            raise ValueError('Source or target escapes its approved directory')
        if not source.is_file() or digest(source) != entry['after_sha256']:
            raise ValueError('Source missing or changed: ' + entry['source'])
        if not target.is_file():
            raise ValueError('Target missing: ' + str(rel))
        actual = digest(target)
        allowed = set(entry['before_sha256']) | {entry['after_sha256']}
        if actual not in allowed:
            raise ValueError('Preserved manual change or different base; review required: ' + str(rel))
        temporary = target.with_name(target.name + '.jo9-ko-handoff.tmp')
        if temporary.exists():
            raise ValueError('Temporary file already exists: ' + str(temporary))
        result.append({'source': source, 'target': target, 'temporary': temporary,
                       'before': actual, 'after': entry['after_sha256'],
                       'ready': actual == entry['after_sha256']})
    return result


def apply(rows):
    # Recheck the entire plan before the first write.
    for row in rows:
        if digest(row['target']) != row['before'] or digest(row['source']) != row['after']:
            raise ValueError('A file changed after preflight')
    for row in rows:
        if row['ready']:
            continue
        if digest(row['target']) != row['before']:
            raise ValueError('Target changed concurrently')
        payload = row['source'].read_bytes()
        if hashlib.sha256(payload).hexdigest() != row['after']:
            raise ValueError('Source changed concurrently')
        with row['temporary'].open('xb') as output:
            output.write(payload)
        os.replace(row['temporary'], row['target'])
        if digest(row['target']) != row['after']:
            raise ValueError('Write verification failed')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--game', type=Path, required=True)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    manifest = json.loads((repo / 'records/translations/json-ko-20261102/handoff-manifest.json').read_text(encoding='utf-8'))
    rows = prepare(repo, args.game, manifest)
    if args.apply:
        apply(rows)
    print(json.dumps({'mode': 'applied' if args.apply else 'read-only preflight',
                      'files': len(rows), 'already_current': sum(r['ready'] for r in rows),
                      'updates': sum(not r['ready'] for r in rows)}, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        raise SystemExit(str(error))
