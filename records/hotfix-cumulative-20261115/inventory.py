import concurrent.futures,hashlib,json,os,stat,zipfile
from pathlib import Path
R=Path('G:/somi/JO9sa'); W=Path('G:/somi/Jack O Nine Tails v2.4_work/game'); D=R/'records/hotfix-cumulative-20261115'
O=Path('G:/somi/JO9_2.4.2_Hotfix_20261115_Cumulative'); T=Path('G:/Codex/tmp/hotfix-cumulative-20261115')
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def load(p):return json.loads(p.read_text('utf-8-sig'))
D.mkdir(parents=True,exist_ok=True);T.mkdir(parents=True,exist_ok=True)
manifests=[R/'records/full242-packing-20261113/final-package-manifest.json',R/'records/auto242-load-20261114/final-package-manifest.json']
bases=[{x['path']:x for x in load(p)['files'] if x['path'].startswith('game/')} for p in manifests]
basepaths=set().union(*(set(b) for b in bases)); paths=set(basepaths)
blocked={'modtools','modworkpic','image_work','__jo9_imagebackups','save','.git','workshop','__pycache__','node_modules','backup','backups'}
def safe(rel):
 p=Path(rel); parts=[x.lower() for x in p.parts]
 return not any(x in blocked or x.startswith('.') for x in parts) and not any(x in rel.lower() for x in ['.bak','.pngbk','.backup']) and not rel.endswith('~') and p.suffix.lower() not in {'.sav','.log','.zip','.7z','.tmp','.psd','.kra','.py','.ps1','.qsrc','.cjs','.bat','.cmd'}
img={'.png','.jpg','.jpeg','.gif','.webp','.bmp','.svg','.ico'}
audio={'.mp3','.wav','.ogg','.flac'}
newext=img|audio|{'.json','.css','.ttf','.woff','.woff2','.otf','.xml'}
for root in ['content','json','css','fonts']:
 for parent,dirs,files in os.walk(W/root,followlinks=False):
  dirs[:]=[n for n in dirs if safe(str((Path(parent)/n).relative_to(W))) and not (Path(parent)/n).is_symlink() and not (Path(parent)/n).is_junction()]
  for name in files:
   p=Path(parent)/name;rel='game/'+p.relative_to(W).as_posix()
   if safe(rel) and p.suffix.lower() in newext:paths.add(rel)
assert all(safe(p) for p in paths),'Unexpected base path'
missing=[];existing=[]
for rel in sorted(paths):
 p=W/rel[5:]
 if not p.exists():missing.append(rel);continue
 assert p.is_file() and not p.is_symlink() and not p.is_junction(),rel
 existing.append((rel,p))
def row(pair):
 rel,p=pair;st=p.stat();return {'path':rel,'bytes':st.st_size,'sha256':digest(p),'mtime_ns':st.st_mtime_ns}
rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for n,item in enumerate(pool.map(row,existing),1):
  rows.append(item)
  if n%5000==0:print(f'Hashed {n}/{len(existing)}',flush=True)
changed=[]
for item in rows:
 if any(item['path'] not in b or b[item['path']]['sha256']!=item['sha256'] for b in bases):changed.append(item)
oldzips=sorted(Path('G:/somi').glob('JO9_2.4.2_Hotfix_20261114*.zip')); prior=set(); priorrows=[]
assert len(oldzips)==3
for zp in oldzips:
 with zipfile.ZipFile(zp) as z:
  for i in z.infolist():
   if i.filename.startswith('game/') and not i.is_dir():
    assert safe(i.filename);prior.add(i.filename); priorrows.append({'zip':str(zp),'path':i.filename,'sha256':hashlib.sha256(z.read(i)).hexdigest()})
aliases=load(R/'assets/compatibility-aliases/2026-10-28_fullimage.json')
# The canonical alias schema is checked before reading the retained targets.
entries=aliases.get('entries',aliases.get('files',aliases.get('aliases',[])))
if not entries:raise RuntimeError('Unknown alias manifest schema: '+str(list(aliases)))
aliaspaths=[]
for item in entries:
 target=item.get('compatibility') or item.get('target') or item.get('targetPath') or item.get('aliasPath') or item.get('alias')
 if not target:raise RuntimeError('Unknown alias entry: '+str(list(item)))
 target=target.replace('\\','/');target=target if target.startswith('game/') else 'game/'+target
 assert target in {r['path'] for r in rows},target
 aliaspaths.append(target)
assert len(aliaspaths)==23
selected=set(x['path'] for x in changed)|prior|set(aliaspaths)|{'game/jack.qsp'}
by={r['path']:r for r in rows};assert selected<=set(by)
out={'baseManifests':[str(x) for x in manifests],'baselineGameFiles':[len(b) for b in bases],'workHashedFiles':len(rows),'workQspSha256':by['game/jack.qsp']['sha256'],'changedAgainstEitherBase':len(changed),'selectedPaths':sorted(selected),'selectedFiles':[by[p] for p in sorted(selected)],'selectedBytes':sum(by[p]['bytes'] for p in selected),'missingBasePaths':missing,'priorHotfixRuntimePaths':sorted(prior),'priorHotfixEntries':priorrows,'mandatoryAliasPaths':aliaspaths,'fullWorkInventory':rows}
(D/'inventory.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({k:v for k,v in out.items() if k not in {'fullWorkInventory','selectedFiles','priorHotfixEntries','selectedPaths','mandatoryAliasPaths'}},ensure_ascii=False),flush=True)
