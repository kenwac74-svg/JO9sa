"""Ship only the two independently verified installer fixes; freeze game data."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import zipfile

HERE = Path(__file__).resolve().parent
OLD = Path('G:/somi/JO9_2.4.1_Patch_20261105_r2')
OLD_ZIP = OLD / 'JO9_2.4.1_Patch_20261105_r2.zip'
DEST = Path('G:/somi/JO9_2.4.1_Patch_20261105_r3')
NAME = 'JO9_2.4.1_Patch_20261105_r3.zip'
RECORD = Path('G:/somi/JO9sa/records/independent-qa-r3-20261105')


def sha(b):
    return hashlib.sha256(b).hexdigest()


def save(p, value):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def main():
    qa = json.loads((HERE / 'installer/candidate-regression/summary.json').read_bytes())
    assert qa['passed'] == qa['tests'] == 9 and qa['failed'] == 0
    candidate_ps = (HERE / 'installer/CANDIDATE_INSTALL_HELPER.ps1').read_bytes()
    candidate_cmd = (HERE / 'installer/candidate/INSTALL.cmd').read_bytes()
    assert sha(candidate_ps) == qa['helperTemplateSHA256']
    assert sha(candidate_cmd) == qa['cmdCandidateSHA256']
    assert sha(OLD_ZIP.read_bytes()) == qa['zipSHA256']
    with zipfile.ZipFile(OLD_ZIP) as z:
        original_names = z.namelist()
        original_ps = z.read('INSTALL_HELPER.ps1').decode('utf-8-sig').replace('\r\n', '\n')
        fixed_ps = candidate_ps.decode('utf-8-sig').replace('\r\n', '\n')
        moves = [
            ('Move-Item -LiteralPath $targetJson -Destination $jsonRollback', '[IO.Directory]::Move($targetJson, $jsonRollback)'),
            ('Move-Item -LiteralPath $jsonStage -Destination $targetJson', '[IO.Directory]::Move($jsonStage, $targetJson)'),
            ('Move-Item -LiteralPath $targetJson -Destination $failedJson', '[IO.Directory]::Move($targetJson, $failedJson)'),
            ('Move-Item -LiteralPath $jsonRollback -Destination $targetJson', '[IO.Directory]::Move($jsonRollback, $targetJson)'),
        ]
        for old, new in moves:
            assert original_ps.count(old) == 1
            original_ps = original_ps.replace(old, new)
        assert original_ps == fixed_ps, 'Candidate must contain only four atomic directory replacements'
        old_cmd = z.read('INSTALL.cmd').decode('utf-8').replace('\r\n', '\n')
        assert candidate_cmd.decode('utf-8').replace('\r\n', '\n') == old_cmd.replace('setlocal\n', 'setlocal EnableExtensions DisableDelayedExpansion\n', 1)
        manifest = json.loads(z.read('PATCH_MANIFEST.json'))
        manifest['patchRevision'] = '2026-11-05-r3'
        manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
        fixed_ps = re.sub(r"(\$ExpectedManifestSha256\s*=\s*)'[0-9a-f]{64}'", lambda m: m.group(1) + "'" + sha(manifest_bytes) + "'", fixed_ps, count=1)
        extras = {'INSTALL.cmd': candidate_cmd, 'INSTALL_HELPER.ps1': b'\xef\xbb\xbf' + fixed_ps.replace('\n', '\r\n').encode('utf-8'), 'PATCH_MANIFEST.json': manifest_bytes}
        for lang in ['KO', 'EN']:
            n = 'INSTALL_' + lang + '.txt'
            text = z.read(n).decode('utf-8-sig').replace(' r2 ', ' r3 ')
            extras[n] = b'\xef\xbb\xbf' + text.encode('utf-8')
            n = 'RELEASE_NOTES_' + lang + '.html'
            text = z.read(n).decode('utf-8')
            note = ('<section><h2>r3 설치 보완</h2><p>독립 QA에서 확인한 특수 경로의 CMD 실행 문제와 권한 오류 시 JSON 복구 문제를 수정했습니다. 게임 데이터는 r2와 같습니다.</p></section>' if lang == 'KO' else '<section><h2>r3 installation fixes</h2><p>Fixed CMD execution with special path names and JSON recovery after permission errors, as found by independent QA. Game data is unchanged from r2.</p></section>')
            assert text.count('</main>') == 1
            extras[n] = text.replace('</main>', note + '</main>').encode('utf-8')
        DEST.mkdir(parents=True, exist_ok=True)
        archive = DEST / NAME
        assert not archive.exists(), 'Release ZIPs are immutable'
        expected = {}
        with zipfile.ZipFile(archive, 'x', zipfile.ZIP_DEFLATED, compresslevel=6) as out:
            for name in original_names:
                data = extras.get(name)
                if data is None:
                    data = z.read(name)
                out.writestr(name, data)
                expected[name] = sha(data)
    with zipfile.ZipFile(archive) as z, zipfile.ZipFile(OLD_ZIP) as old:
        assert set(z.namelist()) == set(original_names) and len(z.namelist()) == 1973
        for n in z.namelist():
            assert sha(z.read(n)) == expected[n]
        unchanged = [n for n in z.namelist() if n.startswith('game/')]
        assert len(unchanged) == 1966
        assert all(sha(z.read(n)) == sha(old.read(n)) for n in unchanged)
        assert sha(z.read('game/jack.qsp')) == 'f9abbda0c5881886424709f68986398ff9527328213dfea4fc770eb4a02f2536'
    for n in ['INSTALL_KO.txt', 'INSTALL_EN.txt', 'RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html']:
        (DEST / n).write_bytes(extras[n])
    for lang in ['KO', 'EN']:
        n = 'FORUM_POST_' + lang + '.txt'
        text = (OLD / n).read_text(encoding='utf-8-sig')
        text += ('\n[r3 설치 보완]\n독립 QA에서 확인한 특수 경로의 CMD 실행 문제와 권한 오류 시 JSON 복구 문제를 수정했습니다. 게임 데이터와 설치 방법은 같습니다.\n' if lang == 'KO' else '\n[r3 installation fixes]\nFixed CMD execution with special path names and JSON recovery after permission errors, following independent QA. Game data and installation steps are unchanged.\n')
        (DEST / n).write_text(text, encoding='utf-8-sig')
    for n in ['PLAYTEST_TC_KO.md', 'PLAYTEST_TC_KO.txt']:
        p = HERE / 'manual' / n
        assert NAME in p.read_text(encoding='utf-8-sig')
        shutil.copyfile(p, DEST / n)
    checksum = sha(archive.read_bytes())
    (DEST / 'SHA256SUMS.txt').write_text(checksum + '  ' + NAME + '\n', encoding='ascii')
    result = {'status': 'PASS', 'archive': str(archive), 'bytes': archive.stat().st_size, 'sha256': checksum,
              'allZipEntryCrcAndShaVerified': True, 'gameRuntimeFiles': 1966, 'allGameDataExactlyR2': True,
              'qspSha256': 'f9abbda0c5881886424709f68986398ff9527328213dfea4fc770eb4a02f2536',
              'fixedFindings': ['F01: permission-error JSON move/rollback', 'F02: delayed expansion with exclamation path'],
              'candidateRegressionPass': 9, 'currentGameClientExecutions': 0,
              'manifestSha256': sha(manifest_bytes), 'manualGameTests': 'pending user', 'oldZipPreserved': True}
    save(HERE / 'r3-package.json', result)
    save(RECORD / 'r3-package.json', result)
    for f in [HERE / 'build-r3.py', HERE / 'installer/CANDIDATE_INSTALL_HELPER.ps1', HERE / 'installer/candidate/INSTALL.cmd']:
        p = RECORD / 'build-inputs' / f.name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(f.read_bytes())
    for n in ['INSTALL_HELPER.ps1', 'INSTALL.cmd', 'PATCH_MANIFEST.json']:
        p = RECORD / 'shipped' / n
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(extras[n])
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
