"""Find original transparent battle bodies. Read-only except local inventory.
Original bytes, alpha and dimensions are never transformed.
"""
from pathlib import Path
from PIL import Image
import os,stat,re,json,hashlib,collections
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO=Path('G:/somi/JO9sa');BACK=Path('G:/somi/JO9_work_backups')
DEST=Path('G:/somi/JO9resource/mob_body')
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def norm(p):return str(p).replace('\\','/').lower()
html=(WORK/'modtools/catalog/catalog_merge_vs_original.html').read_text(encoding='utf-8-sig')
mob=json.loads(re.search(r'window.JO9_MOB_SETS=(.*?);</script>',html)[1])
runtime={};aliases={}
for e in mob['entries']:
    p=e['standing']['path'];runtime.setdefault(norm(p),dict(path=p,keys=[],names=[]))
    runtime[norm(p)]['keys'].append(e['key']);runtime[norm(p)]['names'].append(e['name'])
    aliases[e['key'].lower()]=p;aliases[Path(p).stem.lower()]=p
comp=load(ROOT/'output/mob-background-composites-20261029/manifest.json')
for f in comp['files']:
    if any(u['slot']=='standing' for u in f['uses']):
        p=f['path'];runtime.setdefault(norm(p),dict(path=p,keys=[],names=[]))
        for u in f['uses']:
            if u['slot']=='standing':runtime[norm(p)]['keys'].append(u['key']);runtime[norm(p)]['names'].append(u['name'])
        aliases[Path(p).stem.lower()]=p
# Before grinch_full was split, grinch.png was also used for the battle body.
aliases['grinch']='content/pic/mob/grinch_full.png'
byname={Path(r['path']).name.lower():r['path'] for r in runtime.values()};byname['grinch.png']='content/pic/mob/grinch_full.png'
candidates={};missing=[];errors=[]
def add(p,runtimepath,origin):
    p=Path(p)
    if p.suffix.lower()!='.png':return
    key=norm(p)
    if not p.exists():missing.append(dict(path=str(p),runtimePath=runtimepath,origin=origin));return
    if key not in candidates:candidates[key]=dict(path=str(p),runtimePaths=[],origins=[])
    r=candidates[key]
    if runtimepath and runtimepath not in r['runtimePaths']:r['runtimePaths'].append(runtimepath)
    if origin not in r['origins']:r['origins'].append(origin)
def scan(root,origin,output_mode=False):
    root=Path(root)
    if not root.exists():return
    for folder,dirs,files in os.walk(root,followlinks=False):
        dirs[:]=[d for d in dirs if not (os.lstat(Path(folder)/d).st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT)]
        low=norm(folder)
        if 'defeat' in low or '/groups' in low:dirs[:]=[];continue
        for name in files:
            if not name.lower().endswith('.png'):continue
            stem=Path(name).stem.lower();target=byname.get(name.lower())
            if output_mode and not target:
                if '/images/battle' in low or stem.endswith('_battle'):
                    target=aliases.get(stem.removesuffix('_battle'))
            if target:add(Path(folder)/name,target,origin)
for sub in ['mob','characters']:
    for base,origin in [(WORK,'current-work'),(Path('G:/somi/JO9O/game'),'original-game'),(REPO/'resources/new','tracked-resource')]:
        scan(base/'content/pic'/sub,origin)
scan(BACK,'verified-backup')
scan(ROOT/'output','project-review-original',True)
# Explicit manifests retain randomly named high-resolution generated originals.
for recorddir in (REPO/'records').glob('mob-*'):
    for filename in ['selected-final-files.json','generated-manifest.json']:
        p=recorddir/filename
        if not p.exists():continue
        d=load(p);rows=d if isinstance(d,list) else d.get('rows',[])
        for r in rows:
            target=r.get('target','')
            if '_standing' in r.get('key','') and target:
                for k in ['generatedSource','candidate','beforePath']:
                    if r.get(k):add(r[k],target,str(p))
for extras in [HERE/'extra-candidates.json',HERE/'supplementary-candidates.json']:
    if extras.exists():
        data=load(extras);data=data if isinstance(data,list) else data.get('candidates',[])
        for r in data:
            origin=r.get('provenance','additional provenance audit')
            if isinstance(origin,list):origin=' | '.join(origin)
            add(r['path'],r.get('runtimePath'),origin)
records=[]
for r in candidates.values():
    p=Path(r['path'])
    try:
        b=p.read_bytes();digest=hashlib.sha256(b).hexdigest()
        with Image.open(p) as im:
            im.load();size=im.size;rgba=im.convert('RGBA');h=rgba.getchannel('A').histogram();lo=min(i for i,v in enumerate(h) if v);hi=max(i for i,v in enumerate(h) if v)
            count=size[0]*size[1];clear=sum(h[:16]);foreground=sum(h[16:]);pixel=hashlib.sha256(str(size).encode()+b'|'+rgba.tobytes()).hexdigest()
        reason=None
        if max(size)<=220:reason='portrait-or-small-icon'
        elif foreground==0:reason='empty-transparent-image'
        elif clear/count<0.01:reason='no-transparent-background'
        r.update(bytes=len(b),sha256=digest,pixelSha256=pixel,width=size[0],height=size[1],alphaMin=lo,alphaMax=hi,transparentLikePixels=clear,transparentPercent=round(clear/count*100,3),included=reason is None,exclusionReason=reason)
        records.append(r)
    except Exception as e:errors.append(dict(path=str(p),error=str(e)))
unique={}
for r in records:
    if r['included']:unique.setdefault(r['pixelSha256'],[]).append(r)
summary=dict(candidateFiles=len(records),transparentSourceFiles=sum(r['included'] for r in records),uniqueTransparentPixelImages=len(unique),uniqueHighResolutionImages=sum(max(g[0]['width']/795,g[0]['height']/596)>1.01 for g in unique.values()),excluded=dict(collections.Counter(r['exclusionReason'] for r in records if not r['included'])),missingSourceReferences=len(missing),readErrors=len(errors))
protected=[WORK/'jack.qsp',WORK/'modtools/catalog/catalog_merge_vs_original.html',WORK/'modtools/catalog/catalog_status.js',WORK/'modtools/catalog/catalog_work_ids.json']
out=dict(date='2026-10-29',destination=str(DEST),scope='Existing transparent battle standing bodies and their high-resolution originals; portraits, defeat poses, racing-only portraits, effects and opaque scene images excluded.',runtimePaths=list(runtime.values()),summary=summary,records=records,missing=missing,errors=errors,protected=[dict(path=str(p),sha256=sha(p)) for p in protected])
(HERE/'inventory.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False))
