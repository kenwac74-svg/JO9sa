"""통합 작업 기록: 이 도구로 한 일을 하나의 로그 파일에 일자·시각과 함께 계속 이어 쓴다.

파일 (도구 폴더의 '작업기록' 아래)
  통합작업기록.jsonl      한 줄에 작업 한 건. AI/프로그램이 읽는 기록.
  통합작업기록.md         같은 내용을 날짜별로 풀어 쓴 사람용 기록. 이 파일 하나만 건네도 된다.
  캐릭터별_맞춤수치.json   캐릭터 ID별·슬롯별 최신 크기 맞춤 수치(같은 캐릭터의 다른 옷을 한꺼번에 맞출 때 사용).
기록 실패는 작업을 막지 않는다. 마지막 오류는 ToolLog.last_error 에 남는다.
"""
import datetime
import hashlib
import json
import os
import threading
import uuid

LOG_DIR_NAME = "작업기록"
JSONL_NAME = "통합작업기록.jsonl"
MD_NAME = "통합작업기록.md"
ALIGN_NAME = "캐릭터별_맞춤수치.json"
SETTINGS_NAME = "설정.json"
MAX_TEXT = 120


def now_text():
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def file_sha256(path):
    try:
        digest = hashlib.sha256()
        with open(path, "rb") as source:
            for chunk in iter(lambda: source.read(1 << 20), b""):
                digest.update(chunk)
        return digest.hexdigest()
    except OSError:
        return None


def to_local(ts):
    """'...Z' 처럼 UTC 로 적힌 시각을 이 컴퓨터의 현지 시각(오프셋 포함)으로 바꾼다. 못 바꾸면 그대로 둔다."""
    try:
        text = str(ts)
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        return datetime.datetime.fromisoformat(text).astimezone().isoformat(timespec="seconds")
    except (TypeError, ValueError):
        return ts


def short_value(value):
    """JSON 값 변경 기록용 요약. 긴 문장은 앞부분과 길이만 남긴다."""
    if isinstance(value, str) and len(value) > MAX_TEXT:
        return value[:MAX_TEXT] + "…(%d자)" % len(value)
    return value


def diff_fields(before, after):
    """두 JSON dict 의 달라진 항목을 {필드: [이전, 이후]} 로 돌려준다."""
    before, after = before or {}, after or {}
    changed = {}
    for key in sorted(set(before) | set(after)):
        if before.get(key) != after.get(key):
            changed[key] = [short_value(before.get(key)), short_value(after.get(key))]
    return changed


def describe_files(paths, game_root=None):
    """파일 경로 목록 -> [{path, bytes, sha256, exists}]. 지워진 파일은 exists=False."""
    out = []
    for path in paths:
        shown = path
        if game_root:
            try:
                shown = os.path.relpath(path, game_root).replace("\\", "/")
            except ValueError:
                shown = path
        if os.path.isfile(path):
            out.append({"path": shown, "bytes": os.path.getsize(path), "sha256": file_sha256(path), "exists": True})
        else:
            out.append({"path": shown, "exists": False})
    return out


