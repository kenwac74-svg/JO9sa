# 인터뷰 DB 각색 문장을 엑셀(.xlsx)로 내보내고 고쳐 온 파일을 검사해 adapt-user.json에 반영하는 모듈(외부 라이브러리 없이 zip·xml만 사용)
import base64
import io
import json
import os
import re
import zipfile
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape

import studio_interview as si

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
FIXED = ['키', '주제', '대답 원문(수정 금지)']
MAX_TEXT = 2000


def _col(i):
    s = ''
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def _headers():
    m = si.meta()
    return FIXED + [f'{w} · {m["worldLabels"][w]}' for w in m['worlds']], m['worlds']


def _sheet_xml(rows, widths):
    out = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
           '<sheetViews><sheetView workbookViewId="0"><pane xSplit="2" ySplit="1" topLeftCell="C2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>',
           '<cols>' + ''.join(f'<col min="{i + 1}" max="{i + 1}" width="{w}" customWidth="1"/>' for i, w in enumerate(widths)) + '</cols><sheetData>']
    for r, row in enumerate(rows, 1):
        out.append(f'<row r="{r}">')
        for c, v in enumerate(row):
            if v != '':
                # 문자열로만 저장하므로 = + - @ 로 시작해도 수식으로 실행되지 않는다
                out.append(f'<c r="{_col(c)}{r}" t="inlineStr"><is><t xml:space="preserve">{escape(str(v))}</t></is></c>')
        out.append('</row>')
    out.append('</sheetData></worksheet>')
    return ''.join(out)


def export_xlsx():
    """표시 가능한 대답(청소년기·수간 등 표시불가는 제외)과 사용자가 쓴 세계별 각색 문장을 한 시트에 담는다."""
    head, worlds = _headers()
    db, user = si._load('interview-db.json'), si._user_text()
    rows = [head]
    for r in db['rows']:
        if not r['display']:
            continue
        u = user.get(r['id'], {})
        rows.append([r['id'], r['topic'], r['answer']] + [u.get(w, '') for w in worlds])
    files = {
        '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="각색" sheetId="1" r:id="rId1"/></sheets></workbook>',
        'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        'xl/worksheets/sheet1.xml': _sheet_xml(rows, [14, 14, 60] + [34] * len(worlds)),
    }
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in files.items():
            z.writestr(name, data)
    return buf.getvalue(), len(rows) - 1


def read_xlsx(data):
    """첫 시트를 행 목록(문자열 리스트)으로 읽는다. 공유 문자열·inlineStr 모두 지원."""
    try:
        z = zipfile.ZipFile(io.BytesIO(data))
    except zipfile.BadZipFile:
        raise ValueError('엑셀(.xlsx) 파일이 아닙니다.')
    names = z.namelist()
    shared = []
    if 'xl/sharedStrings.xml' in names:
        for si_ in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS):
            shared.append(''.join(t.text or '' for t in si_.iter('{%s}t' % NS['m'])))
    sheet = next((n for n in sorted(names) if re.fullmatch(r'xl/worksheets/sheet\d+\.xml', n)), None)
    if not sheet:
        raise ValueError('시트를 찾지 못했습니다.')
    rows = []
    for row in ET.fromstring(z.read(sheet)).iter('{%s}row' % NS['m']):
        cells = {}
        for c in row.findall('m:c', NS):
            ref = re.match(r'([A-Z]+)', c.get('r', ''))
            if not ref:
                continue
            idx = 0
            for ch in ref.group(1):
                idx = idx * 26 + ord(ch) - 64
            t = c.get('t')
            if t == 's':
                v = shared[int(c.findtext('m:v', '0', NS))]
            elif t == 'inlineStr':
                v = ''.join(x.text or '' for x in c.iter('{%s}t' % NS['m']))
            else:
                v = c.findtext('m:v', '', NS)
            cells[idx - 1] = v
        n = max(cells) + 1 if cells else 0
        rows.append([cells.get(i, '') for i in range(n)])
    return rows


def check_import(b64, apply=False):
    """고쳐 온 엑셀을 검사한다. 형식 오류·표시불가 칸·원문 열 변경은 반영하지 않고 목록으로 돌려준다. apply가 참이면 문제 없는 변경만 저장."""
    rows = read_xlsx(base64.b64decode(b64))
    head, worlds = _headers()
    if not rows or rows[0][:len(head)] != head:
        raise ValueError('첫 줄(머리글)이 내보낸 파일과 다릅니다. 머리글을 바꾸지 말고 내보낸 파일을 고쳐 쓰세요.')
    idx = si._index()['rows']
    user = si._user_text()
    changes, problems, seen = [], [], set()
    for n, row in enumerate(rows[1:], 2):
        row = row + [''] * (len(head) - len(row))
        key = row[0].strip()
        if not key:
            continue
        r = idx.get(key)
        if r is None:
            problems.append({'row': n, 'key': key, 'why': '없는 키'}); continue
        if key in seen:
            problems.append({'row': n, 'key': key, 'why': '같은 키가 두 번 나옴(앞의 줄만 반영)'}); continue
        seen.add(key)
        if not r['display']:
            problems.append({'row': n, 'key': key, 'why': '표시불가 칸이라 반영하지 않음'}); continue
        if row[2] != r['answer']:
            problems.append({'row': n, 'key': key, 'why': '대답 원문 열이 바뀌어 원문은 무시함(각색 열은 반영)'})
        for w, text in zip(worlds, row[3:3 + len(worlds)]):
            text = text.strip()
            old = user.get(key, {}).get(w, '')
            if text == old:
                continue
            if len(text) > MAX_TEXT:
                problems.append({'row': n, 'key': key, 'why': f'{w} 문장이 {MAX_TEXT}자를 넘어 반영하지 않음'}); continue
            changes.append({'key': key, 'world': w, 'old': old, 'new': text, 'kind': 'delete' if not text else 'add' if not old else 'edit'})
    if apply and changes:
        path = si.db_dir() / 'adapt-user.json'
        data = json.loads(path.read_text(encoding='utf-8'))
        entries = data.setdefault('entries', {})
        for c in changes:
            if c['new']:
                entries.setdefault(c['key'], {})[c['world']] = c['new']
            else:
                entries.get(c['key'], {}).pop(c['world'], None)
                if c['key'] in entries and not entries[c['key']]:
                    del entries[c['key']]
        tmp = path.with_suffix('.json.tmp')
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        os.replace(tmp, path)
    count = {k: sum(1 for c in changes if c['kind'] == k) for k in ('add', 'edit', 'delete')}
    return {'applied': bool(apply and changes), 'count': count, 'changes': changes[:200], 'problems': problems[:200], 'problemTotal': len(problems)}


def export_payload():
    data, n = export_xlsx()
    return {'name': 'JO9_interview_adapt.xlsx', 'rows': n, 'data': base64.b64encode(data).decode('ascii')}
