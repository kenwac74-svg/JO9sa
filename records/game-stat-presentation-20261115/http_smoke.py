from pathlib import Path
import sys,tempfile,threading,json
from http.client import HTTPConnection
H=Path('G:/somi/JO9sa/tools/modding-hub');sys.path[:0]=[str(H),str(H/'tests')]
import server
from master_editor import make_fixture
from test_master_editor import BODY
with tempfile.TemporaryDirectory() as tmp:
 root=Path(tmp);(root/'json/slaves').mkdir(parents=True);(root/'content/pic/girls/full').mkdir(parents=True)
 (root/'jack.qsp').write_bytes(make_fixture({'#masters_base':BODY,'get_stock_seed':"stock['moral'] = seed_moral[stock_type]",'#static_base':"$_font_col_skill[5] = '<font color=\"#009900\">'",'#variative':"$pride[0] = dyneval($vb_cycle_skill, 5, 'open')"}))
 (root/'json/slaves/3100_test.json').write_text('{"seed_name":"Test","seed_age":0,"seed_moral":3}','utf-8')
 urls=root/'urls.json';urls.write_text('{}','utf-8');http=server.create_server('G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab','G:/somi/JO9sa',urls,0)
 sys.modules['studio_server'].game_root=lambda:(str(root),'test');threading.Thread(target=http.serve_forever,daemon=True).start()
 def request(path,body=None,status=200):
  conn=HTTPConnection('127.0.0.1',http.server_port);conn.request('GET' if body is None else 'POST',path,body=json.dumps(body).encode('utf-8') if body is not None else None,headers={'Content-Type':'application/json'} if body is not None else {});res=conn.getresponse();raw=res.read();conn.close();assert res.status==status,(res.status,raw);return json.loads(raw)
 try:
  assert request('/api/game-presentation')['values']['pride']['0']['index']==5
  before=(root/'jack.qsp').read_bytes();original=(root/'json/slaves/3100_test.json').read_bytes();ch=request('/api/char/3100');sim={'rate.moral':123,'fear':2,'psy_status':'soft'}
  b={'simulation':sim,'revision':ch['revision']};assert request('/api/char/3100/fields',{**b,'dryRun':True})['changes'];assert request('/api/char/3100')['simulation']=={}
  saved=request('/api/char/3100/fields',b);assert saved['character']['simulation']==sim
  request('/api/char/3100/fields',b,status=400)
  ch=saved['character'];request('/api/char/3100/fields',{'revision':ch['revision'],'simulation':{'x':1}},status=400)
  assert (root/'jack.qsp').read_bytes()==before and (root/'json/slaves/3100_test.json').read_bytes()==original
  ch=request('/api/master/1');saved=request('/api/master/1/fields',{'revision':ch['revision'],'simulation':sim});assert saved['character']['simulation']==sim and (root/'jack.qsp').read_bytes()==before
  print('HTTP PASS: metadata, slave/master simulation roundtrip, dry run, stale/invalid rejection; QSP and character JSON untouched in isolated fixture.')
 finally:http.shutdown();http.server_close()
