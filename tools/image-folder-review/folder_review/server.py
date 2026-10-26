"""Loopback-only HTTP application with read-only image access."""

import copy
import io
import json
import mimetypes
import os
import re
import secrets
import socket
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from PIL import Image, ImageOps

from . import __version__
from .catalog import scan_pair
from .picker import pick_folder
from .project_store import ProjectStore, asset_path, rows_of, trusted_root
from .thumbnails import ThumbnailCache

APP_ID = 'image-folder-review'
STATIC = Path(__file__).resolve().parent.parent / 'static'


class ReviewService:
    def __init__(self, data_dir: Path):
        self.store = ProjectStore(data_dir)
        self.thumbs = ThumbnailCache(Path(data_dir) / 'thumbnails')
        self.token = secrets.token_urlsafe(32)
        self.lock = threading.RLock()
        self.jobs = {}
        self.indices = {}

    def close(self):
        self.thumbs.close()

    def _index(self, p):
        files = {}
        for row in rows_of(p):
            for side in ('original', 'comparison'):
                if row[side]:
                    f = row[side] | {'_root': p[side + '_root']}
                    files[f['id']] = f
        roots = {s + '_root': p[s + '_root'] for s in ('original', 'comparison')}
        with self.lock:
            row_files = {r['id']: [r[s]['id'] for s in ('original', 'comparison') if r[s]] for r in rows_of(p)}
            self.indices[p['id']] = {'roots': roots, 'files': files, 'rows': row_files}
        return files

    def index(self, pid):
        with self.lock:
            item = self.indices.get(pid)
        if item is None:
            p = self.store.get_project(pid)
            files = self._index(p)
            self.thumbs.enqueue(list(files.values()))
            item = self.indices[pid]
        return item

    def is_scanning(self, pid):
        with self.lock:
            return any(j['project_id'] == pid and j['status'] == 'scanning' for j in self.jobs.values())

    def start_scan(self, pid):
        self.store.get_project(pid)
        with self.lock:
            for jid, job in self.jobs.items():
                if job['project_id'] == pid and job['status'] == 'scanning':
                    return jid
            jid = uuid.uuid4().hex
            self.jobs[jid] = {'id': jid, 'project_id': pid, 'status': 'scanning', 'message': '폴더의 이미지 목록을 검사하고 있습니다.', 'started_at': time.time()}
        threading.Thread(target=self._scan, args=(pid, jid), daemon=True).start()
        return jid

    def _scan(self, pid, jid):
        try:
            p = self.store.get_project(pid)
            rescan = p['scan']['status'] == 'ready'
            scan = scan_pair(trusted_root(p, 'original'), trusted_root(p, 'comparison'))
            p = self.store.apply_scan(pid, scan)
            files = self._index(p)
            self.thumbs.enqueue(list(files.values()), verify=rescan)
            state = {'status': 'ready', 'message': '목록 검사 완료. 썸네일을 자동으로 준비합니다.'}
        except Exception as error:
            state = {'status': 'failed', 'message': str(error)}
        with self.lock:
            self.jobs[jid].update(state, finished_at=time.time())

    def job(self, jid):
        with self.lock:
            if jid not in self.jobs:
                raise FileNotFoundError('검사 작업을 찾을 수 없습니다.')
            return dict(self.jobs[jid])

    def page(self, pid, query):
        p = self.store.get_project(pid)
        index = self.index(pid)
        q = query.get('q', [''])[0].strip().casefold()
        presence = query.get('presence', ['all'])[0]
        review = query.get('review', ['all'])[0]
        modes = {key: query.get(key, ['all'])[0] for key in
                 ('original_only', 'comparison_only', 'hash_different', 'hash_same')}
        if any(mode not in ('all', 'only', 'hide') for mode in modes.values()):
            raise ValueError('필터는 전체 표시, 골라보기, 숨기기 중에서 선택해 주세요.')
        hash_counts = dict(same=0, different=0, pending=0, error=0)

        # Reuse the background thumbnail SHA-256 results; filtering never rereads
        # every source image or treats pending/failed verification as equality.
        for row in rows_of(p):
            a, b = row['original'], row['comparison']
            row['hash_status'] = 'not_applicable'
            if not a or not b or Path(a['relative_path']).name != Path(b['relative_path']).name:
                continue
            infos = [self.thumbs.info(index['files'][f['id']]) for f in (a, b)]
            if any(info['status'] == 'failed' for info in infos):
                status = 'error'
            elif not all(info['status'] == 'ready' and info.get('sha256') for info in infos):
                status = 'pending'
            else:
                status = 'same' if infos[0]['sha256'] == infos[1]['sha256'] else 'different'
            row['hash_status'] = status
            hash_counts[status] += 1

        def matches(row):
            both = bool(row['original'] and row['comparison'])
            conditions = {
                'original_only': bool(row['original'] and not row['comparison']),
                'comparison_only': bool(row['comparison'] and not row['original']),
                'hash_different': row['hash_status'] == 'different',
                'hash_same': row['hash_status'] == 'same',
            }
            for key, condition in conditions.items():
                if (modes[key] == 'only' and not condition) or (modes[key] == 'hide' and condition):
                    return False
            if presence == 'both' and not both:
                return False
            if presence == 'original' and (not row['original'] or row['comparison']):
                return False
            if presence == 'comparison' and (not row['comparison'] or row['original']):
                return False
            if review == 'unreviewed' and (row['decision'] is not None or row['review_required']):
                return False
            if review == 'defer' and row['decision'] != 'defer':
                return False
            if review == 'review' and not row['review_required']:
                return False
            if review == 'completed' and (row['decision'] not in ('original', 'comparison') or row['review_required']):
                return False
            return True

        groups = []
        for group in p['groups']:
            group_match = not q or q in (group['relative_dir'] + '/' + group['name']).casefold()
            rows = [r for r in group['rows'] if matches(r) and (group_match or any(
                q in r[s]['relative_path'].casefold() for s in ('original', 'comparison') if r[s]))]
            if rows:
                choices = {r['decision'] for r in rows}
                summary = ('review' if any(r['review_required'] for r in rows) else
                           'unreviewed' if choices == {None} else
                           next(iter(choices)) if len(choices) == 1 else 'mixed')
                groups.append(group | {'rows': rows, 'total_rows': len(group['rows']),
                                       'decision_summary': summary})
        size = max(1, min(40, int(query.get('page_size', ['20'])[0])))
        pages = max(1, (len(groups) + size - 1) // size)
        page = max(1, min(pages, int(query.get('page', ['1'])[0])))
        shown = groups[(page - 1) * size:page * size]
        for g in shown:
            for row in g['rows']:
                for side in ('original', 'comparison'):
                    if row[side]:
                        f = index['files'].get(row[side]['id'])
                        row[side]['thumbnail'] = self.thumbs.info(f) if f else {'status': 'pending'}
        metadata = {k: v for k, v in p.items() if k not in ('groups', 'history')}
        metadata['history_count'] = len(p['history'])
        metadata['scanning'] = self.is_scanning(pid)
        return {'ok': True, 'project': metadata, 'groups': shown, 'total_groups': len(groups),
                'total_rows': sum(len(g['rows']) for g in groups), 'hash_counts': hash_counts,
                'page': page, 'pages': pages, 'thumbnails': self.thumbs.progress(list(index['files'].values()))}


def make_server(host, port, service):
    if host != '127.0.0.1':
        raise ValueError('이 도구는 127.0.0.1에서만 실행됩니다.')

    class Handler(BaseHTTPRequestHandler):
        protocol_version = 'HTTP/1.1'

        def log_message(self, *args):
            pass

        def _allowed(self):
            expected = {'127.0.0.1:' + str(self.server.server_port), 'localhost:' + str(self.server.server_port)}
            if self.headers.get('Host') not in expected:
                return False
            origin = self.headers.get('Origin')
            if origin and origin not in {'http://' + h for h in expected}:
                return False
            return self.headers.get('Sec-Fetch-Site') not in ('cross-site',)

        def _headers(self, status, content_type, length, extra=None):
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(length))
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Security-Policy', "default-src 'self'; img-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
            for key, value in (extra or {}).items():
                self.send_header(key, value)
            self.end_headers()

        def _json(self, value, status=200):
            raw = json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
            self._headers(status, 'application/json; charset=utf-8', len(raw))
            self.wfile.write(raw)

        def _file(self, path, content_type=None, extra=None):
            with Path(path).open('rb') as stream:
                self._headers(200, content_type or mimetypes.guess_type(str(path))[0] or 'application/octet-stream', os.fstat(stream.fileno()).st_size, extra)
                while chunk := stream.read(256 * 1024):
                    self.wfile.write(chunk)

        def _run(self, post=False):
            if not self._allowed():
                self._json({'ok': False, 'error': {'code': 'forbidden', 'message': '로컬 도구 화면에서만 접근할 수 있습니다.'}}, 403)
                self.close_connection = True
                return
            try:
                parsed = urlsplit(self.path)
                parts = parsed.path.strip('/').split('/')
                query = parse_qs(parsed.query)
                body = None
                if post:
                    length = int(self.headers.get('Content-Length', '0'))
                    if length < 0 or length > 1024 * 1024:
                        raise ValueError('요청이 너무 큽니다. 그룹 단위로 선택해 주세요.')
                    raw_body = self.rfile.read(length)
                    if self.headers.get('X-Review-Token') != service.token:
                        raise PermissionError('도구 연결이 만료되었습니다. 화면을 새로고침해 주세요.')
                    body = json.loads(raw_body or b'{}')
                    if not isinstance(body, dict):
                        raise ValueError('요청 형식이 올바르지 않습니다.')
                if parts == ['api', 'status'] and not post:
                    self._json({'ok': True, 'app': APP_ID, 'version': __version__, 'pid': os.getpid(),
                                'data_dir': str(service.store.data_dir), 'token': service.token,
                                'url': 'http://127.0.0.1:' + str(self.server.server_port) + '/'})
                elif parts == ['api', 'projects']:
                    if post:
                        p = service.store.register(body.get('name', ''), body.get('original'), body.get('comparison'))
                        jid = service.start_scan(p['id'])
                        self._json({'ok': True, 'project': {k: v for k, v in p.items() if k not in ('groups', 'history')}, 'job_id': jid}, 202)
                    else:
                        self._json({'ok': True, 'projects': service.store.list_projects()})
                elif parts[:2] == ['api', 'projects'] and len(parts) >= 3:
                    pid = parts[2]
                    if len(parts) == 3 and not post:
                        self._json(service.page(pid, query))
                    elif parts[3:] == ['rescan'] and post:
                        self._json({'ok': True, 'job_id': service.start_scan(pid)}, 202)
                    elif parts[3:] == ['decisions'] and post:
                        with service.lock:
                            if service.is_scanning(pid):
                                raise ValueError('폴더 검사 중입니다. 완료된 뒤 선택해 주세요.')
                            ids = body.get('row_ids')
                            if not isinstance(ids, list):
                                raise ValueError('선택할 파일 목록이 올바르지 않습니다.')
                            expected = body.get('versions') or {}
                            if not isinstance(expected, dict) or any(not isinstance(h, str) or not re.fullmatch('[a-f0-9]{64}', h) for h in expected.values()):
                                raise ValueError('이미지 버전 정보가 올바르지 않습니다.')
                            index = service.index(pid)
                            for rid in ids:
                                for fid in index['rows'].get(rid, []):
                                    info = service.thumbs.info(index['files'][fid])
                                    if info.get('sha256'):
                                        expected.setdefault(fid, info['sha256'])
                            result = service.store.set_decision(pid, ids, body.get('choice'), expected_fingerprints=expected)
                        self._json({'ok': True} | result)
                    elif parts[3:] == ['export'] and not post:
                        fmt = query.get('format', ['json'])[0]
                        raw = service.store.export_decisions(pid, fmt)
                        self._headers(200, 'text/csv; charset=utf-8' if fmt == 'csv' else 'application/json; charset=utf-8', len(raw),
                                      {'Content-Disposition': 'attachment; filename="image-review-' + pid + '.' + fmt + '"'})
                        self.wfile.write(raw)
                    elif parts[3:] == ['errors'] and not post:
                        p = service.store.get_project(pid)
                        issues = list(p['scan']['issues'])
                        for f in service.index(pid)['files'].values():
                            info = service.thumbs.info(f)
                            if info.get('error'):
                                issues.append({'side': f['side'], 'path': f['relative_path'], 'message': info['error']})
                        self._json({'ok': True, 'issues': issues})
                    else:
                        raise FileNotFoundError('요청을 찾을 수 없습니다.')
                elif parts[:2] == ['api', 'jobs'] and len(parts) == 3 and not post:
                    self._json({'ok': True, 'job': service.job(parts[2])})
                elif parts == ['api', 'pick-folder'] and post:
                    self._json({'ok': True} | pick_folder(body.get('initial')))
                elif len(parts) == 3 and parts[0] == 'asset' and not post:
                    pid, fid = parts[1:]
                    index = service.index(pid)
                    if fid not in index['files']:
                        raise FileNotFoundError('파일을 찾을 수 없습니다.')
                    f = index['files'][fid]
                    source = asset_path(index['roots'], f)
                    if query.get('mode', ['thumb'])[0] == 'original':
                        if f['extension'] in ('.tif', '.tiff'):
                            with Image.open(source) as image:
                                view = ImageOps.exif_transpose(image).convert('RGBA')
                                buffer = io.BytesIO()
                                view.save(buffer, format='PNG')
                            raw = buffer.getvalue()
                            self._headers(200, 'image/png', len(raw)); self.wfile.write(raw)
                        else:
                            mime = 'image/jpeg' if f['extension'] in ('.jpg', '.jpeg', '.jfif') else mimetypes.guess_type('image' + f['extension'])[0]
                            self._file(source, mime or 'application/octet-stream')
                    else:
                        result = service.thumbs.get(f, priority=True)
                        if result.get('error'):
                            raw = b'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="300" height="180" fill="#252930"/><path d="m125 65 50 50m0-50-50 50" stroke="#de9989" stroke-width="5"/></svg>'
                            self._headers(200, 'image/svg+xml', len(raw)); self.wfile.write(raw)
                        else:
                            self._file(result['path'], 'image/webp')
                elif not post and parsed.path in ('/', '/index.html', '/app.js', '/style.css'):
                    filename = 'index.html' if parsed.path == '/' else parsed.path[1:]
                    self._file(STATIC / filename)
                elif not post and parsed.path == '/favicon.ico':
                    self._headers(204, 'image/x-icon', 0)
                else:
                    raise FileNotFoundError('요청을 찾을 수 없습니다.')
            except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
                pass
            except Exception as error:
                code = 403 if isinstance(error, PermissionError) else 404 if isinstance(error, (FileNotFoundError, KeyError)) else 409 if isinstance(error, (ValueError, json.JSONDecodeError)) else 500
                self._json({'ok': False, 'error': {'code': str(code), 'message': str(error)}}, code)
                if post:
                    self.close_connection = True

        def do_GET(self):
            self._run()

        def do_POST(self):
            self._run(post=True)

    class LocalHTTPServer(ThreadingHTTPServer):
        allow_reuse_address = False

        def server_bind(self):
            if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
                self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
            super().server_bind()

    server = LocalHTTPServer((host, port), Handler)
    server.daemon_threads = True
    return server


def serve(host: str, port: int, data_dir: Path):
    from .launcher import process_lock
    with process_lock(Path(data_dir) / 'server.instance.lock'):
        _serve_locked(host, port, data_dir)


def _serve_locked(host: str, port: int, data_dir: Path):
    service = ReviewService(data_dir)
    try:
        try:
            server = make_server(host, port, service)
        except OSError:
            if not port:
                raise
            server = make_server(host, 0, service)
        identity = {'app': APP_ID, 'version': __version__, 'pid': os.getpid(),
                    'url': 'http://127.0.0.1:' + str(server.server_port) + '/', 'data_dir': str(service.store.data_dir)}
        (service.store.data_dir / 'server.json').write_text(json.dumps(identity, ensure_ascii=False), encoding='utf-8')
        print(json.dumps(identity, ensure_ascii=False), flush=True)
        try:
            server.serve_forever()
        finally:
            server.server_close()
    finally:
        service.close()
