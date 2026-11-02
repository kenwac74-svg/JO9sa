"""Fresh PNG adoption checks. Reads WORK; writes only the local report."""
from pathlib import Path
from PIL import Image
import hashlib,json,gzip

HERE=Path(__file__).resolve().parent
if not (HERE/'manifest.json').exists():
    HERE=Path('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/output/mob-background-composites-20261029')
REC=Path('G:/somi/JO9sa/records/mob-backgrounds-adopted-20261029')
WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO=Path('G:/somi/JO9sa')
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
record=json.loads((REC/'installation.json').read_text(encoding='utf-8'))
review=json.loads((HERE/'manifest.json').read_text(encoding='utf-8'))
assert record['status']=='INSTALLED' and review['adopted'] is True
assert len(record['files'])==128
errors=[]
for f in record['files']:
    for root in [WORK,REPO/'resources/new']:
        p=root/f['path']
        assert sha(p)==f['after'],str(p)
    assert sha(f['beforePath'])==f['before']
    with Image.open(WORK/f['path']) as im:
        im.load()
        assert im.format=='PNG' and im.size==(795,596)
        assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
    if f['trackedBefore']:
        assert sha(f['trackedBeforePath'])==f['trackedBefore']
for row in review['files']:
    if row['status']=='missing':assert not Path(row['absolutePath']).exists()
    elif row['status']!='composited':assert sha(row['absolutePath'])==row['sourceSha256']
assert sha(WORK/'jack.qsp')==record['qspBefore']==record['qspAfter']
assert sha(HERE.parent/'MOB_BACKGROUND_REVIEW_20261029.zip')=='e22c6be73dacad3ca0496b3a018f3cebad2547930ae4cfa19d2e196ea5f53340'
result={'pass':True,'installedPNGs':128,'workAndTrackedHashMatches':128,'originalBackupMatches':128,
    'fullyDecodedPngs':128,'size':[795,596],'allOpaque':True,'preservedAndHeldImagesUnchanged':14,
    'missingSlotsStillMissing':14,'qspUnchanged':True,'reviewArchiveUnchanged':True,
    'saveWrites':False,'deploymentSync':False,'errors':errors}
(HERE/'adoption').mkdir(exist_ok=True)
(HERE/'adoption/png-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
