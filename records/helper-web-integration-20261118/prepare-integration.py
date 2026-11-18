from pathlib import Path
import ast,gzip,hashlib,json
ROOT=Path('G:/somi/JO9sa/tools/modding-hub')
HERE=Path(__file__).resolve().parent
C=HERE/'candidate'
originals={}
for name in ('server.py','integration.mjs','Start-Modding-Hub.ps1'):
    (C/name).write_bytes((ROOT/name).read_bytes())
def update(name,old,new):
    target=C/name
    raw=target.read_bytes() if target.exists() else (ROOT/name).read_bytes()
    if name not in originals: originals[name]=(ROOT/name).read_bytes()
    text=raw.decode('utf-8-sig')
    if text.count(old)!=1:raise RuntimeError(f'Expected one anchor: {name}: {old[:70]}')
    text=text.replace(old,new,1)
    target.write_text(text,encoding='utf-8-sig' if name.endswith('.ps1') else 'utf-8',newline='\r\n' if name.endswith('.ps1') else '')

update('server.py','from appearance_sharing import AppearanceSharing','from appearance_sharing import AppearanceSharing\nfrom helper_dashboard import HelperDashboard')
update('server.py',"'server.py','image_tool_runtime.py'","'server.py','helper_dashboard.py','helper_dashboard_html.py','helper-dashboard.css','image_tool_runtime.py'")
update('server.py',' image_tools=ImageToolRuntime(repo,urls_file,lambda:base.paths().root)',' image_tools=ImageToolRuntime(repo,urls_file,lambda:base.paths().root)\n helper_dashboard=HelperDashboard(lambda:base.paths().root,HERE/\'runtime\')')
update('server.py',"   if route=='/workspace/config':return self.send_json(200,{'app':'jo9-modding-hub','build':build_id(),'studioRoot':str(studio_root),'tools':urls(),'game':base.game_status()})", "   if route=='/workspace/config':return self.send_json(200,{'app':'jo9-modding-hub','build':build_id(),'studioRoot':str(studio_root),'tools':{**urls(),'helperDashboard':'/workspace/helper/'},'game':base.game_status()})")
anchor="   if route=='/workspace/artifacts':"
routes='''   if route in ('/workspace/helper/', '/workspace/helper/index.html'):
    try:return self.blob(helper_dashboard.dashboard(),'text/html; charset=utf-8')
    except Exception as error:
     message=html.escape(str(error))
     page='<html lang="ko"><head><meta charset="utf-8"><link rel="stylesheet" href="/workspace/helper/dashboard.css"></head><body data-jo9-workspace="helper"><div class="card"><p>'+message+'</p><button onclick="location.reload()">다시 연결</button></div></body></html>'
     return self.blob(page.encode('utf-8'),'text/html; charset=utf-8',503)
   if route=='/workspace/helper/dashboard.css':return self.blob((HERE/'helper-dashboard.css').read_bytes(),'text/css; charset=utf-8')
   if route.startswith('/workspace/helper/api/'):
    try:
     status,mime,payload=helper_dashboard.fetch(route[len('/workspace/helper'):],url.query)
     self.send_response(status);self.send_header('Content-Type',mime);self.send_header('Content-Length',str(len(payload)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(payload);return
    except ValueError as error:return self.send_json(400,{'error':str(error)})
    except Exception as error:return self.send_json(502,{'error':'웹 대시보드 연결: '+str(error)})
'''
update('server.py',anchor,routes+anchor)
update('server.py',"   route=urlparse(self.path).path\n   master=", "   route=urlparse(self.path).path\n   if route.startswith('/workspace/helper/'):\n    return self.send_json(405,{'error':'통합 웹 대시보드는 세이브 조회 기능을 제공합니다.'})\n   master=")
update('server.py'," return http.server.ThreadingHTTPServer(('127.0.0.1',port),Handler)"," server=http.server.ThreadingHTTPServer(('127.0.0.1',port),Handler)\n original_close=server.server_close\n def close_with_helper():\n  helper_dashboard.close()\n  return original_close()\n server.server_close=close_with_helper\n return server")
update('integration.mjs'," framePanel('game-db',[['gameReference','특성·아이템·마법·MOB DB']]);", " framePanel('game-db',[['gameReference','특성·아이템·마법·MOB DB'],['helperDashboard','웹 대시보드']]);")
update('Start-Modding-Hub.ps1',"'server.py','image_tool_runtime.py'","'server.py','helper_dashboard.py','helper_dashboard_html.py','helper-dashboard.css','image_tool_runtime.py'")
for name in ('server.py','helper_dashboard.py','helper_dashboard_html.py'):ast.parse((C/name).read_text('utf8'))
pyfiles=ast.parse((C/'server.py').read_text('utf8'))
pylist=next(n.iter for n in ast.walk(pyfiles) if isinstance(n,ast.For) and isinstance(n.target,ast.Name) and n.target.id=='name')
expected=ast.literal_eval(pylist)
import re
ps=(C/'Start-Modding-Hub.ps1').read_text('utf-8-sig')
pslist=re.search(r'foreach \(\$name in @\((.*?)\)\)',ps).group(1)
assert expected==re.findall(r"'([^']+)'",pslist)
(HERE/'before').mkdir(exist_ok=True)
for name,raw in originals.items():(HERE/'before'/f'{name}.gz').write_bytes(gzip.compress(raw))
(HERE/'integration-prepared.json').write_text(json.dumps({'sourceHashes':{name:hashlib.sha256(raw).hexdigest() for name,raw in originals.items()},'changedFiles':list(originals),'newFiles':['helper_dashboard.py','helper_dashboard_html.py','helper-dashboard.css'],'buildListsEqual':True},indent=2),'utf8')
print(json.dumps({'prepared':True,'changedFiles':list(originals),'buildListsEqual':True}))
