"""Verify approved runtime files, catalog and portable seed without mutation."""
from pathlib import Path
from PIL import Image
import json,hashlib,re,gzip
HERE=Path(__file__).resolve().parent
REPO=Path('G:/somi/JO9sa');WORK=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REC=REPO/'records/mob-redraw-adopted-20261029'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def mob(p):return json.loads(re.search(r'window.JO9_MOB_SETS=(.*?);</script>',Path(p).read_text(encoding='utf-8-sig'))[1])
r=load(REC/'installation.json');assert r['status']=='INSTALLED'
files=r['files'];assert len(files)==57
for f in files:
    for p in [WORK/f['path'],REPO/'resources/new'/f['path']]:assert sha(p)==f['after'],str(p)
    assert sha(f['beforePath'])==f['before']
    if f['trackedBeforePath']:assert sha(f['trackedBeforePath'])==f['trackedBefore']
    with Image.open(WORK/f['path']) as im:
        im.load();assert im.format=='PNG' and im.size==(795,596)
        assert im.convert('RGBA').getchannel('A').getextrema()==(255,255)
for b in r['metadataBackups']:
    assert hashlib.sha256(gzip.decompress(Path(b['backup']).read_bytes())).hexdigest()==b['sha256']
assert sha(WORK/'jack.qsp')==r['qspBefore']==r['qspAfter']
cat=WORK/'modtools/catalog';seed=REPO/'tools/local-workspace/catalog-seed'
m=mob(cat/'catalog_merge_vs_original.html');s=mob(seed/'catalog_merge_vs_original.html');assert m==s
plan=load(REPO/'records/full-client-preparation-20261029/full-client-input-plan.json')
byPath={f['path'].lower():f for f in plan['files']}
for f in files:
    p=byPath['game/'+f['path'].lower()];assert p['sha256']==f['after'] and p['bytes']==f['bytes']
result=dict(pass_=True,installedPNGs=57,workAndResourceHashesMatch=57,restoreBackupsVerified=57,allPngsDecoded=True,size=[795,596],allOpaque=True,portableMobSetsMatch=True,fullClientInputPlanMatches=57,qspUnchanged=True,gameplayTested=False)
(HERE/'png-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result))
