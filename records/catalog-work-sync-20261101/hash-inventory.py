import concurrent.futures, hashlib, json, os, pathlib, time
from PIL import Image
W=pathlib.Path('G:/somi/Jack O Nine Tails v2.4_work/game')
O=pathlib.Path('G:/somi/JO9O/game')
T=pathlib.Path('G:/Codex/tmp/catalog-work-sync-20261101')
source=pathlib.Path('G:/Codex/tmp/catalog-work-sync-20261101-root/inventory.json')
v=json.loads(source.read_text(encoding='utf-8-sig'))
files=[x for x in v['files'] if x['category']!='image-backup']
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def info(x):
 p=W/x['path'];st=p.stat()
 if st.st_size!=x['bytes'] or abs(st.st_mtime_ns/1e6-x['mtimeMs'])>1:raise RuntimeError('WORK changed before scan: '+x['path'])
 out=dict(x);out['sha256']=digest(p)
 try:
  with Image.open(p) as im:out.update(width=im.width,height=im.height,format=im.format)
 except Exception as e:out.update(width=0,height=0,imageError=type(e).__name__+': '+str(e))
 op=O/x['path'];out['originalExists']=op.is_file()
 if out['originalExists']:
  ost=op.stat();out['originalBytes']=ost.st_size
  if ost.st_size==st.st_size:
   out['originalSha256']=digest(op);out['comparison']='o' if out['originalSha256']==out['sha256'] else 'r'
  else:out['comparison']='r'
 else:out.update(originalBytes=0,comparison='a')
 after=p.stat()
 if after.st_size!=st.st_size or after.st_mtime_ns!=st.st_mtime_ns:raise RuntimeError('WORK changed while reading: '+x['path'])
 return out
start=time.time();result=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for i,item in enumerate(pool.map(info,files),1):
  result.append(item)
  if i%2000==0:print(json.dumps({'hashed':i,'total':len(files),'elapsedSeconds':round(time.time()-start,1)}),flush=True)
missing=[]
for x in v['missing']:
 y=dict(x);op=O/x['path'];y['originalExists']=op.is_file();y['originalBytes']=op.stat().st_size if op.is_file() else 0
 if op.is_file():
  try:
   with Image.open(op) as im:y.update(originalWidth=im.width,originalHeight=im.height)
  except Exception:pass
 missing.append(y)
out={'schema':1,'created':time.time(),'game':str(W),'original':str(O),'qspSha256':v['qspSha256'],'sourceInventorySha256':digest(source),'files':result,'excluded':[x for x in v['files'] if x['category']=='image-backup'],'missing':missing,'summary':{'files':len(result),'bytes':sum(x['bytes'] for x in result),'excluded':188,'imageErrors':sum('imageError' in x for x in result),'elapsedSeconds':round(time.time()-start,1)}}
T.mkdir(parents=True,exist_ok=True);(T/'hashed-inventory.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
print(json.dumps({'status':'HASH_SCAN_PASS',**out['summary'],'path':str(T/'hashed-inventory.json')}),flush=True)
