from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib
H=Path(__file__).parent.parent
ps=[Path('G:/somi/JO9_work_backups/mob-portrait-backgrounds-20261030/original/content/pic/mob/warg_ava.png'),Path('G:/somi/Jack O Nine Tails v2.4_work/game/content/pic/mob/warg_ava.png'),Path('G:/Codex/tmp/mob-portrait-edge-fix-20261030/candidate/content/pic/mob/warg_ava.png')]
s=Image.new('RGB',(900,220),'#ddd');d=ImageDraw.Draw(s)
for i,p in enumerate(ps):
    s.paste(Image.open(p).crop((90,4,146,35)).resize((280,155),Image.Resampling.NEAREST),(i*300,35))
    d.text((i*300,5),['original','current','candidate'][i],fill='black')
s.save(H/'independent-warg-upper.png')
old=np.array(Image.open(ps[0]).convert('RGB'));cur=np.array(Image.open(ps[1]).convert('RGB'));after=np.array(Image.open(ps[2]).convert('RGB'))
rows=[]
for y in range(5,17):
    x=np.arange(105,146)
    region=old[y,x].astype(int)
    mask=(np.max(region,axis=1)<=35)&((np.max(region,axis=1)-np.min(region,axis=1))<=4)
    xs=x[mask]
    if len(xs):rows.append({'y':y,'xMin':int(xs.min()),'xMax':int(xs.max()),'count':len(xs),'rgbMean':region[mask].mean(axis=0).tolist()})
(H/'independent-warg-upper-colors.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps(rows))
