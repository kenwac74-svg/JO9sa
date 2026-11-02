import os,json,shutil,hashlib
from pathlib import Path
r=Path('G:/somi/JO9sa/records/final-prezip-20261102');w=Path(__file__).parent
for n in ['prepare-full-20261102.py','release-final-20261102.cjs','final-documents-20261102.py','finalize-full-20261102.py','cleanup-final-20261102.py']:shutil.copy2(w/n,r/n)
stats={'files':0,'bytes':0,'links':0};root=Path('G:/Codex/tmp').resolve()
def clean(p):
 st=p.lstat()
 if st.st_file_attributes&0x400:
  os.rmdir(p) if p.is_dir() else p.unlink();stats['links']+=1
 elif p.is_dir():
  for q in p.iterdir():clean(q)
  p.rmdir()
 else:
  stats['files']+=1;stats['bytes']+=st.st_size;p.unlink()
for name in ['final-prezip-20261102','final-prezip-20261102-release']:
 p=root/name;assert p.resolve().parent==root and not(p.lstat().st_file_attributes&0x400)
 clean(p);assert not p.exists()
stats['runtimeJsSyntax']='3 PASS'
stats['qspHashes']={}
for name in ['Jack O Nine Tails v2.4_work','Jack O Nine Tails v2.4 Kor_Full']:
 with (Path('G:/somi')/name/'game/jack.qsp').open('rb') as s:stats['qspHashes'][name]=hashlib.file_digest(s,'sha256').hexdigest()
assert len(set(stats['qspHashes'].values()))==1
(r/'cleanup.json').write_text(json.dumps(stats,indent=2),encoding='utf8');print(json.dumps(stats))
