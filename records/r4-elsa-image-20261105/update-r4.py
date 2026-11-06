from pathlib import Path
import copy
import hashlib
import json
import re
import zipfile
from PIL import Image

HERE = Path(__file__).resolve().parent
GAME = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
REPO = Path('G:/somi/JO9sa')
RELEASE = Path('G:/somi/JO9_2.4.1_Patch_20261105_r4')
ZIP = RELEASE / 'JO9_2.4.1_Patch_20261105_r4.zip'
STAGE = Path('G:/Codex/tmp/jo9-r4-elsa-20261105/r4-image-update.zip')
RECORD = REPO / 'records/r4-elsa-image-20261105'
REL = 'content/pic/girls/full/elsa_blond_long.png'
ENTRY = 'game/' + REL
IMAGE_SHA = 'e28f32a042477af8dd04ac75e2e73d5e8972e9fc28e0cbbef28503e7ea02789a'
QSP_SHA = '6ebda9981bf6bc56de46929474de64157969fd324bba8e8be181e002dad1cc7e'
OLD_ZIP_SHA = 'a5345600f6957701c1dc4363b4e1e09843ff14c4ca6eb08bceab5171f478fdd3'


def sha(value):
    return hashlib.sha256(value).hexdigest()


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def main():
    assert ZIP.resolve().parent == Path('G:/somi/JO9_2.4.1_Patch_20261105_r4').resolve()
    assert STAGE.resolve() == Path('G:/Codex/tmp/jo9-r4-elsa-20261105/r4-image-update.zip').resolve()
    assert not STAGE.exists() and not RECORD.exists(), 'Preserve any prior update or recovery files'
    image = (GAME / REL).read_bytes()
    assert sha(image) == IMAGE_SHA
    with Image.open(GAME / REL) as im:
        im.load()
        assert im.size == (795, 596)
    assert sha((GAME / 'jack.qsp').read_bytes()) == QSP_SHA
    assert sha(ZIP.read_bytes()) == OLD_ZIP_SHA
    ledger = GAME / 'modtools/catalog/image_work/personal-patch/events.jsonl'
    events = [json.loads(s) for s in ledger.read_text(encoding='utf-8-sig').splitlines() if s.strip()]
    latest = [f for event in events for f in event.get('files', []) if f['path'] == REL.removeprefix('content/pic/')][-1]
    assert latest['after'] == IMAGE_SHA
    runtime_path = REPO / 'assets/runtime-source-2.4.1.json'
    runtime = json.loads(runtime_path.read_text(encoding='utf-8-sig'))
    assert runtime['sourceQspSha256'] == QSP_SHA
    record_inputs = {}
    with zipfile.ZipFile(ZIP) as old:
        names = old.namelist()
        assert len(names) == 1973 and ENTRY not in names
        assert sha(old.read('game/jack.qsp')) == QSP_SHA
        manifest = json.loads(old.read('PATCH_MANIFEST.json'))
        assert manifest['patchRevision'] == '2026-11-05-r4'
        assert len(manifest['files']) == 1966
        assert not any(f['path'] == ENTRY for f in manifest['files'])
        manifest['files'].append({'path': ENTRY, 'bytes': len(image), 'sha256': IMAGE_SHA, 'kind': 'image'})
        manifest_bytes = json_bytes(manifest)
        old_pin, new_pin = sha(old.read('PATCH_MANIFEST.json')), sha(manifest_bytes)
        helper = old.read('INSTALL_HELPER.ps1')
        match = re.search(rb"(\$ExpectedManifestSha256\s*=\s*')([0-9a-f]{64})(')", helper)
        assert match and match.group(2).decode() == old_pin
        new_helper = helper[:match.start(2)] + new_pin.encode() + helper[match.end(2):]
        assert new_helper.replace(new_pin.encode(), old_pin.encode(), 1) == helper
        extras = {'PATCH_MANIFEST.json': manifest_bytes, 'INSTALL_HELPER.ps1': new_helper}
        for lang in ['KO', 'EN']:
            name = 'RELEASE_NOTES_' + lang + '.html'
            text = old.read(name).decode('utf-8')
            assert text.count('</main>') == 1 and 'ELSA_IMAGE_R4_20261105' not in text
            note = ('<section id="ELSA_IMAGE_R4_20261105"><h2>r4 이미지 추가</h2><p>엘사(2616)의 기본 전신 이미지를 최신 이미지로 교체했습니다. 795×596 이미지 1장을 추가했으며 QSP·JSON과 게임 동작은 기존 r4와 같습니다.</p></section>' if lang == 'KO' else '<section id="ELSA_IMAGE_R4_20261105"><h2>r4 image update</h2><p>Updated Elsa (2616) with the latest 795×596 base character image. One image was added; QSP, JSON, and game behavior are unchanged from r4.</p></section>')
            extras[name] = text.replace('</main>', note + '</main>').encode('utf-8')
        record_inputs = {name: old.read(name) for name in extras}
        STAGE.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(STAGE, 'x', zipfile.ZIP_DEFLATED, compresslevel=6) as new:
            for info in old.infolist():
                new.writestr(copy.copy(info), extras.get(info.filename, b'') if info.filename in extras else old.read(info), compress_type=info.compress_type, compresslevel=6)
            new.writestr(ENTRY, image)
        with zipfile.ZipFile(STAGE) as new:
            assert len(new.namelist()) == len(set(new.namelist())) == 1974
            assert new.namelist() == names + [ENTRY]
            assert sha(new.read(ENTRY)) == IMAGE_SHA
            assert sha(new.read('game/jack.qsp')) == QSP_SHA
            for name in names:
                if name not in extras:
                    a, b = old.getinfo(name), new.getinfo(name)
                    assert (a.CRC, a.file_size) == (b.CRC, b.file_size), name
            for name, value in extras.items():
                assert new.read(name) == value
            assert new.read('INSTALL.cmd') == old.read('INSTALL.cmd')
    # Exact authorization: amend the existing r4 filename; no r5 is created.
    assert sha(ZIP.read_bytes()) == OLD_ZIP_SHA
    assert sha((GAME / REL).read_bytes()) == IMAGE_SHA
    RECORD.mkdir(parents=True, exist_ok=False)
    for name, value in record_inputs.items():
        (RECORD / ('previous_' + name)).write_bytes(value)
    (RECORD / 'previous_PACKAGE_CHECK_R4.json').write_bytes((RELEASE / 'PACKAGE_CHECK_R4.json').read_bytes())
    STAGE.replace(ZIP)
    zip_sha = sha(ZIP.read_bytes())
    for name in ['RELEASE_NOTES_KO.html', 'RELEASE_NOTES_EN.html']:
        (RELEASE / name).write_bytes(extras[name])
    for lang in ['KO', 'EN']:
        name = 'FORUM_POST_' + lang + '.txt'
        text = (RELEASE / name).read_text(encoding='utf-8-sig')
        (RECORD / ('previous_' + name)).write_text(text, encoding='utf-8-sig')
        text += ('\n[r4 이미지 추가]\n엘사(2616)의 최신 기본 전신 이미지 1장을 포함했습니다. 버전과 ZIP 파일명은 r4 그대로이며 QSP·JSON은 변경하지 않았습니다.\n' if lang == 'KO' else '\n[r4 image update]\nAdded the latest base character image for Elsa (2616). The revision and ZIP filename remain r4; QSP and JSON are unchanged.\n')
        (RELEASE / name).write_text(text, encoding='utf-8-sig')
    sums_path = RELEASE / 'SHA256SUMS.txt'
    sums = sums_path.read_text(encoding='ascii')
    assert OLD_ZIP_SHA in sums
    sums_path.write_text(sums.replace(OLD_ZIP_SHA, zip_sha, 1), encoding='ascii')
    package = json.loads((RELEASE / 'PACKAGE_CHECK_R4.json').read_text(encoding='utf-8'))
    package.update(archiveBytes=ZIP.stat().st_size, archiveSHA256=zip_sha, runtimeFiles=1967, fullZipEntries=1974, manifestSHA256=new_pin)
    package['runtimeChangedPaths'] = ['game/jack.qsp', ENTRY]
    package['elsaImageUpdate'] = {'path': ENTRY, 'sha256': IMAGE_SHA, 'bytes': len(image), 'dimensions': [795,596], 'qspUnchanged': True, 'sameR4FilenameByUserRequest': True, 'previousR4ArchiveSha256': OLD_ZIP_SHA}
    package['unchangedRuntimeFilesCrcAndSizeVerified'] = 1965
    (RELEASE / 'PACKAGE_CHECK_R4.json').write_bytes(json_bytes(package))
    tracked_rel = 'assets/' + REL
    tracked = REPO / tracked_rel
    tracked.parent.mkdir(parents=True, exist_ok=True)
    if tracked.exists() and sha(tracked.read_bytes()) != IMAGE_SHA:
        (RECORD / 'previous-tracked-elsa.png').write_bytes(tracked.read_bytes())
    tracked.write_bytes(image)
    row = next((f for f in runtime['files'] if f['runtimePath'] == REL), None)
    if row is None:
        row = {'runtimePath': REL}
        runtime['files'].append(row)
    row.update(repositoryPath=tracked_rel, bytes=len(image), sha256=IMAGE_SHA)
    runtime['latestImagePatchAddition'] = {'date': '2026-11-05', 'character': 'Elsa', 'id':2616, 'path':REL, 'sha256':IMAGE_SHA, 'revision':'2026-11-05-r4'}
    runtime_path.write_bytes(json_bytes(runtime))
    note = ('\n\nr4 이미지 추가 — 2026-11-05: 엘사(2616) 기본 전신 1장(' + REL + ')을 포함했다. QSP·JSON·Full·세이브는 변경하지 않았고, 이미지 열림·795×596·새 이미지/설치 해시·나머지 ZIP 항목 동일성만 확인했다. 전체 QA/EXE는 반복하지 않았다.\n')
    with (RELEASE / 'QA_RESULT_KO.md').open('a', encoding='utf-8') as handle:
        handle.write(note)
    result = {'status':'R4_UPDATED_SAME_FILENAME', 'archive':str(ZIP), 'archiveSHA256':zip_sha, 'archiveBytes':ZIP.stat().st_size, 'imagePath':ENTRY, 'imageSHA256':IMAGE_SHA, 'imageBytes':len(image), 'imageDimensions':[795,596], 'runtimeFiles':1967, 'images':808, 'qspSHA256':QSP_SHA, 'qspUnchanged':True, 'jsonUnchanged':True, 'otherZipEntriesUnchanged':1969, 'helperOnlyManifestPinUpdated':True, 'gameEXERuns':0, 'fullQARerun':False, 'fullFolderModified':False}
    (RECORD / 'result.json').write_bytes(json_bytes(result))
    (HERE / 'result.json').write_bytes(json_bytes(result))
    (RECORD / 'update-r4.py').write_bytes(Path(__file__).read_bytes())
    (RECORD / 'REPORT_KO.md').write_text('# r4 엘사 이미지 추가\n\n사용자가 이미지 패치리스트에서 교체한 엘사(2616)의 기본 전신 1장을 WORK에서 읽어 기존 r4 ZIP에 추가했습니다. r5는 만들지 않았습니다.\n\n' + note + '\n최신 ZIP SHA-256: ' + zip_sha + '\n이미지 SHA-256: ' + IMAGE_SHA + '\n', encoding='utf-8')
    for p in [REPO / 'docs/SECOND_PATCH_WORK_BUNDLE_20261021.md', REPO / 'docs/SESSION_HANDOFF_INDEX.md']:
        with p.open('a', encoding='utf-8') as handle:
            handle.write('\n\n## 2026-11-05 r4 엘사 이미지 포함\n\n사용자 요청으로 r4 같은 파일명에 엘사(2616) 기본 전신 1장을 추가. [기록](../records/r4-elsa-image-20261105/REPORT_KO.md). 총 runtime1967/PNG808. QSP·JSON·Full·SAV 불변, 전체 QA 재실행 없음. 최신 ZIP SHA '+zip_sha+' .\n')
    assert sha((GAME / 'jack.qsp').read_bytes()) == QSP_SHA
    assert sha((GAME / REL).read_bytes()) == sha(tracked.read_bytes()) == IMAGE_SHA
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
