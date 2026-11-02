from pathlib import Path
from html.parser import HTMLParser
import json, re, hashlib, sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parent
checks=0
def check(value,label):
 global checks
 checks+=1
 if not value: raise AssertionError(label)

class Page(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=True);self.text=[];self.ignored=0;self.links=[];self.images=[];self.lang=None
 def handle_starttag(self,tag,attrs):
  at=dict(attrs)
  if tag in ['style','script']:self.ignored+=1
  if tag=='html':self.lang=at.get('lang')
  if tag=='img':self.images.append(at)
  if tag=='a':self.links.append(at.get('href',''))
 def handle_endtag(self,tag):
  if tag in ['style','script']:self.ignored-=1
 def handle_data(self,data):
  if not self.ignored:self.text.append(data)

def fields(data):
 for f in data['features241']:
  yield f['title'];yield f['body']
  yield from f.get('items',[])
 yield from data['followups241']
 for section in ['groups240','fixes']:
  for group in data[section]:yield group['title'];yield from group['items']
 yield from data['other']

reports=[]
for locale,name in [('KO','JO9_2.4.1_업데이트안내.html'),('EN','JO9_2.4.1_Update_Guide_EN.html')]:
 d=json.loads((ROOT/('content.json' if locale=='KO' else 'content.en.json')).read_text(encoding='utf-8'))
 html=(ROOT/name).read_text(encoding='utf-8');post=ROOT/f'JO9_2.4.1_Forum_{locale}.txt'
 raw=post.read_bytes();text=raw.decode('utf-8-sig');p=Page();p.feed(html)
 check(p.lang==locale.lower(),'Document language '+locale)
 check(len(p.images)==3,'Three images '+locale)
 check(all(x.get('src','').startswith('data:image/webp;base64,') for x in p.images),'Images embedded '+locale)
 check(all(x.startswith('#') for x in p.links),'Only internal links '+locale)
 check(raw.startswith(b'\xef\xbb\xbf'),'Windows-friendly UTF-8 BOM '+locale)
 check(not re.search(rb'(?<!\r)\n',raw),'Consistent CRLF '+locale)
 check(not re.search(r'<[A-Za-z!/][^>]*>|data:image|file:///|127\.0\.0\.1|[CG]:[\\/]',text),'Plain forum text without markup or local paths '+locale)
 for item in fields(d):
  check(item in text,'Forum text includes '+locale+' '+item[:65])
  check(item in ''.join(p.text),'HTML includes '+locale+' '+item[:65])
  check(text.count(item)==1,'No duplicated forum entry '+locale+' '+item[:65])
 check(text.index(d['other'][0])>text.index('[3. OTHER CHANGES]' if locale=='EN' else '[3. 그외 변경]'),'In-development stock stays in other changes '+locale)
 check('in development' in d['other'][0] if locale=='EN' else '개발 중' in d['other'][0],'Development label retained '+locale)
 if locale=='EN':
  check(not re.search('[가-힣]',''.join(p.text).replace('콤콤삼촌','')),'No untranslated visible Korean except original credit handle')
  check('English guide to the Korean mod' in ''.join(p.text),'Does not claim an English game client')
  check('when their turn begins' not in text,'Equipment selection is not presented as per-turn')
 reports.append({'locale':locale,'fields':len(list(fields(d))),'forum_bytes':len(raw),'html_bytes':(ROOT/name).stat().st_size,'forum_sha256':hashlib.sha256(raw).hexdigest()})

old=json.loads((ROOT/'DELIVERY.json').read_text(encoding='utf-8'))
check(hashlib.sha256((ROOT/'JO9_2.4.1_업데이트안내.html').read_bytes()).hexdigest()==old['sha256'],'Existing Korean HTML preserved')
en=json.loads((ROOT/'content.en.json').read_text(encoding='utf-8'));ko=json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
for section in ['features241','followups241','groups240','fixes','other']:
 check(len(ko[section])==len(en[section]),'Language section parity '+section)
for section in ['groups240','fixes']:
 for a,b in zip(ko[section],en[section]):check(len(a['items'])==len(b['items']),'Language item parity '+a['title'])
result={'pass':True,'checks':checks,'languages':reports,'existing_korean_html_unchanged':True,'source_counts':{'highlights':5,'followups':2,'cumulative_groups':7,'cumulative_items':48,'bugfix_items':36,'other_items':11}}
(ROOT/'verification-bilingual.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False))
