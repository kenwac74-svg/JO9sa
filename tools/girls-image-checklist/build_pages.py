"""Build the standalone checklist and a minimal insertion for the existing catalog."""
from pathlib import Path
import hashlib
import json
import re

folder = Path(__file__).resolve().parent
catalog = Path('G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/catalog_merge_vs_original.html')
snapshot = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
status_file = catalog.with_name('catalog_status.js')
if status_file.exists():
    status_match = re.search(r'window\.CATALOG_STATUS\s*=\s*([\s\S]*);\s*$', status_file.read_text(encoding='utf-8-sig'))
    assert status_match, 'Cannot read existing shared checklist status'
    snapshot['checklistStatus'] = json.loads(status_match.group(1))
data = json.dumps(snapshot, ensure_ascii=False, separators=(',', ':'))
script = (folder / 'catalog-girls-checklist.js').read_text(encoding='utf-8-sig')
data = data.replace('<', r'\u003c')
# Protect both the HTML parser and the server's closing-body script injection.
# Inline download templates must not contain a literal HTML closing tag.
script = re.sub(r'</(script|body|html)', lambda m: '<\\/' + m.group(1), script, flags=re.I)
assert not re.search(r'</(?:script|body|html)', script, flags=re.I)
start = '<!-- JO9 GIRLS CHECKLIST START 20261104 -->'
end = '<!-- JO9 GIRLS CHECKLIST END 20261104 -->'
block = start + '\n<script>window.JO9_GIRLS_CHECKLIST=' + data + ';</script>\n<script>' + script + '</script>\n' + end
raw = catalog.read_bytes()
html = raw.decode('utf-8-sig')
if start in html:
    assert html.count(start) == html.count(end) == 1
    updated = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda _: block, html, flags=re.S)
else:
    assert html.lower().count('</body>') == 1
    at = html.lower().index('</body>')
    updated = html[:at] + block + '\n' + html[at:]
assert updated.count(start) == updated.count(end) == 1
(folder / 'catalog.updated.html').write_text(updated, encoding='utf-8', newline='')
standalone = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JO9 캐릭터 이미지 체크리스트</title></head><body>' + block + '</body></html>'
(folder / 'JO9_캐릭터_이미지체크리스트.html').write_text(standalone, encoding='utf-8', newline='')
(folder / 'catalog-before.sha256').write_text(hashlib.sha256(raw).hexdigest(), encoding='ascii')
print(json.dumps({'characters': len(json.loads(data)['characters']), 'standaloneBytes': len(standalone.encode('utf-8')),
                  'catalogBeforeSha': hashlib.sha256(raw).hexdigest(),
                  'catalogAfterSha': hashlib.sha256(updated.encode('utf-8')).hexdigest()}, indent=2))
