# 질문 메뉴 원고의 사용자 작성 칸(성적인 주제)을 다른 AI에게 맡기는 핸드오프 문서와 답안 틀을 만드는 도구
"""사용법: python tools/user_cells_handoff.py 1113 [1112 ...]
출력: docs/dialogue-rules/handoff/USER_CELLS_HANDOFF_<질문>_KO.md, user_cells_<질문>_answer.json
돌려받은 답안 넣기: python tools/user_cells_handoff.py --merge <답안 JSON>  (길이·말투·빈칸 검사 후 원고 데이터에 반영)"""
import csv, json, re, sys
from pathlib import Path

QS = sys.argv[1:] or ['1113']
BASE = Path('docs/dialogue-rules/question-fill')
OUTDIR = Path('docs/dialogue-rules/handoff')
OUTDIR.mkdir(parents=True, exist_ok=True)
CSV = list(csv.DictReader(open(BASE / 'question_fill_table.csv', encoding='utf-8-sig')))
ORIG = {(r['question'], r['role'], r['cell'], r['voice']): r for r in CSV}
QNAME = {'1111': '과거 묻기', '1112': '인상 묻기', '1113': '요구 묻기', '1114': '희망 묻기', '1115': '불만 묻기', '1116': '기분 묻기', '1117': '조수 묻기'}
NEED = {'exhibitionism': '노출', 'homosexualism': '동성', 'nymphomania': '색정', 'perversion': '도착', 'abuse': '매질',
        'deprivation': '구속', 'urge': '욕구', 'horny': '발정', 'instinct': '본능'}
# 길이는 가장 긴 호칭으로 센다
LONGEST = {'{호칭}': '주인님', '{호칭이}': '주인님이', '{호칭은}': '주인님은', '{호칭을}': '주인님을', '{호칭의}': '주인님의',
           '{호칭에게}': '주인님께', '{호칭부름}': '주인님', '{PH_001}': '갈라테야'}


def label(role):
    m = re.match(r'native_\d+_(\w+?)_need_(core|detail)$', role)
    if m:
        return f"{NEED.get(m.group(1), m.group(1))} 요구" + (' · 덧붙임' if m.group(2) == 'detail' else ' · 기본 줄')
    m = re.match(r'native_\d+_refuse_(\w+)_core$', role)
    if m:
        return f"{NEED.get(m.group(1), m.group(1))} 상태에서 대답 거부"
    m = re.match(r'fact_relation_(\w+?)_(core|detail)$', role)
    if m:
        return f"{NEED.get(m.group(1), m.group(1))} 상태" + (' · 덧붙임' if m.group(2) == 'detail' else ' · 기본 줄')
    m = re.match(r'fact_(\w+?)_(\d)_(core|detail)$', role)
    if m:
        return f"{NEED.get(m.group(1), m.group(1))} {m.group(2)}단계" + (' · 덧붙임' if m.group(3) == 'detail' else ' · 기본 줄')
    return role


def pair_role(role):
    if role.endswith('_core'):
        return role[:-5] + '_detail'
    if role.endswith('_detail'):
        return role[:-7] + '_core'
    return None


