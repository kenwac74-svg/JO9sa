"""Export a portable JO9WORK snapshot; never scan the vanilla picture tree.

The manifest is the commit point. Existing unmanaged files are retained, and a
locally modified managed file causes a preflight failure rather than overwrite.
Only current images whose bytes match the personal-work ledger are exported.
"""
import argparse
import datetime as dt
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import tempfile
import uuid
import zipfile

EXCLUDED_DIRS = {'.git', 'node_modules', '__pycache__', 'runtime', 'backups',
                 'status_backups', 'tool_backups', 'objects', 'thumbs', '.pytest_cache'}
EXCLUDED_NAMES = {'local.config.json', '.env', 'server.json',
                  'grok-settings.json', 'dialogue-ai-settings.json',
                  'catalog_workshop_config.js', 'catalog_work_codes.js'}
SECRET_NAME = re.compile(r'^(?:api[-_]?key|credentials?|secrets?|access[-_]?token|.*\.dpapi)(?:\.|$)', re.I)
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'}
RESOURCE_LIMIT = 16 * 1024 * 1024
BACKUP_FILE_LIMIT = 512 * 1024 * 1024
BACKUP_TOTAL_LIMIT = 8 * 1024 * 1024 * 1024
BACKUP_COUNT_LIMIT = 10000
CATALOG_UI = ('catalog_editor.js', 'catalog_grok.js', 'catalog_local_pic.js',
              'catalog_pic.js', 'catalog_workshop.js', 'catalog_cuts.js')

def backup_inputs(folder):
    folder = Path(folder)
    inputs = []
    if not folder.exists():
        return inputs
    no_links(folder)
    for p in sorted(folder.glob('*.qsp')):
        if not re.fullmatch(r'\d[^/\\:]*\.qsp', p.name, re.I):
            continue
        no_links(p)
        s = p.stat()
        if not p.is_file() or s.st_size > BACKUP_FILE_LIMIT:
            raise ValueError('Invalid or oversized dialogue backup: ' + p.name)
        inputs.append({'path': p.name, 'bytes': s.st_size, 'mtimeNs': s.st_mtime_ns})
    if len(inputs) > BACKUP_COUNT_LIMIT or sum(x['bytes'] for x in inputs) > BACKUP_TOTAL_LIMIT:
        raise ValueError('Dialogue backup count/size limit exceeded.')
    return inputs

def archive_backups(folder, output, inputs):
    members = []
    identities = {entry['path']: (Path(folder) / entry['path']).stat().st_ino for entry in inputs}
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for entry in inputs:
            source = Path(folder) / entry['path']
            no_links(source)
            before = source.stat()
            if before.st_size != entry['bytes'] or before.st_mtime_ns != entry['mtimeNs']:
                raise ValueError('Dialogue backup changed during snapshot: ' + entry['path'])
            digest = hashlib.sha256()
            written = 0
            with source.open('rb') as raw, archive.open(entry['path'], 'w', force_zip64=True) as zipped:
                for chunk in iter(lambda: raw.read(1024 * 1024), b''):
                    zipped.write(chunk)
                    digest.update(chunk)
                    written += len(chunk)
            after = source.stat()
            if written != entry['bytes'] or after.st_size != before.st_size or after.st_mtime_ns != before.st_mtime_ns or after.st_ino != identities[entry['path']]:
                raise ValueError('Dialogue backup changed during snapshot: ' + entry['path'])
            members.append({'path': entry['path'], 'sha256': digest.hexdigest(), 'bytes': written})
    if backup_inputs(folder) != inputs:
        raise ValueError('Dialogue backup set changed during snapshot.')
    return {'format': 'jo9-dialogue-backups', 'version': 1, 'files': members}

def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')

def sha_file(path):
    result = hashlib.sha256()
    with Path(path).open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()

def linked(path):
    s = Path(path).lstat()
    return stat.S_ISLNK(s.st_mode) or bool(getattr(s, 'st_file_attributes', 0) & 0x400)

def relative(value):
    value = str(value)
    p = PurePosixPath(value)
    if not value or p.is_absolute() or '\\' in value or ':' in value or any(x in ('', '.', '..') for x in value.split('/')):
        raise ValueError('Unsafe package path: ' + value)
    return value

