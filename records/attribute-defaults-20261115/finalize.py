from pathlib import Path
import json,gzip,hashlib,difflib,shutil
T=Path(__file__).parent;S=T/'stage';H=Path('G:/somi/JO9sa/tools/modding-hub');R=Path('G:/somi/JO9sa/records/attribute-defaults-20261115');diff=[];hashes={}
for p in S.rglob('*'):
 if not p.is_file() or '__pycache__' in p.parts:continue
 n=p.relative_to(S).as_posix();raw=(H/n).read_bytes();expected=p.read_bytes()
 assert raw.removeprefix(b'\xef\xbb\xbf')==expected.removeprefix(b'\xef\xbb\xbf'),n
 hashes[n]=hashlib.sha256(raw).hexdigest();backup=R/'before'/(n.replace('/','__')+'.gz')
 if backup.exists():old=gzip.decompress(backup.read_bytes())
 elif n in json.loads((T/'before-hashes.json').read_text('utf8')):continue
 else:old=b''
 diff.extend(difflib.unified_diff(old.decode('utf-8-sig').splitlines(True),raw.decode('utf-8-sig').splitlines(True),fromfile='before/'+n,tofile='after/'+n))
(R/'changes.diff').write_text(''.join(diff),encoding='utf8',newline='\n');(R/'installed-hashes.json').write_text(json.dumps(hashes,indent=2),encoding='utf8')
for n in ['REPORT_KO.md','UI_VERIFICATION_KO.md','initials-traits-skills.jpg','finalize.py']:
 shutil.copy2(T/n,R/n)
print('Final report/diff saved, staged files match installed sources.')
