import importlib.util,json,pathlib,tempfile,unittest
P=pathlib.Path
spec=importlib.util.spec_from_file_location('sync',P(__file__).with_name('sync-workspace-state.py'));sync=importlib.util.module_from_spec(spec);spec.loader.exec_module(sync)
def fixture(root,paths,status,ids):
 root.mkdir(parents=True,exist_ok=True)
 (root/'catalog_merge_vs_original.html').write_text('var D='+json.dumps([[p,'add','etc',1,0,10,10,''] for p in paths])+';\nvar MR="old", OR="old-original";\n',encoding='utf-8')
 (root/'catalog_work_ids.json').write_text(json.dumps({'items':ids,'counters':{'bg':10}}),encoding='utf-8')
 (root/'catalog_status.js').write_text('window.CATALOG_STATUS='+json.dumps(status)+';',encoding='utf-8')
class Tests(unittest.TestCase):
 def test_merge_keeps_home_items_and_rebases_paths(self):
  with tempfile.TemporaryDirectory() as t:
   root=P(t);a=root/'source';b=root/'home';game=root/'game';original=root/'original'
   fixture(a,['new'],{'savedAt':20,'items':{'new':['done']}},{'new':'bg-0002'})
   fixture(b,['old'],{'savedAt':10,'items':{'old':['spare']}},{'old':'bg-0001'})
   result=sync.sync(a,b,game,original)
   self.assertEqual(result['addedRows'],1);self.assertEqual(set(sync.state(b/'catalog_status.js')['items']),{'old','new'})
   self.assertEqual(sync.load(b/'catalog_work_ids.json')['items']['old'],'bg-0001')
   self.assertIn(json.dumps(str(game)),sync.read(b/'catalog_merge_vs_original.html'))
 def test_id_conflict_refuses_before_writing(self):
  with tempfile.TemporaryDirectory() as t:
   root=P(t);a=root/'source';b=root/'home'
   fixture(a,['p'],{'items':{}},{'p':'bg-0002'});fixture(b,['p'],{'items':{}},{'p':'bg-0001'})
   before=(b/'catalog_merge_vs_original.html').read_bytes()
   with self.assertRaises(ValueError):sync.sync(a,b,root/'g',root/'o')
   self.assertEqual(before,(b/'catalog_merge_vs_original.html').read_bytes())
 def test_export_and_restore_record_tree_without_keys_or_images(self):
  with tempfile.TemporaryDirectory() as t:
   root=P(t);a=root/'old';b=root/'new';seed=root/'seed';g=root/'g';o=root/'o'
   fixture(a,['p'],{'items':{'p':['done']}},{'p':'bg-0001'})
   record=a/'image_work/personal-patch/events.jsonl';record.parent.mkdir(parents=True);record.write_text(json.dumps({'key':'1','files':[{'path':'bg/p.png','after':'hash'}]})+'\n')
   aliases={'version':1,'aliases':[{'from':'content/pic/SNKmod/bg/test.png','to':'content/pic/bg/test.png','flags':['done'] }]}
   (a/'catalog_path_aliases.json').write_text(json.dumps(aliases),encoding='utf-8')
   sync.export(a,seed,g,o)
   self.assertEqual(sync.load(seed/'catalog_path_aliases.json'),aliases)
   fixture(b,[],{'items':{}},{})
   sync.sync(seed,b,root/'newGame',root/'newOriginal')
   self.assertEqual(sync.read(record),sync.read(b/'image_work/personal-patch/events.jsonl'))
   self.assertEqual(sync.load(b/'catalog_path_aliases.json'),aliases)
   self.assertFalse((seed/'image_work/personal-patch/objects').exists())
if __name__=='__main__':unittest.main()
