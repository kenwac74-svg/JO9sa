from pathlib import Path
import hashlib
import json

TASK = Path('G:/Codex/tmp/outfit-copy-fix-20261116')
TASK.mkdir(parents=True, exist_ok=True)
backups = TASK / 'before'
backups.mkdir(exist_ok=True)
changes = []


def edit(path, replacements):
    path = Path(path)
    raw = path.read_bytes()
    text = raw.decode('utf-8')
    newline = '\r\n' if '\r\n' in text else '\n'
    text = text.replace('\r\n', '\n')
    for old, new in replacements:
        assert text.count(old) == 1, (str(path), old[:120], text.count(old))
        text = text.replace(old, new, 1)
    output = text.replace('\n', newline).encode('utf-8')
    backup = backups / (str(len(changes)) + '_' + path.name)
    assert not backup.exists(), backup
    backup.write_bytes(raw)
    path.write_bytes(output)
    changes.append({'file': str(path), 'backup': str(backup),
                    'before': hashlib.sha256(raw).hexdigest(), 'after': hashlib.sha256(output).hexdigest()})


helper = '''def shared_appearance_data(paths, sid, data=None):
    """Fill absent appearance slots from JSONs using the same physical base image.

    Explicit fields, including an empty unlink, stay authoritative. Conflicting
    donor slots and references without an image file are left unresolved. This
    only returns data; callers decide whether a user-requested save writes it.
    """
    if data is None:
        data, _filename = read_slave(paths, sid)
    updated = dict(data)
    base = data.get("fullimage")
    if not isinstance(base, str) or not base:
        return updated
    try:
        base_key = _image_path_key(paths, base)
    except ValueError:
        return updated
    groups = [("base", ("indpack_naked",)), ("title", SLOT_FIELDS["title"])] + [
        (slot, SLOT_FIELDS[slot]) for slot in ("maid", "secr", "dom")]
    missing = [(slot, fields) for slot, fields in groups if not any(field in data for field in fields)]
    if not missing:
        return updated
    candidates = {slot: {} for slot, _fields in missing}
    for filename in sorted(os.listdir(paths.slaves_dir)):
        match = re.fullmatch(r"(\\d+)(?:_[^/\\\\]+)?\\.json", filename, re.IGNORECASE)
        if not match or int(match.group(1)) == int(sid):
            continue
        try:
            with open(os.path.join(paths.slaves_dir, filename), "r", encoding="utf-8-sig") as stream:
                donor = json.load(stream)
            donor_base = donor.get("fullimage")
            if not isinstance(donor_base, str) or _image_path_key(paths, donor_base) != base_key:
                continue
            dedicated = is_dedicated(paths, int(match.group(1)))
            for slot, fields in missing:
                field, reference = (("indpack_naked", donor.get("indpack_naked")) if slot == "base"
                                    else slot_reference(donor, slot, dedicated))
                if field not in fields or not isinstance(reference, str) or not reference:
                    continue
                target = _image_path_key(paths, reference)
                if os.path.isfile(_abs_from_gamepath(paths.root, reference)):
                    candidates[slot].setdefault(target, (field, reference))
        except (OSError, ValueError, AttributeError):
            continue
    for options in candidates.values():
        if len(options) == 1:
            field, reference = next(iter(options.values()))
            updated[field] = reference
    return updated


'''

backend_replacements = [
    ('def slot_default_target(paths, sid, data, slot, base):', helper + 'def slot_default_target(paths, sid, data, slot, base):'),
    ('    before = copy.deepcopy(data)\n    updated = dict(data)\n    base = slave_base_name(data) or ("%04d_%s" % (int(sid), "char"))',
     '    before = copy.deepcopy(data)\n    data = shared_appearance_data(paths, sid, data)\n    updated = dict(data)\n    base = slave_base_name(data) or ("%04d_%s" % (int(sid), "char"))'),
    ('    data, _src_file = read_slave(paths, src_sid)\n    raw_slug =',
     '    data, _src_file = read_slave(paths, src_sid)\n    data = shared_appearance_data(paths, src_sid, data)\n    raw_slug ='),
]
for backend in [Path('G:/somi/JO9sa/tools/character-image-adder/add_character.py'),
                Path('G:/Codex/tmp/claude-character-studio-e0edb064/tools/character-image-adder/add_character.py')]:
    edit(backend, backend_replacements)

edit('G:/Codex/tmp/claude-character-studio-e0edb064/tools/jo9-history-lab/studio_server.py', [
    ('    data, json_file = api.read_slave(p, int(sid))\n    dedicated =',
     '    data, json_file = api.read_slave(p, int(sid))\n    data = api.shared_appearance_data(p, int(sid), data)\n    dedicated ='),
    ('def existing_slot_image(p, data, sid, slot):\n    field, reference =',
     'def existing_slot_image(p, data, sid, slot):\n    data = api.shared_appearance_data(p, int(sid), data)\n    field, reference ='),
])

edit('G:/somi/JO9sa/tools/modding-hub/master_editor.py', [
    ("  else:_,data=self.slave(sid);profile=self.slave_profile(sid);master=self.master_from_slave(data,profile);revision=self.slave_revision(sid);owned=profile.get('initialOverrides',{})\n  gender=",
     "  else:\n   _,data=self.slave(sid)\n   if self.backend:data=self.backend.shared_appearance_data(self.backend.GamePaths(str(self.root)),sid,data)\n   profile=self.slave_profile(sid);master=self.master_from_slave(data,profile);revision=self.slave_revision(sid);owned=profile.get('initialOverrides',{})\n  gender="),
])
(TASK / 'source-changes.json').write_text(json.dumps(changes, ensure_ascii=False, indent=2), 'utf-8')
print(json.dumps({'changed': [x['file'] for x in changes], 'manifest': str(TASK / 'source-changes.json')}, ensure_ascii=False))
