"""Build a read-only, character-level image inventory for the WORK catalog."""
from __future__ import annotations

import argparse
import collections
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re

DEFAULT_GAME = Path("G:/somi/Jack O Nine Tails v2.4_work/game")
ROLE_FIELDS = {
    "maid": ("fullmade", "indpack_maid"),
    "secretary": ("fullsecretary", "indpack_secr"),
    "domina": ("fullmistress", "indpack_dom"),
}
BASE_FIELDS = ("fullimage", "indpack_title", "indpack_naked")
# Event-only images loaded directly by QSP, independently of the naked/base JSON.
EVENT_IMAGE_ASSETS = {3002: ("girls/full/Luminous.png",)}
PORTRAIT_FIELDS = ("seed_ava_clear", "seed_ava_gray", "seed_ava")
LEGACY_FOLDERS = ("girls/scene/", "girls/sex/", "girls/torture/")
IMAGE_PREFIXES = ("girls/", "characters/", "content/pic/")
NUMERIC_NAME = re.compile(r"^0*(\d+)(?:_|\.|$)")
NUMERIC_DIRS = {"full", "face", "sex_scenes"}
# JO9 MOD START GIRLS_2071_SPLIT_2340_20261105
# Old-save addresses remain physical files, outside active character image sets.
COMPATIBILITY_ASSETS = {
    "girls/full/2071_blond_short_milf.png": (2340, "girls/full/2340_blond_short_milf.png"),
    "girls/face/2071_blond_short_milf.png": (2340, "girls/face/2340_blond_short_milf.png"),
    "girls/face/2071_blond_short_milf_gray.png": (2340, "girls/face/2340_blond_short_milf_gray.png"),
    "girls/face/2071_blond_short_milf_sepia.png": (2340, "girls/face/2340_blond_short_milf_sepia.png"),
    "girls/full/2071_blue_short_milf.png": (2324, "girls/full/2324_blue_short_milf.png"),
    "girls/full/cloth/2071_blue_short_milf.png": (2071, "girls/full/cloth/2071_brown_long_milf.png"),
}
SPLIT_NOTES = {
    2071: "갈색 장발 유지 · 금발은 2340, 하늘색은 기존 2324로 구분합니다. blue_short 이름의 옛 하녀 파일은 실제로 갈색 인물이며 호환용으로만 보존합니다.",
    2324: "하늘색 단발 · 이전 추가팩에서 2071→2324로 이미 분리 등록된 인물입니다. 전신·초상 3종을 유지하며 전용 복장이 없으면 기본 전신을 표시합니다.",
    2340: "금발 단발 · 원본 2071의 JSON과 전신·초상 3종을 새 번호로 독립 등록했습니다. 전용 복장이 없으면 기본 전신을 표시합니다.",
}
# JO9 MOD END GIRLS_2071_SPLIT_2340_20261105


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_reference(value):
    """Return a PNG request relative to content/pic, preserving spelling."""
    if not isinstance(value, str):
        return None
    value = re.sub(r"/+", "/", value.strip().replace("\\", "/"))
    if not value.lower().startswith(IMAGE_PREFIXES):
        return None
    if value.lower().startswith("content/pic/"):
        value = value[len("content/pic/"):]
    if not value or ".." in PurePosixPath(value).parts:
        return None
    if not value.lower().endswith(".png"):
        value += ".png"
    return value


def canonical_external(pic_root: Path, requested: str, parent_cache: dict):
    """Look up only the requested folder, avoiding a second whole-tree scan."""
    parts = PurePosixPath(requested).parts
    actual = pic_root
    names = []
    for part in parts:
        key = str(actual).lower()
        if key not in parent_cache:
            try:
                parent_cache[key] = {item.name.lower(): item.name for item in actual.iterdir()}
            except OSError:
                parent_cache[key] = {}
        matched = parent_cache[key].get(part.lower())
        if matched is None:
            return None
        names.append(matched)
        actual = actual / matched
    return "/".join(names) if actual.is_file() else None


def path_info(path, known_files, source):
    return {
        "path": path,
        "source": source,
        "exists": bool(path and path.lower() in known_files),
    }


