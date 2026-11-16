"""Sidebar extension; delegates every existing studio API to the unmodified server."""
import argparse,hashlib,http.server,importlib,json,mimetypes,os,sys,threading
from pathlib import Path
from urllib.parse import unquote,urlparse,parse_qs
import registry
from image_tool_runtime import ImageToolRuntime
from master_editor import MasterEditor, MAPPINGS
import master_initials as initials
from general_dialogue import GeneralDialogueDB
from game_presentation import read_metadata,validate_simulation
from runtime_initials import RuntimeInitials

HERE=Path(__file__).resolve().parent
def build_id():
 h=hashlib.sha256()
 for name in ['server.py','image_tool_runtime.py','Start-Image-Tool.ps1','tool-runtime.mjs','registry.py','integration.mjs','integration.css','app_launcher.py','embedded-tools.css','overrides/studio-look.mjs','overrides/studio-look-geometry.mjs','master_editor.py','master_initials.py','general_dialogue.py','overrides/character-view.mjs','overrides/general-dialogue.mjs','overrides/studio-view.mjs','overrides/studio-role.mjs','game_presentation.py','overrides/game-presentation.mjs','overrides/initial-preview.mjs','runtime_initials.py','runtime-initials.cjs','acquisition-routes-runtime.json','overrides/runtime-initials.mjs','vendor/qsp/wasm-engine.cjs','vendor/qsp/qsp-engine.wasm']:
  h.update((HERE/name).read_bytes())
 return h.hexdigest()[:16]
