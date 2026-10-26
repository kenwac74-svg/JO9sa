"""Apply the user's approved 174/176/Mira/Sadako resource corrections only."""
import argparse
import hashlib
import importlib.util
import json
import os
import shutil
import struct
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('path_fix', ROOT / 'tools/fix-certain-girls-paths-20261026.py')
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--game', type=Path, required=True)
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()
    game = args.game.resolve()
    if helper.digest((game / 'jack.qsp').read_bytes()) != helper.EXPECTED_QSP:
        raise ValueError('Current QSP differs from the verified home-PC baseline')
    changes = [
        ('2578_mira.json', 'girls/full/mira', 'girls/full/mira_brown_long'),
        ('3011.json', 'girls/full/Sadako', 'girls/full/Sadako_black_long'),
    ]
    jsons, images = [], []
    for name, old, new in changes:
        path = game / 'json/slaves' / name
        before = path.read_bytes()
        original = json.loads(before.decode('utf-8-sig'))
        if original['fullimage'] != old or not helper.exact_asset(game, 'content/pic/' + new + '.png'):
            raise ValueError('Unexpected current JSON or image target: ' + name)
        after = helper.replace_field(before, 'fullimage', old, new)
        expected = original | {'fullimage': new}
        if json.loads(after.decode('utf-8-sig')) != expected or helper.replace_field(after, 'fullimage', new, old) != before:
            raise ValueError('Unrelated JSON changes')
        jsons.append((path, before, after, {'path': 'json/slaves/' + name, 'field': 'fullimage', 'old': old, 'new': new,
                     'beforeSha256': helper.digest(before), 'afterSha256': helper.digest(after)}))
        images.append(('content/pic/' + old + '.png', (game / 'content/pic' / (new + '.png')).read_bytes(),
                       {'kind': 'compatibility_copy', 'source': 'content/pic/' + new + '.png'}))
    for suffix in ('gray', 'sepia'):
        rel = 'content/pic/girls/face/0174_white_short_loli_' + suffix + '.png'
        source = ROOT / 'resources/new' / rel
        images.append((rel, source.read_bytes(), {'kind': 'approved_color_variant', 'source': str(source),
                       'reference': 'content/pic/girls/face/0174_white_short_loli.png'}))
    old_176 = game / 'content/pic/girls/face/0176_black_short_loli_loli.png'
    normal_176 = 'content/pic/girls/face/0176_black_short_loli.png'
    raw_176 = old_176.read_bytes()
    images.append((normal_176, raw_176, {'kind': 'filename_correction',
                   'oldPath': 'content/pic/girls/face/0176_black_short_loli_loli.png'}))
    record_images = []
    for rel, raw, info in images:
        if raw[:8] != b'\x89PNG\r\n\x1a\n':
            raise ValueError('Non-PNG asset')
        if info['kind'] == 'approved_color_variant' and struct.unpack('>II', raw[16:24]) != (150, 150):
            raise ValueError('Portrait must remain 150 x 150')
        target = game / rel
        if target.exists():
            raise ValueError('Existing asset will not be overwritten: ' + rel)
        record_images.append({'path': rel, 'sha256': helper.digest(raw), 'bytes': len(raw)} | info)
    normal_174 = game / 'content/pic/girls/face/0174_white_short_loli.png'
    untouched = {
        'json/slaves/174.json': helper.digest((game / 'json/slaves/174.json').read_bytes()),
        'json/slaves/176.json': helper.digest((game / 'json/slaves/176.json').read_bytes()),
        'content/pic/girls/face/0174_white_short_loli.png': helper.digest(normal_174.read_bytes()),
    }
    out = ROOT / 'records/girls-image-path-fix-20261026'
    out.mkdir(parents=True, exist_ok=True)
    record = {'schema': 1, 'baselineCommit': 'dead2c06edf133eca325617ca2fdc54c4c58c504',
              'baselineQspSha256': helper.EXPECTED_QSP, 'jsons': [x[3] for x in jsons],
              'images': record_images, 'unchanged': untouched, 'applied': False,
              'qspChanged': False, 'savesChanged': False, '2604Changed': False}
    (out / 'approved-followup-prepared.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    if not args.apply:
        print('PREPARED: 2 JSON fields, 174 two portraits, 176 filename correction, 2 save-compatibility PNGs')
        return
    backup = ROOT / 'backups' / ('girls-approved-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    backup.mkdir(parents=True, exist_ok=False)
    for path, before, _, _ in jsons:
        if path.read_bytes() != before:
            raise ValueError('Concurrent JSON change')
        (backup / path.name).write_bytes(before)
    shutil.copy2(old_176, backup / old_176.name)
    # All destinations were checked before the first write. Creation is exclusive.
    for rel, raw, _ in images:
        with (game / rel).open('xb') as stream:
            stream.write(raw)
    for path, before, after, _ in jsons:
        if path.read_bytes() != before:
            raise ValueError('Concurrent JSON change')
        temp = path.with_name(path.name + '.approved-path.tmp')
        with temp.open('xb') as stream:
            stream.write(after)
        os.replace(temp, path)
        source = ROOT / 'assets/json/slaves' / path.name
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_bytes(after)
    # Remove only the reviewed typo-named file after its backup and exact copy exist.
    if old_176.read_bytes() != raw_176 or (game / normal_176).read_bytes() != raw_176:
        raise ValueError('176 changed concurrently')
    old_176.unlink()
    for path, _, after, _ in jsons:
        assert path.read_bytes() == after
    for row in record_images:
        assert helper.digest((game / row['path']).read_bytes()) == row['sha256']
    for rel, expected_sha in untouched.items():
        assert helper.digest((game / rel).read_bytes()) == expected_sha
    record.update(applied=True, backup=str(backup), appliedAtUtc=datetime.now(timezone.utc).isoformat())
    (out / 'approved-followup.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
    print('APPLIED and verified: approved 174, 176, Mira, Sadako only; backup ' + str(backup))


if __name__ == '__main__':
    main()
