"""Apply this export's relative geometry, preserving earlier adjustment stages."""
from pathlib import Path
from datetime import datetime, timezone
from io import BytesIO
import json
import hashlib
import shutil
from PIL import Image

HERE = Path(__file__).resolve().parent
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO = Path('G:/somi/JO9sa')
FULL = GAME / 'content/pic/girls/full'
ORIGINAL = Path('G:/somi/JO9O/game/content/pic/girls/full')
BACKUP = Path('G:/somi/JO9resource/character_originals/outfit_transform_20261105-e')
RECORD = REPO / 'records/outfit-transform-sync-20261105-e'

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def atomic(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    temp = p.with_name(p.name + '.outfit-e.tmp')
    assert not temp.exists(), temp
    temp.write_bytes(data)
    temp.replace(p)

def transform(p, t):
    with Image.open(p) as im:
        assert im.size == (795, 596)
        src = im.convert('RGBA').convert('RGBa')
        result = src.transform((795, 596), Image.Transform.AFFINE,
                               (1/t['s'], 0, -t['x']/t['s'], 0, 1/t['s'], -t['y']/t['s']),
                               resample=Image.Resampling.BICUBIC,
                               fillcolor=(0, 0, 0, 0)).convert('RGBA')
    b = BytesIO()
    result.save(b, format='PNG')
    return b.getvalue()

assert not (HERE / 'applied.json').exists(), 'Already applied; do not transform twice'
inventory = json.loads((HERE / 'inventory.json').read_bytes())
manifest = inventory['manifest']
project = inventory['project']
selected = json.loads((HERE / 'selected.json').read_bytes())
bases = json.loads((HERE / 'base-audit.json').read_bytes())
assert len(manifest['items']) == len(bases) == 75 and len(selected) == 74
assert manifest['canvas'] == project['canvas'] == {'width': 795, 'height': 596}
projects = {i['key']: i for i in project['items']}
for i in manifest['items']:
    assert i['approved'] and not i['ai']
    assert i['transform'] == projects[i['source']]['t']
for name in ('manifest.json', 'jo9_project.json'):
    assert sha(GAME / 'content/pic/girls' / name) == sha(HERE / ('input-' + name)), 'Input changed'
qsp = sha(GAME / 'jack.qsp')
files = []
written = []

def apply_geometry(rel, t, expected_sha, kind, extra=None):
    p = FULL / rel
    assert p.resolve().is_relative_to(FULL.resolve()) and not p.is_symlink()
    before = sha(p)
    assert before == expected_sha, 'WORK changed: ' + rel
    backup = BACKUP / rel
    if backup.exists():
        assert sha(backup) == before, 'Backup collision: ' + rel
    else:
        backup.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, backup)
    data = transform(p, t)
    assert sha(p) == before, 'WORK changed while rendering: ' + rel
    atomic(p, data)
    written.append((p, backup))
    f = dict(path='girls/full/' + rel, before=before, after=sha(p), beforePath=str(backup),
             existed=True, bytes=p.stat().st_size, width=795, height=596,
             changeKind=kind, transform=t)
    if extra:
        f.update(extra)
    files.append(f)

try:
    for b, i, row in zip(bases, manifest['items'], inventory['rows']):
        name = b['path']
        p = FULL / name
        assert sha(p) == b['sha256'], 'Base changed: ' + name
        if b['bytes'] == int(i['source'].split('|')[1]):
            assert p.stat().st_mtime_ns // 1000000 == int(i['source'].split('|')[2])
            apply_geometry(name, i['transform'], b['sha256'], 'base-affine',
                           {'sourceSizeAndMtimeMatch': True})
        else:
            original = ORIGINAL / name
            verified = original.exists() and original.stat().st_size == int(i['source'].split('|')[1])
            files.append(dict(path='girls/full/' + name, before=sha(original) if verified else None,
                              after=sha(p), beforePath=str(original) if verified else None,
                              existed=True, bytes=p.stat().st_size, width=795, height=596,
                              changeKind='existing-normalizer-export', transform=i['transform'],
                              sourceBaselineVerified=verified))
    for i in selected:
        rel = i['path']
        assert Path(rel).parent.as_posix() == 'cloth'
        prior = i['prior']
        if prior:
            # The new source is the prior export, so this is one additional relative step.
            assert i['beforeSha256'] == prior['after'], 'Prior costume state differs: ' + rel
            assert i['sourceBytes'] == i['priorBase']['baseBytes'], 'Unknown transform basis: ' + rel
            basis = {'inputBasis': 'previous-export-output', 'previousRecord': prior['record'],
                     'previousTransform': prior.get('transform')}
        else:
            if (ORIGINAL / rel).exists():
                assert sha(ORIGINAL / rel) == i['beforeSha256'], 'Unrecognized costume modification: ' + rel
            basis = {'inputBasis': 'current-original-costume'}
        apply_geometry(rel, i['transform'], i['beforeSha256'], 'costume-affine', basis)
    assert sum(f['changeKind'] == 'base-affine' for f in files) == 9
    assert sum(f['changeKind'] == 'existing-normalizer-export' for f in files) == 66
    assert sum(f['changeKind'] == 'costume-affine' for f in files) == 74
    for f in files:
        p = GAME / 'content/pic' / f['path']
        with Image.open(p) as im:
            im.load()
            assert im.size == (795, 596) and im.mode == 'RGBA'
except Exception:
    for p, backup in reversed(written):
        shutil.copy2(backup, p)
    raise

for f in files:
    p = GAME / 'content/pic' / f['path']
    assert sha(p) == f['after']
    tracked = REPO / 'assets/content/pic' / f['path']
    atomic(tracked, p.read_bytes())
    assert sha(tracked) == f['after']
assert sha(GAME / 'jack.qsp') == qsp
exported = {i['output'] for i in manifest['items']}
report = dict(version=2, id='NORMALIZER_BATCH_E_20261105_' + sha(HERE / 'input-manifest.json')[:12],
              created=datetime.now(timezone.utc).isoformat(), status='applied', operation='replace',
              files=files, existingBaseExports=66, baseTransforms=9, costumeTransforms=74,
              canvas=[795, 596], inputManifestSha256=sha(HERE / 'input-manifest.json'),
              inputProjectSha256=sha(HERE / 'input-jo9_project.json'),
              omittedProjectItems=[i['name'] for i in project['items'] if i['name'] not in exported],
              noOtherCostume=[i['output'] for i in manifest['items']
                              if not any(Path(s['path']).name == i['output'] for s in selected)],
              excludedSameNumberDifferentArtwork=json.loads((HERE / 'excluded.json').read_bytes()),
              qspSha256=qsp, qspUnchanged=True, characterJsonChanged=False,
              fullDistributionTouched=False, releaseStatus='WORK applied; scheduled for next patch, not distributed')
RECORD.mkdir(parents=True, exist_ok=True)
for name in ('input-manifest.json', 'input-jo9_project.json', 'selected.json', 'base-audit.json',
             'excluded.json', 'inventory.json', 'apply.py'):
    shutil.copy2(HERE / name, RECORD / name)
data = (json.dumps(report, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
atomic(HERE / 'applied.json', data)
atomic(RECORD / 'applied.json', data)
print(json.dumps(dict(baseTransforms=9, existingBaseExports=66, costumes=74,
                     patchFiles=len(files), omittedCount=len(report['omittedProjectItems']),
                     noCostume=report['noOtherCostume']), ensure_ascii=False))
