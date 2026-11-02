from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,numpy as np
B=Path(__file__).parent
R=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((B/'manifest.json').read_text('utf-8'))
frames=json.loads(Path('G:/somi/JO9sa/records/mob-portrait-frames-20261029/plan.json').read_text('utf-8'))
checks=[]
for f in manifest['files']:
    old=np.array(Image.open(R/f['path']).convert('RGB'))
    p=Path(f['source']);new=np.array(Image.open(p).convert('RGB'))
    am=Image.new('L',(150,150));ImageDraw.Draw(am).polygon([tuple(x) for x in frames['apertures'][f['frameClass']]],fill=255)
    ap=np.array(am)>0
    assert sha(p)==f['after']
    assert old.shape==new.shape==(150,150,3)
    assert np.array_equal(old[~ap],new[~ap])
    record={'path':f['path'],'candidateSha256':f['after'],'frameExact':True,'dimensions':[150,150]}
    if f['type']=='background':
        mask=np.array(Image.open(f['mask']).convert('L'))>0
        assert np.array_equal(old[~mask],new[~mask])
        record['outsideBackgroundMaskExact']=True
        if f.get('foregroundGuard'):
            gm=Image.new('L',(150,150));ImageDraw.Draw(gm).polygon([tuple(x) for x in f['foregroundGuard']],fill=255)
            guard=np.array(gm)>0
            assert np.array_equal(old[guard],new[guard])
            record['clothingGuardExact']=True
    else:
        # Independently reconstruct only the user-source crop before background masking.
        src=Image.open(f['sourceImage']).convert('RGB').crop(tuple(f['crop'])).resize((140,140),Image.Resampling.LANCZOS)
        raw=Image.open(manifest['reference']).convert('RGB');raw.paste(src,(5,5));raw=np.array(raw)
        gm=Image.new('L',(150,150));ImageDraw.Draw(gm).polygon([(55,116),(87,116),(103,146),(53,146)],fill=255)
        guard=(np.array(gm)>0)&ap
        assert np.array_equal(raw[guard],new[guard])
        record['sourceNeckAdornmentGuardExact']=True
    checks.append(record)
for f in manifest['unchangedPortraits']:
    assert sha(R/f['path'])==f['sha256']
assert sha(R/'jack.qsp')==manifest['qspBefore']
history=[
 {'path':'content/pic/mob/gladiator_kimerian_5_ava.png','found':'Initial small contact-sheet classification included it as black. Enlarged original showed green forest.','resolution':'Excluded from modification before adoption.'},
 {'path':'content/pic/mob/gladiator_hoplite_5_ava.png','found':'Initial candidate changed dark right shoulder armor to ochre.','resolution':'Foreground polygon guard added; final direct PNG visually restored and guard pixels equal WORK original.'},
 {'path':'content/pic/mob/glad_mistress_ava_3.png','found':'Initial candidate changed the black lace/neck adornment below the chin to ochre. Raw supplied-source crop confirmed foreground.','resolution':'Neck foreground guard added; final direct PNG visually restored and guard pixels equal resized user-source crop.'},
 {'path':'content/pic/mob/gladiator_champion_corvus_ava.png','found':'Parent identified dark cloak/neck region background-mask leakage.','resolution':'Expanded foreground guard; final direct PNG visually restored and guard pixels equal WORK original.'},
 {'path':'content/pic/mob/gladiator_champion_vatican_ava.png','found':'Parent identified dark neck garment background-mask leakage.','resolution':'Foreground guard; final direct PNG visually restored and guard pixels equal WORK original.'},
 {'path':'content/pic/mob/gladiator_hoplite_3_ava.png','found':'Parent identified dark neck armor background-mask leakage.','resolution':'Foreground guard; final direct PNG visually restored and guard pixels equal WORK original.'}
]
report={'pass':True,'reviewedCandidateCount':len(checks),'backgroundOnly':29,'characterReplacement':1,'unchangedPortraitsChecked':len(manifest['unchangedPortraits']),'manifestSha256':sha(B/'manifest.json'),'visualReview':['comparison-1.jpg','comparison-2.jpg','direct candidate PNGs: mistress3, corvus, hoplite5, vatican, hoplite3'],'visualFindings':'All previously reported foreground leaks are visually corrected. No additional ochre intrusion into faces, hair, or clothing was found in final comparison sheets. Warg mouth/fur and Morrigan brown hair look preserved.','history':history,'checks':checks,'qspUnchanged':True,'workImagesUnchangedDuringReview':True,'limitations':'Visual review plus deterministic frame/mask/foreground-guard comparisons; not an in-game play test. Border anti-aliasing may retain dark fringe at 150x150.'}
(B/'independent-candidate-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in ('history','checks')},ensure_ascii=False))
