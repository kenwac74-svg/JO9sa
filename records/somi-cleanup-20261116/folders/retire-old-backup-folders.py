"""Retire five audited inactive backup/archive roots without following junctions."""
import sys
sys.dont_write_bytecode = True
import importlib.util
import json
import os
import shutil
import stat
import time
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('checked', HERE.parent / 'somi-cleanup-20261116/phase3/archive_checked.py')
checked = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checked)
SOURCE = Path('G:/somi')
NAMES = ['JO9_work_backups/catfight-left-panel-20261031', 'JO9_work_backups/varbase-repair-20261021', 'JO9_work_backups/indie_update_20261018_210754631', 'JO9_cleanup_history_20261020', 'JO9_unused_images']
LINKS = {f'JO9_work_backups/indie_update_20261018_210754631/{part}/content' for part in ['targeted-engine', 'targeted-engine-native']}
TARGET = Path('G:/somi/Jack O Nine Tails v2.4_work/game/content')

def inventory():
    files, directories, links = [], [], []
    def visit(path):
        checked.no_links(path)
        directories.append(str(path))
        with os.scandir(path) as entries:
            for entry in entries:
                item = Path(entry.path)
                info = entry.stat(follow_symlinks=False)
                relative = item.relative_to(SOURCE).as_posix()
                if entry.is_symlink() or getattr(info, 'st_file_attributes', 0) & checked.REPARSE:
                    assert relative in LINKS and item.is_junction(), str(item)
                    assert item.resolve() == TARGET.resolve(), str(item)
                    links.append({'relative': relative, 'target': os.readlink(item)})
                elif entry.is_dir(follow_symlinks=False):
                    visit(item)
                else:
                    assert entry.is_file(follow_symlinks=False), str(item)
                    files.append({'relative': relative, **checked.fingerprint(item)})
    for name in NAMES:
        path = SOURCE / name
        assert checked.inside(path, SOURCE) and path != SOURCE
        visit(path)
    assert {row['relative'] for row in links} == LINKS
    return files, directories, links

def prepare():
    files, directories, links = inventory()
    assert len(files) == 4083 and sum(row['bytes'] for row in files) == 509730056, 'Audit changed; review before applying'
    batch = Path('K:/doing/JO9_trash') / (datetime.now().strftime('%Y-%m-%d_%H%M%S') + '_somi_old_backup_folders')
    plan = {'source': str(SOURCE), 'archive': str(batch), 'roots': NAMES, 'files': files, 'directories': directories, 'junctions': links, 'fileCount': len(files), 'bytes': sum(row['bytes'] for row in files)}
    checked.write_json(HERE / 'remaining-move-plan.json', plan)
    print(json.dumps({k: plan[k] for k in ['archive', 'fileCount', 'bytes', 'roots']}, ensure_ascii=False))

def apply():
    plan = checked.read_json(HERE / 'remaining-move-plan.json')
    assert plan['source'] == str(SOURCE) and plan['roots'] == NAMES
    files, directories, links = inventory()
    assert sorted(files, key=lambda x:x['relative']) == sorted(plan['files'], key=lambda x:x['relative'])
    assert set(directories) == set(plan['directories']) and links == plan['junctions']
    batch = Path(plan['archive'])
    assert batch.parent == Path('K:/doing/JO9_trash') and not batch.exists()
    checked.no_links(batch)
    assert shutil.disk_usage(batch.parent).free > plan['bytes'] + 1024**3
    target_identity = (TARGET.stat().st_dev, TARGET.stat().st_ino)
    batch.mkdir()
    checked.write_json(batch / 'move-plan.json', plan)
    (batch / 'README_KO.md').write_text('# 구백업·이전 보관 폴더\n\nfiles 아래에 G:/somi 상대경로 그대로 보관했습니다. 기존 세이브 복사본·원본 이미지·JSON·복구 스크립트와 원장도 보존했습니다.\n\n기존 복원 스크립트와 plan/journal에는 G 절대경로가 있습니다. 그 스크립트로 복원할 때는 이 묶음을 먼저 원래 G 경로에 복원하거나 경로 매핑을 검토해야 합니다. 기존 파일을 무조건 덮어쓰지 마십시오.\n\n진단용 content 정션 2개는 대상 데이터를 복사하거나 삭제하지 않았습니다. 원래 링크 경로와 대상은 move-plan.json의 junctions에 기록했습니다.\n', encoding='utf-8')
    moved, size, removed, last = [], 0, [], time.monotonic()
    try:
        with (batch / 'journal.jsonl').open('x', encoding='utf-8', buffering=1) as journal:
            for row in plan['files']:
                source, destination = SOURCE / row['relative'], batch / 'files' / row['relative']
                assert checked.inside(source, SOURCE) and checked.inside(destination, batch / 'files')
                def log(event, **fields):
                    journal.write(json.dumps({'event': event, 'relative': row['relative'], 'bytes': row['bytes'], **fields}, ensure_ascii=False) + '\n')
                checked.transfer_file(source, destination, {key: row[key] for key in ['bytes','mtime_ns','ino','dev']}, log)
                moved.append(row['relative'])
                size += row['bytes']
                if time.monotonic() - last > 5:
                    checked.write_json(batch / 'status.json', {'status': 'running', 'movedFiles': len(moved), 'movedBytes': size, 'totalFiles': plan['fileCount']})
                    print(f'Archived {len(moved)}/{plan["fileCount"]} files', flush=True)
                    last = time.monotonic()
        for row in plan['junctions']:
            link = SOURCE / row['relative']
            assert row['relative'] in LINKS and link.is_junction() and os.readlink(link) == row['target']
            assert link.resolve() == TARGET.resolve()
            os.rmdir(link)  # Remove only the junction itself, never its target.
            assert not os.path.lexists(link)
            assert (TARGET.stat().st_dev, TARGET.stat().st_ino) == target_identity
        for value in sorted(plan['directories'], key=lambda x:len(Path(x).parts), reverse=True):
            path = Path(value)
            assert any(checked.inside(path, SOURCE / name) for name in NAMES)
            checked.no_links(path)
            path.rmdir()  # Fails safely if any unplanned content remains.
            removed.append(value)
        assert all(not (SOURCE / name).exists() for name in NAMES)
        assert TARGET.is_dir() and (TARGET.stat().st_dev, TARGET.stat().st_ino) == target_identity
        result = {'status': 'complete', 'archive': str(batch), 'movedFiles': len(moved), 'movedBytes': size, 'removedDirectories': removed, 'removedJunctions': plan['junctions'], 'activeContentTargetPreserved': True}
        checked.write_json(batch / 'status.json', result)
        checked.write_json(HERE / 'remaining-deletion.json', result)
        print(json.dumps({k:v for k,v in result.items() if k not in ['removedDirectories','removedJunctions']} | {'directoryCount': len(removed), 'junctionCount': len(links)}, ensure_ascii=False))
    except BaseException as error:
        checked.write_json(batch / 'status.json', {'status': 'error', 'movedFiles': len(moved), 'movedBytes': size, 'error': str(error)})
        raise

if __name__ == '__main__':
    {'prepare': prepare, 'apply': apply}[sys.argv[1]]()
