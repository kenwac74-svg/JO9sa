# 통합 캐릭터 편집기의 로컬 서버: 편집기 화면(dist)을 내보내고, 이미지 도구(add_character.py) 기능으로 게임 폴더의 캐릭터 JSON·이미지를 읽고 쓴다
import base64
import io
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


def choices():
    return {'hair': api.HAIR_COLORS, 'length': api.HAIR_LENGTHS, 'age': list(api.AGE_INFO),
            'boobs': api.BOOBS_SIZES, 'boobsImg': api.BOOBS_IMGS, 'pussyImg': api.PUSSY_IMGS}


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
            'choices': choices()}


SEED_KEYS = set(json.loads((DIST / 'data' / 'game-seed-keys.json').read_text(encoding='utf-8'))['keys'])
STORY_KEYS = {key: field for key, field, _label in api.STORY_FIELDS}


def editable_key(key):
    """이 화면에서 고칠 수 있는 JSON 키: 게임이 읽는 seed_ 키(이미지·얼굴 경로 제외)."""
    return key.startswith('seed_') and key[5:] in SEED_KEYS and key not in api.IMAGE_FIELDS


def save_fields(sid, body):
    """캐릭터 JSON의 seed_ 값·배경 이야기를 고친다. 바뀐 키만 쓰고, 처음 저장할 때 .bak 을 남긴다.
    body = {set:{키:값}, unset:[키], story:{world|family|occupation: 표시 문장}, dryRun:bool}"""
    p = paths()
    data, json_file = api.read_slave(p, int(sid))
    updated = dict(data)
    for key, value in (body.get('set') or {}).items():
        if not editable_key(key):
            raise ValueError('고칠 수 없는 키입니다: ' + str(key))
        if isinstance(value, bool) or not isinstance(value, (int, str)):
            raise ValueError('값은 정수나 문자열이어야 합니다: ' + key)
        if isinstance(value, str) and len(value) > 20000:
            raise ValueError('문장이 너무 깁니다: ' + key)
        if key in data and isinstance(data[key], int) and not isinstance(value, int):
            raise ValueError('정수 항목입니다: ' + key)
        updated[key] = value
    for key in body.get('unset') or []:
        if not editable_key(key) or key == 'seed_name':
            raise ValueError('지울 수 없는 키입니다: ' + str(key))
        updated.pop(key, None)
    for key, text in (body.get('story') or {}).items():
        if key not in STORY_KEYS:
            raise ValueError('알 수 없는 배경 칸입니다: ' + str(key))
        field = STORY_KEYS[key]
        if api.story_to_display(data.get(field, '')) == (text or '').strip():
            continue  # 안 고친 문단은 원문(표시·주석 포함) 그대로 둔다
        value = api.story_from_display(text)
        if value:
            updated[field] = value
        else:
            updated.pop(field, None)
    changes = [{'key': k, 'before': data.get(k), 'after': updated.get(k)}
               for k in dict.fromkeys(list(data) + list(updated)) if data.get(k) != updated.get(k) or (k in data) != (k in updated)]
    if changes and not body.get('dryRun'):
        payloads = {json_file: json.dumps(updated, indent=4, ensure_ascii=False).encode('utf-8')}
        if not os.path.exists(json_file + '.bak'):
            payloads[json_file + '.bak'] = Path(json_file).read_bytes()
        api._write_files_together(payloads)
        work_log(p).event('studio_fields', id=int(sid), name=updated.get('seed_name'), changed=[c['key'] for c in changes])
    return {'changes': changes, 'dryRun': bool(body.get('dryRun')), 'saved': bool(changes) and not body.get('dryRun'),
            'character': read_character(sid) if changes and not body.get('dryRun') else None}


