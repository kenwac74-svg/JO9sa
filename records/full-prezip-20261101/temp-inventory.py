import os,json,collections
from pathlib import Path
rows=[]
for root in Path('G:/Codex/tmp').glob('full-prezip-20261101*'):
    counts=collections.Counter();size=0;unusual=[]
    for current,dirs,names in os.walk(root,followlinks=False):
        dirs[:]=[n for n in dirs if not getattr((Path(current)/n).lstat(),'st_file_attributes',0)&0x400]
        for name in names:
            p=Path(current)/name;counts[p.suffix]+=1;size+=p.stat().st_size
            if p.suffix not in {'.qsp','.sav','.json','.md','.log','.xml','.ini','.txt','.ps1','.cjs','.py'}:unusual.append(str(p))
    rows.append({'root':str(root),'files':sum(counts.values()),'bytes':size,'extensions':dict(counts),'unusual':unusual})
Path(__file__).with_name('temp-inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(rows,ensure_ascii=True))
