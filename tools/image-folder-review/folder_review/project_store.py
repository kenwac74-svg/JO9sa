"""Atomic project snapshots and content-aware, non-destructive decisions."""

import copy
import csv
import hashlib
import io
import json
import os
import re
import threading
import time
import uuid
from pathlib import Path, PurePosixPath

from .catalog import is_link, stable_id

SIDES = ('original', 'comparison')


def trusted_root(project: dict, side: str) -> Path:
    root = Path(project[side + '_root'])
    if root.resolve(strict=True) != root or is_link(root):
        raise PermissionError('등록한 최상위 폴더의 연결 대상이 바뀌었습니다. 폴더 경로를 확인해 주세요.')
    return root


def asset_path(project: dict, file: dict) -> Path:
    root = trusted_root(project, file['side'])
    relative = PurePosixPath(file['relative_path'])
    if relative.is_absolute() or '..' in relative.parts or ':' in str(relative) or '\\' in str(relative):
        raise PermissionError('등록한 폴더 밖의 파일은 열 수 없습니다.')
    path = root
    for part in relative.parts:
        path = path / part
        if is_link(path):
            raise PermissionError('검사 이후 연결 파일로 바뀌었습니다. 폴더를 다시 검사해 주세요.')
    resolved = path.resolve(strict=True)
    if not resolved.is_relative_to(root) or not resolved.is_file():
        raise PermissionError('등록한 폴더 안의 파일이 아닙니다.')
    return resolved


def fingerprint(project: dict, file: dict) -> str:
    path = asset_path(project, file)
    before = path.stat()
    if (before.st_size, before.st_mtime_ns) != (file['size'], file['mtime_ns']):
        raise ValueError('검사 이후 파일이 바뀌었습니다. 폴더를 다시 검사해 주세요.')
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    after = path.stat()
    if (after.st_size, after.st_mtime_ns) != (before.st_size, before.st_mtime_ns):
        raise ValueError('파일을 읽는 중 내용이 바뀌었습니다. 다시 검사해 주세요.')
    return h.hexdigest()


def rows_of(project):
    return [r for g in project['groups'] for r in g['rows']]


def summarize(project):
    rows = rows_of(project)
    for group in project['groups']:
        choices = {r['decision'] for r in group['rows']}
        group['decision_summary'] = ('review' if any(r['review_required'] for r in group['rows']) else
                                     'unreviewed' if choices == {None} else
                                     next(iter(choices)) if len(choices) == 1 else 'mixed')
    project['stats'].update(groups=len(project['groups']), rows=len(rows),
                            reviewed=sum(r['decision'] is not None and not r['review_required'] for r in rows),
                            deferred=sum(r['decision'] == 'defer' for r in rows),
                            review_required=sum(r['review_required'] for r in rows),
                            unreviewed=sum(r['decision'] is None and not r['review_required'] for r in rows))


