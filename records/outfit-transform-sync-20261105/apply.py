"""Apply approved normalizer geometry to matching legacy costume artwork only."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import shutil
from PIL import Image

HERE = Path(__file__).resolve().parent
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO = Path('G:/somi/JO9sa')
FULL = GAME / 'content/pic/girls/full'
BACKUP = Path('G:/somi/JO9resource/character_originals/outfit_transform_20261105')
RECORD = REPO / 'records/outfit-transform-sync-20261105'
ATTACH = HERE

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def atomic(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_name(p.name + '.outfit-sync.tmp')
    assert not tmp.exists(), tmp
    tmp.write_bytes(data)
    tmp.replace(p)

assert not (HERE / 'applied.json').exists(), 'Already applied; do not transform twice'
input_manifest = json.loads((HERE / 'input-manifest.json').read_text(encoding='utf-8'))
selected = json.loads((HERE / 'selected.json').read_text(encoding='utf-8'))
excluded = json.loads((HERE / 'excluded.json').read_text(encoding='utf-8'))
assert len(selected) == 45 and len(excluded) == 251
assert all(Path(s['path']).parent.as_posix() == 'cloth' for s in selected)
base_hashes = {i['output']: sha(FULL / i['output']) for i in input_manifest['items']}
excluded_hashes = {p: sha(FULL / p) for p in excluded}
qsp_before = sha(GAME / 'jack.qsp')
manifest_sha = sha(ATTACH / 'input-manifest.json')
report = dict(version=2, id='OUTFIT_TRANSFORM_SYNC_20261105_' + manifest_sha[:12],
              created=datetime.now(timezone.utc).isoformat(), status='applied', operation='replace',
              canvas=[795, 596], scope='Matching filename stems and character identities in full/cloth',
              inputManifestSha256=manifest_sha, inputProjectSha256=sha(ATTACH / 'input-jo9_project.json'),
              attachmentStorage='Parsed JSON snapshots; original temporary attachments expired before write',
              files=[], excludedSameNumberDifferentArtwork=excluded, qspSha256=qsp_before)
written = []
try:
    for item in selected:
        rel = item['path']
        target = FULL / rel
        assert target.resolve().is_relative_to(FULL.resolve())
        assert not target.is_symlink()
        before = sha(target)
        backup = BACKUP / rel
        if backup.exists():
            assert sha(backup) == before, 'Backup collision: ' + rel
        else:
            backup.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(target, backup)
        t = item['transform']
        with Image.open(target) as image:
            assert image.size == (795, 596)
            # Premultiplied alpha prevents dark outlines during fractional resampling.
            src = image.convert('RGBA').convert('RGBa')
            result = src.transform((795, 596), Image.Transform.AFFINE,
                                   (1/t['s'], 0, -t['x']/t['s'], 0, 1/t['s'], -t['y']/t['s']),
                                   resample=Image.Resampling.BICUBIC, fillcolor=(0, 0, 0, 0)).convert('RGBA')
        assert sha(target) == before, 'WORK changed during processing: ' + rel
        from io import BytesIO
        buffer = BytesIO()
        result.save(buffer, format='PNG')
        atomic(target, buffer.getvalue())
        written.append((target, backup))
        with Image.open(target) as check:
            check.load()
            assert check.size == (795, 596) and check.mode == 'RGBA'
        tracked = REPO / 'assets/content/pic/girls/full' / rel
        atomic(tracked, target.read_bytes())
        assert sha(tracked) == sha(target)
        report['files'].append(dict(path='girls/full/' + rel, before=before, after=sha(target),
                                    beforePath=str(backup), existed=True, bytes=target.stat().st_size,
                                    width=795, height=596, transform=t))
except Exception:
    for target, backup in reversed(written):
        shutil.copy2(backup, target)
    raise

assert all(sha(FULL / p) == h for p, h in base_hashes.items()), 'Base images changed'
assert all(sha(FULL / p) == h for p, h in excluded_hashes.items()), 'Excluded artwork changed'
assert sha(GAME / 'jack.qsp') == qsp_before
report.update(baseImagesUnchanged=True, excludedArtworkUnchanged=True,
              qspUnchanged=True, jsonChanged=False, fullDistributionTouched=False)
RECORD.mkdir(parents=True, exist_ok=True)
for name in ('manifest.json', 'jo9_project.json'):
    shutil.copy2(ATTACH / ('input-' + name), RECORD / ('input-' + name))
for name in ('apply.py', 'selected.json', 'excluded.json', 'reference-audit.json'):
    shutil.copy2(HERE / name, RECORD / name)
text = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
atomic(HERE / 'applied.json', text.encode('utf-8'))
atomic(RECORD / 'applied.json', text.encode('utf-8'))
print(json.dumps(dict(applied=len(report['files']), excluded=len(excluded), backup=str(BACKUP),
                     qspUnchanged=True, baseImagesUnchanged=True), ensure_ascii=False))
