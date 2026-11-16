from pathlib import Path
import json,hashlib,gzip,difflib,shutil
T=Path(__file__).parent;S=T/'stage';H=Path('G:/somi/JO9sa/tools/modding-hub');R=Path('G:/somi/JO9sa/records/attribute-defaults-20261115')
before=json.loads((T/'before-hashes.json').read_text(encoding='utf8'))
for n,sha in before.items():assert hashlib.sha256((H/n).read_bytes()).hexdigest()==sha,'Concurrent source change: '+n
R.mkdir(parents=True,exist_ok=True);(R/'before').mkdir(exist_ok=True);diff=[]
for p in S.rglob('*'):
 if not p.is_file() or '__pycache__' in p.parts:continue
 n=p.relative_to(S).as_posix();raw=p.read_bytes();dest=H/n
 if n.endswith('.ps1'):raw=b'\xef\xbb\xbf'+raw.removeprefix(b'\xef\xbb\xbf')
 old=dest.read_bytes() if dest.exists() else b''
 if old==raw:continue
 if old:(R/'before'/(n.replace('/','__')+'.gz')).write_bytes(gzip.compress(old))
 diff.extend(difflib.unified_diff(old.decode('utf-8-sig').splitlines(True),raw.decode('utf-8-sig').splitlines(True),fromfile='before/'+n,tofile='after/'+n))
 dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
for n in ['PLAN_KO.md','before-hashes.json','audit.py','detail.py','more.py','bonus.py','trait_missing.py','install.py']:
 shutil.copy2(T/n,R/n)
(R/'changes.diff').write_text(''.join(diff),encoding='utf8',newline='\n')
print('Installed display changes only:',R)