def create_server(studio_root,repo,urls_file,port=0):
 studio_root=Path(studio_root).resolve();repo=Path(repo).resolve()
 sys.path.insert(0,str(studio_root));base=importlib.import_module('studio_server')
 cached=[];catalog_lock=threading.Lock()
 def catalog(refresh=False):
  nonlocal cached
  with catalog_lock:
   if not cached or refresh:cached=registry.catalog_rows(registry.default_roots(repo))
   return cached
 runtime_initials=RuntimeInitials()
 image_tools=ImageToolRuntime(repo,urls_file,lambda:base.paths().root)
 def urls():
  try:return json.loads(Path(urls_file).read_text('utf-8-sig'))
  except (OSError,ValueError):return {}
 def store():return MasterEditor(base.paths().root,backend=base.api)
 def dialogue_db():return GeneralDialogueDB(base.paths().root,backend=base.api)
 def decorate_slave(sid):
  ch=base.read_character(sid);editor=store();profile=editor.slave_profile(sid)
  ch.update(role='slave',master=editor.master_from_slave(ch['data'],profile),revision=editor.slave_revision(sid),nativeDefaults=editor.native_defaults())
  ch['initialOverrides']=profile.get('initialOverrides',{});ch['initialCatalog']=editor.initial_catalog(ch['master'],overrides=ch['initialOverrides'])
  ch['simulation']=profile.get('simulation',{});ch['mappings']=editor.mapping_rows('slave',ch['data'],ch['master']);return ch
 def read_master(sid):
  ch=store().read(sid);ch['choices']=base.choices();return ch
 def save_slave(sid,body):
  editor=store();editor._check_revision('slave',sid,body.get('revision'))
  pending=base.save_fields(sid,{**body,'dryRun':True});profile=editor.slave_profile(sid)
  before=profile.get('master',editor.master_from_slave(base.read_character(sid)['data'],profile))
  master=body.get('master');changes=list(pending['changes'])
  if 'simulation' in body:
   sim=validate_simulation(body['simulation']);old=profile.get('simulation',{})
   changes += [{'key':'simulation.'+k,'before':old.get(k),'after':sim.get(k)} for k in set(old)|set(sim) if old.get(k)!=sim.get(k)]
   profile['simulation']=sim
  if body.get('initials'):
   previous=profile.get('initialOverrides',{});fields=editor.initial_catalog(master or before,overrides=previous)['fields']
   updated=initials.merge_changes(fields,previous,body['initials']);profile['initialOverrides']=updated
   changes += [{'key':'initial.'+k,'before':previous.get(k),'after':updated.get(k)} for k in set(previous)|set(updated) if previous.get(k)!=updated.get(k)]
  if master is not None:
   from master_editor import validate_master
   validate_master(master)
   changes += [{'key':'master.'+k,'before':before.get(k),'after':v} for k,v in master.items() if before.get(k)!=v]
   profile['master']=master
  if changes and not body.get('dryRun'):
   filename,data=editor.slave(sid);data=dict(data)
   for c in pending['changes']:
    if c['after'] is None:data.pop(c['key'],None)
    else:data[c['key']]=c['after']
   payloads={}
   if pending['changes']:
    payloads[filename]=json.dumps(data,ensure_ascii=False,indent=4).encode('utf-8')
    backup=filename.with_name(filename.name+'.bak')
    if not backup.exists():payloads[backup]=filename.read_bytes()
   if master is not None or body.get('initials') or 'simulation' in body:payloads[editor._profile_file('slave',sid)]=json.dumps(profile,ensure_ascii=False,indent=2).encode('utf-8')
   editor._write(payloads)
   base.work_log(base.paths()).event('studio_role_fields',id=int(sid),changed=[c['key'] for c in changes])
  return {'changes':changes,'saved':bool(changes) and not body.get('dryRun'),'dryRun':bool(body.get('dryRun')),'character':None if body.get('dryRun') else decorate_slave(sid)}
 class Handler(base.StudioHandler):
  def blob(self,body,mime,status=200):
   self.send_response(status);self.send_header('Content-Type',mime);self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
  def do_GET(self):
   url=urlparse(self.path);route=url.path
   native=route.split('/',3)[3] if route.startswith('/v/') and len(route.split('/',3))>3 else route.lstrip('/')
   if native=='character-view.mjs':return self.blob((HERE/'overrides/character-view.mjs').read_bytes(),'text/javascript; charset=utf-8')
   if route=='/workspace/general-dialogue.mjs':return self.blob((HERE/'overrides/general-dialogue.mjs').read_bytes(),'text/javascript; charset=utf-8')
   if native=='studio-view.mjs':
    text=(HERE/'overrides/studio-view.mjs').read_text('utf-8')
    marker='<button class="button secondary st-tosim"'
    button='<button class="button secondary" data-workspace-image-search="${e(c.jsonFile)}" data-image-path="${e(c.data.fullimage || c.data.seed_ava_clear || \'\')}" data-image-id="${e(c.id)}" title="캐릭터 파일명 키워드를 이미지 검색창에 넣습니다. 검색은 직접 누르세요.">이미지 검색어 보내기</button>'
    return self.blob(text.replace(marker,button+marker,1).encode(),'text/javascript; charset=utf-8')
   if native in ['studio-look.mjs','studio-look-geometry.mjs','studio-role.mjs','game-presentation.mjs','initial-preview.mjs','runtime-initials.mjs']:
    return self.blob((HERE/'overrides'/native).read_bytes(),'text/javascript; charset=utf-8')
   if native=='app.mjs':
    addon="\nawait (await import('/workspace/integration.mjs')).installWorkspace({tabNames,switchTab,getTab:()=>tab});\n"
    prefix="globalThis.__jo9WorkspaceInitialHash=location.hash.slice(1);\n"
    return self.blob(prefix.encode()+(base.DIST/'app.mjs').read_bytes()+addon.encode(),'text/javascript; charset=utf-8')
   if route in ['/workspace/integration.mjs','/workspace/integration.css','/workspace/tool-runtime.mjs']:
    name=route.rsplit('/',1)[1];mime='text/javascript' if name.endswith('.mjs') else 'text/css'
    return self.blob((HERE/name).read_bytes(),mime+'; charset=utf-8')
   try:
    import re
    if route=='/api/game-presentation':return self.send_json(200,read_metadata(Path(base.paths().root)/'jack.qsp'))
    if route=='/api/general-dialogue/meta':return self.send_json(200,dialogue_db().meta())
    if route=='/api/general-dialogue/search':return self.send_json(200,dialogue_db().search({k:v[-1] for k,v in parse_qs(url.query).items()}))
    if route=='/api/general-dialogue/row':return self.send_json(200,dialogue_db().row(parse_qs(url.query).get('id',[''])[0]))
    if route=='/api/master/chars':return self.send_json(200,{'items':store().list(),'choices':base.choices()})
    match=re.fullmatch(r'/api/master/(\d+)',route)
    if match:return self.send_json(200,read_master(match[1]))
    match=re.fullmatch(r'/api/master/(\d+)/talkbook',route)
    if match:return self.send_json(200,store().talk(match[1]))
    match=re.fullmatch(r'/api/char/(\d+)',route)
    if match:return self.send_json(200,decorate_slave(match[1]))
   except Exception as error:return self.fail(error)
   if route=='/workspace/config':return self.send_json(200,{'app':'jo9-modding-hub','build':build_id(),'studioRoot':str(studio_root),'tools':urls(),'game':base.game_status()})
   if route=='/workspace/artifacts':
    try:return self.send_json(200,{'items':catalog('refresh=1' in url.query)})
    except Exception as error:return self.fail(error)
   if route.startswith('/workspace/fs/'):
    try:
     value=unquote(route[len('/workspace/fs/'):]);game=base.game_root()[0]
     roots=[repo/'assets',repo/'docs',Path(game)/'content/pic',Path(game)/'content/snd'] if game else [repo/'assets',repo/'docs']
     sound=urls().get('soundList')
     rows=catalog()
     if sound and Path(sound).is_file():rows=rows+[{'path':sound,'copies':[sound]}]
     target=registry.resolve_file(value,rows,roots);raw=target.read_bytes();mime=mimetypes.guess_type(str(target))[0] or 'application/octet-stream'
     if target.suffix.lower() in ['.html','.htm']:
      text=raw.decode('utf-16' if raw.startswith((b'\xff\xfe',b'\xfe\xff')) else 'utf-8-sig',errors='replace')
      if sound and target==Path(sound).resolve():
       css=(HERE/'embedded-tools.css').read_text('utf-8')
       boot="document.documentElement.classList.toggle('jo9-embedded',new URLSearchParams(location.search).get('workspace')==='1');document.documentElement.classList.add('jo9-tool-sound');"
       text=text.replace('</head>','<style>'+css+'</style><script>'+boot+'</script></head>') if '</head>' in text else '<style>'+css+'</style><script>'+boot+'</script>'+text
      raw=registry.rewrite_html(text).encode('utf-8');mime='text/html; charset=utf-8'
     return self.blob(raw,mime)
    except Exception as error:return self.fail(error)
   return super().do_GET()
  def do_POST(self):
   import re
   route=urlparse(self.path).path
   master=re.fullmatch(r'/api/master/(\d+)/(fields|images|talkbook)',route)
   clone=re.fullmatch(r'/api/role/(slave|master)/(\d+)/clone',route)
   slave=re.fullmatch(r'/api/char/(\d+)/fields',route)
   slave_images=re.fullmatch(r'/api/char/(\d+)/images',route)
   general=route=='/api/general-dialogue/save'
   runtime=route=='/api/runtime-initials'
   image_tool=route=='/workspace/tools/ensure'
   if not (master or clone or slave or slave_images or general or runtime or image_tool):return super().do_POST()
   origin=self.headers.get('Origin')
   if origin and urlparse(origin).hostname not in ('127.0.0.1','localhost'):return self.send_json(403,{'error':'허용되지 않은 출처입니다.'})
   if self.headers.get('Content-Type','').split(';')[0].strip()!='application/json':return self.send_json(415,{'error':'JSON 요청만 받습니다.'})
   try:
    size=int(self.headers.get('Content-Length') or 0)
    if size<0 or size>base.MAX_BODY:raise ValueError('요청 크기가 잘못되었습니다.')
    body=json.loads(self.rfile.read(size).decode('utf-8') or '{}')
    if not isinstance(body,dict):raise ValueError('요청은 객체여야 합니다.')
    if image_tool:return self.send_json(200,image_tools.ensure(body.get('key')))
    if runtime:return self.send_json(200,runtime_initials.call(base.paths().root,body))
    with base._lock:
     editor=store()
     if general:result=dialogue_db().save(body)
     elif slave:result=save_slave(slave[1],body)
     elif slave_images:
      editor._check_revision('slave',slave_images[1],body.get('revision'))
      result=base.save_images(slave_images[1],body)
      if result.get('character'):result['character']=decorate_slave(slave_images[1])
     elif clone:result=editor.clone(clone[1],clone[2],body)
     elif master[2]=='fields':
      result=editor.save(master[1],body)
      if result.get('character'):result['character']['choices']=base.choices()
     elif master[2]=='talkbook':
      base.check_plain(body.get('book'));result=editor.talk(master[1],body)
     else:
      result=editor.images(master[1],body,base.decode_image,base.compose_slot,base.api.to_grayscale,base.api.to_sepia)
      if result.get('character'):result['character']['choices']=base.choices()
    return self.send_json(200,result)
   except Exception as error:return self.fail(error)
 return http.server.ThreadingHTTPServer(('127.0.0.1',port),Handler)
def main():
 p=argparse.ArgumentParser();p.add_argument('--studio',required=True);p.add_argument('--repo',required=True);p.add_argument('--urls',required=True);p.add_argument('--ready',required=True);p.add_argument('--port',type=int,default=7689);args=p.parse_args()
 server=create_server(args.studio,args.repo,args.urls,args.port);port=server.server_address[1]
 ready={'app':'jo9-modding-hub','pid':os.getpid(),'url':f'http://127.0.0.1:{port}/','build':build_id(),'studioRoot':str(Path(args.studio).resolve())}
 Path(args.ready).write_text(json.dumps(ready,ensure_ascii=False,indent=2),'utf-8');print(json.dumps(ready,ensure_ascii=False),flush=True)
 server.serve_forever()
if __name__=='__main__':main()
