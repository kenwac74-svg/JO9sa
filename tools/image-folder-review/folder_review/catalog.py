"""Read-only recursive inventory and conservative numbered-file pairing."""

import hashlib
import os
import re
import time
from collections import defaultdict
from pathlib import Path

IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.avif', '.ico', '.jfif'}


def stable_id(*parts):
    return hashlib.sha256('\0'.join(str(p) for p in parts).encode('utf-8')).hexdigest()[:24]


def natural_key(text):
    return tuple((1, int(p)) if p.isdigit() else (0, p.casefold()) for p in re.split(r'(\d+)', text))


def parse_filename(name: str) -> dict:
    stem = Path(name).stem
    copy = re.search(r' (\((\d+)\))$', stem)
    copy_token = copy.group(0) if copy else ''
    remaining = stem[:copy.start()] if copy else stem
    number = re.search(r'_(\d+)$', remaining)
    number_token = number.group(0) if number else ''
    base = remaining[:number.start()] if number else remaining
    # An empty base is a valid filename, but cannot absorb unrelated numeric names.
    if not base:
        base, number_token = remaining, ''
    return {'base': base, 'variant_key': number_token + copy_token,
            'sort_key': [int(number.group(1)) if number and number_token else -1,
                         int(copy.group(2)) if copy else -1, number_token + copy_token],
            'extension': Path(name).suffix.casefold()}


def is_link(path: Path) -> bool:
    return path.is_symlink() or bool(getattr(path.lstat(), 'st_file_attributes', 0) & 0x400)


def extension_from_header(path: Path) -> str:
    with path.open('rb') as stream:
        head = stream.read(16)
    for signature, extension in [(b'\x89PNG\r\n\x1a\n', '.png'), (b'\xff\xd8\xff', '.jpg'),
                                 (b'GIF87a', '.gif'), (b'GIF89a', '.gif'), (b'BM', '.bmp'),
                                 (b'II*\x00', '.tif'), (b'MM\x00*', '.tif'), (b'\x00\x00\x01\x00', '.ico')]:
        if head.startswith(signature):
            return extension
    if head[:4] == b'RIFF' and head[8:12] == b'WEBP':
        return '.webp'
    if head[4:8] == b'ftyp' and head[8:12] in (b'avif', b'avis'):
        return '.avif'
    return ''


def scan_pair(original: Path, comparison: Path) -> dict:
    files, issues = [], []
    ignored = 0
    incomplete = False
    for side, root in [('original', original), ('comparison', comparison)]:
        root = root.resolve(strict=True)
        if not root.is_dir():
            raise ValueError('이미지 폴더를 선택해 주세요.')

        def onerror(error):
            nonlocal incomplete
            incomplete = True
            issues.append({'side': side, 'path': str(error.filename), 'message': str(error)})

        for parent, dirs, names in os.walk(root, followlinks=False, onerror=onerror):
            for name in list(dirs):
                p = Path(parent) / name
                try:
                    if is_link(p):
                        dirs.remove(name)
                        issues.append({'side': side, 'path': str(p.relative_to(root)), 'message': '연결 폴더는 따라가지 않았습니다.'})
                except OSError as error:
                    incomplete = True
                    dirs.remove(name)
                    issues.append({'side': side, 'path': str(p), 'message': str(error)})
            for name in names:
                p = Path(parent) / name
                extension = p.suffix.casefold()
                if extension and extension not in IMAGE_EXTENSIONS:
                    ignored += 1
                    continue
                try:
                    if is_link(p):
                        issues.append({'side': side, 'path': str(p.relative_to(root)), 'message': '연결 파일은 건너뛰었습니다.'})
                        continue
                    extension = extension or extension_from_header(p)
                    if not extension:
                        ignored += 1
                        continue
                    stat = p.stat()
                    rel = p.relative_to(root).as_posix()
                    parsed = parse_filename(name)
                    relative_dir = str(Path(rel).parent).replace('\\', '/')
                    if relative_dir == '.':
                        relative_dir = ''
                    files.append({'id': stable_id(side, rel), 'side': side, 'relative_path': rel,
                                  'relative_dir': relative_dir, 'base': parsed['base'],
                                  'group_key': (relative_dir + '/' + parsed['base']).casefold(),
                                  'variant_key': parsed['variant_key'], 'sort_key': parsed['sort_key'],
                                  'extension': extension, 'size': stat.st_size,
                                  'mtime_ns': stat.st_mtime_ns})
                except OSError as error:
                    incomplete = True
                    issues.append({'side': side, 'path': str(p), 'message': str(error)})
    return {'groups': build_groups(files), 'issues': issues, 'incomplete': incomplete, 'scanned_at': time.time(),
            'stats': {'files': len(files), 'original': sum(f['side'] == 'original' for f in files),
                      'comparison': sum(f['side'] == 'comparison' for f in files),
                      'ignored': ignored, 'issues': len(issues)}}


def build_groups(files: list[dict]) -> list[dict]:
    buckets = defaultdict(list)
    for f in files:
        buckets[f['group_key']].append(f)
    groups = []
    for key, items in buckets.items():
        gid = stable_id(key)
        rows = []

        def add(a, b):
            f = a or b
            rows.append({'id': stable_id(a['relative_path'] if a else '', b['relative_path'] if b else ''),
                         'group_id': gid, 'original': a, 'comparison': b,
                         'variant_key': f['variant_key'], 'decision': None, 'review_required': False})

        a = {f['relative_path'].casefold(): f for f in items if f['side'] == 'original'}
        b = {f['relative_path'].casefold(): f for f in items if f['side'] == 'comparison'}
        for rel in sorted(a.keys() & b.keys(), key=natural_key):
            add(a.pop(rel), b.pop(rel))
        variants = defaultdict(lambda: [[], []])
        for index, remaining in enumerate((a, b)):
            for f in remaining.values():
                variants[f['variant_key']][index].append(f)
        for left, right in variants.values():
            if len(left) == len(right) == 1:
                add(left[0], right[0])
            else:
                for f in left:
                    add(f, None)
                for f in right:
                    add(None, f)
        rows.sort(key=lambda r: (tuple((r['original'] or r['comparison'])['sort_key']),
                                 natural_key((r['original'] or r['comparison'])['relative_path']), r['id']))
        first = items[0]
        groups.append({'id': gid, 'relative_dir': first['relative_dir'], 'name': first['base'],
                       'rows': rows, 'decision_summary': 'unreviewed'})
    return sorted(groups, key=lambda g: (natural_key(g['relative_dir']), natural_key(g['name'])))
