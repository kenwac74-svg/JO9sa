import unittest,sys,pathlib,threading,urllib.request,urllib.error,json,base64
from unittest.mock import patch
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]));import server
IMAGE='data:image/png;base64,'+base64.b64encode(b'\x89PNG\r\n\x1a\nx').decode()
class HttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.s=server.http.server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
        cls.t=threading.Thread(target=cls.s.serve_forever,daemon=True);cls.t.start();cls.url='http://127.0.0.1:'+str(cls.s.server_port)
    @classmethod
    def tearDownClass(cls):cls.s.shutdown();cls.s.server_close();cls.t.join()
    def request(self,path,data=None,headers=None):
        h={'Content-Type':'application/json','X-JO9-Token':server.TOKEN};h.update(headers or {})
        req=urllib.request.Request(self.url+path,data=None if data is None else json.dumps(data).encode(),headers=h)
        try:
            with urllib.request.urlopen(req,timeout=5) as r:return r.status,r.read(),dict(r.headers)
        except urllib.error.HTTPError as e:return e.code,e.read(),dict(e.headers)
    def test_handshake(self):
        code,b,_=self.request('/api/session');self.assertEqual(code,200);self.assertEqual(json.loads(b)['token'],server.TOKEN)
    def test_forbidden_host(self):self.assertEqual(self.request('/api/session',headers={'Host':'evil.invalid'})[0],403)
    def test_forbidden_origin(self):self.assertEqual(self.request('/api/generate',{},headers={'Origin':'https://evil.invalid'})[0],403)
    def test_forbidden_token(self):self.assertEqual(self.request('/api/generate',{},headers={'X-JO9-Token':'wrong'})[0],403)
    def test_source_not_public(self):self.assertEqual(self.request('/server.py')[0],404)
    def test_html_csp(self):
        c,b,h=self.request('/');self.assertEqual(c,200);self.assertIn('Content-Security-Policy',h);self.assertIn(b'JO9',b)
    @patch.object(server,'generate',return_value={'image':IMAGE,'usage':{},'provider':'mage'})
    def test_generate_dispatch(self,gen):
        data={'provider':'mage','route':'mango','model':'mango-v3-turbo','image':IMAGE,'prompt':'Extend test shape','aspect_ratio':'5:4','apiKey':'TEST_ONLY'}
        c,b,h=self.request('/api/generate',data);self.assertEqual(c,200);self.assertEqual(gen.call_count,1);self.assertNotIn('TEST_ONLY',b.decode());self.assertNotIn('Access-Control-Allow-Origin',h)
    @patch.object(server,'fetch',return_value={'data':[{'id':'x/y','supported_parameters':{'input_references':{}}},{'id':'a/b','supported_parameters':{}}]})
    def test_discovery_filter(self,fetch):
        c,b,_=self.request('/api/models',{'provider':'openrouter'});self.assertEqual(c,200);self.assertEqual(len(json.loads(b)['data']),1)

class GenerationTests(unittest.TestCase):
    def req(self,provider='mage'):
        return {'provider':provider,'route':'mango','model':'mango-v3-turbo' if provider=='mage' else 'test/model','image':IMAGE,'prompt':'Extend blank canvas','aspect_ratio':'5:4' if provider=='mage' else '4:3'}
    @patch.object(server,'download_image',return_value=IMAGE)
    @patch.object(server.time,'sleep')
    def test_mage_polling(self,sleep,download):
        responses=[{'request_id':'abc','status':'queued','status_url':'https://api.mage.space/v1/requests/abc'},{'status':'running'},{'status':'completed','result':{'url':'https://cdn.example/image.png'},'billing':{'gems_charged':7}}]
        with patch.object(server,'fetch',side_effect=responses) as f:
            result=server.generate(self.req(),'TEST_ONLY');self.assertEqual(result['usage']['gems_charged'],7);self.assertEqual(f.call_count,3);self.assertEqual(f.call_args_list[0].args[1],'POST');self.assertIn('Idempotency-Key',f.call_args_list[0].args[4])
    def test_mage_block_stops(self):
        with patch.object(server,'fetch',return_value={'request_id':'no','status':'blocked','error':'policy'}) as f:
            with self.assertRaises(ValueError):server.generate(self.req(),'TEST_ONLY')
            self.assertEqual(f.call_count,1)
    def test_openrouter_image(self):
        with patch.object(server,'fetch',return_value={'data':[{'b64_json':IMAGE.split(',',1)[1],'media_type':'image/png'}],'usage':{'cost':0}}):
            self.assertEqual(server.generate(self.req('openrouter'),'TEST_ONLY')['image'],IMAGE)
    def test_openrouter_missing_image(self):
        with patch.object(server,'fetch',return_value={'data':[]}) as f:
            with self.assertRaises(ValueError):server.generate(self.req('openrouter'),'TEST_ONLY')
            self.assertEqual(f.call_count,1)
    def test_download_private_url(self):
        with self.assertRaises(ValueError):server.download_image('https://127.0.0.1/a.png')
if __name__=='__main__':unittest.main()
