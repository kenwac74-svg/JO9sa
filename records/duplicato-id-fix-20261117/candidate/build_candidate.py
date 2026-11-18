"""Create the bounded Duplicato candidate without writing a game QSP."""
from pathlib import Path
import hashlib
import json
import sys

sys.path.insert(0, r"G:/somi/JO9sa/tools/modding-hub")
from master_editor import QspDocument

BASE = Path(r"G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp")
OUT = Path(__file__).resolve().parent


def digest(value):
    return hashlib.sha256(value).hexdigest()


def once(body, old, new):
    if body.count(old) != 1:
        raise ValueError(f"Expected one replacement, found {body.count(old)}: {old[:80]!r}")
    return body.replace(old, new, 1)


def write_json(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


raw = BASE.read_bytes()
q = QspDocument(raw)
before = {name: q.body(name) for name in ("jo9_duplicato", "jo9_duplicato_traits")}
magic = before["jo9_duplicato"]
traits = before["jo9_duplicato_traits"]

traits = once(
    traits,
    "elseif slave['id']<=0 or assistant['id']<=0:\r\n"
    " $j9de_reason='노예와 조수의 인물 정보를 확인할 수 없습니다.'\r\n"
    "elseif slave['id']=assistant['id']:",
    "! JO9 MOD START DUPLICATO_OPTIONAL_PERSON_ID_20261117\r\n"
    "elseif slave['id']>0 and slave['id']=assistant['id']:\r\n"
    "! JO9 MOD END DUPLICATO_OPTIONAL_PERSON_ID_20261117",
)

token_mode = """! JO9 MOD START DUPLICATO_ACTOR_TOKEN_20261117
if $args[0] = 'actor_token':
 local j9de_actor_type, j9de_actor_id, $j9de_actor_name, $j9de_actor_ava
 if $args[1] = 'slave':
  j9de_actor_type = slave_type
  j9de_actor_id = slave['id']
  $j9de_actor_name = $slave['name']
  $j9de_actor_ava = $slave['ava']
 elseif $args[1] = 'assistant':
  j9de_actor_type = assistant_type
  j9de_actor_id = assistant['id']
  $j9de_actor_name = $assistant['name']
  $j9de_actor_ava = $assistant['ava']
 else
  $result = ''
  exit
 end
 $result = str(j9de_actor_type) + '|' + str(j9de_actor_id) + '|' + str(len($j9de_actor_name)) + ':' + $j9de_actor_name + '|' + str(len($j9de_actor_ava)) + ':' + $j9de_actor_ava
 exit
end
! JO9 MOD END DUPLICATO_ACTOR_TOKEN_20261117

""".replace("\n", "\r\n")
magic = once(magic, "if $args[0] = 'quote':", token_mode + "if $args[0] = 'quote':")
magic = once(
    magic,
    "$func('jo9_duplicato', 'quote', str(slave['id'])) + ', ' + $func('jo9_duplicato', 'quote', str(assistant['id']))",
    "$func('jo9_duplicato', 'quote', $func('jo9_duplicato', 'actor_token', 'slave')) + ', ' + $func('jo9_duplicato', 'quote', $func('jo9_duplicato', 'actor_token', 'assistant'))",
)
magic = once(
    magic,
    "if $target ! str(slave['id']) or $donor ! str(assistant['id']):",
    "if $target ! $func('jo9_duplicato', 'actor_token', 'slave') or $donor ! $func('jo9_duplicato', 'actor_token', 'assistant'):",
)

icon_headers = (
    " local $j9de_icon, $j9de_icon_gray\r\n"
    " $j9de_icon = replace(replace($menu_item_Revelio, 'Revelio.png', 'Duplicato_Essentia.png'), 'content/pic/ui overhaul/', 'content/pic/ui/legacy_overhaul/')\r\n"
    " $j9de_icon_gray = replace(replace($menu_item_Revelio_gray, 'Revelio_gray.png', 'Duplicato_Essentia_gray.png'), 'content/pic/ui overhaul/', 'content/pic/ui/legacy_overhaul/')\r\n"
)
for mode in ("menu_item", "choose"):
    start = f"if $args[0] = '{mode}':\r\n"
    at = magic.index(start) + len(start)
    next_branch = magic.index("\r\nend\r\n", at) + len("\r\nend\r\n")
    block = magic[at:next_branch]
    block = block.replace("$menu_item_Revelio_gray", "$j9de_icon_gray").replace("$menu_item_Revelio", "$j9de_icon")
    magic = magic[:at] + icon_headers + block + magic[next_branch:]

after = {"jo9_duplicato": magic, "jo9_duplicato_traits": traits}
candidate = q.replace_bodies(after)
parsed = QspDocument(candidate)
changed = [name for name in q.index if q.body(name) != parsed.body(name)]
assert changed == list(after), changed
assert all(parsed.body(name) == body for name, body in after.items())
assert len(q.index) == len(parsed.index)
assert "slave['id']<=0 or assistant['id']<=0" not in traits
assert "elseif slave['id']>0 and slave['id']=assistant['id']:" in traits
assert magic.count("'actor_token'") == 5
assert magic.count("$menu_item_Revelio") == 4  # Only the two local-header definitions per menu mode.
assert raw == BASE.read_bytes(), "WORK QSP changed while candidate was being prepared."

OUT.mkdir(parents=True, exist_ok=True)
for name, body in after.items():
    (OUT / f"{name}.qsrc").write_bytes(body.encode("utf-8"))
write_json("mods.json", after)
write_json("metadata.json", {
    "source": str(BASE),
    "before_sha256": digest(raw),
    "after_sha256": digest(candidate),
    "before_size": len(raw),
    "after_size": len(candidate),
    "location_count": len(q.index),
    "changed_locations": changed,
    "other_locations_unchanged": True,
    "qsp_roundtrip": True,
    "source_unchanged_during_build": True,
    "body_hashes": {
        name: {"before_sha256": digest(before[name].encode("utf-8")), "after_sha256": digest(after[name].encode("utf-8"))}
        for name in after
    },
    "candidate_qsp_persisted": False,
})
print(json.dumps({"out": str(OUT), "before_sha256": digest(raw), "after_sha256": digest(candidate), "changed_locations": changed, "qsp_roundtrip": True, "other_locations_unchanged": True}, ensure_ascii=True))
