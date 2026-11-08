import json
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageOps
H=Path(__file__).resolve().parent;G=Path('G:/somi/Jack O Nine Tails v2.4_work/game/content/pic')
d=json.loads((H/'borders.json').read_text(encoding='utf8'))
mask=np.ones((150,150),bool);mask[4:-4,4:-4]=False
def edge(p):
 with Image.open(G/p) as im:a=np.asarray(im.convert('RGB').resize((150,150),Image.Resampling.BILINEAR),dtype=np.float32)
 rgb=a[mask];return rgb@np.array([.299,.587,.114],np.float32),rgb
refs=[]
for x in d['groups']:
 if x['group']==14:continue
 l,rgb=edge(x['sample']);l=l-l.mean();refs.append((l/max(np.linalg.norm(l),1e-5),rgb,x['sample']))
refvectors=np.array([r[0] for r in refs]);results=[]
for row in d['rows']:
 l,rgb=edge(row['path']);l=l-l.mean();norm=l/max(np.linalg.norm(l),1e-5)
 scores=refvectors@norm;diffs=np.sqrt(np.mean((np.array([r[1] for r in refs])-rgb)**2,axis=(1,2)))
 results.append({**row,'frameCorrelation':float(scores.max()),'frameRmse':float(diffs.min()),'reference':refs[int(scores.argmax())][2]})
chosen=[r for r in results if r['frameCorrelation']<.75 and r['frameRmse']>22]
(H/'frame-screen.json').write_text(json.dumps({'rows':results,'candidates':chosen},ensure_ascii=False,indent=2),encoding='utf8')
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)
for page in range((len(chosen)+47)//48):
 group=chosen[page*48:page*48+48];sheet=Image.new('RGB',(1200,6*185),'#eeeeee');dr=ImageDraw.Draw(sheet)
 for i,r in enumerate(group):
  x=(i%8)*150;y=(i//8)*185
  with Image.open(G/r['path']) as im:im=ImageOps.contain(im.convert('RGB'),(140,140))
  sheet.paste(im,(x,y+23));dr.text((x,y),str(page*48+i)+' '+str(round(r['frameCorrelation'],2)),fill='black',font=font)
  dr.text((x,y+165),Path(r['path']).stem[:21],fill='black',font=font)
 sheet.save(H/f'border-candidates-{page+1}.jpg',quality=93)
print(json.dumps({'scanned':len(results),'frameCandidates':len(chosen),'sheets':(len(chosen)+47)//48,'under40':sum(r['frameCorrelation']<.4 for r in chosen)}))
