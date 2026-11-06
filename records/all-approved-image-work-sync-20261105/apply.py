"""Reconcile approved WORK images and their next-patch metadata, without redrawing."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import shutil
import subprocess
from PIL import Image

HERE = Path(__file__).resolve().parent
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO = Path('G:/somi/JO9sa')
RECORD = REPO / 'records/all-approved-image-work-sync-20261105'

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def put(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    t = p.with_name(p.name + '.approved-sync.tmp')
    assert not t.exists(), t
    t.write_bytes(data)
    t.replace(p)

assert not (HERE / 'applied.json').exists(), 'Already reconciled'
plan = json.loads((HERE / 'plan.json').read_bytes())
assert len(plan['files']) == 691 and len(plan['adoptionFiles']) == 43
qsp = sha(GAME / 'jack.qsp')
assert qsp == plan['qspSha256'] == sha(REPO / 'assets/runtime/2.4.1/jack.qsp')
for f in plan['files']:
    p = GAME / 'content/pic' / f['path']
    assert p.resolve().is_relative_to((GAME / 'content/pic').resolve()) and not p.is_symlink()
    assert sha(p) == f['after'], 'WORK differs from approved state: ' + f['path']
    with Image.open(p) as im:
        im.load()
        assert im.size == (795, 596) and im.mode == 'RGBA', f['path']
RECORD.mkdir(parents=True, exist_ok=True)
for f in plan['adoptionFiles']:
    p = GAME / 'content/pic' / f['path']
    target = REPO / 'assets/content/pic' / f['path']
    if target.exists():
        assert sha(target) == f['after'], 'Unexpected tracked version: ' + f['path']
    else:
        put(target, p.read_bytes())
report = dict(version=2, id='ALL_APPROVED_IMAGE_REGISTRATION_20261105',
              created=datetime.now(timezone.utc).isoformat(), status='applied', operation='replace',
              files=plan['files'], adoptionFiles=plan['adoptionFiles'], qspSha256=qsp,
              approvedImagePaths=691, registrationAdditions=43, newTrackedCopies=42,
              workImageBytesChanged=0, fullDistributionTouched=False)
registration = {**report, 'files': report['adoptionFiles']}
put(HERE / 'registration.json', (json.dumps(registration, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
script = "const fs=require('fs');const r=JSON.parse(fs.readFileSync(process.argv[1]));const t=require(process.argv[2]).create(process.argv[3],process.argv[4]);t.record(r,'replace',true);console.log('Registered approved existing images:',r.files.length);"
result = subprocess.run(['node', '-e', script, str(HERE / 'registration.json'),
                         str(REPO / 'tools/text-workshop/personal-patch.cjs'),
                         str(GAME), str(GAME / 'modtools/catalog')], capture_output=True, text=True)
assert result.returncode == 0, result.stderr

runtime = REPO / 'assets/runtime-source-2.4.1.json'
old_bytes = runtime.read_bytes()
data = json.loads(old_bytes)
original_other = [f for f in data['files'] if f['runtimePath'] not in {'content/pic/' + x['path'] for x in plan['files']}]
mapping = {}
for i, row in enumerate(data['files']):
    mapping.setdefault(row['runtimePath'], []).append(i)
added, updated = 0, 0
for f in plan['files']:
    rel = 'content/pic/' + f['path']
    item = dict(runtimePath=rel, repositoryPath='assets/' + rel, bytes=f['bytes'], sha256=f['after'])
    if rel in mapping:
        for i in mapping[rel]:
            if any(data['files'][i].get(k) != v for k, v in item.items()):
                updated += 1
            data['files'][i].update(item)
    else:
        data['files'].append(item)
        added += 1
assert [f for f in data['files'] if f['runtimePath'] not in {'content/pic/' + x['path'] for x in plan['files']}] == original_other
assert data['sourceQspSha256'] == qsp
assert runtime.read_bytes() == old_bytes, 'Runtime manifest changed concurrently'
put(RECORD / 'runtime-source-2.4.1.json.before', old_bytes)
put(runtime, (json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
report.update(runtimeManifestAdded=added, runtimeManifestUpdated=updated,
              runtimeManifestOtherEntriesPreserved=True, qspUnchanged=True,
              releaseStatus='All approved images reconciled in WORK and next-patch records; Full untouched')
for f in plan['files']:
    assert sha(GAME / 'content/pic' / f['path']) == f['after']
    assert sha(REPO / 'assets/content/pic' / f['path']) == f['after']
assert sha(GAME / 'jack.qsp') == qsp
for name in ('audit.json', 'plan.json', 'registration.json', 'apply.py'):
    shutil.copy2(HERE / name, RECORD / name)
body = (json.dumps(report, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
put(HERE / 'applied.json', body)
put(RECORD / 'applied.json', body)
print(json.dumps({k:report[k] for k in ('approvedImagePaths','registrationAdditions','newTrackedCopies',
                                     'runtimeManifestAdded','runtimeManifestUpdated','workImageBytesChanged')}, ensure_ascii=False))
