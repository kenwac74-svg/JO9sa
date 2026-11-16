"""Combine the existing player notes and hints without changing game/image assets."""
import pathlib,re,json,base64,hashlib,html
from html.parser import HTMLParser
R=pathlib.Path('G:/somi/JO9sa');P=R/'docs/release/2.4.2-player-20261113';OUT=pathlib.Path('G:/somi/JO9_2.4.2_Full_20261113');D=R/'records/single-release-notes-20261114'
source=(P/'RELEASE_NOTES_KO.html').read_text('utf-8');guide=(P/'UPDATE_GUIDE_KO.html').read_text('utf-8')
guides={m[1]:m[3] for m in re.finditer(r'<section id="([^"]+)"><h2>(.*?)</h2>(.*?)(?:<a href="RELEASE_NOTES_KO.html#[^"]+">.*?</a>)</section>',guide,re.S)}
used=[]
def expand(m):
 target=m[1];assert target in guides,target;used.append(target)
 title=m[2];teaser=m[3].replace('　↗','').replace('↗','').strip()
 return f'<li><details id="{target}"><summary><strong>{title}</strong><small>{teaser}</small></summary><div class="explanation">{guides[target]}</div></details></li>'
body,n=re.subn(r'<li><a href="UPDATE_GUIDE_KO.html#([^"]+)"><strong>(.*?)</strong><small>(.*?)</small></a></li>',expand,source,flags=re.S)
assert n==44,(n,len(guides))
extras={k:v for k,v in guides.items() if k not in used}
def portrait(m):
 target=m[1];assert target in extras,target
 return f'<details class="portrait" id="{target}"><summary>{m[2]}</summary><div class="portrait-info">{extras[target]}</div></details>'