def decode_image(src):
    """data:image/...;base64,... → RGBA 이미지. 이미지가 아니면 거부."""
    from PIL import Image
    m = re.match(r'^data:image/(png|jpeg|jpg|webp|gif);base64,(.+)$', str(src or ''), re.S)
    if not m:
        raise ValueError('이미지 데이터가 아닙니다.')
    raw = base64.b64decode(m.group(2), validate=False)
    with Image.open(io.BytesIO(raw)) as image:
        image.load()
        if image.width * image.height > 60_000_000:
            raise ValueError('이미지가 너무 큽니다.')
        return image.convert('RGBA')


def existing_slot_image(p, data, sid, slot):
    field, reference = api.slot_reference(data, slot, api.is_dedicated(p, int(sid)))
    if not reference:
        raise ValueError('이 슬롯에는 기존 이미지가 없습니다: ' + slot)
    return api._load_rgba(api._abs_from_gamepath(p.root, reference))


def compose_slot(image, t):
    """Tk 도구와 같은 규칙: 변환값이 있으면 그대로 올리고, 없으면 795x596이면 그대로, 아니면 비율 유지로 맞춘다."""
    if t:
        return align.apply_transform(image, align.check_transform(t))
    return image if image.size == (align.W, align.H) else api.compose_full(image)


def save_images(sid, body):
    """외형 슬롯·얼굴 저장. body = {slots:{슬롯: {src: dataURL|'existing', t:{s,x,y}|null} | null(연결 해제)},
    face: {mode:'box', box:[x,y,w]} | {mode:'file', src:dataURL}, dryRun}"""
    p = paths()
    sid = int(sid)
    data, _json_file = api.read_slave(p, sid)
    slot_images, composed = {}, {}
    for slot, spec in (body.get('slots') or {}).items():
        if slot not in api.SLOT_FIELDS:
            raise ValueError('알 수 없는 슬롯입니다: ' + str(slot))
        if spec is None:
            slot_images[slot] = None
            continue
        src = spec.get('src')
        image = existing_slot_image(p, data, sid, slot) if src == 'existing' else decode_image(src)
        composed[slot] = slot_images[slot] = compose_slot(image, spec.get('t'))
    face_image = None
    face = body.get('face')
    if face and face.get('mode') == 'box':
        base = composed.get('base')
        if base is None:
            base = compose_slot(existing_slot_image(p, data, sid, 'base'), None)
        x, y, w = (int(round(float(v))) for v in face['box'])
        h = max(1, int(round(w * 150.0 / 151.0)))
        if w < 16 or x < 0 or y < 0 or x + w > align.W or y + h > align.H:
            raise ValueError('얼굴 상자가 그림 밖으로 나갔습니다.')
        face_image = base.crop((x, y, x + w, y + h))
    elif face and face.get('mode') == 'file':
        face_image = decode_image(face.get('src'))
    if not slot_images and face_image is None:
        raise ValueError('바꿀 이미지가 없습니다.')
    logs = []
    result = api.save_character_slots(p, sid, slot_images=slot_images, face_image=face_image,
                                      log=logs.append, dry_run=bool(body.get('dryRun')))
    root = os.path.realpath(p.root)
    rel = lambda f: os.path.relpath(f, root).replace(os.sep, '/')
    if not body.get('dryRun'):
        work_log(p).event('studio_images', id=sid, name=data.get('seed_name'), files=[rel(f) for f in result['files']])
    return {'dryRun': bool(body.get('dryRun')), 'files': [rel(f) for f in result['files']], 'targets': result['targets'],
            'warnings': result['warnings'], 'sharedWith': result['shared_with'], 'log': logs,
            'character': None if body.get('dryRun') else read_character(sid)}


TALKBOOK_DIR = 'jo9_talkbook'  # 게임 폴더 안, json 폴더 밖(게임이 자동으로 읽지 않는 곳)
SAFE_KEY = re.compile(r'^[A-Za-z0-9_.:|-]{1,80}$')


def talkbook_path(p, sid):
    return os.path.join(p.root, TALKBOOK_DIR, '%d.json' % int(sid))


