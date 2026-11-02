"""Metadata only, no mutation of source trees and no traversal of reparse points."""
import os, sys, json, time, hashlib
from pathlib import Path

TASK=Path(__file__).resolve().parent
ROOTS={"work":Path(r"G:\somi\Jack O Nine Tails v2.4_work"),"full":Path(r"G:\somi\Jack O Nine Tails v2.4 Kor_Full")}
def inventory(root):
    files=[]; links=[]; dirs=[]; errors=[]
    def walk(p):
        try:
            entries=sorted(os.scandir(p),key=lambda x:x.name.casefold())
        except OSError as e:
            errors.append({"path":str(p),"error":str(e)});return
        for ent in entries:
            rel=Path(ent.path).relative_to(root).as_posix()
            try:
                st=ent.stat(follow_symlinks=False)
                if st.st_file_attributes & 0x400:
                    links.append({"path":rel,"target":os.readlink(ent.path),"attributes":st.st_file_attributes});continue
                if ent.is_dir(follow_symlinks=False):
                    dirs.append(rel);walk(Path(ent.path))
                else:files.append({"path":rel,"bytes":st.st_size,"mtime_ns":st.st_mtime_ns})
            except OSError as e:errors.append({"path":rel,"error":str(e)})
    walk(root)
    groups={}
    for f in files:
        p=f['path'].split('/')
        group='/'.join(p[:3]) if p[0]=='game' and len(p)>3 else '/'.join(p[:2]) if len(p)>2 else p[0]
        g=groups.setdefault(group,{"files":0,"bytes":0});g['files']+=1;g['bytes']+=f['bytes']
    return {"root":str(root),"generatedUtc":time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),"files":files,"directories":dirs,"links":links,"errors":errors,"count":len(files),"bytes":sum(f['bytes'] for f in files),"groups":groups}
for name,root in ROOTS.items():
    start=time.monotonic();out=inventory(root)
    (TASK/f"inventory-{name}.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({"name":name,"files":out['count'],"GiB":round(out['bytes']/2**30,3),"links":out['links'],"errors":out['errors'],"seconds":round(time.monotonic()-start,2)},ensure_ascii=False),flush=True)
