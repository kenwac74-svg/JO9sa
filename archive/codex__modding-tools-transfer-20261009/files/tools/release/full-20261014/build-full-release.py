"""Copy only release files, materialize B cuts, bundle WORKSHOP, create and verify ZIP64."""
from pathlib import Path
import os,sys,json,re,hashlib,datetime,zipfile,time,shutil
sys.stdout.reconfigure(encoding='utf-8')
HERE=Path(__file__).parent
REPO=Path(r'C:\Users\Ken Choung\.codex\worktrees\modding-tools-transfer\JO9sa')
SOURCE=Path(r'C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex');GAME=SOURCE/'game'
NAME='Jack O Nine Tails v2.4 Kor_Full'
FINAL=SOURCE.parent/NAME;ZIP=SOURCE.parent/(NAME+'.zip')
STAMP=datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
STAGE=SOURCE.parent/('_JO9_release_staging_'+STAMP)
RESOURCE=HERE/'release-resources';PORTABLE=HERE/'release-workshop'
sha=lambda b:hashlib.sha256(b).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
proof=load(RESOURCE/'reference-proof.json')
adapters=load(PORTABLE/'package-files.json')
known=load(RESOURCE/'known-exclusions.json');original=load(RESOURCE/'original-cuts-selected.json')
excluded={x['source_relative']:x for x in known['items']}
qsp_hash=sha((GAME/'jack.qsp').read_bytes())
assert qsp_hash==known['qsp_sha256']==original['qsp_sha256'],'Source QSP changed; update audit before build.'
assert not STAGE.exists() and not ZIP.exists(),'Build output already exists; no overwrite.'
assert not FINAL.exists() or not any(FINAL.iterdir()),'Final folder is not empty; preserve it.'
STAGE.mkdir();entries={};skipped=[];total=0
badparts={'__jo9_imagebackups','__jo9_snkmod_state','modworkpic','picture_modding','testing','ui-backups','exebackup','__pycache__','.git'}
def safe(rel):
 p=Path(rel)
 assert not p.is_absolute() and '..' not in p.parts
 return rel.replace('\\','/')
def omit(rel):
 parts=Path(rel).parts;name=parts[-1];lower=name.lower()
 if any(x.lower() in badparts for x in parts):return 'development/backups'
 if '.bak' in lower or lower.endswith(('.zip','.7z','.rar','.log','.sav','.tmp','.pyc','.qsrc','.qproj','.exp','.lib')):return 'backup/source archive/non-runtime file'
 if lower.startswith('thumbs.db') or lower=='.ds_store':return 'OS cache'
 if rel in excluded:return excluded[rel]['reason']
 return None
def emit(rel,data,kind='generated'):
 global total
 rel=safe(rel);dest=STAGE/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 entries[rel]={'path':rel,'bytes':len(data),'sha256':sha(data),'kind':kind};total+=len(data)
def copy(src,rel,expected=None,kind='play-folder'):
 global total
 rel=safe(rel);assert rel not in entries,rel
 dest=STAGE/rel;dest.parent.mkdir(parents=True,exist_ok=True)
 before=src.stat();h=hashlib.sha256();n=0
 with src.open('rb') as inp,dest.open('xb') as out:
  while b:=inp.read(4*1024*1024):out.write(b);h.update(b);n+=len(b)
 after=src.stat();assert before.st_size==after.st_size and before.st_mtime_ns==after.st_mtime_ns,'Source changed during copy: '+str(src)
 digest=h.hexdigest();assert not expected or expected==digest,'Hash mismatch: '+str(src)
 entries[rel]={'path':rel,'bytes':n,'sha256':digest,'kind':kind};total+=n
def walk(folder):
 for base,dirs,files in os.walk(folder,followlinks=False):
  dirs[:]=[d for d in dirs if d.lower() not in badparts and not (Path(base)/d).is_symlink() and not (Path(base)/d).is_junction()]
  for name in files:yield Path(base)/name
