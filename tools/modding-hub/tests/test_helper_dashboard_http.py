"""Route wiring checks with a neutral Helper; no EXE or save is opened."""
import http.client, importlib.util, json, sys, tempfile, threading, unittest
from pathlib import Path
from unittest.mock import patch
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parent if (HERE.parent/'server.py').is_file() else Path('G:/somi/JO9sa/tools/modding-hub')
sys.path.insert(0,str(SOURCE))
sys.path.insert(0,str(HERE))
spec=importlib.util.spec_from_file_location('helper_hub_candidate',HERE/'server.py' if (HERE/'server.py').exists() else SOURCE/'server.py')
hub=importlib.util.module_from_spec(spec);spec.loader.exec_module(hub)

class FakeHelper:
    calls=[]
    def __init__(self,*args):pass
    def dashboard(self):return b'<!doctype html><p>Neutral helper</p>'
    def fetch(self,route,query):
        self.calls.append((route,query))
        return 200,'application/json',b'{"save_files":[],"fixture":true}'
    def close(self):pass

class Routes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.patch=patch.object(hub,'HelperDashboard',FakeHelper);cls.patch.start()
        cls.build_patch=patch.object(hub,'build_id',return_value='helper-fixture');cls.build_patch.start()
        cls.temp=tempfile.TemporaryDirectory()
        urls=Path(cls.temp.name)/'urls.json';urls.write_text(json.dumps({'gameReference':'http://127.0.0.1:8729/'}),'utf8')
        cls.server=hub.create_server(Path('G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab'),Path('G:/somi/JO9sa'),urls,0)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.thread.join();cls.temp.cleanup();cls.patch.stop();cls.build_patch.stop()
    def get(self,path,method='GET'):
        connection=http.client.HTTPConnection('127.0.0.1',self.server.server_address[1],timeout=5)
        try:
            connection.request(method,path,headers={'Connection':'close'});r=connection.getresponse();return r.status,dict(r.getheaders()),r.read()
        finally:connection.close()
    def test_config_adds_helper_without_replacing_existing_db(self):
        status,headers,raw=self.get('/workspace/config');self.assertEqual(status,200);data=json.loads(raw)
        self.assertEqual(data['tools']['helperDashboard'],'/workspace/helper/')
        self.assertEqual(data['tools']['gameReference'],'http://127.0.0.1:8729/')
    def test_document_css_and_query_are_in_one_namespace(self):
        status,_,raw=self.get('/workspace/helper/');self.assertEqual(status,200);self.assertIn(b'Neutral helper',raw)
        status,headers,raw=self.get('/workspace/helper/dashboard.css');self.assertEqual(status,200);self.assertIn('text/css',headers['Content-Type'])
        status,headers,raw=self.get('/workspace/helper/api/state?sav=neutral.sav');self.assertEqual(status,200);self.assertTrue(json.loads(raw)['fixture']);self.assertEqual(FakeHelper.calls[-1],('/api/state','sav=neutral.sav'));self.assertTrue(headers['Cache-Control'].startswith('no-store'))
    def test_desktop_commands_do_not_affect_shared_hub(self):
        for endpoint in ('shutdown','open-topmost','client-closed'):
            status,_,_=self.get('/workspace/helper/api/'+endpoint,'POST');self.assertEqual(status,405)
        self.assertEqual(self.get('/workspace/config')[0],200)

if __name__=='__main__':unittest.main()
