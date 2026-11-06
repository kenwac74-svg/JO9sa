import unittest,sys,pathlib,base64
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]))
import server
class ContractTests(unittest.TestCase):
    def req(self,**kw):
        r=dict(provider='openrouter',model='test/model',image='data:image/png;base64,'+base64.b64encode(b'\x89PNG\r\n\x1a\nxx').decode(),prompt='Extend the blank area.',aspect_ratio='4:3')
        r.update(kw);return r
    def test_reference_payload(self):
        u,p=server.build_request(self.req())
        self.assertEqual(u,'https://openrouter.ai/api/v1/images')
        self.assertEqual(p['input_references'][0]['image_url']['url'],self.req()['image'])
        self.assertFalse(p['provider']['allow_fallbacks'])
    def test_mage_payload(self):
        u,p=server.build_request(self.req(provider='mage',route='mango',model='mango-v3-turbo',aspect_ratio='5:4'))
        self.assertEqual(u,'https://api.mage.space/v1/mango/generate')
        self.assertIn('image',p);self.assertEqual(p['model_id'],'mango-v3-turbo')
    def test_reject_unknown_provider(self):
        with self.assertRaises(ValueError):server.build_request(self.req(provider='http://evil/'))
    def test_reject_path_injection(self):
        with self.assertRaises(ValueError):server.build_request(self.req(provider='mage',route='../admin'))
    def test_data_url_only(self):
        with self.assertRaises(ValueError):server.build_request(self.req(image='http://127.0.0.1/private'))
    def test_poll_url_validation(self):
        self.assertEqual(server.safe_mage_url('/v1/requests/abc'),'https://api.mage.space/v1/requests/abc')
        for v in ['http://127.0.0.1/x','https://evil.test/x','https://api.mage.space@evil.test/x','https://api.mage.space:444/x']:
            with self.assertRaises(ValueError):server.safe_mage_url(v)
    def test_no_keys_in_payload(self):
        _,p=server.build_request(self.req(apiKey='SECRET'))
        self.assertNotIn('SECRET',str(p))
if __name__=='__main__':unittest.main()
