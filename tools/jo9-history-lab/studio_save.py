# 세이브 정비: QSP 5.7 세이브(.sav)를 바이트 왕복 보존으로 읽고, 업데이트로 어긋난 이미지 경로를 찾아 고친 새 세이브를 만든다(원본은 덮어쓰지 않음)
# 형식은 tools/qa/save-codec.cjs와 같다: UTF-16LE 줄, 각 줄은 글자마다 -5 이동, 변수 = 이름·값 [숫자, 문자열] 목록·문자열 키 색인.
import os
import re

CHAR_KEYS = ('FULLIMAGE', 'AVA', 'AVA_GRAY', 'AVA_CLEAR')
FACE_SEED = {'AVA_CLEAR': 'seed_ava_clear', 'AVA_GRAY': 'seed_ava_gray', 'AVA': 'seed_ava'}
PATH_RE = re.compile(r"(?:content[\\/]+pic[\\/]+|girls/)[^'\"<>()\r\n]*?(?:\.(?:png|jpe?g|gif|webp)|(?=['\")]|$))", re.I)


def _dec(s):
    return ''.join(chr((ord(c) + 5) & 0xFFFF) for c in s)


def _enc(s):
    return ''.join(chr((ord(c) - 5) & 0xFFFF) for c in str(s))


def parse(raw):
    lines = raw.decode('utf-16-le').split('\r\n')
    if '\r\n'.join(lines).encode('utf-16-le') != raw:
        raise ValueError('세이브 왕복 검사 실패: 읽고 다시 쓴 결과가 원본과 다릅니다.')
    if lines[0] != 'QSPSAVEDGAME' or lines[1] != '5.7.0':
        raise ValueError('지원하지 않는 세이브 형식입니다(QSP 5.7 세이브가 아님).')
    p = 17
    p += int(_dec(lines[16]))
    p += 1 + int(_dec(lines[p]))
    ac = int(_dec(lines[p])); p += 1
    for _ in range(ac):
        p += 2
        n = int(_dec(lines[p])); p += 1
        p += 2 * n + 4
    ob = int(_dec(lines[p])); p += 1
    p += ob * 2
    start = p
    count = int(_dec(lines[p])); p += 1
    variables = []
    for _ in range(count):
        slot = _dec(lines[p]); name = _dec(lines[p + 1]); n = int(_dec(lines[p + 2])); p += 3
        values = []
        for _ in range(n):
            values.append([_dec(lines[p]), _dec(lines[p + 1])]); p += 2
        ni = int(_dec(lines[p])); p += 1
        idx = []
        for _ in range(ni):
            idx.append([int(_dec(lines[p])), _dec(lines[p + 1])]); p += 2
        variables.append({'slot': slot, 'name': name, 'values': values, 'idx': idx})
    if p != len(lines) - 1 or lines[p] != '':
        raise ValueError('세이브를 끝까지 읽지 못했습니다.')
    return {'lines': lines, 'start': start, 'vars': variables}


def serialize(save):
    out = save['lines'][:save['start']]
    out.append(_enc(len(save['vars'])))
    for v in save['vars']:
        out += [_enc(v['slot']), _enc(v['name']), _enc(len(v['values']))]
        for num, text in v['values']:
            out += [_enc(num), _enc(text)]
        out.append(_enc(len(v['idx'])))
        for at, key in v['idx']:
            out += [_enc(at), _enc(key)]
    out.append('')
    return '\r\n'.join(out).encode('utf-16-le')


def keyed(v, key):
    """문자열 키 값의 위치. 없으면 None."""
    for at, k in v['idx']:
        if k == key:
            return at
    return None


def _exists(root, reference):
    """세이브 속 이미지 참조가 게임 폴더에 있는가. content/pic/ 또는 girls/ 로 시작하는 두 표기, 확장자 생략을 모두 받는다."""
    ref = reference.replace('\\', '/').strip()
    if not ref:
        return True
    rel = ref if ref.lower().startswith('content/pic/') else 'content/pic/' + ref
    if not os.path.splitext(rel)[1]:
        rel += '.png'
    target = os.path.realpath(os.path.join(root, *rel.split('/')))
    base = os.path.realpath(root)
    if os.path.commonpath([base, target]) != base:
        return False
    return os.path.isfile(target)


