import importlib.util, pathlib, tempfile, json, unittest
p=pathlib.Path(__file__).with_name('export-shared-work.py')
spec=importlib.util.spec_from_file_location('exporter',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class RetiredExportTest(unittest.TestCase):
 def test_only_exact_recorded_legacy_hash_is_excluded(self):
  with tempfile.TemporaryDirectory() as root:
   repo=pathlib.Path(root);plan=repo/'docs/resource-audits/2026-10-11/legacy-1.2.1/plan.json';plan.parent.mkdir(parents=True)
   self.assertEqual(m.retired_images(repo),{})
   plan.write_text(json.dumps({'entries':[{'path':'game/content/pic/characters/a_1.2.1.png','sha256':'a'*64}]}))
   result=m.retired_images(repo)
   self.assertEqual(result,{'characters/a_1.2.1.png':'a'*64})
   self.assertNotEqual(result['characters/a_1.2.1.png'],'b'*64)
   plan.write_text(json.dumps({'entries':[{'path':'game/content/pic/characters/a.png','sha256':'a'*64}]}))
   with self.assertRaises(ValueError):m.retired_images(repo)
if __name__=='__main__':unittest.main()
