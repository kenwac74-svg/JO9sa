exec(open('artifacts/attribute-defaults-20261115/audit.py',encoding='utf8').read().split('for n in q.index:')[0])
import re
wanted=['워커홀릭','끈기','거센 반항심','건강체질','애널섹스 중독','펠라 중독','너그러움','산만함','야심가','옹졸함','반사적 구역질','선천적 벙어리','무기력함','통증내성']
for n in q.index:
 if n.startswith('#txt'):continue
 lines=q.body(n).splitlines()
 for i,l in enumerate(lines):
  if len(l)>700:continue
  if any(s.replace(' ','') in l.replace(' ','') for s in wanted) and (n.startswith('jo9_') or n in ['#static_base','#variative']):print(n,i+1,l[:600])