def effective_roles(refs, known_files):
    """Describe fresh JSON definitions, without claiming to read actor save caches."""
    base_field = next((key for key in ("indpack_title", "fullimage") if refs.get(key)), None)
    base = path_info(refs.get(base_field) if base_field else None, known_files, base_field)
    safe_base_field = next((key for key in ("indpack_title", "fullimage", "indpack_naked")
                            if refs.get(key, "").lower() in known_files), None)
    safe_base = path_info(refs.get(safe_base_field) if safe_base_field else None,
                          known_files, safe_base_field)
    results = {}
    for role, (legacy, pack) in ROLE_FIELDS.items():
        normal_field = pack if refs.get(pack) else legacy if refs.get(legacy) else base_field
        normal_path = refs.get(normal_field) if normal_field else None
        normal = path_info(normal_path, known_files, normal_field)
        variants = {}
        for suffix in ("horny", "rebel"):
            key = pack + "_" + suffix
            field = key if refs.get(pack) and refs.get(key) else normal_field
            variants[suffix] = path_info(refs.get(field) if field else None, known_files, field)
        explicit = [refs.get(legacy), refs.get(pack)]
        distinct_art = any(path and path.lower() in known_files
                           and path.lower() not in {
                               refs.get("fullimage", "").lower(),
                               refs.get("indpack_title", "").lower(),
                           }
                           for path in explicit)
        results[role] = {
            "legacyField": legacy,
            "packField": pack,
            "menuAvailable": bool(refs.get(legacy)),
            "normal": normal,
            **variants,
            "safeBase": safe_base,
            "needsArtwork": not distinct_art,
            "hasExplicitArtwork": any(path and path.lower() in known_files for path in explicit),
            "displayIssue": not normal["exists"],
            "menuIssue": not refs.get(legacy) and bool(refs.get(pack))
                         and refs[pack].lower() in known_files,
        }
    return base, results


