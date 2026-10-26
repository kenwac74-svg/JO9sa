import tempfile
import unittest
from pathlib import Path

from folder_review.catalog import parse_filename, scan_pair


class CatalogTests(unittest.TestCase):
    def setUp(self):
        temp_root = Path(__file__).resolve().parent / '_tmp'
        temp_root.mkdir(exist_ok=True)
        self.temp = tempfile.TemporaryDirectory(dir=temp_root)
        self.assertTrue(Path(self.temp.name).resolve().is_relative_to(temp_root))
        self.addCleanup(self.temp.cleanup)
        self.a = Path(self.temp.name) / 'original'
        self.b = Path(self.temp.name) / 'comparison'
        self.a.mkdir()
        self.b.mkdir()

    def put(self, root, name):
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b'not-decoded-during-listing')

    def test_preserves_ids_and_suffix_spelling(self):
        self.assertEqual(parse_filename('1092_bath_3.png')['base'], '1092_bath')
        self.assertNotEqual(parse_filename('bath_02.png')['variant_key'], parse_filename('bath_2.png')['variant_key'])
        self.assertNotEqual(parse_filename('bath (2).png')['variant_key'], parse_filename('bath_2.png')['variant_key'])
        self.assertEqual(parse_filename('bath_3 (2).png')['base'], 'bath')
        self.assertEqual(parse_filename('1092_bath.png')['base'], '1092_bath')

    def test_groups_natural_order_and_separates_subfolders(self):
        for name in ['dt_pink_short_milf_10.png', 'dt_pink_short_milf_4.png', 'dt_pink_short_milf_3.png', 'other/dt_pink_short_milf_3.png']:
            self.put(self.a, name)
        scan = scan_pair(self.a, self.b)
        self.assertEqual(len(scan['groups']), 2)
        group = next(g for g in scan['groups'] if not g['relative_dir'])
        self.assertEqual([r['original']['relative_path'] for r in group['rows']], ['dt_pink_short_milf_3.png', 'dt_pink_short_milf_4.png', 'dt_pink_short_milf_10.png'])

    def test_exact_then_unique_extension_pairing_and_ambiguous_leftovers(self):
        for name in ['x_2.png', 'x_02.png', 'x (2).png', 'x_3.png', 'x_4.png', 'x_4.jpg']:
            self.put(self.a, name)
        for name in ['x_2.png', 'x_3.webp', 'x_4.bmp']:
            self.put(self.b, name)
        rows = scan_pair(self.a, self.b)['groups'][0]['rows']
        pairs = [(r['original']['relative_path'] if r['original'] else None, r['comparison']['relative_path'] if r['comparison'] else None) for r in rows]
        self.assertIn(('x_2.png', 'x_2.png'), pairs)
        self.assertIn(('x_3.png', 'x_3.webp'), pairs)
        self.assertIn(('x_02.png', None), pairs)
        self.assertIn(('x (2).png', None), pairs)
        self.assertIn((None, 'x_4.bmp'), pairs)
        self.assertEqual(len(rows), 7)

    def test_base_and_one_remain_distinct(self):
        for name in ['a.png', 'a_1.png']:
            self.put(self.a, name)
        rows = scan_pair(self.a, self.b)['groups'][0]['rows']
        self.assertEqual(len(rows), 2)
        self.assertNotEqual(rows[0]['id'], rows[1]['id'])

    def test_non_images_and_links_reported(self):
        self.put(self.a, 'readme.txt')
        self.put(self.a, 'picture.png')
        result = scan_pair(self.a, self.b)
        self.assertEqual(result['stats']['files'], 1)
        self.assertEqual(result['stats']['ignored'], 1)

    def test_extensionless_image_is_recognized_and_grouped(self):
        from PIL import Image
        Image.new('RGB', (12,12), 'red').save(self.a / 'dt_pink_short_milf_3', format='PNG')
        self.put(self.a, 'dt_pink_short_milf_4.png')
        result = scan_pair(self.a, self.b)
        self.assertEqual(result['stats']['files'], 2)
        self.assertEqual(len(result['groups']), 1)
        self.assertEqual(result['groups'][0]['rows'][0]['original']['extension'], '.png')


if __name__ == '__main__':
    unittest.main()