def no_links(path):
    path = Path(path).absolute()
    for p in [path, *path.parents]:
        if p.exists() and linked(p):
            raise ValueError('Linked path is not an export destination/source: ' + str(p))

def tree(root, source_tools=False):
    root = Path(root)
    if not root.exists():
        return
    if linked(root):
        raise ValueError('Refusing linked source root: ' + str(root))
    for folder, dirs, names in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDED_DIRS and not linked(Path(folder) / d))
        for name in sorted(names):
            p = Path(folder) / name
            rel = p.relative_to(root).as_posix()
            if linked(p) or name in EXCLUDED_NAMES or SECRET_NAME.match(name) or name.startswith('.env'):
                continue
            if p.suffix.lower() in {'.log', '.tmp', '.pyc', '.sav', '.lnk'}:
                continue
            if source_tools and (p.suffix.lower() in {'.qsp', '.zip', '.7z'} or rel.startswith(('local-workspace/catalog/', 'local-workspace/catalog-seed/', 'local-workspace/settings-seed/'))):
                continue
            yield p, rel

def portable(value, replacements):
    if isinstance(value, str):
        for old, new in sorted(replacements, key=lambda pair: len(pair[0]), reverse=True):
            if old:
                value = value.replace(old, new)
        return value
    if isinstance(value, list):
        return [portable(x, replacements) for x in value]
    if isinstance(value, dict):
        return {k: portable(v, replacements) for k, v in value.items()
                if not re.fullmatch(r'(?:api[_-]?key|access[_-]?token|secret|password|dpapi|encryptedKey)', k, re.I)}
    return value

def selected_images(ledger):
    """Same ownership rule as build-personal-patch.py, without old comparisons."""
    chosen, owned = {}, set()
    if not ledger.exists():
        return chosen
    events = [json.loads(line) for line in ledger.read_text('utf-8-sig').splitlines() if line.strip()]
    def event_time(event):
        value = dt.datetime.fromisoformat(event['created'].replace('Z', '+00:00'))
        if value.tzinfo is None:
            raise ValueError('Personal-work ledger timestamps require a timezone.')
        return value, event['key']
    for event in sorted(events, key=event_time):
        for item in event['files']:
            key = relative(item['path'])
            h = item['after']
            if not re.fullmatch('[0-9a-fA-F]{64}', h) or PurePosixPath(key).suffix.lower() not in IMAGE_EXTENSIONS:
                raise ValueError('Invalid personal-image ledger entry: ' + key)
            h = h.lower()
            if event['operation'] == 'relocate':
                source = relative(item['fromPath'])
                if chosen.get(source) == h:
                    chosen.pop(source)
                    chosen[key] = h
                    owned.add((key, h))
                continue
            if event['operation'] == 'restore' and (key, h) not in owned:
                chosen.pop(key, None)
                continue
            owned.add((key, h))
            chosen[key] = h
    return chosen

def retired_images(repo):
    """Only the explicitly approved legacy retirement manifest authorizes omission."""
    plan = Path(repo) / 'docs/resource-audits/2026-10-11/legacy-1.2.1/plan.json'
    if not plan.is_file():
        return {}
    result = {}
    for entry in read_json(plan)['entries']:
        prefix = 'game/content/pic/'
        source = entry['path'].replace('\\', '/')
        if not source.startswith(prefix):
            raise ValueError('Invalid retirement path: ' + source)
        key = relative(source[len(prefix):])
        h = entry['sha256'].lower()
        if '1.2.1' not in PurePosixPath(key).name or not re.fullmatch('[0-9a-f]{64}', h):
            raise ValueError('Invalid legacy retirement record: ' + key)
        result[key] = h
    return result

def load_sync(repo):
    p = repo / 'tools/local-workspace/sync-workspace-state.py'
    spec = importlib.util.spec_from_file_location('jo9_export_state', p)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def version_stamp(repo, export_id, created):
    try:
        command = ['git', '-c', 'safe.directory=' + str(repo), '-C', str(repo)]
        revision = subprocess.check_output(command + ['rev-parse', 'HEAD'], stderr=subprocess.DEVNULL, text=True).strip()
        committed = int(subprocess.check_output(command + ['show', '-s', '--format=%ct', 'HEAD'], stderr=subprocess.DEVNULL, text=True).strip())
        return {'revision': revision, 'committedAt': committed}
    except (OSError, subprocess.CalledProcessError, ValueError):
        marker = repo / 'tools/local-workspace/.jo9-tool-version.json'
        if marker.exists():
            value = read_json(marker)
            return {'revision': str(value['revision']), 'committedAt': int(value['committedAt'])}
        return {'revision': 'export:' + export_id, 'committedAt': int(created.timestamp())}