def build(game: Path):
    pic_root = game / "content/pic"
    girls_root = pic_root / "girls"
    json_root = game / "json/slaves"
    qsp = game / "jack.qsp"
    before_sha = sha256_file(qsp)
    files = {}
    directories = {}
    assets_by_id = collections.defaultdict(set)
    named_scene_assets = collections.defaultdict(set)
    ignored_links = []

    for folder, subdirs, filenames in os.walk(girls_root, followlinks=False):
        current = Path(folder)
        allowed = []
        for child in subdirs:
            candidate = current / child
            if candidate.is_symlink() or getattr(candidate, "is_junction", lambda: False)():
                ignored_links.append(candidate.relative_to(pic_root).as_posix())
            else:
                allowed.append(child)
        subdirs[:] = allowed
        rel_dir = current.relative_to(pic_root).as_posix()
        directories[rel_dir] = {"path": rel_dir, "files": 0, "directFiles": 0}
        for filename in filenames:
            file = current / filename
            if file.is_symlink() or file.suffix.lower() != ".png":
                continue
            relative = file.relative_to(pic_root).as_posix()
            files[relative.lower()] = relative
            directories[rel_dir]["directFiles"] += 1
            parts = PurePosixPath(relative).parts
            if len(parts) >= 4 and parts[1].lower() == "scene":
                named_scene_assets["/".join(parts[:3]).lower()].add(relative)
            if relative.lower() in COMPATIBILITY_ASSETS:
                continue
            match = NUMERIC_NAME.match(file.stem)
            if match:
                assets_by_id[int(match.group(1))].add(relative)
            if len(parts) >= 4 and parts[1].lower() in NUMERIC_DIRS and parts[2].isdecimal():
                assets_by_id[int(parts[2])].add(relative)

    for path in files.values():
        parent = PurePosixPath(path).parent
        while parent.as_posix() in directories:
            directories[parent.as_posix()]["files"] += 1
            parent = parent.parent

    index_path = game / "json/slave_index.json"
    index = json.loads(index_path.read_text(encoding="utf-8-sig"))
    records = []
    errors = []
    excluded = []
    external_cache = {}
    seen_ids = {}
    for file in sorted(json_root.glob("*.json"), key=lambda value: value.name.lower()):
        if file.stem == "0_template":
            excluded.append(file.name)
            continue
        try:
            data = json.loads(file.read_text(encoding="utf-8-sig"))
            if not isinstance(data, dict):
                raise ValueError("Character JSON must contain an object.")
            match = re.match(r"^(\d+)(?:_|$)", file.stem)
            if not match:
                raise ValueError("Character filename has no numeric ID.")
            character_id = int(match.group(1))
            if character_id in seen_ids:
                raise ValueError("Duplicate numeric ID also defined in " + seen_ids[character_id])
            seen_ids[character_id] = file.name
        except (OSError, ValueError) as error:
            errors.append({"json": file.name, "error": str(error)})
            continue
        refs = {}
        for field, value in data.items():
            requested = image_reference(value)
            if requested is None:
                continue
            actual = files.get(requested.lower())
            if actual is None and not requested.lower().startswith("girls/"):
                actual = canonical_external(pic_root, requested, external_cache)
                if actual:
                    files[actual.lower()] = actual
            refs[field] = actual or requested
        groups = [
            age for age in ("loli", "young", "milf")
            if index.get(age + "_first", -1) <= character_id <= index.get(age + "_last", -1)
        ]
        scene_folders = {
            "/".join(PurePosixPath(path).parts[:3]).lower()
            for path in refs.values()
            if path.lower().startswith("girls/scene/")
            and len(PurePosixPath(path).parts) >= 4
        }
        scene_assets = set()
        for folder in scene_folders:
            scene_assets.update(named_scene_assets.get(folder, ()))
        existing_references = {
            files[path.lower()] for path in refs.values() if path.lower() in files
        }
        character_assets = assets_by_id.get(character_id, set()) | existing_references | scene_assets
        character_assets.update(path for path in EVENT_IMAGE_ASSETS.get(character_id, ())
                                if path.lower() in files)
        record = {
            "id": character_id,
            "name": data.get("seed_name") or file.stem.split("_", 1)[-1]
                    if "_" in file.stem else "ID " + str(character_id),
            "json": file.relative_to(game).as_posix(),
            "hasFixedName": isinstance(data.get("seed_name"), str)
                            and bool(data["seed_name"].strip()),
            "jsonSha256": sha256_file(file),
            "random": bool(groups),
            "randomGroups": groups,
            "refs": refs,
            "assets": sorted(character_assets, key=str.lower),
            "namedSceneAssets": sorted(scene_assets, key=str.lower),
            "legacyFields": sorted(
                field for field, path in refs.items()
                if path.lower().startswith(LEGACY_FOLDERS)
            ),
        }
        if character_id in SPLIT_NOTES:
            record["catalogNote"] = SPLIT_NOTES[character_id]
            record["compatibilityAssets"] = [
                {"path": old, "canonicalPath": canonical}
                for old, (owner_id, canonical) in COMPATIBILITY_ASSETS.items()
                if owner_id == character_id and old in files
            ]
        # A seed_name should always take precedence over a generic numbered label.
        if isinstance(data.get("seed_name"), str) and data["seed_name"].strip():
            record["name"] = data["seed_name"]
        records.append(record)

    known_files = set(files)
    for record in records:
        record["missingRefs"] = sorted(
            field for field, path in record["refs"].items() if path.lower() not in known_files
        )
        base, roles = effective_roles(record["refs"], known_files)
        record["effectiveBase"] = base
        record["effectiveRoles"] = roles
        record["portraitComplete"] = all(
            record["refs"].get(field, "").lower() in known_files for field in PORTRAIT_FIELDS
        )

    unknown = [
        {"id": character_id, "paths": sorted(paths, key=str.lower)}
        for character_id, paths in sorted(assets_by_id.items())
        if character_id not in seen_ids
    ]
    after_sha = sha256_file(qsp)
    if before_sha != after_sha:
        raise RuntimeError("WORK QSP changed during inventory; rerun the scanner.")
    return {
        "schema": 1,
        "gameRoot": str(game.resolve()),
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "qspSha": before_sha,
        "indexSha256": sha256_file(index_path),
        "characters": sorted(records, key=lambda value: value["id"]),
        "files": sorted(files.values(), key=str.lower),
        "directories": sorted(directories.values(), key=lambda value: value["path"].lower()),
        "unknownGroups": unknown,
        "errors": errors,
        "excluded": excluded,
        "ignoredLinks": ignored_links,
        "compatibilityAliases": [
            {"path": old, "canonicalPath": canonical, "ownerId": owner_id}
            for old, (owner_id, canonical) in COMPATIBILITY_ASSETS.items() if old in files
        ],
        "notes": [
            "Read-only snapshot of WORK files and JSON definitions.",
            "Effective metadata describes current JSON lookup priority, not saved actor image caches.",
            "Legacy fields record old character-scene declarations; file absence alone is not a live scene failure.",
            "WORK dual-registration fallback applied 2026-11-05. Missing outfit artwork falls back to an existing base image; safeBase is a JSON inventory hint, not a saved-actor simulation.",
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--game", type=Path, default=DEFAULT_GAME)
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent / "manifest.json")
    args = parser.parse_args()
    manifest = build(args.game)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n",
                        encoding="utf-8")
    summary = {
        "characters": len(manifest["characters"]),
        "files": len(manifest["files"]),
        "directories": len(manifest["directories"]),
        "unknownGroups": len(manifest["unknownGroups"]),
        "errors": manifest["errors"],
        "bytes": args.out.stat().st_size,
        "manifest": str(args.out),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
