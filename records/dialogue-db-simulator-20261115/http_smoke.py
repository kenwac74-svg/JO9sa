from pathlib import Path
import sys,tempfile,threading,json
from http.client import HTTPConnection
H=Path('G:/somi/JO9sa/tools/modding-hub')
sys.path.insert(0,'G:/somi/JO9sa/tools/modding-hub');sys.path.insert(0,str(H));sys.path.insert(0,str(H/'tests'))
import server
from master_editor import make_fixture,QspDocument
from test_general_dialogue import DATA
with tempfile.TemporaryDirectory() as tmp:
 root=Path(tmp);(root/'json/slaves').mkdir(parents=True);(root/'content/pic/girls/full').mkdir(parents=True);(root/'jack.qsp').write_bytes(make_fixture({'#txt_man':DATA,'elsewhere':'Unchanged'}));(root/'json/slaves/3100_test.json').write_text('{"seed_name":"Test","seed_age":0}','utf-8')
 urls=root/'urls.json';urls.write_text('{}','utf-8');http=server.create_server('G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab','G:/somi/JO9sa',urls,0)
 sys.modules['studio_server'].game_root=lambda:(str(root),'test');threading.Thread(target=http.serve_forever,daemon=True).start()
 def request(path,body=None):
  conn=HTTPConnection('127.0.0.1',http.server_port);conn.request('GET' if body is None else 'POST',path,body=json.dumps(body).encode('utf-8') if body is not None else None,headers={'Content-Type':'application/json'} if body is not None else {});res=conn.getresponse();raw=res.read();conn.close();assert res.status==200,(res.status,raw);return json.loads(raw)
 assert request('/api/general-dialogue/meta')['rows']==2
 row=request('/api/general-dialogue/search?question=1112')['rows'][0]
 before=(root/'jack.qsp').read_bytes();assert request('/api/general-dialogue/save',{'id':row['id'],'revision':row['revision'],'text':'Manual edit','dryRun':True})['changes'];assert (root/'jack.qsp').read_bytes()==before
 saved=request('/api/general-dialogue/save',{'id':row['id'],'revision':row['revision'],'text':'Manual edit'});assert saved['saved'];assert QspDocument((root/'jack.qsp').read_bytes()).body('elsewhere')=='Unchanged'
 request('/api/talkbook/3100',{'book':{'lines':{'general.1112':'Independent impression','partners':'Existing slot'},'refs':{},'background':{}}})
 book=request('/api/talkbook/3100')['book'];assert book['lines']['general.1112']=='Independent impression' and book['lines']['partners']=='Existing slot'
 http.shutdown();http.server_close();print('HTTP PASS: general DB meta/search/dryRun/save; original talkbook accepts general slots without a new schema; isolated fixture only')
