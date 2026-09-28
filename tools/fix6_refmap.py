# FIX6 manifest의 각 이미지가 jack.qsp location과 base.css 어디에서 참조되는지 정확한 경로 일치로 표를 만드는 스크립트
# 사용법: python tools/fix6_refmap.py <jack_locs.json> <FIX6 폴더> > docs/FIX6_REFERENCE_MAP.md
import json, re, sys, collections
locs = json.load(open(sys.argv[1], encoding='utf-8'))
root = sys.argv[2]
manifest = json.load(open(root + '/manifest.json', encoding='utf-8-sig'))
css = open(root + '/payload/css/base.css', encoding='utf-8').read()
five = {'sjm_UI_UIadds', 'main_screen', 'slave_stat', 'city_screen', '#food_base'}
# 참조 형태 3가지: content\pic\경로, content\pic\<<iif(…, ''경로'', ''경로'')>>, $special_image[N] = '경로'
DIRECT = re.compile(r"content[\\/]pic[\\/]([^\"'<>()]+?\.(?:png|jpg|gif))", re.I)
IIF = re.compile(r"content[\\/]pic[\\/]<<iif\((.*?)\)>>", re.I)
INNER = re.compile(r"''([^']+?\.(?:png|jpg|gif))''", re.I)
SPECIAL = re.compile(r"\$special_image\[\d+\]\s*=\s*'([^']+?\.png)'", re.I)

def image_refs(text, with_qsp_forms=True):
    found = [m.group(1) for m in DIRECT.finditer(text)]
    if with_qsp_forms:
        for m in IIF.finditer(text):
            found += INNER.findall(m.group(1))
        found += [m.group(1) for m in SPECIAL.finditer(text)]
    return [p.replace('\\', '/').lower() for p in found]

refs = collections.defaultdict(collections.Counter)
for l in locs:
    for p in image_refs(l['body']):
        refs[p][l['name']] += 1
for p in image_refs(css, False):
    refs[p]['[css/base.css]'] += 1

rows, per_loc = [], collections.Counter()
for e in manifest['Files']:
    rel = e['Rel']
    if rel.startswith('content/pic/'):
        hit = refs.get(rel[len('content/pic/'):].lower(), {})
        per_loc.update(hit)
        rows.append((rel, hit))
print('# FIX6 이미지 참조 맵\n')
print('기준: FIX6 설치 상태 `jack.qsp` (SHA-256 `9535334…b6d9` = manifest FinalQsp), location 243개 전부, FIX6 `base.css`.')
print('검색: `content\\pic\\경로`, `content\\pic\\<<iif(…)>>` 안의 경로, `$special_image[N] = \'경로\'`를 정확한 경로로 비교(구분자·대소문자 무시). 소스 참조 확인이며 실제 표시 확인이 아니다.\n')
print('## 파일별 참조 (location: 횟수)\n\n| FIX6 파일 | 참조 위치 |\n|---|---|')
for rel, hit in rows:
    cell = ', '.join(f'{n}: {c}' for n, c in hit.items()) if hit else '**참조 없음 (예비 리소스)**'
    print(f'| `{rel}` | {cell} |')
print('\n## 허용 5개 밖에서 FIX6 파일을 참조하는 곳\n\n| location | 참조 수 |\n|---|---|')
for n, c in sorted(per_loc.items()):
    if n not in five:
        print(f'| `{n}` | {c} |')
