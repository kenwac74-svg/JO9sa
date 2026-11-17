# 시험 원고 문서(마크다운 표)를 풍부화 대사 DB(JSON)로 옮기고, DB가 규칙을 지키는지 검사하는 도구
import json, math, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DR = os.path.join(ROOT, 'docs', 'dialogue-rules')
DB = os.path.join(DR, 'db', 'enrich-db.json')
ROW = 53  # 대사창 한 행의 한글 글자 수(DIALOGUE_TEXT_CAPACITY_20261007 기준 50~57)

VOICES = [
    {'id': 1, 'key': 'meek', 'label': '순한 사람', 'speech': 'polite', 'types': ['meek', 'fragile']},
    {'id': 2, 'key': 'plain', 'label': '담백한 사람', 'speech': 'polite', 'types': ['plain', 'frank']},
    {'id': 3, 'key': 'bold', 'label': '센 사람', 'speech': 'polite', 'types': ['proud', 'flame']},
    {'id': 4, 'key': 'quiet', 'label': '조용한 사람', 'speech': 'polite', 'types': ['doll', 'calm', 'ice']},
    {'id': 5, 'key': 'princess', 'label': '공주', 'speech': 'banmal', 'types': [],
     'override': {'occupation': ['mprincess', 'barbarian_princess'], 'slave_type': [3002, 2610, 2620, 3010, 3021, 3023, 2621, 3012]}},
]
LABEL2VOICE = {v['label']: v['key'] for v in VOICES}
ATTITUDES = [
    {'key': 'shrink', 'label': '움츠림', 'psy': ['frightened', 'lachrymose', 'depresive']},
    {'key': 'soft', 'label': '순함', 'psy': ['soft', 'docile', 'optimistic']},
    {'key': 'follow', 'label': '따름', 'psy': ['obedient', 'servile', 'horny']},
    {'key': 'oppose', 'label': '맞섬', 'psy': ['reluctant', 'resistant', 'arrogant', 'hateful', 'hysteric']},
    {'key': 'broken', 'label': '무너짐', 'psy': ['broken']},
]
HONORIFICS = {
    'polite': [
        {'minDevotion': 0, 'forms': {'bare': '당신', 'i': '당신이', 'eun': '당신은', 'eul': '당신을', 'ui': '당신의', 'ege': '당신에게'}},
        {'minDevotion': 1, 'forms': {'bare': '주인님', 'i': '주인님이', 'eun': '주인님은', 'eul': '주인님을', 'ui': '주인님의', 'ege': '주인님께'}},
    ],
    'banmal': [
        {'minDevotion': 0, 'forms': {'bare': '너', 'i': '네가', 'eun': '너는', 'eul': '너를', 'ui': '네', 'ege': '너한테'}},
        {'minDevotion': 1, 'forms': {'bare': '당신', 'i': '당신이', 'eun': '당신은', 'eul': '당신을', 'ui': '당신', 'ege': '당신한테'}},
        {'minDevotion': 3, 'forms': {'bare': '주인', 'i': '주인이', 'eun': '주인은', 'eul': '주인을', 'ui': '주인', 'ege': '주인한테'}},
    ],
}
LAYOUTS = {
    'attitude3': {'cells': ['shrink', 'soft', 'follow'], 'note': '무게 2. 헌신 3 이상이면 follow(정신 상태가 움츠림 쪽이면 shrink), 헌신 0~2면 soft(움츠림 쪽은 shrink, 맞섬 쪽은 블록 없음)'},
    'devotion2': {'cells': ['hi', 'lo'], 'note': '무게 3. 헌신 3 이상이면 hi, 0~2면 lo'},
    'single': {'cells': ['*'], 'note': '태도를 나누지 않는 사건'},
}
# 트리거 목록: 언제 덧대는가. writer = claude(초안 작성) / user(문장은 사용자 작성, 구조만)
TRIGGERS = [
    {'id': 'execution', 'label': '처형 위협', 'weight': 3, 'layout': 'devotion2', 'writer': 'claude', 'status': 'draft_mod',
     'hooks': [{'location': 'interaction', 'anchor': '\t$text[1] = $execution_reaction[$slave_psy_status]', 'count': 6, 'textVar': '$text[1]', 'note': 'interaction 182~187'}]},
    {'id': 'arena_win', 'label': '우승', 'weight': 3, 'layout': 'devotion2', 'writer': 'claude', 'status': 'text_draft',
     'hooks': [{'location': 'выход_из_боя', 'anchor': None, 'note': "arena_level이 5가 되는 분기(54~61행)"},
               {'location': 'interaction_city', 'anchor': None, 'note': 'arena_level = 9(1919행)'},
               {'location': '$ride_finish', 'anchor': None, 'note': 'has_ride_win += 1(76행), 4승·7승'}]},
    {'id': 'champion_stay', 'label': '챔피언이 되고도 남음', 'weight': 3, 'layout': 'single', 'writer': 'claude', 'status': 'text_draft',
     'hooks': [{'location': 'interaction_city', 'anchor': None, 'note': "1963행 slave['moral'] > slave['fear'] 분기"}]},
    {'id': 'branding', 'label': '낙인', 'weight': 3, 'layout': 'devotion2', 'writer': 'claude', 'status': 'text_draft',
     'hooks': [{'location': 'interaction', 'anchor': None, 'note': '인두 1811(brand = 1)'},
               {'location': 'interaction_city', 'anchor': None, 'note': '문신 4217(brand = 2)'},
               {'location': 'interaction', 'anchor': None, 'note': '마법 성공(brand = 3, 421행)'}]},
    {'id': 'sale', 'label': '판매·납품 직전', 'weight': 3, 'layout': 'devotion2', 'writer': 'claude', 'status': 'text_draft',
     'hooks': [{'location': 'interaction_result_city', 'anchor': None, 'note': 'sell_slave_simple·sell_slave_complex 결과. 한 곳으로 모을 수 있는지 미확인'}]},
    {'id': 'rebellion', 'label': '반란 제압', 'weight': 3, 'layout': 'single', 'writer': 'claude', 'status': 'text_draft',
     'hooks': [{'location': '#dynamic', 'anchor': None, 'note': '$slave_fights_back 제압 뒤'}]},
    {'id': 'pregnancy_reveal', 'label': '임신 확인', 'weight': 3, 'layout': 'devotion2', 'writer': 'user', 'status': 'structure_only', 'deferred': True,
     'hooks': [{'location': 'next_day', 'anchor': None, 'note': 'pregnant_revealed = 1(2008~2012행). 다음 날 처음 마주할 때 낸다'}]},
    {'id': 'verbal_punish', 'label': '말로 받는 벌', 'weight': 2, 'layout': 'attitude3', 'writer': 'claude', 'status': 'text_draft', 'condition': '언어 압박 계열 처벌, torture_intensity >= 4', 'hooks': []},
    {'id': 'physical_punish', 'label': '몸으로 받는 벌', 'weight': 2, 'layout': 'attitude3', 'writer': 'claude', 'status': 'text_draft', 'condition': '구타·채찍·고문 기구·구속, torture_intensity >= 4', 'hooks': []},
    {'id': 'unjust_punish', 'label': '억울한 벌', 'weight': 2, 'layout': 'attitude3', 'writer': 'claude', 'status': 'text_draft', 'condition': "처벌 시점에 slave['sin'] = 0", 'hooks': []},
    {'id': 'shame_punish', 'label': '부끄러운 벌', 'weight': 2, 'layout': 'attitude3', 'writer': 'user', 'status': 'structure_only', 'condition': '치욕 계열 처벌', 'hooks': []},
    {'id': 'erotic_reward', 'label': '몸으로 받는 보상', 'weight': 2, 'layout': 'attitude3', 'writer': 'user', 'status': 'structure_only', 'condition': '성적 보상 강도 4~5', 'hooks': []},
    {'id': 'climax', 'label': '절정과 그 뒤', 'weight': 2, 'layout': 'attitude3', 'writer': 'user', 'status': 'structure_only', 'condition': '절정 판정', 'hooks': []},
    {'id': 'warm_reward', 'label': '따뜻한 보상', 'weight': 2, 'layout': 'attitude3', 'writer': 'claude', 'status': 'later_review', 'condition': 'interaction_reward_level >= 4', 'hooks': []},
    {'id': 'assistant_promotion', 'label': '조수 승격', 'status': 'excluded', 'reason': '승격·강등이 수시로 일어남. 조수 대화에서 따로 다룸'},
    {'id': 'surgery', 'label': '수술', 'status': 'excluded', 'reason': '사용자 결정'},
    {'id': 'trait_reveal', 'label': '숨은 성향이 드러남', 'status': 'excluded', 'reason': '사용자 결정'},
    {'id': 'attitude_shift', 'label': '태도가 넘어감', 'status': 'excluded', 'reason': '사건이 아니라 상태 변화'},
    {'id': 'breakdown', 'label': '신경쇠약 진입·회복', 'status': 'excluded', 'reason': '사건이 아니라 상태 변화'},
    {'id': 'grade_change', 'label': '등급이 바뀐 순간', 'status': 'excluded', 'reason': '사건이 아니라 상태 변화'},
    {'id': 'escape_fail', 'label': '도주 실패', 'status': 'on_hold', 'reason': '실패 지점을 QSP에서 찾지 못함'},
]
COLS3 = {'움츠림': 'shrink', '순함': 'soft', '따름': 'follow'}

