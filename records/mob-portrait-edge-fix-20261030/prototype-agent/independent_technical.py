from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib
H=Path(__file__).parent.parent
G=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
R=Path('G:/somi/JO9sa')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
mp=H/'manifest.json';version=sha(mp);m=json.loads(mp.read_text('utf-8'))
fr=json.loads((R/'records/mob-portrait-frames-20261029/plan.json').read_text('utf-8'))
checks=[]
for f in m['files']:
    p=Path(f['source']);before=G/f['path']
    assert sha(before)==f['before'],f['path']+' WORK drift'
    assert sha(p)==f['after'],f['path']+' candidate hash'
    with Image.open(p) as im:
        assert im.format=='PNG' and im.size==(150,150)
        after=np.array(im.convert('RGB'))
    current=np.array(Image.open(before).convert('RGB'))
    mask=Image.new('L',(150,150));ImageDraw.Draw(mask).polygon([tuple(z) for z in fr['apertures'][f['frameClass']]],fill=255);ap=np.array(mask)>0
    core=np.array(Image.open(f['protectedCorePath']))>0
    band=np.array(Image.open(f['changeBandPath']))>0
    alpha=np.array(Image.open(f['alphaPath']))
    assert alpha.shape==(150,150)
    assert np.array_equal(after[~ap],current[~ap]),f['path']+' frame mismatch'
    assert np.array_equal(after[core],current[core]),f['path']+' core mismatch'
    changed=np.any(after!=current,axis=2)
    assert not (changed&(~ap)).any()
    assert int(changed.sum())==f['changedPixels']
    assert not (changed&(~band)).any(),f['path']+' outside reported band'
    if f['alignment']:
        a=f['alignment'];assert sha(Path(a['source']))==a['sourceSha256'];assert sha(Path(a['registeredPath']))==a['registeredSha256']
    checks.append({'path':f['path'],'after':f['after'],'pass':True,'frameExact':True,'protectedCoreExact':True,'changedPixels':int(changed.sum()),'partialAlphaPixels':int(((alpha>0)&(alpha<255)&ap).sum()),'sourceType':'registered original RGBA' if f['alignment'] else 'estimated opaque-source matte'})
for f in m['unchangedPortraits']:assert sha(G/f['path'])==f['sha256']
assert sha(G/'jack.qsp')==m['qspBefore']
assert sha(mp)==version,'Manifest changed during audit'
report={'technicalPass':True,'manifestSha256':version,'files':checks,'originalAlphaSources':sum(bool(f['alignment']) for f in m['files']),'estimatedOpaqueSources':sum(not bool(f['alignment']) for f in m['files']),'unchangedPortraitsVerified':len(m['unchangedPortraits']),'qspUnchanged':True,'runtimeWrites':False}
(H/'independent-technical-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='files'}))
