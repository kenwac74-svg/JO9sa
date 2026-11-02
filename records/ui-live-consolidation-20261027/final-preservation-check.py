"""Read-only final preservation check for original WORK saves and indexed image pools."""
import hashlib
import json
import os
from pathlib import Path
from datetime import datetime, timezone

REC = Path(__file__).parent
WORK = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
SAVE_SNAPSHOT = REC / 'ui-resource-snapshot.json'
PRUNE_SNAPSHOT = REC / 'prune-snapshot.json'
IMAGE_SUFFIXES = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.ico', '.tif', '.tiff', '.avif'}
EXCLUDED = {'.git', 'node_modules', '__pycache__', '__jo9_imagebackups'}
ROOTS = ['content/pic/girls/normal_scenes', 'content/pic/girls/reward_scenes', 'content/pic/girls/sex_scenes', 'content/pic/girls/torture_scenes', 'content/pic/scene']

def read(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))

def sha(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda: f.read(4 * 1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def norm(p):
    return str(p).replace('\\', '/').casefold()

def linked(p):
    return p.is_symlink() or getattr(p, 'is_junction', lambda: False)()

save_snapshot = read(SAVE_SNAPSHOT)
prune = read(PRUNE_SNAPSHOT)
if Path(prune['root']).resolve() != WORK.resolve():
    raise ValueError('Prune snapshot root differs from WORK')
if not isinstance(prune['images'], dict):
    raise ValueError('Unsupported image snapshot format')
if len(save_snapshot['saves']) != 98:
    raise ValueError('Expected exactly 98 original saves')

saves = []
for item in save_snapshot['saves']:
    p = WORK / item['path']
    row = {'path': item['path'], 'expectedSize': item['size'], 'expectedSha256': item['sha256']}
    if not p.is_file() or linked(p):
        row.update(status='FAIL', reason='Missing, non-file or linked original save')
    else:
        before = p.stat()
        digest = sha(p)
        after = p.stat()
        stable = (before.st_size, before.st_mtime_ns) == (after.st_size, after.st_mtime_ns)
        good = stable and after.st_size == item['size'] and digest == item['sha256']
        row.update(status='PASS' if good else 'FAIL', size=after.st_size, sha256=digest, stableDuringHash=stable)
    saves.append(row)

pools = []
for rel in ROOTS:
    root = WORK / rel
    expected = {norm(k): {'path': k, 'size': v[0], 'mtimeNs': v[1]} for k, v in prune['images'].items() if norm(k).startswith(norm(rel) + '/')}
    actual = {}
    skipped_links = []
    non_images = []
    excluded_dirs = []
    errors = []
    def walk(d):
        try:
            with os.scandir(d) as entries:
                for e in entries:
                    p = Path(e.path)
                    relative = p.relative_to(WORK).as_posix()
                    if linked(p):
                        skipped_links.append(relative)
                        continue
                    if e.is_dir(follow_symlinks=False):
                        if e.name.casefold() in EXCLUDED:
                            excluded_dirs.append(relative)
                        else:
                            walk(p)
                    elif e.is_file(follow_symlinks=False):
                        st = e.stat(follow_symlinks=False)
                        row = {'path': relative, 'size': st.st_size, 'mtimeNs': st.st_mtime_ns}
                        if p.suffix.lower() in IMAGE_SUFFIXES:
                            key = norm(relative)
                            if key in actual:
                                errors.append('Case-normalized duplicate path: ' + relative)
                            actual[key] = row
                        else:
                            non_images.append(row)
        except OSError as err:
            errors.append(str(err))
    if not root.is_dir() or linked(root):
        errors.append('Missing or linked protected root: ' + rel)
    else:
        walk(root)
    missing = [expected[k]['path'] for k in sorted(expected.keys() - actual.keys())]
    added = [actual[k]['path'] for k in sorted(actual.keys() - expected.keys())]
    changed = []
    case_only = []
    for key in sorted(expected.keys() & actual.keys()):
        old, now = expected[key], actual[key]
        if old['path'] != now['path']:
            case_only.append({'before': old['path'], 'after': now['path']})
        if (old['size'], old['mtimeNs']) != (now['size'], now['mtimeNs']):
            changed.append({'path': now['path'], 'before': old, 'after': now})
    good = not missing and not added and not changed and not case_only and not skipped_links and not errors and bool(expected)
    pools.append({'root': rel, 'status': 'PASS' if good else 'FAIL', 'snapshotImageCount': len(expected), 'currentImageCount': len(actual), 'snapshotBytes': sum(x['size'] for x in expected.values()), 'currentBytes': sum(x['size'] for x in actual.values()), 'missing': missing, 'added': added, 'metadataChanges': changed, 'caseOnlyPathChanges': case_only, 'skippedLinks': skipped_links, 'excludedDirectories': excluded_dirs, 'errors': errors, 'nonImageFileCountOutsideImageSnapshot': len(non_images), 'nonImagePathExamples': [x['path'] for x in non_images[:12]], 'comparison': 'Exact image relative path, byte size and integer nanosecond mtime. No image content rehash.'})

original_paths = {norm(x['path']) for x in save_snapshot['saves']}
current_saves = []
for base, dirs, files in os.walk(WORK / 'save', followlinks=False):
    dirs[:] = [d for d in dirs if not linked(Path(base) / d)]
    for name in files:
        if name.lower().endswith('.sav'):
            current_saves.append((Path(base) / name).relative_to(WORK).as_posix())

result = {'status': 'PASS' if all(x['status'] == 'PASS' for x in saves + pools) else 'FAIL', 'checkedAtUtc': datetime.now(timezone.utc).isoformat(), 'work': str(WORK), 'readOnly': True, 'runtimeAssetSaveDistributionFilesWritten': 0, 'sourceSnapshots': [{'path': str(SAVE_SNAPSHOT), 'sha256': sha(SAVE_SNAPSHOT)}, {'path': str(PRUNE_SNAPSHOT), 'sha256': sha(PRUNE_SNAPSHOT)}], 'originalSaves': {'expected': len(saves), 'passed': sum(x['status'] == 'PASS' for x in saves), 'failed': sum(x['status'] != 'PASS' for x in saves), 'bytesHashed': sum(x['expectedSize'] for x in saves), 'results': saves}, 'protectedIndexedImagePools': {'expectedRoots': 5, 'passedRoots': sum(x['status'] == 'PASS' for x in pools), 'imageFilesCompared': sum(x['snapshotImageCount'] for x in pools), 'results': pools}, 'newSavePathsOutsideOriginalSnapshot': [x for x in current_saves if norm(x) not in original_paths], 'limits': ['The 98 original SAV files are compared by full SHA-256 and size; original save content was not rewritten or copied.', 'Prune snapshot images contains only configured image suffixes. Non-image file metadata has no matching image snapshot baseline and is not claimed unchanged.', 'Protected image contents were not rehashed. Exact original paths, byte size and nanosecond mtime match is a metadata preservation check, not a cryptographic proof of image bytes.', 'No symlink/junction traversal is allowed. Any such entry or read failure causes the associated pool check to fail.', 'This is preservation verification; it does not replace UI clicking or gameplay testing.']}
(REC / 'final-preservation-check.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
summary = f"# 최종 보존 점검\n\n판정: {result['status']}. 운영·이미지·원본 세이브·배포 폴더 쓰기 0건. 보고서와 조회 스크립트만 기록했다.\n\n- 원본 SAV {len(saves)}개 중 {result['originalSaves']['passed']}개가 최초 스냅샷과 크기·전체 SHA-256이 같다. 해시 중 크기/mtime가 바뀐 파일도 없어야 PASS다.\n- 보호된 이미지 인덱스 하위 트리 5곳 중 {result['protectedIndexedImagePools']['passedRoots']}곳이 스냅샷과 일치했다. 이미지 {result['protectedIndexedImagePools']['imageFilesCompared']}개의 상대 경로·크기·정수 나노초 mtime를 비교했다.\n"
for x in pools:
    summary += f"  - {x['root']}: {x['status']}, 스냅샷 {x['snapshotImageCount']} / 현재 {x['currentImageCount']}, 추가 {len(x['added'])}, 누락 {len(x['missing'])}, 메타데이터 변경 {len(x['metadataChanges'])}.\n"
summary += "\nprune-snapshot의 images는 지정된 이미지 확장자만 기록한다. 비이미지 파일 전체의 보존이나 이미지 바이트 동일성을 추가로 증명했다고 말하지 않는다. 이미지 전체 재해시는 수행하지 않았다. 링크/정션을 따라가거나 원본·배포 폴더를 수정하지 않았다. 실제 UI 클릭 검증과 별개의 보존 검사다.\n\n재현: `py -3.14 final-preservation-check.py`. 기계 판정은 같은 폴더 `final-preservation-check.json`.\n"
(REC / 'FINAL_PRESERVATION_CHECK_KO.md').write_text(summary, encoding='utf-8')
print(json.dumps({'status': result['status'], 'saves': result['originalSaves']['passed'], 'saveFailures': result['originalSaves']['failed'], 'poolPass': result['protectedIndexedImagePools']['passedRoots'], 'imageFilesCompared': result['protectedIndexedImagePools']['imageFilesCompared'], 'poolDetails': [{k: x[k] for k in ['root', 'status', 'snapshotImageCount', 'currentImageCount', 'nonImageFileCountOutsideImageSnapshot']} for x in pools], 'newSaves': result['newSavePathsOutsideOriginalSnapshot']}, ensure_ascii=False))
raise SystemExit(0 if result['status'] == 'PASS' else 1)
