# 승인된 질문 메뉴 원고를 게임에 넣을 수 있는 데이터(새 조각, 태그 변경, 색인 추가)로 계산하는 도구. QSP는 바꾸지 않는다
"""사용법: python tools/question_build_data.py [qsp 경로] [출력 폴더]
출력: question_build_data.json (모드 개발 핸드오프용), 요약은 표준 출력"""
import collections, json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from qsp_dump import read_locations  # noqa: E402

QSP = sys.argv[1] if len(sys.argv) > 1 else 'assets/runtime/2.4.1/jack.qsp'
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'docs/dialogue-rules/handoff/build')
BASE = Path('docs/dialogue-rules/question-fill')
FILES = ['q1111', 'q1112', 'q1113', 'q1114', 'q1115', 'q1116', 'q1117', 'qcommon']
VTYPES = {'순한': ['meek', 'fragile'], '담백한': ['plain'], '도도한': ['proud', 'ice'], '조용한': ['doll', 'calm'],
          '명랑한': ['frank'], '거센': ['flame'], '공주': ['princess']}
VTONE = {'순한': 2, '담백한': 2, '도도한': 1, '조용한': 1, '명랑한': 3, '거센': 3, '공주': 3}
TYPE_TONE = {t: VTONE[v] for v, ts in VTYPES.items() for t in ts}
CELL = {'움츠림': '|fearful|bleak|', '순함': '|hopeful|neutral|', '따름(복종)': '|duty|', '따름(헌신)': '|loyal|', '맞섬': '|hostile|'}
CELL_TAGS = {'움츠림': {'fearful', 'bleak'}, '순함': {'hopeful', 'neutral'}, '따름(복종)': {'duty'}, '따름(헌신)': {'loyal'}, '맞섬': {'hostile'}}
END_POLITE = re.compile(r'(요|니다|죠|세요)[.?!…)~]*\s*$')
END_NIKKA = re.compile(r'(.)니까[.?!…)~]*\s*$')
NUMF = ('level', 'tone', 'question', 'need_fear', 'good_mood', 'rare_praise')


def is_banmal(s):
    s = s.strip()
    if END_POLITE.search(s):
        return False
    m = END_NIKKA.search(s)
    if m and '가' <= m.group(1) <= '힣' and (ord(m.group(1)) - 0xAC00) % 28 == 17:
        return False
    return True


def load():
    locs = read_locations(Path(QSP).read_bytes())
    body = next(l['body'] for l in locs if l['name'] == '#txt_man')
    pat = re.compile(r"^\s*\$?voice_fragment_(\w+)\['([^']+)'\]\s*=\s*'?(.*?)'?\s*$")
    F = collections.defaultdict(dict)
    idx = collections.defaultdict(list)
    for line in body.splitlines():
        m = pat.match(line)
        if not m:
            continue
        field, key, val = m.groups()
        if field == 'item':
            lk, n = key.rsplit('_', 1)
            idx[lk].append(val)
        elif field != 'count':
            F[key][field] = val.replace("''", "'")
    for f in F.values():
        for k in NUMF:
            if k in f:
                try:
                    f[k] = int(f[k])
                except ValueError:
                    pass
    return F, idx


def qgroup(fid, f):
    if f.get('question'):
        return str(f['question'])
    m = re.search(r'q(11\d\d)', fid)
    return m.group(1) if m else '공용'


def tags(s):
    return set() if s in ('', '*') else set(s.strip('|').split('|'))


