import importlib.util,sys,unittest,tempfile,json,hashlib
from pathlib import Path

HERE=Path(__file__).parent
sys.path.insert(0,str(HERE.parent))
spec=importlib.util.spec_from_file_location('master_editor',HERE.parent/'master_editor.py')
m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m
if spec.loader and (HERE.parent/'master_editor.py').exists():spec.loader.exec_module(m)

BODY="""! original comment
$master_base_name[1] = 'Man'
$hero_description[1] = 'First ''quoted'' story<br>' + _
'second {part}'
$hero_difficulty[1] = 'Easy'
$clear_ava_path[1] = 'content/pic/master/a.png'
$sepia_ava_path[1] = 'content/pic/master/a_sepia.png'
$master_version_stats[1] = {
 master_str = 4
 master_fighter = 5
 $master_armor = 'with } brace'
 if something = 1: sparks += 9
}
$master_base_name[101] = 'Woman'
$hero_description[101] = 'Other'
$master_version_stats[101] = {master_mage = 3}
! unrelated data must remain
$npc_name['x'] = 'A'
""".replace('\n','\r\n')

class MasterTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  (self.root/'json/slaves').mkdir(parents=True)
  self.raw=m.make_fixture({'#masters_base':BODY,'elsewhere':"*p 'Original untouched'"})
  (self.root/'jack.qsp').write_bytes(self.raw)
  self.s=m.MasterEditor(self.root)
 def tearDown(self):self.tmp.cleanup()
 def files(self):return {str(p.relative_to(self.root)):p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
 def test_reads_multiline_strings_and_braced_code_without_evaluating(self):
  rows=self.s.list();self.assertEqual([x['gender'] for x in rows],['male','female'])
  a=self.s.read(1);self.assertEqual(a['master']['description'],"First 'quoted' story<br>second {part}")
  self.assertIn('sparks += 9',a['master']['statsCode']);self.assertEqual(a['data']['seed_gladiatrix'],5)
 def test_dry_run_has_no_writes_and_save_only_changes_requested_arrays(self):
  a=self.s.read(1);body={'revision':a['revision'],'master':{**a['master'],'name':"King's name"},'dryRun':True}
  before=self.files();r=self.s.save(1,body);self.assertTrue(r['changes']);self.assertEqual(self.files(),before)
  body['dryRun']=False;self.s.save(1,body)
  d=m.QspDocument((self.root/'jack.qsp').read_bytes());self.assertEqual(d.body('elsewhere'),"*p 'Original untouched'")
  self.assertEqual(d.body('#masters_base'),BODY.replace("$master_base_name[1] = 'Man'","$master_base_name[1] = 'King''s name'"))
  self.assertTrue(list((self.root/'jo9_editor/master-patches').glob('*.json')))
 def test_stale_source_rejected_but_unrelated_qsp_change_survives(self):
  a=self.s.read(1);d=m.QspDocument(self.raw);(self.root/'jack.qsp').write_bytes(d.replace_body('elsewhere','Other data'))
  self.s.save(1,{'revision':a['revision'],'master':{**a['master'],'name':'Changed'}})
  self.assertEqual(m.QspDocument((self.root/'jack.qsp').read_bytes()).body('elsewhere'),'Other data')
  with self.assertRaisesRegex(ValueError,'다시'):self.s.save(1,{'revision':a['revision'],'master':a['master']})
 def test_master_to_slave_keeps_roles_distinct_unknown_fields_and_source(self):
  a=self.s.read(101);self.s.save(101,{'revision':a['revision'],'set':{'seed_custom_marker':91},'story':{'world':'User text'}})
  before=(self.root/'jack.qsp').read_bytes();a=self.s.read(101)
  r=self.s.clone('master',101,{'revision':a['revision'],'targetRole':'slave','newId':3100,'name':'Copy','slug':'copy','include':['appearance','background','stats','talk'],'overrides':{'seed_nurse':4}})
  j=json.loads((self.root/'json/slaves/3100_copy.json').read_text('utf-8'))
  self.assertEqual(j['seed_name'],'Copy');self.assertEqual(j['seed_custom_marker'],91);self.assertEqual(j['seed_nurse'],4)
  self.assertEqual((self.root/'jack.qsp').read_bytes(),before)
  self.assertEqual(self.s.slave_profile(3100)['master']['description'],'Other')
  self.assertEqual(r['role'],'slave')
 def test_slave_to_master_round_trip_and_collision_do_not_overwrite(self):
  f=self.root/'json/slaves/3100_test.json';j={'seed_name':'Test','seed_stamina':4,'seed_gladiatrix':5,'seed_custom_marker':82,'fullimage':'girls/full/test'};f.write_text(json.dumps(j),'utf-8')
  p=self.s.clone_preview('slave',3100,{'targetRole':'master','gender':'female','name':'New master','newId':102,'include':['appearance','background','stats','talk']})
  self.assertEqual(p['id'],102);self.assertIn('master_fighter = 5',p['master']['statsCode'])
  r=self.s.clone('slave',3100,{'revision':self.s.slave_revision(3100),'targetRole':'master','gender':'female','name':'New master','newId':102,'include':['appearance','background','stats','talk']})
  self.assertEqual(f.read_text('utf-8'),json.dumps(j));self.assertEqual(self.s.read(102)['data']['seed_custom_marker'],82)
  before=self.files()
  with self.assertRaises((ValueError,FileExistsError)):self.s.clone('slave',3100,{'targetRole':'master','newId':101,'name':'Collision','include':[]})
  self.assertEqual(self.files(),before)
  self.assertFalse(r['menuLinked'])
 def test_unselected_sections_are_not_copied_and_unsafe_filename_rejected(self):
  r=self.s.clone_preview('master',1,{'targetRole':'slave','newId':3100,'name':'Only name','slug':'safe','include':[]})
  self.assertNotIn('seed_gladiatrix',r['data']);self.assertNotIn('seed_ava_clear',r['data'])
  with self.assertRaises(ValueError):self.s.clone_preview('master',1,{'targetRole':'slave','newId':3100,'name':'x','slug':'../bad','include':[]})
 def test_clone_images_are_independent_and_never_overwrite_master_sources(self):
  p=self.root/'content/pic/master/a.png';p.parent.mkdir(parents=True);p.write_bytes(b'original portrait')
  self.s.clone('master',1,{'targetRole':'slave','newId':3100,'name':'Copy','slug':'copy','include':['appearance']})
  f=self.s.slave(3100)[1]['seed_ava_clear'];target=self.root/(f+'.png')
  self.assertNotEqual(target,p);self.assertEqual(target.read_bytes(),p.read_bytes())
  target.write_bytes(b'changed copy');self.assertEqual(p.read_bytes(),b'original portrait')
 def test_code_ending_in_a_comment_is_valid(self):
  a=self.s.read(1);self.s.save(1,{'revision':a['revision'],'master':{**a['master'],'statsCode':'master_str = 4\n! last comment'}})
 def test_talk_save_returns_revision_and_background_copies_independently(self):
  r=self.s.talk(1,{'book':{'background':{'world':'rome'},'lines':{'greeting':'Hello'}}})
  self.assertEqual(r['revision'],self.s.read(1)['revision'])
  self.s.clone('master',1,{'targetRole':'slave','newId':3100,'name':'x','include':['background']})
  book=self.s.read_slave_talk(3100);self.assertEqual(book['background'],{'world':'rome'});self.assertFalse(book['lines'])
  self.s.clone('master',1,{'targetRole':'slave','newId':3101,'name':'y','include':['talk']})
  book=self.s.read_slave_talk(3101);self.assertEqual(book['lines'],{'greeting':'Hello'});self.assertNotIn('background',book)
 def test_master_outfit_and_face_save_only_editor_paths(self):
  from PIL import Image,ImageOps
  import io,base64
  im=Image.new('RGBA',(80,80),(30,160,70,255));out=io.BytesIO();im.save(out,'PNG');src='data:image/png;base64,'+base64.b64encode(out.getvalue()).decode()
  decode=lambda s:Image.open(io.BytesIO(base64.b64decode(s.split(',')[1]))).convert('RGBA')
  args=(decode,lambda im,t:im.resize((795,596)),lambda im:ImageOps.grayscale(im).convert('RGBA'),lambda im:im.copy())
  before=self.files();body={'slots':{'maid':{'src':src,'t':None}},'face':{'mode':'file','src':src},'dryRun':True}
  self.s.images(101,body,*args);self.assertEqual(self.files(),before)
  body['dryRun']=False;r=self.s.images(101,body,*args)
  self.assertTrue(all(p.startswith(('content/pic/master/editor/101/','jo9_editor/role-profiles/master/101.json')) for p in r['files']))
  with Image.open(self.root/'content/pic/master/editor/101/maid.png') as pic:self.assertEqual(pic.size,(795,596))
  with Image.open(self.root/'content/pic/master/editor/101/face.png') as pic:self.assertEqual(pic.size,(151,150))
  self.assertEqual((self.root/'jack.qsp').read_bytes(),self.raw)
  self.s.images(101,{'slots':{'maid':None}},*args);self.assertTrue((self.root/'content/pic/master/editor/101/maid.png').exists());self.assertIsNone(self.s.read(101)['slots']['maid']['reference'])
 def test_talk_save_cannot_refresh_a_stale_native_snapshot(self):
  tab_a=self.s.read(1);tab_b=self.s.read(1)
  self.s.save(1,{'revision':tab_b['revision'],'master':{**tab_b['master'],'name':'Other tab new name'}})
  with self.assertRaisesRegex(ValueError,'다시'):self.s.talk(1,{'revision':tab_a['revision'],'book':{'lines':{'greeting':'Hello'}}})
  self.assertEqual(self.s.read(1)['master']['name'],'Other tab new name')

if __name__=='__main__':unittest.main()
