from pathlib import Path
import json,hashlib,difflib,gzip,shutil
T=Path(__file__).parent;H=Path('G:/somi/JO9sa/tools/modding-hub');R=Path('G:/somi/JO9sa/records/game-stat-presentation-20261115')
before=json.loads((T/'source-hashes.json').read_text('utf8'));names=set(before)|{'game_presentation.py','overrides/game-presentation.mjs','tests/game-presentation.test.mjs','tests/test_game_presentation.py'};diff=[];after={}
for n in sorted(names):
 p=H/n;raw=p.read_bytes();after[n]=hashlib.sha256(raw).hexdigest();backup=(R/'before'/n.replace('/','__')).with_suffix('.gz')
 old=gzip.decompress(backup.read_bytes()) if backup.exists() else b''
 diff.extend(difflib.unified_diff(old.decode('utf-8-sig').splitlines(True),raw.decode('utf-8-sig').splitlines(True),fromfile='before/'+n,tofile='after/'+n))
(R/'changes.diff').write_text(''.join(diff),encoding='utf8',newline='\n');(R/'installed-hashes.json').write_text(json.dumps(after,indent=2),encoding='utf8')
for n in ['REPORT_KO.md','http_smoke.py','finalize.py','verification-0.log','verification-1.log']:
 shutil.copy2(T/n,R/n)
for n in ['simulator-status.jpg','editor-attributes.jpg']:
 if (T/n).exists():shutil.copy2(T/n,R/n)
print('Final report, hashes, exact diff and verification saved:',R)
