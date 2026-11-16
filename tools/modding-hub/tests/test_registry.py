import importlib.util,tempfile,unittest
from pathlib import Path

SOURCE=Path(__file__).resolve().parents[1]/'registry.py'
class RegistryTest(unittest.TestCase):
 def setUp(self):
  spec=importlib.util.spec_from_file_location('registry',SOURCE)
  self.api=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.api)
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
 def tearDown(self):self.temp.cleanup()
 def make(self,rel,body):
  p=self.root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(body,encoding='utf-8');return p
 def test_catalog_dedup_and_ignore_diagnostics(self):
  body='<!doctype html><html><title>모브 카탈로그</title><body>목록</body></html>'
  first=self.make('catalog.html',body);self.make('same.html',body)
  self.make('before/catalog.html',body);self.make('evidence/capture.html',body)
  self.make('fragment.html','<div>조각</div>')
  rows=self.api.catalog_rows([self.root]);self.assertEqual(len(rows),1)
  self.assertEqual(rows[0]['title'],'모브 카탈로그');self.assertEqual(len(rows[0]['copies']),2)
 def test_known_catalog_and_relative_asset(self):
  page=self.make('report/index.html','<html><title>비교표</title></html>')
  pic=self.make('report/images/pic.png','png')
  rows=self.api.catalog_rows([self.root]);self.assertEqual(self.api.resolve_file(str(page),rows,[]),page.resolve())
  self.assertEqual(self.api.resolve_file(str(pic),rows,[]),pic.resolve())
 def test_refuse_unregistered_html_private_save_and_escape(self):
  self.make('report/index.html','<html><title>보고서</title></html>');rows=self.api.catalog_rows([self.root])
  unknown=self.make('other.html','<html>등록 이후 추가</html>');save=self.make('report/personal.sav','private')
  for p in [unknown,save,self.root/'report/../../private.json']:
   with self.assertRaises((PermissionError,FileNotFoundError)):self.api.resolve_file(str(p),rows,[])
 def test_file_urls_rewrite_without_touching_original(self):
  original='<img src="file:///G:/somi/pic/a.png"><a href="file:///G:/somi/report.html">열기</a>'
  fixed=self.api.rewrite_html(original)
  self.assertIn('/workspace/fs/G:/somi/pic/a.png',fixed);self.assertNotIn('file:///',fixed)
  self.assertIn('file:///',original)

if __name__=='__main__':unittest.main()
