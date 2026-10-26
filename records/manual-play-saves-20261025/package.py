from pathlib import Path
import hashlib
import json
import zipfile

here = Path(__file__).resolve().parent
installed = json.loads((here / 'installation.json').read_text(encoding='utf-8'))
manifest = json.loads((here / 'manifest.json').read_text(encoding='utf-8'))
source = Path(installed['target'])
output = here / 'JO9_WORK_Manual_Play_Saves_20261025.zip'
assert not output.exists(), 'Do not overwrite an existing final ZIP'
with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for item in sorted(source.rglob('*')):
        assert not item.is_symlink()
        if item.is_file():
            archive.write(item, 'JO9_MANUAL_20261025/' + item.relative_to(source).as_posix())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for row in manifest['files']:
        with archive.open('JO9_MANUAL_20261025/' + row['path']) as stream:
            assert hashlib.file_digest(stream, 'sha256').hexdigest() == row['sha256'], row['path']
report = {'file': str(output), 'bytes': output.stat().st_size,
          'sha256': hashlib.file_digest(output.open('rb'), 'sha256').hexdigest(),
          'saveFilesVerified': len(manifest['files']), 'zipIntegrity': True}
(here / 'archive.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report))