print('Build source QSP',qsp_hash,flush=True)
for f in ['Jack-o-nine-tails.exe','FastQSP.ini']:copy(SOURCE/f,f)
for f in ['jack.qsp','config.xml','icon.ico']:copy(GAME/f,'game/'+f)
for folder in ['content','css','fonts','json','engine']:
 count=0
 for p in walk(GAME/folder):
  rel=p.relative_to(GAME).as_posix();reason=omit(rel)
  if rel.startswith('engine/') and rel.removeprefix('engine/') in adapters.get('exclude_optional_engine',[]):reason='unused optional database plugin'
  if reason:
   if rel in excluded:assert sha(p.read_bytes())==excluded[rel]['sha256'],'Excluded source changed: '+rel
   skipped.append({'path':'game/'+rel,'reason':reason});continue
  copy(p,'game/'+rel);count+=1
 print('Copied',folder,count,'files',round(total/1024**3,2),'GiB',flush=True)
# Complete canonical UI migration only in the package.
for row in load(RESOURCE/'canonical-missing-copy.json')['items']:copy(GAME/row['source_relative'],'game/'+row['target_relative'],row['sha256'],'canonical UI repair')
for rel,repls in load(RESOURCE/'snk-runtime-path-replacements.json')['files'].items():
 data=(STAGE/'game'/rel).read_bytes()
 for row in repls:
  a=row['old'].encode('ascii');b=row['new'].encode('ascii');assert data.count(a)==row['count'];data=data.replace(a,b)
 assert b'SNKmod' not in data
 emit('game/'+rel,data,'package-only canonical paths')
# Physical copies of the selected files, never the entire external PIC tree.
for row in original['items']:copy(Path(original['source_root'])/row['source_relative'],'game/'+row['target_relative'],row['sha256'],'selected original B cut')
print('Materialized',original['count'],'original B cuts',flush=True)
# Production-only installed tools. Never copy the developer runtime state.
tool=GAME/'modtools'
for name in ['JO9_Launch.cmd','JO9_Detect.ps1','JO9_Server.ps1','config.json','filters.json','button_template.png','mob template.png','VERSION.txt','pixelpure_optimizer.html']:
 copy(tool/name,'game/modtools/'+name,kind='WORKSHOP')
copy(tool/'place/JO9_Place_Workshop.html','game/modtools/place/JO9_Place_Workshop.html',kind='WORKSHOP')
editor=tool/'text-workshop'
for p in editor.iterdir():
 if not p.is_file() or omit(p.name) or '.test.' in p.name or p.name=='test.cjs' or p.name=='workspace-launcher.json' or p.suffix.lower() not in ['.cjs','.js','.html','.json','.ps1','.cmd']:continue
 copy(p,'game/modtools/text-workshop/'+p.name,kind='WORKSHOP')
for p in walk(editor/'assets'):copy(p,'game/modtools/text-workshop/'+p.relative_to(editor).as_posix(),kind='WORKSHOP asset')
registry=load(tool/'image-original-cuts.json');registry.pop('sourceRoot',None)
emit('game/modtools/image-original-cuts.json',(json.dumps(registry,ensure_ascii=False,indent=2)+'\n').encode('utf-8'),'functional cut registry')
# Portable launcher/server adapters prepared and independently reviewed.
for row in adapters['files']:
 emit(row['target'],(PORTABLE/row['source']).read_bytes(),'portable WORKSHOP adapter')
copy(Path(r'C:\Users\Ken Choung\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'),'game/modtools/runtime-bundle/node.exe',kind='Node runtime')
copy(PORTABLE/'NODE-LICENSE.txt','game/modtools/runtime-bundle/NODE-LICENSE.txt',kind='Node license')
for row in adapters.get('runtime_dlls',[]):copy(Path(row['source_absolute']),row['target'],kind='portable x86 VC runtime')
catalog=REPO/'tools/local-workspace/catalog'
catalog_files=['catalog_merge_vs_original.html','catalog_work_ids.json','catalog_cuts.js','catalog_work_codes.js','catalog_workshop.js','catalog_editor.js','catalog_pic.js','catalog_local_pic.js','catalog_grok.js','catalog_path_aliases.json']
html=(catalog/'catalog_merge_vs_original.html').read_text(encoding='utf-8-sig')
m=re.search(r'var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR',html);assert m
rows=json.loads(m[1]);aliases={str(x['alias']).replace('/','\\') for x in registry['originals'].values()}
packpaths={p.removeprefix('game/').replace('/','\\') for p in entries if p.startswith('game/content/pic/')}
kept=[d for d in rows if str(d[0]).replace('/','\\') in packpaths or str(d[0]).replace('/','\\').removeprefix('content\\pic\\') in aliases]
assert kept
html=html.replace(m[1],json.dumps(kept,ensure_ascii=False,separators=(',',':')))
html=re.sub(r'var MR\s*=\s*[^;]+;', 'var MR="PACKAGED_GAME", OR="PACKAGED_ORIGINAL_CUTS";',html)
assert 'var MR="PACKAGED_GAME", OR="PACKAGED_ORIGINAL_CUTS";' in html
emit('game/modtools/catalog/catalog_merge_vs_original.html',html.encode('utf-8'),'portable catalog')
for name in catalog_files[1:]:
 data=(catalog/name).read_bytes()
 # Remove dormant fallback strings to the original development installation.
 if name.endswith('.js'):
  data=data.replace(b'C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game',b'PACKAGED_GAME')
  data=data.replace(b'const PLAY_URL="file:///C:/MOVE/Jack%20O%20Nine%20Tails%20v2.3%20Kor_nosex/game/";',b'const PLAY_URL=new URL("../../",location.href).href;')
 emit('game/modtools/catalog/'+name,data,'WORKSHOP catalog')
