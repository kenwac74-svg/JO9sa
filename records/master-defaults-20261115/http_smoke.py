from pathlib import Path
import sys,tempfile,threading,json,http.client,importlib.util,hashlib
from http.client import HTTPConnection
H=Path('G:/somi/JO9sa/tools/modding-hub');sys.path.insert(0,str(H))
import server,master_editor as m
sys.path.insert(0,str(H/'tests'))
from test_master_editor import BODY
with tempfile.TemporaryDirectory() as tmp:
 root=Path(tmp);(root/'json/slaves').mkdir(parents=True);(root/'content/pic/girls/full').mkdir(parents=True)
 (root/'jack.qsp').write_bytes(m.make_fixture({'#masters_base':BODY,'init_game':"master_medic = 0\n$master_ring = 'none'\n",'hero_description':"master_energy = master_str + 1\n$secondary_stt = ''\n",'start_game':"is_kid = 0\ngs '#npc_base'\n",'elsewhere':'Unchanged'}))
 (root/'json/slaves/3100_sample.json').write_text(json.dumps({'seed_name':'Sample','seed_stamina':4,'seed_gladiatrix':5}),'utf-8')
 urls=root/'urls.json';urls.write_text('{}','utf-8')
 http=server.create_server('G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab','G:/somi/JO9sa',urls,0)
 base=sys.modules['studio_server'];base.game_root=lambda:(str(root),'test')
 thread=threading.Thread(target=http.serve_forever,daemon=True);thread.start();url='http://127.0.0.1:'+str(http.server_port)
 def request(path,body=None):
  c=HTTPConnection('127.0.0.1',http.server_port);c.request('GET' if body is None else 'POST',path,body=None if body is None else json.dumps(body).encode('utf-8'),headers={} if body is None else {'Content-Type':'application/json'})
  r=c.getresponse();raw=r.read();c.close();assert r.status==200,(r.status,raw);return json.loads(raw)
 assert len(request('/api/master/chars')['items'])==2
 a=request('/api/master/101');assert a['master']['name']=='Woman' and a['choices']['hair']
 r=request('/api/master/101/fields',{'revision':a['revision'],'master':{**a['master'],'description':'Edited background'}});assert r['saved'] and r['character']['choices']['hair']
 a=request('/api/char/3100');assert a['mappings'] and a['initialCatalog']['fields']
 r=request('/api/char/3100/fields',{'revision':a['revision'],'set':{'seed_stamina':3},'master':{**a['master'],'description':'Convert me'},'initials':{'master_energy':3,'$master_ring':'ring_test'}})
 assert r['character']['data']['seed_stamina']==3 and r['character']['master']['description']=='Convert me'
 from PIL import Image
 import io,base64
 out=io.BytesIO();Image.new('RGBA',(40,40),(10,180,90,255)).save(out,'PNG');src='data:image/png;base64,'+base64.b64encode(out.getvalue()).decode()
 image=request('/api/char/3100/images',{'revision':r['character']['revision'],'slots':{'base':{'src':src}}})
 assert image['character']['master']['description']=='Convert me' and image['character']['mappings'] and image['character']['initialOverrides']['master_energy']==3
 r={'character':image['character']}
 r=request('/api/role/slave/3100/clone',{'revision':r['character']['revision'],'targetRole':'master','newId':102,'gender':'female','name':'Copy master','include':['background','stats']})
 copied=request('/api/master/102');assert r['role']=='master' and copied['master']['description']=='Convert me' and copied['initialOverrides']['master_energy']==3
 a=request('/api/master/1');before=(root/'jack.qsp').read_bytes();preview=request('/api/master/1/fields',{'revision':a['revision'],'initials':{'master_energy':2},'dryRun':True});assert preview['changes'] and before==(root/'jack.qsp').read_bytes()
 saved=request('/api/master/1/fields',{'revision':a['revision'],'initials':{'master_energy':2,'$master_ring':'test'}});assert saved['character']['initialOverrides']['master_energy']==2
 reset=request('/api/master/1/fields',{'revision':saved['character']['revision'],'initials':{'master_energy':None,'$master_ring':None}});assert reset['character']['initialOverrides']=={}
 a=request('/api/master/101');r=request('/api/role/master/101/clone',{'revision':a['revision'],'targetRole':'slave','newId':3101,'name':'Copy slave','slug':'copy','include':['background','stats']})
 assert request('/api/char/3101')['data']['seed_name']=='Copy slave'
 assert m.QspDocument((root/'jack.qsp').read_bytes()).body('elsewhere')=='Unchanged'
 http.shutdown();http.server_close()
 print('HTTP PASS: list/read, master QSP save, slave seed+master profile save, bidirectional clone; isolated fixture only')
