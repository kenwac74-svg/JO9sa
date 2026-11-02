import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('sync_game', Path(__file__).with_name('sync-game.py'))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)
sha = lambda b: hashlib.sha256(b).hexdigest()


class HandoffSafety(unittest.TestCase):
    def setUp(self):
        self.test_root = Path(__file__).resolve().parents[2] / 'tmp/json-ko-sync-tests'
        self.test_root.mkdir(parents=True, exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(prefix='jo9-ko-sync-', dir=self.test_root)
        self.base = Path(self.temp.name)
        self.repo, self.game = self.base / 'repo', self.base / 'game'
        self.repo.mkdir(); self.game.mkdir()
        (self.game / 'jack.qsp').write_bytes(b'original')
        source = self.repo / 'assets/runtime/2.4.1/jack.qsp'
        source.parent.mkdir(parents=True); source.write_bytes(b'translated')
        self.manifest = {'files': [{'game_path': 'jack.qsp', 'source': 'assets/runtime/2.4.1/jack.qsp',
                                   'before_sha256': [sha(b'original')], 'after_sha256': sha(b'translated')}]}

    def tearDown(self):
        self.assertTrue(self.base.resolve().is_relative_to(self.test_root.resolve()))
        self.temp.cleanup()

    def test_known_base_applies_and_second_run_is_current(self):
        rows = sync.prepare(self.repo, self.game, self.manifest)
        self.assertFalse(rows[0]['ready'])
        self.assertEqual((self.game / 'jack.qsp').read_bytes(), b'original')
        sync.apply(rows)
        self.assertEqual((self.game / 'jack.qsp').read_bytes(), b'translated')
        self.assertTrue(sync.prepare(self.repo, self.game, self.manifest)[0]['ready'])

    def test_manual_target_change_is_preserved(self):
        (self.game / 'jack.qsp').write_bytes(b'player modification')
        with self.assertRaises(ValueError):
            sync.prepare(self.repo, self.game, self.manifest)
        self.assertEqual((self.game / 'jack.qsp').read_bytes(), b'player modification')

    def test_change_after_preflight_is_not_overwritten(self):
        rows = sync.prepare(self.repo, self.game, self.manifest)
        (self.game / 'jack.qsp').write_bytes(b'concurrent edit')
        with self.assertRaises(ValueError):
            sync.apply(rows)
        self.assertEqual((self.game / 'jack.qsp').read_bytes(), b'concurrent edit')

    def test_escape_path_is_rejected(self):
        self.manifest['files'][0]['game_path'] = '../outside.qsp'
        with self.assertRaises(ValueError):
            sync.prepare(self.repo, self.game, self.manifest)


if __name__ == '__main__':
    unittest.main()
