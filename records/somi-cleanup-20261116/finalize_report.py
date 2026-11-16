"""Read-only final audit; write only final-verification.json and REPORT_KO.md here.

Run after both archive workers have completed. This script does not hash archive
payloads again and never changes G sources, K archives, journals or partial files.
"""
from __future__ import annotations

import datetime as dt
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import sys

HERE = Path(__file__).resolve().parent
SOURCE = Path("G:/somi")
TRASH = Path("K:/doing/JO9_trash")
BATCHES = (
    ("phase1", TRASH / "2026-11-16_043910_somi_cleanup", 34, 33998824673),
    ("phase2", TRASH / "2026-11-16_044758_somi_cleanup", 45327, 17161914584),
)
INITIAL_FREE = 118139269120
UNAPPROVED_FILES = 96
UNAPPROVED_BYTES = 447455493
OLD_ARCHIVES_BYTES = 439852399
REPARSE = 0x400
SHA256 = re.compile(r"[0-9a-fA-F]{64}\Z")
CHECKED_DIRECTORIES: set[str] = set()


def require(ok: bool, message: str) -> None:
    if not ok:
        raise RuntimeError(message)


def read_json(path: Path):
    with path.open(encoding="utf-8-sig") as stream:
        return json.load(stream)


def relative_name(value) -> str:
    require(isinstance(value, str) and bool(value), "Missing relative path")
    require("\\" not in value and ":" not in value, f"Invalid relative path: {value!r}")
    parts = value.split("/")
    require(all(x not in ("", ".", "..") for x in parts), f"Unsafe relative path: {value!r}")
    require(not PurePosixPath(value).is_absolute(), f"Absolute relative path: {value!r}")
    return value


def safe_stat(path: Path, boundary: Path):
    """Inspect existing components without following any reparse point."""
    require(path.is_absolute() and boundary.is_absolute(), "Absolute paths required")
    try:
        parts = path.relative_to(boundary).parts
    except ValueError as error:
        raise RuntimeError(f"Path outside boundary: {path}") from error
    cursor = boundary
    for component in (None, *parts):
        if component is not None:
            cursor = cursor / component
        key = str(cursor).casefold()
        if key in CHECKED_DIRECTORIES:
            continue
        try:
            info = os.lstat(cursor)
        except FileNotFoundError:
            return None
        require(not stat.S_ISLNK(info.st_mode) and not (getattr(info, "st_file_attributes", 0) & REPARSE),
                f"Reparse point encountered: {cursor}")
        if stat.S_ISDIR(info.st_mode):
            CHECKED_DIRECTORIES.add(key)
    return os.lstat(path)


def regular_file(path: Path, boundary: Path, expected_bytes=None):
    info = safe_stat(path, boundary)
    require(info is not None and stat.S_ISREG(info.st_mode), f"Required file missing: {path}")
    if expected_bytes is not None:
        require(info.st_size == expected_bytes, f"File size differs: {path}")
    return {"path": str(path), "bytes": info.st_size, "mtime_ns": info.st_mtime_ns}


def journal_records(path: Path, notices: list):
    """Allow only one malformed, non-newline-terminated final physical line."""
    with path.open("rb") as stream:
        line = stream.readline()
        number = 0
        while line:
            number += 1
            following = stream.readline()
            try:
                value = json.loads(line.decode("utf-8-sig" if number == 1 else "utf-8"))
            except (ValueError, UnicodeError) as error:
                if not following and not line.endswith(b"\n"):
                    notices.append({"path": str(path), "line": number,
                                    "warning": "Skipped one truncated final line; original journal unchanged",
                                    "rawBytes": len(line)})
                    break
                raise RuntimeError(f"Malformed journal line: {path}:{number}") from error
            require(isinstance(value, dict), f"Non-object journal line: {path}:{number}")
            yield value
            line = following