def read_talkbook(sid):
    """캐릭터별 대사집(과거 경험 사실·필로우토크 대사·배경 분류). 게임 캐릭터 JSON과 따로 둔다."""
    p = paths()
    data, json_file = api.read_slave(p, int(sid))
    fn = talkbook_path(p, sid)
    book = None
    if os.path.isfile(fn):
        book = json.loads(Path(fn).read_text(encoding='utf-8-sig'))
    return {'id': int(sid), 'path': os.path.relpath(fn, p.root).replace(os.sep, '/'), 'exists': book is not None,
            'book': book, 'noAutoGenerate': data.get('seed_age') == 1}


def check_plain(value, depth=0):
    if depth > 6:
        raise ValueError('대사집 구조가 너무 깊습니다.')
    if isinstance(value, dict):
        for k, v in value.items():
            if not isinstance(k, str) or not SAFE_KEY.match(k):
                raise ValueError('대사집 키 형식이 아닙니다: ' + str(k)[:40])
            check_plain(v, depth + 1)
    elif isinstance(value, list):
        for v in value:
            check_plain(v, depth + 1)
    elif isinstance(value, str):
        if len(value) > 8000:
            raise ValueError('대사 하나가 너무 깁니다(8000자 이하).')
    elif not (value is None or isinstance(value, (bool, int, float))):
        raise ValueError('대사집에 쓸 수 없는 값입니다.')


def save_talkbook(sid, body):
    p = paths()
    data, _json_file = api.read_slave(p, int(sid))
    book = body.get('book')
    if not isinstance(book, dict):
        raise ValueError('대사집은 객체여야 합니다.')
    allowed = {'background', 'seed', 'acq', 'overrides', 'lines', 'facts', 'history', 'notes', 'refs'}
    extra = set(book) - allowed
    if extra:
        raise ValueError('대사집에 없는 항목입니다: ' + ', '.join(sorted(extra)))
    check_plain(book)
    # 원본 DB 연결 코드는 키·표시불가 코드만 남긴다(문장 금지)
    refs = {}
    for slot, ref in (book.get('refs') or {}).items():
        if not isinstance(ref, dict) or not re.match(r'^p\d{4}\.q\d{2}(\.[a-z0-9]+)*$', str(ref.get('key', ''))):
            raise ValueError('원본 DB 연결 코드 형식이 아닙니다: ' + str(slot))
        codes = [c for c in ref.get('blocked') or [] if re.match(r'^B\d$', str(c))]
        refs[slot] = {'key': ref['key'], 'blocked': codes}
    if 'refs' in book:
        book['refs'] = refs
    # 연령 코드 1이어도 사용자가 직접 쓴 내용은 그대로 저장한다. 자동 생성(시뮬레이터 대사·과거 경험)은 화면에서 만들지 않는다(사용자 지시 2026-11-12)
    out = {'format': 'jo9-talkbook', 'version': 1, 'id': int(sid), 'name': data.get('seed_name', ''),
           'jsonFile': os.path.basename(_json_file), **book}
    text = json.dumps(out, ensure_ascii=False, indent=1)
    if len(text) > 2_000_000:
        raise ValueError('대사집이 너무 큽니다(2MB 이하).')
    fn = talkbook_path(p, sid)
    payloads = {fn: text.encode('utf-8')}
    if os.path.isfile(fn) and not os.path.exists(fn + '.bak'):
        payloads[fn + '.bak'] = Path(fn).read_bytes()
    api._write_files_together(payloads)
    return read_talkbook(sid)


# ------------------------------------------------------------------ 새 캐릭터·복제·삭제 + 작업 기록
_logs = {}


def work_log(p):
    """작업 기록: 게임 폴더의 picture_modding(기존 이미지 도구 자리)이 있으면 그 기록에 이어 쓰고, 없으면 jo9_editor 폴더에 쓴다."""
    folder = os.path.join(p.root, 'picture_modding')
    if not os.path.isdir(folder):
        folder = os.path.join(p.root, 'jo9_editor')
    if folder not in _logs:
        from tool_log import ToolLog
        _logs[folder] = ToolLog(folder)
        _logs[folder].game_root = p.root
    return _logs[folder]


