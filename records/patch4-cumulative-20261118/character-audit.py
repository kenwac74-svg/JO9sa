import json, hashlib
from pathlib import Path
from PIL import Image
D=Path(__file__).resolve().parent
W=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
inv=json.loads((D/'inventory.json').read_text('utf-8'))
changes={r['path'] for r in inv['changedSincePriorInventory']+inv['newSincePriorInventory']}
result=[]
for name in ['2613_carolina.json','2614_snezhana.json','2615_zhanna.json']:
 p=W/'json/slaves'/name;j=json.loads(p.read_text('utf-8-sig'))
 refs={k:v for k,v in j.items() if k.startswith(('full','seed_ava','indpack_')) and isinstance(v,str) and v}
 checks=[]
 for k,v in refs.items():
  if not isinstance(v,str):continue
  rel=v.replace('\\','/').removeprefix('content/pic/').removeprefix('pic/')
  q=W/'content/pic'/rel
  if not q.suffix:
   q=q.with_suffix('.png');rel+='.png'
  if q.suffix.lower() not in ['.png','.jpg','.jpeg','.webp','.gif']:continue
  assert q.is_file(),(name,k,v)
  with Image.open(q) as im: size=im.size;im.verify()
  checks.append({'field':k,'path':rel,'size':size})
 result.append({'json':str(p.relative_to(W)),'name':j.get('seed_name'),'jsonChangedSincePatch3':('game/'+p.relative_to(W).as_posix()) in changes,'imageReferences':refs,'checkedExplicitImageFiles':checks})
(D/'character-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
