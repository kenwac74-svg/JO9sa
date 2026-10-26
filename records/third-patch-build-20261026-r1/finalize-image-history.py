"""Append a metadata-only r1 history snapshot; preserve the prior 6944 image rows.

Write only fresh r1 record/run metadata and CAS-append release-history/index.json.
Never copy image/archive payloads or modify catalog/checks/progress/ledger/codes.
This is not a full Work inventory and must not be used as an inventory cache.
"""
# JO9 MOD START THIRD_R1_IMAGE_HISTORY_20261026
from pathlib import Path, PurePosixPath
import argparse
import copy
import csv
import datetime
import hashlib
import io
import json
import os
import uuid

REPO = Path('G:/somi/JO9sa')
OLD = REPO / 'records/third-patch-build-20261026'
R = REPO / 'records/third-patch-build-20261026-r1'
FOLLOWUPS = REPO / 'records/third-patch-approved-followups-20261026'
IMAGES = FOLLOWUPS / 'images'
C = Path('G:/somi/IMGMG')
W = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
OUT = Path('G:/somi/JO9_2.4_ThirdPatch_20261026_r1')
INDEX = C / 'image_work/release-history/index.json'
TYPE = 'packaged_image_manifest_metadata_only'
ALIASES = {
    'content/pic/girls/face/00212_white_long_loli.png':
        ('content/pic/girls/face/0212_white_long_loli.png', 'GL-1264'),
    'content/pic/girls/full/cloth/178_purple_short_loli.png':
        ('content/pic/girls/full/cloth/0178_purple_short_loli.png', 'GL-11881'),
}


def sha(value):
    return hashlib.sha256(value).hexdigest()


def readj(file):
    return json.loads(Path(file).read_text(encoding='utf-8-sig'))


