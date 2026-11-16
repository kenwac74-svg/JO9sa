import json
import sys
from pathlib import Path
from html.parser import HTMLParser

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.current = {'href': dict(attrs).get('href', ''), 'text': ''}

    def handle_data(self, data):
        if self.current is not None:
            self.current['text'] += data

    def handle_endtag(self, tag):
        if tag == 'a' and self.current is not None:
            self.links.append(self.current)
            self.current = None

record = Path('G:/somi/JO9sa/records/chunhyang-menu-links-20261112')
variant = sys.argv[1]
keys = {'춘향과 클럽에 대해 이야기한다': 'about', '춘향에게 결투를 신청한다': 'duel',
        '공급 조건을 묻는다': 'pref', '노예를 싸움에 내보낸다': 'style',
        '노예를 제안한다': 'supply', '클럽을 떠난다': 'leave', '시합을 본다': 'watch',
        '약속대로 춘향을 영입한다': 'claim', '춘향 영입 약속을 마무리한다': 'enter'}
result = {}
for page in ['open', 'city', 'claim']:
    parser = Links()
    parser.feed((record / f'{variant}-{page}.html').read_text(encoding='utf8'))
    result[page] = []
    for link in parser.links:
        if link['text'] in keys:
            link['key'] = keys[link['text']]
            result[page].append(link)
(record / f'{variant}-links.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf8')
print(json.dumps(result, ensure_ascii=True))
