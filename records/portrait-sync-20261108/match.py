"""Read-only crop correspondence screening; low scores are review candidates, not verdicts."""
import json,sys,time
from pathlib import Path
import numpy as np
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
HERE=Path(__file__).resolve().parent
GAME=Path('G:/somi/Jack O Nine Tails v2.4_work/game/content/pic')
def match(row):
    with Image.open(GAME/row['base']['path']) as im:
        im=im.convert('RGBA');bg=Image.new('RGBA',im.size,(80,80,80,255));bg.alpha_composite(im)
        bg=bg.convert('L');bg.thumbnail((320,240),Image.Resampling.LANCZOS)
        full=np.asarray(bg,dtype=np.float32)[:170,:]
    with Image.open(row.get('candidate') or GAME/row['portraits']['seed_ava_clear']['path']) as im:
        im=im.convert('L');w,h=im.size;im=im.crop((int(w*.16),int(h*.16),int(w*.84),int(h*.84)))
    fftshape=(512,512);ff=np.fft.rfft2(full,s=fftshape)
    integral=np.pad(full,((1,0),(1,0))).cumsum(0).cumsum(1)
    integral2=np.pad(full*full,((1,0),(1,0))).cumsum(0).cumsum(1)
    best=(-1,None,None,None)
    for width in range(18,85,3):
        t=np.asarray(im.resize((width,width),Image.Resampling.LANCZOS),dtype=np.float32);t=t-t.mean();tn=np.linalg.norm(t)
        if tn<1e-5 or min(full.shape)<width:continue
        corr=np.fft.irfft2(ff*np.fft.rfft2(t[::-1,::-1],s=fftshape),s=fftshape)[width-1:full.shape[0],width-1:full.shape[1]]
        s=integral[width:,width:]-integral[:-width,width:]-integral[width:,:-width]+integral[:-width,:-width]
        s2=integral2[width:,width:]-integral2[:-width,width:]-integral2[width:,:-width]+integral2[:-width,:-width]
        den=np.sqrt(np.maximum(s2-s*s/(width*width),0))*tn
        score=np.divide(corr,den,out=np.full(corr.shape,-1.,dtype=np.float32),where=den>tn*width*3)
        y,x=np.unravel_index(score.argmax(),score.shape);v=float(score[y,x])
        if v>best[0]:best=(v,width,int(x),int(y))
    return {'id':row['id'],'correlation':best[0],'templateWidth':best[1],'x':best[2],'y':best[3]}
if __name__=='__main__':
    inv=json.loads((HERE/'inventory.json').read_text(encoding='utf8'))
    rows=[r for r in inv['rows'] if not r['missing']]
    if sys.argv[1]=='pack':rows=[r for r in rows if r['additionalPack']]
    results=[];start=time.time()
    with ThreadPoolExecutor(max_workers=3) as pool:
        for i,r in enumerate(pool.map(match,rows)):
            results.append(r)
            if (i+1)%100==0:print(f'{i+1}/{len(rows)} screened in {time.time()-start:.0f}s',flush=True)
    (HERE/('matches-'+sys.argv[1]+'.json')).write_text(json.dumps(results,indent=2),encoding='utf8')
    print(json.dumps({'rows':len(results),'above85':sum(r['correlation']>=.85 for r in results),'seconds':round(time.time()-start),'results':results if len(results)<30 else None}))
