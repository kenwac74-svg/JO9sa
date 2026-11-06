"""Run the exact shipped CMD on a disposable fake game root, never WORK."""
from pathlib import Path
import hashlib
import json
import os
import subprocess
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = Path('G:/Codex/tmp/jo9-jsonfull-patch-20261105/cmd-full-smoke')
RECORD = Path('G:/somi/JO9sa/records/release-patch-jsonfull-20261105')


def digest(b):
    return hashlib.sha256(b).hexdigest()


def main():
    r = json.loads((HERE / 'package-result.json').read_bytes())
    assert not ROOT.exists(), 'Refusing to overwrite an existing smoke fixture'
    target = ROOT / '한글 공백 게임'
    patch = target / '패치 풀기'
    patch.mkdir(parents=True)
    with zipfile.ZipFile(r['archive']) as z:
        for name in z.namelist():
            assert '..' not in Path(name).parts and ':' not in name and not name.startswith('/')
            p = patch / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(z.read(name))
    sentinels = {
        'Jack-o-nine-tails.exe': b'not an executable; test root marker only',
        'game/jack.qsp': b'old-qsp',
        'game/save/player.sav': b'player-save-untouched',
        'FastQSP.ini': b'personal-preferences-untouched',
        'game/config.xml': b'personal-config-untouched',
        'game/json/save_config.json': b'{"personalEngineSetting":true}',
    }
    for name, b in sentinels.items():
        p = target / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(b)
    old_names = ['1448.json'] + [str(n) + '.json' for n in range(3003, 3027)]
    for name in old_names + ['999999_personal.json']:
        p = target / 'game/json/slaves' / name
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(b'{"old":true}')
    env = os.environ.copy()
    env['PSModulePath'] = ';'.join([
        str(Path(env.get('SYSTEMROOT', 'C:/Windows')) / 'System32/WindowsPowerShell/v1.0/Modules'),
        str(Path(env.get('PROGRAMFILES', 'C:/Program Files')) / 'WindowsPowerShell/Modules'),
        str(Path(env['USERPROFILE']) / 'Documents/WindowsPowerShell/Modules'),
    ])
    # Relative CMD entry avoids shell-quoting problems; %~dp0 still has Korean/spaces.
    p = subprocess.run([env.get('COMSPEC', 'cmd.exe'), '/d', '/c', 'INSTALL.cmd'], cwd=patch,
                       env=env, input=b'\r\n', stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                       timeout=180, creationflags=subprocess.CREATE_NO_WINDOW)
    (HERE / 'cmd-smoke-output.txt').write_text(p.stdout.decode('utf-8', errors='replace') + '\n' + p.stderr.decode('utf-8', errors='replace'), encoding='utf-8')
    assert p.returncode == 0 and b'JO9_INSTALL_OK' in p.stdout, 'Shipped CMD installation failed; see output'
    manifest = json.loads((patch / 'PATCH_MANIFEST.json').read_bytes())
    for f in manifest['files']:
        assert digest((target / f['path']).read_bytes()) == f['sha256'], f['path']
    for name in old_names:
        assert not (target / 'game/json/slaves' / name).exists()
    assert not (target / 'game/json/slaves/999999_personal.json').exists()
    for name, b in sentinels.items():
        if name != 'game/jack.qsp':
            assert (target / name).read_bytes() == b, name
    assert not list((target / 'game').glob('*.__jo9_*'))
    result = {'status': 'PASS', 'shippedCmdExecuted': True, 'automaticParentRootDetection': True,
              'koreanAndSpacePaths': True, 'verifiedRuntimeFiles': len(manifest['files']),
              'jsonRuntimeFiles': sum(f['kind'] == 'json' for f in manifest['files']),
              'obsolete25Removed': True, 'saveAndPreferencesPreserved': True,
              'optionalSaveConfigPreserved': True, 'temporaryRuntimeFoldersClean': True,
              'fakeRootOnly': str(target), 'workOrFullModified': False,
              'folderPickerActualClicks': 'not exercised; automatic detection succeeded'}
    for out in [HERE / 'cmd-smoke.json', RECORD / 'cmd-smoke.json']:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for name in ['smoke-cmd.py', 'cmd-smoke-output.txt']:
        (RECORD / name).write_bytes((HERE / name).read_bytes())
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
