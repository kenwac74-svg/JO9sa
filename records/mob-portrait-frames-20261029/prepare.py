from PIL import Image, ImageDraw
import numpy as np,json,hashlib
from pathlib import Path
G=Path('G:/somi/JO9_work_backups/mob-portrait-frames-20261029/original');T=Path('G:/Codex/tmp/mob-portrait-frames-20261029');T.mkdir(parents=True,exist_ok=True);(T/'candidate').mkdir(exist_ok=True);(T/'frames').mkdir(exist_ok=True)
REF={'default':'toadman_ava.png','undead':'lich_ava.png','elite':'swine_ava.png','colosseum':'medic_ava.png','race':'minion_ava.png'}
# The aperture excludes the source character. Outer frame pixels are copied verbatim.
AP={'default':[(5,5),(144,5),(144,144),(5,144)],'undead':[(13,4),(136,4),(145,13),(145,136),(136,145),(13,145),(4,136),(4,13)],'elite':[(13,5),(136,5),(144,13),(144,136),(136,144),(13,144),(5,136),(5,13)],'colosseum':[(14,4),(135,4),(145,14),(145,135),(135,145),(14,145),(4,135),(4,14)],'race':[(11,4),(138,4),(145,11),(145,138),(138,145),(11,145),(4,138),(4,11)]}
frames={}; masks={}
for key,n in REF.items():
 im=Image.open(G/'content/pic/mob'/n).convert('RGBA');mask=Image.new('L',(150,150),255);ImageDraw.Draw(mask).polygon(AP[key],fill=0);im.putalpha(mask);im.save(T/'frames'/(key+'.png'));frames[key]=np.array(im);masks[key]=np.array(mask)>0
# Only the outer margins and corner ornament remnants can change. No rescale/crop.
oldmask=Image.new('L',(150,150),255);ImageDraw.Draw(oldmask).polygon([(18,7),(131,7),(142,18),(142,131),(131,142),(18,142),(7,131),(7,18)],fill=0);oldmask=np.array(oldmask)>0

def compose(src,key):
 arr=np.array(Image.open(src).convert('RGBA'));assert arr.shape==(150,150,4)
 known=arr[:,:,:3].astype(np.float32); repair=oldmask & ~masks[key]
 # Harmonic interpolation only where a removed corner/border would otherwise show.
 work=known.copy();work[repair]=known[~oldmask].mean(axis=0)
 for _ in range(240):
  p=np.pad(work,((1,1),(1,1),(0,0)),mode='edge')
  avg=(p[:-2,1:-1]+p[2:,1:-1]+p[1:-1,:-2]+p[1:-1,2:])*0.25
  work[repair]=avg[repair]
 result=arr.copy();result[repair,:3]=np.rint(work[repair]).clip(0,255).astype(np.uint8);result[repair,3]=255
 result[masks[key]]=frames[key][masks[key]]
 assert np.array_equal(arr[18:132,18:132],result[18:132,18:132])
 return Image.fromarray(result),int(repair.sum())

rows=[];exclude={'mob template.png','chariot_race_champion.png','chariot_race_grand_champion.png','gladiator_prisoners_ava.png'}
for p in sorted((G/'content/pic/mob').glob('*')):
 if p.suffix.lower() not in ['.png','.jpg']:continue
 im=Image.open(p)
 if im.size!=(150,150) or p.name in exclude:continue
 n=p.name.lower();k='default'
 if n in {'lich_ava.png','vampire_ava.png'}:k='undead'
 elif n in {'werewolf_ava.png','ogre_ava.png','warg_ava.png','strazhnik_ava.png'}:k='elite'
 elif n.startswith('ride_'):k='race'
 elif n.startswith(('gladiator_dimaha_','gladiator_hoplite_','gladiator_kimerian_','gladiator_secutor_','gladiator_champion_','gladiator_prisoner_')) or ('_ava' in n and n.startswith(('glad_amason','glad_armored','glad_naked','glad_mistress','glad_shinobi'))):k='colosseum'
 rows.append({'path':p.relative_to(G).as_posix(),'category':k,'source':p.relative_to(G).as_posix()})
rows.append({'path':'content/pic/characters/mistress_ava.png','category':'colosseum','source':'content/pic/characters/mistress_ava.png'})
# User decision: shared fog/arena spawn uses the default frame; no new path or QSP edit.
for row in rows:
 src=G/row['source'];dest=T/'candidate'/row['path'];dest.parent.mkdir(parents=True,exist_ok=True)
 # Preserve reference originals exactly if that file retains its original class.
 if src.name==REF[row['category']]:
  dest.write_bytes(src.read_bytes());repair=0
 else:
  im,repair=compose(src,row['category'])
  if Image.open(src).mode=='RGB':im=im.convert('RGB')
  im.save(dest,format='JPEG',quality=100,subsampling=0,optimize=True) if dest.suffix.lower()=='.jpg' else im.save(dest,format='PNG')
 row.update({'before':hashlib.sha256((G/row['path']).read_bytes()).hexdigest() if (G/row['path']).exists() else None,'after':hashlib.sha256(dest.read_bytes()).hexdigest(),'repairPixels':repair,'dimensions':[150,150],'sourceCenterPreserved':[18,18,132,132]})
(T/'plan.json').write_text(json.dumps({'references':REF,'apertures':AP,'rows':rows,'excluded':sorted(exclude),'qspSHA256':hashlib.sha256(Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp').read_bytes()).hexdigest()},ensure_ascii=False,indent=2),encoding='utf-8')
from collections import Counter
print({'candidatePortraits':len(rows),'categories':dict(Counter(r['category'] for r in rows))})
# Side by side sample strip; all selected inputs are ordinary head/face portraits.
samples=['swine_ava.png','medic_ava.png','minion_ava.png','vampire_ava.png','werewolf_ava.png','gladiator_dimaha_1_ava.png','ride_ippolita.png','egeya_ava.png']
sheet=Image.new('RGB',(1280,430),'#d5c8ac');d=ImageDraw.Draw(sheet)
for i,n in enumerate(samples):
 row=next(r for r in rows if Path(r['path']).name==n);x=(i%4)*320;y=(i//4)*210
 d.text((x+4,y+3),n+' -> '+row['category'],fill='black')
 for off,p in [(0,G/row['source']),(155,T/'candidate'/row['path'])]:
  pic=Image.open(p).convert('RGBA');sheet.paste(pic,(x+off+4,y+22),pic)
 d.text((x+4,y+176),'before                  after',fill='black')
sheet.save(T/'comparison.png')