def characters(save):
    """캐릭터를 담은 변수(전신·얼굴 키가 있는 것): SLAVE, ASSISTANT, ROOM*, ICED_*, PRISONER 등.
    캐릭터 번호는 '<칸>_TYPE'(숫자), 이름은 '<칸>_NAME'(문자열) 변수에 있다. SLAVE1처럼 _TYPE이 없는 칸은 계산용 임시 사본이다."""
    single = {v['name']: v['values'][0] for v in save['vars'] if v['values'] and not v['idx']}
    out = []
    for i, v in enumerate(save['vars']):
        if keyed(v, 'FULLIMAGE') is None:
            continue
        get = lambda k: (v['values'][keyed(v, k)] if keyed(v, k) is not None and keyed(v, k) < len(v['values']) else ['0', ''])
        kind = single.get(v['name'] + '_TYPE')
        out.append({'var': i, 'name': v['name'], 'id': int(kind[0] or 0) if kind else 0, 'temp': kind is None,
                    'label': (single.get(v['name'] + '_NAME') or ['', ''])[1],
                    'images': {k: get(k)[1] for k in CHAR_KEYS if keyed(v, k) is not None}})
    return out


def scan(save, root, slave_json=None):
    """버전 불일치 점검: 캐릭터 이미지 경로와 그 밖의 화면 이미지 경로 중 게임 폴더에 없는 것을 찾고, 고칠 값을 제안한다.
    slave_json(id) → 현재 캐릭터 JSON(dict) 또는 None."""
    index = None

    def by_name(reference):
        nonlocal index
        if index is None:
            index = {}
            pic = os.path.join(root, 'content', 'pic')
            for d, _dirs, files in os.walk(pic):
                for f in files:
                    index.setdefault(f.lower(), []).append(os.path.relpath(os.path.join(d, f), root).replace(os.sep, '/'))
        name = os.path.basename(reference.replace('\\', '/'))
        if not os.path.splitext(name)[1]:
            name += '.png'
        found = index.get(name.lower(), [])
        return found[0] if len(found) == 1 else None

    chars, fixes = [], []
    for c in characters(save):
        data = slave_json(c['id']) if (slave_json and c['id']) else None
        row = {**c, 'json': bool(data), 'status': {}}
        for key, ref in c['images'].items():
            ok = _exists(root, ref)
            row['status'][key] = ok
            if ok:
                continue
            suggestion, how = None, ''
            field = 'fullimage' if key == 'FULLIMAGE' else FACE_SEED[key]
            if data and data.get(field) and _exists(root, data[field]):
                suggestion, how = data[field], '같은 번호의 캐릭터 JSON'
            elif by_name(ref):
                found = by_name(ref)
                suggestion, how = (found[len('content/pic/'):] if key == 'FULLIMAGE' and not ref.startswith('content') else found), '같은 파일 이름'
            fixes.append({'var': c['var'], 'name': c['name'], 'id': c['id'], 'key': key, 'old': ref, 'new': suggestion, 'how': how})
        chars.append(row)
    # 캐릭터 밖의 이미지 경로(메뉴 아이콘 등): 문자열 안의 경로마다 파일이 있는지 본다
    ui, seen = [], set()
    char_vars = {c['var'] for c in chars}
    for i, v in enumerate(save['vars']):
        if i in char_vars or v['name'].startswith('SEED_') or v['name'] in ('FULLIMAGE',):
            continue
        for j, (_num, text) in enumerate(v['values']):
            for m in PATH_RE.finditer(text or ''):
                ref = m.group(0)
                if (i, j, ref) in seen or _exists(root, ref):
                    continue
                seen.add((i, j, ref))
                found = by_name(ref)
                ui.append({'var': i, 'name': v['name'], 'at': j, 'old': ref,
                           'new': (found if ref.lower().startswith('content') else found[len('content/pic/'):]) if found else None,
                           'how': '같은 파일 이름' if found else ''})
    return {'characters': chars, 'fixes': fixes, 'ui': ui}


def apply(save, fixes):
    """고칠 목록 적용. fixes = [{var, key} → 캐릭터 키 값 교체 | {var, at, old, new} → 문자열 안 경로 교체]."""
    done = 0
    for f in fixes:
        v = save['vars'][int(f['var'])]
        if f.get('key'):
            at = keyed(v, f['key'])
            if at is None or v['values'][at][1] != f['old']:
                raise ValueError('세이브 값이 예상과 다릅니다: %s %s' % (v['name'], f['key']))
            v['values'][at][1] = f['new']
        else:
            at = int(f['at'])
            text = v['values'][at][1]
            if f['old'] not in text:
                raise ValueError('세이브 값이 예상과 다릅니다: %s[%d]' % (v['name'], at))
            v['values'][at][1] = text.replace(f['old'], f['new'])
        done += 1
    return done
