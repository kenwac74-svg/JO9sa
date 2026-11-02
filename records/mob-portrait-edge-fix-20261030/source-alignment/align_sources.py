from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import numpy as np, json, hashlib, math, time
from concurrent.futures import ThreadPoolExecutor, as_completed

HERE=Path(__file__).parent
BODY=Path('G:/somi/JO9resource/mob_body')
BEFORE=Path('G:/somi/JO9_work_backups/mob-portrait-backgrounds-20261030/original')
MANIFEST=Path('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/mob-portrait-backgrounds-20261030/manifest.json')
MATTE=(33,29,23,255)
PATCH=(40,40,110,110)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
HERE.mkdir(parents=True,exist_ok=True)
(HERE/'registered-rgba').mkdir(exist_ok=True)
data=json.loads(MANIFEST.read_text('utf-8'))
rows=[f for f in data['files'] if f['type']=='background' and Path(f['path']).name not in ('warg_ava.png','ride_morrigan.png')]
assert len(rows)==27

def gray(im):
    a=np.asarray(im.convert('RGB'),dtype=np.float32)
    return a[:,:,0]*0.299+a[:,:,1]*0.587+a[:,:,2]*0.114

def window_sum(a,h,w):
    p=np.pad(a,((1,0),(1,0))).cumsum(0).cumsum(1)
    return p[h:,w:]-p[:-h,w:]-p[h:,:-w]+p[:-h,:-w]

def resize_rgba_premultiplied(src,size):
    # Explicit RGBa representation avoids interpolating invisible black RGB into edges.
    return src.convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')

def find_mapping(src,portrait,cache=None):
    template=gray(portrait.crop(PATCH));h,w=template.shape
    t2=float((template*template).sum());by_size={}
    def score(scale):
        size=(round(src.width*scale),round(src.height*scale))
        if size in by_size:return by_size[size]
        im=resize_rgba_premultiplied(src,size)
        comp=Image.new('RGBA',size,MATTE);comp.alpha_composite(im)
        arr=gray(comp);H,W=arr.shape
        shape=(1<<(H+h-2).bit_length(),1<<(W+w-2).bit_length())
        cross=np.fft.irfft2(np.fft.rfft2(arr,shape)*np.fft.rfft2(template[::-1,::-1],shape),shape)[h-1:H,w-1:W]
        mse=(window_sum(arr*arr,h,w)-2*cross+t2)/(h*w)
        yy,xx=np.unravel_index(np.argmin(mse),mse.shape)
        result=(float(mse[yy,xx]),float(scale),int(xx)-PATCH[0],int(yy)-PATCH[1],size)
        by_size[size]=result
        return result
    if cache:
        rough=score(cache)
    else:
        rough=min((score(float(s)) for s in np.arange(.25,1.251,.025)),key=lambda x:x[0])
    best=min((score(float(s)) for s in np.arange(max(.20,rough[1]-.03),rough[1]+.0301,.001)),key=lambda x:x[0])
    return best

CACHE={'glad_amason_ava.png':.629,'gladiator_hoplite_1_ava.png':.582,'gladiator_champion_corvus_ava.png':.731}

