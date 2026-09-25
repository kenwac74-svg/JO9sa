# FIX6 manifest의 각 이미지가 jack.qsp location과 base.css 어디에서 참조되는지 표로 만드는 스크립트
# 사용법: python tools/fix6_refmap.py <jack_locs.json> <FIX6 폴더> > docs/FIX6_REFERENCE_MAP.md
import json, sys, collections
locs = json.load(open(sys.argv[1], encoding='utf-8'))
root = sys.argv[2]
manifest = json.load(open(root + '/manifest.json', encoding='utf-8-sig'))
css = open(root + '/payload/css/base.css', encoding='utf-8').read()
five = {'sjm_UI_UIadds', 'main_screen', 'slave_stat', 'city_screen', '#food_base'}
texts = [(l['name'], (l['desc'] + '\n' + l['body'] + '\n' + '\n'.join('\n'.join(a) for a in l['actions'])).replace('\\', '/').lower()) for l in locs]
texts.append(('[css/base.css]', css.replace('\\', '/').lower()))
rows, per_loc = [], collections.Counter()
for e in manifest['Files']:
    rel = e['Rel']
    if not rel.startswith('content/pic/'):
        continue
    tail = rel.lower()[len('content/pic/'):]
    hit = [n for n, t in texts if tail in t]
    per_loc.update(hit)
    rows.append((rel, hit))
print('# FIX6 이미지 참조 맵\n')
print('기준: FIX6 설치 상태 `jack.qsp` (SHA-256 `9535334…b6d9` = manifest FinalQsp), location 243개 전부, FIX6 `base.css`.')
print('검색: 경로 구분자 `\\`/`/` 정규화, 대소문자 무시, `content/pic/` 뒤 상대경로 부분 문자열 일치. 소스 참조 확인이며 실제 표시 확인이 아니다.\n')
print('## 파일별 참조\n\n| FIX6 파일 | 참조 위치 |\n|---|---|')
for rel, hit in rows:
    print(f"| `{rel}` | {', '.join(hit) if hit else '**참조 없음**'} |")
print('\n## 허용 5개 밖에서 FIX6 파일을 참조하는 곳\n\n| location | 참조 수 |\n|---|---|')
for n, c in sorted(per_loc.items()):
    if n not in five:
        print(f'| `{n}` | {c} |')