def face_from(spec, base_image):
    if not spec:
        return None
    if spec.get('mode') == 'file':
        return decode_image(spec.get('src'))
    x, y, w = (int(round(float(v))) for v in spec['box'])
    h = max(1, int(round(w * 150.0 / 151.0)))
    if w < 16 or x < 0 or y < 0 or x + w > align.W or y + h > align.H:
        raise ValueError('얼굴 상자가 그림 밖으로 나갔습니다.')
    return base_image.crop((x, y, x + w, y + h))


def new_character(body):
    """새 캐릭터(기존 add_character): 기본 전신·얼굴 필수, 외형 슬롯·타이틀 선택. unique를 주면 고유 캐릭터(랜덤 풀 미등록)."""
    p = paths()
    images = {}
    for slot, spec in (body.get('slots') or {}).items():
        if slot not in api.SLOT_FIELDS:
            raise ValueError('알 수 없는 슬롯입니다: ' + str(slot))
        if spec:
            images[slot] = compose_slot(decode_image(spec.get('src')), spec.get('t'))
    if images.get('base') is None:
        raise ValueError('기본(알몸) 전신 이미지를 고르세요.')
    face = face_from(body.get('face'), images['base'])
    if face is None:
        raise ValueError('얼굴 상자를 맞추거나 얼굴 파일을 고르세요.')
    if body.get('age') not in api.AGE_INFO or body.get('color') not in api.HAIR_COLORS or body.get('length') not in api.HAIR_LENGTHS:
        raise ValueError('나이 분류·머리색·머리 길이를 고르세요.')
    outfits = {api.SLOT_FIELDS[k][0]: images[k] for k in ('maid', 'secr', 'dom') if images.get(k) is not None}
    unique = body.get('unique')
    logs = []
    r = api.add_character(p, images['base'], None, body['color'], body['length'], body['age'],
                          str(body.get('boobs', '3')), body.get('boobsImg') or 'boobs_C', body.get('pussyImg') or 'pussy_l1',
                          resize_full=True, resize_face=True, register_pool=bool(body.get('register', True)) and not unique,
                          auto_cutout=False, face_image=face, outfits=outfits, title=images.get('title'),
                          log=logs.append, dry_run=bool(body.get('dryRun')), unique=unique)
    root = os.path.realpath(p.root)
    out = {'id': r['id'], 'dryRun': bool(body.get('dryRun')), 'files': [os.path.relpath(f, root).replace(os.sep, '/') for f in r['files']], 'log': logs}
    if not body.get('dryRun'):
        work_log(p).event('studio_new', id=r['id'], name=(unique or {}).get('name'), files=len(r['files']))
    return out


def clone(sid, body):
    p = paths()
    logs = []
    r = api.clone_character(p, int(sid), name=body.get('name'), slug=body.get('slug') or '', new_id=body.get('newId') or None,
                            story=body.get('story'), seed_overrides=body.get('seedOverrides'), log=logs.append,
                            dry_run=bool(body.get('dryRun')))
    if not body.get('dryRun'):
        work_log(p).event('studio_clone', id=r['id'], source=int(sid), name=body.get('name'))
    return {'id': r['id'], 'json': r['json'], 'dryRun': bool(body.get('dryRun')), 'warnings': r['warnings'],
            'sharedFields': r['shared_fields'], 'log': logs}


def delete_plan(sid):
    """삭제 전 확인: 랜덤 풀 안의 중간 번호인지(번호 유지 / 마지막 번호 이동 선택), 공유 이미지."""
    p = paths()
    sid = int(sid)
    band, key, first = api.band_and_key(sid)
    last = int(api.read_index(p).get(key, first - 1)) if band else None
    return {'id': sid, 'pool': bool(band and first <= sid <= last), 'middle': bool(band and first <= sid < last),
            'last': last, 'sharedWith': api.shared_image_users(p, sid)}


