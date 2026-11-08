import json,importlib.util,sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
H=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('crop_match',H/'match.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
inv={r['id']:r for r in json.loads((H/'inventory.json').read_text(encoding='utf8'))['rows']}
search=json.loads((H/'existing-portrait-search.json').read_text(encoding='utf8'))
seen=set();pairs=[]
for f in search['files']:
 if any(x in Path(f['path']).stem.lower() for x in ['_gray','_sepia','_grey']):continue
 for id in f['ids']:
  key=(id,f['sha256'])
  if key in seen:continue
  seen.add(key);pairs.append((inv[id],f))
def run(pair):
 row,f=pair;result=m.match({**row,'candidate':f['path']});return {**result,'path':f['path'],'sha256':f['sha256']}
with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(run,pairs))
byid={i:sorted([r for r in results if r['id']==i],key=lambda r:-r['correlation']) for i in search['targets']}
(H/'existing-portrait-matches.json').write_text(json.dumps({'pairs':len(pairs),'targets':byid},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'pairs':len(pairs),'best':[{k:v for k,v in r[0].items() if k in ['id','path','correlation']} for r in byid.values() if r]},ensure_ascii=False))
