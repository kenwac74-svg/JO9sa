# apply_mods.ps1과 같은 방식(add_locations + old/new 치환, 왕복·줄끝·표식 검사)으로 mod 하나를 qsp 사본에 적용하는 검증용 스크립트
import sys, json, hashlib, re
src, modp, out = sys.argv[1:4]
raw = open(src, 'rb').read()
sh = lambda s, d: ''.join(chr((ord(c) + d) & 0xFFFF) for c in s)
lines = raw.decode('utf-16-le').split('\r\n')
assert '\r\n'.join(lines).encode('utf-16-le') == raw, '왕복 실패'
def index(lines):
    n = int(sh(lines[3], 5)); at = 4; idx = {}
    for _ in range(n):
        idx[sh(lines[at], 5)] = at; acts = int(sh(lines[at + 3], 5)); at += 4 + acts * 3
    assert at == len(lines) - 1 and lines[at] == ''
    return idx
idx = index(lines); mod = json.load(open(modp, encoding='utf-8'))
for loc in mod.get('add_locations', []):
    assert loc['name'] not in idx
    lines = lines[:-1] + [sh(loc['name'], -5), sh(loc['desc'], -5), sh(loc['body'], -5), sh('0', -5), '']
    lines[3] = sh(str(len(idx) + 1), -5); idx = index(lines)
for e in mod['edits']:
    li = idx[e['location']] + 2; t = sh(lines[li], 5)
    assert t.count(e['old']) == e['count'], (e['location'], t.count(e['old']))
    lines[li] = sh(t.replace(e['old'], e['new']), -5)
for name, at in idx.items():
    b = sh(lines[at + 2], 5)
    assert not re.search(r'\r(?!\n)|(?<!\r)\n', b), name
    ids = set(re.findall(r'(?m)^[\t ]*! JO9 MOD START ([A-Za-z0-9_]+)', b))
    for m in re.finditer(r'(?m)^[\t ]*! JO9 MOD END (.*)$', b):
        rest = m.group(1); tok = re.match(r'[A-Za-z0-9_]+', rest).group(0) if re.match(r'[A-Za-z0-9_]+', rest) else ''
        if tok in ids: assert rest[len(tok):].strip() == '' or rest[len(tok):].strip().startswith('|'), name
data = '\r\n'.join(lines).encode('utf-16-le'); open(out, 'wb').write(data)
print('before', hashlib.sha256(raw).hexdigest(), 'after', hashlib.sha256(data).hexdigest(), 'locations', len(idx))