def main():
    F, idx = load()
    by_role = collections.defaultdict(list)
    for fid, f in F.items():
        if 'role' in f and 'text' in f:
            by_role[(qgroup(fid, f), f['role'])].append(fid)
    new, tag_remove, n = [], collections.defaultdict(set), 0
    for name in FILES:
        rows = json.load(open(BASE / f'{name}_manuscript.json', encoding='utf-8'))['rows']
        for r in rows:
            if not r.get('text'):
                continue
            q = r['question']
            cands = by_role.get((q, r['role'])) or by_role.get(('공용', r['role'])) or []
            if not cands:
                raise SystemExit(f"기준 조각 없음: {q} {r['role']}")
            cell = r['cell']
            ok = [c for c in cands if cell == '*' or F[c].get('relations', '*') == '*' or tags(F[c]['relations']) & CELL_TAGS[cell]]
            ref = F[(ok or cands)[0]]
            n += 1
            fid = f"jo9x_{q if q != '공용' else 'c'}_{n:04d}"
            v = r['voice']
            frag = {'id': fid, 'text': r['text'], 'role': r['role'], 'types': '|' + '|'.join(VTYPES[v]) + '|',
                    'relations': CELL[cell] if cell != '*' else ref.get('relations', '*'), 'tone': VTONE[v],
                    'level': ref.get('level', 0), 'emotion': ref.get('emotion', ''), 'question': ref.get('question', 0),
                    'need_fear': ref.get('need_fear', 0), 'good_mood': ref.get('good_mood', 0), 'rare_praise': ref.get('rare_praise', 0),
                    'index': [f"{r['role']}_{t}_{VTONE[v]}" for t in VTYPES[v]],
                    'source': {'file': name, 'voice': v, 'cell': cell, 'kind': r['kind'], 'writer': r['writer'],
                               'honorific': r.get('honorific', 'rules')}}
            new.append(frag)
            # 분리: 같은 칸에서 이 목소리 태그를 가진 원래 줄(같은 말투)에서 이 목소리 태그를 뺀다
            if r['kind'] == '분리':
                for c in ok:
                    f = F[c]
                    same = f.get('tone') == VTONE[v] or (VTONE[v] == 3 and f.get('tone') == 2)
                    if same and tags(f.get('types', '*')) & set(VTYPES[v]):
                        tag_remove[c] |= set(VTYPES[v]) & tags(f['types'])
    # 반말 말투 3 줄은 공주만: 유형 태그를 |princess|로
    banmal_ids = sorted(fid for fid, f in F.items() if f.get('tone') == 3 and 'text' in f and is_banmal(f['text']))
    princess_index = collections.defaultdict(list)
    for fid in banmal_ids:
        princess_index[f"{F[fid]['role']}_princess_3"].append(fid)
    # 명랑·거센 말투 3에 존댓말 줄이 하나도 없는 역할은 말투 2 줄을 색인에 더한다
    fallback = collections.defaultdict(list)
    roles = {f['role'] for f in F.values() if 'role' in f}
    newroles = {(x['role'], t) for x in new for t in VTYPES[x['source']['voice']]}
    for role in sorted(roles):
        for t in ('frank', 'flame'):
            ids3 = [i for i in idx.get(f'{role}_{t}_3', []) if i in F and not is_banmal(F[i].get('text', ''))
                    and t not in tag_remove.get(i, set())]
            if ids3 or (role, t) in newroles:
                continue
            for i in idx.get(f'{role}_{t}_2', []):
                if i in F and t not in tag_remove.get(i, set()):
                    fallback[f'{role}_{t}_3'].append(i)
    data = {'qsp_sha256_basis': '8332e1857fa594283eddda448177e3e63dbf554a2f3b241350aa7a9c3291c94f',
            'new_fragments': new,
            'tag_remove': {k: sorted(v) for k, v in sorted(tag_remove.items())},
            'banmal_to_princess': banmal_ids,
            'princess_index': dict(princess_index),
            'tone2_fallback_index': dict(fallback)}
    OUT.mkdir(parents=True, exist_ok=True)
    json.dump(data, open(OUT / 'question_build_data.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('새 조각', len(new), '| 태그를 빼는 원래 줄', len(tag_remove), '| 공주 전용으로 바꿀 반말 줄', len(banmal_ids),
          '| 공주 색인 묶음', len(princess_index), '| 말투 2 대체 색인 묶음', len(fallback))
    print(collections.Counter(x['source']['file'] for x in new))


if __name__ == '__main__':
    main()
