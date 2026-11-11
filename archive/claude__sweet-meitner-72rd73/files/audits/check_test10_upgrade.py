from pathlib import Path
import sys, tempfile, json
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tests'))
import test_installer as t
pwsh='C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
with tempfile.TemporaryDirectory(prefix='jo9_test10_upgrade_') as tmp:
    game=Path(tmp)/'game'
    t.make_game(game,ROOT.parent/'reference/jack.qsp',t.fix6_files(),False)
    original={f:t.sha(game/f) for f in ['jack.qsp','css/base.css','json/menu_icon.json','engine/jack.exe']}
    images=t.tree_hashes(game/'content')
    for version in (tuple(map(int,sys.argv[1:])) if len(sys.argv)>1 else (9,10)):
        pkg=ROOT/f'dist/private-room-test{version}/JO9_UI_v1_9_14_SNKmod_R3_private_room_dev'
        r=t.run(pwsh,pkg,game,'Apply')
        assert r.returncode==0,(r.stdout[-1000:],r.stderr[-1000:])
        bodies={x['name']:x['body'] for x in t.read_locations((game/'jack.qsp').read_bytes())}
        patches=json.loads((pkg/'qsp-patches.json').read_text(encoding='utf-8'))
        assert all(bodies.get(x['Name'])==x['Text'] for x in patches)
        print(f'PASS TEST{version}: all {len(patches)} QSP bodies installed',flush=True)
    r=t.run(pwsh,pkg,game,'Restore')
    assert r.returncode==0,(r.stdout[-1000:],r.stderr[-1000:])
    assert all(t.sha(game/f)==v for f,v in original.items())
    assert t.tree_hashes(game/'content')==images
    print('PASS RESTORE: QSP/CSS/JSON/engine and every image match pre-install hashes',flush=True)
