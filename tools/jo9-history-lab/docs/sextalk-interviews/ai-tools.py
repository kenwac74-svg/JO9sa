# AI 작업용 주제별 JSONL을 interview-db.json에서 생성·검사하고 조회하는 도구(JSONL은 원본에서만 만들고 손으로 고치지 않는다)
# 사용: python3 -I ai-tools.py export|check|query ...   (자세한 것은 AI_WORK_SCHEMA_KO.md)
import argparse, hashlib, json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / 'ai'
SCHEMA = 'jo9-sextalk-ai-rows/v1'
# 행에서 AI 작업에 필요한 칸만 옮긴다. 값은 interview-db.json·posts-db.json 그대로다
KEEP = ['id', 'post', 'q', 'topic', 'answer', 'len', 'tone', 'modern', 'adapt', 'nums', 'game', 'display', 'block']


def load():
    db = json.loads((HERE / 'interview-db.json').read_text(encoding='utf-8'))
    pj = HERE / 'posts-db.json'
    questions = {}
    if pj.is_file():
        for p in json.loads(pj.read_text(encoding='utf-8'))['posts']:
            for x in p['qa']:
                questions[x['key']] = x['question']
    return db, questions


def build():
    """주제별 줄 목록을 만든다. 모든 대답(5,112개)을 넣는다(2026-11-13 지침 CLAUDE_POLICY_GUIDE_KO.md).
    저장소 DB에 원문이 없는 대답(text_withheld, 원문은 fetch_originals.py로 사용자 PC에만 가져옴)과 빈 대답만 뺀다. 게임 표시불가(display false)는 칸으로 남긴다."""
    db, questions = load()
    files, excluded = {}, 0
    topics = db['meta']['topics']
    for r in db['rows']:
        if r['text_withheld'] or not r['answer'].strip():
            excluded += 1
            continue
        row = {k: r[k] for k in KEEP if k in r}
        row['question'] = questions.get(r['id'], '')
        row['parts'] = [{'key': p['key'], 'text': p.get('text', '')} for p in r['parts']]
        name = f'{[int(n) for n, t in topics.items() if t == r["topic"]][0]:02d}_{r["topic"]}.jsonl' if r['topic'] in topics.values() else 'extra.jsonl'
        files.setdefault(name, []).append(json.dumps(row, ensure_ascii=False, sort_keys=True))
    text = {n: '\n'.join(v) + '\n' for n, v in sorted(files.items())}
    index = {'schema': SCHEMA, 'source': 'interview-db.json', 'sourceRows': len(db['rows']), 'rows': sum(len(v) for v in files.values()), 'excluded': excluded,
             'note': '원문이 있는 모든 대답을 담는다(빈 대답과 저장소에 원문이 없는 대답 제외). display=false는 게임 표시불가 표시다. 파일은 ai-tools.py export로만 만든다.',
             'worlds': load_worlds(), 'files': {n: {'rows': t.count('\n'), 'sha256': hashlib.sha256(t.encode('utf-8')).hexdigest()} for n, t in text.items()}}
    text['index.json'] = json.dumps(index, ensure_ascii=False, indent=1) + '\n'
    return text


def load_worlds():
    return json.loads((HERE / 'adapt-dict.json').read_text(encoding='utf-8'))['worlds']


def cmd_export(_):
    text = build()
    OUT.mkdir(exist_ok=True)
    for old in OUT.glob('*.jsonl'):
        old.unlink()
    for n, t in text.items():
        (OUT / n).write_text(t, encoding='utf-8', newline='\n')
    print(len(text) - 1, '파일', json.loads(text['index.json'])['rows'], '줄')


def cmd_check(_):
    """파일이 원본에서 다시 만든 결과와 같은지, 줄 형식과 금지 내용이 없는지 검사한다."""
    errors = []
    want = build()
    have = {p.name: p.read_text(encoding='utf-8') for p in OUT.glob('*') if p.suffix in ('.jsonl', '.json')}
    if set(want) != set(have):
        errors.append(f'파일 목록이 다름: 없음 {sorted(set(want) - set(have))} 남음 {sorted(set(have) - set(want))}')
    for n in set(want) & set(have):
        if want[n] != have[n]:
            errors.append(f'{n}: 원본에서 다시 만든 결과와 다름(ai-tools.py export를 다시 실행)')
    db, _ = load()
    ids = {r['id']: r for r in db['rows']}
    placeholder = db['meta']['placeholder']
    seen = set()
    for n, t in have.items():
        if not n.endswith('.jsonl'):
            continue
        for i, line in enumerate(t.splitlines(), 1):
            try:
                row = json.loads(line)
            except ValueError:
                errors.append(f'{n}:{i} JSON 오류'); continue
            r = ids.get(row.get('id'))
            if r is None:
                errors.append(f'{n}:{i} DB에 없는 키 {row.get("id")}'); continue
            if row['id'] in seen:
                errors.append(f'{n}:{i} 중복 키 {row["id"]}')
            seen.add(row['id'])
            if r['text_withheld'] or row['answer'] == placeholder or not row['answer'].strip():
                errors.append(f'{n}:{i} 원문 미수록·빈 대답이 들어 있음 {row["id"]}')
            if row['answer'] != r['answer'] or row['topic'] != r['topic']:
                errors.append(f'{n}:{i} 원본과 값이 다름 {row["id"]}')
            if not n.startswith(f'{[k for k, v in db["meta"]["topics"].items() if v == row["topic"]][0].zfill(2)}_'):
                errors.append(f'{n}:{i} 파일과 주제가 안 맞음 {row["id"]}')
    expect = {r['id'] for r in db['rows'] if r['answer'].strip() and not r['text_withheld']}
    if seen != expect:
        errors.append(f'빈 대답 아닌 대답 {len(expect)}개 중 빠진 것 {len(expect - seen)}개, 넘친 것 {len(seen - expect)}개')
    for e in errors[:50]:
        print('오류', e)
    print('통과' if not errors else f'오류 {len(errors)}개', '·', len(seen), '줄')
    sys.exit(1 if errors else 0)


def cmd_query(a):
    rows = []
    for p in sorted(OUT.glob('*.jsonl')):
        for line in p.read_text(encoding='utf-8').splitlines():
            rows.append(json.loads(line))
    worlds = load_worlds()
    if a.world and a.world not in worlds:
        sys.exit('세계는 ' + ', '.join(worlds) + ' 중 하나')
    out = []
    for r in rows:
        if a.key and r['id'] != a.key:
            continue
        if a.topic and r['topic'] != a.topic:
            continue
        if a.grep and a.grep not in r['answer']:
            continue
        if a.world and a.grade and r['adapt'][worlds.index(a.world)] != a.grade:
            continue
        out.append(r)
    for r in out[:a.limit]:
        print(json.dumps(r, ensure_ascii=False) if a.json else f'{r["id"]}\t{r["topic"]}\t{r["answer"][:80]!r}')
    print(f'-- {len(out)}개 중 {min(len(out), a.limit)}개', file=sys.stderr)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('export').set_defaults(f=cmd_export)
    sub.add_parser('check').set_defaults(f=cmd_check)
    q = sub.add_parser('query'); q.set_defaults(f=cmd_query)
    q.add_argument('--key'); q.add_argument('--topic'); q.add_argument('--grep'); q.add_argument('--world'); q.add_argument('--grade', help='U 또는 0~3')
    q.add_argument('--limit', type=int, default=20); q.add_argument('--json', action='store_true')
    a = ap.parse_args()
    a.f(a)
