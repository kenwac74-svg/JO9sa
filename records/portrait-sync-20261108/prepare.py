"""Authorized deterministic head crops and border-only candidates. Never writes WORK."""
import json,hashlib,io,zipfile
from pathlib import Path
from datetime import datetime,timezone
import numpy as np
from PIL import Image,ImageOps,ImageDraw,ImageFont
H=Path(__file__).resolve().parent;G=Path('G:/somi/Jack O Nine Tails v2.4_work/game');T=Path('G:/Codex/tmp/portrait-sync-20261108')
load=lambda p:json.loads(p.read_text(encoding='utf8'))
sha=lambda b:hashlib.sha256(b).hexdigest()
EXTRA={1203:(267,38,457,228),2575:(304,3,494,193),2613:(270,12,480,222),2617:(313,48,493,228),3011:(310,0,500,190),3018:(307,0,507,200)}
def filtered(im,kind):
 a=np.asarray(im.convert('RGB'),dtype=np.float32)
 if kind=='gray':a=np.repeat((a@np.array([.2126,.7152,.0722],np.float32))[:,:,None],3,axis=2)
 elif kind=='sepia':a=a@(.8*np.array([[.393,.769,.189],[.349,.686,.168],[.272,.534,.131]],np.float32)+.2*np.eye(3,dtype=np.float32)).T
 return Image.fromarray(np.rint(a).clip(0,255).astype('uint8')).convert('RGBA')
def kind(path):return 'gray' if '_gray' in Path(path).stem.lower() else 'sepia' if '_sepia' in Path(path).stem.lower() else 'color'
def main():
 assert not T.exists(),'Review existing staging before repeating.'
 inv=load(H/'inventory.json');frame=load(H/'frame-screen.json');rows=inv['rows'];selected=[r for r in rows if r['full25'] or r['id'] in EXTRA]
 assert len(selected)==31
 # The 90 manually verified frameless files exclude existing black/gray/gold borders.
 candidates=frame['candidates'];frameless=[candidates[i]['path'] for i in list(range(66,111))+list(range(128,170))+list(range(175,178))]
 assert len(frameless)==90
 refs={k:'girls/face/0001_black_long_loli'+suffix+'.png' for k,suffix in [('color',''),('gray','_gray'),('sepia','_sepia')]}
 refdata={k:(G/'content/pic'/p).read_bytes() for k,p in refs.items()}
 frames={k:Image.open(io.BytesIO(b)).convert('RGBA') for k,b in refdata.items()}
 data=[];used=set();T.mkdir(parents=True);(T/'candidate').mkdir()
 for r in selected:
  source=G/'content/pic'/r['base']['path'];raw=source.read_bytes();assert sha(raw)==r['base']['sha256']
  with Image.open(source) as opened:full=opened.convert('RGBA')
  if r['id'] in EXTRA:box=EXTRA[r['id']]
  else:
   a=np.asarray(full);m=(a[:,:,3]>220)&(a[:,:,:3].max(2)>28);ys,xs=np.where(m[:175]);top=int(ys.min());cx=(int(xs.min())+int(xs.max()))/2;side=190
   box=(round(cx-side/2),max(0,top-5),round(cx+side/2),max(0,top-5)+side)
  crop=full.crop(box);bg=Image.new('RGBA',crop.size,'#211d17');bg.alpha_composite(crop);crop=bg
  for field,f in r['portraits'].items():
   path=f['path'];used.add(path);before=(G/'content/pic'/path).read_bytes();assert sha(before)==f['sha256']
   with Image.open(io.BytesIO(before)) as old:size=old.size;old=old.convert('RGBA')
   color_kind=kind(path);baseframe=frames[color_kind].resize(size,Image.Resampling.LANCZOS) if path in frameless else old.copy()
   face=filtered(crop,color_kind).resize((size[0]-10,size[1]-10),Image.Resampling.LANCZOS);baseframe.paste(face,(5,5))
   target=T/'candidate'/path;target.parent.mkdir(parents=True,exist_ok=True);baseframe.save(target,format='PNG',optimize=True)
   data.append({'path':path,'characterId':r['id'],'name':r['name'],'operation':'head-crop','source':r['base']['path'],'sourceSha256':r['base']['sha256'],'crop':list(box),'kind':color_kind,'width':size[0],'height':size[1],'before':sha(before),'after':sha(target.read_bytes()),'bytes':target.stat().st_size,'existingFramePreserved':path not in frameless})
 for path in frameless:
  if path in used:continue
  before=(G/'content/pic'/path).read_bytes()
  with Image.open(io.BytesIO(before)) as old:old=old.convert('RGBA');size=old.size
  result=old.copy();fr=frames[kind(path)].resize(size,Image.Resampling.LANCZOS);a=np.asarray(result).copy();b=np.asarray(fr);mask=np.ones((size[1],size[0]),bool);mask[5:-5,5:-5]=False;a[mask]=b[mask];result=Image.fromarray(a)
  assert np.array_equal(np.asarray(old)[5:-5,5:-5],np.asarray(result)[5:-5,5:-5])
  target=T/'candidate'/path;target.parent.mkdir(parents=True,exist_ok=True);result.save(target,format='PNG',optimize=True)
  data.append({'path':path,'operation':'frame-only','kind':kind(path),'width':size[0],'height':size[1],'before':sha(before),'after':sha(target.read_bytes()),'bytes':target.stat().st_size,'centerPixelsPreserved':True})
 assert len(data)==108
 plan={'id':'portrait-sync-20261108','created':datetime.now(timezone.utc).isoformat(),'stage':str(T),'qspHash':sha((G/'jack.qsp').read_bytes()),'jsonHashes':{r['json']:r['jsonHash'] for r in rows},'sourcePortraitsSearched':{'assetNames':159773,'relatedUniqueCandidatePairs':89,'nameIndependentColorPortraits':1900,'nameIndependentCandidatePairs':300},'sourceFrames':{k:{'path':refs[k],'sha256':sha(refdata[k])} for k in refs},'framelessDetected':90,'changedCharacters':31,'headCropFiles':93,'borderOnlyFiles':15,'files':data}
 (H/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf8')
 font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
 for page in range((len(selected)+5)//6):
  group=selected[page*6:page*6+6];sheet=Image.new('RGB',(1000,200*len(group)+35),'#eeeeee');dr=ImageDraw.Draw(sheet);dr.text((5,5),'ID / OLD color / NEW color / NEW gray / NEW sepia',fill='black',font=font)
  for i,r in enumerate(group):
   y=35+i*200;dr.text((5,y+60),str(r['id']),fill='black',font=font)
   files=[G/'content/pic'/r['portraits']['seed_ava_clear']['path'],*[T/'candidate'/r['portraits'][k]['path'] for k in ['seed_ava_clear','seed_ava_gray','seed_ava']]]
   for col,p in enumerate(files):
    with Image.open(p) as im:im=ImageOps.contain(im.convert('RGB'),(180,180),Image.Resampling.LANCZOS)
    sheet.paste(im,(80+col*225,y))
  sheet.save(H/f'portrait-review-{page+1}.jpg',quality=94)
 print(json.dumps({k:plan[k] for k in ['changedCharacters','headCropFiles','borderOnlyFiles','framelessDetected','stage']}))
if __name__=='__main__':main()
