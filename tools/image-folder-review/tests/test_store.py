import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from folder_review.catalog import scan_pair
from folder_review.project_store import ProjectStore


class StoreTests(unittest.TestCase):
    def setUp(self):
        temp_root = Path(__file__).resolve().parent / '_tmp'
        temp_root.mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=temp_root)
        self.assertTrue(Path(self.temp.name).resolve().is_relative_to(temp_root))
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.a, self.b, self.data = [self.root / n for n in ('a', 'b', 'data')]
        self.a.mkdir(); self.b.mkdir()
        self.store = ProjectStore(self.data)

    def put(self, side, name, content=b'image-a'):
        p = side / name
        p.write_bytes(content)
        return p

    def register(self):
        p = self.store.register('테스트', str(self.a), str(self.b))
        return self.store.apply_scan(p['id'], scan_pair(self.a, self.b))

    def test_group_choice_then_individual_override_and_restart(self):
        for n in (2, 3):
            self.put(self.a, f'girl_{n}.png')
            self.put(self.b, f'girl_{n}.png')
        self.put(self.b, 'girl_4.png')
        p = self.register(); rows = p['groups'][0]['rows']
        result = self.store.set_decision(p['id'], [r['id'] for r in rows], 'original')
        self.assertEqual((result['applied'], result['skipped']), (2, 1))
        self.store.set_decision(p['id'], [rows[1]['id']], 'comparison')
        reopened = ProjectStore(self.data).get_project(p['id'])
        self.assertEqual(reopened['groups'][0]['decision_summary'], 'mixed')
        self.assertEqual(reopened['stats']['reviewed'], 2)
        self.store.set_decision(p['id'], [r['id'] for r in rows], 'defer')
        self.assertEqual(self.store.get_project(p['id'])['stats']['deferred'], 3)

    def test_same_pair_reopens_but_reversed_pair_is_separate(self):
        p = self.register()
        self.assertEqual(self.store.register('다시', str(self.a), str(self.b))['id'], p['id'])
        reverse = self.store.register('반대', str(self.b), str(self.a))
        self.assertNotEqual(reverse['id'], p['id'])

    def test_changed_bytes_same_size_mtime_require_review(self):
        image = self.put(self.a, 'girl_2.png', b'abc')
        p = self.register(); row = p['groups'][0]['rows'][0]
        self.store.set_decision(p['id'], [row['id']], 'original')
        old_stat = image.stat()
        image.write_bytes(b'xyz')
        os.utime(image, ns=(old_stat.st_atime_ns, old_stat.st_mtime_ns))
        rescanned = self.store.apply_scan(p['id'], scan_pair(self.a, self.b))
        self.assertTrue(rescanned['groups'][0]['rows'][0]['review_required'])
        self.assertIsNone(rescanned['groups'][0]['rows'][0]['decision'])
        self.assertTrue(rescanned['history'])

    def test_new_exact_match_changes_pairing_requires_review(self):
        self.put(self.a, 'girl_2.png'); self.put(self.b, 'girl_2.jpg')
        p = self.register(); row = p['groups'][0]['rows'][0]
        self.store.set_decision(p['id'], [row['id']], 'comparison')
        self.put(self.b, 'girl_2.png')
        fresh = self.store.apply_scan(p['id'], scan_pair(self.a, self.b))
        paired = next(r for r in fresh['groups'][0]['rows'] if r['original'])
        self.assertTrue(paired['review_required'])
        self.assertIsNone(paired['decision'])

    def test_unchanged_preserved_new_unreviewed_deleted_history(self):
        x = self.put(self.a, 'x_2.png')
        p = self.register(); row = p['groups'][0]['rows'][0]
        self.store.set_decision(p['id'], [row['id']], 'original')
        self.put(self.a, 'x_3.png')
        p = self.store.apply_scan(p['id'], scan_pair(self.a, self.b))
        self.assertEqual(p['groups'][0]['rows'][0]['decision'], 'original')
        self.assertIsNone(p['groups'][0]['rows'][1]['decision'])
        x.unlink()
        p = self.store.apply_scan(p['id'], scan_pair(self.a, self.b))
        self.assertTrue(p['history'])

    def test_failed_save_keeps_previous_choice(self):
        self.put(self.a, 'x.png'); p = self.register()
        row = p['groups'][0]['rows'][0]
        self.store.set_decision(p['id'], [row['id']], 'original')
        with patch('folder_review.project_store.os.replace', side_effect=OSError('disk full')):
            with self.assertRaises(OSError):
                self.store.set_decision(p['id'], [row['id']], 'defer')
        self.assertEqual(self.store.get_project(p['id'])['groups'][0]['rows'][0]['decision'], 'original')
        self.assertEqual(ProjectStore(self.data).get_project(p['id'])['groups'][0]['rows'][0]['decision'], 'original')

    def test_refuse_changed_after_scan_and_unknown_rows(self):
        image = self.put(self.a, 'x.png'); p = self.register()
        image.write_bytes(b'new-and-different')
        with self.assertRaises(ValueError):
            self.store.set_decision(p['id'], [p['groups'][0]['rows'][0]['id']], 'original')
        with self.assertRaises(ValueError):
            self.store.set_decision(p['id'], ['wrong'], 'original')

    def test_bad_roots_and_data_in_source_rejected(self):
        with self.assertRaises(ValueError):
            self.store.register('same', str(self.a), str(self.a))
        with self.assertRaises(ValueError):
            self.store.register('missing', str(self.a / 'absent'), str(self.b))
        nested = ProjectStore(self.a / 'state')
        with self.assertRaises(ValueError):
            nested.register('nested', str(self.a), str(self.b))

    def test_export_is_utf8_and_contains_both_sides(self):
        self.put(self.a, '한글.png'); self.put(self.b, '한글.png')
        p = self.register()
        self.store.set_decision(p['id'], [p['groups'][0]['rows'][0]['id']], 'original')
        exported = json.loads(self.store.export_decisions(p['id'], 'json'))
        self.assertEqual(exported['groups'][0]['rows'][0]['decision'], 'original')
        self.assertIn('한글.png', self.store.export_decisions(p['id'], 'csv').decode('utf-8-sig'))

    def test_incomplete_walk_keeps_last_good_inventory_and_decision(self):
        self.put(self.a, 'girl_2.png'); p = self.register()
        rid = p['groups'][0]['rows'][0]['id']
        self.store.set_decision(p['id'], [rid], 'original')
        def denied(root, **kwargs):
            kwargs['onerror'](PermissionError(13, 'access denied', str(root)))
            return iter(())
        with patch('folder_review.catalog.os.walk', side_effect=denied):
            incomplete = scan_pair(self.a, self.b)
        with self.assertRaises(ValueError):
            self.store.apply_scan(p['id'], incomplete)
        preserved = self.store.get_project(p['id'])
        self.assertEqual(preserved['groups'][0]['rows'][0]['decision'], 'original')
        restored = self.store.apply_scan(p['id'], scan_pair(self.a, self.b))
        self.assertEqual(restored['groups'][0]['rows'][0]['decision'], 'original')


if __name__ == '__main__':
    unittest.main()
