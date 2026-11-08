from __future__ import annotations
import collections, hashlib, importlib.util, json, re, sys
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

GAME=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO=Path('G:/somi/JO9sa')
OUT=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
memo={}
def info(rel):
    if not rel:return None
    if rel in memo:return memo[rel]
    p=GAME/'content/pic'/rel
    row={'path':rel,'exists':p.is_file()}
    if row['exists']:
        b=p.read_bytes();row.update(sha256=sha(b),bytes=len(b))
        try:
            with Image.open(p) as im: row.update(size=list(im.size),format=im.format);im.verify()
        except Exception as e: row['error']=str(e)
    memo[rel]=row;return row
def normstem(p):
    return re.sub(r'_(?:gray|sepia)$','',Path(p).stem.lower())
def portrait_metrics(paths):
    images=[]
    for p in paths:
        if not p or not (GAME/'content/pic'/p).is_file():return None
        with Image.open(GAME/'content/pic'/p) as im:
            im=im.convert('RGB').resize((96,96),Image.Resampling.LANCZOS).crop((12,12,84,84))
            v=np.asarray(im.convert('L'),dtype=np.float32)/255
            dx=np.diff(v,axis=1)[:-1,:];dy=np.diff(v,axis=0)[:,:-1]
            images.append(np.concatenate((dx.ravel(),dy.ravel())))
    a=images[0];result=[]
    for b in images[1:]:
        den=np.linalg.norm(a)*np.linalg.norm(b)
        result.append(float(np.dot(a,b)/den) if den>1e-8 else None)
    return {'grayEdgeCorrelation':result[0],'sepiaEdgeCorrelation':result[1]}
