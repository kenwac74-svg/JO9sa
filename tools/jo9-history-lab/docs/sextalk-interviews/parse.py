# 수집한 인터뷰 글 HTML에서 제목·문항(Q)·대답(A) 쌍을 뽑아 JSON으로 저장하는 파서
import sys, re, html, json, os, glob
src, out = sys.argv[1], sys.argv[2]
urls = open(os.path.join(src, 'urls.txt')).read().split('\n')
posts = []
for f in sorted(glob.glob(os.path.join(src, 'pages', '*.html'))):
    idx = int(os.path.basename(f)[:4]); t = open(f, encoding='utf-8', errors='replace').read()
    m = re.search(r"<h3 class='post-title entry-title'[^>]*>\s*([^<]+)<", t)
    title = html.unescape(m.group(1)).strip() if m else ''
    d = re.search(r"<abbr class='published'[^>]*title='([^']+)'", t) or re.search(r"<meta content='(\d{4}-\d\d-\d\d)[^']*' itemprop='datePublished'", t)
    i = t.find("post-body entry-content"); j = t.find("post-footer", i)
    b = t[i:j]; b = b[b.find('>') + 1:]
    b = re.sub(r'<br\s*/?>', '\n', b); b = re.sub(r'</(p|div|li|h\d)>', '\n', b)
    b = html.unescape(re.sub(r'<[^>]+>', '', b)).replace('\xa0', ' ')
    lines = [l.strip() for l in b.splitlines() if l.strip()]
    qa, cur, mode = [], None, None
    for l in lines:
        mq = re.match(r'^Q\s*(\d+)\s*[.:)]?\s*(.*)', l); ma = re.match(r'^A\s*(\d+)\s*[.:)]?\s*(.*)', l)
        if mq:
            cur = {'n': int(mq.group(1)), 'q': mq.group(2), 'a': ''}; qa.append(cur); mode = 'q'
        elif ma and cur is not None:
            if int(ma.group(1)) != cur['n']:
                cur = next((x for x in qa if x['n'] == int(ma.group(1))), cur)
            cur['a'] = (cur['a'] + '\n' + ma.group(2)).strip(); mode = 'a'
        elif cur is not None:
            k = 'q' if mode == 'q' else 'a'; cur[k] = (cur[k] + '\n' + l).strip()
    posts.append({'idx': idx, 'url': urls[idx] if idx < len(urls) else '', 'title': title,
                  'date': d.group(1)[:10] if d else '', 'qa': qa, 'intro': lines[:3] if not qa else []})
json.dump(posts, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(posts), 'posts', sum(1 for p in posts if p['qa']), 'with qa', sum(len(p['qa']) for p in posts), 'pairs')
