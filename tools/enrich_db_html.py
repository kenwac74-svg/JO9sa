# 풍부화 DB(enrich-db.json)의 원고 블록과 몸짓 사전을 검토용 HTML 표로 뽑는 도구
"""사용법: python tools/enrich_db_html.py [DB 경로] [출력 HTML 경로]"""
import html, json, sys
from pathlib import Path

DB = sys.argv[1] if len(sys.argv) > 1 else 'docs/dialogue-rules/db/enrich-db.json'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'docs/dialogue-rules/db/enrich-db-review.html'
e = html.escape
db = json.load(open(DB, encoding='utf-8'))
voices = db['voices']
att = {a['key']: a['label'] for a in db['attitudes']}
CELL_LABEL = dict(att, hi='헌신 3 이상', lo='헌신 0~2', **{'*': '한 칸'})
WEIGHT = {3: '무게 3', 2: '무게 2'}


def show(s):
    return e(s).replace('{이름}{은/는}', '<span class="tok">{이름}(은)는</span>').replace('{이름}', '<span class="tok">{이름}</span>')


def tag(note):
    if not note:
        return ''
    if '사용자 고침' in note:
        return '<span class="badge user">사용자 고침</span>'
    if '원래 줄을 과거형으로만' in note:
        return '<span class="badge keep">과거형만 고침</span>'
    if '다시 씀' in note:
        return '<span class="badge redo">다시 씀</span>'
    if 'Claude 초안 2026-11-18' in note:
        return '<span class="badge new">새로 씀</span>'
    return ''


frag = {}
for f in db['fragments']:
    frag.setdefault((f['trigger'], f['voice'], f['cell']), []).append(f)

parts = []
nav = []
count = {'new': 0, 'redo': 0, 'keep': 0}
for f in db['fragments']:
    t = tag(f.get('note', ''))
    for k in count:
        if f'badge {k}' in t:
            count[k] += 1

for t in db['triggers']:
    lay = t.get('layout')
    if not lay or t.get('status') in ('excluded', 'on_hold'):
        continue
    cells = db['layouts'][lay]['cells']
    tid = t['id']
    nav.append(f'<a href="#{tid}">{e(t["label"])}</a>')
    writer = '사용자 작성' if t.get('writer') == 'user' else 'Claude 초안'
    meta = [WEIGHT.get(t.get('weight'), ''), writer]
    if t.get('condition'):
        meta.append(e(t['condition']))
    head = f'<section id="{tid}"><h2>{e(t["label"])} <span class="id">{tid}</span></h2>'
    head += '<p class="meta">' + ' · '.join(meta) + '</p>'
    if t.get('originalSpeechNote'):
        head += f'<p class="note">원래 대사: {e(t["originalSpeechNote"])}</p>'
    if t.get('status') == 'later_review':
        parts.append(head + '<p class="empty">추후 검토로 미룬 사건이라 아직 쓰지 않았다(칸 구조만 있음).</p></section>')
        continue
    if t.get('writer') == 'user':
        parts.append(head + '<p class="empty">성적인 장면이라 문장은 사용자가 쓴다. 칸 구조만 있다(' + ', '.join(CELL_LABEL[c] for c in cells) + ').</p></section>')
        continue
    rows = ['<div class="wrap"><table><thead><tr><th class="v">목소리</th>' + ''.join(f'<th>{e(CELL_LABEL[c])}</th>' for c in cells) + '</tr></thead><tbody>']
    for v in voices:
        tds = []
        for c in cells:
            fs = frag.get((tid, v['key'], c), [])
            if not fs:
                tds.append('<td class="missing">빈 칸</td>')
                continue
            cell = ''
            for f in fs:
                cell += f'<div class="line">{show(f["line"])}</div>'
                if f.get('after'):
                    cell += f'<div class="after">여운 · {show(f["after"])}</div>'
                cell += tag(f.get('note', ''))
            tds.append(f'<td>{cell}</td>')
        rows.append(f'<tr><th class="v">{e(v["label"])}</th>' + ''.join(tds) + '</tr>')
    rows.append('</tbody></table></div>')
    parts.append(head + ''.join(rows) + '</section>')

# 몸짓 사전
gatt = []
for g in db['gestures']:
    if g['attitude'] not in gatt:
        gatt.append(g['attitude'])
gmap = {(g['voice'], g['attitude']): g for g in db['gestures']}
nav.append('<a href="#gestures">몸짓 사전</a>')
g_rows = ['<section id="gestures"><h2>몸짓 사전</h2><p class="meta">목소리 × 태도마다 세 구절. 원고를 쓸 때 고르는 재료이며 게임에 그대로 나오지 않는다.</p><div class="wrap"><table><thead><tr><th class="v">목소리</th>' + ''.join(f'<th>{e(att.get(a, a))}</th>' for a in gatt) + '</tr></thead><tbody>']
for v in voices:
    tds = []
    for a in gatt:
        g = gmap.get((v['key'], a))
        tds.append('<td>' + ('<ul>' + ''.join(f'<li>{e(p)}</li>' for p in g['phrases']) + '</ul>' + tag(g.get('note', '')) if g else '빈 칸') + '</td>')
    g_rows.append(f'<tr><th class="v">{e(v["label"])}</th>' + ''.join(tds) + '</tr>')
