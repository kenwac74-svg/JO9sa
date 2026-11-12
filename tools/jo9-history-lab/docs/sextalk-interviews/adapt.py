# 인터뷰 대답의 현대 소재를 찾아 세계별 각색 등급(A0~A3)을 매기고, 치환 미리보기를 만드는 각색 도구
# 사용: python3 -I adapt.py <키> <세계id>   (예: p0000.q19 medieval)
import sys, re, json, pathlib

HERE = pathlib.Path(__file__).resolve().parent
DICT = json.load(open(HERE / 'adapt-dict.json', encoding='utf-8'))
USER_WORLDS = set(DICT.get('userAuthoredWorlds', []))
# 사용자가 직접 쓴 각색 문장(Claude는 쓰지 않는다)
USER_TEXT = json.load(open(HERE / 'adapt-user.json', encoding='utf-8'))['entries']
WORLDS = DICT['worlds']
# 단어 앞이 한글이면 다른 낱말의 일부로 본다(예: '바지'의 '바', '사진기'는 허용)
PATTERNS = {k: re.compile(r'(?<![가-힣])(' + v['match'] + ')') for k, v in DICT['categories'].items()}
GRADE = {'U': '사용자 각색 대상(성윤리·생활환경이 달라 자동 출력 안 함)', 'A0': '현대 소재 없음(그대로)', 'A1': '사전 치환', 'A2': '문장 각색 필요', 'A3': '그 세계에 없는 소재(그 세계 노예에게 쓰지 않음)'}


def categories_of(text):
    return [k for k, p in PATTERNS.items() if p.search(text)]


def grade(cats, world):
    if world in USER_WORLDS:
        return 'U'
    if world == 'modern' or not cats:
        return 'A0'
    vals = [DICT['categories'][c]['to'][world] for c in cats]
    if any(v is None for v in vals):
        return 'A3'
    if any(isinstance(v, dict) for v in vals):
        return 'A2'
    return 'A1'


def grades(text):
    """세계 순서대로 등급을 이은 13자 문자열(U 또는 0~3)과 소재 목록."""
    cats = categories_of(text)
    return cats, ''.join(grade(cats, w)[-1] for w in WORLDS)


PAIRS = [('과', '와'), ('을', '를'), ('이', '가'), ('은', '는'), ('으로', '로')]


def has_batchim(word):
    ch = word.rstrip()[-1]
    return '가' <= ch <= '힣' and (ord(ch) - 0xAC00) % 28 != 0


def fix_particles(text, word):
    """치환한 말 바로 뒤의 조사를 받침에 맞춘다(과/와, 을/를, 이/가, 은/는, 으로/로)."""
    b = has_batchim(word)
    for with_b, without_b in PAIRS:
        want, wrong = (with_b, without_b) if b else (without_b, with_b)
        text = re.sub(re.escape(word) + wrong + r'(?![가-힣])', word + want, text)
    return text


def preview(text, world):
    cats = categories_of(text)
    g = grade(cats, world)
    if g == 'U':
        return g, None, []
    out = text
    notes = []
    for c in cats:
        v = DICT['categories'][c]['to'][world]
        if isinstance(v, str):
            out = PATTERNS[c].sub(v, out)
            out = fix_particles(out, v)
        elif isinstance(v, dict):
            notes.append(f'{DICT["categories"][c]["label"]}: {v["rewrite"]}')
    return g, out, notes


if __name__ == '__main__':
    key, world = sys.argv[1], sys.argv[2]
    rows = {r['id']: r for r in json.load(open(HERE / 'interview-db.json', encoding='utf-8'))['rows']}
    r = rows[key]
    if not r['display']:
        print('[이 대사는 표시 불가합니다.]'); sys.exit(0)
    g, out, notes = preview(r['answer'], world)
    print(f'{key} / {DICT["worldLabels"][world]} / {g} {GRADE[g]}')
    if g == 'U':
        u = USER_TEXT.get(key, {}).get(world)
        print(u if u else '(사용자 각색 문장 없음: adapt-user.json에 직접 쓴다)')
        sys.exit(0)
    print(out)
    for n in notes:
        print('  각색:', n)