class ProjectStore:
    def __init__(self, data_dir: Path):
        self.data_dir = Path(data_dir).resolve()
        self.projects_dir = self.data_dir / 'projects'
        self.projects_dir.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()

    def _path(self, pid):
        if not re.fullmatch(r'[a-f0-9]{24}', pid):
            raise ValueError('프로젝트 ID가 올바르지 않습니다.')
        return self.projects_dir / (pid + '.json')

    def _read(self, pid):
        return json.loads(self._path(pid).read_text(encoding='utf-8'))

    def _write(self, p):
        path = self._path(p['id'])
        temp = path.with_suffix('.' + uuid.uuid4().hex + '.tmp')
        try:
            with temp.open('w', encoding='utf-8', newline='\n') as stream:
                json.dump(p, stream, ensure_ascii=False, separators=(',', ':'))
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temp, path)
        finally:
            if temp.exists():
                temp.unlink()

    def register(self, name: str, original: str, comparison: str) -> dict:
        roots = []
        for raw in (original, comparison):
            if not isinstance(raw, str) or not raw.strip():
                raise ValueError('원본 폴더와 비교 폴더를 모두 선택해 주세요.')
            try:
                root = Path(raw).expanduser().resolve(strict=True)
            except (OSError, RuntimeError) as e:
                raise ValueError('폴더를 찾을 수 없습니다: ' + raw) from e
            if not root.is_dir():
                raise ValueError('폴더 경로를 선택해 주세요: ' + raw)
            if self.data_dir.is_relative_to(root):
                raise ValueError('썸네일·선택 저장 폴더는 원본·비교 폴더 밖에 있어야 합니다.')
            roots.append(root)
        if roots[0] == roots[1]:
            raise ValueError('원본과 비교 폴더는 서로 다른 폴더를 선택해 주세요.')
        pid = stable_id(*(os.path.normcase(str(r)) for r in roots))
        with self.lock:
            if self._path(pid).exists():
                return self._read(pid)
            p = {'id': pid, 'name': str(name).strip()[:120] or roots[0].name + ' ↔ ' + roots[1].name,
                 'original_root': str(roots[0]), 'comparison_root': str(roots[1]),
                 'created_at': time.time(), 'updated_at': time.time(), 'groups': [], 'history': [],
                 'stats': {}, 'scan': {'status': 'not_scanned', 'issues': []}}
            summarize(p)
            self._write(p)
            return p

    def list_projects(self) -> list[dict]:
        with self.lock:
            result = []
            for path in self.projects_dir.glob('*.json'):
                p = self._read(path.stem)
                result.append({k: p[k] for k in ('id', 'name', 'original_root', 'comparison_root', 'stats', 'scan', 'updated_at')})
            return sorted(result, key=lambda p: p['updated_at'], reverse=True)

    def get_project(self, project_id: str) -> dict:
        with self.lock:
            return self._read(project_id)

    def apply_scan(self, project_id: str, scan: dict) -> dict:
        if scan.get('incomplete'):
            details = '; '.join(str(i['path']) + ': ' + i['message'] for i in scan['issues'][:3])
            raise ValueError('일부 폴더나 파일을 읽지 못해 검사를 완료하지 못했습니다. 마지막 정상 목록과 선택을 유지합니다. ' + details)
        with self.lock:
            p = self._read(project_id)
            old_rows = {r['id']: r for r in rows_of(p)}
            reviewed_files = set()
            for row in old_rows.values():
                if row.get('decision') is not None or row.get('review_required'):
                    reviewed_files.update((side, row[side]['relative_path']) for side in SIDES if row[side])
            fresh = copy.deepcopy(p)
            fresh['groups'] = copy.deepcopy(scan['groups'])
            fresh['stats'] = dict(scan['stats'])
            fresh['scan'] = {'status': 'ready', 'scanned_at': scan['scanned_at'], 'issues': scan['issues']}
            fresh_ids = set()
            for row in rows_of(fresh):
                fresh_ids.add(row['id'])
                old = old_rows.get(row['id'])
                if old and old.get('decision') is not None:
                    hashes = {s: fingerprint(fresh, row[s]) if row[s] else None for s in SIDES}
                    if hashes == old.get('fingerprints'):
                        row.update(decision=old['decision'], fingerprints=hashes, decided_at=old.get('decided_at'))
                    else:
                        row['review_required'] = True
                        fresh['history'].append({'reason': 'content_changed', 'at': time.time(), 'row': old})
                elif old and old.get('review_required'):
                    row['review_required'] = True
                elif any((s, row[s]['relative_path']) in reviewed_files for s in SIDES if row[s]):
                    row['review_required'] = True
            for rid, old in old_rows.items():
                if rid not in fresh_ids and (old.get('decision') is not None or old.get('review_required')):
                    fresh['history'].append({'reason': 'removed_or_repaired', 'at': time.time(), 'row': old})
            fresh['updated_at'] = time.time()
            summarize(fresh)
            self._write(fresh)
            return fresh

    def set_decision(self, project_id: str, row_ids: list[str], choice: str | None, expected_fingerprints: dict | None = None) -> dict:
        if choice not in (*SIDES, 'defer', None):
            raise ValueError('원본 유지·비교본 유지·보류 중에서 선택해 주세요.')
        if not isinstance(row_ids, list) or not row_ids:
            raise ValueError('선택할 파일이 없습니다.')
        with self.lock:
            p = self._read(project_id)
            index = {r['id']: r for r in rows_of(p)}
            ids = list(dict.fromkeys(row_ids))
            if any(rid not in index for rid in ids):
                raise ValueError('목록이 바뀌었습니다. 다시 불러온 뒤 선택해 주세요.')
            applied = skipped = 0
            for rid in ids:
                row = index[rid]
                if choice in SIDES and not row[choice]:
                    skipped += 1
                    continue
                hashes = {s: fingerprint(p, row[s]) if row[s] else None for s in SIDES} if choice is not None else {}
                if choice is not None:
                    for side in SIDES:
                        if row[side]:
                            expected = (expected_fingerprints or {}).get(row[side]['id'])
                            if expected and expected != hashes[side]:
                                raise ValueError('화면에 표시한 이미지와 현재 파일 내용이 다릅니다. 폴더를 다시 검사한 뒤 선택해 주세요.')
                if row['decision'] is not None or row['review_required']:
                    p['history'].append({'reason': 'choice_changed', 'at': time.time(), 'row': copy.deepcopy(row)})
                row.update(decision=choice, fingerprints=hashes, review_required=False, decided_at=time.time())
                applied += 1
            p['updated_at'] = time.time()
            summarize(p)
            self._write(p)
            return {'applied': applied, 'skipped': skipped, 'stats': p['stats']}

    def export_decisions(self, project_id: str, format: str) -> bytes:
        p = self.get_project(project_id)
        if format == 'json':
            return json.dumps(p, ensure_ascii=False, indent=2).encode('utf-8')
        if format != 'csv':
            raise ValueError('내보내기 형식은 JSON 또는 CSV입니다.')
        out = io.StringIO(newline='')
        writer = csv.writer(out)
        writer.writerow(['group', 'original', 'comparison', 'decision', 'review_required'])
        for g in p['groups']:
            for r in g['rows']:
                writer.writerow([g['relative_dir'] + '/' + g['name'],
                                 r['original']['relative_path'] if r['original'] else '',
                                 r['comparison']['relative_path'] if r['comparison'] else '',
                                 r['decision'] or '', str(r['review_required'])])
        return ('\ufeff' + out.getvalue()).encode('utf-8')
