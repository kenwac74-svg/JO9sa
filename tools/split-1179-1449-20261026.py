"""Guarded, recorded JSON/PNG split approved by the user on 2026-10-26."""
import argparse
import importlib.util
import json
import os
import re
import struct
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('path_fix', ROOT / 'tools/fix-certain-girls-paths-20261026.py')
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)
OUT = ROOT / 'records/girls-image-path-fix-20261026'
FIELDS = ('fullimage', 'fullmade', 'seed_ava', 'seed_ava_gray', 'seed_ava_clear')


def sha(path):
    return helper.digest(path.read_bytes())


def ids(game):
    result = {}
    for path in (game / 'json/slaves').glob('*.json'):
        prefix = path.stem.split('_')[0]
        if prefix.isdigit():
            number = int(prefix)
            if number in result:
                raise ValueError(f'Duplicate character ID {number}')
            result[number] = path
    return result


def verify(game, record):
    assert sha(game / 'jack.qsp') == record['qspSha256'], 'QSP changed'
    current_ids = ids(game)
    assert set(range(1001, 1450)) <= current_ids.keys(), 'Missing young JSON'
    for row in record['jsons']:
        assert sha(game / row['path']) == row['afterSha256'], row['path']
    for rel, digest in record['otherJsonSha256'].items():
        assert sha(game / rel) == digest, 'Unrelated JSON changed: ' + rel
    index = json.loads((game / 'json/slave_index.json').read_bytes())
    assert index['young_first'] == 1001 and index['young_last'] == 1449
    for number in (1179, 1449):
        data = json.loads(current_ids[number].read_bytes())
        for field in FIELDS:
            rel = data[field] + '.png'
            if not rel.startswith('content/'):
                rel = 'content/pic/' + rel
            assert helper.exact_asset(game, rel), f'Exact case/path missing: {rel}'
            assert str(number) + '_' in Path(rel).name, 'Cross-ID image address'
    for row in record['images']:
        assert helper.exact_asset(game, row['path']), row['path']
        assert sha(game / row['path']) == row['sha256'], row['path']
    for row in record['removed']:
        assert not (game / row['path']).exists(), 'Old green name still present'
        assert sha(Path(record['backup']) / row['path']) == row['sha256'], 'Missing backup'
    for rel, digest in record['retainedSourceSha256'].items():
        assert sha(game / rel) == digest, 'Retained artwork changed: ' + rel
    assert len(current_ids) == record['beforeIdCount'] + 1