class ToolLog:
    def __init__(self, tool_folder):
        self.dir = os.path.join(tool_folder, LOG_DIR_NAME)
        self.jsonl = os.path.join(self.dir, JSONL_NAME)
        self.md = os.path.join(self.dir, MD_NAME)
        self.align_file = os.path.join(self.dir, ALIGN_NAME)
        self.settings_file = os.path.join(self.dir, SETTINGS_NAME)
        self.session = uuid.uuid4().hex[:8]
        self.seq = 0
        self.last_error = ""
        self.game_root = ""
        self._lock = threading.Lock()
        self._last_day = None
        try:
            os.makedirs(self.dir, exist_ok=True)
            self._last_day = self._read_last_day()
        except OSError as exc:
            self.last_error = str(exc)

    # ------------------------------------------------------------------ 기록
    def event(self, action, **fields):
        """작업 한 건을 기록하고 그 dict 를 돌려준다. 실패해도 예외를 내지 않는다."""
        with self._lock:
            self.seq += 1
            record = {"ts": now_text(), "session": self.session, "seq": self.seq, "action": action}
            if self.game_root:
                record["game"] = self.game_root
            record.update({k: v for k, v in fields.items() if v is not None})
            try:
                with open(self.jsonl, "a", encoding="utf-8") as stream:
                    stream.write(json.dumps(record, ensure_ascii=False) + "\n")
                self._append_md(record)
                self.last_error = ""
            except Exception as exc:  # 기록 실패가 작업을 막으면 안 된다
                self.last_error = str(exc)
            return record

    def _read_last_day(self):
        try:
            with open(self.md, "r", encoding="utf-8") as stream:
                lines = [line for line in stream.read().splitlines() if line.startswith("## ")]
            return lines[-1][3:13] if lines else None
        except OSError:
            return None

    def _append_md(self, record):
        day, clock = record["ts"][:10], record["ts"][11:19]
        with open(self.md, "a", encoding="utf-8") as stream:
            if os.path.getsize(self.md) == 0 if os.path.exists(self.md) else True:
                stream.write("# JO9 캐릭터 도구 통합 작업 기록\n\n"
                             "이 파일은 도구가 자동으로 이어 씁니다. 같은 내용이 통합작업기록.jsonl 에 한 줄씩 있습니다.\n"
                             "캐릭터별 최신 맞춤 수치는 캐릭터별_맞춤수치.json 입니다.\n\n")
            if day != self._last_day:
                stream.write("\n## %s\n\n" % day)
                self._last_day = day
            stream.write("- %s [%s] %s\n" % (clock, record["action"], self._summary(record)))

    @staticmethod
    def _summary(record):
        parts = []
        who = []
        if record.get("id") is not None:
            who.append("ID %s" % record["id"])
        if record.get("name"):
            who.append(str(record["name"]))
        if who:
            parts.append(" ".join(who))
        if record.get("slot"):
            parts.append("슬롯 " + str(record["slot"]))
        if record.get("source"):
            parts.append("원본 " + str(record["source"]))
        if record.get("transform"):
            t = record["transform"]
            parts.append("배율 %s X %s Y %s" % (t.get("s"), t.get("x"), t.get("y")))
        if record.get("method"):
            parts.append("방식 " + str(record["method"]))
        if record.get("copy_to"):
            parts.append("복사 대상 " + ", ".join(str(x) for x in record["copy_to"]))
        if record.get("files"):
            parts.append("파일 %d개: %s" % (len(record["files"]), ", ".join(
                (f["path"] if isinstance(f, dict) else str(f)) for f in record["files"][:6])
                + ("…" if len(record["files"]) > 6 else "")))
        if record.get("json_changes"):
            parts.append("JSON 변경 " + ", ".join(sorted(record["json_changes"])[:10]))
        if record.get("shared_with"):
            parts.append("이미지 공유 " + ", ".join(str(x) for x in record["shared_with"]))
        if record.get("warnings"):
            parts.append("경고 " + " / ".join(str(x) for x in record["warnings"][:3]))
        if record.get("error"):
            parts.append("오류 " + str(record["error"]))
        if record.get("note"):
            parts.append(str(record["note"]))
        return " · ".join(parts) if parts else "(내용 없음)"

    # ------------------------------------------------------ 캐릭터별 맞춤 수치
    def read_alignments(self):
        try:
            with open(self.align_file, "r", encoding="utf-8") as stream:
                return json.load(stream)
        except (OSError, ValueError):
            return {}

    def remember_alignment(self, char_id, name, slot, transform, rules, source=None, output=None, source_size=None):
        """캐릭터 ID·슬롯별 최신 크기 맞춤 수치를 저장한다."""
        try:
            data = self.read_alignments()
            entry = data.setdefault(str(char_id), {"name": name or "", "slots": {}})
            if name:
                entry["name"] = name
            entry["slots"][slot] = {"ts": now_text(), "transform": transform, "rules": rules,
                                    "source": source, "source_size": source_size, "output": output}
            temporary = self.align_file + ".tmp"
            with open(temporary, "w", encoding="utf-8") as stream:
                json.dump(data, stream, ensure_ascii=False, indent=2)
            os.replace(temporary, self.align_file)
        except Exception as exc:
            self.last_error = str(exc)

    def alignment_for(self, char_id, slot=None):
        """저장된 수치를 돌려준다. slot 이 없거나 없으면 가장 최근 것."""
        entry = self.read_alignments().get(str(char_id))
        if not entry or not entry.get("slots"):
            return None
        slots = entry["slots"]
        if slot and slot in slots:
            return slots[slot]
        return max(slots.values(), key=lambda item: item.get("ts", ""))

    # ------------------------------------------------------------------ 설정
    def read_settings(self):
        try:
            with open(self.settings_file, "r", encoding="utf-8") as stream:
                return json.load(stream)
        except (OSError, ValueError):
            return {}

    def write_settings(self, data):
        try:
            with open(self.settings_file, "w", encoding="utf-8") as stream:
                json.dump(data, stream, ensure_ascii=False, indent=2)
        except OSError as exc:
            self.last_error = str(exc)

    # ------------------------------------------------- 기존 규격 통일기 기록 가져오기
    def import_legacy(self, project_json=None, manifest_json=None, label="규격 통일기"):
        """기존 jo9_project.json / manifest.json 을 통합 로그로 한 번 가져온다. 가져온 줄 수를 돌려준다."""
        count = 0
        if project_json:
            with open(project_json, "r", encoding="utf-8") as stream:
                project = json.load(stream)
            rules = project.get("rules")
            for item in reversed(project.get("history", [])):
                record = {"ts": to_local(item.get("ts", "")), "session": "legacy", "seq": 0,
                          "action": "legacy:" + str(item.get("action")), "name": None,
                          "source": item.get("name"), "source_key": item.get("key"),
                          "note": "가져온 기록(%s)" % label, "legacy_rules": rules}
                self._write_raw(record)
                count += 1
        if manifest_json:
            with open(manifest_json, "r", encoding="utf-8") as stream:
                manifest = json.load(stream)
            for item in manifest.get("items", []):
                record = {"ts": to_local(manifest.get("generated_at", "")), "session": "legacy", "seq": 0,
                          "action": "legacy:manifest", "source": item.get("source"),
                          "output": item.get("output"), "transform": item.get("transform"),
                          "approved": item.get("approved"), "note": "가져온 기록(%s)" % label}
                self._write_raw(record)
                count += 1
        return count

    def _write_raw(self, record):
        with self._lock:
            with open(self.jsonl, "a", encoding="utf-8") as stream:
                stream.write(json.dumps({k: v for k, v in record.items() if v is not None}, ensure_ascii=False) + "\n")
            try:
                self._append_md_legacy(record)
            except OSError:
                pass

    def _append_md_legacy(self, record):
        ts = record.get("ts") or ""
        day, clock = ts[:10], ts[11:19]
        with open(self.md, "a", encoding="utf-8") as stream:
            if day and day != self._last_day:
                stream.write("\n## %s (가져온 기록)\n\n" % day)
                self._last_day = day
            stream.write("- %s [%s] %s\n" % (clock, record.get("action"), self._summary(record)))
