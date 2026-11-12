# 블로그 목록 페이지를 따라가며 글 URL을 모으고 글 본문 HTML을 저장하는 수집 스크립트
import re, subprocess, time, sys, os, html
out = sys.argv[1]
url = 'https://kurathekura5.blogspot.com/search?max-results=20'
seen = []
while url:
    t = subprocess.run(['curl', '-sS', url], capture_output=True, text=True).stdout
    for u in re.findall(r"<h3 class='post-title entry-title'[^>]*>\s*<a href='([^']+)'", t):
        if u not in seen: seen.append(u)
    m = re.search(r"blog-pager-older-link[^>]*href='([^']+)'", t)
    url = html.unescape(m.group(1)) if m else None
    if url: url = re.sub(r'max-results=\d+', 'max-results=20', url)
    print(len(seen), flush=True); time.sleep(1)
open(os.path.join(out, 'urls.txt'), 'w').write('\n'.join(seen))
for i, u in enumerate(seen):
    f = os.path.join(out, 'pages', f'{i:04d}.html')
    if not os.path.exists(f):
        subprocess.run(['curl', '-sS', u, '-o', f]); time.sleep(0.7)
print('done', len(seen))
