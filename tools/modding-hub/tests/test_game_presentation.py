import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]))
from game_presentation import metadata,validate_simulation
from master_editor import make_fixture,MasterEditor
from test_master_editor import MasterTests

class PresentationTests(unittest.TestCase):
 def test_extracts_only_literal_display_rules(self):
  data=metadata(make_fixture({'#static_base':'''$_font_col_skill[5] = '<font color="#009900">' ''','#variative':"$pride[0] = dyneval($vb_cycle_skill, 5, '개방적')\r\n$atr_name['pride'] = '태도'",'get_stock_seed':"stock['moral'] = seed_moral[stock_type]"}))
  self.assertEqual(data['values']['pride'][0]['index'],5);self.assertEqual(data['palettes']['skill'][5],'#009900');self.assertEqual(data['supportedSeeds'],['moral'])
 def test_dollar_dyneval_is_also_a_literal_display_rule(self):
  data=metadata(make_fixture({'#variative':"$mood[0] = $dyneval($vb_cycle_stat, 5, '차분함')"}))
  self.assertEqual(data['values']['mood'][0],{'text':'차분함','cycle':'stat','index':5})
 def test_validation_has_no_arbitrary_grade_limit(self):
  self.assertEqual(validate_simulation({'rate.moral':123,'angst':-5}),{'rate.moral':123,'angst':-5})
  for v in [{'bad':1},{'fear':1.5},{'fear':True},{'psy_status':'bad'},None]:
   with self.assertRaises(ValueError):validate_simulation(v)

class SimulationSaveTests(MasterTests):
 def setUp(self):
  super().setUp();self.s=MasterEditor(self.root)
 def test_simulation_only_save_roundtrip_and_revision_guard(self):
  a=self.s.read(1);before=self.qsp_bytes();body={'revision':a['revision'],'simulation':{'rate.moral':12,'psy_status':'soft'}}
  dry=self.s.save(1,{**body,'dryRun':True});self.assertTrue(dry['changes']);self.assertEqual(self.s.read(1)['simulation'],{})
  self.s.save(1,body);self.assertEqual(self.s.read(1)['simulation'],body['simulation']);self.assertEqual(self.qsp_bytes(),before)
  with self.assertRaises(ValueError):self.s.save(1,body)
  a=self.s.read(1);self.s.save(1,{'revision':a['revision'],'simulation':{}});self.assertEqual(self.s.read(1)['simulation'],{})
 def qsp_bytes(self):return (self.root/'jack.qsp').read_bytes()
 def test_clone_carries_simulation_only_when_stats_selected(self):
  sim={'rate.moral':12};self.s.save(1,{'simulation':sim})
  a=self.s.clone_preview('master',1,{'targetRole':'slave','newId':3100,'name':'A','include':['stats']});self.assertEqual(a['simulation'],sim)
  b=self.s.clone_preview('master',1,{'targetRole':'slave','newId':3100,'name':'A','include':[]});self.assertEqual(b['simulation'],{})
  self.s.clone('master',1,{'targetRole':'slave','newId':3100,'name':'A','include':['stats']});self.assertEqual(self.s.slave_profile(3100)['simulation'],sim)

if __name__=='__main__':unittest.main()
