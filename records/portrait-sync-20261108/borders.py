import json,hashlib,collections
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageOps
HERE=Path(__file__).resolve().parent
GAME=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
def digest(b):return hashlib.sha256(b).hexdigest()
def main():
 inv=json.loads((HERE/'inventory.json').read_text(encoding='utf8'))
 paths={v['path'] for r in inv['rows'] for v in r['portraits'].values() if v and v['exists']}
 for p in (GAME/'content/pic/girls/face').rglob('*'):
  if p.is_file() and not p.is_symlink() and p.suffix.lower() in ['.png','.jpg','.jpeg','.webp']:paths.add(p.relative_to(GAME/'content/pic').as_posix())
 mask=np.ones((150,150),bool);mask[4:-4,4:-4]=False
 groups=collections.defaultdict(list);rows=[]
 for p in sorted(paths):
  with Image.open(GAME/'content/pic'/p) as im:
   if not (100<=im.width<=300 and 100<=im.height<=300):continue
   size=list(im.size);a=np.asarray(im.convert('RGBA').resize((150,150),Image.Resampling.BILINEAR))
  ring=a[mask];h=digest(ring.tobytes());groups[h].append(p);rows.append({'path':p,'size':size,'edgeHash':h,'ringStd':float(ring[:,:3].std()),'alphaMin':int(ring[:,3].min())})
 top=sorted(groups,key=lambda x:-len(groups[x]));font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)
 sheet=Image.new('RGB',(1200,6*190),'#eeeeee');draw=ImageDraw.Draw(sheet)
 summary=[]
 for i,h in enumerate(top[:36]):
  p=groups[h][0];summary.append({'group':i,'count':len(groups[h]),'sample':p,'edgeHash':h});x=(i%6)*200;y=(i//6)*190
  with Image.open(GAME/'content/pic'/p) as im:im=ImageOps.contain(im.convert('RGB'),(150,150))
  sheet.paste(im,(x,y+25));draw.text((x,y),f'group {i} / {len(groups[h])} files',font=font,fill='black')
 sheet.save(HERE/'frame-families.jpg',quality=94)
 (HERE/'borders.json').write_text(json.dumps({'scanned':len(rows),'groups':summary,'rows':rows},ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps({'scanned':len(rows),'edgeFamilies':len(groups),'top':summary[:14]},ensure_ascii=False))
if __name__=='__main__':main()
