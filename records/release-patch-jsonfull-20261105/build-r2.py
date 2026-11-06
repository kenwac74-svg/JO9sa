"""Repackage the validated game with complete JSON and optional CMD installation."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import re
import shutil
import zipfile
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
PRIOR = HERE.parent / 'release-patch-20261105'
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO = Path('G:/somi/JO9sa')
RECORD = REPO / 'records/release-patch-jsonfull-20261105'
DEST = Path('G:/somi/JO9_2.4.1_Patch_20261105_r2')
ZIP_NAME = 'JO9_2.4.1_Patch_20261105_r2.zip'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_json(p):
    return json.loads(p.read_text(encoding='utf-8-sig'))


def save_json(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    old = read_json(PRIOR / 'inventory/package-runtime.json')
    full = read_json(HERE / 'inventory/json-full.json')
    assert full['runtimeFileCount'] == 1158 and full['characterRegistry']['collisions'] == 0
    assert full['qspSha256'] == 'f9abbda0c5881886424709f68986398ff9527328213dfea4fc770eb4a02f2536'
    assert read_json(PRIOR / 'qa-game/release-report.json')['verdict'] == 'PASS'
    runtime = [{k: f[k] for k in ['path', 'runtimePath', 'sourceAbsolutePath', 'bytes', 'sha256', 'kind']}
               for f in old['files'] if f['kind'] != 'json']
    runtime += [dict(path=f['path'], runtimePath=f['runtimePath'], sourceAbsolutePath=f['sourceAbsolutePath'],
                     bytes=f['bytes'], sha256=f['sha256'], kind='json') for f in full['files']]
    assert len(runtime) == 1966 and len({f['path'].lower() for f in runtime}) == len(runtime)
    checks = read_json(HERE / 'tests/installer-results.json')
    assert checks['status'] == 'PASS', 'Installer regression tests must pass before shipping'
    for f in runtime:
        p = GAME / f['runtimePath']
        b = p.read_bytes()
        assert len(b) == f['bytes'] and digest(b) == f['sha256'], 'WORK drift: ' + f['path']
    portable = {'schema': 1, 'gameVersion': '2.4.1', 'patchRevision': '2026-11-05-r2',
                'jsonMode': 'replace-complete', 'files': [{k: f[k] for k in ['path', 'bytes', 'sha256', 'kind']} for f in runtime]}
    manifest_bytes = (json.dumps(portable, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    helper = (HERE / 'installer/INSTALL_HELPER.ps1').read_text(encoding='utf-8-sig')
    assert helper.count('__MANIFEST_SHA256__') == 1
    helper = helper.replace('__MANIFEST_SHA256__', digest(manifest_bytes)).replace('\r\n', '\n')
    helper_bytes = b'\xef\xbb\xbf' + helper.replace('\n', '\r\n').encode('utf-8')
    cmd = (HERE / 'installer/INSTALL.cmd').read_text(encoding='utf-8-sig').replace('\r\n', '\n')
    cmd_bytes = cmd.replace('\n', '\r\n').encode('utf-8')
    ko = '''잭 오 나인 테일즈 2.4.1 추가 패치 r2 — 2026-11-05

기존 2.4.1 게임에 적용합니다. 자동 또는 수동 중 편한 방법을 선택하세요.
먼저 게임을 종료하고 ZIP 전체를 빈 폴더에 풀어 주세요.

[자동 설치]
1. INSTALL.cmd를 더블클릭합니다.
2. 게임 폴더를 찾지 못하면 Jack-o-nine-tails.exe가 있는 기존 게임 폴더를 한 번 선택합니다.
3. 설치 완료가 표시되면 기존 게임 EXE로 실행합니다.

CMD가 파일을 확인하고 QSP·이미지를 적용한 뒤 JSON 폴더 전체를 새 데이터로 교체합니다.
이미 게임 폴더에 압축을 푼 경우에도 CMD를 실행할 수 있습니다.

[수동 설치]
1. 기존 게임의 game/json 폴더만 통째로 삭제합니다. game 전체나 save 폴더를 지우지 마세요.
2. 패치의 game 폴더를 기존 실행 파일 옆의 game 폴더에 합쳐 동일 파일을 덮어씁니다.
3. 기존 게임 EXE로 실행합니다. CMD는 실행하지 않아도 됩니다.

JSON 전체 1,158개가 들어 있으므로 개별 파일 25개를 찾을 필요가 없습니다.
개인 추가·수정 JSON이 있으면 교체 전에 게임 밖에 보관하세요. 자동 설치는 기존 json/save_config.json이 따로 있으면 보존합니다.
세이브 폴더와 FastQSP.ini/config.xml은 이 패치의 교체 대상이 아닙니다.
QSP만 따로 적용하지 말고 JSON·이미지도 함께 적용하세요.
주요 변경: RELEASE_NOTES_KO.html / English: RELEASE_NOTES_EN.html
'''
    en = '''Jack-O'-Nine-Tails Korean edition — 2.4.1 additional patch r2, November 5, 2026

Apply to an existing 2.4.1 installation. Choose automatic or manual installation.
Close the game and extract the entire ZIP into an empty folder first.

[Automatic]
1. Double-click INSTALL.cmd.
2. If the installation is not detected, select the existing folder containing Jack-o-nine-tails.exe once.
3. After completion, start your usual game EXE.

The CMD verifies the payload, applies the QSP and images, and replaces the complete JSON folder.
It also supports running after the patch has already been extracted into the game installation.

[Manual]
1. Delete only game/json in your existing installation. Do not delete the whole game or the save folder.
2. Merge the patch's game folder into the game folder beside your existing EXE, replacing matching files.
3. Start your usual game EXE. You do not need to run the CMD.

All 1,158 JSON files are included. There is no need to locate 25 individual obsolete files.
Keep any personal/custom JSON outside the game before replacement. Automatic installation preserves json/save_config.json if it is present separately.
The save folder and FastQSP.ini/config.xml are not replacement targets.
Apply the JSON and images together with the QSP, not just the QSP alone.
Notes: RELEASE_NOTES_EN.html / Korean: RELEASE_NOTES_KO.html
English documentation does not change the Korean game into an English localization.
'''
    extras = {'PATCH_MANIFEST.json': manifest_bytes, 'INSTALL_HELPER.ps1': helper_bytes, 'INSTALL.cmd': cmd_bytes,
              'INSTALL_KO.txt': b'\xef\xbb\xbf' + ko.replace('\n', '\r\n').encode('utf-8'),
              'INSTALL_EN.txt': b'\xef\xbb\xbf' + en.replace('\n', '\r\n').encode('utf-8')}
    for lang in ['KO', 'EN']:
        p = HERE / f'notes/RELEASE_NOTES_{lang}.html'
        extras[p.name] = p.read_bytes()
    DEST.mkdir(parents=True, exist_ok=True)
    archive = DEST / ZIP_NAME
    assert not archive.exists(), 'Previous ZIPs are immutable; choose a new revision'
    expected = {f['path']: {'bytes': f['bytes'], 'sha256': f['sha256'], 'kind': f['kind']} for f in runtime}
    expected.update({p: {'bytes': len(b), 'sha256': digest(b), 'kind': 'documentation-or-installer'} for p, b in extras.items()})
    with zipfile.ZipFile(archive, 'x', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for f in sorted(runtime, key=lambda f: f['path']):
            z.write(f['sourceAbsolutePath'], f['path'])
        for p, b in extras.items():
            z.writestr(p, b)
    with zipfile.ZipFile(archive) as z:
        assert len(z.namelist()) == len(set(z.namelist())) == len(expected)
        assert set(z.namelist()) == set(expected)
        for p in z.namelist():
            assert not p.startswith('/') and '\\' not in p and ':' not in p and all(s not in ['.', '..'] for s in PurePosixPath(p).parts)
            b = z.read(p)
            assert len(b) == expected[p]['bytes'] and digest(b) == expected[p]['sha256']
        json_paths = {p: digest(z.read(p)) for p in z.namelist() if p.startswith('game/json/')}
        assert json_paths == {f['path']: f['sha256'] for f in full['files']}
        assert 'game/json/slave_index.json.bak' not in z.namelist()
        assert digest(z.read('game/jack.qsp')) == full['qspSha256']
    for p in ['INSTALL_KO.txt', 'INSTALL_EN.txt', 'RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html']:
        (DEST / p).write_bytes(extras[p])
    for n in ['FORUM_POST_KO.txt', 'FORUM_POST_EN.txt']:
        shutil.copyfile(HERE / 'notes' / n, DEST / n)
    shutil.copyfile(Path(read_json(PRIOR / 'package-result.json')['archive']).parent / 'PLAYTEST_KO.txt', DEST / 'PLAYTEST_KO.txt')
    archive_hash = digest(archive.read_bytes())
    (DEST / 'SHA256SUMS.txt').write_text(archive_hash + '  ' + ZIP_NAME + '\n', encoding='ascii')
    result = {'status': 'PASS', 'createdUTC': datetime.now(timezone.utc).isoformat(),
              'archive': str(archive), 'archiveBytes': archive.stat().st_size, 'archiveSha256': archive_hash,
              'runtimeFiles': len(runtime), 'jsonFiles': len(full['files']), 'imageFiles': 807, 'qspFiles': 1,
              'totalZipFiles': len(expected), 'completeJsonFolder': True, 'obsoleteJsonIndividualRemovalRequired': False,
              'optionalCmdInstaller': True, 'installerEntry': 'INSTALL.cmd', 'manifestSha256': digest(manifest_bytes),
              'allZipEntryCrcAndShaVerified': True, 'allJsonEqualsNativeValidatedWork': True,
              'qspUnchangedFromNativePass': full['qspSha256'], 'manualGameVisualTests': 'pending user',
              'previousZipPreserved': True, 'workAndFullModified': False}
    save_json(HERE / 'package-result.json', result)
    save_json(HERE / 'package-files.json', {'files': expected})
    save_json(HERE / 'runtime.json', {'files': runtime})
    RECORD.mkdir(parents=True, exist_ok=True)
    for name in ['build-r2.py', 'package-result.json', 'package-files.json', 'runtime.json']:
        shutil.copyfile(HERE / name, RECORD / name)
    for folder in ['notes', 'installer', 'inventory', 'tests']:
        for f in (HERE / folder).rglob('*'):
            if f.is_file():
                to = RECORD / folder / f.relative_to(HERE / folder)
                to.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(f, to)
    # Store the exact shipped helper and manifest separately from their template.
    for name in ['PATCH_MANIFEST.json', 'INSTALL.cmd', 'INSTALL_HELPER.ps1']:
        to = RECORD / 'shipped' / name
        to.parent.mkdir(parents=True, exist_ok=True)
        to.write_bytes(extras[name])
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
