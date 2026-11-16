exec(open('artifacts/attribute-defaults-20261115/audit.py',encoding='utf8').read().split('for n in q.index:')[0])
import re
for n in ['#static_base','$newloc','$slave_price','slave_stat']:
 if n not in q.index:continue
 for i,l in enumerate(q.body(n).splitlines(),1):
  if re.search(r'\bslave_obedience_(?:bonus|penalty)\s*=|master_supermacy|slave_mood_bonus\s*=|slave_fear_bonus\s*=',l):print(n,i,l[:350])