def table_rows(text, heading):
    sec = text.split(heading, 1)[1].split('\n## ', 1)[0]
    rows = [r for r in sec.split('\n') if r.startswith('| ') and not r.startswith('|---')]
    head = [c.strip() for c in rows[0].strip('|').split('|')]
    return head, [[c.strip() for c in r.strip('|').split('|')] for r in rows[1:]]

def cell_key(h):
    for k, v in COLS3.items():
        if h.startswith(k):
            return v
    if h.startswith('따르는'):
        return 'hi'
    if h.startswith('아닌'):
        return 'lo'
    if h == '블록':
        return '*'
    raise ValueError(h)

def split_cell(c):
    a, _, b = c.partition('<br>')
    return a.strip(), b.strip()

def migrate():
    t1 = open(os.path.join(DR, 'JO9_TEST_MANUSCRIPT_v0_20261116_KO.md'), encoding='utf-8').read()
    t2 = open(os.path.join(DR, 'JO9_MANUSCRIPT_BATCH2_v0_20261116_KO.md'), encoding='utf-8').read()
    gestures = []
    head, rows = table_rows(t1, '## 1. 몸짓 사전')
    for r in rows:
        for h, c in zip(head[1:], r[1:]):
            gestures.append({'voice': LABEL2VOICE[r[0]], 'attitude': COLS3[h], 'phrases': [p.strip() for p in c.split(' / ')]})
    src = [(t1, '## 2. 무게 3 사건: 우승', 'arena_win'), (t1, '## 3. 무게 3 사건: 챔피언', 'champion_stay'),
           (t1, '## 4. 무게 2 갈래: 말로 받는 벌', 'verbal_punish'),
           (t2, '## 1. 무게 2 갈래: 몸으로 받는 벌', 'physical_punish'), (t2, '## 2. 무게 2 갈래: 억울한 벌', 'unjust_punish'),
           (t2, '## 3. 무게 3 사건: 낙인', 'branding'), (t2, '## 4. 무게 3 사건: 처형 위협', 'execution'),
           (t2, '## 5. 무게 3 사건: 판매', 'sale'), (t2, '## 6. 무게 3 사건: 반란 제압', 'rebellion')]
    frags = []
    for text, heading, trig in src:
        head, rows = table_rows(text, heading)
        for r in rows:
            for h, c in zip(head[1:], r[1:]):
                line, after = split_cell(c)
                f = {'trigger': trig, 'voice': LABEL2VOICE[r[0]], 'cell': cell_key(h), 'variant': 1, 'line': line}
                if after:
                    f['after'] = after
                frags.append(f)
    db = {'schema': 'jo9-enrich-db/v1', 'updated': '2026-11-17',
          'limits': {'rowChars': ROW, 'maxRows': 3, 'afterMinDevotion': 2, 'perDayPerTriggerWeight2': 1},
          'voices': VOICES, 'attitudes': ATTITUDES, 'layouts': LAYOUTS, 'honorifics': HONORIFICS,
          'triggers': TRIGGERS, 'gestures': gestures, 'fragments': frags}
    json.dump(db, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return db

TOKENS = {'{이름}': '가나다라', '{호칭}': '주인님', '{은/는}': '는', '{이/가}': '이', '{을/를}': '을'}

def rows_of(s):
    for k, v in TOKENS.items():
        s = s.replace(k, v)
    return max(1, math.ceil(len(s) / ROW))

def check(db):
    errs, warns = [], []
    trig = {t['id']: t for t in db['triggers']}
    voices = {v['key']: v for v in db['voices']}
    for f in db['fragments']:
        t = trig.get(f['trigger'])
        where = f"{f['trigger']}.{f['voice']}.{f['cell']}.{f['variant']}"
        if not t:
            errs.append(where + ': 없는 트리거'); continue
        if t['status'] in ('excluded', 'on_hold'):
            errs.append(where + ': 제외·보류 트리거에 문장이 있음'); continue
        if t.get('writer') == 'user' and f.get('by') != 'user':
            errs.append(where + ': 사용자 작성 칸에 Claude 문장')
        if f['cell'] not in db['layouts'][t['layout']]['cells']:
            errs.append(where + ': 레이아웃에 없는 칸')
        text = f['line'] + f.get('after', '')
        if "'" in text: errs.append(where + ': 작은따옴표(QSP 문자열과 충돌)')
        if '『' in text or '』' in text: errs.append(where + ': 속마음 표기(노예의 속마음은 쓰지 않는다)')
        for tok in re.findall(r'\{[^}]*\}', text):
            if tok not in TOKENS: errs.append(where + ': 모르는 빈칸 ' + tok)
        r = rows_of(f['line']) + (rows_of(f['after']) if f.get('after') else 0)
        if r > db['limits']['maxRows']: errs.append(where + f': {r}행(3행 초과)')
        if voices[f['voice']]['speech'] == 'banmal' and re.search(r'(요|니다|세요)[.?!"]', f['line']):
            warns.append(where + ': 반말 인물에 존댓말 어미로 보이는 부분')
        if f['voice'] in ('meek', 'plain', 'bold', 'quiet') and re.search(r'"[^"]*(해|야|어|지)\.\s*"', f['line']):
            warns.append(where + ': 존댓말 인물에 반말 어미로 보이는 부분')
    for t in db['triggers']:
        if t['status'] not in ('text_draft', 'draft_mod'):
            continue
        for v in voices:
            for c in db['layouts'][t['layout']]['cells']:
                if not any(f['trigger'] == t['id'] and f['voice'] == v and f['cell'] == c for f in db['fragments']):
                    errs.append(f"{t['id']}.{v}.{c}: 칸이 비어 있음")
    for g in db['gestures']:
        if len(g['phrases']) < 3: warns.append(f"몸짓 {g['voice']}.{g['attitude']}: 구절 3개 미만")
    return errs, warns

if __name__ == '__main__':
    db = migrate() if '--migrate' in sys.argv else json.load(open(DB, encoding='utf-8'))
    e, w = check(db)
    n = len(db['fragments'])
    print(f"트리거 {len(db['triggers'])}개, 몸짓 {len(db['gestures'])}칸, 블록 {n}개")
    for x in w: print('경고', x)
    for x in e: print('오류', x)
    print('결과:', '통과' if not e else f'오류 {len(e)}건')
    sys.exit(1 if e else 0)
