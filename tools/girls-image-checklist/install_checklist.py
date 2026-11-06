"""Install the reviewed checklist only; never modify game QSP, JSON or artwork."""
from pathlib import Path
import hashlib
import json
import os
import re
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO = Path('G:/somi/JO9sa')
CATALOG = GAME / 'modtools/catalog/catalog_merge_vs_original.html'
TOOLS = REPO / 'tools/girls-image-checklist'
RECORD = REPO / 'records/girls-checklist-20261104/install-report.json'
START = '<!-- JO9 GIRLS CHECKLIST START 20261104 -->'
END = '<!-- JO9 GIRLS CHECKLIST END 20261104 -->'

def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def main():
    manifest = json.loads((HERE / 'manifest.json').read_text(encoding='utf-8'))
    test = json.loads((HERE / 'browser-test-report.json').read_text(encoding='utf-8'))
    assert test['status'] == 'PASS'
    assert test['uiSha256'] == digest((HERE / 'catalog-girls-checklist.js').read_bytes())
    assert test['manifestSha256'] == digest((HERE / 'manifest.json').read_bytes())
    assert digest((GAME / 'jack.qsp').read_bytes()) == manifest['qspSha']
    for c in manifest['characters']:
        assert digest((GAME / c['json']).read_bytes()) == c['jsonSha256'], c['json']
    old = CATALOG.read_bytes()
    expected = (HERE / 'catalog-before.sha256').read_text(encoding='ascii').strip()
    assert digest(old) == expected, 'Catalog changed since candidate build; rebuild first'
    candidate = (HERE / 'catalog.updated.html').read_bytes()
    restored = re.sub(re.escape(START) + r'.*?' + re.escape(END) + r'\n', '',
                      candidate.decode('utf-8'), count=1, flags=re.S).encode('utf-8')
    assert restored == old, 'Unexpected edits outside the inserted checklist'
    destinations = {CATALOG: candidate,
                    GAME / 'modtools/catalog/JO9_캐릭터_이미지체크리스트.html':
                    (HERE / 'JO9_캐릭터_이미지체크리스트.html').read_bytes()}
    source_names = ['build_inventory.py', 'build_pages.py', 'catalog-girls-checklist.js',
                    'manifest.json', 'README_KO.md', 'browser-test.cjs',
                    'browser-test-report.json', 'install_checklist.py']
    for name in source_names:
        dest = TOOLS / name
        payload = (HERE / name).read_bytes()
        assert not dest.exists() or dest.read_bytes() == payload, f'Existing source differs: {dest}'
        destinations[dest] = payload
    before = {}
    written = []
    try:
        for dest, payload in destinations.items():
            before[dest] = dest.read_bytes() if dest.exists() else None
            dest.parent.mkdir(parents=True, exist_ok=True)
            stage = dest.with_name(dest.name + '.girls-checklist-install.tmp')
            assert not stage.exists(), stage
            try:
                with stage.open('xb') as stream:
                    stream.write(payload)
                os.replace(stage, dest)
            finally:
                if stage.exists():
                    stage.unlink()
            written.append(dest)
            assert dest.read_bytes() == payload
        assert digest((GAME / 'jack.qsp').read_bytes()) == manifest['qspSha']
        report = {'installedAt': datetime.now(timezone.utc).isoformat(),
                  'characters': len(manifest['characters']), 'catalogBeforeSha256': expected,
                  'catalogAfterSha256': digest(candidate), 'unrelatedCatalogBytesPreserved': True,
                  'qspUnchangedSha256': manifest['qspSha'], 'jsonUnchangedCount': len(manifest['characters']),
                  'browserTestStatus': test['status'], 'browserGameWrites': test['gameWrites'],
                  'installedFiles': {str(p): digest(b) for p,b in destinations.items()},
                  'gameFallbackStatus': 'B approved; queued for the users batch WORK instruction',
                  'fullDistributionTouched': False}
        RECORD.parent.mkdir(parents=True, exist_ok=True)
        RECORD.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (HERE / 'install-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({'installed': len(destinations), 'characters': report['characters'],
                          'catalogSha256': digest(candidate), 'qspUnchanged': True,
                          'report': str(RECORD)}, ensure_ascii=False))
    except Exception:
        for dest in reversed(written):
            if before[dest] is None:
                dest.unlink()
            else:
                dest.write_bytes(before[dest])
        raise

if __name__ == '__main__':
    main()