def align(row):
    started=time.monotonic();name=Path(row['path']).name
    before=BEFORE/row['path'];source=BODY/name.replace('_ava','')
    assert sha(before)==row['before'],name+' original hash drift'
    source_hash=sha(source)
    src=Image.open(source).convert('RGBA');portrait=Image.open(before).convert('RGB')
    alpha=np.array(src.getchannel('A'))
    assert alpha.min()==0 and alpha.max()==255 and ((alpha>0)&(alpha<255)).any()
    score,scale,x,y,size=find_mapping(src,portrait,CACHE.get(name))
    resized=resize_rgba_premultiplied(src,size)
    # Out-of-source portions remain truly transparent, including negative crop coordinates.
    registered=resized.crop((x,y,x+150,y+150))
    target=HERE/'registered-rgba'/name;registered.save(target)
    comp=Image.new('RGBA',(150,150),MATTE);comp.alpha_composite(registered)
    old=np.array(portrait,dtype=np.float32);new=np.array(comp.convert('RGB'),dtype=np.float32)
    delta=old[40:110,40:110]-new[40:110,40:110]
    mae=float(np.abs(delta).mean());rgbmse=float((delta*delta).mean())
    g1=gray(portrait)[40:110,40:110].ravel();g2=gray(comp)[40:110,40:110].ravel()
    corr=float(np.corrcoef(g1,g2)[0,1])
    partial=int(((np.array(registered.getchannel('A'))>0)&(np.array(registered.getchannel('A'))<255)).sum())
    uncertain=score>140 or mae>9 or corr<.97
    assert sha(source)==source_hash
    result={'portrait':row['path'],'source':str(source),'sourceSha256':source_hash,'sourceMode':'RGBA','sourceDimensions':list(src.size),'beforePath':str(before),'beforeSha256':row['before'],'registeredPath':str(target),'registeredSha256':sha(target),'dimensions':[150,150],'scale':scale,'scaledSourceSize':list(size),'portraitOriginInScaledSource':[x,y],'centralPatch':list(PATCH),'grayMSE':score,'centerRGBMAE':mae,'centerRGBMSE':rgbmse,'centerGrayCorrelation':corr,'registeredPartialAlphaPixels':partial,'resampling':'explicit premultiplied RGBa LANCZOS; crop preserves alpha; no new background in output','needsVisualReview':uncertain,'seconds':round(time.monotonic()-started,3)}
    print(json.dumps({'portrait':name,'grayMSE':round(score,3),'RGBMAE':round(mae,3),'corr':round(corr,5),'review':uncertain,'scale':round(scale,4),'origin':[x,y]}),flush=True)
    return result

start=time.monotonic();results=[]
with ThreadPoolExecutor(max_workers=3) as pool:
    jobs=[pool.submit(align,row) for row in rows]
    for job in as_completed(jobs):
        results.append(job.result())
        (HERE/'progress.json').write_text(json.dumps({'completed':len(results),'total':27,'results':results},ensure_ascii=False,indent=2),encoding='utf-8')
results.sort(key=lambda x:x['portrait'])
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)
for start_index in range(0,len(results),12):
    group=results[start_index:start_index+12]
    sheet=Image.new('RGB',(1080,math.ceil(len(group)/3)*205),'#d7cab5');d=ImageDraw.Draw(sheet)
    for i,r in enumerate(group):
        x=(i%3)*360;y=(i//3)*205
        d.text((x+3,y+2),Path(r['portrait']).name,font=font,fill='black')
        old=Image.open(r['beforePath']).convert('RGB')
        aligned=Image.new('RGBA',(150,150),MATTE);aligned.alpha_composite(Image.open(r['registeredPath']).convert('RGBA'))
        sheet.paste(old,(x+7,y+22));sheet.paste(aligned.convert('RGB'),(x+177,y+22))
        d.text((x+4,y+177),f"before / registered MSE {r['grayMSE']:.1f} MAE {r['centerRGBMAE']:.1f}",font=font,fill='red' if r['needsVisualReview'] else 'black')
        d.text((x+4,y+192),f"s={r['scale']:.3f} origin={r['portraitOriginInScaledSource']}",font=font,fill='black')
    sheet.save(HERE/f'alignment-comparison-{start_index//12+1}.jpg',quality=94)
report={'pass':True,'purpose':'Read-only source registration; not WORK adoption','sourceRoot':str(BODY),'beforeRoot':str(BEFORE),'manifestSha256':sha(MANIFEST),'files':len(results),'uncertainMappings':sum(r['needsVisualReview'] for r in results),'seconds':round(time.monotonic()-start,3),'results':results}
(HERE/'alignment.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='results'}),flush=True)