RULES = '''
## 1. 이 일은 무엇인가
- 성인 대상 노예 조교 게임 "잭오나(JO9)" 한국어판의 대사 보강이다. 플레이어(주인공, 주인)가 질문 메뉴로 노예에게 묻고, 노예가 한두 문장으로 대답한다.
- 대답 대사는 인물의 **목소리**(말투 묶음)마다 따로 있다. 어떤 목소리에는 이 칸의 대사가 없어서 새로 써야 한다.
- 맡기는 칸은 모두 성적인 주제다. 게임 원문이 이미 있고, **원문의 뜻과 수위를 그대로 두고 지정한 목소리의 말투로 다시 쓰는 일**이다. 새 사건이나 새 설정을 만들지 않는다.

## 2. 절대 지킬 것
1. 등장인물은 모두 성인이다. 미성년자를 떠올리게 하는 표현(나이, 몸집, 학생, 아이 같은 말)은 쓰지 않는다.
2. 동물과의 성행위는 쓰지 않는다.
3. 원문보다 수위를 높이지 않는다. 원문에 없는 행위나 신체 묘사를 보태지 않는다.
4. 대사만 쓴다. 노예의 속마음을 서술하지 않는다. 괄호 지문은 원문에 괄호가 있을 때만 쓰고, 보이는 몸짓과 표정만 쓴다.
5. 길이: **한 줄 82자 이하.** 같은 주제의 "기본 줄 + 덧붙임"을 합쳐 **150자 이하.** 글자 수는 공백과 문장부호를 포함하고, 빈칸은 가장 긴 호칭("주인님이" 등)으로 바꿔 센다.
6. 문장은 마침표, 물음표, 느낌표, 말줄임표(…)로 끝낸다. 말줄임표는 "…" 한 글자를 쓴다. 이모지와 영문은 쓰지 않는다.

## 3. 목소리별 말투
| 목소리 | 말투 | 호칭 | 결 |
|---|---|---|---|
| 공주 | **반말**("~해", "~야", "~거든", "~지") | **"주인" 고정.** 빈칸을 쓰지 않고 "주인"이라고 그대로 쓴다 | 몰락한 왕족·귀족 출신. 반말이지만 천박하지 않다. 체면과 자존심이 말끝에 남는다. 비속어는 원문에 있을 때만 |
| 명랑한 | **편한 존댓말**("~요", "~거든요", "~잖아요") | **빈칸으로 쓴다.** 아래 4장 | 솔직하고 감정을 숨기지 않는다. 감탄과 느낌표가 많고 말이 빠르다. 존댓말이지만 딱딱하지 않다. "습니다"체는 쓰지 않는다 |

- 말투는 인물에게 고정이다. 공주는 어떤 상황에서도 반말, 명랑한은 어떤 상황에서도 존댓말이다.
- 어미를 기계적으로 바꾸지 말고 그 말투로 자연스러운 완결 문장을 쓴다.

## 4. 호칭 빈칸 (명랑한만)
명랑한의 호칭은 헌신·복종 수치에 따라 "당신" 또는 "주인님"으로 바뀐다. 그래서 주인공을 가리키는 말은 반드시 아래 빈칸으로 쓴다.

| 빈칸 | 낮을 때 | 높을 때 | 쓰는 자리 |
|---|---|---|---|
| `{호칭}` | 당신 | 주인님 | 조사 없이(예: "{호칭} 곁에", "{호칭}처럼") |
| `{호칭이}` | 당신이 | 주인님이 | 주어 |
| `{호칭은}` | 당신은 | 주인님은 | 주제 |
| `{호칭을}` | 당신을 | 주인님을 | 목적어 |
| `{호칭의}` | 당신의 | 주인님의 | 소유 |
| `{호칭에게}` | 당신에게 | 주인님께 | 받는 쪽 |
| `{호칭부름}` | (지워짐) | 주인님 | 문장 끝에서 부를 때. ", {호칭부름}."처럼 쉼표 뒤에 둔다. 낮을 때는 쉼표와 함께 지워진다 |

- "당신", "주인님"을 직접 쓰지 않는다. "주인님으로 모시다"처럼 호칭이 아니라 말의 내용일 때만 그대로 쓴다.
- 빈칸 앞뒤 문장이 "당신"일 때와 "주인님"일 때 둘 다 자연스러워야 한다.

## 5. 승인된 예시
'''


