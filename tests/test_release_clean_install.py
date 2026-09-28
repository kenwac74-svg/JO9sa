"""Apply/check/reapply/restore using real unmodified game files, no preexisting backups."""
from pathlib import Path
import argparse, json, shutil, tempfile
import test_installer as t

ap = argparse.ArgumentParser()
ap.add_argument('--game', required=True, type=Path)
ap.add_argument('--pkg', required=True, type=Path)
ap.add_argument('--upgrade-from', type=Path)
args = ap.parse_args()
pwsh = 'C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
manifest = json.loads((args.pkg/'manifest.json').read_text(encoding='utf-8'))
assert manifest['Package'] == 'JO9 UI_overhaul_SNKmod'
assert manifest['Version'] == '0.11'
assert t.sha(args.game/'jack.qsp') == manifest['CleanInstall']['OriginalQsp']
assert not manifest['CleanInstall']['PreexistingBackupRequired']
with tempfile.TemporaryDirectory(prefix='jo9_release_clean_') as folder:
    game = Path(folder)/'game'
    # Copy only files involved in the installer, plus Qt identity and original images.
    paths = ['jack.qsp','css/base.css','json/menu_icon.json','engine/jack.exe','engine/Qt5Widgets.dll']
    paths += [x['Rel'] for x in manifest['Fix6']['Files'] if x['Rel'].startswith('content/pic/')]
    for rel in dict.fromkeys(paths):
        src = args.game/rel
        if src.is_file():
            dest = game/rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src,dest)
    assert not (game/'_JO9_SNKmod_STATE').exists()
    assert not (game/'_JO9_UI_ALL1914_BACKUPS').exists()
    before = t.tree_hashes(game)
    r = t.run(pwsh,args.pkg,game,'Check')
    assert r.returncode == 0, r.stdout+r.stderr
    assert t.tree_hashes(game) == before, 'CHECK modified files'
    assert not (game/'_JO9_SNKmod_STATE').exists()
    r = t.run(pwsh,args.pkg,game,'Apply')
    assert r.returncode == 0, r.stdout+r.stderr
    bodies = {x['name']: x['body'] for x in t.read_locations((game/'jack.qsp').read_bytes())}
    patches = json.loads((args.pkg/'qsp-patches.json').read_text(encoding='utf-8'))
    assert all(bodies.get(p['Name']) == p['Text'] for p in patches)
    assert t.sha(game/'engine/jack.exe') == manifest['Engine']['After'], 'approved engine was not installed'
    states = list((game/'_JO9_SNKmod_STATE').glob('*/state.json'))
    assert len(states) == 1
    state = json.loads(states[0].read_text(encoding='utf-8-sig'))
    assert state['Package'] == manifest['Package'] and state['Version'] == '0.11'
    first = t.tree_hashes(game)
    r = t.run(pwsh,args.pkg,game,'Apply')
    assert r.returncode == 0, r.stdout+r.stderr
    assert t.tree_hashes(game) == first, 'same-version reapply changed files'
    r = t.run(pwsh,args.pkg,game,'Restore')
    assert r.returncode == 0, r.stdout+r.stderr
    after = {k:v for k,v in t.tree_hashes(game).items() if not k.startswith('_JO9_SNKmod_STATE/')}
    assert after == before, 'restored game does not match pristine source'
    print('PASS: no prior backup; CHECK read-only; fresh install; all QSP patches; 0.11 state; idempotent reapply; exact original restoration.')
    if args.upgrade_from:
        r = t.run(pwsh,args.upgrade_from,game,'Apply')
        assert r.returncode == 0, r.stdout+r.stderr
        r = t.run(pwsh,args.pkg,game,'Apply')
        assert r.returncode == 0, r.stdout+r.stderr
        active = [json.loads(f.read_text(encoding='utf-8-sig')) for f in (game/'_JO9_SNKmod_STATE').glob('*/state.json')]
        active = [s for s in active if s['Status'] != 'restored']
        assert len(active) == 1 and active[0]['Package'] == 'JO9 UI_overhaul_SNKmod' and active[0]['Version'] == '0.11'
        r = t.run(pwsh,args.pkg,game,'Restore')
        assert r.returncode == 0, r.stdout+r.stderr
        after = {k:v for k,v in t.tree_hashes(game).items() if not k.startswith('_JO9_SNKmod_STATE/')}
        assert after == before
        print('PASS: legacy TEST13 package identity -> release 0.11 upgrade; one active install; exact pristine restoration.')
