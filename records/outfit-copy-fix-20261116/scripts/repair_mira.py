from pathlib import Path
import hashlib
import json
import re
import sys

sys.path.insert(0, 'G:/somi/JO9sa/tools/character-image-adder')
import add_character as api

root = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
task = Path('G:/Codex/tmp/outfit-copy-fix-20261116')
paths = api.GamePaths(str(root))
data, filename = api.read_slave(paths, 2609)
donor, donor_filename = api.read_slave(paths, 2578)
path, donor_path = Path(filename), Path(donor_filename)
original, original_donor = path.read_bytes(), donor_path.read_bytes()
resolved = api.shared_appearance_data(paths, 2609, data)
added = {k: v for k, v in resolved.items() if k not in data}
expected = {'indpack_naked', 'indpack_title', 'fullmade', 'fullsecretary', 'fullmistress'}
assert set(added) == expected, list(added)
assert all(added[k] == donor[k] for k in expected)
assert all(resolved[k] == v for k, v in data.items())
backup = task / 'before/2609_mira.json'
assert not backup.exists(), backup
backup.write_bytes(original)
image_before = {k: hashlib.sha256(Path(api._abs_from_gamepath(str(root), v)).read_bytes()).hexdigest()
                for k, v in added.items()}
# Insert fields after the opening brace; every byte of the original body remains.
bom = b'\xef\xbb\xbf' if original.startswith(b'\xef\xbb\xbf') else b''
text = original[len(bom):].decode('utf-8')
at = text.index('{') + 1
newline = '\r\n' if '\r\n' in text else '\n'
indent = re.match(r'\s*\n([ \t]*)"', text[at:])
indent = indent.group(1) if indent else '    '
inserted = newline + (',' + newline).join(indent + json.dumps(k) + ': ' + json.dumps(v, ensure_ascii=False)
                                         for k, v in added.items()) + ','
output = bom + (text[:at] + inserted + text[at:]).encode('utf-8')
assert json.loads(output.decode('utf-8-sig')) == resolved
assert (text[:at] + text[at:]).encode('utf-8') == original[len(bom):]
assert path.read_bytes() == original and donor_path.read_bytes() == original_donor
path.write_bytes(output)
actual = json.loads(path.read_text('utf-8-sig'))
assert set(actual) - set(data) == expected
assert all(actual[k] == v for k, v in data.items())
assert donor_path.read_bytes() == original_donor
assert path.read_bytes().replace(inserted.encode('utf-8'), b'', 1) == original
assert image_before == {k: hashlib.sha256(Path(api._abs_from_gamepath(str(root), v)).read_bytes()).hexdigest()
                        for k, v in added.items()}
report = {'file': str(path), 'donor': str(donor_path), 'backup': str(backup), 'addedImageFields': added,
          'existingFieldsUnchanged': True, 'originalBodyBytesPreserved': True, 'donorBytesUnchanged': True,
          'imageBytesUnchanged': True, 'before': hashlib.sha256(original).hexdigest(),
          'after': hashlib.sha256(output).hexdigest(), 'tests': {'backend': 30, 'hub': 62, 'newRegressions': 7}}
(task / 'mira-repair.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), 'utf-8')
print(json.dumps(report, ensure_ascii=False))
