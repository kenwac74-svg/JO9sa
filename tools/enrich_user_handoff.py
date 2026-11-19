# 풍부화 DB의 빈 사건 칸(사용자 작성)을 다른 AI에게 맡기는 핸드오프와 답안 틀을 만들고, 돌려받은 답안을 DB에 넣는 도구
"""사용법:
  python tools/enrich_user_handoff.py            → handoff/USER_EVENTS_HANDOFF_KO.md, user_events_answer.json
  python tools/enrich_user_handoff.py --merge <답안 JSON>  → 검사 후 db/enrich-db.json에 넣는다
  python tools/enrich_user_handoff.py --redo [회차]  → 겹치는 칸 다시 쓰기 핸드오프 USER_EVENTS_REDO_HANDOFF_KO.md, user_events_redo_answer.json
  python tools/enrich_user_handoff.py --merge-redo <답안 JSON>  → 검사 후 해당 칸의 줄을 바꾼다"""
import difflib, json, re, sys
from pathlib import Path

DB = Path('docs/dialogue-rules/db/enrich-db.json')
OUT = Path('docs/dialogue-rules/handoff')
TARGETS = ['shame_punish', 'erotic_reward', 'climax', 'pregnancy_reveal']
CELL_KO = {'shrink': '움츠림', 'soft': '순함', 'obey': '따름(복종)', 'follow': '따름(헌신)', 'hi': '헌신 3 이상', 'lo': '헌신 0~2', '*': '한 칸'}
WHAT = {
    'shame_punish': '치욕 계열 처벌(강도 4 이상)이 끝난 뒤. 원래 글은 정신 상태별 반응 한 문단이고 노예의 대사가 없다',
    'erotic_reward': '성적 보상(강도 4~5)을 받은 뒤. 넣을 자리와 원래 글은 모드 개발이 찾는다',
    'climax': '절정 판정이 난 뒤. 넣을 자리와 원래 글은 모드 개발이 찾는다',
    'pregnancy_reveal': '임신이 드러난 뒤 주인이 그녀를 처음 마주할 때. 게임은 이 순간에 글을 내지 않으므로 이 블록이 장면의 전부다',
}


def load():
    return json.load(open(DB, encoding='utf-8'))


