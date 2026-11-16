import unittest,tempfile,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]));sys.path.insert(1,'G:/somi/JO9sa/tools/modding-hub')
from master_editor import make_fixture,QspDocument
from general_dialogue import GeneralDialogueDB

DATA="""$voice_fragment_text['q1112_a']='Hello ''name'' <<$slave_name>>'
$voice_fragment_role['q1112_a']='open'
$voice_fragment_types['q1112_a']='|calm|plain|'
$voice_fragment_relations['q1112_a']='*'
voice_fragment_level['q1112_a']=0
voice_fragment_tone['q1112_a']=2
$voice_fragment_text['q1114_b']='Wish'
$voice_fragment_role['q1114_b']='native_1114_skill'
$voice_fragment_types['q1114_b']='*'
$voice_fragment_relations['q1114_b']='|loyal|'
voice_fragment_tone['q1114_b']=1
voice_fragment_question['q1114_b']=1114
"""
class DbTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.raw=make_fixture({'#txt_man':DATA,'#txt_woman':"$slave_relation_description['docile']='Other original'",'elsewhere':'Untouched'})
  (self.root/'jack.qsp').write_bytes(self.raw);self.db=GeneralDialogueDB(self.root)
 def tearDown(self):self.tmp.cleanup()
 def test_reads_metadata_filters_pages_and_safely_decodes_quotes(self):
  a=self.db.search({'question':'1112','type':'calm','tone':'2'});self.assertEqual(a['total'],2)
  row=next(r for r in a['rows'] if r['kind']=='fragment');self.assertEqual(row['text'],"Hello 'name' <<$slave_name>>")
  self.assertIn('<<$slave_name>>',row['plain'])
  self.assertEqual(self.db.search({'question':'1114','relation':'hostile'})['total'],0)
  self.assertEqual(self.db.search({'limit':'1'})['rows'].__len__(),1)
 def test_dryrun_and_exact_row_save_preserve_every_other_location(self):
  row=next(r for r in self.db.search({'q':'q1112_a'})['rows'] if r['kind']=='fragment')
  body={'id':row['id'],'revision':row['revision'],'text':"User's text\nSecond",'dryRun':True}
  self.assertTrue(self.db.save(body)['changes']);self.assertEqual((self.root/'jack.qsp').read_bytes(),self.raw)
  body['dryRun']=False;self.db.save(body);d=QspDocument((self.root/'jack.qsp').read_bytes())
  self.assertEqual(d.body('elsewhere'),'Untouched');self.assertEqual(d.body('#txt_man'),DATA.replace("'Hello ''name'' <<$slave_name>>'","'User''s text<br>Second'"))
  self.assertTrue(list((self.root/'jo9_editor/general-dialogue-patches').glob('*.json')))
  with self.assertRaisesRegex(ValueError,'다시'):self.db.save(body)
 def test_bad_id_and_nonstring_never_write(self):
  for body in [{'id':'unknown','text':'x'},{'id':'#txt_man|q1112_a','text':3}]:
   with self.assertRaises((ValueError,FileNotFoundError)):self.db.save(body)
  self.assertEqual((self.root/'jack.qsp').read_bytes(),self.raw)

if __name__=='__main__':unittest.main()
