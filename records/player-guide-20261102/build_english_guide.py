from pathlib import Path
from html.parser import HTMLParser
from html import escape
import json,re,hashlib,sys
sys.stdout.reconfigure(encoding='utf8')
O=Path(__file__).parent
rows=json.loads((O/'translation-segments.json').read_text(encoding='utf8'))
translations={}
for file in ['translation-main-en.json','translation-auto-en.json','translation-other-en.json']:
 translations.update(json.loads((O/file).read_text(encoding='utf8')))
assert set(translations)=={str(x['id']) for x in rows},'Missing or extra segments'
translations['0']="Jack-O'-Nine-Tails 2.4.1 — What's Changed Since 2.3"
translations['1']='2.4.1 Integrated Edition'
lookup={x['ko']:translations[str(x['id'])] for x in rows}
lookup.update({'그림 확대':'Enlarged image','문서 목차':'Contents','동료 선출전 흐름':'Companion-first combat flow','기타 변경 전체 펼치기':'Expand all other changes','기타 변경 전체 접기':'Collapse all other changes'})
def translate(s):
 if not re.search('[가-힣]',s):return s
 if s in lookup:return lookup[s]
 if s.endswith(' 크게 보기'):return 'Enlarge: '+translate(s[:-6])
 if s.startswith('UI, 이미지 리마스터, 동료 전투,'):
  return 'UI, remastered artwork, companion combat, traits, dialogue, management, and post-match scenes: the cumulative changes in versions 2.4–2.4.1 compared with 2.3.'
 raise ValueError('Untranslated visible string: '+s[:120])
class English(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=False);self.out=[];self.raw=None
 def handle_decl(self,s):self.out.append('<!'+s+'>')
 def handle_starttag(self,tag,attrs):
  raw=self.get_starttag_text()
  if tag in ('style','script'):self.raw=tag
  if tag=='html':raw=raw.replace('lang="ko"','lang="en"')
  def attr(m):return m[1]+'="'+escape(translate(m[2]),quote=True)+'"'
  raw=re.sub(r'\b(alt|aria-label|title|content)="([^"]*)"',attr,raw)
  self.out.append(raw)
 def handle_endtag(self,tag):
  if tag=='style':
   self.out.append("html[lang=en] body{font-family:Arial,'Segoe UI',sans-serif;word-break:normal;line-height:1.75}html[lang=en] h1,html[lang=en] h2,html[lang=en] h3{letter-spacing:-.025em}html[lang=en] .nav .wrap{gap:23px}html[lang=en] .nav a{font-size:12px}html[lang=en] .masthead{letter-spacing:.08em}html[lang=en] .chapter h2{font-size:32px}html[lang=en] .flow b{line-height:1.4}")
  self.out.append('</'+tag+'>')
  if tag==self.raw:self.raw=None
 def handle_startendtag(self,tag,attrs):self.handle_starttag(tag,attrs)
 def handle_entityref(self,x):self.out.append('&'+x+';')
 def handle_charref(self,x):self.out.append('&#'+x+';')
 def handle_comment(self,x):self.out.append('<!--'+x+'-->')
 def handle_data(self,s):
  if self.raw=='style':self.out.append(s)
  elif self.raw=='script':
   for ko,en in [('기타 변경 전체 펼치기','Expand all other changes'),('기타 변경 전체 접기','Collapse all other changes')]:s=s.replace(ko,en)
   self.out.append(s)
  elif s.strip() and re.search('[가-힣]',s):self.out.append(s.replace(s.strip(),escape(translate(s.strip()),quote=False)))
  else:self.out.append(s)
p=English();p.feed((O/'JO9_2.4.1_업데이트안내.html').read_text(encoding='utf8'));html=''.join(p.out)
target=O/'JO9_2.4.1_Update_Guide_EN.html';target.write_text(html,encoding='utf8')
assert len(re.findall('<img ',html))==18 # 17 illustrations/screens plus the initially empty enlargement dialog.
result={'file':str(target),'bytes':target.stat().st_size,'translatedSegments':len(rows),'embeddedImages':17,'otherGroups':html.count('<details>'),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sameImageDataAsKorean':re.findall('data:image/webp;base64,[^\"]+',html)==re.findall('data:image/webp;base64,[^\"]+',(O/'JO9_2.4.1_업데이트안내.html').read_text(encoding='utf8'))}
assert result['sameImageDataAsKorean']
(O/'english-build-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result))