body,cards=re.subn(r'<a class="portrait" href="UPDATE_GUIDE_KO.html#([^"]+)">(.*?)</a>',portrait,body,flags=re.S)
assert cards==53 and len(extras)==53
body=re.sub(r'href="UPDATE_GUIDE_KO.html#([^"]+)"',r'href="#\1"',body)
categories=re.findall(r'<h2 id="([^"]+)">(.*?)</h2>',body);assert len(categories)==8
nav='<nav aria-label="업데이트 분류">'+''.join(f'<a href="#{i}">{t}</a>' for i,t in categories)+'</nav>'
body=body.replace('<p>궁금한 항목을 누르면 이번 업데이트의 이야기를 조금 더 읽을 수 있습니다.</p>','<p>궁금한 항목을 누르면 바로 아래에 설명이 펼쳐집니다.</p>'+nav+'<div class="controls"><button type="button" id="expand-all">모두 펼치기</button><button type="button" id="collapse-all">모두 접기</button></div>')
body=body.replace('<footer>2.4.2 한국어판 Full · 설치와 저장 이어하기는 함께 제공된 안내를 확인해 주세요.</footer>','''<section id="install"><h2>설치와 기존 세이브로 이어하기</h2><p>2.4.2 풀버전은 새 빈 폴더에 압축을 풀고 <strong>Jack-o-nine-tails.exe</strong>로 실행해 주세요. 이전 패치를 별도로 덮어쓸 필요가 없습니다.</p><p>2.4.1에서 전투를 끝내고 일반 화면에서 저장한 SAV를 새 폴더의 <strong>game/save</strong>에 복사한 뒤 <strong>Game → Load</strong>로 불러오세요. 필요한 보정은 자동으로 적용되며 별도 호환기는 필요하지 않습니다. 원래 세이브는 보관하고, 불러온 뒤 새 이름으로 저장해 주세요.</p></section><footer>Jack-o-nine-tails 2.4.2 한국어판 Full · 이 HTML은 인터넷 연결이나 별도 이미지 폴더 없이 열 수 있습니다.</footer>''')
extra='''nav{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}nav a{border:1px solid #d6c5a6;border-radius:18px;padding:5px 12px;font-size:14px}.controls{display:flex;gap:8px;margin-bottom:16px}button{border:1px solid #bca47f;background:#fbf5e9;color:#61451f;padding:8px 14px;cursor:pointer;font:inherit;font-size:14px;border-radius:5px}.notes details{border:1px solid #e3d7c1;border-radius:5px;scroll-margin-top:20px}.notes summary{cursor:pointer;display:block;padding:16px 20px;position:relative;padding-right:42px}.notes summary:after{content:'＋';position:absolute;right:16px;top:18px;color:#967747}.notes details[open] summary:after{content:'−'}.notes summary:hover{background:#f8f1e4}.notes summary:focus-visible,button:focus-visible,nav a:focus-visible{outline:3px solid #9c722c;outline-offset:3px}.notes details[open] summary{background:#f8f1e4;border-bottom:1px solid #e3d7c1}.explanation{padding:2px 20px 12px}.explanation p{margin:14px 0}.portrait img{max-width:100%}@media print{body{background:white}main{max-width:none;margin:0;padding:0}nav,.controls{display:none}.notes details{break-inside:avoid}.gallery{grid-template-columns:repeat(6,minmax(0,1fr))}a{color:inherit}h2{break-after:avoid}}'''
extra+='''.gallery details.portrait{display:block;min-width:0}.gallery .portrait summary{display:flex;flex-direction:column;align-items:center;cursor:pointer;list-style:none}.gallery .portrait summary::-webkit-details-marker{display:none}.portrait-info{font-size:12px;text-align:left;line-height:1.7;padding:8px 4px}.portrait-info p{margin:5px 0}.gallery .portrait summary:focus-visible{outline:3px solid #9c722c;outline-offset:3px}'''
body=body.replace('</style>',extra+'</style>')
script='''<script>(()=>{const rows=[...document.querySelectorAll('details')];document.getElementById('expand-all').addEventListener('click',()=>rows.forEach(x=>x.open=true));document.getElementById('collapse-all').addEventListener('click',()=>rows.forEach(x=>x.open=false));function reveal(){const el=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(el&&el.tagName==='DETAILS')el.open=true;}addEventListener('hashchange',reveal);reveal();let previous=[];addEventListener('beforeprint',()=>{previous=rows.map(x=>x.open);rows.forEach(x=>x.open=true)});addEventListener('afterprint',()=>rows.forEach((x,i)=>x.open=previous[i]));})();</script>'''
body=body.replace('</body>',script+'</body>')
class Check(HTMLParser):
 def __init__(self):super().__init__();self.ids=[];self.links=[];self.images=[];self.details=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='a':self.links.append(a.get('href',''))
  if tag=='img':self.images.append(a.get('src',''))
  if tag=='details':self.details+=1
old=Check();old.feed(source);new=Check();new.feed(body)
assert new.images==old.images and len(new.images)==53,'Portrait bytes or count changed'
assert len(new.ids)==len(set(new.ids))
assert all(x.startswith('#') and x[1:] in new.ids for x in new.links),new.links
assert new.details==97
for s in new.images:
 assert s.startswith('data:image/png;base64,');assert base64.b64decode(s.split(',',1)[1],validate=True).startswith(b'\x89PNG\r\n\x1a\n')
assert 'CHANGE_DETAILS_KO' not in body and 'UPDATE_GUIDE_KO.html' not in body
name='JO9_2.4.2_RELEASE_NOTES_KO.html';D.mkdir(parents=True,exist_ok=True)
for dest in [P/name,OUT/name]:dest.write_text(body,'utf-8')
result={'details':44,'categories':8,'portraits':53,'samePortraitBytes':True,'externalImages':0,'externalPageLinks':0,'bytes':len(body.encode()),'sha256':hashlib.sha256(body.encode()).hexdigest(),'output':str(OUT/name),'gameAssetsChanged':False,'zipChanged':False}
(D/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),'utf-8')
(D/'build.py').write_text(pathlib.Path(__file__).read_text('utf-8'),'utf-8')
print(json.dumps(result,ensure_ascii=False))
