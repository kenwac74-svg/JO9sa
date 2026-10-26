"""Preserve existing saves' old image addresses using byte-identical PNG aliases."""
import argparse
import hashlib
import json
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def image_path(game, rel):
    parts = rel.replace('\\', '/').split('/')
    if parts[:3] != ['content', 'pic', 'girls'] or any(x in ('..', '') for x in parts):
        raise ValueError('Unexpected image location')
    return game.joinpath(*parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--game', type=Path, required=True)
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()
    game = args.game.resolve()
    record_dir = ROOT / 'records/girls-image-path-fix-20261026'
    patch = json.loads((record_dir / 'patch.json').read_text(encoding='utf-8'))
    pairs = []
    for entry in patch['files']:
        if sha(game / entry['path']) != entry['afterSha256']:
            raise ValueError('JSON changed after the reviewed correction')
        for change in entry['changes']:
            old = change['old'].replace('\\', '/')
            if not old.startswith('content/pic/'):
                old = 'content/pic/' + old
            old += '.png'
            source = image_path(game, change['new_png'])
            target = image_path(game, old)
            source_hash = sha(source)
            if target.exists() and sha(target) != source_hash:
                raise ValueError(f'Existing different image will not be overwritten: {old}')
            pairs.append({'json': entry['path'], 'field': change['field'],
                          'source': change['new_png'], 'compatibility': old,
                          'sha256': source_hash, 'existed': target.exists()})
    if len(pairs) != 15 or len({p['compatibility'] for p in pairs}) != 15:
        raise ValueError('Unexpected compatibility scope')
    result = {'schema': 1, 'reason': 'Existing saves retain old image addresses',
              'newArtwork': False, 'qspChanged': False, 'savesChanged': False,
              'applied': False, 'files': pairs}
    if args.apply:
        for pair in pairs:
            source = image_path(game, pair['source'])
            target = image_path(game, pair['compatibility'])
            if not target.exists():
                # Exclusive creation: never overwrite a concurrent user edit.
                with source.open('rb') as src, target.open('xb') as dst:
                    shutil.copyfileobj(src, dst)
            if sha(target) != pair['sha256']:
                raise ValueError('Compatibility copy verification failed')
        result['applied'] = True
    (record_dir / 'compatibility.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(('APPLIED' if args.apply else 'PREPARED') + ': 15 byte-identical compatibility PNGs; QSP and saves unchanged')


if __name__ == '__main__':
    main()
