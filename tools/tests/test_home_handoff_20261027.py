"""Small read/write fixtures only; never reads or edits an actual game."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('handoff_verifier', ROOT/'tools/verify-home-handoff-20261027.py')
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)

def sha(data):
    return hashlib.sha256(data).hexdigest()

class FixtureQA(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='home-verifier-fixture-', dir=Path(__file__).parent)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)/'repo'
        self.game = Path(self.temp.name)/'game'
        self.root.mkdir()
        self.game.mkdir()
        self.put(self.root/'resources/replaced.bin', b'new-existing')
        self.put(self.root/'resources/added.bin', b'new-addition')
        self.put(self.game/'jack.qsp', b'baseline-qsp')
        self.manifest = {
            'qspSha256':sha(b'baseline-qsp'),
            'writes':[
                {'source':'resources/replaced.bin', 'path':'content/replaced.bin', 'beforeSha256':sha(b'old-existing'), 'afterSha256':sha(b'new-existing')},
                {'source':'resources/added.bin', 'path':'content/added.bin', 'beforeSha256':None, 'afterSha256':sha(b'new-addition')},
            ],
            'deletes':[{'path':'content/retired.bin', 'beforeSha256':sha(b'old-retired')}],
        }
        self.put(self.game/'content/replaced.bin', b'old-existing')
        self.put(self.game/'content/retired.bin', b'old-retired')

    def put(self, path, data):
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(data)

    def errors(self, state='preflight', game=True):
        return verifier.check(self.root,self.manifest,self.game if game else None,state)

    def apply_fixture(self):
        self.put(self.game/'content/replaced.bin',b'new-existing')
        self.put(self.game/'content/added.bin',b'new-addition')
        (self.game/'content/retired.bin').unlink(missing_ok=True)

    def expect_error(self, fragment, state='preflight', game=True):
        errors=self.errors(state,game)
        self.assertTrue(any(fragment in item for item in errors),errors)

    def test_preflight_accepts_before_and_missing_addition(self):
        self.assertEqual(self.errors(),[])

    def test_preflight_accepts_after(self):
        self.apply_fixture()
        self.assertEqual(self.errors(),[])

    def test_preflight_accepts_absent_retirement(self):
        (self.game/'content/retired.bin').unlink()
        self.assertEqual(self.errors(),[])

    def test_preflight_rejects_modified_existing_target(self):
        self.put(self.game/'content/replaced.bin',b'home-user-edit')
        self.expect_error('Target missing/modified: content/replaced.bin')

    def test_preflight_rejects_modified_addition_target(self):
        self.put(self.game/'content/added.bin',b'home-user-edit')
        self.expect_error('Target missing/modified: content/added.bin')

    def test_preflight_rejects_directory_at_addition_target(self):
        (self.game/'content/added.bin').mkdir()
        self.assertTrue(self.errors(), 'Existing directory must not be accepted as a missing new file')

    def test_preflight_rejects_missing_existing_target(self):
        (self.game/'content/replaced.bin').unlink()
        self.expect_error('Target missing/modified: content/replaced.bin')

    def test_preflight_rejects_modified_retirement(self):
        self.put(self.game/'content/retired.bin',b'home-user-edit')
        self.expect_error('Retired path exists/modified: content/retired.bin')

    def test_applied_accepts_only_final_state(self):
        self.apply_fixture()
        self.assertEqual(self.errors('applied'),[])

    def test_applied_rejects_missing_write(self):
        self.apply_fixture()
        (self.game/'content/added.bin').unlink()
        self.expect_error('Target missing/modified: content/added.bin','applied')

    def test_applied_rejects_old_before_target(self):
        self.apply_fixture()
        self.put(self.game/'content/replaced.bin',b'old-existing')
        self.expect_error('Target missing/modified: content/replaced.bin','applied')

    def test_applied_rejects_remaining_retirement(self):
        self.apply_fixture()
        self.put(self.game/'content/retired.bin',b'old-retired')
        self.expect_error('Retired path exists/modified: content/retired.bin','applied')

    def test_source_hash_mismatch_is_rejected_without_game(self):
        self.put(self.root/'resources/added.bin',b'wrong-source')
        self.expect_error('Source missing/case/hash mismatch: resources/added.bin',game=False)

    def test_source_missing_is_rejected_without_game(self):
        (self.root/'resources/added.bin').unlink()
        self.expect_error('Source missing/case/hash mismatch: resources/added.bin',game=False)

    def test_qsp_mismatch_is_rejected_preflight(self):
        self.put(self.game/'jack.qsp',b'home-new-qsp')
        self.expect_error('QSP differs from the audited baseline')

    def test_qsp_mismatch_is_rejected_applied(self):
        self.apply_fixture()
        self.put(self.game/'jack.qsp',b'home-new-qsp')
        self.expect_error('QSP differs from the audited baseline','applied')

    def test_qsp_missing_is_rejected(self):
        (self.game/'jack.qsp').unlink()
        self.expect_error('QSP differs from the audited baseline')

    def test_source_case_mismatch_is_rejected(self):
        self.manifest['writes'][1]['source']='resources/Added.bin'
        self.expect_error('Source missing/case/hash mismatch: resources/Added.bin',game=False)

    def test_applied_target_case_mismatch_is_rejected(self):
        self.apply_fixture()
        self.manifest['writes'][1]['path']='content/Added.bin'
        self.expect_error('Target path case differs: content/Added.bin','applied')

if __name__=='__main__':
    unittest.main(verbosity=2)
