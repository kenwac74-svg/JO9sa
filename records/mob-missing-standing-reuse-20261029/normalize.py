from pathlib import Path
from PIL import Image
import hashlib,json,datetime
G=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
R=Path('G:/somi/JO9sa/records/mob-missing-standing-reuse-20261029')
S=Path('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/battle-mob-review-20261027/images/battle')
T=Path('G:/Codex/tmp/mob-missing-standing-reuse-20261029')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
expected={'egeya':'1879644cb046a3395d4c23b09b6fa827a0b75c367b606b7590a79fe225fa114f','erza':'29160c41d1853388e1d5851a36e32f9d3df7c7394acd12ebabcf0d4bbd334fde','strazhnik':'ab671d26a6caf838e590df595b616107d19469b8129a6e96eb27234bcf868b35','vatican_paladin':'6ff62762fcf26199c780e2e58176177d35c926ff2a8f46818021057fd740419f'}
qsp=sha(G/'jack.qsp');assert qsp=='ea9a02151917f6ddf416553c0b409862b47efcd877937c515cecd502a5b922b3'
assert not T.exists(),'Inspect existing temp root before repeating';T.mkdir(parents=True)
files=[]
for key,h in expected.items():
 source=S/(key+'.png');target='content/pic/mob/'+key+'.png'
 assert sha(source)==h
 assert not (G/target).exists()
 assert not (Path('G:/somi/JO9sa/resources/new')/target).exists()
 with Image.open(source) as im:
  im.load();assert im.size==(1448,1086) and im.mode=='RGBA' and im.format=='PNG'
  factor=min(795/im.width,596/im.height);size=(round(im.width*factor),round(im.height*factor));offset=((795-size[0])//2,(596-size[1])//2)
  canvas=Image.new('RGBA',(795,596),(0,0,0,0));resized=im.resize(size,Image.Resampling.LANCZOS);canvas.paste(resized,offset);out=T/(key+'.png');canvas.save(out,format='PNG',optimize=True)
 with Image.open(out) as check:
  check.load();assert check.size==(795,596) and check.mode=='RGBA' and check.getchannel('A').getextrema()==(0,255)
 files.append({'key':key,'source':str(source),'sourceSHA256':h,'sourceSize':[1448,1086],'path':target,'normalized':str(out),'before':None,'after':sha(out),'bytes':out.stat().st_size,'size':[795,596],'mode':'RGBA','alphaRange':[0,255],'geometry':{'method':'contain/Lanczos; preserve alpha; no crop','resized':list(size),'offset':list(offset),'scale':factor}})
report={'status':'PREPARED','qspSHA256':qsp,'files':files,'sourceImagesPreserved':True}
(R/'prepared.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'status':'PREPARED','images':len(files),'size':[795,596]},ensure_ascii=False))
