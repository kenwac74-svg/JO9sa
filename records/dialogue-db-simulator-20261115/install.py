from pathlib import Path
import gzip,hashlib,json,difflib,sys
L=Path(__file__).resolve().parent;H=Path('G:/somi/JO9sa/tools/modding-hub');D=Path('G:/somi/JO9sa/records/dialogue-db-simulator-20261115')
FILES=['general_dialogue.py','server.py','integration.mjs','integration.css','Start-Modding-Hub.ps1','overrides/character-view.mjs','overrides/general-dialogue.mjs','overrides/studio-view.mjs','tests/test_general_dialogue.py','tests/question-workspace.test.mjs','tests/background-drafts.test.mjs']
def sha(b):return hashlib.sha256(b).hexdigest()
if __name__=='__main__':
 D.mkdir(parents=True,exist_ok=True);(D/'before').mkdir(exist_ok=True)
 previous=json.loads((D/'source-hashes.json').read_text('utf-8')) if '--update' in sys.argv else []
 diff=[];manifest=[]
 for name in FILES:
  dst=H/name;old=dst.read_bytes() if dst.exists() else b'';new=(L/name).read_bytes();backup=D/'before'/(name.replace('/','__')+'.gz');expected=next((r for r in previous if r['file']==name),None)
  if expected:
   if sha(old)!=expected['after']:raise RuntimeError('외부 수정 보존 필요: '+name)
   baseline=gzip.decompress(backup.read_bytes()) if backup.exists() else b''
  else:
   if backup.exists():raise RuntimeError('설치 기록이 이미 있습니다.')
   baseline=old
   if old:backup.write_bytes(gzip.compress(old))
  manifest.append({'file':name,'before':sha(baseline) if baseline else None,'after':sha(new)})
  diff+=list(difflib.unified_diff(baseline.decode('utf-8-sig').splitlines(True),new.decode('utf-8-sig').splitlines(True),fromfile='a/'+name,tofile='b/'+name))
 for name in FILES:
  dst=H/name;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes((L/name).read_bytes())
 (D/'source-hashes.json').write_text(json.dumps(manifest,indent=2),'utf-8');(D/'changes.diff').write_text(''.join(diff),'utf-8')
 for name in ['PLAN_KO.md','PROGRESS.md','install.py','http_smoke.py']:(D/name).write_bytes((L/name).read_bytes())
 print('Installed',len(FILES),'tool files;',D)
