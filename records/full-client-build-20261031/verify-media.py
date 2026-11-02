import os,json,time
from PIL import Image
root=r'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/content'
out=r'G:/somi/JO9sa/records/full-client-build-20261031/media-verification.json'
counts={}; errors=[]; unusual=[]; started=time.time(); checked=0
for folder,dirs,files in os.walk(root,followlinks=False):
    for name in files:
        if os.path.splitext(name)[1].lower() not in ('.png','.jpg','.jpeg','.gif','.webp','.bmp','.ico'):continue
        f=os.path.join(folder,name)
        try:
            with Image.open(f) as im:
                fmt=im.format; size=im.size; im.verify()
            counts[fmt]=counts.get(fmt,0)+1
            rel=os.path.relpath(f,os.path.dirname(root)).replace('\\','/')
            if '/mob/' in rel and not name.endswith('_ava.png') and '/defeated/' in rel and size!=(795,596):unusual.append({'path':rel,'size':size})
        except Exception as e:errors.append({'path':os.path.relpath(f,root).replace('\\','/'),'error':str(e)})
        checked+=1
        if checked%5000==0:print(json.dumps({'checked':checked,'errors':len(errors)}),flush=True)
result={'checked':checked,'formats':counts,'errors':errors,'nonstandardDefeatedDimensions':unusual,'seconds':time.time()-started,'method':'Pillow Image.verify, PNG CRC/structure; not a visual quality or full animated playback test'}
with open(out,'w',encoding='utf8') as f:json.dump(result,f,ensure_ascii=False,indent=2)
print(json.dumps({k:v for k,v in result.items() if k!='errors'}),flush=True)
raise SystemExit(1 if errors else 0)
