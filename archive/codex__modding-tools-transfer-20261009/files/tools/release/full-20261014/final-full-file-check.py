from pathlib import Path
import os,json,hashlib,datetime,sys
sys.stdout.reconfigure(encoding='utf-8')
HERE=Path(__file__).parent;REPO=Path(r'C:\Users\Ken Choung\.codex\worktrees\modding-tools-transfer\JO9sa')
record_path=HERE/'full-release-record.json';r=json.loads(record_path.read_text(encoding='utf-8'));root=Path(r['folder']);source=Path(r['source']);game=source/'game'
resources=HERE/'release-resources';portable=HERE/'release-workshop'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
known={x['source_relative'] for x in load(resources/'known-exclusions.json')['items']};adapters=load(portable/'package-files.json')
expected={};badparts={'__jo9_imagebackups','__jo9_snkmod_state','modworkpic','picture_modding','testing','ui-backups','exebackup','__pycache__','.git'}
def omit(rel):
 p=Path(rel);name=p.name.lower()
 return any(x.lower() in badparts for x in p.parts) or '.bak' in name or name.endswith(('.zip','.7z','.rar','.log','.sav','.tmp','.pyc','.qsrc','.qproj','.exp','.lib')) or name.startswith('thumbs.db') or name=='.ds_store' or rel in known
def walk(folder):
 for base,dirs,files in os.walk(folder,followlinks=False):
  dirs[:]=[d for d in dirs if d.lower() not in badparts and not (Path(base)/d).is_symlink() and not (Path(base)/d).is_junction()]
  for name in files:yield Path(base)/name
for name in ['Jack-o-nine-tails.exe','FastQSP.ini']:expected[name]=source/name
for name in ['jack.qsp','config.xml','icon.ico']:expected['game/'+name]=game/name
for folder in ['content','css','fonts','json','engine']:
 for p in walk(game/folder):
  rel=p.relative_to(game).as_posix()
  if omit(rel) or rel.startswith('engine/') and rel.removeprefix('engine/') in adapters['exclude_optional_engine']:continue
  expected['game/'+rel]=p
for x in load(resources/'canonical-missing-copy.json')['items']:expected['game/'+x['target_relative']]=game/x['source_relative']
original_hash={}
for x in load(resources/'original-cuts-selected.json')['items']:
 rel='game/'+x['target_relative'];expected[rel]=None;original_hash[rel]=x['sha256']
tool=game/'modtools'
for name in ['JO9_Launch.cmd','JO9_Detect.ps1','JO9_Server.ps1','config.json','filters.json','button_template.png','mob template.png','VERSION.txt','pixelpure_optimizer.html']:expected['game/modtools/'+name]=tool/name
expected['game/modtools/place/JO9_Place_Workshop.html']=tool/'place/JO9_Place_Workshop.html'
editor=tool/'text-workshop'
for p in editor.iterdir():
 if not p.is_file() or omit(p.name) or '.test.' in p.name or p.name in ['test.cjs','workspace-launcher.json'] or p.suffix.lower() not in ['.cjs','.js','.html','.json','.ps1','.cmd']:continue
 expected['game/modtools/text-workshop/'+p.name]=p
for p in walk(editor/'assets'):expected['game/modtools/text-workshop/'+p.relative_to(editor).as_posix()]=p
expected['game/modtools/image-original-cuts.json']=None
for x in adapters['files']:expected[x['target']]=portable/x['source']
for x in adapters['runtime_dlls']:expected[x['target']]=Path(x['source_absolute'])
expected['game/modtools/runtime-bundle/node.exe']=Path(r'C:\Users\Ken Choung\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe')
expected['game/modtools/runtime-bundle/NODE-LICENSE.txt']=portable/'NODE-LICENSE.txt'
for name in ['catalog_merge_vs_original.html','catalog_work_ids.json','catalog_cuts.js','catalog_work_codes.js','catalog_workshop.js','catalog_editor.js','catalog_pic.js','catalog_local_pic.js','catalog_grok.js','catalog_path_aliases.json','catalog_status.js']:expected['game/modtools/catalog/'+name]=None
expected['README_KO.txt']=None;expected['BUILD_MANIFEST.json']=None
actual={p.relative_to(root).as_posix():p for p in walk(root)}
extra=sorted(actual.keys()-expected.keys());missing=sorted(expected.keys()-actual.keys())
assert not missing,missing
assert not extra,extra
assert len(actual)==33360,len(actual)
def digest(p):
 h=hashlib.sha256();n=0
 with p.open('rb') as f:
  while b:=f.read(4*1024*1024):h.update(b);n+=len(b)
 return h.hexdigest(),n
changes={x for x in load(resources/'snk-runtime-path-replacements.json')['files']}
files=[];total=0
for i,(rel,p) in enumerate(sorted(actual.items()),1):
 if rel=='BUILD_MANIFEST.json':continue
 h,n=digest(p);src=expected[rel]
 if src and rel.removeprefix('game/') not in changes:assert digest(src)[0]==h,'Mismatch vs source: '+rel
 if rel in original_hash:assert original_hash[rel]==h,rel
 files.append({'path':rel,'bytes':n,'sha256':h});total+=n
 if i%5000==0:print('Full verified',i,flush=True)
created=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat()
manifest={'version':'2.4.0.0','createdKST':created,'source_qsp_sha256':r['source_qsp_sha256'],'file_count_excluding_manifest':len(files),'files':files}
mp=root/'BUILD_MANIFEST.json';mp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');h,n=digest(mp);files.append({'path':'BUILD_MANIFEST.json','bytes':n,'sha256':h});total+=n
r.update(stage=str(root),files=len(files),uncompressed_bytes=total,files_manifest=files,phase='complete folder; ZIP cancelled by user',zip=None,completedKST=created,full_file_verification=True)
record_path.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'folder':str(root),'files':len(files),'bytes':total,'GiB':round(total/1024**3,2),'all_expected_files_present':True,'all_selected_source_hashes_match':True,'ZIP_created':False},ensure_ascii=False),flush=True)