g_rows.append('</tbody></table></div></section>')
parts.append(''.join(g_rows))

total = len(db['fragments'])
css = '''
/* 레이아웃: 위에 요약과 사건 목록, 아래로 사건마다 목소리 × 칸 표 */
:root{--bg:#f6f7f4;--surface:#ffffff;--fg:#1f2421;--muted:#5d665f;--line:#dde2dc;--accent:#2f6b57;--tok:#7a4f9a;
--new:#2f6b57;--redo:#9a5b16;--keep:#5d665f;--missing:#b23a3a;
--sans:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;--serif:"Noto Serif KR","Batang",serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#161a18;--surface:#1e2320;--fg:#e6ebe7;--muted:#a3ada6;--line:#323a35;--accent:#7cc4a6;--tok:#c9a2e6;--new:#7cc4a6;--redo:#e0a560;--keep:#a3ada6;--missing:#ef8a8a;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#161a18;--surface:#1e2320;--fg:#e6ebe7;--muted:#a3ada6;--line:#323a35;--accent:#7cc4a6;--tok:#c9a2e6;--new:#7cc4a6;--redo:#e0a560;--keep:#a3ada6;--missing:#ef8a8a;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:15px/1.65 var(--sans);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
main{max-width:1280px;margin:0 auto;padding-block:28px 64px;display:grid;gap:28px}
h1{font:600 24px/1.3 var(--serif);margin:0;text-wrap:balance}
h2{font:600 19px/1.3 var(--serif);margin:0 0 4px;text-wrap:balance}
.id{font:12px var(--sans);color:var(--muted);font-weight:400;margin-left:6px}
p{margin:0;max-width:70ch}.meta,.note{color:var(--muted);font-size:13px}
.summary{display:flex;flex-wrap:wrap;gap:8px 18px;color:var(--muted);font-size:14px}
.summary b{color:var(--fg);font-variant-numeric:tabular-nums}
nav{display:flex;flex-wrap:wrap;gap:6px}
nav a{color:var(--accent);text-decoration:none;border:1px solid var(--line);background:var(--surface);padding:3px 10px;border-radius:999px;font-size:13px}
nav a:focus-visible,nav a:hover{border-color:var(--accent)}
section{display:grid;gap:8px;scroll-margin-top:16px}
.wrap{overflow-x:auto;border:1px solid var(--line);border-radius:6px;background:var(--surface)}
table{border-collapse:collapse;width:100%;min-width:760px;font-size:14px}
th,td{border-bottom:1px solid var(--line);padding:10px 12px;text-align:left;vertical-align:top}
td+td,th+th{border-left:1px solid var(--line)}
thead th{font-size:12px;letter-spacing:.04em;color:var(--muted);font-weight:600;background:var(--bg)}
th.v{width:92px;font-weight:600;white-space:nowrap}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}
.line{font-family:var(--serif)}.after{color:var(--muted);font-size:13px;margin-top:4px}
.tok{color:var(--tok)}
.badge{display:inline-block;margin-top:6px;font-size:11px;letter-spacing:.03em;padding:1px 7px;border-radius:3px;border:1px solid currentColor}
.badge.new{color:var(--new)}.badge.redo{color:var(--redo)}.badge.keep{color:var(--keep)}.badge.user{color:var(--tok)}
.missing{color:var(--missing)}.empty{color:var(--muted);font-size:14px}
ul{margin:0;padding-left:18px}
@media (max-width:600px){h1{font-size:21px}}
'''
page = f'''<title>풍부화 원고 검토표</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600&family=Noto+Serif+KR:wght@400;600&display=swap">
<style>{css}</style>
<main>
<header style="display:grid;gap:10px"><h1>풍부화 원고 검토표</h1>
<p class="meta">DB 갱신 {e(db.get("updated", ""))}. 모든 블록은 대사 없는 관찰 지문이고 과거형이다. 여운 줄은 헌신 2 이상일 때만 붙는다. 이름 뒤 조사는 게임에서 (은)는으로 나온다.</p>
<div class="summary"><span>블록 <b>{total}</b></span><span>새로 씀 <b>{count["new"]}</b></span><span>다시 씀 <b>{count["redo"]}</b></span><span>과거형만 고침 <b>{count["keep"]}</b></span><span>몸짓 <b>{len(db["gestures"])}</b>칸</span></div>
<nav>{"".join(nav)}</nav></header>
{"".join(parts)}
</main>'''
Path(OUT).write_text(page, encoding='utf-8')
print(OUT, total, count)
