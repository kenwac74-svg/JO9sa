"""Register existing normalizer exports and match their legacy maid costumes."""
from pathlib import Path
from datetime import datetime, timezone
from io import BytesIO
import hashlib
import json
import shutil
from PIL import Image

HERE = Path(__file__).resolve().parent
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO = Path('G:/somi/JO9sa')
FULL = GAME / 'content/pic/girls/full'
ORIGINAL = Path('G:/somi/JO9O/game/content/pic/girls/full')
BACKUP = Path('G:/somi/JO9resource/character_originals/outfit_transform_20261105-b')
RECORD = REPO / 'records/outfit-transform-sync-20261105-b'

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def atomic(p, b):
    p.parent.mkdir(parents=True, exist_ok=True)
    temp = p.with_name(p.name + '.outfit-sync-b.tmp')
    assert not temp.exists(), temp
    temp.write_bytes(b)
    temp.replace(p)

assert not (HERE / 'applied.json').exists(), 'Already applied; do not transform twice'
manifest = json.loads((HERE / 'input-manifest.json').read_bytes())
project = json.loads((HERE / 'input-jo9_project.json').read_bytes())
selected = json.loads((HERE / 'selected.json').read_bytes())
bases = json.loads((HERE / 'base-audit.json').read_bytes())
assert len(manifest['items']) == len(bases) == 23 and len(selected) == 20
assert manifest['canvas'] == project['canvas'] == {'width': 795, 'height': 596}
projects = {i['key']: i for i in project['items']}
for i in manifest['items']:
    assert i['approved'] and not i['ai']
    assert i['transform'] == projects[i['source']]['t']
for name in ('manifest.json', 'jo9_project.json'):
    assert sha(GAME / 'content/pic/girls' / name) == sha(HERE / ('input-' + name)), 'Input changed'
qsp = sha(GAME / 'jack.qsp')
files = []
for b, i in zip(bases, manifest['items']):
    p = FULL / b['path']
    assert sha(p) == b['sha256'], 'Manual base changed: ' + b['path']
    with Image.open(p) as im:
        im.load()
        assert im.size == (795, 596) and im.mode == 'RGBA'
    original = ORIGINAL / b['path']
    verified_original = original.exists() and original.stat().st_size == int(i['source'].split('|')[1])
    files.append(dict(path='girls/full/' + b['path'], before=sha(original) if verified_original else None,
                      after=sha(p), beforePath=str(original) if verified_original else None,
                      existed=True, bytes=p.stat().st_size, width=795, height=596,
                      changeKind='existing-normalizer-export', transform=i['transform'],
                      sourceBaselineVerified=verified_original))

written = []
try:
    for i in selected:
        rel = i['path']
        p = FULL / rel
        assert p.resolve().is_relative_to(FULL.resolve()) and not p.is_symlink()
        assert Path(rel).parent.as_posix() == 'cloth'
        before = sha(p)
        assert before == sha(ORIGINAL / rel), 'Costume changed since inventory: ' + rel
        backup = BACKUP / rel
        if backup.exists():
            assert sha(backup) == before, 'Backup collision'
        else:
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, backup)
        t = i['transform']
        with Image.open(p) as im:
            assert im.size == (795, 596)
            # Keep fractional alpha edges clean while applying the user's affine geometry.
            src = im.convert('RGBA').convert('RGBa')
            result = src.transform((795, 596), Image.Transform.AFFINE,
                                   (1/t['s'], 0, -t['x']/t['s'], 0, 1/t['s'], -t['y']/t['s']),
                                   resample=Image.Resampling.BICUBIC,
                                   fillcolor=(0, 0, 0, 0)).convert('RGBA')
        out = BytesIO()
        result.save(out, format='PNG')
        assert sha(p) == before
        atomic(p, out.getvalue())
        written.append((p, backup))
        with Image.open(p) as check:
            check.load()
            assert check.size == (795, 596) and check.mode == 'RGBA'
        files.append(dict(path='girls/full/' + rel, before=before, after=sha(p),
                          beforePath=str(backup), existed=True, bytes=p.stat().st_size,
                          width=795, height=596, changeKind='costume-affine', transform=t))
except Exception:
    for p, backup in reversed(written):
        shutil.copy2(backup, p)
    raise

for f in files:
    p = GAME / 'content/pic' / f['path']
    tracked = REPO / 'assets/content/pic' / f['path']
    assert sha(p) == f['after']
    atomic(tracked, p.read_bytes())
    assert sha(tracked) == f['after']
assert all(sha(FULL / b['path']) == b['sha256'] for b in bases), 'Existing base exports were altered'
assert sha(GAME / 'jack.qsp') == qsp
exported = {i['output'] for i in manifest['items']}
report = dict(version=2, id='NORMALIZER_BATCH_B_20261105_' + sha(HERE / 'input-manifest.json')[:12],
              created=datetime.now(timezone.utc).isoformat(), status='applied', operation='replace',
              files=files, existingBaseExports=23, costumeTransforms=20, canvas=[795, 596],
              inputManifestSha256=sha(HERE / 'input-manifest.json'),
              inputProjectSha256=sha(HERE / 'input-jo9_project.json'),
              omittedProjectItems=[i['name'] for i in project['items'] if i['name'] not in exported],
              noOtherCostume=[i['output'] for i in manifest['items']
                              if not any(Path(s['path']).name == i['output'] for s in selected)],
              qspSha256=qsp, qspUnchanged=True, characterJsonChanged=False,
              existingBasePixelsUnchanged=True, fullDistributionTouched=False,
              releaseStatus='WORK applied; scheduled for next patch, not distributed')
RECORD.mkdir(parents=True, exist_ok=True)
for name in ('input-manifest.json', 'input-jo9_project.json', 'selected.json', 'base-audit.json', 'apply.py'):
    shutil.copy2(HERE / name, RECORD / name)
data = (json.dumps(report, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
atomic(HERE / 'applied.json', data)
atomic(RECORD / 'applied.json', data)
print(json.dumps(dict(registeredBaseExports=23, adjustedCostumes=20, totalPatchFiles=len(files),
                     omitted=report['omittedProjectItems'], noCostume=report['noOtherCostume']), ensure_ascii=False))