def audit_batch(label: str, batch: Path, expected_files: int, expected_bytes: int, notices: list):
    # Actual workers use move-plan.json. A plan.json is accepted only when it is
    # the sole plan, or its parsed contents exactly match move-plan.json.
    choices = [p for p in (batch / "move-plan.json", batch / "plan.json") if p.exists()]
    require(bool(choices), f"No plan in {batch}")
    plan = read_json(choices[0])
    for other in choices[1:]:
        require(read_json(other) == plan, f"Conflicting plan files in {batch}")
    require(Path(plan["archive"]) == batch and Path(plan["source"]) == SOURCE,
            f"Plan roots differ: {batch}")
    rows = plan["files"]
    require(isinstance(rows, list) and len(rows) == expected_files == plan["fileCount"],
            f"Plan file count differs: {batch}")
    require(sum(r["bytes"] for r in rows) == expected_bytes == plan["bytes"],
            f"Plan byte count differs: {batch}")
    by_name = {}
    names_lower = set()
    for row in rows:
        name = relative_name(row["relative"])
        require(name.casefold() not in names_lower, f"Duplicate plan path: {name}")
        require(isinstance(row["bytes"], int) and row["bytes"] >= 0, f"Invalid size: {name}")
        names_lower.add(name.casefold())
        by_name[name] = row

    status = read_json(batch / "status.json")
    require(status.get("status") == "complete", f"{label} is not complete: {status.get('status')}")
    for key, expected in (("movedFiles", expected_files), ("movedBytes", expected_bytes)):
        require(status.get(key) == expected, f"{label} status {key} differs")
    require(status.get("sourceFilesRemaining", 0) == 0, f"{label} reports sources remaining")
    for result_path in (batch / "result.json", HERE / ("result.json" if label == "phase1" else "phase2-result.json")):
        if result_path.exists():
            other = read_json(result_path)
            # The original worker may have written a temporary phase2 result
            # over HERE/result.json. Never accept it as a phase1 result.
            require(Path(other.get("archive", "")) == batch, f"Result archive differs: {result_path}")
            require(other.get("status") == "complete", f"Result is not complete: {result_path}")
            require(other.get("movedFiles") == expected_files and other.get("movedBytes") == expected_bytes,
                    f"Result totals differ: {result_path}")

    evidence = {name: {"verified": set(), "moved": set()} for name in by_name}
    partial_events = []
    counts = {}
    for log_path in (batch / "journal.jsonl", batch / "resume-journal.jsonl"):
        if not log_path.exists():
            require(log_path.name != "journal.jsonl", f"Original journal missing: {log_path}")
            continue
        count = 0
        for entry in journal_records(log_path, notices):
            count += 1
            name = relative_name(entry.get("relative"))
            require(name in by_name, f"Journal path outside plan: {name}")
            require(entry.get("bytes") == by_name[name]["bytes"], f"Journal byte count differs: {name}")
            event = entry.get("event")
            if event in ("verified", "moved"):
                digest = entry.get("sha256", "")
                require(isinstance(digest, str) and bool(SHA256.fullmatch(digest)), f"Missing SHA256 evidence: {name}")
                evidence[name][event].add(digest.lower())
            elif event == "interrupted-partial-retained":
                partial_events.append({"relative": name, "journal": str(log_path)})
            else:
                require(event == "begin", f"Unrecognized journal event {event!r}: {name}")
        counts[log_path.name] = count

    retained_partials = []
    for name, row in by_name.items():
        proof = evidence[name]
        require(len(proof["verified"]) == 1 and proof["verified"] == proof["moved"],
                f"Missing or conflicting verified/moved SHA256 evidence: {name}")
        require(safe_stat(SOURCE / name, SOURCE) is None, f"Source still exists: {name}")
        regular_file(batch / "files" / name, batch, row["bytes"])
    for entry in partial_events:
        destination = batch / "files" / entry["relative"]
        matching = []
        with os.scandir(destination.parent) as directory:
            for child in directory:
                if child.name.startswith(destination.name + ".jo9-partial"):
                    found = regular_file(Path(child.path), batch)
                    matching.append(found)
        action = "listed only; unchanged"
        if not matching:
            cleanup_path = HERE / "temporary-cleanup.json"
            require(cleanup_path.is_file(), f"Retained partial journal entry has no retained file: {entry['relative']}")
            expected = destination.with_name(destination.name + ".jo9-partial.interrupted")
            removed = read_json(cleanup_path).get("removedGeneratedPartials", [])
            require(any(Path(r["path"]) == expected and r["bytes"] >= 0 for r in removed),
                    f"No documented cleanup for generated partial: {entry['relative']}")
            require(safe_stat(expected, batch) is None, f"Documented partial is still present: {expected}")
            action = "generated partial removed after full-copy hash recheck; temporary-cleanup.json"
        retained_partials.append({**entry, "retainedFiles": matching, "action": action})
    return {"phase": label, "archive": str(batch), "status": "PASS", "files": expected_files,
            "bytes": expected_bytes, "sourceFilesRemaining": 0, "destinationSizesMatched": expected_files,
            "sha256EvidenceCoverage": expected_files, "payloadsRehashed": 0,
            "journalRecordCounts": counts, "retainedPartials": retained_partials}


