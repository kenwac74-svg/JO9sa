from pathlib import Path
import hashlib,json,shutil

ROOT=Path(__file__).resolve().parent
DEST=Path('G:/somi/JO9sa/records/christmas-secretary-hang-audit-20261030')
allowed={'.md','.json','.cjs','.py','.ps1','.log','.csv'}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert ROOT.name=='christmas-secretary-hang-audit-20261030'
assert DEST.resolve().parent==Path('G:/somi/JO9sa/records').resolve()
files=[]
for p in ROOT.rglob('*'):
    assert not p.is_symlink() and not (hasattr(p,'is_junction') and p.is_junction()),'Linked diagnostic path is not archived'
    if not p.is_file() or p.suffix.lower() not in allowed:continue
    if p.name=='record-copy.json':continue
    target=DEST/p.relative_to(ROOT)
    assert target.resolve().is_relative_to(DEST.resolve())
    if target.exists():assert sha(target)==sha(p),'Existing record drift: '+str(target)
    else:
        target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
    assert sha(target)==sha(p)
    files.append({'path':str(p.relative_to(ROOT)).replace('\\','/'),'sha256':sha(p),'bytes':p.stat().st_size})
result={'record':str(DEST),'files':len(files),'runtimeFilesCopied':False,'entries':files}
(ROOT/'record-copy.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'record':str(DEST),'files':len(files),'runtimeFilesCopied':False},ensure_ascii=False))
