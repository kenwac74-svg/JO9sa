from pathlib import Path
import hashlib, json

src = Path('G:/somi/JO9/game/save/9999.sav')
out = Path('dist/private-room-test13/save-test')
out.mkdir(parents=True, exist_ok=True)
raw = src.read_bytes()
fields = raw.decode('utf-16le').split('\r\n')
enc = lambda s: ''.join(chr((ord(c)-5) & 65535) for c in s)
dec = lambda s: ''.join(chr((ord(c)+5) & 65535) for c in s)

def variable(name):
    matches = [i for i, value in enumerate(fields) if value == enc(name)]
    assert len(matches) == 1, (name, matches)
    i = matches[0]
    count = int(dec(fields[i+1]))
    end = i+2+count*2
    keys = int(dec(fields[end]))
    index = {dec(fields[end+2+k*2]): int(dec(fields[end+1+k*2])) for k in range(keys)}
    return i, count, index

i, count, _ = variable('SPARKS')
assert count == 1 and fields[i+3] == ''
old = dec(fields[i+2])
facts = {'source': str(src), 'sparks_before': int(old), 'sparks_after': 0, 'residents': {}}
for name in ('ROOM1','ROOM2','ROOM3','ROOM4','SLAVE'):
    at, size, keys = variable(name)
    facts['residents'][name] = {k: int(dec(fields[at+2+keys[k]*2])) for k in ('PREGNANT','LACTATION','MOOD') if k in keys}
fields[i+2] = enc('0')
changed = '\r\n'.join(fields).encode('utf-16le')
# Only the encoded scalar numeric field may differ; do not reserialize the save.
fields[i+2] = enc(old)
assert '\r\n'.join(fields).encode('utf-16le') == raw
(out/'9999_original.sav').write_bytes(raw)
(out/'9999.sav').write_bytes(changed)
fields[i+2] = enc('0')
at, size, keys = variable('ROOM1')
preg_at = at+2+keys['PREGNANT']*2
old_preg = fields[preg_at]
fields[preg_at] = enc('150')
immediate = '\r\n'.join(fields).encode('utf-16le')
(out/'9999_birth_now.sav').write_bytes(immediate)
fields[preg_at] = old_preg
assert '\r\n'.join(fields).encode('utf-16le') == changed
assert src.read_bytes() == raw
facts['original_sha256'] = hashlib.sha256(raw).hexdigest()
facts['modified_sha256'] = hashlib.sha256(changed).hexdigest()
facts['changed_fields'] = ['SPARKS[0] numeric value']
facts['immediate_test_copy'] = {'file': '9999_birth_now.sav', 'changed_fields': ['SPARKS[0] = 0', 'ROOM1[PREGNANT] = 150'], 'sha256': hashlib.sha256(immediate).hexdigest()}
(out/'save-change.json').write_text(json.dumps(facts, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(facts, ensure_ascii=False, indent=2))
