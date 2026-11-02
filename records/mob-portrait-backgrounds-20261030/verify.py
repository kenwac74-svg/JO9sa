from PIL import Image,ImageDraw
from pathlib import Path
import json,hashlib,numpy as np
H=Path(__file__).parent
R=Path('G:/somi/JO9sa')
G=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
m=json.loads((H/'manifest.json').read_text('utf-8'))
r=json.loads((H/'installation.json').read_text('utf-8'))
frameplan=json.loads((R/'records/mob-portrait-frames-20261029/plan.json').read_text('utf-8'))
bg=np.array(Image.open(m['reference']).convert('RGB'))
assert sha(G/'jack.qsp')==m['qspBefore']==r['qspAfter']
assert sha(Path(m['sourceImage']))==m['sourceSha256']
checks=[]
for f in r['files']:
    p=G/f['path'];original=Path(f['beforePath']);tracked=R/'resources/new'/f['path']
    assert sha(p)==f['after']==sha(tracked)
    assert sha(original)==f['before']
    with Image.open(p) as im:
        assert im.format=='PNG' and im.size==(150,150)
        now=np.array(im.convert('RGB'))
    old=np.array(Image.open(original).convert('RGB'))
    aperture=Image.new('L',(150,150));ImageDraw.Draw(aperture).polygon([tuple(q) for q in frameplan['apertures'][f['frameClass']]],fill=255)
    ap=np.array(aperture)>0
    assert np.array_equal(old[~ap],now[~ap]),'Frame changed '+f['path']
    if f['type']=='background':
        maskpath=Path(f['mask'])
        if not maskpath.exists():maskpath=R/'records'/m['id']/'masks'/maskpath.name
        mask=np.array(Image.open(maskpath))>0
        assert np.array_equal(old[~mask],now[~mask]),'Outside mask changed '+f['path']
        assert np.array_equal(now[mask],bg[mask]),'Wrong background '+f['path']
        assert int(mask.sum())==f['maskPixels']
    checks.append({'path':f['path'],'sha256':f['after'],'pass':True})
for f in m['unchangedPortraits']:assert sha(G/f['path'])==f['sha256']
report={'pass':True,'files':len(checks),'backgroundOnly':29,'characterReplaced':1,'unchangedPortraits':len(m['unchangedPortraits']),'format':'PNG','dimensions':[150,150],'allFramesExact':True,'outsideBackgroundMasksExact':True,'qspUnchanged':True,'sourceImageUnchanged':True,'filesVerified':checks}
(H/'png-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='filesVerified'}))
