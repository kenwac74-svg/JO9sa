"""Read-only verification of this handoff's selected files; never applies a patch."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'records/home-handoff-20261027/game-delta.json'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def contained(root, relative):
    path = root / relative
    if not path.resolve().is_relative_to(root.resolve()):
        raise ValueError('Path escapes target root: ' + relative)
    return path


def exact_case(root, relative):
    path = root
    for part in Path(relative).parts:
        if not path.is_dir() or part not in {p.name for p in path.iterdir()}:
            return False
        path /= part
    return path.is_file()


def check(root, manifest, game=None, state='preflight'):
    errors = []
    for row in manifest['writes']:
        path = contained(root, row['source'])
        if not exact_case(root, row['source']) or digest(path) != row['afterSha256']:
            errors.append('Source missing/case/hash mismatch: ' + row['source'])
    if game is None:
        return errors
    qsp = contained(game, 'jack.qsp')
    if not qsp.is_file() or digest(qsp) != manifest['qspSha256']:
        errors.append('QSP differs from the audited baseline; inspect current WORK before applying')
    for row in manifest['writes']:
        path = contained(game, row['path'])
        if path.exists() and not path.is_file():
            errors.append('Target is not a regular file: ' + row['path'])
            continue
        current = digest(path) if path.is_file() else None
        allowed = {row['afterSha256']} if state == 'applied' else {row['beforeSha256'], row['afterSha256']}
        if current not in allowed:
            errors.append('Target missing/modified: ' + row['path'])
        elif state == 'applied' and not exact_case(game, row['path']):
            errors.append('Target path case differs: ' + row['path'])
    for row in manifest['deletes']:
        path = contained(game, row['path'])
        if path.exists() and (state == 'applied' or not path.is_file() or digest(path) != row['beforeSha256']):
            errors.append('Retired path exists/modified: ' + row['path'])
    return errors


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--game', type=Path, help='Actual home WORK game directory containing jack.qsp')
    ap.add_argument('--state', choices=('preflight', 'applied'), default='preflight')
    args = ap.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    errors = check(ROOT, manifest, args.game.resolve() if args.game else None, args.state)
    if errors:
        for error in errors:
            print('FAIL:', error)
        raise SystemExit(1)
    print('PASS: 52 source files verified' + (f'; target {args.state}: 52 writes / 7 retirements; QSP unchanged' if args.game else ''))
    print('Read-only file validation; native gameplay and existing save migrations are not verified.')


if __name__ == '__main__':
    main()