def delete(sid, body):
    p = paths()
    mode = body.get('mode', 'safe')
    if mode not in ('safe', 'swap'):
        raise ValueError('삭제 방식은 safe 또는 swap 입니다.')
    if body.get('confirm') != int(sid):
        raise ValueError('삭제 확인 번호가 맞지 않습니다.')
    data, _fn = api.read_slave(p, int(sid))
    logs = []
    api.delete_character(p, int(sid), mode=mode, log=logs.append)
    work_log(p).event('studio_delete', id=int(sid), name=data.get('seed_name'), mode=mode)
    return {'id': int(sid), 'mode': mode, 'log': logs}


# ------------------------------------------------------------------ QSP 이벤트 대사(읽기 + mods 초안)
REPO = HERE.parent.parent
_qsp_cache = {}


def _sh(s, d):
    return ''.join(chr((ord(c) + d) & 0xFFFF) for c in s)


def load_qsp():
    """게임 jack.qsp를 읽어 {이름: 본문}과 원본 줄을 돌려준다(apply_mods.ps1·apply_py와 같은 형식). 파일이 바뀌면 다시 읽는다."""
    status = game_status()
    if not status['qsp']:
        raise LookupError('게임 폴더에 jack.qsp가 없습니다.')
    fn = status['qsp']
    stamp = (fn, os.path.getmtime(fn), os.path.getsize(fn))
    if _qsp_cache.get('stamp') != stamp:
        raw = Path(fn).read_bytes()
        lines = raw.decode('utf-16-le').split('\r\n')
        if '\r\n'.join(lines).encode('utf-16-le') != raw:
            raise ValueError('qsp 왕복 검사 실패: 읽고 다시 쓴 결과가 원본과 다릅니다.')
        n, at, idx = int(_sh(lines[3], 5)), 4, {}
        for _ in range(n):
            idx[_sh(lines[at], 5)] = at
            at += 4 + int(_sh(lines[at + 3], 5)) * 3
        bodies = {name: _sh(lines[i + 2], 5) for name, i in idx.items()}
        import hashlib
        _qsp_cache.update(stamp=stamp, raw=raw, lines=lines, idx=idx, bodies=bodies, sha=hashlib.sha256(raw).hexdigest())
    return _qsp_cache


def qsp_search(query):
    """qsp 본문에서 글자를 찾는다. 결과: 위치·줄 번호(0부터)·줄 문장. 300개까지."""
    from urllib.parse import parse_qs
    words = [w for w in (parse_qs(query).get('q', [''])[0]).split('|') if w.strip()]
    if not words:
        raise ValueError('찾을 글자를 넣으세요.')
    q = load_qsp()
    hits, total = [], 0
    for name, body in q['bodies'].items():
        for i, line in enumerate(body.split('\r\n')):
            if any(w in line for w in words):
                total += 1
                if len(hits) < 300:
                    hits.append({'location': name, 'line': i, 'text': line})
    return {'sha256': q['sha'], 'total': total, 'hits': hits, 'words': words}


