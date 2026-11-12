# 인터뷰 대답의 번역 파일(언어별, 같은 키)과 글로서리를 만들고 동기화·기록·검사하며, 게임 json용 문자열 키 파일을 내보내는 도구
# 사용: python3 -I i18n-tools.py init|sync|set|status|check|glossary|game-export ...   (자세한 것은 I18N_KO.md)
import argparse, hashlib, json, os, pathlib, re, sys, datetime

HERE = pathlib.Path(__file__).resolve().parent
DIR = HERE / 'i18n'
STATUS = ['untranslated', 'machine', 'verified', 'source_changed']
RANK = {'machine': 1, 'verified': 2}  # game-export 최소 등급 비교용
LANG = re.compile(r'^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$')
KEY = re.compile(r'^p\d{4}\.q\d{2}(\.\d+)?\.s\d{2}$')


def sha(t):
    return hashlib.sha256(t.encode('utf-8')).hexdigest()[:12]


def source_parts():
    """번역 대상 = 표시 가능한 대답의 부분(sNN). 표시불가(B1·B2 포함)는 번역 목록에 넣지 않는다."""
    db = json.loads((HERE / 'interview-db.json').read_text(encoding='utf-8'))
    return {p['key']: p['text'] for r in db['rows'] if r['display'] and not r['text_withheld'] for p in r['parts']}, db


def write(path, data):
    path.parent.mkdir(exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1, sort_keys=True) + '\n', encoding='utf-8', newline='\n')
    os.replace(tmp, path)


def load_lang(lang):
    path = DIR / f'{lang}.json'
    if not path.is_file():
        sys.exit(f'{lang}.json이 없습니다. 먼저 init {lang}')
    return path, json.loads(path.read_text(encoding='utf-8'))


def check_lang(lang):
    if not LANG.match(lang) or lang == 'ko':
        sys.exit('언어 코드는 en, ja, zh-Hans 같은 형식(원문 ko 제외)')


def cmd_init(a):
    check_lang(a.lang)
    if (DIR / f'{a.lang}.json').exists():
        sys.exit('이미 있습니다. 새 키는 sync로 반영합니다.')
    write(DIR / f'{a.lang}.json', {'schema': 'jo9-sextalk-i18n/v1', 'lang': a.lang, 'source': 'ko', 'entries': {}})
    cmd_sync(a)


def cmd_sync(a):
    """원문(interview-db)과 맞춘다: 새 부분은 untranslated로 추가, 원문이 바뀐 번역은 source_changed(번역문은 보존), 없어진 키는 지우지 않고 알린다."""
    path, data = load_lang(a.lang)
    src, _ = source_parts()
    ent, added, changed = data['entries'], 0, 0
    for k, t in src.items():
        e = ent.get(k)
        if e is None:
            ent[k] = {'status': 'untranslated', 'srcSha': sha(t), 'text': ''}; added += 1
        elif e['srcSha'] != sha(t):
            if e['status'] != 'source_changed':
                e['prevStatus'] = e['status']
            e['status'] = 'source_changed'; e['srcSha'] = sha(t); changed += 1
    orphans = sorted(set(ent) - set(src))
    write(path, data)
    print(f'{a.lang}: 추가 {added} · 원문 변경 {changed} · 원문에서 사라진 키 {len(orphans)}(지우지 않음)')


def cmd_set(a):
    path, data = load_lang(a.lang)
    src, _ = source_parts()
    if a.key not in src:
        sys.exit('번역 대상이 아닌 키입니다(없는 키이거나 표시불가).')
    if a.status not in ('machine', 'verified'):
        sys.exit('status는 machine 또는 verified')
    if a.status == 'machine' and not a.model:
        sys.exit('기계 번역은 --model 로 모델을 기록해야 합니다.')
    if len(a.text) > 2000:
        sys.exit('2000자 이하')
    data['entries'][a.key] = {'status': a.status, 'srcSha': sha(src[a.key]), 'text': a.text, 'date': datetime.date.today().isoformat(), **({'model': a.model} if a.model else {})}
    write(path, data)
    print('저장', a.key, a.status)


def cmd_status(a):
    langs = [a.lang] if a.lang else sorted(p.stem for p in DIR.glob('*.json') if p.stem != 'glossary')
    src, _ = source_parts()
    for lang in langs:
        _, data = load_lang(lang)
        c = {s: 0 for s in STATUS}
        for e in data['entries'].values():
            c[e['status']] += 1
        print(lang, f'원문 {len(src)}', c)


