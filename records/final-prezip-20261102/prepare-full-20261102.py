import os,json,re,hashlib,shutil,time
from pathlib import Path
W=Path('G:/somi/Jack O Nine Tails v2.4_work'); F=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full')
R=Path('G:/somi/JO9sa/records/final-prezip-20261102'); R.mkdir(parents=True,exist_ok=True)
A=Path('K:/doing/JO9_trash/final-prezip-20261102'); A.mkdir(parents=True,exist_ok=True)
def sha(p):
 with p.open('rb') as s:return hashlib.file_digest(s,'sha256').hexdigest()
def why(s):
 s=s.casefold(); parts=s.split('/')
 if '__jo9_imagebackups' in parts:return 'image recovery'
 if s.startswith(('game/content/modworkpic/','game/modtools/','game/mods/')):return 'development files'
 if s.startswith('game/save/') or s.endswith('.sav'):return 'personal saves'
 if re.search(r'\.bak(?:_|\.|$)|\.(?:tmp|log|psd|kra|xcf|zip|7z|rar)$',s):return 'working/archive file'
 if parts[-1] in ('thumbs.db','desktop.ini','.ds_store'):return 'metadata'
 if s in ('fastqsp.ini','game/fastqsp.ini','game/engine/fastqsp.ini'):return 'preserve portable settings'
 if s.startswith('licenses/') or s=='jack-o-nine-tails.exe':return None
 if s in ('game/jack.qsp','game/config.xml','game/icon.ico'):return None
 if s.startswith(('game/content/','game/css/','game/engine/','game/fonts/','game/json/')):return None
 if s in ('jo9_2.4.1_업데이트안내.html','jo9_2.4.1_update_guide_en.html'):return None
 return 'non-runtime'
def scan(root):
 out={}; excluded=[];links=[]
 for d,ds,fs in os.walk(root,followlinks=False):
  for n in list(ds):
   p=Path(d)/n
   if p.lstat().st_file_attributes&0x400:links.append(str(p));ds.remove(n)
  for n in fs:
   p=Path(d)/n; rel=p.relative_to(root).as_posix()
   if p.lstat().st_file_attributes&0x400:links.append(str(p));continue
   reason=why(rel)
   if reason:excluded.append({'path':rel,'reason':reason});continue
   st=p.stat();h=sha(p);st2=p.stat();assert(st.st_size,st.st_mtime_ns)==(st2.st_size,st2.st_mtime_ns),str(p)
   out[rel]={'bytes':st.st_size,'mtime_ns':st.st_mtime_ns,'sha256':h}
 print(json.dumps({'scan':str(root),'files':len(out),'bytes':sum(x['bytes'] for x in out.values()),'links':len(links)}),flush=True)
 return out,excluded,links
w,ex,wl=scan(W);f,fe,fl=scan(F)
assert not wl and not fl,'Runtime must not require external junctions'
changed=[]; identical=0
for rel,row in w.items():
 old=f.get(rel)
 if old and row['sha256']==old['sha256']:identical+=1;continue
 src=W/rel;dest=F/rel
 assert sha(src)==row['sha256'],'WORK changed during sync: '+rel
 if dest.exists():
  backup=A/rel;backup.parent.mkdir(parents=True,exist_ok=True)
  if backup.exists():assert sha(backup)==old['sha256'],'archive conflict'
  else:shutil.copy2(dest,backup)
  assert sha(backup)==old['sha256']
 dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest);assert sha(dest)==row['sha256']
 changed.append({'path':rel,'sha256':row['sha256'],'bytes':row['bytes'],'previousSha256':old and old['sha256'],'backup':str(A/rel) if old else None})
 print('updated '+rel,flush=True) if len(changed)<12 else None
# Explicitly public test saves only; never mirror WORK/save.
saves=[]
for name in ['TC_08_AUCTION_DIFFICULTY.sav','TC_09_PORTAL_GUARDIAN_EVENT.sav','TC_10_VATICAN_PALADIN_EVENT.sav']:
 src=W/'game/save'/name;dst=F/'game/save'/name
 assert src.is_file()
 if dst.exists():assert sha(src)==sha(dst),'Existing public save conflict'
 else:shutil.copy2(src,dst)
 saves.append({'path':'game/save/'+name,'sha256':sha(dst)})
bad=[]
for rel,row in w.items():
 if sha(F/rel)!=row['sha256']:bad.append(rel)
 # Source metadata guard catches concurrent edits without reading 16GB twice.
 st=(W/rel).stat()
 if(st.st_size,st.st_mtime_ns)!=(row['bytes'],row['mtime_ns']):bad.append('WORK_CHANGED:'+rel)
assert not bad,bad
result={'at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'work':str(W),'full':str(F),'runtimeFiles':len(w),'runtimeBytes':sum(x['bytes'] for x in w.values()),'identical':identical,'changed':changed,'fullOnlyKept':[{'path':r,**x} for r,x in f.items() if r not in w],'excluded':ex,'newPublicSaves':saves,'qspSha256':sha(F/'game/jack.qsp'),'allRuntimeHashesMatch':True,'zipCreated':False}
(R/'sync-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
(R/'runtime-manifest.json').write_text(json.dumps({'files':w},ensure_ascii=False),encoding='utf8')
print(json.dumps({k:v for k,v in result.items() if k not in ('changed','excluded','fullOnlyKept')}|{'changedFiles':len(changed),'fullOnlyKept':len(result['fullOnlyKept'])},ensure_ascii=False),flush=True)
