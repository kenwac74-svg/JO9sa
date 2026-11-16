"""Fresh ZIP64 distribution, all-entry CRC and complete extraction/hash verification."""
import argparse,concurrent.futures,hashlib,json,pathlib,shutil,time,zipfile
R=pathlib.Path('G:/somi/JO9sa');D=R/'records/full242-packing-20261113'
OUT=pathlib.Path('G:/somi/JO9_2.4.2_Full_20261113');S=OUT/'JO9_2.4.2_Kor_Full'
T=pathlib.Path('G:/Codex/tmp/full242-packing-20261113');Z=OUT/'JO9_2.4.2_Kor_Full_20261114.zip'
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(2**20),b''):h.update(b)
 return h.hexdigest()
def write(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n','utf-8')
def safe_name(name):
 p=pathlib.PurePosixPath(name)
 if p.is_absolute() or '..' in p.parts or '\\' in name or ':' in name:raise RuntimeError('Unsafe archive path')
 return p
def check_scope(p):
 rel=p.relative_to(S);parts={s.lower() for s in rel.parts}
 if parts & {'modtools','modworkpic','__jo9_imagebackups','workshop','.git','records','tools','__pycache__'}:raise RuntimeError('Forbidden private/tool directory '+str(rel))
 if p.suffix.lower() in {'.sav','.bak','.log','.py','.pyc','.spec','.zip','.pngbk'} or '.bak_' in p.name.lower() or p.name.lower()=='desktop.ini':raise RuntimeError('Forbidden private/temporary file '+str(rel))
 if p.is_symlink() or p.is_junction():raise RuntimeError('Link in distribution '+str(rel))
def manifest():
 rows=[]
 for p in S.rglob('*'):
  if p.is_dir():
   if p.is_symlink() or p.is_junction():raise RuntimeError('Linked directory '+str(p))
   continue
  check_scope(p)
  if p.name=='PACKAGE_MANIFEST_SHA256.json':continue
  rows.append({'path':p.relative_to(S).as_posix(),'bytes':p.stat().st_size})
 rows.sort(key=lambda r:r['path'])
 def hashed(r):return dict(r,sha256=sha(S/r['path']))
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  rows=list(pool.map(hashed,rows))
 frozen=json.loads((D/'frozen-input-manifest.json').read_text('utf-8'));overrides={r['path']:r['after'] for r in json.loads((D/'distribution-overrides.json').read_text('utf-8'))};by={r['path']:r for r in rows}
 for r in frozen['files']:
  actual=by.get(r['path']);expected=overrides.get(r['path'],r['sha256'])
  if actual is None or actual['sha256']!=expected:raise RuntimeError('Frozen runtime mismatch '+r['path'])
 if list((S/'game/save').iterdir()):raise RuntimeError('Private saves in release')
 m={'version':'2.4.2','package':'Full','qspSha256':by['game/jack.qsp']['sha256'],'supportedOldSaves':'2.4.1 non-combat general-screen saves','privateSavesIncluded':False,'modtoolsIncluded':False,'audioIncludedForGameOnly':True,'emptyDirectories':['game/save'],'manifestDoesNotHashItself':True,'files':rows}
 write(S/'PACKAGE_MANIFEST_SHA256.json',m)
 allrows=rows+[{'path':'PACKAGE_MANIFEST_SHA256.json','bytes':(S/'PACKAGE_MANIFEST_SHA256.json').stat().st_size,'sha256':sha(S/'PACKAGE_MANIFEST_SHA256.json')}]
 m=dict(m,manifestDoesNotHashItself=False,files=allrows);write(D/'final-package-manifest.json',m);write(OUT/'PACKAGE_MANIFEST_SHA256.json',m)
 print(json.dumps({'phase':'manifest','files':len(allrows),'bytes':sum(r['bytes'] for r in allrows)},ensure_ascii=False),flush=True)
def pack():
 m=json.loads((D/'final-package-manifest.json').read_text('utf-8'))
 if Z.exists():raise RuntimeError('Existing release ZIP preserved')
 if shutil.disk_usage(OUT).free < sum(r['bytes'] for r in m['files'])*2.1:raise RuntimeError('Insufficient space for ZIP and full extraction')
 started=time.monotonic();stored={'.png','.jpg','.jpeg','.gif','.webp','.mp3','.ogg','.mp4','.7z','.pdf','.woff2'}
 with zipfile.ZipFile(Z,'x',allowZip64=True,compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  z.writestr(S.name+'/game/save/','')
  for i,r in enumerate(m['files'],1):
   p=S/r['path'];arc=S.name+'/'+r['path'];safe_name(arc)
   if p.stat().st_size!=r['bytes']:raise RuntimeError('Staged file changed '+r['path'])
   z.write(p,arc,compress_type=zipfile.ZIP_STORED if p.suffix.lower() in stored else zipfile.ZIP_DEFLATED)
   if i%5000==0:print('Packed '+str(i)+'/'+str(len(m['files'])),flush=True)
 print(json.dumps({'phase':'packed','zip':str(Z),'bytes':Z.stat().st_size,'seconds':round(time.monotonic()-started,1)}),flush=True)
def verify():
 m=json.loads((D/'final-package-manifest.json').read_text('utf-8'));expected={S.name+'/'+r['path']:r for r in m['files']};extract=T/'verified-extraction'
 if extract.exists():raise RuntimeError('Existing extraction folder preserved')
 extract.mkdir();started=time.monotonic()
 with zipfile.ZipFile(Z) as z:
  names=z.namelist()
  if len(names)!=len(set(n.casefold() for n in names)):raise RuntimeError('Duplicate ZIP names')
  for n in names:safe_name(n)
  if set(names)!=set(expected)|{S.name+'/game/save/'}:raise RuntimeError('Unexpected/missing ZIP entries')
  print('Checking CRC for every ZIP entry',flush=True)
  bad=z.testzip()
  if bad:raise RuntimeError('CRC failure '+bad)
  print('All-entry ZIP CRC passed; extracting and hashing every file',flush=True)
  for i,info in enumerate(z.infolist(),1):
   dst=extract/pathlib.Path(*safe_name(info.filename).parts)
   if info.is_dir():dst.mkdir(parents=True,exist_ok=True);continue
   r=expected[info.filename];dst.parent.mkdir(parents=True,exist_ok=True);h=hashlib.sha256();size=0
   with z.open(info) as src,dst.open('xb') as out:
    for b in iter(lambda:src.read(2**20),b''):out.write(b);h.update(b);size+=len(b)
   if size!=r['bytes'] or h.hexdigest()!=r['sha256']:raise RuntimeError('Extracted file differs '+r['path'])
   if i%5000==0:print('Extracted/hash-verified '+str(i)+'/'+str(len(names)),flush=True)
 result={'verdict':'PASS','archive':str(Z),'archiveBytes':Z.stat().st_size,'sha256':sha(Z),'fileCount':len(expected),'emptyDirectoryEntries':1,'allEntryCRC':True,'completeExtractionHashes':True,'unsafePaths':0,'duplicatePaths':0,'privateSavesIncluded':False,'modtoolsIncluded':False,'seconds':round(time.monotonic()-started,1),'extraction':str(extract/S.name)}
 write(D/'archive-verification.json',result);write(OUT/'ARCHIVE_VERIFICATION.json',result);(OUT/(Z.name+'.sha256')).write_text(result['sha256']+'  '+Z.name+'\n','ascii');print(json.dumps(result,ensure_ascii=False),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('phase',choices=['manifest','pack','verify']);args=p.parse_args();globals()[args.phase]()