def cmd_check(a):
    errors = []
    src, db = source_parts()
    for p in sorted(DIR.glob('*.json')):
        if p.stem == 'glossary':
            continue
        data = json.loads(p.read_text(encoding='utf-8'))
        if data.get('lang') != p.stem or data.get('source') != 'ko':
            errors.append(f'{p.name}: lang·source 칸 오류')
        for k, e in data['entries'].items():
            if not KEY.match(k):
                errors.append(f'{p.name} {k}: 키가 숫자 번호·형식 밖(문자열 키 p0000.q00.s00만)')
            if k not in src:
                errors.append(f'{p.name} {k}: 번역 대상이 아닌 키(표시불가이거나 원문에서 사라짐)')
            if e.get('status') not in STATUS:
                errors.append(f'{p.name} {k}: 알 수 없는 상태 {e.get("status")}')
            elif e['status'] in ('machine', 'verified') and not e.get('text'):
                errors.append(f'{p.name} {k}: 번역문이 비어 있는데 상태가 {e["status"]}')
            if e.get('status') == 'machine' and not e.get('model'):
                errors.append(f'{p.name} {k}: 기계 번역인데 모델 기록 없음')
            if k in src and e.get('status') != 'source_changed' and e.get('srcSha') != sha(src[k]):
                errors.append(f'{p.name} {k}: 원문이 바뀌었는데 source_changed가 아님(sync 실행)')
        missing = set(src) - set(data['entries'])
        if missing:
            errors.append(f'{p.name}: 원문 부분 {len(missing)}개가 목록에 없음(sync 실행)')
    g = DIR / 'glossary.json'
    if g.is_file():
        gl = json.loads(g.read_text(encoding='utf-8'))
        for tid, t in gl['terms'].items():
            if not re.match(r'^[a-z][a-z0-9_]*$', tid):
                errors.append(f'glossary {tid}: 용어 id는 영문 소문자 문자열')
            if not t.get('ko'):
                errors.append(f'glossary {tid}: 한국어 원말 없음')
    for e in errors[:50]:
        print('오류', e)
    print('통과' if not errors else f'오류 {len(errors)}개')
    sys.exit(1 if errors else 0)


def cmd_glossary(a):
    """글로서리 1개(i18n/glossary.json). 없으면 바꿀 말 사전(adapt-dict.json)의 소재 이름으로 한국어 원말만 채워 만든다. term 추가·번역 입력도 여기서 한다."""
    g = DIR / 'glossary.json'
    if not g.is_file():
        cats = json.loads((HERE / 'adapt-dict.json').read_text(encoding='utf-8'))['categories']
        write(g, {'schema': 'jo9-sextalk-glossary/v1', 'source': 'ko', 'terms': {k: {'ko': v['label'], 'note': '바꿀 말 사전 소재 이름', 'langs': {}} for k, v in cats.items()}})
        print('만듦', len(cats), '항목')
        return
    data = json.loads(g.read_text(encoding='utf-8'))
    if a.term:
        t = data['terms'].setdefault(a.term, {'ko': a.ko or '', 'note': '', 'langs': {}})
        if a.ko:
            t['ko'] = a.ko
        if a.lang and a.text:
            t['langs'][a.lang] = a.text
        write(g, data)
    print(json.dumps(data['terms'] if not a.term else {a.term: data['terms'][a.term]}, ensure_ascii=False, indent=1))


def cmd_game_export(a):
    """게임 json용 평면 파일 {문자열 키: 번역문}. machine 이상(--min verified로 확인된 것만)만 내보낸다. 숫자 번호 키는 쓰지 않는다."""
    _, data = load_lang(a.lang)
    need = RANK[a.min]
    out = {k: e['text'] for k, e in sorted(data['entries'].items()) if RANK.get(e['status'], 0) >= need and e['text']}
    outp = pathlib.Path(a.out)
    outp.parent.mkdir(parents=True, exist_ok=True)
    outp.write_text(json.dumps(out, ensure_ascii=False, indent=0) + '\n', encoding='utf-8', newline='\n')
    print(f'{len(out)}개 → {outp}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest='cmd', required=True)
    for n, f in (('init', cmd_init), ('sync', cmd_sync)):
        p = sub.add_parser(n); p.add_argument('lang'); p.set_defaults(f=f)
    p = sub.add_parser('set'); p.add_argument('lang'); p.add_argument('key'); p.add_argument('text')
    p.add_argument('--status', default='machine'); p.add_argument('--model'); p.set_defaults(f=cmd_set)
    p = sub.add_parser('status'); p.add_argument('lang', nargs='?'); p.set_defaults(f=cmd_status)
    sub.add_parser('check').set_defaults(f=cmd_check)
    p = sub.add_parser('glossary'); p.add_argument('--term'); p.add_argument('--ko'); p.add_argument('--lang'); p.add_argument('--text'); p.set_defaults(f=cmd_glossary)
    p = sub.add_parser('game-export'); p.add_argument('lang'); p.add_argument('out'); p.add_argument('--min', default='machine', choices=['machine', 'verified']); p.set_defaults(f=cmd_game_export)
    a = ap.parse_args()
    a.f(a)
