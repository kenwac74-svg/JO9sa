"""JO9 reviewed image archive transactions. Does not infer whether images are unused."""
import argparse
import hashlib
import json
import os
import re
from pathlib import Path, PurePosixPath, PureWindowsPath
import shutil
import sys
from datetime import datetime, timezone

IMAGES = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.ico', '.tif', '.tiff', '.avif'}
DEPENDENCIES = {'.qsp', '.qsrc', '.qproj', '.css', '.html', '.htm', '.js', '.json',
                '.ini', '.cfg', '.xml', '.exe', '.dll', '.sav', '.txt', '.csv', '.py', '.bat', '.lua'}
EXCLUDED = {'.git', 'node_modules', '__pycache__', '__jo9_imagebackups'}
PROOFS = ('static', 'dynamic', 'index', 'external', 'intent')


def require(ok, message):
    if not ok:
        raise ValueError(message)


def stamp():
    return datetime.now(timezone.utc).isoformat()


def sha(path):
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def no_links(path):
    for part in (path, *path.parents):
        require(not part.is_symlink() and not getattr(part, 'is_junction', lambda: False)(),
                f'Link/junction refused: {part}')


def absolute(value):
    path = Path(value).absolute()
    no_links(path)
    return path.resolve()


def inside(path, root):
    return path == root or root in path.parents


def overlap(a, b):
    return inside(a, b) or inside(b, a)


def relative(value):
    require(isinstance(value, str) and value.strip(), 'Missing relative path')
    require(not PureWindowsPath(value).drive and not PureWindowsPath(value).is_absolute(),
            f'Absolute/drive path refused: {value}')
    normalized = value.replace('\\', '/')
    require(not normalized.startswith('/') and ':' not in normalized, f'Invalid path: {value}')
    require(all(x not in ('', '.', '..') for x in normalized.split('/')), f'Unsafe path: {value}')
    return PurePosixPath(normalized).as_posix()


def member(root, rel):
    rel = relative(rel)
    path = absolute(root / rel)
    require(inside(path, root) and path != root, f'Path escapes root: {rel}')
    return path


