from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageFont
import numpy as np,json,hashlib,math
H=Path(__file__).parent
G=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
R=Path('G:/somi/JO9sa')
T=Path('G:/Codex/tmp/mob-portrait-edge-fix-20261030')
OLDREC=R/'records/mob-portrait-backgrounds-20261030'
OLD=json.loads((OLDREC/'manifest.json').read_text('utf-8'))
FRAMES=json.loads((R/'records/mob-portrait-frames-20261029/plan.json').read_text('utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
bg=np.array(Image.open(OLD['reference']).convert('RGB')).astype(float)
T.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)
alignment_data=json.loads((H/'source-alignment/progress.json').read_text('utf-8'))
assert alignment_data['completed']==27
alignments={r['portrait']:r for r in alignment_data['results']}

def dilate(m,r=1):return np.array(Image.fromarray(m.astype(np.uint8)*255).filter(ImageFilter.MaxFilter(2*r+1)))>0
def erode(m,r=1):return np.array(Image.fromarray(m.astype(np.uint8)*255).filter(ImageFilter.MinFilter(2*r+1)))>0

def raw_source(f):
    p=Path('G:/somi/JO9_work_backups/mob-portrait-backgrounds-20261030/original')/f['path']
    if f['type']=='background':return np.array(Image.open(p).convert('RGB')).astype(float)
    face=Image.open(OLD['sourceImage']).convert('RGB').crop(tuple(f['crop'])).resize((140,140),Image.Resampling.LANCZOS)
    plate=Image.fromarray(bg.astype(np.uint8));plate.paste(face,(5,5))
    return np.array(plate).astype(float)

def aperture(f):
    im=Image.new('L',(150,150));ImageDraw.Draw(im).polygon([tuple(p) for p in FRAMES['apertures'][f['frameClass']]],fill=255)
    return np.array(im)>0

rows=[];images=[]
for f in OLD['files']:
    saved=Path('G:/somi/JO9_work_backups/mob-portrait-edge-fix-20261030/original')/f['path']
    p=saved if saved.exists() else G/f['path'];assert sha(p)==f['after'],'Input changed: '+f['path']
    current=np.array(Image.open(p).convert('RGB'));original=raw_source(f);ap=aperture(f)
    alignment=alignments.get(f['path'])
    if f.get('mask'):
        mask=np.array(Image.open(OLDREC/'masks'/Path(f['mask']).name))>0
    else:mask=np.all(current==bg.astype(np.uint8),axis=2)&ap
    if f['path'].endswith('warg_ava.png'):
        yy,xx=np.indices(mask.shape)
        upper_gap=ap&(xx>=105)&(yy<=16)
        neutral_dark=(np.max(original,axis=2)<=35)&(np.max(original,axis=2)-np.min(original,axis=2)<=4)
        # The verified neutral gap above the fur is background, not a dark tuft.
        mask[upper_gap]=neutral_dark[upper_gap]
    fg=ap&~mask
    # A narrow trimap keeps the face and body interior untouched.
    sure_fg=erode(fg,2)&ap
    sure_bg=erode(mask,2)&ap
    unknown=ap&~sure_fg&~sure_bg
    guard=Image.new('L',(150,150));d=ImageDraw.Draw(guard)
    if f.get('foregroundGuard'):d.polygon([tuple(p) for p in f['foregroundGuard']],fill=255)
    if f['type']=='character':d.polygon([(55,116),(87,116),(103,146),(53,146)],fill=255)
    guard=np.array(guard)>0
    # Preserve guard interior. Its exterior boundary remains eligible for matting.
    protected=erode(guard,1)&ap
    unknown &= ~protected
    sure_fg |= protected
    fyx=np.column_stack(np.where(sure_fg));byx=np.column_stack(np.where(sure_bg))
    assert len(fyx)>50 and len(byx)>20
    alpha=np.where(mask,0.0,1.0)
    old_bg=np.full((150,150,3),[33.,29.,23.])
    neutral=f['path'].endswith(('warg_ava.png','ride_morrigan.png'))
    if f['type']=='character':old_bg[:]=[4.,4.,4.]
    for y,x in np.column_stack(np.where(unknown)):
        if alignment:break
        xy=np.array([y,x]);distf=((fyx-xy)**2).sum(axis=1)
        ix=np.argpartition(distf,min(35,len(distf)-1))[:36]
        if neutral:
            distb=((byx-xy)**2).sum(axis=1);ib=np.argpartition(distb,min(7,len(distb)-1))[:8]
            B=np.median(original[byx[ib,0],byx[ib,1]],axis=0)
            old_bg[y,x]=B
        else:B=old_bg[y,x]
        C=original[y,x];F=original[fyx[ix,0],fyx[ix,1]]
        v=F-B;den=(v*v).sum(axis=1)
        valid=den>36
        aval=np.clip(((C-B)*v).sum(axis=1)/np.maximum(den,1),0,1)
        residual=((C-B-aval[:,None]*v)**2).sum(axis=1)
        score=residual/(np.sum((C-B)**2)+36)+0.0025*distf[ix]
        score[~valid]=1e8
        a=float(aval[np.argmin(score)])
        # Background color matches must not become isolated opaque dots.
        if np.max(np.abs(C-B))<4:a=0.0
        alpha[y,x]=a
    # Subpixel transition limited to the trimap, not a blur of the artwork.
    soft=np.array(Image.fromarray(np.rint(alpha*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.35)))/255
    alpha[unknown]=0.85*alpha[unknown]+0.15*soft[unknown]
    alpha[sure_bg]=0;alpha[sure_fg]=1
    # Unmix the old matte, then composite with the new plate. Clamp estimated F.
    denom=np.maximum(alpha[:,:,None],.01)
    F=np.clip((original-(1-alpha[:,:,None])*old_bg)/denom,0,255)
    rebuilt=alpha[:,:,None]*F+(1-alpha[:,:,None])*bg
    result=current.copy()
    result[unknown]=np.rint(rebuilt[unknown]).clip(0,255).astype(np.uint8)
    result[sure_bg]=bg[sure_bg].astype(np.uint8)
    method='local foreground color-line alpha estimate and old-matte decontamination in narrow trimap'
    if alignment:
        registered=Path(alignment['registeredPath']);assert sha(registered)==alignment['registeredSha256']
        assert sha(Path(alignment['source']))==alignment['sourceSha256']
        # Use true source F and alpha, rather than blending already matted C again.
        rgba=np.array(Image.open(registered).convert('RGBA')).astype(float)
        alpha=rgba[:,:,3]/255
        composite=rgba[:,:,:3]*alpha[:,:,None]+bg*(1-alpha[:,:,None])
        unknown=ap&~sure_fg
        result[unknown]=np.rint(composite[unknown]).clip(0,255).astype(np.uint8)
        method='registered original RGBA alpha composite; premultiplied source resampling; current opaque interior restored'
    assert np.array_equal(result[~ap],current[~ap])
    assert np.array_equal(result[sure_fg],current[sure_fg])
    changed=np.any(result!=current,axis=2)
    assert not np.any(changed&~ap)
    allowed_band=unknown.copy()
    if f['path'].endswith('warg_ava.png'):
        allowed_band |= upper_gap
        method += '; verified neutral upper background gap repair'
    out=T/'candidate'/f['path'];out.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(result).save(out)
    alphap=T/'alpha'/Path(f['path']).name;alphap.parent.mkdir(exist_ok=True);Image.fromarray(np.rint(alpha*255).astype(np.uint8)).save(alphap)
    bandp=T/'change-band'/Path(f['path']).name;bandp.parent.mkdir(exist_ok=True);Image.fromarray(allowed_band.astype(np.uint8)*255).save(bandp)
    corep=T/'protected-core'/Path(f['path']).name;corep.parent.mkdir(exist_ok=True);Image.fromarray(sure_fg.astype(np.uint8)*255).save(corep)
    rows.append({'path':f['path'],'before':sha(p),'after':sha(out),'source':str(out),'bytes':out.stat().st_size,'type':'edge-fix','frameClass':f['frameClass'],'changedPixels':int(changed.sum()),'partialAlphaPixels':int(((alpha>0)&(alpha<1)&ap).sum()),'alphaPath':str(alphap),'changeBandPath':str(bandp),'protectedCorePath':str(corep),'method':method,'alignment':alignment,'dimensions':[150,150]})
    images.append((Path(f['path']).name,current,result))

for start in range(0,len(images),15):
    group=images[start:start+15];sheet=Image.new('RGB',(1080,math.ceil(len(group)/3)*185),'#d3c6b0');draw=ImageDraw.Draw(sheet)
    for i,(n,b,a) in enumerate(group):
        x=(i%3)*360;y=(i//3)*185;draw.text((x+4,y+3),n,font=font,fill='black');sheet.paste(Image.fromarray(b),(x+10,y+22));sheet.paste(Image.fromarray(a),(x+175,y+22))
    sheet.save(H/f'comparison-{start//15+1}.png')
samples=['glad_amason_ava.png','gladiator_hoplite_1_ava.png','gladiator_champion_corvus_ava.png','glad_mistress_ava_3.png','warg_ava.png','ride_morrigan.png']
for n in samples:
    _,b,a=next(z for z in images if z[0]==n)
    s=Image.new('RGB',(900,470),'#d3c6b0');draw=ImageDraw.Draw(s)
    for i,(im,label) in enumerate([(b,'CURRENT'),(a,'EDGE REPAIR')]):
        draw.text((i*450+6,3),label+' '+n,font=font,fill='black');s.paste(Image.fromarray(im).resize((450,450),Image.Resampling.NEAREST),(i*450,20))
    s.save(H/(n.replace('.png','')+'-detail.png'))
manifest={'id':'mob-portrait-edge-fix-20261030','approval':'user: work와 이미지 리스트에 반영해','files':rows,'qspBefore':sha(G/'jack.qsp'),'reference':OLD['reference'],'referenceSha256':sha(Path(OLD['reference'])),'sourceImage':OLD['sourceImage'],'sourceSha256':sha(Path(OLD['sourceImage'])),'unchangedPortraits':OLD['unchangedPortraits'],'dimensions':[150,150],'originalAlphaSources':27,'estimatedAlphaSources':3,'note':'27 originals use registered true source RGBA; 3 opaque-source edge mattes are estimated, not lossless alpha recovery. No redraw; no full-image blur.'}
(H/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'files':len(rows),'changed':sum(x['changedPixels'] for x in rows),'partialAlpha':sum(x['partialAlphaPixels'] for x in rows)}))
