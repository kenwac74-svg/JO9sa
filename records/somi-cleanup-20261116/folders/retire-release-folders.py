"""Archive audited retired release folders, keeping their browsable guides."""
import sys
sys.dont_write_bytecode = True
import importlib.util
import json
import os
import shutil
import urllib.request
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('archive_checked', HERE.parent / 'somi-cleanup-20261116/phase3/archive_checked.py')
archive = importlib.util.module_from_spec(spec)
spec.loader.exec_module(archive)
SOURCE = Path('G:/somi')
KEEP = SOURCE / 'JO9sa/records/retired-release-guides-20261116'
CATALOG = 'http://127.0.0.1:7689/workspace/artifacts?refresh=1'

def catalog():
    with urllib.request.urlopen(CATALOG, timeout=30) as response:
        return json.load(response)

def main():
    audit = archive.read_json(HERE / 'retired-folders.json')
    rows = audit['files']
    roots = [SOURCE / item['name'] for item in audit['folders']]
    assert len(roots) == 7 and len(rows) == 104
    for root in roots:
        assert root.parent == SOURCE and root.name.startswith('JO9_2.4.')
        archive.no_links(root)
    current = {p.relative_to(SOURCE).as_posix() for root in roots for p in archive.walk_files(root)}
    assert current == {r['relative'] for r in rows}, 'Source inventory changed'
    for row in rows:
        source = SOURCE / row['relative']
        assert archive.inside(source, SOURCE) and source.stat().st_size == row['bytes']
        assert archive.digest_file(source) == row['sha256'], str(source)
        row['fingerprint'] = archive.fingerprint(source)
    before = catalog()
    archive.write_json(HERE / 'catalog-before.json', before)
    archive.no_links(KEEP)
    paths = set(audit['minimalCatalogPreservation']['relativePaths'])
    preserved = []
    for row in rows:
        if row['relative'] not in paths:
            continue
        source, destination = SOURCE / row['relative'], KEEP / row['relative']
        assert archive.inside(destination, KEEP)
        archive.no_links(destination)
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.exists():
            with source.open('rb') as src, destination.open('xb') as dst:
                shutil.copyfileobj(src, dst)
            shutil.copystat(source, destination)
        assert archive.digest_file(destination) == row['sha256']
        preserved.append(str(destination))
    assert len(preserved) == 82
    archive.write_json(HERE / 'catalog-preservation.json', {'files': preserved, 'bytes': sum(r['bytes'] for r in rows if r['relative'] in paths)})
    refreshed = catalog()
    expected_html = {row['sha256'] for row in rows if row['relative'].lower().endswith('.html') and any(h['relative'] == row['relative'] and h['registeredNow'] for h in audit['html'])}
    available_html = {archive.digest_file(Path(item['path'])) for item in refreshed['items']}
    assert expected_html <= available_html, 'Preserved catalogue content missing'
    batch = Path('K:/doing/JO9_trash') / (datetime.now().strftime('%Y-%m-%d_%H%M%S') + '_somi_retired_folders')
    archive.no_links(batch)
    batch.mkdir()
    archive.write_json(batch / 'move-plan.json', {'source': str(SOURCE), 'roots': [str(p) for p in roots], 'files': rows, 'preservedGuideRoot': str(KEEP)})
    (batch / 'README_KO.md').write_text('# 옛 배포 폴더 보관\n\nfiles 아래에 G:/somi 기준 원래 경로를 보존했습니다. 복원 시 기존 파일을 덮어쓰지 말고 먼저 비교하십시오. 안내문과 공지 이미지 82개는 JO9sa/records/retired-release-guides-20261116에도 보존했습니다.\n', encoding='utf-8')
    moved = []
    removed = []
    try:
        with (batch / 'journal.jsonl').open('x', encoding='utf-8', buffering=1) as journal:
            for row in rows:
                source, target = SOURCE / row['relative'], batch / 'files' / row['relative']
                def log(event, **fields):
                    journal.write(json.dumps({'event': event, 'relative': row['relative'], **fields}, ensure_ascii=False) + '\n')
                value = archive.transfer_file(source, target, row['fingerprint'], log)
                assert value == row['sha256']
                moved.append(row['relative'])
        # Only remove actually empty directories; never recurse through links.
        for root in roots:
            for parent, dirs, files in os.walk(root, topdown=False, followlinks=False):
                path = Path(parent)
                assert archive.inside(path, root)
                archive.no_links(path)
                path.rmdir()
                removed.append(str(path))
        after = catalog()
        archive.write_json(HERE / 'catalog-after.json', after)
        available_html = {archive.digest_file(Path(item['path'])) for item in after['items']}
        assert expected_html <= available_html, expected_html - available_html
        for item in after['items']:
            assert not any(archive.inside(Path(item['path']), root) for root in roots)
        assert all(not root.exists() for root in roots)
        result = {'status': 'complete', 'archive': str(batch), 'movedFiles': len(moved), 'movedBytes': sum(r['bytes'] for r in rows), 'removedDirectories': removed, 'preservedGuides': len(preserved), 'catalogContentRetained': len(expected_html)}
        archive.write_json(batch / 'status.json', result)
        archive.write_json(HERE / 'retired-deletion.json', result)
        print(json.dumps(result, ensure_ascii=False))
    except BaseException as error:
        archive.write_json(batch / 'status.json', {'status': 'error', 'movedFiles': len(moved), 'error': str(error)})
        raise

if __name__ == '__main__':
    main()