def save(path, data, new=False):
    path = absolute(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    if new:
        with path.open('x', encoding='utf-8') as out:
            out.write(encoded)
            out.flush()
            os.fsync(out.fileno())
    else:
        temporary = path.with_name(path.name + '.tmp')
        with temporary.open('x', encoding='utf-8') as out:
            out.write(encoded)
            out.flush()
            os.fsync(out.fileno())
        os.replace(temporary, path)


def transition_state(root):
    """Read the installed cycle registry and original-cut bindings as protected assets."""
    game = root if (root / 'jack.qsp').is_file() else root / 'game'
    prefix = game.relative_to(root).as_posix()
    prefix = '' if prefix == '.' else prefix + '/'
    protected, original_roots, links = set(), [], {}
    qsp = game / 'jack.qsp'
    if qsp.is_file():
        fields = qsp.read_bytes().decode('utf-16-le').split('\r\n')
        require(fields[0] == 'QSPGAME', 'Unsupported installed QSP; cannot check transition protection')
        shift = lambda value: ''.join(chr((ord(c) + 5) & 65535) for c in value)
        count, at = int(shift(fields[3])), 4
        for _ in range(count):
            name, body = shift(fields[at]), shift(fields[at + 2])
            if name == 'interior_change':
                for match in re.finditer(r'\$jo9_(?:base|path)\s*=\s*([\'\"])(.*?)\1', body, re.I):
                    value = match[2].replace('\\', '/')
                    if value.casefold().startswith('content/pic/') and '<<' not in value:
                        protected.add((prefix + relative(value)).casefold())
            at += 4 + 3 * int(shift(fields[at + 3]))
        require(at == len(fields) - 1 and fields[-1] == '', 'Malformed installed QSP')
    manifest_path = game / 'modtools/image-original-cuts.json'
    if manifest_path.is_file():
        manifest = read(manifest_path)
        originals = manifest.get('originals', {})
        for entry in list(originals.values()) + list(manifest.get('reservations', {}).values()):
            for key in ('base', 'alias'):
                if entry.get(key):
                    protected.add((prefix + 'content/pic/' + relative(entry[key])).casefold())
        if originals:
            source_root = absolute(manifest['sourceRoot'])
            original_roots.append(source_root)
            source_pic = absolute(source_root / 'content/pic')
            binding = game / 'content/jo9o_original_cuts'
            require(binding.is_dir() and binding.resolve() == source_pic,
                    'Original B-cut binding is missing or points to another root')
            items = {}
            for entry in originals.values():
                source = member(source_root, entry['source'])
                stat = source.stat()
                items[relative(entry['source'])] = [stat.st_size, stat.st_mtime_ns]
            links[binding.relative_to(root).as_posix()] = {
                'target': str(source_pic), 'images': dict(sorted(items.items()))}
    return protected, original_roots, links


def snapshot(root, extra):
    require(root.is_dir(), f'Missing root: {root}')
    _, _, links = transition_state(root)
    images, dependencies = {}, {}
    pending = [root]
    while pending:
        folder = pending.pop()
        with os.scandir(folder) as entries:
            for entry in entries:
                path = Path(entry.path)
                if entry.name.casefold() in EXCLUDED:
                    continue
                if path.relative_to(root).as_posix() in links:
                    # Known original B-cut binding: tracked externally, never recurse into it.
                    continue
                no_links(path)
                if entry.is_dir(follow_symlinks=False):
                    pending.append(path)
                elif entry.is_file(follow_symlinks=False):
                    rel = path.relative_to(root).as_posix()
                    if path.suffix.casefold() in IMAGES:
                        stat = entry.stat(follow_symlinks=False)
                        images[rel] = [stat.st_size, stat.st_mtime_ns]
                    elif path.suffix.casefold() in DEPENDENCIES and entry.name.casefold() != 'desktop.ini':
                        dependencies[rel] = sha(path)
    for rel in extra:
        dependencies[relative(rel)] = sha(member(root, rel))
    return {'version': 1, 'root': str(root), 'extra_dependencies': extra,
            'images': dict(sorted(images.items())), 'dependencies': dict(sorted(dependencies.items())),
            'read_only_original_bindings': links}


def fresh(baseline):
    require(baseline.get('version') == 1, 'Unsupported snapshot version')
    current = snapshot(absolute(baseline['root']), baseline['extra_dependencies'])
    require(current == baseline, 'Audit snapshot changed; investigate and repeat the audit')


def boundaries(root, archive, protected):
    require(not overlap(root, archive), 'Archive must be outside the JO9 root, not its parent')
    for protected_root in protected:
        require(not inside(root, protected_root), f'JO9 root is protected: {protected_root}')
        require(not overlap(archive, protected_root), f'Archive overlaps protected root: {protected_root}')


def validate_plan(plan, for_restore=False):
    require(plan.get('version') == 1, 'Unsupported plan version')
    root, archive = absolute(plan['root']), absolute(plan['archive'])
    transition_paths, original_roots, _ = transition_state(root)
    protected = [absolute(p) for p in plan['protected_roots']] + original_roots
    boundaries(root, archive, protected)
    require(absolute(plan['snapshot']['root']) == root, 'Snapshot belongs to another JO9 root')
    seen = set()
    for item in plan['entries']:
        rel = relative(item['path'])
        require(rel.casefold() not in seen, f'Duplicate path: {rel}')
        seen.add(rel.casefold())
        require(for_restore or rel.casefold() not in transition_paths, f'Protected transition image: {rel}')
        require(Path(rel).suffix.casefold() in IMAGES, f'Not an image: {rel}')
        require(not any(p.casefold() in EXCLUDED for p in PurePosixPath(rel).parts), f'Protected folder: {rel}')
        require(rel in plan['snapshot']['images'], f'Not in audited inventory: {rel}')
        src = member(root, rel)
        member(archive / 'files', rel)
        require(not any(inside(src, p) for p in protected), f'Protected image: {rel}')
        require(all(isinstance(item.get('proofs', {}).get(k), str) and item['proofs'][k].strip()
                    for k in PROOFS), f'Incomplete review: {rel}')
        require(len(item['sha256']) == 64 and all(c in '0123456789abcdef' for c in item['sha256']),
                f'Invalid SHA256: {rel}')
    return root, archive


def make_plan(args):
    baseline = read(args.snapshot)
    fresh(baseline)
    root, archive = absolute(baseline['root']), absolute(args.archive)
    protected = [str(absolute(p)) for p in args.protect]
    reviews = read(args.reviews)
    require(absolute(reviews['audit_root']) == root, 'Reviews belong to another JO9 root')
    audited = read(args.audit)
    require(isinstance(audited, dict), 'Audit requires root and snapshot provenance, not a bare file list')
    require(absolute(audited['root']) == root, 'Audit belongs to another JO9 root')
    require(audited['snapshot_sha256'] == sha(absolute(args.snapshot)), 'Audit belongs to another snapshot')
    rows = audited['rows']
    audit = {}
    for row in rows:
        key = relative(row['path']).casefold()
        require(key not in audit, f'Duplicate audit path: {key}')
        audit[key] = row
    entries, seen = [], set()
    for review in reviews['reviews']:
        rel = relative(review['path'])
        require(rel.casefold() not in seen, f'Duplicate review: {rel}')
        seen.add(rel.casefold())
        require(review['decision'] in ('move', 'hold'), f'Unknown decision: {rel}')
        if review['decision'] == 'hold':
            continue
        row = audit.get(rel.casefold())
        require(row is not None and row['status'] == 'unreferenced_candidate', f'Not an unused candidate: {rel}')
        require(not row.get('evidence') and not row.get('dynamic_rules'), f'Reference evidence present: {rel}')
        src = member(root, rel)
        entries.append({'path': rel, 'bytes': src.stat().st_size, 'sha256': sha(src),
                        'proofs': review.get('proofs', {})})
    plan = {'version': 1, 'created_utc': stamp(), 'root': str(root), 'archive': str(archive),
            'protected_roots': protected, 'snapshot': baseline, 'audit_file': str(absolute(args.audit)),
            'audit_sha256': sha(absolute(args.audit)), 'reviews_file': str(absolute(args.reviews)),
            'reviews_sha256': sha(absolute(args.reviews)), 'entries': entries,
            'count': len(entries), 'bytes': sum(e['bytes'] for e in entries)}
    validate_plan(plan)
    output = absolute(args.output)
    require(not inside(output, root) and not inside(output, archive), 'Plan must be outside JO9 and archive')
    require(not any(inside(output, absolute(p)) for p in protected), 'Plan output is protected')
    fresh(baseline)
    save(output, plan, new=True)
    return {'plan': str(output), 'count': plan['count'], 'bytes': plan['bytes'], 'moved': 0}


def copy_checked(src, dst, expected):
    no_links(src)
    no_links(dst)
    require(sha(src) == expected, f'Content changed: {src}')
    dst.parent.mkdir(parents=True, exist_ok=True)
    no_links(dst)
    with src.open('rb') as source, dst.open('xb') as target:
        shutil.copyfileobj(source, target, 1024 * 1024)
        target.flush()
        os.fsync(target.fileno())
    shutil.copystat(src, dst)
    require(sha(dst) == expected and sha(src) == expected, f'Copy verification failed: {dst}')


def apply_plan(args):
    plan_path = absolute(args.plan)
    plan = read(plan_path)
    root, archive = validate_plan(plan)
    require(plan['entries'], 'No MOVE_READY files in plan')
    fresh(plan['snapshot'])
    for item in plan['entries']:
        src, dst = member(root, item['path']), member(archive / 'files', item['path'])
        require(sha(src) == item['sha256'], f'Image changed: {src}')
        require(not dst.exists(), f'Archive collision: {dst}')
    require(not archive.exists() or not any(archive.iterdir()), 'Archive run folder must be new or empty')
    journal_path = archive / 'journal.json'
    journal = {'version': 1, 'plan': plan, 'plan_file': str(plan_path), 'plan_sha256': sha(plan_path),
               'created_utc': stamp(), 'status': 'running',
               'entries': [{'path': e['path'], 'state': 'pending'} for e in plan['entries']]}
    save(journal_path, journal, new=True)
    try:
        for item, state in zip(plan['entries'], journal['entries']):
            src, dst = member(root, item['path']), member(archive / 'files', item['path'])
            state['state'] = 'copying'
            save(journal_path, journal)
            copy_checked(src, dst, item['sha256'])
            state['state'] = 'verified_copy'
            save(journal_path, journal)
            no_links(src)
            require(sha(src) == item['sha256'], f'Image changed before removal: {src}')
            src.unlink()
            state['state'] = 'moved'
            save(journal_path, journal)
        journal['status'] = 'complete'
        save(journal_path, journal)
    except Exception as error:
        journal['status'], journal['error'] = 'failed', str(error)
        save(journal_path, journal)
        raise
    return {'journal': str(journal_path), 'moved': plan['count'], 'bytes': plan['bytes']}


def restore(args):
    journal_path = absolute(args.journal)
    journal = read(journal_path)
    require(journal.get('version') == 1, 'Unsupported journal version')
    plan = journal['plan']
    root, archive = validate_plan(plan, for_restore=True)
    require(journal_path == archive / 'journal.json', 'Journal is not in its recorded archive folder')
    require([x['path'] for x in journal['entries']] == [x['path'] for x in plan['entries']],
            'Journal entries differ from plan')
    # Preflight all files before restoring any. Partial or changed copies remain untouched.
    for item in plan['entries']:
        src, dst = member(root, item['path']), member(archive / 'files', item['path'])
        require(src.exists() or dst.exists(), f'Both copies missing: {item["path"]}')
        for path in (src, dst):
            if path.exists():
                require(sha(path) == item['sha256'], f'Restore collision or damaged copy: {path}')
    journal['status'] = 'restoring'
    save(journal_path, journal)
    try:
        for item, state in zip(plan['entries'], journal['entries']):
            src, dst = member(root, item['path']), member(archive / 'files', item['path'])
            if not src.exists():
                copy_checked(dst, src, item['sha256'])
            require(sha(src) == item['sha256'], f'Restored content changed: {src}')
            if dst.exists():
                require(sha(dst) == item['sha256'], f'Archive content changed: {dst}')
                dst.unlink()
            state['state'] = 'restored'
            save(journal_path, journal)
        journal['status'] = 'restored'
        save(journal_path, journal)
    except Exception as error:
        journal['status'], journal['error'] = 'restore_failed', str(error)
        save(journal_path, journal)
        raise
    return {'journal': str(journal_path), 'restored': len(plan['entries'])}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    snap = sub.add_parser('snapshot')
    snap.add_argument('--root', required=True)
    snap.add_argument('--output', required=True)
    snap.add_argument('--dependency', action='append', default=[])
    plan = sub.add_parser('plan')
    for name in ('snapshot', 'audit', 'reviews', 'archive', 'output'):
        plan.add_argument('--' + name, required=True)
    plan.add_argument('--protect', action='append', default=[])
    sub.add_parser('apply').add_argument('--plan', required=True)
    sub.add_parser('restore').add_argument('--journal', required=True)
    args = parser.parse_args()
    if args.command == 'snapshot':
        root, output = absolute(args.root), absolute(args.output)
        require(not inside(output, root), 'Snapshot must be outside JO9')
        baseline = snapshot(root, [relative(p) for p in args.dependency])
        save(output, baseline, new=True)
        result = {'snapshot': str(output), 'images': len(baseline['images']),
                  'dependencies': len(baseline['dependencies']), 'moved': 0}
    elif args.command == 'plan':
        result = make_plan(args)
    elif args.command == 'apply':
        result = apply_plan(args)
    else:
        result = restore(args)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f'STOP: {error}', file=sys.stderr)
        sys.exit(1)