def export(repo, game, catalog, runtime, destination, original=None):
    no_links(destination)
    repo, game, catalog, runtime, destination = map(lambda p: Path(p).resolve(), (repo, game, catalog, runtime, destination))
    if not (game / 'jack.qsp').is_file():
        raise ValueError('Latest game checkpoint is missing: game/jack.qsp')
    for source in (game, catalog, runtime):
        if destination == source or destination.is_relative_to(source):
            raise ValueError('Destination must be outside source trees.')
    if destination != repo and destination.is_relative_to(repo):
        raise ValueError('Destination must be outside the repository, or the shared workspace itself.')
    no_links(destination)
    if original is None:
        p = catalog / 'image_work/progress.json'
        value = read_json(p).get('roots', {}).get('original') if p.exists() else None
        original = Path(value) if value else game.parent / '.vanilla-not-included'
    original = Path(original).resolve()
    if game == original:
        raise ValueError('Play and vanilla must be separate.')
    created = dt.datetime.now(dt.timezone.utc)
    export_id = created.strftime('%Y%m%dT%H%M%S%fZ') + '-' + uuid.uuid4().hex[:8]
    previous_file = destination / 'manifest.json'
    no_links(previous_file)
    previous = read_json(previous_file) if previous_file.exists() else None
    if previous and (previous.get('format') != 'jo9-shared-work' or previous.get('version') != 1):
        raise ValueError('Unknown existing destination manifest.')
    known = {relative(f['path']): f['sha256'] for f in previous.get('files', [])} if previous else {}
    workspace_id = previous.get('workspaceId') if previous else None
    if workspace_id is None:
        workspace_id = str(uuid.uuid4())
    if not isinstance(workspace_id, str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,80}', workspace_id):
        raise ValueError('Unsafe workspaceId in previous manifest.')
    replacements = [(str(game), '@GAME@'), (str(original), '@ORIGINAL@'),
                    (str(catalog), '@CATALOG@'), (str(runtime), '@RUNTIME@'), (str(repo), '@REPO@')]
    # An active JO9WORK/catalog must never be rewritten as a portable seed.
    catalog_snapshot = 'catalog-snapshot' if catalog == destination / 'catalog' else 'catalog'
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Stage metadata in local TEMP, never in a cloud-synchronized Drive folder.
    with tempfile.TemporaryDirectory(prefix='jo9-export-') as temporary:
        stage = Path(temporary)
        planned = {}
        sources = {}
        def put(rel, data, category):
            rel = relative(rel)
            sources.pop(rel, None)
            target = stage / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            planned[rel] = {'path': rel, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data), 'category': category}
        def copy(source, rel, category, expected=None):
            no_links(source)
            rel = relative(rel)
            before = source.stat()
            h = sha_file(source)
            after = source.stat()
            if before.st_mtime_ns != after.st_mtime_ns or before.st_size != after.st_size:
                raise ValueError('Source changed during snapshot: ' + rel)
            if expected and h != expected:
                raise ValueError('Current personal image differs from adopted ledger hash: ' + rel)
            sources[rel] = source
            planned[rel] = {'path': rel, 'sha256': h, 'bytes': after.st_size, 'category': category}
        for folder in ('tools', 'docs', 'mods', 'records'):
            for p, rel in tree(repo / folder, source_tools=folder == 'tools'):
                if p.suffix.lower() == '.json' and folder in ('mods', 'records'):
                    put(folder + '/' + rel, json_bytes(portable(read_json(p), replacements)), folder)
                else:
                    copy(p, folder + '/' + rel, folder)
        for p, rel in tree(repo / 'resources/new'):
            if p.stat().st_size > RESOURCE_LIMIT:
                raise ValueError('Resource exceeds small personal-patch limit: ' + rel)
            copy(p, 'resources/new/' + rel, 'resources')
        sync = load_sync(repo)
        for name in CATALOG_UI:
            source = catalog / name
            if not source.is_file():
                source = repo / 'tools/imgmg' / name
            if not source.is_file():
                raise ValueError('Required catalog UI script is missing: ' + name)
            copy(source, catalog_snapshot + '/' + name, 'catalog')
        sync.export(catalog, stage / catalog_snapshot, game, original)
        for p, rel in tree(stage / catalog_snapshot):
            h = sha_file(p)
            package_path = catalog_snapshot + '/' + rel
            planned[package_path] = {'path': package_path, 'sha256': h, 'bytes': p.stat().st_size, 'category': 'catalog'}
        for name in ('grok-settings.json', 'dialogue-ai-settings.json'):
            p = runtime / name
            if p.exists():
                settings = read_json(p)
                clean = {key: settings[key] for key in ('provider', 'model', 'aiId') if key in settings and isinstance(settings[key], (str, int, float, bool, type(None)))}
                put('preferences/' + name, json_bytes(clean), 'preferences')
        for name in ('config.json', 'filters.json'):
            p = game / 'modtools' / name
            if p.is_file():
                no_links(p)
                put('preferences/workshop/' + name, json_bytes(portable(read_json(p), replacements)), 'preferences')
        marker = game / 'modtools/image-original-cuts.json'
        if marker.is_file():
            no_links(marker)
            put('game-metadata/modtools/image-original-cuts.json', json_bytes(portable(read_json(marker), replacements)), 'game-metadata')
        for p, rel in tree(game / 'mods'):
            if p.suffix.lower() == '.json':
                put('game-metadata/mods/' + rel, json_bytes(portable(read_json(p), replacements)), 'game-metadata')
        chosen = selected_images(catalog / 'image_work/personal-patch/events.jsonl')
        retired = retired_images(repo)
        omitted_retired = []
        for key, expected in sorted(chosen.items()):
            source = game / 'content/pic' / key
            if not source.is_file():
                if retired.get(key) == expected:
                    omitted_retired.append({'path': key, 'sha256': expected})
                    continue
                raise ValueError('Adopted personal image is missing: ' + key)
            copy(source, 'personal-images/content/pic/' + key, 'personal-images', expected)
        for folder in ('content/modworkpic', 'content/pic/reserve/jo9mod'):
            for p, rel in tree(game / folder):
                copy(p, 'working-images/' + folder + '/' + rel, 'working-images')
        copy(game / 'jack.qsp', 'game-checkpoint/jack.qsp', 'game-checkpoint')
        history = runtime / 'backups'
        if history.is_dir():
            for p in sorted(history.glob('*.json')):
                if linked(p) or not re.match(r'^\d', p.name):
                    continue
                record = read_json(p)
                target = record.get('target')
                pairs = replacements + ([(target, '@GAME@/jack.qsp')] if isinstance(target, str) else [])
                record = portable(record, pairs)
                put('records/dialogue/' + p.name, json_bytes(record), 'records')
                if isinstance(record.get('mod'), dict):
                    put('records/dialogue-mods/' + p.name, json_bytes(record['mod']), 'records')
        history_file = runtime / 'history.jsonl'
        if history_file.is_file():
            records = [portable(json.loads(x), replacements) for x in history_file.read_text('utf-8-sig').splitlines() if x.strip()]
            put('records/dialogue-history.jsonl', b''.join(json_bytes(x).replace(b'\n', b'') + b'\n' for x in records), 'records')
        for folder in ('cut-mods', 'original-cut-history', 'cut-history'):
            for p, rel in tree(runtime / folder):
                if p.suffix.lower() != '.json':
                    continue
                record = read_json(p)
                target = record.get('target') if isinstance(record, dict) else None
                pairs = replacements + ([(target, '@GAME@/jack.qsp')] if isinstance(target, str) else [])
                put('records/' + folder + '/' + rel, json_bytes(portable(record, pairs)), 'records')
        inputs = backup_inputs(history)
        if inputs:
            zip_rel, members_rel = 'records/dialogue-backups.zip', 'records/dialogue-backups.json'
            old_zip, old_members = destination / zip_rel, destination / members_rel
            reusable = bool(previous and previous.get('dialogueBackupInputs') == inputs
                            and old_zip.is_file() and old_members.is_file()
                            and sha_file(old_zip) == known.get(zip_rel)
                            and sha_file(old_members) == known.get(members_rel))
            if reusable:
                copy(old_zip, zip_rel, 'records')
                copy(old_members, members_rel, 'records')
            else:
                archive_path = stage / 'dialogue-backups.zip'
                member_manifest = archive_backups(history, archive_path, inputs)
                copy(archive_path, zip_rel, 'records')
                put(members_rel, json_bytes(member_manifest), 'records')
        put('tools/local-workspace/.jo9-tool-version.json', json_bytes(version_stamp(repo, export_id, created)), 'tools')
        for name, script in (('Start-JO9.cmd', 'Start-Shared-JO9.ps1'),
                             ('Save-JO9.cmd', 'Save-Shared-JO9.ps1'),
                             ('Restore-JO9.cmd', 'Restore-JO9-Work.ps1')):
            options = ' -IncludeGameCheckpoint' if name == 'Restore-JO9.cmd' else ''
            command = '@echo off\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\\local-workspace\\' + script + '" -WorkspaceRoot "%~dp0."' + options + '\r\nexit /b %errorlevel%\r\n'
            put(name, command.encode('ascii'), 'tools')
        # Validate all planned writes before changing anything in JO9WORK.
        no_links(destination / 'versions')
        if (destination / 'versions').exists() and not (destination / 'versions').is_dir():
            raise ValueError('Destination collision: versions')
        existing = {}
        for rel, entry in planned.items():
            target = destination / rel
            no_links(target)
            if target.exists():
                if not target.is_file():
                    raise ValueError('Destination collision: ' + rel)
                current = sha_file(target)
                existing[rel] = current
                if current != entry['sha256'] and current != known.get(rel):
                    raise ValueError('User-modified or unmanaged destination collision: ' + rel)
        counts = {}
        for entry in planned.values():
            counts[entry['category']] = counts.get(entry['category'], 0) + 1
        manifest = {'format': 'jo9-shared-work', 'version': 1, 'exportId': export_id,
                    'workspaceId': workspace_id,
                    'createdAt': created.isoformat(), 'catalogSnapshot': catalog_snapshot,
                    'dialogueBackupInputs': inputs,
                    'omittedRetiredImages': omitted_retired,
                    'files': sorted(planned.values(), key=lambda f: f['path']), 'counts': counts,
                    'gameCheckpoint': {'path': 'game-checkpoint/jack.qsp', 'sha256': planned['game-checkpoint/jack.qsp']['sha256']},
                    'policy': {'unmanagedFilesDeleted': False, 'apiKeysIncluded': False,
                               'vanillaImagesIncluded': False, 'allGirlPackIncluded': False}}
        destination.mkdir(parents=True, exist_ok=True)
        for rel, entry in planned.items():
            target = destination / rel
            current = sha_file(target) if target.is_file() else None
            if current != existing.get(rel):
                raise ValueError('Destination changed after preflight: ' + rel)
            if current == entry['sha256']:
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            temporary_target = target.with_name(target.name + '.jo9-tmp-' + export_id)
            try:
                shutil.copyfile(sources.get(rel, stage / rel), temporary_target)
                if sha_file(temporary_target) != entry['sha256']:
                    raise ValueError('Destination copy checksum failed: ' + rel)
                os.replace(temporary_target, target)
            finally:
                temporary_target.unlink(missing_ok=True)
        data = json_bytes(manifest)
        versions = destination / 'versions'
        versions.mkdir(exist_ok=True)
        no_links(versions)
        version_file = versions / (export_id + '.json')
        version_file.write_bytes(data)
        manifest_temp = destination / ('.manifest-' + export_id + '.tmp')
        manifest_temp.write_bytes(data)
        os.replace(manifest_temp, previous_file)
        return manifest

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ('repo', 'game', 'catalog', 'runtime', 'destination'):
        parser.add_argument('--' + key, required=True)
    parser.add_argument('--original')
    args = parser.parse_args()
    result = export(**vars(args))
    print(json.dumps({k: result[k] for k in ('exportId', 'catalogSnapshot', 'counts')}, ensure_ascii=False))

if __name__ == '__main__':
    main()
