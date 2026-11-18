from pathlib import Path
import importlib.util,json,sys,threading,urllib.request,hashlib
HERE=Path(__file__).resolve().parent;HUB=Path('G:/somi/JO9sa/tools/modding-hub');CANDIDATE=HERE/'candidate' if (HERE/'candidate').exists() else HUB
sys.path.insert(0,str(HUB))
spec=importlib.util.spec_from_file_location('direct_candidate_server',CANDIDATE/'server.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class Overlay:
 def __truediv__(self,name):
  candidate=CANDIDATE/name
  return candidate if candidate.exists() else HUB/name
module.HERE=Overlay()
server=module.create_server('G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab',HUB.parent.parent,HUB/'runtime/tool-urls.json',0)
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();base=f'http://127.0.0.1:{server.server_address[1]}'
def get(route):
 with urllib.request.urlopen(base+route,timeout=10) as r:return r.status,r.url,r.read().decode('utf-8')
try:
 status,url,text=get('/');assert status==200;assert '/v/'+module.build_id()+'/' in url
 assert '<title>JO9 · 통합 모드 작업실</title>' in text
 assert 'src="./workspace-app.mjs"' in text and 'src="./app.mjs"' not in text
 assert not any(f'id="{x}"' in text for x in ['simulator','coefficients','archive','guide','character-json','traits'])
 assert '<!--WORKSPACE_' not in text
 prefix='/v/'+module.build_id()+'/'
 expected=(CANDIDATE/'workspace-app.mjs').read_bytes().decode('utf-8')
 for route in ['/workspace-app.mjs','/app.mjs',prefix+'workspace-app.mjs',prefix+'app.mjs']:
  code,_,data=get(route);assert code==200 and data==expected,route
 for name in ['workspace-router.mjs','coef-view.mjs','character-view.mjs','workbench.mjs','studio-view.mjs','trait-editor.mjs','studio-db.mjs','studio-save.mjs','studio-ai.mjs']:
  code,_,data=get(prefix+name);assert code==200 and len(data)>50,name
 report={'status':'PASS','build':module.build_id(),'rootAndVersionedNative':True,'legacyAppAliasesNative':True,'legacyPanelsAbsent':True,'moduleRoutes':9,'isolatedServerClosed':True}
 (HERE/'http-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report))
finally:server.shutdown();server.server_close();thread.join(timeout=3)
