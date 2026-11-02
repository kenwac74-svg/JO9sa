from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
from collections import deque
import numpy as np,json,hashlib,math
HERE=Path(__file__).parent
ROOT=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
TMP=Path('G:/Codex/tmp/mob-portrait-backgrounds-20261030')
REF=ROOT/'content/pic/mob/mob template.png'
SOURCE=ROOT/'content/modworkpic/00.mob/c1e00605112bd5699da8268431d89bfb_795x596.png'
TARGET='content/pic/mob/glad_mistress_ava_3.png'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
inv=json.loads((HERE/'inventory.json').read_text('utf-8'))
ARCHIVE=Path('G:/somi/JO9_work_backups/mob-portrait-backgrounds-20261030/original')
def input_path(rel):
    saved=ARCHIVE/rel
    return saved if saved.exists() else ROOT/rel
frames=json.loads(Path('G:/somi/JO9sa/records/mob-portrait-frames-20261029/plan.json').read_text('utf-8'))
cats={Path(x['path']).name:x['category'] for x in frames['rows']}
names=['glad_amason_ava.png','glad_armored_ava.png','glad_naked_ava.png']
names += [f'gladiator_champion_{x}_ava.png' for x in ['absolute','corvus','kamira','sepris','taurus','vatican']]
names += [f'gladiator_dimaha_{i}_ava.png' for i in range(1,6)]
names += [f'gladiator_hoplite_{i}_ava.png' for i in range(1,6)]
names += [f'gladiator_kimerian_{i}_ava.png' for i in range(1,5)]
names += [f'gladiator_secutor_{i}_ava.png' for i in [1,2,4,5]]
names += ['warg_ava.png','ride_morrigan.png']
assert len(names)==29 and len(set(names))==29
background=np.array(Image.open(REF).convert('RGB'))
TMP.mkdir(parents=True,exist_ok=True)

def aperture(name):
    cat=cats[name];m=Image.new('L',(150,150));ImageDraw.Draw(m).polygon([tuple(x) for x in frames['apertures'][cat]],fill=255)
    return np.array(m)>0,cat

def components(mask,minsize=12):
    seen=np.zeros(mask.shape,dtype=bool);out=seen.copy()
    h,w=mask.shape
    for y,x in zip(*np.where(mask)):
        if seen[y,x]:continue
        q=[(int(y),int(x))];seen[y,x]=True
        for yy,xx in q:
            for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                ny,nx=yy+dy,xx+dx
                if 0<=ny<h and 0<=nx<w and mask[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx]=True;q.append((ny,nx))
        if len(q)>=minsize:
            yy,xx=zip(*q);out[yy,xx]=True
    return out

def edge_connected(mask,ap):
    # Only the background component connected to the aperture perimeter is eligible.
    yy,xx=np.indices(ap.shape)
    edge=ap & ((yy<=17)|(xx<=17)|(xx>=132)|(yy>=132))
    out=np.zeros(mask.shape,dtype=bool);q=[(int(y),int(x)) for y,x in zip(*np.where(mask&edge))]
    for y,x in q:out[y,x]=True
    for y,x in q:
        for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
            ny,nx=y+dy,x+dx
            if 0<=ny<150 and 0<=nx<150 and mask[ny,nx] and not out[ny,nx]:out[ny,nx]=True;q.append((ny,nx))
    return out

