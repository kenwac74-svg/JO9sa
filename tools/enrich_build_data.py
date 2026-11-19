# 풍부화 DB(enrich-db.json)를 모드 개발이 바로 쓸 수 있는 사건별 데이터로 펼치는 도구. QSP는 바꾸지 않는다
"""사용법: python tools/enrich_build_data.py [DB] [출력 JSON]"""
import json, sys
from pathlib import Path

DB = sys.argv[1] if len(sys.argv) > 1 else 'docs/dialogue-rules/db/enrich-db.json'
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'docs/dialogue-rules/handoff/build/enrich_build_data.json')
# DB 목소리 키 → 질문 메뉴와 같은 저장값($slave['jo9_vtype'])
VTYPES = {'meek': ['meek', 'fragile'], 'plain': ['plain'], 'proud': ['proud', 'ice'], 'quiet': ['doll', 'calm'],
          'princess': ['princess'], 'bright': ['frank'], 'fierce': ['flame']}
db = json.load(open(DB, encoding='utf-8'))


def qsp_text(s):
    # 이름 자리는 게임 관례대로 쓴다
    return s.replace('{이름}{은/는}', '<<$slave_name>>(은)는').replace('{이름}', '<<$slave_name>>')


events = []
for t in db['triggers']:
    if t.get('status') not in ('text_draft', 'draft_mod'):
        continue
    lay = db['layouts'][t['layout']]
    cells = {}
    for f in db['fragments']:
        if f['trigger'] != t['id']:
            continue
        cells.setdefault(f['cell'], {}).setdefault(f['voice'], []).append(
            {'line': qsp_text(f['line']), 'after': qsp_text(f.get('after', '')), 'variant': f.get('variant', 1)})
    events.append({'id': t['id'], 'label': t['label'], 'weight': t['weight'], 'layout': t['layout'], 'cells': lay['cells'],
                   'cellRule': lay['note'], 'condition': t.get('condition', ''), 'hooksFromDb': t.get('hooks', []),
                   'originalSpeech': t.get('originalSpeech'), 'text': cells})
data = {'voiceTypes': VTYPES, 'limits': db['limits'], 'events': events,
        'notWritten': [{'id': t['id'], 'label': t['label'], 'status': t['status'], 'writer': t.get('writer')}
                       for t in db['triggers'] if t.get('status') in ('structure_only', 'later_review')]}
OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(OUT, '사건', len(events), '블록', sum(len(v) for e in events for c in e['text'].values() for v in c.values()))
