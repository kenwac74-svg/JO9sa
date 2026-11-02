"""Fresh SHA256 inventory of deployable WORK/Full candidates; no source mutation."""
import json, hashlib, time, re
from pathlib import Path
P=Path(__file__).resolve().parent

def exclusion(rel):
    s=rel.casefold();parts=s.split('/')
    if '__jo9_imagebackups' in parts:return 'image-edit-recovery'
    if s.startswith('game/content/modworkpic/'):return 'creative-working-originals'
    if s.startswith(('game/modtools/','game/mods/')):return 'active-development-tools'
    if s.startswith('game/save/') or s.endswith('.sav'):return 'saves-reviewed-separately'
    if re.search(r'\.bak(?:_|\.|$)|\.(?:tmp|log|psd|kra|xcf|zip|7z|rar)$',s):return 'archive-or-working-file'
    if parts[-1] in ('thumbs.db','desktop.ini','.ds_store'):return 'filesystem-metadata'
    if s in ('fastqsp.ini','game/fastqsp.ini','game/engine/fastqsp.ini'):return 'portable-default-written-separately'
    if s.startswith('licenses/'):return None
    if s=='jack-o-nine-tails.exe':return None
    if s in ('game/jack.qsp','game/config.xml','game/icon.ico'):return None
    if s.startswith(('game/content/','game/css/','game/engine/','game/fonts/','game/json/')):return None
    return 'not-runtime-root-file'

for label in ('work','full'):
    inv=json.loads((P/f'inventory-{label}.json').read_text(encoding='utf-8'))
    root=Path(inv['root']);rows=[];excluded=[];changed=[];donebytes=0;start=time.monotonic()
    for ent in inv['files']:
        why=exclusion(ent['path'])
        if why:excluded.append({**ent,'reason':why});continue
        f=root/ent['path'];before=f.stat();h=hashlib.sha256()
        with f.open('rb') as stream:
            for block in iter(lambda:stream.read(4*1024*1024),b''):h.update(block)
        after=f.stat()
        if before.st_size!=after.st_size or before.st_mtime_ns!=after.st_mtime_ns or before.st_size!=ent['bytes'] or before.st_mtime_ns!=ent['mtime_ns']:changed.append(ent['path'])
        rows.append({**ent,'sha256':h.hexdigest()});donebytes+=after.st_size
        if len(rows)%4000==0:print(json.dumps({'root':label,'hashed':len(rows),'GiB':round(donebytes/2**30,2),'seconds':round(time.monotonic()-start,1)}),flush=True)
    out={'root':str(root),'files':rows,'excluded':excluded,'changedSinceInventory':changed,'count':len(rows),'bytes':donebytes,'seconds':round(time.monotonic()-start,1)}
    (P/f'hashes-{label}.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'done':label,'files':len(rows),'GiB':round(donebytes/2**30,3),'excluded':len(excluded),'changed':changed,'seconds':out['seconds']},ensure_ascii=False),flush=True)
