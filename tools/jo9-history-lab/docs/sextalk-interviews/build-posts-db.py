# 파싱한 블로그 글(posts.json)을 글 단위로 묶어 posts-db.json을 만드는 스크립트(대답 키·표시불가 처리는 interview-db.json을 그대로 따른다)
# 사용: python3 -I build-posts-db.py <posts.json> <interview-db.json> <출력 json>
import sys, json, collections


def main(posts_path, db_path, out_path):
    posts = json.load(open(posts_path, encoding='utf-8'))
    db = json.load(open(db_path, encoding='utf-8'))
    rows = {r['id']: r for r in db['rows']}
    out_posts, used = [], set()
    for p in posts:
        pid = f'p{p["idx"]:04d}'
        seen = collections.Counter()
        qa = []
        for x in p['qa']:
            seen[x['n']] += 1  # build-db.py와 같은 키 규칙(같은 문항 번호가 또 나오면 .2, .3)
            key = f'{pid}.q{x["n"]:02d}' + (f'.{seen[x["n"]]}' if seen[x['n']] > 1 else '')
            r = rows.get(key)
            if r is None:
                raise SystemExit(f'interview-db.json에 없는 키: {key}')
            used.add(key)
            # 대답 원문은 interview-db.json 행의 answer를 그대로 쓴다. B1·B2는 자리표시만 들어 있다.
            qa.append({'key': key, 'n': x['n'], 'question': x['q'], 'topic': r['topic'],
                       'answer': r['answer'], 'text_withheld': r['text_withheld'],
                       'block': r['block'], 'display': r['display']})
        out_posts.append({'id': pid, 'url': p['url'], 'title': p['title'], 'date': p['date'],
                          'qa': qa, 'intro': p.get('intro', [])})
    missing = set(rows) - used
    if missing:
        raise SystemExit(f'글에서 찾지 못한 interview-db 키 {len(missing)}개: {sorted(missing)[:5]}')
    meta = {'schema': 'jo9-sextalk-posts-db/v1', 'posts': len(out_posts), 'pairs': len(used),
            'placeholder': db['meta']['placeholder'],
            'note': '블로그 글 단위 원문 DB. 대답 키는 interview-db.json과 같다. 청소년기(B1)·수간(B2) 대답은 원문 없이 자리표시만 담는다. 원본 HTML은 저장소에 올리지 않는다.'}
    json.dump({'meta': meta, 'posts': out_posts}, open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    print(meta['posts'], 'posts', meta['pairs'], 'pairs')


if __name__ == '__main__':
    main(*sys.argv[1:4])
