# 질문 메뉴 원고 데이터(q*_manuscript.json)를 원문과 나란히 놓은 검토용 HTML 표로 뽑는 도구
"""사용법: python tools/q_manuscript_html.py [원고 JSON] [칸 채우기 CSV] [출력 HTML]"""
import csv, html, json, re, sys
from pathlib import Path

SRC = sys.argv[1] if len(sys.argv) > 1 else 'docs/dialogue-rules/question-fill/q1112_manuscript.json'
CSV = sys.argv[2] if len(sys.argv) > 2 else 'docs/dialogue-rules/question-fill/question_fill_table.csv'
OUT = sys.argv[3] if len(sys.argv) > 3 else 'docs/dialogue-rules/question-fill/q1112_manuscript.html'
e = html.escape
data = json.load(open(SRC, encoding='utf-8'))
rows = data['rows']
orig = {(r['question'], r['role'], r['cell'], r['voice']): r for r in csv.DictReader(open(CSV, encoding='utf-8-sig'))}

TOPICS = [('A', '최근 칭찬'), ('B', '최근 처벌'), ('C', '오늘 처벌'), ('D', '오늘 칭찬'),
          ('fact_fear', '두려움'), ('fact_obed', '복종'), ('fact_custom', '습관'), ('fact_instinct', '본능'),
          ('fact_moral', '헌신'), ('fact_ratio', '합리(이득)'), ('fact_relation', '관계 상태'),
          ('fact_spoil', '대우(응석)'), ('fact_urge', '욕구')]
REL = {'arrogant': '오만', 'hateful': '증오', 'hysteric': '히스테리', 'reluctant': '꺼림', 'resistant': '반항',
       'broken': '무너짐', 'depresive': '우울', 'docile': '온순', 'frightened': '겁먹음', 'lachrymose': '눈물',
       'obedient': '순종', 'horny': '발정', 'optimistic': '낙관', 'servile': '예속', 'soft': '상냥'}


def topic(role):
    for k, label in TOPICS:
        if role == k or role.startswith(k + '_'):
            return k, label
    return role, role


def slot(role):
    if role in ('A', 'B', 'C', 'D'):
        return '요약'
    m = re.match(r'fact_relation_(\w+?)_(core|detail)$', role)
    if m:
        return REL.get(m.group(1), m.group(1)) + (' 덧붙임' if m.group(2) == 'detail' else '')
    m = re.match(r'fact_\w+?_(\d)_(core|detail)$', role)
    if m:
        return f'{m.group(1)}단계' + (' 덧붙임' if m.group(2) == 'detail' else '')
    return role


def show(s):
    return re.sub(r'(\{호칭[^}]*\})', r'<span class="tok">\1</span>', e(s))


def original(r):
    o = orig.get((r['question'], r['role'], r['cell'], r['voice']))
    if not o:
        return '', ''
    tone = str(r.get('tone', '')) or ('3' if r['voice'] in ('명랑한', '거센') else '2')
    t = tone[0] if tone[:1] in '123' else '2'
    if r['kind'] == '보완':
        txt = o['original_t2'] or o['original_t1'] or o['original_t3']
        return txt, '같은 칸의 다른 판(뜻의 기준)'
    if '말투 2 대체' in o.get('note', ''):
        t = '2'
    txt = o[f'original_t{t}'] or o['original_t2']
    return txt, f'나눠 쓰던 원래 줄(말투 {t})'


groups = {}
for r in rows:
    k, label = topic(r['role'])
    groups.setdefault((k, label), []).append(r)
order = [t for t in TOPICS if t in groups]

nav, parts = [], []
ujump = []
uid = 0
cnt = {'분리': 0, '보완': 0, 'user': 0}
for r in rows:
    if r['writer'] == 'user':
        cnt['user'] += 1
    else:
        cnt[r['kind']] = cnt.get(r['kind'], 0) + 1
for k, label in order:
    rs = groups[(k, label)]
    nav.append(f'<a href="#{e(k)}">{e(label)} <span class="n">{len(rs)}</span></a>')
    body = ['<div class="wrap"><table><thead><tr><th>칸</th><th>관계 칸</th><th>목소리</th><th>구분</th><th>새 줄</th><th>원문</th></tr></thead><tbody>']
    for r in rs:
        o, olabel = original(r)
        if r['writer'] == 'user' and r.get('text'):
            new = f'<div class="line">{show(r["text"])}</div><div class="olab">{len(r["text"])}자</div>'
        elif r['writer'] == 'user':
            new = '<span class="user">사용자 작성 칸(성적인 주제)</span>'
        else:
            new = f'<div class="line">{show(r["text"])}</div>'
        kind = '사용자' if r['writer'] == 'user' else r['kind']
        cls = {'분리': 'split', '보완': 'fill', '사용자': 'user'}[kind]
        cell = '' if r['cell'] == '*' else e(r['cell'])
        rid = ''
        if r['writer'] == 'user':
            uid += 1
            rid = f' id="u{uid}"'
            state = 'filled' if r.get('text') else 'empty'
            lab = f"{label} {slot(r['role'])}" + (f" {r['cell']}" if r['cell'] != '*' else '') + f" · {r['voice']}"
            ujump.append(f'<a class="{state}" href="#u{uid}">{e(lab)}</a>')
        ocell = f'<div class="orig">{show(o)}</div><div class="olab">{e(olabel)}</div>' if o else ''
        body.append(f'<tr{rid}><td class="slot">{e(slot(r["role"]))}</td><td class="cell">{cell}</td><td class="voice">{e(r["voice"])}</td>'
                    f'<td><span class="badge {cls}">{kind}</span><div class="olab">{e(r.get("batch", ""))}</div></td><td>{new}</td><td>{ocell}</td></tr>')
    body.append('</tbody></table></div>')
    parts.append(f'<section id="{e(k)}"><h2>{e(label)}</h2>' + ''.join(body) + '</section>')

