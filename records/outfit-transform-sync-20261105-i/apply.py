"""Apply revised original-relative transforms without stacking prior geometry."""
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
BACKUP = Path('G:/somi/JO9resource/character_originals/outfit_transform_20261105-i')
OBJECTS = GAME / 'modtools/catalog/image_work/personal-patch/objects'
RECORD = REPO / 'records/outfit-transform-sync-20261105-i'

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def atomic(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    temp = p.with_name(p.name + '.outfit-i.tmp')
    assert not temp.exists(), temp
    temp.write_bytes(data)
    temp.replace(p)

def backup(rel, digest):
    obj = OBJECTS / digest
    if obj.exists():
        assert sha(obj) == digest
        return obj
    p = BACKUP / rel
    if p.exists():
        assert sha(p) == digest
    else:
        p.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(FULL / rel, p)
    return p

assert not (HERE / 'applied.json').exists(), 'Already applied'
inv = json.loads((HERE / 'inventory.json').read_bytes())
manifest, project = inv['manifest'], inv['project']
bases = json.loads((HERE / 'base-audit.json').read_bytes())
costumes = json.loads((HERE / 'selected.json').read_bytes())
assert len(manifest['items']) == len(bases) == 35 and len(costumes) == 32
assert not inv['unresolvedProvenance'], inv['unresolvedProvenance']
items = {x['output']: x for x in manifest['items']}
project_items = {x['key']: x for x in project['items']}
for i in manifest['items']:
    assert i['approved'] and not i['ai'] and i['transform'] == project_items[i['source']]['t']
for n in ('manifest.json', 'jo9_project.json'):
    assert sha(GAME / 'content/pic/girls' / n) == sha(HERE / ('input-' + n)), 'Input JSON changed'
qsp = sha(GAME / 'jack.qsp')
jobs = []
for b in bases:
    item = items[b['path']]
    render = b['action'] in ('rebase-original', 'affine-previous-export')
    assert b['action'] in ('rebase-original', 'affine-previous-export', 'existing-new-export-register', 'identity-preserve-register')
    jobs.append(dict(rel=b['path'], group='base', action=b['action'], t=item['transform'],
                     before=b['sha256'], source=Path(b['verifiedBaselinePath']) if render else None,
                     sourceSha=b['verifiedBaseline']['sha256'] if render else None,
                     sourceKey=item['source'], render=render))
for c in costumes:
    render = c['action'] != 'identity-preserve-register'
    assert c['action'] in ('rebase-original', 'affine-previous-export', 'affine-current-original', 'identity-preserve-register')
    name = Path(c['path']).name
    jobs.append(dict(rel=c['path'], group='costume', action=c['action'], t=c['transform'],
                     before=c['beforeSha256'], source=Path(c['inputPath']) if render else None,
                     sourceSha=c['inputSha256'] if render else None,
                     sourceKey=items[name]['source'], render=render))
assert len(jobs) == 67 and sum(j['render'] for j in jobs) == 58
for j in jobs:
    target = FULL / j['rel']
    assert not Path(j['rel']).name.startswith('2071_')
    assert target.resolve().is_relative_to(FULL.resolve()) and not target.is_symlink()
    assert sha(target) == j['before'], 'WORK changed since inventory: ' + j['rel']
    if j['render']:
        assert sha(j['source']) == j['sourceSha'], 'Transform source changed: ' + j['rel']

files, written = [], []
try:
    for j in jobs:
        p, before = FULL / j['rel'], j['before']
        old = backup(j['rel'], before) if j['render'] else (OBJECTS / before if (OBJECTS / before).exists() else None)
        if old:
            assert sha(old) == before
        input_stored = j['source']
        if j['render']:
            with Image.open(j['source']) as im:
                assert im.size == (795, 596)
                src = im.convert('RGBA').convert('RGBa')
                t = j['t']
                out = src.transform((795, 596), Image.Transform.AFFINE,
                                    (1/t['s'], 0, -t['x']/t['s'], 0, 1/t['s'], -t['y']/t['s']),
                                    resample=Image.Resampling.BICUBIC, fillcolor=(0, 0, 0, 0)).convert('RGBA')
            b = BytesIO()
            out.save(b, format='PNG')
            assert sha(p) == before, 'WORK changed while rendering: ' + j['rel']
            if j['source'].resolve() == p.resolve():
                input_stored = old
            atomic(p, b.getvalue())
            written.append((p, old, sha(p)))
        else:
            assert sha(p) == before
        with Image.open(p) as check:
            check.load()
            assert check.size == (795, 596) and check.mode == 'RGBA'
        files.append(dict(path='girls/full/' + j['rel'], before=before if old else None,
                          observedBeforeSha256=before, after=sha(p), beforePath=str(old) if old else None,
                          existed=True, bytes=p.stat().st_size, width=795, height=596,
                          changeKind=j['group'] + '-' + j['action'], writePerformed=j['render'],
                          transform=j['t'], inputBaseSourceKey=j['sourceKey'],
                          transformSourcePath=str(input_stored) if input_stored else None,
                          transformSourceSha256=j['sourceSha']))
except Exception:
    for p, old, after in reversed(written):
        if sha(p) == after:
            shutil.copy2(old, p)
    raise
for f in files:
    p = GAME / 'content/pic' / f['path']
    assert sha(p) == f['after']
    tracked = REPO / 'assets/content/pic' / f['path']
    atomic(tracked, p.read_bytes())
    assert sha(tracked) == f['after']
assert sha(GAME / 'jack.qsp') == qsp
assert sha(FULL / 'felicity_blond_long.png') == sha(FULL / 'felicity_blond_long_young.png'), 'Felicity address pair diverged'
report = dict(version=2, id='NORMALIZER_BATCH_I_20261105_' + sha(HERE / 'input-manifest.json')[:12],
              created=datetime.now(timezone.utc).isoformat(), status='applied', operation='replace', files=files,
              baseImages=35, costumeImages=32, baseRerenders=26, costumeRerenders=32,
              preservedFiles=9, originalRelativeRebases=50, previousExportRelativeTransforms=2, qspSha256=qsp,
              qspUnchanged=True, characterJsonChanged=False, fullDistributionTouched=False,
              inputManifestSha256=sha(HERE / 'input-manifest.json'),
              inputProjectSha256=sha(HERE / 'input-jo9_project.json'),
              noOtherCostume=['1375_white_long_young.png', 'felicity_blond_long.png', 'felicity_blond_long_young.png'],
              omittedProjectItems=inv['summary']['omittedProjectItems'], intentionalDuplicateAddresses=['girls/full/felicity_blond_long.png','girls/full/felicity_blond_long_young.png'],
              excludedSameNumberDifferentArtwork=json.loads((HERE / 'excluded.json').read_bytes()),
              provenanceAmbiguities=inv['provenanceAmbiguities'],
              releaseStatus='WORK applied; scheduled for next patch, not distributed')
RECORD.mkdir(parents=True, exist_ok=True)
for n in ('input-manifest.json', 'input-jo9_project.json', 'inventory.json', 'base-audit.json',
          'selected.json', 'excluded.json', 'apply.py'):
    shutil.copy2(HERE / n, RECORD / n)
data = (json.dumps(report, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
atomic(HERE / 'applied.json', data)
atomic(RECORD / 'applied.json', data)
print(json.dumps({k:report[k] for k in ('baseImages','costumeImages','baseRerenders','costumeRerenders','preservedFiles')},ensure_ascii=False))
