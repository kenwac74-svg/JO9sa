import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
LIVE = Path('G:/somi/JO9sa/tools/modding-hub')
sys.path[:0] = [str(HERE), str(LIVE)]
import master_editor


class BackgroundTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue((HERE / 'background_metadata.py').is_file(), 'canonical background persistence is missing')
        spec = importlib.util.spec_from_file_location('background_metadata', HERE / 'background_metadata.py')
        self.bg = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.bg)
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'json/slaves').mkdir(parents=True)
        self.path = self.root / 'json/slaves/3100_unique.json'
        self.original = {'seed_name': 'Unique', 'seed_stamina': 9, 'seed_tongue_loss': 1,
                         'seed_world_description': 'Manual world lore', 'seed_family_description': 'Manual family lore',
                         'seed_occupation_description': 'Manual career lore', 'custom_manual': {'keep': True}}
        self.path.write_text(json.dumps(self.original), encoding='utf-8')
        self.editor = master_editor.MasterEditor(self.root)

    def files(self):
        return {p.relative_to(self.root).as_posix(): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}

    def save(self, background, **extra):
        return self.bg.save_slave_talkbook(self.editor, 3100,
            {'revision': self.editor.slave_revision(3100), 'applyBackground': True,
             'book': {'background': background, 'lines': {'discard': 'unsaved UI line'}}, **extra}, lambda _v: None)

    def test_explicit_save_changes_only_metadata_and_keeps_saved_dialogue(self):
        talk = self.root / 'jo9_talkbook/3100.json'
        talk.parent.mkdir()
        talk.write_text(json.dumps({'background': {'world': 'industrial'}, 'lines': {'hello': 'Saved line'}, 'notes': 'Keep'}), 'utf-8')
        before = self.path.read_bytes()
        result = self.save({'world': 'earth_rome', 'family': 'ancient_citizen', 'occupation': 'courtesan'})
        current = json.loads(self.path.read_text('utf-8'))
        self.assertEqual(current, {**self.original, 'seed_world': 'earth_rome', 'seed_family': 'ancient_citizen',
                                  'seed_occupation': 'courtesan', 'seed_background_fixed': 1})
        self.assertEqual(result['book']['lines'], {'hello': 'Saved line'})
        self.assertEqual(result['book']['notes'], 'Keep')
        self.assertEqual(Path(str(self.path) + '.bak').read_bytes(), before)

    def test_group_only_and_clear_are_explicit_empty_strings(self):
        self.save({'worldGroup': 'modern'})
        current = json.loads(self.path.read_text('utf-8'))
        for kind in self.bg.KINDS:
            self.assertEqual(current['seed_' + kind], '')
        self.save({})
        self.assertEqual(json.loads(self.path.read_text('utf-8'))['seed_background_fixed'], 1)

    def test_legacy_dialogue_save_and_reads_do_not_convert_seed_data(self):
        before = self.path.read_bytes()
        result = self.bg.save_slave_talkbook(self.editor, 3100,
            {'revision': self.editor.slave_revision(3100), 'book': {'background': {'world': 'modern'}, 'lines': {'a': 'B'}}}, lambda _v: None)
        self.assertEqual(self.path.read_bytes(), before)
        self.assertEqual(result['book']['background']['world'], 'modern')
        revision = self.editor.slave_revision(3100)
        self.editor.read_slave_talk(3100)
        self.assertEqual(self.editor.slave_revision(3100), revision)

    def test_talkbook_participates_in_compare_and_swap(self):
        revision = self.editor.slave_revision(3100)
        self.save({'world': 'modern'})
        self.assertNotEqual(self.editor.slave_revision(3100), revision)
        before = self.files()
        with self.assertRaisesRegex(ValueError, '다시'):
            self.bg.save_slave_talkbook(self.editor, 3100,
                {'revision': revision, 'applyBackground': True, 'book': {'background': {'world': 'industrial'}}}, lambda _v: None)
        self.assertEqual(self.files(), before)

    def test_unknown_ids_and_invalid_marker_do_not_write(self):
        before = self.files()
        for background in [{'world': 'guessed_world'}, {'family': 1}, {'occupation': 'courtesan ', 'world': 'earth_rome'}]:
            with self.assertRaises(ValueError):
                self.save(background)
        for invalid in [0, 2, True, '1']:
            with self.assertRaises(ValueError):
                self.bg.prepare_fields(self.original, {'set': {'seed_background_fixed': invalid}})
        self.assertEqual(self.files(), before)

    def test_common_fields_accept_only_catalog_ids_and_preserve_other_edits(self):
        result = self.bg.prepare_fields(self.original, {'set': {'seed_family': 'pesant', 'seed_stamina': 8}, 'story': {'world': 'Draft'}})
        self.assertEqual(result['set']['seed_family'], 'pesant')
        self.assertEqual(result['set']['seed_world'], '')
        self.assertEqual(result['set']['seed_background_fixed'], 1)
        self.assertEqual(result['set']['seed_stamina'], 8)
        self.assertEqual(result['story'], {'world': 'Draft'})
        with self.assertRaises(ValueError):
            self.bg.prepare_fields(self.original, {'set': {'seed_family': 'peasant'}})

    def test_dry_run_has_no_writes_and_background_save_is_one_transaction(self):
        before = self.files()
        result = self.save({'world': 'modern'}, dryRun=True)
        self.assertTrue(result['changes'])
        self.assertEqual(self.files(), before)
        writes = []
        self.editor._write = lambda payloads: writes.append(payloads)
        self.save({'world': 'modern'})
        self.assertEqual(len(writes), 1)
        self.assertEqual(set(writes[0]), {self.path, self.root / 'jo9_talkbook/3100.json'})

    def test_clone_keeps_metadata_in_background_section(self):
        self.save({'world': 'modern', 'family': 'worker', 'occupation': 'secretary'})
        background = self.editor.clone_preview('slave', 3100,
            {'targetRole': 'slave', 'newId': 3101, 'name': 'Background copy', 'include': ['background']})
        stats = self.editor.clone_preview('slave', 3100,
            {'targetRole': 'slave', 'newId': 3101, 'name': 'Stats copy', 'include': ['stats']})
        self.assertEqual(background['data']['seed_world'], 'modern')
        self.assertNotIn('seed_stamina', background['data'])
        self.assertNotIn('seed_world', stats['data'])
        self.assertNotIn('seed_background_fixed', stats['data'])
        self.assertEqual(stats['data']['seed_stamina'], 9)

    def test_clone_prefers_canonical_metadata_over_older_profile_background(self):
        self.save({'world': 'modern', 'family': 'worker', 'occupation': 'secretary'})
        profile = self.editor._profile_file('slave', 3100)
        profile.parent.mkdir(parents=True)
        profile.write_text(json.dumps({'background': {'world': 'industrial', 'worldGroup': 'legacy-group'}}), 'utf-8')
        result = self.editor.clone_preview('slave', 3100,
            {'targetRole': 'slave', 'newId': 3101, 'name': 'Background copy', 'include': ['background']})
        self.assertEqual(result['background']['world'], 'modern')
        self.assertEqual(result['background']['family'], 'worker')
        self.assertEqual(result['background']['worldGroup'], 'legacy-group')


if __name__ == '__main__':
    unittest.main()