def build(q):
    data = json.load(open(BASE / f'q{q}_manuscript.json', encoding='utf-8'))
    rows = data['rows']
    users = [r for r in rows if r['writer'] == 'user']
    done = [r for r in users if r.get('text')]
    todo = [r for r in users if not r.get('text')]
    # 예시: 승인된 사용자 줄(공주·명랑한) 하나씩 + Claude 일반 줄
    ex = []
    for qq in ('1112', q):
        p = BASE / f'q{qq}_manuscript.json'
        if p.exists():
            ex += [r for r in json.load(open(p, encoding='utf-8'))['rows'] if r.get('text')]
    def pick(voice, writer, n):
        return [r for r in ex if r['voice'] == voice and r['writer'] == writer][:n]
    lines = [f'<!-- {QNAME.get(q, q)}({q}) 사용자 작성 칸을 다른 AI에게 맡기는 핸드오프 -->',
             f'# {QNAME.get(q, q)} 사용자 작성 칸 핸드오프', '',
             f'- 만든 날: 2026-11-18. 맡길 칸 **{len(todo)}개**' + (f', 이미 채운 칸 {len(done)}개는 제외' if done else '') + '.',
             f'- 답안 틀: `user_cells_{q}_answer.json`. 각 행의 `text`만 채워 돌려준다.']
    lines += RULES.splitlines()
    for r in pick('공주', 'user', 2) + pick('명랑한', 'user', 1) + pick('공주', 'claude', 1) + pick('명랑한', 'claude', 2):
        lines.append(f"- {r['voice']}: {r['text']}")
    lines += ['', '## 6. 맡기는 칸', '',
              '각 칸의 "원문"은 같은 칸에 이미 있는 다른 말투 판이다. **뜻은 원문을 따르고 말투만 그 목소리로 바꾼다.** 원문 셋(말투 1·2·3)이 조금씩 다르면 가장 맞는 것을 고른다.', '']
    for i, r in enumerate(todo, 1):
        o = ORIG.get((r['question'], r['role'], r['cell'], r['voice']), {})
        pr = pair_role(r['role'])
        pair_txt = ''
        if pr:
            prow = [x for x in rows if x['role'] == pr and x['voice'] == r['voice']]
            if prow and prow[0].get('text'):
                pair_txt = f"짝 줄(이미 있음, {len(prow[0]['text'])}자): {prow[0]['text']}"
            elif prow:
                pn = next((j for j, x in enumerate(todo, 1) if x['role'] == pr and x['voice'] == r['voice']), None)
                kind = '덧붙임' if pr.endswith('_detail') else '기본 줄'
                pair_txt = f'짝 줄은 이 목록의 {pn}번({kind})이다. 두 줄 모두 이번에 쓰며, 두 줄 합 150자 이하'
            else:
                po = ORIG.get((r['question'], pr, r['cell'], r['voice']), {})
                mx = max([len(po.get(f'original_t{t}', '')) for t in '123'] or [0])
                pair_txt = f'짝 줄은 원문을 쓴다(최대 {mx}자). 이 줄은 {150 - mx}자 이하' if mx else ''
        lines += [f"### {i}. {label(r['role'])} — {r['voice']}", f"- 키: `{r['role']}` / 목소리 `{r['voice']}`"]
        for t, name in (('1', '말투 1(격식)'), ('2', '말투 2(보통)'), ('3', '말투 3(편함)')):
            if o.get(f'original_t{t}'):
                lines.append(f"- 원문 {name}: {o[f'original_t{t}']}")
        if pair_txt:
            lines.append(f'- {pair_txt}')
        lines.append('')
    lines += ['## 7. 돌려줄 때 스스로 확인할 것', '',
              '1. 공주 줄은 모두 반말이고 "주인"이 그대로 들어 있다(빈칸 없음).',
              '2. 명랑한 줄은 모두 "~요" 존댓말이고, 주인공을 가리키는 말은 모두 4장의 빈칸이다. "당신", "주인님"을 직접 쓰지 않았다.',
              '3. 빈칸을 "주인님"으로 바꿔 세어도 한 줄 82자, 짝 합 150자 이하다.',
              '4. 원문에 없는 행위나 신체 묘사를 보태지 않았다. 미성년자·동물 관련 표현이 없다.',
              '5. 괄호 지문은 원문에 괄호가 있을 때만 있고, 보이는 몸짓만 쓴다.', '']
    (OUTDIR / f'USER_CELLS_HANDOFF_{q}_KO.md').write_text('\n'.join(lines), encoding='utf-8')
    ans = {'question': q, 'note': '각 행의 text만 채운다. 다른 칸은 바꾸지 않는다.',
           'rows': [{'role': r['role'], 'cell': r['cell'], 'voice': r['voice'], 'label': label(r['role']), 'text': ''} for r in todo]}
    json.dump(ans, open(OUTDIR / f'user_cells_{q}_answer.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(q, '맡길 칸', len(todo))


def merge(path):
    ans = json.load(open(path, encoding='utf-8'))
    q = ans['question']
    mp = BASE / f'q{q}_manuscript.json'
    data = json.load(open(mp, encoding='utf-8'))
    idx = {(r['role'], r['cell'], r['voice']): r for r in data['rows']}
    problems, n = [], 0
    for a in ans['rows']:
        t = (a.get('text') or '').strip()
        if not t:
            continue
        r = idx.get((a['role'], a['cell'], a['voice']))
        if not r or r['writer'] != 'user':
            problems.append(f"{a['role']} {a['voice']}: 원고 데이터에 사용자 칸이 없음")
            continue
        size = len(t)
        for k, v in LONGEST.items():
            size += t.count(k) * (len(v) - len(k))
        if size > 82:
            problems.append(f"{a['label']} {a['voice']}: {size}자(82자 초과)")
        if a['voice'] == '공주' and re.search(r'\{호칭', t):
            problems.append(f"{a['label']} 공주: 빈칸 대신 \"주인\"을 써야 함")
        if a['voice'] != '공주' and re.search(r'당신|주인님', re.sub(r'주인님으로', '', t)):
            problems.append(f"{a['label']} {a['voice']}: \"당신/주인님\"을 직접 씀(빈칸으로)")
        r['text'] = t
        r['note'] = '사용자 의뢰 답안 반영(다른 AI 작성, 사용자 검토 필요)'
        if a['voice'] == '공주':
            r['honorific'] = 'fixed:주인'
        n += 1
    json.dump(data, open(mp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('반영', n)
    for p_ in problems:
        print('확인:', p_)


if QS and QS[0] == '--merge':
    merge(QS[1])
else:
    for q in QS:
        build(q)
