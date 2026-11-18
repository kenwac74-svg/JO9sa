import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, 'G:/somi/JO9sa/tools/modding-hub')
from master_editor import make_fixture
from spawn_warning import SpawnPolicy

HERE = Path(__file__).parent
BASE = json.loads((HERE / 'policy-fixture.json').read_text(encoding='utf-8'))
INDEX = dict(loli_first=1, loli_last=247, young_first=1001,
             young_last=1449, milf_first=2001, milf_last=2340)


class SpawnPolicyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'json').mkdir()
        self.policy = SpawnPolicy()
        self.write()

    def write(self, bodies=None, index=None):
        (self.root / 'jack.qsp').write_bytes(make_fixture(BASE if bodies is None else bodies))
        (self.root / 'json/slave_index.json').write_text(json.dumps(index or INDEX), encoding='utf-8')

    def read(self, sid=2341, data=None):
        return self.policy.read(self.root, sid, {'seed_name': 'Test'} if data is None else data)

    def test_gloria_outside_pool_remains_unique_even_name_erased(self):
        row = self.read(data={})
        self.assertTrue(row['unique'])
        self.assertEqual((row['inRandomPool'], row['warning']), (False, ''))

    def test_expanded_pool_with_both_live_guards_is_safe(self):
        self.write(index={**INDEX, 'milf_last': 2341})
        row = self.read()
        self.assertTrue(row['protected'])
        self.assertEqual(row['warning'], '')

    def test_missing_candidate_guard_exposes_expanded_unique(self):
        bodies = dict(BASE)
        bodies['generate_stock'] = bodies['generate_stock'].replace(
            "if func('jo9_random_stock_allowed',stock_type)=0: jump 'loop_type'", '')
        self.write(bodies, {**INDEX, 'milf_last': 2341})
        self.assertEqual(self.read()['status'], 'exposed')

    def test_missing_fallback_guard_exposes_expanded_unique(self):
        bodies = dict(BASE)
        bodies['generate_stock'] = bodies['generate_stock'].replace(
            "if func('jo9_random_stock_allowed',stock_type)=1:", 'if stock_type > 0:')
        self.write(bodies, {**INDEX, 'milf_last': 2341})
        self.assertEqual(self.read()['status'], 'exposed')

    def test_missing_and_ineffective_helpers_expose_pool_members(self):
        for helper in (None, 'result=1'):
            with self.subTest(helper=helper):
                bodies = dict(BASE)
                if helper is None:
                    bodies.pop('jo9_random_stock_allowed')
                else:
                    bodies['jo9_random_stock_allowed'] = helper
                self.write(bodies)
                self.assertEqual(self.read(1448, {})['status'], 'exposed')

    def test_new_named_character_and_repeatable_exceptions(self):
        self.assertEqual(self.read(1100)['status'], 'exposed')
        self.assertEqual(self.read(9000)['status'], 'outside-pool')
        for sid in range(2586, 2604):
            row = self.read(sid)
            self.assertFalse(row['unique'])
            self.assertEqual(row['warning'], '')
        self.assertFalse(self.read(1100, {})['unique'])

    def test_unrecognized_guard_is_unknown_but_outside_pool_still_safe(self):
        bodies = dict(BASE)
        bodies['jo9_random_stock_allowed'] += '\nresult=func(\'other\',args[0])'
        self.write(bodies)
        self.assertEqual(self.read(1448, {})['warning'], '일반 등장 제외 설정을 확인할 수 없습니다')
        self.assertEqual(self.read()['warning'], '')
        bodies['generate_stock'] = bodies['generate_stock'].replace('stock_type = special_stock', 'stock_type = special_stock + 1')
        self.write(bodies)
        self.assertEqual(self.read()['status'], 'unknown')

    def test_document_cached_and_invalidated_by_source_or_index_change(self):
        import spawn_warning
        with patch.object(spawn_warning, 'QspDocument', wraps=spawn_warning.QspDocument) as parse:
            for sid in (1448, 2341, 1100):
                self.read(sid)
            self.assertEqual(parse.call_count, 1)
            self.write(index={**INDEX, 'milf_last': 2341})
            self.assertTrue(self.read()['inRandomPool'])
            self.assertEqual(parse.call_count, 2)
            self.write({k: v for k, v in BASE.items() if k != 'jo9_random_stock_allowed'},
                       {**INDEX, 'milf_last': 2341})
            self.assertEqual(self.read()['status'], 'exposed')
            self.assertEqual(parse.call_count, 3)

    def test_actual_work_read_only_baseline(self):
        root = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
        if not root.is_dir():
            self.skipTest('WORK not mounted')
        before = [(root / p).stat() for p in ('jack.qsp', 'json/slave_index.json')]
        gloria = self.policy.read(root, 2341, {})
        shiru = self.policy.read(root, 1448, {})
        self.assertEqual(gloria['status'], 'outside-pool')
        self.assertEqual(shiru['status'], 'excluded')
        self.assertEqual((gloria['warning'], shiru['warning']), ('', ''))
        after = [(root / p).stat() for p in ('jack.qsp', 'json/slave_index.json')]
        self.assertEqual([(s.st_mtime_ns, s.st_size) for s in before],
                         [(s.st_mtime_ns, s.st_size) for s in after])


if __name__ == '__main__':
    unittest.main()
