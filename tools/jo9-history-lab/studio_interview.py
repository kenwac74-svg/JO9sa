# 편집기 'DB' 탭용 인터뷰 대답 검색·각색 문장 저장(사용자가 화면에서 쓴 문장만 adapt-user.json에 기록)
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = Path(os.environ.get('JO9_REPO_ROOT') or HERE.parent.parent)
# 단독 실행기에는 DB가 없으므로 repo(--repo)의 것을 쓴다
DIRS = [HERE / 'docs' / 'sextalk-interviews', REPO / 'tools' / 'jo9-history-lab' / 'docs' / 'sextalk-interviews']
_cache = {}


def db_dir():
    d = next((x for x in DIRS if (x / 'interview-db.json').is_file()), None)
    if d is None:
        raise FileNotFoundError('인터뷰 DB(interview-db.json)를 찾지 못했습니다. 편집기를 repo에서 실행하거나 --repo를 지정하세요.')
    return d


def _load(name):
    path = db_dir() / name
    stamp = path.stat().st_mtime_ns if path.is_file() else None
    hit = _cache.get(name)
    if hit and hit[0] == stamp:
        return hit[1]
    data = json.loads(path.read_text(encoding='utf-8')) if stamp else None
    _cache[name] = (stamp, data)
    return data


def _adapt():
    d = str(db_dir())
    if d not in sys.path:
        sys.path.insert(0, d)
    import adapt  # noqa: E402  치환 미리보기(adapt.py)
    return adapt


def _index():
    db = _load('interview-db.json')
    hit = _cache.get('_index')
    if hit and hit[0] is db:
        return hit[1]
    idx = {'rows': {r['id']: r for r in db['rows']}}
    posts = _load('posts-db.json')
    idx['posts'] = {p['id']: p for p in posts['posts']} if posts else {}
    _cache['_index'] = (db, idx)
    return idx


def meta():
    db, adict = _load('interview-db.json'), _load('adapt-dict.json')
    m = db['meta']
    return {'topics': m['topics'], 'worlds': adict['worlds'], 'worldLabels': adict['worldLabels'],
            'userWorlds': adict.get('userAuthoredWorlds', []), 'grades': m['adapt']['grades'],
            'blockCodes': m['block_codes'], 'rows': m['rows'], 'posts': m['posts'],
            'hasPosts': _load('posts-db.json') is not None}


def _user_text():
    u = _load('adapt-user.json')
    return u['entries'] if u else {}


def _slim(r, idx):
    post = idx['posts'].get(r['post'], {})
    # 표시불가(display false) 대답은 원문 대신 자리표시를 낸다. B1·B2는 DB에도 원문이 없다
    shown = r['display']
    return {'id': r['id'], 'post': r['post'], 'q': r['q'], 'topic': r['topic'], 'display': shown, 'game': r['game'],
            'block': r['block'], 'withheld': r['text_withheld'], 'answer': r['answer'] if shown else _placeholder(),
            'adapt': r.get('adapt', ''), 'modern': r.get('modern', []), 'tone': r.get('tone', []),
            'title': post.get('title', ''), 'date': post.get('date', ''), 'url': r['src']['url'],
            'hasUser': r['id'] in _user_text()}


def _placeholder():
    return _load('interview-db.json')['meta']['placeholder']


def search(query):
    """query: 쿼리스트링. q(글자)·topic·world+grade·block·shown(1=표시 가능만)·offset·limit."""
    from urllib.parse import parse_qs
    p = {k: v[0] for k, v in parse_qs(query).items()}
    idx, adapt = _index(), _adapt()
    q = p.get('q', '').strip()
    topic, block, world, grade = p.get('topic', ''), p.get('block', ''), p.get('world', ''), p.get('grade', '')
    wi = adapt.WORLDS.index(world) if world in adapt.WORLDS else None
    user = _user_text()
    out = []
    for r in _load('interview-db.json')['rows']:
        if topic and r['topic'] != topic:
            continue
        if p.get('shown') == '1' and not r['display']:
            continue
        if block == 'none' and r['block']:
            continue
        if block and block != 'none' and block not in r['block']:
            continue
        if wi is not None and grade and r.get('adapt', '')[wi:wi + 1] != grade:
            continue
        if p.get('mine') == '1' and r['id'] not in user:
            continue
        # 글자 검색은 표시 가능한 원문만 본다(표시불가·자리표시 대답은 글자로 찾지 않는다)
        if q and not (r['display'] and not r['text_withheld'] and q in r['answer']) and q not in r['id']:
            continue
        out.append(r)
    offset = max(0, int(p.get('offset', 0) or 0))
    limit = min(100, max(1, int(p.get('limit', 30) or 30)))
    return {'total': len(out), 'offset': offset, 'items': [_slim(r, idx) for r in out[offset:offset + limit]]}


def row(key):
    idx, adapt = _index(), _adapt()
    r = idx['rows'].get(key)
    if r is None:
        raise LookupError('없는 키입니다: ' + key)
    item = _slim(r, idx)
    post = idx['posts'].get(r['post'], {})
    qa = next((x for x in post.get('qa', []) if x['key'] == key), {})
    item['question'] = qa.get('question', '')
    item['parts'] = [{'key': pt['key'], 'text': pt.get('text', '')} for pt in r['parts']] if r['display'] and not r['text_withheld'] else []
    item['user'] = _user_text().get(key, {})
    # 바꿀 말 제안: 사전으로 바꾼 결과(A1)와 문장을 다시 써야 할 소재 설명(A2). 사용자 각색 세계(U)는 제안하지 않는다
    sug = {}
    if r['display'] and not r['text_withheld'] and r['answer']:
        for w in adapt.WORLDS:
            g, text, notes = adapt.preview(r['answer'], w)
            sug[w] = {'grade': g, 'text': text, 'notes': notes}
    item['suggest'] = sug
    return item


def save_adapt(body):
    """사용자가 화면에서 쓴 각색 문장을 adapt-user.json에 저장한다. 빈 문장이면 그 칸을 지운다."""
    key, world, text = body.get('key'), body.get('world'), body.get('text', '')
    idx = _index()
    if key not in idx['rows']:
        raise ValueError('없는 키입니다.')
    if world not in _load('adapt-dict.json')['worlds']:
        raise ValueError('없는 세계입니다.')
    if not isinstance(text, str) or len(text) > 2000:
        raise ValueError('문장은 2000자 이하 글자여야 합니다.')
    path = db_dir() / 'adapt-user.json'
    data = json.loads(path.read_text(encoding='utf-8'))
    entries = data.setdefault('entries', {})
    text = text.strip()
    if text:
        entries.setdefault(key, {})[world] = text
    else:
        entries.get(key, {}).pop(world, None)
        if key in entries and not entries[key]:
            del entries[key]
    tmp = path.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    os.replace(tmp, path)
    return {'ok': True, 'user': entries.get(key, {})}
