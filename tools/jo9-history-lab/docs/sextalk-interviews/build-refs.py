# 창작물 DB(interview-db.json)에서 편집기가 필로우토크 대사의 원본을 보여 주는 데 쓸 가벼운 참조표(interview-refs.json)를 만든다
# 사용: python3 -I build-refs.py <interview-db.json> <출력 json>
import sys, json

db = json.load(open(sys.argv[1], encoding='utf-8'))
urls, url_ix, rows, topics = [], {}, {}, {}
for r in db['rows']:
    u = r['src']['url']
    if u not in url_ix:
        url_ix[u] = len(urls); urls.append(u)
    # 청소년기·수간 대답은 DB에서 문제 낱말·문장을 *로 가린 값이다(m = 1, [클로드 정책준수])
    rows[r['id']] = {'u': url_ix[u], 'q': r['q'], 'o': r['src']['occurrence'], 't': None if r['text_withheld'] else r['answer'],
                     'b': r['block'], 'p': [p['key'] for p in r['parts']]}
    if r.get('masked'):
        rows[r['id']]['m'] = 1
    if r['game']:
        topics.setdefault(r['topic'], []).append(r['id'])
out = {'schema': 'jo9-interview-refs/v1', 'note': '필로우토크 대사 각색용 원본 참조. topics = 게임에 쓰는 주제별 대답 키, rows = 키별 원본 위치(urls 번호·문항·차례)와 원문(m = 1이면 * 부분을 [클로드 정책준수]로 가림)·내부 코드·부분 키.',
       'blockNames': db['meta']['block_codes'], 'urls': urls, 'topics': topics, 'rows': rows}
json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(rows), {k: len(v) for k, v in topics.items()})
