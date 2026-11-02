"""Read-only game asset verification; writes evidence only beside this script."""
from pathlib import Path
import hashlib
import json
import re
import sys
from PIL import Image

HERE = Path(__file__).resolve().parent
WORKSPACE = HERE.parent.parent
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
AUDIT = WORKSPACE / 'bug-batch-20261028/portraits/missing-fullimage-audit.json'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def png(path):
    with Image.open(path) as image:
        assert image.format == 'PNG', str(path)
        image.verify()
    with Image.open(path) as image:
        image.load()
        assert image.width > 0 and image.height > 0
        return {'format': image.format, 'width': image.width, 'height': image.height,
                'mode': image.mode, 'verifyAndFullDecode': True}

def source_rows():
    audit = json.loads(AUDIT.read_text(encoding='utf-8-sig'))
    assert audit['count'] == len(audit['rows']) == 23
    assert len({row['fullimage'] for row in audit['rows']}) == 23
    return audit['rows']

def preflight():
    result = {'audit': str(AUDIT), 'auditSha256': sha(AUDIT), 'count': 23,
              'qspSha256': sha(GAME / 'jack.qsp'), 'rows': [], 'gameWrites': 0}
    for old in source_rows():
        json_path = GAME / 'json/slaves' / old['file']
        data = json.loads(json_path.read_text(encoding='utf-8-sig'))
        assert data['fullimage'] == old['fullimage']
        assert data['indpack_title'] == old['indpack_title']
        actor_id = re.fullmatch(r'(\d+)\.json', old['file']).group(1)
        assert re.match(r'^girls/full/' + actor_id + r'_', data['fullimage'])
        assert data['indpack_title'] == f'girls/full/{actor_id}/{actor_id}_full_title'
        source = GAME / 'content/pic' / (data['indpack_title'] + '.png')
        target = GAME / 'content/pic' / (data['fullimage'] + '.png')
        assert source.is_file() and not target.exists(), str(target)
        row = {'jsonFile': old['file'], 'id': actor_id, 'jsonPath': str(json_path),
               'jsonSha256': sha(json_path), 'source': str(source), 'target': str(target),
               'sourceBytes': source.stat().st_size, 'sourceSha256': sha(source),
               'targetAbsent': True, 'jsonAndPathIdsMatch': True, 'sourcePng': png(source),
               'sameIdExistingRootCandidates': []}
        for name in old['same_id_root_candidates']:
            prior = GAME / 'content/pic/girls/full' / name
            assert prior.is_file()
            prior_sha = sha(prior)
            row['sameIdExistingRootCandidates'].append({'path': str(prior),
                'bytes': prior.stat().st_size, 'sha256': prior_sha,
                'identicalToTitleSource': prior_sha == row['sourceSha256']})
        result['rows'].append(row)
    row1064 = next(row for row in result['rows'] if row['id'] == '1064')
    blond = next(row for row in row1064['sameIdExistingRootCandidates']
                 if Path(row['path']).name == '1064_blond_long_young.png')
    assert blond['identicalToTitleSource'], '1064 title differs from root blond image'
    result['special1064'] = {'titleAndRootBlondIdentical': True,
                            'sha256': row1064['sourceSha256'], 'bytes': row1064['sourceBytes']}
    (HERE / 'preflight.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'phase': 'preflight', 'count': 23, 'targetsAbsent': 23,
                      'sourcesPngVerifiedAndDecoded': 23, 'idsMatch': 23,
                      'special1064': result['special1064'], 'qspSha256': result['qspSha256']}))

def postflight():
    pre = json.loads((HERE / 'preflight.json').read_text(encoding='utf-8'))
    result = {'count': 23, 'qspSha256': sha(GAME / 'jack.qsp'), 'rows': [], 'gameWrites': 0}
    assert result['qspSha256'] == pre['qspSha256']
    manifest_path = Path('G:/somi/JO9sa/assets/compatibility-aliases/2026-10-28_fullimage.json')
    installation_path = Path('G:/somi/JO9sa/records/fullimage-compat-aliases-20261028/installation.json')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8-sig'))
    installation = json.loads(installation_path.read_text(encoding='utf-8-sig'))
    assert manifest['count'] == installation['count'] == installation['created'] == 23
    assert manifest['addedBytes'] == installation['bytesCreated'] == 4213447
    assert len(manifest['files']) == len(installation['files']) == 23
    assert installation['manifestSha256'] == sha(manifest_path)
    assert manifest['intentionalDuplicates'] is True
    manifest_rows = {str(row['id']): row for row in manifest['files']}
    installed_rows = {str(row['id']): row for row in installation['files']}
    for old in pre['rows']:
        source, target = Path(old['source']), Path(old['target'])
        assert target.is_file(), str(target)
        assert sha(Path(old['jsonPath'])) == old['jsonSha256']
        assert source.stat().st_size == old['sourceBytes']
        assert sha(source) == old['sourceSha256']
        target_sha = sha(target)
        assert target_sha == old['sourceSha256']
        assert target.read_bytes() == source.read_bytes()
        assert not target.samefile(source), 'Alias must be an independent file'
        for recorded in (manifest_rows[old['id']], installed_rows[old['id']]):
            assert recorded['source'] == source.relative_to(GAME).as_posix()
            assert recorded['compatibility'] == target.relative_to(GAME).as_posix()
            assert recorded['sha256'] == target_sha
            assert recorded['bytes'] == target.stat().st_size
            assert recorded['jsonSha256'] == old['jsonSha256']
        for root in old['sameIdExistingRootCandidates']:
            assert sha(Path(root['path'])) == root['sha256']
        result['rows'].append({'id': old['id'], 'source': str(source), 'target': str(target),
            'bytes': target.stat().st_size, 'sourceSha256': old['sourceSha256'],
            'targetSha256': target_sha, 'byteIdentical': True, 'sourceUnchanged': True,
            'jsonUnchanged': True, 'independentFile': True, 'recordsMatch': True,
            'targetPng': png(target)})
    result['special1064'] = pre['special1064'] | {'aliasTitleAndRootBlondAllIdentical': True}
    result['totalAddedBytes'] = sum(row['bytes'] for row in result['rows'])
    result['manifest'] = {'path': str(manifest_path), 'sha256': sha(manifest_path),
                          'all23RowsMatch': True, 'intentionalDuplicates': True}
    result['installation'] = {'path': str(installation_path), 'sha256': sha(installation_path),
                              'all23RowsMatch': True, 'manifestHashMatches': True}
    (HERE / 'postflight.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'phase': 'postflight', 'count': 23, 'byteIdentical': 23,
        'targetPngVerifiedAndDecoded': 23, 'jsonUnchanged': 23, 'qspUnchanged': True,
        'totalAddedBytes': result['totalAddedBytes'], 'special1064': result['special1064']}))

if __name__ == '__main__':
    assert len(sys.argv) == 2 and sys.argv[1] in ('pre', 'post')
    (preflight if sys.argv[1] == 'pre' else postflight)()
