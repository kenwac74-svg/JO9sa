"""Regressions for duplicate characters that share a base image.

All generated game files are synthetic and confined to the task temporary root.
"""
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest import mock

from PIL import Image

import add_character as api

TOOLS = Path(__file__).resolve().parents[1]
sys.path.insert(0, os.environ.get('JO9_STUDIO_TEST_ROOT', str(TOOLS / 'jo9-history-lab')))
sys.path.insert(0, str(TOOLS / 'modding-hub'))
import studio_server as studio
from master_editor import MasterEditor, make_fixture

TEST_ROOT = Path('G:/Codex/tmp/outfit-copy-fix-20261116/fixtures')


class SharedAppearanceTests(unittest.TestCase):
    def setUp(self):
        TEST_ROOT.mkdir(parents=True, exist_ok=True)
        self.tmp = tempfile.TemporaryDirectory(prefix='character-', dir=TEST_ROOT)
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.paths = api.GamePaths(str(self.root))
        Path(self.paths.slaves_dir).mkdir(parents=True)
        Path(self.paths.full_dir).mkdir(parents=True)
        Path(self.paths.face_dir).mkdir(parents=True)
        Path(self.paths.index_file).write_text(json.dumps({'loli_last': 0, 'young_last': 1000, 'milf_last': 2000}), 'utf-8')
        (self.root / 'jack.qsp').write_bytes(make_fixture({'#masters_base': "$master_base_name[1] = 'Source'\r\n$master_version_stats[1] = {}"}))
        self.base = 'girls/full/shared_base'
        self.slots = {'indpack_naked': self.base, 'indpack_title': 'characters/shared_title',
                      'fullmade': 'girls/full/cloth/shared', 'fullsecretary': 'girls/full/secretary/shared',
                      'fullmistress': 'girls/full/mistress/shared'}
        self.donor = self.character(2578, **self.slots)
        self.receiver = self.character(2609)

    def character(self, sid, **fields):
        data = {'seed_name': 'Fixture', 'fullimage': self.base,
                'seed_world_description': 'receiver manual text', 'seed_stamina': 4}
        data.update(fields)
        path = Path(self.paths.slaves_dir) / ('%d_fixture.json' % sid)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=3) + '\n', 'utf-8')
        for key in api.IMAGE_FIELDS:
            if data.get(key):
                image = Path(api._abs_from_gamepath(str(self.root), data[key]))
                image.parent.mkdir(parents=True, exist_ok=True)
                if not image.exists():
                    Image.new('RGBA', (2, 3), (13, 27, 41, 201)).save(image)
        return path

    def snapshot(self):
        return {p.relative_to(self.root).as_posix(): p.read_bytes() for p in self.root.rglob('*') if p.is_file()}

    def test_regular_clone_includes_missing_shared_outfits_without_source_changes(self):
        before = self.snapshot()
        preview = api.clone_character(self.paths, 2609, new_id=3101, dry_run=True, log=lambda *a: None)
        for key, reference in self.slots.items():
            self.assertEqual(preview['data'].get(key), reference, key)
        self.assertEqual(self.snapshot(), before)
        result = api.clone_character(self.paths, 2609, new_id=3101, log=lambda *a: None)
        copied = json.loads(Path(result['json_file']).read_text('utf-8'))
        self.assertEqual(copied['fullmade'], 'girls/full/cloth/shared')
        self.assertEqual(self.receiver.read_bytes(), before['json/slaves/2609_fixture.json'])
        self.assertEqual(self.donor.read_bytes(), before['json/slaves/2578_fixture.json'])

    def test_explicit_outfit_and_unlink_are_preserved_and_conflicting_donors_are_not_guessed(self):
        self.character(2609, fullmade='girls/full/cloth/own', fullsecretary='')
        self.character(2700, fullmistress='girls/full/mistress/alternative')
        result = api.clone_character(self.paths, 2609, new_id=3101, dry_run=True, log=lambda *a: None)
        self.assertEqual(result['data']['fullmade'], 'girls/full/cloth/own')
        self.assertEqual(result['data']['fullsecretary'], '')
        self.assertNotIn('fullmistress', result['data'])
        self.assertEqual(result['data'].get('indpack_title'), 'characters/shared_title')

    def test_indpack_outfit_alias_is_inherited_but_different_base_and_missing_files_are_not(self):
        self.character(2578, indpack_maid='girls/full/cloth/alias', indpack_secr='girls/full/secretary/missing')
        Path(api._abs_from_gamepath(str(self.root), 'girls/full/secretary/missing')).unlink()
        self.character(2700, fullimage='girls/full/other', fullmistress='girls/full/mistress/other')
        result = api.clone_character(self.paths, 2609, new_id=3101, dry_run=True, log=lambda *a: None)
        self.assertEqual(result['data'].get('indpack_maid'), 'girls/full/cloth/alias')
        self.assertNotIn('indpack_secr', result['data'])
        self.assertNotIn('fullmistress', result['data'])

    def test_image_save_persists_missing_slots_and_preserves_manual_fields_and_donor(self):
        before = self.snapshot()
        image = Image.new('RGBA', (2, 3), (21, 42, 63, 255))
        api.save_character_slots(self.paths, 2609, slot_images={'base': image}, dry_run=True, log=lambda *a: None)
        self.assertEqual(self.snapshot(), before)
        result = api.save_character_slots(self.paths, 2609, slot_images={'base': image}, log=lambda *a: None)
        for key, reference in self.slots.items():
            self.assertEqual(result['data'].get(key), reference, key)
        self.assertEqual(result['data']['seed_world_description'], 'receiver manual text')
        self.assertEqual(self.donor.read_bytes(), before['json/slaves/2578_fixture.json'])
        self.assertEqual(Path(str(self.receiver) + '.bak').read_bytes(), before['json/slaves/2609_fixture.json'])

    def test_studio_read_and_existing_outfit_save_use_the_same_resolved_slot(self):
        with mock.patch.object(studio, 'paths', return_value=self.paths):
            read = studio.read_character(2609)
            self.assertEqual(read['slots']['maid']['reference'], 'girls/full/cloth/shared')
            self.assertTrue(read['slots']['maid']['url'])
            before = self.snapshot()
            saved = studio.save_images(2609, {'slots': {'maid': {'src': 'existing', 't': None}}, 'dryRun': True})
            self.assertTrue(saved['targets']['maid'])
            self.assertEqual(self.snapshot(), before)

    def test_role_copy_uses_shared_outfits_and_keeps_sources_independent(self):
        editor = MasterEditor(self.root, backend=api)
        before = self.snapshot()
        body = {'targetRole': 'master', 'gender': 'female', 'newId': 102,
                'name': 'Copy', 'include': ['appearance']}
        result = editor.clone_preview('slave', 2609, body)
        self.assertEqual(len(result['imageCopies']), 6)
        for field in ('fullmade', 'fullsecretary', 'fullmistress', 'indpack_title'):
            self.assertIn('/102/' + field, result['data'][field])
        self.assertEqual(self.snapshot(), before)
        editor.clone('slave', 2609, body)
        copied = editor.read(102)['data']
        self.assertTrue(editor.image_url(copied['fullmade']))
        self.assertEqual(self.donor.read_bytes(), before['json/slaves/2578_fixture.json'])
        self.assertEqual(self.receiver.read_bytes(), before['json/slaves/2609_fixture.json'])

    def test_role_copy_displays_inherited_indpack_outfit(self):
        self.character(2578, indpack_maid='girls/full/cloth/alias')
        editor = MasterEditor(self.root, backend=api)
        editor.clone('slave', 2609, {'targetRole': 'master', 'gender': 'female', 'newId': 102,
                                    'name': 'Copy', 'include': ['appearance']})
        copied = editor.read(102)
        self.assertIn('/102/indpack_maid', copied['slots']['maid']['reference'] or '')
        self.assertTrue(copied['slots']['maid']['url'])


if __name__ == '__main__':
    unittest.main()
