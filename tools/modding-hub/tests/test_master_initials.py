import unittest,tempfile,sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import master_editor as m
import master_initials as mi
from test_master_editor import BODY

class InitialTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  (self.root/'json/slaves').mkdir(parents=True)
  self.bodies={'#masters_base':BODY,'init_game':"master_medic = 0\n$master_ring = 'none'\nfemale[\"boobs\"] = 0\nfaction_fame['taurus'] = 0\nmaster_check = 0\n",
   'init_story_mode':"master_str = 0\nmaster_medic = 0\n$master_ring = 'none'\nmaster_energy = 5\nfemale_virginity = 2\n",
   'hero_description':"dynamic $master_version_stats[hero_choice]\nmaster_energy = master_str + 1\nif master_energy > 5: master_energy = 5\nget_initial_slave = 0\n$secondary_stt = ''\n",
   'start_game':"if $estate = 'slum_house': $interior = 'slum_house'\ngs 'new_estate'\nis_kid = 0\nif hero_choice = 10:\n is_kid = 1\nend\ngs '#npc_base'\ngs '$newloc'\n",
   'new_estate':"if $estate = 'slum_house':\n bath = 0\nelse\n bath = 1\nend\n",
   '$calculate_attributes':"if master_check = 0:\n master_check = 1\nend\nmaster_energy = min(master_energy, 5)\n",
   'elsewhere':"*p 'UNTOUCHED'"}
  (self.root/'jack.qsp').write_bytes(m.make_fixture(self.bodies));self.s=m.MasterEditor(self.root)
 def tearDown(self):self.tmp.cleanup()
 def test_parser_supports_arrays_strings_unicode_inline_and_ignores_conditions(self):
  code="female[\"boobs\"] = 3 & $master_ring = 'a!&b''c' & сила = 4\nif master_str = 2: master_energy = 3\n! master_medic = 9\n*p 'master_mage = 5'"
  rows=mi.assignments(code);values={r['key']:r['value'] for r in rows}
  self.assertEqual(values,{"female['boobs']":3,'$master_ring':"a!&b'c",'сила':4,'master_energy':3})
  self.assertTrue(rows[-1]['conditional'])
 def test_common_values_and_late_calculations_are_visible_with_provenance(self):
  a=self.s.read(1);rows={r['key']:r for r in a['initialCatalog']['fields']}
  self.assertEqual(rows['master_medic']['value'],0);self.assertEqual(rows['$master_ring']['value'],'none')
  self.assertIn("female['boobs']",rows);self.assertIn("faction_fame['taurus']",rows)
  self.assertEqual(rows['master_energy']['phase'],'description');self.assertIsNone(rows['master_energy']['value'])
  self.assertIn('master_str + 1',rows['master_energy']['expression']);self.assertTrue(rows['master_energy']['recalculated'])
  self.assertEqual(rows['bath']['phase'],'start');self.assertTrue(rows['bath']['conditional'])
  self.assertEqual(rows['master_str']['value'],4)
 def test_save_uses_correct_phases_is_atomic_and_dryrun_writes_nothing(self):
  a=self.s.read(1);before=(self.root/'jack.qsp').read_bytes()
  patch={'master_energy':3,'$master_ring':"a'b","female['boobs']":2,'is_kid':0,'bath':1}
  body={'revision':a['revision'],'initials':patch,'dryRun':True}
  self.assertTrue(self.s.save(1,body)['changes']);self.assertEqual((self.root/'jack.qsp').read_bytes(),before)
  body['dryRun']=False;self.s.save(1,body);doc=m.QspDocument((self.root/'jack.qsp').read_bytes())
  self.assertEqual(doc.body('init_game'),self.bodies['init_game']);self.assertEqual(doc.body('elsewhere'),self.bodies['elsewhere'])
  self.assertLess(doc.body('hero_description').index('master_energy = 3'),doc.body('hero_description').index("$secondary_stt = ''"))
  self.assertGreater(doc.body('hero_description').index('master_energy = 3'),doc.body('hero_description').index('if master_energy > 5'))
  self.assertLess(doc.body('start_game').index('bath = 1'),doc.body('start_game').index("gs '#npc_base'"))
  self.assertIn("$master_ring = 'a''b'",self.s.read(1)['master']['statsCode'])
  self.assertEqual(self.s.read(1)['initialOverrides'],patch)
  self.assertEqual(len(json.loads(next((self.root/'jo9_editor/master-patches').glob('*.json')).read_text('utf-8'))['edits']),3)
 def test_reset_removes_only_owned_overrides_and_keeps_other_master_blocks(self):
  self.s.save(1,{'initials':{'master_energy':3,'master_str':5}})
  self.s.save(101,{'initials':{'master_energy':4}})
  self.s.save(1,{'initials':{'master_energy':None,'master_str':None}})
  self.assertEqual(self.s.read(1)['initialOverrides'],{})
  self.assertEqual(self.s.read(101)['initialOverrides'],{'master_energy':4})
  self.assertEqual(self.s.read(1)['master']['statsCode'],self.s._master(1,m.array_entries(BODY))['statsCode'])
 def test_revision_covers_owned_late_blocks_and_common_source_but_not_other_actor(self):
  self.s.save(1,{'initials':{'master_energy':3}});a=self.s.read(1)
  self.s.save(101,{'initials':{'master_energy':4}})
  self.s.save(1,{'revision':a['revision'],'initials':{'master_energy':2}})
  d=m.QspDocument((self.root/'jack.qsp').read_bytes());a=self.s.read(1)
  (self.root/'jack.qsp').write_bytes(d.replace_body('init_game',d.body('init_game')+'master_medic = 2\n'))
  with self.assertRaisesRegex(ValueError,'다시'):self.s.save(1,{'revision':a['revision'],'initials':{'master_medic':3}})
 def test_bad_types_and_missing_phase_anchor_do_not_write(self):
  before=(self.root/'jack.qsp').read_bytes()
  for patch in [{'master_medic':'not int'},{'$master_ring':2},{'unknown; gs bad':4}]:
   with self.assertRaises(ValueError):self.s.save(1,{'initials':patch})
  self.assertEqual((self.root/'jack.qsp').read_bytes(),before)
  d=m.QspDocument(before);(self.root/'jack.qsp').write_bytes(d.replace_body('hero_description','master_energy = 0'))
  with self.assertRaisesRegex(ValueError,'위치'):self.s.save(1,{'initials':{'master_energy':4}})
 def test_roundtrip_roles_preserves_late_overrides_and_rebinds_new_id(self):
  self.s.save(1,{'initials':{'master_energy':3,'$master_ring':'special','bath':1}})
  self.s.clone('master',1,{'targetRole':'slave','newId':3100,'name':'Copy','include':['stats']})
  self.s.clone('slave',3100,{'targetRole':'master','gender':'male','newId':2,'name':'Back','include':['stats']})
  self.assertEqual(self.s.read(2)['initialOverrides'],self.s.read(1)['initialOverrides'])
  d=m.QspDocument((self.root/'jack.qsp').read_bytes());self.assertIn('if hero_choice = 2:',d.body('hero_description'))
  self.assertNotIn(':preset:1',self.s.read(2)['master']['statsCode'])
 def test_user_formula_in_owned_late_block_is_not_silently_deleted(self):
  self.s.save(1,{'initials':{'master_energy':3}})
  d=m.QspDocument((self.root/'jack.qsp').read_bytes())
  (self.root/'jack.qsp').write_bytes(d.replace_body('hero_description',d.body('hero_description').replace('master_energy = 3','master_energy = master_str + 2')))
  before=(self.root/'jack.qsp').read_bytes();self.assertTrue(self.s.read(1)['initialCatalog'])
  with self.assertRaisesRegex(ValueError,'원본 코드'):self.s.save(1,{'initials':{'master_medic':3}})
  self.assertEqual((self.root/'jack.qsp').read_bytes(),before)
 def test_phase_anchor_ignores_identical_statement_inside_multiline_string(self):
  d=m.QspDocument((self.root/'jack.qsp').read_bytes());real=d.body('hero_description')
  fake="*p 'fake\n$secondary_stt = ''\ntext'\n"
  (self.root/'jack.qsp').write_bytes(d.replace_body('hero_description',fake+real))
  self.s.save(1,{'initials':{'master_energy':3}})
  result=m.QspDocument((self.root/'jack.qsp').read_bytes()).body('hero_description')
  self.assertTrue(result.startswith(fake+real[:real.index("$secondary_stt")]))
 def test_inequality_does_not_start_a_comment_and_braced_comment_stays_hidden(self):
  code="!{flute = 1\nguitar = 1\nviolin = 1}\nif hero_choice = 9 and no_loli ! 1:\n master_libido = 0\nend\nmaster_medic = 1"
  rows=mi.assignments(code);self.assertEqual([r['key'] for r in rows],['master_libido','master_medic']);self.assertTrue(rows[0]['conditional'])
 def test_explicit_clone_mapping_wins_over_carried_table_override(self):
  self.s.save(1,{'initials':{'master_str':7}})
  body={'targetRole':'master','gender':'male','newId':2,'name':'Adjusted','include':['stats'],'overrides':{'master_str':9}}
  preview=self.s.clone_preview('master',1,body);self.assertEqual(preview['initialOverrides']['master_str'],9)
  self.s.clone('master',1,body);self.assertEqual(self.s.read(2)['initialOverrides']['master_str'],9)
 def test_direct_commands_and_conditions_inside_managed_block_are_not_deleted(self):
  self.s.save(1,{'initials':{'master_str':7}});raw=(self.root/'jack.qsp').read_bytes()
  for replacement in ["master_str = 7\ngs 'my_initializer'","if something: master_str = 7","master_str = 7 & gs 'my_initializer'"]:
   d=m.QspDocument(raw);(self.root/'jack.qsp').write_bytes(d.replace_body('#masters_base',d.body('#masters_base').replace('master_str = 7',replacement)))
   before=(self.root/'jack.qsp').read_bytes()
   with self.assertRaisesRegex(ValueError,'원본 코드'):self.s.save(1,{'initials':{'master_medic':3}})
   self.assertEqual((self.root/'jack.qsp').read_bytes(),before)
 def test_nonreset_common_fields_apply_only_when_starting_selected_actor(self):
  d=m.QspDocument((self.root/'jack.qsp').read_bytes());(self.root/'jack.qsp').write_bytes(d.replace_body('init_game',d.body('init_game')+"$dog_name = 'default'\nhorse = 1\nno_futa = 1\njo9_cruel_mercy = 0\n"))
  patch={'$dog_name':'custom','horse':0,'no_futa':0,'jo9_cruel_mercy':10}
  self.s.save(1,{'initials':patch});a=self.s.read(1);d=m.QspDocument((self.root/'jack.qsp').read_bytes())
  for key in patch:self.assertNotIn(key+' =',a['master']['statsCode'])
  self.assertNotIn('MASTER_INITIALS',d.body('hero_description'))
  self.assertIn('if hero_choice = 1:',d.body('start_game'));self.assertEqual(self.s.read(101)['initialOverrides'],{})
 def test_other_hero_specific_overrides_do_not_hide_this_heros_known_values(self):
  rows={r['key']:r for r in self.s.read(1)['initialCatalog']['fields']}
  self.assertEqual(rows['is_kid']['value'],0);self.assertFalse(rows['is_kid']['conditional'])
  self.assertFalse(any(r['location']=='preset:101' for r in rows['master_mage']['sources']))

if __name__=='__main__':unittest.main()
