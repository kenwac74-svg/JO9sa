exec(open('artifacts/attribute-defaults-20261115/audit.py',encoding='utf8').read().split('for n in q.index:')[0])
import re
if sys.argv[1]=='difficulty':
 for n in q.index:
  if n.startswith('#txt'):continue
  lines=q.body(n).splitlines()
  for i,l in enumerate(lines):
   if '$set_obedience_difficulty = {' in l:
    print(n,i+1);print('\n'.join(lines[i:i+80]))
elif sys.argv[1]=='traits':
 for n in ['#static_base','jo9_traits','jo9_traits_personality']:
  if n not in q.index:continue
  a=q.body(n).splitlines(); hits=[l for l in a if 'dyneval($vb_cycle' in l or 'color:' in l or 'color=' in l]
  print(n,'colored lines',len(hits));print('\n'.join(hits[:8]))
elif sys.argv[1]=='data':
 import json
 p=Path('G:/somi/Jack O Nine Tails v2.4_work/game/json/slaves/2571_isabella.json');d=json.loads(p.read_text('utf8-sig'))
 print({k:v for k,v in d.items() if any(x in k for x in ['style','fame','grace','mood','angst','moral','custom','rational','instinct','psy','meekness','courage'])})
