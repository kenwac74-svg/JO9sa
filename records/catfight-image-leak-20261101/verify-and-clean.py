from pathlib import Path
from datetime import datetime, timezone
import os, stat, hashlib, json, gzip, shutil

O = Path(__file__).resolve().parent
R = Path('G:/somi/JO9sa/records/catfight-image-leak-20261101')
F = Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full')
W = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
A = Path('K:/doing/JO9_trash/catfight-image-leak-20261101')
roots = [Path('G:/Codex/tmp/catfight-image-leak-20261101'), Path('G:/Codex/tmp/catfight-image-leak-release-20261101')]
AFTER = 'f87363c3050547ae6b7a5387ae9870425fdc4d68cb2e07855e4550df29664168'
def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda: f.read(4 * 1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()
def writej(p, value):
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def linked(p):
    s = p.lstat()
    return p.is_symlink() or bool(getattr(s, 'st_file_attributes', 0) & stat.FILE_ATTRIBUTE_REPARSE_POINT)

# Only these two task-owned diagnostic trees are removed. Never follow links.
removed = []
archives = []
for root in roots:
    assert root.parent.resolve() == Path('G:/Codex/tmp').resolve()
    assert root.name in {'catfight-image-leak-20261101', 'catfight-image-leak-release-20261101'}
    assert root.is_dir() and not linked(root)
    def clean(p):
        assert p.absolute().is_relative_to(root.absolute())
        if linked(p):
            removed.append(dict(path=str(p), kind='link-only'))
            if p.is_dir():
                os.rmdir(p)
            else:
                p.unlink()
            return
        if p.is_dir():
            for entry in list(p.iterdir()):
                clean(entry)
            p.rmdir()
            return
        length = p.stat().st_size
        if '.qsp' in p.name or p.suffix == '.sav':
            raw = p.read_bytes()
            digest = hashlib.sha256(raw).hexdigest()
            target = A / 'diagnostic-evidence' / (digest + '.gz')
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                target.write_bytes(gzip.compress(raw))
            assert hashlib.sha256(gzip.decompress(target.read_bytes())).hexdigest() == digest
            archives.append(dict(source=str(p), target=str(target), bytes=length, sha256=digest))
        elif p.suffix in {'.json', '.log'} and 'json' not in p.relative_to(root).parts and length < 2_000_000:
            target = R / 'diagnostic-evidence' / root.name / p.relative_to(root)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, target)
            assert sha(p) == sha(target)
        removed.append(dict(path=str(p), kind='regenerable-diagnostic-file', bytes=length))
        p.unlink()
    clean(root)

cleanup = dict(archived=archives, removed=removed, rootTrees=[str(p) for p in roots], noLinksFollowed=True, personalSavesModified=False)
writej(O / 'cleanup-report.json', cleanup)
shutil.copy2(O / 'cleanup-report.json', A / 'DIAGNOSTIC_CLEANUP.json')
shutil.copy2(O / 'cleanup-report.json', R / 'cleanup-report.json')
shutil.copy2(__file__, R / 'verify-and-clean.py')

# Fresh file-by-file delivery verification after cleanup and metadata updates.
manifest_path = F / 'BUILD_MANIFEST.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
assert manifest['qspSha256'] == AFTER
assert sha(W / 'jack.qsp') == AFTER and sha(F / 'game/jack.qsp') == AFTER
expected = {x['path']: x for x in manifest['files']}
actual = set()
for base, dirs, names in os.walk(F, followlinks=False):
    for n in dirs:
        assert not linked(Path(base) / n), str(Path(base) / n)
    for n in names:
        p = Path(base) / n
        assert not linked(p)
        rel = p.relative_to(F).as_posix()
        if rel != 'BUILD_MANIFEST.json':
            actual.add(rel)
assert actual == set(expected), dict(extra=sorted(actual - set(expected)), missing=sorted(set(expected) - actual))
total = 0
for rel, row in expected.items():
    p = F / rel
    before = p.stat()
    assert before.st_size == row['bytes'], rel
    assert sha(p) == row['sha256'], rel
    after = p.stat()
    assert before.st_size == after.st_size and before.st_mtime_ns == after.st_mtime_ns, rel
    total += before.st_size
assert total == manifest['payloadBytesExcludingManifest']
assert len(expected) == manifest['payloadFilesExcludingManifest'] == 42941
assert len([x for x in actual if x.startswith('game/save/') and x.endswith('.sav')]) == 7
assert sha(W / 'jack.qsp') == AFTER
final = dict(status='PASS', checkedUtc=datetime.now(timezone.utc).isoformat(), qspSha256=AFTER, fullFilesIncludingManifest=len(actual)+1, payloadBytesExcludingManifest=total, manifestSha256=sha(manifest_path), publicSaves=7, missingFiles=0, extraFiles=0, hashMismatches=0, workFullQspEqual=True, temporaryTreesRemaining=[str(p) for p in roots if p.exists()], releaseNativePathsPassed=9, crossSceneNative=dict(checks=91, failures=0), domIncludingNative=dict(checks=163, failures=0), zipCreated=False, commitCreated=False, pushed=False)
writej(O / 'DELIVERY.json', final)
shutil.copy2(O / 'DELIVERY.json', R / 'DELIVERY.json')
print(json.dumps(final, ensure_ascii=False))
