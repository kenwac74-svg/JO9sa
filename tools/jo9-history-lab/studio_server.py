# 통합 캐릭터 편집기의 로컬 서버: 편집기 화면(dist)을 내보내고, 이미지 도구(add_character.py) 기능으로 게임 폴더의 캐릭터 JSON·이미지를 읽고 쓴다
import json
import os
import re
import sys
import threading
import http.server
from pathlib import Path
from urllib.parse import unquote, urlparse

HERE = Path(__file__).resolve().parent
DIST = HERE / 'dist'
SETTINGS = HERE / 'studio.local.json'          # 이 PC의 게임 폴더(깃 제외)
REPO_CONFIG = HERE.parent.parent / 'local.config.json'  # repo 공통 설정(GameQsp)
IMAGE_TOOL = HERE.parent / 'character-image-adder'
IMAGE_EXT = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp'}
MAX_BODY = 64 * 1024 * 1024
_lock = threading.Lock()


def load_backend(tool_dir=IMAGE_TOOL):
    """이미지 도구의 백엔드 함수(add_character.py)를 Tk 없이 불러온다."""
    tool_dir = str(tool_dir)
    if tool_dir not in sys.path:
        sys.path.insert(0, tool_dir)
    import add_character  # noqa: E402
    import align_core  # noqa: E402
    return add_character, align_core


api, align = load_backend()


