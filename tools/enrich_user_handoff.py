# 풍부화 DB의 빈 사건 칸(사용자 작성)을 다른 AI에게 맡기는 핸드오프와 답안 틀을 만들고, 돌려받은 답안을 DB에 넣는 도구
"""사용법:
  python tools/enrich_user_handoff.py            → handoff/USER_EVENTS_HANDOFF_KO.md, user_events_answer.json
  python tools/enrich_user_handoff.py --merge <답안 JSON>  → 검사 후 db/enrich-db.json에 넣는다"""
import json, re, sys
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


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == '--merge':
        merge(sys.argv[2])
    else:
        build()
