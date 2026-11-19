# 말투 3 조각 중 반말로 분류된 줄(공주 태그로 바꿀 대상)을 사람이 훑어볼 HTML 표로 뽑는 도구. QSP는 바꾸지 않는다
"""사용법: python tools/banmal_review_html.py [qsp 경로] [출력 HTML]
성적인 역할·낱말이 든 줄은 행을 남기되 문장은 싣지 않고 "사용자 확인"으로 표시한다."""
import html, json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import question_build_data as qb  # noqa: E402
from question_fill_table import SEX, SEX_ROLE  # noqa: E402
from qsp_dump import read_locations  # noqa: E402

QSP = sys.argv[1] if len(sys.argv) > 1 else 'assets/runtime/2.4.1/jack.qsp'
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'docs/dialogue-rules/question-fill/banmal_review.html')
qb.QSP = QSP
e = html.escape
MID_POLITE = re.compile(r'(요|니다|세요|죠|십시오)(?=[\s.,!?…~)\'"])')
SELF_POLITE = re.compile(r'(^|[\s(“"…])(저는|제가|저를|저도|저한테|저에게|제\s|전\s|저\s)')


def plain_table(qsp):
    body = next(l['body'] for l in read_locations(Path(qsp).read_bytes()) if l['name'] == 'jo9_plain_voice')
    pat = re.compile(r"if \$args\[1\]='(.*?)': \$result='(.*?)' & exit")
    return {m.group(1).replace("''", "'") for m in map(pat.search, body.splitlines()) if m}


