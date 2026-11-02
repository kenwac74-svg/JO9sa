"""Prepare approved six-image adoption; read-only outside this evidence folder."""
from pathlib import Path
from PIL import Image
import hashlib,json,re

HERE=Path(__file__).resolve().parent
REVIEW=HERE.parent/'catfight-combat-redraw-20261030'
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO=Path('G:/somi/JO9sa')
ARCHIVE=Path('G:/somi/JO9resource/mob_body/catfight_originals_20261030')
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
baseline=read(REVIEW/'baseline.json');v=read(REVIEW/'review-manifest.json')
assert len(v['entries'])==6
files=[]
for e in v['entries']:
    rel=e['runtimePath'];p=WORK/rel;src=Path(e['gameReadyPath'])
    before=e.get('currentWorkSha256')
    assert p.is_file()==(before is not None),rel+' existence changed'
    if before:assert sha(p)==before,rel+' WORK changed'
    assert sha(src)==e['sha256'],rel+' selected review changed'
    with Image.open(src) as im:
        im.load();assert im.format=='PNG' and im.size==(795,596)
        assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
    oldpath=ARCHIVE/'runtime'/rel if before else None
    if before and e['key']!='gladiatrix1':assert oldpath.is_file() and sha(oldpath)==before
    if before and e['key']=='gladiatrix1':assert not oldpath.exists(),'Unexpected first original archive'
    tracked=REPO/'resources/new'/rel
    trackedBefore=sha(tracked) if tracked.is_file() else None
    assert trackedBefore in (None,before),'Different tracked original requires explicit recovery: '+rel
    files.append(dict(path=rel,source=str(src),after=e['sha256'],before=before,key=e['key'],phase=e['slot'],
                      bytes=src.stat().st_size,beforePath=str(oldpath) if before else None,
                      trackedBefore=trackedBefore,trackedBeforePath=str(oldpath) if trackedBefore else None))
protected={str(WORK/'jack.qsp'):sha(WORK/'jack.qsp')}
for e in baseline['entries']:
    p=WORK/e['slots']['portrait']['path'];assert sha(p)==e['slots']['portrait']['sha256'];protected[str(p)]=sha(p)
for root in (WORK/'modtools/catalog',REPO/'tools/local-workspace/catalog-seed'):
    p=root/'catalog_work_ids.json';protected[str(p)]=sha(p)
for rel in ['tools/mob-image-sets/group-sets.json','assets/compatibility-aliases/2026-10-28_fullimage.json']:
    p=REPO/rel;protected[str(p)]=sha(p)
aliases=(REPO/'assets/compatibility-aliases/2026-10-28_fullimage.json').read_text(encoding='utf8').lower()
assert all(f['path'].lower() not in aliases for f in files)
html=(WORK/'modtools/catalog/catalog_merge_vs_original.html').read_text(encoding='utf8')
mob=json.loads(re.search(r'window.JO9_MOB_SETS=(.*?);</script>',html)[1])
plan=read(REPO/'records/full-client-preparation-20261029/full-client-input-plan.json')
targets={f['path'].lower() for f in files}
summary={k:val for k,val in mob.items() if k not in ('entries','groups')}
planrows=[x for x in plan['files'] if x['path'].removeprefix('game/').lower() in targets]
absent=[f['path'] for f in files if not any(x['path'].removeprefix('game/').lower()==f['path'].lower() for x in planrows)]
assert absent==['content/pic/mob/defeated/gladiatrix1.png'],absent
manifest=dict(id='catfight-combat-adopted-20261030',date='2026-10-30',approval='6컷 WORK 적용·원본 이동',files=files,
              sourceDrift=[],subjects=3,qspBefore=protected[str(WORK/'jack.qsp')],protectedHashes=protected,
              reviewManifest=str(REVIEW/'review-manifest.json'),archiveRoot=str(ARCHIVE))
(HERE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
(HERE/'preflight-context.json').write_text(json.dumps(dict(mobSummary=summary,planSummary=plan['summary'],
    existingPlanRows=planrows,missingPlanPaths=absent),ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(dict(prepared=True,files=len(files),existingWORK=5,newWORK=1,protected=len(protected),
                     existingPlanRows=len(planrows),missingPlanPaths=absent,mobSummary=mob.get('summary')),ensure_ascii=False))
