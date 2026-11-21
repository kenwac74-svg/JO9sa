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
ucount = {'done': 0, 'wait': 0}
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
    user = t.get('writer') == 'user'
    if user:
        head += '<p class="note">사용자 입력 사건. 칸 표시: <b>사용자 완료</b>는 사용자가 입력을 마친 칸, <b>사용자 대기</b>는 사용자가 입력해야 DB가 완성되는 칸. 문장은 <code>db/enrich-db.json</code>에 있고 위의 "DB 불러오기"로 열어 편집·저장한다.' + (' 여운은 헌신 2 이상일 때 본문 다음 줄에 붙는다.' if t.get('weight') == 3 else ' 무게 2 사건이라 여운은 쓰지 않는다.') + '</p>'
    rows =['<div class="wrap"><table><thead><tr><th class="v">목소리</th>' + ''.join(f'<th>{e(CELL_LABEL[c])}</th>' for c in cells) + '</tr></thead><tbody>']
    for v in voices:
        tds = []
        for c in cells:
            fs = frag.get((tid, v['key'], c), [])
            if user:
                done = any((f.get('line') or '').strip() for f in fs)
                ucount['done' if done else 'wait'] += 1
                label = '사용자 완료' if done else '사용자 대기'
                tds.append(f'<td class="userin" data-k="{tid}|{v["key"]}|{c}" data-w="{t.get("weight")}"><span class="badge {"udone" if done else "uwait"}">{label}</span></td>')
                continue
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
.badge.new{color:var(--new)}.badge.redo{color:var(--redo)}.badge.keep{color:var(--keep)}.badge.user{color:var(--tok)}.badge.udone{color:var(--new)}.badge.uwait{color:var(--missing);font-weight:600}
.load{font-size:14px;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center}.load button{font:inherit;font-size:14px;padding:4px 12px;border:1px solid var(--accent);background:var(--surface);color:var(--accent);border-radius:4px;cursor:pointer}.load button:disabled{opacity:.45;cursor:default}
textarea.ed{width:100%;box-sizing:border-box;font:14px/1.5 var(--serif);background:var(--bg);color:var(--fg);border:1px solid var(--line);border-radius:4px;padding:4px 6px;resize:vertical}textarea.ed.after{font-size:13px;margin-top:4px}
.missing{color:var(--missing)}.empty{color:var(--muted);font-size:14px}
ul{margin:0;padding-left:18px}
@media (max-width:600px){h1{font-size:21px}}
'''
SCRIPT = r'''<script>
// 기계적인 입출력: 사용자가 고른 enrich-db.json을 읽어 사용자 입력 칸을 편집 칸으로 채우고, 저장하면 같은 형식(indent 1)으로 다시 쓴다. 내용 검사는 하지 않는다
let DB = null, HANDLE = null, FILENAME = 'enrich-db.json';
const state = msg => { document.getElementById('dbstate').textContent = msg; };
function fill() {
  const idx = {};
  DB.fragments.forEach((f, i) => { if (f.by === 'user') (idx[f.trigger + '|' + f.voice + '|' + f.cell] ||= []).push(i); });
  let n = 0;
  document.querySelectorAll('td.userin').forEach(td => {
    const k = td.dataset.k;
    const list = idx[k] || [null];
    td.replaceChildren();
    for (const i of list) {
      const f = i === null ? null : DB.fragments[i];
      // 여운은 무게 3 사건에만 쓴다. 무게 2라도 이미 여운이 들어 있으면 지우지 않게 보여 준다
      const fields = [['line', '본문']];
      if (td.dataset.w === '3' || (f && f.after)) fields.push(['after', '여운']);
      for (const [field, label] of fields) {
        const t = document.createElement('textarea');
        t.className = 'ed ' + field; t.rows = field === 'line' ? 3 : 2; t.placeholder = label;
        t.value = f ? (f[field] || '') : '';
        t.dataset.k = k; t.dataset.i = i === null ? '' : String(i); t.dataset.f = field;
        t.addEventListener('input', edit);
        td.append(t);
      }
      if (f) n++;
    }
    const b = document.createElement('span'); b.className = 'badge'; td.append(b);
    mark(td);
  });
  count();
  document.getElementById('dbsave').disabled = false;
  state(FILENAME + ' 불러옴. 사용자 입력 ' + n + '블록. 고친 뒤 저장하기를 누른다.');
}
// 칸 상태: 본문이 있으면 사용자 완료, 없으면 사용자 대기(DB 완성에 사용자 입력이 필요함)
function mark(td) {
  const done = [...td.querySelectorAll('textarea.line')].some(t => t.value.trim() !== '');
  const b = td.querySelector('.badge');
  b.className = 'badge ' + (done ? 'udone' : 'uwait');
  b.textContent = done ? '사용자 완료' : '사용자 대기';
}
function count() {
  let d = 0, w = 0;
  document.querySelectorAll('td.userin .badge').forEach(b => { if (b.classList.contains('udone')) d++; else w++; });
  document.getElementById('udone').textContent = d; document.getElementById('uwait').textContent = w;
}
function edit(ev) {
  const t = ev.target;
  let i = t.dataset.i;
  if (i === '') {
    // 빈 칸에 처음 쓰면 행을 하나 더한다
    const [trigger, voice, cell] = t.dataset.k.split('|');
    DB.fragments.push({ trigger, voice, cell, variant: 1, line: '', by: 'user' });
    i = String(DB.fragments.length - 1);
    t.closest('td').querySelectorAll('textarea').forEach(x => { if (x.dataset.i === '') x.dataset.i = i; });
  }
  const f = DB.fragments[Number(i)];
  if (t.dataset.f === 'after' && t.value === '') delete f.after; else f[t.dataset.f] = t.value;
  mark(t.closest('td')); count();
  state('저장하지 않은 변경 있음.');
}
async function openDb() {
  if (window.showOpenFilePicker) {
    try {
      [HANDLE] = await showOpenFilePicker({ types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }] });
      const file = await HANDLE.getFile(); FILENAME = file.name;
      DB = JSON.parse(await file.text()); fill(); return;
    } catch (err) { if (err.name === 'AbortError') return; HANDLE = null; }
  }
  document.getElementById('dbfile').click();
}
document.getElementById('dbopen').addEventListener('click', openDb);
document.getElementById('dbfile').addEventListener('change', async ev => {
  const file = ev.target.files[0];
  if (!file) return;
  FILENAME = file.name;
  try { DB = JSON.parse(await file.text()); } catch (err) { state('JSON을 읽지 못했다: ' + err.message); return; }
  fill();
});
document.getElementById('dbsave').addEventListener('click', async () => {
  const text = JSON.stringify(DB, null, 1) + '\n';
  if (HANDLE) {
    try { const w = await HANDLE.createWritable(); await w.write(text); await w.close(); state(FILENAME + '에 저장했다.'); return; }
    catch (err) { state('파일에 바로 쓰지 못해 내려받기로 저장한다: ' + err.message); }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = FILENAME; a.click(); URL.revokeObjectURL(a.href);
  state(FILENAME + '을 내려받았다. 저장소의 docs/dialogue-rules/db/enrich-db.json에 덮어쓴다.');
});
</script>'''
page = f'''<title>풍부화 원고 검토표</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600&family=Noto+Serif+KR:wght@400;600&display=swap">
<style>{css}</style>
<main>
<header style="display:grid;gap:10px"><h1>풍부화 원고 검토표</h1>
<p class="meta">DB 갱신 {e(db.get("updated", ""))}. 모든 블록은 대사 없는 관찰 지문이고 과거형이다. 여운 줄은 헌신 2 이상일 때만 붙는다. 이름 뒤 조사는 게임에서 (은)는으로 나온다.</p>
<div class="summary"><span>블록 <b>{total}</b></span><span>새로 씀 <b>{count["new"]}</b></span><span>다시 씀 <b>{count["redo"]}</b></span><span>과거형만 고침 <b>{count["keep"]}</b></span><span>몸짓 <b>{len(db["gestures"])}</b>칸</span><span>사용자 완료 <b id="udone">{ucount["done"]}</b></span><span>사용자 대기 <b id="uwait">{ucount["wait"]}</b></span></div>
<div class="load"><button id="dbopen" type="button">DB 불러오기</button><button id="dbsave" type="button" disabled>저장하기</button><input type="file" id="dbfile" accept=".json,application/json" hidden> <span id="dbstate" class="meta"><code>docs/dialogue-rules/db/enrich-db.json</code>을 불러오면 사용자 입력 칸이 편집 칸이 된다. 저장하기를 누르면 그 파일이 바뀐다(브라우저가 직접 쓰기를 못 하면 같은 이름으로 내려받는다).</span></div>
<nav>{"".join(nav)}</nav></header>
{"".join(parts)}
</main>'''
page += SCRIPT
Path(OUT).write_text(page, encoding='utf-8')
print(OUT, total, count)
