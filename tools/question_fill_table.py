# 질문 메뉴 대사 조각을 목소리·관계 칸별로 분류해 칸 채우기 표(CSV, HTML)를 만드는 도구
"""사용법: python tools/question_fill_table.py [qsp 경로] [출력 폴더]

분류
  재활용  맞는 기존 줄이 있다(전용 또는 공통 줄)
  분리    맞는 전용 줄이 있으나 다른 목소리와 같이 쓴다(대표 목소리는 재활용)
  보완    같은 칸에 뜻은 있으나 이 목소리·말투 판이 없다
  신규    이 관계 칸에 해당하는 줄이 하나도 없다
  원문만  써야 하는 칸인데 원문이 성적인 내용 후보다(Claude가 쓰지 않음, 사용자 작성)
"""
import csv, html, json, re, sys, collections
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from qsp_dump import read_locations  # noqa: E402

QNAME = {'1111': '과거', '1112': '인상', '1113': '요구', '1114': '희망', '1115': '불만',
         '1116': '기분', '1117': '조수', '공용': '질문 지정 없음'}
VOICES = ['순한', '담백한', '도도한', '조용한', '공주', '명랑한', '거센']
VTAGS = {'순한': ['meek', 'fragile'], '담백한': ['plain'], '도도한': ['proud'],
         '조용한': ['doll', 'calm'], '명랑한': ['frank'], '거센': ['flame']}
# 같은 줄을 여러 목소리가 쓸 때 원래 줄을 남길 목소리의 순서
REP_ORDER = ['순한', '조용한', '도도한', '거센', '명랑한']
CELLS = {'움츠림': {'fearful', 'bleak'}, '순함': {'hopeful', 'neutral'},
         '따름': {'loyal', 'duty'}, '맞섬': {'hostile'}}
SEX = re.compile('섹스|성교|자위|젖가슴|가슴을 만|엉덩이|음부|보지[는가를에도]|자지[가를는에]|절정|애무|성기|젖꼭지|발정|교미|정액|삽입|알몸|벗겨|핥|쾌락|음탕|창녀|성노예|살을 섞')
END_POLITE = re.compile(r'(요|니다|죠|세요|까)[.?!…)~]*\s*$')


def is_banmal(s):
    return not END_POLITE.search(s.strip())


def tone_plan(plan):
    # 목소리 -> (주 말투, 대체 말투)
    if plan == 'A':
        return {v: (2, None) for v in VOICES if v != '공주'}
    return {'순한': (2, None), '담백한': (2, None), '도도한': (1, 2), '조용한': (1, 2),
            '명랑한': (3, 2), '거센': (3, 2)}


def load(qsp):
    locs = read_locations(Path(qsp).read_bytes())
    body = next(l['body'] for l in locs if l['name'] == '#txt_man')
    pat = re.compile(r"^\s*\$?voice_fragment_(text|role|types|relations|level|tone|question)\['([^']+)'\]\s*=\s*'?(.*?)'?\s*$")
    F = collections.defaultdict(dict)
    for line in body.splitlines():
        m = pat.match(line)
        if m:
            F[m.group(2)][m.group(1)] = m.group(3).replace("''", "'")
    return F


def question_of(i, r):
    if r.get('question'):
        return r['question']
    m = re.search(r'q(11\d\d)', i)
    return m.group(1) if m else '공용'


