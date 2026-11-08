import json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageOps
H=Path(__file__).resolve().parent;G=Path('G:/somi/Jack O Nine Tails v2.4_work/game/content/pic')
d=json.loads((H/'borders.json').read_text(encoding='utf8'));mask=np.ones((150,150),bool);mask[4:-4,4:-4]=False
def features(p):
 with Image.open(p) as im:a=np.asarray(im.convert('RGB').resize((150,150),Image.Resampling.BILINEAR),dtype=np.float32)[mask]
 l=a@np.array([.299,.587,.114],np.float32);l-=l.mean();return l/max(np.linalg.norm(l),1e-5),a
refs=[features(G/r['sample']) for r in d['groups'] if r['group']!=14]
for p in Path('G:/somi/JO9sa/assets/mob-portrait-frames-20261029').glob('*.png'):refs.append(features(p))
v=np.array([r[0] for r in refs]);rgb=np.array([r[1] for r in refs]);rows=[];candidates=[]
for sub in ['master','characters','mob']:
 for p in (G/sub).glob('*'):
  if not p.is_file() or p.suffix.lower() not in ['.png','.jpg','.jpeg']:continue
  if p.name.lower() in ['master_blank.png','mob template.png','chariot_race_champion.png','chariot_race_grand_champion.png','gladiator_prisoners_ava.png']:continue
  with Image.open(p) as im:
   if im.size not in [(150,150),(151,150)]:continue
  f,a=features(p);corr=float((v@f).max());err=float(np.sqrt(((rgb-a)**2).mean(axis=(1,2))).min());r={'path':p.relative_to(G).as_posix(),'correlation':corr,'rmse':err};rows.append(r)
  if corr<.75 and err>22:candidates.append(r)
(H/'extra-frames.json').write_text(json.dumps({'scanned':len(rows),'rows':rows,'candidates':candidates},ensure_ascii=False,indent=2),encoding='utf8')
if candidates:
 sheet=Image.new('RGB',(1200,((len(candidates)+7)//8)*180),'#eeeeee');dr=ImageDraw.Draw(sheet)
 for i,r in enumerate(candidates):
  x=(i%8)*150;y=(i//8)*180
  with Image.open(G/r['path']) as im:sheet.paste(im.convert('RGB'),(x,y+20))
  dr.text((x,y),str(i)+' '+Path(r['path']).stem[:20],fill='black')
 sheet.save(H/'extra-frame-candidates.jpg',quality=94)
print(json.dumps({'scanned':len(rows),'candidates':candidates},ensure_ascii=False))
