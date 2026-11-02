"""Stage URI-only review link changes; never write the original review files."""
from pathlib import Path
from urllib.parse import unquote,urlsplit
from html.parser import HTMLParser
import json,re,hashlib,copy,html

ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
DEST=Path('G:/somi/JO9resource/mob_body');MAN=json.loads((DEST/'SOURCE_MANIFEST_20261029.json').read_text(encoding='utf-8-sig'))
STAGE=HERE/'metadata-staging/review-ui';DEC=json.JSONDecoder()
def norm(p):return str(p).replace('\\','/').lower()
def sha(b):return hashlib.sha256(b).hexdigest()
lookup={norm(s['path']):dict(source=s,destination=e['destination'],sha256=e['destinationSha256']) for e in MAN['entries'] for s in e['sources'] if not norm(s['path']).startswith(('g:/somi/jo9o/','g:/somi/jack o nine tails v2.4_work/'))}
assert len(lookup)==174
for r in lookup.values():assert r['source']['sha256']==r['sha256']
def resolve(base,val):
    v=unquote(val)
    if v.startswith('file:'):v=urlsplit(v).path.lstrip('/')
    elif not re.match(r'^[a-zA-Z]:[\\/]',v):v=str((base/v).resolve())
    return norm(v)
def spaced(s,i):
    while i<len(s) and s[i].isspace():i+=1
    return i
def tokens(s,start=0):
    result=[]
    def value(i,path):
        i=spaced(s,i);ch=s[i]
        if ch=='{':
            i=spaced(s,i+1)
            while s[i]!='}':
                key,end=DEC.raw_decode(s,i);assert isinstance(key,str);i=spaced(s,end);assert s[i]==':'
                i=spaced(s,value(i+1,path+(key,)))
                if s[i]==',':i=spaced(s,i+1)
                else:assert s[i]=='}'
            return i+1
        if ch=='[':
            i=spaced(s,i+1);ix=0
            while s[i]!=']':
                i=spaced(s,value(i,path+(ix,)));ix+=1
                if s[i]==',':i=spaced(s,i+1)
                else:assert s[i]==']'
            return i+1
        v,end=DEC.raw_decode(s,i)
        if isinstance(v,str):result.append((path,i,end,v))
        return end
    value(start,());return result
def active(path):return len(path)>=3 and path[0]=='entries' and isinstance(path[1],int) and path[2] in ['file','reference']
def patch(s,reps):
    for r in sorted(reps,key=lambda r:r['start'],reverse=True):s=s[:r['start']]+r['token']+s[r['end']:]
    return s
def setpath(obj,path,value):
    for k in path[:-1]:obj=obj[k]
    obj[path[-1]]=value
def jsonstage(p):
    raw=p.read_bytes();s=raw.decode('utf-8');start=s.index('{');before,_=DEC.raw_decode(s,start);expected=copy.deepcopy(before);reps=[]
    for path,a,b,old in tokens(s,start):
        if not active(path):continue
        r=lookup.get(resolve(p.parent,old))
        if not r:continue
        new=Path(r['destination']).as_uri();reps.append(dict(start=a,end=b,token=json.dumps(new,ensure_ascii=False),old=old,new=new,jsonPath=list(path),sourcePath=r['source']['path'],sha256=r['sha256']))
        setpath(expected,path,new)
    after=patch(s,reps);actual,_=DEC.raw_decode(after,after.index('{'));assert actual==expected
    for path,_,_,v in tokens(after,after.index('{')):
        if active(path):assert resolve(p.parent,v) not in lookup
    return raw,after.encode('utf-8'),reps
ATTR=re.compile(r'\b(src|href)\s*=\s*([\"\'])(.*?)\2',re.I)
def htmlstage(p):
    raw=p.read_bytes();s=raw.decode('utf-8');reps=[]
    for match in ATTR.finditer(s):
        old=html.unescape(match[3]);r=lookup.get(resolve(p.parent,old))
        if not r:continue
        new=Path(r['destination']).as_uri();reps.append(dict(start=match.start(3),end=match.end(3),token=html.escape(new,quote=True),old=old,new=new,attribute=match[1],sourcePath=r['source']['path'],sha256=r['sha256']))
    after=patch(s,reps)
    for match in ATTR.finditer(after):assert resolve(p.parent,html.unescape(match[3])) not in lookup
    return raw,after.encode('utf-8'),reps
specs=[('output/battle-mob-review-20261027/manifest.js','json',62),('output/battle-mob-review-20261027/manifest.json','json',62),('output/mob-corrections-20261029/review.html','html',13),('output/mob-background-composites-20261029/index.html','html',65)]
plan=[]
for rel,kind,count in specs:
    p=ROOT/rel;before,after,reps=(jsonstage if kind=='json' else htmlstage)(p);assert len(reps)==count,(rel,len(reps),count)
    target=STAGE/Path(rel).relative_to('output');target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists():assert target.read_bytes()==after,'Existing stage changed'
    else:target.write_bytes(after)
    assert p.read_bytes()==before,'Original changed during staging'
    for r in reps:
        destination=lookup[norm(r['sourcePath'])]['destination'];assert sha(Path(destination).read_bytes())==r['sha256']
    plan.append(dict(path=str(p),beforeSHA=sha(before),afterSHA=sha(after),stagedPath=str(target),replacementCount=len(reps),replacements=[{k:v for k,v in r.items() if k not in ['start','end','token']} for r in reps]))
(HERE/'review-link-changes.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(status='STAGED_NOT_APPLIED',files=len(plan),replacements=sum(p['replacementCount'] for p in plan),originalsUnchanged=True,newFunctions=0),ensure_ascii=False))