css = '''
/* 레이아웃: 위에 요약과 주제 목록, 아래로 주제마다 새 줄과 원문을 나란히 놓은 표 */
:root{--bg:#f5f6f8;--surface:#ffffff;--fg:#1d2128;--muted:#5f6673;--line:#dde1e8;--accent:#3a5a9c;--tok:#8a4b9e;
--split:#3a5a9c;--fill:#2f7a5a;--user:#9a5b16;
--sans:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;--serif:"Noto Serif KR","Batang",serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15171c;--surface:#1d2027;--fg:#e7e9ee;--muted:#a2a8b4;--line:#323743;--accent:#8fa9e0;--tok:#d3a2e6;--split:#8fa9e0;--fill:#7cc4a2;--user:#e0a560;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#15171c;--surface:#1d2027;--fg:#e7e9ee;--muted:#a2a8b4;--line:#323743;--accent:#8fa9e0;--tok:#d3a2e6;--split:#8fa9e0;--fill:#7cc4a2;--user:#e0a560;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:15px/1.65 var(--sans);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
main{max-width:1320px;margin:0 auto;padding-block:28px 64px;display:grid;gap:28px}
h1{font:600 24px/1.3 var(--serif);margin:0;text-wrap:balance}h2{font:600 19px/1.3 var(--serif);margin:0 0 8px}
p{margin:0;max-width:72ch}.meta{color:var(--muted);font-size:13px}
.summary{display:flex;flex-wrap:wrap;gap:8px 18px;color:var(--muted);font-size:14px}.summary b{color:var(--fg);font-variant-numeric:tabular-nums}
nav{display:flex;flex-wrap:wrap;gap:6px}
nav a{color:var(--accent);text-decoration:none;border:1px solid var(--line);background:var(--surface);padding:3px 10px;border-radius:999px;font-size:13px}
nav a:hover,nav a:focus-visible{border-color:var(--accent)}.n{color:var(--muted);font-variant-numeric:tabular-nums}
section{scroll-margin-top:16px}
.wrap{overflow-x:auto;border:1px solid var(--line);border-radius:6px;background:var(--surface)}
table{border-collapse:collapse;width:100%;min-width:900px;font-size:14px}
th,td{border-bottom:1px solid var(--line);padding:9px 11px;text-align:left;vertical-align:top}
thead th{font-size:12px;letter-spacing:.04em;color:var(--muted);font-weight:600;background:var(--bg)}
tbody tr:last-child td{border-bottom:0}
td.slot,td.cell,td.voice{white-space:nowrap}td.voice{font-weight:600}
td:nth-child(5){width:38%}td:nth-child(6){width:30%}
.line{font-family:var(--serif)}.orig{color:var(--muted)}.olab{color:var(--muted);font-size:11px;margin-top:3px}
.tok{color:var(--tok)}
.ujump{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:13px}
.ujump .ulabel{color:var(--muted);margin-right:4px}.ujump .ulegend{color:var(--muted);font-size:12px;margin-left:4px}
.ujump a{text-decoration:none;padding:3px 10px;border-radius:999px;border:1px solid var(--user);color:var(--user)}
.ujump a.empty{border-style:dashed;font-style:italic}
.ujump a:hover,.ujump a:focus-visible{background:var(--user);color:var(--surface)}
.summary a{color:inherit}
tr[id]{scroll-margin-top:80px}
tr:target td{background:color-mix(in srgb,var(--user) 16%,transparent)}
@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
.badge{display:inline-block;font-size:11px;padding:1px 7px;border-radius:3px;border:1px solid currentColor;white-space:nowrap}
.badge.split{color:var(--split)}.badge.fill{color:var(--fill)}.badge.user{color:var(--user)}.user{color:var(--user)}
'''
page = f'''<title>인상 묻기 원고표</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600&family=Noto+Serif+KR:wght@400;600&display=swap">
<style>{css}</style>
<main>
<header style="display:grid;gap:10px"><h1>인상 묻기 원고표</h1>
<p class="meta">질문 메뉴 "인상 묻기"(1112)에서 새로 쓴 줄을 원문과 나란히 놓았다. 분리는 같은 줄을 나눠 쓰던 목소리의 새 판, 보완은 판이 없던 목소리의 새 줄이다. 보라색 빈칸은 호칭이며 헌신·복종에 따라 당신/주인님(공주는 너/당신/주인)으로 채워진다. 말투는 명랑한·거센 3, 도도한·조용한 1, 순한·담백한 2, 공주 반말.</p>
<div class="summary"><span>행 <b>{len(rows)}</b></span><span>분리 <b>{cnt.get("분리", 0)}</b></span><span>보완 <b>{cnt.get("보완", 0)}</b></span><span><a href="#u1">사용자 작성 칸 <b>{cnt["user"]}</b></a> (빈 칸 <b>{sum(1 for r in rows if r["writer"] == "user" and not r.get("text"))}</b>)</span></div>
<nav>{"".join(nav)}</nav>
<div class="ujump"><span class="ulabel">사용자 작성 칸 바로가기</span>{"".join(ujump)}<span class="ulegend">채움 / <i>빈 칸</i></span></div></header>
{"".join(parts)}
</main>'''
Path(OUT).write_text(page, encoding='utf-8')
print(OUT, len(rows), cnt)