def inventory_tree(root: Path):
    total_files = total_bytes = 0
    stack = [root]
    while stack:
        directory = stack.pop()
        require(safe_stat(directory, SOURCE) is not None, f"Preserved directory missing: {directory}")
        with os.scandir(directory) as entries:
            for entry in entries:
                info = entry.stat(follow_symlinks=False)
                require(not entry.is_symlink() and not (getattr(info, "st_file_attributes", 0) & REPARSE),
                        f"Unexpected link in preserved archive: {entry.path}")
                if stat.S_ISDIR(info.st_mode):
                    stack.append(Path(entry.path))
                elif stat.S_ISREG(info.st_mode):
                    total_files += 1
                    total_bytes += info.st_size
                else:
                    raise RuntimeError(f"Unexpected preserved file type: {entry.path}")
    return {"path": str(root), "files": total_files, "bytes": total_bytes}


def audit_protected():
    backups = read_json(HERE / "backups.json")
    unapproved = [r for r in backups["items"]
                  if r["status"] == "MOVE_CANDIDATE" and r["relative"].startswith("JO9sa/records/")]
    require(len(unapproved) == UNAPPROVED_FILES and sum(r["bytes"] for r in unapproved) == UNAPPROVED_BYTES,
            "Unapproved records inventory differs")
    for row in unapproved:
        regular_file(Path(row["path"]), SOURCE, row["bytes"])
    for row in backups["items"]:
        if row["status"] == "KEEP" or row.get("kind") == "dialogue-editor-history":
            regular_file(Path(row["path"]), SOURCE, row["bytes"])

    work = SOURCE / "Jack O Nine Tails v2.4_work/game"
    required = [work / "jack.qsp", work / "config.xml", work / "FastQSP.ini",
                work / "jack.qsp.bak_20261116_trycap",
                SOURCE / "JO9_2.4.2_Release_20261115/JO9_2.4.2_Kor_Full_20261115.zip",
                SOURCE / "JO9_2.4.2_Release_20261115/JO9_2.4.2_Kor_Full_20261115.zip.sha256",
                SOURCE / "JO9_2.4.2_Patch2_20261116_Cumulative/JO9_2.4.2_Patch2_20261116_Cumulative.zip",
                SOURCE / "JO9_2.4.2_Patch2_20261116_Cumulative/JO9_2.4.2_Patch2_20261116_Cumulative.zip.sha256"]
    protected = [regular_file(path, SOURCE) for path in required]
    required_directories = [work / "save", SOURCE / "JO9sa", SOURCE / "JO9O", SOURCE / "IMGMG",
                            SOURCE / "Codex_Archive_Stage_20261020"]
    for path in required_directories:
        info = safe_stat(path, SOURCE)
        require(info is not None and stat.S_ISDIR(info.st_mode), f"Protected directory missing: {path}")

    old_archives = [inventory_tree(SOURCE / "JO9_cleanup_history_20261020"),
                    inventory_tree(SOURCE / "JO9_unused_images")]
    for actual, expected in zip(old_archives, ((7, 40403913), (440, 399448486))):
        require((actual["files"], actual["bytes"]) == expected,
                f"Preserved old-archive inventory differs: {actual['path']}")
    require(sum(x["bytes"] for x in old_archives) == OLD_ARCHIVES_BYTES,
            "Preserved old-archive byte count differs")
    bridges = read_json(HERE / "archives-bridges.json")
    require(bridges["count"] == len(bridges["bridges"]) == 74, "Bridge inventory differs")
    def normalize_target(value):
        return value.removeprefix("\\\\?\\").removeprefix("\\??\\").replace("/", "\\").rstrip("\\").casefold()
    for bridge in bridges["bridges"]:
        path = Path(bridge["path"])
        info = os.lstat(path)
        require(bool(getattr(info, "st_file_attributes", 0) & REPARSE), f"Bridge is no longer a junction: {path}")
        require(normalize_target(os.readlink(path)) == normalize_target(bridge["target"]), f"Bridge target changed: {path}")
        require(path.exists(), f"Broken preserved bridge: {path}")
    return {"requiredFiles": protected, "requiredDirectories": [str(x) for x in required_directories],
            "unapprovedRecords": {"files": UNAPPROVED_FILES, "bytes": UNAPPROVED_BYTES, "status": "preserved"},
            "oldArchives": old_archives, "stageBridgesVerified": 74,
            "latestBackupAndDialogueHistoryFiles": "existence and recorded size checked; no payload rehash"}


