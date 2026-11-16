import importlib.util
import sys
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
BUILDER = HERE / 'build_background.py'


class BackgroundIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.builder = None
        if BUILDER.exists():
            spec = importlib.util.spec_from_file_location('background_builder', BUILDER)
            cls.builder = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(cls.builder)

    def ready(self):
        self.assertIsNotNone(self.builder, 'B background module is not implemented')
        return self.builder

    def test_authoritative_records_and_current_manual_text_protection(self):
        b = self.ready()
        data = b.load_sources()
        self.assertEqual(len(data['records']), 163)
        result = b.build_module()
        self.assertEqual(result['audit']['existingTexts'], 152)
        self.assertEqual(result['audit']['newTexts'], 11)
        self.assertEqual(result['audit']['manualTextConflicts'], [])

    def test_candidate_table_preserves_weights_and_all_link_age_constraints(self):
        b = self.ready()
        data = b.load_sources()
        tables = b.candidate_tables(data)
        self.assertEqual(data['worldPool'].count('industrial'), 3)
        self.assertEqual(data['worldPool'].count('earth_rome'), 1)
        reached = set()
        for (world, age), families in tables.items():
            for family, occupations in families.items():
                self.assertTrue(occupations)
                for occupation in occupations:
                    self.assertTrue(b.allowed(data, world, family, occupation, age))
                    reached.add((world, family, occupation))
        for record in data['records']:
            if record['kind'] == 'world':
                self.assertTrue(any(x[0] == record['id'] for x in reached))
            elif record['kind'] == 'family':
                self.assertTrue(any(x[1] == record['id'] for x in reached))
            else:
                self.assertTrue(any(x[2] == record['id'] for x in reached))
        self.assertFalse(any('mafia_boss' in jobs for (world, age), families in tables.items()
                             if age != 2 for jobs in families.values()))
        self.assertFalse(any('schoolgirl' in jobs for (world, age), families in tables.items()
                             if age != 0 for jobs in families.values()))

    def test_empty_tables_have_no_illegal_substitute(self):
        b = self.ready()
        data = b.load_sources()
        data['settings']['links']['worldFamilies'] = {w: [] for w in data['worldPool']}
        tables = b.candidate_tables(data)
        self.assertTrue(all(not families for families in tables.values()))
        body = b.build_helper(data, tables)
        self.assertIn("if $j9bg_worlds = '': result = 0 & exit", body)
        self.assertNotIn('loop_type', body)

    def test_core_offsets_removed_for_random_and_skills_and_fixed_preserved(self):
        b = self.ready()
        result = b.build_module()
        audit = result['audit']
        self.assertGreater(audit['guardedInitialAttributeLines'], 180)
        self.assertEqual(audit['alteredSkillLines'], 0)
        self.assertTrue(audit['fixedProfileFragmentsPreserved'])
        self.assertEqual(set(e['location'] for e in result['module']['edits']),
                         {'#static_txt', 'generate_stock'})
        self.assertIn('jo9_background_b', [x['name'] for x in result['module']['add_locations']])

    def test_patch_roundtrip_reverse_and_exact_reapplication(self):
        b = self.ready()
        result = b.build_module()
        self.assertTrue(result['audit']['roundtripByteIdentical'])
        self.assertTrue(result['audit']['reverseByteIdentical'])
        self.assertTrue(result['audit']['allEditsExactlyMatched'])

    def test_random_selected_job_is_not_renamed_by_legacy_mature_bride_rules(self):
        b = self.ready()
        result = b.build_module()
        jobs = next(e['new'] for e in result['module']['edits']
                    if e['reason'].startswith('remove random occupation'))
        self.assertEqual(jobs.count("if meta_type = 3 and stock['jo9_bg_random'] ! 1:"), 3)

    def test_saved_global_cache_has_surgical_refresh_for_exact_historic_text_only(self):
        b = self.ready()
        result = b.build_module()
        helper = result['module']['add_locations'][0]['body']
        self.assertTrue("if $args[0] = 'refresh':" in helper)
        self.assertTrue("gs 'jo9_background_b', 'refresh'" in helper)
        self.assertEqual(result['audit']['oldCacheExactTextGuards'], 152)


if __name__ == '__main__':
    unittest.main(verbosity=2)