def qsp_mod(body):
    """줄 단위 수정 → mods 선언형 JSON 초안. 메모리에서 적용해 개수·줄끝을 검사하고 적용 뒤 SHA-256을 계산한다."""
    import hashlib
    q = load_qsp()
    mod_id = str(body.get('id') or '').strip()
    if not re.match(r'^\d{4}-\d{2}-\d{2}_[a-z0-9_]{3,80}$', mod_id):
        raise ValueError('mod ID는 날짜_영문소문자 형식이어야 합니다(예: 2026-11-12_felicity_lines).')
    bodies = dict(q['bodies'])
    edits, warnings = [], []
    for e in body.get('edits') or []:
        name, line, new = e.get('location'), int(e.get('line')), str(e.get('new', ''))
        if name not in bodies:
            raise ValueError('없는 위치입니다: ' + str(name))
        if '\r' in new or '\n' in new:
            raise ValueError('한 줄 수정만 받습니다(줄바꿈 금지). 게임 줄바꿈은 <br>로 쓰세요.')
        src = q['bodies'][name].split('\r\n')
        if not 0 <= line < len(src):
            raise ValueError('줄 번호가 범위를 벗어났습니다.')
        old = src[line]
        if old == new:
            continue
        if old.count("'") % 2 != new.count("'") % 2:
            warnings.append('%s %d줄: 작은따옴표 개수의 짝이 바뀌었습니다. 문장 안 작은따옴표는 두 번(\'\')으로 쓰세요.' % (name, line + 1))
        # 같은 줄이 위치 안에 여러 번 있으면 앞뒤 줄을 붙여 하나로 정해지게 한다
        lo, hi = line, line + 1
        while '\r\n'.join(src[lo:hi]) and q['bodies'][name].count('\r\n'.join(src[lo:hi])) > 1 and (lo > 0 or hi < len(src)):
            lo, hi = max(0, lo - 1), min(len(src), hi + 1)
        old_block = '\r\n'.join(src[lo:hi])
        new_block = '\r\n'.join(src[lo:line] + [new] + src[line + 1:hi])
        count = bodies[name].count(old_block)
        if count != 1:
            raise ValueError('%s %d줄: 고칠 문장을 하나로 특정하지 못했습니다(%d곳).' % (name, line + 1, count))
        bodies[name] = bodies[name].replace(old_block, new_block)
        edits.append({'location': name, 'field': 'body', 'old': old_block, 'new': new_block, 'count': 1})
    if not edits:
        raise ValueError('바뀐 줄이 없습니다.')
    lines = list(q['lines'])
    for name, at in q['idx'].items():
        if bodies[name] != q['bodies'][name]:
            lines[at + 2] = _sh(bodies[name], -5)
    data = '\r\n'.join(lines).encode('utf-16-le')
    mod = {'id': mod_id, 'description': str(body.get('description') or '통합 편집기에서 고친 QSP 대사')[:500],
           'target': 'game\\jack.qsp', 'before_sha256': q['sha'], 'edits': edits,
           'after_sha256': hashlib.sha256(data).hexdigest()}
    saved = None
    if body.get('saveToRepo'):
        target = REPO / 'mods' / (mod_id + '.json')
        if not (REPO / 'mods').is_dir():
            raise LookupError('repo의 mods 폴더를 찾지 못했습니다: ' + str(REPO / 'mods'))
        if target.exists():
            raise FileExistsError('같은 이름의 mod가 이미 있습니다: ' + target.name)
        target.write_bytes(json.dumps(mod, ensure_ascii=False, indent=1).encode('utf-8'))
        saved = 'mods/' + target.name
    return {'mod': mod, 'warnings': warnings, 'saved': saved}


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
    (re.compile(r'^/api/chars$'), lambda m, q: {'items': list_characters(), 'choices': choices()}),
    (re.compile(r'^/api/char/(\d+)$'), lambda m, q: read_character(m.group(1))),
    (re.compile(r'^/api/talkbook/(\d+)$'), lambda m, q: read_talkbook(m.group(1))),
    (re.compile(r'^/api/qsp/search$'), lambda m, q: qsp_search(q)),
    (re.compile(r'^/api/char/(\d+)/delete-plan$'), lambda m, q: delete_plan(m.group(1))),
]
ROUTES_POST = [
    (re.compile(r'^/api/game$'), lambda m, body: set_game_root(body.get('root'))),
    (re.compile(r'^/api/char/(\d+)/fields$'), lambda m, body: save_fields(m.group(1), body)),
    (re.compile(r'^/api/char/(\d+)/images$'), lambda m, body: save_images(m.group(1), body)),
    (re.compile(r'^/api/talkbook/(\d+)$'), lambda m, body: save_talkbook(m.group(1), body)),
    (re.compile(r'^/api/qsp/mod$'), lambda m, body: qsp_mod(body)),
    (re.compile(r'^/api/char/new$'), lambda m, body: new_character(body)),
    (re.compile(r'^/api/char/(\d+)/clone$'), lambda m, body: clone(m.group(1), body)),
    (re.compile(r'^/api/char/(\d+)/delete$'), lambda m, body: delete(m.group(1), body)),
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
