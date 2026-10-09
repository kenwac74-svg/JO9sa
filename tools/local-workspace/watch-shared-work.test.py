import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('watch_shared_work', Path(__file__).with_name('watch-shared-work.py'))
watcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watcher)

class WatchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        # Reproduce the portable package watching itself, not a Git checkout.
        self.repo = self.root / 'JO9WORK'
        self.catalog = self.repo / 'catalog'
        self.game = self.root / 'game'
        self.runtime = self.root / 'machine/editor'
        for path in (self.repo, self.catalog, self.game, self.runtime):
            path.mkdir(parents=True, exist_ok=True)
        self.put(self.game / 'jack.qsp', 'current game')
        self.put(self.repo / 'tools/test.js', 'tool source')
        self.put(self.repo / 'docs/guide.md', 'guide')
        self.put(self.repo / 'mods/edit.json', '{}')
        self.put(self.repo / 'records/imports/past.json', '{}')
        self.put(self.repo / 'resources/new/personal.png', 'icon')
        self.put(self.game / 'content/modworkpic/draft.png', 'draft')
        self.put(self.game / 'content/pic/reserve/jo9mod/B/draft.png', 'alternate')
        self.put(self.game / 'content/pic/bg/personal.png', 'adopted image')
        self.put(self.catalog / 'catalog_status.js', 'window.CATALOG_STATUS={};')
        self.put(self.runtime / 'grok-settings.json', '{"model":"grok","apiKey":"PRIVATE"}')
        self.put(self.runtime / 'dialogue-ai-settings.json', '{"model":"other"}')
        self.put(self.runtime / 'backups/2026-edit.json', '{"mod":{}}')
        self.put(self.runtime / 'backups/2026-edit.qsp', 'rollback game state')
        self.put(self.game / 'modtools/config.json', '{"version":1}')
        self.put(self.game / 'modtools/filters.json', '{"version":3}')
        self.put(self.game / 'modtools/image-original-cuts.json', '{"originals":{}}')
        self.put(self.game / 'mods/installed.json', '{"edits":[]}')
        self.put(self.runtime / 'cut-mods/one/change.json', '{"id":"cut"}')
        self.put(self.runtime / 'original-cut-history/one/manifest.json', '{"originals":{}}')
        self.put(self.runtime / 'cut-history/one.json', '{"id":"select-cut"}')
        event = {'created': '2026-10-09T01:00:00Z', 'key': 'first', 'operation': 'replace', 'files': [{'path': 'bg/personal.png', 'after': 'a' * 64}]}
        self.put(self.catalog / 'image_work/personal-patch/events.jsonl', json.dumps(event) + '\n')

    @staticmethod
    def put(path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(value, encoding='utf-8')

    def fingerprint(self):
        return watcher.fingerprint(self.repo, self.game, self.catalog, self.runtime)

    def test_required_work_changes_trigger_a_checkpoint(self):
        paths = [self.game / 'jack.qsp', self.repo / 'tools/test.js',
                 self.repo / 'docs/guide.md', self.repo / 'mods/edit.json',
                 self.repo / 'records/imports/past.json', self.repo / 'resources/new/personal.png',
                 self.game / 'content/modworkpic/draft.png',
                 self.game / 'content/pic/reserve/jo9mod/B/draft.png',
                 self.game / 'content/pic/bg/personal.png',
                 self.catalog / 'catalog_status.js', self.runtime / 'backups/2026-edit.json',
                 self.runtime / 'backups/2026-edit.qsp',
                 self.game / 'modtools/config.json', self.game / 'modtools/filters.json',
                 self.game / 'modtools/image-original-cuts.json', self.game / 'mods/installed.json',
                 self.runtime / 'cut-mods/one/change.json',
                 self.runtime / 'original-cut-history/one/manifest.json', self.runtime / 'cut-history/one.json',
                 self.runtime / 'grok-settings.json', self.runtime / 'dialogue-ai-settings.json']
        for path in paths:
            with self.subTest(path=path.name):
                before = self.fingerprint()
                self.put(path, path.read_text('utf-8') + ' changed')
                self.assertNotEqual(before, self.fingerprint())

    def test_export_output_and_machine_logs_do_not_retrigger_export(self):
        before = self.fingerprint()
        ignored = [self.repo / 'manifest.json', self.repo / 'versions/one.json',
                   self.repo / 'catalog-snapshot/catalog_status.js',
                   self.repo / 'personal-images/content/pic/bg/personal.png',
                   self.repo / 'working-images/content/modworkpic/draft.png',
                   self.repo / 'game-checkpoint/jack.qsp', self.repo / 'preferences/grok-settings.json',
                   self.repo / 'tools/local-workspace/local.config.json',
                   self.repo / 'tools/local-workspace/.jo9-tool-version.json',
                   self.runtime / 'server.json', self.runtime / 'shared-sync.json',
                   self.runtime / 'shared-sync-process.json', self.runtime / 'server.log',
                   self.runtime / 'backups/old-not-a-history.qsp', self.repo / '.git/config']
        for path in ignored:
            self.put(path, 'runtime/private/output data')
        self.assertEqual(before, self.fingerprint())

    def test_new_history_and_new_work_files_trigger_a_checkpoint(self):
        for path in (self.runtime / 'backups/2026-new.json',
                     self.game / 'content/modworkpic/new.png',
                     self.game / 'content/pic/reserve/jo9mod/new.png',
                     self.repo / 'records/imports/new.json'):
            before = self.fingerprint()
            self.put(path, 'new work')
            self.assertNotEqual(before, self.fingerprint())
        before = self.fingerprint()
        path.unlink()
        self.assertNotEqual(before, self.fingerprint())

    def test_nonexported_third_party_and_original_resources_are_ignored(self):
        before = self.fingerprint()
        for path in (self.repo / 'resources/originals/stock.png',
                     self.repo / 'resources/pending/unowned.png',
                     self.game / 'content/pic/ai_girl_pack/stock.png',
                     self.game / 'content/pic/bg/unused-stock.png'):
            self.put(path, 'not owned/exported')
        self.assertEqual(before, self.fingerprint())

    def test_restored_nonpersonal_image_is_no_longer_watched(self):
        ledger = self.catalog / 'image_work/personal-patch/events.jsonl'
        event = {'created': '2026-10-09T02:00:00Z', 'key': 'second', 'operation': 'restore', 'files': [{'path': 'bg/personal.png', 'after': 'b' * 64}]}
        with ledger.open('a', encoding='utf-8') as file:
            file.write(json.dumps(event) + '\n')
        before = self.fingerprint()
        self.put(self.game / 'content/pic/bg/personal.png', 'restored original changes')
        self.assertEqual(before, self.fingerprint())

    def test_ledger_timestamps_are_compared_with_timezones(self):
        ledger = self.catalog / 'image_work/personal-patch/events.jsonl'
        earlier = {'created': '2026-10-09T09:00:00+09:00', 'key': 'earlier', 'operation': 'replace', 'files': [{'path': 'bg/personal.png', 'after': 'a' * 64}]}
        later = {'created': '2026-10-09T01:00:00Z', 'key': 'later', 'operation': 'restore', 'files': [{'path': 'bg/personal.png', 'after': 'b' * 64}]}
        ledger.write_text(json.dumps(later) + '\n' + json.dumps(earlier) + '\n', encoding='utf-8')
        before = self.fingerprint()
        self.put(self.game / 'content/pic/bg/personal.png', 'restored original changed')
        self.assertEqual(before, self.fingerprint())

    def test_linked_subtree_is_ignored(self):
        outside = self.root / 'outside'
        outside.mkdir()
        self.put(outside / 'secret.txt', 'private outside tree')
        link = self.repo / 'tools/outside'
        before = self.fingerprint()
        try:
            link.symlink_to(outside, target_is_directory=True)
        except OSError as error:
            self.skipTest('System does not permit fixture symlinks: ' + str(error))
        self.assertEqual(before, self.fingerprint())
        self.put(outside / 'secret.txt', 'private outside tree changed')
        self.assertEqual(before, self.fingerprint())

if __name__ == '__main__':
    unittest.main()
