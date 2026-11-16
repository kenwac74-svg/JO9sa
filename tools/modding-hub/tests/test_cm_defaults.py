from pathlib import Path
import sys,tempfile,unittest
H=Path(__file__).resolve().parents[1];sys.path.insert(0,str(H));sys.path.insert(0,str(H/'tests'))
import master_editor as m
from test_master_editor import BODY
class CmTests(unittest.TestCase):
 def test_inherited_cm_is_exposed_and_preset_override_preserves_common_code(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);(root/'json/slaves').mkdir(parents=True)
   common='jo9_cruel_mercy = -3\r\njo9_cruel_mercy_half = -1\r\nmaster_str = 2'
   (root/'jack.qsp').write_bytes(m.make_fixture({'#masters_base':BODY,'init_game':common}))
   service=m.MasterEditor(root);a=service.read(1)
   self.assertEqual(a['nativeDefaults'],{'jo9_cruel_mercy':-3,'jo9_cruel_mercy_half':-1})
   code=a['master']['statsCode']+'\r\njo9_cruel_mercy = 0\r\njo9_cruel_mercy_half = -1'
   service.save(1,{'revision':a['revision'],'master':{**a['master'],'statsCode':code}})
   current=service.read(1)
   self.assertIn('jo9_cruel_mercy_half = -1',current['master']['statsCode'])
   self.assertEqual(m.QspDocument((root/'jack.qsp').read_bytes()).body('init_game'),common)
   self.assertEqual(service.read(101)['master']['statsCode'],'master_mage = 3')
if __name__=='__main__':unittest.main()
