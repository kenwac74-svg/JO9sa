from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json,hashlib,sys
H=Path(__file__).parent;G=Path('G:/somi/Jack O Nine Tails v2.4_work/game');R=Path('G:/somi/JO9sa')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
m=json.loads((H/'manifest.json').read_text('utf-8'));candidate='--candidate' in sys.argv
receipt=None if candidate else json.loads((H/'installation.json').read_text('utf-8'))
frames=json.loads((R/'records/mob-portrait-frames-20261029/plan.json').read_text('utf-8'))
assert sha(G/'jack.qsp')==m['qspBefore'];assert sha(Path(m['sourceImage']))==m['sourceSha256']
def artifact(p):
    q=Path(p)
    return q if q.exists() else R/'records'/m['id']/'masks'/q.parent.name/q.name
checks=[];coretotal=0
for f in m['files']:
    if candidate:p=Path(f['source']);oldp=G/f['path']
    else:
        row=next(x for x in receipt['files'] if x['path']==f['path']);p=G/f['path'];oldp=Path(row['beforePath'])
        assert sha(R/'resources/new'/f['path'])==f['after']
    assert sha(p)==f['after'];assert sha(oldp)==f['before']
    with Image.open(p) as im:assert im.format=='PNG' and im.size==(150,150);new=np.array(im.convert('RGB'))
    old=np.array(Image.open(oldp).convert('RGB'))
    ap=Image.new('L',(150,150));ImageDraw.Draw(ap).polygon([tuple(v) for v in frames['apertures'][f['frameClass']]],fill=255);ap=np.array(ap)>0
    core=np.array(Image.open(artifact(f['protectedCorePath'])))>0
    band=np.array(Image.open(artifact(f['changeBandPath'])))>0
    alpha=np.array(Image.open(artifact(f['alphaPath'])))
    assert np.array_equal(new[~ap],old[~ap]),'Frame changed '+f['path']
    assert np.array_equal(new[core],old[core]),'Interior changed '+f['path']
    assert np.array_equal(new[~band],old[~band]),'Outside boundary changed '+f['path']
    changed=int(np.any(new!=old,axis=2).sum());assert changed==f['changedPixels'] and changed>0
    assert int(((alpha>0)&(alpha<255)&ap).sum())>30
    if f['alignment']:
        a=f['alignment'];assert sha(Path(a['source']))==a['sourceSha256']
    checks.append({'path':f['path'],'pass':True,'changedPixels':changed,'frameExact':True,'protectedInteriorExact':True,'protectedInteriorPixels':int(core.sum())});coretotal+=int(core.sum())
for f in m['unchangedPortraits']:assert sha(G/f['path'])==f['sha256']
report={'pass':True,'mode':'candidate' if candidate else 'installed','manifestSha256':sha(H/'manifest.json'),'files':len(checks),'originalAlphaSources':27,'estimatedAlphaSources':3,'dimensions':[150,150],'allFramesExact':True,'protectedInteriorExact':True,'protectedInteriorPixels':coretotal,'unaffectedPortraits':68,'qspUnchanged':True,'filesVerified':checks}
reportp=H/('candidate-verification.json' if candidate else 'png-verification.json');reportp.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='filesVerified'}))