def main():
    F, _ = qb.load()
    try:
        table = plain_table(QSP)
    except StopIteration:
        table = set()
    rows = []
    for fid, f in sorted(F.items()):
        if f.get('tone') != 3 or 'text' not in f or not qb.is_banmal(f['text']):
            continue
        t = f['text']
        hidden = bool(SEX_ROLE.search(f.get('role', '')) or SEX.search(t))
        flags = []
        if not hidden:
            if MID_POLITE.search(t):
                flags.append('존댓말 어미 섞임')
            if SELF_POLITE.search(t):
                flags.append('저·제 자칭')
        rows.append({'id': fid, 'role': f.get('role', ''), 'q': qb.qgroup(fid, f), 'rel': f.get('relations', '*'),
                     'types': f.get('types', '*'), 'text': t, 'hidden': hidden, 'flags': flags, 'tbl': t in table})
    n_flag = sum(1 for r in rows if r['flags'])
    n_hid = sum(1 for r in rows if r['hidden'])
    trs = []
    for i, r in enumerate(rows, 1):
        kind = 'hid' if r['hidden'] else ('flag' if r['flags'] else 'ok')
        text = '<span class="badge user">사용자 확인</span> 성적인 내용 후보라 문장을 싣지 않음' if r['hidden'] else e(r['text'])
        trs.append(f'<tr data-kind="{kind}"><td class="n">{i}</td><td class="id">{e(r["id"])}</td><td>{e(r["q"])}</td>'
                   f'<td class="id">{e(r["role"])}</td><td class="id">{e(r["rel"])}</td><td class="txt">{text}</td>'
                   f'<td>{"".join(f"<span class=badge>{e(x)}</span>" for x in r["flags"])}</td><td>{"있음" if r["tbl"] else ""}</td></tr>')
    css = '''
/* 위에 요약과 거르기 버튼, 아래로 반말 줄 표 */
:root{--bg:#f6f7f4;--surface:#fff;--fg:#1f2421;--muted:#5d665f;--line:#dde2dc;--accent:#2f6b57;--warn:#9a5b16;--user:#7a4f9a;
--sans:"Noto Sans KR","Malgun Gothic",system-ui,sans-serif;--serif:"Noto Serif KR","Batang",serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#161a18;--surface:#1e2320;--fg:#e6ebe7;--muted:#a3ada6;--line:#323a35;--accent:#7cc4a6;--warn:#e0a560;--user:#c9a2e6;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#161a18;--surface:#1e2320;--fg:#e6ebe7;--muted:#a3ada6;--line:#323a35;--accent:#7cc4a6;--warn:#e0a560;--user:#c9a2e6;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:15px/1.6 var(--sans);padding-inline:max(16px,env(safe-area-inset-left,0px))}
main{max-width:1280px;margin:0 auto;padding-block:28px 64px;display:grid;gap:18px}
h1{font:600 24px/1.3 var(--serif);margin:0}p{margin:0;max-width:75ch}.meta{color:var(--muted);font-size:13px}
.bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.bar button{font:inherit;font-size:13px;padding:4px 12px;border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:999px;cursor:pointer}
.bar button[aria-pressed="true"]{border-color:var(--accent);color:var(--accent);font-weight:600}
.bar input{font:inherit;font-size:14px;padding:4px 8px;border:1px solid var(--line);border-radius:4px;background:var(--surface);color:var(--fg);min-width:200px}
.wrap{overflow-x:auto;border:1px solid var(--line);border-radius:6px;background:var(--surface)}
table{border-collapse:collapse;width:100%;min-width:900px;font-size:14px}
th,td{border-bottom:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top}
thead th{position:sticky;top:0;background:var(--bg);font-size:12px;color:var(--muted)}
.n{color:var(--muted);font-variant-numeric:tabular-nums}.id{font-size:12px;color:var(--muted);word-break:break-all}
.txt{font-family:var(--serif);min-width:320px}
.badge{display:inline-block;font-size:11px;padding:1px 6px;border:1px solid var(--warn);color:var(--warn);border-radius:3px;margin:1px 2px}
.badge.user{border-color:var(--user);color:var(--user)}
'''
    js = '''<script>
// 거르기와 찾기: 표의 행만 숨기거나 보인다
let mode='all';
const q=document.getElementById('q');
function apply(){const s=q.value.trim();document.querySelectorAll('tbody tr').forEach(tr=>{
 const okMode=mode==='all'||tr.dataset.kind===mode;const okText=!s||tr.textContent.includes(s);tr.hidden=!(okMode&&okText);});
 document.getElementById('shown').textContent=[...document.querySelectorAll('tbody tr')].filter(t=>!t.hidden).length;}
document.querySelectorAll('.bar button').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.m;
 document.querySelectorAll('.bar button').forEach(x=>x.setAttribute('aria-pressed',x===b));apply();}));
q.addEventListener('input',apply);
</script>'''
    page = f'''<title>반말 줄 점검표</title>
<style>{css}</style>
<main>
<header style="display:grid;gap:10px"><h1>반말 줄 점검표</h1>
<p class="meta">말투 3 조각 중 끝맺음 규칙으로 반말로 분류된 줄. 이 줄들은 공주 태그(<code>|princess|</code>)로 바뀌어 공주 목소리만 고른다(질문 메뉴 핸드오프 7장, 문답 56). 잘못 분류된 줄이 있는지 훑어보는 표다. "의심"은 존댓말 어미가 문장 중간에 있거나 저·제 자칭이 있는 줄이다. "교정표"는 R05 반말 교정표에 같은 문장이 있다는 뜻이다. 성적인 내용 후보는 행만 두고 문장은 싣지 않았다(사용자 확인).</p>
<div class="bar"><button data-m="all" aria-pressed="true">전체 {len(rows)}</button><button data-m="flag" aria-pressed="false">의심 {n_flag}</button><button data-m="ok" aria-pressed="false">문제 없음 {len(rows) - n_flag - n_hid}</button><button data-m="hid" aria-pressed="false">사용자 확인 {n_hid}</button>
<input id="q" type="search" placeholder="문장·역할·id 찾기"><span class="meta">보이는 줄 <b id="shown">{len(rows)}</b></span></div></header>
<div class="wrap"><table><thead><tr><th>#</th><th>조각 id</th><th>질문</th><th>역할</th><th>관계 칸</th><th>문장</th><th>의심</th><th>교정표</th></tr></thead><tbody>
{"".join(trs)}
</tbody></table></div>
</main>{js}'''
    OUT.write_text(page, encoding='utf-8')
    print(OUT, '반말 줄', len(rows), '의심', n_flag, '사용자 확인', n_hid)


if __name__ == '__main__':
    main()
