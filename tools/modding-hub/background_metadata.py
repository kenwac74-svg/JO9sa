"""JO9 MOD CHARACTER_BACKGROUND_20261118: explicit classification metadata only."""
import copy
import json
import re
from pathlib import Path

KINDS = ('world', 'family', 'occupation')
SEED_SUFFIXES = (*KINDS, 'background_fixed')
SEED_KEYS = frozenset('seed_' + kind for kind in SEED_SUFFIXES)
CATALOG = json.loads((Path(__file__).parent / 'data/background-classifications.json').read_text('utf-8'))
BOOK_KEYS = {'background', 'seed', 'acq', 'overrides', 'lines', 'facts', 'history', 'notes', 'refs'}
BOOK_HEADER = {'format', 'version', 'id', 'name', 'jsonFile'}


def classification(kind, value):
    if not isinstance(value, str) or (value and value not in CATALOG[kind]):
        raise ValueError('알 수 없는 배경 분류입니다: ' + kind + ' / ' + str(value))
    return value


def seed_values(background):
    if not isinstance(background, dict):
        raise ValueError('배경 분류는 객체여야 합니다.')
    return {**{'seed_' + kind: classification(kind, background.get(kind, '')) for kind in KINDS},
            'seed_background_fixed': 1}


def picker_background(data, legacy):
    background = copy.deepcopy(legacy)
    if data.get('seed_background_fixed') == 1:
        for kind in KINDS:
            background.pop(kind, None)
            if data.get('seed_' + kind):
                background[kind] = data['seed_' + kind]
    return background


def prepare_fields(data, body):
    """Validate manual seed edits; absent/cleared slots remain explicitly unassigned."""
    sets = dict(body.get('set') or {})
    unsets = list(body.get('unset') or [])
    if not (set(sets) | set(unsets)) & SEED_KEYS:
        return body
    if 'seed_background_fixed' in unsets:
        raise ValueError('배경 분류는 세계·출신·직업의 비우기로 해제하세요.')
    if 'seed_background_fixed' in sets and (type(sets['seed_background_fixed']) is not int or sets['seed_background_fixed'] != 1):
        raise ValueError('배경 분류 저장 표시는 정수 1이어야 합니다.')
    background = {}
    for kind in KINDS:
        key = 'seed_' + kind
        background[kind] = '' if key in unsets else sets.get(key, data.get(key, ''))
    sets.update(seed_values(background))
    return {**body, 'set': sets, 'unset': [key for key in unsets if key not in SEED_KEYS]}


def _book(sid, data, filename, incoming, check_plain):
    if not isinstance(incoming, dict):
        raise ValueError('대사집은 객체여야 합니다.')
    book = copy.deepcopy(incoming)
    extra = set(book) - BOOK_KEYS
    if extra:
        raise ValueError('대사집에 없는 항목입니다: ' + ', '.join(sorted(extra)))
    check_plain(book)
    if 'refs' in book:
        refs = {}
        for slot, ref in (book.get('refs') or {}).items():
            if not isinstance(ref, dict) or not re.fullmatch(r'p\d{4}\.q\d{2}(\.[a-z0-9]+)*', str(ref.get('key', ''))):
                raise ValueError('원본 DB 연결 코드 형식이 아닙니다: ' + str(slot))
            refs[slot] = {'key': ref['key'], 'blocked': [c for c in ref.get('blocked') or [] if re.fullmatch(r'B\d', str(c))]}
        book['refs'] = refs
    out = {'format': 'jo9-talkbook', 'version': 1, 'id': int(sid), 'name': data.get('seed_name', ''),
           'jsonFile': filename.name, **book}
    raw = json.dumps(out, ensure_ascii=False, indent=1)
    if len(raw) > 2_000_000:
        raise ValueError('대사집이 너무 큽니다(2MB 이하).')
    return out, raw.encode('utf-8')


def save_slave_talkbook(editor, sid, body, check_plain):
    """Caller holds the studio lock. One transaction writes JSON plus its sidecar."""
    apply_background = body.get('applyBackground') is True
    if apply_background and not body.get('revision'):
        raise ValueError('캐릭터를 다시 불러온 뒤 배경 분류를 저장하세요.')
    editor._check_revision('slave', sid, body.get('revision'))
    filename, data = editor.slave(sid)
    incoming = body.get('book')
    if not isinstance(incoming, dict):
        raise ValueError('대사집은 객체여야 합니다.')
    updated = dict(data)
    if apply_background:
        background = incoming.get('background', {})
        updated.update(seed_values(background))
        # Background autosaves retain persisted dialogue; unsaved dialogue remains in the UI.
        previous = editor.read_slave_talk(sid) or {}
        incoming = {key: value for key, value in previous.items() if key not in BOOK_HEADER}
        incoming['background'] = copy.deepcopy(background)
    book, raw = _book(sid, updated, filename, incoming, check_plain)
    talk_path = editor.root / 'jo9_talkbook' / (str(int(sid)) + '.json')
    changes = [{'key': key, 'before': data.get(key), 'after': updated[key]}
               for key in SEED_KEYS if data.get(key) != updated.get(key) or (key in data) != (key in updated)]
    if not body.get('dryRun'):
        payloads = {talk_path: raw}
        if changes:
            payloads[filename] = json.dumps(updated, ensure_ascii=False, indent=4).encode('utf-8')
        editor._write(payloads)
    return {'id': int(sid), 'path': talk_path.relative_to(editor.root).as_posix(), 'exists': True,
            'book': book, 'revision': editor.slave_revision(sid), 'noAutoGenerate': False,
            'appliedBackground': apply_background, 'changes': changes, 'dryRun': bool(body.get('dryRun'))}
