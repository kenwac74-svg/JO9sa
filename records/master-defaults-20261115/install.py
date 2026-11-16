"""Install approved tool-only changes, with checked source backups and a diff."""
from pathlib import Path
import gzip,json,hashlib,difflib,sys
L=Path(__file__).resolve().parent
H=Path('G:/somi/JO9sa/tools/modding-hub')
D=Path('G:/somi/JO9sa/records/master-defaults-20261115')
FILES=['master_editor.py','master_initials.py','integration.css','server.py','Start-Modding-Hub.ps1','overrides/studio-view.mjs','overrides/studio-role.mjs','tests/test_master_initials.py','tests/master-initials.test.mjs','tests/test_cm_defaults.py','tests/test_master_editor.py']
def sha(b):return hashlib.sha256(b).hexdigest()
if __name__=='__main__':
 D.mkdir(parents=True,exist_ok=True);snap=D/'before';snap.mkdir(exist_ok=True)
 previous=json.loads((D/'source-hashes.json').read_text('utf-8')) if '--update' in sys.argv else None
 manifest=[];diff=[]
 for name in FILES:
  dest=H/name;old=dest.read_bytes() if dest.exists() else b'';new=(L/name).read_bytes()
  backup=snap/(name.replace('/','__')+'.gz')
  expected=next((r for r in previous if r['file']==name),None) if previous else None
  if expected:
   if sha(old)!=expected['after']:raise RuntimeError('설치 뒤 외부 수정이 있습니다: '+name)
   original=gzip.decompress(backup.read_bytes()) if backup.exists() else b''
  else:
   if backup.exists():raise RuntimeError('설치 기록이 이미 있습니다: '+name)
   if old:backup.write_bytes(gzip.compress(old))
   original=old
  manifest.append({'file':name,'before':sha(original) if original else None,'after':sha(new)})
  diff.extend(difflib.unified_diff(original.decode('utf-8-sig').splitlines(True),new.decode('utf-8-sig').splitlines(True),fromfile='a/'+name,tofile='b/'+name))
 (D/'source-hashes.json').write_text(json.dumps(manifest,indent=2),'utf-8')
 (D/'changes.diff').write_text(''.join(diff),'utf-8')
 for name in FILES:
  dest=H/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes((L/name).read_bytes())
  assert sha(dest.read_bytes())==next(r['after'] for r in manifest if r['file']==name)
 for name in ['PLAN_KO.md','PROGRESS.md','http_smoke.py','inventory.json','install.py']:
  (D/name).write_bytes((L/name).read_bytes())
 print('Installed',len(FILES),'tool files; game data untouched; records:',D)
