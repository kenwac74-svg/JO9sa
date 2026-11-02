"""Prepare the nine explicitly approved quest scenes, preserving the held tenth."""
from pathlib import Path
from PIL import Image
import hashlib,json,re

HERE=Path(__file__).resolve().parent;REVIEW=HERE.parent/'quest-combat-redraw-20261030'
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game');REPO=Path('G:/somi/JO9sa')
ARCHIVE=Path('G:/somi/JO9resource/mob_body/quest_originals_20261030')
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
v=read(REVIEW/'review-manifest.json');baseline=read(REVIEW/'inventory.json')
assert len(v['entries'])==9 and len(v['blocked'])==1
held=v['blocked'][0];assert held['key']=='egeya' and held['slot']=='defeat'
files=[]
for e in v['entries']:
    rel=e['runtimePath'];p=WORK/rel;src=Path(e['gameReadyPath']);before=e['currentWorkSha256']
    assert p.is_file() and sha(p)==before,'WORK changed since approved review: '+rel
    assert sha(src)==e['sha256'],'Review changed: '+rel
    with Image.open(src) as im:
        im.load();assert im.format=='PNG' and im.size==(795,596)
        assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
    old=ARCHIVE/'runtime'/rel;assert not old.exists(),'Archive collision: '+str(old)
    mirror=REPO/'resources/new'/rel;trackedBefore=sha(mirror) if mirror.is_file() else None
    trackedOld=(ARCHIVE/'tracked-original'/rel) if trackedBefore and trackedBefore!=before else old if trackedBefore else None
    if trackedOld:assert not trackedOld.exists(),'Tracked archive collision'
    files.append(dict(path=rel,source=str(src),before=before,after=e['sha256'],bytes=src.stat().st_size,key=e['key'],phase=e['slot'],beforePath=str(old),trackedBefore=trackedBefore,trackedBeforePath=str(trackedOld) if trackedOld else None))
protected={str(WORK/'jack.qsp'):sha(WORK/'jack.qsp')}
assert protected[str(WORK/'jack.qsp')]==baseline['qspSha256']
for e in baseline['entries']:
    s=e['slots']['portrait'];p=WORK/s['path'];assert sha(p)==s['actualSha256'];protected[str(p)]=sha(p)
heldPath=WORK/held['runtimePath'];assert sha(heldPath)==held['currentWorkSha256'];protected[str(heldPath)]=sha(heldPath)
for root in [WORK/'modtools/catalog',REPO/'tools/local-workspace/catalog-seed']:
    p=root/'catalog_work_ids.json';protected[str(p)]=sha(p)
for rel in ['tools/mob-image-sets/group-sets.json','assets/compatibility-aliases/2026-10-28_fullimage.json']:
    p=REPO/rel;protected[str(p)]=sha(p)
aliases=(REPO/'assets/compatibility-aliases/2026-10-28_fullimage.json').read_text(encoding='utf8').lower()
assert all(f['path'].lower() not in aliases for f in files)
plan=read(REPO/'records/full-client-preparation-20261029/full-client-input-plan.json')
targets={f['path'].lower() for f in files};rows=[x for x in plan['files'] if x['path'].removeprefix('game/').lower() in targets]
assert len(rows)==9 and {x['path'].removeprefix('game/').lower() for x in rows}==targets
planDrift=[dict(path=f['path'],workBefore=f['before'],planBefore=next(x['sha256'] for x in rows if x['path'].removeprefix('game/').lower()==f['path'].lower())) for f in files if next(x['sha256'] for x in rows if x['path'].removeprefix('game/').lower()==f['path'].lower())!=f['before']]
manifest=dict(id='quest-combat-adopted-20261030',date='2026-10-30',approval='9컷 WORK 적용·원본 이동',files=files,sourceDrift=[],subjects=5,qspBefore=protected[str(WORK/'jack.qsp')],protectedHashes=protected,reviewManifest=str(REVIEW/'review-manifest.json'),archiveRoot=str(ARCHIVE),heldRetained=dict(key='egeya',path=held['runtimePath'],sha256=sha(heldPath)),planBaselineDrift=planDrift)
(HERE/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(dict(prepared=True,files=9,subjects=5,standing=5,defeat=4,protected=len(protected),trackedExisting=sum(f['trackedBefore'] is not None for f in files),differentTracked=sum(f['trackedBefore'] not in (None,f['before']) for f in files),planRows=len(rows),planBaselineDrift=planDrift,archiveRoot=str(ARCHIVE)),ensure_ascii=False))