def inventory():
    module=REPO/'tools/girls-image-checklist/build_inventory.py'
    spec=importlib.util.spec_from_file_location('girls_inventory',module);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
    initial=sha((GAME/'jack.qsp').read_bytes());doc=m.build(GAME)
    text=(GAME/'modtools/catalog/catalog_merge_vs_original.html').read_text(encoding='utf8')
    pack=json.loads(re.search(r'<script>window.JO9_ADDITIONAL_PACK=(.*?);</script>',text,re.S)[1])
    packids={f['newId'] for f in pack['files']}
    latest=load(REPO/'records/full-image-update-20261105/manifest.json');latestids={f['characterId'] for f in latest['files']}
    rows=[]
    for r in doc['characters']:
        j=load(GAME/r['json']);keys=['seed_ava_clear','seed_ava_gray','seed_ava'];refs=r['refs']
        portraits=[refs.get(k) for k in keys];base=r['effectiveBase']['path']
        item={'id':r['id'],'name':r['name'],'json':r['json'],'jsonHash':r['jsonSha256'],'groups':r['randomGroups'],'seedAge':j.get('seed_age'),'baseField':r['effectiveBase']['source'],'base':info(base),'portraits':{k:info(refs.get(k)) for k in keys},'additionalPack':r['id'] in packids,'full25':r['id'] in latestids}
        item['missing']=[k for k,v in [('base',item['base']),*item['portraits'].items()] if not v or not v['exists']]
        item['stemMismatch']=bool(base and all(portraits) and len({normstem(x) for x in [base,*portraits]})>1)
        item['portraitMetrics']=portrait_metrics(portraits)
        rows.append(item)
    result={'createdAt':datetime.now(timezone.utc).isoformat(),'game':str(GAME),'qspHash':initial,'characters':len(rows),'jsonErrors':doc['errors'],'rows':rows}
    assert initial==sha((GAME/'jack.qsp').read_bytes())
    (OUT/'inventory.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    low=[{'id':r['id'],'groups':r['groups'],**r['portraitMetrics']} for r in rows if r['portraitMetrics'] and any(x is not None and x<.75 for x in r['portraitMetrics'].values())]
    print(json.dumps({'characters':len(rows),'missingPairs':len([r for r in rows if r['missing']]),'stemMismatch':len([r for r in rows if r['stemMismatch']]),'additional':len(packids),'variantCandidates':low,'jsonErrors':doc['errors']},ensure_ascii=False))
def head_image(p):
    with Image.open(GAME/'content/pic'/p) as opened:
        im=opened.convert('RGBA')
    a=np.asarray(im);mask=a[:,:,3]>30
    if mask.mean()>.97:mask=(a[:,:,:3].max(axis=2)>24)&mask
    ys,xs=np.where(mask)
    if len(xs):
        left,right,top,bottom=int(xs.min()),int(xs.max()),int(ys.min()),int(ys.max())
        height=max(1,bottom-top+1);headheight=min(145,max(90,int(height*.25)))
        center=(left+right)/2;half=max(headheight*.7,60)
        im=im.crop((max(0,int(center-half)),max(0,top-8),min(im.width,int(center+half)),min(im.height,top+headheight)))
    return im
def sheets(ids=None,prefix='additional-heads'):
    rows=load(OUT/'inventory.json')['rows'];chosen=[r for r in rows if r['additionalPack']] if ids is None else [r for r in rows if r['id'] in ids]
    # Only the head area is displayed; no full-body review copy is produced.
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
    for page in range((len(chosen)+5)//6):
        group=chosen[page*6:page*6+6];sheet=Image.new('RGB',(860,200*len(group)+40),'#eeeeee');draw=ImageDraw.Draw(sheet)
        draw.text((12,8),'ID / current standing head / color portrait / gray / sepia',font=font,fill='black')
        for i,r in enumerate(group):
            y=40+i*200;draw.text((8,y+60),str(r['id']),font=font,fill='black')
            pairs=[r['base'],*r['portraits'].values()]
            for col,f in enumerate(pairs):
                x=75+col*195;draw.rectangle((x,y,x+185,y+175),fill='#555555')
                if not f or not f['exists']:continue
                if col==0:im=head_image(f['path'])
                else:
                    with Image.open(GAME/'content/pic'/f['path']) as src:im=src.convert('RGBA')
                im=ImageOps.contain(im,(180,170),Image.Resampling.LANCZOS);bg=Image.new('RGBA',im.size,'#555555');bg.alpha_composite(im)
                sheet.paste(bg.convert('RGB'),(x+(185-im.width)//2,y+(175-im.height)//2))
        target=OUT/f'{prefix}-{page+1}.jpg';sheet.save(target,quality=92)
    print('Head-only review sheets:',(len(chosen)+5)//6)
def global_sheets():
    rows=load(OUT/'inventory.json')['rows'];scores={r['id']:r for r in load(OUT/'matches-all.json')}
    chosen=[r for r in rows if not r['additionalPack'] and scores.get(r['id'],{}).get('correlation',-1)<.85]
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
    for page in range((len(chosen)+35)//36):
        group=chosen[page*36:page*36+36];sheet=Image.new('RGB',(1200,6*182+35),'#eeeeee');draw=ImageDraw.Draw(sheet)
        draw.text((8,5),'WORK candidates: standing head (left) / current color portrait (right)',font=font,fill='black')
        for i,r in enumerate(group):
            x=(i%6)*200;y=35+(i//6)*182
            draw.text((x+5,y),str(r['id'])+'  '+str(round(scores[r['id']]['correlation'],2)),font=font,fill='black')
            for col,f in enumerate([r['base'],r['portraits']['seed_ava_clear']]):
                left=x+col*100+2;top=y+23;draw.rectangle((left,top,left+96,top+145),fill='#555555')
                if col==0:im=head_image(f['path'])
                else:
                    with Image.open(GAME/'content/pic'/f['path']) as src:im=src.convert('RGBA')
                im=ImageOps.contain(im,(94,140),Image.Resampling.LANCZOS);bg=Image.new('RGBA',im.size,'#555555');bg.alpha_composite(im);sheet.paste(bg.convert('RGB'),(left+(96-im.width)//2,top+(145-im.height)//2))
        sheet.save(OUT/f'global-candidates-{page+1}.jpg',quality=93)
    print(json.dumps({'candidates':len(chosen),'sheets':(len(chosen)+35)//36,'sameCropStrong':len(rows)-len(chosen)-27,'candidateIds':[r['id'] for r in chosen]}))
if __name__=='__main__':
    if sys.argv[1]=='inventory':inventory()
    elif sys.argv[1]=='sheets':sheets()
    elif sys.argv[1]=='details':sheets({1037,1065,1133,1203,2575,2576,2611,2612,2613,2617,3011,3018},'detail-heads')
    elif sys.argv[1]=='global-sheets':global_sheets()
    else:raise SystemExit('inventory|sheets|global-sheets')
