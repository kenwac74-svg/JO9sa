"""Offline release artifact/data TC, without starting a game process."""
from pathlib import Path, PurePosixPath
from collections import Counter
from io import BytesIO
import hashlib
import json
import re
import zipfile
from PIL import Image
import argparse

HERE = Path(__file__).resolve().parent
REPO = Path('G:/somi/JO9sa')
ARCHIVE = Path('G:/somi/JO9_2.4.1_Patch_20261105_r2/JO9_2.4.1_Patch_20261105_r2.zip')


def h(b):
    return hashlib.sha256(b).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', type=Path, default=ARCHIVE)
    parser.add_argument('--sha', default='ff2f3f05097e70e289535d9715cf5b10e812b14f5d16e70dd48f0312db6485db')
    parser.add_argument('--out', type=Path, default=HERE / 'package-resources.json')
    args = parser.parse_args()
    archive = args.archive
    cases = []

    def check(id, title, condition, detail=None):
        cases.append({'id': id, 'title': title, 'status': 'PASS' if condition else 'FAIL', 'detail': detail})

    check('PK01', 'Frozen release ZIP SHA256', h(archive.read_bytes()) == args.sha)
    baseline = json.loads((REPO / 'records/distribution-cleanup-20261102/BUILD_MANIFEST.json').read_bytes())
    available = {f['path'].lower(): f['sha256'] for f in baseline['files']}
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        check('PK02', 'No case-insensitive path collisions', len(names) == len(set(n.lower() for n in names)))
        check('PK03', 'Safe relative paths; no encrypted or linked entries', all(not n.startswith('/') and ':' not in n and '\\' not in n and all(p not in ('.', '..') for p in PurePosixPath(n).parts) for n in names) and all(not i.flag_bits & 1 and (i.external_attr >> 16) & 0o170000 != 0o120000 for i in z.infolist()))
        raw_manifest = z.read('PATCH_MANIFEST.json')
        manifest = json.loads(raw_manifest)
        rows = manifest['files']
        expected_extra = {'PATCH_MANIFEST.json', 'INSTALL.cmd', 'INSTALL_HELPER.ps1', 'INSTALL_KO.txt', 'INSTALL_EN.txt', 'RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html'}
        check('PK04', 'Exact runtime and documentation/installer file set', set(names) == {f['path'] for f in rows} | expected_extra and len(rows) == 1966)
        helper = z.read('INSTALL_HELPER.ps1').decode('utf-8-sig')
        match = re.search(r"\$ExpectedManifestSha256\s*=\s*'([0-9a-f]{64})'", helper)
        check('PK05', 'Installer locks the shipped manifest hash', bool(match and match.group(1) == h(raw_manifest)))
        bad = []
        images = []
        documents = {}
        decoded = {}
        duplicate_keys = []
        for f in rows:
            data = z.read(f['path'])  # zipfile checks CRC as well.
            if len(data) != f['bytes'] or h(data) != f['sha256']:
                bad.append(f['path'])
            available[f['path'].lower()] = h(data)
            if f['kind'] == 'json':
                def pairs(items):
                    c = Counter(k for k, _ in items)
                    duplicate_keys.extend({'path': f['path'], 'key': k} for k, n in c.items() if n > 1)
                    return dict(items)
                decoded[f['path']] = json.loads(data.decode('utf-8-sig'), object_pairs_hook=pairs)
            elif f['kind'] == 'image':
                with Image.open(BytesIO(data)) as im:
                    im.load()
                    images.append({'path': f['path'], 'size': list(im.size), 'format': im.format})
        check('PK06', 'Every runtime entry CRC, size and SHA256', not bad, {'files': len(rows), 'mismatches': bad})
        check('PK07', 'All complete JSON data parses', len(decoded) == 1158, {'jsonFiles': len(decoded), 'inheritedDuplicateKeyObservations': duplicate_keys})
        actors = {p: v for p, v in decoded.items() if p.startswith('game/json/slaves/')}
        ids = [int(re.match(r'0*(\d+)', PurePosixPath(p).name).group(1)) for p in actors]
        check('PK08', 'Character IDs unique', len(ids) == len(set(ids)) == 1155)
        index = decoded['game/json/slave_index.json']
        check('PK09', '2339 and 2340 registered inside the mature range', all(index['milf_first'] <= x <= index['milf_last'] and x in ids for x in [2339, 2340]))
        old_names = ['game/json/slaves/1448.json'] + [f'game/json/slaves/{n}.json' for n in range(3003, 3027)]
        check('PK10', 'No obsolete duplicate JSON filenames or backup files shipped', not set(old_names) & set(names) and not any(n.startswith('game/json/') and not n.endswith('.json') for n in names))
        aliases = json.loads((REPO / 'assets/compatibility-aliases/2026-10-28_fullimage.json').read_bytes())['files']
        split = json.loads((REPO / 'assets/compatibility-aliases/2026-11-05_2071_split.json').read_bytes())['files']
        keeps = {'game/' + r['compatibility'] for r in aliases} | {'game/' + r['alias'] for r in split}
        check('PK11', 'Every mandatory old-save image alias shipped', keeps <= set(names), {'requiredPaths': len(keeps)})

        def image_ref(v):
            if not isinstance(v, str) or not v.strip():
                return None
            v = v.strip().replace('\\', '/')
            if v.startswith('content/pic/'):
                v = v[len('content/pic/'):]
            if not re.search(r'\.(png|jpe?g|webp|gif)$', v, re.I):
                v += '.png'
            return ('game/content/pic/' + v).lower()

        missing_base = []
        no_declaration = []
        for p, actor in actors.items():
            # Authoring template ID0 is outside normal/special character generation.
            if int(re.match(r'0*(\d+)', PurePosixPath(p).name).group(1)) == 0:
                continue
            refs = [image_ref(actor.get(k)) for k in ['fullimage', 'indpack_title', 'indpack_naked']]
            refs = [r for r in refs if r]
            if not refs:
                no_declaration.append(p)
            elif not any(r in available for r in refs):
                missing_base.append({'json': p, 'candidates': refs})
        check('PK12', 'Playable declared base images have an available candidate after baseline+patch', not missing_base, {'actorsChecked': len(actors) - 1, 'excludedAuthoringTemplateId': 0, 'noDirectDeclaration': no_declaration, 'missingAllCandidates': missing_base})
        check('PK13', 'Every packaged picture pixel-decodes', len(images) == 807 and all(i['format'] == 'PNG' and min(i['size']) > 0 for i in images), {'images': len(images)})
        fps = ['game/content/pic/girls/full/felicity_blond_long.png', 'game/content/pic/girls/full/felicity_blond_long_young.png']
        check('PK14', 'Felicity active and compatibility base share the approved image', all(h(z.read(p)) == '1b8ee1efcab2e2d9e0042b753cca40c4d9bb0d51f0b6f35a289635c2ba77087b' for p in fps))
        align = []
        for p in [fps[0]] + ['game/content/pic/girls/full/' + r + '/felicity.png' for r in ['maid', 'mistress', 'secretary']]:
            with Image.open(BytesIO(z.read(p))) as im:
                bbox = im.convert('RGBA').getchannel('A').getbbox()
                align.append({'path': p, 'size': list(im.size), 'bbox': bbox})
        check('PK15', 'Felicity frame size, head margin and bottom cut-edge contract', all(r['size'] == [795, 596] and r['bbox'][1] <= 45 and r['bbox'][3] == 596 for r in align), align)
        check('PK16', 'No player saves or local/workshop files packaged', not any(re.search(r'(^|/)(save|modtools|__JO9_ImageBackups)(/|$)|\.(sav|bak|log)$', n, re.I) for n in names))
        docs = [z.read(f'RELEASE_NOTES_{lang}.html').decode('utf-8') for lang in ['KO', 'EN']]
        check('PK17', 'Both release HTML files are self-contained with ten previews', all(t.count('data:image/') == 10 and not re.search(r'(?:src|href)=["\']https?://', t) for t in docs))
        inherited = json.loads((HERE / 'qsp/data-classification.json').read_bytes())
        check('PK18', 'No patch-introduced duplicate JSON object groups', inherited['allDuplicateGroupsUnchanged'], {'files': len(inherited['rows']), 'groups': inherited['totalLatestDuplicateGroups'], 'classification': 'Existing data ambiguity preserved, not a newly introduced JSON syntax error'})
    result = {'status': 'PASS' if all(r['status'] == 'PASS' for r in cases) else 'FAIL',
              'artifact': str(archive), 'tests': cases, 'passed': sum(r['status'] == 'PASS' for r in cases),
              'failed': sum(r['status'] == 'FAIL' for r in cases), 'gameClientExecutions': 0,
              'legacyDataWarnings': {'duplicateObjectGroups': inherited['totalLatestDuplicateGroups'], 'files': len(inherited['rows']), 'unchangedFromBaseline': True},
              'scope': 'Archive, data definitions and static resource contracts. Presence and pixel decoding do not prove actual game image selection or visual layout.'}
    args.out.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'status': result['status'], 'pass': result['passed'], 'fail': result['failed'], 'failures': [r for r in cases if r['status'] == 'FAIL']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
