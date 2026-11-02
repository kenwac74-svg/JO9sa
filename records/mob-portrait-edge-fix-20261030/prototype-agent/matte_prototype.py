from pathlib import Path
from collections import deque
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np,json,hashlib
HERE=Path(__file__).parent
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
OLD=Path('G:/somi/JO9_work_backups/mob-portrait-backgrounds-20261030/original')
REC=Path('G:/somi/JO9sa/records/mob-portrait-backgrounds-20261030')
M=json.loads((REC/'manifest.json').read_text('utf-8'))
P=json.loads(Path('G:/somi/JO9sa/records/mob-portrait-frames-20261029/plan.json').read_text('utf-8'))
names=['glad_amason_ava.png','gladiator_hoplite_1_ava.png']
background=np.asarray(Image.open(WORK/'content/pic/mob/mob template.png').convert('RGB')).astype(float)
B=np.array([33.,29.,23.])

def dilate(a):
 p=np.pad(a,1);return np.logical_or.reduce([p[dy:dy+150,dx:dx+150] for dy in range(3) for dx in range(3)])
def erode(a):return ~dilate(~a)
def nearest(core):
 yy=np.full((150,150),-1,int);xx=yy.copy();dist=np.full((150,150),999,int)
 q=deque()
 for y,x in zip(*np.where(core)):yy[y,x]=y;xx[y,x]=x;dist[y,x]=0;q.append((int(y),int(x)))
 while q:
  y,x=q.popleft()
  if dist[y,x]>=5:continue
  for dy,dx in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)]:
   ny,nx=y+dy,x+dx
   if 0<=ny<150 and 0<=nx<150 and dist[ny,nx]>dist[y,x]+1:
    dist[ny,nx]=dist[y,x]+1;yy[ny,nx]=yy[y,x];xx[ny,nx]=xx[y,x];q.append((ny,nx))
 return yy,xx,dist

rows=[]
for name in names:
 row=next(r for r in M['files'] if Path(r['path']).name==name)
 old=np.asarray(Image.open(OLD/row['path']).convert('RGB')).astype(float)
 current=np.asarray(Image.open(WORK/row['path']).convert('RGB'))
 apimg=Image.new('L',(150,150));ImageDraw.Draw(apimg).polygon([tuple(p) for p in P['apertures'][row['frameClass']]],fill=255)
 ap=np.asarray(apimg)>0
 bg=np.asarray(Image.open(REC/'masks'/name))>0
 fg=(~bg)&ap
 if name=='glad_amason_ava.png':
  # This subject has dark disconnected matte debris beyond the useful hair
  # silhouette. A conservative manually reviewed envelope removes it.
  envelope=Image.new('L',(150,150))
  ImageDraw.Draw(envelope).polygon([(65,7),(84,7),(103,18),(119,45),(120,63),(124,95),(135,126),(145,139),(145,145),(5,145),(5,123),(20,121),(23,101),(27,78),(30,62),(36,39),(47,20)],fill=255)
  fg &= np.asarray(envelope)>0
  bg=ap&~fg
 core=erode(erode(fg))&ap
 y,x,d=nearest(core)
 expanded=bg.copy()
 for _ in range(3):expanded=dilate(expanded)
 band=(expanded&(~bg)&ap)
 guard=np.zeros((150,150),bool)
 if row.get('foregroundGuard'):
  gi=Image.new('L',(150,150));ImageDraw.Draw(gi).polygon([tuple(p) for p in row['foregroundGuard']],fill=255);guard=np.asarray(gi)>0
 band &= ~guard
 F=old[np.maximum(y,0),np.maximum(x,0)]
 v=F-B;cv=old-B
 alpha=np.clip(np.sum(cv*v,axis=2)/np.maximum(np.sum(v*v,axis=2),1),0,1)
 alpha[bg]=0
 # Far, weak dark fragments have no nearby opaque foreground support.
 weak=(np.max(np.abs(cv),axis=2)<48)&(d>4)&band
 alpha[weak]=0
 alpha[~(band|bg)]=1
 # Refine contour coverage without blurring the image; opaque core supplies
 # the boundary foreground color so the former black matte is not blended.
 geometry=Image.fromarray((fg*255).astype('uint8')).filter(ImageFilter.MedianFilter(3)).filter(ImageFilter.GaussianBlur(.6))
 coverage=np.asarray(geometry).astype(float)/255
 # Color coverage reduces hard dark fragments; retain a conservative floor for
 # real dark hair where opaque foreground and matte colors are ambiguous.
 coverage[band]=np.minimum(coverage[band],np.maximum(alpha[band],coverage[band]*.25))
 boundary=(coverage>.001)&(coverage<.999)&ap
 refined=F*coverage[:,:,None]+background*(1-coverage[:,:,None])
 result=old.copy();result[bg]=background[bg]
 result[boundary]=refined[boundary]
 result[(coverage<.001)&ap&~guard]=background[(coverage<.001)&ap&~guard]
 result[guard&ap]=current[guard&ap]
 alpha=coverage
 result=np.rint(result).clip(0,255).astype('uint8')
 result[~ap]=current[~ap]
 assert np.array_equal(result[~ap],current[~ap])
 assert np.array_equal(result[guard&ap],current[guard&ap])
 dest=HERE/name;dest.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(result).save(dest)
 Image.fromarray(np.rint(alpha*255).astype('uint8')).save(HERE/(name[:-4]+'-estimated-alpha.png'))
 rows.append({'name':name,'path':str(dest),'edgePixels':int(band.sum()),'partialAlphaPixels':int(((alpha>0)&(alpha<1)&band).sum()),'frameExact':True,'guardExact':True,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})

sheet=Image.new('RGB',(900,700),'#d4c9b4');draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',14)
for i,name in enumerate(names):
 for j,root in enumerate([OLD/'content/pic/mob',WORK/'content/pic/mob',HERE]):
  im=Image.open(root/name).convert('RGB');x=j*300;y=i*350
  draw.text((x+5,y+4),['original black','current hard mask','coverage + core color dematte'][j],fill='black',font=font)
  sheet.paste(im.resize((300,300),Image.Resampling.NEAREST),(x,y+25))
sheet.save(HERE/'comparison-2x.png')
(HERE/'results.json').write_text(json.dumps({'method':'contour-only median/coverage antialias; nearest opaque foreground color for matte decontamination','losslessAlphaRecovery':False,'files':rows},indent=2),encoding='utf-8')
print(json.dumps(rows))
