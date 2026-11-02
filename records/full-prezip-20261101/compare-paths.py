import json,re
from pathlib import Path
P=Path(__file__).resolve().parent
w=json.loads((P/'inventory-work.json').read_text(encoding='utf-8'))
f=json.loads((P/'inventory-full.json').read_text(encoding='utf-8'))
wk={x['path'].casefold() for x in w['files']}
extra=[x for x in f['files'] if x['path'].casefold() not in wk and x['path'].startswith(('game/content/','game/css/','game/engine/','game/fonts/','game/json/','LICENSES/'))]
(P/'full-extra-paths.json').write_text(json.dumps(extra,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
groups={}
for x in extra:
 k='/'.join(x['path'].split('/')[:4]);v=groups.setdefault(k,{'files':0,'bytes':0});v['files']+=1;v['bytes']+=x['bytes']
print(json.dumps({'extraFiles':len(extra),'extraBytes':sum(x['bytes'] for x in extra),'groups':groups},ensure_ascii=False))
