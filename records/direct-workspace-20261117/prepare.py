from pathlib import Path
import gzip,hashlib,json,re
HERE=Path(__file__).resolve().parent;HUB=Path('G:/somi/JO9sa/tools/modding-hub');OUT=HERE/'candidate'
def one(s,old,new):
 assert s.count(old)==1,(old[:100],s.count(old));return s.replace(old,new,1)
def put(name,s):
 out=OUT/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(s.encode('utf-8-sig' if name.endswith('.ps1') else 'utf-8'))
modules=json.loads((HERE/'modules/manifest.json').read_text('utf-8'))
for row in modules['files']:
 original=Path(row['source']).read_bytes();assert hashlib.sha256(original).hexdigest()==row['sourceBeforeSha256']
 candidate=Path(row['candidate']).read_bytes();assert hashlib.sha256(candidate).hexdigest()==row['afterSha256']
 target=OUT/'overrides'/row['name'];target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(candidate)

s=(HUB/'integration.mjs').read_text('utf-8')
start=s.index('const MENUS=[');end=s.index('\n];',start)+3;s=s[:start]+s[end:]
s=one(s,'export async function installWorkspace(api){','export async function installWorkspace(api){\n const MENUS=api.menus;')
s=one(s," const css=document.createElement('link');css.rel='stylesheet';css.href='/workspace/integration.css';document.head.append(css);\n const {createStudioView}=await import(new URL('studio-view.mjs',document.baseURI).href);\n await createStudioView(globalThis.__jo9StudioApi,{role:'master'});"," const css=document.querySelector('link[href=\"/workspace/integration.css\"]');")
s=one(s," document.querySelector('.sidebar-bottom p').textContent='기존 도구 연결 · WORK\\n각 도구의 설정과 저장 기능 유지';"," document.querySelector('.sidebar-bottom p').textContent='WORK · 캐릭터·대사·이미지·게임 DB 통합 편집';")
s=s.replace('<h2>기존 보조 도구</h2>','<h2>보조 도구</h2>')
s=one(s," document.addEventListener('click',event=>{"," document.addEventListener('click',async event=>{")
s=one(s,"if(target.dataset.simQuestion||target.dataset.simSection){globalThis.__jo9StudioApi?.charView?.openSection?.", "if(target.dataset.simQuestion||target.dataset.simSection){await api.ensureTab('character');globalThis.__jo9StudioApi?.charView?.openSection?.")
s=one(s," window.addEventListener('hashchange',sync);"," window.addEventListener('hashchange',sync);\n window.addEventListener('jo9-workspace-tab',sync);")
s=one(s," // The original startup does not know workspace-only hashes; restore the user's requested page now.\n const requested=globalThis.__jo9WorkspaceInitialHash;\n api.switchTab(requested&&api.tabNames[requested]?requested:api.getTab());sync();", " const requested=api.getInitialTab();\n await api.switchTab(requested||'character');sync();")
put('integration.mjs',s)
s=(HUB/'overrides/general-dialogue.mjs').read_text('utf-8')
s=one(s,"if(a==='use'&&st.detail){const sim=globalThis.__jo9StudioApi?.charView;","if(a==='use'&&st.detail){await api.ensureTab('character');const sim=globalThis.__jo9StudioApi?.charView;")
put('overrides/general-dialogue.mjs',s)

extra="'workspace.html','workspace-app.mjs','workspace-router.mjs','workspace-menu.json','overrides/workbench.mjs','overrides/trait-editor.mjs','overrides/studio-save.mjs','overrides/studio-db.mjs','overrides/studio-ai.mjs',"
s=(HUB/'server.py').read_text('utf-8')
s=one(s,'import argparse,hashlib,http.server,importlib,json,mimetypes,os,sys,threading','import argparse,hashlib,html,http.server,importlib,json,mimetypes,os,sys,threading')
s=one(s,"'embedded-tools.css',","'embedded-tools.css',"+extra)
render='''def render_workspace():
 menus=json.loads((HERE/'workspace-menu.json').read_text('utf-8'))
 esc=lambda value:html.escape(str(value),quote=True)
 nav=[]
 for menu in menus:
  mid=esc(menu['id'])
  nav.append(f'<button type="button" class="nav-button" data-tab="{mid}" data-workspace-main="{mid}"><span>{esc(menu["icon"])}</span>{esc(menu["label"])}</button>')
  if menu.get('children'):
   buttons=''.join(f'<button type="button" class="nav-button" data-tab="{esc(key)}">{esc(label)}</button>' for key,label in menu['children'])
   nav.append(f'<div class="workspace-subnav" data-workspace-parent="{mid}" hidden>{buttons}</div>')
 config=json.dumps(menus,ensure_ascii=False).replace('<','\\\\u003c')
 return (HERE/'workspace.html').read_text('utf-8').replace('<!--WORKSPACE_NAV-->',''.join(nav)).replace('<!--WORKSPACE_MENUS-->',config).encode('utf-8')

'''
s=one(s,'def create_server(studio_root,repo,urls_file,port=0):',render+'def create_server(studio_root,repo,urls_file,port=0):')
needle="   native=route.split('/',3)[3] if route.startswith('/v/') and len(route.split('/',3))>3 else route.lstrip('/')"
s=one(s,needle,needle+'''
   if route in ('/','/index.html'):
    self.send_response(302);self.send_header('Location','/v/'+build_id()+'/'+('?' + url.query if url.query else ''));self.send_header('Content-Length','0');self.end_headers();return
   if native in ('','index.html'):return self.blob(render_workspace(),'text/html; charset=utf-8')
   if native in ('workspace-app.mjs','app.mjs'):return self.blob((HERE/'workspace-app.mjs').read_bytes(),'text/javascript; charset=utf-8')
   if native=='workspace-router.mjs':return self.blob((HERE/'workspace-router.mjs').read_bytes(),'text/javascript; charset=utf-8')''')
start=s.index("   if native=='app.mjs':");end=s.index("   if route in ['/workspace/integration.mjs'",start)
s=s[:start]+s[end:]
s=one(s,"if native in ['past-history.mjs'","if native in ['workbench.mjs','trait-editor.mjs','studio-save.mjs','studio-db.mjs','studio-ai.mjs','past-history.mjs'")
put('server.py',s)
s=(HUB/'Start-Modding-Hub.ps1').read_text('utf-8-sig');s=one(s,"'embedded-tools.css',","'embedded-tools.css',"+extra);put('Start-Modding-Hub.ps1',s)

items=[]
for out in sorted(OUT.rglob('*')):
 if not out.is_file():continue
 relative=out.relative_to(OUT);target=HUB/relative;before=target.read_bytes() if target.exists() else None
 if before is not None:
  back=HERE/'before'/Path(str(relative)+'.gz');back.parent.mkdir(parents=True,exist_ok=True);back.write_bytes(gzip.compress(before))
 items.append({'path':relative.as_posix(),'before':hashlib.sha256(before).hexdigest() if before is not None else None,'after':hashlib.sha256(out.read_bytes()).hexdigest()})
(HERE/'change-manifest.json').write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'candidateFiles':len(items),'newEntry':'workspace-app.mjs','oldBootstrapRemoved':True}))