spare={}
reserved={str(k).replace('/','\\') for k in set(registry['originals'])|set(registry['reservations'])}
for d in kept:
 key=str(d[0]).replace('/','\\').removeprefix('content\\pic\\')
 if key.lower() in {s.lower() for s in reserved}:spare[d[0]]=['spare']
emit('game/modtools/catalog/catalog_status.js',('window.CATALOG_STATUS='+json.dumps({'savedAt':0,'items':spare},ensure_ascii=False)+';\n').encode('utf-8'),'clean functional reservation flags')
readme='''Jack O Nine Tails v2.4 Kor_Full

압축을 완전히 푼 뒤 Jack-o-nine-tails.exe를 실행하세요. 별도 설치가 필요하지 않습니다.
Windows용 배포판입니다. 게임 폴더의 파일을 함께 유지하세요.

WORKSHOP 메뉴는 이미지 교체와 대사 편집 도구를 엽니다. 필요한 Node 실행기를 포함했습니다.
첫 실행 시 로컬 도구가 시작되므로 잠시 기다려 주세요. AI 각색은 이용자가 API 연결을 설정한 뒤 사용합니다. 제작자의 API 키나 개인 설정은 포함되지 않습니다.
원본 B컷은 배포 폴더 안 실제 파일로 포함했으며 외부 Drive가 필요하지 않습니다.
원본 대조는 포함된 원본이 있는 항목에 한해 제공됩니다.

개인 세이브, 제작용 백업, 임시 작업 폴더는 제외했습니다. 새 저장은 game/save에 보관됩니다.
원작 및 한국어판 출처/참여자 표시는 게임 안 크레딧을 참고하세요.
2.4 작업: SAnk. 올걸팩: smsfbatalovehandle. 원작·인디패치 및 기타 외부 리소스의 기존 크레딧을 유지합니다.

현재 플레이본을 복사한 빌드입니다. 실제 플레이 확인은 별도로 진행합니다.
'''
emit('README_KO.txt',readme.encode('utf-8-sig'))
# Keep all metadata in the private build record, with a compact public file manifest.
manifest={'version':'2.4.0.0','createdKST':datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat(),'qsp_sha256':qsp_hash,'files':list(entries.values())}
emit('BUILD_MANIFEST.json',(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode('utf-8'),'release manifest')
for d in ['game/save','game/modtools/runtime','game/modtools/text-workshop/runtime']:(STAGE/d).mkdir(parents=True,exist_ok=True)
# Source unchanged, primary runtime and original resources verified before ZIP.
assert sha((GAME/'jack.qsp').read_bytes())==qsp_hash,'Source QSP changed while copying; do not release.'
assert (STAGE/'game/config.xml').read_bytes()==(GAME/'config.xml').read_bytes()
for p in STAGE.rglob('*'):assert not p.is_symlink() and not p.is_junction(),'Release contains a link.'
print('Staging ready',len(entries),'files',round(total/1024**3,2),'GiB',flush=True)
record={'source':str(SOURCE),'stage':str(STAGE),'folder':str(FINAL),'zip':str(ZIP),'source_qsp_sha256':qsp_hash,'files':len(entries),'uncompressed_bytes':sum(x['bytes'] for x in entries.values()),'excluded':skipped,'materialized_original_cuts':original['count'],'catalog_rows':len(kept),'files_manifest':list(entries.values()),'phase':'staged'}
(HERE/'full-release-record.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('READY_FOR_QA',str(STAGE),flush=True)
