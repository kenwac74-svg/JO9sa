from pathlib import Path
import hashlib
import json

task = Path('G:/Codex/tmp/outfit-copy-fix-20261116')
manifest = task / 'source-changes.json'
changes = json.loads(manifest.read_text('utf-8'))
for item in changes:
    path = Path(item['file'])
    if path.name not in ('add_character.py', 'master_editor.py'):
        continue
    raw = path.read_bytes()
    text = raw.decode('utf-8')
    newline = '\r\n' if '\r\n' in text else '\n'
    text = text.replace('\r\n', '\n')
    if path.name == 'add_character.py':
        old = '    if updated != data or new_json != json_file:\n        with open(json_file, "rb") as source:'
        at = text.index('def save_character_slots(')
        head, body = text[:at], text[at:]
        assert body.count(old) == 1
        text = head + body.replace(old, old.replace('updated != data', 'updated != before'), 1)
    else:
        old = "  slots={k:{'label':label,'field':field,'reference':data.get(field),'url':self.image_url(data.get(field))} for k,(field,label) in SLOTS.items()}"
        new = """  slots={}
  aliases={'base':('indpack_naked','fullimage'),'maid':('fullmade','indpack_maid'),
           'secr':('fullsecretary','indpack_secr'),'dom':('fullmistress','indpack_dom')}
  for key,(field,label) in SLOTS.items():
   field=next((f for f in aliases.get(key,(field,)) if data.get(f)),field)
   reference=data.get(field);slots[key]={'label':label,'field':field,'reference':reference,'url':self.image_url(reference)}"""
        assert text.count(old) == 1
        text = text.replace(old, new)
    output = text.replace('\n', newline).encode('utf-8')
    path.write_bytes(output)
    item['after'] = hashlib.sha256(output).hexdigest()
manifest.write_text(json.dumps(changes, ensure_ascii=False, indent=2), 'utf-8')
print('Updated save comparison and master outfit aliases.')
