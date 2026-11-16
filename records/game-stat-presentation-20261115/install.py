from pathlib import Path
import json,hashlib,gzip,difflib,shutil
T=Path(__file__).parent;S=T/'stage';H=Path('G:/somi/JO9sa/tools/modding-hub');R=Path('G:/somi/JO9sa/records/game-stat-presentation-20261115')
before=json.loads((T/'source-hashes.json').read_text('utf8'))
for n,sha in before.items():
 assert hashlib.sha256((H/n).read_bytes()).hexdigest()==sha,'Source changed since read: '+n
R.mkdir(parents=True,exist_ok=True);(R/'before').mkdir(exist_ok=True);diff=[]
for p in S.rglob('*'):
 if not p.is_file() or '__pycache__' in p.parts:continue
 n=p.relative_to(S).as_posix();target=H/n;raw=p.read_bytes()
 if n.endswith('.ps1'):raw=b'\xef\xbb\xbf'+raw.removeprefix(b'\xef\xbb\xbf')
 old=target.read_bytes() if target.exists() else b''
 if old==raw:continue
 if old:(R/'before'/n.replace('/','__')).with_suffix('.gz').write_bytes(gzip.compress(old))
 diff.extend(difflib.unified_diff(old.decode('utf-8-sig').splitlines(True),raw.decode('utf-8-sig').splitlines(True),fromfile='before/'+n,tofile='after/'+n))
 target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
for n in ['PLAN_KO.md','source-hashes.json','audit.py','install.py']:
 shutil.copy2(T/n,R/n)
(R/'changes.diff').write_text(''.join(diff),encoding='utf8')
print('Installed changed tool sources; preserved original source snapshots and exact diff:',R)
