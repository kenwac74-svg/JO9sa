import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest import mock
import zipfile

spec = importlib.util.spec_from_file_location('export_shared_work', Path(__file__).with_name('export-shared-work.py'))
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)

class ExportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.repo = self.root / 'repo'
        self.game = self.root / 'game'
        self.catalog = self.root / 'catalog'
        self.runtime = self.root / 'runtime'
        self.dest = self.root / 'JO9WORK'
        real_sync = Path(__file__).with_name('sync-workspace-state.py')
        p = self.repo / 'tools/local-workspace/sync-workspace-state.py'
        p.parent.mkdir(parents=True)
        shutil.copyfile(real_sync, p)
        self.write(self.repo, 'tools/test.js', 'safe tool')
        self.write(self.repo, 'tools/local-workspace/local.config.json', '{"privatePCPath":"SECRET_PATH"}')
        self.write(self.repo, 'tools/local-workspace/runtime/api-key.json', '{"api_key":"DO_NOT_EXPORT"}')
        self.write(self.repo, 'docs/modding/handoff.md', 'instruction')
        self.write(self.repo, 'mods/change.json', '{"id":"change","edits":[]}')
        self.write(self.repo, 'records/imports/history.json', '{"status":"applied"}')
        self.write(self.repo, 'resources/new/user.png', b'personal icon')
        self.write(self.repo, 'resources/originals/stock.png', b'vanilla not allowed')
        self.write(self.game, 'jack.qsp', b'latest game')
        self.write(self.game, 'content/pic/bg/personal.png', b'new image')
        self.write(self.game, 'content/pic/bg/stock.png', b'original stock')
        self.write(self.game, 'content/pic/ai_girl_pack/third-party.png', b'third-party')
        self.write(self.game, 'content/modworkpic/draft.png', b'draft')
        self.write(self.game, 'content/pic/reserve/jo9mod/b/draft.png', b'B option')
        self.write(self.game, 'modtools/config.json', '{"version":1,"server":{"idleTimeoutSeconds":90}}')
        self.write(self.game, 'modtools/filters.json', '{"hiddenFolders":["ui","buttons"]}')
        self.write(self.game, 'modtools/image-original-cuts.json', json.dumps({'sourceRoot': str(self.root / 'original/content/pic'), 'originals': {'bg/a.png': {'path': 'bg/a.png'}}}))
        self.write(self.game, 'mods/installed.json', '{"description":"installed mod","edits":[]}')
        self.write(self.catalog, 'catalog_merge_vs_original.html', 'var D=[["content\\\\pic\\\\bg\\\\personal.png"]];\nvar MR="old", OR="old";\n')
        self.write(self.catalog, 'catalog_status.js', 'window.CATALOG_STATUS={"items":{"bg-0001":"done"},"savedAt":1};\n')
        for name in exporter.CATALOG_UI:
            self.write(self.catalog, name, '// portable catalog UI ' + name)
        self.write(self.catalog, 'catalog_workshop_config.js', 'window.CONFIG={token:"DO_NOT_EXPORT"};')
        self.write(self.catalog, 'catalog_work_codes.js', 'window.DERIVED_CODES={};')
        self.write(self.catalog, 'catalog_work_ids.json', '{"items":{"bg/personal.png":"bg-0001"},"counters":{"bg":1}}')
        progress = {'roots': {'game': str(self.game), 'original': str(self.root / 'original'), 'merge': str(self.game)}, 'catalog': str(self.catalog / 'catalog_merge_vs_original.html'), 'items': []}
        self.write(self.catalog, 'image_work/progress.json', json.dumps(progress))
        self.write(self.catalog, 'image_work/history.jsonl', '{"event":"done"}\n')
        self.write(self.catalog, 'image_work/bg_queue.json', '[]')
        self.write(self.catalog, 'image_work/personal-patch/settings.json', json.dumps({'game': str(self.game), 'catalogRoot': str(self.catalog)}))
        event = {'created': '2026-10-09T01:00:00Z', 'key': 'one', 'operation': 'replace', 'files': [{'path': 'bg/personal.png', 'after': hashlib.sha256(b'new image').hexdigest()}]}
        self.write(self.catalog, 'image_work/personal-patch/events.jsonl', json.dumps(event) + '\n')
        self.write(self.runtime, 'grok-settings.json', '{"provider":"openrouter","model":"grok","apiKey":"DO_NOT_EXPORT","encryptedKey":"DPAPI_PRIVATE"}')
        self.write(self.runtime, 'backups/2026-record.json', json.dumps({'target': str(self.game / 'jack.qsp'), 'mod': {'id': 'edited'}, 'status': 'applied'}))
        self.write(self.runtime, 'backups/2026-record.qsp', b'huge obsolete qsp')
        self.write(self.runtime, 'server.json', '{"token":"DO_NOT_EXPORT"}')
        self.write(self.runtime, 'cut-mods/one/change.json', '{"id":"cut-edit","edits":[]}')
        self.write(self.runtime, 'cut-mods/one/jack.qsp', b'not a dialogue history backup')
        self.write(self.runtime, 'original-cut-history/one/manifest.json', '{"originals":{}}')
        self.write(self.runtime, 'original-cut-history/one/no-previous-marker', 'marker is not a JSON record')
        self.write(self.runtime, 'cut-history/one.json', '{"id":"cut-selection","status":"applied"}')

    @staticmethod
    def write(root, relative, data):
        p = root / relative
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data if isinstance(data, bytes) else data.encode('utf-8'))
        return p

    def run_export(self):
        return exporter.export(self.repo, self.game, self.catalog, self.runtime, self.dest)

    def test_complete_portable_snapshot_and_manifest(self):
        result = self.run_export()
        names = {f['path'] for f in result['files']}
        self.assertIn('personal-images/content/pic/bg/personal.png', names)
        self.assertIn('working-images/content/modworkpic/draft.png', names)
        self.assertIn('working-images/content/pic/reserve/jo9mod/b/draft.png', names)
        self.assertIn('records/dialogue/2026-record.json', names)
        self.assertIn('records/dialogue-mods/2026-record.json', names)
        self.assertIn('records/dialogue-backups.zip', names)
        self.assertIn('records/dialogue-backups.json', names)
        self.assertIn('records/imports/history.json', names)
        self.assertIn('tools/local-workspace/.jo9-tool-version.json', names)
        self.assertIn('preferences/workshop/config.json', names)
        self.assertIn('preferences/workshop/filters.json', names)
        self.assertIn('game-metadata/modtools/image-original-cuts.json', names)
        self.assertIn('game-metadata/mods/installed.json', names)
        self.assertIn('records/cut-mods/one/change.json', names)
        self.assertIn('records/original-cut-history/one/manifest.json', names)
        self.assertIn('records/cut-history/one.json', names)
        for name in exporter.CATALOG_UI:
            self.assertIn('catalog/' + name, names)
        self.assertNotIn('catalog/catalog_workshop_config.js', names)
        self.assertNotIn('catalog/catalog_work_codes.js', names)
        for name in ('Start-JO9.cmd', 'Save-JO9.cmd', 'Restore-JO9.cmd'):
            self.assertIn(name, names)
            self.assertIn('%~dp0tools', (self.dest / name).read_text('ascii'))
        self.assertIn('-IncludeGameCheckpoint', (self.dest / 'Restore-JO9.cmd').read_text('ascii'))
        self.assertNotIn('-IncludeGameCheckpoint', (self.dest / 'Start-JO9.cmd').read_text('ascii'))
        self.assertFalse(any('local.config' in name or '/runtime/' in name or 'third-party' in name or '/originals/' in name or name.endswith('record.qsp') for name in names))
        for file in result['files']:
            self.assertEqual(exporter.sha_file(self.dest / file['path']), file['sha256'])
        prefs = (self.dest / 'preferences/grok-settings.json').read_text('utf-8')
        self.assertNotIn('DO_NOT_EXPORT', prefs)
        self.assertNotIn('DPAPI_PRIVATE', prefs)
        self.assertEqual(json.loads(prefs), {'provider': 'openrouter', 'model': 'grok'})
        seed = (self.dest / 'catalog/image_work/progress.json').read_text('utf-8')
        self.assertIn('@GAME@', seed)
        self.assertNotIn(str(self.game), seed)

    def test_ledger_mismatch_refuses_without_destination_mutation(self):
        self.write(self.dest, 'user-note.txt', 'keep me')
        self.write(self.game, 'content/pic/bg/personal.png', b'not adopted')
        with self.assertRaisesRegex(ValueError, 'adopted ledger hash'):
            self.run_export()
        self.assertEqual(sorted(p.name for p in self.dest.iterdir()), ['user-note.txt'])

    def test_user_changes_are_preserved_and_updates_are_versioned(self):
        first = self.run_export()
        self.write(self.dest, 'my-extra-image.png', b'my extra')
        self.write(self.dest, 'tools/test.js', 'user customized tool')
        self.write(self.repo, 'tools/test.js', 'new source tool')
        manifest_before = (self.dest / 'manifest.json').read_bytes()
        with self.assertRaisesRegex(ValueError, 'User-modified'):
            self.run_export()
        self.assertEqual((self.dest / 'tools/test.js').read_text('utf-8'), 'user customized tool')
        self.assertEqual((self.dest / 'manifest.json').read_bytes(), manifest_before)
        self.write(self.dest, 'tools/test.js', 'safe tool')
        second = self.run_export()
        self.assertNotEqual(first['exportId'], second['exportId'])
        self.assertEqual(first['workspaceId'], second['workspaceId'])
        self.assertEqual((self.dest / 'tools/test.js').read_text('utf-8'), 'new source tool')
        self.assertEqual(len(list((self.dest / 'versions').glob('*.json'))), 2)
        self.assertEqual((self.dest / 'my-extra-image.png').read_bytes(), b'my extra')

    def test_active_shared_catalog_is_not_overwritten(self):
        self.dest.mkdir()
        shutil.copytree(self.catalog, self.dest / 'catalog')
        self.catalog = self.dest / 'catalog'
        before = {p.relative_to(self.catalog).as_posix(): p.read_bytes() for p in self.catalog.rglob('*') if p.is_file()}
        result = self.run_export()
        self.assertEqual(result['catalogSnapshot'], 'catalog-snapshot')
        after = {p.relative_to(self.catalog).as_posix(): p.read_bytes() for p in self.catalog.rglob('*') if p.is_file()}
        self.assertEqual(before, after)
        self.assertTrue((self.dest / 'catalog-snapshot/catalog_status.js').is_file())

    def test_restore_of_original_is_not_personal(self):
        ledger = self.catalog / 'image_work/personal-patch/events.jsonl'
        event = {'created': '2026-10-09T02:00:00Z', 'key': 'two', 'operation': 'restore', 'files': [{'path': 'bg/personal.png', 'after': hashlib.sha256(b'original stock').hexdigest()}]}
        with ledger.open('a', encoding='utf-8') as file:
            file.write(json.dumps(event) + '\n')
        result = self.run_export()
        self.assertNotIn('personal-images', result['counts'])

    def test_unsafe_ledger_path_is_rejected(self):
        ledger = self.catalog / 'image_work/personal-patch/events.jsonl'
        event = json.loads(ledger.read_text('utf-8'))
        event['files'][0]['path'] = '../original.png'
        ledger.write_text(json.dumps(event), encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'Unsafe package path'):
            self.run_export()
        self.assertFalse(self.dest.exists())

    def test_shared_workspace_can_export_its_own_tools(self):
        first = self.run_export()
        self.repo = self.dest
        second = self.run_export()
        self.assertEqual(first['workspaceId'], second['workspaceId'])
        self.assertEqual(first['files'], second['files'])

    def test_unchanged_images_are_not_copied_again(self):
        self.run_export()
        with mock.patch.object(exporter.shutil, 'copyfile', wraps=shutil.copyfile) as copied:
            self.run_export()
        image_copies = [call for call in copied.call_args_list
                        if Path(call.args[0]).suffix.lower() in {'.png', '.jpg'}]
        self.assertEqual(image_copies, [])

    def test_ledger_order_uses_timestamp_timezones(self):
        ledger = self.catalog / 'image_work/personal-patch/events.jsonl'
        earlier = {'created': '2026-10-09T09:00:00+09:00', 'key': 'earlier', 'operation': 'replace', 'files': [{'path': 'bg/personal.png', 'after': 'a' * 64}]}
        later = {'created': '2026-10-09T01:00:00Z', 'key': 'later', 'operation': 'restore', 'files': [{'path': 'bg/personal.png', 'after': 'b' * 64}]}
        ledger.write_text(json.dumps(later) + '\n' + json.dumps(earlier) + '\n', encoding='utf-8')
        self.assertEqual(exporter.selected_images(ledger), {})

    def test_qsp_rollback_history_is_compressed_and_unchanged_zip_reused(self):
        first = self.run_export()
        backups = read_members = exporter.read_json(self.dest / 'records/dialogue-backups.json')
        self.assertEqual(backups['format'], 'jo9-dialogue-backups')
        self.assertEqual(backups['files'][0]['path'], '2026-record.qsp')
        with zipfile.ZipFile(self.dest / 'records/dialogue-backups.zip') as archive:
            self.assertEqual(archive.namelist(), ['2026-record.qsp'])
            data = archive.read('2026-record.qsp')
            self.assertEqual(data, b'huge obsolete qsp')
            self.assertEqual(hashlib.sha256(data).hexdigest(), read_members['files'][0]['sha256'])
        with mock.patch.object(exporter, 'archive_backups', wraps=exporter.archive_backups) as compress:
            second = self.run_export()
        compress.assert_not_called()
        self.assertEqual(first['dialogueBackupInputs'], second['dialogueBackupInputs'])
        self.write(self.runtime, 'backups/2026-record.qsp', b'updated backup')
        with mock.patch.object(exporter, 'archive_backups', wraps=exporter.archive_backups) as compress:
            third = self.run_export()
        compress.assert_called_once()
        self.assertNotEqual(second['dialogueBackupInputs'], third['dialogueBackupInputs'])

    def test_backup_mutation_during_compression_is_refused(self):
        original = exporter.backup_inputs
        def changing(folder):
            result = original(folder)
            if result and getattr(changing, 'once', False):
                self.write(self.runtime, 'backups/2026-record.qsp', b'changed while compressing')
                return original(folder)
            changing.once = True
            return result
        with mock.patch.object(exporter, 'backup_inputs', side_effect=changing):
            with self.assertRaisesRegex(ValueError, 'backup set changed'):
                self.run_export()
        self.assertFalse(self.dest.exists())

if __name__ == '__main__':
    unittest.main()
