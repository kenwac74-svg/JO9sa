"""Behavior checks for JSON-backed inventory discovery, using isolated files only."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import sys
import unittest

SOURCE = Path("G:/somi/JO9sa/tools/girls-image-checklist/build_inventory.py")
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("inventory_discovery", SOURCE)
inventory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inventory)
TEMP_ROOT = Path("G:/Codex/tmp/jo9-json-character-discovery-20261111/inventory-tests")


class InventoryDiscoveryTests(unittest.TestCase):
    def setUp(self):
        TEMP_ROOT.mkdir(parents=True, exist_ok=True)
        self.root = Path(tempfile.mkdtemp(prefix="fixture-", dir=TEMP_ROOT))
        self.slaves = self.root / "json/slaves"
        self.slaves.mkdir(parents=True)
        (self.root / "content/pic/girls/full").mkdir(parents=True)
        (self.root / "content/pic/characters").mkdir(parents=True)
        (self.root / "jack.qsp").write_bytes(b"ISOLATED QSP - preserve")
        (self.root / "json/slave_index.json").write_text(json.dumps({
            "young_first": 1001, "young_last": 1446,
            "milf_first": 2001, "milf_last": 2339,
        }), encoding="utf-8")

    def tearDown(self):
        target, base = self.root.resolve(), TEMP_ROOT.resolve()
        self.assertTrue(target.is_relative_to(base) and target != base)
        self.assertFalse(any(p.is_symlink() for p in target.rglob("*")))
        shutil.rmtree(target)

    def put(self, name, value):
        (self.slaves / name).write_text(json.dumps(value, ensure_ascii=False), encoding="utf-8")

    def test_unnumbered_json_keeps_name_and_existing_image_links(self):
        self.put("Alice.json", {"seed_name": "앨리스", "fullimage": "girls/full/alice",
                                "indpack_title": "characters/alice_title"})
        for name in ["girls/full/alice.png", "characters/alice_title.png"]:
            (self.root / "content/pic" / name).write_bytes(b"isolated image")
        before = hashlib.sha256((self.root / "jack.qsp").read_bytes()).hexdigest()
        result = inventory.build(self.root)
        self.assertEqual(result["errors"], [])
        self.assertEqual(len(result["characters"]), 1)
        row = result["characters"][0]
        self.assertEqual(row["id"], "json:Alice.json")
        self.assertIsNone(row["characterNumber"])
        self.assertEqual(row["name"], "앨리스")
        self.assertEqual(row["json"], "json/slaves/Alice.json")
        self.assertFalse(row["random"])
        self.assertEqual(row["refs"]["fullimage"], "girls/full/alice.png")
        self.assertEqual(row["missingRefs"], [])
        self.assertEqual(row["effectiveBase"]["path"], "characters/alice_title.png")
        self.assertEqual(result["qspSha"], before)

    def test_duplicate_numbered_files_are_both_discovered_with_distinct_file_keys(self):
        self.put("3040_Alice.json", {"seed_name": "앨리스"})
        self.put("3040_Betty.json", {"seed_name": "베티"})
        self.put("0007.json", {"seed_name": "고유 번호"})
        result = inventory.build(self.root)
        self.assertEqual(result["errors"], [])
        rows = {row["json"].split("/")[-1]: row for row in result["characters"]}
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows["0007.json"]["id"], 7)
        self.assertEqual(rows["0007.json"]["characterNumber"], 7)
        self.assertEqual(rows["3040_Alice.json"]["id"], "json:3040_Alice.json")
        self.assertEqual(rows["3040_Betty.json"]["id"], "json:3040_Betty.json")
        self.assertEqual(rows["3040_Alice.json"]["characterNumber"], 3040)

    def test_template_and_mixed_case_json_are_visible_while_invalid_json_is_reported(self):
        self.put("0_template.json", {})
        self.put("nobody.JSON", {})
        self.put("array.json", [])
        (self.slaves / "broken.json").write_text("{", encoding="utf-8")
        (self.slaves / "backup.json.bak").write_text("{}", encoding="utf-8")
        result = inventory.build(self.root)
        rows = {row["json"].split("/")[-1]: row for row in result["characters"]}
        self.assertEqual(set(rows), {"0_template.json", "nobody.JSON"})
        self.assertEqual(rows["nobody.JSON"]["name"], "nobody")
        self.assertEqual({error["json"] for error in result["errors"]}, {"array.json", "broken.json"})
        self.assertEqual(result["excluded"], [])


if __name__ == "__main__":
    unittest.main()