rows=[];previews=[]
for name in names:
    rel='content/pic/mob/'+name;p=input_path(rel);old=np.array(Image.open(p).convert('RGB'));ap,cat=aperture(name)
    if name=='warg_ava.png':
        # Explicit exterior regions keep the dark mouth and fur outside the matte mask.
        roi=Image.new('L',(150,150));d=ImageDraw.Draw(roi)
        d.polygon([(0,0),(150,0),(150,12),(134,10),(125,5),(40,5),(34,25),(29,38),(14,45),(0,51)],fill=255)
        d.polygon([(0,71),(10,79),(17,95),(21,113),(32,132),(47,149),(0,149)],fill=255)
        raw=(np.max(old,axis=2)<=35)&(np.array(roi)>0)&ap
        mask=components(raw,10);method='exterior-region dark matte; mouth/fur excluded'
    elif name=='ride_morrigan.png':
        # The neutral charcoal background differs from the brown hair in chroma.
        rgb=old.astype(int)
        raw=(np.max(rgb,axis=2)<=65)&(np.max(rgb,axis=2)-np.min(rgb,axis=2)<=9)&ap
        mask=edge_connected(raw,ap);method='neutral charcoal perimeter matte; brown hair excluded'
    else:
        dist=np.max(np.abs(old.astype(int)-np.array([33,29,23])),axis=2)
        mask=edge_connected((dist<=9)&ap,ap);method='perimeter-connected original flat charcoal matte RGB(33,29,23)'
    clothing_guards={
        'glad_amason_ava.png':[(49,109),(89,105),(115,147),(32,147)],
        'gladiator_champion_corvus_ava.png':[(5,77),(28,98),(46,93),(97,93),(119,112),(145,85),(145,147),(5,147)],
        'gladiator_champion_vatican_ava.png':[(58,99),(90,98),(105,147),(43,147)],
        'gladiator_champion_taurus_ava.png':[(55,112),(98,108),(113,147),(36,147)],
        'gladiator_hoplite_3_ava.png':[(48,94),(101,94),(112,118),(144,132),(144,145),(5,145),(5,132),(37,115)],
        'gladiator_hoplite_5_ava.png':[(95,123),(109,111),(129,116),(143,131),(143,146),(95,146)],
    }
    guard_points=clothing_guards.get(name)
    if guard_points:
        guard=Image.new('L',(150,150));ImageDraw.Draw(guard).polygon(guard_points,fill=255)
        mask &= np.array(guard)==0
    after=old.copy();after[mask]=background[mask]
    assert np.array_equal(old[~mask],after[~mask]) and np.array_equal(old[~ap],after[~ap])
    assert mask.sum()>30,(name,int(mask.sum()))
    target=TMP/'candidate'/rel;target.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(after).save(target)
    mp=TMP/'masks'/name;mp.parent.mkdir(exist_ok=True);Image.fromarray(mask.astype(np.uint8)*255).save(mp)
    rows.append({'path':rel,'before':sha(p),'after':sha(target),'source':str(target),'bytes':target.stat().st_size,'type':'background','frameClass':cat,'method':method,'maskPixels':int(mask.sum()),'mask':str(mp),'foregroundGuard':guard_points,'outsideMaskExact':True,'frameExact':True})
    previews.append((name,old,after,mask))

# User supplied full image: derive a head portrait, retaining the current frame.
old=np.array(Image.open(input_path(TARGET)).convert('RGB'));ap,cat=aperture(Path(TARGET).name)
crop=(250,8,450,208)
face=Image.open(SOURCE).convert('RGB').crop(crop).resize((140,140),Image.Resampling.LANCZOS)
layer=Image.fromarray(background.copy());layer.paste(face,(5,5));arr=np.array(layer)
black=(np.max(arr,axis=2)<=30)&ap
mask=edge_connected(black,ap)
neck_guard=Image.new('L',(150,150));ImageDraw.Draw(neck_guard).polygon([(55,116),(87,116),(103,146),(53,146)],fill=255)
mask &= np.array(neck_guard)==0
arr[mask]=background[mask]
after=old.copy();after[ap]=arr[ap]
assert np.array_equal(old[~ap],after[~ap])
dest=TMP/'candidate'/TARGET;dest.parent.mkdir(parents=True,exist_ok=True);Image.fromarray(after).save(dest)
rows.append({'path':TARGET,'before':sha(input_path(TARGET)),'after':sha(dest),'source':str(dest),'bytes':dest.stat().st_size,'type':'character','frameClass':cat,'crop':list(crop),'sourceImage':str(SOURCE),'sourceSha256':sha(SOURCE),'method':'head crop and deterministic charcoal matte; current frame preserved','frameExact':True})
previews.insert(0,(Path(TARGET).name,old,after,ap))
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)
for start in range(0,len(previews),15):
    group=previews[start:start+15];sheet=Image.new('RGB',(1080,math.ceil(len(group)/3)*185),'#d3c6b0');d=ImageDraw.Draw(sheet)
    for i,(name,b,a,m) in enumerate(group):
        x=(i%3)*360;y=(i//3)*185;d.text((x+4,y+3),name,font=font,fill='black')
        sheet.paste(Image.fromarray(b),(x+10,y+22));sheet.paste(Image.fromarray(a),(x+175,y+22))
    sheet.save(HERE/f'comparison-{start//15+1}.jpg',quality=94)
protected=[{'path':x['path'],'sha256':x['sha256']} for x in inv['rows'] if x['path'] not in {r['path'] for r in rows}]
result={'id':'mob-portrait-backgrounds-20261030','qspBefore':inv['qspSha256'],'reference':str(REF),'referenceSha256':sha(REF),'sourceImage':str(SOURCE),'sourceSha256':sha(SOURCE),'inputPortraits':len(inv['rows']),'files':rows,'unchangedPortraits':protected,'backgroundOnly':29,'characterReplaced':1,'dimensions':[150,150],'keptOtherColoredBackground':['gladiator_kimerian_5_ava.png','gladiatrix2_ava.png','ride_jeeves.png'],'approval':'2026-10-30 user direct replace request; retain prior pixel-preserving composition method'}
assert sha(ROOT/'jack.qsp')==result['qspBefore']
(HERE/'manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'files':len(rows),'backgroundOnly':29,'character':1,'unchangedPortraits':len(protected)}))
