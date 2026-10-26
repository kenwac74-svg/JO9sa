"""Create and verify only the nine final saves and Korean guide; no runtime edits."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import zipfile

NAME = "JO9_TEST_BANKRUPTCY_UI_20261025_R2"
EXPECTED_SOURCE = "256293ff14b41ac19efd1bfb412f21066b227f86e1b61ea0e523820a86ebcb3a"
GUIDE = "사용안내.txt"


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


parser = argparse.ArgumentParser()
parser.add_argument("--source", type=Path, required=True)
parser.add_argument("--manifest", type=Path, required=True)
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--report", type=Path, required=True)
parser.add_argument("--guide-sha256", required=True)
args = parser.parse_args()
source = args.source.resolve(strict=True)
expected_root = Path("G:/Codex/tmp/bankruptcy-ui-saves-20261025-r2").resolve(strict=True)
assert source == (expected_root / "pack").resolve(strict=True), "Unexpected save staging directory"
output = args.output.resolve()
report = args.report.resolve()
assert output.parent == expected_root / "package", "Archive must remain in the named task's package directory"
assert report.parent == output.parent, "Package report must remain beside its temporary archive"
assert output.name == NAME + ".zip", "Unexpected archive name"
assert not output.exists(), "Refuse to overwrite an existing archive"
assert not report.exists(), "Refuse to overwrite an existing package report"
manifest = json.loads(args.manifest.read_text(encoding="utf-8-sig"))
assert manifest["sourceHash"] == EXPECTED_SOURCE, "Manifest refers to another WORK version"
assert manifest["count"] == 9 and len(manifest["files"]) == 9, "Expected exactly nine native-created saves"
expected = {}
for row in manifest["files"]:
    name = row["file"]
    assert re.fullmatch(r"[0-9]{2}_[a-z0-9-]+\.sav", name), "Save name must be a simple final filename"
    assert name not in expected, "Duplicate final filename"
    path = source / name
    assert path.is_file() and not path.is_symlink(), "Only regular staged files can be packaged"
    assert path.stat().st_size == row["bytes"], "Staged save size changed"
    assert digest(path) == row["sha256"], "Staged save hash changed"
    expected[name] = row["sha256"]
guide = source / GUIDE
assert guide.is_file() and not guide.is_symlink(), "Guide must be a regular staged file"
assert digest(guide) == args.guide_sha256, "Guide changed during packaging"
expected[GUIDE] = args.guide_sha256
assert {item.name for item in source.iterdir()} == set(expected), "Staging contains unapproved files or subdirectories"

output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for name in sorted(expected):
        archive.write(source / name, NAME + "/" + name)

members = []
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None, "Archive integrity test failed"
    assert len(archive.namelist()) == len(expected), "Unexpected archive member count"
    assert set(archive.namelist()) == {NAME + "/" + name for name in expected}, "Archive member list differs"
    for name, expected_hash in sorted(expected.items()):
        member = NAME + "/" + name
        value = hashlib.sha256()
        with archive.open(member) as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b""):
                value.update(block)
        assert value.hexdigest() == expected_hash, "Archived member hash differs: " + name
        members.append({"member": member, "sha256": expected_hash, "bytes": archive.getinfo(member).file_size})

result = {
    "status": "PASS",
    "sourceHash": EXPECTED_SOURCE,
    "temporaryArchive": str(output),
    "sha256": digest(output),
    "bytes": output.stat().st_size,
    "saveFilesVerified": 9,
    "guideVerified": True,
    "archiveIntegrity": True,
    "members": members,
}
report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"status": result["status"], "files": len(members), "bytes": result["bytes"], "sha256": result["sha256"]}))
