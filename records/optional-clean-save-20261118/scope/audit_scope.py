"""Read-only cache lifecycle audit. Emits identifiers and source anchors only."""
import collections
import hashlib
import json
import pathlib
import re
import sys

REPO = pathlib.Path("G:/somi/JO9sa")
QSP = pathlib.Path("G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp")
sys.path.insert(0, str(REPO / "tools"))
from qsp_dump import read_locations

raw = QSP.read_bytes()
locations = read_locations(raw)
by_name = {item["name"]: item for item in locations}
lines = by_name["#txt_man"]["body"].splitlines()
begin = lines.index(":jo9_voice_fragment_data")
targets = collections.Counter()
resets = set()
for line in lines[begin:]:
    match = re.match(r"\s*(\$?\w+)\s*(?:\[[^\r\n]*?\])?\s*=(?!=)", line)
    if match:
        targets[match[1]] += 1
    match = re.match(r"\s*killvar '([^']+)'", line)
    if match:
        resets.add(match[1])

cache_names = sorted(
    name for name in set(targets) | resets
    if re.fullmatch(r"\$?voice_fragment_\w+", name)
    and name != "voice_fragment_revision"
)
assert len(cache_names) == 15
references = []
for location in locations:
    if location["name"] == "#txt_man":
        continue
    for number, line in enumerate(location["body"].splitlines(), 1):
        found = sorted(set(re.findall(r"\$?voice_fragment_\w+", line)))
        if found:
            references.append({"location": location["name"], "line": number, "identifiers": found})

meal_lines = by_name["#food_base"]["body"].splitlines()
meal_ids = []
for line in meal_lines:
    match = re.match(r"\s*dynamic \$fb_cycle, '([^']*)'", line)
    if match:
        meal_ids.append(match[1])
assert len(meal_ids) == len(set(meal_ids)) == 76

manifest = {
    "qspPath": str(QSP),
    "qspSha256": hashlib.sha256(raw).hexdigest(),
    "cacheVariableCount": len(cache_names),
    "cacheVariables": cache_names,
    "invalidateTogether": ["voice_fragment_revision"],
    "cacheType": "constant database; no actor or gameplay state",
    "rebuild": {"location": "#txt_man", "argument0": "jo9_voice_fragment_data", "labelLine": begin + 1, "guardLine": 2829, "revision": 8, "idsCount": 9120},
    "liveAssignmentCounts": dict(targets),
    "resetOnlyCacheVariables": [name for name in cache_names if name not in targets],
    "explicitlyKeptOtherStaticArrays": ["$voice_fact_emotion", "$voice_flow_original", "$voice_flow_override"],
    "lazyDefaultRoute": {
        "entryLabelLine": 2826,
        "factResetLine": 2846,
        "factAssignmentSpan": [161573, 161635],
        "questionResetLine": 161637,
        "flowResetSpan": [161638, 161639],
        "questionAssignmentSpan": [161640, 164186],
        "flowAssignmentSpan": [164187, 164220],
        "revisionAssignmentLine": 164222,
        "proposal": "Before existing bank guard, non-dedicated calls jump to label before fact rows. Relocate fact reset to that label. After fact rows, non-dedicated calls jump to label before flow rows. Relocate the two flow resets to that label. Assign revision8 only on dedicated full-bank call. All original constant values and their relative order remain. No new saved flag; no duplicate data."
    },
    "directReadersOutsideDataEntry": references,
    "picker": {"location": "#dynamic", "assignmentLine": 5339, "firstReadLine": 5349, "lastReadLine": 5431, "ensureBeforeLine": 5347},
    "legacyPickerRepair": "Patch known stored $voice_pick_fragment at its unique opening $result='' followed by killvar '$jo9_vfp_candidates'; lazy ensure must execute before first voice_fragment_count read. #dynamic also needs the same repair for future redefinition.",
    "ordinaryInteractionGuards": {"location": "interaction", "lines": [603, 638, 666], "condition": "voice_fragment_revision ! 8"},
    "saveTiming": "Existing native $ongsave hook, before serialization. Do not clear completed $text/result pages, deferred callbacks, or recent dialogue memory.",
    "meal": {"variable": "$meal_id", "currentCount": 76, "currentIds": meal_ids, "existingReset": {"location": "#food_base", "line": 8}, "onlyReader": {"location": "$food_choice", "line": 43}, "safeNormalization": "Only when size >76 and divisible by76, and every element equals currentIds[index%76]. Preserve first76 with their original indices; leave any mismatch untouched. No food stock, recipes, current meal choice or other cache changes."},
    "orphan": {"variable": "$masters_vars", "location": "#static_base", "line": 408, "appendValue": "instance_mood", "sourceReferences": 1, "note": "Separate from $master_vars, which is reset and copied at405-406. The plural name is appended and never read in current QSP; stop future accumulation at this exact producer too."},
    "battleExclusion": {"kept": ["jo9_fate", "$jo9_fate", "jo9_fate_enemy", "$text", "$special_part", "$yes", "$no", "$display_options", "$sp_text", "$special_image", "$bg_path", "$special_bg", "$return_lock", "$fight_return", "$враг", "won_slave", "$won_slave"], "reason": "Active result pages, fate decisions, deferred scene/reward callbacks and trophies can survive combat reset. mode2 phase3 is explicitly consumed by arena/colosseum/catfight result routes. Do not infer disposal from phase3 or empty result alone."},
    "verification": "Read-only static current-QSP audit; no QSP, sources or saves edited by this audit. Parent separately verified native on-save ordering.",
}
out = pathlib.Path(__file__).with_name("whitelist.json")
out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"manifest": str(out), "cacheVariableCount": len(cache_names), "qspSha256": manifest["qspSha256"]}))
