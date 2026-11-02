import collections
import datetime
import json
import os
import stat
from pathlib import Path

ROOT = Path('G:/somi')
OUT = Path(__file__).parent / 'somi-stat-inventory.json'
ARCHIVES = {'.zip', '.7z', '.rar', '.tar', '.gz', '.bz2', '.xz', '.iso'}
SAVES = {'.sav', '.qsav'}
REPARSE = getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0x400)

def counter():
    return {'bytes': 0, 'files': 0, 'directories': 0, 'reparse': 0, 'saves': 0, 'archives': 0}

report = {'root': str(ROOT), 'started': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'readOnlySource': True, 'topLevel': [], 'reparsePoints': [], 'errors': [], 'archives': [], 'largeFiles': [], 'metadataCandidates': []}
for top in sorted(os.scandir(ROOT), key=lambda item: item.name.casefold()):
    summary = counter()
    summary.update(name=top.name, path=top.path, lastWriteNs=top.stat(follow_symlinks=False).st_mtime_ns, subdirectories={})
    stack = [(top.path, ())]
    while stack:
        here, parts = stack.pop()
        try:
            info = os.stat(here, follow_symlinks=False)
        except OSError as error:
            report['errors'].append({'path': here, 'error': str(error)})
            continue
        attrs = getattr(info, 'st_file_attributes', 0)
        if attrs & REPARSE:
            summary['reparse'] += 1
            report['reparsePoints'].append({'path': here, 'target': os.path.realpath(here), 'attributes': attrs})
            continue
        sub = summary['subdirectories'].setdefault(parts[0], counter()) if parts else None
        if stat.S_ISDIR(info.st_mode):
            summary['directories'] += 1
            if sub is not None:
                sub['directories'] += 1
            try:
                with os.scandir(here) as entries:
                    for item in entries:
                        stack.append((item.path, parts + (item.name,)))
            except OSError as error:
                report['errors'].append({'path': here, 'error': str(error)})
            continue
        summary['files'] += 1
        summary['bytes'] += info.st_size
        if sub is not None:
            sub['files'] += 1
            sub['bytes'] += info.st_size
        suffix = Path(here).suffix.casefold()
        if suffix in SAVES:
            summary['saves'] += 1
            if sub is not None:
                sub['saves'] += 1
        if suffix in ARCHIVES:
            summary['archives'] += 1
            if sub is not None:
                sub['archives'] += 1
            report['archives'].append({'path': here, 'bytes': info.st_size, 'mtimeNs': info.st_mtime_ns})
        if info.st_size >= 100_000_000:
            report['largeFiles'].append({'path': here, 'bytes': info.st_size, 'mtimeNs': info.st_mtime_ns})
        basename = Path(here).name.casefold()
        if info.st_size < 15_000_000 and suffix in {'.json', '.md', '.txt', '.csv', '.tsv'} and any(word in basename for word in ['manifest', 'restore', 'report', 'readme', 'index', 'mapping']):
            if top.name not in {'JO9sa', 'Jack O Nine Tails v2.4_work', 'Jack O Nine Tails v2.4 Kor_Full', 'JO9O', 'JO9resource', 'IMGMG'}:
                report['metadataCandidates'].append({'path': here, 'bytes': info.st_size})
    report['topLevel'].append(summary)
    print(json.dumps({'name': top.name, 'files': summary['files'], 'bytes': summary['bytes'], 'reparse': summary['reparse'], 'saves': summary['saves']}, ensure_ascii=False), flush=True)
report['archives'].sort(key=lambda item: item['bytes'], reverse=True)
report['largeFiles'].sort(key=lambda item: item['bytes'], reverse=True)
report['finished'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'report': str(OUT), 'topLevel': len(report['topLevel']), 'totalBytes': sum(item['bytes'] for item in report['topLevel']), 'totalFiles': sum(item['files'] for item in report['topLevel']), 'reparse': len(report['reparsePoints']), 'errors': len(report['errors'])}, ensure_ascii=False), flush=True)