def build(F, plan='B', use_ice=True):
    tp = tone_plan(plan)
    vt = {k: list(v) for k, v in VTAGS.items()}
    if use_ice:
        vt['도도한'] = vt['도도한'] + ['ice']
    # 슬롯(말투 판 묶음) 만들기
    slots = collections.defaultdict(dict)
    meta = {}
    for i, r in F.items():
        if 'text' not in r or 'tone' not in r:
            continue
        base = i[:-1] if i[-1] in '123' else i
        slots[base][int(r['tone'])] = (i, r['text'])
        meta[base] = r
    groups = collections.defaultdict(list)
    for base, r in meta.items():
        groups[(question_of(base, r), r.get('role', '?'))].append(base)

    def voices_of(base):
        t = meta[base].get('types', '*')
        if t == '*':
            return None
        ts = set(t.strip('|').split('|'))
        return [v for v, tags in vt.items() if ts & set(tags)]

    def cells_of(base):
        t = meta[base].get('relations', '*')
        if t == '*':
            return None
        ts = set(t.strip('|').split('|'))
        return {c for c, tags in CELLS.items() if ts & tags}

    rows = []
    for (q, role), bases in sorted(groups.items()):
        tagged = any(cells_of(b) is not None for b in bases)
        cell_list = list(CELLS) if tagged else ['*']
        for cell in cell_list:
            in_cell = [b for b in bases if cell == '*' or cells_of(b) is None or cell in cells_of(b)]
            for v in VOICES:
                rows.append(classify(q, role, cell, v, in_cell, slots, voices_of, tp, lambda b: meta[b].get('types', '*')))
    return rows


def pick_text(slots, base, tone, banmal=None):
    s = slots[base].get(tone)
    if not s:
        return None
    if banmal is True and not is_banmal(s[1]):
        return None
    if banmal is False and is_banmal(s[1]):
        return None
    return s


def classify(q, role, cell, v, in_cell, slots, voices_of, tp, types_of):
    row = {'question': q, 'question_name': QNAME.get(q, q), 'role': role, 'cell': cell,
           'voice': v, 'class': '', 'note': '', 'tone': '', 'source_ids': '',
           'original_t1': '', 'original_t2': '', 'original_t3': ''}
    if not in_cell:
        row['class'] = '신규'
        row['note'] = '이 관계 칸에 해당하는 기존 줄 없음'
        return row
    ref = in_cell[0]
    found = []
    note = ''
    shared = False
    if v == '공주':
        row['tone'] = '3(반말)'
        found = [b for b in in_cell if pick_text(slots, b, 3, True)]
        tone_used = 3
    else:
        main, alt = tp[v]
        row['tone'] = str(main)
        own = [b for b in in_cell if voices_of(b) and v in voices_of(b)]
        if v == '도도한':
            # 도도 줄을 먼저, 얼음 줄은 그 칸에 도도 줄이 없을 때만
            proud = [b for b in own if '|proud|' in types_of(b)]
            own = proud or own
        common = [b for b in in_cell if voices_of(b) is None]
        tone_used = main
        for pool, kind in ((own, '전용'), (common, '공통')):
            hit = [b for b in pool if pick_text(slots, b, main, False)]
            if not hit and alt:
                hit = [b for b in pool if pick_text(slots, b, alt, False)]
                if hit:
                    tone_used = alt
                    note = f'말투 {alt} 대체'
            if hit:
                found = hit
                note = (kind + ' 줄' + (', ' + note if note else ''))
                if kind == '전용' and v != '담백한':
                    others = set()
                    for b in hit:
                        # 말투가 다르면 같은 슬롯이라도 다른 문장이 나가므로 같은 말투끼리만 겹친 것으로 본다
                        for x in voices_of(b):
                            if x in ('담백한', v):
                                continue
                            xt = tp[x][0] if pick_text(slots, b, tp[x][0], False) else tp[x][1]
                            if xt == tone_used:
                                others.add(x)
                    if others:
                        rep = next(x for x in REP_ORDER if x == v or x in others)
                        if rep != v:
                            shared = True
                            note += ', 함께 쓰는 목소리 ' + '·'.join(sorted(others)) + f' (원래 줄은 {rep})'
                break
    src = found[0] if found else ref
    for t in (1, 2, 3):
        s = slots[src].get(t)
        row[f'original_t{t}'] = s[1] if s else ''
    row['source_ids'] = ' '.join(found[:6]) if found else ''
    if found and not shared:
        row['class'] = '재활용'
    else:
        row['class'] = '분리' if shared else '보완'
        if not found:
            note = '같은 칸의 다른 말투·목소리 줄을 바탕으로 이 판을 써야 함'
        # 같은 주제·칸의 줄 가운데 하나라도 걸리면 그 칸 전체를 후보로 본다
        texts = ' '.join(x[1] for b in in_cell for x in slots[b].values())
        if SEX.search(texts):
            row['class'] = '원문만'
            note = '성적인 내용 후보: Claude가 쓰지 않음, 원문만 대비(사용자 작성)'
    row['note'] = note
    return row


