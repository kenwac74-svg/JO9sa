import hashlib
import json
from pathlib import Path
import posixpath
import xml.etree.ElementTree as ET
import zipfile

source = Path('G:/somi/JO9_editor/tools/jo9-history-lab/presets/JO9_Origin_Personality_Presets_20261111.xlsx')
ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
sheets = {}
with zipfile.ZipFile(source) as archive:
    shared = []
    if 'xl/sharedStrings.xml' in archive.namelist():
        shared = [''.join(x.itertext()) for x in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('s:si', ns)]
    rels = {x.attrib['Id']: x.attrib['Target'] for x in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
    for sheet in ET.fromstring(archive.read('xl/workbook.xml')).find('s:sheets', ns):
        target = rels[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
        path = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
        cells = {}
        for cell in ET.fromstring(archive.read(path)).findall('.//s:sheetData/s:row/s:c', ns):
            value = cell.find('s:v', ns)
            inline = cell.find('s:is', ns)
            text = ''.join(inline.itertext()) if inline is not None else (value.text if value is not None else '')
            if cell.attrib.get('t') == 's':
                text = shared[int(text)]
            if text:
                cells[cell.attrib['r']] = text
        sheets[sheet.attrib['name']] = cells

origin = sheets['출신보정']
rows = []
for row in range(8, 65):
    r = {'row': row, 'id': origin[f'R{row}'], 'label': origin[f'A{row}'], 'group': origin[f'W{row}']}
    for col, key in [('X', 'egoUp'), ('Y', 'egoDown'), ('Z', 'prideUp'), ('AA', 'prideDown'), ('AB', 'sensitivityUp')]:
        r[key] = round(float(origin.get(f'{col}{row}', 0)) * 100)
    r['stylishDelta'] = int(float(origin.get(f'AC{row}', 0)))
    r['stylishChance'] = round(float(origin.get(f'AD{row}', 0)) * 100)
    rows.append(r)

result = {'source': str(source), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'rows': rows,
          'currentRules': {k: v for k, v in sheets['항목설명'].items() if int(''.join(filter(str.isdigit, k))) >= 59},
          'occupationNotes': {k: v for k, v in sheets['직업기획'].items() if int(''.join(filter(str.isdigit, k))) >= 75}}
Path(__file__).with_name('workbook-active.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'origins': len(rows), 'groups': len(set(x['group'] for x in rows)), 'sha256': result['sha256']}))
