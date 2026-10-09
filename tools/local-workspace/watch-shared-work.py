"""Keep a personal JO9WORK checkpoint current without browser filesystem access."""
import argparse
import datetime as dt
import hashlib
import json
import os
import pathlib
import subprocess
import sys
import time

WATCH_CATALOG = (
    'catalog_merge_vs_original.html', 'catalog_status.js', 'catalog_work_ids.json',
    'catalog_editor.js', 'catalog_grok.js', 'catalog_local_pic.js',
    'catalog_pic.js', 'catalog_workshop.js', 'catalog_cuts.js',
    'image_work/progress.json', 'image_work/history.jsonl', 'image_work/bg_queue.json',
    'image_work/personal-patch/events.jsonl', 'image_work/personal-patch/settings.json',
)
IGNORED = {'.git', '__pycache__', 'node_modules', 'runtime', 'tool_backups', 'objects', 'versions'}

def linked(path):
    st = pathlib.Path(path).lstat()
    return pathlib.Path(path).is_symlink() or bool(getattr(st, 'st_file_attributes', 0) & 0x400)

def tree(folder):
    folder = pathlib.Path(folder)
    if not folder.is_dir() or linked(folder):
        return
    for parent, dirs, files in os.walk(folder, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in IGNORED and not linked(pathlib.Path(parent)/d))
        for name in sorted(files):
            if name in ('local.config.json', '.jo9-tool-version.json') or name.endswith(('.tmp', '.sync-tmp', '.log', '.pyc')):
                continue
            p = pathlib.Path(parent)/name
            if not linked(p):
                yield p

def fingerprint(repo, game, catalog, runtime):
    files = [game/'jack.qsp']
    files += [catalog/p for p in WATCH_CATALOG]
    files += [runtime/p for p in ('grok-settings.json', 'dialogue-ai-settings.json')]
    files += [game/'modtools'/p for p in ('config.json', 'filters.json', 'image-original-cuts.json')]
    for sub in ('tools', 'docs', 'mods', 'resources/new', 'records'):
        files += list(tree(repo/sub))
    for sub in ('content/modworkpic', 'content/pic/reserve/jo9mod'):
        files += list(tree(game/sub))
    files += [p for p in (runtime/'backups').glob('*') if p.name[:1].isdigit() and p.suffix in ('.json','.qsp') and not linked(p)]
    for sub in ('cut-mods', 'original-cut-history', 'cut-history'):
        files += list(tree(runtime/sub))
    files += [p for p in tree(game/'mods') if p.suffix.lower()=='.json']
    ledger = catalog/'image_work/personal-patch/events.jsonl'
    if ledger.is_file():
        chosen, owned = {}, set()
        events = [json.loads(line) for line in ledger.read_text('utf-8-sig').splitlines() if line.strip()]
        for event in sorted(events, key=lambda e: (dt.datetime.fromisoformat(e['created'].replace('Z','+00:00')),e['key'])):
            for image in event.get('files', []):
                rel = pathlib.PurePosixPath(image['path'])
                if not rel.is_absolute() and '..' not in rel.parts and ':' not in str(rel) and '\\' not in str(rel):
                    pair = (str(rel),image['after'])
                    if event['operation'] == 'restore' and pair not in owned:
                        chosen.pop(str(rel),None)
                        continue
                    owned.add(pair)
                    chosen[str(rel)] = image['after']
        files += [game/'content/pic'/rel for rel in chosen]
    digest = hashlib.sha256()
    for p in sorted(set(files), key=str):
        try:
            st = p.stat()
            value = (str(p), st.st_size, st.st_mtime_ns)
        except FileNotFoundError:
            value = (str(p), 'missing')
        digest.update(repr(value).encode('utf-8'))
    return digest.hexdigest()

def main():
    parser = argparse.ArgumentParser()
    for name in ('repo', 'game', 'catalog', 'runtime', 'destination', 'original'):
        parser.add_argument('--'+name, required=True)
    parser.add_argument('--interval', type=float, default=10)
    parser.add_argument('--debounce', type=float, default=15)
    parser.add_argument('--once', action='store_true')
    args = parser.parse_args()
    repo, game, catalog, runtime, dest = (pathlib.Path(getattr(args, n)).resolve() for n in ('repo','game','catalog','runtime','destination'))
    runtime.mkdir(parents=True, exist_ok=True)
    # Windows byte-range lock is released by the OS even after an interrupted run.
    lock = (runtime/'shared-sync.lock').open('a+b')
    lock.seek(0)
    if os.name == 'nt':
        import msvcrt
        try:
            msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
        except OSError:
            return
    state_file = runtime/'shared-sync.json'
    state = {'pid': os.getpid(), 'workspace': str(dest), 'status': 'starting'}
    def save_state(**values):
        state.update(values)
        temp = state_file.with_suffix('.new')
        temp.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
        temp.replace(state_file)
    save_state()
    command = [sys.executable, str(repo/'tools/local-workspace/export-shared-work.py')]
    for n in ('repo','game','catalog','runtime','destination','original'):
        command += ['--'+n, getattr(args,n)]
    prior = None
    pending = None
    changed_at = 0
    retry_at = 0
    try:
        while True:
            try:
                now = time.monotonic()
                current = fingerprint(repo, game, catalog, runtime)
                if current != pending:
                    pending, changed_at = current, now
                if current != prior and now >= retry_at and (prior is None or args.once or now-changed_at >= args.debounce):
                    save_state(status='saving')
                    result = subprocess.run(command, capture_output=True, encoding='utf-8', errors='replace', creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
                    if result.returncode:
                        raise RuntimeError((result.stderr or result.stdout)[-4000:])
                    prior = fingerprint(repo, game, catalog, runtime)
                    pending = prior
                    save_state(status='saved', savedAt=time.strftime('%Y-%m-%dT%H:%M:%S%z'), error=None)
                if args.once:
                    return
            except Exception as exc:
                save_state(status='error', error=str(exc)[-4000:])
                if args.once:
                    raise
                retry_at = time.monotonic()+60
            time.sleep(max(1,args.interval))
    finally:
        lock.close()

if __name__ == '__main__':
    main()