def build():
    db = load()
    voices = db['voices']
    g = {(x['voice'], x['attitude']): x['phrases'] for x in db['gestures']}
    trig = {t['id']: t for t in db['triggers']}
    have = {(f['trigger'], f['voice'], f['cell']) for f in db['fragments']}
    rows = []
    for tid in TARGETS:
        t = trig[tid]
        for c in db['layouts'][t['layout']]['cells']:
            for v in voices:
                if (tid, v['key'], c) not in have:
                    rows.append({'trigger': tid, 'event': t['label'], 'voice': v['key'], 'voiceLabel': v['label'], 'cell': c,
                                 'cellLabel': CELL_KO[c], 'line': '', 'after': ''})
    ex = [f for f in db['fragments'] if f['trigger'] in ('physical_punish', 'arena_win') and f['voice'] in ('meek', 'fierce', 'princess')]
    L = ['<!-- 풍부화 사건의 빈 칸(성적인 장면 등 사용자 작성)을 다른 AI에게 맡기는 핸드오프 -->',
         '# 풍부화 사건 빈 칸 핸드오프', '',
         f'- 만든 날: 2026-11-19. 맡길 칸 **{len(rows)}개**. 답안 틀: `user_events_answer.json`(각 행의 `line`, 무게 3 사건은 `after`도 채운다).',
         '- 성인 대상 노예 조교 게임 "잭오나(JO9)" 한국어판. 큰 사건이 끝난 뒤 원래 글 아래에 **그 인물이 어떻게 구는지를 보여 주는 관찰 지문**을 덧붙인다.', '',
         '## 1. 절대 지킬 것',
         '1. 등장인물은 모두 성인이다. 미성년자를 떠올리게 하는 표현을 쓰지 않는다. 동물과의 성행위는 쓰지 않는다.',
         '2. **대사를 쓰지 않는다.** 따옴표 대사, 간접 전달("~라고 애원했다") 모두 넣지 않는다. 보이는 몸짓·표정·자세만 쓴다.',
         '3. **속마음을 쓰지 않는다.** "부끄러웠다", "기뻤다"처럼 마음을 단정하지 않고, 몸에 드러나는 것으로 보여 준다.',
         '4. 3인칭 관찰, **과거형**. 노예는 `{이름}{은/는}`으로 시작하고 이후 "그녀". 주인공은 "당신".',
         '5. 길이: 본문(`line`)은 110자 이하. 무게 3 사건(임신 확인)은 여운(`after`)을 한 줄(53자 이하) 더 쓰고, 본문+여운 159자 이하.',
         '6. 사건 하나에서 이미 일어난 일을 다시 설명하지 않는다. 그 뒤 그녀의 모습만 쓴다.', '',
         '## 2. 칸의 뜻',
         '| 칸 | 그녀의 상태 | 몸짓의 방향 |', '|---|---|---|',
         '| 움츠림 | 겁먹음·눈물·우울 | 몸을 웅크리고, 떨고, 피한다 |',
         '| 순함 | 따르는 사이는 아니지만 대들지도 않는다 | 제 감정이 그대로 드러난다 |',
         '| 따름(복종) | 두려움과 권위로 **억지로** 따른다 | 감정은 드러내지 않고 자세·규칙을 지킨다. 몸이 반발해도 자세를 풀지 않는다 |',
         '| 따름(헌신) | 믿음과 애정으로 **스스로** 따른다 | 주인 쪽으로 다가가고, 곁에 머물고, 눈을 맞춘다 |',
         '| 헌신 3 이상 / 헌신 0~2 | 무게 3 사건 | 깊이 따르는 사이인지 아닌지 |', '',
         '## 3. 목소리',
         '목소리는 말투가 아니라 **몸짓의 결**이다(대사가 없으므로). 아래 몸짓 사전의 결을 따른다. 사전은 현재형이지만 쓸 때는 과거형으로 바꾼다.', '',
         '| 목소리 | 움츠림 | 순함 | 따름(복종) | 따름(헌신) |', '|---|---|---|---|---|']
    for v in voices:
        L.append(f"| {v['label']} | " + ' | '.join('<br>'.join(g.get((v['key'], a), [])) for a in ('shrink', 'soft', 'obey', 'follow')) + ' |')
    L += ['', '- 공주: 몰락한 왕족 출신. 무너져도 체면과 자세를 지키려 한다.', '- 거센: 결이 거칠 뿐 관계가 나쁜 것은 아니다. 태도는 칸이 정하고, 목소리는 그 태도를 어떤 몸짓으로 내는지만 정한다.', '',
          '## 4. 승인된 예시(다른 사건)']
    for f in ex[:6]:
        L.append(f"- {f['trigger']} · {f['voice']} · {CELL_KO[f['cell']]}: {f['line']}" + (f" / 여운: {f['after']}" if f.get('after') else ''))
    L += ['', '## 5. 맡기는 칸']
    for tid in TARGETS:
        rs = [r for r in rows if r['trigger'] == tid]
        if not rs:
            continue
        L += [f"### {trig[tid]['label']} (`{tid}`) — {len(rs)}칸", f"- 장면: {WHAT[tid]}",
              f"- 칸: {', '.join(dict.fromkeys(r['cellLabel'] for r in rs))} × 목소리 7"]
        if tid == 'pregnancy_reveal':
            L.append('- 무게 3이라 `after`(여운 한 줄)도 쓴다. 여운은 헌신 2 이상일 때만 나온다.')
        L.append('')
    L += ['## 6. 돌려주기 전 확인', '1. 따옴표나 "~라고 말했다" 같은 말 전달이 없다.', '2. 모두 과거형이고 `{이름}{은/는}`으로 시작한다.',
          '3. 길이 제한을 지켰다.', '4. 따름(복종)과 따름(헌신)이 눈에 띄게 다르다.', '5. 미성년자·동물 관련 표현이 없다.', '']
    (OUT / 'USER_EVENTS_HANDOFF_KO.md').write_text('\n'.join(L), encoding='utf-8')
    json.dump({'note': '각 행의 line(과 무게 3이면 after)만 채운다', 'rows': rows},
              open(OUT / 'user_events_answer.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('맡길 칸', len(rows))


def merge(path):
    db = load()
    ans = json.load(open(path, encoding='utf-8'))
    have = {(f['trigger'], f['voice'], f['cell']) for f in db['fragments']}
    probs, n = [], 0
    for r in ans['rows']:
        line = (r.get('line') or '').strip()
        if not line:
            continue
        k = (r['trigger'], r['voice'], r['cell'])
        where = f"{r['event']} · {r['voiceLabel']} · {r['cellLabel']}"
        if k in have:
            probs.append(where + ': 이미 있는 칸')
            continue
        after = (r.get('after') or '').strip()
        if re.search(r'["“”「」]', line + after):
            probs.append(where + ': 따옴표(대사)가 있음')
        if not line.startswith('{이름}{은/는}'):
            probs.append(where + ': {이름}{은/는}으로 시작하지 않음')
        if len(line) > 110 or len(line) + len(after) > 159:
            probs.append(where + f': 길이 초과({len(line)}+{len(after)})')
        f = {'trigger': r['trigger'], 'voice': r['voice'], 'cell': r['cell'], 'variant': 1, 'line': line, 'by': 'user',
             'note': '사용자 의뢰 답안 반영(다른 AI 작성)'}
        if after:
            f['after'] = after
        db['fragments'].append(f)
        n += 1
    json.dump(db, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(DB, 'a').write('\n')
    print('반영', n)
    for p in probs:
        print('확인:', p)


# 다시 쓸 칸: 다른 사건과 닮은 줄(앞 사건 것은 남김) + 회차마다 따로 고른 장면·자세가 맞지 않는 줄
REDO_ROUNDS = {
    1: {'suffix': '', 'extra': {('erotic_reward', 'proud', 'obey'): '벌 장면의 "아픈 자리를 가리지 않고"가 보상 장면에 들어 있음',
                                ('pregnancy_reveal', 'princess', 'hi'): '"당신 앞에 서서"와 "턱을 괴고"가 함께 있어 자세가 맞지 않음'}},
    2: {'suffix': '2', 'extra': {('climax', 'princess', 'obey'): '"무릎을 꿇고 앉아"로 시작해 "꼿꼿이 섰다"로 끝나 자세가 맞지 않음',
                                 ('climax', 'meek', 'obey'): '"두 손을 무릎 위에 가지런히 얹었다"와 "다리를 모아 섰으며"가 함께 있어 자세가 맞지 않음'},
        'intro': '- 2차: 1차 다시 쓰기(56칸) 답안을 반영한 뒤에도 첫 문장이 앞 사건과 같은 7칸과, 한 줄 안에서 자세가 맞지 않는 2칸이 남았다. 이 9칸만 다시 쓴다. 1차 때처럼 첫 문장을 그대로 두고 뒷부분만 바꾸면 다시 걸린다.'},
}
REDO_EXTRA = REDO_ROUNDS[1]['extra']
REDO_SCENE = {
    'shame_punish': '치욕 계열 처벌 뒤. 부끄러움과 굴욕이 몸에 남아 있다(이번에 다시 쓰지 않음, 비교용)',
    'erotic_reward': '성적 보상을 받은 뒤. 벌이 아니라 **받은 쪽**이다. 몸이 풀렸거나 달아올랐고, 그것을 대하는 태도가 칸마다 다르다. 아픔·벌 흔적을 쓰지 않는다',
    'climax': '절정 직후. 숨이 가라앉지 않았고 다리·손끝에 떨림이 남았으며, 땀과 흐트러진 옷매무새를 어떻게 다루는지가 칸마다 다르다. 보상 장면과 겹치지 않게 **몸이 아직 회복되지 않은 상태**를 중심으로 쓴다',
    'pregnancy_reveal': '임신이 드러난 뒤 주인을 처음 마주함. 배·손·자세의 변화가 중심이다. 다른 사건(벌·보상)의 몸짓을 가져오지 않는다',
}
ORDER = ['shame_punish', 'erotic_reward', 'climax', 'pregnancy_reveal']


def first_act(line):
    # 첫 문장(첫 동작)
    return re.split(r'(?<=다)[.,]', line.replace('{이름}{은/는}', '', 1))[0].strip()


def alike(a, b):
    # 같은 줄, 첫 동작이 같은 줄, 몇 단어만 다른 줄(유사도 0.8 이상)
    x, y = a.replace('{이름}{은/는}', ''), b.replace('{이름}{은/는}', '')
    return a == b or first_act(a) == first_act(b) or difflib.SequenceMatcher(None, x, y).ratio() >= 0.8


def redo_rows(db):
    """앞 사건(부끄러운 벌 → 보상 → 절정 → 임신) 줄은 남기고, 같은 목소리의 앞 사건 줄과 닮은 뒤 사건 줄을 다시 쓴다"""
    fs = sorted([f for f in db['fragments'] if f['trigger'] in ORDER and f.get('by') == 'user'], key=lambda f: ORDER.index(f['trigger']))
    rows = []
    for i, f in enumerate(fs):
        like = [o for o in fs[:i] if o['trigger'] != f['trigger'] and o['voice'] == f['voice'] and alike(f['line'], o['line'])]
        extra = REDO_EXTRA.get((f['trigger'], f['voice'], f['cell']))
        if like or extra:
            rows.append((f, extra or ('같은 줄' if any(o['line'] == f['line'] for o in like) else '닮은 줄'), like))
    return rows


def redo_build(rnd=1):
    global REDO_EXTRA
    R = REDO_ROUNDS[rnd]
    REDO_EXTRA = R['extra']
    md, js = f"USER_EVENTS_REDO{R['suffix']}_HANDOFF_KO.md", f"user_events_redo{R['suffix']}_answer.json"
    db = load()
    voices = {v['key']: v['label'] for v in db['voices']}
    lab = {t['id']: t['label'] for t in db['triggers']}
    rows = redo_rows(db)
    redo_keys = {(f['trigger'], f['voice'], f['cell']) for f, _, _ in rows}
    L = ['<!-- 풍부화 사건 사용자 작성 칸 중 다른 사건과 겹치거나 장면에 맞지 않는 칸을 다시 맡기는 핸드오프 -->',
         '# 풍부화 사건 다시 쓰기 핸드오프' + (f' ({rnd}차)' if rnd > 1 else ''), '',
         f'- 만든 날: 2026-11-19. 다시 쓸 칸 **{len(rows)}개**. 답안 틀: `{js}`(각 행의 `line`을 새로 쓴다. 임신 확인은 `after`도 확인).'] + ([R['intro']] if R.get('intro') else []) + [
         '- 앞서 받은 답안(`USER_EVENTS_HANDOFF_KO.md`)의 규칙을 그대로 따른다. 대사 없음, 속마음 없음, 3인칭 관찰, 과거형, `{이름}{은/는}`으로 시작, 본문 110자 이하.',
         '- 문제: 몸짓 사전을 그대로 옮겨 써서 사건끼리 **똑같은 줄**, **첫 동작이 같은 줄**, **몇 단어만 다른 줄**이 많다. 부끄러운 벌의 줄은 남기고, 그 뒤 사건(보상·절정·임신)에서 앞 사건 줄과 닮은 칸만 다시 쓴다. 사건마다 장면이 다르므로 장면에 맞게 쓴다.', '',
         '## 1. 다시 쓸 때 지킬 것',
         '1. 아래 "지금 줄"과 "닮은 줄"을 그대로 쓰거나 몇 단어만 바꿔 쓰지 않는다. 몸짓 자체를 바꾼다.',
         '2. 목소리의 결(몸짓 사전)과 칸의 뜻(움츠림·순함·따름(복종)·따름(헌신))은 그대로 지킨다.',
         '3. 같은 목소리라면 사건끼리 **첫 문장(첫 동작)이 달라야** 한다. 이번에 새로 쓰는 보상 줄과 절정 줄끼리도 마찬가지다.',
         '4. 보상·절정·임신 장면에는 벌의 흔적(아픈 자리, 맞은 자리 등)을 쓰지 않는다.',
         '5. 자세가 한 줄 안에서 맞아야 한다(서 있으면서 턱을 괴는 식은 안 된다).',
         '6. 등장인물은 모두 성인이다. 미성년자를 떠올리게 하는 표현, 동물과의 성행위는 쓰지 않는다.', '',
         '## 2. 사건별 장면']
    for t in ORDER:
        L.append(f'- **{lab[t]}** (`{t}`): {REDO_SCENE[t]}')
    L += ['', '## 3. 다시 쓸 칸', '']
    ans = []
    for t in ORDER[1:]:
        rs = [x for x in rows if x[0]['trigger'] == t]
        if not rs:
            continue
        L += [f'### {lab[t]} — {len(rs)}칸', '']
        for f, why, like in rs:
            L.append(f"- **{voices[f['voice']]} · {CELL_KO[f['cell']]}** — {why}")
            L.append(f"  - 지금 줄: {f['line']}" + (f" / 여운: {f['after']}" if f.get('after') else ''))
            for o in like:
                mark = ', 이번에 다시 씀' if (o['trigger'], o['voice'], o['cell']) in redo_keys else ''
                L.append(f"  - 닮은 줄({lab[o['trigger']]} · {CELL_KO[o['cell']]}{mark}): {o['line']}")
            ans.append({'trigger': t, 'event': lab[t], 'voice': f['voice'], 'voiceLabel': voices[f['voice']], 'cell': f['cell'],
                        'cellLabel': CELL_KO[f['cell']], 'why': why, 'old': f['line'], 'alike': [o['line'] for o in like], 'line': '', 'after': f.get('after', '')})
        L.append('')
    L += ['## 4. 돌려주기 전 확인', '1. 새 줄이 "지금 줄", "닮은 줄", 같은 목소리의 다른 새 줄과 첫 동작부터 다르다.', '2. 따옴표·말 전달·속마음 단정이 없다.',
          '3. 과거형이고 `{이름}{은/는}`으로 시작하며 110자 이하다(임신 확인은 본문+여운 159자 이하).',
          '4. 보상·절정·임신 장면에 벌의 흔적이 없다.', '5. 미성년자·동물 관련 표현이 없다.', '']
    (OUT / md).write_text('\n'.join(L), encoding='utf-8')
    json.dump({'note': '각 행의 line만 새로 쓴다. old는 지금 줄(참고용). 임신 확인의 after는 고쳐도 된다', 'rows': ans},
              open(OUT / js, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('다시 쓸 칸', len(ans), {lab[t]: sum(1 for a in ans if a['trigger'] == t) for t in ORDER[1:]})


def redo_merge(path):
    db = load()
    ans = json.load(open(path, encoding='utf-8'))
    idx = {(f['trigger'], f['voice'], f['cell']): f for f in db['fragments'] if f.get('by') == 'user'}
    probs, n = [], 0
    new = {}
    for r in ans['rows']:
        line = (r.get('line') or '').strip()
        if not line:
            continue
        k = (r['trigger'], r['voice'], r['cell'])
        where = f"{r['event']} · {r['voiceLabel']} · {r['cellLabel']}"
        if k not in idx:
            probs.append(where + ': DB에 없는 칸')
            continue
        after = (r.get('after') or '').strip()
        if re.search(r'["“”「」]', line + after):
            probs.append(where + ': 따옴표(대사)가 있음')
        if not line.startswith('{이름}{은/는}'):
            probs.append(where + ': {이름}{은/는}으로 시작하지 않음')
        if len(line) > 110 or len(line) + len(after) > 159:
            probs.append(where + f': 길이 초과({len(line)}+{len(after)})')
        if '아픈 자리' in line or '맞은 자리' in line:
            probs.append(where + ': 벌의 흔적이 있음')
        if line == r.get('old'):
            probs.append(where + ': 지금 줄과 같음')
        f = idx[k]
        f['line'] = line
        if after:
            f['after'] = after
        else:
            f.pop('after', None)
        f['note'] = '사용자 의뢰 다시 쓰기 반영(다른 AI 작성, 2026-11-19)'
        new[k] = where
        n += 1
    lab = {t['id']: t['label'] for t in db['triggers']}
    fs = [f for f in db['fragments'] if f['trigger'] in ORDER and f.get('by') == 'user']
    for k, where in new.items():
        f = idx[k]
        for o in fs:
            if o is not f and o['trigger'] != f['trigger'] and o['voice'] == f['voice'] and alike(f['line'], o['line']):
                probs.append(where + f": {lab[o['trigger']]} · {CELL_KO[o['cell']]} 줄과 닮음")
    json.dump(db, open(DB, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(DB, 'a').write('\n')
    print('바꿈', n)
    for p in probs:
        print('확인:', p)


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == '--merge':
        merge(sys.argv[2])
    elif len(sys.argv) > 2 and sys.argv[1] == '--merge-redo':
        redo_merge(sys.argv[2])
    elif len(sys.argv) > 1 and sys.argv[1] == '--redo':
        redo_build(int(sys.argv[2]) if len(sys.argv) > 2 else 1)
    else:
        build()