def jb(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def norm(value):
    return str(value).replace('\\', '/').lower().removeprefix('game/')


def digest(file):
    file = Path(file)
    assert file.is_file() and not file.is_symlink(), file
    h = hashlib.sha256()
    with file.open('rb') as stream:
        for block in iter(lambda: stream.read(2 ** 20), b''):
            h.update(block)
    return h.hexdigest()


def exclusive(file, value):
    file = Path(file)
    file.parent.mkdir(parents=True, exist_ok=True)
    with file.open('xb') as stream:
        stream.write(value)


def cas(file, previous, value):
    file = Path(file)
    assert file.read_bytes() == previous, 'Concurrent change: ' + str(file)
    temporary = file.with_name(file.name + '.' + uuid.uuid4().hex + '.tmp')
    exclusive(temporary, value)
    try:
        assert file.read_bytes() == previous, 'Concurrent change: ' + str(file)
        os.replace(temporary, file)
    finally:
        if temporary.exists():
            temporary.unlink()


def protected_metadata():
    prior = readj(OLD / 'image-history-final-result.json')
    catalog = readj(OLD / 'catalog-update-result.json')
    paths = {Path(p) for p in prior['protectedMetadata']}
    paths.update(Path(row['path']) for row in catalog['modifiedFiles'])
    # Raw check data can be embedded in the HTML/HTA; protect each catalog file.
    paths.update(p for p in C.glob('catalog*') if p.is_file())
    paths.discard(INDEX)
    return {str(p): digest(p) for p in sorted(paths, key=str)}


def assert_protected(protected):
    assert protected_metadata() == protected, 'Catalog/checks/progress/ledger/codes changed'


def assert_engine(file, expected):
    engine = readj(file)
    assert engine.get('verdict') == 'PASS' and engine.get('profile') == 'release'
    checks = {row['name']: row for row in engine['checks']}
    assert all(row['status'] == 'PASS' for row in engine['checks'] if row.get('required'))
    for name in ['inputs-readable', 'world-structure-and-line-endings',
                 'patch-replay-and-idempotence', 'distribution-byte-match',
                 'installed-client-smoke', 'input-hashes-unchanged']:
        assert checks[name]['status'] == 'PASS', name
    assert checks['inputs-readable']['detail']['candidate'] == expected
    assert checks['world-structure-and-line-endings']['detail']['sha256'] == expected
    assert checks['distribution-byte-match']['detail']['sha256'] == expected
    smoke = checks['installed-client-smoke']['detail']
    assert smoke['passed'] == smoke['expected'] == 9, 'Actual installed-engine smoke incomplete'
    native_path = FOLLOWUPS / 'native-results.json'
    native = readj(native_path)
    assert len(native) == 6 and all(row['pass'] for row in native), 'Native6 incomplete'
    expected_names = {'classify-' + role for role in ['male', 'female']}
    expected_names.update('actual-' + kind + '-' + role
                          for kind in ['refusal', 'overflow'] for role in ['male', 'female'])
    assert {row['name'] for row in native} == expected_names, 'Unexpected native test groups'
    return {'path': str(Path(file)), 'sha256': digest(file), 'verdict': 'PASS',
            'profile': 'release', 'installedClientSmoke': 9, 'targetedNativeGroups': 6,
            'targetedNativeResults': {'path': str(native_path), 'sha256': digest(native_path)}}


def prepare_inputs():
    prior_result_file = OLD / 'image-history-final-result.json'
    prior_result = readj(prior_result_file)
    prior_file = Path(prior_result['manifest']['path'])
    assert prior_file == OLD / 'PATCH_IMAGE_MANIFEST.json'
    assert digest(prior_file) == prior_result['manifest']['sha256']
    old = readj(prior_file)
    assert old['snapshotType'] == TYPE and old['snapshot']['fullInventoryCache'] is False
    assert old['snapshot']['runId'] == prior_result['runId']
    assert len(old['files']) == 6944
    assert sum(row['pack'] == 'personal' for row in old['files']) == 145
    assert sum(row['pack'] == 'indie' for row in old['files']) == 6799
    assert sum(row['class'] == 'baseline_bytes_reused_at_other_path'
               for row in old['files']) == 275

    groups = readj(R / 'MANIFESTS.json')
    build = readj(R / 'BUILD_RESULT.json')
    assert build['status'] in {'PACKAGED_AWAITING_ENGINE_AND_INDEPENDENT_REVIEW',
                               'READY_FOR_DISTRIBUTION'}
    assert build['runtimeCount'] == 6987
    assert tuple(len(groups[k]) for k in ['core', 'personal', 'indie']) == (9, 148, 6830)
    qsp = next(row for row in groups['core'] if row['path'] == 'game/jack.qsp')
    assert qsp['sha256'] == build['qspSha256'] == readj(FOLLOWUPS / 'prepared.json')['after']
    assert digest(W / 'jack.qsp') == qsp['sha256']

    group_images = {norm(row['path']): (pack, row) for pack in ['personal', 'indie']
                    for row in groups[pack] if row['kind'] == 'image'}
    assert len(group_images) == 6946
    old_map = {norm(row['path']): row for row in old['files']}
    assert len(old_map) == 6944 and set(group_images) - set(old_map) == set(ALIASES)
    for p, row in old_map.items():
        pack, current = group_images[p]
        assert (row['pack'], row['sha256'], row['bytes']) == \
               (pack, current['sha256'], current['bytes']), 'Prior row changed: ' + p

    baseline = old['baseline']
    assert digest(baseline['path']) == baseline['sha256']
    base_map = {norm(row['path']): row for row in readj(baseline['path'])['files']}
    codes = {norm(p): code for p, code in readj(C / 'catalog_work_ids.json')['items'].items()}
    source = readj(IMAGES / 'FINAL_RESULT.json')
    assert source['status'] == 'PASS' and source['compatibilityPngCopies'] == 2
    src_map = {row['alias']: row for row in source['results']}
    assert set(src_map) == set(ALIASES)
    files = copy.deepcopy(old['files'])
    for alias, (canonical, expected_code) in ALIASES.items():
        pack, row = group_images[alias]
        src = src_map[alias]
        assert pack == 'personal' and src['canonical'] == canonical
        assert canonical in base_map and alias not in base_map
        assert (row['sha256'], row['bytes']) == (src['pngSha256'], src['pngBytes'])
        assert row['sha256'] == base_map[canonical]['sha256']
        assert digest(W / alias) == digest(W / canonical) == row['sha256']
        assert codes[canonical] == expected_code
        assert alias not in codes, 'Do not create catalog IDs for compatibility filenames'
        files.append({'path': alias, 'sha256': row['sha256'], 'bytes': row['bytes'],
                      'pack': 'personal', 'source': 'approved_compatibility_alias_copy',
                      'class': 'baseline_bytes_reused_at_other_path',
                      'workCode': codes[canonical], 'compatibilityAliasOf': canonical,
                      'baselineReuse': [canonical], 'eventIds': [], 'newArtwork': False,
                      'sourceRecord': 'records/third-patch-approved-followups-20261026/images/FINAL_RESULT.json'})
    assert files[:6944] == old['files']
    assert len(files) == len({norm(row['path']) for row in files}) == 6946
    assert sum(row['pack'] == 'personal' for row in files) == 147
    assert sum(row['class'] == 'baseline_bytes_reused_at_other_path' for row in files) == 277

    counts = copy.deepcopy(old['counts'])
    counts.update(packagedImagePaths=6946, personalImagePaths=147, indieImagePaths=6799,
                  newlyIncludedSinceSecondPatchPaths=29, baselineByteReusePaths=277,
                  packagedRuntimeFilesIncludingNonimage=6987, compatibilityAliasImagePaths=2,
                  artworkCreationCount=None)
    for key, value in [('byClass', 'baseline_bytes_reused_at_other_path'),
                       ('bySource', 'approved_compatibility_alias_copy')]:
        counts[key][value] = counts[key].get(value, 0) + 2
    assert sum(counts['byClass'].values()) == sum(counts['bySource'].values()) == 6946

    sums = (OUT / 'SHA256SUMS.txt').read_text(encoding='utf-8-sig')
    sums_map = {}
    for line in sums.splitlines():
        h, name = line.split(None, 1)
        sums_map[name.strip().lstrip('*')] = h.lower()
    assert len(sums_map) == 3
    archives = []
    for pack in ['core', 'personal', 'indie']:
        item = build['artifacts'][pack]
        p = Path(item['archive'])
        assert p.parent == OUT and p.is_file() and not p.is_symlink()
        assert p.stat().st_size == item['bytes'] and sums_map[p.name] == item['sha256']
        assert item['runtimeCount'] == len(groups[pack])
        assert all(item[key] is True for key in ['everyMemberCRCVerified',
                   'everyRuntimeSHA256Verified', 'allArchivePathsSafe'])
        if pack == 'indie':
            prior = next(row for row in old['archives'] if row['kind'] == 'indie')
            assert (item['bytes'], item['sha256']) == (prior['bytes'], prior['sha256'])
        archives.append({'kind': pack, 'path': str(p), 'bytes': item['bytes'],
                         'sha256': item['sha256'], 'runtimeFiles': len(groups[pack]),
                         'hashEvidence': 'Bound to verified r1 BUILD_RESULT and SHA256SUMS; no repeated archive payload scan or copy.'})

    indexraw = INDEX.read_bytes()
    index = json.loads(indexraw)
    assert index['latestRun'] == prior_result['runId'], 'Another history run became latest'
    assert sha(indexraw) == prior_result['releaseHistoryIndexAfterSha256']
    previous_entry = next(row for row in index['runs'] if row['runId'] == prior_result['runId'])
    assert digest(previous_entry['summary']) == previous_entry['summarySha256']
    protected = protected_metadata()
    assert protected[str(Path(old['ledger']['path']))] == old['ledger']['sha256']
    provenance = {key: {'path': str(p), 'sha256': digest(p)} for key, p in {
        'priorManifest': prior_file, 'priorFinalResult': prior_result_file,
        'buildResult': R / 'BUILD_RESULT.json', 'allGroupsManifest': R / 'MANIFESTS.json',
        'imageFixResult': IMAGES / 'FINAL_RESULT.json',
        'builder': Path(__file__).resolve(),
    }.items()}
    return old, files, counts, archives, provenance, indexraw, index, protected, qsp['sha256']


def verify_record():
    result = readj(R / 'image-history-final-result.json')
    manifest = readj(result['manifest']['path'])
    old = readj(OLD / 'PATCH_IMAGE_MANIFEST.json')
    assert digest(result['manifest']['path']) == result['manifest']['sha256']
    assert manifest['files'][:6944] == old['files'] and len(manifest['files']) == 6946
    assert {row['path'] for row in manifest['files'][6944:]} == set(ALIASES)
    assert manifest['counts'] == result['counts']
    assert manifest['counts']['personalImagePaths'] == 147
    assert manifest['counts']['baselineByteReusePaths'] == 277
    index = readj(INDEX)
    assert index['latestRun'] == result['runId']
    entry = next(row for row in index['runs'] if row['runId'] == result['runId'])
    assert digest(entry['summary']) == entry['summarySha256']
    assert digest(result['engineReport']['path']) == result['engineReport']['sha256']
    native_ref = result['engineReport']['targetedNativeResults']
    assert digest(native_ref['path']) == native_ref['sha256']
    assert_protected(result['protectedMetadata'])
    assert result['imagesRestaged'] == result['newCatalogIds'] == result['newLedgerEvents'] == 0
    print(json.dumps({'status': 'VERIFIED', 'runId': result['runId'], 'images': 6946,
                      'personal': 147, 'indie': 6799, 'aliases': 2,
                      'protectedMetadata': len(result['protectedMetadata'])}))


def main(args):
    if args.verify:
        verify_record()
        return
    old, files, counts, archives, prov, indexraw, index, protected, expected = prepare_inputs()
    plan = {'status': 'PREPARED_AWAITING_R1_ENGINE_PASS', 'snapshotType': TYPE,
            'counts': counts, 'archives': archives, 'provenance': prov,
            'priorLatestRun': index['latestRun'], 'priorIndexSha256': sha(indexraw),
            'protectedMetadata': protected, 'plannedImageCopies': 0,
            'plannedCatalogWrites': 0, 'newCatalogIds': 0, 'newLedgerEvents': 0,
            'fullInventoryCache': False}
    if args.prepare:
        exclusive(R / 'history-preparation.json', jb(plan))
        print(json.dumps({'status': plan['status'], 'counts': counts, 'historyAppended': False}))
        return
    assert args.apply and args.engine_report, '--apply requires --engine-report'
    assert not (R / 'image-history-final-result.json').exists(), 'Already finalized'
    prepared_file = R / 'history-preparation.json'
    if prepared_file.exists():
        prior_plan = readj(prepared_file)
        assert prior_plan['priorIndexSha256'] == sha(indexraw)
        assert prior_plan['protectedMetadata'] == protected
        assert prior_plan['provenance'] == prov
    engine = assert_engine(args.engine_report, expected)
    now = datetime.datetime.now(datetime.timezone.utc)
    runid = now.strftime('%Y%m%dT%H%M%SZ') + '_thirdpatch_r1_' + uuid.uuid4().hex[:8]
    run = C / 'image_work/release-history/runs' / runid
    assert not run.exists()
    manifest_path = R / 'PATCH_IMAGE_MANIFEST.json'
    assert not manifest_path.exists()
    manifest = {key: copy.deepcopy(old[key]) for key in ['schema', 'game', 'baseline', 'ledger']}
    manifest.update(id='THIRD_PATCH_R1_PACKAGED_IMAGES_20261026',
                    status='PACKAGED_IMAGE_METADATA_RECORDED', snapshotType=TYPE,
                    snapshot={'runId': runid, 'path': str(run),
                              'ledgerWatermarkUTC': old['ledger']['lastEventCreatedUTC'],
                              'snapshotType': TYPE, 'fullInventoryCache': False,
                              'imageStagingPresent': False}, counts=counts, archives=archives,
                    provenance=prov, files=files,
                    sincePreviousSnapshot={'previousRunId': index['latestRun'],
                        'changedExistingPaths': 0, 'addedPaths': 2, 'removedPackagedPaths': 0,
                        'compatibilityAliasPaths': list(ALIASES),
                        'scope': 'Prior 6944 packaged-image rows unchanged; two compatibility filename copies appended.'},
                    policy={'prior6944RowsUnchanged': True, 'pathsAreNotNewArtworkCounts': True,
                            'rawChecksProgressLedgerAndCodesUnchanged': True,
                            'noRestagingImages': True, 'metadataOnlySnapshotNotInventoryCache': True})
    manifest_bytes = jb(manifest)
    ref = {'path': str(manifest_path), 'sha256': sha(manifest_bytes),
           'files': 6946, 'snapshotType': TYPE}
    summary = {'schema': 2, 'runId': runid, 'status': manifest['status'], 'snapshotType': TYPE,
               'capturedUTC': now.isoformat(),
               'ledgerWatermarkUTC': old['ledger']['lastEventCreatedUTC'],
               'catalog': str(C), 'game': str(W), 'runDirectory': str(run),
               'imageManifest': ref, 'counts': counts, 'archives': archives,
               'engineReleaseCheck': engine, 'provenance': prov,
               'imageStagingPresent': False, 'fullInventoryCache': False,
               'verification': {'prior6944RowsExact': True, 'twoAliasesByteIdentical': True,
                    'canonicalWorkCodesReused': True, 'baselineReuse277': True,
                    'noNewCompletionFlagsOrLedgerEventsOrCatalogIds': True,
                    'protectedMetadataUnchanged': True},
               'limits': ['6946 image paths means147 personal+6799 Indie paths, not new artwork count.',
                   '29 paths included since the second patch: prior27 plus2 compatibility copies.',
                   'Metadata only: no image or archive copies, patch-staging, or full Work folder scan.',
                   'Do not use this run as sync-history.py --inventory input or as a full inventory cache.',
                   'Existing full inventory cache remains at its previous run; it was not recreated.']}
    csvbuf = io.StringIO(newline='')
    writer = csv.writer(csvbuf)
    writer.writerow(['workCode', 'path', 'pack', 'source', 'class', 'sha256',
                     'eventIds', 'baselineReuse', 'compatibilityAliasOf'])
    for row in files:
        writer.writerow([row['workCode'], row['path'], row['pack'], row['source'], row['class'],
                         row['sha256'], '|'.join(row.get('eventIds', [])),
                         '|'.join(row.get('baselineReuse', [])), row.get('compatibilityAliasOf', '')])
    assert_protected(protected)
    exclusive(manifest_path, manifest_bytes)
    exclusive(run / 'SYNC_RESULT.json', jb(summary))
    exclusive(run / 'delta-manifest.json', jb({'schema': 2, 'snapshotType': TYPE,
              'summary': summary, 'filesReference': ref, 'fileCount': 6946,
              'imageStagingPresent': False, 'fullInventoryCache': False}))
    exclusive(run / 'changes.csv', b'\xef\xbb\xbf' + csvbuf.getvalue().encode('utf-8'))
    exclusive(run / 'index-before.json', indexraw)
    exclusive(run / 'README_KO.txt', (
        '3차 r1 배포 이미지 메타데이터 이력\n\n'
        '개인147경로+인디6799경로=6946경로. 기존6944행을 보존하고 호환사본2행만 추가했습니다.\n'
        '2차 이후 추가29경로는 이전27경로+호환사본2경로이며 새로 제작한 그림 수가 아닙니다.\n'
        '호환 행의 workCode는 정상 원본의 기존 코드를 공유합니다. 새 고정ID를 만들지 않았습니다.\n'
        '그림/압축파일 복제, 체크·progress·원장·catalog·codes 변경은 없습니다.\n'
        '이 run은 메타데이터 명세이며 patch-staging/전체 inventory.json이 없습니다.\n'
        '전체 스캔 캐시나 sync-history.py --inventory 입력으로 사용하지 마십시오.\n'
    ).encode('utf-8'))
    updated_index = copy.deepcopy(index)
    updated_index['runs'].append({'runId': runid, 'createdUTC': now.isoformat(),
        'summary': str(run / 'SYNC_RESULT.json'),
        'summarySha256': digest(run / 'SYNC_RESULT.json'),
        'ledgerWatermarkUTC': old['ledger']['lastEventCreatedUTC'], 'snapshotType': TYPE})
    updated_index['latestRun'] = runid
    assert updated_index['runs'][:-1] == index['runs']
    assert_protected(protected)
    cas(INDEX, indexraw, jb(updated_index))
    assert_protected(protected)
    result = {'status': manifest['status'], 'runId': runid, 'runDirectory': str(run),
        'manifest': ref, 'counts': counts, 'archives': archives, 'protectedMetadata': protected,
        'releaseHistoryIndexBeforeSha256': sha(indexraw),
        'releaseHistoryIndexAfterSha256': digest(INDEX), 'engineReport': engine,
        'prior6944RowsPreserved': True, 'compatibilityAliasesAdded': 2,
        'imagesRestaged': 0, 'archivePayloadCopies': 0, 'newCatalogIds': 0, 'newLedgerEvents': 0,
        'gameFilesChanged': False, 'FullSynchronized': False, 'commit': False, 'push': False}
    exclusive(R / 'image-history-final-result.json', jb(result))
    verify_record()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--prepare', action='store_true')
    group.add_argument('--apply', action='store_true')
    group.add_argument('--verify', action='store_true')
    parser.add_argument('--engine-report')
    main(parser.parse_args())
# JO9 MOD END THIRD_R1_IMAGE_HISTORY_20261026
