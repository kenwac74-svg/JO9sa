# 색인(글 주소·질문 번호·차례)으로 원본 블로그에서 대답 원문을 가져와 사용자 PC의 local/ 에 DB 사본을 만드는 스크래퍼
# 사용: python3 -I fetch_originals.py            원문이 비어 있는 대답만 채운다
#       python3 -I fetch_originals.py --all      모든 대답을 원본에서 다시 가져온다
# 결과(local/, git 제외): interview-db.json · posts-db.json · interview-refs.json. 편집기는 local/ 파일이 있으면 그것을 읽는다.
# 내용은 판단하지 않는다. 키·주제(질문 번호에 붙은 first_age 등)·분류 코드는 저장소 색인 값을 그대로 쓴다.
import sys, re, json, html, time, pathlib, subprocess, hashlib, collections, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
LOCAL = HERE / 'local'
PAGES = LOCAL / 'pages'
HANDLE = re.compile(r'@[A-Za-z0-9_]+')  # build-db.py와 같은 처리(계정 이름 가림)
PART_SPLIT = re.compile(r'\n+|(?<=[.!?~…])\s+|(?=(?<!\d)\d\)\s*)')  # build-db.py split_parts와 같은 규칙


def download(url):
    """파이썬 내장 urllib로 받는다. 안 되면 curl로 다시 시도한다(윈도우 curl은 인증서 폐기 검사 실패를 피하려고 --ssl-no-revoke)."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.read()
    except Exception as error:  # noqa: BLE001 - curl로 한 번 더 시도한다
        cmd = ['curl', '-sS', '-L', url]
        if sys.platform == 'win32':
            cmd.insert(1, '--ssl-no-revoke')
        got = subprocess.run(cmd, capture_output=True)
        if got.returncode != 0:
            raise SystemExit(f'내려받기 실패: {url}\n  urllib: {error}\n  curl: {got.stderr.decode("utf-8", "replace").strip()}')
        return got.stdout


def fetch(url):
    """글 HTML을 local/pages 에 받아 두고 읽는다(이미 있으면 다시 받지 않는다)."""
    PAGES.mkdir(parents=True, exist_ok=True)
    f = PAGES / (hashlib.sha256(url.encode()).hexdigest()[:16] + '.html')
    if not f.is_file() or f.stat().st_size == 0:
        f.write_bytes(download(url))
        time.sleep(0.7)
    return f.read_text(encoding='utf-8', errors='replace')


def qa_pairs(t):
    """글 본문에서 (질문 번호, 대답) 목록을 뽑는다. parse.py와 같은 규칙."""
    i = t.find('post-body entry-content'); j = t.find('post-footer', i)
    b = t[i:j]; b = b[b.find('>') + 1:]
    b = re.sub(r'<br\s*/?>', '\n', b); b = re.sub(r'</(p|div|li|h\d)>', '\n', b)
    b = html.unescape(re.sub(r'<[^>]+>', '', b)).replace('\xa0', ' ')
    qa, cur, mode = [], None, None
    for l in (x.strip() for x in b.splitlines()):
        if not l:
            continue
        mq = re.match(r'^Q\s*(\d+)\s*[.:)]?\s*(.*)', l); ma = re.match(r'^A\s*(\d+)\s*[.:)]?\s*(.*)', l)
        if mq:
            cur = {'n': int(mq.group(1)), 'q': mq.group(2), 'a': ''}; qa.append(cur); mode = 'q'
        elif ma and cur is not None:
            if int(ma.group(1)) != cur['n']:
                cur = next((x for x in qa if x['n'] == int(ma.group(1))), cur)
            cur['a'] = (cur['a'] + '\n' + ma.group(2)).strip(); mode = 'a'
        elif cur is not None:
            k = 'q' if mode == 'q' else 'a'; cur[k] = (cur[k] + '\n' + l).strip()
    return qa


def answer_at(url, q, occurrence, cache):
    if url not in cache:
        cache[url] = qa_pairs(fetch(url))
    hits = [x for x in cache[url] if x['n'] == q]
    return HANDLE.sub('@…', hits[occurrence - 1]['a']).strip() if len(hits) >= occurrence else None


def main(refetch_all=False):
    db = json.loads((HERE / 'interview-db.json').read_text(encoding='utf-8'))
    posts = json.loads((HERE / 'posts-db.json').read_text(encoding='utf-8'))
    cache, filled, missing, sha_bad = {}, 0, [], 0
    texts = {}
    for r in db['rows']:
        if not (refetch_all or r['text_withheld']):
            continue
        a = answer_at(r['src']['url'], r['src']['q'], r['src']['occurrence'], cache)
        if a is None:
            missing.append(r['id']); continue
        parts = [s.strip() for s in PART_SPLIT.split(a) if s and s.strip()]
        # 색인의 부분 지문과 맞춰 본다(원본 글이 고쳐졌으면 어긋난다)
        if [p['sha'] for p in r['parts']] != [hashlib.sha256(s.encode('utf-8')).hexdigest()[:12] for s in parts]:
            sha_bad += 1
        r['answer'], r['text_withheld'] = a, False
        r['parts'] = [dict(p, text=s) for p, s in zip(r['parts'], parts)] if len(parts) == len(r['parts']) else \
            [{'key': f"{r['id']}.s{k:02d}", 'block': r['block'], 'sha': hashlib.sha256(s.encode('utf-8')).hexdigest()[:12], 'chars': len(s), 'text': s} for k, s in enumerate(parts, 1)]
        texts[r['id']] = a
        filled += 1
    for p in posts['posts']:
        for x in p['qa']:
            if x['key'] in texts:
                x['answer'], x['text_withheld'] = texts[x['key']], False
    LOCAL.mkdir(exist_ok=True)
    db['meta']['local_copy'] = True
    posts['meta']['local_copy'] = True
    (LOCAL / 'interview-db.json').write_text(json.dumps(db, ensure_ascii=False, indent=0), encoding='utf-8')
    (LOCAL / 'posts-db.json').write_text(json.dumps(posts, ensure_ascii=False, indent=0), encoding='utf-8')
    subprocess.run([sys.executable, '-I', str(HERE / 'build-refs.py'), str(LOCAL / 'interview-db.json'), str(LOCAL / 'interview-refs.json')], check=True, stdout=subprocess.DEVNULL)
    print(f'채움 {filled}개 · 찾지 못함 {len(missing)}개 · 지문 불일치(원본 글 수정 가능성) {sha_bad}개 · 결과 {LOCAL}')
    if missing:
        print('찾지 못한 키:', ', '.join(missing[:20]))


if __name__ == '__main__':
    main('--all' in sys.argv)