# ------------------------------------------------------------------ 게임 폴더
def read_settings():
    try:
        return json.loads(SETTINGS.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return {}


def game_root():
    """게임 폴더: 편집기에서 지정한 값 → repo local.config.json의 GameQsp 폴더 → 환경 변수 순."""
    root = read_settings().get('gameRoot')
    source = 'studio'
    if not root and REPO_CONFIG.exists():
        try:
            qsp = json.loads(REPO_CONFIG.read_text(encoding='utf-8-sig')).get('GameQsp')
            if qsp:
                root, source = os.path.dirname(qsp), 'local.config.json'
        except ValueError:
            pass
    if not root and os.environ.get('JO9_GAME_ROOT'):
        root, source = os.environ['JO9_GAME_ROOT'], 'env'
    return root, source


def game_status():
    root, source = game_root()
    ok = bool(root) and api._looks_like_game_root(root)
    qsp = os.path.join(root, 'jack.qsp') if root else ''
    return {'root': root or '', 'source': source if root else '', 'ok': ok,
            'qsp': qsp if qsp and os.path.isfile(qsp) else '',
            'hint': '' if ok else '게임 폴더(content/pic/girls/full 과 json/slaves 가 있는 game 폴더)를 지정하세요.'}


def set_game_root(root):
    root = os.path.abspath(os.path.expanduser(str(root or '').strip()))
    if not api._looks_like_game_root(root):
        raise ValueError('게임 폴더가 아닙니다. content/pic/girls/full 과 json/slaves 가 있는 game 폴더를 고르세요: ' + root)
    data = read_settings()
    data['gameRoot'] = root
    SETTINGS.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    return game_status()


def paths():
    status = game_status()
    if not status['ok']:
        raise LookupError(status['hint'])
    return api.GamePaths(status['root'])


# ------------------------------------------------------------------ 캐릭터 읽기
def image_url(p, reference):
    """JSON 이미지 참조 → 편집기에서 쓸 /game/ 주소. 파일이 없으면 None."""
    if not reference:
        return None
    try:
        target = api._abs_from_gamepath(p.root, reference)
    except ValueError:
        return None
    if not os.path.isfile(target):
        return None
    rel = os.path.relpath(target, p.root).replace(os.sep, '/')
    stamp = int(os.path.getmtime(target))
    return '/game/' + rel + '?v=%d' % stamp


def list_characters():
    p = paths()
    out = []
    for item in api.scan_characters(p):
        face = item.get('face')
        face_url = None
        if face and os.path.isfile(face):
            face_url = '/game/' + os.path.relpath(face, p.root).replace(os.sep, '/') + '?v=%d' % int(os.path.getmtime(face))
        out.append({'id': item['id'], 'name': item.get('name', ''), 'base': item.get('base', ''), 'age': item.get('age', ''),
                    'color': item.get('color', ''), 'length': item.get('length', ''), 'outfits': item.get('outfits', []),
                    'face': face_url, 'jsonFile': item.get('json_file', '')})
    return out


def read_character(sid):
    p = paths()
    data, json_file = api.read_slave(p, int(sid))
    dedicated = api.is_dedicated(p, int(sid))
    slots = {}
    for key in api.SLOT_LABELS:
        field, reference = api.slot_reference(data, key, dedicated)
        slots[key] = {'label': api.SLOT_LABELS[key], 'field': field, 'reference': reference, 'url': image_url(p, reference)}
    base = api.slave_base_name(data)
    faces = {}
    for field, suffix in (('seed_ava_clear', ''), ('seed_ava_gray', '_gray'), ('seed_ava', '_sepia')):
        reference = data.get(field) or ('content/pic/girls/face/' + base + suffix if base else '')
        faces[field] = image_url(p, reference)
    return {'id': int(sid), 'jsonFile': os.path.basename(json_file), 'data': data, 'dedicated': dedicated,
            'slots': slots, 'faces': faces, 'sharedWith': api.shared_image_users(p, int(sid), data),
            'statKeys': api.stat_keys(data), 'storyFields': [list(x) for x in api.STORY_FIELDS],
            'choices': {'hair': api.HAIR_COLORS, 'length': api.HAIR_LENGTHS, 'age': list(api.AGE_INFO),
                        'boobs': api.BOOBS_SIZES, 'boobsImg': api.BOOBS_IMGS, 'pussyImg': api.PUSSY_IMGS}}


def game_file(rel):
    """/game/<경로>: 게임 폴더 안의 이미지 파일만 돌려준다."""
    p = paths()
    rel = unquote(rel).replace('\\', '/').lstrip('/')
    target = os.path.realpath(os.path.join(p.root, *rel.split('/')))
    base = os.path.realpath(p.root)
    if os.path.commonpath([base, target]) != base:
        raise PermissionError('게임 폴더 밖 파일입니다.')
    ext = os.path.splitext(target)[1].lower()
    if ext not in IMAGE_EXT or not os.path.isfile(target):
        raise FileNotFoundError(rel)
    return Path(target).read_bytes(), IMAGE_EXT[ext]


# ------------------------------------------------------------------ HTTP
ROUTES_GET = [
    (re.compile(r'^/api/game$'), lambda m, q: game_status()),
    (re.compile(r'^/api/chars$'), lambda m, q: {'items': list_characters()}),
    (re.compile(r'^/api/char/(\d+)$'), lambda m, q: read_character(m.group(1))),
]
ROUTES_POST = [
    (re.compile(r'^/api/game$'), lambda m, body: set_game_root(body.get('root'))),
]


class StudioHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def end_headers(self):
        # 편집기를 고친 뒤에도 브라우저가 예전 파일을 쓰지 않게 한다
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

    def log_message(self, *args):
        pass

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def fail(self, error):
        status = {LookupError: 409, FileNotFoundError: 404, PermissionError: 403, ValueError: 400, FileExistsError: 409}
        code = next((v for k, v in status.items() if isinstance(error, k)), 500)
        self.send_json(code, {'error': str(error) or error.__class__.__name__})

    def do_GET(self):
        url = urlparse(self.path)
        if url.path.startswith('/game/'):
            try:
                body, mime = game_file(url.path[len('/game/'):])
            except Exception as error:  # noqa: BLE001 - 화면에 이유를 돌려준다
                return self.fail(error)
            self.send_response(200)
            self.send_header('Content-Type', mime)
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            return self.wfile.write(body)
        for pattern, handler in ROUTES_GET:
            m = pattern.match(url.path)
            if m:
                try:
                    return self.send_json(200, handler(m, url.query))
                except Exception as error:  # noqa: BLE001
                    return self.fail(error)
        if url.path.startswith('/api/'):
            return self.send_json(404, {'error': '없는 주소입니다.'})
        return super().do_GET()

    def do_POST(self):
        url = urlparse(self.path)
        # 다른 사이트가 이 PC의 편집기에 쓰기 요청을 보내지 못하게 같은 출처만 받는다
        origin = self.headers.get('Origin')
        if origin and urlparse(origin).hostname not in ('127.0.0.1', 'localhost'):
            return self.send_json(403, {'error': '허용되지 않은 출처입니다.'})
        if self.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
            return self.send_json(415, {'error': 'JSON 요청만 받습니다.'})
        length = int(self.headers.get('Content-Length') or 0)
        if length > MAX_BODY:
            return self.send_json(413, {'error': '요청이 너무 큽니다.'})
        try:
            body = json.loads(self.rfile.read(length).decode('utf-8') or '{}')
        except ValueError:
            return self.send_json(400, {'error': 'JSON을 읽지 못했습니다.'})
        for pattern, handler in ROUTES_POST:
            m = pattern.match(url.path)
            if m:
                try:
                    with _lock:
                        return self.send_json(200, handler(m, body))
                except Exception as error:  # noqa: BLE001
                    return self.fail(error)
        return self.send_json(404, {'error': '없는 주소입니다.'})


def make_server(port):
    return http.server.ThreadingHTTPServer(('127.0.0.1', port), StudioHandler)
