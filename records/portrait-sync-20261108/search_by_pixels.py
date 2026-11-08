"""Name-independent screening of every installed color portrait, then crop verification."""
import json,sys,importlib.util
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image
H=Path(__file__).resolve().parent;G=Path('G:/somi/Jack O Nine Tails v2.4_work/game/content/pic')
spec=importlib.util.spec_from_file_location('matching',H/'match.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
inv=json.loads((H/'inventory.json').read_text(encoding='utf8'));borders=json.loads((H/'borders.json').read_text(encoding='utf8'))
sources=[];vectors=[];seen=set()
def vector(im):
 a=np.asarray(im.convert('L').resize((32,32),Image.Resampling.BILINEAR),dtype=np.float32).ravel();a-=a.mean();return a/max(np.linalg.norm(a),1e-5)
for r in borders['rows']:
 p=G/r['path']
 if any(s in p.stem.lower() for s in ['_gray','_grey','_sepia']):continue
 with Image.open(p) as im:
  w,h=im.size;v=vector(im.crop((w*.15,h*.15,w*.85,h*.85)))
 key=v.tobytes()
 if key in seen:continue
 seen.add(key);sources.append(r['path']);vectors.append(v)
vectors=np.array(vectors);candidates=[]
for r in [x for x in inv['rows'] if x['full25']]:
 with Image.open(G/r['base']['path']) as src:
  im=src.convert('RGBA');a=np.asarray(im);mask=(a[:,:,3]>220)&(a[:,:,:3].max(2)>28);ys,xs=np.where(mask[:150]);top=int(ys.min());cx=(int(xs.min())+int(xs.max()))/2
  background=Image.new('RGBA',im.size,(80,80,80,255));background.alpha_composite(im);im=background.convert('RGB')
  queries=[vector(im.crop((cx+dx-size/2,top+dy,cx+dx+size/2,top+dy+size))) for size in [120,140,160,180,200] for dy in [-10,0,10,20,30] for dx in [-12,0,12]]
 score=(np.array(queries)@vectors.T).max(axis=0);best=np.argsort(score)[-12:][::-1]
 candidates.extend((r,sources[int(i)],float(score[i])) for i in best)
def verify(item):
 r,p,screen=item;return {**m.match({**r,'candidate':str(G/p)}),'path':p,'screenScore':screen}
with ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(verify,candidates))
byid={r['id']:sorted([x for x in results if x['id']==r['id']],key=lambda x:-x['correlation']) for r in inv['rows'] if r['full25']}
(H/'existing-name-independent-search.json').write_text(json.dumps({'installedColorPortraits':len(sources),'pairsVerified':len(results),'targets':byid},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'installedColorPortraits':len(sources),'pairsVerified':len(results),'strongMatches':[v[0] for v in byid.values() if v[0]['correlation']>=.85],'best':[{'id':i,'path':v[0]['path'],'correlation':v[0]['correlation']} for i,v in byid.items()]}))
