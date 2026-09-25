#!/usr/bin/env python3
"""Import only the approved FIX6 ZIP. Never execute its installer or game code."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import stat
import sys
import zipfile

NAME = "JO9_UI_v1_9_14_AllInOne_R2_FIX6"
SHA256 = "254dc8c5cce2c9f5442f34b6de0cdbb029893eb544c76635d76b8b2e2fc0bc82"
SIZE = 9073868
ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "releases" / (NAME + ".zip")
DEST = ROOT / "packages" / NAME
FONT_EXT = {".ttf", ".otf", ".ttc", ".woff", ".woff2", ".fon", ".fnt", ".fnl"}
LOCATIONS = ["sjm_UI_UIadds", "main_screen", "slave_stat", "city_screen", "#food_base"]

def digest(data):
    return hashlib.sha256(data).hexdigest()

def require(condition, message):
    if not condition:
        raise ValueError(message)

def safe_destination(path):
    require(not path.is_symlink(), "Symlink target: " + str(path))
    require(path.resolve().is_relative_to(ROOT.resolve()), "Path escapes repository")
    for parent in path.parents:
        if parent == ROOT:
            break
        require(not parent.is_symlink(), "Symlink parent: " + str(parent))

def main():
    safe_destination(ARCHIVE)
    require(ARCHIVE.is_file(), "Upload the original FIX6 ZIP into releases/ first.")
    raw = ARCHIVE.read_bytes()
    require(len(raw) == SIZE and digest(raw) == SHA256, "Unapproved ZIP bytes; import stopped.")
    with zipfile.ZipFile(ARCHIVE) as archive:
        require(archive.testzip() is None, "ZIP CRC failure")
        data = {}
        seen = set()
        for entry in archive.infolist():
            name = entry.filename
            path = PurePosixPath(name)
            require(not path.is_absolute() and ".." not in path.parts and
                    "\\" not in name and ":" not in name, "Unsafe ZIP path")
            require(not stat.S_ISLNK(entry.external_attr >> 16), "ZIP symlink")
            if entry.is_dir():
                continue
            require(path.suffix.lower() not in FONT_EXT, "Font binary excluded")
            require(name.casefold() not in seen, "Duplicate ZIP path")
            seen.add(name.casefold())
            data[name] = archive.read(entry)
        require(len(data) == 128, "Unexpected package file count")
    manifest = json.loads(data["manifest.json"])
    require(len(manifest["Files"]) == 117, "Unexpected install count")
    require(len(manifest["Payload"]) == 119, "Unexpected integrity count")
    for item in manifest["Payload"]:
        require(digest(data[item["Rel"]]) == item["Hash"], "Payload hash mismatch: " + item["Rel"])
    for item in manifest["Files"]:
        require(digest(data[item["Source"]]) == item["After"], "Install hash mismatch: " + item["Source"])
    require([x["Name"] for x in json.loads(data["qsp-patches.json"])] == LOCATIONS,
            "Unexpected QSP locations")
    expected = {name: digest(value) for name, value in data.items()}
    safe_destination(DEST)
    if DEST.exists():
        for old in DEST.rglob("*"):
            safe_destination(old)
            if old.is_file():
                key = old.relative_to(DEST).as_posix()
                require(key in expected and digest(old.read_bytes()) == expected[key],
                        "Existing source differs; not overwriting: " + key)
    for name in data:
        safe_destination(DEST / name)
    for name, value in data.items():
        target = DEST / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(value)
    require(all(digest((DEST / name).read_bytes()) == value for name, value in expected.items()),
            "Extracted-file verification failed")
    report = {
        "baseline": NAME, "archive": ARCHIVE.relative_to(ROOT).as_posix(),
        "archive_bytes": len(raw), "archive_sha256": SHA256,
        "package_files": 128, "png_files": 115,
        "manifest_files_verified": 117, "manifest_payload_verified": 119,
        "qsp_locations": LOCATIONS, "package_bytes_modified": False,
        "extraction_and_hash_check": "passed",
        "windows_install_restore_test": "not_run",
        "game_rendering_test": "not_run",
        "note": "This record proves local import; Git commit/push status must be checked separately.",
        "files": [{"path": name, "bytes": len(data[name]), "sha256": expected[name]}
                  for name in sorted(data)]
    }
    target = ROOT / "docs" / "FIX6_REPOSITORY_IMPORT.json"
    safe_destination(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("FIX6: imported and hash-verified 128 files; installer and game were not run.")

if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        print("Import stopped: " + str(exc), file=sys.stderr)
        sys.exit(1)