def prepare(game):
    assert sha(game / 'jack.qsp') == helper.EXPECTED_QSP, 'Unexpected QSP baseline'
    current_ids = ids(game)
    assert all(n in current_ids for n in range(1001, 1449)) and 1449 not in current_ids
    for path in (game / 'content/pic/girls').rglob('*'):
        assert not re.match(r'^0*1449(?:_|\.|$)', path.name), '1449 asset already occupied'
    old_rel = 'json/slaves/1179.json'
    index_rel = 'json/slave_index.json'
    before = (game / old_rel).read_bytes()
    base = json.loads(before)
    old_values = ('girls/full/1179_red_short_young', 'girls/full/cloth/1179_red_short_young',
                  'content/pic/girls/face/1179_red_short_young_sepia',
                  'content/pic/girls/face/1179_red_short_young_gray',
                  'content/pic/girls/face/1179_red_short_young')
    assert tuple(base[k] for k in FIELDS) == old_values, '1179 changed since review'
    red, green = before, before
    for key, old in zip(FIELDS, old_values):
        red = helper.replace_field(red, key, old, old.replace('red_short', 'red_long'))
        green = helper.replace_field(green, key, old, old.replace('1179_red_short', '1449_green_long'))
    for raw in (red, green):
        data = json.loads(raw)
        assert {k: v for k, v in data.items() if k not in FIELDS} == {k: v for k, v in base.items() if k not in FIELDS}
    restored = red
    for key, old in zip(FIELDS, old_values):
        restored = helper.replace_field(restored, key, old.replace('red_short', 'red_long'), old)
    assert restored == before, 'Unrelated 1179 bytes changed'
    idx_before = (game / index_rel).read_bytes()
    index = json.loads(idx_before)
    assert index['young_first'] == 1001 and index['young_last'] == 1448
    idx_after, count = re.subn(rb'("young_last"\s*:\s*)1448\b', rb'\g<1>1449', idx_before)
    assert count == 1 and json.loads(idx_after) == index | {'young_last': 1449}
    jsons = [(old_rel, before, red), ('json/slaves/1449.json', None, green), (index_rel, idx_before, idx_after)]
    images, removed, source_raw = [], [], {}

    def copy(source, target, kind):
        assert helper.exact_asset(game, source), 'Source path/case missing: ' + source
        assert not (game / target).exists(), 'Destination exists: ' + target
        raw = (game / source).read_bytes()
        assert raw[:8] == b'\x89PNG\r\n\x1a\n'
        source_raw[source] = raw
        images.append({'path': target, 'source': source, 'kind': kind, 'sha256': helper.digest(raw),
                       'bytes': len(raw), 'dimensions': list(struct.unpack('>II', raw[16:24]))})

    for folder in ('full', 'full/cloth'):
        copy(f'content/pic/girls/{folder}/1179_red_short_young.png',
             f'content/pic/girls/{folder}/1179_red_long_young.png', 'red_long_canonical')
    for suffix in ('', '_gray', '_sepia'):
        copy(f'content/pic/girls/face/1179_red_long_young{suffix}.png',
             f'content/pic/girls/face/1179_red_short_young{suffix}.png', 'old_red_save_compatibility')
    green_paths = [f'content/pic/girls/{folder}/1179_green_long_young.png' for folder in ('full', 'full/cloth')]
    green_paths += [f'content/pic/girls/face/1179_green_long_young{suffix}.png' for suffix in ('', '_gray', '_sepia')]
    for rel in green_paths:
        copy(rel, rel.replace('1179_', '1449_'), 'green_new_id')
        removed.append({'path': rel, 'sha256': helper.digest(source_raw[rel])})
    baseline_jsons = {str(p.relative_to(game)).replace('\\', '/'): sha(p) for p in (game / 'json/slaves').glob('*.json')}
    assert all(b'1179_green_long_young' not in p.read_bytes() for p in (game / 'json').rglob('*.json')), 'Old green path has another JSON user'
    baseline_jsons.pop(old_rel)
    record = {'schema': 1, 'game': str(game), 'qspSha256': helper.EXPECTED_QSP, 'oldId': 1179, 'newId': 1449,
              'beforeIdCount': len(current_ids), 'applied': False, 'qspChanged': False, 'savesChanged': False,
              'jsons': [{'path': rel, 'beforeSha256': helper.digest(b) if b is not None else None,
                         'afterSha256': helper.digest(a)} for rel, b, a in jsons],
              'images': images, 'removed': removed, 'otherJsonSha256': baseline_jsons,
              'retainedSourceSha256': {rel: helper.digest(raw) for rel, raw in source_raw.items() if rel not in green_paths},
              'legacyCacheNote': 'Old red PNG addresses remain supported. Existing saved hairColor/hairLen variables are not rewritten.'}
    return record, jsons, source_raw


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--game', required=True, type=Path)
    ap.add_argument('--mode', choices=('prepare', 'apply', 'verify'), required=True)
    args = ap.parse_args()
    game = args.game.resolve()
    OUT.mkdir(parents=True, exist_ok=True)
    if args.mode == 'verify':
        record = json.loads((OUT / '1179-1449-split.json').read_text(encoding='utf-8'))
        assert record['applied'] and str(game) == record['game']
        verify(game, record)
        print('VERIFIED: red 1179 / green 1449; all image paths and hashes, ID uniqueness, generation range, backups, unrelated JSONs and QSP')
        return
    record, jsons, source_raw = prepare(game)
    for rel, _, after in jsons:
        path = ROOT / 'assets' / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(after)
    for row in record['images']:
        path = ROOT / 'resources/new' / row['path']
        path.parent.mkdir(parents=True, exist_ok=True)
        raw = source_raw[row['source']]
        assert not path.exists() or path.read_bytes() == raw, 'Staged asset collision'
        path.write_bytes(raw)
    (OUT / '1179-1449-prepared.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    if args.mode == 'prepare':
        print('PREPARED: update 1179 + index, create 1449; 10 PNG copies, archive/remove 5 old green names; QSP/save unchanged')
        return
    backup = ROOT / 'backups' / ('girls-1179-1449-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    backup.mkdir(parents=True, exist_ok=False)
    for rel, raw in source_raw.items():
        assert (game / rel).read_bytes() == raw, 'Source changed concurrently'
        target = backup / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
    for rel, before, _ in jsons:
        assert (game / rel).read_bytes() == before if before is not None else not (game / rel).exists()
        if before is not None:
            target = backup / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(before)
    created, updated, deleted = [], [], []
    try:
        for row in record['images']:
            path = game / row['path']
            with path.open('xb') as stream:
                stream.write(source_raw[row['source']])
            created.append(path)
        # Generation limit is published last, after both character definitions exist.
        for rel, before, after in jsons:
            path = game / rel
            if before is None:
                with path.open('xb') as stream:
                    stream.write(after)
                created.append(path)
            else:
                assert path.read_bytes() == before, 'JSON changed concurrently'
                temp = path.with_name(path.name + '.1179-split.tmp')
                with temp.open('xb') as stream:
                    stream.write(after)
                os.replace(temp, path)
                updated.append((path, before, after))
        for row in record['removed']:
            path = game / row['path']
            assert sha(path) == row['sha256'] and sha(backup / row['path']) == row['sha256']
            path.unlink()
            deleted.append(row['path'])
        record.update(applied=True, backup=str(backup), appliedAtUtc=datetime.now(timezone.utc).isoformat())
        verify(game, record)
    except Exception:
        for rel in deleted:
            with (game / rel).open('xb') as stream:
                stream.write(source_raw[rel])
        for path, before, after in reversed(updated):
            if path.read_bytes() == after:
                path.write_bytes(before)
        for path in reversed(created):
            path.unlink()
        raise
    (OUT / '1179-1449-split.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    print('APPLIED and VERIFIED: red 1179 / green 1449. Backup: ' + str(backup))


if __name__ == '__main__':
    main()