CLASSES = ['재활용', '분리', '보완', '신규', '원문만']
COLORS = {'재활용': '#3a7d44', '분리': '#c08a1e', '보완': '#2f6fb0', '신규': '#a23b72', '원문만': '#666'}


def summary(rows):
    s = collections.defaultdict(collections.Counter)
    for r in rows:
        s[(r['question'], r['voice'])][r['class']] += 1
    return s


def write_html(path, rows, alts):
    s = summary(rows)
    qs = [q for q in QNAME if any(r['question'] == q for r in rows)]
    tot = collections.Counter(r['class'] for r in rows)
    e = html.escape
    out = []
    out.append('<!doctype html><html lang="ko"><head><meta charset="utf-8">'
               '<meta name="viewport" content="width=device-width,initial-scale=1">'
               '<title>질문 메뉴 칸 채우기</title><style>'
               ':root{--bg:#fbfaf7;--fg:#1d1d1b;--mut:#6b6a66;--line:#e2dfd8;--card:#fff}'
               '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1b1b1a;--fg:#ecebe6;--mut:#a3a29c;--line:#3a3936;--card:#252523}}'
               ':root[data-theme="dark"]{--bg:#1b1b1a;--fg:#ecebe6;--mut:#a3a29c;--line:#3a3936;--card:#252523}'
               'body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 "Noto Sans KR",system-ui,sans-serif}'
               'main{max-width:1100px;margin:0 auto;padding:24px 16px 64px}h1{font-size:22px;margin:0 0 4px}'
               'h2{font-size:17px;margin:32px 0 8px}p,li{color:var(--mut)}.wrap{overflow-x:auto}'
               'table{border-collapse:collapse;width:100%;background:var(--card);font-size:13px}'
               'th,td{border:1px solid var(--line);padding:6px 8px;vertical-align:top;text-align:left}'
               'th{background:var(--bg)}.bar{display:flex;height:10px;border-radius:3px;overflow:hidden;min-width:90px;margin-bottom:3px}'
               '.n{font-variant-numeric:tabular-nums;color:var(--mut);font-size:12px;white-space:nowrap}'
               '.tag{display:inline-block;padding:1px 6px;border-radius:3px;color:#fff;font-size:12px}'
               '.legend span{margin-right:12px}</style></head><body><main>')
    out.append('<h1>질문 메뉴 칸 채우기</h1>')
    out.append('<p>질문 7개의 기존 대사 조각을 목소리 7개와 관계 칸으로 나눠, 칸마다 재활용·분리·보완·신규·원문만 가운데 무엇이 필요한지 셌다. '
               '기준: 말투 B안, 도도한은 도도 줄 먼저·얼음 줄 함께. 전체 행은 같은 폴더의 CSV.</p>')
    out.append('<p class="legend">' + ''.join(
        f'<span><span class="tag" style="background:{COLORS[c]}">{c}</span> {tot[c]:,}</span>' for c in CLASSES) + '</p>')
    out.append('<h2>질문 × 목소리</h2><div class="wrap"><table><tr><th>질문</th>' +
               ''.join(f'<th>{v}</th>' for v in VOICES) + '</tr>')
    for q in qs:
        out.append(f'<tr><th>{e(QNAME[q])}<br><span class="n">{q}</span></th>')
        for v in VOICES:
            c = s[(q, v)]
            n = sum(c.values()) or 1
            bar = ''.join(f'<span style="width:{c[k]*100/n:.1f}%;background:{COLORS[k]}" title="{k} {c[k]}"></span>' for k in CLASSES if c[k])
            nums = ' · '.join(f'{k[0]}{c[k]}' for k in CLASSES if c[k])
            out.append(f'<td><div class="bar">{bar}</div><span class="n">{nums}</span></td>')
        out.append('</tr>')
    out.append('</table></div><p class="n">재=재활용, 분=분리, 보=보완, 신=신규, 원=원문만</p>')
    out.append('<h2>다른 안일 때의 개수</h2><div class="wrap"><table><tr><th>안</th>' +
               ''.join(f'<th>{c}</th>' for c in CLASSES) + '</tr>')
    for label, cnt in alts:
        out.append(f'<tr><th>{e(label)}</th>' + ''.join(f'<td>{cnt[c]:,}</td>' for c in CLASSES) + '</tr>')
    out.append('</table></div>')
    out.append('<h2>질문별 대표 행</h2>')
    for q in qs:
        out.append(f'<h3>{e(QNAME[q])} ({q})</h3><div class="wrap"><table><tr><th>분류</th><th>주제·칸</th><th>목소리</th><th>말투</th><th>원문(말투 2)</th><th>메모</th></tr>')
        for c in CLASSES:
            for r in [r for r in rows if r['question'] == q and r['class'] == c][:3]:
                out.append(f'<tr><td><span class="tag" style="background:{COLORS[c]}">{c}</span></td>'
                           f'<td>{e(r["role"])}<br><span class="n">{e(r["cell"])}</span></td><td>{e(r["voice"])}</td>'
                           f'<td>{e(r["tone"])}</td><td>{e(r["original_t2"] or r["original_t3"])}</td><td>{e(r["note"])}</td></tr>')
        out.append('</table></div>')
    out.append('<h2>읽는 법과 한계</h2><ul>'
               '<li>한 행은 질문 · 주제(role) · 관계 칸 · 목소리. 관계 태그가 하나도 없는 주제는 칸이 하나(*)다.</li>'
               '<li>원문만은 키워드로 거른 후보다. 놓친 줄과 잘못 걸린 줄이 있을 수 있어 사람이 훑어야 한다.</li>'
               '<li>신규는 칸이 비었다는 뜻이지 꼭 채워야 한다는 뜻이 아니다. 관계 태그가 전혀 없는 질문(기분·조수)의 맞섬 칸은 세지 않았다.</li>'
               '<li>무너짐 칸은 기존 규칙을 그대로 두므로 세지 않았다.</li>'
               '<li>질문 메뉴가 화면에서 어떤 주제를 몇 개 조립하는지는 반영하지 않았다.</li></ul>')
    out.append('</main></body></html>')
    Path(path).write_text(''.join(out), encoding='utf-8')


def main():
    qsp = sys.argv[1] if len(sys.argv) > 1 else 'assets/runtime/2.4.1/jack.qsp'
    outdir = Path(sys.argv[2] if len(sys.argv) > 2 else 'docs/dialogue-rules/question-fill')
    outdir.mkdir(parents=True, exist_ok=True)
    F = load(qsp)
    rows = build(F, 'B', True)
    with open(outdir / 'question_fill_table.csv', 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    alts = []
    for label, plan, ice in (('B안, 얼음 줄 함께(기준)', 'B', True), ('B안, 도도 줄만', 'B', False),
                             ('A안, 얼음 줄 함께', 'A', True), ('A안, 도도 줄만', 'A', False)):
        alts.append((label, collections.Counter(r['class'] for r in build(F, plan, ice))))
    write_html(outdir / 'question_fill_table.html', rows, alts)
    print(len(rows), dict(alts[0][1]))


if __name__ == '__main__':
    main()
