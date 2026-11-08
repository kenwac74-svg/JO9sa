from pathlib import Path
import os,json,re,hashlib
from PIL import Image
H=Path(__file__).resolve().parent
inv=json.loads((H/'inventory.json').read_text(encoding='utf8'))
prov=json.loads(Path('G:/somi/JO9sa/records/new-character-image-pack-20261027/provenance.json').read_text(encoding='utf8'))
targets={r['id'] for r in inv['rows'] if r['full25']}|{1037,1065,1203,2575,2611,2612,2613,2617,3011,3018}
aliases={i:{str(i)} for i in targets}
for f in prov['files']:
 if f.get('newId') in targets:aliases[f['newId']].add(str(f['originalId']))
for r in inv['rows']:
 if r['id'] not in targets:continue
 for f in [r['base'],*r['portraits'].values()]:
  stem=re.sub(r'_(?:gray|sepia)$','',Path(f['path']).stem)
  if len(stem)>4 and not stem.isdecimal():aliases[r['id']].add(stem.lower())
roots=[Path('G:/somi/Jack O Nine Tails v2.4_work/game/content/pic'),Path('G:/somi/JO9O/game/content/pic'),Path('G:/somi/IMGMG'),Path('G:/somi/JO9_work_backups'),Path('G:/somi/JO9sa/assets'),Path('G:/somi/JO9resource'),Path('G:/somi/JO9_2.4.1_Patch_20261105_2차'),Path('I:/내 드라이브/Moding/JO9WORK/resources'),Path('I:/내 드라이브/Moding/JO9WORK/working-images'),Path('I:/내 드라이브/Moding/JO9WORK/personal-images')]
rows=[];errors=[];scanned=0
for root in roots:
 if not root.exists():errors.append({'path':str(root),'error':'not accessible'});continue
 for folder,dirs,files in os.walk(root,followlinks=False,onerror=lambda e:errors.append({'path':str(e.filename),'error':str(e)})):
  dirs[:]=[d for d in dirs if d not in ['.git','node_modules','__pycache__'] and not (Path(folder)/d).is_symlink() and not getattr((Path(folder)/d),'is_junction',lambda:False)()]
  for name in files:
   p=Path(folder)/name
   if p.suffix.lower() not in ['.png','.jpg','.jpeg','.webp']:continue
   scanned+=1;s=str(p).replace('\\','/').lower();stem=p.stem.lower()
   ids=[i for i,words in aliases.items() if any((re.search(r'(?:^|[/_])'+re.escape(w)+r'(?:[/_.]|$)',s) if w.isdecimal() else w in stem) for w in words)]
   if not ids:continue
   try:
    with Image.open(p) as im:
     if not(80<=im.width<=400 and 80<=im.height<=400):continue
     size=list(im.size)
    raw=p.read_bytes();rows.append({'path':str(p),'ids':ids,'size':size,'sha256':hashlib.sha256(raw).hexdigest()})
   except Exception as e:errors.append({'path':str(p),'error':str(e)})
out={'roots':[str(p) for p in roots],'imageNamesScanned':scanned,'candidateFiles':len(rows),'uniqueImages':len({r['sha256'] for r in rows}),'targets':sorted(targets),'files':rows,'errors':errors}
(H/'existing-portrait-search.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in out.items() if k!='files'},ensure_ascii=False))