def final_report(result):
    lines = (HERE / "REPORT_DRAFT_KO.md").read_text(encoding="utf-8-sig").splitlines()
    require(lines and "초안" in lines[0], "Draft title differs; update finalizer explicitly")
    lines[0] = lines[0].replace("초안", "최종", 1)
    first = [i for i, line in enumerate(lines) if line.startswith("1차는 **")]
    second = [i for i, line in enumerate(lines) if line.startswith("2차는 구 배포 사본")]
    require(len(first) == len(second) == 1, "Draft summary paragraphs differ")
    lines[first[0]] = (
        f"**1·2차 이동 완료: {result['totalFiles']:,}파일·{result['totalBytes']:,}바이트"
        f"({result['totalGiB']:.3f}GiB)**. 1차 34파일·33,998,824,673바이트, "
        "2차 45,327파일·17,161,914,584바이트다. 전체 원본 부재·K 목적지 크기·기존 SHA-256 "
        f"검증/이동 저널 증거를 대조했다. G 여유 공간은 {INITIAL_FREE:,}바이트에서 "
        f"{result['freeAfter']:,}바이트로 **{result['freeDelta']:,}바이트"
        f"({result['freeDeltaGiB']:.3f}GiB) 증가**했다(최종 실측; 동시 디스크 사용량의 영향 포함).")
    lines[second[0]] = ("2차는 구 배포 사본 3개와 저장소 밖 옛 백업 73개다. 중단 전 3,569파일의 "
                        "저널을 대조해 재사용했고 나머지 이동을 완료했다. 이미 검증된 대용량 파일은 "
                        "재해시하지 않았으며, 이번 최종 검사는 이동 저널의 SHA-256 증거와 파일 메타데이터를 확인했다.")
    approval = [i for i, line in enumerate(lines) if line.startswith("자동 승인 검토는")]
    require(len(approval) == 1, "Draft approval paragraph differs")
    partials = [item for batch in result["batches"] for item in batch["retainedPartials"]]
    partial_files = [f for item in partials for f in item["retainedFiles"]]
    cleaned = len(read_json(HERE / "temporary-cleanup.json").get("removedGeneratedPartials", [])) if (HERE / "temporary-cleanup.json").is_file() else 0
    extra = (f"최종 보호 확인: 비승인 records 96파일·447,455,493바이트, 기존 보관소 2개·439,852,399바이트, "
             f"최신 Full/Patch2·복구본·WORK QSP/세이브와 stage 연결 74개를 보존했다. "
             f"작업 중단으로 생긴 임시 조각 {cleaned}개는 완성본 해시를 다시 확인한 뒤 정리했으며, 남은 임시 조각은 {len(partial_files)}개다. "
             f"잘린 마지막 저널 행 예외 {len(result['journalNotices'])}건도 같은 파일에 명시했다.")
    cleanup = ("보관 권고: 최종 보고서·검증 JSON·두 배치 계획/원장·재현 스크립트를 남기고, "
               "재생성 가능한 중복 진단 JSON·시험 복사본은 검토 후 정리할 수 있다. K의 복구 파일·중단 조각, "
               "원그림·원고·세이브는 이 스크립트가 삭제하지 않는다.")
    lines[approval[0]:approval[0]] = [extra, "", cleanup, ""]
    report = "\n".join(lines) + "\n"
    require("[최종 결과 확인 후 기입]" not in report and "이동 진행 중" not in report, "Unresolved final placeholder")
    return report


def main():
    result = {"status": "FAIL", "checkedAt": dt.datetime.now().astimezone().isoformat(),
              "method": "read-only metadata and existing SHA256 journal evidence; zero payload rehash",
              "sourceMutations": False, "archiveMutations": False, "journalNotices": []}
    try:
        result["batches"] = [audit_batch(*spec, result["journalNotices"]) for spec in BATCHES]
        result["protected"] = audit_protected()
        result["totalFiles"] = sum(x["files"] for x in result["batches"])
        result["totalBytes"] = sum(x["bytes"] for x in result["batches"])
        result["totalGiB"] = result["totalBytes"] / 1024**3
        result["freeBefore"] = INITIAL_FREE
        result["freeAfter"] = shutil.disk_usage(SOURCE).free
        result["freeDelta"] = result["freeAfter"] - INITIAL_FREE
        result["freeDeltaGiB"] = result["freeDelta"] / 1024**3
        result["status"] = "PASS"
        report = final_report(result)
    except Exception as error:
        result["status"] = "FAIL"
        result["error"] = f"{type(error).__name__}: {error}"
        (HERE / "final-verification.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(result["error"], file=sys.stderr)
        return 1
    (HERE / "final-verification.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (HERE / "REPORT_KO.md").write_text(report, encoding="utf-8")
    print(json.dumps({k: result[k] for k in ("status", "totalFiles", "totalBytes", "freeDelta")}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
