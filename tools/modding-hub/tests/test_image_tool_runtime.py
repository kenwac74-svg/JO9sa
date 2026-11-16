import importlib.util,json,tempfile,threading,time,unittest
from pathlib import Path

HERE=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('image_tool_runtime',HERE/'image_tool_runtime.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class RuntimeTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.urls=self.root/'tools.json'
  self.urls.write_text(json.dumps({'workshop':'http://127.0.0.1:5290/','imageReview':'http://127.0.0.1:11332/','dialogue':'keep'}),'utf-8')
 def tearDown(self):self.tmp.cleanup()
 def runtime(self,probe,launch):return m.ImageToolRuntime(self.root,self.urls,lambda:self.root/'game',probe,launch)
 def test_dead_url_restarts_and_preserves_other_tools(self):
  calls=[]
  r=self.runtime(lambda k,u,g,c:u.endswith(':6000/'),lambda *args:calls.append(args) or {'url':'http://127.0.0.1:6000/'})
  self.assertFalse(r.ensure('workshop')['reused']);self.assertEqual(len(calls),1)
  self.assertEqual(json.loads(self.urls.read_text())['dialogue'],'keep')
  self.assertTrue(r.ensure('workshop')['reused']);self.assertEqual(len(calls),1)
 def test_review_recovers_even_when_port_stays_the_same(self):
  healthy=[False]
  def launch(*_):healthy[0]=True;return {'url':'http://127.0.0.1:11332/'}
  self.assertFalse(self.runtime(lambda *_:healthy[0],launch).ensure('imageReview')['reused'])
 def test_parallel_opens_start_only_one_server(self):
  healthy=[False];calls=[]
  def launch(*_):calls.append(1);time.sleep(.02);healthy[0]=True;return {'url':'http://127.0.0.1:6000/'}
  r=self.runtime(lambda *_:healthy[0],launch);threads=[threading.Thread(target=r.ensure,args=('workshop',)) for _ in range(3)]
  for t in threads:t.start()
  for t in threads:t.join()
  self.assertEqual(len(calls),1)
 def test_failed_launch_keeps_previous_addresses(self):
  before=self.urls.read_bytes();r=self.runtime(lambda *_:False,lambda *_:{'url':'http://127.0.0.1:6000/'})
  with self.assertRaises(RuntimeError):r.ensure('workshop')
  self.assertEqual(self.urls.read_bytes(),before)
 def test_unlisted_tool_does_not_run_a_command(self):
  r=self.runtime(lambda *_:False,lambda *_:self.fail('unexpected launch'))
  with self.assertRaises(ValueError):r.ensure('arbitrary')
 def test_nonlocal_launch_url_is_rejected(self):
  r=self.runtime(lambda *_:False,lambda *_:{'url':'https://example.com/'})
  with self.assertRaises(ValueError):r.ensure('workshop')

if __name__=='__main__':unittest.main()
